# SP-20260718-004 — Phase 2 PLAN PARK handoff (fresh-conductor entry point)

**Parked:** 2026-07-18 (completion-endgame session, Epsilon2 plan-phase). **State:** PLAN minted + β plan→design DECIDE B/0.89 (OPEN_ADR) → **PARKED at the plan→design boundary.** A FRESH conductor executes design→build.

## Fresh-conductor entry (do this, in order)
1. Read the full plan: `.claude/project/sprint/sprints/SP-20260718-004/plan.md` (scope 1-6, gates G2.1-G2.6, seeded EDs, do-not-reopen rulings, the SPINE, REQUIRED-PRESENT fixtures, STANDING-ENFORCER).
2. Consume the β plan→design verdict from `paths.betaEvents` (`.claude/agents/president/_system/beta/events.jsonl`, 2026-07-19T01:15Z) — **no re-consult at design** unless a NEW irreversible risk surfaces (β's terminal instruction).
3. Enter design (author PRD / build_spec via product-lead + director-of-engineering per the registry). Then build → gauntlet → release → retro.

## The load-bearing β rulings (DO NOT drift from these)
- **SPINE is STRUCTURAL, primary = DERIVED-NOT-SETTABLE (ED-225):** role resolves from the dispatch CHANNEL + CONTRACT at dispatch/bootstrap; a worker CANNOT set/claim its own role; ambient text (worktree CLAUDE.md, handoff, AGENTS.md) is INPUT, never the binding authority. **NO signed settable "role" field** (that's the settable-label anti-pattern + a signature). HMAC origin-proof (ED-231) is SECONDARY, only for a binding PERSISTED to a record read across a trust boundary.
- **The scan is a DETECTOR with the R6 completeness ceiling** (authority-WORDS match = lower bound; paraphrase slips) → honest-scoped defense-in-depth, NOT the guarantee. The STRUCTURE (derived-not-settable → ambient text INERT-BY-CONSTRUCTION) is the guarantee.
- **Two REQUIRED-PRESENT falsifiability fixtures before design closes:** (i) a worker that SETS `role:"President"`/authority → STILL resolves UNBOUND (dispatched) / Alpha (top-level); (ii) a rule-#5-STYLE default-binding plant ("default top-level human-facing role = alpha") in a NEUTRAL file, proven caught.
- **STANDING enforcer:** the authority-pollution scan runs in scan:full / CI (exits non-zero), self-detecting on RE-INTRODUCTION. Name the enforcer at design.
- **ED-231 residuals (whole-ledger signing beyond cert-attest + (B)-lite artifact-binding + sign-the-verdict) are IN Phase-2 = MISTAKE-CLASS priority**, NOT portability/defense-in-depth (the gauntlet-verify liveness readers are the same mistake-reachable forgery class as the SP-003 binding surface, one reader over).
- **ED-228 conductor-lease STAYS Phase-3** (do-not-reopen the plan) with three riders: design the derived-not-settable binding so the Phase-3 lease REUSES it; NAME the interim doctrine-not-mechanism residual (a late-firing in-session prior conductor shares the per-session attest secret, so origin-proof does NOT fully close conductor-collision); carry this session's data (doctrine-only Epsilon→Epsilon2 transfer + late-fire risk + ~8 wake-seam dropped re-wakes) as the Phase-3 input.

## Do-not-reopen (carried from the plan)
The 2026-07-17 role-binding split (dispatched=UNBOUND, top-level=Alpha); the dropped-from-1.0 packets (02/09/10/11/12); adversarial-helm containment DROPPED (acceptance/integration half only).

## Prior sprint (context, not scope)
SP-20260718-003 (Phase 1: routing + security truth) — COMPLETE + MERGED @ `dc08a77b`; panel-3lab activation stays operator-gated (agy unauthenticated, ED-060 — operator Antigravity login pending). The completion-endgame closed 3 gauntlet-caught false-greens incl. the ED-231 ledger-forgery via origin-proof (ADR-0025).
