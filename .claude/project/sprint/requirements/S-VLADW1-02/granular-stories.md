<!-- requirement-format-legacy -->
# Granular Stories — Job #1 — port lastmile detect/score/adapters into the Vlad engine, adopt score.js as the ONE readiness number, mint receipt v1 from portfolio dogfood

**Sprint:** `S-VLADW1-02`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-02\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Verify each cited port reference (path AND line) against its source before porting, and record the verification result — including any citation that turns out to be wrong.

**As** the user
**I want** Verify each cited port reference (path AND line) against its source before porting, and record the verification result — including any citation that turns out to be wrong.
**So that** A founder with a prototype points Vlad at their repo and gets back an honest readiness audit: what Vlad did, what it verified, and the one thing it needs. It degrades honestly — a repo with no tests is reported 'NOT verified', never scored as if it passed. This is the first Vlad capability that reaches a user and the evidence base for the receipt contract the rest of v1 depends on.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Copy detect/score/adapters into the engine as a port, leaving the WarpOS originals untouched.

**As** the user
**I want** Copy detect/score/adapters into the engine as a port, leaving the WarpOS originals untouched.
**So that** A founder with a prototype points Vlad at their repo and gets back an honest readiness audit: what Vlad did, what it verified, and the one thing it needs. It degrades honestly — a repo with no tests is reported 'NOT verified', never scored as if it passed. This is the first Vlad capability that reaches a user and the evidence base for the receipt contract the rest of v1 depends on.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Remove the WarpOS-specific refusals in the ported copy only, and prove none fires on a non-WarpOS repo.

**As** the user
**I want** Remove the WarpOS-specific refusals in the ported copy only, and prove none fires on a non-WarpOS repo.
**So that** A founder with a prototype points Vlad at their repo and gets back an honest readiness audit: what Vlad did, what it verified, and the one thing it needs. It degrades honestly — a repo with no tests is reported 'NOT verified', never scored as if it passed. This is the first Vlad capability that reaches a user and the evidence base for the receipt contract the rest of v1 depends on.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Adopt score.js as the readiness scorer; do not port the checklist proxy.

**As** the user
**I want** Adopt score.js as the readiness scorer; do not port the checklist proxy.
**So that** A founder with a prototype points Vlad at their repo and gets back an honest readiness audit: what Vlad did, what it verified, and the one thing it needs. It degrades honestly — a repo with no tests is reported 'NOT verified', never scored as if it passed. This is the first Vlad capability that reaches a user and the evidence base for the receipt contract the rest of v1 depends on.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Re-source the FOUNDERS_CHECKLIST-dependent dimension, or make it report NOT SCORED explicitly rather than defaulting to a number.

**As** the user
**I want** Re-source the FOUNDERS_CHECKLIST-dependent dimension, or make it report NOT SCORED explicitly rather than defaulting to a number.
**So that** A founder with a prototype points Vlad at their repo and gets back an honest readiness audit: what Vlad did, what it verified, and the one thing it needs. It degrades honestly — a repo with no tests is reported 'NOT verified', never scored as if it passed. This is the first Vlad capability that reaches a user and the evidence base for the receipt contract the rest of v1 depends on.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Add an enforcer that fails the build if a second readiness number appears in the product repo.

**As** the user
**I want** Add an enforcer that fails the build if a second readiness number appears in the product repo.
**So that** A founder with a prototype points Vlad at their repo and gets back an honest readiness audit: what Vlad did, what it verified, and the one thing it needs. It degrades honestly — a repo with no tests is reported 'NOT verified', never scored as if it passed. This is the first Vlad capability that reaches a user and the evidence base for the receipt contract the rest of v1 depends on.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Implement the intake fallback that triggers when stack detection cannot classify a repo.

**As** the user
**I want** Implement the intake fallback that triggers when stack detection cannot classify a repo.
**So that** A founder with a prototype points Vlad at their repo and gets back an honest readiness audit: what Vlad did, what it verified, and the one thing it needs. It degrades honestly — a repo with no tests is reported 'NOT verified', never scored as if it passed. This is the first Vlad capability that reaches a user and the evidence base for the receipt contract the rest of v1 depends on.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — Emit 'NOT verified' for every dimension the repo provides no evidence for, and never substitute an inferred pass.

**As** the user
**I want** Emit 'NOT verified' for every dimension the repo provides no evidence for, and never substitute an inferred pass.
**So that** A founder with a prototype points Vlad at their repo and gets back an honest readiness audit: what Vlad did, what it verified, and the one thing it needs. It degrades honestly — a repo with no tests is reported 'NOT verified', never scored as if it passed. This is the first Vlad capability that reaches a user and the evidence base for the receipt contract the rest of v1 depends on.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-9 — Run the audit across the >=3 authorized corpus repos and capture the observations the receipt interior needs.

**As** the user
**I want** Run the audit across the >=3 authorized corpus repos and capture the observations the receipt interior needs.
**So that** A founder with a prototype points Vlad at their repo and gets back an honest readiness audit: what Vlad did, what it verified, and the one thing it needs. It degrades honestly — a repo with no tests is reported 'NOT verified', never scored as if it passed. This is the first Vlad capability that reaches a user and the evidence base for the receipt contract the rest of v1 depends on.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-10 — Mint receipt interior v1 from those observations, filling ENGINE's untyped slots without changing the envelope.

**As** the user
**I want** Mint receipt interior v1 from those observations, filling ENGINE's untyped slots without changing the envelope.
**So that** A founder with a prototype points Vlad at their repo and gets back an honest readiness audit: what Vlad did, what it verified, and the one thing it needs. It degrades honestly — a repo with no tests is reported 'NOT verified', never scored as if it passed. This is the first Vlad capability that reaches a user and the evidence base for the receipt contract the rest of v1 depends on.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

