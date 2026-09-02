# SP-20260513-005 — Failure-Mode Mining for /warp:update

Evidence base for the preflight + transactional-apply + postflight design.
Mined from `.claude/runtime/handoffs/` (last 7 files, 2026-05-11 → 2026-05-13)
+ `.claude/project/events/events.jsonl` (last ~30 days, 3,614 lines, 954
events matching update/migration/capsule/MERGE/manifest keywords).

## How this evidence was gathered

- Listed `.claude/runtime/handoffs/` and read the 5 most recent.
- `Grep` over `events.jsonl` for: `warp.?update | update\.js | migration | rollback | capsule | sourceTreeRoot | MERGE | manifest | path.?resolution | framework-installed`.
- `Grep` over the `learning` category for tip previews mentioning capsule/update/version.
- Cross-referenced with the surface list in PC-20260513-0006.

Result: **8 distinct failure signatures**, plus a 9th meta-class (operator
trust loss from accumulated friction). Frequencies are eyeballs from the
mined window (last 30d, last 7d handoffs), not telemetry — but each cited
example is timestamped.

---

## Failure signatures

### F-1 — Capsule missing for requested `--to <version>` (escalates to operator rage)

**What happens:** Operator runs `/warp:update --to 0.4.0 --apply` against a
project that's pointed at a canonical clone whose `framework/releases/`
only ships up through 0.2.2. `update.js` throws `Capsule X.Y.Z missing
release.json at <path>` and exits — but the failure mode confuses the
operator because the version exists in their head (was published, tagged,
talked about) but not on disk.

**Cited example:**
- handoff `2026-05-13-0524.md` line 23: `[23:32:40] whats tag ready? I want to update my other projects to 0.4.0`
- handoff `2026-05-13-0524.md` line 26: `Available release capsules under framework/releases/: 0.1.0 ... 0.2.2. There is no 0.3.x or 0.4.x capsule.`
- handoff `2026-05-13-0524.md` line 27: `i did tell it to update to 0.4.0 specifically i aud warp:update --to 0.4.0 --apply`
- handoff `2026-05-13-0524.md` line 28: `<verbatim operator prompt withheld — profane; gist: warp:update shouldn't be useless like this>`
- events.jsonl line 1958 (learning, 2026-05-13): `/warp:update --to X.Y.Z must validate capsule exists under framework/releases/ before any work; if absent, print exact actionable next step`

**Frequency:** at least 3 escalations in the 2026-05-12 window alone (the
operator-rage event was the precipitating cause of this whole sprint).

**Current handling:** `loadCapsule()` throws — but the error wording
("missing release.json at ...") doesn't tell the operator that the
canonical clone is missing the capsule, doesn't tell them whether a
sibling clone has it, and doesn't surface `--source`. No existing
`check:warpos-*` skill covers it.

**Preflight gate candidate:** **NEW — `check:warpos-capsule-resolvable`**.
At preflight, walk `[REPO_ROOT, ../WarpOS, ../warpos, manifest.json#warpos.source, framework-installed.json#source]` looking for a `framework/releases/<v>/release.json`. If absent, list available versions in each location and print exact `--source <path>` fix. Refuse apply.

---

### F-2 — Capsule gap (capsule for tagged release was never built)

**What happens:** A release tag exists in git history (`0.3.0`, `0.4.0`)
but no corresponding capsule was built under `framework/releases/`. The
gap is invisible until the operator tries to update to it.

**Cited example:**
- events.jsonl line 1959 (learning, 2026-05-13): `Ship a release capsule under framework/releases/X.Y.Z/ for EVERY tagged release — gap-free. Skipping capsule generation [breaks /warp:update].`

**Frequency:** the gap between 0.2.2 and 0.4.1 noted in handoffs was a
real recurring class — the 0.3.x line was talked about but never
capsule'd, which is exactly what F-1 surfaced to operators.

**Current handling:** `/warp:release` builds capsules but there's no
audit that says "every release tag must have a capsule." `check:warpos-roundtrip` and `check:warpos-migration-coverage` are both STUBs.

**Preflight gate candidate:** Same `check:warpos-capsule-resolvable` from
F-1 handles the operator side. On the canonical side, a release-gate
extension (out of scope for SP-005) should enforce capsule existence on
tag. Document as deferred-to-release-gates.js extension.

---

### F-3 — Version drift between sources of truth (`version.json` vs `framework-manifest.json` vs `framework-installed.json` vs script header)

**What happens:** Three (sometimes four) files claim to know the installed
version and they disagree. The drift is invisible until update-time.

**Cited examples:**
- handoff `2026-05-13-1528.md` line 15: `Installed: WarpOS 0.4.1 (script header expected 0.4.0; version.json shipped 0.4.1 — proceeded with the actual version).`
- handoff `2026-05-13-1528.md` line 21: `Bash(git checkout .claude/framework-manifest.json ... ) ... version: 0.2.2 total: 418 ... Restored — framework-manifest.json was wrong.`
- events.jsonl line 1960 (learning): `version.json is source-of-truth for installed version, NOT script header constants. When they disagree, trust version.json.`
- handoff `2026-05-13-1528.md` line 25: `framework-manifest.json is already tracked (so committable), but framework-installed.json was never force-added.`

**Frequency:** at least 2 distinct drift incidents (script-header vs
version.json on 2026-05-13 02:17, and framework-manifest.json off-by-2-minors
on 2026-05-13 05:57) — both required hand-intervention to restore truth.

**Current handling:** `check:warpos-manifest-honesty` exists (verifies
`framework-installed.json` reflects disk). `check:warpos-staleness` exists
(detects installed-version vs canonical-version drift >7d). Neither
cross-checks `version.json` ↔ `framework-manifest.json` ↔
`framework-installed.json` ↔ script header constants at update-time. They
detect it as a steady-state condition, not as a "block this update."

**Preflight gate candidate:** **Compose existing
`check:warpos-manifest-honesty` + `check:warpos-staleness` into preflight**.
Add a NEW lightweight cross-check `check:warpos-version-quorum` that fails
if any two of the four version sources disagree (this is the SOURCE-OF-TRUTH
audit the operator keeps performing by hand).

---

### F-4 — `framework-installed.json` missing or ignored by `.gitignore` (per-machine snapshot vs framework manifest)

**What happens:** `.claude/` is ignored in `.gitignore` (line 8 of
`/.gitignore` per handoff). `framework-installed.json` was never
force-added in some repos, so it doesn't exist after clone — meaning
`/warp:update` reads `installed = null` and falls back to `0.0.0`,
producing a massive ADD_SAFE plan that wants to install everything.

**Cited example:**
- handoff `2026-05-13-1528.md` line 25: `Hit a snag. The .gitignore (line 8: .claude/) ignores the directory by default; framework-manifest.json is already tracked (so committable), but framework-installed.json was never force-added.`
- handoff `2026-05-13-1528.md` line 26: `Committed as 98ba5ad. Updating the memory to capture the why you laid out — the snapshot is per-machine by design, not by accident`
- events.jsonl line 1962 (learning): `framework-manifest.json is git-tracked but framework-installed.json defaults to gitignored (under .claude/). After every install/update on a fresh clone, must force-add or accept per-machine.`

**Frequency:** 1 confirmed incident on 2026-05-13 06:16, but the design
(per-machine snapshot) means this will recur in every fresh clone of every
downstream project.

**Current handling:** `check:warpos-manifest-honesty` would flag the
manifest as inconsistent with disk, but `/warp:update` itself doesn't
refuse to apply when installed=null and `fromVersion=0.0.0` is inferred
from `framework-manifest.json#version`. Existing skill `check:install`
covers fresh installs but isn't composed by `/warp:update`.

**Preflight gate candidate:** **NEW — `check:warpos-install-baseline`**.
At preflight, if `framework-installed.json` is missing, refuse update and
direct to `install.ps1` (this is what `update.md` already says manually,
but no gate enforces it). Compose `check:warpos-manifest-honesty` too.

---

### F-5 — Migration not run / migration-coverage gap (capsule lists migrations but they don't exist or don't run)

**What happens:** Pre-0.1.2 `update.js` listed migrations in
`release.json` but never executed them. Even after the 0.1.2+ rewrite,
`check:warpos-migration-coverage` is still STUB-status — no audit that
every breaking change ships a migration. Operator runs `/warp:update`,
the migration directory is absent, runMigrations returns `status:skipped`,
and the update reports success while leaving inconsistent state behind.

**Cited example:**
- update.js header comment lines 22-31: `Pre-0.1.2 update.js had four broken behaviours that this rewrite fixes: ... migrations listed in release.json were never executed; only counted.`
- The 0.5.0 release.json shows `"migrations": []` — no enforcement that
  this is correct vs. an oversight.
- `check:warpos-migration-coverage` is documented as STUB.

**Frequency:** Latent risk; no specific operator-narrated incident in the
mined window, but the STUB status guarantees this will reappear when
breaking changes ship without migrations.

**Current handling:** `check:warpos-applied-migrations` detects already-applied
migration scripts left on disk in consumer projects (cleanup side). The
opposite — "this update LISTS a migration that doesn't exist in the source
tree" — has no gate.

**Preflight gate candidate:** **Compose existing
`check:warpos-applied-migrations`** + **NEW `check:warpos-migration-presence`**:
for each `release.json#migrations[]` entry, verify the migration file exists
in source tree before apply.

---

### F-6 — Path-resolution drift after update (paths.json keys point to non-existent files)

**What happens:** An update adds/renames `paths.X` keys in
`.claude/paths.json` but the new key points to a file that wasn't shipped
in the capsule, or vice versa: a file is shipped but the key isn't
registered. Hooks that read `paths.X` then `fs.existsSync` → false and
fail silently.

**Cited evidence:**
- The 0.5.0 release.json has 4 `postUpdateChecks` — two of them are
  `node scripts/paths/build.js --check` and `node scripts/paths/gate.js`,
  confirming this is the known-recurring class.
- `check:warpos-path-resolution` exists for exactly this.

**Frequency:** Inferred recurring (the fact that two of four postUpdateChecks
target paths suggests historical pain).

**Current handling:** `check:warpos-path-resolution` exists. Currently runs
as a post-update check (success path). Doesn't run preflight.

**Preflight gate candidate:** **Compose existing
`check:warpos-path-resolution`** into preflight AND postflight. Preflight
ensures the install is starting from a clean state; postflight ensures the
new state is clean. Same skill, two invocations.

---

### F-7 — Structure parity drift (canonical declares a dir, install is missing it)

**What happens:** Canonical's framework manifest declares a structural
skeleton dir that the install doesn't have (e.g. `framework/releases/`,
`scripts/warpos/`, `_docs/`). Operations that assume the dir exists fail
at the first attempt.

**Cited evidence:**
- `check:warpos-structure-parity` exists for exactly this.
- handoff narrations cite running `check:install` and `/warp:doctor`
  manually after update, never composed by `/warp:update` itself.

**Frequency:** Inferred — no specific operator incident in mined window
but the gate exists, which means the failure has been observed enough to
get a skill.

**Current handling:** `check:warpos-structure-parity` exists. Not composed
by `/warp:update`.

**Preflight gate candidate:** **Compose existing
`check:warpos-structure-parity`**.

---

### F-8 — Tracked transients (transient state accidentally committed gets pushed back into capsule)

**What happens:** `.warpos/`, `qa-*.png`, `runtime/qa-*/` get committed to
the canonical repo by accident, end up in a capsule's framework-manifest,
and on update get propagated to every downstream install — bloating size
and confusing operators.

**Cited evidence:**
- `check:warpos-tracked-transients` exists for exactly this; the explicit
  list of patterns (`.warpos/`, `qa-*.png`, `runtime/qa-*/`) suggests
  observed-in-the-wild.
- This sprint's own working tree shows `.warpos/builder-fixture-57d0677ea6/transaction.json`
  is uncommitted (per handoff 2026-05-13-0524.md line 82) — exactly the
  category this gate catches.

**Frequency:** Recurring per the gate's existence.

**Current handling:** `check:warpos-tracked-transients` exists. Not composed
by `/warp:update`.

**Preflight gate candidate:** **Compose existing
`check:warpos-tracked-transients`** to refuse updating from a capsule that
contains transients.

---

### F-9 — HTML-entity-encoded commands pasted from PR/HTML sources (`&amp;` etc.)

**What happens:** Operator copies `/warp:update --to 0.4.0 --apply` (or a
shell invocation containing `&&`) from a PR description or HTML-rendered
source. The `&` is entity-encoded as `&amp;`. The shell tries to parse
`&amp;` as a literal token and fails with `syntax error near unexpected token '&amp;'`.

**Cited example:**
- handoff `2026-05-13-1528.md` line 14: `⎿ /usr/bin/bash: eval: line 2: syntax error near unexpected token '&amp;'`
- events.jsonl line 1961 (learning): `When pasting commands from PR descriptions or HTML-rendered sources, scan for HTML entities (&amp; &lt; &gt;) before executing.`

**Frequency:** 1 documented incident on 2026-05-13 02:13. This is more of
a user-experience signal than an update-engine bug — but the operator's
reaction (verbatim withheld — profane) suggests it contributed to fear.

**Current handling:** None.

**Preflight gate candidate:** Out of scope for the engine. Document in
`/warp:update.md` troubleshooting section as a known footgun. NOT a gate.

---

### F-10 — Meta: accumulated friction → operator trust loss

**What happens:** Operator runs `/warp:update`, hits 2-3 of the above in
sequence, gets frustrated, abandons the update or rolls back manually.
This is the source-of-truth for the sprint: the operator-verbatim line
from the plan contract is `I am scared to update other projects to newer
versions because there is always issues and tons of troubleshooting.`

**Cited example:**
- PC-20260513-0006 `source_request_verbatim` (the founding evidence).
- events.jsonl line 918 (2026-05-12 00:13:38): `<verbatim operator prompt withheld — profane; the full text is PC-20260513-0006 source_request_verbatim>`

**Frequency:** This is the whole sprint.

**Current handling:** Nothing — friction is invisible until it's verbalized.

**Preflight gate candidate:** Not a gate. The composed preflight + transactional apply + postflight is the answer.

---

## Coverage map

| Failure | Cited freq (30d) | Covered by existing `check:warpos-*`? | Preflight gate plan |
|---|---|---|---|
| F-1 capsule missing | 3+ rage events | No | **NEW `check:warpos-capsule-resolvable`** |
| F-2 capsule gap | latent | No (STUBs `roundtrip`, `migration-coverage`) | Same as F-1 + defer to release-gates.js extension |
| F-3 version drift | 2+ incidents | Partial — `manifest-honesty` + `staleness` | Compose existing + **NEW `check:warpos-version-quorum`** |
| F-4 missing baseline | 1 confirmed, design-recurring | No | **NEW `check:warpos-install-baseline`** + compose `manifest-honesty` |
| F-5 migration absent | latent | Partial — STUB `migration-coverage` | Compose `applied-migrations` + **NEW `check:warpos-migration-presence`** |
| F-6 path resolution | recurring (2 of 4 postUpdateChecks) | Yes — `path-resolution` | Compose preflight AND postflight |
| F-7 structure parity | inferred recurring | Yes — `structure-parity` | Compose into preflight |
| F-8 tracked transients | recurring | Yes — `tracked-transients` | Compose into preflight |
| F-9 HTML entities | 1 documented | No | Document in `/warp:update.md`; NOT a gate |
| F-10 trust loss | the whole sprint | No | The composed preflight+transaction+postflight IS the answer |

### Existing checks → preflight composition

The preflight composer in SP-005 will call **in order**, fail-fast:

1. `check:warpos-install-baseline` (NEW) — installed exists
2. `check:warpos-capsule-resolvable` (NEW) — capsule for `--to <v>` is reachable
3. `check:warpos-version-quorum` (NEW) — version sources agree
4. `check:warpos-manifest-honesty` (existing) — current state honest
5. `check:warpos-staleness` (existing) — drift bounded
6. `check:warpos-path-resolution` (existing) — paths.json clean (pre)
7. `check:warpos-structure-parity` (existing) — required dirs present
8. `check:warpos-applied-migrations` (existing) — no leftover migrations
9. `check:warpos-migration-presence` (NEW) — migrations the capsule lists actually exist
10. `check:warpos-tracked-transients` (existing) — no transients in capsule

### Existing checks → postflight composition

After commit, run **in order**, fail-loud-but-don't-rollback:

1. `check:warpos-manifest-honesty` (post-update state)
2. `check:warpos-path-resolution` (post-update state)
3. `check:warpos-applied-migrations`
4. `provider-smoke` from SP-002 if available (placeholder otherwise)
5. `/warp:health` rollup

Postflight failures emit an evidence package, log a structured event,
and prompt operator to either accept-with-warnings or roll back the
transaction. Postflight failures do NOT auto-rollback by default
(that would be too aggressive — postflight is meant for diagnosis).

---

## What's in scope for SP-005 (vs. deferred)

**In scope:**
- Preflight composer in `update.js` that calls the 10 checks above (3 NEW + 7 existing).
- The 3 NEW `check:warpos-*` skills.
- Transactional apply wrapper: pre-apply snapshot of files-to-be-touched,
  apply, validate, commit-or-rollback. (`update.js` already has a transaction
  stub at lines 336-369 that we extend, not replace.)
- Postflight verifier composing the 5 checks above.
- Failure event schema for `events.jsonl`.
- Evidence package schema for successful + failed postflight.
- Operator-facing copy for each failure mode.

**Deferred (expanded scope per PC-20260513-0006):**
- Migration-replay test bench across capsule chain (mentioned in QA plan, not built).
- Recurring-failure dashboard hooked to events.jsonl.
- `release-gates.js` extension that enforces capsule-per-tag (F-2 root cause; release-time concern).
- Real three-way merge for `MERGE_CONFLICT` (separate sprint).

---

## Constraints derived from the mining

1. **Provider-smoke is SP-002's deliverable.** Postflight composes it as
   an OPTIONAL external check. If SP-002 hasn't merged when SP-005 ships,
   postflight records the check as `status:degraded reason:"provider-smoke skill not available yet"`.
2. **Rollback is FILE-LEVEL (advisory git-handling).** Snapshot every file
   that will be touched (write + delete + rename) to
   `<targetRoot>/.warpos/transactions/<txId>/backup/`. On failure, restore
   from backup. Do NOT auto-`git reset --hard`. Surface a "consider running
   `git reset --hard pre-warpos-<v>-update`" in the rollback message if the
   pre-update tag exists.
3. **Dry-run remains the default** (`update.md` is explicit; PC-0006
   non-goals confirm).
4. **No new env vars, no new external services.**
5. **Existing transaction stub at update.js:336-369 is the base** — extend,
   don't rewrite.

---

## Tickets this evidence drives

(Detailed in `granular-stories.md` and `T-NNN.yaml`):
- One ticket for failure-mode mining deliverable (this doc + reference).
- One ticket for each of 3 NEW `check:warpos-*` skills.
- One ticket for preflight composer in `update.js`.
- One ticket for transactional apply extension.
- One ticket for postflight verifier in `update.js`.
- One ticket for failure event schema + emission.
- One ticket for `/warp:update.md` procedure update + troubleshooting.
- One ticket for cross-version replay test bench.

---

## References

- `.claude/runtime/handoffs/2026-05-13-{0015,0524,0528,0812,1528}.md`
- `.claude/project/events/events.jsonl` lines 917-919, 926, 969, 1958-1965, 2008-2023, 2917
- `scripts/warpos/update.js:336-369` (transaction stub)
- `scripts/warpos/update.js:22-31` (history-of-broken-behaviour header)
- `framework/releases/0.5.0/release.json#postUpdateChecks` (existing post-check shape)
- `.claude/commands/check/warpos-*.md` (existing check skills)
- PC-20260513-0006.yaml (founding plan contract)
