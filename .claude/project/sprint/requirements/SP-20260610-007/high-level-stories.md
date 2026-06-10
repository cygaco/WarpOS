<!-- requirement-format-legacy -->
# High-Level Stories — E-DISPATCH-SHAPE-001 W1 — make availability and fallback real

**Sprint:** `SP-20260610-007`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-007\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As gauntlet-verify, when both cross-providers are down a claude fallback review lane is LEDGERED and I SEE it, so liveness verification isn't blind at the highest-risk moment.

**As** the user
**I want** As gauntlet-verify, when both cross-providers are down a claude fallback review lane is LEDGERED and I SEE it, so liveness verification isn't blind at the highest-risk moment.
**So that** When both cross-providers are quota-dead, a claude review lane is LEDGERED and gauntlet-verify sees it (no blind spot at the highest-risk moment); a quota-dead provider is short-circuited before another blind retry burns it; and a metered codex key reads as 'key (metered)' instead of being misreported as funded oauth — closing the 3-day metered-drain class. Each guarded by a planted-violation test.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As coverage-gate, a claude record for a cross-provider role visibly trips cross_provider_required (honest debt), so a claude-only gauntlet never silently reads as cross-provider-satisfied.

**As** the user
**I want** As coverage-gate, a claude record for a cross-provider role visibly trips cross_provider_required (honest debt), so a claude-only gauntlet never silently reads as cross-provider-satisfied.
**So that** When both cross-providers are quota-dead, a claude review lane is LEDGERED and gauntlet-verify sees it (no blind spot at the highest-risk moment); a quota-dead provider is short-circuited before another blind retry burns it; and a metered codex key reads as 'key (metered)' instead of being misreported as funded oauth — closing the 3-day metered-drain class. Each guarded by a planted-violation test.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
