# Acceptance Criteria - E-PRODUCT-FOUNDATION-001 W0 telemetry seam

**Sprint:** `S-PF-01`
**PRD:** `.claude/project/sprint/requirements/S-PF-01/prd.md`

## S-1 - Add the boot-safe track seam

- AC-1.1: Given a scaffold with no analytics env values configured, when `track()` is called, then it returns normally through the no-op sink and does not throw, reject, or log an error.
  verified_by: tests/regression/S-PF-01/telemetry-seam.test.js::track-noop-sink-does-not-throw
- AC-1.2: Given a scaffold with a configured sink, when `track()` emits an event, then the call goes through exactly one sink resolver and no second raw emit path exists.
  verified_by: tests/regression/S-PF-01/scaffold-coverage-telemetry.test.js::duplicate-sink-fixture-fails
- AC-1.3: Given a sink implementation that throws, when `track()` calls it, then the error is swallowed at the `track()` boundary and app code continues.
  verified_by: tests/regression/S-PF-01/telemetry-seam.test.js::throwing-sink-is-swallowed
- AC-1.4: Given scaffold layout/page templates, when the app compiles, then telemetry imports do not add external dependencies or block render.
  verified_by: tests/regression/S-PF-01/scaffold-coverage-telemetry.test.js::real-scaffold-telemetry-tree-passes

## S-2 - Add the canonical lifecycle event source

- AC-2.1: Given `events.ts.tmpl`, when scaffold coverage reads `LIFECYCLE_EVENTS`, then the set is exactly `signup`, `onboarding_complete`, `activation`, `core_action`, `retention_return`, and `checkout`.
  verified_by: tests/regression/S-PF-01/scaffold-coverage-telemetry.test.js::lifecycle-events-exact-set
- AC-2.2: Given `track.ts.tmpl`, when its event parameter is inspected, then it derives from `events.ts.tmpl` rather than hardcoding a competing string union.
  verified_by: tests/regression/S-PF-01/scaffold-coverage-telemetry.test.js::track-event-type-derives-from-events
- AC-2.3: Given an event name swap or missing event in a planted fixture, when scaffold coverage runs, then the scan exits non-zero.
  verified_by: tests/regression/S-PF-01/scaffold-coverage-telemetry.test.js::event-name-drift-fixture-fails

## S-3 - Bind activation to early-derived, lastmile-confirmed semantics

- AC-3.1: Given `ACTIVATION_DEFINITION.predicate` is empty, unresolved (`{{ACTIVATION_PREDICATE}}`), TODO, or a sentinel, when scaffold coverage runs, then it exits 1 with "activation definition present but undefined".
  verified_by: tests/regression/S-PF-01/scaffold-coverage-telemetry.test.js::unfilled-activation-fixture-fails
- AC-3.2: Given core-loop entities are too thin to derive activation honestly, when the canon derivation host runs, then it fails closed and requires founder-named intake rather than writing a placeholder.
  verified_by: tests/regression/S-PF-01/activation-definition.test.js::thin-core-loop-fails-closed
- AC-3.3: Given a fresh canon-derived scaffold, when `ACTIVATION_DEFINITION` is read, then it carries `predicate`, `provenance`, `confidence`, and `derivedFrom` with `provenance` set to `derived-at-canon` or `founder-named-at-intake`.
  verified_by: tests/regression/S-PF-01/scaffold-coverage-telemetry.test.js::activation-definition-shape-required
- AC-3.4: Given lastmile revises activation, when analytics confirm/revise runs, then it emits `activation_definition_change` with old and new predicate and updates provenance/confidence without a silent overwrite.
  verified_by: tests/regression/S-PF-01/lastmile-analytics-seam.test.js::activation-revision-emits-change-event

## S-4 - Re-point lastmile analytics to enrich the seam

- AC-4.1: Given lastmile analytics runs, when it renders an event plan, then the six seam events are the canonical base and lastmile funnel events are labelled as enrichment.
  verified_by: tests/regression/S-PF-01/lastmile-analytics-seam.test.js::analytics-enriches-canonical-base
- AC-4.2: Given analytics.js drifts a canonical event name from `events.ts`, when the parity assertion runs, then it fails.
  verified_by: tests/regression/S-PF-01/lastmile-analytics-seam.test.js::analytics-canonical-drift-fails
- AC-4.3: Given lastmile tries to install a second tracker or duplicate sink registration, when scaffold coverage scans templates, then it exits non-zero.
  verified_by: tests/regression/S-PF-01/scaffold-coverage-telemetry.test.js::duplicate-sink-fixture-fails

## S-5 - Add supply-chain telemetry stages

- AC-5.1: Given `track()` props include a stage, when TypeScript evaluates it, then only `intent`, `executed`, `committed`, `delivered`, and `observed` are valid.
  verified_by: tests/regression/S-PF-01/telemetry-chain.test.js::stage-vocabulary-is-fixed
- AC-5.2: Given a correlation id reaches committed/sent but never delivered/observed, when the chain helper evaluates it, then it marks the chain incomplete and reports `brokenAtStage`.
  verified_by: tests/regression/S-PF-01/telemetry-chain.test.js::sent-but-never-delivered-is-broken
- AC-5.3: Given the scaffold page template, when coverage scans for chain usage, then exactly one core-loop example is instrumented and no global click wrapper exists.
  verified_by: tests/regression/S-PF-01/scaffold-coverage-telemetry.test.js::no-global-click-wrapper

## S-6 - Extend the scaffold enforcer and shipping proof

- AC-6.1: Given telemetry template files are missing, when scaffold coverage runs, then it exits 1 and names the missing required file.
  verified_by: tests/regression/S-PF-01/scaffold-coverage-telemetry.test.js::seam-missing-fixture-fails
- AC-6.2: Given the real scaffold tree, when scaffold coverage runs, then it exits 0.
  verified_by: tests/regression/S-PF-01/scaffold-coverage-telemetry.test.js::real-scaffold-telemetry-tree-passes
- AC-6.3: Given the S-PF-01 message_brief/build_spec chain, when `scripts/contracts/validate-artifact.js` validates it, then it exits 0 with no dangling message_brief reference.
  verified_by: tests/regression/S-PF-01/contract-chain.test.js::message-brief-build-spec-chain-validates
- AC-6.4: Given manifests are regenerated, when framework and WarpOS manifest validators run, then new telemetry templates are shipped and no manifest drift remains.
  verified_by: tests/regression/S-PF-01/manifest-shipping.test.js::telemetry-templates-ship
