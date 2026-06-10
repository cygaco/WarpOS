#!/usr/bin/env node
"use strict";

/**
 * coverage-gate-scan.js — the LIVE CALLER for coverage-gate.js evaluate()
 * (S-LC-06 / PLAN §2.6 + §8.7). `coverage-gate.js evaluate()` is built + P5-tested
 * but had NO live caller — this wires it into the `/scan:full` runtime as a
 * report-only ledger audit (the "low-hanging wiring" the plan names).
 *
 * WHAT IT DOES: reads the dispatch-completions ledger (the same JSONL the wrappers
 * write), groups records by run_id, and for each run derives `expected` = the
 * distinct roles that CLAIM coverage (an ok:true record) in that run, then runs
 * `evaluate()` to surface the sprint-theater class WITHOUT a per-run --expect:
 *   - a role that CLAIMS ok:true but the claim is unbacked / blind (no artifact
 *     proof) / stale-schema → a coverage GAP,
 *   - a cross-provider role satisfied by a provider=claude record (diversity),
 *   - a hand-authored phantom ok:true row (no dispatch_id/cmdline_checksum).
 * This is the static-scan complement to the per-phase runtime gate (which needs an
 * explicit --run/--expect); here the ledger audits ITSELF.
 *
 * RAMP: REPORT-ONLY this sprint — it reports gaps and ALWAYS exits 0 (it does not
 * block /scan:full). The `--enforce` flag (exit 1 on a gap) is the documented ramp
 * tail, not wired into any gate yet. FAIL-OPEN: a malformed/unreadable ledger or
 * any internal error yields a note and exit 0 — an advisory audit must never break
 * the scan. (This is a deliberate departure from the fail-CLOSED posture of the
 * BLOCKING /scan:full enforcers; it matches the brief's report-only + fail-open.)
 *
 *   node scripts/checks/coverage-gate-scan.js [--json] [--enforce] [--ledger <path>]
 */

const path = require("path");
const { evaluate, readLedger } = require("../dispatch/coverage-gate");

const NAME = "coverage-gate-scan";

function flagVal(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : dflt;
}

/**
 * Audit a ledger's records run-by-run. Pure given `records`. Returns
 *   { runs: [{ runId, ok, violations[], covered[], missing[], waived[] }],
 *     totalViolations, totalCovered, runCount }
 * Records lacking a run_id are bucketed under "(no-run-id)" and evaluated as a pool.
 */
function auditLedger(records) {
  const recs = Array.isArray(records) ? records.filter(Boolean) : [];
  const buckets = new Map();
  for (const r of recs) {
    const id = r && typeof r.run_id === "string" && r.run_id ? r.run_id : "(no-run-id)";
    if (!buckets.has(id)) buckets.set(id, []);
    buckets.get(id).push(r);
  }
  const runs = [];
  let totalViolations = 0;
  let totalCovered = 0;
  for (const [id, runRecs] of buckets) {
    // expected = distinct roles that CLAIM coverage (an ok:true record) in this run.
    const expected = [...new Set(runRecs.filter((r) => r && r.ok === true && r.role).map((r) => r.role))]
      .map((role) => ({ role }));
    // runId only narrows when these records actually carry that id (the no-run-id
    // bucket evaluates as a flat pool — runId:null means "use all records").
    const runId = id === "(no-run-id)" ? null : id;
    let res;
    try {
      res = evaluate({ records: runRecs, expected, runId });
    } catch (e) {
      res = { ok: false, violations: [`evaluate() threw for run ${id}: ${e && e.message ? e.message : e}`], covered: [], missing: [], waived: [] };
    }
    totalViolations += res.violations.length;
    totalCovered += res.covered.length;
    runs.push({ runId: id, ...res });
  }
  return { runs, totalViolations, totalCovered, runCount: runs.length };
}

function main() {
  const asJson = process.argv.includes("--json");
  const enforce = process.argv.includes("--enforce");
  const ledgerPath = flagVal("--ledger", null);

  let records;
  try {
    // readLedger is itself fail-open (skips malformed lines, returns [] if
    // unreadable) — so a corrupt/absent ledger degrades to an empty audit.
    records = readLedger(ledgerPath || undefined);
  } catch (e) {
    // FAIL-OPEN: never break /scan:full on a ledger read error.
    const msg = String((e && e.message) || e);
    process.stdout.write(
      (asJson ? JSON.stringify({ ok: true, check: NAME, reportOnly: true, note: `ledger unreadable (fail-open): ${msg}` })
        : `OK   [${NAME}] ledger unreadable — fail-open, nothing to audit (${msg})`) + "\n",
    );
    return 0;
  }

  let audit;
  try {
    audit = auditLedger(records);
  } catch (e) {
    const msg = String((e && e.message) || e);
    process.stdout.write(
      (asJson ? JSON.stringify({ ok: true, check: NAME, reportOnly: true, note: `audit error (fail-open): ${msg}` })
        : `OK   [${NAME}] audit error — fail-open (${msg})`) + "\n",
    );
    return 0;
  }

  const gaps = audit.totalViolations;
  if (asJson) {
    process.stdout.write(
      JSON.stringify(
        {
          ok: gaps === 0,
          check: NAME,
          reportOnly: !enforce,
          counts: { runs: audit.runCount, covered: audit.totalCovered, gaps },
          runs: audit.runs.filter((r) => r.violations.length),
        },
        null,
        2,
      ) + "\n",
    );
  } else if (gaps === 0) {
    process.stdout.write(
      `OK   [${NAME}] ${audit.runCount} run(s), ${audit.totalCovered} role(s) covered, 0 coverage gaps (ledger self-audit)\n`,
    );
  } else {
    process.stdout.write(
      `WARN [${NAME}] ${gaps} coverage gap(s) across ${audit.runCount} run(s)` +
        `${enforce ? "" : " (REPORT-ONLY — not blocking /scan:full this sprint)"}:\n`,
    );
    let shown = 0;
    for (const run of audit.runs) {
      for (const v of run.violations) {
        if (shown++ >= 25) break;
        process.stdout.write(`  - [run ${run.runId}] ${v}\n`);
      }
      if (shown >= 25) break;
    }
    if (gaps > 25) process.stdout.write(`  ... and ${gaps - 25} more\n`);
  }

  // REPORT-ONLY: exit 0 unless --enforce (the ramp tail). Fail-open already
  // returned 0 above on any read/audit error.
  if (gaps === 0) return 0;
  return enforce ? 1 : 0;
}

if (require.main === module) process.exit(main());

module.exports = { auditLedger };
