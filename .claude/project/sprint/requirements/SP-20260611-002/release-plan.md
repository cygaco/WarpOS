# Release Plan — E-LIFECYCLE-001 close-out fix sprint — 17 REAL + 4 PARTIAL GPT 2nd-pass findings (team-guard/mode-guard bypass classes, turbo spend/auth integrity, coverage-gate waiver+expected-source, provider-tier false-green, planning-principles enforce path, ac-coverage fail-closed) + NOTAGAIN §8.3 legacy scoping

**Sprint:** `SP-20260611-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\prd.md`

> Honored by `/sprint:release`. Lists the conditions under which the
> sprint may ship. This is an ENGINE/tooling sprint (no deploy artifact);
> ship = ff-merge to the session branch + cross-family re-gauntlet green;
> the report-only→blocking FLIP is explicitly NOT part of this sprint
> (operator words, end-of-session batch).

## Required to ship

- [ ] All `done` tickets meet their AC.
- [ ] All blocking issues are resolved, deferred, or explicitly accepted.
- [ ] PRD requirements satisfied (R-1..R-10; R-10 only after SP-20260611-001 WS-A merges).
- [ ] COPY satisfied per `copy.md` (refusal/kill-switch/finding strings self-identify enforcer/reason/recovery).
- [ ] INPUTS satisfied per `inputs.md` (planted/spoofed/corrupt inputs fail closed).
- [ ] TRACE entries fire as documented in `trace.md`.
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md` (all 10 Hard ACs encoded, incl. the self-lockout fixture, shared-cutoff, provider-tier matrix, per-surface isolation).
- [ ] QA plan passing per `qa-plan.md`.
- [ ] Redteam plan passing per `redteam-plan.md` (cross-family re-gauntlet: gemini + claude execution-access + GPT re-pass on the fixed surfaces).
- [ ] External service dependencies ready, mocked, integrated, or deferred (status: none_expected).
- [ ] Required env vars present (names checked; values never logged — incl. kill-switch attestation logs).
- [ ] Release approval recorded in `approvals/`.
- [ ] **R-10 sequencing honored:** the wrapper-mode-binding ticket built ONLY after SP-20260611-001 WS-A merged; call sites re-located post-merge (no stale line numbers).

## Release artifacts

- [ ] Changelog / release notes drafted (the 17 REAL + 4 PARTIAL findings closed; flip ramp now safe)
- [ ] Docs updated (NOTAGAIN §8.3 legacy-scoping prep landed; E-LIFECYCLE-001 §H CLEARED-with-FINDINGS → close-out fixes done)
- [ ] Analytics/events updated where applicable (new kill-switch audit events, out-of-band-write findings, suspect-record notices wired into /scan)
- [ ] Migration plan: `none_required` (in-place enforcer hardening; no data migration)
- [ ] Rollback plan: `none_required` annotated — fixes are additive/fail-closed; if a fix introduces a false-positive block, revert that single surface's commit (per-surface isolation makes this clean)

## Monitoring after release

- [ ] **Next session's turbo grant works:** the FIRST `/session:turbo` / `node scripts/turbo/apply.js` in the next session grants + authorizes normally (the apply.js/spend-ledger/authorization-gate changes did NOT lock out a fresh session — the live-session self-lockout guard, AC-3.5, holds beyond the fixture into a real next-session grant).
- [ ] **`/scan:full` green with the new enforce paths report-only:** the next `/scan:full` is green; the new `--enforce` paths (provider-tier, planning-principles, check-ac-coverage) + the new detectors (out-of-band mode write, schemaless/expired allowlist, omitted-role coverage gap) are present and REPORT-ONLY (not flipped to blocking) until the operator's end-of-session words; any new finding on the real tree is a genuine gap, not a fixture false-positive.
- [ ] **No false-positive blocks on the real session:** team-guard / mode-guard do not block the legitimate verified team; the tracked-work-delete floor does not over-block untracked temp deletes; the legacy-scoped coverage scan reds no historic record.
- [ ] **Kill-switch + provenance audit trail visible:** any kill-switch activation or turbo widening this/next session surfaces its loud audit event at /scan (no silent bypass regressed in).

## Approval

Production deploy requires explicit user approval per
`CLAUDE.md#Autonomy`. This engine sprint has no production deploy; the
report-only→blocking FLIP (the only operator-gated action the fixes
enable) is deferred to the end-of-session operator batch — record that
approval there, not here. Record any release approval id in
`releases/<id>.yaml#approval_ref`.

## Documentation scaling

Required for `documentation_scale: m | l | xl`. This is the `m` cut at
`l`-size scope; the separate redteam + this release plan are both present
per the requirement.
