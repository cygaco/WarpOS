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

## β row 308 (`9c2e5d38`) — folded into this gate

**Q2 changes RT-1's guard obligation and RT-2's atomicity width.**

- **RT-1 gains a compliance clause.** Refuse-not-skip converts every currently-SKIPPED paragraph into a
  violation, so the bundle that lands the guard must also land compliance for every real paragraph the new
  predicate refuses — **in the same change, with no report-only ramp.** A guard that ships red-on-arrival is
  a guard someone will disable.
  **MEASURED AT `b2583d6`: that set is EMPTY.** 14 paragraphs match the canonical predicate; 0 are newly
  refused; `Status` / `Enforcer` / `Proof scope` metadata is correctly not matched, so refuse-not-skip does
  not turn P-clause lines into violations. Evidence: `NEAR-MISS-BATTERY.md`. **The clause is retained as a
  bundle-A exit condition** — re-run the scan against the predicate AS BUILT, because a wider resemblance
  predicate could refuse real paragraphs. The empty set is a property of this predicate at this commit.
- **RT-2's atomic width is TWO files, and this was re-verified rather than inherited.** β's note that
  `CUSTODY.md`'s Asserted paragraphs are ADR-sourced (implying a three-file edit) was read during fix
  attempt 2; β directed re-verification at `b2583d6`. Result: **`ADR-0041` does not exist in the vlad repo
  at all** (it lives in WarpOS under `.claude/agents/president/_system/policy/adr/`, so an ADR-sourced
  correction is a *cross-repo* edit), and the verbatim obligation covers **A1–A4 only** — `CUSTODY.md:162`
  says "the four paragraphs immediately below", and the ADR contains `**A1`–`**A4` and no others (A6/A7/A8
  absent). **Decision: the class-form ceiling ships as a `Ceiling` paragraph under P3 — two-file
  atomicity** (`CUSTODY.md` + the lint's stored copy).

**Q4 extends the falsifier set: the near-miss class was NOT confined to RT-1.** The battery found
**13 blindnesses across three rules**, two of them outside the nine residuals:

- **RT-1 derivation — 7** (en-dash, hyphen, minus, colon, indent, and both `Ceiling` variants). In scope.
- **RT-7 (NEW) — status-token separation, 4 blindnesses.** A near-miss Asserted status token
  (`ASSERTED – NOT VERIFIED` with an en-dash, hyphen, lowercase, or extra spacing) placed in the **Proven**
  section evades `status-token-conflation` entirely. **This is a record-trust path in its own right and is
  hereby added to the enumeration**: the reader is the label-separation rule, the trusted field is the
  status token's exact bytes, and the gated action is shipping a claim under the wrong PROVEN/ASSERTED
  label. Same choke-point family, same fix shape, proposed into bundle A.
- **RT-8 (NEW) — aggregate/worded-rollup, 2 blindnesses.** Spelled-out numerals and `every` (vs `all`)
  evade. **Proposed as a DISCLOSED blindness rather than a repair**: widening a prose-pattern matcher is the
  move whose ceiling S-03 already documented, and it is the shape most likely to become the next overclaim.
  β's call at the design→build consult.
- **RT-2 carrier-note — 0 blindnesses, 2 TOLERANCES** (double space, NBSP). The rule binds "modulo
  line-wrap whitespace" by design, so tolerance is correct behaviour, not a defect. Named in the header
  rather than narrowed — narrowing invites the false-RED class the companion doctrine warns about.

**Q1/Q3 do not change this gate.** The class-form residual is DISCLOSED (strong actionable form), which is a
claim-truthfulness obligation rather than a record-trust surface; AC-8.6's cap bounds RT-6 to one invocation
plus one named test plus `check:pointers` resolving the node.

## β rows 309 + 310 — the binding name map, and what discharges what

**BINDING NAME MAP (row 310, `3a5f81c7`).** This gate's RT-n ids and the battery's R-n ids are the same
objects under two names. Written here as well as in the build spec so the criteria cannot be mis-applied at
close:

| battery id | this gate's id | governed by |
|---|---|---|
| R1 derivation | **RT-1** | S4-2(a), S4-2(b) |
| R2 carrier-note | **RT-2** | S4-6 — its NBSP **tolerance** travels as a residual |
| R3 status-token | **RT-7** | **S4-2(c)** — closed by a NAMED CANONICAL TRANSFORM |
| R4 aggregate/rollup | **RT-8** | S4-6 — CLASS disclosure, not a fix |

**RT-7 is closed by a canonical transform, NOT by the four variants.** β: *"an enumeration of the four
observed variants does NOT satisfy this."* Case-fold + whitespace-collapse + dash-class fold, compared on
the rendered form. Enumerating observed variants is the same fail-open shape as the em-dash predicate one
level up — it closes the sample, not the class.

**RT-8 is disclosed rather than fixed, and the reason is structural, not a concession:** the actual control
for a rollup claim's truth is **S4-1's reviewer read, which is explicitly immune to mechanism evidence**.
The linter never was that control. Widening it would manufacture the appearance of coverage.

**What discharges what — do not conflate these two:**
- **RF-2 is SATISFIED AT DESIGN** (this gate's exit item 2) and is **NOT in S4-4's falsifier set**. It is
  not a build deliverable.
- **S4-2(d) is a SEPARATE close-time obligation**: a **gauntlet lane** — not ε — re-runs the battery
  against the predicate **AS BUILT**, with the population including bundle A's newly-authored class-form
  paragraph (P-097: bundle A controls both the artifact and the thing judging it). **"RF-2 passed" does not
  discharge S4-2(d).**

**The design-phase battery is pinned by CONTENT-INVARIANT, not by path** (row 310 FIX 1): the design exit is
satisfied by *the run against `b2583d6`, controls-first, 6/6 controls RED, baseline clean, zero files
mutated* — wherever that table lives. The filename already changed once inside a single consult cycle.

## Design→build EXIT (blocking)

Build entry is refused unless:

1. Every **RT-1..RT-8** path names its choke-point and structural guard — done above, with RT-7 and RT-8
   added by the battery.
2. **RF-1 and RF-2 EXIST AND HAVE BEEN RUN — SATISFIED AT DESIGN.** β made this a design exit condition
   rather than a build deliverable. `NEAR-MISS-BATTERY.md` records the run: **controls first, 6/6 controls
   RED, baseline clean, zero files mutated** (probed through `lintCustodyStatement(content)`, a pure
   function, so the live tree was never touched and no revert was needed). Every variant is recorded as RED
   or as a **named blindness carried into build scope**.
3. RF-3..RF-7 are written into the build spec as required-present committed fixtures, each with the
   "present AND OBSERVED RED under its own mutation" bar.
4. The atomic claim+canonical bundle-ownership rule is written into the build spec's **scope contracts**,
   not left to builder judgement — and the A→B serialization is stated as a consequence of it.
5. β mints S-04's release rule at the design→build boundary, against these final criteria, before any
   result exists.

**Bundle-ordering consequence of Q2, checked rather than assumed.** Bundle A owns `CUSTODY.md`'s header
block, the class-form `Ceiling` under P3, and any newly-refused paragraph (measured empty). Bundle B owns
`CUSTODY.md`'s two false sentences plus their canonical copies. **Both bundles edit `CUSTODY.md`, which is
exactly why A→B is forced-serial rather than a preference** — and Q2's compliance clause does not widen
A's `CUSTODY.md` footprint at this commit, because the newly-refused set is empty. If a wider predicate is
built and that set becomes non-empty, A's footprint grows and A→B remains correct; the ordering does not
need to change, only A's brief.
