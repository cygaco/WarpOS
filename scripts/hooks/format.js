#!/usr/bin/env node
// PostToolUse hook: runs prettier on the changed file after Edit/Write.
// Keeps formatting consistent without manual intervention.
//
// SP-20260518-008 R-1 + R-2: binary-resolution spawn + Windows timeout cleanup.
// - Replaced execSync('npx prettier ...') with execFileSync(process.execPath, [
//   require.resolve('prettier/bin/prettier.cjs'), '--write', filePath]) so each
//   Edit/Write triggers ONE Node cold-start instead of two (no `npx` shim).
// - Capture child PID via spawnSync; on ETIMEDOUT, kill the child tree:
//   Windows = taskkill /F /T /PID <pid>; POSIX = process.kill(pid, 'SIGKILL').
// - Fail-open preserved: on any failure, exit 0 so the hook does NOT block.

const { spawnSync } = require("child_process");

let prettierBin = null;
try {
  prettierBin = require.resolve("prettier/bin/prettier.cjs");
} catch {
  // No prettier on disk — fail-open (skip formatting).
}

function killChildTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/F", "/T", "/PID", String(pid)], {
        stdio: "ignore",
      });
    } else {
      process.kill(pid, "SIGKILL");
    }
  } catch {
    // Already gone — fine.
  }
}

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);
    const filePath =
      event.tool_input?.file_path || event.tool_input?.content?.file_path;

    // Only format code files — exclude .md (prose docs with nested code fences
    // cause prettier to corrupt/empty files, see HYGIENE.md wipe incident)
    if (!filePath || !/\.(ts|tsx|js|jsx|json|css)$/.test(filePath)) {
      process.exit(0);
    }
    if (!prettierBin) process.exit(0);

    const r = spawnSync(
      process.execPath,
      [prettierBin, "--write", filePath],
      {
        cwd: event.cwd,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 10000,
      },
    );

    // ETIMEDOUT cleanup: Node's spawnSync timeout DOES set signal/error on the
    // returned object but on Windows the actual child process can survive
    // (cmd.exe wrappers don't honor SIGTERM). Kill the tree explicitly.
    if (r.error && r.error.code === "ETIMEDOUT") {
      killChildTree(r.pid);
    }

    process.exit(0);
  } catch (err) {
    // Formatting failure shouldn't block work
    process.exit(0);
  }
});
