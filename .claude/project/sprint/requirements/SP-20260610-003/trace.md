<!-- requirement-format-legacy -->
# TRACE Requirements — Lanes C+D — sprint-pipeline truth + research:deep runnability (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-003`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\prd.md`

> TRACE captures the observability, traceability, event capture, decision
> logging, and requirement-to-code linkage layer. The point of TRACE is
> to answer: why did this exist, where did the requirement come from,
> what changed because of it, what external dependency or approval was
> required, how was it tested, what shipped, and what should persist as
> a learning.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| WARPOS.md sweep doogle WG-3 (grep -c epsilon → 0; full.js:178-179) | R-1 | S-1 | C-1 (none) | IN-1 | — | T-1 | .claude/commands/sprint/full.md + scripts/sprint/full.js (isSprint() default) | planted tests both ways: sprint→ON, solo/adhoc→unchanged (AC-1.1, AC-1.2) | ff-merge (RI-001) | — |
| WARPOS.md sweep doogle WG-3 (enforcer; α authored design artifacts live) | R-2 | S-1 | C-1 (none) | IN-1 | — | T-1 | design-transition enforcer (full.js seam or standalone check, resolved at design) | planted changed-artifacts-without-roster-records fixture (AC-1.4) | ff-merge (RI-001) | — |
| WARPOS.md sweep doogle WG-7 (re-reproduced TODAY in SP-20260610-002 scaffold) | R-3 | S-2 | C-1 (none) | IN-2 | — | T-2 | scripts/sprint/design.js + framework/templates/sprint/requirements/* + NEW trace-integrity check | >3-area contract fixture: PRD R-list == stories/trace R-refs; planted orphan R-id → FAIL (AC-2.1, AC-2.2) | ff-merge (RI-001) | — |
| almanac AL-W-006 (status.js:55-100, checkpoint.js:83) | R-4 | S-2 | C-1 (none) | IN-2 | — | T-2 | scripts/sprint/status.js + checkpoint.js | schema-fields fixture: crash_recovery/ralph/reports read + checkpoint validated (AC-2.3) | ff-merge (RI-001) | — |
| masterconsole MC-WG-2 (deep.md lines 255/339/452 sleep; 212-468 node -e) | R-5 | S-3 | C-1 (none) | IN-3 | — | T-3 | NEW scripts/research/deep-run.js + .claude/commands/research/deep.md thin wrapper | deep-run.js --help exit 0; deep.md grep zero sleep/node -e writeFileSync (AC-3.1, AC-3.2) | ff-merge (RI-001) | — |
| masterconsole MC-WG-3 (Phase 0 checks access, not credit) | R-6 | S-3 | C-1 (none) | IN-3 | — | T-3 | deep-run.js Phase 0 quota probe | mocked insufficient_quota/429 fixture → up-front skip classification (AC-3.3) | ff-merge (RI-001) | — |

## TR-1 — design-transition-roster-verdict

**Event:** design-transition enforcer verdict record (pass / `design-transition-refused`, report-only) emitted when a sprint attempts the design→designed transition
**When:** at every design→designed transition attempt for a newly scaffolded sprint — after requirement-artifact change detection, before the state flips
**Captured fields:** sprint id, verdict, changed requirement artifacts, matching roster completion records found (or absent), epsilonDispatch resolution (mode-derived via isSprint() vs explicit flag), timestamp
**Linked requirement:** `R-2`
**Linked story:** `S-1`
**Why we capture this:** the WG-3 bug class was α ghost-writing the roster's design work with nothing detecting it (policy without an enforcer, observed live); recording the verdict + the dispatch-default resolution makes a roster bypass self-detecting per CLAUDE.md Policy & Enforcement Hygiene, while report-only wiring keeps legacy sprints unaffected.

## TR-2 — trace-integrity-check-result

**Event:** trace-integrity check result (pass / FAIL naming each orphan R-id cited in stories/trace but undefined in the PRD)
**When:** at scaffold time in `design.js` and on every check run (scan:requirements / req-format-guard idiom, per design decision) against newly scaffolded sprints — fail, not legacy-waive
**Captured fields:** sprint id, R-ids defined in PRD, R-ids cited in stories/trace, orphan set, source contract (`requirement_areas` count), timestamp
**Linked requirement:** `R-3`
**Linked story:** `S-2`
**Why we capture this:** the WG-7 class shipped inconsistent R-ids silently — SP-20260610-002's own scaffold needed a repair sub-agent the same day; capturing defined-vs-cited sets makes every future divergence loud at birth instead of audit-time.

## TR-3 — quota-probe-classification

**Event:** Phase 0 quota-probe classification record per provider (`ok` / `insufficient_quota-skip` with the actionable message)
**When:** at deep-run.js Phase 0, once per provider, BEFORE any async research submission
**Captured fields:** provider + auth-resolver key label (never key values), probe model, classification (ok / insufficient_quota / 429-credits / transient-error), tokens spent (≤5), timestamp
**Linked requirement:** `R-6`
**Linked story:** `S-3`
**Why we capture this:** the MC-WG-3 class burned a full async research cycle before surfacing a depleted key; recording the up-front classification proves the probe ran, keeps spend auditable against the $5 floor, and gives the operator an actionable per-provider skip reason.
