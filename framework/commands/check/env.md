---
description: Environment readiness and tooling quality — fast go/no-go or deep audit
---

# /check:env — Environment & Tooling Health

Single owner for "Can we build and run?" Replaces preflight Pass 4 and eval:tooling.

## Input

`$ARGUMENTS` — Mode selection:
- No args or `ready` — Binary go/no-go readiness check (fast, runs commands)
- `audit` — Deep tooling quality audit (thorough, reads everything)
- `hooks` / `skills` / `scripts` / `configs` — Audit sub-focus

---

## Mode: ready — Environment Readiness

Spawn a general-purpose agent (runs commands). Focus: is everything ready to go?

### Checks

- **E1 Kill Active Dev Servers** — `npx kill-port 3000 2>/dev/null || true`. Check for stale Next.js processes. Cleanup step — always run, never fail.
- **E2 Node Modules** — `ls node_modules/.package-lock.json`. If missing: ERROR.
- **E3 Build Passes** — `npm run build 2>&1 | tail -20`. Non-zero exit: ERROR.
- **E4 WorktreeCreate Hook** — scripts/hooks/create-worktree-from-head.js exists and settings.json points to it (not old .claude/hooks/ or .sh version).
- **E5 Gate-Check Hook** — scripts/hooks/gate-check.js exists and uses explicit `feature: <name>` matching.
- **E6 All Hook Scripts Exist** — Every hook command in settings.json has a matching script file.
- **E7 Agent Scripts Exist** — scripts/validate-gates.js, scripts/agent-dashboard.js exist.
- **E8 Copy File Contamination** — `find src docs -name "*- Copy*" -type f`. WARN if found.
- **E9 Git State** — Branch, uncommitted changes, stale worktrees.
- **E10 .gitignore Coverage** — Contains `*- Copy*`.
- **E11 Compliance CLI** — `codex --version`, `gemini --version`. WARN if primary missing.
- **E12 Environment Variables** — Check existence (not values) of ANTHROPIC_API_KEY (required for prompt enhancement). Additional keys read from project-config.json `requiredEnvKeys` if present. WARN if missing.
- **E13 TypeScript Strict Mode** — tsconfig.json `"strict": true`.
- **E14 Next.js Config** — next.config.ts exists with security headers.

### Output

Same JSON array: `{check, severity, file, message, autoFixable}`

Decision: "ENVIRONMENT READY" (0 errors) or "ENVIRONMENT BLOCKED — N errors".

---

## Mode: audit — Deep Tooling Quality

Spawn an Explore agent. Focus: not just "does it work?" but "is it good?"

### 1. Hook System

**Wiring:**
- Every hook in settings.json has a script in scripts/hooks/
- No orphan scripts (on disk but not wired)
- Event names valid, matcher syntax correct
- No duplicates, settings.json valid JSON

**Quality:**
- Error handling (try/catch, exit codes)
- Stdin parsing correct (JSON from Claude Code)
- Platform compatibility (Windows paths, spaces)
- Imports from scripts/hooks/lib/ (not copy-pasted patterns)
- Logging to predictable location

**Performance:**
- Interactive hooks < 100ms
- Total overhead estimate
- Cold start acceptable
- Blocking vs non-blocking appropriateness

**Coverage:**
- HYGIENE rule enforcement hooks exist
- Secret-guard pattern coverage
- Agent workflow gate enforcement
- File protection for sensitive files
- Missing event hook opportunities

**Resilience:**
- Script not found → graceful degradation
- Script crash → doesn't block user
- Timeout behavior defined
- Empty stdin handling

### 2. Skill Ecosystem

**Overlap Detection:**
- Skills doing similar things (flag for merge)
- Skills that should call each other but don't
- Naming conflicts or confusing boundaries

**Health:**
- Every skill has frontmatter with `description`
- No dead references to deleted skills
- No stale file/path references
- Instructions actionable and specific

**Gaps:**
- Missing skills for common workflows
- Pipeline wiring opportunities

**Consistency:**
- Frontmatter format (description required, no extra fields)
- Output format patterns consistent
- Agent usage patterns consistent

### 3. Lint & Build Scripts

- `scripts/lint-*.js` functional and documented
- npm run commands match CLAUDE.md
- PRD sections, HL format, story metadata, FLOW_SPEC gates all linted
- .md files without lint coverage
- Missing automation for recurring manual checks

### 4. Build & Config

**TypeScript:** strict mode, path aliases, include/exclude
**Next.js:** Turbopack, API route config, security headers
**Package:** unused deps, security-relevant versions, .gitignore
**Environment:** .env.local.example matches CLAUDE.md, defaults correct
**Testing:** Playwright config valid, test harness functional

### Output

| Area | Issues | Severity | Auto-fixable |
|------|--------|----------|-------------|
