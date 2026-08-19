# Lane evidence — `backend-reviewer` (BINDING) — S-VLADW1-03 gauntlet-1

Shape: `in-process-agent` (harness Agent tool, synchronous) · provider `claude` · model `claude-opus-5`
Elapsed: 436529 ms · tool_uses: 27 · agentId `a1fff64a6cd0522b7`
Target: commit `a9e6708`, worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine`
Brief: `runtime/vlad-w1/s03/gauntlet-1/lane-backend.md` (narrowed at re-dispatch — see below)

**Verdict: FAIL.** All five S-criteria `cannot-assess` **by dispatch design** — this lane was deliberately
scoped OFF S1–S5 because the other three lanes had already covered them. Its findings are code-quality
findings that feed S2, not an S-criteria read.

## DISPATCH NOTE — this lane died once before it delivered

The first dispatch returned a **truncated non-verdict**: its entire final message was the single line
"Now S2/S5 — do the named residuals actually reach the shipped surface?" — no JSON, no findings. Per β's
telemetry gate that is `no-record` = a dead lane, **never a pass**, and `gauntlet-verify` correctly
reported FAIL/no-record for it. It was resumed with context intact, and separately re-dispatched with a
**narrowed three-task scope** (enforcer fail-closed behaviour · 7F comment truthfulness on changed files ·
7G extractor/non-vacuity-control quality) so it would finish inside its bound. This evidence is the
narrowed re-dispatch. The lane declared its exclusions explicitly rather than papering over them.

## Verdict JSON (verbatim)

```json
{
  "lane": "backend-reviewer",
  "verdict": "FAIL",
  "findings": [
    {
      "id": "F-1",
      "severity": "HIGH",
      "criterion": "none",
      "file": "engine/scripts/checks/no-tautological-assertions.js:116-138,239-270",
      "claim": "The tautology lint is FAIL-OPEN on a missing or unreadable scan root: walkJsFiles' `catch { continue; }` swallows the error on the ROOT directory itself, yielding zero files, and runAllChecks then returns ok:true because `violations.length === 0` — so the enforcer prints the affirmative message 'OK — no occurrence of the four named syntactic tautology families under engine/test/' and exits 0 having scanned nothing at all.",
      "execution_proven": true,
      "how_proven": "Copied engine/scripts/ into a scratch tree WITH NO test/ sibling (zero mutation of the repo): `cp -r engine/scripts <tmp>/fakeeng/scripts` then `node <tmp>/fakeeng/scripts/checks/no-tautological-assertions.js` -> printed 'no-tautological-assertions: OK — no occurrence of the four named syntactic tautology families under engine/test/' and EXIT=0. Quantified via `node --input-type=module -e 'import {runAllChecks, walkJsFiles, DEFAULT_SCAN_ROOT} from \"./scripts/checks/no-tautological-assertions.js\"; ...'` -> 'files walked: 0', 'runAllChecks({}) -> {\"ok\":true,\"violations\":[]}', and an explicitly nonexistent root 'C:/definitely/not/here' -> {\"ok\":true,\"violations\":[]}. DISCRIMINATING CONTROL, same binary: after `mkdir test` + seeding test/x.test.js with `assert.ok(items.every(c => c.canSpawn || true))`, the identical command printed '[no-tautological-assertions] RED test/x.test.js:2 (constant-truthy-disjunct)' and EXIT=1 — so the exit-0 above is caused by the absent root, not by an inability to go red.",
      "new_or_reconfirm": "new"
    },
    {
      "id": "F-2",
      "severity": "HIGH",
      "criterion": "none",
      "file": "engine/src/server-entry.js:59 and engine/driver/host-free-driver.js:45 (bound by engine/test/entry-bootstrap.test.js:259,271-275)",
      "claim": "The RE-DERIVED replacement claim shipped in both entry headers — 'initCredentialCustody() runs before any other module in this package's graph evaluates.' — is FALSE as written: src/bootstrap.js and src/env-scrub.js are both modules in this package's graph and both evaluate to completion BEFORE the entry's first statement calls initCredentialCustody(); this is the predecessor's exact defect class reproduced one hop out, and test/entry-bootstrap.test.js:271 certifies it as 'the re-derived, TRUE claim' while only asserting `source.includes(RE_DERIVED_CLAIM)` — presence, never truth.",
      "execution_proven": true,
      "how_proven": "Built a faithful three-file mirror of the shipped chain in scratch (entry.mjs -> boot.mjs re-exports from scrub.mjs, matching src/bootstrap.js:35's `export { ... } from \"./env-scrub.js\"`) and ran `node entry.mjs`. Output, in order: '2. env-scrub.js MODULE BODY evaluates' / '3. bootstrap.js MODULE BODY evaluates' / '4. initCredentialCustody() RUNS' — two other package modules evaluate first. Binding confirmed by `grep -n \"A5\\|A6\\|RE_DERIVED\\|runs before any other\" test/entry-bootstrap.test.js` -> line 259 `const RE_DERIVED_CLAIM = \"before any other module in this package's graph evaluates\";` and line 274 `source.includes(RE_DERIVED_CLAIM)`. NOTE FOR WEIGHTING: the underlying SECURITY property is sound — the only two modules that evaluate first are the zero-import scrub and a re-export-only shim — so this is a false shipped sentence, not an open leak. It also bears on S2 (a claim stated as fact in shipped copy that is untrue); I flag it for whichever lane owns S2 rather than ruling S2 myself.",
      "new_or_reconfirm": "new"
    },
    {
      "id": "F-3",
      "severity": "HIGH",
      "criterion": "none",
      "file": "engine/test/entry-bootstrap.test.js:88-89",
      "claim": "extractStaticImportSpecifiers has two FAIL-OPEN blind spots that make the A2 'exactly one static import' and A3 closure assertions silently weaker than they read: (a) two static imports on ONE line yield only the LAST specifier — the first is invisible, so a file with two static imports still counts as one; (b) a trailing `/* block comment */` after the specifier makes the ENTIRE import invisible — the `$`-anchored tail tolerates only `;` and a `//` comment. Both are the same class the header at lines 81-87 says was already 'PROVED insufficient by this fix's own A4 mutant proof' for the `//` case, fixed for that one spelling only.",
      "execution_proven": true,
      "how_proven": "Copied the regex from test/entry-bootstrap.test.js:88-89 VERBATIM into a scratch harness and ran `node <tmp>/extract.mjs` over nine forms. Results: side-effect-only `import \"x\"` -> [\"./side-effect.js\"] OK; `export * from` -> [\"./star.js\"] OK; `export { a } from` -> [\"./named.js\"] OK; multi-line `import {\\n a,\\n} from` -> [\"./multi.js\"] OK; controls `import a from \"./normal.js\";` and `... ; // note` -> both OK. FAILURES: `import a from \"./one.js\"; import b from \"./two.js\";` -> [\"./two.js\"] (./one.js LOST); `import a from \"./blockcmt.js\"; /* note */` -> [] (whole import LOST); `import a from \"./blk2.js\" /* n */` -> [] (whole import LOST). The dispatch's other named forms are handled: `import type` matches via the from-clause alternative, and `import(...)` is correctly excluded by the `(?!\\()` guard. I did NOT re-run the A4 entry mutants (another lane's scope), so this weakens the standing guard rather than falsifying any mutation already observed red.",
      "new_or_reconfirm": "new"
    },
    {
      "id": "F-4",
      "severity": "MEDIUM",
      "criterion": "none",
      "file": "engine/src/env-scrub.js:101-108",
      "claim": "The module-cache singleton comment states that 'src/model-seam.js, src/server-entry.js and driver/host-free-driver.js all reach the SAME instance of this state (each imports \"./env-scrub.js\" / \"../src/env-scrub.js\", which all resolve to this one file)' — but bundle 8a's own restructure made that parenthetical false for two of the three named files: both entries now import bootstrap.js, not env-scrub.js. The conclusion still holds (bootstrap.js re-exports the same instance); the stated mechanism does not. The comment is unchanged context in this diff, so THIS diff is what turned a true comment false.",
      "execution_proven": true,
      "how_proven": "`grep -n '^import\\|^export .* from' src/server-entry.js driver/host-free-driver.js src/model-seam.js src/bootstrap.js | grep -i \"scrub\\|bootstrap\"` -> server-entry.js:66 `from \"./bootstrap.js\"`; host-free-driver.js:48 `from \"../src/bootstrap.js\"`; model-seam.js:82 `from \"./env-scrub.js\"`; bootstrap.js:35 `from \"./env-scrub.js\"`. Staleness confirmed by `git diff e4c75c7 a9e6708 -- src/env-scrub.js | grep -n \"@@\"` -> hunks at @@-37 and @@-106/-118 only, so lines 101-108 were never revisited.",
      "new_or_reconfirm": "new"
    },
    {
      "id": "F-5",
      "severity": "MEDIUM",
      "criterion": "none",
      "file": "engine/src/spawn-shim.js:356-373",
      "claim": "The re-scrub choke-point's rationale names a beneficiary that structurally cannot benefit: it says the credential is scrubbed 'before the NEXT child launched through this wrapper could ever inherit it', but no child launched through this wrapper can EVER inherit process.env — auditedSpawn refuses any call without an explicit opts.env (lines 216-221) and passes `env: normalizedEnv` (line 384), an object derived solely from opts.env. The re-scrub's real value is for children spawned OUTSIDE this wrapper (the SDK, raw child_process) and for populating the captured snapshot; the header sells it via the one consumer it cannot help, which invites a future reader to relax the explicit-env requirement believing the re-scrub covers them.",
      "execution_proven": false,
      "how_proven": "Read-only. Established by reading src/spawn-shim.js:194-198 (JSDoc: 'env is REQUIRED and explicit — this wrapper never inherits process.env by default'), :216-221 (throws without an explicit env object) and :382-386 (`spawn(normCommand, normArgs, { cwd, env: normalizedEnv, stdio })`), plus normalizeEnv at :159-169 which derives flat solely from its envObject argument. I did not launch a real child to demonstrate it, so this is marked false rather than optimistically true. SEPARATELY VERIFIED AND CORRECT, no finding: the ordering question — the re-scrub sits AFTER normalizedEnv is frozen (line 257), which is harmless precisely because normalizedEnv never reads process.env; there is one spawn() call site so 'before every real spawn' holds; initCredentialCustody is synchronous with no reentrancy hazard and O(6) cost per spawn.",
      "new_or_reconfirm": "new"
    },
    {
      "id": "F-6",
      "severity": "LOW",
      "criterion": "none",
      "file": "engine/scripts/checks/no-tautological-assertions.js:64-69",
      "claim": "The shipped header reports a live defect that no longer exists: 'A real, PRE-EXISTING occurrence of pattern 1 was found by this lint in test/env-scrub.test.js (line ~408) ... is NOT edited here; it is reported to the conductor as a finding, not fixed.' Bundle 8b deleted that occurrence, so the lint is now green on the real tree and a reader sent to env-scrub.test.js:408 finds nothing.",
      "execution_proven": true,
      "how_proven": "`node scripts/checks/no-tautological-assertions.js` run in the engine worktree against the REAL test tree -> 'no-tautological-assertions: OK — no occurrence of the four named syntactic tautology families under engine/test/', EXIT=0. Cross-checked against test/env-scrub.test.js:473-476, which records that the `|| true` tautology 'is DELETED, not kept as documentation'.",
      "new_or_reconfirm": "new"
    },
    {
      "id": "F-7",
      "severity": "LOW",
      "criterion": "none",
      "file": "engine/package.json (scripts block) vs engine/scripts/checks/no-tautological-assertions.js:57-63",
      "claim": "The tautology lint is referenced by no npm script — not npm test, not check:custody, not check:ship — so it currently gates nothing on any run a user or the release gate performs. The file discloses this itself and reports the wiring as owed, so this is a reconfirm of a stated gap, not a new discovery; it is recorded only because it compounds F-1 (an enforcer that is both fail-open AND unwired).",
      "execution_proven": true,
      "how_proven": "`grep -c \"no-tautological\" package.json` -> 0.",
      "new_or_reconfirm": "reconfirm"
    }
  ],
  "s_criteria_read": {
    "S1": "cannot-assess",
    "S2": "cannot-assess",
    "S3": "cannot-assess",
    "S4": "cannot-assess",
    "S5": "cannot-assess"
  }
}
```

## `what_i_could_not_assess` (verbatim — every exclusion is dispatch-designed, not a silent gap)

1. **S1** — the item-7 attack battery and its raw controls. Explicitly excluded (security lane owns it);
   ran none of it, offers no read.
2. **S2 and S5** — shipped-surface disclosure auditing. Explicitly excluded. **F-2 and F-4 are shipped-header
   falsehoods the S2 lane may want as input**, but this lane did not perform the audit and does not rule.
3. **S3** — the RED-on-removal mutation of both entries was excluded; no mutants run. F-3 shows the
   standing extractor guard is fail-open in two shapes, which weakens the assertion **going forward**; it
   says nothing about whether the mutants another lane ran actually went red.
4. **S4** — the five falsifier fixtures and R4/AC-8.4. Not reached, not examined.
5. **`src/model-seam.js`** — `buildSecretSearchPattern` and the `SANCTIONED_CARRIER_NOTE` sentence-3
   correction (does P2 exempt `spawn-shim.js` and not `model-seam.js`). Named in the background brief but
   NOT in the three dispatched tasks. **Not verified, and must NOT be treated as cleared by this lane's
   silence.**
6. **`src/job-manager.js` and `src/quota.js`** (bundle 8d) — state-machine integrity, error paths,
   resource cleanup. Not reached; time-boxed out after tasks 1–3.
7. **`scripts/checks/verified-by-resolver.js`** (262 changed lines) — only its exported surface as consumed
   by `ac-manifest.js` was read. **Its own fail-closed behaviour was not tested.**
8. F-5 was established by reading control flow, not by launching a child — hence `execution_proven:false`.
9. `git status --porcelain` confirmed NO tracked modifications before returning; all verification ran
   read-only or in a scratch copy outside both trees, and scratch artifacts were deleted.

## Positive result worth recording (a control that DOES work)

`scripts/checks/lib/ac-manifest.js` is **genuinely fail-closed** on all five error paths exercised:
missing source → exit 2 `NO_DATA`; unreadable source → 1; absent committed manifest → 1; malformed JSON
manifest → 1; wrong/duplicate flags → 1. And the `env-scrub.test.js` B2 non-vacuity control **does**
genuinely discriminate — no finding there. β Q2's option (b) landed correctly; β Q3's tautology lint did
not.
