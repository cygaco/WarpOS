# COPY Requirements — Harden /warp:update — preflight + transactional apply + postflight verify

**Sprint:** `SP-20260513-005`
**PRD:** `prd.md`

> User-visible text strings. Each `C-N` is a concrete string the operator
> sees in their terminal, with context. Ids are stable so tickets and ACs
> can link to specific blocks.

## C-1 — Preflight: install baseline missing (linked story `S-4`)

**Context:** Operator runs `/warp:update --to <v> --apply` but
`.claude/framework-installed.json` is missing or `installedVersion=0.0.0`.

**Text:**

> ```
> Preflight: install-baseline FAILED
>   reason:  .claude/framework-installed.json not found (or installedVersion=0.0.0)
>            — this project has no installed WarpOS snapshot to update from.
>   fix:     Run install.ps1 first (this is for upgrades, not fresh installs):
>              powershell -ExecutionPolicy Bypass -File <warpos-repo>/install.ps1
>            Or, if you have a baseline somewhere, restore it:
>              git checkout <prev-commit> -- .claude/framework-installed.json
>   override: --force-fresh (DANGER — treats this as a fresh install,
>              produces a massive ADD_SAFE plan)
> ```

**Notes:** Mirror style of existing `update.js` error messages. The
`fix:` line is always plain shell with no template placeholders.

## C-2 — Preflight: capsule unresolvable (linked story `S-3`)

**Context:** Capsule for `--to <v>` could not be found in REPO_ROOT,
sibling clones, or `manifest.json#warpos.source`. This is the operator-
rage signature F-1.

**Text:**

> ```
> Preflight: capsule-resolvable FAILED
>   requested:   <v>
>   searched in:
>     - <REPO_ROOT>/framework/releases/<v>/release.json    [not found]
>     - ../WarpOS/framework/releases/<v>/release.json      [not found]
>     - ../warpos/framework/releases/<v>/release.json      [not found]
>     - <manifest.warpos.source>/framework/releases/<v>/   [not found]
>   available versions:
>     in <REPO_ROOT>/framework/releases/: 0.1.2, 0.2.0, 0.2.2
>     in ../WarpOS/framework/releases/:    0.4.0, 0.4.1, 0.5.0
>   fix:
>     1. Use one of the available versions above (recent: 0.5.0):
>          /warp:update --to 0.5.0 --apply
>     2. Or point --source at the canonical clone explicitly:
>          /warp:update --to <v> --source /abs/path/to/WarpOS --apply
>     3. If the capsule for <v> was never built, build it in canonical:
>          (in canonical clone)  node scripts/warpos/release-build.js <v>
> ```

**Notes:** This is the most operator-friendly message in the bundle.
Every available-version list, every fix path, every line lifts from the
mined `failure-mining.md#F-1`. Match the surrounding tone of the existing
update.js human report (printHumanReport).

## C-3 — Preflight: version quorum disagreement (linked story `S-4`)

**Context:** Two or more of `version.json`, `framework-manifest.json`,
`framework-installed.json`, install.ps1 header constant disagree on the
current version. F-3 in failure-mining.md.

**Text:**

> ```
> Preflight: version-quorum FAILED
>   sources disagree on installed version:
>     version.json                       0.5.0
>     .claude/framework-manifest.json    0.2.2   ← suspect
>     .claude/framework-installed.json   0.5.0
>     scripts/warpos/install.ps1 header  0.5.0
>   trust order (per CLAUDE.md learning 2026-05-13): version.json wins.
>   fix:
>     - Inspect each disagreeing file. If framework-manifest.json is stale:
>         git checkout HEAD -- .claude/framework-manifest.json
>     - Re-run /check:warpos-manifest-honesty to confirm.
>   override: none — refuse to update with disagreeing version sources.
> ```

**Notes:** Lifts the trust-order rule directly from learning event line
1960. Override is explicitly NONE — this is the source-of-truth class,
operator must reconcile.

## C-4 — Preflight: migration presence (linked story `S-4`)

**Context:** `release.json#migrations[]` lists files that don't exist in
the source tree. F-5 in failure-mining.md.

**Text:**

> ```
> Preflight: migration-presence FAILED
>   capsule 0.5.0 lists migrations:
>     migrations/0.4.4-to-0.5.0/01-rename-paths.js   [MISSING in source tree]
>     migrations/0.4.4-to-0.5.0/02-update-hooks.js   [OK]
>   This means the capsule was built with a manifest that references
>   migrations that were never committed. The capsule is broken.
>   fix:
>     - In the canonical clone, re-run the release build to regenerate:
>         node scripts/warpos/release-build.js 0.5.0
>     - Or, if the migration was intentionally omitted, edit
>       framework/releases/0.5.0/release.json to remove the entry, rebuild
>       checksums:
>         node scripts/warpos/release-canonical.js 0.5.0
>   override: none — refuse to apply with missing migration files.
> ```

**Notes:** Per failure-mining.md F-5, this protects against shipping
breaking changes without migrations.

## C-5 — Preflight summary (success) (linked story `S-2`)

**Context:** All preflight gates pass. Shown above the dry-run / apply
plan.

**Text:**

> ```
> Preflight: 10/10 gates GREEN
>   install-baseline      OK
>   capsule-resolvable    OK  (source: <abs path>)
>   version-quorum        OK  (all 4 sources agree on 0.4.4)
>   manifest-honesty      OK
>   staleness             OK  (canonical 0.5.0 → installed 0.4.4, 1d old)
>   path-resolution       OK  (28 keys, all resolved)
>   structure-parity      OK  (12/12 framework dirs present)
>   applied-migrations    OK  (no leftover migration scripts)
>   migration-presence    OK  (capsule lists 0 migrations, all OK)
>   tracked-transients    OK  (capsule has no .warpos/ or qa-* files)
> ```

**Notes:** Matches the existing dry-run summary visual style.
Numbers and dirs are placeholders.

## C-6 — Apply: transaction start (linked story `S-5`)

**Context:** Shown at the start of `--apply`, after preflight green.

**Text:**

> ```
> Transaction: 2026-05-13T07-30-12-warp-update-myproject
>   target:       /abs/path/to/myproject
>   from → to:    0.4.4 → 0.5.0
>   files to touch: 47 (write: 31, delete: 0, ADD_SAFE: 16, no-op: 388)
>   backups going to: .warpos/transactions/<id>/backup/
>   Press Ctrl-C to abort — partial state will be rolled back automatically.
> ```

**Notes:** This is the only line that mentions Ctrl-C — important for
operator agency.

## C-7 — Apply: rollback on failure (linked story `S-6`)

**Context:** A write or migration threw during apply. Rollback executed.

**Text:**

> ```
> Apply FAILED at file <rel-path> (migration: <name>)
>   error: <one-line summary>
>   Rolling back transaction 2026-05-13T07-30-12-warp-update-myproject ...
>     restored:    18 files from backup
>     unlinked:    7 ADD_SAFE writes that completed before failure
>     migrations:  none ran (failed at apply step 14 of 47)
>   Result: install restored to pre-apply state.
>   diagnostics: .warpos/transactions/<id>/diagnostics.log
>   rollback record: .warpos/transactions/<id>/result.json (outcome=rolled-back)
>   To investigate further, share the transaction dir with support.
>   To retry once fixed:  /warp:update --to 0.5.0 --apply
>   Exit code: 1
> ```

**Notes:** Reassures operator that rollback worked. Surfaces the
diagnostic path. Does NOT auto-suggest `git reset` (advisory git per
failure-mining.md constraint #2).

## C-8 — Postflight summary (success) (linked story `S-7`)

**Context:** All postflight checks green. Shown after apply.

**Text:**

> ```
> Postflight: 5/5 checks GREEN
>   manifest-honesty       OK  (framework-installed.json matches disk)
>   path-resolution        OK  (28 keys, all resolved)
>   applied-migrations     OK
>   provider-smoke         OK  (5 providers, all reachable)        [SP-002]
>   warp:health rollup     OK  (3 systems GREEN)
> Evidence package: .warpos/transactions/<id>/evidence/postflight.json
> Transaction:      COMMITTED
> ```

**Notes:** `[SP-002]` annotation flags the dependency.

## C-9 — Postflight failure (degraded or red) (linked story `S-7`, `S-8`)

**Context:** Postflight check failed or degraded. Apply already committed.

**Text:**

> ```
> Postflight: 4/5 checks GREEN, 1 RED
>   manifest-honesty       OK
>   path-resolution        RED  (key paths.providerSmokeSkill points to a missing file)
>     fix: re-run scripts/paths/build.js
>   applied-migrations     OK
>   provider-smoke         DEGRADED  (provider-smoke skill not yet shipped)
>   warp:health rollup     OK
> Apply was committed. Postflight surfaced 1 issue and 1 degradation.
> Options:
>   - Fix the path-resolution issue manually (recommended)
>   - Roll back to pre-apply state:
>       node scripts/warpos/update.js --rollback <txId>
>   - Accept-with-warnings and continue (events.jsonl records the warning).
> Evidence package: .warpos/transactions/<id>/evidence/postflight.json
> ```

**Notes:** Postflight is diagnostic — does NOT auto-rollback. Surface
the `--rollback` option for the operator.

## C-10 — Manual remediation needed (Class C escalation, retained from current update.js) (linked stories `S-2`, `S-10`)

**Context:** Preflight gates green but classify produces Class C items
(MERGE_CONFLICT etc). This message is retained verbatim from current
update.js behavior; we just acknowledge it stays.

**Text:**

> ```
> ESCALATE: <N> Class C item(s) must be resolved before --apply.
> Sample:
>   MERGE_CONFLICT: <file path>
>   ...
> ```

**Notes:** No change to this message from current 0.5.0 behavior.
Documented here for completeness.
