# S-VLADW1-04 — GAUNTLET 1 (DIAGNOSTIC) — CROSS-FAMILY SECURITY REVIEW (`security-reviewer`)

You are the CROSS-FAMILY lane. Three other review lanes on this run are from a different model family and
all read the same tree. **Your value is finding what they do not** — and you have done so in **three
consecutive gauntlets**, twice on code a same-family lane had read and failed to break. A finding all three
Claude lanes miss is **not** thereby cleared.

Your verdict is BINDING.

## THIS RUN IS DIAGNOSTIC, NON-QUALIFYING

There is ONE fix attempt this sprint: **this run → fix attempt 1 → gauntlet-2, the qualifying run.**
Nothing you find here fires the terminal. So **report everything, including what you are unsure about** — a
finding that can be investigated and dismissed cheaply now cannot be at the close. And **do not grade
generously because it is diagnostic**: a defect softened here survives into the run where there is no
recovery.

## READ-SCOPE — stated plainly so your report can be calibrated

You are served **toolless and inline**. You cannot open files, run commands, or browse the repository. You
are reading exactly the excerpts pasted below and nothing else.

**Therefore: mark every finding `execution_proven: false`, because you ran nothing.** Do not describe a
conclusion as observed. **List, in `files_i_could_not_see`, every file you needed and did not get** — you
did this last round and it made your report materially more usable, because it let the conductor tell
"agy did not see this" apart from "agy saw it and cleared it".

## The sprint, in one paragraph

This engine holds an API credential and launches child processes. A custody control captures every
credential-shaped environment variable and deletes it from `process.env` before any child can inherit it.
The predecessor sprint closed at honest state, NOT released, because its shipped claims were not all true.
This sprint repairs the mechanisms and the claims. Two of the repairs are below, and **both are NEW code
you have not seen before.**

## What changed, and what to attack

**(1) `src/spawn-shim.js` — the argument-normalization door.** A gauntlet lane defeated the previous version
with a caller-controlled `args.map`: an `Array` subclass whose own `map()` ignored its callback meant the
wrapper never actually stringified the elements. The scan called `String()` once on a benign value, Node
called `toString()` again inside `spawn()` on the secret, and the child's argv carried it while every gate
was green. The fix refuses Proxies and Array subclasses, then normalizes with a plain indexed loop that
performs **no method lookup on `args` at all**.

**Attack it.** What property does a caller still control? A getter on `length`? An index accessor? A
`valueOf`/`toString` that is stateful across the two reads? Something reached during `String()` itself? Is
the refusal complete, or is there a container shape that is neither a Proxy nor an `Array` subclass and
still misbehaves?

**(2) `src/env-scrub.js` — absorb/delete symmetry.** You yourself found, last round, that absorption
iterated only the current call's list while deletion swept the full history, so a previously-captured name
omitted from a partial call was deleted **without being absorbed** — destroying a mid-session value
irretrievably. The fix derives one population, `sweepNames`, and has both loops use it.

**Check the fix rather than assume it.** Is `sweepNames` genuinely the union, computed once? Can a name
enter one loop's view and not the other's? Did the **deletion** population widen — is anything now deleted
that this module never captured? Deleting a value is irreversible; a widened deletion set is a new defect,
not a fix.

## Grading discipline

- A robustness gap in a security primitive that **no shipped caller can reach** is NOT a leak. Last round
  you filed such a finding as HIGH and it was correctly downgraded — `names` is caller-supplied and every
  shipped caller passes a fixed string array. **Filing it is right; calling it HIGH is not.**
- State the **precondition** each finding needs, and say whether the text you were given establishes it.
  A finding whose premise you cannot check from the excerpt should say so in its own body.
- One of your findings last round was **falsified** by execution (Windows `process.env` reads are
  case-insensitive too, so the premise was wrong in both directions). That is the cost of not stating
  preconditions — state them.

## Output contract

Return ONE JSON object, nothing after it:

    {
      "lane": "security-reviewer",
      "verdict": "PASS" | "FAIL",
      "args_door_holds": "yes" | "no",
      "absorb_delete_symmetry_holds": "yes" | "no",
      "prior_findings_repaired": "yes" | "no" | "partial",
      "findings": [
        { "id": "F-1", "severity": "HIGH|MEDIUM|LOW", "criterion": "S4-1|S4-2|none",
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

# THE EXCERPTS — this is everything you have


## EXCERPT 1 of 3 — src/spawn-shim.js: the argument-normalization door (the fix you must attack)
```javascript
  //
  // D1 closes it in two parts, both immediately below. (1) REFUSE the exotic
  // container outright rather than normalize it cleverly — a refusal is a
  // loud, safe failure, whereas a clever normalization of a hostile object
  // is a new surface. (2) Normalize through a route the caller cannot
  // substitute: an indexed loop that performs no method lookup on `args` at
  // all. Both are STRICTLY NARROWING — every container accepted after D1
  // was already accepted before it; D1 adds no new acceptance.
  const normCommand = String(command);

  // D1(1) — Proxy FIRST: refused before any other inspection, because every
  // inspection below (`Object.getPrototypeOf` included) is itself trappable.
  if (nodeTypes.isProxy(args)) {
    throw new Error(
      "spawn-shim: `args` must be a plain array — the given container is a Proxy. A Proxy's traps can " +
        "answer this wrapper's own checks with one set of values and Node's spawn() with another, so no " +
        "inspection of it is trustworthy. Pass a plain array.",
    );
  }
  // D1(1) — an Array SUBCLASS (or a prototype-swapped array) passes
  // `Array.isArray()`, and its own `map`/`forEach`/iterator can hand this
  // wrapper's checks one set of elements while spawn() receives another.
  // Refused rather than normalized.
  if (Object.getPrototypeOf(args) !== Array.prototype) {
    throw new Error(
      "spawn-shim: `args` must be a plain array — the given container's prototype is not Array.prototype " +
        "(an Array subclass, or an array whose prototype was replaced), a shape Array.isArray() accepts. " +
        "Its own map/forEach/iterator can return elements this wrapper's checks never saw while spawn() " +
        "receives the real ones. Pass a plain array.",
    );
  }

  // D1(2) — the substitution-proof normalization. NO method lookup on
  // `args` at all: no `.map`, no `.forEach`, no `Symbol.iterator`, no
  // ArraySpeciesCreate — so an own or inherited `map`/iterator/
  // `constructor[Symbol.species]` has nothing to hook. `length` is read
  // exactly ONCE into a local (an index getter that mutates `args.length`
  // mid-loop therefore cannot extend or shorten the walk), each index is
  // read exactly ONCE, and each value is coerced to a PRIMITIVE string at
  // the moment it is read.
  const argCount = args.length;
  const stringifiedArgs = [];
  for (let index = 0; index < argCount; index += 1) {
    stringifiedArgs[index] = String(args[index]);
  }
  const normArgs = Object.freeze(stringifiedArgs);

  // B2/B3 (fix cycle 2): normalize ONCE — own-property-only becomes
  // irrelevant because normalizeEnv already flattens the prototype chain,
  // and every value is coerced to a string. Both checks below, AND the
  // spawn() call itself, use this SAME object.
  //
  // FIX 7a (A3): frozen for the same TOCTOU reason `normArgs`/`normCommand`
  // above are frozen — `env` already had one normalization point, but it
  // was not yet frozen, which is one refactor away from the exact same
  // check-then-spawn split `args`/`command` had. Freezing makes "check one
  // env object, spawn a different one" structurally impossible here too,
  // not merely accidentally-true today.
  const normalizedEnv = Object.freeze(normalizeEnv(opts.env));

  // Check 1 (pre-existing; FIX 7a T2/A1 — case-insensitive, UNCONDITIONAL):
```

## EXCERPT 2 of 3 — src/env-scrub.js: the header rationale for absorb/delete symmetry
```javascript
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
// ABSORB/DELETE SYMMETRY (fix E, S-VLADW1-04 bundle E — closes a defect the
// cross-family review lane found in the fix-10d code above, and the reason
// the CLASS claim in the preceding paragraph is now true as written rather
// than true only of the call sites that happen to ship). Fix 10d widened
// the DELETION loop to the full `capturedNames` history but left the
// ABSORPTION loop iterating only the CURRENT call's `names` argument. The
// two loops therefore swept DIFFERENT populations, and the difference was
// not benign: a name captured on an earlier call with no value yet (slot
// still `undefined`), then PROVISIONED mid-session, then OMITTED from a
// later partial call, was DELETED from process.env by the history-wide
// deletion loop without ever being offered to the absorption loop — so its
// value was destroyed and could never afterwards be retrieved through
// getCapturedCredential(). Deleting a value is irreversible; that is what
// made an asymmetry between two loops a data-loss bug rather than a
// tidiness complaint.
//
// Like fix 10d's own defect this was UNREACHABLE IN PRODUCTION — every
// shipped call site passes a full, set-identical list (test/env-scrub.test.js
// asserts exactly that on every run), so the two populations coincided in
// every process this package actually starts. It is recorded here anyway
// for the same reason fix 10d was: the paragraph above states a CLASS
// property of the MECHANISM ("holds regardless of what `names` list any
// PARTICULAR call passes"), and an asymmetric mechanism does not have that
// property no matter how uniform its callers are. Asserting a property of
// the call sites as a property of the mechanism is this file's own
// recurring failure class this sprint; this is its third instance.
//
// Fixed by deriving the swept population ONCE, into `sweepNames` (the union
// of `capturedNames` and the current `names`), and having BOTH loops
// iterate that one value. The CLASS claim is now a claim about a mechanism
// that has no second population for the first to drift from. Note the
// DIRECTION of the change: absorption widened UP to deletion's population,
// deletion did not widen at all — `sweepNames` is set-identical to the
// `capturedNames` the pre-fix deletion loop already swept (fix 10d's own
// code added every current name into `capturedNames` before deleting from
// it), so no name this module has not itself been asked to capture becomes
// deletable. Standing enforcer: the RF-6 test in
// test/env-scrub-capture.test.js, which is red against the asymmetric
// mechanism.
//
// WHY NOT "capture whatever process.env has right now, unconditionally, on
// every call": the failure mode that rules this out is SILENT. By the time
```

## EXCERPT 3 of 3 — src/env-scrub.js: initCredentialCustody() ITSELF — the two loops
```javascript
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
  // (Z2) — and, per fix E's symmetry rule, every name any EARLIER call was
  // given is offered absorption and deletion on this call too, from the one
  // `sweepNames` population derived just below. A name whose captured slot
  // is still `undefined` gets absorbed — its current process.env value (if
  // any) becomes the new captured value — before its process.env entry is
  // deleted below; a name already
  // holding a real captured value is left alone (never overwritten). The
  // "already holds a real value" test is an own-property check, not a bare
  // `=== undefined` read, for the same prototype-safety reason documented
  // on this function above: a bare read is indistinguishable, for an
  // Object.prototype-shaped name, between "captured slot genuinely holds
  // `undefined`" and "no own slot exists, so the read fell through to the
  // inherited prototype value" — only the former should be eligible to
  // absorb.
  // ONE DERIVED POPULATION, COMPUTED ONCE (fix E). `sweepNames` is the
  // union of `capturedNames` (every name ANY earlier call named) and
  // `namesArr` (the names THIS call named), and it is the population BOTH
  // the absorption loop and the deletion loop below iterate. Computing it
  // once, above both loops, is what makes the asymmetry structurally
  // unrepresentable rather than merely absent: there is no second
  // expression that could drift from the first. It is also exactly the
  // population the pre-fix DELETION loop already swept, so this widens
  // absorption to match deletion and does NOT widen deletion.
  const sweepNames = Object.freeze(Array.from(new Set([...capturedNames, ...namesArr])));
  const nextCaptured = Object.assign(Object.create(null), captured);
  let capturedChanged = false;
  for (const name of sweepNames) {
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
  if (capturedChanged || sweepNames.length !== capturedNames.length) {
    captured = Object.freeze(nextCaptured);
    capturedNames = sweepNames;
  }
  // FULL-HISTORY RE-SCRUB (fix 10d) + SYMMETRY (fix E): delete every name
  // in `sweepNames` — the SAME single population the absorption loop above
  // just iterated, and the full running union of every name ANY call has
  // ever named in this process — not merely `namesArr` (the names THIS call
  // was given). `sweepNames` is built from `capturedNames` plus `namesArr`,
  // so it is a superset of the pre-fix-10d `for (const name of namesArr)`
  // loop, never a narrower one; and because it is the identical value the
  // absorption loop read, no name can be deleted here that was not first
  // offered absorption there. This is what closes the criterion-S2 defect:
  // a name captured on an EARLIER call, then re-provisioned in process.env,
  // then omitted from a LATER call's `names` list, is still swept here —
  // because it is still in `capturedNames` from the earlier call — instead
  // of being left for the next child spawned through src/spawn-shim.js's
  // auditedSpawn() to inherit.
  for (const name of sweepNames) {
    delete process.env[name];
  }
  return { capturedNames: capturedNames.slice(), alreadyInitialized: true };
}

```

You have NOT seen: the rest of spawn-shim.js and env-scrub.js, server-entry.js, the driver,
model-seam.js, CUSTODY.md, or any test. Name every one you needed in files_i_could_not_see.
