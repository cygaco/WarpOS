# Cross-provider review — panel:* namespace + roadmap board (SP-20260615-001, ROADMAP items 23+25)

You are a backend code reviewer. Give a BINDING verdict on a small additive dev-tooling sprint. Be skeptical and adversarial on the TWO correctness-sensitive parts (an enforcer + a generator) — same-family green (16/16 regression) is not sufficient for an enforcer (the recurring "cross-provider qa catches false-green enforcers" class). The thin parts (registry + forwarders + enumerator) just need a sanity pass.

scopeContract: { "mode": "read-only", "allowedFiles": [], "forbiddenFiles": ["**/*"], "note": "read-only reviewer — write findings ONLY to runtime/sp-panels/xreview.md" }

SPEC: `.claude/project/sprint/requirements/SP-20260615-001/acceptance-criteria.md` (R-1..R-5, β's 4 corrections labeled [β-1..4]). β's binding asymmetry: the GENERATOR (R-4) fails SOFT on human inputs; the ENFORCER (R-5) fails CLOSED on its own corruption.

## SCRUTINIZE #1 — the ENFORCER (the false-green risk): `scripts/checks/panel-registry-coverage.js`
- Does it REALLY fail-CLOSED (exit ≥2) on its OWN corrupt input — unreadable / non-JSON / wrong `$schema` / missing `panels` — DISTINCT from a clean pass (0) and from an orphan-row finding (1)? Find ANY path where its own corruption reads green (exit 0/1).
- Does it actually resolve openers (node-script file-exists; `/ns:name` via dispatch-skill --resolve) and flag orphan/phantom/unsafe (shell-metachar) openers as findings?
- Is the `evaluate()` core pure/injectable (testable without the real FS)? Is the lane-absent SKIP-with-note tolerance (ported from admin-suite-coverage) sound, or could it mask a real orphan?
- Repro: `node scripts/checks/panel-registry-coverage.js` (clean→0); feed a corrupt registry via `--registry <bad>` and confirm ≥2; an orphan-opener registry → 1.

## SCRUTINIZE #2 — the GENERATOR (read-only + fail-soft): `scripts/panel/roadmap.js`
- Is it STRICTLY read-only? Find ANY fs.write/append/rename to ROADMAP.md / TRACKER.md / active-sprints.yaml / enforcement-debt.jsonl. There must be NONE.
- Does it REALLY fail-SOFT — a malformed/missing/renamed source section degrades to "section unavailable" and the REST still renders, NEVER throws, NEVER non-zero-exits on a degraded section? Try corrupting each of the 4 sources and confirm it still exits 0 and renders the others.
- Is the parsing resilient (renamed heading, broken YAML) or brittle?

## SANITY — the thin parts
- `framework/panel-registry.json` is a NEW file; `framework/admin-panel-registry.json` is byte-unchanged (β-1). The `/panel:*` forwarders (`.claude/commands/panel/*.md`) DELEGATE only — no duplicated opener logic (β-2). `scripts/panel/list.js` enumerates the registry exactly + fails soft on a malformed registry. The enforcer is wired REPORT-ONLY into `.claude/commands/scan/full.md` Tier-2. Path keys `scriptsPanel`/`panelRegistry` added to SOURCE `framework/paths.registry.json` and present in `.claude/paths.json`.

## Output
Write findings to `runtime/sp-panels/xreview.md`. End stdout with ONE line exactly:
`VERDICT=<PASS|FAIL> BLOCKERS=<n> NOTES=<n>`
