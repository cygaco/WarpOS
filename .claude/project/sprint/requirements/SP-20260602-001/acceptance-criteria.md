<!-- requirement-format-legacy -->
# Acceptance Criteria — Sealed-capsule executable consumer-contract gate (keystone)

**Sprint:** `SP-20260602-001`
**PRD:** `.claude/project/sprint/requirements/SP-20260602-001/prd.md`

> Each AC is a testable statement. `verified_by:` cites the test that proves it.
> The gate's own test harness is `scripts/warpos/test-sealed-capsule-gate.js`
> (project convention: `scripts/warpos/test-*.js`, run via `scripts/testsuite/enforce.js`),
> not a jest `tests/regression/` dir. ACs whose proof is the gate script's own
> runtime behavior cite that harness's named sub-tests.

## S-1 — seal(version): materialize a self-contained payload from the capsule manifest

- AC-1.1: Given a built capsule at `framework/releases/<v>/` with a current `framework-manifest.json` + `checksums.json`, when `seal(<v>)` runs, then it copies the EXACT bytes every manifest-enumerated file references into a sealed payload dir, and the sealed payload contains zero references to canonical absolute paths.
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::seal-materializes-all-manifest-entries
- AC-1.2: Given a sealed payload, when its contents are hashed, then every file matches the capsule `checksums.json`/manifest hash (content-addressed integrity).
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::seal-verifies-against-checksums
- AC-1.3: Given a STALE or MISSING capsule manifest (generate-framework-manifest --check fails, or the version dir is absent), when `seal` runs, then it refuses with a non-zero exit and writes nothing (fail-closed — a manifest that lies makes the whole gate meaningless).
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::seal-fail-closed-on-stale-or-missing-manifest

## S-2 — isolate(): out-of-tree repo where canonical is unreachable

- AC-2.1: Given a sealed payload, when `isolate()` runs, then it creates a disposable temp repo OUTSIDE the canonical tree (not a subdir of REPO_ROOT), `git init`s it, and installs ONLY the sealed payload into it.
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::isolate-creates-out-of-tree-repo
- AC-2.2: Given the isolated repo, when canonical-reachability is asserted, then no installed file contains a canonical absolute path AND the run env has WARPOS_*/canonical-pointing vars scrubbed — any reach-back to canonical fails loudly rather than silently resolving.
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::isolate-asserts-canonical-unreachable
- AC-2.3: Given an intentionally planted reach-back (a payload file that reads a canonical-only path), when the gate runs against it, then the gate FAILS (non-zero) — proving the isolation actually catches the bug class (negative test).
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::isolate-catches-planted-reachback

## S-3 — lifecycle(role, path): the executable consumer contract

- AC-3.1: Given an isolated install, when `lifecycle(role, path)` runs, then it executes setup → scan:install → a minimal real sprint → dispatch telemetry → update in order, capturing each step's exit code and the telemetry time-window.
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::lifecycle-runs-full-contract-in-order
- AC-3.2: Given any lifecycle step exits non-zero, when the gate evaluates the run, then the gate fails-closed and names the failing step (no partial-green).
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::lifecycle-fail-closed-on-step-failure

## S-4 — verifyTyped(window, roles): typed success via gauntlet-verify

- AC-4.1: Given a completed lifecycle, when `verifyTyped(window, roles)` runs, then it calls `verifyGauntlet`/`isWellFormedOkRecord` against CANONICAL-ANCHORED telemetry and green requires BOTH the action occurred AND a well-formed completion record exists in the window.
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::verifytyped-requires-action-and-record
- AC-4.2: Given a runner-error, a malformed telemetry line, or a no-record for a required step, when `verifyTyped` runs, then it fails-closed (non-zero) — never greens on an unverifiable signal (BC-16 semantics).
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::verifytyped-fail-closed-on-malformed-norecord-runnererror
- AC-4.3: Given telemetry written into the temp/worktree runtime instead of canonical (ED-016 class), when `verifyTyped` resolves the ledger, then it reads the canonical-anchored ledger and does NOT false-RED on a misplaced-but-present record.
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::verifytyped-resolves-canonical-anchored-ledger

## S-5 — matrix: both repo roles × cold + warm

- AC-5.1: Given the role resolver `scripts/warpos/repo-role.js`, when the matrix runs, then `lifecycle` executes for role ∈ {canonical, consumer} via explicit override-arg threading (not env-only, since subagents can't read env) × path ∈ {cold(setup), warm(update)} — all four cells run and are reported.
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::matrix-runs-both-roles-cold-and-warm
- AC-5.2: Given any matrix cell fails, when the gate aggregates results, then the overall gate exits non-zero and the failing cell(s) are named (no silent cell skip).
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::matrix-aggregates-fail-closed

## S-6 — wire: release/promotion gate + NAMED ENFORCER

- AC-6.1: Given the release/promotion path (`scripts/warpos/release-gates.js` or a `scripts/checks/` enforcer), when a release/promotion is attempted, then the sealed-capsule gate runs as a named, self-detecting enforcer and a failure blocks promotion.
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::wired-as-named-release-gate
- AC-6.2: Given CLAUDE.md Policy & Enforcement Hygiene ("every policy needs a named enforcer"), when the enforcer is registered, then its name is documented and any residual unenforced policy is logged via `/enforcement:log` (no aspirational-vs-enforced gap left open).
  verified_by: not_applicable — documentation/registration assertion; covered by AC-6.1 wiring test + enforcement-debt ledger entry, no separate runtime test.

## S-7 — manifests + testsuite registration

- AC-7.1: Given new tracked scripts, when the build closes, then BOTH manifests are regenerated (`generate-framework-manifest.js` → BC-05, `warpos/manifest/build.js` → BC-02) and `generate-framework-manifest.js --check` exits 0.
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::manifests-current-after-build
- AC-7.2: Given `scripts/testsuite/enforce.js`, when the suite runs, then the sealed-capsule gate (or its fast unit slice) is in the runnable set and reports pass/fail (no new regressions vs baseline BC-17/BC-26).
  verified_by: scripts/warpos/test-sealed-capsule-gate.js::registered-in-testsuite
