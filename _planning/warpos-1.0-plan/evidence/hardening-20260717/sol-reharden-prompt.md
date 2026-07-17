# Cabinet consult — sol-reharden (2026-07-17, WarpOS 1.0 hardened plan)

You are outside counsel (cabinet role): ADVISORY-ONLY, CHANGE-NOTHING. Do not edit any file. Return your analysis as text only.

## Context
On 2026-07-17 you (gpt-5.6-sol @ ultra) reviewed the draft WarpOS 1.0 kernel plan. Your core amendment — "false-green portability / undefined trust boundary is the #1 risk; contract first, adapter last" — was ACCEPTED and is ratified decision #1 (sequencing) + Phase 0. The operator then ratified the 5-decision plan and ordered a hardening pass before any execution. That hardening pass is now complete. This is the "sol-reharden" consult the plan's NEXT-SESSION DIRECTIVE step 3 requires: a second opinion on the HARDENED plan.

## Read these (from the repo root; read them yourself)
1. `_planning/warpos-1.0-plan/RATIFIED-PLAN.md` — the full plan; pay special attention to the new "HARDENING LAYER — 2026-07-17" section (deltas H-1…H-6, binding gates G0.1–G4.6, the ⚑ flagged Phase-1 lane-contract ruling).
2. `_planning/warpos-1.0-plan/HARDENING-CHANGES.md` — the operator-facing change ledger (14 items).
3. `_planning/warpos-1.0-plan/evidence/hardening-20260717/verify-claims.md` — claim sweep (13 confirmed / 1 refuted / 1 partial).
4. `_planning/warpos-1.0-plan/evidence/hardening-20260717/discrepancies.md` — the 3 discrepancy probes (agy lane DOWN; terra live-verified; 3 test-reds harmless).
5. `_planning/warpos-1.0-plan/evidence/hardening-20260717/alpha-eyeball-rulings.md` — per-doc firsthand rulings on the remaining 13 packet docs + 5 templates.

## Questions (answer each explicitly)
Q1. Does the hardened plan now close the two gaps you flagged in the first consult (false-green portability; undefined trust boundary)? If not, what specifically is still open?
Q2. The binding phase-exit gates G0.1–G4.6: is there a FALSE-GREEN PATH through any of them — a way a phase could exit "green" while the property it guards is actually violated? Name the gate and the path.
Q3. The ⚑ flagged Phase-1 ruling: the agy/Google lane turned out to be DOWN (zero dispatches ever; real migration needed), so the recommendation is: timebox the Antigravity migration inside Phase 1; if unproven at timebox end, 1.0 binds on the 2-family panel (GPT+Claude) with agy as a sunset-dated OPTIONAL lane, and "missing lane BLOCKS" applies to CONTRACTED lanes only. Assess: right call? Better alternative?
Q4. The six hardening deltas H-1…H-6: any that introduces a new risk, over-constrains a build phase, or conflicts with a ratified decision in a way the authors missed?
Q5. Ranked: the top 3 highest-leverage FURTHER tightenings you would make before execution starts (or state "none warranted" if the plan is execution-ready as-is).

## Output shape
- Verdict line per question (Q1…Q5).
- Then a ranked amendment list (may be empty), each item: one-line change + the failure it prevents.
- Advisory-only: propose, never instruct as if authorized; the operator ratifies.
