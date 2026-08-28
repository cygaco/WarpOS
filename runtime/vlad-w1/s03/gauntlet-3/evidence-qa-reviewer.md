# Lane evidence — `qa-reviewer` (BINDING) — S-VLADW1-03 gauntlet-3 (QUALIFYING RUN)

Shape: `in-process-agent` · claude-opus-5 · elapsed 745071 ms · 35 tool_uses · agentId `a67bbf5fef302a8f1`
Target: commit `b2583d6`. Brief: `lane-qa.md`. Isolation: first of three SERIALIZED lanes on the live worktree.

**Verdict: FAIL.** S-criteria: **S1 cannot-assess · S2 FAILS · S3 holds · S4 holds · S5 holds.**
Worktree clean at finish (lane-reported and conductor-verified).

Lane summary in its own words: *"Full mutation battery run on the live worktree, everything restored, tree
verified clean. Commit `b2583d6` verified; suite 318 pass / 0 fail / 0 skipped / 0 todo (exit 0);
check:ship exit 0; check:pointers exit 1 (red by design, counts re-derived and now internally consistent).
All three 'resolve by a read' assertions confirmed. S3's wiring proof and the inert-control closure both
observed RED under my own mutation. But I found two sentences in the byte-bound shipped copy that this
round's own fixes made false, plus an exclusion list whose omissions I proved by mutation."*

## Verbatim envelope

```json
{
  "lane": "qa-reviewer",
  "verdict": "FAIL",
  "commit_reviewed": "b2583d6",
  "worktree_clean_at_finish": true,
  "s_criteria": { "S1": "cannot-assess", "S2": "FAILS", "S3": "holds", "S4": "holds", "S5": "holds" },
  "findings": [
    {
      "id": "F-1", "severity": "MEDIUM", "criterion": "S2", "file": "engine/CUSTODY.md:111",
      "claim": "The bound preload Ceiling paragraph ends 'This residual is not, as of this fix cycle, named on any other surface, shipped or internal' — and THIS fix cycle's own commit 977ab14 (bundle 10c) falsified it by naming the residual in engine/test/entry-bootstrap.test.js.",
      "execution_proven": true,
      "evidence": "grep -rn NODE_OPTIONS (excl. node_modules) returns engine/test/entry-bootstrap.test.js:687 — named ceiling 3: 'A process started with a preload (--require/--import/NODE_OPTIONS) evaluates that preload before this package's graph entirely; that residual is named as its own Ceiling in CUSTODY.md and is out of scope here — indeed this test USES --import, which is a live demonstration of that ceiling.' Provenance: git log -S \"preload (--require/--import/NODE_OPTIONS)\" -- engine/test/entry-bootstrap.test.js -> 977ab14 fix(10c) (this fix cycle). The CUSTODY paragraph itself dates from 0732cd8. package.json#files = [src/, scripts/, driver/, test/credential-custody-decoy.test.js, CUSTODY.md], so entry-bootstrap.test.js is an INTERNAL surface — which the sentence explicitly covers ('shipped or internal'). The byte-binding lint pinned the wording and therefore preserved the falsehood: check:ship exit 0 with the false sentence in place."
    },
    {
      "id": "F-2", "severity": "MEDIUM", "criterion": "S2", "file": "engine/CUSTODY.md:119",
      "claim": "The bound opts.cwd/opts.stdio Ceiling paragraph asserts 'the observation is not this fix cycle's, which touched neither src/spawn-shim.js nor its test' and identifies the previous cycle as 'the one that last changed src/spawn-shim.js' — but this fix cycle DID change src/spawn-shim.js, before that sentence was written.",
      "execution_proven": true,
      "evidence": "git log --oneline 0732cd8..b2583d6 -- engine/src/spawn-shim.js -> 55fc6a3 fix(10d): full-history re-scrub; git diff --stat 0732cd8..b2583d6 shows engine/src/spawn-shim.js | 34 ++. git log -S \"a PREVIOUS cycle\" -- engine/CUSTODY.md -> d5fca1d (bundle 10b), NEWER than 55fc6a3 — the sentence was authored after the file had already been touched in the same cycle. The 10d change is comment-only, so the sentence survives a 'behaviourally changed' reading, but that qualifier is not in the text, and 'this fix cycle' is nowhere defined in CUSTODY.md and is used inconsistently across 7 occurrences (line 230 pins one usage to 'S-VLADW1-03 bundle 8c', a different cycle). Under the plain reading the sentence is false and self-contradictory in the same breath. The second half is TRUE and verified: opts.cwd/opts.stdio body lines 417/419 unchanged this cycle."
    },
    {
      "id": "F-3", "severity": "MEDIUM", "criterion": "S2", "file": "engine/CUSTODY.md:12",
      "claim": "The header's what-is-NOT-bound list, which promises to say it 'plainly rather than generalised', omits the largest unbound category: the substantive BODY prose of P1/P2/P3/P4 that states what each enforcer actually scans — an exclusion list that is itself incomplete.",
      "execution_proven": true,
      "evidence": "Three mutations of substantive Proven-clause body prose, each a flat falsehood, all shipped GREEN. (a) P1 body 'Scans committed files, log-writing call sites, and telemetry payload builders.' -> 'Scans absolutely everything on the machine, including files this package never ships.' => check:custody exit=0, 'custody-claim-lint: OK — ... 0 violations.' (b) P2 body 'Two halves are required:' -> 'Only one half is required:' => check:ship exit=0. (c) P3 body 'Ambient env is poisoned with a decoy secret of each class P1 covers' -> 'No decoy secret is used at all; the fixture asserts nothing' => check:ship exit=0. The header's enumeration names only the preamble, the P1-P4 status/enforcer/proof-scope lines, A1's Live-measurement follow-on, and the A5 commentary. The general lead-clause gives the sentence a true reading; the enumerated reading the 'plainly, not generalised' promise invites is incomplete. This is the true-one-reading-over shape, one layer out from the fix."
    },
    {
      "id": "F-4", "severity": "LOW", "criterion": "none", "file": "engine/package.json:14",
      "claim": "npm run check:ship — the run package.json calls 'the product's ship-time run' — stays exit 0 when the credential-custody scrub call is deleted from EITHER real entry point; only node --test goes red.",
      "execution_proven": true,
      "evidence": "Mutating the real engine/src/server-entry.js (deleting initCredentialCustody(CREDENTIAL_ENV_NAMES);): node --test -> exit 1, 311 pass / 7 fail; npm run check:ship -> exit 0. Same mutation on the real engine/driver/host-free-driver.js: node --test -> exit 1, 315 pass / 3 fail; npm run check:ship -> exit 0. package.json#vladShipTimeChecks already ceilings 'check:ship is the product's ship-time run by CONVENTION', but does not disclose that check:ship alone does not notice scrub removal. Not an S3 failure — S3's bar is 'a committed standing test goes RED', which it does — but the gate a packager would run is not that test."
    },
    {
      "id": "F-5", "severity": "LOW", "criterion": "none", "file": "engine/CUSTODY.md:130",
      "claim": "A P1-P4 **Enforcer:** line can be repointed to a file that does not exist and every gate stays green — the user-facing pointer from a claim to its enforcer is unverified.",
      "execution_proven": true,
      "evidence": "P3's '**Enforcer:** test/credential-custody-decoy.test.js' -> '**Enforcer:** scripts/checks/does-not-exist.js' => npm run check:ship exit=0, including 'a5-wiring-presence: OK — every custody enforcer is wired into check:custody, every wired path exists'. Disclosed by the header's exclusion list, so NOT an S2 falsity — recorded as a residual on the disclosure surface, not a broken claim."
    },
    {
      "id": "F-6", "severity": "LOW", "criterion": "S5", "file": "engine/CUSTODY.md:137",
      "claim": "The CLASS-form residual ('no enforcer asserts the general property that every shipped control is invoked by some product-layer path') is recorded but appears nowhere on the shipped surface, while the INSTANCE it generalises does ship.",
      "execution_proven": true,
      "evidence": "grep -rn -iE 'every shipped control|invoked by some product-layer|product-layer path|no enforcer asserts the general|general (form|property)|CLASS-form' over src/ scripts/ driver/ CUSTODY.md package.json -> exit 1, zero matches. Nearest shipped statement is a5-wiring-presence.js's A5 HONESTY CEILING, which names the adjacent user-action boundary, not the absence-of-an-enforcer residual. The record in ROUND-RECORD.md §4 EXISTS and says what it claims. My judgment: S5 permits 'recorded OR shipped', the record is real and is not the build spec itself, and CUSTODY.md makes no shipped claim that the class-form residual bounds — so S5 holds on the letter. The tension α should weigh is that a CUSTODY.md reader is handed the instance without the class."
    }
  ],
  "regressions_from_fix_attempt_2": [
    "Bundle 10c (977ab14) added the preload-residual disclosure to engine/test/entry-bootstrap.test.js:687, thereby falsifying the byte-bound CUSTODY.md sentence 'This residual is not, as of this fix cycle, named on any other surface, shipped or internal' (F-1). The claim lint pins wording, not truth, so it held the newly-false sentence in place with check:ship green.",
    "Bundle 10b (d5fca1d) authored the attribution sentence 'the observation is not this fix cycle's, which touched neither src/spawn-shim.js nor its test' AFTER bundle 10d (55fc6a3) had already modified engine/src/spawn-shim.js by 34 lines in the same fix cycle (F-2).",
    "Bundle 10b's new header exclusion list, whose own promise is to enumerate 'plainly rather than generalised', omits the body prose of P1/P2/P3/P4 — proven unbound by three green flat-falsehood mutations (F-3). The fix that closed the binding gap for Asserted and Ceiling paragraphs created an accuracy gap in the sentence describing it."
  ],
  "what_i_could_not_assess": [
    "S1 in its entirety. I ran no leak attempt, no TOCTOU battery, none of the seven carriers or three earlier attacks, and no raw controls. My S3 mutations show the scrub call is load-bearing, but that is not S1 re-established. Cross-check the security lanes.",
    "Whether the CLASS-form residual was carried into the successor tracker pointer, which ROUND-RECORD.md §4 says it 'must also be'. The tracker is outside my allowed roots. My S5 'holds' rests only on the §4 record existing and reading as claimed.",
    "F-1, F-2 and F-3's own oracles were NOT independently mutated by me. I read their source and confirmed each carries both a precondition and a no-op guard (assert.notEqual), and I ran the suite green. I personally observed only F-4's oracle (six distinct real-lint mutations -> RED), F-5's oracle (collapsing missing-name into missing-file -> 5 failures, exit 1, restored -> exit 0), and the AC-8.4 mutation twin (mutating sentinelHook in src/model-seam.js to always return {leaked:false,keys:[]} -> the twin FAILED, exit 1, 1 pass / 1 fail; restored -> exit 0). My S4 'holds' therefore rests partly on reading rather than on execution for F-1/F-2/F-3.",
    "Clean-checkout fidelity. I judged only the live worktree. I did confirm .gitattributes pins exactly one path (engine/CUSTODY.md eol=lf) and note that the canonical copies in scripts/checks/custody-claim-lint.js and src/model-seam.js are the other half of the byte-binding and are NOT pinned — the lint's whitespace tolerance is what makes that safe, which I did not test.",
    "A7's rotation behaviour and A8's confident-mis-resolution behaviour: read in CUSTODY.md, not executed.",
    "A6's four SDK var names against the installed SDK's own credential-var group.",
    "The A5 SANCTIONED_CARRIER_NOTE three-sentence binding — the lint reports 3 sentences bound and passes, but I did not independently diff src/model-seam.js's constant against CUSTODY.md's quoted block.",
    "User-visible runtime STRINGS emitted by src/server-entry.js and driver/host-free-driver.js (as opposed to their comments and import shapes)."
  ]
}
```

## Conductor note on this lane's own honesty

The lane's `what_i_could_not_assess` is unusually strong and should be read as part of the verdict, not as
boilerplate. It (a) refused to claim S1 at all rather than inferring it from its S3 mutations, (b) marked its
own S4 "holds" as resting partly on READING for F-1/F-2/F-3 while naming exactly which three oracles it did
personally observe RED, and (c) volunteered that the canonical copies in `custody-claim-lint.js` and
`model-seam.js` are the unpinned other half of the byte-binding — a gap nobody asked it to look for.
