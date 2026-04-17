# Systems Map

Generated from canonical `SYSTEMS.md` (see `paths.reference/SYSTEMS.md`).

Last refreshed: 2026-04-16. Refresh via `/check:system --update` then `/maps:systems`.

---

## Tier map

```
TIER 1 — Identity & Doctrine
  ├─ Alex identity                  (CLAUDE.md)
  ├─ Agent team                     (α β γ δ)
  ├─ Build-chain (adhoc)            (builder, evaluator, compliance, fixer, qa, redteam)
  ├─ Build-chain (oneshot)          (+auditor)
  └─ Modes                          (solo, adhoc, oneshot)

TIER 2 — Cognition
  ├─ Reasoning engine               (frameworks + traces + scoring)
  ├─ Learning system                (staged promotion, decay)
  ├─ Memory stores                  (events, learnings, traces, systems, beta-events)
  └─ Beta judgment model            (judgement-model.md + recommendations + source-data + lexicon)

TIER 3 — Orchestration
  ├─ Smart-context pipeline         (Haiku enrichment on every prompt)
  ├─ Session lifecycle              (start → track → stop → handoff)
  ├─ Cross-session inbox            (inter-terminal messaging)
  └─ Store (build state)            (oneshot's state machine)

TIER 4 — Automation (31 hooks, one system)
  ├─ Guards                         (secret, memory, foundation, ownership, merge, team, store-validator, path-guard)
  ├─ Watchers                       (edit, session-tracker, systems-sync, learning-validator, save-session-lint, prompt-validator)
  ├─ Quality                        (format, typecheck, lint, ui-lint)
  ├─ Lifecycle                      (session-start, session-stop, compact-saver)
  ├─ Context                        (smart-context, prompt-logger)
  └─ Build                          (gate, gauntlet, cycle, boss-boundary, worktree-*, ref-checker, excalidraw, beta-gate)

TIER 5 — Capability (66+ skills, 21 namespaces, one system)
  beta | check | commit | content | fav | fix | hooks | learn | maps | mode
  preflight | qa | reasoning | redteam | research | retro | session | skills
  sleep | ui | warp

TIER 6 — Knowledge Infrastructure
  ├─ Paths registry                 (paths.json — SSoT)
  ├─ Manifest                       (manifest.json — project identity)
  ├─ Settings                       (settings.json — hook registration)
  ├─ Maps                           (6 maps)
  ├─ Reference docs                 (reasoning-frameworks, operational-loop, learning-lifecycle, SYSTEMS.md)
  └─ SPEC_GRAPH                     (staleness propagation — .claude/project/maps/SPEC_GRAPH.json)

TIER 7 — Product Skeleton (WarpOS-only)
  ├─ Requirements templates         (00-canonical → 99-audits)
  ├─ Patterns library               (Claude API recipes)
  └─ Installer                      (warp-setup.js, install.ps1, version.json)

TIER 8 — Worktree / Isolation       (builder isolation)
TIER 9 — Plans                      (active + archive)
TIER 10 — Handoffs                  (session snapshots)
TIER 11 — Dreams                    (sleep-cycle REM artifacts)
TIER 12 — Favorites                 (user-curated moments)
TIER 13 — Linters                   (path-lint + 4 spec linters + external)
TIER 14 — Compliance / CLI Bridge   (codex/gemini shell runner)
TIER 15 — Event-Sourced Docs        (materialize-decisions, truth-compiler)
TIER 16 — Observability             (agent-dashboard, store-viewer, qa-health)
```

## Dependency summary

```
Identity (CLAUDE.md)
     │
     ▼
Agent Team (α β γ δ)
     │
     ├──▶ Modes (solo, adhoc, oneshot)
     ├──▶ Reasoning Engine ◄──── Learning System ◄──── Memory Stores
     │         │                       │                    │
     │         ▼                       ▼                    ▼
     │    Traces (paths.tracesFile)  Learnings (paths.learningsFile)  Events (paths.eventsFile)
     │
     └──▶ Build-chain Agents (builder, evaluator, …)
                       │
                       ▼
                  Worktree Isolation
                       │
                       ▼
              Store (paths.store) ◄──── Session Lifecycle ◄──── Smart-Context Pipeline
                       │                       │                          │
                       ▼                       ▼                          ▼
                  Gauntlet Gates         Handoffs (paths.handoffs)   Cross-Session Inbox
                       │
                       ▼
                  Linters (path-lint, lint-prds, lint-stories, lint-staleness, lint-hl-stories, tsc, eslint, prettier)

Paths Registry (paths.json) ◄────── EVERYTHING above resolves paths through here
```

## Counts

| Category | Count |
|---|---|
| Agents (active .md files) | 37 (WarpOS baseline) |
| Hooks (.js files in paths.hooks) | 31 |
| Skills (.md files in paths.commands) | 66 (WarpOS baseline; consumer projects may add content/) |
| Reference docs | 4 |
| Linter scripts | 5 |
| Patterns library | 5 |
| Requirements template folders | 11 |
| Maps | 6 (+SPEC_GRAPH) |

## How to regenerate

1. `/check:system` — diff disk vs `paths.systemsFile`
2. `/check:system --update` — apply additions
3. `/maps:systems --refresh` — redraw this map
4. Commit to both repos (`/commit:both`)

## Related

- `paths.reference/SYSTEMS.md` — detailed canonical list (this map's source)
- `paths.systemsFile` — machine-readable manifest (JSONL)
- `.claude/project/maps/systems.jsonl` — legacy (will be replaced by `/check:system --update`)
