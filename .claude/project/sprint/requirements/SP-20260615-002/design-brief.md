# Visual Direction — SP-20260615-002 Roadmap Panel (browser GUI)

**Design Lead brief.** Mirrors the shipped Dispatch Console (`scripts/dispatch/gui.js`) — an EXTENSION of that design language, not a new one. The frontend builder (R-3) implements from this; design-quality + visual-review (R-6) approve against §4.

**One line:** a single-column, **density-managed** dashboard — a NEXT-ACTION hero, then four collapsible sections (Active sprints, Roadmap, Epics, Sprint breakdown) — reusing gui.js's exact dark tokens, card/row idiom, and modal. **Collapse-and-filter by default is the spine** (40 in-flight + 17 epics must NOT render as a wall).

## 1. LAYOUT (top→bottom), stable `data-area` selectors
Reuse gui.js's shell (`<main>` max-width 1200px centered; `.header` with h1 "Roadmap" + subtitle + 🔒 local-only line + Refresh).
- `[data-area="next-action"]` — NEXT-ACTION hero, ALWAYS expanded (the `tracker.nextAction` + primary sprint chip + jump links). Largest/highest-contrast element on cold load.
- `[data-area="toolbar"]` — sticky: status-group filter chips + text filter + collapse-all/expand-all.
- `[data-area="active-sprints"]` — collapsible, DEFAULT EXPANDED. Board of cards: primary card first (`border-color: var(--primary)`, the `.row.dirty` treatment) → actively-executing (cap ~8, reuse v1 CAP) → a single collapsed "+N more in-flight (M stale planning)" expander row. NEVER 40 cards on load.
- `[data-area="roadmap"]` — collapsible, DEFAULT EXPANDED. The ranked do-next list.
- `[data-area="epics"]` — collapsible, DEFAULT COLLAPSED. Grid of epic cards with progress bars.
- `[data-area="sprint-breakdown"]` — collapsible, DEFAULT COLLAPSED (primarily reached by drilling a sprint).
- Footer: generatedAt + source-file provenance.
Card sections: `display:grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: var(--space-3)`. Stacks to 1 col < ~720px; page-level scroll only (no nested scroll); every card carries `data-id`.

## 2. TOKENS — reuse gui.js `:root` VERBATIM (copy the block; no new tokens, no raw hex/px)
--bg #0b0303 · --surface #141010 · --surface-alt #1e1818 · --text #f0eded · --text-muted #9a9494 · --primary #ff5a17 (+hover/soft) · --border #2a2424 (+focus) · --radius-lg 8px (cards) · --radius 4px · --radius-full (pills) · --shadow-lg (modal) · --space-1..7 (4→32px, used for ALL spacing) · Inter 14px base, h1 28/600 h2 18/600, mono for ids/counts. Status colors: --success #acd229, --warning #eab308, --error #ef4444, --info #d4a054 (+ -light/-border tints).

**Epic % → progress bar:** `.progress{height:6px;background:var(--surface-alt);border-radius:var(--radius-full)} .fill{height:100%;background:<state-color>;width:<pct>%}`. Fill color state-driven (NOT always green): Completed/100% → --success; Active 1-99% → --primary; Blocked/Paused → --warning; Cancelled/Superseded → --text-muted; Planned/0% → empty track. Parse the `~99%` string to a clamped int; show the literal text label beside it (honest approximate-ness).

**Status → pill (single source of truth for sprint AND ticket status; group by SEMANTIC via the v1 ACTIVE_STATUSES/TERMINAL_STATUSES sets — pill TEXT = raw status verbatim, COLOR = its group):**
| Group | color | examples |
|---|---|---|
| Active/executing | --primary | in_progress, building, gauntlet, review, design, releasing |
| Planning/queued | --text-muted on --surface-alt | planning, proposed, ready, ready_for_execution |
| Blocked/failed | --error | blocked, qa_failed, redteam_failed, waiting_on_* , reopened |
| In review | --warning | in_review |
| Done/terminal | --success | done, closed, released, retrospected, completed |
| Abandoned/dead | --text-muted (desaturated) | abandoned, cancelled, superseded, deferred |

Cards: extend gui.js `.row` (--surface bg, --border, --radius-lg, --space-4 pad; `.row-head` flex: id-mono+title left, status pill right; drillable → cursor:pointer + hover border-→--border-focus).

## 3. INTERACTIONS (all client-side, READ-ONLY — data fetched ONCE via /api/board; in-memory re-render like gui.js render())
- **Filter** (toolbar): status-group toggle chips (Active/Planning/Blocked/In-review/Done/All) — DEFAULT = Active+Blocked+In-review ON, Done+Planning OFF (the "what needs me" default). + one text `<input>` (gui.js .field style) matching id/title live. Only these two filters (subtract-before-add).
- **Expand/collapse:** prefer native `<details>/<summary>` (gui.js .preview idiom) with rotating chevron ▸/▾. Collapse-all/Expand-all ghost buttons. The "+N more" tail is itself an expander.
- **Drill (modal — reuse gui.js .modal/.modal-head/.modal-body/.modal-foot verbatim, fixed inset:0, backdrop rgba(0,0,0,.7), body-scroll-lock, backdrop-click closes):** sprint→tickets (grouped by §2 buckets + a thin stacked count-bar at top); epic→child-sprints (each child a mini-row with its status pill, clickable to swap the modal to that sprint's breakdown — modal-internal nav like gui.js setActiveDiff). Footer: Close ghost + muted "read-only — source: <file>" line. NO edit affordances anywhere.

## 4. "LOOKS NICE" AXES (R-6 asserts these; builder self-checks first)
(1) visual hierarchy — hero unambiguously dominant on cold load; (2) consistent tokens — zero raw hex/px outside the copied :root (grep-able: every color var(--…), every space var(--space-…)); (3) spacing rhythm — section gaps --space-7, card gaps --space-3; (4) status-color system applied uniformly (same word = same color in card/epic-child/ticket); (5) NO text-dump feel — cold load = hero + handful of active cards + collapsed deeper sections; (6) legible density at real scale (stale tail collapsed, epics default-closed, ticket depth behind drill); (7) styled empty + "section unavailable" states (see §5); (8) interaction feedback (active filter chip filled, chevron rotated, hover border lift, clean modal); (9) responsive (stacks to 1 col narrow, toolbar usable, no horizontal overflow).

## 5. VISUAL RISKS + binding mitigations
1. **Density (highest):** Active-sprints = primary + actively-executing (cap ~8) + collapsed "+N more (M stale planning)"; Epics/Breakdown default-collapsed; filter hides Done/Planning by default. This is the SPINE, not a nicety.
2. **"section unavailable" must look intentional:** render a degraded section as a gui.js `.banner info` (--info) — inline icon + "This section couldn't load: <reason>" + source filename, INSIDE the section frame so the rest is visibly fine. EMPTY ≠ UNAVAILABLE: "None in flight"/"No epics yet" = calm --text-muted empty state; "section unavailable" = info-banner. Two distinct, both-styled states.
3. **Cold start:** hero shows NEXT-ACTION (or calm "No next action set"); each section its styled empty state; page looks composed-at-rest, not vacant.
4. **Modal layering:** fixed inset:0 + backdrop + body-scroll-lock (copy gui.js exactly).
5. **Status-synonym fragmentation:** map color via the v1 ACTIVE_STATUSES/TERMINAL_STATUSES sets (exported from roadmap.js) → semantic group → color. Single source of truth; never map by raw string.

## Open escalation (NOT decided here)
If the operator wants ALL in-flight sprints visible at once (a true command-board / wall-of-status they scan, not drill), the layout flips to a dense kanban-by-status board (columns=status groups, ~40 compact chips visible). That's a product-scope question → Product Lead. This brief assumes the PRD's "glance + drill-down" → collapse-by-default dashboard.

Substrate to mirror: `scripts/dispatch/gui.js` (:root tokens; .row/.modal/.banner/.field; render() pattern). Data: `scripts/panel/roadmap.js` (reuse inFlight/isActivelyExecuting/isStalePlanning/TERMINAL_STATUSES/ACTIVE_STATUSES/CAP/unavailable).
