<!-- requirement-format-legacy -->
# Granular Stories — Canon engine — _requirements/00-canonical/* generator with capped research (0.15.0 sprint 2)

**Sprint:** `SP-20260525-022`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-022\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Author framework/templates/canonical/* — 7 narrative MD templates + 4 structured JSON templates (generic, no product content).

**As** the user
**I want** Author framework/templates/canonical/* — 7 narrative MD templates + 4 structured JSON templates (generic, no product content).
**So that** A fresh product goes from intent → grounded canonical documentation automatically, even with thin operator input (research fills bounded gaps). This is the missing capability behind JTBD-3 ('just WarpOS' → canonical docs + roadmap) and the core of the 0.14.0 Managerial Agent Layer, available now as spinup's canon phase.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Define schemas/canon/research-fields.schema.json — the named research fields per doc (the cap).

**As** the user
**I want** Define schemas/canon/research-fields.schema.json — the named research fields per doc (the cap).
**So that** A fresh product goes from intent → grounded canonical documentation automatically, even with thin operator input (research fills bounded gaps). This is the missing capability behind JTBD-3 ('just WarpOS' → canonical docs + roadmap) and the core of the 0.14.0 Managerial Agent Layer, available now as spinup's canon phase.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Build scripts/canon/generate.js — intent -> render templates + fill from intent -> emit 11 artifacts.

**As** the user
**I want** Build scripts/canon/generate.js — intent -> render templates + fill from intent -> emit 11 artifacts.
**So that** A fresh product goes from intent → grounded canonical documentation automatically, even with thin operator input (research fills bounded gaps). This is the missing capability behind JTBD-3 ('just WarpOS' → canonical docs + roadmap) and the core of the 0.14.0 Managerial Agent Layer, available now as spinup's canon phase.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Integrate capped research — fill ONLY schema-named gaps via research:*, validate research output against the cap schema, degrade gracefully on thin/failed research.

**As** the user
**I want** Integrate capped research — fill ONLY schema-named gaps via research:*, validate research output against the cap schema, degrade gracefully on thin/failed research.
**So that** A fresh product goes from intent → grounded canonical documentation automatically, even with thin operator input (research fills bounded gaps). This is the missing capability behind JTBD-3 ('just WarpOS' → canonical docs + roadmap) and the core of the 0.14.0 Managerial Agent Layer, available now as spinup's canon phase.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Validate output — narrative docs pass section-presence; JSON artifacts pass their schemas; cross-references resolve.

**As** the user
**I want** Validate output — narrative docs pass section-presence; JSON artifacts pass their schemas; cross-references resolve.
**So that** A fresh product goes from intent → grounded canonical documentation automatically, even with thin operator input (research fills bounded gaps). This is the missing capability behind JTBD-3 ('just WarpOS' → canonical docs + roadmap) and the core of the 0.14.0 Managerial Agent Layer, available now as spinup's canon phase.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Wire bootstrap:spinup canon phase (--phase canon) to invoke the engine.

**As** the user
**I want** Wire bootstrap:spinup canon phase (--phase canon) to invoke the engine.
**So that** A fresh product goes from intent → grounded canonical documentation automatically, even with thin operator input (research fills bounded gaps). This is the missing capability behind JTBD-3 ('just WarpOS' → canonical docs + roadmap) and the core of the 0.14.0 Managerial Agent Layer, available now as spinup's canon phase.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Fixture end-to-end test — a sample intent produces all 11 valid artifacts (the verify-before-claim for this engine).

**As** the user
**I want** Fixture end-to-end test — a sample intent produces all 11 valid artifacts (the verify-before-claim for this engine).
**So that** A fresh product goes from intent → grounded canonical documentation automatically, even with thin operator input (research fills bounded gaps). This is the missing capability behind JTBD-3 ('just WarpOS' → canonical docs + roadmap) and the core of the 0.14.0 Managerial Agent Layer, available now as spinup's canon phase.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

