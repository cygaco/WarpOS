# Tool Inventory — Project Ecosystem

**Generated:** 2026-06-08T18:54:41.962Z
**Source:** `scripts/regen-maps.js` (deterministic file walks; no LLM synthesis).

## Headline counts

| Category | Count |
|---|---|
| Skills (.claude/commands/**/*.md) | 204 |
| Skill namespaces | 43 |
| Hook scripts (scripts/hooks/*.js) | 70 |
| Hook lib modules (scripts/hooks/lib/*.js) | 15 |
| Registered hooks (in settings.json) | 64 |
| Orphan hooks (on disk, not registered) | 6 |
| Utility scripts (scripts/*.js) | 173 |
| npm scripts (package.json) | 0 |
| External CLIs | 3 |
| Memory stores | 10 |
| Memory total lines | 44271 |
| Systems (systems.jsonl entries) | 73 |
| System categories | 2 |
| Enforcement hooks (curated) | 66 |
| Enforcement hooks (uncurated, new) | 2 |
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
