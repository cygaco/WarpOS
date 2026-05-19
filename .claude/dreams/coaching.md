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


---

## Morning Briefing — 2026-05-20

You ended the last session with two sprints **implementation-complete but pre-release**, on a single branch `sprint/SP-20260518-007`. 11 commits, local-only. The push gate is the only thing standing between this work and main.

### What's waiting

1. **Two release records at `preparing` status.** RL-20260518-011 (Sprint A) and RL-20260519-012 (Sprint B). Auto-checks pass; human-curated items still unticked:
   - release_notes_written
   - docs_updated
   - migration_plan (`none_required` is a valid value)
   - rollback_plan (`none_required` is a valid value for additive sprints)
   - approval_recorded (mint an AP-id, edit it to `approved` state)
   - post_release_monitoring_plan (point at `paths.eventsFile` filters for the new event types)
2. **Branch is local-only.** `/commit:both` was queued for after `/sleep:deep`. The user's chain expects: `/commit:both` then "prepare the latest release" (likely `/warp:release` — full canonical WarpOS pipeline).
3. **Retros emitted as skeletons.** Both retro.yaml files exist at `paths.sprintHistory/SP-2026051{8,9}-00{7,8}/retro.yaml`. Operator can `--retry-synth` later for LLM-synthesized retros.

### What to do first

**Run `/commit:both`** — it queued behind sleep. Then the user wants "prepare the latest release", which most likely means `/warp:release` (drives canonical WarpOS release from this product repo: promote, bump, regen capsule, run gates, commit, tag, push).

Beta has standing precedent (EVT-s-sp-20260514-001-beta-002): release record may proceed; push/tag is the red line. The user typed `APPROVED` once this session for Sprint A's internal-canary release prepare; that approval scope was bounded — push needs a fresh typed line.

### The convention's birth certificate

Sprint A shipped `goal_verification` end-to-end but no live sprint has exercised it. The dream (Painting 2) flagged this: until a real next sprint opts in, the convention is unfalsified. **Suggested next sprint after this push**: pick a small bug-fix or feature with a clear executable goal and DELIBERATELY include `goal_verification: { reproduction: executable, … }` in its Plan Contract. Watch the design-time gate fire. Watch the release-time ship-gate run the cited test. That run is the convention's birth certificate.

### Watch for

- **Two-gate authority pattern** (Β-MP-001 candidate). β returns DECIDE; classifier blocks anyway on cost/release ops. Don't retry under β blessing — type a plain line, or let the work stop.
- **paths/build.js without registry edit first** = silent prune. Always edit `framework/paths.registry.json` BEFORE running `scripts/paths/build.js`. Verified once this session (T-105 + restore commit). Β anti-pattern A-015.
- **Manual ticket implementation needs manual routing.js record per phase.** If you bypass `/sprint:execute` again (cost-halt pivot, scope-too-large), remember to record execution/qa/redteam traces before `/sprint:release check`. Β anti-pattern A-016.

### What's already implemented (don't re-implement)

- goal_verification block on plan-contract.schema.json (additive, optional)
- regression-fixture.schema.json (`warpos/sprint/regression-fixture/v1`)
- paths.sprintRegressionCorpus → `tests/regression`
- design.js fixture gate (gated on goal_verification presence)
- release.js cited-test executor (three branches: pass/fail/inconclusive; ENOENT → fail)
- /check:ac-coverage skill + helper
- /linters:run sprint-test-*.js discovery (test-plan-honors-registry-primary now on lint board)
- retrospective.js Goal Verification Status annotation
- format.js execFileSync + ETIMEDOUT cleanup (Windows: taskkill; POSIX: SIGKILL)
- scripts/hooks/lint-hook-output.js (warn-only PreToolUse validator)
- /check:node-procs skill + helper
- operational-loop.md "Background tasks and Windows process hygiene" section
- execute.md run_in_background warning line
- sprint-workflow.md "Sprint Goal Verification" section
- sprint-full-autonomy.json moderate preset description bump

Refer to `paths.sprintReference#sprint-goal-verification-sp-20260518-007` when in doubt.
