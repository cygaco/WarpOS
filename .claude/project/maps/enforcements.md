# Enforcements Map — 2026-04-18

Machine-readable data: `.claude/project/maps/enforcements.jsonl`

**33 hooks** (31 registered + 2 off-registry) + **7 lib modules** | **84 gaps** total: **73 closed (87%)**, **11 open (13%)**

Coverage: **partial** — several CLAUDE.md rules remain manual-only (see open gaps below).

---

## Gap Summary

### Closed Gaps (73) by Category

| Category | Gaps | Closed By |
|----------|------|-----------|
| Bash bypass | GAP-101 to GAP-109, GAP-1102 | merge-guard (10) |
| Store manipulation | GAP-201 to GAP-210, GAP-401, GAP-601, GAP-606, GAP-1004 | store-validator (14) |
| Dispatch ordering | GAP-301 to GAP-303, GAP-701, GAP-904 | gauntlet-gate (5) |
| Prompt/context | GAP-501 to GAP-506, GAP-1101 | prompt-validator (7) |
| State visibility | GAP-801 to GAP-805, GAP-903, GAP-1002 | cycle-enforcer (7) |
| Ownership | GAP-705 | ownership-guard (1) |
| Infrastructure | GAP-1005 | worktree-preflight (1) |
| Team composition | GAP-1307, GAP-1308 | team-guard (2) |
| Memory integrity | GAP-1401, GAP-1402 | memory-guard (2) |
| Learning lifecycle (partial) | GAP-1201 | learning-validator (1, advisory) |
| Beta consultation | GAP-1302 | beta-gate (1, mode-aware) |
| Tool result integrity | GAP-401 | session-tracker (1) |

### Open Gaps (11)

| Gap | Rule | Severity | Category |
|-----|------|----------|----------|
| GAP-305 | Evaluator golden fixture verification | Medium | Dispatch |
| GAP-706 | Shared files not enforced in store.sharedFiles | Low | Completeness |
| GAP-901 | No retro doc creation check after runs | Medium | Process |
| GAP-1103 | Reviewer prompt scope validation | Low | Documentation |
| GAP-1201 | Learning lifecycle advisory-only (not fail-closed) | Low | Learning |
| GAP-1204 | Learning count 60-100 range check | Low | Learning |
| GAP-1301 | Backup branch protection (no hook) | Medium | CLAUDE.md s10 |
| GAP-1302 | API spend >= $5 tracking automation | Low | CLAUDE.md s4 |
| GAP-1304 | Auto-learning on corrections/surprises | Low | CLAUDE.md s5 |
| GAP-1305 | Pre-commit build validation | Medium | CLAUDE.md s9 |
| GAP-1306 | Learning conditions field schema validation | Low | CLAUDE.md s5 |

---

## Enforcement by Hook

### Fail-Closed Guards (15)

| Hook | Matcher | Gate | Key Blocks |
|------|---------|------|------------|
| merge-guard | Bash | merge-gate | Destructive git, force push (incl. plus-refspec), rm src/ |
| memory-guard | Bash + Edit\|Write | memory-gate | Direct writes to events.jsonl / learnings.jsonl / systems.jsonl / traces.jsonl |
| secret-guard | Edit\|Write | security-gate | API keys, tokens, passwords |
| foundation-guard | Edit\|Write | foundation-gate | 14 foundation files |
| ownership-guard | Edit\|Write | ownership-gate | Cross-feature edits |
| store-validator | Edit\|Write | store-gate | Illegal transitions, GATE_CHECK immutability |
| team-guard | Agent | team-gate | Unauthorized agent spawns, team composition (adhoc) |
| worktree-preflight | Agent | infra-gate | Missing smoke test |
| gate-check | Agent | dependency-gate | Upstream deps not passing |
| gauntlet-gate | Agent | phase-gate | Missing GATE_CHECK reviewers |
| cycle-enforcer | Agent | cycle-gate | Out-of-order cycle steps |
| prompt-validator | Agent | prompt-gate | Builder missing feature/HYGIENE/bugs (mixed) |
| beta-gate | AskUserQuestion | beta-gate | AskUserQuestion without ESCALATE in adhoc mode |
| boss-boundary | Read\|Grep\|Glob | role-gate | Boss reading src/ |
| excalidraw-guard | Excalidraw MCP | tool-gate | All diagram tools |
| create-worktree-from-head | WorktreeCreate | worktree-gate | Worktrees from divergent base |
| framework-manifest-guard | Bash (git commit) | manifest-gate | Commits that change tracked files without staging manifest **[not yet wired in settings.json]** |

### Advisory Hooks (16)

| Hook | Matcher | Purpose |
|------|---------|---------|
| path-guard | Edit\|Write | Stale path warnings (strict mode blocks) |
| typecheck | Edit\|Write | tsc --noEmit (blocks type errors only) |
| session-tracker | Universal | Log all tool calls, hash agent results |
| edit-watcher | Edit\|Write | Event log, STALE marking, drift detection |
| format | Edit\|Write | Prettier auto-format (10s timeout) |
| lint | Edit\|Write | ESLint advisory (15s timeout) |
| systems-sync | Edit\|Write | Map staleness, broadcast, manifest |
| save-session-lint | Edit\|Write | saveSession pattern warning |
| learning-validator | Edit\|Write | Learning lifecycle + systems schema warnings |
| ui-lint | Edit\|Write | Design-system violation warnings on .tsx |
| smart-context | UserPromptSubmit | Haiku prompt expansion + memory selection |
| prompt-logger | UserPromptSubmit | Log prompts to events |
| compact-saver | PostCompact | Save compaction summary |
| session-start | SessionStart | Init session, banner, topology |
| session-stop | Stop / SessionEnd / StopFailure | Generate handoff |
| ref-checker | CLI (manual) | Broken refs / orphans / stale SPEC_GRAPH **[not wired as hook]** |

---

## CLAUDE.md Rules vs Enforcement

| Rule | Ref | Status |
|------|-----|--------|
| Session start: read systems.jsonl | s3 | Enforced (session-start) |
| After self-mods: update systems | s3 | Enforced (systems-sync) |
| API keys server-side only | s7/s10 | Partial (secret-guard) |
| npm run build must pass | s9 | Partial (typecheck; GAP-1305 for full pre-commit build) |
| Never push without asking | s4 | Partial (force blocked; regular push still manual) |
| Never kill backup branch | s10 | Open (GAP-1301) |
| Don't ask user (defer to β) | s4 | Enforced (beta-gate) |
| Team composition fixed | s4 | Enforced (team-guard) |
| Use paths.X not literals | Paths | Enforced (path-guard, advisory) |
| Memory files append-only | Memory | Enforced (memory-guard) |
| Learning count 60-100 | s5 | Open (GAP-1204) |
| Learning lifecycle gates | s5 | Partial (learning-validator, advisory only) |
| Store conditions not outcomes | s5 | Open (GAP-1306) |
| API spend >= $5 ask first | s4 | Partial (beta-gate escape keyword; GAP-1302 for tracking) |
| Framework manifest stays current | WarpOS | Partial (framework-manifest-guard built but not wired) |

---

## Lifecycle Event Coverage

| Event | Hooks |
|-------|-------|
| SessionStart | session-start |
| UserPromptSubmit | smart-context → prompt-logger |
| PreToolUse (Bash) | merge-guard → memory-guard |
| PreToolUse (Edit\|Write) | secret-guard → foundation-guard → ownership-guard → memory-guard → store-validator → path-guard |
| PreToolUse (Agent) | team-guard → worktree-preflight → gate-check → gauntlet-gate → cycle-enforcer → prompt-validator |
| PreToolUse (Read\|Grep\|Glob) | boss-boundary |
| PreToolUse (Excalidraw) | excalidraw-guard |
| PreToolUse (AskUserQuestion) | beta-gate |
| PostToolUse (universal) | session-tracker |
| PostToolUse (Bash) | merge-guard |
| PostToolUse (Edit\|Write) | edit-watcher → format → lint → typecheck → systems-sync → save-session-lint → store-validator → memory-guard → learning-validator → ui-lint |
| PostCompact | compact-saver |
| Stop / SessionEnd / StopFailure | session-stop |
| WorktreeCreate | create-worktree-from-head |

---

## Defense-in-Depth: store.json

```
PRE:  secret-guard -> foundation-guard -> ownership-guard -> memory-guard -> store-validator (cache + lock) -> path-guard
POST: edit-watcher -> format -> lint -> typecheck -> systems-sync -> save-session-lint -> store-validator (validate + release lock) -> memory-guard -> learning-validator -> ui-lint
```

Store-validator uses a 2-phase protocol: PRE caches state and acquires lock, POST validates transitions against cache and releases lock. GATE_CHECK immutability enforced via SHA256 hashing (gate-schema.js).

---

## Off-Registry Hooks

Two hooks exist on disk but are **not** wired into `.claude/settings.json`:

- **framework-manifest-guard.js** (2026-04-18) — designed as PreToolUse Bash hook for `git commit`. Built but not yet registered. Pending verification before wiring.
- **ref-checker.js** — intentionally invoked as a CLI (`node scripts/hooks/ref-checker.js [--summary|--fix]`), used by `/check:references` skill; not a lifecycle hook.
