// W5 close: append β gauntlet→release + release→retro consult to betaEvents, and ED-068 to enforcement-debt.
// One-shot under runtime/ (node -e fs-write is merge-guard-blocked; a tracked script is the sanctioned route).
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const betaEvents = path.join(ROOT, ".claude/agents/president/_system/beta/events.jsonl");
const edFile = path.join(ROOT, ".claude/project/memory/enforcement-debt.jsonl");

// 1) β gauntlet→release + release→retro (batched) consult record.
const betaRec = {
  id: "EVT-sp-w5-dispatch-perfect-gauntlet-release-retro-1",
  ts: new Date().toISOString(),
  cat: "beta",
  actor: "beta",
  session: "session/2026-06-19",
  data: {
    question:
      "W5 (E-DISPATCH-PERFECT-001) gauntlet→release + release→retro (batched): cross-provider gauntlet GREEN (security r4 PASS 'no new critical/high', backend PASS, telemetry gate clean real ok:true records; consult-roster 15/15, dispatch-contract 21/21, scope-contract-guard 11/11, epsilon-runtime 55/55, validate ok, routing-parity 40/40). Ready to merge W5 to main (ff)? Defer retro? Any pre-merge debt?",
    category: "process",
    answer:
      "DECIDE B 0.90 — Ready to merge. Q1: ff-merge to main + defer formal retro to milestone close (RI-001 engine-sprint fast-close — no deploy artifact). Q2: log ED-068 (annotation-without-consumer) BEFORE merge — alpha_only_shapes:[] is a load-bearing DOC claim with NO dispatch reader; a future α-only shape needs the READ wired, not just the array edited (the validated-but-never-read finding made emptying it safe, but that same property means re-introducing an α-only shape silently won't gate). Q3: promote BOTH cross-cycle learnings now — (1) an annotation nothing READS is safe to change AND wasn't enforcing anything: verify the consumer before trusting a gate; (2) scope an enforcer's CLAIM to exactly what it structurally guarantees + name the residual (the ED-065 two-hop). At merge, hand α the ED-065 follow-up + the ADR-0013 enforce-flip repair as the W3-unblocking next pick. Confirm W5 stayed scoped to W5.",
    escalated: false,
    confidence: "high",
    overridden: null,
    user_answer: null,
    topic_tags: [
      "E-DISPATCH-PERFECT-001",
      "W5",
      "SP-W5-dispatch-perfect",
      "gauntlet-release",
      "release-retro",
      "RI-001-engine-fast-close",
      "ED-068-annotation-without-consumer",
      "ff-merge",
      "session-2026-06-19",
    ],
  },
};

// 2) ED-068 — annotation-without-consumer (β Q2 rider).
const ed068 = {
  id: "ED-068",
  ts: "2026-06-19T00:00:00Z",
  policy:
    "dispatch-contract.json `alpha_only_shapes` is a VALIDATED-BUT-NEVER-READ annotation: dispatch-contract.js validates its shape/membership, but NOTHING in the dispatch path READS it to GATE a dispatch (no caller asks 'is this shape α-only? then refuse for a teammate'). W5 emptied it to [] per ADR-0014 — SAFE precisely because it gated nothing. But that same property is the debt: the array now reads as a load-bearing doc claim ('no shape is α-only') with no enforcing consumer. If a FUTURE change re-introduces an α-only shape by adding it back to the array, the restriction is a DEAD annotation — a teammate-ε would still be able to run that shape, because no code consults the list. The doc says 'restricted'; the machine does not enforce it.",
  source:
    "β release-boundary rider (Q2), W5 E-DISPATCH-PERFECT-001 (EVT-sp-w5-...-gauntlet-release-retro-1); the validated-but-never-read finding in dispatch-contract.js (~:510 reconcile)",
  severity: "low",
  status: "open",
  missing_enforcer:
    "a dispatch-path READER that consults alpha_only_shapes to actually gate a dispatch by spawn-context (top-level α vs teammate-ε) — today the array is validated for well-formedness but never consulted at dispatch time",
  candidate_enforcers: [
    "If/when an α-only shape is genuinely needed again: wire a reader in the dispatch resolver that, for a teammate spawn-context, REFUSES any shape listed in alpha_only_shapes (fail-closed) — then the array becomes load-bearing, not decorative.",
    "Until then: a doc/test assertion that alpha_only_shapes is EMPTY (the current correct state), so that adding an entry without also wiring the reader fails a test LOUDLY — i.e. you cannot re-introduce the dead annotation silently.",
    "A dispatch-contract validate-side warning: if alpha_only_shapes is non-empty AND no dispatch-path consumer is registered, surface 'declarative-only restriction (no enforcing reader)' — the same aspirational-vs-enforced self-flag pattern as the other gates.",
  ],
  note:
    "β DECIDE B 0.90 at W5 gauntlet→release: emptying alpha_only_shapes is safe BY CONSTRUCTION (validated-but-never-read — nothing gated on it). This debt records the latent gap so a future α-only-shape re-introduction wires the READ, not just the array edit. Bounded: today the array is correctly empty, so there is no live exposure. Related: ADR-0014, dispatch-contract.js, the ε self-management apparatus. Pattern: annotation-without-consumer (a doc claim with no enforcer) — the Policy & Enforcement Hygiene 'name the enforcer at write-time' rule, applied to a config field.",
};

fs.appendFileSync(betaEvents, JSON.stringify(betaRec) + "\n");
fs.appendFileSync(edFile, JSON.stringify(ed068) + "\n");
console.log("OK appended: betaEvents +1, enforcement-debt +1 (ED-068)");
