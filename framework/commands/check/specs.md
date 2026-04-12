---
description: Spec consistency, coverage, and drift — static audit or change-driven propagation check
---

# /check:specs — Specification Health

Single owner for "Are specs consistent and up to date?" Replaces preflight passes 1-2, eval:specs §1 (Requirements), and retro:reqs.

## Input

`$ARGUMENTS` — Mode selection:
- No args or `static` — Full consistency + coverage audit (use before agent runs or as periodic health check)
- `drift` — Check what changed this session and whether specs propagated (use after coding sessions, embedded in retro:full)
- `{feature-name}` — Scope to one feature (works with either mode, add `--drift` to combine)

---

## Mode: static — Full Audit

Spawn an Explore agent to read ALL spec files and check everything below.

### Files to Read

For each of the 13 features (auth, auto-apply, competitiveness, deep-dive-qa, deus-mechanicus, extension, linkedin, market-research, onboarding, resume-generation, rockets-economy, skills-curation), read ALL of:
- `docs/05-features/{feature}/PRD.md`
- `docs/05-features/{feature}/HL-STORIES.md`
- `docs/05-features/{feature}/STORIES.md`
- `docs/05-features/{feature}/INPUTS.md`
- `docs/05-features/{feature}/COPY.md`

Also read:
- `src/lib/types.ts` (TypeScript interfaces — source of truth for data fields)
- `src/lib/constants.ts` (step/phase definitions)
- `src/lib/rockets.ts` (rocket cost table)
- `docs/03-requirement-standards/STORIES-COMMON.md` (shared behaviors CS-001 through CS-009)
- `docs/03-requirement-standards/GRANULAR_STORIES.md` (story format rules)
- `docs/03-requirement-standards/HIGH_LEVEL_STORIES.md` (HL story rules)
- `docs/04-architecture/FLOW_SPEC.md` (entry states, gates, parallelism)
- `docs/00-canonical/GLOSSARY.md` (step number to component filename mapping)

### Feature Directory Names

auth, auto-apply, competitiveness, deep-dive-qa, deus-mechanicus, extension, linkedin, market-research, onboarding, resume-generation, rockets-economy, skills-curation

Note: feature ID "rockets" maps to directory "rockets-economy".

### Consistency Checks (from preflight Pass 1)

- **S1 Feature ID Consistency** — Verify feature ID in PRD title matches directory name, STORIES.md references, and COPY.md references.
- **S2 Step Number to Component Filename** — Read GLOSSARY.md canonical mapping. For each story referencing a step number, verify it matches the component filename.
- **S3 Data Field References** — For each story with `Data:` metadata: extract every TypeScript interface and field, verify it exists in types.ts, flag misspellings or wrong interfaces.
- **S4 Dependency Chain Integrity** — For each story with `Depends on:`: verify every GS-ID exists. Verify no circular dependencies.
- **S5 Rocket Cost Consistency** — Compare costs in rockets.ts vs PRD §10 vs INTEGRATION-MAP.md. Flag differences.
- **S6 COPY vs Story Text** — Compare button labels, headers, and placeholders in COPY.md against story text. Flag mismatches.
- **S7 Entry State Coverage** — For each step: check FLOW_SPEC entry states have corresponding stories.
- **S8 Shared Behavior References** — For each `Inherits: CS-XXX`: verify the CS-ID exists in STORIES-COMMON.md and hasn't been deprecated.

### Coverage Checks (from preflight Pass 2)

- **S9 HL to Granular Coverage** — Every HL story has at least one granular story mapping to it.
- **S10 PRD Goals to HL Coverage** — Every PRD §6 goal has at least one HL story.
- **S11 Story Metadata Completeness** — Every granular story has: Depends on, Data, Verifiable by, Inherits. Step component stories also need Entry state.
- **S12 Agent Instructions Headers** — PRD.md and STORIES.md have agent instruction blocks.
- **S13 Single-Outcome Rule** — Each granular story describes exactly ONE outcome.
- **S14 Platform Neutrality** — HL stories contain no platform-specific terms (Chrome, browser, click, button, dropdown, API, JSON, endpoint).
- **S15 Parallel-Safe Clusters** — Stories in `<!-- parallel-safe -->` clusters have no interdependencies.
- **S16 FLOW_SPEC Entry State Coverage** — Every FLOW_SPEC entry state has story coverage.
- **S17 API Implementation Leakage** — Stories contain WHAT not HOW. Flag: API URLs, payload structures, HTTP methods, third-party API field names. (Source: Run 03 BUG-031)

### Quality Checks (from eval:specs §1)

- **S18 PRD Section Completeness** — All 16 sections present in correct order.
- **S19 Acceptance Criteria** — Behavioral, not UI/flow.
- **S20 INPUTS.md** — Exists for user-facing features with correct control types.
- **S21 COPY.md Completeness** — Covers all user-facing strings and interactive elements.
- **S22 Error/Edge Case Stories** — Present for each feature.
- **S23 Loading States** — Covered in INPUTS.md.

### Output Format

```json
[
  {
    "check": "S3",
    "severity": "ERROR | WARN | INFO",
    "feature": "onboarding",
    "file": "docs/05-features/onboarding/STORIES.md",
    "line": "GS-012",
    "message": "References `resumeKeywords` but types.ts has `marketAnalysis.keywords`",
    "autoFixable": false
  }
]
```

ERROR = blocks agent run. WARN = might cause issues. INFO = style nit.

After the agent returns, present a summary table: total errors, warnings, info.

---

## Mode: drift — Change Propagation Check

Event-sourced propagation audit. Truth is compiled at runtime from `events.jsonl`, not assumed from code or docs. Uses `scripts/truth-compiler.js`.

### Ground Truth Model

Truth = the most recent **intentional change** in the event log for a given scope.

- `propagated: false` on a spec event = "this change hasn't flowed downstream yet" — that's a gap, not a conflict
- STALE markers are the human-readable surface of the event log data
- A downstream file edited AFTER its upstream changed = gap resolved (clearable)
- A downstream file NOT edited after upstream changed = needs review

### Step 1: Run truth compiler

```bash
node scripts/truth-compiler.js --all
```

This queries all spec events from `events.jsonl`, maps them against STALE markers in every feature's spec files, and classifies each gap into severity tiers:

| Tier | Label | Meaning |
|------|-------|---------|
| 0 | CLEAR | Downstream was updated after upstream — safe to remove marker |
| 1 | COSMETIC | Low-impact change (e.g., COPY edit) — review when convenient |
| 2 | REVIEW | Moderate gap — check if content needs updating |
| 3 | DANGER | High-impact upstream change (rewrite, large cascade, canonical/PRD with wide blast) — review immediately |

If scoped to a single feature:
```bash
node scripts/truth-compiler.js {feature-name}
```

### Step 2: Check cross-cutting docs

For features with changes, check whether cross-cutting docs were updated:

```bash
git diff HEAD~5 -- docs/00-canonical/GOLDEN_PATHS.md docs/04-architecture/FLOW_SPEC.md docs/00-canonical/fixtures/step-expectations.json docs/01-design-system/COMPONENT_LIBRARY.md --stat
```

### Step 3: Present results

```
/check:specs drift — Event-Sourced Propagation Check

DANGER (review immediately):
  ✗ {feature}/{file} ← {source}

REVIEW (check if content needs updating):
  → {feature}/{file} ← {source}

COSMETIC (review when convenient):
  · {feature}/{file} ← {source}

CLEAR ({N} resolved): ...

CROSS-CUTTING:
  GOLDEN_PATHS.md: {✓|✗|N/A}
  FLOW_SPEC.md: {✓|✗|N/A}
  COMPONENT_LIBRARY.md: {✓|✗|N/A}
  Fixtures: {✓|✗|N/A}

TOTALS: {total} gaps | {danger} DANGER | {review} REVIEW | {cosmetic} COSMETIC | {clear} CLEAR
```

### Step 4: Offer to fix

> Fix all gaps now? (all / pick numbers / skip)

For **CLEAR** gaps: remove the STALE marker comment from the file.
For **COSMETIC** gaps: review briefly, remove marker if content is still aligned.
For **REVIEW** gaps: read both files, diff against the upstream change, and either update content or clear if already aligned.
For **DANGER** gaps: read both files carefully, update downstream content to match upstream change.

### Step 5: Log resolution outcomes

After fixing each gap, log the resolution for confidence tracking:

```js
const { logResolution } = require("./scripts/truth-compiler");

// When clearing a STALE marker without content change:
logResolution(gap, "cleared_as_noise");

// When editing downstream content to match upstream:
logResolution(gap, "content_updated");

// If a gap caused a build failure or was flagged by evaluator:
logResolution(gap, "escalated");
```

This feeds the confidence system — after 5+ resolutions of a source→consumer pattern, accuracy percentages appear in output.

## Classification Rules (v2 — source-type-aware)

| Pattern | Tier | Label |
|---------|------|-------|
| GLOSSARY → anything | 1 | COSMETIC |
| COPY source with edit | 1 | COSMETIC |
| HL-STORIES → STORIES | 2 | REVIEW |
| PRD → downstream (edit) | 2 | REVIEW |
| PRD → downstream (rewrite) | 3 | DANGER |
| STORIES → PRD | 3 | DANGER |
| STORIES → INPUTS/COPY | 3 | DANGER |
| Fixtures → anything | 3 | DANGER |
| Any source with 3+ stale consumers | 3 | DANGER |

## API

The truth compiler is also callable from code:

```js
const { compileFeatureTruth, compileAllTruth, compileTruth, logResolution, checkFixtureDrift, getConfidence } = require("./scripts/truth-compiler");

// Per feature
const result = compileFeatureTruth("onboarding");
// result.summary.{clear, cosmetic, review, danger}, result.gaps[].{tier, label}

// All features
const all = compileAllTruth();

// Two specific files
const truth = compileTruth("docs/05-features/onboarding/PRD.md", "docs/05-features/onboarding/STORIES.md");

// Fixture drift (holdout-safe, no STALE markers)
const fixtureDrift = checkFixtureDrift();

// Confidence for a source→consumer pattern
const conf = getConfidence("glossary", "prd");
// {accuracy: 95, samples: 12} or {accuracy: null, samples: 3}
```

## Notes

- In drift mode, reads events but writes resolution outcomes to events.jsonl for confidence tracking.
- When embedded in `/retro:full`, output is condensed to a REQUIREMENTS PROPAGATION section.
- Focus on gaps that would cause agent spec contamination — stale references to removed features are highest priority.
- The truth compiler scans the full events.jsonl (not session-scoped) — it sees all historical spec changes.
- Fixture drift is tracked via hash comparison, NOT via STALE markers — builders never see fixture paths (holdout isolation).
