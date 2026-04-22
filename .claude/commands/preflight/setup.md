---
description: Prepare a clean skeleton branch for the next /mode:oneshot or /mode:adhoc run — branches off master and guts feature code to stubs.
user-invocable: true
---

# /preflight:setup — Fresh Skeleton Branch + Gut

Prepare the repo for a new skeleton run. Creates `skeleton-testN+1` off master, strips feature code to stubs, resets the oneshot store, and verifies the build.

This is the narrow "get me to a clean starting line" flow. For the full 7-pass verification (previous run closure, retro completeness, schema alignment, etc.), run `/preflight:run` separately — ideally after this skill completes.

## When to use

- You're about to start a new `/mode:oneshot` skeleton build.
- The previous skeleton run is done (or being abandoned) and you want a fresh slate.
- You want to regenerate stubs from current spec signatures (uses the `stub-scaffold` sub-agent when Pass 7.9 detects drift).

## When NOT to use

- You want a partial reset, e.g. only one feature reverted. This skill is whole-project gut.
- You're mid-build and just want to reset a single feature's status. Edit the store directly.
- You haven't committed or stashed local changes. This skill will refuse to proceed with a dirty tree.

## Procedure

### Step 1: Pre-flight guards

Before anything destructive:

1. **Working tree must be clean.** Run `git status --porcelain`. If output is non-empty, abort with:
   ```
   Dirty working tree — commit, stash, or discard changes before /preflight:setup.
   ```
2. **Must have a master branch locally.** Run `git rev-parse --verify master`. If missing, abort.
3. **Master must be fresh.** Run `git fetch origin master --quiet` (best-effort; skip on offline). Warn if local `master` is behind `origin/master` but do NOT auto-pull — leave the update decision to the user.
4. **Confirm current branch is safe to leave.** If the current branch has commits ahead of master that are NOT merged or pushed, warn and confirm before proceeding.
5. **Confirm oneshot store exists.** `.claude/agents/02-oneshot/.system/store.json` must be present. If missing, abort with instructions to initialize the store first.

If any guard fails, report what's blocking and stop.

### Step 2: Pick the next skeleton branch name

Enumerate existing `skeleton-test*` branches locally and on origin. Parse the trailing integer and pick `N = max + 1`.

```bash
LAST_N=$(git branch -a --format='%(refname:short)' | sed -n 's#^\(origin/\)\?skeleton-test\([0-9]\+\)$#\2#p' | sort -n | tail -1)
NEXT_N=$(( ${LAST_N:-0} + 1 ))
NEW_BRANCH="skeleton-test${NEXT_N}"
```

If the computed branch name already exists (local or remote), abort — pick is racy, ask the user to clean up or specify an override.

### Step 3: Create the branch off master

```bash
git checkout master
git checkout -b "$NEW_BRANCH"
```

Verify: `git branch --show-current` should print `$NEW_BRANCH`.

### Step 4: Run preflight Pass 7 --gut

Delegate to the canonical gut flow — it already handles stub regeneration, Pass 7.8 store↔PRD sync, Pass 7.9 stub signature scaffold, store reset, and build verification.

```
/preflight:run 7 --gut
```

That skill (`.claude/commands/preflight/run.md`) does in order:
1. Regenerates non-stub feature files as skeletons (components <25 lines, routes → 501, libs → throwing).
2. Pass 7.8 — patches `store.features[<feature>].files` to match PRD Section 13.
3. Pass 7.9 — for any drift-flagged stubs, dispatches the `stub-scaffold` sub-agent to regenerate the stub with current spec signatures.
4. Resets the oneshot store (`scripts/oneshot-store-reset.js $NEW_BRANCH`) — feature statuses → `not_started`, cycle counters cleared, heartbeat refreshed.
5. Runs `npm run build` and confirms clean.
6. Emits a `--gut` summary.

If the build fails after gut, report the failure and DO NOT commit. Leave the repo in the intermediate state for diagnosis.

### Step 5: Commit the gut

Create a single commit capturing the skeleton state:

```bash
git add -A
git commit -m "preflight(pass-7 --gut): ${NEW_BRANCH} ready for build"
```

This mirrors the precedent commit style (see run-08 commit `894d97c preflight(pass-7 --gut): skeleton-test8 ready for build`).

### Step 6: Report

Emit a concise ready-state summary:

```
✓ Branch: skeleton-testN (off master @ <sha>)
✓ Stubs: <M> files regenerated (components/routes/libs)
✓ Store: <K> non-foundation features reset to not_started
✓ Build: npm run build passed
✓ Heartbeat: delta / initializing

Ready for /mode:oneshot or /mode:adhoc.

Recommended next step:
  /preflight:run      # full 7-pass verification
  /mode:oneshot       # launch Delta standalone
  /mode:adhoc         # launch α + β + γ team
```

## Rules

- **Never push.** This skill only operates locally. Pushing is the user's call per CLAUDE.md autonomy table.
- **Never force.** If the target branch name already exists, abort — don't `--force` or overwrite.
- **Never edit foundation.** The gut pass already respects foundation via `manifest.fileOwnership.foundation`. Don't add foundation-touching logic here.
- **One skeleton branch per invocation.** Don't attempt to recover from a half-run by re-running; clean up manually first.

## Failure modes + recovery

| Failure | Recovery |
|---|---|
| Dirty working tree | `git status`, then `git stash` / commit / `git restore` as appropriate, then re-run |
| `skeleton-testN` already exists | `git branch -D skeleton-testN` (if local leftover) or pick a higher N explicitly |
| Build fails after gut | Repo is in intermediate state on new branch. Investigate the stub regeneration or the Pass 7.9 scaffold output. Once fixed, manually `git add -A && git commit` with an appropriate message |
| Pass 7.9 `stub-scaffold` dispatch fails | Likely `claude -p` CLI unavailable. The gut pass reports which file failed; generate the stub manually or skip 7.9 and re-run |
| `scripts/oneshot-store-reset.js` missing | This skill depends on it — install it from `scripts/` or abort |
