#!/usr/bin/env node
// Delta orchestrator — update heartbeat in store.json
const fs = require("fs");
const { PATHS } = require("./hooks/lib/paths");
const { readOneshotStore } = require("./hooks/lib/oneshot-store");

const storePath = PATHS.oneshotStore;
// Soft-empty {} on a missing/malformed store (ED-037) — a heartbeat can still
// be stamped onto a fresh object and written, instead of an ENOENT crash.
const store = readOneshotStore(storePath);

const [cycle, phase, feature, status, cycleStep, note] = process.argv.slice(2);

store.heartbeat = {
  cycle: parseInt(cycle, 10),
  phase: parseFloat(phase),
  feature,
  agent: "delta",
  status,
  cycleStep,
  workstream: null,
  timestamp: new Date().toISOString(),
  note: note || null,
};

fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
console.log("heartbeat updated:", JSON.stringify(store.heartbeat));
