#!/usr/bin/env node
"use strict";

/**
 * adhoc-fail-override (ADR-0007 Tier-4 GAP 2) — the enforcer of the load-bearing
 * independence invariant: **"the Lead/dispatcher CANNOT override a FAIL"**
 * (ADR-0007 Decision §"Independence invariant").
 *
 * THE BLIND SPOT THIS CLOSES: `scripts/dispatch/gauntlet-verify.js` checks only that
 * a reviewer's completion RECORD is PRESENT and well-formed (role/provider/ok/ts) —
 * it NEVER reads the reviewer's verdict VALUE. So a dispatcher can record `ok:true`
 * completions for every reviewer (gauntlet-verify reads green) while one reviewer's
 * INNER verdict was FAIL, yet still declare the adhoc run `status: "pass"` and list the
 * feature in `features_completed`. That is a dispatcher overriding a binding FAIL, and
 * nothing detects it. This check reads the VERDICT CONTENT and rejects that override.
 * It deliberately does NOT reuse gauntlet-verify (presence ≠ verdict).
 *
 * INPUT — the adhoc GAMMA_RESULT (schema at gamma.md ~374-401):
 *   { status: "pass"|"fail"|"halted",
 *     features_completed: ["<feature>"],
 *     gate_checks: [ { feature, frontend_reviewer, backend_reviewer, qa_reviewer,
 *                      security_reviewer } ]  // each "pass"|"fail"|"skipped" }
 * Supplied via --result <gamma-result.json>. Optionally, per-role reviewer output
 * JSONs under .claude/runtime/dispatch/ (or --reviewers <dir>) are ALSO scanned for an
 * inner verdict of FAIL / critical / high (the reviewer said fail even if the
 * dispatcher's gate_checks summary said pass — a summary-vs-detail override).
 *
 * REJECT (exit 1) when ANY binding FAIL coexists with a declared success:
 *   - any gate_check reviewer verdict == "fail", OR any reviewer JSON inner verdict is
 *     FAIL / critical / high, AND
 *   - the declared top-level status == "pass" OR the feature appears in
 *     features_completed.
 * (An HONEST run — FAIL with status:"fail"/"halted" and the feature NOT completed —
 *  passes: the dispatcher did not override.)
 *
 * Graceful exit 0 when there is no adhoc run to check (no --result and no reviewer
 * JSONs present). Fail-closed exit 2 on a malformed/unreadable result.
 *
 * Pure core = evaluate({ result, reviewerVerdicts }) with injected seams so the
 * bite-test proves each class without touching disk. Mirrors
 * sprint-beta-honesty.js (deterministic check + graceful-empty + fail-closed) and
 * role-parity-scan.js (injectable pure core).
 *
 *   node scripts/checks/adhoc-fail-override.js [--result <gamma-result.json>] \
 *        [--reviewers <dir>] [--json]
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "adhoc-fail-override";

// The four ADR-0007 roster gate_check reviewer keys (gamma.md gate_checks schema).
const REVIEWER_KEYS = Object.freeze([
  "frontend_reviewer",
  "backend_reviewer",
  "qa_reviewer",
  "security_reviewer",
]);

// Default location the adhoc gauntlet writes per-role reviewer output JSONs to.
const DEFAULT_REVIEWERS_DIR = path.join(ROOT, ".claude", "runtime", "dispatch");

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
}

/** A binding-fail token in a per-role gate_check cell. */
function isFailVerdict(v) {
  return String(v || "").trim().toLowerCase() === "fail";
}

/**
 * Does a reviewer JSON (whatever its exact shape) carry an inner binding FAIL?
 * Recognizes the common reviewer envelope verdict fields + a severity escalation
 * (any finding of severity critical/high is a binding fail per the gauntlet rules).
 * Conservative: only returns true on an UNAMBIGUOUS fail/critical/high signal.
 */
function reviewerJsonIsFail(obj) {
  if (!obj || typeof obj !== "object") return false;
  // (a) explicit verdict/status field
  const verdictFields = ["verdict", "status", "result", "outcome"];
  for (const k of verdictFields) {
    const val = String(obj[k] || "").trim().toLowerCase();
    if (val === "fail" || val === "failed" || val === "reject" || val === "rejected") return true;
  }
  // (b) explicit critical/high counts
  for (const k of ["critical_findings", "high_findings", "critical", "high"]) {
    const n = obj[k];
    if (typeof n === "number" && n > 0) return true;
  }
  // (c) a findings[] array carrying a critical/high severity item
  const findings = Array.isArray(obj.findings)
    ? obj.findings
    : Array.isArray(obj.issues)
      ? obj.issues
      : null;
  if (findings) {
    for (const f of findings) {
      const sev = String((f && (f.severity || f.level)) || "").trim().toLowerCase();
      if (sev === "critical" || sev === "high") return true;
    }
  }
  return false;
}

/**
 * Pure assertion core. Returns { result, errors[], checked } where result is
 * "PASS" | "REJECT". `checked` is the number of feature/verdict pairs examined.
 *
 * @param {object|null} result   the GAMMA_RESULT object (or null if none supplied)
 * @param {Array<{source:string, fail:boolean, feature?:string}>} reviewerVerdicts
 *        per-reviewer-JSON inner verdicts (already reduced to fail booleans)
 * @returns {{ result:"PASS"|"REJECT", errors:string[], checked:number }}
 */
function evaluate({ result, reviewerVerdicts = [] }) {
  const errors = [];
  let checked = 0;

  // Establish the "declared success" surface.
  const topStatus = result ? String(result.status || "").trim().toLowerCase() : "";
  const declaredPass = topStatus === "pass";
  const completed = new Set(
    result && Array.isArray(result.features_completed)
      ? result.features_completed.map((x) => String(x))
      : [],
  );

  // Per-feature gate_checks: any reviewer == "fail" is a binding FAIL.
  const gateChecks = result && Array.isArray(result.gate_checks) ? result.gate_checks : [];
  for (const gc of gateChecks) {
    if (!gc || typeof gc !== "object") continue;
    const feature = String(gc.feature || "(unnamed)");
    const failedReviewers = REVIEWER_KEYS.filter((k) => isFailVerdict(gc[k]));
    if (failedReviewers.length === 0) continue;
    checked++;

    const featureCompleted = completed.has(feature);
    // The override: a binding reviewer FAIL coexists with a declared success.
    if (declaredPass || featureCompleted) {
      const why = [];
      if (declaredPass) why.push(`top-level status == "pass"`);
      if (featureCompleted) why.push(`feature "${feature}" is in features_completed`);
      errors.push(
        `override: feature "${feature}" has FAILING reviewer(s) [${failedReviewers.join(", ")}] yet ${why.join(" AND ")} — a dispatcher cannot override a binding FAIL (ADR-0007 independence invariant)`,
      );
    }
  }

  // Per-role reviewer JSON inner verdicts (summary-vs-detail override): a reviewer
  // JSON that says FAIL/critical/high, while the run still declares success.
  for (const rv of reviewerVerdicts) {
    if (!rv || !rv.fail) continue;
    checked++;
    const feature = rv.feature ? String(rv.feature) : null;
    const featureCompleted = feature ? completed.has(feature) : false;
    if (declaredPass || featureCompleted || (result == null)) {
      // result==null guard: a reviewer JSON saying FAIL with NO accompanying result
      // to honestly mark it is itself an override-by-omission ONLY when a result is
      // expected; but if there's literally no run context we treat reviewer-only as
      // informational. Here result!=null is the real case; the null branch is handled
      // by main()'s graceful-empty (no result + reviewers-only → exit 0).
      const why = [];
      if (declaredPass) why.push(`top-level status == "pass"`);
      if (featureCompleted) why.push(`feature "${feature}" is in features_completed`);
      errors.push(
        `override: reviewer output ${rv.source} reports a binding FAIL (fail/critical/high)${feature ? ` for "${feature}"` : ""} yet ${why.join(" AND ") || "the run was declared successful"} — dispatcher cannot override a binding FAIL`,
      );
    }
  }

  return { result: errors.length > 0 ? "REJECT" : "PASS", errors, checked };
}

/**
 * Load per-role reviewer output JSONs from a directory and reduce each to a
 * { source, fail, feature? } verdict. Best-effort: unreadable/non-JSON files are
 * skipped (they are not "the result", just supplementary detail). Returns [].
 */
function loadReviewerVerdicts(dir) {
  const out = [];
  let ents;
  try {
    ents = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out; // no dir → no supplementary reviewer detail
  }
  for (const e of ents) {
    if (!e.isFile() || !e.name.endsWith(".json")) continue;
    // Only consider files that look like reviewer outputs (reviewer/qa/redteam/
    // security/rr in the name) to avoid scanning unrelated JSON. Conservative.
    if (!/(review|reviewer|qa|redteam|security|^rr|-rr)/i.test(e.name)) continue;
    const full = path.join(dir, e.name);
    let obj;
    try {
      obj = readJSON(full);
    } catch {
      continue; // not parseable JSON → skip (supplementary, not the source of truth)
    }
    out.push({
      source: e.name,
      fail: reviewerJsonIsFail(obj),
      feature: obj && (obj.feature || obj.scope) ? String(obj.feature || obj.scope) : null,
    });
  }
  return out;
}

function main(argv) {
  const json = argv.includes("--json");
  let resultPath = null;
  let reviewersDir = null;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--result") resultPath = path.resolve(argv[++i]);
    else if (argv[i] === "--reviewers") reviewersDir = path.resolve(argv[++i]);
  }

  let result = null;
  let reviewerVerdicts = [];
  try {
    if (resultPath) {
      if (!fs.existsSync(resultPath)) {
        // An explicitly-named result file that doesn't exist is a usage error →
        // fail-closed (don't silently green a run whose result we were told to read).
        process.stderr.write(`${NAME} error: --result file not found: ${resultPath}\n`);
        return 2;
      }
      result = readJSON(resultPath); // throws on malformed → caught below → exit 2
      if (!result || typeof result !== "object") {
        process.stderr.write(`${NAME} error: --result did not parse to an object\n`);
        return 2;
      }
    }
    const dir = reviewersDir || DEFAULT_REVIEWERS_DIR;
    reviewerVerdicts = loadReviewerVerdicts(dir);
  } catch (e) {
    // Malformed/unreadable result → fail-closed.
    process.stderr.write(`${NAME} error: ${e.message}\n`);
    return 2;
  }

  // Graceful-empty: no adhoc run to check (no result supplied AND no reviewer
  // detail present). A scan with nothing to audit is a clean pass, not a failure.
  const haveReviewerSignal = reviewerVerdicts.some((r) => r.fail);
  if (!result && !haveReviewerSignal) {
    if (json) {
      process.stdout.write(
        JSON.stringify({ ok: true, check: NAME, reason: "no_adhoc_run", checked: 0 }) + "\n",
      );
    } else {
      process.stdout.write(
        `OK   [${NAME}] no adhoc GAMMA_RESULT to check (no --result, no failing reviewer output) — nothing to audit\n`,
      );
    }
    return 0;
  }

  // If there are reviewer FAILs but NO result object, we cannot assess an override
  // (there is no declared success to contradict). That is honest-by-omission here —
  // graceful pass — because the override claim requires a declared success surface.
  if (!result) {
    if (json) {
      process.stdout.write(
        JSON.stringify({ ok: true, check: NAME, reason: "reviewer_detail_only_no_result", checked: 0 }) + "\n",
      );
    } else {
      process.stdout.write(
        `OK   [${NAME}] reviewer FAIL detail present but no GAMMA_RESULT supplied — no declared-success surface to contradict (supply --result to audit override)\n`,
      );
    }
    return 0;
  }

  const out = evaluate({ result, reviewerVerdicts });

  if (json) {
    process.stdout.write(
      JSON.stringify(
        { ok: out.result === "PASS", check: NAME, result: out.result, checked: out.checked, errors: out.errors },
        null,
        2,
      ) + "\n",
    );
    return out.result === "PASS" ? 0 : 1;
  }

  if (out.result === "REJECT") {
    process.stderr.write(
      `REJECT [${NAME}] dispatcher overrode a binding FAIL (${out.errors.length}):\n${out.errors.map((e) => "  - " + e).join("\n")}\n`,
    );
    return 1;
  }
  process.stdout.write(
    `OK   [${NAME}] no FAIL-override detected (${out.checked} verdict(s) checked; any FAIL is honestly reflected in status/features_completed)\n`,
  );
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, reviewerJsonIsFail, isFailVerdict, loadReviewerVerdicts, REVIEWER_KEYS, NAME };
