<!-- requirement-format-legacy -->
# COPY Requirements — Cross-family findings fix sprint — 6 gemini re-review findings (epsilon-runtime spawn race, fallback ENFORCE brick, hardcoded BUILD_CHAIN_ROLES, spoofed-ts window, sprint_id correlation, verifyGauntlet parse refusal)

**Sprint:** `SP-20260611-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\prd.md`

> COPY captures user-visible text. This is an ENGINE sprint — the "user" is the
> operator/orchestrator reading stderr. The COPY contract here is the refusal and
> advisory strings the fixes emit: they must self-identify the enforcer, the reason,
> and the recovery path (ED-043 class: refusals must self-identify). Exact final
> wording is builder-chosen; each entry pins the REQUIRED content elements.

## C-1 — epsilon spawn-bound grace note (linked story `S-1`)

**Context:** No new operator-facing string required; if the parent backstop ever fires, the existing death-record path is reused.
**Text:**

> (no new copy — death-record path unchanged)

**Notes:** The fix is timing-only. Any new log line must name both bounds (child, parent) if added.

## C-2 — sanctioned-lane shape resolution (linked story `S-2`)

**Context:** stderr when a --review-fallback dispatch passes shape evaluation under blocking mode.
**Text:**

> [dispatch-shape] review-fallback: sanctioned lane (registered shape) — allowed under ENFORCE

**Notes:** Must distinguish "sanctioned lane allowed" from "mismatch suppressed"; a genuinely-mismatched non-sanctioned shape's refusal text is unchanged.

## C-3 — registry-derived gate refusal (linked story `S-3`)

**Context:** stderr when a build-chain-class role (registry-derived) is refused --review-fallback or missing -w.
**Text:**

> …cannot be used with build-chain role '<role>' (registry class: build_chain_worker)…

**Notes:** Existing refusal strings extended with the registry-class provenance; existing-role refusal text otherwise preserved (membership parity, AC-3.2).

## C-4 — window-clamp discard note (linked story `S-4`)

**Context:** stderr/finding evidence when an outlier event ts is discarded by the clamp in either checker.
**Text:**

> …event ts <iso> outside sane sprint horizon (created_at ± cap) — discarded from window derivation…

**Notes:** Identical content elements in BOTH sprint-hook-coverage.js and sprint-manager-consult.js (two-site, β directive).

## C-5 — sprint_id correlation evidence (linked story `S-5`)

**Context:** finding evidence strings already emitted by both checkers when no backing record correlates.
**Text:**

> …no backing ok:true dispatch record correlated by sprint_id (or legacy clamped window) …

**Notes:** Evidence strings must now say WHICH correlation path failed (sprint_id vs legacy window) so a red is diagnosable.

## C-6 — verifyGauntlet refusal (linked story `S-6`)

**Context:** the thrown/refusal message when a programmatic caller passes unparseable since/until.
**Text:**

> verifyGauntlet: unparseable window (since/until) — refusing (whole-ledger scan is forbidden); pass valid ISO timestamps or epoch ms

**Notes:** Self-identifying refusal (names the enforcer, the reason, the recovery) per ED-043 class. CLI message preserved as-is.
