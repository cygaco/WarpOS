# SP-20260718-004 — Phase 2: Identity + host portability (PLAN — parked at plan→design)

**Minted:** 2026-07-18 (WARPOS 1.0 Phase 2, per `_planning/warpos-1.0-plan/RATIFIED-PLAN.md`). **Conductor:** Epsilon2 (plan phase only). **State:** PLAN minted + β plan→design consult, then PARKED — a fresh conductor executes design→build.

## Objective
Make WarpOS's identity + authority provider-portable and un-forgeable: explicit role bindings, a provider-neutral canonical instruction source with per-provider projections, and an authority-pollution scan — so no dispatched worker silently acts as President and no ambient surface can retro-grant authority.

## Composition (for the ε registry runtime)
- **Unit types:** backend + security (identity/authority-binding core; instruction-source generation + drift; scan enforcers).
- **Max risk:** HIGH — the irreversible outcome is an authority/identity FALSE-GREEN (an unbound worker binding to President, or ambient text retro-granting merge/approval authority). Same non-dispositionable class as Phase-1's security-truth.
- **Domains:** routing / security / identity.

## Scope (RATIFIED-PLAN Phase 2 — verbatim intent)
1. **Explicit role bindings** (Phase-0 precedence graph implemented). **DO-NOT-REOPEN (α ruling 2026-07-17):** DISPATCHED workers = UNBOUND fail-closed (never default to President — consult is right there); the TOP-LEVEL human-facing session DEFAULTS to Alpha (binding-order #5). The conditional "you are Alpha unless bound" CLAUDE.md phrasing is acceptable ONLY as a transition.
2. **Provider-neutral canonical instruction source + per-provider projections** (scoped-down packet 05); deterministic generation + drift check (the regen-both-manifests discipline: source + projections land in ONE atomic commit).
3. **Authority-pollution scan** — not just identity words: unconditional permissions/approval/merge/deploy authority OR operator-audience in ANY ambient neutral surface; scan the EFFECTIVE instruction graph (imports, agent specs, shims, generated files, stale worktrees, handoff prompts).
4. **Generic bootstrap** harvested from packet 01 (chat/API hosts).
5. **Per-provider cwd/sandbox TESTS before any "neutral cwd" change** (changing cwd moves codex's sandbox root — don't adopt blind). Reviewers get read-only evidence; builders get exactly one isolated worktree as write root.
6. **Operator-voice directive** (ratified decision #3) — helm-only, scan-asserted.
- **Known leak to close:** builders inherit "You are Alex — the President" via worktree CLAUDE.md; codex reviewers slurp the 14KB AGENTS.md router from cwd. (Root AGENTS.md does NOT declare "you are Alpha" — catastrophic form already avoided.)

## Exit gates (Phase 2, per RATIFIED-PLAN §Gates)
- **G2.1** binding-precedence fixtures: unbound worker fail-closed; planted repo-prose "you are Alpha" CANNOT bind.
- **G2.2** projection regen → `git diff --exit-code` clean.
- **G2.3** authority-pollution scan over the EFFECTIVE instruction graph, zero ambient authority + H-6a placement asserted. **β catch (load-bearing):** the fixture must PLANT rule-#5-STYLE text ("default top-level human-facing role = alpha") in a NEUTRAL file and prove it is caught — not just the bare "you are Alpha" identity string. The default-binding leak class is the one that matters.
- **G2.4** President-leak closed in worktree instruction sets; codex reviewers stop slurping the full router.
- **G2.5** per-provider cwd/sandbox tests BEFORE any cwd change merges.
- **G2.6** operator-voice projected helm-only (scan-asserted).

## Seeded enforcement-debt this sprint owns / considers (lead work-order 3)
- **ED-220** — role-binding value validation (core to explicit-role-bindings; the binding VALUE must be validated, not just present).
- **ED-231 residuals** — (a) **whole-ledger signature verification** extended to the `gauntlet-verify` liveness readers — the **SAME mistake-reachable forgery class** as the binding surface, β RIDER-1 (2026-07-18): a forged UNSIGNED `ok:true` liveness record still fools the field-only release gate; this is **MISTAKE-CLASS PRIORITY, NOT defense-in-depth** — the origin-proof closed it only on the binding cert-attest surface; (b) **(B)-lite artifact-binding** (recompute digests from persisted artifacts); (c) **sign-the-verdict** — include the review verdict in `SIGNED_FIELDS` so a same-user FAIL→PASS flip invalidates the sig (β RIDER-2; BE-CQ-001's allowlist catches malformed/unknown values but NOT a valid-but-tampered flip — verdict-signing is the integrity control). ADR-0025 §Consequences homes all three.
- **ED-221** — gitignored-ledger durability resolution ADR (the split-durability class: a committed contract cites EDs whose targets live in a gitignored on-disk ledger; reconcile the on-main self-host).
- **ED-229** — AST/dataflow guard upgrade for the delegation guard (deferred defense-in-depth from SP-003; not a prerequisite).
- **ED-228** — conductor lease / claim-file MECHANISM. **β RULING (plan-lock): STAYS Phase-3-per-plan (packet 07); do NOT pull into Phase-2** (do-not-reopen the ratified plan structure; not a Phase-2 blocker; caused no false-green this session — the Epsilon→Epsilon2 transfer worked; a lease dilutes the HIGH-risk identity-binding focus). THREE RIDERS so nothing is lost: (i) DESIGN Phase-2's derived-not-settable binding machinery so the Phase-3 lease can REUSE it — conductor-authority IS a derived binding + claim-file, same spine; don't build role-binding so narrowly a parallel mechanism is later needed; (ii) NAME the interim residual — conductor-collision is DOCTRINE-not-mechanism until Phase-3/ED-228, and a late-firing prior conductor IN-SESSION shares the per-session attest secret, so ED-231 origin-proof does NOT fully close it (tracked, not silent); (iii) carry this session's DATA as the Phase-3 input: the doctrine-only Epsilon→Epsilon2 transfer + the in-session late-fire risk + the ~8 wake-seam dropped re-wakes.

## Folded lessons (SP-20260718-003 completion-endgame — plan inputs)
- **The SPINE — DERIVED-NOT-SETTABLE is PRIMARY (β plan-lock, sharpened):** Phase-1 proved identity must come from the channel + contract, NEVER a client-settable field (ED-225). That is the PRIMARY spine here — NOT HMAC origin-proof. Role RESOLUTION happens at dispatch/bootstrap → DERIVE the role from the dispatch CHANNEL + CONTRACT so a worker CANNOT set/claim its own role; ambient text (worktree CLAUDE.md / handoff / AGENTS.md) is INPUT the worker reads, NEVER the authority for its binding. **DO NOT build a signed settable "role" field** — that is the settable-label anti-pattern with a signature bolted on; build a DERIVED role such that no settable role field exists at all. HMAC origin-proof (ED-231/ADR-0025) applies SECONDARILY and ONLY where a binding is PERSISTED to a record read across a trust boundary. **The authority-pollution scan is a DETECTOR with the R6 completeness ceiling** (an authority-WORDS/patterns match is a lower bound — paraphrase slips: "you have merge authority" vs "the operator trusts your judgment on shipping"); so the scan is NOT the guarantee — the STRUCTURE (derived-not-settable → ambient authority text is INERT-BY-CONSTRUCTION regardless of phrasing) is the guarantee, the scan is honest-scoped defense-in-depth.
- **REQUIRED-PRESENT before design closes (β falsifiability fixtures — design is incomplete without them):** (i) the derived-not-settable NEGATIVE fixture (identity analog of the ED-231 forged-record fixture): a worker that SETS `role:"President"` / authority in its OWN context/record/handoff → STILL resolves UNBOUND (dispatched) or Alpha (top-level); (ii) G2.3's rule-#5-STYLE default-binding plant in a NEUTRAL file ("default top-level human-facing role = alpha") proven caught — the default-binding leak is the class that matters, not the bare "you are Alpha" string.
- **STANDING ENFORCER (β):** the authority-pollution scan must be a STANDING check (scan:full / CI, exits non-zero), self-detecting on RE-INTRODUCTION (a future worktree CLAUDE.md / new agent spec / stale handoff can re-introduce ambient authority) — name the enforcer at design (every-policy-needs-a-named-enforcer). EFFECTIVE-GRAPH enumeration (G2.3) is a LOWER BOUND (P-057): prefer DERIVING the surface list from how the harness assembles a worker's effective context over a hand-list; where a hand-list is unavoidable, name it as a lower bound and lean on the structural derivation for the real guarantee.
- **Wake-seam crossings:** ~8 dropped bg-dispatch completion re-wakes in the SP-003 endgame session (the lead watchdogged via artifact-probe each time). F1 (the wake-seam mechanism fix) remains Phase 3 per the plan, but the DATA (8 crossings/session) is a Phase-3 input — the teammate fire-and-poll doctrine + a robust completion signal is load-bearing; note it, don't fix it here.

## Do-not-reopen (carried into design)
- The 2026-07-17 role-binding split (dispatched=UNBOUND, top-level=Alpha).
- Dropped-from-1.0 (operator-acknowledged 2026-07-17): packet 02 Charter, 09 packs-as-layer, 10/11 webapp/founder-panel packs, 12 stream-split.
- Adversarial-helm containment is DROPPED (not a WarpOS concern; operator ruling 2026-07-17) — Phase 2/4 adopt the acceptance/integration half only.

## PARK — β plan→design verdict: DECIDE B/0.89, OPEN_ADR:true (2026-07-18)
**β ruled PROCEED to design** (composition + scope→gate 1:1 sound; no re-consult at design unless a NEW irreversible risk surfaces). The verdict is FORWARD-LOADED for the fresh conductor and is folded into the SPINE + REQUIRED-PRESENT + STANDING-ENFORCER + ED-228 sections above. Load-bearing calls:
- **Systemic:** the scan (G2.3/G2.4/G2.6) has the R6 completeness ceiling → the guarantee is STRUCTURAL (derived-not-settable, inert-by-construction), the scan is honest-scoped defense-in-depth.
- **Spine:** PRIMARY = derived-not-settable (ED-225); origin-proof (ED-231) SECONDARY / persisted-cross-boundary only; NO signed settable role field.
- **Two REQUIRED-PRESENT falsifiability fixtures before design closes** (derived-not-settable negative + G2.3 default-binding plant).
- **ED-231 residuals in Phase-2 = MISTAKE-CLASS priority** (not portability/defense-in-depth) — β rider-1 from the SP-003 close, confirmed.
- **ED-228 stays Phase-3** with the three reuse/naming riders above.

**STATE: PARKED at the plan→design boundary.** A FRESH conductor consumes this verdict (no re-consult) and executes design→build. Full β verdict recorded in `paths.betaEvents` (`.claude/agents/president/_system/beta/events.jsonl`, 2026-07-19T01:15Z) + the TRACKER next-action.
