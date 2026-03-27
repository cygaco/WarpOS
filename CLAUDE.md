# WarpOS — CLAUDE.md

This is a reference repo, not a runtime. Nobody writes features here. Claude Code opens it to read context or sync state back.

## Read `WarpOS.md` first

That's the core document — stack, validated patterns, products, decisions log. Everything substantive lives there.

## Rules

- Keep docs concise. Every line should be load-bearing.
- When updating a product card, include the date.
- When adding a schema, add a brief doc comment explaining what it's for.
- Playbooks must be validated (tested in a real product) before being added.
- Never remove a product card — mark it as "Killed" with a date and reason.
- Dates: YYYY-MM-DD
- Product stages: Discovery → Validation → Building MVP → Live → Scaling → Killed
- Schema files: TypeScript interfaces only, no implementations

## What does NOT belong in this repo

- System prompts, prompt templates, or instruction files (Notion → Operations → AI Projects)
- Token/output/clarification rules (Notion → Operations → AI Projects → Shared Rules)
- Company overview, playbooks, or workflows (Notion → Warp Drive)
- Anything a human reads in a chat session — that's Notion's job

This repo holds code-adjacent things only: schemas, hooks, commands, patterns, templates, product cards, and WarpOS.md.
