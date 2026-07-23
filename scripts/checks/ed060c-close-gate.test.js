#!/usr/bin/env node
"use strict";
/**
 * ed060c-close-gate.test.js — regression teeth for the ED-060(c) consumer gate
 * (SP-20260723-002 / ADR-0037, qa r1 finding #2). The load-bearing case is the DoE fail-OPEN trap:
 * `auth_fallback:"indeterminate"` and an ABSENT field must BOTH FAIL — a naive `!== true` reject would
 * pass them. This freezes `=== false` as the gate.
 */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { evaluateEd060cClose, latestVerifiedAgyRecord } = require("./ed060c-close-gate.js");
const { signRecord, verifyRecord } = require("../dispatch/attest-signing.js");

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log("  PASS  " + name); }
  catch (e) { fail++; console.error("  FAIL  " + name + " — " + (e && e.message ? e.message : e)); }
}

const CLEAN = { ok: true, fallback: false, auth_fallback: false, provider: "antigravity", tool_id: "agy" };

t("clean agy record (auth_fallback:false) -> closeable", () => {
  assert.strictEqual(evaluateEd060cClose(CLEAN).closeable, true);
});

t("provider:'openai' + tool_id:'agy' -> NOT closeable (backend r2 #4 / qa r2 #1 — both fields required)", () => {
  const r = evaluateEd060cClose({ ...CLEAN, provider: "openai" });
  assert.strictEqual(r.closeable, false);
  assert.ok(r.reasons.some((x) => /provider/.test(x)), JSON.stringify(r.reasons));
});

t("provider ABSENT + tool_id:'agy' -> NOT closeable", () => {
  const rec = { ok: true, fallback: false, auth_fallback: false, tool_id: "agy" };
  assert.strictEqual(evaluateEd060cClose(rec).closeable, false);
});

t("auth_fallback:'indeterminate' -> NOT closeable (the fail-open trap)", () => {
  const r = evaluateEd060cClose({ ...CLEAN, auth_fallback: "indeterminate" });
  assert.strictEqual(r.closeable, false);
  assert.ok(r.reasons.some((x) => /auth_fallback/.test(x)), JSON.stringify(r.reasons));
});

t("auth_fallback:true -> NOT closeable", () => {
  assert.strictEqual(evaluateEd060cClose({ ...CLEAN, auth_fallback: true }).closeable, false);
});

t("auth_fallback ABSENT -> NOT closeable (unstamped != proven)", () => {
  const rec = { ok: true, fallback: false, provider: "antigravity", tool_id: "agy" };
  const r = evaluateEd060cClose(rec);
  assert.strictEqual(r.closeable, false);
  assert.ok(r.reasons.some((x) => /auth_fallback/.test(x)), JSON.stringify(r.reasons));
});

t("provider fallback:true -> NOT closeable", () => {
  assert.strictEqual(evaluateEd060cClose({ ...CLEAN, fallback: true }).closeable, false);
});

t("ok:false -> NOT closeable", () => {
  assert.strictEqual(evaluateEd060cClose({ ...CLEAN, ok: false }).closeable, false);
});

t("wrong tool_id -> NOT closeable", () => {
  assert.strictEqual(evaluateEd060cClose({ ...CLEAN, tool_id: "codex" }).closeable, false);
});

t("empty/undefined record -> NOT closeable (fail-closed)", () => {
  assert.strictEqual(evaluateEd060cClose(undefined).closeable, false);
  assert.strictEqual(evaluateEd060cClose({}).closeable, false);
});

// ── Origin-proof boundary (record-trust): the ledger reader must verify the signature ─────────────────

t("latestVerifiedAgyRecord returns the SIGNED clean record and SKIPS unsigned/tampered", () => {
  const tmp = path.join(os.tmpdir(), "ed060c-ledger-" + process.pid + ".jsonl");
  try {
    const base = { ...CLEAN, provider: "antigravity", completed_at: "2026-07-23T06:00:00.000Z" };
    const signed = { ...base, attest_sig: signRecord(base) };
    assert.ok(verifyRecord(signed), "control: signRecord output must verify");
    const unsigned = { ...CLEAN, provider: "antigravity", completed_at: "2026-07-23T06:05:00.000Z" }; // no attest_sig
    const tampered = { ...signed, completed_at: "2026-07-23T06:10:00.000Z" }; // ts changed AFTER signing -> sig invalid
    // (tampered mutates a signed field after signing -> verifyRecord false)
    fs.writeFileSync(tmp, [signed, unsigned, tampered].map((r) => JSON.stringify(r)).join("\n") + "\n");
    const found = latestVerifiedAgyRecord(tmp, 0, verifyRecord);
    assert.ok(found.record, "a verified record must be returned: " + JSON.stringify(found));
    assert.strictEqual(found.record.completed_at, "2026-07-23T06:00:00.000Z", "only the SIGNED record is trusted: " + JSON.stringify(found.record));
    assert.ok(found.skippedUnverified >= 2, "unsigned + tampered must be skipped: " + JSON.stringify(found));
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
});

t("latestVerifiedAgyRecord returns null when only unsigned records match (fail-closed)", () => {
  const tmp = path.join(os.tmpdir(), "ed060c-ledger-unsigned-" + process.pid + ".jsonl");
  try {
    const unsigned = { ...CLEAN, provider: "antigravity", completed_at: "2026-07-23T06:00:00.000Z" };
    fs.writeFileSync(tmp, JSON.stringify(unsigned) + "\n");
    const found = latestVerifiedAgyRecord(tmp, 0, verifyRecord);
    assert.strictEqual(found.record, null, "an unsigned agy record cannot close: " + JSON.stringify(found));
    assert.strictEqual(found.skippedUnverified, 1);
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
});

t("flipping auth_fallback on a signed record BREAKS the signature (ED-225/227 settable-label close)", () => {
  // The hunter's advisory (d): auth_fallback is in SIGNED_FIELDS, so an unauthenticated serve's
  // auth_fallback:true edited to false invalidates the sig — a field-specific tooth, not just membership.
  const rec = { ...CLEAN, auth_fallback: true, completed_at: "2026-07-23T06:00:00.000Z" };
  const signed = { ...rec, attest_sig: signRecord(rec) };
  assert.ok(verifyRecord(signed), "control: the signed auth_fallback:true record verifies");
  const forged = { ...signed, auth_fallback: false }; // flip the auth bit, keep the sig
  assert.strictEqual(verifyRecord(forged), false, "a flipped auth_fallback must invalidate the signature");
});

t("latestVerifiedAgyRecord ignores a signed provider:'openai'+tool_id:'agy' record (both fields)", () => {
  const tmp = path.join(os.tmpdir(), "ed060c-ledger-mismatch-" + process.pid + ".jsonl");
  try {
    const base = { ok: true, fallback: false, auth_fallback: false, provider: "openai", tool_id: "agy", completed_at: "2026-07-23T06:00:00.000Z" };
    const signed = { ...base, attest_sig: signRecord(base) };
    fs.writeFileSync(tmp, JSON.stringify(signed) + "\n");
    const found = latestVerifiedAgyRecord(tmp, 0, verifyRecord);
    assert.strictEqual(found.record, null, "a provider-mismatched record must not be selected: " + JSON.stringify(found));
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
});

// ── CLI: --since must reject an INVALID date, never silently disable the floor (backend r2 #2) ─────────

t("CLI --since with an INVALID date exits 2 (fail-closed, floor not silently disabled)", () => {
  const cp = require("child_process");
  const tmp = path.join(os.tmpdir(), "ed060c-cli-" + process.pid + ".jsonl");
  const gate = path.join(__dirname, "ed060c-close-gate.js");
  try {
    // A signed clean record dated in the past — WOULD close if the floor were silently disabled.
    const base = { ...CLEAN, completed_at: "2026-07-23T00:00:00.000Z" };
    const signed = { ...base, attest_sig: signRecord(base) };
    fs.writeFileSync(tmp, JSON.stringify(signed) + "\n");
    const bad = cp.spawnSync(process.execPath, [gate, "--completions", tmp, "--since", "not-a-date"], { encoding: "utf8" });
    assert.strictEqual(bad.status, 2, "invalid --since must exit 2, not admit the old record: " + JSON.stringify({ status: bad.status, err: bad.stderr }));
    // Sanity: a VALID past --since picks + closes it (same-session sig verifies).
    const good = cp.spawnSync(process.execPath, [gate, "--completions", tmp, "--since", "2026-07-22T00:00:00.000Z"], { encoding: "utf8" });
    assert.strictEqual(good.status, 0, "valid past --since should close: " + JSON.stringify({ status: good.status, err: good.stderr }));
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
});

console.log("\n" + pass + "/" + (pass + fail) + " passed");
process.exit(fail ? 1 : 0);
