# SP-20260725-002 — r14 UNIFIED FIX BRIEF (the LAST authorized round for this class)

**Authorization:** β DECIDE B/0.90, msg_id `b7e4c1a9-3f28-4d56-8e01-9a2f7c34b0d5` (betaEvents line 270), ED-287, OPEN_ADR true.
**Base commit:** `92b9d19e` on `session/2026-07-25`. **File:** `scripts/checks/memory-apply.js` + its suite.
**Round cap:** r14 is the LAST authorized round for this class. After it, a clean gauntlet LANDS — new MEDIUMs file as debt, they do not buy another round.

## Scope — four items, and nothing else

Fix S-1, B-1, B-2, B-3. Do not refactor beyond them. Two things are explicitly OUT of scope and touching them is a defect in this round: **do not redesign the write primitive**, and **do not touch `:651`** (see B-1 for why it is provably safe).

---

## S-1 (HIGH, security lane, binding) — TOCTOU source-swap at the rename

**Where:** `atomicWriteInStore`, the `fs.renameSync(tmpAbs, targetAbs)` at `:276`.

**Mechanism.** The whole write chain is bound to the DESCRIPTOR — `:214` `openSync(tmpAbs,"wx")` is the O_EXCL control, `:228` `fstatSync(fd)` does the nlink check, `:235` `writeFileSync(fd, data)` writes through the fd, `:258` `closeSync(fd)` is fatal on failure. Then `:276` renames **by path**, re-resolving `tmpAbs` without confirming it is still the inode that was exclusively created and written. Anything that can write into the store can unlink the temp between close and rename, drop its own file at that name, and have it promoted over the target.

**This reaches all three call sites**, not just apply: `:900` (apply), `:906` (index rewrite), and **`:974` (undo/rollback)**. The rollback path is not exempt.

**What this actually is — read this before writing code.** The attacker gains **no write capability**; they must already own the store to mount it. What they gain is a **FALSE SUCCESS REPORT**: apply returns `applied:true` over content it did not write. That is this module's own thesis. `undo()` already got this right one round ago (`:980`, "VERIFY BY OBSERVATION … `rolledBack` must be computed by LOOKING at the store … this is the LAYER, not the instance"). The forward path does not verify the bytes it wrote at all. That asymmetry is the defect.

### Fix — TWO halves. Label each in the code. Do not ship only the second.

**(1) CONTROL — the load-bearing half.** After the rename, re-read the target and compare against the bytes just written. On mismatch: `applied:false`, fail loudly, and route through the existing rollback path. This closes the lying half **by construction, independent of the race**, and it is robust to whatever breaks the write path next. It is the same form already ratified for rollback, applied to apply.

**(2) WINDOW NARROWING — defense in depth, EXPLICITLY NOT A CONTROL.** Capture `{dev, ino}` from `fstatSync(fd)` **before** the close; after the close, `lstat` the temp path and refuse fail-closed if dev/ino do not match. This shrinks the window from close→rename to lstat→rename. **Say exactly that in the comment.** β: "if it gets described as a control we have rebuilt the exact defect this sprint keeps producing."

**(3) AMEND THE COMMENTS IN THE SAME COMMIT.** `:165-171` asserts "the FD is what makes the guarantee hold across that gap" and `:234` says "THE DESCRIPTOR, not the path." The rename is by path, so these currently overclaim that the descriptor binding covers the whole operation. Correct them to state where the descriptor binding ends and what the read-back control covers instead. A false comment is part of the defect — same ruling as Sprint A `:473-474`.

### The residual — state it in its STRONG form

Do **not** write "Node has no rename-by-descriptor." That is true but weak, and a future reader will conclude a Node upgrade fixes it. **Checked on node v24.16.0:** the only rename/link APIs are path-based (`link`, `linkSync`, `rename`, `renameSync`, `symlink`, `unlink`); the fd-based surface is limited to `fchmod`, `fchown`, `fdatasync`, `ftruncate`, `futimes`; `renameat`, `renameat2`, `linkat` are all `undefined`. State it as a checked claim.

The real ceiling: **the threat model is a SAME-USER actor with write access to the store, so the control and the attacker hold identical privileges and no filesystem-level mechanism separates them.** Given rename-by-descriptor you would close this instance and the actor would simply modify the file after apply returns — a capability they always had. With the read-back control the honest claim becomes *"at the moment I checked, the intended bytes were on disk"* — an observation with a stated instant. Write that.

**File this residual as its own ED** with the five-condition rule and a named falsifiable re-entry: **the store becoming multi-writer or shared across trust boundaries re-opens it.**

---

### β's FIVE CONDITIONS — reproduced verbatim here for durability

β ruled that "narrowed + named residual" is an acceptable close for a binding-lane HIGH **only** when all five hold. They are reproduced here because `betaEvents` is **not tracked by git at all** (`.gitignore:40` = `.claude/agents/**/events.jsonl`; `git ls-files --error-unmatch` reports the path unknown to git), so rows 270-271 do not survive a fresh clone. This file does. The authoritative home is the pending ADR-0039 amendment, which **must land before any release record cites the five-condition close** — otherwise the release cites a reference that resolves on one machine and nowhere else (the cited-ref-must-resolve-from-the-committed-tree finding, SP-20260718-001).

1. The residual is unreachable by any mechanism available in **this runtime AND threat model** — impossible, not merely expensive. Name the specific absence.
2. The narrowing removes the **SILENT** outcome. After the fix the bad case is prevented or loud; it is never quiet success.
3. The residual grants **no capability the actor lacks** (the capability discriminator).
4. It is **disclosed where a future reader hits it**: its own ED, plus correction of any comment that currently overclaims.
5. A **named falsifiable re-entry condition**. Here: the store becoming multi-writer or shared across trust boundaries re-opens it, because condition 1's premise dies at that moment.

Plus the layer-naming requirement: **control vs window-narrowing vs hygiene must be stated in the code comment, not only in the review artifact.**

---

## B-1 (MEDIUM) — the confinement check rejects legitimate case-variant spellings

**Where:** `:202`, `if (path.dirname(resolvedTarget) !== resolvedStore)`.

**Reproduced** through `__testonly__.atomicWriteInStore`: same-casing control writes; target-dir upper-cased, store-arg upper-cased, and store-arg lower-cased all throw `EOUTOFSTORE`; `fs.existsSync` on the variant returns true, proving it is the same directory. `path.resolve` does not case-normalize, and the two sides here have **independent provenance** (the caller supplies `storeAbs` and `targetAbs` separately).

**Fix.** Compare `fs.realpathSync` of the target's **PARENT** against `fs.realpathSync` of the store. The parent exists even when the target does not, and realpath gives OS canonicalization that is correct on both case-insensitive and case-sensitive filesystems. `ENOENT` on the parent is **fail-closed**.

**Do NOT lowercase both sides.** That is correct on NTFS and **wrong** on a case-sensitive filesystem, where it would accept a genuinely different directory.

**Do NOT smuggle in a prefix test.** The strict direct-child rule at `:189-191` stands — a prefix test both admits subdirectories and reintroduces the sibling-prefix bug.

**NEGATIVE FIXTURES ARE NON-NEGOTIABLE** — `:202` is the r13 control, so widening it without teeth is how a control becomes a hole:
- the sibling-prefix case (`store-evil` vs `store`) must still be **REFUSED**
- a `..` traversal target must still be **REFUSED**
- the legitimate case-variant must now be **ACCEPTED**

**Do NOT touch `:651`.** It was enumerated and is structurally safe: `fileAbs = path.resolve(storeAbs, canonical)` where `canonical` is a readdir entry **of** `storeAbs`, so both sides derive from the same root and it cannot false-positive. Independently confirmed by β. `:202` is the only independently-sourced comparison in the module.

---

## B-2 + B-3 (MEDIUM) — close the CLASS, not the two catch blocks

**Where:** `:139` `strayTempNames` (`catch { return [] }`) and `:337` `canonicalStoreName` (`catch { return null }`).

**One defect, not two.** Each helper meets an unreadable store and **invents a default**, and each default reads downstream as a **positive fact**: `[]` becomes "no strays" (fails OPEN — the hygiene refusal at `:745` is skipped, apply proceeds and reports clean) and `null` becomes "no such file" (fails CLOSED at `:646`, but with a reason that is a lie about what happened). They fail in **opposite directions**, which is why "make it fatal" is the wrong instruction for either.

**Fix.** Detect store readability **ONCE**, early in `run()`, as a precondition with its own error code. The helpers then either consume the entries already read, or propagate the error. The distinction to preserve throughout is **"the scan could not run"** versus **"the scan found nothing"** — these must be separately representable and separately reported.

**Do NOT promote `strayTempNames` to a control.** `:131-133` correctly labels it hygiene and states that nothing is built on its having run. That labelling is right and must survive this fix.

---

## B-4 — no action

r13's un-export is sound. `atomicWriteInStore` appears only under `__testonly__` at `:1144-1145`, nowhere in the public surface at `:1116`, and the suite already asserts the surface shape. Confirmed independently by ε and β. Leave it alone.

---

## Definition of done for r14

1. All four items fixed as specified above, in `scripts/checks/memory-apply.js`.
2. Every new layer **labelled in the code comment** as control / window-narrowing / hygiene. This is a β requirement, not a style preference.
3. `:165-171` and `:234` comments amended in the SAME commit.
4. New tests for each item, including B-1's negative fixtures (sibling-prefix and `..` still refused) and an S-1 test that the read-back control fires when the target's bytes do not match what was written.
5. Both suites green and grown: `memory-apply` from 64, `memory-integrity` from 59. Run them and paste real counts — do not assert.
6. The S-1 residual filed as its own ED in `paths.enforcementDebt`, in the strong form, with the multi-writer re-entry condition named.
7. No change to `:651`. No redesign of the write primitive.
