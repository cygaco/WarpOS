---
description: "Promote framework changes from this project (the further-along version) into the canonical WarpOS clone. Always dry-run by default."
user-invocable: true
---

# /warp:promote — Push framework changes to WarpOS canonical

Phase 4D entry point. The engine lives at `scripts/warpos/promote.js`. This skill is the human-facing wrapper.

## Background

This project (`jobhunter-app`) is where new WarpOS framework changes are *first developed*. The canonical WarpOS repo is downstream — it receives changes via `/warp:promote`. Per ADR-001 (NEXT-WARP §9), the engine lives here in jobzooka because this is the further-along version; promoting the engine itself to the WarpOS canonical repo is the engine's first job once it lands.

## Usage

| Invocation | Behavior |
|---|---|
| `/warp:promote` | Source-only scan — what framework files exist here? Useful for inventory. |
| `/warp:promote --to ../WarpOS` | Compare against a sibling WarpOS clone, dry-run. **Default safe mode.** |
| `/warp:promote --to ../WarpOS --apply` | Apply the plan to the target clone. (Apply path lands after the WarpOS canonical clone is wired in 0.1.x; current 0.1.0 baseline is dry-run only.) |
| `/warp:promote --to ../WarpOS --json` | Machine-readable. |

## How it differs from /warp:update

- **/warp:update** = canonical WarpOS → this install (inbound).
- **/warp:promote** = this install → canonical WarpOS (outbound).

## Per §11 — does NOT trust §4 as a literal acceptance list

NEXT-WARP `§4 Promotion backlog` is a human-curated list of items that should propagate. The 2026-04-30 staleness audit found that list ages faster than phases ship. This engine therefore:

1. **Regenerates the propagation list at run time** by walking the framework-owned tree on both sides.
2. Treats `§4` as **intent annotation only** — useful for reading what the human said about each row, not as the source of truth for what to do.
3. Items in `§4` that no longer match filesystem state are silently dropped with a `_obsolete_when_run` log line.
4. New items not in `§4` surface in the appropriate category for human acknowledgement before promotion.

## Categories produced

The engine classifies every framework-owned file into one of nine categories. Class mapping per Phase 4K:

| Category | Class | Meaning |
|---|---|---|
| FRAMEWORK_ADD | A | Source has it, target doesn't — propagate. |
| FRAMEWORK_UPDATE | A | Source differs from target — propagate. |
| FRAMEWORK_DELETE | B | Target has it, source doesn't — needs human ack before deleting upstream. |
| GENERATED_IGNORE | A | Regenerated artifact (e.g. graph.json) — skip. |
| RUNTIME_IGNORE | A | Per-session state — skip. |
| PROJECT_IGNORE | A | Project-specific (e.g. jobzooka specs) — skip. |
| MIGRATION_CANDIDATE | B | A migration script — propagate if not already present. |
| TEMPLATE_REVIEW | C | Per-project filled file (manifest.json, store.json) — promote as TEMPLATE only. Manual review required. |
| SECRET_BLOCK | C | Looks like a secret — refuse to propagate. |

## Procedure

### Step 1 — pre-flight

Confirm `--to` points at a directory that exists and contains `.claude/framework-manifest.json` (i.e. it's a WarpOS install). If `--to` omitted, run source-only scan.

### Step 2 — invoke engine

```bash
node scripts/warpos/promote.js --to <path> --dry-run    # default
node scripts/warpos/promote.js --to <path> --apply       # if --apply supplied
```

### Step 3 — present the plan

One-screen summary: total decisions, Class A/B/C breakdown, sample of first 20 entries, and a flag if any Class C surfaced.

If any Class C: stop with an "ESCALATE:" prefix; the user must resolve each (e.g. acknowledge a TEMPLATE_REVIEW or remove a SECRET_BLOCK candidate).

Then render the standard human report shape: verdict, what changed, why, risks remaining, what was rejected, what was tested, what needs human decision, recommended next action.

### Step 4 — if --apply

Engine writes to target tree. Bumps the target's framework-manifest version. Generates a target-side commit message. **Does not push** — the user owns push timing for the target clone.

## Failure modes

- `--to` doesn't exist → bad path.
- Target isn't a WarpOS install → refuse, since promote semantics depend on the target having `.claude/framework-manifest.json`.
- SECRET_BLOCK in plan → refuse to apply; user must remove the secret first.
- `release-build.js --check` fails on target after apply → rollback hint surfaced.

## See also

- `scripts/warpos/promote.js` — the engine.
- NEXT-WARP §4 — promotion backlog (intent annotations).
- ADR-001 (NEXT-WARP §9) — why this engine lives here, not in WarpOS canonical.
- `/warp:update` — the inbound counterpart.
- `/warp:release` — capsule generator (often paired with promote).
