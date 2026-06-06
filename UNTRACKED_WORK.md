# UNTRACKED_WORK.md

> **What this is.** The ledger of meaningful work performed **outside** a formal epic or sprint,
> per the enforced tracking system in
> [`agentic_os_tracker_system_improvements.md`](./agentic_os_tracker_system_improvements.md) §18 / §31.
> Untracked work is allowed only if it is captured here. The President agent periodically reconciles
> each entry into the proper epic/sprint structure (§18, §31).
>
> **Authority.** Subordinate to [`TRACKER.md`](./TRACKER.md) (§3). This is a capture ledger, not a
> source of truth for tracked work.
>
> **Owner:** President agent.
> **Last updated:** 2026-06-05.
> **Entry format:** see [`trackers/templates/UNTRACKED_WORK_TEMPLATE.md`](./trackers/templates/UNTRACKED_WORK_TEMPLATE.md).

---

## Open / unreconciled entries

### UW-001 — Stale-worktree-cwd hazard handling

- **Date and time:** 2026-06-05
- **Session ID:** 2026-06-05-tracker-scaffold (june-5)
- **Agent or agents involved:** Alpha (docs/systems builder)
- **Description of work:** This session's cwd was a stale, dead worktree
  (`.claude/worktrees/e6-orgmap-collapse/.claude/worktrees/e6-recover`). The hazard was handled by
  operating strictly on canonical via absolute paths, documented in the operator memory layer
  (working-doc / MEMORY note that worktree-cwd dispatches must target canonical), so future sessions
  recognize and avoid it. Physical cleanup (removal of the dead worktree directory) was deliberately
  deferred to a future session because removing worktrees was out of scope for this authoring task
  and not safe to do from inside the stale worktree.
- **Files changed:** None on disk in this entry's scope (memory/doc note only; no canonical file edit).
- **Paths changed:** None. (Dead worktree path identified but NOT removed — deferred.)
- **Wirings changed:** None.
- **Definitions changed:** None.
- **Reason work was not attached to an epic or sprint:** Operational hazard handling discovered
  mid-session; no sprint existed for environment/worktree hygiene.
- **Should it be retroactively attached to an epic or sprint?** Undecided — President to reconcile.
  Candidate: a worktree-hygiene cleanup sprint, or fold the deferred cleanup into the next session's
  start-of-work checks.
- **Follow-up action required:** Remove the stale dead worktree directory
  `.claude/worktrees/e6-orgmap-collapse/.claude/worktrees/e6-recover` (and parent if empty) from a
  session NOT rooted inside it; confirm no in-flight builder depends on it first.
- **Evidence of completion:** Hazard documented (memory note); this ledger entry. Cleanup itself is
  NOT yet done — explicitly deferred.
- **Related definitions:** Untracked work, Path (see TRACKER.md).
- **Related verification items:** Path existence of the dead worktree dir (unverified-removed —
  still present as of 2026-06-05).

### UW-002 — E3 ship-boundary audit baseline (32 skill→script refs allowlisted)

- **Date and time:** 2026-06-05
- **Session ID:** 2026-06-05-tracker-scaffold (june-5)
- **Agent or agents involved:** Alpha
- **Description of work:** Established the ship-boundary audit baseline for the skill→script reference
  gate. The gate parses every SHIPPED skill `.md` for `scripts/...` references and fails on any NEW
  (unlisted) ref. 32 pre-existing skill→script references (drift shipped since 0.13.x) were captured
  into a curated `KNOWN_DANGLING_REFS` allowlist so the gate can BLOCK new drift without failing on
  the historical baseline.
- **Files changed:** `scripts/warpos/release-build.js` (KNOWN_DANGLING_REFS allowlist, ~line 207–284).
- **Paths changed:** None created/deleted (edit to existing file).
- **Wirings changed:** The release-build skill→script gate now anchors on the 32-entry allowlist.
- **Definitions changed:** None.
- **Reason work was not attached to an epic or sprint:** Release-tooling hardening done as part of the
  E3 dispatch/registry work without a dedicated sprint ticket for the allowlist baseline itself.
- **Should it be retroactively attached to an epic or sprint?** Yes — candidate parent: E3
  (v0.2 dispatch consumers derive from the registry) per TRACKER.md, or a release-integrity epic.
  President to reconcile.
- **Follow-up action required:** Burn down the 32-entry allowlist over time (convert dev-only refs to
  non-shipped, or wire genuinely-shipped scripts). Track allowlist size as a debt metric.
- **Evidence of completion:** `scripts/warpos/release-build.js` lines 201–284 (gate comment block +
  32 allowlist entries verified present 2026-06-05 via grep).
- **Related definitions:** Wiring, Validator, Known gap (see TRACKER.md).
- **Related verification items:** `scripts/warpos/release-build.js` Verified Exists; allowlist count = 32.

### UW-003 — Classify the tracker-system project brief as a runtime-working-doc

- **Date and time:** 2026-06-05
- **Session ID:** 2026-06-05-tracker-scaffold (june-5)
- **Agent or agents involved:** Alpha
- **Description of work:** Classified `agentic_os_tracker_system_improvements.md` (the active
  tracker-system project spec / requirements input) as a WarpOS-internal `runtime-working-doc` in the
  manifest builder, alongside `DUMP.md` and `TRACKER.md`. Such root working docs are tracked but NOT
  shipped to products and are not a framework view: `owner=runtime, managed=false`.
- **Files changed:** `scripts/warpos/manifest/build.js` (runtime-working-doc match rule, ~line 511–524).
- **Paths changed:** None created/deleted (edit to existing file).
- **Wirings changed:** Manifest ownership classification rule extended to cover the brief.
- **Definitions changed:** None (uses existing runtime-working-doc owner classification).
- **Reason work was not attached to an epic or sprint:** Manifest hygiene needed so the brief did not
  trip ship-boundary / manifest-honesty enforcers; discovered while authoring the tracker system.
- **Should it be retroactively attached to an epic or sprint?** Yes — candidate parent:
  E-TRACKER-001 (this tracker-system epic). President to reconcile.
- **Follow-up action required:** Remove the brief's entry from the runtime-working-doc match rule when
  the project lands and the spec is archived/relocated under `_requirements/` (noted inline in
  `build.js`).
- **Evidence of completion:** `scripts/warpos/manifest/build.js` lines 511–524 (runtime-working-doc
  rule lists `agentic_os_tracker_system_improvements.md`, verified present 2026-06-05 via grep).
- **Related definitions:** Path, System Inventory (see TRACKER.md).
- **Related verification items:** `scripts/warpos/manifest/build.js` Verified Exists; rule covers the
  brief, `DUMP.md`, and `TRACKER.md`.

### UW-004 — Mode-init ≠ authorization (mode-entry must not trigger autonomous work)

- **Date and time:** 2026-06-06
- **Session ID:** session/2026-06-06
- **Agent or agents involved:** Alpha (α, solo dev fix — NOT a sprint run)
- **Description of work:** Implemented the ROADMAP item "Mode-entry must NOT trigger autonomous
  work (mode-init ≠ authorization)" (REPORTED-2026-06-06, commit `9e6b45c`). Three layers:
  (1) **mechanical** — `scripts/mode-set.js`, the single canonical mode-marker writer every
  `/mode:*` skill calls, now prints a loud "⛔ MODE-INIT ≠ AUTHORIZATION — setup only, STOP and
  await an explicit in-session task" banner on every *fresh* mode entry (silent on same-mode
  lock/activeBuild re-runs); (2) **behavioral** — all four `/mode:*` skills (`sprint`, `adhoc`,
  `oneshot`, `solo`) gained a top-of-Procedure "⛔ Mode-init ≠ authorization — STOP after setup"
  section, and `sprint.md`'s "Run the sprint" step is re-gated as a separate, task-triggered action
  explicitly NOT reached by mode entry; (3) **doctrine** — `CLAUDE.md` + `alpha.md` carry a
  "Mode-init ≠ authorization" rule scoping "Act, don't ask" (an inherited "continue" from a
  handoff/DUMP/TRACKER is context, not a command). Residual (no mechanical *detector* of a
  violation) logged as enforcement-debt **ED-031**.
- **Files changed:** `scripts/mode-set.js`; `.claude/commands/mode/{sprint,adhoc,oneshot,solo}.md`;
  `.claude/agents/president/alpha.md`; `CLAUDE.md`; `ROADMAP.md` (item → shipped);
  `.claude/project/memory/enforcement-debt.jsonl` (ED-031).
- **Paths changed:** None created/deleted (edits to existing files).
- **Wirings changed:** mode-set.js now emits the posture banner at the mode-entry chokepoint.
- **Definitions changed:** None (reinforces the existing autonomy doctrine).
- **Reason work was not attached to an epic or sprint:** Small, focused dev-tooling correction
  picked up directly from a ROADMAP backlog item via an explicit operator instruction this session;
  too small to warrant a formal sprint, and (fittingly) running a sprint to do it would be the very
  over-eager behavior being fixed.
- **Should it be retroactively attached to an epic or sprint?** Candidate parent: a skill-reliability
  / agent-posture epic if one is formed. President to reconcile. Until then this is the record.
- **Follow-up action required:** None blocking. Optional: build the ED-031 detector (a PreToolUse
  first-action gate or a telemetry/scan check) if mode-init drift recurs despite the banner+doctrine.
- **Evidence of completion:** Banner tested live — silent on same-mode re-run, prints on fresh entry
  (sprint→adhoc→sprint cycle, this session); enforcement-debt JSONL re-parsed clean (23 lines,
  last id ED-031); ROADMAP item flipped to `[shipped — 2026-06-06]`.
- **Related definitions:** Mode, Agent, Untracked work (see TRACKER.md).
- **Related verification items:** `scripts/mode-set.js` Verified Exists (banner fn `printPostureBanner`
  + `isFreshEntry` gate); the four `/mode:*` skills carry the STOP section; ED-031 present in
  `enforcement-debt.jsonl`.

---

## Reconciled / closed entries

None currently recorded.
