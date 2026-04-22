# Adhoc Build Protocol

Lightweight gauntlet loop for building individual features or tasks outside of full skeleton runs. No state machine, no cycles, no heartbeat management.

## When to use

Alpha dispatches gamma in adhoc mode for:
- Single feature builds during development
- Bug fix gauntlet runs
- Any builder -> evaluator -> fix loop that doesn't need the full oneshot orchestration

## Protocol

> ### ⚠ CANONICAL DISPATCH — NO EXCEPTIONS
>
> **All build-chain roles** (`builder`, `fixer`, `evaluator`, `compliance`, `qa`, `redteam`) **MUST** be dispatched via Bash subprocess — `claude -p --agent <role>` for Claude-routed, `node scripts/dispatch-agent.js <role>` for OpenAI/Gemini-routed. **Do NOT use the in-process `Agent` tool** for any of these roles, even when running locally as Claude. The `Agent` tool returns the full agent response into the orchestrator conversation; Bash dispatch captures stdout and parses only the JSON envelope. See `.claude/agents/00-alex/gamma.md` Dispatch Method for the full reference pattern.

### 1. Dispatch builder(s)

Gamma dispatches Layer 2 agents via the `claude` CLI (the Agent tool is not available to teammates):

```bash
claude -p --model sonnet --agent <agent-name> "prompt"
```

Available agents: `builder`, `evaluator`, `compliance`, `qa`, `redteam`, `fixer` (all under `.claude/agents/01-adhoc/`). Note: `auditor` is oneshot-only — adhoc has no auditor in the gauntlet.

- One builder per feature. Sequential dispatches (CLI is blocking).
- Pass the feature spec (PRD + stories) and the adhoc prompt template.

### 2. Run gauntlet

After builder completes, dispatch each reviewer via CLI:
- **Evaluator** — 5-check review protocol (structural, grounding, coverage, negative, open-loop)
- **Compliance** — spec adherence + code quality
- **QA** — 7 failure-mode personas
- **Redteam** — OWASP Top 10 + adversarial patterns + security-sensitive code review

Dispatch sequentially (CLI `-p` is blocking). Collect ALL four results before proceeding.

### 3. Fix cycle (if needed)

If any gauntlet reviewer reports failures:
1. Merge all findings into a single fix brief
2. Dispatch fixer via CLI: `claude -p --model sonnet --agent fixer "fix brief..."`
3. Max 3 fix attempts per feature
4. After each fix: targeted re-review (only re-check what failed)

### 4. Report

Return structured GAMMA_RESULT to caller:

```
GAMMA_RESULT:
  scope: "<feature-name or task>"
  mode: "adhoc"
  status: "pass" | "fail" | "halted"
  features_completed: [...]
  features_failed:
    - name: "<feature>"
      reason: "<why>"
      fix_attempts: <N>
  gate_checks:
    - feature: "<name>"
      evaluator: "pass" | "fail"
      compliance: "pass" | "fail" | "skipped"
      redteam: "pass" | "fail"
      qa: "pass" | "fail"
  halt_reason: "<if halted>"
  next_recommendation: "<what gamma thinks should happen next>"
```

## What adhoc does NOT do

- No store.json state machine updates
- No cycle counting or heartbeat management
- No points/XP/rank calculation
- No lead agent analysis (unless caller requests)
- No pre-flight skeleton verification
- No phase sequencing — caller decides what to build
