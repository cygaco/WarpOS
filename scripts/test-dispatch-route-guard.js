#!/usr/bin/env node
/**
 * test-dispatch-route-guard.js — fixture test for dispatch-route-guard.
 *
 * Runs the guard's pattern matcher against a battery of safe and forbidden
 * Bash commands; exits 1 on any mismatch.
 */

"use strict";

const path = require("path");
const guard = require(path.join(__dirname, "hooks", "dispatch-route-guard.js"));

const SAFE = [
  "codex --version",
  "gemini --version",
  "gemini --help",
  "claude --version",
  "gemini models list",
  "gemini auth status",
  "codex auth status",
  "node scripts/dispatch-agent.js reviewer /tmp/prompt.txt",
  'node "$CLAUDE_PROJECT_DIR/scripts/dispatch-agent.js" qa /tmp/qa.txt',
  "claude -p --model sonnet --agent reviewer prompt-body",
  "claude -p --agent qa some-prompt",
  "claude -p --help",
  "git log --oneline",
  "ls -la",
  "cat foo.txt", // not piping into a provider
];

const FORBIDDEN = [
  ["codex exec --full-auto -m gpt-5.5 -", "codex exec …"],
  ["codex exec -m gpt-5.5 -", "codex exec …"],
  ["gemini -m gemini-3.1-pro-preview -p 'do the thing'", "gemini … -p …"],
  ["gemini -p 'inline prompt'", "gemini … -p …"],
  ["cat prompt.txt | codex exec --full-auto -", "cat … | codex …"],
  ["cat prompt.txt | gemini -m gemini-3.1-pro-preview -p", "cat … | gemini …"],
  ["cat prompt.txt | claude -p", "cat … | claude …"],
  ["claude -p 'one-shot prompt body'", "claude -p …"],
];

let passed = 0;
let failed = 0;
const failures = [];

for (const cmd of SAFE) {
  const hit = guard.findForbidden(cmd);
  if (hit) {
    failed++;
    failures.push(`SAFE flagged: ${JSON.stringify(cmd)} → ${hit.pattern}`);
  } else {
    passed++;
  }
}

for (const [cmd, expectedPattern] of FORBIDDEN) {
  const hit = guard.findForbidden(cmd);
  if (!hit) {
    failed++;
    failures.push(`FORBIDDEN missed: ${JSON.stringify(cmd)}`);
  } else if (hit.pattern !== expectedPattern) {
    failed++;
    failures.push(
      `FORBIDDEN mislabeled: ${JSON.stringify(cmd)} → got ${hit.pattern}, expected ${expectedPattern}`,
    );
  } else {
    passed++;
  }
}

if (failed > 0) {
  console.error(`FAIL — ${failed} of ${passed + failed} cases failed:`);
  for (const f of failures) console.error("  -", f);
  process.exit(1);
}

console.log(
  `OK — ${passed} cases passed (${SAFE.length} safe, ${FORBIDDEN.length} forbidden)`,
);
process.exit(0);
