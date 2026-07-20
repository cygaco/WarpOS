"use strict";
/**
 * suite-completeness check — verifies the EXECUTED check set === the pinned registry's frozen CHECK_NAMES
 * (deliverable #2). This is the check-lib-level instantiation of the same anti-shrink discipline the
 * controller's run-manifest enforces structurally (β R1 / AC-7b): a caller that quietly narrows which
 * checks got run (e.g. `runSuite(['no-nul-bytes'])` over the full CHECK_NAMES set) is caught HERE too, not
 * only at the controller layer — belt-and-suspenders.
 *
 * `ctx.executedNames` is populated by `index.js#runSuite` itself (the set of names it actually attempted to
 * run THIS invocation, injected into the ctx passed to every check in that run) — never self-supplied by
 * this check, and never read from `../index` (that would be a require cycle back into the very module that
 * is invoking this check; see registry.js's module doc for why the name constants live in their own file).
 */

const { CHECK_NAMES } = require("../registry");

function run(ctx) {
  if (!ctx || !Array.isArray(ctx.executedNames)) {
    return { status: "skipped", reason: "no-executed-set-in-context", evidence: { expected: CHECK_NAMES.slice() } };
  }
  const expected = CHECK_NAMES.slice();
  const executed = ctx.executedNames.slice();
  const missingFromExecuted = expected.filter((n) => !executed.includes(n));
  const extraInExecuted = executed.filter((n) => !expected.includes(n));

  if (missingFromExecuted.length || extraInExecuted.length) {
    return {
      status: "fail",
      reason: "suite-set-drift",
      evidence: { expected, executed, missingFromExecuted, extraInExecuted },
    };
  }
  return { status: "pass", reason: "suite-set-complete", evidence: { expected, executed } };
}

module.exports = { name: "suite-completeness", run };
