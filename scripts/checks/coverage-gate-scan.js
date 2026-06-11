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
const { LEGACY_CUTOFF, cutoffFor, isLegacyDate } = require("../dispatch/legacy-cutoff");

const NAME = "coverage-gate-scan";

function flagVal(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : dflt;
}

/**
 * AC-5.3 — EXTERNAL expected-roles source. The old self-audit derived `expected`
 * ONLY from the roles that CLAIM ok:true in the run, so a role that produced NO
 * record was never expected and its omission read clean (the "omitted-role slip").
 * The expected set must come from an EXTERNAL source (registry / sprint composition)
 * so a role that ran NOTHING is still expected → still a gap.
 *
 * `expectedSource` is resolved per-run as one of:
 *   - a function (runId, runRecs) => [roleString | {role,...}]   (caller-supplied),
 *   - a plain map { [runId]: [...] }  (e.g. sprint-composition derived), or
 *   - an array  [...]                 (one external set for ALL runs).
 * When NO external source is supplied, the legacy self-derive (roles that claim
 * ok:true) is the FALLBACK — but it is UNION'd with any external set so a supplied
 * source can only ADD expectations, never shrink them below the claimed set.
 */
function resolveExpected(expectedSource, runId, runRecs) {
  let external = null;
  if (typeof expectedSource === "function") {
    external = expectedSource(runId, runRecs);
  } else if (expectedSource && typeof expectedSource === "object" && !Array.isArray(expectedSource)) {
    external = expectedSource[runId] != null ? expectedSource[runId] : expectedSource["*"];
  } else if (Array.isArray(expectedSource)) {
    external = expectedSource;
  }
  // claimed = the legacy self-derive (distinct ok:true roles in this run).
  const claimed = [...new Set(runRecs.filter((r) => r && r.ok === true && r.role).map((r) => r.role))];
  const normExternal = Array.isArray(external)
    ? external.map((e) => (typeof e === "string" ? { role: e } : e)).filter((e) => e && e.role)
    : [];
  // UNION external ∪ claimed, external entries (which may carry shape/plan_item/waiver)
  // taking precedence over a bare claimed role of the same name.
  const byRole = new Map();
  for (const role of claimed) byRole.set(role, { role });
  for (const e of normExternal) byRole.set(e.role, e);
  return [...byRole.values()];
}

/**
 * Audit a ledger's records run-by-run. Pure given `records`. Returns
 *   { runs: [{ runId, ok, violations[], covered[], missing[], waived[], legacyExempt }],
 *     totalViolations, totalCovered, runCount, cutoff, legacyExemptRuns }
 * Records lacking a run_id are bucketed under "(no-run-id)" and evaluated as a pool.
 *
 * opts:
 *   expectedSource : AC-5.3 external expected-roles source (see resolveExpected).
 *   cutoff         : AC-5.5 legacy-scoping cutoff (default the SHARED LEGACY_CUTOFF
 *                    for this consumer). A run whose date is STRICTLY BEFORE the
 *                    cutoff is LEGACY — its violations are reported as INFO, not
 *                    counted as gaps. A run dated ON/AFTER the cutoff (or undated)
 *                    still REDS — scope-then-flip, never scope-as-loophole.
 *   runDateOf      : (runId, runRecs) => ISO date | null — how to date a run. Default
 *                    = the max record `ts`/`date` in the run (an undatable run is NOT
 *                    legacy → still in scope, fail-closed).
 */
function auditLedger(records, opts = {}) {
  const recs = Array.isArray(records) ? records.filter(Boolean) : [];
  const expectedSource = opts.expectedSource || null;
  const cutoff = opts.cutoff || cutoffFor("coverage-gate-scan");
  const runDateOf =
    typeof opts.runDateOf === "function"
      ? opts.runDateOf
      : (_runId, runRecs) => {
          // Default run date = the newest record date in the run (so a single
          // post-cutoff record keeps the whole run in scope — the safe direction).
          let newest = null;
          for (const r of runRecs) {
            const d = r && (r.ts || r.date || r.created_at);
            if (d && (newest === null || String(d) > String(newest))) newest = d;
          }
          return newest;
        };
  const buckets = new Map();
  for (const r of recs) {
    const id = r && typeof r.run_id === "string" && r.run_id ? r.run_id : "(no-run-id)";
    if (!buckets.has(id)) buckets.set(id, []);
    buckets.get(id).push(r);
  }
  const runs = [];
  let totalViolations = 0;
  let totalCovered = 0;
  let legacyExemptRuns = 0;
  for (const [id, runRecs] of buckets) {
    const runId = id === "(no-run-id)" ? null : id;
    let res;
    try {
      // AC-5.3: expected derives from the EXTERNAL source (∪ the claimed-roles
      // fallback). A throwing external source must FAIL-CLOSED to a per-run
      // violation — never a silent green, never a whole-audit crash.
      const expected = resolveExpected(expectedSource, id, runRecs);
      res = evaluate({ records: runRecs, expected, runId });
    } catch (e) {
      res = { ok: false, violations: [`coverage audit FAILED-CLOSED for run ${id}: ${e && e.message ? e.message : e}`], covered: [], missing: [], waived: [] };
    }
    // AC-5.5: legacy scoping. A run dated STRICTLY BEFORE the cutoff is historic —
    // its violations are INFO, not gaps (so the flip doesn't red genuinely old runs).
    // An undated/on-after run still REDS (scope-then-flip).
    const runDate = runDateOf(id, runRecs);
    const legacyExempt = isLegacyDate(runDate, cutoff);
    if (legacyExempt) {
      legacyExemptRuns++;
      runs.push({ runId: id, ...res, legacyExempt: true, legacyViolations: res.violations, violations: [] });
    } else {
      totalViolations += res.violations.length;
      runs.push({ runId: id, ...res, legacyExempt: false });
    }
    totalCovered += res.covered.length;
  }
  return { runs, totalViolations, totalCovered, runCount: runs.length, cutoff, legacyExemptRuns };
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
  // AC-5.2: every ACTIVE waiver (a silenced role) is SURFACED — visible at /scan,
  // not hidden — with its provenance, so an operator can see WHO silenced WHAT.
  const allWaived = [];
  for (const run of audit.runs) {
    for (const w of run.waived || []) allWaived.push({ runId: run.runId, ...w });
  }
  if (asJson) {
    process.stdout.write(
      JSON.stringify(
        {
          ok: gaps === 0,
          check: NAME,
          reportOnly: !enforce,
          cutoff: audit.cutoff,
          counts: {
            runs: audit.runCount,
            covered: audit.totalCovered,
            gaps,
            waived: allWaived.length,
            legacyExemptRuns: audit.legacyExemptRuns,
          },
          waived: allWaived,
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
    surfaceWaivers(allWaived);
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
    surfaceWaivers(allWaived);
  }

  // REPORT-ONLY: exit 0 unless --enforce (the ramp tail). Fail-open already
  // returned 0 above on any read/audit error.
  if (gaps === 0) return 0;
  return enforce ? 1 : 0;
}

// AC-5.2: render the active waivers (silenced roles) so they are VISIBLE at /scan.
// A provenance-backed waiver is legitimate — but it must never be HIDDEN, so the
// operator can audit WHO silenced WHAT, WHEN, and against WHAT trail.
function surfaceWaivers(allWaived) {
  if (!allWaived || !allWaived.length) return;
  process.stdout.write(
    `INFO [${NAME}] ${allWaived.length} active waiver(s) (silenced role(s), surfaced — not hidden):\n`,
  );
  for (const w of allWaived) {
    const p = w.provenance || {};
    const who = p.operator || "?";
    const when = p.ts || "?";
    const trail = p.trail || "?";
    process.stdout.write(
      `  - [run ${w.runId}] role '${w.role}' WAIVED by ${who} @ ${when} (trail ${trail}): ${w.reason || p.reason || ""}\n`,
    );
  }
}

if (require.main === module) process.exit(main());

module.exports = { auditLedger, resolveExpected, surfaceWaivers, LEGACY_CUTOFF };
