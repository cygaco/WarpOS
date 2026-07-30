# ADR-0040 — Finding-class boundaries BF / TH (outcome-scoped), and the no-relabelling rule

- **Status:** accepted (2026-07-29)
- **Deciders:** β verdict `4b2e8f17-6c93-4d5a-b8e1-0f7a29d3c6b4` (DECIDE, class B, 0.89, OPEN_ADR narrow — the class definitions and the no-relabelling rule, not the invariants document as a whole); ADR authored by α per the routing in `runtime/sp002-invariants/invariants-v2.md` §9 (ADR authorship on a ratified terminal is above ε's altitude).
- **Sprint of origin:** SP-20260725-002 (memory-verify). The definitions govern beyond it — see Scope.
- **Adjacent doctrine:** ADR-0039 §A2.1 (the disclosed-residual rule for security-lane HIGHs); betaEvents row 275 `d4f81b6a` (the hard terminal), tracked verbatim at `runtime/beta-consult/ROW-275-ESCALATE-verdict-d4f81b6a.md`.

## Context

β's hard terminal for SP-20260725-002 (row 275, ESCALATE) is pre-committed to an OBJECTIVE trigger: one
more pass, and **another HIGH in the byte-fidelity or transaction-honesty families** means `--apply` does
not ship in that sprint at all. A cap scoped to two named families has no scope unless the family
definitions resolve from any clone — and until this ADR they lived only in a sprint runtime file, the
same clone-survival defect β ruled on twice on 2026-07-29 (the gitignored betaEvents citation; the
gitignored enforcement-debt id in a shipped refusal string). β constructed the escape herself (her B3):
under the v1 phrasing, a successful apply that leaves a working file behind and reports it honestly fell
in NEITHER family — not TH (the report is true), not BF ("no existing content changed") — and would have
slipped the terminal entirely.

## Decision — the two class definitions (verbatim substance from invariants-v2 §3, β-confirmed)

A finding is classified by **what became untrue about the world or the report**, never by which mechanism
produced it (no rename/descriptor/temp/backup/unlink/post-check language may scope a class).

**Class BF — BYTE FIDELITY.** Bytes the caller did not ask to change are different afterwards, **or**
bytes the caller did ask to change are not exactly what was asked for. Non-existence (`⊥`) is a byte
value: **an existence change is a byte difference**, so an entry that appears or disappears unbidden is
BF. Indifferent to cause (text round trip, line-ending rewrite, partial write, write landing somewhere
unintended).

**Class TH — TRANSACTION HONESTY.** A reported result state does not correspond to the actual state of
the world: a reported failure over a store that changed; a reported clean rollback over a store holding
residual change; a reported success over a store that is not as described; any error discarded such that
the report is made cleaner than the world.

**Coverage (why there is no third class).** A residual entry is ALWAYS BF, and additionally TH when the
report does not name it. Every escape candidate lands in at least one family, so the two classes cover
the whole outcome space and the terminal has no escape hatch. A third class was considered and rejected:
the terminal is ratified against exactly these two families, and any class outside them is itself an
escape hatch — widening the taxonomy would require the terminal re-ratified, not silently re-scoped.

## Decision — the no-relabelling rule (invariants-v2 §0, β-strengthened)

**If the code cannot meet an invariant, weaken the REPORTED CLAIM, never the invariant.** And if a
field's meaning must narrow, **RENAME the field**. Keeping `rolledBack:true` while narrowing what it
documents is the relabelling fix: the narrowed meaning lives in a doc while the old field name reaches
every caller who already read the old meaning — the false guarantee survives the fix silently for exactly
the readers who cannot see the change. A rename breaks those readers loudly instead. (Same reasoning as
ADR-0039 §A2.1 condition 2: a claim consumed as a safety guarantee must never be silently false.)

## Scope

Binding wherever a gate, terminal, or debt entry cites "byte-fidelity" or "transaction-honesty" as a
family — starting with the SP-20260725-002 hard terminal and the ED-306..310 cluster — and for any future
executor whose report fields are consumed as safety guarantees. The full invariants document
(`runtime/sp002-invariants/invariants-v2.md`, git-tracked) remains the sprint-level statement; this ADR
is the durable home of the two definitions and the rule only.

## Consequences

- The hard terminal's trigger is now falsifiable from any clone: classify the finding against §Decision;
  BF or TH → the terminal fires. "This one is a special case" remains an unavailable move.
- Verifiers for the reserved invariants-first pass classify findings against THIS text, not against a
  runtime file that may drift.
- A future fix that narrows a report field's meaning without renaming the field is a defect of this ADR's
  class, regardless of the fix's local correctness.

## Provenance / resolvers

β verdict (verbatim, tracked): `runtime/beta-consult/SPRINT-B-INVARIANTS-verdict-4b2e8f17.md` · canonical
betaEvents row 281 `4b2e8f17` (ledger is machine-local; the tracked file is the clone-surviving resolver)
· invariants: `runtime/sp002-invariants/invariants-v2.md` (v1 retained, marked SUPERSEDED, as the exact
text β ruled on).
