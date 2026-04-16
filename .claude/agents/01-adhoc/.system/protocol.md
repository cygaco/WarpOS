# Adhoc Build Protocol

Lightweight gauntlet loop for building individual features or tasks outside of full skeleton runs. No state machine, no cycles, no heartbeat management.

## When to use

Alpha dispatches gamma in adhoc mode for:
- Single feature builds during development
- Bug fix gauntlet runs
- Any builder -> evaluator -> fix loop that doesn't need the full oneshot orchestration

## Protocol

### 1. Dispatch builder(s)

Gamma dispatches Layer 2 agents via the `claude` CLI (the Agent tool is not available to teammates):

```bash
claude -p --model sonnet --agent <agent-name> "prompt"
```

Available agents: `builder`, `evaluator`, `security`, `compliance`, `qa`, `fix-agent`, `auditor` (all under `.claude/agents/01-adhoc/`).

- One builder per feature. Sequential dispatches (CLI is blocking).
- Pass the feature spec (PRD + stories) and the adhoc prompt template.

### 2. Run gauntlet

After builder completes, dispatch each reviewer via CLI:
- **Evaluator** — 5-check review protocol (structural, grounding, coverage, negative, open-loop)
- **Security** — OWASP Top 10 + project-specific checks
- **Compliance** — spec adherence + code quality
- **QA** — 7 failure-mode personas

Dispatch sequentially (CLI `-p` is blocking). Collect ALL four results before proceeding.

### 3. Fix cycle (if needed)

If any gauntlet reviewer reports failures:
1. Merge all findings into a single fix brief
2. Dispatch fix-agent via CLI: `claude -p --model sonnet --agent fix-agent "fix brief..."`
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
      security: "pass" | "fail"
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
