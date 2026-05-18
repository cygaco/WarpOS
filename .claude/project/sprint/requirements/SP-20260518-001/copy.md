# COPY Requirements — /sprint:full

**Sprint:** `SP-20260518-001`
**PRD:** `paths.sprintRequirements/SP-20260518-001/prd.md`

Operator-visible text. Each block is a concrete string the orchestrator (or its halt report) will display. Stable ids — tickets reference these.

## C-1 — Phase header (linked story `S-1`)

**Context:** Printed at the start of each phase transition.
**Text:**

> `▶ /sprint:full <SP-id> | phase: <plan|design|execute|release-prep|retro> | preset: <conservative|moderate|aggressive>`

**Notes:** One line. No emoji. Used in both stdout and the final report timeline.

## C-2 — Plan-quality halt (linked story `S-2`)

**Context:** Plan Contract was written but `plan_quality.status` is `needs_user_clarification` or `blocked`.
**Text:**

> `/sprint:full halted after plan phase: plan_quality=<status>. Blocking questions need operator input. See <PC-id>.yaml#open_questions.blocking. Resume with: /sprint:plan --sprint <SP-id> (re-plan) then /sprint:full --sprint <SP-id> --resume.`

**Notes:** Always cite the PC id and the resume command. Operator should never have to grep for either.

## C-3 — ESD halt — signup required (linked story `S-6`)

**Context:** `external-service.js gate --phase execute` returned an ESD with `signup: true`, `billing: true`, or `credentials: true`.
**Text:**

> `/sprint:full halted before execute phase: ESD <ESD-id> requires <signup|billing|credentials|oauth|dns|compliance>. Operator action: complete external setup, then mark ESD <ESD-id> as ready_for_terminal_work via scripts/sprint/external-service.js update. Resume with: /sprint:full --sprint <SP-id> --resume.`

**Notes:** Hard ceiling — never auto-bypassable. List the exact field that tripped the gate.

## C-4 — Approval-beyond-preset halt (linked story `S-6`)

**Context:** A ticket carries `approval_required: true` at a level outside the preset's `pre_authorized_approval_levels[]`.
**Text:**

> `/sprint:full halted on ticket <T-id>: approval level <level> is outside preset <preset> pre-authorization. Operator action: record approval via scripts/sprint/approval, OR re-run with --autonomy aggressive (subject to hard ceilings). Resume with: /sprint:full --sprint <SP-id> --resume.`

**Notes:** Cite the ticket id and the unmet level. Show both remediation paths.

## C-5 — Beta ESCALATE halt (linked story `S-15`)

**Context:** Beta returned `ESCALATE` at a phase-boundary consultation.
**Text:**

> `/sprint:full halted at <phase> boundary: Beta ESCALATE. Verdict: <beta_summary>. See paths.betaEvents for the full event. Operator action: address Beta's concern, then resume with: /sprint:full --sprint <SP-id> --resume.`

**Notes:** Include Beta's one-line summary. Never silence ESCALATE regardless of preset.

## C-6 — Repeated-failure deferral (linked story `S-6`)

**Context:** A ticket hit the 3-attempt rule. Auto-defer behavior (`moderate` + `aggressive` presets).
**Text:**

> `ticket <T-id> deferred after 3 failed attempts. Continuing to next ready_for_execution ticket. Operator can re-investigate post-run via scripts/sprint/issue.js promote.`

**Notes:** Not a halt — log-and-continue. Append to final report.

## C-7 — Cost-estimate halt (linked story `S-14`)

**Context:** Cumulative cost estimate exceeded preset's `cost_estimate_threshold_usd`.
**Text:**

> `/sprint:full halted: cumulative cost estimate $<amount> exceeds preset threshold $<threshold>. Operator action: acknowledge and re-run with /sprint:full --sprint <SP-id> --resume --cost-acknowledged (raises threshold to 2× for this run only), OR raise threshold permanently in the autonomy preset config.`

**Notes:** Soft halt — explicit resume path. Threshold raise is non-persistent unless operator edits the preset.

## C-8 — Production-deploy ceiling (linked story `S-7`)

**Context:** Any phase attempts to invoke `release.js deploy` or any production-deploy primitive.
**Text:**

> `/sprint:full hard-ceiling breach: production_deploy attempted. Action blocked. /sprint:full NEVER deploys to production — operator must invoke /sprint:release deploy out-of-band. Run state preserved; investigate why this was attempted.`

**Notes:** Hard ceiling. Log `ceiling_breach_attempt` event. Operator must investigate root cause.

## C-9 — Push-to-remote ceiling (linked story `S-7`)

**Context:** Any phase attempts a `git push` or remote-modifying primitive.
**Text:**

> `/sprint:full hard-ceiling breach: push_to_remote attempted. Action blocked. /sprint:full commits locally but NEVER pushes — operator must push manually per CLAUDE.md autonomy table. Run state preserved.`

**Notes:** Hard ceiling. Same handling as C-8.

## C-10 — Paid-service-signup ceiling (linked story `S-13`)

**Context:** Any phase encounters an ESD that would incur cost without explicit operator approval.
**Text:**

> `/sprint:full hard-ceiling breach: paid_service_signup attempted (ESD <ESD-id>). Action blocked. Operator must sign up out-of-band, then mark ESD as ready_for_terminal_work.`

**Notes:** Hard ceiling. Overlaps with C-3 (ESD halt) but specifically for paid services.

## C-11 — Branch-protection halt (linked story `S-20`)

**Context:** Current branch is `main` or `master` and `--allow-main` was not passed.
**Text:**

> `/sprint:full refused to start: current branch is <main|master>. /sprint:full commits locally throughout the run — committing to main can leak partial work. Action: switch to a feature branch via `git switch -c sprint/<SP-id>` then re-run. Override with --allow-main (requires --autonomy aggressive).`

**Notes:** Hard default. Override is intentionally awkward.

## C-12 — Phase-completion event (linked story `S-1`)

**Context:** A phase completed successfully and the next phase is starting.
**Text:**

> `✓ phase <phase> done in <duration> | next: <next_phase>`

**Notes:** One line per phase. Used in stdout + final report.

## C-13 — Done report header (linked story `S-10`)

**Context:** Final report header.
**Text:**

> `# /sprint:full report — <SP-id>\n\n**Title:** <sprint_title>\n**Preset:** <preset>\n**Started:** <iso>\n**Completed:** <iso>\n**Total duration:** <dur>\n**Cost estimate:** $<amount>\n**Outcome:** <done|halted:<reason>>`

**Notes:** Markdown frontmatter-style. Followed by the phase timeline.

## C-14 — Halt-report header (linked story `S-9`)

**Context:** Halt report header.
**Text:**

> `# /sprint:full halt — <SP-id>\n\n**Phase:** <phase>\n**Halt reason:** <reason>\n**Preset:** <preset>\n**Beta verdict (if any):** <verdict>\n**Resume command:** \`<command>\`\n**Next human action:** <description>\n**Timestamp:** <iso>`

**Notes:** Single-glance summary. Operator should not need to grep the tracker.
