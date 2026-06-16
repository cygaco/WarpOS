# Tool Inventory — Project Ecosystem

**Generated:** 2026-06-16T22:20:39.214Z
**Source:** `scripts/regen-maps.js` (deterministic file walks; no LLM synthesis).

## Headline counts

| Category | Count |
|---|---|
| Skills (.claude/commands/**/*.md) | 228 |
| Skill namespaces | 47 |
| Hook scripts (scripts/hooks/*.js) | 77 |
| Hook lib modules (scripts/hooks/lib/*.js) | 18 |
| Registered hooks (in settings.json) | 65 |
| Orphan hooks (on disk, not registered) | 12 |
| Utility scripts (scripts/*.js) | 176 |
| npm scripts (package.json) | 0 |
| External CLIs | 3 |
| Memory stores | 10 |
| Memory total lines | 72554 |
| Systems (systems.jsonl entries) | 88 |
| System categories | 2 |
| Enforcement hooks (curated) | 75 |
| Enforcement hooks (uncurated, new) | 0 |
| Architecture: pages | 0 |
| Architecture: steps | 0 |
| Architecture: UI atoms | 0 |
| Architecture: lib | 0 |
| Architecture: API routes | 0 |

## Per-map outputs

| Map | jsonl | md | inventory.json |
|---|---|---|---|
| skills | skills.jsonl | skills.md | inventory-skills.json |
| hooks | hooks.jsonl | hooks.md | inventory-hooks.json |
| tools | tools.jsonl | tools.md | inventory-tools.json |
| memory | memory.jsonl | memory.md | inventory-memory.json |
| systems | (source: ../memory/systems.jsonl) | systems.md, systems-inventory.md | inventory-systems.json |
| enforcements | enforcements.jsonl | enforcements.md | inventory-enforcements.json |
| architecture | (source: src/) | architecture.md | inventory-architecture.json |
