# Alex Agent System

> Router and table of contents for the multi-agent build system.
> For the full operational specification, see [.system.md](.claude/agents/.system.md).

---

## Agent Team — Alex (the President) and his faces

**Alex is the President** — one identity, shown in different faces by mode. ("Alex" = name; "President" = role.)

| Face | Symbol | What Alex is doing | Spec |
|-------|--------|------|------|
| α | α | Running it — architect, orchestrator | [alpha.md](.claude/agents/president/alpha.md) |
| β | β | Checking it — independent judgment, read-only | [beta.md](.claude/agents/president/beta.md) |
| γ | γ | Delivering — adhoc build (single features) | [gamma.md](.claude/agents/president/gamma.md) |
| δ | δ | Delivering — oneshot build (skeleton runs) | [delta.md](.claude/agents/president/delta.md) |
| ε | ε | Delivering — sprint (full lifecycle) | [epsilon.md](.claude/agents/president/epsilon.md) |

The **departments** (Product, Engineering, Growth — Quality under Product) report to Alex; they are not Alex. Full org: [AGENT-STRUCTURE.md](AGENT-STRUCTURE.md).

## Build Agents

Specs are mode-agnostic and organized by department/pod; role → spec routing comes from the keystone [_org/role-registry.json](.claude/agents/_org/role-registry.json).

| Agent | Role | Spec / Home |
|-------|------|-------------|
| **Builder** | Code writer (scoped, isolated worktree) | [frontend](.claude/agents/engineering/frontend/builder.md) · [backend](.claude/agents/engineering/backend/builder.md) · [security](.claude/agents/engineering/security/builder.md) |
| **Reviewer** | Code quality (Check-7 + holdout-fixture) | [frontend](.claude/agents/engineering/frontend/reviewer.md) · [backend](.claude/agents/engineering/backend/reviewer.md) |
| **QA-Reviewer** | Traceability + integrity + 13 failure-mode personas (absorbs Req-Reviewer, Compliance, QA) | [qa-reviewer](.claude/agents/product/quality/qa-reviewer.md) |
| **Security-Reviewer** | Security scanner — OWASP, injection, attack-chain, prompt-injection (replaces Red Team) | [security-reviewer](.claude/agents/engineering/security/reviewer.md) |
| **Fixer** | Bug fixer (scoped, from structured Fix Brief) | [frontend](.claude/agents/engineering/frontend/fixer.md) · [backend](.claude/agents/engineering/backend/fixer.md) · [security](.claude/agents/engineering/security/fixer.md) |
| **Learner** | Cross-cycle pattern analysis, environment evolution | [learner](.claude/agents/_system/learner.md) |
| **Stub-Scaffold** | Regenerates skeleton stub files from current spec | [stub-scaffold](.claude/agents/_system/stub-scaffold.md) |
| **Test-Runner** | Headless Playwright E2E test runner | [test-runner](.claude/agents/product/quality/test-runner.md) |
| **Visual-Review** | Visual UI review via Playwright MCP browser | [visual-review](.claude/agents/product/quality/visual-review.md) |

## Build Modes

| Mode | Purpose | Protocol |
|------|---------|----------|
| **Adhoc** | Single feature builds | [protocol.md](.claude/agents/president/_system/adhoc/protocol.md) |
| **Oneshot** | Full skeleton builds | [protocol.md](.claude/agents/president/_system/oneshot/protocol.md) |
| **Sprint** | Full lifecycle (plan→design→build→gauntlet→release→retro) | [epsilon-runtime.js](scripts/sprint/epsilon-runtime.js) |

**Adhoc team** (α + β + γ) is the default for development. **Oneshot** is a standalone Delta session (no team — Delta IS the session). **Sprint** is Epsilon conducting the full lifecycle via the registry-driven runtime. **Solo** (Alpha alone) is rare.

## Key Documents

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](CLAUDE.md) | Framework config, identity pointer, memory system |
| [PROJECT.md](PROJECT.md) | Project-specific context (product, architecture, env) |
| [.system.md](.claude/agents/.system.md) | Full operational specification |
| [manifest.json](.claude/manifest.json) | WarpOS identity card — project metadata, features, phases, providers |
| [paths.json](.claude/paths.json) | Centralized path registry — all hooks/scripts read paths from here |

## Dispatch Templates (by department)

| Directory | Purpose |
|-----------|---------|
| [president/](.claude/agents/president/) | The 5 Alex faces (α/β/γ/δ/ε) + `.system/` policy, ADRs, mode protocols |
| [engineering/](.claude/agents/engineering/) | Frontend/backend/security pods — builder, reviewer, fixer, leads, director |
| [product/](.claude/agents/product/) | Product + Quality (qa-reviewer, design-quality, visual-review, test-runner), leads, director |
| [growth/](.claude/agents/growth/) | Growth dept — research, copy, conversion, marketing leads, director |
| [_org/](.claude/agents/_org/) | Keystone `role-registry.json` — the role ↔ spec source of truth |

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
4. **alpha.md / beta.md / gamma.md / delta.md / epsilon.md** — individual agent identities
5. **.system.md** — detailed operational spec
6. **president/_system/{mode}/protocol.md** — mode-specific orchestration
7. **.claude/manifest.json** — project metadata, features, agent providers
8. **.claude/paths.json** — centralized path registry
