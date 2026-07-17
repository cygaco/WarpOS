# WarpOS

An AI operating system for Claude Code. It gives you a team of AI agents that plan, build, review, and learn — so you can focus on what matters.

**Platform:** Windows only (for now)
**Version:** 0.8.0
**Skills:** ~140 slash commands
**Hooks:** 57 automated hooks (54 enabled by default)

_Last verified: 2026-05-19_

## What Is This?

You know how using Claude Code feels like talking to a smart colleague? WarpOS turns that colleague into a full team.

Instead of one assistant, you get:
- **An architect** that plans what to build and in what order
- **A judgment model** that catches bad decisions before they cost you time
- **A builder** that writes code in isolated branches so your main code stays clean
- **Reviewers** that automatically check every build for bugs, security issues, and spec compliance

Plus **~140 skills** (commands you can run like `/fix:fast` or `/research:deep`), **57 automated hooks** (things that happen automatically, like secret scanning and code formatting), and a **learning system** that remembers what works across sessions.

## Quick Start

### What You Need

1. **Claude Code** — the CLI tool from Anthropic
2. **Node.js 18+** — the hooks are JavaScript
3. **Git** — for version control and builder isolation

### Install

```
Open your project in your IDE of choice, then open a fresh terminal and:

# 1. Clone WarpOS
git clone https://github.com/cygaco/WarpOS.git

# 2. Run the installer
node ../WarpOS/scripts/warp-setup.js

# 3
Run claude in your terminal, and perform:
/warp:setup to finish up, and then
/warp:tour to learn about the system.
```

That's it. The installer:
- Creates the directory structure your project needs
- Copies all agents, skills, and hooks
- Detects your tech stack and configures everything
- Sets up automated hooks for code quality and security
- Generates a project manifest

### Optional: provider CLIs (recommended)

WarpOS runs a **provider-by-department** model spread — reviewers run on a *different* AI lab than the one that generated the code, because same-model review is blind to shared failure modes. By default:

- **Engineering** builds on **Claude** (`claude-sonnet-5`); its code-quality reviewers run on **OpenAI** (`gpt-5.6-sol`, via the Codex CLI) — cross-lab by construction
- **Product + Growth** judgment and authoring run on **OpenAI** (the `gpt-5.6` family)
- **Security** is a **3-lab panel** — a Claude planner+judge over Gemini + GPT + Claude hunter lanes; it **fails closed** if it loses a lab to fallback
- The President's own tools (β judgment, Cabinet, Ops-Analyst) consult **OpenAI** on-demand via the CLI; everything else stays on Claude

The installer auto-detects these CLIs. **Missing CLIs → graceful fallback to Claude** (still works, just loses cross-lab diversity; the security panel blocks rather than review blind). Full per-role chart: [AGENTS.md § Dispatch Topology & Model Spread](AGENTS.md).

To get full diversity:

```powershell
# OpenAI — Product/Growth judgment + Engineering code-quality reviewers
npm i -g @openai/codex
codex login                         # or: $env:OPENAI_API_KEY = "sk-..."

# Gemini — via the Antigravity `agy` CLI (the individual `gemini` CLI is sunset).
# Used by the security Gemini hunter lane + Growth research-lead; self-auth per the
# Antigravity CLI setup (~/.gemini/antigravity-cli). agy is a standalone binary — pin
# the version you verify.
```

Verify with `/scan:environment` after install.

### Verify

Open Claude Code in your project. Type:

```
/warp:health    — Check that everything is set up correctly
/warp:tour      — Get a guided introduction to everything
```

Then read **[USER_GUIDE.md](USER_GUIDE.md)** — the daily-rhythm guide. Modes, the five-terminal setup, skill sequences, and (most important) git discipline.

## Start Here (5 Core Skills)

| Skill | What it does |
|-------|-------------|
| `/fix:fast` | Quick diagnosis: read error, find cause, fix it, verify |
| `/fix:deep` | Deep fix with framework selection, 5 solutions, root cause analysis |
| `/oneshot:retro` | Full retrospective: context + git log + code diffs, 9 categories |
| `/session:handoff` | Generate rich handoff doc for the next session |
| `/commit:land` | Commit, push the branch, then merge into the default branch |

## Structure

```
WarpOS/
├── CLAUDE.md              — Alex identity doc (copied to your project)
├── AGENTS.md              — Agent system router (copied to your project)
├── install.ps1            — Windows installer entry point
├── .claude/               — The AI operating system
│   ├── agents/            — the 5 Alex faces + the org (departments + build agents)
│   │   ├── president/     — Alpha, Beta, Gamma, Delta, Epsilon (the 5 faces)
│   │   ├── engineering/   — Engineering department agents
│   │   ├── product/       — Product department agents (Quality lives here)
│   │   ├── growth/        — Growth department agents
│   │   └── _org/          — Role registry (the org keystone)
│   ├── commands/          — 95 skills (slash commands)
│   └── project/reference/ — Reasoning frameworks, operational loop
├── scripts/hooks/         — 52 automated hooks + lib modules
├── _requirements/          — Documentation templates (PRD, stories, architecture)
│   ├── 00-canonical/      — Product foundations (brief, model, glossary)
│   ├── 01-09/             — Design, copy, architecture, security, testing, CI/CD
│   └── 05-features/       — Feature spec templates + example
├── patterns/              — Validated implementation patterns
```

> **Note:** The `.claude/` directory in this repo IS the framework. When installed into your project, its contents are copied to your project's `.claude/` directory. The file paths inside agent specs reference `.claude/agents/...` — those paths are correct for the installed location in your project.
>
> Canonical-repo-local scratch — per-run artifacts under `runtime/`, the `WarpOS-v1/` rebuild-charter corpus, and `CODEX-LOG.md` — is gitignored and manifest-walk-skipped, so it stays on the maintainer's disk and never ships in an install or the public image.

## All Skills

<details>
<summary>Click to see the skill catalog</summary>

> **Partial snapshot.** The catalog below is curated and may lag the live registry. The authoritative count and listing live under `.claude/commands/` after install — run `/skills:list` for the current state. Sprint workflow skills (`/sprint:plan`, `/sprint:design`, `/sprint:execute`, `/sprint:release`, `/sprint:retrospective`) and per-system check skills (`/scan:warpos-*`) ship alongside the categories below.

### Build & Fix
- `/fix:fast` — Quick fix (direct investigation)
- `/fix:deep` — Deep fix (framework selection, root cause, prevention)
- `/commit:local` — Stage + commit locally
- `/commit:remote` — Push to remote
- `/commit:land` — Commit + push branch + merge to default branch

### Quality & Checks
- `/qa:audit` — Full codebase QA audit (failure-mode personas)
- `/qa:check` — Passive QA scan on recent changes
- `/scan:full` — Run every check in parallel — unified report
- `/scan:architecture` — Architecture integrity check
- `/scan:coherence` — System coherence graph (15 drift types)
- `/scan:design-system` — Design-system compliance scan
- `/scan:environment` — Environment readiness audit
- `/scan:install` — Verify a fresh WarpOS install
- `/scan:patterns` — Cross-run intelligence and automation proposals
- `/scan:privacy` — Pre-publish scan for personal data
- `/scan:references` — Cross-file reference integrity
- `/scan:requirements` — Spec consistency and drift detection
- `/scan:system` — System inventory vs manifest
- `/scan:timeline` — Reconstruct a build timeline

### Red Team & Security
- `/redteam:full` — Full red team audit (11 personas)
- `/redteam:scan` — Quick deterministic security scan

### Learning & Memory
- `/learn:deep` — Combined learning extraction (conversation + events + retros)
- `/learn:ingest` — Ingest external knowledge (files, links, videos)
- `/learn:integrate` — Promote validated learnings into enforcement
- `/sleep:deep` — Full consolidation cycle (15-30 min)
- `/sleep:quick` — Light nap (5 min)

### Reasoning
- `/reasoning:run` — Reason through a problem with auto-framework selection
- `/reasoning:log` — Log a reasoning episode
- `/reasoning:score` — Score fix quality (0-4)

### Research
- `/research:deep` — Multi-model deep research (Claude + OpenAI + Gemini)
- `/research:simple` — Parallel research across 3 models

### Session Management
- `/session:handoff` — Rich handoff document
- `/session:checkpoint` — Force checkpoint save
- `/session:resume` — Load last handoff
- `/session:history` — Browse recent sessions
- `/session:recap` — Catch up on the last N turns
- `/session:read` — Read cross-session inbox
- `/session:write` — Post to cross-session inbox
- `/session:takenotes` — Append a timestamped note

### Observability — Maps
- `/maps:all` — Refresh all maps
- `/maps:architecture` — App structure map
- `/maps:enforcements` — Enforcement coverage
- `/maps:hooks` — Hook wiring diagram
- `/maps:memory` — Memory store relationships
- `/maps:skills` — Skill dependency graph
- `/maps:steps` — Regenerate step tables in canonical docs
- `/maps:systems` — Systems manifest graph
- `/maps:tools` — Tool registry

### Discovery
- `/discover:orphaned` — Find deferred or abandoned work
- `/discover:systems` — Multi-angle system discovery (6 lenses)

### Agent Modes
- `/mode:solo` — Solo mode (just you + Alex)
- `/mode:adhoc` — Team mode (Alpha + Beta + Gamma)
- `/mode:oneshot` — Oneshot build (Delta standalone)
- `/mode:sprint` — Sprint mode (Epsilon conducts the full plan→build→gauntlet→release→retro lifecycle)

### Oneshot
- `/oneshot:start` — Lightweight kickoff
- `/oneshot:preflight` — Pre-run preflight (branch + skeleton + 7-pass audit)
- `/oneshot:improve` — Update preflight passes based on gaps
- `/oneshot:retro` — Post-run retrospective (9 categories)

### Skills & Hooks Infrastructure
- `/skills:create` — Create a new skill
- `/skills:edit` — Edit existing skill
- `/skills:delete` — Delete skill
- `/skills:cleanup` — Audit skills for issues
- `/hooks:add` — Create a new hook
- `/hooks:disable` — Disable a hook
- `/hooks:test` — Test all hooks
- `/hooks:friction` — Find missing hooks
- `/hooks:sync` — Sync hooks to WarpOS

### Issues
- `/issues:list` — List recurring system issues
- `/issues:log` — Record a new instance of a recurring issue
- `/issues:resolve` — Mark a recurring issue resolved
- `/scan:issues` — Pattern-mine events for repeat audit-block signatures

### Paths Registry
- `/paths:add` — Add a paths registry key
- `/paths:convert` — Convert hardcoded literals to `paths.*`
- `/paths:coverage` — Path registry documentation coverage
- `/paths:doctor` — Validate path registry
- `/paths:explain` — Explain one paths registry key
- `/paths:rename` — Rename a paths registry key

### WarpOS
- `/warp:setup` — Initialize WarpOS in a project
- `/warp:update` — Pull canonical WarpOS into this install (primary inbound)
- `/warp:promote` — Push framework changes to canonical (outbound)
- `/warp:release` — Drive a full WarpOS release
- `/warp:check` — Compare local vs WarpOS
- `/warp:health` — Verify WarpOS installation
- `/warp:doctor` — Unified WarpOS diagnostic
- `/warp:tour` — Guided introduction
- `/warp:deprecate` — Create a deprecation proposal
- `/warp:uninstall` — Clean removal with restore from backup
- `/warp:sync` — DEPRECATED alias for `/warp:update`; removed in 1.0.0

### Karpathy (autoresearch)
- `/karpathy:run` — Closed-loop experiment with autonomous review
- `/karpathy:integrate` — Merge winning artifact into main
- `/karpathy:status` — Read-only status dashboard

### Other
- `/beta:mine` — Mine patterns from user behavior
- `/beta:integrate` — Apply validated recommendations into the judgment model
- `/fav:list` — Browse favorite moments
- `/fav:search` — Search favorites
- `/ui:review` — Design system compliance audit
- `/content:contra` — Create a Contra portfolio post
- `/content:linkedin` — Create a LinkedIn post
</details>

## Agents

| Agent | Symbol | Role |
|-------|--------|------|
| Alex Alpha (α) | Lead | Architect, orchestrator, main session |
| Alex Beta (β) | Judge | Simulates user judgment, routes decisions (read-only) |
| Alex Gamma (γ) | Builder | Adhoc feature builds, dispatches sub-agents |
| Alex Delta (δ) | Runner | Oneshot full skeleton builds |
| Alex Epsilon (ε) | Conductor | Sprint mode — drives the full plan→build→gauntlet→release→retro lifecycle |

Plus build agents, organized into departments (`engineering`, `product`, `growth`): Builder + Fixer (Claude, isolated worktrees), a cross-lab **Code-quality Reviewer** (GPT, Check-7 + holdout-fixture), the **QA-Reviewer** (one role carrying traceability + integrity + 13 failure-mode personas — absorbs the former Req-Reviewer, Compliance, and QA agents), and the **Security-Reviewer 3-lab panel** (replaces Red Team; Gemini + GPT + Claude hunters under a Claude judge, fails closed on lab-diversity loss). Plus Ops-Analyst (cross-cycle pattern analysis, was Learner), Skeleton-Builder (was Stub-Scaffold), Test-Runner, and the Claude-pinned Design-Quality + Visual-Review. ~60 agent spec files under `.claude/agents/`; the keystone role → spec → model map is `.claude/agents/_org/role-registry.json`. See [AGENTS.md](AGENTS.md) for the full dispatch topology.

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
