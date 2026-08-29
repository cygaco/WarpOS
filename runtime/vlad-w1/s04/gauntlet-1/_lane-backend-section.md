---

# YOUR LANE — `backend-reviewer` (BINDING)

Scope: **code quality of the engine and its enforcers.** Claim truth belongs to the qa lane; do not
duplicate it. Your question is whether the MECHANISMS this build introduced actually do what they say.

Worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, commit `b9b8df3`. Paths
relative to `engine/`.

## YOU OWN S4-2(d) — THE BATTERY RE-RUN. This is your headline deliverable.

β assigned this to a **gauntlet lane and explicitly NOT to ε**, citing P-097: *bundle A controls both the
artifact and the thing judging it*, and ε designed the predicate. ε ran a battery at design time and again
after bundle A as a **sanity check** — **that does not discharge this obligation, and neither does RF-2**
(discharged at design, not in S4-4's set).

**Re-run the near-miss battery against the predicate AS BUILT**, controls first. Requirements:

- **Population MUST include bundle A's newly-authored class-form Ceiling paragraph** — the one beginning
  *"**Ceiling — this package does not verify that its controls are invoked in YOUR install.**"* A controls
  its own artifact and its own judge, so that paragraph is precisely the one an independent lane must test.
- **Controls first.** A rule whose control does not fire proves nothing about its variants. Report the
  control result per rule; a row with a dead control is void.
- Cover **every bound rule**, not only the derivation: **RT-1** derivation, **RT-2** carrier-note binding,
  **RT-7** status-token separation, **RT-8** aggregate/rollup.
- Method note: `lintCustodyStatement(content)` is a pure function — you can probe with in-memory strings and
  mutate nothing. That is how ε ran it; you are free to choose differently, but if you mutate the tree,
  restore it.

Report, per rule: control RED? each variant RED or a **named blindness**. ε's design-phase run found 13
blindnesses across three rules and, after bundle A, 2 remaining — both deliberately disclosed. **Verify that
independently. If you find a blindness ε's battery missed, that is the most valuable finding available in
this run.**

## The mechanisms to review as CODE

1. **`canonicalizeClaimText`** (`scripts/checks/custody-claim-lint.js`). β required a **named canonical
   transform**, not an enumeration: *"an enumeration of the four observed variants does NOT satisfy this."*
   Read it. Is it applied to BOTH sides of every token comparison? Is there any hardcoded dash-variant
   literal anywhere? What does the transform NOT fold, and is that ceiling stated in the header?
2. **Refuse-not-skip.** The old `continue`-on-non-match is the sprint's headline defect. Does the new code
   REFUSE by name? **And check the over-refusal direction** — `Status`, `Enforcer`, `Proof scope` are
   P-clause metadata and must NOT become violations.
3. **The `args.map` door** (`src/spawn-shim.js`). D replaced the caller-controlled `.map` with an indexed
   loop performing no method lookup. Verify by reading: can a caller still influence normalization through
   `Symbol.iterator`, `constructor[Symbol.species]`, a getter on `length`, or an index accessor? D claims
   0 widenings across 14 container shapes — **test that claim, do not accept it.**
4. **Absorb/delete symmetry** (`src/env-scrub.js`). E claims both loops now iterate one derived population.
   Verify, and check the deletion population did not widen beyond names this module captured.
5. **AC-8.6's self-check** (`src/server-entry.js`). Is RF-7's RED genuinely at RUNTIME rather than text/AST?
   Remove the invocation and see what actually fails and why.

## Standing questions worth your budget

- **The walker's disclosed residuals** (aliased imports, re-bound references, computed member access) are
  disclosed; a re-confirmation is not a new finding. **A disclosed residual INSTANTIATED on the shipped
  graph IS one** — that exact distinction defeated the control in the predecessor's gauntlet-2.
- **Going-in item 3:** the Rule 4 mutant test depends on a hand-wrapped line break. Confirm or refute, and
  judge whether it is a latent false-green.

## Emit the JSON. This lane specifically has form.

This lane's family was lost to truncated mid-thought returns three times across the predecessor's gauntlets
— each time it had done substantial real work and none of it counted. **Budget so that emitting the JSON is
never what you run out of room for.** If you are running long, stop investigating, cut scope, and emit with
honest `what_i_could_not_assess` entries.

## What you own

Deciding lane for **S4-2** (including (d), the battery re-run) and contributing on **S4-3**, **S4-4**,
**S4-5**. Say `cannot-assess` where you could not look.
