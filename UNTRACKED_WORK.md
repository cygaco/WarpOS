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

### UW-005 — WI-50: /portfolio:new silent-installer-no-op regression (fix + BC-29 gate)

- **Date and time:** 2026-06-06
- **Session ID:** session/2026-06-06
- **Agent or agents involved:** Alpha (α; verify-first then focused engine fix — right-sized
  away from the full ε sprint per RI-001 engine-sprint-fast-close)
- **Description of work:** Fixed a real, consumer-only regression flagged by the masterconsole
  session (its WI-50, downstream fix `9451259`) and **verified-canonical-first** (ED-008) before
  building: `scripts/portfolio/new-lib.js` `createProductRepo` installed WarpOS into a new product
  by calling `scripts/warp-setup.js` — the canonical-clone-only installer that is INTENTIONALLY
  NEVER SHIPPED (`release-build.js` allowlist) — guarded by `fs.existsSync`. On any CONSUMER install
  the file is absent → guard false → the install step **silently no-op'd** → the created project got
  app files but no WarpOS engine (no `.claude/`, no `scripts/` tree), dead on arrival. The 0.15.0
  step-driven rewrite (E-SPINUP-STEPS-001) rebuilt `new-lib.js` without absorbing masterconsole's
  0.14.0 fix, reintroducing the bug for consumers. (NOTE: it does NOT reproduce when running
  `/portfolio:new` from canonical, where `warp-setup.js` is present — classic ED-008 "downstream
  reflects its installed version.") **Fix:** new `_installWarpOS(repoPath, {spawn})` helper installs
  via the SHIPPED `install.ps1` (`-Target <repo> -SkipPrompt`; `$Source` self-resolves so it installs
  the running WarpOS — canonical OR consumer), keeps `warp-setup.js` as a legacy fallback, and
  replaces the silent skip with a **loud completeness gate** (asserts `.claude/framework-installed.json`
  exists post-install; FAILS LOUDLY when no installer is available or the install produced no engine).
- **Files changed:** `scripts/portfolio/new-lib.js` (fix + `_installWarpOS` helper + export);
  `scripts/checks/portfolio-installer-loud.js` (NEW — the BC-29 detector: static source contract +
  injected-spawn behavioral D1/D2/D3 checks); `_requirements/07-testing/recurring-bug-classes.json`
  (+BC-29, status covered); `.claude/framework-manifest.json` + `.claude/framework-installed.json` +
  `_warpos/MANIFEST.json` (regen — new detector is now a tracked asset, 1069→1070).
- **Paths changed:** +`scripts/checks/portfolio-installer-loud.js` (new framework asset).
- **Wirings changed:** BC-29 is now a gated regression class — the testsuite enforcer
  (`scripts/testsuite/enforce.js`, canonical-mandatory, release-blocking) runs the detector.
- **Definitions changed:** None.
- **Reason work was not attached to an epic or sprint:** Hotfix for a 0.15.0 regression, relayed via
  the operator from masterconsole's gap register; picked up directly. Natural parent epic =
  E-GOLDEN-FLOW-001 (the create-a-project → on-screen golden flow, whose first step this bug breaks).
- **Should it be retroactively attached to an epic or sprint?** Yes — fold under E-GOLDEN-FLOW-001
  (or E-CONTENT-DELIVERY-001 ship-coverage). President to reconcile. The 0.15.1 release carries it.
- **Follow-up action required:** **Cut 0.15.1** (operator-requested) so downstream takes it clean —
  GATED on operator approval (release pushes + ff-merges to `main` + tags). Optional deeper follow-up:
  confirm every consumer install actually ships a runnable `install.ps1` + `version.json`
  (E-CONTENT-DELIVERY-001 ship-coverage) so the loud-fail path is rarely hit.
- **Evidence of completion:** Detector `node scripts/checks/portfolio-installer-loud.js` → exit 0
  (`[BC-29] PASS`); testsuite enforce → 17/19 runnable green, 0 NEW regressions, exit 0; `new-lib.js`
  `node -c` parses; manifests regenerated (asset count 1070). Fix verified against canonical 0.15.0
  source (warp-setup.js present in repo but 0 refs in the 0.15.0 capsule; install.ps1 shipped with
  `-Target`/`-SkipPrompt`; `$Source = Split-Path -Parent $MyInvocation.MyCommand.Path`).
- **Related definitions:** Validator, Wiring, Verification, Evidence (see TRACKER.md).
- **Related verification items:** `scripts/portfolio/new-lib.js` Verified Exists (`_installWarpOS`
  exported, install.ps1 + framework-installed.json gate present); BC-29 present in
  `recurring-bug-classes.json` (29 classes); `scripts/checks/portfolio-installer-loud.js` Verified
  Exists + runnable (exit 0).

---

## Reconciled / closed entries

None currently recorded.
