# S-VLADW1-04 — GAUNTLET 1 — **DIAGNOSTIC, NON-QUALIFYING** — CONDUCTOR ADJUDICATION

Conductor: Alex ε · commit `b9b8df3` · evidence `runtime/vlad-w1/s04/gauntlet-1/`
Release rule S4-1…S4-6 pre-committed by β rows 309 (`e7a4b619`) + 310 (`3a5f81c7`).

> **NOTHING HERE FIRES THE TERMINAL.** This run is diagnostic by design: gauntlet-1 → **fix attempt 1** →
> gauntlet-2, the qualifying run. **α applies the rule at the qualifying close, not here and not ε.** This
> document exists to aim the single fix attempt.

## Roster and liveness

| Lane | Record | ok | Verdict |
|---|---|---|---|
| `qa-reviewer` | `d-mtdm85u8-bb053c17` | true | **FAIL** |
| `backend-reviewer` | `d-mtdmnkz7-49be82d4` | true | **FAIL** |
| `security_claude_hunter` | `d-mtdn3ljm-597726a9` | true | **FAIL** |
| `security-reviewer` (agy) | ok:true, 3642 B | true | **FAIL** |

**`gauntlet-verify`: PASS, exit 0** — *"All required gauntlet roles produced a well-formed completion
record"*, 6 records in window. The `fell-back` flag on `security-reviewer` is agy's normal two-record shape,
not a provider failure.

**All three Claude lanes returned JSON on the first dispatch.** The backend lane's family was lost to
truncated mid-thought returns three times across the predecessor's gauntlets; each brief named that failure
to the lane it had happened to. Keep doing that.

Isolation: three mutating lanes SERIALIZED on the live tree; agy alongside. Tree verified by ε between
every lane and at the end — `b9b8df3`, `git status --porcelain -- engine/` = 0, **all probe files removed**,
suite 339/339, `check:ship` exit 0.

---

# THE FINDING THAT ORGANISES ALL THE OTHERS

**Every one of the six HIGHs is a FALSE SENTENCE, not a broken mechanism.**

The mechanisms this build shipped largely hold, and were attacked to establish that:

- The **args door is sound** — the security lane ran a plain array with an index getter and a
  stateful-`toString` element against the real `auditedSpawn`: `getterCalls=1`, `toStringCalls=1`. The
  T4/T8 TOCTOU split cannot be reopened that way.
- **Absorb/delete is symmetric** for every shipped caller.
- **Refuse-not-skip catches every disclosed class**, and the near-miss battery re-run confirmed the seven
  original authorings are now RED.

What fails is **what we wrote about them.** Bundles A, C, D and F each authored a claim stronger than its
mechanism — **in the sprint whose entire subject is claims being stronger than mechanisms.** That is the
recursion to break, and it is why the fix attempt's process rule matters more than any individual repair.

---

## S4-criteria — what the lanes established

**S4-1 TRUTH — FAILS.** Three independent lanes, five distinct false shipped sentences:
`package.json#vladPointerLint` (stale counts, `package.json` ships, absent from the whole diff);
`CUSTODY.md:148` ("only shipped place" — false by construction); bundle A's header sentence claiming the
resemblance class is closed; `spawn-shim.js`'s "STRICTLY NARROWING / adds no new acceptance"; and
`CUSTODY.md:148`'s "points back to this Ceiling by name". **In every case `check:ship` was exit 0 —
mechanism green over false text, which S4-1 explicitly forbids as evidence.**

**S4-2 MECHANISM — FAILS**, on the security lane's F-2: `canonicalizeClaimText` folds `\p{Pd}`, `\s` and
case but performs **no Unicode confusable or normalization fold**, so `PRO​VEN` (ZWSP) and `PRОVEN`
(Cyrillic О) ship GREEN where exact `PROVEN` goes RED. **This is the class β refused a variant enumeration
to close, defeated one alphabet over.** The backend lane's F-3 is the same shape from another direction
(dash COUNT/ABSENCE/zero-whitespace). **S4-2(d) — SATISFIED AT GAUNTLET-1 AGAINST THE PRE-G PREDICATE; OWED AGAIN AT THE QUALIFYING CLOSE.**
The backend lane re-ran the battery against the predicate as built *at `b9b8df3`*, population including
bundle A's own paragraph, and found the undisclosed `**Ceiling** — ` fail-open. **An earlier revision of
this line said "DISCHARGED", which was wrong** (β row 312, msg_id `f2b71e58-4c93-4d07-a86e-51e0c3d9b874`):
**bundle G changes the predicate**, so a gauntlet-1 result about the pre-G predicate says nothing about the
one that will exist at close. A lane must re-run the battery at **gauntlet-2** against the predicate as
built *then*, with the population including bundle A's class-form paragraph **and** the new
ZWSP / homoglyph / emphasis / block-prefix variants.

This is exactly the reasoning ε applied to its own design-phase measurement — *"the empty set is a property
of this predicate at this commit, not a general fact"* — and failed to apply to a lane's result one level
over. Row 310 FIX 3 already drew the line (RF-2's discharge does not discharge S4-2(d)); this is the same
line one step further along, and it is now written into the gauntlet-2 backend brief.

**S4-3 ATOMICITY — FAILS** on the same missing fold: an unbound Ceiling with a ZWSP in the lead-in ships
GREEN, so the bind can be evaded rather than merely drifted.

**S4-4 FALSIFIERS — no lane fully assessed it.** qa confirmed all six have named per-description mutants
with no-op guards and independently re-ran RF-1 and RF-4; backend and security returned cannot-assess.
**Nobody counted DESCRIBED mutations against claimed ones.** Owed at the qualifying run.

**S4-5 AC-8.6 — holds on partial evidence, with one real gap.** The cap is respected, the pointer resolves,
RF-7 is a genuine runtime mutant. **But backend F-4: bundle E's driver runtime-check is
present-but-never-observed-RED** — no test neuters the driver's scrub and observes the throw. *"Enforcement
debt wearing a green badge."*

**S4-6 RESIDUALS — qa says FAILS, backend and security say holds.** The disagreement is narrow and both are
right about different things: **RT-2's NBSP tolerance and RT-8's rollup blindness DO travel** (all three
lanes verified, RT-8 correctly stated as a CLASS). qa's FAIL rests on **F-4 only** — the self-check's real
ceiling (its green is equally consistent with a correct scrub, an absent scrub, and a machine that never
held a credential) is disclosed **only in a code comment**, not where the custody claim's reader is.

---

## Cross-family value — fourth consecutive gauntlet, on ground a Claude lane had cleared

The `security_claude_hunter` lane attacked `spawn-shim`'s `args` with a stateful `toString()` and an index
getter and proved it **sound**. **Nobody applied that technique to `env-scrub`'s `names`.** agy did, from
two excerpts with no tools: elements are not coerced before freezing into `sweepNames`, so a stateful
`toString()` **absorbs one variable and deletes another**.

It also falsified bundle D's own headline: `Object.create(Array.prototype)` passes the new prototype check
but fails `Array.isArray()`. **D's envelope reported a differential probe over 14 shapes with "0 widenings";
agy named the 15th.** Both agy findings are LOW on reachability and HIGH on claim-truth — which is exactly
the S4-1/S4-2 split the rule draws.

**The standing rule holds: a finding all same-family lanes miss is not thereby cleared.**

---

## Going-in items — all four adjudicated, lanes agree

1. **F′'s deviation into bundle A's class-form Ceiling — JUSTIFIED** (qa and backend independently;
   security cannot-assess). Bolded lead-in byte-unchanged, exception bounded twice, P3 re-bounds it, the
   two paragraphs AGREE, and M1 confirms it is still bound. *"Rule 4 binds TEXT and cannot see
   contradiction"* — the alternative was a document asserting AC-8.6 both landed and not, under a green gate.
2. **C's scope exception — JUSTIFIED, mechanically unavoidable, replacement STRICTLY STRONGER** (a positive
   `assert.equal(ac86.resolved, true)` replacing a negative reason assertion). Coupling cost noted. **But it
   is the direct cause of qa F-1** — the shipped `package.json` copy went stale.
3. **Re-ranked LOW by both lanes** — the hand-wrapped literal is a real cross-bundle coupling but **not** a
   latent false-green: `replaceAcrossEol` plus the `assert.notEqual` guard make a re-wrap fail loudly.
4. **The refusal to invent an anchor — CORRECT and endorsed by all three.** Every anchor that WAS named
   checks out (`0732cd8`, `514c2d9`, `55fc6a3`, `5ecda24`, `b27ad76`, `e120edc`, `8b6993e`), including
   *"34 insertions, all comments, no executable change"* verified line-by-line.

---

## What is NOT owed to the fix attempt

Recorded so budget is not spent re-deriving:

- **RT-8's rollup GREENs** (`three of eight controls verified`, `every control is verified`, …) are
  **re-confirmations of a properly disclosed class**, not new findings. `CUSTODY.md:33-40` names it
  explicitly including *"a spelled-out numeral, or the word `every`, passes it"*.
- **RT-2's NBSP tolerance** is disclosed and confirmed GREEN by execution; its control fires correctly.
- **Bundle D's core mechanism** is sound; only its *sentence* and its `Array.isArray` omission need work.
