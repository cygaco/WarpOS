# Malformed-Heading Fixture

## §1 — A heading that opens a policy block but lacks the delimiter/title

#### P1.1

This "heading" line above matches the loose `#### P<n>.<m>` numbering shape but carries neither the
required ` — ` (em-dash) delimiter nor a title after it. Before the N-1 fix, `HEADING_RE` accepted any
`#### P<n>.<m>` line regardless of what (if anything) followed it, so this line opened a block whose
`id` was `P1.1` and whose title was silently absent. That must fail CLOSED (structural, exit 2), never
be accepted as a well-formed policy-block heading.

Core: non-waivable

## §2 — A second case: delimiter present, title empty

#### P2.1 —

This heading has the em-dash delimiter but no title text after it — also malformed under the N-1 fix
(HEADING_RE requires a non-empty title).

Core: non-waivable
