---
name: deploy
description: Pre-deploy checklist — build, lint, test API, verify env vars
---

Run the pre-deploy checklist for consumer product:

1. **Build** — `npm run build` — must pass clean with zero warnings
2. **Lint** — `npm run lint` — report any issues
3. **Server health** — hit `/api/test?check=all` via preview and report results
4. **Git status** — show current branch, uncommitted changes, commits ahead of master
5. **Env vars** — verify all required env vars are set (without revealing values)

Report a deploy readiness summary:
| Check | Status | Details |
|-------|--------|---------|

If all checks pass, say "Ready to deploy" and ask if the user wants to push.
If any fail, list blockers and suggest fixes.

If the user says `/deploy push`, also push the current branch after checks pass.
