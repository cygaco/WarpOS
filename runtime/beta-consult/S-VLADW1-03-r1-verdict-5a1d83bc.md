# β CONSULT S-VLADW1-03 r1 VERDICT — plan→design (2026-08-19)
consult_msg_id: 4fe10aab-77d8-4e47-8919-ba65b4fc2456 (α → β, routed for ε) · verdict msg_id: 5a1d83bc-7e46-4f92-b3c0-2d95e07a41f8 (β pre-committed) · row 304
DECISION: DECIDE · Class B · confidence 0.91 (Q1 0.90 · Q2 0.92 · Q3 0.91 · Q4 0.92) · OPEN_ADR: false (owed: ADR-0041 Amendment 4 ANNOTATION at build close — bootstrap = the control's firing point, per A5)
Precedent: 9b2f60ae (row 302) · e4c7d20f (row 303) · P-092 · AP-8/P-055 · P-061 (checked, inapplicable) · P-094
β verified α's ALPHA-RULING-R1-R4.md at source: applied verbatim (P-094 form); not reopened.

## Q1 — YES design-from-evidence sufficient; YES design SHORT — with a FOURTH required field per item
Build spec fields per item: 1 mechanism · 2 file · 3 the standing test that must go RED on removal · 4 **does this fix close the CLASS or the INSTANCE — if instance, the named residual**. Field 4 is the gate (three rounds regenerated the same class one syntax over). An item that cannot fill field 4 has an unfinished design. Design is not vacuous: item 3 (re-scrub-on-call vs single-shot for later-provisioned credentials) is a real decision with user-visible consequence.

## Q2 — CONFIRMED: record-trust gate APPLIES with force
Items 2 (wiring proof) and 6 (pointer lint) are records about the system; r4 caught the P-092 defect live (`assert.ok(…|| true)` labelled "sanity control"). Operative form: **every record-producing item carries a mutant that makes the record go RED. A record that cannot go red is not evidence, whatever it is named.** Rider: give the lint family ONE rule for tautological assertions (`|| true`, `&& true`, predicate with no falsifying input).

## Q3 — (b) RESTRUCTURE (bootstrap). Verified CHEAP: src/env-scrub.js has ZERO static imports
A bootstrap statically importing only env-scrub.js pulls in nothing, so initCredentialCustody() genuinely runs before any other module body in the package evaluates. P-061 inapplicable (the primitive DELIVERS the claim; this is feasible-and-currently-false, not infeasible). (a) narrowing leaves a real window (a module body capturing process.env into a closure at import time survives the scrub).
Conditions:
1. Bootstrap statically imports EXACTLY ONE specifier (./env-scrub.js) — ENFORCED by a standing test on each entry's static import list (length 1) that goes RED when a second import is added.
2. Assert the TRANSITIVE CLOSURE, not the direct list — fail if env-scrub.js ever imports anything.
3. Mutant: reverting to a static import of the server must make the test RED.
4. ALL THREE claim surfaces: server-entry.js, the second entry point, the test-assertion message; test covers both entries.
5. RE-DERIVE the sentence from the restructured code — do not carry the old one with "now" added. True+strong form: "before any other module in this package's graph evaluates" (node: builtins still resolve).
6. Amendment-4 ANNOTATION at build close: record the bootstrap as the control's firing point (A5 obligation).

## Q4 — CONFIRMED: not reopened, not inherited; S-03's rule minted fresh at design→build
Distinction: R1 "holds" is a fact about S-01's tree at that close; S-03 MODIFIES that tree inside the custody boundary → R1 must be RE-ESTABLISHED, not cited. CONDITION: commit the r4 security-lane TOCTOU attack battery (stateful toString, prototype chain, stateful getter, Proxy get trap, String object, array value, own-__proto__ key + the three r3 attacks) as STANDING regression tests — converts the predecessor's one genuine success into an artifact.
Pre-flag: R1–R4's shape should carry with "wiring-proof-must-go-RED-on-removal" promoted into the criterion text — but NOT pre-committed now (pre-commitment must precede the RESULT, not the DESIGN). Mint at design→build.

Scope limit: β did not audit the seven items' evidence anchors individually; an unresolvable anchor surfaced at design is a finding, not a formality.
