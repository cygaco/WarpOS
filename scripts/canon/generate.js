#!/usr/bin/env node
"use strict";
/**
 * scripts/canon/generate.js — the canon engine (SP-20260525-022).
 *
 * Turns a product's intent (a brief from bootstrap:spinup's guided discussion,
 * or a clone doc from --clone) into the full _requirements/00-canonical/* set:
 * 7 narrative MD + 4 structured JSON, rendered from framework/templates/canonical/*.
 *
 * Pipeline: parse intent -> map sections to template fields -> detect THIN fields
 * -> (T4) fill thin fields via CAPPED research (bounded by schemas/canon/
 * research-fields.schema.json) -> render -> (T5) validate -> emit.
 *
 * Runs PRODUCT-SIDE (invoked by bootstrap:spinup's canon phase in a product repo),
 * so generating product-titled canon there is correct — not a canonical purity
 * concern. This engine + the templates are generic (no product content).
 *
 * Usage:
 *   node scripts/canon/generate.js --intent <file.md> --product "<name>"
 *        [--out <dir>] [--research simple|deep|off] [--dry-run] [--json]
 *
 * Exit: 0 ok (may include thin-field warnings), 1 fatal (no templates / no intent),
 *       2 bad args.
 */

const fs = require("fs");
const path = require("path");
const research = require("./research");
const { validateArtifacts } = require("./validate");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const TMPL_DIR = path.join(REPO_ROOT, "framework", "templates", "canonical");

const NARRATIVE = [
  "CORE_BRIEF",
  "USER_COHORTS",
  "GOLDEN_PATHS",
  "PRODUCT_MODEL",
  "EVOLUTION",
  "FAILURE_STATES",
  "GLOSSARY",
];
const STRUCTURED = ["FIELD_REGISTRY", "PRECEDENCE", "STEPS", "WATCHED_DIRS"];

function parseArgs(argv) {
  const out = {
    intent: null,
    product: null,
    out: "_requirements/00-canonical",
    research: "off",
    researchIn: null,
    dryRun: false,
    json: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--intent") out.intent = argv[++i];
    else if (a === "--product") out.product = argv[++i];
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--research") out.research = argv[++i];
    else if (a === "--research-in") out.researchIn = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--json") out.json = true;
  }
  return out;
}

// {{key}} substitution; leaves unmatched tokens in place so thin-detection sees them.
function render(tmpl, data) {
  return tmpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (m, k) =>
    data[k] === undefined || data[k] === null || data[k] === ""
      ? m
      : String(data[k]),
  );
}

// Split a markdown intent into a { "section title (lowercased)": body } map.
function parseIntentSections(md) {
  const sections = {};
  const lines = md.split(/\r?\n/);
  let cur = null;
  let buf = [];
  const flush = () => {
    if (cur) sections[cur] = buf.join("\n").trim();
    buf = [];
  };
  for (const line of lines) {
    const m = /^#{1,3}\s+(.*)$/.exec(line);
    if (m) {
      flush();
      cur = m[1].replace(/^\d+\s*[—-]\s*/, "").trim().toLowerCase();
    } else if (cur) buf.push(line);
  }
  flush();
  return sections;
}

// Pull the first section whose title includes any of the keywords.
function pick(sections, ...keywords) {
  for (const [title, body] of Object.entries(sections)) {
    if (keywords.some((k) => title.includes(k)) && body) return body;
  }
  return "";
}

// Map intent sections -> canonical template fields. Heuristic; thin fields
// (empty) are surfaced for the research phase (T4) + validation (T5).
function buildFieldMap(product, sections) {
  return {
    product_name: product,
    one_liner: pick(sections, "one-liner", "problem", "summary"),
    what_it_is: pick(sections, "what it is", "solution", "product", "mvp"),
    what_it_is_not: pick(sections, "not", "non-goal", "out of scope"),
    vision: pick(sections, "vision", "wedge to full"),
    core_pillars: pick(sections, "pillar", "principle", "value"),
    primary_audience: pick(sections, "audience", "user", "customer", "jtbd"),
    cohort_1_name: "",
    primary_jtbd: pick(sections, "jtbd", "job", "problem"),
    path_1_name: pick(sections, "golden path", "core loop", "flow"),
    phase_vocabulary: pick(sections, "phase", "stage"),
    product_primitives: pick(sections, "primitive", "feature", "mvp"),
    evolution_status_note:
      "Non-canonical projection — derived from intent; refine as the product evolves.",
    // Many fields intentionally start empty -> THIN -> research (T4) / warning (T5).
  };
}

// Extract the {{token}} names referenced by a template.
function templateTokens(tmpl) {
  const toks = new Set();
  tmpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k) => (toks.add(k), _m));
  return [...toks];
}

// A doc is THIN (a research candidate) when every one of its template tokens —
// except the always-filled ones — is empty in the field map. Template-driven so
// it can't rot when a template gains/loses a field.
const ALWAYS_FILLED = new Set(["product_name", "evolution_status_note"]);
function isThinDoc(tmpl, data) {
  const toks = templateTokens(tmpl).filter((t) => !ALWAYS_FILLED.has(t));
  if (toks.length === 0) return false;
  return toks.every(
    (t) => data[t] === undefined || data[t] === null || data[t] === "",
  );
}

// Detect which template placeholders remain unfilled after the field map.
function detectThin(tmpl, data) {
  const thin = [];
  tmpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k) => {
    if (data[k] === undefined || data[k] === null || data[k] === "")
      thin.push(k);
    return _m;
  });
  return thin;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.intent || !args.product) {
    process.stderr.write(
      'Usage: node scripts/canon/generate.js --intent <file.md> --product "<name>" [--out <dir>] [--research simple|deep|off] [--dry-run]\n',
    );
    return 2;
  }
  if (!fs.existsSync(TMPL_DIR)) {
    process.stderr.write(
      `canon templates missing at ${TMPL_DIR} — run /warp:update.\n`,
    );
    return 1;
  }
  const intentPath = path.resolve(REPO_ROOT, args.intent);
  if (!fs.existsSync(intentPath)) {
    process.stderr.write(`intent file not found: ${intentPath}\n`);
    return 1;
  }
  const sections = parseIntentSections(fs.readFileSync(intentPath, "utf8"));
  const data = buildFieldMap(args.product, sections);

  // Load templates; gather thin fields + thin DOCS (research candidates).
  const tmpls = {};
  const allThin = new Set();
  const thinDocs = [];
  for (const name of NARRATIVE) {
    const t = fs.readFileSync(path.join(TMPL_DIR, `${name}.md.tmpl`), "utf8");
    tmpls[`${name}.md`] = t;
    detectThin(t, data).forEach((f) => allThin.add(f));
    if (isThinDoc(t, data)) thinDocs.push(name);
  }

  // Structured JSON: render the .json.tmpl, default the still-placeholder
  // product-specific tokens to empty containers so output is valid JSON.
  const jsonDefaults = {
    value_group_1_name: "values",
    value_group_1: "{}",
    enums: "{}",
    validation_rules: "{}",
    precedence_rules: "{}",
    phases: "[]",
    steps: "[]",
  };
  for (const name of STRUCTURED) {
    tmpls[`${name}.json`] = render(
      fs.readFileSync(path.join(TMPL_DIR, `${name}.json.tmpl`), "utf8"),
      { ...jsonDefaults, ...data },
    );
  }

  // Render narrative + carry over structured.
  const artifacts = {};
  for (const name of NARRATIVE) artifacts[`${name}.md`] = render(tmpls[`${name}.md`], data);
  for (const name of STRUCTURED) artifacts[`${name}.json`] = tmpls[`${name}.json`];

  // T4: capped research. The engine owns the CAP (bounded query set from the
  // schema's x-fields for thin docs) + validation + cited merge; the LIVE
  // invocation is the orchestrator's job (bootstrap:spinup canon phase). When
  // --research-in is supplied we validate + merge it; otherwise we emit the
  // bounded request the orchestrator must run research:* against.
  const researchOut = {
    backend: args.research,
    request: null,
    merged: [],
    skipped_thin: [],
    rejected: [],
    warnings: [],
  };
  if (args.research !== "off" && thinDocs.length) {
    const capInfo = research.loadCapSchema();
    const querySet = research.buildResearchQuerySet(thinDocs, capInfo, args.product);
    researchOut.request = querySet;
    if (args.researchIn) {
      const findings = JSON.parse(
        fs.readFileSync(path.resolve(REPO_ROOT, args.researchIn), "utf8"),
      );
      const v = research.validateFindings(findings, capInfo);
      if (v.errors.length) {
        process.stderr.write(
          `research findings invalid:\n  ${v.errors.join("\n  ")}\n`,
        );
        return 1;
      }
      const m = research.mergeFindings(artifacts, v.valid);
      researchOut.merged = m.merged;
      researchOut.skipped_thin = v.thinDocs;
      researchOut.rejected = v.rejected;
      researchOut.warnings = v.warnings;
    }
  }

  // T5: validate the rendered artifacts. ERRORS = structural bug (exit 1);
  // THIN inputs = warnings (exit 0). β: thin is a warning, never a silent pass.
  const validation = validateArtifacts(artifacts, {
    tmplDir: TMPL_DIR,
    narrative: NARRATIVE,
    structured: STRUCTURED,
  });

  const outDir = path.resolve(REPO_ROOT, args.out);
  const written = [];
  // When research was requested but not yet supplied, drop the bounded request
  // so the orchestrator can run it and re-invoke with --research-in.
  let requestFile = null;
  if (!args.dryRun) {
    fs.mkdirSync(outDir, { recursive: true });
    if (researchOut.request && !args.researchIn) {
      requestFile = path.join(outDir, ".canon-research-request.json");
      fs.writeFileSync(requestFile, JSON.stringify(researchOut.request, null, 2) + "\n", "utf8");
    }
    if (validation.ok) {
      for (const [fname, body] of Object.entries(artifacts)) {
        fs.writeFileSync(path.join(outDir, fname), body, "utf8");
        written.push(fname);
      }
    }
  }

  const result = {
    ok: validation.ok,
    product: args.product,
    out: args.out,
    artifacts: Object.keys(artifacts),
    thin_fields: [...allThin],
    thin_docs: thinDocs,
    research: researchOut,
    validation: { ok: validation.ok, errors: validation.errors, warnings: validation.warnings, thin: validation.thin },
    dry_run: args.dryRun,
    written,
  };
  if (args.json) process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  else {
    if (!validation.ok) {
      process.stdout.write(
        `canon: VALIDATION FAILED for "${args.product}" — ${validation.errors.length} error(s), no artifacts written:\n  ${validation.errors.join("\n  ")}\n`,
      );
    } else {
      process.stdout.write(
        `canon: ${args.dryRun ? "dry-run" : "wrote " + written.length} artifacts (${NARRATIVE.length} MD + ${STRUCTURED.length} JSON) for "${args.product}"\n`,
      );
    }
    if (researchOut.merged.length)
      process.stdout.write(`  research: merged cited findings into ${researchOut.merged.join(", ")}\n`);
    if (requestFile)
      process.stdout.write(`  research: requested — ${researchOut.request.queries.length} bounded ${researchOut.request.backend} queries written to ${path.relative(REPO_ROOT, requestFile)}; run research:* and re-invoke with --research-in\n`);
    for (const w of researchOut.warnings) process.stdout.write(`  WARNING: ${w}\n`);
    for (const w of validation.warnings) process.stdout.write(`  WARNING: ${w}\n`);
    if (allThin.size)
      process.stdout.write(
        `  WARNING: ${allThin.size} thin field(s) (no intent source): ${[...allThin].join(", ")}${args.research === "off" ? " — re-run with --research simple to fill" : ""}\n`,
      );
  }
  return validation.ok ? 0 : 1;
}

if (require.main === module) process.exit(main());
module.exports = { main, parseArgs, parseIntentSections, buildFieldMap, render, detectThin, templateTokens, isThinDoc, NARRATIVE, STRUCTURED };
