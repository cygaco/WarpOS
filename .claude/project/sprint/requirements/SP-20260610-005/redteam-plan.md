# Red-Team Plan — E-DISPATCH-INTEGRITY-001 F-1+F-3 — coverage-honesty (kill telemetry-only false-greens)

**Sprint:** `SP-20260610-005`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\prd.md`

> Adversarial review plan. Diff-model review on redteam is declared in
> `paths.sprintRouting` (`redteam.diff_review: true`). Sprint v0.1 ships
> the checklist; downstream projects extend with project-specific
> personas via `/redteam:full`. Scope: this sprint's surfaces only —
> the two coverage check scripts and gauntlet-verify (+ their tests).

## Threat classes to cover

- [ ] Authentication / authorization bypass (n/a — no auth surface; all surfaces are local check scripts reading the local ledger)
- [ ] Input validation / injection (malformed/truncated JSONL ledger lines, records missing `ok`/sprint correlation fields, bogus dates — every unverifiable input must classify as NOT covered / verify-FAIL, never green; fail-closed per BC-16)
- [ ] Business-logic abuse (multi-step exploits — e.g. forging a bare `ok:true` record without real dispatch evidence fields to satisfy the predicate; the predicate should demand the correlated completion-record shape, not any line containing `ok:true`)
- [ ] Secrets exposure (n/a — no credentials touched; diagnostics cite record ids/paths only)
- [ ] External service abuse (n/a — zero ESDs, no network calls in any surface)
- [ ] Approval-boundary bypass (push stays per-action operator-cadence; ship is a LOCAL ff-merge per RI-001)
- [ ] State-of-the-world bypass (gauntlet-verify or the scans reading a stale/wrong ledger — the worktree-cwd completion-record bug class ED-016: correlation must resolve the canonical ledger path, not cwd)
- [ ] Prompt-injection of the agent loop itself (n/a — no skill prose rewritten this sprint; check output is consumed by scans, not executed)

## Per-sprint additions

- Enforcer false-green (BC-16 class): either coverage scan or gauntlet-verify greening on input it could not verify — missing ledger, unreadable record, malformed sprint date. Every unverifiable path must exit non-zero / report NOT covered; cross-provider qa has previously caught exactly this class in a 0.17.0 enforcer.
- Legacy-cutoff scope abuse: the 2026-06-10 exemption used as a bypass — a NEW sprint mis-dated (or carrying an attacker-editable date field) slips the record-backed predicate. Verify the pre/post-cutoff discriminator derives from sprint provenance (scaffold/ledger dates), not from a freely editable bundle field, and that every applied exemption is NAMED in output (a silent waiver is invisible drift).
- Window-gaming on gauntlet-verify: a caller passing an absurdly wide window (e.g. since=epoch) reconstructs the whole-ledger verify the refusal was built to kill. Decide and test the boundary: either bound the maximum window or require sprint_id correlation regardless of window width.
- Historic-green via sprint_id collision: a reused/forged sprint_id matching an old `ok:true` record greens a never-ran lane. The correlation should pair sprint_id WITH the bounded window (both, not either) so a stale id alone cannot match.
- Fixture theater: planted fixtures (telemetry-only RED, pre-cutoff GREEN, historic-green FAIL, unbounded refusal) that the tests never actually load — each test must assert the non-zero exit AND the named diagnostic (missing-record named, exemption named, usage guidance printed), not just "command completed".
- Caller-compat regression as DoS: the CLI-contract change silently breaking epsilon-runtime/sprint-close callers (every verify now refused → all lanes red). The caller audit (AC-2.3) must be evidenced by grep + green caller-path tests in the same commit.

## Stop-the-bus signals

If any of these surface during redteam, halt `/sprint:execute` and
escalate:

- Any path to bypassing approval gates
- Any path to exfiltrating `secret: true` env values from tracker files
- Any path to running production deploys without approval
- Any path to silently changing TRACE while behavior changes
- Any path to a Ralph loop that doesn't reach a stop condition

## Documentation scaling

This file is mandatory for `documentation_scale: m | l | xl`. For xs/s
it can be a single checklist inlined in the QA plan. (This sprint is
`s` but the bundle ships the full 10-file structure per sibling
convention — SP-20260610-002/003.)
