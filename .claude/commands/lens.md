---
name: lens
description: Meta lens — audit codebase health, dead code, consistency, and tech debt
---

Run a meta lens audit on the consumer product codebase. Analyze:

1. **Dead code** — find unused exports, unreferenced components, orphan files
2. **Type consistency** — check for `any` types, missing interfaces, type mismatches
3. **Import health** — circular dependencies, unused imports, missing imports
4. **Prompt drift** — verify prompt templates in `prompts.ts` match the data structures they reference
5. **Constants sync** — `PHASE_DISPLAY` in `constants.ts` matches step components and DM manifest
6. **Storage schema** — `SessionData` in `types.ts` matches what `storage.ts` and `dummy-data.ts` produce
7. **API routes** — verify `/api/claude` and `/api/jobs` route handlers match client-side callers in `api.ts`

Report findings as:
| Area | Issues | Severity | Fix? |
|------|--------|----------|------|

If the user says `/lens fix`, also fix the issues found.
If the user specifies an area (e.g., `/lens prompts`), focus only on that area.
