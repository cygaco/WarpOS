<!-- requirement-format-legacy -->
# PRD — E-DISPATCH-SHAPE-001 W1 — make availability and fallback real

**Sprint:** `SP-20260610-007`
**Plan Contract:** `PC-20260610-0071`
**Status:** draft
**Documentation scale:** `m`

## Outcome

When both cross-providers are quota-dead, a claude review lane is LEDGERED and gauntlet-verify sees it (no blind spot at the highest-risk moment); a quota-dead provider is short-circuited before another blind retry burns it; and a metered codex key reads as 'key (metered)' instead of being misreported as funded oauth — closing the 3-day metered-drain class. Each guarded by a planted-violation test.

## Context

### Original Request

> W1 — make availability and fallback real. (1) Recorded claude-fallback review lane (G2): ONE sanctioned, LEDGERED door for claude-fallback reviews when cross-providers are down — the record must visibly trip cross_provider_required in coverage-gate (honest debt, NOT silent satisfaction); gauntlet-verify must SEE the lane (planted fixture); respect dispatch-route-guard (wrapper route allowlisted, raw claude -p stays non-build-only). (2) Provider circuit breaker (G5): providers.js writes a provider-down state file (.claude/runtime/provider-down.json or similar) on quota_exhausted classification with a TTL (gemini's own reset when parseable, else default ~30m); dispatch wrappers consult it BEFORE spawning and fail fast with the breaker info (no blind retry storms); fail-open on breaker-file faults; planted re-burn test. (3) Auth-posture surface (G4/N4, ROADMAP item 6): parse codex auth.json auth_mode (value-free — mode label only, never key material); fix the detectAuthTier metered-as-oauth misreport; dispatch-readiness/provider-tier rows show key(metered) vs oauth(plan); quota error envelopes from providers.js include the auth mode. PLANTED tests per ticket; goldens before/after on touched wrappers.

### Interpreted Intent

Make the dispatch stack DEGRADE HONESTLY when providers go down: a claude fallback review is recorded + visible (not invisible to gauntlet-verify); a quota-dead provider is not re-burned; and the auth posture that caused 3 days of unseen metered billing is one read away. W1 of the dispatch-shape epic — does NOT flip ENFORCE or make the resolver the only door (that is W2).

### Current Behavior

G2: no sanctioned recorded claude-fallback lane — raw claude -p writes no record, Agent-tool writes no record, record-inprocess refuses cross-provider routes; gauntlet-verify blind when providers down. G5: no circuit breaker anywhere; a quota-dead provider re-burned every dispatch (6 prompts x 3 retries into the dead window). G4/N4: detectAuthTier reports a metered codex key as oauth/paid (existence-only check); provider-tier inherits the lie; the 3-day metered drain was invisible. All live-reproduced in the audit.

### Desired Behavior

G2: ONE sanctioned ledgered claude-fallback review lane; a claude record for a cross-provider role is recorded, SEEN by gauntlet-verify, and visibly trips cross_provider_required (honest debt). G5: providers.js writes provider-down.json on quota_exhausted (TTL'd); wrappers consult before spawn + fail fast; fail-open on breaker faults; no re-burn. G4/N4: detectAuthTier parses auth.json content — metered key reads 'key (metered)', oauth reads 'oauth (plan)'; provider-tier + quota envelopes carry the mode. Three planted tests green.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.
>
> This list is generated from `plan_contract.requirement_areas` (N items → R-1..R-N).
> A sprint with >3 requirement areas will have more than 3 entries here — trace.md
> and granular-stories.md reference the same R-1..R-N set (single-source, T-298).

- `R-1` — G2: ONE recorded claude-fallback review lane (ledgered, gauntlet-verify-visible, trips cross_provider_required)
- `R-2` — G5: provider circuit breaker (provider-down.json, TTL, consult-before-spawn, fail-open)
- `R-3` — G4/N4: auth-posture surface (detectAuthTier content-parse, key(metered) vs oauth, envelope stamp)
- `R-4` — 3 planted tests (fallback-lane-seen / re-burn-blocked / metered-reads-metered) + wrapper goldens

## Non-Goals

- W2 (ENFORCE flip, resolver-as-only-door, route-guard stops blessing raw claude -p, envelope-contract revival/burial) and W3 (per-class lane policy).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| G2 — recorded claude-fallback review lane: scripts/dispatch-claude.js (--review-fallback non-build mode) OR scripts/sprint/epsilon-runtime.js record-inprocess (--fallback-from); + scripts/hooks/dispatch-route-guard.js (allowlist the route); + coverage-gate visibility | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260610-0071.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-007\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-007\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-007\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-007\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-007\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-007\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-007\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-007\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-007\release-plan.md`
