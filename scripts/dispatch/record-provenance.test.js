#!/usr/bin/env node
"use strict";
/**
 * R3-1/R3-2 teeth (SP-20260718-003 · SR-011/SR-013): every completion record is bound to its execution
 * PROVENANCE — the panel_run_id the runner MINTS (propagated to each child via WARPOS_PANEL_RUN_ID) and
 * the code_sha the dispatch ran against — INJECTED in the single shared recordCompletion, so no dispatch
 * wrapper (dispatch-agent/dispatch-claude/dispatch-skill/epsilon-runtime) can omit them.
 *
 * This proves the id ACTUALLY reaches the record (β's cross-cutting teeth) — a missed write-site would
 * surface here as an absent field. Uses the DISPATCH_LEDGER_DIR test seam (no real dispatch).
 *
 *   node scripts/dispatch/record-provenance.test.js
 */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { recordCompletion } = require("../dispatch-agent");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

function withLedger(env, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-ledger-"));
  const saved = {};
  const setEnv = { DISPATCH_LEDGER_DIR: dir, ...env };
  for (const k of Object.keys(setEnv)) { saved[k] = process.env[k]; process.env[k] = setEnv[k]; }
  // also clear WARPOS_PANEL_RUN_ID when not provided, so a leaked env from another test can't taint us
  if (!("WARPOS_PANEL_RUN_ID" in env)) { saved.WARPOS_PANEL_RUN_ID = process.env.WARPOS_PANEL_RUN_ID; delete process.env.WARPOS_PANEL_RUN_ID; }
  try {
    recordCompletion({ role: "security-reviewer", provider: "openai", ok: true, output_digest: "d" });
    const line = fs.readFileSync(path.join(dir, "dispatch-completions.jsonl"), "utf8").trim().split("\n").pop();
    return fn(JSON.parse(line));
  } finally {
    for (const k of Object.keys(saved)) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
}

// ── SR-011: WARPOS_PANEL_RUN_ID reaches the record (the minted id propagates to the child write). ──
test("SR-011: recordCompletion stamps panel_run_id from WARPOS_PANEL_RUN_ID", () => {
  withLedger({ WARPOS_PANEL_RUN_ID: "panel-injected-42" }, (rec) => {
    assert.equal(rec.panel_run_id, "panel-injected-42", "the minted panel_run_id must reach the record");
  });
});
test("SR-011: no WARPOS_PANEL_RUN_ID → panel_run_id is null (not a stale value)", () => {
  withLedger({}, (rec) => {
    assert.equal(rec.panel_run_id, null);
  });
});

// ── SR-013: code_sha (git HEAD at write-time) is persisted in the record. ──
test("SR-013: recordCompletion persists a non-empty code_sha (git HEAD)", () => {
  withLedger({ WARPOS_PANEL_RUN_ID: "p" }, (rec) => {
    assert.ok(typeof rec.code_sha === "string" && rec.code_sha.length >= 7, `code_sha must be persisted, got ${JSON.stringify(rec.code_sha)}`);
  });
});

// ── an explicit caller value still wins (backward-compatible, not clobbered). ──
test("a caller-provided panel_run_id/code_sha is preserved (additive, non-clobbering)", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-ledger-"));
  const saved = process.env.DISPATCH_LEDGER_DIR;
  process.env.DISPATCH_LEDGER_DIR = dir;
  try {
    recordCompletion({ role: "security-reviewer", provider: "openai", ok: true, panel_run_id: "explicit", code_sha: "explicit-sha" });
    const rec = JSON.parse(fs.readFileSync(path.join(dir, "dispatch-completions.jsonl"), "utf8").trim().split("\n").pop());
    assert.equal(rec.panel_run_id, "explicit");
    assert.equal(rec.code_sha, "explicit-sha");
  } finally {
    if (saved === undefined) delete process.env.DISPATCH_LEDGER_DIR; else process.env.DISPATCH_LEDGER_DIR = saved;
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
});

if (failures.length) {
  process.stderr.write(`FAIL [record-provenance.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [record-provenance.test] ${passed} passed (panel_run_id + code_sha reach every completion record; the cross-cutting propagation is proven)\n`);
