# Instruction Compiler: AGENTS.md / CLAUDE.md / GEMINI.md

## Goal

Stop hand-maintaining inconsistent instruction files. Generate provider-specific instruction files from one source of truth.

## Source tree

Target source layout:

```text
_warpos/instructions/source/
  constitution.md
  role-binding.md
  durable-truth.md
  dispatch.md
  quality.md
  safety.md
  launch.md
  roles/
    alex-alpha.yaml
    beta.yaml
    epsilon.yaml
    frontend-builder.yaml
    backend-builder.yaml
    security-reviewer.yaml
  areas/
    scripts-dispatch.md
    scripts-sprint.md
    guides.md
    requirements.md

_warpos/instructions/generated/
  AGENTS.md
  CLAUDE.md
  GEMINI.md
```

Installed/runtime files:

```text
AGENTS.md
CLAUDE.md
GEMINI.md
.claude/rules/**
```

## Root AGENTS.md content

Root AGENTS.md should contain:

- WarpOS identity and operating principles
- role-binding order
- durable truth sources
- dispatch policy
- WorkOrder → ResultEnvelope rule
- quality/evidence rules
- reviewer independence
- safety/secret rules
- stop-and-ask gates
- compact commands/checks

Root AGENTS.md should not contain:

- “you are Alpha” as a global instruction
- long procedures better stored as skills/packs
- stale command counts
- provider-specific CLI assumptions
- every role's full prompt

## Root CLAUDE.md content

Root CLAUDE.md should be a bootloader:

```md
@AGENTS.md

## Claude Code runtime binding

In the top-level human-facing Claude Code session, default role = alex-alpha.

If a WorkOrder is present, role = WorkOrder.role.

Use WarpOS slash commands and hooks.

Do not bypass dispatch wrappers.
```

## Root GEMINI.md content

Root GEMINI.md should either import AGENTS.md or be generated from the same source:

```md
@AGENTS.md

## Gemini runtime binding

When invoked by WarpOS, follow WorkOrder.role and return a ResultEnvelope.
Do not assume Alpha authority unless explicitly bound.
```

## Codex

Codex should use AGENTS.md directly unless WarpOS intentionally configures alternate filenames.

## Nested instruction policy

Use nested instruction files only where local invariants differ.

Good locations:

```text
scripts/dispatch/AGENTS.md
scripts/sprint/AGENTS.md
scripts/security/AGENTS.md
_guides/AGENTS.md
_requirements/AGENTS.md
_warpos/templates/app-scaffold/AGENTS.md
```

Bad locations:

```text
every folder
component folders with no unique policy
files that repeat root rules
files that say only “be careful”
stale provider-specific assumptions
```

## Required checks

Create checks:

```text
node scripts/instructions/build.js --check
node scripts/instructions/audit-conflicts.js
node scripts/instructions/audit-size.js
node scripts/instructions/no-root-alpha-poison.js
node scripts/dispatch/role-binding.test.js
```

## Conflict rules

- Local instructions may narrow file scope.
- Local instructions may add commands/checks.
- Local instructions may not override role binding order.
- Local instructions may not allow raw provider CLI if root forbids it.
- Local instructions may not remove evidence requirements.

## Size rules

Root provider-neutral instructions should stay concise. Large procedures become:

- skills
- pack docs
- nested area rules
- WorkOrder templates
- generated context packets

## Done when

- AGENTS.md is generated and audited.
- CLAUDE.md imports AGENTS.md and binds top-level Claude to Alpha.
- GEMINI.md is generated or import-based.
- nested instruction files are audited.
- root Alpha poisoning is blocked.
- role specs are typed and testable.
- provider-specific runtime notes are shims, not the source of truth.
