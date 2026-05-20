# Release Plan — Polish public-facing repo surface for job-application audience

**Sprint:** `SP-20260519-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260519-002/prd.md`

> Honored by `/sprint:release`. This is a docs-only release — no version bump, no capsule, just `git push origin main` after all tickets are done.

## Required to ship

- [ ] All `done` tickets meet their AC.
- [ ] All blocking issues resolved (none expected — pure doc work).
- [ ] PRD requirements R-1 through R-6 satisfied; R-7 satisfied OR explicitly deferred.
- [ ] COPY satisfied per `copy.md`.
- [ ] INPUTS source-of-truth checks per `inputs.md` all green at commit time.
- [ ] TRACE entries fire (`git log` carries the provenance per `trace.md`).
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md`.
- [ ] QA plan passing per `qa-plan.md`.
- [ ] Redteam plan passing per `redteam-plan.md` — especially privacy + private-product-name scans.
- [ ] No ESDs (declared none).
- [ ] User approval recorded for the release push to `origin/main` (per `CLAUDE.md#Autonomy` — pushing to a public remote always requires approval).

## Release artifacts

- [ ] Sprint changelog: not required (docs-only sprint, no version bump)
- [ ] No `version.json` bump (this sprint fixes `releasedAt`, doesn't bump `version`)
- [ ] No `framework/releases/X.Y.Z/` capsule
- [ ] Migration plan: none required (doc-only changes)
- [ ] Rollback plan: `git revert <sprint-merge-commit>` (single commit or merge of feature branch)

## Pre-push verification

- [ ] `git status` clean
- [ ] `git log origin/main..HEAD --stat` shows only top-level doc edits + `version.json` + `.gitignore` (DUMP.md addition) + `paths.recurringIssuesFile` append. No framework-shared file changes.
- [ ] `git diff --stat origin/main..HEAD` totals fit a doc-sprint shape (low hundreds of lines added/removed, not thousands)
- [ ] `git ls-tree -r HEAD --name-only | grep -E '^[^/]+\.md$'` lists only files appropriate for a public audience

## Monitoring after release

- [ ] Open `https://github.com/cygaco/WarpOS` in an incognito window after push; render-check the README and PROJECT.md.
- [ ] Re-run the privacy scan against `main` post-push.

## Approval

Production deploy (git push to public remote) requires explicit user approval per `CLAUDE.md#Autonomy`. Record the approval id in `releases/<id>.yaml#approval_ref` if a formal release id is minted.
