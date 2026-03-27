# WarpOS

The internal operating system of an AI-native venture studio. Every product builds on it. Every product contributes back to it.

## What This Is

WarpOS is the shared context, schemas, patterns, and conventions that all products in the studio inherit. It's not a runtime — it's a knowledge backbone that Claude Code sessions pull from to maintain coherence across products.

## Structure

```
WarpOS/
├── WarpOS.md            — Core backbone overview (stack, patterns, products, decisions)
├── CLAUDE.md            — Instructions for Claude Code sessions in this repo
├── patterns/            — Validated implementation patterns
├── products/            — Product cards (one per product)
├── schemas/             — Shared TypeScript interfaces
└── .claude/commands/    — Slash commands for syncing
```

## How Products Use This

Each product repo can pull context from WarpOS:

1. `WarpOS.md` is the universal context — attach to Claude Projects or reference in CLAUDE.md
2. `schemas/` contains canonical interfaces (Warp Profiles, Deus Mechanicus manifests)
3. `products/[name].md` is the living product card
4. System prompt templates are in Notion (Operations → AI Projects → Product Templates)

## Products

| Product                          | Status       | What It Does                                                                 |
| -------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| [consumer product](products/consumer-product.md) | Building MVP | Job search wizard — resume → market analysis → targeted resumes → auto-apply |
