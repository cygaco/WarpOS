# Red-Team Plan — scan:warpos-layer-diff — product-vs-dev-tooling layer diff report

**Sprint:** `SP-20260531-003`
**PRD:** `.claude/project/sprint/requirements/SP-20260531-003/prd.md`

> Read-only observability scan — almost all product threat classes are N/A (no auth, no user input, no runtime service, no mutation). The only real adversarial concerns are **silent mis-classification** and **accidental mutation**.

## Threat classes to cover

- [ ] (N/A) auth / authz, input/injection, business-logic abuse, ESD abuse, approval bypass — none introduced
- [x] **Read-only guarantee** — the scan must NEVER write/modify any file (it only reads the two manifests). Confirm no fs write/append anywhere in the script.
- [x] **Misleading-empty result** — if a manifest is missing/unreadable, the scan must fail clearly (non-zero, name the file), NOT emit an empty diff that reads as "no dev-tooling paths" (false reassurance). Mirrors the false-green class.

## Stop-the-bus signals

- The scan writes to disk → halt (must be read-only).
- The scan reports an empty/partial diff while a manifest is actually missing → halt (clear-error required).

## Documentation scaling

Light — single checklist appropriate for this read-only feature.
