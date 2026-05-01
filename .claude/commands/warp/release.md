---
description: "Cut a new WarpOS release: bump version, snapshot manifest, write capsule, run gates."
user-invocable: true
---

# /warp:release — Cut a new release

Phase 4E entry point. The engine lives at `scripts/warpos/release-build.js`.

## Usage

| Invocation | Behavior |
|---|---|
| `/warp:release 0.2.0` | Build capsule for 0.2.0. Refuses if version already exists. |
| `/warp:release 0.2.0 --check` | Verify an existing capsule's checksums + migration files. No writes. |
| `/warp:release --next-patch` | Auto-bump patch (0.1.0 → 0.1.1). |
| `/warp:release --next-minor` | Auto-bump minor (0.1.0 → 0.2.0). |

## Procedure

### Step 1 — pre-flight

Run all release gates (see `/warp:doctor` § Release gates). Any red → stop. Yellow surfaces but does not block at this stage.

Confirm the target version is greater than `version.json`'s current `version`. Refuse to overwrite an existing capsule unless `--check` is set.

### Step 2 — bump version

Update three files atomically (one commit's worth of edits):

- `version.json` → new version + `previousVersions[]` appended
- `.claude/framework-manifest.json` → `version` field
- `warpos/releases/<new-version>/release.json` (created from a freshly-rebuilt manifest snapshot)

### Step 3 — invoke engine

```bash
node scripts/warpos/release-build.js <version>
```

The engine:

1. Validates the capsule directory at `warpos/releases/<version>/` contains `release.json`.
2. Snapshots `.claude/framework-manifest.json` into the capsule.
3. Confirms every migration referenced in `release.json` exists at the declared path.
4. Computes sha256 for every file in the capsule + every referenced migration.
5. Writes `checksums.json`.

### Step 4 — generate changelog

If `warpos/releases/<version>/changelog.md` doesn't exist, generate from `git log <previous-tag>..HEAD --oneline` grouped by phase / area. The user reviews + edits before commit.

### Step 5 — generate upgrade-notes

Same — write `warpos/releases/<version>/upgrade-notes.md` from the migration list, classifying each as reversible / destructive and noting required pre-flight tags.

### Step 6 — final gates

Run gates again — this catches anything the version-bump itself drifted (e.g. `framework-manifest.json` regenerated mid-release with a different file count).

### Step 7 — human report

Render the standard human report shape: verdict, what changed, why, risks remaining, what was rejected, what was tested, what needs human decision, recommended next action.

### Step 8 — commit + tag

`chore(release): warpos@<version>` + `git tag warpos-<version>`. **No push** — the user owns push timing.

## Failure modes

- Pre-flight gate fails → fix, re-run.
- Migration file missing → fix the migration path or omit from release.json.
- Checksum drift after second gate run → manifest regen mid-release; re-run from step 3.

## See also

- `scripts/warpos/release-build.js` — the engine.
- `schemas/release.schema.json` — release.json validator.
- `/warp:doctor` — runs the gate suite directly without bumping a version.
- `/warp:update` — consumes capsules produced here.
- `/warp:promote` — propagates released changes to the canonical WarpOS clone.
