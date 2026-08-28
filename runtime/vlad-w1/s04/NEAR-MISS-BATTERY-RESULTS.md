# NEAR-MISS BATTERY — every bound rule, CONTROLS FIRST — S-VLADW1-04 design phase

Required by β row 308 Q4 (DIRECTIVE): *"a near-miss battery over EVERY bound rule (A5 carrier-note
binding, status-token separation, the derivation), CONTROLS FIRST, must EXIST AND HAVE BEEN RUN before
design closes; each variant RED or filed as a named blindness in build scope."*

**Run by ε at design, against `b2583d6`. Method: `lintCustodyStatement(content)` — a pure function.
NO FILE WAS MUTATED**; every probe is an in-memory string. Worktree verified clean before and after.

**BASELINE: the real `CUSTODY.md` lints clean (`ok=true`, zero violations).** Without that, every row
below would be noise.

**CONTROLS: 6/6 fired RED.** A rule whose control does not fire proves nothing about its variants; all six
fired, so all four rule-rows are valid.

## R1 — the Asserted/Ceiling derivation

| kind | authoring | result | rule fired |
|---|---|---|---|
| CONTROL | `**A9 — ` (em-dash U+2014) | **RED** | `unbound-paragraph` |
| CONTROL | `**Ceiling — ` (em-dash U+2014) | **RED** | `unbound-paragraph` |
| variant | `**A9 – ` (en-dash U+2013) | **GREEN** | — |
| variant | `**A9 - ` (hyphen-minus) | **GREEN** | — |
| variant | `**A9 − ` (minus U+2212) | **GREEN** | — |
| variant | `**A9: ` (colon) | **GREEN** | — |
| variant | `  **A9 — ` (2-space indent) | **GREEN** | — |
| variant | `**A9 — ` (NBSP before dash) | RED | `unbound-paragraph` |
| variant | `**Ceiling – ` (en-dash) | **GREEN** | — |
| variant | `**Ceiling: ` (colon) | **GREEN** | — |

**7 blindnesses.** NBSP fires because JS `\s` matches U+00A0 — an accident in our favour, not a design.

## R2 — A5 carrier-note sentence binding

First probe attempt was INVALID and is reported rather than hidden: the three bound sentences are not exact
substrings of `CUSTODY.md` (the document line-wraps them; the rule compares modulo line-wrap whitespace), so
the precondition failed and no conclusion was available. Re-probed against the document's wrapped form.

| kind | authoring | result | rule fired |
|---|---|---|---|
| CONTROL | reword a bound fragment | **RED** | `carrier-note-not-verbatim` |
| variant | hyphen → en-dash inside the note | RED | `paragraph-not-verbatim`, `bound-paragraph-missing` |
| variant | straight → curly apostrophe | RED | `carrier-note-not-verbatim` |
| variant | single → double space | **GREEN** | — |
| variant | space → NBSP | **GREEN** | — |

**0 blindnesses, 2 tolerances — classified honestly rather than counted as failures.** The rule binds
"modulo line-wrap whitespace" *by design*, so a double space is deliberately tolerated and is NOT a defect.
NBSP is the edge worth naming: it is not line-wrap whitespace, and it is tolerated. **Filed as a named
tolerance, not scoped for repair** — narrowing whitespace tolerance risks the false-RED class the companion
doctrine warns about.

## R3 — status-token separation (Asserted token inside the Proven section)

| kind | authoring | result | rule fired |
|---|---|---|---|
| CONTROL | `ASSERTED — NOT VERIFIED` (exact) in Proven | **RED** | `status-token-conflation` |
| variant | `ASSERTED – NOT VERIFIED` (en-dash) | **GREEN** | — |
| variant | `ASSERTED - NOT VERIFIED` (hyphen) | **GREEN** | — |
| variant | `asserted — not verified` (lowercase) | **GREEN** | — |
| variant | `ASSERTED  —  NOT VERIFIED` (extra spaces) | **GREEN** | — |

**4 blindnesses. β's suspicion was correct: the same near-miss class exists in a SECOND rule.** A
near-miss status token placed in the Proven section evades conflation detection entirely — the exact
mislabelling ADR-0041's separation rule exists to prevent.

## R4 — aggregate-count / worded-rollup conflation

| kind | authoring | result | rule fired |
|---|---|---|---|
| CONTROL | `4/4 claims verified` | **RED** | `aggregate-count-conflation` |
| CONTROL | `all custody controls verified` | **RED** | `worded-rollup-conflation` |
| variant | `four of four claims verified` (spelled out) | **GREEN** | — |
| variant | `4 of 4 claims verified` | RED | `aggregate-count-conflation` |
| variant | `every custody control verified` | **GREEN** | — |
| variant | `4 / 4 claims verified` (spaced slash) | RED | `aggregate-count-conflation` |

**2 blindnesses.** Spelled-out numerals and `every` (vs `all`) both evade — a rollup a user would read as
an aggregate claim ships green.

## Totals and disposition

**13 blindnesses across THREE rules, plus 2 tolerances in a fourth.** The derivation was the known one;
**R3 and R4 were not known before this battery, and neither is in the nine residuals α named.**

| rule | blindnesses | disposition |
|---|---|---|
| R1 derivation | 7 | **In build scope** — residual S2-a / ED-358, bundle A. Closed by refuse-not-skip. |
| R3 status-token | 4 | **NEW — proposed for build scope**, bundle A (same file, same fix shape: normalize the token comparison, or refuse a near-miss token in the wrong section). Returns to β if it widens the bundle beyond its cap. |
| R4 aggregate/rollup | 2 | **NEW — filed as a NAMED BLINDNESS.** Proposed NOT in scope this sprint: widening a prose-pattern matcher is the "widen the matcher family" move whose ceiling S-03 already documented, and it is the shape most likely to become the next overclaim. Recommend disclosing it in the header's not-bound list instead. **β's call.** |
| R2 carrier-note | 0 (2 tolerances) | Not scoped. NBSP tolerance named in the header. |

## The consequence for β Q2 — and it CHANGES the directive's premise

β required bundle 1 to own *"every real `CUSTODY.md` paragraph the new predicate newly refuses"*, so
compliance lands in the same change with no report-only ramp.

**Verified at `b2583d6`: that set is EMPTY.** Under the proposed resemblance predicate (bolded, opening
`A<n>`/`Asserted`/`Ceiling`, any dash/colon/indent), **14 paragraphs match the canonical predicate and
ZERO real paragraphs are newly refused.** The document is already fully compliant with the stricter rule.

Also checked, because over-refusal is the false-RED risk: the other bolded lead-ins in the document are
`Status`, `Enforcer`, `Proof scope` (P-clause metadata, ×4 each) and three prose bolds. **The proposed
predicate does not match them**, so refuse-not-skip does not turn P-clause metadata into violations.

**So β's compliance requirement is satisfied vacuously at this commit — but the requirement stands**, and
the design keeps it as a bundle-A exit condition: re-run this scan against the predicate as built, because
a WIDER resemblance predicate than the one proposed could refuse real paragraphs. The empty set is a
property of this predicate at this commit, not a general fact.
