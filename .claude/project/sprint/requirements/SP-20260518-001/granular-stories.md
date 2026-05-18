# Granular Stories — /sprint:full

**Sprint:** `SP-20260518-001`
**High-level stories:** `paths.sprintRequirements/SP-20260518-001/high-level-stories.md`

Each granular story produces ~1 ticket. Type hints in parentheses guide `--type` at ticket-minting time.

## S-1 — Orchestrator entry point (feature)

Add `scripts/sprint/full.js` with CLI parsing for `--autonomy`, `--scope`, `--documentation-scale`, `--mode`, `--sprint`, `--resume`, `--allow-main`, `--cost-acknowledged`. Dispatch to phase functions. Honor `paths.sprintActiveRegistry#primary` when `--sprint` is omitted.
**Linked:** `H-1`, `R-1`, `R-7`
**ACs:** AC-1.1, AC-1.2

## S-2 — Phase 1: plan invocation (feature)

Alpha constructs the Plan Contract payload JSON, writes to `.warpos/plan-payload-<slug>.json`, shells out to `scripts/sprint/plan.js --sprint <id> --payload <file>`, parses exit code, halts on `plan_quality != pass` AND `plan_quality != needs_design`. Captures the resulting PC id in orchestrator state.
**Linked:** `H-1`, `R-1`
**ACs:** AC-2.1, AC-2.2

## S-3 — Phase 2a: design scaffold (feature)

Shell out to `scripts/sprint/design.js --sprint <id> --documentation-scale <derived>`. Auto-derive scale from `plan_contract.scope.size` when `--documentation-scale auto` (default mapping: `xs→xs`, `s→s`, `m→m`, `l→m`, `xl→l`). Halts on exit non-zero.
**Linked:** `H-1`, `R-1`
**ACs:** AC-3.1

## S-4 — Phase 2b: hand-edit templates (feature)

Skill body responsibility (not orchestrator). Alpha reads each rendered template, replaces placeholders with concrete content derived from Plan Contract. Removes `<!-- requirement-format-legacy -->` markers after population. Quality-gates by re-reading the file and confirming no `{{placeholder}}` remains.
**Linked:** `H-1`, `R-1`
**ACs:** AC-4.1, AC-4.2

## S-5 — Phase 2c: mint tickets (feature)

For each `S-N` granular story, shell out to `scripts/sprint/ticket.js create --sprint <id> --title <derived> --type <inferred> --risk <derived> --linked-story S-N --linked-hl H-N --linked-prd <path> --linked-requirements <R-N;...> --linked-copy <C-N;...> --linked-inputs <IN-N;...> --linked-trace <TR-N;...> --linked-ac <AC-N.M;...> --description <one-paragraph>`. Promote each to `designed` then `ready_for_execution`.
**Linked:** `H-1`, `R-1`
**ACs:** AC-5.1, AC-5.2

## S-6 — Phase 3: execute (feature)

For each `ready_for_execution` ticket, shell out to `scripts/sprint/execute.js start --ticket <T-id> ...` and drive Ralph loops via `execute.js phase`. Map each `stop_reason` to autonomy preset's `stop_condition_policy`. Defer on `repeated_failure` (3-attempt). Halt on `approval_required` beyond preset, `human_setup_required`, `scope_expansion`, `destructive_action_needed`, `production_deploy_needed`, `beta_warning`, `unclear_intent`.
**Linked:** `H-1`, `R-1`, `R-2`
**ACs:** AC-6.1, AC-6.2, AC-6.3

## S-7 — Phase 4: release-prep (feature)

Shell out to `scripts/sprint/release.js prepare --title <derived> --version <derived> --target <staging|internal-canary>`. Run `release.js check`. If `release_approval_required` is in preset's `pre_authorized_approval_levels` (only `aggressive` opts in, and only for non-production targets), auto-record approval via `release.js approve`. NEVER call `release.js deploy` — leave as `ready_to_deploy`.
**Linked:** `H-1`, `R-1`, `R-12`
**ACs:** AC-7.1, AC-7.2

## S-8 — Phase 5: retrospective (feature)

Shell out to `scripts/sprint/retrospective.js --sprint <id> --signed-off-by alpha`. Honor the fail-open skeleton fallback per `retrospective.js` contract — do NOT re-halt on synthesis failure.
**Linked:** `H-1`, `H-4`, `R-1`
**ACs:** AC-8.1

## S-9 — Halt-report writer (feature)

Write `paths.sprintFullReports/<SP-id>/halt-<ISO>.md` on any halt. Schema: `phase`, `halt_reason`, `beta_verdict_if_any`, `autonomy_preset`, `resume_command`, `next_human_action`, `timestamp`, `links_to_artifacts`. Emit `paths.eventsFile` row with `type: sprint_full_halt`.
**Linked:** `H-4`, `H-7`, `R-4`
**ACs:** AC-9.1, AC-9.2

## S-10 — Final-report writer (feature)

On `done` terminal state, write `paths.sprintFullReports/<SP-id>/sprint-full-report.md` with timeline: phase durations, decisions auto-approved, halts encountered, tickets done/deferred/abandoned, Beta consultations summary, cost-estimate total.
**Linked:** `H-1`, `H-7`, `R-4`
**ACs:** AC-10.1

## S-11 — Autonomy preset schema (refactor)

Add `schemas/sprint/sprint-full-autonomy.schema.json`. Required fields: `preset_name`, `pre_authorized_approval_levels[]` (enum), `stop_condition_policy{approval_required, human_setup, repeated_failure, scope_expansion, destructive, prod_deploy, beta_warning, unclear_intent}` (each → `halt|auto_continue|defer`), `halt_threshold_failed_tickets_pct`, `cost_estimate_threshold_usd`. The `hard_ceilings[]` enum is READ-ONLY (informational) and the orchestrator's hardcoded enum is authoritative.
**Linked:** `H-2`, `H-3`, `H-6`, `R-2`, `R-3`
**ACs:** AC-11.1, AC-11.2

## S-12 — Default presets config (refactor)

Add `.claude/agents/00-alex/.system/policy/sprint-full-autonomy.json` with three default presets. `conservative` halts on anything non-trivial; `moderate` (default) auto-defers `repeated_failure`, halts on everything else; `aggressive` adds `medium_risk_execution_approval` and `staging_release_approval` to `pre_authorized_approval_levels[]` and explicitly halts on production targets. Validate against the schema in S-11.
**Linked:** `H-2`, `H-6`, `R-2`
**ACs:** AC-12.1, AC-12.2

## S-13 — Path registry additions (refactor)

Add `sprintFullAutonomy` and `sprintFullReports` to `.claude/paths.json`. Update `paths-doc-coverage` if applicable. Verify `path-lint` passes on the new orchestrator + skill body (no literal-string references).
**Linked:** `H-6`, `R-10`
**ACs:** AC-13.1

## S-14 — Cost-estimate halt gate (feature)

Implement coarse LLM-spend counter: accumulate phase-typical-spend per phase invocation. Halt + write halt report when cumulative estimate exceeds preset's `cost_estimate_threshold_usd`. Operator resumes with `--cost-acknowledged` which moves the threshold to `2 × current_threshold` for this run only (not persisted to preset config).
**Linked:** `H-4`, `R-6`
**ACs:** AC-14.1, AC-14.2

## S-15 — Beta consultation cadence (feature)

In adhoc mode, before each phase boundary (4 boundaries: plan→design, design→execute, before release-prep, before retro), dispatch SendMessage to Alex β with phase context. Log to `paths.betaEvents`. ESCALATE → hard halt (write halt report with `halt_reason: beta_escalate`). DIRECTIVE → log and continue; DECIDE → log and continue. Solo mode skips this step entirely.
**Linked:** `H-5`, `R-5`
**ACs:** AC-15.1, AC-15.2

## S-16 — Skill body (docs)

Write `.claude/commands/sprint/full.md`. Document inputs, autonomy presets, halt conditions, recovery, approval gates, routing, relationship to modes. Reference all `paths.*` keys. Cross-link AUTONOMY doc + sprint-workflow.
**Linked:** `H-1`, `H-6`, `R-9`
**ACs:** AC-16.1

## S-17 — AUTONOMY doc (docs)

Write `_docs/sprint/AUTONOMY.md`. Plain-English explanation: what each preset does, what hard ceilings are, the halt taxonomy, how operators write their own preset, examples of safe vs unsafe preset configurations.
**Linked:** `H-6`, `R-9`
**ACs:** AC-17.1

## S-18 — Workflow + OVERVIEW updates (docs)

Update `.claude/project/reference/sprint-workflow.md` and `_docs/sprint/OVERVIEW.md` to introduce `/sprint:full` as the autonomous front door. Per-phase commands remain documented as manual path. Add a decision tree: when to use `/sprint:full` vs per-phase.
**Linked:** `H-1`, `R-9`
**ACs:** AC-18.1

## S-19 — Integration test harness (qa)

Add `scripts/sprint/test-sprint-full.js`. Mock 5 scenarios: (a) happy path xs-scoped run completes through retro, (b) halt on `plan_quality=needs_user_clarification`, (c) halt on ESD with `signup: true`, (d) halt on Beta ESCALATE, (e) halt on approval level outside preset. Each scenario validates the halt report + resume command.
**Linked:** `H-7`, `R-8`
**ACs:** AC-19.1, AC-19.2, AC-19.3, AC-19.4, AC-19.5

## S-20 — Branch protection guard (feature)

Refuse to start when `git rev-parse --abbrev-ref HEAD` returns `main` or `master`. Override only with `--allow-main` AND preset `aggressive`. Halt with COPY `C-11` and resume instruction "switch to a feature branch via `git switch -c sprint/<SP-id>` then re-run". This implements `R-11` and addresses approval-boundary item #4.
**Linked:** `H-3`, `R-11`
**ACs:** AC-20.1
