#!/usr/bin/env node
"use strict";

/**
 * epsilon-door.test.js — E-DISPATCH-SHAPE-001 W2-core (SP-20260616-001), AC-2.3.
 *
 * The shape door is consulted on epsilon-runtime's CLAUDE_RAW path ONLY — NOT on the
 * DISPATCH_AGENT / DISPATCH_CLAUDE delegating routes (those shell to already-doored wrappers;
 * doubling the consult would risk a divergent verdict — DoE-B). End-to-end needs a full conduct
 * plan + a real claude spawn; the wiring + the no-double-consult property are asserted structurally.
 *
 *   node tests/regression/SP-20260616-001/epsilon-door.test.js
 */

const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "../../..");
const src = fs.readFileSync(path.join(ROOT, "scripts", "sprint", "epsilon-runtime.js"), "utf8");

let passed = 0, failed = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) { passed++; console.log(`  ok  ${name}`); }
  else { failed++; fails.push(name); console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`); }
}

// Exactly ONE shapeDoor consult — no double-consult on the delegating routes.
const doorCount = (src.match(/shapeDoor\(/g) || []).length;
ok("claude-raw-doored-no-double-consult: exactly ONE shapeDoor consult in epsilon-runtime", doorCount === 1, `found ${doorCount}`);

// The single consult sits in the CLAUDE_RAW region (after its marker, before the raw run()).
const rawIdx = src.indexOf("CLAUDE_RAW");
const doorIdx = src.indexOf("shapeDoor(");
ok("the door consult is positioned in the CLAUDE_RAW region", rawIdx >= 0 && doorIdx > rawIdx, `rawIdx=${rawIdx} doorIdx=${doorIdx}`);

// It consults the subprocess-claude shape for the raw role.
ok("CLAUDE_RAW consults the subprocess-claude shape for agentPlan.role",
  /shapeDoor\(\s*"subprocess-claude",\s*\{\s*kind:\s*"agent",\s*id:\s*agentPlan\.role\s*\}/.test(src));

// The DISPATCH_AGENT / DISPATCH_CLAUDE route handlers do NOT reference shapeDoor (no double-consult).
const agentRoute = src.slice(src.indexOf("ROUTE.DISPATCH_AGENT"), src.indexOf("ROUTE.DISPATCH_CLAUDE"));
const claudeRoute = src.slice(src.indexOf("ROUTE.DISPATCH_CLAUDE"), src.indexOf("CLAUDE_RAW"));
ok("DISPATCH_AGENT route does not consult the door (delegates to dispatch-agent.js)", !/shapeDoor/.test(agentRoute));
ok("DISPATCH_CLAUDE route does not consult the door (delegates to dispatch-claude.js)", !/shapeDoor/.test(claudeRoute));

// On refuse it returns a failed dispatch (never process.exit — ε is a long-running conductor).
const seg = src.slice(doorIdx, doorIdx + 900);
ok("refuse aborts the spawn (returns spawned:false, no process.exit)",
  /action === "refuse"/.test(seg) && /return\s*\{\s*spawned:\s*false/.test(seg) && !/process\.exit/.test(seg));

console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — epsilon-door: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
