# TRACE Requirements — Harden WarpOS update pipeline

**Sprint:** `SP-20260514-001`
**PRD:** `prd.md`

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| GPT-5.5 review | R-1 | S-1, S-2 | — | — | — | T-… | `scripts/warpos/lib/content-hash.js` | replay-bench | 0.7.0 | LRN |
| GPT-5.5 review | R-1, R-6 | S-3, S-4 | C-4 | IN-4, IN-5 | — | T-… | `generate-framework-manifest.js`, `update.js` | replay-bench | 0.7.0 | LRN |
| GPT-5.5 review | R-2 | S-5 | C-1, C-2, C-3 | IN-1, IN-2 | — | T-… | `scripts/warpos/preflight.js` | unit | 0.7.0 | LRN |
| GPT-5.5 review | R-3 | S-6 | C-6 | IN-3 | — | T-… | `update.js#classifier`, `paths.registry.json` | replay-bench | 0.7.0 | LRN |
| GPT-5.5 review | R-4 | S-7, S-8 | C-5 | — | — | T-… | `generate-framework-manifest.js`, `applied-migrations.js`, `migrations-loader.js` | replay-bench | 0.7.0 | LRN |
| GPT-5.5 review | R-5 | S-9 | C-4, C-6 | — | — | T-… | `lib/logger.js` callers | unit | 0.7.0 | LRN |
| GPT-5.5 review | R-6, R-7 | S-10 | C-7 | — | — | T-… | replay-bench, `_docs/sprint/UPDATE_PIPELINE.md` | replay-bench | 0.7.0 | LRN |

## TR-1 — `content-hash-mismatch`

**Event kind:** `content-hash-mismatch`
**When:** During `update.js` classification, when content-hash matches but raw-hash differs.
**Captured fields:** `{path, content_hash, raw_hash, kind: "lf_only" | "real_drift", txId}`
**Linked requirement:** `R-5`
**Linked story:** `S-9`
**Why we capture this:** Lets us measure how prevalent LF-only mismatches are post-fix; if the count stays high, the classifier is wrong somewhere. `real_drift` fires when raw differs AND content differs — that's the legitimate change.

## TR-2 — `operator-override-used`

**Event kind:** `operator-override-used`
**When:** During preflight, when a gate is bypassed by `--operator-override`.
**Captured fields:** `{gate, reason, operator, ts, txId, gate_state_before: "red" | "yellow"}`
**Linked requirement:** `R-2`, `R-5`
**Linked story:** `S-5`, `S-9`
**Why we capture this:** Audit trail — answers "who bypassed what, when, why". Required because the override is the only escape hatch.

## TR-3 — `ownership-transitioned`

**Event kind:** `ownership-transitioned`
**When:** During `update.js` classification, when a `framework_template` path is promoted to `project_owned` because of a non-whitespace consumer edit.
**Captured fields:** `{path, from: "framework_template", to: "project_owned", reason: "consumer_edit_detected", txId, ts}`
**Linked requirement:** `R-3`, `R-5`
**Linked story:** `S-6`, `S-9`
**Why we capture this:** Records when the framework no longer "owns" a path. Needed to explain later "why didn't this file get cleaned up by the framework restructure?" — the audit is the answer.
