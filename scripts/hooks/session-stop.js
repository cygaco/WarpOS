#!/usr/bin/env node
// Stop hook: auto-generates handoff when a session ends + copies to clipboard.
// Assembles: git state + user prompt log + compact summaries → .claude/handoff.md

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);
    const cwd = event.cwd;
    const claudeDir = path.join(cwd, ".claude");
    const handoffsDir = path.join(claudeDir, "handoffs");

    // Ensure handoffs dir exists
    if (!fs.existsSync(handoffsDir)) {
      fs.mkdirSync(handoffsDir, { recursive: true });
    }

    const lines = [];
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toISOString().slice(11, 16).replace(":", "");

    lines.push(`# Handoff — consumer product — ${date}`);
    lines.push("");

    // === BRANCH STATE ===
    let branch = "unknown";
    let currentHead = "";
    try {
      branch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
      })
        .toString()
        .trim();
      currentHead = execSync("git rev-parse --short HEAD", {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
      })
        .toString()
        .trim();
      const lastMsg = execSync("git log -1 --pretty=%s", {
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

      lines.push("## Branch State");
      lines.push("");
      lines.push(`- Branch: \`${branch}\``);
      lines.push(
        `- Uncommitted: ${uncommitted ? uncommitted + " files" : "clean"}`,
      );
      lines.push(`- Last commit: \`${currentHead}\` ${lastMsg}`);
      lines.push("");
    } catch {
      /* ignore */
    }

    // === SESSION CONVERSATION (from prompt logger) ===
    const promptLogPath = path.join(claudeDir, ".session-prompts.log");
    if (fs.existsSync(promptLogPath)) {
      try {
        const prompts = fs.readFileSync(promptLogPath, "utf-8").trim();
        if (prompts.length > 0) {
          lines.push("## Session Conversation");
          lines.push("");
          lines.push(
            "User messages this session (chronological — shows intent and decisions):",
          );
          lines.push("");
          prompts.split("\n").forEach((p) => lines.push(`- ${p}`));
          lines.push("");
        }
      } catch {
        /* ignore */
      }
    }

    // === COMPACTION SUMMARIES (from compact-saver) ===
    const compactPath = path.join(claudeDir, ".compact-summary.md");
    if (fs.existsSync(compactPath)) {
      try {
        const summary = fs.readFileSync(compactPath, "utf-8").trim();
        if (summary.length > 0) {
          lines.push(
            "## Session Summary (AI-generated from context compaction)",
          );
          lines.push("");
          lines.push(summary);
          lines.push("");
        }
      } catch {
        /* ignore */
      }
    }

    // === COMMITS THIS SESSION ===
    const startCommitPath = path.join(claudeDir, ".session-start-commit");
    let startCommit = "";
    if (fs.existsSync(startCommitPath)) {
      startCommit = fs.readFileSync(startCommitPath, "utf-8").trim();
    }

    if (startCommit && currentHead) {
      try {
        const sessionCommits = execSync(
          `git log --oneline ${startCommit}..HEAD`,
          { cwd, stdio: ["pipe", "pipe", "pipe"] },
        )
          .toString()
          .trim();

        if (sessionCommits) {
          lines.push("## Commits This Session");
          lines.push("");
          sessionCommits.split("\n").forEach((c) => lines.push(`- \`${c}\``));
          lines.push("");
        }

        const changedFiles = execSync(`git diff --stat ${startCommit}..HEAD`, {
          cwd,
          stdio: ["pipe", "pipe", "pipe"],
        })
          .toString()
          .trim();

        if (changedFiles) {
          lines.push("## Files Changed (committed)");
          lines.push("");
          lines.push("```");
          lines.push(changedFiles);
          lines.push("```");
          lines.push("");
        }
      } catch {
        /* no commits this session */
      }
    }

    // === UNCOMMITTED CHANGES ===
    try {
      const diffStat = execSync("git diff --stat", {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
      })
        .toString()
        .trim();
      const stagedStat = execSync("git diff --staged --stat", {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
      })
        .toString()
        .trim();

      if (diffStat || stagedStat) {
        lines.push("## Uncommitted Changes");
        lines.push("");
        if (stagedStat) {
          lines.push("Staged:");
          lines.push("```");
          lines.push(stagedStat);
          lines.push("```");
        }
        if (diffStat) {
          lines.push("Unstaged:");
          lines.push("```");
          lines.push(diffStat);
          lines.push("```");
        }
        lines.push("");
      }
    } catch {
      /* ignore */
    }

    // === RECENT COMMITS ===
    try {
      const recentLog = execSync("git log --oneline -5", {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
      })
        .toString()
        .trim();
      lines.push("## Recent Commits");
      lines.push("");
      recentLog.split("\n").forEach((c) => lines.push(`- \`${c}\``));
      lines.push("");
    } catch {
      /* ignore */
    }

    // Write handoff
    const handoff = lines.join("\n");
    fs.writeFileSync(path.join(claudeDir, "handoff.md"), handoff);

    // Timestamped copy
    fs.writeFileSync(path.join(handoffsDir, `${date}-${time}.md`), handoff);

    // Copy to clipboard (Windows: clip, macOS: pbcopy, Linux: xclip)
    try {
      const platform = process.platform;
      if (platform === "win32") {
        execSync("clip", { input: handoff, stdio: ["pipe", "pipe", "pipe"] });
      } else if (platform === "darwin") {
        execSync("pbcopy", { input: handoff, stdio: ["pipe", "pipe", "pipe"] });
      } else {
        execSync("xclip -selection clipboard", {
          input: handoff,
          stdio: ["pipe", "pipe", "pipe"],
        });
      }
    } catch {
      /* clipboard not available — not critical */
    }

    // Clean up session-scoped files
    const cleanup = [startCommitPath, promptLogPath, compactPath];
    cleanup.forEach((f) => {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {
        /* ignore */
      }
    });

    process.stderr.write(
      `[Session Stop] Handoff saved + copied to clipboard\n`,
    );
    process.exit(0);
  } catch (err) {
    process.stderr.write(`[Session Stop] Handoff failed: ${err.message}\n`);
    process.exit(0); // non-blocking
  }
});
