# Lane evidence — `security_claude_hunter` (BINDING) — S-VLADW1-03 gauntlet-1

Shape: `in-process-agent` (harness Agent tool, synchronous) · provider `claude` · model `claude-opus-5`
Elapsed: 754235 ms · tool_uses: 41 · agentId `aade394569e5ca3c7`
Target: commit `a9e6708`, worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine`
Brief: `runtime/vlad-w1/s03/gauntlet-1/lane-security.md`

**Verdict: FAIL.** S-criteria read: S1 holds · S2 holds · S3 **fails** · S4 holds · S5 **fails**.

The lane returned the tree clean (`git status --porcelain` no tracked modifications, `git diff --stat`
empty, `git rev-parse HEAD` = `a9e670869a162e6b6a5ec566cabc69a2f7ca17d0`, `npm test` back to 271/271).

## Verdict JSON (verbatim)

```json
{
  "lane": "security_claude_hunter",
  "verdict": "FAIL",
  "findings": [
    {
      "id": "F-1",
      "severity": "MEDIUM",
      "criterion": "S3",
      "file": "engine/driver/host-free-driver.js:49",
      "claim": "Deleting the driver entry's own `initCredentialCustody(CREDENTIAL_ENV_NAMES);` call leaves EVERY gate green — the driver's scrub is not load-bearing and no control anywhere detects its removal, so S3's required RED-on-removal is observed for only ONE of the two entries.",
      "execution_proven": true,
      "how_proven": "Ran `sed -i 's/^initCredentialCustody(CREDENTIAL_ENV_NAMES);$/\\/\\/ MUTANT-M2-REMOVED/' driver/host-free-driver.js` then `npm test` -> 'tests 271 / pass 271 / fail 0 / skipped 0', EXIT=0; `npm run check:ship` -> EXIT=0; `npm run check:custody` -> EXIT=0; `node --test test/entry-bootstrap.test.js` -> 'tests 15 / pass 15 / fail 0'. Control comparison: the SAME mutation on src/server-entry.js (`npm test`) -> 'pass 268 / fail 3' naming A4, the Z6 lever, and F-2. Cause isolated by execution: with BOTH entries' calls removed, `node --test test/env-scrub.test.js` still reports PASS for 'per-entry-point (driver/host-free-driver.js): importing the real driver module leaves process.env scrubbed' — the driver is scrubbed by src/model-seam.js:330's top-level `initCredentialCustody(ENV_DENYLIST);`, reached via the driver's dynamic import at host-free-driver.js:66. Root cause read in test/env-scrub.test.js:460, where the A1 wiring proof computes `const reachesScrub = visited.has(envScrubPath);` — REACHABILITY of the module, not INVOCATION of the call — and the driver reaches env-scrub.js three independent ways (bootstrap.js, model-seam.js, spawn-shim.js). This is precisely the 'scrub rides in on an import it would need for an unrelated reason' anti-pattern that src/env-scrub.js's own header (lines 122-132) names as what makes a mutant proof meaningless; the reasoning was applied to server-entry.js but not to the driver. Tree restored: `git diff --stat` empty."
    },
    {
      "id": "F-2",
      "severity": "MEDIUM",
      "criterion": "S5",
      "file": "engine/src/spawn-shim.js:383",
      "claim": "The named `opts.cwd`/`opts.stdio`-unscanned residual appears NOWHERE in the shipped surface (absent from CUSTODY.md, spawn-shim.js's 130-line header, and package.json), and it is no longer 'unexercised' — a secret-shaped value rides through `opts.cwd` into a real child while all gates are green.",
      "execution_proven": true,
      "how_proven": "Disclosure gap: `grep -rn \"unscanned|not scanned|un-scanned\" src/ driver/ CUSTODY.md package.json scripts/` returned only spawn-shim.js:61 (about argv, now CLOSED by Check 3), CUSTODY.md:47 (argv vs the STATIC enforcer), and an unrelated no-held-secret-in-surface.js line; `grep -in \"cwd|stdio\" CUSTODY.md` -> 'NONE FOUND IN CUSTODY.md'. The only occurrences of `opts.cwd`/`opts.stdio` in the shipped tree are the two pass-through lines src/spawn-shim.js:383 and :385 themselves. Exercise: ran a probe against the REAL wrapper, which printed 'sanity: DECOY is secret-SHAPED = true', then 'PROBE1 opts.cwd -> child observed: DECOY PRESENT IN CHILD cwd' (auditedSpawn ACCEPTED the call and a real child's process.cwd() carried the secret-shaped value that Checks 2/2b/3 refuse in env keys, env values, command and args), and 'PROBE2 opts.stdio -> ACCEPTED stdio:inherit (unscanned, child inherits parent fds)'. Honest scope: the value is CALLER-SUPPLIED, not a credential the engine held — 'PROBE3 held-credential reachable ... = undefined (nothing held)' — so this is an inconsistency in the wrapper's own name-independent shape-refusal surface (4 channels refused, 2 not), NOT an escape of a held credential. I therefore do NOT read it as firing S1."
    },
    {
      "id": "F-3",
      "severity": "LOW",
      "criterion": "none",
      "file": "engine/scripts/checks/branding-identity-enforcer.js",
      "claim": "`check:branding` is non-deterministic: one run reported a branding VIOLATION (exit 1) whose real cause was an internal structural-probe crash, not any branding defect — a ship gate that can attribute an internal error to a policy violation is a false-signal channel in both directions.",
      "execution_proven": true,
      "how_proven": "During the first `npm run check:ship` under mutation M2 the run printed '[branding-identity-enforcer] RED branding-identity-enforcer/structural-probe-import-failed: could not import \"src/server-entry.js\" for the RULE 2 structural attribution probe: Identifier JobManager has already been declared' and 'branding-identity-enforcer: 1 violation(s).', CHECK_SHIP_EXIT=1. Under byte-identical conditions (same M2 mutation, src/server-entry.js verified byte-identical to HEAD via `diff` and `git diff` empty) two consecutive `npm run check:branding` runs both printed 'branding-identity-enforcer: OK' with EXIT=0, and the final `npm run check:ship` under M2 returned EXIT=0. So the red did not reproduce. I could NOT determine the root cause of the one-off crash."
    },
    {
      "id": "F-4",
      "severity": "LOW",
      "criterion": "none",
      "file": "engine/test/spawn-shim.test.js:390",
      "claim": "T7's raw control is gated behind `if (process.platform === \"win32\")`, so on any non-Windows runner the control silently disappears while the test still reports PASS — a green with no control behind it, on the one attack class (case-variant key name) that needs no secret-shaped pattern at all.",
      "execution_proven": false,
      "how_proven": "FALSE by honest scope: I have only a win32 runner. I executed `node --test test/spawn-shim.test.js` on win32 -> 'tests 14 / pass 14 / fail 0', where T7's control DID fire and genuinely asserted the leak. The claim that the control vanishes off-Windows is a CODE READ of spawn-shim.test.js:390-403, not an execution — I could not run a POSIX runner to observe it. The test's own comment discloses the platform scoping, so this is a partially-disclosed ceiling, not a hidden one."
    }
  ],
  "s_criteria_read": {
    "S1": "holds",
    "S2": "holds",
    "S3": "fails",
    "S4": "holds",
    "S5": "fails"
  }
}
```

## `what_i_could_not_assess` (verbatim, load-bearing — read before weighing this lane)

1. **S1 basis and its limit.** Executed the full item-7 battery (`node --test test/spawn-shim.test.js` →
   14/14 pass, 0 skipped) and read T7, T8 and T12 line by line — each carries a genuine raw control
   asserting the unguarded child DOES obtain the value (T8 asserts `rawStdout.includes(DECOY)` AND
   `controlCalls === 2`), so these are not strawman controls. Found no execution-proven escape of a HELD
   credential: attacks on Symbol-keyed env properties, Proxy `get`/`ownKeys` traps, `args` getters and
   stateful `toString` are structurally closed by the normalize-once-then-freeze discipline
   (`src/spawn-shim.js:243-257`), verified by read against Node's own `for...in` env enumeration.
   **S1 = holds is an honest read, not a default.**
2. Did **not** execute the Agent SDK's real launch path (no credentials; `createModelSession` has no
   production caller), so the A1 dependency-initiated-spawn residual is assessed BY READ ONLY. The claim
   that `auditedSpawn` is the sole in-repo launch choke-point IS execution-backed: a comment-stripped
   scan of every `.js` under `src/`, `scripts/` and `driver/` returned raw launch call-sites in
   `src/spawn-shim.js` ONLY.
3. Did **not** read all 16,590 bytes of `CUSTODY.md`. S2 = holds rests on the four `**Status:** PROVEN`
   clauses and their ceiling paragraphs (including the argv ceiling at :47 and the AC-8.6 ceiling at
   :82-88, **which IS present in the shipped copy and does satisfy S5 for that residual**), plus targeted
   greps confirming `CUSTODY.md` makes no claim about a mutant proof, "both entry points", or
   "load-bearing" that F-1 would falsify. A full line-by-line S2 read was not performed.
4. The **worker-thread realm** residual was NOT tested by execution — nothing in the tree spawns a Worker.
5. The **`node:` builtins-resolve-first** residual was NOT attacked by execution (reaching it needs a
   loader hook, `--import`/`--require` or `NODE_OPTIONS`, i.e. control of the launch command line,
   outside the shipped launch shape). ESM ordering assessed by read: both entries hold exactly one static
   import (`server-entry.js:66` / `host-free-driver.js:48`) with the scrub call as the literal next
   statement.
6. The walker's own disclosed residual ("a specifier the resolver mis-resolves CONFIDENTLY still
   classifies wrongly") lives in `test/env-scrub.test.js` comments, and that file **does not ship**
   (`package.json#files` carves in only `test/credential-custody-decoy.test.js`). The lane did not
   resolve whether S5 reaches a dev-time test's ceiling — **it flags rather than rules.** The
   S3 walker-both-directions half DOES hold: the B1/B2 non-vacuity control at `env-scrub.test.js:482`
   asserts both `some(canSpawn)` and `some(!canSpawn)` and is green, and the `|| true` tautology is
   genuinely deleted.
7. `check:pointers` RED-by-design was not re-litigated; confirmed only that its two lever tests
   distinguish missing-name from missing-file and the committed manifest reports 33/48 with 11
   missing-name and 4 missing-file.
8. **Scope-contract compliance:** every mutation reverted; final state verified by
   `git status --porcelain`, `git diff --stat` (empty), `git rev-parse HEAD`, and `npm test` at 271/271.
