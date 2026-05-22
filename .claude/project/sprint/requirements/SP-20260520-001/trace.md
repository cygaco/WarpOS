# TRACE Requirements — `/product:clone`

**Sprint:** `SP-20260520-001`
**PRD:** `.claude/project/sprint/requirements/SP-20260520-001/prd.md`

> TRACE captures observability and provenance. Each event flows through `logger.js` to `paths.eventsFile` (fail-open — never block the user-facing flow on a logging failure). No raw scraped text in events; only metadata. Downstream `/check:patterns`, `/check:timeline`, and `/events:query` consume these.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code/File | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| User request 2026-05-20 | R-1 | S-1 | C-1, C-2 | IN-1…IN-8 | — | T-…(S-1) | `scripts/product/clone.js` (CLI parse) | `tests/regression/SP-20260520-001/cli.test.js` | sprint-close | "CLI flag surface should match bootstrap conventions" |
| User request 2026-05-20 | R-2 | S-2 | C-3 | IN-1, IN-3 | WebSearch | T-…(S-2) | `scripts/product/clone.js` (identify pass) | `tests/regression/SP-20260520-001/identify.test.js` | sprint-close | — |
| User request 2026-05-20 | R-3 | S-3 | C-3, C-7 | IN-2, IN-6 | WebFetch | T-…(S-3) | `scripts/product/clone.js` (discover pass) | `tests/regression/SP-20260520-001/discover.test.js` | sprint-close | "One-level cap is a load-bearing guardrail" |
| User request 2026-05-20 | R-4 | S-4 | C-3, C-6 | IN-6 | WebSearch, WebFetch | T-…(S-4) | `scripts/product/clone.js` (reviews pass) | `tests/regression/SP-20260520-001/reviews.test.js` | sprint-close | — |
| Plan Contract D-6 | R-5 | S-5 | — | IN-7 | — | T-…(S-5) | `scripts/product/clone.js` (cache) | `tests/regression/SP-20260520-001/cache.test.js` | sprint-close | "Raw cache enables zero-cost audit" |
| User request 2026-05-20 | R-5 | S-6 | C-4 | — | — | T-…(S-6) | `scripts/product/clone.js` (extract: JTBDs) | `tests/regression/SP-20260520-001/extract-jtbds.test.js` | sprint-close | — |
| User request 2026-05-20 | R-5, R-6 | S-7 | C-4 | — | — | T-…(S-7) | `scripts/product/clone.js` (extract: features) | `tests/regression/SP-20260520-001/extract-features.test.js` | sprint-close | "LLM scoring stability for S/M/L/XL: validate cross-run" |
| User request 2026-05-20 | R-5, R-6 | S-8 | C-4, C-11 | — | — | T-…(S-8) | `scripts/product/clone.js` (extract: voc) | `tests/regression/SP-20260520-001/extract-voc.test.js` | sprint-close | "Hallucinated-quote risk: enforce post-extraction presence check" |
| User request 2026-05-20 | R-5 | S-9 | C-4 | — | — | T-…(S-9) | `scripts/product/clone.js` (extract: gaps) | `tests/regression/SP-20260520-001/extract-gaps.test.js` | sprint-close | — |
| User request 2026-05-20 | R-5 | S-10 | C-4 | — | — | T-…(S-10) | `scripts/product/clone.js` (extract: opportunities) | `tests/regression/SP-20260520-001/extract-opportunities.test.js` | sprint-close | — |
| Plan Contract D-2 | R-7 | S-11 | C-8, C-9 | IN-4 | pandoc (soft) | T-…(S-11) | `scripts/product/clone.js` (emit) + `framework/templates/product-clone/` | `tests/regression/SP-20260520-001/emit.test.js` | sprint-close | — |
| Plan Contract assumption | R-8 | S-12 | C-12 | — | — | T-…(S-12) | `scripts/product/clone.js` (paths register) + `.claude/paths.json` | `tests/regression/SP-20260520-001/paths.test.js` | sprint-close | "First-emit registration pattern (bootstrap precedent)" |
| Plan Contract granular[12] | R-9 | S-13 | — | — | — | T-…(S-13) | `scripts/product/clone.js` (logger calls) | `tests/regression/SP-20260520-001/events.test.js` | sprint-close | — |
| Plan Contract granular[13] | R-10, R-11 | S-14 | C-6, C-11 | IN-8 | — | T-…(S-14) | `scripts/product/clone.js` (gap markers + strict gate) | `tests/regression/SP-20260520-001/partial.test.js` | sprint-close | "Permissive-by-default; strict mode for CI/audit" |

## TR-1 — `clone_started`

**Event:** `clone_started`
**When:** Once per run, immediately after CLI parse + validation succeeds, before any network calls.
**Captured fields:** `id` (run uuid), `ts` (ISO), `slug`, `mode` (`permissive` | `strict`), `inputs` (which of name/url/video were provided, NOT the values themselves), `max_review_sources`, `cache_enabled`.
**Linked requirement:** `R-1`, `R-9`.
**Linked story:** `S-1`, `S-13`.
**Why we capture this:** First event of a run; lets `/check:timeline` reconstruct what triggered the run without needing access to the operator's shell history. Inputs are recorded as shape (which flags), not content (the URL itself), so the event log is shareable without exposing target identity if the operator wants.

## TR-2 — `product_identified`

**Event:** `product_identified`
**When:** Once per run, after the WebSearch identification pass resolves the canonical product URL (S-2). Skipped (not emitted) when `--url` was provided directly.
**Captured fields:** `id` (same as `clone_started`), `ts`, `resolved_url`, `resolved_via` (`websearch` | `direct_input`), `confidence` (LLM-reported, 0-1).
**Linked requirement:** `R-2`, `R-9`.
**Linked story:** `S-2`, `S-13`.
**Why we capture this:** When something downstream goes wrong (wrong product analyzed), the operator needs to know whether identification went off-rails — that's a different bug class than "extraction returned junk."

## TR-3 — `urls_discovered`

**Event:** `urls_discovered`
**When:** Once per run, after the one-level discovery pass completes (S-3).
**Captured fields:** `id`, `ts`, `seed_url`, `discovered_count`, `kept_count` (after cap), `urls` (list, capped), `categories` (e.g. `{"pricing": 1, "docs": 2, "blog": 3}`).
**Linked requirement:** `R-3`, `R-9`.
**Linked story:** `S-3`, `S-13`.
**Why we capture this:** Discovery quality predicts extraction quality. If `discovered_count` is consistently low for some host class, the discovery regex needs tuning — this event surfaces the signal.

## TR-4 — `source_fetched` and `source_failed`

**Event:** `source_fetched` (success) or `source_failed` (failure)
**When:** One per WebFetch attempt (S-3, S-4). Includes both product-site fetches and review-site fetches.
**Captured fields (success):** `id`, `ts`, `url`, `source_class` (`product` | `review`), `http_status`, `bytes`, `duration_ms`, `retrieved_at` (matches what gets written to the cache `meta.json`).
**Captured fields (failure):** `id`, `ts`, `url`, `source_class`, `failure_reason` (`http_<status>` | `timeout` | `tos_block` | `network_error`), `attempt` (1 or 2 — we retry once on 429).
**Linked requirement:** `R-2`, `R-4`, `R-9`, `R-10`.
**Linked story:** `S-3`, `S-4`, `S-13`, `S-14`.
**Why we capture this:** Failure mode is the most operationally-relevant signal — if review-site fetches systematically 429, the review source list needs to be re-prioritized or operator needs to know a target site is hostile to crawling. Permissive-mode runs depend on this to render `[GAP]` correctly.

## TR-5 — `attribution_stripped`

**Event:** `attribution_stripped`
**When:** When the post-extraction presence check (S-8) finds a quote that does not appear in any cached source. The quote is stripped from the deliverable and this event fires.
**Captured fields:** `id`, `ts`, `extraction_pass` (always `voc` for v1; could include `features` later), `stripped_count`, `kept_count`, `sample_stripped` (first 80 chars of one stripped quote, for debugging).
**Linked requirement:** `R-6`, `R-9`.
**Linked story:** `S-8`, `S-13`.
**Why we capture this:** Hallucinated quotes are the highest-impact failure mode (a fabricated quote becomes engineering effort wasted on a non-real signal). If `stripped_count` is consistently high, the LLM prompt for `voc` extraction needs tightening. Sample-of-one provides a debug breadcrumb without flooding the event log.

## TR-6 — `extraction_completed`

**Event:** `extraction_completed`
**When:** Once per extraction pass — fires after S-6, S-7, S-8, S-9, S-10 (one event each).
**Captured fields:** `id`, `ts`, `pass` (`jtbds` | `features` | `voc` | `gaps` | `opportunities`), `result_count`, `tokens_in` (approximate), `tokens_out`, `duration_ms`.
**Linked requirement:** `R-5`, `R-9`.
**Linked story:** `S-6`, `S-7`, `S-8`, `S-9`, `S-10`, `S-13`.
**Why we capture this:** Cost surface (tokens) and quality surface (result_count) per pass. `/check:patterns` can detect "voc pass returns 0 in 30% of runs" and surface it as a recurring issue.

## TR-7 — `clone_emitted`

**Event:** `clone_emitted`
**When:** Once per run, at the end, after all files written and paths registered.
**Captured fields:** `id`, `ts`, `output_dir`, `files` (list with sizes), `pandoc_used` (bool), `paths_registered` (`["paths.clones", "paths.clonesCurrent"]` first run, `["paths.clonesCurrent"]` subsequent), `gap_count` (total `[GAP]` markers in emitted MD), `duration_ms_total`.
**Linked requirement:** `R-7`, `R-8`, `R-9`.
**Linked story:** `S-11`, `S-12`, `S-13`.
**Why we capture this:** Closes the loop — the success/failure of the run is observable as a single event with all the metadata a future report or dashboard would need. `gap_count` is the headline quality metric (low = good run; high = many sources failed).
