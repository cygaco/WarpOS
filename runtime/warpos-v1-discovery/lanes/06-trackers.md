# Trackers / Epics / Roadmap — Discovery Report (disc-trackers, 2026-07-09)

## Architecture

**Two-layer split, both git-tracked, neither derived from the other:**
- `trackers/` = live **STATE** of record. `TRACKER.md` (root, 211KB) is the authority; `trackers/epics/E-*.md` (19 files) + `trackers/sprints/*.md` (8 files) hold per-item state; `UNTRACKED_WORK.md` logs unplanned work; `ROADMAP.md § Epics` = epic registry. Templates in `trackers/templates/` (9, spec §35).
- `_planning/` = durable **PLAN ARTIFACTS** (the reasoning), linked via `tracker:`/`epic:` frontmatter (`_planning/README.md:21-45`). Also a read-only content corpus (`ingest/`,`sources/`,`reviews/`).
- **Authoritative:** `TRACKER.md` ("state of record"); the plan artifact is "reasoning, not status" (`_planning/README.md:38-45`). Tracker is never derived from the plan artifact.
- **Drift found:** 19 epic tracker files, but only **3** real plan artifacts in `_planning/epics/` (DISPATCH-PERFECT, DISPATCH-SHAPE, PRODUCT-FOUNDATION). README calls the bidirectional linkage "load-bearing," yet ~16/19 epics have no `_planning` artifact — **and no check verifies that linkage.**

## The 20 checks (internal vs external)

Logic in `scripts/trackers/validate.js` — `evaluate()` @693-1073, seams built from disk @1364-1436. Critical: "external" here = **filesystem existence only**; git/sprint-runtime is touched by NOTHING (`grep child_process|git` in validate.js = empty).

**Single-file / internal (a–l), @721-907:** a sections-present, b no-blank-section, e active-next-action, f completed-evidence, g completed-100, h hundred-completed, i sprint-parent-epic, j ambiguous-language, k undefined-terms — pure TRACKER.md text/logic. Three touch disk-existence only: **c broken-links (@750), d active-tracker-files (@766), l required-paths (@896)** — file present? yes/no, not content/state.

**Cross-file (m–t), @911-1069:** m roadmap-epic-based, n epics-in-roadmap (@926 — epic ID string appears in ROADMAP.md), o modes-consult-tracker (@948), p work-log-session-id, t definition-drift — read other repo files but compare **text**. Two touch external-disk: **q expected-nonexistence (@982)** asserts a "Verified Nonexistent" path is truly absent (@1403); **s hooks-enforce-or-tracked (@1023)** = hook file exists OR gap acknowledged.

**The flagship "external" check is r cross-file-reconciliation (@998)** — but it only compares TRACKER's state field to the **linked tracker FILE's** state field (@1408-1417, `fileStateOf`). **Both are hand-authored** — agreement proves the human wrote the same word twice, not that the work is done.

**The gap, precisely:** ZERO checks read git (`git log`/`rev-parse`/`cat-file`), sprint checkpoints, or `paths.sprintActiveRegistry`. An epic marked `Active 0%` whose work is committed & shipped on `main` passes **20/20**. The known "open-but-done / GREEN-but-RED" bug class is **structurally uncatchable** here. TRACKER.md carries git SHAs in its prose ("verified @c89a73a7") — but that reconciliation is **manual narrative**, never machine-verified. No git-vs-tracker script exists anywhere (confirmed across `scripts/trackers/` + `scripts/checks/`).

## Triggers & classes

- **SessionStart** → `tracker-start-of-work.js` (settings.json:3-12). Runs validator, injects verdict into context. **FAIL-OPEN, never blocks** (@16-19). Class: **MECH-CLAUDE / advisory**.
- **Stop** → `tracker-completion-gate.js` (settings.json:356-365). **Default ADVISORY** — stderr warning, exit 0; hard-blocks (exit 2) ONLY if `TRACKER_GATE_ENFORCE=1` (@31,84). **That env var is set NOWHERE** (grepped settings/.env/scripts) → in practice **never blocks**. Class: MECH-NEUTRAL-capable but **disabled** → effectively SCAN-ONLY.
- **UserPromptSubmit** → `sprint-tracker-guard.js` (settings.json:127) — guards **sprint YAML only** (schema + history immutability), fails OPEN, kill-switch `SPRINT_GUARD=off`. Does **not** protect TRACKER.md/ROADMAP.md.
- **`/scan:full`** → `node scripts/trackers/validate.js` directly (scan/full.md:100). Real gate, but it's a **skill the agent chooses to run** — no CI, no pre-commit. Class: **SCAN-ONLY**.
- **`/session:end` Phase 5** → fail-CLOSED reconcile, requires exit 0 (session/end.md:59,94) — but **PROSE discipline** in a skill, self-enforced.
- **No CI exists.** All enforcement is session-local + agent-cooperative.

## Live-state (real output)

`node scripts/trackers/validate.js` → **PASS, all 20/20, exit 0** (root=canonical). Plus an **advisory** tier (session-relative-language / anti-deixis, @1079): **21 warnings** for deictic phrases ("this session","next session","currently") — REPORT-ONLY, outside the 20, ramp-to-blocking owned by α. 19 epics, 8 sprints. Spot-check: TRACKER's `Last Updated` line 7 cites SHAs + "validate 20/20" — self-consistent but unverified by the tool.

## Bypass analysis

**What stops a GPT (or any) helm editing TRACKER.md to claim false GREEN? Essentially nothing structural.**
- Validator checks **internal shape**, so a helm can flip an epic `Active→Completed` + add an `evidence:` string + set `100%` and pass 20/20 — evidence is checked for **presence, not truth** (f completed-evidence @802 = non-empty string only). No check confirms a cited SHA/test exists or passes.
- The only hard block (`TRACKER_GATE_ENFORCE=1`) is unset, and even enabled fires only on a **RED** tracker — a **falsely-GREEN** edit sails through.
- `sprint-tracker-guard` protects sprint YAML, **not TRACKER.md** — TRACKER.md has no write-guard at all.
- fail-OPEN everywhere; `SPRINT_GUARD=off` or making the validator throw silently disarms the guards.
- **Net:** trust-based. A non-Claude helm has identical edit freedom; there is no fail-closed trigger on a false-GREEN edit. The system detects *malformed* trackers, not *lying* ones.

## Rebuild needs (WarpOS-v1)

1. **Tracker-fidelity-vs-git check** (the missing external oracle): (a) each "Completed" epic's cited evidence SHA resolves via `git cat-file`; (b) an item marked Active/0% with commits touching its scope on `main` is flagged "possibly-done"; (c) sprint state cross-checked against `paths.sprintActiveRegistry` + checkpoints, not the hand-written linked file. `r cross-file-reconciliation` must compare to git/sprint reality, not TRACKER-to-TRACKER.
2. **Helm-neutral, fail-CLOSED triggers:** completion gate enforce-by-default (or a pre-commit/CI hook no helm can fail-open past); a TRACKER.md/ROADMAP.md write-guard analogous to sprint-tracker-guard; an evidence-**truth** check (not presence) so false-GREEN is mechanically refuted.
3. **v1 integration — evidence-linked status:** bind item state to **ResultEnvelopes / SprintRooms** — an item goes Completed only when a signed ResultEnvelope (real elapsed/bytes/test-run, the `ok:true` liveness `gauntlet-verify` reads) exists; status *derived from* evidence, not *asserted* beside it. Add a check for the `_planning`↔`trackers` frontmatter bijection (16/19 unpopulated + unchecked today).
4. **Durable-truth-outranks-chat:** keep TRACKER.md as authority (SessionStart already injects it) and make the anti-deixis advisory **blocking** so status text is git-anchored, not "this session"-relative.

Key pointers: validator `scripts/trackers/validate.js` (evaluate @693, disk seams @1364); hooks `tracker-start-of-work.js` (SessionStart, fail-open), `tracker-completion-gate.js:31,84` (Stop, advisory unless `TRACKER_GATE_ENFORCE=1` — unset); wiring `.claude/settings.json:3,127,356`; split contract `_planning/README.md:38-58`.
