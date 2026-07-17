# WarpOS 1.0 Finish Packet

Generated for Vlad / Warp Studios.

This packet is designed to be pasted or attached into a Claude Code session running inside the canonical WarpOS repository. It is intentionally self-contained and implementation-oriented.

## What this packet is

WarpOS 1.0 is not “every idea finished.” It is the production-grade operating layer for the foundry:

> Durable company state, swappable model executors, reliable sprint rooms, verifiable work orders, strong launch packs, and no false-green claims.

The packet converts the conversation into buildable epics, ADRs, schemas, acceptance gates, and prompts.

## How to use

1. Start in the canonical WarpOS repo.
2. Open `01-MASTER-PROMPT-FOR-CLAUDE.md`.
3. Paste it into Claude Code as the first message.
4. Attach or paste the rest of this packet as context.
5. Tell Claude to start with Sprint 0, not to “do everything at once.”
6. Require evidence after each phase.

## Packet files

- `01-MASTER-PROMPT-FOR-CLAUDE.md` — the bootable prompt for Alpha/Claude.
- `02-WARPOS-1.0-CHARTER.md` — product definition and non-negotiables.
- `03-ADR-DURABLE-COMPANY-EPHEMERAL-EXECUTORS.md` — the core architecture decision.
- `04-INTEROPERABILITY-SYSTEM.md` — AGENTS.md / CLAUDE.md / provider interop model.
- `05-INSTRUCTION-COMPILER.md` — generated instruction files and role binding rules.
- `06-WORKORDER-RESULTENVELOPE-SPEC.md` — the execution contract.
- `07-SPRINTROOM-PERSISTENCE.md` — persistent sprint context and leases.
- `08-DISPATCH-LIVENESS-WORKTREE-KERNEL.md` — dispatch, heartbeat, reaper, worktree policy.
- `09-PACKS-CATALOG.md` — the pack system and first packs.
- `10-WEBAPP-PRODUCTION-BASELINE-PACK.md` — Doogle/security audit defaults for generated apps.
- `11-FOUNDER-PANEL-PACK.md` — interactive founder panel system.
- `12-OBSERVABILITY-MEMORY-LEARNING.md` — events, state, sleep, and learning loops.
- `13-WARPOS-1.0-CHECKLIST.md` — full 1.0 acceptance checklist.
- `14-FIRST-SPRINTS.md` — staged execution plan.
- `15-VERIFICATION-GATES.md` — concrete checks and gates.
- `16-TOP-LEVEL-AI-PORTABILITY.md` — how this works if Claude is not the top-level AI.
- `17-DO-NOT-BUILD.md` — explicit boundaries and anti-scope-creep rules.
- `templates/AGENTS.md.template` — provider-neutral handbook template.
- `templates/CLAUDE.md.template` — Claude Code bootloader template.
- `templates/GEMINI.md.template` — Gemini shim template.
- `templates/WorkOrder.schema.md` — WorkOrder schema template.
- `templates/ResultEnvelope.schema.md` — ResultEnvelope schema template.
- `18-SOURCE-INDEX.md` — source context and verification notes.

## Critical starting instruction

Do not let Claude start by building the Founder Panel. Start with truth, instruction interop, WorkOrder/ResultEnvelope, and dispatch/liveness. The Founder Panel becomes much easier and safer after the kernel is real.
