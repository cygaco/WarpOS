<!-- requirement-format-legacy -->
# COPY Requirements — _guides product-layer shipping + _planning reorg + ship-boundary enforcer

**Sprint:** `SP-20260531-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260531-002/prd.md`

> COPY captures user-visible text. This internal sprint has no product UI copy; the only operator-facing string is the enforcer's failure message.

## C-1 — enforcer failure message (linked story `S-5`)

**Context:** Printed by `scripts/checks/warpos-ship-coverage.js` when the ship boundary is violated (fail-closed, exit non-zero).
**Text:**

> ship-boundary violation: `<path>` is `<must-ship-missing | must-not-ship-present>` — `_guides/**` must ship, `_planning/**` must never ship. Fix the manifest or the path, then re-run.

**Notes:** Keep the message actionable (names the path + which side of the boundary failed + the fix). Exact wording may be tuned in implementation; intent is binding.
