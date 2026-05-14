# QA Plan — Turbo as mode argument

**Sprint:** `SP-20260513-006`
**PRD:** `prd.md`

## Smoke checks

- [ ] `/mode:solo` (no `--turbo`) behaves exactly as before — no regression.
- [ ] `/mode:adhoc` (no `--turbo`) behaves exactly as before — no regression.
- [ ] `/mode:oneshot` (no `--turbo`) behaves exactly as before — no regression.
- [ ] `/mode:adhoc --turbo` enters adhoc AND applies the `builder-friendly` default scope.

## Per-story QA

### S-1 — Inputs section in all three skill bodies
- [ ] AC-1.1 verified (Inputs section present, identical wording).
- [ ] AC-1.2 verified (no-turbo path unchanged).
- [ ] AC-1.3 verified (exactly 3 grep matches for `--turbo` in `.claude/commands/mode/`).
- [ ] Regression: skill-format-guard / commands-frontmatter linters still pass.

### S-2 — Default scope per mode
- [ ] AC-2.1, AC-2.2, AC-2.3 verified.
- [ ] Regression: no default scope grants push/deploy/branch-delete authority.

### S-3 — Skill-body procedure
- [ ] AC-3.1, AC-3.2 verified.
- [ ] Regression: operator-supplied `--scope` overrides default (manual test in adhoc mode).

### S-4 — Partial-state recovery
- [ ] AC-4.1 verified (Recovery section present in all three).
- [ ] AC-4.2 verified (dry-run with simulated turbo failure reaches known-good state).

### S-5 — `/turbo.md` composition note
- [ ] AC-5.1 verified (note present near top of `turbo.md`).

## Cross-cutting QA

- [ ] Lint passes.
- [ ] `node scripts/skills/validate.js` (or equivalent) passes against all four edited skill bodies.
- [ ] No new permission-prompts surface during a recorded adhoc batch (smoke test).
- [ ] Events log: a `/mode:adhoc --turbo` invocation produces one `mode-set` event followed by one `turbo-applied` event.

## External service QA

Not applicable (no ESDs).

## Documentation scaling

`documentation_scale: s` — Redteam plan and Release plan are skipped at this scale per template policy. The Plan Contract's `approval_boundaries` already capture the Class-B decision (per-mode default scopes) — that decision is logged via `scripts/sprint/decisions/...` or `paths.decisionLedger` during execution.
