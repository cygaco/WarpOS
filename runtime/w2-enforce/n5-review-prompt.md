# Cross-family review — E-DISPATCH-SHAPE-001 N5 (route-guard: refuse recordless raw reviewer dispatch)

Independent cross-provider review of a GUARD HOOK change (distribution-sensitive — ships downstream + governs dispatch). Be adversarial: find a way it FALSE-BLOCKS a legitimate dispatch OR FALSE-ALLOWS the recordless reviewer path it targets.

## What it does
The route-guard (`scripts/hooks/dispatch-route-guard.js`) blessed any raw `claude -p --agent <role>` as the documented Claude fallback. Build-chain roles were already blocked (RI-004). N5 adds `rawReviewClaudeRole`: a raw `claude -p --agent <current-cross-provider-reviewer>` (backend/frontend/qa/security-reviewer; registry-derived `kind:reviewer && !claude_pinned`, literal fallback) is now REFUSED and pointed at the recorded W1 lane `node scripts/dispatch-claude.js <role> <prompt-file> --review-fallback`. It matches the role RAW (deliberately NOT normalizeRole) so the existing findAdvisory layer keeps guarding the scrapped legacy ids (qa/redteam/reviewer) — normalizing would double-cover + supersede that advisory.

## Verify specifically
1. Can a LEGITIMATE dispatch be false-blocked? (the recorded `--review-fallback` lane via dispatch-claude.js; `claude -p --agent general-purpose` for dispatch-skill; claude-pinned judges design-quality/visual-review; research/consult roles.)
2. Is the no-normalize choice sound — does it leave a meaningful bypass beyond the acknowledged scrapped-legacy-name residual? Consider quote/flag-order evasions (the guard has shellWords + stripQuoted).
3. Is the registry-derivation fail-open correct (a broken registry read → literal fallback, never crash)?
4. Does it correctly fire ONLY on a real `claude -p --agent <reviewer>` (not a quoted literal in some other arg)?

## Output
JSON: `{"verdict":"PASS"|"FAIL","confidence":0..1,"findings":[{"severity":"blocker"|"high"|"med"|"low","issue":"...","fix":"..."}],"summary":"..."}`. blocker/high = FAIL.

---
## THE DIFF
```diff
diff --git a/scripts/hooks/dispatch-route-guard.js b/scripts/hooks/dispatch-route-guard.js
index de53950d..ab9893dc 100644
--- a/scripts/hooks/dispatch-route-guard.js
+++ b/scripts/hooks/dispatch-route-guard.js
@@ -149,6 +149,41 @@ const BUILD_CHAIN_ROLES = new Set(
     : BUILD_CHAIN_ROLES_LITERAL,
 );
 
+// N5 (W2): cross-provider REVIEW roles dispatched raw via `claude -p --agent <reviewer>` are
+// RECORDLESS — the harness reaps the long call with NO completion record, so gauntlet-verify
+// can't see the review lane (the RI-004/ED-018 wound the build-chain block closes, on the review
+// side). A review role's sanctioned Claude FALLBACK is the RECORDED W1 lane
+// `dispatch-claude.js <role> … --review-fallback` (T-305). So a raw `claude -p --agent
+// <cross-provider-reviewer>` is refused + pointed at that recorded lane. Derived from the registry
+// (kind:reviewer + NOT claude_pinned = the cross-provider reviewers with a fallback lane;
+// design-quality/visual-review are claude-pinned and intentionally EXCLUDED — they keep the raw
+// path) UNION the scrapped legacy ids, with a LOUD literal fallback (fail-open hook).
+// SCOPE NOTE: only the CURRENT cross-provider review-role ids are hard-blocked here. The SCRAPPED
+// legacy ids (reviewer/redteam/compliance/qa) are intentionally NOT included — the existing
+// findAdvisory layer (the $(cat bigfile) argv-overflow warning, memory:claude_fallback_stdin) is
+// the soft guard for those legacy names; hard-blocking them here would double-cover and supersede a
+// deliberate advisory feature. Current names = the ones actually dispatched post-ADR-0007 rename.
+const REVIEW_ROLES_LITERAL = [
+  "backend-reviewer",
+  "frontend-reviewer",
+  "qa-reviewer",
+  "security-reviewer",
+];
+const REVIEW_ROLES = new Set(
+  registryRoles
+    ? registryRoles.deriveOrFallback(
+        () => {
+          const roles = registryRoles.loadRoles();
+          return Object.keys(roles).filter(
+            (k) => roles[k] && roles[k].kind === "reviewer" && !roles[k].claude_pinned,
+          );
+        },
+        REVIEW_ROLES_LITERAL,
+        "dispatch-route-guard.REVIEW_ROLES",
+      )
+    : REVIEW_ROLES_LITERAL,
+);
+
 // Robust detector (reviewer-HIGH hardening): match a RAW `claude` prompt
 // invocation that targets a build-chain role, in ANY flag order and with either
 // `--agent <role>` or `--agent=<role>`. The bounded wrapper
@@ -222,6 +257,24 @@ function rawBuildChainClaudeRole(cmd, scan) {
   return BUILD_CHAIN_ROLES.has(normalizeRole(role)) ? role : null;
 }
 
+// N5: a raw `claude -p --agent <cross-provider-review-role>` — the recordless review path that
+// must instead use the RECORDED `--review-fallback` lane. Mirrors rawBuildChainClaudeRole exactly
+// (same quote-aware skeleton + extraction); only the role SET differs (REVIEW_ROLES, not BUILD).
+function rawReviewClaudeRole(cmd, scan) {
+  if (!/\bclaude\b/.test(scan)) return null; // a claude token (unquoted)
+  if (!/(?:^|\s)-p\b/.test(scan)) return null; // a -p prompt flag (any position)
+  if (!/--agent\b/.test(scan)) return null; // an --agent flag (unquoted)
+  const role = roleFromAgentFlag(cmd);
+  if (!role) return null;
+  // RAW match (deliberately NOT normalizeRole) — match only the CURRENT cross-provider review-role
+  // names. normalizeRole would collapse legacy ids (qa→qa-reviewer, redteam→security-reviewer) into
+  // the set and double-cover the findAdvisory layer that already guards those scrapped names. The
+  // residual (a legacy-name raw dispatch slips past this hard block) is low-risk — the names are
+  // scrapped, and findAdvisory still warns on the argv form. (Build-chain normalizes because it has
+  // no parallel advisory layer; review does, so it stays raw.)
+  return REVIEW_ROLES.has(role) ? role : null;
+}
+
 /**
  * Walk the command string and find the first forbidden pattern. Returns null
  * when the command is safe.
@@ -338,6 +391,18 @@ function findForbiddenSegment(rawSeg) {
     };
   }
 
+  // N5 (W2): a raw `claude -p --agent <cross-provider-reviewer>` is RECORDLESS (the same reap, on
+  // the review side). The sanctioned Claude fallback for a review role is the RECORDED W1 lane.
+  const rawReviewRole = rawReviewClaudeRole(cmd, scan);
+  if (rawReviewRole) {
+    return {
+      pattern: `claude -p --agent ${rawReviewRole}`,
+      detail:
+        "raw `claude -p --agent <reviewer>` is RECORDLESS — the harness reaps the long call with no completion record, so gauntlet-verify can't see the review lane (N5/W2). A review role's sanctioned Claude fallback is the RECORDED `--review-fallback` lane (T-305).",
+      use: `node scripts/dispatch-claude.js ${rawReviewRole} <prompt-file> --review-fallback`,
+    };
+  }
+
   // Pipe-into-provider: `cat foo.txt | codex exec …` / `… | gemini -p` etc.
   // Checked BEFORE the canonical exemption so a wrapper invocation that pipes its
   // result INTO a raw provider (`node dispatch-claude.js … | codex exec`) is still
@@ -397,9 +462,11 @@ function findForbiddenSegment(rawSeg) {
         };
       }
     }
-    // A `claude -p --agent <role>` for a BUILD-CHAIN role was already caught
-    // (and blocked) by rawBuildChainClaudeRole at the top. Non-build claude
-    // --agent roles fall through → allowed.
+    // A `claude -p --agent <role>` for a BUILD-CHAIN role was already caught by
+    // rawBuildChainClaudeRole, and a CROSS-PROVIDER REVIEW role by rawReviewClaudeRole
+    // (N5), both above. The remaining --agent roles — general-purpose (dispatch-skill),
+    // claude-pinned judges (design-quality/visual-review), research/consult — fall
+    // through → allowed (no recorded-fallback lane to redirect them to).
   }
 
   return null;

```
