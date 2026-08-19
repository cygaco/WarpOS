# Lane evidence — `qa-reviewer` (BINDING) — S-VLADW1-03 gauntlet-1

Shape: `in-process-agent` (harness Agent tool, synchronous) · provider `claude` · model `claude-opus-5`
Elapsed: 555846 ms · tool_uses: 53 · agentId `aac01948f5f2ba429`
Target: commit `a9e6708`, worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine`
Brief: `runtime/vlad-w1/s03/gauntlet-1/lane-qa.md`

**Verdict: FAIL.** S-criteria read: S1 holds · S2 **fails** · S3 cannot-assess · S4 cannot-assess ·
S5 **fails**.

Lane returned the worktree clean at `a9e6708`, no tracked modifications, HEAD unchanged.

## Verdict JSON (verbatim)

```json
{
  "lane": "qa-reviewer",
  "verdict": "FAIL",
  "findings": [
    {
      "id": "F-1",
      "severity": "HIGH",
      "criterion": "S5",
      "file": "src/spawn-shim.js:383",
      "claim": "The named residual 'opts.cwd and opts.stdio remain unscanned' is disclosed on NO shipped surface — not in spawn-shim.js's own 100+ line residual header, not in CUSTODY.md, not in package.json, and not even in the non-shipping test file; it exists only in the WarpOS-side brief.",
      "execution_proven": true,
      "how_proven": "Ran `grep -rn \"opts\\.cwd\\|opts\\.stdio\\|stdio\" src/ driver/ scripts/ CUSTODY.md package.json` — the ONLY hits in src/spawn-shim.js are the JSDoc type at :193 and the two live pass-throughs `cwd: opts.cwd` (:383) and `stdio: opts.stdio ?? [...]` (:385); zero prose disclosing them as unscanned. Also ran `grep -rn \"opts.cwd\\|opts.stdio\" test/` -> no output, and `grep -rniE \"unscanned|not scanned\" src/ driver/ scripts/ CUSTODY.md package.json test/` -> the only 'unscanned' hits are about argv (spawn-shim.js:61, CUSTODY.md:47) and unrelated matches. Confirmed by reading auditedSpawn end to end: Checks 1, 2, 2b and 3 inspect only opts.env, command and args; cwd and stdio reach spawn() untouched. `npm pack --dry-run` confirms src/spawn-shim.js ships (22.8kB, 31 files total).",
      "new_or_reconfirm": "new"
    },
    {
      "id": "F-2",
      "severity": "MEDIUM",
      "criterion": "S5",
      "file": "test/env-scrub.test.js:394",
      "claim": "The walker's named residual — 'a specifier the resolver mis-resolves confidently still classifies wrongly; only the unresolvable case fails closed' — is disclosed nowhere at all: not on the shipped surface and not even beside the classifier in the non-shipping test that implements it.",
      "execution_proven": true,
      "how_proven": "Ran `grep -rniE \"mis-resolv|misresolv|confidently|resolves wrongly|classifies wrongly\" src/ driver/ scripts/ test/ CUSTODY.md package.json` (excluding the unrelated scan-root 'mis-resolved root' hits in the three surface scanners) -> no output. Reading test/env-scrub.test.js:382-394 shows the fail-closed direction IS disclosed ('anything reaching this classifier that is NOT relative and NOT on this list ... is classified spawn-capable BY DEFAULT'), but the converse — a confidently WRONG resolution — is never stated. Lower severity than F-1 because the walker is a dev-side test artifact, not shipped code; but S5 as written requires every named residual to reach the recorded/shipped surface.",
      "new_or_reconfirm": "new"
    },
    {
      "id": "F-3",
      "severity": "MEDIUM",
      "criterion": "S5",
      "file": "test/entry-bootstrap.test.js:114",
      "claim": "The 'node: builtins still resolve first' residual is named as a ceiling only in a file that does not ship; the shipped surface carries the mechanism sentence but never labels it as a standing residual.",
      "execution_proven": true,
      "how_proven": "Ran `grep -rniE \"node: builtin|node:builtin\" src/ driver/ scripts/ CUSTODY.md test/entry-bootstrap.test.js`. The explicit ceiling wording — \"that is the whole point of A3's 'node: builtins still resolve' ceiling\" — appears at test/entry-bootstrap.test.js:114 and :14; `npm pack --dry-run` confirms test/entry-bootstrap.test.js is NOT in the 31-file ship set (only test/credential-custody-decoy.test.js ships). The shipped mention is src/server-entry.js:64-65, which states the fact ('a node: builtin import resolves and evaluates too') inside an assertion about env-scrub.js's zero imports rather than as a named residual. Partial, not absent — hence MEDIUM, not HIGH.",
      "new_or_reconfirm": "new"
    },
    {
      "id": "F-4",
      "severity": "MEDIUM",
      "criterion": "S2",
      "file": "package.json:22",
      "claim": "Shipped copy is internally self-contradictory about how much work is missing: it asserts ELEVEN unresolved pointers are 'clerical NAME drift (the substance exists under a different test-node name)', then in the next sentence admits one of those eleven is 'missing WORK, not a missing name' — the honest split is TEN drift + ONE missing work + FOUR missing files.",
      "execution_proven": true,
      "how_proven": "Ran `npm run check:pointers` as its own command -> EXIT=1, '33/48 verified_by pointer(s) resolve, 15 unresolved'. I counted the RED lines myself from that output: missing-name at lines 56, 60, 191, 294, 298, 301, 306, 309, 313, 326, 342 = ELEVEN; missing-file at lines 318, 323, 332, 338 = FOUR; total FIFTEEN — matching the brief's stated 11/4/15 and confirming the predecessor's undercount of 7 is not repeated. custody-runtime.test.js::selfcheck-runs-on-user-machine (AC-8.6) is reported as missing-NAME, so 11+4=15 forces it into the 'eleven clerical' bucket that package.json:22 characterizes as substance-exists-elsewhere, while the same field calls it missing WORK.",
      "new_or_reconfirm": "new"
    },
    {
      "id": "F-5",
      "severity": "MEDIUM",
      "criterion": "S2",
      "file": "CUSTODY.md:87",
      "claim": "The AC-8.6 disclosure states 'the test-node name reserved for it lives in test/custody-runtime.test.js' — the name does not exist in that file, so shipped copy asserts a presence that is absent and implies more scaffolding than was delivered.",
      "execution_proven": true,
      "how_proven": "Ran `grep -c \"selfcheck-runs-on-user-machine\" test/custody-runtime.test.js` -> 0. Ran `grep -rl \"selfcheck-runs-on-user-machine\" test/` -> only test/verified-by-resolver.test.js (a fixture reference), never custody-runtime.test.js. Independently corroborated by `npm run check:pointers`, which classifies that pointer as missing-name at line 313 — i.e. the file exists but the node name is not in it. Also ran `grep -oE '^(test|it|describe)\\(\"[^\"]{0,110}' test/custody-runtime.test.js` -> only two titles, both AC-8.4.",
      "new_or_reconfirm": "new"
    },
    {
      "id": "F-6",
      "severity": "LOW",
      "criterion": "S2",
      "file": "CUSTODY.md:66",
      "claim": "The P2 raw-launch ceiling's runtime-coverage argument was newly written this sprint in the weak 'first statement, before any of that file's own subsequent code runs' form and names only src/server-entry.js — omitting driver/host-free-driver.js, which is the one real auditedSpawn caller and also scrubs.",
      "execution_proven": true,
      "how_proven": "Ran `git diff e4c75c7 a9e6708 -- CUSTODY.md | grep -E '^[-+]' | grep -i 'first statement'` -> the line is a '+' ADDITION in this range, i.e. authored in the same sprint whose bundle 8a repudiated the 'first statement' framing as insufficient. Confirmed the stronger re-derived claim exists in code but not in CUSTODY.md: src/server-entry.js:59 and driver/host-free-driver.js:45 both carry 'initCredentialCustody() runs before any other module in this package's graph evaluates'. Confirmed the driver is a real scrub site via `grep -n 'initCredentialCustody' driver/host-free-driver.js` -> :49. The sentence as written is TRUE but understates the delivered control and leaves its own 'so a raw launch ... cannot inherit the secret' conclusion unsupported for the driver entry. Under-claiming, not over-claiming — hence LOW.",
      "new_or_reconfirm": "new"
    }
  ],
  "s_criteria_read": {
    "S1": "holds",
    "S2": "fails",
    "S3": "cannot-assess",
    "S4": "cannot-assess",
    "S5": "fails"
  }
}
```

## `what_i_could_not_assess` (verbatim — the scope limits are load-bearing)

1. **S1 detail.** Ran the full suite (`npm test` → EXIT=0, 271 pass / 0 fail / 0 skipped / 0 todo), which
   includes the item-7 TOCTOU battery, and found no execution-proven leak. Did **NOT** individually audit
   that each of the ten attacks carries a genuine raw control — that per-attack audit belongs to the
   security lane. **"holds" here means "no execution-proven leak found in my lane", not "each raw control
   verified".**
2. **S3.** Did NOT observe the wiring proof go RED under mutation for BOTH entries. What WAS run: a
   mutation of `src/server-entry.js` adding a second static import (`import "node:path";`), then
   `node --test test/entry-bootstrap.test.js` → MUTANT_EXIT=1, 15 tests / 14 pass / 1 fail — so the A2
   one-specifier guard is non-vacuous for the server entry. Reverted with `git checkout --`, byte-identity
   confirmed via `diff -q`, `npm test` → EXIT=0, 271/271. By READ (not mutation): the walker asserts both
   directions at `test/env-scrub.test.js:494-499` (`some canSpawn` AND `some !canSpawn`, with the explicit
   note that a walker classifying everything spawn-capable "would still pass the some-canSpawn assertion
   while discriminating nothing"), and the `|| true` tautology is deleted. **Did not mutate the driver
   entry or the walker itself.**
3. **S4.** Did not run the five falsifier fixtures or observe them RED, and did not re-verify the
   predecessor's R4 / AC-8.4. Out of this lane's execution budget.
4. **P3 wired-but-vacuous.** Ran `npm run test:custody` → EXIT=0, 2 pass / 0 skipped, and confirmed by
   reading `package.json#scripts` that P3's enforcer (`test/credential-custody-decoy.test.js`) is **NOT**
   in `check:custody`'s five-enforcer chain. That present-but-unwired state IS disclosed in place at
   `CUSTODY.md:82-88`, so it was not filed as a new S2 finding — but the decoy fixture was not
   mutation-tested to prove it goes RED when the scrub is removed.
5. **The "substance exists under a different test-node name" claim** was spot-traced, not verified
   one-for-one. Plausible substance found for most (`custody-static.test.js` covers raw-spawn /
   computed-specifier / parse-error / fail-closed; `model-seam.test.js` covers subscription mode;
   `a5-wiring.test.js` covers ship-time wiring; the two `claim-lint.test.js` missing-FILE pointers
   correspond to the existing `custody-claim-lint.test.js`). **`fallback-adapter-contract-parity` returned
   no "parity" match anywhere and remains unconfirmed.**
