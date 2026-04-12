# WarpOS

An AI operating system for Claude Code. Agents, skills, hooks, memory, reasoning — everything you need to build products with an autonomous AI teammate.

**Platform:** Windows only (for now)
**Version:** 0.1.0

## What Is This?

WarpOS turns Claude Code into an AI operating system called **Alex**. Alex has:

- **4 agent modes** — Solo (just you + Alex), Adhoc (team of 3 agents building features), and Oneshot (full autonomous builds)
- **59 skills** — slash commands for fixing bugs (`/fix:fast`), running retrospectives (`/retro:full`), deep research (`/research:deep`), managing sessions (`/session:handoff`), and more
- **14 hooks** — automated guards that run on every action: format code, check secrets, log events, enhance prompts with AI
- **Reasoning engine** — classifies every problem, selects the right framework, scores fix quality 0-4
- **Learning system** — logs lessons, promotes them through validation, turns patterns into enforced rules
- **Memory** — event log, learnings, traces, cross-session inbox. Alex remembers across sessions
- **Requirements system** — templates for PRDs, user stories, architecture docs, design systems

## Quick Start

### Prerequisites

1. **Claude Code** — [Install from Anthropic](https://claude.ai/code)
2. **Node.js** — v18+ (hooks are Node scripts)
3. **Git** — for version control

### Install (Manual — MVP)

```bash
# 1. Clone WarpOS (you need repo access)
git clone https://github.com/cygaco/WarpOS.git ~/.warp

# 2. Copy framework to global Claude Code config
mkdir -p ~/.claude/scripts/hooks/lib ~/.claude/commands
cp -r ~/.warp/scripts/hooks/* ~/.claude/scripts/hooks/
cp -r ~/.warp/framework/commands/* ~/.claude/commands/
cp ~/.warp/framework/CLAUDE.md ~/.claude/CLAUDE.md

# 3. Copy requirements templates to your project
cp -r ~/.warp/requirements/ your-project/requirements/
```

### Verify

Open Claude Code in any project. You should see WarpOS skills when you type `/`. Try:

```
/fix:fast     — Quick bug fix
/session:handoff  — Generate a session handoff
/retro:full   — Run a full retrospective
```

## Start Here (5 Core Skills)

| Skill | What it does |
|-------|-------------|
| `/fix:fast` | Quick diagnosis: read error, find cause, fix it, verify |
| `/fix:deep` | Deep fix with framework selection, 5 solutions, root cause analysis |
| `/retro:full` | Full retrospective: context + git log + code diffs, 9 categories |
| `/session:handoff` | Generate rich handoff doc for the next session |
| `/commit:both` | Stage, commit, and push with smart message |

## Structure

```
WarpOS/
├── framework/           — The AI operating system
│   ├── CLAUDE.md        — Alex identity, reasoning engine, operational loop
│   ├── agents/          — 4 Alex agents + 8 general agents
│   ├── commands/        — 59 skills (slash commands)
│   └── reference/       — Reasoning frameworks, skill map
├── requirements/        — Documentation templates (PRD, stories, architecture)
│   ├── 00-canonical/    — Product foundations (brief, model, glossary)
│   ├── 01-09/           — Design, copy, architecture, security, testing, CI/CD
│   └── 05-features/     — Feature spec templates + example onboarding wizard
├── patterns/            — Validated implementation patterns
├── schemas/             — Reusable TypeScript interfaces
├── templates/           — Stack-specific templates (Next.js, Playwright)
├── scripts/hooks/       — 14 automated hooks + lib modules
└── products/            — Product cards (one per project)
```

## All Skills

<details>
<summary>Click to see all 59 skills</summary>

### Build & Fix
- `/fix:fast` — Quick fix (direct investigation)
- `/fix:deep` — Deep fix (framework selection, root cause, prevention)
- `/commit:local` — Stage + commit locally
- `/commit:remote` — Push to remote
- `/commit:both` — Commit + push

### Quality
- `/qa:audit` — Full codebase QA audit (7 failure-mode personas)
- `/qa:check` — Passive QA scan on recent changes
- `/check:arch` — Architecture integrity check
- `/check:env` — Environment readiness audit
- `/check:patterns` — Cross-run intelligence and automation proposals
- `/check:specs` — Spec consistency and drift detection

### Learning & Memory
- `/learn:combined` — Extract learnings from conversation + events
- `/learn:conversation` — Mine conversation for learnings
- `/learn:events` — Mine event log for patterns
- `/learn:ingest` — Ingest external knowledge (files, links, videos)
- `/sleep:deep` — Full consolidation cycle (15-30 min)
- `/sleep:quick` — Light nap (5 min)

### Reasoning
- `/reasoning:run` — Reason through a problem with auto-framework selection
- `/reasoning:log` — Log a reasoning episode
- `/reasoning:score` — Score fix quality (0-4)

### Retrospective
- `/retro:full` — Full retro (9 categories)
- `/retro:code` — Scan git diff for code-level signals
- `/retro:context` — Scan conversation for retro signals

### Research
- `/research:deep` — Multi-model deep research (Claude + OpenAI + Gemini)
- `/research:simple` — Parallel research across 3 models

### Session Management
- `/session:handoff` — Rich handoff document
- `/session:checkpoint` — Force checkpoint save
- `/session:resume` — Load last handoff
- `/session:history` — Browse recent sessions
- `/session:read` — Read cross-session inbox
- `/session:write` — Post to cross-session inbox

### Observability
- `/maps:all` — Refresh all maps
- `/maps:architecture` — App structure map
- `/maps:hooks` — Hook wiring diagram
- `/maps:memory` — Memory store relationships
- `/maps:skills` — Skill dependency graph
- `/maps:systems` — Systems manifest
- `/maps:tools` — Tool registry
- `/maps:enforcements` — Enforcement coverage

### Agent Modes
- `/mode:solo` — Solo mode (just you + Alex)
- `/mode:adhoc` — Team mode (Alpha + Beta + Gamma)
- `/mode:oneshot` — Oneshot build (Delta standalone)

### Infrastructure
- `/skills:create` — Create a new skill
- `/skills:edit` — Edit existing skill
- `/skills:delete` — Delete skill
- `/skills:cleanup` — Audit skills for issues
- `/hooks:add` — Create a new hook
- `/hooks:disable` — Disable a hook
- `/hooks:test` — Test all hooks
- `/hooks:friction` — Find missing hooks
- `/hooks:sync` — Sync hooks to WarpOS

### WarpOS
- `/warp:check` — Compare local vs WarpOS
- `/warp:init` — Initialize WarpOS in a project
- `/warp:sync` — Sync local changes to/from WarpOS

### Preflight
- `/preflight:run` — Pre-run verification (7 passes)
- `/preflight:improve` — Update preflight based on gaps

### Other
- `/beta:mine` — Mine patterns from user behavior
- `/fav:list` — Browse favorite moments
- `/fav:search` — Search favorites
</details>

## Agents

| Agent | Symbol | Role |
|-------|--------|------|
| Alex Alpha (α) | Lead | Architect, orchestrator, main session |
| Alex Beta (β) | Judge | Simulates user judgment, routes decisions |
| Alex Gamma (γ) | Builder | Adhoc feature builds, dispatches sub-agents |
| Alex Delta (δ) | Runner | Oneshot full skeleton builds |

Plus 8 general agents: Auditor, Builder, Compliance, Evaluator, Fix-Agent, Lead, QA, Security.

## Requirements System

Templates for every document type you need to build a product:

| Folder | What |
|--------|------|
| `00-canonical` | Product brief, model, glossary, golden paths |
| `01-design-system` | UX principles, colors, components |
| `02-copy-system` | Voice, tone, microcopy patterns |
| `03-requirement-standards` | PRD, stories, inputs templates |
| `04-architecture` | Stack, data flow, security |
| `05-features` | Feature specs + onboarding example |
| `06-09` | Operations, security review, testing, CI/CD |

All templates include `<!-- GUIDANCE: -->` comments explaining what to write.

## Products

| Product | Status | Description |
|---------|--------|-------------|
| [consumer product](products/consumer-product.md) | Building MVP | Job search wizard — resume → market analysis → targeted resumes → auto-apply |

## Contributing

WarpOS is a private repo. If you have access:

1. Work on your `users/{your-name}/` branch
2. Push product cards, bug reports, suggestions to your branch
3. Vlad reviews and merges to main

Report issues with `/warp:bug` (auto-collects context).

## License

Private. Shared by invitation only.
