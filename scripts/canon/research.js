#!/usr/bin/env node
"use strict";
/**
 * scripts/canon/research.js — the CAPPED research layer for the canon engine
 * (SP-20260525-022 T4 / T-20260525-232).
 *
 * The cap (β Q4, conf 0.83) lives in schemas/canon/research-fields.schema.json:
 * the engine may fill ONLY the named fields enumerated there, per canonical doc —
 * never open-ended discovery. This module is the deterministic half of that
 * contract:
 *
 *   1. buildResearchQuerySet — turn the thin docs into a BOUNDED set of named
 *      research questions (one per the doc's x-fields), capped at
 *      research_cap.max_queries.
 *   2. validateFindings — check a research response against the cap schema:
 *      reject docs not in per_doc, reject fields not in a doc's x-fields
 *      (additionalProperties:false is the bound — extras are discarded, never
 *      silently merged), and treat a finding with EMPTY sources[] as THIN
 *      (a WARNING, never a silent pass — β's before_execute directive).
 *   3. mergeFindings — weave validated, *sourced* findings into the thin docs as
 *      a clearly-marked "Research Signals (non-canonical — cited)" block. The
 *      x-fields are supplementary category signal, NOT canonical template tokens,
 *      so they are appended-with-citations, never used to fabricate canon.
 *
 * The LIVE invocation (research:simple/deep) is the orchestrator's job
 * (bootstrap:spinup's canon phase): a node engine cannot invoke a skill, and the
 * dispatch-route-guard refuses raw codex/gemini/claude calls. So generate.js
 * emits the query set; the orchestrator runs research against it and hands back a
 * findings file; this module validates + merges it. Deterministic, testable,
 * guard-respecting.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCHEMA_PATH = path.join(
  REPO_ROOT,
  "schemas",
  "canon",
  "research-fields.schema.json",
);

// Default caps if the schema omits research_cap (schema defaults are advisory;
// draft-07 does not apply them, so we mirror them here).
const DEFAULT_MAX_QUERIES = 6;
const DEFAULT_BACKEND = "simple";

function loadCapSchema(schemaPath = SCHEMA_PATH) {
  if (!fs.existsSync(schemaPath))
    throw new Error(`canon research cap schema missing at ${schemaPath}`);
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const perDoc = (schema.properties && schema.properties.per_doc &&
    schema.properties.per_doc.properties) || {};
  // doc -> [allowed x-field names]
  const fieldsByDoc = {};
  for (const [doc, def] of Object.entries(perDoc)) {
    fieldsByDoc[doc] = Array.isArray(def["x-fields"]) ? def["x-fields"] : [];
  }
  const capProps =
    (schema.properties && schema.properties.research_cap &&
      schema.properties.research_cap.properties) || {};
  const cap = {
    max_queries:
      (capProps.max_queries && capProps.max_queries.default) ||
      DEFAULT_MAX_QUERIES,
    backend:
      (capProps.backend && capProps.backend.default) || DEFAULT_BACKEND,
  };
  return { schema, fieldsByDoc, cap, allowedDocs: Object.keys(fieldsByDoc) };
}

// Humanize an x-field id into a research question fragment. Generic + category
// oriented — the engine is product-agnostic (lives in canonical), so questions
// ask about the product's *category*, not the product itself.
function fieldToQuestion(field, product) {
  const subject = product ? `the product "${product}"` : "this product";
  const human = field.replace(/_/g, " ");
  return (
    `For ${subject} and its product category: ${human}? ` +
    `Answer in 1-3 sentences and cite real sources.`
  );
}

/**
 * Build a BOUNDED research query set from the cap schema for the thin docs.
 * @param {string[]} thinDocs  canonical doc names whose intent input is thin
 * @param {object} capInfo     result of loadCapSchema()
 * @param {string} product     product name (for question phrasing)
 * @returns {{ backend, max_queries, total_candidates, truncated, queries: Array }}
 */
function buildResearchQuerySet(thinDocs, capInfo, product) {
  const { fieldsByDoc, cap } = capInfo;
  const queries = [];
  for (const doc of thinDocs) {
    const fields = fieldsByDoc[doc];
    if (!fields) continue; // doc not researchable per the cap — skip
    for (const field of fields) {
      queries.push({ doc, field, question: fieldToQuestion(field, product) });
    }
  }
  const total = queries.length;
  const max = cap.max_queries;
  const truncated = total > max;
  return {
    backend: cap.backend,
    max_queries: max,
    total_candidates: total,
    truncated,
    queries: queries.slice(0, max),
  };
}

/**
 * Validate a research findings object against the cap schema.
 * Expected shape (mirrors the schema root):
 *   { per_doc: { DOC: { findings: { field: "..." }, sources: ["..."] } } }
 * @returns {{ valid: object, errors: string[], warnings: string[], thinDocs: string[], rejected: string[] }}
 *   - valid: per_doc map containing only schema-legal, SOURCED docs (safe to merge)
 *   - thinDocs: docs whose findings had empty sources[] (THIN -> warning, NOT merged)
 *   - rejected: out-of-schema docs/fields that were discarded
 */
function validateFindings(findings, capInfo) {
  const { fieldsByDoc, allowedDocs } = capInfo;
  const errors = [];
  const warnings = [];
  const rejected = [];
  const thinDocs = [];
  const valid = {};

  if (!findings || typeof findings !== "object") {
    errors.push("research findings: not an object");
    return { valid, errors, warnings, thinDocs, rejected };
  }
  // Root additionalProperties:false — only per_doc and research_cap allowed.
  for (const k of Object.keys(findings)) {
    if (k !== "per_doc" && k !== "research_cap") {
      rejected.push(`root.${k}`);
      warnings.push(`research findings: discarded out-of-schema root key "${k}"`);
    }
  }
  const perDoc = findings.per_doc;
  if (!perDoc || typeof perDoc !== "object") {
    errors.push('research findings: missing or non-object "per_doc"');
    return { valid, errors, warnings, thinDocs, rejected };
  }

  for (const [doc, def] of Object.entries(perDoc)) {
    if (!allowedDocs.includes(doc)) {
      rejected.push(`per_doc.${doc}`);
      warnings.push(
        `research findings: discarded out-of-schema doc "${doc}" (not in cap)`,
      );
      continue;
    }
    if (!def || typeof def !== "object") {
      warnings.push(`research findings: "${doc}" is not an object — skipped`);
      continue;
    }
    const allowedFields = fieldsByDoc[doc] || [];
    const rawFindings =
      def.findings && typeof def.findings === "object" ? def.findings : {};
    const cleanFindings = {};
    for (const [field, val] of Object.entries(rawFindings)) {
      if (!allowedFields.includes(field)) {
        rejected.push(`per_doc.${doc}.findings.${field}`);
        warnings.push(
          `research findings: discarded out-of-schema field "${doc}.${field}"`,
        );
        continue;
      }
      if (typeof val === "string" && val.trim()) cleanFindings[field] = val.trim();
    }
    const sources = Array.isArray(def.sources)
      ? def.sources.filter((s) => typeof s === "string" && s.trim())
      : [];

    if (Object.keys(cleanFindings).length === 0) {
      // nothing usable for this doc — neither error nor merge
      continue;
    }
    if (sources.length === 0) {
      // β directive: empty sources => THIN => WARNING, never a silent merge.
      thinDocs.push(doc);
      warnings.push(
        `research findings: "${doc}" has findings but EMPTY sources[] — treated as THIN (not merged)`,
      );
      continue;
    }
    valid[doc] = { findings: cleanFindings, sources };
  }

  return { valid, errors, warnings, thinDocs, rejected };
}

// Build the cited markdown block appended to a thin doc.
function findingsBlock(validForDoc) {
  const lines = [
    "",
    "## Research Signals (non-canonical — cited)",
    "",
    "<!-- Capped research fill (research-fields.schema.json). Supplementary " +
      "category signal, NOT canonical assertions — refine into the canonical " +
      "sections above as the product is validated. -->",
    "",
  ];
  for (const [field, val] of Object.entries(validForDoc.findings)) {
    lines.push(`- **${field.replace(/_/g, " ")}:** ${val}`);
  }
  lines.push("");
  lines.push("**Sources:**");
  for (const s of validForDoc.sources) lines.push(`- ${s}`);
  lines.push("");
  return lines.join("\n");
}

/**
 * Append validated, sourced findings to their docs' rendered artifacts.
 * @param {object} artifacts  { "DOC.md": "<markdown>", ... } (mutated in place)
 * @param {object} valid      validateFindings().valid
 * @returns {{ merged: string[], skipped: string[] }}
 */
function mergeFindings(artifacts, valid) {
  const merged = [];
  const skipped = [];
  for (const [doc, def] of Object.entries(valid)) {
    const fname = `${doc}.md`;
    if (typeof artifacts[fname] !== "string") {
      skipped.push(doc); // no narrative artifact for this doc (e.g. structured)
      continue;
    }
    artifacts[fname] = artifacts[fname].replace(/\s*$/, "\n") + findingsBlock(def);
    merged.push(doc);
  }
  return { merged, skipped };
}

module.exports = {
  loadCapSchema,
  buildResearchQuerySet,
  validateFindings,
  mergeFindings,
  fieldToQuestion,
  SCHEMA_PATH,
};
