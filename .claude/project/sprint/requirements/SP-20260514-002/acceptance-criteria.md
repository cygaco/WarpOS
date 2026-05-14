# Acceptance Criteria — Enforce sprint routing policy

**Sprint:** `SP-20260514-002`
**PRD:** `prd.md`

Each AC is testable. Link from the granular story + the ticket that implements it.

## S-1 — `routing.js record` (Ticket T-A)

- **AC-1.1** Given a valid `--phase planning --artifact PC-X --sprint SP-Y --model claude:claude-opus-4-7`, when `record` runs, then a JSONL row matching schema `warpos/sprint/routing-trace/v1` is appended to `paths.sprintDecisions/routing-trace.jsonl` and exit is 0.
- **AC-1.2** Given `--phase planning --model openai:gpt-3.5` (model NOT declared in `strongest_reasoning` class), when `record` runs, then exit is 1 and stderr matches COPY C-2.
- **AC-1.3** Given a phase requiring `diff_review` and only one vendor configured (no `--diff-reviewer`, `--evidence single_vendor_session`, `--decision-ref ledger:DL-N`), when `record` runs, then row carries `evidence: single_vendor_session` and a row is appended to `paths.decisionLedger`; exit 0.
- **AC-1.4** Given `--phase X --artifact A --sprint S --model M` repeated twice, when both run, then two rows exist (record is append-only, never deduplicated).

## S-2 — `routing.js check` (Ticket T-A)

- **AC-2.1** Given a row exists for `(phase, artifact, sprint)`, when `check` runs with matching args, then exit is 0 (no stdout unless `--verbose`).
- **AC-2.2** Given no row exists for `(phase, artifact, sprint)`, when `check` runs, then exit is 1 and stderr matches COPY C-4.

## S-3 — `routing.js coverage` (Ticket T-A)

- **AC-3.1** Given a sprint with traces for all required phases, when `coverage --sprint X` runs, then stdout matches COPY C-5 template and exit is 0.
- **AC-3.2** Given a sprint missing `execution` trace but having `planning`, `design`, `release` traces, when `coverage` runs, then `missing: execution` appears in stdout and exit is non-zero.
- **AC-3.3** Given `--format json`, when `coverage` runs, then stdout is valid JSON matching shape `{ sprint, covered: [...], missing: [...], optional_missing: [...], ok: boolean }`.

## S-4 — Trace schema (Ticket T-A)

- **AC-4.1** Schema file at `schemas/sprint/routing-trace.schema.json` declares `$id: warpos/sprint/routing-trace/v1` and required fields `[schema, sprint_id, phase, artifact_id, model, recorded_at, recorded_by, evidence]`.
- **AC-4.2** `routing.js record` rejects payloads missing any required field with exit 1.

## S-5 — plan.js wiring (Ticket T-B)

- **AC-5.1** After `plan.js` writes a Plan Contract (PC-N), a row with `phase: planning, artifact_id: PC-N` exists in routing-trace.jsonl.
- **AC-5.2** plan.js exits 0 even when `record` exits with `single_vendor_session` (single-vendor users not blocked).

## S-6 — design.js wiring (Ticket T-B)

- **AC-6.1** After `design.js` writes the requirements bundle, a row with `phase: design, artifact_id: SP-N#design` exists in routing-trace.jsonl.

## S-7 — execute.js wiring (Ticket T-B)

- **AC-7.1** After `execute.js` finalizes a ticket (status → done), a row with `phase: execution, artifact_id: T-N` exists.
- **AC-7.2** After each gauntlet pass (QA, Redteam), rows with `phase: qa, artifact_id: T-N` and `phase: redteam, artifact_id: T-N` exist.

## S-8 — release.js gate (Ticket T-B)

- **AC-8.1** When `release.js` runs against a sprint missing any required phase trace, it exits non-zero with COPY C-10 (unless `--allow-routing-gap`).
- **AC-8.2** When `--allow-routing-gap` is passed, release proceeds and writes a row to `paths.decisionLedger` recording the override.

## S-9 — retrospective.js wiring (Ticket T-B)

- **AC-9.1** After `retrospective.js` writes retro.yaml, a row with `phase: retrospective, artifact_id: retro:SP-N` exists.

## S-10 — `sprint-routing-guard.js` hook (Ticket T-C)

- **AC-10.1** When `Edit|Write` targets a Plan Contract YAML for an active sprint and no trace exists with `enforcement.mode=warn`, hook exits 0 and emits TR-3 (warn).
- **AC-10.2** Same setup with `enforcement.mode=block`, hook exits 2 (PreToolUse block) and emits TR-4.
- **AC-10.3** When the targeted sprint has status `closed` or `retrospected`, hook exits 0 with TR-3 NOT emitted (C-8 only in WARPOS_DEBUG).
- **AC-10.4** When `paths.sprintRouting` is missing, hook exits 0 (fail-open) and emits C-9 in debug only.

## S-11 — settings.json registration (Ticket T-C)

- **AC-11.1** `.claude/settings.json` PreToolUse Edit|Write entries include `scripts/hooks/sprint-routing-guard.js` and the entry sits between `memory-guard.js` and `step-registry-guard.js`. `/warp:health` Section 3 reports no schema violations.

## S-12 — sprint-routing.json#enforcement (Ticket T-C)

- **AC-12.1** Adding `enforcement` block to sprint-routing.json passes `routing.js validate` (exit 0).
- **AC-12.2** `routing.js validate` exits 1 if `mode` is not in `{warn, block}`.

## S-13 — Skill body updates (Ticket T-D)

- **AC-13.1** Each of `plan.md`, `design.md`, `execute.md`, `release.md`, `retrospective.md` contains a `## Routing enforcement` section that (a) names the `routing.js record` call made by the skill, (b) names the gate (if any), (c) references `paths.sprintRouting`, and (d) describes the soft-rollout default.

## S-14 — End-to-end smoke (Ticket T-E)

- **AC-14.1** This very sprint (SP-20260514-002) has trace rows for `planning`, `design`, `execution` (one per ticket), `qa`, `redteam`, `release` before release.
- **AC-14.2** `routing.js coverage --sprint SP-20260514-002` exits 0 prior to the release commit.
