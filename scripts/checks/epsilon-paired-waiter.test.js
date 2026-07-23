#!/usr/bin/env node
"use strict";
/**
 * epsilon-paired-waiter.test.js — teeth for the ED-256 paired-waiter check (r2-hardened).
 * β LOAD-BEARING + qa r2 #1/#2 + security r2 #1: liveness derives from the artifact being PRODUCED (a
 * real non-empty file modified after start), never a stamped field; an alias (expected_artifact) is
 * intent not proof; a completion suppresses only if it is a phase:"completion" + ok:true + VERIFIED row.
 */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { evaluatePairedWaiter, artifactProducedFs } = require("./epsilon-liveness.js");

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log("  PASS  " + name); }
  catch (e) { fail++; console.error("  FAIL  " + name + " — " + (e && e.message ? e.message : e)); }
}

const NOW = Date.parse("2026-07-23T08:00:00.000Z");
const STALE = 10 * 60 * 1000;
const min = (m) => new Date(NOW - m * 60 * 1000).toISOString();
const started = (o) => ({ phase: "started", ok: false, dispatch_id: o.id, role: o.role || "backend-builder", started_at: o.at, background: o.background !== false, ...o.extra });
const completion = (id, extra) => ({ phase: "completion", ok: true, dispatch_id: id, role: "backend-builder", completed_at: min(20), ...extra });
const verifyAll = () => true;
const verifyNone = () => false;
const producedOnly = (real) => (p) => p === real;

// ── evaluatePairedWaiter (pure) ───────────────────────────────────────────────────────────────────────

t("β SETTABLE-LABEL: artifact_path stamped but NOT produced -> FLAGGED", () => {
  const recs = [started({ id: "d1", at: min(30), extra: { artifact_path: "runtime/ghost.txt" } })];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: producedOnly("runtime/real.txt"), isVerified: verifyNone });
  assert.strictEqual(r.findings.length, 1, JSON.stringify(r));
});

t("artifact_path produced -> OK", () => {
  const recs = [started({ id: "d2", at: min(30), extra: { artifact_path: "runtime/real.txt" } })];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: producedOnly("runtime/real.txt"), isVerified: verifyNone });
  assert.deepStrictEqual(r.findings, []);
});

t("qa r2 #1 ALIAS BYPASS: only expected_artifact (no artifact_path), even if it 'produces' -> FLAGGED", () => {
  const recs = [started({ id: "d3", at: min(30), extra: { expected_artifact: "runtime/real.txt" } })];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: producedOnly("runtime/real.txt"), isVerified: verifyNone });
  assert.strictEqual(r.findings.length, 1, "an expected_artifact alias must NOT satisfy liveness: " + JSON.stringify(r));
});

t("no artifact_path at all -> FLAGGED", () => {
  const recs = [started({ id: "d4", at: min(30) })];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyNone });
  assert.strictEqual(r.findings.length, 1);
});

t("security r2 #1: a VERIFIED completion suppresses -> NOT flagged", () => {
  const recs = [started({ id: "d5", at: min(30) }), completion("d5")];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyAll });
  assert.deepStrictEqual(r.findings, []);
});

t("security r2 #1: an UNVERIFIED completion does NOT suppress -> FLAGGED", () => {
  const recs = [started({ id: "d6", at: min(30) }), completion("d6")];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyNone });
  assert.strictEqual(r.findings.length, 1, "an unsigned completion must not suppress the stall finding: " + JSON.stringify(r));
});

t("security r2 #1: a NON-completion ok:true row does NOT suppress -> FLAGGED", () => {
  const recs = [started({ id: "d7", at: min(30) }), { phase: "note", ok: true, dispatch_id: "d7" }];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyAll });
  assert.strictEqual(r.findings.length, 1, "only a phase:'completion' row may suppress: " + JSON.stringify(r));
});

t("backend r2 #4: a FOREGROUND started row (not background) -> NOT flagged", () => {
  const recs = [started({ id: "dfg", at: min(30), background: false })];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyNone });
  assert.deepStrictEqual(r.findings, [], "a non-background (foreground) stale started row must not false-flag: " + JSON.stringify(r));
});

t("not stale (age < staleMs) -> NOT flagged", () => {
  const recs = [started({ id: "d8", at: min(5) })];
  assert.deepStrictEqual(evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyNone }).findings, []);
});

t("historical (age > windowMs) -> NOT flagged", () => {
  const recs = [started({ id: "d9", at: min(180) })];
  assert.deepStrictEqual(evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyNone }).findings, []);
});

// ── artifactProducedFs (real filesystem resolver) ─────────────────────────────────────────────────────

t("artifactProducedFs: a real non-empty file modified after start -> true", () => {
  const p = path.join(os.tmpdir(), "pw-real-" + process.pid + ".txt");
  try {
    fs.writeFileSync(p, "produced");
    const startedMs = fs.statSync(p).mtimeMs - 1000;
    assert.strictEqual(artifactProducedFs(p, startedMs), true);
  } finally { try { fs.unlinkSync(p); } catch {} }
});

t("qa r2 #2: a DIRECTORY -> false (not a real file)", () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "pw-dir-"));
  try { assert.strictEqual(artifactProducedFs(d, 0), false); }
  finally { try { fs.rmdirSync(d); } catch {} }
});

t("R1a: a 0-byte file -> false (a reaped touch produces nothing)", () => {
  const p = path.join(os.tmpdir(), "pw-empty-" + process.pid + ".txt");
  try { fs.writeFileSync(p, ""); assert.strictEqual(artifactProducedFs(p, 0), false); }
  finally { try { fs.unlinkSync(p); } catch {} }
});

t("produced-after-start: a file modified BEFORE started_at -> false (pre-existing file can't spoof)", () => {
  const p = path.join(os.tmpdir(), "pw-old-" + process.pid + ".txt");
  try {
    fs.writeFileSync(p, "pre-existing");
    const future = fs.statSync(p).mtimeMs + 60000;
    assert.strictEqual(artifactProducedFs(p, future), false);
  } finally { try { fs.unlinkSync(p); } catch {} }
});

t("artifactProducedFs: absent path -> false", () => {
  assert.strictEqual(artifactProducedFs(path.join(os.tmpdir(), "pw-absent-" + process.pid), 0), false);
});

console.log("\n" + pass + "/" + (pass + fail) + " passed");
process.exit(fail ? 1 : 0);
