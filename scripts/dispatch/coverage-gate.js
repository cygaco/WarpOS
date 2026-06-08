#!/usr/bin/env node
"use strict";

/**
 * coverage-gate.js — N-1: the dispatch-coverage gate ("sprint theater" killer).
 *
 * PLAN §2(i) / §17.4 / E-DISPATCH-INTEGRITY RC-2: a sprint phase can today record
 * "coverage" with ZERO real dispatch behind it, or skip a binding reviewer, or run
 * a Claude clone in place of a cross-provider reviewer — all read green. This gate
 * makes a backing `ok:true` completion record the PRECONDITION for "covered":
 *
 *   - every EXPECTED role must have an `ok:true`, BACKED (dispatch_id +
 *     cmdline_checksum) completion record for the run — else it's an unbacked
 *     coverage claim (sprint theater),
 *   - a role whose contract requires cross-provider review must NOT be satisfied
 *     by a provider=claude record (diversity / no-verdict-on-own-work),
 *   - a record claiming ok:true WITHOUT a dispatch_id/cmdline_checksum is a
 *     hand-authored phantom row and is REJECTED.
 *
 * Expected obligations are read from the dispatch-contract keystone (§17.1) per
 * role. `evaluate()` is pure (synthetic records + expectations -> verdict) so it
 * is P5-testable with planted violations. REPORT-ONLY by default (PLAN §4 ramp);
 * --enforce / WARPOS_COVERAGE_GATE_ENFORCE=block makes a violation exit non-zero.
 *
 * Zero runtime deps.
 */

const fs = require("fs");
const path = require("path");
const { contractForRole } = require("./dispatch-contract");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

/** A real dispatch record is BACKED iff a wrapper wrote it (not hand-authored). */
function isBackedRecord(r) {
  return !!(r && typeof r.dispatch_id === "string" && r.dispatch_id && typeof r.cmdline_checksum === "string" && r.cmdline_checksum);
}

/**
 * evaluate({ records, expected, runId }) -> { ok, violations[], covered[], missing[] }
 *   records  : completion records (objects) from the ledger.
 *   expected : [{ role, shape?, plan_item_id? }] — the roles a phase CLAIMS it covered.
 *   runId    : when set, only records with this run_id count (a record from another
 *              run cannot satisfy this run's coverage).
 */
function evaluate(input) {
  const { records = [], expected = [], runId = null } = input || {};
  const violations = [];
  const covered = [];
  const missing = [];
  const pool = (runId ? records.filter((r) => r && r.run_id === runId) : records.slice()).filter(Boolean);

  for (const exp of expected) {
    const role = exp && exp.role;
    if (!role) {
      violations.push("expected entry with no role");
      continue;
    }
    let c = null;
    try {
      c = contractForRole(role);
    } catch {
      /* contract unavailable — still enforce backed-record presence */
    }
    const hit = pool.find(
      (r) =>
        r.role === role &&
        r.ok === true &&
        isBackedRecord(r) &&
        (!exp.shape || r.shape === exp.shape) &&
        (!exp.plan_item_id || r.plan_item_id === exp.plan_item_id),
    );
    if (!hit) {
      missing.push(role);
      violations.push(
        `expected role '${role}'${exp.shape ? ` (shape ${exp.shape})` : ""} has NO ok:true backed completion record${runId ? ` for run ${runId}` : ""} — coverage claim is UNBACKED (sprint-theater guard).`,
      );
      continue;
    }
    if (c && c.coverage && c.coverage.cross_provider_required && hit.provider === "claude") {
      violations.push(
        `role '${role}' requires cross-provider review but its record shows provider=claude — a Claude clone graded Claude's work (diversity violation).`,
      );
    }
    covered.push({ role, dispatch_id: hit.dispatch_id, provider: hit.provider || null, shape: hit.shape || null });
  }

  // phantom-coverage guard: any ok:true record in the pool that is NOT backed.
  for (const r of pool) {
    if (r.ok === true && !isBackedRecord(r)) {
      violations.push(
        `a completion record (role=${r.role || "?"}) claims ok:true but lacks dispatch_id/cmdline_checksum — hand-authored phantom coverage row REJECTED.`,
      );
    }
  }

  return { ok: violations.length === 0, violations, covered, missing };
}

/** Read the canonical dispatch-completions ledger as an array of records. */
function readLedger(file) {
  const f = file || process.env.WARPOS_COVERAGE_LEDGER || path.join(PROJECT_ROOT, ".claude", "runtime", "dispatch-completions.jsonl");
  let txt;
  try {
    txt = fs.readFileSync(f, "utf8");
  } catch {
    return [];
  }
  const out = [];
  for (const line of txt.split(/\r?\n/)) {
    const s = line.trim();
    if (!s) continue;
    try {
      out.push(JSON.parse(s));
    } catch {
      /* skip malformed line */
    }
  }
  return out;
}

/** Parse `role:shape,role2` into [{role, shape?}]. */
function parseExpect(spec) {
  return String(spec || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((tok) => {
      const [role, shape] = tok.split(":");
      return shape ? { role, shape } : { role };
    });
}

module.exports = { evaluate, readLedger, isBackedRecord, parseExpect };

// ── CLI ─────────────────────────────────────────────────────
if (require.main === module) {
  const argv = process.argv.slice(2);
  const flag = (n) => {
    const i = argv.indexOf(n);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
  };
  const runId = flag("--run");
  const expected = parseExpect(flag("--expect"));
  const enforce = argv.includes("--enforce") || process.env.WARPOS_COVERAGE_GATE_ENFORCE === "block";
  const records = readLedger(flag("--ledger"));
  const res = evaluate({ records, expected, runId });
  process.stdout.write(
    JSON.stringify({ mode: enforce ? "blocking" : "report-only", run: runId, ...res }, null, 2) + "\n",
  );
  // Report-only: always exit 0 (surface the violations, don't block). Blocking:
  // exit non-zero on any violation (the §4-flipped state).
  process.exit(enforce && !res.ok ? 1 : 0);
}
