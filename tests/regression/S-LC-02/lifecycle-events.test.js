#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// lifecycle-events.test.js — S-LC-02 / WI-2. The virtual-event LOGGER
// (scripts/hooks/lib/lifecycle-events.js):
//   - emit() appends a WELL-FORMED `lifecycle-event` record to a (temp) events
//     sink via the canonical logger.
//   - an UNDECLARED event is REJECTED/caught — returns false, NEVER emits a
//     lifecycle-event record (log-and-continue, never throws).
//   - the payload carries NO secret VALUES: an undeclared secret KEY is dropped
//     (whitelist) and a secret VALUE in a declared field is redacted (scrub).
//   - emit() is FAIL-OPEN: it never throws into the caller's hot path.
//
// The events sink is a TEMP file: we monkeypatch the canonical logger's log() to
// append the logger envelope to a temp file, so nothing touches the real events
// log. The real .claude/agents/_org/mode-lifecycle-hooks.json is read, never
// mutated.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const logger = require(path.join(ROOT, "scripts", "hooks", "lib", "logger.js"));
const lifecycle = require(path.join(ROOT, "scripts", "hooks", "lib", "lifecycle-events.js"));

let pass = 0;
let fail = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}

// Redirect the canonical logger to a TEMP events sink (logger envelope shape),
// so emit()'s real append path is exercised without touching the real log.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lc-events-"));
const SINK = path.join(tmpDir, "events.jsonl");
const origLog = logger.log;
function installSink() {
  logger.log = (cat, data, opts) => {
    const env = { cat, ts: new Date().toISOString(), actor: (opts && opts.actor) || "system", data };
    fs.appendFileSync(SINK, JSON.stringify(env) + "\n", "utf8");
  };
}
function restoreLog() {
  logger.log = origLog;
}
function readSink() {
  if (!fs.existsSync(SINK)) return [];
  return fs.readFileSync(SINK, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
}
function truncateSink() {
  fs.writeFileSync(SINK, "", "utf8");
}

installSink();

// ── emit() appends a well-formed lifecycle-event record ───────────────────────
ok("emit-appends-well-formed-record", () => {
  truncateSink();
  const r = lifecycle.emit("mode:switch:requested", {
    prev_mode: "adhoc", target_mode: "sprint", actor: "alpha", correlation_id: "sw-1",
  });
  assert.strictEqual(r, true, "emit() returns true for a declared event");
  const recs = readSink().filter((e) => e.cat === "lifecycle" && e.data && e.data.kind === "lifecycle-event");
  assert.strictEqual(recs.length, 1, "exactly one lifecycle-event record appended");
  const d = recs[0].data;
  assert.strictEqual(d.event, "mode:switch:requested", "record carries the event id");
  assert.strictEqual(d.harness_fires, false, "record marks harness_fires:false (virtual)");
  assert.ok(["block", "advisory"].includes(d.mode), "record carries a valid mode");
  assert.ok(d.payload && typeof d.payload === "object", "record carries a payload object");
  assert.strictEqual(d.payload.prev_mode, "adhoc", "declared field preserved");
  assert.strictEqual(d.payload.target_mode, "sprint", "declared field preserved");
});

// ── an UNDECLARED event is rejected/caught — never silently emitted ───────────
ok("undeclared-event-rejected-not-emitted", () => {
  truncateSink();
  const r = lifecycle.emit("totally:made:up:event", { actor: "alpha" });
  assert.strictEqual(r, false, "emit() returns false for an undeclared event");
  const lifecycleRecs = readSink().filter((e) => e.data && e.data.kind === "lifecycle-event");
  assert.strictEqual(lifecycleRecs.length, 0, "NO lifecycle-event record for an undeclared event");
  // it is a CAUGHT error: a warn audit record is logged (log-and-continue).
  const warns = readSink().filter((e) => e.data && e.data.action === "lifecycle-event-drop");
  assert.ok(warns.length >= 1, "a drop/warn audit record is logged for the undeclared event");
});

// ── payload carries NO secret values (whitelist drop + value scrub) ───────────
ok("payload-strips-secrets (undeclared key dropped, secret value redacted)", () => {
  truncateSink();
  const r = lifecycle.emit("mode:policy:load", {
    provider_tier_state: "sk-live-DEADBEEF12345", // secret VALUE in a DECLARED field -> redacted
    turbo_perms_state: "on", // legit status label -> kept
    api_key: "sk-test-SUPERSECRET99", // UNDECLARED secret key -> dropped
    password: "hunter2", // UNDECLARED secret key -> dropped
    actor: "alpha",
  });
  assert.strictEqual(r, true, "emit succeeds for a declared event");
  const d = readSink().find((e) => e.data && e.data.kind === "lifecycle-event").data;
  const blob = JSON.stringify(d.payload);
  assert.ok(!blob.includes("sk-live-DEADBEEF12345"), "secret value must NOT survive (redacted)");
  assert.ok(!blob.includes("sk-test-SUPERSECRET99"), "undeclared secret key must be dropped");
  assert.ok(!blob.includes("hunter2"), "undeclared password value must be dropped");
  assert.ok(!("api_key" in d.payload) && !("password" in d.payload), "secret keys are absent");
  assert.strictEqual(d.payload.provider_tier_state, "[redacted]", "secret value redacted to a label");
  assert.strictEqual(d.payload.turbo_perms_state, "on", "legit status label preserved");
});

// ── emit() is FAIL-OPEN: never throws even if the logger throws ───────────────
ok("emit-fail-open-never-throws", () => {
  const saved = logger.log;
  logger.log = () => { throw new Error("simulated logger failure"); };
  let threw = false;
  let ret;
  try {
    ret = lifecycle.emit("mode:switch:after", { prev_mode: "sprint", target_mode: "adhoc" });
  } catch {
    threw = true;
  } finally {
    logger.log = saved;
  }
  assert.strictEqual(threw, false, "emit must NOT throw into the caller even if logging fails");
  assert.strictEqual(ret, false, "emit returns false on a swallowed logging error");
});

// ── non-string / empty event is a caught error ────────────────────────────────
ok("malformed-event-arg-caught", () => {
  truncateSink();
  assert.strictEqual(lifecycle.emit("", {}), false, "empty event id rejected");
  assert.strictEqual(lifecycle.emit(null, {}), false, "null event id rejected");
  const lifecycleRecs = readSink().filter((e) => e.data && e.data.kind === "lifecycle-event");
  assert.strictEqual(lifecycleRecs.length, 0, "no lifecycle-event record for a malformed event arg");
});

restoreLog();
console.log(`\nlifecycle-events: ${pass}/${pass + fail} pass`);
process.exit(fail ? 1 : 0);
