# Granular Stories — Hook & Process Hygiene

**Sprint:** `SP-20260518-008`
**High-level stories:** `high-level-stories.md`

## S-1.1 — `format.js` binary-resolution spawn

**As** a hook author,
**I want** `format.js` to use `execFileSync(process.execPath, [require.resolve('prettier/bin/prettier.cjs'), '--write', filePath])`,
**So that** each Edit/Write triggers ONE Node cold-start instead of two (no `npx`).

Acceptance criteria: `AC-1.1.1`, `AC-1.1.2`.
Linked: `H-1`, `R-1`.

## S-1.2 — `format.js` timeout cleanup

**As** a Windows developer,
**I want** `format.js` to kill the prettier child on ETIMEDOUT (`taskkill /F /T /PID` on Windows, `SIGKILL` on POSIX),
**So that** the child does not survive past the parent's 10s timeout.

Acceptance criteria: `AC-1.2.1`, `AC-1.2.2`, `AC-1.2.3`.
Linked: `H-1`, `R-2`.

## S-2.1 — `lint-hook-output.js` PreToolUse validator (new)

**As** a framework maintainer,
**I want** `scripts/hooks/lint-hook-output.js` to assert per-tool `tool_input` shape on PreToolUse and emit warn-only stderr on mismatch,
**So that** payload-shape regressions surface at the next Edit/Write.

Acceptance criteria: `AC-2.1.1`, `AC-2.1.2`, `AC-2.1.3`.
Linked: `H-2`, `R-3`.

## S-2.2 — `.claude/settings.json` registration

**As** a framework operator,
**I want** `lint-hook-output.js` registered in the PreToolUse `Edit|Write` chain at the agreed slot (after path-guard, before sprint-routing-guard),
**So that** the validator runs at the right point in the hook chain.

Acceptance criteria: `AC-2.2.1`.
Linked: `H-2`, `R-4`.

## S-3.1 — `node-procs.js` helper

**As** an operator,
**I want** `scripts/check/node-procs.js` to list Node procs cross-platform (PID, start-time, working-set, command), sorted by start-time, with `--json` option,
**So that** I can see Node-process state without remembering platform-specific commands.

Acceptance criteria: `AC-3.1.1`, `AC-3.1.2`, `AC-3.1.3`.
Linked: `H-3`, `R-5`.

## S-3.2 — `/check:node-procs` skill body

**As** a `/check:*` skill user,
**I want** `.claude/commands/check/node-procs.md` to follow the standard skill body conventions,
**So that** the skill is discoverable + consistent with sibling `/check:*` skills.

Acceptance criteria: `AC-3.2.1`.
Linked: `H-3`, `R-6`.

## S-4.1 — `operational-loop.md` background-tasks section

**As** a doc reader,
**I want** the operational-loop reference doc to carry a "Background tasks and Windows process hygiene" section,
**So that** the convention is discoverable from the canonical doc.

Acceptance criteria: `AC-4.1.1`.
Linked: `H-4`, `R-7`.

## S-4.2 — `/sprint:execute.md` run_in_background warning

**As** a Ralph-loop user,
**I want** `/sprint:execute.md` to carry an inline warning against `run_in_background` in the test phase,
**So that** I am reminded not to orphan child processes.

Acceptance criteria: `AC-4.2.1`.
Linked: `H-4`, `R-8`.

**Cross-sprint note:** S-4.2 edits the same file as Sprint A's T-20260518-111. Serialize: land T-111 first.
