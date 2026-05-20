# COPY Requirements — Polish public-facing repo surface for job-application audience

**Sprint:** `SP-20260519-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260519-002/prd.md`

> COPY captures user-visible text expectations for the new doc content. These are guides for the writer, not literal strings — voice matches existing README/CLAUDE.md.

## C-1 — PROJECT.md opening lines (linked story `S-1`)

**Context:** The first three lines a hiring manager reads when opening `PROJECT.md` from the GitHub file list. Must immediately disambiguate from Jobzooka and match the README's framing.

**Text (guide, not literal):**

> # WarpOS — Project Context
>
> Project-specific context for WarpOS itself. For the framework instructions an agent operates under, see [CLAUDE.md](CLAUDE.md). For the agent system router, see [AGENTS.md](AGENTS.md).
>
> ## What WarpOS is
>
> WarpOS is an AI operating system for Claude Code. It gives a single developer a multi-agent engineering team (Alex α/β/γ/δ), a registry of slash-command skills, a pipeline of automated hooks, and a sprint workflow that turns plain-language requests into shipped, reviewed, traceable changes.

**Notes:** Keep the existing CLAUDE.md voice (direct, no-marketing). No emoji. No "revolutionary"/"powerful"/"intelligent" framing.

## C-2 — README version + counts header (linked story `S-2`)

**Context:** The "Platform / Version" header block of `README.md`. Needs to read accurately as of sprint close.

**Text (guide, not literal):**

> **Platform:** Windows only (for now)
> **Version:** 0.8.0
> **Skills:** ~140 slash commands
> **Hooks:** 57 automated hooks (54 enabled by default)
>
> _Last verified: 2026-05-19_

**Notes:** The "Last verified" line is the durability hook — future drift will be visible by date.

## C-3 — Deletion commit message for WarpOS.md (linked story `S-3`)

**Context:** Commit message for `git rm WarpOS.md`.

**Text (guide, not literal):**

> docs: remove WarpOS.md — superseded by README
>
> WarpOS.md described a "studio OS" framing with a Next.js + Supabase + Stripe consumer-product stack. That is not WarpOS — it is the stack a downstream product might be built on. README.md is the canonical overview.
>
> Inbound references verified clear (see grep in ticket T-…). No paths.json binding.

**Notes:** Explicit about why removing rather than rewriting, so the deletion reads as deliberate in `git log`.

## C-5 — Header callouts for `warpos-to-update.md` and `issues.md` (linked story `S-5`)

**Context:** Two-line preamble added to the top of each kept-at-root tracker file so a casual reader does not mistake them for abandoned drafts.

**Text (guide, not literal) — `warpos-to-update.md`:**

> # WarpOS Update Flags
>
> > **What this is.** This file is `paths.warposFlagLedger` — an auto-managed ledger of framework improvements discovered while using WarpOS in a consumer project. Drained upstream by `/warp:promote-flags`. Lives at repo root because the `paths.json` binding points here. Do not move without updating `paths.json` and grepping for callers.

**Text (guide, not literal) — `issues.md`:**

> # Issues — WarpOS
>
> > **What this is.** This file is `paths.sprintIssuesLedger` — a lightweight human-readable issue ledger kept in sync with per-issue YAML files under `.claude/project/sprint/issues/` by `scripts/sprint/issue.js`. Lives at repo root because the `paths.json` binding points here.

**Notes:** Header callouts use blockquote `>` so they stand visually apart from the existing content; they don't replace any existing text.
