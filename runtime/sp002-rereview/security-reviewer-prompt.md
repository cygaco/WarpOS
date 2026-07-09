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

# Role: security-reviewer

Scope this review ONLY to prior SECURITY findings 1-4 and same-class regressions in the changed files. You are not doing a full product security scan.

Prior findings to re-check:
1. BLOCKER scripts/hooks/team-guard.js namedTeamVerified foreign named-team project-scope bypass: a real foreign team such as doogle-sprint must not verify for this project unless slug/member cwd proves ownership.
2. BLOCKER scripts/hooks/team-guard.js readiness selected globally freshest foreign epsilon team instead of project-scoped freshest team.
3. BLOCKER scripts/hooks/authorization-gate.js node-e-fs approved mixed write plus rmSync/unlinkSync/rmdirSync; any destructive fs call in node -e must poison auto-approval even when write/append/mkdir is also present.
4. MAJOR scripts/checks/mode-write-coverage.js accepted a same-target lifecycle event before current mode.json mtime; corroboration must be post-mtime only.

Evaluate whether the FIX1 diff closes these exact exploit classes without creating an equivalent bypass or an unacceptable fail-open. Positive compatibility is allowed where documented: unknown project slug can preserve old behavior, and pure write/append/mkdir node -e remains approvable.

Verdict rules:
- PASS only if all four prior findings are closed and no same-class bypass remains in the changed surface.
- FAIL if any prior finding remains exploitable, if the fix relies only on happy-path tests while live code remains bypassable, or if a new security regression appears in the changed surface.
- WARN only for non-blocking cleanup/coverage concerns that do not reopen the exploit class.

Return ONLY one JSON object, no markdown fences, no prose. Use this schema:
{
  "agent":"security-reviewer",
  "version":1,
  "verdict":"pass|warn|fail",
  "confidence":0.0,
  "findings":[
    {"id":"SR-REVIEW-001","severity":"BLOCKER|MAJOR|MINOR|INFO","file":"path","line":0,"finding":"concise issue","evidence":"specific code/test evidence","remediation":"specific required change"}
  ],
  "requiresHuman":false,
  "details":{
    "scope":"SP-20260611-002 FIX1 affected-lane security re-review findings 1-4",
    "closedFindings":[1,2,3,4],
    "notes":[]
  }
}

# Targeted security diff

```diff
diff --git a/scripts/checks/mode-write-coverage.js b/scripts/checks/mode-write-coverage.js
index 29aa8ce..146cf3f 100644
--- a/scripts/checks/mode-write-coverage.js
+++ b/scripts/checks/mode-write-coverage.js
@@ -126,8 +126,17 @@ function evaluate({ modeState, modeUnreadable, lifecycleEvents, windowMs, nowMs
   const mtimeMs = modeState.mtimeMs;
 
   // Find a corroborating lifecycle event: a CORROBORATING_EVENTS record whose
-  // payload.target_mode === the file's mode AND whose timestamp is within the
-  // window of the file's mtime (the sanctioned write emitted it ~at write time).
+  // payload.target_mode === the file's mode AND whose timestamp is POST-mtime
+  // within the window (the sanctioned write emitted it AT OR AFTER the file
+  // was written — never before).
+  //
+  // FINDING 4 FIX (FIX1-G1): the window is POST-mtime only — a lifecycle event
+  // that predates the mode.json mtime CANNOT corroborate it. The attack: a
+  // legitimate mode switch at T₀ emits an event; an attacker does an out-of-band
+  // rewrite at T₀+5min (mtime = T₀+5min). The old ±window check accepted the
+  // pre-mtime event (|T₀ − (T₀+5min)| = 5min ≤ 120min) → false green. The fix:
+  // require evMs ≥ mtimeMs (event happened AT OR AFTER the file write) AND
+  // evMs − mtimeMs ≤ windowMs (upper bound — emit-after-write latency tolerance).
   let corroborating = null;
   for (const ev of lifecycleEvents) {
     if (!ev || ev.event == null) continue;
@@ -136,7 +145,9 @@ function evaluate({ modeState, modeUnreadable, lifecycleEvents, windowMs, nowMs
     if (target !== wantMode) continue;
     const evMs = ev.tsMs;
     if (typeof evMs !== "number" || isNaN(evMs)) continue;
-    if (Math.abs(evMs - mtimeMs) <= windowMs) {
+    // POST-mtime lower bound: event must be AT OR AFTER the file write.
+    // Upper bound: event must be within windowMs of the mtime.
+    if (evMs >= mtimeMs && evMs - mtimeMs <= windowMs) {
       corroborating = ev;
       break;
     }
@@ -158,8 +169,9 @@ function evaluate({ modeState, modeUnreadable, lifecycleEvents, windowMs, nowMs
       ageMinutes: Math.round((nowMs - mtimeMs) / 60000),
       reason:
         `mode.json is "${wantMode}" but NO mode-switch lifecycle event corroborates ` +
-        `it within ${Math.round(windowMs / 60000)}m of the file mtime — an out-of-band ` +
-        `write that bypassed scripts/mode-set.js (the single-writer chokepoint)`,
+        `it within ${Math.round(windowMs / 60000)}m POST-mtime (event must be at or ` +
+        `after the file write, not before) — an out-of-band write that bypassed ` +
+        `scripts/mode-set.js (the single-writer chokepoint)`,
     },
     corroboratingEvent: null,
   };
diff --git a/scripts/hooks/authorization-gate.js b/scripts/hooks/authorization-gate.js
index fe70a5a..8772ff9 100644
--- a/scripts/hooks/authorization-gate.js
+++ b/scripts/hooks/authorization-gate.js
@@ -116,6 +116,18 @@ function matchNodeEFs(toolName, ti) {
   // guards / the tracked-work-delete floor below). The scope vocabulary in
   // apply.js#SCOPE_PERMISSIONS already lists only write/append/mkdir; this matcher
   // is the gate side of that contract.
+  //
+  // ALL-OR-NOTHING (gauntlet finding 3 — AC-4.1 extension): if the node -e body
+  // contains ANY rmSync / unlinkSync / rmdirSync call — even alongside an allowed
+  // write/append/mkdir — the ENTIRE command is NOT approvable. A co-present delete
+  // call POISONS the command; it falls through to pass-through / downstream guards.
+  // This closes the bypass where fs.writeFileSync(...); fs.rmSync(variable) was
+  // approved because the write regex fired first and the variable-form delete target
+  // could not be extracted by extractDeleteTargets (so the tracked-delete floor
+  // AC-4.2 also missed it).
+  if (/fs\.(rmSync|unlinkSync|rmdirSync)\b/.test(cmd)) {
+    return null; // delete call present — poisoned, not auto-approvable
+  }
   if (/fs\.(writeFileSync|appendFileSync|mkdirSync)\b/.test(cmd)) {
     return { scope: "node-e-fs", pattern: "Bash(node -e *fs.{write,append,mkdir}Sync*)" };
   }
diff --git a/scripts/hooks/team-guard.js b/scripts/hooks/team-guard.js
index ff49a7d..053ce8f 100644
--- a/scripts/hooks/team-guard.js
+++ b/scripts/hooks/team-guard.js
@@ -182,6 +182,49 @@ function teamCarriesConductor(conductor) {
   return false;
 }
 
+// ── PROJECT-SCOPE helpers (findings 1+2, FIX1-G1) ─────────────────────────────
+// A team satisfies the gate ONLY if it binds to THIS project — by slug AND/OR a
+// member cwd that is the project root exactly or strictly under it. A foreign
+// team (different project slug, no member cwd under this project) must NOT be
+// able to bypass the readiness gate, even if it carries the right conductor and
+// has a fresh config. The scope predicate mirrors findActiveTeamForProject in
+// mode-lifecycle-guard.js (the existing project-scope authority). FAIL-CLOSED to
+// false when we CAN determine scope but it doesn't match; callers decide whether
+// to fail-open when no scope evidence is available (empty slug + no member cwd).
+function resolveProjectSlug(projectDir) {
+  try {
+    const manifestPath = path.join(projectDir, ".claude", "manifest.json");
+    const doc = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
+    return String((doc.project && doc.project.slug) || "").toLowerCase();
+  } catch {
+    return ""; // no manifest / unreadable — caller applies fail-open
+  }
+}
+
+/** Does `doc` (a team config) belong to the project identified by `slug` and
+ *  `projectDir`? Two arms (either is sufficient):
+ *    (a) name-slug: team name equals slug OR starts with "<slug>-" (exact normalize)
+ *    (b) member-cwd: any member's cwd is the project root EXACTLY, or strictly
+ *        UNDER it — NOT parent-containment (a broad/foreign team rooted ABOVE the
+ *        project is not ours). Returns false when neither arm matches. */
+function isProjectScopedTeam(doc, teamDirName, slug, projectDir) {
+  const name = String((doc && (doc.name || doc.team_name || teamDirName)) || "")
+    .trim()
+    .toLowerCase();
+  const s = String(slug || "").toLowerCase();
+  // (a) slug-based name arm
+  if (s && (name === s || name.startsWith(s + "-"))) return true;
+  // (b) member-cwd arm
+  const normProject = String(projectDir || "").replace(/\\/g, "/").toLowerCase();
+  if (!normProject) return false;
+  const members = Array.isArray(doc && doc.members) ? doc.members : [];
+  return members.some((mem) => {
+    const c = String((mem && mem.cwd) || "").replace(/\\/g, "/").toLowerCase();
+    // EXACT project cwd OR member-cwd strictly UNDER it (NOT parent-containment).
+    return c && (c === normProject || c.startsWith(normProject + "/"));
+  });
+}
+
 // ── S-1 / AC-1.1: VERIFY a passed team_name really exists + is fresh + carries
 //    the conductor, by a REAL config lookup — never trust the bare string. The
 //    `if (hasTeamName || ...) exit(0)` short-circuit was a worker-bypass: ANY
@@ -190,7 +233,12 @@ function teamCarriesConductor(conductor) {
 //    (reuses the same EXACT-match identity as the gate). FAIL-CLOSED to false
 //    (not verified) on any error — a verify failure must NOT open the gate. The
 //    config-mtime freshness window mirrors teamCarriesConductor (24h).
-function namedTeamVerified(teamName, conductor) {
+//    FINDING 1 FIX (FIX1-G1): also verify the team belongs to THIS project (slug
+//    or member cwd — isProjectScopedTeam). A foreign team with the right name and
+//    conductor (e.g. "doogle-sprint") must NOT bypass the gate for this project.
+//    When the project slug is unknown (no manifest), scope can't be determined →
+//    fail-open on scope only (the team still must verify name + freshness + ε).
+function namedTeamVerified(teamName, conductor, slug, projectDir) {
   if (!conductor) return false;
   const want = String(teamName == null ? "" : teamName).trim().toLowerCase();
   if (!want) return false;
@@ -209,8 +257,15 @@ function namedTeamVerified(teamName, conductor) {
         const doc = JSON.parse(fs.readFileSync(cfg, "utf8"));
         const nm = String((doc.name || doc.team_name || d) || "").trim().toLowerCase();
         if (nm !== want) continue; // a DIFFERENT real team is not THIS team_name
-        // The named team exists + is fresh: honor it only if it carries ε.
-        return docCarriesConductor(doc, conductor);
+        // The named team exists + is fresh: honor it only if it carries ε...
+        if (!docCarriesConductor(doc, conductor)) return false;
+        // ...AND belongs to THIS project (finding 1 fix: slug+cwd scope). When the
+        // project slug is unknown (no manifest, slug=""), scope is indeterminate —
+        // fail-open (the name+freshness+conductor check is still the guard). When the
+        // slug IS known, a foreign team (different slug, no matching member cwd)
+        // must NOT satisfy the named-team verification.
+        if (slug && !isProjectScopedTeam(doc, d, slug, projectDir)) return false;
+        return true;
       } catch {
         /* skip this unreadable team dir */
       }
@@ -465,12 +520,16 @@ process.stdin.on("end", () => {
         id: "epsilon",
         symbol: "ε",
       };
+      // PROJECT-SCOPE slug (finding 1+2 fix): resolved here so namedTeamVerified
+      // and the readiness selection can both scope teams to THIS project.
+      const projectSlug = resolveProjectSlug(projectDir);
       // AC-1.1: a passed team_name no longer short-circuits the readiness gate on
       // its bare presence. A fabricated/foreign team_name (no fresh config.json
       // carrying ε) is NOT honored — only a team_name that VERIFIES (the named
-      // team exists + is fresh + carries the conductor) counts as an into-team
-      // dispatch. A non-worker (face / research one-off) still exits early.
-      const teamNameVerified = hasTeamName && namedTeamVerified(toolInput.team_name, conductor);
+      // team exists + is fresh + carries the conductor + belongs to THIS project)
+      // counts as an into-team dispatch. A non-worker (face / research one-off)
+      // still exits early.
+      const teamNameVerified = hasTeamName && namedTeamVerified(toolInput.team_name, conductor, projectSlug, projectDir);
       if (teamNameVerified || !isWorker) {
         // VERIFIED into-team dispatch, a face (bootstrap), or a research one-off.
         process.exit(0);
@@ -499,6 +558,12 @@ process.stdin.on("end", () => {
       // — a team of only generic workers with NO ε is the 2nd miss the operator
       // caught 2026-06-08 ("this isn't the persistent team I imagined — where's
       // epsilon?"). Read the freshest active team config + check members for ε.
+      // FINDING 2 FIX (FIX1-G1): select the freshest PROJECT-SCOPED team first,
+      // then check for ε. A globally-fresher foreign ε-team (belonging to another
+      // project) must NOT satisfy readiness for THIS project. When the project slug
+      // is unknown (no manifest, projectSlug=""), scope can't be determined → fail-
+      // open (old global-freshest behavior) to avoid false-blocking real teams in
+      // environments without manifests. In production the manifest always exists.
       let activeCfg = null;
       let activeMtime = 0;
       try {
@@ -512,7 +577,15 @@ process.stdin.on("end", () => {
             const cfg = path.join(teamsRoot, d, "config.json");
             try {
               const m = fs.statSync(cfg).mtimeMs;
-              if ((Date.now() - m) / 3600000 < 24 && m > activeMtime) {
+              if ((Date.now() - m) / 3600000 >= 24) continue; // stale
+              // PROJECT-SCOPE filter: when slug is known, only consider teams
+              // that belong to THIS project (slug+cwd). Read the doc to check.
+              // When slug is unknown, skip filter (fail-open — old behavior).
+              if (projectSlug) {
+                const doc = JSON.parse(fs.readFileSync(cfg, "utf8"));
+                if (!isProjectScopedTeam(doc, d, projectSlug, projectDir)) continue;
+              }
+              if (m > activeMtime) {
                 activeCfg = cfg;
                 activeMtime = m;
               }
diff --git a/tests/regression/SP-20260611-002/auth-floor-rm-with-write.test.js b/tests/regression/SP-20260611-002/auth-floor-rm-with-write.test.js
new file mode 100644
index 0000000..4c75ed2
--- /dev/null
+++ b/tests/regression/SP-20260611-002/auth-floor-rm-with-write.test.js
@@ -0,0 +1,171 @@
+#!/usr/bin/env node
+// ─────────────────────────────────────────────────────────────────────────────
+// auth-floor-rm-with-write.test.js — SP-20260611-002 FIX1-G2, gauntlet finding 3.
+//
+//   AC-4.1 ALL-OR-NOTHING: a node -e command that mixes a write call WITH ANY
+//   rmSync/unlinkSync/rmdirSync is NOT approvable — the delete POISONS the
+//   entire command, regardless of co-present write/append/mkdir calls.
+//
+//   Exploit (exact attack from gauntlet finding 3):
+//     node -e "fs.writeFileSync('output.js','x'); fs.rmSync(targetVar)"
+//   - matchNodeEFs MUST return null (not approvable) — the write regex fires
+//     first under the unfixed code and returns the node-e-fs scope, bypassing
+//     AC-4.1.
+//   - The variable form fs.rmSync(targetVar) means extractDeleteTargets extracts
+//     NO literal path → the tracked-delete floor (AC-4.2) also misses it.
+//   - Combined: the attack gets approved end-to-end with the unfixed gate.
+//
+//   Mutation-verify contract (binding per fix brief):
+//     Revert the "delete poisons" guard in matchNodeEFs → this test REDs.
+//     Restore the fix → this test GREENs.
+//
+//   No-over-block guarantee: a write/append/mkdir-only node -e (no delete) is
+//   still matched by matchNodeEFs and approved through the gate.
+// ─────────────────────────────────────────────────────────────────────────────
+"use strict";
+
+const assert = require("assert");
+const fs = require("fs");
+const os = require("os");
+const path = require("path");
+const { spawnSync } = require("child_process");
+
+const ROOT = path.resolve(__dirname, "..", "..", "..");
+const gate = require(path.join(ROOT, "scripts", "hooks", "authorization-gate.js"));
+
+let pass = 0;
+let fail = 0;
+function ok(name, fn) {
+  try {
+    fn();
+    pass++;
+    console.log(`  ok  ${name}`);
+  } catch (e) {
+    fail++;
+    console.log(`FAIL  ${name}\n      ${e.stack || e.message}`);
+  }
+}
+
+const bash = (command) => ({ command });
+
+// ── Exact exploit: writeFileSync co-present with rmSync(variable) ─────────────
+// Variable form is critical: extractDeleteTargets extracts no literal path from
+// fs.rmSync(targetVar), so the tracked-delete floor (AC-4.2) does NOT intercept
+// it. The PRIMARY fix must live in matchNodeEFs.
+const EXPLOIT_CMD = `node -e "fs.writeFileSync('output.js','x'); fs.rmSync(targetVar)"`;
+
+ok("Finding 3 (primary): matchNodeEFs returns null for write+rmSync(variable) — all-or-nothing", () => {
+  const m = gate.matchNodeEFs("Bash", bash(EXPLOIT_CMD));
+  assert.strictEqual(
+    m,
+    null,
+    "a mixed write+delete command must NOT be approved; matchNodeEFs must return null",
+  );
+});
+
+ok("Finding 3 (floor-gap confirm): extractDeleteTargets extracts nothing from rmSync(variable)", () => {
+  // Confirms WHY the floor cannot be the primary remedy: the variable path
+  // is not a string literal, so no target is extracted.
+  const targets = gate.extractDeleteTargets(EXPLOIT_CMD);
+  assert.strictEqual(
+    targets.length,
+    0,
+    "variable-form rmSync yields no extractable literal path — floor bypass confirmed",
+  );
+});
+
+ok("Finding 3 (floor-gap confirm): isInSafetyFloor does NOT block write+rmSync(variable)", () => {
+  // The floor misses it because extractDeleteTargets returns [] for the variable form.
+  // This documents that the fix MUST be in matchNodeEFs, not only in the floor.
+  const inFloor = gate.isInSafetyFloor("Bash", bash(EXPLOIT_CMD));
+  assert.strictEqual(
+    inFloor,
+    false,
+    "floor cannot catch the variable-form delete — PRIMARY fix must be matchNodeEFs",
+  );
+});
+
+ok("Finding 3 (E2E): with node-e-fs granted, write+rmSync(variable) yields NO approve from hook subprocess", () => {
+  // Plant a live-shaped auth fixture granting node-e-fs in a throwaway project.
+  // NEVER touches the live auth.json — same discipline as auth-floor-tracked-delete.
+  const proj = fs.mkdtempSync(path.join(os.tmpdir(), "sp002-exploit-g3-"));
+  fs.mkdirSync(path.join(proj, ".claude", "runtime"), { recursive: true });
+  fs.writeFileSync(
+    path.join(proj, ".claude", "runtime", "authorization.json"),
+    JSON.stringify({
+      schema: "warpos/auth/v1",
+      scopes: ["node-e-fs"],
+      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
+      granted_at: new Date().toISOString(),
+      session_started_at: new Date().toISOString(),
+    }),
+  );
+  const HOOK = path.join(ROOT, "scripts", "hooks", "authorization-gate.js");
+  const env = { ...process.env, CLAUDE_PROJECT_DIR: proj };
+
+  const result = spawnSync(process.execPath, [HOOK], {
+    input: JSON.stringify({
+      tool_name: "Bash",
+      tool_input: { command: EXPLOIT_CMD },
+    }),
+    env,
+    encoding: "utf8",
+  });
+  assert.ok(
+    !/"decision"\s*:\s*"approve"/.test(result.stdout || ""),
+    `write+rmSync(variable) must NOT be approved end-to-end; got stdout: ${result.stdout}`,
+  );
+});
+
+// ── Poison extends to unlinkSync and rmdirSync variants ───────────────────────
+ok("Poison variant: write+unlinkSync(variable) is also NOT approvable", () => {
+  const cmd = `node -e "fs.writeFileSync('a.js','b'); fs.unlinkSync(pathVar)"`;
+  assert.strictEqual(
+    gate.matchNodeEFs("Bash", bash(cmd)),
+    null,
+    "unlinkSync co-present with write also poisons the command",
+  );
+});
+
+ok("Poison variant: write+rmdirSync(variable) is also NOT approvable", () => {
+  const cmd = `node -e "fs.writeFileSync('a.js','b'); fs.rmdirSync(dirVar)"`;
+  assert.strictEqual(
+    gate.matchNodeEFs("Bash", bash(cmd)),
+    null,
+    "rmdirSync co-present with write also poisons the command",
+  );
+});
+
+ok("Poison variant: append+rmSync(variable) is also NOT approvable", () => {
+  const cmd = `node -e "fs.appendFileSync('log.txt','line'); fs.rmSync(v)"`;
+  assert.strictEqual(
+    gate.matchNodeEFs("Bash", bash(cmd)),
+    null,
+    "rmSync with appendFileSync is also poisoned",
+  );
+});
+
+// ── No-over-block: pure write/append/mkdir are still approved ─────────────────
+ok("No-over-block: writeFileSync-only node -e is still approvable", () => {
+  const m = gate.matchNodeEFs("Bash", bash(`node -e "fs.writeFileSync('out.js','x')"`));
+  assert.ok(m && m.scope === "node-e-fs", "pure write must still be approved");
+});
+
+ok("No-over-block: appendFileSync-only node -e is still approvable", () => {
+  const m = gate.matchNodeEFs("Bash", bash(`node -e "fs.appendFileSync('log.txt','\\n')"`));
+  assert.ok(m && m.scope === "node-e-fs", "pure append must still be approved");
+});
+
+ok("No-over-block: mkdirSync-only node -e is still approvable", () => {
+  const m = gate.matchNodeEFs("Bash", bash(`node -e "fs.mkdirSync('build/',{recursive:true})"`));
+  assert.ok(m && m.scope === "node-e-fs", "pure mkdir must still be approved");
+});
+
+ok("No-over-block: write+append+mkdir (no delete) node -e is still approvable", () => {
+  const cmd = `node -e "fs.mkdirSync('out/'); fs.writeFileSync('out/a.js','x'); fs.appendFileSync('log','done')"`;
+  const m = gate.matchNodeEFs("Bash", bash(cmd));
+  assert.ok(m && m.scope === "node-e-fs", "write+append+mkdir with NO delete must still be approved");
+});
+
+console.log(`\nSP-20260611-002 auth-floor-rm-with-write: ${pass} passed, ${fail} failed`);
+process.exit(fail ? 1 : 0);
diff --git a/tests/regression/SP-20260611-002/mode-write-coverage.test.js b/tests/regression/SP-20260611-002/mode-write-coverage.test.js
index 5691ed9..de73477 100644
--- a/tests/regression/SP-20260611-002/mode-write-coverage.test.js
+++ b/tests/regression/SP-20260611-002/mode-write-coverage.test.js
@@ -33,6 +33,7 @@ const ROOT = path.resolve(__dirname, "..", "..", "..");
 const MODE_SET = path.join(ROOT, "scripts", "mode-set.js");
 const DETECTOR = path.join(ROOT, "scripts", "checks", "mode-write-coverage.js");
 const guard = require(path.join(ROOT, "scripts", "hooks", "mode-lifecycle-guard.js"));
+const detector = require(DETECTOR);
 
 let pass = 0;
 let fail = 0;
@@ -158,6 +159,30 @@ ok("out-of-band-write-report-only-prints-finding-but-exits-0", () => {
   assert.strictEqual(out.report_only, true);
 });
 
+ok("finding-4-pre-mtime-lifecycle-event-does-not-corroborate-later-mode-json-rewrite", () => {
+  // The gauntlet bypass: a legitimate mode switch at T0 emitted a lifecycle event;
+  // an out-of-band rewrite at T0+5m gave mode.json a newer mtime. The old ±window
+  // logic accepted the pre-mtime event. The fix requires event.ts >= mode mtime.
+  const t0 = Date.parse("2026-06-11T00:00:00.000Z");
+  const modeMtime = t0 + 5 * 60 * 1000;
+  const result = detector.evaluate({
+    modeState: { mode: "sprint", mtimeMs: modeMtime },
+    modeUnreadable: false,
+    lifecycleEvents: [
+      {
+        event: "mode:switch:after",
+        payload: { target_mode: "sprint" },
+        tsMs: t0,
+      },
+    ],
+    windowMs: 120 * 60 * 1000,
+    nowMs: t0 + 10 * 60 * 1000,
+  });
+  assert.strictEqual(result.ok, false, "pre-mtime event must not green a later out-of-band rewrite");
+  assert.strictEqual(result.finding.type, "out-of-band-mode-write");
+  assert.strictEqual(result.corroboratingEvent, null);
+});
+
 ok("events-log-unreadable-with-present-mode-fails-closed", () => {
   // FAIL-CLOSED: a present mode.json + a missing events log cannot be corroborated.
   const proj = sealedProject();
diff --git a/tests/regression/SP-20260611-002/team-guard-verify.test.js b/tests/regression/SP-20260611-002/team-guard-verify.test.js
index 3e81551..d55101c 100644
--- a/tests/regression/SP-20260611-002/team-guard-verify.test.js
+++ b/tests/regression/SP-20260611-002/team-guard-verify.test.js
@@ -57,12 +57,21 @@ function ok(name, fn) {
 //   plantHeartbeat  — write a bare `.team-live-<sid>` marker (the AC-1.2 spoof)
 //   killEnv         — set WARPOS_DISABLE_TEAM_GATE=1
 //   killMarker      — touch .team-gate-off
+//   manifestSlug    — write .claude/manifest.json with project.slug (project-scope fixtures)
+//   memberCwd       — include a member cwd in the backing team config
 // Returns { stdout, stderr, status }.
 function runGuard(opts = {}) {
   const proj = fs.mkdtempSync(path.join(os.tmpdir(), "tgv-proj-"));
   const home = fs.mkdtempSync(path.join(os.tmpdir(), "tgv-home-"));
   fs.mkdirSync(path.join(proj, ".claude", "runtime"), { recursive: true });
   fs.mkdirSync(path.join(home, ".claude", "runtime"), { recursive: true });
+  if (opts.manifestSlug) {
+    fs.mkdirSync(path.join(proj, ".claude"), { recursive: true });
+    fs.writeFileSync(
+      path.join(proj, ".claude", "manifest.json"),
+      JSON.stringify({ project: { slug: opts.manifestSlug } }),
+    );
+  }
   const sid = "s-tgv";
   fs.writeFileSync(
     path.join(proj, ".claude", "runtime", "mode.json"),
@@ -79,7 +88,10 @@ function runGuard(opts = {}) {
     fs.mkdirSync(cfgDir, { recursive: true });
     const members =
       opts.backingTeam === "epsilon"
-        ? [{ name: "epsilon", agentType: "epsilon" }, { name: "beta", agentType: "beta" }]
+        ? [
+            { name: "epsilon", agentType: "epsilon", ...(opts.memberCwd ? { cwd: opts.memberCwd === true ? proj : opts.memberCwd } : {}) },
+            { name: "beta", agentType: "beta" },
+          ]
         : [{ name: "reviewer", agentType: "general-purpose" }, { name: "builder", agentType: "general-purpose" }];
     const cfgPath = path.join(cfgDir, "config.json");
     fs.writeFileSync(cfgPath, JSON.stringify({ name: teamName, members }));
@@ -142,6 +154,43 @@ ok("foreign-team-name-does-not-borrow-a-different-stale-teams-readiness", () =>
   assert.ok(isGateBlock(stdout), "a foreign team_name fails closed when no team is actually ready/live");
 });
 
+ok("finding-1-real-foreign-team-name-doogle-sprint-does-not-bypass-project-scope", () => {
+  // The gauntlet bypass: a worker passes a REAL team_name from a sibling project
+  // (doogle-sprint) that is fresh and carries epsilon. With a known WarpOS slug,
+  // named-team verification must reject it because it has neither the warpos slug
+  // nor a member cwd under this project.
+  const { stdout } = runGuard({
+    manifestSlug: "warpos",
+    teamName: "doogle-sprint",
+    backingTeam: "epsilon",
+    backingTeamName: "doogle-sprint",
+  });
+  assert.ok(isGateBlock(stdout), "a fresh foreign doogle-sprint team must not verify for the WarpOS project");
+});
+
+ok("finding-2-globally-freshest-foreign-epsilon-team-is-filtered-before-readiness", () => {
+  // The gauntlet bypass: readiness used the globally freshest team under
+  // ~/.claude/teams. A fresh foreign epsilon team therefore opened the gate even
+  // when THIS project had no correct team. With project scope, it is filtered out.
+  const { stdout } = runGuard({
+    manifestSlug: "warpos",
+    backingTeam: "epsilon",
+    backingTeamName: "doogle-sprint",
+  });
+  assert.ok(isGateBlock(stdout), "a globally freshest foreign epsilon team must not satisfy this project's readiness");
+});
+
+ok("project-scoped-team-by-member-cwd-still-passes", () => {
+  const { stdout } = runGuard({
+    manifestSlug: "warpos",
+    teamName: "custom-sprint",
+    backingTeam: "epsilon",
+    backingTeamName: "custom-sprint",
+    memberCwd: true,
+  });
+  assert.ok(!blocks(stdout), "a non-slug team with an epsilon member cwd under the project still verifies");
+});
+
 // ── AC-1.2 — a planted `.team-live-<sid>` marker must NOT flip teamLive alone ──
 ok("planted-team-live-marker-not-trusted-on-presence-alone", () => {
   // The marker is planted but there is NO backing config-verified team identity.

```
