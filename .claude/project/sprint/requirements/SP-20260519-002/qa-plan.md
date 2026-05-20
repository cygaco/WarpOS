# QA Plan — Polish public-facing repo surface for job-application audience

**Sprint:** `SP-20260519-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260519-002/prd.md`

> Sprint QA plan. Honored by `/sprint:execute` (mid-sprint) and `/sprint:release` (final gate).

## Smoke checks

- [ ] `ls *.md` at repo root returns only files appropriate for a public audience.
- [ ] `git grep -i "jobzooka\|bright data\|next\.js\|src/lib" PROJECT.md` returns 0 lines.
- [ ] `grep "Version:" README.md` value matches `node -p "require('./version.json').version"`.
- [ ] `WarpOS.md` is absent OR present as a ≤10-line stub.
- [ ] `node -p "require('./version.json').releasedAt"` returns `"2026-05-19"`.
- [ ] `DUMP.md` is absent from working tree AND `.gitignore`.

## Per-story QA

### S-1 (PROJECT.md rewrite)
- [ ] AC-1.1: zero stale-product references
- [ ] AC-1.2: AGENTS.md link resolves to WarpOS-describing doc
- [ ] AC-1.3: usable as template-by-example for downstream installs
- [ ] Regression: `CLAUDE.md` link to `PROJECT.md` still resolves

### S-2 (README sync)
- [ ] AC-2.1: version line matches `version.json`
- [ ] AC-2.2: skill count is current within reasonable range
- [ ] AC-2.3: hook count matches `framework/hooks.registry.json`
- [ ] AC-2.4: skill catalog audit or replacement complete
- [ ] AC-2.5: "Last verified" footer present
- [ ] Regression: README structure (sections, install instructions, license note) preserved

### S-3 (WarpOS.md delete)
- [ ] AC-3.1: inbound-ref grep clean OR all references updated
- [ ] AC-3.2: file absent or ≤10-line stub
- [ ] AC-3.3: commit message explains the *why*
- [ ] Regression: no broken links elsewhere

### S-4 (AGENTS.md cleanup)
- [ ] AC-4.1: every link in AGENTS.md resolves correctly

### S-5 (root cleanup)
- [ ] AC-5.1: DUMP.md gone + gitignored
- [ ] AC-5.2: DICTIONARY.md ≥5 entries
- [ ] AC-5.3: header callouts on warpos-to-update.md and issues.md

### S-6 (version.json + recurring-issue)
- [ ] AC-6.1: `releasedAt` = `2026-05-19`
- [ ] AC-6.2: recurring-issue entry present

### S-7 (USER_GUIDE.md, optional)
- [ ] AC-7.1: 5 Core Skills table + modes section reference real skills

## Cross-cutting QA

- [ ] All `.md` files commit clean (no lint failures from existing doc linters)
- [ ] `path-lint.js` passes (no new hardcoded literals introduced)
- [ ] `framework-manifest-guard.js` passes (no manifest staleness)
- [ ] `git status` clean after intended changes — no accidental staged files
- [ ] Cross-repo parity check: no framework-shared file (`.claude/agents/**`, `.claude/commands/**`, `paths.json`, `CLAUDE.md`) modified inadvertently
- [ ] `/check:references` (if run): no broken cross-doc links

## External service QA

- [ ] N/A — no ESDs declared in this sprint

## Documentation scaling

This is the `documentation_scale: m` cut.
