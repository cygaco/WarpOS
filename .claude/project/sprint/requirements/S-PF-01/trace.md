# TRACE Requirements - E-PRODUCT-FOUNDATION-001 W0 telemetry seam

**Sprint:** `S-PF-01`
**PRD:** `.claude/project/sprint/requirements/S-PF-01/prd.md`

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| Product Lead build_spec + DoP ruling | R-1 | S-1 | C-1 | IN-1 | none | T-... | `track.ts.tmpl`, `sink.ts.tmpl`, env example, layout/page | scaffold coverage + template unit tests | RL-... | telemetry seam fail-open |
| Product Lead build_spec | R-2 | S-2 | C-2 | IN-2 | none | T-... | `events.ts.tmpl` | exact event set tests | RL-... | event vocabulary single source |
| DoP activation ruling | R-3 | S-3 | C-3 | IN-3 | none | T-... | canon derivation host, `events.ts.tmpl`, `analytics.js` | unfilled activation + lastmile revise tests | RL-... | activation is early-derived lastmile-confirmed |
| Product Lead build_spec | R-4 | S-4 | C-4 | IN-4 | none | T-... | `analytics.js`, event-plan template if needed | analytics seam parity tests | RL-... | enrich-not-reinstall |
| Operator supply-chain fold f44fccaf | R-5 | S-5 | C-5 | IN-5 | none | T-... | `chain.ts.tmpl`, page core-loop example | broken-chain fixture | RL-... | chain failure is first-class |
| W0 DoD | R-6 | S-6 | C-6 | IN-6 | none | T-... | `scaffold-coverage-scan.js`, fixtures, manifests | scaffold-coverage-scan.test.js, manifest validators | RL-... | false-green fixtures guard scaffold contracts |

## TR-1 - Telemetry seam resolution

**Event:** `track()` invocation resolves one sink and swallows sink failures.
**When:** any scaffolded code calls `track()`.
**Captured fields:** event name, props, sink resolution state.
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** boot safety is the product-wide invariant; a telemetry sink must never break scaffolded app boot.

## TR-2 - Lifecycle event vocabulary

**Event:** exact six-event set appears in `events.ts`.
**When:** scaffold coverage scans the template tree.
**Captured fields:** expected set, actual set, missing/extra entries.
**Linked requirement:** `R-2`
**Linked story:** `S-2`
**Why we capture this:** count-only checks would false-green a wrong-name swap.

## TR-3 - Activation definition lifecycle

**Event:** activation derived at canon, confirmed or revised at lastmile, and `activation_definition_change` emitted on revision.
**When:** product canon/scaffold materializes activation and lastmile audit runs.
**Captured fields:** old predicate, new predicate, provenance, confidence, derivedFrom.
**Linked requirement:** `R-3`
**Linked story:** `S-3`
**Why we capture this:** activation being present but undefined is a false-green; revisions must be visible.

## TR-4 - Lastmile analytics enrichment

**Event:** lastmile analytics reads the seam vocabulary and labels funnel events as enrichment.
**When:** lastmile analytics `plan()` runs.
**Captured fields:** canonical base events, enrichment events, install/enrich mode.
**Linked requirement:** `R-4`
**Linked story:** `S-4`
**Why we capture this:** lastmile must not install a second tracker or redefine canonical events.

## TR-5 - Supply-chain chain integrity

**Event:** chain helper marks incomplete chains and reports broken stage.
**When:** a correlation id reaches committed/sent without delivered/observed.
**Captured fields:** correlationId, reached stages, brokenAtStage.
**Linked requirement:** `R-5`
**Linked story:** `S-5`
**Why we capture this:** QA needs to assert that the action completed, not just that a button was clicked.

## TR-6 - Enforcer and shipping evidence

**Event:** scaffold-coverage and manifest checks pass on real tree and fail on planted fixtures.
**When:** build/gauntlet/release verification runs.
**Captured fields:** fixture name, expected exit code, actual exit code, manifest drift.
**Linked requirement:** `R-6`
**Linked story:** `S-6`
**Why we capture this:** W0's durable value is the contract plus its fail-closed proof, not just template files.
