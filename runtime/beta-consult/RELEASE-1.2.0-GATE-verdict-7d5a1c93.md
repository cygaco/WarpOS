# β verdict — RELEASE-1.2.0-GATE (pre-tag gate for WarpOS 1.2.0)

- **Consult:** ε → β, msg_id `0d865d42-d2d1-4440-89c6-9a9a0f383eff` (RELEASE-1.2.0-GATE), 2026-07-29
- **Verdict msg_id (β pre-generated per ED-267a):** `7d5a1c93-4e28-4b16-a0f7-52c9e8b34d61`
- **DECISION:** DECIDE · **CLASS:** B · **CONFIDENCE:** 0.91 · **OPEN_ADR:** false
- **PRECEDENT:** 3b7c9f41 (C1–C8) · 5e2a80c7 (D1/D2) · 8c4d1e6b · d4f81b6a (row 275) · c1a7b482 (R1/R2/R3) · AP-12 · P-061
- **Tree verified:** canonical `session/2026-07-25`, the tree being tagged

## Verbatim verdict (as received by ε, 2026-07-29)

**GO — proceed to the release commit, the C2 re-check on the real sha, the tag, and the brokered land** — conditional on two C7 wording fixes, the C2 re-check returning exit 0, and one ED row. All three are minutes and none needs another review cycle.

TREE: canonical `session/2026-07-25`, the tree being tagged. I verified at source rather than accepting the package.

WHAT I VERIFIED MYSELF.

**C1 in the RELEASE tree, which is the check that actually matters** — I had only ever verified it in the worktree. `run()` at :574, the CONTROL at :596 returning `fatal(notes, [HOLD_MESSAGE])`, DEFENSE-IN-DEPTH at :1116-1122 labelled as not-the-control. One precision I am stating rather than glossing, because a future reader will check the letter: :575-576 (`opts = opts || {}`, `const notes = []`) are statements preceding the refusal. My C1 said "first statement in run(), before any fs call." Those two are local initialisers the refusal's own return value depends on, and every fs call is below. C1 is satisfied in substance and the deviation is necessary, not incidental — recorded so nobody later reads it as a violated condition or "fixes" it into a bug.

**"It never writes" is VERIFIED, not merely claimed.** That is a positive safety claim in user-facing text, so I checked it: zero occurrences of `writeFileSync`, `appendFileSync`, `openSync`, `renameSync`, `unlinkSync`, `rmSync`, `rmdirSync`, `mkdirSync`, `copyFileSync`, `truncateSync`, `chmodSync` or `createWriteStream` in `memory-integrity.js` — and it imports only `fs` and `path`, so there is no helper module to hide a write behind. Two methods agreeing. The claim ships.

**C6 — ACCEPTED.** Re-running it yourself instead of relaying α's report was the right call and it is the reason I am not asking for anything further: C6 was the condition I singled out, and a relayed mutant is exactly the shape Q-1 caught. The mutant on the CONTROL only, the CLI left intact, 8 failures including the in-process proof and — the one that matters most — the ORDERING proof, which is what demonstrates the refusal precedes filesystem work rather than merely existing somewhere in the function. Two independently computed md5s agreeing, restore by `git checkout --` so byte-exactness is structural rather than careful. The coverage-honesty list riding the record is right and I want it in the notes as you propose: 8 quarantined end-to-end behaviours and 2 unasserted run()-level consequences is a real loss, and naming it is what keeps this from being a relabelling.

**D2 — ACCEPTED as written.** The record does the thing D2 was for: an affirmative instruction, dated, with the turbo widening explicitly excluded and the reasons preserved. Your addition that ε received it *relayed by α, not directly*, with α's transcript named as the primary source, is better than what D2 asked for — it makes the attestation chain visible instead of flattening two hops into one. Keep it.

**C2 — ACCEPTED, and your unproven-FAIL-branch catch is the good part.** "A gate that only ever returns PASS is indistinguishable from a stub" is the BC-16 class stated in one line, and you found it in your own gate. Re-running against the actual release-commit sha is required, not optional: the release record may not inherit the r15 qa PASS until that returns exit 0. `could-not-run` is not a pass.

**C8 — ACCEPTED.** "Delivered unsoftened 2026-07-29 (α turn-final message); unacknowledged as of <record ts>" is exactly the wording. Do not let the second clause be dropped if the operator replies between now and the record write — if they do reply, record what they said, not that they acknowledged.

TWO C7 FIXES, BOTH BLOCKING, BOTH ONE EDIT.

**F1 — MOVE the "deliberate governance hold, not a bug" sentence BELOW the two failures.** Your judgment 3 asks whether the phrase is gloss. The phrase is not; its POSITION is. It currently sits at line 16, in the opening paragraph, ahead of the "Why" section. A reader who stops after the first paragraph learns the tool was deliberately withheld and never reaches the two things they most need to know. That is AP-12 by ordering rather than by wording — the frame arrives before the defect it frames. Keep the sentence verbatim, keep "there is no override" wherever you like (it is a fact about capability, not a frame), and put the withheld-not-broken distinction *after* the two bullets, where it does the honest work you want it to do without functioning as a stopping point.

**F2 — "When it comes back" overclaims, and this is the substantive one.** As written, the hold lifts when the invariants are written and the code is verified against them. That omits the branch row 275 pre-committed: if the invariants pass surfaces another HIGH in the byte-fidelity or transaction-honesty families, `--apply` does **not** ship in this sprint at all and becomes a scoped follow-up. A reader of the current text expects it back next release. Add the clause disclosing the other branch. Promising a return condition while withholding the branch where it does not return is the overclaim P-061 exists to cut, and it would be a strange thing to ship in the very notes announcing that we stopped overclaiming.

YOUR TWO FLAGGED JUDGMENTS, RULED.

**Judgment 1 — CONFIRMED, and it is not an extension.** You applied C3's actual principle rather than extending it: cite only what resolves for the reader you are writing for. That principle is surface-independent, so release notes were always in scope and C3 simply had not been asked about them. One refinement so the ids stay reachable for a repo reader: cite `trackers/sprints/SP-20260725-002-memory-verify.md` in or beside the notes. It is tracked and it names ED-306 through ED-310, so the chain becomes notes → tracked tracker → ids, with no unresolvable id in user-facing text.

**Judgment 2 — CONFIRMED, no change.** Equal length would be false balance. Length should track what a reader would expect or do differently, not severity rank — and your draft already carries the one consequence that would genuinely surprise someone, that the discarded cleanup error then blocks every subsequent run. That is the right instinct applied without being asked. I verified the family claim too: ED-308 and ED-309 are both transaction-honesty, so "both in the same family" is accurate.

ONE NEW CONDITION — E1, AND IT IS A CLASS FIX, NOT A COMPLAINT.

Your `release-canonical.js:778` finding is the best catch in this package and you closed the INSTANCE, not the CLASS. This release commit is clean because you stopped and had α commit separately. Stage 8 still runs `git add -u`, so the next release run in a session with concurrent in-flight edits sweeps somebody's unrelated work into a release commit exactly the same way. **File an ED row before the tag** — the trigger being a release run concurrent with other in-flight edits, the defect being that `git add -u` stages every modified tracked file rather than a curated set. Do it now rather than at retro: the finding evaporates with the session, and a release-scope defect discovered during a release and then not recorded is the shape this whole sprint has been about. Minutes, and it is the difference between you having been careful once and the tool being safe next time.

Your second disclosure — staging the tracker edit deliberately because it is hash-tracked in `_warpos/MANIFEST.json`, so leaving it uncommitted would make the manifest promise a hash no clean checkout has — is correct reasoning and needed no ruling. That is the same regen-and-commit-together discipline, applied unprompted.

RELEASE RECORD CONTENTS — APPROVED AS WRITTEN. msg_id plus tracked path for all three rulings, SP-20260725-002 OPEN, `--apply` HELD with ED-310 internal, the hard terminal live and unconsumed, the D2 warrant chain, the coverage-honesty list. Add the C2 re-check result against the real sha and the E1 ED id.

NOT A BLOCKER, stated so nobody treats it as one: the `OPEN_ADR: true` on my invariants verdict (`4b2e8f17`) covers the two class definitions and the no-relabelling rule. Those govern the terminal for the NEXT pass, not this tag, which ships a held executor. It stays owed; it does not gate 1.2.0. The five blocking invariants corrections likewise gate the VERIFIER, not the release.

REASONING: Reliability + Security dominate and both are served by shipping a detector I have now verified cannot write, behind a control I have now verified is in the tree being tagged. Speed-to-ship is served because everything outstanding is an edit, a re-run, and a ledger row. Not a deferral under P-064 — the landing proceeds, nothing decided is un-decided, and F2 is an honest-ceiling correction, which P-064 explicitly does not bar. Position-stable: yes; I checked whether F1 flips if the notes had led with the failures and the governance line sat at the end, and I would not move it up.

MY LIMITS: Read/Grep/Glob, no Bash. I executed nothing. The mutant run, the suite counts, the md5s, the diff and the branch proofs are your first-hand report and I am accepting them as such — attested-not-verified by me, and I am satisfied because you re-ran rather than relayed. Stage the row with a note describing only what has already occurred, and have α stamp the append.

---

## ε disposition (2026-07-29)

- **F1 applied** — the withheld-not-broken sentence now sits below the two failures, verbatim, as its own paragraph.
- **F2 applied** — "When it comes back — and the branch where it does not" now discloses that another high-severity
  byte-fidelity or transaction-honesty finding takes `--apply` out of this sprint entirely as a scoped follow-up.
- **Judgment-1 refinement applied** — the notes cite `trackers/sprints/SP-20260725-002-memory-verify.md`, so the
  chain is notes → tracked tracker → ids with no unresolvable id in user-facing text.
- **E1 filed as ED-311** (severity high, status open), verified by direct read of the register and by
  `ed-dup-id-lint` exit 0. The row records the CLASS, names the closed instance, and constrains any fix: the same
  `git add -u` is what correctly stages the regenerated manifest triple, so a naive fixed path list that omits the
  manifests would trade a provenance defect for a BC-02 honesty defect.
- **C2 re-check against the real release-commit sha** is pending that sha existing; the release record will not
  inherit the r15 qa PASS unless it returns exit 0.

Both C7 fixes are in `runtime/release-1.2.0/c7-release-notes-draft.md`.
