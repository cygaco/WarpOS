<!-- requirement-format-legacy -->
# TRACE Requirements — Founders in-app panel — /admin/readiness view (S-PF-09a R-2)

**Sprint:** `SP-20260614-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-001\prd.md`

> TRACE captures the observability, traceability, event capture, decision
> logging, and requirement-to-code linkage layer. The point of TRACE is
> to answer: why did this exist, where did the requirement come from,
> what changed because of it, what external dependency or approval was
> required, how was it tested, what shipped, and what should persist as
> a learning.

## Trace Map

> One row per requirement area (R-1..R-N, single-source from plan_contract.requirement_areas,
> T-298). Fill in Ticket, Code, and Test columns during execution.

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| Sure, proceed [with R-2 + | R-1 | S-1 | C-1 | IN-1 | — | T-… | — | — | — | — |
| Sure, proceed [with R-2 + | R-2 | S-2 | C-2 | IN-2 | — | T-… | — | — | — | — |
| Sure, proceed [with R-2 + | R-3 | S-3 | C-3 | IN-3 | — | T-… | — | — | — | — |
| Sure, proceed [with R-2 + | R-4 | S-4 | C-4 | IN-4 | — | T-… | — | — | — | — |
| Sure, proceed [with R-2 + | R-5 | S-5 | C-5 | IN-5 | — | T-… | — | — | — | — |
| Sure, proceed [with R-2 + | R-6 | S-6 | C-6 | IN-6 | — | T-… | — | — | — | — |

## TR-1 — R-1 the panel: a founder-allowlist-gated /admin/readiness scaffold route (reuse S-PF-03 pattern, no new auth) that renders the warpos/readiness/v1 report — per item: status, owner-class, lead-time, blocker.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** (fill)

## TR-2 — R-2 actionable deep-links (doogle WG-29): each item surfaces its deep_link to the how-to/click-path guide PROMINENTLY — the panel walks the founder to the fix, not just states the goal.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-2`
**Linked story:** `S-2`
**Why we capture this:** (fill)

## TR-3 — R-3 cold/warm FTUE states: cold start (0/N, all open) renders an oriented 'start here' layout (not a blank table); warm start de-emphasizes done + focuses what's next.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-3`
**Linked story:** `S-3`
**Why we capture this:** (fill)

## TR-4 — R-4 write-back (NET-NEW surgical line-patch — NOT a parser round-trip; β corrected the false-reuse claim): check/uncheck locates the item's line by `id=` match (never line index) and toggles `[ ]`<->`[x]` IN PLACE, preserving every other byte. Do NOT render-from-model: parseFoundersChecklist DROPS non-matching lines (human notes/headers/declared_stack) and renderFoundersChecklist regenerates from constants (wipes checked-state) — render-from-model is for CREATE only, lossy for MUTATE. Atomic write (tmp + fs.renameSync); re-read immediately before write (patch-on-current, not write-from-snapshot) since the .md is human-editable + the SoT. Round-trip invariant TESTED (AC-A6): parse->toggle->write->re-parse = same items, exactly ONE flipped checked bit, ZERO other diffs — a planted human note + section header + the declared_stack/markers MUST survive.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-4`
**Linked story:** `S-4`
**Why we capture this:** (fill)

## TR-5 — R-5 enforcers + ship-coverage: extend scaffold-coverage-scan (planted ungated-readiness FAILS + planted brand-leak FAILS); add brand-leak-scan.js; confirm the panel + producer ship in the scaffold payload (WG-23) and assert it.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-5`
**Linked story:** `S-5`
**Why we capture this:** (fill)

## TR-6 — R-6 design quality: the panel passes the design-quality gauntlet (Playwright); wire design-quality-gate into sprint-composition so UI-touching sprints get mandatory design review (report-only ramp; blocking flip operator-gated).

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-6`
**Linked story:** `S-6`
**Why we capture this:** (fill)
