---
description: Scaffold a new product repo (sibling to WarpOS) with the framework installed and committed, then register it — local-only by default. Open it in its own session and create the GitHub remote yourself, or pass --github to also create+push a private repo.
user-invocable: true
---

# /portfolio:new — Scaffold a new product

Creates a fresh product repo as a sibling directory to WarpOS on disk, installs the WarpOS framework inside it, commits the scaffold, and registers it in `~/.warpos/portfolio.json`. **Local-only by default** — no GitHub remote is created. You open the product in its own session and create/push the remote when you want.

> **Why local-only is the default.** You work in each product's *own* session, not *through* WarpOS. And the agent is gated from pushing to a brand-new remote in auto mode (the harness flags an agent push to a new repo as data-exfiltration — operator approval relayed in chat does not clear it). Keeping the default local means new-product creation runs entirely within agent autonomy; creating the remote is a one-line operator step, when you're ready.

## Usage

```
/portfolio:new <slug> [--from-brief <existing-slug>] [--github]
```

- `<slug>` — lowercase, hyphenated, 1–64 chars (`^[a-z0-9][a-z0-9-]{0,63}$`).
- `--from-brief <slug>` — move brief files from `_docs/briefs/<slug>/` or `_docs/clones/<slug>/` into the new repo (folds in the former adopt step via the adopt engine); they're committed with the scaffold.
- `--github` — **opt-in.** Also create a private GitHub repo (`gh repo create … --private --push`, DEC-008) and push. Operator-run only (prefix the command with `!`, or be in a permissive permission mode) — the agent is blocked from this in plain auto mode.

## What it does

1. Validates slug (IN-1 regex + reserved-name guard — exits 2 before any filesystem ops).
2. Resolves sibling path: `path.resolve(<warposRoot>, '..', <slug>)`.
3. Creates the directory, runs `git init`, copies scaffold templates from `framework/templates/portfolio/`, makes an initial commit.
4. Runs `/warp:setup` inside the new directory.
5. Registers the slug via `scripts/portfolio/register.js`.
6. If `--from-brief` given, moves the brief files in (the folded-in adopt step).
7. Commits the full scaffold (warp install + brief) so the repo opens clean and ready.
8. **Default:** prints local-only next-steps (open it manually + how to create a remote). **With `--github`:** pre-checks `gh repo view`, then `gh repo create <slug> --private --source=. --remote=origin --push`, and persists `github_url` to the registry.
9. Emits `portfolio_new` trace event (TR-7), recording the `github` flag.

## Output (default — local-only)

```
scaffolding <slug> at <path>... running /warp:setup... done.

Local repo ready — WarpOS installed, committed, no remote:
  <path>
Next — open it in its own session and work there:
  /portfolio:open <slug> --spawn
Create a private GitHub remote when you want one (run from inside the repo):
  gh repo create <slug> --private --source=. --remote=origin --push
```

With `--github`, additionally creates + pushes the private remote and prints the `✓ remote created / initial commit pushed / origin tracked` lines.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 2 | Validation failure (bad slug, reserved name) |
| 4 | Filesystem error (path not writable, warp:setup failed) |

## Procedure

Run: `node scripts/portfolio/new.js <slug> [--from-brief <brief-slug>] [--github]`

## Related

- `/portfolio:open` — open a product in its own session (`--spawn` for a new window)
- `/portfolio:list` — see all registered products
- `/portfolio:register` — register an already-existing dir without scaffolding
