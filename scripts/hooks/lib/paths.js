/**
 * Shared path utilities for hook scripts.
 *
 * Solves the Windows path normalization bug: CLAUDE_PROJECT_DIR may be
 * unset (defaults to "."), but Claude Code sends absolute Windows paths
 * like C:\Users\...\file.ts. Without path.resolve(), startsWith() fails
 * and all path-based matching breaks silently.
 *
 * Usage:
 *   const { PROJECT, relPath } = require("./lib/paths");
 */

const path = require("path");
const fs = require("fs");

const PROJECT = path.resolve(process.env.CLAUDE_PROJECT_DIR || ".");

// ── Centralized path registry ──────────────────────────────
// All hooks read paths from .claude/paths.json instead of hardcoding.
// To move a folder, update paths.json — all consumers follow automatically.
let PATHS = {};
try {
  const raw = JSON.parse(
    fs.readFileSync(path.join(PROJECT, ".claude", "paths.json"), "utf8"),
  );
  PATHS = Object.fromEntries(
    Object.entries(raw)
      .filter(([k]) => k !== "version")
      .map(([k, v]) => [k, path.join(PROJECT, v)]),
  );
} catch {
  // Fallback: paths.json missing — use defaults
  PATHS = {
    events: path.join(PROJECT, ".claude", "events"),
    memory: path.join(PROJECT, ".claude", "memory"),
    maps: path.join(PROJECT, ".claude", "maps"),
    reference: path.join(PROJECT, ".claude", "reference"),
    runtime: path.join(PROJECT, ".claude", "runtime"),
    logs: path.join(PROJECT, ".claude", "logs"),
    handoffs: path.join(PROJECT, ".claude", "handoffs"),
    plans: path.join(PROJECT, ".claude", "plans"),
    agents: path.join(PROJECT, ".claude", "agents"),
    commands: path.join(PROJECT, ".claude", "commands"),
    content: path.join(PROJECT, ".claude", "content"),
    dreams: path.join(PROJECT, ".claude", "dreams"),
    favorites: path.join(PROJECT, ".claude", "favorites"),
  };
}

/**
 * Convert an absolute file path to a project-relative path with forward slashes.
 * Handles Windows backslashes, absolute paths, and the unset CLAUDE_PROJECT_DIR case.
 *
 * @param {string} filePath - Absolute or relative file path from Claude Code
 * @returns {string} Relative path with forward slashes (e.g., "scripts/hooks/edit-watcher.js")
 */
function relPath(filePath) {
  const abs = path.resolve(filePath);
  const proj = path.resolve(PROJECT);
  if (abs.startsWith(proj)) {
    return abs
      .slice(proj.length)
      .replace(/^[/\\]+/, "")
      .replace(/\\/g, "/");
  }
  return abs.replace(/\\/g, "/");
}

module.exports = { PROJECT, relPath, PATHS };
