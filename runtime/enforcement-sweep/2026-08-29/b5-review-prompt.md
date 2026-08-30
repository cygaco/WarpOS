# SP-20260829-001 — bundle B5 — CROSS-PROVIDER REVIEW

You are reviewing a bundle whose entire purpose is to make a gate green. That is the reason to read it hard.

## THE INVARIANT YOU ARE ASKED TO ATTACK

> **A seal records a tree's current state as expected. It is the one operation in this sprint that can turn a defect into policy — because after it, the gate goes green *because* the defect is now expected.**

Your job is not to confirm the bundle. Your job is to find out whether anything became expected that should have been repaired, disclosed or contested. **Assume the bundle is competent and still wrong**, and go looking for where.

Specifically, try to build a case for each of these, and report honestly if you cannot:

1. **A site was absorbed rather than triaged.** Something appears in the emitted baseline that no human read and no row explains, and its presence alone now silences the gate.
2. **A disposition was assigned from something other than a read of the site.** A quote that is a paraphrase; a quote lifted from a header that does not describe the branch in question; a disposition that follows from what would make the gate green rather than from what the code does.
3. **A number is true of nothing.** A count, a coverage figure or a phrasing string that does not derive from an emitted set present in the artifacts, or that was true before the bundle and is not true after it.
4. **A green was obtained by moving the thing being measured** rather than by fixing the thing being measured.
5. **A "could not check" was resolved into a pass** anywhere — in the code, in a row, in the envelope, or by silence.

## THE RULE THE BUNDLE IS BOUND BY — verbatim

- **S6-1 TRUTH** — never satisfiable by mechanism evidence or an approval chain. No sentence this sprint ships is false read against the code it describes — enforcer output, registry, close report, AND ED ROWS (the secret-guard mechanism error is the live example: a true finding with a false mechanism is a defect here).
- **S6-2 GRANULARITY (keystone)** — every coverage claim names its unit and emits its set; no bare count without the per-item table it derives from; the count-form family reviewed by reading, not lint; closure only by a named property or an emitted exhaustive extension over a stated finite domain.
- **S6-3 INSTRUMENT CEILING** — every claim resting on the lexer carries its ceiling at the point of claim; the enumeration is "what this instrument at <sha> finds, limits named", never "the population"; 65 explicitly withdrawn. *Pre-committed: the lexer HAVING a ceiling is NOT a defect; S6-3 governs the claim, never the capability.*
- **S6-4 POLARITY PROVENANCE** — per-site `manual-by-read` or `tool-derived`, never blended; manual dispositions quote the site's decision semantics; contested → fails closed.
- **S6-5 FALSIFIERS OBSERVED AT THE CLOSE** — each executed fooling input becomes a near-miss fixture, observed RED against the built lexer, no-op⇒FAIL guard, re-run at the qualifying close against the predicate AS BUILT (P-118).
- **S6-6 THE ENFORCER CAN FAIL** — demonstrated BY EXECUTION to fail on a registry member regressing and on a new untriaged site; asserted-not-demonstrated fails (ED-374 turned on this sprint's own output).
- **S6-7 RESIDUALS TRAVEL** — emitted by name with ledger ids. A residual named in a spec does not satisfy a criterion requiring it recorded or shipped.

**S6-3 cuts both ways and you must apply it correctly: the instrument HAVING a ceiling is NOT a defect.** A finding that amounts to "the scanner cannot see everything" is not a finding. A finding that the bundle *claimed* more than the instrument can support is.

## HOW TO WORK

Everything you need is inlined below this section — the bundle's commits, its diff, its envelope, and the enforcer's committed output from BEFORE the bundle existed. **Read the pre-state first**, then the diff, then the envelope, in that order. The envelope is the bundle's own account of itself; treat it as a claim to be checked against the diff, never as a description of the diff.

Where the bundle reports having executed something, check whether the artifact of that execution is present. **An exit code stated in prose is a claim; an exit code beside the command that produced it is evidence.** If a demonstration is asserted and not shown, that is a finding under S6-6, and the rule says asserted-not-demonstrated fails.

## VERDICT

Return strict JSON, nothing before or after it:

```json
{
  "verdict": "pass" | "warn" | "fail",
  "findings": [
    {
      "id": "F-1",
      "severity": "high" | "medium" | "low",
      "rule": "S6-1 | S6-2 | S6-3 | S6-4 | S6-6 | S6-7 | other",
      "claim": "the sentence, value or line you are contesting, quoted",
      "why_wrong": "what you read that makes it wrong, with the quote you read it from",
      "confidence": "certain | probable | possible"
    }
  ],
  "attacks_attempted": [
    { "attack": "one of the five above, or your own", "outcome": "found | not found", "what_i_checked": "..." }
  ],
  "could_not_check": ["by name — files, sites, or claims you were unable to verify, and why"]
}
```

`could_not_check` being empty is itself a claim, and this sprint exists because gates swallow "could not check" into "pass". If you could not verify something, name it there rather than omitting it or grading it generously.

**Your verdict is binding. Do not soften a finding because the bundle is otherwise good work, and do not manufacture one because a reviewer is expected to find something.** If the five attacks all come back "not found" and you can say what you checked, `pass` is the honest answer and you should give it.

---

# THE BUNDLE

Repository: WarpOS. Bundle B5, built in a worktree detached at `06669fbe`. Two commits:

- `128cf0af` — the seal (this is the one that would land).
- `51d70d42` — HELD, a separate repair commit, not part of the seal.

The three generated manifest files (.claude/framework-manifest.json, .claude/framework-installed.json, _warpos/MANIFEST.json) are excluded from the diff below: they are machine-regenerated hash records, not authored content. Two large captured audit JSONs under runtime/enforcement-sweep/2026-08-29/b5/ are also excluded for length; they are raw scanner output committed as evidence.

## PRE-STATE — the enforcer at `06669fbe`, BEFORE this bundle existed

Observed exit code: 1.

```json
{
  "status": "blocked",
  "exitCode": 1,
  "coverage": {
    "detector_sha": "8eaec242",
    "M": 88,
    "N": 8,
    "triaged_not_enforced": 1,
    "K": 79,
    "uncorrelated_registry_defects": 3,
    "phrasing": "8 of the 88 sites the detector at 8eaec242 enumerated are under enforcement, 79 untriaged (1 further baseline site(s) are triaged non-enforced [not-a-defect/not-a-gate]; 3 registry defect row(s) have no live-detector counterpart at this sha — see gate-failclosed-registry.json's tool_correlation_note)."
  },
  "regressed": [],
  "checked_repaired_count": 0,
  "new_entrants": [
    "scripts/hooks/ownership-guard.js:146",
    "scripts/hooks/retro-presence-check.js:108",
    "scripts/hooks/retro-presence-check.js:70"
  ],
  "live_files_scanned": 951,
  "live_files_unreadable": [],
  "live_detector_sha": "06669fbe",
  "baseline_detector_sha": "8eaec242",
  "baseline_site_count": 88,
  "registry_row_count": 13
}
```

## THE DIFF (scripts/ only, both commits, 06669fbe..51d70d42)

```diff
diff --git a/scripts/checks/gate-failclosed-baseline.json b/scripts/checks/gate-failclosed-baseline.json
index 32dda93f..002f92ec 100644
--- a/scripts/checks/gate-failclosed-baseline.json
+++ b/scripts/checks/gate-failclosed-baseline.json
@@ -1,13 +1,13 @@
 {
   "schema_version": 1,
   "sprint": "SP-20260829-001",
-  "bundle": "B2 -> re-emitted by B2prime",
-  "purpose": "Emitted, committed SET of site identifiers known to scripts/checks/gate-failclosed-audit.js at capture time. Anchor convention: file + ':' + finding.line, i.e. the detector's OWN line (the permissive statement inside the catch handler), NOT gate-failclosed-registry.json's catch-line convention -- the two files use different, explicitly-stated anchors and are cross-referenced by tool_finding_line in the registry, not by string equality of site_id. This baseline is never auto-appended by the enforcer; growing it requires an explicit committed edit. RE-EMITTED by bundle B2-prime after the nested-try scan-continuation fix in gate-failclosed-audit.js (findCatchHandlers() no longer skips its scan cursor past an already-matched outer try/catch own span) moved detector_sha and grew the emitted set from 78 to 88 sites. This is expected and is exactly what an instrument-bound figure means: the number is a property of THIS detector version at THIS sha over THIS scanned tree, not a population count. Re-emitted via the identical capture method (runAudit(scripts) from gate-failclosed-audit.js, findings mapped to file+colon+finding.line, sorted).",
-  "detector_sha": "8eaec242",
+  "bundle": "B2 -> re-emitted by B2prime -> re-emitted by B5 (seal) -> re-emitted by B5-R (HELD)",
+  "purpose": "Emitted, committed SET of site identifiers known to scripts/checks/gate-failclosed-audit.js at capture time. Anchor convention: file + ':' + finding.line, i.e. the detector's OWN line (the permissive statement inside the catch handler), NOT gate-failclosed-registry.json's catch-line convention -- the two files use different, explicitly-stated anchors and are cross-referenced by tool_finding_line in the registry, not by string equality of site_id. This baseline is never auto-appended by the enforcer; growing it requires an explicit committed edit. RE-EMITTED by bundle B5 (commit 128cf0af) after bundles B3 (registry-defect-row repairs in scripts/hooks/dependency-admission-guard.js, gate-check.js, ownership-guard.js, retro-presence-check.js, secret-guard.js, version-bump-guard.js, worktree-preflight.js) and B4 (scripts/sprint/design.js, scripts/sprint/fs.js, scripts/check/install.js) landed on this branch without a baseline re-emission, which is exactly why gate-failclosed-enforcer.js blocked at the pin 06669fbe with 3 new_entrants (see runtime/enforcement-sweep/2026-08-29/pin-06669fbe/enforcer-at-06669fbe.json, committed by a prior evidence commit, read-only, not touched by this bundle). B5 read all 3 named new entrants by hand: two (scripts/hooks/retro-presence-check.js:70 and :108) are the SAME two sites this registry already tracked, now visible post-nested-try-fix and shifted by B3's own edits -- not new code; one (scripts/hooks/ownership-guard.js:146) was a real, previously-untriaged, still-unrepaired site (the outer 'Graceful failure' catch-all), shifted from the prior baseline's untriaged scripts/hooks/ownership-guard.js:138 by B3's unrelated +8-line edit earlier in the same file. RE-EMITTED AGAIN by the HELD commit B5-R, in the same worktree, immediately after B5-R repaired that one remaining defect (scripts/hooks/ownership-guard.js's outer catch, unconditional process.exit(0) -> unconditional process.exit(2)) -- site_count dropped 79 -> 78, that one id removed, nothing else changed; see gate-failclosed-registry.json's ownership-guard.js:144 row for the disposition update. Across both re-emissions site_count dropped from the pre-B5 88 to 78: 12 sites left with B5 (11 registry-tracked B3 repairs; scripts/sprint/design.js:194, a B4 could-not-check-track repair outside this registry's originally-seeded 13 rows, correctly not re-added since the detector no longer finds it) and 1 more left with B5-R (ownership-guard.js:146/144, this bundle's own repair). This is expected and is exactly what an instrument-bound figure means: the number is a property of THIS detector version at THIS sha over THIS scanned tree, not a population count. Re-emitted via the identical capture method (runAudit(scripts) from gate-failclosed-audit.js, findings mapped to file+colon+finding.line, sorted).",
+  "detector_sha": "128cf0af",
   "root_scanned": "scripts",
-  "files_scanned": 949,
+  "files_scanned": 951,
   "files_unreadable": [],
-  "site_count": 88,
+  "site_count": 78,
   "site_ids": [
     "scripts/check-guard-promotion.js:159",
     "scripts/check-guard-promotion.js:257",
@@ -24,7 +24,6 @@
     "scripts/hooks/beta-gate.js:271",
     "scripts/hooks/boss-boundary.js:98",
     "scripts/hooks/compact-saver.js:34",
-    "scripts/hooks/dependency-admission-guard.js:34",
     "scripts/hooks/dispatch-route-guard.js:755",
     "scripts/hooks/edit-watcher.js:675",
     "scripts/hooks/edit-watcher.js:898",
@@ -35,7 +34,6 @@
     "scripts/hooks/foundation-guard.js:82",
     "scripts/hooks/framework-manifest-guard.js:230",
     "scripts/hooks/framework-manifest-guard.js:323",
-    "scripts/hooks/gate-check.js:182",
     "scripts/hooks/learning-validator.js:75",
     "scripts/hooks/ledger-presence-guard.js:43",
     "scripts/hooks/ledger-presence-guard.js:65",
@@ -44,8 +42,6 @@
     "scripts/hooks/lint.js:91",
     "scripts/hooks/memory-guard.js:376",
     "scripts/hooks/merge-guard.js:641",
-    "scripts/hooks/ownership-guard.js:138",
-    "scripts/hooks/ownership-guard.js:67",
     "scripts/hooks/path-guard.js:245",
     "scripts/hooks/path-registry-guard.js:149",
     "scripts/hooks/path-registry-guard.js:77",
@@ -55,12 +51,11 @@
     "scripts/hooks/region-marker-guard.js:194",
     "scripts/hooks/requirement-format-guard.js:230",
     "scripts/hooks/response-size-guard.js:155",
-    "scripts/hooks/retro-presence-check.js:51",
-    "scripts/hooks/retro-presence-check.js:82",
+    "scripts/hooks/retro-presence-check.js:108",
+    "scripts/hooks/retro-presence-check.js:70",
     "scripts/hooks/save-session-lint.js:42",
     "scripts/hooks/save-session-lint.js:88",
     "scripts/hooks/scope-contract-guard.js:193",
-    "scripts/hooks/secret-guard.js:95",
     "scripts/hooks/self-mod-governance.js:27",
     "scripts/hooks/session-end-team-teardown.js:123",
     "scripts/hooks/session-end-team-teardown.js:86",
@@ -88,14 +83,9 @@
     "scripts/hooks/typecheck.js:53",
     "scripts/hooks/ui-lint.js:83",
     "scripts/hooks/untrusted-content-firewall.js:45",
-    "scripts/hooks/version-bump-guard.js:102",
-    "scripts/hooks/version-bump-guard.js:137",
-    "scripts/hooks/version-bump-guard.js:161",
-    "scripts/hooks/worktree-preflight.js:161",
     "scripts/lint-json-bom.js:53",
     "scripts/portfolio/open.js:71",
     "scripts/research/openai-extract.js:18",
-    "scripts/sprint/design.js:194",
     "scripts/teams/lifecycle.js:685"
   ]
 }
diff --git a/scripts/checks/gate-failclosed-registry.json b/scripts/checks/gate-failclosed-registry.json
index ac606380..c35116bf 100644
--- a/scripts/checks/gate-failclosed-registry.json
+++ b/scripts/checks/gate-failclosed-registry.json
@@ -1,22 +1,24 @@
 {
   "schema_version": 1,
   "sprint": "SP-20260829-001",
-  "bundle": "B2",
+  "bundle": "B2 -> post-repair disposition + new-entrant triage by B5",
   "site_unit_definition": "A site is the line on which the `catch` clause that receives a thrown error on a path the gate's decision depends on BEGINS (the `catch` keyword's own line — 'catch-line' below). This is a deliberately different anchor than scripts/checks/gate-failclosed-audit.js's own finding.line, which reports the line of the PERMISSIVE STATEMENT (process.exit(0) or the success-shaped return) inside the handler body, not the catch clause itself. Every row below states both: `line` (this registry's catch-line convention) and `tool_finding_line` (the detector's own anchor, when tool_correlated is true).",
-  "tool_correlation_note": "4 of the 13 seeded rows (edit-watcher.js:674, gate-check.js:48-52, retro-presence-check.js:50, ownership-guard.js:66) have NO counterpart in scripts/checks/gate-failclosed-audit.js's live findings at the sha below, despite each being a real, directly-read catch clause reaching a permissive outcome. Cause (independently confirmed by re-reading all 4): each is a try/catch NESTED inside the body of an OUTER try whose own catch the detector already matched. gate-failclosed-audit.js's findCatchHandlers() sets `tryRe.lastIndex = handlerEnd + 1` after emitting the outer pair, which skips re-entering the outer try's BODY for a nested `\\btry\\b` occurrence that sits before that jump target. This is a real detector blind spot on nested try/catch that is NOT enumerated in the module's own stated CEILING_TEXT (closest existing bullet, 'general reachability e.g. a catch that sets a flag and falls through to a LATER, separate exit/return site', describes a different failure shape — a later SIBLING site, not an earlier NESTED one). Reported here, not fixed — gate-failclosed-audit.js is an existing check and out of this bundle's scope.",
+  "tool_correlation_note": "Historical note from B2 (kept for provenance, now partially stale): 4 of the 13 rows seeded by B2 (edit-watcher.js:674, gate-check.js:48-52, retro-presence-check.js:50, ownership-guard.js:66) had NO counterpart in gate-failclosed-audit.js's live findings at B2's own sha (f3c6f51f...), each a try/catch NESTED inside an outer try's already-matched span. That nested-try scan-continuation defect in findCatchHandlers() was FIXED by bundle B2' (see gate-failclosed-audit.js's CEILING_TEXT), before B3 or B5 ran. B5 (this bundle) re-read all 4 of those sites against the current tree (06669fbe, post-B3-repair): gate-check.js:48-52 and ownership-guard.js:66 are now genuinely fixed (their permissive statements are gone, replaced by a rethrow / an unconditional exit(2) — no live tool counterpart is possible for either, by construction, not by remaining blind spot). retro-presence-check.js:50 IS now tool-visible post-fix, at its current shifted line 58/anchor 70 (see that row) — the nested-try blind spot no longer applies to it. edit-watcher.js:674 remains genuinely uncorrelated (not-a-gate, a PostToolUse hook with no admit/deny decision — the tool's pattern-match simply has nothing polarity-relevant to find there, independent of the nested-try fix).",
+  "b5_new_entrant_disposition_note": "gate-failclosed-enforcer.js reported 3 new_entrants at pin 06669fbe (scripts/hooks/ownership-guard.js:146, scripts/hooks/retro-presence-check.js:70, scripts/hooks/retro-presence-check.js:108) relative to the un-re-emitted 8eaec242-sha baseline. B5 read all 3 by hand, each against the CURRENT file content: the two retro-presence-check.js sites are the SAME sites this registry already tracked at old lines 50/81, now visible post-nested-try-fix and shifted to 58/96 (catch-line) by B3's own +N-line edits earlier in the same catches — not new code, and B3 already repaired the actual defect at each (the enforce-mode fail-open) while intentionally retaining a policy/mode-gated exit(0) fallback (see each row's decision_semantics_quote). The ownership-guard.js site is genuinely different: B3's own diff added 8 lines earlier in the file (repairing an unrelated, separate inner catch at line 66) which shifted this file's OTHER, untouched, still-permissive outer catch-all from old line 138 (already present, untriaged, in the pre-B5 baseline) down to 146 — B3 never touched this second catch. Read by hand, it is a live, unrepaired defect (see its row below); B5 prepares its repair as a separate HELD commit (B5-R), not part of the seal.",
   "rows": [
     {
       "site_id": "scripts/hooks/dependency-admission-guard.js:33",
       "file": "scripts/hooks/dependency-admission-guard.js",
       "line": 33,
-      "disposition": "defect",
+      "disposition": "not-a-defect",
       "polarity_provenance": "manual-by-read",
-      "decision_semantics_quote": "Blocks package.json dependency additions without an admission record.",
+      "decision_semantics_quote": "this gate blocks package.json dependency additions without an admission record — restrictive = block (exit 2). A payload-parse or checkPackageEdit() failure is \"could not evaluate this edit\", never \"nothing to admit\" (that path already exits 0 explicitly above, outside this catch). Fail closed rather than silently admitting an unreviewed dependency.",
       "instrument": "manual-by-read",
-      "sha": "f3c6f51f3a900bfe350cba9afc08e5e78344e1a2",
-      "expected_finding": "present",
-      "tool_correlated": true,
-      "tool_finding_line": 34
+      "sha": "06669fbe",
+      "expected_finding": "absent",
+      "tool_correlated": false,
+      "tool_finding_line": null,
+      "b5_note": "B3 repair (1960c670): unconditional `process.exit(0)` replaced with an unconditional `process.exit(2)` plus a block-shaped console.log. Verified by execution: siteStillPermissive(cwd, {file, line:33}) -> {checked:true, permissive:false}. No live tool counterpart is possible (nothing permissive remains in the handler)."
     },
     {
       "site_id": "scripts/hooks/edit-watcher.js:674",
@@ -45,135 +47,158 @@
       "tool_finding_line": 898
     },
     {
-      "site_id": "scripts/hooks/gate-check.js:181",
+      "site_id": "scripts/hooks/gate-check.js:190",
       "file": "scripts/hooks/gate-check.js",
-      "line": 181,
-      "disposition": "defect",
+      "line": 190,
+      "disposition": "not-a-defect",
       "polarity_provenance": "manual-by-read",
-      "decision_semantics_quote": "PreToolUse hook: enforces dependency-based gating for builder agents. Blocks builder dispatch if dependency features have not passed evaluation.",
+      "decision_semantics_quote": "this gate's decision is \"block builder dispatch if dependency features haven't passed evaluation\" — restrictive = block (exit 2). Every remaining throw reaching here (payload parse at L144, a rethrown present-but-corrupt store from loadStore(), or a checkDeps() failure reading a malformed store) is \"could not evaluate the gate\", never \"nothing to gate\" (those paths already exit 0 explicitly above, outside this catch) — fail closed.",
       "instrument": "manual-by-read",
-      "sha": "f3c6f51f3a900bfe350cba9afc08e5e78344e1a2",
-      "expected_finding": "present",
-      "tool_correlated": true,
-      "tool_finding_line": 182
+      "sha": "06669fbe",
+      "expected_finding": "absent",
+      "tool_correlated": false,
+      "tool_finding_line": null,
+      "b5_note": "Formerly site_id gate-check.js:181 (statement was at old line 182). B3 repair (1960c670) replaced the outer catch's unconditional `process.exit(0)` with an unconditional `process.exit(2)`. Line shifted 181->190 because loadStore()'s own catch (see next row) grew earlier in the same function. Verified by execution: siteStillPermissive -> {checked:true, permissive:false}."
     },
     {
-      "site_id": "scripts/hooks/gate-check.js:48-52",
+      "site_id": "scripts/hooks/gate-check.js:57",
       "file": "scripts/hooks/gate-check.js",
-      "line": 48,
-      "disposition": "defect",
+      "line": 57,
+      "disposition": "not-a-defect",
       "polarity_provenance": "manual-by-read",
-      "decision_semantics_quote": "PreToolUse hook: enforces dependency-based gating for builder agents. Blocks builder dispatch if dependency features have not passed evaluation. (loadStore() at lines 37-53 backs that decision; its inner try at 48-52 swallows a JSON.parse failure and `return null`s the store — not the {ok:true}/process.exit(0) shape gate-failclosed-audit.js's analyzeHandler() pattern-matches for, but a bare `null` store return that downstream callers of loadStore() read the same way a missing dependency-gate would: nothing to enforce against, so the dispatch proceeds.)",
+      "decision_semantics_quote": "ED-379-class: partition ENOENT (store legitimately absent — the caller's existing \"could not read store.json, allowing dispatch\" WARNING path is the intended skip) from present-but-unreadable/corrupt (a store integrity failure on the very path this gate's decision depends on) — rethrow the latter so the outer catch can fail closed instead of silently returning the same `null` for both.",
       "instrument": "manual-by-read",
-      "sha": "f3c6f51f3a900bfe350cba9afc08e5e78344e1a2",
-      "expected_finding": "present",
+      "sha": "06669fbe",
+      "expected_finding": "absent",
       "tool_correlated": false,
-      "tool_finding_line": null
+      "tool_finding_line": null,
+      "b5_note": "Formerly site_id gate-check.js:48-52 (loadStore()'s inner try/catch, a nested-try-blind-spot site at B2's sha). B3 repair (1960c670) replaced the bare `catch { return null; }` with an ENOENT-partitioned `catch (e) { if (e && e.code === \"ENOENT\") return null; throw e; }` — `return null` never matched analyzeHandler()'s {ok:true}/process.exit(0) patterns even before the fix, and the rethrow path now correctly reaches the outer catch (previous row) for a real fail-closed exit(2). Verified by execution: siteStillPermissive(cwd, {file, line:57}) -> {checked:true, permissive:false}."
     },
     {
       "site_id": "scripts/hooks/ownership-guard.js:66",
       "file": "scripts/hooks/ownership-guard.js",
       "line": 66,
-      "disposition": "defect",
+      "disposition": "not-a-defect",
       "polarity_provenance": "manual-by-read",
-      "decision_semantics_quote": "PreToolUse hook: blocks edits to files owned by other features. Reads FILE-OWNERSHIP from store.json to determine who owns what.",
+      "decision_semantics_quote": "ED-379-class: existence was already confirmed at the fs.existsSync check above — this is a present-but-unreadable/corrupt store, not the legitimate \"no store = can't enforce, allow\" absent-store skip. Fail closed: a corrupt ownership record must not silently permit an out-of-scope edit.",
       "instrument": "manual-by-read",
-      "sha": "f3c6f51f3a900bfe350cba9afc08e5e78344e1a2",
-      "expected_finding": "present",
+      "sha": "06669fbe",
+      "expected_finding": "absent",
       "tool_correlated": false,
-      "tool_finding_line": null
+      "tool_finding_line": null,
+      "b5_note": "B3 repair (1960c670): unconditional `process.exit(0)` replaced with a stderr message plus unconditional `process.exit(2)`. Catch-line unchanged at 66 (fix is entirely inside the handler body). Verified by execution: siteStillPermissive -> {checked:true, permissive:false}. This is a DIFFERENT catch than the still-unrepaired outer catch-all later in the same file — see scripts/hooks/ownership-guard.js:144 below, a new row, not this one."
     },
     {
-      "site_id": "scripts/hooks/retro-presence-check.js:50",
-      "file": "scripts/hooks/retro-presence-check.js",
-      "line": 49,
-      "disposition": "defect",
+      "site_id": "scripts/hooks/ownership-guard.js:144",
+      "file": "scripts/hooks/ownership-guard.js",
+      "line": 144,
+      "disposition": "not-a-defect",
       "polarity_provenance": "manual-by-read",
-      "decision_semantics_quote": "Stop hook (HYGIENE Rule 64 — retro-completeness). If a session is ending on a skeleton-test<N> branch AND retros/<N>/RETRO.md does not exist, surface the gap. ... enforced: ... Exits 2 and blocks session close until /oneshot:retro is run.",
+      "decision_semantics_quote": "this is the OUTER catch, wrapping the entire handler — including the initial `JSON.parse(input)` payload parse above and every other read in this function. This gate's own decision is \"block edits to files owned by other features\" — restrictive = block (exit 2). A malformed hook payload, a PATHS/paths.json read failure, or any other unexpected exception reaching here means ownership could not be verified — \"could not check\", never \"nothing to check\" (the absent-store skip and the no-owner-in-store warn path already exit 0 explicitly, above, outside this catch). Fail closed rather than silently allowing an edit whose ownership was never actually checked.",
       "instrument": "manual-by-read",
-      "sha": "f3c6f51f3a900bfe350cba9afc08e5e78344e1a2",
-      "expected_finding": "present",
+      "sha": "06669fbe",
+      "expected_finding": "absent",
       "tool_correlated": false,
       "tool_finding_line": null,
-      "seed_note": "Seeded line was 50 (the process.exit(0) statement itself, inside `catch { process.exit(0); }` at 49-51). This is the one seeded row whose given line is the STATEMENT line, not this registry's catch-line convention (49) — kept as originally seeded (50) per this bundle's directive not to silently overwrite a seeded value; both anchors point at the same site."
+      "b5_note": "NEW ROW (B5), REPAIRED by B5-R (HELD commit, same worktree). At triage time (commit 128cf0af) this was the file's OUTER catch — `} catch {\\n  // Graceful failure\\n  process.exit(0);\\n}` (lines 144-147) — wrapping the entire stdin.on(\"end\") handler, including the initial JSON.parse(input) payload parse (line 36) and every subsequent read, with no ENOENT/absent-input partition the way the sibling catch at line 66 has. Untouched by B3 (B3's diff to this file only touched lines 63-70, the inner store-parse catch); its old baseline site_id was ownership-guard.js:138 (untriaged, never a registry row before B5) and shifted to :146 purely because B3's unrelated +8-line edit sits earlier in the same file. B5-R replaced the unconditional `process.exit(0)` with a stderr message plus unconditional `process.exit(2)`, the same shape as B3's repair to this file's other catch. Verified by execution: siteStillPermissive(cwd, {file, line:144}) -> {checked:true, permissive:false}. HELD pending a ruling on whether this repair belongs in this phase — see the B5-R commit body and runtime/enforcement-sweep/2026-08-29/b5/ENVELOPE.md."
     },
     {
-      "site_id": "scripts/hooks/retro-presence-check.js:81",
+      "site_id": "scripts/hooks/retro-presence-check.js:58",
       "file": "scripts/hooks/retro-presence-check.js",
-      "line": 81,
-      "disposition": "defect",
+      "line": 58,
+      "disposition": "not-a-defect",
       "polarity_provenance": "manual-by-read",
-      "decision_semantics_quote": "Stop hook (HYGIENE Rule 64 — retro-completeness). ... enforced: ... Exits 2 and blocks session close until /oneshot:retro is run.",
+      "decision_semantics_quote": "this is a RUNNER failure (git unavailable/errored), not an absent-input case. Under an explicit enforce flag, a runner failure must block (we cannot rule out being on a skeleton branch with a missing retro); under default advisory mode this hook never blocks by design, so skip is the mode-consistent behavior.",
       "instrument": "manual-by-read",
-      "sha": "f3c6f51f3a900bfe350cba9afc08e5e78344e1a2",
+      "sha": "06669fbe",
       "expected_finding": "present",
       "tool_correlated": true,
-      "tool_finding_line": 82
+      "tool_finding_line": 70,
+      "b5_note": "Formerly site_id retro-presence-check.js:50 (catch-line was 49; nested-try-blind-spot at B2's sha, since fixed by B2'). B3 repair (1960c670) added an `if (enforce) { ...; process.exit(2); }` branch before the pre-existing unconditional `process.exit(0)` fallback, fixing the real defect (enforce mode silently skipping on a runner failure) while intentionally retaining the exit(0) fallback for default advisory mode, by the file's own explicit two-mode design (see file header, lines 6-11). The retained exit(0) is what the live detector now finds at line 70 (also the source of this bundle's 3rd reported new_entrant — same site, not new). disposition is not-a-defect because the exit(0) path is reached only when !enforce, matching this hook's own documented advisory-mode contract; expected_finding stays \"present\" because that reachable permissive path is retained by design, not eliminated."
+    },
+    {
+      "site_id": "scripts/hooks/retro-presence-check.js:96",
+      "file": "scripts/hooks/retro-presence-check.js",
+      "line": 96,
+      "disposition": "not-a-defect",
+      "polarity_provenance": "manual-by-read",
+      "decision_semantics_quote": "Same governance ruling as the branch-detection catch above: enforce mode fails closed on a runner failure (paths.json read is already its own inner try with a safe fallback, so what reaches here is a real unexpected error); advisory mode's by-design non-blocking nature makes skip the mode-consistent behavior.",
+      "instrument": "manual-by-read",
+      "sha": "06669fbe",
+      "expected_finding": "present",
+      "tool_correlated": true,
+      "tool_finding_line": 108,
+      "b5_note": "Formerly site_id retro-presence-check.js:81 (catch-line was 81; already tool_correlated at old anchor 82). B3 repair (1960c670) added the same `if (enforce) { ...; process.exit(2); }` branch before this outer catch's pre-existing unconditional `process.exit(0)` fallback. The retained exit(0) (reached only when !enforce) is what the live detector now finds at line 108 (this bundle's other reported new_entrant — same site, shifted by B3's own edit, not new). Same disposition reasoning as the sibling row above."
     },
     {
       "site_id": "scripts/hooks/secret-guard.js:94",
       "file": "scripts/hooks/secret-guard.js",
       "line": 94,
-      "disposition": "defect",
+      "disposition": "not-a-defect",
       "polarity_provenance": "manual-by-read",
-      "decision_semantics_quote": "PreToolUse hook: blocks writes that contain secrets or credentials. Catches API keys, tokens, passwords before they hit disk.",
+      "decision_semantics_quote": "this catch's only reachable causes are JSON.parse(input) failing (L9) or a property read on a non-object payload — both \"could not check\" on a credential guard's own decision path, never \"nothing to check\" (the absent-input L15 and .env-skip L18 paths already exit 0 explicitly, outside this catch). Fail closed: an unparseable payload must not let a secret slip through unscanned.",
       "instrument": "manual-by-read",
-      "sha": "f3c6f51f3a900bfe350cba9afc08e5e78344e1a2",
-      "expected_finding": "present",
-      "tool_correlated": true,
-      "tool_finding_line": 95
+      "sha": "06669fbe",
+      "expected_finding": "absent",
+      "tool_correlated": false,
+      "tool_finding_line": null,
+      "b5_note": "B3 repair (1960c670): unconditional `process.exit(0)` replaced with a stderr message plus unconditional `process.exit(2)`. Catch-line unchanged at 94. Verified by execution: siteStillPermissive -> {checked:true, permissive:false}."
     },
     {
-      "site_id": "scripts/hooks/version-bump-guard.js:101",
+      "site_id": "scripts/hooks/version-bump-guard.js:108",
       "file": "scripts/hooks/version-bump-guard.js",
-      "line": 101,
-      "disposition": "defect",
+      "line": 108,
+      "disposition": "not-a-defect",
       "polarity_provenance": "manual-by-read",
-      "decision_semantics_quote": "Refuses (or warns) when `git commit` stages framework-prefix files while version.json#version already has a minted capsule under framework/releases/<version>/. The semantic check: \"did you change framework code without bumping the version since the last capsule mint?\"",
+      "decision_semantics_quote": "ED-379-class: shared fail-closed path for this gate's three read/parse failure sites (payload parse, version.json read, git diff exec). This gate's own decision is \"refuse (or warn) when framework files are staged against an already-capsuled version\" — restrictive side = act as though that condition held, resolved through the SAME warn/block policy mode computeEffectiveMode() already uses for the normal detection path, so a read failure never silently produces a *stronger* fail-open guarantee than a successful detection would under the same policy.",
       "instrument": "manual-by-read",
-      "sha": "f3c6f51f3a900bfe350cba9afc08e5e78344e1a2",
+      "sha": "06669fbe",
       "expected_finding": "present",
-      "tool_correlated": true,
-      "tool_finding_line": 102
+      "tool_correlated": false,
+      "tool_finding_line": null,
+      "b5_note": "Formerly site_id version-bump-guard.js:101 (statement was at old line 102: an unconditional `process.exit(0)`). B3 repair (1960c670) replaced every direct catch-body exit with a call to the shared failClosed(project, reason) function, which itself exits 2 under policy mode \"block\" and exits 0 under policy mode \"warn\" (the file's own documented default/legitimate mode — see its header's \"Fail-open conditions\" list). The reachable permissive outcome is retained, by design, gated on policy — not eliminated — so disposition is not-a-defect and expected_finding stays \"present\" (matching the same reasoning as the retro-presence-check.js rows). No live tool counterpart: the exit(0) now lives inside failClosed()'s own body, a plain function the catch merely calls, not a process.exit(0) written directly inside this handler — outside gate-failclosed-audit.js's per-catch-body scan (stated ceiling: it does not do cross-function control-flow analysis)."
     },
     {
-      "site_id": "scripts/hooks/version-bump-guard.js:136",
+      "site_id": "scripts/hooks/version-bump-guard.js:171",
       "file": "scripts/hooks/version-bump-guard.js",
-      "line": 136,
-      "disposition": "defect",
+      "line": 171,
+      "disposition": "not-a-defect",
       "polarity_provenance": "manual-by-read",
-      "decision_semantics_quote": "Refuses (or warns) when `git commit` stages framework-prefix files while version.json#version already has a minted capsule under framework/releases/<version>/. The semantic check: \"did you change framework code without bumping the version since the last capsule mint?\"",
+      "decision_semantics_quote": "ED-379-class: shared fail-closed path for this gate's three read/parse failure sites (payload parse, version.json read, git diff exec). This gate's own decision is \"refuse (or warn) when framework files are staged against an already-capsuled version\" — restrictive side = act as though that condition held, resolved through the SAME warn/block policy mode computeEffectiveMode() already uses for the normal detection path, so a read failure never silently produces a *stronger* fail-open guarantee than a successful detection would under the same policy.",
       "instrument": "manual-by-read",
-      "sha": "f3c6f51f3a900bfe350cba9afc08e5e78344e1a2",
+      "sha": "06669fbe",
       "expected_finding": "present",
-      "tool_correlated": true,
-      "tool_finding_line": 137
+      "tool_correlated": false,
+      "tool_finding_line": null,
+      "b5_note": "Formerly site_id version-bump-guard.js:136 (statement was at old line 137). Same failClosed() repair and same not-a-defect/present reasoning as the sibling row above (version-bump-guard.js:108). DISCLOSED INSTRUMENT-CEILING HAZARD, checked by execution and NOT relied upon: had this row instead been marked expected_finding=\"absent\", gate-failclosed-enforcer.js's siteStillPermissive() bounded 12-line window from line 171 would span into an UNRELATED, legitimate, pre-existing skip two functions away — `if (!version || typeof version !== \"string\") return process.exit(0);` at line 177 — and falsely report this row as regressed (verified: siteStillPermissive(cwd,{file,line:171}) -> {checked:true, permissive:true}). This is a naive-window false positive on unrelated code, not a real regression of this catch; recorded here and in the bundle envelope rather than worked around by choosing a `line` that doesn't match the catch's own opening line."
     },
     {
-      "site_id": "scripts/hooks/version-bump-guard.js:160",
+      "site_id": "scripts/hooks/version-bump-guard.js:198",
       "file": "scripts/hooks/version-bump-guard.js",
-      "line": 160,
-      "disposition": "defect",
+      "line": 198,
+      "disposition": "not-a-defect",
       "polarity_provenance": "manual-by-read",
-      "decision_semantics_quote": "Refuses (or warns) when `git commit` stages framework-prefix files while version.json#version already has a minted capsule under framework/releases/<version>/. The semantic check: \"did you change framework code without bumping the version since the last capsule mint?\"",
+      "decision_semantics_quote": "ED-379-class: shared fail-closed path for this gate's three read/parse failure sites (payload parse, version.json read, git diff exec). This gate's own decision is \"refuse (or warn) when framework files are staged against an already-capsuled version\" — restrictive side = act as though that condition held, resolved through the SAME warn/block policy mode computeEffectiveMode() already uses for the normal detection path, so a read failure never silently produces a *stronger* fail-open guarantee than a successful detection would under the same policy.",
       "instrument": "manual-by-read",
-      "sha": "f3c6f51f3a900bfe350cba9afc08e5e78344e1a2",
+      "sha": "06669fbe",
       "expected_finding": "present",
-      "tool_correlated": true,
-      "tool_finding_line": 161
+      "tool_correlated": false,
+      "tool_finding_line": null,
+      "b5_note": "Formerly site_id version-bump-guard.js:160 (statement was at old line 161). Same failClosed() repair and same not-a-defect/present reasoning as the two sibling rows above. Same DISCLOSED INSTRUMENT-CEILING HAZARD as version-bump-guard.js:171: siteStillPermissive()'s 12-line window from line 198 spans into an unrelated, legitimate `if (staged.length === 0) return process.exit(0);` at line 205 (verified: siteStillPermissive(cwd,{file,line:198}) -> {checked:true, permissive:true}). Not relied upon; expected_finding kept \"present\" on the same site-accuracy grounds as the sibling row, not to route around the window."
     },
     {
       "site_id": "scripts/hooks/worktree-preflight.js:160",
       "file": "scripts/hooks/worktree-preflight.js",
       "line": 160,
-      "disposition": "defect",
+      "disposition": "not-a-defect",
       "polarity_provenance": "manual-by-read",
-      "decision_semantics_quote": "PreToolUse hook (Agent matcher): infrastructure health check before builder dispatch. ... Exit 0 = allow, Exit 2 = block",
+      "decision_semantics_quote": "ED-379-class: \"Exit 0 = allow, Exit 2 = block\" (this file's own header). A failure anywhere on this path (payload parse at L102, orphan-cleanup fs/git errors) means Step 2's smoke-marker check was never reached — could-not-check, not nothing-to-check. Fail closed rather than silently allowing a builder dispatch this session never actually smoke-tested.",
       "instrument": "manual-by-read",
-      "sha": "f3c6f51f3a900bfe350cba9afc08e5e78344e1a2",
-      "expected_finding": "present",
-      "tool_correlated": true,
-      "tool_finding_line": 161
+      "sha": "06669fbe",
+      "expected_finding": "absent",
+      "tool_correlated": false,
+      "tool_finding_line": null,
+      "b5_note": "B3 repair (1960c670): unconditional `process.exit(0)` replaced with a stderr message plus unconditional `process.exit(2)`. Catch-line unchanged at 160. Verified by execution: siteStillPermissive -> {checked:true, permissive:false}."
     }
   ]
 }
diff --git a/scripts/hooks/ownership-guard.js b/scripts/hooks/ownership-guard.js
index 1bdec7ae..5d76866b 100644
--- a/scripts/hooks/ownership-guard.js
+++ b/scripts/hooks/ownership-guard.js
@@ -141,8 +141,20 @@ process.stdin.on("end", () => {
         `Only modify files in your own feature scope.\n`,
     );
     process.exit(2);
-  } catch {
-    // Graceful failure
-    process.exit(0);
+  } catch (e) {
+    // ED-379-class: this is the OUTER catch, wrapping the entire handler —
+    // including the initial `JSON.parse(input)` payload parse above and
+    // every other read in this function. This gate's own decision is
+    // "block edits to files owned by other features" — restrictive = block
+    // (exit 2). A malformed hook payload, a PATHS/paths.json read failure,
+    // or any other unexpected exception reaching here means ownership could
+    // not be verified — "could not check", never "nothing to check" (the
+    // absent-store skip and the no-owner-in-store warn path already exit 0
+    // explicitly, above, outside this catch). Fail closed rather than
+    // silently allowing an edit whose ownership was never actually checked.
+    process.stderr.write(
+      `BLOCKED: ownership-guard could not evaluate this edit (${e && e.message ? e.message : "unknown error"}) — failing closed; file ownership could not be verified.\n`,
+    );
+    process.exit(2);
   }
 });
```

## THE BUNDLE'S OWN ENVELOPE — its account of itself, to be checked against the diff above

# B5 — SEAL — Envelope

Worktree `.worktrees/b5-seal`, detached, pin `06669fbe`.

## Commits

- `128cf0af` — `build(SP-20260829-001 B5): re-emit the baseline at the current detector, triage the new entrants by read, restore repaired-row correlation` — **the seal**, not held.
- `51d70d42` — `HELD(SP-20260829-001 B5-R): fail-closed repair of ownership-guard.js's outer catch-all, found by B5's new-entrant triage` — **HELD**, separate, pending a ruling on whether it belongs in this phase.

## Every disposition assigned (emitted table, S6-2)

14 registry rows total (13 seeded by B2 + 1 new by B5). Provenance is `manual-by-read` for all 14 (S6-4). Quotes below are truncated to their first clause for table width — full quotes are in `scripts/checks/gate-failclosed-registry.json`'s `decision_semantics_quote` field per row, verbatim.

| site_id | disposition | expected_finding | tool_correlated | quote (first clause, full text in registry) |
|---|---|---|---|---|
| dependency-admission-guard.js:33 | not-a-defect (was: defect) | absent | false | "this gate blocks package.json dependency additions without an admission record — restrictive = block (exit 2)..." |
| edit-watcher.js:674 | not-a-gate (unchanged) | present | false | "a PostToolUse hook fires after the tool action already completed and cannot admit or deny it..." |
| edit-watcher.js:897 | not-a-gate (unchanged) | present | true (→898) | same as above |
| gate-check.js:190 (was :181) | not-a-defect (was: defect) | absent | false | "this gate's decision is \"block builder dispatch if dependency features haven't passed evaluation\"..." |
| gate-check.js:57 (was :48-52) | not-a-defect (was: defect) | absent | false | "ED-379-class: partition ENOENT (store legitimately absent...) from present-but-unreadable/corrupt..." |
| ownership-guard.js:66 | not-a-defect (was: defect) | absent | false | "ED-379-class: existence was already confirmed at the fs.existsSync check above — this is a present-but-unreadable/corrupt store..." |
| ownership-guard.js:144 | **NEW ROW** → not-a-defect (triaged as: defect, then repaired by B5-R same worktree) | absent | false | "this is the OUTER catch, wrapping the entire handler... A malformed hook payload... means ownership could not be verified..." |
| retro-presence-check.js:58 (was :50) | not-a-defect (was: defect) | present | true (→70) | "this is a RUNNER failure (git unavailable/errored), not an absent-input case. Under an explicit enforce flag, a runner failure must block..." |
| retro-presence-check.js:96 (was :81) | not-a-defect (was: defect) | present | true (→108) | "Same governance ruling as the branch-detection catch above..." |
| secret-guard.js:94 | not-a-defect (was: defect) | absent | false | "this catch's only reachable causes are JSON.parse(input) failing (L9)..." |
| version-bump-guard.js:108 (was :101) | not-a-defect (was: defect) | **present** | false | "ED-379-class: shared fail-closed path for this gate's three read/parse failure sites... resolved through the SAME warn/block policy mode..." |
| version-bump-guard.js:171 (was :136) | not-a-defect (was: defect) | **present** | false | same as above |
| version-bump-guard.js:198 (was :160) | not-a-defect (was: defect) | **present** | false | same as above |
| worktree-preflight.js:160 | not-a-defect (was: defect) | absent | false | "ED-379-class: \"Exit 0 = allow, Exit 2 = block\" (this file's own header)..." |

Every "not-a-defect/absent" row above (8 of them: dependency-admission-guard:33, gate-check:57+190, ownership-guard:66+144, secret-guard:94, worktree-preflight:160, and B5-R's own ownership-guard:144 confirmed twice) was verified by **executing** `siteStillPermissive()` directly, not asserted — printed `{checked:true, permissive:false}` for every one. See each row's `b5_note` in the registry for the exact command result.

**The 3 sites the enforcer named as new_entrants at the pin, triaged by read (S6-4, no pre-judged grouping):**
1. `ownership-guard.js:146` (→144 catch-line) — **defect**, real, previously-untriaged, unrepaired (the outer "Graceful failure" catch-all, no ENOENT/absent-input partition, swallows the initial payload-parse too). Old baseline had it untriaged at `:138`; B3's unrelated earlier edit in the same file shifted it to `:146`. Repaired in HELD commit B5-R.
2. `retro-presence-check.js:70` (→58 catch-line) — **not-a-defect**. Same site this registry already tracked at old `:50`, now tool-visible post nested-try-fix, shifted by B3's own repair. B3 already fixed the real defect (enforce-mode silently allowing on a runner failure); the retained `exit(0)` is the intentional advisory-mode fallback (file header, lines 6-11).
3. `retro-presence-check.js:108` (→96 catch-line) — **not-a-defect**, same reasoning, sibling catch.

**Instrument-ceiling disclosure (S6-3), version-bump-guard.js's 3 rows (108/171/198):** these route through a shared `failClosed()` helper that itself still exits 0 under policy mode "warn" (the file's own documented default). The permissive path is *retained by design*, not eliminated — `expected_finding` kept "present", not "absent". This was empirically checked, not assumed: had `171`/`198` instead been marked "absent", `siteStillPermissive()`'s naive 12-line window from those lines spans into an UNRELATED, legitimate `return process.exit(0);` two statements later (line 177, resp. 205) and reports a **false regression** — verified by direct execution:
```
node -e 'require("./scripts/checks/gate-failclosed-enforcer.js").siteStillPermissive(process.cwd(),{file:"scripts/hooks/version-bump-guard.js",line:171})'
→ {"checked":true,"permissive":true,"reason":null}   (false positive, confirmed by read: the actual catch has no exit(0))
```
Not routed around by choosing a non-catch-line `line`; disclosed in the registry row's `b5_note` instead.

## Enforcer's full JSON on the sealed tree (verbatim, B5's own commit 128cf0af)

```json
{
  "status": "ok",
  "exitCode": 0,
  "coverage": {
    "detector_sha": "06669fbe",
    "M": 79,
    "N": 1,
    "triaged_not_enforced": 3,
    "K": 75,
    "uncorrelated_registry_defects": 0,
    "phrasing": "1 of the 79 sites the detector at 06669fbe enumerated are under enforcement, 75 untriaged (3 further baseline site(s) are triaged non-enforced [not-a-defect/not-a-gate]; 0 registry defect row(s) have no live-detector counterpart at this sha — see gate-failclosed-registry.json's tool_correlation_note)."
  },
  "regressed": [],
  "checked_repaired_count": 6,
  "new_entrants": [],
  "live_files_scanned": 951,
  "live_files_unreadable": [],
  "live_detector_sha": "06669fbe",
  "baseline_detector_sha": "06669fbe",
  "baseline_site_count": 79,
  "registry_row_count": 14
}
```
Observed exit code: **0**. (M=79 carries the instrument ceiling stated in `gate-failclosed-audit.js`'s own `CEILING_TEXT` — this is "what the detector at 06669fbe finds," never "the population.") Full file: `runtime/enforcement-sweep/2026-08-29/b5/enforcer-sealed.json`.

**After the HELD B5-R repair (commit 51d70d42, same worktree, informational — not part of the seal):** exit **0**, `M=78, N=0, checked_repaired_count=7, regressed=[], new_entrants=[]`. Full file: `runtime/enforcement-sweep/2026-08-29/b5/enforcer-sealed-b5r.json`.

## S6-6 demonstrations (both by direct CLI execution, printed exit codes, not asserted)

```
$ node scripts/checks/gate-failclosed-enforcer.js \
    --root runtime/enforcer-fixtures/SP-20260829-001/b2-new-entrant-root \
    --registry runtime/enforcer-fixtures/SP-20260829-001/b2-regressed-registry.json \
    --baseline runtime/enforcer-fixtures/SP-20260829-001/b2-fresh-hook-only-baseline.json \
    --base-dir runtime/enforcer-fixtures/SP-20260829-001
→ exit 1, status "blocked", regressed=[{"site_id":"b2-regressed-site.js:11", ...}]

$ node scripts/checks/gate-failclosed-enforcer.js \
    --root runtime/enforcer-fixtures/SP-20260829-001/b2-new-entrant-root \
    --registry runtime/enforcer-fixtures/SP-20260829-001/b2-clean-registry.json \
    --baseline runtime/enforcer-fixtures/SP-20260829-001/b2-empty-baseline.json \
    --base-dir runtime/enforcer-fixtures/SP-20260829-001
→ exit 1, status "blocked", new_entrants=["runtime/enforcer-fixtures/SP-20260829-001/b2-new-entrant-root/fresh-hook.js:12"]
```
Both printed **exit 1**, using the same fixture harness `scripts/checks/gate-failclosed-enforcer.test.js` already exercises (its own `S6-6a`/`S6-6b`/END-TO-END(a)/(b) tests pass unmodified, see below).

## Three test suites, observed counts (node --test, individually, both commits)

| Suite | 128cf0af (B5 seal) | 51d70d42 (B5-R, informational) | Pin (inherited baseline) |
|---|---|---|---|
| `gate-failclosed-audit.test.js` | 28 tests / 27 pass / 1 skip | 28 / 27 / 1 skip | 28 / 27 / 1 skip (unchanged) |
| `gate-failclosed-enforcer.test.js` | 11 / **9 pass / 2 FAIL** | 11 / **9 pass / 2 FAIL** | 11 / 11 pass (see below — expected to change) |
| `b3-fault-injection.test.js` | 10 / 10 pass | 10 / 10 pass | 10 / 10 pass (unchanged) |

**The 2 enforcer-test failures, both in a file this brief marks out-of-scope to edit (`scripts/checks/gate-failclosed-enforcer.js and its test file`), disclosed not hidden:**
- L21-29 `"real registry loads, all 13 rows carry provenance + quote..."` — hardcodes `registry.rows.length === 13`. The brief's own step 2 requires adding a row for the genuine new-entrant defect (`ownership-guard.js:144`); the registry now correctly has 14 rows. This assertion is a stale fact about registry content baked into a locked file.
- L54-59 `"S6-6a control: same check on the REAL registry (nothing marked repaired yet)..."` — hardcodes `checkedRepaired.length === 0`, with its OWN comment already reading `// none of the 13 seeded rows claim expected_finding: absent yet`. The brief's step 3 requires marking B3's repaired rows `expected_finding: "absent"`; there are now 6 (B5) / 7 (B5-R) such rows, exactly as intended.

Both failures are direct, unavoidable, structural consequences of doing the brief-mandated registry work against a test file this same brief forbids editing — not a defect in the seal, not routed around, not silently absorbed. The regression/new-entrant assertions this same test file makes (`S6-6a`, `S6-6b`, END-TO-END a/b/c, both control tests' *regression* assertions) all still pass unmodified — the file's core behavioral claims about the enforcer are intact; only its hardcoded content-count assertions are stale.

## `node scripts/testsuite/enforce.js` — real exit code

Run as its own command both times (never piped through `tail`/`head`):
```
known-baseline reds (tracked debt, NOT release-blocking): BC-26
STALE baseline marker(s) — class no longer failing, remove baseline:"red" so future regressions block again (warning): BC-17
test-suite enforcement: 19/20 runnable green, 0 NEW regressions — canonical clean.
```
Exit code: **0** (both after 128cf0af and after 51d70d42). BC-26/BC-17 are pre-existing, unrelated to this bundle.

## Uncorrelated registry rows remaining

**None.** `uncorrelated_registry_defects: 0` in both enforcer runs (this field only counts `defect`/`contested` rows lacking a tool correlation; after B5-R the registry carries zero `defect`-disposition rows at all — the one that existed, `ownership-guard.js:144`, was repaired same-worktree and reclassified `not-a-defect`). The 3 `version-bump-guard.js` rows and the 2 `retro-presence-check.js` rows are `not-a-defect` with `tool_correlated: false`/`true` respectively — neither state counts as "uncorrelated defect" since neither carries `disposition: "defect"` or `"contested"`.

## What I could not check

- **`scripts/sprint/fs.js`'s repaired sites (B4, ED-380).** B4's own commit (`06669fbe`) names `fs.js:255-268` as one of its 3 repaired could-not-check sites. I read B4's diff to confirm it doesn't reappear in the live scan (it doesn't — `fs.js` has zero findings before or after), but I did not read `fs.js` end-to-end myself; I relied on the live scan's absence plus B4's own commit message. `fs.js` was never a `gate-failclosed-registry.json` row (out of this registry's 13-seed scope) so this bundle does not carry a disposition for it either way — named here so the gap is visible, not silently folded into "checked."
- **The symlink-guard skip in `gate-failclosed-audit.test.js`** (`blindness guard 1b`) — inherited, unchanged, unassessable on this machine/permission set; not this bundle's to fix, re-confirmed still skipping (not newly failing).
- **Whether `ownership-guard.js:144`'s repair (B5-R) is the right phase for this work** — that is exactly why it's HELD and not squashed into the seal; I did not decide this for the ruling, only prepared the repair to the same demonstrated standard as B3's.
- **`checkFoundationDeps`/`checkDeps` and every other of the 75 `K`-bucket untriaged baseline sites** — not read, not dispositioned, correctly reported by the enforcer as untriaged, not silently counted as clean. This bundle's scope was the 3 named new entrants plus the 13 seeded registry rows, not a full re-triage of the baseline.
