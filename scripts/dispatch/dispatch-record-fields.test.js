#!/usr/bin/env node
// scripts/dispatch/dispatch-record-fields.test.js — named enforcer for the
// additive dispatch-record fields (WG-13 started-row + WG-11a quota field).
// Self-testing lib: a regression exits non-zero. The load-bearing check is #7,
// which binds the started-row to the REAL gauntlet-verify and proves it is
// never counted as a completion ("doesn't count started-as-complete").
// Run: node scripts/dispatch/dispatch-record-fields.test.js

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const rf = require("./dispatch-record-fields");
const { verifyGauntlet } = require("./gauntlet-verify");

let passed = 0;
const failures = [];
function check(name, cond) {
  if (cond) passed++;
  else {
    failures.push(name);
    process.stderr.write(`  FAIL: ${name}\n`);
  }
}

// 1. startedRow shape — phase started, ok:false, carries correlation keys
const sr = rf.startedRow({
  role: "reviewer",
  provider: "openai",
  model: "gpt-5.5",
  dispatch_id: "d-1",
  sprint_id: "SP-TEST-001",
  started_at: "2026-07-16T10:00:00.000Z",
});
check("startedRow phase == started", sr.phase === "started");
check("startedRow ok is false", sr.ok === false);
check("startedRow carries role/provider/started_at", sr.role === "reviewer" && sr.provider === "openai" && sr.started_at === "2026-07-16T10:00:00.000Z");
check("startedRow carries sprint_id", sr.sprint_id === "SP-TEST-001");

// 2. startedRow validates required fields
let threwRole = false, threwProvider = false;
try { rf.startedRow({ provider: "x" }); } catch { threwRole = true; }
try { rf.startedRow({ role: "x" }); } catch { threwProvider = true; }
check("startedRow throws without role", threwRole);
check("startedRow throws without provider", threwProvider);

// 3. isStartedRow predicate (shape-tolerant)
check("isStartedRow true for a started row", rf.isStartedRow(sr) === true);
check("isStartedRow false for a completion", rf.isStartedRow({ ok: true, role: "r" }) === false);
check("isStartedRow false for junk", rf.isStartedRow(null) === false && rf.isStartedRow("x") === false);

// 4. startedRowSuperseded
const completion = { dispatch_id: "d-1", role: "reviewer", ok: true, completed_at: "2026-07-16T10:05:00.000Z", provider: "openai" };
check("startedRow superseded once its completion lands", rf.startedRowSuperseded(sr, [sr, completion]) === true);
check("startedRow NOT superseded without a completion", rf.startedRowSuperseded(sr, [sr]) === false);

// 5. quotaField — known values + honest unknown
const qKnown = rf.quotaField("openai", { auth_mode: "api_key", credits_remaining: 12, tier_ok: true });
check("quotaField stamps known values", qKnown.quota.auth_mode === "api_key" && qKnown.quota.credits_remaining === 12 && qKnown.quota.tier_ok === true);
check("quotaField known flag true when values present", qKnown.quota.known === true);
const qUnknown = rf.quotaField("gemini");
check("quotaField honest unknown", qUnknown.quota.known === false && qUnknown.quota.provider === "gemini");
check("quotaField always stamps provider + checked_at", typeof qUnknown.quota.checked_at === "string" && qUnknown.quota.provider === "gemini");

// 6. appendRecord round-trip (fail-open path exercised separately)
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "drf-test-"));
const ledger = path.join(dir, "sub", "led.jsonl");
const wrote = rf.appendRecord(ledger, sr);
check("appendRecord writes + creates parent dir", wrote === true && fs.existsSync(ledger));
const back = JSON.parse(fs.readFileSync(ledger, "utf8").trim());
check("appendRecord round-trips the record", back.phase === "started" && back.dispatch_id === "d-1");

// 7. LOAD-BEARING: the real gauntlet-verify must NOT count a started-row as a
//    completion. A ledger holding ONLY a started-row for a required role must
//    read as unsatisfied (no-record/failed), never "ran"/satisfied.
const startedOnly = verifyGauntlet({
  runId: "SP-TEST-001",
  roles: ["reviewer"],
  sprintId: "SP-TEST-001",
  records: [sr], // only the write-ahead started row exists
});
check("gauntlet-verify does NOT satisfy a role with only a started-row", startedOnly.ok === false);
const rr = startedOnly.roles.find((r) => r.role === "reviewer");
check("started-only role is not 'ran'", rr && rr.status !== "ran" && rr.satisfied === false);

// 8. And once the REAL completion lands, the same role IS satisfied — the
//    started-row does not interfere with a genuine completion.
const withCompletion = verifyGauntlet({
  runId: "SP-TEST-001",
  roles: ["reviewer"],
  sprintId: "SP-TEST-001",
  records: [sr, { ...completion, sprint_id: "SP-TEST-001", started_at: "2026-07-16T10:00:00.000Z" }],
});
check("gauntlet-verify satisfies the role once its completion lands", withCompletion.ok === true);

// cleanup
try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best-effort */ }

if (failures.length) {
  process.stderr.write(`\nFAIL [dispatch-record-fields.test] ${failures.length} failed, ${passed} passed\n`);
  process.exit(1);
}
process.stdout.write(`OK [dispatch-record-fields.test] ${passed} passed\n`);
process.exit(0);
