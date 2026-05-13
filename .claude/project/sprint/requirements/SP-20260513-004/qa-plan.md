# QA Plan — /sprint:retrospective skill — close-of-sprint reflection

**Sprint:** `SP-20260513-004`
**PRD:** `prd.md`

> Sprint v0.1 QA plan. Honored by `/sprint:execute` (mid-sprint checks)
> and `/sprint:release` (final QA gate). Diff-model review on QA is
> declared in `paths.sprintRouting` (`qa.diff_review: true`).

## Smoke checks

- [ ] `node scripts/sprint/retrospective.js --help` (or `--sprint
      bogus`) exits cleanly with usage text — no uncaught crash.
- [ ] `node scripts/sprint/retrospective.js --sprint SP-20260512-001
      --no-synth` writes a valid skeleton retro and exits `0`.
- [ ] `node scripts/sprint/validate.js
      .claude/project/sprint/history/SP-20260512-001/retro.yaml`
      validates the produced retro.

## Per-story QA

### S-1 — Schema
- [ ] AC-1.1 verified — schema file exists and parses.
- [ ] AC-1.2 verified — required fields enforced.
- [ ] AC-1.3 verified — sample retro validates.
- [ ] Regression: re-validate all 10 existing sprint schemas still pass
      after adding the new sibling.

### S-2 — Script
- [ ] AC-2.1 verified — happy-path retro write.
- [ ] AC-2.2 verified — open-sprint guard.
- [ ] AC-2.3 verified — `--force` required for overwrite.
- [ ] Regression: `/sprint:plan` and `/sprint:design` still run end-to-end after
      the new script lands (no shared lib regression).

### S-3 — Skill doc
- [ ] AC-3.1 verified — flags discoverable.
- [ ] AC-3.2 verified — appears in skill index.

### S-4 — Templates
- [ ] AC-4.1 verified — placeholders render.
- [ ] AC-4.2 verified — section order matches COPY `C-1`.

### S-5 — Status transition
- [ ] AC-5.1 verified — schema enum includes `retrospected`.
- [ ] AC-5.2 verified — registry flip happens.
- [ ] AC-5.3 verified — idempotent re-run.
- [ ] Regression: existing `closed` sprints in registry still validate.

### S-6 — Synthesis prompt
- [ ] AC-6.1 verified — routing honored.
- [ ] AC-6.2 verified — no hallucinations on SP-20260512-001.
- [ ] AC-6.3 verified — `<unknown — no evidence in tracker>` markers
      appear where evidence is missing.

### S-7 — `--no-synth`
- [ ] AC-7.1 verified — skeleton mode writes successfully.
- [ ] AC-7.2 verified — skeleton validates.
- [ ] AC-7.3 verified — synthesis failure auto-falls back.

### S-8 — Workflow doc
- [ ] AC-8.1 verified — Commands table updated.
- [ ] AC-8.2 verified — hierarchy diagram updated.
- [ ] AC-8.3 verified — status transition documented.

## 7-persona QA scan (per `/qa:audit`)

The retro surface is small — the active personas to walk are:

1. **Happy path** — closed sprint with rich evidence; synthesis runs;
   retro written; registry flipped.
2. **Sad path** — open sprint, missing Plan Contract, malformed YAML
   in tracker.
3. **Partial-write** — synthesis fails *mid-way* (e.g., LLM returns
   200 chars then connection drops). The script must either: write
   nothing (transactional) or write a `.partial` file and exit
   non-zero. **No half-written `retro.yaml` allowed.**
4. **Race** — two `/sprint:retrospective --sprint <same-id>`
   invocations run concurrently. Both must not double-flip the
   registry, and only one retro file must end up on disk. Acquire an
   advisory lock at `paths.runtime/locks/retro-<SP-id>.lock` or use
   atomic rename.
5. **Boundary** — sprint with zero tickets (e.g., abandoned sprint);
   sprint with zero issues; sprint with thousands of decisions.
6. **Recovery** — script crashed mid-write; subsequent run completes
   cleanly (the `.partial` file is detected and either resumed or
   discarded with operator confirmation).
7. **Adversarial** — see `redteam-plan.md`.

## Cross-cutting QA

- [ ] Lint passes (`npm run lint:warpos`, `npm run lint:paths`).
- [ ] Schema-validate passes for all sprint schemas.
- [ ] No new console errors in golden path.
- [ ] TRACE events fire as documented (TR-1, TR-2, TR-3 minimum).
- [ ] COPY matches `copy.md` (errors + success messages literal-string
      match).
- [ ] INPUTS handle validation per `inputs.md`.

## External service QA

- [ ] ESDs status is `none_expected` — confirm no new ESD records were
      minted under `external-services/`.
- [ ] The LLM synthesis call uses the existing routing plumbing —
      no new provider credentials, no new env vars, no secrets in
      tracker files.

## Documentation scaling

This plan is the `documentation_scale: m` cut. For xs/s, ACs may be
inlined and a Cross-cutting subset is enough. For l/xl, add a
separate red-team plan (already present) and architecture-review plan.
