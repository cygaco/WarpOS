# PRD — `/product:clone` — Competitor-product intel skill emitting cloneable JTBDs, scored features, voc, gaps, opportunities

**Sprint:** `SP-20260520-001`
**Plan Contract:** `PC-20260521-0017`
**Status:** designed
**Documentation scale:** `m`

## Outcome

An operator targeting a competitor runs one skill — `/product:clone --name <name> --url <url> [--video <url>]` — and within a single bounded invocation receives a research-grade competitive analysis under `_docs/clones/<slug>/`. The deliverable is concrete enough to be the primary input for `/product:bootstrap` or `/sprint:plan` on a competing build, so "what does this product even do" collapses from days of manual research to one skill run.

## Context

### Original Request

> /sprint:plan --turbo a `product:clone` skill that intakes information about a product, explores the product, and creates high-level requirements that can be used to clone it. Sources: videos about the product, the product's own website (one-level link discovery), reviews and adjacent material (G2, ProductHunt, Reddit, HN, Twitter, blogs). Deliverables: JTBDs, scored feature list (build-complexity + how-core), voice-of-customer with quote+source attribution, gaps, capitalize-able opportunities. Goal: enable rapid deployment of clones/competing products against companies the operator wants to kill — output detailed enough to feed directly into /product:bootstrap or /sprint:plan.

### Interpreted Intent

Create a new skill `/product:clone` under `.claude/commands/product/` that ingests intake about a competitor's product (URL, video, name) and emits a competitive-clone deliverable set under `_docs/clones/<slug>/` — JTBDs, scored feature list (build-complexity S/M/L/XL + how-core 1-5), voice-of-customer with quote attribution, gaps, opportunities. The skill mirrors `/product:bootstrap`'s generator architecture (skill spec + `scripts/product/clone.js` + `framework/templates/product-clone/` + paths registration). Output is detailed enough to feed directly into `/product:bootstrap` or `/sprint:plan` for a competing build.

### Current Behavior

Two `product:*` skills exist: `ponder.md` (exploratory reflection) and `bootstrap.md` (interactive single-product brief). Neither addresses competitor intel. `/product:bootstrap` is single-product and interviews the operator — it does not crawl external sources. There is no skill for ingesting outside product information or producing competitive analysis. Without `/product:clone`, an operator who wants to clone or counter-position against a competitor must do all the WebFetch/WebSearch coordination, source attribution, scoring, and synthesis by hand across an unbounded number of turns.

### Desired Behavior

Operator runs `/product:clone --name <product-name> --url <product-url> [--video <video-url>]`. The skill:

1. **Identifies the product** — web-searching when only a video or name is given to find the authoritative product URL.
2. **Discovers crawlable URLs** — one level deep from the product website, prioritizing pricing/docs/blog/about/features/changelog paths.
3. **Attempts 2-3 review sources** — G2, ProductHunt, Reddit, HN, Twitter, blog posts. Skill tries each, records what worked, and continues on partial failure.
4. **Emits a deliverable set** under `_docs/clones/<slug>/`: MD always, HTML always, DOCX when pandoc is present. Contents:
   - **JTBDs** (3-5) with one-line rationale each
   - **Feature list** with S/M/L/XL build-complexity + 1-5 core-ness scores, with rationale rows
   - **Voice-of-customer** quotes with source URL + retrieval timestamp (every quote traceable)
   - **Gaps** (3-7 named, with severity)
   - **Opportunities** (3-5 capitalize-able hooks for a competing build)
5. **Registers paths** — first emit adds `paths.clones` and `paths.clonesCurrent` to `.claude/paths.json` so downstream skills can find the deliverable.
6. **Emits telemetry** — `clone_started`, `product_identified`, `urls_discovered`, `source_fetched`, `source_failed`, `extraction_completed`, `clone_emitted` to `paths.eventsFile` (fail-open).
7. **Degrades gracefully** — partial-deliverable mode marks failed sources with `[GAP — <source> — <reason>]` and continues, rather than aborting the whole run.

Output is detailed enough that `/product:bootstrap` or `/sprint:plan` can ingest it as primary input for a competing build.

## Requirements

> Uses the `R-N` id convention enforced by `scripts/hooks/requirement-format-guard.js`.

- **`R-1` — Skill CLI surface.** `/product:clone` (spec at `.claude/commands/product/clone.md`) accepts `--name`, `--url`, `--video`, `--output-dir`, `--slug`, `--max-review-sources`, `--no-cache`, `--strict`, `--help`. At least one of `--name`, `--url`, `--video` is required. Slug is derived from `--slug`, else normalized from `--name`, else derived from the URL hostname. Exit codes mirror `/product:bootstrap`: `0` success (incl. partial), `2` invalid input, `3` no usable sources found, `4` output dir not writable, `5` strict-mode partial failure.

- **`R-2` — Multi-source intel ingestion.** Skill calls `WebFetch` for product URL + discovered links, `WebSearch` for product identification + review-source discovery, and (optionally) a video-transcript path when `--video` is supplied and `yt-dlp` is detected on PATH. Each source class has a defined timeout and failure mode. WebFetch/WebSearch are deferred harness tools; the skill body fetches their schemas via `ToolSearch` at runtime.

- **`R-3` — One-level link discovery.** Starting from the product URL, the skill discovers internal links and crawls at most one level (i.e. URLs reachable in one hop from the root). Prioritization order: pricing, features, docs, about, blog, changelog, customers. Cap: `--max-review-sources` (default `8`) total fetched URLs across the product site (separate budget from review sources). Out-of-scope: external links, deep crawling, sitemap walks.

- **`R-4` — Review-source collection.** Skill queries WebSearch for `"<product-name>" review site:<host>` against a fixed list (G2, ProductHunt, Reddit, HN, Twitter, dev.to, blog aggregators) and collects up to `--max-review-sources` (default `3`) distinct review-source URLs. Each is fetched via WebFetch with retry-once-on-429 and source-attribution capture (URL + retrieved-at ISO timestamp + HTTP status).

- **`R-5` — Extraction pipeline (LLM passes).** The skill runs five extraction passes against the aggregated retrieved text, in order: JTBDs (3-5 with rationale) → feature list (table: name, description, build-complexity S/M/L/XL, core-ness 1-5, evidence-source url) → voice-of-customer (table: quote, sentiment, source-url, retrieved-at) → gaps (3-7 with severity low/med/high) → opportunities (3-5 capitalize-able hooks). Each pass receives only the cached/aggregated source text and MUST attribute every quote to a specific source URL in the input set. Hallucinated quotes (those not present in retrieved text) are a sprint-blocking bug — the skill enforces a quote-presence check post-extraction.

- **`R-6` — Source-attribution rigor.** Every voc quote in the emitted deliverable carries `[source: <url>, retrieved: <ISO-8601>]`. Every feature row carries an evidence-source URL pointing at retrieved text that mentions the feature. Quotes or features without attribution are stripped pre-emit (and the strip is logged to events as `attribution_stripped`). Auditability is the design goal — operator must be able to verify any claim by clicking through.

- **`R-7` — Output emission.** Skill writes `_docs/clones/<slug>/<slug>.clone.md` (always), `<slug>.clone.html` (always), and `<slug>.clone.docx` (when `pandoc` is on PATH, else skip with `copy.md#C-9`). Section headings align with `/product:bootstrap` family conventions: `## 01 — Product Identity`, `## 02 — Jobs to be Done`, `## 03 — Feature List`, `## 04 — Voice of Customer`, `## 05 — Gaps`, `## 06 — Opportunities`, `## 07 — Source Attribution Log`. Downstream `/product:bootstrap` and `/sprint:plan` can ingest by stable headings.

- **`R-8` — Paths registration on first emit.** First successful emit adds `paths.clones` (resolves to `_docs/clones/`) and `paths.clonesCurrent` (resolves to `_docs/clones/<slug>/`) to `.claude/paths.json`. Subsequent runs update `paths.clonesCurrent` only. Idempotent across runs for the same slug (re-run policy: version into `_docs/clones/<slug>/history/<ISO>/` by default, matching bootstrap precedent).

- **`R-9` — Telemetry events.** Emits the following to `paths.eventsFile` via `logger.js` (fail-open): `clone_started` (once per run after CLI parse), `product_identified` (once, after name+URL resolved), `urls_discovered` (once, with count + list), `source_fetched` (one per successful fetch, with url + status + bytes), `source_failed` (one per failure, with url + reason), `extraction_completed` (one per extraction pass: jtbds/features/voc/gaps/opportunities), `clone_emitted` (once at end, with output file paths). No raw scraped text in events; only metadata.

- **`R-10` — Partial-deliverable mode.** When a source fails (404/429/timeout/ToS-block), the run does NOT abort by default. The deliverable section that depended on the failed source renders `[GAP — <source-class> — <reason>]` inline and the operator sees `copy.md#C-6` warning. Under `--strict`, failures abort with exit `5`. Default mode is permissive.

- **`R-11` — Anti-spider guardrails.** The skill defaults to one-level link discovery with no recursion. There is no flag to enable multi-level crawling in v1. WebFetch respects rate limits with retry-once-on-429 (then mark `source_failed`) and never bypasses robots.txt or auth walls. The skill prints `copy.md#C-7` if it would exceed the one-level boundary, then stops crawling and proceeds with what it has.

## Design decisions (resolved)

These were flagged in the Plan Contract as `needs_user_or_beta_review` or as scope decisions. Resolved here per the recommended scope variant.

- **D-1 — Namespace: `/product:clone` confirmed.** The Plan Contract flagged this as ambiguous (`/product:clone` vs `/research:clone` vs `/intel:product`). The `product:*` namespace already hosts the two sibling skills (`bootstrap`, `ponder`) and the new skill produces output that feeds `/product:bootstrap`. Keeping it in `product:*` makes the hand-off discoverable in the same skill family. Reversal cost: low — move skill file + update one paths entry.

- **D-2 — Output schema: align with `/product:bootstrap` MD section headings so downstream handoff works.** The Plan Contract flagged this as blocking. Resolved: clone output uses `## 01 — Product Identity` through `## 07 — Source Attribution Log`, structurally parallel to bootstrap's `## 01 — Problem` through `## 08 — MVP`. Each section ends with a `<!-- bootstrap-feed: <section-id> -->` HTML comment so a future `/product:bootstrap --from-clone` invocation can map sections without ambiguity. This matches the `safe` assumption in the PC and removes the need for a transform step at the handoff.

- **D-3 — Video input deferred to v2 by default; auto-detect when `yt-dlp` on PATH.** The Plan Contract flagged video as a possible ESD and the `expanded` scope variant. Resolved (recommended scope): v1 ships with `--video` accepting a URL, but only attempts transcript ingestion when `yt-dlp` is detected on PATH. If absent, the skill prints `copy.md#C-10` ("video transcript unavailable — falling back to web search for the video title") and continues using just the title in the WebSearch enrichment pass. No new hard dependency on `yt-dlp`. Reversal cost: low — promotion to `expanded` is a future sprint with an ESD record.

- **D-4 — Default interactivity: autonomous (no AskUserQuestion loop).** The Plan Contract flagged interactive-vs-autonomous as `needs_user_or_beta_review`. Resolved: `/product:clone` is autonomous (intake → emit) by default to match the "rapid deployment" outcome and the `--turbo` framing in the original request. An interactive mode can be a future flag (`--interactive`) but ships disabled. Bootstrap is interactive by design (the operator IS the data source); clone is autonomous by design (the web IS the data source).

- **D-5 — Crawl aggressiveness: one level, no flag to deepen in v1.** Plan Contract flagged crawl depth as `needs_user_or_beta_review`. Resolved per the `non_goals[2]` line ("the project must not become a spider"): one-level discovery is the v1 cap, no flag to override. Re-runs against the same slug build a richer cache, so depth is approximated by repeat invocations against an evolving target rather than recursion in a single run.

- **D-6 — ToS posture: documented in skill spec, operator-responsible.** Plan Contract flagged this as `needs_user_or_beta_review`. Resolved: skill spec includes a "Use Only With Public Sources You Have Rights To Read" disclaimer block; skill does not enforce any specific ToS check (out of v1 scope). Operator is responsible for the legal posture of running against a given target. Captured as enforcement debt under `/enforcement:log` for a future "robots.txt + ToS pre-flight" pass.

## Affected Surfaces

| Surface | Evidence | Disposition |
|---|---|---|
| `.claude/commands/product/clone.md` | assumed_from_request | new skill spec — created |
| `.claude/commands/product/` namespace (ponder.md, bootstrap.md) | verified_from_repo | unchanged; new sibling joins |
| `scripts/product/bootstrap.js` (generator pattern reference) | verified_from_repo | unchanged; cloned for architecture |
| `scripts/product/clone.js` | inferred_from_repo | new generator — created |
| `framework/templates/product-clone/` | inferred_from_repo | new templates dir (sections.json, clone.md.tmpl, clone.html.tmpl) |
| `_docs/clones/<slug>/` | assumed_from_request | new output dir (created lazily on first emit) |
| `.claude/paths.json` | inferred_from_repo | adds `paths.clones` + `paths.clonesCurrent` on first emit |
| `WebFetch` / `WebSearch` (harness deferred tools) | verified_from_repo | consumed via `ToolSearch` at runtime |
| `yt-dlp` (optional, video transcript) | unknown | auto-detected at runtime; not a hard dep |
| `pandoc` (DOCX output) | verified_from_repo | already a soft dep for `/product:bootstrap`; same pattern |
| `paths.eventsFile` | verified_from_repo | new event types appended via `logger.js` (fail-open) |

## Non-Goals

- Do NOT auto-invoke `/sprint:plan` or `/sprint:execute` on the cloned product (Plan Contract `approval_boundaries[0]`).
- Do NOT redistribute scraped review text outside the operator's local `_docs/clones/<slug>/` dir.
- Do NOT support deep-crawl beyond one level by default (the project must not become a spider).
- Do NOT bake in a specific competitor list or attack-target list.
- Do NOT modify `/product:bootstrap` behavior; `/product:clone` is a parallel skill that feeds into it.
- Do NOT add an interactive AskUserQuestion loop in v1 (D-4).
- Do NOT require `yt-dlp` as a hard dependency (D-3).
- Do NOT enforce per-target robots.txt or ToS preflight in v1 (D-6 — logged as enforcement debt).

## External Service Dependencies

- **WebFetch** — harness-provided deferred tool, no signup. Required.
- **WebSearch** — harness-provided deferred tool, no signup. Required.
- **pandoc** — soft dependency for DOCX output. Already established by `/product:bootstrap`. Skip-with-hint if absent.
- **yt-dlp** — optional, auto-detected for `--video` transcript ingestion. Skip-with-fallback if absent (D-3).

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

Per Plan Contract `approval_boundaries`:

- If the skill ever auto-invokes `/sprint:plan` or `/sprint:execute` on the cloned product — out of scope for v1; would require explicit user approval per `CLAUDE.md#Autonomy`.
- Writing to paths outside `_docs/clones/<slug>/` or `.claude/paths.json` — out of scope; would require approval.
- Scraping that exceeds "public, low-rate" (auth, rate-limit defeat, paid bypass) — out of scope; would require approval if reintroduced.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260521-0017.yaml`
- High-level stories: `.claude/project/sprint/requirements/SP-20260520-001/high-level-stories.md`
- Granular stories: `.claude/project/sprint/requirements/SP-20260520-001/granular-stories.md`
- COPY: `.claude/project/sprint/requirements/SP-20260520-001/copy.md`
- INPUTS: `.claude/project/sprint/requirements/SP-20260520-001/inputs.md`
- TRACE: `.claude/project/sprint/requirements/SP-20260520-001/trace.md`
- Acceptance criteria: `.claude/project/sprint/requirements/SP-20260520-001/acceptance-criteria.md`
- QA plan: `.claude/project/sprint/requirements/SP-20260520-001/qa-plan.md`
- Redteam plan: `.claude/project/sprint/requirements/SP-20260520-001/redteam-plan.md`
- Release plan: `.claude/project/sprint/requirements/SP-20260520-001/release-plan.md`
