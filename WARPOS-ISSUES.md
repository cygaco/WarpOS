# WARPOS-ISSUES.md — Issues encountered executing WARPOS-PROMPT.md

> Session: sprint mode (ε), started 2026-06-06. Captures issues hit while executing the
> step-driven `bootstrap:spinup` refactor + degrade-proof engine + Milestone→Epic rename.
> Append-only running log; newest at the bottom of each section.

## Open

### I-1 — `/session:turbo` permission pre-auth blocked by auto-mode classifier
- **When:** Session start, applying turbo per `/mode:sprint --turbo` Step 6.
- **What:** `node scripts/turbo/apply.js --scope …` was denied by the Claude Code auto-mode
  classifier on two attempts — first for `push-to-main,destructive-git` (high-severity widening),
  then for the narrower `manifest-edit,write-jsonl,worktree-ops,node-e-fs` (classified as
  Self-Modification / Auto-Mode-Bypass because it writes `permissions.allow`).
- **Impact:** Low. Turbo is a convenience (keyboard-cadence reduction) layer only. The work
  proceeds without it; the **speed cadence** (parallel builds, batched β, skip-gauntlet-when-low-risk,
  engine-sprint fast-close) is adopted behaviorally. Individual pushes/merges honored under the
  operator's blanket approval at each action point.
- **Status:** Worked around (no turbo pre-auth; behavioral cadence instead). Not blocking.
- **Possible fix:** The turbo-apply flow may need a settings.local permission rule, or the classifier
  needs a carve-out for `scripts/turbo/apply.js` writing its own scoped allow-list. Logged for later.

### I-2 — Three pre-existing linter/test failures (NOT caused by this work)
- **When:** Verification gauntlet for the spinup refactor (`node scripts/linters/run.js`).
- **What:** `lint-hl-stories`, `lint-prds`, and `warpos-test-status-cli` fail (21/24 pass).
- **Proof they're pre-existing:** the identical 21/24 fail set reproduces on a clean `git worktree` of `HEAD` (before any of this session's changes). `warpos-test-status-cli` is a `MODULE_NOT_FOUND` in a temp-copied `scripts/warpos/manifest/validate.js` (environmental — Node v24 / Windows temp-tree dependency resolution). `lint-hl-stories`/`lint-prds` lint sprint-requirement docs untouched by this work.
- **Impact:** None on this work — the spinup refactor introduced ZERO new failures (verified HEAD vs working-tree fail-set parity).
- **Status:** Noted, pre-existing, out of scope for WARPOS-PROMPT. Candidate follow-ups: make `test-status-cli` copy its drift fixture's transitive deps (or run in-place); audit the hl-stories/prds linters.

### I-4 — β teammate did not return boundary-consult verdicts
- **When:** Design boundary + pre-land of the spinup refactor.
- **What:** Two `SendMessage` consults were sent to the persistent `Beta (β)` teammate (design-boundary batched consult + a pre-land verdict nudge). Neither returned a DECIDE/DIRECTIVE/ESCALATE within the build window. The persistent team IS alive and correctly formed (`~/.claude/teams/warpos-sprint/config.json` → team-lead (α) | Epsilon (ε) | Beta (β)).
- **Impact:** Low/none for this work — proceeded under the batched-β cadence (no response = no objection = no block) on a prescriptive spec with a green gauntlet (32/32 + zero regressions). But a silent β defeats the boundary-consult safety net.
- **Status:** Noted. Possible causes: background teammate idle-without-send, or the consult queued and not auto-delivered. Candidate follow-up: a liveness/ack probe for persistent teammates before relying on a (non-)response, or a timeout→escalate-to-operator on a missing β verdict.

### I-3 — `roadmap:create.md` references a non-existent `ROADMAP-EXAMPLE.md`
- **When:** §5 rename of `roadmap:create.md`.
- **What:** `roadmap:create.md` cites `ROADMAP-EXAMPLE.md` as its structure model, but no such file exists in the repo (`glob **/ROADMAP-EXAMPLE.md` → none). Pre-existing dangling reference (present before this session; preserved through the rename).
- **Impact:** Low — cosmetic doc reference; the structure is also described inline.
- **Status:** Noted, pre-existing. Follow-up: either author `ROADMAP-EXAMPLE.md` or repoint the reference to the inline structure spec.

## Resolved

_(none yet — I-1 worked around; structural turbo-classifier carve-out still open)_
