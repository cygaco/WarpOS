# Runtime & Logs Hygiene Audit — WarpOS

Read-only inventory, 2026-07-16. Nothing deleted or modified. All figures from `du`, `wc -l`, `git ls-files`, `git check-ignore`, `git worktree list`.

## TL;DR

| Zone | Size | Files | Tracked? |
|------|------|-------|----------|
| `.claude/project/events/events.jsonl` (single file) | **18M** | 56,517 lines | gitignored (local) |
| `runtime/` (top-level) | 11M | 784 | 164 tracked, rest gitignored |
| `.claude/runtime/` | 4.4M | 445 | **fully gitignored** (0 tracked) |
| memory stores (learnings/traces/beta) | ~0.28M | — | gitignored |

**Top-3 offenders overall:** (1) `events.jsonl` 18M / 56.5k lines, unbounded — no rotation exists; (2) `.claude/runtime/handoffs/` 1.1M / 101 files + 56 loose `handoff-live-*.md` at `.claude/runtime/` root; (3) `runtime/research/` 1.9M (gitignored) and `.claude/runtime/team-guard-debug.log` 276K / 1990 lines.

**Prunable worktrees:** 2 — both confirmed merged-safe by lead.
**Tracked-transient drift:** 0 active (see note below); 164 committed per-run artifacts are *soft* drift only.

---

## 1. `runtime/` (top-level) — 11M, 784 files

Age span: 2026-05-29 → 2026-07-16. Biggest subdirs:

| Dir | Size | Ignored? | Note |
|-----|------|----------|------|
| `research/` | 1.9M | ignored (l.110) | deep-research reports, per-topic — regenerable |
| `sp001-gauntlet/` | 1.3M | ignored (l.179) | old sprint gauntlet scratch |
| `epsilon-prompts/` | 836K | 17 tracked | dispatch prompt archive |
| `sp002-roadmap-gui/` | 741K | ignored | incl. 2 PNG screenshots ~150K each |
| `notes/` | 725K | partly tracked (31 files) | mixed: some are durable specs, some scratch |
| `agent-system-plan/` | 554K | 22 tracked | **KEEP** — holds `tooltest/` scan:tools fixture |
| `s-pf-03-security-review.err.log` | 525K | ignored (l.166 `s-pf-*`) | single stray err log |
| `warpos-v1-discovery/` | 196K | 21 tracked | KEEP — v1-rebuild seed corpus (cited) |

Biggest single files: `s-pf-03-security-review.err.log` 525K, `research/_preserved-from-worktree/BUNDLE-for-gpt-pro-review.md` 416K, several `research/**/openai-report.md` 186–285K, 2 roadmap-gui PNGs ~150K.

## 2. `.claude/runtime/` — 4.4M, 445 files, FULLY gitignored (l.23)

Purely local transient; nothing here is tracked, so deletions need no commit.

| Item | Size | Files | Note |
|------|------|-------|------|
| `handoffs/` | 1.1M | 101 | span 2026-05-28 → 07-16, accretes per session |
| `epsilon-prompts/` | 443K | 118 | dispatch prompt copies (dup of runtime/epsilon-prompts 17) |
| `dispatch-completions.jsonl` | 320K | 494 lines | dispatch ledger, unbounded |
| `team-guard-debug.log` | 276K | 1990 lines | DEBUG log — should never grow unbounded |
| `logs/` | 184K | — | `s-q7gbsn/smart-context.log` 160K |
| loose `handoff-live-*.md` at root | ~200K | **56 files** | one per live-handoff, never pruned |
| `dispatch-deaths.jsonl` | 12K | 27 lines | small |
| `dispatch-locks/`, `dispatch/`, `diagnostics/` | <40K | — | ephemeral |
| `settings-pre-turbo.json` | 16K | 1 | turbo backup snapshot |

## 3. Log / event stores (resolved via paths.json)

All gitignored. `scripts/hooks/lib/logger.js` has **NO rotation/cap logic** — every store appends forever.

| Key | Path | Lines | Size | Verdict |
|-----|------|-------|------|---------|
| eventsFile | `.claude/project/events/events.jsonl` | 56,517 | **18M** | needs a cap — 7 weeks unbounded |
| learningsFile | `.claude/project/memory/learnings.jsonl` | 126 | 108K | KEEP (semantic memory) |
| tracesFile | `.claude/project/memory/traces.jsonl` | 10 | 20K | fine |
| betaEvents | `.claude/agents/president/_system/beta/events.jsonl` | 127 | 152K | fine, watch growth |
| (dispatch) | `.claude/runtime/dispatch-completions.jsonl` | 494 | 320K | cap candidate |
| (debug) | `.claude/runtime/team-guard-debug.log` | 1990 | 276K | cap candidate |

## 4. Root / tracked stray artifacts

- `CODEX-LOG.md` (91K, gitignored l.155) — **KEEP-GITIGNORED** (cited evidence, β 2026-07-16).
- `WarpOS-v1/` (125K, gitignored l.156) — **KEEP-GITIGNORED** (v1-rebuild, β 2026-07-16).
- `DUMP.md` (8.5K, gitignored l.43) — regenerable session handoff; leave.
- transcripts / decision_records — none found loose at root.

## 5. Worktrees (`git worktree list`)

| Worktree | Head | Status |
|----------|------|--------|
| `WarpOS` (main checkout) | c3dab137 session/2026-07-17 | active — leave |
| `WarpOS-wt/SP-20260716-001-dispatch` | 5c696d72 | **PRUNE** — merged (lead-confirmed) |
| `WarpOS-wt-auth-SP20260716-002` | 58909278 | **PRUNE** — merged (lead-confirmed) |

## 6. Tracked-transient check (`git ls-files` ∩ `git check-ignore`)

- 164 files are git-**tracked** under `runtime/` (none under `.claude/runtime/`, which is fully ignored).
- **0** of them are currently ignored. Important semantic: `git check-ignore` never reports an already-tracked path as ignored, so a `runtime/notes/`-style rule only blocks NEW files — the 31 already-committed `notes/` files are not "silently re-added" drift.
- Net: **no active tracked-transient drift**. The 164 are deliberately-committed per-run artifacts (sprint scratch, gauntlet diffs, dispatch prompts). Removing them is a considered `git rm --cached` decision, NOT safe-now hygiene — several are load-bearing fixtures (`diagnostic/tt/*`, `agent-system-plan/tooltest/*` for scan:tools; `models-research/*`, `warpos-v1-discovery/*` cited in .gitignore comments l.152).

---

## PROPOSAL

### (a) Safe-now mechanical (exact commands)

Worktree prune (both lead-confirmed merged):
```
git worktree remove C:/Users/Vlad/Desktop/Claude/Projects/WarpOS-wt/SP-20260716-001-dispatch
git worktree remove C:/Users/Vlad/Desktop/Claude/Projects/WarpOS-wt-auth-SP20260716-002
git worktree prune
git branch -d sprint/SP-20260716-001-dispatch sprint/SP-20260716-002-auth   # -d = merged-only, refuses if not merged
```

Local transient sweep (`.claude/runtime/` is fully gitignored — no commit, fully regenerable):
```
# 56 loose live-handoff snapshots + stale session handoffs (keep last ~10 by mtime)
ls -t .claude/runtime/handoff-live-*.md | tail -n +11 | xargs rm -f
find .claude/runtime/handoffs -type f -mtime +14 -delete
# debug log — truncate, don't delete (keeps the sink):
: > .claude/runtime/team-guard-debug.log
# stale smart-context logs
find .claude/runtime/logs -type f -mtime +14 -delete
```

Stray err log at runtime root (gitignored, 525K, single file):
```
rm -f runtime/s-pf-03-security-review.err.log
```
(all above are read-safe: gitignored + regenerable. Do a dry-run `ls`/`find … -print` first.)

### (b) Retention policy worth building (small — no new framework)

1. **Rotate `logger.js` sinks at write-time.** Add a cap in `scripts/hooks/lib/logger.js`: when a `.jsonl` sink exceeds e.g. 20k lines, rename to `<name>.1` (keep 1 gen) and start fresh. Covers events / dispatch-completions / beta. One helper, wired where the append happens. Enforcer: a `scan:full` line-count check that reds if any sink > 2× cap (log as enforcement-debt until built).
2. **Cap `team-guard-debug.log`** the same way (or gate it behind a DEBUG flag so it's off by default).
3. **Handoff retention:** keep last N `handoff-live-*` + `handoffs/*`, prune older on SessionStart (there's already a session-start hook to host it).

### (c) Leave-alone list

- `CODEX-LOG.md`, `WarpOS-v1/` — KEEP-GITIGNORED (β 2026-07-16).
- `learnings.jsonl`, `traces.jsonl`, `beta/events.jsonl` — semantic memory.
- Fixtures: `runtime/diagnostic/tt/*`, `runtime/agent-system-plan/tooltest/*` (scan:tools self-test), `runtime/models-research/*`, `runtime/warpos-v1-discovery/*`, `runtime/etc/*/.gitkeep`.
- The 164 tracked committed-transients — defer to a separate deliberate `git rm --cached` decision; not hygiene-safe-now.
