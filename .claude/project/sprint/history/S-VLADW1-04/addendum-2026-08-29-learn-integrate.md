# S-VLADW1-04 — addendum 2026-08-29: learning_candidates promotion record

`retro.yaml` is append-only under the sprint-history guard, so the promotion status of its eight
`learning_candidates` is recorded here rather than by editing the candidate blocks in place.
All eight were promoted on 2026-08-29 — three of them by the earlier `/beta:integrate` pass the same
day, which `/learn:integrate` verified at source rather than re-landing. None were skipped.

| # | Candidate (opening words) | Promoted to | ED |
|---|---|---|---|
| 1 | "Approval is not a truth check…" | **β judgment model P-111** (landed by `/beta:integrate` 2026-08-29, rows 316/317) — verified present, not re-landed | ED-364 (cited, open, + amendment) |
| 2 | "A coverage claim stated at a coarser granularity than the mechanism has…" | **β judgment model P-114/P-115/P-116** (`/beta:integrate`) — verified present; the reasoning-side statement of the same class landed as `reasoning-frameworks.md` § *Confirmation is not coverage* clause 3 | ED-358 (cited, open) |
| 3 | "A comment stating an invariant is not an enforcer of it…" | `reasoning-frameworks.md` § *Confirmation is not coverage* clause 5; `/enforcement:log` skill body, Anti-patterns | — |
| 4 | "A text-matching enforcer cannot distinguish a violation from a description of one…" | `reasoning-frameworks.md` § *Text matchers cannot tell a violation from a description of one*; `/enforcement:log` § *Before you accept an enforcer…* item 2 | — |
| 5 | "A brief is a claim surface like any other…" | `paths.agentDispatchGuide` §6 *Brief content contract*, clauses 1–2 | ED-362, ED-363 (cited, open); **ED-378** (new, refusal-standing half) |
| 6 | "A read-scope-limited reviewer that reports what it could NOT see…" | `paths.agentDispatchGuide` §13 *Review / lane envelopes — the negative-space fields* | ED-362 (cited); **ED-377** (new, envelope-side field presence) |
| 7 | "Lane independence is not ceremony…" | `paths.agentDispatchGuide` §3, second half of the cross-family blockquote | — |
| 8 | "Refusing an exception clause when minting a rule is load-bearing…" | **β judgment model P-119** (`/beta:integrate` 2026-08-29, rows 309/316) — verified present, not re-landed | — |

**New enforcement debt filed:** ED-377 (lane envelopes must carry `what_i_could_not_assess` /
`files_i_could_not_see` / `execution_proven` / `what_would_confirm_or_refute`, and the conductor must
verify a read-scope-limited finding against the full file) and ED-378 (brief DISPATCH NOTE +
refusal standing). Candidates citing ED-358/362/363/364 reuse the existing open entries; no duplicate
ED was filed.

**Verified at source, not asserted:** before this run, the four negative-space envelope field names
appeared only in per-run `runtime/` artifacts and ledger prose — never in a durable spec, guide or
schema. Confirmed by two independent searches, which is why ED-377 is genesis rather than a citation.

Written by `/learn:integrate`. The candidate blocks in `retro.yaml` are unchanged — the guard's
refusal to edit a closed sprint record is the reason, not an oversight.
