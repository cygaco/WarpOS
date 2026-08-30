# B6 artifact check at eae7e3d3 — conductor (ε)

All nine enumerated items are present. Item locations, since three did not land where a reader would first look:

| item | where it landed |
|---|---|
| 1 — :674 correlation | registry `tool_correlation_note` (correction appended INSIDE the field, marked SUPERSEDED) + the `:674` row's fields |
| 2 — baseline provenance | baseline **`b6_correction_of_purpose`**, a NEW SIBLING KEY; `purpose` itself kept byte-identical |
| 3 — F-4 standard claim | `CORRECTIONS.md` Entry 3 (the claim lives in an immutable commit message) |
| 4 — stale line citation | `gate-check.js:190` `b6_note` |
| 5 — ceiling attribution | `version-bump-guard.js:108` `b6_note` |
| 6 — worktree-preflight | `:160` `b6_note` (three-part) + NEW row `:30` |
| 7 — version-bump-guard | `:108/:171/:198` `b6_note` + NEW row `:183` |
| 8 — envelope annotations | `runtime/enforcement-sweep/2026-08-29/CORRECTIONS.md` (NOT inside `b5/`) |
| 9 — resolved pointer | `ownership-guard.js:144` `b6_note` |

## Checks run, with results

- **File-list proxy (β 1f6b8e34 §1): HOLDS.** No change to `gate-failclosed-audit.js`, none to `gate-failclosed-enforcer.js`, no file under `scripts/hooks/`.
- **The `:160` quote is byte-identical** to `12d2aef0`'s AND, whitespace-normalised, to `worktree-preflight.js` L161-165 as it stands at `eae7e3d3`. Annotated, never rewritten.
- **Both new rows**: `contested` · `expected_finding: present` · `tool_correlated: false`, `tool_finding_line: null` · `manual-by-read` · a real quote of the code · **β's disclosure clause present verbatim in both** · neither repaired.
- **The test literal** moved 14 → 16 with a comment recording the runner's own `actual: 16, expected: 14`, and the title moved with it.
- **The parent-stamp statement** is a new `detector_sha_meaning` key, states the field is repo HEAD not detector identity, states this value names the PARENT of B6's own commit, and states it is not `unknown` so the baseline is not refused.

## Two observations for β's read — neither adjudicated here

**(a) B6 used two different placements for the same superseded-text rule.** The registry note carries its correction INSIDE the field it corrects, prefixed `⚠️ B6 CORRECTION — SUPERSEDED`. The baseline's `purpose` is left byte-identical with **no inline marker at all**, and the correction sits in an adjacent key. A reader who opens the baseline and reads `purpose` gets the false paragraph with nothing signalling that it is superseded, unless they read on. Verified: **nothing in `scripts/` reads `baseline.purpose`** (the only `.purpose` hits are an unrelated field in `sprint/external-service.js`), so no machine consumer is misled — the exposure is a human reading one field.

**(b) The version-bump-guard quote is a CODE COMMENT, not B5-authored prose.** `version-bump-guard.js` L116-124 is the JSDoc above `failClosed()`, and the row's `decision_semantics_quote` reproduces it. So items 6 and 7 are the SAME kind — B5 selected and faithfully quoted an earlier bundle's false sentence in both cases — and the fixer annotated rather than edited in both, which is the safe direction. β's pre-committed distinction ("L2-F5 is B5-authored prose, distinct from L2-F4 for exactly that reason") does not hold against the bytes. B5 did change the quote FIELD (it replaced a generic quote with this one), which is what my own earlier `quote_changed_by_B5=true` measured — that is selection, not authorship, and I conflated them.

## A near-miss of mine, recorded because it is this sprint's class

I first checked item 2 by testing the `purpose` field for the corrected content, got false on every probe, and was about to report "item 2 was not delivered". It WAS delivered — in a sibling key I had not thought to look at. **I checked one field and concluded absence.** The same shape as an absence claim bounded by an artifact name rather than by a search: the probe was sound and its population was wrong. Caught by dumping the object's keys before writing the finding.
