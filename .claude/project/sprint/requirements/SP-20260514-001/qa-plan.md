# QA Plan — Harden WarpOS update pipeline

**Sprint:** `SP-20260514-001`
**PRD:** `prd.md`

Honored by `/sprint:execute` (mid-sprint checks) and `/sprint:release` (final QA gate).

## Smoke checks

- [ ] `node scripts/warpos/lib/content-hash.js --selftest` (built-in smoke) exits 0.
- [ ] `npm run lint` passes (no new lint regressions in changed files).
- [ ] `node scripts/warpos/release-build.js` produces a capsule whose `framework-manifest.json` has 64-char sha256 on every asset.
- [ ] Cross-version replay: `node scripts/warpos/test/replay-update.js` (new) passes all four transitions: 0.6.x→0.7.0, 0.7.0→0.7.0 noop, 0.7.0→0.7.0 with edited template, 0.7.0→0.7.0 with stale migration.

## Per-story QA

### S-1 — content-hash module
- [ ] AC-1.1 verified (CRLF/LF text hash equality).
- [ ] AC-1.2 verified (binary raw hash preserved).
- [ ] AC-1.3 verified (`hashMatches` prefix logic).
- [ ] Regression: existing `manifest-honesty` runs against current 0.6.1 install still pass.

### S-2 — replace inline callers
- [ ] AC-2.1 verified (grep audit).
- [ ] AC-2.2 verified (byte-equality snapshot test).
- [ ] Regression: `/warp:release` end-to-end still succeeds.

### S-3 — capsule manifest full sha256
- [ ] AC-3.1, AC-3.2 verified.
- [ ] Regression: capsule fetched from prior release continues to load via back-compat read.

### S-4 — consumer installedHash full sha256
- [ ] AC-4.1, AC-4.2, AC-4.3 verified.
- [ ] Regression: jobhunter-app + aiweb upgrade from 0.6.1 → 0.7.0 in dry-run mode without Class C.

### S-5 — `--operator-override`
- [ ] AC-5.1, AC-5.2, AC-5.3 verified.
- [ ] Regression: existing 4 narrow flags removed cleanly; old invocations exit 2 with COPY pointing at new flag.

### S-6 — ownership transition
- [ ] AC-6.1, AC-6.2, AC-6.3 verified.
- [ ] Regression: jobhunter-app's `_requirements/00-canonical/Jobzooka-brief.md` survives a synthetic framework restructure replay.

### S-7 — stop shipping migrations
- [ ] AC-7.1, AC-7.2 verified.
- [ ] Regression: existing migrations under `framework/migrations/` still run via `migrations-loader.js` when read from capsule's `release.json`.

### S-8 — `applied-migrations` capsule-aware
- [ ] AC-8.1, AC-8.2 verified.
- [ ] Regression: post-apply, no infinite-loop "copy → flag stale → delete → re-copy" cycle.

### S-9 — new events
- [ ] AC-9.1, AC-9.2, AC-9.3 verified.
- [ ] Regression: events.jsonl schema validation passes on the new event kinds.

### S-10 — replay tests + docs
- [ ] AC-10.1, AC-10.2, AC-10.3 verified.
- [ ] Regression: existing `/check:warpos-*` skills still find the same drift on a deliberately-broken consumer fixture.

## Cross-cutting QA

- [ ] Lint passes.
- [ ] Path-lint passes (no new literal `.claude/...` strings introduced; all reference `paths.X`).
- [ ] Hook fixture tests pass.
- [ ] TRACE events fire as documented in `trace.md` (verify via `node scripts/events/query.js --type content-hash-mismatch` etc).
- [ ] COPY matches `copy.md` (grep each string in production code; print line).
- [ ] INPUTS validation behaves per `inputs.md`.
- [ ] `/check:all` passes against this repo after changes land.
- [ ] No new console errors in `/warp:update --dry-run` golden path.

## External service QA

Not applicable (no ESDs).

## Documentation scaling

`documentation_scale: l` — full QA + Redteam + Release plans.
