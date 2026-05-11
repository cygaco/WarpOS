# Agent Dispatch Guide

Canonical rules for dispatching build-chain agents. Loaded as a mandatory
reference by Gamma (γ) and Delta (δ) at startup and surfaced as a
session-start nudge by `scripts/hooks/session-start.js`. The
`dispatch-route-guard` PreToolUse Bash hook enforces the forbidden-pattern
rules below at write-time — violations are blocked before they reach a
shell.

paths.agentDispatchGuide → `.claude/project/reference/agent-dispatch-guide.md`

## Single safe path

Every cross-provider build-chain dispatch MUST go through:

```bash
node scripts/dispatch-agent.js <role> <prompt-file>
```

This wrapper:

1. Resolves the role's provider from `manifest.agentProviders` /
   `DEFAULT_AGENT_PROVIDERS`.
2. Acquires a per-provider concurrency slot (`concurrency-lock.js`).
3. Invokes the provider via `runProvider` in `scripts/hooks/lib/providers.js`,
   which applies the Windows-stdin fix (LRN-2026-04-17), captures stderr
   for silent-death telemetry, and emits a completion record.
4. Writes a JSON-shaped lock with `dispatch_id`, `role`, `provider`,
   `model`, `prompt_bytes`, `cmdline_checksum`, `start_time`, `cwd`,
   `pid`.
5. Releases the slot on completion.

For Claude-routed roles the existing fallback path is also safe:

```bash
claude -p --agent <role> [--model <m>] "<prompt-body>"
```

`claude -p --agent` is the documented Claude fallback used by Gamma's
and Delta's bash dispatch snippets. Both the canonical wrapper AND
`claude -p --agent` exit through the same lock / telemetry layer when
launched from inside `dispatch-agent.js`; outside that, `claude -p
--agent` is allowed because `claude` is the harness CLI.

## Forbidden patterns

Blocked by `scripts/hooks/dispatch-route-guard.js` (PreToolUse, Bash matcher):

| Pattern | Why forbidden |
|---|---|
| `codex exec …` (not under `node scripts/dispatch-agent.js`) | Re-triggers Windows-stdin failure (LRN-2026-04-17), bypasses concurrency lock |
| `gemini … -p …` (not under the wrapper) | Same — also misses `--skip-trust` handling and JSON envelope unwrap |
| `claude -p …` without `--agent <role>` | Raw `-p` prompt path bypasses the documented agent contract |
| `cat <file> \| (codex \| gemini \| claude)` | Piping prompt into provider stdin is the exact binding-gap failure mode (LRN-2026-04-30) |

## Always allowed (the guard never blocks these)

- `codex --version`, `gemini --version`, `claude --version` — version probes.
- `gemini --help`, `gemini models list`, `gemini auth status` — read-only inspections.
- `node scripts/dispatch-agent.js <role> <prompt-file>` — the canonical wrapper.
- `claude -p --agent <role> …` — documented Claude fallback.
- Any command running under `WARPOS_PROVIDER_PROBE=1` — one-shot health probe escape hatch (the bypass is logged via `lib/logger`).

## Why this matters (precedent)

- **LRN-2026-04-17** — codex CLI on Windows died with 0 bytes output when
  prompted via `cat foo.txt | codex exec ...`. Fix lived inside
  `runProvider` (Node `spawnSync` with `input:` instead of cmd.exe pipe).
- **LRN-2026-04-30** — phase-1 and phase-2 review agents bypassed
  `runProvider` and called `cat prompt | codex exec` directly from Bash.
  The original bug re-appeared 13 days later — both phases lost ~5
  minutes per agent to silent zero-byte deaths.
- The lesson: lib-only fixes don't protect against bypassing callers.
  This guide + the dispatch-route guard hook + the agent-spec rule are
  the three layers that close the bypass.

## Mandatory reads before dispatch

Gamma and Delta MUST consult this file at startup. The session-start
hook also injects a compact reference into `additionalContext` so the
operator and the orchestrator both see the path on every cold start.

## Telemetry artifacts the wrapper produces

Each successful dispatch appends a line to:

- `.claude/runtime/dispatch-completions.jsonl` — completion record.

Each silent zero-byte exit appends to:

- `.claude/runtime/dispatch-deaths.jsonl` — for post-mortem.

Each concurrency slot is a JSON file under
`.claude/runtime/dispatch-locks/<provider>/`. `scripts/dispatch/prune-dead-locks.js`
prunes locks whose owning PID is dead; the session-start hook runs the
pruner once per cold start.

## Cross-references

- `.claude/agents/00-alex/gamma.md` — Gamma dispatch rules (cites this guide).
- `.claude/agents/00-alex/delta.md` — Delta dispatch rules (cites this guide).
- `scripts/dispatch-agent.js` — the canonical wrapper.
- `scripts/hooks/lib/providers.js` — `runProvider` implementation.
- `scripts/hooks/dispatch-route-guard.js` — PreToolUse enforcement.
- `scripts/hooks/lib/concurrency-lock.js` — slot allocator + telemetry.
- `scripts/dispatch/prune-dead-locks.js` — eager dead-PID pruner.
