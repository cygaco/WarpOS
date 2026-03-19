#!/usr/bin/env node
// PostToolUse hook: runs ESLint on the changed file after Edit/Write.
// Catches lint issues at edit time. Non-blocking (exit 0) — warnings only.

const { execSync } = require('child_process');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(input);
    const filePath = event.tool_input?.file_path || event.tool_input?.content?.file_path;

    // Only lint JS/TS files
    if (!filePath || !/\.(ts|tsx|js|jsx)$/.test(filePath)) {
      process.exit(0);
    }

    const result = execSync(`npx next lint --file "${filePath}" --no-cache 2>&1`, {
      cwd: event.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 15000,
    });

    const output = result.toString().trim();
    // If there are warnings, show them but don't block
    if (output && !/No ESLint warnings or errors/.test(output)) {
      process.stderr.write(`Lint warnings in ${filePath}:\n${output}\n`);
    }

    process.exit(0);
  } catch (err) {
    // Lint errors — report but don't block (exit 0, not 2)
    if (err.stdout || err.stderr) {
      const output = (err.stdout || err.stderr).toString().trim();
      if (output && !/No ESLint warnings or errors/.test(output)) {
        process.stderr.write(`Lint issues:\n${output}\n`);
      }
    }
    process.exit(0);
  }
});
