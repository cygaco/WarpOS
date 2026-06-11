# Granular Stories - E-PRODUCT-FOUNDATION-001 W0 telemetry seam

**Sprint:** `S-PF-01`
**PRD:** `.claude/project/sprint/requirements/S-PF-01/prd.md`

## S-1 - Add the boot-safe track seam

**As** a scaffolded app
**I want** `track(event, props)` plus a no-op fail-open sink
**So that** code can emit events without knowing whether an analytics provider is configured.

Linked: `H-1`, `R-1`.
COPY: `C-1`.
INPUTS: `IN-1`.
TRACE: `TR-1`.
Acceptance criteria: `AC-1.1` through `AC-1.4`.

## S-2 - Add the canonical lifecycle event source

**As** the telemetry seam
**I want** a single typed set of six lifecycle events
**So that** scaffold, lastmile, and future admin/feed consumers do not drift.

Linked: `H-1`, `H-2`, `R-2`.
COPY: `C-2`.
INPUTS: `IN-2`.
TRACE: `TR-2`.
Acceptance criteria: `AC-2.1` through `AC-2.3`.

## S-3 - Bind activation to early-derived, lastmile-confirmed semantics

**As** the product foundation
**I want** activation filled at canon time and confirmed or revised at lastmile
**So that** activation is never an empty placeholder during the first user window.

Linked: `H-2`, `R-3`.
COPY: `C-3`.
INPUTS: `IN-3`.
TRACE: `TR-3`.
Acceptance criteria: `AC-3.1` through `AC-3.4`.

## S-4 - Re-point lastmile analytics to enrich the seam

**As** lastmile analytics
**I want** to consume the six seam events as the canonical base
**So that** funnel and A/B guidance enrich the one event vocabulary instead of reinstalling a parallel tracker.

Linked: `H-3`, `R-4`.
COPY: `C-4`.
INPUTS: `IN-4`.
TRACE: `TR-4`.
Acceptance criteria: `AC-4.1` through `AC-4.3`.

## S-5 - Add supply-chain telemetry stages

**As** QA and future admin/feed consumers
**I want** correlation ids and a fixed stage vocabulary
**So that** a user action can be traced from intent through observed/read and a broken chain surfaces as a failure.

Linked: `H-2`, `H-3`, `R-5`.
COPY: `C-5`.
INPUTS: `IN-5`.
TRACE: `TR-5`.
Acceptance criteria: `AC-5.1` through `AC-5.3`.

## S-6 - Extend the scaffold enforcer and shipping proof

**As** the framework
**I want** scaffold coverage and manifests to prove the seam ships and false-green fixtures fail
**So that** W0 cannot close with a hollow telemetry contract.

Linked: `H-3`, `R-6`.
COPY: `C-6`.
INPUTS: `IN-6`.
TRACE: `TR-6`.
Acceptance criteria: `AC-6.1` through `AC-6.4`.
