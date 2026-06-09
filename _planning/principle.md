# WarpOS Planning Principles (canonical doctrine)

> Cleaned, de-duplicated canonical version of the planning discipline first drafted in
> `_planning/ingest/warpos-lifecycle.md` (Required Planning Discipline §1–§17, Section I).
> Intent preserved; wording tightened; the old "defer" phrasing replaced.
> **Status:** working doctrine. The lifecycle epic (`_planning/warpos-lifecycle-plan.md`)
> recommends promoting these into canonical homes (planning/epic/sprint skills, β judgment
> rules, the `_planning` template, and a tracker/scan enforcer) — see that plan's §8.11.

These principles govern how WarpOS plans large work — epics, sprints, system changes. They
apply to `/sprint:plan`, the proposed `/epic:plan`, β's plan judgment, and any planning
artifact under `_planning/`.

---

## 1. Ground in truth; never plan from assumption
Every claim about the repository must be verified against the actual file, command, hook,
config, skill, tracker, or log where that behavior lives. If something can't be verified, mark
it **Unknown** and name the exact read-only check that would resolve it. A command name never
implies behavior.

## 2. Read the whole surface before judging it
Inspect all relevant surfaces before proposing changes — mode commands, the slash-command
router, session lifecycle, sprint/epic files, trackers, `_planning`, agent/team registries,
dispatch, hooks, provider routing, install/bootstrap, env/secret handling, and any logs of
prior failures. Do not stop at the first plausible file.

## 3. Verify mechanisms before planning around them
If the plan depends on a dispatch system, hook layer, registry, lifecycle event, runtime state
file, or provider router, verify how it actually works first. Never assume a name implies a
mechanism.

## 4. Test tools mentally and structurally; trust no silent zero
Search tools miss things. For load-bearing absence claims, confirm with at least two
complementary methods (filename search + content search, registry parse + directory walk). If
one method says "nothing found," verify with another before treating the absence as real.
(WarpOS-specific: the Grep `glob`+`path` false-negative trap — see CLAUDE.md Tool Use.)

## 5. Find the full blast radius
For every proposed change, enumerate the files, commands, hooks, tests, docs, runtime state,
tracker/planning artifacts, and install/session flows it touches — plus existing behavior that
could break, backward-compat concerns, and enforcement gaps that would remain.

## 6. Earn statuses; do not assign them
"Enforced," "persistent," "subprocess-able," "safe," "tracked," "covered," "parallelizable,"
"runtime-verifiable," "hook-backed" — each must be backed by a check, test, validator, or
observed behavior. State the evidence that would prove the status, then produce it. (WarpOS:
the earn-it pattern — `subprocess_verified` is false until a real run proves it.)

## 7. Every policy needs a named enforcer
For every rule/contract/invariant in the plan, name the mechanism that makes a violation
self-detecting: hook, registry, command wrapper, lifecycle gate, validator, scan, fixture, CI
check, or telemetry someone reads. If no enforcer exists yet, mark it **planned enforcement
debt** and `/enforcement:log` it so the gap is visible — never ship a policy without naming its
enforcer or its debt at write-time.

## 8. Use isolated testing and planted violations
The test strategy must include sealed fixtures / capsules with **planted failures that must be
caught**. A gate that can't fail a real defect is theater. False-green tests are unacceptable;
harden every gate against lying (runner-error → non-zero, stale suppression self-flags,
malformed input → fail-closed).

## 9. Plan dry-runs and simulations before live execution
Before any live change, the implementation plan must include a simulation phase: mode-switch,
team-lifecycle, lifecycle-hook, sprint-init, provider-readiness, tracker-linkage, and rollback
simulations. Planning itself never mutates live state.

## 10. Use independent review for load-bearing decisions
Risky architecture choices require independent cross-provider / diff-model review during
implementation (the builder's model must not also be the reviewer's). The plan names exactly
where that review is required.

## 11. Sequence load-bearing work behind proven prerequisites — then continue into it
> Sequence risky or load-bearing work behind proven prerequisites, then continue into it once
> prerequisites are satisfied.

Do **not** let "sequence carefully" become an excuse to stop before the meat of the work.
"Defer the hard part" is a planning smell; ordering is about prerequisites, not avoidance.

## 12. One source of truth; wrong states must self-detect
Avoid duplicate mode/team/skill/registry definitions that drift. Prefer registry-derived
behavior, validators, and self-detecting mismatch checks. A duplicated definition is a future
drift bug — name the single canonical source and make divergence loud.

## 13. Reframe to the real system problem
Plan the system, not the symptom. The recurring dispatch/mode failures are one problem — the
**dispatch-shape operating layer**: modes, skills, agents, persistent teams, lifecycle hooks,
sprint/epic/tracker state, planning artifacts, provider readiness, and session lifecycle as one
coherent layer.

## 14. Surface taste/irreversible calls; decide mechanical calls directly
Escalate only what genuinely needs a human: naming conventions, public command names, major
workflow philosophy, permanent deletion, backward-incompatible behavior, and
spend/permission defaults. Decide mechanical-correctness calls directly with a recommendation,
not a menu.

## 15. Do not claim done without proof
Define the proof for each acceptance criterion. "Implemented" is not done — specify how the
implementation will *demonstrate* correctness (a real record with real elapsed/bytes, a diff, a
passing test, a caught planted violation).

## 16. Persist the plan properly
Every plan gets a durable home under `_planning/` and an explicit linkage to its epic, its
sprints, `ROADMAP.md`, and `TRACKER.md`. A plan that isn't wired into the tracker is invisible
work.

## 17. Scope runtime checks to runtime
Feasibility, provider-readiness, auth, and trust checks are runtime/prestep checks — described
in the plan, executed at implementation time, never run during the planning phase itself.

---

_Provenance: distilled from `_planning/ingest/warpos-lifecycle.md` on 2026-06-08. Reconciled
with the existing CLAUDE.md doctrine (Policy & Enforcement Hygiene, earn-it statuses,
one-source-of-truth, never-claim-done-without-proof) — these planning principles are the
plan-time expression of the same company values._
