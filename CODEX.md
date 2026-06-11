# CODEX.md — Codex/GPT executor entrypoint (thin shim, one source of truth)

> **Created 2026-06-11; completed 2026-06-11** as the interim provider-entrypoint shim (the formal shipped version is roadmapped — TRACKER fold 72801243). This file DUPLICATES NOTHING: it points at the canonical docs and states only what is DIFFERENT when the executor is Codex/GPT instead of the Claude harness.

## Read order (one pass, then act)

1. **`DUMP.md`** (project root) — the prescriptive session handoff. Carries the next action, in-flight state, verbatim payloads, ranked next-actions, and anti-instructions. Read once, execute. (Gitignored/local — it is the binding one-read handoff.)
2. **`TRACKER.md`** (project root) — the enforced source of truth. It **OUTRANKS** `DUMP.md`, this file, and your own assumptions. Run its "Start-of-Work Procedure" before any meaningful work; on any disagreement, the tracker wins. Validate it with `node scripts/trackers/validate.js` (must exit 0, all 20 checks) before AND after meaningful work.
3. **`CLAUDE.md`** (project root) — the operating doctrine (autonomy table, dispatch rules, policy/enforcement hygiene, refactor/rename hygiene). It is written for the Claude harness, but its **RULES apply to any executor**. The harness-specific mechanics (hooks, the Agent tool, skills-as-slash-commands) do NOT exist for you — see "What is DIFFERENT under Codex" below.

## What is DIFFERENT under Codex (the whole reason this file exists)

**1. NO HOOKS FIRE.** Every WarpOS guard is a Claude-harness hook (`scripts/hooks/*`, wired in `.claude/settings.json`). Under Codex they are INERT. The protections they automate become YOUR manual responsibility:
- **secret-guard** (blocks committing API keys) — do not write `sk-`/`pk-`/`*_API_KEY=` literals into tracked files; secrets live in env / `.env.local` only.
- **merge-guard / no-nul-bytes / path-guard** — do not `node -e` fs-writes; use real file writes. Avoid literal-space-before-`]` in regex char classes (use `\s`). Reference paths via the registry, not stale literals.
- **dispatch-route-guard** — it will NOT stop you from a reap-prone raw dispatch; you must self-enforce the dispatch shape below.
- **scope-contract-guard** — builder dispatches must still carry an explicit file scope (allowedFiles/forbiddenFiles) in the brief, even though nothing enforces it.
- **tracker-completion-gate** — nothing blocks a Stop on a red tracker; run `validate.js` yourself before claiming done.
- **smart-context / additionalContext** — no auto memory injection; read `TRACKER.md` + `DUMP.md` + the relevant `runtime/notes/*` explicitly.

**2. NO HARNESS AGENT TOOL → NO IN-PROCESS TEAMMATES.** You cannot spawn α/β/ε/directors/leads as in-process agents (that path is Claude-harness-only, ED-041). You dispatch via the **CLI routes only**:
- Build-chain Claude roles (builder/fixer/security-builder/backend-builder): `node scripts/dispatch-claude.js <role> <prompt-file> -w`
- Cross-provider reviewers (qa-reviewer/backend-reviewer/security-reviewer): `node scripts/dispatch-agent.js <role> <prompt-file>` (pin the family with `--provider openai` / `--provider gemini` when a re-review must match the prior FAIL family).
- You ARE a GPT/Codex executor, so a "Claude builder" dispatched via `dispatch-claude.js` is a cross-family worker for you — fine; the wrapper handles auth.

**3. THE REAP (read this before dispatching ANY builder).** On this machine, a headless `claude -p` builder launched from a BACKGROUND shell is silently killed at the CLI buffer ~45s in, before any output or death record (RI-004, reproduced 2026-06-11: 4/4 builders lost). **Always dispatch builders FOREGROUND** (`-w`, no backgrounding, no `WARPOS_DISPATCH_BACKGROUND=1`). Foreground survives past the reap point. After each dispatch, **independently verify the worktree diff + commit + the worker's envelope** — never trust a self-report; a conductor that returns without verifying orphans the build.

**4. CROSS-PROVIDER REVIEW STAYS REAL.** The gauntlet's binding verdicts come from cross-provider reviewers. As a GPT executor you must still run them as independent lanes (not self-review your own dispatched work). A binding FAIL cannot be overridden.

## Operating rules that DON'T change (apply to every executor)

- **Autonomy ceilings** (`CLAUDE.md` § Autonomy): the operator granted push/merge-to-main freedom for this work (2026-06-11 — push periodically so work is never lost). Safety floor still absolute: no force-push to main, no deleting `backup/*`/`pre-*` branches, no signups/purchases, **never merge a gauntlet-RED sprint to main** (push the working branch as backup instead).
- **TRACKER.md is fail-closed** before handoff/land — reconcile it + its linked `trackers/epics/*` + `trackers/sprints/*` so `validate.js` is 20/20, then proceed.
- **Every policy needs a named enforcer** — if you write a rule with no enforcer, log it via `node scripts/enforcement/...` (see `/enforcement:log`) so it surfaces at scan.
- **Regen BOTH manifests** after editing any hash-tracked file (`scripts/**`, `.claude/commands/**`, `tests/regression/**`, `ROADMAP.md`, root docs): `node scripts/generate-framework-manifest.js` then `node scripts/warpos/manifest/build.js`, before the commit, or BC-02/BC-05 go red. New root docs need a `walk-skip.js` rule.
- **Maps may be stale** (flagged 2026-06-11) — run `node scripts/regen-maps.js` if you rely on them.

## The skills (slash commands) under Codex

`.claude/commands/*.md` are PROCEDURES, not executable slash commands for you. When `DUMP.md` says "run `/sprint:full`" or "`/session:resume`", OPEN the matching `.claude/commands/<ns>/<name>.md` and FOLLOW its steps manually (it documents the real CLI calls + the order). The sprint runtime itself is real CLI: `node scripts/sprint/epsilon-runtime.js plan|conduct|record-inprocess --sprint <id>` — but `record-inprocess` and the in-process roster need the Agent tool you don't have, so for Codex the build/gauntlet runs through the `dispatch-claude.js` / `dispatch-agent.js` CLI routes per #2 above.

## First action when you start

Read `DUMP.md` → it routes you to NEXT ACTION #1 (as of 2026-06-11: execute SP-20260611-002 fix-cycle attempt 1 from the 5 staged briefs at `.warpos/dispshape-prompts/SP-20260611-002-FIX1-*.md`, against the authoritative findings in `runtime/notes/sp002-gauntlet-fail-attempt1.md`). Validate the tracker is 20/20 first. Then proceed within the autonomy ceilings above.
