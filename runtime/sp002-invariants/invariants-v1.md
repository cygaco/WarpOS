# SP-20260725-002 — the WRITTEN INVARIANTS of `memory-apply.js`

**Status:** v1 — **SUPERSEDED by `invariants-v2.md`.** Retained unchanged as the exact text β ruled on
(CONFIRMED-WITH-CORRECTIONS, DECIDE B/0.89, msg_id `4b2e8f17-6c93-4d5a-b8e1-0f7a29d3c6b4`, OPEN_ADR true
narrowly). Do not verify against this file: two of its clauses (I1.f, and I2 without the honest-residual branch)
would make a verifier report falsely, and its class partition has a hole that lets a finding escape the hard
terminal. All corrections are applied in v2.
**Subject code:** `scripts/checks/memory-apply.js` @ `8adf768b` (read at `.worktrees/sp002-r14/`).
**Method (β's reserved pass):** state what the reported result states GUARANTEE, as text, first; β confirms the
text; only then does a fresh verifier check the code against this text. The four prior rounds checked the code
against *reported findings*, which is what produced five rounds.

---

## 0. What this document is, and is not

It is a statement of the **claimed contract** — what a caller who reads `ok`, `applied` and `rolledBack` is
entitled to believe about the world. It is written so that each claim can be **falsified by observing the store
before and after a run**, with no reference to how the code is built.

It is **not** a description of mechanisms. The words rename, descriptor, temp, backup, unlink and post-check do
not appear in any invariant below, on purpose. A guarantee phrased as "atomicWriteInStore does X" is unfalsifiable
by observation and cannot be verified independently of the implementation that motivated it — that is the shape
that let four rounds pass while the outcomes stayed broken.

**If the code cannot meet an invariant, the honest resolution is to weaken the REPORTED CLAIM, not the
invariant.** A run that cannot guarantee byte identity must stop reporting `rolledBack:true`; it must not keep
the field and narrow what the field is documented to mean. Relabelling is how a false guarantee survives a fix.

---

## 1. Vocabulary — the ENUMERATED path set

Every guarantee below is scoped to explicitly named sets. **No guarantee is scoped to "the store" informally, and
none is scoped to the set of paths the implementation happens to have captured.** That distinction is the single
most load-bearing thing in this document.

Let `S` be the memory-store directory (flat; no subdirectories are read or written) and `P` the plan.

| Symbol | Definition |
|---|---|
| `E_pre` | the set of **directory entry names** in `S` immediately before the run does any filesystem work |
| `E_post` | the set of directory entry names in `S` at the instant the result is returned to the caller |
| `bytes(n)` | the exact byte sequence of entry `n` in `S`, or `⊥` if `n` is absent |
| `T` | the **target set**: for each change in `P` with `action` `correct` or `delete`, the store entry it names, resolved to its canonical on-disk name |
| `I` | the index entry `MEMORY.md` — exactly one name, always in scope, unconditionally |
| `Δ` | the **intended change set**: for each `correct`, target content becomes exactly its `newBody`; for each `delete`, the target becomes absent and `I` loses exactly the whole index lines naming deleted files. Nothing else is in `Δ`. |

**The scope of every guarantee below is `E_pre` / `E_post` and the bytes of every entry in them — the whole
directory.** It is explicitly *not* `T ∪ {I}`. A guarantee scoped to the paths the run chose to track can always
be satisfied by tracking fewer paths, which makes it worthless as a guarantee.

**Byte fidelity is byte fidelity.** Where an invariant says two byte sequences are identical, it means identical
as bytes: identical length and identical content. It specifically includes line terminators (a CRLF store stays
CRLF), the presence or absence of a trailing newline, a leading BOM, and any byte sequence that is not valid
UTF-8. "Semantically equivalent text" does not satisfy any invariant here. No claim may be established by a path
that decodes bytes to a string and re-encodes them, because that round trip is not the identity.

---

## 2. The three invariants

### I1 — `ok:true, applied:true, dryRun:false` (a successful apply)

A caller reading this is entitled to believe: **exactly the intended change happened, and nothing else did.**

1. **I1.a — intended content, exactly.** For every `correct` in `P`, `bytes(target)` equals that change's
   `newBody` byte for byte.
2. **I1.b — intended removal.** For every `delete` in `P`, its target is absent from `E_post`.
3. **I1.c — index fidelity on retained content.** `bytes(I)` differs from its pre-run value *only* by the removal
   of whole index lines naming deleted files. Every retained byte of `I` is identical — including the line
   terminator of every retained line, the file's trailing-newline state, and any invalid-UTF-8 sequence it holds.
4. **I1.d — no collateral content change.** For every name `n` in `E_post` that is not in `T` and is not `I`,
   `bytes(n)` is identical to its pre-run value.
5. **I1.e — no collateral entries.** `E_post ⊆ E_pre`, and `E_pre \ E_post` is exactly the set of deleted
   targets. No entry was added — in particular `E_post` contains no working file of the tool's own making.
6. **I1.f — the store is clean.** The read-only structural detector reports zero findings over `S`.

### I2 — `ok:false` with `dryRun:false` (any refusal or failure of an apply)

A caller reading this is entitled to believe: **the world is indistinguishable from the world in which the
command was never run.**

1. **I2.a — no entry changed existence.** `E_post` = `E_pre`. Nothing was added and nothing was removed. This
   includes any working file of the tool's own making: a residual working file is a violation of I2, not a
   cosmetic leftover.
2. **I2.b — no bytes changed.** For every name `n` in `E_pre`, `bytes(n)` is identical to its pre-run value.

**I2 is one statement over outcomes and holds regardless of where the failure arose** — an invalid plan, a
precondition, a fault partway through, a verification step that could not run, or a failed restore. It is
deliberately *not* a per-branch promise, because a promise assembled from several branches agreeing with each
other is only as strong as the branch nobody re-read. A failure mode that cannot honour I2 must not report
`ok:false` and stop there; it must report the residual change and name every path that differs.

### I3 — `rolledBack:true` (with `rollbackVerified:true`)

A caller reading this is entitled to believe: **everything I2 promises, and that it was established by looking at
the store afterwards rather than by the restore path reporting its own success.**

1. **I3.a** — I2.a and I2.b both hold.
2. **I3.b — the observation is over the directory.** The claim is grounded in an observation of `E_post` and the
   bytes of every entry in it. It is not grounded in a comparison restricted to entries the run captured
   beforehand, and it is not grounded in the absence of a thrown error during restore.
3. **I3.c — the negative is honest and loud.** When the store is not provably back to its pre-run state, the
   result reports `rolledBack:false`, names every path that differs, and exits non-zero. Silence is not an
   option, and neither is a swallowed error: an error encountered while cleaning up or restoring must be
   reflected in the reported state, never discarded.

---

## 3. The two class boundaries — stated as OUTCOMES

A finding is classified by **what became untrue about the world or the report**, never by which mechanism
produced it. Anyone can classify a finding under these definitions without reading the implementation.

**Class BF — BYTE FIDELITY.** Bytes the caller did not ask to change are different afterwards, **or** bytes the
caller did ask to change are not exactly what was asked for. This class is about the *content of paths*. It is
indifferent to whether the cause was a text round trip, a line-ending rewrite, a partial write, or a write that
landed somewhere unintended.

**Class TH — TRANSACTION HONESTY.** A reported result state does not correspond to the actual state of the
world: a reported failure over a store that changed, a reported clean rollback over a store holding residual
change, a reported success over a store that is not as described, or any error that is discarded such that the
report is made cleaner than the world. This class is about the *correspondence between the report and reality*.

A single defect may belong to both classes. Neither class is a subset of the other: BF can occur with a perfectly
honest report ("I changed these bytes" — and it did, but it also changed others), and TH can occur with no byte
infidelity at all (a residual working file added, no existing bytes touched).

---

## 4. Non-vacuity — each invariant is falsified by a real, currently-open finding

Stated so β can see that no invariant here is trivially true of the code as it stands, and so the verifier has a
known-red baseline to calibrate against. All four findings are open against `8adf768b`.

| Finding | Falsifies | Class | The outcome |
|---|---|---|---|
| **ED-306** | **I1.c** | BF | A successful delete rewrites the line endings of every *retained* line of the index while reporting `ok:true, applied:true`. A CRLF-authored store is silently normalised. |
| **ED-307** | **I2.a / I2.b** | TH (+BF) | A failed apply can leave the store already changed, so `ok:false` does not imply the run never happened. |
| **ED-308** | **I3.b** | TH | The rollback claim is established over captured paths only, so a *new* entry in the store leaves `rolledBack:true, rollbackVerified:true` standing while the directory is demonstrably different. |
| **ED-309** | **I3.c** | TH | A cleanup error is discarded, so a residual working file survives under a clean-rollback report — and then blocks every subsequent run, so the false report also disables the tool. |

ED-308 is the reason §1 insists the scope is the directory rather than the captured set: written the other way,
ED-308 is not a defect but compliance.

---

## 5. How to falsify each invariant by observation

The verifier needs no knowledge of the implementation. For any run:

1. Before the run, record `E_pre` and `bytes(n)` for every `n` in `E_pre`.
2. Run the command. Record the full reported result.
3. After the run, record `E_post` and `bytes(n)` for every `n` in `E_post`.
4. Decide by the reported state:
   - reported `ok:true, applied:true` → assert I1.a–I1.f;
   - reported `ok:false` → assert I2.a–I2.b;
   - reported `rolledBack:true` → assert I3.a–I3.b, and confirm the observation could not have been satisfied by
     a captured-subset comparison (i.e. include a case where a new entry appears outside any plausible captured
     set — that is the discriminating case, and a verifier that omits it cannot distinguish I3.b from its
     violation);
   - reported `rolledBack:false` → assert I3.c: every differing path is named, and the exit status is non-zero.

Two adversarial cases are **required**, not optional, because each is the only case that discriminates its
invariant from a weaker one that the code already satisfies: (a) a store whose index is authored with CRLF and
holds at least one byte sequence that is not valid UTF-8 (discriminates I1.c from "the text is equivalent"); and
(b) a failure induced late enough that content has already been written (discriminates I2 from "we validated the
plan before touching anything").

---

## 6. Scope note the verifier must not misread — the hold

`--apply` is **held fail-closed** in WarpOS 1.2.0 (ED-310): the exported `run()` refuses before any filesystem
work. Two consequences:

1. **The hold does not satisfy any invariant above.** It makes I1 and the apply-path portions of I2 and I3
   *unreachable through the shipped entry point*. Unreachable is not sound. The invariants are statements about
   what the code guarantees when it runs, and the verifier's subject is the code at `8adf768b`, which predates
   the hold.
2. **A verifier must not report the hold as a pass.** If a probe is refused by the hold, the correct outcome is
   `could-not-run` for that probe, never `ok`. A verification pass whose probes were all absorbed by the refusal
   has verified nothing, and must say so.

---

## 7. Deliberate silences

Named so that absence is not read as permission — an unstated case is an open question, not an allowance.

- **Concurrency.** Every invariant is stated for a single run against a store no other writer touches
  concurrently. The multi-writer case is out of scope here and is tracked separately (ED-301's re-entry
  condition). The verifier must not construct a concurrent probe and read its outcome as a violation of I1–I3.
- **Durability.** These are invariants about what is observable after the call returns, not about surviving a
  power loss or an OS crash mid-run.
- **The dry-run path.** `dryRun:true` is outside I1–I3. Its own guarantee is narrower and worth stating: a
  dry-run changes nothing (`E_post` = `E_pre`, all bytes identical) and refuses every plan an apply would refuse,
  so it can never promise an operation the apply path would reject.
- **Permissions and ownership.** The invariants speak to entry names and bytes. Mode, ownership and timestamps
  are not claimed either way.
