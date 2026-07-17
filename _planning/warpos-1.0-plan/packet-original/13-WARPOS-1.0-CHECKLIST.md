# WarpOS 1.0 Checklist

This checklist is intentionally long. WarpOS 1.0 means production-grade operating system, not polish.

## Truth and release

- [ ] release metadata agrees across `version.json`, `.claude/manifest.json`, `RELEASES.md`, and latest release capsule
- [ ] release checksums are verified after final changelog
- [ ] README metadata generated from live scans
- [ ] stale command names removed
- [ ] manifest includes Epsilon and sprint mode if live code supports them
- [ ] `_requirements/README.md` reflects live tree
- [ ] stale downstream gap claims reconciled
- [ ] install/ship coverage catches missing dependencies

## Instruction interop

- [ ] AGENTS.md provider-neutral handbook exists
- [ ] CLAUDE.md imports AGENTS.md and binds top-level Claude to Alex Alpha
- [ ] GEMINI.md generated/import-based
- [ ] Codex path uses AGENTS.md directly
- [ ] root AGENTS.md does not globally say “you are Alpha”
- [ ] nested instruction policy exists
- [ ] instruction size/conflict audits exist
- [ ] role specs are typed

## Role/state persistence

- [ ] AlphaState exists
- [ ] Beta decision ledger exists
- [ ] Epsilon SprintRoom state exists
- [ ] role states stored in durable paths
- [ ] chat memory not sole truth
- [ ] session handoff exists
- [ ] session intent exists

## SprintRoom

- [ ] every sprint creates SprintRoom
- [ ] SprintRoom stores WorkOrders, decisions, leases, evidence, next action
- [ ] tracker links maintained
- [ ] phase checkpoints written
- [ ] tracker fidelity scan compares tracker to sprint state/git

## WorkOrder / ResultEnvelope

- [ ] schema files exist
- [ ] validators exist
- [ ] fixtures exist
- [ ] every model task can run through WorkOrder
- [ ] every worker returns ResultEnvelope
- [ ] close gate blocks missing evidence
- [ ] prompt-size floor blocks hollow feature prompts

## Dispatch kernel

- [ ] one route resolver
- [ ] provider adapters share contract
- [ ] provider health/auth/quota preflight
- [ ] fallback and provider-unavailable handling
- [ ] cross-provider review invariant
- [ ] no raw provider CLI bypass
- [ ] dispatch doctor explains routes

## Liveness and reaper

- [ ] STARTED record before spawn
- [ ] leases and heartbeat store
- [ ] ping-before-reap
- [ ] no process-absence-only reaping
- [ ] output growth / ledger / commit / elapsed time liveness
- [ ] death/timeout/reap records survive hard kills

## Worktree isolation

- [ ] wrapper owns cwd/worktree
- [ ] no raw-forward unsafe provider worktree flags
- [ ] worktree base policy explicit
- [ ] dependent builders branch from live HEAD
- [ ] stale-base tests exist

## Sprint compiler

- [ ] sprint plan contract schema
- [ ] exact files/commands/env vars
- [ ] `verified_by` required
- [ ] do-not-reopen table
- [ ] stop-and-ask gates
- [ ] do-not-build list
- [ ] blast radius warning/block
- [ ] `_planning` mirroring

## Founder panel

- [ ] interactive app/store exists
- [ ] generator scans checklist/env/routes/migrations
- [ ] every founder gate has panel item
- [ ] evidence model exists
- [ ] Alpha can read panel store
- [ ] no invented env var names

## WebApp Production Baseline

- [ ] auth cache logout safety
- [ ] signed-out route access tests
- [ ] route matrix
- [ ] API boundary checks
- [ ] rate limits
- [ ] CSRF/origin checks
- [ ] input validation
- [ ] error boundaries
- [ ] observability setup

## Supabase/Next security

- [ ] SSR auth adapter
- [ ] no service_role client bundle reachability
- [ ] RLS coverage scan
- [ ] policy matrix tests
- [ ] storage RLS
- [ ] explicit grants migration
- [ ] live RLS proof
- [ ] RBAC/share ACL scaffold

## Demo/MVP/Launch gates

- [ ] demo readiness scan
- [ ] OAuth publishing status gate
- [ ] demo-data clean gate
- [ ] credential hygiene gate
- [ ] key rotation gate
- [ ] prod/demo separation gate
- [ ] legal/payment/cookie/consent gate
- [ ] monitoring/backup/incident gate

## Observability/memory

- [ ] event streams split by subsystem
- [ ] event schema validated
- [ ] materialized state generated
- [ ] compactor exists
- [ ] state doctor exists
- [ ] project sleep
- [ ] studio sleep
- [ ] learning promotions become enforcement

## Hidden evals

- [ ] PRD holdouts
- [ ] UX holdouts
- [ ] security holdouts
- [ ] launch holdouts
- [ ] founder judgment holdouts
- [ ] dispatch false-green fixtures
- [ ] tracker drift fixtures

## Master Console

- [ ] reads state, not chat
- [ ] shows projects/stages/blockers/running work
- [ ] shows founder actions
- [ ] shows provider health
- [ ] shows launch readiness
- [ ] answers “what next?”

## End-to-end acceptance

- [ ] clean install passes
- [ ] bootstrap spinup produces product docs and first screen
- [ ] sprint plan creates durable artifacts
- [ ] sprint full dispatches real roster
- [ ] failed worker is pinged/replaced safely
- [ ] provider quota failure classified
- [ ] Codex WorkOrder returns valid envelope
- [ ] Claude WorkOrder returns valid envelope
- [ ] reviewer fail triggers fixer and re-review
- [ ] founder panel generated from real seams
- [ ] demo readiness catches OAuth/demo-data issues
- [ ] launch gate catches secrets/prod separation
- [ ] release metadata gate catches version mismatch
- [ ] tracker fidelity catches stale tracker
