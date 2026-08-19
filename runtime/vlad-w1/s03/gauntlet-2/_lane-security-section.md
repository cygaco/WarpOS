
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
