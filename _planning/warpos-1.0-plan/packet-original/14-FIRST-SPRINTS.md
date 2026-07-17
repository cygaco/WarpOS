# First Sprints to Finish WarpOS 1.0

Do not build everything at once. These sprints should be run sequentially.

## Sprint 0 — Truth and repo verification

Goal: make the current repo state trustworthy enough to work from.

Deliverables:

- phase-0 verification report
- release metadata drift report
- README drift report
- manifest parity report
- command catalog scan
- hook registry scan
- install/ship coverage scan
- stale downstream gap reconciliation plan

Do not implement dispatch or founder panel yet.

Exit gate:

```bash
node scripts/warpos/release-build.js --check || true
node scripts/checks/manifest-parity.js || true
node scripts/checks/readme-metadata.js --check || true
node scripts/checks/command-catalog.js --check || true
```

Use actual existing scripts if names differ. Create missing checks only after verifying current equivalents.

## Sprint 1 — Instruction interop

Goal: make AGENTS.md canonical without breaking Claude Code Alpha behavior.

Deliverables:

- instruction source tree
- typed role specs for Alpha/Beta/Epsilon and key workers
- generated AGENTS.md
- generated CLAUDE.md bootloader
- generated GEMINI.md shim if useful
- nested instruction policy
- no-root-alpha-poison check
- instruction conflict/size checks

Exit gate:

```bash
node scripts/instructions/build.js --check
node scripts/instructions/audit-conflicts.js
node scripts/instructions/audit-size.js
node scripts/instructions/no-root-alpha-poison.js
```

## Sprint 2 — WorkOrder / ResultEnvelope / Events

Goal: create the provider-neutral execution contract.

Deliverables:

- WorkOrder schema and validator
- ResultEnvelope schema and validator
- event schema
- starter event writer
- fixtures for pass/fail/partial/quota/death
- close-gate helper
- prompt-size floor helper

Exit gate:

```bash
node scripts/dispatch/test-work-order.js
node scripts/dispatch/test-result-envelope.js
node scripts/events/test-schema.js
```

## Sprint 3 — SprintRoom and leases

Goal: make sprints resumable from state.

Deliverables:

- SprintRoom schema
- SprintRoom open/status/checkpoint/resume scripts
- lease schema/store
- session intent
- tracker fidelity scan
- handoff writer

Exit gate:

```bash
node scripts/sprint/room-doctor.js
node scripts/checks/tracker-fidelity.js
node scripts/session/intent.js --check
```

## Sprint 4 — Dispatch/liveness/worktree kernel

Goal: fix the heart of execution.

Deliverables:

- route resolver
- provider adapters or adapter facade
- heartbeat/reaper
- provider health/quota classification
- worktree base policy
- STARTED records before spawn
- dispatch doctor

Exit gate:

```bash
node scripts/dispatch/test-route-resolver.js
node scripts/dispatch/test-heartbeat-reaper.js
node scripts/dispatch/test-worktree-policy.js
node scripts/dispatch/doctor.js --json
```

## Sprint 5 — Sprint compiler

Goal: make plans executable by cheaper doers.

Deliverables:

- plan contract schema
- `/goal:plan`, `/epic:plan`, `/sprint:plan` updates if needed
- exact files/commands/env vars
- `verified_by` enforcement
- blast radius check
- stop-and-ask gate
- do-not-build list
- tracker mirroring

Exit gate:

```bash
node scripts/sprint/plan-contract.test.js
node scripts/checks/sprint-verified-by.js
node scripts/checks/sprint-blast-radius.js
```

## Sprint 6 — Founder Panel Pack

Goal: stop hand-authoring founder panels.

Deliverables:

- panel store schema
- generator from checklist/env/routes/migrations
- hub and subpanel templates
- coverage scan
- product fixture from Doogle-like app

Exit gate:

```bash
node scripts/panel/generate-founder-panel.js --check
node scripts/panel/panel-coverage.js
node scripts/panel/panel-store-doctor.js
```

## Sprint 7 — WebApp Production Baseline / Supabase Next Security

Goal: make production-readiness default in generated apps.

Deliverables:

- route matrix scanner
- API boundary scanner
- auth cache scanner
- demo-data scanner
- RLS/grants/live proof templates
- env separation scan
- service_role reachability scan
- observability readiness scan

Exit gate:

```bash
node scripts/security/route-matrix.js --check
node scripts/security/api-boundary-scan.js
node scripts/security/auth-cache-scan.js
node scripts/security/rls-coverage.js
node scripts/checks/demo-data-clean.js
node scripts/launch/live-rls-proof.js
```

## Sprint 8 — Demo/MVP/Launch gates and hidden evals

Goal: ensure launch does not depend on operator memory.

Deliverables:

- demo-readiness scan
- OAuth publishing status gate
- launch credential hygiene scan
- legal/payment/cookie gate
- backup/incident runbook gate
- hidden eval fixture runner

Exit gate:

```bash
node scripts/checks/demo-readiness.js
node scripts/checks/launch-credential-hygiene.js
node scripts/checks/legal-payment-ready.js
node scripts/evals/run-hidden-holdouts.js
```
