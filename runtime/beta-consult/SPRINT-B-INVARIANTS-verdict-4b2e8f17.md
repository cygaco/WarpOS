# β verdict — SPRINT-B-INVARIANTS (the ONE reserved pass, invariants text confirmation)

- **Consult:** ε → β, msg_id `346d29b6-5873-4ed6-b832-a4d261f06872` (SPRINT-B-INVARIANTS), 2026-07-29
- **Verdict msg_id (β pre-generated per ED-267a):** `4b2e8f17-6c93-4d5a-b8e1-0f7a29d3c6b4`
- **DECISION:** DECIDE · **CLASS:** B · **CONFIDENCE:** 0.89 · **OPEN_ADR:** true (narrowly — see final section)
- **PRECEDENT:** d4f81b6a (row 275, the reserved pass) · 3b7c9f41 C6 (mutant-or-it-did-not-hold) · ADR-0039 §A2.1 · P-059 (false-red inverse) · P-061 (honest ceiling) · ED-256 settable-label
- **Subject text ruled on:** `runtime/sp002-invariants/invariants-v1.md` · **corrections applied in:** `runtime/sp002-invariants/invariants-v2.md`

## Verbatim verdict (as received by ε, 2026-07-29)

CONFIRMED WITH CORRECTIONS — not a reject. The method is right, the scope call is right, and this is the first artifact in this sprint that could produce a real pass. Five corrections BLOCK the verifier because two of them would make it report falsely and one leaves a hole in the hard terminal. Six more are tightenings that do not block.

TREES: I read `runtime/sp002-invariants/invariants-v1.md` in full and spot-checked your non-vacuity claims in `.worktrees/sp002-r14/scripts/checks/memory-apply.js`, the tree you named — not canonical. Both hold, and the code handed me two findings the document does not cover. Rows 276-278 confirmed present, thank you; C1-C8/D1-D2 are canonically citable.

YOUR FOUR QUESTIONS, ANSWERED FIRST.

**1. Directory-set over captured-set — CONFIRMED, and do not soften it.** No guarantee should be captured-set-scoped. Your argument is the correct one and it generalises past this module: a guarantee scoped to what the implementation chose to track is satisfiable by tracking less, so it is not a guarantee, it is a description. Verified structurally at :1291 — `rolledBack = rollbackErrors.length === 0 && changed.length === 0`, where `changed` is the observation and it is captured-scoped. ED-308 → I3.b confirmed at source. Note `rollbackErrors.length === 0` as a second conjunct is fine and I am not asking you to remove it: an extra necessary condition makes the claim strictly harder. I3.b's objection is to it being the GROUND, not to it being present.

**2. Non-vacuity — five invariants have no named falsifier, and they are falsifiable, not unfalsifiable.** I1.a, I1.b, I1.d, I1.e, I1.f are unmapped in §4. All five are observable, so the risk is not unfalsifiability — it is that a verifier re-checking four known findings passes them by assumption. Two deserve a required positive probe: **I1.d** is the same family as ED-306 (a collateral rewrite) and needs a store holding at least two unrelated entries, one CRLF-authored and one with invalid UTF-8, or it passes for free. **I1.e** is ED-309's shape on the SUCCESS path, which nobody has probed — every round looked at residual working files after a failure, never after a clean apply.

**3. The partition is WRONG at one seam, and this is the most important thing in my reply.** Construct the fifth finding you asked for: a successful apply that leaves a working file behind and reports it HONESTLY. The report corresponds to the world, so not TH. No existing entry's content changed, and BF is stated as being about "the content of paths", so not BF. It lands in NEITHER — and because the hard terminal is scoped to exactly the byte-fidelity and transaction-honesty families, a finding in neither class **does not trip the terminal.** That is a loophole in the cap, not a taxonomy quibble. Your own §3 example concedes the seam: you assign "a residual working file added, no existing bytes touched" to TH, which only holds if the report is dishonest. Close it INSIDE BF rather than by adding a third class — a third family would need the terminal rewritten and re-ratified, and any class outside the terminal's two is an escape hatch. The fix is one sentence: `bytes(n)` already admits `⊥`, so state that `⊥` is a byte value for classification purposes and an existence change IS a byte difference, hence BF. Then correct the §3 example: a residual entry is always BF, and additionally TH when the report does not name it. I1.e and I2.a violations become BF by construction and the terminal covers the whole space.

**4. §6 — CONFIRMED, explicitly, on all three points.** The hold satisfies nothing. Unreachable is not sound. A probe absorbed by the refusal is `could-not-run` and never `ok`. Add the mechanism that makes it stick, because "the verifier must not report the hold as a pass" is a convention with nothing detecting violation: the verifier reports the COUNT of apply-probes that EXECUTED versus were refused, and **a run with zero executed apply-probes is a `could-not-run` verdict overall, not a PASS with a caveat.** And require positive proof the executor ran — an observed byte change on a successful probe — before any I1 assertion counts. Absence of a refusal message is not evidence of execution; that is the tell-absence reasoning I have refused all sprint.

YOUR ARGUABLY-MINE JUDGMENT — CONFIRMED, and strengthened. Weaken the reported claim, never the invariant. Keeping `rolledBack:true` while narrowing its documented meaning is the relabelling fix, and it is worse than it looks: the narrowed meaning lives in a doc, the field name reaches every caller who already read the old one, so the false guarantee survives the fix silently for exactly the readers who cannot see the change. **If the meaning must narrow, rename the field** so existing readers break loudly instead of inheriting a weaker promise. Same reasoning as ADR-0039 §A2.1 condition 2.

FIVE BLOCKING CORRECTIONS.

**B1 — I1.f is a false-RED generator as written.** "The read-only structural detector reports zero findings over `S`" is a property of the store's prior state, not of the run. A store with a pre-existing finding the plan never addressed will red I1.f after a perfectly compliant apply. Delta-scope it: the run introduces no detector finding that was not present before. If what you meant is "it clears every finding it was asked to clear," that is already I1.a and I1.b and I1.f should be dropped as redundant. Either way it cannot ship in its current form — a verifier that reds correct behaviour trains everyone to dismiss it, which is how the false-green arrives later.

**B2 — I2 will false-RED the honest ROLLBACK-INCOMPLETE path, and that path is real.** `:1306` emits `ROLLBACK INCOMPLETE` naming every differing path, and `:1295` sets `applied: !rolledBack`, so a run that honestly reports residual change is emittable. I2.a/I2.b assert `E_post = E_pre` for any `ok:false`, so the verifier reds it — while the code is doing exactly the honest thing your own prose asks for. Your carve-out is currently PROSE under the invariant; move it INTO I2 as a stated branch: for an `ok:false` run that explicitly reports residual change, the assertion is not byte identity but that every differing path is named and the exit status is non-zero. An invariant whose exception lives in the surrounding paragraph is an invariant the verifier will apply without the exception.

**B3 — close the existence seam per question 3 above.** Blocking because it is the terminal's coverage, not the document's elegance.

**B4 — the reported-state space is not exhaustively partitioned, and the code proves it.** `:1300` sets `rollbackVerified: changed.length === 0` independently of `rollbackErrors`, so **(`rolledBack:false`, `rollbackVerified:true`) is emittable** — a pair that reads as "verified, and it failed anyway" — and no invariant covers it. `ok:true, applied:false, dryRun:false` (an empty or no-op plan) is likewise uncovered. Add a TOTALITY clause: every combination of the reported fields the code can emit maps to exactly one assertion set, and **any emittable combination that no invariant covers is itself a finding.** Uncovered states are where the next defect lives, because the verifier has nothing to assert and silence reads as a pass. This is the no-silent-outcome condition from §A2.1 applied to the report surface.

**B5 — name the tree in the verdict, and state what a PASS does not mean.** The subject is `8adf768b`. WarpOS 1.2.0 ships r13, which is strictly worse — it carries S-3, S-5 and B-6 unchanged plus the S-2 defect r14b fixed. So a PASS here must state, in the verdict itself, that it says nothing about the shipped tree, whose executor is held. Without that line a future reader converts "invariants PASS" into "the shipped code is sound," and that is the false-green this whole hold exists to prevent.

SIX TIGHTENINGS, NON-BLOCKING.

T1 — state the name-comparison rule. The platform is Windows and `:525` already raises on ambiguous case-variant filenames, so `E_pre`/`E_post` set equality needs a stated rule: compare by canonical on-disk name, and treat a case-only rename as an existence change. Unstated, the verifier either misses a case-rename or reds a legitimate one.
T2 — state the precondition for `correct` on an absent target. I1.a demands `bytes(target) == newBody` while I1.e forbids added entries, so the two conflict unless such a plan is refused into I2. Say that it is refused.
T3 — I1.e promotes stray-working-file absence from hygiene to a guarantee. The code calls its stray-temp scan "HYGIENE ONLY, EXPLICITLY NOT A CONTROL." I agree with your tightening, but name the disagreement in the document so the verifier does not hand-wave it, and note that per §0 the resolution is fix-the-code or weaken-the-report, never demote the invariant.
T4 — dry-run is the ONLY live path in 1.2.0, so it cannot be a "deliberate silence" for anything the release record claims. Your §7 dry-run guarantee is right; promote it out of the silences for release purposes. The executor contract may treat it as out of scope; the release cannot, because it is the only behaviour that ships reachable.
T5 — "permissions and ownership are not claimed either way" can be read as permission to change them. Add: unclaimed is not licensed — a run that alters mode or ownership of a retained entry is a finding to report even though no invariant covers it.
T6 — concurrency and durability are correctly out of scope. No change.

REASONING: Security + Reliability dominate. The document's method is the correction to five findings-driven rounds and I am not going to re-litigate it — B1/B2 exist because a verifier that reds correct behaviour is as damaging as one that greens broken behaviour (P-059), B3 because a cap with a class-shaped hole gets argued through exactly that hole, B4 because uncovered report states are where the sixth finding will be, B5 because a tree-less PASS is the false-green shape. Not a deferral under P-064: nothing is being un-decided, the pass proceeds as soon as the text is corrected, and every correction is minutes of editing. Position-stable: yes — I tried captured-set scoping and a third class first, and both fail on their own terms rather than on preference.

OPEN_ADR true, NARROWLY: the two class definitions and the no-relabelling rule, not the whole document. Reason: the hard terminal is scoped to "the byte-fidelity or transaction-honesty families," and those definitions currently live only in a gitignored-adjacent sprint runtime file. A cap whose scope is defined in an unclonable artifact has no scope. That is the same defect I ruled on twice today, so I am not going to let my own terminal ship with it.

MY LIMITS: Read/Grep/Glob, no Bash. I did not execute anything. The four findings' existence is your report plus my structural read at `:1291`/`:1300`/`:1306`/`:525` — I confirmed the code SHAPES that make ED-308 and the uncovered pairs real; I did not reproduce ED-306, ED-307 or ED-309. Stage the verdict row and hand it to α, and verify presence rather than reporting the intent to append.

---

## ε disposition (2026-07-29)

All five blocking corrections and tightenings T1–T5 are applied in `runtime/sp002-invariants/invariants-v2.md`
(T6 required no change). `invariants-v1.md` is retained unchanged, marked SUPERSEDED, as the exact text this
verdict ruled on. No verifier has been dispatched; the pass remains un-run pending β's confirmation of v2.

The OPEN_ADR item (§3 class definitions + §0 no-relabelling/rename rule needing a git-tracked, capsule-shipped
home) is routed to α — ADR authorship on a ratified hard terminal is above ε's altitude.
