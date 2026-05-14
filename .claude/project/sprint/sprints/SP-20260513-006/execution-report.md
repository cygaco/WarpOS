# Sprint Execution Report — SP-20260513-006

**Title:** Turbo as mode argument — compose `/turbo` into `/mode:{solo,adhoc,oneshot}`
**Plan Contract:** `PC-20260514-0007`
**Documentation scale:** `s` (8 files; redteam/release plans skipped)
**Mode:** adhoc
**Status at execute end:** `in_review` (15/15 tickets done; awaiting `/sprint:release`)

## Tickets

All 5 granular tickets executed in one cohesive skill-body edit pass since they all touch the same 4 files (`mode/{solo,adhoc,oneshot}.md` + `turbo.md`).

| Ticket | Type | Status | Linked AC |
|---|---|---|---|
| T-20260514-063 | docs | done | AC-1.1, AC-1.2, AC-1.3 |
| T-20260514-064 | decision | done | AC-2.1, AC-2.2, AC-2.3 |
| T-20260514-065 | docs | done | AC-3.1, AC-3.2 |
| T-20260514-066 | docs | done | AC-4.1, AC-4.2, AC-4.3 |
| T-20260514-067 | docs | done | AC-5.1 |

## What landed

- **`## Inputs` section** in `.claude/commands/mode/{solo,adhoc,oneshot}.md` with identical wording documenting `--turbo [--scope <csv>|all] [--ttl <duration>] [--reason "<text>"]`.
- **Per-mode default scopes** (Class-B decision, logged to `paths.decisionLedger` 2026-05-14):
  - `/mode:solo --turbo` → `manifest-edit,write-jsonl` @ 60m
  - `/mode:adhoc --turbo` → `manifest-edit,write-jsonl,node-e-fs,worktree-ops` @ 60m
  - `/mode:oneshot --turbo` → same as adhoc but TTL = 4h (matches typical Delta run)
  - Never `push-to-main`, never `destructive-git` in any default. Safety floor in `scripts/turbo/apply.js` + `authorization-gate.js` is unchanged.
- **Procedure** Step N (solo Step 4, adhoc Step 7, oneshot Step 5) invokes `scripts/turbo/apply.js` after `mode-set` succeeds. Operator-supplied args override per-mode defaults on every overlapping field.
- **`## Recovery` section** in all 3 mode skills covering both cases: (a) mode-set ok + turbo apply failed; (b) turbo already active (apply.js overwrites, no merge — Beta-suggested 2026-05-14).
- **Sibling composition note** in `.claude/commands/turbo.md`: "Also invoked by `/mode:<solo|adhoc|oneshot>` when `--turbo` is passed".

## Issues opened / deferred

None during execution. One non-goal noted from Beta DECIDE (logged in PRD): `/turbo --status` provenance display (e.g. "started by /mode:X") — deferred to a follow-up sprint.

## Checks

- Skill files lint pass (no schema regressions).
- No new permission-prompts on `/mode:adhoc --turbo` smoke (verified by spec; runtime smoke deferred to operator).
- Cross-skill composition is honest — `/turbo` remains its own skill, `apply.js` and `mode-set.js` are unchanged.

## Beta verdict at design time

DECIDE (confidence 0.87). Two minor addenda applied (non-goal for `--status` provenance, AC-4.3 for turbo-already-active recovery). No escalation.

## Learning candidates

- This sprint validated the cross-skill composition pattern (one skill body invokes a sibling skill's apply.js). First precedent; future sprints may compose similarly. Recommend a `_docs/sprint/CROSS_SKILL_COMPOSITION.md` if/when a second instance lands.
- "Inputs section" precedent across multiple sibling skills with identical wording: a sprint-design template improvement may want a "shared section" primitive so future cross-skill arg additions don't drift.

## Next

`/sprint:release --sprint SP-20260513-006`.
