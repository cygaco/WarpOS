#!/usr/bin/env node
/**
 * test-dispatch-telemetry.js — fixture test for Phase 0 workstream C.
 *
 * Covers:
 *   1. concurrency-lock writes JSON metadata when meta is supplied
 *   2. concurrency-lock still reads legacy "<pid> <ts>" lock files
 *   3. pruneDeadLocks removes locks owned by a dead PID
 *   4. pruneDeadLocks leaves alive-PID locks intact
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

const projectDir = path.resolve(__dirname, "..");
process.env.CLAUDE_PROJECT_DIR = projectDir;

const lock = require(
  path.join(projectDir, "scripts", "hooks", "lib", "concurrency-lock.js"),
);

const provider = "telemetry-test";
const dir = path.join(lock.LOCK_ROOT, provider);
fs.mkdirSync(dir, { recursive: true });

// Clean slate
for (const f of fs.readdirSync(dir)) {
  try {
    fs.unlinkSync(path.join(dir, f));
  } catch {
    /* skip */
  }
}

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push(`${name}: ${detail || "false"}`);
  }
}

// 1. JSON metadata on new locks
const acquired = lock.acquireSlotSync(provider, {
  max: 4,
  timeoutMs: 1000,
  meta: {
    dispatch_id: "d-test-1",
    role: "reviewer",
    provider,
    prompt_bytes: 1234,
    cmdline_checksum: "sha256:test",
  },
});
check("acquireSlotSync returns a path", !!acquired);
const meta = lock.readLockMeta(acquired);
check("lock has dispatch_id", meta && meta.dispatch_id === "d-test-1");
check("lock has role", meta && meta.role === "reviewer");
check("lock has prompt_bytes", meta && meta.prompt_bytes === 1234);
check("lock has pid", meta && meta.pid === process.pid);
lock.releaseSlot(acquired);

// 2. Legacy lock format readability
const legacyPath = path.join(dir, `${process.pid}-${Date.now()}-legacy.lock`);
fs.writeFileSync(legacyPath, `${process.pid} ${Date.now()}\n`);
const legacy = lock.readLockMeta(legacyPath);
check("legacy lock parses pid", legacy && legacy.pid === process.pid);
check("legacy lock flagged legacy=true", legacy && legacy.legacy === true);
fs.unlinkSync(legacyPath);

// 3. pruneDeadLocks removes dead PID
// Use an obviously-dead PID (very large; unlikely to exist on this system).
const fakePid = 999_999_001;
const deadPath = path.join(dir, `${fakePid}-${Date.now() - 10_000}-dead.lock`);
fs.writeFileSync(
  deadPath,
  JSON.stringify({
    dispatch_id: "d-test-dead",
    pid: fakePid,
    role: "reviewer",
    provider,
    start_time: new Date(Date.now() - 10_000).toISOString(),
  }) + "\n",
);
// Backdate mtime so the freshness guard does not skip the dead lock.
const oldMs = Date.now() - 60_000;
fs.utimesSync(deadPath, oldMs / 1000, oldMs / 1000);
const summary = lock.pruneDeadLocks({ minAgeMs: 1 });
check(
  "pruneDeadLocks scanned >= 1",
  summary.scanned >= 1,
  `scanned=${summary.scanned}`,
);
check(
  "pruneDeadLocks removed the dead lock",
  !fs.existsSync(deadPath),
  "dead lock still on disk",
);

// 4. Alive-PID lock survives prune
const aliveLock = lock.acquireSlotSync(provider, {
  max: 4,
  timeoutMs: 1000,
  meta: { dispatch_id: "d-test-alive", role: "qa", provider, prompt_bytes: 0 },
});
check("alive lock acquired", !!aliveLock);
const summary2 = lock.pruneDeadLocks({ minAgeMs: 1 });
check(
  "alive lock survives prune",
  fs.existsSync(aliveLock),
  "alive lock was pruned",
);
lock.releaseSlot(aliveLock);

// Clean up empty test dir
try {
  fs.rmdirSync(dir);
} catch {
  /* ignore */
}

if (failed > 0) {
  console.error(`FAIL — ${failed} of ${passed + failed} cases failed:`);
  for (const f of failures) console.error("  -", f);
  process.exit(1);
}

console.log(`OK — ${passed} cases passed`);
process.exit(0);
