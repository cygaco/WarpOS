#!/usr/bin/env node
"use strict";
/**
 * epsilon-paired-waiter.test.js — teeth for the ED-256 paired-waiter check (r3, DoE design-lock).
 * SCOPE FROM LEDGER STATE (security r2 #4): a started row with NO terminal completion is OUTSTANDING; a
 * terminal completion (any ok) means the wrapper lived to write it — an honest ok:FALSE death suppresses
 * unconditionally (backend r2 #4), a SUCCESS (ok:true) suppresses only when VERIFIED (security r2 #1).
 * Liveness of a produced artifact is real-file/non-empty/produced-after-start (β), lstat (ED-270 symlink).
 */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { evaluatePairedWaiter, artifactProducedFs } = require("./epsilon-liveness.js");
const { startedRow } = require("../dispatch/dispatch-record-fields.js");

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log("  PASS  " + name); }
  catch (e) { fail++; console.error("  FAIL  " + name + " — " + (e && e.message ? e.message : e)); }
}

const NOW = Date.parse("2026-07-23T08:00:00.000Z");
const STALE = 10 * 60 * 1000;
const min = (m) => new Date(NOW - m * 60 * 1000).toISOString();
const started = (o) => ({ phase: "started", ok: false, dispatch_id: o.id, role: o.role || "backend-builder", started_at: o.at, ...o.extra });
const completion = (id, ok, extra) => ({ phase: "completion", ok, dispatch_id: id, role: "backend-builder", completed_at: min(20), ...extra });
const verifyAll = () => true;
const verifyNone = () => false;
const producedOnly = (real) => (p) => p === real;

// ── scope-from-ledger-state ──────────────────────────────────────────────────────────────────────────

t("security r2 #4: a production-shape started row with NO terminal + stale -> FIRES (was inert)", () => {
  const recs = [started({ id: "d0", at: min(30) })]; // no background/artifact_path fields at all
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyNone });
  assert.strictEqual(r.findings.length, 1, "the check must fire on a real-shape outstanding row: " + JSON.stringify(r));
});

t("backend r2 #4: an ok:FALSE terminal completion (honest death) SUPPRESSES -> NOT flagged", () => {
  const recs = [started({ id: "d1", at: min(30) }), completion("d1", false)];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyNone });
  assert.deepStrictEqual(r.findings, [], "an honest ok:false death means the wrapper lived: " + JSON.stringify(r));
});

t("security r2 #1: a VERIFIED ok:true completion SUPPRESSES -> NOT flagged", () => {
  const recs = [started({ id: "d2", at: min(30) }), completion("d2", true)];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyAll });
  assert.deepStrictEqual(r.findings, []);
});

t("security r2 #1: an UNVERIFIED ok:true completion does NOT suppress -> FLAGGED", () => {
  const recs = [started({ id: "d3", at: min(30) }), completion("d3", true)];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyNone });
  assert.strictEqual(r.findings.length, 1, "an unsigned success must not suppress: " + JSON.stringify(r));
});

t("a NON-completion ok:true row (phase:'note') does NOT suppress -> FLAGGED", () => {
  const recs = [started({ id: "d4", at: min(30) }), { phase: "note", ok: true, dispatch_id: "d4" }];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyAll });
  assert.strictEqual(r.findings.length, 1);
});

t("DoE (d): fires regardless of a stamped/omitted opt-in field (scope is ledger state, not the row)", () => {
  const withFlag = [started({ id: "d5", at: min(30), extra: { background: true } })];
  const noFlag = [started({ id: "d6", at: min(30) })];
  const opts = { nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyNone };
  assert.strictEqual(evaluatePairedWaiter({ records: withFlag, ...opts }).findings.length, 1);
  assert.strictEqual(evaluatePairedWaiter({ records: noFlag, ...opts }).findings.length, 1, "a row that omits the opt-in must STILL be evaluated");
});

// ── artifact-produced grace path (β settable-label close) ─────────────────────────────────────────────

t("β: artifact_path stamped but NOT produced -> FLAGGED", () => {
  const recs = [started({ id: "d7", at: min(30), extra: { artifact_path: "runtime/ghost.txt" } })];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: producedOnly("runtime/real.txt"), isVerified: verifyNone });
  assert.strictEqual(r.findings.length, 1);
});

t("artifact_path produced -> OK (real evidence of progress)", () => {
  const recs = [started({ id: "d8", at: min(30), extra: { artifact_path: "runtime/real.txt" } })];
  const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: producedOnly("runtime/real.txt"), isVerified: verifyNone });
  assert.deepStrictEqual(r.findings, []);
});

t("not stale (age < staleMs) -> NOT flagged", () => {
  const recs = [started({ id: "d9", at: min(5) })];
  assert.deepStrictEqual(evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyNone }).findings, []);
});

t("historical (age > windowMs) -> NOT flagged", () => {
  const recs = [started({ id: "d10", at: min(180) })];
  assert.deepStrictEqual(evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyNone }).findings, []);
});

// ── QA-R2-001: the env opt-out cannot downgrade the default verifier ──────────────────────────────────

t("QA-R2-001: WARPOS_LIVENESS_REQUIRE_SIG=0 does NOT let an UNSIGNED ok:true completion suppress", () => {
  const prev = process.env.WARPOS_LIVENESS_REQUIRE_SIG;
  process.env.WARPOS_LIVENESS_REQUIRE_SIG = "0";
  try {
    // No isVerified injected -> the default verifier runs; an unsigned completion (no attest_sig) must NOT
    // verify even under the env opt-out, so the started row stays FLAGGED.
    const recs = [started({ id: "denv", at: min(30) }), completion("denv", true)];
    const r = evaluatePairedWaiter({ records: recs, nowMs: NOW, staleMs: STALE, artifactProduced: () => false });
    assert.strictEqual(r.findings.length, 1, "the env must not downgrade signature verification: " + JSON.stringify(r));
  } finally {
    if (prev === undefined) delete process.env.WARPOS_LIVENESS_REQUIRE_SIG; else process.env.WARPOS_LIVENESS_REQUIRE_SIG = prev;
  }
});

// ── DoE required INTEGRATION test: the REAL production started-row writer shape ────────────────────────

t("INTEGRATION (DoE): a REAL startedRow (production shape) stale + no terminal -> FIRES", () => {
  const realRow = startedRow({ role: "backend-reviewer", provider: "openai", dispatch_id: "dreal", started_at: min(30) });
  // Sanity: the real writer stamps NONE of the old opt-in fields (the inert-check regression).
  assert.strictEqual(realRow.background, undefined);
  assert.strictEqual(realRow.artifact_path, undefined);
  const r = evaluatePairedWaiter({ records: [realRow], nowMs: NOW, staleMs: STALE, artifactProduced: () => false, isVerified: verifyNone });
  assert.strictEqual(r.findings.length, 1, "must fire on the real writer shape: " + JSON.stringify(r));
});

// ── artifactProducedFs (real filesystem resolver, incl. ED-270 lstat) ─────────────────────────────────

t("artifactProducedFs: a real non-empty file modified after start -> true", () => {
  const p = path.join(os.tmpdir(), "pw-real-" + process.pid + ".txt");
  try { fs.writeFileSync(p, "produced"); assert.strictEqual(artifactProducedFs(p, fs.statSync(p).mtimeMs - 1000), true); }
  finally { try { fs.unlinkSync(p); } catch {} }
});

t("qa r2 #2: a DIRECTORY -> false", () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "pw-dir-"));
  try { assert.strictEqual(artifactProducedFs(d, 0), false); } finally { try { fs.rmdirSync(d); } catch {} }
});

t("R1a: a 0-byte file -> false", () => {
  const p = path.join(os.tmpdir(), "pw-empty-" + process.pid + ".txt");
  try { fs.writeFileSync(p, ""); assert.strictEqual(artifactProducedFs(p, 0), false); } finally { try { fs.unlinkSync(p); } catch {} }
});

t("produced-after-start: a file modified BEFORE started_at -> false", () => {
  const p = path.join(os.tmpdir(), "pw-old-" + process.pid + ".txt");
  try { fs.writeFileSync(p, "x"); assert.strictEqual(artifactProducedFs(p, fs.statSync(p).mtimeMs + 60000), false); }
  finally { try { fs.unlinkSync(p); } catch {} }
});

t("ED-270: a SYMLINK to a real produced file -> false (lstat rejects it)", () => {
  const target = path.join(os.tmpdir(), "pw-target-" + process.pid + ".txt");
  const link = path.join(os.tmpdir(), "pw-link-" + process.pid + ".txt");
  try {
    fs.writeFileSync(target, "concurrently-written");
    try { fs.symlinkSync(target, link); } catch (e) { console.log("    (skip — symlink unavailable: " + e.code + ")"); return; }
    assert.strictEqual(artifactProducedFs(link, fs.statSync(target).mtimeMs - 1000), false, "a symlink must not spoof a produced artifact");
  } finally { try { fs.unlinkSync(link); } catch {} try { fs.unlinkSync(target); } catch {} }
});

t("artifactProducedFs: absent path -> false", () => {
  assert.strictEqual(artifactProducedFs(path.join(os.tmpdir(), "pw-absent-" + process.pid), 0), false);
});

console.log("\n" + pass + "/" + (pass + fail) + " passed");
process.exit(fail ? 1 : 0);
