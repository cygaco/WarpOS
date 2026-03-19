#!/usr/bin/env node
// SessionStart hook: runs once when a Claude Code session begins. Loads previous handoff.
// 1. Checks environment health
// 2. Saves starting commit for session-end diff
// 3. Loads previous handoff if one exists

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);
    const cwd = event.cwd;
    const checks = [];
    const claudeDir = path.join(cwd, ".claude");

    // 1. Check git branch + save starting commit
    let branch = "unknown";
    try {
      branch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
      })
        .toString()
        .trim();
      const status = execSync("git status --porcelain", {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
      })
        .toString()
        .trim();
      const uncommitted = status ? status.split("\n").length : 0;
      checks.push(
        `Branch: ${branch}${uncommitted ? ` (${uncommitted} uncommitted)` : ""}`,
      );

      // Save starting commit hash for Stop hook to diff against
      const headHash = execSync("git rev-parse HEAD", {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
      })
        .toString()
        .trim();
      fs.writeFileSync(path.join(claudeDir, ".session-start-commit"), headHash);

      // Clear stale session logs from previous session (Stop hook may have missed cleanup)
      const staleFiles = [".session-prompts.log", ".compact-summary.md"];
      staleFiles.forEach((f) => {
        const p = path.join(claudeDir, f);
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch {
          /* ignore */
        }
      });
    } catch {
      checks.push("Git: not available");
    }

    // 2. Check .env.local exists
    const envPath = path.join(cwd, ".env.local");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const keys = [
        "ANTHROPIC_API_KEY",
        "BRIGHTDATA_API_KEY",
        "UPSTASH_REDIS_REST_URL",
      ];
      const missing = keys.filter((k) => !envContent.includes(k + "="));
      if (missing.length > 0) {
        checks.push(`Env: missing ${missing.join(", ")}`);
      } else {
        checks.push("Env: all keys present");
      }
    } else {
      checks.push("Env: .env.local not found");
    }

    // 3. Check node_modules exists
    if (!fs.existsSync(path.join(cwd, "node_modules"))) {
      checks.push("node_modules: MISSING — run npm install");
    }

    // 4. Check for backup branch safety
    try {
      const branches = execSync("git branch", {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
      }).toString();
      if (branches.includes("backup-2026-03-18")) {
        checks.push("Backup branch: safe");
      }
    } catch {
      /* ignore */
    }

    // 5. Load previous handoff if it exists
    const handoffPath = path.join(claudeDir, "handoff.md");
    let handoffContext = "";
    if (fs.existsSync(handoffPath)) {
      try {
        const stat = fs.statSync(handoffPath);
        const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);

        if (ageHours < 72) {
          const content = fs.readFileSync(handoffPath, "utf-8").trim();
          if (content.length > 0) {
            handoffContext = content;
            checks.push(
              `Handoff: loaded (${ageHours < 1 ? "just now" : Math.round(ageHours) + "h ago"})`,
            );
          }
        } else {
          checks.push("Handoff: stale (>72h), ignoring");
        }
      } catch {
        /* ignore */
      }
    }

    // Output banner via stderr
    if (checks.length > 0) {
      process.stderr.write(`[Session Start] ${checks.join(" | ")}\n`);
    }

    // Output handoff as additional context injected into the model
    if (handoffContext) {
      const result = {
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext: `PREVIOUS SESSION HANDOFF (auto-loaded):\n\n${handoffContext}\n\nUse this context to continue seamlessly. Do not ask the user to recap — you already have the state.`,
        },
      };
      process.stdout.write(JSON.stringify(result));
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
});
