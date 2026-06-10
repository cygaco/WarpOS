<!-- requirement-format-legacy -->
# INPUT Requirements — E-DISPATCH-INTEGRITY-001 F-1+F-3 — coverage-honesty (kill telemetry-only false-greens)

**Sprint:** `SP-20260610-005`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\prd.md`

> INPUTS captures fields, forms, data entry, validation, and user/system
> inputs. Each entry should be testable. Engine sprint — there are no
> user-entered form inputs; all inputs below are system inputs consumed
> by the coverage scans and gauntlet-verify.

## IN-1 — completion-record ledger + legacy cutoff (linked story `S-1`)

| Property | Value |
|---|---|
| Field | dispatch completion records (`ok` flag, sprint/phase correlation fields) + `manager_consult` telemetry records read by `sprint-manager-consult.js` / `sprint-hook-coverage.js`, plus the legacy cutoff date constant (2026-06-10) |
| Type | JSONL ledger records (system-emitted) + dated constant in the checks |
| Required | yes — a phase counts as covered ONLY with a correlated `ok:true` completion record; telemetry alone is insufficient post-cutoff |
| Source | system (dispatch completion ledger + scan telemetry; cutoff follows the existing dated-constant idiom in the checks if one exists — open question resolved at build) |
| Validation | planted fixtures three ways: telemetry-only post-cutoff → RED; record-backed post-cutoff → GREEN; telemetry-only pre-cutoff → GREEN via NAMED legacy exemption (AC-1.1/1.2/1.3) |
| Failure mode | missing/unreadable ledger or malformed record → NOT covered (fail-closed, never green on unverifiable input); legacy exemption applies only on a sprint date strictly before the cutoff and is always named in output |

**Notes:** The predicate is the gauntlet-verify "record-or-it-didn't-happen" predicate applied to coverage scans (F-1). Beware the worktree-cwd record-path bug class (ED-016): correlation must read the canonical ledger the scans already use, not assume cwd.

## IN-2 — gauntlet-verify correlation arguments (linked story `S-2`)

| Property | Value |
|---|---|
| Field | `sprint_id` + bounded window (since/until or equivalent runId/--since) arguments to `scripts/dispatch/gauntlet-verify.js` |
| Type | CLI arguments (sprint id string + timestamp/run bounds) |
| Required | yes — MANDATORY; absence of both correlation inputs = whole-ledger verify, which is REFUSED |
| Source | system (callers: epsilon-runtime gauntlet phase, sprint-close paths — audited and updated in the same commit, T-301) |
| Validation | unbounded invocation → exit non-zero + usage guidance (AC-2.1); historic-green fixture (ok:true from another sprint/outside window) → FAIL (AC-2.2); matching sprint_id inside window → pass (AC-2.3) |
| Failure mode | missing correlation args → refusal (never a silent full-ledger scan); no correlated record found → verify FAILS with a no-matching-record diagnostic — a historic `ok:true` can never green a never-ran lane |

**Notes:** The CLI contract change needs the caller audit (grep call sites; keep compat or update in-commit — payload complexity driver #2); `gauntlet-verify.test.js` plus the planted T3 historic-green regression fixture prove both refusal and correlation bite.
