# OPTIONAL TASK 4 for bundle L — NOT APPROVED, NOT PART OF THE BRIEF YET

Held in a separate file deliberately. It is appended to `fix-L-p2-scope-wording.md` **only** on the lead's
explicit word. A builder must never see it before then, because a conditional task inside a brief gets done.

---

## Task 4 — the "what is NOT bound" block enumerates, and the enumeration is short

`engine/CUSTODY.md:13` reads:

> What is NOT bound byte-for-byte, **said plainly rather than generalised**: prose that is neither an
> Asserted nor a Ceiling paragraph — this preamble, the P1–P4 status/enforcer/proof-scope lines, the P1–P4
> BODY PROSE (…), A1's `Live measurement` follow-on paragraph, and the commentary paragraphs around A5 —
> which the structural and forbidden-phrase rules check, but no stored copy pins.

The three numbered "limits of this file's own checker" paragraphs — `(1) THE RESEMBLANCE CEILING`,
`(2) …`, `(3) NON-BREAKING SPACE` — are **not in that list**, and they are not bound. Proof, not assertion:
bundle K edited `(3)` on the document side alone, moved no canonical copy, and the suite stayed 366/0 with
`check:custody` exit 0; `extractBindableParagraphs` does not derive it (it is not a `**Ceiling —` or
`**A<n> —` lead-in) and it has no `BOUND_PARAGRAPHS` entry.

**This is ambiguous, not false, and the fix must not overstate it.** The class clause that opens the sentence
("prose that is neither an Asserted nor a Ceiling paragraph") does cover them, and a reader may take "this
preamble" to include the numbered limits that sit in the same header block. But the sentence explicitly
chooses to enumerate — "said plainly rather than generalised" — and an enumeration that omits three
paragraphs, one of which is the description of the transform itself, is weaker than it promises to be.

Close it with **one clause**, not a rewrite: either add the numbered-limit paragraphs to the list, or state
that the class governs and the list is illustrative. Do not do both. Do not weaken the class clause. Do not
touch the P1–P4 body-prose entry, which is load-bearing (a lane proved three flat falsehoods ship green
there and that omission is named on purpose).

Verify after: `extractBindableParagraphs` still derives the same population, the suite still passes, and the
sentence you wrote is true of the code — check the derived population yourself rather than asserting it.
