# PRD — Hook & Process Hygiene

**Sprint:** `SP-20260518-008`
**Plan Contract:** `PC-20260518-0012`
**Status:** draft
**Documentation scale:** `s`

## Outcome

Developer machines stop accumulating leaked Node processes during sprint runs. Hook-payload regressions surface at write-time, not weeks later via behavior drift. Operators get a one-command Node-procs diagnostic. Documentation closes the `run_in_background` orphan footgun.

## Context

### Original Request

> Hook & process hygiene: fix format.js prettier spawning via binary resolution + Windows timeout cleanup, add scripts/hooks/lint-hook-output.js for PreToolUse payload-shape validation, new /check:node-procs diagnostic skill, document background-task pitfalls in operational-loop.md and /sprint:execute.

### Current Behavior

`scripts/hooks/format.js` (32 lines, line 21) calls `execSync('npx prettier --write "<file>"')` with `timeout: 10_000`. Two Node cold-starts per Edit/Write (`npx` → `prettier`). The catch-all `try/catch (err) { process.exit(0); }` swallows ETIMEDOUT silently — on Windows, the child `prettier` process can survive past the parent's timeout (cmd.exe wrappers don't honor SIGTERM), leaking Node procs. No PreToolUse hook validates the `updatedInput` payload shape; defensive reads (`event.tool_input?.file_path || event.tool_input?.content?.file_path`) cope with the current shape but a framework upgrade renaming a field surfaces as silent drift.

### Desired Behavior

`format.js` uses `execFileSync(process.execPath, [require.resolve('prettier/bin/prettier.cjs'), '--write', filePath])` — one Node cold-start, no shell. Captures child PID; on ETIMEDOUT, runs `taskkill /F /T /PID <pid>` (Windows) or sends `SIGKILL` (POSIX). New `scripts/hooks/lint-hook-output.js` PreToolUse hook validates per-tool payload shape (Edit, Write — MultiEdit out of scope for v1) and emits warn-only stderr on mismatch. `scripts/check/node-procs.js` + `.claude/commands/check/node-procs.md` ship a read-only diagnostic listing Node procs by PID, start-time, working-set, command. `operational-loop.md` gains a "Background tasks and Windows process hygiene" section. `.claude/commands/sprint/execute.md` adds a one-line warning against `run_in_background` in the Ralph test phase.

## Requirements

> `R-N` ids per `scripts/hooks/requirement-format-guard.js`.

- `R-1` — **`format.js` binary-resolution spawn.** Replace `execSync('npx prettier ...')` with `execFileSync(process.execPath, [require.resolve('prettier/bin/prettier.cjs'), '--write', filePath])`. One Node cold-start; no shell; no `npx` indirection.
- `R-2` — **`format.js` timeout cleanup.** Capture child PID. On ETIMEDOUT, kill the child tree: Windows = `taskkill /F /T /PID <pid>` via `spawnSync`; POSIX = `process.kill(pid, 'SIGKILL')`. Platform guard via `process.platform === 'win32'`. Per CLAUDE.md Class A decision recorded in PC `needs_user_or_beta_review`: kill + log + continue, no retry.
- `R-3` — **`scripts/hooks/lint-hook-output.js` (new).** PreToolUse hook on `Edit|Write`. Reads stdin event JSON, asserts per-tool `tool_input` shape (Edit requires `file_path`, `old_string`, `new_string`; Write requires `file_path`, `content`). On mismatch, emits a one-line stderr warning naming the tool + missing field. Exit 0 (warn-only) — never blocks.
- `R-4` — **`.claude/settings.json` hook registration.** Add `lint-hook-output.js` to PreToolUse `Edit|Write` chain. Per PC Class A decision, slot AFTER `path-guard.js` (item 6) and BEFORE `sprint-routing-guard.js` (item 7) — after security guards, before workflow guards. MultiEdit matcher coverage out of scope for v1 (matches existing chain coverage).
- `R-5` — **`scripts/check/node-procs.js` (new helper).** Lists Node processes with columns: PID, start-time, working-set-KB, command (truncated 120 chars). Platform-specific: Windows uses `tasklist /FO CSV /FI "IMAGENAME eq node.exe"`; POSIX uses `ps -e -o pid,etime,rss,command | grep -i node | grep -v grep`. Sorted by start-time ascending. `--json` flag for machine output. Diagnostic only — no `--kill-orphans` flag in v1 per PC Class A decision.
- `R-6` — **`.claude/commands/check/node-procs.md` (new skill body).** Read-only `/check:*` skill. Frontmatter: `user-invocable: true`. Sections: Input (no args / `--json`), Output (table + summary line), Empty-state, Implementation (`node scripts/check/node-procs.js $ARGUMENTS`).
- `R-7` — **`operational-loop.md` doc section.** New heading-level section "Background tasks and Windows process hygiene". Explains: `run_in_background` semantics (Bash tool), orphan risk when parent session exits without explicit cleanup, when to use `Monitor` vs `Bash run_in_background`, Windows-specific notes on child-tree cleanup.
- `R-8` — **`/sprint:execute.md` one-line warning.** Single sentence: do not use `run_in_background` in the Ralph test phase — orphans the child if the loop exits unexpectedly. Placed adjacent to the existing Ralph guidance.

## Non-Goals

- Switching formatters (biome, dprint, etc.).
- MCP server cleanup discipline (downstream concern).
- `mcp-remote` bridge management (Claude Desktop concern).
- Auto-killer Node-process watchdog (expanded variant — deferred).
- Refactoring all hooks to use a shared invocation library.
- Adding `/check:node-procs` to `/check:all` default set.
- Changing `format.js` from PostToolUse to PreToolUse.
- SessionEnd-batched formatting.
- MultiEdit matcher coverage in v1.

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| `scripts/hooks/format.js` | verified_from_repo |
| `scripts/hooks/lint-hook-output.js` (new) | verified_from_repo (absent) |
| `.claude/settings.json` | verified_from_repo |
| `.claude/commands/check/node-procs.md` (new) | verified_from_repo (absent) |
| `scripts/check/node-procs.js` (new) | verified_from_repo (absent) |
| `.claude/project/reference/operational-loop.md` | verified_from_repo |
| `.claude/commands/sprint/execute.md` | inferred_from_repo |

## External Service Dependencies

None.

## Approval Boundaries

Production deploy per CLAUDE.md §Autonomy. No Beta review required for this sprint per PC.

## Cross-sprint coordination

Sprint A (`SP-20260518-007`) is past `/sprint:design`. Both sprints touch `.claude/commands/sprint/execute.md`. Per PC `lane.isolation_notes`: serialize at execute-time — Sprint A's T-20260518-111 edits execute.md first; Sprint B's S-4.2 (R-8 warning line) lands AFTER T-111 is `done`. If both sprints reach execute in the same session, the second to write must rebase its edit on the first's content.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260518-0012.yaml`
- High-level stories: `high-level-stories.md`
- Granular stories: `granular-stories.md`
- Acceptance criteria: `acceptance-criteria.md`
- QA plan: `qa-plan.md`
- Red-team plan: skipped at scale=s
- Release plan: skipped at scale=s
