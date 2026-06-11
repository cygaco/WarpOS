<!-- requirement-format-legacy -->
# TRACE Requirements — E-LIFECYCLE-001 close-out fix sprint — 17 REAL + 4 PARTIAL GPT 2nd-pass findings (team-guard/mode-guard bypass classes, turbo spend/auth integrity, coverage-gate waiver+expected-source, provider-tier false-green, planning-principles enforce path, ac-coverage fail-closed) + NOTAGAIN §8.3 legacy scoping

**Sprint:** `SP-20260611-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\prd.md`

> TRACE captures the observability, traceability, event capture, decision
> logging, and requirement-to-code linkage layer. The point of TRACE is
> to answer: why did this exist, where did the requirement come from,
> what changed because of it, how was it tested, and what should persist
> as a learning. For these enforcer fixes, the captured signal is what
> makes a bypass/false-green VISIBLE (a silent bypass is the bug class).

## Trace Map

> One row per requirement area (R-1..R-10, single-source from plan_contract.requirement_areas,
> T-298). Ticket column filled at `/sprint:design` (the ~6 surface-grouped tickets).

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| GPT-2p triage #1,#2,#4,#5,#7 | R-1 | S-1 | C-1 | IN-1 | — | T-… | scripts/hooks/team-guard.js + scripts/teams/lifecycle.js | team-guard-verify.test.js + lifecycle-roster-exact-match.test.js | — | — |
| GPT-2p triage #3,#6 | R-2 | S-2 | C-2 | IN-2 | — | T-… | scripts/mode-set.js + scripts/hooks/mode-lifecycle-guard.js + out-of-band-write detector | mode-write-coverage.test.js | — | — |
| GPT-2p triage #8,#9,#14 | R-3 | S-3 | C-3 | IN-3 | — | T-… | scripts/turbo/apply.js + scripts/turbo/spend-ledger.js | turbo-auth-monotonic.test.js + turbo-spend-anchor.test.js + turbo-self-lockout.test.js | — | — |
| GPT-2p triage #10 | R-4 | S-4 | C-4 | IN-4 | — | T-… | scripts/hooks/authorization-gate.js | auth-floor-tracked-delete.test.js | — | — |
| GPT-2p triage #11,#12 + NOTAGAIN §8.3 | R-5 | S-5 | C-5 | IN-5 | — | T-… | scripts/dispatch/coverage-gate.js + scripts/checks/coverage-gate-scan.js + shared cutoff helper | coverage-gate-waiver.test.js + coverage-gate-scan-source.test.js + legacy-cutoff-shared.test.js | — | — |
| GPT-2p triage #15,#16,#21 | R-6 | S-6 | C-6 | IN-6 | — | T-… | scripts/warpos/provider-tier-check.js + lib/provider-tier-config.js | provider-tier-matrix.test.js | — | — |
| GPT-2p triage #17,#19 | R-7 | S-7 | C-7 | IN-7 | — | T-… | scripts/checks/planning-principles.js | planning-principles-enforce.test.js | — | — |
| GPT-2p triage #18 + minor + §8.3 | R-8 | S-8 | C-8 | IN-8 | — | T-… | scripts/sprint/check-ac-coverage.js + shared cutoff helper | ac-coverage-failclosed.test.js | — | — |
| GPT-2p triage #20 | R-9 | S-9 | C-9 | IN-9 | — | T-… | scripts/checks/mode-lifecycle-hooks-coverage.js | hooks-coverage-allowlist.test.js | — | — |
| GPT-2p triage #13 (post-SP-001) | R-10 | S-10 | C-10 | IN-10 | — | T-… | scripts/dispatch-agent.js + scripts/dispatch-claude.js (call sites RE-LOCATED post-merge) | wrapper-mode-binding.test.js | — | — |

## TR-1 — R-1 W1 gate integrity (findings #1,#2,#4,#5,#7)

**Event:** team-guard refusal/cross-check stderr + a MANDATORY kill-switch audit event (paths.eventsFile) on any `WARPOS_DISABLE_TEAM_GATE`/`.team-gate-off` bypass
**When:** a worker dispatch with a team_name fails config verification; a planted marker/mode.json is rejected; the kill-switch fires
**Captured fields:** team_name, config-lookup result (found/ready/ε-for-slug), mode cross-check result, kill-switch id + reason
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** a silenced gate (kill-switch) or a rejected spoof must be VISIBLE at /scan — a silent bypass is the #5 bug class. The verify result makes "why did the gate block/open" diagnosable.

## TR-2 — R-2 mode-write coverage (findings #3,#6)

**Event:** mode lifecycle events emitted BY mode-set.js; an out-of-band-write finding at scan; a mode-guard kill-switch audit event
**When:** any mode.json write (sanctioned via mode-set.js, or out-of-band); the mode-guard kill-switch fires
**Captured fields:** mode (old→new), writer (mode-set.js vs out-of-band), mtime, matching-event presence, kill-switch reason
**Linked requirement:** `R-2`
**Linked story:** `S-2`
**Why we capture this:** the event emission is what lets the detector tell a sanctioned single-writer change from an out-of-band spoof — and the kill-switch event closes the #6 silent-suppression class.

## TR-3 — R-3 turbo auth + spend integrity (findings #8,#9,#14)

**Event:** operator-provenance stamp recorded on the authorization record per widening; a suspect-record HIGH notice on nonfinite bytes
**When:** a widening re-apply; a dispatch record with a nonfinite/overflow byte count is summed
**Captured fields:** provenance (operator/source + ts) per grant, session-start anchor (separate from granted_at), offending byte value + record id
**Linked requirement:** `R-3`
**Linked story:** `S-3`
**Why we capture this:** the provenance stamp makes a widening attributable (who/why); the session-anchor keeps prior same-session paid calls counted; the suspect notice makes a spoofed-bytes underreport LOUD instead of a silent $0.

## TR-4 — R-4 authorization safety floor (finding #10)

**Event:** authorization-gate pass-through (no-approve) decision + audit note when a tracked-work delete hits the floor
**When:** a `fs.rmSync`/`unlinkSync`/`rm -rf` on a git-tracked path is evaluated under ANY scope
**Captured fields:** command, target path, tracked-status (git-aware), scope it arrived under
**Linked requirement:** `R-4`
**Linked story:** `S-4`
**Why we capture this:** a turbo node-e-fs grant auto-approving rm of tracked work was a live bypass; the floor pass-through note is the signal that the destructive op was caught and routed to review, not approved.

## TR-5 — R-5 coverage-gate waiver provenance + expected-source + legacy scoping (findings #11,#12; §8.3)

**Event:** waiver-reject (no provenance) refusal; active-waiver line surfaced in scan output; expected-but-no-record gap from the external source
**When:** a waiver is evaluated; the self-audit scan derives `expected`; the legacy cutoff is applied
**Captured fields:** role, waiver provenance (operator/source/ts/backing record), expected-source (registry/sprint composition), cutoff date, record timestamp vs cutoff
**Linked requirement:** `R-5`
**Linked story:** `S-5`
**Why we capture this:** a silenced role (waiver) must be auditable at /scan; an omitted role must still be a gap; a post-cutoff violation must still RED (scope-then-flip is observable in the captured cutoff comparison).

## TR-6 — R-6 provider-tier truthfulness (findings #15,#16,#21)

**Event:** verdict string (`tier_short` vs `unknown-self-attested`) + JSON envelope `ok` field + a fail-closed note on corrupt config
**When:** `--enforce` evaluates a t3-selected provider with T1 down; a present-but-corrupt config is read
**Captured fields:** selected_tier, t1_met, effective_tier, config_readable, verdict_summary, envelope ok, raised-floor preserved?
**Linked requirement:** `R-6`
**Linked story:** `S-6`
**Why we capture this:** the verdict + envelope ok are exactly the fields an `ok`-only consumer false-greened on; capturing them as a matrix makes the truth-table testable and the false-green impossible.

## TR-7 — R-7 planning-principles real enforce (findings #17,#19)

**Event:** non-zero exit + violation count under `--enforce`; a fail-closed (exit 2) note on internal error
**When:** `--enforce` finds violations or an internal runner error occurs; the extended scan scope is walked
**Captured fields:** violation count, exit code, internal-error flag, scanned dirs (epics/sprints/root)
**Linked requirement:** `R-7`
**Linked story:** `S-7`
**Why we capture this:** the prior "proven green in enforce mode" was hollow (always exit 0); the captured exit code + violation count are the proof the enforce path is REAL and fail-closed.

## TR-8 — R-8 ac-coverage fail-closed + scoping (finding #18 + minor; §8.3)

**Event:** non-zero exit + a missing/unreadable-artifact note under `--enforce`; legacy-cutoff comparison
**When:** a named AC artifact is missing/unreadable under `--enforce`; a historic sprint is legacy-scoped
**Captured fields:** artifact path, readable?, exit code, cutoff date vs record date, greenfield-vs-named distinction
**Linked requirement:** `R-8`
**Linked story:** `S-8`
**Why we capture this:** a planted-missing artifact passing the gate is a false-green; the captured artifact-readable + exit code make the fail-closed behavior verifiable. Proof-syntax minor carried as documented residue.

## TR-9 — R-9 hooks-coverage allowlist schema (finding #20)

**Event:** a finding when an allowlist entry is schemaless or expired
**When:** the coverage check loads the `wiring_pending` allowlist
**Captured fields:** event name, owner, expiry/review_by, reason, expired? (review_by < now)
**Linked requirement:** `R-9`
**Linked story:** `S-9`
**Why we capture this:** a permanent silent allowlist entry can suppress a real emitter-gap forever; capturing owner/expiry makes a stale suppression self-flagging.

## TR-10 — R-10 wrapper mode binding (finding #13 — post-SP-001 merge)

**Event:** dispatch-contract refusal/report line carrying the live mode; completion-record mode field
**When:** every wrapper dispatch (mode now threaded); a mode-disallowed shape is refused (enforce) or reported (ramp)
**Captured fields:** mode, shape, mode_profiles/alpha_only_shapes verdict, enforce-vs-report-only
**Linked requirement:** `R-10`
**Linked story:** `S-10`
**Why we capture this:** mode-narrowing was dead at every call site; capturing the threaded mode + verdict makes the live enforcement observable and the report-only ramp legible.
