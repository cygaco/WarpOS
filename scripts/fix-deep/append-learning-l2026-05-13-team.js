#!/usr/bin/env node
// One-shot learning appender for L-2026-05-13-team-primitive-availability.

"use strict";

const fs = require("fs");
const { PATHS } = require("../hooks/lib/paths");

const learning = {
  ts: "2026-05-13",
  intent: "bug_fix",
  tip: "Adhoc mode team = Agent(subagent_type: beta|gamma) per-call. TeamCreate/SendMessage are documented in _docs/phase0/adhoc-primitive-limits.md as FUTURE primitive asks, not current Claude Code tools. The Agent tool IS the team primitive; team-guard.js enforces the boundary. When /mode:adhoc Step 2 says 'Create a team', it means dispatch β + γ via Agent. Read the phase0 doc, don't read the skill body literally.",
  effective: null,
  pending_validation: true,
  score: 0,
  source: "fix:deep",
  trace_id: "RT-001",
};

fs.appendFileSync(PATHS.learningsFile, JSON.stringify(learning) + "\n");
process.stdout.write(`appended learning to ${PATHS.learningsFile}\n`);
