#!/usr/bin/env node
// UserPromptSubmit hook: logs each user message to .claude/.session-prompts.log
// The Stop hook reads this log to build a richer handoff with conversation context.

const fs = require("fs");
const path = require("path");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);
    const cwd = event.cwd;
    const claudeDir = path.join(cwd, ".claude");
    const logPath = path.join(claudeDir, ".session-prompts.log");

    // Extract the user's message from the hook input
    // UserPromptSubmit receives: { session_id, cwd, hook_event_name, prompt }
    const prompt = event.prompt || event.tool_input?.prompt || "";

    if (!prompt || prompt.trim().length === 0) {
      process.exit(0);
      return;
    }

    // Skip slash commands logged as-is (they'll be expanded)
    // But DO log them — they show intent
    const timestamp = new Date().toISOString().slice(11, 19);
    const line = `[${timestamp}] ${prompt.trim().replace(/\n/g, " ").slice(0, 200)}\n`;

    fs.appendFileSync(logPath, line);
    process.exit(0);
  } catch {
    process.exit(0); // non-blocking
  }
});
