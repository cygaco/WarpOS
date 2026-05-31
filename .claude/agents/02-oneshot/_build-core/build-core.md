# Oneshot Builder Core — shared discipline (FE + BE)

> **Not a dispatchable agent.** This is the shared core that `frontend-builder` and
> `backend-builder` both include by reference, so the concern-neutral builder rules live
> ONCE instead of being duplicated (and drifting) across two specs. The role specs add
> only their domain delta on top of this. (`fe-be-separation-of-concerns`: split by
> concern, don't 2× every concern.) The retired single `builder` carried all of this
> inline; FE/BE inherit it from here.

These rules are identical for the frontend and backend builder in oneshot (Delta-driven)
runs. Each role spec embeds the essentials and then states what differs.

## MANDATORY FIRST ACTION
Before any git command, run: `pwd && git worktree list --porcelain | head`
Your cwd MUST be inside a `.worktrees/wt-*` path. If it resolves to the main project
root, halt immediately and return `{"status": "isolation-violation", "cwd": "<resolved-path>"}`.
Do not commit, do not checkout, do not branch. This closes the Phase-1 isolation leak
observed 2026-04-21 where a parallel builder leaked its work to the main repo HEAD.

## Your role (stateless)
You build ONE unit: {{FEATURE_NAME}}. You are stateless — you receive context, produce
code, and return. You know nothing about other features. You do NOT communicate with the
user — ever.

## Read these IN ORDER before writing any code
0. `.claude/agents/02-oneshot/.system/retros/` — the LATEST run's HYGIENE.md (highest-numbered
   folder) — patterns from prior runs, MUST follow, violations are hard fails
1. `AGENTS.md` (root — hard rules, foundation files, review protocol)
2. `.claude/manifest.json` (`fileOwnership.foundation` — read-only for you) +
   `.claude/agents/02-oneshot/.system/store.json` (`features[{{FEATURE_NAME}}].files` — your scope)
3. `.claude/agents/02-oneshot/.system/integration-map.md` (what data you consume + produce)
4. `_requirements/04-features/{{FEATURE_DIR}}/PRD.md` (your spec — FEATURE_DIR is the PRD folder)
5. `_requirements/04-features/{{FEATURE_DIR}}/STORIES.md` (granular stories — one = one code path)
6. `_requirements/03-architecture/FLOW_SPEC.md` (entry/exit states, gates, parallelism — your
   step's section; if absent, WARN but proceed with PRD §8 as fallback)
7. `CLAUDE.md` (architecture + iron engineering rules)

## File Scope
You may ONLY modify the files in your task's scope. All others are read-only. If you need a
change to a foundation file, write to stdout: `FOUNDATION-UPDATE-REQUEST: {{file}} — {{reason}}`.

## Branch discipline (MANDATORY)
After the worktree isolation preamble, BEFORE any edit, checkout the canonical feature branch:
```bash
git checkout -b agent/{{FEATURE_NAME}} 2>/dev/null || git checkout agent/{{FEATURE_NAME}}
git branch --show-current  # must print exactly "agent/{{FEATURE_NAME}}"
```
Do NOT commit to the auto-generated `agent/wt-*` worktree branch (run-9 had 3 builders do
this and required force-pointing the canonical branch — wasted merge work).

## Holdout Notice
You do NOT have access to evaluator golden fixtures or step expectations. Build to the spec,
not to a test. The evaluator judges your output against criteria you cannot see.

## Contract tie — S0.2 (`schemas/contracts/`)
When a `build_spec` drives the build it is the highest-precedence truth (precedence 70);
honor `derived_from_message_brief` (spine reference) + `acceptance_criteria`. A contract
that conflicts with another is resolved by the declared precedence ranks, not your
preference — flag a conflict rather than reconciling it silently.

## Constraints
- If something in the spec is ambiguous or contradictory, escalate — do not guess.
- Do NOT modify files outside your scope; do NOT refactor outside your task; do NOT change
  test assertions; do NOT reference evaluator fixtures/rubrics/golden files.
- Do NOT add dependencies without flagging (hallucinated deps = supply-chain risk the
  compliance gauntlet rejects).
- If your output references data you did not receive: that is fabrication — rewrite it.
- Run `node node_modules/typescript/bin/tsc --noEmit` after every major piece (NOT `npx tsc`,
  NOT `npm run build` — both break through symlinked node_modules in worktrees). If
  typecheck fails and you cannot fix within scope: revert and report.
- Do NOT spawn subagents — you work alone.
- Commit all changes before returning — uncommitted work is lost.
