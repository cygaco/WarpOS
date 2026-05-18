# QA Plan — Hook & Process Hygiene

**Sprint:** `SP-20260518-008`
**PRD:** `prd.md`

## Smoke checks

- [ ] `node -e "console.log(require.resolve('prettier/bin/prettier.cjs'))"` resolves without throwing (R-1 prerequisite).
- [ ] Edit any `.js` file → no orphaned `npx`/`prettier` process appears in `/check:node-procs` after 12s (formatter completed).
- [ ] PreToolUse hook chain still runs without errors after `lint-hook-output.js` is wired in.
- [ ] `node scripts/check/node-procs.js` produces a non-empty table on a session with active Node procs.

## Per-story QA

### S-1.1 / S-1.2 — format.js
- [ ] AC-1.1.1 verified — `grep -n "execSync('npx prettier" scripts/hooks/format.js` returns no matches; `grep -n "execFileSync.*prettier" scripts/hooks/format.js` returns one match.
- [ ] AC-1.1.2 verified — manual smoke per smoke-check above.
- [ ] AC-1.2.1 verified (Windows) — contrived hang test sees taskkill invoked.
- [ ] AC-1.2.2 verified (POSIX) — contrived hang test sees SIGKILL sent.
- [ ] AC-1.2.3 verified — fail-open preserved (exit 0 on timeout).

### S-2.1 / S-2.2 — lint-hook-output.js
- [ ] AC-2.1.1 verified — malformed Edit event produces stderr warning, exit 0.
- [ ] AC-2.1.2 verified — malformed Write event produces stderr warning, exit 0.
- [ ] AC-2.1.3 verified — well-formed events produce no stderr, exit 0.
- [ ] AC-2.2.1 verified — `.claude/settings.json` PreToolUse Edit|Write chain shows lint-hook-output.js between path-guard.js and sprint-routing-guard.js.

### S-3.1 / S-3.2 — /check:node-procs
- [ ] AC-3.1.1 verified (Windows) — table format checked.
- [ ] AC-3.1.2 verified (POSIX) — table format checked.
- [ ] AC-3.1.3 verified — `--json` output parses as a JSON array.
- [ ] AC-3.2.1 verified — skill body conventions checked.

### S-4.1 / S-4.2 — Docs
- [ ] AC-4.1.1 verified — operational-loop.md contains the new section heading.
- [ ] AC-4.2.1 verified — execute.md contains the run_in_background warning sentence.

## Cross-cutting QA

- [ ] `/linters:run` passes (incl. path-lint).
- [ ] No new console / stderr noise on a normal Edit/Write (lint-hook-output is warn-only and quiet on well-formed input).
- [ ] format.js latency on a small `.js` file: <500ms p50 on Windows (compare with pre-change baseline; quick sanity check, not formal benchmark).
- [ ] Cross-sprint serialization: confirm Sprint A's T-20260518-111 has shipped before S-4.2 is committed (or rebase the edit cleanly).

## Documentation scaling

Scale=s. Red-team + release plans skipped per scale; threat surface is bounded (warn-only hook, diagnostic skill, doc edits, format.js fix). Ship-gate inherits sprint default; no sprint-specific ship blockers.
