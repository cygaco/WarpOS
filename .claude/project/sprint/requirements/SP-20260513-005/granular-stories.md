# Granular Stories — Harden /warp:update — preflight + transactional apply + postflight verify

**Sprint:** `SP-20260513-005`
**High-level stories:** `high-level-stories.md`

> Each granular story produces roughly one ticket.

## S-1 — Failure-mode mining deliverable

**As** Alex executing design phase
**I want** to mine `.claude/runtime/handoffs/` + `events.jsonl` for
`/warp:update` failure signatures and produce a catalog with frequency,
existing-gate coverage, and preflight-gate candidates
**So that** the gates we build target the signatures the operator actually
hits, not invented ones.

Deliverable:
`.claude/project/sprint/sprints/SP-20260513-005/failure-mining.md`.

Acceptance criteria: AC-S-1.1.

Linked: `H-4`, `R-1` (the catalog is the evidence base for every R-N).
COPY: —.
INPUTS: —.
TRACE: TR-6 (research artifact).

## S-2 — `scripts/warpos/preflight.js` composes 10 gates with unified report

**As** the operator
**I want** preflight to call all 10 gates in fail-fast order and produce
ONE structured report with per-gate `{name, status, reason, remediation}`
**So that** I see all blockers in one place, not via 10 separate skills.

Deliverable: `scripts/warpos/preflight.js` (new) exporting
`runPreflight(opts) → {ok, gates, report}`; called from `update.js#run()`
before classify in BOTH dry-run and apply paths.

Acceptance criteria: AC-S-2.1, AC-S-2.2, AC-S-2.3.

Linked: `H-1`, `R-1`, `R-5`..`R-11` (composes existing), `R-12`.
COPY: C-1, C-2, C-3, C-4, C-5.
INPUTS: IN-1.
TRACE: TR-1.

## S-3 — NEW gate skill `check:warpos-capsule-resolvable`

**As** the operator
**I want** the preflight to refuse if the capsule for `--to <v>` cannot be
found anywhere — and to print exact `--source <path>` fix
**So that** I never see `Capsule X.Y.Z missing release.json at <path>`
with no actionable next step (cited as the precipitating cause of this
sprint — see failure-mining.md F-1).

Deliverable: `.claude/commands/check/warpos-capsule-resolvable.md` +
`scripts/warpos/checks/capsule-resolvable.js`.

Acceptance criteria: AC-S-3.1, AC-S-3.2, AC-S-3.3.

Linked: `H-1`, `R-3`.
COPY: C-2.
INPUTS: IN-4.
TRACE: TR-1.

## S-4 — NEW gate skill `check:warpos-version-quorum` + NEW `check:warpos-install-baseline` + NEW `check:warpos-migration-presence`

**As** the operator
**I want** preflight to catch version-source drift (`version.json` vs
`framework-manifest.json` vs `framework-installed.json` vs script header),
to refuse update when `framework-installed.json` is missing, and to refuse
when capsule lists migration files that don't exist in source
**So that** the three failure modes F-3, F-4, F-5 mined in
failure-mining.md are caught at preflight not by hand after the fact.

Deliverable:
- `.claude/commands/check/warpos-version-quorum.md` + script
- `.claude/commands/check/warpos-install-baseline.md` + script
- `.claude/commands/check/warpos-migration-presence.md` + script

Acceptance criteria: AC-S-4.1, AC-S-4.2, AC-S-4.3.

Linked: `H-1`, `R-2`, `R-4`, `R-10`.
COPY: C-1, C-3, C-4.
INPUTS: IN-4.
TRACE: TR-1.

## S-5 — Transaction wrapper: pre-apply snapshot + tx record

**As** the operator
**I want** before any write in apply, the transaction directory at
`<targetRoot>/.warpos/transactions/<txId>/` to record a manifest of every
file that WILL be touched (with pre-state hash and `existed_pre_apply`
flag), so that rollback knows exactly what to restore
**So that** rollback is deterministic — no "we think these were the
touched files" guesswork.

Deliverable: `scripts/warpos/transaction.js` (extracted from update.js
inline transaction helpers); update.js calls `transaction.begin()` before
the apply loop.

Acceptance criteria: AC-S-5.1, AC-S-5.2.

Linked: `H-2`, `R-13`, `R-14`, `R-17`.
COPY: C-6.
INPUTS: IN-2.
TRACE: TR-2.

## S-6 — Atomic commit-or-rollback during apply

**As** the operator
**I want** apply wrapped in try/catch — any thrown error during copy /
delete / migration calls `rollbackTransaction(txDir, targetRoot)` which
restores every backed-up file and unlinks every ADD_SAFE write that
completed before the error, writes `result.json` with
`outcome:"rolled-back"`, and exits non-zero
**So that** I either have the new version fully installed OR the old
version fully restored — never half-half.

Deliverable: `scripts/warpos/transaction.js#rollbackTransaction()` +
update.js apply-loop try/catch wiring.

Acceptance criteria: AC-S-6.1, AC-S-6.2, AC-S-6.3.

Linked: `H-2`, `R-15`, `R-16`, `R-18`.
COPY: C-6, C-7.
INPUTS: IN-2.
TRACE: TR-3.

## S-7 — `scripts/warpos/postflight.js` composes 5 checks + evidence package

**As** the operator
**I want** after a successful apply, postflight to run manifest-honesty +
path-resolution + applied-migrations + provider-smoke-when-available +
`/warp:health` rollup, and write an evidence package at
`<txDir>/evidence/postflight.json`
**So that** I see proof the install is healthy, not just a "Update
applied" log line.

Deliverable: `scripts/warpos/postflight.js` exporting
`runPostflight(targetRoot, capsule, opts) → {ok, checks, evidencePath}`.

Acceptance criteria: AC-S-7.1, AC-S-7.2, AC-S-7.3.

Linked: `H-3`, `R-19`, `R-20`, `R-21`.
COPY: C-8, C-9.
INPUTS: IN-3.
TRACE: TR-4.

## S-8 — Postflight integrates `provider-smoke` (SP-002) as external check

**As** Alex coordinating with SP-002
**I want** the postflight composer to call `provider-smoke` if available
on `paths` (e.g. `paths.providerSmokeSkill` resolves) and record
`status:degraded reason:"provider-smoke skill not yet shipped"` otherwise
**So that** SP-005 and SP-002 are decoupled — SP-005 ships first if
needed, SP-002 plugs in seamlessly when it lands.

Deliverable: `postflight.js` external-check primitive; no inlined
provider-health logic.

Acceptance criteria: AC-S-8.1, AC-S-8.2.

Linked: `H-3`, `R-20(d)`.
COPY: C-9.
INPUTS: IN-5.
TRACE: TR-4, TR-5.

## S-9 — Cross-version replay test bench (smoke)

**As** Alex and as QA
**I want** a test harness at `scripts/warpos/test-cross-version-replay.js`
that runs `update.js --to <v>` from a synthetic clean install fixture for
0.1.2 → 0.5.0 chain (one direct hop), asserts preflight green / commit /
postflight green
**So that** we have one automated test that proves the composed flow
works end-to-end across a non-trivial version gap. (Full multi-hop matrix
deferred to expanded scope per Plan Contract.)

Deliverable: `scripts/warpos/test-cross-version-replay.js` + a
synthetic-fixture builder under `runtime/qa-warp-update/`.

Acceptance criteria: AC-S-9.1, AC-S-9.2.

Linked: `H-4`, `R-29`.
COPY: —.
INPUTS: —.
TRACE: TR-6 (test execution).

## S-10 — `/warp:update.md` procedure update + troubleshooting

**As** the operator
**I want** the `/warp:update` skill body to document the new preflight +
transaction + postflight phases, list every gate (existing + 3 NEW), the
override flags (`--allow-stale`, `--force-fresh`, `--strict-postflight`,
`--rollback`), and a troubleshooting section keyed to failure-mining.md
signatures (including F-9 HTML-entity-encoded commands)
**So that** when an operator hits one of these failure modes, they have a
docs entry to read — instead of needing the engine to also be a doctor.

Deliverable: `.claude/commands/warp/update.md` updated body.

Acceptance criteria: AC-S-10.1, AC-S-10.2.

Linked: `H-1`, `H-2`, `H-3`, `H-4`, `R-23`, `R-25`.
COPY: C-1..C-10.
INPUTS: IN-1..IN-5.
TRACE: TR-1..TR-6.

## S-11 — Failure event schema + emission

**As** Alex (learning loop) and operator (debug)
**I want** all 6 TRACE events (TR-1..TR-6) emit to `paths.eventsFile` via
`logger.js` with the shape specified in INPUT IN-1 — including category
`warpos.update.<phase>`, transactionId, gate name, status, reason
**So that** `/learn:deep`, `/issues:scan`, and `/check:patterns` can
surface recurring failures and propose hooks.

Deliverable: emit wiring in `preflight.js`, `transaction.js`,
`postflight.js` + a shared `lib/update-events.js` emitter.

Acceptance criteria: AC-S-11.1, AC-S-11.2.

Linked: `H-4`, `R-22`.
COPY: —.
INPUTS: IN-1.
TRACE: TR-1..TR-6.
