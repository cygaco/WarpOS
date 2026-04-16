# WarpOS

An AI operating system for Claude Code. It gives you a team of AI agents that plan, build, review, and learn — so you can focus on what matters.

**Platform:** Windows only (for now)
**Version:** 0.1.0

## What Is This?

You know how using Claude Code feels like talking to a smart colleague? WarpOS turns that colleague into a full team.

Instead of one assistant, you get:
- **An architect** that plans what to build and in what order
- **A judgment model** that catches bad decisions before they cost you time
- **A builder** that writes code in isolated branches so your main code stays clean
- **Reviewers** that automatically check every build for bugs, security issues, and spec compliance

Plus **66 skills** (commands you can run like `/fix:fast` or `/research:deep`), **25 automated hooks** (things that happen automatically, like secret scanning and code formatting), and a **learning system** that remembers what works across sessions.

## Quick Start

### What You Need

1. **Claude Code** — the CLI tool from Anthropic
2. **Node.js 18+** — the hooks are JavaScript
3. **Git** — for version control and builder isolation

### Install

```powershell
# 1. Clone WarpOS (you need an invite)
git clone https://github.com/cygaco/WarpOS.git

# 2. Run the installer, pointing it at your project
powershell -ExecutionPolicy Bypass -File WarpOS/install.ps1 path/to/your/project
```

That's it. The installer:
- Creates the directory structure your project needs
- Copies all agents, skills, and hooks
- Detects your tech stack and configures everything
- Sets up automated hooks for code quality and security
- Generates a project manifest

### Verify

Open Claude Code in your project. Type:

```
/warp:health    — Check that everything is set up correctly
/warp:tour      — Get a guided introduction to everything
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
├── CLAUDE.md              — Alex identity doc (copied to your project)
├── AGENTS.md              — Agent system router (copied to your project)
├── install.ps1            — Windows installer entry point
├── .claude/               — The AI operating system
│   ├── agents/            — 4 Alex agents + build agents per mode
│   │   ├── 00-alex/       — Alpha, Beta, Gamma, Delta
│   │   ├── 01-adhoc/      — Adhoc mode agents (builder, evaluator, QA, etc.)
│   │   └── 02-oneshot/    — Oneshot mode agents + state machine docs
│   ├── commands/          — 66 skills (slash commands)
│   └── project/reference/ — Reasoning frameworks, operational loop
├── scripts/hooks/         — 25 automated hooks + lib modules
├── requirements/          — Documentation templates (PRD, stories, architecture)
│   ├── 00-canonical/      — Product foundations (brief, model, glossary)
│   ├── 01-09/             — Design, copy, architecture, security, testing, CI/CD
│   └── 05-features/       — Feature spec templates + example
├── patterns/              — Validated implementation patterns
├── schemas/               — Reusable TypeScript interfaces
└── templates/             — Stack-specific templates (Next.js, Playwright)
```

> **Note:** The `.claude/` directory in this repo IS the framework. When installed into your project, its contents are copied to your project's `.claude/` directory. The file paths inside agent specs reference `.claude/agents/...` — those paths are correct for the installed location in your project.

## All Skills

<details>
<summary>Click to see all 66 skills</summary>

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

### Red Team & Security
- `/redteam:full` — Full red team audit (11 personas)
- `/redteam:scan` — Quick deterministic security scan
- `/reqs:review` — Review requirement drift entries

### Other
- `/beta:mine` — Mine patterns from user behavior
- `/fav:list` — Browse favorite moments
- `/fav:search` — Search favorites
- `/ui:review` — Design system compliance audit
- `/check:refs` — Cross-file reference integrity
- `/warp:health` — Verify WarpOS installation
- `/warp:tour` — Guided introduction
</details>

## Agents

| Agent | Symbol | Role |
|-------|--------|------|
| Alex Alpha (α) | Lead | Architect, orchestrator, main session |
| Alex Beta (β) | Judge | Simulates user judgment, routes decisions |
| Alex Gamma (γ) | Builder | Adhoc feature builds, dispatches sub-agents |
| Alex Delta (δ) | Runner | Oneshot full skeleton builds |

Plus build agents for each mode: Builder, Evaluator, Compliance, Auditor, QA (with 13 failure-mode personas), Red Team (with 11 security personas), and Fix Agent. 38 agent files total.

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

## Your Project

When you install WarpOS, it creates a `manifest.json` in your `.claude/` directory. This tells Alex about your project — what framework you use, where your source code lives, what features you're building.

You can customize everything:
- Edit `CLAUDE.md` to tell Alex about your project
- Edit `.claude/manifest.json` to configure hooks and guards
- Create feature specs in your requirements directory
- Use `/skills:create` to add your own custom skills

## Support

Questions? Issues? Reach out to the person who shared this repo with you. You can also:
- Run `/warp:health` to diagnose issues
- Check the system updates log in `.claude/project/reference/`

## License

Private. Shared by invitation only. Free for initial testers.
