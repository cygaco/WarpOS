# Granular Stories — Enforce sprint routing policy

**Sprint:** `SP-20260514-002`
**High-level stories:** `high-level-stories.md`

Each story produces ~one ticket. Tickets may bundle related stories; see the ticket map below.

## S-1 — `routing.js record` subcommand with schema validation

**As** Alpha
**I want** `node scripts/sprint/routing.js record --phase <X> --artifact <id-or-path> --sprint <SP-id> --model <provider:name> [--diff-reviewer <provider:name>] [--evidence <free-text>]`
**So that** a routing-trace row is durably appended at artifact-finalize time.

Acceptance criteria: AC-1.1, AC-1.2, AC-1.3, AC-1.4.

Linked: `H-1`, `R-1`, `R-2`, `R-3`, `R-4`.

## S-2 — `routing.js check` subcommand

**As** Alpha
**I want** `node scripts/sprint/routing.js check --phase <X> --artifact <id-or-path> --sprint <SP-id>` to exit 0 when a matching trace row exists, exit 1 otherwise
**So that** scripts and hooks can verify trace presence in one call.

Acceptance criteria: AC-2.1, AC-2.2.

Linked: `H-2`, `R-1`.

## S-3 — `routing.js coverage` subcommand

**As** Alpha (and `/sprint:release`)
**I want** `node scripts/sprint/routing.js coverage --sprint <SP-id> [--format json|text]` to print per-phase coverage and exit non-zero when any required phase is missing
**So that** the release gate has a single canonical answer to "did this sprint honor its policy?".

Acceptance criteria: AC-3.1, AC-3.2, AC-3.3.

Linked: `H-1`, `H-4`, `R-1`, `R-8`.

## S-4 — Trace schema

**As** the schema validator
**I want** `schemas/sprint/routing-trace.schema.json` (id `warpos/sprint/routing-trace/v1`) defining the trace row structure
**So that** `routing.js record` rejects malformed rows and downstream consumers parse trusted shapes.

Acceptance criteria: AC-4.1, AC-4.2.

Linked: `H-1`, `R-2`.

## S-5 — Wire plan.js to record phase=planning

**As** `/sprint:plan`
**I want** `plan.js` to call `routing.js record --phase planning` after `writePlanContract`
**So that** every new Plan Contract is provenanced.

Acceptance criteria: AC-5.1, AC-5.2.

Linked: `H-1`, `R-5`.

## S-6 — Wire design.js to record phase=design

**As** `/sprint:design`
**I want** `design.js` to call `routing.js record --phase design` after rendering the requirements bundle
**So that** every design pack is provenanced.

Acceptance criteria: AC-6.1.

Linked: `H-1`, `R-6`.

## S-7 — Wire execute.js to record phase=execution + gauntlet phases

**As** `/sprint:execute`
**I want** `execute.js` to record `--phase execution` per ticket finalize and `--phase qa` / `--phase redteam` per gauntlet pass
**So that** the per-ticket build chain is provenanced.

Acceptance criteria: AC-7.1, AC-7.2.

Linked: `H-1`, `R-7`.

## S-8 — Wire release.js to coverage gate

**As** `/sprint:release`
**I want** `release.js` to call `routing.js coverage` early in the release flow and refuse to proceed when required phases are missing
**So that** routing drift cannot ship.

Acceptance criteria: AC-8.1, AC-8.2.

Linked: `H-4`, `R-8`.

## S-9 — Wire retrospective.js to record phase=retrospective

**As** `/sprint:retrospective`
**I want** `retrospective.js` to record `--phase retrospective` after writing `retro.yaml`
**So that** retros themselves are provenanced.

Acceptance criteria: AC-9.1.

Linked: `H-1`, `R-9`.

## S-10 — `sprint-routing-guard.js` PreToolUse hook

**As** the harness
**I want** a new `scripts/hooks/sprint-routing-guard.js` that blocks `Edit|Write` on sprint artifact paths when no matching trace row exists, honoring `enforcement.mode`
**So that** writes outside the recording flow surface the gap immediately.

Acceptance criteria: AC-10.1, AC-10.2, AC-10.3, AC-10.4.

Linked: `H-2`, `R-10`, `R-13`, `R-14`.

## S-11 — Register guard hook in settings.json

**As** the harness operator
**I want** `.claude/settings.json` PreToolUse Edit|Write chain to include `sprint-routing-guard.js` between `memory-guard.js` and `step-registry-guard.js`
**So that** the guard runs alongside the other artifact guards.

Acceptance criteria: AC-11.1.

Linked: `H-2`, `R-10`.

## S-12 — Add `enforcement.mode` to sprint-routing.json

**As** the policy author
**I want** an `enforcement` block in `sprint-routing.json` with `mode: warn|block`, `rolled_out_at`, `soft_rollout_until`
**So that** the rollout is observable + reversible without code changes.

Acceptance criteria: AC-12.1, AC-12.2.

Linked: `H-2`, `R-11`.

## S-13 — Sprint skill md files document the contract

**As** an operator reading a sprint skill
**I want** each of `plan.md` / `design.md` / `execute.md` / `release.md` / `retrospective.md` to carry a `## Routing enforcement` section that names the recording call and the soft-rollout default
**So that** the contract is discoverable from within the skill.

Acceptance criteria: AC-13.1.

Linked: `H-1`, `R-12`.

## S-14 — End-to-end smoke validation

**As** Alpha closing the sprint
**I want** to invoke `routing.js record` against the artifacts produced by this very sprint (Plan Contract, requirements bundle, tickets, release record), then run `routing.js coverage --sprint SP-20260514-002` and confirm it exits 0
**So that** the loop is verified end-to-end on real data before release.

Acceptance criteria: AC-14.1, AC-14.2.

Linked: `H-1`, `H-4`.

## Ticket map

| Ticket | Stories | Workstream |
|---|---|---|
| T-A | S-1, S-2, S-3, S-4 | CLI: routing.js subcommands + schema |
| T-B | S-5, S-6, S-7, S-8, S-9 | Sprint scripts wire `record`/`coverage` calls |
| T-C | S-10, S-11, S-12 | Hook + policy enforcement field |
| T-D | S-13 | Skill body updates |
| T-E | S-14 | End-to-end smoke test on this sprint |
