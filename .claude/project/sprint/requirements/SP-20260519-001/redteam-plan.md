# Red-Team Plan — ROADMAP + RELEASES ledger discipline

**Sprint:** `SP-20260519-001`
**PRD:** `prd.md`

> Adversarial review plan. Diff-model review on redteam declared in `paths.sprintRouting`. The sprint is low-risk (no external services, no production deploy, no secrets) — the threat surface is convention tampering and silent drift.

## Threat classes to cover

- [ ] **Ledger tampering** — actor inserts a fake row claiming a sprint shipped that did not, OR edits an existing row's status from `prepared` → `deployed` without an underlying `RL-*` status change. Mitigation review: the warn-hook in S-10 detects missing rows but does NOT detect row LIES. Acceptable for this sprint; flag as a follow-up "ledger-row-attestation" idea.
- [ ] **Anchor marker removal as silent opt-out** — actor removes `<!-- ledger:sprints -->` from `ROADMAP.md`; `ledger.js` then silently skips writes (per IN-9). Could mask drift indefinitely. Mitigation review: `ledger-presence-guard` only checks for the row, not the marker. Add to S-10 secondary check: if marker is missing AND command ran, emit a louder warn.
- [ ] **Downstream collision** — a consumer project already has `RELEASES.md`. Framework install copies the canonical `RELEASES.md` over it. Mitigation review: this sprint EXPLICITLY does NOT ship `RELEASES.md` to consumers (R-6); `promote.js` exclusion is the gate. Verify the exclusion lands.
- [ ] **Boundary erosion** — RT-011 defines MUST/MAY/MUST NOT, but `ledger.js` does not enforce the boundary at write-time (it accepts whatever the caller passes). An over-eager future contributor wires `ledger.appendReleaseRow` into a hotfix-commit path (MUST NOT tier). Mitigation review: the boundary is documented in `sprint-workflow.md#ledger-discipline` and the only callers are the 4 named scripts. Acceptable; flag as a static-analysis idea for `/check:patterns`.
- [ ] **Fail-open as silent skip** — `ledger.js` swallows ALL errors. A misconfigured filesystem (perms, full disk) means writes never land but everything looks fine. Mitigation review: TR-2 `ledger.fail-open` event captures every swallow; `/check:patterns` mining detects repeat patterns. Acceptable.
- [ ] **Backfill overwrite of manually-curated rows** — operator hand-edited a row, then re-runs `backfill-ledgers.js --apply`. Mitigation review: backfill is idempotent (AC-9.3) — it does NOT overwrite existing rows, only inserts missing ones. Confirm in test.
- [ ] **Race condition: concurrent ledger writes** — two sprint commands running in parallel both call `appendSprintRow`. Last write wins; one row may be lost. Mitigation review: sprint scripts are not typically concurrent (one sprint at a time per session), and `paths.sprintActiveRegistry#primary` enforces a single-primary discipline. But the multi-sprint parallelism SP-20260512-001 sprint EXPLICITLY enabled this. Add to S-4 spec: use a `.ledger.lock` file or atomic write-temp-then-rename. Confirm execution-phase ticket addresses this.
- [ ] **Prompt-injection of `RELEASES.md` Summary column** — a malicious release-notes string contains markdown that breaks the table or injects a link to a malicious URL. Mitigation review: backfill reads from existing `RL-*.changelog.md` which are repo-tracked human-written. `release-canonical.js` writes summary from the operator-provided changelog. Trust boundary is the same as any markdown file in the repo. Acceptable.

## Per-sprint additions

- **T-1: Verify `scripts/warpos/promote.js` exclusion of `RELEASES.md` IS a deny-by-default check** — grep the FRAMEWORK_PREFIXES list. If the exclusion is an explicit allowlist instead of a denylist, adding `RELEASES.md` as a literal exclusion may be a no-op against a future new top-level dir. Document the exclusion mechanism in the sprint retro.
- **T-2: Read `paths.warposPromoteReports` for any prior promotion that touched `ROADMAP.md`** — confirms the existing exclusion has held historically; if not, the new `RELEASES.md` exclusion is at risk too.

## Stop-the-bus signals

If any of these surface during execute, halt and escalate to user:

- Any path to bypassing the `promote.js` exclusion such that canonical `ROADMAP.md` / `RELEASES.md` overwrite consumer files.
- Any path to `ledger.js` writing OUTSIDE `ROADMAP.md` / `RELEASES.md` (path-traversal in `IN-9` anchor detection).
- Any path to a Ralph loop where `ledger.js` calls itself recursively (TR-1 event would log infinitely).
- Confirmation that `release-canonical.js` is NOT the sole `version.json` writer — would expand scope of S-8 ticket and require a Plan Contract update.

## Documentation scaling

Scale `m` — full redteam plan mandatory. No external services to red-team; the threat model is convention integrity.
