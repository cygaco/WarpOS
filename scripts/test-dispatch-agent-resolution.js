#!/usr/bin/env node
/**
 * test-dispatch-agent-resolution.js — verify mode-aware spec resolution
 * in scripts/dispatch-agent.js. Imports findAgentSpec directly.
 */

"use strict";

const path = require("path");

const projectDir = path.resolve(__dirname, "..");
process.env.CLAUDE_PROJECT_DIR = projectDir;

const dispatch = require(path.join(projectDir, "scripts", "dispatch-agent.js"));

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push(`${name}: ${detail || "false"}`);
  }
}

function withMode(mode, fn) {
  const prev = process.env.WARPOS_MODE;
  process.env.WARPOS_MODE = mode;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.WARPOS_MODE;
    else process.env.WARPOS_MODE = prev;
  }
}

// builder exists in BOTH 01-adhoc and 02-oneshot
const builderAdhoc = withMode("adhoc", () => dispatch.findAgentSpec("builder"));
const builderOneshot = withMode("oneshot", () =>
  dispatch.findAgentSpec("builder"),
);
check(
  "WARPOS_MODE=adhoc picks 01-adhoc/builder",
  builderAdhoc && builderAdhoc.includes(path.join("01-adhoc", "builder")),
  builderAdhoc,
);
check(
  "WARPOS_MODE=oneshot picks 02-oneshot/builder",
  builderOneshot && builderOneshot.includes(path.join("02-oneshot", "builder")),
  builderOneshot,
);

// alpha is 00-alex regardless of mode
const alphaAdhoc = withMode("adhoc", () => dispatch.findAgentSpec("alpha"));
check(
  "alpha resolves to 00-alex/alpha.md",
  alphaAdhoc && alphaAdhoc.includes(path.join("00-alex", "alpha.md")),
  alphaAdhoc,
);

// stub-scaffold only exists in 02-oneshot — adhoc mode should still find it
const stub = withMode("adhoc", () => dispatch.findAgentSpec("stub-scaffold"));
check(
  "adhoc fallback finds oneshot-only role",
  stub && stub.includes(path.join("02-oneshot", "stub-scaffold")),
  stub,
);

// Unknown role → null
const unknown = withMode("adhoc", () =>
  dispatch.findAgentSpec("definitely-not-a-real-role"),
);
check("unknown role returns null", unknown === null, String(unknown));

// detectMode honours WARPOS_MODE
check(
  "detectMode honours WARPOS_MODE=oneshot",
  withMode("oneshot", () => dispatch.detectMode()) === "oneshot",
);
check(
  "detectMode honours WARPOS_MODE=adhoc",
  withMode("adhoc", () => dispatch.detectMode()) === "adhoc",
);

if (failed > 0) {
  console.error(`FAIL — ${failed} of ${passed + failed} cases failed:`);
  for (const f of failures) console.error("  -", f);
  process.exit(1);
}
console.log(`OK — ${passed} cases passed`);
process.exit(0);
