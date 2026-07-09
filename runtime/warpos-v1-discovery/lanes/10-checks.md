# Checks / Scan / Enforcement Estate — Discovery Report (disc-checks, 2026-07-09)

## Census
- **Check scripts:** 116 `.js` in `scripts/checks/` → **87 non-test enforcers** + **29 `*.test.js` bite-tests**.
- **Scan skills:** **53** in `.claude/commands/scan/`.
- **Regression corpus:** `tests/regression/` = **29 sprint dirs, 127 `*.test.js`/`*.spec.ts`**. Bug-class registry `_requirements/07-testing/recurring-bug-classes.json` = **30 classes** (16 covered / 9 partial / 5 gap), **22 runnable detectors, only 9 wired to `scripts/checks/`**.
- **What `scan:full` runs** (`.claude/commands/scan/full.md`): the 53 scan skills (Tier 1–3) PLUS ~19 **direct script invocations** with no `/scan:*` wrapper — canon×2, `knowledge-coverage`, `playbook-suite-coverage`, `trackers/validate.js`, `dispatch/dispatch-contract.js`, `duplicate-doc-drift`, `provider-api-policy`, `doc-ref-integrity`, `repo-role-single-source`, `mode-lifecycle-registry`, `mode-lifecycle-hooks-coverage`, `coverage-gate-scan`, `planning-principles`, `tracker-reality-drift`, `security-pass-count`, `no-nul-bytes`, `no-dead-team-tools`, `consult-roster-no-dispatch`, `epsilon-liveness`.
- **skill→full drift is closed** by `scan-coverage.js` (asserts every `/scan:*` is delegated or allowlisted; allowlist excludes only 2 — `warpos-layer-diff`, `turbo-spend`, at `scripts/checks/scan-coverage.allowlist.json:8`). But it covers **skill→full only, never script→invoker**.
- **Truly orphaned enforcers** (exist, real policy, NO runner — not in scan:full, no `/scan:*` skill, no hook, no release-gate, no test-runner): `brand-leak-scan` (Master Console branding boundary), `integration-seam-gate` (ED-013), `pl-build-spec-enforcer` (ED-051/052), `chief-coherence-enforcer`, `resonance-runner`, `manager-principles-scan`, `canon-tech-stack` (S-PF-02), `mode-write-coverage` (S-LC-06), `dispatch-timeout-sanity`, `file-usage-trace`, `warpos-promote-coverage`, `warpos-roundtrip`, `assert-warpos-templates-shipped`, `test-untrusted-content`. (`contract-versioning`/`path-usage`/`warpos-enforcer-shippability`/`portfolio-installer-loud` ARE wired.)

## Trigger analysis (fractions of 87 non-test enforcers)
- **(a) Claude hooks — ~10–12%:** ~9 fire on hooks (`merge-guard`, `framework-purity-guard`, `dispatch-route-guard`, `team-guard`, `mode-lifecycle`, `tracker-completion-gate`, `tracker-start-of-work`, `untrusted-content` + several called from merge-guard). Trigger is Claude-lifecycle; the scripts themselves are pure node (MECH-NEUTRAL if a CI calls them).
- **(b) scan skills / scan:full — ~70 enforcers (~80%):** ~53 skills + ~19 direct scripts, all `node scripts/...` leaves. **MECH-NEUTRAL / CI-runnable** — only the aggregator is Claude-shaped.
- **(c) tests:** `linters/run.js` discovers ONLY `scripts/lint-*`, `scripts/sprint/test-*`, `scripts/warpos/test-*` (`scripts/linters/run.js:24-108`); `testsuite/run.js` runs the 22 bug-class detectors. **Neither discovers `scripts/checks/*.test.js` (29 bite-tests) NOR `tests/regression/**` (127 files).**
- **(d) never/orphaned:** the ~14 orphan enforcers + **the entire bite-test + tests/regression suite has no standing runner** — the known "enforcers ship green tests, never registered as regression classes, silently rot" learning, confirmed structurally.
- **Helm-neutral CI verdict:** a CI running node-equivalents of scan:full leaves + `testsuite/run.js` + `release-gates.js` covers **~80% of enforcers with ZERO Claude dependency** (all leaves pure node). Genuinely Claude-bound: only the LLM-reasoning scans (`patterns`, `coherence`, `requirements` drift, `privacy`) — a minority.

## Debt top-10 (46 open of 60; `.claude/project/memory/enforcement-debt.jsonl`)
1. **ED-018 [high]** — reaped Claude builder/fixer dispatch must be self-detecting (no completion-record path; only worktree-diff detects the reap).
2. **ED-033 [high]** — every enforcer must ship a sealed known-answer self-test; the meta-debt behind the orphan-bite-test rot.
3. **ED-013 [med]** — multi-builder FE+BE features need a written integration-seam contract (`integration-seam-gate.js` exists but ORPHANED).
4. **ED-060 [med]** — gemini CLI hard-deprecated; security-reviewer primary pass down → gauntlet degraded to 2-family.
5. **ED-063 [med]** — cross-provider corpus-diversity (Gemini leg) unenforced after the outage.
6. **ED-065 (+addendum/honestred) [med]** — two-hop `lead→reviewer→Bash→builder` cascade not closed; enforcer now honest-RED but hole open.
7. **ED-047 [med]** — every build_chain dispatch (incl. alpha-lane) must leave a canonical completion record.
8. **ED-041 [med]** — teammate-spawned ε must not use Agent tool (per-spec, contradicted by the re-verified `feedback_ed041_agent_tool_per_spec`).
9. **ED-050 [med]** — `release-canonical.js` must converge all 3 manifests between stages 6–7 (RI-003).
10. **ED-028 [med]** — a DECIDE/build must not rest on an inherited "done/proven" claim (verify-don't-inherit).
- **Retired structurally by v1:** ED-033 (single self-test harness discovering `checks/*.test.js`), ED-054/ED-009 (AST-grade repo-role scan), ED-019/040/057/059 (dispatch-shape door), ED-011/014/027/048 (report/tracker/push cadence via CI hooks).

## Self-honesty spot-checks
- **Hardened fail-closed (exit 2 on unreadable/malformed, verified in code):** `scan-coverage.js:150`, `panel-registry-coverage.js:29`, `model-chain.js:264`, `tracker-reality-drift.js:121`, `no-nul-bytes.js:90`, `admin-suite-coverage.js:253`, `doc-ref-integrity.js:273`, `integration-seam-gate.js:37`, `mode-write-coverage.js:89`, `warpos-enforcer-shippability.js:71`. `brand-leak-scan.js:107` explicitly rejects the **vacuous `ok:true scanned:0`** anti-pattern (missing dir → hard FAIL). Estate is unusually mature on self-honesty.
- **Intentional silent-green (report-only + FAIL-OPEN — green on missing/broken input BY DESIGN):** `coverage-gate-scan.js` (always exit 0, fail-open on malformed ledger), `planning-principles.js` (exit 0 + fail-open), `repo-role-single-source.js` (line-local grep, ED-054 — misses multi-line shapes), plus `epsilon-liveness`/`tracker-reality-drift`/`consult-roster-no-dispatch` (report-only in scan:full). These are the ramp-to-blocking decisions v1 must make.
- **Biggest gap:** the 29 `checks/*.test.js` bite-tests + 127 `tests/regression` files run by nothing — an enforcer can silently regress to false-green and no suite catches it.

## Rebuild needs
1. **CI-able check manifest** — one `checks.registry.json`: `{id, script, policy_ref, trigger[hook|scan|release-gate|test], blocking, fail_mode:closed|open, bite_test, expect_canonical, budget_ms}`. Generate scan:full's leaf list + release-gates + hook-fired checks FROM it (single source), kill the prose delegation table in `full.md`.
2. **Orphan-enforcer wiring** — a `check-coverage.js` sibling to `scan-coverage.js` asserting every non-test `scripts/checks/*.js` has ≥1 invoker (scan/hook/gate/test) or an allowlist reason. Wires the ~14 orphans.
3. **Standing bite-test runner** — discover + run `scripts/checks/*.test.js` and `tests/regression/**` every lint pass / CI (extend `linters/run.js:24` discover()); retires ED-033 + the silent-rot class.
4. **Helm-neutral driver** — replace scan:full's Claude aggregator with `node scripts/scan/run-all.js` reading the manifest, so the full estate runs in CI without a Claude session. Keep LLM-reasoning scans as a separate MECH-CLAUDE tier.
5. **Debt-retirement map** — fold 46 open ED into the manifest's `blocking`/`fail_mode` columns; ramp the report-only fail-open checks to blocking once watch-windows clear.
- **Runtime cost:** no clean recorded wall-clock; one probe used a **480s (8-min) timeout** for a scan:full ping (events 2026-06-08). Manifest should carry per-check `budget_ms` for a CI total.

Pointers: ledger `.claude/project/memory/enforcement-debt.jsonl` · manifest source `.claude/commands/scan/full.md` · coverage enforcer `scripts/checks/scan-coverage.js` · unwired-runner gap `scripts/linters/run.js:24-108` · regression runner `scripts/testsuite/run.js`.
