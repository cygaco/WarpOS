---
description: Refuse product-content leaks in canonical — scans for client slugs, maintainer abs paths, root-level _requirements/_docs/ (gated until scrub), and promote-relic reintroduction.
---

# /scan:framework-purity

The canonical-side last line of defense against accidentally leaking product-specific content into the public framework repo. Replaces the dropped `/scan:warpos-privacy-leak` skill (which was promote-side; the leak surface moved canonical-side after SP-20260522-001 retired the promote suite).

```bash
node scripts/checks/framework-purity.js --diff     # staged + unstaged change-set (manual default)
node scripts/checks/framework-purity.js --staged   # staged tree only — the commit gate (WI-23)
node scripts/checks/framework-purity.js --full     # full repo audit
node scripts/checks/framework-purity.js --json     # programmatic consumption
```

Detectors:

| Detector | What it catches |
|---|---|
| `root_leak` | Files under `_requirements/` or `_docs/` at canonical root (gated by `ROOT_LEAK_PENDING_SCRUB` while the maintainer scrub is in flight). |
| `client_slug` | `Jobzooka`, `DreamTeam`, `dreamteam`, `aiweb`, `companycam`, etc. in tracked file content. Allow-list covers historical sprint planning, dream journal, brief/clone outputs, release changelogs, ROADMAP, portfolio scripts. |
| `abs_path` | Maintainer-home absolute paths (`C:\Users\Vladislav\…`, `/home/<user>/Desktop/…`). |
| `promote_relic` | Reintroduction of any purged path (`promote.js`, `flag.js`, etc.) or token (`warposFlagLedger`, `/warp:promote`). |

Modes:
- `--diff` (default) — scans `git diff --cached` + `git diff` (staged + unstaged). The full change-set view for the manual skill.
- `--staged` — scans `git diff --cached` only. This is what the pre-commit guard (`scripts/hooks/framework-purity-guard.js`) runs: a commit only writes the staged tree, so the gate must judge what's actually being committed, not unrelated unstaged edits (WI-23).
- `--full` — walks the entire repo. Inventory mode for taking stock of pre-scrub debt.

Exit codes: `0` clean · `1` violations · `2` CLI/git error.
