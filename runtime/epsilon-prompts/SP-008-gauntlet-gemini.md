# REVIEW — SP-20260610-008 dreamteam guard batch (gemini lane), canonical WarpOS

Two fixes (diff base ba61a2f → f9986c3): (1) W-26: scope-contract-guard now PARSES the scopeContract block (balanced-brace JSON.parse) instead of substring-matching; EMPTY allowedFiles:[] → loud actionable block; unparseable-but-present → fail-CLOSED block; absent/non-empty behavior golden-locked unchanged; guard self-crash → fail-open exit 0. (2) W-14: removed the dead project-local paths.portfolioRegistry key from the SOURCE registry (consumer already home-resolves ~/.warpos/portfolio.json and never read the key) + lintRules.critical hard-blocks future refs.

ATTACK: this guard fires on EVERY build-chain dispatch — false-block = bricked builds. (a) Can a LEGIT scopeContract shape (nested braces, arrays of globs, quoted strings with braces, unicode) fail the balanced-brace extraction and get fail-CLOSED blocked? (b) Can a crafted prompt SMUGGLE an empty allowedFiles past the parser (whitespace/unicode-escapes/duplicate keys)? (c) Does fail-open-on-guard-crash create a bypass (deliberately crash the guard to skip scope enforcement)? (d) W-14: any consumer/code path still referencing portfolioRegistry that now breaks (the lint rule should catch — verify the rule itself can't false-positive on prose)?
OUTPUT: fenced JSON envelope {"verdict":"PASS|FAIL","blockers":[{"file":"...","line":"...","issue":"...","severity":"blocker|major|minor"}],"notes":"<=300 chars"}

--- BEGIN DIFF ---diff --git a/framework/paths.registry.json b/framework/paths.registry.json
index c189137..8333744 100644
--- a/framework/paths.registry.json
+++ b/framework/paths.registry.json
@@ -1021,8 +1021,9 @@
       "owner": "project",
       "mutable": true,
       "introducedIn": "0.9.0",
+      "removedIn": "0.21.0",
       "docsToken": "paths.portfolioRegistry",
-      "_note": "Canonical product registry (warpos/portfolio-registry/v1). One entry per portfolio product. Consumed by every /portfolio:* skill via scripts/portfolio/registry.js. Sprint SP-20260521-001 / S-1 + S-2."
+      "_note": "DEPRECATED (T-20260611-309): this project-local path was always dead — the real registry is HOME-anchored at ~/.warpos/portfolio.json. The consumer (scripts/portfolio/registry.js#registryPath()) resolves via os.homedir() and does NOT use this paths key. Removed from generated output so nothing can resolve to the dead .claude/portfolio/registry.yaml. Sprint SP-20260521-001 / S-1 + S-2."
     },
     "briefsRoot": {
       "path": "_docs/briefs",
@@ -1268,6 +1269,11 @@
         "match": "docs\\/03-requirement-standards\\/",
         "suggestion": "requirements/_standards/ (or paths.requirementsRoot)",
         "why": "Phase 1 final-A: docs/03-requirement-standards → requirements/_standards"
+      },
+      {
+        "match": "\\.claude\\/portfolio\\/registry\\.yaml",
+        "suggestion": "~/.warpos/portfolio.json (HOME-anchored); consumer: scripts/portfolio/registry.js#registryPath()",
+        "why": "T-20260611-309: this project-local path was always dead; real registry is home-anchored, resolved by the consumer via os.homedir()"
       }
     ],
     "_critical_doc": "Above are paths that resolve to NOTHING in the current layout (or to-be-current after Phase 1 final-A). Lint exits 1 on any hit.",
diff --git a/scripts/hooks/lib/paths.generated.js b/scripts/hooks/lib/paths.generated.js
index f0aacb8..c4b9964 100644
--- a/scripts/hooks/lib/paths.generated.js
+++ b/scripts/hooks/lib/paths.generated.js
@@ -129,7 +129,6 @@ const PATHS = {
   "providerAutofixLib": path.join(PROJECT, "scripts", "warpos", "lib", "provider-autofix.js"),
   "reasoningFrameworks": path.join(PROJECT, ".claude", "project", "reference", "reasoning-frameworks.md"),
   "portfolioHome": path.join(PROJECT, ".claude", "portfolio"),
-  "portfolioRegistry": path.join(PROJECT, ".claude", "portfolio", "registry.yaml"),
   "briefsRoot": path.join(PROJECT, "_docs", "briefs"),
   "clonesRoot": path.join(PROJECT, "_docs", "clones"),
   "testInstallMatrix": path.join(PROJECT, "scripts", "warpos", "test-install-matrix.js"),
diff --git a/scripts/hooks/scope-contract-guard.js b/scripts/hooks/scope-contract-guard.js
index d014130..953eec3 100644
--- a/scripts/hooks/scope-contract-guard.js
+++ b/scripts/hooks/scope-contract-guard.js
@@ -81,6 +81,46 @@ function hasScopeContract(prompt) {
   return /scopeContract|allowedFiles|forbiddenFiles|File Scope|In-scope files/i.test(prompt || "");
 }
 
+/**
+ * extractScopeContract — locate + parse the scopeContract JSON block from a prompt.
+ *
+ * Supported embedding shapes:
+ *   ## scopeContract\n{...}
+ *   scopeContract: {...}
+ *   scopeContract\n{...}
+ *
+ * Returns:
+ *   { found: false }                  — "scopeContract" keyword not present in prompt
+ *   { found: true, parsed: <object> } — located + JSON.parsed successfully
+ *   { found: true, parsed: null }     — located but JSON is malformed/unbalanced
+ */
+function extractScopeContract(prompt) {
+  const p = prompt || "";
+  // Match "scopeContract" followed by optional whitespace/colon and then an opening brace.
+  const m = /scopeContract[\s:]*(\{)/i.exec(p);
+  if (!m) return { found: false };
+
+  // Walk forward from the opening brace, tracking brace depth to find the closing brace.
+  const start = m.index + m[0].length - 1; // position of '{'
+  let depth = 0;
+  for (let i = start; i < p.length; i++) {
+    if (p[i] === "{") depth++;
+    else if (p[i] === "}") {
+      depth--;
+      if (depth === 0) {
+        const json = p.slice(start, i + 1);
+        try {
+          return { found: true, parsed: JSON.parse(json) };
+        } catch {
+          return { found: true, parsed: null };
+        }
+      }
+    }
+  }
+  // Unbalanced / truncated — malformed.
+  return { found: true, parsed: null };
+}
+
 let input = "";
 process.stdin.setEncoding("utf8");
 process.stdin.on("data", (c) => (input += c));
@@ -100,10 +140,44 @@ process.stdin.on("end", () => {
       );
       process.exit(2);
     }
+
+    // hasScopeContract matched — now parse the scopeContract block if present.
+    // Only inspect the structured scopeContract block (not bare allowedFiles/forbiddenFiles
+    // tokens); if the keyword wasn't found, keep existing pass-through behavior.
+    const sc = extractScopeContract(prompt);
+    if (sc.found) {
+      if (sc.parsed === null) {
+        // Located but JSON is malformed — fail-closed (contract problem, not a guard bug).
+        console.log(
+          JSON.stringify({
+            decision: "block",
+            reason: "scope-contract-guard: scopeContract present but unparseable — refusing (declare a parseable allowedFiles/forbiddenFiles).",
+          }),
+        );
+        process.exit(2);
+      }
+      const allowedFiles = sc.parsed.allowedFiles;
+      const forbiddenFiles = sc.parsed.forbiddenFiles;
+      const hasEmptyAllowed = Array.isArray(allowedFiles) && allowedFiles.length === 0;
+      const hasForbidden = Array.isArray(forbiddenFiles) && forbiddenFiles.length > 0;
+      if (hasEmptyAllowed && !hasForbidden) {
+        // Empty allowedFiles with no forbiddenFiles — this silently blocks ALL writes.
+        console.log(
+          JSON.stringify({
+            decision: "block",
+            reason: "scope-contract-guard: scopeContract has an EMPTY allowedFiles:[] — this blocks ALL builder writes. Declare the file(s) you intend to write in allowedFiles, or use forbiddenFiles to blocklist instead.",
+          }),
+        );
+        process.exit(2);
+      }
+      // Non-empty allowedFiles OR non-empty forbiddenFiles (blocklist mode) → pass.
+    }
+    // If !sc.found: hasScopeContract matched on a non-scopeContract token
+    // (e.g. bare "allowedFiles", "File Scope") — keep existing pass-through behavior.
   } catch {
     process.exit(0);
   }
   process.exit(0);
 });
 
-module.exports = { hasScopeContract, resolveRole, isBuildChain, BUILD_CHAIN };
+module.exports = { hasScopeContract, extractScopeContract, resolveRole, isBuildChain, BUILD_CHAIN };
diff --git a/scripts/hooks/scope-contract-guard.test.js b/scripts/hooks/scope-contract-guard.test.js
new file mode 100644
index 0000000..58812f1
--- /dev/null
+++ b/scripts/hooks/scope-contract-guard.test.js
@@ -0,0 +1,162 @@
+#!/usr/bin/env node
+/**
+ * scope-contract-guard.test.js — planted-violation tests for the parse+loud-empty+
+ * fail-closed-unparseable additions (T-20260611-308).
+ *
+ * Exit 0 = all pass. Exit 1 = at least one failure.
+ */
+"use strict";
+
+const { spawnSync } = require("child_process");
+const path = require("path");
+
+const GUARD = path.join(__dirname, "scope-contract-guard.js");
+
+function run(fixture) {
+  const result = spawnSync(process.execPath, [GUARD], {
+    input: JSON.stringify(fixture),
+    encoding: "utf8",
+    timeout: 10000,
+  });
+  return { exit: result.status ?? -1, stdout: result.stdout || "" };
+}
+
+function makeDispatch(role, prompt) {
+  return {
+    tool_name: "Agent",
+    cwd: ".",
+    tool_input: { subagent_type: role, prompt },
+  };
+}
+
+let passed = 0;
+let failed = 0;
+
+function assert(name, result, expectedExit, expectedReasonContains) {
+  const { exit, stdout } = result;
+  let ok = exit === expectedExit;
+  if (ok && expectedReasonContains) {
+    ok = stdout.includes(expectedReasonContains);
+  }
+  if (ok) {
+    console.log(`  PASS  ${name}`);
+    passed++;
+  } else {
+    console.error(
+      `  FAIL  ${name} — got exit=${exit} stdout=${stdout.trim().slice(0, 200)}`,
+    );
+    if (expectedReasonContains && !stdout.includes(expectedReasonContains)) {
+      console.error(`        expected stdout to include: ${expectedReasonContains}`);
+    }
+    failed++;
+  }
+}
+
+// ─── Core planted-violation: empty allowedFiles, no forbiddenFiles ─────────
+// TODAY this would PASS (substring "allowedFiles" is present). After the fix it BLOCKS.
+assert(
+  "empty allowedFiles, no forbiddenFiles → LOUD BLOCK [planted]",
+  run(
+    makeDispatch(
+      "builder",
+      'Build this.\n\n## scopeContract\n{"allowedFiles":[]}\n',
+    ),
+  ),
+  2,
+  "EMPTY allowedFiles",
+);
+
+// ─── Blocklist mode: empty allowedFiles WITH non-empty forbiddenFiles → ALLOW ─
+assert(
+  "empty allowedFiles + forbiddenFiles → ALLOW (blocklist mode)",
+  run(
+    makeDispatch(
+      "backend-builder",
+      'Build this.\n\nscopeContract: {"allowedFiles":[],"forbiddenFiles":["package.json","README.md"]}\n',
+    ),
+  ),
+  0,
+  null,
+);
+
+// ─── Normal non-empty allowedFiles → ALLOW ─────────────────────────────────
+assert(
+  "non-empty allowedFiles → ALLOW (golden)",
+  run(
+    makeDispatch(
+      "frontend-builder",
+      'Build this.\n\nscopeContract: {"allowedFiles":["src/lib/types.ts"],"forbiddenFiles":[]}\n',
+    ),
+  ),
+  0,
+  null,
+);
+
+// ─── scopeContract present but malformed → fail-closed BLOCK ───────────────
+assert(
+  "malformed scopeContract → fail-closed BLOCK",
+  run(
+    makeDispatch(
+      "builder",
+      "Build this.\n\nscopeContract: {allowedFiles: [broken json here\n",
+    ),
+  ),
+  2,
+  "unparseable",
+);
+
+// ─── No scopeContract at all, build-chain role → BLOCK (existing) ──────────
+assert(
+  "no scopeContract, build-chain role → BLOCK (existing behavior)",
+  run(makeDispatch("builder", "Build this feature. No scope info at all.")),
+  2,
+  null,
+);
+
+// ─── Non-build-chain role → exit 0 (guard doesn't apply) ───────────────────
+assert(
+  "non-build-chain role (researcher) → exit 0 (existing behavior)",
+  run(makeDispatch("researcher", "Research this topic. No scope info.")),
+  0,
+  null,
+);
+
+// ─── Response-hook event (tool_response present) → exit 0 ──────────────────
+// The guard only fires on dispatch events, not response events.
+assert(
+  "response-hook event → exit 0 (not a dispatch)",
+  run({
+    tool_name: "Agent",
+    cwd: ".",
+    tool_input: { subagent_type: "builder", prompt: "build" },
+    tool_response: '{"ok":true}',
+  }),
+  0,
+  null,
+);
+
+// ─── allowedFiles with multiple entries → ALLOW ────────────────────────────
+assert(
+  "allowedFiles with multiple entries → ALLOW",
+  run(
+    makeDispatch(
+      "security-builder",
+      'Build this.\n\nscopeContract: {"allowedFiles":["src/a.ts","src/b.ts"],"forbiddenFiles":[]}\n',
+    ),
+  ),
+  0,
+  null,
+);
+
+// ─── Guard crash case: malformed event JSON → fail-open exit 0 ─────────────
+// The outer try/catch in the guard ensures a guard BUG never blocks.
+assert(
+  "malformed event JSON → fail-open exit 0 (guard bug safety)",
+  run("NOT JSON AT ALL {{{"),
+  0,
+  null,
+);
+
+// ─── Summary ────────────────────────────────────────────────────────────────
+console.log(`\nResults: ${passed} passed, ${failed} failed`);
+process.exit(failed > 0 ? 1 : 0);
diff --git a/scripts/path-lint.rules.generated.json b/scripts/path-lint.rules.generated.json
index 3bff4d3..6df6044 100644
--- a/scripts/path-lint.rules.generated.json
+++ b/scripts/path-lint.rules.generated.json
@@ -141,6 +141,11 @@
       "match": "docs\\/03-requirement-standards\\/",
       "suggestion": "requirements/_standards/ (or paths.requirementsRoot)",
       "why": "Phase 1 final-A: docs/03-requirement-standards → requirements/_standards"
+    },
+    {
+      "match": "\\.claude\\/portfolio\\/registry\\.yaml",
+      "suggestion": "~/.warpos/portfolio.json (HOME-anchored); consumer: scripts/portfolio/registry.js#registryPath()",
+      "why": "T-20260611-309: this project-local path was always dead; real registry is home-anchored, resolved by the consumer via os.homedir()"
     }
   ],
   "warn": [
diff --git a/scripts/portfolio/registry-path.test.js b/scripts/portfolio/registry-path.test.js
new file mode 100644
index 0000000..fd5894c
--- /dev/null
+++ b/scripts/portfolio/registry-path.test.js
@@ -0,0 +1,117 @@
+#!/usr/bin/env node
+"use strict";
+
+/**
+ * scripts/portfolio/registry-path.test.js
+ *
+ * Planted-violation test for T-20260611-309.
+ *
+ * Asserts:
+ *  1. registry.js#registryPath() resolves to ~/.warpos/portfolio.json
+ *     (home-anchored, NOT project-local).
+ *  2. The dead project-local path .claude/portfolio/registry.yaml is
+ *     NEVER what registryPath() returns.
+ *  3. paths.json (generated) does NOT contain a portfolioRegistry key
+ *     (the key was removed via removedIn so nothing can resolve the dead path).
+ *  4. WARPOS_PORTFOLIO_REGISTRY env-var override is honoured by registryPath().
+ *
+ * Exit 0 = all assertions pass.
+ * Exit 1 = at least one failure (failures printed to stderr).
+ */
+
+const path = require("path");
+const os = require("os");
+const assert = require("assert");
+
+const ROOT = path.resolve(__dirname, "..", "..");
+const { registryPath } = require("./registry");
+
+let passed = 0;
+let failed = 0;
+
+function test(name, fn) {
+  try {
+    fn();
+    console.log(`  ok  ${name}`);
+    passed++;
+  } catch (err) {
+    console.error(`  FAIL  ${name}`);
+    console.error(`        ${err.message}`);
+    failed++;
+  }
+}
+
+// ── 1. Default resolution is HOME-anchored ────────────────────────────────
+test("registryPath() resolves to ~/.warpos/portfolio.json", () => {
+  // Ensure no env override is active for this assertion
+  const saved = process.env.WARPOS_PORTFOLIO_REGISTRY;
+  delete process.env.WARPOS_PORTFOLIO_REGISTRY;
+  try {
+    const resolved = registryPath();
+    const expected = path.join(os.homedir(), ".warpos", "portfolio.json");
+    assert.strictEqual(
+      resolved,
+      expected,
+      `Expected ${expected}, got ${resolved}`,
+    );
+  } finally {
+    if (saved !== undefined) process.env.WARPOS_PORTFOLIO_REGISTRY = saved;
+  }
+});
+
+// ── 2. Dead project-local path is NEVER returned ──────────────────────────
+test("registryPath() does NOT point at dead .claude/portfolio/registry.yaml", () => {
+  const saved = process.env.WARPOS_PORTFOLIO_REGISTRY;
+  delete process.env.WARPOS_PORTFOLIO_REGISTRY;
+  try {
+    const resolved = registryPath();
+    const deadPath = path.join(ROOT, ".claude", "portfolio", "registry.yaml");
+    assert.notStrictEqual(
+      resolved,
+      deadPath,
+      `registryPath() must not resolve to the dead project-local path ${deadPath}`,
+    );
+    // Also assert the resolved path contains the user's home dir
+    assert.ok(
+      resolved.startsWith(os.homedir()),
+      `Expected path to start with homedir ${os.homedir()}, got ${resolved}`,
+    );
+  } finally {
+    if (saved !== undefined) process.env.WARPOS_PORTFOLIO_REGISTRY = saved;
+  }
+});
+
+// ── 3. paths.json has no portfolioRegistry key (key removed via removedIn) ─
+test("paths.json does not contain portfolioRegistry (dead path removed from generated output)", () => {
+  const pathsJson = require(path.join(ROOT, ".claude", "paths.json"));
+  assert.strictEqual(
+    pathsJson.portfolioRegistry,
+    undefined,
+    `Expected paths.portfolioRegistry to be undefined (removed), got ${pathsJson.portfolioRegistry}`,
+  );
+});
+
+// ── 4. WARPOS_PORTFOLIO_REGISTRY env override is honoured ─────────────────
+test("WARPOS_PORTFOLIO_REGISTRY env-var override is honoured by registryPath()", () => {
+  const override = path.join(os.tmpdir(), "test-portfolio.json");
+  const saved = process.env.WARPOS_PORTFOLIO_REGISTRY;
+  process.env.WARPOS_PORTFOLIO_REGISTRY = override;
+  try {
+    const resolved = registryPath();
+    assert.strictEqual(
+      resolved,
+      path.resolve(override),
+      `Expected env override ${path.resolve(override)}, got ${resolved}`,
+    );
+  } finally {
+    if (saved !== undefined) {
+      process.env.WARPOS_PORTFOLIO_REGISTRY = saved;
+    } else {
+      delete process.env.WARPOS_PORTFOLIO_REGISTRY;
+    }
+  }
+});
+
+// ── Summary ───────────────────────────────────────────────────────────────
+console.log(`\n${passed} passed, ${failed} failed`);
+process.exit(failed > 0 ? 1 : 0);

--- END DIFF ---
