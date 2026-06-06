---
description: Full session wrap-up — cognitive maintenance (learn/mine/sleep → integrate learnings + β recs) → reconcile + validate TRACKER.md (fail-closed) → fresh handoff → land to main → fresh branch → tear down teams. The one "we're done, tee up next session" command.
---

# /session:end — Full Session Wrap-Up

One command to close a working session cleanly: consolidate what was learned, write the next-session handoff, land the work to `main`, start a fresh branch, and tear down the agent team. Run it when you're done for the session and want the next one to start clean.

This is an **orchestration skill** — it chains existing skills in dependency order; it does not reimplement them. Phases are SEQUENTIAL (each depends on the prior). Fail-open: if a non-critical phase fails, note it and continue; never let a cleanup phase block the handoff/land.

## Input

`/session:end [--quick] [--no-push] [--keep-teams] [--branch <name>]`

- `--quick` — use `/sleep:quick` (NREM + cleanup, ~5 min) instead of `/sleep:deep` (~15-30 min). Default: deep.
- `--no-push` — stop at a LOCAL commit+merge; do not push (use when push isn't operator-authorized this session).
- `--keep-teams` — skip the team-teardown phase (Phase 9).
- `--branch <name>` — name for the fresh post-land branch. Default: `session/<YYYY-MM-DD>` (or `work/<YYYY-MM-DD>`).

## Procedure

### Phase 1 — Extract learnings (`/learn:deep`)
Run `/learn:deep`. It mines THREE sources in parallel: conversation, event log, and retro/report files (oneshot retros + **sprint retros** `paths.sprintHistory` + **`_reports/`**). Subagents can't read the transcript — do the conversation phase yourself; fan out events + retros as read-only subagents that RETURN candidates (write centrally to avoid concurrent-write conflicts on `paths.learningsFile`).

### Phase 2 — Mine user patterns (`/beta:mine`)
Run `/beta:mine`. Writes recommendations to the β staging file (`.claude/agents/president/.system/beta/judgement-model-recommendations.md`). Does NOT modify the judgement model directly — Phase 3 reviews the recs. Can run as a background subagent while Phase 1 finishes.

### Phase 3 — Consolidate (`/sleep:deep`, or `/sleep:quick` with `--quick`)
Run `/sleep:deep` (all 6 phases). **Depends on Phase 1 + 2 output** (Phase 4 of sleep reviews the β recs + freshly-logged learnings). This is the long pole (~15-30 min). With `--quick`, run `/sleep:quick` instead.

### Phase 4 — Integrate (`/learn:integrate` + `/beta:integrate`)
Both run AFTER sleep (Phase 3) so they act on the **consolidated + reviewed** set. They touch different targets (learnings → enforcement; β recs → judgment model), so run them in parallel:
- **`/learn:integrate`** — promote validated, high-score **learnings** into actual enforcement (hooks / rules / skills / agent specs).
- **`/beta:integrate`** — promote the validated **β pattern-mining recommendations** (staged by Phase 2's `/beta:mine`, reviewed in `/sleep:deep` Phase 4) into the **β judgment model**. This is the counterpart to `/learn:integrate`: without it, `/beta:mine`'s recs sit in the staging file *mined-but-never-applied* — the exact gap that left P-051..P-054 staged at session-2 end. Apply only operator-validated / high-confidence recs; a NEW *principle* or *policy* item still needs its own operator ruling (don't auto-promote a behavioral principle).

> Both are no-ops if Phase 1/2 produced nothing to integrate — fail-open: note and continue.

### Phase 5 — Reconcile + validate `TRACKER.md` (fail-CLOSED)
`TRACKER.md` (root) is the enforced source of truth — the Handoff (Phase 6) is built FROM it and the Land (Phase 7) pushes it, so it must be ACCURATE and GREEN before either. Never write a handoff or land on a tracker that lies about state.
1. **Validate.** Run `node scripts/trackers/validate.js` (the full check set — currently **20 checks**: 12 single-file + 8 cross-file incl. `cross-file-reconciliation`, `epics-in-roadmap`, `roadmap-epic-based`). It must exit 0.
2. **Reconcile if needed.** If it FAILs — OR if `TRACKER.md` doesn't reflect THIS session's work — UPDATE it AND its linked `trackers/epics/E-*.md` + `trackers/sprints/*.md` files so every item's state / percent / evidence / next-action matches reality (state changes, items moved to Completed, new gaps recorded, definitions added, change-log + session-log entries). `cross-file-reconciliation` FAILs if a TRACKER item's state disagrees with its linked file — update BOTH. If roadmap-coupled state changed, reconcile `ROADMAP.md` § Epics too. Re-run the validator until **all checks PASS, exit 0**.
3. **Why fail-closed (unlike the cleanup phases):** a red/stale tracker at session end is the exact "state drifts silently from the contract" / "felt-done-but-wasn't" failure the enforced tracker exists to prevent — and the next session resumes from it. If the validator cannot be made green, **STOP and surface it**; do NOT proceed to Handoff/Land on a lying tracker. (This is the PROACTIVE counterpart to the `scripts/hooks/tracker-completion-gate.js` Stop hook, which catches a red tracker at the actual session Stop — reconcile here so that hook stays silent.)

### Phase 6 — Handoff (`/session:dump`)
Run `/session:dump` to write a fresh prescriptive `DUMP.md` at project root. MUST include: (a) what shipped this session (commits, verified), (b) the **next-session pickup** (ranked, role-aware — consult `director-of-product`/`product-lead` for the top pick), (c) **immediate issues found** this session, (d) anti-instructions / coordination lessons, (e) state + spend notes. `DUMP.md` is gitignored/local — it does not get committed; it's read once by the next session.

### Phase 7 — Land (`/commit:land`)
Regenerate BOTH manifests first if any hash-tracked file changed (`node scripts/generate-framework-manifest.js` + `node scripts/warpos/manifest/build.js`) — else BC-02/BC-05 go red. Then run `/commit:land` (commit → push branch → ff-merge to default → push default).

> **AUTONOMY CEILING (hard):** pushing to remote requires operator authorization (CLAUDE.md `## Autonomy`). `/session:end` does NOT auto-push unless the operator has authorized a push this session OR turbo `push-to-main` scope is active. With `--no-push` (or no authorization), stop at the LOCAL commit + ff-merge to `main` and surface "ready to push — confirm." NEVER force-push; never bypass the safety floor.

### Phase 8 — Fresh branch
After the land, create a clean working branch off `main` so the next session doesn't start on a dirty/merged branch:
```bash
git -C "$CLAUDE_PROJECT_DIR" switch main
git -C "$CLAUDE_PROJECT_DIR" switch -c <--branch | session/$(date -u +%F)>
```
(Skip if the operator wants to stay on `main`.)

### Phase 9 — Tear down teams (`--keep-teams` to skip)
Kill ALL persistent teams + members for this project so the next session spawns fresh (avoids W-21 cross-session accretion + zombie in-process teammates):
1. For each member of the current team, `SendMessage {type:"shutdown_request"}` and wait for `shutdown_approved` — this reaps **live in-process** agents (TeamDelete alone CANNOT kill a live in-process process; it only cleans config/dirs — a zombie from a dead session stays addressable and reappears).
2. `TeamDelete` to clear the team + task dirs + the current session's lead binding.
3. Remove any stale on-disk team dirs for THIS project's `*-adhoc` under `~/.claude/teams/` + `~/.claude/tasks/` (only this project's — NEVER touch sibling-project teams).
4. Verify with `node scripts/checks/adhoc-team-hygiene.js` (clean for this project).

### Phase 10 — Report
Tell the operator: what consolidated (learnings/recs/integrations), **the TRACKER.md validation result + any reconciliation done** (Phase 5), the `DUMP.md` next-pick, what landed (commit + pushed-or-local), the fresh branch name, teams torn down, and a one-line "you're clear to start a fresh session."

## Notes / lessons baked in
- **Sequential by dependency** — sleep needs learn+mine; BOTH integrators (`/learn:integrate` + `/beta:integrate`) need sleep; **the TRACKER.md reconcile (Phase 5) must precede the handoff + land** (both consume the tracker as source of truth); dump needs the analysis; land needs manifests fresh; branch + teardown come last.
- **TRACKER reconcile is fail-CLOSED** (Phase 5) — unlike the fail-open cleanup phases, a red/stale tracker BLOCKS the handoff + land. The handoff is built from it and the next session resumes from it; a lying tracker poisons both. Reconcile `TRACKER.md` + its epic/sprint files + `ROADMAP.md` § Epics until `node scripts/trackers/validate.js` is fully green.
- **Mine + integrate are a PAIR (run both halves)** — `/beta:mine` only STAGES recommendations; `/beta:integrate` is what APPLIES the validated ones to the judgment model. Running mine without integrate (as session-2 did) leaves recs perpetually staged. Same shape as `/learn:deep`→`/learn:integrate`.
- **Push is autonomy-gated** — default to local-only unless authorized.
- **First real run of a new orchestration skill should be operator-supervised** — don't trust an untested wrap-up on a critical push; hand-drive once, then rely on it.
- **Don't `node -e` fs-writes** (merge-guard blocks) — use Write/Edit or a one-shot `scripts/*.js`.

## Related
- `/learn:deep`, `/beta:mine`, `/sleep:deep`, `/sleep:quick`, `/learn:integrate`, `/beta:integrate` — the cognitive-maintenance chain (mine+integrate and deep+integrate are PAIRS — run both halves).
- `/trackers:validate` — the fail-closed tracker validator run in Phase 5 (`node scripts/trackers/validate.js`).
- `/session:dump`, `/session:handoff`, `/session:checkpoint` — handoff artifacts.
- `/commit:land` — the commit→push→merge flow.
- `/mode:adhoc` — re-spawns the team next session.
