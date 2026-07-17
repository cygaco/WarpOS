# WarpOS Packs Catalog

## What is a pack?

A pack is reusable operating machinery:

```text
manifest + templates + scripts + checks + hooks + docs + fixtures + gates + evidence shape
```

A pack is not just a guide.

## Pack manifest shape

```yaml
id: P-WEBAPP-PRODUCTION-BASELINE
version: 1
owner: warp-core
applies_when:
  - stack.nextjs
  - stack.supabase
installs:
  templates: []
  scripts: []
  hooks: []
  checks: []
  guides: []
  founder_panel_items: []
verify_by:
  - node scripts/checks/webapp-production-baseline.js
```

## 1.0 packs

### P-TRUTH-RELEASE

Purpose: make repo truth consistent.

Includes:

- release metadata checks
- README generated metadata block
- manifest parity
- command catalog parity
- hook registry parity
- ship/install coverage
- root cleanup dry-run

### P-INSTRUCTION-INTEROP

Purpose: make AGENTS.md canonical and provider shims generated.

Includes:

- instruction source tree
- role specs
- generated AGENTS.md / CLAUDE.md / GEMINI.md
- nested instruction policy
- no-root-alpha-poison check

### P-WORKORDER-ENVELOPE

Purpose: provider-neutral execution contract.

Includes:

- WorkOrder schema
- ResultEnvelope schema
- validators
- fixtures
- prompt-size floor
- close gate

### P-SPRINTROOM

Purpose: persistent sprint rooms and leases.

Includes:

- SprintRoom schema
- lease schema
- checkpoint/handoff
- tracker fidelity
- session intent

### P-DISPATCH-KERNEL

Purpose: one route resolver and provider adapter system.

Includes:

- route resolver
- provider adapters
- doctor
- provider health/quota checks
- cross-provider review invariant

### P-LIVENESS-REAPER

Purpose: no premature reaping and no silent deaths.

Includes:

- lease store
- heartbeat
- ping-before-reap
- output/commit/ledger liveness
- death records

### P-WORKTREE-ISOLATION

Purpose: correct branch/cwd/base handling.

Includes:

- worktree base policy
- live-head default for dependent work
- worktree tests
- wrapper cwd ownership

### P-SPRINT-COMPILER

Purpose: make sprint plans executable by cheaper doers.

Includes:

- plan contract schema
- exact files/commands/env vars
- `verified_by`
- do-not-reopen table
- stop-and-ask gates
- do-not-build list
- blast radius check

### P-FOUNDER-PANEL

Purpose: interactive founder setup surface with store.

Includes:

- panel app
- panel store
- generator from checklist/env/routes/migrations
- founder-friendly subpanels
- evidence model

### P-WEBAPP-PRODUCTION-BASELINE

Purpose: default production trust envelope for generated web apps.

Includes:

- auth/session/cache safety
- route matrix
- API boundary security
- input validation
- rate limiting
- CSRF/origin
- observability
- error boundaries
- legal/privacy basics

### P-SUPABASE-NEXT-SECURITY

Purpose: Supabase + Next.js secure defaults.

Includes:

- SSR auth adapter
- RLS migrations
- explicit grants
- live RLS proof
- storage RLS
- RBAC/ACL/share templates
- service_role reachability scan

### P-DEMO-MVP-LAUNCH-GATES

Purpose: stage-gated readiness.

Includes:

- demo readiness
- OAuth publishing status
- demo-data cleanup
- launch credential hygiene
- key rotation
- prod/demo separation
- legal/payment/monitoring checks

### P-OBSERVABILITY-MEMORY

Purpose: event-sourced operating memory.

Includes:

- events JSONL schema
- materialized state
- event compactor
- session handoff
- sleep/learning promotion

### P-HIDDEN-EVALS

Purpose: prevent visible-test overfitting.

Includes:

- PRD quality holdouts
- UX completeness holdouts
- security/launch/founder judgment holdouts
- dispatch false-green fixtures

### P-MASTER-CONSOLE

Purpose: state-aware foundry dashboard.

Includes:

- active project list
- running workers
- blockers
- founder actions
- provider health
- launch readiness
- next action

## Pack implementation rule

Each pack must ship with a `verify_by` command. If it cannot be verified, it is not a finished pack.
