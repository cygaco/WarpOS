# Granular Stories — Polish public-facing repo surface for job-application audience

**Sprint:** `SP-20260519-002`
**High-level stories:** `.claude/project/sprint/requirements/SP-20260519-002/high-level-stories.md`

> Granular stories use the `S-N` id convention. Each story produces one ticket.

## S-1 — Rewrite PROJECT.md to describe WarpOS

**As** the framework maintainer
**I want** `PROJECT.md` rewritten from scratch to describe WarpOS (not Jobzooka)
**So that** a hiring manager opening it understands what WarpOS is, and downstream consumer projects have a canonical example of what their own `PROJECT.md` should look like

Content scope:
- Project identity (what WarpOS is in 2-3 sentences)
- Architecture: Alex agent team (α/β/γ/δ) and build modes (solo/adhoc/oneshot)
- Key systems: paths registry, hooks pipeline, skills library, sprint workflow, learning/memory
- Conventions: `paths.X` references, agent dispatch via `scripts/dispatch-agent.js`, ledger discipline
- Provider routing (Claude for build, OpenAI for review, Gemini for security)
- Environment & dev: what `node`/git/CLI versions you need; how to install; key skills

Linked: `H-1`, `R-1`.
COPY: `C-1`.
INPUTS: `IN-1`.
TRACE: `TR-1`.

## S-2 — Update README.md version, skill count, hook count, and audit skill catalog

**As** the framework maintainer
**I want** the README's headline numbers updated to match the actual repo state
**So that** a recruiter doesn't catch the framework lying in its own first paragraph

Concrete edits:
- `Version: 0.2.0` → `Version: 0.8.0` (or "see version.json")
- `95 skills` → `~140 skills` (verified count: `139` `.md` files under `.claude/commands/`)
- `52 automated hooks` → `57 hooks (54 enabled)` (from `framework/hooks.registry.json`)
- Skill catalog `<details>` table: audit against current `.claude/commands/`; either prune deleted entries + add new ones, or replace with a one-line "See `/skills:list` for the live catalog."
- Add a "Last verified" footer date so future drift is visible.

Linked: `H-2`, `R-2`.
COPY: `C-2`.
INPUTS: `IN-2`.
TRACE: `TR-2`.

## S-3 — Delete WarpOS.md (after inbound-reference check)

**As** the framework maintainer
**I want** `WarpOS.md` deleted, after verifying nothing critical links to it
**So that** the repo root no longer carries a doc that contradicts the README

Steps:
1. Grep for `WarpOS.md` (case-sensitive) and `WARP — The Machine` (the title) across `.claude/commands/`, `.claude/agents/`, `scripts/hooks/`, `_requirements/`, and top-level docs.
2. If any inbound reference exists in machine-relevant content (skills, hooks, agent specs), either update the reference OR convert `WarpOS.md` to a short stub pointing to the appropriate canonical doc.
3. If only README/docs link to it, update those links and delete the file.
4. Commit deletion as part of the cleanup pass.

Linked: `H-3`, `R-3`.
COPY: `C-3`.

## S-4 — AGENTS.md cross-reference cleanup

**As** the framework maintainer
**I want** `AGENTS.md`'s link to `PROJECT.md` to make sense post-S-1
**So that** clicking the "Project-specific context" link from AGENTS.md lands on a doc that describes WarpOS

Steps:
1. After S-1 lands, re-read `AGENTS.md` against the new `PROJECT.md`.
2. Update any line that no longer fits (the "Project-specific context (product, architecture, env)" description is generic enough to survive; verify).
3. Ensure no AGENTS.md link is broken.

Linked: `H-3`, `R-4`.

## S-5 — Repo-root working-artifact cleanup (4 files)

**As** the framework maintainer
**I want** the repo root to stop carrying files that look like in-progress drafts
**So that** the file list reads as a shipped product

Per-file disposition:
- **`DUMP.md` (17KB session handoff)** — DELETE. It's regenerable via `/session:dump` and should not be committed; add `DUMP.md` to `.gitignore` if not already there.
- **`DICTIONARY.md` (1 entry)** — FLESH OUT to 5+ entries from current sprint vocabulary (Sprint, Plan Contract, Routing policy, Beta consultation, Ledger discipline, Capsule, Forcing function). Keeps the file but makes it look intentional.
- **`warpos-to-update.md`** — KEEP at root (it's `the warposFlagLedger surface (retired in SP-20260522-001)`, bound to `/warp:flag` and `/warp:promote-flags`) but ADD a header callout explaining "This file is auto-managed by /warp:flag; see the warposFlagLedger surface (retired in SP-20260522-001)." So a reader doesn't take it for an abandoned draft.
- **`issues.md`** — KEEP at root (it's `paths.sprintIssuesLedger`, written by `scripts/sprint/issue.js`) but ADD a header callout explaining its role.

Linked: `H-4`, `R-5`.
COPY: `C-5`.

## S-6 — Fix version.json releasedAt; log recurring issue

**As** the framework maintainer
**I want** `version.json#releasedAt` to reflect the actual `0.8.0` deployment date
**So that** machine-readable metadata matches RELEASES.md

Steps:
1. Update `version.json#releasedAt` from `2026-05-14` to `2026-05-19`.
2. Add a recurring-issue entry to `paths.recurringIssuesFile`: "release-canonical.js skipped `releasedAt` update on 0.8.0 cut — investigate auto-update path; either the field is not written or was written from a stale clock."

Linked: `H-5`, `R-6`.
TRACE: `TR-3`.

## S-7 — USER_GUIDE.md targeted drift sweep (optional / time-permitting)

**As** the framework maintainer
**I want** any blatantly wrong skill/mode references in USER_GUIDE.md fixed
**So that** a recruiter clicking in doesn't catch the guide referring to skills that don't exist

Constraints:
- Targeted, not a rewrite. Cap at 30 minutes of effort.
- Use `/check:references` if available; otherwise spot-check the "5 Core Skills" table and the modes section against current `.claude/commands/`.
- Defer to a future sprint if a real audit is needed.

Linked: `H-6`, `R-7`.
