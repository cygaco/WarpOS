# CROSS-PROVIDER CODE REVIEW — ROUND 2 (re-review after fix)

You FAILed this change in round 1 with ONE high-severity blocking finding: the report-mode advisory string on dispatch-claude/dispatch-agent added a `(${door.mode})` label, changing stderr from `shape-resolver advisory:` to `shape-resolver advisory (report):` — a β#4 byte-identical regression.

FIX APPLIED: both wrappers now emit the EXACT legacy `advisory:` string in report mode (no mode label); only the new refuse path (exit 2) carries `VIOLATION (mode)`. A regression test now asserts the byte-identical form AND guards against the `(report)` label returning. All tests green (shape-door 9, wrapper-door 9, epsilon-door 6, skill-door 9; regression: review-fallback-shape/FIX-A3 21, dispatch-claude 14, dispatch-shape 31).

Confirm the fix resolves your finding, and re-scan for anything else. Same JSON verdict format: {"verdict":"PASS"|"FAIL","confidence":..,"blocking_findings":[..],"non_blocking_notes":[..],"summary":".."}

== UPDATED DIFF (full) + the regression test follow ==
