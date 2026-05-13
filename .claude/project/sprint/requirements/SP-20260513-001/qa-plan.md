# QA Plan — /product:bootstrap skill — guided product brief in MD/HTML/DOCX

**Sprint:** `SP-20260513-001`
**PRD:** `prd.md`

> Sprint v0.1 QA plan. Honored by `/sprint:execute` (mid-sprint checks)
> and `/sprint:release` (final QA gate). Diff-model review on QA is
> declared in `paths.sprintRouting` (`qa.diff_review: true`).

## Smoke checks

- [ ] `/product:bootstrap --help` exits 0 and prints `copy.md#C-1`.
- [ ] Golden-path run with a known slug + scripted answers produces MD + HTML in the expected location.
- [ ] `events.jsonl` contains `brief_started`, N×`section_completed`, `brief_emitted` after a golden run.

## Per-story QA

### S-1 — Skill scaffold
- [ ] AC-S-1.1 verified
- [ ] AC-S-1.2 verified
- [ ] AC-S-1.3 verified
- [ ] Regression: `/sprint:plan` and `/sprint:design` still discoverable after `/product:` namespace is added.

### S-2 — Discussion flow
- [ ] AC-S-2.1 verified
- [ ] AC-S-2.2 verified
- [ ] AC-S-2.3 verified
- [ ] Regression: AskUserQuestion patterns elsewhere in the framework unaffected.

### S-3 — MD writer
- [ ] AC-S-3.1 verified
- [ ] AC-S-3.2 verified
- [ ] AC-S-3.3 verified
- [ ] Regression: no other Markdown emitters in scripts/ changed.

### S-4 — HTML writer
- [ ] AC-S-4.1 verified
- [ ] AC-S-4.2 verified
- [ ] AC-S-4.3 verified (visual review)
- [ ] Regression: existing HTML in `_docs/ai-web-brief-v4.html` unchanged.

### S-5 — DOCX writer
- [ ] AC-S-5.1 verified on a machine with pandoc.
- [ ] AC-S-5.2 verified on a machine without pandoc (or with PATH stripped in test).
- [ ] AC-S-5.3 verified.
- [ ] AC-S-5.4 verified.
- [ ] Regression: no new npm dep added (defense of D-2).

### S-6 — Output path policy
- [ ] AC-S-6.1 through AC-S-6.6 verified.
- [ ] Regression: nothing under `_docs/` outside `_docs/briefs/` is touched.

### S-7 — paths.json registration
- [ ] AC-S-7.1 through AC-S-7.4 verified.
- [ ] Regression: existing `paths.json` keys (eventsFile, learningsFile, etc.) unchanged byte-for-byte except for the new additions.

### S-8 — Integration
- [ ] AC-S-8.1 through AC-S-8.3 verified.
- [ ] Regression: `/warp:tour` and other onboarding commands still work.

## Seven failure-mode personas

### FM-1 — Timeout
- [ ] AskUserQuestion times out (operator goes idle): run is canceled cleanly, no partial files written, `brief_emitted` event with `outcome=failure` fires.
- [ ] Pandoc subprocess hangs >30s: subprocess killed, DOCX status = `error:pandoc_timeout`, MD + HTML still land.
- [ ] PATH probe (`where`/`which pandoc`) hangs >2s: treated as absent, run continues.

### FM-2 — Empty input
- [ ] Operator submits an empty answer for a section: re-prompted once per IN-6; if still empty, section marked `skipped_declined`.
- [ ] All sections skipped: coverage QC fails, `copy.md#C-7` printed, no files written.
- [ ] `--slug ""` passed: validation fails fast with `copy.md#C-6`.

### FM-3 — Retry storm
- [ ] Operator hits Ctrl+C during the discussion: process exits cleanly within 2s, no partial files written, `brief_emitted` with `outcome=failure` if started.
- [ ] Operator re-runs immediately after a successful run with default policy: prior brief versioned, no race on `history/<ISO>/` even if invocations are <1s apart (timestamp uses ms precision).

### FM-4 — Race
- [ ] Two `/product:bootstrap` invocations with the same slug start concurrently: the later one detects the in-flight lock file or atomic-write conflict and exits with a clear message; no corrupted MD/HTML on disk.
- [ ] paths.json updated mid-run by an external process: the generator's update uses read-modify-write with an exclusive lock; concurrent updates either serialize cleanly or one exits with a retry hint.

### FM-5 — Partial write
- [ ] MD writes successfully but HTML write fails (e.g. disk full mid-write): run exits with `outcome=partial`, the partial HTML is removed (atomic write via tmp+rename), MD is left in place, paths.json is NOT updated (registration is all-or-nothing).
- [ ] DOCX write fails after MD+HTML succeed: run exits 0, `brief_emitted.formats.docx` is `error:<reason>`, paths.json IS updated (MD+HTML are sufficient).

### FM-6 — Encoding
- [ ] Operator answer contains emoji + RTL + CJK: written verbatim to MD/HTML, valid UTF-8, no mojibake; pandoc DOCX path handles via `--from markdown --to docx` defaults.
- [ ] Operator answer contains a BOM: stripped at input boundary (IN-6).
- [ ] Operator answer contains ANSI escapes from a paste: stripped at input boundary (IN-6).
- [ ] Slug normalization handles Unicode-letter characters (accented letters): normalized to ASCII via NFKD + strip-non-ASCII; if the result is empty, fail per IN-1.

### FM-7 — Recovery
- [ ] Re-run after a failed run resumes cleanly: no leftover lock files block the new run after 30s; lock TTL respected.
- [ ] Re-run after a versioning run validates that `<slug>/history/<ISO>/` is intact and the prior file is recoverable.
- [ ] `paths.briefsCurrent` always points at a real directory after a run (success or failure); on failure, it points at the prior location if any.

## Cross-cutting QA

- [ ] Lint passes
- [ ] Typecheck passes (project doesn't currently use TS; treated as N/A but JSDoc types kept consistent)
- [ ] Unit tests pass
- [ ] Integration tests pass (golden brief test)
- [ ] No new console errors in golden path
- [ ] No new accessibility regressions in the rendered HTML (semantic headings, no missing alt on any images)
- [ ] TRACE events fire as documented in `trace.md`
- [ ] COPY matches `copy.md`
- [ ] INPUTS handle validation per `inputs.md`

## External service QA

- [ ] `ESD-pandoc` record present in `external-services/` with status `optional` and platform-specific install hints.
- [ ] Pandoc probe is timed out at 2s and fail-open (does not block run when absent).
- [ ] No `secret: true` env-var values appear in any tracked file.

## Documentation scaling

This plan is the `documentation_scale: m` cut. The redteam-plan is a separate file as required for `m`.
