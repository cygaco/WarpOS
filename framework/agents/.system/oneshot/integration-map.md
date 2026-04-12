<!-- STALE: src/lib/types.ts changed at 2026-04-09T22:08:14 — review needed -->
<!-- STALE: src/lib/rockets.ts changed at 2026-04-09T20:02:01 — review needed -->
# Integration Map

Every data dependency between features is documented here. Features communicate through `SessionData` fields, NOT through each other's code. Producer defines the shape. Consumer adapts. Never the reverse.

---

## SessionData Flow — What Each Step Writes and Reads

### Step 1: Resume Parse

**Writes:**

- `resumeRaw: string`
- `resumeStructured: ResumeStructured`
- `personal: Personal`
- `education: EducationEntry[]`
- `context: Context`
- `demographics: Demographics`

**Reads:** Previous session (if resuming)

**AI call:** `callClaude("PARSE", resumeRaw)` → cost: 0

---

### Step 2: Preferences

**Writes:**

- `preferences: Preferences`
- `demographics: Demographics` (completes from step 1)

**Reads:** `personal`, `education`

**AI call:** None (manual form)

---

### Step 3: Profile Analysis

**Writes:**

- `profile: Profile` (discipline, seniority, domains, hardSkills, softSkills, differentiators, achievements, gaps, avoidTerms, irrelevantSkills)

**Reads:** `resumeStructured`, `context`, `preferences`, `education`

**AI call:** `callClaude("PROFILE", { resume, context, preferences, education })` → cost: 0

---

### Step 4: Query Generation + BD Trigger

**Writes:**

- `generatedQueries: string[]`
- `marketSource: "api" | "manual"`
- `marketRaw: string`
- `queryStats: Array<{ query: string; resultCount: number }>`

**Reads:** `profile`, `preferences`, `context`, `resumeStructured`

**AI call:** `callClaude("QUERY_GEN", { profile, preferences, context })` → cost: 0
**API call:** `fetchJobs(queries, location, employmentTypes)` → BD scraper

---

### Step 5: Market Analysis (Two-Phase)

**Writes:**

- `marketPrepReport?: string` (phase 1 output, only if API source)
- `marketAnalysis: MarketAnalysis`
- `miningQuestions: Array<{ id, question, why? }>`
- `jobTypes: JobType[]`
- `rankedCategories: JobType[]` (selected categories, written at lock)

**Reads:** `marketRaw`, `queryStats`, `profile`, `preferences`, `resumeStructured`, `marketPrepReport`

**AI calls:**

- Phase 1: `callClaude("MARKET_PREP", buildMarketPrepPayload(...))` → cost: 0 (first run), 50 (rerun)
- Phase 2: `callClaude("MARKET", { marketPrepReport, marketRaw, profile, ... })` → cost: 0

---

### Step 6: Deep-Dive QA

**Writes:**

- `miningResults: Record<string, MiningResult>`
- `miningChatMsgs: Array<{ role, content }>`

**Reads:** `miningQuestions`

**AI call:** None (user-driven Q&A)

---

### Step 7: Skill Curation

**Writes:**

- `exclusions: Exclusions` (skills with include/exclude state + custom exclusions text)

**Reads:** `profile.hardSkills`, `marketAnalysis.keywords`, `resumeStructured.skills_section`, `profile.irrelevantSkills`

**AI call:** None (manual toggles)

---

### Step 8: Resume Generation

**Writes:**

- `masterResume: ResumeOutput`
- `generalResume: ResumeOutput`
- `targetedResumes: Record<string, ResumeOutput & { _diff? }>`

**Reads:** `resumeStructured`, `profile`, `context`, `education`, `miningResults`, `exclusions`, `rankedCategories`, `marketAnalysis.keywords`

**AI calls:**

- `callClaude("RESUME_GEN", { ... })` → master + general, cost: 0
- `callClaude("TARGETED", { ... })` × N categories → cost: 50/35/25 per category (bulk tiers)

---

### Step 9: LinkedIn + Form Answers

**Writes:**

- `linkedin: LinkedInData`
- `formAnswers: FormAnswer[]`

**Reads:** `profile`, `resumeStructured`, `masterResume`, `rankedCategories`, `exclusions`, `preferences`, `personal`, `education`, `context`, `miningResults`, `demographics`

**AI call:** `callClaude("LINKEDIN", { ... })` → cost: 75

---

### Step 10: Auto-Apply Setup

**Writes:**

- `applyData: ApplyData`
- `uploadedResumes: UploadedResumes`

**Reads:** `profile`, `masterResume`, `targetedResumes`, `rankedCategories`, `exclusions`, `preferences`, `demographics`, `miningResults`, `formAnswers`

**AI call:** `callClaude("APPLY", { ... })` → cost: 0
**Hand-off:** Extension takes over. Orchestrator cannot observe or control.

---

## Producer/Consumer Contracts

| #   | Producer          | Consumer             | Contract Field     | Type                            |
| --- | ----------------- | -------------------- | ------------------ | ------------------------------- |
| 1   | Step 1 (Parse)    | Steps 2-10           | `resumeStructured` | `ResumeStructured`              |
| 2   | Step 1 (Parse)    | Steps 2, 3, 9, 10    | `personal`         | `Personal`                      |
| 3   | Step 1 (Parse)    | Steps 2, 3, 8, 9     | `education`        | `EducationEntry[]`              |
| 4   | Step 1 (Parse)    | Steps 3, 4, 8, 9     | `context`          | `Context`                       |
| 5   | Step 2 (Prefs)    | Steps 4, 5, 8, 9, 10 | `preferences`      | `Preferences`                   |
| 6   | Step 2 (Prefs)    | Steps 9, 10          | `demographics`     | `Demographics`                  |
| 7   | Step 3 (Profile)  | Steps 4-10           | `profile`          | `Profile`                       |
| 8   | Step 4 (Queries)  | Step 5               | `marketRaw`        | `string` (JSON)                 |
| 9   | Step 4 (Queries)  | Step 5               | `queryStats`       | `Array<{ query, resultCount }>` |
| 10  | Step 5 (Market)   | Steps 6, 7, 8        | `marketAnalysis`   | `MarketAnalysis`                |
| 11  | Step 5 (Market)   | Step 6               | `miningQuestions`  | `Array<{ id, question, why? }>` |
| 12  | Step 5 (Market)   | Step 6               | `jobTypes`         | `JobType[]`                     |
| 13  | Step 6 (QA)       | Steps 8, 9, 10       | `miningResults`    | `Record<string, MiningResult>`  |
| 14  | Step 5 (Lock)     | Steps 8, 9, 10       | `rankedCategories` | `JobType[]`                     |
| 15  | Step 7 (Skills)   | Steps 8, 9, 10       | `exclusions`       | `Exclusions`                    |
| 16  | Step 8 (Resumes)  | Steps 9, 10          | `masterResume`     | `ResumeOutput`                  |
| 17  | Step 8 (Resumes)  | Step 10              | `targetedResumes`  | `Record<string, ResumeOutput>`  |
| 18  | Step 9 (LinkedIn) | Step 10              | `formAnswers`      | `FormAnswer[]`                  |

**CRITICAL (HYGIENE Rule 10):** Every `complete(step, data)` call must include ALL fields listed in the WRITES column for that step. Omitting a field (even one not displayed on screen) breaks downstream steps. This was the root cause of QA-017 (P0).

---

## Cross-Cutting Integration

### Auth → All API Routes

```
Contract: requireAuth() middleware, verifyJWT(), getSession()
Producer: auth feature
Consumer: every API route that accesses user data
Rule: All billable API routes MUST call requireAuth(). Auth exports, others import.
```

### Rockets → Claude API Route

```
Contract: debitRockets(userId, operation) called before billable Claude calls
Producer: rockets feature (src/lib/rockets.ts)
Consumer: /api/claude/route.ts
Rule: API route checks balance, debits, then calls Claude. Returns 402 if insufficient.
```

### Competitiveness → All Step UIs

```
Contract: calculateCompetitiveness(sessionData) → 0-100 score
Producer: competitiveness feature
Consumer: Step10Resumes (step 8), Step6Analysis (step 5), CompetitivenessMeter
Rule: Read-only consumption. Step UIs display the score, never modify scoring logic.
```

### Competitiveness Weighted Factors

| Factor            | Weight         | Source Feature    |
| ----------------- | -------------- | ----------------- |
| Deep-Dive QA      | 15%            | deep-dive-qa      |
| Target categories | 5%             | market-research   |
| Skill curation    | 5%             | skills-curation   |
| Master resume     | 10%            | resume-generation |
| General resume    | 5%             | resume-generation |
| Targeted resumes  | 25% (uncapped) | resume-generation |
| LinkedIn          | 15%            | linkedin          |
| Auto-apply        | 10%            | auto-apply        |
| Form answers      | 10%            | linkedin          |

### Foundation Utilities Used By Multiple Features

**Wire format (HYGIENE Rule 7):** The server `/api/claude` returns `NextResponse.json({ text: "..." })`. The client `callClaude()` in `api.ts` already handles extraction: `const data = await res.json(); return data.text ?? ""`. Builders MUST use `callClaude()` — do NOT call the API route directly or parse the response yourself.

| Utility                    | File          | Used by                                                              |
| -------------------------- | ------------- | -------------------------------------------------------------------- |
| `callClaude()`             | `api.ts`      | onboarding, market-research, resume-generation, linkedin, auto-apply |
| `fetchJobs()`              | `api.ts`      | market-research                                                      |
| `mergeSkillSources()`      | `utils.ts`    | skills-curation                                                      |
| `preprocessMarketData()`   | `utils.ts`    | market-research                                                      |
| `buildMarketSummary()`     | `utils.ts`    | market-research                                                      |
| `buildMarketPrepPayload()` | `utils.ts`    | market-research                                                      |
| `extractHourlyRates()`     | `utils.ts`    | market-research                                                      |
| `applyDiff()`              | `utils.ts`    | resume-generation                                                    |
| `tracePipeline()`          | `pipeline.ts` | market-research, resume-generation                                   |
| `debitRockets()`           | `rockets.ts`  | rockets, /api/claude                                                 |
| `calculateBulkCost()`      | `rockets.ts`  | resume-generation                                                    |

---

## Rocket Cost Summary

| Operation                  | Prompt Key  | Cost    | Feature           |
| -------------------------- | ----------- | ------- | ----------------- |
| Resume parse               | PARSE       | 0       | onboarding        |
| Profile analysis           | PROFILE     | 0       | onboarding        |
| Query generation           | QUERY_GEN   | 0       | market-research   |
| Market prep (first)        | MARKET_PREP | 0       | market-research   |
| Market prep (rerun)        | MARKET_PREP | 50      | market-research   |
| Market analysis            | MARKET      | 0       | market-research   |
| Master + general resume    | RESUME_GEN  | 0       | resume-generation |
| Targeted resume (1-3 cats) | TARGETED    | 50/each | resume-generation |
| Targeted resume (4-6 cats) | TARGETED    | 35/each | resume-generation |
| Targeted resume (7+ cats)  | TARGETED    | 25/each | resume-generation |
| LinkedIn + forms           | LINKEDIN    | 75      | linkedin          |
| Auto-apply setup           | APPLY       | 0       | auto-apply        |

Free tier: 150 rockets per new user.
