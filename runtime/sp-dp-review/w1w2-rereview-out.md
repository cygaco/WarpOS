# E-DISPATCH-PERFECT-001 W1+W2 Re-review

VERDICT: FAIL

Scope reviewed:
- `scripts/dispatch-review.js`
- `scripts/checks/security-pass-count.js`
- `scripts/dispatch-review.test.js`
- `scripts/checks/security-pass-count.test.js`

Verification commands run:
- `node scripts/dispatch-review.test.js` -> `OK [dispatch-review.test] 8 passed`
- `node scripts/checks/security-pass-count.test.js` -> `OK [security-pass-count.test] 13 passed`
- Targeted merge probe for an alive `ok:true` lane with `verdict:"error"` -> merged result was `ok:true`, `mergedVerdict:"pass"`, `verdict:"pass"`

## Findings

### 1. HIGH-1: FAIL/dead lane can no longer read as ok

Status: CLOSED for the stated FAIL/dead-lane cases.

Evidence:
- `scripts/dispatch-review.js:125` exits with `process.exit(merged.ok ? 0 : 1)`.
- `scripts/dispatch-review.js:133-148` emits top-level `verdict` and `parsed.verdict`.
- `scripts/dispatch-review.js:134-137` makes explicit `fail` and dead-lane outcomes drive `mergedVerdict` to `fail` or `error`, with `ok:false`.
- `scripts/dispatch-review.test.js:41-47` covers an alive FAIL lane and asserts `ok:false`, `mergedVerdict:"fail"`, and `parsed.verdict:"fail"`.
- `scripts/dispatch-review.test.js:49-53` covers a dead lane and asserts `ok:false`, `mergedVerdict:"error"`.

Residual risk:
- HIGH-1's FAIL/dead-lane path is closed, but the same merge code still has the HIGH-2 `error` verdict false-green described below.

### 2. HIGH-2: alive lane with no parseable verdict fails closed

Status: OPEN end-to-end.

What is fixed:
- `scripts/dispatch-review.js:78-90` makes `verdictOf()` return `"error"` for an alive result with no parseable verdict.
- `scripts/dispatch-review.test.js:25-26` directly covers `verdictOf({ ok:true, output:"looks fine..." }) === "error"`.

Blocking issue:
- `mergeLanes()` does not treat `lane.verdict === "error"` as a failing/error condition unless the lane is also `ok:false`.
- At `scripts/dispatch-review.js:134-136`, `mergedVerdict` only checks `verdict === "fail"`, then `!ok`, then `warn`, otherwise defaults to `pass`.
- Therefore the actual dispatch path can still false-green an alive but unparseable lane:

```json
{
  "ok": true,
  "mergedVerdict": "pass",
  "verdict": "pass",
  "lanes": [
    { "provider": "gemini", "ok": true, "verdict": "error" },
    { "provider": "openai", "ok": true, "verdict": "pass" },
    { "provider": "claude", "ok": true, "verdict": "pass" }
  ]
}
```

Impact:
- This is a HIGH correctness / false-green issue because the intended fail-closed `"error"` from `verdictOf()` is converted into a clean merged `pass`.
- The checked-in tests miss this because they test `verdictOf()` in isolation but do not test `mergeLanes()` with an alive `ok:true`, `verdict:"error"` lane.

Expected fix:
- `mergeLanes()` should treat any lane verdict outside clean outcomes as non-clean, e.g. `anyError = lanes.some((l) => l.verdict === "error" || !l.ok)`, and make `mergedVerdict:"error"` / `ok:false`.
- Add a regression test for `mergeLanes("security-reviewer", [{ ok:true, verdict:"error" }, ...])`.

### 3. HIGH-3: 2-provider config chain is hard-flagged

Status: CLOSED.

Evidence:
- `scripts/checks/security-pass-count.js:44-52` hard-flags `passes.length < 3`, explicitly naming the full 3-provider invariant.
- `scripts/checks/security-pass-count.test.js:94-100` covers a 2-provider chain and expects a hard finding.
- Targeted probe returned the expected hard finding for a 2-provider `gemini/openai` chain.

### 4. HIGH-4: runtime grouping and under-fire counting

Status: CLOSED for the requested behavior.

Evidence:
- `scripts/checks/security-pass-count.js:85` groups by `prompt_digest || run_id || sprint_id`, with `prompt_digest` preferred.
- `scripts/checks/security-pass-count.js:87-90` counts total records per group and counts only `ok:true` providers toward successful provider coverage.
- `scripts/checks/security-pass-count.js:96-100` flags groups with `total >= 2` and fewer than `expectedCount` ok providers, catching 2/3 and recorded 1/3 cases.
- `scripts/checks/security-pass-count.test.js:101-108` covers 1/3 with two dead lane records.
- `scripts/checks/security-pass-count.test.js:109-119` covers the run_id-collapse case by using two prompt digests under one run id.
- `scripts/checks/security-pass-count.test.js:82-84` confirms a lone single-record group is not flagged.

Residual risk:
- A review that truly writes only one record total remains intentionally unflagged, matching the requested "lone single-record group is not flagged" behavior.

## New correctness / false-green issues

NEW HIGH / still-blocking false-green:
- `mergeLanes()` converts an alive lane with `verdict:"error"` into a clean merged `pass`. This makes the HIGH-2 fix incomplete in the real dispatch envelope even though `verdictOf()` itself now returns `"error"`.

No additional HIGH issues found in `security-pass-count.js` for the requested W1+W2 behaviors.
