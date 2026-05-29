---
description: The 1-idea alternative to /roadmap:ideas — the single highest-leverage next roadmap entry (the Director of Product's top pick) with a one-paragraph rationale. For "just tell me the one thing."
---

# /roadmap:next — the one thing to do next

When you don't want 12 candidates, just **the single highest-leverage next roadmap entry**: the Director of Product's top pick, with a tight rationale. Read-only; proposes one thing, pairs with `/roadmap:add`.

## Input

`$ARGUMENTS` — optional `--why-long` (fuller rationale) or `--avoid <lens>` (exclude a lens). Default: one pick, one paragraph.

## Procedure

1. Read the same evidence as `/roadmap:ideas` — `ROADMAP.md` (Strategy, Milestones, candidates), `_requirements/00-canonical/*` (if present), recent `git log` + `paths.eventsFile`.
2. **Consult the Director of Product** (`subagent_type: director-of-product`). Ask for **exactly one** recommendation — the single most leverage-positive next entry — applying Principle #1 (Lean Product Development): what serves the majority userbase / golden path, is a calculated risk worth taking now, and (bonus) draws a tangential connection that compounds existing work.
3. Output one pick:
   - **The entry** (title + 1-2 line body, ready for `/roadmap:add`).
   - **Why this, why now** (one paragraph): which lens it came from, what it unblocks, the opportunity cost of *not* doing it, and the tangential connection if any.
   - **Confidence** + the one thing that would change the pick.
4. End: `/roadmap:add "<the pick>"` to commit it, or `/roadmap:ideas` for the full slate.

## Relationship to /roadmap:ideas

Same engine (the Director, same evidence) — `next` is `ideas` collapsed to a single decisive recommendation. Use `next` when you trust the Director to choose; use `ideas` when you want to choose from a slate. Both are read-only and propose-only.

## Anti-patterns

- **Don't hedge into a menu.** This skill's whole value is *one* decisive pick. If genuinely torn between two, pick one and name the runner-up in a single line — don't return a list (that's `/roadmap:ideas`).
- **Don't invent evidence.** Ground the pick in a real artifact; if the basis is thin, say so.
- **Don't write the roadmap.** Propose; `/roadmap:add` commits.

## Related

- `/roadmap:ideas` — the 12-idea slate (4 lenses × 3).
- `/roadmap:add` — commit the pick.
- `director-of-product` agent — the product-lens engine.
