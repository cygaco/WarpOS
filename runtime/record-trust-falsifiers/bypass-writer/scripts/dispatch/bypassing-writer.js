"use strict";
// SEEDED FIXTURE (SP-20260718-005 BE-2 / AC-9) — a PLANTED writer that bypasses the recordCompletion sink,
// writing a raw completion-shaped record directly to the dispatch-completions ledger. Lives under runtime/
// (walk-skipped; NOT scanned by the production guard) so it never reds the real tree. The
// all-writers-route-recordCompletion guard, scanned against this fixture root, MUST flag this file: it
// resolves the canonical ledger path itself and appends a record via fs.appendFileSync — no call to
// recordCompletion/recordDeath/recordDispatchStart anywhere in the file. This is the exact "forked writer"
// class BE-2's sink discipline exists to prevent (a second writer that can drift on path/provenance/quota
// shape — ED-016/ED-070 class bugs re-opened one call site at a time).

const fs = require("fs");
const path = require("path");

function bypassWrite(role, provider, ok) {
  // ANTI-PATTERN: resolves the canonical ledger path itself instead of importing recordCompletion from
  // dispatch-agent.js — this file is the dispatch-completions ledger writer, forked.
  const file = path.join(__dirname, "..", "..", ".claude", "runtime", "dispatch-completions.jsonl");
  const record = {
    dispatch_id: `bypass-${Date.now()}`,
    role,
    provider,
    ok,
    phase: "completed",
  };
  fs.appendFileSync(file, JSON.stringify(record) + "\n");
  return file;
}

module.exports = { bypassWrite };
