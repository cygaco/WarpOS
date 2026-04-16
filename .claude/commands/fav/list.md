---
description: Browse all saved favorite moments, grouped by category
user-invocable: true
---

# /fav:list — Browse Favorite Moments

Display all saved moments from `docs/favorites.md`, grouped by category.

## Instructions

1. Read `docs/favorites.md`
2. If the file doesn't exist, say: "No moments saved yet. Use `/fav` to save one."
3. Group entries by category (Autonomy, Serendipity, Comedy, Clutch, Meta, Vibe)
4. Display each group with a count, then the entries
5. Show total count at the end

## Output Format

```
## Autonomy (2)
- **FAV-001** (2026-04-01) — Claude auto-updated tooling after /learn
- **FAV-003** (2026-04-02) — Spawned parallel agents without being asked

## Clutch (1)
- **FAV-002** (2026-04-01) — Caught a security vuln in the auth middleware

---
**3 moments saved**
```
