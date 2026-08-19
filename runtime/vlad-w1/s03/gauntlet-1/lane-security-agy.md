# CROSS-FAMILY SECURITY PASS — vlad engine, sprint S-VLADW1-03, commit `a9e6708`

You are the **only non-Claude judgment** in this gauntlet. Three other lanes all run claude-opus-5 and
are ONE FAMILY, not three votes — a finding all three miss is not thereby cleared. That is why you are
here. **Disagree freely.**

## THE THESIS YOU ARE ATTACKING

This engine is a plain-node app that spawns child processes. Credentials must never reach a child by
environment inheritance. Three earlier rounds tried to solve this with **static scanners** matching spawn
call-site shapes in source text; all three were defeated, because the family of call-site spellings is
unbounded (`child_process.spawn`, a destructured alias, `createRequire`, a dependency's own spawn, ...).

The current answer is **capture-then-scrub**, and it is supposed to be **shape-independent**: at process
start, every denylisted credential is read out of `process.env` into a private captured slot and then
**deleted from `process.env`**. After that, no child can inherit it no matter how it is spawned, because
it is not there to inherit.

Two properties carry the whole thesis:

**P-ORDER — nothing can run before the scrub.** `src/env-scrub.js` has **zero imports**, so nothing it
pulls in can evaluate ahead of it. `src/bootstrap.js` is the ONE shared static-import surface: the two
real entry points (`src/server-entry.js`, `driver/host-free-driver.js`) each statically import **exactly
one** specifier — `bootstrap.js` — call the scrub, and only then reach the rest of the program by
**dynamic** `import(...)`. This replaced an earlier claim ("the scrub runs as the FIRST STATEMENT") that
was **false by ESM semantics**, because static imports hoist and evaluate to completion before any
statement of the importing body, wherever the declaration textually sits.

**P-ABSORB — a credential provisioned LATER is still covered.** `initCredentialCustody()` is re-invoked
before every real child launch (by `auditedSpawn()` in `src/spawn-shim.js`, which you cannot see). It
uses **absorption, not re-capture**: a name whose captured slot already holds a real value is never
overwritten — because a naive full re-capture would read `undefined` for already-deleted names and
silently destroy the captured credential.

## YOUR QUESTION

**Can you defeat P-ORDER or P-ABSORB using only what is below?**

Concretely:
1. Is there ANY way for code to observe a denylisted credential in `process.env`, or to hand it to a
   child, given the two files below? Consider: `node:` builtins, `--import`/`--require` preload, loader
   hooks, package `exports` conditions, re-export chains, `import.meta`, top-level await, a `process.env`
   Proxy, `Object.defineProperty` on `process.env`, `SHARE_ENV` workers, `process.binding`.
2. Is the **absorption** logic correct? Find an input sequence under which a real captured value is lost,
   or overwritten with `undefined`, or a credential is left present in `process.env` when a child
   launches. Case sensitivity, prototype pollution on the captured object, `__proto__` as a name,
   deleting a non-configurable property, a getter on `process.env`.
3. Are the **residuals stated in the headers TRUE and COMPLETE** for what these two files do? The headers
   claim: `node:` builtins still resolve first; a mid-session credential is captured-not-ignored (and so
   becomes reachable where it previously would not have been); a worker thread gets a fresh module
   registry and its own `process.env` copy. **Is any of those wrong, and is any residual MISSING?**

## READ-SCOPE CEILING — stated, not assumed

You are served **toolless-inline**. You have NO file access, NO shell, NO ability to run the test suite.
You are being handed **exactly two complete files** and nothing else.

**You have NOT been shown, and must NOT render a verdict on:** `src/spawn-shim.js` (where `auditedSpawn`
and the re-scrub call live), `src/server-entry.js`, `driver/host-free-driver.js`, `src/model-seam.js`,
`CUSTODY.md`, or any test file. If your reasoning depends on one of those, **say so explicitly** rather
than assuming its contents.

In the previous sprint's round 3 this lane marked two findings `execution_proven: true` about a file it
had itself stated it could not read. That was caught and those findings were discounted. **You ran
nothing. Therefore `execution_proven` MUST be `false` on every finding you file.** An honest `false` is
worth far more here than an optimistic `true`.

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
// RESIDUAL 1 (Z3, user-visible, stated not merely discovered): because a
// later call ABSORBS a mid-session credential into the snapshot rather
// than ignoring it, that credential becomes reachable via
// getCapturedCredential() (and therefore src/model-seam.js's API_KEY
// fallback) even though it was never present at process-startup time. That
// is the correct behavior for custody (nothing is left inheritable in
// process.env either way) — but it IS a behavior change from "only what
// was present at startup ever flows forward", and a caller relying on the
// OLD narrower guarantee would observe a credential now flowing through
// that previously would not have.
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
// driver/host-free-driver.js all reach the SAME instance of this state
// (each imports "./env-scrub.js" / "../src/env-scrub.js", which all resolve
// to this one file) — that sharing is what makes "idempotent across
// multiple entry points" mean something, rather than each importer getting
// its own private, disconnected copy.
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
 * @param {readonly string[]} names
 * @returns {{capturedNames: string[], alreadyInitialized: boolean}}
 */
export function initCredentialCustody(names) {
  const namesArr = Array.from(names);

  if (captured === null) {
    const snapshot = {};
    for (const name of namesArr) {
      snapshot[name] = process.env[name];
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
  // holding a real captured value is left alone (never overwritten).
  const nextCaptured = { ...captured };
  const nextNamesSet = new Set(capturedNames);
  let capturedChanged = false;
  for (const name of namesArr) {
    nextNamesSet.add(name);
    if (nextCaptured[name] === undefined) {
      const liveValue = process.env[name];
      if (liveValue !== undefined) {
        nextCaptured[name] = liveValue;
        capturedChanged = true;
      } else if (!Object.prototype.hasOwnProperty.call(nextCaptured, name)) {
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
 * Reads back ONE captured value, by name — the one sanctioned exception to
 * "initCredentialCustody never returns a value." Used ONLY by
 * src/model-seam.js's buildSessionEnv, the one place in this package a
 * captured credential is meant to flow forward at all (see
 * src/model-seam.js's own SANCTIONED_CARRIER_NOTE). Returns `undefined` if
 * initCredentialCustody() has not run yet in this process, or if the given
 * name was never part of the captured snapshot.
 * @param {string} name
 * @returns {string|undefined}
 */
export function getCapturedCredential(name) {
  return captured ? captured[name] : undefined;
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
