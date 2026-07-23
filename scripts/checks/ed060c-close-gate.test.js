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

const CLEAN = { ok: true, fallback: false, auth_fallback: false, tool_id: "agy" };

t("clean agy record (auth_fallback:false) -> closeable", () => {
  assert.strictEqual(evaluateEd060cClose(CLEAN).closeable, true);
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
  const rec = { ok: true, fallback: false, tool_id: "agy" };
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

console.log("\n" + pass + "/" + (pass + fail) + " passed");
process.exit(fail ? 1 : 0);
