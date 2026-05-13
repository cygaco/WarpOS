# Release Plan — /sprint:retrospective skill — close-of-sprint reflection

**Sprint:** `SP-20260513-004`
**PRD:** `prd.md`

> Honored by `/sprint:release`. Lists the conditions under which the
> sprint may ship.

## Required to ship

- [ ] All `done` tickets meet their AC.
- [ ] All blocking issues are resolved, deferred, or explicitly accepted.
- [ ] PRD requirements `R-1` through `R-8` satisfied.
- [ ] COPY satisfied per `copy.md` (`C-1` headings stable; `C-2..C-7`
      error/success strings match script output exactly).
- [ ] INPUTS satisfied per `inputs.md` (`IN-1..IN-7`).
- [ ] TRACE entries fire as documented in `trace.md` (`TR-1` through
      `TR-4` minimum).
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md`.
- [ ] QA plan passing per `qa-plan.md` (especially partial-write
      persona 3 and race persona 4).
- [ ] Redteam plan passing per `redteam-plan.md` (A-1 path-traversal,
      A-3 prompt-injection, A-4 premature-retro must be mitigated).
- [ ] External service dependencies: `none_expected` confirmed.
- [ ] No `secret: true` env-var values appear in any tracked file.
- [ ] Release approval recorded in `approvals/`.

## Ship-gate functional tests

These three tests are the **hard ship gate** — the sprint does not ship
unless all three pass on real tracker state:

### G-1 — Retro on SP-20260512-001 produces a valid artifact

```bash
node scripts/sprint/retrospective.js --sprint SP-20260512-001
node scripts/sprint/validate.js \
  .claude/project/sprint/history/SP-20260512-001/retro.yaml
```

Expected: both commands exit `0`. `retro.yaml` and `retro.md` exist
under `paths.sprintHistory/SP-20260512-001/`. The retro validates
against `sprint-retrospective.schema.json`.

### G-2 — `active-sprints.yaml` registry status flipped

After G-1, the matching entry in `paths.sprintActiveRegistry` for
`SP-20260512-001` has `status: retrospected` and a fresh
`updated_at`. Schema validation of the registry still passes.

Note: SP-20260512-001 is currently in registry status `closed`;
running the retro is the production smoke test for the transition.

### G-3 — Sprint workflow doc reflects the new phase

```bash
grep -c "/sprint:retrospective" \
  .claude/project/reference/sprint-workflow.md
```

Expected: at least 3 occurrences (Commands table, lifecycle diagram,
status-transition section). Failing this means S-8 wasn't completed.

## Release artifacts

- [ ] Changelog / release notes drafted (mention new skill, schema,
      templates, status-enum extension).
- [ ] Docs updated (`sprint-workflow.md` per S-8; `_docs/sprint/`
      pointers if any).
- [ ] Analytics/events: TR-1/2/3/4 added to event taxonomy if a doc
      exists; otherwise `none_required` (events are append-only).
- [ ] Migration plan: `none_required` (purely additive — new schema,
      new script, new template dir; existing `closed` sprints remain
      `closed` until someone runs the new skill on them).
- [ ] Rollback plan: deletion of the four new files +
      `git revert` of the registry schema enum addition restores
      pre-sprint state. Document this in the changelog.

## Monitoring after release

- [ ] First production retro run (likely on SP-20260512-001 as part
      of G-1) writes its trace events as documented.
- [ ] No new audit-block events fire from `requirement-format-guard`
      or `framework-manifest-guard` after the new files land.

## Approval

Production deploy of framework changes requires explicit user approval
per `CLAUDE.md#Autonomy`. Record the approval id in
`releases/<id>.yaml#approval_ref`.

Specifically the schema-enum addition to
`active-sprints.schema.json` is a Class B framework contract change —
the approval record should reference this PRD's Design Decision #3 as
the rationale.

## Documentation scaling

Required for `documentation_scale: m | l | xl`. This sprint is `m`.
