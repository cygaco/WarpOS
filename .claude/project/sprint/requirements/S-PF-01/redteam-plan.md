# Red-Team Plan - E-PRODUCT-FOUNDATION-001 W0 telemetry seam

**Sprint:** `S-PF-01`
**PRD:** `.claude/project/sprint/requirements/S-PF-01/prd.md`

## Threat classes

- [ ] Tracker blocks app boot because a sink throws or env config is malformed.
- [ ] A second tracker install bypasses the single-seam contract.
- [ ] Lifecycle events drift by wrong-name swap while count checks still pass.
- [ ] Activation exists but remains a TODO, unresolved template token, or sentinel.
- [ ] Lastmile silently overwrites activation without `activation_definition_change`.
- [ ] Broken chain is counted as success because terminal stages are missing.
- [ ] Telemetry templates are added but not shipped in manifests.

## Planted fixtures

- Seam missing: remove `track.ts.tmpl` or `sink.ts.tmpl`; scan must exit 1.
- Duplicate sink: add raw capture or second registration; scan must exit 1.
- Unfilled activation: set predicate to `{{ACTIVATION_PREDICATE}}`; scan must exit 1.
- Broken chain: committed/sent with no delivered/observed; helper must report broken, not complete.
- Event drift: replace `checkout` with a wrong name; scan must exit 1.

## Stop signals

- Any telemetry path that can throw through app boot.
- Any live provider dependency added in W0.
- Any duplicate sink or parallel tracker install that passes scaffold coverage.
- Any activation placeholder that passes scaffold coverage.
- Any missing manifest/shipping proof for new scaffold templates.
