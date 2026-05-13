#!/usr/bin/env node
// One-shot trace appender for RT-001 (from fix:deep run on 2026-05-13).
// Memory-guard policy: appendFileSync to PATHS.tracesFile is allowed; node -e
// inline appends and Write-tool overwrites are blocked. This script is the
// canonical escape hatch — write the logic to a file, then run it.

"use strict";

const fs = require("fs");
const { PATHS } = require("../hooks/lib/paths");

const trace = {
  id: "RT-001",
  ts: new Date().toISOString(),
  framework_selected: "Differential Diagnosis",
  framework_rationale:
    "env-specific symptom (tool surface differs from skill-body expectation) — DD lists 5+ causes + eliminates with evidence",
  history_match: null,
  problem:
    "/mode:adhoc Step 2 references TeamCreate/SendMessage as harness primitives; ToolSearch could not surface them; Alpha incorrectly told the user that team primitives were unavailable.",
  root_cause:
    "TeamCreate is not a Claude Code primitive in this session; SendMessage is referenced in the Agent tool description but is not a separately loadable deferred tool. The Agent tool IS the team-spawning primitive (subagent_type: beta|gamma). Phase 0 doc _docs/phase0/adhoc-primitive-limits.md already documents this: TeamCreate/SendMessage are listed as future primitive asks, not current tools; the in-repo workarounds are the canonical pattern. Alpha read /mode:adhoc Step 2 literally (which uses prompt-style language as if TeamCreate were a callable tool) instead of cross-referencing the phase0 doc.",
  fix: "Adopt the documented pattern: dispatch β + γ via Agent(subagent_type: beta|gamma) per-call. Persist role-tagged team marker at .claude/runtime/.team.json. team-guard.js already enforces the boundary (only β/γ allowed as teammates, only γ allowed to dispatch build-chain agents).",
  quality_score: 3,
  source: "fix:deep",
  learning_id: "L-2026-05-13-team-primitive-availability",
};

fs.appendFileSync(PATHS.tracesFile, JSON.stringify(trace) + "\n");
process.stdout.write(`appended ${trace.id} to ${PATHS.tracesFile}\n`);
