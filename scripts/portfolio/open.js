"use strict";

const os = require("os");
const path = require("path");
const { findBySlug } = require("./registry");

function emitOpenTrace(slug, repoPath) {
  try {
    const loggerPath = path.resolve(__dirname, "../hooks/lib/logger.js");
    const { log } = require(loggerPath);
    log("portfolio", {
      type: "portfolio_open",
      slug,
      repo_path_offset: path.relative(os.homedir(), repoPath),
    });
  } catch {
    // fail-open
  }
}

function die(code, msg) {
  process.stderr.write(msg + "\n");
  process.exit(code);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    die(2, "Usage: open.js <slug> [--spawn] [--force]");
  }

  const slug = args[0];
  const spawn = args.includes("--spawn");
  const force = args.includes("--force");

  if (!slug || slug.startsWith("-")) {
    die(2, "Usage: open.js <slug> [--spawn] [--force]");
  }

  // Look up slug
  let entry;
  try {
    entry = findBySlug(slug);
  } catch (err) {
    die(2, err.message);
  }

  if (!entry) {
    // C-16
    process.stdout.write(
      `No product registered as '${slug}'. Run /portfolio:list to see registered products, or /portfolio:register ${slug} <path> to add one.\n`
    );
    process.exit(0);
  }

  const repoPath = entry.repo_path;

  if (spawn) {
    // --spawn is implemented in T-171 / spawn.js
    // Delegate to spawn.js; if not yet present, surface the copyable fallback
    try {
      const spawnJs = path.resolve(__dirname, "./spawn.js");
      const result = require(spawnJs).spawnForSlug({ slug, force });
      process.exit(result.exitCode || 0);
    } catch {
      // spawn.js not yet implemented — surface copyable fallback (C-7 shape)
      process.stdout.write(
        `No supported terminal binary found on PATH (looked for: wt, iTerm, Terminal.app, gnome-terminal, xterm). Copy/paste this to open ${slug} manually:\n`
      );
      process.stdout.write(`  cd ${repoPath} && claude\n`);
      process.exit(0);
    }
    return;
  }

  // Attach mode — AC-3.3: print absolute path + cd hint
  process.stdout.write(`${slug} is at: ${repoPath}\n`);
  process.stdout.write(`  cd ${repoPath} && claude\n`);

  emitOpenTrace(slug, repoPath);
  process.exit(0);
}

main();
