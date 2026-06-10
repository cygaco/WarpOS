# `_planning/research/` — durable research outputs that feed plans

- **What lives here:** synthesized, durable research that informs planning — market/technical/feasibility findings written up as a citable artifact. Distinct from `../ingest/` (raw external corpus): this is *processed* research with conclusions, not raw source.
- **Who writes it:** `/research:deep` (and research roles); a planning step that needs grounded evidence before a Class B/C call.
- **Naming:** `<topic>-research.md` (e.g. `provider-tier-readiness-research.md`).
- **Linkage:** each artifact names the epic/sprint it feeds and labels evidence level (verified / inferred / assumed / unknown), per `../principle.md` #1.
- **Ship boundary:** manifest-excluded + MUST_NOT_SHIP (inherited from `_planning/`, ADR-0005). Git-tracked, never shipped.
