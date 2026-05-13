# COPY Requirements — /product:bootstrap skill — guided product brief in MD/HTML/DOCX

**Sprint:** `SP-20260513-001`
**PRD:** `prd.md`

> COPY captures user-visible text and content expectations. Each entry
> is a concrete string the product will display, with context. Keep
> ids stable so tickets can link to specific copy blocks.

## C-1 — Skill help text (linked story `S-1`)

**Context:** Shown when the operator runs `/product:bootstrap --help` or when the skill is enumerated.
**Text:**

> `/product:bootstrap` — Bootstrap a thorough product brief from a guided discussion.
>
> Walks through 4–8 questions covering problem, jobs-to-be-done, value chain, competitive landscape, wedge, vision, wedge→full-vision arc, and MVP. Emits MD + HTML (always) and DOCX (when pandoc is installed) to `_docs/briefs/<slug>/`.
>
> Usage: `/product:bootstrap [--slug <name>] [--section-set minimal|extended] [--docx-backend auto|pandoc|none] [--output-dir <path>] [--rerun-policy overwrite|version|prompt]`
>
> Intended as the first command run in a new project.

**Notes:** Keep under 12 lines; this is the at-a-glance summary, not the manual.

## C-2 — Discussion greeting (linked story `S-1`, `S-2`)

**Context:** First message shown when the skill starts, before any AskUserQuestion turn.
**Text:**

> Bootstrapping your product brief. I'll ask 4–8 focused questions covering problem, JTBDs, value chain, competitive landscape, wedge, vision, and MVP. After that I'll draft the brief, run coverage QC, and write MD + HTML (and DOCX if pandoc is on PATH) to `_docs/briefs/<slug>/`. Ready when you are.

**Notes:** Tone: confident, direct, lightly conversational. Matches the ai-web-brief-v4 voice (assured, no hedging).

## C-3 — Per-section discussion prompts (linked story `S-2`)

**Context:** AskUserQuestion prompts, one per section. Operator may answer multiple sections in one reply; budget is the constraint, not the prompt count.

| Section | Prompt |
|---|---|
| Problem | "In one or two sentences, what's the problem this product solves, and who has it acutely?" |
| JTBDs | "What jobs is the user trying to get done when they hit this problem? List the two or three most load-bearing." |
| Value chain | "Who's already in the value chain for this need — vendors, intermediaries, end users — and where do you sit?" |
| Competitive | "Closest two or three alternatives users currently reach for, and the one thing each gets wrong for your user." |
| Wedge | "What's the smallest, sharpest entry point into this market — the wedge a single team could execute?" |
| Vision | "If the wedge works, what does the full product look like in three years?" |
| Wedge → Full vision | "What's the bridge from wedge to full vision — the two or three steps in between?" |
| MVP | "What's the leanest thing you could ship in 8 weeks to validate the wedge?" |

**Notes:** Prompts are seeded but the generator may rephrase based on prior answers to keep within budget. If an operator answers multiple sections in one turn, the generator does not re-ask.

## C-4 — Section titles in the brief (linked stories `S-3`, `S-4`)

**Context:** The `## NN — <Title>` headings rendered in MD/HTML. Numbering follows ai-web-brief-v4.

> - `## 01 — Problem`
> - `## 02 — Jobs to be Done`
> - `## 03 — Value Chain`
> - `## 04 — Competitive Landscape`
> - `## 05 — Wedge`
> - `## 06 — Vision`
> - `## 07 — Wedge to Full Vision`
> - `## 08 — MVP`
>
> Extended set adds:
> - `## 09 — Bear Case`
> - `## 10 — Bull Case`
> - `## 11 — Quick Notes`
> - `## 12 — References`

**Notes:** Stable headings let downstream tooling (sprint planning, retrospectives) parse by section.

## C-5 — Pandoc missing message (linked story `S-5`)

**Context:** Shown when `--docx-backend auto` (default) runs and pandoc is not found on PATH.
**Text:**

> DOCX skipped — pandoc not found on PATH. Markdown and HTML are ready at `_docs/briefs/<slug>/`. To enable DOCX, install pandoc:
>   • Windows: `winget install --id JohnMacFarlane.Pandoc` or `choco install pandoc`
>   • macOS:   `brew install pandoc`
>   • Linux:   `apt install pandoc` / `dnf install pandoc`
> Then re-run with `--docx-backend pandoc` (or just `/product:bootstrap` — auto will pick it up).

**Notes:** Exit code is still 0. This is informational, not an error.

## C-6 — Slug invalid message (linked story `S-6`)

**Context:** Shown when the operator supplies a slug that fails validation.
**Text:**

> Slug `<value>` is not valid. Slugs must start with a lowercase letter or digit, contain only lowercase letters, digits, and hyphens, and be 1–64 characters. Examples: `agentic-web`, `tax-cpa-agent`, `warpos-core`.

**Notes:** Halts the run with exit code 2 (input error). Suggests a normalized slug if the input is close.

## C-7 — Coverage QC failure (linked story `S-2`)

**Context:** Shown when, after the discussion, one or more sections are empty and cannot be drafted.
**Text:**

> Brief coverage check failed. The following sections have no usable content:
>   <list of section names>
> No files were written. You can either: re-run and answer the prompts for those sections, or pass `--section-set minimal` to drop optional sections.

**Notes:** Halts with exit code 3. Coverage QC runs before any file write so partial briefs never reach disk.

## C-8 — Brief emitted success summary (linked stories `S-3`–`S-7`)

**Context:** Final success message after writes complete.
**Text:**

> Brief ready at `_docs/briefs/<slug>/`:
>   • MD:   `<slug>.brief.md`
>   • HTML: `<slug>.brief.html`
>   • DOCX: `<slug>.brief.docx`  (or "skipped — pandoc not found")
>
> `paths.briefsCurrent` now points here. Next commands that read it: `/sprint:plan`, `/oneshot:start`.

**Notes:** Lists exactly what was emitted. If DOCX was skipped, replace the third bullet with the skip reason.

## C-9 — Rerun policy prompt (linked story `S-6`)

**Context:** Shown when `--rerun-policy prompt` (or first re-run with default) detects an existing brief for the slug.
**Text:**

> A brief already exists at `_docs/briefs/<slug>/`. What should I do?
>   1. Version the previous brief into `<slug>/history/<ISO>/` and write fresh files. (default)
>   2. Overwrite without history.
>   3. Cancel.

**Notes:** AskUserQuestion form. Default = 1 (version). Operator can suppress this prompt by passing `--rerun-policy version` or `--rerun-policy overwrite`.

## C-10 — Output dir locked / unwritable (linked story `S-6`)

**Context:** Shown when the output directory cannot be written (permissions, file lock from another process, antivirus).
**Text:**

> Cannot write to `<output-dir>`: <reason>. Common causes: directory is open in another program, antivirus is holding files, or the path is read-only. Free the directory and re-run, or pass `--output-dir <other-path>`.

**Notes:** Halts with exit code 4 (IO error). Does not retry automatically.
