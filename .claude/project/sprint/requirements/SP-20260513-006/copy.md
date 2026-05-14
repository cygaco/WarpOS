# COPY Requirements — Turbo as mode argument

**Sprint:** `SP-20260513-006`
**PRD:** `prd.md`

User-visible text. Since the change is mostly documentation, COPY here is the strings the skill bodies print/declare and the strings the operator sees when the composed invocation runs.

## C-1 — Skill-body Inputs heading (linked story `S-1`)

**Context:** Top of each `/mode:X` skill body.
**Text:**

> ## Inputs
>
> `/mode:<mode> [--turbo [--scope <csv>|all] [--ttl <duration>] [--reason "<text>"]]`
>
> Without `--turbo`, the skill behaves as before. With `--turbo` and no further args, the per-mode default scope is applied (see Defaults below).

**Notes:** Identical wording across all three mode skills.

## C-2 — Per-mode defaults heading (linked story `S-2`)

**Context:** Inside each `/mode:X` skill body.
**Text (solo):**

> ### Default turbo scope
>
> `safe-edit` — file edits, lint, tests. No push, no deploy. TTL = 60m.

**Text (adhoc):**

> ### Default turbo scope
>
> `builder-friendly` — file edits, lint, tests, npm scripts, git commit. No push, no deploy. TTL = 60m.

**Text (oneshot):**

> ### Default turbo scope
>
> `delta-friendly` — everything in `builder-friendly` plus dispatch-agent reads and Bash for npm/test. No push, no deploy. TTL = 4h (matches a typical Delta run).

**Notes:** Operator-supplied flags override every field.

## C-3 — Recovery line (linked story `S-4`)

**Context:** Recovery section in each `/mode:X` skill body.
**Text:**

> ### Recovery
>
> - If `mode-set` succeeded but `turbo apply` failed: mode is active without turbo. Re-run `/turbo` manually with the same args (or different ones).
> - If turbo was already active when you ran `/mode:<mode> --turbo`: `scripts/turbo/apply.js` overwrites the prior scope/TTL with the new one (no merge). Run `/turbo --status` first if you need to preserve what's already there.

**Notes:** No fancy fallback; tell the operator what's true and what to do. Beta-suggested 2026-05-14.

## C-4 — Composition note in `/turbo.md` (linked story `S-5`)

**Context:** Top of `.claude/commands/turbo.md` (Description or first paragraph after the frontmatter).
**Text:**

> Also invoked by `/mode:<solo|adhoc|oneshot>` when `--turbo` is passed; see those skill bodies for per-mode default scopes.

**Notes:** One sentence. No bullet list.
