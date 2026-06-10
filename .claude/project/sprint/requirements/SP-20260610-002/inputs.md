<!-- requirement-format-legacy -->
# INPUT Requirements — Lane B — dispatch/registry coherence (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\prd.md`

> INPUTS captures fields, forms, data entry, validation, and user/system
> inputs. Each entry should be testable. Engine sprint — there are no
> user-entered form inputs; all inputs below are system inputs consumed
> by the enforcers and derivation logic this sprint ships.

## IN-1 — registry-model-field (linked story `S-1`, `S-2`)

| Property | Value |
|---|---|
| Field | `model` (+ provider/route) per role in `.claude/agents/_org/role-registry.json` |
| Type | string (model id) |
| Required | yes — for every registry-routed role |
| Source | system (role-registry.json, the declared routing SoT per ADR-0008) |
| Validation | role-parity-scan compares each registry-routed spec's frontmatter `model` against this field; `inherit` and any mismatch = FAIL |
| Failure mode | missing/malformed registry entry → scan fails closed (non-zero), never skips the role silently |

**Notes:** Parity failures resolve TOWARD the registry (payload assumption #1). The openai-routed roles' frontmatter pin form (registry model vs claude fallback + comment) is resolved at design; the enforcer rule follows that decision.

## IN-2 — class-derivation-rule-order (linked story `S-3`)

| Property | Value |
|---|---|
| Field | `class_derivation.rules[]` in `.claude/agents/_org/dispatch-contract.json` (ordered, first-match) |
| Type | ordered JSON array of match→class rules |
| Required | yes — the new cross-provider-lead rule MUST precede the generic `{tier:lead}→manager` rule |
| Source | system (dispatch-contract.json) |
| Validation | planted fixtures both ways: design-lead (provider openai, tier lead) derives subprocess; claude leads still derive manager; shape-vs-route contradiction = parity FAIL |
| Failure mode | wrong insertion position silently reroutes leads — caught by the both-direction fixtures, not by inspection |

**Notes:** First-match ordering makes rule position load-bearing (payload complexity driver #2).

## IN-3 — liveness-evidence-and-ledger (linked story `S-4`, `S-5`)

| Property | Value |
|---|---|
| Field | evidence files (mtime) + dispatch-ledger completion records + threshold N minutes consumed by `scripts/checks/epsilon-liveness.js` |
| Type | filesystem timestamps + JSONL ledger records + numeric threshold (N default decided at design, ~10 min) |
| Required | yes — evidence-without-matching-record older than N = stalled |
| Source | system (runtime evidence dirs + paths.eventsFile/dispatch ledger; ε startup self-check records the active conduct route) |
| Validation | deterministic fixture timestamps (no wall-clock flake); matching record within window = pass |
| Failure mode | malformed/missing ledger → fail closed non-zero (P-053/BC-16); stale evidence without record → loud `epsilon-stalled` event + non-zero |

**Notes:** Mirrors gauntlet-verify absence-detection applied to the conductor. Worktree-cwd ledger placement (ED-016 class) is a known hazard the fixture set should cover at design.
