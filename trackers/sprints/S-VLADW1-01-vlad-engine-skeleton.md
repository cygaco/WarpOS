# S-VLADW1-01 — Vlad Wave-1 ENGINE: skeleton, MCP surface, job state machine (epic label SP-VLAD-W1-ENGINE)

- **Sprint label and number:** S-VLADW1-01 (epic label `SP-VLAD-W1-ENGINE`; the label form is schema-invalid as an id — see Decisions). **Registry `primary`.**
- **Title:** Engine skeleton — plain-node Agent SDK app, MCP stdio server, four-core tool surface, job state machine, journal, permission-level config port, and the API-key model-access seam
- **Owner:** Alex ε (sprint conductor), under Alex α
- **Parent epic:** [E-VLAD-001](../epics/E-VLAD-001-vlad-v1-agent-mcp-cofounder.md) — see that epic's § Related sprints, which names this id
- **Goal:** Stand up the engine Vlad runs on: a plain-node app on the TypeScript Agent SDK, exposing a four-tool MCP surface over stdio, with a job state machine, a journal, ported permission-level config, and a model-access seam that bills to the user's own API key.
- **Scope:** Engine skeleton; MCP stdio server + four core tools; job state machine; journal writer; permission-level config port; branding guard; a host-free driver so the surface can be exercised end-to-end; and the credential-custody enforcer the model-access seam requires.
- **Out of scope:** The audit job itself (S-VLADW1-02). The write path, agent face and installer (Wave 2). Typing the receipt interior — see the J4 decision; ENGINE emits a versioned envelope with an UNTYPED interior deliberately.
- **Current state:** Planning — registered as registry `primary`, not started. Blocked on operator gates (see Blockers).
- **Percent completion:** 0% — no plan contract authored; no product-side work has begun and none may begin before the design→build gate clears.

## Definition of Done
- [ ] Plan contract authored and accepted (`scripts/sprint/plan.js`), with β consulted at the plan→design boundary.
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
- [ ] Marshal the banked product-lead substance into a schema-valid plan-contract payload (`runtime/vlad-w1/w1-planning-inputs.md` §2, schema gotchas in §4.2).
- [ ] β consult at plan→design, front-loaded, on the named surfaces: the credential-custody enforcer and the honest-degradation ("NOT verified") language.
- [ ] Route the epic amendment to α via `/epic:fold` — **not ε** — because it reverses an operator-ratified decision (see Blockers #3).
- [ ] Verify each cited port source before porting: `score.js:134`, `phases/preflight.js`, `permission-profile.js`, `transaction.js`, `registry.js` are all `inferred_from_repo`, never read.

## Files expected to change
- None in this repository. All product-side files live in the sibling repo, which does not exist yet (operator-gated).

## Files actually changed
- None.

## Paths expected to exist
- The sibling product repo (name and slug pending operator sign-off).

## Paths verified to exist
- None — the sibling repo is not created.

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
Four operator gates, all pending as of 2026-07-29:
1. **Sibling repo name + slug + creation sign-off** — the epic's first approval point.
2. **Does the operator ratify API-key-only model access, and does the product survive the reinstated onboarding cliff?** This reverses a decision the operator personally made in grill round 3 to solve the drop-off they themselves named as the biggest one. **Not product-lead altitude, and not ε's.**
3. **The epic states the dead CLI-subscription seam as fact in FOUR places** — tracker § Scope and § Open questions item 2; plan artifact § 3 Scope, § 6 Dependency map, § 7 Risk map (first entry), § 10 Gate W1. Executing now means building to a contradicted contract. Remedy: `/epic:fold E-VLAD-001` **routed to α**, before `/sprint:design`.
4. **Anthropic API spend envelope** for dev/test — trips two autonomy rows (signup/purchase not allowed; ≥$5 ask-first).

## Risks
- **Building to a contradicted contract / likelihood high / impact high** — the epic still asserts the ToS-barred seam in four places. Mitigation: the `/epic:fold` amendment lands before design.
- **Throwaway receipt work via a designed-in circularity / likelihood high / impact medium** — the epic says the receipt schema stays open until dogfood data exists (AUDIT), while AUDIT depends on ENGINE *for the receipt seam*. So ENGINE would type a receipt v0 that propagates into the journal writer, `get_status`, MCP signatures, driver assertions and ledger records, and then real data demands structural change. Mitigation is cheap **only if decided now**: emit a versioned envelope with an UNTYPED interior and never branch on it. See J4.
- **Silent mis-billing / likelihood medium / impact high** — in `-p` "the key is always used when present", so a stray ambient env key bills the wrong Console org. Mitigation: allowlist-based env passing, asserted.
- **Permission port without a taxonomy / likelihood medium / impact medium** — porting permission levels against an action taxonomy that does not exist yet. Mitigation: ship vocabulary + config + in-code check + exactly ONE genuinely enforced refusal.
- **Porting against unverified references / likelihood high / impact medium** — every port source is `inferred_from_repo`; the cited files were never read. Mitigation: verify each path and line before porting.

## Decisions
- 2026-07-29 — **Sprint id.** `SP-VLAD-W1-ENGINE` is schema-invalid against the registry pattern; registered as `S-VLADW1-01`, epic label preserved as the title. Minted LAST so `add-sprint.js`'s unconditional `reg.primary` write landed here, on the gating sprint.
- 2026-07-29 — **Model access is API-key-only, and there is no fallback.** The claude-CLI subscription shell-out is **ToS NO-GO**: Anthropic's legal page bars third-party developers from routing requests through Free/Pro/Max credentials on behalf of their users, with no carve-out and an enforce-without-notice reservation; `claude -p` IS the Agent SDK's CLI surface, so shelling out does not escape the SDK restriction; and `claude setup-token` is the same prohibited shape, not a workaround. Verified twice, quotes independently re-fetched. The subscription path was never permitted, so API-key is primary and only — **subject to operator ratification (Blocker #2).**
- 2026-07-29 — **J4: ENGINE emits a versioned envelope with an UNTYPED interior** (`schema_version` + three named slots), journalled/returned/logged opaquely, never validated or branched on. AUDIT fills the interior and mints v1. This is what breaks the designed-in receipt circularity, and it is cheap only if decided before the seam is built.

## Open questions
- Blocking: all four operator gates above.
- Non-blocking, to Anthropic sales (no public answer exists): the exact scope of "route requests … on behalf of their users" for a local-CLI topology; the approval criteria behind the SDK page's "unless previously approved" carve-out; which document controls given the paused June-15 metering change; the `--bare` default timeline; the exit-code/JSON contract on quota exhaustion; current numeric Pro/Max limits.
- Non-blocking but unowned: **"opportunistic use of other CLIs when detected" is the identical prohibited shape for codex/gemini, and nobody has read OpenAI's or Google's terms.** Only the Anthropic instance was tested.

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

## Change log
### 2026-07-30 00:00 UTC — Session 2026-07-29-release-and-pass
- Created the tracker from `trackers/templates/SPRINT_TEMPLATE.md`, with `SP-20260725-002-memory-verify.md` as the section-discipline exemplar.

## Evidence log
### 2026-07-29 — The CLI-subscription model-access seam is ToS-barred
- Evidence: primary-source quotes captured verbatim in `runtime/vlad-w1/w1-planning-inputs.md` §1, researched once then independently re-fetched and confirmed by a second agent. Disclosed counter-evidence (the paused June-15 metering change) is recorded there too and read as a statement about metering, not a grant of permission.

### 2026-07-29 — This sprint holds registry `primary`
- Evidence: `.claude/project/sprint/active-sprints.yaml` reads `primary: S-VLADW1-01`, which is the intended outcome of minting AUDIT first and ENGINE last.

### 2026-07-29 — The sibling product repo does not exist
- Evidence: no path assigned; operator gate #1 unresolved.

## Verification log
- `node scripts/trackers/validate.js` — run after creating this file; result recorded in the session log of the creating commit.

## Current next action
Author the plan contract from the banked product-lead substance, then β at plan→design (front-loaded) on the credential-custody enforcer and the honest-degradation language. **HOLD at design→build**: all four operator gates are unresolved, and Blocker #3 additionally requires α's `/epic:fold` amendment to land first so the sprint is not built against a contract the epic contradicts in four places. No product-side work may begin.

## Completion record
- Final state: Not yet complete
- Percent completion: 0%
- Completion timestamp: n/a
- Definition of done used: the Definition of Done above
- Evidence of completion: n/a
- Session IDs / dates / agents: 2026-07-29 — Alex ε (tracker creation only)
- Parent epic: E-VLAD-001
- Remaining follow-up items: the four operator gates; the `/epic:fold` amendment routed to α; the credential-custody enforcer; the empirically-characterized quota detector; the port-reference verification pass; the unowned codex/gemini terms question
- Related untracked work: None
- ../../TRACKER.md updated: Yes (1.2.0 marker NEXT-ACTION item 4 names the Wave-1 conduct) · Roadmap reconciled: Yes (ROADMAP row added by the mint, `fd519ab1`)
