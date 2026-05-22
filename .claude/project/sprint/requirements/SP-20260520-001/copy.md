# COPY Requirements — `/product:clone`

**Sprint:** `SP-20260520-001`
**PRD:** `.claude/project/sprint/requirements/SP-20260520-001/prd.md`

> COPY captures user-visible text the skill prints to stdout/stderr during a run, plus the heading conventions that show up in the emitted deliverable. Guides for the writer — voice matches CLAUDE.md and `/product:bootstrap` (direct, no-marketing, no emoji unless requested).

## C-1 — Start banner (linked story `S-1`)

**Context:** First line printed after CLI parse + validation succeeds. Tells the operator the skill has started, what target it understood, and what mode (permissive vs `--strict`) is active.

**Text (guide, not literal):**

> /product:clone — target: <name or hostname>
> slug: <slug>  ·  output: _docs/clones/<slug>/  ·  mode: <permissive|strict>  ·  max-review-sources: <n>

**Notes:** No emoji. Single line if it fits, two if not. Matches the dense-meta style of bootstrap's banner.

## C-2 — Help text (linked story `S-1`)

**Context:** Printed when `--help` or `-h` is passed, or when CLI parse fails with exit `2`.

**Text (guide, not literal):**

> /product:clone — competitor-product intel skill
>
> Usage:
>   /product:clone [--name <product>] [--url <url>] [--video <url>] [--slug <slug>]
>                  [--output-dir <path>] [--max-review-sources <n>]
>                  [--no-cache] [--strict] [--help]
>
> At least one of --name, --url, --video is required. Output is written to
> _docs/clones/<slug>/ as MD + HTML (always), DOCX (when pandoc on PATH).
>
> Exit codes: 0 success (may include [GAP] markers), 2 invalid input,
> 3 no usable sources found, 4 output dir not writable, 5 strict-mode partial failure.

**Notes:** Mirrors bootstrap's help block.

## C-3 — Source-discovery progress (linked story `S-2`, `S-3`, `S-4`)

**Context:** Printed during the multi-source ingestion phase. One line per discovery/fetch action. Operator sees the run advancing rather than wondering if it's hung.

**Text (guide, not literal):**

> [identify] WebSearch: "<name>" → <product-url>
> [discover] crawling <product-url> (one-level)
>   ✓ <url-1>   (200, 18.4 KB)
>   ✓ <url-2>   (200,  7.1 KB)
>   ✗ <url-3>   (429 — rate limited, will mark [GAP])
> [reviews]  WebSearch: G2 / ProductHunt / Reddit
>   ✓ <review-url-1>   (200)

**Notes:** Use ✓/✗ for status. Print only one line per fetch. Bytes optional but useful. Keep under 100 chars per line.

## C-4 — Extraction progress (linked stories `S-6`, `S-7`, `S-8`, `S-9`, `S-10`)

**Context:** Printed between extraction passes. Operator sees which pass is running and what was extracted (counts, not bodies).

**Text (guide, not literal):**

> [extract] JTBDs            → 4 found
> [extract] feature list     → 17 features (8 core, 9 adjacent)
> [extract] voice-of-customer → 12 quotes from 5 sources
> [extract] gaps             → 5 gaps (2 high, 2 med, 1 low)
> [extract] opportunities    → 4 opportunities

**Notes:** Counts only. No quotes or feature names in stdout — those land in the file. Operator gets shape, not content.

## C-5 — DOCX skip notice (linked story `S-11`)

**Context:** When pandoc is not on PATH, the skill emits MD + HTML and prints a one-liner explaining why DOCX was skipped. Matches `/product:bootstrap` precedent.

**Text (guide, not literal):**

> note: pandoc not on PATH — skipping DOCX output. Install pandoc to enable.

**Notes:** Lowercase "note:" prefix matches bootstrap. Not a warning — just informational.

## C-6 — Partial-failure marker / warning (linked stories `S-4`, `S-14`)

**Context:** Two places: (a) inline in the emitted MD where a source failed, and (b) a one-line summary printed to stdout at the end of a permissive run with any failures.

**Text (guide, not literal) — inline marker in the MD:**

> [GAP — <source-class> — <reason>: <url>]

Example: `[GAP — reviews — 429 rate-limited: https://g2.com/products/foo/reviews]`

**Text (guide, not literal) — stdout summary line:**

> note: 2 source(s) failed; deliverable includes [GAP] markers. Run with --strict to abort instead.

**Notes:** Inline marker is parseable (constant prefix `[GAP — `) so future automation can detect partial deliverables. Stdout summary appears once per run, never per failure.

## C-7 — One-level boundary stop (linked story `S-3`)

**Context:** When the discovery phase hits the one-level boundary (i.e. would need to recurse to reach more URLs).

**Text (guide, not literal):**

> note: one-level discovery cap reached (<n> URLs queued, <m> beyond cap deferred). Re-run after reviewing to expand.

**Notes:** Tells the operator the cap is by design, not a bug. Hints at the re-run idiom.

## C-8 — Completion summary (linked story `S-11`)

**Context:** Printed last, after all files written and paths registered. Tells the operator exactly where to find the deliverable and what to do next.

**Text (guide, not literal):**

> emitted:
>   _docs/clones/<slug>/<slug>.clone.md
>   _docs/clones/<slug>/<slug>.clone.html
>   _docs/clones/<slug>/<slug>.clone.docx           (pandoc)
>
> paths registered: paths.clones, paths.clonesCurrent
>
> next: /product:bootstrap --from-clone <slug>   or   /sprint:plan "clone <name>"

**Notes:** "next:" line is the bridge to downstream skills. Final character is a newline.

## C-9 — Pandoc auto-detect line in completion summary (linked story `S-11`)

**Context:** Inside C-8, the DOCX line is parenthetical-tagged with the source so the operator sees why DOCX appeared or didn't.

**Text (guide, not literal):**

> _docs/clones/<slug>/<slug>.clone.docx           (pandoc)

Or, when absent:

> _docs/clones/<slug>/<slug>.clone.docx           (skipped — pandoc not on PATH)

**Notes:** Two-state line. Renders inside the C-8 emitted block.

## C-10 — yt-dlp fallback notice (linked story `S-2`)

**Context:** When `--video` is supplied but `yt-dlp` is not on PATH. Tells the operator the skill is still going, but using just the video URL + WebSearch rather than transcript ingestion.

**Text (guide, not literal):**

> note: yt-dlp not on PATH — video transcript unavailable. Falling back to WebSearch on the video title.

**Notes:** Same pattern as the pandoc fallback. Not a failure — just a downgrade.

## C-11 — "No JTBDs found" empty-deliverable warning (linked stories `S-6`, `S-8`, `S-14`)

**Context:** When an extraction pass returns zero results. The deliverable still emits, but the section says `[GAP — extraction — no signal in source material: <list>]` and stdout warns.

**Text (guide, not literal) — inline marker:**

> [GAP — extraction — no signal in source material for <pass-name>: see Source Attribution Log for inputs]

**Text (guide, not literal) — stdout warning:**

> warn: <pass-name> extraction returned 0 results — consider passing more sources via --url or re-running with --no-cache.

**Notes:** "warn:" prefix (vs "note:") because empty extraction is a real signal — either the source material is too thin or the LLM prompt needs tuning. Operator should see it loudly.

## C-12 — Paths-registration confirmation (linked story `S-12`)

**Context:** Printed once, inside the C-8 completion summary block, the first time the skill registers paths.

**Text (guide, not literal):**

> paths registered: paths.clones (_docs/clones/), paths.clonesCurrent (_docs/clones/<slug>/)

On subsequent runs (paths.clones already present):

> paths.clonesCurrent updated → _docs/clones/<slug>/

**Notes:** First-run vs subsequent-run is observably different so the operator knows when bootstrapping is happening.
