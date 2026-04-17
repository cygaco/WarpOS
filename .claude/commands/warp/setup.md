---
description: Set up WarpOS end-to-end — clone, install, merge CLAUDE.md, restart, verify, first tour
user-invocable: true
---

# /warp:setup — Full WarpOS Setup

The one-command onboarding. This is the entry point for new users. Handles every step from "git clone" to "system healthy and ready to use" without the user needing to know what any of the underlying pieces are.

Formerly `/warp:init`. Renamed because it does the *whole setup*, not just the init step.

## Procedure

### Step 1 — Already installed?

Look for `.claude/manifest.json` in the project root.

If it exists and has `warpos.installed: true`:
- Report "WarpOS is already installed in this project — install metadata found in `.claude/manifest.json`."
- Offer three next actions:
  - `/warp:health` — verify current install
  - `/warp:uninstall` — remove WarpOS completely (with backup) and start clean
  - `/warp:sync` — pull latest WarpOS updates from GitHub
- Stop.

### Step 2 — Find or clone WarpOS

Ask the user (unless invoked with `--source <url>`):
- "Which WarpOS repo should I use?" (default: `https://github.com/cygaco/WarpOS.git`; forks are OK; private forks require a GitHub PAT or deploy key)

Check if the repo exists nearby:
1. Look for `../WarpOS/` relative to the project root
2. If found: offer two options — "use this one" or "re-clone from GitHub for a fresh copy"
3. If not found: clone it → `git clone <source-url> ../WarpOS`
4. If clone fails (403/404/auth): the repo may be private. Tell the user: "This WarpOS repo is private. You need either (a) a GitHub account added as a collaborator, or (b) a Personal Access Token with `repo` scope set in `git credential` helper, or (c) a deploy key on this machine. Request access from the repo owner."

### Step 3 — Back up existing config

Before the installer runs, if the target has pre-existing content that the installer would touch, back it up to `.warpos-backup/<timestamp>/`:
- `CLAUDE.md` (if exists) → copy to backup
- `.claude/` (if exists and non-empty) → copy entire tree
- `.gitignore` (if exists) → copy
- `scripts/hooks/` (if exists) → copy
- `AGENTS.md` (if exists) → copy

Report: "Backed up existing config to `.warpos-backup/<timestamp>/`. `/warp:uninstall` will restore from this if you decide to remove WarpOS later."

### Step 4 — Run the installer

```bash
node ../WarpOS/scripts/warp-setup.js . --interactive
```

Interactive mode enables the 5-question interview:
1. Project name (default: current dir basename)
2. One-line pitch (blank OK for now; fills PROJECT.md later)
3. Primary user (who uses this product?)
4. Main branch (auto-detected via `git symbolic-ref`)
5. ANTHROPIC_API_KEY location (for smart-context Haiku enrichment)

Pass `--yes` instead to accept all defaults (fully non-interactive — useful in CI).

The installer will report what it does per step. Watch for:
- `✓ Created manifest.json for "<name>"` — base install succeeded
- `✓ Seeded systems.jsonl with 16 canonical tiers` — systems layer ready
- `✓ Appended runtime block to .gitignore` — privacy protection active
- `! CLAUDE.md already exists — kept yours` — user's CLAUDE.md preserved (we handle this in Step 5)

### Step 5 — Merge Alex into CLAUDE.md

**This is the step the installer cannot do alone.** The installer won't overwrite CLAUDE.md because your existing content matters. But WarpOS needs the Alex α identity block for `/mode:*`, agent dispatch, autonomy rules, and β consultation to work.

Check if the user already has `CLAUDE.md` at the project root.

**If CLAUDE.md does NOT exist:**
Copy `../WarpOS/CLAUDE.md` → `./CLAUDE.md`. Tell the user: "Alex identity installed."

**If CLAUDE.md EXISTS with content:**
Show the user a summary of both files (their existing CLAUDE.md and the Alex framework CLAUDE.md from WarpOS) and ask which approach they want:

- **(A) Append** — add the Alex framework section below their existing content with a horizontal rule between them. Lowest risk, reversible. Recommended default.
- **(B) Replace** — overwrite their CLAUDE.md entirely with the Alex one. Suggest this only if their existing CLAUDE.md is trivial (empty, Claude Code default, or under 20 lines).
- **(C) Interactive merge** — walk through each section of the Alex CLAUDE.md (Identity, Autonomy, Reasoning, Memory, etc.) and ask user if they want it appended. Use this for users with substantial existing CLAUDE.md content who want selectivity.

After the merge, tell them: "Alex identity is now active in CLAUDE.md. Your original content is preserved in `.warpos-backup/<timestamp>/CLAUDE.md` if you ever want to revert."

### Step 6 — Install provider CLIs (recommended)

WarpOS routes review-layer agents through **OpenAI (Codex CLI)** and security through **Gemini CLI** for model diversity — same-model review is blind to shared failure modes. Without these CLIs, agents fall back to Claude (still works, just loses the diversity benefit).

Show the user this block and walk them through it:

```
┌─────────────────────────────────────────────────────────────┐
│  Provider CLIs — install these for full model diversity    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OpenAI Codex  (for evaluator, compliance, qa, auditor)    │
│    npm i -g @openai/codex                                   │
│    codex login                                              │
│    # or: export OPENAI_API_KEY=sk-...                       │
│                                                             │
│  Gemini CLI    (for redteam / security)                    │
│    npm i -g @google/gemini-cli                              │
│    gemini auth login                                        │
│    # or: export GEMINI_API_KEY=...                          │
│                                                             │
│  Skip either → agents fall back to Claude automatically.   │
│  Verify: /check:environment                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 7 — Restart Claude Code

**Critical.** The installer added hook entries to `.claude/settings.json`, but Claude Code only reads `settings.json` on launch. **The hooks are registered but not active in the currently-open session.**

Tell the user, verbatim:

> Your install is almost done. Close this Claude Code window (or the whole terminal) and open a fresh one in this project. Your next prompt will trigger all the new hooks. Keep this terminal's history handy — you may want to reference what we just did.
>
> Before you close this one, let me write a `WARPOS_NEXT_STEPS.md` at the project root so you have the rest of the setup in front of you after you restart.

### Step 8 — Write next-steps file

Write `WARPOS_NEXT_STEPS.md` at the project root with the following content:

```markdown
# WarpOS — Next Steps After Setup

WarpOS was just installed on this project. Here's what to do in the fresh Claude Code session:

## Verify the install

```
/warp:health            # overall status — expect mostly green
/check:environment      # provider CLIs + auth detection
/check:system           # manifest vs disk, expect 0 drift
/discover:systems       # 6-angle inventory — expect Solid ~10
```

## Generate your project maps

```
/maps:all               # architecture, hooks, memory, skills, systems, tools
```

## Get the tour

```
/warp:tour              # guided walkthrough of every WarpOS subsystem
```

## Start using it

- Type `/mode:solo` to stay solo for your first hour
- Try `/fix:fast "any error message"` for a quick fix
- Try "Help me write a product brief for this project" — Alex will guide you through `requirements/`

## Read

- `USER_GUIDE.md` in the WarpOS repo (at `../WarpOS/USER_GUIDE.md`) — the workflow docs
- `CLAUDE.md` at the root of this project — Alex identity
- `AGENTS.md` — agent system reference

## If anything fails

- Run `/warp:uninstall` to remove WarpOS cleanly (reverts CLAUDE.md, settings, deletes .claude/)
- File an issue at https://github.com/cygaco/WarpOS/issues

---

Written by `/warp:setup` on <current ISO date>.
This file is safe to delete after your first successful session.
```

### Step 9 — Confirm completion

Tell the user:

> Setup complete. Summary:
> - ✓ WarpOS cloned to `../WarpOS/`
> - ✓ Framework files installed in `.claude/` + `scripts/hooks/`
> - ✓ `manifest.json`, `paths.json`, `store.json`, `systems.jsonl` created
> - ✓ Hooks registered in `.claude/settings.json` (will fire on next launch)
> - ✓ CLAUDE.md has Alex identity (merge strategy: <A/B/C>)
> - ✓ `.gitignore` runtime block added
> - ✓ `WARPOS_NEXT_STEPS.md` written — read it in your next session
> - ⚠ Provider CLIs: <codex status> / <gemini status>
>
> **Close this Claude Code session and open a fresh one in this project to activate the hooks.** Then follow `WARPOS_NEXT_STEPS.md`.

## Flags

- `--source <url>` — use a custom WarpOS repo instead of `cygaco/WarpOS`
- `--yes` — skip interactive prompts (use detection defaults)
- `--skip-backup` — don't back up existing CLAUDE.md / .claude / .gitignore (advanced; use only in CI)
- `--merge-strategy <append|replace|interactive>` — pre-choose how to handle existing CLAUDE.md

## Related

- `/warp:uninstall` — cleanly removes WarpOS, restores from backup
- `/warp:sync` — pull latest WarpOS updates from GitHub (non-destructive)
- `/warp:health` — post-install verification
- `/warp:tour` — guided subsystem walkthrough
