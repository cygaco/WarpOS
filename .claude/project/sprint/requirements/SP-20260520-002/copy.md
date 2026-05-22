# COPY Requirements — /product:import

**Sprint:** `SP-20260520-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260520-002/prd.md`

> COPY captures user-visible text the skill emits. Entries are guides for the implementer, not literal strings — voice matches `/product:bootstrap` (direct, no marketing, no emoji). Keep ids stable so tickets can link to specific copy blocks.

## C-1 — Help text / synopsis (linked stories `S-1`)

**Context:** Printed when the operator runs `/product:import --help` and as the opening synopsis when the script is invoked with no arguments under the harness.

**Text (guide, not literal):**

> /product:import — Generate a paste-friendly questionnaire from this project's context, suitable for handing to another AI session (Claude Code, Codex, Claude web, ChatGPT, or Gemini).
>
> The answers come back as Markdown and parse cleanly into `/product:bootstrap --answers-file`.
>
> Usage: /product:import [--slug <name>] [--section-set minimal|extended] [--output-dir <path>] [--no-introspect] [--parse <pasted-answers.md>] [--for <surface-hint>]
>
> Intended as a pre-step to /product:bootstrap when the product's source-of-truth lives in another session or tool.

**Notes:** Mirrors `bootstrap.js#printHelp` voice. No emoji. No "powerful"/"intelligent"/"AI-driven" framing.

## C-2 — Pre-introspection notice (linked story `S-1`)

**Context:** Printed once at the top of the run, before any file reads.

**Text (guide, not literal):**

> Building a questionnaire for `<slug>`. Reading PROJECT.md, README.md, package.json, and the last 10 commit subjects to seed the preamble. Pass `--no-introspect` to skip this step.

**Notes:** Sets the operator's expectation that the skill is going to touch four specific files. No surprise reads.

## C-3 — "No PROJECT.md detected" warning (linked story `S-2`)

**Context:** Printed when introspection runs and `PROJECT.md` is absent (very common — this is a NEW project, by definition, or a converted one).

**Text (guide, not literal):**

> No PROJECT.md found at the project root. That's expected for a fresh import — the questionnaire will lean on README.md, package.json, and recent commits instead. If you want richer grounding, write a one-paragraph PROJECT.md and re-run.

**Notes:** Frames the absence as expected, not an error. Offers the operator one concrete action (`write a one-paragraph PROJECT.md`) without demanding it.

## C-4 — Introspection summary (linked story `S-2`)

**Context:** Printed after introspection completes, before the questionnaire is drafted. Shows the operator what was found so the preamble's grounding is auditable.

**Text (guide, not literal):**

> Introspection complete:
>   • PROJECT.md: present (3.2KB) / absent
>   • README.md: present (1.1KB) / absent
>   • package.json: present, name=`<package-name>`, 4 deps / absent
>   • git log -n 10: 10 subjects collected / git unavailable

**Notes:** One line per source. Present/absent + a tiny bit of metadata. Never echoes raw file content back at the operator.

## C-5 — Parse-mode success (linked story `S-8`)

**Context:** Printed at the end of a successful `--parse` run.

**Text (guide, not literal):**

> Parsed `<pasted-answers.md>`:
>   • Sections matched: 8 / 8 (minimal) / 12 / 12 (extended)
>   • Status: 7 drafted, 1 skipped_declined
>   • Wrote: `_docs/imports/<slug>/<slug>.answers.json`
>
> Next: `/product:bootstrap --answers-file _docs/imports/<slug>/<slug>.answers.json`

**Notes:** The "Next" line is the load-bearing copy — it closes the round-trip loop visibly so the operator knows what to do next without thinking.

## C-6 — Parse-mode failure: missing sections (linked story `S-8`)

**Context:** Printed when `--parse` runs but the pasted file is missing one or more required sections (anchor `<!-- section: <id> -->` absent OR present but with empty body).

**Text (guide, not literal):**

> Parse failed: `<pasted-answers.md>` is missing required sections:
>   - problem
>   - wedge
>
> Each section must be present with its `<!-- section: <id> -->` anchor and non-empty body. Either re-paste the missing sections into the file (keep the anchors verbatim) and re-run, or drop them explicitly with the literal text `_skipped — operator declined to answer this section._` under the anchor.
>
> No `answers.json` was written.

**Notes:** Concrete list of which sections are missing (not a generic "validation failed"). Two explicit recovery paths. The "no answers.json was written" line prevents the operator wondering whether they have a half-written file on disk.

## C-7 — Paste-friendly tail instruction (linked stories `S-3`, `S-4`)

**Context:** The last block of the emitted questionnaire MD. Tells the answering session how to format its reply so the parser succeeds.

**Text (guide, not literal):**

> ---
>
> ## How to reply
>
> Please reply with one Markdown file. For each section above, keep the `## NN — Title` heading **and** the `<!-- section: <id> -->` anchor **verbatim**, then write your answer underneath. The literal anchor comment is how this questionnaire is parsed when the answers come back — if it's missing, your section will be dropped.
>
> Plain Markdown is fine. No need for code fences. If you have nothing to say for a section, leave the heading and anchor in place and write exactly: `_skipped — operator declined to answer this section._`
>
> When you're done, paste the entire reply back into a file in the originating project and run:
>
> `node scripts/product/import.js --parse <path-to-pasted.md> --slug <slug>`

**Notes:** This is the most rendering-sensitive block in the whole sprint. The H3 + anchor convention is the contract; the explicit `_skipped — …_` phrasing matches what `bootstrap.js#runCoverageQc` already treats as `skipped_declined`.

## C-8 — Questionnaire-emitted summary (linked stories `S-1`, `S-5`)

**Context:** Printed at the end of a successful run (no `--parse`).

**Text (guide, not literal):**

> Questionnaire ready at `_docs/imports/<slug>/`:
>   • Markdown: `<slug>.questionnaire.md` (8 sections, ~3.8KB)
>
> `paths.importsCurrent` now points here.
>
> Next steps:
>   1. Paste the contents into your other session (Claude Code, Codex, Claude web, ChatGPT web, Gemini web).
>   2. Bring the reply back into this project.
>   3. Run `node scripts/product/import.js --parse <reply.md> --slug <slug>` to convert it to `answers.json`.
>   4. Run `/product:bootstrap --answers-file _docs/imports/<slug>/<slug>.answers.json`.

**Notes:** The 4-step "Next steps" is the load-bearing block. Without it the operator stares at a generated file and asks "now what?".

## C-9 — `paths.json` registration confirmation (linked story `S-5`)

**Context:** Printed once, on first successful emit per project, when `paths.imports` and `paths.importsCurrent` are added to `.claude/paths.json`.

**Text (guide, not literal):**

> Registered new paths keys:
>   • `paths.imports` → `_docs/imports`
>   • `paths.importsCurrent` → `_docs/imports/<slug>`
>
> Downstream skills that consume the questionnaire (or its answers) can now resolve these via `paths.json`.

**Notes:** Quiet, informational. Suppressed on subsequent runs (those only update `importsCurrent` and don't reprint the registration banner).
