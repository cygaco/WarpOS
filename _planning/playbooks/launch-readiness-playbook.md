# Launch Readiness Playbook

Reference procedure only. This is not an executable `/playbook:run` protocol.

Source design: `_planning/playbooks/SUITE-DESIGN.md`
Primary mode: sprint
Primary outputs: lastmile gap report, launch plan, sprint plan, release evidence

## Situation

Use this playbook when a scaffolded or existing product has a working prototype and the next goal is a paid or public launch. The job is to turn "it runs" into "it can accept real users without hidden launch blockers."

This playbook composes the existing lastmile, scan, sprint, and release gates. It does not replace any specialist skill.

## Preconditions

- Work from the canonical repo root or the product repo root named by the current task.
- Read `TRACKER.md`, `ROADMAP.md`, and the linked epic or sprint tracker before changing state.
- Confirm the product has a canonical intent source under `_requirements/00-canonical/`, or record that the intent source is missing before planning fixes.
- Confirm `FOUNDERS_CHECKLIST.md` exists if the product was scaffolded by a Product Foundation build.
- Confirm the current branch and push/release authority. Do not push, publish, deploy, flip DNS, enable live payments, or email real users without explicit in-session approval.
- Treat sensitive data, regulated domains, children, finance, health, biometrics, and location as hard-stop escalation domains.

## Ordered Steps

1. Establish launch target.
   - Read the product's canonical requirements, roadmap, and tracker state.
   - Name the launch surface: web, mobile, API, extension, marketplace, or internal beta.
   - Record the target in the active sprint or epic artifact before making launch-readiness claims.

2. Run the lastmile audit.
   - Preferred skill: `/bootstrap:lastmile --phase audit`.
   - Direct engine path when working without the skill wrapper: `node scripts/bootstrap/lastmile/orchestrate.js --phase audit`.
   - Preserve the generated gap report as product-side runtime/output evidence, not as canonical framework source.

3. Reconcile human-only blockers.
   - Read `FOUNDERS_CHECKLIST.md` and compare its open items to the lastmile gaps.
   - Do not let the audit silently re-derive or ignore checklist state.
   - Mark each open blocker as either owner-action, sprint-work, or explicit release waiver.

4. Convert gaps into sprint work.
   - Use `/sprint:plan` for any code, configuration, policy, or artifact work needed before launch.
   - Each sprint must name its enforcer, tests, approval points, and rollback path.
   - Keep human-only items in `FOUNDERS_CHECKLIST.md`; do not hide them inside a code sprint.

5. Execute the shortest safe path.
   - Use `/sprint:execute` or the active sprint runtime for implementation work.
   - Use the existing module-specific guides for auth, payments, database, email, analytics, security, privacy, and app stores.
   - Run specialist review on security, privacy, payments, and data-retention changes.

6. Run health and integrity checks.
   - Run `/scan:full` or the focused direct scripts named by the sprint.
   - Always include tracker validation and the product's regression suite.
   - If changing WarpOS scaffold/framework files, regenerate manifests and run ship-coverage.

7. Prepare release evidence.
   - Summarize the gap report, fixes, tests, review results, and unresolved human-only items.
   - Call out any approval gates that remain blocked: Stripe live mode, DNS, email real users, production database migration, app-store submit, legal publication, sensitive data.

8. Release only after approval.
   - HALT for explicit operator approval before pushing a release, publishing, submitting to stores, enabling live payments, changing DNS, running destructive migrations, or contacting real users.
   - After approval, use the repo's normal release path and record the release result in the tracker.

## Gates That Must Pass

- Lastmile audit completes without runner error.
- No hard-stop sensitive-data finding is unresolved.
- `FOUNDERS_CHECKLIST.md` open items are classified as owner-action, sprint-work, or explicit waiver.
- Tracker state is reconciled with the actual branch, commits, evidence, and next action.
- Required scans/tests pass, or every remaining red is named as known baseline debt with a specific owner.
- Explicit in-session approval exists for any push, release, deploy, DNS, live-payment, app-store, legal-publication, production-migration, or real-user email action.

## Definition of Done

- The launch target is stated in the active tracker artifact.
- The lastmile gap report exists and is cited in the sprint or epic evidence.
- Every launch blocker is closed, assigned to a human, or waived explicitly.
- The product has a launch plan with gates, tests, rollback, and approval points.
- No release-readiness claim depends on unverified assumptions.
- The operator can see the next action in `TRACKER.md` or the linked epic tracker.

## Rollback

- If launch evidence is wrong, revert the launch-readiness claim in the tracker and restore the prior next action.
- If a release was prepared but not approved, leave release artifacts local and record the pending approval.
- If a deployed release fails after approval, use the product's release rollback path first, then open a fix sprint with the failed gate as the starting evidence.
- If sensitive-data or legal exposure appears late, stop launch work and escalate before continuing.
