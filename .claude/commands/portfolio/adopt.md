---
description: Move an existing product brief into a new sibling repo and register it in the portfolio.
user-invocable: true
---

# /portfolio:adopt — Adopt a brief into a product repo

Promotes an existing brief (`_docs/briefs/<slug>/` or `_docs/clones/<slug>/`) into a full sibling product repo. This is a thin wrapper around `/portfolio:new --from-brief`.

## Usage

```
/portfolio:adopt <slug>
```

- `<slug>` — must match an existing brief at `paths.briefsRoot/<slug>/` or `paths.clonesRoot/<slug>/`.

## What it does

1. Validates slug (IN-1 regex + reserved-name guard).
2. Locates the brief at `_docs/briefs/<slug>/` or `_docs/clones/<slug>/` (tries both, exits 2 if neither found).
3. Runs `/portfolio:new <slug>` to scaffold the sibling repo, run `/warp:setup`, register, and create the GitHub repo.
4. Moves (not copies) all files from the brief directory into the new repo's working tree.
5. Emits `portfolio_adopt` trace event (TR-8) with `files_moved_count > 0`.

## Output

```
adopted: <slug>
  source brief: <_docs/briefs/<slug>/ or _docs/clones/<slug>/>
  target repo:  <path>
  files moved: <n>
  registered in ~/.warpos/portfolio.json
Next: cd <path> && gh repo create <slug> --private --source=. --remote=origin --push
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 2 | Brief not found, empty brief, or bad slug |
| 4 | Filesystem error during move or setup |

## Procedure

Run: `node scripts/portfolio/adopt.js <slug>`

## Related

- `/portfolio:new` — scaffold without a brief
- `/portfolio:list` — see all registered products
