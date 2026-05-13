# Sprint Retrospective — bootstrap-product-brief skill — guided brief in MD/DOCX/HTML

**Sprint:** `SP-20260513-001`
**Plan Contract:** `PC-20260513-0002`
**Synthesis mode:** `llm`
**Synthesized at:** `2026-05-13T22:44:51.955Z`
**Signed off by:** `alpha` at `2026-05-13T22:44:51.955Z`

## Summary

Shipped /product:bootstrap end-to-end in one sprint: skill scaffold + namespace, bounded discussion with section-coverage QC, MD/HTML/DOCX writers (pandoc with fail-open fallback), output-path policy with re-run versioning, paths.json self-registration, and onboarding callout. All 8 truly-owned tickets (T-027..T-034) landed, the recommended scope variant shipped, release RL-20260513-002 deployed as 0.5.1-sp001. The sprint was the first to dog-food the new multi-sprint pipeline in parallel with SP-002/SP-003/SP-004/SP-005 and surfaced the sprint-helper ticket-bucket-bleed bug class first observed at T-20260513-039 (a /sprint:design subagent invoking ticket.js without --sprint flag landed the new ticket in SP-001's bucket).

## Outcomes Shipped vs Planned

### Shipped
- /product:bootstrap skill scaffolded under new /product: namespace (.claude/commands/product/bootstrap.md) — invokable, help text matches COPY C-1 _(evidence: T-20260513-027, RL-20260513-002)_
- Bounded AskUserQuestion discussion flow (4-8 turn budget) with section-coverage QC blocking writes until every active section has content or an explicit decline _(evidence: T-20260513-028)_
- MD writer with stable `## NN — Title` section headings matching ai-web-brief-v4 style — downstream parsers can index by heading _(evidence: T-20260513-029)_
- HTML writer with single-file output, no external network requests, family-of-doc style parity with ai-web-brief-v4.html (heading hierarchy + callouts + monospace numerals) _(evidence: T-20260513-030)_
- DOCX writer via pandoc shellout with fail-open fallback — MD+HTML still ship when pandoc is absent, exit 0 + install hint printed (per D-2 design decision, no `docx` npm dep added) _(evidence: T-20260513-031)_
- Output-path policy with slug validation, re-run versioning to `<slug>/history/<ISO>/`, and three rerun policies (version/overwrite/prompt with TTY fallback) _(evidence: T-20260513-032)_
- paths.json self-registration via shared helper — `paths.briefs` + `paths.briefsCurrent` registered on first successful emit, updated on subsequent runs; paths:doctor stays green _(evidence: T-20260513-033)_
- Onboarding callout + release-notes entry — `Start here — /product:bootstrap` added to _docs index where present, no new file created when absent (AC-S-8.3 respected) _(evidence: T-20260513-034, _docs/sprint/CHANGELOG_0.5.1.md)_

### Missed
_None._

## Plan Quality — Predictions vs Reality

- Predicted status: `pass`
- Actual status: `held`
- Predicted confidence: `high`

Plan Contract correctly sized this as `m`/`medium`. Both flagged evidence gaps were resolved at design time via D-1 (default to listed-minimum section set) and D-2 (default to pandoc shellout with fail-open fallback). No scope drift; the recommended variant shipped exactly as scoped.

## Scope Variant Adherence

- Planned variant: `recommended`
- Actual variant: `recommended`
- Adhered: `true`

Recommended scope shipped end-to-end: skill + bounded discussion + MD + HTML + DOCX (pandoc with fallback) + paths.json + re-run versioning + onboarding callout. Expanded scope (refinement loop per-section, brief version history index, sibling /brief:rebuild + /brief:section helpers, `docx` npm fallback) deliberately deferred.

## Surprises

- Sprint-helper ticket-bucket bleed: T-20260513-039 was minted by an SP-003 /sprint:design subagent calling ticket.js without --sprint flag; ticket.js read paths.sprintCurrent (registry primary = SP-001) and landed the ticket in SP-001's bucket. Marked abandoned and replaced with a correctly-tagged ticket in SP-003. — impact: Mid — first observed instance of the cross-sprint contamination class. SP-001's current.yaml carries dozens of bleed tickets (T-019..T-026, T-035..T-038, T-040..T-062) that belong to SP-002/003/004/005 — a known bug ride-along for the entire parallel run.
- Pandoc was already on PATH on the operator's Windows host at design time — the D-2 fallback (graceful skip if absent) was implemented but not exercised on the happy path; DOCX shipped on first run. — impact: Low — neutral; design decision still correct for downstream operators who may not have pandoc.
- AC-S-8.3 (no _docs/ index present → no new file created) became the actual onboarding path — the project's onboarding flow does not yet have a single index file, so the callout integration was a no-op for this repo's own dog-foot run. — impact: Low — preserves the no-regress promise but masks the value of T-034 in self-testing.

## Friction Points

- **[high / tooling]** ticket.js resolves sprint binding from paths.sprintCurrent (registry primary) when no --sprint flag is passed — subagents that fork off /sprint:design / /sprint:execute do not always inject --sprint, so new tickets land in whichever sprint is primary in active-sprints.yaml. Manifests as the SP-001 ticket bucket carrying 30+ cross-sprint tickets.
- **[medium / tooling]** Sprint-history retros came back as skeleton placeholders for SP-001/002/003/005 — retrospective.js requires the caller (the /sprint:retrospective skill body) to produce the LLM synthesis JSON and pass --synthesis. The four naive script invocations during release wrote skeletons without an operator-visible warning. Same root cause as SP-004's friction item #3 — confirmed recurring.
- **[low / process]** Multi-sprint parallelism (SP-001..SP-005 running concurrently) makes the sprint-progress.yaml a single shared file across all sprints — per-sprint progress lives under sprints/<id>/progress.yaml but the legacy global sprint-progress.yaml is still referenced in crash_recovery, leading to last-completed-step ambiguity when multiple sprints are mid-release.

## Action Items for Next Sprint

- Make ticket.js#cmdCreate refuse to mint without an explicit --sprint flag (or auto-detect from the calling subagent's context) — silent fallback to paths.sprintCurrent is the bug class. Pair with a sprint-tag-guard hook that flags tickets whose `sprint:` field disagrees with the current.yaml bucket they were appended to. _(owner: alpha)_ _(due: next_sprint)_
- Wire LLM synthesis into the /sprint:retrospective skill body for the default path — skill should run the synthesis prompt against the routing policy's strong_reasoning model and pass the result via --synthesis automatically. Naked retrospective.js invocations should print a stderr warning per SP-004's action #3 (still not implemented). _(owner: alpha)_ _(due: next_sprint)_
- Sunset the global sprint-progress.yaml in favor of the per-sprint sprints/<id>/progress.yaml exclusively — update crash_recovery.last_checkpoint to point at the per-sprint path on every sprint creation. _(owner: alpha)_ _(due: next_sprint)_

## Tickets Completed

- `T-20260513-027`
- `T-20260513-028`
- `T-20260513-029`
- `T-20260513-030`
- `T-20260513-031`
- `T-20260513-032`
- `T-20260513-033`
- `T-20260513-034`
- `T-20260513-062`

## Tickets Deferred or Abandoned

### Deferred
_None._

### Abandoned
- `T-20260513-039`

### Reopened
_None._

## Issues Encountered

_None._

## Beta Decisions Reviewed

_None._

## Key Tradeoffs

- Pandoc shellout vs `docx` npm dep — chose pandoc with fail-open fallback (D-2). Cost is operators without pandoc lose DOCX silently (warned); benefit is no new npm dep and cross-platform parity for free.
- Listed-minimum section set as default vs full ai-web-brief-v4 set (D-1) — chose listed-minimum, extended sections opt-in via --section-set extended. Honors the verbatim ask and keeps the 8-turn discussion budget honest.
- Version re-runs to `<slug>/history/<ISO>/` (default) vs overwrite vs prompt — chose version as default with overwrite/prompt as opt-in flags. Cost is more disk; benefit is no silent data loss on re-run.

## Learning Candidates

- Sprint-helper scripts that resolve sprint binding via a registry primary (paths.sprintCurrent) are unsafe in multi-sprint parallel runs — every tracker-mutating script must require an explicit --sprint flag or auto-extract from the caller's session context. Silent fallback creates ticket-bucket contamination invisible until retro time. _(evidence: T-20260513-039 abandoned)_
- Multi-format output skills should always honor the listed-minimum ask first and opt into extensions via a CLI flag, not flip-flop in design — D-1's commit to listed-minimum kept the discussion budget honest. Pattern: any spec that says `at minimum X, Y, Z` plus `inspired by <bigger reference>` means default to X/Y/Z, gate the rest behind --section-set. _(evidence: PRD D-1)_
- External-binary backends (pandoc, etc.) work cleanly as default with fail-open fallback when the failure surface is one bool (`is on PATH`) and the fallback is one-line clear — design decision D-2 shipped without DOCX-on-Windows issues because the detection path was `which`/`where`, not in-process invocation. _(evidence: T-20260513-031)_

## Sign-off

- Retro written by: `alpha`
- Retro written at: `2026-05-13T22:44:51.955Z`
- Synthesis: `llm` (claude-opus-4-7)
- History record: `(no sprint-history.yaml)`
- Release record: `RL-20260513-002`

> Re-run with `/sprint:retrospective --sprint SP-20260513-001 --force` to regenerate this retro from updated tracker state, or `--review-only` to print without regenerating.
