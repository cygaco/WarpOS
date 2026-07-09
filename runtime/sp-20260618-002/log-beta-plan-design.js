#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const p = path.resolve(__dirname, "..", "..", ".claude/agents/president/_system/beta/events.jsonl");
const rec = {
  id: "EVT-sp20260618-002-plan-design-1",
  ts: new Date().toISOString(),
  cat: "beta",
  actor: "beta",
  session: "session/2026-06-18",
  data: {
    question:
      "SP-20260618-002 (E-MC-READINESS-ANALYSIS-001) plan->design: composition + analysis-only posture sound to advance? What HOW makes the analysis-only invariant robust when A1 dispatches reviewers over real code?",
    category: "architecture",
    answer:
      "DECIDE B 0.88 — proceed to design. Composition right (A1 hardening-sim gap + A2 consolidated register + A3 reconcile), analysis-only sound, stale-tracker ground-truthing exactly right. CENTRAL HOW: name the analysis-only invariant a DIFF-SCOPE close-gate, NOT the spawn guard — reviewers are read-only by toolset (can't write); the leak vector is the CONDUCTOR editing a product file directly. Enforcer = git diff --name-only main...HEAD must intersect ONLY the enumerated allowlist (A2 register path + A3 tracker files); ANY path under product/framework/scripts/.claude/commands/agents = FAIL fail-closed. For a TOP epic BUILD the 10-line check, don't debt it. scope-contract-guard.js exists + guards spawns (keep as defense-in-depth) but doesn't see the conductor's diff. SCOPE TIGHTENING: enumerate the allowlist explicitly in the plan-contract (exact paths) — un-enumerated = gate hole (P-058). RISK-FLAGS (in-scope HOW): (1) Track-5 supersession is an unverified CLAIM → make it an explicit register line with a pointer (absorbed into E-SYSTEM-ORG-001 @ ref, findings covered there), auditable; if not covered, the cross-check surfaces a gap. (2) A2 false-green: '6 tracks consolidated' must assert COUNT/COVERAGE (every finding appears de-duped w/ provenance+priority), positive-coverage not existence (same rigor as templates one-src-string-ne-108-files). (3) security triple-pass w/ gemini DEAD = GPT+Claude acceptable 2-source for an analysis register; document gemini-absence as honest debt; don't weaken divergence-as-signal. NOT a Class-C boundary (analysis modifies nothing; fixes gate at the separate EXECUTION epic). No later hard halt beyond the light-gauntlet binding checks (diff-scope gate GREEN + register positive-coverage + 2-source security). Merge operator-gated.",
    escalated: false,
    confidence: "high",
    overridden: null,
    user_answer: null,
    topic_tags: [
      "sprint_full_phase_boundary",
      "E-MC-READINESS-ANALYSIS-001",
      "SP-20260618-002",
      "plan-design-boundary",
      "analysis-only-diff-scope-enforcer",
      "register-positive-coverage",
      "track5-supersession-auditable",
      "session-2026-06-18",
    ],
  },
};
fs.appendFileSync(p, JSON.stringify(rec) + "\n");
console.log("appended", rec.id);
