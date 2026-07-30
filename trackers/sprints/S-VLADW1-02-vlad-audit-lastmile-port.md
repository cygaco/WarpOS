# S-VLADW1-02 — Vlad Wave-1 AUDIT: port the lastmile audit into the engine (epic label SP-VLAD-W1-AUDIT)

- **Sprint label and number:** S-VLADW1-02 (epic label `SP-VLAD-W1-AUDIT`; the label form is schema-invalid as an id — see Decisions)
- **Title:** Job #1 — port lastmile detect/score/adapters into the Vlad engine, adopt `score.js` as the one readiness number, and produce receipt-schema evidence from portfolio dogfood
- **Owner:** Alex ε (sprint conductor), under Alex α
- **Parent epic:** [E-VLAD-001](../epics/E-VLAD-001-vlad-v1-agent-mcp-cofounder.md) — see that epic's § Related sprints, which names this id
- **Goal:** Give the engine its first real job: detect a repo's stack, score its readiness, and emit a receipt — porting the existing lastmile audit rather than rewriting it, with exactly ONE readiness number in the product repo.
- **Scope:** Port detect/score/adapters into the engine; remove the WarpOS-specific refusals in the ported copy; an intake fallback for undetectable stacks; adopt `score.js` as the single readiness number; fill the receipt-schema interior that ENGINE leaves untyped, and mint receipt v1 from real dogfood data.
- **Out of scope:** The write path (Wave 2). The agent face and installer (Wave 2). Porting the checklist readiness proxy — see the J3 decision below; that is a deliberate NON-port, not an omission.
- **Current state:** Planning — registered, not started. Blocked on operator gates (see Blockers).
- **Percent completion:** 0% — no plan contract authored yet; no product-side work has begun and none may begin before the design→build gate clears.

## Definition of Done
- [ ] Plan contract authored and accepted (`scripts/sprint/plan.js`), with β consulted at the plan→design boundary.
- [ ] `/sprint:design` artifacts exist and the design→build gate is cleared by the operator.
- [ ] detect/score/adapters run inside the engine against a named portfolio corpus of ≥3 repos.
- [ ] Exactly ONE readiness number exists in the product repo: `score.js` adopted, the checklist proxy NOT ported, and any `FOUNDERS_CHECKLIST.md`-dependent dimension either re-sourced or honestly recorded as NOT SCORED.
- [ ] An enforcer exists that fails the build if a second readiness number appears.
- [ ] Receipt schema v1 minted from real dogfood data, filling the untyped interior ENGINE emits.
- [ ] Every ported path and line reference verified against the source repo before porting (see Risks).

## Related definitions
- Validator, Verification, Evidence, Completion — see ../../TRACKER.md

## Tasks
- [ ] Marshal the banked product-lead substance into a schema-valid plan-contract payload (`runtime/vlad-w1/w1-planning-inputs.md` §2, schema gotchas in §4.2).
- [ ] β consult at plan→design, front-loaded, on the named surfaces: the credential-custody enforcer and the honest-degradation ("NOT verified") language.
- [ ] Obtain the named portfolio corpus (≥3 repos) WITH explicit read-only authorization recorded in writing.
- [ ] Restate the readiness DoD item per J3 so it cannot regrow, and name its enforcer.
- [ ] Verify each cited port source before porting — the transferability inventory's references are `inferred_from_repo`, not verified.

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
- Engine → detect/score/adapters (in-engine call, not a shell-out).
- Engine → receipt journal (the interior ENGINE leaves untyped, filled here).

## Wirings verified
- None.

## Dependencies
- **S-VLADW1-01 (ENGINE)** — for the receipt/journal seam only. The dependency is narrow and deliberately so: see the J4 circularity decision.
- A named portfolio corpus of ≥3 repositories with recorded read-only authorization.

## Blockers
Four operator gates, all pending as of 2026-07-29. None is a WarpOS-side unknown; each needs a decision only the operator can give:
1. **Sibling repo name + slug + creation sign-off** — inherited from the epic's first approval point.
2. **Named portfolio corpus (≥3 repos) + explicit read-only authorization**, reconciled in writing against the standing WarpOS-only rule. Dogfood was accepted verbally in grill round 3 but never reconciled with "open these three directories."
3. **Ratification of the J3 convergence reframe** (below).
4. **API spend envelope** for dev/test — trips two autonomy rows (signup/purchase not allowed; ≥$5 ask-first).

Product-lead assessment carried forward: this sprint is **better-evidenced than ENGINE and its blockers are INPUTS, not unknowns** — it clears to `pass` without re-authoring once the four are answered.

## Risks
- **Second readiness number regrows / likelihood medium / impact medium** — "converge the two scores" invites porting both and reconciling them, which is a hidden second sprint. Mitigation: J3's restatement plus a build-failing enforcer, not prose.
- **Porting against unverified references / likelihood high / impact medium** — every port source in the transferability inventory is marked `inferred_from_repo`, never `verified_from_repo`, and the inventory flags its own maps as trailing live values. Mitigation: a builder verifies each path and line reference before porting; treat the inventory as a lead, not a citation.
- **Receipt-schema churn / likelihood medium / impact medium** — see J4; mitigated only if ENGINE ships the untyped-interior envelope.

## Decisions
- 2026-07-29 — **Sprint id.** The epic's `SP-VLAD-W1-AUDIT` is schema-invalid against the registry pattern; registered as `S-VLADW1-02`, epic label preserved as the title. Minted AUDIT-first so `add-sprint.js`'s unconditional `reg.primary` write lands on the gating sprint (ENGINE) rather than here.
- 2026-07-29 — **J3: this is an ADOPTION, not a convergence.** Adopt `score.js`; never port the checklist proxy, which concedes in its own code that it is an MVP stand-in; re-source the one `FOUNDERS_CHECKLIST.md`-dependent dimension or record it honestly as NOT SCORED. New repo, no legacy consumer, nothing to migrate — the word "converge" is the trap.

## Open questions
- Blocking: all four operator gates above.
- Non-blocking: whether the re-sourced readiness dimension can be derived at all, or must ship as NOT SCORED.

## Session log
<!-- Append-only (§24). See SESSION_LOG_TEMPLATE.md for the full field set. -->
### 2026-07-30 00:00 UTC — Session 2026-07-29-release-and-pass
- Agent(s): Alex ε (conductor), Alex α (dispatcher) · Mode: sprint
- Work performed: Created this tracker as the sprint's durable source-of-truth home. `add-sprint.js` mints the registry entry, ROADMAP rows and the sprint STORES (`current.yaml`/`progress.yaml`) but NOT a tracker file; that gap was found while beginning the planning phase and is recorded here rather than worked around.
- Files changed: this file (new). · Paths changed: None. · Wirings changed: None.
- Decisions: Recorded the id resolution and the J3 reframe as Decisions rather than leaving them in the banked planning notes.
- Issues discovered: The tracker scaffold was missing for both Wave-1 sprints; `git ls-files` showed only the four store files.
- Definitions added/changed: None
- State change: (new) → Planning · Completion change: — → 0%
- Verification performed: Registry read directly — `primary: S-VLADW1-01`, both ids registered with pointers. · Validation run: `node scripts/trackers/validate.js` · Validation result: see Verification log
- Next action: Author the plan contract.
- Evidence/references: `runtime/vlad-w1/w1-planning-inputs.md`; registry `.claude/project/sprint/active-sprints.yaml`

## Change log
### 2026-07-30 00:00 UTC — Session 2026-07-29-release-and-pass
- Created the tracker from `trackers/templates/SPRINT_TEMPLATE.md`, with `SP-20260725-002-memory-verify.md` as the section-discipline exemplar.

## Evidence log
### 2026-07-29 — The sibling product repo does not exist
- Evidence: no path assigned; operator gate #1 (name + slug + sign-off) unresolved. Recorded as Verified Nonexistent rather than left implicit.

### 2026-07-29 — Registered but unstarted
- Evidence: `.claude/project/sprint/active-sprints.yaml` lists `S-VLADW1-02` with pointer `.claude/project/sprint/sprints/S-VLADW1-02`; that store holds only `current.yaml` and `progress.yaml`.

## Verification log
- `node scripts/trackers/validate.js` — run after creating this file; result recorded in the session log of the creating commit.

## Current next action
Author the plan contract from the banked product-lead substance, then β at plan→design (front-loaded) on the credential-custody enforcer and the honest-degradation language. **HOLD at design→build**: the build phase needs the sibling repo, and all four operator gates are unresolved. No product-side work may begin.

## Completion record
- Final state: Not yet complete
- Percent completion: 0%
- Completion timestamp: n/a
- Definition of done used: the Definition of Done above
- Evidence of completion: n/a
- Session IDs / dates / agents: 2026-07-29 — Alex ε (tracker creation only)
- Parent epic: E-VLAD-001
- Remaining follow-up items: the four operator gates; the readiness-number enforcer; the port-reference verification pass
- Related untracked work: None
- ../../TRACKER.md updated: Yes (1.2.0 marker NEXT-ACTION item 4 names the Wave-1 conduct) · Roadmap reconciled: Yes (ROADMAP row added by the mint, `fd519ab1`)
