# AcmeLaunch — Data Pipelines

> **Scope:** Pipeline stages, inputs, outputs, fallback logic, and error handling. For session state structure and data flow between steps, see `DATA_FLOW.md`. For retry strategies, see `ERROR_RECOVERY.md`.

This document describes every data pipeline in the application: stages, inputs, outputs, fallback logic, and error handling.

---

## Pipeline 1: Query Generation

**Trigger:** Founder completes profile (step 3) and enters Research (step 4)

```
Profile + Constraints + avoidTerms
  → QUERY_GEN prompt
  → 4–6 launch-research query strings
```

**Fallback:** None — if query generation fails, the founder is shown an error and can retry.

**Pipeline trace stages:** `USER_INPUT` → `QUERY_GEN`

---

## Pipeline 2: Launch Research (LaunchResearchRun)

**Trigger:** Founder confirms research queries in step 4

```
Queries + Geography + Channel scope + Approved sources
  → POST /api/research (trigger → creates LaunchResearchRun)
  → adapter fans out one ResearchSource fetch per query × source type
  → Client polls POST /api/research (poll) every 10 seconds
  → adapter gathers signals from approved sources (~30–120 seconds)
  → Deduplicated, normalized LaunchResearchResult[] returned (+ ResearchSnapshot refs)
```

**Timing:**

- Poll interval: 10 seconds
- Max wait: 6 minutes (360,000ms)
- Force partial results: after 3 minutes (180,000ms)

**Normalization:**

- HTML stripped from snippets
- Snippets truncated to 2,000 chars
- Deduplication by signal + source (case-insensitive)
- Flexible field mapping (handles each source's inconsistent field names)
- Failed sources separated from result records and marked, never dropped silently

**Consent & integrity:** A run only queries sources the founder approved (`approvedBy` / `scope` / `allowedUse` / `credentialMode` / `provenanceUrl` on each `ResearchSource`). On partial failure the run persists what it has, marks the failed sources, and applies a bounded retry — it NEVER synthesizes missing evidence to fill a gap.

**Fallback:** If all sources fail, the founder sees a warning with specific per-source error messages.

**Pipeline trace stages:** `RESEARCH_TRIGGER` → `RESEARCH_POLL` → `RESEARCH_RESULTS`

---

## Pipeline 3: Two-Phase Landscape Analysis

**Trigger:** Launch research completes in step 4, analysis begins in step 5

### Phase 1: RESEARCH_PREP (Raw → Intelligence Report)

```
LaunchResearchResult[] + Profile (slim) + Channel scope + Query Stats
  → preprocessResearchData() → normalized, truncated text (max 30K chars)
  → buildResearchPrepPayload() → compact result records in <untrusted_research_data> tags
  → extractReachSignals() → reach/spend signals from snippets
  → buildResearchSummary() → markdown summary (top channels, audiences, competitors)
  → POST /api/claude (RESEARCH_PREP prompt)
  → researchPrepReport (structured intelligence)
```

**Payload Assembly (`buildResearchPrepPayload`):**

- Results compacted to minimal schema: `{ t, src, seg, ch, val, sq, ev, conf, snip }`
- Snippet excerpt: first 300 chars (trimmed to 150 if payload > 35KB)
- High-volume channels flagged (2+ signals)
- Profile slimmed: first 5 markets, 15 strengths
- Wrapped in `<untrusted_research_data nonce="...">` tags
- Max payload: 35,000 chars

### Phase 2: LANDSCAPE (Report → Final Analysis)

```
researchPrepReport (preferred) OR raw research data (fallback)
  → POST /api/claude (LANDSCAPE prompt)
  → LandscapeAnalysis JSON
    ├── keywords[] (top 20–30 by frequency)
    ├── channelRanges (reach/spend data)
    ├── audienceSegments[] (up to 10 segments, ranked)
    ├── openQuestions[] (5–8 questions)
    ├── discoveryRecs[] (1–3 pivots)
    ├── exclusionTags[]
    └── proofVisibility
```

**Fallback Logic:**

1. If RESEARCH_PREP fails → skip to single-phase LANDSCAPE with raw data
2. If LANDSCAPE detects old single-phase output (no segments, stale format) → auto-rerun full pipeline
3. If both fail → founder sees an error with retry option

**Pipeline trace stages:** `RESEARCH_PREP_INPUT` → `RESEARCH_PREP_OUTPUT` → `LANDSCAPE_INPUT` → `LANDSCAPE_OUTPUT`

---

## Pipeline 4: Launch Asset Generation

**Trigger:** Founder initiates asset generation in step 8

### Master + General (Single Call)

```
Profile + LandscapeAnalysis + founderAnswers (optional) + exclusions
  → POST /api/claude (ASSET_GEN prompt)
  → { master: LaunchAssetOutput, general: LaunchAssetOutput }
```

> **Spec-ahead-of-code note:** In the target state, `founderAnswers` is optional. The Deep-Dive Q&A is a dashboard activity the founder may or may not have completed before generating assets. The ASSET_GEN prompt must handle an empty/partial `founderAnswers` gracefully. Shipped code treats it as a required input.

### Variants (Per Segment, Founder-Triggered)

```
For each selected segment:
  masterAsset + segment details (from audienceSegments)
    → POST /api/claude (VARIANT prompt)
    → AssetVariant (diff)
    → applyDiff(masterAsset, diff)
    → segment-specific LaunchAssetOutput
```

**applyDiff safety:**

- Deep clones master (frozen)
- Blocks prototype pollution (`__proto__`, `constructor`, `prototype`)
- Only allows known diff keys
- Normalizes keyword matching (lowercase, alphanumeric)

**Cost:**

- Master + General: Free
- Segment variants: 50 credits per segment (bulk: 4–6 @ 35, 7–10 @ 25)

**Pipeline trace stages:** `ASSET_INPUT` → `ASSET_OUTPUT`

---

## Pipeline 5: Channel Kit Generation

**Trigger:** Founder initiates channel-kit generation in step 9

```
Profile + Constraints + Venture data + founderAnswers + #1 ranked segment
  → POST /api/claude (CHANNEL_KIT prompt)
  → { announcement, landingCopy, emailSequence, socialPosts, audienceSkills, followUpTemplates }
```

**Cost:** 75 credits

**No fallback** — failure shows an error with retry option.

---

## Pipeline 6: Launch Run Rules Generation

**Trigger:** Founder enters step 10

```
Profile + Assets + followUpTemplates + rankedSegments + exclusions + constraints + channels
  → POST /api/claude (RUN_RULES prompt)
  → { rules, manualGuide }

Code-assembled (not AI):
  → buildLaunchConsolePrompt(session, rules, assetPacks)
  → launchConsolePrompt (markdown text)
```

**Cost:** Free

---

## Pipeline Tracing

All pipelines are traced via `src/lib/pipeline.ts`.

### Stages

```typescript
type PipelineStage =
  | "USER_INPUT"
  | "QUERY_GEN"
  | "RESEARCH_TRIGGER"
  | "RESEARCH_POLL"
  | "RESEARCH_RESULTS"
  | "RESEARCH_PREP_INPUT"
  | "RESEARCH_PREP_OUTPUT"
  | "LANDSCAPE_INPUT"
  | "LANDSCAPE_OUTPUT"
  | "ASSET_INPUT"
  | "ASSET_OUTPUT";
```

### Trace Buffer

- In-memory array, max 50 entries
- Console logged with `[PIPELINE]` prefix
- Auto-truncates large fields (arrays >10 items, strings >200 chars)
- Available in Dev Console Pipeline Tracer module
- Not persisted — cleared on page reload

---

## Error Handling Summary

| Pipeline           | On Failure              | Retry        | Fallback                   |
| ------------------ | ----------------------- | ------------ | -------------------------- |
| Query Generation   | Show error              | Manual retry | None                       |
| Launch Research    | Show warnings per source | Manual retry | Partial results after 3min |
| RESEARCH_PREP      | Skip to single-phase    | Automatic    | LANDSCAPE with raw data    |
| LANDSCAPE          | Show error              | Manual retry | None                       |
| Asset Gen          | Show error              | Manual retry | None                       |
| Variant Diff       | Show error per segment  | Manual retry | None                       |
| Channel Kit        | Show error              | Manual retry | None                       |
| Run Rules          | Show error              | Manual retry | None                       |
