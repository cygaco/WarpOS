# Granular Stories — WarpOS install/update provider smoke test + RCA

**Sprint:** `SP-20260513-002`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Provider smoke orchestrator (`provider-smoke.js`) with proper exit codes

**As** the framework
**I want** a `scripts/warpos/provider-smoke.js` orchestrator that wraps `probeAll`, runs RCA + safe autofix, and exits with 0 (green/yellow) or 2 (red)
**So that** any lifecycle step (install, update, standalone) gets the same behavior and exit-code contract

Acceptance criteria: AC-1.1, AC-1.2, AC-1.3 (see `acceptance-criteria.md`).

Linked: `H-1`, `H-2`, `R-2`, `R-7`.
COPY: `C-1` (smoke header + verdict lines).
INPUTS: `IN-1` (`--providers`), `IN-2` (`--probe`), `IN-3` (`--exit-on-yellow`), `IN-4` (`--no-autofix`), `IN-5` (`--json`).
TRACE: `TR-1` (smoke event).

## S-2 — Declare `provider-smoke` in every release.json `postUpdateChecks`

**As** the framework
**I want** every capsule's `framework/releases/*/release.json` (current 0.5.0 and onward) to include `node scripts/warpos/provider-smoke.js --providers claude,openai,gemini` in `postUpdateChecks`
**So that** `/warp:update` automatically runs smoke after applying the capsule

Acceptance criteria: AC-2.1, AC-2.2 (see `acceptance-criteria.md`).

Linked: `H-2`, `R-1`.
COPY: `C-2` (post-update smoke success/failure header).
INPUTS: — (driven by release.json).
TRACE: `TR-2` (postUpdateChecks fired smoke).

## S-3 — Failure-mode catalog v1 (`provider-failure-modes.json`)

**As** the framework
**I want** a version-controlled, schema-validated catalog at `.claude/agents/00-alex/.system/policy/provider-failure-modes.json` covering every status produced by `provider-health.js`
**So that** RCA + autofix are data-driven, inspectable, and reviewable per pull request

Acceptance criteria: AC-3.1, AC-3.2, AC-3.3 (see `acceptance-criteria.md`).

Linked: `H-3`, `R-3`.
COPY: `C-3` (per-status remediation message).
INPUTS: — (data file).
TRACE: `TR-3` (catalog version + status hit).

## S-4 — RCA module (`provider-rca.js`)

**As** the smoke orchestrator
**I want** a pure-function RCA module that takes a `probeResult` and returns the matching catalog entry (or a default `unknown_error` entry)
**So that** classification logic is unit-testable in isolation

Acceptance criteria: AC-4.1, AC-4.2 (see `acceptance-criteria.md`).

Linked: `H-3`, `R-4`.
COPY: — (consumed by orchestrator).
INPUTS: — (input is a probeResult).
TRACE: `TR-4` (rca event with root_cause).

## S-5 — Auto-fix dispatcher (`provider-autofix.js`) — safe-only

**As** the smoke orchestrator
**I want** an autofix dispatcher that runs only entries with `safe_to_autofix: true`, applies the fix recipe, re-probes once (no loop), and reports `{ applied, success }`
**So that** the framework can heal a known class of failures without operator interaction AND without ever risking the operator's auth config

Acceptance criteria: AC-5.1, AC-5.2, AC-5.3 (see `acceptance-criteria.md`).

Linked: `H-3`, `R-5`.
COPY: `C-4` (autofix applied / autofix failed messages).
INPUTS: `IN-4` (`--no-autofix`).
TRACE: `TR-5` (autofix attempt + result).

## S-6 — `/warp:install` and `/warp:setup` wire smoke as terminal step

**As** the install/setup procedure
**I want** the documented happy-path to invoke `node scripts/warpos/provider-smoke.js --providers <required>` as the final step before reporting install complete
**So that** install matches the desired-behavior contract from PRD

Acceptance criteria: AC-6.1, AC-6.2 (see `acceptance-criteria.md`).

Linked: `H-1`, `R-2`.
COPY: `C-5` (install-terminal smoke result block).
INPUTS: — (driven by command doc).
TRACE: `TR-2` (install fired smoke).

## S-7 — Events logging + log file path

**As** the framework
**I want** every smoke run, RCA decision, and autofix attempt to append to `paths.eventsFile` via `lib/logger.js` with `cat: "provider-smoke"`
**So that** `/check:patterns`, `/issues:scan`, and `/learn:deep` can surface recurring provider failures across runs

Acceptance criteria: AC-7.1, AC-7.2 (see `acceptance-criteria.md`).

Linked: `H-1`, `H-2`, `H-3`, `R-6`.
COPY: — (events are JSON, not user copy).
INPUTS: — (system).
TRACE: `TR-1`, `TR-2`, `TR-3`, `TR-4`, `TR-5`.

## S-8 — Cross-platform: Windows stdin-bug guard reaffirmed

**As** the framework
**I want** the smoke orchestrator to use ONLY `probeAll` / `execSync`-based probes (never `cat … | codex exec`) and the existing `dispatch-route-guard` hook to remain in force during smoke runs
**So that** smoke can't re-introduce the LRN-2026-04-17-n / LRN-2026-04-30 binding-gap bug class

Acceptance criteria: AC-8.1, AC-8.2 (see `acceptance-criteria.md`).

Linked: `H-1`, `H-2`, `R-8`.
COPY: — (internal contract).
INPUTS: — (system).
TRACE: — (covered by existing audit events from `dispatch-route-guard`).
