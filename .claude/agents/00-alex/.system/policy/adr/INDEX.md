# ADR Index

Architecture Decision Records — settled decisions Beta consults to find precedent on prior tradeoffs.

---

## Where settled decisions live

**Pre-2026-04-29 settled decisions** are documented in `docs/04-architecture/`. Those files ARE this project's ADR archive — they capture what was chosen and why for the Jobzooka core stack and architecture, just not in numbered ADR format. When checking precedent, search there first:

- `docs/04-architecture/STACK.md` — framework, language, hosting, styling, state, AI provider, job-data source
- `docs/04-architecture/AUTH_SCHEMAS.md` — JWT + OAuth (Google/LinkedIn) + email/password
- `docs/04-architecture/EXTENSION_SPEC.md` — Chrome extension architecture
- `docs/04-architecture/API_SURFACE.md` — server route shape and contracts
- `docs/04-architecture/DATA_FLOW.md`, `PERSISTENCE.md` — encrypted localStorage + Redis sessions
- `docs/04-architecture/SECURITY.md` — security posture and boundaries
- `docs/04-architecture/THIRD_PARTY.md` — vendor list (Stripe, Bright Data, Upstash, Anthropic)
- `docs/04-architecture/PIPELINES.md`, `DATA-CONTRACTS.md` — data and pipeline contracts
- `docs/04-architecture/ENV_VARS.md`, `VALIDATION_RULES.md`, `ERROR_RECOVERY.md` — operational

These were not backfilled as numbered ADRs because doing so would duplicate documentation that already exists and is well-maintained.

---

## New ADRs

From 2026-04-29 onward, **new** Class B decisions that affect architecture, dependencies, data model, security, or deployment land here as numbered files:

```
NNNN-slug.md
```

Use `0000-template.md` as the starting point.

Naming:
- `NNNN` = monotonically increasing zero-padded integer (`0001`, `0002`, ...)
- `slug` = short kebab-case description (`add-zod-validation`, `move-to-postgres`)

When Beta returns DECIDE on a Class B decision with `OPEN_ADR: true`, Alpha drops a new ADR file here in the next cycle. Beta can then check this index for precedent on similar future decisions.

---

## Index

| ADR | Title | Date | Status | Supersedes |
|---|---|---|---|---|
| [0001](0001-warp-promote-location.md) | Build /warp:promote in Jobzooka First | 2026-05-01 | accepted | - |

When ADRs accrete, add a row here pointing at each file. Keep the table in sync with the filesystem; `/check:references` will catch drift.
