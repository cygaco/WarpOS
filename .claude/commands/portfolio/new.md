---
description: Scaffold a new private product repo as a sibling to WarpOS, run /warp:setup, register it, and create a private GitHub repo.
user-invocable: true
---

# /portfolio:new — Scaffold a new product

Creates a fresh private product repo as a sibling directory to WarpOS on disk, installs the WarpOS framework inside it, registers it in `~/.warpos/portfolio.json`, and creates a private GitHub repo via `gh repo create`.

## Usage

```
/portfolio:new <slug> [--from-brief <existing-slug>]
```

- `<slug>` — lowercase, hyphenated, 1–64 chars (`^[a-z0-9][a-z0-9-]{0,63}$`).
- `--from-brief <slug>` — also move brief files from `_docs/briefs/<slug>/` or `_docs/clones/<slug>/` into the new repo (runs `/portfolio:adopt` after scaffolding).

## What it does

1. Validates slug (IN-1 regex + reserved-name guard — exits 2 before any filesystem ops).
2. Resolves sibling path: `path.resolve(<warposRoot>, '..', <slug>)`.
3. Creates the directory, runs `git init`, copies scaffold templates from `framework/templates/portfolio/`.
4. Runs `/warp:setup` inside the new directory.
5. Registers the slug via `scripts/portfolio/register.js`.
6. Pre-checks GitHub: `gh repo view <slug>` — if private+owned, reuses (C-9b); if public or foreign-owned, halts (C-9c); if auth fails, surfaces C-9a and leaves local intact.
7. Executes `gh repo create <slug> --private --source=. --remote=origin --push` (DEC-008 — always private).
8. If `--from-brief` given, runs `/portfolio:adopt <slug>` to move brief files.
9. Emits `portfolio_new` trace event (TR-7).

## Output

```
scaffolding <slug> at <path>... running /warp:setup... done.
creating private GitHub repo: <slug> (--private --source=. --remote=origin --push)...
  ✓ remote created: https://github.com/<gh_owner>/<slug> (private)
  ✓ initial commit pushed
  ✓ origin set, branch <main> tracked
Next: invite collaborators with `gh repo edit <slug> --add-collaborator <username>`.
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 2 | Validation failure (bad slug, reserved name, gh collision, auth error) |
| 4 | Filesystem error (path not writable, warp:setup failed) |

## Procedure

Run: `node scripts/portfolio/new.js <slug> [--from-brief <brief-slug>]`

## Related

- `/portfolio:adopt` — move an existing brief into a new sibling repo
- `/portfolio:list` — see all registered products
- `/portfolio:register` — register an already-existing dir without scaffolding
