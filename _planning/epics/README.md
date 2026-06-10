# `_planning/epics/` — durable epic plan artifacts

- **What lives here:** the durable *plan artifact* for each epic — the grounded plan an epic links to (background, blast-radius, waves, AC, DoD). Distinct from the epic *tracker* (`trackers/epics/<E-id>-*.md`, the live state) — this is the reasoned plan; the tracker is the status of record.
- **Who writes it:** `/epic:plan` (President α). `/epic:fold` updates it with provenance; `/epic:close` moves a superseded artifact to `../archive/`.
- **Naming:** `<E-id>.md` (e.g. `E-LIFECYCLE-001.md`).
- **Tracker linkage (required):** each artifact MUST carry a `tracker:` frontmatter key pointing at `trackers/epics/<E-id>-*.md`, and the epic tracker links back here. Enforced report-only by `/scan:planning-principles`.
- **Ship boundary:** manifest-excluded + MUST_NOT_SHIP (inherited from `_planning/` — `walk-skip.js` + `warpos-ship-coverage.js` MUST_NOT_SHIP_PREFIXES, ADR-0005). Git-tracked, never shipped.
