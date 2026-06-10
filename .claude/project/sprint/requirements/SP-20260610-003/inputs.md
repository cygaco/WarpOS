<!-- requirement-format-legacy -->
# INPUT Requirements — Lanes C+D — sprint-pipeline truth + research:deep runnability (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-003`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\prd.md`

> INPUTS captures fields, forms, data entry, validation, and user/system
> inputs. Each entry should be testable. Engine sprint — there are no
> user-entered form inputs; all inputs below are system inputs consumed
> by the engine defaults, the scaffold, and the runner this sprint ships.

## IN-1 — live-mode-marker (linked story `S-1`)

| Property | Value |
|---|---|
| Field | live mode marker read by `scripts/hooks/lib/mode.js` `isSprint()` (the S-LC-01 mode-lifecycle registry mechanism) |
| Type | mode id string (sprint / solo / adhoc / oneshot) resolved by the registry helper |
| Required | yes — `full.js` derives the `epsilonDispatch` default from it |
| Source | system (mode-lifecycle registry via `isSprint()` — NOT a new literal; β condition, confirmed) |
| Validation | planted tests both ways: mode marker sprint → `epsilonDispatch` defaults true; solo/adhoc/oneshot → default unchanged; explicit `--epsilon-dispatch` flag overrides in both directions |
| Failure mode | missing/unreadable mode marker → non-sprint default (current behavior preserved); never defaults epsilon ON on an unverifiable mode signal |

**Notes:** Reusing `isSprint()` keeps the registry the single mode source — a new literal would fork it (rename-hygiene bug class). The design-transition enforcer (R-2) additionally consumes requirement-artifact change state + roster completion records from the ledger; it is report-only and scoped to newly scaffolded sprints (complexity driver #2).

## IN-2 — plan-contract-requirement-areas (linked story `S-2`)

| Property | Value |
|---|---|
| Field | `requirement_areas[]` in the sprint's Plan Contract (consumed by `scripts/sprint/design.js` scaffolding) |
| Type | ordered string array (one entry per requirement area) |
| Required | yes — the SINGLE source for the PRD R-list AND the stories/trace R-references, sized dynamically |
| Source | system (plan contract YAML, authored at `/sprint:plan`) |
| Validation | trace-integrity check: every R-id cited in stories/trace must be defined in the PRD — FAIL (not legacy-waive) for newly scaffolded sprints; a >3-area contract scaffolds a matching-size R-list (no fixed R-1..R-3 stub) |
| Failure mode | empty/missing `requirement_areas` → scaffold refuses rather than minting a placeholder R-list; orphan R-id citation → non-zero check failure |

**Notes:** This sprint's own payload has 6 requirement areas — it is itself a >3-area test case of the WG-7 fix. AL-W-006 (also S-2) consumes the current.yaml schema fields `crash_recovery`/`ralph`/`reports` as the status/checkpoint read contract.

## IN-3 — provider-quota-probe-response (linked story `S-3`)

| Property | Value |
|---|---|
| Field | per-provider billable probe response (HTTP status + error code body) consumed by deep-run.js Phase 0 |
| Type | API response — success vs `insufficient_quota` / 429-credits error classes |
| Required | yes — one tiny billable call per provider (cheapest model: openai gpt-4o-mini-class, gemini flash-class; ≤5 tokens) before any async research submission |
| Source | integration (provider APIs via the existing auth-resolver; keys referenced by label only) |
| Validation | `insufficient_quota`/429-credits → classified as an up-front SKIP with an actionable message naming the provider label; transient non-quota errors not misclassified as quota; mocked-response fixture proves classification without live spend |
| Failure mode | depleted key → provider skipped up front with actionable message (not a post-submission failure); probe never echoes key values (auth-resolver labels only); total probe spend ≤ cents, inside the $5 floor |

**Notes:** Model choice per provider is an open question resolved at design (cheapest available). The runner polls INTERNALLY (async inside node) — no bash `sleep`, no `node -e` fs-writes — which is what makes it classifier-survivable (MC-WG-2).
