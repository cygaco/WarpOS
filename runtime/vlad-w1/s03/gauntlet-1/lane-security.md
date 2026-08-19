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

## YOUR LANE — `security_claude_hunter` (BINDING, ADR-0022 third pass)

**Working tree — read and run from here:**
`C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine`

You have Read/Grep/Glob/Bash. **Use them.** Do not reason from this brief alone — open the files, run the
suite, run mutations. A finding you can execute is worth ten you can only argue.

### What you are hunting

The sprint's whole thesis is **capture-then-scrub**: remove denylisted values from `process.env` at
startup so no child can inherit them **regardless of spawn shape**. Three prior rounds died because a
regex-over-raw-text scanner was defeated by an unbounded family of call-site shapes. The scrub is the
shape-independent answer. **Your job is to break it, or to establish honestly that it holds.**

Attack it as a whole, not as a checklist:

1. **Ordering.** The A2/A3 closure tests assert each entry statically imports exactly one specifier and
   the closure is {entry, bootstrap.js, env-scrub.js}. Is that assertion *actually load-bearing*? Can you
   construct a path where something evaluates before `initCredentialCustody()` runs and reaches a real
   credential — a `node:` builtin side effect, a loader hook, `--import`/`--require`, an ESM
   `import.meta` trick, a package `exports` condition, a conditional/re-export chain the walker's
   specifier extractor does not see?
2. **The re-scrub choke-point.** β made re-scrub-on-call conditional on `auditedSpawn()` re-invoking the
   scrub before EVERY launch. **Verify that claim by execution**: is there a spawn path in the shipped
   package that reaches a real child WITHOUT going through `auditedSpawn`? If yes, the "CLASS" label is
   wrong and it is an INSTANCE — that is an S3/S2 finding.
3. **Absorption semantics.** A name whose captured slot already holds a real value is never overwritten.
   Probe: can you get the scrub into a state where a credential is left present in `process.env` at the
   moment a child launches? Race it, re-provision it, provision under a differently-cased name, provision
   a name that is credential-shaped but not on `CREDENTIAL_ENV_NAMES`.
4. **The R1 battery (S1).** `test/spawn-shim.test.js` now carries the TOCTOU battery plus the round-3
   attacks. For each: does it assert REFUSED **and** carry a raw control proving an unguarded child DOES
   obtain the value? A battery whose "control" does not actually leak proves nothing. **Run at least
   three of them and say which.** Then try a carrier the battery does NOT cover — `opts.cwd`,
   `opts.stdio`, a Symbol-keyed property, a getter on `args`, `env` as a Proxy with an `ownKeys` trap.
   **An execution-proven leak against a green gate fires S1 and stops the release.** Do not inflate one;
   do not soften one either.
5. **Mutation (S3/S4).** Actually perform the mutations. Delete the `initCredentialCustody()` call from
   `src/server-entry.js`, run `npm test`, record whether it goes RED, then restore. Do the same for
   `driver/host-free-driver.js`. Do the same for one guard in `spawn-shim.js`. **Report the exact
   commands and exact output.** `git stash` / `git checkout --` afterwards — leave the tree exactly as you
   found it and verify with `git status --porcelain`.
6. **The five falsifiers (S4).** F-1 three spawn spellings classify spawn-capable · F-2 deleting the
   scrub call from `server-entry.js` → RED · F-3 credential provisioned after the first
   `initCredentialCustody()` call · F-4 reword the previously-unbound carrier sentence → lint RED · F-5 a
   `verified_by` naming a real file but a missing test node → RED, and distinguishable from a missing
   file. **Present AND observed RED** is the bar. A fixture that exists but has never been shown to fail
   does not satisfy S4.

### Scope discipline

- Do not propose refactors. Findings only.
- Severity is about the *engine's* exposure, not aesthetics.
- If you cannot run something (no network, no credentials, Windows path issues), put it in
  `what_i_could_not_assess` verbatim. **Silence is not a pass.**
- Leave the worktree clean. Any mutation you perform, you revert.
