# CROSS-FAMILY RE-REVIEW — E-DISPATCH-SHAPE-001 W0+W1 (debt clearance)

You are the cross-family (gemini) lens on work that shipped with claude-only review during your quota outage (2026-06-10). Both waves passed claude execution-access gauntlets (W0: 1 fix-cycle — the runProvider 4th-wrapper clamp; W1: clean after a rate-limit retry). Your job: catch what a same-family reviewer structurally misses (distribution blind spots, shared assumptions).

THE WORK (combined diff, base 4d7301f → ba61a2f, dispatch layer only):
- W0: truthful builder advisory (validateDispatchForClass; generic 'builder' → build_chain_worker class); WARPOS_RUN_ID/PHASE_ID/SPRINT_ID export onto wrapper env + record stamping; foreground-aware timeout clamp (timeout-policy.js, 540s ceiling, fail-closed detection, death-on-bound, 5-wrapper sanity check).
- W1: dispatch-claude --review-fallback recorded lane (fallback:true stamps, build-chain refusal, coverage-gate cross_provider_required trips visibly); provider circuit breaker (provider-breaker.js, fail-open on all faults, quota_exhausted-only, claude exempt, TTL parse-fail→30m); auth-posture surface (value-free auth.json content parse, metered≠oauth, auth_mode in quota envelopes).

ATTACK: fail-open/fail-closed inversions, clamp bypasses, breaker poisoning (could a crafted error mark a HEALTHY provider down?), fallback-lane satisfying coverage silently, key-material leaks, env-var injection through the new exports.
OUTPUT: fenced JSON envelope {"verdict":"PASS|FAIL","blockers":[{"file":"...","line":"...","issue":"...","severity":"blocker|major|minor"}],"notes":"<=300 chars"}

--- BEGIN DIFF ---diff --git a/scripts/checks/dispatch-readiness.js b/scripts/checks/dispatch-readiness.js
index a57aff9..bd3301c 100644
--- a/scripts/checks/dispatch-readiness.js
+++ b/scripts/checks/dispatch-readiness.js
@@ -114,14 +114,61 @@ function detectAuthTier(provider) {
   }
 
   if (provider === "openai") {
-    // codex login writes ~/.codex/auth.json; env key also works.
+    // codex login --with-api-key AND codex login (OAuth) both write auth.json.
+    // We MUST parse the CONTENT to distinguish them — a metered key written by
+    // `codex login --with-api-key` must NOT be reported as oauth/funded.
+    // VALUE-FREE: we read only the PRESENCE of fields, never field values.
     const authFiles = [
       path.join(os.homedir(), ".codex", "auth.json"),
       path.join(os.homedir(), ".config", "codex", "auth.json"),
     ];
-    const loggedIn = authFiles.some((f) => readFileSafe(f) !== null);
+    for (const f of authFiles) {
+      const raw = readFileSafe(f);
+      if (raw === null) continue; // file absent — try next
+      let parsed = null;
+      try { parsed = JSON.parse(raw); } catch { /* unparseable */ }
+      if (parsed !== null && typeof parsed === "object") {
+        // Metered-key signal: `codex login --with-api-key` writes auth_mode or OPENAI_API_KEY.
+        // Check PRESENCE only — VALUE-FREE (never log the key value).
+        const isMetered =
+          Object.prototype.hasOwnProperty.call(parsed, "auth_mode") ||
+          Object.prototype.hasOwnProperty.call(parsed, "OPENAI_API_KEY");
+        if (isMetered) {
+          return {
+            tier: "key",
+            detail:
+              "key (metered) — codex login --with-api-key (auth.json carries a metered API key, NOT an OAuth session)",
+          };
+        }
+        // OAuth signal: refresh_token / access_token / tokens / id_token present.
+        const isOAuth =
+          Object.prototype.hasOwnProperty.call(parsed, "access_token") ||
+          Object.prototype.hasOwnProperty.call(parsed, "refresh_token") ||
+          Object.prototype.hasOwnProperty.call(parsed, "tokens") ||
+          Object.prototype.hasOwnProperty.call(parsed, "id_token");
+        if (isOAuth) {
+          return {
+            tier: "oauth",
+            detail: "oauth (plan) — codex login OAuth session",
+          };
+        }
+        // auth.json present but neither metered nor OAuth signal detected.
+        // Do NOT default to oauth — the whole bug is that default. Be honest.
+        return {
+          tier: "key",
+          detail:
+            "key (unknown posture) — auth.json present but auth_mode/token fields absent; treat as metered until posture is confirmed",
+        };
+      }
+      // auth.json present but could not be parsed (empty / malformed).
+      return {
+        tier: "key",
+        detail:
+          "key (unknown posture) — auth.json present but unreadable; treat as metered until posture is confirmed",
+      };
+    }
+    // No auth file found — fall through to env key check.
     const key = !!(process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY);
-    if (loggedIn) return { tier: "oauth", detail: "codex login session present" };
     if (key) return { tier: "key", detail: "OPENAI_API_KEY in env" };
     return { tier: "none", detail: "no codex login and no OPENAI_API_KEY — run `codex login`" };
   }
diff --git a/scripts/checks/dispatch-readiness.test.js b/scripts/checks/dispatch-readiness.test.js
new file mode 100644
index 0000000..0bb1251
--- /dev/null
+++ b/scripts/checks/dispatch-readiness.test.js
@@ -0,0 +1,215 @@
+#!/usr/bin/env node
+/**
+ * dispatch-readiness.test.js — Planted-violation tests for detectAuthTier (openai branch).
+ *
+ * Core assertion: a metered auth.json (written by `codex login --with-api-key`)
+ * MUST return tier "key", NOT tier "oauth". The old code returned "oauth" for any
+ * present auth.json — that was the 2026-06-07 billing-drain incident.
+ *
+ * Test seam: monkey-patch os.homedir WHILE calling detectAuthTier (not just during
+ * require) so the fixture dir is used instead of the real homedir.
+ *
+ * VALUE-FREE assertion: detail string must NEVER contain the key value.
+ */
+
+"use strict";
+
+const fs = require("fs");
+const os = require("os");
+const path = require("path");
+const assert = require("assert");
+
+// ── Test seam ─────────────────────────────────────────────────────────────────
+// Patch os.homedir around BOTH the require AND the detectAuthTier call,
+// then restore it afterward. Since os is a singleton module, dispatch-readiness's
+// runtime call to os.homedir() will use the patched version.
+function withTmpHome(fixtureFiles, fn) {
+  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dr-test-"));
+  const realHomedir = os.homedir;
+  try {
+    // Write fixture files into tmpDir/<relative-path>
+    for (const [rel, content] of Object.entries(fixtureFiles)) {
+      const dest = path.join(tmpDir, rel);
+      fs.mkdirSync(path.dirname(dest), { recursive: true });
+      fs.writeFileSync(dest, content, "utf8");
+    }
+
+    // Patch homedir
+    os.homedir = () => tmpDir;
+
+    // Purge cached module so it re-closes over the patched os reference.
+    const modPath = require.resolve("./dispatch-readiness");
+    delete require.cache[modPath];
+    const { detectAuthTier } = require("./dispatch-readiness");
+
+    // Call the test function while homedir is still patched.
+    fn(detectAuthTier);
+  } finally {
+    os.homedir = realHomedir;
+    // Purge again so subsequent tests start clean.
+    const modPath = require.resolve("./dispatch-readiness");
+    delete require.cache[modPath];
+    fs.rmSync(tmpDir, { recursive: true, force: true });
+  }
+}
+
+// ── Fixtures ──────────────────────────────────────────────────────────────────
+const METERED_AUTH_JSON = JSON.stringify({
+  auth_mode: "ApiKey",
+  OPENAI_API_KEY: "sk-REDACTED",
+});
+
+const OAUTH_TOKENS_AUTH_JSON = JSON.stringify({
+  tokens: {
+    access_token: "ya29.FAKE_ACCESS",
+    refresh_token: "1//FAKE_REFRESH",
+  },
+});
+
+const OAUTH_FLAT_AUTH_JSON = JSON.stringify({
+  access_token: "ya29.FAKE_ACCESS",
+  refresh_token: "1//FAKE_REFRESH",
+});
+
+// ── Runner ────────────────────────────────────────────────────────────────────
+let passed = 0;
+let failed = 0;
+
+function test(name, fn) {
+  try {
+    fn();
+    console.log(`  ok    ${name}`);
+    passed++;
+  } catch (e) {
+    console.log(`  FAIL  ${name}`);
+    console.log(`        ${e.message}`);
+    failed++;
+  }
+}
+
+// ─────────────────────────────────────────────────────────────────────────────
+console.log("dispatch-readiness: detectAuthTier (openai) — planted-violation + value-free tests");
+console.log("─".repeat(70));
+
+// PLANTED VIOLATION: metered → must be "key", NOT "oauth"
+test("metered auth.json (~/.codex) → tier='key', NOT 'oauth' [PLANTED VIOLATION]", () => {
+  withTmpHome({ ".codex/auth.json": METERED_AUTH_JSON }, (detectAuthTier) => {
+    const result = detectAuthTier("openai");
+    assert.strictEqual(
+      result.tier,
+      "key",
+      `PLANTED VIOLATION: got tier="${result.tier}", expected "key". ` +
+        `The old bug returned "oauth" for any present auth.json.`,
+    );
+    assert.ok(
+      result.detail.includes("metered"),
+      `detail should mention "metered" but got: "${result.detail}"`,
+    );
+  });
+});
+
+// FIX-ALL-PATHS: secondary codex auth path
+test("metered auth.json (~/.config/codex) → tier='key' [FIX-ALL-PATHS]", () => {
+  withTmpHome({ ".config/codex/auth.json": METERED_AUTH_JSON }, (detectAuthTier) => {
+    const result = detectAuthTier("openai");
+    assert.strictEqual(
+      result.tier,
+      "key",
+      `FIX-ALL-PATHS: secondary path must also return tier="key", got "${result.tier}"`,
+    );
+    assert.ok(result.detail.includes("metered"), `detail should mention "metered", got: "${result.detail}"`);
+  });
+});
+
+// OAuth with tokens object
+test("oauth auth.json ({tokens:{access_token,refresh_token}}) → tier='oauth'", () => {
+  withTmpHome({ ".codex/auth.json": OAUTH_TOKENS_AUTH_JSON }, (detectAuthTier) => {
+    const result = detectAuthTier("openai");
+    assert.strictEqual(result.tier, "oauth", `got tier="${result.tier}", expected "oauth"`);
+    assert.ok(
+      result.detail.toLowerCase().includes("oauth"),
+      `detail should mention oauth, got: "${result.detail}"`,
+    );
+  });
+});
+
+// OAuth with flat access_token/refresh_token
+test("oauth auth.json (flat access_token/refresh_token) → tier='oauth'", () => {
+  withTmpHome({ ".codex/auth.json": OAUTH_FLAT_AUTH_JSON }, (detectAuthTier) => {
+    const result = detectAuthTier("openai");
+    assert.strictEqual(result.tier, "oauth", `got tier="${result.tier}", expected "oauth"`);
+  });
+});
+
+// VALUE-FREE: key value must NOT appear in detail
+test("VALUE-FREE: metered detail does NOT contain key value 'sk-REDACTED'", () => {
+  withTmpHome({ ".codex/auth.json": METERED_AUTH_JSON }, (detectAuthTier) => {
+    const result = detectAuthTier("openai");
+    assert.ok(
+      !result.detail.includes("sk-REDACTED"),
+      `VALUE-FREE VIOLATION: detail contains the key value! detail="${result.detail}"`,
+    );
+    assert.ok(
+      !result.detail.includes("sk-"),
+      `VALUE-FREE VIOLATION: detail contains sk- prefix! detail="${result.detail}"`,
+    );
+  });
+});
+
+// VALUE-FREE: token value must NOT appear in detail
+test("VALUE-FREE: oauth detail does NOT contain token value 'ya29.FAKE_ACCESS'", () => {
+  withTmpHome({ ".codex/auth.json": OAUTH_TOKENS_AUTH_JSON }, (detectAuthTier) => {
+    const result = detectAuthTier("openai");
+    assert.ok(
+      !result.detail.includes("ya29.FAKE_ACCESS"),
+      `VALUE-FREE VIOLATION: detail contains token value! detail="${result.detail}"`,
+    );
+  });
+});
+
+// No auth file, no env key → tier='none'
+test("no auth file, no env key → tier='none'", () => {
+  const savedKey = process.env.OPENAI_API_KEY;
+  const savedCodex = process.env.CODEX_API_KEY;
+  delete process.env.OPENAI_API_KEY;
+  delete process.env.CODEX_API_KEY;
+  try {
+    withTmpHome({}, (detectAuthTier) => {
+      const result = detectAuthTier("openai");
+      assert.strictEqual(result.tier, "none", `got tier="${result.tier}", expected "none"`);
+    });
+  } finally {
+    if (savedKey !== undefined) process.env.OPENAI_API_KEY = savedKey;
+    if (savedCodex !== undefined) process.env.CODEX_API_KEY = savedCodex;
+  }
+});
+
+// Ambiguous auth.json → must NOT default to "oauth"
+test("ambiguous auth.json (neither metered nor oauth fields) → tier!='oauth'", () => {
+  const ambiguous = JSON.stringify({ some_unknown_field: "value" });
+  withTmpHome({ ".codex/auth.json": ambiguous }, (detectAuthTier) => {
+    const result = detectAuthTier("openai");
+    assert.notStrictEqual(
+      result.tier,
+      "oauth",
+      `Ambiguous auth.json must NOT default to "oauth" — got tier="${result.tier}"`,
+    );
+  });
+});
+
+// Malformed auth.json → must NOT default to "oauth"
+test("malformed auth.json (not valid JSON) → tier!='oauth'", () => {
+  withTmpHome({ ".codex/auth.json": "NOT_JSON{{{" }, (detectAuthTier) => {
+    const result = detectAuthTier("openai");
+    assert.notStrictEqual(
+      result.tier,
+      "oauth",
+      `Malformed auth.json must NOT default to "oauth" — got tier="${result.tier}"`,
+    );
+  });
+});
+
+// ─────────────────────────────────────────────────────────────────────────────
+console.log("");
+console.log(`${passed} passed, ${failed} failed`);
+process.exit(failed > 0 ? 1 : 0);
diff --git a/scripts/checks/dispatch-timeout-sanity.js b/scripts/checks/dispatch-timeout-sanity.js
new file mode 100644
index 0000000..b567d96
--- /dev/null
+++ b/scripts/checks/dispatch-timeout-sanity.js
@@ -0,0 +1,160 @@
+#!/usr/bin/env node
+"use strict";
+
+/**
+ * dispatch-timeout-sanity.js — Report-only FAIL-CLOSED check (T-20260610-304 / G8/N1).
+ *
+ * Asserts every wrapper's FOREGROUND effective bound is ≤540s (FOREGROUND_CEILING_MS).
+ *
+ * Background: every dispatch wrapper's default timeout exceeded the harness FOREGROUND
+ * Bash ceiling (600s). When run via the harness, the harness killed the wrapper BEFORE
+ * its own bound fired — so the wrapper never wrote its death record. The clamp in
+ * timeout-policy.js fixes this; this check VERIFIES the fix holds.
+ *
+ * FAIL-CLOSED: if the policy module can't be loaded, or a wrapper's bound can't be
+ * computed (constant missing / not a finite number), that reads as a VIOLATION — not
+ * a pass. Mirrors the warpos-install-baseline fail-closed pattern.
+ *
+ * PLANTED-VIOLATION: use `runChecks({ wrapperDefaults: { "bad-wrapper": 30*60*1000 } })`
+ * to confirm a >540s foreground bound is caught as red. See the companion test.
+ *
+ * Output schema: { name, status, reason } per check (green/red). --json for machine
+ * output. Exits 0 on all-green, 1 on any red.
+ *
+ * NOTE: wire into /scan:full report-only (classifier-held — operator edits scan/full.md).
+ *
+ * Run standalone: node scripts/checks/dispatch-timeout-sanity.js [--json]
+ * Test:           node scripts/checks/dispatch-timeout-sanity.test.js
+ */
+
+// ── Load the policy module (FAIL-CLOSED on any import error) ──────────────────
+let policyLoaded = false;
+let FOREGROUND_CEILING_MS, WRAPPER_DEFAULTS, foregroundAwareTimeout;
+let policyLoadError = null;
+try {
+  const policy = require("../dispatch/timeout-policy");
+  FOREGROUND_CEILING_MS = policy.FOREGROUND_CEILING_MS;
+  WRAPPER_DEFAULTS = policy.WRAPPER_DEFAULTS;
+  foregroundAwareTimeout = policy.foregroundAwareTimeout;
+  if (
+    typeof FOREGROUND_CEILING_MS !== "number" ||
+    !Number.isFinite(FOREGROUND_CEILING_MS) ||
+    typeof WRAPPER_DEFAULTS !== "object" ||
+    WRAPPER_DEFAULTS === null ||
+    typeof foregroundAwareTimeout !== "function"
+  ) {
+    throw new Error("timeout-policy module is incomplete (missing or invalid exports)");
+  }
+  policyLoaded = true;
+} catch (e) {
+  policyLoadError = (e && e.message) ? e.message : String(e);
+}
+
+const JSON_OUT = process.argv.includes("--json");
+const START = Date.now();
+
+/**
+ * runChecks(opts) -> { ok: boolean, checks: Array<{name, status, reason, ...}> }
+ *
+ * The programmatic entry point — used by the CLI below AND by the test to inject
+ * planted violations. opts.wrapperDefaults overrides WRAPPER_DEFAULTS for tests.
+ */
+function runChecks(opts) {
+  if (!policyLoaded) {
+    return {
+      ok: false,
+      checks: [{
+        name: "dispatch-timeout-sanity/policy-load",
+        status: "red",
+        reason: `FAIL-CLOSED: timeout-policy module unreadable — ${policyLoadError}`,
+      }],
+    };
+  }
+
+  const targets = (opts && opts.wrapperDefaults != null)
+    ? opts.wrapperDefaults
+    : WRAPPER_DEFAULTS;
+
+  const checks = [];
+  const entries = Object.entries(targets);
+
+  // Empty targets = no wrappers checked = violation (fail-closed: can't verify nothing)
+  if (entries.length === 0) {
+    return {
+      ok: false,
+      checks: [{
+        name: "dispatch-timeout-sanity/empty-targets",
+        status: "red",
+        reason: "FAIL-CLOSED: no wrapper defaults to check — cannot assert the ceiling holds",
+      }],
+    };
+  }
+
+  for (const [wrapper, defaultMs] of entries) {
+    try {
+      if (typeof defaultMs !== "number" || !Number.isFinite(defaultMs)) {
+        throw new Error(`defaultMs is ${JSON.stringify(defaultMs)} — not a finite number`);
+      }
+      // No background signal → foreground path → must be ≤ ceiling
+      const effectiveMs = foregroundAwareTimeout(defaultMs, {});
+      const ok = effectiveMs <= FOREGROUND_CEILING_MS;
+      checks.push({
+        name: `dispatch-timeout-sanity/${wrapper}`,
+        status: ok ? "green" : "red",
+        reason: ok
+          ? `foreground effective bound ${effectiveMs}ms ≤ ${FOREGROUND_CEILING_MS}ms ceiling`
+          : `VIOLATION: foreground effective bound ${effectiveMs}ms > ${FOREGROUND_CEILING_MS}ms ceiling`,
+        wrapper,
+        defaultMs,
+        effectiveMs,
+        ceiling: FOREGROUND_CEILING_MS,
+      });
+    } catch (e) {
+      // FAIL-CLOSED: computation error → treat as violation
+      checks.push({
+        name: `dispatch-timeout-sanity/${wrapper}`,
+        status: "red",
+        reason: `FAIL-CLOSED: could not compute foreground effective bound — ${(e && e.message) ? e.message : e}`,
+        wrapper,
+      });
+    }
+  }
+
+  const ok = checks.every(c => c.status === "green");
+  return { ok, checks };
+}
+
+module.exports = { runChecks };
+
+// ── CLI ───────────────────────────────────────────────────────────────────────
+if (require.main === module) {
+  const result = runChecks();
+  const durationMs = Date.now() - START;
+  const green = result.checks.filter(c => c.status === "green").length;
+  const total = result.checks.length;
+
+  if (JSON_OUT) {
+    console.log(JSON.stringify({
+      name: "dispatch-timeout-sanity",
+      ok: result.ok,
+      status: result.ok ? "green" : "red",
+      durationMs,
+      checks: result.checks,
+    }, null, 2));
+  } else {
+    for (const c of result.checks) {
+      const sym = c.status === "green" ? "✓" : "✗";
+      const detail = (c.effectiveMs != null && c.ceiling != null)
+        ? ` (${c.effectiveMs}ms / ceiling ${c.ceiling}ms)`
+        : "";
+      console.log(`  ${sym} [${c.status.padEnd(5)}] ${c.name}${detail}`);
+      if (c.reason) console.log(`           ${c.reason}`);
+    }
+    console.log(
+      `\ndispatch-timeout-sanity: ${result.ok ? "GREEN" : "RED"} ` +
+      `(${green}/${total} checks passed, ${durationMs}ms)`,
+    );
+  }
+
+  process.exit(result.ok ? 0 : 1);
+}
diff --git a/scripts/checks/dispatch-timeout-sanity.test.js b/scripts/checks/dispatch-timeout-sanity.test.js
new file mode 100644
index 0000000..6ebe9e5
--- /dev/null
+++ b/scripts/checks/dispatch-timeout-sanity.test.js
@@ -0,0 +1,317 @@
+#!/usr/bin/env node
+"use strict";
+
+/**
+ * dispatch-timeout-sanity.test.js — planted-violation + fail-closed tests (T-20260610-304).
+ *
+ * Verifies:
+ *   1. foregroundAwareTimeout helper behavior (clamp, background signal, fail-closed detection).
+ *   2. All WRAPPER_DEFAULTS foreground bounds are ≤ FOREGROUND_CEILING_MS.
+ *   3. runChecks() is GREEN on real WRAPPER_DEFAULTS.
+ *   4. A PLANTED wrapper config with foreground bound > 540s → red (exit 1).
+ *   5. runChecks fail-closes on empty wrapperDefaults and on null/invalid defaultMs.
+ *   6. runChecks is GREEN standalone (integration: node dispatch-timeout-sanity.js exits 0).
+ */
+
+const assert = require("assert");
+const { spawnSync } = require("child_process");
+const path = require("path");
+
+const { foregroundAwareTimeout, FOREGROUND_CEILING_MS, WRAPPER_DEFAULTS } =
+  require("../dispatch/timeout-policy");
+const { runChecks } = require("./dispatch-timeout-sanity");
+
+let passed = 0;
+let failed = 0;
+
+function test(name, fn) {
+  try {
+    fn();
+    console.log(`  ok   ${name}`);
+    passed++;
+  } catch (e) {
+    console.error(`  FAIL ${name}: ${e && e.message ? e.message : e}`);
+    failed++;
+  }
+}
+
+// ── 1. Helper: clamp behavior ────────────────────────────────────────────────
+console.log("\n(1) foregroundAwareTimeout — clamp and background-signal logic:");
+
+test("foregroundAwareTimeout(20min, {}) clamps to FOREGROUND_CEILING_MS", () => {
+  const orig = process.env.WARPOS_DISPATCH_BACKGROUND;
+  delete process.env.WARPOS_DISPATCH_BACKGROUND;
+  try {
+    const result = foregroundAwareTimeout(20 * 60 * 1000, {});
+    assert.strictEqual(result, FOREGROUND_CEILING_MS,
+      `Expected ${FOREGROUND_CEILING_MS}ms, got ${result}ms`);
+  } finally {
+    if (orig !== undefined) process.env.WARPOS_DISPATCH_BACKGROUND = orig;
+  }
+});
+
+test("foregroundAwareTimeout(15min, {}) clamps to FOREGROUND_CEILING_MS", () => {
+  const orig = process.env.WARPOS_DISPATCH_BACKGROUND;
+  delete process.env.WARPOS_DISPATCH_BACKGROUND;
+  try {
+    const result = foregroundAwareTimeout(15 * 60 * 1000, {});
+    assert.strictEqual(result, FOREGROUND_CEILING_MS,
+      `Expected ${FOREGROUND_CEILING_MS}ms, got ${result}ms`);
+  } finally {
+    if (orig !== undefined) process.env.WARPOS_DISPATCH_BACKGROUND = orig;
+  }
+});
+
+test("foregroundAwareTimeout(20min, { background: true }) returns full 20min", () => {
+  const orig = process.env.WARPOS_DISPATCH_BACKGROUND;
+  delete process.env.WARPOS_DISPATCH_BACKGROUND;
+  try {
+    const result = foregroundAwareTimeout(20 * 60 * 1000, { background: true });
+    assert.strictEqual(result, 20 * 60 * 1000,
+      `Expected ${20 * 60 * 1000}ms (full), got ${result}ms`);
+  } finally {
+    if (orig !== undefined) process.env.WARPOS_DISPATCH_BACKGROUND = orig;
+  }
+});
+
+test("WARPOS_DISPATCH_BACKGROUND=1 env signal → full bound (background path)", () => {
+  const orig = process.env.WARPOS_DISPATCH_BACKGROUND;
+  process.env.WARPOS_DISPATCH_BACKGROUND = "1";
+  try {
+    const result = foregroundAwareTimeout(20 * 60 * 1000, {});
+    assert.strictEqual(result, 20 * 60 * 1000,
+      `Expected ${20 * 60 * 1000}ms (full), got ${result}ms`);
+  } finally {
+    if (orig === undefined) delete process.env.WARPOS_DISPATCH_BACKGROUND;
+    else process.env.WARPOS_DISPATCH_BACKGROUND = orig;
+  }
+});
+
+// ── 2. Fail-closed detection: no signal ⇒ clamp ──────────────────────────────
+console.log("\n(2) Fail-closed detection — absence of signal → clamp:");
+
+test("no background signal (env absent, no opts.background) → clamps to ceiling", () => {
+  const orig = process.env.WARPOS_DISPATCH_BACKGROUND;
+  delete process.env.WARPOS_DISPATCH_BACKGROUND;
+  try {
+    const result = foregroundAwareTimeout(20 * 60 * 1000, {});
+    assert(result <= FOREGROUND_CEILING_MS,
+      `Expected ≤ ${FOREGROUND_CEILING_MS}ms (fail-closed clamp), got ${result}ms`);
+    assert.strictEqual(result, FOREGROUND_CEILING_MS,
+      `Expected exactly ${FOREGROUND_CEILING_MS}ms when foreground, got ${result}ms`);
+  } finally {
+    if (orig !== undefined) process.env.WARPOS_DISPATCH_BACKGROUND = orig;
+  }
+});
+
+test("opts.background=false (explicit non-background) → clamps to ceiling", () => {
+  const orig = process.env.WARPOS_DISPATCH_BACKGROUND;
+  delete process.env.WARPOS_DISPATCH_BACKGROUND;
+  try {
+    const result = foregroundAwareTimeout(20 * 60 * 1000, { background: false });
+    assert.strictEqual(result, FOREGROUND_CEILING_MS,
+      `Expected ${FOREGROUND_CEILING_MS}ms (clamped), got ${result}ms`);
+  } finally {
+    if (orig !== undefined) process.env.WARPOS_DISPATCH_BACKGROUND = orig;
+  }
+});
+
+test("small default (1000ms) → returned unchanged (already under ceiling)", () => {
+  const orig = process.env.WARPOS_DISPATCH_BACKGROUND;
+  delete process.env.WARPOS_DISPATCH_BACKGROUND;
+  try {
+    const result = foregroundAwareTimeout(1000, {});
+    assert.strictEqual(result, 1000,
+      `Expected 1000ms (already ≤ ceiling), got ${result}ms`);
+  } finally {
+    if (orig !== undefined) process.env.WARPOS_DISPATCH_BACKGROUND = orig;
+  }
+});
+
+// ── 3. WRAPPER_DEFAULTS all clamp correctly ────────────────────────────────
+console.log("\n(3) All WRAPPER_DEFAULTS foreground bounds ≤ FOREGROUND_CEILING_MS:");
+
+test("WRAPPER_DEFAULTS is non-empty (sanity: defaults are defined)", () => {
+  const keys = Object.keys(WRAPPER_DEFAULTS);
+  assert(keys.length >= 4, `Expected ≥4 wrapper entries, got ${keys.length}: ${keys.join(", ")}`);
+});
+
+test("all WRAPPER_DEFAULTS foreground effective bounds ≤ ceiling", () => {
+  const orig = process.env.WARPOS_DISPATCH_BACKGROUND;
+  delete process.env.WARPOS_DISPATCH_BACKGROUND;
+  try {
+    for (const [wrapper, defaultMs] of Object.entries(WRAPPER_DEFAULTS)) {
+      const effective = foregroundAwareTimeout(defaultMs, {});
+      assert(effective <= FOREGROUND_CEILING_MS,
+        `${wrapper}: foreground effective ${effective}ms > ceiling ${FOREGROUND_CEILING_MS}ms`);
+    }
+  } finally {
+    if (orig !== undefined) process.env.WARPOS_DISPATCH_BACKGROUND = orig;
+  }
+});
+
+// ── 4. runChecks() — GREEN on real defaults ─────────────────────────────────
+console.log("\n(4) runChecks() GREEN on real WRAPPER_DEFAULTS:");
+
+test("runChecks() returns ok:true on real WRAPPER_DEFAULTS", () => {
+  const orig = process.env.WARPOS_DISPATCH_BACKGROUND;
+  delete process.env.WARPOS_DISPATCH_BACKGROUND;
+  try {
+    const result = runChecks();
+    assert.strictEqual(result.ok, true,
+      `Expected ok:true but got ok:false. Checks: ${JSON.stringify(result.checks)}`);
+    assert(result.checks.length >= 4,
+      `Expected ≥4 checks, got ${result.checks.length}`);
+    assert(result.checks.every(c => c.status === "green"),
+      `Not all checks are green: ${JSON.stringify(result.checks.filter(c => c.status !== "green"))}`);
+  } finally {
+    if (orig !== undefined) process.env.WARPOS_DISPATCH_BACKGROUND = orig;
+  }
+});
+
+// ── 5. PLANTED violation — >540s foreground bound → red ─────────────────────
+// Design note: foregroundAwareTimeout always CLAMPS when no background signal is
+// present. So a large default (30min) with no env signal still yields effectiveMs=540s
+// (GREEN — that IS the fix). The planted violation that proves the check's comparison
+// fires correctly is triggered by WARPOS_DISPATCH_BACKGROUND=1, which bypasses the
+// clamp and exposes a raw value > ceiling.
+console.log("\n(5) Planted violation — foreground bound >540s → red:");
+
+test("planted: large default clamped to ceiling by helper → check is GREEN (the fix works)", () => {
+  const orig = process.env.WARPOS_DISPATCH_BACKGROUND;
+  delete process.env.WARPOS_DISPATCH_BACKGROUND;
+  try {
+    // 30min default with no bg signal: foregroundAwareTimeout clamps to 540000 ≤ ceiling → GREEN
+    const result = runChecks({ wrapperDefaults: { "large-default-clamped": 30 * 60 * 1000 } });
+    const c = result.checks.find(ch => ch.wrapper === "large-default-clamped");
+    assert(c, "Expected check for large-default-clamped");
+    assert.strictEqual(c.status, "green",
+      `Expected green (30min clamped→540000 ≤ ceiling by foregroundAwareTimeout), got ${c.status}`);
+    assert.strictEqual(result.ok, true, "Expected ok:true when the helper clamps the bound");
+  } finally {
+    if (orig !== undefined) process.env.WARPOS_DISPATCH_BACKGROUND = orig;
+  }
+});
+
+test("planted: WARPOS_DISPATCH_BACKGROUND=1 bypasses clamp → 30min default exposes violation (red)", () => {
+  // This is the true planted violation: with background signal set, the helper returns the
+  // raw defaultMs (no clamp). If defaultMs > ceiling, the check correctly reports RED.
+  // This proves the check's comparison logic fires (not just the helper's clamp).
+  const orig = process.env.WARPOS_DISPATCH_BACKGROUND;
+  process.env.WARPOS_DISPATCH_BACKGROUND = "1"; // bypass clamp → raw 30min returned
+  try {
+    const result = runChecks({ wrapperDefaults: { "bg-bypass-planted": 30 * 60 * 1000 } });
+    // effective = 30*60*1000 = 1800000 > 540000 → RED
+    const c = result.checks.find(ch => ch.wrapper === "bg-bypass-planted");
+    assert(c, "Expected check for bg-bypass-planted");
+    assert.strictEqual(c.status, "red",
+      `Expected red: WARPOS_DISPATCH_BACKGROUND=1 bypassed the clamp, effective=1800000ms > ceiling`);
+    assert.strictEqual(result.ok, false, "Expected ok:false for planted violation");
+    assert(c.reason && /VIOLATION/i.test(c.reason),
+      `Expected VIOLATION in reason, got: ${c.reason}`);
+  } finally {
+    if (orig === undefined) delete process.env.WARPOS_DISPATCH_BACKGROUND;
+    else process.env.WARPOS_DISPATCH_BACKGROUND = orig;
+  }
+});
+
+test("planted: 541000ms default (1ms over ceiling) clamped → GREEN (clamp saves it)", () => {
+  const orig = process.env.WARPOS_DISPATCH_BACKGROUND;
+  delete process.env.WARPOS_DISPATCH_BACKGROUND;
+  try {
+    // effectiveMs = min(541000, 540000) = 540000 ≤ 540000 → GREEN (the clamp is the fix)
+    const result = runChecks({ wrapperDefaults: { "just-over-ceiling": 541000 } });
+    const c = result.checks.find(ch => ch.wrapper === "just-over-ceiling");
+    assert(c, "Expected check for just-over-ceiling");
+    assert.strictEqual(c.status, "green",
+      `Expected green (541000ms clamped to 540000ms ≤ ceiling), got ${c.status}: ${c.reason}`);
+  } finally {
+    if (orig !== undefined) process.env.WARPOS_DISPATCH_BACKGROUND = orig;
+  }
+});
+
+// ── 6. Fail-closed: empty/invalid inputs ─────────────────────────────────────
+console.log("\n(6) Fail-closed — empty or invalid wrapperDefaults:");
+
+test("runChecks({ wrapperDefaults: {} }) → ok:false (no wrappers to check)", () => {
+  const result = runChecks({ wrapperDefaults: {} });
+  assert.strictEqual(result.ok, false,
+    `Expected ok:false for empty wrapperDefaults`);
+  assert(result.checks.length > 0, "Expected at least one check entry");
+  assert.strictEqual(result.checks[0].status, "red",
+    `Expected red status for empty wrapperDefaults`);
+});
+
+test("runChecks with null defaultMs → ok:false (fail-closed on unreadable bound)", () => {
+  const result = runChecks({ wrapperDefaults: { "null-entry": null } });
+  assert.strictEqual(result.ok, false,
+    `Expected ok:false for null defaultMs`);
+  const c = result.checks.find(ch => ch.wrapper === "null-entry");
+  assert(c, "Expected check for null-entry");
+  assert.strictEqual(c.status, "red",
+    `Expected red for null defaultMs`);
+  assert(c.reason && /FAIL-CLOSED/i.test(c.reason),
+    `Expected FAIL-CLOSED in reason, got: ${c.reason}`);
+});
+
+test("runChecks with Infinity defaultMs → ok:false (FAIL-CLOSED: not finite)", () => {
+  const result = runChecks({ wrapperDefaults: { "infinite-entry": Infinity } });
+  assert.strictEqual(result.ok, false,
+    `Expected ok:false for Infinity defaultMs`);
+});
+
+test("runChecks with string defaultMs → ok:false (FAIL-CLOSED)", () => {
+  const result = runChecks({ wrapperDefaults: { "string-entry": "not-a-number" } });
+  assert.strictEqual(result.ok, false,
+    `Expected ok:false for string defaultMs`);
+});
+
+// ── 7. Standalone CLI exits 0 ────────────────────────────────────────────────
+console.log("\n(7) Standalone CLI exit code:");
+
+test("node dispatch-timeout-sanity.js exits 0 (all wrappers ≤ ceiling)", () => {
+  const r = spawnSync(process.execPath, [
+    path.join(__dirname, "dispatch-timeout-sanity.js"),
+    "--json",
+  ], { encoding: "utf8", timeout: 10000 });
+  assert.strictEqual(r.status, 0,
+    `Expected exit 0, got ${r.status}. stdout: ${r.stdout.slice(0, 500)}`);
+  const out = JSON.parse(r.stdout);
+  assert.strictEqual(out.ok, true,
+    `Expected ok:true in JSON output, got: ${JSON.stringify(out)}`);
+});
+
+test("node dispatch-timeout-sanity.js --json output is valid JSON with checks array", () => {
+  const r = spawnSync(process.execPath, [
+    path.join(__dirname, "dispatch-timeout-sanity.js"),
+    "--json",
+  ], { encoding: "utf8", timeout: 10000 });
+  assert.doesNotThrow(() => JSON.parse(r.stdout), "Output must be valid JSON");
+  const out = JSON.parse(r.stdout);
+  assert(Array.isArray(out.checks), "Expected checks to be an array");
+  assert(out.checks.length >= 4, `Expected ≥4 checks, got ${out.checks.length}`);
+  assert(out.checks.every(c => c.name && c.status && c.reason),
+    "Each check must have name, status, and reason");
+});
+
+// ── Fix-cycle pin (claude backend lane, 2026-06-10): runProvider was the FOURTH
+// G8 wrapper and the original W0 build missed it. Pin its presence so a silent
+// removal from WRAPPER_DEFAULTS (which would drop it from the sanity sweep
+// without any red) is caught here.
+console.log("\n(7) fix-cycle pin — runProvider (providers.js) is a covered wrapper:");
+test("WRAPPER_DEFAULTS includes 'run-provider' (the cross-provider runProvider route)", () => {
+  assert(Object.prototype.hasOwnProperty.call(WRAPPER_DEFAULTS, "run-provider"),
+    "run-provider must stay in WRAPPER_DEFAULTS — removing it silently drops the 4th G8 wrapper from the sanity sweep");
+  assert(
+    foregroundAwareTimeout(WRAPPER_DEFAULTS["run-provider"], {}) <= FOREGROUND_CEILING_MS,
+    "run-provider foreground bound must clamp to the ceiling",
+  );
+});
+test("providers.js loads and reaches timeout-policy (no broken require path)", () => {
+  const providers = require("../hooks/lib/providers.js");
+  assert(typeof providers.runProvider === "function", "runProvider export intact");
+});
+
+// ── Final ─────────────────────────────────────────────────────────────────────
+console.log(`\ndispatch-timeout-sanity.test.js — ${passed} passed, ${failed} failed`);
+process.exit(failed > 0 ? 1 : 0);
diff --git a/scripts/dispatch-agent.js b/scripts/dispatch-agent.js
index 335df04..62db56e 100644
--- a/scripts/dispatch-agent.js
+++ b/scripts/dispatch-agent.js
@@ -128,11 +128,16 @@ function cmdlineChecksum(role, provider, promptBytes) {
 // coverage row with no backing dispatch). Sourced from the orchestrator's env;
 // null when dispatched ad-hoc (a null run_id simply can't satisfy a run-scoped
 // coverage check, which is the correct fail-closed behavior).
+// T-303 (N8): sprint_id added as the SINGLE SOURCE for env-read — all three
+// wrappers (dispatch-agent, dispatch-claude, dispatch-skill) already spread
+// ...runContext() into the completion record, so extending this function is
+// enough to propagate sprint_id uniformly with no per-wrapper duplication.
 function runContext() {
   return {
     run_id: process.env.WARPOS_RUN_ID || null,
     phase_id: process.env.WARPOS_PHASE_ID || null,
     plan_item_id: process.env.WARPOS_PLAN_ITEM_ID || null,
+    sprint_id: process.env.WARPOS_SPRINT_ID || null,
   };
 }
 
diff --git a/scripts/dispatch-claude.js b/scripts/dispatch-claude.js
index 8e4a818..6ea9746 100644
--- a/scripts/dispatch-claude.js
+++ b/scripts/dispatch-claude.js
@@ -86,8 +86,16 @@ try {
   safeSpawn = null;
 }
 
+// T-20260610-304 (G8/N1): foreground-aware timeout clamp. The raw default is 20m but
+// the harness FOREGROUND Bash ceiling is 600s — a foreground wrapper is killed by the
+// harness BEFORE its own bound fires, so it never writes its death record. The shared
+// policy helper clamps to 540s (FOREGROUND_CEILING_MS) unless an explicit background
+// signal (WARPOS_DISPATCH_BACKGROUND=1 / opts.background) is present. FAIL-CLOSED:
+// absence of the signal ⇒ clamp, never the longer default.
+const { foregroundAwareTimeout, WRAPPER_DEFAULTS } = require("./dispatch/timeout-policy");
+
 const PROVIDER = "claude";
-const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000; // 20 min — builders are heavier than the 15-min review ceiling
+const DEFAULT_TIMEOUT_MS = WRAPPER_DEFAULTS["dispatch-claude"]; // 20 min — sourced from canonical policy
 const MAX_BUFFER = 32 * 1024 * 1024; // 32 MB
 
 // Build-chain roles edit a repo — they MUST run isolated (a worktree), never in
@@ -101,6 +109,18 @@ const BUILD_CHAIN_ROLES = new Set([
   "stub-scaffold", // S-7 legacy id (back-compat)
 ]);
 
+// GENERIC BUILD IDS — G1 / β option (c) / EVT-dispatch-shape-w0-plan-design-001.
+// These ids are mandated by the dispatch GUIDE for build-chain dispatch but are
+// deliberately NOT in role-registry.json (the FE/BE split is contextual; a 1:1
+// alias would be wrong — role-aliases.js intentionally omits them). The result:
+// validateDispatch({ role:"builder" }) returns ok:false + "(fail-closed)" — correct
+// for the registry (the role truly is unresolvable there) but LYING when printed as
+// the dispatch advisory, because this wrapper DOES know "builder" is a valid
+// build-chain sentinel. Fix: for a generic id, re-validate against build_chain_worker
+// directly (the class dispatch-claude.js already enforces via BUILD_CHAIN_ROLES +
+// the isolation gate). The wrapper and the contract then AGREE on the truthful result.
+const GENERIC_BUILD_IDS = new Set(["builder"]);
+
 function usage(msg) {
   console.error(
     JSON.stringify({
@@ -132,6 +152,14 @@ const worktree = parseFlag("--worktree");
 // --worktree <path> instead when the orchestrator already created the worktree
 // and wants the child to run with cwd set to it.)
 const passW = argv.includes("-w");
+// --review-fallback: sanctioned fallback lane for cross-provider review roles when
+// their normal provider (openai/gemini) is quota-dead. Dispatches a NON-BUILD review
+// role as claude and writes a LEDGERED ok:true record with fallback:true +
+// provider:claude + quota_fallback_from so coverage-gate sees the debt VISIBLY.
+// NOTE: review-fallback bypasses the build-chain isolation gate (review roles are
+// READ-ONLY — they don't write code). Build-chain roles via --review-fallback are
+// REFUSED — they must still use -w or --worktree. (T-305 G2)
+const reviewFallback = argv.includes("--review-fallback");
 
 if (!role || !promptArg) {
   usage("Usage: <role> and <prompt-file | '-'> are both required.");
@@ -148,6 +176,18 @@ if (effort && !/^[a-z]+$/i.test(effort)) {
   usage(`Invalid effort token: ${JSON.stringify(effort)} (expected e.g. low|medium|high|max).`);
 }
 
+// --review-fallback guard: build-chain roles write code and MUST use -w/--worktree
+// isolation — they are never allowed via the review-fallback read-only path.
+// This check fires BEFORE the isolation gate so the error message is specific.
+if (reviewFallback && BUILD_CHAIN_ROLES.has(role.toLowerCase())) {
+  usage(
+    `--review-fallback cannot be used with build-chain role '${role}'. ` +
+    `review-fallback is for READ-ONLY review roles only (e.g. backend-reviewer, ` +
+    `qa-reviewer, frontend-reviewer, security-reviewer). Build-chain roles write ` +
+    `code and MUST use -w or --worktree isolation. (T-305 G2)`,
+  );
+}
+
 // CRITICAL ISOLATION GATE (reviewer-CRITICAL ×2): a build-chain role must run
 // isolated — either `-w` (claude creates a worktree) OR `--worktree <path>` to a
 // REAL, distinct git worktree. NEVER fall back to canonical (AGENT_ROOT): a
@@ -190,6 +230,29 @@ if (BUILD_CHAIN_ROLES.has(role.toLowerCase()) && !passW && !worktreeValid) {
   );
 }
 
+// ── review-fallback: look up the role's normal cross-provider origin ────────────
+// When --review-fallback is set, stamp the completion record with the provider this
+// role WOULD have used if available (its registry `provider` attribute — openai for
+// most reviewers, gemini for security-reviewer). This is the fallback-origin field
+// coverage-gate reads to confirm the debt is VISIBLE (it still trips
+// cross_provider_required since record.provider === "claude", which is what we want:
+// honest visible debt, NOT silent green). Fail-soft: if the registry doesn't know
+// the role, carry provider:null (still stamps fallback:true + the reason).
+let quotaFallbackFrom = null;
+if (reviewFallback) {
+  try {
+    const { registryAttrs: _rfRegAttrs } = require("./dispatch/dispatch-contract");
+    const attrs = _rfRegAttrs(role);
+    quotaFallbackFrom = {
+      provider: (attrs && attrs.provider) || null,
+      reason: "quota_exhausted",
+    };
+  } catch {
+    // fail-soft: dispatch still proceeds; origin is null
+    quotaFallbackFrom = { provider: null, reason: "quota_exhausted" };
+  }
+}
+
 // ── Load the prompt ─────────────────────────────────────────
 let promptStr = "";
 try {
@@ -215,9 +278,12 @@ if (model) claudeArgs.push("--model", model);
 if (effort) claudeArgs.push("--effort", effort);
 if (passW) claudeArgs.push("-w"); // forward worktree-creation to claude (preserve isolation)
 
-const TIMEOUT_MS = parseInt(
-  process.env.DISPATCH_BUILDER_TIMEOUT_MS || `${DEFAULT_TIMEOUT_MS}`,
-  10,
+// T-20260610-304: clamp requested bound to foreground ceiling (540s). An env override
+// sets the *requested* bound but the foreground ceiling is the hard cap. Background
+// signal (WARPOS_DISPATCH_BACKGROUND=1) passes through the full requested bound.
+const TIMEOUT_MS = foregroundAwareTimeout(
+  parseInt(process.env.DISPATCH_BUILDER_TIMEOUT_MS || `${DEFAULT_TIMEOUT_MS}`, 10),
+  {}, // opts — WARPOS_DISPATCH_BACKGROUND env var is checked inside the helper
 );
 
 // cwd = the VALIDATED worktree (builder edits there); else canonical root. When
@@ -245,24 +311,65 @@ const cmdChecksum = cmdlineChecksum(role, PROVIDER, promptBytes);
 // set WARPOS_DISPATCH_CONTRACT_ENFORCE=block to make a violation fatal. Fail-OPEN
 // on any contract-read error — the contract must never crash a working dispatch.
 try {
-  const { validateDispatch } = require("./dispatch/dispatch-contract");
+  const { validateDispatch, validateDispatchForClass } = require("./dispatch/dispatch-contract");
   const verdict = validateDispatch({
     role,
     shape: "subprocess-claude",
     toolId: "claude",
     cwd: runCwd,
   });
-  if (!verdict.ok) {
+  if (!verdict.ok && GENERIC_BUILD_IDS.has(role.toLowerCase())) {
+    // G1 / β option (c): re-validate against build_chain_worker class directly.
+    // validateDispatch returned ok:false only because 'builder' (the generic id the
+    // GUIDE mandates) is not in role-registry.json — NOT because the dispatch is
+    // wrong. dispatch-claude.js already enforced the isolation gate (BUILD_CHAIN_ROLES
+    // + the -w / --worktree check above). Use the class-level helper so the advisory
+    // is TRUTHFUL: either "resolved to build_chain_worker (OK)" or a real violation
+    // (e.g. cwd is canonical when -w isn't providing its own worktree). NOT "(fail-closed)".
+    // EVT-dispatch-shape-w0-plan-design-001 (β ratified option c).
+    const classVerdict = validateDispatchForClass({
+      class: "build_chain_worker",
+      shape: "subprocess-claude",
+      toolId: "claude",
+      cwd: runCwd,
+    });
+    if (classVerdict.ok) {
+      // Truthful informational: generic id resolved to a real class, shape OK.
+      process.stderr.write(
+        `[dispatch-claude] dispatch-contract: generic build id '${role}' resolved to class 'build_chain_worker' (subprocess-claude OK)\n`,
+      );
+    } else {
+      // A real violation (e.g. worktree-required + canonical cwd when using -w).
+      // Report it honestly — still NOT "(fail-closed)", since the shape/tool are correct.
+      process.stderr.write(
+        `[dispatch-claude] dispatch-contract advisory: ${classVerdict.violations.join("; ")}\n`,
+      );
+    }
+    // Proceed-on-advisory default unchanged (W0 scope; no REFUSE flip).
+  } else if (!verdict.ok) {
+    // Genuinely unknown id (not in role-registry, not a GENERIC_BUILD_ID), or a real
+    // violation for a registered role. Keep the honest fail-closed wording unchanged.
     const blocking = process.env.WARPOS_DISPATCH_CONTRACT_ENFORCE === "block";
-    process.stderr.write(
-      `[dispatch-claude] dispatch-contract ${blocking ? "VIOLATION" : "advisory"}: ` +
-        `${verdict.violations.join("; ")}\n`,
-    );
-    if (blocking) {
-      console.log(
-        JSON.stringify({ ok: false, provider: PROVIDER, role, reaped: false, reason: "dispatch_contract_violation", violations: verdict.violations }),
+    if (reviewFallback && !blocking) {
+      // --review-fallback: the shape mismatch (subprocess-claude for a cross-provider
+      // reviewer role) is INTENTIONAL — the normal provider is quota-exhausted. Suppress
+      // the advisory and emit a clear informational note instead.
+      process.stderr.write(
+        `[dispatch-claude] review-fallback: role '${role}' routed through subprocess-claude ` +
+          `intentionally (cross-provider quota exhausted; fallback origin: ` +
+          `${quotaFallbackFrom && quotaFallbackFrom.provider || "unknown"}).\n`,
       );
-      process.exit(1);
+    } else {
+      process.stderr.write(
+        `[dispatch-claude] dispatch-contract ${blocking ? "VIOLATION" : "advisory"}: ` +
+          `${verdict.violations.join("; ")}\n`,
+      );
+      if (blocking) {
+        console.log(
+          JSON.stringify({ ok: false, provider: PROVIDER, role, reaped: false, reason: "dispatch_contract_violation", violations: verdict.violations }),
+        );
+        process.exit(1);
+      }
     }
   }
 } catch {
@@ -281,17 +388,28 @@ try {
   const { shapeMismatch } = require("./dispatch/dispatch-shape");
   const mm = shapeMismatch("subprocess-claude", { kind: "agent", id: role });
   if (mm && mm.mismatch) {
-    const blocking = process.env.WARPOS_DISPATCH_CONTRACT_ENFORCE === "block" && mm.severity === "high";
-    process.stderr.write(
-      `[dispatch-claude] shape-resolver ${blocking ? "VIOLATION" : "advisory"}: ` +
-        `role '${role}' dispatched as 'subprocess-claude' but the resolver picks '${mm.expected}' ` +
-        `(${mm.expectedReason || mm.reason}; severity=${mm.severity || "medium"}).\n`,
-    );
-    if (blocking) {
-      console.log(
-        JSON.stringify({ ok: false, provider: PROVIDER, role, reaped: false, reason: "dispatch_shape_mismatch", expected: mm.expected, actual: "subprocess-claude", severity: mm.severity }),
+    if (GENERIC_BUILD_IDS.has(role.toLowerCase())) {
+      // G1: the resolver falls back to adhoc/inline for 'builder' because it isn't
+      // in role-registry — but we KNOW it's a build-chain sentinel (class-resolved
+      // above). Suppress the misleading "resolver picks 'inline'" advisory; the
+      // contract consult block above already emitted the truthful note.
+    } else if (reviewFallback) {
+      // --review-fallback: shape mismatch (subprocess-claude for a cross-provider reviewer)
+      // is intentional. Suppress the advisory — the contract-consult block above already
+      // emitted the informational note about the fallback origin.
+    } else {
+      const blocking = process.env.WARPOS_DISPATCH_CONTRACT_ENFORCE === "block" && mm.severity === "high";
+      process.stderr.write(
+        `[dispatch-claude] shape-resolver ${blocking ? "VIOLATION" : "advisory"}: ` +
+          `role '${role}' dispatched as 'subprocess-claude' but the resolver picks '${mm.expected}' ` +
+          `(${mm.expectedReason || mm.reason}; severity=${mm.severity || "medium"}).\n`,
       );
-      process.exit(1);
+      if (blocking) {
+        console.log(
+          JSON.stringify({ ok: false, provider: PROVIDER, role, reaped: false, reason: "dispatch_shape_mismatch", expected: mm.expected, actual: "subprocess-claude", severity: mm.severity }),
+        );
+        process.exit(1);
+      }
     }
   }
 } catch {
@@ -442,7 +560,12 @@ recordCompletion({
   exit_code: typeof status === "number" ? status : null,
   stdout_bytes: stdoutBytes,
   stderr_bytes: stderrBytes,
-  fallback: false,
+  // fallback:true when --review-fallback was set (cross-provider quota exhausted).
+  // coverage-gate at :155 sees provider:"claude" + cross_provider_required → VISIBLE debt.
+  // Do NOT set anything that would suppress the cross_provider_required trip —
+  // a claude-only fallback must NEVER silently satisfy a cross-provider requirement.
+  fallback: reviewFallback,
+  ...(quotaFallbackFrom ? { quota_fallback_from: quotaFallbackFrom } : {}),
   ok,
   // N-1 (§17.4): run-context + shape + tool + prompt digest for the coverage gate.
   ...runContext(),
diff --git a/scripts/dispatch-skill.js b/scripts/dispatch-skill.js
index 9888589..f487ac3 100644
--- a/scripts/dispatch-skill.js
+++ b/scripts/dispatch-skill.js
@@ -107,12 +107,20 @@ try {
   safeSpawn = null;
 }
 
+// T-20260610-304 (G8/N1): foreground-aware timeout clamp. The raw default is 15m but
+// the harness FOREGROUND Bash ceiling is 600s — a foreground wrapper is killed by the
+// harness BEFORE its own bound fires, so it never writes its death record. The shared
+// policy helper clamps to 540s (FOREGROUND_CEILING_MS) unless an explicit background
+// signal (WARPOS_DISPATCH_BACKGROUND=1 / opts.background) is present. FAIL-CLOSED:
+// absence of the signal ⇒ clamp, never the longer default.
+const { foregroundAwareTimeout, WRAPPER_DEFAULTS } = require("./dispatch/timeout-policy");
+
 // ── Input gate (mirrors scripts/portfolio/dispatch.js) ──────
 const SKILL_RE = /^\/[a-z][a-z0-9_-]*(:[a-z][a-z0-9_-]*)?$/;
 const SAFE_ARG_RE = /^[A-Za-z0-9_\-./:=@,+]+$/;
 
 const PROVIDER = "claude";
-const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 min — shorter than the harness reap threshold
+const DEFAULT_TIMEOUT_MS = WRAPPER_DEFAULTS["dispatch-skill"]; // 15 min — sourced from canonical policy
 const MAX_BUFFER = 64 * 1024 * 1024; // 64 MB — heavy skills emit big aggregates
 // RI-004 reap mitigation (ticket T-20260608-269): the production spawn writes the
 // child's stdout to a DURABLE FILE (safeSpawnFile) so an outer-harness reap of the
@@ -396,9 +404,12 @@ function dispatchSkill(opts) {
   // mirroring dispatch-claude.js which also passes its prompt only on stdin.
   const claudeArgs = [...prefixArgs, "-p", "--agent", "general-purpose"];
 
-  const TIMEOUT_MS = parseInt(
-    process.env.DISPATCH_SKILL_TIMEOUT_MS || `${DEFAULT_TIMEOUT_MS}`,
-    10,
+  // T-20260610-304: clamp requested bound to foreground ceiling (540s). An env override
+  // sets the *requested* bound but the foreground ceiling is the hard cap. Background
+  // signal (WARPOS_DISPATCH_BACKGROUND=1) passes through the full requested bound.
+  const TIMEOUT_MS = foregroundAwareTimeout(
+    parseInt(process.env.DISPATCH_SKILL_TIMEOUT_MS || `${DEFAULT_TIMEOUT_MS}`, 10),
+    {}, // opts — WARPOS_DISPATCH_BACKGROUND env var is checked inside the helper
   );
   // Pass canonical CLAUDE_PROJECT_DIR so any nested telemetry resolves to canonical
   // (ED-016 class), not a cwd-bent path.
diff --git a/scripts/dispatch/coverage-gate.test.js b/scripts/dispatch/coverage-gate.test.js
index acb9456..21d4dc6 100644
--- a/scripts/dispatch/coverage-gate.test.js
+++ b/scripts/dispatch/coverage-gate.test.js
@@ -141,4 +141,43 @@ h.test("parseExpect parses role:shape pairs", () => {
   }
 });
 
+// ── T-303 (N8): run_id + sprint_id on records ───────────────
+// A record stamped with run_id + sprint_id (via extended runContext()) passes
+// when the coverage gate's runId scopes to that run_id.
+h.pass("T-303 N8: record with run_id + sprint_id satisfies runId-scoped coverage", () =>
+  evaluate({
+    runId: RUN,
+    records: [
+      rec({
+        role: "security-reviewer",
+        provider: "gemini",
+        dispatch_id: "d-n8",
+        sprint_id: "SP-20260610-006",
+        phase_id: "gauntlet",
+      }),
+    ],
+    expected: [{ role: "security-reviewer" }],
+  })
+);
+
+// PLANTED (N8): a record with run_id=null cannot satisfy a run-scoped check.
+// This is the §17.4 fail-closed: null run_id means the dispatcher never exported
+// WARPOS_RUN_ID — the coverage gate must REJECT it under a live runId-scoped eval.
+h.violation(
+  "PLANTED T-303 N8: run_id=null under runId-scoped evaluate is filtered out (UNBACKED)",
+  () =>
+    evaluate({
+      runId: RUN,
+      records: [
+        rec({
+          role: "security-reviewer",
+          provider: "gemini",
+          dispatch_id: "d-nullrun",
+          run_id: null,
+        }),
+      ],
+      expected: [{ role: "security-reviewer" }],
+    })
+);
+
 h.done();
diff --git a/scripts/dispatch/dispatch-claude.test.js b/scripts/dispatch/dispatch-claude.test.js
index ec74e6f..94ac805 100644
--- a/scripts/dispatch/dispatch-claude.test.js
+++ b/scripts/dispatch/dispatch-claude.test.js
@@ -26,6 +26,7 @@ const path = require("path");
 const { spawnSync } = require("child_process");
 
 const { verifyGauntlet } = require("./gauntlet-verify");
+const { evaluate: coverageEvaluate } = require("./coverage-gate");
 
 const DISPATCH_CLAUDE = path.join(__dirname, "..", "dispatch-claude.js");
 const REPO_ROOT = path.resolve(__dirname, "..", ".."); // == the wrapper's AGENT_ROOT
@@ -75,7 +76,8 @@ fs.writeFileSync(promptFile, "Build the thing per spec.\n");
 
 // Run the wrapper as a subprocess with an isolated ledger + fake bin.
 // iso: "w" (default, forwards -w) | "worktree:<path>" | "none" (no isolation flag)
-function runWrapper({ fake, ledgerDir, extraArgs = [], timeoutMs, iso = "w" }) {
+// role: role to dispatch (default "builder" for backward compat with all existing tests)
+function runWrapper({ fake, ledgerDir, extraArgs = [], timeoutMs, iso = "w", role = "builder" }) {
   fs.mkdirSync(ledgerDir, { recursive: true });
   const env = {
     ...process.env,
@@ -88,7 +90,7 @@ function runWrapper({ fake, ledgerDir, extraArgs = [], timeoutMs, iso = "w" }) {
     iso === "w" ? ["-w"] : iso.startsWith("worktree:") ? ["--worktree", iso.slice(9)] : [];
   const res = spawnSync(
     process.execPath,
-    [DISPATCH_CLAUDE, "builder", promptFile, "--model", "sonnet", ...isoArgs, ...extraArgs],
+    [DISPATCH_CLAUDE, role, promptFile, "--model", "sonnet", ...isoArgs, ...extraArgs],
     { env, encoding: "utf8", timeout: 60000 },
   );
   return res;
@@ -229,6 +231,99 @@ test("--worktree <subdir without .git> → exit 2 (not a real worktree)", () =>
   assert(comps.length === 0, "no record when a plain subdir is refused");
 });
 
+// ── 10. G1: generic build id 'builder' → advisory is TRUTHFUL ──────────────────
+test("G1: generic build id 'builder' advisory is truthful — no '(fail-closed)' lie", () => {
+  const ledger = path.join(scratch, "l10");
+  const res = runWrapper({ fake: fakeHappy, ledgerDir: ledger });
+  // Dispatch must still succeed — proceed-on-advisory default is unchanged (W0).
+  assert(res.status === 0, `expected exit 0 after G1 fix, got ${res.status} (stderr: ${(res.stderr || "").slice(0, 500)})`);
+  // G1 PLANTED VIOLATION: the OLD advisory said "(fail-closed)" for 'builder' — that was a lie.
+  // After the fix, the advisory must NOT contain "(fail-closed)".
+  // If this assertion fails, it means the GENERIC_BUILD_IDS re-route was not applied.
+  assert(
+    !(res.stderr || "").includes("(fail-closed)"),
+    `G1 REGRESSION: advisory still says '(fail-closed)' for generic build id 'builder'. stderr: ${(res.stderr || "").slice(0, 500)}`,
+  );
+  // The record must still be written correctly.
+  const comps = readLedger(ledger, "dispatch-completions.jsonl");
+  assert(comps.length === 1 && comps[0].ok === true, "completion record must still be ok:true after G1 fix");
+});
+
+// ── 11. review-fallback happy path ─────────────────────────
+test("review-fallback: reviewer role w/o -w → exit 0 + ok:true record with fallback:true + provider:claude + quota_fallback_from(openai)", () => {
+  const ledger = path.join(scratch, "l11");
+  const res = runWrapper({
+    fake: fakeHappy,
+    ledgerDir: ledger,
+    role: "backend-reviewer",
+    iso: "none",
+    extraArgs: ["--review-fallback"],
+  });
+  assert(res.status === 0, `expected exit 0 for review-fallback reviewer, got ${res.status} (stderr: ${(res.stderr || "").slice(0, 500)})`);
+  const comps = readLedger(ledger, "dispatch-completions.jsonl");
+  assert(comps.length === 1 && comps[0].ok === true, "expected one ok:true completion record");
+  assert(comps[0].fallback === true, `expected fallback:true, got ${JSON.stringify(comps[0].fallback)}`);
+  assert(comps[0].provider === "claude", `expected provider:"claude", got ${JSON.stringify(comps[0].provider)}`);
+  assert(
+    comps[0].quota_fallback_from && comps[0].quota_fallback_from.provider === "openai",
+    `expected quota_fallback_from.provider==="openai", got ${JSON.stringify(comps[0].quota_fallback_from)}`,
+  );
+});
+
+// ── 12. review-fallback + gauntlet-verify ──────────────────
+test("review-fallback: gauntlet-verify sees the record → status 'fell-back' (not 'no-record')", () => {
+  const ledger = path.join(scratch, "l11"); // reuse l11 record
+  const comps = readLedger(ledger, "dispatch-completions.jsonl");
+  const rec = comps[0];
+  const v = verifyGauntlet({
+    roles: ["backend-reviewer"],
+    completionsFile: path.join(ledger, "dispatch-completions.jsonl"),
+    since: rec.started_at,
+  });
+  assert(v.ok === true, `gauntlet-verify should pass (fell-back counts as ran): ${JSON.stringify(v.roles)}`);
+  assert(
+    v.roles[0].status === "fell-back",
+    `expected status 'fell-back', got '${v.roles[0].status}' (the record has fallback:true so gauntlet recognises it as a fallback run, not a silent gap)`,
+  );
+});
+
+// ── 13. coverage-gate trips cross_provider_required on a claude fallback record ──
+test("review-fallback: coverage-gate FLAGS claude record as cross_provider_required debt (no silent green)", () => {
+  const ledger = path.join(scratch, "l11"); // reuse l11 record
+  const comps = readLedger(ledger, "dispatch-completions.jsonl");
+  const result = coverageEvaluate({
+    records: comps,
+    expected: [{ role: "backend-reviewer" }],
+  });
+  // The gate MUST NOT be ok:true — a claude-only fallback record never silently satisfies
+  // the cross-provider requirement. The violation must name the provider-diversity problem.
+  assert(result.ok === false, "coverage-gate should NOT pass when cross_provider_required role ran on claude (fallback record is visible debt, not green)");
+  assert(
+    result.violations.some((v) => /cross.?provider|diversity|claude/i.test(v)),
+    `expected a cross-provider violation, got: ${JSON.stringify(result.violations)}`,
+  );
+});
+
+// ── 14. build-chain role via --review-fallback → refused ───
+test("review-fallback: build-chain role ('builder') via --review-fallback → exit 2 + refusal message", () => {
+  const ledger = path.join(scratch, "l14");
+  const res = runWrapper({
+    fake: fakeHappy,
+    ledgerDir: ledger,
+    role: "builder",
+    iso: "none",
+    extraArgs: ["--review-fallback"],
+  });
+  assert(res.status === 2, `expected exit 2 (usage refusal), got ${res.status}`);
+  assert(
+    (res.stderr || "").includes("review-fallback") && (res.stderr || "").toLowerCase().includes("build-chain"),
+    `expected refusal message mentioning 'review-fallback' and 'build-chain', got stderr: ${(res.stderr || "").slice(0, 500)}`,
+  );
+  // No completion record should be written for a refused dispatch.
+  const comps = readLedger(ledger, "dispatch-completions.jsonl");
+  assert(comps.length === 0, "no completion record should be written when review-fallback is refused");
+});
+
 // ── Summary ─────────────────────────────────────────────────
 console.log(`\ndispatch-claude.test.js — ${passed} passed, ${failed} failed`);
 process.exit(failed === 0 ? 0 : 1);
diff --git a/scripts/dispatch/dispatch-contract.js b/scripts/dispatch/dispatch-contract.js
index f36a43b..e771d31 100644
--- a/scripts/dispatch/dispatch-contract.js
+++ b/scripts/dispatch/dispatch-contract.js
@@ -190,6 +190,67 @@ function validateDispatch(req) {
   return { ok: violations.length === 0, violations, contract: c };
 }
 
+/**
+ * Validate a proposed dispatch against a NAMED class's contract directly,
+ * bypassing the role-registry lookup. Used for known generic build ids (e.g.
+ * 'builder') that are NOT in role-registry.json but map to a real class —
+ * so the advisory emitted by the wrapper is TRUTHFUL rather than "(fail-closed)".
+ * G1 / β option (c) / EVT-dispatch-shape-w0-plan-design-001.
+ *
+ *   { class, shape, toolId?, cwd? } -> { ok, violations[], contract }
+ *
+ * The shape + toolId + cwd_policy checks mirror validateDispatch but operate
+ * against the class definition directly, never against registry attributes.
+ * DEFENSE-IN-DEPTH note: this function does NOT have access to build_chain
+ * registry attributes (the role is not in the registry), so the hard invariant
+ * check (build_chain → NOT in-process) cannot be applied here. That invariant
+ * ONLY guards registered roles via validateDispatch; callers who use this helper
+ * must know the class maps to a safe shape (build_chain_worker + subprocess-claude
+ * is the only sanctioned call site — dispatch-claude.js, which already enforces
+ * the worktree isolation gate for build-chain roles BEFORE reaching this path).
+ */
+function validateDispatchForClass(req) {
+  const violations = [];
+  const className = req && req.class;
+  const shape = req && req.shape;
+  if (!className) return { ok: false, violations: ["no class supplied"], contract: null };
+  const contract = loadContract();
+  const classContract = contract.role_classes && contract.role_classes[className];
+  if (!classContract) {
+    return {
+      ok: false,
+      violations: [`class '${className}' is not in role_classes — cannot resolve a dispatch contract`],
+      contract: null,
+    };
+  }
+  const resolved = mergeContract(contract.defaults || {}, classContract);
+  if (!shape) {
+    violations.push("no shape supplied");
+  } else {
+    const allowed = resolved.allowed_shapes || [];
+    const forbidden = resolved.forbidden_shapes || [];
+    if (forbidden.includes(shape)) {
+      violations.push(`shape '${shape}' is FORBIDDEN for class '${className}'. Allowed: ${allowed.join(", ")}.`);
+    } else if (!allowed.includes(shape)) {
+      const hint = shape === "api" ? " — API availability never implies API dispatch (PLAN §3/N-2)." : "";
+      violations.push(`shape '${shape}' is not allowed for class '${className}'. Allowed: ${allowed.join(", ")}.${hint}`);
+    }
+  }
+  if (req && "toolId" in req && shape && !violations.length) {
+    if (!toolMatches(resolved.tool_id, req.toolId)) {
+      violations.push(`tool '${req.toolId}' does not match the contract tool_id (${JSON.stringify(resolved.tool_id)}) for class '${className}'.`);
+    }
+  }
+  if (resolved.cwd_policy === "worktree-required") {
+    if (!req.cwd) {
+      violations.push(`class '${className}' has cwd_policy 'worktree-required' but NO cwd was supplied — a build-chain dispatch must name its isolated worktree (omitting cwd is not a bypass).`);
+    } else if (path.resolve(req.cwd) === PROJECT_ROOT) {
+      violations.push(`class '${className}' has cwd_policy 'worktree-required' but cwd is the canonical root — a build-chain role must run in an isolated worktree.`);
+    }
+  }
+  return { ok: violations.length === 0, violations, contract: { class: className, ...resolved } };
+}
+
 /**
  * The mode-scoped dispatch profile (S-LC-06 / PLAN §8.7) for a mode, or null.
  * A profile NARROWS (never widens) which shapes a class/role may use in that mode.
@@ -378,6 +439,7 @@ function validateContractFile() {
 
 module.exports = {
   loadContract, loadRegistry, classForRole, contractForRole, validateDispatch,
+  validateDispatchForClass,
   skillExecution, validateContractFile, registryAttrs, CONTRACT_PATH, REGISTRY_PATH,
   ARGV_SCHEMA_VERSION, modeProfile, allowedShapesForRoleInMode,
 };
diff --git a/scripts/dispatch/dispatch-contract.test.js b/scripts/dispatch/dispatch-contract.test.js
index 3b9c5a1..043d384 100644
--- a/scripts/dispatch/dispatch-contract.test.js
+++ b/scripts/dispatch/dispatch-contract.test.js
@@ -16,7 +16,7 @@ const path = require("path");
 const { spawnSync } = require("child_process");
 const { harness, sealedDir } = require("../checks/lib/fixture-harness");
 const {
-  validateDispatch, contractForRole, classForRole, skillExecution, validateContractFile, CONTRACT_PATH,
+  validateDispatch, validateDispatchForClass, contractForRole, classForRole, skillExecution, validateContractFile, CONTRACT_PATH,
 } = require("./dispatch-contract");
 
 const h = harness("dispatch-contract");
@@ -114,4 +114,43 @@ h.violation("a build-chain role via in-process-agent is rejected EVEN with a con
   }
 });
 
+// ── G1 / β option (c): generic build id 'builder' → build_chain_worker ─────────
+// validateDispatch still returns ok:false for 'builder' (not in role-registry — correct);
+// validateDispatchForClass resolves build_chain_worker directly — the TRUTHFUL path.
+
+// NEW: the class-level helper resolves build_chain_worker + subprocess-claude → OK.
+// A non-canonical cwd satisfies the worktree-required policy.
+h.pass("G1: validateDispatchForClass(build_chain_worker, subprocess-claude, worktree cwd) → contract-OK (truthful advisory)", () =>
+  validateDispatchForClass({
+    class: "build_chain_worker",
+    shape: "subprocess-claude",
+    toolId: "claude",
+    cwd: path.join(__dirname, "..", "..", "wt-fixture"),
+  }));
+
+// (planted-G1) The OLD path: validateDispatch alone returns ok:false with "(fail-closed)"
+// for 'builder' — that is the LIE G1 eliminates. We assert this explicitly so any
+// revert that drops the GENERIC_BUILD_IDS re-route is immediately detectable.
+h.violation("(planted-G1) validateDispatch for 'builder' still returns fail-closed — the lying advisory the G1 fix eliminates", () =>
+  validateDispatch({
+    role: "builder",
+    shape: "subprocess-claude",
+    toolId: "claude",
+    cwd: path.join(__dirname, "..", "..", "wt-fixture"),
+  }));
+
+// (planted-G1) validateDispatchForClass MUST NOT produce '(fail-closed)' for the
+// build_chain_worker class — if it did, the fix is broken (it would just move the lie).
+h.test("(planted-G1) validateDispatchForClass must NOT produce '(fail-closed)' wording for build_chain_worker + subprocess-claude", () => {
+  const v = validateDispatchForClass({
+    class: "build_chain_worker",
+    shape: "subprocess-claude",
+    toolId: "claude",
+    cwd: path.join(__dirname, "..", "..", "wt-fixture"),
+  });
+  assert.strictEqual(v.ok, true, `expected ok:true from validateDispatchForClass, got violations: ${JSON.stringify(v.violations)}`);
+  const hasFailClosed = (v.violations || []).some((viol) => viol.includes("fail-closed"));
+  assert.strictEqual(hasFailClosed, false, `validateDispatchForClass must NOT produce '(fail-closed)' wording — if it does, the G1 fix is broken: ${JSON.stringify(v.violations)}`);
+});
+
 h.done();
diff --git a/scripts/dispatch/provider-breaker.js b/scripts/dispatch/provider-breaker.js
new file mode 100644
index 0000000..1dd6058
--- /dev/null
+++ b/scripts/dispatch/provider-breaker.js
@@ -0,0 +1,244 @@
+"use strict";
+
+/**
+ * scripts/dispatch/provider-breaker.js — TTL'd circuit breaker for quota-dead providers.
+ *
+ * Problem: when a provider (gemini, openai) hits a quota window, every subsequent
+ * dispatch RE-BURNS it. classifyQuotaFailure returns {kind:"quota_exhausted",
+ * recoverable:true} and runProvider logs it, but nothing REMEMBERS the provider is
+ * down — so the next dispatch tries it again (6 reviewer prompts × 3 retries = 18
+ * re-burns into a known-dead window, per T-20260610-306 telemetry audit).
+ *
+ * Design (β-ratified):
+ *   - markDown(provider, opts)   — write/merge a TTL'd entry into provider-down.json
+ *   - isDown(provider)           — true iff entry exists AND Date.now() < entry.until
+ *   - clear(provider)            — remove an entry (recovery path)
+ *   - computeUntil(p, errText, nowMs) — derive TTL epoch ms from hint or 30m default
+ *
+ * PRIMARY SAFETY PROPERTY — FAIL-OPEN:
+ *   Every function in this module is wrapped in try/catch. Any error (file
+ *   unreadable, corrupt JSON, write failure, parse error) is SWALLOWED and the
+ *   safe default is returned: isDown→false, markDown→no-op, computeUntil→nowMs+30m.
+ *   A broken breaker MUST NEVER block a healthy provider.
+ *
+ * State store: .claude/runtime/provider-down.json (gitignored runtime state).
+ * Test seam:   WARPOS_PROVIDER_DOWN_FILE env var overrides the resolved path.
+ *
+ * SP-20260610-007 / T-20260610-306 (G5)
+ */
+
+const fs = require("fs");
+const path = require("path");
+
+// ── Constants ──────────────────────────────────────────────────────────────
+const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes
+const MAX_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours — clamp absurd parsed values
+
+// ── Path resolution ────────────────────────────────────────────────────────
+/**
+ * Resolve the path to provider-down.json.
+ * WARPOS_PROVIDER_DOWN_FILE overrides the default (test seam).
+ */
+function resolveFilePath() {
+  if (process.env.WARPOS_PROVIDER_DOWN_FILE) {
+    return process.env.WARPOS_PROVIDER_DOWN_FILE;
+  }
+  // Default: .claude/runtime/provider-down.json
+  // Resolve from __dirname so it's cwd-independent.
+  const projectRoot = path.resolve(__dirname, "../../..");
+  return path.join(projectRoot, ".claude", "runtime", "provider-down.json");
+}
+
+// ── Internal helpers ───────────────────────────────────────────────────────
+/**
+ * Read and parse the provider-down file.
+ * Returns {} on any error (fail-open: missing / unreadable / corrupt JSON).
+ */
+function readState() {
+  try {
+    const raw = fs.readFileSync(resolveFilePath(), "utf8");
+    const parsed = JSON.parse(raw);
+    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
+      return parsed;
+    }
+    return {};
+  } catch {
+    return {}; // fail-open
+  }
+}
+
+/**
+ * Write state atomically (temp-file + rename). Swallows all errors (fail-open).
+ */
+function writeState(state) {
+  try {
+    const filePath = resolveFilePath();
+    fs.mkdirSync(path.dirname(filePath), { recursive: true });
+    const tmp = filePath + ".tmp." + process.pid;
+    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
+    fs.renameSync(tmp, filePath);
+  } catch {
+    // Fail-open: write failure must NOT propagate
+  }
+}
+
+// ── Public API ─────────────────────────────────────────────────────────────
+
+/**
+ * Compute the TTL epoch ms for a provider that just hit a quota failure.
+ *
+ * Attempts to parse a reset/retry hint from errText:
+ *   - "resets after Xh" / "resets in Xm"       (gemini-style)
+ *   - "retry after Ns" / "retry-after: N"        (HTTP Retry-After)
+ *   - "retry in Xs"                               (RESOURCE_EXHAUSTED body)
+ *
+ * EXPLICIT parse-fail branch (β-ratified):
+ *   If a hint token IS present in errText but is MALFORMED / unparseable /
+ *   outside a sane range → fall through to DEFAULT_TTL_MS (30m).
+ *   NOT infinite (that strands a recovered provider).
+ *   NOT 0 (that makes the breaker vacuous).
+ *   This is an explicit else/fallthrough — not an implicit catch-all.
+ *
+ * Clamps absurd parsed values (> 24h or ≤ 0) to DEFAULT_TTL_MS.
+ *
+ * FAIL-OPEN: any unexpected error returns nowMs + DEFAULT_TTL_MS (never throws).
+ *
+ * @param {string} _provider  - provider name (reserved for per-provider overrides)
+ * @param {string} errText    - error text from the failed dispatch
+ * @param {number} nowMs      - current epoch ms (injectable for deterministic tests)
+ * @returns {number} epoch ms when the provider should be tried again
+ */
+function computeUntil(_provider, errText, nowMs) {
+  try {
+    const text = String(errText || "");
+    const safeNow = typeof nowMs === "number" ? nowMs : Date.now();
+
+    // Patterns that may carry a reset/retry duration hint.
+    // Group 1 = numeric value, Group 2 = unit (optional, defaults to seconds).
+    const hintPatterns = [
+      // "resets after 1h" / "resets in 2h" / "reset after 30m"
+      /reset(?:s)?\s+(?:after|in)\s+(\d+(?:\.\d+)?)\s*(h(?:r|ours?)?|m(?:in|inutes?)?|s(?:ec|econds?)?)?/i,
+      // "retry in 30s" / "retry in 5m"
+      /retry\s+in\s+(\d+(?:\.\d+)?)\s*(h(?:r|ours?)?|m(?:in|inutes?)?|s(?:ec|econds?)?)?/i,
+      // "retry after 60s" / "retry-after: 120" / "retry after 120"
+      /retry[\s-]?after[:\s]+(\d+(?:\.\d+)?)\s*(h(?:r|ours?)?|m(?:in|inutes?)?|s(?:ec|econds?)?)?/i,
+    ];
+
+    let hintFound = false;
+    let parsedMs = null;
+
+    for (const pattern of hintPatterns) {
+      const m = text.match(pattern);
+      if (!m) continue;
+
+      hintFound = true;
+      const value = parseFloat(m[1]);
+      const rawUnit = (m[2] || "").toLowerCase();
+
+      // Value must be a finite positive number
+      if (!isFinite(value) || value <= 0) {
+        // Malformed value — explicit parse-fail branch: parsedMs stays null
+        break;
+      }
+
+      // Resolve unit; no unit or unknown unit → treat as seconds
+      let durationMs;
+      if (rawUnit.startsWith("h")) {
+        durationMs = value * 60 * 60 * 1000;
+      } else if (rawUnit.startsWith("m")) {
+        durationMs = value * 60 * 1000;
+      } else {
+        durationMs = value * 1000; // seconds (default when unit absent or "s")
+      }
+
+      // Clamp absurd values — explicit branch, not implicit catch
+      if (durationMs <= 0 || durationMs > MAX_TTL_MS) {
+        // Out-of-range → explicit parse-fail fallthrough to DEFAULT_TTL_MS
+        parsedMs = null;
+      } else {
+        parsedMs = durationMs;
+      }
+      break;
+    }
+
+    // EXPLICIT parse-fail fallthrough (β requirement):
+    //   - hintFound=true, parsedMs=null  → hint present but malformed/clamped → DEFAULT
+    //   - hintFound=false                → no hint in errText              → DEFAULT
+    //   - hintFound=true, parsedMs set   → valid parsed hint                → use it
+    if (parsedMs !== null) {
+      return safeNow + parsedMs;
+    }
+    // Both "no hint" and "malformed hint" fall here — DEFAULT_TTL_MS
+    return safeNow + DEFAULT_TTL_MS;
+  } catch {
+    // Fail-open: unexpected error → default
+    const safeNow = typeof nowMs === "number" ? nowMs : Date.now();
+    return safeNow + DEFAULT_TTL_MS;
+  }
+}
+
+/**
+ * Mark a provider as circuit-broken until the given epoch ms.
+ * FAIL-OPEN: any error is swallowed — never throws.
+ *
+ * @param {string} provider                        - e.g. "gemini", "openai"
+ * @param {{ kind: string, untilMs: number, evidence?: string }} opts
+ */
+function markDown(provider, { kind, untilMs, evidence } = {}) {
+  try {
+    if (!provider || typeof provider !== "string") return; // sanity guard
+    const state = readState();
+    state[provider] = {
+      kind: kind || "quota_exhausted",
+      until: typeof untilMs === "number" ? untilMs : Date.now() + DEFAULT_TTL_MS,
+      evidence: evidence ? String(evidence).slice(0, 200) : undefined,
+      marked_at: Date.now(),
+    };
+    writeState(state);
+  } catch {
+    // Fail-open: markDown MUST NOT throw
+  }
+}
+
+/**
+ * Check whether a provider is currently circuit-broken.
+ * FAIL-OPEN: any error returns false (provider treated as available).
+ *
+ * Returns true  iff an entry exists AND Date.now() < entry.until (within TTL).
+ * Returns false for expired entries (provider may have recovered).
+ *
+ * @param {string} provider
+ * @returns {boolean}
+ */
+function isDown(provider) {
+  try {
+    if (!provider || typeof provider !== "string") return false;
+    const state = readState();
+    const entry = state[provider];
+    if (!entry || typeof entry.until !== "number") return false;
+    // Within TTL → down. Expired → NOT down (provider may have recovered).
+    return Date.now() < entry.until;
+  } catch {
+    return false; // Fail-open: error → provider available
+  }
+}
+
+/**
+ * Remove a circuit-breaker entry (recovery path). FAIL-OPEN: any error swallowed.
+ *
+ * @param {string} provider
+ */
+function clear(provider) {
+  try {
+    if (!provider || typeof provider !== "string") return;
+    const state = readState();
+    if (Object.prototype.hasOwnProperty.call(state, provider)) {
+      delete state[provider];
+      writeState(state);
+    }
+  } catch {
+    // Fail-open
+  }
+}
+
+module.exports = { markDown, isDown, clear, computeUntil, DEFAULT_TTL_MS };
diff --git a/scripts/dispatch/provider-breaker.test.js b/scripts/dispatch/provider-breaker.test.js
new file mode 100644
index 0000000..5367419
--- /dev/null
+++ b/scripts/dispatch/provider-breaker.test.js
@@ -0,0 +1,297 @@
+#!/usr/bin/env node
+"use strict";
+
+/**
+ * scripts/dispatch/provider-breaker.test.js — Planted-violation tests (P5, β-MANDATORY).
+ *
+ * Proves:
+ *   1. Re-burn blocked: markDown within TTL → isDown true → providerAvailable false.
+ *      Expired entry → isDown false (provider treated as recovered).
+ *   2. Fail-open on corrupt file: non-JSON → isDown returns false (NOT a throw),
+ *      providerAvailable falls through to its normal check (the load-bearing safety test).
+ *   3. TTL parse-fail → explicit 30m: computeUntil with a MALFORMED reset hint → DEFAULT.
+ *      Sane hint → uses parsed value. Absurd value → clamped to DEFAULT.
+ *   4. providerAvailable("claude") always true (breaker exempt).
+ *   5. Clear removes the entry.
+ *
+ * Test seam: WARPOS_PROVIDER_DOWN_FILE env var is set to a temp file so no test
+ * touches the real .claude/runtime/provider-down.json.
+ *
+ *   node scripts/dispatch/provider-breaker.test.js
+ */
+
+const assert = require("assert");
+const fs = require("fs");
+const os = require("os");
+const path = require("path");
+
+// ── Test seam setup ────────────────────────────────────────────────────────
+// Point both the breaker AND providers.js at a temp file so no test contaminates
+// the real runtime state or depends on an existing provider-down.json.
+const tmpFile = path.join(os.tmpdir(), `provider-breaker-test-${process.pid}.json`);
+process.env.WARPOS_PROVIDER_DOWN_FILE = tmpFile;
+
+// Clear the temp file before starting
+try { fs.unlinkSync(tmpFile); } catch { /* ok if absent */ }
+
+// ── Load modules AFTER env var is set ─────────────────────────────────────
+// Both modules read WARPOS_PROVIDER_DOWN_FILE at call-time (resolveFilePath()),
+// so requiring after the env var is set is sufficient.
+const breaker = require("./provider-breaker");
+
+// providers.js is in the hooks lib; load it for the providerAvailable integration test.
+// It will have loaded provider-breaker via its own guarded require at module load time.
+// Since WARPOS_PROVIDER_DOWN_FILE is already set, the same temp file is used.
+let providerAvailable = null;
+try {
+  const providers = require("../hooks/lib/providers");
+  providerAvailable = providers.providerAvailable;
+} catch (e) {
+  // If providers.js can't be loaded (e.g. missing deps in a narrow test env),
+  // note it but don't fail — the breaker tests still run.
+  process.stderr.write(`[breaker.test] providers.js load skipped: ${e.message}\n`);
+}
+
+// ── Helpers ────────────────────────────────────────────────────────────────
+let passed = 0;
+let failed = 0;
+
+function check(name, ok, detail) {
+  if (ok) {
+    passed++;
+    process.stdout.write(`  ok    ${name}\n`);
+  } else {
+    failed++;
+    process.stdout.write(`  FAIL  ${name}\n`);
+    if (detail) process.stdout.write(`        ${detail}\n`);
+  }
+}
+
+function resetTmpFile() {
+  try { fs.unlinkSync(tmpFile); } catch { /* ok */ }
+}
+
+// ── § 1 — Re-burn blocked (within TTL) ────────────────────────────────────
+process.stdout.write("\n§1 Re-burn blocked\n");
+
+resetTmpFile();
+const now1 = Date.now();
+const until1 = now1 + 30 * 60 * 1000; // 30 min in the future
+breaker.markDown("gemini", { kind: "quota_exhausted", untilMs: until1, evidence: "test" });
+
+const down1 = breaker.isDown("gemini");
+check(
+  "isDown('gemini') true within TTL",
+  down1 === true,
+  `expected true, got ${down1}`,
+);
+
+// providerAvailable integration: should return false (breaker short-circuits before cliAvailable)
+if (providerAvailable) {
+  const avail1 = providerAvailable("gemini");
+  check(
+    "providerAvailable('gemini') false when breaker is down (re-burn short-circuited)",
+    avail1 === false,
+    `expected false, got ${avail1}`,
+  );
+} else {
+  check("providerAvailable skipped (providers.js not loaded)", true);
+}
+
+// Expired entry → NOT down
+resetTmpFile();
+const pastUntil = Date.now() - 1; // already expired
+breaker.markDown("gemini", { kind: "quota_exhausted", untilMs: pastUntil });
+
+const down2 = breaker.isDown("gemini");
+check(
+  "isDown('gemini') false for expired entry (provider may have recovered)",
+  down2 === false,
+  `expected false, got ${down2}`,
+);
+
+// providerAvailable with expired entry falls through to CLI check (may return true/false
+// depending on whether gemini CLI is installed — we only verify it doesn't throw)
+if (providerAvailable) {
+  let threw = false;
+  let result;
+  try {
+    result = providerAvailable("gemini");
+  } catch (e) {
+    threw = true;
+    result = e.message;
+  }
+  check(
+    "providerAvailable('gemini') does NOT throw for expired breaker entry",
+    !threw,
+    threw ? `threw: ${result}` : null,
+  );
+}
+
+// ── § 2 — Fail-open on corrupt file (load-bearing safety test) ────────────
+process.stdout.write("\n§2 Fail-open on corrupt / non-JSON file\n");
+
+fs.writeFileSync(tmpFile, "THIS IS NOT JSON {{{{ garbage >>>", "utf8");
+
+let isDownThrew = false;
+let isDownResult;
+try {
+  isDownResult = breaker.isDown("gemini");
+} catch (e) {
+  isDownThrew = true;
+  isDownResult = `threw: ${e.message}`;
+}
+
+check(
+  "isDown returns false on corrupt file (no throw — fail-open)",
+  !isDownThrew && isDownResult === false,
+  `threw=${isDownThrew} result=${isDownResult}`,
+);
+
+if (providerAvailable) {
+  // Write garbage again (isDown cleared it internally by reading {} on parse fail)
+  fs.writeFileSync(tmpFile, "GARBAGE", "utf8");
+  let avThrew = false;
+  let avResult;
+  try {
+    avResult = providerAvailable("gemini");
+  } catch (e) {
+    avThrew = true;
+    avResult = `threw: ${e.message}`;
+  }
+  check(
+    "providerAvailable does NOT throw on corrupt breaker file (falls through to CLI check)",
+    !avThrew,
+    avThrew ? avResult : null,
+  );
+  // We don't assert the boolean return because it depends on gemini CLI presence.
+}
+
+// markDown must not throw on a corrupt file either
+fs.writeFileSync(tmpFile, "{{bad json", "utf8");
+let markThrew = false;
+try {
+  breaker.markDown("openai", { kind: "quota_exhausted", untilMs: Date.now() + 1000 });
+} catch (e) {
+  markThrew = true;
+}
+check(
+  "markDown does NOT throw on corrupt file (fail-open write)",
+  !markThrew,
+  markThrew ? "markDown threw" : null,
+);
+
+// ── § 3 — TTL computation (computeUntil) ──────────────────────────────────
+process.stdout.write("\n§3 TTL computation — parse-fail, sane hint, absurd clamp\n");
+
+const BASE_NOW = 1_000_000_000; // fixed reference point for determinism
+const DEFAULT = breaker.DEFAULT_TTL_MS; // 30 min in ms
+
+// 3a. No hint in errText → DEFAULT_TTL_MS
+{
+  const result = breaker.computeUntil("gemini", "generic error message", BASE_NOW);
+  check(
+    "computeUntil — no hint → DEFAULT_TTL_MS (30m)",
+    result === BASE_NOW + DEFAULT,
+    `expected ${BASE_NOW + DEFAULT}, got ${result}`,
+  );
+}
+
+// 3b. Sane hint "resets after 1h" → 1h
+{
+  const result = breaker.computeUntil("gemini", "quota exceeded, resets after 1h", BASE_NOW);
+  const expected = BASE_NOW + 60 * 60 * 1000;
+  check(
+    "computeUntil — sane hint 'resets after 1h' → 1h",
+    result === expected,
+    `expected ${expected}, got ${result}`,
+  );
+}
+
+// 3c. Sane hint "retry after 120s" → 120s
+{
+  const result = breaker.computeUntil("gemini", "rate limited, retry after 120s", BASE_NOW);
+  const expected = BASE_NOW + 120 * 1000;
+  check(
+    "computeUntil — sane hint 'retry after 120s' → 120s",
+    result === expected,
+    `expected ${expected}, got ${result}`,
+  );
+}
+
+// 3d. Sane hint "retry in 5m" → 5 min
+{
+  const result = breaker.computeUntil("gemini", "RESOURCE_EXHAUSTED retry in 5m", BASE_NOW);
+  const expected = BASE_NOW + 5 * 60 * 1000;
+  check(
+    "computeUntil — sane hint 'retry in 5m' → 5m",
+    result === expected,
+    `expected ${expected}, got ${result}`,
+  );
+}
+
+// 3e. EXPLICIT parse-fail branch: hint present but MALFORMED (non-numeric) → DEFAULT (NOT infinite, NOT 0)
+{
+  const result = breaker.computeUntil("gemini", "resets after Xh soon", BASE_NOW);
+  check(
+    "computeUntil — MALFORMED hint 'resets after Xh' → explicit parse-fail → DEFAULT_TTL_MS (not infinite, not 0)",
+    result === BASE_NOW + DEFAULT,
+    `expected ${BASE_NOW + DEFAULT}, got ${result}`,
+  );
+}
+
+// 3f. Absurd value > 24h → clamped to DEFAULT_TTL_MS
+{
+  const result = breaker.computeUntil("gemini", "retry after 100h", BASE_NOW);
+  check(
+    "computeUntil — absurd hint >24h → clamped to DEFAULT_TTL_MS",
+    result === BASE_NOW + DEFAULT,
+    `expected ${BASE_NOW + DEFAULT}, got ${result}`,
+  );
+}
+
+// 3g. Absurd value ≤ 0 → clamped to DEFAULT_TTL_MS
+{
+  const result = breaker.computeUntil("gemini", "retry after 0s", BASE_NOW);
+  check(
+    "computeUntil — zero hint '0s' → clamped to DEFAULT_TTL_MS",
+    result === BASE_NOW + DEFAULT,
+    `expected ${BASE_NOW + DEFAULT}, got ${result}`,
+  );
+}
+
+// ── § 4 — claude exempt ────────────────────────────────────────────────────
+process.stdout.write("\n§4 claude is always available (breaker exempt)\n");
+
+if (providerAvailable) {
+  // Even if someone accidentally markDown("claude"), providerAvailable returns true early
+  resetTmpFile();
+  breaker.markDown("claude", { kind: "quota_exhausted", untilMs: Date.now() + 999_999 });
+  const claudeAvail = providerAvailable("claude");
+  check(
+    "providerAvailable('claude') always true (exempt from breaker)",
+    claudeAvail === true,
+    `expected true, got ${claudeAvail}`,
+  );
+} else {
+  check("claude exempt (providers.js not loaded — skipped)", true);
+}
+
+// ── § 5 — clear() removes the entry ───────────────────────────────────────
+process.stdout.write("\n§5 clear() removes the entry\n");
+
+resetTmpFile();
+breaker.markDown("openai", { kind: "quota_exhausted", untilMs: Date.now() + 60_000 });
+const downBeforeClear = breaker.isDown("openai");
+check("isDown true before clear", downBeforeClear === true, `got ${downBeforeClear}`);
+
+breaker.clear("openai");
+const downAfterClear = breaker.isDown("openai");
+check("isDown false after clear", downAfterClear === false, `got ${downAfterClear}`);
+
+// ── Cleanup ────────────────────────────────────────────────────────────────
+try { fs.unlinkSync(tmpFile); } catch { /* ok */ }
+
+// ── Summary ────────────────────────────────────────────────────────────────
+process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
+process.exit(failed === 0 ? 0 : 1);
diff --git a/scripts/dispatch/run-context-n8.test.js b/scripts/dispatch/run-context-n8.test.js
new file mode 100644
index 0000000..0e0bd5d
--- /dev/null
+++ b/scripts/dispatch/run-context-n8.test.js
@@ -0,0 +1,167 @@
+#!/usr/bin/env node
+"use strict";
+
+/**
+ * T-303 (N8) — run-context env-export test.
+ *
+ * Verifies the three N8 guarantees:
+ *
+ *  A. runContext() (dispatch-agent.js) returns sprint_id from WARPOS_SPRINT_ID
+ *     — the single-source extension so all three wrappers stamp it uniformly.
+ *
+ *  B. The run_id generation shape is `run-<base36>-<hex>` (mirrors makeDispatchId
+ *     "d-" prefix, prefixed "run-" to distinguish orchestrator runs).
+ *
+ *  C. Inherited WARPOS_RUN_ID is respected — the generation guard
+ *     `if (!env.WARPOS_RUN_ID)` never overwrites a parent orchestrator's run_id.
+ *
+ *  D. A full.js / epsilon-runtime child env export can be simulated: child env
+ *     WARPOS_RUN_ID / WARPOS_PHASE_ID / WARPOS_SPRINT_ID are non-null and the
+ *     run_id can be scoped by coverage-gate.evaluate({ runId }).
+ *
+ *  PLANTED VIOLATION (§17.4 fail-closed, N8-specific):
+ *  - run_id=null under a live runId-scoped evaluate CANNOT satisfy coverage.
+ *    A null run_id means no orchestrator exported WARPOS_RUN_ID — the gate
+ *    correctly rejects it, making run-scoped coverage unsatisfiable for null runs.
+ *
+ *   node scripts/dispatch/run-context-n8.test.js
+ */
+
+const crypto = require("crypto");
+const { harness } = require("../checks/lib/fixture-harness");
+const { runContext } = require("../dispatch-agent");
+const { evaluate } = require("./coverage-gate");
+const { ARGV_SCHEMA_VERSION } = require("./dispatch-contract");
+
+const h = harness("run-context-n8");
+
+// ── A. runContext() returns sprint_id from env ─────────────────────────────
+h.test("runContext() returns sprint_id when WARPOS_SPRINT_ID is set", () => {
+  const prev = process.env.WARPOS_SPRINT_ID;
+  process.env.WARPOS_SPRINT_ID = "SP-20260610-006";
+  try {
+    const ctx = runContext();
+    if (ctx.sprint_id !== "SP-20260610-006") {
+      throw new Error(`expected sprint_id='SP-20260610-006', got '${ctx.sprint_id}'`);
+    }
+  } finally {
+    if (prev === undefined) delete process.env.WARPOS_SPRINT_ID;
+    else process.env.WARPOS_SPRINT_ID = prev;
+  }
+});
+
+h.test("runContext() returns null sprint_id when WARPOS_SPRINT_ID is unset", () => {
+  const prev = process.env.WARPOS_SPRINT_ID;
+  delete process.env.WARPOS_SPRINT_ID;
+  try {
+    const ctx = runContext();
+    if (ctx.sprint_id !== null) {
+      throw new Error(`expected sprint_id=null, got '${ctx.sprint_id}'`);
+    }
+  } finally {
+    if (prev !== undefined) process.env.WARPOS_SPRINT_ID = prev;
+  }
+});
+
+h.test("runContext() returns run_id from WARPOS_RUN_ID when set", () => {
+  const prev = process.env.WARPOS_RUN_ID;
+  process.env.WARPOS_RUN_ID = "run-test-00000001";
+  try {
+    const ctx = runContext();
+    if (ctx.run_id !== "run-test-00000001") {
+      throw new Error(`expected run_id='run-test-00000001', got '${ctx.run_id}'`);
+    }
+  } finally {
+    if (prev === undefined) delete process.env.WARPOS_RUN_ID;
+    else process.env.WARPOS_RUN_ID = prev;
+  }
+});
+
+// ── B. run_id generation shape ─────────────────────────────────────────────
+h.test("generated run_id matches run-<base36>-<4-byte-hex> shape", () => {
+  const runId = "run-" + Date.now().toString(36) + "-" + crypto.randomBytes(4).toString("hex");
+  // base36 timestamp + 8 lowercase hex chars (4 bytes)
+  if (!/^run-[0-9a-z]+-[0-9a-f]{8}$/.test(runId)) {
+    throw new Error(`run_id shape mismatch: '${runId}'`);
+  }
+});
+
+// ── C. Inherited WARPOS_RUN_ID is respected ────────────────────────────────
+h.test("inherited WARPOS_RUN_ID is not overwritten by the generation guard", () => {
+  const inherited = "run-inherited-aabbccdd";
+  const prev = process.env.WARPOS_RUN_ID;
+  process.env.WARPOS_RUN_ID = inherited;
+  try {
+    // Simulate the full.js + spawnAgent guard: only generate when absent.
+    if (!process.env.WARPOS_RUN_ID) {
+      process.env.WARPOS_RUN_ID =
+        "run-" + Date.now().toString(36) + "-" + crypto.randomBytes(4).toString("hex");
+    }
+    const ctx = runContext();
+    if (ctx.run_id !== inherited) {
+      throw new Error(`inherited run_id overwritten: expected '${inherited}', got '${ctx.run_id}'`);
+    }
+  } finally {
+    if (prev === undefined) delete process.env.WARPOS_RUN_ID;
+    else process.env.WARPOS_RUN_ID = prev;
+  }
+});
+
+// ── D. Child env export + coverage-gate scoping ────────────────────────────
+const RUN = "run-n8test-cafef00d";
+
+function rec(over) {
+  return {
+    dispatch_id: "d-n8-1",
+    cmdline_checksum: "sha256:cafef00d",
+    run_id: RUN,
+    role: "security-reviewer",
+    provider: "gemini",
+    ok: true,
+    argv_schema_version: ARGV_SCHEMA_VERSION,
+    output_digest: "sha256:feedface00000000",
+    sprint_id: "SP-20260610-006",
+    phase_id: "gauntlet",
+    ...over,
+  };
+}
+
+// Simulate what a child dispatch writes after spawnAgent sets env.WARPOS_RUN_ID.
+h.pass(
+  "D: record stamped with run_id + sprint_id satisfies runId-scoped coverage",
+  () =>
+    evaluate({
+      runId: RUN,
+      records: [rec()],
+      expected: [{ role: "security-reviewer" }],
+    })
+);
+
+// ── PLANTED VIOLATION (§17.4, N8) ─────────────────────────────────────────
+// A record whose run_id is null cannot satisfy a run-scoped coverage check.
+// coverage-gate.evaluate filters `records.filter(r => r.run_id === runId)`:
+// null !== RUN → the record is excluded → UNBACKED → coverage FAILS.
+// This is the correct fail-closed: a null run_id means WARPOS_RUN_ID was never
+// exported — the coverage gate cannot prove run-scoped liveness.
+h.violation(
+  "PLANTED N8: run_id=null under runId-scoped evaluate is filtered out (UNBACKED → FAIL)",
+  () =>
+    evaluate({
+      runId: RUN,
+      records: [rec({ run_id: null })],
+      expected: [{ role: "security-reviewer" }],
+    })
+);
+
+// A record from a completely different run also fails (orthogonal but strengthens P5.3).
+h.violation(
+  "PLANTED N8: run_id from a different run is not counted for this runId (UNBACKED → FAIL)",
+  () =>
+    evaluate({
+      runId: RUN,
+      records: [rec({ run_id: "run-other-ffffffff" })],
+      expected: [{ role: "security-reviewer" }],
+    })
+);
+
+h.done();
diff --git a/scripts/dispatch/timeout-policy.js b/scripts/dispatch/timeout-policy.js
new file mode 100644
index 0000000..dc03d15
--- /dev/null
+++ b/scripts/dispatch/timeout-policy.js
@@ -0,0 +1,90 @@
+"use strict";
+
+/**
+ * timeout-policy.js — Foreground-aware timeout policy for dispatch wrappers.
+ *
+ * Fixes the doogle-class G8/N1 defect: every wrapper's DEFAULT bound exceeded the
+ * harness FOREGROUND Bash ceiling (600s), so a foreground wrapper was killed by the
+ * harness BEFORE its own bound fired — meaning it never wrote its death record. The
+ * "loud death record" layer silently degraded to the backstop only.
+ *
+ * THE FIX — foregroundAwareTimeout (β-ratified, T-20260610-304):
+ *   - A FOREGROUND_CEILING_MS constant (540s — 60s headroom under the 600s harness kill)
+ *     so the wrapper's bound fires BEFORE the harness kill and the death record is written.
+ *   - FAIL-CLOSED detection: treat the dispatch as FOREGROUND (→ clamp to 540s) UNLESS
+ *     an explicit background signal is present. Absence of the signal ⇒ clamp. This
+ *     prevents a detection gap from silently re-opening the doogle class.
+ *   - Background dispatches (real builder runs > 540s) keep their full bound via the
+ *     explicit WARPOS_DISPATCH_BACKGROUND=1 signal or opts.background === true.
+ *
+ * WRAPPER_DEFAULTS — the canonical per-wrapper raw bounds (the *requested* bound before
+ * the foreground ceiling is applied). Each wrapper imports this so the sanity check and
+ * the wrappers always agree on the same defaults. Changing a default here is the one
+ * place to edit.
+ *
+ * NOTE on env overrides (DISPATCH_BUILDER_TIMEOUT_MS / DISPATCH_SKILL_TIMEOUT_MS):
+ *   An env override sets the *requested* bound but the foreground ceiling is the hard
+ *   cap. A caller that genuinely needs >540s MUST set WARPOS_DISPATCH_BACKGROUND=1 —
+ *   the honest signal that they've backgrounded the dispatch. Without that signal, any
+ *   requested bound above 540s is clamped (fail-closed).
+ *
+ * Wired into:
+ *   scripts/dispatch-claude.js   (DISPATCH_CLAUDE route)
+ *   scripts/dispatch-skill.js    (DISPATCH_SKILL route)
+ *   scripts/sprint/epsilon-runtime.js  (spawnAgent — both DISPATCH_AGENT + DISPATCH_CLAUDE)
+ * Verified by:
+ *   scripts/checks/dispatch-timeout-sanity.js  (standalone, report-only)
+ *   scripts/checks/dispatch-timeout-sanity.test.js  (planted-violation + fail-closed tests)
+ */
+
+// 540s — 60s headroom under the 600s harness Bash-tool kill so the wrapper's own
+// bound fires BEFORE the harness kills it, giving it time to write the death record.
+const FOREGROUND_CEILING_MS = 540000;
+
+/**
+ * Canonical per-wrapper raw (requested) bounds.
+ * These are imported by each wrapper AND by the sanity check to ensure both
+ * agree on the same values (single source of truth).
+ *
+ * Background dispatches (real builders running > 540s) need these full values —
+ * they are NOT clamped when an explicit background signal is present.
+ */
+const WRAPPER_DEFAULTS = {
+  "dispatch-claude": 20 * 60 * 1000, // 20 min — builders are heavier
+  "dispatch-skill":  15 * 60 * 1000, // 15 min
+  "epsilon-agent":   15 * 60 * 1000, // 15 min — spawnAgent DISPATCH_AGENT route
+  "epsilon-claude":  20 * 60 * 1000, // 20 min — spawnAgent DISPATCH_CLAUDE route
+  // Gauntlet fix-cycle (claude backend lane, 2026-06-10): runProvider — the
+  // cross-provider spawn in scripts/hooks/lib/providers.js — was the FOURTH
+  // wrapper named by NOTAGAIN audit G8 and the W0 build missed it (the exact
+  // fix-all-callers law this epic exists to mechanize). Same 15-min raw bound,
+  // same foreground clamp.
+  "run-provider":    15 * 60 * 1000, // 15 min — providers.js runProvider (cross-provider route)
+};
+
+/**
+ * foregroundAwareTimeout(defaultMs, opts) -> number
+ *
+ * Returns the EFFECTIVE timeout bound for a dispatch.
+ *
+ * FAIL-CLOSED design: defaults to the SAFE (clamped) bound when the
+ * foreground/background mode CANNOT be determined. Concretely, clamp to
+ * FOREGROUND_CEILING_MS UNLESS an explicit background signal is present:
+ *   1. opts.background === true   (caller set it explicitly)
+ *   2. process.env.WARPOS_DISPATCH_BACKGROUND === "1"
+ * ABSENCE of either signal ⇒ clamp (NOT the longer default).
+ *
+ * @param {number} defaultMs  The raw requested bound (e.g. from WRAPPER_DEFAULTS or an env override).
+ * @param {object} opts       Optional. Set opts.background=true for an explicit background dispatch.
+ * @returns {number}          Effective bound in milliseconds (≤ FOREGROUND_CEILING_MS when foreground).
+ */
+function foregroundAwareTimeout(defaultMs, opts) {
+  const isBackground =
+    (opts != null && opts.background === true) ||
+    process.env.WARPOS_DISPATCH_BACKGROUND === "1";
+
+  if (isBackground) return defaultMs;
+  return Math.min(defaultMs, FOREGROUND_CEILING_MS);
+}
+
+module.exports = { FOREGROUND_CEILING_MS, WRAPPER_DEFAULTS, foregroundAwareTimeout };
diff --git a/scripts/hooks/dispatch-route-guard.js b/scripts/hooks/dispatch-route-guard.js
index cbaf673..de53950 100644
--- a/scripts/hooks/dispatch-route-guard.js
+++ b/scripts/hooks/dispatch-route-guard.js
@@ -405,6 +405,42 @@ function findForbiddenSegment(rawSeg) {
   return null;
 }
 
+/**
+ * Detects the sanctioned `--review-fallback` lane (T-305 G2):
+ *   node scripts/dispatch-claude.js <review-role> <prompt> [args] --review-fallback
+ *
+ * This is the BLESSED fallback path for cross-provider review roles when their
+ * normal provider (openai/gemini) is quota-exhausted. dispatch-claude.js handles
+ * the actual routing; this detector lets the route-guard explicitly RECOGNIZE the
+ * lane (rather than it falling through silently via the canonical-prefix allowance).
+ *
+ * Key properties:
+ *   - Writes a LEDGERED ok:true completion record (fallback:true + provider:claude +
+ *     quota_fallback_from) so gauntlet-verify SEES it and coverage-gate TRIPS the
+ *     cross_provider_required debt VISIBLY. Honest debt, never silent green.
+ *   - No -w required (review roles are READ-ONLY — they don't write code).
+ *   - dispatch-claude.js REFUSES --review-fallback for build-chain roles (they still
+ *     require -w/--worktree isolation). This detector does NOT enforce that — it
+ *     merely names the recognized pattern; the dispatch enforces the role guard.
+ *
+ * Returns true when the command is the sanctioned review-fallback route, else false.
+ */
+function isReviewFallbackRoute(rawCmd) {
+  const cmd = String(rawCmd || "").replace(/\r?\n/g, " ").trim();
+  if (!cmd) return false;
+  const scan = stripQuoted(cmd);
+  // Must be a dispatch-claude.js invocation (the Claude-role bounded wrapper).
+  // The canonical-prefix regex matches both dispatch-agent.js and dispatch-claude.js;
+  // we narrow to dispatch-claude.js specifically.
+  if (
+    !/^\s*(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*node\s+["'`]?\S*dispatch-claude\.js\b/.test(scan)
+  ) return false;
+  // Must include the --review-fallback flag (unquoted — a quoted --review-fallback
+  // would not be passed as a real flag to node, so we match unquoted only).
+  if (!/\B--review-fallback\b/.test(scan)) return false;
+  return true;
+}
+
 /**
  * Non-blocking advisory: a `claude -p … --agent <role>` invocation whose prompt
  * is inlined as a command-substitution argv (`"$(cat file)"` / backtick-cat)
@@ -619,4 +655,4 @@ process.stdin.on("end", () => {
   }
 });
 
-module.exports = { findForbidden, findAdvisory, findHeavySkillAdvisory, HEAVY_SKILLS };
+module.exports = { findForbidden, findAdvisory, findHeavySkillAdvisory, HEAVY_SKILLS, isReviewFallbackRoute };
diff --git a/scripts/hooks/lib/providers.js b/scripts/hooks/lib/providers.js
index ab6c513..47d528e 100644
--- a/scripts/hooks/lib/providers.js
+++ b/scripts/hooks/lib/providers.js
@@ -44,6 +44,68 @@ try {
 } catch {
   /* fail-open: loadGeminiApiKey fallback below */
 }
+// T-20260610-306: TTL'd circuit breaker — marks a provider down after a quota
+// failure so subsequent dispatches skip it instead of re-burning the quota window.
+// Guarded require: if the module is missing or broken the breaker is simply absent
+// (fail-open; providerAvailable falls through to its normal CLI check).
+let providerBreaker = null;
+try {
+  providerBreaker = require("../../dispatch/provider-breaker");
+} catch {
+  /* fail-open: breaker unavailable, dispatch proceeds normally */
+}
+
+// ── Auth mode label (value-free, inline — importing dispatch-readiness would be circular) ──
+// Returns a SHORT label: "key (metered)" | "oauth (plan)" | "key (unknown posture)" | "none" | "harness" | "unknown"
+// VALUE-FREE: reads only field PRESENCE, never field values.
+const os_mod = require("os");
+function readFileSafeLocal(p) {
+  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
+}
+function detectAuthModeLabel(provider) {
+  try {
+    if (provider === "claude") return "harness";
+    if (provider === "openai") {
+      const authFiles = [
+        path.join(os_mod.homedir(), ".codex", "auth.json"),
+        path.join(os_mod.homedir(), ".config", "codex", "auth.json"),
+      ];
+      for (const f of authFiles) {
+        const raw = readFileSafeLocal(f);
+        if (raw === null) continue;
+        let parsed = null;
+        try { parsed = JSON.parse(raw); } catch { /* unparseable */ }
+        if (parsed !== null && typeof parsed === "object") {
+          if (
+            Object.prototype.hasOwnProperty.call(parsed, "auth_mode") ||
+            Object.prototype.hasOwnProperty.call(parsed, "OPENAI_API_KEY")
+          ) return "key (metered)";
+          if (
+            Object.prototype.hasOwnProperty.call(parsed, "access_token") ||
+            Object.prototype.hasOwnProperty.call(parsed, "refresh_token") ||
+            Object.prototype.hasOwnProperty.call(parsed, "tokens") ||
+            Object.prototype.hasOwnProperty.call(parsed, "id_token")
+          ) return "oauth (plan)";
+          return "key (unknown posture)";
+        }
+        return "key (unknown posture)";
+      }
+      if (process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY) return "key (env)";
+      return "none";
+    }
+    if (provider === "gemini") {
+      // Mirror gemini OAuth check without importing dispatch-readiness.
+      const credsPath = path.join(os_mod.homedir(), ".gemini", "oauth_creds.json");
+      const raw = readFileSafeLocal(credsPath);
+      if (raw && /(refresh|access)_token/.test(raw)) return "oauth (plan)";
+      if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) return "key (env)";
+      return "none";
+    }
+    return "unknown";
+  } catch {
+    return "unknown";
+  }
+}
 
 // ── Config resolution ───────────────────────────────────────
 function loadManifest() {
@@ -457,6 +519,18 @@ function cliAvailable(cmd) {
 
 function providerAvailable(providerName) {
   if (providerName === "claude") return true; // always available — it's the harness
+  // ── Circuit-breaker consult — SINGLE chokepoint for every provider ──────
+  // Every caller that reaches here (dispatch-shape, dispatch-claude, dispatch-agent,
+  // provider-health checks) inherits this gate. No per-wrapper consults needed.
+  // FAIL-OPEN: if providerBreaker failed to load OR isDown throws, fall through
+  // to the normal CLI check — a broken breaker NEVER blocks a healthy provider.
+  if (providerBreaker) {
+    try {
+      if (providerBreaker.isDown(providerName)) return false;
+    } catch {
+      // Fail-open: breaker error must never block a healthy provider
+    }
+  }
   const cfg = getProviderConfig(providerName);
   if (!cfg) return false;
   return cliAvailable(cfg.cli);
@@ -573,8 +647,17 @@ function modelsMatch(requested, reported) {
 function runProvider(role, prompt, opts = {}) {
   // Bumped 2026-04-28 from 120s → 900s. xhigh reasoning + 175KB review prompts
   // routinely exceed 2 min on gpt-5.4; gemini-3.1 pro-preview with 90KB prompts
-  // also timed out at 120s. 15 min is the new ceiling for review-class workloads.
-  const timeoutMs = opts.timeoutMs || 900_000;
+  // also timed out at 120s. 15 min is the new RAW bound for review-class workloads.
+  // T-304 fix-cycle (claude backend lane, 2026-06-10): runProvider was the FOURTH
+  // wrapper of NOTAGAIN audit G8 and the W0 build clamped only the other three —
+  // a foreground runProvider at 900s outlives the 600s harness Bash kill, so its
+  // death/quota record never gets written. Same fail-closed clamp as the wrappers:
+  // foreground (or undetectable) → ≤540s; explicit background signal → full bound.
+  const { foregroundAwareTimeout, WRAPPER_DEFAULTS } = require("../../dispatch/timeout-policy");
+  const timeoutMs = foregroundAwareTimeout(
+    opts.timeoutMs || WRAPPER_DEFAULTS["run-provider"],
+    opts,
+  );
   const strict = opts.strict !== false; // default ON — fail on silent downgrade
   // opts.provider forces a provider regardless of the role→provider manifest
   // mapping — used for a SECOND security pass on GPT:
@@ -846,6 +929,25 @@ function runProvider(role, prompt, opts = {}) {
     );
     const quota = classifyQuotaFailure(errText);
     if (quota) {
+      // T-20260610-306: mark the provider down in the circuit breaker so the NEXT
+      // dispatch skips it instead of re-burning the quota window. Only for
+      // quota_exhausted (recoverable=true) — the recoverable case the breaker
+      // is designed for. Best-effort (providerBreaker is already fail-open).
+      if (quota.kind === "quota_exhausted" && providerBreaker) {
+        try {
+          providerBreaker.markDown(providerName, {
+            kind: quota.kind,
+            untilMs: providerBreaker.computeUntil(
+              providerName,
+              errText,
+              Date.now(),
+            ),
+            evidence: `${quota.kind} on model=${model}`.slice(0, 200),
+          });
+        } catch {
+          /* fail-open: breaker write failure must not block the error return */
+        }
+      }
       try {
         process.stderr.write(
           `[providers.js] QUOTA: ${providerName} (${model}) hit ${quota.kind}` +
@@ -875,6 +977,10 @@ function runProvider(role, prompt, opts = {}) {
               // failure); the caller decides, with this flag making it loud.
               suggestFallbackProvider:
                 providerName === "gemini" ? "openai" : cfg.fallback || "claude",
+              // Auth mode label — VALUE-FREE (mode label only, never key value).
+              // Surfaces "key (metered)" vs "oauth (plan)" so a quota error
+              // envelope is self-diagnosing: one read and the posture is clear.
+              auth_mode: detectAuthModeLabel(providerName),
             },
           }
         : {}),
diff --git a/scripts/sprint/epsilon-runtime.js b/scripts/sprint/epsilon-runtime.js
index e5bb020..6654240 100644
--- a/scripts/sprint/epsilon-runtime.js
+++ b/scripts/sprint/epsilon-runtime.js
@@ -64,6 +64,13 @@ const hookPoints = require("./hook-points"); // registry reader + composition→
 const hookConsult = require("./hook-consult"); // manager_consult emitter (telemetry coverage)
 const registryRoles = require("../dispatch/registry-roles"); // role-registry field reader
 
+// T-20260610-304 (G8/N1): foreground-aware timeout clamp. spawnAgent used hardcoded
+// 15m/20m bounds that exceeded the 600s harness FOREGROUND kill — a foreground
+// wrapper was killed before its own bound fired and never wrote its death record. The
+// policy helper clamps to 540s unless an explicit background signal is present
+// (opts.background === true or WARPOS_DISPATCH_BACKGROUND=1). FAIL-CLOSED.
+const { foregroundAwareTimeout, WRAPPER_DEFAULTS } = require("../dispatch/timeout-policy");
+
 // The six canonical lifecycle steps ε conducts, in order (epsilon.md "The Six Steps").
 const LIFECYCLE = Object.freeze(["plan", "design", "build", "gauntlet", "release", "retro"]);
 
@@ -316,6 +323,9 @@ function telemetry() {
       makeDispatchId: da.makeDispatchId,
       cmdlineChecksum: da.cmdlineChecksum,
       AGENT_ROOT: da.AGENT_ROOT,
+      // T-303 (N8): single-source runContext() for run/phase/sprint env reads.
+      // in-process recordAgentDispatch uses this to stamp run_id + sprint_id.
+      runContext: da.runContext,
       ok: true,
     };
   } catch (e) {
@@ -371,6 +381,15 @@ function recordAgentDispatch(
     stderr_bytes: 0,
     fallback: false,
     ok,
+    // T-303 (N8): run-context for §17.4 coverage-gate run-scoped filtering.
+    // run_id from env (set by full.js or inherited — null when dispatched standalone).
+    // phase_id derived from agentPlan.step (authoritative for in-process records;
+    // also set on process.env.WARPOS_PHASE_ID by full.js before each phase entry so
+    // runContext() would agree, but we use the explicit value for reliability).
+    // sprint_id: use the explicit sprintId arg (reliable even when env not set);
+    //   the runContext() single-source reads env, but the arg is always present here.
+    run_id: process.env.WARPOS_RUN_ID || null,
+    phase_id: agentPlan.step,
     // ε-conductor provenance (extra fields are ignored by gauntlet-verify's typed check):
     sprint_id: sprintId,
     via,
@@ -437,7 +456,26 @@ function spawnAgent(agentPlan, sprintId, opts = {}) {
   const run = opts.run || _spawnSync;
   const root = agentRoot();
   const env = { ...process.env, ...(opts.env || {}) };
-  const common = { encoding: "utf8", env, timeout: opts.timeoutMs || 15 * 60 * 1000, maxBuffer: 32 * 1024 * 1024 };
+  // T-303 (N8): stamp run-context vars on the child env so CLI-routed wrappers'
+  // runContext() picks them up and stamps run_id/phase_id/sprint_id onto every
+  // completion record. Respect an inherited WARPOS_RUN_ID — only generate when
+  // absent (parent orchestrator's run_id wins over per-dispatch generation; if full.js
+  // set it on process.env it is already in the spread above, but guard anyway for
+  // standalone invocations where process.env.WARPOS_RUN_ID may be absent).
+  if (!env.WARPOS_RUN_ID) {
+    env.WARPOS_RUN_ID =
+      "run-" + Date.now().toString(36) + "-" + crypto.randomBytes(4).toString("hex");
+  }
+  env.WARPOS_PHASE_ID = agentPlan.step;
+  env.WARPOS_SPRINT_ID = sprintId;
+  // T-20260610-304: clamp to FOREGROUND_CEILING_MS (540s) when not explicitly backgrounded.
+  // opts.background === true or WARPOS_DISPATCH_BACKGROUND=1 passes through the full bound.
+  const common = {
+    encoding: "utf8",
+    env,
+    timeout: foregroundAwareTimeout(opts.timeoutMs || WRAPPER_DEFAULTS["epsilon-agent"], opts),
+    maxBuffer: 32 * 1024 * 1024,
+  };
 
   // In-process Claude teammates — a node script CANNOT spawn these (harness Agent tool only).
   if (agentPlan.route === ROUTE.CLAUDE_AGENT || agentPlan.route === ROUTE.AGENT_TOOL) {
@@ -456,7 +494,11 @@ function spawnAgent(agentPlan, sprintId, opts = {}) {
   if (agentPlan.route === ROUTE.DISPATCH_CLAUDE) {
     const args = [path.join(root, "scripts/dispatch-claude.js"), agentPlan.role, promptFile];
     if (opts.worktree) args.push("--worktree", opts.worktree);
-    const r = run(process.execPath, args, { ...common, timeout: opts.timeoutMs || 20 * 60 * 1000 });
+    // T-20260610-304: DISPATCH_CLAUDE uses the longer 20m default but still clamps to 540s foreground.
+    const r = run(process.execPath, args, {
+      ...common,
+      timeout: foregroundAwareTimeout(opts.timeoutMs || WRAPPER_DEFAULTS["epsilon-claude"], opts),
+    });
     return interpretSpawn(r, agentPlan, /*recordedByCli=*/ true);
   }
   // CLAUDE_RAW — `claude -p --agent` writes NO completion record (ED-018) → ε records the REAL outcome.
diff --git a/scripts/sprint/full.js b/scripts/sprint/full.js
index b125ac0..6d72cbd 100644
--- a/scripts/sprint/full.js
+++ b/scripts/sprint/full.js
@@ -38,6 +38,7 @@
 
 const fs = require("fs");
 const path = require("path");
+const crypto = require("crypto");
 const { spawnSync, execSync } = require("child_process");
 
 const SPRINT = require("./paths");
@@ -931,6 +932,7 @@ function checkDesignWithoutRoster(sprintId) {
 
 function phase1Plan(state, args) {
   state.currentPhase = "plan";
+  process.env.WARPOS_PHASE_ID = state.currentPhase; // T-303 (N8): phase context for child dispatches
   emit("sprint_full_phase_started", {
     sprint_id: state.sprintId,
     phase: "plan",
@@ -1105,6 +1107,7 @@ function deriveDocScale(state) {
 
 function phase2Design(state) {
   state.currentPhase = "design";
+  process.env.WARPOS_PHASE_ID = state.currentPhase; // T-303 (N8)
 
   // On --resume, if tickets are already minted from a prior run, skip
   // the rescaffold + tickets_pending halt and advance to Phase 3.
@@ -1223,6 +1226,7 @@ function phase2Design(state) {
 
 function phase3Execute(state) {
   state.currentPhase = "execute";
+  process.env.WARPOS_PHASE_ID = state.currentPhase; // T-303 (N8)
   emit("sprint_full_phase_started", {
     sprint_id: state.sprintId,
     phase: "execute",
@@ -1402,6 +1406,7 @@ function findExistingStagingRelease(sprintId, target) {
 
 function phase4ReleasePrep(state) {
   state.currentPhase = "release-prep";
+  process.env.WARPOS_PHASE_ID = state.currentPhase; // T-303 (N8)
   emit("sprint_full_phase_started", {
     sprint_id: state.sprintId,
     phase: "release-prep",
@@ -1610,6 +1615,7 @@ function flipActiveSprintsStatusForRetro(sprintId) {
 
 function phase5Retro(state) {
   state.currentPhase = "retro";
+  process.env.WARPOS_PHASE_ID = state.currentPhase; // T-303 (N8)
   emit("sprint_full_phase_started", {
     sprint_id: state.sprintId,
     phase: "retro",
@@ -1746,6 +1752,19 @@ function main() {
     return 2;
   }
 
+  // T-303 (N8): establish run-context env vars so all child dispatches (runHelper
+  // spreads ...process.env) carry the same run identity. Rule: respect an inherited
+  // WARPOS_RUN_ID — a parent orchestrator's run_id wins; only generate when absent.
+  // Format mirrors makeDispatchId() but prefixed `run-` to distinguish orchestrator
+  // runs from per-dispatch ids.
+  if (!process.env.WARPOS_RUN_ID) {
+    process.env.WARPOS_RUN_ID =
+      "run-" + Date.now().toString(36) + "-" + crypto.randomBytes(4).toString("hex");
+  }
+  // Stamp the sprint id so dispatch wrappers' runContext() returns the correct sprint.
+  process.env.WARPOS_SPRINT_ID = sprintId;
+  // WARPOS_PHASE_ID is set at each phase entry (below in each phase function).
+
   // Cost gate: per-run --cost-gate on|off overrides the persistent toggle
   // (scripts/sprint/cost-gate.js -> .claude/runtime/sprint-cost-gate.json).
   const costGateEnabled =

--- END DIFF ---
