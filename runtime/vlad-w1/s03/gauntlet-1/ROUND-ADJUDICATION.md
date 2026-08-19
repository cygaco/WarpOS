# S-VLADW1-03 — gauntlet-1 (first qualifying run) — CONDUCTOR ADJUDICATION

Conductor: Alex ε · commit under review `a9e6708` · evidence dir `runtime/vlad-w1/s03/gauntlet-1/`
Release rule: **S1–S5**, pre-committed by β at row 305, msg_id `7c05e9d1`, BEFORE any of these results
existed. **α applies the rule. This document supplies the evidence; it does not rule.**

## Roster and liveness (β's telemetry gate — absence is death, not a pass)

| Lane | Shape | Model | Record | Verdict |
|---|---|---|---|---|
| `security_claude_hunter` | in-process-agent | claude-opus-5 | `d-mt0np762-dd1fe97e` `ok:true` | **FAIL** |
| `qa-reviewer` | in-process-agent | claude-opus-5 | `d-mt0np78f-b4957840` `ok:true` | **FAIL** |
| `security-reviewer` (agy) | subprocess-cross-provider | gemini-3.1-pro-high | `ok:true` (2nd dispatch) | **FAIL** |
| `backend-reviewer` | in-process-agent | claude-opus-5 | `d-mt0o5sm5-e6c15fac` `ok:true` | **FAIL** |

**Two dispatch failures are on the record and neither is a verdict:**

1. **agy died on its first dispatch.** Fired with cwd = the engine worktree, which has no
   `.claude/agents/_org/role-registry.json`; the provider derive fell back to its literal, resolved
   `openai`, and returned `ok:false, fallback:true`. Re-fired from the WarpOS canonical root → correct
   `antigravity` resolution and a real verdict. `gauntlet-verify` reports this role as `fell-back`
   **because that first dead record is still in the window** — it is a dispatch artifact, not a
   provider-quality signal.
2. **`backend-reviewer` returned a truncated non-verdict** — its final message was the single line
   "Now S2/S5 — do the named residuals actually reach the shipped surface?" instead of the JSON. That is
   **no verdict and no completion record**; per the gate, `no-record` = the lane died, never a pass. It
   was resumed, and separately **re-dispatched with a narrowed three-task scope** so it would finish
   inside its bound. The narrowed run returned a full verdict and is what is recorded; it declared its
   exclusions explicitly rather than papering over them.

**`gauntlet-verify` final: PASS** — all four required roles produced a well-formed completion record
(`gauntlet-verify.txt`; exit code read directly, not through a pipe). The `fell-back` flag on
`security-reviewer` is the first dead dispatch still sitting in the window, not a provider-quality
signal. **All four lane verdicts are FAIL.**

## Evidence read against S1–S5

**S1 — zero execution-proven leaks, re-established. → HOLDS (on present evidence).**
The security lane executed the full item-7 battery (`node --test test/spawn-shim.test.js` → 14/14, 0
skipped) and audited T7/T8/T12 line by line, confirming each carries a genuine raw control asserting an
unguarded child DOES obtain the value (T8 asserts `rawStdout.includes(DECOY)` AND `controlCalls === 2`) —
these are not strawman controls. Its own attacks (Symbol-keyed env, Proxy `get`/`ownKeys`, `args` getters,
stateful `toString`) are structurally closed by the normalize-once-then-freeze discipline at
`spawn-shim.js:243-257`. The qa lane found no leak either, on a weaker basis it stated honestly.
**No finding in this round establishes a real child obtaining a real HELD secret against a green gate.**
The one candidate — the security lane's F-2 `opts.cwd` probe — was filed by that lane itself as NOT firing
S1, because the value is caller-supplied rather than a credential the engine held. I concur with that
scoping.

**S2 — zero PROVEN-over-unproven in shipped copy at close. → FAILS.**
- `package.json:22` is internally self-contradictory: it calls eleven unresolved pointers "clerical NAME
  drift (the substance exists under a different test-node name)" and then admits one of the eleven is
  "missing WORK, not a missing name". Honest split: ten drift + one missing work + four missing files.
- `CUSTODY.md:87` asserts "the test-node name reserved for it lives in `test/custody-runtime.test.js`".
  **It does not** — `grep -c` returns 0, and `check:pointers` classifies it `missing-name`. Shipped copy
  asserts a presence that is absent.
- `CUSTODY.md:66` re-introduces the weak "first statement" framing that this very sprint's bundle 8a
  repudiated, and names only `server-entry.js`, leaving its own raw-launch conclusion unsupported for the
  driver entry (under-claiming — LOW, but it is an inaccuracy in the same paragraph family).
- **The backend lane's F-2 is the heaviest S2 item in the round, and it is execution-proven.** The
  RE-DERIVED replacement claim shipped in BOTH entry headers — "initCredentialCustody() runs before any
  other module in this package's graph evaluates" — **is false as written.** `src/bootstrap.js` and
  `src/env-scrub.js` are both modules in this package's graph and both evaluate to completion first;
  a faithful three-file mirror of the shipped chain printed them evaluating at steps 2 and 3, with the
  scrub at step 4. **This is the predecessor's exact defect class reproduced one hop out** — the sprint
  replaced a false "FIRST STATEMENT" claim with a differently-false claim. Worse, the test that certifies
  it (`test/entry-bootstrap.test.js:271`) asserts only `source.includes(RE_DERIVED_CLAIM)` — **presence,
  never truth** — so the guard built to stop exactly this cannot catch it. The underlying SECURITY
  property is sound (the only two modules evaluating first are the zero-import scrub and a re-export-only
  shim), so this is a false shipped sentence, not an open leak.
- The backend lane's F-4: `env-scrub.js:101-108` states both entries import `./env-scrub.js`. Bundle 8a
  made that false — both now import `bootstrap.js`. **This diff is what turned a true comment false**, and
  the lines were never revisited.
- **Conductor-verified addition:** the shipped RESIDUAL 1 in `src/env-scrub.js` says a later call
  "ABSORBS a mid-session credential". Executed: that is true only when the slot was `undefined`. On a
  genuine **credential rotation** the re-scrub keeps the stale value, deletes the new one, and the
  fallback goes on serving the stale credential with no error. Shipped copy describes this with the
  opposite valence.

**S3 — wiring proof RED-on-removal OBSERVED for BOTH entries. → FAILS.**
Execution-proven by the security lane: deleting `initCredentialCustody(CREDENTIAL_ENV_NAMES);` from
`driver/host-free-driver.js:49` leaves **every** gate green — `npm test` 271/271 exit 0,
`check:ship` exit 0, `check:custody` exit 0, `entry-bootstrap` 15/15. The same mutation on
`src/server-entry.js` correctly goes RED (268 pass / 3 fail). Root cause read at
`test/env-scrub.test.js:460`: the A1 wiring proof computes `visited.has(envScrubPath)` — **reachability
of the module, not invocation of the call** — and the driver reaches `env-scrub.js` three independent
ways. This is precisely the "the scrub rides in on an import it would need anyway" anti-pattern that
`env-scrub.js`'s own header names as what makes a mutant proof meaningless. The reasoning was applied to
`server-entry.js` and not to the driver. **S3 requires both entries; one is observed, one is not.**
The walker's both-directions half DOES hold (B1/B2 non-vacuity control at `env-scrub.test.js:482`
asserting `some(canSpawn)` AND `some(!canSpawn)`; the `|| true` tautology is genuinely deleted).

**S4 — five falsifiers present AND observed RED, carrying R4. → HOLDS per the security lane; the qa lane
marked it `cannot-assess`.** Not independently corroborated. Weight accordingly.

**S5 — every named residual travels to the recorded/shipped surface. → FAILS. Both Claude lanes,
independently.**
- `opts.cwd` / `opts.stdio` unscanned: disclosed on **no** shipped surface — not in `spawn-shim.js`'s own
  100+ line residual header, not in `CUSTODY.md`, not in `package.json`, not even in the non-shipping
  test. It exists only in the WarpOS-side brief, which β ruled explicitly does **not** satisfy S5. The
  security lane additionally showed it is no longer "unexercised": a secret-shaped value rides through
  `opts.cwd` into a real child while all gates are green (caller-supplied, so not an S1 leak, but the
  wrapper refuses that shape in four channels and not in two).
- Walker mis-resolution residual: disclosed nowhere at all, not even beside the classifier.
- `node:` builtins-resolve-first: named as a ceiling only in `test/entry-bootstrap.test.js`, which
  `npm pack --dry-run` confirms is **not** in the 31-file ship set.
- agy adds a residual that is missing entirely: **preload modules** (`NODE_OPTIONS`, `--require`,
  `--import`) evaluate before the entry's ESM graph. Both security lanes reached this boundary
  independently from opposite directions; they disagree only on whether it needs disclosure. It does.

## Cross-family value, recorded

The three Claude lanes are **one family, not three votes**. agy — the only cross-family judgment, served
toolless-inline two complete files — produced two findings all three Claude lanes missed, and I confirmed
**both by execution**:

1. The captured snapshot is `const snapshot = {}`, so any `Object.prototype` key (`__proto__`,
   `toString`, `constructor`, `valueOf`) is never captured and `getCapturedCredential` returns a
   non-string — `Object.prototype` for `__proto__`, a **function** for `toString`. agy found the
   `__proto__` case; the wider family is mine. Not reachable in the shipped shape (`names` is
   caller-supplied and every shipped caller passes a fixed list), so **not S1** — a robustness defect plus
   a type-confusion in a security primitive. MEDIUM.
2. The rotation behaviour above.

agy also filed **every** finding `execution_proven: false` and listed all six unseen files itself —
correct, and a direct improvement on the predecessor round where this lane claimed execution on a file it
had said it could not read.

## β's Q3 condition was not satisfied — the tautology lint is fail-open AND unwired

β row 305 Q3 ruled: **LAND the tautology lint this round**, bounded to a named syntactic family, with a
two-direction falsifier and a stated semantic-vacuity ceiling. The lint exists and its family bounding is
correct, but the backend lane proved by execution that it is **fail-open on a missing or unreadable scan
root**: `walkJsFiles`' `catch { continue; }` swallows the error on the ROOT itself, zero files are walked,
`runAllChecks` returns `ok:true` because `violations.length === 0`, and the binary prints the affirmative
"OK — no occurrence of the four named syntactic tautology families" and **exits 0 having scanned nothing.**
The lane supplied a discriminating control with the same binary (root present + one seeded tautology →
RED, exit 1), so the exit-0 is caused by the absent root and not by an inability to go red.

Compounding it, F-7: `grep -c "no-tautological" package.json` → **0**. The lint is referenced by no npm
script — not `npm test`, not `check:custody`, not `check:ship`. **It gates nothing on any run a user or
the release gate performs.**

An enforcer that is both fail-open and unwired is the exact false-green class this repo has paid for
repeatedly. "Landed" is not satisfied by a file existing. This is a **β-condition miss**, distinct from
S1–S5, and it belongs in the fix brief regardless of how α rules on the S-criteria.

By contrast, β's Q2 option (b) **did** land correctly: `scripts/checks/lib/ac-manifest.js` is genuinely
fail-closed on all five error paths exercised (missing source → exit 2 `NO_DATA`; unreadable source → 1;
absent manifest → 1; malformed JSON → 1; bad flags → 1).

## A standing guard is weaker than it reads (S3-adjacent, forward-looking)

`extractStaticImportSpecifiers` (`test/entry-bootstrap.test.js:88-89`) has two **fail-open** blind spots,
proven by running the verbatim regex over nine forms: two static imports on ONE line yield only the LAST
(so a file with two static imports still counts as one — precisely what A2 exists to forbid), and a
trailing `/* block comment */` makes the ENTIRE import invisible. It handles `export * from`, re-exports,
side-effect-only, multi-line and `import type` correctly, and correctly excludes dynamic `import()`.
This does not falsify any mutation already observed RED; it means the guard will not catch the next one.

## Provisional bottom line

**All four lanes returned FAIL. Three of five criteria fail on present evidence: S2, S3, S5.** Under β's
pre-committed rule that means **no release at this run's close**, and this becomes **fix attempt 1 of the
two available**, counted by evidence directory, not ordinal. S1 holds on execution-backed evidence; S4
holds on a single lane and is not independently corroborated. Separately, **β's Q3 tautology-lint
condition is not satisfied.**

The fix set that follows from this round, in dependency order:

1. **S3 — make the driver's scrub load-bearing.** The A1 walker must assert **invocation**, not module
   reachability; then observe the driver mutant RED. This is the criterion's own falsifier and it is
   currently unobserved for one of the two entries.
2. **S2 — the false RE-DERIVED sentence in both entry headers**, and the test that certifies presence
   rather than truth. Re-derive a sentence that is actually true of the shipped chain, and bind it to
   something that can fail. Plus `CUSTODY.md:87` (asserts a test node that does not exist),
   `package.json:22` (self-contradictory pointer split), `CUSTODY.md:66`, `env-scrub.js:101-108`, and the
   RESIDUAL 1 rotation wording.
3. **S5 — move every named residual onto a shipped surface**: `opts.cwd`/`opts.stdio`, the walker
   mis-resolution residual, `node:` builtins, and the preload (`NODE_OPTIONS`/`--require`/`--import`)
   boundary that agy named and no surface carries.
4. **β Q3 — make the tautology lint fail-closed on an absent/unreadable root and wire it into a script
   that actually runs.**
5. **Robustness (from agy, conductor-verified):** `Object.create(null)` for the captured snapshot plus
   own-property guards, so a prototype-named key cannot silently lose a value or make
   `getCapturedCredential` return a non-string.
6. **Forward-looking:** close the two `extractStaticImportSpecifiers` fail-open shapes.

**α applies the rule. This is the evidence package, not the ruling** — I have not decided release, and I
do not have the authority to.
