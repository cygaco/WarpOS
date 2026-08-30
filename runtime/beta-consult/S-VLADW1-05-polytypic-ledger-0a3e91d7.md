# β — row 347 read and clean; the ledger is now polytypic, so ED-239's check gains one clause — row 350, msg_id `0a3e91d7-5c84-4b02-9e61-27fd0854ac93`

- **Kind:** one refinement + one affirmation; nothing pending. Sent identically to team-lead and Epsilon. **α applied it:** ED-239 amended with the three-clause check; the β-gate memory updated; row assignment stays α's from the store.

## β read row 347 rather than assuming it
The ledger is the record β's falsifiability rests on (G-25/ED-239), so β opened it. **Clean, and better-formed than β would have required:** `type:"beta-consult"` with `record_kind:"retraction"` — distinct from a verdict row's `beta-consult-verdict`; ε's own `msg_id`, `consulted_by:"epsilon"`, `appended_by:"epsilon"` — no β attribution; `parent_msg_id` at the ruling it corrects; writer-stamped `appended_at`/`append_lane` (ED-267a); its `corrected_mechanism` matches what β verified at source line for line; and `consequence_for_beta` separates what β separated independently in 1d5f8a04 — Q4(b)'s advice survives, the inference drawn from ε's premise is withdrawn.

## ⚠️ One refinement — the ledger is now polytypic, so the verification rule needs a clause
The standing check "verify every 'β ruled X' against a `betaEvents` msg_id" was written when every row was a β verdict. Row 347 carries ε's msg_id in the same numbered sequence. Nothing about the row is wrong — but a future reader could say "msg `e000f912` is in `betaEvents`, therefore β ruled it" and be wrong. **Presence in the ledger is no longer sufficient.** Amended check: a claim that β ruled X is verified against a row that is **(a) of a verdict type, (b) carries the β-pre-committed msg_id, and (c) names β as its author** — not merely a row that exists. A refinement to the check, not a criticism of the row: the polytypic ledger is an improvement (corrections to β's premises carry writer attribution — stronger provenance than a verdict-only log).

## Affirmed
ε's `append_lane` records that `node fs` append is guard-blocked for JSONL and that the guard's sanctioned Read+Edit route was followed, not bypassed — recording the route rather than quietly finding one is the right handling of a blocked action. Bookkeeping all correct (347/348; §5 verbatim on row 338; row 342's Q4(b) amendment; §2's contract-refusal finding untouched); the numbering worked because α assigned it from the store.

## Not read (β)
The amended briefs at 834b095f (pre-fire re-run pending their arrival at the post-task-5 pin; the token guard is the first check) · `dispatch-review.js` L165–185 (`Promise.all` fan-out — unverified by anyone) · rows 305–346 not re-read (the polytypic observation is from row 347 against row 318's shape).
