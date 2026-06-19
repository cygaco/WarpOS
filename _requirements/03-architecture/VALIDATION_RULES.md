# AcmeLaunch — Validation Rules (Regen Spec)

Field constraints, input sanitization, and output validation scattered across components and lib files. A regen agent needs these to reproduce the same guardrails.

---

## File Upload (src/lib/upload.ts)

### Allowed Types

| Extension | MIME Types                                                                                   | Magic Bytes          |
| --------- | -------------------------------------------------------------------------------------------- | -------------------- |
| `.pdf`    | `application/pdf`                                                                            | `%PDF` (25 50 44 46) |
| `.docx`   | `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/zip` | `PK` (50 4B 03 04)   |
| `.txt`    | `text/plain`                                                                                 | None                 |
| `.md`     | `text/plain`, `text/markdown`                                                                | None                 |

### Limits

| Constraint         | Value         | Location                              |
| ------------------ | ------------- | ------------------------------------- |
| Max file size      | 10 MB         | `upload.ts:25`, `Step1Brief.tsx:60`   |
| Max PDF pages      | 50            | `upload.ts:26`                        |
| Max extracted text | 500,000 chars | `upload.ts:27`                        |
| Parse timeout      | 15,000 ms     | `upload.ts:28`                        |

### Validation Pipeline

1. **Basic** (`validateFile`): size > 0, size <= 10MB, extension in allowed list, MIME matches
2. **Deep** (`validateFileDeep`): basic + magic byte header check
3. **Extract** (`extractText`): deep validate, then parse with timeout

---

## Founder Info (Step1Brief.tsx)

| Field     | Rule                                                      | Error Message                                                    |
| --------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| Name      | Required, non-empty                                       | "Name is required"                                               |
| Email     | Required, non-empty                                       | "Email is required"                                              |
| Product   | Required, non-empty                                       | "Product name is required"                                       |
| Geography | Required, non-empty                                       | "Launch geography is required"                                   |
| Website   | Optional; if set, must parse as valid URL with http/https | "Website link must be a valid URL (e.g. https://yoursite.com)"   |

---

## Password (src/app/api/auth/register/route.ts)

| Constraint | Value | Rationale |
|---|---|---|
| Minimum length | 8 characters | Industry standard minimum |
| Maximum length | 128 characters | Prevents PBKDF2 DoS (long inputs cause excessive hashing time) |
| Complexity | None required (MVP) | Reduces friction; may add in future |

---

## Research Queries (src/lib/validators.ts)

### sanitizeQueries()

- Strips Boolean operators (`AND`, `OR`, `NOT` — case-insensitive)
- Removes parentheses
- Collapses multi-space to single space
- Truncates 3+ quoted phrases to the first 2
- Filters out empty strings

---

## Launch-Asset Output Sanitization (src/lib/validators.ts)

### sanitizeAssetText()

Applied to all Claude plan/asset/channel output before use:

| Input Character           | Replacement |
| ------------------------- | ----------- |
| Smart single quotes `''‚` | `'`         |
| Smart double quotes `""„` | `"`         |
| En-dash `–`, em-dash `—`  | `-`         |
| Ellipsis `…`              | `...`       |
| Bullet `•`                | `-`         |
| Non-breaking space        | ` `         |
| Zero-width chars          | (removed)   |

---

## CSRF / Origin Validation (src/lib/csrf.ts)

### validateOrigin()

Shared utility imported by all mutation API routes. Checks `Origin` header (primary) and `Referer` header (fallback) against `ALLOWED_ORIGINS` env var + same-origin host.

**Applied to these routes:**

| Route                | Method            | Since                             |
| -------------------- | ----------------- | --------------------------------- |
| `/api/claude`        | POST              | Original (inline, same logic)     |
| `/api/research`      | POST              | Original (inline, same logic)     |
| `/api/credits/debit` | POST              | Security fix                      |
| `/api/credits/grant` | POST              | Security fix                      |
| `/api/session`       | GET, POST, DELETE | Security fix (DELETE was missing) |
| `/api/auth/login`    | POST              | Security fix                      |
| `/api/auth/logout`   | POST              | Security fix                      |
| `/api/auth/register` | POST              | Security fix                      |

**Not applied to:** `/api/stripe/webhook` (legitimately cross-origin — Stripe calls our endpoint, verified by signature), `/api/test` (gated by env var). The `/api/launch-console/*` routes are first-party app sessions and carry the standard origin/auth check.

**Behavior:** Returns `false` if neither `Origin` nor `Referer` matches an allowed origin. Route responds with HTTP 403. Check runs BEFORE auth, rate limiting, or body parsing.

---

## Exclusion Validation (src/lib/validators.ts)

### validateExclusions()

Checks that scope items the founder marked as "exclude" do not appear in any output. Scanned areas:

- Master launch plan: summary, key milestones, task descriptions
- Overview plan: summary, key milestones, task descriptions
- Segment plans: summary, key milestones, task descriptions, diff fields (summary_replacement, milestones_reorder, tasks_rewrite replacements)
- Channels: announcement headline, landing copy, email sequence
- Launch Console prompt
- Channel follow-up answers

Uses both `scopeMatch()` and case-insensitive `includes()`.

**`scopeMatch()` algorithm:** Normalizes both strings by lowercasing and stripping all non-alphanumeric characters (`/[^a-z0-9]/g`), then compares for exact equality. No fuzzy matching for MVP.

---

## Output Fidelity (src/lib/validators.ts)

### validateOutputFidelity()

| Check                      | Pass Condition              | Fail Condition           |
| -------------------------- | --------------------------- | ------------------------ |
| Research queries in prompt | All queries appear verbatim | None appear              |
| Excluded scope items       | Zero violations             | Any excluded item found  |
| Channel answers populated  | All populated               | 4+ empty                 |

### validateContracts()

Checks that required session fields exist and are non-null before each prompt call. See PROMPT_TEMPLATES.md § Prompt Contracts for the full table.

### validateAliases()

Checks common abbreviations (PMF, MRR, ARR, CAC, LTV, CTA, SEO, B2B, B2C, MVP, ICP, NPS, etc.) — if an abbreviation appears in the idea brief, either it or its expansion should appear in the output.

---

## Smoke Test (src/lib/validators.ts)

### runSmokeTest()

Full end-to-end session validation:

| Check                | Expected                                      |
| -------------------- | --------------------------------------------- |
| Brief parsed         | `briefStructured` exists                      |
| Founder data         | `founder.name` non-empty                      |
| Profile generated    | `founderProfile` exists                       |
| Research data        | `researchResults` exists                      |
| Landscape analysis   | `landscapeAnalysis` exists                    |
| Segments ranked      | `rankedSegments.length > 0`                   |
| Master plan          | Exists, has summary and milestones            |
| Overview plan        | `overviewPlan` exists                         |
| Segment plans        | `segmentPlans` has 1+ entries                 |
| Channels             | `launchChannels.announcement` exists          |
| Channel answers      | `channelAnswers.length > 0`                   |
| Run data             | `runData.consolePrompt` exists (SKIP ok)      |
| Exclusion compliance | Zero violations                               |
| Data contracts       | All prompt contracts satisfied (WARN ok)      |

---

## Landscape Data Limits (src/lib/utils.ts)

| Constraint                | Value                                     | Location                      |
| ------------------------- | ----------------------------------------- | ----------------------------- |
| Max landscape text        | 30,000 chars                              | `preprocessLandscapeData()`   |
| Max LANDSCAPE_PREP payload| 35,000 chars                              | `buildLandscapePrepPayload()` |
| Description excerpt       | 300 chars (default), 150 chars (fallback) | `buildLandscapePrepPayload()` |
| High-signal source flag   | 2+ results                                | `buildLandscapePrepPayload()` |

---

## Rate Limits (src/app/api/claude/route.ts, src/app/api/research/route.ts)

| Limit                   | Value               | Scope        |
| ----------------------- | ------------------- | ------------ |
| Claude per-IP           | 20/min              | Per IP       |
| Research per-IP         | 10/min              | Per IP       |
| Global Claude           | 60/min              | All users    |
| Daily Claude requests   | 500 (default)       | ENV override |
| Daily Claude tokens     | 2,000,000 (default) | ENV override |
| Daily research requests | 100 (default)       | ENV override |

---

## Plan Length Heuristic (Step10Plans.tsx)

```typescript
function isLargePlan(plan: PlanOutput): boolean {
  return (plan.milestones || []).length > 3 || totalTasks > 20;
}
```

If the master plan is "large", a separate trimmed overview plan is used. Otherwise, the master serves as both.

---

## Scope Exclusion Warning (Step8Scope.tsx)

If > 50% of items in a category are excluded, a warning is shown to the founder. Minimum 3 items in a category before this check fires.
