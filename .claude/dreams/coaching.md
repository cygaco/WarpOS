# Morning Briefing

Append-only. Each section is one sleep cycle's coaching for the *next* session start.

---

# Morning Briefing — 2026-05-13

## Top 3 things from last night

1. **Your ladder has hollow rungs.** Releases 0.3.x and parts of 0.4.x got a `version.json` bump and a tag but no capsule under `framework/releases/X.Y.Z/`. Downstream `/warp:update --to 0.4.0 --apply` reached for those rungs and fell. Two pieces of work need to land before the next `version.json` bump:
   - Add a release-pipeline gate that refuses to tag if the capsule is missing/invalid (L-1, L-2).
   - Add `/warp:update` pre-flight: if target capsule absent, print available versions and exit cleanly. No silent failures.

2. **β is sitting in an empty chair.** 17 `beta-gate-blocked` events in three days. β isn't being overridden — β isn't being asked. The gate fires *after* the omission; by then the decision has already settled. Move β consultation upstream: drafting an action's plan should include a `/beta:ask` step that's cheaper than triggering the gate.

3. **41% of your prompt log is a metronome.** `/fixture hook smoke test` fired 37 of 90 prompts. It's a fixture — not human work — but every analytics view of "what is Alex doing" includes it. Tag test traffic at write-time (`actor=test` or `tags:[fixture]`) so the real signal isn't drowned.

## One leverage move worth doing first

**Build `advisory-escalator`.** Tonight's cross-pollination showed L-9, L-10, L-11, L-12 are all instances of the same root pattern: advisory hooks that warn forever but never auto-correct or escalate. A single meta-hook that watches advisory fires and promotes any pattern hitting N identical events/week to block (or to auto-rewrite) subsumes four learnings in one move. Estimated ROI: removes 32+ friction events/week.

## Quick wins (under 30 min each)

- `release-canonical.js` capsule gate (L-2 enforcement) — refuse tag without capsule
- `/warp:update` pre-flight capsule check (L-1 enforcement) — exit cleanly on miss with `Available versions: …` message
- Path-registry prune: remove or seed `research`, `tracesFile`, `requirementsStagedFile`, `oneshotRetros`
- Log the two recurring-issues candidates (17× beta-gate, 8× merge-guard) into `paths.recurringIssuesFile` via `/issues:log`

## Things that worked — keep doing them

- The Sprint v0.2 chain (plan → design → execute → release → warp:release) shipped a real feature end-to-end and survived a mid-execute crash via `/mode:adhoc` recovery. That chain is now a validated path for non-trivial work — reach for it.
- Iterative patch-release cadence (0.4.0 → 0.4.1 → 0.4.2 → 0.4.3 → 0.4.4) cleaned up doctor red within two patch releases. Cadence is healthy.

## Things to watch out for

- **Compaction loses verbatim prompts.** If the user asks "what was the last thing I sent?" the answer must come from a verbatim store, not a summary. Worth verifying `session:checkpoint` and `session:handoff` preserve last N raw prompts.
- **`node -e` with `fs` writes will be blocked** by merge-guard. Use Edit/Write tools, not inline scripts. (Per L-9.)
- **`cd <projectDir> && git …` prefix is redundant** in this harness — cwd is already correct. Strip the prefix before issuing git commands.


---

## Morning Briefing — 2026-05-20

You ended the last session with two sprints **implementation-complete but pre-release**, on a single branch `sprint/SP-20260518-007`. 11 commits, local-only. The push gate is the only thing standing between this work and main.

### What's waiting

1. **Two release records at `preparing` status.** RL-20260518-011 (Sprint A) and RL-20260519-012 (Sprint B). Auto-checks pass; human-curated items still unticked:
   - release_notes_written
   - docs_updated
   - migration_plan (`none_required` is a valid value)
   - rollback_plan (`none_required` is a valid value for additive sprints)
   - approval_recorded (mint an AP-id, edit it to `approved` state)
   - post_release_monitoring_plan (point at `paths.eventsFile` filters for the new event types)
2. **Branch is local-only.** `/commit:both` was queued for after `/sleep:deep`. The user's chain expects: `/commit:both` then "prepare the latest release" (likely `/warp:release` — full canonical WarpOS pipeline).
3. **Retros emitted as skeletons.** Both retro.yaml files exist at `paths.sprintHistory/SP-2026051{8,9}-00{7,8}/retro.yaml`. Operator can `--retry-synth` later for LLM-synthesized retros.

### What to do first

**Run `/commit:both`** — it queued behind sleep. Then the user wants "prepare the latest release", which most likely means `/warp:release` (drives canonical WarpOS release from this product repo: promote, bump, regen capsule, run gates, commit, tag, push).

Beta has standing precedent (EVT-s-sp-20260514-001-beta-002): release record may proceed; push/tag is the red line. The user typed `APPROVED` once this session for Sprint A's internal-canary release prepare; that approval scope was bounded — push needs a fresh typed line.

### The convention's birth certificate

Sprint A shipped `goal_verification` end-to-end but no live sprint has exercised it. The dream (Painting 2) flagged this: until a real next sprint opts in, the convention is unfalsified. **Suggested next sprint after this push**: pick a small bug-fix or feature with a clear executable goal and DELIBERATELY include `goal_verification: { reproduction: executable, … }` in its Plan Contract. Watch the design-time gate fire. Watch the release-time ship-gate run the cited test. That run is the convention's birth certificate.

### Watch for

- **Two-gate authority pattern** (Β-MP-001 candidate). β returns DECIDE; classifier blocks anyway on cost/release ops. Don't retry under β blessing — type a plain line, or let the work stop.
- **paths/build.js without registry edit first** = silent prune. Always edit `framework/paths.registry.json` BEFORE running `scripts/paths/build.js`. Verified once this session (T-105 + restore commit). Β anti-pattern A-015.
- **Manual ticket implementation needs manual routing.js record per phase.** If you bypass `/sprint:execute` again (cost-halt pivot, scope-too-large), remember to record execution/qa/redteam traces before `/sprint:release check`. Β anti-pattern A-016.

### What's already implemented (don't re-implement)

- goal_verification block on plan-contract.schema.json (additive, optional)
- regression-fixture.schema.json (`warpos/sprint/regression-fixture/v1`)
- paths.sprintRegressionCorpus → `tests/regression`
- design.js fixture gate (gated on goal_verification presence)
- release.js cited-test executor (three branches: pass/fail/inconclusive; ENOENT → fail)
- /check:ac-coverage skill + helper
- /linters:run sprint-test-*.js discovery (test-plan-honors-registry-primary now on lint board)
- retrospective.js Goal Verification Status annotation
- format.js execFileSync + ETIMEDOUT cleanup (Windows: taskkill; POSIX: SIGKILL)
- scripts/hooks/lint-hook-output.js (warn-only PreToolUse validator)
- /check:node-procs skill + helper
- operational-loop.md "Background tasks and Windows process hygiene" section
- execute.md run_in_background warning line
- sprint-workflow.md "Sprint Goal Verification" section
- sprint-full-autonomy.json moderate preset description bump

Refer to `paths.sprintReference#sprint-goal-verification-sp-20260518-007` when in doubt.

---

# Morning Briefing — 2026-05-22 (post 2026-05-21 sleep cycle)

## The headline

A parallel deep-research run on the DreamTeams brief landed 5 findings into `paths.learningsFile` (#106–#110) mid-session. Those findings **invert** the brief's positioning. Read them before doing anything else.

Most important: **Operating System + Quality Gates** (currently slot 8 of the Magic Output) is the real wedge — not the compiler, not the catalog+composer, not the multi-runtime neutrality, and not the Lean/Pro/God modes. Two independent research engines (Gemini Deep Research Pro + Claude WebSearch over 3 rounds) converged on this finding without seeing each other's outputs. The MAP study (arxiv 2512.04123) provides peer-reviewed evidence: 68% of production multi-agent systems break under 10 steps because no mainstream framework validates inter-agent message correctness.

## Suggested first action

Revise the DreamTeams brief to **draft 5** absorbing the research. Concrete changes:

1. **Promote Quality Gates to primary positioning.** Move from "8th part of Magic Output" to "the wedge." The compiler becomes the delivery mechanism for the gates; the gates ARE the product. Section 05 (Wedge) leads with the validation layer, not the roster.
2. **Drop "Lean/Pro/God become industry vocabulary" claim** from Section 06 (Vision). Per entry #108, direct search test failed — no industry usage. The modes can stay as UX affordance but cannot be positioned as a vocabulary moat.
3. **Reframe distribution as spec-first, product-second.** Per entry #107: ship `dreamteams/team-spec/v1` as a published open standard at v1 (MIT, public), then the compiler. MCP/LSP/Helm pattern. Try to get Goose/Amp/Aider implementing example teams in the spec on day one of publish.
4. **Shorten urgency.** Per entry #109: 12–18 month vendor-absorption window. Cursor 2.0 is best-of-N (verified), NOT crews. The window for being the open team-spec standard is open NOW.
5. **Flag the "63% non-developer" claim as needing validation.** Per entry #110: platform-aggregated, no disclosed methodology. r/vibecoding n>=50 survey BEFORE committing 8 weeks of build.

The user iterated 1→4 trusting the compiler frame; the research challenged the frame itself. Don't draft 5 inside the same frame — invert it.

## Secondary

- **`/warp:promote` the bootstrap improvements** (draft counter, inline-markdown renderer, emotional_promise section, bootstrap.md docs) to canonical WarpOS. Use `--paths` scoped to `scripts/product/bootstrap.js`, `framework/templates/product-bootstrap/`, `.claude/commands/product/bootstrap.md`. Exclude `_docs/briefs/dreamteams/` and `.claude/paths.json` (per the audit reported in this session).
- 98 uncommitted files on `main` from sprint workflow auto-writes. Most are auto-generated checkpoints/approvals — not session work. Worth a `git status` review and selective stash/commit so the working tree doesn't drift.
- 13 release/* branches accumulated locally. Not urgent; flag for cleanup via `/warp:promote-flag` when next doing release hygiene.
- The dream painting "Buried Crown" surfaced a meta-pattern worth carrying forward: **before iterating on a product's wrapper, audit the slot that's been there since v0.1 but never moved.** That's the crown. Lead with that.

## Carry-forward open question

From last sleep's RT-011: "Is WarpOS the framework-for-product or the product itself?" — this session's research may have answered it. **DreamTeams is the product; WarpOS is the framework.** WarpOS's existing validation primitives (reviewer, qa, redteam, compliance, security, req-reviewer) are already a working answer to the MAP-study gap that DreamTeams names. Productization path: extract WarpOS's validation layer as the dreamteams/team-spec/v1 open standard. Worth confirming with the user before committing to that frame in draft 5.

Refer to `paths.dreams`/2026-05-21.md for the dream paintings + deep reads that surfaced this.

---

# Morning Briefing — 2026-05-22 (sleep cycle: 2026-05-21 evening, post-SP-20260521-001 ship)

## First Tasks (highest-leverage)

1. **Dogfood the migration before doing anything else.** SP-20260521-001 shipped the portfolio framework but never validated it against real briefs. The two dogfood adopts (`dreamteams`, `companycam`) are the cheapest possible smoke test, AND they unblock T-178's deferred ACs.
   ```powershell
   # Pre-flight: clean up the half-scaffolded dir from yesterday's mid-execution attempt
   rm -rf "../dreamteams"   # sibling path (relativized — was an absolute maintainer path)

   # Then both adopts (each auto-creates a private GH repo per DEC-008)
   node scripts/portfolio/adopt.js dreamteams
   node scripts/portfolio/adopt.js companycam

   # Verify the registry shape
   cat ~/.warpos/portfolio.json | jq .
   node scripts/portfolio/list.js
   ```
   Expected gotchas (predicted by last night's blind-spot audit): brief-file-move semantics inside adopt.js, /warp:setup behavior inside a freshly-init'd sibling, gh repo-name collision handling. If any of these surface, those are real next-sprint tickets, not bugs to patch in-place.

2. **`/warp:promote` the portfolio framework to canonical WarpOS.** Until this happens, every NEW product the user adopts (via /portfolio:new) starts from a canonical clone that doesn't have the portfolio family installed. Scope the promote tightly:
   ```
   /warp:promote --paths scripts/portfolio/,.claude/commands/portfolio/,framework/templates/portfolio/,schemas/portfolio/,framework/paths.registry.json
   ```
   EXCLUDE: `~/.warpos/portfolio.json` (user-local, never canonical), `_docs/briefs/`, `_docs/clones/` (gitignored).

3. **Commit and clean up the working tree.** 185 modified/untracked files is a lot. The sprint state is coherent so a single squash-commit of the framework changes is fine; the auto-generated checkpoints/approvals/ralph state can ride along but should NOT be in the same commit as the framework changes. Two commits, scoped via the framework-promote prefix list (formerly referenced as `warposPromoteScope` in some planning docs; key never registered, surface being purged in SP-20260522-001).

## What Yesterday Surfaced (carry-forward)

- **Schema (evening dream):** invariants are the load-bearing pieces; features are the wrapper. For every framework feature that spawns/inherits/dispatches, name the invariant. If you can't, the feature *is* the invariant — and that's load-bearing fragility. Candidate for next /learn:integrate cycle.
- **Handoffs decay** — the morning's DUMP.md under-reported done work by ~50%. Future /session:dump output should re-cast "do X, Y, Z" recipes as "verify X, Y, Z are done; fall back to exec only on verification failure." This saves cycles and avoids re-implementation drift.
- **Multi-vendor routing gap is unresolved.** Yesterday we shipped via `--allow-routing-gap`. For the next user-facing release this needs to be either (a) actually wired (gemini-3.1-pro-preview as independent_reviewer), (b) policy-loosened with stronger evidence requirements, or (c) explicitly accepted as the standing posture. Pick before next /sprint:release.
- **Blanket session approvals don't cover destructive sibling-dir ops** — the auto-mode classifier correctly blocked `rm -rf` on `..\dreamteams\` yesterday even with "APPROVED for all actions" in effect. For future portfolio-related sprints, plan around this: either pre-commit a small wrapper that scopes destructive ops to the portfolio registry, or accept that the user owns cleanup of any partial-scaffold paths.

## Carry-forward Open Questions

1. Should `/portfolio:new` and `/portfolio:adopt` ship a STARTUP_HINT.md inside each new sibling repo that gives the next Claude session (spawned via `/portfolio:open --spawn`) enough context to pick up where WarpOS left off? Right now the spawned child knows the slug, the cwd, the env — but nothing about why it was woken up. That gap is the next bug class.
2. Should the deprecated `/product:*` aliases live longer than 2 releases? They're zero-cost shims; the only reason to remove them is housekeeping. Worth a sleep cycle to consider before v0.10.
3. The 126-learning bloat: next /sleep:deep should run aggressive Phase 1d pruning on entries with `status: logged` + `score: 0` + age > 14d. Currently deferred to let yesterday's lessons prove themselves first.

## State of the Tree

- `RL-20260521-016` deployed (internal target). RELEASES.md row written.
- `SP-20260521-001` retrospected (skeleton mode — operator may amend retro.md).
- 1 open recurring issue: `RI-20260520-001` (release-canonical.js releasedAt skip) — unchanged.
- 185 uncommitted files. Coherent but big.
- Half-scaffolded `..\dreamteams\` dir at sibling path — operator cleanup item (see step 1 above).

---

## Morning briefing — 2026-05-25 (post installer-completeness sprint)

Last session shipped a lot. Where to pick up:

1. **companycam is live but pre-fix.** It was scaffolded *before* SP-20260525-018 landed, so it lacks ROADMAP / sprint-infra / `_requirements`/`_docs`. Backfill it by running `/warp:setup` **inside companycam's own session** (the installer is now idempotent + complete). Then it's sprint-capable.
2. **Commit the post-sprint work.** The learn:integrate guard (`full.js`) + 13 new learnings + sleep artifacts are pending one final commit + push to main.
3. **Learnings consolidation is overdue** — 139 entries vs the 30–50 target. A focused prune restores signal-to-noise; don't let it grow further.
4. **Two orchestrator papercuts logged, not fixed:** (a) `/sprint:full` halt report mislabels the boundary as `before_plan` on a no-verdict `--resume`; (b) the beta-resume cadence is halt-heavy (5 consults for one sprint). Both milestone-0.11.0 polish candidates.
5. **The big rock remains the `_warpos/`-zone migration** (framework source mirror in products). This sprint scaffolded the zones but deferred the mirror — still the largest install-architecture gap.

Gentle note: the friction this session (3 classifier denials, 1 wrong-sprint plan) all traced to *boundaries that didn't announce themselves clearly*. The reflex that worked: when a wall blocks you 3×, stop pushing — build the path that doesn't cross it (local-only scaffold). Carry that.
