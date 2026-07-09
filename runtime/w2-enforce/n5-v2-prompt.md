# Cross-family RE-review — N5 quote-aware detection hardening (after gauntlet fixes)

A prior GPT-5.5 review of the N5 route-guard change FAILed with 2 evasions of the raw-claude detection: (HIGH) quoted tokens `"claude"`/`"-p"` bypassed the stripQuoted-regex skeleton; (MED) only the first `--agent` was checked (multi-flag last-wins bypass). FIX: a shared `rawClaudeAgentRoles(cmd)` uses shellWords (tokenizes with quotes stripped → quoted-but-executing tokens are caught; a quoted LITERAL BLOB stays ONE token → no false-positive) and returns EVERY --agent role. Applied to both review + build-chain detectors.

VERIFY: (1) are the 2 prior evasions closed? (2) is there a 3RD evasion of `claude -p --agent <reviewer>` (other quoting, flag ordering, env-prefix, path-to-claude, separators)? (3) any NEW false-positive (a legitimate command now wrongly blocked)? (4) is the quoted-literal-blob false-positive still avoided?

Output JSON: {"verdict":"PASS"|"FAIL","confidence":0..1,"findings":[{"severity":"...","issue":"...","fix":"..."}],"summary":"..."}. blocker/high = FAIL.

---
## THE FIX DIFF
```diff
diff --git a/scripts/hooks/dispatch-route-guard.js b/scripts/hooks/dispatch-route-guard.js
index ab9893dc..da21f208 100644
--- a/scripts/hooks/dispatch-route-guard.js
+++ b/scripts/hooks/dispatch-route-guard.js
@@ -242,37 +242,46 @@ function roleFromAgentFlag(cmd) {
   return null;
 }
 
-function rawBuildChainClaudeRole(cmd, scan) {
-  // Confirm a REAL invocation using the quote-stripped skeleton (so a literal
-  // inside quotes — e.g. `git commit -m "...claude -p --agent builder..."` — does
-  // NOT match). Then extract the role with a QUOTE-AWARE tokenizer over the
-  // ORIGINAL cmd, so a quoted role value (`--agent "builder"`) is captured while a
-  // quoted `"--agent builder"` arg to a DIFFERENT flag is NOT mis-read (reviewer-MEDIUM).
-  if (!/\bclaude\b/.test(scan)) return null; // a claude token (unquoted)
-  if (!/(?:^|\s)-p\b/.test(scan)) return null; // a -p prompt flag (any position)
-  if (!/--agent\b/.test(scan)) return null; // an --agent flag (unquoted)
-  const role = roleFromAgentFlag(cmd);
-  if (!role) return null;
-  // S-7: normalize legacy ids (stub-scaffold → skeleton-builder) before the gate.
-  return BUILD_CHAIN_ROLES.has(normalizeRole(role)) ? role : null;
+// QUOTE-AWARE raw `claude -p --agent <role>` detection (N5 gauntlet HIGH/MED fix).
+// shellWords tokenizes with quotes STRIPPED, so a quoted-but-EXECUTING token like `"claude"` /
+// `"-p"` is caught as a real token — the exact evasion the old stripQuoted-regex skeleton missed
+// (`"claude" -p --agent qa-reviewer` executes raw but the regex saw no `claude`). A quoted LITERAL
+// BLOB (`git commit -m "…claude -p --agent builder…"`) stays ONE token, so `claude`/`--agent` are
+// NOT standalone tokens → it is NOT mis-matched (the false-positive the skeleton existed to avoid is
+// preserved). Returns EVERY --agent role (not just the first) so a `--agent a --agent b` last-wins
+// evasion can't slip a real build/review role past the gate.
+function rawClaudeAgentRoles(cmd) {
+  const words = shellWords(cmd);
+  if (!words.includes("claude")) return [];
+  if (!words.includes("-p")) return [];
+  const roles = [];
+  for (let i = 0; i < words.length; i++) {
+    if (words[i] === "--agent" && i + 1 < words.length) roles.push(words[i + 1].toLowerCase());
+    const m = words[i].match(/^--agent=(.+)$/);
+    if (m) roles.push(m[1].toLowerCase());
+  }
+  return roles;
+}
+
+function rawBuildChainClaudeRole(cmd, _scan) {
+  // S-7: normalize legacy ids (stub-scaffold → skeleton-builder) before the gate. Any of the
+  // command's --agent roles resolving to a build-chain role blocks it (multi-flag evasion safe).
+  const hit = rawClaudeAgentRoles(cmd).find((r) => BUILD_CHAIN_ROLES.has(normalizeRole(r)));
+  return hit || null;
 }
 
 // N5: a raw `claude -p --agent <cross-provider-review-role>` — the recordless review path that
-// must instead use the RECORDED `--review-fallback` lane. Mirrors rawBuildChainClaudeRole exactly
-// (same quote-aware skeleton + extraction); only the role SET differs (REVIEW_ROLES, not BUILD).
-function rawReviewClaudeRole(cmd, scan) {
-  if (!/\bclaude\b/.test(scan)) return null; // a claude token (unquoted)
-  if (!/(?:^|\s)-p\b/.test(scan)) return null; // a -p prompt flag (any position)
-  if (!/--agent\b/.test(scan)) return null; // an --agent flag (unquoted)
-  const role = roleFromAgentFlag(cmd);
-  if (!role) return null;
+// must instead use the RECORDED `--review-fallback` lane. Same quote-aware detection as the
+// build-chain block; only the role SET differs (REVIEW_ROLES, not BUILD).
+function rawReviewClaudeRole(cmd, _scan) {
   // RAW match (deliberately NOT normalizeRole) — match only the CURRENT cross-provider review-role
   // names. normalizeRole would collapse legacy ids (qa→qa-reviewer, redteam→security-reviewer) into
   // the set and double-cover the findAdvisory layer that already guards those scrapped names. The
   // residual (a legacy-name raw dispatch slips past this hard block) is low-risk — the names are
   // scrapped, and findAdvisory still warns on the argv form. (Build-chain normalizes because it has
   // no parallel advisory layer; review does, so it stays raw.)
-  return REVIEW_ROLES.has(role) ? role : null;
+  const hit = rawClaudeAgentRoles(cmd).find((r) => REVIEW_ROLES.has(r));
+  return hit || null;
 }
 
 /**

```
