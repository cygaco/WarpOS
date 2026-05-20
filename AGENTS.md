# Alex Agent System

> Router and table of contents for the multi-agent build system.
> For the full operational specification, see [.system.md](.claude/agents/.system.md).

---

## Agent Team

| Agent | Symbol | Role | Spec |
|-------|--------|------|------|
| **Alpha** | α | Architect, orchestrator | [alpha.md](.claude/agents/00-alex/alpha.md) |
| **Beta** | β | Judgment model | [beta.md](.claude/agents/00-alex/beta.md) |
| **Gamma** | γ | Adhoc build orchestrator | [gamma.md](.claude/agents/00-alex/gamma.md) |
| **Delta** | δ | Standalone oneshot orchestrator | [delta.md](.claude/agents/00-alex/delta.md) |

## Build Agents

| Agent | Role | Adhoc | Oneshot |
|-------|------|-------|---------|
| **Builder** | Code writer (scoped, isolated worktree) | [adhoc](.claude/agents/01-adhoc/builder/) | [oneshot](.claude/agents/02-oneshot/builder/) |
| **Reviewer** | 7-check protocol — spec/design (1-6) + code quality (7) | [adhoc](.claude/agents/01-adhoc/reviewer/) | [oneshot](.claude/agents/02-oneshot/reviewer/) |
| **Req-Reviewer** | Requirements ↔ code ↔ test traceability | [adhoc](.claude/agents/01-adhoc/req-reviewer/) | [oneshot](.claude/agents/02-oneshot/req-reviewer/) |
| **Compliance** | Process integrity (branch theft, phantom completion, hygiene) | [adhoc](.claude/agents/01-adhoc/compliance/) | [oneshot](.claude/agents/02-oneshot/compliance/) |
| **QA** | Failure scanner (13 personas, self-orchestrating) | [adhoc](.claude/agents/01-adhoc/qa/) | [oneshot](.claude/agents/02-oneshot/qa/) |
| **Red Team** | Security scanner (11 personas, self-orchestrating) | [adhoc](.claude/agents/01-adhoc/redteam/) | [oneshot](.claude/agents/02-oneshot/redteam/) |
| **Fixer** | Bug fixer (scoped, from structured Fix Brief) | [adhoc](.claude/agents/01-adhoc/fixer/) | [oneshot](.claude/agents/02-oneshot/fixer/) |
| **Learner** | Cross-cycle pattern analysis, environment evolution | — | [oneshot](.claude/agents/02-oneshot/learner/) |
| **Stub-Scaffold** | Regenerates skeleton stub files from current spec | — | [oneshot](.claude/agents/02-oneshot/stub-scaffold/) |
| **Test-Runner** | Headless Playwright E2E test runner | — | [oneshot](.claude/agents/02-oneshot/test-runner/) |
| **Visual-Review** | Visual UI review via Playwright MCP browser | — | [oneshot](.claude/agents/02-oneshot/visual-review/) |

## Build Modes

| Mode | Purpose | Protocol |
|------|---------|----------|
| **Oneshot** | Full skeleton builds | [protocol.md](.claude/agents/02-oneshot/.system/protocol.md) |
| **Adhoc** | Single feature builds | [protocol.md](.claude/agents/01-adhoc/.system/protocol.md) |

**Adhoc team** (α + β + γ) is the default for development. **Oneshot** is a standalone Delta session (no team — Delta IS the session). **Solo** (Alpha alone) is rare.

## Key Documents

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](CLAUDE.md) | Framework config, identity pointer, memory system |
| [PROJECT.md](PROJECT.md) | Project-specific context (product, architecture, env) |
| [.system.md](.claude/agents/.system.md) | Full operational specification |
| [manifest.json](.claude/manifest.json) | WarpOS identity card — project metadata, features, phases, providers |
| [paths.json](.claude/paths.json) | Centralized path registry — all hooks/scripts read paths from here |

## Dispatch Templates (per mode)

| Directory | Purpose |
|-----------|---------|
| [01-adhoc/](.claude/agents/01-adhoc/) | Adhoc mode agents (builder, evaluator, fixer, compliance, qa/, redteam/) |
| [02-oneshot/](.claude/agents/02-oneshot/) | Oneshot mode agents (builder, evaluator, fixer, compliance, auditor, qa/, redteam/) |

## Hard Rules (all agents)

1. **Stay in your lane.** Do not exceed your role's authority.
2. **Do not modify files outside your scope.** Your task defines which files you may touch.
3. **Do not communicate with the user.** Report to your orchestrator (Gamma or Alpha) only.
4. **Do not fix forward.** If your change breaks the build and you cannot fix it within scope, revert and report.
5. **Three attempts maximum.** If you fail 3 times on the same issue, stop and report.
6. **Cross-provider diversity required.** At least one gauntlet agent must run on a different provider.
7. **Decision authority.** Class A/B/C taxonomy, escalation red lines, and scoring rubric live at `paths.decisionPolicy`. Current product stage at `paths.currentStage`. Apply both before requesting a user decision.

## Review Protocol

Every builder output is reviewed by a 4-agent parallel gauntlet:
1. **Evaluator** — 5-check protocol (structural, grounding, coverage, negative, open-loop). Score 0-100.
2. **Compliance** — Process integrity (branch theft, phantom completion, spec adherence, hygiene, hallucinated deps).
3. **Security** — OWASP Top 10 + project-specific vulnerabilities.
4. **QA** — 13 failure-mode personas across scan + analyze modes.

## Reading Order

1. **CLAUDE.md** — framework config, identity pointer
2. **AGENTS.md** (this file) — router to all agent docs
3. **PROJECT.md** — project-specific context
4. **alpha.md / beta.md / gamma.md / delta.md** — individual agent identities
5. **.system.md** — detailed operational spec
6. **{mode}/protocol.md** — mode-specific orchestration
7. **.claude/manifest.json** — project metadata, features, agent providers
8. **.claude/paths.json** — centralized path registry
