# Cross-provider review — E-DISPATCH-PERFECT-001 W1+W2 (dispatch keystone edits)

Independent adversarial review of two dispatch-system changes. PRIMARY job: find **correctness bugs**, **security-invariant violations**, and **false-greens** (an enforcer/gate that passes when it shouldn't). The code was written by Claude — you are the cross-family second opinion.

## W1 — 3-provider security review firing
- `scripts/dispatch-review.js` (NEW): given `<role> <prompt>`, reads `registry-roles.passesOf(role)` and spawns ONE single-pass child PER pass IN PARALLEL — gemini/openai via `dispatch-agent.js --provider`, claude via `dispatch-claude.js` (dispatch-agent hard-refuses local claude). Merges **any-FAIL-holds**: `ok` = primary-lane liveness, `mergedVerdict` = fail if any lane fails/dies. Exit 0 iff all lanes alive.
- `scripts/sprint/epsilon-runtime.js` `spawnAgent` DISPATCH_AGENT branch: routes a role with `passesForRole(role).length > 1` through dispatch-review.js (else dispatch-agent.js direct). Both self-record (`recordedByCli=true`).
- `scripts/checks/security-pass-count.js` (NEW): HARD config-coherence (registry declares full distinct-provider chain + dispatch-review.js exists + ε routes to it) + REPORT-ONLY runtime ramp (post-cutoff reviews grouped by run_id|sprint_id|prompt_digest must have N distinct ok:true providers; only flags ≥2-but-<N groups, not lone standalone dispatches).

## W2 — GPT product-leadership chain
- `role-registry.json`: director-of-product/director-of-growth → openai/gpt-5.5/xhigh, product-lead → openai/gpt-5.5/high (+ fallback:claude); design-lead already openai. security-reviewer gained `third_pass:{claude,opus-4.8,xhigh}`.
- `dispatch-contract.json`: NEW rule `{tier:director,provider:openai}→cross_provider_consult_lead` inserted BEFORE the generic `{tier:director}→manager` (first-match). review_fallback.applies_to_classes gained cross_provider_consult_lead.

## Read
- The diff: `runtime/sp-dp-review/w1w2-keystone.diff`
- Full files: `scripts/dispatch-review.js`, `scripts/checks/security-pass-count.js`, `scripts/dispatch/registry-roles.js` (passesOf), `.claude/agents/_org/dispatch-contract.json` (class_derivation.rules + cross_provider_consult_lead + review_fallback), `.claude/agents/_org/role-registry.json` (security-reviewer + the GPT chain rows).

## Questions
1. dispatch-review.js: does the parallel spawn + merge have a race / a lane that can silently pass when it should fail? Is `mergedVerdict` correct (any-FAIL holds, dead lane = error)? Does the claude verdict get parsed (dispatch-claude returns `output`, not `parsed`)? Any case where a FAILing pass is missed?
2. ε routing: any way a multi-pass role gets dispatched WITHOUT going through dispatch-review.js (so only 1 pass fires)? Double-recording risk? Timeout: 3 parallel children under one parent `childBaseMs+grace` bound — can a slow pass be cut, and is that detected?
3. security-pass-count: can a partial review (2/3) escape the flag? Can a complete review (3/3) false-flag? Is the prompt_digest grouping robust (could two different reviews collide, or one review's passes fail to group)?
4. W2 rule precedence: is there ANY role for which inserting `{tier:director,provider:openai}` BEFORE `{tier:director}` changes a NON-director or mis-resolves a Claude director? Does the security-class invariant (build_chain→subprocess-claude; no reviewer poached) still hold?
5. Any false-green or declarative-lie: a key/rule that LOOKS wired but nothing fires it.

## Output
Write findings to `runtime/sp-dp-review/w1w2-review-out.md` (VERDICT PASS/FAIL + each finding: severity, file:line, why). Return a ≤8-line envelope: VERDICT, counts by severity, the single most important issue (or "no blocking issues").
