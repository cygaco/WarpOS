---
description: Architecture integrity — agent system internals, cross-layer seams, doc health
---

# /check:arch — Architecture Integrity

Single owner for "Do layers actually connect?" Replaces preflight passes 3+6, eval:cross, and eval:specs §2-4.

## Input

`$ARGUMENTS` — Mode selection:
- No args — run all 3 modes
- `internal` — Agent system internal consistency (pre-run focus)
- `seams` — Cross-layer seam checking (req↔arch↔code↔agents)
- `health` — Document-level health of architecture, agents, foundation, infra
- `req+arch` / `skills+hooks` / `docs+agents` — Targeted seam sub-checks

---

## Mode: internal — Agent System Consistency

Spawn an Explore agent. Focus: can agents build from these docs without contradictions?

### Files to Read

- `.claude/agents/.system/agent-system.md`, `oneshot/protocol.md`, `TASK-MANIFEST.md`, `PROMPT-TEMPLATES.md`
- `.claude/agents/.system/oneshot/compliance.md`, `INTEGRATION-MAP.md`, `FILE-OWNERSHIP.md`, `store.json`
- `src/lib/types.ts`, `src/lib/constants.ts`
- `.claude/settings.json`
- Each feature's PRD.md and STORIES.md (for cross-referencing acceptance criteria)

### Buildability Checks (from preflight Pass 3)

- **A1 Feature in All Manifests** — Every feature in TASK-MANIFEST, FILE-OWNERSHIP, INTEGRATION-MAP, store.json.
- **A2 File Scope Consistency** — TASK-MANIFEST file scope matches FILE-OWNERSHIP.
- **A3 Dependency Consistency** — TASK-MANIFEST deps match INTEGRATION-MAP contracts and AGENT-SYSTEM step graph.
- **A4 Context Scoping vs Story Data** — AGENT-SYSTEM §12 "Receives"/"Does NOT receive" columns match story `Data:` fields.
- **A5 Store Schema Completeness** — AGENT-SYSTEM §6 Store interface matches actual store.json.
- **A6 Acceptance Criteria Testability** — Flag untestable criteria ("user feels confident", "UI looks clean").
- **A7 Phase Ordering** — TASK-MANIFEST phases consistent with AGENT-SYSTEM step graph.
- **A8 HYGIENE Rule Coverage** — Every bug in store.bugDataset has a HYGIENE rule with prevention.
- **A9 Evaluator synthesis_allowed** — Context scoping synthesis_allowed:true only where stories describe content generation.
- **A10 Locked Interfaces** — lockedInterfaces in store.json reference real types.ts interfaces.
- **A11 Known Stubs** — Every store.knownStubs file exists and IS a stub.
- **A12 Compliance CLI** — store.compliance.command and fallback noted for env check.

### Architecture Completeness Checks (from preflight Pass 6)

- **A13 Referenced Files Exist** — Every file path in agent docs exists on disk (scripts, dirs, configs, specs).
- **A14 Scripts Runnable** — .js scripts pass `node -c` syntax check.
- **A15 Circuit Breaker** — All 3 states, transition conditions, halt conditions, store fields, Boss prompt logic.
- **A16 Role Completeness** — All 6 roles have templates, clear responsibilities, authority boundaries, context scoping.
- **A17 Evaluator Pipeline** — Checks numbered, scoring tiers with actions, fixtures exist, expectations cover all steps.
- **A18 Data Contract Chain** — Every INTEGRATION-MAP producer→consumer: features exist, fields exist in types.ts, phase ordering correct.
- **A19 Gauntlet Architecture** — Snapshot hashing, 3 reviewers, parallel fan-out, targeted re-review, fix brief structure.
- **A20 Store Schema vs Actual** — Field-by-field comparison including nested objects.
- **A21 Spec File Coverage** — Every TASK-MANIFEST feature has specs to read.
- **A22 BOSS-PROMPT Freshness** — References latest HYGIENE, COMPLIANCE, FLOW_SPEC; pre-flight checklist complete.
- **A23 Retry/Escalation Paths** — Max retries, Fix→Lead→User escalation, no dead ends.
- **A24 Points/Rewards Status** — Scripts exist? Store fields? Flag documented-but-not-built.
- **A25 Merge Strategy** — Rules, branch naming, phase gates, post-merge build check, WorktreeCreate hook.

### Agentic Flow Audit (A26)

For EVERY mechanism in the agent system, verify concrete implementation support:

**REQUIRED** (ERROR if missing):
Circuit breaker, Heartbeat monitoring, Pre-flight checklist, Gate-check hook, Evaluator 4-check protocol, Holdout evaluation, File ownership enforcement, Retry logic (3 max), Duplicate check, Unified fix brief, Snapshot hashing, Compliance review, Security review, Bounded Lead evolution, Bug patterns in builder context, Evolution audit trail.

**OPTIONAL** (WARN if missing):
Multi-direction exploration, Incremental task decomposition, Points/rewards, Model selection per role, Three cycles then trust, Lead pruning, Quiet hours for Lead, Compound signal detection, Digital twin API mocks, Adversarial compliance, External pull then internal enrich, Structured escalation brief.

### Output Format

Same JSON array: `{check, severity, feature, file, message, autoFixable}`

---

## Mode: seams — Cross-Layer Seam Checking

Spawn an Explore agent. Focus: where layers connect, where they contradict.

### Cross-Check 1: Requirements × Architecture

- **X1 Stories → FLOW_SPEC** — Entry states exist, acceptance criteria don't contradict exit gates.
- **X2 Stories → DATA-CONTRACTS** — Data: fields exist in types.ts, producer/consumer alignment, no dead producers/consumers. **Field rename consistency**: check `git diff HEAD~10..HEAD -- src/lib/types.ts` for renames, grep docs/ for old names.
- **X3 Stories → PROMPT_TEMPLATES** — Template names, input/output contracts, token budgets match.
- **X4 Stories → VALIDATION_RULES** — Constraint values, error messages match.
- **X5 INPUTS → Architecture** — Consumed-by features have matching stories, field names match DATA-CONTRACTS, loading states match ERROR_RECOVERY.
- **X6 Architecture without stories** — Architecture describes systems nobody asked for.
- **X7 Stories without architecture** — Stories assume systems architecture doesn't describe.

### Cross-Check 2: Skills × Hooks

- **X8 Hook management coverage** — Every settings.json hook known to /hooks skills.
- **X9 Skill enforcement backing** — Skills claiming enforcement have hooks for automatic cases.
- **X10 Skill-hook version sync** — Recent hook changes reflected in skill docs.
- **X11 Wiring gaps** — Hooks that should trigger skills, skills that should install hooks.

### Cross-Check 3: Docs × Agent System

- **X12 New docs → builder prompts** — Docs with spec info are in PROMPT-TEMPLATES builder read order.
- **X13 New docs → evaluator/compliance** — Docs with criteria are in evaluator read lists.
- **X14 New docs → FILE-OWNERSHIP** — All docs listed (foundation read-only or feature-owned).
- **X15 Decision event log** — events.jsonl populated by edit-watcher, referenced in builder prompts.

### Context Management

Use Grep to extract specific metadata rather than reading full files. For STORIES.md, grep for `Entry state:`, `Data:`, `Verifiable by:`, `Inherits:`.

### Output Format

```markdown
# Cross-Layer Audit Report

| Cross | Critical | High | Medium | Low | Total |
|---|---|---|---|---|---|

## Agent Risk Assessment
{What seam bugs would cause agent failures now?}

## Top 5 Seam Fixes Before Next Run
1. **{Fix}** — Bridges {Layer A} and {Layer B}. Without this, agents will {failure mode}.
```

---

## Mode: health — Documentation Health

Spawn an Explore agent. Focus: each doc layer's internal quality.

### Architecture Docs (docs/04-architecture/)

- FLOW_SPEC: all 10 steps, correct entry/exit states, testable gates
- PROMPT_TEMPLATES: all prompts with verbatim text and contracts
- DESIGN_TOKENS: match actual CSS usage
- VALIDATION_RULES: every user input covered
- AUTH_SCHEMAS: match auth.ts and auth-oauth.ts
- EXTENSION_SPEC: match extension/ directory
- ERROR_RECOVERY: all API call sites with retry/fallback
- DATA-CONTRACTS: producer-consumer with types.ts field matching
- API_SURFACE: all routes with request/response/auth/rate-limit
- ENV_VARS: match CLAUDE.md
- Cross-check: FLOW_SPEC vs stories, PROMPT_TEMPLATES vs prompts.ts, API_SURFACE vs routes, DESIGN_TOKENS vs CSS
- No TODOs, placeholders, stale code references; self-contained; actionable

### Agent System Docs (docs/09-agentic-system/)

- Manifests: features present in all 4 (TASK-MANIFEST, FILE-OWNERSHIP, INTEGRATION-MAP, store.json)
- store.json: valid JSON, feature list matches docs/05-features/
- Agent definitions: builder refs current HYGIENE, evaluator aligns with COMPLIANCE
- Templates include INPUTS.md and DATA-CONTRACTS.md
- Fixtures: step-expectations.json matches FLOW_SPEC and types.ts

### Foundation Docs (docs/00-canonical/)

- GLOSSARY matches constants.ts and CLAUDE.md
- PRODUCT_MODEL matches CLAUDE.md scope
- GOLDEN_PATHS cover steps 1-10, match FLOW_SPEC
- FAILURE_STATES have corresponding stories
- Design system: COLOR_SEMANTICS ↔ DESIGN_TOKENS, COMPONENT_LIBRARY ↔ COMPONENT_HIERARCHY
- Copy system: COPY_STRATEGY voice/tone, SURFACE_MAP completeness
- External refs: BD dataset ID, API endpoints current

### Infrastructure Data

- **Auto-fix**: malformed JSON, orphan STALE markers, missing events.jsonl, duplicate learnings, unwired hooks
- **Confirm**: FIELD_REGISTRY drift, SPEC_GRAPH orphans, stale STALE markers (>48h), precedence violations
- **Report**: lint errors, missing definitions, semantic mismatches

### Output

| Layer | Issues | Severity | Notes |
|-------|--------|----------|-------|
