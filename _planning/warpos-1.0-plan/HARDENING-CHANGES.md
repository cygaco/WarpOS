# Hardening Changes — 2026-07-17 (pre-approval ledger)

One line per change, plain language, with the problem it solves. This is the ELI5 list for the operator's FINAL approval. **No plan phase was executed; SP-001 stays parked; nothing below reverses a ratified decision.**

## Fixes to things that were wrong
1. **Backfilled debt entries ED-203 through ED-207 into the ledger.** Problem: our tracker said these five follow-ups were "logged" — they never were. The bookkeeping was lying; now the ledger matches what the tracker claims. (Each entry is marked as a backfill so nobody mistakes it for an original.)
2. **Reworded "the 44 session-lifecycle hooks" in Phase 4.** Problem: the exact number can't be reproduced from disk today (the registry drifted to 67 entries / 75 wired calls). A stale hard number invites false confidence; the rule now names the hook *class* and treats counts as drifting.
3. **Annotated the plan's ED-205 reference.** Problem: the plan cited a ledger entry that didn't exist (see #1); the citation is now real and says why.

## Additions from reading the packet docs firsthand (α, all 18 now read)
4. **Added a one-sentence Definition of Done for 1.0** (from the packet's Charter): a clean install must get from idea to shipped-and-learned *without chat memory, stale trackers, Alpha heroics, or unverified claims*. Problem: the plan had phases but no single test for "1.0 is actually done."
5. **Pointed Phase 3's lease design and Phase 1's routing fix at the packet's ready-made schemas** (lease types one_shot/wave/phase/session; role = role_id + provider + runtime). Problem: builders would waste time re-deriving designs that already exist and were already vetted.
6. **Added a tracker-fidelity probe to Phase 3** — a check that compares what the tracker CLAIMS against what git/disk actually shows. Problem: our trackers have gone stale silently before (5 recurrences in one June day; we nearly rebuilt finished work). The current validator only checks the tracker against itself, not against reality. Two packet docs independently demanded this; the original harvest missed it.
7. **Scoped the conformance checklist to kernel-only, explicitly.** Problem: the packet checklists mix kernel items with product-layer packs we deliberately dropped (founder panel, webapp security). Without a written IN/OUT line, the dropped packs creep back in through the checklist.
8. **Rewrote every phase exit as named runnable commands with expected outcomes** (gates G0.1–G4.6, now binding in the plan). Problem: prose exits like "the panel runs end-to-end" can't be tested — "done" becomes an opinion. Now each phase ends on commands that pass or the phase isn't over.
9. **Confined the "top-level session defaults to Alpha" rule to Claude-side boot files only.** Problem: the packet's own AGENTS.md template puts that rule in the *neutral* file every worker reads — which would let any worker talk itself into Alpha authority. The neutral handbook keeps binding rules 1–4; rule 5 lives only where the human-facing session boots.
10. **Reconciled the result-status vocabulary.** Problem: the packet template has 7 result statuses, the plan has 5 — two conflicting vocabularies would fork the schema at build time. Ruling: 5 terminal states; things like "timeout" and "quota exhausted" become failure-REASON codes (from the packet's failure taxonomy), not extra states.

## Discrepancy resolutions (ε-conducted probes)
11. *(pending — agy lane: which source is stale, audit or tracker)*
12. *(pending — gpt-5.6-terra liveness record verification)*
13. *(pending — the 3 pre-existing test failures re-confirmed + still flip-independent)*

## Process notes (not plan changes)
- Claim sweep: 15 claim groups verified against disk/git — 13 confirmed, 1 refuted (→ change #1), 1 partial (→ change #2). Report: `runtime/plan-hardening-20260717/verify-claims.md`.
- α rulings detail: `runtime/plan-hardening-20260717/alpha-eyeball-rulings.md`.
- sol-reharden consult + β checkpoint verdicts appended below when they land.
