# Cross-provider review - SP-20260615-001

Verdict: FAIL (binding)

Scope reviewed:
- Spec: `.claude/project/sprint/requirements/SP-20260615-001/acceptance-criteria.md`
- Enforcer: `scripts/checks/panel-registry-coverage.js`
- Generator: `scripts/panel/roadmap.js`
- Thin parts: `framework/panel-registry.json`, `.claude/commands/panel/*.md`, `scripts/panel/list.js`, `/scan:full` wiring, path keys, maps/manifests

## Blockers

1. BLOCKER - R-5 fail-closed hole: `panels: []` reads green.

`scripts/checks/panel-registry-coverage.js:273` only checks `typeof reg.panels === "object"`, so arrays pass the loader. `evaluate()` then iterates `Object.entries(panels)` at `scripts/checks/panel-registry-coverage.js:192`; an empty array has no rows, so `findings.length === 0` at line 304 and `main()` returns 0 at line 318.

Probe used: monkey-patched `fs.readFileSync` to return `{"$schema":"warpos/panel-registry/v1","panels":[]}` and called `main(["node","panel-registry-coverage.js","--registry","fake.json"])`; result was `mainStatus=0`.

Required behavior: this is the enforcer's own corrupt input (`panels` is not a map) and must exit >=2, distinct from clean 0 and finding 1.

2. BLOCKER - R-5 opener coverage false green: lane-absent skip masks real orphan scripts.

The resolver returns `skip:true` for any absent `node scripts/panel/*.js` or `node scripts/admin/*.js` opener at `scripts/checks/panel-registry-coverage.js:79-84`, controlled by the broad prefixes at line 125. A skipped-only run has no findings, so it exits 0 at line 318.

Probe used: injectable registry with one row `opener: "node scripts/panel/ghost.js"` and `exists: () => false`; result was `findings: []`, one skipped row, and `wouldExit=0`. Calling `main()` with the same registry via monkey-patched `fs.readFileSync`/`fs.existsSync` also returned `mainStatus=0`.

Required behavior: an orphan/phantom opener is a hard finding -> exit 1. The skip-with-note tolerance is not sound as written because it is prefix-only and remains active in the integrated tree. It can hide the exact false-green class this enforcer is supposed to prevent.

3. BLOCKER - R-5/R-1 row shape is not exact; extra `route` passes.

The row-shape check in `evaluate()` verifies required non-empty string keys and run_context, but never asserts the key set is exactly `{name, opener, description, run_context}` and never rejects `route` or other extras. Probe used: row `{ name, opener, description, run_context, route: "/should-not-be-here" }`; result was `findings: []`, `wouldExit=0`.

Required behavior: R-1/R-5 bind the row shape as exact and explicitly exclude the admin-registry-style `route` field.

4. BLOCKER - R-4 fail-soft contract mismatch: missing active-sprints/open-gaps do not render `section unavailable`.

`parseActiveSprints()` treats an absent or empty `.claude/project/sprint/active-sprints.yaml` as a valid empty state at `scripts/panel/roadmap.js:187-193`. `readJsonlOpen()` treats absent open-gap registers as count zero at `scripts/panel/roadmap.js:305-307`. The renderer only shows `section unavailable` when `b.active.error` or `b.gaps.error` is set (`scripts/panel/roadmap.js:383`, `scripts/panel/roadmap.js:414`).

Probe used: `node scripts/panel/roadmap.js --root C:\tmp\warpos-roadmap-no-such-root`; exit was 0, NEXT ACTION and Ranked degraded, but In flight rendered `_None in flight._` and Open gaps rendered zero counts.

Required behavior from the prompt/spec: a missing source section degrades to `section unavailable` while the rest still renders.

5. BLOCKER - R-4 broken YAML can be silently accepted as healthy.

`parseActiveSprints()` is a regex scanner (`scripts/panel/roadmap.js:202-235`) and only treats NUL bytes as corruption (`scripts/panel/roadmap.js:198`). Textual invalid YAML such as `sprints: [` or malformed list rows does not throw and does not mark the section unavailable.

Probe used with injected reads:
- `sprints: [\n` -> `sectionsUnavailable=[]`, In flight rendered `_None in flight._`
- `primary: [unterminated\nsprints:\n  - id: SP-X\n    status: planning\n` -> `sectionsUnavailable=[]`, `primary="[unterminated"`

Required behavior: broken `active-sprints.yaml` degrades the In flight section to `section unavailable`; it must not silently normalize corruption to an empty or partially healthy board.

## Notes

1. The enforcer's fail-closed branches for unreadable, non-JSON, wrong `$schema`, and missing `panels` object do return 2 when called through `main()` with controlled reads. The `panels: []` case above is the uncovered corrupt-shape gap.

2. The enforcer core is injectable and testable (`evaluate({ registry, resolve, exists })`). With controlled seams it flags an outside orphan opener (`node scripts/nope.js`) and unsafe opener (`node scripts/panel/roadmap.js && calc`) correctly.

3. Direct clean enforcer execution could not be accepted as green in this Codex sandbox: `node scripts/checks/panel-registry-coverage.js --json` exited 1 because nested `child_process.spawnSync(process.execPath, ...)` is blocked with `EPERM`. Direct `node scripts/dispatch-skill.js --resolve --skill cockpit:readiness --json` and `models:router` both returned `found:true`, so this is an environment-limited validation note, not the primary blocker.

4. The roadmap generator is read-only on static inspection. `rg`/test inspection found no `fs.write*`, append, rename, remove, or source write-back path in `scripts/panel/roadmap.js`; `roadmap-board-readonly.test.js` passed 5/5.

5. The thin registry/forwarder/list pieces mostly pass sanity: `framework/panel-registry.json` is a new sibling registry, `git diff -- framework/admin-panel-registry.json` is empty, `/panel:*` command bodies delegate instead of parsing/rendering, and `node scripts/panel/list.js --json` enumerates the four registry rows exactly. Missing registry for list exits 1 with a clear "panel registry unavailable" message.

6. `/scan:full` Tier-2 includes `/scan:panel-registry-coverage` and documents report-only treatment at `.claude/commands/scan/full.md:40` and `.claude/commands/scan/full.md:60`. The scan skill file exists.

7. Path keys and generated views are present: `framework/paths.registry.json:220` (`scriptsPanel`), `framework/paths.registry.json:229` (`panelRegistry`), `.claude/paths.json:29-30`, and `scripts/hooks/lib/paths.generated.js:40-41`. Maps/manifests also include the new panel command files, `framework/panel-registry.json`, `scripts/panel/*.js`, and `scripts/checks/panel-registry-coverage.js`.

## Regression/run notes

The sprint regression files were executed, but tests that spawn a nested Node process report `EPERM` in this sandbox (`spawnSync node EPERM` / `spawnSync C:\Program Files\nodejs\node.exe EPERM`). I therefore used direct CLI probes plus injectable module probes for the correctness-sensitive cases. The blockers above do not depend on the EPERM limitation.
