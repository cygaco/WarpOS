# Angle 6 (HISTORICAL / co-evolution) — /discover:systems (2026-07-09)

Method: git log --since=90.days --name-only; 894 commits, 719 after dropping >20-file omnibus. Segment-pair co-commit counts. The 4 manifest/version bookkeeping files co-change with nearly everything (the "regen BOTH manifests" discipline as a system) — filtered out below.

## Co-evolution clusters
| slug | dirs involved | co-commits | implied system |
|---|---|---|---|
| dual-manifest-regen | framework-manifest.json ↔ _warpos/MANIFEST.json | **196** | ownership-vs-shipping manifest pair; "regen BOTH" law |
| warpos-distribution | scripts/warpos ↔ _warpos/MANIFEST.json | 42 | capsule build ↔ shipping manifest |
| skill-enforcer | .claude/commands ↔ scripts/checks | 43 | scan skills backed by check scripts |
| agent-skill-authoring | .claude/agents ↔ .claude/commands | 34 | agent specs + invoking skills |
| agent-parity | .claude/agents ↔ scripts/checks | 32 | role/scan parity enforcement |
| sprint-planning | .claude/project ↔ ROADMAP.md | 31 | sprint artifacts drive roadmap |
| enforced-tracker | TRACKER.md ↔ trackers/epics | 30 | tracker↔epic reconciliation |
| enforcer-regression | scripts/checks ↔ tests/regression | 29 | checks paired with regression tests |
| roadmap-epic-trace | ROADMAP.md ↔ trackers/epics | 28 | epic-based roadmap trace |
| release-versioning | framework/releases ↔ version.json | 28 | capsule + version bump |
| hook-enforcement | scripts/checks ↔ scripts/hooks | 25 | hooks invoke check scripts |
| skill-hook-coverage | .claude/commands ↔ scripts/hooks | 25 | skill↔hook wiring |
| dispatch-system | .claude/agents ↔ scripts/dispatch | 23 | roster + routing |
| dispatch-contract-enforce | scripts/checks ↔ scripts/dispatch | 21 | contract validator |
| warpos-release-skills | .claude/commands ↔ scripts/warpos | 18 | release/distribution skills |
| hook-settings-wiring | .claude/settings.json ↔ scripts/hooks | 14 | hook registration |
| sprint-runtime | scripts/sprint ↔ tests/regression | 13 | epsilon-runtime under test |

Meta-pattern: almost every functional change fans out to scripts/checks + tests/regression + a manifest regen — the "every policy needs an enforcer" law is directly visible in the co-commit graph.

## Hot core (top files, 90d, omnibus-filtered)
274 framework-manifest.json · 270 _warpos/MANIFEST.json · 149 ROADMAP.md · 110 framework-installed.json · 40 TRACKER.md · 40 active-sprints.yaml · 34 scan/full.md · 33 version.json · 28 warp-setup.js · 23 RELEASES.md · 21 routing-trace.jsonl · 21 dispatch-agent.js · 21 E-SYSTEM-ORG-001 · 21 providers.js · 20 settings.json

Top 4 are manifest churn. Real editorial hot core: ROADMAP.md, TRACKER.md, active-sprints.yaml, scan/full.md, warp-setup.js, dispatch-agent.js, providers.js.

## Frozen dirs (cold 6–10 weeks while the core churns daily)
| dir | files | last commit |
|---|---|---|
| fixtures/ | 23 | 2026-05-19 |
| scripts/one-off/ | 13 | 2026-05-22 |
| migrations/ | 9 | 2026-05-14 |
| scripts/contracts/ | 8 | 2026-05-30 |
| patterns/ | 6 | 2026-05-03 |
| .claude/commands/paths/ | 6 | 2026-05-13 |
| scripts/products/ | 5 | 2026-05-22 |

Also cold + small: scripts/{budgets,deps,memory,preflight,security,timeline,self-mod,learn,docs,events}, commands/{ui,docs,linters,events,fav,fix,enforcement}. Notable: path-registry commands and contract-test scaffolding froze early = mature/stable. Oneshot machinery comparatively dormant vs sprint/dispatch.
