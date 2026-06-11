# qa-reviewer — SP-20260611-002 functional + traceability + integrity

You are a QA REVIEWER. Judge FUNCTIONAL correctness + TRACEABILITY + INTEGRITY over the sprint, NOT line-by-line code.

TICKETS in this sprint: T-316 (G1 lifecycle gates: team-guard verify-don't-trust, mode single-writer, kill-switch attestation), T-317 (G2 turbo-auth: monotonic-or-attested re-apply, session-anchored spend, nonfinite-fail-HIGH, tracked-delete floor, self-lockout), T-318 (G3a coverage-gate: waiver provenance, external expected-source, shared legacy cutoff), T-319 (G3b provider-tier verdict-matrix), T-320 (G3c enforce-paths: planning-principles, check-ac-coverage, hooks-coverage allowlist), T-324 (W1-fold BLOCKER: teardown projectDir anchoring), T-325 (W1-fold MINOR: cwd scoping).

CHECK:
1. TRACEABILITY: does each ticket have corresponding test coverage in tests/regression/SP-20260611-002/? Each fix should land with an EXPLOIT FIXTURE (old attack now fails closed), not just happy-path.
2. INTEGRITY: are the tests REAL (planted-violation/fail-closed assertions) or HOLLOW (happy-path-only, always-green)? A hollow enforce-path test that always exits 0 is the exact bug class this sprint fixes — flag any.
3. FUNCTIONAL: do the ACs appear satisfied? Any obvious gap between a ticket's claim and its test?
4. NO-REGRESS: existing suites (S-LC-*) should still pass — flag if a sprint change would plausibly break a prior contract.

NOTE: all enforcement stays REPORT-ONLY by design (no blocking flip) — do NOT flag report-only as a defect. AC-8.4 (proof-syntax weakness in check-ac-coverage) is a DOCUMENTED RESIDUE, intentionally not fixed — not a defect.

VERDICT: end with `VERDICT: PASS` or `VERDICT: FAIL`, then findings BLOCKER/MAJOR/MINOR.

===== SPRINT DIFFSTAT =====
 .claude/commands/session/dump.md                   |  10 +
 .claude/commands/session/end.md                    |   8 +-
 .claude/framework-manifest.json                    |  74 +++--
 .../sprint/sprints/SP-20260611-002/current.yaml    |   4 +-
 .claude/project/sprint/tickets/T-20260611-316.yaml |   2 +-
 .claude/project/sprint/tickets/T-20260611-317.yaml |   2 +-
 .claude/project/sprint/tickets/T-20260611-318.yaml |   2 +-
 .claude/project/sprint/tickets/T-20260611-319.yaml |   2 +-
 .claude/project/sprint/tickets/T-20260611-320.yaml |   2 +-
 .claude/project/sprint/tickets/T-20260611-324.yaml |  56 ++++
 .claude/project/sprint/tickets/T-20260611-325.yaml |  61 ++++
 DISPATCH-ERRORS.md                                 | 213 ++++++++++++
 _warpos/MANIFEST.json                              | 224 ++++++++++---
 scripts/checks/coverage-gate-scan.js               | 137 +++++++-
 .../mode-lifecycle-hooks-coverage.allowlist.json   |  49 +--
 scripts/checks/mode-lifecycle-hooks-coverage.js    |  88 ++++-
 scripts/checks/mode-write-coverage.js              | 285 ++++++++++++++++
 scripts/checks/planning-principles.js              | 166 +++++++++-
 scripts/dispatch/coverage-gate.js                  |  63 +++-
 scripts/dispatch/coverage-gate.test.js             |  23 +-
 scripts/dispatch/legacy-cutoff.js                  | 153 +++++++++
 scripts/hooks/authorization-gate.js                | 238 ++++++++++----
 scripts/hooks/mode-lifecycle-guard.js              |  69 +++-
 scripts/hooks/session-end-team-teardown.js         |  52 ++-
 scripts/hooks/team-guard-gate.test.js              |  19 +-
 scripts/hooks/team-guard-sprint.test.js            |  15 +-
 scripts/hooks/team-guard.js                        | 331 +++++++++++++++----
 scripts/mode-set.js                                | 103 ++++++
 scripts/sprint/check-ac-coverage.js                | 116 ++++++-
 scripts/teams/lifecycle.js                         |  40 ++-
 scripts/turbo/apply.js                             | 148 ++++++++-
 scripts/turbo/spend-ledger.js                      |  96 +++++-
 scripts/warpos/lib/provider-tier-config.js         |  37 ++-
 scripts/warpos/manifest/walk-skip.js               |   3 +
 scripts/warpos/provider-tier-check.js              |  41 ++-
 .../SP-20260611-002/ac-coverage-failclosed.test.js | 155 +++++++++
 .../auth-floor-tracked-delete.test.js              | 161 +++++++++
 .../coverage-gate-scan-source.test.js              | 108 ++++++
 .../SP-20260611-002/coverage-gate-waiver.test.js   | 120 +++++++
 .../hooks-coverage-allowlist.test.js               | 152 +++++++++
 .../SP-20260611-002/legacy-cutoff-shared.test.js   | 132 ++++++++
 .../lifecycle-roster-exact-match.test.js           | 155 +++++++++
 .../SP-20260611-002/mode-write-coverage.test.js    | 235 ++++++++++++++
 .../planning-principles-enforce.test.js            | 239 ++++++++++++++
 .../SP-20260611-002/provider-tier-matrix.test.js   | 361 +++++++++++++++++++++
 .../team-cwd-scope-under-project.test.js           | 156 +++++++++
 .../SP-20260611-002/team-guard-verify.test.js      | 225 +++++++++++++
 .../teardown-projectdir-anchor.test.js             | 178 ++++++++++
 .../SP-20260611-002/turbo-auth-monotonic.test.js   | 209 ++++++++++++
 .../SP-20260611-002/turbo-self-lockout.test.js     | 137 ++++++++
 .../SP-20260611-002/turbo-spend-anchor.test.js     | 191 +++++++++++
 51 files changed, 5515 insertions(+), 331 deletions(-)

===== TEST FILES ADDED THIS SPRINT =====

