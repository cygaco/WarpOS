# Dispatch, Liveness, and Worktree Kernel

## Goal

Make routing, provider selection, liveness, worktree isolation, and records one reliable kernel.

## Target modules

```text
scripts/dispatch/work-order.js
scripts/dispatch/result-envelope.js
scripts/dispatch/route-resolver.js
scripts/dispatch/provider-adapters/claude.js
scripts/dispatch/provider-adapters/codex.js
scripts/dispatch/provider-adapters/gemini.js
scripts/dispatch/lease-store.js
scripts/dispatch/heartbeat.js
scripts/dispatch/reaper.js
scripts/dispatch/worktree-policy.js
scripts/dispatch/doctor.js
```

Adapt names to existing repo conventions.

## Route resolver

Route resolver owns:

- role → provider/model/runtime
- provider availability
- account/auth/quota preflight
- model access
- cost/budget class
- required provider diversity
- worktree isolation requirement
- foreground/background mode
- fallback policy

No skill should hand-roll provider selection.

## Provider adapters

Every provider adapter must support:

- receive WorkOrder
- construct provider-specific prompt/context
- set cwd/worktree explicitly
- enforce timeout
- write STARTED event before spawn
- capture stdout/stderr
- classify exit/failure
- validate ResultEnvelope
- write completion/death record

## Bash policy

Use Bash directly for deterministic local actions:

```text
npm test
npm run lint
npm run typecheck
git status
git diff
git worktree add
node scripts/checks/...
node scripts/launch/live-rls-proof.js
```

Use Bash subprocess wrappers for model workers:

```text
node scripts/dispatch-claude.js ...
node scripts/dispatch-codex.js ...
node scripts/dispatch-gemini.js ...
node scripts/dispatch-agent.js ...
```

Do not raw-call providers:

```text
claude -p "..."
codex exec "..."
gemini "..."
```

unless inside a sanctioned wrapper/test.

## Liveness state machine

```text
CREATED
→ DISPATCHED
→ STARTED
→ ACKED
→ ALIVE
→ QUIET
→ PINGED
→ NUDGED
→ TIMEOUT_CANDIDATE
→ COMPLETED | FAILED | REAPED | REPLACED | UNKNOWN
```

## Reaper rules

Never reap from process absence alone.

Signals ranked from strongest to weakest:

1. ResultEnvelope terminal status
2. completion/death ledger
3. branch commit / files changed
4. provider terminal status
5. output growth
6. heartbeat
7. elapsed time vs timeout
8. process presence/absence

Before reap:

- check ledger
- check output growth
- check branch/worktree commits
- check provider status if available
- ping/nudge worker or conductor unless hard timeout
- record the reap decision and evidence

## Worktree base policy

Every dispatch must declare worktree base:

```text
base: live_head | sprint_initial_head | default_branch | explicit_commit
```

Default for dependent multi-builder sprint work:

```text
base = live_head
```

Do not let builder N branch from stale sprint-initial HEAD if it depends on builder N-1.

Wrapper owns cwd/worktree. Do not raw-forward provider-specific `--worktree <path>` flags unless the provider adapter explicitly owns and tests it.

## Completion records

Write a STARTED record before spawn. A hard-killed process must not disappear into silence.

Required record classes:

- started
- heartbeat
- completion
- death
- timeout
- quota_exhausted
- provider_unavailable
- reaped
- replaced
- unknown_outcome

## Failure classification

Classify at least:

- timeout
- spawn_error
- non_zero_exit
- zero_byte_exit
- quota_exhausted
- provider_unavailable
- auth_missing
- model_unavailable
- schema_invalid
- auto_commit_failed
- worktree_base_stale
- no_completion_record

## Tests

```text
node scripts/dispatch/test-work-order.js
node scripts/dispatch/test-result-envelope.js
node scripts/dispatch/test-route-resolver.js
node scripts/dispatch/test-heartbeat-reaper.js
node scripts/dispatch/test-worktree-policy.js
node scripts/dispatch/test-provider-failure-classification.js
node scripts/dispatch/doctor.js --json
```

## Done when

- Claude/Codex/Gemini routes all accept the same WorkOrder shape.
- reaper pings before reaping.
- fake-green no-commit builder records are blocked.
- stale worktree base is detected.
- 0-byte provider deaths are classified.
- provider outage/quota failures are retryable or visibly blocked.
- dispatch doctor explains every route.
