# CROSS-PROVIDER CODE REVIEW — E-DISPATCH-SHAPE-001 W2-core (SP-20260616-001)

You are a BACKEND/INFRA code reviewer giving a BINDING verdict (PASS | FAIL) on a high-blast change to WarpOS's dispatch substrate. Be adversarial: try to break it. Your verdict is binding — a FAIL blocks the merge.

## What this change is

The "shape door" (W2-core, the report-only first rung of a per-wrapper enforce ramp). WarpOS has a shape resolver (`scripts/dispatch/dispatch-shape.js#resolveShape`/`shapeMismatch`) that decides the correct dispatch shape per unit. Before this change, only 2 of 4 dispatch entry points consulted it report-only. This change adds a single shared `shapeDoor()` helper and routes all 4 entry points through it, so a role routed through the WRONG wrapper self-detects.

**Ships REPORT-ONLY by default — no wrapper enforces by default** (the per-wrapper report→enforce flip is operator-gated). The enforce path exists + is tested but dormant.

## The door contract (what to verify)

`shapeDoor(actualShape, unit, env, opts) -> {action:"proceed"|"refuse", mode, severity, suppressed, reason, mismatch}`

Branch order (must be EXACTLY this — explicit branches, no implicit catch-all):
1. kill-switch (`WARPOS_DISABLE_SHAPE_DOOR`) OR `opts.reportOnlyPin` → force mode=report (beats enforce).
2. resolver throws → fail-OPEN proceed (reason "resolver-threw-fail-open"). A self-detection gate must NEVER break a working dispatch.
3. no mismatch OR `opts.sanctioned===true` → proceed (sanctioned suppresses the advisory).
4. mode=enforce AND severity==="high" → REFUSE (caller exits 2, named reason).
5. else → advisory proceed.

Toggles: `WARPOS_SHAPE_DOOR=report|enforce` (default report); `WARPOS_DISABLE_SHAPE_DOOR` kill-switch; `WARPOS_DISPATCH_CONTRACT_ENFORCE=block` is a DEPRECATED back-compat alias → enforce (so old CI/fixtures keep getting shape-refusal — the rename-bug class).

## The 4 binding design constraints (from Beta) + 3 from the Director of Engineering — verify each is honored

- β#1 SANCTIONED LANE: dispatch-claude's `--review-fallback` suppression must key on the sanctioned-lane VERDICT (`fallbackSanctioned` = sanctionedLane(...).sanctioned), NOT the bare flag. Passed to the door as `opts.sanctioned`; sanctioned → proceed in BOTH modes (never bricks the lane). This preserves the prior FIX-A3.
- β#2 TWO-TOGGLE COHERENCE: `WARPOS_SHAPE_DOOR` is THE shape-enforce authority; the wrappers' old inline `WARPOS_DISPATCH_CONTRACT_ENFORCE` shape check is folded INTO the door (as the alias). The SEPARATE contract-consult block keeps its OWN `WARPOS_DISPATCH_CONTRACT_ENFORCE` toggle. One switch per concern.
- β#3 EXPLICIT BRANCHES + EXIT CODE: kill-switch first; enforce refusal = exit 2 + named reason, DISTINCT from the contract-consult block's exit 1.
- β#4 NO REGRESSION: report-mode behavior byte-identical to before on the 2 already-consulting wrappers.
- DoE-B EPSILON: epsilon-runtime consults the door ONLY on its CLAUDE_RAW path (raw `claude -p --agent`). Its DISPATCH_AGENT/DISPATCH_CLAUDE routes shell to the already-doored wrappers — doubling the consult would risk a divergent verdict. On refuse it returns a failed dispatch (NOT process.exit — ε is long-running).
- DoE-C1 SKILL PIN: dispatch-skill subprocess-spawns skills, but the resolver routes {kind:skill} to `inline` (skills aren't earned-subprocess). So under enforce it would false-refuse EVERY skill. It is therefore PINNED report-only (`reportOnlyPin:true`) — surfaces the advisory, never refuses. Logged as ED-057.
- DoE-C2 BACK-COMPAT: the env-var rename must not silently drop shape-refusal for anything that set the old var.

## Test evidence (already run, all green)

- New: shape-door.test.js (9), wrapper-door.test.js (9), epsilon-door.test.js (6), skill-door.test.js (9) = 33 assertions PASS.
- Regression (zero new failures): dispatch-shape 31/31, review-fallback-shape (FIX-A3) 21/21, build-chain-registry-gate 29/29, wrapper-mode-binding 3/3, dispatch-skill 11/11, dispatch-claude 14/14.

## YOUR JOB

Adversarially review the DIFF below. Look for: (1) a branch-order bug that could refuse a legitimate dispatch or fail to fail-open; (2) a regression in the dispatch-claude sanctioned-lane path (the FIX-A3 class); (3) the epsilon double-consult / process.exit-in-conductor risk; (4) the skill false-refuse-storm risk (is the pin actually airtight?); (5) the exit 1 vs 2 confusion; (6) any case where report-only is NOT actually byte-identical; (7) the back-compat alias dropping shape-refusal. 

Return STRICT JSON only: {"verdict":"PASS"|"FAIL","confidence":0.0-1.0,"blocking_findings":[{"severity":"high|med|low","where":"file:line-ish","issue":"...","fix":"..."}],"non_blocking_notes":["..."],"summary":"one line"}

== DIFF + NEW TEST FILES FOLLOW ==
