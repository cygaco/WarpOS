"use strict";
/**
 * FALSIFIER: ledger-unreadable-refuses-not-count-zero — GF-3 / R2-F2 TEETH
 * (SP-20260721-001 D-4 INC-1, unit MIG dogfood fallback-visibility).
 *
 * THE ATTACK: the fallback COUNT is the number the Seam-E arm decision is argued from ("zero-or-explained
 * fallbacks at flip time"). If a read failure on the ledger collapsed to an EMPTY ledger (count 0), then:
 *   (a) a fallback against an unreadable-but-appendable ledger would proceed with a fabricated count of 0,
 *       and `report` would certify a clean "ZERO fallbacks" over a ledger it could not even read — the
 *       exact false-green the flip-trigger's honesty rests on; and
 *   (b) (R2-F2, the regression the round-1 fix must NOT introduce) an unreadable ledger read on the SUCCESS
 *       path would THROW after the ref already moved, turning a landed write into a false failure.
 *
 * MUST HOLD: ENOENT (never written) is the ONLY "empty". A present-but-unreadable ledger (a) REFUSES the
 * fallback (fallback-unrecordable, security) and `report` surfaces UNREADABLE — never ZERO; and (b) the
 * informational success-path count read is SAFE — {count:null, unreadable:true}, never a throw, never a
 * fabricated 0.
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const dog = require("../broker-dogfood");

/** A present-but-UNREADABLE ledger path: a directory where the ledger file must be (readFileSync -> a
 *  non-ENOENT error, distinct from a never-written ledger). */
function unreadableLedger(tag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `gf3-${tag}-`));
  const logPath = path.join(dir, "dogfood-fallbacks.jsonl");
  fs.mkdirSync(logPath, { recursive: true });
  return { dir, logPath };
}

test("FALSIFIER GF-3 MUST-BLOCK — an unreadable-but-present ledger REFUSES the fallback (never a count-0 bypass)", () => {
  const L = unreadableLedger("refuse");
  try {
    // recordFallback must NOT treat an unreadable ledger as empty (count 0) — it must report unrecordable.
    const rec = dog.recordFallback({ transport: "branch-merge", target_ref: "refs/heads/main", reason: "no-pinned-bundle-configured" }, { logPath: L.logPath });
    assert.strictEqual(rec.ok, false, "MUST-BLOCK: an unreadable ledger cannot be counted — recordFallback must fail");
    assert.match(String(rec.error), /ledger-unreadable/);
    // and through attemptFallback: an operational miss on an unreadable ledger is REFUSED, not landed count-0.
    const res = dog.attemptFallback({ reason: "no-pinned-bundle-configured", transport: "branch-merge", targetRef: "refs/heads/main", gitRoot: L.dir, logPath: L.logPath, emit: false });
    assert.strictEqual(res.ok, false, "MUST-BLOCK: the fallback must be refused, not performed with count 0");
    assert.strictEqual(res.reason, "fallback-unrecordable");
    assert.strictEqual(res.classification, "security");
  } finally {
    fs.rmSync(L.dir, { recursive: true, force: true });
  }
});

test("FALSIFIER GF-3 MUST-BLOCK — report() surfaces UNREADABLE and NEVER certifies a clean ZERO", () => {
  const L = unreadableLedger("report");
  try {
    const rep = dog.report(L.logPath);
    assert.strictEqual(rep.unreadable, true, "MUST-BLOCK: an unreadable ledger must be flagged unreadable");
    assert.match(rep.text, /UNREADABLE/);
    assert.strictEqual(/ZERO fallbacks/.test(rep.text), false, "MUST-BLOCK: an unreadable ledger must NEVER read as a clean ZERO");
  } finally {
    fs.rmSync(L.dir, { recursive: true, force: true });
  }
});

test("FALSIFIER R2-F2 MUST-BLOCK — the informational success-path count read is SAFE (never throws, never a false zero)", () => {
  const L = unreadableLedger("safe");
  try {
    // fallbackCountSafe is what the brokered SUCCESS path uses: an unreadable ledger must yield a structured
    // unknown, never an exception (which would falsely fail a landed write) and never a fabricated 0.
    const safe = dog.fallbackCountSafe(L.logPath);
    assert.strictEqual(safe.count, null, "MUST-BLOCK: an unreadable ledger must NOT report a fabricated count of 0");
    assert.strictEqual(safe.unreadable, true);
    // and the throwing variant still THROWS (it is the security-path read that recordFallback catches).
    assert.throws(() => dog.fallbackCount(L.logPath), "the security-path count read must still throw on unreadable");
  } finally {
    fs.rmSync(L.dir, { recursive: true, force: true });
  }
});
