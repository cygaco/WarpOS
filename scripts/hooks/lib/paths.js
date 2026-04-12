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

const PROJECT = path.resolve(process.env.CLAUDE_PROJECT_DIR || ".");

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

module.exports = { PROJECT, relPath };
