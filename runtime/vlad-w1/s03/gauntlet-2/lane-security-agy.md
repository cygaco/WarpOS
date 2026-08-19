# CROSS-FAMILY SECURITY PASS — vlad engine, sprint S-VLADW1-03, commit `0732cd8`

You are the **only non-Claude judgment** in this gauntlet. Three other lanes all run claude-opus-5 and are
ONE FAMILY, not three votes. **Disagree freely.**

## YOU WERE RIGHT LAST ROUND. Both findings were confirmed by execution and are now FIXED.

In the previous run (`a9e6708`) you filed, against these same two files:

- **Your F-2** — the captured snapshot was `const snapshot = {}`, so `__proto__` aliased through the
  setter, the value was lost, and `getCapturedCredential("__proto__")` returned `Object.prototype`. The
  conductor executed it: **confirmed, and WIDER than you filed** — the re-scrub guard
  `nextCaptured[name] === undefined` is false for *any* `Object.prototype` key, so `toString` returned a
  **function**. All three Claude lanes missed this entirely.
- **Your `residuals_wrong_or_missing` item 1** — that RESIDUAL 1's "absorbs a mid-session credential"
  framing was wrong for the rotation case. Executed: **confirmed.** On a real rotation the re-scrub keeps
  the stale value, deletes the new one, and the fallback serves the stale credential with no signal.

Both are repaired in the files below. **Your job now is to check the repair and then break it again.**
You were also right that preload (`NODE_OPTIONS` / `--require` / `--import`) was a missing residual; it is
now disclosed on the shipped surface, which you cannot see.

## THE THESIS

Credentials must never reach a child by environment inheritance. Static scanners over call-site shapes
failed three rounds — the family of spellings is unbounded. The answer is **capture-then-scrub**: at
startup every denylisted credential is read out of `process.env` into a private slot and **deleted**, so
no child can inherit it however it is spawned.

**P-ORDER — nothing can run before the scrub.** `src/env-scrub.js` has **zero imports**.
`src/bootstrap.js` is the ONE shared static-import surface: each real entry (`src/server-entry.js`,
`driver/host-free-driver.js`, neither of which you can see) statically imports **exactly one** specifier —
`bootstrap.js` — calls the scrub, then reaches the program by **dynamic** `import(...)`.

**P-ABSORB — a credential provisioned LATER is still covered.** `initCredentialCustody()` is re-invoked
before every real child launch by `auditedSpawn()` in `src/spawn-shim.js` (which you cannot see). It uses
**absorption, not re-capture**: a name whose captured slot already holds a real value is never
overwritten, because a naive full re-capture would read `undefined` for already-deleted names and destroy
the captured credential.

## YOUR QUESTION

**Using only the two files below, can you defeat P-ORDER or P-ABSORB — or defeat the REPAIR?**

1. **Attack the repair specifically.** The snapshot is now null-prototype with own-property guards, and a
   `readOwnEnvValue()` helper gates the capture reads because `process.env["toString"]` falls through to
   the inherited method rather than reading `undefined`. **Is that complete?** Is there any name, or any
   call sequence, where a value is still lost, overwritten with `undefined`, aliased, or left present in
   `process.env` when a child launches? Consider: `Symbol` keys, numeric-like names, `""`, names differing
   only by case, a `process.env` Proxy, `Object.defineProperty` on `process.env`, a non-configurable
   property making `delete` throw, and `Object.create(null)` objects hitting code that assumes
   `hasOwnProperty` exists on them.
2. **Is `getCapturedCredential` genuinely contracted to string-or-`undefined`** on every path, including
   after an absorb, after a rotation, and for a name never passed?
3. **Are the stated residuals in these headers TRUE and COMPLETE** for what these two files do? Is any
   claim in them false, and is any residual still MISSING? The headers are long and confident — that is
   exactly where the last three rounds hid their defects. **A false sentence inside sixty correct lines is
   the finding.**

## READ-SCOPE CEILING — stated, not assumed

Served **toolless-inline**: no file access, no shell, no test run. You are handed **exactly two complete
files** and nothing else.

**You have NOT been shown, and must NOT render a verdict on:** `src/spawn-shim.js` (where `auditedSpawn`
and the re-scrub call live), `src/server-entry.js`, `driver/host-free-driver.js`, `src/model-seam.js`,
`CUSTODY.md`, or any test file. If your reasoning depends on one of those, **say so explicitly**.

**You ran nothing. Therefore `execution_proven` MUST be `false` on every finding.** Last round you got
this exactly right and it is why your findings were weighted and acted on. Keep it.

## OUTPUT — JSON only, as your entire final message, nothing before or after

```json
{
  "lane": "security-reviewer-agy",
  "verdict": "PASS | FAIL",
  "findings": [
    {
      "id": "F-<n>",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "file": "<path>:<approximate line or symbol>",
      "claim": "<one sentence>",
      "attack": "<the concrete sequence that defeats it>",
      "execution_proven": false,
      "depends_on_unseen_file": "<name it, or null>"
    }
  ],
  "p_order_holds": "yes | no | cannot-assess",
  "p_absorb_holds": "yes | no | cannot-assess",
  "prior_findings_repaired": "yes | partially | no — say which and why",
  "residuals_wrong_or_missing": ["<explicit, or empty>"],
  "what_i_could_not_see": ["src/spawn-shim.js", "src/server-entry.js", "driver/host-free-driver.js", "src/model-seam.js", "CUSTODY.md", "all test files"]
}
```

---

# FILE 1 of 2 — `engine/src/bootstrap.js` (COMPLETE)

```javascript
// engine/src/bootstrap.js — the ONE shared static-import surface both real
// entry points (src/server-entry.js, driver/host-free-driver.js) use to
// reach the credential-custody scrub (S-VLADW1-03, bundle 8a; beta verdict
// 5a1d83bc-7e46-4f92-b3c0-2d95e07a41f8, betaEvents row 304, RESTRUCTURE not
// narrow).
//
// THE DEFECT THIS FILE CLOSES: ESM hoists every static `import` declaration
// and evaluates each target to completion BEFORE any statement of the
// importing module's own body runs — regardless of where, textually, the
// import declaration sits in the file. src/server-entry.js and
// driver/host-free-driver.js both used to claim their scrub call ran "FIRST
// STATEMENT, before every other import below"; that claim was false the
// moment either file kept a second static import declaration anywhere in
// its source, because the SECOND import's target module body still
// evaluates before either file's own first statement, no matter which line
// the import sits on.
//
// THE FIX: give both entries exactly ONE static import declaration each —
// this file — and route every other dependency through a DYNAMIC
// `import(...)` call, made AFTER the scrub call has already run as the
// entry's actual first statement. This file itself statically imports
// exactly one thing (src/env-scrub.js), preserving that module's own
// documented "zero-imports, nothing can run ahead of it" guarantee one hop
// further out.
//
// WHY A SHARED FILE RATHER THAN DUPLICATING "import env-scrub.js; call
// initCredentialCustody(...)" in both entries: the "exactly one static
// import" invariant is a single property that both entries must hold
// forever, not a property each entry happens to hold today. Defining it
// once here means the standing regression test (test/entry-bootstrap.test.js)
// checks ONE shared file's shape instead of asserting two independently
// maintained copies stay in sync — the same "don't duplicate a rule, name
// it once and test the definition" discipline test/custody-static.test.js
// already applies to P1/P2/P4's call-site matchers.
export { initCredentialCustody, CREDENTIAL_ENV_NAMES } from "./env-scrub.js";
```

# FILE 2 of 2 — `engine/src/env-scrub.js` (COMPLETE)

```javascript
// engine/src/env-scrub.js — the credential-custody scrub mechanism, as a
// ZERO-IMPORT module (S-VLADW1-01, fix attempt 7b / ADR-0041 Amendment 4
// continuation, beta verdict e4c7d20f, betaEvents row 303).
//
// THE FINDING this file closes: src/server-entry.js — the shipped MCP
// server, the product's real entry point — did not import src/model-seam.js
// by ANY path, so the capture-then-scrub Amendment 4 wired into
// model-seam.js's own top-level evaluation never ran in that process. A
// process an MCP host launches with the user's FULL environment (the
// long-lived server process) was running with no custody control at all.
// Proven by execution: with both credential decoys set, importing the real
// src/server-entry.js left both fully present in process.env.
//
// WHY ZERO IMPORTS: this is not a style preference. A module with no
// imports of its own cannot have any dependency's top-level body evaluate
// before its own — closing an ordering hole a dependency-laden module (like
// src/model-seam.js, which statically imports the Agent SDK's 109-package
// transitive graph) would otherwise leave open for anything that has to
// import it just to reach the scrub. See src/model-seam.js's own header for
// the residual this file does NOT close: model-seam.js's own scrub CALL
// still runs after the SDK's own top-level evaluation, because
// model-seam.js itself statically imports the SDK. That is model-seam.js's
// residual to state, not this file's — this file guarantees only that
// NOTHING it itself pulls in can run ahead of it, which is trivially true
// when it pulls in nothing.
//
// NAME-AGNOSTIC BY DESIGN: this module does not decide which env var names
// are credential-shaped. Every caller supplies its own explicit `names`
// argument. Owning that judgment here would force a choice between two bad
// options: (a) import src/model-seam.js to ask it — reintroducing the exact
// "pull the SDK in before the scrub can run" ordering problem this file
// exists to let OTHER callers avoid, or (b) hand-type a second, independent
// copy of the six-name denylist — the same widen-a-family violation this
// sprint has already paid for twice (round 2 F4: a control built and wired
// into nothing; round 2 F9: a claim scoped to one file when its AC said
// "any shipped copy"). See CREDENTIAL_ENV_NAMES below for the one
// disclosed, narrow exception to "never duplicate the list," and why it was
// still the least-bad option available inside this fix's file scope.
//
// IDEMPOTENCE — RULED, S-VLADW1-03 bundle 8b, β r2 verdict 7c05e9d1, Z1.
// Two options were live: re-scrub-on-call, or a documented single-shot. β
// ruled RE-SCRUB-ON-CALL, and named the choke-point: src/spawn-shim.js's
// auditedSpawn() re-invokes initCredentialCustody() immediately before
// EVERY real launch — not merely once at process startup. That is what
// makes this a CLASS property rather than an INSTANCE of "worked at
// startup": a credential provisioned at ANY point after startup — a later
// dotenv.config() call, late runtime provisioning, an operator exporting a
// var mid-session — is captured-and-deleted before the NEXT child can ever
// inherit it, regardless of when in the process's lifetime that
// provisioning happened.
//
// WHY NOT "capture whatever process.env has right now, unconditionally, on
// every call": the failure mode that rules this out is SILENT. By the time
// a second caller invokes initCredentialCustody with the SAME names,
// process.env no longer carries values the FIRST call already captured
// (they were deleted) — a naive full re-capture would read `undefined` for
// those and silently OVERWRITE the real, still-needed captured values,
// breaking src/model-seam.js's ANTHROPIC_API_KEY fallback with no error,
// no exception, nothing but a mysteriously-missing credential downstream.
// So: a name whose captured slot ALREADY holds a real (non-undefined)
// value is never touched again by a later call — only a name whose
// captured slot is still `undefined` (never provisioned at first-call
// time) gets a fresh read on a later call. This is genuine ABSORPTION, not
// a re-capture — see the residual note immediately below.
//
// RESIDUAL 1 (Z3, user-visible, stated not merely discovered, corrected —
// fix bundle 9e, cross-family review + execution probe, see the C1-C5
// sequence in test/env-scrub-capture.test.js): a later call only ABSORBS a
// mid-session credential when the captured slot for that name is still
// `undefined` (never provisioned at first-call time) — that is genuinely
// new custody reach, and IS a behavior change from "only what was present
// at startup ever flows forward" (nothing is left inheritable in
// process.env either way, so this remains correct for custody).
//
// But when the captured slot ALREADY holds a real value — the genuine
// ROTATION case, where a credential present at startup is later replaced
// by a NEW value in process.env — absorption does NOT happen. The re-scrub
// deletes the new value from process.env (so it is not left inheritable
// either) but the captured snapshot keeps serving the OLD, stale value via
// getCapturedCredential(), with no error, no exception, no signal that a
// rotation was ever observed. Verified by execution:
//   C1 captured at startup: PROBE-OLD-VALUE
//   C2 env now holds:       PROBE-ROTATED-VALUE
//   C3 env after re-scrub:  undefined
//   C4 getCapturedCredential now: PROBE-OLD-VALUE
//   C5 ROTATED VALUE REACHABLE ANYWHERE? NO -- rotated value DESTROYED,
//      stale value still served
// This is the RULED behavior, not a bug this file fixes (β row 305 Q4): the
// absorb-never-overwrite rule is what protects a captured credential from
// being silently destroyed by a naive full re-capture (see the IDEMPOTENCE
// note above) — preferring the new value on every re-scrub would defeat
// that same protection on the very next call. The choice is: never
// overwrite, and disclose that a genuine rotation is served stale rather
// than engineer that consequence away. Stated here so the next reader does
// not "fix" it into a silent overwrite.
//
// RESIDUAL 2 (Z3, worker-thread realm, user-visible, stated not merely
// discovered): a `node:worker_threads` Worker gets a FRESH module
// registry — it re-evaluates this file from scratch as an independent
// singleton, never seeing the main thread's `captured`/`capturedNames`
// state — AND (absent `{ env: SHARE_ENV }`) its own independent COPY of
// process.env, snapshotted at worker-creation time. So
// getCapturedCredential() inside a worker returns `undefined` even for a
// name the main thread already captured, silently breaking
// src/model-seam.js's ANTHROPIC_API_KEY fallback for any code that runs
// inside a worker — a header that spent this many lines on ESM
// module-cache semantics and omitted the realm boundary would be
// conspicuous, per β's framing; this package does not currently spawn
// worker threads, so this is a documented boundary condition for a future
// caller, not a currently-triggered defect. `{ env: SHARE_ENV }` changes
// the shape again (the worker would see the SAME live process.env object,
// so scrubbing in one thread is visible in the other) — not evaluated
// further here because nothing in this tree uses it.
//
// NAME-ARGUMENT HONESTY (Z2): a later call's `names` argument is NOT
// ignored. Every name it lists is scrubbed (deleted) from process.env on
// THAT call, whether or not it was part of an earlier call's list — a
// second call passing a DIFFERENT name set used to scrub nothing and
// report success; it now genuinely scrubs those names too.

// Module-private, singleton state — shared by every importer of this exact
// file. Node's ES module loader caches a module by its resolved absolute
// path, so src/model-seam.js, src/server-entry.js and
// driver/host-free-driver.js all reach the SAME instance of this state.
// src/model-seam.js imports "./env-scrub.js" directly; src/server-entry.js
// and driver/host-free-driver.js import src/bootstrap.js (which itself
// re-exports initCredentialCustody/CREDENTIAL_ENV_NAMES from
// "./env-scrub.js" — see src/bootstrap.js's own header for why that
// indirection exists) — either way, every path resolves to this one file's
// module record, so it is still the SAME instance being reached. That
// sharing is what makes "idempotent across multiple entry points" mean
// something, rather than each importer getting its own private,
// disconnected copy.
let captured = null; // null until the first successful call; then a frozen name->value snapshot (a captured value may itself be `undefined`, meaning the name was never set — that is a valid, expected snapshot entry, not an error)
let capturedNames = null; // frozen string[] snapshot of the names captured on the run that actually did the capturing

// CREDENTIAL_ENV_NAMES — the one disclosed, narrow duplication this module
// carries. src/server-entry.js and driver/host-free-driver.js each need to
// call initCredentialCustody() as their OWN first statement, independent of
// src/model-seam.js — independent for two separate, both load-bearing,
// reasons:
//   1. ORDERING: importing model-seam.js pulls in the Agent SDK ahead of
//      any scrub that import could trigger (see the header note above).
//      src/server-entry.js's real production dependency graph
//      (permission.js, job-manager.js, output-shim.js) never needed the SDK
//      before this fix and gains nothing by needing it now.
//   2. TESTABILITY (the DoD's own mutant-proof requirement): if
//      src/server-entry.js obtained its denylist BY importing
//      src/model-seam.js (e.g. via describeAuth().envDenylist), then
//      REMOVING server-entry.js's own initCredentialCustody() call would
//      NOT turn its dedicated regression test red — model-seam.js's own
//      internal call would still scrub the process, via the same import,
//      regardless of whether server-entry.js's explicit call survived. The
//      mutant proof this fix is required to demonstrate (removing
//      server-entry.js's call must independently fail its own test) is only
//      meaningful if server-entry.js's scrub does NOT ride in on an import
//      it would need for an unrelated reason.
// Given those two constraints, achieving "zero imports, zero duplication"
// simultaneously was not possible inside this fix's file scope (which does
// not permit restructuring src/model-seam.js's SECRET_SHAPES table into a
// shared module, nor creating a second new file beyond this one) — per this
// fix's own brief ("if you cannot achieve zero imports without duplication,
// say so and explain the tradeoff you chose"), this is that disclosure.
// The tradeoff is bounded, not silent: test/env-scrub.test.js asserts, on
// every run, that this list and src/model-seam.js's own
// describeAuth().envDenylist stay set-identical — any future drift between
// the two (a name added to one list and not the other) fails the suite
// loudly instead of silently leaving a var unscrubbed in whichever entry
// point reads the stale list. Values are NEVER duplicated, only these six
// PUBLIC names — already visible in src/model-seam.js's SECRET_SHAPES table
// and in CUSTODY.md.
export const CREDENTIAL_ENV_NAMES = Object.freeze([
  "ANTHROPIC_API_KEY",
  "CLAUDE_CODE_OAUTH_TOKEN",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_IDENTITY_TOKEN",
  "ANTHROPIC_CUSTOM_HEADERS",
  "CLAUDE_CODE_CLIENT_KEY",
]);

/**
 * Captures every named env var's CURRENT value into a module-private,
 * unexported snapshot, then deletes each name from process.env.
 *
 * RE-SCRUB-ON-CALL (Z1/B5 — see the IDEMPOTENCE header note for the full
 * ruling): the FIRST call in a process does the real capture-and-delete
 * work for every name given. Every LATER call is NOT a no-op — it deletes
 * every name it is given from process.env, every time (Z2: the `names`
 * argument is never ignored, including a name never seen before). A name
 * whose captured slot ALREADY holds a real (non-undefined) value keeps
 * that original value untouched. A name whose captured slot is still
 * `undefined` — either because this is the first time this exact name has
 * been supplied, or because it was supplied before but had no value yet —
 * gets a fresh read of process.env on THIS call, absorbing a credential
 * provisioned since the last call (see Z3's residual note above: this
 * ABSORBS a mid-session credential rather than passing it through
 * unscrubbed, which is user-visible behavior).
 *
 * src/spawn-shim.js's auditedSpawn() is the named choke-point that makes
 * this re-scrub property load-bearing in production: it calls this
 * function again immediately before every real spawn.
 *
 * Never returns a value — only names — so a caller (production code or a
 * test) can safely log or assert against the return value without that
 * itself becoming a leak channel.
 *
 * PROTOTYPE-SAFETY (fix bundle 9e, cross-family review + execution probe):
 * `names` is caller-supplied, but every shipped caller passes a fixed list
 * (CREDENTIAL_ENV_NAMES / model-seam.js's ENV_DENYLIST) with no
 * Object.prototype key on it — so this is a robustness hardening of a
 * security primitive, not a closed leak. The internal snapshot is built on
 * `Object.create(null)`, not `{}`, so a name that happens to collide with
 * an Object.prototype key (`__proto__`, `toString`, `constructor`, ...)
 * becomes an ordinary own property instead of either (a) silently hitting
 * the inherited `__proto__` ACCESSOR and losing the value entirely, or (b)
 * being skipped by the absorb branch below because the inherited value
 * made a bare `=== undefined` check false. Every read of `process.env` and
 * of the snapshot itself is done through an own-property check for the
 * same reason: `process.env[name]` for a name that shadows an
 * Object.prototype method (e.g. "toString") and was never actually set as
 * a real env var does NOT read as `undefined` — it falls through to the
 * inherited function — so an own-property guard is required on the READ
 * side too, not only on the snapshot's write side.
 * @param {readonly string[]} names
 * @returns {{capturedNames: string[], alreadyInitialized: boolean}}
 */
export function initCredentialCustody(names) {
  const namesArr = Array.from(names);

  if (captured === null) {
    const snapshot = Object.create(null);
    for (const name of namesArr) {
      snapshot[name] = readOwnEnvValue(name);
    }
    capturedNames = Object.freeze(namesArr.slice());
    captured = Object.freeze(snapshot);
    for (const name of namesArr) {
      delete process.env[name];
    }
    return { capturedNames: capturedNames.slice(), alreadyInitialized: false };
  }

  // RE-SCRUB: every later call actually deletes every name it is given,
  // regardless of whether that name was part of an earlier call's list
  // (Z2). A name whose captured slot is still `undefined` gets absorbed —
  // its current process.env value (if any) becomes the new captured value
  // — before its process.env entry is deleted below; a name already
  // holding a real captured value is left alone (never overwritten). The
  // "already holds a real value" test is an own-property check, not a bare
  // `=== undefined` read, for the same prototype-safety reason documented
  // on this function above: a bare read is indistinguishable, for an
  // Object.prototype-shaped name, between "captured slot genuinely holds
  // `undefined`" and "no own slot exists, so the read fell through to the
  // inherited prototype value" — only the former should be eligible to
  // absorb.
  const nextCaptured = Object.assign(Object.create(null), captured);
  const nextNamesSet = new Set(capturedNames);
  let capturedChanged = false;
  for (const name of namesArr) {
    nextNamesSet.add(name);
    const hasOwnCaptured = Object.prototype.hasOwnProperty.call(nextCaptured, name);
    const alreadyHasRealValue = hasOwnCaptured && nextCaptured[name] !== undefined;
    if (!alreadyHasRealValue) {
      const liveValue = readOwnEnvValue(name);
      if (liveValue !== undefined) {
        nextCaptured[name] = liveValue;
        capturedChanged = true;
      } else if (!hasOwnCaptured) {
        nextCaptured[name] = undefined;
        capturedChanged = true;
      }
    }
  }
  if (capturedChanged || nextNamesSet.size !== capturedNames.length) {
    captured = Object.freeze(nextCaptured);
    capturedNames = Object.freeze(Array.from(nextNamesSet));
  }
  for (const name of namesArr) {
    delete process.env[name];
  }
  return { capturedNames: capturedNames.slice(), alreadyInitialized: true };
}

/**
 * Reads `process.env[name]`, but only if `name` is a genuine OWN property
 * of `process.env` — i.e. a real environment variable was actually set.
 * Plain `process.env[name]` is not safe for an Object.prototype-shaped
 * name (e.g. "toString", "constructor"): when no such env var was ever
 * set, the bare read falls through the prototype chain and returns the
 * inherited method itself rather than `undefined`. Own-property-gating the
 * read is what makes "never set" and "set to undefined-shaped nothing"
 * collapse to the same, correct `undefined` result.
 * @param {string} name
 * @returns {string|undefined}
 */
function readOwnEnvValue(name) {
  return Object.prototype.hasOwnProperty.call(process.env, name) ? process.env[name] : undefined;
}

/**
 * Reads back ONE captured value, by name — the one sanctioned exception to
 * "initCredentialCustody never returns a value." Used ONLY by
 * src/model-seam.js's buildSessionEnv, the one place in this package a
 * captured credential is meant to flow forward at all (see
 * src/model-seam.js's own SANCTIONED_CARRIER_NOTE).
 *
 * CONTRACT: returns a `string`, or `undefined` — never anything else.
 * `undefined` covers three cases the caller does not need to
 * distinguish: initCredentialCustody() has not run yet in this process;
 * `name` was never part of the captured snapshot; or the captured slot for
 * `name` holds something that is not a string (defense-in-depth against a
 * malformed or prototype-polluted snapshot — see initCredentialCustody's
 * own header — reaching this far; a credential accessor must never hand
 * back an object or a function under any input).
 * @param {string} name
 * @returns {string|undefined}
 */
export function getCapturedCredential(name) {
  if (!captured || !Object.prototype.hasOwnProperty.call(captured, name)) {
    return undefined;
  }
  const value = captured[name];
  return typeof value === "string" ? value : undefined;
}

/**
 * TEST-ONLY visibility into whether initCredentialCustody() has run yet in
 * this process, and (by NAME only, never value) what it captured — mirrors
 * the "key names only" discipline src/model-seam.js's own
 * debugSessionEnvKeysForTest applies. Does not widen production capability:
 * grants no access to a value that getCapturedCredential doesn't already
 * grant to any caller holding a name.
 * @returns {{initialized: boolean, capturedNames: string[]}}
 */
export function debugCustodyStateForTest() {
  return { initialized: captured !== null, capturedNames: capturedNames ? capturedNames.slice() : [] };
}
```
