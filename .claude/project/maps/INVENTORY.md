# Tool Inventory — Project Ecosystem

**Generated:** 2026-06-10T05:05:32.519Z
**Source:** `scripts/regen-maps.js` (deterministic file walks; no LLM synthesis).

## Headline counts

| Category | Count |
|---|---|
| Skills (.claude/commands/**/*.md) | 216 |
| Skill namespaces | 44 |
| Hook scripts (scripts/hooks/*.js) | 76 |
| Hook lib modules (scripts/hooks/lib/*.js) | 18 |
| Registered hooks (in settings.json) | 66 |
| Orphan hooks (on disk, not registered) | 10 |
| Utility scripts (scripts/*.js) | 176 |
| npm scripts (package.json) | 0 |
| External CLIs | 3 |
| Memory stores | 9 |
| Memory total lines | 50837 |
| Systems (systems.jsonl entries) | 77 |
| System categories | 2 |
| Enforcement hooks (curated) | 74 |
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
