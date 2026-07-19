# ADR 0024 — The provenance delegation guard's HONEST CEILING (.role-access hardening; runtime layer is the real protection)

**Date:** 2026-07-18
**Status:** accepted
**Class:** B (security-verification architecture)
**Sprint:** SP-20260718-003 (Phase 1 — routing + security truth) · post-floor gauntlet · R6-BE-002 evasion probe SLIPPED
**Amends:** ADR-0022 (the hunter-producer teeth-2 delegation-complete guard — its completeness CLAIM is rescoped here) · **Relies on:** ADR-0020 (same-run binding-evidence layer), ED-225 (single choke-point)
**β consult:** DECIDE B/0.88, OPEN_ADR:true, 2026-07-18 (gauntlet→release boundary; logged `paths.betaEvents`); pre-registered condition ("if the evasion probe slips, the AST upgrade becomes Class B + OPEN_ADR") fired.

---

## Context — the gauntlet caught a real false-green in the VERIFICATION surface

The directed R6-BE-002 evasion probe (a security-panel requirement) slipped: 2 of 3 cross-provider reviewers
(a BINDING gpt FAIL + an agy HIGH) demonstrated that `scripts/checks/provenance-invariants.js#hasLocalIdentityDecision`
— a VALUE-KIND-AWARE REGEX detector, not a JS-AST parser — can be evaded. A consumer can re-implement a COMPLETE
hunter-identity decision while naming NEITHER the `security_claude_hunter` literal NOR `HUNTER_ROLE` NOR a raw
`"in-process-agent"` comparison, by RECONSTRUCTING the role value at runtime:

```js
if (rec.role === ["security","claude","hunter"].join("_") && rec.shape === pv.IN_PROCESS_SHAPE && rec.provider === "claude") …
```

gpt's actual finding was precise: **"the binding defect is the FALSE-GREEN delegation guard."** The defect is not a
specific missable string — it is the guard's DISHONEST COMPLETENESS CLAIM ("delegation-COMPLETE / a missed site is now
self-detecting"). A VALUE-detector is bounded by the identity value, which runtime reconstruction (join/concat/char-codes)
defeats — and no static analysis (regex OR full-AST value-flow) can bound every reconstruct-and-compare in a dynamic
language; it is undecidable.

## Decision — β DECIDE B/0.88, the refined option (i): harden the ACCESS + tell the truth about the ceiling

**Rejected:** (ii) a full JS-AST/dataflow parser NOW — over-engineering at pre-MVP, a new dependency (the repo has none),
and it does NOT close the undecidable residual either. (iii) ship no code — impossible: a binding FAIL stands and the
completeness claim is dishonest.

**Accepted (i), three parts:**

1. **`.role`-ACCESS structural hardening (β's inversion).** A NEW detector `readsRecordRoleForDecision()` flags a CONSUMER
   that READS a record's `.role` field in a decision context (member / reversed / computed `["role"]` / destructure
   `{role}=<record>` / alias `const x = rec.role`). Rationale: a COMPLETE hunter-identity decision MUST read the record's
   role (`isHunterRecord` needs provider+shape+ROLE), and honest consumers NEVER read a record's `.role` — they delegate
   to `pv.isHunterRecord/recordMatchesLane/isSanctionedHunterLane`. Detection is inverted from the unbounded role VALUE
   to the bounded `.role` ACCESS, so the gpt-demonstrated reconstruction (`role === [...].join("_")`) is caught while the
   reconstructed value is irrelevant. Scoped by CONSUMERS-list membership (module identity — the verifier's own legit
   `r.role === HUNTER_ROLE` reads are exempt BY CONSTRUCTION, NOT a settable flag — TEETH-1). Does NOT flag `contract.role`
   in a message string or an opts-param destructure (TEETH-2).

2. **HONEST-CEILING claim rescope (P-061 nlink precedent).** The docstring + OK message STOP claiming
   "delegation-COMPLETE / self-detecting." The TRUE claim: the guard flags the COMMON static identity re-implementation
   forms that NAME the value OR read the record's `.role` (member/reversed/computed/destructure/alias/Object.is/switch) —
   it does NOT claim to catch EVERY static form (a novel syntactic wrapper can evade any regex); and a fully-computed
   runtime obfuscator that names NEITHER (`Object.entries(rec).find(([k,v]) => v === <reconstructed>)`) is NOT statically
   decidable and is out of scope. The dishonest completeness claim WAS the false-green gpt bound-FAILed; removing it is the load-bearing fix.

3. **The RUNTIME binding-evidence layer is the real protection (why the residual is inert).** The undecidable residual is
   attacker-only (no honest consumer writes it) and yields NO live false-green: the BINDING panel gates require a REAL
   same-run writer-stamped hunter record with matching `evidence_digest` + `code_sha` + `panel_run_id` (ADR-0020 / ADR-0022).
   A re-implemented identity predicate that produces no such record cannot attest — proven in
   `cert-attest-panel.test.js` (a bypass without a real same-run hunter record never attests). The static guard is
   defense-in-depth; the live evidence layer is the actual mandatory-pass barrier.

## Consequences / future-reader guards

- **Do NOT re-inflate the claim to "complete / self-detecting."** That dishonest overclaim is exactly the false-green a
  binding reviewer FAILed. If you add coverage, name what it does and does not catch.
- **Do NOT drop the runtime binding-evidence layer thinking the static guard is complete.** It is not, and cannot be. The
  live same-run evidence correlation is the real protection.
- A full AST/dataflow parser remains DEFERRED defense-in-depth debt (ED-229) — not a prerequisite, and it would not close
  the undecidable residual on its own.

## Enforcer

`scripts/checks/provenance-invariants.js` (`readsRecordRoleForDecision` wired into `run()`) +
`scripts/checks/provenance-invariants.test.js` (R6-BE-002 teeth: every evasion FORM flags, legit sites pass) + the live
binding-evidence layer (`cert-attest.js#attestPanelRun` + `cert-attest-panel.test.js`). Binding-clear: the FAILing gpt
security lane re-reviews PASS on the hardened guard + rescoped claim. Deferred debt: ED-229 (AST/dataflow parser).

---

## CORRECTION — 2026-07-18 (ED-231): the "evidence layer is the real protection" premise was REFUTED, then RESTORED within a named boundary

The body above (points 3, and the title) asserts UNQUALIFIED that "the runtime binding-evidence layer is the real
protection." A same-day gauntlet re-review REFUTED that (reproduced): `cert-attest` validated record FIELDS but not
WRITER ORIGIN, so a HAND-AUTHORED forged ledger record with the right fields ATTESTED `ok:true` (ED-231). So at the
time this ADR was accepted, the premise it rested on was FALSE — the "residual is inert because the evidence layer
protects" reasoning did not hold against ledger forgery.

RESTORED (ADR-0025, α RULING option A): the shared writer now signs canonical identity fields with a per-session HMAC
secret; `cert-attest.attestLane` verifies FIRST, so an unsigned/forged record is NOT attested (the reproduced forgery
fails-closed). The evidence layer IS the real protection AGAIN — but ONLY **WITHIN the named same-user boundary**
(a same-user FS-read adversary can read the secret; ADR-0025). Read every "the evidence layer is the real protection"
line in the body above as QUALIFIED by ADR-0025's boundary — inert against the MISTAKE class, with the deliberate-intent
account case as the named ceiling. Do NOT cite this ADR's unqualified phrasing as a completeness claim.
