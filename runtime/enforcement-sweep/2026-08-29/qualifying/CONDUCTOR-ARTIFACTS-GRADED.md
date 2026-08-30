# Two findings against artifacts the conductor authored — verified at source, both hold

Lane E1 graded artifacts written by the conductor. beta relayed the findings; they are
checked here against the source rather than accepted from a twice-relayed claim. **Both hold,
and checking made them worse rather than better.**

## 1. ED-407 / R-11 is FALSE AS WRITTEN, and the conductor used the refuting mechanism

R-11 states: *"nothing records, beside a dispatch, the assembled prompt's sha and byte length
and the fire's wall-clock in a form a later requirement can be compared against."*

**Verified at source:** `scripts/dispatch-agent.js` and `scripts/dispatch-claude.js` both write
`started_at`, `prompt_bytes`, `cmdline_checksum` and `prompt_digest` into the completion record.
The sentence is false for the subprocess routes, verbatim.

**And the conductor read those exact three fields off E1's terminal row roughly two hours after
filing the row, and called them the containment proof.** A residual asserting a mechanism's
absence, refuted mid-round by the filer using that mechanism, with neither connected to the
other.

**The real gap is narrower and the sentence never named its unit:** the IN-PROCESS route. E2's
`record-inprocess` row carried `prompt_bytes: 0` and no digest. The claim quantified over "a
dispatch" when the defect holds for one route class — a scope stated without its unit, which is
the same shape as a count without one.

## 2. The register's completeness closure OVER-CLAIMS, and four EDs pass its own rule

`S6-7-RESIDUALS.md` closes: *"a residual that fails any of the rule's three conditions is absent
from it by construction and not by judgment."*

**Verified against the snapshot E1 graded:** ED-374, ED-381, ED-383 and ED-396 are each
`status: open`, each recorded during this sprint, each naming a gap the sprint did not close,
each outside every fix fence — ED-381's own text reads *"not in SP-20260829-001's scope —
successor candidate."*

**All four satisfy the three conditions and are absent from the register. They failed no
condition; they were absent by omission.** The derivation rule was honest; the closure sentence
claimed a property the rule did not deliver.

Worse than the +R-13/R-14 gap, which is an artifact of where the lane was pointed: **this is a
hole inside the version E1 could see, in the one sentence whose job was to bound completeness.**
It is the round's own subject — a completeness claim exceeding what was done — in the register
built to carry the round's residuals.

## Not repaired, deliberately

Neither artifact is being fixed. The register is a graded artifact under composition; editing it
now would change the object three lanes were pointed at and one lane graded. **The findings stand
and the successor inherits them with the omitted set named** — `{ED-374, ED-381, ED-383,
ED-396}` — rather than a corrected register that erases the finding.

## One open measurement, not taken

ED-408's *"27 read; 3 unread"* against R-13/R-14's *"of the twenty checks"* are different
populations for the same enumeration; at most one is right and neither prints its set. The
"twenty" is the conductor's. **Which is correct is not decided here** — running that measurement
mid-composition would be the conductor repairing its own graded artifact under another name.
