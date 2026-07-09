# Cross-provider RE-REVIEW — admin:* suite (SP-20260614-002) — confirm 6 prior findings fixed

You previously reviewed this dev-tooling suite and returned FAIL with 6 findings (4 blockers). The fixes have been applied. RE-VERIFY each finding against the CURRENT code and give a fresh BINDING verdict. Be skeptical — confirm the fix is real, not cosmetic.

Verify each is now FIXED:

1. **(was BLOCKER) detectReady premature** — `scripts/admin/preview.js`. Confirm readiness now requires an EXPLICIT ready signal (`Ready in`/`ready on`/`started server on`) — NOT a bare `- Local:` or `compiled` line. Repro to re-run: `require("./scripts/admin/preview").detectReady("> next dev\n - Local: http://localhost:4123\n")` must now return `{ready:false}`. (READY_SIGNAL_RE replaced READY_RE.)
2. **(was BLOCKER) dev-server lifecycle/orphan** — `scripts/admin/preview.js`. Confirm a `treeKill()` helper uses `taskkill /PID <pid> /T /F` on win32 (tree kill, no orphan) and is registered for SIGINT/SIGTERM/SIGHUP/uncaughtException/exit (centralized `cleanup`), at the timeout, pointer-write-failure, and signal sites.
3. **(was BLOCKER) enforcer opener-injection** — `scripts/checks/admin-suite-coverage.js`. Confirm openers are now validated with an ANCHORED regex (`^node\s+scripts/admin/<file>.js(\s+--route /admin[/<sub>])?$`) AND shell metacharacters are rejected (`unsafe_opener`). Repro: an opener `node scripts/admin/preview.js && calc.exe` must be flagged, not passed.
4. **(was BLOCKER) WarpOS-guard token-only** — `scripts/checks/admin-suite-coverage.js`. Confirm the guard check now proves CALL ORDER (refuseIfTargetIsWarpOS called in run() BEFORE any side-effecting seam, over comment-stripped source) — a comment mention no longer passes; a seam-before-guard ordering yields `warpos_guard_call_order`.
5. **(was HIGH) seed.js env-overridable refusal** — `scripts/admin/seed.js`. Confirm `refuseIfTargetIsWarpOS` no longer uses `resolveRepoRole` (which honors `WARPOS_REPO_ROLE` env) and instead uses target-local path identity + the target manifest's `warpos:` block / `project.slug==="warpos"`, with NO env override.
6. **(was MEDIUM) enforcer swallows resolver errors** — `scripts/checks/admin-suite-coverage.js`. Confirm resolver subprocess failure (res.error / nonzero status / empty stdout / bad JSON) now surfaces as a distinct `resolver_error` finding, NOT collapsed into `skill_unresolved`.

Also re-confirm the routing file `framework/admin-panel-registry.json` is now blessed (AC-R4c).

The 11 regression tests under `tests/regression/SP-20260614-002/` encode these — spot-check 2-3 that they assert the corrected behavior (not the old bug).

End stdout with ONE line exactly: `VERDICT=<PASS|FAIL> FIXED=<n>/6 REMAINING_BLOCKERS=<n>`. Write detail to `runtime/sp002-admin/xprovider-rereview.md`.
