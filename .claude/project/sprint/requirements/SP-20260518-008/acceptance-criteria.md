# Acceptance Criteria — Hook & Process Hygiene

**Sprint:** `SP-20260518-008`
**PRD:** `prd.md`

> Sprint B is the first non-Sprint-A sprint after Sprint A's `verified_by:` convention lands. Sprint A's ship-gate is NOT yet merged at Sprint B's `/sprint:design` time, so Sprint B does not strictly require `verified_by:` (gate is gated on `goal_verification` presence in the Plan Contract, which Sprint B's PC does not include). The ACs below are still verifiable; tests will be authored during ticket execution.

## S-1.1 — `format.js` binary-resolution spawn

- **AC-1.1.1** — Given the updated `format.js`, when a `.js` file is edited (PostToolUse fires), then `format.js` invokes `execFileSync(process.execPath, [<prettier-bin>, '--write', <filePath>])` (NOT `execSync('npx prettier ...')`). Verified by reading the source: line invoking `execSync('npx prettier ...')` must be absent.
- **AC-1.1.2** — Given `node -e "console.log(require.resolve('prettier/bin/prettier.cjs'))"` from repo root, then the path resolves without throwing — confirming prettier is reachable via binary-resolution.

## S-1.2 — `format.js` timeout cleanup

- **AC-1.2.1** — Given a contrived prettier invocation that hangs longer than 10s (mock script), when `format.js` runs against it on Windows, then `taskkill /F /T /PID <pid>` is invoked and the child process is terminated within 1s after timeout.
- **AC-1.2.2** — Given the same hang on POSIX, when `format.js` runs against it, then `process.kill(pid, 'SIGKILL')` is sent and the child terminates.
- **AC-1.2.3** — Given any timeout event, when `format.js` finishes, then the hook exits 0 (fail-open preserved). No retry attempted (Class A decision per PC).

## S-2.1 — `lint-hook-output.js` PreToolUse validator

- **AC-2.1.1** — Given a PreToolUse event for `Edit` missing `file_path`, when `lint-hook-output.js` runs, then it emits a one-line stderr warning naming `Edit` + missing field, exits 0.
- **AC-2.1.2** — Given a PreToolUse event for `Write` missing `content`, when `lint-hook-output.js` runs, then it emits a one-line stderr warning naming `Write` + missing field, exits 0.
- **AC-2.1.3** — Given a well-formed event for either tool, when `lint-hook-output.js` runs, then it exits 0 with no stderr output. Warn-only — never blocks.

## S-2.2 — `.claude/settings.json` registration

- **AC-2.2.1** — Given the updated `.claude/settings.json`, when the PreToolUse `Edit|Write` chain is read, then `lint-hook-output.js` appears AFTER `path-guard.js` and BEFORE `sprint-routing-guard.js` in the hook list.

## S-3.1 — `node-procs.js` helper

- **AC-3.1.1** — Given `node scripts/check/node-procs.js` runs on Windows, then it produces a table with columns `PID, START, WS-KB, COMMAND` sorted by START ascending and a one-line summary `# <N> node procs`.
- **AC-3.1.2** — Given the same on POSIX, then it produces the same columns + summary (parsing `ps -e -o pid,etime,rss,command`).
- **AC-3.1.3** — Given `node scripts/check/node-procs.js --json`, then it emits a JSON array `[{ pid, start, ws_kb, command }, ...]` and the summary is not printed (json mode is machine-only).

## S-3.2 — `/check:node-procs` skill body

- **AC-3.2.1** — Given `.claude/commands/check/node-procs.md`, when read, then it contains frontmatter (`user-invocable: true`), sections for Input / Output / Empty-state / Implementation, and references `node scripts/check/node-procs.js $ARGUMENTS`. No `--kill-orphans` flag mentioned (Class A decision per PC).

## S-4.1 — `operational-loop.md` background-tasks section

- **AC-4.1.1** — Given `.claude/project/reference/operational-loop.md`, when read, then it contains a new heading-level section `## Background tasks and Windows process hygiene` (or equivalent) describing run_in_background semantics, orphan risk, Monitor vs Bash run_in_background, and Windows child-tree cleanup.

## S-4.2 — `/sprint:execute.md` run_in_background warning

- **AC-4.2.1** — Given `.claude/commands/sprint/execute.md`, when read, then it contains an inline warning sentence noting that `run_in_background` should NOT be used in the Ralph test phase (orphan risk). Sentence placed adjacent to the existing Ralph guidance.
