# E-MC-READINESS-ANALYSIS-001 · Track 4 — Release-Pipeline Slip-Through Analysis

**tl;dr:** Framework files keep shipping "to nobody." A new `scripts/*` dir (or `framework/*.json`) added by a sprint isn't auto-classified in the manifest's hand-maintained include-list, so it never ships downstream — and the gate that catches this (`warpos-ship-coverage`) only runs at **release** and **on-demand**, never **per-commit**. So the gap lands silently and stays invisible until release. **The detection exists; the *timing* is the hole.** Two structural fixes proposed (no fix applied — this is the analysis epic).

- **Epic / track:** E-MC-READINESS-ANALYSIS-001 · Track 4 (release-pipeline: why gaps keep slipping through → the final-fix design)
- **Date:** 2026-06-16 · **Author:** Alex α (autonomous) · **Type:** findings only, evidence-grounded, no changes
- **Trigger:** this session's live instance — the panels/admin/cockpit sprints' backing scripts shipped to nobody → `ship-coverage` exited 1 → `release --strict` was broken (caught by the roadmap-state-honesty audit, fixed in `c7e97610`).

## The recurring class (evidence)

`scripts/generate-framework-manifest.js` ships framework assets from an **explicit INCLUDE list** (`ASSET_DIRS`). A new dir must be **manually added** or it ships to no one. This has recurred **≥4 times**, each caught late by `ship-coverage` (its comments are the receipts):

| Instance | Dir(s) unshipped | When caught |
|---|---|---|
| E4 skill-hook land | `scripts/checks` (partial) | "Latent unshipped gap from the E4 land, caught here by ship-coverage" (manifest gen line ~226) |
| S-LC-05 (Wave 1 tail) | `scripts/teams` | "ship-coverage caught it (framework-owned, unshipped, unallowlisted) during the Wave 3 build" (line ~245) |
| S-LC-09 | `scripts/epic` | added alongside teams (line ~248) |
| **panels/admin/cockpit (this session)** | `scripts/{panel,cockpit,admin}` + 2 `framework/*-registry.json` | exited 1; **broke `release --strict`**; fixed `c7e97610` (line ~249) |

## Root cause (two layers)

1. **Hand-maintained INCLUDE list (the *generation* of the gap).** `ASSET_DIRS` is opt-IN: a framework dir ships only if a human remembers to classify it. Every new tool-dir is a fresh chance to forget. The default is "don't ship," which is the *wrong* default for a framework whose job is to deliver its tooling.
2. **Late detection (the *slip-through* of the gap).** `warpos-ship-coverage` is wired into **`release-gates.js`** (release) and **`/scan:full`** (on-demand) — but **NOT** into `scripts/linters/`, `scripts/testsuite/`, or any pre-commit/merge hook (verified absent 2026-06-16). So between "dir lands at commit" and "someone runs a release or a full scan," the gap is invisible. In this session the gap sat from the panels/admin sprints (2026-06-14/15) until an unrelated audit ran the check (2026-06-16).

## Fix options (proposed — for the EXECUTION epic, not applied here)

- **Fix A — invert to auto-detect (kills the class).** Walk `scripts/*` (and `framework/*.json`) by default; maintain an explicit small **EXCLUDE** list for the genuinely dev-only dirs (today: `scripts/one-off`, `scripts/products`). A new dir then ships by default; you opt OUT, not in. Tradeoff: a new dev-only dir would ship unless excluded — but default-ship is the *safe* default for a tooling framework, and the EXCLUDE list is short + stable. **This eliminates the generation layer.**
- **Fix B — run ship-coverage per-commit (closes the timing window).** Wire `warpos-ship-coverage` into `scripts/linters/run.js` (the per-commit lint path) — it already exists and is fast. Catches any residual gap **at commit time**, not release time. Start REPORT-ONLY for a watch period, then ramp to blocking (operator-gated, same discipline as the lifecycle flips). **This closes the detection-timing layer.**
- **Recommendation:** do **both** — A removes most of the class outright; B is the cheap backstop that makes any residual self-detecting immediately instead of at release. A is the higher-leverage one-time change; B is the standing guard. Neither is a launch blocker on its own, but together they end the "downstream always missing a tool" class structurally (the same root E-CONTENT-DELIVERY-001 targets).

## Cross-links
- Live instance + fix: commit `c7e97610` (ship-coverage RED→GREEN). · Enforcer: `scripts/checks/warpos-ship-coverage.js`. · Generator: `scripts/generate-framework-manifest.js` (`ASSET_DIRS`).
- Related: E-CONTENT-DELIVERY-001 (the "downstream always missing" theme) · the `tracker-reality-drift` enforcer (ED-056) caught the *claim* side of the same incident (DoD#2 said GREEN while RED).

## Disposition
Track-4 findings COMPLETE (analysis only). Recommended execution work (Fix A + Fix B) belongs to E-MC-READINESS-EXECUTION-001 / E-CONTENT-DELIVERY-001. 5 of 6 analysis tracks remain (hardening-sim, security triple-pass, edge-case, file-org, prose-vs-reality — the prose-vs-reality pass was partially run this session via the roadmap-state-honesty audit, `runtime/roadmap-audit/`).
