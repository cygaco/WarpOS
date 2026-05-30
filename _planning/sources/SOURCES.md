# Sources — Large System Update (design · marketing · conversion · audience)

Operator-supplied reference material (2026-05-30) for building the Design Function, the (new) Marketing function, the conversion-focused Web designer, and the deep Audience layer. These are the "resources to learn how to best convert" referenced in the original brief.

> Ingestion approach is being routed through β (team mode). Default intent: **capture here now**, then **extract within the relevant sprints** (S4 design/marketing/conversion agents; S3 audience-mining methods) using `/research:deep` + the new `/etc` skill — routing the knowledge into PRODUCT-LAYER agent operating-procedures, not raw system learnings. Confirm/adjust per β verdict.

## Video sources (7)
| # | URL | Feeds | Status |
|---|-----|-------|--------|
| V1 | https://www.youtube.com/watch?v=d6Dru8yDcaw | TBD (design/marketing/conversion) | captured · not yet ingested |
| V2 | https://www.youtube.com/watch?v=XlCQPnZ2gfA | TBD | captured · not yet ingested |
| V3 | https://www.youtube.com/watch?v=PTvIYH8hDxU | TBD | captured · not yet ingested |
| V4 | https://www.youtube.com/watch?v=VLxfXmciOuo | TBD | captured · not yet ingested |
| V5 | https://www.youtube.com/watch?v=r3Ozh7EtoEw | TBD | captured · not yet ingested |
| V6 | https://www.youtube.com/watch?v=2QJLri6yB2Q | TBD | captured · not yet ingested |
| V7 | https://www.youtube.com/watch?v=1w9UYWm9Bgs | TBD | captured · not yet ingested |

## Document source (1, recursive)
| # | URL | Note | Status |
|---|-----|------|--------|
| D1 | https://docs.google.com/document/d/1aQHqcSQ6z8muzLnBXEy6EgwYlRCEwd02hplNVjQ1UKY | **"plus all the links within"** — follow nested links recursively and capture them here as D1.1, D1.2, … | captured · links-within not yet expanded |

## Original operator framing (verbatim)
- Each source was provided as a `/learn:ingest <url>` invocation.
- "Also, add a sources folder to _planning with all of these."
- "Also, it seems like a dir marketing would be useful too. and there's some interplay between design and marketing."

## TODO at ingest time
- [ ] Fetch each video transcript + the doc (and all links within → expand D1.x).
- [ ] Fill the "Feeds" column (which workstream/agent each source informs).
- [ ] Extract conversion/CRO + OpenAI×Anthropic web-gen workflows → web-designer + Director of Marketing operating procedures (W2).
- [ ] Extract app-UI/UX + audience-specialization methods → product-designer (W2).
- [ ] Extract audience-mining methods/dimensions → F1 audience pipeline (S3).

## Batch 2 — 2026-05-30 (the "build this process INTO WarpOS" corpus)
Operator directive: *"i want to build out this process in warpos, not in claude cowork per se. This is relevant to that guy's youtube videos."* → The videos (V1–V7 above) + these docs describe one methodology; Higgsfield shows a skills/CLI/MCP product model. Goal of ingest = understand the process, then build it into WarpOS natively. **Currently being ingested by parallel agents → `_planning/ingest/`.**

### Higgsfield (hub crawl)
| # | URL | Status |
|---|-----|--------|
| H1 | https://higgsfield.ai/ | ingesting |
| H2 | https://higgsfield.ai/mcp | ingesting |
| H3 | https://higgsfield.ai/cli | ingesting |
| H4 | https://higgsfield.ai/skills | ingesting |

### Google Docs (batch 2)
| # | URL | Status |
|---|-----|--------|
| D1 | https://docs.google.com/document/d/1aQHqcSQ6z8muzLnBXEy6EgwYlRCEwd02hplNVjQ1UKY | ingesting (gdocs-A) |
| D2 | https://docs.google.com/document/d/1FH356fmWw31k7uQoSO3P6z8Yy-maFZVXD8KgJhft-JM | ingesting (gdocs-A) |
| D3 | https://docs.google.com/document/d/1sBmKp8IstDSL3amcQJdiA5vd7J2HSwbnRuK4w7Di1FI | ingesting (gdocs-A) |
| D4 | https://docs.google.com/document/d/1Vjt35TdRPI-eXZiSDyHyJrCHFjQnDLAf85-5N9KbK3E | ingesting (gdocs-B) |
| D5 | https://docs.google.com/document/d/1kwcCK9qVoIzYXjESi6TLPgwKzIo_CkOc7QClDqhLygw | ingesting (gdocs-B) |

Ingest outputs: `_planning/ingest/{higgsfield,gdocs-A,gdocs-B,videos}.md`.
