# S-VLADW1-03 — GAUNTLET 3 — CROSS-FAMILY SECURITY REVIEW (`security-reviewer`)

You are the CROSS-FAMILY lane. Three other review lanes on this run are from a different model family and
all read the same tree. **Your value is finding what they do not.** In each of the two previous rounds you
found a real defect every one of them missed, so a finding you file that nobody else filed is not thereby
wrong — that history is the reason this lane exists.

Your verdict is BINDING. The conductor cannot override a FAIL.

## READ-SCOPE — stated plainly so your report can be calibrated honestly

You are served **toolless and inline**. You cannot open files, run commands, or browse the repository. You
are reading exactly the file contents pasted below this brief and nothing else. Everything you conclude is
bounded by that.

**Therefore: mark every finding `execution_proven: false`, because you ran nothing.** Do not describe a
conclusion as observed. And **list, in `files_i_could_not_see`, every file you needed and did not get** —
last round you did this and it made your report materially more usable, because it let the conductor tell
"agy did not see this" apart from "agy saw it and cleared it".

## The sprint, in one paragraph

This engine holds an API credential and launches child processes. The custody control captures every
credential-shaped environment variable and deletes it from `process.env` before any child can inherit it. The
sprint is closing the last residuals before release, and this is the QUALIFYING gauntlet after the final fix
attempt — there is no further fix attempt. A release rule was pre-committed before any result existed;
criterion **S1** is "zero execution-proven leaks", **S2** is "every claim in shipped copy is TRUE of the code
at close". You assess; someone else applies the rule.

## What changed in the code you are being shown

`initCredentialCustody(names)` used to delete only the names passed in the CURRENT call. You yourself found,
last round, that this meant a partial later call could leave a mid-session-reprovisioned credential sitting
in `process.env` for the next child to inherit — and that the shipped comment nonetheless claimed the
guarantee was a CLASS property of the mechanism, when it held only because every caller happened to pass a
full list. **That finding was confirmed by execution and it is the reason this round's change exists.**

The repair now deletes **every previously-captured name on every call**, not merely the current call's list,
and the shipped comment has been rewritten to claim this makes the guarantee true of the MECHANISM.

## Your questions, in priority order

1. **Is the new claim true of the mechanism as implemented?** The comment now asserts a CLASS property. Read
   the code and decide whether the code earns that word. If the mechanism is true but the comment still
   promises a user more than the mechanism delivers, that is an S2 finding — file it even though it is not a
   leak. This codebase's recurring defect is a claim stated one notch broader than its mechanism.
2. **What escapes the captured set?** A name that enters it but is not deletable; a realm where the set does
   not exist or is a fresh copy; an ordering where a credential is provisioned after capture and before
   spawn; a caller shape that defeats it. Be concrete about the sequence of calls that would exhibit it.
3. **Is deleting a previously-captured name ever WRONG?** The repair widens what is deleted. Widening a
   deletion set in a security primitive can break a legitimate consumer or destroy a value the process still
   needs. Say so if you see it.
4. **Rotation and staleness.** A credential rotated mid-session is captured and served from the captured
   value. Is the resulting behaviour what the comments say it is, and is the user-visible consequence stated
   rather than left to be discovered?
5. **Robustness of the primitive itself** — malformed input, unusual key shapes, prototype hazards, platform
   differences. Grade these honestly: a robustness gap in a security primitive that no shipped caller can
   reach is NOT a leak. Last round you filed such a finding as HIGH and it was downgraded because `names` is
   caller-supplied and every shipped caller passes a fixed string array. Filing it is right; calling it HIGH
   was not.

## Calibration, because it decides whether your findings are actionable

- Last round you filed three findings. One was **confirmed by execution** and drove this round's fix. One was
  **plausible but unreachable in the shipped shape** and was downgraded. One was **falsified**: you reported
  that Windows case-insensitive deletes destroy credentials without capturing them, and the conductor ran it
  — on Windows, `process.env` own-property READS are case-insensitive too, so the value is captured; and on a
  case-sensitive platform the two spellings are simply different variables. The premise was wrong in both
  directions.
- The lesson is not "file less". It is: **state the precondition your finding needs, and say whether the code
  you were shown establishes it.** A finding whose premise you cannot check from the text you were given
  should say so in its own body.

## Output contract

Return ONE JSON object, nothing after it:

    {
      "lane": "security-reviewer",
      "verdict": "PASS" | "FAIL",
      "p_class_claim_holds": "yes" | "no",
      "prior_findings_repaired": "yes" | "no" | "partial",
      "s_criteria": { "S1": "holds|FAILS|cannot-assess", "S2": "holds|FAILS|cannot-assess" },
      "findings": [
        { "id": "F-1", "severity": "HIGH|MEDIUM|LOW", "criterion": "S1|S2|none",
          "file": "path", "claim": "<one sentence>",
          "precondition": "<what must be true for this to fire>",
          "precondition_established_by_text_i_saw": true,
          "execution_proven": false,
          "reasoning": "<why you believe it>" }
      ],
      "residuals_wrong_or_missing": ["<a residual the comments claim is covered but is not, or one that is real and undisclosed>"],
      "files_i_could_not_see": ["<every file you needed and were not given>"]
    }

Grade severity by what a real attacker can reach on a SHIPPED path, not by how alarming the mechanism sounds.

---

# THE FILES — this is everything you have


## FILE 1 of 2 — src/env-scrub.js (COMPLETE — the mechanism that changed this round)
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
// FULL-HISTORY RE-SCRUB (fix 10d, S-VLADW1-03 bundle 10d — closes a
// criterion-S2 defect the cross-family lane found and the conductor
// confirmed by execution). Before this fix, a later call deleted ONLY the
// names passed to THAT call — so a full-list call at startup followed by a
// name being RE-PROVISIONED mid-session, followed by a later call that
// happens to pass a PARTIAL list omitting that name, left the re-provisioned
// value sitting in process.env for the next child to inherit. EXECUTED
// against the pre-fix code: `env[B] after partial re-scrub: <value still
// present> — would be inherited by the next child`. There is no shipped
// call site that actually passes a partial list today (every real caller
// passes a full, denylist-identical list — see CREDENTIAL_ENV_NAMES's own
// comment below), so this was never reachable in production; it was still a
// property of the CALL SITES asserted as a property of the MECHANISM, which
// is this file's own recurring failure class this sprint.
//
// Fixed by making every call — first or later — delete every name in
// `capturedNames`, the FULL running union of every name this module has
// EVER been asked to capture in this process, not merely the names passed
// on the current call. `capturedNames` already existed as the module's own
// bookkeeping for the absorb-never-overwrite rule above; this reuses that
// exact state rather than adding a second, parallel registry. Concretely:
// initCredentialCustody(["A"]) after an earlier initCredentialCustody(["A",
// "B", "C"]) still deletes A, B, AND C from process.env on this call — B and
// C were never passed to THIS call, but they are still in `capturedNames`
// from the earlier one, so they are still swept.
//
// What a caller CAN conclude from this: the re-scrub guarantee (Z1's header
// note above, restated) now holds regardless of what `names` list any
// PARTICULAR call passes, as long as EVERY name that ever needed scrubbing
// was passed on SOME earlier call in this process. What a caller CANNOT
// conclude: this does not scrub a name that has never been passed to
// initCredentialCustody at all in this process — a name only ever becomes
// eligible for this full-history sweep once some call has named it at least
// once. It also does not retroactively fix a child already spawned before
// this call ran; it only protects the NEXT child launched through the
// choke-point (src/spawn-shim.js's auditedSpawn()) after this call returns.
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
// report success; it now genuinely scrubs those names too. (Fix 10d: a
// later call ALSO scrubs every name from every OTHER earlier call, per the
// FULL-HISTORY RE-SCRUB note above — `names` still selects which names are
// eligible for absorption on THIS call, but no longer limits which names
// get deleted from process.env on this call.)

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
 * FULL-HISTORY RE-SCRUB (fix 10d — see the header note above for the full
 * defect this closes): a later call's DELETION step is not limited to the
 * `names` this call was given — it deletes every name in `capturedNames`,
 * the full running union of every name ANY call has ever named in this
 * process. This is what makes the re-scrub guarantee hold independent of
 * which particular subset of names any one caller happens to pass.
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
  // FULL-HISTORY RE-SCRUB (fix 10d): delete every name in `capturedNames` —
  // the full running union of every name ANY call has ever named in this
  // process — not merely `namesArr` (the names THIS call was given).
  // `capturedNames` already includes `namesArr` (nextNamesSet.add(name) ran
  // for every name above, regardless of whether it was already known), so
  // this is strictly a superset of the pre-fix `for (const name of
  // namesArr)` loop, never a narrower one. This is what closes the
  // criterion-S2 defect: a name captured on an EARLIER call, then
  // re-provisioned in process.env, then omitted from a LATER call's
  // `names` list, is still swept here — because it is still in
  // `capturedNames` from the earlier call — instead of being left for the
  // next child spawned through src/spawn-shim.js's auditedSpawn() to
  // inherit.
  for (const name of capturedNames) {
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

## FILE 2 of 2 — src/spawn-shim.js EXCERPT: the Z1 choke-point CLASS claim and the call it guards.
You have NOT seen the rest of spawn-shim.js, server-entry.js, the driver, model-seam.js, CUSTODY.md,
or any test. Name every one you needed in files_i_could_not_see.
```javascript
  // Z1 (β r2, S-VLADW1-03 bundle 8b) — THE RE-SCRUB CHOKE-POINT. Re-invokes
  // src/env-scrub.js's initCredentialCustody() with the SAME denylist this
  // call already read from describeAuth(), immediately before the real
  // spawn() call below — not merely once at process startup. A credential
  // provisioned at any point after startup (late runtime provisioning, a
  // later dotenv.config() call, an operator export mid-session) is
  // captured-and-deleted from process.env here, before the NEXT child
  // launched through this wrapper could ever inherit it — this is what
  // makes idempotence a CLASS property of the wrapper rather than an
  // accident of when the entry point's own first-statement call happened
  // to run. Deliberately placed AFTER every refusal check above: a call
  // this wrapper is about to REFUSE never needs to re-scrub anything, and
  // placing the re-scrub before the checks would not change what any check
  /* ... elided: refusal checks that run BEFORE the call below ... */
  initCredentialCustody(envDenylist);
```
