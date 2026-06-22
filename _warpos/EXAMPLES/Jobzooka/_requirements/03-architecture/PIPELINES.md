# Jobzooka — Data Pipelines

> **Scope:** Pipeline stages, inputs, outputs, fallback logic, and error handling. For session state structure and data flow between steps, see `DATA_FLOW.md`. For retry strategies, see `ERROR_RECOVERY.md`.

This document describes every data pipeline in the application: stages, inputs, outputs, fallback logic, and error handling.

---

## Pipeline 1: Query Generation

**Trigger:** User completes profile (step 3) and enters Search (step 4)

```
Profile + Preferences + avoidTerms
  → QUERY_GEN prompt
  → 4–6 LinkedIn search query strings
```

**Fallback:** None — if query generation fails, user is shown error and can retry.

**Pipeline trace stages:** `USER_INPUT` → `QUERY_GEN`

---

## Pipeline 2: Job Scraping (Bright Data)

**Trigger:** User confirms search queries in step 4

```
Queries + Location + Employment Types + Remote flag
  → POST /api/jobs (trigger)
  → BD creates snapshot per query × employment type
  → Client polls POST /api/jobs (poll) every 10 seconds
  → BD processes listings (~30–120 seconds)
  → Deduplicated, normalized JobListing[] returned
```

**Timing:**

- Poll interval: 10 seconds
- Max wait: 6 minutes (360,000ms)
- Force partial results: after 3 minutes (180,000ms)

**Normalization:**

- HTML stripped from descriptions
- Descriptions truncated to 2,000 chars
- Deduplication by title + company (case-insensitive)
- Flexible field mapping (handles BD's inconsistent field names)
- Error records separated from job records

**Fallback:** If all snapshots fail, user sees warning with specific error messages.

**Pipeline trace stages:** `BD_TRIGGER` → `BD_POLL` → `BD_RESULTS`

---

## Pipeline 3: Two-Phase Market Analysis

**Trigger:** Job scraping completes in step 4, analysis begins in step 5

### Phase 1: MARKET_PREP (Raw → Intelligence Report)

```
JobListing[] + Profile (slim) + Employment Types + Query Stats
  → preprocessMarketData() → normalized, truncated text (max 30K chars)
  → buildMarketPrepPayload() → compact job records in <untrusted_job_data> tags
  → extractHourlyRates() → hourly rate matches from descriptions
  → buildMarketSummary() → markdown summary (top companies, seniority, industry)
  → POST /api/claude (MARKET_PREP prompt)
  → marketPrepReport (structured intelligence)
```

**Payload Assembly (`buildMarketPrepPayload`):**

- Jobs compacted to minimal schema: `{ t, c, loc, et, sal, sq, ea, sen, desc }`
- Description excerpt: first 300 chars (trimmed to 150 if payload > 35KB)
- High-volume companies flagged (2+ listings)
- Profile slimmed: first 5 domains, 15 hard skills
- Wrapped in `<untrusted_job_data nonce="...">` tags
- Max payload: 35,000 chars

### Phase 2: MARKET (Report → Final Analysis)

```
marketPrepReport (preferred) OR raw market data (fallback)
  → POST /api/claude (MARKET prompt)
  → MarketAnalysis JSON
    ├── keywords[] (top 20–30 by frequency)
    ├── compRanges (compensation data)
    ├── jobTypes[] (up to 10 categories, ranked)
    ├── miningQuestions[] (5–8 questions)
    ├── discoveryRecs[] (1–3 pivots)
    ├── exclusionTags[]
    └── educationVisibility
```

**Fallback Logic:**

1. If MARKET_PREP fails → skip to single-phase MARKET with raw data
2. If MARKET detects old single-phase output (no categories, stale format) → auto-rerun full pipeline
3. If both fail → user sees error with retry option

**Pipeline trace stages:** `MARKET_PREP_INPUT` → `MARKET_PREP_OUTPUT` → `MARKET_INPUT` → `MARKET_OUTPUT`

---

## Pipeline 4: Resume Generation

**Trigger:** User initiates resume generation in step 8

### Master + General (Single Call)

```
Profile + MarketAnalysis + miningResults (optional) + exclusions
  → POST /api/claude (RESUME_GEN prompt)
  → { master: ResumeOutput, general: ResumeOutput }
```

> **Spec-ahead-of-code note:** In the target state, `miningResults` is optional. Deep-Dive Q&A is a dashboard activity the user may or may not have completed before generating resumes. The RESUME_GEN prompt must handle an empty/partial `miningResults` gracefully. Shipped code treats it as a required input.

### Targeted (Per Category, User-Triggered)

```
For each selected category:
  masterResume + category details (from jobTypes)
    → POST /api/claude (TARGETED prompt)
    → ResumeDiff
    → applyDiff(masterResume, diff)
    → Targeted ResumeOutput
```

**applyDiff safety:**

- Deep clones master (frozen)
- Blocks prototype pollution (`__proto__`, `constructor`, `prototype`)
- Only allows known diff keys
- Normalizes skill matching (lowercase, alphanumeric)

**Cost:**

- Master + General: Free
- Targeted: 50 rockets per category (bulk: 4–6 @ 35, 7–10 @ 25)

**Pipeline trace stages:** `RESUME_INPUT` → `RESUME_OUTPUT`

---

## Pipeline 5: LinkedIn Generation

**Trigger:** User initiates LinkedIn content generation in step 9

```
Profile + Preferences + Demographics + miningResults + #1 ranked category
  → POST /api/claude (LINKEDIN prompt)
  → { headline, about, experience, education, skills, formAnswers }
```

**Cost:** 75 rockets

**No fallback** — failure shows error with retry option.

---

## Pipeline 6: Apply Heuristics Generation

**Trigger:** User enters step 10

```
Profile + Resume + formAnswers + rankedCategories + exclusions + preferences + demographics
  → POST /api/claude (APPLY prompt)
  → { heuristics, manualGuide }

Code-assembled (not AI):
  → buildApplyPrompt(session, heuristics, uploadedResumes)
  → chromePrompt (markdown text)
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
  | "BD_TRIGGER"
  | "BD_POLL"
  | "BD_RESULTS"
  | "MARKET_PREP_INPUT"
  | "MARKET_PREP_OUTPUT"
  | "MARKET_INPUT"
  | "MARKET_OUTPUT"
  | "RESUME_INPUT"
  | "RESUME_OUTPUT";
```

### Trace Buffer

- In-memory array, max 50 entries
- Console logged with `[PIPELINE]` prefix
- Auto-truncates large fields (arrays >10 items, strings >200 chars)
- Available in Deus Mechanicus Pipeline Tracer module
- Not persisted — cleared on page reload

---

## Error Handling Summary

| Pipeline         | On Failure              | Retry        | Fallback                   |
| ---------------- | ----------------------- | ------------ | -------------------------- |
| Query Generation | Show error              | Manual retry | None                       |
| Job Scraping     | Show warnings per query | Manual retry | Partial results after 3min |
| MARKET_PREP      | Skip to single-phase    | Automatic    | MARKET with raw data       |
| MARKET           | Show error              | Manual retry | None                       |
| Resume Gen       | Show error              | Manual retry | None                       |
| Targeted Diff    | Show error per category | Manual retry | None                       |
| LinkedIn         | Show error              | Manual retry | None                       |
| Apply Heuristics | Show error              | Manual retry | None                       |
