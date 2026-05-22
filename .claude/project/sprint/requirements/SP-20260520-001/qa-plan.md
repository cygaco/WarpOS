# QA Plan — `/product:clone`

**Sprint:** `SP-20260520-001`
**PRD:** `.claude/project/sprint/requirements/SP-20260520-001/prd.md`

> Sprint QA plan. Honored by `/sprint:execute` (mid-sprint checks) and `/sprint:release` (final QA gate). Diff-model review on QA is declared in `paths.sprintRouting` (`qa.diff_review: true`).

## Smoke checks

- [ ] **CLI parses with no args** → exits `2`; help text per `C-2` printed to stderr.
- [ ] **CLI parses with only `--url`** against a known-good test fixture (e.g. `https://example.com`) → emits MD + HTML to `_docs/clones/example-com/` with all 7 sections present.
- [ ] **Partial-failure markers appear when WebFetch is mocked to return 429** on any one source → exit `0`, deliverable contains `[GAP — reviews — http_429: <url>]`, stdout shows `C-6` summary.
- [ ] **Paths registration is idempotent across two runs** → after run 1, `.claude/paths.json` contains both `clones` and `clonesCurrent`; after run 2 with different slug, `clones` unchanged, `clonesCurrent` updated.
- [ ] **DOCX present when pandoc is on PATH, absent + `C-5` printed when not** → confirmed by toggling PATH between two runs.
- [ ] **SSRF guardrail blocks `http://127.0.0.1`, `file://...`, `javascript:...`** → all exit `2` with the IN-2 failure message.
- [ ] **Slug validation rejects uppercase, spaces, leading hyphen** → all exit `2` with the IN-5 regex in the error.
- [ ] **TR-1 through TR-7 events fire and contain no scraped text bodies** → tail `paths.eventsFile`; assert payloads contain only metadata.

## Per-story QA

### S-1 (CLI + slug + validation)
- [ ] AC-1.1 verified (no-args → exit 2)
- [ ] AC-1.2 verified (slug derivation from `--name`)
- [ ] AC-1.3 verified (SSRF block)
- [ ] Regression: every flag in `inputs.md` round-trips through the help text in `C-2` — no orphaned flags, no missing ones.

### S-2 (WebSearch product identification)
- [ ] AC-2.1 verified (websearch path emits TR-2)
- [ ] AC-2.2 verified (direct-URL path skips WebSearch, TR-2 still fires with `direct_input`)
- [ ] Regression: identification confidence threshold (if added) — currently advisory only; if a real threshold is wired, gate run on it.

### S-3 (one-level discovery)
- [ ] AC-3.1 verified (all internal links discovered)
- [ ] AC-3.2 verified (cap honored on link-heavy sites)
- [ ] AC-3.3 verified (external links excluded)
- [ ] Regression: discovery prioritization order (pricing/features/docs/about/blog/changelog/customers) — verified by ordering test against a fixture site with all paths.

### S-4 (review-source collection)
- [ ] AC-4.1 verified (≤ max-review-sources, distinct)
- [ ] AC-4.2 verified (retry-once on 429, then fail)
- [ ] AC-4.3 verified (`--max-review-sources 0` → exit 2)
- [ ] Regression: review-host list stays stable — if a host is added/removed, snapshot test flags the change so it lands in trace/copy intentionally.

### S-5 (source caching)
- [ ] AC-5.1 verified (raw + meta.json present)
- [ ] AC-5.2 verified (cache hit on re-run; `--no-cache` invalidates)
- [ ] Regression: cache filenames are SHA-of-URL not URL-encoded — collision-resistant, no FS-illegal chars.

### S-6 (JTBDs)
- [ ] AC-6.1 verified (3-5 bullets)
- [ ] AC-6.2 verified (empty-input → GAP marker)
- [ ] Regression: JTBD bullets are sentences, not feature names — manual review for shape.

### S-7 (feature list)
- [ ] AC-7.1 verified (table columns)
- [ ] AC-7.2 verified (S/M/L/XL + 1-5 enums)
- [ ] AC-7.3 verified (evidence URL in cache)
- [ ] Regression: cross-run scoring stability — re-run twice against same target, diff the `Build-Complexity` column; flag rows that flip more than ±1 step.

### S-8 (voice-of-customer)
- [ ] AC-8.1 verified (table columns)
- [ ] AC-8.2 verified (quote present in cache)
- [ ] AC-8.3 verified (fabricated quote stripped + TR-5 fires)
- [ ] Regression: quote substring match must be whitespace-normalized (cache may have differing whitespace from LLM-rendered quote).

### S-9 (gaps)
- [ ] AC-9.1 verified (3-7 gaps + severity)
- [ ] AC-9.2 verified (empty → GAP marker)
- [ ] Regression: severity distribution is not always `high` — manual sanity check across 3 runs.

### S-10 (opportunities)
- [ ] AC-10.1 verified (3-5 with cross-references)
- [ ] AC-10.2 verified (un-traceable rows stripped)
- [ ] Regression: opportunities cite at least one of (a) a gap from S-9 or (b) a feature row from S-7 — not free-form invention.

### S-11 (emit MD/HTML/DOCX)
- [ ] AC-11.1 verified (MD + HTML always)
- [ ] AC-11.2 verified (DOCX conditional on pandoc)
- [ ] AC-11.3 verified (stable section headings per D-2)
- [ ] Regression: HTML renders in a browser without console errors (smoke).

### S-12 (paths registration)
- [ ] AC-12.1 verified (first emit adds both keys + C-12 prints)
- [ ] AC-12.2 verified (subsequent emit updates clonesCurrent only)
- [ ] Regression: `.claude/paths.json` remains valid JSON after both runs; no trailing-comma corruption.

### S-13 (telemetry)
- [ ] AC-13.1 verified (event presence)
- [ ] AC-13.2 verified (no scraped text bodies)
- [ ] AC-13.3 verified (fail-open when events file unwritable)
- [ ] Regression: event payload schema lint — every event has `id` (uuid) and `ts` (ISO) at minimum.

### S-14 (partial-deliverable mode)
- [ ] AC-14.1 verified (permissive 404 → exit 0 + GAP marker)
- [ ] AC-14.2 verified (`--strict` 404 → exit 5)
- [ ] AC-14.3 verified (all-fail → exit 3 regardless)
- [ ] Regression: `[GAP — ...]` markers in the MD never contain raw HTML or quote text leaked from the failed source — only the metadata triple `(source-class, reason, url)`.

## Cross-cutting QA

- [ ] Lint passes (`scripts/hooks/path-lint.js`, doc linters).
- [ ] Typecheck passes (if any TypeScript was added; v1 is JS).
- [ ] Unit tests pass under `tests/regression/SP-20260520-001/`.
- [ ] Integration test pass: full skill run against `https://example.com` (no real reviews — mocked WebSearch) → green deliverable.
- [ ] No new console errors in the golden path.
- [ ] TRACE events fire as documented in `trace.md` (7 event types).
- [ ] COPY matches `copy.md` — `C-1` through `C-12` strings present in stdout transcripts.
- [ ] INPUTS handle validation per `inputs.md` — every IN-N failure mode exits the correct code.
- [ ] Skill spec at `.claude/commands/product/clone.md` loads without `scripts/hooks/skill-frontmatter-guard.js` complaints.
- [ ] `framework/templates/product-clone/` is on the install manifest (`framework-manifest.json`) — verified by `/check:warpos-structure-parity`.

## External service QA

- [ ] WebFetch + WebSearch are listed as deferred tools in the skill body's `ToolSearch` call; no hardcoded schema assumptions.
- [ ] pandoc absence is handled with `C-5` skip, not an exit failure.
- [ ] yt-dlp absence is handled with `C-10` fallback, not an exit failure.
- [ ] No `secret: true` env-var values appear in any tracked file.
- [ ] Mock WebFetch/WebSearch fixtures live under `tests/regression/SP-20260520-001/fixtures/` and are deterministic.

## Documentation scaling

This plan is the `documentation_scale: m` cut for a `scope: l` sprint with `risk_level: medium`.
