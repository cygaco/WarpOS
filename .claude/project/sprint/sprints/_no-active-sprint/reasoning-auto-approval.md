# Reasoning Episode — Auto-Approval / Session-Scoped Authorization Skill

- **Trace id:** RT-003
- **Date:** 2026-05-13
- **Framework:** Multi-Candidate Comparative Analysis (MCCA)
- **Mode:** Deep
- **Source:** /reasoning:run on design question "How do we let the user pre-authorize a session-scoped batch of high-impact actions so the harness classifier and our hooks let Alex execute without per-action re-prompting?"
- **History match:** RT-002 used MCCA on a similar mechanism-selection question with quality 3 — same framework reused.

## Problem

This session hit 6 friction events forcing Alex back to the keyboard for one-word re-approvals:

1. `git push origin main` x2 — harness "default-branch cascade-block"
2. `Edit .claude/manifest.json` — harness manifest safety
3. `Write` empty `systems.jsonl` — harness Write-tool safety on appendable files
4. `node -e fs.writeFileSync` — our `merge-guard.js` hook (line ~417)
5. `git rm --cached -r` of an embedded gitlink — destructive git, likely our hook
6. Edit on `T-20260513-062.yaml` — transient (subagent file lock), not a real classifier block

Layer-ownership audit: **~4 are harness-side**, **~1-2 are our-hook-side**, **1 was noise**. Any solution must address BOTH layers; there is no single lever that controls both because the harness classifier runs in Anthropic's infrastructure and cannot read project-local runtime files.

## First Impulse

Mechanism D (flag file + session-context header + new PreToolUse hook). User pre-favored it and it spans both layers.

## Steelman the Opposite

D adds three new surfaces for a pain spread across ~5 patterns. The flag file is just a stateful "user said yes 30 seconds ago." More importantly, the new PreToolUse hook in D would solve a problem that already has a harness-native lever: `.claude/settings.json#permissions.allow`. The harness classifier honors `permissions.allow` for the exact patterns that bit us (default-branch push, manifest edit). A lean solution that uses settings.allow for the harness layer and a runtime flag file for OUR hooks beats D's three-surface design — same coverage, less new code, fewer drift risks.

## What Am I Missing

- **Assumption to question:** that our hooks can see what the harness classifier sees. They cannot. The classifier is upstream.
- **Would change my mind:** evidence that the harness classifier reads any project file other than `settings.json#permissions`. Or evidence that `permissions.allow` doesn't actually relax the default-branch-push block (testable on next push).
- **Dissent (Beta voice):** "You cannot disarm the harness from inside the harness. The only harness-native lever is permissions.allow. Everything else is theater."

## Framework Lens (MCCA Scoring)

Scores 1-5 (5 best) against the user-supplied criteria:

| Criterion (weight) | A: flag file | B: settings.allow | C: ctx header | D: hybrid A+C+hook | E: bulk perm rules |
|---|---|---|---|---|---|
| Closes harness-classifier pain | 1 | 4 | 1 | 2 | 4 |
| Closes our-hook pain | 4 | 1 | 2 | 5 | 1 |
| Harness-native | 1 | 5 | 1 | 2 | 5 |
| Revocable | 4 | 3 | 3 | 4 | 3 |
| TTL discipline | 5 | 1 | 4 | 5 | 2 |
| Token cost per turn | 4 | 5 | 3 | 3 | 5 |
| Maintenance surface | 3 | 4 | 3 | 2 | 4 |
| **Total / 35** | **22** | **23** | **17** | **22** | **24** |

Tight cluster. E wins on raw score but only covers harness. C is dominated. A and D tie.

## Zoom Out / Zoom In

**Out:** The real shape is *session-scoped sudo*. Harness-side sudo = `permissions.allow` (no TTL). Our-hook sudo = runtime flag file (native TTL). One skill toggles both.

**In:** Files touched: `.claude/settings.json#permissions.allow[]` (additive), `.claude/runtime/authorization.json` (created by skill, read by `merge-guard.js` + any other guard wanting to honor it), `.claude/commands/turbo.md` (new skill body).

## Decision

**Mechanism F — Hybrid (E + A, no new hook).**

- **Harness layer:** skill appends a curated pattern set to `.claude/settings.json#permissions.allow[]` (snapshots prior state for revoke).
- **Our-hook layer:** skill writes `.claude/runtime/authorization.json` with `{scopes, ttl_min, granted_at, reason}`. Existing guards (`merge-guard.js` first; others as needed) check this file at the top of their main path before BLOCK — if scope matches AND TTL alive, log + allow + continue.
- **No new PreToolUse hook needed** — existing guards read the flag file directly. This is the single design win over D.

**Confidence:** High.
**What changed from First Impulse:** dropped the new-hook surface; recognized that hooks can read the flag file themselves.
**Remaining uncertainty:** which exact `permissions.allow` glob strings the harness honors for each pattern (push-to-main, manifest-edit, Write-on-jsonl). Will require empirical test; ship a sane default and tune.

## Output Specification

### Skill name and tagline

`/turbo` — "Pre-authorize a session batch of high-impact actions. Alex shoots through without re-asking for the magic word."

Considered alternatives: `/yolo` (too cavalier for what's actually a scoped/timed sudo), `/full-send` (same), `/authorize` (boring, but clear), `/ramming-speed` (cute, not memorable in muscle memory). `/turbo` is punchy, short, and conveys "elevated throughput for a bounded window" — which is exactly what this is.

### Scope vocabulary

User picks any subset (or `all` for everything except the safety floor):

- `push-to-main` — `git push origin main` (NOT `--force`)
- `manifest-edit` — Edit/Write on `.claude/manifest.json`, `.claude/framework-manifest.json`, `.claude/framework-installed.json`
- `destructive-git` — `git reset --hard`, `git rm --cached -r`, `git clean -fd` (NOT `--force` push, NOT `branch -D`)
- `node-e-fs` — `node -e` with `fs.writeFileSync` / `fs.unlinkSync` (one-shot file writes; the merge-guard hook block)
- `write-jsonl` — `Write` tool on `*.jsonl` files (allows emitting empty/reset jsonl)
- `worktree-ops` — `git worktree add/remove`, embedded gitlink modifications

### Revoke mechanism

Three ways, all idempotent:

1. `/turbo --off` — restores settings.json from snapshot, deletes authorization.json
2. Auto-expiry — guards refuse the flag once `granted_at + ttl_min` < now
3. Manual — delete `.claude/runtime/authorization.json` and revert settings.json by hand (snapshot path written next to it)

### Default TTL

**60 minutes.** Long enough to ride out a multi-step push/release flow; short enough that forgetting `/turbo --off` does not leave the project unlocked overnight. Override via `--ttl 30m` / `--ttl 2h` / `--ttl until-session-end`.

### Safety floor (NEVER auto-authorized, regardless of scope/TTL)

- `git push --force origin main` (or `--force-with-lease` on main)
- `git push --delete origin <backup-branch>` or `git branch -D <backup-branch>` for any branch matching `backup/*` or `pre-*`
- Signing up for services or making purchases
- API calls with estimated total spend ≥ $5 (CLAUDE.md decision authority)
- Anything Beta returns ESCALATE on during sprint flows

These are denylisted in the skill itself; `/turbo --scope all` does NOT cover them. A user asking explicitly via natural language still falls back to the standard authorization protocol.

## Implementation Outline (5 Steps for /skills:create)

1. **Skill body** at `.claude/commands/turbo.md` with frontmatter `description: Pre-authorize a session-scoped batch of high-impact actions; Alex shoots through without per-action re-prompting`. Body accepts: `[--scope <csv>|all] [--ttl <duration>] [--reason "<text>"] [--off]`. Default scope = `push-to-main,manifest-edit,write-jsonl`. Default TTL = 60m.

2. **Settings mutator** (inline node block in skill body or sidecar `scripts/turbo/apply.js`): read `.claude/settings.json`, snapshot to `.claude/runtime/settings-pre-turbo.json`, additively merge a curated `permissions.allow[]` set keyed off scope. Idempotent. On `--off`, restore from snapshot.

3. **Flag file** at `.claude/runtime/authorization.json` with shape `{schema:"warpos/auth/v1", scopes:[…], ttl_min:60, granted_at:"ISO", expires_at:"ISO", reason:"<text>", snapshot_path:"<path>"}`. Skill writes; safety floor enforced at write time (drop denied scopes silently with a warning line).

4. **Guard integration** — add a shared helper `scripts/hooks/lib/authorization.js` exposing `isAuthorized(scope) → boolean`. Wire it into `merge-guard.js` (first), then `extension-edit-guard.js` and `framework-manifest-guard.js`. Pattern: at the top of each guard's BLOCK decision, if `isAuthorized(scope)` returns true, log `{type:"auth-bypass", scope, action, ttl_remaining_min}` to `paths.eventsFile` and return allow.

5. **Status + tests** — `/turbo --status` prints current scopes, TTL remaining, snapshot path. Smoke test: dispatch a one-shot subagent that runs `git push --dry-run origin main` + `Write` to a temp jsonl + a destructive-git dry run, with `/turbo` engaged for those scopes. Verify zero prompts surface. Log results to events.jsonl; learning entry on first real use.

## Trace persistence

This file: `.claude/project/sprint/sprints/_no-active-sprint/reasoning-auto-approval.md`
Trace line appended to: `.claude/project/memory/traces.jsonl` (id RT-003)

## Meta

- **Symptom or cause?** Cause. The pain is structural (no session-sudo primitive); the fix gives one.
- **Right framework?** Yes. MCCA fit the shape of the question; the 5-candidate matrix surfaced that Mechanism D over-built and Mechanism F (hybrid E+A, no new hook) hits the same coverage with less surface — a finding I would not have reached with Direct Investigation or 5 Whys.
- **Concern to flag:** before shipping, confirm empirically that `permissions.allow` actually relaxes the default-branch push block — if Anthropic's classifier ignores allow rules for cascade-protected actions, the harness half of Mechanism F degrades to "user still types yes for push-to-main but everything else flows" — still a 4/6 win, but worth knowing.
