#!/usr/bin/env node
"use strict";
/**
 * acceptance-read-choke-point.js — the KILL-THE-SEAM structural guard for CROSS-SESSION
 * acceptance-at-integration reads (SP-20260718-005, unit SEC-3). The cross-session analog of
 * scripts/checks/liveness-read-choke-point.js (SAME scan shape: `scan(root) -> {violations, ...}`).
 *
 * THE CLASS (the SP-004 "un-routed reader" class, front-loaded here instead of found round-by-round):
 * an integrator reads a ResultEnvelope's `.success` field directly and authorizes a MERGE on it — no
 * trusted AcceptanceRecord, no `acceptance-record.js#authorizesIntegration`. A provider's self-report
 * NEVER authorizes integration (R-2 / AC-4). This guard fails ANY file that gates a merge/integrate
 * action on `.success` without routing through `authorizesIntegration` within a bounded window.
 *
 * CROSS-SESSION EXEMPTION (structural, never a settable marker — mirrors the liveness guard's β teeth):
 * a reader of a FOREIGN-session artifact that is unverifiable/inapplicable by construction is named here
 * with a reason, reviewed as code, and tracked — never opted out by a per-record field. Empty today (no
 * known exemption for this surface); the hook exists so a future one is handled the same disciplined way.
 *
 * BOUNDED LEXICAL GUARD — HONEST CEILING (SP-20260718-005 gauntlet R2/H5, lead ruling): this is a LEXICAL
 * scan (does an `authorizesIntegration` routing reference sit near the `.success` gate), NOT a control/data-
 * flow proof. A lexical scan CANNOT prove the routing call's RESULT actually gates the merge — a NO-OP call
 * (`authorizesIntegration(record, ref);` with the result ignored) satisfies the presence check while the
 * merge runs on `.success` alone. We do NOT pretend otherwise: this guard is DEFENSE-IN-DEPTH. The REAL
 * runtime guarantee is IN-PRIMITIVE — `acceptance-record.js#commitIntegration` (the mutation primitive)
 * INTERNALLY requires `authorizesIntegration` to PASS (fail-closed: mandatory identity + freshness + lease +
 * recompute), so a no-op-call attacker who then tries to actually MERGE is refused inside the primitive,
 * regardless of what the lexical scan saw. The DEFINITIVE close of the lexical ceiling is the Phase-4 pinned
 * external trusted checker (ED-215 family: RATIFIED-PLAN Phase 4 trusted enforcement adapter). Falsifier
 * proving the in-primitive refusal of the no-op-lexical-bypass: acceptance-record.test.js (H5 runtime teeth).
 *
 * Exit: 0 clean · 1 an un-routed integrator gates a merge on ResultEnvelope success · 2 usage/internal.
 */
const fs = require("fs");
const path = require("path");

function resolveRoot() {
  const anchor = path.resolve(__dirname, "..", "..");
  if (fs.existsSync(path.join(anchor, ".claude"))) return anchor;
  return process.env.CLAUDE_PROJECT_DIR || anchor;
}
const ROOT = resolveRoot();

// Scan ALL of scripts/ (mirrors liveness-read-choke-point.js's R5 SR-R5-001 lesson: a fixed sub-dir list
// missed a root-level reader — scan the whole tree instead).
const SCAN_DIRS = ["scripts"];
const EXCLUDE_BASENAMES = new Set([
  "acceptance-record.js", // the verifier + choke-point helper itself (authorizesIntegration lives here)
  "acceptance-read-choke-point.js", // this guard
]);

// STRUCTURAL cross-session exemption allowlist (named + reasoned in code, never a settable per-record
// flag). Empty by design today — see module doc.
const CROSS_SESSION_EXEMPT = Object.freeze({});

// A file is in-scope for this guard only if it plausibly performs a MERGE/INTEGRATE action at all —
// mirrors liveness-read-choke-point's LEDGER_READ pre-filter (narrows the scan, keeps false positives
// bounded on files that merely mention `.success` for unrelated reasons, e.g. HTTP/test-result shapes).
const MERGE_HINT = /merge|integrat/i;
// H2 precision: a success predicate is only a real INTEGRATION gate if an actual merge/integrate ACTION
// sits near it (within the window). File-level MERGE_HINT alone + the broadened bare-truthy `.success`
// form false-positived on incidental `.success` (a filter callback, an object literal, a smoke-test
// conditional) in files that merely MENTION merge. Requiring an action call in the window scopes the flag
// to genuine integrators (e.g. the F9 unrouted-integrator's `mergeInto(ref)`), not incidental references.
const MERGE_ACTION = /\b(?:merge|mergeInto|integrate|commitIntegration|performRefUpdate)\s*\(|git[\s"'`]+merge\b|update-ref/i;
// A `.success` gate — the form a ResultEnvelope merge-gate takes. SP-20260718-005 gauntlet H2 BROADENED
// the prior `=== true` / `!== true` only form (which missed `if (envelope.success)`, `envelope['success']`,
// and negation) to also catch: (i) bare-truthy `.success` NOT followed by `=`/`!` (an assignment or a
// comparison already handled), (ii) bracket access `['success']` / `["success"]`. A regex still can't
// resolve DESTRUCTURED `const {success}=env; if(success)` without dataflow — that is the acknowledged
// AST ceiling (ED-229 class), named-not-grinding: a bounded structural DETECTOR, defense-in-depth on top
// of the structural exemption mechanism, never the sole guarantee.
const SUCCESS_PREDICATE = /\.success\s*===\s*true|\.success\s*!==\s*true|\.success\b(?!\s*[=!])|\[\s*["']success["']\s*\]/;
// Verification is PRESENT if the window references the trusted choke-point.
const VERIFIES = /authorizesIntegration|acceptance-record(\.js)?/;
const WINDOW = 12;
// SP-20260718-005 gauntlet H2: the former `acceptance-verified:` comment PRAGMA was REMOVED — a code
// comment is a SETTABLE annotation (anyone can add it to suppress the guard, proving no real routing).
// A merge-gating `.success` predicate MUST route through the choke-point within the window; a genuine
// shape-only check whose verification lives elsewhere uses the STRUCTURAL cross-session exemption
// (CROSS_SESSION_EXEMPT, reason-tagged + stale-detected), never a comment.

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

function listJs(absDir) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const abs = path.join(absDir, e.name);
    if (e.isDirectory()) out.push(...listJs(abs));
    else if (e.isFile() && e.name.endsWith(".js") && !e.name.endsWith(".test.js")) out.push(abs);
  }
  return out;
}

function scan(root = ROOT) {
  const violations = [];
  const exemptSeen = [];
  for (const d of SCAN_DIRS) {
    for (const abs of listJs(path.join(root, d))) {
      if (EXCLUDE_BASENAMES.has(path.basename(abs))) continue;
      const rel = path.relative(root, abs).split(path.sep).join("/");
      let text;
      try {
        text = fs.readFileSync(abs, "utf8");
      } catch {
        continue;
      }
      if (!MERGE_HINT.test(text)) continue; // does not plausibly perform a merge/integrate action
      const lines = text.split(/\r?\n/);
      const successLines = [];
      for (let i = 0; i < lines.length; i++) if (SUCCESS_PREDICATE.test(lines[i])) successLines.push(i);
      if (successLines.length === 0) continue; // never gates on a `.success` predicate
      if (CROSS_SESSION_EXEMPT[rel]) {
        exemptSeen.push(rel);
        continue;
      }
      for (const i of successLines) {
        const from = Math.max(0, i - WINDOW);
        const to = Math.min(lines.length, i + WINDOW + 1);
        const win = lines.slice(from, to).join("\n");
        const winClean = stripComments(win);
        // H2 precision gate: only flag a success predicate that sits near an actual merge/integrate ACTION
        // — an incidental `.success` (filter/object-literal/smoke conditional) in a merge-mentioning file
        // is not an integration gate and must not trip the broadened detector.
        if (!MERGE_ACTION.test(winClean)) continue;
        if (!VERIFIES.test(winClean)) {
          violations.push({
            file: rel,
            line: i + 1,
            what: `a ResultEnvelope success predicate (\`${lines[i].trim().slice(0, 80)}\`) authorizing a merge with NO acceptance-record routing within ±${WINDOW} lines — route it through acceptance-record.js#authorizesIntegration, or add a reason-tagged STRUCTURAL cross-session exemption (never a code comment, H2 fix)`,
          });
        }
      }
    }
  }
  const staleExempt = Object.keys(CROSS_SESSION_EXEMPT).filter((f) => !fs.existsSync(path.join(root, f)));
  return { violations, exemptSeen, staleExempt };
}

module.exports = { scan, MERGE_HINT, SUCCESS_PREDICATE, VERIFIES, CROSS_SESSION_EXEMPT };

if (require.main === module) {
  const json = process.argv.includes("--json");
  let res;
  try {
    res = scan();
  } catch (e) {
    process.stderr.write(`acceptance-read-choke-point: internal error (fail-closed): ${e.message}\n`);
    process.exit(2);
  }
  const fail = res.violations.length > 0 || res.staleExempt.length > 0;
  if (json) {
    process.stdout.write(JSON.stringify(res, null, 2) + "\n");
  } else if (!fail) {
    process.stdout.write(
      `OK   [acceptance-read-choke-point] every merge/integrate reader routes through acceptance-record.authorizesIntegration` +
        ` (${res.exemptSeen.length} cross-session reader(s) structurally exempt). NOTE: bounded LEXICAL guard` +
        ` (defense-in-depth) — the runtime guarantee is IN-PRIMITIVE (commitIntegration requires` +
        ` authorizesIntegration); definitive close = Phase-4 pinned trusted checker (ED-215 family).\n`,
    );
  } else {
    if (res.violations.length) {
      process.stdout.write(`FAIL [acceptance-read-choke-point] ${res.violations.length} un-routed integrator(s) trust ResultEnvelope.success directly:\n`);
      for (const v of res.violations) process.stdout.write(`  ${v.file}${v.line ? ":" + v.line : ""}\n    ${v.what}\n`);
      process.stdout.write("  Route the merge/integrate decision through scripts/dispatch/acceptance-record.js#authorizesIntegration, or add a STRUCTURAL cross-session exemption with a reason.\n");
    }
    for (const f of res.staleExempt) process.stdout.write(`  STALE cross-session exemption for a non-existent file: ${f}\n`);
  }
  process.exit(fail ? 1 : 0);
}
