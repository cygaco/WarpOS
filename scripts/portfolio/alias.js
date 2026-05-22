"use strict";

// Thin deprecation forwarder for /product:* → /portfolio:* aliases.
// Once-per-session banner via a tmp sentinel file.
// Usage: node scripts/portfolio/alias.js <skill> [...args]

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const skill = process.argv[2];
const args = process.argv.slice(3);

if (!skill) {
  console.error("alias.js: missing skill name");
  process.exit(2);
}

const VALID = new Set(["bootstrap", "clone", "ponder", "import"]);
if (!VALID.has(skill)) {
  console.error(`alias.js: unknown skill '${skill}'. Valid: ${[...VALID].join(", ")}`);
  process.exit(2);
}

// Once-per-session banner: sentinel in os.tmpdir() keyed to PID's parent
// (Claude Code session). Approximation: use a fixed file per skill per day.
const today = new Date().toISOString().slice(0, 10);
const sentinelDir = path.join(os.tmpdir(), "warpos-alias-banners");
const sentinelFile = path.join(sentinelDir, `product-${skill}-${today}.shown`);
try {
  if (!fs.existsSync(sentinelFile)) {
    fs.mkdirSync(sentinelDir, { recursive: true });
    fs.writeFileSync(sentinelFile, "1", "utf8");
    process.stderr.write(
      `⚠  /product:${skill} is deprecated. Use /portfolio:${skill} instead. ` +
      `Aliases will be removed in v0.10. (This banner is shown once per session.)\n`
    );
  }
} catch {
  // fail-open — missing banner never blocks the real invocation
}

// Emit TR-12 telemetry
try {
  const loggerPath = path.resolve(__dirname, "../hooks/lib/logger.js");
  const { log } = require(loggerPath);
  log("portfolio", {
    type: "portfolio_namespace_alias_invoked",
    deprecated_skill: `/product:${skill}`,
    redirected_to: `/portfolio:${skill}`,
  });
} catch { /* fail-open */ }

// Forward to the corresponding portfolio script or skill
// For bootstrap/import/clone: delegate to scripts/product/<skill>.js (T-177 will move them)
// For ponder: no standalone script — skill is executed inline by Claude
const scriptMap = {
  bootstrap: path.resolve(__dirname, "../product/bootstrap.js"),
  clone: path.resolve(__dirname, "../product/clone.js"),
  import: path.resolve(__dirname, "../product/import.js"),
  ponder: null, // no standalone script; Claude executes the skill body inline
};

const targetScript = scriptMap[skill];
if (!targetScript) {
  // ponder has no script — print redirect hint and exit 0
  console.log(`Redirect to /portfolio:ponder — invoke that skill directly.`);
  process.exit(0);
}

if (!fs.existsSync(targetScript)) {
  console.error(`Target script not found: ${targetScript}`);
  process.exit(2);
}

const result = spawnSync("node", [targetScript, ...args], {
  stdio: "inherit",
  timeout: 300_000,
});
process.exit(result.status ?? 1);
