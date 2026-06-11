# SP-20260611-002 — Gauntlet attempt 1 — FAIL (2026-06-11)

Integrated HEAD 1f7b55c (cad7249..1f7b55c sprint diff). Foreground dispatch-agent.js, security lane GPT-pinned (β #2). Binding verdicts — NOT overridable.

## Verdicts
- backend-reviewer: **FAIL** (openai/gpt-5.5, ok:true, 2240 bytes) — 4 MAJOR.
- security-reviewer: **FAIL** (openai/gpt-5.5, ok:true, 1857 bytes, β-pinned) — 3 BLOCKER + 1 MAJOR.
- qa-reviewer: (pending — running long; folds in when it lands).

## W1-fold confirmed FIXED (security lane)
"T-324 looks fixed; teardown now anchors require/load paths to the hook's own repo root. T-325 also looks fixed; parent-containment was removed in mode-lifecycle-guard.js." → W1FoldFixer work is sound; NOT in the fix-cycle.

## SECURITY findings (binding)
1. **BLOCKER team-guard.js:473 (G1/T-316)** — `namedTeamVerified()` verifies the named team carries the conductor but NOT project ownership (slug/member cwd). A worker passing a real FOREIGN team name (e.g. `doogle-sprint`) skips the sprint readiness gate. SAME project-scoping class as the W1 findings.
2. **BLOCKER team-guard.js:504 (G1)** — sprint readiness selects the globally-freshest team under `~/.claude/teams`, not the project-scoped freshest. A foreign fresh ε team makes `teamReady` true → allows worker dispatch when this project has no correct live team.
3. **BLOCKER authorization-gate.js:119 (G2/T-317)** — `node-e-fs` approves a whole `node -e` if it contains ANY allowed write call, even when the same command also contains `rmSync`/`unlinkSync`. The tracked-delete floor only catches literal extracted targets, so `fs.writeFileSync(...); fs.rmSync(variable)` is approved. Violates "rm/unlink not approvable" (AC-4.1).
4. **MAJOR mode-write-coverage.js:139 (G1)** — corroboration accepts any same-target lifecycle event within ±120min, INCLUDING one before the current mode.json mtime. A direct out-of-band rewrite shortly after a legit same-mode switch greens the detector.

## BACKEND findings (binding)
5. **MAJOR coverage-gate-scan.js:176 (G3a)** — the live CLI calls `auditLedger(records)` with no `expectedSource`; production `/scan` stays self-derived and can't catch the omitted-role slip. The external-expected-source fix (AC-5.3) works ONLY when tests inject `expectedSource`; the real caller never resolves registry/sprint composition.
6. **MAJOR provider-tier-check.js:269 (G3b)** — `unknown-self-attested` gated only on `signals.t1Met`, not on T2 funded. selected t3 + t1Met:true + t2_funded:false + no T3 attestation → `unknown-self-attested` + ok:true instead of `tier_short`. Missing T2 funding is value-free detectable.
7. **MAJOR provider-tier-config.js:137 (G3b)** — read errors (a directory at `--config-path`, permission denial) treated as absent greenfield (`corrupt:false`) → the fail-closed corrupt-config hold doesn't apply. Only TRUE absence should be greenfield; other read failures should be `corrupt:true`.
8. **MAJOR planning-principles.js:259 (G3c)** — `--enforce` fail-closed incomplete: scan-time exceptions are swallowed before the CLI catch. A section-matcher throw returns `false` (="not missing") from the catch at 262-263 → can produce ok:true. Only unhandled exceptions fail-close.

## Sound areas (reviewers confirmed)
Waiver provenance rejects missing operator/ts/trail + surfaces normalized provenance; check-ac category mode non-zero for a planted post-cutoff unreadable artifact; shared cutoff imported by both new consumers; provider-tier t1-down + JSON ok-mirroring for covered cells; W1-fold T-324/T-325.

## Fix-cycle routing
Builders were α's Agent-tool dispatches → α spawns the fixers (max-3 attempts). Surface-grouped fix briefs:
- **G1 fixer** (team-guard.js + mode-write-coverage.js): findings 1, 2, 4 (project-scope the team verification + readiness; tighten the corroboration window to post-mtime).
- **G2 fixer** (authorization-gate.js): finding 3 (reject `node -e` containing rmSync/unlinkSync regardless of co-present writes).
- **G3b fixer** (provider-tier-check.js + provider-tier-config.js): findings 6, 7 (T2-funded gate on unknown-self-attested; read-error→corrupt not greenfield).
- **G3a fixer** (coverage-gate-scan.js): finding 5 (wire expectedSource into the live CLI from registry/composition).
- **G3c fixer** (planning-principles.js): finding 8 (fail-close on scan-time exceptions, not only unhandled).
Re-run the AFFECTED lanes only after fixes (security GPT-pinned). Each fix lands with the exploit fixture that REDs without it (the reviewers found these BECAUSE the existing tests were happy-path on these specific vectors).

## qa-reviewer lane — PENDING at session wrap (2026-06-11 ~08:13Z)
qa-reviewer (b5lc82dfd) was STILL RUNNING when the operator called session wrap — confirmed live (live node procs, clean err log), NOT stalled, just slow on the full-diffstat traceability scope. gauntlet-verify correctly flags it `no-record` = unsatisfied (absence is NOT a pass). It reviews the SAME pre-fix snapshot, so its verdict (if/when it lands) is valid against attempt-1: the NEXT session reads runtime/sp002-gauntlet/qa-reviewer.out.json — if it FAILed with NEW surfaces/defects not in findings 1-8, mint a wave-2 fix brief; if it PASSed or only echoes 1-8, no new fixers needed. Do NOT block the fix-cycle on it.

## FIX1 BRIEFS STAGED (the resume artifact) — 2026-06-11 session wrap
5 self-contained fixer briefs at .warpos/dispshape-prompts/SP-20260611-002-FIX1-{G1,G2,G3a,G3b,G3c}.md, each carrying verbatim finding(s) + fix intent + exploit-fixture-with-mutation requirement + no-regress suite list + fixture namespacing + no-gate-flips. Surface to finding map: G1 = 1,2,4 / G2 = 3 / G3a = 5 / G3b = 6,7 / G3c = 8.

### NEXT-SESSION RESUME (fix-cycle attempt 1, max-3 holds)
1. Create 5 worktrees off the integrated HEAD (current sprint/SP-20260611-002 tip), one per FIX1 brief.
2. Dispatch the 5 fixers in parallel (disjoint surfaces, the 5/5 own-worktree pattern). NOTE: claude-builder BACKGROUND dispatch REAPS at the CLI buffer on this box (RI-004, ~45s) — use Agent-tool (reap-immune, the Option-B shape that built attempt-1) OR foreground.
3. Verify each fixer (commit real, scope-clean, exploit fixture REDs on revert = mutation-verify, no-regress suites pass) — ED-047 evidence shape.
4. Merge all 5 into the integrated branch; fresh manifest regen; cross-surface sanity on integrated tree.
5. Re-run ONLY the affected lanes: security-reviewer --provider openai (GPT-pinned, beta #2) for findings 1-4; backend-reviewer for 5-8; + qa disposition. Binding verdicts.
6. On GREEN: beta gauntlet->release boundary, then release close. On FAIL: attempt 2 (max-3).
