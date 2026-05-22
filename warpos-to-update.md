# WarpOS Update Flags — DEPRECATED in canonical WarpOS only

> **Scope: this deprecation applies to canonical WarpOS only.** In consumer
> products (dreamteam, future products), this file and the `/warp:flag` /
> `/warp:promote-flags` skills remain first-class — they are the official
> downstream→upstream discovery channel.
>
> **Inside canonical WarpOS (this repo):** add discoveries directly to
> `ROADMAP.md` under the relevant subsection with inline lifecycle tags
> (`[open]`, `[in-progress]`, `[fixed-local]`, `[promote-ready]`,
> `[promoted]`, `[duplicate]`, `[blocked]`, `[deferred]`). Use
> `/roadmap:add`. The canonical repo doesn't need a "promote me upstream"
> channel — discoveries here are already the source of truth.
>
> **Inside consumer products:** keep using `/warp:flag <type> <title>` to
> log framework issues you spot while building. `/warp:promote-flags`
> drains those entries into canonical WarpOS where they become ROADMAP
> entries with `[fixed-local]`, `[promote-ready]`, or `[promoted]` tags.
>
> See `ROADMAP.md § Deprecated Trackers` for the canonical-side migration
> rationale and the four migrated entries.

<!-- migrated entries (2026-05-21):
  - 2026-05-14 agent-primitive-gap (duplicate) → ROADMAP § Install & Release Integrity > [blocked] Persistent team UI
  - 2026-05-21 research:deep .env fallback → ROADMAP § Install & Release Integrity > [open] research:deep env-file fallback
  - 2026-05-21 manifest generator gap (fixed-local) → ROADMAP § Install & Release Integrity > [fixed-local][promote-ready] Manifest generator missed 15 scripts/ subdirs
  - 2026-05-21 _requirements/00-canonical leak (open) → ROADMAP § Privacy / Promotion Safety > [open] _requirements/00-canonical contains real product specs
-->
