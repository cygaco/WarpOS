# SP-20260531-001 — `_reports/` reporting system (design note)

**Status:** core built this sprint (folder + README + template + `/report` skill).
This note carries the **deltas α/β must integrate** — wiring into shared flows,
the coverage enforcer, and the `paths.json` change — none of which I touched
(they edit shared surfaces this build was scoped out of).

**Built (uncommitted, canonical):**
- `_reports/` + `sprints/ milestones/ sessions/ checkpoints/` (`.gitkeep` each)
- `_reports/README.md` (folder explainer + format convention + dual-identity + ownership)
- `framework/templates/report/REPORT_TEMPLATE.md` (the format contract)
- `.claude/commands/report.md` (`/report` unified mode skill)

---

## A. Wiring design — where each report auto-emits

The principle: `/report` is the **plain-language layer**. It does not replace
the retro (analytical, schema-validated tracker record) or the handoff
(resume-this-work doc) — it complements both. Auto-emit points should **call or
suggest** `/report`, not duplicate its logic.

### A1. Sprint-close → `/report sprint <SP-id>`

Two candidate hook points, in priority order:

1. **`/sprint:retrospective` (preferred).** The retro is the richest
   plain-language source (`retro.md` Summary/Friction/Action-Items). Add a
   **Step 8 — File ELI5 report** after sign-off: run `/report sprint <SP-id>`,
   which reads the just-written `retro.{yaml,md}` + the sprint's commits and
   files `_reports/sprints/<SP-id>.md`. Reversible, fail-open — mirror the
   retro's own posture (LLM fail → skeleton, never block).
2. **`/sprint:full` Step 8 (Completion).** For full-pipeline runs, emit the
   report alongside the `sprint-full-report.md` write at Step 8, or right after
   the Step-8b roadmap-trace. `/sprint:full` already ends by running the retro,
   so wiring it at the retro (option 1) covers `/sprint:full` transitively —
   **prefer option 1** and let `/sprint:full` inherit it. Only add a direct
   Step-8 call if a full run can skip the retro.

> Recommendation: wire **once**, at `/sprint:retrospective` Step 5/6 (after
> artifacts written, after sign-off). Single insertion point, no double-emit.

### A2. Milestone-close → `/report milestone <name-or-version>`

No single "milestone close" skill exists today; milestones close via ROADMAP
narrative + (for WarpOS) `/warp:release`. Two options:

- **`/warp:release`** (WarpOS canonical releases): after the tag/ff-merge, file
  `/report milestone <version>` reading the ROADMAP milestone block + the
  release record. This is the natural "release announcement, readable" moment.
- **Manual / `/roadmap:cleanup`**: when a milestone is marked shipped in
  ROADMAP, suggest `/report milestone`. Lower-friction but un-enforced.

> Recommendation: wire into `/warp:release` for canonical; for downstream
> products (which may not use `/warp:release` for their own milestones), leave
> `/report milestone` operator-invoked and let `/scan:report-coverage` (§B)
> surface the gap.

### A3. Session-end → `/report session` (the weekly-status equivalent)

This is the operator's stated "substitute for weekly reports — maybe at the end
of each session." Session-end is **not** a hard event in WarpOS (no Stop hook
files a session summary today; `/session:handoff` is operator-invoked). Options:

- **Suggest at handoff:** `/session:handoff` already synthesizes the session.
  Add a closing line: "File a plain-language session report? → `/report
  session`." Cheapest; keeps handoff (for the next session) and report (for
  humans) distinct.
- **Stop-hook nudge (lighter):** a `Stop` hook that, when the session had
  commits/sprint activity, prints a one-line reminder to run `/report session`.
  Non-blocking, fail-open. Does **not** auto-write (a report needs the
  conversation arc, which the hook can't synthesize well).

> Recommendation: **suggest at `/session:handoff`** + an optional Stop-hook
> reminder. Do **not** auto-generate session reports unattended — the ELI5
> quality bar needs the model in the loop. β to rule on whether the Stop nudge
> is worth the noise.

### A4. Checkpoint → `/report checkpoint "<title>"`

Always operator-invoked by design ("additional reports at intelligent
checkpoints"). No auto-emit. This is the free-form escape hatch.

---

## B. Proposed enforcer — `/scan:report-coverage`

**Direct analog of `/scan:roadmap-trace`** (WG-16), which closed the same class
of gap: a policy ("every shipped sprint gets a Shipped narrative") that was
skill-body discipline with no automated check. Same pattern here — "every
done/retrospected sprint + shipped milestone gets a `_reports/` entry" is
aspirational until something detects violations (per CLAUDE.md §Policy &
Enforcement Hygiene: **every policy needs a named enforcer**).

**Spec:**

- **Skill:** `.claude/commands/scan/report-coverage.md` (namespace `scan`,
  `reads: [paths.sprintActiveRegistry, paths.reportsDir, paths.roadmap]`,
  `writes: []`, `user-invocable: true`). Backing script
  `scripts/check/report-coverage.js` (sibling to `roadmap-trace.js`).
- **Assertion:** every sprint with status `done` / `retrospected` / `released`
  in `paths.sprintActiveRegistry` has a `_reports/sprints/<SP-id>.md`. (Stretch:
  every milestone marked shipped in `ROADMAP.md` has
  `_reports/milestones/<name>.md` — but milestone identity in ROADMAP is
  free-text; start with sprints, the structured set, exactly as roadmap-trace
  did.)
- **Output:** `OK <SP-id>` / `MISSING <SP-id> (no _reports/sprints/<id>.md)`,
  trailer `# <covered>/<total> sprints reported`.
- **Exit:** `0` all covered (or no registry / empty — fail-open warn, mirroring
  roadmap-trace); `1` at least one missing.
- **Posture:** **warn-not-block during soft rollout** (like
  sprint-routing-guard). Sprints that closed *before* `/report` existed must not
  retro-fail the check — gate on a `since` date (the sprint's `created`/`closed`
  ≥ the date `/report` shipped) or a one-time baseline allowlist, so the
  enforcer only holds sprints that *could* have had a report. Without this it
  lights up red on ~40 historical sprints day one.
- **Wire into `/scan:full`** alongside roadmap-trace so coverage drift surfaces
  in the unified sweep.

> Until this lands, log the gap to `paths.enforcementDebt` via
> `/enforcement:log` so the unenforced policy is visible at `/enforcement:list`
> + `/scan:full` (the CLAUDE.md-mandated fallback when a policy ships before its
> enforcer). The `/report` skill body is the *interim* enforcer (it instructs
> the discipline); `/scan:report-coverage` is the *real* one.

---

## C. `paths.json` delta — `reportsDir`

**Not applied** (I was scoped out of editing `.claude/paths.json` / the
registry). Proposed addition to the **source** registry
`framework/paths.registry.json` (`paths` object), which `scripts/paths/build.js`
compiles into `.claude/paths.json`:

```json
"reportsDir": {
  "path": "_reports",
  "kind": "dir",
  "owner": "project",
  "mutable": true,
  "introducedIn": "0.12.0",
  "docsToken": "paths.reportsDir"
}
```

- `owner: project` — same class as `requirements`, `research`, `briefs`. Report
  **content** is per-project output, NOT framework-manifest content. Confirmed
  against the existing `requirements` entry shape.
- `introducedIn` — current canonical version is **0.11.1**; use the next
  release (`0.12.0` or whatever this work ships in). Adjust at apply time.
- After adding: run `scripts/paths/build.js` to regenerate `.claude/paths.json`,
  `paths.generated.js`, and `path-lint.rules.generated.json`. (This is the
  manifest/generated-artifact regen the operator's standing rule requires — α to
  run as the *last* step before commit so BC-02/BC-05 stay green.)
- **Optional but recommended:** add `_reports/` (or just the four content
  subdirs) to `skipSubstrings` in the registry so per-report `.md` files with
  internal ids in their `## Details / links` section never trip path-lint warns.
  The README + template + skill are framework-owned and *should* be linted; the
  emitted reports are project output and should be skipped — same split as
  `.claude/project/sprint/` (already in `skipSubstrings`).

### C1. Why the skill references the literal until then

`.claude/commands/report.md` references `paths.reportsDir` in prose **with an
explicit note** that the key is proposed-not-yet-registered and the literal
`_reports/` is the interim root. Once C lands, drop the note. The README and
template likewise use the literal `_reports/` (correct for now; these are prose,
not code, and the dir genuinely exists at that path).

---

## D. Manifest / shipping (for α — do NOT assume)

`_reports/` is a **framework-owned skeleton with project-owned contents**:

- **Ships to consumers (framework-owned):** the `_reports/` dir skeleton (4
  subdirs + `.gitkeep`), `_reports/README.md` (as a seed), the template
  `framework/templates/report/REPORT_TEMPLATE.md`, and `/report` (+
  `/scan:report-coverage` once built). These must be enumerated in
  `_warpos/MANIFEST.json` / `framework-manifest.json` so a fresh install gets an
  empty `_reports/` shelf (`scan:warpos-manifest-coverage` will flag them if
  not — "added framework content, forgot to register").
- **Never ships (project-owned):** the `.md` reports that land in the four
  subdirs. WarpOS's own reports in canonical are not propagated to consumers; a
  consumer's reports are theirs. This is the **dual-identity** pattern, same as
  `ROADMAP.md` (canonical = WarpOS's; consumer = their own; one-way sync of
  structure only, never content).

**Enforcer interaction to watch:** `scripts/checks/framework-purity.js` gates
root-level leaks via `ROOT_LEAK_PREFIXES = ["_requirements/", "_docs/"]`.
`_reports/` is **deliberately not** in that list and must **not** be added —
`_reports/` is an intended project-owned root dir (like `_requirements/` is
*expected* at canonical root pre-scrub). I confirmed `_reports/` does not trip
framework-purity today. Flagging so a future "tighten root-leak" change doesn't
accidentally sweep it in.

---

## E. Open questions for α / β

1. **A1 insertion point** — confirm wiring at `/sprint:retrospective` Step 5/6
   (single point, `/sprint:full` inherits) vs. also a direct `/sprint:full`
   Step-8 call. I recommend retro-only.
2. **A3 Stop-hook nudge** — worth the noise, or suggestion-at-handoff only? β
   call (autonomy/friction tradeoff).
3. **B baseline** — date-gate vs. allowlist for pre-`/report` sprints so the
   coverage enforcer doesn't retro-fail history. Pick one before wiring into
   `/scan:full` in block mode.
4. **C introducedIn** — set to whatever version this ships in (≥0.12.0).
5. **Milestone identity (B stretch)** — milestone↔report linkage needs a stable
   milestone id in ROADMAP; defer the milestone half of the enforcer until that
   exists (sprints-only v1, like roadmap-trace shipped).

## F. Validation run (this build)

`node scripts/path-lint.js` → **CRITICAL: 0** (baseline was also 0; my new files
added no criticals). Full verbatim output in the report-to-lead message.
