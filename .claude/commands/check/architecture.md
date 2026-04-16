---
description: Architecture integrity — do the layers connect? agent system, cross-layer seams, documentation health
---

# /check:architecture — Architecture Integrity

Single owner for "Do the layers actually connect?" Verifies the agent system, foundation files, specs, code, and docs are internally consistent and reference things that exist.

## Input

`$ARGUMENTS` — Mode selection:
- No args — run all three modes in order (internal → seams → health)
- `internal` — Agent system internal consistency only
- `seams` — Cross-layer seam checks only (requirements ↔ architecture ↔ code ↔ agents)
- `health` — Document-level health of specs, agent docs, foundation files, infra
- `--json` — raw JSON output instead of markdown report
- `<layer-pair>` — e.g. `req+arch`, `skills+hooks`, `docs+agents` for targeted seam checks

---

## Files to read (all modes)

Bootstrap paths and config — every mode reads these first:

1. `.claude/paths.json` — canonical path registry
2. `.claude/manifest.json` — project metadata (`build.features[]`, `fileOwnership.foundation`, `source_dirs`, `buildCommands`)
3. `.claude/settings.json` — hook registrations
4. `.claude/agents/store.json` — build system state (may not exist in fresh projects)
5. `.claude/paths.json` resolved keys — locate `agents`, `commands`, `reference`, `maps`, `memory`, `events`

Any check that depends on a path should resolve it via `paths.json`, not hardcode it.

---

## Mode: internal — Agent System Consistency

Spawn an Explore agent. Focus: **can agents build from these docs without contradictions?**

### Additional files to read

- `.claude/agents/00-alex/{alpha,beta,gamma,delta}.md` — core team
- `.claude/agents/00-alex/.system/protocol.md` (if exists) — shared protocol
- `.claude/agents/01-adhoc/.system/protocol.md` — adhoc mode protocol
- `.claude/agents/02-oneshot/.system/protocol.md` — oneshot state machine
- `.claude/agents/01-adhoc/*/` and `.claude/agents/02-oneshot/*/` — build-chain agent definitions
- `.claude/project/reference/{reasoning-frameworks,operational-loop,learning-lifecycle}.md`
- Foundation files listed in `manifest.fileOwnership.foundation`
- Each feature's spec files (resolve `requirements/05-features/{feature}/` from manifest; fall back to `docs/05-features/`)

### Internal checks (I1–I12)

- **I1 Feature coverage** — every `manifest.build.features[].id` has a feature folder with PRD.md, HL-STORIES.md, STORIES.md
- **I2 Foundation files exist** — every path in `fileOwnership.foundation` exists on disk
- **I3 Agent store schema** — if `store.json` exists, required fields present: `features`, `tasks`, `bugDataset`, `heartbeat`, `circuitBreaker`, `compliance`
- **I4 Agent file references** — every file path named inside an agent's `.md` exists (critical for Beta reading judgement-model, lexicon, etc.)
- **I5 Hook registrations** — every hook in `settings.json` has a matching script in `paths.hooks`
- **I6 Orphan hooks** — every script in `paths.hooks` is referenced in `settings.json` OR is a lib/helper
- **I7 Mode protocols present** — adhoc and oneshot protocols reference agents that exist in their respective dirs
- **I8 Compliance CLI** — `store.compliance.command` and `store.compliance.fallback` both resolvable (or missing, with fallback documented)
- **I9 Circuit breaker wiring** — oneshot state machine references match `store.circuitBreaker` field states
- **I10 Role completeness** — each build-chain role (builder, evaluator, compliance, qa, redteam, fixer, auditor) has an agent file in the relevant mode dir
- **I11 Known stubs exist** — every file in `store.knownStubs` exists AND contains a stub marker
- **I12 Locked interfaces** — every entry in `store.lockedInterfaces` references a real exported type

---

## Mode: seams — Cross-Layer Seams

Spawn an Explore agent. Focus: **where layers connect, where they contradict.**

### Requirements × Architecture

- **S1 Stories → types** — `STORIES.md` `Data:` fields exist in the project's types file(s) (resolve via `manifest.foundation`)
- **S2 Stories → prompts** — prompt template names in stories match actual template names in code
- **S3 Stories → validation** — error messages and constraint values match validation rules
- **S4 INPUTS → consumers** — every consumed-by feature has a matching story
- **S5 Architecture without stories** — architecture docs describe systems no story asks for (often dead weight)
- **S6 Stories without architecture** — stories assume systems architecture doesn't describe (gap to fill)

### Skills × Hooks

- **S7 Hook coverage** — every hook in `settings.json` is known to at least one `/hooks:*` skill
- **S8 Skill enforcement backing** — skills claiming enforcement have backing hooks (not just aspirational)
- **S9 Hook-skill version sync** — hook file mtime later than the skill that documents it → warn
- **S10 Missing automation** — patterns that appear in learnings.jsonl as repeated but have no hook/skill enforcement

### Docs × Agents

- **S11 Reference docs in agent read-lists** — every doc in `.claude/project/reference/` is referenced by at least one agent or skill (or intentionally archived)
- **S12 Agent `.system/` consistency** — files an agent is told to read exist (critical — Beta reads 5 files on every invocation)
- **S13 Cross-session inbox wiring** — smart-context.js reads inbox, session:write writes to it, both use paths from `paths.json`

### Field rename detection

Scan `git log --diff-filter=R -M --name-status HEAD~20..HEAD -- <types file>` — if any renames detected in recent history, grep all docs, stories, and prompts for the OLD name. Flag as HIGH severity.

---

## Mode: health — Documentation Health

Spawn an Explore agent. Focus: **each doc layer's quality in isolation.**

### Foundation docs (00-canonical)

Resolve directory: `requirements/00-canonical/` (or legacy `docs/00-canonical/`).

- **H1 Template coverage** — expected files present: `CORE_BRIEF.md`, `PRODUCT_MODEL.md`, `GLOSSARY_TEMPLATE.md` (or filled), `GOLDEN_PATHS.md`, `USER_COHORTS.md`, `FAILURE_STATES.md`
- **H2 Glossary alignment** — terms in GLOSSARY match constants, code identifiers
- **H3 No TODO/PLACEHOLDER** in filled versions
- **H4 Cross-consistency** — PRODUCT_MODEL scope matches CLAUDE.md

### Architecture docs (04-architecture)

- **H5 STACK.md, DATA_FLOW.md, SECURITY.md** — present, non-empty, current
- **H6 DATA_FLOW matches code paths** — every producer-consumer pair resolves

### Feature docs (05-features)

For every feature folder:
- **H7 Required files** — `PRD.md`, `HL-STORIES.md`, `STORIES.md`
- **H8 Optional but recommended** — `INPUTS.md`, `COPY.md`
- **H9 GUIDANCE comments stripped** — filled-in docs shouldn't have `<!-- GUIDANCE: -->` blocks remaining
- **H10 No stale STALE markers** — `<!-- STALE -->` banners older than 7 days → flag

### Infrastructure data

- **H11 Events log writable** — `paths.events/events.jsonl` exists, appendable
- **H12 Learnings bounded** — `paths.memory/learnings.jsonl` has <200 active entries (warn >100)
- **H13 Systems manifest** — `paths.memory/systems.jsonl` present, entries match `.claude/agents/` + `scripts/hooks/` + `.claude/commands/`
- **H14 Maps fresh** — no map in `paths.maps/` older than 14 days
- **H15 Stale markers sane** — `paths.maps/.stale.json` orphans cleared after regen
- **H16 Paths registry complete** — every path used by hooks/skills is listed in `paths.json`

### Auto-fixable items (report, don't apply without flag)

- Malformed JSON files → reformat
- Orphan STALE markers older than 7 days → clear
- Missing required templates → scaffold from WarpOS `requirements/` templates
- Unwired hooks (script exists, not in settings.json) → propose registration
- Orphan hooks (script with no users) → propose deletion

---

## Output format

### Markdown (default)

```markdown
# Architecture Integrity Report — {mode}

## Summary
| Severity | Count | Auto-fixable |
|----------|-------|--------------|
| Critical | N | N |
| High     | N | N |
| Medium   | N | N |
| Low      | N | N |

## Critical / High
{Per-finding: check_id, layer, file, message, suggested fix}

## Trends
{If multiple runs: which issues are new, which are recurring}

## Next Actions
1. {First fix} — {why it matters}
2. ...
```

### JSON (`--json`)

Array of `{ check, severity, layer, file, message, autoFixable, suggestedFix }`.

---

## When to run

- **Before starting a build session** — `internal` + `seams`
- **After structural renames** (files moved, skills renamed, agents refactored) — full run
- **Weekly/on `/sleep:deep`** — `health` mode for drift
- **When `/warp:health` shows yellow** on architecture items

## Related

- `/check:requirements` — spec-layer health (paired with this)
- `/check:references` — raw file-path integrity (subset of H1, H4, I4)
- `/check:environment` — can we run? (separate concern)
- `/maps:all` — regenerate the maps this skill reads
