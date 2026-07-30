# Upgrade notes — 1.1.0 → 1.2.0

> **About this file.** The tree at tag `warpos@1.2.0` carries the *generated placeholder* version of these
> notes; this is the authoritative text, landed after the tag. See `changelog.md` in this directory for the
> same disclosure and why the tag is not the distribution surface.

## What changes for you

**Nothing you already rely on stops working.** There are no breaking changes, no schema changes and no
migrations. The upgrade is a straight capsule update.

**One capability arrives disabled.** `/memory:verify` ships in 1.2.0 with its `--apply` mutation path **held
fail-closed** — it refuses before touching the filesystem, and there is no override. The read-only detector
ships and is fully functional, so report-only runs work normally. If you were waiting on the mutation path,
it is not available in this release; `changelog.md` states why, what remains open against it, and the branch
in which it does not return at all.

Practically: if any tooling of yours shells out to `memory-apply.js --apply`, it will now exit non-zero with a
refusal message. Treat that as expected in 1.2.0, not as a regression to work around — and note there is
deliberately no flag or environment variable that re-enables it.

## Pre-flight

1. Tag your current state: `git tag pre-warpos-1.2.0-update HEAD`.
2. Confirm a clean working tree: `git status --porcelain` empty.

## Run the update

```bash
node scripts/warpos/update.js --to 1.2.0 \
  --source ../WarpOS \
  --target . \
  --dry-run

node scripts/warpos/update.js --to 1.2.0 \
  --source ../WarpOS \
  --target . \
  --apply
```

Run the dry-run first and read it. The update reads the capsule from
`<source>/framework/releases/1.2.0/`, so make sure the source checkout is on the ref you intend — normally
`main`.

## Post-update checks

The capsule's `release.json` lists the checks to run after applying. They are the standard set for this
release: the paths build and gate, the hooks build and fixture tests, structure parity, and a provider smoke
test. None of them is new in 1.2.0.

## Rollback

```bash
git reset --hard pre-warpos-1.2.0-update
```

(or restore from `.warpos/transactions/<latest>/backup/`).

## Verifying what you installed

The commit this capsule was built from is in `checksums.json#commit`
(`11fead50d68c6eef21664ecd49d2dcd538a0e9c7`). `release.json#commit` is `null` in this release and in 1.1.0 —
a known, tracked mismatch between the skeleton and the build; use `checksums.json#commit`.
