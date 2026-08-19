# GAUNTLET — sprint S-VLADW1-03, vlad engine. **THE FIRST QUALIFYING RUN.**

Evidence directory: `runtime/vlad-w1/s03/gauntlet-1/`. Commit under review: **`a9e6708`**, branch
`wt/S-VLADW1-01-engine`, worktree
`C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine`.

S-VLADW1-03 is the SUCCESSOR sprint. Its predecessor S-VLADW1-01 closed at an honest state with **NO
RELEASE** — α applied a pre-committed rule and two of four criteria failed. This sprint exists to close
exactly those residuals. **Do not re-litigate the predecessor's close; assess what is in front of you.**

**Your verdict does not decide the outcome.** β pre-committed the release rule (row 305, msg_id
`7c05e9d1`) BEFORE any of this round's results existed, and ruled that lane verdicts do not decide it in
either direction: four FAILs on MEDIUMs can still release; four PASSes can still fail S2. What decides
it — **S1–S5**, applied by α at this run's close:

- **S1** — zero **execution-proven** leaks, RE-ESTABLISHED: the item-7 attack battery is committed and
  green, each attack carrying a **raw control** proving an unguarded child DOES obtain the value.
- **S2** — zero PROVEN-over-unproven in shipped copy **at close** (truth-at-close by reviewer read, NOT
  future-proofing — but each named residual must be disclosed in the shipped ceiling text).
- **S3** — the wiring proof is RED-on-removal **OBSERVED UNDER MUTATION for BOTH entries**, and the
  walker asserts **both directions** (spawn-capable classifies as such; non-spawn-capable does not).
- **S4** — all five falsifier fixtures present **AND observed RED**, carrying the predecessor's R4
  (AC-8.4 re-verified).
- **S5 (new)** — **every named residual travels to the recorded/shipped surface.** A residual disclosed
  only WarpOS-side does not satisfy S5.

**Attempt accounting, per β:** TWO fix attempts are available after this first qualifying gauntlet,
counted by **evidence directories** under `runtime/vlad-w1/s03/`, never by an ordinal. If all five hold
at this run's close, it releases here. Any S failing means a fix attempt, not a downgrade of the rule.

**β's discriminators, fixed in advance so you need not guess:**
- Re-confirming an already-counted finding is **not** new.
- A new finding inside an already-ceiling'd-and-disclosed class does **not** fire S1 unless it is
  **execution-proven against a green gate**.
- **`NO_DATA` and `t.skip` are NOT a pass.** A check that skips reads as no-data, never as green.
- Disclosure that exists only in WarpOS-side runtime notes does **not** satisfy S5 — it must be in the
  shipped surface (`CUSTODY.md`, code headers, `package.json` fields, driver output).

## GATE STATE AT `a9e6708` — verified by the conductor immediately before dispatch

- `npm test` → **271 pass / 0 fail / 0 skipped / 0 todo, exit 0**
- `npm run check:ship` → **exit 0** across six enforcers
- `npm run check:pointers` → **exit 1, BY DESIGN** — 33/48 `verified_by` pointers resolve; 11
  `missing-name`, 4 `missing-file`. β Q2 ruled it stays OUT of `check:ship` until the resolved manifest
  lands, with a scope qualifier on any enforcement claim meanwhile.

## WHAT CHANGED SINCE THE PREDECESSOR'S LAST COMMIT (`e4c75c7` → `a9e6708`)

Five bundles landed across two commits (`8b6993e`, `a9e6708`). 24 files, +3151/−343.

1. **BOOTSTRAP RESTRUCTURE (item 1 / bundle 8a).** The predecessor's "scrub runs as the FIRST STATEMENT"
   claim was **false by ESM semantics** — static imports hoist and evaluate to completion before any
   statement of the importing body, wherever the declaration textually sits. Fix: `src/bootstrap.js` is
   now the ONE shared static-import surface; `src/server-entry.js` and `driver/host-free-driver.js` each
   statically import **exactly one** specifier (that file), call the scrub, then reach the program by
   **dynamic** `import(...)`. `src/env-scrub.js` remains zero-import, so the static closure of each entry
   is {itself, bootstrap.js, env-scrub.js} and nothing else. Standing test:
   `test/entry-bootstrap.test.js` (A2 one-specifier, A3 closure, A3-ceiling, A5/A6 old-claim-absent +
   re-derived-claim-present, for BOTH entries). **Named residual, stated not hidden:** `node:` builtins
   still resolve first.
2. **IDEMPOTENCE RULED — re-scrub-on-call (item 5 / bundle 8b).** β Q4 made re-scrub-on-call CONDITIONAL
   on naming the re-invoking choke-point. It is named: `src/spawn-shim.js`'s `auditedSpawn()` re-invokes
   `initCredentialCustody()` immediately before **every** real launch. The guard that ignored its `names`
   argument is fixed. Semantics are **absorption, not re-capture** — a name whose captured slot already
   holds a real value is never overwritten (a naive re-capture would silently null out
   `model-seam.js`'s API-key fallback). Two residuals are written into the shipped header: (1) a
   mid-session credential is **captured, not ignored**, so it becomes reachable via
   `getCapturedCredential()` where previously it would not have been; (2) the **worker-thread realm**
   boundary — a Worker gets a fresh module registry and its own `process.env` copy.
3. **THE WIRING PROOF CAN NOW GO RED (item 4 / bundle 8b).** The `|| true` tautology is deleted. The
   walker asserts **both** classification directions, widens `canSpawn` to bare `child_process`,
   `createRequire` and dependency-reached spawn (including the SDK), and **inverts the failure
   direction**: unresolvable/bare classifies **spawn-capable-unless-proven-otherwise**. **Residual:** a
   specifier the resolver mis-resolves *confidently* still classifies wrongly; only the unresolvable case
   fails closed.
4. **R1 BATTERY COMMITTED AS STANDING ARTIFACTS (item 7 / bundle 8b).** `test/spawn-shim.test.js` gains
   the round-4 TOCTOU battery (stateful `toString`, prototype chain, stateful getter, Proxy `get` trap,
   `String` object, array value, own `__proto__`) plus the three round-3 attacks — each asserting REFUSED
   **with a raw control** proving an unguarded child does obtain the value. **Residual:** `opts.cwd` and
   `opts.stdio` remain unscanned — uncovered but unexercised.
5. **CLAIMS BOUND AT THE SOURCE (items 2+3 / bundle 8c).** `CUSTODY.md` gains a Ceiling paragraph naming
   raw-launch detection as a matcher family that **widens but does not close** the call-site-shape class,
   with capture-then-scrub named as what covers it at runtime. Sentence 3 of `SANCTIONED_CARRIER_NOTE` is
   corrected (**P2 exempts `spawn-shim.js`, not `model-seam.js`**) and `CARRIER_NOTE_BOUND_SENTENCES` is
   extended to the WHOLE note, closing the `slice(0,2)` carve-out that let it drift. **Residual:** other
   shipped claim strings (server tool descriptions, driver output) remain unbound — the A6 coverage
   ceiling, disclosed and unchanged.
6. **RESOLVED POINTER MANIFEST + TAUTOLOGY LINT (bundle 8e).** `ac-pointer-manifest.json` +
   `scripts/checks/lib/ac-manifest.js` implement β Q2 option (b): generated-by-observation with a
   do-not-edit banner, two checks with honest scopes (product-side resolution everywhere; staleness
   dev-side only), and **skip never reads as pass**. `scripts/checks/no-tautological-assertions.js` lands
   per β Q3, bounded to a named syntactic family (`|| true`, constant-falsy conjunct, literal-predicate
   assertion, `.every`/`.some` constant callback), with a two-direction falsifier and a stated
   **semantic-vacuity ceiling**.
7. **ENGINE MEDIUMs (bundle 8d)** — `src/job-manager.js`, `src/quota.js`, and the cancel/lifecycle/driver
   tests.

## KNOWN AND DISCLOSED — do not file as NEW, but DO test the boundaries

- **AC-8.6 (the product-layer custody self-check) DID NOT LAND THIS ROUND.** It was build-spec item 6 and
  it is **not** in `src/`. `CUSTODY.md:86` says so in the shipped copy, and `check:pointers` reports
  `custody-runtime.test.js::selfcheck-runs-on-user-machine` as `missing-name`. This is a **known,
  recorded miss** — re-confirming it is not a new finding. Whether the *disclosure* is adequate for S2/S5
  IS in scope.
- The scrub closes **env inheritance**. A1 (dependency-initiated behaviour) is unclosable in-repo.
- The static scanners keep their DoD role and stay fail-closed for P1/P4. The named ceiling is **P2's
  raw-launch detection**.
- Four SDK credential vars are outside the recognised set **by operator ruling** (parked), disclosed with
  a standing drift test.
- `createModelSession` has **no production caller** — the sanctioned carrier is DESIGNED, not operating.
- `check:pointers` being RED is by design and disclosed in `package.json#vladPointerLint`.

## FAMILY DISCLOSURE (β-required)

`backend-reviewer`, `qa-reviewer` and `security_claude_hunter` all run **claude-opus-5** and are **ONE
FAMILY, not three votes. A finding all three miss is NOT thereby cleared.** The gemini/agy lane is the
only cross-family judgment; it serves toolless-inline under a ~32KB argv ceiling, is handed complete
files only, and **what it could not see is recorded — its silence on an unseen file is silence, not a
pass.** In the predecessor's round 3 that lane marked two findings `execution_proven` about a file it had
stated it could not read; that miscalibration was caught and those were not weighted as executed. **Only
mark `execution_proven` for something you actually RAN.** No codex lane — credits exhausted, stated as a
gap rather than filled with a substitute.

## OUTPUT — JSON as your FINAL message text, nothing after it

```json
{
  "lane": "<your role>",
  "verdict": "PASS | FAIL",
  "findings": [
    {
      "id": "F-<n>",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "criterion": "S1 | S2 | S3 | S4 | S5 | none",
      "file": "<path>:<line>",
      "claim": "<one sentence>",
      "execution_proven": true,
      "how_proven": "<the exact command you ran and what it printed, or why false>",
      "new_or_reconfirm": "new | reconfirm"
    }
  ],
  "s_criteria_read": {
    "S1": "holds | fails | cannot-assess",
    "S2": "holds | fails | cannot-assess",
    "S3": "holds | fails | cannot-assess",
    "S4": "holds | fails | cannot-assess",
    "S5": "holds | fails | cannot-assess"
  },
  "what_i_could_not_assess": ["<explicit>"]
}
```

`execution_proven: true` requires a command you actually ran, quoted in `how_proven`. **An honest `false`
is worth more than an optimistic `true`.** If you could not run something, say so in
`what_i_could_not_assess` — silence is not a pass.

---

## YOUR LANE — `qa-reviewer` (functional + traceability + integrity, BINDING)

**Working tree — read and run from here:**
`C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine`

You have Read/Grep/Glob/Bash. **Use them.** Run the suite yourself; do not take `271/271` on faith.

### Your three scopes, in priority order for this run

**1 — INTEGRITY (this is where S2 and S5 live, and it is the heaviest scope).**

The predecessor sprint failed its release on exactly this: shipped copy claiming more than its control
delivered. ADR-0041's PROVE/ASSERT boundary says **a proven claim may never share a status token with an
asserted ceiling.**

- Read `CUSTODY.md` end to end. For **every** claim in the Proven section, find the control, confirm it
  is wired into `check:custody`/`check:ship`, and confirm it actually runs. A claim whose control is
  present-but-unwired, or wired-but-vacuous, is an S2 finding.
- **S5 is new and is yours.** Take the residual list from the header (node: builtins; mid-session
  credential is captured-not-ignored; worker-thread realm; confident-mis-resolution in the walker;
  `opts.cwd`/`opts.stdio` unscanned; A6 unbound claim strings; P2 raw-launch matcher-family ceiling;
  AC-8.6 absent). For **each one**, answer: **does it appear in the SHIPPED surface** (`CUSTODY.md`, a
  code header that ships, a `package.json` field, driver output)? A residual that lives only in
  WarpOS-side runtime notes **fails S5**. Give a per-residual table.
- Check the reverse direction too: does the shipped copy assert any residual that is actually **closed**?
  Over-hedging is a smaller defect but it is still an inaccuracy.
- AC-8.6 is absent and `CUSTODY.md:86` discloses it. **Is that disclosure adequate?** Read the
  surrounding text and judge whether a user reading `CUSTODY.md` would come away with a true picture.

**2 — TRACEABILITY.**

- `ac-pointer-manifest.json` + `scripts/checks/lib/ac-manifest.js` are new (β Q2 option b). Verify: is it
  generated-by-observation with a do-not-edit banner? Are the two checks' scopes honestly stated
  (product-side resolution everywhere; staleness dev-side only)? **Does a skip read as pass anywhere?**
  β ruled skip must be `NO_DATA`/RED, never green. Try to make a check skip and see what it reports.
- `npm run check:pointers` is exit 1 with 33/48 resolving. Audit the 15 unresolved: 11 `missing-name`, 4
  `missing-file`. Are they clerical drift or missing WORK? The predecessor's tracker undercounted this
  (claimed 7, actual 15) — **count them yourself and report the number you counted.**
- F-5: does a `verified_by` naming a real file with a missing test node go RED, and is it
  **distinguishable** from a missing file? Construct the case and run it.

**3 — FUNCTIONAL.**

- Run `npm test`, `npm run check:ship`, `npm run check:pointers`. Report each exit code you observed —
  **run each as its own command and read its real exit code; never pipe a gate through `tail`/`head` in a
  `&&` chain.**
- Bundle 8d touched `src/job-manager.js`, `src/quota.js` and the cancel/lifecycle/driver tests. Did those
  changes preserve the job state machine's enumerated transition table and the crash-survivable journal?
  Look for a test that was *weakened* rather than fixed.
- **Watch for tests that flipped green by having their assertion loosened.** Three tests legitimately
  flipped this sprint because the debt they surfaced was paid (the branding test, the env-scrub
  "first statement" assertion, the tautology lint's occurrence count). Each should carry an in-place
  annotation distinguishing "flipped because debt paid" from "flipped because someone wanted green."
  **Verify that annotation exists and is TRUE for each.** If a fourth test flipped without one, that is a
  finding.

### Scope discipline

- Findings only, no refactor proposals.
- `execution_proven: true` only for something you ran, with the command in `how_proven`.
- Put anything you could not assess in `what_i_could_not_assess`. **`NO_DATA` and `t.skip` are not a
  pass** — if a check skipped, say it skipped.
- Leave the worktree clean; verify with `git status --porcelain`.
