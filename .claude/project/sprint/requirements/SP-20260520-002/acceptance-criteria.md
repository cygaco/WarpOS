# Acceptance Criteria — /product:import

**Sprint:** `SP-20260520-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260520-002/prd.md`

> Each AC is a testable statement linked to a granular story. The Plan Contract does NOT carry a `goal_verification` block, so the executable `verified_by:` gate is a no-op for this sprint — but we still record honest verification methods so a future audit can backfill.

## S-1 — Skill spec + CLI surface

- **AC-1.1:** Given a checked-out repo, when I open `.claude/commands/product/import.md`, then the file exists with frontmatter `description:`, an `# /product:import` title, and sections for Input / When to use / What it does / Flags / Outputs / Exit codes / TRACE events / Procedure (mirrors `bootstrap.md` shape).
  verified_by: not_applicable — file existence + heading scan.
- **AC-1.2:** Given `node scripts/product/import.js --help`, when the process exits, then stdout matches C-1 (synopsis, flag list, "Intended as a pre-step…" line) and exit code is 0.
  verified_by: not_applicable — manual run + visual diff against C-1.
- **AC-1.3:** Given `node scripts/product/import.js --slug "INVALID SLUG"`, when the process exits, then stderr contains `Slug \`INVALID SLUG\` is not valid` AND exit code is 2.
  verified_by: not_applicable — manual exit-code check against IN-1 failure mode.
- **AC-1.4:** Given `node scripts/product/import.js --section-set foo`, when the process exits, then stderr contains `Unknown section set 'foo'` AND exit code is 2.
  verified_by: not_applicable — manual run, matches IN-2 failure mode.

## S-2 — Bounded project introspection pass

- **AC-2.1:** Given a project with `PROJECT.md`, `README.md`, `package.json`, and ≥10 commits, when I run `node scripts/product/import.js --slug demo`, then the emitted `_docs/imports/demo/demo.questionnaire.md` preamble includes the project name (from `package.json#name`), a "Last 10 commit subjects:" block with all 10 entries, and a presence flag for each of the four sources.
  verified_by: not_applicable — visual diff of emitted preamble.
- **AC-2.2:** Given a project with NO `PROJECT.md`, when I run `node scripts/product/import.js --slug demo`, then stdout includes the C-3 "No PROJECT.md found…" line AND the emitted preamble omits the PROJECT.md presence flag without printing an error or raising the exit code.
  verified_by: not_applicable — manual run in a fixture project with PROJECT.md deleted.
- **AC-2.3:** Given a project where `git log` fails or is unavailable (no `.git/`), when I run `node scripts/product/import.js --slug demo`, then the introspection step does NOT crash, the emitted preamble omits the recent-commits block, and the `context_introspected` event records `git_log_present: false`.
  verified_by: not_applicable — manual run in a directory without `.git`.
- **AC-2.4:** Given `node scripts/product/import.js --slug demo --no-introspect`, when the process completes, then no `PROJECT.md`/`README.md`/`package.json` read appears in `context_introspected` (`skipped: true`), AND the emitted preamble is a single line containing only the slug and ISO timestamp.
  verified_by: not_applicable — read the emitted MD; tail the events file.

## S-3 — Questionnaire template

- **AC-3.1:** Given `framework/templates/product-import/sections.json`, when I parse it as JSON, then it has `minimal: [...]` and `extended_additions: [...]` arrays whose `id`+`title`+`prompt` triples match `framework/templates/product-bootstrap/sections.json` byte-for-byte (string equality, not just substring match).
  verified_by: not_applicable — node REPL diff of the two parsed objects.
- **AC-3.2:** Given the emitted questionnaire file, when I inspect each section, then each section contains (in order): an `## NN — Title` heading, a `<!-- section: <id> -->` anchor, a "What we're after:" `framing` paragraph, the bootstrap prompt verbatim, and a fenced or blockquoted `response_format_hint`.
  verified_by: not_applicable — visual scan + regex spot-check.
- **AC-3.3:** Given the questionnaire was emitted with `--section-set extended`, when I count `<!-- section: ` anchors, then the file contains exactly 12 anchors (8 minimal + 4 extended_additions) and no others.
  verified_by: not_applicable — `grep -c "<!-- section:"` against the emitted file.

## S-4 — Universal phrasing across 5 surfaces

- **AC-4.1:** Given the emitted questionnaire file, when I scan its markdown, then it contains zero `#### `+ headings, zero embedded images, and no triple-backtick code block longer than 4096 bytes.
  verified_by: not_applicable — regex audit of the emitted MD.
- **AC-4.2:** Given the emitted file is opened in (a) Claude Code TUI, (b) Claude web app, (c) ChatGPT web, then in all three the section headings render as headings, the `<!-- section: <id> -->` anchors remain visible as HTML comments (or invisibly preserved in clipboard text), and the response-format hints render legibly.
  verified_by: not_applicable — manual paste test in at least 3 of the 5 surfaces, per release-plan.md.
- **AC-4.3:** Given the emitted file contains no `\r\n` line endings, when I `Buffer.from(fileBytes).includes(0x0D)` in node, then the test returns false.
  verified_by: not_applicable — byte-level check at write time.

## S-5 — Output emission + paths registration

- **AC-5.1:** Given a clean project, when I run `node scripts/product/import.js --slug demo`, then `_docs/imports/demo/demo.questionnaire.md` is created, file ends with exactly one `\n`, and stdout matches C-8 (lists the path + 4-step "Next steps" block).
  verified_by: not_applicable — manual run + visual diff.
- **AC-5.2:** Given a project whose `.claude/paths.json` lacks `imports` and `importsCurrent`, when I run `node scripts/product/import.js --slug demo`, then after the run `.claude/paths.json` contains `"imports": "_docs/imports"` AND `"importsCurrent": "_docs/imports/demo"`, AND stdout includes the C-9 "Registered new paths keys" block once.
  verified_by: not_applicable — diff `.claude/paths.json` before/after.
- **AC-5.3:** Given a project whose `.claude/paths.json` already has `paths.imports` set correctly, when I run `node scripts/product/import.js --slug demo2`, then `paths.importsCurrent` updates to `_docs/imports/demo2` AND the C-9 registration banner is NOT printed again.
  verified_by: not_applicable — second-run check.

## S-6 — Telemetry events

- **AC-6.1:** Given a successful emit run, when I tail `paths.eventsFile`, then I see exactly one `import_started`, one `context_introspected`, and one `questionnaire_emitted` event (in that order) all carrying the same `slug`.
  verified_by: not_applicable — `tail -n 20 .claude/project/events/events.jsonl | grep import`.
- **AC-6.2:** Given a successful parse run, when I tail `paths.eventsFile`, then I see exactly one `import_started` (with `mode: "parse"`), one `parse_started`, and one `parse_completed` event in that order.
  verified_by: not_applicable — tail check.
- **AC-6.3:** Given `paths.eventsFile` is in a directory that does NOT exist OR is read-only, when the generator emits any event, then the run does NOT crash and continues to a normal exit (fail-open per CLAUDE.md learning L-2026-04-17-n and `bootstrap.js#emitEvent`).
  verified_by: not_applicable — fault-injection test.
- **AC-6.4:** Given any event written by `/product:import`, when I parse the JSON line, then it has no field whose value is a copy of an operator answer or a file body — fields are limited to ids, counts, presence flags, and timestamps.
  verified_by: not_applicable — schema check against the event-shape inventory in trace.md TR-1..TR-6.

## S-7 — Section parity check vs `/product:bootstrap`

- **AC-7.1:** Given `node scripts/product/import.js --probe`, when stdout JSON is parsed, then it contains `section_parity: true` AND the `parity_report.minimal_ids` array equals the `id` array of `framework/templates/product-bootstrap/sections.json#minimal` AND the `parity_report.extended_ids` array equals the union ids of bootstrap's `minimal + extended_additions`.
  verified_by: not_applicable — `node scripts/product/import.js --probe | jq .section_parity`.
- **AC-7.2:** Given a hand-edited `framework/templates/product-import/sections.json` where one section title differs by a single character from bootstrap's, when I re-run `--probe`, then `section_parity: false` AND `parity_report.diffs[]` lists the mismatched section id and the field that diverged.
  verified_by: not_applicable — fault-injection on the JSON template, restore after.

## S-8 — `--parse` mode round-trip

- **AC-8.1:** Given a pasted-answers MD file with all 8 minimal sections present (each with its `<!-- section: <id> -->` anchor and ≥1 non-empty paragraph), when I run `node scripts/product/import.js --slug demo --parse <path>`, then `_docs/imports/demo/demo.answers.json` is written, every key in `minimal` is present with `status: "drafted"` and `content` matching the pasted body, and exit code is 0.
  verified_by: not_applicable — hand-craft fixture, diff JSON.
- **AC-8.2:** Given a pasted-answers MD file missing the `wedge` section anchor, when I run `--parse`, then stderr contains "Parse failed:" with `wedge` in the missing-list, exit code is 2, `answers.json` is NOT written, and a `parse_failed_section_mismatch` event with `missing_section_ids: ["wedge"]` is appended.
  verified_by: not_applicable — fault-injection fixture, exit-code check, event-tail.
- **AC-8.3:** Given the answers.json produced by AC-8.1, when I run `node scripts/product/bootstrap.js --slug demo --answers-file _docs/imports/demo/demo.answers.json`, then bootstrap exits 0 AND `_docs/briefs/demo/demo.brief.md` renders all 8 sections with the answer bodies (end-to-end round-trip).
  verified_by: not_applicable — manual round-trip from a fixture, validated against bootstrap's existing AC for `--answers-file`.
- **AC-8.4:** Given a pasted-answers MD file where one section's body is exactly the literal string `_skipped — operator declined to answer this section._`, when I run `--parse`, then the answers.json key for that section has `status: "skipped_declined"` AND bootstrap downstream renders it with the "Skipped — operator declined" body per its existing R-3 behavior.
  verified_by: not_applicable — fixture + bootstrap re-run.
