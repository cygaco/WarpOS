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
    dryRun: false,
    json: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--intent") out.intent = argv[++i];
    else if (a === "--product") out.product = argv[++i];
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--research") out.research = argv[++i];
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

// T4 hook (capped research). For T3 core this is a no-op pass-through unless
// --research is simple|deep; T4 implements the bounded fill against
// schemas/canon/research-fields.schema.json. Returns { data, researched, thin }.
function fillThinViaResearch(data, thinFields, opts) {
  if (opts.research === "off" || thinFields.length === 0)
    return { data, researched: [], thin: thinFields };
  // T4: build a bounded query set from the cap schema's per-doc x-fields for the
  // thin docs, invoke research:<backend>, validate the response against the cap
  // schema, merge only named fields, treat empty-sources findings as THIN.
  // (Implemented in T-20260525-232.)
  return { data, researched: [], thin: thinFields };
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
  let data = buildFieldMap(args.product, sections);

  // Gather thin fields across all narrative templates, then (T4) research-fill.
  const tmpls = {};
  let allThin = new Set();
  for (const name of NARRATIVE) {
    const t = fs.readFileSync(path.join(TMPL_DIR, `${name}.md.tmpl`), "utf8");
    tmpls[`${name}.md`] = t;
    detectThin(t, data).forEach((f) => allThin.add(f));
  }
  const research = fillThinViaResearch(data, [...allThin], args);
  data = research.data;

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

  // Render narrative.
  const artifacts = {};
  for (const name of NARRATIVE) artifacts[`${name}.md`] = render(tmpls[`${name}.md`], data);
  for (const name of STRUCTURED) artifacts[`${name}.json`] = tmpls[`${name}.json`];

  // T5 hook: validate(artifacts) — section presence (MD), JSON.parse + schema
  // (JSON), cross-refs, and THIN findings as WARNINGS not silent pass.
  // (Implemented in T-20260525-233.)

  const outDir = path.resolve(REPO_ROOT, args.out);
  const written = [];
  if (!args.dryRun) {
    fs.mkdirSync(outDir, { recursive: true });
    for (const [fname, body] of Object.entries(artifacts)) {
      fs.writeFileSync(path.join(outDir, fname), body, "utf8");
      written.push(fname);
    }
  }

  const result = {
    ok: true,
    product: args.product,
    out: args.out,
    artifacts: Object.keys(artifacts),
    thin_fields: [...allThin],
    research: args.research,
    dry_run: args.dryRun,
    written,
  };
  if (args.json) process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  else {
    process.stdout.write(
      `canon: ${args.dryRun ? "dry-run" : "wrote " + written.length} artifacts (${NARRATIVE.length} MD + ${STRUCTURED.length} JSON) for "${args.product}"\n`,
    );
    if (allThin.size)
      process.stdout.write(
        `  WARNING: ${allThin.size} thin field(s) (no intent source): ${[...allThin].join(", ")}${args.research === "off" ? " — re-run with --research simple to fill" : ""}\n`,
      );
  }
  return 0;
}

if (require.main === module) process.exit(main());
module.exports = { parseIntentSections, buildFieldMap, render, detectThin, NARRATIVE, STRUCTURED };
