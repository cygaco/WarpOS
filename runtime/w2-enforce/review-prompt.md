# Cross-family review — E-DISPATCH-SHAPE-001 W2 ENFORCE flip (HIGH-blast)

You are an independent cross-provider reviewer. Review the diff below for **correctness and blast-safety**. This change flips the WarpOS dispatch "shape door" from report-only to **enforce** on the production dispatch path, so a false-refusal would break real agent dispatches. Be adversarial: try to find a way a LEGITIMATE dispatch gets refused.

## What the change does
1. **`dispatch-shape.js#shapeDoor`** gains a per-wrapper `opts.enforceDefault` flag so wrappers ramp to enforce ONE AT A TIME. New mode precedence: kill-switch (`WARPOS_DISABLE_SHAPE_DOOR`) / `reportOnlyPin` → report (beats all); global `WARPOS_SHAPE_DOOR=enforce`/legacy block → enforce; global `WARPOS_SHAPE_DOOR=report` → report (fleet kill); else → the wrapper's `enforceDefault` decides.
2. **3 agent wrappers flipped to enforce** (`dispatch-agent`, `dispatch-claude`, `epsilon-runtime` CLAUDE_RAW), each with a per-wrapper kill env (`WARPOS_SHAPE_DOOR_DISPATCH_AGENT|DISPATCH_CLAUDE|EPSILON=report`). `dispatch-skill` is NOT flipped (stays report-pinned).

## The safe-by-construction claim to verify
`shapeDoor` only REFUSES when `mode==="enforce" && mismatch.severity==="high"`. The two high-severity cases are: (1) an UNPROVEN unit dispatched as any subprocess shape, (2) a `subprocess-claude` unit dispatched as `in-process-agent`. The claim: a legitimate agent dispatch through these CLI wrappers resolves through the contract to `proven:true` + a shape that MATCHES the wrapper's fixed `actualShape`, so it is never high-severity → never refused. A wrong-wrapper (e.g. a builder shoved through the cross-provider path) is only MEDIUM → advisory, still not refused.

## Verify specifically
1. **Precedence correctness** — is the mode computation coherent? Can any combination of (kill-switch, pin, global env, enforceDefault) produce an UNSAFE enforce (e.g. enforce when the operator set the fleet kill)?
2. **No false-refusal** — is there ANY legitimate dispatch (a real reviewer via dispatch-agent, a real builder via dispatch-claude, a real role via epsilon CLAUDE_RAW) that resolves to `proven:false` OR a high-severity mismatch and would be wrongly refused?
3. **FIX-A3 preserved** — dispatch-claude still passes `sanctioned: fallbackSanctioned`; the sanctioned lane must still proceed+suppress in BOTH modes (the `--review-fallback` recorded lane must not be bricked).
4. **Escapes real** — do the per-wrapper env / fleet `WARPOS_SHAPE_DOOR=report` / `WARPOS_DISABLE_SHAPE_DOOR=1` kills actually force report?
5. **Fail-open preserved** — a resolver error must still proceed (never break a working dispatch).
6. **Test adequacy** — do the added shape-door tests actually exercise the enforce path + the escapes?

## Output
Return JSON: `{"verdict":"PASS"|"FAIL","confidence":0..1,"findings":[{"severity":"blocker"|"high"|"med"|"low","where":"file:line-ish","issue":"...","fix":"..."}],"summary":"..."}`. A `blocker` or `high` finding = FAIL. If the safe-by-construction claim holds and no legitimate dispatch can be false-refused, PASS.

---

## THE DIFF

```diff
diff --git a/scripts/dispatch-agent.js b/scripts/dispatch-agent.js
index 12ca1703..8d4ab1eb 100644
--- a/scripts/dispatch-agent.js
+++ b/scripts/dispatch-agent.js
@@ -553,13 +553,21 @@ try {
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
+  const enforceDefault = !/^(report|off|0)$/i.test(String(process.env.WARPOS_SHAPE_DOOR_DISPATCH_AGENT || ""));
+  const door = shapeDoor("subprocess-cross-provider", { kind: "agent", id: role }, process.env, { enforceDefault });
   if (door.mismatch && door.mismatch.mismatch && !door.suppressed) {
     // β#4: report-mode advisory string stays BYTE-IDENTICAL to the pre-door legacy (no `(mode)`
     // label); only the new refuse path (exit 2) carries the mode in its VIOLATION wording.
diff --git a/scripts/dispatch-claude.js b/scripts/dispatch-claude.js
index 74bd2459..212dd807 100644
--- a/scripts/dispatch-claude.js
+++ b/scripts/dispatch-claude.js
@@ -471,7 +471,13 @@ try {
   // consult already noted; the resolver's name-heuristic resolves them to subprocess-claude
   // (a MATCH — no mismatch) — but keep the guard so they never surface a stray advisory.
   if (!GENERIC_BUILD_IDS.has(role.toLowerCase())) {
-    const door = shapeDoor("subprocess-claude", { kind: "agent", id: role }, process.env, { sanctioned: fallbackSanctioned });
+    // W2/N2 ENFORCE FLIP (2026-06-16): dispatch-claude enforces by default. Safe-by-construction
+    // (a real build-chain role resolves proven:true + 'subprocess-claude' MATCH → never refused;
+    // the FIX-A3 sanctioned lane still proceeds+suppressed in BOTH modes). Per-wrapper kill:
+    // WARPOS_SHAPE_DOOR_DISPATCH_CLAUDE=report; fleet kill: WARPOS_SHAPE_DOOR=report; ultimate:
+    // WARPOS_DISABLE_SHAPE_DOOR=1.
+    const enforceDefault = !/^(report|off|0)$/i.test(String(process.env.WARPOS_SHAPE_DOOR_DISPATCH_CLAUDE || ""));
+    const door = shapeDoor("subprocess-claude", { kind: "agent", id: role }, process.env, { sanctioned: fallbackSanctioned, enforceDefault });
     if (door.mismatch && door.mismatch.mismatch && !door.suppressed) {
       // β#4: the report-mode advisory string stays BYTE-IDENTICAL to the pre-door legacy
       // (no `(mode)` label) — a consumer comparing dispatch stderr must see no change. The
diff --git a/scripts/dispatch/dispatch-shape.js b/scripts/dispatch/dispatch-shape.js
index fd808f4f..f2834c0c 100644
--- a/scripts/dispatch/dispatch-shape.js
+++ b/scripts/dispatch/dispatch-shape.js
@@ -288,6 +288,10 @@ function shapeMismatch(actualShape, unit) {
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
@@ -296,10 +300,22 @@ function shapeDoor(actualShape, unit, env, opts) {
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
+  let mode;
+  if (killed || pinned) mode = "report";
+  else if (globalRaw === "enforce" || legacyBlock) mode = "enforce";
+  else if (globalRaw === "report") mode = "report";
+  else mode = wrapperEnforce ? "enforce" : "report";
   // (2) resolver fault → fail-OPEN. A self-detection gate must never break a working dispatch.
   let mm;
   try {
diff --git a/scripts/sprint/epsilon-runtime.js b/scripts/sprint/epsilon-runtime.js
index 72f6426c..f08caab3 100644
--- a/scripts/sprint/epsilon-runtime.js
+++ b/scripts/sprint/epsilon-runtime.js
@@ -565,7 +565,12 @@ function spawnAgent(agentPlan, sprintId, opts = {}) {
   // abort THIS spawn (a failed dispatch), never process.exit (ε is a long-running conductor).
   try {
     const { shapeDoor } = require(path.join(root, "scripts/dispatch/dispatch-shape.js"));
-    const door = shapeDoor("subprocess-claude", { kind: "agent", id: agentPlan.role }, env, {});
+    // W2/N2 ENFORCE FLIP (2026-06-16): CLAUDE_RAW enforces by default (it rides the ramp).
+    // Safe-by-construction (a real role resolves proven:true + 'subprocess-claude' MATCH → never
+    // refused). On REFUSE ε aborts THIS spawn (never process.exit). Per-wrapper kill:
+    // WARPOS_SHAPE_DOOR_EPSILON=report; fleet kill: WARPOS_SHAPE_DOOR=report; ultimate: WARPOS_DISABLE_SHAPE_DOOR=1.
+    const enforceDefault = !/^(report|off|0)$/i.test(String(env.WARPOS_SHAPE_DOOR_EPSILON || ""));
+    const door = shapeDoor("subprocess-claude", { kind: "agent", id: agentPlan.role }, env, { enforceDefault });
     if (door.mismatch && door.mismatch.mismatch && !door.suppressed) {
       process.stderr.write(
         `[epsilon-runtime] CLAUDE_RAW shape-resolver ${door.action === "refuse" ? "VIOLATION" : "advisory"} (${door.mode}): role '${agentPlan.role}' spawned raw as 'subprocess-claude' but the resolver picks '${door.mismatch.expected}' (${door.mismatch.expectedReason || door.mismatch.reason}).\n`,
diff --git a/tests/regression/SP-20260616-001/shape-door.test.js b/tests/regression/SP-20260616-001/shape-door.test.js
index 0eda824b..2a3738c4 100644
--- a/tests/regression/SP-20260616-001/shape-door.test.js
+++ b/tests/regression/SP-20260616-001/shape-door.test.js
@@ -94,5 +94,39 @@ test("never-throws-on-adversarial-input", () => {
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
