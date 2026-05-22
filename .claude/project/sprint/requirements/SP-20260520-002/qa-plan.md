# QA Plan — /product:import

**Sprint:** `SP-20260520-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260520-002/prd.md`

> Sprint v0.1 QA plan. Honored by `/sprint:execute` (mid-sprint checks) and `/sprint:release` (final QA gate). Diff-model review on QA is declared in `paths.sprintRouting` (`qa.diff_review: true`).

## Smoke checks

- [ ] **Fresh repo, no PROJECT.md:** Run `node scripts/product/import.js --slug demo-fresh` in a directory containing only a `package.json` and a `.git/`. The questionnaire emits successfully, stdout contains the C-3 "No PROJECT.md found…" line, and the file at `_docs/imports/demo-fresh/demo-fresh.questionnaire.md` has 8 section anchors.
- [ ] **Parity probe is green:** `node scripts/product/import.js --probe | jq .section_parity` returns `true` against the shipping `framework/templates/product-bootstrap/sections.json`. Run as a guard against silent template drift.
- [ ] **Parse round-trip succeeds:** Hand-paste a complete 8-section answers MD (use the emitted questionnaire as the skeleton; fill each section with one sentence). Run `--parse`. Then run `node scripts/product/bootstrap.js --slug demo-fresh --answers-file _docs/imports/demo-fresh/demo-fresh.answers.json`. Brief MD must render all 8 sections without a coverage-QC failure.
- [ ] **Parse failure path:** Delete the `<!-- section: wedge -->` anchor + body from the same answers MD. Re-run `--parse`. Exit code is 2, stderr matches C-6, no `answers.json` is overwritten.
- [ ] **Containment check:** `node scripts/product/import.js --slug demo --output-dir ../../../etc/passwd` exits 2 with "must stay inside the project root."
- [ ] **`--no-introspect` honors its name:** Run with `--no-introspect`. The `context_introspected` event has `skipped: true`, the emitted preamble is a single line, and `package.json` is NOT opened (verify via `strace` on Linux fixture or by deleting `package.json` and confirming no error message).
- [ ] **Paste-friendly rendering in ≥3 surfaces:** Manually paste the emitted questionnaire into Claude Code, Claude web, and ChatGPT web. In each, headings render as headings, the `<!-- section: <id> -->` comments survive a copy-paste round trip back into a text file, and the response-format hints render legibly. Capture screenshots in `_docs/imports/qa-evidence/` for the release ticket.
- [ ] **Events fire even when events file dir is missing:** Delete `.claude/project/events/`. Run import. The skill exits 0; on restart of the events dir, no event is lost retroactively but the run does not crash.

## Per-story QA

### S-1 (CLI surface)
- [ ] AC-1.1, AC-1.2, AC-1.3, AC-1.4 verified per acceptance-criteria.md.
- [ ] Regression: `--help` does not regress `bootstrap`'s `--help` output (the two are independent CLIs, but the synopsis style should match within reasonable voice consistency).
- [ ] Regression: Unknown flag prints the bootstrap-style `unknown flag: <name>` message and exits 2.

### S-2 (introspection)
- [ ] AC-2.1, AC-2.2, AC-2.3, AC-2.4 verified.
- [ ] Regression: `package.json` with no `name` field does not crash; preamble falls back to slug.
- [ ] Regression: A `git log` taking >5s is killed by the timeout and the skill continues; introspection event records `git_log_present: false`.
- [ ] Regression: Each of the 4 sources truncates at 64KB without a memory blow-up (oversized fixture test).

### S-3 (template)
- [ ] AC-3.1, AC-3.2, AC-3.3 verified.
- [ ] Regression: Editing `framework/templates/product-import/sections.json` to invalid JSON exits 2 with the path in the error message.

### S-4 (paste-friendly rendering)
- [ ] AC-4.1, AC-4.2, AC-4.3 verified.
- [ ] Regression: Inserting a `####` heading into a template field causes the render to fail validation (or be auto-downgraded to `###`).

### S-5 (emit + paths)
- [ ] AC-5.1, AC-5.2, AC-5.3 verified.
- [ ] Regression: Re-emit with the same `--slug` overwrites the file in place (no `history/` versioning — import has no rerun-policy because the questionnaire is regeneratable from the same project context).
- [ ] Regression: A `.claude/paths.json` that contains a JSON syntax error is NOT clobbered; the registration is skipped with a stderr warning.

### S-6 (events)
- [ ] AC-6.1, AC-6.2, AC-6.3, AC-6.4 verified.
- [ ] Regression: Event JSON validates against the field inventory in TR-1..TR-6 (no extra fields, no missing required fields).

### S-7 (parity probe)
- [ ] AC-7.1, AC-7.2 verified.
- [ ] Regression: `--probe` is read-only — no files modified, no events emitted.

### S-8 (--parse round-trip)
- [ ] AC-8.1, AC-8.2, AC-8.3, AC-8.4 verified.
- [ ] Regression: An anchor like `<!-- section:  wedge  -->` (extra whitespace) is parsed as the `wedge` section, not dropped.
- [ ] Regression: Operator pastes a reply where ChatGPT renamed `## 05 — Wedge` to `## Wedge` (dropping the numbering prefix). Parser still finds it via the anchor and succeeds.

## Cross-cutting QA

- [ ] `node scripts/check/path-lint.js` passes (no new hardcoded path literals introduced in `import.js` or the skill spec — use `paths.X` keys per CLAUDE.md).
- [ ] `node scripts/hooks/requirement-format-guard.js` passes on every file under `.claude/project/sprint/requirements/SP-20260520-002/`.
- [ ] `node scripts/hooks/framework-manifest-guard.js` passes — `framework/templates/product-import/` is recorded in the manifest after sprint close.
- [ ] No new `console.error` or unhandled-rejection warnings in the golden path runs.
- [ ] TRACE events fire as documented in `trace.md` for both emit-mode and parse-mode.
- [ ] COPY matches `copy.md` for all 9 C-N blocks (visual diff during execution).
- [ ] INPUTS handle validation per `inputs.md` (every `Failure mode` cell has a matching AC).
- [ ] All four sources in IN-7 are read with `{ encoding: "utf8" }` and explicit fs flags — no implicit `fs.readFile` with default encoding.

## External service QA

- [ ] N/A — no ESDs declared in this sprint. The only subprocess is `git log` (system tool, not an external service); failure is non-fatal.

## Documentation scaling

This plan is the `documentation_scale: m` cut. For xs/s, ACs may be inlined and a Cross-cutting subset is enough. For l/xl, add a separate red-team plan (already done) and an architecture-review plan.
