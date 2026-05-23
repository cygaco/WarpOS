# Red-Team Plan — Install fixture CI matrix

**Sprint:** `SP-20260524-001`
**PRD:** `prd.md`

> Adversarial review for an internal test harness. Threat model is narrow (no end-user input, no remote services) but the matrix has destructive potential if cleanup misfires.

## Threat classes to cover

- [ ] Authentication / authorization bypass — N/A (test tool, no auth surface).
- [ ] Input validation / injection — `--scenarios`, `--inject-regression`, `--fixture-root` must validate against a known allowlist; reject unknown ids; reject path traversal in `--fixture-root` (must resolve under repo root or `os.tmpdir()`).
- [ ] Business-logic abuse — N/A.
- [ ] Secrets exposure — Matrix MUST NOT log operator settings.local.json contents verbatim (may contain credentials operator put there); only field names + counts.
- [ ] External service abuse — N/A.
- [ ] Approval-boundary bypass — Matrix MUST NOT invoke `/warp:update --apply` against any directory that is NOT a fixture under the allowed fixture-root (key invariant).
- [ ] State-of-the-world bypass — Matrix MUST NOT mutate canonical WarpOS files (read-only against `_warpos/`, `scripts/`, `framework/releases/`).
- [ ] Prompt-injection — N/A (no LLM in the matrix).

## Per-sprint additions

- **T-A.1 — Stray fixture leak.** What if cleanup misfires and a fixture under `.warpos/test-fixtures/install-matrix/` outlives a run, then on the next run the new fixture has a name collision or stale lock? Mitigation: timestamped fixture dirs; explicit lock detection; `_failed/` namespace separates inspectable failures from live runs.
- **T-A.2 — Matrix-tests-itself-tests recursion.** The meta-test mode plants regressions in fixtures. What if a planted regression accidentally targets canonical (outside the fixture)? Mitigation: every write path in `--inject-regression` must resolve under the active fixture root and refuse otherwise. Asserted by AC-10.2.
- **T-A.3 — npm script ambiguity.** `npm run test:install-matrix` could collide with downstream-installed-product npm scripts (since canonical and consumers share script names). Mitigation: namespace as `test:install-matrix` (clearly canonical-side) and document in CLAUDE.md that consumers should not adopt this name.
- **T-A.4 — Scenario 4 hits real network if helper misfires.** No — the matrix only consumes local capsules under `framework/releases/`; if INSUFFICIENT_CAPSULES, it skips with a clear message (AC-5.2). No network calls.
- **T-A.5 — Fixture root path traversal.** `--fixture-root ../../sensitive/path` must be rejected. Validation: resolved path must startsWith repo root OR `os.tmpdir()`.

## Stop-the-bus signals

If any of these surface during redteam, halt `/sprint:execute` and escalate:

- Any path to the matrix mutating files outside the active fixture root.
- Any path to `--inject-regression` reaching canonical or product files.
- Any path to settings.local.json secrets being logged to JSON output or `paths.eventsFile`.
- Any path to a scenario running `/warp:update --apply` against an unallowed directory.

## Documentation scaling

This file is required for `documentation_scale: m`. For an internal test tool, the threat model is narrow but cleanup + boundary discipline is critical — hence the per-sprint additions above.
