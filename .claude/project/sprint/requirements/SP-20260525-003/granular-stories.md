<!-- requirement-format-legacy -->
# Granular Stories — Orchestrator-Beta bridge — choose dispatch-from-subprocess or halt-at-Beta-boundary (milestone 0.11.0 sprint 1)

**Sprint:** `SP-20260525-003`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-003\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Design phase: write a brief ADR comparing options (a) bridge vs (b) halt-at-boundary; operator picks based on UX + complexity preference

**As** the user
**I want** Design phase: write a brief ADR comparing options (a) bridge vs (b) halt-at-boundary; operator picks based on UX + complexity preference
**So that** Every `sprint_full_beta_consult` event in `events.jsonl` reflects an actual SendMessage round-trip to Beta with a real verdict (DECIDE | DIRECTIVE | ESCALATE) and real reasoning. The operator can `grep events.jsonl | jq` to audit β-consultation cadence and see it matches `_docs/sprint/AUTONOMY.md`'s declared policy. ESCALATE verdicts halt the sprint reliably. The autonomy ladder rungs become load-bearing instead of decorative.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — If option (b): extend /sprint:full CLI to accept --beta-verdict + --beta-message + --pending-phase; halt at each boundary with consult-pending checkpoint

**As** the user
**I want** If option (b): extend /sprint:full CLI to accept --beta-verdict + --beta-message + --pending-phase; halt at each boundary with consult-pending checkpoint
**So that** Every `sprint_full_beta_consult` event in `events.jsonl` reflects an actual SendMessage round-trip to Beta with a real verdict (DECIDE | DIRECTIVE | ESCALATE) and real reasoning. The operator can `grep events.jsonl | jq` to audit β-consultation cadence and see it matches `_docs/sprint/AUTONOMY.md`'s declared policy. ESCALATE verdicts halt the sprint reliably. The autonomy ladder rungs become load-bearing instead of decorative.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — If option (a): design file-drop schema (consult-request-<phase>.json + consult-verdict-<phase>.json); add runtime-side poller (smart-context extension OR new hook)

**As** the user
**I want** If option (a): design file-drop schema (consult-request-<phase>.json + consult-verdict-<phase>.json); add runtime-side poller (smart-context extension OR new hook)
**So that** Every `sprint_full_beta_consult` event in `events.jsonl` reflects an actual SendMessage round-trip to Beta with a real verdict (DECIDE | DIRECTIVE | ESCALATE) and real reasoning. The operator can `grep events.jsonl | jq` to audit β-consultation cadence and see it matches `_docs/sprint/AUTONOMY.md`'s declared policy. ESCALATE verdicts halt the sprint reliably. The autonomy ladder rungs become load-bearing instead of decorative.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Implement chosen option in /sprint:full Phase 1-5 boundaries

**As** the user
**I want** Implement chosen option in /sprint:full Phase 1-5 boundaries
**So that** Every `sprint_full_beta_consult` event in `events.jsonl` reflects an actual SendMessage round-trip to Beta with a real verdict (DECIDE | DIRECTIVE | ESCALATE) and real reasoning. The operator can `grep events.jsonl | jq` to audit β-consultation cadence and see it matches `_docs/sprint/AUTONOMY.md`'s declared policy. ESCALATE verdicts halt the sprint reliably. The autonomy ladder rungs become load-bearing instead of decorative.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Schema: define `sprint_full_beta_consult` event subtype in events schema; ensure verdict + message + latency_ms + model captured

**As** the user
**I want** Schema: define `sprint_full_beta_consult` event subtype in events schema; ensure verdict + message + latency_ms + model captured
**So that** Every `sprint_full_beta_consult` event in `events.jsonl` reflects an actual SendMessage round-trip to Beta with a real verdict (DECIDE | DIRECTIVE | ESCALATE) and real reasoning. The operator can `grep events.jsonl | jq` to audit β-consultation cadence and see it matches `_docs/sprint/AUTONOMY.md`'s declared policy. ESCALATE verdicts halt the sprint reliably. The autonomy ladder rungs become load-bearing instead of decorative.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Test (paid_skip): mock Beta dispatch in test suite; exercise DECIDE / DIRECTIVE / ESCALATE paths; verify ESCALATE triggers halt

**As** the user
**I want** Test (paid_skip): mock Beta dispatch in test suite; exercise DECIDE / DIRECTIVE / ESCALATE paths; verify ESCALATE triggers halt
**So that** Every `sprint_full_beta_consult` event in `events.jsonl` reflects an actual SendMessage round-trip to Beta with a real verdict (DECIDE | DIRECTIVE | ESCALATE) and real reasoning. The operator can `grep events.jsonl | jq` to audit β-consultation cadence and see it matches `_docs/sprint/AUTONOMY.md`'s declared policy. ESCALATE verdicts halt the sprint reliably. The autonomy ladder rungs become load-bearing instead of decorative.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Test (live, optional): one end-to-end run with real Beta — log the events as evidence

**As** the user
**I want** Test (live, optional): one end-to-end run with real Beta — log the events as evidence
**So that** Every `sprint_full_beta_consult` event in `events.jsonl` reflects an actual SendMessage round-trip to Beta with a real verdict (DECIDE | DIRECTIVE | ESCALATE) and real reasoning. The operator can `grep events.jsonl | jq` to audit β-consultation cadence and see it matches `_docs/sprint/AUTONOMY.md`'s declared policy. ESCALATE verdicts halt the sprint reliably. The autonomy ladder rungs become load-bearing instead of decorative.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — Update `_docs/sprint/AUTONOMY.md`: remove 'aspirational' disclaimer; add 'enforced by [pattern]'

**As** the user
**I want** Update `_docs/sprint/AUTONOMY.md`: remove 'aspirational' disclaimer; add 'enforced by [pattern]'
**So that** Every `sprint_full_beta_consult` event in `events.jsonl` reflects an actual SendMessage round-trip to Beta with a real verdict (DECIDE | DIRECTIVE | ESCALATE) and real reasoning. The operator can `grep events.jsonl | jq` to audit β-consultation cadence and see it matches `_docs/sprint/AUTONOMY.md`'s declared policy. ESCALATE verdicts halt the sprint reliably. The autonomy ladder rungs become load-bearing instead of decorative.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-9 — Update `_docs/sprint/CRASH_RECOVERY.md` if option (b): new halt_reason + resume contract

**As** the user
**I want** Update `_docs/sprint/CRASH_RECOVERY.md` if option (b): new halt_reason + resume contract
**So that** Every `sprint_full_beta_consult` event in `events.jsonl` reflects an actual SendMessage round-trip to Beta with a real verdict (DECIDE | DIRECTIVE | ESCALATE) and real reasoning. The operator can `grep events.jsonl | jq` to audit β-consultation cadence and see it matches `_docs/sprint/AUTONOMY.md`'s declared policy. ESCALATE verdicts halt the sprint reliably. The autonomy ladder rungs become load-bearing instead of decorative.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-9`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-10 — Close enforcement-debt entry for this policy via `/enforcement:list` review (the 'Beta consultation cadence' debt entry should be markable as resolved)

**As** the user
**I want** Close enforcement-debt entry for this policy via `/enforcement:list` review (the 'Beta consultation cadence' debt entry should be markable as resolved)
**So that** Every `sprint_full_beta_consult` event in `events.jsonl` reflects an actual SendMessage round-trip to Beta with a real verdict (DECIDE | DIRECTIVE | ESCALATE) and real reasoning. The operator can `grep events.jsonl | jq` to audit β-consultation cadence and see it matches `_docs/sprint/AUTONOMY.md`'s declared policy. ESCALATE verdicts halt the sprint reliably. The autonomy ladder rungs become load-bearing instead of decorative.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-10`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

