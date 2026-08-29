// SP-20260829-001 bundle B2' fixture: a try/catch NESTED inside the body of
// an outer try/catch, where BOTH handlers reach a permissive outcome. The
// pre-fix detector's findCatchHandlers() skipped its scan cursor past the
// outer pair's own span after matching it, so the inner (nested) handler was
// never independently examined — this fixture demonstrates that gap and,
// after the traversal fix, must yield BOTH findings.
function admitOrDeny() {
  try {
    try {
      readInnerStore();
    } catch (eInner) {
      // permissive: inner handler reached by a failure the outer try
      // encloses. Nested inside the outer try's BODY, before the outer's
      // own catch — this is the specific shape the pre-fix scanner missed.
      process.exit(0);
    }
    return runRealDecision();
  } catch (eOuter) {
    // permissive: outer handler, matched normally even pre-fix.
    return { ok: true, skippedDecision: true };
  }
}

module.exports = { admitOrDeny };
