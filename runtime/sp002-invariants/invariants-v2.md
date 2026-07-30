# SP-20260725-002 — the WRITTEN INVARIANTS of `memory-apply.js` (v2)

**Status:** v2, authored by Alex ε 2026-07-29. **Supersedes v1** (`invariants-v1.md`), which β ruled on as
CONFIRMED-WITH-CORRECTIONS (DECIDE, class B, 0.89, msg_id `4b2e8f17-6c93-4d5a-b8e1-0f7a29d3c6b4`, OPEN_ADR true
narrowly). Every blocking correction B1–B5 and tightenings T1–T5 are applied below; T6 required no change.
**Subject code:** `scripts/checks/memory-apply.js` @ `8adf768b` (read at `.worktrees/sp002-r14/`).
**Method:** state the guarantees as text, β confirms the text, *then* a fresh verifier checks the code against
the text. Checking code against reported findings is what produced five rounds.

**Changes from v1, so a reader can see what β moved:** I1.f was a false-RED generator and is now delta-scoped
(B1). I2 gained an explicit honest-residual branch, because the code can legitimately report residual change and
v1 would have red-flagged correct behaviour (B2). The BF/TH partition had a hole that let a finding escape the
hard terminal, closed by making an existence change a byte difference (B3). A totality clause was added over the
reported-state space (B4). §8 now states what a PASS does *not* mean (B5).

---

## 0. What this document is, and is not

It is a statement of the **claimed contract** — what a caller who reads `ok`, `applied` and `rolledBack` is
entitled to believe about the world. Each claim is **falsifiable by observing the store before and after a run**,
with no reference to how the code is built.

It is **not** a description of mechanisms. The words rename, descriptor, temp, backup, unlink and post-check do
not appear in any invariant below, on purpose. A guarantee phrased as "atomicWriteInStore does X" is unfalsifiable
by observation and cannot be verified independently of the implementation that motivated it — the shape that let
four rounds pass while the outcomes stayed broken.

**If the code cannot meet an invariant, weaken the REPORTED CLAIM, never the invariant.** And per β's
strengthening: **if a field's meaning must narrow, RENAME the field.** Keeping `rolledBack:true` while narrowing
what it documents is the relabelling fix, and it is worse than it appears — the narrowed meaning lives in a doc,
while the field name reaches every caller who already read the old one, so the false guarantee survives the fix
silently for exactly the readers who cannot see the change. A rename breaks those readers loudly instead. Same
reasoning as ADR-0039 §A2.1 condition 2.

---

## 1. Vocabulary — the ENUMERATED path set

Every guarantee below is scoped to explicitly named sets. **No guarantee is scoped to "the store" informally, and
none is scoped to the set of paths the implementation happens to have captured.** β confirmed this and asked that
it not be softened: a guarantee scoped to what the implementation chose to track is satisfiable by tracking less,
so it is not a guarantee, it is a description.

Let `S` be the memory-store directory (flat; no subdirectories are read or written) and `P` the plan.

| Symbol | Definition |
|---|---|
| `E_pre` | the set of **directory entry names** in `S` immediately before the run does any filesystem work |
| `E_post` | the set of directory entry names in `S` at the instant the result is returned to the caller |
| `bytes(n)` | the exact byte sequence of entry `n` in `S`, or `⊥` if `n` is absent |
| `T` | the **target set**: for each change in `P` with `action` `correct` or `delete`, the store entry it names, resolved to its canonical on-disk name |
| `I` | the index entry `MEMORY.md` — exactly one name, always in scope, unconditionally |
| `Δ` | the **intended change set**: for each `correct`, target content becomes exactly its `newBody`; for each `delete`, the target becomes absent and `I` loses exactly the whole index lines naming deleted files. Nothing else is in `Δ`. |

**Scope.** Every guarantee is scoped to `E_pre` / `E_post` and the bytes of every entry in them — the whole
directory. Explicitly **not** `T ∪ {I}`.

**`⊥` is a byte value (B3).** For classification and comparison purposes, `⊥` participates as a value: an
**existence change** — an entry that appears or disappears — **IS a byte difference**. This is what makes the two
classes in §3 cover the whole space, and it is load-bearing for the hard terminal, not cosmetic.

**Name comparison (T1).** The platform is Windows and the code already raises on ambiguous case-variant
filenames. So `E_pre`/`E_post` equality is compared **by canonical on-disk name**, and a **case-only rename is an
existence change** (one name disappears, another appears). Left unstated, a verifier either misses a case-rename
or reds a legitimate one.

**Byte fidelity means bytes.** Identical length and identical content: line terminators (a CRLF store stays
CRLF), presence or absence of a trailing newline, a leading BOM, and any byte sequence that is not valid UTF-8.
"Semantically equivalent text" satisfies nothing here. No claim may be established by a path that decodes bytes
to a string and re-encodes them, because that round trip is not the identity.

---

## 2. The invariants

### I1 — `ok:true, applied:true, dryRun:false` (a successful apply)

Entitled belief: **exactly the intended change happened, and nothing else did.**

1. **I1.a — intended content, exactly.** For every `correct` in `P`, `bytes(target)` equals that change's
   `newBody` byte for byte. **Precondition (T2):** a `correct` naming a target absent from `E_pre` is **refused
   into I2**, never applied — otherwise I1.a and I1.e contradict each other.
2. **I1.b — intended removal.** For every `delete` in `P`, its target is absent from `E_post`.
3. **I1.c — index fidelity on retained content.** `bytes(I)` differs from its pre-run value *only* by the removal
   of whole index lines naming deleted files. Every retained byte of `I` is identical — including the line
   terminator of every retained line, the file's trailing-newline state, and any invalid-UTF-8 sequence it holds.
4. **I1.d — no collateral content change.** For every name `n` in `E_post` that is not in `T` and is not `I`,
   `bytes(n)` is identical to its pre-run value.
5. **I1.e — no collateral entries.** `E_post ⊆ E_pre`, and `E_pre \ E_post` is exactly the set of deleted
   targets. No entry was added — in particular `E_post` contains no working file of the tool's own making.
   **Named disagreement with the code (T3):** the implementation labels its stray-working-file scan "HYGIENE
   ONLY, EXPLICITLY NOT A CONTROL." This document deliberately promotes that absence from hygiene to a
   guarantee, because a residual working file is observable state the caller was not told about. The
   disagreement is named here so a verifier does not hand-wave it; per §0 the resolution is to fix the code or
   weaken the report, **never** to demote the invariant.
6. **I1.f — introduces no structural finding (B1, delta-scoped).** The run introduces **no detector finding that
   was not already present in `E_pre`**. This is deliberately *not* "the detector reports zero findings over
   `S`": that would be a property of the store's prior state, so a store carrying a pre-existing finding the
   plan never addressed would red a perfectly compliant apply. A verifier that reds correct behaviour trains
   everyone to dismiss it, which is how the false-green arrives later.

### I2 — `ok:false` with `dryRun:false` (any refusal or failure of an apply)

Entitled belief: **the world is indistinguishable from the world in which the command was never run** — except on
one explicitly reported branch.

1. **I2.a — no entry changed existence.** `E_post` = `E_pre`. Nothing added, nothing removed, including any
   working file of the tool's own making.
2. **I2.b — no bytes changed.** For every name `n` in `E_pre`, `bytes(n)` is identical to its pre-run value.
3. **I2.c — the honest-residual branch (B2).** If the run **explicitly reports residual change**, the assertion
   is *not* byte identity. It is instead: **every differing path is named in the result, and the exit status is
   non-zero.** This branch exists because the code can legitimately emit a report naming residual change, and v1
   would have red-flagged exactly the honest behaviour §0 asks for. The branch is stated **inside** the invariant
   rather than as surrounding prose, because an invariant whose exception lives in an adjacent paragraph is an
   invariant the verifier will apply without the exception.

I2 is one statement over outcomes and holds **regardless of where the failure arose** — an invalid plan, a
precondition, a fault partway through, a verification step that could not run, or a failed restore. It is
deliberately not a per-branch promise: a promise assembled from several branches agreeing with each other is only
as strong as the branch nobody re-read.

### I3 — `rolledBack:true` (with `rollbackVerified:true`)

Entitled belief: **everything I2 promises, established by looking at the store afterwards** rather than by the
restore path reporting its own success.

1. **I3.a** — I2.a and I2.b both hold.
2. **I3.b — the observation is over the directory.** The claim is grounded in an observation of `E_post` and the
   bytes of every entry in it. Not in a comparison restricted to entries captured beforehand, and not in the
   absence of a thrown error during restore. (An additional necessary condition such as "no restore error
   occurred" is fine and makes the claim strictly harder; the objection is to such a condition being the
   **ground** of the claim.)
3. **I3.c — the negative is honest and loud.** When the store is not provably back to its pre-run state, the
   result reports `rolledBack:false`, names every path that differs, and exits non-zero. Silence is not an
   option, and neither is a swallowed error: an error encountered while cleaning up or restoring must be
   reflected in the reported state, never discarded.

### I4 — TOTALITY of the reported-state space (B4)

Every combination of the reported fields that the code **can actually emit** maps to exactly one assertion set
among I1–I3. **Any emittable combination that no invariant covers is itself a finding.** Uncovered report states
are where the next defect lives, because the verifier has nothing to assert there and silence reads as a pass.
This is §A2.1's no-silent-outcome condition applied to the report surface.

Two combinations are known emittable and uncovered as of `8adf768b`:

- **(`rolledBack:false`, `rollbackVerified:true`)** — emittable because `rollbackVerified` is computed from the
  observed-difference set alone while `rolledBack` additionally requires that no restore error occurred. It reads
  as "verified, and it failed anyway."
- **(`ok:true`, `applied:false`, `dryRun:false`)** — an empty or no-op plan.

The verifier must **enumerate the combinations the code can emit**, not the ones this document happens to discuss.

---

## 3. The two class boundaries — stated as OUTCOMES

A finding is classified by **what became untrue about the world or the report**, never by which mechanism
produced it.

**Class BF — BYTE FIDELITY.** Bytes the caller did not ask to change are different afterwards, **or** bytes the
caller did ask to change are not exactly what was asked for. Because `⊥` is a byte value (§1), **an existence
change is a byte difference**, so an entry that appears or disappears unbidden is BF. Indifferent to whether the
cause was a text round trip, a line-ending rewrite, a partial write, or a write that landed somewhere unintended.

**Class TH — TRANSACTION HONESTY.** A reported result state does not correspond to the actual state of the world:
a reported failure over a store that changed, a reported clean rollback over a store holding residual change, a
reported success over a store that is not as described, or any error discarded such that the report is made
cleaner than the world.

**The seam β closed (B3).** Consider a successful apply that leaves a working file behind and **reports it
honestly**. The report corresponds to the world, so it is not TH. Under v1's phrasing — BF being about "the
content of paths" — it was not BF either, so it fell in **neither class**. Since the hard terminal is scoped to
exactly the byte-fidelity and transaction-honesty families, a finding in neither class **would not trip the
terminal**: a hole in the cap, not a taxonomy quibble. With `⊥` as a byte value it is BF by construction.
Corrected example: **a residual entry is ALWAYS BF**, and *additionally* TH when the report does not name it.
Every violation of I1.e and I2.a is therefore BF, and the two classes together cover the whole space — so the
terminal has no escape hatch. A third class was considered and rejected: it would require the terminal to be
rewritten and re-ratified, and any class outside the terminal's two is itself an escape hatch.

---

## 4. Non-vacuity, and the invariants with no known falsifier

Four findings are open against `8adf768b`:

| Finding | Falsifies | Class | The outcome |
|---|---|---|---|
| **ED-306** | **I1.c** | BF | A successful delete rewrites the line endings of every *retained* index line while reporting `ok:true, applied:true`. A CRLF-authored store is silently normalised. |
| **ED-307** | **I2.a / I2.b** | TH (+BF) | A failed apply can leave the store already changed, so `ok:false` does not imply the run never happened. |
| **ED-308** | **I3.b** | TH | The rollback claim is established over captured paths only, so a *new* entry leaves `rolledBack:true, rollbackVerified:true` standing while the directory is demonstrably different. |
| **ED-309** | **I3.c** | TH | A cleanup error is discarded, so a residual working file survives under a clean-rollback report — and then blocks every subsequent run, so the false report also disables the tool. |

ED-308 is why §1 insists the scope is the directory rather than the captured set: written the other way, ED-308 is
compliance rather than a defect.

**Five invariants have NO named falsifier: I1.a, I1.b, I1.d, I1.e, I1.f.** They are observable, so the risk is not
unfalsifiability — it is that a verifier re-checking four known findings **passes them by assumption**. Two get
**required positive probes**, without which they pass for free:

- **I1.d requires** a store holding at least two unrelated entries, one **CRLF-authored** and one containing
  **invalid UTF-8**, neither named by the plan. I1.d is ED-306's family (a collateral rewrite) one path over.
- **I1.e requires** a probe for a residual working file **after a CLEAN, successful apply**. This is ED-309's
  shape on the **success** path, and nobody has probed it — every round looked for residual files after a
  *failure*.

---

## 5. How to falsify each invariant by observation

The verifier needs no knowledge of the implementation. For any run:

1. Before the run, record `E_pre` and `bytes(n)` for every `n` in `E_pre`.
2. Run the command. Record the **full** reported result — every field, not only the one being asserted.
3. After the run, record `E_post` and `bytes(n)` for every `n` in `E_post`.
4. Decide by the reported state: `ok:true, applied:true` → assert I1.a–I1.f · `ok:false` → assert I2.a–I2.b, or
   I2.c if the run reports residual change · `rolledBack:true` → assert I3.a–I3.b · `rolledBack:false` → assert
   I3.c. Then apply **I4**: if the emitted field combination matches no invariant, that is a finding.
5. For I3.b, include a case where **a new entry appears outside any plausible captured set**. That is the
   discriminating case; a verifier that omits it cannot distinguish I3.b from its violation.

Three adversarial cases are **required**, each being the only case that discriminates its invariant from a weaker
one the code already satisfies: (a) an index authored with CRLF holding at least one invalid-UTF-8 sequence
(discriminates I1.c and I1.d from "the text is equivalent"); (b) a failure induced late enough that content has
already been written (discriminates I2 from "we validated the plan before touching anything"); (c) a residual
working file after a clean apply (discriminates I1.e, and is unprobed by every prior round).

---

## 6. The hold — and the mechanism that stops it reading as a pass

`--apply` is **held fail-closed** in WarpOS 1.2.0 (ED-310): the exported `run()` refuses before any filesystem
work. β confirmed all three points explicitly:

1. **The hold satisfies no invariant.** It makes I1 and the apply-path portions of I2/I3 *unreachable through the
   shipped entry point*. **Unreachable is not sound.**
2. **A probe absorbed by the refusal is `could-not-run`, never `ok`.**
3. The subject is the code at `8adf768b`, which predates the hold.

**The mechanism, not the convention.** "The verifier must not report the hold as a pass" is a rule with nothing
detecting its violation, so it is replaced by two counted requirements:

- The verifier **reports the count of apply-probes that EXECUTED versus were REFUSED** by the hold. **A run with
  zero executed apply-probes is a `could-not-run` verdict OVERALL** — not a PASS with a caveat.
- Before any I1 assertion counts, the verifier must hold **positive proof the executor ran**: an **observed byte
  change** on a successful probe. **Absence of a refusal message is not evidence of execution** — that is
  tell-absence reasoning, which has been refused all sprint.

---

## 7. Deliberate silences

Named so absence is not read as permission — an unstated case is an open question, not an allowance.

- **Concurrency** (T6, unchanged). Every invariant is stated for a single run against a store no other writer
  touches concurrently. The multi-writer case is out of scope and tracked separately (ED-301's re-entry
  condition). A verifier must not construct a concurrent probe and read its outcome as a violation of I1–I4.
- **Durability** (T6, unchanged). These are invariants about what is observable after the call returns, not about
  surviving a power loss or an OS crash mid-run.
- **Permissions and ownership (T5) — unclaimed is NOT licensed.** The invariants speak to entry names and bytes;
  mode, ownership and timestamps are not claimed either way. That is not permission to change them: a run that
  alters the mode or ownership of a retained entry is **a finding to report**, even though no invariant covers it.

**Disposition of a finding in NEITHER class (β `2e8f4a51`).** A finding can be real and reportable and still sit
outside both BF and TH — a mode or ownership alteration is the named example. Such a finding is **reported and
dispositioned normally, with an ED row, and it does NOT trip the hard terminal.** This is not the B3 seam
returning: the terminal was deliberately scoped to the two core families, and a mode defect is outside them **by
design rather than by wording** (§3's `⊥`-as-byte-value closure means no *existence or content* finding can land
outside BF). It is stated explicitly because "outside the classes" is exactly where an argument happens at round
seven, in both directions — someone arguing such a finding should have tripped the cap, and someone arguing that
being outside the families means it need not be recorded at all. Both are foreclosed here.

**Promoted OUT of the silences (T4): the dry-run path.** `dryRun:true` sits outside I1–I3, and for the *executor
contract* that is fine. But **dry-run is the only path that ships reachable in 1.2.0**, so the release cannot
treat it as a silence. Its guarantee, stated: a dry-run changes nothing (`E_post` = `E_pre`, all bytes identical)
and refuses every plan an apply would refuse, so it can never promise an operation the apply path would reject.

---

## 8. What a PASS here does NOT mean — required in the verdict text (B5)

The subject is `8adf768b`. **WarpOS 1.2.0 ships the r13 tree, which is strictly worse:** it carries S-3, S-5 and
B-6 unchanged, *plus* the S-2 defect that r14b fixed. A PASS against `8adf768b` therefore says **nothing about
the shipped tree**, whose executor is held.

The verifier's verdict text must **name the tree it ran against and state this limitation in itself**, not leave
it to a reader to infer. Without that line a future reader converts "invariants PASS" into "the shipped code is
sound" — the exact false-green this hold exists to prevent.

---

## 9. Owed: a clonable home for the class definitions (β OPEN_ADR, narrow)

β set OPEN_ADR **true, narrowly** — for the **two class definitions (§3) and the no-relabelling rule (§0)**, not
for this document as a whole. The reason is structural: the hard terminal is scoped to "the byte-fidelity or
transaction-honesty families," and those definitions currently live only in this sprint runtime file. **A cap
whose scope is defined in an unclonable artifact has no scope** — the same defect ruled on twice on 2026-07-29
(the gitignored betaEvents citation, and the gitignored enforcement-debt id in a shipped refusal string).

Action owed: §3's two class definitions and §0's no-relabelling/rename rule must land in a **git-tracked,
capsule-shipped** artifact — an ADR is the natural home, and ADR-0039 §A2.1 is the adjacent doctrine. Until then
the terminal's scope is defined only here. Routing this to α: ADR authorship on a ratified terminal is above ε's
altitude.
