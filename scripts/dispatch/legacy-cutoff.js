#!/usr/bin/env node
"use strict";

/**
 * legacy-cutoff.js — the ONE shared "legacy scoping" cutoff for the coverage
 * enforce paths (SP-20260611-002 R-5 / R-8, AC-5.4 SHARED CUTOFF — Hard AC #3).
 *
 * THE PROBLEM THIS CLOSES: two enforce paths — coverage-gate-scan (R-5) and
 * check-ac-coverage (R-8) — each need a "records before the new enforce path was
 * wired are LEGACY and exempt; records after it still RED" rule (scope-then-flip,
 * not scope-as-loophole). If each ticket hardcodes its own date string, the two
 * cutoffs DRIFT independently — exactly the failure shape the sibling enforcers
 * already exhibit (`sprint-hook-coverage.js` and `sprint-manager-consult.js` each
 * declare their OWN `RECORD_BACKED_CUTOFF = "2026-06-10"` literal, so a change to
 * one silently leaves the other behind). This module is the single source the new
 * consumers import, so a cutoff change is ONE edit, not N.
 *
 * SHARED-CUTOFF CONTRACT (stable export surface — R-8/WS-G3c consumes this, do not
 * fork it):
 *
 *   const { LEGACY_CUTOFF, cutoffFor, isLegacyDate, recordIsLegacy }
 *     = require("./legacy-cutoff");
 *
 *   - LEGACY_CUTOFF                 : ISO date (YYYY-MM-DD). The default cutoff:
 *                                     records dated STRICTLY BEFORE it are legacy
 *                                     (exempt); records dated >= it are in scope of
 *                                     the new enforce path and still RED.
 *   - cutoffFor(consumer?)          : the cutoff for a named consumer. Returns the
 *                                     shared LEGACY_CUTOFF unless that consumer's
 *                                     enforce path was GENUINELY wired on a different
 *                                     date — in which case the divergence is declared
 *                                     EXPLICITLY in CONSUMER_OVERRIDES below WITH a
 *                                     written rationale (never a silent second drift).
 *   - isLegacyDate(date, cutoff?)   : true iff `date` (ISO string or Date) is
 *                                     strictly before the cutoff → exempt. An
 *                                     UNDATED / unparseable input is NOT legacy
 *                                     (fail-CLOSED — an undatable record is never
 *                                     auto-exempted; the new enforce path still
 *                                     applies, per AC-5.5 scope-then-flip).
 *   - recordIsLegacy(rec, opts?)    : convenience for a ledger/AC record — pulls a
 *                                     date field (ts / created_at / date / sprint
 *                                     start) and applies isLegacyDate. Same
 *                                     fail-closed posture: no extractable date ⇒ NOT
 *                                     legacy.
 *
 * Zero runtime deps (Node core only). PURE + side-effect-free so it is safe to
 * require from a hook or a /scan check.
 */

/**
 * The shared cutoff. Records dated STRICTLY BEFORE this are legacy (exempt from the
 * new coverage-enforce path); records on or after it are in scope and still RED.
 *
 * Chosen as the date the NEW coverage-enforce paths in this sprint (R-5 + R-8) were
 * wired: 2026-06-11 (SP-20260611-002). Matches the sibling enforcers' record-backed
 * convention (`RECORD_BACKED_CUTOFF`) — a single literal both new consumers share so
 * legacy scoping cannot become a per-ticket loophole. To move the cutoff, edit HERE
 * ONLY; both consumers follow.
 */
const LEGACY_CUTOFF = "2026-06-11";

/**
 * Per-consumer cutoff overrides — the ESCAPE HATCH AC-5.4 mandates be EXPLICIT.
 * EMPTY by design: R-5 (coverage-gate-scan) and R-8 (check-ac-coverage) had their
 * enforce paths wired in the SAME sprint on the SAME date, so they share
 * LEGACY_CUTOFF with no divergence. If a future consumer's enforce path is wired on
 * a genuinely different date, add an entry here as:
 *
 *   "consumer-name": { cutoff: "YYYY-MM-DD", rationale: "<why this date differs>" }
 *
 * — so the divergence is declared per-ticket with a written rationale, NEVER two
 * independently-drifting hardcoded literals. `cutoffFor` returns the shared default
 * for any consumer NOT listed here.
 */
const CONSUMER_OVERRIDES = Object.freeze({
  // (empty — R-5 + R-8 share LEGACY_CUTOFF; no genuine wiring-date divergence)
});

/** The known consumers of this shared cutoff (documentation + a stable surface for tests). */
const CONSUMERS = Object.freeze(["coverage-gate-scan", "check-ac-coverage"]);

/**
 * The cutoff for a named consumer. Returns the shared LEGACY_CUTOFF unless the
 * consumer is declared in CONSUMER_OVERRIDES with an explicit rationale.
 *   cutoffFor()                       -> LEGACY_CUTOFF
 *   cutoffFor("coverage-gate-scan")   -> LEGACY_CUTOFF (no override)
 *   cutoffFor("check-ac-coverage")    -> LEGACY_CUTOFF (no override)
 */
function cutoffFor(consumer) {
  const o = consumer && CONSUMER_OVERRIDES[consumer];
  return o && typeof o.cutoff === "string" && o.cutoff ? o.cutoff : LEGACY_CUTOFF;
}

/** Normalize an ISO date / Date to the leading YYYY-MM-DD, or null if unparseable. */
function toIsoDay(date) {
  if (date == null) return null;
  if (date instanceof Date) {
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }
  const s = String(date).trim();
  // Accept a bare YYYY-MM-DD or a full ISO timestamp; reject anything without a
  // leading date. A lexical compare of YYYY-MM-DD strings is a valid chronological
  // compare, so we don't need Date parsing for the common case.
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  // Last resort: let Date try (handles e.g. RFC-2822). Still fail-closed on NaN.
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * isLegacyDate(date, cutoff?) -> boolean
 *   true  iff `date` is strictly BEFORE the cutoff (legacy/exempt).
 *   false if `date` is on/after the cutoff (in scope of the new enforce path → RED),
 *         OR if `date` is undated/unparseable (FAIL-CLOSED: an undatable record is
 *         never auto-exempted — the scope-then-flip posture of AC-5.5).
 */
function isLegacyDate(date, cutoff = LEGACY_CUTOFF) {
  const day = toIsoDay(date);
  if (day === null) return false; // fail-closed: undatable ⇒ NOT legacy
  const cut = toIsoDay(cutoff) || LEGACY_CUTOFF;
  return day < cut;
}

/**
 * recordIsLegacy(rec, { cutoff?, dateFields? }) -> boolean
 * Convenience for a ledger/AC record: extracts a date from the first present of
 * `dateFields` (default ts/created_at/date/started_at/sprint_date) and applies
 * isLegacyDate. Same fail-closed posture — a record with no extractable date is NOT
 * legacy (the new enforce path still applies).
 */
function recordIsLegacy(rec, opts = {}) {
  const cutoff = opts.cutoff || LEGACY_CUTOFF;
  const fields = opts.dateFields || ["ts", "created_at", "date", "started_at", "sprint_date"];
  if (!rec || typeof rec !== "object") return false; // fail-closed
  for (const f of fields) {
    if (rec[f] != null && toIsoDay(rec[f]) !== null) {
      return isLegacyDate(rec[f], cutoff);
    }
  }
  return false; // no extractable date ⇒ NOT legacy (fail-closed)
}

module.exports = {
  LEGACY_CUTOFF,
  CONSUMER_OVERRIDES,
  CONSUMERS,
  cutoffFor,
  isLegacyDate,
  recordIsLegacy,
  toIsoDay,
};
