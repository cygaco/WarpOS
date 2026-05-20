# PRD — Polish public-facing repo surface for job-application audience

**Sprint:** `SP-20260519-002`
**Plan Contract:** `PC-20260520-0016`
**Status:** designed
**Documentation scale:** `m`

## Outcome

When a recruiter or hiring manager opens https://github.com/cygaco/WarpOS during a job-application review, they see a coherent, credible portfolio artifact. Every top-level `.md` they might open reinforces the same picture: **WarpOS is an AI operating system for Claude Code** — a multi-agent team (Alex α/β/γ/δ), a registry of skills/hooks/agents, an enforced sprint workflow, and learning/memory infrastructure. No file describes a different product. No file claims wrong version numbers. No file looks abandoned mid-edit.

## Context

### Original Request

> Much of the GitHub repo is stale, such as PROJECT.md (still talks about Jobzooka). Review it and create a /sprint:plan to get it updated so I can send it with a job application.

### Interpreted Intent

Polish the public-facing surface of `cygaco/WarpOS` so a hiring manager opening any top-level `.md` gets a coherent, current, on-message picture of what WarpOS is. Fix `PROJECT.md` (stale Jobzooka content), reconcile `README.md` version + skill/hook counts with reality (`0.8.0`, `139` skills, `57` hooks), resolve `WarpOS.md`'s misleading studio-stack framing, and clean leftover working files (`DUMP.md`, `warpos-to-update.md`, `issues.md`, near-empty `DICTIONARY.md`) out of the repo root. Doc-only sprint — no underlying code changes.

### Current Behavior

Top-level `.md` surface is incoherent for a public audience:
- `PROJECT.md` describes Jobzooka entirely (Next.js 16, React 19, Bright Data, Stripe, Chrome extension) — zero WarpOS content.
- `README.md` claims `Version: 0.2.0` but `version.json` is `0.8.0`; claims `95 skills` (actual `139`) and `52 hooks` (actual `57`).
- `WarpOS.md` frames the project as a "studio OS" with a Next.js + Supabase + Stripe stack — that's the *consumer product* layer, not WarpOS.
- Four files (`DUMP.md`, `warpos-to-update.md`, `issues.md`, `DICTIONARY.md`) look like in-progress working artifacts.

The repo IS technically credible (8 minor releases, 14 sprints shipped, real architecture) but the front door doesn't convey it.

### Desired Behavior

Every top-level `.md` is current, on-message, and free of contradictions. A recruiter reading the README, PROJECT.md, AGENTS.md, or any other top-level doc gets the same picture of WarpOS. The repo root contains no working artifacts that look abandoned.

## Requirements

> Uses the `R-N` id convention enforced by `scripts/hooks/requirement-format-guard.js`.

- **`R-1`** — `PROJECT.md` describes WarpOS itself (not Jobzooka). It is the canonical project-context doc and is shipped to downstream installs as a template.
- **`R-2`** — `README.md` version, skill count, and hook count match the actual repo state at sprint close.
- **`R-3`** — `WarpOS.md` is resolved: either deleted (decision: delete — README already covers the overview) or rewritten so it does not contradict the README.
- **`R-4`** — `AGENTS.md` cross-references to `PROJECT.md` resolve correctly after `R-1` lands.
- **`R-5`** — Repo root contains no working artifacts that look abandoned mid-edit: `DUMP.md`, `DICTIONARY.md` resolved (delete or flesh out); `warpos-to-update.md` and `issues.md` either kept-with-header-callout or moved (decision recorded in design).
- **`R-6`** — `version.json#releasedAt` reflects the actual deployment date of the current version (`0.8.0` deployed `2026-05-19`); recurring-issue logged for why `release-canonical.js` skipped this on the 0.8.0 cut.
- **`R-7`** — (optional) `USER_GUIDE.md` blatant drift fixed without a full rewrite.

## Design decisions (resolved)

These two were flagged in the Plan Contract as `needs_user_or_beta_review`. Resolved here per the scope variant the user effectively endorsed by saying "Proceed through plan → design → tickets, then pause for my approval before execute":

- **D-1 — `PROJECT.md` fate: REWRITE.** Reason: the file is referenced from the shipped `CLAUDE.md` scaffold, so downstream consumers expect a `PROJECT.md` template to fill in. Deleting it would either orphan the link in `CLAUDE.md` (which we're told not to modify) or require a CLAUDE.md edit (out of scope). Rewriting it to describe WarpOS itself doubles as the canonical example for what a `PROJECT.md` should look like in a downstream install. Reversal cost: low (re-delete if we change our mind).
- **D-2 — `WarpOS.md` fate: DELETE.** Reason: README.md already covers the overview, and `WarpOS.md`'s studio framing actively contradicts it (claims a Next.js + Supabase + Stripe stack that isn't WarpOS). Keeping it costs credibility; rewriting it duplicates the README; renaming it just buries the contradiction. Verification step in ticket: grep for inbound references in `.claude/commands/`, `.claude/agents/`, `scripts/hooks/`, and top-level docs before deletion.

## Affected Surfaces

| Surface | Evidence | Disposition |
|---|---|---|
| `PROJECT.md` | verified_from_repo | rewrite (D-1) |
| `README.md` | verified_from_repo | update version + counts + audit catalog |
| `WarpOS.md` | verified_from_repo | delete (D-2, after inbound-ref check) |
| `AGENTS.md` | verified_from_repo | confirm links resolve after R-1 |
| `DUMP.md` | verified_from_repo | delete (it's a regenerable handoff) |
| `DICTIONARY.md` | verified_from_repo | flesh out with sprint vocab (5 entries) |
| `warpos-to-update.md` | verified_from_repo | keep at root + add header callout (paths.warposFlagLedger binding) |
| `issues.md` | verified_from_repo | keep at root + add header callout (paths.sprintIssuesLedger binding) |
| `RELEASES.md` | verified_from_repo | out of scope (recommended scope variant excludes ledger.js extension) |
| `USER_GUIDE.md` | inferred_from_repo | targeted drift sweep, optional |
| `version.json` | verified_from_repo | fix releasedAt; log recurring issue |
| `ROADMAP.md` | verified_from_repo | out of scope (current as of yesterday) |

## Non-Goals

- Do NOT refactor any underlying skill, hook, agent, or script.
- Do NOT add screenshots, demo videos, or marketing visuals.
- Do NOT modify `CLAUDE.md` (shipped to every downstream WarpOS install).
- Do NOT write a `LICENSE` file (README's "Private. Shared by invitation." is deliberate).
- Do NOT rewrite `ROADMAP.md`.
- Do NOT turn the README into marketing copy — keep the existing voice.
- Do NOT ship the `RELEASES.md` date-backfill `ledger.js` extension (deferred to a later sprint).

## External Service Dependencies

None. Pure-documentation sprint.

## Approval Boundaries

- Execute: user approval required before `/sprint:execute` runs (per the Plan Contract's `approval_boundaries[0]`). User explicit directive: "pause for my approval before execute."
- Release: standard production-deploy approval per `CLAUDE.md#Autonomy` applies to `/sprint:release`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260520-0016.yaml`
- High-level stories: `.claude/project/sprint/requirements/SP-20260519-002/high-level-stories.md`
- Granular stories: `.claude/project/sprint/requirements/SP-20260519-002/granular-stories.md`
- COPY: `.claude/project/sprint/requirements/SP-20260519-002/copy.md`
- INPUTS: `.claude/project/sprint/requirements/SP-20260519-002/inputs.md`
- TRACE: `.claude/project/sprint/requirements/SP-20260519-002/trace.md`
- Acceptance criteria: `.claude/project/sprint/requirements/SP-20260519-002/acceptance-criteria.md`
- QA plan: `.claude/project/sprint/requirements/SP-20260519-002/qa-plan.md`
- Redteam plan: `.claude/project/sprint/requirements/SP-20260519-002/redteam-plan.md`
- Release plan: `.claude/project/sprint/requirements/SP-20260519-002/release-plan.md`
