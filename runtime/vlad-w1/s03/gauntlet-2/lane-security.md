# GAUNTLET — sprint S-VLADW1-03, vlad engine. **Fix attempt 1's successor run.**

Evidence directory: `runtime/vlad-w1/s03/gauntlet-2/`. Commit under review: **`0732cd8`**, branch
`wt/S-VLADW1-01-engine`, worktree
`C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine`.
Predecessor evidence dir: `runtime/vlad-w1/s03/gauntlet-1/`.

**This run is NOT terminal, and knowing that should make you MORE willing to file a real finding, not
less.** Per β row 305 (`7c05e9d1`) the gate-bearing run is the gauntlet whose evidence directory follows
**fix attempt 2**; this directory follows fix attempt **1**. So S1–S5 are measured here but do not fire
terminally. There is one more fix attempt after this one — which means a finding you file now can still
be FIXED. A finding you soften now is one nobody gets to fix.

**Your verdict does not decide the outcome.** β pre-committed S1–S5 before any result existed, and α
applies them. Lane verdicts do not decide it in either direction.

- **S1** — zero **execution-proven** leaks, re-established, each attack carrying a **raw control** proving
  an unguarded child DOES obtain the value.
- **S2** — zero PROVEN-over-unproven in shipped copy **at close** (truth-at-close by reviewer read).
- **S3** — the wiring proof is RED-on-removal **OBSERVED UNDER MUTATION for BOTH entries**, and the walker
  asserts **both directions**.
- **S4** — all five falsifier fixtures present **AND observed RED**, carrying the predecessor sprint's R4
  (AC-8.4 re-verified).
- **S5** — **every named residual travels to the recorded/shipped surface.** WarpOS-side-only disclosure
  does NOT satisfy it.

**β's discriminators, fixed in advance:** re-confirming an already-counted finding is **not** new; a new
finding inside an already-ceiling'd-and-disclosed class does **not** fire S1 unless it is execution-proven
against a green gate; **`NO_DATA` and `t.skip` are NOT a pass.**

## GATE STATE AT `0732cd8` — verified by the conductor immediately before dispatch

- `npm test` → **294 pass / 0 fail / 0 skipped / 0 todo, exit 0**
- `npm run check:ship` → **exit 0**
- `npm run check:pointers` → **exit 1, unchanged at 33/48** (11 missing-name, 4 missing-file). Still
  deliberately OUT of `check:ship` per β Q2. **AC-8.6 still did not land** — it was not in fix attempt 1's
  scope.

## WHAT CHANGED SINCE GAUNTLET-1 (`a9e6708` → `0732cd8`, 10 files, +1146/−85)

Five bundles, strictly disjoint file ownership. **This is what you are testing.**

1. **S3 — the walker now asserts INVOCATION, not module reachability** (`test/env-scrub.test.js`).
   Gauntlet-1 proved that deleting the driver's scrub call left EVERY gate green, because the proof asked
   `visited.has(envScrubPath)` — whether the module was *reached*, not whether the function was *called* —
   and the driver reaches it three independent ways. It is now a **class-level** assertion over every
   derived entry: at least one visited file must contain a real call, and **no visited file may import the
   binding without calling it itself**. Both mutants (driver, server) are committed as re-runnable tests.
   **Named residual:** aliased imports (`as x`), indirect calls through a re-bound reference, and a
   call-shaped occurrence inside a comment or string are NOT covered.
2. **S3/S2 — the extractor's two fail-open shapes closed as a CLASS**
   (`test/entry-bootstrap.test.js`). It strips comments first, then matches the whole source with no line
   anchors, bounding the `from` search so it cannot cross a `;`. This closes both
   two-static-imports-on-one-line (which let an entry statically import an arbitrary extra module while
   A2/A3 stayed green) and both block-comment spellings.
3. **S2 — the presence-test is now a TRUTH-test.** `source.includes(RE_DERIVED_CLAIM)` certified a
   sentence that was FALSE. It is replaced by an **executed** evaluation-order observation — a real
   `node`-run mirror of the shipped chain — plus a committed mutant-proof. The false sentence *"runs
   before any other module in this package's graph evaluates"* is **gone from both entries**
   (`grep` → 0 hits) and replaced with what is true: only `src/env-scrub.js` (zero imports) and
   `src/bootstrap.js` (re-export only) evaluate first; `node:` builtins still resolve first.
4. **β Q3 — the tautology lint is fail-CLOSED and WIRED**
   (`scripts/checks/no-tautological-assertions.js`, `package.json`). Gauntlet-1 proved it printed "OK" and
   exited 0 on an absent scan root having scanned nothing, and that no npm script invoked it. Absent or
   unreadable root, or zero files walked, now → **`NO_DATA`, exit non-zero**. It reports the file count.
   It is wired into `check:ship`. An unreadable SUBdirectory is **reported-but-non-fatal** (surfaced as a
   WARN into `unreadableDirs`) — a deliberate choice, documented in-code with its tradeoff named.
5. **S5 — the four named residuals moved onto the SHIPPED surface** (`CUSTODY.md`), as P2 Ceilings plus
   new **A7** and **A8**: `opts.cwd`/`opts.stdio` unscanned; the walker's confident-mis-resolution
   converse; `node:` builtins named as a residual in their own right; and process-level **preload**
   (`NODE_OPTIONS`, `--require`, `--import`). Rotation is stated with the corrected valence — *silently
   IGNORED by the fallback, not silently reflected by it.* `CUSTODY.md:87` (which asserted a test node
   that does not exist) and `:66` are corrected.
6. **Robustness — the captured snapshot is prototype-proof** (`src/env-scrub.js`,
   `test/env-scrub-capture.test.js`). Built with a null prototype plus own-property guards, so
   `__proto__`/`toString`/`constructor` can no longer alias; `getCapturedCredential` is contracted to
   **string-or-`undefined`**. The deeper root cause was also fixed: `process.env["toString"]` does not read
   as `undefined`, it falls through to the inherited **method**, so `readOwnEnvValue()` gates both capture
   paths.

## CONDUCTOR-VERIFIED INDEPENDENTLY — and you should try to break it

I mutated the **real** `driver/host-free-driver.js` to delete its scrub call and ran the suite. The
class-level assertion went RED:

> `AssertionError: entry point(s) that can spawn a child but do not ACTUALLY INVOKE
> initCredentialCustody in their own static import graph: ["driver/host-free-driver.js (imports
> initCredentialCustody without calling it: driver/host-free-driver.js)"]`

Tree restored byte-identical, 294/294. **That is the mutant that stayed green last round.** Do not take
my word for it — re-run it, and then attack the assertion's own blind spots (the aliased-import and
comment/string residuals it discloses).

## KNOWN AND DISCLOSED — do not file as NEW, but DO test the boundaries

- **AC-8.6 still has zero artifacts.** Known, recorded, out of fix attempt 1's scope. Not a new finding.
- `check:pointers` RED at 33/48 is by design and disclosed.
- The scrub closes **env inheritance**. A1 (dependency-initiated behaviour) is unclosable in-repo.
- P2's raw-launch detection remains the one named matcher-family ceiling.
- Four SDK credential vars are parked by operator ruling, disclosed with a standing drift test.
- `createModelSession` has no production caller — the sanctioned carrier is DESIGNED, not operating.
- Rotation keeps the stale credential **by decision**, not by accident; it is now disclosed on the shipped
  surface. Argue the disclosure is inadequate if you think so — but it is not an undisclosed defect.

## FAMILY DISCLOSURE (β-required)

`backend-reviewer`, `qa-reviewer` and `security_claude_hunter` all run **claude-opus-5** and are **ONE
FAMILY, not three votes. A finding all three miss is NOT thereby cleared.** The gemini/agy lane is the
only cross-family judgment; it is served toolless-inline under a ~32KB argv ceiling, handed complete files
only, and **what it could not see is recorded — its silence on an unseen file is silence, not a pass.**
In gauntlet-1 that lane found two real defects all three Claude lanes missed, both confirmed by
execution. **Only mark `execution_proven` for something you actually RAN.** No codex lane — credits
exhausted, stated as a gap rather than filled with a substitute.

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
  "regressions_from_fix_attempt_1": ["<anything the fixes BROKE, or empty>"],
  "what_i_could_not_assess": ["<explicit>"]
}
```

`execution_proven: true` requires a command you actually ran, quoted in `how_proven`. **An honest `false`
is worth more than an optimistic `true`.** `regressions_from_fix_attempt_1` matters: five bundles edited
this tree in parallel, and a fix that broke something else is exactly what a successor run is for.

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
