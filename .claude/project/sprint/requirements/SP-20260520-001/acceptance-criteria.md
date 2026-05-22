# Acceptance Criteria — `/product:clone`

**Sprint:** `SP-20260520-001`
**PRD:** `.claude/project/sprint/requirements/SP-20260520-001/prd.md`

> Each AC is a testable statement. The Plan Contract `PC-20260521-0017` does NOT carry a `goal_verification` block, so the executable `verified_by:` gate is a no-op — every AC uses `verified_by: not_applicable — <reason>`.

## S-1 — CLI surface: parse flags, derive slug, validate input

- **AC-1.1:** Given `/product:clone` invoked with no required input flags, when the CLI parses, then it exits `2` and prints the help text from `C-2` to stderr.
  verified_by: not_applicable — manual run + `node scripts/product/clone.js` returns exit `2`; help text matches `C-2`.
- **AC-1.2:** Given `/product:clone --name "Linear" --slug "linear-clone"`, when the CLI parses, then `slug` resolves to `linear-clone` and the C-1 start banner prints `slug: linear-clone`. Given `--name "Linear App"` with no `--slug`, then slug derives to `linear-app` (lowercase + hyphen normalization).
  verified_by: not_applicable — capture stdout and assert against expected slug.
- **AC-1.3:** Given `/product:clone --url "file:///etc/passwd"` or `--url "http://127.0.0.1/"`, when the CLI parses, then it exits `2` with the SSRF-block message per `IN-2.Failure`.
  verified_by: not_applicable — both inputs return exit `2`; error message contains the disallowed-scheme or IP-literal reason.

## S-2 — WebSearch product identification

- **AC-2.1:** Given only `--name "Linear"` (no URL), when the identification pass runs, then `product_identified` (TR-2) fires with a non-empty `resolved_url` and `resolved_via: "websearch"`.
  verified_by: not_applicable — observe TR-2 event in `paths.eventsFile` after a run.
- **AC-2.2:** Given `--url "https://linear.app"` (URL provided directly), when the identification pass runs, then it skips WebSearch and emits TR-2 with `resolved_via: "direct_input"` and `resolved_url == input_url`.
  verified_by: not_applicable — observe TR-2 event; assert `resolved_via`.

## S-3 — One-level URL discovery from product website

- **AC-3.1:** Given `--url "https://example.com"` with internal links to `/pricing`, `/docs`, `/blog`, `/about`, when the discovery pass runs, then all four URLs appear in `urls_discovered` (TR-3) `urls` list and `kept_count >= 4`.
  verified_by: not_applicable — TR-3 event lists the discovered URLs.
- **AC-3.2:** Given a product site whose page links to 50 internal URLs, when discovery runs with default cap, then `kept_count` is at most the hard cap (`8` per the PRD R-3 note) and `discovered_count > kept_count`.
  verified_by: not_applicable — TR-3 event shows cap honored.
- **AC-3.3:** Given a discovered link that points to a different host (external), when discovery runs, then the external link is NOT included in `urls_discovered.urls`.
  verified_by: not_applicable — TR-3 list contains only same-host URLs.

## S-4 — Review-source collection

- **AC-4.1:** Given a product name passed to the reviews pass, when WebSearch is queried for `"<name>" review site:g2.com` (and the other review hosts), then up to `--max-review-sources` (default 3) distinct URLs are collected and fetched.
  verified_by: not_applicable — TR-4 `source_fetched` events with `source_class: "review"` count ≤ `--max-review-sources`.
- **AC-4.2:** Given a review URL that returns 429, when fetched, then the skill retries once; if still 429, fires `source_failed` (TR-4) with `failure_reason: "http_429"` and `attempt: 2`.
  verified_by: not_applicable — mock WebFetch to return 429 twice; observe `source_failed` event with attempt 2.
- **AC-4.3:** Given `--max-review-sources 0`, when the CLI parses, then exit `2` (out of range per IN-6).
  verified_by: not_applicable — exit code check.

## S-5 — Source caching for audit

- **AC-5.1:** Given a successful fetch of URL `<u>`, when the run completes, then `_docs/clones/<slug>/_raw/<sha256(u)>.html` exists with the raw response body, alongside `_raw/<sha256(u)>.meta.json` containing `{url, retrieved_at, http_status}`.
  verified_by: not_applicable — file presence + meta.json content check.
- **AC-5.2:** Given a second run of `/product:clone --slug <same-slug>` (without `--no-cache`), when discovery hits an already-cached URL, then no new WebFetch call is made for that URL and the cached body is reused. With `--no-cache`, the URL IS re-fetched.
  verified_by: not_applicable — `source_fetched` count drops on re-run; `--no-cache` flips it back.

## S-6 — JTBD extraction pass

- **AC-6.1:** Given non-empty aggregated source text, when the JTBD extraction pass runs, then the emitted MD section `## 02 — Jobs to be Done` contains 3-5 bullets, each one sentence + rationale.
  verified_by: not_applicable — read emitted MD; count bullets.
- **AC-6.2:** Given an empty source aggregate (all fetches failed), when the pass runs, then the section emits `[GAP — extraction — no signal in source material for jtbds: see Source Attribution Log for inputs]` per `C-11` and `extraction_completed` (TR-6) fires with `result_count: 0`.
  verified_by: not_applicable — mock all fetches to fail; assert GAP marker and TR-6 event.

## S-7 — Feature list with scoring

- **AC-7.1:** Given non-empty aggregated source text, when the feature extraction pass runs, then the emitted MD section `## 03 — Feature List` contains a table with columns `Name | Description | Build-Complexity | Core-ness | Evidence`.
  verified_by: not_applicable — markdown table column header check.
- **AC-7.2:** Given the feature table, when I read each row, then `Build-Complexity` is one of `{S, M, L, XL}` and `Core-ness` is in `{1, 2, 3, 4, 5}`. Rows violating either are stripped pre-emit (events `attribution_stripped` fires).
  verified_by: not_applicable — per-row regex check; TR-5 event for any strip.
- **AC-7.3:** Given the feature table, when I read each row, then `Evidence` is a URL present in the run's cached source set. Rows with no evidence URL are stripped per R-6.
  verified_by: not_applicable — cross-reference evidence URLs against `_raw/` cache contents.

## S-8 — Voice-of-customer extraction with quote attribution

- **AC-8.1:** Given review sources fetched and cached, when the voc extraction pass runs, then the emitted MD section `## 04 — Voice of Customer` contains a table with columns `Quote | Sentiment | Source | Retrieved`.
  verified_by: not_applicable — markdown table column header check.
- **AC-8.2:** Given the voc table, when I pick any quote and grep the corresponding `_raw/<sha>.html` cache file, then the quote text appears in the cached source (substring match, normalized whitespace).
  verified_by: not_applicable — per-row substring check; fail if any quote not found in its declared source cache.
- **AC-8.3:** Given the voc extraction returns a quote NOT present in any cached source, when the post-extraction presence check runs, then the quote is stripped, `attribution_stripped` (TR-5) fires with `stripped_count >= 1`, and the emitted table does NOT contain the fabricated quote.
  verified_by: not_applicable — inject a fabricated quote via mocked LLM output; assert TR-5 event + absence in output.

## S-9 — Gaps extraction

- **AC-9.1:** Given non-empty aggregated source text (reviews + product pages), when the gaps extraction pass runs, then the emitted MD section `## 05 — Gaps` contains 3-7 named gaps, each with `severity` in `{low, med, high}`.
  verified_by: not_applicable — count + per-row severity validation.
- **AC-9.2:** Given the gaps pass returns 0 results, when the section emits, then `[GAP — extraction — no signal …]` marker appears and `extraction_completed` (TR-6) fires with `result_count: 0`.
  verified_by: not_applicable — same pattern as AC-6.2.

## S-10 — Opportunities extraction

- **AC-10.1:** Given the gaps section and the feature list are populated, when the opportunities pass runs, then the emitted MD section `## 06 — Opportunities` contains 3-5 capitalize-able opportunities, each referencing at least one gap or feature row from the prior sections.
  verified_by: not_applicable — manual review of opportunities cross-references.
- **AC-10.2:** Given an opportunity row with no traceable basis in gaps/features, when post-extraction validation runs, then the row is stripped per R-6 (consistency with feature/voc attribution discipline).
  verified_by: not_applicable — per-row traceability check.

## S-11 — Output emission: MD + HTML always, DOCX when pandoc

- **AC-11.1:** Given any successful run, when the emit phase completes, then `_docs/clones/<slug>/<slug>.clone.md` and `_docs/clones/<slug>/<slug>.clone.html` both exist and are non-empty.
  verified_by: not_applicable — `fs.existsSync` + `statSync.size > 0` checks.
- **AC-11.2:** Given pandoc is on PATH, when the emit phase completes, then `_docs/clones/<slug>/<slug>.clone.docx` exists. Given pandoc is NOT on PATH, the DOCX file is absent and `C-5` was printed to stderr/stdout.
  verified_by: not_applicable — file existence vs absence; stdout match.
- **AC-11.3:** Given the emitted MD, when I read the section headings, then they are exactly `## 01 — Product Identity`, `## 02 — Jobs to be Done`, `## 03 — Feature List`, `## 04 — Voice of Customer`, `## 05 — Gaps`, `## 06 — Opportunities`, `## 07 — Source Attribution Log`.
  verified_by: not_applicable — heading regex match per D-2.

## S-12 — Paths registration on first emit

- **AC-12.1:** Given a fresh repo with no `paths.clones` in `.claude/paths.json`, when the first `/product:clone` run completes, then `.claude/paths.json` contains `clones` (= `_docs/clones/`) and `clonesCurrent` (= `_docs/clones/<slug>/`), and `C-12` "paths registered" line was printed.
  verified_by: not_applicable — JSON inspection + stdout match.
- **AC-12.2:** Given a second run with a different `--slug`, when emit completes, then `paths.clones` is unchanged and `paths.clonesCurrent` is updated to the new slug's dir; `C-12` prints the "paths.clonesCurrent updated" variant.
  verified_by: not_applicable — JSON inspection across two runs.

## S-13 — Telemetry events

- **AC-13.1:** Given a successful run, when I tail `paths.eventsFile`, then I see exactly one each of `clone_started` (TR-1), `urls_discovered` (TR-3), `clone_emitted` (TR-7), and at least one of `source_fetched` (TR-4) and `extraction_completed` (TR-6).
  verified_by: not_applicable — `jq` filter on events file.
- **AC-13.2:** Given any event, when I read its payload, then no raw scraped HTML/text body appears — only metadata (url, status, bytes, counts, durations).
  verified_by: not_applicable — payload schema check; reject events with `body`/`html`/`text` fields containing source content.
- **AC-13.3:** Given a run where the events file is read-only or missing, when the skill tries to emit events, then the run completes normally (fail-open) and a single stderr warning is printed once per run.
  verified_by: not_applicable — chmod the events file read-only; observe successful run + single warning.

## S-14 — Partial-deliverable mode

- **AC-14.1:** Given default (permissive) mode and one review source returns 404, when the emit completes, then exit code is `0`, the deliverable contains `[GAP — reviews — http_404: <url>]` inline, and the stdout summary line per `C-6` is printed.
  verified_by: not_applicable — mock one fetch to 404; assert exit code, marker presence, stdout line.
- **AC-14.2:** Given `--strict` and the same 404, when the run encounters the failure, then it aborts with exit `5` and prints a strict-mode failure message; no partial deliverable is emitted.
  verified_by: not_applicable — assert exit `5`; assert no MD file written.
- **AC-14.3:** Given all sources fail (product URL + every review URL), when the run reaches the extraction phase, then the run aborts with exit `3` ("no usable sources found") regardless of `--strict`, because permissive mode cannot rescue a totally empty input.
  verified_by: not_applicable — mock all fetches to fail; assert exit `3`.
