# Cross-family RE-review — E-DISPATCH-SHAPE-001 W2 ENFORCE flip (v2, after fixes)

You are an independent cross-provider reviewer. A PRIOR GPT-5.5 review of this W2 enforce-flip (flips the WarpOS dispatch "shape door" report→enforce on 3 agent wrappers) returned FAIL with 4 findings. They have been FIXED. Verify each is resolved AND hunt for any NEW issue. Be adversarial — try to find a legitimate dispatch that gets false-refused.

## The 4 prior findings + the fix applied
1. **[HIGH] Fail-open not preserved**: a contract LOAD/READ failure made resolveAgent return inline/proven:false → enforce refused every real subprocess dispatch. FIX: in shapeMismatch, `unprovenSubprocess` now EXCLUDES `want.source === "fail-open"` — a fail-open carries proven:false as "UNKNOWN" not "unproven", so it is MEDIUM (advisory), never high/refused. The earn-it `*-failclosed` sources stay high. (Regression test: poisons the contract require, asserts the enforce door PROCEEDS.)
2. **[HIGH] report not absolute vs legacy block**: `WARPOS_SHAPE_DOOR=report` lost to `WARPOS_DISPATCH_CONTRACT_ENFORCE=block`. FIX: the mode precedence now checks explicit `=report` BEFORE `=enforce`/legacyBlock, so the operator's report kill wins. (Regression test added.)
3. **[MED] per-wrapper kill weak**: the per-wrapper env only cleared enforceDefault. FIX: each wrapper now passes `reportOnlyPin:true` when its env is report → forces report even under a global enforce (a TRUE per-wrapper kill). (Regression test added.)
4. **[MED] missing tests**: all three above now have regression tests in shape-door.test.js (17 assertions total).

## Verify specifically (and look for NEW issues)
1. Is the fail-open fix complete — are there OTHER fail-open sources or paths where proven:false from a dependency failure could still reach a high-severity refusal? Check resolveSkill's fail-open too.
2. Is the precedence now fully coherent across {kill-switch, pin, =report, =enforce, legacyBlock, enforceDefault}? Any combination that produces an UNSAFE enforce or a stuck-report?
3. Does `reportOnlyPin:true` truly beat a global enforce in the door? Does the wrapper compute killThis correctly (report/off/0)?
4. Can ANY legitimate registered-role dispatch (reviewer via dispatch-agent, builder via dispatch-claude, role via epsilon) still be false-refused under enforce?
5. Is fail-open still preserved on a genuine resolver THROW (not just contract-unavailable)?

## Output
Return JSON: `{"verdict":"PASS"|"FAIL","confidence":0..1,"findings":[{"severity":"blocker"|"high"|"med"|"low","where":"...","issue":"...","fix":"..."}],"summary":"..."}`. blocker/high = FAIL.

---

## THE DIFF (v2, fixed)

```diff
diff --git a/scripts/dispatch-agent.js b/scripts/dispatch-agent.js
index 12ca1703..a16f7422 100644
--- a/scripts/dispatch-agent.js
+++ b/scripts/dispatch-agent.js
@@ -553,13 +553,24 @@ try {
 // This wrapper OWNS the subprocess-cross-provider shape. Consult the LIVE resolver as
 // the independent authority: if resolveShape picks a DIFFERENT shape for this role, the
 // role is routed through the wrong wrapper (e.g. a build-chain builder pushed through the
-// cross-provider path) — the wrong shape self-detects on a REAL dispatch. Gated by the
-// shared shapeDoor() (WARPOS_SHAPE_DOOR=report|enforce, default report; kill-switch +
-// legacy block flag honored as a deprecated alias inside the door); exit 2 on an enforce
-// refusal; fail-OPEN on any resolver error.
+// cross-provider path) — the wrong shape self-detects on a REAL dispatch. W2/N2 ENFORCE FLIP
+// (2026-06-16): dispatch-agent is the LOWEST-BLAST first flip — it ENFORCES by default
+// (enforceDefault). SAFE-BY-CONSTRUCTION: enforce only REFUSES high-severity mismatches
+// (unproven-subprocess / build-chain-in-process); a legitimate cross-provider reviewer resolves
+// through the contract to proven:true + 'subprocess-cross-provider' (MATCHES → never refused). A
+// mere wrong-wrapper (a builder shoved through this path) is only a MEDIUM advisory — still NOT
+// refused (conservative by design). So the flip cannot false-refuse a real reviewer dispatch; its
+// teeth apply only to a genuinely-dangerous unproven-subprocess unit. Escapes:
+// WARPOS_SHAPE_DOOR_DISPATCH_AGENT=report (per-wrapper kill), global
+// WARPOS_SHAPE_DOOR=report (fleet kill), WARPOS_DISABLE_SHAPE_DOOR=1 (ultimate). exit 2 on an
+// enforce refusal; fail-OPEN on any resolver error.
 try {
   const { shapeDoor } = require("./dispatch/dispatch-shape");
-  const door = shapeDoor("subprocess-cross-provider", { kind: "agent", id: role }, process.env, {});
+  // The per-wrapper env is a TRUE kill (W2 gauntlet MED-1): when set to report, force report via
+  // reportOnlyPin (which beats even a global WARPOS_SHAPE_DOOR=enforce) — not merely clear the
+  // flip. Unset → enforceDefault (the per-wrapper ramp default).
+  const killThis = /^(report|off|0)$/i.test(String(process.env.WARPOS_SHAPE_DOOR_DISPATCH_AGENT || ""));
+  const door = shapeDoor("subprocess-cross-provider", { kind: "agent", id: role }, process.env, killThis ? { reportOnlyPin: true } : { enforceDefault: true });
   if (door.mismatch && door.mismatch.mismatch && !door.suppressed) {
     // β#4: report-mode advisory string stays BYTE-IDENTICAL to the pre-door legacy (no `(mode)`
     // label); only the new refuse path (exit 2) carries the mode in its VIOLATION wording.
diff --git a/scripts/dispatch-claude.js b/scripts/dispatch-claude.js
index 74bd2459..d97b1f62 100644
--- a/scripts/dispatch-claude.js
+++ b/scripts/dispatch-claude.js
@@ -471,7 +471,15 @@ try {
   // consult already noted; the resolver's name-heuristic resolves them to subprocess-claude
   // (a MATCH — no mismatch) — but keep the guard so they never surface a stray advisory.
   if (!GENERIC_BUILD_IDS.has(role.toLowerCase())) {
-    const door = shapeDoor("subprocess-claude", { kind: "agent", id: role }, process.env, { sanctioned: fallbackSanctioned });
+    // W2/N2 ENFORCE FLIP (2026-06-16): dispatch-claude enforces by default. Safe-by-construction
+    // (a real build-chain role resolves proven:true + 'subprocess-claude' MATCH → never refused;
+    // the FIX-A3 sanctioned lane still proceeds+suppressed in BOTH modes). Per-wrapper kill:
+    // WARPOS_SHAPE_DOOR_DISPATCH_CLAUDE=report; fleet kill: WARPOS_SHAPE_DOOR=report; ultimate:
+    // WARPOS_DISABLE_SHAPE_DOOR=1.
+    // Per-wrapper env is a TRUE kill (W2 gauntlet MED-1): report → force report via reportOnlyPin
+    // (beats a global enforce); unset → enforceDefault. sanctioned is preserved in BOTH branches.
+    const killThis = /^(report|off|0)$/i.test(String(process.env.WARPOS_SHAPE_DOOR_DISPATCH_CLAUDE || ""));
+    const door = shapeDoor("subprocess-claude", { kind: "agent", id: role }, process.env, killThis ? { sanctioned: fallbackSanctioned, reportOnlyPin: true } : { sanctioned: fallbackSanctioned, enforceDefault: true });
     if (door.mismatch && door.mismatch.mismatch && !door.suppressed) {
       // β#4: the report-mode advisory string stays BYTE-IDENTICAL to the pre-door legacy
       // (no `(mode)` label) — a consumer comparing dispatch stderr must see no change. The
diff --git a/scripts/dispatch/dispatch-shape.js b/scripts/dispatch/dispatch-shape.js
index fd808f4f..0a3260f3 100644
--- a/scripts/dispatch/dispatch-shape.js
+++ b/scripts/dispatch/dispatch-shape.js
@@ -242,13 +242,21 @@ function shapeMismatch(actualShape, unit) {
   //   2. subprocess-claude unit (build-chain role) dispatched as in-process-agent —
   //      violates worktree isolation: the builder runs inside the orchestrator's
   //      context and can touch files it must not (§2(iii) failure; G2 guardrail).
-  const unprovenSubprocess = !want.proven && /^subprocess/.test(actualShape);
+  // FIX (W2 gauntlet HIGH-1): a FAIL-OPEN resolution (source "fail-open" — the dispatch-contract
+  // was unavailable/unreadable) carries proven:false as "UNKNOWN", not "genuinely unproven". It
+  // must NOT count as the dangerous unproven-subprocess case, else a transient contract-read
+  // failure would make the ENFORCE door REFUSE every real subprocess dispatch (a self-inflicted
+  // outage — the opposite of fail-open). The earn-it FAIL-CLOSED cases (source "...-failclosed")
+  // are a REAL unproven verdict and DO stay high-severity.
+  const unprovenSubprocess =
+    !want.proven && want.source !== "fail-open" && /^subprocess/.test(actualShape);
   const buildChainInProcess = want.shape === "subprocess-claude" && actualShape === "in-process-agent";
   return {
     mismatch: true,
     actual: actualShape,
     expected: want.shape,
     proven: want.proven,
+    source: want.source,
     reason: `dispatched as '${actualShape}' but the resolver picks '${want.shape}'`,
     expectedReason: want.reason,
     severity: (unprovenSubprocess || buildChainInProcess) ? "high" : "medium",
@@ -288,6 +296,10 @@ function shapeMismatch(actualShape, unit) {
 //                            are not earned-subprocess), so an enforce gate would false-refuse
 //                            EVERY skill dispatch until the resolver gains a `subprocess-skill`
 //                            shape (logged enforcement-debt). Pin keeps the advisory, never refuses.
+//   enforceDefault {boolean} — the per-wrapper ENFORCE flip (W2/N2): this wrapper enforces by
+//                            DEFAULT when the global WARPOS_SHAPE_DOOR env is unset, so wrappers
+//                            ramp one at a time. A global WARPOS_SHAPE_DOOR=report (or the
+//                            kill-switch / pin) still overrides it back to report.
 //
 // Returns { action:"proceed"|"refuse", mode, severity, suppressed, reason, mismatch }.
 function shapeDoor(actualShape, unit, env, opts) {
@@ -296,10 +308,25 @@ function shapeDoor(actualShape, unit, env, opts) {
   const killed = /^(1|true|yes)$/i.test(String(e.WARPOS_DISABLE_SHAPE_DOOR || ""));
   const pinned = o.reportOnlyPin === true;
   const legacyBlock = String(e.WARPOS_DISPATCH_CONTRACT_ENFORCE || "") === "block";
-  const enforceRequested =
-    String(e.WARPOS_SHAPE_DOOR || "report").toLowerCase() === "enforce" || legacyBlock;
+  // W2 per-wrapper ENFORCE ramp (N2): a wrapper opts into enforce as its DEFAULT via
+  // opts.enforceDefault (the persistent, committed per-wrapper flip), so wrappers ramp ONE
+  // AT A TIME, lowest-blast first — instead of a single global all-or-nothing switch. The
+  // global env still wins both ways so an operator keeps a fleet-wide override + kill:
+  //   WARPOS_DISABLE_SHAPE_DOOR / reportOnlyPin  → force report (ultimate escapes, beat all)
+  //   WARPOS_SHAPE_DOOR=enforce (or legacy block) → force enforce fleet-wide
+  //   WARPOS_SHAPE_DOOR=report                    → force report fleet-wide (kills the flip)
+  //   else (env unset)                            → the wrapper's enforceDefault decides
+  const globalRaw = String(e.WARPOS_SHAPE_DOOR || "").toLowerCase(); // "" = unset
+  const wrapperEnforce = o.enforceDefault === true;
   // (1) kill-switch / pin checked FIRST — they beat enforce unconditionally (safe side).
-  const mode = (killed || pinned) ? "report" : (enforceRequested ? "enforce" : "report");
+  // FIX (W2 gauntlet HIGH-2): an EXPLICIT WARPOS_SHAPE_DOOR=report is the operator's fleet kill
+  // and must beat the legacy WARPOS_DISPATCH_CONTRACT_ENFORCE=block alias — so it is checked
+  // BEFORE enforce/legacyBlock (a stale legacy env must never override an explicit report kill).
+  let mode;
+  if (killed || pinned) mode = "report";
+  else if (globalRaw === "report") mode = "report";
+  else if (globalRaw === "enforce" || legacyBlock) mode = "enforce";
+  else mode = wrapperEnforce ? "enforce" : "report";
   // (2) resolver fault → fail-OPEN. A self-detection gate must never break a working dispatch.
   let mm;
   try {
diff --git a/scripts/sprint/epsilon-runtime.js b/scripts/sprint/epsilon-runtime.js
index 72f6426c..47398712 100644
--- a/scripts/sprint/epsilon-runtime.js
+++ b/scripts/sprint/epsilon-runtime.js
@@ -565,7 +565,14 @@ function spawnAgent(agentPlan, sprintId, opts = {}) {
   // abort THIS spawn (a failed dispatch), never process.exit (ε is a long-running conductor).
   try {
     const { shapeDoor } = require(path.join(root, "scripts/dispatch/dispatch-shape.js"));
-    const door = shapeDoor("subprocess-claude", { kind: "agent", id: agentPlan.role }, env, {});
+    // W2/N2 ENFORCE FLIP (2026-06-16): CLAUDE_RAW enforces by default (it rides the ramp).
+    // Safe-by-construction (a real role resolves proven:true + 'subprocess-claude' MATCH → never
+    // refused). On REFUSE ε aborts THIS spawn (never process.exit). Per-wrapper kill:
+    // WARPOS_SHAPE_DOOR_EPSILON=report; fleet kill: WARPOS_SHAPE_DOOR=report; ultimate: WARPOS_DISABLE_SHAPE_DOOR=1.
+    // Per-wrapper env is a TRUE kill (W2 gauntlet MED-1): report → force report via reportOnlyPin
+    // (beats a global enforce); unset → enforceDefault (the ramp default).
+    const killThis = /^(report|off|0)$/i.test(String(env.WARPOS_SHAPE_DOOR_EPSILON || ""));
+    const door = shapeDoor("subprocess-claude", { kind: "agent", id: agentPlan.role }, env, killThis ? { reportOnlyPin: true } : { enforceDefault: true });
     if (door.mismatch && door.mismatch.mismatch && !door.suppressed) {
       process.stderr.write(
         `[epsilon-runtime] CLAUDE_RAW shape-resolver ${door.action === "refuse" ? "VIOLATION" : "advisory"} (${door.mode}): role '${agentPlan.role}' spawned raw as 'subprocess-claude' but the resolver picks '${door.mismatch.expected}' (${door.mismatch.expectedReason || door.mismatch.reason}).\n`,
diff --git a/tests/regression/SP-20260616-001/shape-door.test.js b/tests/regression/SP-20260616-001/shape-door.test.js
index 0eda824b..7e1e0784 100644
--- a/tests/regression/SP-20260616-001/shape-door.test.js
+++ b/tests/regression/SP-20260616-001/shape-door.test.js
@@ -94,5 +94,80 @@ test("never-throws-on-adversarial-input", () => {
   }
 });
 
+// ── W2/N2 per-wrapper ENFORCE ramp (opts.enforceDefault) ─────────────────────
+// A wrapper opts into enforce as its default so wrappers ramp ONE AT A TIME, with the global
+// env retaining both a fleet-wide force-on and a fleet-wide force-off (kill) escape.
+test("enforceDefault-enforces-when-env-unset", () => {
+  const r = shapeDoor("subprocess-claude", hiUnit, {}, { enforceDefault: true });
+  assert.strictEqual(r.mode, "enforce", "enforceDefault enforces when the global env is unset");
+  assert.strictEqual(r.action, "refuse");
+  assert.strictEqual(r.severity, "high");
+});
+
+test("enforceDefault-does-not-false-refuse-a-matching-dispatch", () => {
+  // Safe-by-construction: a CORRECT shape never refuses even with the per-wrapper flip on.
+  const r = shapeDoor("inline", { kind: "skill", id: "scan:full" }, {}, { enforceDefault: true });
+  assert.strictEqual(r.action, "proceed", "a matching shape proceeds under the per-wrapper flip");
+});
+
+test("global-report-overrides-the-per-wrapper-flip", () => {
+  const r = shapeDoor("subprocess-claude", hiUnit, { WARPOS_SHAPE_DOOR: "report" }, { enforceDefault: true });
+  assert.strictEqual(r.mode, "report");
+  assert.strictEqual(r.action, "proceed", "the global report escape disables the flip fleet-wide");
+});
+
+test("kill-switch-beats-the-per-wrapper-flip", () => {
+  const r = shapeDoor("subprocess-claude", hiUnit, { WARPOS_DISABLE_SHAPE_DOOR: "1" }, { enforceDefault: true });
+  assert.strictEqual(r.mode, "report", "the kill-switch beats enforceDefault");
+  assert.strictEqual(r.action, "proceed");
+});
+
+test("no-enforceDefault-is-backward-compatible-report", () => {
+  const r = shapeDoor("subprocess-claude", hiUnit, {}, {});
+  assert.strictEqual(r.mode, "report", "a wrapper that does not opt in behaves exactly as before");
+  assert.strictEqual(r.action, "proceed");
+});
+
+// ── W2 GAUNTLET FIXES (GPT-5.5 backend-reviewer found these — regression-locked) ──
+// HIGH-2: an explicit WARPOS_SHAPE_DOOR=report is the operator's fleet kill and MUST beat the
+// legacy WARPOS_DISPATCH_CONTRACT_ENFORCE=block alias (a stale legacy env must not override it).
+test("explicit-report-beats-legacy-block-env", () => {
+  const r = shapeDoor("subprocess-claude", hiUnit, { WARPOS_SHAPE_DOOR: "report", WARPOS_DISPATCH_CONTRACT_ENFORCE: "block" }, {});
+  assert.strictEqual(r.mode, "report", "explicit report kill must beat the legacy block alias");
+  assert.strictEqual(r.action, "proceed");
+});
+
+// MED-1: the per-wrapper kill is implemented as reportOnlyPin — it must force report even under a
+// global enforce (a true per-wrapper kill, not a mere enforceDefault:false).
+test("reportOnlyPin-true-kill-beats-global-enforce", () => {
+  const r = shapeDoor("subprocess-claude", hiUnit, { WARPOS_SHAPE_DOOR: "enforce" }, { reportOnlyPin: true });
+  assert.strictEqual(r.mode, "report", "the per-wrapper reportOnlyPin kill beats a global enforce");
+  assert.strictEqual(r.action, "proceed");
+});
+
+// HIGH-1: a FAIL-OPEN resolution (the dispatch-contract is unavailable/unreadable) must NOT refuse
+// under enforce — a transient contract-read failure must never become a self-inflicted dispatch
+// outage. Poison the contract require so resolveAgent takes the fail-open branch, then assert the
+// ENFORCE door PROCEEDS. (Restores the real modules in finally so later tests are unaffected.)
+test("fail-open-contract-unavailable-proceeds-under-enforce", () => {
+  const contractPath = require.resolve(path.resolve(__dirname, "../../../scripts/dispatch/dispatch-contract.js"));
+  const shapePath = require.resolve(path.resolve(__dirname, "../../../scripts/dispatch/dispatch-shape.js"));
+  const savedContract = require.cache[contractPath];
+  const savedShape = require.cache[shapePath];
+  try {
+    // Exports with NO contractForRole/skillExecution → resolveAgent hits the fail-open branch.
+    require.cache[contractPath] = { id: contractPath, filename: contractPath, loaded: true, exports: {} };
+    delete require.cache[shapePath]; // re-bind a fresh dispatch-shape to the poisoned contract
+    const { shapeDoor: poisonedDoor } = require(shapePath);
+    const r = poisonedDoor("subprocess-claude", { kind: "agent", id: "backend-builder" }, { WARPOS_SHAPE_DOOR: "enforce" }, {});
+    assert.strictEqual(r.action, "proceed", "fail-open (contract-unavailable) must NOT refuse under enforce");
+    assert.notStrictEqual(r.mismatch && r.mismatch.severity, "high", "a fail-open mismatch must not be high-severity");
+  } finally {
+    if (savedContract) require.cache[contractPath] = savedContract; else delete require.cache[contractPath];
+    delete require.cache[shapePath];
+    if (savedShape) require.cache[shapePath] = savedShape;
+  }
+});
+
 console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — shape-door: ${passed} passed, ${failed} failed`);
 if (failed) { console.error("\n" + fails.join("\n")); process.exit(1); }
diff --git a/tests/regression/SP-20260616-001/skill-door.test.js b/tests/regression/SP-20260616-001/skill-door.test.js
index 60d52601..3c729364 100644
--- a/tests/regression/SP-20260616-001/skill-door.test.js
+++ b/tests/regression/SP-20260616-001/skill-door.test.js
@@ -26,9 +26,11 @@ function ok(name, cond, detail) {
 }
 
 // AC-3.1: dispatch-skill consults the door for the skill unit with reportOnlyPin:true.
+// ED-057: the door call now passes its OWN shape "subprocess-skill" (added to the resolver
+// SHAPES + resolveSkill returns it for an earned skill), not the build-chain "subprocess-claude".
 const skillSrc = read("scripts/dispatch-skill.js");
 ok("skill-report-only-pinned-under-enforce: dispatch-skill consults the door for {kind:skill}",
-  /shapeDoor\(\s*"subprocess-claude",\s*\{\s*kind:\s*"skill",\s*id:\s*skill\s*\}/.test(skillSrc));
+  /shapeDoor\(\s*"subprocess-skill",\s*\{\s*kind:\s*"skill",\s*id:\s*skill\s*\}/.test(skillSrc));
 ok("skill-report-only-pinned-under-enforce: it passes reportOnlyPin:true (so enforce can never refuse a skill)",
   /reportOnlyPin:\s*true/.test(skillSrc));
 // The dispatch-skill shape block never refuses (no process.exit in the door region).

```
