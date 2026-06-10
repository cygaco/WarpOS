<!-- requirement-format-legacy -->
# Granular Stories — E-DISPATCH-SHAPE-001 W1 — make availability and fallback real

**Sprint:** `SP-20260610-007`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-007\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — TICKET-1 (BACKEND, G2): add dispatch-claude.js --review-fallback non-build review mode (no -w gate; writes a normal completion record stamped fallback:true + the cross-provider origin so coverage-gate:155 trips visibly); allowlist the route in dispatch-route-guard; planted fixture: gauntlet-verify SEES the fallback record AND coverage-gate flags it cross_provider_required.

**As** the user
**I want** TICKET-1 (BACKEND, G2): add dispatch-claude.js --review-fallback non-build review mode (no -w gate; writes a normal completion record stamped fallback:true + the cross-provider origin so coverage-gate:155 trips visibly); allowlist the route in dispatch-route-guard; planted fixture: gauntlet-verify SEES the fallback record AND coverage-gate flags it cross_provider_required.
**So that** When both cross-providers are quota-dead, a claude review lane is LEDGERED and gauntlet-verify sees it (no blind spot at the highest-risk moment); a quota-dead provider is short-circuited before another blind retry burns it; and a metered codex key reads as 'key (metered)' instead of being misreported as funded oauth — closing the 3-day metered-drain class. Each guarded by a planted-violation test.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — TICKET-2 (BACKEND, G5): provider circuit breaker — new scripts/dispatch/provider-breaker.js (write/read/TTL/fail-open); providers.js writes .claude/runtime/provider-down.json on classifyQuotaFailure(quota_exhausted) (parse gemini reset else ~30m); providerAvailable() consults it before reporting available; wrappers fail fast with breaker info; planted re-burn test + a fail-open-on-corrupt-file test.

**As** the user
**I want** TICKET-2 (BACKEND, G5): provider circuit breaker — new scripts/dispatch/provider-breaker.js (write/read/TTL/fail-open); providers.js writes .claude/runtime/provider-down.json on classifyQuotaFailure(quota_exhausted) (parse gemini reset else ~30m); providerAvailable() consults it before reporting available; wrappers fail fast with breaker info; planted re-burn test + a fail-open-on-corrupt-file test.
**So that** When both cross-providers are quota-dead, a claude review lane is LEDGERED and gauntlet-verify sees it (no blind spot at the highest-risk moment); a quota-dead provider is short-circuited before another blind retry burns it; and a metered codex key reads as 'key (metered)' instead of being misreported as funded oauth — closing the 3-day metered-drain class. Each guarded by a planted-violation test.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — TICKET-3 (BACKEND, G4/N4): auth-posture surface — detectAuthTier parses auth.json content (auth_mode/OPENAI_API_KEY → 'key (metered)'; tokens → 'oauth (plan)'; VALUE-FREE); provider-tier rows + providers.js quota error envelope carry the mode; planted test: metered auth.json reads 'key (metered)' not 'oauth'.

**As** the user
**I want** TICKET-3 (BACKEND, G4/N4): auth-posture surface — detectAuthTier parses auth.json content (auth_mode/OPENAI_API_KEY → 'key (metered)'; tokens → 'oauth (plan)'; VALUE-FREE); provider-tier rows + providers.js quota error envelope carry the mode; planted test: metered auth.json reads 'key (metered)' not 'oauth'.
**So that** When both cross-providers are quota-dead, a claude review lane is LEDGERED and gauntlet-verify sees it (no blind spot at the highest-risk moment); a quota-dead provider is short-circuited before another blind retry burns it; and a metered codex key reads as 'key (metered)' instead of being misreported as funded oauth — closing the 3-day metered-drain class. Each guarded by a planted-violation test.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

