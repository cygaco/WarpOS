# Sprint Retrospective — /sprint:retrospective skill — close-of-sprint reflection

**Sprint:** `SP-20260513-004`
**Plan Contract:** `PC-20260513-0005`
**Synthesis mode:** `llm`
**Synthesized at:** `2026-05-13T22:00:13.066Z`
**Signed off by:** `alpha` at `2026-05-13T22:00:13.066Z`

## Summary

Built /sprint:retrospective end-to-end in a single sprint and dog-fooded it on itself: 8 tickets shipped across schema, writer, skill doc, templates, status enum, synthesis prompt, and workflow doc. Sibling schema preserved sprint-history as a frozen registry. The retrospective you are reading is the closing test: SP-004 generated its own retro via the very skill it built — synthesis_mode=llm proves the operator-supplied synthesis path works end-to-end.

## Outcomes Shipped vs Planned

### Shipped
- sprint-retrospective.schema.json sibling schema authored (preserves sprint-history.schema.json as frozen registry) _(evidence: T-20260513-035 done, schemas/sprint/sprint-retrospective.schema.json present)_
- scripts/sprint/retrospective.js writer implemented (reads Plan Contract + tickets + issues + decisions + release record; writes retro.yaml + retro.md) _(evidence: T-20260513-036 done, retro.yaml + retro.md produced for SP-20260513-004)_
- /sprint:retrospective skill doc authored _(evidence: T-20260513-037 done, .claude/commands/sprint/retrospective.md present)_
- retro.yaml.tmpl + retro.md.tmpl templates written _(evidence: T-20260513-038 done, framework/templates/sprint/retrospective/ populated)_
- active-sprints.schema.json#status enum extended with `retrospected`; closed -> retrospected transition implemented _(evidence: T-20260513-040 done, SP-004 entry status: retrospected)_
- Synthesis prompt designed + wired (skill body passes --synthesis JSON to writer) _(evidence: T-20260513-041 done, this retro authored via the synthesis path)_
- --no-synth skeleton-only mode + synthesis fallback (fail-open per AC-7.3) _(evidence: T-20260513-042 done, 5 error-path exit codes verified in smoke test)_
- sprint-workflow.md updated to document the retrospective phase _(evidence: T-20260513-043 done)_

### Missed
_None._

## Plan Quality — Predictions vs Reality

- Predicted status: `pass`
- Actual status: `pass`
- Predicted confidence: `high`

Plan Contract correctly identified scope size=s, risk=low, and the right surfaces. Sibling-schema decision (vs extension) made in /sprint:design proved correct — keeps sprint-history.schema.json as a frozen registry while retro fields evolve independently. No scope creep; recommended variant shipped exactly as planned.

## Scope Variant Adherence

- Planned variant: `recommended`
- Actual variant: `recommended`
- Adhered: `true`

Recommended scope shipped — script + skill + schema + templates + status enum + synthesis prompt + workflow doc. Expanded scope (cross-sprint trend analysis, /learn:integrate hook) deliberately deferred and remains a candidate for a future sprint.

## Surprises

- Status transition gate required `closed` (not `releasing`) — release.js does not auto-flip the registry, so retrospective.js refused to run until the active-sprints.yaml was manually patched. — impact: minor
- Sibling schema decision (over extending sprint-history) made the writer simpler — retro fields evolve independently of sprint-history; no migration cost on the frozen registry. — impact: positive
- First worktree-rooted batch of ticket.js calls failed because ticket.js resolves the tracker path from CWD; the worktree had no tickets/ directory. cd into the main repo unblocked all 8 promotions in two parallel fan-outs. — impact: minor

## Friction Points

- **[medium / tooling]** release.js deploy did not transition the sprint registry from `releasing` -> `closed` automatically, blocking retrospective.js until the YAML was manually patched.
- **[low / tooling]** Worktree CWD vs main-repo path mismatch — ticket.js resolves the tracker path relative to CWD, so worktree-rooted invocations missed the actual tracker files. Workaround: cd into main repo for all sprint script calls.
- **[low / other]** The writer-script does not perform the LLM synthesis call itself — the slash-command body is responsible for calling the model and producing the --synthesis JSON. Naive script invocation always yields skeleton mode, which is correct behavior but easy to misread as a failure.

## Action Items for Next Sprint

- Make release.js deploy auto-flip active-sprints.yaml#sprints[].status to `closed` after a successful deploy (today the only path to closed is manual YAML edit or retrospective.js's transition from closed -> retrospected, which leaves a gap). _(owner: alpha)_ _(due: next sprint)_
- Document the worktree-vs-main-repo CWD constraint in scripts/sprint/README or in paths.js comments — any worktree-rooted invocation of ticket.js / checkpoint.js will silently miss real tracker files. _(owner: alpha)_ _(due: next sprint)_
- Add a stderr warning when retrospective.js runs without --synthesis and without --no-synth: `no synthesis payload supplied — emitting skeleton; pass --synthesis <file> or --no-synth to silence this warning`. _(owner: alpha)_ _(due: next sprint)_

## Tickets Completed

- `T-20260513-035`
- `T-20260513-036`
- `T-20260513-037`
- `T-20260513-038`
- `T-20260513-040`
- `T-20260513-041`
- `T-20260513-042`
- `T-20260513-043`

## Tickets Deferred or Abandoned

### Deferred
_None._

### Abandoned
_None._

### Reopened
_None._

## Issues Encountered

_None._

## Beta Decisions Reviewed

_None._

## Key Tradeoffs

- Sibling schema vs extending sprint-history.schema.json — chose sibling; preserves sprint-history as a frozen registry, retro fields evolve independently; cost is one extra schema file.
- Synthesis-in-script vs synthesis-in-skill-body — chose skill body owns the LLM call, script accepts --synthesis JSON file; mirrors plan.js --payload, keeps writer pure (no network), makes --no-synth and --retry-synth ergonomic.
- Auto-status-transition in retrospective.js vs in release.js — retrospective.js flips closed -> retrospected; release.js does NOT flip releasing -> closed (today). Cleanest place for the second transition is release.js deploy — see action item #1.

## Learning Candidates

- Multi-step skill workflows where each phase owns a single status transition reduce coupling but create gaps if any phase doesn't ship its transition. When designing a new workflow, enumerate every status transition upfront and assign one owner per edge. _(evidence: release.js does not flip releasing -> closed; retrospective.js cannot run; manual YAML patch required)_
- When a writer script accepts an optional synthesis payload, default to a stderr warning (not silent skeleton) if neither --synthesis nor --no-synth is passed. Silence is misread as failure. _(evidence: Initial dog-foot run produced skeleton without operator-visible signal)_
- Worktree-rooted invocations of CWD-resolving tracker scripts silently target the wrong repo. Pair every tracker-mutating script with an `assertInMainRepo()` check, or resolve paths from the script's own location rather than CWD. _(evidence: Initial ticket.js batch failed with `no ticket: <worktree path>`)_

## Sign-off

- Retro written by: `alpha`
- Retro written at: `2026-05-13T22:00:13.066Z`
- Synthesis: `llm` (—)
- History record: `(no sprint-history.yaml)`
- Release record: `RL-20260513-005`

> Re-run with `/sprint:retrospective --sprint SP-20260513-004 --force` to regenerate this retro from updated tracker state, or `--review-only` to print without regenerating.
