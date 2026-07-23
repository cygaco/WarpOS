"use strict";
/**
 * next-ed-id.js (SP-20260723-003 / ED-267b) — the MECHANICAL ED-id allocator for /enforcement:log.
 *
 * Replaces the log.md step-2 "count existing lines" minting, which COLLIDES: the register is 141 lines
 * but the max id is ED-269 (append-only closure/amendment rows inflate the line count above the id count),
 * so line-count minting re-issues a live id (the ED-267/268 tangle this session). This prints the true
 * next id (max ED-NNN + 1), skipping malformed lines.
 *
 *   node scripts/enforcement/next-ed-id.js            # prints e.g. ED-270
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { nextEdId } = require("./ed-registry");

function registerPath() {
  try { return require(path.join(ROOT, "scripts", "hooks", "lib", "paths")).PATHS.enforcementDebt; }
  catch { return path.join(".claude", "project", "memory", "enforcement-debt.jsonl"); }
}

/**
 * resolveRegisterText(p, read) — read the enforcement-debt register, classifying read errors (backend
 * 7C-001, r3e): ONLY a genuinely ABSENT register (ENOENT) is an empty register (-> nextEdId returns
 * ED-001). Any OTHER error (EACCES/EISDIR/EPERM/EIO) means the register EXISTS but is unreadable —
 * returning "" there would FAIL-OPEN and mint ED-001, COLLIDING with every live id. So classify: ENOENT
 * -> "" (empty), else throw an error tagged failClosed so the CLI exits non-zero instead of printing a
 * bogus id. Injectable reader for the teeth.
 */
function resolveRegisterText(p, read = fs.readFileSync) {
  try {
    return read(p, "utf8");
  } catch (e) {
    if (e && e.code === "ENOENT") return ""; // absent register -> ED-001 (legit fresh start)
    const err = new Error(`enforcement-debt register unreadable (${(e && (e.code || e.message)) || "unknown"}): ${p}`);
    err.failClosed = true;
    throw err;
  }
}

if (require.main === module) {
  let p = registerPath();
  if (!path.isAbsolute(p)) p = path.join(ROOT, p);
  let text;
  try {
    text = resolveRegisterText(p);
  } catch (e) {
    process.stderr.write(`next-ed-id: FAIL-CLOSED — ${e.message}\n`);
    process.exit(2); // never print a bogus ED-001 on a present-but-unreadable register
  }
  process.stdout.write(nextEdId(text) + "\n");
}

module.exports = { nextEdId, registerPath, resolveRegisterText };
