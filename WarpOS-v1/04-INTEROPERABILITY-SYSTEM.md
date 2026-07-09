# Interoperability System

## ELI5

WarpOS is the company.

Claude, Codex, Gemini, and future models are contractors.

`AGENTS.md` is the company handbook.

`CLAUDE.md`, `GEMINI.md`, and other shims are contractor-specific onboarding notes.

WorkOrders are job tickets.

ResultEnvelopes are receipts/proof.

The company must not lose its memory because one contractor leaves.

## Does this work with any AI as top-level?

Yes, if the top-level AI can satisfy the **Top-Level Runtime Contract**.

The top-level AI must be able to:

1. read relevant repo files
2. write durable state or ask a trusted bridge to write it
3. call deterministic commands or ask the operator/bridge to run them
4. create WorkOrders
5. inspect ResultEnvelopes
6. update trackers/state
7. respect gates and stop conditions

If the top-level AI is only a chat box with no filesystem/tools, it can still act as planning Alpha, but it cannot be the full operating runtime. It needs an operator bridge, Claude Code, a Master Console, or a CLI wrapper to execute repo actions.

## Runtime levels

### Level 0 — Chat-only top-level

Can plan, write prompts, review copied outputs. Cannot safely operate WarpOS alone.

Use it for:

- strategy
- architecture review
- prompt generation
- decision support

Do not use it for:

- direct repo mutation
- dispatch execution
- liveness management
- release/update operations

### Level 1 — File-aware top-level

Can read repo and produce patches, but cannot run commands.

Use it for:

- docs/plans/templates
- code generation for human/applied patches

Requires human or automation for verification commands.

### Level 2 — Tool-capable top-level

Can read/write files and run Bash.

This can host Alpha if wrappers/gates exist.

### Level 3 — WarpOS Master Console top-level

Provider-neutral top-level UI/API that can bind Alpha to any model and dispatch work through adapters.

This is the long-term target.

## File model

```text
AGENTS.md     provider-neutral handbook
CLAUDE.md     imports AGENTS.md, binds top-level Claude Code session to Alex Alpha
GEMINI.md     imports AGENTS.md or mirrors it, adds Gemini runtime notes
CODEX.md      usually unnecessary; Codex reads AGENTS.md directly unless configured otherwise
RoleSpec      durable role definition
WorkOrder     task contract
ResultEnvelope result contract
```

## Role binding order

Every runtime should determine its role using this order:

1. explicit user instruction
2. WorkOrder.role
3. command/mode binding
4. runtime binding
5. default top-level human-facing role = alex-alpha

Root `AGENTS.md` must not globally say “you are Alpha.”

## Runtime adapter pattern

```text
WarpOS Kernel
  role registry
  route resolver
  work order schema
  state store
  event log
  hooks/policies
  trackers
  packs

Provider Adapters
  claude-code adapter
  codex adapter
  gemini adapter
  future adapter
```

Adapters translate the same WorkOrder into provider-specific invocation.

## Portable policy enforcement

Policies are provider-neutral. Enforcement is provider-specific.

Example:

```yaml
policy_id: no_raw_provider_cli
meaning: model calls must go through WarpOS dispatch wrappers
claude_code: PreToolUse Bash hook
codex: wrapper guard / shell alias / CI scan
gemini: wrapper guard / CI scan
generic: node scripts/checks/no-raw-provider-cli.js
```

## Design target

The top-level runtime can change:

```json
{
  "role": "alex-alpha",
  "provider": "claude",
  "runtime": "claude-code"
}
```

or:

```json
{
  "role": "alex-alpha",
  "provider": "openai",
  "runtime": "warpos-master-console"
}
```

But the durable state and dispatch contract remain the same.
