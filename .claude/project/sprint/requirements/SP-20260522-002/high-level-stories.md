<!-- requirement-format-legacy -->
# High-Level Stories — Install &amp; Release Integrity — manifest coverage, dry-run + rollback, idempotent install, framework-views-fresh + framework-purity gates

**Sprint:** `SP-20260522-002`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-002\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the maintainer, I want /warp:update --dry-run to show exactly what will change before applying so I never regret an update.

**As** the user
**I want** As the maintainer, I want /warp:update --dry-run to show exactly what will change before applying so I never regret an update.
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As an installed product, I want /warp:rollback <update-id> to undo a framework update without touching my project files.

**As** the user
**I want** As an installed product, I want /warp:rollback <update-id> to undo a framework update without touching my project files.
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
