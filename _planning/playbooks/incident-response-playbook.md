# Incident Response Playbook

Reference procedure only. This is not an executable `/playbook:run` protocol.

Source design: `_planning/playbooks/SUITE-DESIGN.md`
Primary mode: adhoc or sprint
Primary outputs: incident facts, fix sprint, re-review evidence, tracker reconciliation

## Situation

Use this playbook when a gate fails, an enforcer reports a regression, a review finds a blocker, a dispatch lane stalls, or a false-green claim is discovered. The goal is to make the failure reproducible, fix the real cause, and reconcile the system state so the same incident does not become hidden debt.

## Preconditions

- Preserve the failing command, output, artifact, branch, and commit before changing code.
- Do not delete runtime evidence unless the task explicitly asks for cleanup.
- Confirm whether the incident affects product code, framework code, docs, release state, or runtime-only state.
- Do not push a fix without explicit in-session approval.

## Ordered Steps

1. Freeze the facts.
   - Record the failing command, exit code, artifact path, current branch, and relevant commit.
   - If a user-visible or release-impacting issue exists, state the current risk plainly in the active log.

2. Classify the incident.
   - Gate failure: identify the named enforcer and its invariant.
   - Review blocker: identify the finding, severity, and required fix.
   - Runtime stall: identify the process, ledger, evidence, or prompt file involved.
   - False green: identify what claimed pass and what evidence disproves it.

3. Reproduce before fixing.
   - Run the smallest focused command that demonstrates the issue.
   - If reproduction is impossible, mark the incident as not reproduced and name the missing evidence.

4. Plan the fix.
   - Use `/sprint:plan` for cross-module or release-impacting fixes.
   - Use adhoc execution only for narrow, well-scoped repairs.
   - Name the regression test or planted fixture that would catch the same class next time.

5. Implement and verify.
   - Make the smallest scoped fix.
   - Run the focused regression first, then the broader gate that originally failed.
   - For security, privacy, provider, or release-surface fixes, run an independent reviewer where the local protocol requires it.

6. Reconcile state.
   - Update `TRACKER.md`, the linked epic/sprint tracker, and `CODEX-LOG.md` or session log with the incident, fix, and verification.
   - If the incident exposes a missing enforcer, add the enforcer or record explicit enforcement debt.

7. Close or escalate.
   - Close only when the failing evidence is green or the blocker is explicitly waived by the right authority.
   - Escalate if the same blocker repeats after three attempts, a hard-stop domain is involved, or a release was already affected.

## Gates That Must Pass

- Failing evidence is captured before changes.
- A reproduction attempt is recorded.
- The fix has a focused regression or a named reason why one cannot be added immediately.
- The original failing gate or review lane has been rerun.
- Tracker/log state matches the actual outcome.
- No release, push, or destructive action happened without approval.

## Definition of Done

- The incident has a stable root cause or a clearly named unresolved blocker.
- The fix is committed or the remaining work is tracked.
- The original failure mode is covered by a test, enforcer, reviewer evidence, or explicit debt.
- The tracker next action no longer points at stale or already-closed work.
- Any user-facing risk has a current status.

## Rollback

- If the fix causes a broader regression, revert only the changes from this incident unless the user explicitly approves a larger revert.
- If runtime state was changed incorrectly, restore from the recorded pre-change state or mark it for manual operator repair.
- If the incident cannot be reproduced after three attempts, stop and request the missing evidence or external-state change.
- If a release was affected, follow the release rollback path before continuing root-cause work.
