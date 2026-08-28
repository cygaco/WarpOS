# Lane evidence — `security_claude_hunter` (BINDING) — S-VLADW1-03 gauntlet-3 (QUALIFYING RUN)

Shape: `in-process-agent` · claude-opus-5 · elapsed 846370 ms · 43 tool_uses · agentId `ac654cbb5ca59cf2e`
Target: commit `b2583d6` (`b2583d6bd1382399e404946a84e53e3a90f519f7`), verified by the lane before AND after.
Brief: `lane-security.md`. Isolation: third and last of three SERIALIZED lanes, live worktree.

**Verdict: FAIL.** S-criteria: **S1 HOLDS · S2 FAILS · S3 holds · S4 cannot-assess · S5 cannot-assess.**
Worktree clean at finish — conductor re-verified independently: HEAD `b2583d6`, `git status --porcelain --
engine/` 0 lines, suite 318 pass / 0 fail / 0 skipped / 0 todo, exit 0. Every probe file removed.

**S1 IS RE-ESTABLISHED, NOT CITED.** Both other lanes returned S1 `cannot-assess` and said S1 rested
entirely on this lane. It ran the attacks and returned **S1 holds**.

## THE FINDING OF THIS ROUND — F-1, MEDIUM, S2, NOVEL, EXECUTION-PROVEN

`engine/src/spawn-shim.js:262` normalizes its arguments as:

    normArgs = Object.freeze(args.map((arg) => String(arg)))

**`args.map` is caller-controlled.** An Array SUBCLASS whose own `map()` ignores the callback routes the
wrapper's single normalization point through hostile code, so the returned elements are never actually
stringified. The scan then calls `String()` on them once (benign value) and **Node calls `toString()` AGAIN
inside `spawn()` (secret value)**. That is the T8/T4 TOCTOU reopened through a door the T4/A3 fix did not
close.

Run against the real wrapper at `b2583d6` with every gate green (318/318, `check:ship` exit 0):

    class HostileArgs extends Array { map() { return ['-e', PRINT, stateful]; } }
    // stateful.toString() -> '--benign-flag' on call 1, 'KEY:<decoy>' on call 2

    decoy matches live shape 'api-key'? true
    {"event":"audited-spawn","command":"...node.exe","argCount":3}
    WRAPPER REFUSED? NO -- real child returned
    toString() calls = 2   (1 = scan time, 2 = spawn time)
    child exit code = 0
    CHILD ARGV CARRIES THE SECRET-SHAPED VALUE? YES
    stdout: CHILD_ARGV=C:\Program Files\nodejs\node.exe KEY:<REDACTED-DECOY>

A first variant smuggling `--api-key=<decoy>` produced node's own stderr `bad option:
--api-key=<REDACTED-DECOY>`, exit 9 — the same crossing, echoed by the child itself. **argv is
world-readable to any same-user process.**

**Correctly graded MEDIUM/S2, NOT S1** — the lane applied the brief's grading rule itself: it needs a
hostile caller already holding the plaintext and there is no shipped call site of this shape, so it proves
the **CONTROL is defeatable and the CLAIM untrue**, not that the package leaks. It falsifies the shipped
PROVEN-tier sentence at `CUSTODY.md:59-62`.

## THE SECOND-ORDER REGRESSION — fix attempt 2 made a false claim GATE-ENFORCED

Verbatim from the lane:

> Fix attempt 2 (bundles 10b/10f, "bind every Asserted and Ceiling paragraph BY DERIVATION") **PINNED
> VERBATIM the two sentences findings F-1 and F-2 falsify.**
> `grep -c "separately refuses, at spawn time, any call whose" scripts/checks/custody-claim-lint.js` → 1
> `grep -c "refuse a secret-shaped value across four channels" scripts/checks/custody-claim-lint.js` → 1
> **`check:ship` now REQUIRES a sentence I falsified by execution to be present verbatim on the shipped
> surface, so an honest correction of the claim turns the ship gate red until the lint's bound set is edited
> in the same change.**

And its own scrupulous scoping of that: the untruth itself is **not** a fix-attempt-2 regression —
`git diff 0732cd8..b2583d6 -- CUSTODY.md src/spawn-shim.js` shows the argv sentence unchanged across the
range and the four-channel paragraph only re-wrapped (identical words either side) — **but making a false
claim gate-enforced is new at this commit.**

## Remaining findings

| id | sev | crit | file | claim |
|---|---|---|---|---|
| F-2 | MEDIUM | S2 | `CUSTODY.md:113-115` | The cwd/stdio Ceiling asserts the runtime checks "refuse a secret-shaped value across four channels ... and a secret-shaped value in `command`/`args`". The fourth channel does not refuse F-1's call. The "four refused, two not" structure is what makes it load-bearing — it invites the reader to treat command/args as closed. Same execution as F-1. |
| F-3 | MEDIUM | S2 | `src/spawn-shim.js:411-415` and `:256-260` | The shipped comment asserts a structural impossibility that is false: *"spawn() receives ... the EXACT SAME frozen objects every check above just scanned ... 'Check one object, spawn a different one' is now structurally impossible for command/args, the same guarantee normalizeEnv already gave `env`."* The **env** half IS genuinely structural (normalizeEnv builds the flat object itself from `Object.create(null)`). The **args** half is not: the wrapper delegates normalization to `args.map`, which the caller owns. Proven by `toString()` firing exactly twice — if the claim held it would fire once. `spawn-shim.js` is in `package.json#files`, so this is a shipped surface. |
| F-4 | MEDIUM | **S3** | `driver/host-free-driver.js:88` | **CONTRIBUTING, does not fail S3.** The driver entry's scrub call is proven load-bearing only at the TEXT/AST level, never at runtime. Semantically neutering it (`initCredentialCustody([])`) changes nothing observable — the driver's graph reaches `model-seam.js`, whose own module-body call scrubs anyway — so only text/AST classifiers notice. Mutant M2: probe reported `BEFORE: AK=true OT=true` / `AFTER: AK=false OT=false` (still scrubbed), `check:ship` exit 0, and exactly ONE test went red (the A1 walker classifier). M3 (literal deletion): still scrubbed at runtime, 3 text/AST tests red. By contrast M1 on `server-entry.js:107` produced 4 reds **including runtime ones** (A4 real-entry decoy probe; F-2 mutant proof). The consequence no text classifier can see: under the neutering the scrub moves from evaluation position 3 to after the Agent SDK's own module body. |
| F-5 | MEDIUM | S2 | `CUSTODY.md:127` vs `test/credential-custody-decoy.test.js:45-77` | P3's shipped heading reads *"A runtime negative fixture proves the scrub, and proves its own removal goes red"*. The second half is true and was re-verified. The FIRST half appears not to be: the fixture spawns through `auditedSpawn` with an explicit allowlist env of `{PATH, SystemRoot}` only, and an explicit env **replaces** the child environment — so an ambient decoy cannot reach the child whether or not any scrub ran. It proves the EXPLICIT-ALLOWLIST contract, not the scrub. The file's own header says as much. Matters because **this is the ONE test file `package.json#files` ships to a user's install.** `execution_proven: false` — the lane says plainly it did not build the harness that would run the fixture with the scrub genuinely no-op'd. |
| F-6 | LOW | S5 | `CUSTODY.md:137-145` | The CLASS-form residual recorded in ROUND-RECORD.md §4 is absent from the shipped surface; the P3 Ceiling discloses only the INSTANCE. `grep` for the class-form wording → zero matches. Reported as a fact for α; the lane explicitly does not rule on S5. **Independently matches the qa lane's F-6.** |
| F-7 | LOW | none | `spawn-shim.js:407` vs `model-seam.js:616-620` | **POSITIVE OBSERVATION**, filed so it is not mistaken for an unexamined gap. The 10d CLASS claim is narrower than a reader might take it: the re-scrub choke-point is `auditedSpawn` ONLY, and the SDK's own subprocess via `query()` does not pass through it. The lane attacked this and **it does NOT leak**: `model-seam.js` supplies `env` LAST in `{ ...queryOptions, env }` so a caller cannot override it, and the SDK uses the caller's env exclusively rather than merging `process.env`. That path is protected by the explicit-env contract, not by the re-scrub — two different arguments, worth stating separately. |

## Also checked and found CLEAN (recorded so it is not re-derived)

- The 10a lexer fix does not regress the invocation control — M1's semantically-neutered call was caught by
  4 standing tests, including runtime ones.
- **The 10d full-history re-scrub survived attack**: the lane searched for a name that enters `capturedNames`
  but escapes the delete loop and found none — the duplicate-name offset against
  `nextNamesSet.size !== capturedNames.length` is covered because a genuinely new name always sets
  `capturedChanged` via the `else if (!hasOwnCaptured)` branch. (Note: this is the same region where **agy**
  found the absorption/deletion asymmetry from the opposite direction — the two are compatible, agy's is
  about a name being deleted WITHOUT absorption, not about escaping deletion.)
- No `worker_threads`, `node:vm`, `execSync`, `eval` or `process.binding` anywhere in `src/`, `driver/` or
  `scripts/`.

## `what_i_could_not_assess` (verbatim in substance)

- **S4 in full.** It drove THREE falsifiers RED itself under real mutation: **F-2** (M1 on
  `server-entry.js:107`), **F-3** (deleting the ABSORB assignment at `env-scrub.js:314` — both the
  idempotence-semantics and mutant-proof tests went red, exit 1), and **AC-8.4** (mutating `sentinelHook` to
  always return `{leaked:false, keys:[]}` — the mutation twin went red, exit 1, **re-verified at close
  rather than cited**). F-1, F-4 and F-5 are present, committed, self-mutating and non-skipped (0 skipped /
  0 todo) but it did NOT independently drive each to RED. *"The qa lane owns S4; do not read my
  'cannot-assess' as a pass."*
- **S5 in full** — it does not have the build spec's residual list; F-6 is one data point, not an adjudication.
- **S2 beyond its own four findings** — it checked only the claim strings its attacks touched.
- **The SDK's real child** — never executed a real `query()`; F-7's SDK reasoning is read, not observed;
  closing it needs live auth and a real billable API call, which exceeds the lane's authority.
- **`opts.cwd` / `opts.stdio`** — disclosed-and-ceiling'd, so per the discriminators a finding there is a
  re-confirmation; it spent the budget on the UNDISCLOSED channel (args) instead. It cannot say whether the
  cwd finding still reproduces.
- **Platform** — every execution was win32, node v24.16.0. POSIX delete-loop and `process.env`
  own-property semantics not exercised.
- **The full claim-lint rule set** — it confirmed the two sentences it falsified are pinned but did not
  review the other bound paragraphs for further untruths. *"Given F-1/F-2, that is the obvious next place to
  look and nobody has looked."*
