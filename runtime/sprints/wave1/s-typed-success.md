# Sprint spec — #3 Typed Success Semantics (BC-16) + dispatch-telemetry fix

- **Worktree:** `C:/Users/Vlad/Desktop/Claude/Projects/warpos-wt-typed-success` (branch `warp/s-typed-success`, from main AFTER #2 merge — has the repo-role resolver)
- **Risk:** HIGH (touches gauntlet success semantics + the dispatch telemetry layer) → full 4-reviewer gauntlet + telemetry verify, no skip.
- **Role served:** BOTH. Depends on #2 (repo-role resolver). Unblocks #1 (keystone).
- **Close:** engine sprint → ff-merge to main, defer retro, HALT before push.

## Objective
Make "green" mean **the action occurred AND a telemetry record exists** — kill fail-open
false-green at the contract level (regression class BC-16). AND fix the dispatch telemetry
relative-path bug that this very Wave-1 run surfaced (regression class #20).

## Why (grounding)
ROADMAP §"Root-cause deepening" → `[open] Typed success semantics`. Reinforced live: during
Wave-1, `gauntlet-verify` reported `no-record` for REAL gauntlet runs because
`dispatch-agent.js#recordCompletion` writes to a RELATIVE path (`PATHS.runtime || ".claude/runtime"`),
so under a worktree cwd the records landed in the *worktree's* `.claude/runtime/` not canonical's
(false alarm). See `runtime/sprints/wave1/_dispatch-telemetry-gap.md`.

## Acceptance criteria
1. **Typed success predicate** — generalize `gauntlet-verify.js` (and the per-role provider smoke)
   so success requires BOTH: (a) the action/run occurred, AND (b) a well-formed telemetry record
   exists. Fail-closed on: no record, malformed record, runner-error (→ non-zero), stale record
   (→ self-flag). NO fail-open path may report green. (Harden against lying per
   project_enforcer_falsegreen_gauntlet.)
2. **dispatch-agent telemetry path fix (class #20)** — `dispatch-agent.js#recordCompletion` must
   resolve the completions path against the **canonical project root** (absolute), not a relative
   path that bends to the caller's cwd. A build-chain agent dispatched with `cwd=<worktree>` must
   still write its completion record where the canonical verifier reads it (or the verifier must be
   told where to read — pick the robust single-source approach; prefer absolute-resolve at write).
   Use the #2 repo-role resolver / project-root resolution rather than re-deriving paths by "vibes."
3. **Tests** (HIGH-risk, exhaustive): 
   - a run that completes but whose record write is suppressed → verifier FAILS (not silently green);
   - a real run with a valid record → PASSES (no false-negative);
   - a build-chain agent dispatched from a worktree cwd → its record lands at the canonical location
     and the canonical verifier finds it (regression test for the exact bug found this run);
   - malformed/stale record → fail-closed.
4. Named enforcer + entry so the policy isn't aspirational (CLAUDE.md Policy & Enforcement Hygiene).

## Out of scope
The executable consumer-contract gate (#1) — it CONSUMES typed success; built next wave.
