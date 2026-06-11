<!-- requirement-format-legacy -->
# High-Level Stories — E-LIFECYCLE-001 close-out fix sprint — 17 REAL + 4 PARTIAL GPT 2nd-pass findings (team-guard/mode-guard bypass classes, turbo spend/auth integrity, coverage-gate waiver+expected-source, provider-tier false-green, planning-principles enforce path, ac-coverage fail-closed) + NOTAGAIN §8.3 legacy scoping

**Sprint:** `SP-20260611-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Three high-level stories map to
> the three workstream groupings (WS-G1 lifecycle gates, WS-G2 turbo+auth,
> WS-G3 coverage+enforcers); WS-G4 (R-10) is sequenced under H-3 but blocked on
> SP-20260611-001's WS-A merge.

## H-1 — As the lifecycle gates, I cannot be disarmed by planted files, fake team names, or silent kill-switches

**As** the lifecycle-gate layer (team-guard, mode-lifecycle-guard, lifecycle.js)
**I want** every early-exit / disable path to VERIFY real team existence + readiness + mode against harness state (not trust presence markers, nonempty team_name strings, or unsigned mode.json), and every kill-switch / out-of-band mode write to be LOGGED loudly
**So that** a planted file, a fabricated team name, or a silent env/marker kill-switch can no longer disarm the blocking gates — making the report-only→blocking flip actually safe (BC-16 false-green / bypass-by-design-gap class).

Linked granular stories: see `granular-stories.md` (S-1, S-2).
Linked requirements: `R-1`, `R-2`.

## H-2 — As the turbo/authorization layer, my grants are monotonic-or-attested and my spend ledger cannot be reset or underfed

**As** the turbo/authorization layer (apply.js, spend-ledger.js, authorization-gate.js)
**I want** a re-apply to only widen scope/ceiling with fresh recorded operator provenance, the spend window anchored to session start (not reset by re-apply), nonfinite/overflow byte counts to fail HIGH, and a node-e-fs grant to never auto-approve a delete of tracked work
**So that** turbo cannot be used to silently widen live authorization, hide prior same-session paid calls, underreport spend, or auto-approve `fs.rmSync`/`unlinkSync` of the operator's uncommitted work (live, ramp-independent bypasses).

Linked granular stories: see `granular-stories.md` (S-3, S-4).
Linked requirements: `R-3`, `R-4`.

## H-3 — As the coverage/tier/planning enforcers, my --enforce mode is real, fail-closed, and legacy-scoped so the flip is safe

**As** the coverage/tier/planning enforcement layer (coverage-gate, coverage-gate-scan, provider-tier-check + config, planning-principles, check-ac-coverage, hooks-coverage allowlist, dispatch wrappers)
**I want** waivers to carry auditable provenance and surface in scan output; expected roles derived from an external source with RECORD_BACKED_CUTOFF-style legacy scoping; provider-tier `--enforce` to fail on selected-tier-unmet and on corrupt config (never erasing raised floors) with the envelope `ok` mirroring the verdict; planning-principles + check-ac-coverage to gain REAL fail-closed `--enforce` paths; the hooks-coverage allowlist to carry owner/expiry/reason (stale entries flagged); and the dispatch wrappers to thread the live mode so `mode_profiles`/`alpha_only_shapes` actually enforce
**So that** none of the "READY" gates is false-green under `--enforce` (provider-tier no longer masks a down T3-selected provider; planning-principles + ac-coverage stop exiting 0 on findings/unreadable artifacts) and the operator can flip every gate to blocking with real confidence — without redding historic records (scope-then-flip, never scope-as-loophole).

Linked granular stories: see `granular-stories.md` (S-5, S-6, S-7, S-8, S-9, S-10).
Linked requirements: `R-5`, `R-6`, `R-7`, `R-8`, `R-9`, `R-10`.
