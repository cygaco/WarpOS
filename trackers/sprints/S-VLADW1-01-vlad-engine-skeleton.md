# S-VLADW1-01 — Vlad Wave-1 ENGINE: skeleton, MCP surface, job state machine (epic label SP-VLAD-W1-ENGINE)

- **Sprint label and number:** S-VLADW1-01 (epic label `SP-VLAD-W1-ENGINE`; the label form is schema-invalid as an id — see Decisions). **Registry `primary`.**
- **Title:** Engine skeleton — plain-node Agent SDK app, MCP stdio server, four-core tool surface, job state machine, journal, permission-level config port, and the API-key model-access seam
- **Owner:** Alex ε (sprint conductor), under Alex α
- **Parent epic:** [E-VLAD-001](../epics/E-VLAD-001-vlad-v1-agent-mcp-cofounder.md) — see that epic's § Related sprints, which names this id
- **Goal:** Stand up the engine Vlad runs on: a plain-node app on the TypeScript Agent SDK, exposing a four-tool MCP surface over stdio, with a job state machine, a journal, ported permission-level config, and a model-access seam that bills to the user's own API key.
- **Scope:** Engine skeleton; MCP stdio server + four core tools; job state machine; journal writer; permission-level config port; branding guard; a host-free driver so the surface can be exercised end-to-end; and the credential-custody enforcer the model-access seam requires.
- **Out of scope:** The audit job itself (S-VLADW1-02). The write path, agent face and installer (Wave 2). Typing the receipt interior — see the J4 decision; ENGINE emits a versioned envelope with an UNTYPED interior deliberately.
- **Current state:** Planning — registry `primary`; plan contract authored and schema-valid (`PC-20260730-0085`); held at the plan→design boundary on three operator gates (see Blockers).
- **Percent completion:** 10% — the plan contract is authored and validated, which is the first half of DoD item 1; β consultation at the plan→design boundary is the unmet second half. No product-side work has begun and none may begin before the design→build gate clears.

## Definition of Done
- [ ] Plan contract authored and accepted (`scripts/sprint/plan.js`), with β consulted at the plan→design boundary. **Authoring done 2026-07-30** — `PC-20260730-0085`, `scripts/sprint/validate.js` exit 0. Unchecked pending the β verdict.
- [ ] `/sprint:design` artifacts exist and the design→build gate is cleared by the operator.
- [ ] Engine runs as a plain-node Agent SDK app; the four-tool MCP surface answers over stdio.
- [ ] Job state machine + journal writer land, with the receipt emitted as a **versioned envelope with an untyped interior** (`schema_version` + three named slots), journalled and returned opaquely, never validated or branched on.
- [ ] Model access is the user's own Anthropic API key via the TypeScript Agent SDK. **No path reads or inherits an ambient `ANTHROPIC_API_KEY`** — env passing is allowlist-based.
- [ ] **A fail-closed credential-custody enforcer exists** — the user's key must never leave their machine (no transmit, log, proxy or telemetry). This is a compliance obligation under Consumer Terms, not hygiene, so a report-only check does not satisfy it.
- [ ] A quota-exhaustion detector exists, **empirically characterized before ship**; an unrecognized termination classifies `could-not-run`, never success.
- [ ] Branding: ships as "Vlad, powered by Claude" — never "Claude Code", never Claude-Code-mimicking visuals. Enforcer named.
- [ ] Host-free driver exists so the MCP surface is exercisable without a host (non-negotiable — it is what makes the surface testable at all).

## Related definitions
- Validator, Verification, Evidence, Completion — see ../../TRACKER.md

## Tasks
- [x] Marshal the banked product-lead substance into a schema-valid plan-contract payload (`runtime/vlad-w1/w1-planning-inputs.md` §2, schema gotchas in §4.2). Done 2026-07-30 — payload `runtime/vlad-w1/payload-S-VLADW1-01-engine.json`, contract `PC-20260730-0085`.
- [ ] β consult at plan→design, front-loaded, on the named surfaces: the credential-custody enforcer and the honest-degradation ("NOT verified") language.
- [x] Route the epic amendment to α via `/epic:fold` — **not ε** — because it reverses an operator-ratified decision (see Blockers). Landed; verified 2026-07-30 across all six previously-stale locations in both artifacts (see Evidence log).
- [ ] Verify each cited port source before porting: `score.js:134`, `phases/preflight.js`, `permission-profile.js`, `transaction.js`, `registry.js` are all `inferred_from_repo`, never read.

## Files expected to change
- No **product-side** files in this repository — those live in the sibling repo, which does not exist yet (operator-gated).
- WarpOS-side planning artifacts DO change during the plan phase: the plan contract and its report, the sprint store, the payload, and this tracker. Recorded explicitly so the "None in this repository" claim is not read wider than it is true.

## Files actually changed
- `.claude/project/sprint/plan-contracts/PC-20260730-0085.yaml` — the plan contract (new).
- `.claude/project/sprint/plan-contracts/PC-20260730-0085.report.md` — companion report (new).
- `.claude/project/sprint/sprints/S-VLADW1-01/current.yaml` — plan-contract pointer, status `planning`, risk `high`, external services identified.
- `runtime/vlad-w1/payload-S-VLADW1-01-engine.json` — the authored payload, kept as durable provenance for the contract.
- This tracker.
- No product-side file. None may be written before the design→build gate clears.

## Paths expected to exist
- The sibling product repo (name and slug pending operator sign-off).

## Paths verified to exist
- `.claude/project/sprint/plan-contracts/PC-20260730-0085.yaml` — Verified Exists 2026-07-30, schema-valid against `warpos/sprint/plan-contract/v1`.
- `.claude/project/sprint/sprints/S-VLADW1-01/current.yaml` — Verified Exists 2026-07-30, schema-valid against `warpos/sprint/current-sprint/v1`.
- The sibling product repo: still NOT created — see Paths verified nonexistent.

## Paths verified nonexistent
- The sibling product repo — Verified Nonexistent 2026-07-29 (operator gate #1 unresolved; no path assigned).

## Wirings expected
- MCP stdio server → the four core tools.
- Job state machine → journal writer → receipt envelope (untyped interior).
- Permission-level config → exactly ONE genuinely enforced refusal (not a vocabulary-only port).

## Wirings verified
- None.

## Dependencies
- The TypeScript Agent SDK (`@anthropic-ai/claude-agent-sdk`), which **bundles its own Claude Code binary** and therefore removes the user's Claude Code install from the dependency graph. Bank that portability gain; do not spend it.

## Blockers
**Three** operator gates, all pending as of 2026-07-30. Each needs a decision only the operator can give:
1. **Sibling repo name + slug + creation sign-off** — the epic's first approval point.
2. **Does the operator ratify API-key-only model access, and does the product survive the reinstated onboarding cliff?** This reverses a decision the operator personally made in grill round 3 to solve the drop-off they themselves named as the biggest one. **Not product-lead altitude, and not ε's.** The ToS finding forces the constraint; whether v1 ships behind the resulting wall is a product ruling.
3. **Anthropic API spend envelope** for dev/test — trips two autonomy rows (signup/purchase not allowed; ≥$5 ask-first). This gates a specific DoD item, not just general development: the quota-exhaustion detector can only be characterized by deliberately provoking metered failures.

**CLOSED 2026-07-30 — was blocker #3, and was never an operator gate:** "The epic states the dead CLI-subscription seam as fact in FOUR places." The `/epic:fold` amendment landed. Verified by re-reading **all six** cited locations directly rather than trusting the amendment report — epic tracker § Scope and § Open questions item 2 (now marked "RESOLVED — NO-GO"), and plan artifact `_planning/epics/E-VLAD-001.md` § 3 Scope (L16), § 6 Dependency map (L77), § 7 Risk map (L80), § 10 Gate W1 (L102). Each states the NO-GO correctly. The fold additionally repriced AC #1's five-minute claim (L22) and added the unowned codex/gemini ToS item (L81), and the epic's Definition of Done now carries the credential-custody item. The risk of building to a contradicted contract is therefore retired.

## Risks
- **Building to a contradicted contract / likelihood high / impact high / RETIRED 2026-07-30** — the epic asserted the ToS-barred seam as fact in four places. Mitigation landed: the `/epic:fold` amendment, verified across all six cited locations in both artifacts (see Blockers and the Evidence log). Retained here rather than deleted so the risk's closure is auditable.
- **Quota exhaustion misclassified as success / likelihood medium / impact high** — the result strings and structured error codes are documented but the **exit code is not**, so a detector written from documentation alone is untested guesswork, and the dangerous direction of a misclassification is reading an exhausted run as a completed one. Mitigation: characterize the detector empirically against real terminations; classify any unrecognized termination as `could-not-run`, never success; do not trip on `Server is temporarily limiting requests (not your usage limit)`, which is capacity and auto-retried. This mitigation needs metered spend, so it is coupled to operator gate #3.
- **Throwaway receipt work via a designed-in circularity / likelihood high / impact medium** — the epic says the receipt schema stays open until dogfood data exists (AUDIT), while AUDIT depends on ENGINE *for the receipt seam*. So ENGINE would type a receipt v0 that propagates into the journal writer, `get_status`, MCP signatures, driver assertions and ledger records, and then real data demands structural change. Mitigation is cheap **only if decided now**: emit a versioned envelope with an UNTYPED interior and never branch on it. See J4.
- **Silent mis-billing / likelihood medium / impact high** — in `-p` "the key is always used when present", so a stray ambient env key bills the wrong Console org. Mitigation: allowlist-based env passing, asserted.
- **Permission port without a taxonomy / likelihood medium / impact medium** — porting permission levels against an action taxonomy that does not exist yet. Mitigation: ship vocabulary + config + in-code check + exactly ONE genuinely enforced refusal.
- **Porting against unverified references / likelihood high / impact medium** — every port source is `inferred_from_repo`; the cited files were never read. Mitigation: verify each path and line before porting.

## Decisions
- 2026-07-29 — **Sprint id.** `SP-VLAD-W1-ENGINE` is schema-invalid against the registry pattern; registered as `S-VLADW1-01`, epic label preserved as the title. Minted LAST so `add-sprint.js`'s unconditional `reg.primary` write landed here, on the gating sprint.
- 2026-07-29 — **Model access is API-key-only, and there is no fallback.** The claude-CLI subscription shell-out is **ToS NO-GO**: Anthropic's legal page bars third-party developers from routing requests through Free/Pro/Max credentials on behalf of their users, with no carve-out and an enforce-without-notice reservation; `claude -p` IS the Agent SDK's CLI surface, so shelling out does not escape the SDK restriction; and `claude setup-token` is the same prohibited shape, not a workaround. Verified twice, quotes independently re-fetched. The subscription path was never permitted, so API-key is primary and only — **subject to operator ratification (Blocker #2).**
- 2026-07-29 — **J4: ENGINE emits a versioned envelope with an UNTYPED interior** (`schema_version` + three named slots), journalled/returned/logged opaquely, never validated or branched on. AUDIT fills the interior and mints v1. This is what breaks the designed-in receipt circularity, and it is cheap only if decided before the seam is built.

## Open questions
- Blocking: all three operator gates above (sibling repo name+slug+sign-off; ratification of API-key-only model access with the onboarding-cliff judgment; the API spend envelope).
- **Non-blocking, and a genuine gap in the record: WHICH four of the seven v1 MCP tools form the "four-core" surface?** Neither the epic tracker nor the plan artifact enumerates them — both say "4-core" and the full v1 surface is seven (`get_status`, `get_readiness`, `run_job`, `send_message`, `approve_job`, `cancel_job`, `get_roadmap`). The natural Wave-1 reading is `get_status`, `get_readiness`, `run_job`, `send_message` — `approve_job`/`cancel_job` are write-path tools belonging to Wave 2 and `get_roadmap` to Wave 3 — but that is an **inference, not a record**, and must be settled at `/sprint:design` rather than assumed into code.
- Non-blocking: which single refusal is the ONE genuinely enforced refusal in the permission port, given the action taxonomy it would gate does not exist yet.
- Non-blocking, to Anthropic sales (no public answer exists): the exact scope of "route requests … on behalf of their users" for a local-CLI topology; the approval criteria behind the SDK page's "unless previously approved" carve-out; which document controls given the paused June-15 metering change; the `--bare` default timeline; the exit-code/JSON contract on quota exhaustion; current numeric Pro/Max limits.
- Non-blocking but unowned: **"opportunistic use of other CLIs when detected" is the identical prohibited shape for codex/gemini, and nobody has read OpenAI's or Google's terms.** Only the Anthropic instance was tested.
- Non-blocking but unowned, WarpOS-side: `safe-spawn`'s transfers-as-is env classification needs an **env-allowlist amendment**. This is a billing-correctness defect rather than hygiene, surfaced by the product-side finding that in `-p` the key is always used when present. No owner named.
- Non-blocking (schema gap, no action owed by this sprint): the plan-contract schema's `recommended_mode` enum offers only `solo|adhoc|oneshot|no_recommendation` and has **no `sprint` value**, so `PC-20260730-0085` records `no_recommendation` despite being conducted in sprint mode. The enum predates sprint mode; the recorded value is the honest one.

## Session log
<!-- Append-only (§24). See SESSION_LOG_TEMPLATE.md for the full field set. -->
### 2026-07-30 00:00 UTC — Session 2026-07-29-release-and-pass
- Agent(s): Alex ε (conductor), Alex α (dispatcher) · Mode: sprint
- Work performed: Created this tracker as the sprint's durable source-of-truth home. `add-sprint.js` mints the registry entry, ROADMAP rows and the sprint STORES only — not a tracker file — a gap found while beginning the planning phase and recorded rather than worked around.
- Files changed: this file (new). · Paths changed: None. · Wirings changed: None.
- Decisions: Recorded the id resolution, the ToS NO-GO consequence, and the J4 untyped-interior call as Decisions rather than leaving them in banked planning notes.
- Issues discovered: The tracker scaffold was missing for both Wave-1 sprints.
- Definitions added/changed: None
- State change: (new) → Planning · Completion change: — → 0%
- Verification performed: Registry read directly — `primary: S-VLADW1-01` confirmed on this sprint, as the banked mint ordering required. · Validation run: `node scripts/trackers/validate.js` · Validation result: see Verification log
- Next action: Author the plan contract.
- Evidence/references: `runtime/vlad-w1/w1-planning-inputs.md` (§1 the ToS gate with verbatim primary-source quotes, §2 the product-lead substance, §3 the id blocker, §4 the resume checklist)

### 2026-07-30 02:00 UTC — Session 2026-07-29-release-and-pass (Wave-1 plan contracts)
- Agent(s): Alex ε as "EpsilonW1" (scoped plan-contract lane) · Mode: sprint
- Work performed: Marshalled the banked product-lead substance into a schema-valid plan-contract payload and authored the contract, AFTER S-VLADW1-02 so the AUDIT-first ordering held. Verified the `/epic:fold` amendment actually landed by re-reading all six previously-stale locations in both artifacts, which closed the fourth blocker. Recorded the four-core MCP tool set as an explicit gap in the record rather than inferring it into the contract.
- Files changed: `.claude/project/sprint/plan-contracts/PC-20260730-0085.yaml` (new), its `.report.md` (new), `.claude/project/sprint/sprints/S-VLADW1-01/current.yaml`, `runtime/vlad-w1/payload-S-VLADW1-01-engine.json` (new), this file. · Paths changed: None product-side. · Wirings changed: `current.yaml#plan_contract` → `PC-20260730-0085`.
- Decisions: Kept `plan_quality.status = needs_user_clarification` (not `blocked`) per J1 — roughly four-fifths of this sprint is gate-independent, and "blocked" should mean an honest plan cannot be authored. Set `scope.size: xl` / `risk_level: high`, the highest risk class of the pair, because credential custody is a compliance obligation rather than hygiene. Recorded `recommended_mode: no_recommendation` because the schema enum has no `sprint` value.
- Issues discovered: (1) The four-core MCP tool surface is named in two artifacts and **enumerated in neither** — logged as a non-blocking open question rather than resolved by assumption. (2) `plan.js` performs no schema validation, so `scripts/sprint/validate.js` must be run separately. (3) `conflict-check` flagged the shared "sibling Vlad product repo" surface against S-VLADW1-02 — warn-only, a true positive, needing `--allow-overlap` at `/sprint:execute`. (4) **A concurrently-authored orphan contract, `PC-20260730-0083`, was found on disk** — AUDIT content bound to `sprint: S-VLADW1-01`, and schema-INVALID. See the Evidence log; not created by this lane and deliberately left in place rather than deleted.
- Definitions added/changed: None
- State change: Planning → Planning (held at plan→design) · Completion change: 0% → 10%
- Verification performed: `node scripts/sprint/validate.js` on the contract AND on the rewritten `current.yaml`, both exit 0; registry `primary` re-read after both authoring runs and unchanged at `S-VLADW1-01`; the epic amendment verified by direct read of all six cited locations. · Validation run: `node scripts/trackers/validate.js` · Validation result: see Verification log
- Next action: β consult at the plan→design boundary, then HOLD.
- Evidence/references: `runtime/vlad-w1/payload-S-VLADW1-01-engine.json`; `.claude/project/sprint/plan-contracts/PC-20260730-0085.yaml`

## Change log
### 2026-07-30 00:00 UTC — Session 2026-07-29-release-and-pass
- Created the tracker from `trackers/templates/SPRINT_TEMPLATE.md`, with `SP-20260725-002-memory-verify.md` as the section-discipline exemplar.

### 2026-07-30 02:00 UTC — Session 2026-07-29-release-and-pass
- Plan contract `PC-20260730-0085` authored and validated. Blocker count corrected from four to three — the epic-staleness blocker is CLOSED (amendment verified across six locations) and was never an operator gate. Added a risk for quota-exhaustion misclassification, retired the contradicted-contract risk in place rather than deleting it, and recorded the un-enumerated four-core tool surface plus the unowned `safe-spawn` env-allowlist amendment as open questions.

## Evidence log
### 2026-07-30 — An orphan contract `PC-20260730-0083` carries AUDIT content under this sprint's id, and is schema-invalid
- Evidence: `PC-20260730-0083.yaml` has `created_at: 2026-07-30T02:24:36.808Z` — roughly 2.5 minutes before this lane's first `plan.js` run (`PC-20260730-0084` at 02:27:09) — and was authored by a concurrent lane, not by this one. Its `source_request` reads "Wave-1 AUDIT (epic label SP-VLAD-W1-AUDIT) …" while its `sprint:` field reads **`S-VLADW1-01`**. `grep -l "^sprint: S-VLADW1-01"` therefore returns TWO contracts.
- Mechanism (read from `scripts/sprint/plan.js`, not inferred): `ensureCurrentSprint()` falls back to the registry `primary` when no per-sprint `current.yaml` has an id, and `primary` is `S-VLADW1-01`. The defensive WARN at the end of `main()` only fires when `--sprint` **was** passed and mismatched; **omitting `--sprint` entirely produces no warning at all**, so AUDIT content bound silently to the ENGINE sprint. This is the same bug class as the 2026-05-18 / RT-008 repro the script's own comment documents, reached through the un-warned door.
- Compounding gap: `plan.js` performs **no schema validation**, so `PC-20260730-0083` landed at exit 0 despite being invalid — `node scripts/sprint/validate.js` reports 2 errors, `$.affected_surfaces[0].evidence_level` and `[4].evidence_level` both `"not_verified"`, a value absent from the enum (`verified_from_repo`/`inferred_from_repo`/`assumed_from_request`/`unknown`).
- Live state is NOT damaged: `.claude/project/sprint/sprints/S-VLADW1-01/current.yaml#plan_contract` points at `PC-20260730-0085` (valid, ENGINE content) and `S-VLADW1-02`'s points at `PC-20260730-0084` (valid, AUDIT content). Both pointers read directly.
- Disposition: `PC-20260730-0083` and the companion payload `runtime/vlad-w1/payload-S-VLADW1-02.json` were **left in place, untracked and unmodified**. They were not authored by this lane, so deleting or committing them is not this lane's call — surfaced to the team lead for disposition instead.

### 2026-07-30 — The plan contract exists and is schema-valid
- Evidence: `node scripts/sprint/validate.js .claude/project/sprint/plan-contracts/PC-20260730-0085.yaml` → "valid against warpos/sprint/plan-contract/v1", exit 0. The rewritten `.claude/project/sprint/sprints/S-VLADW1-01/current.yaml` independently validates against `warpos/sprint/current-sprint/v1`, exit 0.

### 2026-07-30 — The `/epic:fold` amendment landed; the stale-epic blocker is closed
- Evidence: all six previously-stale locations re-read directly. Epic tracker `trackers/epics/E-VLAD-001-vlad-v1-agent-mcp-cofounder.md` § Scope states "the claude-CLI subscription shell-out is NOT permitted (ToS, verified twice …), so API-key is primary and ONLY, never a 'fallback'", and § Open questions item 2 opens "**RESOLVED — NO-GO**". Plan artifact `_planning/epics/E-VLAD-001.md` carries the same at § 3 Scope (L16), § 6 Dependency map (L77), § 7 Risk map (L80, explicitly "**RESOLVED NO-GO, not a risk**"), § 10 Gate W1 (L102). Also verified as folded: AC #1 repriced to be time-boxed from key-in-hand (L22), the codex/gemini identical-prohibited-shape item added (L81), and the fail-closed credential-custody item present in the epic's Definition of Done. Verified by reading the artifacts, not by trusting the amendment report.

### 2026-07-29 — The CLI-subscription model-access seam is ToS-barred
- Evidence: primary-source quotes captured verbatim in `runtime/vlad-w1/w1-planning-inputs.md` §1, researched once then independently re-fetched and confirmed by a second agent. Disclosed counter-evidence (the paused June-15 metering change) is recorded there too and read as a statement about metering, not a grant of permission.

### 2026-07-29 — This sprint holds registry `primary`
- Evidence: `.claude/project/sprint/active-sprints.yaml` reads `primary: S-VLADW1-01`, which is the intended outcome of minting AUDIT first and ENGINE last.

### 2026-07-29 — The sibling product repo does not exist
- Evidence: no path assigned; operator gate #1 unresolved.

## Verification log
- `node scripts/trackers/validate.js` — run after creating this file; result recorded in the session log of the creating commit.
- 2026-07-30 — `node scripts/sprint/validate.js .claude/project/sprint/plan-contracts/PC-20260730-0085.yaml` → valid against `warpos/sprint/plan-contract/v1`, exit 0.
- 2026-07-30 — `node scripts/sprint/validate.js .claude/project/sprint/sprints/S-VLADW1-01/current.yaml` → valid against `warpos/sprint/current-sprint/v1`, exit 0.
- 2026-07-30 — `node scripts/trackers/validate.js` → all 20 checks pass (baseline taken before these edits was also 20/20, so the green is not masking a pre-existing red).
- 2026-07-30 — registry `primary` read directly after both authoring runs: unchanged at `S-VLADW1-01`. `plan.js` does not write the registry, but this was confirmed rather than assumed because `add-sprint.js` does write it unconditionally.

## Current next action
β consult at the plan→design boundary — front-loaded per standing doctrine — on the two named surfaces: the fail-closed credential-custody enforcer (what makes "the key never leaves the machine" self-detecting rather than aspirational, and its honest residual ceiling) and the honest-degradation language ("NOT verified"; `could-not-run` on an unrecognized termination). Then **HOLD at design→build**: three operator gates are unresolved (repo name+slug+sign-off; ratification of API-key-only with the onboarding-cliff judgment; the API spend envelope). No product-side work may begin. Per J1 this sprint is **plannable, not blocked** — it would flip to `blocked` only if the operator judges the API-key wall unacceptable for v1.

## Completion record
- Final state: Not yet complete
- Percent completion: 10%
- Completion timestamp: n/a
- Definition of done used: the Definition of Done above
- Evidence of completion: n/a
- Session IDs / dates / agents: 2026-07-29 — Alex ε (tracker creation); 2026-07-30 — Alex ε as "EpsilonW1" (plan contract `PC-20260730-0085`)
- Parent epic: E-VLAD-001
- Remaining follow-up items: the three operator gates; the β verdict on the credential-custody enforcer and the honest-degradation language; the credential-custody enforcer itself; the empirically-characterized quota detector; the port-reference verification pass; enumerating the four-core MCP tool set at design; the unowned codex/gemini terms question; the unowned `safe-spawn` env-allowlist amendment; the `--allow-overlap` decision at `/sprint:execute` for the shared sibling-repo surface. The `/epic:fold` amendment is DONE (verified 2026-07-30).
- Related untracked work: None
- ../../TRACKER.md updated: Yes (1.2.0 marker NEXT-ACTION item 4 names the Wave-1 conduct) · Roadmap reconciled: Yes (ROADMAP row added by the mint, `fd519ab1`)
