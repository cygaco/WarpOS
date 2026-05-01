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
| `/warp:update 0.2.0` | Dry-run against capsule `warpos/releases/0.2.0/`. |
| `/warp:update --apply` | **Apply** the latest plan. Class A auto-apply, Class B apply-with-reviewer, Class C escalates. (Apply path lands in 0.1.x — currently dry-run only in 0.1.0 baseline.) |
| `/warp:update --json` | Machine-readable output. |

## Procedure

### Step 1 — pre-flight

Check `.claude/framework-installed.json` exists. If not: tell the user to run `install.ps1` first; this skill is for upgrades, not fresh installs.

Check the target release capsule exists at `warpos/releases/<version>/release.json`. If not: list available capsules from `warpos/releases/`.

### Step 2 — invoke engine

```bash
node scripts/warpos/update.js --to <version> --dry-run    # default
node scripts/warpos/update.js --to <version> --apply       # if --apply supplied
```

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

> **0.1.0 baseline note:** the engine refuses `--apply` in this release (`update.js` returns `ok: false`). The full apply path — three-way merge runner, postUpdateChecks gate, installed-snapshot writer, rollback-tag automation — lands in 0.1.x once the WarpOS canonical clone is wired and a real downstream upgrade target exists. Until then, `/warp:update` is dry-run only. The skill should surface the engine's `error` field unmodified rather than swallow it.

Once the apply path ships:

Run engine in apply mode. After it returns, run the `postUpdateChecks` from `release.json` in order. Any non-zero exit → stop, surface the failing check.

### Step 5 — write installed snapshot _(0.1.x, not 0.1.0 baseline)_

The engine updates `.claude/framework-installed.json` with the new `installedVersion`, `installedCommit`, `installedAt`, per-asset `installedHash`, and the `generated[]` array.

## Failure modes

- `release.json` missing → bad capsule.
- `framework-installed.json` missing → no install to update — direct to `install.ps1`.
- Class C unresolved → cannot apply; ESCALATE.
- `postUpdateChecks` fails → install is in a half-applied state; rollback via `git reset --hard pre-warpos-<version>-update` (the tag is taken automatically before any --apply run).

## See also

- `scripts/warpos/update.js` — the engine.
- `warpos/releases/<version>/release.json` — capsule manifest.
- `migrations/<from>-to-<to>/` — migration scripts run during apply.
- `/warp:promote` — the outbound counterpart.
- `/warp:release` — generate a new capsule from current state.
- `/warp:doctor` — verify the install is healthy after update.
