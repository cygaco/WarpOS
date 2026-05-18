# COPY Requirements — Sprint Goal Verification

**Sprint:** `SP-20260518-007`
**PRD:** `prd.md`

> Sprint A is infrastructure — no end-user UI surface. COPY here covers operator-facing CLI strings (warnings, errors, prompts) and skill-body wording. Strings are stable contract; tests assert on them.

## C-1 — `/sprint:design` refusal message (linked story `S-2.2`)

**Context:** Emitted by `scripts/sprint/design.js` when the fixture gate refuses to advance.
**Text:**

> sprint:design refused — sprint <SP-id> has `goal_verification.reproduction = executable` but the following ACs lack `verified_by:` linkage:
>   - <AC-id> (story <S-id>)
>   - ...
> Add `verified_by: <test-file>::<test-name>` (or `verified_by: not_applicable — <justification>`) to each AC, then re-run /sprint:design. No state was changed.

**Notes:** Must list each missing AC explicitly; do NOT collapse to a count. Exit code = 1. Error goes to stderr.

## C-2 — `/sprint:design` advance allowed (not_applicable path) (linked story `S-2.2`)

**Context:** Emitted by `scripts/sprint/design.js` when `not_applicable` is honored.
**Text:**

> sprint:design — goal_verification.reproduction = not_applicable; justification accepted: "<first 80 chars of justification>". Skipping fixture gate. Advancing sprint <SP-id> to designed.

**Notes:** Truncate the justification at 80 chars in the log message; the full text remains in the Plan Contract. No warning emoji; this is a legitimate path.

## C-3 — `/sprint:release` cited-test runner header (linked story `S-2.3`)

**Context:** Emitted by `scripts/sprint/release.js check` before running cited tests.
**Text:**

> release:check — cited-test executor running <N> tests for sprint <SP-id>...

**Notes:** N is the cited-test count. Single line.

## C-4 — `/sprint:release` per-test status line (linked story `S-2.3`)

**Context:** Per-test line emitted during the cited-test run.
**Text:**

> [<status>] <test-file>::<test-name>  (<elapsed>ms)

**Notes:** `<status>` is exactly one of `pass`, `fail`, or `inconclusive` (lowercase, fixed-width 12 chars for column alignment). `<elapsed>` is integer ms.

## C-5 — `/sprint:release` inconclusive override hint (linked story `S-2.3`)

**Context:** Emitted after an `inconclusive` test result blocks the gate.
**Text:**

> One or more cited tests returned unparseable output (inconclusive). To proceed, record an operator override in `paths.decisionLedger` with a one-line reason, then re-run release:check. There is no --allow-coverage-gap flag in v1 — the override IS the audit trail.

**Notes:** Explicitly names the no-flag policy so operators don't grep for one.

## C-6 — `/check:ac-coverage` summary line (linked story `S-3.1`)

**Context:** Final line of the prose report.
**Text:**

> ac-coverage — sprint <SP-id>: <executable> executable, <not_applicable> not_applicable, <missing> missing  (total: <N>)

**Notes:** Single line summary. Exit code 0 iff `missing == 0`.

## C-7 — `/linters:run` discovery line for sprint test (linked story `S-4.1`)

**Context:** `node scripts/linters/run.js --list` output.
**Text:**

> sprint-test-plan-honors-registry  →  node scripts/sprint/test-plan-honors-registry-primary.js

**Notes:** Name uses the `sprint-test-` prefix so it sorts adjacent to other `lint-*` entries; the helper script extension matches the new discovery rule (`scripts/sprint/test-*.js`).
