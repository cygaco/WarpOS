# Cross-family review — E-DISPATCH-SHAPE-001: dispatch-CONTRACT gate enforce flip (ADR-0013)

Independent cross-provider review of flipping the dispatch-contract gate (validateDispatch) to enforce-by-default on the LIVE dispatch path (dispatch-agent.js + dispatch-claude.js). It's a SECOND gate, distinct from the shape-door (already enforced): validateDispatch checks forbidden_shapes + api-when-CLI + build-chain→NOT-in-process + cwd-worktree + mode-narrowing. Be adversarial: find a way it FALSE-REFUSES a legitimate dispatch.

## The change
A shared contractEnforceMode(wrapperKey, env) helper: enforce by DEFAULT; escapes = per-wrapper WARPOS_DISPATCH_CONTRACT_ENFORCE_<WRAPPER>=report, fleet WARPOS_DISPATCH_CONTRACT_ENFORCE=report, master WARPOS_DISABLE_SHAPE_DOOR=1; legacy =block still enforces. The contract-consult runs BEFORE the shape-door (exit 1 vs exit 2). The consult is in a fail-OPEN try/catch (a contract-read error never refuses). The dispatch-claude review-fallback SANCTIONED lane proceeds in both modes (must not be bricked).

## Verify specifically
1. Can a LEGITIMATE dispatch be false-refused under the new default? (a real cross-provider reviewer via dispatch-agent; a real build-chain builder via dispatch-claude with -w/worktree; the review-fallback sanctioned lane.)
2. Is the fail-OPEN preserved (a contract module load/read error must NOT refuse)?
3. Do the escapes actually force report (per-wrapper, fleet, master)?
4. Is the precedence (contract exit 1 BEFORE door exit 2) sound — no double-refuse, no escape that disables one gate but not the other unexpectedly?
5. Does the dispatch-claude GENERIC_BUILD_IDS path (builder re-validated vs the class) still behave correctly under enforce?

## Output
JSON: {"verdict":"PASS"|"FAIL","confidence":0..1,"findings":[{"severity":"blocker"|"high"|"med"|"low","issue":"...","fix":"..."}],"summary":"..."}. blocker/high = FAIL.

---
## THE DIFF
```diff
diff --git a/scripts/dispatch-agent.js b/scripts/dispatch-agent.js
index 9173482b..8738893c 100644
--- a/scripts/dispatch-agent.js
+++ b/scripts/dispatch-agent.js
@@ -526,7 +526,7 @@ if (provider === "claude") {
 // WARPOS_DISPATCH_CONTRACT_ENFORCE=block makes a violation fatal. Fail-OPEN on any
 // contract-read error so the contract never crashes a working cross-provider dispatch.
 try {
-  const { validateDispatch } = require("./dispatch/dispatch-contract");
+  const { validateDispatch, contractEnforceMode } = require("./dispatch/dispatch-contract");
   const currentMode = detectMode();
   const verdict = validateDispatch({
     role,
@@ -535,7 +535,9 @@ try {
     mode: currentMode,
   });
   if (!verdict.ok) {
-    const blocking = process.env.WARPOS_DISPATCH_CONTRACT_ENFORCE === "block";
+    // W2 flip (β DECIDE 0.87, ADR-0013): contract gate enforces by DEFAULT (it checks api-when-CLI
+    // + forbidden_shapes + in-process-hard + cwd the shape-door doesn't). Escapes via the helper.
+    const blocking = contractEnforceMode("DISPATCH_AGENT", process.env);
     process.stderr.write(
       `[dispatch-agent] dispatch-contract ${blocking ? "VIOLATION" : "advisory"}: ${verdict.violations.join("; ")}\n`,
     );
diff --git a/scripts/dispatch-claude.js b/scripts/dispatch-claude.js
index d97b1f62..0a4fba19 100644
--- a/scripts/dispatch-claude.js
+++ b/scripts/dispatch-claude.js
@@ -362,7 +362,7 @@ const currentMode = detectMode();
 // set WARPOS_DISPATCH_CONTRACT_ENFORCE=block to make a violation fatal. Fail-OPEN
 // on any contract-read error — the contract must never crash a working dispatch.
 try {
-  const { validateDispatch, validateDispatchForClass, sanctionedLane } = require("./dispatch/dispatch-contract");
+  const { validateDispatch, validateDispatchForClass, sanctionedLane, contractEnforceMode } = require("./dispatch/dispatch-contract");
   const verdict = validateDispatch({
     role,
     shape: "subprocess-claude",
@@ -394,7 +394,7 @@ try {
     } else {
       // A real violation (e.g. worktree-required + canonical cwd when using -w).
       // Report it honestly — still NOT "(fail-closed)", since the shape/tool are correct.
-      const blocking = process.env.WARPOS_DISPATCH_CONTRACT_ENFORCE === "block";
+      const blocking = contractEnforceMode("DISPATCH_CLAUDE", process.env); // W2 flip (ADR-0013): enforce by default
       process.stderr.write(
         `[dispatch-claude] dispatch-contract ${blocking ? "VIOLATION" : "advisory"}: ${classVerdict.violations.join("; ")}\n`,
       );
@@ -410,7 +410,7 @@ try {
   } else if (!verdict.ok) {
     // Genuinely unknown id (not in role-registry, not a GENERIC_BUILD_ID), or a real
     // violation for a registered role. Keep the honest fail-closed wording unchanged.
-    const blocking = process.env.WARPOS_DISPATCH_CONTRACT_ENFORCE === "block";
+    const blocking = contractEnforceMode("DISPATCH_CLAUDE", process.env); // W2 flip (ADR-0013): enforce by default
     // T-311 (crossfam A.2): consult the REGISTERED sanctioned lane instead of suppressing
     // via a wrapper-local `!blocking` conditional. A registered review-fallback lane
     // resolves valid in BOTH report-only AND blocking (ENFORCE) modes, so the W2 flip can
diff --git a/scripts/dispatch/dispatch-contract.js b/scripts/dispatch/dispatch-contract.js
index 29797b49..5473872e 100644
--- a/scripts/dispatch/dispatch-contract.js
+++ b/scripts/dispatch/dispatch-contract.js
@@ -530,9 +530,30 @@ function validateContractFile() {
   return { ok: violations.length === 0, violations };
 }
 
+// W2 dispatch-contract ENFORCE flip (β DECIDE 0.87, ADR-0013). The contract gate (validateDispatch)
+// enforces by DEFAULT — it checks a STRICTLY LARGER surface than the shape-door: forbidden_shapes,
+// the api-when-CLI rule (operator failure ii), build-chain→NOT-in-process (iii), cwd-worktree-
+// required, mode-narrowing — none of which the shape-door (the canonical-PICK gate) evaluates. The
+// two overlap only on the canonical shape; the contract-consult runs BEFORE the door (exit 1 vs the
+// door's exit 2 — defined precedence, no double-refuse). Escapes mirror the shape-door so an
+// operator keeps a fleet + per-wrapper + master off-switch:
+//   WARPOS_DISABLE_SHAPE_DOOR=1                        → master kill (disables BOTH dispatch gates)
+//   WARPOS_DISPATCH_CONTRACT_ENFORCE=report|off|0      → fleet kill (contract gate)
+//   WARPOS_DISPATCH_CONTRACT_ENFORCE_<WRAPPER>=report  → per-wrapper kill (e.g. _DISPATCH_AGENT)
+//   (legacy WARPOS_DISPATCH_CONTRACT_ENFORCE=block still enforces — now the default)
+function contractEnforceMode(wrapperKey, env) {
+  const e = env || process.env;
+  if (/^(1|true|yes)$/i.test(String(e.WARPOS_DISABLE_SHAPE_DOOR || ""))) return false;
+  const per = String(e[`WARPOS_DISPATCH_CONTRACT_ENFORCE_${wrapperKey}`] || "").toLowerCase();
+  if (per === "report" || per === "off" || per === "0") return false;
+  const g = String(e.WARPOS_DISPATCH_CONTRACT_ENFORCE || "").toLowerCase();
+  if (g === "report" || g === "off" || g === "0") return false;
+  return true; // enforce by default
+}
+
 module.exports = {
   loadContract, loadRegistry, classForRole, contractForRole, validateDispatch,
-  validateDispatchForClass, sanctionedLane,
+  validateDispatchForClass, sanctionedLane, contractEnforceMode,
   skillExecution, validateContractFile, registryAttrs, CONTRACT_PATH, REGISTRY_PATH,
   ARGV_SCHEMA_VERSION, modeProfile, allowedShapesForRoleInMode, allowedShapesForClassInMode,
 };

```
