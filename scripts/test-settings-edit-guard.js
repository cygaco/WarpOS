#!/usr/bin/env node
/**
 * test-settings-edit-guard.js — WI-33 behavioral test.
 *
 * The settings-edit-guard is ADVISORY: it must WARN (stderr) on a direct
 * Edit/Write of the generated .claude/settings.json, but stay silent for the
 * legitimate edit surface (.claude/settings.local.json) and unrelated files.
 * It must NEVER block (no JSON `decision: block` on stdout).
 *
 * Same harness shape as scripts/test-memory-guard-targets.js.
 */

"use strict";

const { spawnSync } = require("child_process");
const path = require("path");

const guard = path.join(__dirname, "hooks", "settings-edit-guard.js");

function run(toolName, filePath) {
  const event = JSON.stringify({
    tool_name: toolName,
    tool_input: { file_path: filePath },
  });
  const r = spawnSync(process.execPath, [guard], {
    input: event,
    encoding: "utf8",
  });
  // Did it BLOCK? (it never should)
  let blocked = false;
  for (const line of (r.stdout || "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      if (JSON.parse(line).decision === "block") blocked = true;
    } catch {
      /* non-JSON stdout = not a block */
    }
  }
  const warned = /settings-edit-guard/.test(r.stderr || "");
  return { blocked, warned };
}

let pass = 0;
let fail = 0;
function ok(name, cond, detail) {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass++;
  } else {
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
    fail++;
  }
}

// ── WARN: direct edit of the generated settings.json ──────────────────
{
  const r = run("Edit", ".claude/settings.json");
  ok("Edit .claude/settings.json warns", r.warned, JSON.stringify(r));
  ok("Edit .claude/settings.json does not block", !r.blocked);
}
{
  const r = run("Write", ".claude/settings.json");
  ok("Write .claude/settings.json warns", r.warned, JSON.stringify(r));
  ok("Write .claude/settings.json does not block", !r.blocked);
}
{
  // Absolute path form.
  const abs = path.join(process.cwd(), ".claude", "settings.json");
  const r = run("Edit", abs);
  ok("Edit absolute settings.json warns", r.warned, JSON.stringify(r));
}

// ── SILENT: the correct edit surface + unrelated files ────────────────
{
  const r = run("Edit", ".claude/settings.local.json");
  ok(
    "Edit settings.local.json is silent (the right surface)",
    !r.warned,
    JSON.stringify(r),
  );
  ok("settings.local.json not blocked", !r.blocked);
}
{
  const r = run("Write", ".claude/settings.json.tmp");
  ok("Write settings.json.tmp is silent (scratch)", !r.warned, JSON.stringify(r));
}
{
  const r = run("Edit", "scripts/hooks/foo.js");
  ok("Edit unrelated file is silent", !r.warned, JSON.stringify(r));
}
{
  // A Bash tool call should be ignored entirely.
  const r = run("Bash", ".claude/settings.json");
  ok("non-Edit/Write tool is ignored", !r.warned && !r.blocked);
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail > 0 ? 1 : 0);
