# S-VLADW1-03 · BUNDLE 8b — the wiring proof that can go RED, idempotence, and the R1 battery

Sprint `S-VLADW1-03`. backend-fixer. **DISPATCHED — execute now.**
**SEQUENCED AFTER bundle 8a** — 8a restructures both entry points, and your F-2 mutant asserts against
their final shape. If `src/server-entry.js` does not yet import exactly one specifier statically, 8a has
not landed: **stop and report** rather than asserting against the old shape.

**WORKTREE:** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane` @ branch
`wt/S-VLADW1-01-engine`. Paths relative to `<worktree>/engine/`.
**DO NOT `git add`/`git commit`/`git push`.**

## scopeContract
**allowedFiles:** `engine/src/env-scrub.js` · `engine/src/spawn-shim.js` (ADDED by β r2 — the re-scrub choke-point) · `engine/test/env-scrub.test.js` ·
`engine/test/spawn-shim.test.js`
**forbiddenFiles:** everything else — explicitly `engine/src/server-entry.js`,
`engine/driver/host-free-driver.js` (8a's), `engine/src/spawn-shim.js`, `engine/src/model-seam.js`,
`engine/CUSTODY.md`, `engine/package.json`, `engine/scripts/checks/**`.
**`env-scrub.js` has ZERO static imports and MUST KEEP ZERO** — 8a's transitive-closure test fails if
you add one, and β's whole restructure ruling rests on that property.

## THE OPERATIVE RULE FOR THIS BUNDLE (β row 304, Q2)

> **Every record-producing item carries a mutant that makes the record go RED. A record that cannot go
> red is not evidence, whatever it is named.**

β made that the operative form because round 4 caught the defect live: a test named *"sanity control:
the reachability walker actually distinguishes spawn-capable from non-spawn-capable entry points (not
vacuously true)"* whose assertion was `assert.ok(classified.every(c => c.canSpawn || true))` — a literal
tautology, self-labelled "always true". **That is the thing you are replacing.**

## ITEMS

**B1 — delete the tautology.** Remove the `|| true` placeholder outright. Do not keep it "as
documentation"; a tautology in an assertion is not documentation, it is a green light nobody earned.

**B2 — the non-vacuity control asserts BOTH directions.** At least one entry point classifies
spawn-capable **AND** at least one does not. The current `some(canSpawn)` is satisfied by the driver
alone and would stay green if the walker classified *everything* as spawn-capable.

**B3 — widen `canSpawn` and INVERT the failure direction.** Today it matches only the exact specifier
`"node:child_process"`. Executed by the backend lane, all three of these classify **safe**:
- `import {spawn} from "child_process"` (bare specifier — valid Node)
- `createRequire(...)("child_process")`
- reaching spawn **through an npm dependency** — **including `@anthropic-ai/claude-agent-sdk`, this
  package's one production dependency, which launches the CLI as a child**
FIX: classify on the resolved builtin (strip an optional `node:` prefix), cover `createRequire`, and
treat an **unresolvable or bare specifier as spawn-capable-unless-proven-otherwise** — i.e. **fail
closed**. The predecessor's exemption direction is exactly backwards for a control.

**B4 — the F-2 falsifier, and it is the point of this bundle.** A standing test that **goes RED when the
scrub call is deleted from `server-entry.js`.** Today `server-entry.js` classifies `canSpawn=FALSE`, so
the class test's `canSpawn && !reachesScrub` is false at the first conjunct and **deleting the scrub call
leaves the suite green.** Verify the lever first, observe RED, restore.

**B5 — idempotence semantics: a real decision, not a default.** β named this "a real decision with
user-visible consequence". Today `initCredentialCustody` returns early once `captured !== null`, so it is
a **complete no-op on later calls** — a credential provisioned after the first call (a later
`dotenv.config()`, late runtime provisioning) is **never scrubbed** and stays inheritable. Found
independently by the cross-family lane and the backend lane.
Two defensible options — **choose, justify, and pin with a test**:
- **re-scrub-on-call:** later calls still run the delete loop for all provided names while skipping the
  capture (so the snapshot is never overwritten with `undefined` — that failure mode is silent and is
  why the guard exists).
- **documented single-shot:** the limitation ships in the header, loudly, and the call sites guarantee
  first-call-wins.
Also fix the asymmetry the backend lane found: the guard **ignores its `names` argument**, so a second
call with a *different* set scrubs nothing and reports success. And record the **worker-thread** boundary
— a worker gets a fresh module registry and its own `process.env`, so `getCapturedCredential` returns
undefined there and the API_KEY fallback breaks silently. β's framing: a header that spends sixty lines
on ESM cache semantics and omits the realm boundary is conspicuous.

**B6 — β's Q4 CONDITION: commit the R1 battery as STANDING regression tests.**
R1 "holds" is a fact about the predecessor's tree at its close. **S-03 modifies the custody boundary, so
R1 must be RE-ESTABLISHED, not cited.** β's condition: commit the round-4 security lane's TOCTOU attack
battery **plus the three round-3 attacks** as standing tests in `test/spawn-shim.test.js`:
stateful `toString` · prototype-chain env · stateful getter · **Proxy `get` trap** · `String` object ·
array value · own-`__proto__` key · `--api-key=<decoy>` in argv · `"Bearer <decoy>"` as an env value ·
`{anthropic_api_key: <opaque>}`.
Each asserts **REFUSED**, and — following the existing tests' pattern — carries a **raw control proving a
real child obtains the value when the guard is absent**. Build decoys by runtime composition; the repo's
secret-guard hook refuses a file containing a key-shaped literal.
**This converts the predecessor's one genuine success into an artifact** instead of a claim about a tree
that no longer exists.

## FIELD 4 — declare CLASS or INSTANCE for each of B1–B6
And if instance, name the residual. β made this the design gate: *"three rounds regenerated the same
class one syntax over."* B3 in particular — say plainly whether your classifier closes the *class* of
spawn-reaching entry points or a wider enumeration of *instances*, and what a fourth spelling would do.

## DEFINITION OF DONE
1. B1–B6 landed.
2. **Mutant proof, lever verified FIRST, each reverted ALONE:** the scrub call deleted from
   `server-entry.js` → RED (B4); each of the three spawn spellings → classified spawn-capable (B3);
   a credential provisioned after the first call → behaves as your B5 decision says, pinned;
   each battery attack → REFUSED, with its raw control showing the unguarded child does see it (B6).
   `git diff -- engine/src/env-scrub.js` reflects only your intended change.
3. `npm test` → 0 failures. `npm run check:ship` → exit 0.
4. You RAN every command and pasted its real output tail.

## REPORT (final text; no report file)
- One line per B-id, **each with its field-4 answer**.
- B3: your classification rule, and what happens to a specifier you cannot resolve.
- B5: which option you chose, the reasoning, and what you wrote about worker threads.
- B6: the full battery list with REFUSED confirmed for each, and how you composed decoys.
- Mutant table; real output tails.
- **Anything in this brief that is wrong** — verify each finding reproduces before fixing it, and say so
  if one does not. Confirm 8a has landed before you assert against the entries.

---

# β r2 BINDING AMENDMENTS (verdict `7c05e9d1`, betaEvents row 305, verified in canonical)

**These OVERRIDE anything above that conflicts.** The release rule now EXISTS and is pre-committed:
**S1–S5**, applied by α at the close of the qualifying gauntlet. Two of them land on this bundle
directly — **S1** (the battery re-establishes zero execution-proven leaks) and **S3** (the wiring proof
goes RED on removal, OBSERVED under mutation, for **both** entries and **both** walker directions).

**SCOPE CHANGE — `engine/src/spawn-shim.js` is ADDED to your allowedFiles.** You now own the
choke-point.

**Z1 — B5 is RULED: re-scrub-on-call, and the choke-point is NAMED.** β:

> Only CLASS-closing if some call site actually re-invokes it after startup. Choose re-scrub-on-call
> **AND NAME THE CHOKE-POINT: `auditedSpawn` — re-scrub immediately before each spawn.** AC-8.6's
> start-time self-check is a legitimate second call site but does not carry the class alone.

So: `auditedSpawn` re-invokes `initCredentialCustody` (or its scrub half) **immediately before each
spawn**. That is what makes this CLASS rather than INSTANCE — a credential provisioned at any point
after startup is scrubbed before the next child can inherit it, and the property stops depending on
when the entry point happened to run.
**If you find the choke-point genuinely cannot be wired** — a real ordering or import constraint, not
an inconvenience — then fall back to **single-shot with the residual stated, and field 4 = INSTANCE.**
β was explicit: *do not label single-shot behaviour CLASS.* Report which you landed and why.

**Z2 — fix the guard that ignores its `names` argument.** Today a second call with a *different* name
set scrubs nothing and reports success. Silent, and it survives the re-scrub change unless you fix it.

**Z3 — name TWO residuals explicitly, both user-visible:**
- **The worker-thread realm.** A worker gets a fresh module registry AND its own `process.env` copy, so
  the capture is invisible there and `getCapturedCredential` returns undefined — breaking the API_KEY
  fallback silently. `SHARE_ENV` changes the shape again. A header that spends sixty lines on ESM cache
  semantics and omits the realm boundary is conspicuous.
- **Re-scrub CAPTURES a mid-session credential rather than ignoring it.** That is correct for custody —
  but it is user-visible behaviour (a credential provisioned mid-session is absorbed, not passed
  through) and **must be stated**, not left to be discovered.

**Z4 — S4 binds your falsifiers: presence is not observation.** F-2 (deleting the scrub call from
`server-entry.js` → RED) and F-3 (credential provisioned after the first call) must each be **OBSERVED
RED under its own mutation**, not merely committed. β: *"NO_DATA ≠ pass; `t.skip()` ≠ pass."* If a
falsifier cannot be observed red, say so loudly — that is a finding, not a formatting problem.

**Z5 — S1 binds the battery.** Every one of the ten attacks must be committed **and green**, each
paired with its raw control proving an unguarded child **DOES** obtain the value. β: *"Citing S-01 r4
does not satisfy S1."* The battery is the artifact that re-establishes it on THIS tree.

---

# CONDUCTOR ADDENDUM — 8a HAS LANDED (commit `8b6993e`); one RED is YOURS

**8a is committed.** `src/server-entry.js` now has **exactly ONE static import** (`./bootstrap.js`) and
reaches every dependency by dynamic `import()`. Verified directly, not from its report. So the
precondition in your header is satisfied — proceed.

**Z6 — ONE TEST IS CURRENTLY RED AND IT IS YOURS TO FIX.**
`test/env-scrub.test.js` carries an assertion named *"mutant-proof lever exists and is inspectable:
`src/server-entry.js`'s own source calls `initCredentialCustody` as its first statement"*. It pinned the
**pre-bootstrap** shape, and 8a's restructure is exactly what makes it false. **This is a
debt-surfacing test flipping because the debt was paid — not a breakage.**

Replace it with an assertion against the shape that now exists. What matters is that **the mutant lever
survives the rewrite**: the whole point of that test was that a human can see the exact line a manual
mutant removes. After the restructure that lever is the bootstrap's `initCredentialCustody()` call. Do
not simply delete the test — a deleted lever is a lost lever, and losing it while "fixing red" is the
inverted false-green this sprint exists to end.

Record the flip the way the predecessor recorded its branding-test flip: keep it legible that this went
red **because the restructure landed**, not because something broke. A future reader cannot recover
that distinction from a diff.

**Note for B4:** your F-2 falsifier (deleting the scrub call from `server-entry.js` → RED) must now aim
at the **bootstrap's** call, since that is where the scrub is invoked. Verify the lever first — the
predecessor lost a mutant to exactly this mistake, aiming at a line that no longer carried the property.
