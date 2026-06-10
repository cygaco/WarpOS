# `_planning/sprints/` — durable per-sprint plan artifacts

- **What lives here:** the durable plan artifact for each sprint — the reasoned plan a sprint links to (scope variants, assumptions, blast-radius, test strategy, AC). The live Plan Contract / status lives in the sprint tracker; this is the human-readable plan of record.
- **Who writes it:** `/sprint:plan` (President α; in adhoc, β consults on Class B/C). `/epic:fold` may reconcile it into its parent epic.
- **Naming:** `<SP-id>.md` (e.g. `SP-20260609-001.md`).
- **Tracker linkage (required):** each artifact MUST carry a `tracker:` frontmatter key pointing at `trackers/sprints/<SP-id>-*.md` AND name its parent `epic:`. Enforced report-only by `/scan:planning-principles`.
- **Ship boundary:** manifest-excluded + MUST_NOT_SHIP (inherited from `_planning/`, ADR-0005). Git-tracked, never shipped.
