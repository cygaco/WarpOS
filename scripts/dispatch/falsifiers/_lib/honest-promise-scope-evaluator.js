"use strict";
/**
 * honest-promise-scope-evaluator.js — the S7/AC-1 mechanical scope evaluator (SP-20260720-002 Phase 4).
 * Extracted out of honest-promise-scope.falsifier.test.js (NOT a falsifier itself — a test utility) so a
 * SECOND named test file (trusted-enforcement-scope.test.js, AC-1's own declared verified_by) can reuse the
 * SAME evaluator without `require()`-ing a sibling `.test.js` file as a plain module (which would re-run
 * that file's own `test()` registrations inside the requiring file's process).
 */

const REQUIRED_SCOPE_TERMS = [/artifact-verification/i, /integration-to-main|integration into `?main`?/i];
const REQUIRED_EXCLUSION_TERMS = [/capability grant/i, /protected mutation/i];
const EXCLUSION_MARKER_RE = /NOT\s+(?:covered|this adapter's job)/i;
// An overclaim: a statement that mentions capability-grant/protected-mutation coverage WITHOUT any nearby
// exclusion marker — i.e. it reads as claiming those two powers are ALSO enforced by this adapter.
const OVERCLAIM_ALL_FOUR_RE = /all\s+four\s+core-?2\s+powers|capability grants?\s+and\s+protected mutation\s+(?:are|is)\s+(?:now\s+)?(?:enforced|live|covered)/i;

/**
 * assertScopedHonestly(text) -> {ok, reason?}. The mechanical S7/AC-1 evaluator: `ok:true` iff `text` (a)
 * names BOTH scoped powers (verification, integration-to-main), (b) names BOTH excluded powers WITH an
 * explicit exclusion marker nearby (never silently omitting them), and (c) does NOT contain an overclaim
 * phrase.
 */
function assertScopedHonestly(text) {
  for (const re of REQUIRED_SCOPE_TERMS) {
    if (!re.test(text)) return { ok: false, reason: "promise-missing-scoped-power-claim" };
  }
  if (OVERCLAIM_ALL_FOUR_RE.test(text)) {
    return { ok: false, reason: "promise-overclaims-beyond-artifact-verification+integration-slice" };
  }
  for (const re of REQUIRED_EXCLUSION_TERMS) {
    if (!re.test(text)) return { ok: false, reason: "promise-silently-omits-uncovered-power" };
  }
  if (!EXCLUSION_MARKER_RE.test(text)) {
    return { ok: false, reason: "promise-overclaims-beyond-artifact-verification+integration-slice" };
  }
  return { ok: true };
}

module.exports = { assertScopedHonestly, REQUIRED_SCOPE_TERMS, REQUIRED_EXCLUSION_TERMS, EXCLUSION_MARKER_RE, OVERCLAIM_ALL_FOUR_RE };
