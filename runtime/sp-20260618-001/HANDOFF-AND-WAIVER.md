# SP-20260618-001 — Handoff + Pre-existing-Drift Waiver (for α's convergence-battery + merge)

## Sprint state (handoff-ready)
- Worktree: `.worktrees/SP-20260618-001-U1`, branch `wt/SP-20260618-001-U1`, HEAD **54a7acff**
  (protective tag `sp-20260618-001-gauntlet-green` → 54a7acff, recoverable if the branch moves).
- Commit chain: a35df99d (U1) → eff3b1a0 (U2) → 57476d73 (U3) → 0c802292 (security-fix) → 54a7acff (qa-harden).
- Gauntlet GREEN: backend PASS, qa PASS, security FAIL→fix→PASS; gauntlet-verify telemetry PASS.
- Close-verify on HEAD ALL GREEN: ship-coverage 1907/0-gaps, assert-templates-shipped pos+neg,
  structure-parity {ok:true,24}, seed-provenance 14/14, ship-coverage-own-test 30/30. Tree clean.
- framework/templates DELETED; _warpos/templates is the sole home (108 files / 9 dirs).

## ⚠️ KNOWN PRE-EXISTING NON-REGRESSION WAIVER (do NOT block the merge on this)
**test-install-matrix scenario 2 (existing_install_upgrade) exits 1** — solely on a 0.16.0 release
capsule integrity drift, NOT introduced by this sprint.

**Evidence it is pre-existing (ε-verified):**
- `framework/releases/0.16.0/checksums.json` records `changelog.md` sha256 = `e29eed40…`.
- The actual `framework/releases/0.16.0/changelog.md` hashes to `d7ace51a…`.
- **Canonical/main** `framework/releases/0.16.0/changelog.md` ALSO hashes to `d7ace51a…` (same drift on main).
- `git log a35df99d^..HEAD -- framework/releases/0.16.0/` is **empty** — the sprint never touched that path.
- **α-CONFIRMED (β's capsule rider):** `git diff main...HEAD -- framework/releases/0.16.0` is **EMPTY** —
  independently verified by α via git (not just asserted by ε), per β's gauntlet→release rider. The sprint
  did not touch `framework/releases/0.16.0`; the drift is definitively pre-existing on main.

**Why it wasn't fixed here:** the remedy is `node scripts/warpos/release-build.js 0.16.0` (regenerate the
capsule + checksums) = a DoD#2 capsule rebuild, deliberately OUT OF SCOPE for the templates-migration.
The U3 builder correctly STOPPED rather than rebuild or weaken the matrix assertion. All 5 of U3's OWN
assertions PASS in both scenarios; the matrix overall-exit-1 is solely this upstream drift.

**Waiver:** at the release/merge boundary, treat scenario-2 exit-1 as a pre-existing non-regression
(hash evidence above), not a sprint FAIL. The real fix is tracked here (and in TaskList #6) so it's not
lost — file a formal ticket via `scripts/sprint/ticket.js` (needs a plan-contract) or a release-rebuild
follow-up if you want it in the sprint system; I left it as this durable note rather than abuse the
ticket schema for a non-sprint bug.

## Other retro items (non-blocking)
- gemini CLI tier-INELIGIBLE (IneligibleTierError — "no longer supported for Gemini Code Assist for
  individuals"). GPT 2nd-pass failover covered the security lane. Provider-readiness gap → candidate ED.
- _warpos/BASELINE has no regen enforcer (hand-built in U1; gets a generator when validate.js seed-drift
  lands). Deferred-debt.
- Dispatch-infra reaps (REAP-FIX-NOTE.md): (a) the 540s foreground clamp unless WARPOS_DISPATCH_BACKGROUND=1;
  (b) a backgrounded dispatch silently DROPPED with no completion notification (WG-6); (c) even with the
  bg-signal, my own `timeout 560` outer wrapper is the binding ceiling. Three real dispatch-reliability
  gaps → candidate EDs (dispatch-perfect-epic evidence).

## Next (ε, on β's gauntlet→release DECIDE)
Reconcile E-CONTENT-DELIVERY-001 epic/tracker/ROADMAP to 100% (all 4 DoD now met: U1=DoD#1, DoD#2
pre-done, U2=DoD#3, U3=DoD#4) IN THE WORKTREE → ops-analyst retro → hand you the worktree at HEAD for
the convergence-battery verify + merge-to-main (operator-gated push — ε does NOT merge).
