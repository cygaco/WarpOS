#!/usr/bin/env node
// Append Beta's design-review verdict to paths.betaEvents + paths.decisionLedger.

"use strict";
const fs = require("fs");
const path = require("path");

const betaEvents = ".claude/agents/00-alex/.system/beta/events.jsonl";
const ledger = ".claude/project/decisions/decision-ledger.jsonl";
const sprintId = "SP-20260521-001";
const pcId = "PC-20260521-0021";
const session = "sp-20260521-001";
const ts = new Date().toISOString();

fs.appendFileSync(
  betaEvents,
  JSON.stringify({
    id: "EVT-s-sp-20260521-001-beta-007",
    ts,
    cat: "beta",
    actor: "beta",
    session,
    data: {
      question:
        "Design-review of SP-20260521-001 bundle: 12 tickets (T-168..179), 2 ESDs, 2 approvals. Three specific questions: (a) 12-ticket boundary correctness, (b) gh ESD status (possible vs required), (c) grep-sweep as separate ticket?",
      category: "design",
      answer:
        "DECIDE Class B conf 0.86 on all three. (a) Boundaries sound — no splits/merges. (b) Keep ESD-008 'possible' — gh is genuinely optional, local-only products in scope. (c) Grep-sweep stays inside T-176, gated by AP-025 approval. Bundle-scan additions: (1) T-177 blocked_by T-176 (both touch scripts/product/); (2) ESD-009 enumerate 6 terminal binaries with probe/invoke per OS; (3) AP-025 add grep_sweep_clean attestation field; (4) T-173 implementation_notes explicit Promise.all per user's parallel-by-default preference; (5) T-178 approval_state should be approved since AP-026 user-approved. All applied.",
      escalated: false,
      confidence: 0.86,
      overridden: null,
      user_answer: null,
      topic_tags: [
        "design-review",
        "ticket-boundaries",
        "esd-classification",
        "grep-sweep-coupling",
        "parallel-default",
        "approval-linkage",
        "class-b",
      ],
      sprint_id: sprintId,
      artifact: pcId,
      OPEN_ADR: false,
    },
  }) + "\n",
  "utf8",
);

fs.appendFileSync(
  ledger,
  JSON.stringify({
    ts,
    id: "DEC-sp-20260521-001-007",
    sprint_id: sprintId,
    artifact: pcId,
    actor: "beta",
    class: "B",
    decision:
      "Design-review approved. 12-ticket boundary set sound. ESD-008 stays 'possible'. Grep-sweep stays inside T-176. Four bundle adjustments applied: T-177 blocked_by T-176; ESD-009 enumerates 6 platform terminal binaries; AP-025 gains grep_sweep_clean attestation field; T-173 implementation_notes specify Promise.all (parallel-by-default); T-178 approval_state flipped to approved (AP-026 already user-approved).",
    rationale:
      "Beta DECIDE on all three asked questions. Bundle-level adjustments are tightening, not scope changes. Boundaries respect deployment-surface granularity. Cross-link consistency restored.",
    open_adr: false,
    closes_consultation: "alpha-design-review-20:55Z",
  }) + "\n",
  "utf8",
);

console.log(`Logged Beta design-review verdict for ${sprintId} (${pcId}).`);
