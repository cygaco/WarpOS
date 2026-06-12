# `_planning/playbooks/` — reusable execution playbooks

- **What lives here:** distilled, reusable procedures harvested from completed epics/sprints — the "how we do X" that should outlive any single sprint (a known-good sequence, its gates, its failure modes).
- **Who writes it:** `/playbook:add` (President α), or a retro/learning step that promotes a recurring pattern into a durable playbook.
- **Naming:** `<topic>-playbook.md` (e.g. `mode-switch-teardown-playbook.md`).
- **Linkage:** a playbook cites the epic(s)/sprint(s) it was distilled from; principles in `../principle.md` apply.
- **Ship boundary:** manifest-excluded + MUST_NOT_SHIP (inherited from `_planning/`, ADR-0005). Git-tracked, never shipped.

## Authored playbooks

- `launch-readiness-playbook.md` — prototype to paid/public launch readiness.
- `provider-setup-playbook.md` — T1/T2/T3 provider readiness and confirm-class tier config.
- `mode-switch-playbook.md` — safe mode transition and team-state verification.
- `incident-response-playbook.md` — gate/review/stall/false-green incident repair loop.
- `retro-loop-playbook.md` — closeout, learning integration, and tracker reconciliation.

Coverage: `node scripts/checks/playbook-suite-coverage.js` validates the required reference-playbook section contract and is wired into `/scan:full`.
