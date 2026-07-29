# `_planning/` — WarpOS planning lifecycle store

`_planning/` is now **two things at once**:

1. **A read-only content corpus** (existing) — `ingest/` (raw external knowledge), `sources/`, `reviews/`, and the long-form plan/principle docs are consumed by `/guides:write --from-corpus`, `/learn:ingest`, and product-lead citation. This usage is unchanged.
2. **A tracker-linked lifecycle store** (new, S-LC-08 / E-LIFECYCLE-001 §8.8 + §K) — durable plan *artifacts* (epics, sprints), reusable playbooks, planning-time decisions, processed research, and archived/superseded plans, each wired to `TRACKER.md` / `ROADMAP.md` / `trackers/`.

## Subdirectories

| Dir | Holds | Written by | Naming |
|-----|-------|-----------|--------|
| `epics/` | durable epic plan artifacts | `/epic:plan` (President α) | `<E-id>.md` |
| `sprints/` | durable per-sprint plan artifacts | `/sprint:plan` | `<SP-id>.md` |
| `playbooks/` | reusable execution playbooks | `/playbook:add` | `<topic>-playbook.md` |
| `decisions/` | planning-time decision records | President α / β | `<YYYY-MM-DD>-<slug>.md` |
| `research/` | processed research feeding plans | `/research:deep` | `<topic>-research.md` |
| `archive/` | superseded / closed plan artifacts | `/epic:close`, `/epic:fold` | preserves original name |

Pre-existing corpus dirs (`ingest/`, `plans/`, `reviews/`, `sources/`) and the long-form docs (`warpos-lifecycle-plan.md`, `principle.md`) are untouched.

**Active product-plan triad (Vlad — agent+MCP, 2026-07-28):** [`vlad-agent-mcp-plan.md`](vlad-agent-mcp-plan.md) (the plan + 6 grill rounds of recorded rulings) · [`vlad-why-us.md`](vlad-why-us.md) (differentiators vs standalone hosts) · [`vlad-transferability.md`](vlad-transferability.md) (what ports vs rebuilds, 34 families). Read the plan first; the epic derives from all three. Note: `plans/` holds the separate org/GTM "product-studio" expansion planning (a *different* epic) and is NOT part of the epic/sprint lifecycle-store contract.

## Tracker-linkage convention (load-bearing)

A plan is invisible work unless it is wired into the tracker (`principle.md` #16). The linkage is **bidirectional and stable**:

- A plan artifact at `_planning/epics/<E-id>.md` MUST carry a `tracker:` frontmatter key whose value is the relative path to its epic tracker, e.g.:

  ```yaml
  ---
  tracker: trackers/epics/E-LIFECYCLE-001-mode-lifecycle-enforcement.md
  ---
  ```

- The epic tracker (`trackers/epics/<E-id>-*.md`) links back to the plan artifact (`../../_planning/epics/<E-id>.md`).
- Sprint plan artifacts (`_planning/sprints/<SP-id>.md`) additionally name their parent `epic:` key.

The pointer format is the `tracker:` (and `epic:`) frontmatter key. A first-line relative-link to the tracker file is an acceptable equivalent when frontmatter is absent.

## Source-of-truth relationship

- `TRACKER.md` — the authority (state of record).
- `ROADMAP.md § Epics` — the epic registry.
- `trackers/epics/<E-id>.md` / `trackers/sprints/<SP-id>.md` — the per-item live *state*.
- `_planning/epics/<E-id>.md` / `_planning/sprints/<SP-id>.md` — the durable *plan artifact* the tracker links to (the reasoning, not the status).

The tracker is never derived from the plan artifact, nor vice-versa; they are linked, and divergence is a defect the planning principles (and `/scan:planning-principles`) surface.

## Planning principles + enforcer

Every plan artifact here is governed by **`principle.md`** (17 canonical principles). The three load-bearing, machine-checkable ones — a **named enforcer** per policy (#7), **proof / acceptance** for each claim (#6/#15), and an explicit **blast-radius** assessment (#5) — are enforced **report-only** by `/scan:planning-principles` (`scripts/checks/planning-principles.js`), wired into `/scan:full`. A plan that omits any of the three is flagged (never blocked, this wave).

## Ship boundary — UNCHANGED

`_planning/` (and every subdir under it, by prefix inheritance) is **manifest-excluded and MUST_NOT_SHIP** (ADR-0005, closing ED-012), enforced in two places:

- `scripts/warpos/manifest/walk-skip.js` — `_planning` is in `WALK_SKIP_DIRS`, so the manifest builder never enumerates anything under it.
- `scripts/checks/warpos-ship-coverage.js` — `_planning/` is in `MUST_NOT_SHIP_PREFIXES`, so the ship-coverage gate reds if anything `_planning/`-prefixed ever reaches the shipped set.

New subdirs inherit both exclusions automatically via the `_planning/` prefix — that is the whole point of adding the lifecycle store *beside* the corpus rather than moving plans out. Plans are git-tracked (so they version with the repo) but never shipped to consumer products.
