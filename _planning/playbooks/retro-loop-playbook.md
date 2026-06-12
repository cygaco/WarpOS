# Retro Loop Playbook

Reference procedure only. This is not an executable `/playbook:run` protocol.

Source design: `_planning/playbooks/SUITE-DESIGN.md`
Primary mode: sprint
Primary outputs: retrospective, learning integration, tracker/roadmap reconciliation

## Situation

Use this playbook at sprint or epic close, after a major incident, or when repeated failures show the system learned something that should become durable. The goal is to convert observed behavior into tracker state, knowledge, guides, playbooks, or enforcers without smearing runtime noise into framework truth.

## Preconditions

- The sprint, epic, incident, or release has concrete evidence to review.
- Runtime artifacts are preserved long enough to extract lessons.
- The current branch and commit state are known.
- The operator has not requested that learning or tracker reconciliation be skipped.

## Ordered Steps

1. Gather evidence.
   - Read the sprint/epic tracker, `ROADMAP.md`, `TRACKER.md`, session log, review outputs, tests, and release artifacts.
   - Separate source changes from runtime evidence.

2. Run the closeout procedure.
   - Use `/sprint:retrospective` for sprint closeout when available.
   - Use `/learn:deep` when the evidence spans repeated failures or cross-system behavior.
   - Use `/learn:integrate` only after deciding which lesson should become durable.

3. Classify lessons.
   - Doctrine play: add to `.claude/project/reference/playbook.md` through `/playbook:add`.
   - Situational procedure: add or revise `_planning/playbooks/*-playbook.md`.
   - Guide: add or revise `_guides/` with guide coverage.
   - Knowledge: add or revise `_knowledge/` with knowledge coverage.
   - Enforcement gap: add a checker/hook/validator or record explicit enforcement debt.

4. Reconcile trackers.
   - Update the linked epic or sprint tracker state, completion percent, evidence, and next action.
   - Update `ROADMAP.md` when the epic-level next action or percent changed.
   - Keep `TRACKER.md` aligned with active/completed state if the tracker owns that item.

5. Validate the learning integration.
   - Run the coverage check for the layer touched: guide, knowledge, playbook-suite, tracker, manifest, or ship coverage.
   - Run focused tests for any code enforcer added.
   - Confirm generated manifests are current if framework-owned files changed.

6. Close the loop.
   - Record what changed, what evidence supports it, and what remains.
   - If a lesson is intentionally not integrated, name where the debt is tracked.

## Gates That Must Pass

- Every claimed lesson is grounded in a concrete artifact or observed command.
- Tracker and roadmap state agree after reconciliation.
- The touched layer's coverage check passes.
- Any new policy names an enforcer or explicit enforcement debt.
- Runtime evidence is not committed as framework source unless the task explicitly requires a fixture.

## Definition of Done

- The retrospective or learning output exists.
- Durable changes were made in the right layer.
- Relevant coverage checks pass.
- Trackers name the current next action.
- Remaining debt is visible and assigned to a sprint, epic, or enforcement-debt record.

## Rollback

- If a lesson was integrated into the wrong layer, revert that layer change and re-add it to the correct home.
- If tracker reconciliation is wrong, correct the tracker before continuing new work.
- If a new enforcer false-greens or false-reds, open an incident/fix sprint and keep the policy marked untrusted until the enforcer is repaired.
- If runtime evidence was committed accidentally, remove it from source history only with explicit approval for history-changing actions; otherwise commit a cleanup that deletes it going forward.
