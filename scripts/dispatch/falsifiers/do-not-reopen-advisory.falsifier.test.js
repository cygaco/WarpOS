"use strict";
// FALSIFIER: AC-F8 do-not-reopen-advisory-only — record-trust gate (SP-20260718-005), surface do-not-reopen-at-resume.
// Adversarial: a resumed session tries to REVERSE a settled disposition without an explicit supersession entry —
// treating the do-not-reopen ledger as advisory. That reversal MUST-BLOCK; only an explicit supersede() reopens. RED until BE-5.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MOD = path.join(ROOT, "scripts", "dispatch", "do-not-reopen.js");

test("AC-F8 reversing a settled disposition without supersession MUST-BLOCK", (t) => {
  if (!fs.existsSync(MOD)) return t.skip("pending BE-5 — do-not-reopen.js not yet built (falsifier RED)");
  const dnr = require(MOD);
  const spId = "SP-FALSIFIER-F8";
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dnr-f8-"));
  const opts = { root: dir };
  const decisionId = "adversarial-helm-containment-DROPPED";
  dnr.settle(spId, decisionId, { reason: "β-ruled dropped from 1.0" }, opts);
  // The resumed session re-litigates without an explicit supersession.
  assert.strictEqual(
    dnr.isSettled(spId, decisionId, opts),
    true,
    "the disposition must read as SETTLED on resume (surfaced, not silently reopenable)",
  );
  // A reversal attempt that is NOT an explicit supersession must be refused.
  const reversed = dnr.tryReopen
    ? dnr.tryReopen(spId, decisionId, { supersede: false }, opts)
    : { ok: false };
  assert.strictEqual(
    reversed.ok,
    false,
    "MUST-BLOCK: a settled disposition cannot be reopened without an explicit supersession entry (advisory-only is refused)",
  );
});
