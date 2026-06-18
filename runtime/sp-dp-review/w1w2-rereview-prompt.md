# Re-review — E-DISPATCH-PERFECT-001 W1+W2 (confirm the 4 HIGH fixes)

A prior cross-provider review FAILed with 4 HIGH false-greens. They were fixed. VERIFY each is closed in the CURRENT files, and check whether the fixes introduced any NEW correctness/false-green issue.

Read: `scripts/dispatch-review.js`, `scripts/checks/security-pass-count.js`, and their tests `scripts/dispatch-review.test.js` + `scripts/checks/security-pass-count.test.js`.

The 4 fixes to confirm:
1. HIGH-1: `dispatch-review.js` — `mergeLanes()` sets `ok` = BINDING outcome (clean only if every lane alive AND mergedVerdict ∈ pass/warn); a FAIL/dead lane → ok:false; output carries top-level `verdict` + `parsed.verdict`; `process.exit(merged.ok ? 0 : 1)`. Confirm a FAIL merged verdict can no longer read as ok.
2. HIGH-2: `verdictOf()` returns "error" (not "pass") when alive but no parseable verdict. Confirm fail-closed.
3. HIGH-3: `security-pass-count.js evaluateConfig` requires `passes.length >= 3` (full 3-provider chain). Confirm a 2-provider chain is HARD-flagged.
4. HIGH-4: `evaluateRuntime` groups by `prompt_digest || run_id || sprint_id` (prompt_digest preferred) and counts TOTAL pass records (flags 2/3 AND 1/3); a lone single-record group is not flagged. Confirm the run_id-collapse + 1/3-ignored issues are closed.

## Output
Return a ≤6-line envelope: VERDICT (PASS if all 4 closed + no new HIGH issue; else FAIL), per-finding closed/open (1-4), and any NEW issue. Write detail to `runtime/sp-dp-review/w1w2-rereview-out.md`.
