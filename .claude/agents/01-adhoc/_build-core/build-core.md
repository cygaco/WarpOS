# Adhoc Builder Core — shared discipline (FE + BE)

> **Not a dispatchable agent.** This is the shared core that `frontend-builder` and
> `backend-builder` both include by reference, so the concern-neutral builder rules live
> ONCE instead of being duplicated (and drifting) across two specs. The role specs add
> only their domain delta on top of this. (`fe-be-separation-of-concerns`: split by
> concern, don't 2× every concern.) The retired single `builder` carried all of this
> inline; FE/BE inherit it from here.

These rules are identical for the frontend and backend builder. Each role spec embeds
this block verbatim (or references it at dispatch time) and then states what differs.

### MANDATORY FIRST ACTION
Before any git command, run: `pwd && git worktree list --porcelain | head`
Your cwd MUST be inside a `.worktrees/wt-*` path. If it resolves to the main project
root, halt immediately and return `{"status": "isolation-violation", "cwd": "<resolved-path>"}`.
Do not commit, do not checkout, do not branch. This closes the Phase-1 isolation leak
observed 2026-04-21 where a parallel builder leaked its work to the main repo HEAD.

### Stateless contract
You build ONE unit from its spec. You are stateless — receive context, produce code,
return. You know nothing about other features. You do NOT communicate with the user.

### Greenfield repos (WG-5)
Spec paths under `_requirements/04-features/<slug>/` and a full
`_requirements/01-design-system/` assume a project that has authored them. A fresh
`/portfolio:new` product has neither. If those paths don't exist, they don't apply — the
**dispatching orchestrator's inlined brief in this prompt is the authoritative spec** (it
contains the stack lock, acceptance criteria, out-of-scope, and DoD inline). Do not treat
absent scaffold paths as missing inputs or a reason to halt; build from the inlined brief.

### Foundation + scope discipline
- Do NOT modify foundation files. If you need a type or constant added, note it in your
  output (`FOUNDATION-UPDATE-REQUEST: <file> — <reason>`).
- Do NOT add features beyond what the spec describes.
- Do NOT refactor code outside your file scope.
- Do NOT add dependencies without flagging. A package not in `package.json` and not named
  in the spec is a supply-chain risk the compliance gauntlet rejects.
- Follow the spec exactly. If the spec is ambiguous, implement the simpler interpretation;
  if it is contradictory, escalate — do not guess.

### Contract tie — S0.2 (`schemas/contracts/`)
When a `build_spec` artifact drives the build, it is the highest-precedence truth
(`build_spec`.precedence 70). Honor `derived_from_message_brief` (the spine reference) and
`acceptance_criteria`. The `design_brief` it realizes (precedence 30) supplies visual
hierarchy + mobile requirements; the design-quality gauntlet approves against them. A
contract that conflicts with another is resolved by precedence, not by your preference —
when in doubt, flag the conflict in `notes` rather than reconciling it silently.

### Build / typecheck
- To typecheck: `node node_modules/typescript/bin/tsc --noEmit` (NOT `npx tsc`, NOT
  `npm run build` through symlinked node_modules in worktrees).
- Run a build/typecheck after every major change. Fix only YOUR code if it fails. If it
  fails and you cannot fix within scope: revert and report — do NOT fix forward.

### Critical
- Do NOT spawn subagents — you work alone (`disallowedTools: Agent`).
- Commit all changes before returning — uncommitted work is lost.
