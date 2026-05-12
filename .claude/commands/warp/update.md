---
description: "Update WarpOS in this project to a target release. Default = latest. Default mode = dry-run; pass --apply to execute."
user-invocable: true
---

# /warp:update — Apply a WarpOS release capsule

Phase 4C entry point. The actual engine lives at `scripts/warpos/update.js`. This skill is a thin wrapper that resolves arguments, runs the engine, and presents the plan.

## Usage

| Invocation | Behavior |
|---|---|
| `/warp:update` | Dry-run against latest available release capsule. Prints the 12-category plan + class-A/B/C breakdown. **Safe.** |
| `/warp:update 0.2.0` | Dry-run against capsule `framework/releases/0.2.0/`. |
| `/warp:update --apply` | **Apply** the latest plan. Class A auto-apply, Class B apply-with-reviewer, Class C escalates. |
| `/warp:update --apply --confirm-deletes` | Same as above, plus actually executes Class A `DELETE_SAFE` removals (otherwise deferred). |
| `/warp:update --json` | Machine-readable output. |

## Procedure

### Step 1 — pre-flight

Check `.claude/framework-installed.json` exists. If not: tell the user to run `install.ps1` first; this skill is for upgrades, not fresh installs.

**Do NOT pre-check the local `framework/releases/<version>/` directory.** 0.4.1+ update.js auto-discovers canonical clones via sibling walk (`../WarpOS`, `../warpos`) and via `manifest.json#warpos.source` / `framework-installed.json#source`. If the local repo's `framework/releases/` is stale, the engine reads the capsule from canonical and the slash command stays silent about the lookup. Only fall back to "list available capsules" if the engine itself reports the capsule can't be found anywhere.

### Step 2 — invoke engine

```bash
node scripts/warpos/update.js --to <version> --dry-run    # default
node scripts/warpos/update.js --to <version> --apply       # if --apply supplied
```

The engine prints `[update] capsule <v> not in local framework/releases/ — using canonical at <path>` to stderr when it auto-discovered a sibling/manifest-pointed clone. Pass that line through verbatim so the user sees where the source came from. Pass `--no-discover` to disable the walk (useful for closed-environment tests).

Capture stdout. The engine emits a 12-category classification plus Class A/B/C totals.

### Step 3 — present the plan

Render a one-screen summary:

- **From → To** versions
- **Class A (auto):** count + sample of asset IDs
- **Class B (apply+review):** count + sample
- **Class C (escalate):** count + each item one-line, full detail

If any Class C: stop with an "ESCALATE:" prefix message; the user must decide for each.

Then render the standard human report shape:

1. Verdict
2. What changed
3. Why
4. Risks remaining
5. What was rejected
6. What was tested
7. What needs human decision
8. Recommended next action

### Step 4 — if --apply

The engine walks the plan and writes to the local install:
- Class A `ADD_SAFE` / `UPDATE_SAFE` / `GENERATED_REBUILD` / `MERGE_SAFE` → copy from capsule's source tree to the local destination.
- Class A `DELETE_SAFE` → deferred unless `--confirm-deletes` is passed (matches `promote.js` semantics).
- Class A `LOCAL_ONLY` / `LOCAL_CUSTOMIZED` → no-op.
- Class B `MERGE_SAFE` / `RENAME_SAFE` / `MIGRATION_REQUIRED` → applied in this run; reviewer surfaces in the report.
- Class C — refused. Engine returns `ok:false` with an `ESCALATE:` error and a sample of offenders.

After the apply, run the `postUpdateChecks` from `release.json` in order. Any non-zero exit → stop, surface the failing check, and recommend `/warp:doctor` to verify state.

### Step 5 — write installed snapshot

The engine updates `.claude/framework-installed.json` with the new `installedVersion`, `installedCommit`, `installedAt`, per-asset `installedHash`, and the `generated[]` array. The snapshot is the source of truth `/warp:update` reads on the next run to classify local-vs-installed drift.

## Failure modes

- `release.json` missing → bad capsule.
- `framework-installed.json` missing → no install to update — direct to `install.ps1`.
- Class C unresolved → cannot apply; ESCALATE.
- `postUpdateChecks` fails → install is in a half-applied state; rollback via `git reset --hard pre-warpos-<version>-update` (the tag is taken automatically before any --apply run).

## See also

- `scripts/warpos/update.js` — the engine.
- `framework/releases/<version>/release.json` — capsule manifest.
- `migrations/<from>-to-<to>/` — migration scripts run during apply.
- `/warp:promote` — the outbound counterpart.
- `/warp:release` — generate a new capsule from current state.
- `/warp:doctor` — verify the install is healthy after update.
