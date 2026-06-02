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

### Claude BUILD-CHAIN roles → the bounded wrapper (RI-004 / ED-018)

Claude-routed **build-chain** roles (`builder`, `fixer`, `frontend-builder`,
`backend-builder`, `stub-scaffold`) MUST go through:

```bash
node scripts/dispatch-claude.js <build-role> <prompt-file> --model sonnet -w
```

Why a dedicated wrapper: raw `claude -p --agent builder "$(cat prompt)"` gets
auto-backgrounded by the harness and **silently reaped** — 0 bytes out, NO
completion record, exit code lost to `$(...)`. The reap is invisible
(ED-018): `dispatch-agent.js` bridges only openai/gemini, and raw `claude -p
--agent` writes no record. `dispatch-claude.js` closes this:

1. **Bounds** the inner `claude -p` call with a timeout (`DISPATCH_BUILDER_TIMEOUT_MS`,
   default 20 min) so it returns in time to write a durable record instead of
   being reaped mid-flight.
2. On any reap signal — timeout, spawn failure, **0-byte stdout (even on exit 0
   — the ED-018 signature)**, or non-zero exit — writes a **death record** to
   `.claude/runtime/dispatch-deaths.jsonl` AND exits **non-zero**, so the
   caller's `if [ $? -ne 0 ]` liveness check fires.
3. On success writes a well-formed completion record so `gauntlet-verify` can
   confirm the builder actually ran (add `builder`/`fixer` to its role set as
   the backstop: even if the wrapper itself is reaped, no record → RED).
4. Reuses `dispatch-agent.js`'s canonical telemetry helpers (same ledger,
   `canonicalFile`-anchored, ED-016-safe) and forwards `-w` to claude so the
   worktree isolation is preserved.

The `dispatch-route-guard` hook BLOCKS the raw `claude -p --agent <build-role>`
form, so the wrapper is the only path.

### Non-build Claude roles → raw fallback is allowed

```bash
claude -p --agent <role> [--model <m>] "<prompt-body>"
```

`claude -p --agent` remains the documented fallback for **non-build** Claude
roles (`test-runner`, `visual-review`) and for the review layer
(reviewer/compliance/qa/redteam) when their provider CLI is unavailable —
reap-detection is less load-bearing there, and `claude` is the harness CLI.

## Role → provider routing

Canonical role→provider map. **Source of truth: `DEFAULT_AGENT_PROVIDERS` in
`scripts/hooks/lib/providers.js`** (mirrored by `DEFAULT_PROVIDER_PER_ROLE` in
`scripts/dispatch/catalog.js`); `manifest.agentProviders` overrides per project.
`scripts/checks/dispatch-routing-parity.js` asserts this table and both code maps
agree — keep them in sync.

| Role(s) | Provider | Why |
|---------|----------|-----|
| alpha, beta, gamma, delta | claude | orchestration / judgment |
| builder, fixer, stub-scaffold | claude | code authoring |
| reviewer | openai | gpt-5.5 xhigh — different lens on Claude's output |
| compliance | openai | gpt-5.5 xhigh — cross-provider audit |
| qa | openai | independent failure-mode pass |
| learner | openai | cross-run synthesis |
| redteam | gemini | different adversarial corpus, thinking-on |
| advisor | openai | freeform cross-provider consult — NO strict output schema |
| consult | openai | freeform cross-provider consult — NO strict output schema |

Claude is the **fallback** for any non-Claude role on failure (`required-fallback.js`),
not the default for the review layer — cross-provider diversity is the point.

## Forbidden patterns

Blocked by `scripts/hooks/dispatch-route-guard.js` (PreToolUse, Bash matcher):

| Pattern | Why forbidden |
|---|---|
| `codex exec …` (not under `node scripts/dispatch-agent.js`) | Re-triggers Windows-stdin failure (LRN-2026-04-17), bypasses concurrency lock |
| `gemini … -p …` (not under the wrapper) | Same — also misses `--skip-trust` handling and JSON envelope unwrap |
| `claude -p …` without `--agent <role>` | Raw `-p` prompt path bypasses the documented agent contract |
| `claude -p --agent <build-role>` (builder/fixer/`*-builder`/stub-scaffold) not under `node scripts/dispatch-claude.js` | Silently REAPS — 0 bytes, no completion record, exit lost (RI-004/ED-018). Use the bounded wrapper. |
| `cat <file> \| (codex \| gemini \| claude)` | Piping prompt into provider stdin is the exact binding-gap failure mode (LRN-2026-04-30) |

## Always allowed (the guard never blocks these)

- `codex --version`, `gemini --version`, `claude --version` — version probes.
- `gemini --help`, `gemini models list`, `gemini auth status` — read-only inspections.
- `node scripts/dispatch-agent.js <role> <prompt-file>` — the canonical cross-provider wrapper.
- `node scripts/dispatch-claude.js <build-role> <prompt-file> -w` — the bounded Claude build-chain wrapper (RI-004/ED-018).
- `claude -p --agent <role> …` — documented Claude fallback for **non-build** roles only (build roles are blocked; see Forbidden patterns).
- Any command running under `WARPOS_PROVIDER_PROBE=1` — one-shot health probe escape hatch (the bypass is logged via `lib/logger`).

## Why this matters (precedent)

- **LRN-2026-04-17** — codex CLI on Windows died with 0 bytes output when
  prompted via `cat foo.txt | codex exec ...`. Fix lived inside
  `runProvider` (Node `spawnSync` with `input:` instead of cmd.exe pipe).
- **LRN-2026-04-30** — phase-1 and phase-2 review agents bypassed
  `runProvider` and called `cat prompt | codex exec` directly from Bash.
  The original bug re-appeared 13 days later — both phases lost ~5
  minutes per agent to silent zero-byte deaths.
- **RI-004 / ED-018** — Claude builder dispatch via raw `claude -p --agent
  builder` was auto-backgrounded by the harness and silently reaped: 0 bytes,
  no completion record, no error. `dispatch-agent.js` refuses Claude roles and
  `claude -p --agent` writes no record, so the reap was invisible — it bit
  twice in one session (Alpha had to build foreground). Fix: the bounded
  `scripts/dispatch-claude.js` wrapper makes the reap LOUD (death record +
  non-zero exit), backed by `gauntlet-verify` treating a no-record builder as
  RED. Same lib-only-fix lesson: paired with the route-guard (build roles can't
  go raw) and this contract rule.
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
- `scripts/dispatch-agent.js` — the canonical cross-provider wrapper.
- `scripts/dispatch-claude.js` — the bounded Claude build-chain wrapper (RI-004/ED-018); `scripts/dispatch/dispatch-claude.test.js` is its torture test.
- `scripts/hooks/lib/providers.js` — `runProvider` implementation.
- `scripts/hooks/dispatch-route-guard.js` — PreToolUse enforcement.
- `scripts/hooks/lib/concurrency-lock.js` — slot allocator + telemetry.
- `scripts/dispatch/prune-dead-locks.js` — eager dead-PID pruner.
