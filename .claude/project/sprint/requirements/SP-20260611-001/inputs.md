<!-- requirement-format-legacy -->
# INPUT Requirements — Cross-family findings fix sprint — 6 gemini re-review findings (epsilon-runtime spawn race, fallback ENFORCE brick, hardcoded BUILD_CHAIN_ROLES, spoofed-ts window, sprint_id correlation, verifyGauntlet parse refusal)

**Sprint:** `SP-20260611-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\prd.md`

> INPUTS for an engine sprint = the untrusted/semi-trusted data each fix consumes.
> Each entry pins the validation + failure mode the fix must implement.

## IN-1 — opts.timeoutMs / WRAPPER_DEFAULTS (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `opts.timeoutMs`, `WRAPPER_DEFAULTS["epsilon-agent"/"epsilon-claude"]` |
| Type | integer ms |
| Required | defaulted |
| Source | system (timeout-policy.js) |
| Validation | parent bound = child bound + 30–60s grace; grace constant named, not magic |
| Failure mode | missing/NaN → fall back to WRAPPER_DEFAULTS + grace; never parent ≤ child |

**Notes:** Both spawn sites must read the SAME grace constant.

## IN-2 — role + --review-fallback flag (linked story `S-2`)

| Property | Value |
|---|---|
| Field | `role` argv + `--review-fallback` flag |
| Type | string / boolean |
| Required | role required |
| Source | system (wrapper argv) |
| Validation | sanctioned-lane registration consulted at shape evaluation; blocking mode honored |
| Failure mode | non-sanctioned mismatch under blocking → refuse (exit 1/2, named reason); sanctioned lane → allow + record |

**Notes:** Registration lives in the dispatch-shape/dispatch-contract layer, not a wrapper-local conditional.

## IN-3 — role-registry / dispatch-contract class (linked story `S-3`)

| Property | Value |
|---|---|
| Field | registry class lookup (validateDispatchForClass / build_chain_worker) |
| Type | registry JSON |
| Required | yes |
| Source | system (.claude/agents/_org/) |
| Validation | registry readable + class resolvable; literal Set kept as fallback |
| Failure mode | registry unreadable → fall back to literal Set (fail-closed for known roles), surface a warning |

**Notes:** Membership parity for existing roles is AC-3.2.

## IN-4 — events.jsonl timestamps (linked story `S-4`)

| Property | Value |
|---|---|
| Field | `f.ts` per sprint event |
| Type | ISO string / epoch (UNTRUSTED) |
| Required | per-event |
| Source | integration (events.jsonl — spoofable) |
| Validation | clamp window bounds to sprint created_at ± hard cap; discard outlier ts (e.g. 1970/2099) |
| Failure mode | all ts outliers → no parseable window → fail closed (existing behavior preserved) |

**Notes:** TWO-SITE: identical validation in sprint-hook-coverage.js AND sprint-manager-consult.js (β directive).

## IN-5 — dispatch completion records (linked story `S-5`)

| Property | Value |
|---|---|
| Field | `rec.sprint_id`, `rec.completed_at/started_at`, `rec.ok`, `rec.role` |
| Type | JSONL records (semi-trusted) |
| Required | per-record |
| Source | integration (dispatch-completions.jsonl) |
| Validation | prefer sprint_id equality when present; legacy fallback = clamped time window |
| Failure mode | wrong-sprint record → never correlates; recordless → finding (fail closed) |

**Notes:** Post-W0 records carry sprint_id when WARPOS_SPRINT_ID exported — the sprint's own gauntlet must export it (β design risk #2).

## IN-6 — verifyGauntlet since/until params (linked story `S-6`)

| Property | Value |
|---|---|
| Field | `since`, `until` |
| Type | ISO string or epoch ms |
| Required | optional but validated when present |
| Source | system callers + CLI |
| Validation | parse-validity check INSIDE verifyGauntlet; unparseable → throw/refuse |
| Failure mode | garbage input → refusal (named reason), NEVER silent null → whole-ledger scan |

**Notes:** CLI keeps its existing message; the library is the enforcement point.
