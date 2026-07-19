#!/usr/bin/env node
// scripts/dispatch/dispatch-record-fields.js
// Additive dispatch-ledger record fields — the pure mechanism for WG-13
// (write-ahead started-row) and WG-11(a) (quota field): pure builders +
// predicates, path-resolution-free by design (the canonical ledger file lives
// in scripts/dispatch-agent.js#ledgerFile/canonicalFile — the CALLER supplies
// it here so this module never forks the sink's path logic).
//
// WIRED (SP-20260718-005 BE-2 / ED-069 + ED-070): dispatch-agent.js exports a
// `recordDispatchStart()` wrapper (this file's recordStart() + its own
// canonical ledger path) and calls it pre-spawn; dispatch-claude.js imports
// the SAME wrapper; epsilon-runtime.js's CLAUDE_RAW route (the one raw
// subprocess spawn it performs itself) calls it too. recordCompletion (the
// single sink) stamps a `quota` fragment (quotaField()) on every completion
// record, defaulting to the honest `{known:false}` shape when a caller hasn't
// supplied real quota knowledge — so EVERY writer's record carries a `quota`
// field with zero per-call-site duplication. See
// scripts/checks/all-writers-route-recordCompletion.js for the structural
// guard that keeps a future writer from bypassing recordCompletion and
// forking this shape.
//
// ── WG-13: write-ahead started-row ───────────────────────────────────────────
// The dispatch ledger is append-only; today the ONLY row is the terminal
// completion (ok:true/false). A dispatch that dies AFTER spawn but BEFORE
// writing its completion leaves NO row at all → gauntlet-verify reads
// "no-record" (correct: absence == death). But there is no positive evidence a
// dispatch was even ATTEMPTED. A write-ahead "started" row (written pre-spawn)
// supplies that evidence WITHOUT ever being mistaken for a completion:
//   • it carries phase:"started" and ok:false, so gauntlet-verify's
//     isWellFormedOkRecord() (which requires ok===true) can NEVER count it as
//     "ran"/complete — "gauntlet-verify doesn't count started-as-complete" holds
//     by construction;
//   • isStartedRow() lets the reader classify it as a distinct "started"
//     (in-progress) status instead of misreading it as "failed" (errored).
//
// ── WG-11(a): quota field ────────────────────────────────────────────────────
// An additive `quota` fragment stamped onto completion/death records so later
// analysis can correlate a dispatch outcome with the provider's known
// quota/billing posture at dispatch time (codex weekly limits, gemini tier
// block, prepaid-credit exhaustion). Honest telemetry: it records only what the
// caller KNOWS; it does not invent a live quota API.

"use strict";

const fs = require("fs");
const path = require("path");

// rotate.js is deliberately dependency-light (fs/path only, no side effects
// on require) — see its header. Requiring it here keeps this file's
// "zero wiring / pure builders" contract intact while adding write-time
// rotation to appendRecord(). Best-effort: an unavailable rotate lib must
// never break appendRecord's existing fail-open contract.
let _rotate = null;
try {
  _rotate = require("../hooks/lib/rotate");
} catch {
  _rotate = null;
}

const STARTED_PHASE = "started";

/**
 * Build a write-ahead started-row record (WG-13). Written to the SAME
 * completions ledger BEFORE spawn. Never a valid completion:
 *   - phase: "started"
 *   - ok: false            (isWellFormedOkRecord requires ok===true)
 * Carries the correlation keys gauntlet-verify uses (role/provider/started_at,
 * plus dispatch_id and any sprint_id) so the row is time/sprint-attributable.
 *
 * @param {object} f
 * @param {string} f.role
 * @param {string} f.provider
 * @param {string} [f.model]
 * @param {string} [f.dispatch_id]
 * @param {string} [f.sprint_id]
 * @param {string} [f.started_at] ISO; defaults to now
 * @param {object} [extra] additional additive fields (e.g. runContext())
 */
function startedRow(f = {}, extra = {}) {
  if (typeof f.role !== "string" || !f.role.trim()) {
    throw new Error("startedRow: role is required");
  }
  if (typeof f.provider !== "string" || !f.provider.trim()) {
    throw new Error("startedRow: provider is required");
  }
  const startedAt = f.started_at || new Date().toISOString();
  const row = {
    phase: STARTED_PHASE,
    dispatch_id: f.dispatch_id || null,
    role: f.role,
    provider: f.provider,
    model: f.model || null,
    started_at: startedAt,
    // ok is FALSE on purpose — a started row is not a success. gauntlet-verify's
    // typed-success check requires ok===true, so this can never green a lane.
    ok: false,
    ...extra,
  };
  if (f.sprint_id) row.sprint_id = f.sprint_id;
  return row;
}

/**
 * Reader predicate (WG-13): is this ledger record a write-ahead started-row?
 * BOM/shape tolerant — a non-object or wrong-phase record is simply not a
 * started row (never throws).
 */
function isStartedRow(rec) {
  return !!rec && typeof rec === "object" && rec.phase === STARTED_PHASE;
}

/**
 * A started-row is "superseded" once a terminal completion for the SAME
 * dispatch_id exists. Helper for a future reader that wants to prune resolved
 * started-rows. Pure; caller supplies the record set.
 */
function startedRowSuperseded(startedRec, allRecords) {
  if (!isStartedRow(startedRec) || !startedRec.dispatch_id) return false;
  return allRecords.some(
    (r) =>
      r &&
      !isStartedRow(r) &&
      r.dispatch_id === startedRec.dispatch_id &&
      typeof r.completed_at !== "undefined",
  );
}

/**
 * Build the additive quota fragment (WG-11a) to spread into a completion/death
 * record: `{ quota: { provider, checked_at, known, ... } }`.
 *
 * Honest telemetry: records only what the caller passes. With no known values
 * it records `{ known: false }` rather than fabricating a quota reading.
 *
 * @param {string} provider
 * @param {object} [known] known posture at dispatch time, e.g.
 *   { auth_mode, plan, credits_remaining, tier_ok, note }
 */
function quotaField(provider, known = {}) {
  const q = {
    provider: provider || null,
    checked_at: new Date().toISOString(),
  };
  const keys = [
    "auth_mode",
    "plan",
    "credits_remaining",
    "requests_remaining",
    "tier_ok",
    "note",
    "source",
  ];
  let any = false;
  for (const k of keys) {
    if (known[k] !== undefined && known[k] !== null) {
      q[k] = known[k];
      any = true;
    }
  }
  q.known = any;
  return { quota: q };
}

/**
 * BE-2 (ED-069) WIRING: compose startedRow() + appendRecord() into ONE call so
 * a writer emits a correctly-shaped write-ahead started-row with a single line
 * of code. Deliberately PATH-AGNOSTIC (this module stays pure/path-resolution-
 * free by design — see file header): the CALLER supplies the canonical ledger
 * file (dispatch-agent.js#ledgerFile/canonicalFile), so a started-row lands in
 * the EXACT SAME file recordCompletion writes to — never a second/forked
 * ledger. A completion later correlates to its start by dispatch_id
 * (startedRowSuperseded()).
 *
 * Throws exactly when startedRow() would (missing role/provider — a caller
 * bug that should be loud in dev). Callers that must never let telemetry
 * crash a live dispatch should wrap this in try/catch (mirrors recordCompletion's
 * own fail-open discipline at the call site).
 *
 * @param {string} file absolute path to the dispatch-completions ledger
 * @param {object} fields see startedRow()
 * @param {object} [extra] additional additive fields (e.g. runContext())
 * @returns {boolean} true on a successful append (mirrors appendRecord)
 */
function recordStart(file, fields = {}, extra = {}) {
  const row = startedRow(fields, extra);
  return appendRecord(file, row);
}

/**
 * Atomic append of a record to a JSONL ledger (tmp + rename per line is
 * overkill for append; appendFileSync of one line is already atomic on the
 * platforms we run). Fail-open: telemetry never blocks dispatch. Provided so a
 * future writer can emit a started-row in one call.
 */
function appendRecord(file, record) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    // Write-time rotation before the append — CLOSED over the SINK_CAPS
    // allowlist (F-ROT-4). rotateSink is a no-op for any path that is NOT a
    // known sink; we must NEVER rotate an arbitrary caller-supplied path (that
    // was the unknown-sink fallback bug — it could archive-move any file the
    // caller named). rotate.js functions never throw, but guard the call itself
    // too so a future rotate.js change can't regress this file's fail-open
    // contract.
    if (_rotate) {
      try {
        _rotate.rotateSink(file); // known sinks only; unknown → no-op
      } catch {
        /* rotation is best-effort */
      }
    }
    fs.appendFileSync(file, JSON.stringify(record) + "\n");
    return true;
  } catch {
    return false; // fail-open
  }
}

module.exports = {
  STARTED_PHASE,
  startedRow,
  isStartedRow,
  startedRowSuperseded,
  recordStart,
  quotaField,
  appendRecord,
};
