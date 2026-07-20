# ADR 0031 — remove all legacy Gemini-CLI wiring; Gemini-family lab routes through agy only; role defaults to the verifiable floor

**Date:** 2026-07-20
**Status:** accepted
**Class:** B (dispatch/security architecture — provider removal + role reroute + new enforcer)
**Context:** WarpOS 1.0 operator directive ("no more wiring to Google's Gemini anywhere") + the 2026-07-20 no-presupposition agy diagnostic
**Extends:** ADR-0020 (panel lane contract) · ADR-0027 (agy same-user-spawn strategy) · ED-243 (routing/enforcer) · ED-060 · ED-230
**β consult:** DECIDE B/0.90, OPEN_ADR:true, 2026-07-20 (grep-verified both premises; four binding rulings; logged `paths.betaEvents`, reply_to 71775b4e).

---

## Decision

1. **Remove all wiring to the sunset legacy `gemini` CLI** (`@google/gemini-cli` — `IneligibleTierError`, migrate-to-Antigravity ~2026-06-18): the `gemini:` provider block, `GEMINI_API_KEY`/`GOOGLE_API_KEY` injection + gemini OAuth checks, `GEMINI_CLI_TRUST`/`--skip-trust`/`geminiTrustBypass`, `GEMINI_DEFAULT`, the `gemini models list` probe, the legacy `provider==="gemini"` cert-attest probe branch, the `gemini` key in `PROVIDER_FAMILY`, role→`gemini` pins, and gemini fallback rungs.
2. **Reroute the role DEFAULT `gemini`→`openai`** (the verifiable GPT floor), NOT `antigravity`, for `security-reviewer` + `redteam`, in BOTH `providers.js` and `catalog.js` `DEFAULT_PROVIDER_PER_ROLE`. The **binding** security verdict must stay on a **verifiable** lane while ED-230 (served-model proof) is open; agy remains the panel's advisory google-family LAB, never a role's binding default.
3. **Keep the Gemini MODELS served via agy** (`gemini-3.1-pro-high` / "Gemini 3.1 Pro (High)"), the `antigravity` provider, `antigravity:"google"` family, and the google→openai cross-family fallback. The role-registry already migrated `security-reviewer`/`research-lead` to `antigravity` — this ADR removes the *dead CLI*, not the Gemini family.
4. **agy headless tool-permission = scoped read-only allow-list** (grep/cat/ls/find/git-log/diff/show, deny else) + a guard that the agy invocation can NEVER carry `--dangerously-skip-permissions`. If scoped-allow is insufficient, agy stays BLOCKED-ADVISORY (honest 2-family floor). skip-perms is operator territory, never self-granted.
5. **New creep-back enforcer:** a wiring-precise check (extends `scan:model-chain`, ED-243) that fails on legacy-gemini CLI/provider/key wiring but not on gemini model IDs served via agy — backed by a negative fixture per removed form + a positive fixture (no-widen/no-narrow proof).

## Context

The 2026-07-20 diagnostic (operator-prompted) refuted the long-standing "agy blocked on operator login" framing: agy authenticates fine from a subprocess. The real blockers were a stale routing line (role→sunset `gemini` CLI), agy's agentic headless tool-permission wall, and the served-model proof gap. The legacy `gemini` CLI is dead upstream; leaving its wiring in place guarantees `IneligibleTierError` at dispatch time and is dead weight for 1.0.

## Options considered

1. **Reroute the role default to `antigravity` (agy):** REJECTED — puts the binding security verdict on the unverifiable agy lane (ED-230 open), the exact risk SP-20260719-001 + ADR-0027 guard.
2. **Reroute the role default to `openai` (verifiable floor) + agy as advisory panel lab (CHOSEN):** preserves the verifiable-binding invariant; agy contributes adversarial diversity via the panel path only.
3. **Drop the Gemini family entirely (2-family permanent):** REJECTED — contradicts the ratified 3-lab commitment; the Gemini family is retained via agy.

## Why this option won

It satisfies the operator directive (no legacy-gemini CLI wiring) while preserving both ratified invariants: the panel-3lab commitment (agy is the google-family lab) and verifiable-binding (ADR-0027). Removing a dead CLI is pure debt reduction; the reroute-to-floor keeps trust on a verifiable lane.

## Risks & mitigations

- **r1 incomplete clean** → a role/fallback still pinned to the dead CLI → silent `IneligibleTierError`. *Mitigation:* grep-all-forms completeness (the inventory), the creep-back enforcer, and the catalog.js/providers.js sync verify-rider.
- **r2 enforcer over-flags kept model IDs** → false-red. *Mitigation:* key on CLI/provider/key wiring, not the "gemini" substring; the positive fixture proves no-widen.
- **r3 scoped-allow insufficient** → do NOT reach for skip-perms; blocked-advisory is the honest floor; operator decides any arbitrary-execution acceptance.

## Reversal plan

Superseding ADR. If Google revives an individual Gemini CLI tier, a new provider block would be added deliberately — not by un-reverting this. The reroute-to-verifiable-floor is invariant until ED-230 closes.

## GPT cross-check + class-symmetry completion (2026-07-20)

An independent GPT cross-check (gpt-5.6-terra; `runtime/agy-adr-evidence/gpt-check-{coherence,conflict}-result-20260720.json`) found the deep-clean broadened the role-parity shape-route check to `antigravity` (`role-parity-scan.js`) **without** adding the matching `class_derivation` rule — leaving `research-lead` (the sole `{tier:lead, provider:antigravity}` role) to fall to the `{tier:lead}→manager` (Claude-only, in-process) catch-all and trip a role-parity RED. Fix (β DECIDE B/0.88→0.90): added `{tier:lead, provider:antigravity}→cross_provider_consult_lead` (mirrors the openai-lead rule), completing the symmetry. **research-lead stays on the Gemini lab as a cross-provider research consult** (ADR-0016 department model-spread — Growth leads are non-Claude by design); the gemini→antigravity reroute applies to it as a cross-provider role, NOT a demotion to Claude. Regression-locked by a `dispatch-contract.test.js` assertion.

- **Director analog deferred (deliberate, not missed):** the `{tier:director, provider:antigravity}` rule is NOT added — no antigravity director exists today, and the broadened scan self-detects at introduction (a future antigravity director trips role-parity RED, the signal to add the rule then with a real role to test against).
- **point-2 openai-floor caveat (pre-existing, NOT resolved here):** the security-reviewer/redteam role DEFAULT resolves to `antigravity` (registry derivation), not the `openai` literal floor point 2 intends — the floor has no enforcer and is silently overridden. The binding-verdict-on-verifiable-lane invariant still holds in practice (agy is blocked-advisory → the antigravity primary can't serve → the openai/claude passes bind). Pre-existing state (inherited from merged SP-20260719-001), tracked as enforcement debt — NOT claimed resolved.

## References
- Consolidated plan: `_planning/warpos-1.0-plan/GEMINI-DEEPCLEAN-AND-AGY-MIGRATION.md`
- Inventory: `runtime/agy-adr-evidence/GEMINI-DEEPCLEAN-INVENTORY-20260720.md`
- β ruling: `paths.betaEvents` 2026-07-20 (DECIDE B/0.90)
- Branch: `sprint/gemini-deepclean-20260720`
