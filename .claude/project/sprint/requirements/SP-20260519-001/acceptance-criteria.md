# Acceptance Criteria — ROADMAP + RELEASES ledger discipline

**Sprint:** `SP-20260519-001`
**PRD:** `prd.md`

> Each AC is a testable statement. The Plan Contract does NOT carry a `goal_verification` block, so `verified_by:` linkage is not enforced by `/sprint:design`; ACs cite a verification approach in prose. (Adding `goal_verification` in a follow-up sprint is open.)

## S-1 — Define ROADMAP.md "Sprints" section markdown format

- **AC-1.1**: Given the `prd.md#R-1` column set, when a reader inspects `ROADMAP.md`, then the "Sprints" section appears ABOVE the existing Phase backlog with columns `[Sprint | Title | Status | Started | Closed | Release]` and rows sorted reverse chronologically by sprint id.
  *Verification: visual inspection + grep `^| SP-` count matches `active-sprints.yaml#sprints[]` length after backfill.*
- **AC-1.2**: Given the status enum from `R-1`, when a writer inserts a row, then the Status column carries one of `{planning, designing, executing, releasing, closed, retrospected, abandoned}`.
  *Verification: unit test in `tests/regression/SP-20260519-001/ledger-format.test.js` validating ledger.js write + read round-trip rejects unknown statuses.*

## S-2 — Create RELEASES.md with two-section structure

- **AC-2.1**: Given the file did not exist before this sprint, when the sprint exits, then `RELEASES.md` exists at repo root with H1 `# WarpOS Releases`, H2 `## Versions`, and H2 `## Sprints`. Each section has its column header row + a separator row before any data rows.
  *Verification: `tests/regression/SP-20260519-001/releases-md-shape.test.js` parses the file and asserts both sections present.*
- **AC-2.2**: Given the Versions section column set from `R-1`, when a reader inspects it, then columns are `[Version | Released | Capsule | Summary]`. Given the Sprints section column set, then columns are `[Release | Sprint | Status | Target | Deployed | Notes]`.
  *Verification: same test as AC-2.1 asserts column header strings.*

## S-3 — Codify what-counts-as-release policy in sprint-workflow.md

- **AC-3.1**: Given `paths.sprintReference` resolves to `.claude/project/reference/sprint-workflow.md`, when a reader greps for "Ledger discipline", then a section is present that quotes the RT-011 two-tier MUST / MAY / MUST NOT table verbatim AND includes the boundary condition string "an event qualifies iff it produced a durable artifact under `framework/releases/X.Y.Z/` OR `.claude/project/sprint/releases/RL-*`".
  *Verification: `grep -q "Ledger discipline" + grep -q "qualifies iff it produced a durable artifact"` in CI smoke.*

## S-4 — Build scripts/sprint/ledger.js shared writer module

- **AC-4.1**: Given the module exists at `scripts/sprint/ledger.js`, when a caller imports `{ appendSprintRow, updateSprintRow, appendVersionRow, appendReleaseRow }`, then all four functions are defined and each returns `{ written: true, file: <abs-path>, row: <obj> }` on success and `{ written: false, reason: <string> }` on idempotent-skip OR fail-open error.
  *Verification: `tests/regression/SP-20260519-001/ledger-shape.test.js` calls each function and asserts the return shape.*
- **AC-4.2**: Given an existing row for `SP-20260519-001` in `ROADMAP.md`, when `appendSprintRow({id: 'SP-20260519-001', ...})` is called again, then the existing row is left untouched (no duplicate) AND the return is `{ written: false, reason: 'already-present' }`.
  *Verification: same test file — idempotency round-trip.*
- **AC-4.3**: Given the ledger write fails mid-write (simulated by `fs.writeFileSync` throwing), when the caller is invoked, then the error is caught, `process.stderr` carries `[ledger] failed: <msg>`, AND the caller returns `{ written: false, reason: 'fail-open: <msg>' }` without re-throwing.
  *Verification: same test file — fail-open contract using a stub.*

## S-5 — Wire plan.js + add-sprint.js to append sprint row

- **AC-5.1**: Given `node scripts/sprint/plan.js --payload <p> --sprint SP-YYYYMMDD-NNN` runs to completion, when the ledger is inspected, then a row exists for the sprint at status `planning` with the timestamp matching the plan contract's `created_at`.
  *Verification: `tests/regression/SP-20260519-001/plan-writes-ledger.test.js` runs plan.js in a tempdir, inspects ROADMAP.md.*
- **AC-5.2**: Given `node scripts/sprint/add-sprint.js --id SP-Y --title T` runs, when the ledger is inspected, then a row exists for `SP-Y` at status `planning`.
  *Verification: same test file, parallel case.*

## S-6 — Wire retrospective.js to update sprint row status

- **AC-6.1**: Given a sprint row exists at status `closed`, when `node scripts/sprint/retrospective.js --sprint <id>` runs to completion, then the row Status transitions to `retrospected` AND the Closed column carries an ISO timestamp.
  *Verification: `tests/regression/SP-20260519-001/retro-updates-ledger.test.js`.*

## S-7 — Wire release.js to append RL-* row to RELEASES.md Sprints

- **AC-7.1**: Given a fresh sprint with no `RL-*`, when `node scripts/sprint/release.js cmdPrepare --sprint <id>` runs, then a row appears in `RELEASES.md#sprints` for the new `RL-*` at status `prepared`.
  *Verification: `tests/regression/SP-20260519-001/release-writes-ledger.test.js`.*
- **AC-7.2**: Given a `prepared` row, when `cmdDeploy` is later run, then the same row transitions to status `deployed` AND the Deployed column carries the deploy timestamp.
  *Verification: same test file, deploy transition.*

## S-8 — Wire /warp:release driver to append version row

- **AC-8.1**: Given the `/warp:release` driver (path TBD by execution-time grep — likely `scripts/warpos/release-canonical.js`) bumps `version.json` from X.Y.Z → X.Y.(Z+1), when a reader inspects `RELEASES.md#versions`, then a row exists for X.Y.(Z+1) with capsule link `framework/releases/X.Y.(Z+1)/release.json` and a non-empty Summary column.
  *Verification: `tests/regression/SP-20260519-001/warp-release-writes-ledger.test.js` (run with a stub bump).*
- **AC-8.2**: Given the Summary column, when a downstream consumer reads it in isolation (without the Sprints section), then it is human-readable and does NOT reference engineering-internal artifact ids like `SP-` or `T-` (high-level prose only).
  *Verification: linter rule in the same test file — reject Summary cells containing `SP-` or `T-` or `RL-`.*

## S-9 — Build scripts/sprint/backfill-ledgers.js

- **AC-9.1**: Given the script is invoked with no `--apply` flag, when it runs, then it prints every row it WOULD write to stdout, never modifies disk, and exits 0.
  *Verification: `tests/regression/SP-20260519-001/backfill-dry-run.test.js`.*
- **AC-9.2**: Given the script runs with `--apply`, when it finishes, then `ROADMAP.md#sprints` carries one row per entry in `active-sprints.yaml#sprints[]` AND `RELEASES.md#sprints` carries one row per `releases/RL-*.yaml` at status deployed/prepared AND `RELEASES.md#versions` carries one row per `version.json#previousVersions[]` plus the current `version.json#version`.
  *Verification: row-count assertions in `tests/regression/SP-20260519-001/backfill-apply.test.js`.*
- **AC-9.3**: Given the ledgers are already populated, when `--apply` is re-run, then row counts are unchanged AND stdout reports `0 inserted, N already present`.
  *Verification: idempotency case in same test file.*

## S-10 — Add ledger-presence-guard hook (warn-only)

- **AC-10.1**: Given the hook is registered as PreToolUse Bash matcher, when `/sprint:plan` invokes `node scripts/sprint/plan.js ...` and the caller forgot to wire `ledger.appendSprintRow`, then the hook emits a stderr warn `[ledger-presence-guard] warn: ROADMAP.md missing row for SP-<id> after /sprint:plan` AND does NOT block.
  *Verification: `tests/regression/SP-20260519-001/ledger-guard-warn.test.js` with a synthetic payload.*
- **AC-10.2**: Given the policy file `policies/ledger-presence.json` sets `enforcement.mode = warn` and `soft_rollout_until = 2026-06-02`, when the hook runs before that date, then it is warn-only regardless of detection result.
  *Verification: same test file — clock-stubbed run before/after the date.*

## S-11 — Update skill bodies to reference ledger contract

- **AC-11.1**: Given the four skill files (`/sprint:plan`, `/sprint:release`, `/sprint:retrospective`, `/warp:release`), when a reader greps each file, then each carries the literal string `paths.sprintReference#ledger-discipline` in a one-line reference (e.g. "Writes a ROADMAP/RELEASES row via `scripts/sprint/ledger.js` — see `paths.sprintReference#ledger-discipline`.").
  *Verification: `tests/regression/SP-20260519-001/skill-bodies-reference-ledger.test.js` greps the four files.*

## S-12 — Execute the backfill once writers are stable

- **AC-12.1**: Given T-1..T-10 are merged AND one round-trip smoke-validates (a new throwaway sprint creation appends to ROADMAP.md, a sham release appends to RELEASES.md), when `node scripts/sprint/backfill-ledgers.js --apply` is executed against this repo, then both ledgers are populated AND the next `node scripts/sprint/backfill-ledgers.js` (no flag) reports 0 missing rows.
  *Verification: manual operator step at end-of-sprint; recorded in `release-plan.md` ship-gate.*
