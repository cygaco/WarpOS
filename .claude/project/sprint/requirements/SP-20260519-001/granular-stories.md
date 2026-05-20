# Granular Stories — ROADMAP + RELEASES ledger discipline

**Sprint:** `SP-20260519-001`
**High-level stories:** `high-level-stories.md`

> `S-N` ids per `scripts/hooks/requirement-format-guard.js`. Each granular story produces one ticket during `/sprint:design`.

## S-1 — Define ROADMAP.md "Sprints" section markdown format

**As** a writer-script author
**I want** a frozen markdown structure for the `ROADMAP.md` Sprints section (column set, sort order, status enum, link format)
**So that** the shared `ledger.js` writer can parse + append + update rows without ambiguity, and downstream readers can parse it too.

Acceptance: see `AC-1.1`, `AC-1.2`.
Linked: `H-1`, `R-1`. COPY: `C-1`. INPUTS: `IN-1`. TRACE: `TR-1`.

## S-2 — Create RELEASES.md with two-section structure

**As** a future reader (Alex or consumer)
**I want** `RELEASES.md` created at repo root with two sections — "Versions" and "Sprints" — each with its own frozen column set
**So that** the Versions section reads cleanly in isolation for consumers AND the Sprints section is parseable engineering inventory.

Acceptance: see `AC-2.1`, `AC-2.2`.
Linked: `H-2`, `H-3`, `R-1`. COPY: `C-2`, `C-3`. INPUTS: `IN-2`. TRACE: `TR-2`.

## S-3 — Codify what-counts-as-release policy in sprint-workflow.md

**As** the next operator of `/sprint:release` or `/warp:release`
**I want** the RT-011 two-tier MUST / MAY / MUST NOT policy referenced verbatim in `paths.sprintReference` (`sprint-workflow.md`) under a named "Ledger discipline" section
**So that** future authors of release-class scripts can grep for the policy and know exactly which events qualify.

Acceptance: see `AC-3.1`.
Linked: `H-3`, `R-3`. COPY: `C-4`. INPUTS: `IN-3`. TRACE: `TR-3`.

## S-4 — Build scripts/sprint/ledger.js shared writer module

**As** every release-class skill (`plan`, `add-sprint`, `retrospective`, `release`, `release-canonical`)
**I want** a single shared module exporting `appendSprintRow`, `updateSprintRow`, `appendVersionRow`, `appendReleaseRow` that handles parsing + idempotent write + atomic file replace
**So that** every caller goes through the same path and the format spec from S-1/S-2 is enforced by one piece of code instead of N.

Acceptance: see `AC-4.1`, `AC-4.2`, `AC-4.3`.
Linked: `H-4`, `R-2`. COPY: `C-5`. INPUTS: `IN-4`. TRACE: `TR-4`.

## S-5 — Wire plan.js + add-sprint.js to append sprint row

**As** `/sprint:plan` (and standalone `add-sprint.js`)
**I want** to call `ledger.appendSprintRow({id, title, status: 'planning', startedAt})` after writing the plan contract
**So that** every newly-created sprint is recorded in `ROADMAP.md` Sprints at creation time, not after retrospect.

Acceptance: see `AC-5.1`, `AC-5.2`.
Linked: `H-1`, `H-4`, `R-2`. COPY: `C-6`. INPUTS: `IN-5`. TRACE: `TR-5`.

## S-6 — Wire retrospective.js to update sprint row status

**As** `/sprint:retrospective`
**I want** to call `ledger.updateSprintRow({id, status: 'retrospected', closedAt})` after writing the retro YAML
**So that** the `ROADMAP.md` Sprints row transitions from `releasing|closed` to `retrospected` automatically.

Acceptance: see `AC-6.1`.
Linked: `H-1`, `H-4`, `R-2`. COPY: `C-7`. INPUTS: `IN-6`. TRACE: `TR-6`.

## S-7 — Wire release.js to append RL-* row to RELEASES.md Sprints

**As** `/sprint:release` `cmdPrepare` and `cmdDeploy`
**I want** to call `ledger.appendReleaseRow({id, sprint, status, target, deployedAt, changelogPath})` after the release artifact is written / deployed
**So that** every `RL-*` at status=prepared OR =deployed shows up in `RELEASES.md` Sprints with the right status enum.

Acceptance: see `AC-7.1`, `AC-7.2`.
Linked: `H-3`, `H-4`, `R-2`. COPY: `C-8`. INPUTS: `IN-7`. TRACE: `TR-7`.

## S-8 — Wire /warp:release driver to append version row

**As** the script driving `/warp:release` (verify path during execution — likely `scripts/warpos/release-canonical.js` but grep first per Plan Contract unsafe-assumption)
**I want** to call `ledger.appendVersionRow({version, releasedAt, summary, capsulePath})` after the capsule is built
**So that** every `version.json` bump shows up in `RELEASES.md` Versions with a 1-2-sentence consumer-readable summary.

Acceptance: see `AC-8.1`, `AC-8.2`.
Linked: `H-2`, `H-4`, `R-2`. COPY: `C-9`. INPUTS: `IN-8`. TRACE: `TR-8`.

## S-9 — Build scripts/sprint/backfill-ledgers.js

**As** the operator running this sprint
**I want** a one-shot `node scripts/sprint/backfill-ledgers.js` that reads `active-sprints.yaml` + every `releases/RL-*.yaml` + `version.json#previousVersions` and emits the ledger rows that SHOULD exist
**So that** the ledgers are useful day-one with the ~14 historical sprints + ~21 historical RL-* + 21 historical version bumps already populated. Dry-run default; `--apply` writes; re-running is idempotent.

Acceptance: see `AC-9.1`, `AC-9.2`, `AC-9.3`.
Linked: `H-1`, `H-2`, `H-3`, `R-4`. COPY: `C-10`. INPUTS: `IN-9`. TRACE: `TR-9`.

## S-10 — Add ledger-presence-guard hook (warn-only)

**As** the operator running `/sprint:plan` / `/sprint:release` / `/sprint:retrospective` / `/warp:release`
**I want** a PreToolUse warn-mode hook that detects when the corresponding sprint command ran but the ledger row was not added/updated within the same session
**So that** convention drift surfaces immediately as a warn instead of silently after weeks.

Acceptance: see `AC-10.1`, `AC-10.2`.
Linked: `H-4`, `R-5`. COPY: `C-11`. INPUTS: `IN-10`. TRACE: `TR-10`.

## S-11 — Update skill bodies to reference ledger contract

**As** Alex reading the `/sprint:plan` or `/sprint:release` skill body
**I want** a one-line reference to the ledger contract pointing at `paths.sprintReference#ledger-discipline`
**So that** the next operator (Alex or human) sees the contract at the source they're actually reading, not just in the reference doc they may skip.

Acceptance: see `AC-11.1`.
Linked: `H-1`, `H-2`, `H-3`, `H-4`, `R-7`. COPY: `C-12`. INPUTS: `IN-11`. TRACE: `TR-11`.

## S-12 — Execute the backfill once writers are stable

**As** the sprint operator
**I want** to run `node scripts/sprint/backfill-ledgers.js --apply` once T-1..T-10 are merged and smoke-validated against one round-trip (new sprint creation → ROADMAP entry → release → RELEASES entry)
**So that** the historical entries land in the ledgers in the same shape the writers will emit going forward.

Acceptance: see `AC-12.1`.
Linked: `H-1`, `H-2`, `H-3`, `R-4`. COPY: see backfill output. INPUTS: same as `IN-9`. TRACE: `TR-12`.
