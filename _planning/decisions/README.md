# `_planning/decisions/` — planning-time decision records

- **What lives here:** planning-time decision rationale — the reasoned calls made while planning (scope, sequencing, trade-offs) that aren't yet a formal ADR. A staging area for decisions; load-bearing architecture calls graduate to a real ADR under `_docs/adr/`.
- **Who writes it:** President α (and β when a Class B/C call is logged). A decision that affects architecture/dependencies/data-model/security/deployment carries `OPEN_ADR: true` and should be promoted.
- **Naming:** `<YYYY-MM-DD>-<slug>.md` (e.g. `2026-06-09-planning-store-shape.md`).
- **Linkage:** each record names the epic/sprint it serves and its named enforcer (per `../principle.md` #7).
- **Ship boundary:** manifest-excluded + MUST_NOT_SHIP (inherited from `_planning/`, ADR-0005). Git-tracked, never shipped.
