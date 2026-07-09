# Session / Mode Lifecycle — Discovery Report (disc-session, 2026-07-09)

## Lifecycle map

**Start.** `SessionStart` hook chain (`.claude/settings.json:3-16`) = `scripts/hooks/session-start.js` + `scripts/hooks/tracker-start-of-work.js`. `session-start.js` is source-aware (`startup`/`clear`/`resume`/`compact`): mints/reads `.claude/runtime/.session-id` (`session-start.js:35-42`); on `clear` saves a checkpoint first; on fresh `startup` clears `.compact-summary.md` + the `.session-handoff-done` guard; records the starting commit for the end-of-session diff. `UserPromptSubmit` runs `smart-context.js` (Haiku memory enrichment, fail-open) + `prompt-logger.js` every prompt.

**Work / checkpoint.** `/session:checkpoint` MANUALLY writes `.claude/runtime/.session-checkpoint.json` (last 30 prompt-log lines + last 10 tool calls) and touches `.last-checkpoint`. The skill references a "periodic checkpoint timer" but NO hook fires it on an interval — **checkpoint is manual-only in practice (a real gap)**.

**End.** Two independent paths: (1) the `/session:end` SKILL — a 10-phase orchestration: learn→mine→sleep→integrate → fail-CLOSED TRACKER validate → `/session:dump` → `/commit:land` → fresh branch → team teardown → report. `--fast` collapses to the recoverability core. (2) the HOOKS: `Stop` chain (`settings.json:356-373`) = `retro-presence-check` + `tracker-completion-gate` + `session-stop.js`; `SessionEnd` (`375-388`) = `session-stop.js` + `session-end-team-teardown.js`; `StopFailure` = `session-stop.js`.

**Handoff artifacts (layered + all gitignored — do NOT travel cross-machine).**
- `DUMP.md` (root) — prescriptive next-session handoff from `/session:dump`; gitignored (`.gitignore:44`); read once by `/session:resume`. Mandatory anti-deixis discipline.
- Layer-2 rich narrative — `session-stop.js` writes `paths.handoffLatest` (`.claude/runtime/handoff.md`) ONLY on `SessionEnd`/manual; returns early on plain `Stop`/`StopFailure` (`session-stop.js:50-58`). Gitignored.
- Layer-1 live snapshot — `scripts/hooks/handoff-live.js` writes per-sid `handoff-live-<sid>.md` (git ground-truth, atomic temp+rename, fail-open). **DRIFT FINDING: its own header (`handoff-live.js:5`) says "Wired to BOTH Stop and SessionEnd" but it is in NEITHER chain in current `settings.json` — the Layer-1 crash-safety net is currently INERT.**
- Cross-session inbox — `/session:read` + `/session:write`.

## Mode enforcement

**Modes:** solo / adhoc / oneshot / sprint. `scripts/mode-set.js` is the SINGLE canonical writer of `.claude/runtime/mode.json` (schema `warpos/mode-marker/v2`). Mechanically enforces: transition validity (`ALLOWED_TRANSITIONS`, `mode-set.js:154-159`); lock semantics (blocks switch when `lockOwner` != caller); build safety (blocks switch-OUT while `activeBuild` set) — override only via `--force` (logged). Exit 2 on blocked transition.

**"Mode-init ≠ authorization" = MECH-CLAUDE advisory + PROSE, NOT a hard gate.** On fresh entry `mode-set.js` prints a STOP posture banner (`printPostureBanner`, `mode-set.js:224-242`); file itself explicit (`:44-46`): "banner is advisory... residual 'no hard gate on the first state-changing action' is logged as enforcement debt." `/session:resume` (`resume.md:19-23`) reconciles the doctrine: operator typing `/session:resume` IS the in-session authorization.

`scripts/hooks/mode-lifecycle-guard.js` = REPORT-ONLY backstop PreToolUse hook (matcher `SlashCommand|Skill`, `/mode:*` only). Hard invariants (`:22-32`): REPORT-ONLY, FAIL-OPEN, KILL-SWITCH, SCOPED. Only observes + emits events. A `node scripts/mode-set.js` via Bash runs OUTSIDE the matcher, so the WRITER itself emits the events (AC-2.1, `mode-set.js:55-69`).

## Turbo & authorization

`/session:turbo` = (1) permission pre-auth via `scripts/turbo/apply.js`; (2) a "speed cadence" that is pure PROSE.

`apply.js` mutates: (a) additive merge of curated `permissions.allow` patterns into `.claude/settings.json` per scope (`SCOPE_PERMISSIONS`, `apply.js:107-138`); (b) writes `.claude/runtime/authorization.json` (schema `warpos/auth/v1`, TTL-bounded, session-anchored spend window). Snapshots settings to `settings-pre-turbo.json`; `--off` restores. Widening re-applies REFUSED without fresh `--attest` (`diffWidening`, `apply.js:202-241`). Spend ceiling default $100.

`scripts/hooks/authorization-gate.js` — paired PreToolUse hook, registered FIRST so `decision:"approve"` SHORT-CIRCUITS downstream guards. Approves ONLY if scope granted AND not in the safety floor (`isInSafetyFloor`, `:280-308`: force-push to main, backup/pre-* deletes, tracked-uncommitted deletes via `isGitTracked`; node-e-fs deletes all-or-nothing poisoned). Fail-open. The harness auto-mode classifier sits ABOVE `permissions.allow` — even active `push-to-main` scope doesn't make a push classifier-immune (proven 2026-06-09).

**Helm relevance: this whole layer is MECH-CLAUDE.** Portable = scope-vocab + TTL + safety-floor POLICY (the `authorization.json` data). Non-portable = the two enforcement seams (settings.json merge + PreToolUse approve). A neutral helm needs its own pre-action gate reading `authorization.json`.

## Crash-safety

**Recoverable from files alone TODAY:** git commits/branch; `TRACKER.md`; `mode.json`; `authorization.json`; `DUMP.md` (IF dump ran); `.session-checkpoint.json` (IF manually saved); Layer-2 `handoff.md` (IF SessionEnd fired cleanly).

**Lost / fragile:**
- Conversation context between manual checkpoints — NO periodic auto-checkpoint hook wired; crash loses everything since last manual save.
- Layer-1 net (`handoff-live.js`) NOT wired into Stop or SessionEnd — the "≤1 turn behind any disaster" coverage is NOT active. Single highest-value crash-safety fix.
- Hard kill does NOT fire `SessionEnd` — rich Layer-2 handoff honestly absent after a crash.
- cwd hazard: sessions can launch rooted in a pruned-but-locked worktree; hooks defend via `CLAUDE_PROJECT_DIR` preference (`session-start.js:21`, `session-stop.js:33`). ED-016 (dispatch-completion relative-path cwd bug) still open.

## Intent gap

**No `/session:intent` exists.** Confirmed. Closest analogues: `authorization.json` TTL (TIME-bounded, not ACTION-bounded); the `/session:resume`-is-authorization doctrine (PROSE, no artifact, no consumed-flag); the mode-set posture banner (advisory inverse). All three answer the SAME question — "what authorizes the first state-changing action" — in three different advisory places. v1's `/session:intent` should unify them.

## Rebuild needs

**Move into durable helm-neutral state:**
1. Session intent as an ARTIFACT — `_state/session/intent.{json,md}` with `{intent, granted_at, expires_after_first_action, consumed}` + a SCAN-ONLY enforcer flagging unconsumed-but-acted-upon intents.
2. Handoff / SprintRoom as ONE durable resumption record — collapse DUMP.md (prescriptive) + handoff.md (narrative) + handoff-live (git-truth) into layered `_state/session/current-handoff.md`. Keep the deterministic (MECH-NEUTRAL) vs LLM-narrative split.
3. Mode marker + transition rules — `mode.json` + `ALLOWED_TRANSITIONS` are already pure data = MECH-NEUTRAL; single-writer discipline generalizes.

**Stays harness-specific (needs neutral re-expression):**
4. Turbo authorization ENFORCEMENT — `permissions.allow` + `decision:"approve"` are Claude-only; neutral helm needs its own pre-action gate reading `authorization.json`.
5. All 4 lifecycle hook seams are Claude-hook-shaped; the work they do (session-id mint, git-truth snapshot, tracker gate, teardown) is neutral logic in harness plumbing.

**Concrete work items:**
- WIRE (or delete) `handoff-live.js` — header claims wiring that doesn't exist; highest-value crash-safety fix.
- ADD a periodic/auto checkpoint (PostToolUse or turn-count trigger).
- BUILD `/session:intent` (expire-after-first-action + enforcer); unify with mode-init banner + resume-is-authorization.
- GIVE "mode-init ≠ authorization" a real enforcer (first-post-entry-state-change gate reading intent-consumed).
- FIX ED-016 (dispatch-completion relative-path cwd bug) as part of crash-safety hardening.
