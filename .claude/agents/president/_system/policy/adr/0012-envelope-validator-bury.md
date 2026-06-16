# ADR 0012 — Bury the per-dispatch envelope-validation gate (the 36/36 dead gate)

**Status:** accepted

**Date:** 2026-06-16

## Decision

**Bury** the generic envelope-validation gate. The `result.envelopeValidation` field that
`scripts/dispatch-agent.js` stamped onto **every** cross-provider dispatch is removed. The real,
acted-on per-dispatch validation is **`gauntlet-verify`'s `ok:true` completion record** (record-backed
coverage, E-DISPATCH-INTEGRITY F-1/F-3) plus the orchestrator's consumption of **`result.parsed`** (the
reviewer's actual verdict JSON). `scripts/agents/output-validator.js` is **kept** as a utility — it is
still referenced for build-chain output and carries its own self-test — it simply stops being stamped on
cross-provider review dispatches where it never belonged.

## Context

`output-validator.js#validate` validates **build-chain agent JSON envelopes** (`{agent, verdict,
findings, requiresHuman}`). But `dispatch-agent.js` ran it on **cross-provider REVIEW outputs** — which
carry review verdicts (`VERDICT: PASS`, `ReviewResult{...}`, freeform prose + a JSON tail), not a
build-chain envelope. The result was a **category error**: the validation frequently failed
(`"invalid verdict null"`, `"no JSON object found"`) and — verified by grep across `scripts/`, `tests/`,
`.claude/` — **no code ever consumed `result.envelopeValidation`** (only the write-site + the stamp in
runtime artifacts). A gate-shaped result (`{ok, errors, normalized}`) that nothing acts on is a **dead
gate**: it looks like a precondition but enforces nothing. NOTAGAIN named the worst observed state
"36/36 = 100% validation-failure" — a gate that is always red and always ignored. (E-DISPATCH-SHAPE-001
W2 DoD: "the envelope contract either revived … or deleted — the choice recorded as an ADR with its
enforcer.")

## Options considered

1. **Revive** — define a per-role-class `envelope_schema` in `dispatch-contract.json`, make reviewer
   prompts emit exactly that envelope, and add a consumer that ACTS on `ok:false` (refuse / re-dispatch).
2. **Bury** — remove the dead stamp; rely on `gauntlet-verify` + `result.parsed` for validation.

## Decision criteria

- Don't keep a gate-shaped result nothing consumes (the dead-gate honesty rule — BC-16 lineage).
- Don't build machinery for a check an existing enforced path already provides.
- Preserve the data consumers actually use.

## Why this option won

The reviewers' verdicts are **already** validated + consumed on the live path: `result.parsed` is the
parsed verdict the orchestrator reads, and `gauntlet-verify` is the record-backed gate that refuses a
phase whose reviewer lane produced no `ok:true` completion record. A second, envelope-shape validation
stamped on top is **redundant** — reviving it (per-role schemas + a new consumer that refuses on shape
mismatch) is real machinery for a guarantee the F-1/F-3 record-backed coverage already gives. The
validator's legitimate home is build-chain output, where `output-validator.js` remains a utility; it just
should never have been stamped on every cross-provider review dispatch. Removing the stamp **ends the
dead gate** without losing any consumed data.

## Risks

- A downstream consumer of `result.envelopeValidation` breaks.

## Mitigations

- Grep-verified (2026-06-16) across `scripts/`, `tests/`, `.claude/`: **zero** consumers — only the
  write-site and the stamp echoed into runtime dispatch records. Removing it is behavior-preserving for
  every reader.

## Enforcer

`gauntlet-verify` (record-backed completion gate, fail-closed on no-record/malformed) is the **real**
per-dispatch validation enforcer; `result.parsed` consumption is the verdict gate. With the dead stamp
removed there is no gate-shaped-but-dead result to masquerade as a precondition. A future change that
adds a new always-computed validation must route it through a consumer that acts on failure (or omit it)
— this ADR is the standing record of that rule for the dispatch path.

## Reversal plan

Re-add the `envelopeValidation` stamp in `dispatch-agent.js` (the `validateAgentOutput` utility is
unchanged) and define a consumer that acts on it — i.e. choose Option 1 (revive) instead.

## References

- `scripts/agents/output-validator.js` (the utility — kept), `scripts/dispatch-agent.js` (the removed
  stamp), `scripts/dispatch/gauntlet-verify.js` (the real gate).
- E-DISPATCH-SHAPE-001 W2 DoD; NOTAGAIN.md (the "36/36" dead-gate naming); ADR-0008 (dispatch consumers).
