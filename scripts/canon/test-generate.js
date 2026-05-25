#!/usr/bin/env node
/* eslint-disable no-console */
"use strict";
/**
 * scripts/canon/test-generate.js — fixture end-to-end + unit test for the canon
 * engine (SP-20260525-022 T7 / T-20260525-235). Verify-before-claim.
 *
 * E2E (CLI, --research off — no spend, CI-safe):
 *   1. generate.js against the fixture emits all 11 artifacts.
 *   2. validation passes (ok, no errors) with thin warnings expected.
 *   3. each of the 4 JSON artifacts JSON.parse()s.
 *
 * Units:
 *   - research.buildResearchQuerySet is bounded by max_queries + excludes docs
 *     outside the cap (EVOLUTION).
 *   - research.validateFindings rejects out-of-schema doc/field/root key and
 *     treats empty-sources findings as THIN (never merged).
 *   - research.mergeFindings appends a cited block only for sourced findings.
 *   - validate.validateArtifacts flags a missing section + product-name mismatch
 *     as ERRORS (the structural contract).
 *
 * Live integration (one real research:simple round) is gated behind
 * CANON_LIVE_RESEARCH=1 and SKIPPED by default — it incurs API spend and needs
 * the orchestrator (bootstrap:spinup canon phase), not this unit harness.
 *
 * Exit 0 = all pass, 1 = any failure.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const REPO = path.resolve(__dirname, "..", "..");
const GEN = path.join(REPO, "scripts", "canon", "generate.js");
const FIXTURE = path.join(REPO, "scripts", "canon", "fixtures", "acme-intent.md");
const research = require("./research");
const { validateArtifacts } = require("./validate");
const { NARRATIVE, STRUCTURED } = require("./generate");

let passed = 0;
let failed = 0;
function ok(name) {
  passed++;
  process.stdout.write(`  ok    ${name}\n`);
}
function fail(name, detail) {
  failed++;
  process.stdout.write(`  FAIL  ${name}\n`);
  if (detail) process.stdout.write(`        ${detail}\n`);
}

// ---------------------------------------------------------------- E2E (CLI)
function e2e() {
  process.stdout.write("\nE2E — generate.js against fixture (--research off)\n");
  if (!fs.existsSync(FIXTURE)) {
    fail("fixture present", `missing ${FIXTURE}`);
    return;
  }
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "canon-e2e-"));
  const r = spawnSync(
    process.execPath,
    [GEN, "--intent", FIXTURE, "--product", "Acme", "--research", "off", "--out", out, "--json"],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    fail("exit 0", `status=${r.status} stderr=${r.stderr}`);
    fs.rmSync(out, { recursive: true, force: true });
    return;
  }
  ok("exit 0");

  let result;
  try {
    result = JSON.parse(r.stdout);
    ok("stdout is JSON");
  } catch (e) {
    fail("stdout is JSON", e.message);
    fs.rmSync(out, { recursive: true, force: true });
    return;
  }

  const expected = NARRATIVE.length + STRUCTURED.length; // 11
  const files = fs.readdirSync(out).filter((f) => !f.startsWith("."));
  if (files.length === expected) ok(`emitted ${expected} artifacts`);
  else fail(`emitted ${expected} artifacts`, `got ${files.length}: ${files.join(",")}`);

  // re-validate from disk
  const artifacts = {};
  for (const f of files) artifacts[f] = fs.readFileSync(path.join(out, f), "utf8");
  const v = validateArtifacts(artifacts);
  if (v.ok && v.errors.length === 0) ok("validation ok (no errors)");
  else fail("validation ok (no errors)", v.errors.join("; "));
  if (v.thin.length > 0) ok("thin fields reported as warnings (not errors)");
  else fail("thin fields reported", "fixture is thin — expected thin warnings");

  // each JSON parses
  let jsonOk = true;
  for (const name of STRUCTURED) {
    try {
      JSON.parse(artifacts[`${name}.json`]);
    } catch (e) {
      jsonOk = false;
      fail(`${name}.json parses`, e.message);
    }
  }
  if (jsonOk) ok("all 4 JSON artifacts parse");

  fs.rmSync(out, { recursive: true, force: true });
}

// ---------------------------------------------------------------- units
function unitsResearch() {
  process.stdout.write("\nUNIT — research.js (the cap)\n");
  const capInfo = research.loadCapSchema();

  // query set bounded + excludes out-of-cap docs
  const qs = research.buildResearchQuerySet(
    ["USER_COHORTS", "GOLDEN_PATHS", "FAILURE_STATES", "EVOLUTION"],
    capInfo,
    "Acme",
  );
  if (qs.queries.length <= qs.max_queries) ok(`query set bounded (<= ${qs.max_queries})`);
  else fail("query set bounded", `got ${qs.queries.length}`);
  if (!qs.queries.some((q) => q.doc === "EVOLUTION"))
    ok("query set excludes out-of-cap doc (EVOLUTION)");
  else fail("query set excludes EVOLUTION", "EVOLUTION not in cap per_doc");

  // validateFindings — cap enforcement
  const findings = {
    per_doc: {
      USER_COHORTS: {
        findings: { cohort_evidence: "field teams dominate", BOGUS: "x" },
        sources: ["https://example.com"],
      },
      GOLDEN_PATHS: { findings: { common_user_flows: "capture->tag" }, sources: [] },
      NOT_A_DOC: { findings: {}, sources: [] },
    },
    junk_root: "y",
  };
  const vf = research.validateFindings(findings, capInfo);
  if (vf.valid.USER_COHORTS && !vf.valid.USER_COHORTS.findings.BOGUS)
    ok("out-of-schema field discarded, valid field kept");
  else fail("field rejection", JSON.stringify(vf.valid.USER_COHORTS));
  if (vf.thinDocs.includes("GOLDEN_PATHS") && !vf.valid.GOLDEN_PATHS)
    ok("empty-sources finding treated as THIN (not merged)");
  else fail("empty-sources THIN", JSON.stringify(vf.thinDocs));
  if (vf.rejected.some((x) => x.includes("NOT_A_DOC")) && vf.rejected.some((x) => x.includes("junk_root")))
    ok("out-of-schema doc + root key rejected");
  else fail("doc/root rejection", JSON.stringify(vf.rejected));

  // mergeFindings — cited block only for sourced
  const artifacts = {
    "USER_COHORTS.md": "# Acme — User Cohorts\n\n## Primary Audience\nx\n",
    "GOLDEN_PATHS.md": "# Acme — Golden Paths\n\n## Golden Path 1: y\n",
  };
  const m = research.mergeFindings(artifacts, vf.valid);
  if (m.merged.includes("USER_COHORTS") && /Research Signals/.test(artifacts["USER_COHORTS.md"]))
    ok("mergeFindings appends cited block for sourced finding");
  else fail("merge cited block", JSON.stringify(m));
  if (!/Research Signals/.test(artifacts["GOLDEN_PATHS.md"]))
    ok("mergeFindings skips unsourced (thin) doc");
  else fail("merge skips thin", "GOLDEN_PATHS got a block despite empty sources");
}

function unitsValidate() {
  process.stdout.write("\nUNIT — validate.js (structural contract)\n");
  // a correctly-rendered minimal CORE_BRIEF passes section-presence
  const good = {};
  for (const name of NARRATIVE) {
    const tmpl = fs.readFileSync(
      path.join(REPO, "framework", "templates", "canonical", `${name}.md.tmpl`),
      "utf8",
    );
    // fill only product_name; leave the rest as tokens (thin but structurally valid)
    good[`${name}.md`] = tmpl.replace(/\{\{\s*product_name\s*\}\}/g, "Acme");
  }
  for (const name of STRUCTURED) {
    const tmpl = fs.readFileSync(
      path.join(REPO, "framework", "templates", "canonical", `${name}.json.tmpl`),
      "utf8",
    );
    good[`${name}.json`] = tmpl
      .replace(/\{\{value_group_1_name\}\}/g, "values")
      .replace(/\{\{[a-zA-Z0-9_]+\}\}/g, (m) =>
        /phases|steps/.test(m) ? "[]" : "{}",
      );
  }
  const vGood = validateArtifacts(good);
  if (vGood.ok) ok("structurally-valid (thin) artifacts pass");
  else fail("thin passes", vGood.errors.join("; "));

  // missing section -> ERROR
  const broken = { ...good, "CORE_BRIEF.md": "# Acme — Core Brief\n\n## One-Liner\nx\n" };
  const vBroken = validateArtifacts(broken);
  if (!vBroken.ok && vBroken.errors.some((e) => /missing required section/.test(e)))
    ok("missing section -> ERROR");
  else fail("missing section error", JSON.stringify(vBroken.errors));

  // product_name mismatch -> ERROR
  const mismatch = { ...good };
  mismatch["GLOSSARY.md"] = mismatch["GLOSSARY.md"].replace("# Acme —", "# Other —");
  const vMis = validateArtifacts(mismatch);
  if (!vMis.ok && vMis.errors.some((e) => /product_name mismatch/.test(e)))
    ok("product_name mismatch -> ERROR");
  else fail("product mismatch error", JSON.stringify(vMis.errors));
}

function liveResearch() {
  if (process.env.CANON_LIVE_RESEARCH !== "1") {
    process.stdout.write(
      "\nLIVE — research:simple round SKIPPED (set CANON_LIVE_RESEARCH=1 to run; incurs API spend)\n",
    );
    return;
  }
  process.stdout.write(
    "\nLIVE — research bridge is orchestrator-driven (bootstrap:spinup canon phase); not runnable from this unit harness.\n",
  );
}

e2e();
unitsResearch();
unitsValidate();
liveResearch();

process.stdout.write(`\ncanon test: ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
