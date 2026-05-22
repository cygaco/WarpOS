# COPY — Portfolio Console + /portfolio:* Unification

**Sprint:** `SP-20260521-001`

> `C-N` ids enforced by `requirement-format-guard.js`. Verbatim user-visible text.

## C-1 — paths.json new-key write log
`paths.json: added portfolioRegistry, portfolioHome, briefsRoot, clonesRoot.`

## C-2 — Registry initialized banner (first run)
`portfolio registry created at ~/.warpos/portfolio.json (0 products).`

## C-3 — `/portfolio:list` empty state
`No products registered yet. Use /portfolio:register <slug> <path> [<github-url>] to add one, or /portfolio:new <slug> to scaffold a fresh private repo.`

## C-4 — `/portfolio:list` header row
`SLUG               PATH                                                       WARP    LAST COMMIT       DIRTY   SPRINT`

## C-5 — `/portfolio:register` success
`registered: <slug> → <path> (github_url: <url> | none)`

## C-6 — `/portfolio:open --spawn` active-CWD warning (Beta DEC-006 addendum)
`⚠  <slug>'s repo is your current working directory. Opening a new Claude session here would duplicate the one you're already in. Pass --force to spawn anyway, or just keep working in this terminal.`

## C-7 — `/portfolio:open --spawn` PATH-fallback (Beta DEC-006 addendum)
`No supported terminal binary found on PATH (looked for: wt, iTerm, Terminal.app, gnome-terminal, xterm). Copy/paste this to open <slug> manually:`
`  cd <path> && claude`

## C-8 — `/portfolio:new` scaffolding step
`scaffolding <slug> at <path>... running /warp:setup... done.`

## C-9 — `/portfolio:new` gh repo create execution log (REVISED per DEC-008 — NOW EXECUTED)
`creating private GitHub repo: <slug> (--private --source=. --remote=origin --push)...`
`  ✓ remote created: https://github.com/<gh_owner>/<slug> (private)`
`  ✓ initial commit pushed`
`  ✓ origin set, branch <main> tracked`
`Next: invite collaborators with `gh repo edit <slug> --add-collaborator <username>`.`

## C-9a — `/portfolio:new` gh authentication failure
`⚠  gh CLI not authenticated. Local repo at <path> is intact and registered. Run `gh auth login` then `gh repo create <slug> --private --source=. --remote=origin --push` to finish.`

## C-9b — `/portfolio:new` slug already on GitHub (private + owned by user)
`note: cygaco/<slug> already exists on GitHub (private). Reusing it as origin remote. Pushing local commits...`

## C-9c — `/portfolio:new` slug already on GitHub (public OR foreign-owned)
`⚠  cannot reuse name: github.com/<owner>/<slug> exists and is <public|owned by <other_user>>. Choose a different slug or run `gh repo delete <owner>/<slug>` first if you own it. Local repo at <path> remains intact and registered.`

## C-10 — `/portfolio:adopt` migration summary
`adopted: <slug>`
`  source brief: <_docs/briefs/<slug>/ or _docs/clones/<slug>/>`
`  target repo:  <path>`
`  files moved: <n>`
`  registered in ~/.warpos/portfolio.json`
`Next: cd <path> && gh repo create <slug> --private --source=. --remote=origin --push`

## C-11 — `/portfolio:status` table format
```
SLUG          WARP    LAST COMMIT          DIRTY   SPRINT           REMOTE
dreamteams    0.8.2   a1b2c3d 2 days ago   0       SP-20260530-001  ✓ github
companycam    0.8.1   ----   never         0       (none)           ⚠ no remote
```

## C-12 — `/portfolio:dispatch` running banner
`dispatching /<skill> against <slug> (<repo_path>)...`

## C-13 — `/portfolio:sync` per-product line
`syncing <slug>... <result> (warpos <from> → <to>)`

## C-14 — Deprecation banner for `/product:*` aliases (one-time-per-session)
`⚠  /product:<name> is deprecated. Use /portfolio:<name> instead. Aliases will be removed in v0.10. (This banner is shown once per session.)`

## C-15 — Gitignore migration note
`Note: _docs/briefs/ and _docs/clones/ are now gitignored in canonical WarpOS. Any briefs/clones you create in canonical stay local-only. Use /portfolio:adopt <slug> to migrate them into a private sibling repo when you commit to building.`

## C-16 — Generic `/portfolio:*` error: unknown slug
`No product registered as '<slug>'. Run /portfolio:list to see registered products, or /portfolio:register <slug> <path> to add one.`

## C-17 — Generic `/portfolio:*` error: stale repo_path
`Registry says '<slug>' lives at <path>, but that path no longer exists. Either move the repo back, or unregister with /portfolio:register --remove <slug>.`
