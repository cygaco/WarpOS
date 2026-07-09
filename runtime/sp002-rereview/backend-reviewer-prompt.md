# SP-20260611-002 FIX1 affected-lane re-review

Repository root: C:\Users\Vlad\Desktop\Claude\Projects\WarpOS
Branch: sprint/SP-20260611-002
HEAD: 7baa0e2
Base/pre-fix integrated head: 1f7b55c
Diff range: 1f7b55c..HEAD

You are running as a dispatched reviewer. This is a READ-ONLY review. Do not edit, create, delete, move, format, or patch any files. If you use commands, use read-only commands only. Do not touch .claude/runtime/** or .claude/project/events/*.jsonl.

Known baseline and constraints:
- Required pre-work scripts scripts/codex/alex.js and scripts/test/run-suite.js are absent.
- Existing scripts/testsuite/run.js --quiet is a known red baseline and does not emit SUITE-VERDICT. Do not treat that baseline as a new regression unless your scoped surfaces introduced a new relevant failure.
- Previous W1-fold T-324/T-325 was explicitly confirmed fixed and is out of scope.
- QA lane absence from attempt 1 was already dispositioned as not blocking FIX1 unless new QA output appears; do not invent QA findings here.

Review source material included below:
1. Prior gauntlet failure note.
2. FIX1 commit list and CODEX-LOG evidence.
3. Targeted diff from 1f7b55c to current HEAD for your affected lane.

## Prior gauntlet failure note

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

## FIX1 commit list

```text
7baa0e2 chore(SP-20260611-002): regenerate manifests after FIX1 integration
a6caa4f merge SP-20260611-002 FIX1-G3c
6720091 merge SP-20260611-002 FIX1-G3b
31ee6a1 merge SP-20260611-002 FIX1-G2
50a410b merge SP-20260611-002 FIX1-G3a
37569b5 merge SP-20260611-002 FIX1-G1
c2d5b5b fix(SP-20260611-002/FIX1-G3c): fail close planning-principles enforce on scan-time errors
06a4e85 fix(SP-20260611-002/FIX1-G3b): gate unknown tier on T2 funding and fail closed on config read errors
033c6d3 fix(SP-20260611-002/FIX1-G1): project-scope team identity and post-mtime mode-write corroboration
f4bda38 fix(SP-20260611-002/FIX1-G3a): wire external expectedSource into the LIVE coverage-gate-scan CLI from registry/composition — omitted-role slip caught in production /scan, not only under test injection (gauntlet finding 5)
473d8ea fix(SP-20260611-002/FIX1-G2): node-e-fs is all-or-nothing on destructive calls — any rmSync/unlinkSync poisons auto-approval regardless of co-present writes (gauntlet finding 3)
e5e5ac9 docs(CODEX.md): complete the Codex/GPT executor entrypoint shim + classify it as a framework-root-doc
fe54a17 evidence(SP-20260611-002): alphahand envelopes + gauntlet lane artifacts (ED-047 evidence shape) — zero-loss wrap 2026-06-11
186b207 roadmap: Sprint Pickup Queue items 13-17 (2026-06-11 session findings) — DISPATCH-ERRORS R1-R7 redesigns, cheap dispatch wins incl. secret-guard word-boundary FP, project-scoped identity-binding sweep, wiring-comment drift detector, task-echo defensive rule
da59660 gauntlet(SP-20260611-002): attempt-1 FAIL recorded — 8 findings, 5 FIX1 briefs staged, fix-cycle handed to next session

```

## CODEX-LOG evidence excerpt

```markdown
# CODEX-LOG.md

## 2026-06-11 SP-20260611-002 affected-lane re-review

- Read the requested files in order: `AGENTS.md`, `CODEX.md`, `CODEX-LOG.md`, `DUMP.md`, `TRACKER.md`, and `ROADMAP.md`.
- Confirmed from the handoff/current docs that the next product step is the affected-lane re-review for SP-20260611-002 FIX1:
  - `security-reviewer` against prior findings 1-4, preferably/pinned to provider `openai`.
  - `backend-reviewer` against prior findings 5-8.
- Confirmed constraints for this session: do not push without explicit in-session approval; leave `.claude/runtime/**` and `.claude/project/events/*.jsonl` alone unless explicitly asked; record all work here.
- Pre-dispatch checks:
  - `git status --short --branch`: on `sprint/SP-20260611-002`, ahead of origin by 11 commits, with pre-existing untracked `.codex/`, `CODEX-LOG.md`, and `runtime/sp002-dispatch/FIX1-*` artifacts.
  - `git rev-parse --abbrev-ref HEAD` / `git rev-parse --short HEAD`: `sprint/SP-20260611-002` at `7baa0e2`.
  - `node scripts/trackers/validate.js`: PASS, all 20 binding checks green; report-only anti-deixis warnings remain.
  - Inspected `scripts/dispatch-agent.js`: supports `--provider <claude|openai|gemini>` and provider aliases, so `security-reviewer --provider openai` is supported. `DISPATCH_LEDGER_DIR` can isolate completion/death ledgers outside `.claude/runtime`; provider trace still writes to `.claude/project/decisions/provider-trace.jsonl` and does not touch `.claude/project/events/*.jsonl`.
  - Inspected OpenAI provider path in `scripts/hooks/lib/providers.js`: OpenAI dispatch shells through `codex exec --sandbox workspace-write ... -m gpt-5.5 -`.
  - Gathered re-review inputs from `runtime/notes/sp002-gauntlet-fail-attempt1.md`, the FIX1 evidence already recorded below, and targeted diffs from `1f7b55c..HEAD`.

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

Scope this review ONLY to prior BACKEND findings 5-8 and same-class regressions in the changed framework/check scripts. This is a focused affected-lane re-review, not a product feature holdout review. No step holdout fixture applies.

Prior findings to re-check:
5. MAJOR scripts/checks/coverage-gate-scan.js live CLI called auditLedger(records) without external expectedSource, so production /scan remained self-derived and missed omitted roles.
6. MAJOR scripts/warpos/provider-tier-check.js unknown-self-attested was gated only on T1 met; selected t3 + T1 met + T2 unfunded + no T3 attestation must be tier_short, because missing T2 funding is value-free detectable.
7. MAJOR scripts/warpos/lib/provider-tier-config.js read errors such as EISDIR/EACCES were treated as absent greenfield corrupt:false; only ENOENT should be greenfield, other read failures must be corrupt:true.
8. MAJOR scripts/checks/planning-principles.js --enforce failed to fail-closed on scan-time exceptions because inner catches swallowed section matcher/read errors before the CLI catch.

Evaluate whether the FIX1 diff closes these exact backend/check failures in the live paths, not only pure injected seams. Also review the fixture quality enough to ensure each exploit would fail without the fix and is not merely asserting the new implementation.

Verdict rules:
- PASS only if findings 5-8 are all closed in live code and no same-class backend/check regression remains in the changed surface.
- FAIL if any prior finding remains exploitable, if a live caller is still unwired, or if the fix causes a fail-open where the finding required fail-closed behavior.
- WARNING is acceptable only for non-blocking style/coverage concerns.

Return ONLY one JSON object, no markdown fences, no prose. Use this schema:
{
  "feature":"SP-20260611-002 FIX1 affected-lane backend re-review",
  "score":100,
  "verdict":"PASS|WARNING|FAIL",
  "evaluationSources":["runtime/notes/sp002-gauntlet-fail-attempt1.md","CODEX-LOG.md","git diff 1f7b55c..HEAD"],
  "checks":{
    "fix_validation":{"passed":true,"closedFindings":[5,6,7,8],"findings":[]},
    "code_quality":{"passed":true,"scoreDelta":0,"findings":[],"lowWarnings":[]}
  },
  "blocking_issues":[],
  "warnings":[],
  "suggested_fixes":[]
}

# Targeted backend diff

```diff
diff --git a/scripts/checks/coverage-gate-scan.js b/scripts/checks/coverage-gate-scan.js
index 7ffbb44..7cd53ed 100644
--- a/scripts/checks/coverage-gate-scan.js
+++ b/scripts/checks/coverage-gate-scan.js
@@ -28,6 +28,7 @@
  *   node scripts/checks/coverage-gate-scan.js [--json] [--enforce] [--ledger <path>]
  */
 
+const fs = require("fs");
 const path = require("path");
 const { evaluate, readLedger } = require("../dispatch/coverage-gate");
 const { LEGACY_CUTOFF, cutoffFor, isLegacyDate } = require("../dispatch/legacy-cutoff");
@@ -155,6 +156,7 @@ function main() {
   const asJson = process.argv.includes("--json");
   const enforce = process.argv.includes("--enforce");
   const ledgerPath = flagVal("--ledger", null);
+  const expectedSourcePath = flagVal("--expected-source", null);
 
   let records;
   try {
@@ -171,9 +173,38 @@ function main() {
     return 0;
   }
 
+  // AC-5.3 (LIVE PATH) — resolve expectedSource from the external registry /
+  // sprint-composition file supplied via --expected-source <path>. Without this,
+  // the audit self-derives expected from the ledger's own ok:true records, so a
+  // role that produced NO record is never expected and its omission reads clean
+  // (the "omitted-role slip"). An external source breaks the self-reference: roles
+  // named there but absent from the ledger are gaps even in production /scan.
+  //
+  // Format of the JSON file (same shape as the `expectedSource` the pure seam takes):
+  //   ["role1", "role2"]                  — applies to ALL runs as a universal set
+  //   { "run-id": ["role1","role2"], ... } — per-run sets (wildcard key "*" for all)
+  //
+  // FAIL-OPEN: an unreadable / malformed expected-source file is warned and
+  // proceeds without — never breaks /scan:full, falls back to self-derive only.
+  let liveExpectedSource = null;
+  if (expectedSourcePath) {
+    try {
+      const raw = fs.readFileSync(expectedSourcePath, "utf8").replace(/^﻿/, "");
+      liveExpectedSource = JSON.parse(raw);
+    } catch (e) {
+      const msg = String((e && e.message) || e);
+      process.stdout.write(
+        (asJson
+          ? JSON.stringify({ ok: true, check: NAME, reportOnly: true, note: `expected-source unreadable (fail-open, self-derive fallback): ${msg}` })
+          : `WARN [${NAME}] --expected-source unreadable — proceeding with self-derive fallback (${msg})`) + "\n",
+      );
+      // liveExpectedSource stays null → self-derive fallback
+    }
+  }
+
   let audit;
   try {
-    audit = auditLedger(records);
+    audit = auditLedger(records, { expectedSource: liveExpectedSource });
   } catch (e) {
     const msg = String((e && e.message) || e);
     process.stdout.write(
diff --git a/scripts/checks/planning-principles.js b/scripts/checks/planning-principles.js
index 1bf2408..820abe6 100644
--- a/scripts/checks/planning-principles.js
+++ b/scripts/checks/planning-principles.js
@@ -142,13 +142,16 @@ function parseArgs(argv) {
 // Recursively collect plan `.md` files under `dir`, skipping README.md (the dir
 // contract) and dotfiles. Fail-open: a missing dir yields []; an unreadable entry
 // is skipped (recorded as a notice by the caller).
-function collectPlanDocs(dir, notices) {
+// Under --enforce (`enforce` truthy): a dir-read error is re-thrown (fail-closed)
+// rather than downgraded to a notice.
+function collectPlanDocs(dir, notices, enforce) {
   const docs = [];
   let entries;
   try {
     if (!fs.existsSync(dir)) return docs; // missing dir → nothing to scan
     entries = fs.readdirSync(dir, { withFileTypes: true });
   } catch (e) {
+    if (enforce) throw e; // fail-closed under --enforce: unreadable dir must not be silenced
     notices.push(`could not read dir ${dir} (fail-open): ${String(e.message || e)}`);
     return docs;
   }
@@ -163,7 +166,7 @@ function collectPlanDocs(dir, notices) {
       continue;
     }
     if (isDir) {
-      docs.push(...collectPlanDocs(full, notices));
+      docs.push(...collectPlanDocs(full, notices, enforce));
     } else if (isFile) {
       if (ent.name === "README.md") continue; // dir contract, not a plan
       if (ent.name.startsWith(".")) continue; // .gitkeep etc.
@@ -176,13 +179,15 @@ function collectPlanDocs(dir, notices) {
 // Collect TOP-LEVEL plan `.md` files directly under `dir` (NOT recursive — the
 // epics/plans/sprints subtrees are scanned separately). Skips README.md, dotfiles,
 // and any directory. Fail-open like collectPlanDocs. Used for AC-7.4 root-plan scope.
-function collectRootPlanDocs(dir, notices) {
+// Under --enforce (`enforce` truthy): a dir-read error is re-thrown (fail-closed).
+function collectRootPlanDocs(dir, notices, enforce) {
   const docs = [];
   let entries;
   try {
     if (!fs.existsSync(dir)) return docs;
     entries = fs.readdirSync(dir, { withFileTypes: true });
   } catch (e) {
+    if (enforce) throw e; // fail-closed under --enforce: unreadable dir must not be silenced
     notices.push(`could not read dir ${dir} (fail-open): ${String(e.message || e)}`);
     return docs;
   }
@@ -237,13 +242,13 @@ function scanPlanningPrinciples(opts = {}) {
   let docs = [];
   for (const d of dirs) {
     result.scannedDirs.push(d);
-    docs = docs.concat(collectPlanDocs(d, result.notices));
+    docs = docs.concat(collectPlanDocs(d, result.notices, opts.enforce));
   }
   // ROOT lifecycle plans live directly under _planning/ (NOT recursing into the
   // epics/plans/sprints subtrees already scanned). Only the top-level plan `.md`s.
   if (opts.includeRoot) {
     result.scannedDirs.push(planningDir);
-    docs = docs.concat(collectRootPlanDocs(planningDir, result.notices));
+    docs = docs.concat(collectRootPlanDocs(planningDir, result.notices, opts.enforce));
   }
   result.counts.docs = docs.length;
 
@@ -252,14 +257,25 @@ function scanPlanningPrinciples(opts = {}) {
     try {
       text = fs.readFileSync(file, "utf8");
     } catch (e) {
-      // Unreadable plan doc → fail-open: skip with a notice, do not flag/throw.
+      // Unreadable plan doc: posture diverges by mode.
+      //   report-only (default) → fail-open: skip with a notice, do not flag/throw.
+      //   --enforce             → fail-closed: an unreadable file must not be silenced
+      //                          into a notice (finding 8). Re-throw so the CLI catch
+      //                          exits 2 (AC-7.2 internal-error-fails-closed contract).
+      if (opts.enforce) throw e;
       result.notices.push(`could not read ${file} (fail-open): ${String(e.message || e)}`);
       continue;
     }
     const missing = REQUIRED_SECTIONS.filter((s) => {
       try {
         return !s.test(text);
-      } catch {
+      } catch (e) {
+        // Section-matcher error: posture diverges by mode (finding 8).
+        //   report-only → fail-open: swallow to false (section appears present).
+        //   --enforce   → fail-closed: a section-matcher throw returning false
+        //                 (= "not missing") can mask a real violation → ok:true.
+        //                 Re-throw so the CLI catch exits 2 (AC-7.2 contract).
+        if (opts.enforce) throw e;
         return false; // a regex fault must not flag a doc — fail-open
       }
     }).map((s) => s.label);
@@ -312,6 +328,7 @@ if (require.main === module) {
       includeSprints: args.includeSprints,
       includeRoot: args.includeRoot,
       planningDir: args.planningDir,
+      enforce: args.enforce, // finding 8: inner catches re-throw under --enforce (fail-closed)
     });
   } catch (e) {
     // An internal runner error. The posture DIVERGES by mode:
diff --git a/scripts/warpos/lib/provider-tier-config.js b/scripts/warpos/lib/provider-tier-config.js
index 10953b3..2ede04b 100644
--- a/scripts/warpos/lib/provider-tier-config.js
+++ b/scripts/warpos/lib/provider-tier-config.js
@@ -134,11 +134,22 @@ function readConfig(opts = {}) {
   }
   const file = opts.configPath || configPath();
   let raw;
+  let readErr;
   try {
     raw = fs.readFileSync(file, "utf8");
-  } catch {
-    // ABSENT (greenfield): no instance file → framework defaults, NOT corrupt.
-    return { config: FRAMEWORK_DEFAULTS(), source: "framework-default", corrupt: false, path: file };
+  } catch (e) {
+    readErr = e;
+  }
+  if (readErr) {
+    // TRUE ABSENCE (ENOENT only) → greenfield; framework defaults are authoritative,
+    // corrupt:false. ALL OTHER read failures (EISDIR — a directory sits at the path,
+    // EACCES — permission denied, EPERM, etc.) mean the path EXISTS or is blocked for
+    // a non-absence reason → corrupt:true → fail-closed hold. Only ENOENT is genuine
+    // absence; any other error code must NOT silently degrade to the framework-default
+    // t1 green (the false-green of #16, finding 7 — gauntlet attempt-1: before this
+    // fix, EISDIR returned corrupt:false and the fail-closed hold never applied).
+    const isAbsent = readErr.code === "ENOENT";
+    return { config: FRAMEWORK_DEFAULTS(), source: "framework-default", corrupt: !isAbsent, path: file };
   }
   let parsed;
   try {
diff --git a/scripts/warpos/provider-tier-check.js b/scripts/warpos/provider-tier-check.js
index ada2e0d..2d43dec 100644
--- a/scripts/warpos/provider-tier-check.js
+++ b/scripts/warpos/provider-tier-check.js
@@ -266,14 +266,20 @@ function verdictFor(provider, signals, config, opts = {}) {
   let verdict;
   if (tierRank(eff.tier) >= tierRank(selected)) {
     verdict = "tier_met";
-  } else if (signals.t1Met && tierRank(selected) >= tierRank("t3") && !eff.t3Judged) {
-    // unknown-self-attested is RESERVED for the genuinely-undetectable case: T1 (and
-    // the value-free funded signal) ARE detectable and only the T3 sub-floor needs a
-    // self-attestation/probe nobody provided → we cannot know → fail-open (never
-    // block). It is NOT used when T1 is DETECTABLY down — a down provider is a
-    // confident, value-free-detectable shortfall (AC-6.1 / AC-6.4 / #15). Gating on
-    // signals.t1Met is what keeps the `!t1Met` t3-selected case out of this branch
-    // and in `tier_short` below.
+  } else if (
+    signals.t1Met &&
+    !!(signals.keyCheck.present || signals.oauthFunded) && // T2 funded — value-free detectable
+    tierRank(selected) >= tierRank("t3") &&
+    !eff.t3Judged
+  ) {
+    // unknown-self-attested is RESERVED for the genuinely-undetectable case: BOTH T1
+    // AND T2 (the value-free funded signal) ARE confirmed, and ONLY the T3 sub-floor
+    // still needs a self-attestation/probe that nobody provided → we cannot know →
+    // fail-open (never block). T1 DOWN or T2 UNFUNDED are BOTH value-free-detectable
+    // shortfalls → they route to tier_short below (AC-6.1, finding 6). Gating on
+    // BOTH signals.t1Met AND t2_funded ensures neither detectably-short case leaks
+    // into the unknown branch. (Finding 6 — gauntlet attempt-1: before this fix, a
+    // T2-unfunded t3-selected cell produced unknown-self-attested+ok:true.)
     verdict = "unknown-self-attested";
   } else {
     // Confident, value-free-detectable shortfall — incl. T1 down for any selected
diff --git a/tests/regression/S-LC-10/provider-tier-check.test.js b/tests/regression/S-LC-10/provider-tier-check.test.js
index 7175183..82c5f8b 100644
--- a/tests/regression/S-LC-10/provider-tier-check.test.js
+++ b/tests/regression/S-LC-10/provider-tier-check.test.js
@@ -283,15 +283,22 @@ ok("CLI: default check exits 0 (report-only) on the real tree", () => {
 });
 
 ok("CLI --enforce: unknown-self-attested NEVER trips the gate (fail-open exit 0)", () => {
-  // Point at a temp config that selects t3 for claude with NO attestation →
-  // unknown-self-attested → --enforce must still exit 0.
+  // Point at a temp config that selects t3 for claude with T2 funded but NO
+  // attestation -> unknown-self-attested -> --enforce must still exit 0.
+  // Finding-6 tightened this reserved branch: T2 must be funded, otherwise the
+  // value-free-detectable shortfall is tier_short.
   const dir = fs.mkdtempSync(path.join(os.tmpdir(), "slc10-enf-"));
   const cp = path.join(dir, "cfg.json");
   fs.writeFileSync(cp, JSON.stringify({ version: 1, t3_floor: "max_5x", providers: { claude: { selected_tier: "t3" } } }));
   // execFileSync throws if exit != 0; success here = exit 0.
-  const out = execFileSync("node", [ENGINE, "--json", "--enforce", "--config-path", cp], { cwd: ROOT, encoding: "utf8" });
+  const out = execFileSync("node", [ENGINE, "--json", "--enforce", "--config-path", cp], {
+    cwd: ROOT,
+    encoding: "utf8",
+    env: { ...process.env, ANTHROPIC_API_KEY: "fixture-value" },
+  });
   const r = JSON.parse(out);
   const claude = r.providers.find((p) => p.provider === "claude");
+  assert.strictEqual(claude.t2_funded, true, "fixture must represent T2 funded; otherwise finding-6 correctly returns tier_short");
   assert.strictEqual(claude.verdict, "unknown-self-attested", "undetectable T3 → unknown");
 });
 
diff --git a/tests/regression/SP-20260611-002/coverage-gate-scan-live-cli.test.js b/tests/regression/SP-20260611-002/coverage-gate-scan-live-cli.test.js
new file mode 100644
index 0000000..bccd20a
--- /dev/null
+++ b/tests/regression/SP-20260611-002/coverage-gate-scan-live-cli.test.js
@@ -0,0 +1,176 @@
+#!/usr/bin/env node
+"use strict";
+
+/**
+ * SP-20260611-002 FIX1-G3a (finding 5) — coverage-gate-scan LIVE CLI external
+ * expected-source wiring. Surface: scripts/checks/coverage-gate-scan.js CLI path.
+ *
+ * EXPLOIT FIXTURE — drives the REAL CLI (node coverage-gate-scan.js), NOT the
+ * pure module seam (auditLedger() with injected expectedSource). The source-suite
+ * (coverage-gate-scan-source.test.js) already proves the pure seam works; THIS
+ * test proves the live CLI path resolves and passes the external source so that
+ * production /scan catches the omitted-role slip, not only tests with injection.
+ *
+ * AC-5.3 finding 5 — the live CLI called auditLedger(records) with NO expectedSource,
+ * so production /scan remained self-derived: a role that produced NO record was never
+ * expected and its omission read clean. This fixture:
+ *
+ *   (A) REDs without the fix (self-derive path — no gap for the missing role), and
+ *   (B) GREENs with the fix (external source resolves via --expected-source — the
+ *       missing role is reported as a gap in the real CLI output).
+ *
+ * Mutation-verify: revert the live wiring (remove the expectedSource pass in main())
+ * → case (B) REDs (the CLI no longer reports the gap).
+ *
+ *   node tests/regression/SP-20260611-002/coverage-gate-scan-live-cli.test.js
+ */
+
+const assert = require("assert");
+const fs = require("fs");
+const os = require("os");
+const path = require("path");
+const { spawnSync } = require("child_process");
+
+const ROOT = path.resolve(__dirname, "..", "..", "..");
+const { harness } = require(path.join(ROOT, "scripts", "checks", "lib", "fixture-harness"));
+const CLI = path.join(ROOT, "scripts", "checks", "coverage-gate-scan.js");
+const { ARGV_SCHEMA_VERSION } = require(path.join(ROOT, "scripts", "dispatch", "dispatch-contract"));
+
+const h = harness("SP-002-FIX1-G3a/coverage-gate-scan-live-cli");
+
+const RUN_ID = "run-live-cli-exploit-g3a";
+// A post-cutoff timestamp so legacy scoping does NOT exempt this run.
+const TS_POST = "2026-06-11T14:00:00Z";
+
+// A realistic BACKED dispatch-completions record (same shape as the source-suite uses).
+function makeRecord(role, provider) {
+  return JSON.stringify({
+    dispatch_id: `d-${role}-live`,
+    cmdline_checksum: "sha256:deadbeef00001",
+    run_id: RUN_ID,
+    role,
+    provider,
+    ok: true,
+    argv_schema_version: ARGV_SCHEMA_VERSION,
+    output_digest: "sha256:feedface00000000000000000001",
+    ts: TS_POST,
+  });
+}
+
+/**
+ * Run the REAL CLI via spawnSync. Returns { status, out, raw, stderr }.
+ * `out` is the parsed JSON (or null if parse fails).
+ */
+function runCLI(ledgerPath, extraArgs = []) {
+  const r = spawnSync(
+    process.execPath,
+    [CLI, "--json", "--ledger", ledgerPath, ...extraArgs],
+    { cwd: ROOT, encoding: "utf8" },
+  );
+  let out = null;
+  try { out = r.stdout ? JSON.parse(r.stdout) : null; } catch { /* raw below */ }
+  return { status: r.status, out, raw: r.stdout || "", stderr: r.stderr || "" };
+}
+
+// ── Set up temp fixture files ────────────────────────────────────────────────
+// These are reused across all test cases (setup is not teardown-sensitive for
+// read-only temp files — they are named in OS temp and cleaned below).
+
+const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-livecli-g3a-"));
+
+// Ledger: ONLY frontend-builder produced a record; security-reviewer is absent.
+const LEDGER_PATH = path.join(tmpDir, "dispatch-completions.jsonl");
+fs.writeFileSync(LEDGER_PATH, makeRecord("frontend-builder", "claude") + "\n", "utf8");
+
+// Expected-source JSON: names BOTH roles the run was composed to require.
+// Per-run map format — the same shape as what the composition / registry would supply.
+const EXPECTED_SOURCE_PATH = path.join(tmpDir, "expected-source.json");
+fs.writeFileSync(
+  EXPECTED_SOURCE_PATH,
+  JSON.stringify({ [RUN_ID]: ["frontend-builder", "security-reviewer"] }),
+  "utf8",
+);
+
+// ── Test cases ───────────────────────────────────────────────────────────────
+
+// EXPLOIT / RED path: without --expected-source, the LIVE CLI self-derives from
+// the ledger — only frontend-builder is expected (it produced a record), so the
+// missing security-reviewer is INVISIBLE. This is the bug the fix closes.
+h.test("MUTATION-VERIFY — without --expected-source, the LIVE CLI self-derives and does NOT report the missing role (this is the bug that was fixed)", () => {
+  const r = runCLI(LEDGER_PATH /* no --expected-source */);
+  // Self-derive path: security-reviewer never expected → no gap → CLI says ok:true.
+  assert.ok(r.out !== null, `CLI produced non-JSON output:\n${r.raw}\n${r.stderr}`);
+  assert.strictEqual(
+    r.out.ok, true,
+    `Self-derive (no external source) should show ok:true (no gap) — if this fails, the self-derive changed:\n${JSON.stringify(r.out, null, 2)}`,
+  );
+  const gapCount = r.out.counts ? r.out.counts.gaps : null;
+  assert.strictEqual(gapCount, 0,
+    `Expected 0 gaps from self-derive, got ${gapCount}:\n${JSON.stringify(r.out, null, 2)}`,
+  );
+});
+
+// EXPLOIT / GREEN path (after the fix): WITH --expected-source, the LIVE CLI
+// resolves the external set, finds security-reviewer expected but absent, and
+// reports a gap. This is the core assertion: the live CLI now catches the slip.
+h.violation("LIVE CLI with --expected-source reports the gap for the omitted role (omitted-role slip caught in production /scan)", () => {
+  const r = runCLI(LEDGER_PATH, ["--expected-source", EXPECTED_SOURCE_PATH]);
+  // The gap is in the output — ok:false and counts.gaps > 0.
+  // violation() checks that the result is NOT a pass (gap = !ok = not-pass → caught).
+  return r.out || { ok: true }; // fallback to ok:true (=pass=false-green) if out is null
+});
+
+// Specificity: the violation names the missing role explicitly.
+h.test("LIVE CLI gap output explicitly names security-reviewer as the missing role", () => {
+  const r = runCLI(LEDGER_PATH, ["--expected-source", EXPECTED_SOURCE_PATH]);
+  assert.ok(r.out !== null, `CLI produced non-JSON:\n${r.raw}\n${r.stderr}`);
+  assert.strictEqual(r.out.ok, false,
+    `Expected ok:false (gap) from LIVE CLI with external source:\n${JSON.stringify(r.out, null, 2)}`);
+  const gapCount = r.out.counts ? r.out.counts.gaps : 0;
+  assert.ok(gapCount > 0,
+    `Expected counts.gaps > 0 from LIVE CLI with external source:\n${JSON.stringify(r.out, null, 2)}`);
+  // The run's violation list must mention security-reviewer.
+  const violationText = JSON.stringify(r.out.runs || []);
+  assert.ok(
+    /security-reviewer/.test(violationText),
+    `Expected the violation to name security-reviewer; got runs:\n${violationText}`,
+  );
+});
+
+// No false positive: when the ledger has records for BOTH roles, the live CLI
+// with the same --expected-source reports ok:true (no gap).
+h.pass("LIVE CLI with --expected-source reports no gap when BOTH expected roles have records", () => {
+  const bothDir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-livecli-g3a-both-"));
+  const bothLedger = path.join(bothDir, "both.jsonl");
+  fs.writeFileSync(
+    bothLedger,
+    makeRecord("frontend-builder", "claude") + "\n" + makeRecord("security-reviewer", "gemini") + "\n",
+    "utf8",
+  );
+  try {
+    const r = runCLI(bothLedger, ["--expected-source", EXPECTED_SOURCE_PATH]);
+    return r.out || { ok: false };
+  } finally {
+    fs.rmSync(bothDir, { recursive: true, force: true });
+  }
+});
+
+// FAIL-OPEN: a malformed (non-JSON) --expected-source file must NOT crash the CLI —
+// it falls back to self-derive and exits 0 (the audit must never break /scan:full).
+h.pass("LIVE CLI with a malformed --expected-source falls back to self-derive (fail-open, exit 0)", () => {
+  const badDir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-livecli-g3a-bad-"));
+  const badSource = path.join(badDir, "bad.json");
+  fs.writeFileSync(badSource, "not json {{{{ bad", "utf8");
+  try {
+    const r = runCLI(LEDGER_PATH, ["--expected-source", badSource]);
+    // Fail-open: exit 0 (report-only mode, and unreadable source → self-derive fallback).
+    return r.status === 0 ? { ok: true } : { ok: false };
+  } finally {
+    fs.rmSync(badDir, { recursive: true, force: true });
+  }
+});
+
+// ── Cleanup and done ────────────────────────────────────────────────────────
+try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* best effort */ }
+
+h.done();
diff --git a/tests/regression/SP-20260611-002/planning-principles-enforce.test.js b/tests/regression/SP-20260611-002/planning-principles-enforce.test.js
index 36ef18d..8514f47 100644
--- a/tests/regression/SP-20260611-002/planning-principles-enforce.test.js
+++ b/tests/regression/SP-20260611-002/planning-principles-enforce.test.js
@@ -236,4 +236,219 @@ function makePlanningTreeEphemeral(files) {
   return makePlanningTree(files);
 }
 
+// ── Finding-8: scan-time exceptions must FAIL CLOSED under --enforce ───────────
+//
+// Context: the AC-7.2 cells above prove an *unhandled* exception from
+// scanPlanningPrinciples exits 2. Finding 8 is about exceptions that were
+// HANDLED INCORRECTLY *inside* the scan:
+//
+//   (A) Section-matcher throw (lines ~262-263 pre-fix): caught and returned `false`
+//       (= "not missing"), which made a BAD doc appear ok:true — a FALSE-GREEN.
+//   (B) Unreadable file: silently added to notices and skipped — NOT counted as a
+//       finding, so the doc disappears from the report entirely.
+//   (C) Unreadable dir: readdirSync error silently demoted to a notice.
+//
+// Fix: under --enforce, each inner catch re-throws so the CLI's outer catch (which
+// already correctly exits 2) actually sees the error.
+//
+// Mutation-verify contract:
+//   REVERT the fix (inner catch returns false / notices instead of re-throwing)
+//   → each h.failClosed cell below must RED (the scan returns ok:true or exit 0,
+//     which isPass treats as a false-green → the test fails).
+
+// Exploit fixture: a doc with ALL THREE principle sections labelled — EXCEPT
+// blast-radius. When the blast-radius section test is patched to THROW:
+//   - pre-fix: throw swallowed to false (not-missing) → doc appears ok:true  [BUG]
+//   - post-fix: throw propagates under --enforce → scan throws → CLI exits 2  [FIX]
+const PARTIAL_NO_BLAST_RADIUS = `# E-PARTIAL-F8-001 — enforcer + proof present; blast-radius ABSENT
+## Enforcer
+Enforced by scripts/checks/example.js (report-only ramp).
+## Proof
+Verified by the regression test run.
+## Notes
+No blast-radius assessment is present in this document (the intentional gap for Finding-8).
+`;
+
+// ── (A) Section-matcher throw ────────────────────────────────────────────────
+
+// API-level: the CORE mutation-verify cell.
+//   Without fix: scanPlanningPrinciples returns {ok:true} — blast-radius throw is
+//   swallowed to false (not-missing) so the doc appears well-formed.
+//   isPass({ok:true}) = true → h.failClosed flags it as FALSE-GREEN → test FAILS (RED).
+//   With fix: scan re-throws → h.failClosed catches the throw and counts it as
+//   fail-closed → test PASSES (GREEN).
+h.failClosed(
+  "Finding-8(A) section-matcher throw under --enforce FAILS CLOSED (API: must not be swallowed to ok:true)",
+  () => {
+    const dir = makePlanningTree({ "epics/E-PARTIAL-F8-001.md": PARTIAL_NO_BLAST_RADIUS });
+    const blastSec = mod.REQUIRED_SECTIONS.find((s) => s.key === "blast-radius");
+    const origTest = blastSec.test;
+    blastSec.test = () => {
+      throw new Error("section matcher BOOM — blast-radius (Finding-8 exploit)");
+    };
+    try {
+      // Under --enforce, the throw must propagate (not be swallowed to ok:true).
+      return mod.scanPlanningPrinciples({ planningDir: dir, enforce: true });
+    } finally {
+      blastSec.test = origTest;
+      fs.rmSync(dir, { recursive: true, force: true });
+    }
+  },
+);
+
+// Without --enforce the historic fail-open contract must be unchanged: the throw
+// is caught and returned false (section appears present), the scan returns a result.
+h.pass(
+  "Finding-8(A) section-matcher throw WITHOUT --enforce is still fail-open (API: returns result, no throw)",
+  () => {
+    const dir = makePlanningTree({ "epics/E-PARTIAL-F8-001.md": PARTIAL_NO_BLAST_RADIUS });
+    const blastSec = mod.REQUIRED_SECTIONS.find((s) => s.key === "blast-radius");
+    const origTest = blastSec.test;
+    blastSec.test = () => {
+      throw new Error("section matcher BOOM — blast-radius (Finding-8 exploit)");
+    };
+    try {
+      // Without enforce: the throw is swallowed → ok:true (blast-radius appears present).
+      // isPass({ok:true}) = true → h.pass counts it as PASS (no over-block). ✓
+      return mod.scanPlanningPrinciples({ planningDir: dir, enforce: false });
+    } finally {
+      blastSec.test = origTest;
+      fs.rmSync(dir, { recursive: true, force: true });
+    }
+  },
+);
+
+// CLI-level (child process injection): section-matcher throw → exit 2 under --enforce.
+// Mirrors the AC-7.2 pattern: inlines the CLI contract in a child, patches the
+// blast-radius test to throw, and asserts the exit code.
+function spawnSectionThrowCLITest(enforceFlag) {
+  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wsg3c-pp-f8st-"));
+  fs.mkdirSync(path.join(dir, "epics"), { recursive: true });
+  fs.writeFileSync(path.join(dir, "epics", "E-PARTIAL-F8-001.md"), PARTIAL_NO_BLAST_RADIUS, "utf8");
+  const child = `
+    const mod = require(${JSON.stringify(CHECK)});
+    const blastSec = mod.REQUIRED_SECTIONS.find(s => s.key === "blast-radius");
+    blastSec.test = function() { throw new Error("section matcher BOOM (CLI-level F8 exploit)"); };
+    const enforce = ${enforceFlag ? "true" : "false"};
+    let r;
+    try {
+      r = mod.scanPlanningPrinciples({ planningDir: ${JSON.stringify(dir)}, enforce });
+    } catch (e) {
+      if (enforce) { process.stderr.write("FAIL fail-closed: " + e.message + "\\n"); process.exit(2); }
+      process.exit(0); // fail-open without enforce
+    }
+    r.reportOnly = !enforce;
+    process.exit(r.reportOnly || r.ok ? 0 : 1);
+  `;
+  const result = spawnSync(process.execPath, ["-e", child], { encoding: "utf8" });
+  fs.rmSync(dir, { recursive: true, force: true });
+  return result;
+}
+
+h.failClosed(
+  "Finding-8(A) section-matcher throw → fail-closed under --enforce (CLI: exit 2)",
+  () => spawnSectionThrowCLITest(true).status,
+);
+
+h.pass(
+  "Finding-8(A) section-matcher throw without --enforce (CLI: exit 0, fail-open preserved)",
+  () => spawnSectionThrowCLITest(false).status,
+);
+
+// ── (B) Unreadable file ──────────────────────────────────────────────────────
+
+// CLI-level: readFileSync EACCES during scan under --enforce → exit 2.
+// Stubs fs.readFileSync inside a child so .md reads throw — cross-platform
+// (no chmod required, which doesn't protect on Windows).
+function spawnUnreadableFileCLITest(enforceFlag) {
+  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wsg3c-pp-f8uf-"));
+  fs.mkdirSync(path.join(dir, "epics"), { recursive: true });
+  // The file exists (so it appears in readdirSync) but readFileSync is stubbed to throw.
+  fs.writeFileSync(path.join(dir, "epics", "E-UNREADABLE.md"), PLANTED_BAD, "utf8");
+  const child = `
+    const fs = require("fs");
+    // Stub readFileSync: any .md plan file → EACCES (simulate unreadable plan doc)
+    const origRead = fs.readFileSync.bind(fs);
+    fs.readFileSync = function(p, enc) {
+      if (typeof p === "string" && /\\.md$/i.test(p)) {
+        throw Object.assign(new Error("EACCES: permission denied, open '" + p + "'"), { code: "EACCES" });
+      }
+      return origRead(p, enc);
+    };
+    const mod = require(${JSON.stringify(CHECK)});
+    const enforce = ${enforceFlag ? "true" : "false"};
+    let r;
+    try {
+      r = mod.scanPlanningPrinciples({ planningDir: ${JSON.stringify(dir)}, enforce });
+    } catch (e) {
+      if (enforce) { process.stderr.write("FAIL fail-closed: " + e.message + "\\n"); process.exit(2); }
+      process.exit(0); // fail-open without enforce
+    }
+    r.reportOnly = !enforce;
+    // Without enforce: unreadable file → notice + skip → ok:true (0 gaps). Exit 0.
+    process.exit(r.reportOnly || r.ok ? 0 : 1);
+  `;
+  const result = spawnSync(process.execPath, ["-e", child], { encoding: "utf8" });
+  fs.rmSync(dir, { recursive: true, force: true });
+  return result;
+}
+
+h.failClosed(
+  "Finding-8(B) unreadable file under --enforce FAILS CLOSED (CLI: exit 2)",
+  () => spawnUnreadableFileCLITest(true).status,
+);
+
+h.pass(
+  "Finding-8(B) unreadable file without --enforce stays fail-open (CLI: exit 0)",
+  () => spawnUnreadableFileCLITest(false).status,
+);
+
+// ── (C) Unreadable dir ───────────────────────────────────────────────────────
+
+// CLI-level: readdirSync EACCES on the epics dir under --enforce → exit 2.
+// The epics dir is pre-created so existsSync passes; readdirSync is then stubbed.
+function spawnUnreadableDirCLITest(enforceFlag) {
+  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wsg3c-pp-f8ud-"));
+  // Pre-create the epics subdir so existsSync returns true in collectPlanDocs,
+  // then the stubbed readdirSync throws before any doc is collected.
+  fs.mkdirSync(path.join(dir, "epics"), { recursive: true });
+  const child = `
+    const nodePath = require("path");
+    const nodeFs = require("fs");
+    // Stub readdirSync: the epics dir basename → EACCES
+    const origReaddir = nodeFs.readdirSync.bind(nodeFs);
+    nodeFs.readdirSync = function(p, opts) {
+      if (typeof p === "string" && nodePath.basename(p) === "epics") {
+        throw Object.assign(new Error("EACCES: permission denied, scandir '" + p + "'"), { code: "EACCES" });
+      }
+      return origReaddir(p, opts);
+    };
+    const mod = require(${JSON.stringify(CHECK)});
+    const enforce = ${enforceFlag ? "true" : "false"};
+    let r;
+    try {
+      r = mod.scanPlanningPrinciples({ planningDir: ${JSON.stringify(dir)}, enforce });
+    } catch (e) {
+      if (enforce) { process.exit(2); }
+      process.exit(0); // fail-open without enforce
+    }
+    r.reportOnly = !enforce;
+    // Without enforce: unreadable dir → notice + empty docs → ok:true (0 gaps). Exit 0.
+    process.exit(r.reportOnly || r.ok ? 0 : 1);
+  `;
+  const result = spawnSync(process.execPath, ["-e", child], { encoding: "utf8" });
+  fs.rmSync(dir, { recursive: true, force: true });
+  return result;
+}
+
+h.failClosed(
+  "Finding-8(C) unreadable dir under --enforce FAILS CLOSED (CLI: exit 2)",
+  () => spawnUnreadableDirCLITest(true).status,
+);
+
+h.pass(
+  "Finding-8(C) unreadable dir without --enforce stays fail-open (CLI: exit 0)",
+  () => spawnUnreadableDirCLITest(false).status,
+);
+
 h.done();
diff --git a/tests/regression/SP-20260611-002/provider-tier-matrix.test.js b/tests/regression/SP-20260611-002/provider-tier-matrix.test.js
index 6e7b43a..e00c0a7 100644
--- a/tests/regression/SP-20260611-002/provider-tier-matrix.test.js
+++ b/tests/regression/SP-20260611-002/provider-tier-matrix.test.js
@@ -119,9 +119,16 @@ ok("AC-6.1 CLI: t3-selected + T1 down (real claude harness is up, so plant a DOW
     assert.strictEqual(res.status, 2, "--enforce REDS (exit 2) on a confident tier_short — never exit 0");
     assert.strictEqual(r.ok, false, "envelope ok:false mirrors the tier_short");
   } else {
-    // Document the branch so a CI where the CLI is installed still asserts
-    // SOMETHING real rather than silently passing.
-    assert.notStrictEqual(openai.verdict, "tier_short", "if T1 is up, this is not the AC-6.1 cell");
+    // T1 is up. Two valid sub-cases after finding-6 fix (T2 unfunded is now a
+    // detectable shortfall, not unknown):
+    // (a) T2 not funded + t3 selected → tier_short (finding 6), --enforce REDS.
+    // (b) T1+T2 met + no T3 attestation → unknown-self-attested + exit 0 (fail-open).
+    if (!openai.t2_funded) {
+      assert.strictEqual(openai.verdict, "tier_short", "T1 up but T2 unfunded → tier_short (finding 6 fix)");
+    } else {
+      // T1+T2 both met, only T3 undetectable → unknown-self-attested (fail-open, not the T1-down cell).
+      assert.notStrictEqual(openai.verdict, "tier_short", "T1+T2 met — this is the unknown-self-attested cell, not the T1-down cell");
+    }
   }
 });
 
@@ -357,5 +364,73 @@ ok("MATRIX: the {selected_tier × t1_met × config_readable → verdict} grid is
   assert.strictEqual(corrupt.corrupt, true, "config_readable=false (corrupt) → fail-closed signal present");
 });
 
+// ═════════════════════════════════════════════════════════════
+// FINDING-6 (gauntlet, attempt-1) — unknown-self-attested must require T2 funded
+// When T2 is detectably unfunded and t3 is selected, verdict is tier_short,
+// NOT unknown-self-attested. T2 funding is value-free detectable (key name /
+// oauth) — it is NOT in the "genuinely undetectable" class.
+// ═════════════════════════════════════════════════════════════
+ok("FINDING-6: t3 selected + T1 met + T2 UNFUNDED + no T3 attestation → tier_short + ok:false; T2 unfunded is value-free detectable (NOT unknown-self-attested)", () => {
+  // This cell was unknown-self-attested+ok:true before the fix. The reserved case
+  // for unknown-self-attested requires BOTH T1 AND T2 to be confirmed; a missing
+  // T2 funded signal is a confident, value-free-detectable shortfall → tier_short.
+  const r = tier.buildReport({
+    providers: ["claude"],
+    configOverride: cfg({ providers: { claude: { selected_tier: "t3" } } }),
+    signalsOverride: { claude: { t1Met: true, authTier: "harness", t2KeyPresent: false } }, // T1 met, T2 NOT funded
+  });
+  const row = rowFor(r, "claude");
+  assert.strictEqual(row.t1_met, true, "T1 IS met");
+  assert.strictEqual(row.t2_funded, false, "T2 is NOT funded");
+  assert.strictEqual(row.verdict, "tier_short", "T2 unfunded is detectable → tier_short, NOT unknown-self-attested");
+  assert.notStrictEqual(row.verdict, "unknown-self-attested", "unknown-self-attested requires BOTH T1 and T2 met (finding 6)");
+  assert.strictEqual(r.verdict_summary, "tier_short");
+  assert.strictEqual(r.ok, false, "envelope ok:false — false-green impossible");
+  // --enforce contract: this cell must RED (exit 2) under --enforce
+  const wouldExit = r.verdict_summary === "tier_short" ? 2 : 0;
+  assert.strictEqual(wouldExit, 2, "--enforce must RED (exit 2) on T2-unfunded t3-selected cell");
+});
+
+ok("FINDING-6 MATRIX extension: MATRIX grid includes {sel:t3, t1:true, key:false, sub:null} → tier_short (the previously-missing T2-unfunded cell)", () => {
+  // Extends the existing 9-cell matrix with the cell the gauntlet identified as missing.
+  const r = tier.buildReport({
+    providers: ["openai"],
+    configOverride: cfg({ providers: { openai: { selected_tier: "t3" } } }),
+    signalsOverride: { openai: { t1Met: true, authTier: "key", t2KeyPresent: false } }, // T1 met, T2 NOT funded
+  });
+  const row = rowFor(r, "openai");
+  assert.strictEqual(row.verdict, "tier_short", "{sel:t3, t1:true, key:false} → tier_short (not unknown-self-attested)");
+  assert.strictEqual(r.ok, false);
+});
+
+// ═════════════════════════════════════════════════════════════
+// FINDING-7 (gauntlet, attempt-1) — EISDIR / EACCES is corrupt:true, not greenfield
+// Only TRUE ABSENCE (ENOENT) is the greenfield case. Any other read failure
+// (a directory at the path, permission denial) means the path EXISTS or is
+// otherwise blocked — it must be corrupt:true → fail-closed hold.
+// ═════════════════════════════════════════════════════════════
+ok("FINDING-7: EISDIR (directory at --config-path) → corrupt:true + fail-closed hold; NOT corrupt:false greenfield", () => {
+  // Create a DIRECTORY at the config path (not a file). readFileSync throws EISDIR,
+  // which is NOT ENOENT. Before the fix this returned corrupt:false (treated as
+  // absent/greenfield); after the fix it returns corrupt:true (fail-closed).
+  const dirPath = path.join(nsTmpdir("f7-eisdir"), "config-is-a-directory");
+  fs.mkdirSync(dirPath, { recursive: true });
+
+  // Layer 1: readConfig distinguishes EISDIR from ENOENT
+  const read = cfgLib.readConfig({ configPath: dirPath });
+  assert.strictEqual(read.corrupt, true, "EISDIR is not ENOENT — a directory at the path is present-but-unreadable → corrupt:true (finding 7)");
+  assert.strictEqual(read.source, "framework-default", "resolved config is still framework defaults");
+
+  // Layer 2: the engine fails closed on corrupt:true
+  const r = tier.buildReport({
+    providers: ["claude"],
+    configPath: dirPath,
+    signalsOverride: { claude: { t1Met: true, authTier: "harness", t2KeyPresent: true } },
+  });
+  assert.strictEqual(r.config_corrupt, true, "report flags the EISDIR as corrupt");
+  assert.strictEqual(r.verdict_summary, "tier_short", "fail-closed HOLD — never degrades to greenfield t1 green");
+  assert.strictEqual(r.ok, false, "envelope ok:false on the corrupt-config hold");
+});
+
 console.log(`\nSP-20260611-002 WS-G3b provider-tier-matrix: ${pass} passed, ${fail} failed`);
 process.exit(fail ? 1 : 0);

```
