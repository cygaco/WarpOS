<!-- requirement-format-legacy -->
# Acceptance Criteria — E-DISPATCH-SHAPE-001 W2-core: shape-door report-only parity + per-wrapper enforce-ramp scaffolding

**Sprint:** `SP-20260616-001`
**PRD:** `.claude/project/sprint/requirements/SP-20260616-001/prd.md`

> Each AC is testable. Tests land under `tests/regression/SP-20260616-001/`.
> Design authority: epic plan §12 + β DECIDE 0.89 (4 HOW-constraints) + DoE SOUND-TO-BUILD (C1/C2/B refinements). Default ships **report-only**; no wrapper enforce-by-default (operator-gated ramp).

## S-1 — Shared `shapeDoor()` gate authority (dispatch-shape.js)

- AC-1.1: Given `WARPOS_DISABLE_SHAPE_DOOR=1`, when `shapeDoor()` runs in ANY mode (incl. enforce) with a high-severity mismatch, then it returns `{action:"proceed", mode:"report"}` — kill-switch checked FIRST, overrides enforce unconditionally (β#3).
  verified_by: tests/regression/SP-20260616-001/shape-door.test.js::kill-switch-overrides-enforce
- AC-1.2: Given the resolver throws (shapeMismatch errors), when `shapeDoor()` runs, then it returns `{action:"proceed", reason:"resolver-threw-fail-open"}` — fail-OPEN, never blocks (β#3).
  verified_by: tests/regression/SP-20260616-001/shape-door.test.js::resolver-error-fail-open
- AC-1.3: Given `WARPOS_SHAPE_DOOR` unset or `=report` and a high-severity mismatch, when `shapeDoor()` runs, then `action==="proceed"` (advisory only; exit unaffected).
  verified_by: tests/regression/SP-20260616-001/shape-door.test.js::report-mode-advisory-proceeds
- AC-1.4: Given `WARPOS_SHAPE_DOOR=enforce`, a high-severity mismatch, and `opts.sanctioned=false`, when `shapeDoor()` runs, then `action==="refuse"` with a named `reason` (caller exits 2, distinct from the contract-consult exit 1).
  verified_by: tests/regression/SP-20260616-001/shape-door.test.js::enforce-high-severity-refuses
- AC-1.5: Given `opts.sanctioned=true` (the sanctioned-lane verdict), when `shapeDoor()` runs in enforce with a mismatch, then `action==="proceed"` — sanctioned lane never refused (β#1, preserves FIX-A3).
  verified_by: tests/regression/SP-20260616-001/shape-door.test.js::sanctioned-lane-proceeds-under-enforce

## S-2 — Enforce-ramp-ready adopters: dispatch-claude, dispatch-agent, epsilon CLAUDE_RAW

- AC-2.1: Given dispatch-claude (actualShape `subprocess-claude`) and dispatch-agent (actualShape `subprocess-cross-provider`), when dispatched in report mode (default), then behavior is byte-identical to pre-change (advisory only, no exit change) — zero report-mode regression (β#4).
  verified_by: tests/regression/SP-20260616-001/wrapper-door.test.js::report-mode-no-regression-both-wrappers
- AC-2.2: Given dispatch-claude `--review-fallback` on a SANCTIONED reviewer with `WARPOS_SHAPE_DOOR=enforce`, then the lane proceeds (never exit 2); given a NON-sanctioned role under enforce, then it refuses (exit 2) — the sanctioned-lane verdict flows through `opts.sanctioned` (β#1).
  verified_by: tests/regression/SP-20260616-001/wrapper-door.test.js::dispatch-claude-sanctioned-lane-preserved
- AC-2.3: Given epsilon-runtime's CLAUDE_RAW path (`claude -p --agent <role>`), when it spawns, then it consults the door (actualShape `subprocess-claude`); the DISPATCH_AGENT / DISPATCH_CLAUDE delegating routes do NOT consult (no double-consult — DoE-B).
  verified_by: tests/regression/SP-20260616-001/epsilon-door.test.js::claude-raw-doored-no-double-consult

## S-3 — dispatch-skill report-only adoption + skill-vocabulary honesty (DoE-C1)

- AC-3.1: Given dispatch-skill dispatching any skill with `WARPOS_SHAPE_DOOR=enforce`, then dispatch-skill STILL proceeds (report-only-pinned — it never refuses), because the resolver routes `{kind:skill}` to `inline` (not earned-subprocess), so enforce-for-skills is blocked on a future `subprocess-skill` resolver shape.
  verified_by: tests/regression/SP-20260616-001/skill-door.test.js::skill-report-only-pinned-under-enforce
- AC-3.2: Given the limitation in AC-3.1, when the codebase is inspected, then it is documented (dispatch guide) AND logged as an enforcement-debt entry (enforce-for-skills pending resolver subprocess-skill vocabulary).
  verified_by: tests/regression/SP-20260616-001/skill-door.test.js::skill-enforce-limitation-documented

## S-4 — Two-toggle coherence, back-compat, docs (β#2, DoE-C2)

- AC-4.1: Given the shape-resolver self-detection migrates to `WARPOS_SHAPE_DOOR`, when `WARPOS_DISPATCH_CONTRACT_ENFORCE` is grepped across `.js/.md/.json`, then every shape-refusal caller is accounted for (migrated to the door OR back-compat-aliased so the door honors it); the separate contract-CONSULT block keeps its own toggle (one switch for shape self-detection).
  verified_by: tests/regression/SP-20260616-001/wrapper-door.test.js::two-toggle-coherence-backcompat
- AC-4.2: Given the dispatch guide + epsilon.md, when read, then they document the `WARPOS_SHAPE_DOOR=report|enforce` door, the `WARPOS_DISABLE_SHAPE_DOOR` kill-switch, the per-wrapper enforce ramp, and the dispatch-skill report-only-pinned limitation.
  verified_by: tests/regression/SP-20260616-001/skill-door.test.js::contract-docs-present
