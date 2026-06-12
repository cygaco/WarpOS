# Mode Switch Playbook

Reference procedure only. This is not an executable `/playbook:run` protocol.

Source design: `_planning/playbooks/SUITE-DESIGN.md`
Primary mode: solo or adhoc
Primary outputs: verified mode state, team state, lifecycle evidence

## Situation

Use this playbook when changing WarpOS operating posture: solo, adhoc, oneshot, or sprint. The goal is a clean handoff from the old team/mode to the target mode without stale team handles, wrong-role dispatch, or unverified lifecycle state.

## Preconditions

- Read the active task and confirm the target mode is appropriate.
- Read `TRACKER.md` if the target mode will touch sprint, epic, roadmap, or framework state.
- Confirm whether the old mode has active team/process state.
- Do not start work in the new mode until the mode init/gate has passed or its failure is explicitly recorded.

## Ordered Steps

1. Identify current state.
   - Inspect current mode state and active teams through the existing mode/session commands.
   - Run `/warp:health` if provider, team, or lifecycle health is uncertain.

2. Choose the target mode.
   - Use `/mode:solo`, `/mode:adhoc`, `/mode:oneshot`, or `/mode:sprint`.
   - Match the target to the work: solo for isolated judgment, adhoc for scoped build/review, oneshot for skeleton generation, sprint for lifecycle work.

3. Teardown old team state.
   - Use the existing session/mode teardown path rather than deleting files manually.
   - Verify old-team termination before relying on new-team identity.
   - If teardown fails, stop and record the failure instead of dispatching into ambiguous state.

4. Initialize target mode.
   - Run the target `/mode:*` command.
   - Verify registry-derived roster, bindings, and provider tier expectations.
   - Confirm the target team identity matches the requested mode.

5. Bind to tracker/planning artifacts.
   - For sprint/epic work, verify the active sprint or epic tracker exists and names the next action.
   - For planning work, ensure the durable `_planning/` artifact links back to the tracker.

6. Start work only after gate evidence.
   - Confirm the mode-init/lifecycle gate outcome is visible.
   - If a gate is report-only, record its report-only status and any findings.
   - Dispatch agents only through the mode's allowed channels.

## Gates That Must Pass

- Target mode is named and matches the task.
- Old team is terminated or its failure is recorded as a blocker.
- New team identity and required bindings match the mode registry.
- Provider readiness is sufficient for the target mode or the shortfall is visible.
- Tracker and planning artifacts exist when the target mode needs them.
- No work begins under a stale or ambiguous team handle.

## Definition of Done

- The repo/session is operating in the target mode.
- The active team and bindings match the mode registry.
- Lifecycle evidence shows the transition or the failure is recorded.
- The next work item has a valid tracker/planning anchor.
- Any report-only lifecycle gaps are named for follow-up.

## Rollback

- If target mode init fails, return to the prior known-good mode only through the mode command path.
- If the old team cannot be killed, stop dispatch and run the health/teardown diagnostic path.
- If tracker binding is wrong, fix the tracker linkage before continuing implementation work.
- If provider readiness is insufficient, follow the provider setup playbook before retrying the mode switch.
