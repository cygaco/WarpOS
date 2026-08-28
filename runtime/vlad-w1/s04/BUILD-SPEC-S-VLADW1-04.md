# BUILD SPEC — S-VLADW1-04 (design-from-evidence)

Plan contract: `PC-20260828-0086` · Tracker: `trackers/sprints/S-VLADW1-04-custody-claims-un-invertible.md`
Surface: vlad `wt/S-VLADW1-01-engine` @ `b2583d6`, NOT merged. **Build NOT authorized.** No registry entry.
Record-trust gate: `runtime/vlad-w1/s04/RECORD-TRUST-GATE-S-VLADW1-04.md` (blocking design→build exit).

Every item carries β's **four required fields**: 1 mechanism · 2 file · 3 the standing test that must go RED
on removal · 4 **CLASS or INSTANCE — if INSTANCE, the named residual.** Field 4 is the design gate: the
predecessor failed because a fix labelled CLASS covered less than the label claimed.

Scope anchors trace to `runtime/vlad-w1/s03/gauntlet-3/ALPHA-RULING-S1-S5.md` and the four lane evidence
files. **All nine residuals resolve; each was checked against its evidence file.**

---

## 1 — Refuse, don't skip: the derivation names what it cannot bind *(bundle A)*

1. **Mechanism:** `extractBindableParagraphs` emits a named violation (`unbindable-paragraph-shape`) for any
   block that RESEMBLES a bindable lead-in — bolded, opening `Asserted`/`A<n>`/`Ceiling`, followed by any
   dash (em U+2014, en U+2013, hyphen, minus U+2212), colon, or leading whitespace — but fails the canonical
   predicate. It must never `continue` past such a block silently.
2. **File:** `engine/scripts/checks/custody-claim-lint.js`.
3. **RED-on-removal:** revert the refusal to `continue` → **RF-3** goes RED. Author each near-miss authoring
   → **RF-1** goes RED per authoring.
4. **CLASS for the failure DIRECTION** (refuse-by-default replaces skip-by-default, so an unanticipated
   authoring is caught rather than dropped). **INSTANCE for the enumeration** of resemblance shapes.
   **Residual, named and required in the header:** "resembles a lead-in" is itself a predicate; a paragraph
   resembling nothing the resemblance-check knows is still invisible. **The header must state this ceiling
   rather than claim completeness — claiming completeness the predicate does not have is precisely what
   failed S-03.**

## 2 — The header's promise matches the mechanism *(bundle A, same owner)*

1. **Mechanism:** rewrite `CUSTODY.md`'s what-is-bound / what-is-NOT-bound block so it describes what the
   code does after item 1, including the P1–P4 body prose the current list omits (qa F-3) and the named
   ceiling from item 1.
2. **Files:** `engine/CUSTODY.md` + the canonical copy in `custody-claim-lint.js`. **ONE bundle owns both.**
3. **RED-on-removal:** Rule 4 (the paragraph is itself bound); plus the near-miss battery.
4. **INSTANCE.** One header corrected is one header. **Residual:** nothing mechanically detects a FUTURE
   header that describes the mechanism inaccurately — the lint checks binding, never truth.

## 3 — The two gate-enforced falsehoods, corrected atomically *(bundle B)*

1. **Mechanism:** correct (a) the preload-Ceiling sentence "not named on any other surface, shipped or
   internal", falsified by `entry-bootstrap.test.js:687` naming that residual, and (b) the 10d attribution
   sentence asserting this cycle touched neither `spawn-shim.js` nor its test. Each correction moves the
   claim text and its canonical copy **in the same commit**.
2. **Files:** `engine/CUSTODY.md` + `custody-claim-lint.js` canonical block.
3. **RED-on-removal:** **RF-4** — a claim edit without its canonical edit fails inside the bundle's own run,
   not at gauntlet.
4. **INSTANCE.** Two sentences corrected. **Residual:** the general property — no mechanism detects a bound
   sentence that is FALSE, only one that has DRIFTED. Binding makes a claim un-editable, not true.

> **SEQUENCING, BINDING:** bundles A and B touch the same two files and **must be serial, A then B**, or one
> bundle owns both. Item 3 cannot land before item 1: correcting a bound sentence while the bind still
> skips is how S-03 ended with a red tree and an extra bundle.

## 4 — The args.map scan door *(bundle C)*

1. **Mechanism:** stringify arguments through a route the caller cannot substitute —
   `Array.prototype.map.call` / `Array.from` plus own-property iteration — so the scanned values and the
   spawned values are identical **by construction**. Prefer **refusing** a non-plain-array `args` container
   over normalizing an exotic one (conservative by construction).
2. **File:** `engine/src/spawn-shim.js`, plus its shipped comment at :411-415 / :256-260 which currently
   asserts a structural impossibility that is false for `args`.
3. **RED-on-removal:** **RF-5** — the committed Array-subclass probe reaches `spawn()` with an unscanned
   value.
4. **CLASS for the substitution class** (caller-supplied normalization is removed as a category, not
   patched per-method). **Residual:** `opts.cwd` / `opts.stdio` remain unscanned — disclosed, unchanged, and
   NOT re-opened by this bundle.

## 5 — Absorb/delete symmetry *(bundle D)*

1. **Mechanism:** absorb and delete iterate the SAME derived population, computed once. If they must
   differ, the difference is stated in the header and the CLASS claim is downgraded to INSTANCE with the
   precondition named.
2. **File:** `engine/src/env-scrub.js` (+ `test/env-scrub-capture.test.js`).
3. **RED-on-removal:** **RF-6** — a previously-captured name omitted from a partial call is deleted without
   being absorbed.
4. **CLASS if symmetric; INSTANCE with a stated precondition otherwise.** The builder chooses and justifies.
   **Residuals carried unchanged:** the worker-thread realm; that re-scrub CAPTURES a mid-session credential
   rather than ignoring it.

## 6 — AC-8.6, and the driver entry's runtime consequence *(bundle E)*

1. **Mechanism:** a product-layer custody self-check invoked when the server or job runner starts, with its
   named test node `selfcheck-runs-on-user-machine` in `test/custody-runtime.test.js` so `check:pointers`
   resolves it instead of reporting missing-NAME. **Same bundle** gives the driver entry's scrub a
   runtime-observable consequence, since both touch the entry files.
2. **Files:** `engine/src/server-entry.js`, `engine/driver/host-free-driver.js`,
   `engine/test/custody-runtime.test.js`.
3. **RED-on-removal:** **RF-7** — remove the invocation → the named test goes RED **at runtime**, not only by
   text/AST classifier.
4. **INSTANCE.** It closes AC-8.6 specifically. **Residual — the CLASS form, which does NOT close here:**
   *every shipped control is invoked by some product-layer path — item 1's walker approximates it, AC-8.6 is
   one instance, and no enforcer asserts the general form.* Disposition pending β Q1.

## 7 — Class-form residual disposition *(bundle E or deferred — β Q1)*

1. **Mechanism:** EITHER ship the class-form residual as a disclosed ceiling on `CUSTODY.md` (recommended),
   OR build a general enforcer asserting it (expanded variant — **ε recommends against**; a general
   mechanism that overclaims its own coverage is how S-03 failed).
2. **File:** `engine/CUSTODY.md` (disclosure route) — owned by whichever bundle owns CUSTODY.md at that point.
3. **RED-on-removal:** the paragraph is bound, so Rule 4 covers drift.
4. **INSTANCE either way.** Disclosure does not close the general property; it states it where the reader is.

---

## The seven required-present falsifier fixtures

`RF-1` near-miss battery over the Asserted/Ceiling derivation (all five near-miss authorings **plus** the
two em-dash controls) · `RF-2` near-miss battery over EVERY OTHER bound rule (**disposition pending β Q4** —
design-exit condition or build deliverable) · `RF-3` refuse-not-skip control (revert to `continue` → RED) ·
`RF-4` claim edit without canonical edit fails inside the bundle · `RF-5` Array-subclass spawn probe ·
`RF-6` absorb/delete symmetry · `RF-7` AC-8.6 invocation removal, RED at runtime.

**Bar: present AND OBSERVED RED under its own mutation.** Presence is not observation; `NO_DATA` is not a
pass; a `t.skip()` in that position is the defect. Every mutant carries the no-op⇒FAIL guard and
EOL-agnostic matching that 10c/10f established, so a mutation that does not mutate FAILS.

## Bundles and sequencing

| bundle | owns | items | brief target |
|---|---|---|---|
| **A** | `custody-claim-lint.js`, `custody-claim-lint.test.js`, `CUSTODY.md` (header block only) | 1, 2 | ≤ 8 KB |
| **B** | `CUSTODY.md` (the two false sentences), `custody-claim-lint.js` canonical block | 3 | ≤ 6 KB |
| **C** | `spawn-shim.js`, `spawn-shim.test.js`, fixture | 4 | ≤ 7 KB |
| **D** | `env-scrub.js`, `env-scrub-capture.test.js` | 5 | ≤ 6 KB |
| **E** | `server-entry.js`, `host-free-driver.js`, `custody-runtime.test.js` | 6, 7 | ≤ 8 KB |

**Serial:** A → B (same files; A's refuse-not-skip must exist before B corrects a bound sentence).
**Parallel with A/B:** C, D (disjoint files). **After A:** E, because item 7's disclosure lands in
`CUSTODY.md` and must not contend with A or B.

**Every brief is sized under the ED-257 12000 B floor — deliberately, and this is a design decision not a
convenience.** S-03 lost bundle 10c to the 20-minute bound with a 16810 B brief; the wrapper warned at fire
time and the warning went unread. Sizes above are targets for the *brief*, not the diff.

**Every dispatch sets `WARPOS_DISPATCH_BACKGROUND=1`** (ED-353) — without it the wrapper fail-closed clamps
to 540 s, and the death is indistinguishable from a hang except by reading `elapsed_ms`.

## Owed at build close

The successor-tracker carry-forward of the class-form residual is already discharged (S-04 tracker). ED-340
stays OPEN with ED-354 as its concrete instance; ED-358's fix shape is item 1 and closes with it.

---

# β ROW 308 (`9c2e5d38`) — DIRECTIVES FOLDED IN

## Q1 DECIDE — `recommended`; class-form residual DISCLOSED, no general enforcer

Item 7 is settled: **disclose, do not enforce.** No general "every shipped control is invoked" enforcer this
sprint — it goes to S-05 against a settled set. β requires the **strong, actionable** form, not a hedge. The
paragraph must tell a reader what is true of *their* install:

> This package does not verify that its controls are invoked in YOUR install. AC-8.6 covers one control at
> start-up; the rest are proven by our test run only.

## Q2 DECIDE — atomic claim+canonical RATIFIED, and bind-first alone is NOT sufficient

Ratified: claim text and canonical copy are one atomic edit, one bundle. β adds that refuse-not-skip makes
every currently-skipped paragraph a violation, so **bundle A must also own every real `CUSTODY.md` paragraph
the new predicate newly refuses — compliance in the same change, no report-only ramp.**

**MEASURED, AND IT CHANGES THE PREMISE:** at `b2583d6` that set is **EMPTY** — 14 paragraphs match the
canonical predicate, **0 are newly refused**, and the non-canonical bolded lead-ins (`Status`, `Enforcer`,
`Proof scope`) are correctly not matched, so metadata does not become violations. Evidence:
`NEAR-MISS-BATTERY-RESULTS.md`. **The requirement is retained as a bundle-A EXIT CONDITION anyway** — re-run
the scan against the predicate AS BUILT, because a wider resemblance predicate could refuse real paragraphs.
The empty set is a property of this predicate at this commit, not a general fact.

## Q3 DECIDE — AC-8.6 IN, CAPPED

Cap: **one invocation + one named test + `check:pointers` resolving
`custody-runtime.test.js::selfcheck-runs-on-user-machine`.** Anything beyond the cap returns to β before
build. Bundle E is written to that cap; a builder that finds itself designing a self-check *framework* has
exceeded it and must stop.

## Q4 DIRECTIVE — the battery EXISTS and HAS BEEN RUN. Results change the scope.

`NEAR-MISS-BATTERY-RESULTS.md`, run at design against `b2583d6` on the real document, **controls first, 6/6
controls RED, baseline clean, zero files mutated** (pure-function probe). **13 blindnesses across THREE
rules, two of which were NOT in the nine residuals:**

- **R1 derivation — 7 blindnesses** (en-dash, hyphen, minus, colon, indent, Ceiling en-dash, Ceiling colon).
  Already in scope as item 1.
- **R3 status-token separation — 4 blindnesses, NEW.** `ASSERTED – NOT VERIFIED` (en-dash), hyphen,
  lowercase and extra-spaced variants **all evade conflation detection in the Proven section** — the exact
  mislabelling ADR-0041's separation rule exists to prevent. **Proposed INTO bundle A** (same file, same fix
  shape: normalize the token comparison or refuse a near-miss token in the wrong section).
- **R4 aggregate/worded rollup — 2 blindnesses, NEW.** Spelled-out numerals (`four of four claims verified`)
  and `every` vs `all` both ship green. **Proposed NOT in scope**, disclosed in the header's not-bound list
  instead: widening a prose-pattern matcher is precisely the "widen the matcher family" move whose ceiling
  S-03 already documented, and it is the shape most likely to become the next overclaim. **β's call at the
  design→build consult.**
- **R2 carrier-note — 0 blindnesses, 2 tolerances.** Double-space and NBSP are tolerated; the rule binds
  "modulo line-wrap whitespace" by design, so double-space is correct behaviour. NBSP is named as a
  tolerance in the header rather than repaired — narrowing it risks the false-RED class.

## AMENDMENT 3 — placement decided, and β's premise CORRECTED by re-verification

β directed me to re-verify its ADR-0041 note at `b2583d6` before designing to it, flagging that the note was
read during fix attempt 2. **I re-verified, and the premise needs two corrections:**

1. **`ADR-0041` does not exist in the vlad repo at all.** `find` returns nothing. It lives in **WarpOS** at
   `.claude/agents/president/_system/policy/adr/0041-credential-custody-prove-assert-boundary.md`, so an
   ADR-sourced correction is a **cross-repo** edit, not merely a third file.
2. **The verbatim-from-ADR obligation covers A1–A4 ONLY.** `CUSTODY.md:162` says *"The four paragraphs
   immediately below are reproduced verbatim from ADR-0041 ... an ADR amendment to this wording must update
   both this file and the lint's stored copy."* Confirmed against the ADR itself: it contains `**A1`–`**A4`
   and no others; A6/A7/A8 are **not** ADR-sourced (grep for their text in the ADR returns 0).

**Consequence:** a NEW Asserted paragraph would follow the A6–A8 precedent and be **two files, not three** —
unless we chose to make the ADR its source, which would add a cross-repo amendment for no gain.

**DECISION — the class-form ceiling ships as a `Ceiling` paragraph under P3.** Reasons: (a) atomicity width
is **two files** (`CUSTODY.md` + the lint's stored copy), the narrowest correct width; (b) it *is* a ceiling
— a statement of what is not proven — not an assertion about the threat model like A1–A4; (c) it sits
directly beside the AC-8.6 instance disclosure it generalises, which is exactly "disclosure lives where the
claim's reader is"; (d) it avoids a cross-repo ADR amendment. **Residual 2's "bind moves with the
correction" rule is therefore stated at the two-file width** for this paragraph.

## Bundle A scope, as amended

Bundle A now owns: `custody-claim-lint.js`, `custody-claim-lint.test.js`, `CUSTODY.md` (header block, the
class-form Ceiling under P3, and any paragraph the built predicate newly refuses — measured empty at
`b2583d6`), items **1, 2, 7, and R3**. Brief target rises to **≤ 10 KB**, still under the ED-257 12000 B
floor. If R3 pushes it past that, R3 splits into its own bundle rather than the brief growing — the S-03
lesson was a 16810 B brief that hit the bound 22 seconds after committing.

---

## What this spec does NOT decide — β's design→build consult

The release rule. It is minted fresh by β at the design→build boundary, against these acceptance criteria
and **before any result exists**. S-03's S1–S5 do not carry over.
