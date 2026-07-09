# Cross-provider re-review - SP-20260615-001

Verdict: PASS (binding)
Blockers: 0
Notes: 6

## Findings

No blocking findings. All five prior blockers from `runtime/sp-panels/xreview.md` are verified closed against the current code. I did not find a new false-green or fail-soft hole in the requested surfaces.

## Blocker re-verification

1. B1 CLOSED - `panels: []` no longer reads green.

`scripts/checks/panel-registry-coverage.js:65` defines `isPlainObject()`, `evaluate()` rejects non-map `panels` at line 208, and `loadRegistry()` fail-closes non-map `panels` at line 330. Injected probe:

- Registry: `{"$schema":"warpos/panel-registry/v1","panels":[]}`
- `evaluate()` result: `registry_no_panels`, `checked: 0`
- `main()` with injected read result: status `2`

This is closed and preserves the corrupt-input class as exit >=2, distinct from clean 0 and finding 1.

2. B2 CLOSED - lane skip is now narrowed to absent lane directories only.

The node opener resolver now skips a missing `scripts/panel/*` or `scripts/admin/*` target only when `ctx.laneDirExists(lanePrefix)` is false (`scripts/checks/panel-registry-coverage.js:101`). Probes:

- Existing lane dir, missing `node scripts/panel/ghost.js`: `orphan_opener`, `skipped: []`
- Absent lane dir, same missing opener: `findings: []`, one skip-with-note
- Injected `main()` with real `scripts/panel/` present and missing `ghost.js`: status `1`

This closes the prior prefix-only false green.

3. B3 CLOSED - row shape is exact and rejects `route`.

`evaluate()` now reports `extra_row_keys` for keys outside `{name, opener, description, run_context}` (`scripts/checks/panel-registry-coverage.js:254`). Injected probe with an otherwise valid row plus `route: "/admin"` produced:

- `finding_type: "extra_row_keys"`
- `panel: "admin"`
- injected `main()` status `1`

4. B4 CLOSED - missing roadmap sources degrade distinctly from empty sources.

`parseActiveSprints()` now throws `active-sprints.yaml not found` when the file is absent (`scripts/panel/roadmap.js:190`), and `parseGaps()` degrades missing open-gap registers (`scripts/panel/roadmap.js:387`). Probes:

- `node scripts/panel/roadmap.js --root C:\tmp\warpos-roadmap-no-such-root-xreview2 --json`: exit `0`, `sectionsUnavailable` included `inFlight` and `gaps`.
- In-process nonexistent-root render: In flight body was `section unavailable`, not `None in flight`; Open gaps body was also `section unavailable`.
- Present-but-empty injected sources stayed distinct: empty active-sprints rendered `None in flight`; empty gap registers rendered enforcement debt `0` and recurring issues `0`, with no `section unavailable`.

5. B5 CLOSED - malformed active-sprints YAML no longer normalizes to healthy empty state.

`parseActiveSprints()` calls `assertYamlNotCorrupt()` before line scanning (`scripts/panel/roadmap.js:210`), with the guard implemented at line 274. Injected malformed cases all degraded only In flight to `section unavailable`, never threw past `generate()`, and never normalized to empty:

- `sprints: [` -> `malformed YAML: unterminated flow collection`
- `primary: "unterminated` -> `malformed YAML: unterminated quoted scalar`
- `primary: 'unterminated` -> `malformed YAML: unterminated quoted scalar`
- stray `]` -> `malformed YAML: unbalanced flow collection`
- stray `}` -> `malformed YAML: unbalanced flow collection`

The real `.claude/project/sprint/active-sprints.yaml` parsed cleanly. It includes quoted titles and a quoted title containing `#` at line 258; real `node scripts/panel/roadmap.js --json` returned `inFlightAvailable: true`, `gapsAvailable: true`, and `sectionsUnavailable: []`.

## Notes

1. Direct `node scripts/checks/panel-registry-coverage.js --json` in this sandbox exits `1` because nested `spawnSync(process.execPath, ...)` is denied with `EPERM` for the two skill rows. The prompt called out this sandbox limitation. I did not count it as a product blocker.

2. The real registry was still verified through the injectable seam: `framework/panel-registry.json` evaluated with the two live skill rows resolved and real disk `exists()` checks for node rows produced `checked: 4`, `findings: []`, `skipped: []`. Top-level resolver commands for `cockpit:readiness` and `models:router` both returned `found:true`.

3. The 0/1/>=2 enforcer exit contract was confirmed in-process through `main()` with injected registry reads: clean node-only registry -> `0`; missing opener in existing lane -> `1`; corrupt array `panels` -> `2`.

4. The roadmap generator remains fail-soft: `main()` has an unconditional exit 0 path (`scripts/panel/roadmap.js:624`), and malformed-source probes through `generate({root})` returned degraded board state rather than throwing.

5. The roadmap generator remains read-only on the reviewed surface. Static scan found no `fs.write*`, append, rename, remove, mkdir, copy, truncate, or write-stream call in `scripts/panel/roadmap.js`; a dynamic write-guard around `generate({root})` recorded no write calls.

6. Regression files now cover the specific closure classes with in-process seams (`tests/regression/SP-20260615-001/panel-coverage-failclosed.test.js`, `panel-coverage-resolves.test.js`, `roadmap-board-failsoft.test.js`, and `roadmap-board-readonly.test.js`). I did not rely on those tests as the only evidence; the binding verdict above comes from direct probes against the current modules.

VERDICT=PASS BLOCKERS=0 NOTES=6
