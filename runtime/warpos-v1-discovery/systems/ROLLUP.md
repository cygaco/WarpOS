# /discover:systems — Intersection Rollup (2026-07-09)

6 angles run in parallel: 1-declarative · 2-structural · 3-behavioral · 4-refgraph · 5-convention · 6-historical. Full angle reports in this directory. Classification per skill: **Solid** (4+ angles) · **Emergent** (real but undeclared — 2/3/6 without 1) · **Ghost** (declared but dead — 1 without 2/3/5) · **Fragile** (1 angle only).

```
┌────────────────────────────────────────────────────────────────────────────┐
│ /discover:systems — 2026-07-09                                             │
│  Bucket      Count   Examples                                              │
│  Solid       ~22     dispatch-kernel, sprint-runtime, hooks, paths,        │
│                      checks-estate, skills, role-registry, trackers,       │
│                      warpos-distribution, memory-spine, manifest-pair      │
│  Emergent    ~10     LOGGING-SPRAWL, dual-scratch-roots, .warpos mega-dump,│
│                      codex-lane, handoffs/gamma archives, guard-telemetry  │
│  Ghost       ~10     systems-manifest, review-gauntlet doctrine, orphan    │
│                      path keys, drift-*.js, skill-ranker, absent fan-outs  │
│  Fragile     ~7      arbitration, patterns-lib, dreams, one-off scripts,   │
│                      migrations (multi-angle but frozen+off-registry)      │
│  TOTAL       ~49 systems                                                   │
└────────────────────────────────────────────────────────────────────────────┘
```

## SOLID (4+ angles — real, healthy, carry into v1)

| system | angles | note |
|---|---|---|
| dispatch-kernel (+contract, records, breaker, reaper) | 1,2,3,4,6 | model subsystem; hottest code+test co-evolution |
| sprint-runtime + state stores | 1,2,3,4,6 | active but state store = 2,379-file accretion (GC needed) |
| hooks-system + guard-mesh | 1,2,3,5,6 | highest-volume live layer |
| paths-registry + build + lint | 1,2,4,5,6 | mature (commands/paths frozen since 05-13 = stable) |
| checks/scan estate | 1,2,3,5,6 | 43/77 enforcers lack bite-tests (A5) |
| skills-library | 1,2,3,5,6 | 47 ns / 229 verbs on disk (catalog "50/231" stale) |
| role-registry + agent-roster | 1,2,4,5,6 | parity green |
| enforced-tracker-system | 1,2,3,6 | `trackers/` has NO paths-registry key (A5) |
| warpos-distribution + release archive | 1,2,3,6 | |
| dual-manifest-regen | 1,5,6 | THE hottest co-commit edge (196) — a manual discipline behaving as a system; automate it |
| memory-spine (logger+events+learnings+debt) | 1,2,3,4 | but see "stores lag enforcers" anomaly |
| beta-judgment + honesty audit | 1,3,4 | verdicts fire; dedicated β event store dormant 6wk |
| schemas/contracts (53 warpos/*/v* ids) | 2,5 | 11 still /v0 never-frozen |
| test-suite + fixtures | 2,5,6 | two rival naming conventions (test-*.js vs *.test.js) |
| portfolio + bootstrap (spinup/lastmile/canon) | 1,2,3 | |
| guides + knowledge + requirements-canon | 1,2,5 | _guides/_knowledge literals absent from paths registry |
| turbo + mode-state-machine | 1,2,3 | |
| oneshot-delta-engine | 1,2 | behaviorally dormant 5wk — cooling solid |

## EMERGENT (real but never declared as systems — the ignored ones)

1. **logging-observability-sprawl** ⚠️ THE HEADLINE. What Angle 3 shows as the highest-volume live activity is ~10 independent, ownerless log streams: `events.jsonl` (17.2MB monolith) + `tools.jsonl` (9.2MB) + `requirements.jsonl` (490KB) + `team-guard-debug.log` (274KB) + `CODEX-LOG.md` (91KB, repo root) + per-session `logs/<sid>/` + `runtime/.tv*.log/.sc.log/sealed-gate-full.log` + prompt logs + health probes. Angle 1 declares exactly ONE of these ("event-log"). No rotation anywhere, no shared schema, no owner, split across ≥4 roots. Every new subsystem invents its own log file. **This is a real system nobody named — it needs a charter (owner, schema, rotation, query API) in the v1 rebuild.**
2. **dual-scratch-roots** — `runtime/` and `.claude/runtime/` carry the SAME classes split across both (notes 48+2, epsilon-prompts 17+57, handoffs). Any single-root tooling undercounts.
3. **dot-warpos-scratch** — `.warpos/` = 11,244 files, the LARGEST dir in the repo, hidden, pure scratch/fixtures, unmanaged.
4. **archive accretion** — handoffs-archive (97), gamma transcripts (100+), per-run sprint scratch (40+ dirs), sprint checkpoints (496). No GC policy exists for any of them.
5. **codex-lane** — `.codex/config.toml` + `CODEX-LOG.md` + CODEX.md, brand-new, untracked, behaviorally active (actor:codex 16). A whole provider lane operating as undeclared scratch.
6. **guard-telemetry streams** — bash-permission-classifier (15k events), cd-prefix-stripper (1,810), memory-guard-blocked (2,542 — the dominant friction source, confirming the 06-08 learning). High-traffic behavioral systems with no individual identity/owner.
7. **runtime-root-clutter** — `runtime/_ed*.js` one-off append scripts accreting, untracked.
8. **root-md-sprawl** — 30 root .md files incl. TRACKER (212KB) + ROADMAP (379KB) + a dozen WARPOS-*.md.

**Next action (Emergent):** the v1 systems register (replacing degenerate systems.jsonl) must give each of these an entry with owner + lifecycle policy. Logging gets a first-class pack: unified stream layout (dated dirs), schema, rotation/compaction, and a query CLI — which is also the helm-neutral replacement surface for what smart-context used to read.

## GHOST (declared but dead, degenerate, or drifted)

1. **systems-manifest** — CLAUDE.md declares it as a memory pillar; the store is 90 skill-description echoes naming ~0 architectural systems. Rebuild the schema (this ROLLUP is the seed content).
2. **review-gauntlet doctrine** — AGENTS.md §Review Protocol still describes the old 4-agent evaluator/compliance/security/QA gauntlet; superseded by the pod-reviewer/qa-reviewer restructure. Stale constitution text.
3. **skill-ranker / SUGGESTED-SKILLS** — declared doctrine, never fired (F11a).
4. **smart-context §Prompt Pipeline** — CLAUDE.md section now stale as of today's operator-directed disable. Update CLAUDE.md.
5. **Declared-but-absent event fan-outs** — logger declares `skill-usage.jsonl`, `code.jsonl`, `plans.jsonl`, `requirements-staged.jsonl`; none exist on disk.
6. **Orphan path keys (registry-vs-usage drift)** — 0 references: toolsFile, reasoningFrameworks, portfolioHome, clonesRoot, panelRegistry, adminPanelRegistry, **dispatchLocks, dispatchDeathsFile** (dispatch is ALIVE but writes by literal — repoint code to keys, don't delete), sprintHookPoints/skillHookPoints (1 each).
7. **drift-detection suite** — scripts/drift-*.js (~10 files): structure present, zero inbound refs, zero behavior. Abandoned; verify then delete.
8. **traces-store** — 10 entries, dormant 31d. Near-dead declared pillar.
9. **beta-consult-events store** — dormant 6wk while β itself is consulted (writes go elsewhere).
10. **epic:* vaporware** — 8/10 skills "designed; build deferred" (already in backlog to prune).

## FRAGILE (single-angle — new or near-decay)

arbitration-system (structure only) · patterns-lib (frozen 05-03) · dreams-store (structure only) · ~30 orphan one-off scripts (refgraph only — GC list) · models-research runtime dir (dormant) · **migrations/** (multi-angle presence but frozen 05-14 AND missing from paths registry — an active-obligation system in decay posture).

## Cross-angle anomalies (the load-bearing findings)

- **"Stores lag enforcers"** — the cognitive-memory layer (learnings 22d, traces 31d, β-store 6wk) went dormant while the guard layer fires thousands of times daily. The company kept enforcing but stopped learning. The learning-promotion gate (already in backlog) plus post-smart-context memory CLI must revive the write side.
- **Even the paths registry has holes at its feet**: trackers/, migrations/, _guides/, _knowledge/, _planning/ have no keys; dispatchLocks/dispatchDeathsFile keys exist but live code bypasses them.
- **43 of 77 enforcers ship no bite-test** — corroborates lane 10's silent-rot finding from a second angle.
- **The dual-manifest regen is the hottest edge in the whole co-commit graph (196)** — a manual discipline consuming more commit surface than any functional system. Automating it (commit-hook regen) removes the single largest bookkeeping tax.
