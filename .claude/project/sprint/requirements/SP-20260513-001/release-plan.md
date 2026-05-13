# Release Plan — /product:bootstrap skill — guided product brief in MD/HTML/DOCX

**Sprint:** `SP-20260513-001`
**PRD:** `prd.md`

> Honored by `/sprint:release`. Lists the conditions under which the
> sprint may ship.

## Required to ship

- [ ] All `done` tickets meet their AC (see `acceptance-criteria.md`).
- [ ] All blocking issues are resolved, deferred, or explicitly accepted.
- [ ] PRD requirements R-1 through R-12 satisfied or explicitly deferred.
- [ ] COPY C-1 through C-10 satisfied per `copy.md`.
- [ ] INPUTS IN-1 through IN-7 validated per `inputs.md`.
- [ ] TRACE events TR-1, TR-2, TR-3 fire as documented in `trace.md`.
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md`.
- [ ] QA plan passing per `qa-plan.md` (smoke + per-story + 7 failure-mode personas).
- [ ] Redteam plan passing per `redteam-plan.md` (RT-1 through RT-8).
- [ ] External service dependencies: `ESD-pandoc` recorded as `optional`; no required ESDs.
- [ ] Required env vars: none (skill is local-only).
- [ ] Release approval recorded in `approvals/` — covers (a) creating `/product:` namespace, (b) adding `briefs` + `briefsCurrent` to paths.json.

## Sprint-specific ship gates

- [ ] **Pandoc-on-PATH probe verified** on at least one Windows machine and one macOS or Linux machine. Both outcomes (present / absent) MUST produce the expected behavior per AC-S-5.x.
- [ ] **Golden brief test** — a scripted run with canned answers produces:
  - `_docs/briefs/<test-slug>/<test-slug>.brief.md`
  - `_docs/briefs/<test-slug>/<test-slug>.brief.html`
  - `_docs/briefs/<test-slug>/<test-slug>.brief.docx` (if pandoc present)
  - Heading-order match in MD + HTML.
  - `events.jsonl` contains the expected sequence per AC-X-1.
- [ ] **paths.json updated** — after the golden run, `paths.briefs` and `paths.briefsCurrent` exist, and `paths:doctor` reports zero warnings.
- [ ] **/docs entry added** — a "Start here — `/product:bootstrap`" callout is present in the project's onboarding entry point (per AC-S-8.1) OR a note in `release-notes.md` explains why the project has no such entry point.
- [ ] **Redteam corpus passes** — `tests/redteam/bootstrap-*.test.js` all green.
- [ ] **No new npm dependency** in `package.json` (defense of design decision D-2).

## Release artifacts

- [ ] Changelog / release notes drafted under `_docs/releases/<sprint-id>.md` referencing the new skill.
- [ ] Skill help (`copy.md#C-1`) wired and discoverable.
- [ ] `framework/templates/product-bootstrap/` templates committed.
- [ ] `scripts/product/bootstrap.js` committed with header comment linking back to the sprint id and PRD.
- [ ] Migration plan: `none_required` annotated (new feature, no existing data to migrate).
- [ ] Rollback plan: revert the commit that adds `.claude/commands/product/bootstrap.md` to disable the skill; paths.json keys are additive and safe to leave (or remove via `paths:rename` flow).

## Monitoring after release

- [ ] First 5 real runs across operators inspected — `brief_emitted.outcome` is `success` for all (or skipped pandoc path is acceptable for `partial` w/ docx-only skip).
- [ ] No errors in `events.jsonl` from the discussion flow on real-operator runs.
- [ ] No reports of "DOCX missing" without the install hint having been shown.
- [ ] Section-coverage QC failure rate <10% across the first 10 runs (signals discussion is appropriately bounded).

## Approval

Production deploy requires explicit user approval per
`CLAUDE.md#Autonomy`. Record the approval id in
`releases/<id>.yaml#approval_ref`. The approval covers:
- creating the `/product:` command namespace (new),
- adding `paths.briefs` and `paths.briefsCurrent` to the path registry,
- shipping the optional `ESD-pandoc` dependency declaration.

## Documentation scaling

Required for `documentation_scale: m | l | xl`. This sprint is `m`, so the release plan ships as a standalone file.
