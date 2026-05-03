#!/usr/bin/env node
/* WarpOS 0.1.x → 0.2.0 migration 004 — paths schema v4 → v5.
 *
 * v5 changes:
 *   - requirements/* path values become _requirements/*
 *   - docs/* path values become _docs/*
 *   - new keys: architectureRoot, designSystemRoot, auditsRoot,
 *     integrationsRoot, docsRoot, frameworkRoot
 *
 * Idempotent. Reads .claude/paths.json, rewrites if v4 detected.
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const PATHS_FILE = path.join(ROOT, ".claude", "paths.json");

function main() {
  if (!fs.existsSync(PATHS_FILE)) {
    console.log("[004] .claude/paths.json not found; nothing to migrate.");
    return 0;
  }
  const data = JSON.parse(fs.readFileSync(PATHS_FILE, "utf8"));
  if (data.version >= 5) {
    console.log("[004] paths schema already at v5+; no-op.");
    return 0;
  }
  // Bump schema + version
  data.$schema = "warpos/paths/v5";
  data.version = 5;

  // Update existing keys
  const updates = {
    requirements: "_requirements",
    requirementsRoot: "_requirements",
    specsRoot: "_requirements/04-features",
    research: "_docs/research",
    karpathyRuns: "_docs/karpathy-auto-research",
  };
  for (const [k, v] of Object.entries(updates)) {
    if (data[k] !== undefined) data[k] = v;
  }
  // Add new keys (idempotent — only set if missing)
  const adds = {
    architectureRoot: "_requirements/03-architecture",
    designSystemRoot: "_requirements/01-design-system",
    auditsRoot: "_requirements/_audits",
    integrationsRoot: "_requirements/09-integrations",
    docsRoot: "_docs",
    frameworkRoot: "framework",
  };
  for (const [k, v] of Object.entries(adds)) {
    if (data[k] === undefined) data[k] = v;
  }
  fs.writeFileSync(PATHS_FILE, JSON.stringify(data, null, 2) + "\n");
  console.log("[004] paths schema migrated v4 → v5.");
  return 0;
}

if (require.main === module) process.exit(main());
module.exports = { main };
