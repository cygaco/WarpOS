# COPY Requirements — ROADMAP + RELEASES ledger discipline

**Sprint:** `SP-20260519-001`
**PRD:** `prd.md`

> User-visible markdown text (rendered in `ROADMAP.md`, `RELEASES.md`, the warn hook, stderr from ledger.js, and skill-body references). Ids stable so tickets link to specific blocks.

## C-1 — ROADMAP.md Sprints section header (linked story `S-1`)

**Context:** Inserted ABOVE the existing Phase backlog, BELOW the existing `# WarpOS Roadmap` H1 and the dual-identity HTML comment.
**Text:**

```markdown
## Sprints

| Sprint | Title | Status | Started | Closed | Release |
|---|---|---|---|---|---|
<!-- ledger:sprints — auto-managed by scripts/sprint/ledger.js. Manual edits are valid but may be overwritten on next /sprint:* invocation. -->
```

**Notes:** The HTML comment marker `<!-- ledger:sprints -->` is the anchor `ledger.js` greps for to know where to insert/update rows. Removing the marker disables auto-write for that section.

## C-2 — RELEASES.md H1 + Versions section (linked story `S-2`)

**Context:** Repo root, new file.
**Text:**

```markdown
# WarpOS Releases

The engineering release ledger for WarpOS. See [`paths.sprintReference#ledger-discipline`](.claude/project/reference/sprint-workflow.md#ledger-discipline) for what qualifies.

## Versions

Every `version.json` bump that produced a capsule under `framework/releases/X.Y.Z/`. Summaries are written for downstream consumer maintainers running `/warp:update --to X.Y.Z` — they read this section in isolation, without engineering-internal artifact ids.

| Version | Released | Capsule | Summary |
|---|---|---|---|
<!-- ledger:versions — auto-managed by scripts/sprint/ledger.js. Manual edits valid; may be overwritten on next /warp:release. -->
```

**Notes:** Summary column must be downstream-readable — see linter rule in `AC-8.2`.

## C-3 — RELEASES.md Sprints section (linked story `S-2`)

**Context:** Below the Versions section in `RELEASES.md`.
**Text:**

```markdown
## Sprints

Every `RL-*` at status=prepared OR =deployed. Each row links to the full `RL-*.yaml` and `.changelog.md` under `.claude/project/sprint/releases/`.

| Release | Sprint | Status | Target | Deployed | Notes |
|---|---|---|---|---|---|
<!-- ledger:releases — auto-managed by scripts/sprint/ledger.js. -->
```

**Notes:** Notes column is engineering-facing (sprint id, learning candidates ok).

## C-4 — sprint-workflow.md "Ledger discipline" section header (linked story `S-3`)

**Context:** New H2 section in `paths.sprintReference`.
**Text:**

```markdown
## Ledger discipline

Every release-class event lands in one of two repo-root ledgers — `ROADMAP.md` (sprints) and `RELEASES.md` (versions + releases). The boundary condition is single: **an event qualifies iff it produced a durable artifact under `framework/releases/X.Y.Z/` OR `.claude/project/sprint/releases/RL-*`.**

### What qualifies (RT-011 policy)

| Event | Tier | Lives in |
|---|---|---|
| `version.json` bump (capsule under `framework/releases/X.Y.Z/`) | MUST | `RELEASES.md#versions` |
| `RL-*` at status=deployed OR prepared-at-internal-canary | MUST | `RELEASES.md#sprints` |
| Bare git tag with capsule but outside `/warp:release` | MAY (flagged "tagged outside pipeline") | `RELEASES.md#versions` |
| Hotfix to `main` without an `RL-*` | MUST NOT | git log only |
| Docs-only commits | MUST NOT | git log only |

Writers go through `scripts/sprint/ledger.js`. The module is fail-open — stderr on failure, never blocks the host script. A `warn`-mode PreToolUse hook (`scripts/hooks/ledger-presence-guard.js`) surfaces missed writes during the soft-rollout window.
```

## C-5 — ledger.js stderr lines (linked story `S-4`)

**Context:** Surfaces on every fail-open error path.
**Text:**

- `[ledger] appendSprintRow: written SP-20260519-001 → ROADMAP.md`
- `[ledger] appendSprintRow: skipped SP-20260519-001 (already-present)`
- `[ledger] failed: <error.message> — fail-open, continuing`

**Notes:** Prefix `[ledger]` is greppable by the warn-hook so it can correlate ledger writes to sprint invocations.

## C-6 — plan.js / add-sprint.js write confirmation (linked story `S-5`)

**Context:** Existing scripts emit a `current-sprint:` line on success. The ledger write adds one more line.
**Text:**

- `roadmap: ROADMAP.md row added for SP-20260519-001`

**Notes:** No new flag, no new arg — strictly additive to existing output.

## C-7 — retrospective.js write confirmation (linked story `S-6`)

**Context:** End of retrospective.js stdout.
**Text:**

- `roadmap: ROADMAP.md row updated SP-20260519-001 → retrospected`

## C-8 — release.js write confirmation (linked story `S-7`)

**Context:** End of release.js stdout for `cmdPrepare` and `cmdDeploy`.
**Text:**

- `releases: RELEASES.md row added RL-20260519-013 (status=prepared)`
- `releases: RELEASES.md row updated RL-20260519-013 (status=deployed)`

## C-9 — /warp:release version-bump confirmation (linked story `S-8`)

**Context:** End of `release-canonical.js` (or equivalent) stdout after capsule build.
**Text:**

- `releases: RELEASES.md row added version 0.9.0`

## C-10 — backfill-ledgers.js summary (linked story `S-9`)

**Context:** End-of-run summary, stdout.
**Text:**

```
backfill-ledgers (dry-run): would insert N sprint rows, M version rows, K release rows.
  ROADMAP.md sprints: N inserted, X already present
  RELEASES.md versions: M inserted, Y already present
  RELEASES.md sprints: K inserted, Z already present

Pass --apply to write.
```

**Notes:** With `--apply`, replace "would insert" with "inserted" and drop the trailing hint line.

## C-11 — ledger-presence-guard warn (linked story `S-10`)

**Context:** stderr from the hook when a release-class command ran but ledger row not detected.
**Text:**

- `[ledger-presence-guard] warn: ROADMAP.md missing row for SP-20260519-001 after /sprint:plan. Soft-rollout until 2026-06-02 — warn only.`

## C-12 — Skill-body one-liner (linked story `S-11`)

**Context:** Inserted near the top of `/sprint:plan`, `/sprint:release`, `/sprint:retrospective`, `/warp:release` skill bodies (exact placement decided in execution).
**Text:**

```markdown
> Ledger contract — this skill writes a ROADMAP.md/RELEASES.md row via `scripts/sprint/ledger.js`. See `paths.sprintReference#ledger-discipline` for what qualifies and the fail-open contract.
```
