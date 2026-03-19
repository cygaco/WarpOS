# WarpOS — CLAUDE.md

## What This Repo Is
WarpOS is the shared knowledge backbone for an AI-native venture studio. It contains the context, schemas, patterns, and conventions that all products inherit. It is NOT a runtime or deployable — it's a reference repo.

## How to Work in This Repo
- **WARP.md** is the core document. Keep it current — products depend on it.
- **products/*.md** are living product cards. Update when product state changes.
- **schemas/*.ts** are canonical interfaces. Changes here propagate to all products.
- **studio/** contains company context — principles, playbooks, team.
- **ai/** contains Claude integration patterns and system prompts.

## Rules
- Keep docs concise. No filler. Every line should be load-bearing.
- When updating a product card, include the date.
- When adding a schema, add a brief doc comment explaining what it's for.
- Playbooks must be validated (tested in a real product) before being added.
- Never remove a product card — mark it as "Killed" with a date and reason.

## Conventions
- Dates: YYYY-MM-DD
- Product stages: Discovery → Validation → Building MVP → Live → Scaling → Killed
- Schema files: TypeScript interfaces only, no implementations
- All Claude prompts use the Tokenizer rules (see `ai/TOKENIZER.md`)
