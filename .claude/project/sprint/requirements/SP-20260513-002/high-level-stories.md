# High-Level Stories — WarpOS install/update provider smoke test + RCA

**Sprint:** `SP-20260513-002`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — Operator at install knows immediately whether providers work

**As** an operator running `/warp:install` (or `/warp:setup`) in a fresh project
**I want** the install to run a provider smoke test as its terminal step and fail loudly if any required provider is broken
**So that** I don't discover broken Codex/Gemini auth two hours into my first build session

Linked granular stories: `S-1`, `S-7`, `S-8`.
Linked requirements: `R-2`, `R-6`, `R-7`, `R-8`.

## H-2 — Operator at update has an explicit smoke gate

**As** an operator running `/warp:update --to X.Y.Z --apply` against an installed project
**I want** the update to run provider smoke as a post-update check declared by the capsule, and refuse to declare the update successful if any required provider goes red
**So that** version bumps don't silently leave my downstream project unable to dispatch agents

Linked granular stories: `S-2`, `S-6`, `S-7`.
Linked requirements: `R-1`, `R-6`, `R-7`.

## H-3 — Operator hitting red gets RCA + one-line fix, not generic suggestions

**As** an operator whose smoke just turned red
**I want** the framework to map the failure status to a named root cause and either apply a safe auto-fix or print one explicit remediation command
**So that** I'm not Googling cryptic CLI errors at 11pm to figure out whether the problem is my env var, my CLI version, or my account quota

Linked granular stories: `S-3`, `S-4`, `S-5`, `S-7`.
Linked requirements: `R-3`, `R-4`, `R-5`, `R-6`.
