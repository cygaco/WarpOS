#!/usr/bin/env node
/**
 * scope-contract-guard.test.js — planted-violation tests for the parse+loud-empty+
 * fail-closed-unparseable additions (T-20260611-308).
 *
 * Exit 0 = all pass. Exit 1 = at least one failure.
 */
"use strict";

const { spawnSync } = require("child_process");
const path = require("path");

const GUARD = path.join(__dirname, "scope-contract-guard.js");

function run(fixture) {
  const result = spawnSync(process.execPath, [GUARD], {
    input: JSON.stringify(fixture),
    encoding: "utf8",
    timeout: 10000,
  });
  return { exit: result.status ?? -1, stdout: result.stdout || "" };
}

function makeDispatch(role, prompt) {
  return {
    tool_name: "Agent",
    cwd: ".",
    tool_input: { subagent_type: role, prompt },
  };
}

let passed = 0;
let failed = 0;

function assert(name, result, expectedExit, expectedReasonContains) {
  const { exit, stdout } = result;
  let ok = exit === expectedExit;
  if (ok && expectedReasonContains) {
    ok = stdout.includes(expectedReasonContains);
  }
  if (ok) {
    console.log(`  PASS  ${name}`);
    passed++;
  } else {
    console.error(
      `  FAIL  ${name} — got exit=${exit} stdout=${stdout.trim().slice(0, 200)}`,
    );
    if (expectedReasonContains && !stdout.includes(expectedReasonContains)) {
      console.error(`        expected stdout to include: ${expectedReasonContains}`);
    }
    failed++;
  }
}

// ─── Core planted-violation: empty allowedFiles, no forbiddenFiles ─────────
// TODAY this would PASS (substring "allowedFiles" is present). After the fix it BLOCKS.
assert(
  "empty allowedFiles, no forbiddenFiles → LOUD BLOCK [planted]",
  run(
    makeDispatch(
      "builder",
      'Build this.\n\n## scopeContract\n{"allowedFiles":[]}\n',
    ),
  ),
  2,
  "EMPTY allowedFiles",
);

// ─── Blocklist mode: empty allowedFiles WITH non-empty forbiddenFiles → ALLOW ─
assert(
  "empty allowedFiles + forbiddenFiles → ALLOW (blocklist mode)",
  run(
    makeDispatch(
      "backend-builder",
      'Build this.\n\nscopeContract: {"allowedFiles":[],"forbiddenFiles":["package.json","README.md"]}\n',
    ),
  ),
  0,
  null,
);

// ─── Normal non-empty allowedFiles → ALLOW ─────────────────────────────────
assert(
  "non-empty allowedFiles → ALLOW (golden)",
  run(
    makeDispatch(
      "frontend-builder",
      'Build this.\n\nscopeContract: {"allowedFiles":["src/lib/types.ts"],"forbiddenFiles":[]}\n',
    ),
  ),
  0,
  null,
);

// ─── scopeContract present but malformed → fail-closed BLOCK ───────────────
assert(
  "malformed scopeContract → fail-closed BLOCK",
  run(
    makeDispatch(
      "builder",
      "Build this.\n\nscopeContract: {allowedFiles: [broken json here\n",
    ),
  ),
  2,
  "unparseable",
);

// ─── No scopeContract at all, build-chain role → BLOCK (existing) ──────────
assert(
  "no scopeContract, build-chain role → BLOCK (existing behavior)",
  run(makeDispatch("builder", "Build this feature. No scope info at all.")),
  2,
  null,
);

// ─── Non-build-chain role → exit 0 (guard doesn't apply) ───────────────────
assert(
  "non-build-chain role (researcher) → exit 0 (existing behavior)",
  run(makeDispatch("researcher", "Research this topic. No scope info.")),
  0,
  null,
);

// ─── Response-hook event (tool_response present) → exit 0 ──────────────────
// The guard only fires on dispatch events, not response events.
assert(
  "response-hook event → exit 0 (not a dispatch)",
  run({
    tool_name: "Agent",
    cwd: ".",
    tool_input: { subagent_type: "builder", prompt: "build" },
    tool_response: '{"ok":true}',
  }),
  0,
  null,
);

// ─── allowedFiles with multiple entries → ALLOW ────────────────────────────
assert(
  "allowedFiles with multiple entries → ALLOW",
  run(
    makeDispatch(
      "security-builder",
      'Build this.\n\nscopeContract: {"allowedFiles":["src/a.ts","src/b.ts"],"forbiddenFiles":[]}\n',
    ),
  ),
  0,
  null,
);

// ─── Guard crash case: malformed event JSON → fail-open exit 0 ─────────────
// The outer try/catch in the guard ensures a guard BUG never blocks.
assert(
  "malformed event JSON → fail-open exit 0 (guard bug safety)",
  run("NOT JSON AT ALL {{{"),
  0,
  null,
);

// ─── Fix-cycle (gemini lane 2026-06-11): string-aware brace walker ──────────
// Braces inside JSON string values (brace-globs) must NOT truncate extraction —
// the naive walker false-blocked this legitimate contract fail-closed.
assert(
  "brace-glob in allowedFiles → ALLOW (string-aware walker)",
  run(
    makeDispatch(
      "builder",
      'Build this.\n\nscopeContract: {"allowedFiles":["{engineering,product}/**/*.ts","src/x.ts"],"forbiddenFiles":[]}\n',
    ),
  ),
  0,
  null,
);

// ─── Fix-cycle (gemini lane 2026-06-11): equals separator is FOUND ──────────
// `scopeContract={...}` used to return found:false (absent-case fallthrough);
// the empty-check must apply to it like the colon form.
assert(
  "equals-separator empty allowedFiles → LOUD BLOCK",
  run(
    makeDispatch(
      "builder",
      'Build this.\n\nscopeContract={"allowedFiles":[]}\n',
    ),
  ),
  2,
  "EMPTY allowedFiles",
);

// ─── Summary ────────────────────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
