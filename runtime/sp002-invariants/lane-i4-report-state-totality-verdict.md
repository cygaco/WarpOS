# Invariants pass — LANE I4 (report-state totality) — verifier verdict

- **Lane:** I4 TOTALITY only. This is ONE of three planned lanes; the I1 success-path and the I2/I3
  failure/rollback execution lanes have **NOT run**. **This is not the verdict of the invariants pass.**
- **Subject:** `scripts/checks/memory-apply.js` @ `8adf768b` (read at `.worktrees/sp002-r14/`).
- **Route:** `scripts/dispatch-agent.js qa-reviewer` → openai `gpt-5.6-terra` (xhigh), dispatched from the
  `sp002-r14` worktree cwd. `ok:true`, exit 0, 6012 output bytes, elapsed ~3m37s (15:40:29 → 15:44:06 local).
- **Prompt design (deliberate):** the lane was **NOT** told which combinations were suspected. β had named two
  uncovered pairs in invariants-v2 §I4; naming them to the lane would have primed it to confirm and stop. Its
  enumeration is therefore an independent check rather than an agreement.
- **Tree limitation (invariants-v2 §8):** this says **NOTHING** about the shipped WarpOS 1.2.0 tree, which ships
  r13, is strictly worse, and whose executor is HELD.
- **§6 probe counts:** apply-probes **EXECUTED 0 / REFUSED 0** — this lane is code-reading by design and ran no
  probes. Per §6, a lane with zero executed apply-probes cannot assert an I1 result; it asserts **I4 only**.
- **Prior dispatch:** a single broad verifier covering all lanes died on the 540s clamp with zero output and no
  completion record (provider condition, no verdict). Narrowing per doctrine produced this result in 3m37s.

---

## Verbatim verifier output

I found 7 distinct status-field configurations from `run()`. `—` means the property is omitted, not `false`.

The complete return-field union is: `ok`, `fatal`, `dryRun`, `applied`, `violations`, `planned`, `notes`, and conditionally `problems`, `prospectiveFindings`, `postFindings`, `rolledBack`, `rollbackVerified`, and `changedFilesAfterRollback`. (`error` is only produced by `main()`'s catch, outside `run()`.)

| # | Status fields emitted | Return site(s) and reachability | What a caller would infer / actual store state |
|---|---|---|---|
| 1 | `ok=false, fatal=true, dryRun=false, applied=false, rolledBack=—, rollbackVerified=—` | Helper return at `memory-apply.js:775`, reached through `run()` exits `:788, :794, :800, :803, :808, :813, :818`; also direct pre-mutation rejections at `:824, :851, :881, :961, :986` (called from `:1000/:1003/:1008`), `:1022, :1054, :1083` when `opts.apply` is truthy; and backup-capture failure at `:1155`. | Caller sees fatal/no application. The code has not entered the mutation loop (`:1167`), so this run has made no planned store-content change. That account is true. |
| 2 | `ok=false, fatal=true, dryRun=true, applied=false, rolledBack=—, rollbackVerified=—` | The same direct pre-mutation rejection objects at `:824, :851, :881, :961, :986, :1022, :1054, :1083`, when `!opts.apply` is true. | Caller sees a rejected dry-run with no application. No mutation was attempted; true. |
| 3 | `ok=true, fatal=false, dryRun=true, applied=false, rolledBack=—, rollbackVerified=—` | `:1103`; every gate passed and `!opts.apply` is true. | Caller sees a clean dry-run and no change. The mutation loop is below this return; true. |
| 4 | `ok=true, fatal=false, dryRun=false, applied=true, rolledBack=—, rollbackVerified=—` | `:1229`; apply mode passed preflight, backup, mutation, and a clean post-check. | Caller sees a successful apply. If `mutations.length > 0`, changes remain and the report is accurate. But the same state is emitted for zero mutations, discussed below. |
| 5 | `ok=false, fatal=true, dryRun=false, applied=false, rolledBack=true, rollbackVerified=true` | Inner `undo()` return at `:1316`, reached from apply fault `:1191`, post-check exception `:1205`, fatal post-check `:1208`, or post-check findings `:1223`, when `rollbackErrors.length === 0 && changed.length === 0` (`:1291`). | Caller sees an attempted apply that was fully rolled back. Every *captured path* reread equal to its backup, but this does not prove the whole store is unchanged; a residual temp can exist. |
| 6 | `ok=false, fatal=true, dryRun=false, applied=true, rolledBack=false, rollbackVerified=true` | `:1316` via the same four `undo()` callers, when `rollbackErrors.length > 0` but `changed.length === 0` (`:1291`, `:1300`). | Caller sees "application remains" and "rollback verified" simultaneously. The captured files presently match their backups, but a restore step reported an error; this is internally contradictory at the report level. |
| 7 | `ok=false, fatal=true, dryRun=false, applied=true, rolledBack=false, rollbackVerified=false` | `:1316` via the same four `undo()` callers, when `changed.length > 0`, with or without rollback errors (`:1272–:1285`, `:1291`, `:1300`). | Caller sees incomplete rollback and residual change. At least one captured path was unreadable or byte-mismatched at verification, so that account is true for captured paths. It does not establish that the intended plan result, rather than another residual state, is what remains. |

Flagged combinations / paths:

1. Row 1 misreports dry-run mode for several early failures.

   `fatal()` hardcodes `dryRun: false` at `:775`. Consequently, a default call such as `run({ apply: false })` that lacks a plan or has an unreadable/invalid plan returns `dryRun:false` through `:788–:818`. Later preflight failures correctly derive the field from `!opts.apply` at `:827`, `:854`, `:884`, and similar sites. A caller using `dryRun` as the requested mode will be misled, even though `applied:false` correctly says no store change occurred.

2. Row 4 can say `applied:true` when the store did not change.

   `action:"none"` is valid and adds a non-mutating planned entry (`:590–:592`); `mutations` filters all such entries out (`:835`). In apply mode, an empty/all-`none` plan reaches the success return with `applied:true` (`:1229–:1233`) while the loop performs no write (`:1169–:1186`). The note exposes the count (`:1237`), but the structured status field alone cannot mean "the store changed."

3. Row 5 can report a verified complete rollback while leaving a residual store file.

   Forward atomic writes create an in-store temp (`:312–:316`), but several failure cleanups swallow an unsuccessful `unlinkSync` (`:350–:354`, `:368–:372`, `:400–:404`, `:413–:417`). `undo()` backs up and verifies only the mutation targets plus `MEMORY.md` (`:1125–:1153`, `:1248–:1256`, `:1272–:1286`), not temp names. Thus a forward write can fail, leave `.memory-apply.*.tmp`, then have all captured paths restore and emit `rolledBack:true, rollbackVerified:true` at `:1291–:1316`. The store is not byte-identical as a directory state despite the report's "nothing changed" wording at `:1304–:1306`.

4. Row 6 is the direct independently-derived contradiction.

   `rolledBack` requires both no restore errors and no observed byte changes (`:1291`), while `rollbackVerified` ignores restore errors and tests only `changed.length === 0` (`:1300`). Therefore a restore can report an error after the original bytes have landed—for example, `atomicWriteInStore()` can rename successfully and then throw solely because its immediate read-back fails (`:410–:451`), while the later verification read succeeds (`:1273–:1285`). The result is `rolledBack:false`, `rollbackVerified:true`, and additionally `applied:true` because `applied` is defined as `!rolledBack` (`:1295`). A caller reasonably reads that as mutually inconsistent: rollback verification succeeded, yet rollback failed and the application remains.

---

## ε assessment — for β's ruling, NOT a severity decision by ε

β holds the hard terminal and the severity call is hers. Recorded here so she has the mapping, not to pre-empt it.

**Against invariants-v2 §I4:** the lane enumerated **7** emittable configurations with file:line and reachability
for each. β's two named-uncovered pairs were both **independently rediscovered** — row 6 is her
(`rolledBack:false`, `rollbackVerified:true`) pair, and row 4 is the no-op-plan case, though the lane found the
sharper form: `applied:**true**` on an all-`none` plan, not `applied:false`. Because the lane was unprimed, these
are genuine confirmations rather than agreement, and it supplied the **mechanisms** neither of us had: row 6 is
reachable because `atomicWriteInStore` can rename successfully and *then* throw on its own read-back, so the bytes
are restored while an error is still recorded.

**Apparently NEW (not among ED-306…309), needing β's severity call:**
- **Flag 1 — `fatal()` hardcodes `dryRun:false` at `:775`.** A dry-run that fails early reports `dryRun:false`,
  so the mode field lies about the requested mode. TH by §3 (the report does not correspond to the world).
  ε's read: real, but low-to-medium — `applied:false` remains accurate, so no caller is misled about store state.
- **Flag 2 — `applied:true` with zero mutations.** TH. ε's read: low-to-medium; misleading status field, no store
  change. Note this is the inverse of what §I4 recorded, so §I4's own text needs correcting either way.

**Widening of already-open findings (ED-308 / ED-309), not new:**
- **Flag 3** is ED-308+ED-309 territory, but the lane found **four** swallowed-`unlinkSync` cleanup sites
  (`:350`, `:368`, `:400`, `:413`) where ED-309 records one (`:370`). If that holds, ED-309's source field
  understates the surface by three sites and should be amended.

**What this lane does NOT establish:** it ran **zero** apply-probes, so under §6 it cannot assert any I1 result,
and it is not evidence about I1.a–I1.f, I2 or I3. Two of three lanes remain un-run. **The invariants pass is
INCOMPLETE and the hard terminal has neither fired nor been cleared.**

**Ordering note (β's binding rule):** if any of the above is ruled a terminal-firing HIGH, no terminal-firing
record may be **committed** before ADR-0040 is committed. This artifact lives under `runtime/` and is therefore
fine at any time; only a committed record is sequenced.
