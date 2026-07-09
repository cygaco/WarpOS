# SP-20260618-001 — Reap-fix learning (candidate ED for retro)

## What happened
U1 backend-builder reaped 3× at the 540s foreground clamp during context-load on a large
HIGH-risk migration. Root cause (α-diagnosed, confirmed): `scripts/dispatch-claude.js` defaults
to a 20-min bound, but `foregroundAwareTimeout` CLAMPS it to 540s (FOREGROUND_CEILING_MS) UNLESS
`WARPOS_DISPATCH_BACKGROUND=1` is set in the env. My U1 dispatches set `DISPATCH_BUILDER_TIMEOUT_MS=540000`
but did NOT set `WARPOS_DISPATCH_BACKGROUND=1`, so the wrapper clamped to 540s → reaped mid-context-load
before any edit on attempt 1, and mid-wiring on attempts 2-3.

## The fix (applied to U2 + U3)
Dispatch backgrounded WITH the background signal so the full 30-min window applies:
```
WARPOS_DISPATCH_BACKGROUND=1 DISPATCH_BUILDER_TIMEOUT_MS=1800000 \
  node scripts/dispatch-claude.js backend-builder <prompt> \
  --worktree .worktrees/SP-20260618-001-U1 --model opus
```
Run it backgrounded (run_in_background) → no foreground 600s harness kill, full child bound.

## Candidate ED (real enforcement gap — log at retro)
The wrapper/orchestrator should AUTO-SET WARPOS_DISPATCH_BACKGROUND=1 for a dispatch that is
actually going to run backgrounded (or warn loudly when a long DISPATCH_BUILDER_TIMEOUT_MS is
requested without the background signal, since it will be silently clamped to 540s). Today the
540s clamp is silent — a caller asking for 1800000ms gets 540000ms with no signal, and a complex
builder reaps. The mismatch between "requested timeout" and "effective (clamped) timeout" should
be self-detecting. This is the same loud-vs-silent class as ED-039/RI-004 (reap visibility).

Cross-ref: my memory feedback_reaped_builder_bounded_completion_retry (a reap after the 540s clamp
is GOOD telemetry — loud death > silent vanish) + reference_codex_empty_reap_provider_readiness.
The reap RECORD was loud (good); the CLAMP that caused it was silent (the gap).

## UPDATE — U2 hit TWO further failure modes (the fix is multi-layered)
- U2 attempt 1 (backgrounded, idle): SILENT DEATH — the detached bg dispatch + my monitor were
  BOTH dropped by the harness after ~47min with NO completion notification. gauntlet-verify =
  no-record. Going idle on a backgrounded dispatch is fatal: WG-6 confirmed AGAIN. Lesson: NEVER
  idle on a bg dispatch; ACTIVELY POLL every turn so a silent drop is caught by the poll, not an
  infinite wait.
- U2 attempt 2 (foreground `timeout 560`, actively polled): completed with builder_nonzero_exit —
  the harness `timeout 560` wrapper cut the builder mid-final-command at the 560s ceiling. KEY
  INSIGHT: even WITH WARPOS_DISPATCH_BACKGROUND=1 (which lifts the CHILD bound to 30min), the
  harness-imposed `timeout 560` (my own wrapper) is the BINDING ceiling once the harness backgrounds
  the call. So the effective bound = min(my `timeout`, harness-fg-kill, child-bound). The builder did
  NOT commit incrementally despite the prompt mandate → I recovered by committing the landed work
  myself + running the verified_by gates (all 9+8 PASS, ship-coverage GREEN) — the nonzero-exit was
  the timeout cut, NOT a real failure.
- NET refinements for U3: (a) actively poll, never idle on a bg dispatch; (b) the binding bound is my
  `timeout` value, so size it realistically; (c) ε commits the worktree itself after a cut (don't rely
  on the builder committing); (d) ALWAYS run the verified_by gates myself — builder_nonzero_exit can be
  a timeout-cut, not a real fail, and only the gates tell the truth.
