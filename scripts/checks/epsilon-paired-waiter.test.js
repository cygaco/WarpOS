#!/usr/bin/env node
"use strict";
/**
 * epsilon-paired-waiter.test.js — teeth for the ED-256 paired-waiter check
 * (evaluatePairedWaiter in epsilon-liveness.js). β LOAD-BEARING rider: liveness is derived from the
 * artifact's REAL EXISTENCE, never a stamped field — a reaped dispatch records an artifact_path but
 * produces nothing, and a field-presence check would GREEN the stall (the settable-label class).
 */
const assert = require("assert");
const { evaluatePairedWaiter } = require("./epsilon-liveness.js");

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log("  PASS  " + name); }
  catch (e) { fail++; console.error("  FAIL  " + name + " — " + (e && e.message ? e.message : e)); }
}

const NOW = Date.parse("2026-07-23T08:00:00.000Z");
const STALE = 10 * 60 * 1000;
const min = (m) => new Date(NOW - m * 60 * 1000).toISOString();
const started = (o) => ({ phase: "started", ok: false, dispatch_id: o.id, role: o.role || "backend-builder", started_at: o.at, ...(o.artifact_path !== undefined ? { artifact_path: o.artifact_path } : {}) });
const done = (id) => ({ phase: "completion", ok: true, dispatch_id: id, role: "backend-builder", completed_at: min(20) });
const existsOnly = (real) => (p) => p === real;

t("β SETTABLE-LABEL CLOSE: artifact_path stamped but file does NOT resolve -> FLAGGED", () => {
  const recs = [started({ id: "d1", at: min(30), artifact_path: "runtime/ghost.txt" })];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactExists: existsOnly("runtime/real.txt") });
  assert.strictEqual(r.findings.length, 1, JSON.stringify(r));
  assert.match(r.findings[0].reason, /does NOT resolve/);
});

t("artifact_path stamped AND file resolves -> OK (real evidence of progress)", () => {
  const recs = [started({ id: "d2", at: min(30), artifact_path: "runtime/real.txt" })];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactExists: existsOnly("runtime/real.txt") });
  assert.deepStrictEqual(r.findings, []);
});

t("outstanding + stale + NO artifact_path -> FLAGGED (paired-waiter envelope incomplete)", () => {
  const recs = [started({ id: "d3", at: min(30) })];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactExists: () => false });
  assert.strictEqual(r.findings.length, 1);
  assert.match(r.findings[0].reason, /NO artifact_path/);
});

t("a completion (ok:true) for the dispatch_id -> NOT flagged (not outstanding)", () => {
  const recs = [started({ id: "d4", at: min(30) }), done("d4")];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactExists: () => false });
  assert.deepStrictEqual(r.findings, []);
});

t("not stale yet (age < staleMs) -> NOT flagged", () => {
  const recs = [started({ id: "d5", at: min(5) })];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactExists: () => false });
  assert.deepStrictEqual(r.findings, []);
});

t("too old (age > windowMs) -> NOT flagged (historical, not an active stall)", () => {
  const recs = [started({ id: "d6", at: min(180) })]; // 3h > 2h default window
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactExists: () => false });
  assert.deepStrictEqual(r.findings, []);
});

t("empty / no records -> no findings", () => {
  assert.deepStrictEqual(evaluatePairedWaiter({ records: [], nowMs: NOW, staleMs: STALE }).findings, []);
  assert.deepStrictEqual(evaluatePairedWaiter({ nowMs: NOW, staleMs: STALE }).findings, []);
});

console.log("\n" + pass + "/" + (pass + fail) + " passed");
process.exit(fail ? 1 : 0);
