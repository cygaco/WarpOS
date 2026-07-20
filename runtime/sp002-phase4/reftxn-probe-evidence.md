# Seam E evidence probe — git reference-transaction hook coverage (2026-07-20)

Grounds β rider 2 (sole-route = MECHANISM, honest ceiling from EVIDENCE not assumption) + DoE build_spec Seam E. Probe ran in a throwaway repo (scratchpad, never touched the real repo's hooks).

**Environment:** git version 2.54.0.windows.1

**Result — the `reference-transaction` hook FIRES on every write surface to a protected ref:**
- `commit` → refs/heads/main (state preparing/prepared/committed)
- `git update-ref` (direct ref write) → refs/heads/side (fired)
- fast-forward merge → refs/heads/main (fired)
- non-ff merge → refs/heads/main + AUTO_MERGE + ORIG_HEAD (fired)
Every ref mutation passes through the hook in phases {preparing, prepared, committed, aborted}.

**Abort capability CONFIRMED:** a `reference-transaction` hook that exits non-zero in the `prepared` phase ABORTS the write — `fatal: in 'prepared' phase, update aborted by the reference-transaction hook`; the target ref was NOT created (verified absent). So the hook is a real PREVENTION mechanism, not detection-after-the-fact.

**Stronger than DoE assumed:** `--no-verify` does NOT bypass `reference-transaction` hooks (it only bypasses pre-commit/commit-msg/pre-push). So the sole-route mechanism resists the `--no-verify` mistake-class entirely.

**Honest-ceiling (named-uncovered, all operator-DROPPED / hostile-shell):** `core.hooksPath` redirect, hook file deletion, a direct `.git/refs/**` filesystem write, and a hostile process forging the controller fence. These require local shell + intent = adversarial-containment, explicitly OUT of the honest promise.

**Consequence for the build:** DoE Seam E's "delegation-complete across update-ref/merge/push/fast-forward" claim is EVIDENCE-GROUNDED (one reference-transaction hook covers all). The G4.4 delegation-completeness fixture asserts each surface is refused when un-brokered; the honest-promise statement names the hostile-shell ceiling.
