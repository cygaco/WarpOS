"use strict";
/**
 * false-green-envelope check — detects the canonical false-green shape: a ResultEnvelope self-reporting
 * `status:"passed"` while carrying ZERO files/commits/tests/evidence (i.e. a claim of success with no
 * observable work behind it — "L-2026-06 gauntlet never-claim-done-without-proof" class). This check does
 * NOT decide whether the envelope is trusted (that is the controller's job, re-deriving over real git
 * objects, R-5) — it is a narrow, cheap, always-on tripwire against the specific hollow-success pattern.
 *
 * ctx.envelope is the (untrusted) ResultEnvelope-shaped object under evaluation. Its ABSENCE is not itself
 * a violation (many contexts run this suite with no envelope in scope, e.g. a generic pre-write hook) —
 * absence is reported as `skipped`, never coerced into a pass or a fail.
 */

function countOf(v) {
  if (Array.isArray(v)) return v.length;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return 0;
}

function run(ctx) {
  const env = ctx && typeof ctx === "object" ? ctx.envelope : undefined;
  if (!env || typeof env !== "object") {
    return { status: "skipped", reason: "no-envelope-in-context", evidence: {} };
  }
  const status = env.status;
  const filesCount = countOf(env.files);
  const commitsCount = countOf(env.commits);
  const testsCount = countOf(env.tests);
  const evidenceCount = countOf(env.evidence);
  const evidence = { status: status != null ? status : null, filesCount, commitsCount, testsCount, evidenceCount };

  const looksPassed = status === "passed" || status === "pass" || status === true;
  const zeroEverything = filesCount === 0 && commitsCount === 0 && testsCount === 0 && evidenceCount === 0;

  if (looksPassed && zeroEverything) {
    return { status: "fail", reason: "false-green-envelope-zero-evidence", evidence };
  }
  return { status: "pass", reason: "envelope-has-observable-work-or-is-not-a-success-claim", evidence };
}

module.exports = { name: "false-green-envelope", run };
