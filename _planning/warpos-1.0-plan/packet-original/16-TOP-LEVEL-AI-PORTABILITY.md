# Top-Level AI Portability

## Answer

Yes, WarpOS can work if “any” AI is the top-level, but only if that AI is bound through a runtime contract.

The top-level AI is not automatically Alpha just because it is the model you are chatting with. It becomes Alpha only when the runtime binds it to the `alex-alpha` role and gives it enough tools or a bridge to operate WarpOS.

## Top-level runtime contract

A top-level Alpha runtime must be able to:

- read source files
- write durable state
- run or request verification commands
- create WorkOrders
- route via provider adapters
- inspect ResultEnvelopes
- update SprintRoom/tracker state
- obey stop gates
- preserve evidence

## Host types

### Claude Code host

Best current practical host because it can read/write files, run tools, use hooks, and consume CLAUDE.md.

Binding:

```text
CLAUDE.md imports AGENTS.md
CLAUDE.md says top-level Claude Code session defaults to Alex Alpha
```

### Codex host

Works as top-level if used through Codex CLI or a future console with read/write/command ability.

Binding:

```text
Codex reads AGENTS.md
runtime config binds role = alex-alpha for the top-level session
```

Do not rely on `CODEX.md` unless intentionally configured.

### Gemini host

Works if Gemini CLI / runtime can read context and execute through a bridge/wrapper.

Binding:

```text
GEMINI.md imports or mirrors AGENTS.md
runtime config binds role = alex-alpha for top-level session
```

### Chat-only AI host

Can plan and generate WorkOrders, but cannot be the full operating runtime alone. It needs a bridge.

Example pattern:

```text
Chat AI creates WorkOrders → human/Claude Code runs them → ResultEnvelopes pasted back → Chat AI reviews/plans next
```

## Long-term target: Master Console

The cleanest future architecture is a provider-neutral WarpOS Master Console:

```text
Vlad → Master Console → Alpha role bound to chosen provider → WarpOS kernel → provider adapters
```

Then Alpha can be Claude today, Codex tomorrow, or another model later.

## Important distinction

```text
Alpha = role/persona/state/authority
Claude = one possible runtime
Codex = one possible runtime
Gemini = one possible runtime
```

Do not hardcode Claude as Alpha in provider-neutral files.

## Minimal viable portability

Implement now:

- AGENTS.md canonical
- CLAUDE.md bootloader
- RoleSpec for Alpha
- WorkOrder/ResultEnvelope schema
- provider adapters
- route resolver
- no-root-alpha-poison check

Implement later:

- neutral Master Console
- provider-swappable top-level interactive runtime
- UI to reroute Alpha/Beta/Epsilon/workers by policy

## Runtime selection examples

```json
{
  "top_level": {
    "role": "alex-alpha",
    "provider": "claude",
    "runtime": "claude-code"
  },
  "workers": {
    "frontend-builder": "openai/codex",
    "security-reviewer": "gemini",
    "beta": "claude-opus"
  }
}
```

or:

```json
{
  "top_level": {
    "role": "alex-alpha",
    "provider": "openai",
    "runtime": "warpos-master-console"
  },
  "workers": {
    "builders": "openai/codex",
    "reviewers": "claude/gemini"
  }
}
```

## Final rule

The top-level AI can change. The company files, policies, WorkOrders, ResultEnvelopes, state, trackers, and gates must remain stable.
