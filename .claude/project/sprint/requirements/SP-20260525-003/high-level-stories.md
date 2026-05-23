<!-- requirement-format-legacy -->
# High-Level Stories — Orchestrator-Beta bridge — choose dispatch-from-subprocess or halt-at-Beta-boundary (milestone 0.11.0 sprint 1)

**Sprint:** `SP-20260525-003`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-003\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As Alpha (running /sprint:full), I consult Beta at each Phase boundary and receive a real verdict that shapes downstream behavior.

**As** the user
**I want** As Alpha (running /sprint:full), I consult Beta at each Phase boundary and receive a real verdict that shapes downstream behavior.
**So that** Every `sprint_full_beta_consult` event in `events.jsonl` reflects an actual SendMessage round-trip to Beta with a real verdict (DECIDE | DIRECTIVE | ESCALATE) and real reasoning. The operator can `grep events.jsonl | jq` to audit β-consultation cadence and see it matches `_docs/sprint/AUTONOMY.md`'s declared policy. ESCALATE verdicts halt the sprint reliably. The autonomy ladder rungs become load-bearing instead of decorative.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As the operator, I see in `events.jsonl` that every Beta consult is real (non-placeholder verdict + message + latency) — the cadence I see in AUTONOMY.md matches reality.

**As** the user
**I want** As the operator, I see in `events.jsonl` that every Beta consult is real (non-placeholder verdict + message + latency) — the cadence I see in AUTONOMY.md matches reality.
**So that** Every `sprint_full_beta_consult` event in `events.jsonl` reflects an actual SendMessage round-trip to Beta with a real verdict (DECIDE | DIRECTIVE | ESCALATE) and real reasoning. The operator can `grep events.jsonl | jq` to audit β-consultation cadence and see it matches `_docs/sprint/AUTONOMY.md`'s declared policy. ESCALATE verdicts halt the sprint reliably. The autonomy ladder rungs become load-bearing instead of decorative.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
