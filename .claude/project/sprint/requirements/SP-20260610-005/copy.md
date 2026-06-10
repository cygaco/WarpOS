<!-- requirement-format-legacy -->
# COPY Requirements — E-DISPATCH-INTEGRITY-001 F-1+F-3 — coverage-honesty (kill telemetry-only false-greens)

**Sprint:** `SP-20260610-005`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\prd.md`

> COPY captures user-visible text and content expectations. Each entry
> is a concrete string the product will display, with context. Keep
> ids stable so tickets can link to specific copy blocks.

## C-1 — none (no user-facing copy in this sprint) (linked stories `S-1`, `S-2`)

**Context:** Engine sprint. Every surface is internal — coverage check scripts (`sprint-manager-consult.js`, `sprint-hook-coverage.js`), `gauntlet-verify.js`, and their tests. Nothing in this sprint ships a string displayed to a product end user.
**Text:**

> (none — this sprint defines no user-facing copy)

**Notes:** Operator-facing diagnostic strings (the missing-backing-record RED diagnostic, the named legacy-exemption waiver, and the gauntlet-verify whole-ledger refusal + usage guidance) are check/CLI output, not display copy — their required content is specified in `acceptance-criteria.md` (AC-1.1, AC-1.3, AC-2.1, AC-2.2) and `trace.md`, not here.
