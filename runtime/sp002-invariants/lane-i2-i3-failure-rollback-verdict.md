# Invariants pass — LANE 2 (I2 / I3 failure + rollback) — verifier verdict

- **Lane:** I2 and I3 only. With lane I4 (report-state totality) and lane 1 (I1 success-path), **all three
  lanes now have real verdicts — the pass is COMPLETE.**
- **Subject:** `scripts/checks/memory-apply.js` @ `8adf768b` (`.worktrees/sp002-r14`); worktree verified clean
  before and after, HEAD unchanged.
- **Route:** β's defined fallback (`8a3d5f26`) — in-process Claude, `qa-reviewer`, synchronous, after death #2
  on the cross-provider route. Elapsed 1089s, 22 tool uses.
- **Probe scripts, re-runnable:** `…/scratchpad/lane2/` (`lib.js`, `p0_p1.js`, `p2.js`, `p3.js`, `p4.js`).
- **§8 TREE LIMITATION, in the lane's own words:** a PASS here says **nothing** about shipped 1.2.0, which
  ships **r13 — strictly worse**. The lane verified the divergence directly rather than repeating it: canonical
  `memory-apply.js:231` still carries the pre-B-1 lexical confinement wording *"which is not a direct child of
  the store"* where `8adf768b` uses the realpath comparison. Shipped `--apply` is HELD (refusal at canonical
  :104). **Unreachable is not sound** — the hold satisfies no invariant.

## §6 executed-vs-refused

**10 apply-probes dispatched, 10 EXECUTED, 0 refused by the governance hold.** Four of the ten were refused by
*ordinary gates* before any write — those refusals **are** the assertion, not an absorption.

**Positive proof the executor ran** (not tell-absence): P0 observed `alpha.md` **101 → 114 bytes**,
`99c6deff401e6399` → `177dc634aa270fa4`, persisted on disk. Corroborated by P2b (`bravo.md` removed,
`MEMORY.md` 144 → 99) and P3 (three new entries appeared).

## Per-invariant

| Invariant | Verdict | Deciding observation |
|---|---|---|
| **I2.a** no entry changed existence | **FAIL** | P3: `E_post` gained **3** `.memory-apply.*.tmp`, residue unreported |
| **I2.b** no bytes changed | **PASS** | every surviving `E_pre` name kept exact bytes, incl. the CRLF+`0xFF` index and CRLF+`0xFE` bystander |
| **I2.c** honest-residual branch | **FAIL** | P3: residual change reported, yet `changedFilesAfterRollback:[]` names none of the 3 differing paths |
| **I3.a** I2 holds under `rolledBack:true` | **PASS** | P4b, the only reachable positive: byte-exact restore after two writes provably landed |
| **I3.b** observation over the DIRECTORY | **FAIL** | P3: `rollbackVerified:true` over a directory that gained 3 entries |
| **I3.c** the negative is honest and loud | **FAIL** | P3: correct `rolledBack:false` + exit 2, but does **not** name every differing path |

## F1 — the finding. Class **BF and TH**. Severity **HIGH**.

Residual working files left behind, **denied by the structured report**, and the store is then unusable.
Falsifies **I2.a, I2.c, I3.b, I3.c** (probe P3; consequence P3b).

**Mechanism, verified not assumed:** `atomicWriteInStore`'s failure-path cleanups call `fs.unlinkSync(tmpAbs)`
inside a bare `catch {}` (subject :351, :370, :401, :415). When that unlink fails the temp survives, the error
is discarded, and `undo`'s verification loop — which iterates the **captured** `backup` set only — cannot see
it, so `rollbackVerified` stays `true` and `changedFilesAfterRollback` stays `[]`.

**Observed:** 3 gained entries; `rollbackVerified:true`; `changedFilesAfterRollback:[]`. **P3b consequence:**
every later run against that store refuses with *"stray apply temp file in the store"* — so the
under-reported residue **bricks the tool**, confirming ED-309's second half by observation.

HIGH per β's discriminator: **the store is in a state the report denies**, and per §1 an existence change is a
byte difference.

**Precision the lane insisted on:** the report does **not** claim `rolledBack:true` (it is `false`), so the
narrow reading "must not claim a *clean* rollback" is satisfied. What fails is `rollbackVerified:true` — the
field the code's own comment designates as *the observation* — and I3.c's "names every differing path", whose
structured enumeration is empty. The three temp basenames do appear incidentally inside the free-text
`problems` strings as the *source* operands of failed renames, never as "left behind". A machine caller
reading `changedFilesAfterRollback` / `rollbackVerified` is told nothing residual exists.

### CORRECTION OWED TO ED-309's WORDING (and to ε's own amendment)

ED-309 says the residual survives *"under a clean-rollback report."* On `8adf768b` **that overclaims** — the
surrounding report is `rolledBack:false` + `"ROLLBACK INCOMPLETE"` + exit 2. The defect is real but narrower:
the residue is denied by `rollbackVerified` and `changedFilesAfterRollback`, **not** by `rolledBack`. ε's
amendment filed earlier today inherited the same overclaim and needs the same correction — filing it unamended
would have re-inherited it.

## F2 — `applied:true` over a store nothing was applied to. Class TH. Severity **MEDIUM**.

`applied` is derived as `!rolledBack` (:1295), and `rolledBack` additionally requires no restore error. P2c:
the store is **byte-identical to `E_pre`** while the report says `applied:true`, `"ROLLBACK INCOMPLETE"`,
*"inspect the store manually"*. This is the `(rolledBack:false, rollbackVerified:true)` pair §I4 already records
as emittable — reached here by a **second, distinct mechanism**: not "rename succeeds then read-back throws",
but a restore whose rename fails outright while the target's bytes were never modified. MEDIUM: fields
disagree with each other and with the world, but the store is honest and the error direction is conservative.

## F3 — `undo` rewrites captured paths the forward loop never mutated. Class TH. Severity **MEDIUM**.

`undo` calls `atomicWriteInStore` for **every** backup entry unconditionally — including targets the mutation
loop never reached, and `MEMORY.md` on a `correct`-only plan (captured unconditionally since r14). One
unwritable bystander therefore converts a *fully successful* rollback into `"ROLLBACK INCOMPLETE"` (P2c, P3).
Separately fixable, and the fix also removes F2's trigger: skip the restore for any captured path whose
on-disk bytes already equal the captured bytes.

## F4 — the "pre-check and post-check cannot disagree BY CONSTRUCTION" claim is FALSE. Severity **LOW**.

**Neither BF nor TH** — the outcome was honest and fail-closed — so per §7 it is reported and dispositioned
normally and **does NOT trip the terminal.** `projectStoreState`/`validateNewBody` compare `newBody` as **JS
strings**; the post-check compares what UTF-8 encoding actually produced. Two slugs differing only by an
unpaired surrogate (`dupe-x\uD800` / `dupe-x\uDC00`) pass the projection and collide on disk as
`dupe-x�`. Reported because r12's fix was *justified* by that claim — and because this was the **only
lever that made a `rolledBack:true` outcome reachable at all**, without which I3.a could not have been
asserted positively.

## F5 — out-of-lane corroboration, no severity claimed.

P2b: a *successful* delete rewrote the retained index lines CRLF→LF — arithmetic-exact, 144 − 41 removed-line
bytes − 4 stripped `\r` = 99. That is **I1.c / ED-306**, lane 1's invariant. Corroboration only; the lane
makes no I1 verdict.

## Ceiling

1. **ED-308's literal form (`rolledBack:true` *with* a gained entry) was not produced, and the lane argues it
   is UNREACHABLE by single-writer fault injection — a structural symmetry, not a platform accident.** A temp
   survives only if deleting it is denied; `rename(tmp → target)` also requires DELETE on the source temp, so
   *every* restore in that store fails in the same run ⇒ `rollbackErrors` non-empty ⇒ `rolledBack` can never
   be `true` there. Same symmetry on POSIX. What **was** falsified is the grounding itself, on the field the
   code designates as the observation (`rollbackVerified`). **Treat ED-308 as grounding-confirmed,
   outcome-form unreached.**
2. **Concurrency out of scope (§7)** — so the `EVERIFYMISMATCH`/`ESWAPDETECTED`/`EVERIFYFAILED` paths,
   including the exact mechanism §I4 attributes to the uncovered pair, are unprobed. Deliberately no
   concurrent probe.
3. **Durability / fsync unprobed (§7).**
4. **Mode and ownership unmeasured — a concrete exposure flagged under §7's "unclaimed is NOT licensed".**
   Every write is `openSync(tmp,"wx",0o600)` then rename-over, so on POSIX a successful `correct` would
   replace a retained entry's mode (and possibly group) with `0600`. §7 says such an alteration **is a finding
   to report**. Untestable here: Windows exposes only the read-only attribute, and a read-only target can
   never be corrected at all. **Owed: a POSIX mode/ownership probe on the success path.**
5. **The two most serious probes used ACL fault injection** (`icacls /deny (DC,DE)` for P3, `/deny (WD)` for
   P4), each pre-characterised against a throwaway directory before being trusted, both producing ordinary
   `EPERM` from ordinary calls — in scope, since I2 holds "regardless of where the failure arose". Real-world
   analogues (locked-down or synced stores, EDR handles, read-only shares) are plausible but undemonstrated;
   a reviewer wanting a non-ACL repro of F1 has none from this lane.
6. **I4 totality, the all-`none` plan and the dry-run guarantee were not this lane** — nothing asserted.

**No repository file created, modified or deleted.** All mutation confined to throwaway fixture stores since
removed, ACLs reset; subject worktree verified clean at `8adf768b`.

---

## Composition status — for β, not decided by ε

Under **R2** (`8a3d5f26`), the pass fails and the terminal fires if **any** lane reports a HIGH in BF or TH.
**Lane 1 reported a HIGH (I1.c, BF). Lane 2 reports a HIGH (F1, BF+TH).** Under **R3**, on the Claude fallback
route a **FAIL fires the terminal normally, full stop** — the provisional-PASS caveat and its cross-provider
confirmation attach only to a PASS, so neither FAIL waits on a confirmation lane.

All three lanes produced real verdicts, so **the pass is COMPLETE** and R2's composition is evaluable. The
question ε has put to β and will not answer: both HIGHs are grounded in **already-open** findings (ED-306 for
lane 1; ED-308/ED-309 for lane 2), now confirmed by observation rather than code-reading and in ED-309's case
**corrected**. Whether an observationally-confirmed already-open HIGH is "**another** HIGH" for terminal
purposes is β's ruling. β's ordering constraint is satisfied: ADR-0040 is committed, shipped in 1.2.0 at
`4af0ef59`.
