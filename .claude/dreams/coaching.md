# Morning Briefing

Append-only. Each section is one sleep cycle's coaching for the *next* session start.

---

# Morning Briefing — 2026-05-13

## Top 3 things from last night

1. **Your ladder has hollow rungs.** Releases 0.3.x and parts of 0.4.x got a `version.json` bump and a tag but no capsule under `framework/releases/X.Y.Z/`. Downstream `/warp:update --to 0.4.0 --apply` reached for those rungs and fell. Two pieces of work need to land before the next `version.json` bump:
   - Add a release-pipeline gate that refuses to tag if the capsule is missing/invalid (L-1, L-2).
   - Add `/warp:update` pre-flight: if target capsule absent, print available versions and exit cleanly. No silent failures.

2. **β is sitting in an empty chair.** 17 `beta-gate-blocked` events in three days. β isn't being overridden — β isn't being asked. The gate fires *after* the omission; by then the decision has already settled. Move β consultation upstream: drafting an action's plan should include a `/beta:ask` step that's cheaper than triggering the gate.

3. **41% of your prompt log is a metronome.** `/fixture hook smoke test` fired 37 of 90 prompts. It's a fixture — not human work — but every analytics view of "what is Alex doing" includes it. Tag test traffic at write-time (`actor=test` or `tags:[fixture]`) so the real signal isn't drowned.

## One leverage move worth doing first

**Build `advisory-escalator`.** Tonight's cross-pollination showed L-9, L-10, L-11, L-12 are all instances of the same root pattern: advisory hooks that warn forever but never auto-correct or escalate. A single meta-hook that watches advisory fires and promotes any pattern hitting N identical events/week to block (or to auto-rewrite) subsumes four learnings in one move. Estimated ROI: removes 32+ friction events/week.

## Quick wins (under 30 min each)

- `release-canonical.js` capsule gate (L-2 enforcement) — refuse tag without capsule
- `/warp:update` pre-flight capsule check (L-1 enforcement) — exit cleanly on miss with `Available versions: …` message
- Path-registry prune: remove or seed `research`, `tracesFile`, `requirementsStagedFile`, `oneshotRetros`
- Log the two recurring-issues candidates (17× beta-gate, 8× merge-guard) into `paths.recurringIssuesFile` via `/issues:log`

## Things that worked — keep doing them

- The Sprint v0.2 chain (plan → design → execute → release → warp:release) shipped a real feature end-to-end and survived a mid-execute crash via `/mode:adhoc` recovery. That chain is now a validated path for non-trivial work — reach for it.
- Iterative patch-release cadence (0.4.0 → 0.4.1 → 0.4.2 → 0.4.3 → 0.4.4) cleaned up doctor red within two patch releases. Cadence is healthy.

## Things to watch out for

- **Compaction loses verbatim prompts.** If the user asks "what was the last thing I sent?" the answer must come from a verbatim store, not a summary. Worth verifying `session:checkpoint` and `session:handoff` preserve last N raw prompts.
- **`node -e` with `fs` writes will be blocked** by merge-guard. Use Edit/Write tools, not inline scripts. (Per L-9.)
- **`cd <projectDir> && git …` prefix is redundant** in this harness — cwd is already correct. Strip the prefix before issuing git commands.
