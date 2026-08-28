# RECORD-TRUST GATE — S-VLADW1-04 (design-phase, BLOCKING design→build exit)

Doctrine: `.claude/project/reference/record-trust-gate.md`. Applied by ε at design, before build.
Surface: vlad `wt/S-VLADW1-01-engine` @ `b2583d6`.

> **Why this sprint is a textbook trigger.** The doctrine's pattern is *"a reader trusts a record or field
> to gate an irreversible action"*, and its item 1 demands *"a STRUCTURAL guard that FAILS any new,
> un-routed reader."* S-VLADW1-03 shipped a derivation that **silently skips any paragraph it cannot
> route** — the precise inverse. The gate was not applied at S-03's design because the derivation did not
> exist yet; it exists now, and it failed exactly where the doctrine says to look.

## Surface enumeration — every path where a record/field gates an irreversible action

| # | Reader | Record/field trusted | Irreversible action gated | Session scope |
|---|---|---|---|---|
| RT-1 | `custody-claim-lint.js` `extractBindableParagraphs` | the DERIVED paragraph population from `CUSTODY.md`'s own structure | `check:ship` exit 0 → the shipped custody statement is treated as true → **release** | cross-session (the document outlives any run) |
| RT-2 | `custody-claim-lint.js` Rule 4 comparison | `BOUND_PARAGRAPHS` canonical copies | same | cross-session |
| RT-3 | `auditedSpawn` refusal checks | `normArgs` / `normalizedEnv` — the normalized objects the checks scanned | **spawning a real child process** with those arguments | same-session (one call) |
| RT-4 | `initCredentialCustody` deletion loop | `capturedNames` — the running capture history | **deleting a value from `process.env`** (destructive, unrecoverable if unabsorbed) | same-session (module state) |
| RT-5 | `verified-by-resolver.js` (`check:pointers`) | the AC pointer manifest | none — RED by design, deliberately outside `check:ship` | cross-session |
| RT-6 | AC-8.6's self-check (to be built) | its own pass/fail result | whether a user's install reports custody healthy at start | same-session |

## Per-path gate application

### RT-1 — THE PRIMARY SURFACE. Choke-point + structural guard.

- **Single choke-point:** `extractBindableParagraphs` in `engine/scripts/checks/custody-claim-lint.js`.
  Every bindable-paragraph decision routes through it; no sibling path derives paragraphs.
- **Structural guard that FAILS an un-routed reader:** the function must **REFUSE, never skip**. A block
  that *resembles* a bindable lead-in — bolded, opening with `Asserted`/`A<n>`/`Ceiling`, followed by any
  dash (em, en, hyphen, minus), colon, or leading whitespace — but does not match the canonical predicate
  MUST emit a named violation (`unbindable-paragraph-shape`) rather than `continue`. **Skip is fail-open;
  refuse is fail-closed** (ED-358).
- **The residual this leaves, named honestly:** "resembles a lead-in" is itself a predicate, so a paragraph
  resembling nothing the resemblance-check knows is still invisible. That is a genuine ceiling and it must
  be DISCLOSED in the header rather than asserted away — **the S-03 header's failure was claiming
  completeness the predicate did not have.** The honest claim is "every paragraph this document's structure
  presents as a claim is bound or refused by name", plus the named ceiling.
- **Cross-session:** no per-session signing. The artifact is a committed markdown file; the guard is
  structural (predicate + refusal), which is the correct mechanism for a cross-session artifact per the
  doctrine's item 2.

### RT-2 — the canonical copies, and the atomicity rule

- **Choke-point:** `BOUND_PARAGRAPHS` is the single canonical store; Rule 4 is the single comparison.
- **The trust defect S-03 created:** a *false* sentence pinned here is **enforced**, so an honest correction
  turns `check:ship` red until the canonical copy moves in the same change. The record is trusted to gate
  release, and it currently gates release ON A FALSEHOOD.
- **Structural rule for build:** claim text and canonical copy are **ONE atomic edit owned by ONE bundle**.
  A bundle that may edit `CUSTODY.md` must also own `custody-claim-lint.js`'s canonical block, or it must
  not edit the claim at all. **This is a scope-contract rule, enforced by bundle file-ownership**, and it is
  the design-level fix for what cost S-03 an extra bundle (10c stopped correctly at a forbidden file; 10f
  existed only to finish the pair).

### RT-3 — the args scan door

- **Choke-point:** the normalization at `spawn-shim.js:262`, which must produce the objects the checks scan
  AND the objects `spawn()` receives.
- **Defect:** normalization is delegated to `args.map`, a **caller-controlled method**. The record the
  reader trusts (`normArgs`) is supplied, in part, by the party the check exists to constrain.
- **Structural guard:** stringify through a route the caller cannot substitute — `Array.prototype.map.call`
  / `Array.from` with own-property iteration — so the scanned object and the spawned object are the same
  values by construction, not by the caller's cooperation. **Conservative by construction:** prefer
  refusing an argument container that is not a plain array over attempting to normalize an exotic one.
- **Same-session** (one call), so per-call structural identity is the right mechanism; no signing needed.

### RT-4 — capture symmetry

- **Choke-point:** `initCredentialCustody`'s absorb loop and delete loop.
- **Defect:** the two loops iterate DIFFERENT populations — absorb over the current call's `namesArr`,
  delete over the full `capturedNames` history — so a name can be deleted (irreversible) without ever being
  offered for absorption.
- **Structural guard:** absorb and delete iterate **the same derived population**, computed once. If the
  populations are deliberately different, the difference is stated in the header and the CLASS claim is
  downgraded to INSTANCE with the precondition named.

### RT-5 / RT-6

RT-5 gates nothing irreversible (RED by design, outside `check:ship`) — no gate applied, recorded so the
enumeration is complete rather than silently partial. RT-6 does not exist yet; its gate is that its result
must be **observable** (a test can make it fail) rather than advisory-only, which is the S3-strength lesson
from the driver entry.

## Required-present adversarial falsifier fixtures (doctrine item 3)

**A missing falsifier BLOCKS build-entry.** Each must be a named, committed test that goes RED under its own
mutation — the "present AND observed RED" bar, not presence.

| id | fixture | must go RED when |
|---|---|---|
| **RF-1** | near-miss battery over the Asserted/Ceiling derivation | a paragraph led by `**A9 –`, `**A9 -`, `**A9:`, `  **A9 —`, `**Ceiling –` (and the em-dash controls) is present and unbound — **all of them**, not only the em-dash pair |
| **RF-2** | near-miss battery over EVERY OTHER bound rule | the A5 carrier-note binding and the status-token rules admit the same class of near-miss (pending β Q4: this may be a design EXIT condition rather than a build deliverable) |
| **RF-3** | refuse-not-skip control | the derivation is reverted to `continue`-on-non-match — the fixture must catch the revert, or the guard can silently regress (the 10a lesson: a mechanism no test distinguishes can be reverted invisibly) |
| **RF-4** | atomic claim+canonical | `CUSTODY.md` text and its canonical copy diverge — already covered by Rule 4; the NEW fixture is that a claim edit WITHOUT its canonical edit is caught **as a single bundle's failure**, not discovered at gauntlet |
| **RF-5** | Array-subclass spawn probe | an `args` object whose `map()` ignores its callback reaches `spawn()` with a value the scan did not see — the security lane's exact shape, committed |
| **RF-6** | absorb/delete symmetry | a previously-captured name omitted from a partial call is deleted without being absorbed |
| **RF-7** | AC-8.6 invocation | the self-check's invocation is removed from the entry path — and it must fail at RUNTIME, not only by text/AST (the driver-entry strength lesson) |

## Mistake-reachable vs attacker-only (companion doctrine)

- **RT-1, RT-2, RT-4 are MISTAKE-reachable and MUST close.** No attacker is required: a maintainer typing an
  en-dash, or correcting a false sentence without touching the canonical copy, or passing a partial names
  list, reaches all three. The predecessor reached RT-1 and RT-2 *by accident, in its own fix bundles*.
- **RT-3 is attacker-reachable within a named ceiling** — it needs a hostile caller already holding the
  plaintext, and no shipped call site has that shape. It may be dispositioned honestly IF the ceiling is
  named on the shipped surface. It may NOT be left claimed-closed, which is the current state.

## False-REDs get the same honesty treatment

Refuse-not-skip will produce REDs on paragraphs that are merely oddly authored. Per the companion doctrine,
those are **accuracy failures too** — the fix is the mechanism or the claim, never a settable per-paragraph
suppression marker. Any exemption must be **code-level with a structural reason**, never a marker a document
author can set, because a settable exemption in a claim-binding gate is the same hole in a new place.

## Design→build EXIT (blocking)

Build entry is refused unless: every RT-1..RT-6 path names its choke-point and structural guard (done
above); RF-1 and RF-3..RF-7 exist as named committed test files and are observed RED under their own
mutation; RF-2's disposition is settled by β (Q4); and the atomic claim+canonical bundle-ownership rule is
written into the build spec's scope contracts rather than left to builder judgement.
