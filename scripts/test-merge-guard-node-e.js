#!/usr/bin/env node
/**
 * test-merge-guard-node-e.js — W-5 regression lock.
 *
 * merge-guard rule 4 blocks `node -e` ONLY when it calls an fs WRITE method.
 * Read-only `node -e` one-liners (fs.readFileSync, readdirSync, console.log,
 * bare require('fs')) must pass through — previously they tripped the guard and
 * forced a script file for a pure read (W-5). This test pins both directions so
 * a future tightening can't silently re-break the read-only path.
 *
 * Same harness shape as scripts/test-merge-guard-rm.js.
 */

"use strict";

const { spawnSync } = require("child_process");
const path = require("path");

const guard = path.join(__dirname, "hooks", "merge-guard.js");

function run(cmd) {
  const event = JSON.stringify({
    tool_name: "Bash",
    tool_input: { command: cmd },
  });
  const r = spawnSync(process.execPath, [guard], {
    input: event,
    encoding: "utf8",
  });
  let decision = "allow";
  for (const line of (r.stdout || "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      if (JSON.parse(line).decision === "block") {
        decision = "block";
        break;
      }
    } catch {
      /* non-JSON = allow */
    }
  }
  return decision;
}

const cases = [
  // ── ALLOW: read-only node -e (the W-5 false-positive class) ──
  // These use a BOUND fs handle (`const fs=require('fs'); fs.readFileSync`) —
  // the exact shape that used to false-trip the guard before W-5 narrowed it to
  // write methods only.
  {
    cmd: `node -e "const fs=require('fs'); console.log(fs.readFileSync('x.json','utf8'))"`,
    expect: "allow",
    name: "node -e fs.readFileSync (read-only)",
  },
  {
    cmd: `node -e "const fs=require('fs'); console.log(fs.readdirSync('.'))"`,
    expect: "allow",
    name: "node -e fs.readdirSync (read-only)",
  },
  {
    cmd: `node -e "const fs=require('fs'); console.log(1+1)"`,
    expect: "allow",
    name: "node -e bound fs handle, no write (read-only)",
  },
  {
    cmd: `node -e "const fs=require('fs'); console.log(JSON.parse(fs.readFileSync('p.json')).version)"`,
    expect: "allow",
    name: "node -e fs.readFileSync parse a version (read-only)",
  },
  // ── BLOCK: node -e that WRITES (the rule must still bite) ──
  // The guard matches the `fs.<writeMethod>` form (a bound `fs` handle), the
  // dominant shape for one-shot writes (`const fs=require('fs'); fs.writeFileSync…`).
  {
    cmd: `node -e "const fs=require('fs'); fs.writeFileSync('x.json','{}')"`,
    expect: "block",
    name: "node -e fs.writeFileSync (write)",
  },
  {
    cmd: `node -e "const fs=require('fs'); fs.appendFileSync('log.txt','x')"`,
    expect: "block",
    name: "node -e fs.appendFileSync (write)",
  },
  {
    cmd: `node -e "const fs=require('fs'); fs.mkdirSync('d')"`,
    expect: "block",
    name: "node -e fs.mkdirSync (write)",
  },
  {
    cmd: `node -e "const fs=require('fs'); fs.rmSync('x')"`,
    expect: "block",
    name: "node -e fs.rmSync (write)",
  },
  // ── ALLOW: standalone script file is the intended escape hatch ──
  {
    cmd: `node scripts/foo.js`,
    expect: "allow",
    name: "node script file (not -e) always allowed",
  },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const d = run(c.cmd);
  if (d === c.expect) {
    pass++;
    console.log(`  PASS  ${c.name}  (${d})`);
  } else {
    fail++;
    console.error(`  FAIL  ${c.name}  expected=${c.expect} actual=${d}`);
  }
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail > 0 ? 1 : 0);
