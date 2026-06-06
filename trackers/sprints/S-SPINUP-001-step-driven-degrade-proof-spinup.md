<!-- SPRINT TRACKER — spec §23. Linked from ../../TRACKER.md + parent epic. Template: ../templates/SPRINT_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# S-SPINUP-001 — Step-driven, degrade-proof `bootstrap:spinup`

- **Sprint label and number:** S-SPINUP-001
- **Title:** Step-driven invocation contract + anti-degrade engine + platform target + portfolio:new reconcile + Milestone→Epic + enforcers
- **Owner:** President
- **Parent epic:** [E-SPINUP-STEPS-001](../epics/E-SPINUP-STEPS-001-step-driven-degrade-proof-spinup.md)
- **Goal:** Implement WARPOS-PROMPT.md §1–§7 as one cohesive refactor of `scripts/bootstrap/spinup-orchestrate.js` + the phase modules + tests + skill body, then verify §8 acceptance.
- **Scope:** §1 step-driven invocation contract (positional `<step>`, `--json` status shape, consumer contract docs, fold preflight+intent→setup / onscreen→paint); §2 anti-degrade engine; §3 platform `--where`; §4 portfolio:new reconcile (create/scaffold callables); §5 Milestone→Epic rename (live layer); §6 portfolio suite scope guard; §7 regression enforcers.
- **Out of scope:** §8 is verification (recorded under DoD); `server/`/cockpit (MASTERCONSOLE-PROMPT — gated); native scaffolds; historical archive rewrites.
- **Current state:** Active
- **Percent completion:** 5% — gap analysis done; structural build starting.

## Definition of Done
- [ ] §1 positional `<step>` subcommand (`setup|canon|roadmap|paint`) + folded phases; stable `--json` status; consumer dispatch contract documented + enforcer named.
- [ ] §2 `--research off`/`light` rejected non-zero; `--auto` degrade/skip removed; `canon-no-unfilled-tokens` wired as a non-opt-out fail-closed canon gate; raw input never in canon; `--allow-needs-input` audited single-field exception + `/enforcement:log`.
- [ ] §3 `--where` accepted/threaded (brief + PRODUCT_MODEL + roadmap + scaffold); web/PWA baseline for all; native-packaging epic + `/warp:flag`.
- [ ] §4 `portfolio:new` → `create()/scaffold()` callables reused by `setup`; no duplicated logic.
- [ ] §5 Milestone→Epic across the live layer; `scan:roadmap-trace` green.
- [ ] §6 `portfolio:spinup` forwards `<step>`+modifiers verbatim; no new portfolio sub-skills.
- [ ] §7 seam + idempotent + resume + research-off-rejected + anti-degrade + headless-contract tests pass; `--research-in <fixture>` deterministic synthesis path.

## Related definitions
- Validator, Wiring, Evidence, Command, Hook — see ../../TRACKER.md

## Tasks
- [ ] §1 — rename phases preflight+intent→setup, onscreen→paint; positional step parser; stable `--json` status shape.
- [ ] §4 — split `portfolio/new.js` into `create()/scaffold()`; setup reuses.
- [ ] §2 — strip `off`/`light`/`--auto`; reject `--research off`; wire `canon-no-unfilled-tokens` gate; `--allow-needs-input`.
- [ ] §3 — `--where` platform target threading.
- [ ] §5 — Milestone→Epic rename (roadmap.js, roadmap:create.md, ROADMAP template, roadmap-trace, scaffold engine, skills, docs).
- [ ] §7 — rewrite `test-spinup-orchestrate.js`; add anti-degrade + research-off-rejected + headless-contract tests.
- [ ] §6 — verify `portfolio:dispatch.js` pass-through.
- [ ] §8 — β consult + acceptance checklist + scan:roadmap-trace green.

## Files expected to change
- scripts/bootstrap/spinup-orchestrate.js
- scripts/bootstrap/phases/{setup,canon,roadmap,paint}.js (renamed from preflight/intent/canon/roadmap/onscreen)
- scripts/bootstrap/test-spinup-orchestrate.js
- scripts/portfolio/new.js (+ a new create/scaffold lib if extracted)
- scripts/warpos/generate-roadmap-scaffold.js
- scripts/check/roadmap-trace.js
- .claude/commands/bootstrap/spinup.md
- .claude/commands/roadmap/{create,add,ideas,next,prioritize}.md
- ROADMAP.md template + framework templates referencing Milestone
- None currently recorded beyond the above.

## Files actually changed
- None yet — 2026-06-06.

## Paths expected to exist
- scripts/bootstrap/phases/setup.js, canon.js, roadmap.js, paint.js (post-rename)

## Paths verified to exist
- scripts/bootstrap/spinup-orchestrate.js + phases/{preflight,intent,canon,roadmap,onscreen}.js — Verified Exists 2026-06-06 via Read by President α (pre-refactor).

## Paths verified nonexistent
- None currently recorded.

## Wirings expected
- canon step → canon-no-unfilled-tokens fail-closed gate — purpose: no degraded canon — source file scripts/bootstrap/phases/canon.js.
- consumer dispatch contract → documented in .claude/commands/bootstrap/spinup.md + named enforcer in test-spinup-orchestrate.js.

## Wirings verified
- None currently recorded.

## Dependencies
- None hard. Reuses existing engines (canon/generate.js, clone.js, scaffold/app.js, roadmap:create).

## Blockers
- None currently recorded.

## Risks
- Tightly-coupled edit surface — mitigated by in-loop build + targeted tests. Likelihood: high · Impact: medium.

## Decisions
- 2026-06-06 — Build in-loop under the engine-sprint speed cadence; parallelize only the §5 doc rename. (See parent epic Decisions.)

## Open questions
- None currently recorded.

## Session log
### 2026-06-06 — Session warpos-spinup-sprint
- Agent(s): President α + ε + β · Mode: sprint
- Work performed: gap analysis; sprint registered; build started.
- Files changed: this file (created). · Paths changed: none yet · Wirings changed: none yet
- Decisions: in-loop build. · Issues discovered: I-1 (turbo classifier).
- Definitions added/changed: None
- State change: (new) → Active · Completion change: 0% → 5%
- Verification performed: source read. · Validation run: node scripts/trackers/validate.js · Validation result: (pending)
- Next action: §1 step refactor + §4 reconcile.
- Evidence/references: runtime/notes/warpos-spinup-gap-analysis.md.

## Change log
### 2026-06-06 — Session warpos-spinup-sprint
- Changed: Created sprint S-SPINUP-001 (Active, 5%).
- Reason: Execute WARPOS-PROMPT.md §1–§7.
- Affected: this file; parent epic; TRACKER.md.
- Previous state: Did not exist.
- New state: Active, 5%.

## Evidence log
### 2026-06-06 — Source read end-to-end (pre-refactor baseline)
- Evidence type: Existence confirmation.
- Detail/location: spinup-orchestrate.js + phases/{preflight,intent,canon,roadmap,onscreen}.js + test + spinup.md + canon/generate.js + canon-no-unfilled-tokens.js + portfolio/new.js — all Read 2026-06-06.
- Verified by: President α · Supports: §0 gap analysis.

## Verification log
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| spinup orchestrator | Yes | Verified Exists | scripts/bootstrap/spinup-orchestrate.js | Read | 2026-06-06 | President α |
| canon-no-unfilled-tokens gate wiring | Yes | Missing But Required | scripts/bootstrap/phases/canon.js | Read — not yet wired (the §2 work) | 2026-06-06 | President α |

## Current next action
Build §1 (positional step subcommand + folded setup/paint phases + stable `--json`) and §4 (portfolio:new create/scaffold reconcile).

## Completion record
- Final state: Not yet complete
- Percent completion: n/a
- Completion timestamp: n/a
- Definition of done used: see Definition of Done above
- Evidence of completion: n/a
- Session IDs / dates / agents: 2026-06-06 · President α + ε + β
- Parent epic: E-SPINUP-STEPS-001
- Remaining follow-up items: full §1–§8 build
- Related untracked work: None
- ../../TRACKER.md updated: Yes · Roadmap reconciled: Yes
