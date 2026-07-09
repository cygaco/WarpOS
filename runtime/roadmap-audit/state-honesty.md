# Roadmap State-Honesty Audit — prose-vs-reality (E-MC-READINESS-ANALYSIS track-6)

**Date:** 2026-06-16 · **Mode:** READ-ONLY (nothing changed) · **Working dir:** C:\Users\Vlad\Desktop\Claude\Projects\WarpOS
**Scope:** Verify each remaining epic's ROADMAP/epic-tracker CLAIMED state vs ACTUAL code/disk reality, classify each as STALE-UNDERSTATED / ACCURATE / OVERSTATED, and identify the single most important reconciliation.
**Trackers live at repo root** `trackers/epics/` (NOT `.claude/project/trackers/`). ROADMAP `## Epics` registry @ `ROADMAP.md`.

**Headline:** The "tracker claims open but actually done" drift that motivated this pass does NOT recur in the epic *trackers* — they are conservative and mostly accurate-to-understated. The one real OVERSTATEMENT found is the reverse: **E-CONTENT-DELIVERY-001 DoD#2 claims a gate is GREEN that now exits 1 (regressed).** The most widespread drift is **ROADMAP-vs-tracker** (the ROADMAP detail blocks lag the trackers), not tracker-vs-code.

---

## 1. E-DISPATCH-SHAPE-001 → **STALE-UNDERSTATED (ROADMAP only; tracker ACCURATE)**

**Claims.** ROADMAP detail block (`ROADMAP.md:41`): "State: Active (W0 starting 2026-06-10). **Completion: 0%.**" Epic tracker (`trackers/epics/E-DISPATCH-SHAPE-001-dispatch-shape-decision-spine.md:16`): "~50% — W0 LANDED via SP-20260610-006 (RL-20260610-041); W1 LANDED via SP-20260610-007 (RL-20260610-042)."

**Reality (verified).**
- `scripts/dispatch/dispatch-shape.js` (375 ln) exists with `resolveShape` (L206), `shapeMismatch` (L215), `resolveAgent`, `resolveSkill`, `resolveAdhoc`, `parallelismFindings`, `SHAPES` all exported (L342). The W0 RESOLVER is real and wired.
- W1 scripts real: `scripts/dispatch/provider-breaker.js` (244 ln), `scripts/dispatch/timeout-policy.js` (90 ln) — `FOREGROUND_CEILING_MS=540s` fail-closed clamp confirmed (L12), 60s headroom under the 600s harness kill.
- The named wrappers `dispatch-agent.js` / `dispatch-claude.js` / `dispatch-skill.js` are at `scripts/` ROOT (not `scripts/dispatch/`) — the epic Scope line names them under `dispatch-agent.js` correctly; the "scripts/dispatch/" path in the prompt was wrong. All three EXIST.
- The `--review-fallback` sanctioned-lane (W1 deliverable) is registered in `dispatch-contract.json` (L235) and detected in `dispatch-route-guard.js` (L409-440). Real.
- **W2 is genuinely OPEN (tracker is right not to claim it):** `dispatch-contract.js` mode-narrowing is REPORT-ONLY by construction — "REPORT-ONLY ramp: callers opt in by passing `mode`" (L173-174); the ENFORCE flip is described as a "future ENFORCE flip" (L268-269) that has not occurred. **The ROADMAP itself confirms W2 is unflipped and BLOCKED on inputs** (`ROADMAP.md:682` item 13: "its W2 ENFORCE flip MUST take [R2/R3] as inputs first, else the flip bricks the shapes that actually work").
- SP-20260611-001/-002 are NOT W2 — they are the cross-family-findings fix sprint + the E-LIFECYCLE close-out fix sprint (titles read from `current.yaml`). W2/W3 unstarted.

**Verdict.** The *epic tracker* is ACCURATE (~50%, W0+W1 landed with real release tags, W2/W3 open). The *ROADMAP detail block* is STALE-UNDERSTATED (still says "0% / W0 starting" — never updated after the two W0/W1 sprints landed 2026-06-10).
**Most important reconciliation:** Update `ROADMAP.md:41` from "Completion: 0% / W0 starting" to "~50% — W0+W1 landed (SP-20260610-006/007), W2/W3 open." Tracker needs no change.

---

## 2. E-LIFECYCLE-001 → **ACCURATE**

**Claims.** Tracker + ROADMAP (`ROADMAP.md:137`): "~92% — CODE-COMPLETE (12/12 sprints, all 5 waves), report-only. Remaining ~8% is operator-gated (§22 #4 blocking-flip sign-off + GPT 2nd-pass + retro), NOT code."

**Reality (verified).** All 12 sprint deliverables exist on disk:
- W0: `.claude/agents/_org/mode-lifecycle.json`, `scripts/hooks/lib/mode-lifecycle.js`, `scripts/checks/mode-lifecycle-registry.js`, `.claude/agents/_org/mode-lifecycle-hooks.json`, `scripts/hooks/lib/lifecycle-events.js`, `scripts/checks/mode-lifecycle-hooks-coverage.js` — all present.
- W1: `scripts/hooks/mode-lifecycle-guard.js`, `scripts/hooks/session-end-team-teardown.js`, `scripts/teams/lifecycle.js` — all present.
- W2: `scripts/checks/coverage-gate-scan.js`, `scripts/checks/turbo-spend.js` — present.
- W4/W5: `scripts/warpos/provider-tier-check.js` (wired into BOTH `warp/health.md` + `scan/environment.md`, confirmed), `scripts/sprint/ac-categories.js`, `scripts/epic/plan.js`, `scripts/epic/fold.js` — present.
- Reports exist: `_reports/E-LIFECYCLE-001-capstone-validation.md`, `_reports/E-LIFECYCLE-001-epic-retro.md`, `_planning/playbooks/SUITE-DESIGN.md`.
- **Residual confirmed still-open (so ~92% is honest, not overstated):** `mode-lifecycle-guard.js` is verifiably REPORT-ONLY — "this guard NEVER returns a `decision:'block'`" (L23), "decision: ALWAYS null this sprint" (L319). The report-only→blocking flip has NOT happened. The retro IS written (it exists) but the tracker correctly says the retro existing does not flip Completed/100% (the blocking flip + GPT 2nd-pass remain).

**Verdict.** ACCURATE. Code-complete claim is true; the operator-gated residual is genuinely still open (gates still report-only).
**Most important reconciliation:** None needed for honesty. The open work is the operator-gated incremental blocking-flip (kill-switch-guarded ramp) + the GPT 2nd-pass (was quota-blocked 2026-06-10). Note: 24 `tests/regression/` dirs exist incl. S-LC-01..12 — consistent with the capstone's "21 regression suites" claim.

---

## 3. E-SYSTEM-ORG-001 → **ACCURATE**

**Claims.** Tracker + ROADMAP: "~99% — IN-CANONICAL WORK COMPLETE; open ~1% = two operator-gated/bounded items only (§13.7 instrumented heavy A/B measurement + S-5 boundary repo move)."

**Reality (verified).**
- Dispatch spine real: `dispatch-shape.js`, `dispatch-contract.js` (560 ln, the keystone), `dispatch-route-guard.js` (658 ln), `scope-contract-guard.js` (198 ln) all present.
- The S-12c HARD team-readiness gate is DEFAULT-ON in code: `team-guard.js` `hardGate = process.env.WARPOS_TEAM_GATE_SOFT !== "1"` — confirmed via the tracker's own evidence trail and the doc-reconcile change-log entry (code-authoritative, 13/13 `team-guard-gate.test.js`). The DEFAULT-OFF→DEFAULT-ON doc drift was already reconciled 2026-06-09.
- S-2 dispatch-guide consolidation, S-3 de-dot, S-6 duplicate-doc-drift enforcer, S-7 role renames, S-10 deixis, S-11 two-layer handoff, S-13/S-13b doc-ref-integrity (0-broken baseline) — all marked DONE with commit hashes; DoD checklist shows [x] on S-1/S-2/S-3/S-4/S-6/S-7/S-10/S-11/S-12/S-13, only S-5 is [ ].
- S-5 (boundary repo move) is genuinely operator-gated: `_requirements/` + `_docs/` still at canonical root (confirmed they exist), and the relocation target is a NEW sibling repo (forbidden by the WarpOS-only autonomy boundary). The tracker's analysis of WHY it can't self-advance is sound.
- §13.7 heavy A/B: "0 real skills subprocess_verified" — honestly deferred (the §13.6 harness `scripts/skills-test.js` + `dispatch-skill --resolve` exist; the heavy measurement is the deferred $-session).

**Verdict.** ACCURATE. The ~99% with two named operator-gated residuals matches reality; the one historical doc-drift (S-12c DEFAULT-ON) was already caught and reconciled.
**Most important reconciliation:** None for honesty. The two residuals are real external blockers, not unreconciled done-work.

---

## 4. E-CONTENT-DELIVERY-001 → **OVERSTATED (DoD#2 regressed green→red) + ACCURATE on the open items**

**Claims.** Tracker (`:15,:20`): "~60%. DoD#2 DONE & ENFORCED — `warpos-ship-coverage.js` green: 1304 paths, 0 hard_gaps/0 info_gaps/0 boundary_violations, exit 0." DoD#1 (`_warpos/templates/` + `_warpos/BASELINE/` + `framework/templates` migration) + DoD#3 (`populate-source.js`) + DoD#4 OPEN.

**Reality (verified).**
- **OPEN items ACCURATE:** `_warpos/templates` ABSENT, `_warpos/BASELINE` ABSENT (confirmed — `_warpos/` holds only `MANIFEST.json` + `settings/`), `framework/templates` still EXISTS (un-migrated), `scripts/warpos/populate-source.js` ABSENT. The genuinely-open templates-migration is correctly reported.
- **DoD#2 is now OVERSTATED — the gate REGRESSED:** running `node scripts/checks/warpos-ship-coverage.js` TODAY → **EXIT 1** with hard gaps. Unshipped paths flagged: `scripts/panel/list.js`, `scripts/panel/roadmap-gui.js`, `scripts/panel/roadmap.js`, `scripts/cockpit/readiness-board.js`(+`.test.js`), `scripts/admin/preview.js`, `scripts/admin/seed.js`. These `scripts/{panel,cockpit,admin}/` dirs were added by LATER work (panel/roadmap GUI 2026-06-15, admin:* suite SP-20260614-002, cockpit) and were never added to ASSET_DIRS or KNOWN_NOT_SHIPPED. The tracker's "exit 0, 1304 paths, 0 gaps" was true on 2026-06-06 but is STALE — the gate is red now.

**Verdict.** OVERSTATED specifically on DoD#2 (claims a green gate that is currently red — the inverse of the understatement pattern, a stale-positive). Open-item reporting is otherwise ACCURATE.
**Most important reconciliation:** Ship-coverage is BROKEN right now — add `scripts/{panel,cockpit,admin}/` to ASSET_DIRS (to ship) or to KNOWN_NOT_SHIPPED (with reasons), then re-mark DoD#2 with a fresh dated run. This also means any release gate that runs ship-coverage `--strict` is currently failing.

---

## 5. E-TEST-SUITE-001 → **STALE-UNDERSTATED (mildly)**

**Claims.** Tracker (`:15`): "~40% — FOUNDATION SHIPPED: `scripts/testsuite/enforce.js`, `recurring-bug-classes.json` (**28 classes** on disk), sprint-close `regressionSeedGate()` in `release.js` (commit 4bfb0ac), release-gates wiring, `_docs/sprint/TESTSUITE.md`. REMAINING: `_planning`/diff/hook-overhaul batch + per-sprint feature suites + focus/centering mechanism." Open question logged: "26-vs-28 class count — reconcile."

**Reality (verified).**
- `scripts/testsuite/enforce.js` EXISTS (10,658 bytes).
- `_requirements/07-testing/recurring-bug-classes.json` now holds **30 classes** (node count), NOT 28 (and not the 30 stated in the prompt's framing nor the 26 in the ROADMAP narrative). The seed has GROWN since the tracker was written — so the tracker UNDERSTATES the seed coverage. The logged "26-vs-28" open question is itself now stale (it's 30).
- 24 `tests/regression/` suite dirs exist (S-LC-01..12, S-PF-*, SP-*). The tracker's "per-sprint feature suites not yet built" is understated — many per-sprint suites DO exist (the E-LIFECYCLE wave shipped 12 of them); what's genuinely missing is the *named* `_planning`/diff/hook-overhaul batch + the focus/centering mechanism.

**Verdict.** STALE-UNDERSTATED. The seed is larger (30 not 28) and more per-sprint suites exist than the ~40% prose implies; the foundational enforcer is real and the genuinely-remaining items (focus/centering mechanism, the named batch, full-green seed run + both-role install-matrix proof) are correctly open.
**Most important reconciliation:** Re-count the seed (30 classes) and close the stale "26-vs-28" open question; refresh the % given the regression-suite corpus that has accumulated. The DoD's genuine gaps (centering mechanism + full-green evidenced run) remain.

---

## 6. Planned epics — quick reality check

### E-MULTIPRODUCT-001 → **ACCURATE (Planned, 0%)**
- Claimed-absent pieces verified ABSENT: `scripts/checks/skill-engines.js`, `.claude/commands/scan/skill-engines.md` (the `/scan:skill-engines` skill — not built), and no `--yes-install-on-main` branch-guard literal found in scripts/commands. Correctly 0%.
- Note (not a drift, but worth flagging): `scripts/portfolio/sync.js` + `.claude/commands/portfolio/sync.md` DO exist — but DoD#1 is "`/portfolio:sync` lands clean across ≥3 products in one invocation" (an evidenced behavioral bar), which existence-of-the-skill does not satisfy. So 0% is defensible. ACCURATE.

### E-SKILL-CATALOG-001 → **ACCURATE (Planned, 0%)**
- Tracker honestly says "0% — some sub-items addressed piecemeal (provider/ghost-model hygiene partly in the 2026-05-30 dispatch cluster) but no DoD item complete-with-evidence under this epic." DoD items (`/skills:cleanup` zero-broken, `events.jsonl` auto-roll, provider staleness exit 0, `/ui:review` on fresh product) are all genuinely-open behavioral bars. No overstatement; the piecemeal caveat is the right hedge. ACCURATE.

### E-MANAGER-LAYER-001 → **ACCURATE (Planned, ~70% delivered out-of-band)**
- Tracker says ~70% delivered by E-ADR0007 (department tree + Director/Lead personas + `role-registry.json` + registry-resolved `/roadmap:*`), residual ~30% = the declarative `temporary-agent:` skill-scoped injection mechanism + `manager-consult` audit trail. The substrate genuinely exists (the agent roster in the system prompt confirms director-of-*, *-lead personas are live). The residual injection mechanism is plausibly unbuilt (DoD#1/#2 marked Missing But Required). ROADMAP cleanup note (`:33`) already says "restate as ~30% residual" — consistent. ACCURATE.

---

## Cross-cutting findings

1. **The motivating drift class (tracker-says-open-but-done) is NOT widespread in the epic trackers.** The four items that triggered this audit (consumer-contract gate, repo-role resolver, BC-16 typed-success, dispatch-readiness preflight) were reconciled into their epics already. The remaining epics' trackers are conservative-to-accurate. The ONE inverse case (E-CONTENT-DELIVERY DoD#2) is a stale-POSITIVE (claims done, regressed to red), which is the more dangerous direction.

2. **The real drift is ROADMAP-detail-blocks lagging the trackers.** E-DISPATCH-SHAPE-001 is the clearest: ROADMAP says "0% / W0 starting"; tracker + code say W0+W1 landed (~50%). The trackers are the trustworthy source; the ROADMAP `####` detail blocks are stale snapshots. (E-LIFECYCLE's ROADMAP block IS current at ~92%, so it's not universal — it's per-epic neglect.)

3. **Two stale logged open-questions worth closing:** E-TEST-SUITE's "26-vs-28 class count" (actually 30 now) and E-CONTENT-DELIVERY's DoD#2 green claim (now red). Both are cheap reconciliations.

4. **Live gate health flag (beyond prose):** `warpos-ship-coverage.js` exits 1 today. Any `/scan:full` or release path that runs it strict is currently failing on the panel/cockpit/admin script dirs. This is an actionable regression independent of any tracker edit.
