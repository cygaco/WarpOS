#!/usr/bin/env node
// SP-20260518-008 R-3: PreToolUse payload-shape validator.
// Validates the `tool_input` shape per tool (Edit, Write). MultiEdit out of
// scope for v1 (matches existing chain matcher: Edit|Write).
//
// Behavior: warn-only — emits a one-line stderr message naming the tool +
// missing field, exits 0 (never blocks). The point is early surfacing of a
// future Claude Code framework upgrade that renames a payload field; it should
// show up as a one-line warning, not silent behavior drift weeks later.

"use strict";

// Per-tool required field contract. Sourced from observed payloads on
// 2026-05-18 + verified against existing defensive reads in format.js, etc.
const SHAPE = {
  Edit: ["file_path", "old_string", "new_string"],
  Write: ["file_path", "content"],
  // MultiEdit deliberately not enforced in v1.
};

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);
    const tool = event.tool_name || event.tool;
    if (!tool) {
      // Can't validate without a tool name. Warn-only.
      process.stderr.write(
        "[lint-hook-output] event missing tool_name — skipping shape validation\n",
      );
      process.exit(0);
    }
    const required = SHAPE[tool];
    if (!required) {
      // Unknown tool. Not our concern.
      process.exit(0);
    }
    const ti = event.tool_input || {};
    const missing = required.filter((f) => !(f in ti));
    if (missing.length > 0) {
      process.stderr.write(
        `[lint-hook-output] PreToolUse ${tool} tool_input missing fields: ${missing.join(", ")} — payload-shape drift candidate (warn-only, exit 0)\n`,
      );
    }
    process.exit(0);
  } catch (err) {
    // Malformed JSON or any other surprise — warn-only.
    process.stderr.write(
      `[lint-hook-output] could not validate event: ${err.message} (warn-only, exit 0)\n`,
    );
    process.exit(0);
  }
});
