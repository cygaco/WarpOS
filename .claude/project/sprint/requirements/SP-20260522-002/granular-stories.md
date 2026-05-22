<!-- requirement-format-legacy -->
# Granular Stories — Install &amp; Release Integrity — manifest coverage, dry-run + rollback, idempotent install, framework-views-fresh + framework-purity gates

**Sprint:** `SP-20260522-002`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-002\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Implement scripts/warpos/manifest/build.js (walk _warpos/, sha256, classify owner)

**As** the user
**I want** Implement scripts/warpos/manifest/build.js (walk _warpos/, sha256, classify owner)
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Implement scripts/warpos/manifest/validate.js (assert every on-disk path enumerated, every entry resolves)

**As** the user
**I want** Implement scripts/warpos/manifest/validate.js (assert every on-disk path enumerated, every entry resolves)
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Implement scripts/warpos/views/regenerate.js (rebuild .claude/commands + .claude/agents managed entries)

**As** the user
**I want** Implement scripts/warpos/views/regenerate.js (rebuild .claude/commands + .claude/agents managed entries)
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Implement scripts/warpos/settings/compile.js (defaults.json + settings.local.json → settings.json; fail-loud on conflict)

**As** the user
**I want** Implement scripts/warpos/settings/compile.js (defaults.json + settings.local.json → settings.json; fail-loud on conflict)
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Add /check:warpos-manifest-coverage skill + script

**As** the user
**I want** Add /check:warpos-manifest-coverage skill + script
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Add /check:framework-views-fresh skill + script (regenerate + diff)

**As** the user
**I want** Add /check:framework-views-fresh skill + script (regenerate + diff)
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Add /check:framework-purity skill + script (refuse _requirements/_docs at root; scan for client slugs)

**As** the user
**I want** Add /check:framework-purity skill + script (refuse _requirements/_docs at root; scan for client slugs)
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — release-build.js --check guard refusing stale manifest before capsule snapshot

**As** the user
**I want** release-build.js --check guard refusing stale manifest before capsule snapshot
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-9 — Add .claude/manifest.json present-at-install + graceful absence in 4 hardcoded callers

**As** the user
**I want** Add .claude/manifest.json present-at-install + graceful absence in 4 hardcoded callers
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-9`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-10 — Extend GITIGNORE runtime-leak block (.claude/.session-checkpoint.json, .claude/.session-start-commit, .claude/project/builds/)

**As** the user
**I want** Extend GITIGNORE runtime-leak block (.claude/.session-checkpoint.json, .claude/.session-start-commit, .claude/project/builds/)
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-10`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-11 — /warp:setup idempotent with per-file status reporting (unchanged/repaired/added/conflict)

**As** the user
**I want** /warp:setup idempotent with per-file status reporting (unchanged/repaired/added/conflict)
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-11`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-12 — /warp:update --dry-run gates writes in ALL paths (not just some)

**As** the user
**I want** /warp:update --dry-run gates writes in ALL paths (not just some)
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-12`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-13 — /warp:update creates rollback snapshot under .warpos/snapshots/<update-id>/

**As** the user
**I want** /warp:update creates rollback snapshot under .warpos/snapshots/<update-id>/
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-13`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-14 — /warp:rollback <update-id> reverts framework files without touching user files

**As** the user
**I want** /warp:rollback <update-id> reverts framework files without touching user files
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-14`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-15 — _warpos/MANIFEST.json: versioned migrations + per-file installedSha/currentSha/userModified flags

**As** the user
**I want** _warpos/MANIFEST.json: versioned migrations + per-file installedSha/currentSha/userModified flags
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-15`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-16 — Install fixture: clean repo scenario

**As** the user
**I want** Install fixture: clean repo scenario
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-16`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-17 — Install fixture: existing-WarpOS-install scenario

**As** the user
**I want** Install fixture: existing-WarpOS-install scenario
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-17`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-18 — Install fixture: dirty repo (uncommitted changes) scenario

**As** the user
**I want** Install fixture: dirty repo (uncommitted changes) scenario
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-18`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-19 — Install fixture: multi-version upgrade scenario

**As** the user
**I want** Install fixture: multi-version upgrade scenario
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-19`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-20 — Install fixture: user-override scenario (silent overwrite must NOT happen)

**As** the user
**I want** Install fixture: user-override scenario (silent overwrite must NOT happen)
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-20`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-21 — release-build.js post-update check provenance fix (resolve 0.1.4 bug class — pick one of the three hypotheses, ship + regression test)

**As** the user
**I want** release-build.js post-update check provenance fix (resolve 0.1.4 bug class — pick one of the three hypotheses, ship + regression test)
**So that** Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-21`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

