# B6 — conductor-measured gate state at eae7e3d3

**These figures were measured by the conductor (ε), not by the builder.** The B6 builder was
REAPED at its 1200 s background bound (`reaped:true`, `reason:"builder_timeout_reap"`,
`elapsed_ms: 1200193`, dispatch `d-mtfc4tc1-34d7b317`) AFTER committing its work and BEFORE
writing its envelope. No builder-authored envelope for B6 exists, and none can honestly be
reconstructed — see NOTE below.

## Measured, each command run as its own command, real exit codes

```
node scripts/checks/gate-failclosed-enforcer.js   -> EXIT 0
node --test scripts/checks/gate-failclosed-enforcer.test.js  -> tests 11 / pass 11 / fail 0 / skipped 0
node --test scripts/checks/gate-failclosed-audit.test.js     -> tests 28 / pass 27 / fail 0 / skipped 1
node --test runtime/enforcer-fixtures/SP-20260829-001/b3-fault-injection.test.js -> tests 10 / pass 10 / fail 0 / skipped 0
node scripts/testsuite/enforce.js -> EXIT 0
```

## Coverage movement, 12d2aef0 -> eae7e3d3 (from the enforcer's own JSON, both runs)

| field | 12d2aef0 | eae7e3d3 |
|---|---|---|
| M | 78 | 78 |
| N | 0 | 0 |
| triaged_not_enforced | 3 | 4 |
| K | 75 | 74 |
| uncorrelated_registry_defects | 0 | 2 |
| checked_repaired_count | 7 | 7 |
| registry_row_count | 14 | 16 |

The tne/K movement is item 1 landing (the edit-watcher row is now tool_correlated with
tool_finding_line 675, verified by direct read of both registry versions). The
uncorrelated/rows movement is items 6(b) and 7(b): two new rows, both `contested`,
`expected_finding: present`, `tool_correlated: false`, neither repaired.

## enforce.js output delta, stated rather than smoothed

At 12d2aef0 the runner reported `19/20 runnable green` with BC-26 a known-baseline red and
BC-17 a STALE MARKER warning. At eae7e3d3 it reports `18/20 runnable green` with BC-17 AND
BC-26 both as known-baseline reds. Exit code 0 and `0 NEW regressions` in both cases. The
conductor has not diagnosed why BC-17 moved category and is not characterising it; the two
runner lines are recorded verbatim in enforce-js-at-eae7e3d3.txt and in the B5 record.

## NOTE — why no envelope was reconstructed

The brief required a committed envelope with per-item before/after pairs, the measured
figures, carried findings, and a `could_not_check` list. The first two are recoverable from
artifacts: the before/after pairs ARE `git diff 12d2aef0 eae7e3d3`, which is the primary
artifact rather than a transcription of it, and the figures are above.

The last two are NOT recoverable. A fresh builder spawned to "finish the envelope" has no
access to what the reaped instance noticed and declined to repair, or to what it could not
check — it would have to infer both from the diff and write them in the first person. That
would be a manufactured account of another party's work, which is the failure class this
sprint exists to study. **So B6 ships with no builder-authored carried-findings list and no
builder-authored could_not_check list, and that absence is a finding about this bundle, not
a gap to be filled.**
