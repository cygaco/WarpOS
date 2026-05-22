# Release Plan — /product:import

**Sprint:** `SP-20260520-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260520-002/prd.md`

> Honored by `/sprint:release`. This is a framework-additive release — the new skill ships out of this product repo into canonical WarpOS via `/warp:promote` so it propagates to every consumer install on the next `/warp:update`.

## Required to ship

- [ ] All `done` tickets meet their AC (8 stories, ~28 ACs across acceptance-criteria.md).
- [ ] All blocking issues resolved, deferred, or explicitly accepted (`/issues:list`).
- [ ] PRD requirements R-1 through R-10 satisfied; D-1..D-5 design decisions recorded in the merge commit message or PRD diff.
- [ ] COPY satisfied per `copy.md` (all 9 C-N blocks verified verbatim in either the emitted output or the help text).
- [ ] INPUTS satisfied per `inputs.md` (every `Failure mode` cell has a corresponding AC and a matching exit code in `import.js`).
- [ ] TRACE entries fire as documented in `trace.md` for both emit-mode and parse-mode runs (verified via end-of-sprint event-tail).
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md`.
- [ ] QA plan passing per `qa-plan.md`, including all 8 smoke checks.
- [ ] Redteam plan passing per `redteam-plan.md`, including all 9 SCENARIO-N checks and the privacy sweep.
- [ ] Paste-friendly rendering verified manually in **at least 3 of 5** target surfaces (Claude Code, Claude web, and one of {Codex, ChatGPT web, Gemini web}). Capture screenshots in `_docs/imports/qa-evidence/SP-20260520-002/`.
- [ ] Parse-mode round-trip verified end-to-end: `import → fake answers MD → --parse → bootstrap --answers-file → brief.md` produces a complete 8-section brief.
- [ ] `paths.json` registration verified non-destructive against a project with pre-existing `paths.imports` and `paths.importsCurrent` (idempotency).
- [ ] No `secret: true` env-var values appear in any tracked file.
- [ ] Section parity probe is green: `node scripts/product/import.js --probe | jq .section_parity` returns `true`.
- [ ] Release approval recorded for the upstream `/warp:promote` and subsequent push to public canonical WarpOS clone (per `CLAUDE.md#Autonomy` — pushing to a public remote always requires approval).

## Release artifacts

- [ ] Sprint changelog entry drafted (added to `RELEASES.md` and `ROADMAP.md` "Recently shipped" section).
- [ ] Docs updated:
  - [ ] `.claude/commands/product/import.md` (the skill spec itself) shipped to canonical WarpOS via `/warp:promote`.
  - [ ] `framework/templates/product-import/` shipped via `/warp:promote`.
  - [ ] `scripts/product/import.js` shipped via `/warp:promote`.
  - [ ] `PROJECT.md` "Skills" inventory updated to reference `/product:import` alongside `/product:bootstrap` and `/product:ponder`.
  - [ ] `USER_GUIDE.md` (if it lists product-suite skills) gets a one-line addition.
  - [ ] `framework-manifest.json` updated to include the new template dir.
- [ ] Telemetry: 6 new event types (`import_started`, `context_introspected`, `questionnaire_emitted`, `parse_started`, `parse_completed`, `parse_failed_section_mismatch`) added to the events-type allowlist if such a list exists; `/events:query` confirmed to recognize them.
- [ ] Migration plan: **none required** — additive sprint, no breaking change. No existing skill changes behavior.
- [ ] Rollback plan: `rm -rf _docs/imports/<slug>/` removes any operator-generated artifact. To roll back the skill itself: `git revert <sprint-merge-commit>` on this product repo, then re-run `/warp:promote` to propagate the deletion to canonical WarpOS, then `/warp:update` in consumer installs to pull the reverted state. Because the skill is additive, rollback breaks no existing behavior.

## Pre-push verification

- [ ] `git status` clean.
- [ ] `git diff --stat origin/main..HEAD` shows additions concentrated in `.claude/commands/product/import.md`, `scripts/product/import.js`, `framework/templates/product-import/`, `.claude/project/sprint/requirements/SP-20260520-002/`, and one-line touches to `PROJECT.md` / `RELEASES.md` / `ROADMAP.md`. Anything else triggers a review.
- [ ] `node scripts/check/path-lint.js` exits 0.
- [ ] `node scripts/hooks/requirement-format-guard.js` exits 0 on every requirement file in this sprint.
- [ ] `node scripts/hooks/framework-manifest-guard.js` exits 0.
- [ ] `node scripts/product/import.js --probe` exits 0 with `section_parity: true`.
- [ ] No untracked transient files at repo root (`.warpos/plan-payload-*.json`, generated test fixtures).

## Monitoring after release

- [ ] After upstream `/warp:promote` + push to canonical WarpOS, run `/warp:update --apply` in a clean consumer install fixture and verify `/product:import --help` works without modification.
- [ ] One week after release, run `/events:query --type=import_started --since=7d` against `paths.eventsFile`. If the count is zero AND we've shipped the skill in a release notes section, log a recurring-issue: "skill shipped but not invoked once — discoverability problem."
- [ ] One week after release, run `/events:query --type=parse_failed_section_mismatch --since=7d`. If the most common missing section id is repeatable (≥3 occurrences of the same id), open a follow-up ticket to soften the corresponding bootstrap prompt.

## Approval

Production deploy (push to canonical WarpOS public remote) requires explicit user approval per `CLAUDE.md#Autonomy`. Record the approval id in `releases/<id>.yaml#approval_ref` if a formal release id is minted, otherwise inline in the merge commit message.

## Documentation scaling

Required for `documentation_scale: m | l | xl`. This is the `m` cut.
