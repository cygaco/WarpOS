# Pre-seal capture at the pin 06669fbe (beta condition 2, msg 9b4c7e12)

Captured by epsilon before any seal edit exists. Working tree: .worktrees/laneb-pin (detached at 06669fbe, porcelain clean at capture).

## Exit codes as printed
- gate-failclosed-enforcer.js -> exit 1 (status blocked)
- gate-failclosed-audit.js -> exit 0

## Enforcer JSON verbatim
```json
{
  "status": "blocked",
  "exitCode": 1,
  "coverage": {
    "detector_sha": "8eaec242",
    "M": 88,
    "N": 8,
    "triaged_not_enforced": 1,
    "K": 79,
    "uncorrelated_registry_defects": 3,
    "phrasing": "8 of the 88 sites the detector at 8eaec242 enumerated are under enforcement, 79 untriaged (1 further baseline site(s) are triaged non-enforced [not-a-defect/not-a-gate]; 3 registry defect row(s) have no live-detector counterpart at this sha — see gate-failclosed-registry.json's tool_correlation_note)."
  },
  "regressed": [],
  "checked_repaired_count": 0,
  "new_entrants": [
    "scripts/hooks/ownership-guard.js:146",
    "scripts/hooks/retro-presence-check.js:108",
    "scripts/hooks/retro-presence-check.js:70"
  ],
  "live_files_scanned": 951,
  "live_files_unreadable": [],
  "live_detector_sha": "06669fbe",
  "baseline_detector_sha": "8eaec242",
  "baseline_site_count": 88,
  "registry_row_count": 13
}
```

## Artifact blob shas at the pin (git rev-parse <pin>:<path>)
- `scripts/checks/gate-failclosed-audit.js` = `279845cc0785b60f4065069f5e77b96571bede99`
- `scripts/checks/gate-failclosed-audit.test.js` = `cc84ae148ab1676584c3aaea098532cb14a4657e`
- `scripts/checks/gate-failclosed-baseline.json` = `32dda93f0b98f6d82260b3995965a699fc683d85`
- `scripts/checks/gate-failclosed-registry.json` = `ac606380dac68fb82e4164230d1c476448a6aadb`
- `scripts/checks/gate-failclosed-enforcer.js` = `ae1838a316f4bb7adc9ad516cc3d9e0cf3ce5928`

## Revert check (beta condition 1) — the three files, pin vs B2' tip 236fb0e4
- `scripts/checks/gate-failclosed-audit.js`: B2'=`279845cc0785b60f4065069f5e77b96571bede99` pin=`279845cc0785b60f4065069f5e77b96571bede99` -> IDENTICAL
- `scripts/checks/gate-failclosed-audit.test.js`: B2'=`cc84ae148ab1676584c3aaea098532cb14a4657e` pin=`cc84ae148ab1676584c3aaea098532cb14a4657e` -> IDENTICAL
- `scripts/checks/gate-failclosed-baseline.json`: B2'=`32dda93f0b98f6d82260b3995965a699fc683d85` pin=`32dda93f0b98f6d82260b3995965a699fc683d85` -> IDENTICAL

Same three files at B3's worktree tip d10afb14 (the branch that was NOT merged):
- `scripts/checks/gate-failclosed-audit.js` = `d1d3c6386a4f7c674856ce349bdf2e5a6932da34` -> DIFFERS from B2'
- `scripts/checks/gate-failclosed-audit.test.js` = `ad1180d6635ef19b27ece88afd1b6a85f33099d7` -> DIFFERS from B2'
- `scripts/checks/gate-failclosed-baseline.json` = `fd75245465bdd9c4340fa7e185e7ef15e4f965cc` -> DIFFERS from B2'

## The revert hazard, resolved

`d10afb14`'s own diff touches only `scripts/hooks/*`, a fixture test, and the two
manifests — it does NOT touch the three files above. So the cherry-pick of that
single commit onto `session/2026-08-29` could not carry the worktree branch's stale
copies, and the pin holds B2''s post-fix blobs byte-identical.

Checkable quote, the pre-fix line B2' removed:

- `git show d10afb14:scripts/checks/gate-failclosed-audit.js | grep -n "lastIndex = handlerEnd"`
  -> `372:    tryRe.lastIndex = handlerEnd + 1;`
- the same grep against the pin's working copy -> no match (rc=1)

`8eaec242`'s diff header reads `index 18474154..279845cc` for that file; the pin's
blob IS `279845cc`, i.e. the post-image of the fix commit.

RESIDUAL (not a blocker, a hazard that survives): branch
`worktree-gentle-wandering-clarke` at `d10afb14` still carries the reverted audit,
its test file and the pre-B2' baseline. It is superseded by the cherry-pick and must
not be merged.

## An observation from this capture, recorded here and NOT placed in any lane brief

`detector_sha` is produced by `getDetectorSha()` at gate-failclosed-audit.js:611-619:
`git rev-parse --short HEAD`. It is the repository HEAD sha, not a content hash of the
detector. At this pin the audit module's blob is byte-identical to its blob at
`236fb0e4` (`279845cc...`) while the enforcer prints `live_detector_sha: "06669fbe"`
and `baseline_detector_sha: "8eaec242"`. Its catch returns the string `"unknown"`.
Recorded by epsilon at capture time; deliberately withheld from the briefs under
ED-384 / AG-9 so no lane inherits it as a framed answer.
