#!/usr/bin/env node
// Smoke-test for merge-guard cd-prefix AUTO-STRIP behavior.
// Previously advisory (warn, no mutation). After 2026-05-13 escalation
// (/scan:patterns: 16x/day fires with 0 behavior change), this rule
// now emits hookSpecificOutput.updatedInput.command with the prefix
// removed, AND continues NOT to block. Verify:
//   - the auto-strip JSON is emitted for redundant `cd <PROJECT> && ...`
//   - the stripped command matches what we'd expect
//   - legitimate cd uses (subdirs, unrelated dirs) are untouched
//   - mutation is widened beyond git tails (per the spec)

const { spawnSync } = require("child_process");
const path = require("path");

const guard = path.join(__dirname, "hooks", "merge-guard.js");
const PROJECT = path.resolve(__dirname, "..");

function run(cmd) {
  const event = JSON.stringify({
    tool_name: "Bash",
    tool_input: { command: cmd },
  });
  const r = spawnSync(process.execPath, [guard], {
    input: event,
    encoding: "utf8",
    cwd: PROJECT,
  });
  let blocked = false;
  let stripped = null;
  try {
    for (const line of (r.stdout || "").split(/\r?\n/)) {
      if (!line.trim()) continue;
      const parsed = JSON.parse(line);
      if (parsed.decision === "block") {
        blocked = true;
        break;
      }
      if (
        parsed.hookSpecificOutput &&
        parsed.hookSpecificOutput.updatedInput &&
        typeof parsed.hookSpecificOutput.updatedInput.command === "string"
      ) {
        stripped = parsed.hookSpecificOutput.updatedInput.command;
      }
    }
  } catch {
    /* allow */
  }
  const stderr = r.stderr || "";
  const autoStripStderr = /AUTO-STRIP/i.test(stderr);
  return { blocked, stripped, autoStripStderr, stderr };
}

const cases = [
  // SHOULD AUTO-STRIP
  {
    cmd: `cd "${PROJECT}" && git status`,
    expect: { blocked: false, stripped: "git status", autoStrip: true },
    name: "cd <PROJECT> && git status (the anti-pattern, quoted)",
  },
  {
    cmd: `cd . && git status`,
    expect: { blocked: false, stripped: "git status", autoStrip: true },
    name: "cd . && git (the no-op cd)",
  },
  {
    // Widened from the old advisory: any tail benefits when cwd is project dir.
    cmd: `cd "${PROJECT}" && npm run build`,
    expect: { blocked: false, stripped: "npm run build", autoStrip: true },
    name: "cd <PROJECT> && npm run build (non-git tail, now stripped)",
  },
  {
    cmd: `cd "${PROJECT}" && node scripts/regen-maps.js`,
    expect: {
      blocked: false,
      stripped: "node scripts/regen-maps.js",
      autoStrip: true,
    },
    name: "cd <PROJECT> && node scripts/... (the most common fired form)",
  },
  // SHOULD NOT TRIGGER
  {
    // Unquoted path with spaces is broken bash syntax — regex correctly
    // captures only the first non-space token. Real callers must quote
    // paths with spaces (covered by the quoted variant above).
    cmd: `cd ${PROJECT.replace(/ /g, "_")} && git log --oneline`,
    expect: { blocked: false, stripped: null, autoStrip: false },
    name: "unquoted path WITHOUT spaces (no PROJECT match) → no strip",
  },
  {
    cmd: `cd src && ls`,
    expect: { blocked: false, stripped: null, autoStrip: false },
    name: "cd subdir && tail (legitimate cd, no strip)",
  },
  {
    cmd: `git status`,
    expect: { blocked: false, stripped: null, autoStrip: false },
    name: "bare git command (no cd at all, no strip)",
  },
  {
    cmd: `cd /tmp && git status`,
    expect: { blocked: false, stripped: null, autoStrip: false },
    name: "cd to unrelated dir + git (genuine context switch, no strip)",
  },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const r = run(c.cmd);
  const ok =
    r.blocked === c.expect.blocked &&
    r.stripped === c.expect.stripped &&
    r.autoStripStderr === c.expect.autoStrip;
  if (ok) {
    pass++;
    console.log(
      `  PASS  ${c.name}  (blocked=${r.blocked} stripped=${r.stripped === null ? "null" : JSON.stringify(r.stripped)})`,
    );
  } else {
    fail++;
    console.error(
      `  FAIL  ${c.name}\n        expected blocked=${c.expect.blocked} stripped=${JSON.stringify(c.expect.stripped)} autoStrip=${c.expect.autoStrip}\n        actual   blocked=${r.blocked} stripped=${JSON.stringify(r.stripped)} autoStrip=${r.autoStripStderr}`,
    );
    if (r.stderr) console.error(`        stderr: ${r.stderr.slice(0, 200)}`);
  }
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail > 0 ? 1 : 0);
