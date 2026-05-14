# PRD — Harden WarpOS update pipeline (content-hash + sha256 un-truncation + operator-override + ownership transition)

**Sprint:** `SP-20260514-001`
**Plan Contract:** `PC-20260514-0008`
**Status:** designed
**Documentation scale:** `l`

## Outcome

Operator can run `/warp:update` on any clean Windows consumer (`autocrlf=true`) and have it complete in under 60 seconds with **zero MERGE_CONFLICT or DELETE_CONFLICT false positives**. Future framework releases ship and apply without the multi-hour debugging cycle that motivated this sprint. Operator confidence in the update tooling is restored.

## Context

### Original Request

> Implement the architectural fixes prescribed by the GPT-5.5 review at `.warpos/codex-consult-prompt.md`: (1) centralize hash logic, (2) un-truncate capsule sha256 with back-compat, (3) consolidate preflight overrides + audit, (4) separate release/apply pipelines [deferred], (5) stop shipping migrations as installed assets, (6) introduce `framework_template → project_owned` ownership transition.

### Interpreted Intent

User wants the architectural backlog GPT-5.5 prescribed turned into a real sprint plan. The mid-session fixes that shipped in 0.6.1 (LF tolerance in classifier + manifest-honesty, hash-truncation tolerance) are insufficient as a permanent solution — they patch the symptom layer. The structural causes (untruncated hashes, gate rigidity, migrations-as-assets, framework-template ownership ambiguity, release/apply coupling) remain. This sprint addresses items **1, 2, 3, 5, 6**. Item 4 (release/apply pipeline separation) is deferred to a follow-up sprint per the Plan Contract's `recommended` scope variant.

### Current Behavior

- Update pipeline compares hashes byte-equal across LF/CRLF boundaries → every text framework file produces a MERGE_CONFLICT false positive on Windows.
- Capsule manifest sha256 is truncated to 12 chars (`scripts/generate-framework-manifest.js:121`), propagated into `framework-installed.json` via `scripts/warpos/update.js:490`, then compared with `===` against a full 64-char local sha → never matches without tolerance.
- Preflight composes 10 gates; only 4 have override flags (`install-baseline`, `capsule-resolvable`, `version-quorum`, `staleness`). The other 6 have no override path. `--skip-preflight` exists but is documented in-code as "NOT recommended".
- Migrations are shipped as framework assets in capsule's `framework-manifest.json#assets[]`. Apply copies them; the `applied-migrations` gate then flags them stale; operator deletes; next apply re-copies. Infinite loop unless deleted post-apply.
- Consumer content placed in former-framework-template paths (e.g. `_requirements/00-canonical/*.md`, as observed in jobhunter-app's Jobzooka brief) gets classified DELETE_CONFLICT on framework version changes that drop the template.

### Desired Behavior

A single `/warp:update --source <canonical> --target <consumer> --to <version> --apply` invocation completes cleanly on Windows. 540+ Class A items, 0 Class C, no manual file shuffling, no `--skip-preflight` escape hatch. Preflight overrides require an explicit gate name + reason and emit an audit log entry. Migrations stay in canonical only. Project content in framework-template dirs survives version transitions. Capsule manifests are unambiguous about file content (full 64-char hash, single canonical comparison path).

## Requirements

`R-N` ids follow `scripts/hooks/requirement-format-guard.js`.

- `R-1` — **Hash semantics + back-compat**. Centralized `content-hash` module exports `contentHash`, `rawHash`, `hashMatches`, `isTextAsset`. Capsule manifests emit full 64-char sha256 going forward; read path remains prefix-tolerant for 0.6.x capsules. Consumer `framework-installed.json` always stores full 64-char hashes after first 0.7.0 update.
- `R-2` — **Preflight override contract + audit log envelope**. Single `--operator-override <gate-name>` + `--override-reason <text>` replaces the 4 narrow gate-specific flags and `--skip-preflight`. Every override emits an audit event `{kind: operator-override-used, gate, reason, operator, ts, txId}` to `paths.eventsFile`.
- `R-3` — **Asset ownership state machine**. `framework/paths.registry.json` schema gains `framework_template` owner value. Classifier behavior in `update.js` transitions a `framework_template` path to `project_owned` once the consumer has materially edited the file. Project-owned files are never classified DELETE_CONFLICT on framework version changes.
- `R-4` — **Migration loader contract**. Migrations are not emitted into `framework-manifest.json#assets[]`. `scripts/warpos/migrations-loader.js` reads from the capsule's `release.json#migrations[]` (and from canonical's `framework/migrations/` when present as a sibling). `applied-migrations` gate fails closed only when a migration dir exists, target ≤ installed, and the migration is not in the capsule list.
- `R-5` — **Update events schema**. Three new event kinds: `content-hash-mismatch` (with `kind: lf_only | real_drift`), `operator-override-used`, `ownership-transitioned`. All emit via `lib/logger.js` to `paths.eventsFile`.
- `R-6` — **Back-compat + replay**. `framework-installed.json` schema v2 extended (no major bump). Reading 0.6.x prefix hashes continues to work. Cross-version replay test bench covers 0.6.x → 0.7.0, 0.7.0 → 0.7.0 noop, and 0.7.0 → 0.7.0 with edited `framework_template` files.
- `R-7` — **Docs + consumer-side helper hygiene**. New `_docs/sprint/UPDATE_PIPELINE.md`. `lf-normalize-target.js` and `prune-installed-assets.js` documented as one-shot recovery tools, not load-bearing.

## Non-Goals

- Fixing `release-canonical.js`'s CRLF-in-checksums-after-stage-9 (already mitigated via pin-commit + rebuild follow-up; documented).
- Full re-architecting of the preflight gate set (only the override mechanism is in scope).
- Replacing the transaction wrapper (it works; only the override audit hook needs to be added).
- Adding three-way merge for MERGE_CONFLICT (still escalates to operator).
- Backporting fixes to 0.5.x or 0.4.x consumers (forward-only).
- Multi-platform CI matrix for line endings (ship Windows-correct first).
- Removing `lf-normalize-target.js` or `prune-installed-assets.js` (kept as opt-in recovery).
- Adding new preflight gates (only contract changes to existing gates).
- **Release/apply pipeline separation (item 4 from GPT-5.5)** — deferred to a follow-up sprint per Plan Contract `scope_variants.recommended`.

## Affected Surfaces

| Surface | Evidence | Touched |
|---|---|---|
| `scripts/warpos/update.js` | verified_from_repo | yes — adopt content-hash; accept `--operator-override`; ownership-classifier branch |
| `scripts/warpos/release-build.js` | verified_from_repo | yes — adopt content-hash |
| `scripts/warpos/preflight.js` | verified_from_repo | yes — single override flag + audit-log emission |
| `scripts/checks/warpos-manifest-honesty.js` | verified_from_repo | yes — adopt content-hash |
| `scripts/checks/warpos-applied-migrations.js` | verified_from_repo | yes — capsule-aware migration list |
| `scripts/generate-framework-manifest.js` | verified_from_repo | yes — emit full 64-char sha256 |
| `scripts/warpos/migrations-loader.js` | inferred_from_repo | yes — read from capsule's `release.json#migrations[]` |
| `scripts/warpos/lib/content-hash.js` | new | yes — new module |
| `framework/paths.registry.json` | verified_from_repo | yes — add `framework_template` owner + transition rule |
| `framework/hooks.registry.json` | verified_from_repo | maybe — schema alignment only if needed |
| `paths.eventsFile` | verified_from_repo | yes — three new event kinds |
| `framework-installed.json` (consumer) | verified_from_repo | yes — full 64-char hashes + back-compat read |

## External Service Dependencies

None. All work is internal framework code.

## Approval Boundaries

Per Plan Contract `approval_boundaries`:

- WarpOS canonical minor version bump (likely 0.7.0) — push + tag requires user approval (CLAUDE.md autonomy table).
- Consumer updates from 0.6.1 → 0.7.0 in `aiweb` and `jobhunter-app` require user confirmation (reversible via transaction rollback).
- `framework-installed.json` schema change — operator confirms back-compat test coverage before shipping.
- Ownership-transition rule (automatic vs explicit) — **decided 2026-05-14 (Alpha, per no-pause-for-clarification directive; Beta-recommended): automatic on any non-whitespace edit.** Logged to decisions ledger during T-073 execution. User can override the trigger in a future sprint if it surprises them.
- Decision on whether item 4 (pipeline separation) ships this sprint — confirmed deferred.

## Pre-execute audits

- **`install.ps1` hash audit (resolved 2026-05-14):** `install.ps1:143` uses `Get-FileHash -Algorithm SHA256` → `.Hash.ToLower()` which returns the full 64-char hex. The full hash is stored in `framework-installed.json#assets[].installedHash`. `install.ps1` only **writes** the snapshot — it does not read/compare hashes. All hash-comparison logic lives in node-side `update.js` and `manifest-honesty.js`. **Conclusion:** `install.ps1` needs no patch in this sprint. Recorded on T-068.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260514-0008.yaml`
- GPT-5.5 review: `.warpos/codex-consult-prompt.md`
- Originating commits: `cc2cfeb` (Windows-safe consumer updates), `87afa56` (0.6.1 capsule pin-commit)
- High-level stories: `high-level-stories.md`
- Granular stories: `granular-stories.md`
- COPY: `copy.md`
- INPUTS: `inputs.md`
- TRACE: `trace.md`
- Acceptance criteria: `acceptance-criteria.md`
- QA plan: `qa-plan.md`
- Redteam plan: `redteam-plan.md`
- Release plan: `release-plan.md`
