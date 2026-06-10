# `_planning/archive/` — superseded / closed plan artifacts

- **What lives here:** retired plan artifacts kept for provenance — epic/sprint plans that were superseded, folded, or closed. Nothing here is live; it exists so the history of a plan's evolution stays auditable.
- **Who writes it:** `/epic:close` and `/epic:fold` (President α) move a superseded artifact here on supersession; never hand-edited after archival.
- **Naming:** preserves the original filename (e.g. `E-LIFECYCLE-001.md`); add a `superseded_by:` / `archived_on:` frontmatter key on move.
- **Linkage:** an archived artifact retains its original `tracker:` pointer for traceability.
- **Ship boundary:** manifest-excluded + MUST_NOT_SHIP (inherited from `_planning/`, ADR-0005). Git-tracked, never shipped.
