# SP-20260611-002 FIX2 affected-lane re-review

Repository root: C:\Users\Vlad\Desktop\Claude\Projects\WarpOS
Branch: sprint/SP-20260611-002
HEAD: 7baa0e2
Working tree: contains uncommitted FIX2 changes under review.

Read-only review. Do not edit, create, delete, move, format, or patch files. Do not touch .claude/runtime/** or .claude/project/events/*.jsonl.

Prior attempt-1 fail note and prior FIX1 re-review outputs are included for continuity. CODEX-LOG evidence includes focused test results for FIX2.

## Attempt-1 failure note

```markdown
# SP-20260611-002 — Gauntlet attempt 1 — FAIL (2026-06-11)

Integrated HEAD 1f7b55c (cad7249..1f7b55c sprint diff). Foreground dispatch-agent.js, security lane GPT-pinned (β #2). Binding verdicts — NOT overridable.

## Verdicts
- backend-reviewer: **FAIL** (openai/gpt-5.5, ok:true, 2240 bytes) — 4 MAJOR.
- security-reviewer: **FAIL** (openai/gpt-5.5, ok:true, 1857 bytes, β-pinned) — 3 BLOCKER + 1 MAJOR.
- qa-reviewer: (pending — running long; folds in when it lands).

## W1-fold confirmed FIXED (security lane)
"T-324 looks fixed; teardown now anchors require/load paths to the hook's own repo root. T-325 also looks fixed; parent-containment was removed in mode-lifecycle-guard.js." → W1FoldFixer work is sound; NOT in the fix-cycle.

## SECURITY findings (binding)
1. **BLOCKER team-guard.js:473 (G1/T-316)** — `namedTeamVerified()` verifies the named team carries the conductor but NOT project ownership (slug/member cwd). A worker passing a real FOREIGN team name (e.g. `doogle-sprint`) skips the sprint readiness gate. SAME project-scoping class as the W1 findings.
2. **BLOCKER team-guard.js:504 (G1)** — sprint readiness selects the globally-freshest team under `~/.claude/teams`, not the project-scoped freshest. A foreign fresh ε team makes `teamReady` true → allows worker dispatch when this project has no correct live team.
3. **BLOCKER authorization-gate.js:119 (G2/T-317)** — `node-e-fs` approves a whole `node -e` if it contains ANY allowed write call, even when the same command also contains `rmSync`/`unlinkSync`. The tracked-delete floor only catches literal extracted targets, so `fs.writeFileSync(...); fs.rmSync(variable)` is approved. Violates "rm/unlink not approvable" (AC-4.1).
4. **MAJOR mode-write-coverage.js:139 (G1)** — corroboration accepts any same-target lifecycle event within ±120min, INCLUDING one before the current mode.json mtime. A direct out-of-band rewrite shortly after a legit same-mode switch greens the detector.

## BACKEND findings (binding)
5. **MAJOR coverage-gate-scan.js:176 (G3a)** — the live CLI calls `auditLedger(records)` with no `expectedSource`; production `/scan` stays self-derived and can't catch the omitted-role slip. The external-expected-source fix (AC-5.3) works ONLY when tests inject `expectedSource`; the real caller never resolves registry/sprint composition.
6. **MAJOR provider-tier-check.js:269 (G3b)** — `unknown-self-attested` gated only on `signals.t1Met`, not on T2 funded. selected t3 + t1Met:true + t2_funded:false + no T3 attestation → `unknown-self-attested` + ok:true instead of `tier_short`. Missing T2 funding is value-free detectable.
7. **MAJOR provider-tier-config.js:137 (G3b)** — read errors (a directory at `--config-path`, permission denial) treated as absent greenfield (`corrupt:false`) → the fail-closed corrupt-config hold doesn't apply. Only TRUE absence should be greenfield; other read failures should be `corrupt:true`.
8. **MAJOR planning-principles.js:259 (G3c)** — `--enforce` fail-closed incomplete: scan-time exceptions are swallowed before the CLI catch. A section-matcher throw returns `false` (="not missing") from the catch at 262-263 → can produce ok:true. Only unhandled exceptions fail-close.

## Sound areas (reviewers confirmed)
Waiver provenance rejects missing operator/ts/trail + surfaces normalized provenance; check-ac category mode non-zero for a planted post-cutoff unreadable artifact; shared cutoff imported by both new consumers; provider-tier t1-down + JSON ok-mirroring for covered cells; W1-fold T-324/T-325.

## Fix-cycle routing
Builders were α's Agent-tool dispatches → α spawns the fixers (max-3 attempts). Surface-grouped fix briefs:
- **G1 fixer** (team-guard.js + mode-write-coverage.js): findings 1, 2, 4 (project-scope the team verification + readiness; tighten the corroboration window to post-mtime).
- **G2 fixer** (authorization-gate.js): finding 3 (reject `node -e` containing rmSync/unlinkSync regardless of co-present writes).
- **G3b fixer** (provider-tier-check.js + provider-tier-config.js): findings 6, 7 (T2-funded gate on unknown-self-attested; read-error→corrupt not greenfield).
- **G3a fixer** (coverage-gate-scan.js): finding 5 (wire expectedSource into the live CLI from registry/composition).
- **G3c fixer** (planning-principles.js): finding 8 (fail-close on scan-time exceptions, not only unhandled).
Re-run the AFFECTED lanes only after fixes (security GPT-pinned). Each fix lands with the exploit fixture that REDs without it (the reviewers found these BECAUSE the existing tests were happy-path on these specific vectors).

## qa-reviewer lane — PENDING at session wrap (2026-06-11 ~08:13Z)
qa-reviewer (b5lc82dfd) was STILL RUNNING when the operator called session wrap — confirmed live (live node procs, clean err log), NOT stalled, just slow on the full-diffstat traceability scope. gauntlet-verify correctly flags it `no-record` = unsatisfied (absence is NOT a pass). It reviews the SAME pre-fix snapshot, so its verdict (if/when it lands) is valid against attempt-1: the NEXT session reads runtime/sp002-gauntlet/qa-reviewer.out.json — if it FAILed with NEW surfaces/defects not in findings 1-8, mint a wave-2 fix brief; if it PASSed or only echoes 1-8, no new fixers needed. Do NOT block the fix-cycle on it.

## FIX1 BRIEFS STAGED (the resume artifact) — 2026-06-11 session wrap
5 self-contained fixer briefs at .warpos/dispshape-prompts/SP-20260611-002-FIX1-{G1,G2,G3a,G3b,G3c}.md, each carrying verbatim finding(s) + fix intent + exploit-fixture-with-mutation requirement + no-regress suite list + fixture namespacing + no-gate-flips. Surface to finding map: G1 = 1,2,4 / G2 = 3 / G3a = 5 / G3b = 6,7 / G3c = 8.

### NEXT-SESSION RESUME (fix-cycle attempt 1, max-3 holds)
1. Create 5 worktrees off the integrated HEAD (current sprint/SP-20260611-002 tip), one per FIX1 brief.
2. Dispatch the 5 fixers in parallel (disjoint surfaces, the 5/5 own-worktree pattern). NOTE: claude-builder BACKGROUND dispatch REAPS at the CLI buffer on this box (RI-004, ~45s) — use Agent-tool (reap-immune, the Option-B shape that built attempt-1) OR foreground.
3. Verify each fixer (commit real, scope-clean, exploit fixture REDs on revert = mutation-verify, no-regress suites pass) — ED-047 evidence shape.
4. Merge all 5 into the integrated branch; fresh manifest regen; cross-surface sanity on integrated tree.
5. Re-run ONLY the affected lanes: security-reviewer --provider openai (GPT-pinned, beta #2) for findings 1-4; backend-reviewer for 5-8; + qa disposition. Binding verdicts.
6. On GREEN: beta gauntlet->release boundary, then release close. On FAIL: attempt 2 (max-3).

```

## CODEX-LOG latest evidence

```markdown
  - `security-reviewer-prompt.md` (49,647 bytes): findings 1-4, prior fail note, FIX1 evidence, targeted diff for `team-guard.js`, `mode-write-coverage.js`, `authorization-gate.js`, and relevant fixtures.
  - `backend-reviewer-prompt.md` (62,895 bytes): findings 5-8, prior fail note, FIX1 evidence, targeted diff for `coverage-gate-scan.js`, `provider-tier-check.js`, `provider-tier-config.js`, `planning-principles.js`, and relevant fixtures.
- Dispatched both affected lanes with `DISPATCH_LEDGER_DIR=runtime/sp002-rereview/ledger`, `WARPOS_DISPATCH_BACKGROUND=1`, and `DISPATCH_BUILDER_TIMEOUT_MS=900000` so completion/death ledgers stayed out of `.claude/runtime`.
  - `node scripts/dispatch-agent.js security-reviewer runtime/sp002-rereview/security-reviewer-prompt.md --provider openai`
  - `node scripts/dispatch-agent.js backend-reviewer runtime/sp002-rereview/backend-reviewer-prompt.md`
- Dispatch wrappers both completed `ok:true` on OpenAI `gpt-5.5`; local isolated ledger is `runtime/sp002-rereview/ledger/dispatch-completions.jsonl`.
- Affected-lane verdicts:
  - `security-reviewer`: **FAIL**, envelope validation OK. Closed findings `[1,2,4]`; finding 3 still has a same-class bypass. New blocker: `scripts/hooks/authorization-gate.js:128` only poisons `fs.rmSync` / `fs.unlinkSync` / `fs.rmdirSync` member calls, so a destructured/aliased destructive call in the same `node -e` body still auto-approves because the write regex fires. Local reproduction: `matchNodeEFs("Bash", {command: "node -e \"const fs=require('fs'); const {rmSync}=require('fs'); fs.writeFileSync('out.js','x'); rmSync(targetVar)\""})` returns `{"scope":"node-e-fs","pattern":"Bash(node -e *fs.{write,append,mkdir}Sync*)"}`.
  - `backend-reviewer`: **FAIL**, score 78, envelope validation OK. Closed findings `[6,7,8]`; finding 5 still open. Reviewer evidence: production `/scan:full` still documents/invokes `node scripts/checks/coverage-gate-scan.js` without `--expected-source` at `.claude/commands/scan/full.md:100`, so the live scan remains self-derived unless an operator manually supplies the new flag. Reviewer also flagged that `coverage-gate-scan-live-cli.test.js` proves only the manual flag path, not production scan wiring or registry/sprint-composition resolution.
- Protected-path check after dispatch: `git status --short -- .claude/runtime .claude/project/events .claude/project/decisions runtime/sp002-rereview CODEX-LOG.md` showed only `CODEX-LOG.md` and `runtime/sp002-rereview/` as untracked/modified in the requested scope; no `.claude/runtime/**` or `.claude/project/events/*.jsonl` status entries.
- Post-dispatch `node scripts/trackers/validate.js`: PASS, all 20 binding checks green; the same report-only anti-deixis warnings remain.

## 2026-06-11 SP-20260611-002 FIX2 start

- User directed: `Proceed`.
- FIX2 scope is limited to the two remaining affected-lane failures from the re-review:
  - Security finding 3 same-class gap: `authorization-gate.js` must reject destructive `node -e` calls even when `rmSync` / `unlinkSync` / `rmdirSync` are destructured or aliased rather than written as `fs.<method>`.
  - Backend finding 5 live-path gap: production `/scan:full` must no longer leave `coverage-gate-scan.js` self-derived by default; the live scan path needs an external expected-source source or equivalent default wiring, with a fixture that exercises the production invocation shape.
- Constraints carried forward: do not push; leave `.claude/runtime/**` and `.claude/project/events/*.jsonl` alone unless explicitly asked.
- Implemented FIX2 changes:
  - `scripts/hooks/authorization-gate.js`: added a conservative destructive fs detector for `node -e` approval. It now poisons `node-e-fs` auto-approval for `fs.rmSync` / `fs.unlinkSync` / `fs.rmdirSync`, bracket access like `fs["unlinkSync"]`, direct identifier calls like `rmSync(...)`, and destructured `require("fs")` imports including renamed aliases.
  - `tests/regression/SP-20260611-002/auth-floor-rm-with-write.test.js`: added same-class regression cells for destructured `rmSync`, renamed destructured `rmSync: remove`, and bracket `fs["unlinkSync"]`.
  - `scripts/checks/coverage-gate-scan.js`: added no-flag production expected-source derivation from ledger `sprint_id` + `phase_id`/`step` through the sprint hook-point registry and sprint ticket composition; manual `--expected-source` remains supported and takes precedence.
  - `tests/regression/SP-20260611-002/coverage-gate-scan-live-cli.test.js`: added sealed `CLAUDE_PROJECT_DIR` production-shape fixtures that run the real CLI with no `--expected-source`, proving omitted hook-point roles are caught and the all-records-present case stays green.
  - `.claude/commands/scan/full.md`: updated the `/scan:full` command text so it no longer claims `coverage-gate-scan.js` is self-derived from ok:true records only.
- FIX2 verification:
  - `node -c scripts/hooks/authorization-gate.js`: PASS.
  - `node -c scripts/checks/coverage-gate-scan.js`: PASS.
  - `node tests/regression/SP-20260611-002/auth-floor-rm-with-write.test.js`: `14 passed, 0 failed`.
  - `node tests/regression/SP-20260611-002/auth-floor-tracked-delete.test.js`: `10 passed, 0 failed`.
  - `node tests/regression/SP-20260611-002/coverage-gate-scan-live-cli.test.js`: `7/7 passed`.
  - `node tests/regression/SP-20260611-002/coverage-gate-scan-source.test.js`: `6/6 passed`.
  - `node scripts/dispatch/coverage-gate.test.js`: `17/17 passed`.
  - `node tests/regression/SP-20260611-002/coverage-gate-waiver.test.js`: `7/7 passed`.
  - `node tests/regression/SP-20260611-002/legacy-cutoff-shared.test.js`: `8/8 passed`.
  - `node tests/regression/S-LC-06/coverage-gate-caller.test.js`: `8/8 passed`.
  - `node scripts/dispatch/dispatch-contract.test.js`: `19/19 passed`.
  - `node scripts/checks/coverage-gate-scan.js --json`: exit 0 report-only with `ok:false`, `runs: 9`, `gaps: 27`; output now includes omitted expected roles such as `backend-reviewer`, `qa-reviewer`, and `security-reviewer` from live ledger sprint/phase context.
  - `node scripts/trackers/validate.js`: PASS, all 20 binding checks green; report-only anti-deixis warnings remain.
  - `git diff --check`: PASS.

## 2026-06-11 Codex handoff

- Read `CODEX.md`, `DUMP.md`, `TRACKER.md`, `CLAUDE.md`, and `AGENTS.md`.
- Ran `node scripts/trackers/validate.js` before work; result: PASS, all 20 binding checks green. Report-only anti-deixis warnings were present.
- Confirmed current branch is `sprint/SP-20260611-002` at `e5e5ac9`.
- Read `runtime/notes/sp002-gauntlet-fail-attempt1.md` and all five staged fix briefs under `.warpos/dispshape-prompts/SP-20260611-002-FIX1-*.md`.
- Checked `runtime/sp002-gauntlet/qa-reviewer.out.json` and `.err.log`; both were zero bytes. No SP-002 QA completion record was found, so the handoff note's "do not block FIX1 on QA absence" instruction still applies.
- Created five linked worktrees from sprint tip:
  - `.claude/worktrees/SP-20260611-002-FIX1-G1` on `wt/SP-20260611-002-FIX1-G1`
  - `.claude/worktrees/SP-20260611-002-FIX1-G2` on `wt/SP-20260611-002-FIX1-G2`
  - `.claude/worktrees/SP-20260611-002-FIX1-G3a` on `wt/SP-20260611-002-FIX1-G3a`
  - `.claude/worktrees/SP-20260611-002-FIX1-G3b` on `wt/SP-20260611-002-FIX1-G3b`
  - `.claude/worktrees/SP-20260611-002-FIX1-G3c` on `wt/SP-20260611-002-FIX1-G3c`
- Launched all five FIX1 builder/fixer dispatches via foreground `node scripts/dispatch-claude.js ... --worktree <linked-worktree>` into `runtime/sp002-dispatch/FIX1-*.out.json` / `.err.log`. The user interrupted after launch; the wrapper ledger later showed:
  - G2 completed ok:true and committed `473d8ea` on `wt/SP-20260611-002-FIX1-G2`.
  - G3a completed ok:true and committed `f4bda38` on `wt/SP-20260611-002-FIX1-G3a`.
  - G1, G3b, and G3c hit the 540s foreground timeout and wrote ok:false completion records with no stdout digest.
- Current worktree state after interruption:
  - G1 has uncommitted partial edits: `scripts/checks/mode-write-coverage.js`, `scripts/hooks/team-guard.js` (97 insertions, 12 deletions).
  - G2 is clean at commit `473d8ea`; output envelope says 43/43 tests and mutation verify passed for finding 3.
  - G3a is clean at commit `f4bda38`; output file in `runtime/sp002-dispatch` is zero bytes despite the ledger ok:true record, so verify independently before merging.
  - G3b has uncommitted partial edits: `scripts/warpos/lib/provider-tier-config.js`, `scripts/warpos/provider-tier-check.js`, `tests/regression/SP-20260611-002/provider-tier-matrix.test.js` (106 insertions, 14 deletions).
  - G3c has uncommitted partial edits: `scripts/checks/planning-principles.js`, `tests/regression/SP-20260611-002/planning-principles-enforce.test.js` (239 insertions, 7 deletions).
- No active `dispatch-claude.js` fixer process was found after interruption. Observed live processes were the Claude desktop app, Codex kernel/MCP servers, and an off-limits `doogle` dev server.
- Added project-local Codex defaults in `.codex/config.toml`: `gpt-5.5`, `xhigh`, 1M context, 900k auto-compact limit. No provider/auth/base-url/telemetry/notification settings were added.

Recommended next session resume:

1. Read `CODEX.md`, `CODEX-LOG.md`, `DUMP.md`, `TRACKER.md`, and `runtime/notes/sp002-gauntlet-fail-attempt1.md`.
2. Run `node scripts/trackers/validate.js`.
3. Continue SP-20260611-002 FIX1 from the five existing worktrees. Verify G2 and G3a independently; decide whether to salvage or rerun G1/G3b/G3c from their partial edits. Do not merge SP-002 to `main` until the failed lanes re-review green.

## 2026-06-11 Codex config update

- Updated `.codex/config.toml` to make future project-local Codex sessions use the yolo-equivalent defaults: `sandbox_mode = "danger-full-access"` and `approval_policy = "never"`, while preserving `gpt-5.5`, `xhigh`, 1M context, and 900k auto-compact.

## 2026-06-11 Codex config reality check

- Verified `.codex/config.toml` exists and contains `model = "gpt-5.5"`, `model_reasoning_effort = "xhigh"`, `model_context_window = 1000000`, `model_auto_compact_token_limit = 900000`, `sandbox_mode = "danger-full-access"`, and `approval_policy = "never"`.
- Ran `codex --version`: installed CLI is `codex-cli 0.139.0`.
- Ran `codex --help`: this CLI documents config loading from `~/.codex/config.toml` plus `-c key=value` overrides and profiles; it does not document automatic repo-local `.codex/config.toml` loading.
- Ran `codex doctor`: active loaded config is `C:\Users\Vlad\.codex\config.toml`, not this repo's `.codex\config.toml`. Doctor reports model `gpt-5.5`, sandbox unrestricted, approval `Never`.
- Read `C:\Users\Vlad\.codex\config.toml`: global config currently has `model_reasoning_effort = "high"` and does not contain the repo-local 1M context / 900k auto-compact keys. Therefore this session should not be assumed to be using the repo-local context defaults.

## 2026-06-11 SP-20260611-002 FIX1 resume

- Started from `sprint/SP-20260611-002` with existing linked worktrees:
  - G1 `wt/SP-20260611-002-FIX1-G1` had partial edits; completed and committed `033c6d3`.
  - G2 `wt/SP-20260611-002-FIX1-G2` was already clean at `473d8ea`.
  - G3a `wt/SP-20260611-002-FIX1-G3a` was already clean at `f4bda38`.
  - G3b `wt/SP-20260611-002-FIX1-G3b` had partial edits; completed and committed `06a4e85`.
  - G3c `wt/SP-20260611-002-FIX1-G3c` had partial edits; completed and committed `c2d5b5b`.
- Required pre-work commands:
  - `node scripts/codex/alex.js validate` failed because `scripts/codex/alex.js` is absent.
  - `node scripts/trackers/validate.js` passed all 20 binding checks; anti-deixis warnings were report-only.
  - `npx tsc --noEmit` via PowerShell failed on execution policy for `npx.ps1`; rerun as `npx.cmd tsc --noEmit` failed because this repo has no `package.json` / local TypeScript install.
  - `node scripts/test/run-suite.js` failed because `scripts/test/run-suite.js` is absent. Existing suite runner is `scripts/testsuite/run.js`, but it does not emit `SUITE-VERDICT:`.
  - `node scripts/testsuite/run.js --quiet` returned red baseline: `regression-seed: 17/20 runnable green | 3 regression(s) | 2 n/a-canonical | 5 gap + 3 manual | coverage 16 covered / 9 partial / 5 gap of 30`.
- Focused lane evidence before integration:
  - G1: `team-guard-verify 15/15`, `mode-write-coverage 9/9`, `lifecycle-roster-exact-match 7/7`, `team-cwd-scope-under-project 5/5`, `team-guard-gate 13/13`, `team-guard-sprint 8/8`.
  - G2: `auth-floor-rm-with-write 11/11`, `auth-floor-tracked-delete 10/10`, `turbo-auth-monotonic 9/9`, `turbo-spend-anchor 9/9`, `turbo-self-lockout 4/4`, `S-LC-07 permission-profile 13/13`, `S-LC-07 scan-turbo-spend 9/9`.
  - G3a: `coverage-gate-scan-live-cli 5/5`, `coverage-gate-scan-source 6/6`, `coverage-gate 17/17`, `coverage-gate-waiver 7/7`, `legacy-cutoff-shared 8/8`, `dispatch-contract 19/19`.
  - G3b: `provider-tier-matrix 21/21`, `S-LC-10 provider-tier-check 22/22`. Needed a test-only adjustment in S-LC-10 so the old "unknown-self-attested never trips --enforce" fixture explicitly sets a dummy `ANTHROPIC_API_KEY`, preserving the T1+T2-met / T3-unknown intent after finding-6 tightened unknown-self-attested to require T2 funding.
  - G3c: `planning-principles-enforce 19/19`, `S-LC-08 planning-principles 9/9`.
- G1 partial implementation was missing exact exploit fixtures, so added:
  - real foreign `doogle-sprint` team-name project-scope rejection,
  - globally freshest foreign epsilon team filtered before readiness,
  - positive non-slug team with member cwd under project,
  - pre-mtime lifecycle event cannot corroborate later mode.json rewrite.

## 2026-06-11 Global Codex profile config

- Used the official Codex Advanced Configuration / Configuration Reference docs to confirm current profile behavior: Codex 0.139 loads `~/.codex/config.toml`, and `--profile <name>` overlays `~/.codex/<name>.config.toml`; legacy top-level `profile = "..."`
  and `[profiles.*]` tables are no longer the supported mechanism.
- Updated `C:\Users\Vlad\.codex\config.toml` base settings to act as the default "smartest" profile while preserving the existing plugin, MCP, desktop, marketplace, and trusted-project sections:
  - `model = "gpt-5.5"`
  - `model_reasoning_effort = "xhigh"`
  - `model_context_window = 1000000`
  - `model_auto_compact_token_limit = 900000`
  - `sandbox_mode = "danger-full-access"`
  - `approval_policy = "never"`
  - `service_tier = "default"`
  - `[features].fast_mode = false`
- Added `C:\Users\Vlad\.codex\smartest.config.toml` with the same core "smartest" values so `codex --profile smartest ...` works explicitly.
- Added `C:\Users\Vlad\.codex\fastest.config.toml`:
  - `model = "gpt-5.5"`
  - `model_reasoning_effort = "high"`
  - `model_context_window = 258000`
  - `model_auto_compact_token_limit = 232000` so fastest does not inherit the 900k smartest compaction threshold.
  - `sandbox_mode = "danger-full-access"`
  - `approval_policy = "never"`
  - `service_tier = "fast"`
  - `[features].fast_mode = true`
- Verification:
  - `codex doctor` passes and loads `C:\Users\Vlad\.codex\config.toml`.
  - `codex --profile fastest debug prompt-input "profile load check"` exits 0 without a model turn.
  - `codex --profile smartest debug prompt-input "profile load check"` exits 0 without a model turn.
  - `codex doctor --profile ...` is not supported by CLI 0.139; the CLI reports profiles only apply to runtime commands and `codex mcp`.

```

# Role: backend-reviewer

Scope ONLY prior backend finding 5 and same-class regressions in coverage-gate-scan live production wiring. Previous FIX1 re-review marked findings 6, 7, and 8 closed; do not reopen those unless this FIX2 diff changes them, which it does not.

Prior remaining failure:
- Finding 5 live-path gap: coverage-gate-scan accepted --expected-source, but production /scan:full invoked node scripts/checks/coverage-gate-scan.js with no flag, leaving the no-flag path self-derived from ok:true records only. The fixture proved only manual flag wiring, not production registry/sprint-composition resolution.

Review whether FIX2 closes:
- no-flag production scanner derives expected roles from ledger sprint_id + phase_id/step through sprint hook-point registry and ticket composition,
- manual --expected-source still works and takes precedence,
- tests exercise the production no-flag invocation shape under sealed CLAUDE_PROJECT_DIR,
- docs no longer claim self-derived-only behavior.

Previous backend re-review output:

```json
{"ok":true,"provider":"openai","model":"gpt-5.5","actualModel":"gpt-5.5","output":"{\n  \"feature\": \"SP-20260611-002 FIX1 affected-lane backend re-review\",\n  \"score\": 78,\n  \"verdict\": \"FAIL\",\n  \"evaluationSources\": [\n    \"runtime/notes/sp002-gauntlet-fail-attempt1.md\",\n    \"CODEX-LOG.md\",\n    \"git diff 1f7b55c..HEAD\",\n    \".claude/commands/scan/full.md\"\n  ],\n  \"checks\": {\n    \"fix_validation\": {\n      \"passed\": false,\n      \"closedFindings\": [6, 7, 8],\n      \"findings\": [\n        {\n          \"severity\": \"MAJOR\",\n          \"finding\": 5,\n          \"file\": \"scripts/checks/coverage-gate-scan.js\",\n          \"issue\": \"FIX1 adds a manual --expected-source CLI seam and passes it to auditLedger, but the production /scan:full invocation still calls coverage-gate-scan.js without --expected-source. The live production scan remains self-derived unless an operator supplies the new flag, so the omitted-role slip remains exploitable in the actual /scan path.\"\n        }\n      ]\n    },\n    \"code_quality\": {\n      \"passed\": false,\n      \"scoreDelta\": -22,\n      \"findings\": [\n        {\n          \"severity\": \"MAJOR\",\n          \"file\": \"tests/regression/SP-20260611-002/coverage-gate-scan-live-cli.test.js\",\n          \"issue\": \"The exploit fixture proves the new manual flag works, but it does not exercise production /scan wiring or registry/sprint-composition resolution. It would pass while the real scan command remains unwired.\"\n        }\n      ],\n      \"lowWarnings\": []\n    }\n  },\n  \"blocking_issues\": [\n    {\n      \"severity\": \"MAJOR\",\n      \"finding\": 5,\n      \"path\": \".claude/commands/scan/full.md:100\",\n      \"summary\": \"Production /scan still invokes node scripts/checks/coverage-gate-scan.js with no expected-source, so coverage-gate-scan defaults to self-derived expectations and cannot catch an omitted role.\"\n    }\n  ],\n  \"warnings\": [],\n  \"suggested_fixes\": [\n    \"Wire coverage-gate-scan's production /scan path to resolve expectedSource from the actual registry/sprint composition by default, or ensure the scan runner always passes a generated --expected-source file.\",\n    \"Add a regression fixture that exercises the production /scan invocation shape, not only coverage-gate-scan.js with a manually supplied --expected-source flag.\"\n  ]\n}","stderrBytes":4030,"cmd":"codex exec --sandbox workspace-write -c model_reasoning_effort=xhigh -m gpt-5.5 -","role":"backend-reviewer","specModel":"gpt-5.5","parsed":{"feature":"SP-20260611-002 FIX1 affected-lane backend re-review","score":78,"verdict":"FAIL","evaluationSources":["runtime/notes/sp002-gauntlet-fail-attempt1.md","CODEX-LOG.md","git diff 1f7b55c..HEAD",".claude/commands/scan/full.md"],"checks":{"fix_validation":{"passed":false,"closedFindings":[6,7,8],"findings":[{"severity":"MAJOR","finding":5,"file":"scripts/checks/coverage-gate-scan.js","issue":"FIX1 adds a manual --expected-source CLI seam and passes it to auditLedger, but the production /scan:full invocation still calls coverage-gate-scan.js without --expected-source. The live production scan remains self-derived unless an operator supplies the new flag, so the omitted-role slip remains exploitable in the actual /scan path."}]},"code_quality":{"passed":false,"scoreDelta":-22,"findings":[{"severity":"MAJOR","file":"tests/regression/SP-20260611-002/coverage-gate-scan-live-cli.test.js","issue":"The exploit fixture proves the new manual flag works, but it does not exercise production /scan wiring or registry/sprint-composition resolution. It would pass while the real scan command remains unwired."}],"lowWarnings":[]}},"blocking_issues":[{"severity":"MAJOR","finding":5,"path":".claude/commands/scan/full.md:100","summary":"Production /scan still invokes node scripts/checks/coverage-gate-scan.js with no expected-source, so coverage-gate-scan defaults to self-derived expectations and cannot catch an omitted role."}],"warnings":[],"suggested_fixes":["Wire coverage-gate-scan's production /scan path to resolve expectedSource from the actual registry/sprint composition by default, or ensure the scan runner always passes a generated --expected-source file.","Add a regression fixture that exercises the production /scan invocation shape, not only coverage-gate-scan.js with a manually supplied --expected-source flag."]},"envelopeValidation":{"ok":true,"errors":[],"normalized":{"agent":"backend-reviewer","verdict":"fail","findings":0,"requiresHuman":false}}}

```

Return ONLY one JSON object, no markdown fences, no prose:
{
  "feature":"SP-20260611-002 FIX2 backend re-review finding 5",
  "score":100,
  "verdict":"PASS|WARNING|FAIL",
  "evaluationSources":["runtime/notes/sp002-gauntlet-fail-attempt1.md","CODEX-LOG.md","git diff HEAD"],
  "checks":{
    "fix_validation":{"passed":true,"closedFindings":[5],"findings":[]},
    "code_quality":{"passed":true,"scoreDelta":0,"findings":[],"lowWarnings":[]}
  },
  "blocking_issues":[],
  "warnings":[],
  "suggested_fixes":[]
}

# FIX2 backend diff

```diff
diff --git a/.claude/commands/scan/full.md b/.claude/commands/scan/full.md
index 5ca37ae..c7095cc 100644
--- a/.claude/commands/scan/full.md
+++ b/.claude/commands/scan/full.md
@@ -97,11 +97,11 @@ node scripts/checks/provider-api-policy.js --strict    # PLAN §4 N-2 + dispatch
 node scripts/checks/doc-ref-integrity.js --enforce     # E-SYSTEM-ORG-001 S-13b (MECHANICAL + BLOCKING; baseline 0-broken; ALSO auto-fires at commit/merge via merge-guard.js so it never depends on a human running /scan:full): a high-read CANON doc (root *.md + .claude/agents|commands + trackers) cites a repo-internal relative path (a [text](path) link or a backtick scripts/foo.js-shaped ref) that resolves to NOTHING — the inverse of duplicate-doc-drift (points-at-nothing, not same-name-diverged). The class the .system/ADR-0007/role-rename waves left behind in prose. Allowlist (runtime-generated / dead-tree / planned / historical) in scripts/checks/doc-ref-integrity.allowlist.json; per-line `<!-- doc-ref-ignore -->` for self-documenting/anti-example lines. Non-zero = critical. Fail-closed on its own errors.
 node scripts/checks/mode-lifecycle-registry.js         # E-LIFECYCLE-001 S-LC-01 (REPORT-ONLY this sprint — do NOT block on it yet): the mode/lifecycle keystone analogue of dispatch-contract — verifies the readers (team-guard.js FACE_TYPES, session-start.js TEAM_MODES) resolve required-team-by-mode FROM .claude/agents/_org/mode-lifecycle.json, that lib/mode-lifecycle.js#FALLBACK mirrors the registry (no fail-open drift), and the registry schema is complete (every live mode × roster/requires_team/bindings/provider_tier/dispatch_profile_ref/teardown). exit 0/1/2, fail-closed on its own errors. Ramp-to-blocking tail is S-LC-03/04.
 node scripts/checks/mode-lifecycle-hooks-coverage.js   # E-LIFECYCLE-001 S-LC-02 (REPORT-ONLY — same tier/treatment as scan:sprint-hook-coverage; do NOT pass --enforce / do NOT block this sprint): the SIBLING coverage enforcer for the VIRTUAL mode-lifecycle EVENT registry (.claude/agents/_org/mode-lifecycle-hooks.json). REVERSE (registry structurally coherent — every row event/when/mode/payload_fields, mode ∈ {block,advisory}, harness_fires the literal false, no dup event) + FORWARD (every declared harness_fires:false event has an emitter — a lifecycle-events.emit("<event>") reference and/or a real lifecycle-event record in paths.eventsFile; an un-wired event listed in mode-lifecycle-hooks-coverage.allowlist.json is wiring-pending INFO, not a gap). Exit contract (P-053 loud-fail): clean→0, gap-only→0 (report-only), parse/unreadable/structurally-broken registry→2 (fail loud — a broken registry must never report "0 gaps"). The --enforce ramp tail (gap→exit 1) is S-LC-03/04, once the emitters land and the allowlist is pruned.
-node scripts/checks/coverage-gate-scan.js              # E-LIFECYCLE-001 S-LC-06 (REPORT-ONLY + FAIL-OPEN — do NOT pass --enforce / do NOT block this sprint): the LIVE CALLER for coverage-gate.js evaluate() (which was built+P5-tested but had NO live caller — PLAN §2.6 low-hanging wiring). Reads the dispatch-completions ledger (paths.dispatchCompletionsFile), groups records by run_id, derives expected=the roles that CLAIM coverage (an ok:true record) per run, and runs evaluate() to surface the sprint-theater class from the ledger ITSELF (no per-run --expect needed): an ok:true claim that is unbacked / blind (no artifact proof) / stale-schema, a cross-provider role satisfied by provider=claude, or a hand-authored phantom row. This is the STATIC-scan complement to the per-PHASE runtime gate (coverage-gate.js --run <id> --expect <roles>, BLOCKING). Exit contract: ALWAYS exit 0 in report-only (gaps are printed, not blocked) and FAIL-OPEN (a malformed/unreadable ledger or any internal error → a note + exit 0, never breaks /scan:full). The --enforce ramp tail (gap→exit 1) is a later flip behind operator sign-off.
+node scripts/checks/coverage-gate-scan.js              # E-LIFECYCLE-001 S-LC-06 (REPORT-ONLY + FAIL-OPEN — do NOT pass --enforce / do NOT block this sprint): the LIVE CALLER for coverage-gate.js evaluate() (which was built+P5-tested but had NO live caller — PLAN §2.6 low-hanging wiring). Reads the dispatch-completions ledger (paths.dispatchCompletionsFile), groups records by run_id, derives external expected roles from sprint_id + phase_id/step through the sprint hook-point registry and ticket composition (with claimed ok:true roles unioned as a fallback), and runs evaluate() to surface the sprint-theater class: an omitted hook-point role with no record, an ok:true claim that is unbacked / blind (no artifact proof) / stale-schema, a cross-provider role satisfied by provider=claude, or a hand-authored phantom row. This is the STATIC-scan complement to the per-PHASE runtime gate (coverage-gate.js --run <id> --expect <roles>, BLOCKING). Exit contract: ALWAYS exit 0 in report-only (gaps are printed, not blocked) and FAIL-OPEN (a malformed/unreadable ledger or any internal error → a note + exit 0, never breaks /scan:full). The --expected-source flag can still supply an explicit source; the no-flag /scan:full path is no longer self-derived only. The --enforce ramp tail (gap→exit 1) is a later flip behind operator sign-off.
 node scripts/checks/planning-principles.js             # /scan:planning-principles — E-LIFECYCLE-001 S-LC-08 (REPORT-ONLY + FAIL-OPEN — do NOT pass --include-plans / do NOT block this sprint): the named enforcer for the planning principles (_planning/principle.md §8.11). Walks the lifecycle-store epic plan artifacts (_planning/epics/**) and flags any plan .md (README.md excluded) that OMITS a principle-required section — a named ENFORCER per policy (#7), PROOF/acceptance (#6/#15), or a BLAST-RADIUS assessment (#5). Makes the "principles live only in a prompt, nothing checks them" gap self-detecting. Exit contract: ALWAYS exit 0 (report-only — gaps printed, not blocked) and FAIL-OPEN (a missing planning dir / unreadable file / any internal error → a note + exit 0, never breaks /scan:full). The --enforce ramp tail is a later flip behind operator sign-off.
 ```
 
-A non-zero exit (when blocking) is a critical finding (the dispatch contract drifted from the role registry — a role with no class, a class allowing a ghost shape, a build-chain role that could be dispatched in-process). The N-1 coverage gate (`node scripts/dispatch/coverage-gate.js --run <id> --expect <roles>`) is the companion runtime check that makes a backing `ok:true` completion record the precondition for "covered" (kills sprint theater) — now **BLOCKING by default** (PLAN §4 ramp FLIPPED): the §17.4 strengthening makes a record's mere existence insufficient (it must be stamped at the current `argv_schema_version` AND carry artifact proof — `output_digest` or an `artifacts[]` digest — so a stale/backfilled/blind record is rejected), with an auditable `waiver{reason}` escape; `--report-only` opts out. It is a RUNTIME gate (needs a `--run <id>` + `--expect`), so it is invoked per sprint phase. Its STATIC-scan complement is `coverage-gate-scan.js` (S-LC-06, in the block above) — the LIVE CALLER that audits the dispatch-completions ledger run-by-run with no per-run `--expect` (it derives the expected roles from the ok:true claims in each run), surfacing the same sprint-theater class report-only + fail-open during a `/scan:full` pass. The **duplicate-doc-drift** enforcer (PLAN §4 S-6) is the self-detecting backstop for E-SYSTEM-ORG-001 — it makes the "same-basename shipped doc drifted" class loud. The Wave-2 consolidation removed the `agent-dispatch-guide.md` duplicate (0-drifted), so per §4-step-8 it is now **BLOCKING** (`--strict`). The **provider-api-policy** enforcer (N-2) is likewise **BLOCKING** (live repo clean at the flip). Both keep allowlists for sanctioned cases; both fail-closed on their own errors. The safety kernel (`scripts/dispatch/safe-spawn.js` — now WIRED into the live cross-provider spawn path via `scripts/hooks/lib/providers.js`) + auth-resolver (N-3, `scripts/dispatch/auth-resolver.js`) + each module's `*.test.js` carry the P5 planted-violation tests. The **doc-ref-integrity** enforcer (E-SYSTEM-ORG-001 S-13b) is the navigational-link complement to duplicate-doc-drift: a broken repo-relative ref in high-read canon (the stale-link class the operator hit after the `.system`/ADR-0007/role-rename waves). It ships **REPORT-ONLY** at a 0-broken baseline (168 surfaced refs → fixed-or-categorized); `--enforce` is the ramp tail. `scripts/checks/doc-ref-integrity.test.js` carries the P5 cases.
+A non-zero exit (when blocking) is a critical finding (the dispatch contract drifted from the role registry — a role with no class, a class allowing a ghost shape, a build-chain role that could be dispatched in-process). The N-1 coverage gate (`node scripts/dispatch/coverage-gate.js --run <id> --expect <roles>`) is the companion runtime check that makes a backing `ok:true` completion record the precondition for "covered" (kills sprint theater) — now **BLOCKING by default** (PLAN §4 ramp FLIPPED): the §17.4 strengthening makes a record's mere existence insufficient (it must be stamped at the current `argv_schema_version` AND carry artifact proof — `output_digest` or an `artifacts[]` digest — so a stale/backfilled/blind record is rejected), with an auditable `waiver{reason}` escape; `--report-only` opts out. It is a RUNTIME gate (needs a `--run <id>` + `--expect`), so it is invoked per sprint phase. Its STATIC-scan complement is `coverage-gate-scan.js` (S-LC-06, in the block above) — the LIVE CALLER that audits the dispatch-completions ledger run-by-run with no per-run `--expect`, deriving expected roles from sprint registry/ticket composition when run records carry sprint_id + phase_id/step and unioning claimed roles as a fallback. The **duplicate-doc-drift** enforcer (PLAN §4 S-6) is the self-detecting backstop for E-SYSTEM-ORG-001 — it makes the "same-basename shipped doc drifted" class loud. The Wave-2 consolidation removed the `agent-dispatch-guide.md` duplicate (0-drifted), so per §4-step-8 it is now **BLOCKING** (`--strict`). The **provider-api-policy** enforcer (N-2) is likewise **BLOCKING** (live repo clean at the flip). Both keep allowlists for sanctioned cases; both fail-closed on their own errors. The safety kernel (`scripts/dispatch/safe-spawn.js` — now WIRED into the live cross-provider spawn path via `scripts/hooks/lib/providers.js`) + auth-resolver (N-3, `scripts/dispatch/auth-resolver.js`) + each module's `*.test.js` carry the P5 planted-violation tests. The **doc-ref-integrity** enforcer (E-SYSTEM-ORG-001 S-13b) is the navigational-link complement to duplicate-doc-drift: a broken repo-relative ref in high-read canon (the stale-link class the operator hit after the `.system`/ADR-0007/role-rename waves). It ships **REPORT-ONLY** at a 0-broken baseline (168 surfaced refs → fixed-or-categorized); `--enforce` is the ramp tail. `scripts/checks/doc-ref-integrity.test.js` carries the P5 cases.
 
 **Sprint conductor liveness** *(default + `--deep`)*
 
diff --git a/scripts/checks/coverage-gate-scan.js b/scripts/checks/coverage-gate-scan.js
index 7cd53ed..dd88b5f 100644
--- a/scripts/checks/coverage-gate-scan.js
+++ b/scripts/checks/coverage-gate-scan.js
@@ -79,6 +79,81 @@ function resolveExpected(expectedSource, runId, runRecs) {
   return [...byRole.values()];
 }
 
+const CANONICAL_STEPS = Object.freeze(["plan", "design", "build", "gauntlet", "release", "retro"]);
+
+let _runtimeDeps = null;
+function runtimeDeps() {
+  if (_runtimeDeps) return _runtimeDeps;
+  _runtimeDeps = {
+    hookPoints: require("../sprint/hook-points"),
+    sprintPaths: require("../sprint/paths"),
+    sprintFs: require("../sprint/fs"),
+  };
+  return _runtimeDeps;
+}
+
+function stepsForPhaseId(phaseId, registry) {
+  const phase = String(phaseId || "").trim();
+  if (!phase) return [];
+  if (CANONICAL_STEPS.includes(phase)) return [phase];
+  const phaseMap = registry && registry.phase_map && typeof registry.phase_map === "object"
+    ? registry.phase_map
+    : {};
+  const out = [];
+  for (const [step, mappedPhase] of Object.entries(phaseMap)) {
+    if (String(mappedPhase) === phase && CANONICAL_STEPS.includes(step)) out.push(step);
+  }
+  return out;
+}
+
+function compositionForSprintId(sprintId, opts = {}) {
+  const deps = opts.deps || runtimeDeps();
+  const ticketsDir = opts.ticketsDir || deps.sprintPaths.tickets;
+  const tickets = [];
+  for (const f of fs.readdirSync(ticketsDir)) {
+    if (!/\.(ya?ml|json)$/.test(f)) continue;
+    const t = deps.sprintFs.readYamlMaybe(path.join(ticketsDir, f));
+    if (t && t.sprint === sprintId) tickets.push(t);
+  }
+  return deps.hookPoints.compositionFromTickets(tickets);
+}
+
+function runtimeExpectedForRun(_runId, runRecs, opts = {}) {
+  const recs = Array.isArray(runRecs) ? runRecs.filter(Boolean) : [];
+  const sprintIds = new Set();
+  const phases = new Set();
+  for (const r of recs) {
+    if (r.sprint_id) sprintIds.add(String(r.sprint_id));
+    if (r.phase_id) phases.add(String(r.phase_id));
+    if (r.step) phases.add(String(r.step));
+  }
+  if (!sprintIds.size && process.env.WARPOS_SPRINT_ID) sprintIds.add(process.env.WARPOS_SPRINT_ID);
+  if (!phases.size && process.env.WARPOS_PHASE_ID) phases.add(process.env.WARPOS_PHASE_ID);
+  if (!sprintIds.size || !phases.size) return [];
+
+  const deps = opts.deps || runtimeDeps();
+  const registry = opts.registry || deps.hookPoints.load();
+  const byRole = new Map();
+  for (const sprintId of sprintIds) {
+    const composition = compositionForSprintId(sprintId, { ...opts, deps });
+    for (const phase of phases) {
+      for (const step of stepsForPhaseId(phase, registry)) {
+        const rows = deps.hookPoints.agentsForStep(step, composition, registry);
+        for (const row of rows) {
+          if (!row || !row.role) continue;
+          if (row.mode !== "block" && !opts.includeAdvisory) continue;
+          byRole.set(row.role, { role: row.role });
+        }
+      }
+    }
+  }
+  return [...byRole.values()];
+}
+
+function defaultRuntimeExpectedSource(opts = {}) {
+  return (runId, runRecs) => runtimeExpectedForRun(runId, runRecs, opts);
+}
+
 /**
  * Audit a ledger's records run-by-run. Pure given `records`. Returns
  *   { runs: [{ runId, ok, violations[], covered[], missing[], waived[], legacyExempt }],
@@ -174,11 +249,12 @@ function main() {
   }
 
   // AC-5.3 (LIVE PATH) — resolve expectedSource from the external registry /
-  // sprint-composition file supplied via --expected-source <path>. Without this,
-  // the audit self-derives expected from the ledger's own ok:true records, so a
-  // role that produced NO record is never expected and its omission reads clean
-  // (the "omitted-role slip"). An external source breaks the self-reference: roles
-  // named there but absent from the ledger are gaps even in production /scan.
+  // sprint-composition file. If --expected-source <path> is supplied, that file is
+  // authoritative. Otherwise production /scan derives expected roles from the
+  // ledger's sprint_id + phase_id/step fields through the sprint hook-point registry
+  // and ticket composition. Without that default, the audit self-derives expected
+  // from the ledger's own ok:true records, so a role that produced NO record is
+  // never expected and its omission reads clean (the "omitted-role slip").
   //
   // Format of the JSON file (same shape as the `expectedSource` the pure seam takes):
   //   ["role1", "role2"]                  — applies to ALL runs as a universal set
@@ -200,6 +276,8 @@ function main() {
       );
       // liveExpectedSource stays null → self-derive fallback
     }
+  } else {
+    liveExpectedSource = defaultRuntimeExpectedSource();
   }
 
   let audit;
@@ -292,4 +370,13 @@ function surfaceWaivers(allWaived) {
 
 if (require.main === module) process.exit(main());
 
-module.exports = { auditLedger, resolveExpected, surfaceWaivers, LEGACY_CUTOFF };
+module.exports = {
+  auditLedger,
+  resolveExpected,
+  runtimeExpectedForRun,
+  defaultRuntimeExpectedSource,
+  stepsForPhaseId,
+  compositionForSprintId,
+  surfaceWaivers,
+  LEGACY_CUTOFF,
+};
diff --git a/tests/regression/SP-20260611-002/coverage-gate-scan-live-cli.test.js b/tests/regression/SP-20260611-002/coverage-gate-scan-live-cli.test.js
index bccd20a..1da0df6 100644
--- a/tests/regression/SP-20260611-002/coverage-gate-scan-live-cli.test.js
+++ b/tests/regression/SP-20260611-002/coverage-gate-scan-live-cli.test.js
@@ -43,7 +43,7 @@ const RUN_ID = "run-live-cli-exploit-g3a";
 const TS_POST = "2026-06-11T14:00:00Z";
 
 // A realistic BACKED dispatch-completions record (same shape as the source-suite uses).
-function makeRecord(role, provider) {
+function makeRecord(role, provider, over = {}) {
   return JSON.stringify({
     dispatch_id: `d-${role}-live`,
     cmdline_checksum: "sha256:deadbeef00001",
@@ -54,6 +54,7 @@ function makeRecord(role, provider) {
     argv_schema_version: ARGV_SCHEMA_VERSION,
     output_digest: "sha256:feedface00000000000000000001",
     ts: TS_POST,
+    ...over,
   });
 }
 
@@ -61,17 +62,44 @@ function makeRecord(role, provider) {
  * Run the REAL CLI via spawnSync. Returns { status, out, raw, stderr }.
  * `out` is the parsed JSON (or null if parse fails).
  */
-function runCLI(ledgerPath, extraArgs = []) {
+function runCLI(ledgerPath, extraArgs = [], extraEnv = {}) {
   const r = spawnSync(
     process.execPath,
     [CLI, "--json", "--ledger", ledgerPath, ...extraArgs],
-    { cwd: ROOT, encoding: "utf8" },
+    { cwd: ROOT, encoding: "utf8", env: { ...process.env, ...extraEnv } },
   );
   let out = null;
   try { out = r.stdout ? JSON.parse(r.stdout) : null; } catch { /* raw below */ }
   return { status: r.status, out, raw: r.stdout || "", stderr: r.stderr || "" };
 }
 
+function makeSealedSprintProject() {
+  const project = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-livecli-prod-"));
+  fs.mkdirSync(path.join(project, ".claude", "agents", "_org"), { recursive: true });
+  fs.mkdirSync(path.join(project, ".claude", "project", "sprint", "tickets"), { recursive: true });
+  fs.writeFileSync(
+    path.join(project, ".claude", "agents", "_org", "sprint-hook-points.json"),
+    JSON.stringify({
+      schema: "warpos/sprint-hook-points/test",
+      lifecycle: ["plan", "design", "build", "gauntlet", "release", "retro"],
+      phase_map: { plan: "plan", design: "design", build: "execute", gauntlet: "execute", release: "release-prep", retro: "retro" },
+      rows: [
+        { role: "backend-builder", step: "build", condition: { unit_type: ["backend"] }, mode: "block", order: 10 },
+        { role: "backend-reviewer", step: "gauntlet", condition: { unit_type: ["backend"] }, mode: "block", order: 20 },
+        { role: "qa-reviewer", step: "gauntlet", condition: "always", mode: "block", order: 30 },
+        { role: "security-reviewer", step: "gauntlet", condition: "always", mode: "block", order: 40 },
+      ],
+    }),
+    "utf8",
+  );
+  fs.writeFileSync(
+    path.join(project, ".claude", "project", "sprint", "tickets", "T-FIX2.json"),
+    JSON.stringify({ id: "T-FIX2", sprint: "SP-FIX2", unit_type: "backend", risk_level: "high" }),
+    "utf8",
+  );
+  return project;
+}
+
 // ── Set up temp fixture files ────────────────────────────────────────────────
 // These are reused across all test cases (setup is not teardown-sensitive for
 // read-only temp files — they are named in OS temp and cleaned below).
@@ -137,6 +165,61 @@ h.test("LIVE CLI gap output explicitly names security-reviewer as the missing ro
   );
 });
 
+// PRODUCTION SHAPE (FIX2): no manual --expected-source flag. The scanner must
+// derive expected roles from sprint_id + phase_id in the ledger and the sealed
+// sprint hook registry/tickets under CLAUDE_PROJECT_DIR. This is the exact gap the
+// re-review caught: /scan:full invoked coverage-gate-scan.js with no flag.
+h.test("FIX2 production /scan shape with no --expected-source still catches omitted hook-point roles", () => {
+  const project = makeSealedSprintProject();
+  const prodDir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-livecli-prod-ledger-"));
+  const ledger = path.join(prodDir, "prod.jsonl");
+  fs.writeFileSync(
+    ledger,
+    makeRecord("backend-builder", "claude", {
+      run_id: "run-prod-default-g3a",
+      sprint_id: "SP-FIX2",
+      phase_id: "execute",
+      dispatch_id: "d-backend-builder-prod",
+    }) + "\n",
+    "utf8",
+  );
+  try {
+    const r = runCLI(ledger, [], { CLAUDE_PROJECT_DIR: project });
+    assert.ok(r.out !== null, `CLI produced non-JSON:\n${r.raw}\n${r.stderr}`);
+    assert.strictEqual(r.out.ok, false, `expected production default source to report gaps:\n${JSON.stringify(r.out, null, 2)}`);
+    const text = JSON.stringify(r.out.runs || []);
+    assert.ok(/backend-reviewer/.test(text), `expected missing backend-reviewer in production default gaps:\n${text}`);
+    assert.ok(/security-reviewer/.test(text), `expected missing security-reviewer in production default gaps:\n${text}`);
+  } finally {
+    fs.rmSync(project, { recursive: true, force: true });
+    fs.rmSync(prodDir, { recursive: true, force: true });
+  }
+});
+
+h.pass("FIX2 production /scan shape with no --expected-source reports no gap when all block roles have records", () => {
+  const project = makeSealedSprintProject();
+  const prodDir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-livecli-prod-clean-"));
+  const ledger = path.join(prodDir, "prod-clean.jsonl");
+  const base = { run_id: "run-prod-clean-g3a", sprint_id: "SP-FIX2", phase_id: "execute" };
+  fs.writeFileSync(
+    ledger,
+    [
+      makeRecord("backend-builder", "claude", { ...base, dispatch_id: "d-backend-builder-clean" }),
+      makeRecord("backend-reviewer", "openai", { ...base, dispatch_id: "d-backend-reviewer-clean" }),
+      makeRecord("qa-reviewer", "openai", { ...base, dispatch_id: "d-qa-reviewer-clean" }),
+      makeRecord("security-reviewer", "openai", { ...base, dispatch_id: "d-security-reviewer-clean" }),
+    ].join("\n") + "\n",
+    "utf8",
+  );
+  try {
+    const r = runCLI(ledger, [], { CLAUDE_PROJECT_DIR: project });
+    return r.out || { ok: false };
+  } finally {
+    fs.rmSync(project, { recursive: true, force: true });
+    fs.rmSync(prodDir, { recursive: true, force: true });
+  }
+});
+
 // No false positive: when the ledger has records for BOTH roles, the live CLI
 // with the same --expected-source reports ok:true (no gap).
 h.pass("LIVE CLI with --expected-source reports no gap when BOTH expected roles have records", () => {

```
