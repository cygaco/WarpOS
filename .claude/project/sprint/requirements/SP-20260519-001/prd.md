# PRD — ROADMAP + RELEASES ledger discipline

**Sprint:** `SP-20260519-001`
**Plan Contract:** `PC-20260519-0015`
**Reasoning trace:** `RT-011` (what-counts-as-release policy)
**Status:** designed
**Documentation scale:** `m`
**Scope variant chosen:** recommended (writer-script integration + warn hook + backfill; downstream RELEASES.md scaffold deferred to a later sprint).

## Outcome

Any reader — future Alex session, downstream consumer, founder — can answer "what work has happened?" from a single file at repo root (`ROADMAP.md`) and "what shipped where, with what notes?" from a sibling file at repo root (`RELEASES.md`) without grep-diving into `.claude/project/sprint/`. Closes the chronic LRN classes `release-capsule-gap` (LRN 2026-05-13) and `status-transition-edge-ownership` (LRN 2026-05-13) by making the two ledgers first-class artifacts that every release-class skill is contractually required to update.

## Context

### Original request

> Every sprint to be recorded in ROADMAP.md, and all releases to be recorded in RELEASES.md (include 'release notes'). Consider what counts for a release with /reasoning:run

### Reasoning artifact

`RT-011` (in `.claude/project/memory/traces.jsonl`) carries the two-tier release-event policy produced by `/reasoning:run` deep mode:

| Event | Tier | Lives in |
|---|---|---|
| `version.json` bump (capsule under `framework/releases/X.Y.Z/`) | MUST | `RELEASES.md#versions` |
| `RL-*` at status=deployed OR prepared-at-internal-canary | MUST | `RELEASES.md#sprints` |
| Bare git tag with capsule but outside `/warp:release` pipeline | MAY (flagged "tagged outside pipeline") | `RELEASES.md#versions` |
| Hotfix commit to `main` without an `RL-*` record | MUST NOT | git log only |
| Docs-only commits | MUST NOT | git log only |

Boundary condition: an event qualifies for `RELEASES.md` iff it produced a durable artifact under `framework/releases/X.Y.Z/` OR `.claude/project/sprint/releases/RL-*`.

### Current behavior

- Sprints are recorded only in `.claude/project/sprint/active-sprints.yaml` + per-sprint subdir under `sprints/<SP-id>/`. No repo-root index.
- Releases are recorded only in `.claude/project/sprint/releases/RL-*.yaml` + `.changelog.md` (sprint releases) AND `version.json` / `framework/releases/X.Y.Z/release.json` (framework version bumps). No unified index.
- `ROADMAP.md` exists (516 lines) but carries framework backlog by phase, NOT per-sprint records.
- `RELEASES.md` does not exist.

### Desired behavior

- `ROADMAP.md` gains a top "Sprints" section with one row per sprint (id, title, status, started, closed, release link). Existing Phase-1/2/3/4 backlog stays as-is below the new section.
- `RELEASES.md` is created at repo root with two sections — "Versions" (every `version.json` bump) and "Sprints" (every `RL-*` at status=deployed OR prepared) — each row linking to existing artifacts.
- All writes are skill+script driven; manual markdown edits remain valid.
- A one-shot backfill script populates both ledgers from existing on-disk artifacts so the ledgers are useful day one.
- A `warn`-mode PreToolUse hook surfaces drift when `/sprint:plan` or `/sprint:release` ran but the corresponding ledger row was not detected. Soft rollout per the SP-20260514-002 routing-trace precedent.

## Requirements

> `R-N` ids per `scripts/hooks/requirement-format-guard.js`.

- **`R-1` — Ledger format spec.** Both `ROADMAP.md` and `RELEASES.md` carry machine-parseable markdown sections with stable column sets (see `copy.md#C-1..C-3`) so a single shared writer can append/update rows idempotently. Sort = reverse chronological by sprint id / release date. Status enum for ROADMAP rows = `planning | designing | executing | releasing | closed | retrospected | abandoned`. Status enum for RELEASES sprint rows = `prepared | deployed | rolled_back`.
- **`R-2` — Ledger writer contract.** Every release-class skill that produces a durable artifact in scope MUST update the relevant ledger via a single shared module `scripts/sprint/ledger.js`. The module is fail-open (errors emit stderr but never block the host script — matches `routing-trace` precedent). Touchpoints: `plan.js` + `add-sprint.js` (sprint row insert), `retrospective.js` (sprint row status update), `release.js` (RELEASES sprint row insert), `release-canonical.js` (RELEASES version row insert).
- **`R-3` — What-counts-as-release policy codified.** The RT-011 two-tier policy is added as a named section to `paths.sprintReference` (`sprint-workflow.md`) and referenced verbatim from the `/sprint:release` skill body. The policy carries the explicit boundary condition: "an event qualifies iff it produced a durable artifact under `framework/releases/X.Y.Z/` OR `.claude/project/sprint/releases/RL-*`."
- **`R-4` — Historical backfill.** A new `scripts/sprint/backfill-ledgers.js` reads `active-sprints.yaml`, every `releases/RL-*.yaml`, and `version.json#previousVersions` and emits the ledger rows that should exist. Dry-run by default; `--apply` writes. The script is idempotent — re-running over a populated ledger MUST NOT duplicate rows.
- **`R-5` — Soft enforcement.** A new `scripts/hooks/ledger-presence-guard.js` runs PreToolUse on `Bash` calls invoking `node scripts/sprint/plan.js`, `node scripts/sprint/release.js`, `node scripts/sprint/retrospective.js`, and `scripts/warpos/release-canonical.js`. It checks that after a successful invocation the corresponding ledger row exists. Soft rollout: `enforcement.mode = warn` for 14 days (until 2026-06-02), then flip to `block` after smoke validation. Mirror policy file shape from `paths.sprintRouting`.
- **`R-6` — Downstream-canonical boundary preserved.** Canonical-WarpOS `ROADMAP.md` carries framework backlog AND framework sprint rows; canonical `RELEASES.md` carries framework releases. `scripts/warpos/promote.js` MUST exclude both files from canonical→product propagation (`ROADMAP.md` is already excluded; `RELEASES.md` added by this sprint). Consumer-side `RELEASES.md` scaffold is OUT OF SCOPE for this sprint — deferred to a follow-up if a consumer asks.
- **`R-7` — Skill body updates.** `/sprint:plan`, `/sprint:release`, `/sprint:retrospective` skill bodies gain a one-line reference to the ledger contract pointing at `paths.sprintReference#ledger-discipline`. `/warp:release` skill body gains the same reference. Updates land in `.claude/commands/sprint/*.md` and `.claude/commands/warp/release.md` (verify paths during execution).

## Non-Goals

- NOT changing what counts as a sprint vs a ticket vs a learning — only how sprints are summarized at repo root.
- NOT changing per-sprint subdirs under `sprints/<SP-id>/` — they remain source-of-truth.
- NOT redesigning `version.json` or `framework/releases/` — they remain source-of-truth for version bumps.
- NOT auto-generating release-notes prose via LLM — notes are human-written or extracted from existing `RL-*.changelog.md`.
- NOT a UI/dashboard — markdown ledgers at repo root only.
- NOT downstream `RELEASES.md` scaffold — deferred until a consumer asks.
- NOT promoting the ledger guard from `warn` to `block` in this sprint — soft-rollout exits the sprint with the warn-mode default; the flip is a follow-up after 14d of clean traces.

## Affected Surfaces

| Surface | Evidence Level | Notes |
|---|---|---|
| `ROADMAP.md` | verified_from_repo | 516 lines, Phase-1..4 backlog, excluded from promote |
| `RELEASES.md` | verified_from_repo | does not exist |
| `.claude/project/sprint/releases/RL-*.yaml` + `.changelog.md` | verified_from_repo | ~21 entries |
| `version.json` + `framework/releases/X.Y.Z/` | verified_from_repo | 0.8.0 current, 21 historical capsules (with 0.3.x gap) |
| `scripts/sprint/release.js` | verified_from_repo | owns `RL-*` creation + deployment |
| `scripts/warpos/release-canonical.js` (or whatever drives `/warp:release`) | INFERRED (must grep-verify in execution) | owns `version.json` bump + capsule build |
| `scripts/sprint/plan.js` + `add-sprint.js` | verified_from_repo | own sprint id mint + active-sprints update |
| `scripts/sprint/retrospective.js` | verified_from_repo | owns sprint → retrospected transition |
| `scripts/warpos/generate-roadmap-scaffold.js` | verified_from_repo | owns downstream `ROADMAP.md` scaffold |
| `scripts/warpos/promote.js` | verified_from_repo | excludes `ROADMAP.md`; must add `RELEASES.md` |
| PreToolUse hooks | inferred_from_repo | new `ledger-presence-guard.js` joins existing guard set |
| `paths.sprintReference` (`sprint-workflow.md`) | verified_from_repo | needs new "Ledger discipline" section |
| `.claude/commands/sprint/{plan,release,retrospective}.md` | inferred_from_repo | skill body updates |
| `.claude/commands/warp/release.md` | inferred_from_repo | skill body update |

## External Service Dependencies

None. Purely internal — markdown ledgers, sprint scripts, hooks. See Plan Contract `external_service_dependencies.status = none_expected`.

## Approval Boundaries

- `/sprint:release` deploy remains user-approved (unchanged from current convention).
- Future `warn → block` flip for `ledger-presence-guard` requires explicit user approval after smoke validation. Out of scope for this sprint.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260519-0015.yaml`
- Reasoning trace: `.claude/project/memory/traces.jsonl#RT-011`
- High-level stories: `high-level-stories.md`
- Granular stories: `granular-stories.md`
- COPY: `copy.md`
- INPUTS: `inputs.md`
- TRACE: `trace.md`
- Acceptance criteria: `acceptance-criteria.md`
- QA plan: `qa-plan.md`
- Redteam plan: `redteam-plan.md`
- Release plan: `release-plan.md`
