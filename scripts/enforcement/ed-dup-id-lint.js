"use strict";
/**
 * ed-dup-id-lint.js (SP-20260723-003 / ED-258a) — the GENESIS-KEYED duplicate-id lint over the
 * enforcement-debt register (/scan:full-scoped). The BACKSTOP detector for the ED-267b allocator: the
 * allocator fixes the generator (mint max+1), this lint catches any residual collision.
 *
 * GENESIS-KEYED (β 0.90 DIRECTIVE): a violation is an id with >1 GENESIS row (two distinct debt loggings
 * colliding). An append-only CLOSURE/amendment row re-using an id is NOT a violation — a bare
 * "id appears >=2x" check would false-RED every closed ED (the append-only closure pattern). See
 * ed-registry.js#findDuplicateGenesisIds for the discriminator.
 *
 * Exit 0 = no genesis-dup · 1 = dup found · 2 = fail-closed (register unreadable — never a silent green).
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { findDuplicateGenesisIds } = require("./ed-registry");

function registerPath() {
  try { return require(path.join(ROOT, "scripts", "hooks", "lib", "paths")).PATHS.enforcementDebt; }
  catch { return path.join(".claude", "project", "memory", "enforcement-debt.jsonl"); }
}

function run(text) {
  return findDuplicateGenesisIds(text);
}

if (require.main === module) {
  let p = registerPath();
  if (!path.isAbsolute(p)) p = path.join(ROOT, p);
  let text;
  try {
    text = fs.readFileSync(p, "utf8");
  } catch (e) {
    process.stderr.write(`ed-dup-id-lint: enforcement-debt register unreadable at ${p} (${e.code || e.message}) — fail-closed.\n`);
    process.exit(2);
  }
  const dups = run(text);
  if (dups.length === 0) {
    process.stdout.write("ed-dup-id-lint: OK — no genesis-duplicate ED ids in the register.\n");
    process.exit(0);
  }
  process.stderr.write("ed-dup-id-lint: FAIL — genesis-duplicate ED id(s) (two distinct debt loggings colliding — allocator regression):\n");
  for (const d of dups) process.stderr.write(`  ${d.id}: ${d.count} genesis rows\n`);
  process.stderr.write("Fix: re-id the later genesis row via `node scripts/enforcement/next-ed-id.js` (an append-only closure row is exempt; a fresh debt must mint a new id).\n");
  process.exit(1);
}

module.exports = { run, registerPath };
