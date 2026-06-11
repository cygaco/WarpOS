# INPUT Requirements - E-PRODUCT-FOUNDATION-001 W0 telemetry seam

**Sprint:** `S-PF-01`
**PRD:** `.claude/project/sprint/requirements/S-PF-01/prd.md`

## IN-1 - Sink configuration and event payloads

| Property | Value |
|---|---|
| Field | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, event name, props |
| Type | env-name strings, typed event union, object props |
| Required | env values optional; event name required |
| Source | scaffold template and runtime app code |
| Validation | Missing env values resolve to no-op sink; sink call is wrapped by `track()` boundary |
| Failure mode | Misconfigured or throwing sink is swallowed at the telemetry boundary; app boot continues |

## IN-2 - Lifecycle event set

| Property | Value |
|---|---|
| Field | `LIFECYCLE_EVENTS` |
| Type | readonly string tuple plus derived union |
| Required | yes |
| Source | `events.ts.tmpl` |
| Validation | Exact set-equality against the six canonical names |
| Failure mode | Missing, extra, or renamed event makes scaffold-coverage fail |

## IN-3 - Activation definition

| Property | Value |
|---|---|
| Field | `ACTIVATION_DEFINITION.predicate`, `provenance`, `confidence`, `derivedFrom` |
| Type | object with string literals |
| Required | yes |
| Source | canon/core-loop derivation or founder-named intake fallback |
| Validation | Predicate must be non-empty and not an unresolved template token, TODO, or sentinel |
| Failure mode | Thin core-loop data fails closed to founder-named intake; placeholder activation fails scaffold coverage |

## IN-4 - Lastmile analytics base and enrichment events

| Property | Value |
|---|---|
| Field | canonical base events and enrichment events |
| Type | arrays/objects in `analytics.js` |
| Required | yes |
| Source | seam event vocabulary plus lastmile module |
| Validation | Canonical base must match/seal to the six seam events; enrichment is labelled separately |
| Failure mode | Parallel tracker install, duplicate sink, or canonical drift fails scaffold coverage or lastmile tests |

## IN-5 - Chain props and stage vocabulary

| Property | Value |
|---|---|
| Field | `correlationId`, `stage`, chain records |
| Type | string id and fixed stage union |
| Required | stage required for chain helper inputs; correlation id generated or supplied |
| Source | scaffolded app code |
| Validation | Stage must be one of `intent`, `executed`, `committed`, `delivered`, `observed` |
| Failure mode | Sent/committed without delivered/observed surfaces as broken chain, not success |

## IN-6 - Enforcer fixtures and manifest paths

| Property | Value |
|---|---|
| Field | scaffold fixture trees, telemetry template paths, manifest entries |
| Type | files and JSON manifest rows |
| Required | yes |
| Source | `framework/templates/app-scaffold`, `scripts/checks`, generated manifests |
| Validation | Planted fixtures must fail and real scaffold must pass |
| Failure mode | Missing template, duplicate sink, unfilled activation, or unmanifested telemetry file blocks close |
