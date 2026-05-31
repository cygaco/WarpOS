<!-- requirement-format-legacy -->
# INPUT Requirements — scan:warpos-layer-diff — product-vs-dev-tooling layer diff report

**Sprint:** `SP-20260531-003`
**PRD:** `.claude/project/sprint/requirements/SP-20260531-003/prd.md`

## IN-1 — CLI flags (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `--json`, `--root <dir>` |
| Type | boolean flag / path |
| Required | no (both optional) |
| Source | invoker (maintainer / scan:full) |
| Validation | `--root` must resolve to a dir containing the two manifests; else a clear non-zero error (AC-1.4) |
| Failure mode | missing manifest → exit non-zero, names the missing file (never a misleading empty diff) |

**Notes:** No user/form data entry — this is a read-only scan. Its only "inputs" are two optional CLI flags and the two manifest files it reads. No `secret:` values.
