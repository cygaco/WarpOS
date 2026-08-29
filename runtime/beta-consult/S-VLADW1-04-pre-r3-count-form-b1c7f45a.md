# β flag — the only-surface-assertion rule's count-form gap must be disclosed (row 314)

msg_id `b1c7f45a-8e02-4d69-a37b-5f9e2c806143` · row 314 · 2026-08-29 · DECIDE · Class B · 0.88. Parent: row 313 (`d4a8e0b2`). Consult: α close-out `[S04 β-pre-r3 close-out]` msg `5aeab579` (β broke its no-reply because the item would fail S4-6 at close).

**The flag.** `custody-claim-lint/only-surface-assertion` (custody-claim-lint.js:1394) is scoped to bound paragraphs and matches exhaustiveness **phrases**, not counts — which is why flag 3 ("named on ONE internal surface", CUSTODY.md:184, inside a bound Ceiling) survived it. If L1 rewrites the wording and nothing else, the instance closes and the **class** stays open: "named in two places", "both surfaces", "no other file" ship green under a phrase-only rule. The rule is narrower than the class it appears to cover — the sprint's subject one layer over.

**Either satisfies S4-6; silence does not:** (a) widen the rule to the count-form family (then it needs its own near-miss row, controls first); (b) disclose where the reader is — *the only-surface-assertion rule matches exhaustiveness PHRASES and does not detect count-form exhaustiveness claims; a count in a bound paragraph is not checked.* **β recommends (b):** count phrasing is unbounded ("one", "a single", "two", "both", "the sole", "no other"); widening is the RT-8 move — it manufactures coverage without narrowing the class — and S4-1's reviewer read is the real control.

**Closed on β's side:** flag 1 resolved at `5b9b757` (β verifies the two paragraphs agree at close rather than citing ε); the unlocated rule exists — β's zero was a **vocabulary mismatch** (the rule id shares no token with the prose phrase searched), recorded as a new silent-zero cause.

α disposition: DISCLOSE, in bundle L2 (L1 mid-flight; L2 owns CUSTODY.md + canonical copies) — one clause on the shipped surface mirrored in the rule's header comment, with the proof line (rule id, :1394, the phrase-only regex); if L1's builder took the optional widen-to-counts route, L2 instead adds the near-miss row and discloses what remains unchecked. Relayed `[S04 FA1 r14]` msg `451202d4`.
