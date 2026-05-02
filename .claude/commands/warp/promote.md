---
description: "Promote framework changes from a source product/instance repo into the canonical WarpOS clone. Always dry-run by default."
user-invocable: true
---

# /warp:promote — Push framework changes to WarpOS canonical

Phase 4D entry point. The engine lives at `scripts/warpos/promote.js`. This skill is the human-facing wrapper.

## Background

A *source repo* (a product app or an advanced WarpOS instance) sometimes has framework files that are ahead of the canonical WarpOS clone. `/warp:promote` reconciles that direction — source → canonical. The inbound counterpart is `/warp:update`, which goes canonical → installed.

The engine itself is shipped from canonical. Older notes still reference one specific source repo by name (`jobhunter-app`); current behavior detects the source repo dynamically from `.claude/manifest.json#project.slug` (or `package.json#name`) so the same engine runs from any source.

## Usage

| Invocation | Behavior |
|---|---|
| `/warp:promote` | Source-only scan — what framework files exist here? Useful for inventory. |
| `/warp:promote --to ../WarpOS` | Compare against a sibling WarpOS clone, dry-run. **Default safe mode.** |
| `/warp:promote --to ../WarpOS --apply` | Apply the plan to the target clone. |
| `/warp:promote --to ../WarpOS --apply --confirm-deletes` | Also apply Class B deletes. |
| `/warp:promote --to ../WarpOS --json` | Machine-readable. |

## How it differs from /warp:update

- **/warp:update** = canonical WarpOS → this install (inbound).
- **/warp:promote** = this source repo → canonical WarpOS (outbound).

## Source-of-truth for the propagation list

The engine **regenerates** the propagation list at run time by walking the framework-owned tree on both sides. It does not trust any pre-existing backlog file as authoritative — backlogs age faster than phases ship.

## Categories produced

The engine classifies every framework-owned file into one of nine categories. Class mapping per Phase 4K:

| Category | Class | Meaning |
|---|---|---|
| FRAMEWORK_ADD | A | Source has it, target doesn't — propagate. |
| FRAMEWORK_UPDATE | A | Source differs from target — propagate. |
| FRAMEWORK_DELETE | B | Target has it, source doesn't — needs human ack before deleting upstream. |
| GENERATED_IGNORE | A | Regenerated artifact (e.g. graph.json) — skip. |
| RUNTIME_IGNORE | A | Per-session state — skip. |
| PROJECT_IGNORE | A | Project-specific (feature specs, app source) — skip. |
| MIGRATION_CANDIDATE | B | A migration script — propagate if not already present. |
| TEMPLATE_REVIEW | C | Per-project filled file (manifest.json, store.json) — promote as TEMPLATE only. Manual review required. |
| SECRET_BLOCK | C | Looks like a secret — refuse to propagate. |

## Procedure

### Step 1 — pre-flight

Confirm `--to` points at a directory that exists and contains `.claude/framework-manifest.json` (i.e. it is a WarpOS install). If `--to` omitted, run source-only scan.

### Step 2 — invoke engine

```bash
node scripts/warpos/promote.js --to <canonical-warpos-path> --dry-run    # default
node scripts/warpos/promote.js --to <canonical-warpos-path> --apply      # if --apply supplied
```

### Step 3 — present the plan

One-screen summary: total decisions, Class A/B/C breakdown, sample of first 20 entries, and a flag if any Class C surfaced.

If any Class C: stop with an `ESCALATE:` prefix; the user must resolve each (e.g. acknowledge a TEMPLATE_REVIEW or remove a SECRET_BLOCK candidate).

Then render the standard human report shape: verdict, what changed, why, risks remaining, what was rejected, what was tested, what needs human decision, recommended next action.

### Step 4 — if --apply

Engine writes to target tree, generates a target-side commit message stub at `.warpos-sync-commit-msg.txt`, and writes `.warpos-sync.json` recording the sync. **Does not push** — the user owns push timing for the target clone (review diff first).

## Failure modes

- `--to` doesn't exist → bad path.
- Target isn't a WarpOS install → refuse, since promote semantics depend on the target having `.claude/framework-manifest.json`.
- SECRET_BLOCK in plan → refuse to apply; user must remove the secret first.
- `release-build.js --check` fails on target after apply → rollback hint surfaced.

## See also

- `scripts/warpos/promote.js` — the engine.
- `/warp:update` — the inbound counterpart.
- `/warp:release` — capsule generator (often paired with promote).
