# Agent Dispatch Guide

> Reference for dispatching build-chain agents (builder, fixer, reviewer, compliance, qa, redteam, learner) across providers (Claude/OpenAI/Gemini) without blowing up the orchestrator's context.
>
> Last revised: 2026-04-28 (post run-12)

---

## TL;DR — the canonical dispatch rule

> **All 7 build-chain roles** (`builder`, `fixer`, `reviewer`, `compliance`, `qa`, `redteam`, `learner`) **MUST** be dispatched via Bash subprocess. **Never use the in-process `Agent` tool for build-chain roles.**

The in-process `Agent` tool returns the entire agent prose response (50–100K tokens per reviewer) into the orchestrator's conversation. Bash subprocess captures stdout to a file; orchestrator reads only the parsed JSON envelope (~1–3KB). That's a **50–100x context-cost differential** per dispatch.

The `Agent` tool remains acceptable for research roles (`Explore`, `Plan`, `general-purpose`) and for `beta` user-facing consultation. ONLY the 7 build-chain roles are forbidden.

---

## Architecture overview

```
Delta (orchestrator)
  │
  ├── 1. Compose prompt (Node script)
  │     ├── delta-dispatch-builder.js <feature>            # builder/fixer prompts
  │     ├── delta-build-reviewer-prompt.js <role> <feature> <cwd> <out>   # reviewer prompts
  │     └── delta-build-fix-brief.js <feature>             # unified fix brief
  │
  ├── 2. Bash run_in_background: bash launch.sh
  │     │
  │     ├── ANTHROPIC route (builder, fixer):
  │     │     git worktree add -B agent/X .worktrees/wt-X HEAD
  │     │     cd .worktrees/wt-X
  │     │     claude -p --model sonnet-4-6 --effort max --agent builder "$(cat prompt.txt)" \
  │     │       > output.json 2>&1
  │     │
  │     ├── OPENAI route (reviewer, compliance, qa, learner):
  │     │     OPENAI_FLAGSHIP_MODEL=gpt-5.4 \
  │     │     node scripts/dispatch-agent.js reviewer prompt.txt > output.json
  │     │       └── providers.js execSync:
  │     │             codex exec --full-auto -c model_reasoning_effort=xhigh -m gpt-5.4 -
  │     │             (prompt piped via stdin; cwd = project root)
  │     │
  │     └── GEMINI route (redteam):
  │           node scripts/dispatch-agent.js redteam prompt.txt > output.json
  │             └── providers.js execSync:
  │                   gemini -m gemini-3.1-pro-preview -p "Process the instructions on stdin and produce the requested output." -o json
  │
  └── 3. Wait for notification → read JSON envelope
        ├── Read ONLY: wc -c output.json first; if real, parse the inner JSON
        ├── parseProviderJson extracts the LAST ```json fence
        └── Aggregate via delta-aggregate-reviews.js (returns 30-line table)
```

---

## Provider routing (single source of truth)

`manifest.agentProviders` maps each role to a provider. `providers.js` reads it via `getProviderForRole(role)`.

**Recommended assignment** (post run-12):

| Role | Provider | Model | Effort |
|---|---|---|---|
| `builder` | claude | `sonnet-4-6` | max |
| `fixer` | claude | `sonnet-4-6` | high |
| `reviewer` | openai | `gpt-5.5` (or `gpt-5.4` until Codex CLI ≥ 0.118) | xhigh |
| `compliance` | openai | same | xhigh |
| `learner` | openai | `gpt-5.4-mini` | high |
| `qa` | openai | `gpt-5.4-mini` | medium |
| `redteam` | gemini | `gemini-3.1-pro-preview` | implicit (always-on for pro tier) |

**Cross-provider diversity is mandatory.** Same-model self-review is blind to shared failure modes. Every gauntlet must include at least one non-Anthropic reviewer.

---

## Prompt assembly rules

### Claude-native (builder, fixer)
- Claude's Agent tool follows `@path` and Read tool calls implicitly inside the prompt.
- BUT: we still inline HYGIENE.md (5KB), top-5 bug patterns, file scope, and the agent contract directly because re-fetching across many prompts wastes the prompt cache hit.
- Files: `delta-dispatch-builder.js` (line ~95+) writes `<feature>-prompt.txt` with all of this baked in.

### Cross-provider (codex, gemini) — MANDATORY INLINING
- Codex/Gemini stdin **cannot** follow file references. Whatever you don't paste into the prompt body, the agent doesn't see.
- Every spec doc, every built file the reviewer needs, must be inlined as `--- BEGIN file: <path> ---\n<content>\n--- END file ---` blocks before dispatch.
- `delta-build-reviewer-prompt.js` does this — it reads the feature's owned files from a worktree path (or `.` for merged code) and inlines them into the prompt.
- Result: prompt sizes are 80–180KB. That's normal and expected.

---

## Output handling — keep the orchestrator lean

Every dispatch writes to `.claude/runtime/dispatch/<role-or-feature>-output.json`. The orchestrator should:

1. **Check size first**: `wc -c <file>`. A 1-byte output means the agent never produced an envelope (typically maxTurns hit or auth failure).
2. **Don't tail or cat the full output**. Use `head -c 300` if you need to peek; `parseProviderJson` for the structured part.
3. **Run aggregation via Node script** — never reconstruct status by reading raw envelopes.
   - `delta-aggregate-reviews.js [features...]` — returns pass/fail per feature × role
   - `delta-show-findings.js <feature> <role>` — peek at one envelope's inner JSON

### JSON envelope contract

Every build-chain agent ends its output with a fenced JSON block:
```json
{
  "status": "built" | "fixed" | "isolation-violation" | ...,
  "feature": "<name>",
  "branch": "agent/<feature>",
  "files_modified": ["..."],
  "commit_sha": "...",
  "typecheck_clean": true | false,
  "notes": "<brief, ≤500 chars>"
}
```

`parseProviderJson` extracts the **last** ```json fence in the response. Any narrative before it is "prose-leak" — logged as a warning but the envelope still parses.

### Reviewers emit role-specific shapes

- **Evaluator**: `{ feature, pass, score (0-100), violations[], warnings[], scopeViolations[], groundingFailures[] }`
- **Compliance**: `{ feature, pass, droppedRequirements[], phantomCompletions[], hardcodedValues[], missingEdgeCases[], cosmeticViolations[] }`
- **QA**: `{ scan_type, files_checked, findings[{persona, severity, file, line, evidence}], flow_traces[], data_flows[], state_diffs[], timing_analysis[], contract_checks[], lifecycle_audit[] }`
- **Red Team**: `{ scanDate, pass, vulnerabilities[{severity, category, file, line, description, recommendation}] }`

---

## Worktree isolation (build-chain only)

Builders and fixers must run in `.worktrees/wt-<feature>` (built from current HEAD). Reviewers don't need worktree isolation — they're read-only.

### Builder pattern
```bash
WT_DIR=".worktrees/wt-${feature}"
[ -d "$WT_DIR" ] && git worktree remove --force "$WT_DIR"
git worktree prune
git worktree add -B "agent/${feature}" "$WT_DIR" HEAD
cd "$WT_DIR"
claude -p --model ... --agent builder "$(cat prompt.txt)" > output.json 2>&1
```

The `-B` force-resets `agent/<feature>`. This is intentional — old commits remain reachable from `skeleton-testN-1` history; only the branch label moves.

### Fixer pattern
Same as builder but creates a fresh `agent/<feature>-fix-<N>` branch. `delta-dispatch-fixer.js <feature> <attempt>` handles this.

### Continuation pattern (for maxTurns recovery)
When a builder hits maxTurns mid-feature:
1. Detect: `wc -c <feature>-output.json` < 100B + uncommitted changes in worktree.
2. Commit partial work to `agent/<feature>`.
3. **Re-create worktree from agent/<feature>** (NOT HEAD): `git worktree add .worktrees/wt-<feature> agent/<feature>`. This preserves the partial commit.
4. Compose a continuation prompt listing already-done files and remaining files (custom — see `.claude/runtime/dispatch/backend-continue-prompt.txt` example).
5. Re-dispatch.

---

## Smoke test before first dispatch

`scripts/delta-canonical-dispatch-smoke.js` must pass at preflight. It probes each provider with a tiny "Reply OK" prompt and writes `.claude/runtime/.canonical-dispatch-smoke-passed` on success (4-hour TTL).

**Known false-positive (run-12)**: smoke invokes codex with no `-m` flag (uses default), but `dispatch-agent.js` passes explicit `-m gpt-5.5`. If 5.5 is unavailable on the installed Codex CLI version, smoke passes but real dispatch fails. **Fix**: smoke should use the same model that dispatch will use (read `OPENAI_FLAGSHIP_MODEL` env).

---

## Identity gating (subtle bug class)

When hooks check agent role names (e.g., for team-guard), use **exact-match-after-normalize**, never substring:

```js
// WRONG — name.includes('beta') matches 'rocket-beta'
if (name.includes('beta')) { ... }

// RIGHT
const normalized = name.toLowerCase().trim();
if (normalized === 'beta') { ... }
```

Same applies to feature-name matching in dispatch hooks.

---

## When `thinking` is enabled

For Claude 4.x adaptive-thinking models (opus-4-7, sonnet-4-6 with effort), `tool_choice` must be `auto` or `none`. `any` and specific-tool requests return HTTP 400. This affects multi-agent dispatchers — if you're constraining tools, do it at the agent-spec level (`disallowedTools`), not via API params.

---

## Concurrency caps (added 2026-04-29 after run-12 retro)

Provider CLIs aren't all equally happy with parallel calls. Run-12 retro flagged: **Gemini works fine 1-by-1 but consistently fails when 15+ launch concurrently** during the redteam gauntlet — roughly ⅔ of analyses lost.

**Solution:** dispatch-layer slot allocator (`scripts/hooks/lib/concurrency-lock.js`) wired into `dispatch-agent.js`. Every cross-provider dispatch acquires a per-provider slot before invoking the CLI. When the cap is hit, callers wait; when the wait exceeds `DISPATCH_SLOT_TIMEOUT_MS` (default 10 min), the dispatcher returns `fallback: true` so the orchestrator routes the remaining calls to Claude.

**Default caps:**

| Provider | Cap | Env override |
|---|---|---|
| `gemini` | 3 | `GEMINI_MAX_CONCURRENCY` |
| `openai` | 10 | `OPENAI_MAX_CONCURRENCY` |
| `claude` | 32 | `CLAUDE_MAX_CONCURRENCY` |

Slots are file-locks at `.claude/runtime/dispatch-locks/<provider>/`. Stale locks (>20 min, longer than `runProvider`'s 15 min cap) are auto-pruned, so a killed process never permanently leaks a slot. Smoke test: `node scripts/test-concurrency-lock.js` — spawns 5 workers with cap=2 and verifies serialization.

**When to tune:**
- If you observe `fallback: true` errors mentioning concurrency-cap-full → raise the cap.
- If you see API rate-limit responses despite the cap → lower the cap.
- If gemini concurrency rejects come back (e.g. SDK upgrade fixes the underlying limit) → bump `GEMINI_MAX_CONCURRENCY` to 8 or higher.

---

## Run-12 lessons baked in

| Lesson | Permanent change |
|---|---|
| Builder maxTurns 80 too low for 12-file features | bumped to 200 in builder.md frontmatter |
| Fixer maxTurns 40 too low for unified briefs | bumped to 200 in fixer.md frontmatter |
| `runProvider` 120s timeout fails on xhigh + 175KB prompts | bumped to 900s in providers.js |
| Gemini `--version` cold-start spikes >5s on Windows | `cliAvailable` timeout bumped to 30s |
| Builder default opus-4-7 is overkill for skeleton work | `delta-dispatch-builder.js` default switched to sonnet-4-6 |
| Codex 0.117 rejects gpt-5.5 | env override `OPENAI_FLAGSHIP_MODEL=gpt-5.4` until CLI upgrade |
| Wide `git checkout -- .` reverts orchestrator's own tooling edits | only checkout specific paths; commit tooling changes immediately |
| Gemini fails ≥15 concurrent dispatches in redteam gauntlet | per-provider slot cap at dispatch layer (default 3 for gemini); fallback to claude on slot timeout |
