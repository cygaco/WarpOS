---
description: Competitor-product intel skill — JTBDs, scored feature list, voice-of-customer, gaps, opportunities. One skill run replaces days of manual competitive research.
---

# /portfolio:clone — Competitor Product Clone Brief

`/portfolio:clone` — Targets a competitor's product (by name, URL, or video) and emits a competitive-clone deliverable detailed enough to feed directly into `/portfolio:bootstrap` or `/sprint:plan` for a competing build.

Walks the operator-supplied target through multi-source intel ingestion (product website one-level discovery, review-source collection across G2/ProductHunt/Reddit/HN/blogs, optional video transcript), then runs five LLM extraction passes — JTBDs, feature list with S/M/L/XL build-complexity + 1-5 core-ness, voice-of-customer with quote attribution, gaps with severity, and capitalize-able opportunities. Emits MD + HTML (always) and DOCX (when pandoc is installed) to `_docs/clones/<slug>/`.

Use only with public sources you have rights to read. The skill does not bypass robots.txt, auth walls, or rate limits, and does not redistribute scraped review text outside the operator's local `_docs/clones/<slug>/` directory.

Usage:

```
/portfolio:clone [--name <product>] [--url <url>] [--video <url>] [--slug <slug>]
               [--output-dir <path>] [--max-review-sources <n>]
               [--no-cache] [--strict] [--help]
```

At least one of `--name`, `--url`, `--video` is required.

## Input

`$ARGUMENTS` — any combination of the CLI flags above. Slug is derived from `--slug`, else from a normalized `--name`, else from the URL hostname.

## When to use this

- A new project where the operator wants to clone, counter-position, or kill a known competitor and needs a written competitive brief in minutes, not days.
- Pre-`/portfolio:bootstrap` when you want bootstrap to have real competitive grounding (run clone first, then `/portfolio:bootstrap --from-clone <slug>`).
- Pre-`/sprint:plan` when the sprint is "build a competitor to X" and the plan needs feature scoping + voc evidence.
- Re-running periodically against the same `--slug` to track how a competitor's surface area changes (cache + history are by design).

## What it does

1. **Validate inputs** — Slug regex (`^[a-z0-9][a-z0-9-]{0,63}$`), URL scheme is `http`/`https`, hostname is not an IP literal / loopback / private / link-local (SSRF guardrail, redteam SCENARIO-1). Reject `file://`, `javascript:`, `data:` schemes.
2. **Identify the product** — When only `--video` or `--name` is supplied, run `WebSearch` to find the canonical product URL. Skip search when `--url` is supplied directly. Emit `product_identified` (TR-2) with `resolved_via`.
3. **Discover URLs** — From the product URL, do **one-level** internal-link discovery prioritizing `/pricing`, `/features`, `/docs`, `/about`, `/blog`, `/changelog`, `/customers`. Hard cap at 8 internal URLs per run, same-host only — no recursion. Emit `urls_discovered` (TR-3).
4. **Collect review sources** — For each review host (G2, ProductHunt, Reddit, HN, Twitter/X, dev.to, Medium), query `WebSearch` for `"<name>" review site:<host>` and collect up to `--max-review-sources` (default 3) distinct URLs. Fetch via `WebFetch` with retry-once-on-429.
5. **Cache** — Every fetched body is cached to `_docs/clones/<slug>/_raw/<sha256(url)>.html` with `<sha>.meta.json` (`{url, retrieved_at, http_status, bytes}`). Re-runs without `--no-cache` skip re-fetching.
6. **Extract** — Five LLM passes against the aggregated cached text, in order: JTBDs → feature list → voice-of-customer → gaps → opportunities. Each pass emits `extraction_completed` (TR-6) with `result_count`.
7. **Presence-check voc** — Every quote in voc must appear (whitespace-normalized substring match) in at least one cached source. Fabricated quotes are stripped, `attribution_stripped` (TR-5) fires.
8. **Emit** — Write `<slug>.clone.md` and `<slug>.clone.html` always; `<slug>.clone.docx` if pandoc is on PATH. Section headings: `## 01 — Product Identity` through `## 07 — Source Attribution Log` (D-2: align with `/portfolio:bootstrap` family conventions so downstream `--from-clone` reads cleanly).
9. **Register paths** — On first successful emit, add `paths.clones` (`_docs/clones/`) and `paths.clonesCurrent` (`_docs/clones/<slug>/`) to `.claude/paths.json`. Subsequent runs update `paths.clonesCurrent` only. Atomic write (temp + rename).
10. **Summarize** — Print emitted paths, paths-registration note (C-12), and the bridge line into `/portfolio:bootstrap --from-clone <slug>` or `/sprint:plan "clone <name>"`.

## Flags

| Flag | Default | Effect |
|---|---|---|
| `--name <product>` | — | Product name. Seeds the slug and the WebSearch identification query if no `--url`. Non-empty after trim, ≤ 200 chars, no control chars. |
| `--url <url>` | — | Product URL. `http`/`https` only, public hostname only. Skips identification WebSearch when supplied. |
| `--video <url>` | — | Video URL (YouTube, Vimeo, Loom). Transcript is ingested only when `yt-dlp` is on PATH; otherwise falls back to WebSearch on the video title (C-10). |
| `--slug <slug>` | derived | Output slug. Must match `^[a-z0-9][a-z0-9-]{0,63}$`. Derived from `--name` (lowercase + hyphen normalization) or URL hostname when absent. |
| `--output-dir <path>` | `_docs/clones/<slug>/` | Override output dir. Must stay inside project root. |
| `--max-review-sources <n>` | `3` | Cap on distinct review-source URLs collected. Integer in `[1, 8]`. |
| `--no-cache` | off | Ignore any existing `_raw/` cache for this slug; re-fetch every URL. |
| `--strict` | off | Abort with exit `5` on the first source failure. Default (permissive) renders `[GAP — <source-class> — <reason>: <url>]` and continues. |
| `--help` | — | Print help and exit 0. |

## Outputs

```
_docs/clones/<slug>/
  <slug>.clone.md           always
  <slug>.clone.html         always
  <slug>.clone.docx         when pandoc on PATH
  _raw/<sha>.html           one per fetched URL
  _raw/<sha>.meta.json      {url, retrieved_at, http_status, bytes}
  history/<ISO-8601>/       prior emit (if re-run for same slug)
```

Section headings are stable (per D-2 / AC-11.3):

- `## 01 — Product Identity`
- `## 02 — Jobs to be Done`
- `## 03 — Feature List`
- `## 04 — Voice of Customer`
- `## 05 — Gaps`
- `## 06 — Opportunities`
- `## 07 — Source Attribution Log`

Each section ends with a `<!-- bootstrap-feed: <feed-id> -->` HTML comment so `/portfolio:bootstrap --from-clone` can index sections without ambiguity.

## Exit codes

- `0` — success (may include `[GAP — ...]` markers in permissive mode)
- `2` — invalid input (slug, URL scheme/host, flag value, `--max-review-sources` out of range)
- `3` — zero-source corpus (every fetch failed; permissive cannot rescue an empty input — AC-14.3)
- `4` — output directory not writable / not creatable
- `5` — strict-mode partial failure (`--strict` + at least one source failure — AC-14.2)

## TRACE events

All events go to `paths.eventsFile` via the events logger (fail-open per `trace.md`). No raw scraped HTML/text body content appears in events — only metadata (url, status, bytes, counts, durations).

| Event | When | Story | TRACE |
|---|---|---|---|
| `clone_started` | once, after CLI parse + validation | S-1, S-13 | TR-1 |
| `product_identified` | once, after WebSearch resolution (or direct-input) | S-2 | TR-2 |
| `urls_discovered` | once, after one-level discovery | S-3 | TR-3 |
| `source_fetched` | one per successful fetch | S-3, S-4 | TR-4 |
| `source_failed` | one per failed fetch (including 429-after-retry) | S-3, S-4, S-14 | TR-4 |
| `attribution_stripped` | when a fabricated quote is removed pre-emit | S-8 | TR-5 |
| `extraction_completed` | once per extraction pass (5 per run) | S-6..S-10 | TR-6 |
| `clone_emitted` | once at end, with file list + paths-registered + gap_count | S-11, S-12 | TR-7 |

## Anti-spider posture

- One-level link discovery from the seed URL. No recursion in v1. No flag to deepen.
- Same-host only — external links are dropped.
- Per-run fetch budget is bounded by `(8 + max_review_sources) ≤ 16`.
- Retry once on `429`. Then mark `source_failed` and render a `[GAP]` marker in permissive mode.
- Never bypass robots.txt or auth walls.

Operators are responsible for the legal posture of running this skill against any given target. ToS pre-flight is out of v1 scope (logged as enforcement debt, D-6).

## SSRF guardrails

The following inputs to `--url` and `--video` are rejected with exit `2`:

- Scheme other than `http`/`https` (`file://`, `javascript:`, `data:`, `ftp://`).
- IP-literal hostnames (`http://127.0.0.1`, `http://10.0.0.1`, `http://192.168.x.x`, `http://172.16.x.x` through `http://172.31.x.x`).
- AWS-metadata-style link-local (`http://169.254.169.254`).
- IPv6 loopback `[::1]` and link-local `[fe80:...]`.

These guard against the operator (or an injected prompt) targeting internal services.

## Procedure

The skill body runs in two layers:

**Layer 1 — Claude session (this skill body):**
1. Fetch the WebFetch + WebSearch tool schemas via `ToolSearch select:WebFetch,WebSearch`.
2. Run the identification pass (WebSearch when only `--name`/`--video`, else trust `--url`).
3. Run the one-level discovery pass against the product URL (WebFetch the seed page, parse `<a href>` links, filter same-host, prioritize, cap at 8).
4. Run the reviews pass (WebSearch each review host, dedupe, WebFetch each up to `--max-review-sources` with retry-once-on-429).
5. Write each fetched body to `_docs/clones/<slug>/_raw/<sha>.html` with `<sha>.meta.json` BEFORE handing off to the generator. The cache is the source of truth for the presence check.
6. Run the five LLM extraction passes against the aggregated cached text. After voc, run the presence-check: every quote must appear (whitespace-normalized substring) in at least one cached file. Strip any that don't and emit `attribution_stripped`.
7. Assemble a `--draft-file` JSON: `{ target: {name, resolved_url, resolved_via}, drafts: { product_identity, jtbds, feature_list, voice_of_customer, gaps, opportunities }, source_records: [ {url, source_class, status, http_status, bytes, retrieved_at, duration_ms} ... including failed ] }`.
8. Invoke the generator with the assembled payload.

**Layer 2 — Generator (`scripts/portfolio/clone.js`):**

```bash
node scripts/portfolio/clone.js \
  [--name <name>] [--url <url>] [--video <url>] [--slug <slug>] \
  [--output-dir <path>] [--max-review-sources <n>] \
  [--no-cache] [--strict] [--draft-file <path>]
```

The generator owns CLI parsing, validation, output dir resolution + writability probe, MD/HTML/DOCX render and emit, paths registration (idempotent + atomic), and the `clone_started` / `product_identified` / `urls_discovered` / `source_fetched` / `source_failed` / `clone_emitted` events. The skill body emits `extraction_completed` and `attribution_stripped` events directly during extraction (the generator does not see the LLM passes).

`--probe` (generator-only) returns a JSON env snapshot for the skill driver to gate on (slug, output dir, pandoc, yt-dlp).

## Reference

- PRD: `.claude/project/sprint/requirements/SP-20260520-001/prd.md`
- Granular stories: `.claude/project/sprint/requirements/SP-20260520-001/granular-stories.md`
- Acceptance criteria: `.claude/project/sprint/requirements/SP-20260520-001/acceptance-criteria.md`
- COPY: `.claude/project/sprint/requirements/SP-20260520-001/copy.md`
- INPUTS: `.claude/project/sprint/requirements/SP-20260520-001/inputs.md`
- TRACE: `.claude/project/sprint/requirements/SP-20260520-001/trace.md`
- QA plan: `.claude/project/sprint/requirements/SP-20260520-001/qa-plan.md`
- Red-team plan: `.claude/project/sprint/requirements/SP-20260520-001/redteam-plan.md`
- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260521-0017.yaml`
- Sprint: `SP-20260520-001`
