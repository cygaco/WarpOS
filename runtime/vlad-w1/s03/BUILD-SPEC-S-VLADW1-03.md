# BUILD SPEC — S-VLADW1-03 (design-from-evidence, SHORT per β `5a1d83bc` Q1)

Every item carries β's **four required fields**: 1 mechanism · 2 file · 3 the standing test that must go
RED on removal · 4 **CLASS or INSTANCE — if instance, the named residual.** β made field 4 the design
gate: *"three rounds regenerated the same class one syntax over."*

Scope anchors trace to `runtime/vlad-w1/gauntlet-r4-final/` + `ALPHA-RULING-R1-R4.md`. β noted it did
**not** audit the seven anchors individually — *"an unresolvable anchor surfaced at design is a finding,
not a formality."* **All seven resolve; I checked each against its evidence file.**

---

### 1 — R2: the ESM ordering claim → BOOTSTRAP RESTRUCTURE  *(bundle 8a)*
1. **Mechanism:** each entry statically imports exactly ONE specifier (`./env-scrub.js`), calls
   `initCredentialCustody()`, then reaches the program by dynamic import. β verified `env-scrub.js` has
   zero static imports, so the claim becomes structurally true rather than narrowed.
2. **Files:** `src/server-entry.js`, `driver/host-free-driver.js`, optional `src/bootstrap.js`.
3. **RED-on-removal:** revert an entry to a static server import → RED. Add a second static import → RED.
   Give `env-scrub.js` any import → RED (transitive closure).
4. **CLASS.** It removes the *possibility* of a module body evaluating before the scrub, rather than
   enumerating which bodies currently do. **Residual (named):** `node:` builtins still resolve first —
   stated in the re-derived sentence, not hidden.

### 2 — R2: P2's shipped claim exceeds its enforcer  *(bundle 8c)*
1. **Mechanism:** add a Ceiling paragraph naming raw-launch detection as a matcher family that widens but
   does not close the call-site-shape class, with capture-then-scrub named as what covers it at runtime —
   or narrow half (b)'s wording. **Do not weaken the clause into uselessness:** the security lane re-ran
   five raw-launch shapes and all five were caught. *"The enforcer improved; the claim did not."*
2. **File:** `CUSTODY.md`.
3. **RED-on-removal:** the claim lint's existing rules; plus item 3's extended bind.
4. **INSTANCE.** A sentence corrected is one sentence. **Residual:** nothing mechanically detects a
   *future* P-clause claiming more than its control — the lint checks tagging, verbatim ceilings and
   status-token separation, never whether a claim is TRUE. Carried as named debt, not closed here.

### 3 — R2: the P2/P4 exemption sentence, wrong at the source and outside the bind  *(bundle 8c)*
1. **Mechanism:** correct sentence 3 of `SANCTIONED_CARRIER_NOTE` (P2 exempts `spawn-shim.js`, **not**
   `model-seam.js`) **and extend `CARRIER_NOTE_BOUND_SENTENCES` to cover it**, closing the `slice(0,2)`
   carve-out that let it drift.
2. **Files:** `src/model-seam.js` (that constant only), `scripts/checks/custody-claim-lint.js`.
3. **RED-on-removal:** reword the previously-carved-out sentence → lint RED.
4. **CLASS, narrowly.** Extending the bind to the *whole* note closes drift for every sentence in it, not
   just this one. **Residual:** other shipped claim strings (`server-entry.js` tool descriptions, driver
   output) remain unbound — the A6 coverage ceiling, disclosed and unchanged.

### 4 — R3: the wiring proof must be able to go RED  *(bundle 8b)*
1. **Mechanism:** delete the `|| true` tautology; assert both classification directions; widen `canSpawn`
   to bare `child_process`, `createRequire` and dependency-reached spawn (incl. the SDK); **invert the
   failure direction — unresolvable/bare classifies spawn-capable-unless-proven-otherwise.**
2. **Files:** `test/env-scrub.test.js`.
3. **RED-on-removal:** **delete the scrub call from `server-entry.js` → RED.** This is the falsifier the
   predecessor lacked; today that deletion leaves the suite green.
4. **CLASS for the failure DIRECTION** (fail-closed replaces exempt-by-default, so a fourth spelling is
   caught rather than skipped). **INSTANCE for the enumeration** of the three known spellings.
   **Residual, named:** a specifier the resolver mis-resolves *confidently* still classifies wrongly;
   only the unresolvable case fails closed.

### 5 — `initCredentialCustody` idempotence semantics  *(bundle 8b)*
1. **Mechanism:** decide **re-scrub-on-call** vs **documented single-shot**; fix the guard ignoring its
   `names` argument; record the worker-thread realm boundary.
2. **Files:** `src/env-scrub.js`, `test/env-scrub.test.js`.
3. **RED-on-removal:** provision a credential *after* the first call → the test pins the chosen semantics.
4. **CLASS if re-scrub-on-call** (any later-provisioned credential is scrubbed regardless of source);
   **INSTANCE if single-shot** — and then the residual is explicit: *late provisioning is not covered, by
   decision, and the header says so.* β called this "a real decision with user-visible consequence", so
   the builder chooses and justifies rather than defaulting.

### 6 — AC-8.6: the product-layer self-check  *(bundle 8a, folded into the entry work)*
1. **Mechanism:** invoke a custody self-check when the server or job runner starts — real work, not a
   pointer rename. This is what makes P3 a runtime control in a *user's* install rather than only in our
   test run.
2. **Files:** `src/server-entry.js` (+ its named test).
3. **RED-on-removal:** remove the invocation → the named test RED; and `check:pointers` resolves
   `custody-runtime.test.js::selfcheck-runs-on-user-machine` instead of reporting missing-NAME.
4. **INSTANCE.** It closes AC-8.6 specifically. **Residual:** the general property — *every shipped
   control is invoked by some product-layer path* — is what item 4's walker approximates; AC-8.6 is one
   instance of it, and no enforcer asserts the general form.

### 7 — R1 RE-ESTABLISHED as standing artifacts  *(bundle 8b)*  — β Q4 CONDITION
1. **Mechanism:** commit the round-4 TOCTOU battery (stateful `toString`, prototype chain, stateful
   getter, Proxy `get` trap, `String` object, array value, own-`__proto__`) **plus** the three round-3
   attacks, each asserting REFUSED with a raw control proving an unguarded child does obtain the value.
2. **Files:** `test/spawn-shim.test.js`.
3. **RED-on-removal:** revert any one guard → its attack test RED.
4. **CLASS for regression** (the boundary can no longer silently lose a property it once had);
   **INSTANCE for discovery** — a novel carrier is not covered by any of them. **Residual:** `opts.cwd`
   and `opts.stdio` remain unscanned, uncovered-but-unexercised; two lanes reached opposite filing
   judgments on that and both are recorded.

---

## The five required-present falsifier fixtures (record-trust gate)
`F-1` three spawn spellings classify spawn-capable · `F-2` **deleting the scrub call from
`server-entry.js` → RED** · `F-3` credential provisioned after the first `initCredentialCustody()` call ·
`F-4` reword the previously-unbound carrier sentence → lint RED · `F-5` a `verified_by` naming a real
file but a missing test node → RED, and distinguishable from a missing file.
Full doctrine + partitioning: `runtime/vlad-w1/s03/RECORD-TRUST-GATE-S-VLADW1-03.md`.

## Bundles and sequencing
**Parallel (disjoint files):** `8a` entries+bootstrap+driver · `8c` claims · `8d` engine MEDIUMs.
**After 8a:** `8b` walker + idempotence + R1 battery — its F-2 asserts against the entries' final shape.
One file, one owner: 8a took the driver's two defects off 8d so no two fixers share `host-free-driver.js`.

## Owed at build close
**ADR-0041 Amendment 4 ANNOTATION** naming the bootstrap as the control's firing point (β condition 6,
the A5 obligation). Not a new amendment — an annotation on the existing one.
