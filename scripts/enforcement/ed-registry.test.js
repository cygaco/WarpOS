#!/usr/bin/env node
"use strict";
/**
 * ed-registry.test.js — teeth for the shared ED register scan (SP-20260723-003 / ED-267b + ED-258a).
 * Per β: each unit plants BOTH the real-violation→RED AND the hardest benign-adjacent→GREEN, so the lint
 * is neither a dead gate nor a false-RED generator. The load-bearing pair is the genesis-dup key: two
 * distinct genesis loggings colliding → RED, an append-only closure row re-using the id → GREEN.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { nextEdId, findDuplicateGenesisIds, findGenesisEvadingUpdates, parseRegister } = require("./ed-registry.js");

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log("  PASS  " + name); }
  catch (e) { fail++; console.error("  FAIL  " + name + " — " + (e && e.message ? e.message : e)); }
}
const row = (o) => JSON.stringify(o);

// ── nextEdId (ED-267b allocator) ──────────────────────────────────────────────────────────────────────

t("nextEdId: true max + 1 (not line count)", () => {
  const reg = [row({ id: "ED-001" }), row({ id: "ED-005" }), row({ id: "ED-003" })].join("\n");
  assert.strictEqual(nextEdId(reg), "ED-006");
});

t("nextEdId: empty register -> ED-001", () => {
  assert.strictEqual(nextEdId(""), "ED-001");
  assert.strictEqual(nextEdId(null), "ED-001");
});

t("nextEdId: line count > max id (the bug) uses MAX, not the count", () => {
  // 4 lines but max id is ED-269 (an amendment row inflates the count) -> ED-270, NOT ED-005.
  const reg = [
    row({ id: "ED-269", status: "open" }),
    row({ id: "ED-269", amendment: true, status: "open" }),
    row({ id: "ED-268", status: "open" }),
    row({ id: "ED-100", record_kind: "amendment", amends: "ED-100" }),
  ].join("\n");
  assert.strictEqual(nextEdId(reg), "ED-270");
});

t("nextEdId: malformed line skipped, never crashes/collides", () => {
  const reg = [row({ id: "ED-002" }), "{ this is not json", row({ id: "ED-004" })].join("\n");
  assert.strictEqual(nextEdId(reg), "ED-005");
});

// ── findDuplicateGenesisIds (ED-258a dup-id lint) ─────────────────────────────────────────────────────

t("REAL genesis dup: two distinct debt loggings on one id -> RED", () => {
  const reg = [
    row({ id: "ED-100", policy: "first debt", status: "open" }),
    row({ id: "ED-100", policy: "SECOND distinct debt collided on the id", status: "open" }),
  ].join("\n");
  const dups = findDuplicateGenesisIds(reg);
  assert.strictEqual(dups.length, 1, JSON.stringify(dups));
  assert.strictEqual(dups[0].id, "ED-100");
  assert.strictEqual(dups[0].count, 2);
});

t("BENIGN closure (amendment:true) re-using an id -> GREEN (the false-RED-inverse closed)", () => {
  const reg = [
    row({ id: "ED-100", policy: "the debt", status: "open" }),
    row({ id: "ED-100", amendment: true, status: "resolved", note: "closed" }),
  ].join("\n");
  assert.deepStrictEqual(findDuplicateGenesisIds(reg), []);
});

t("BENIGN append-only record_kind/amends row re-using an id -> GREEN", () => {
  const reg = [
    row({ id: "ED-264", policy: "the debt", status: "open" }),
    row({ id: "ED-264", record_kind: "amendment", amends: "ED-264", note: "sub-item resolved" }),
    row({ id: "ED-264", record_kind: "amendment", amends: "ED-264", note: "rider" }),
  ].join("\n");
  assert.deepStrictEqual(findDuplicateGenesisIds(reg), []);
});

t("BENIGN thin closure row (status:closed + closure_receipt, NO description) -> GREEN (the real ED-244 pattern)", () => {
  // ED-244's closure row carries neither amendment:true nor record_kind/amends — it's a thin status
  // change. Requiring a fresh DESCRIPTION for genesis is what keeps this from false-RED'ing a closed ED.
  const reg = [
    row({ id: "ED-244", policy: "the debt", source: "x", severity: "medium", status: "open" }),
    row({ id: "ED-244", status: "closed", closure_receipt: "abc", enforcer: "scripts/x.js", closed_ts: "2026-07-01T00:00:00Z" }),
  ].join("\n");
  assert.deepStrictEqual(findDuplicateGenesisIds(reg), []);
});

t("dup lint: malformed + non-ED lines skipped", () => {
  const reg = [
    row({ id: "ED-100", policy: "first", status: "open" }),
    "garbage{",
    row({ id: "not-an-ed", policy: "x" }),
    row({ id: "ED-100", policy: "second collision", status: "open" }),
  ].join("\n");
  const dups = findDuplicateGenesisIds(reg);
  assert.strictEqual(dups.length, 1);
  assert.strictEqual(dups[0].id, "ED-100");
});

t("parseRegister: genesis discriminator (description=genesis; amendment/record_kind/amends/thin-closure=update)", () => {
  const rows = parseRegister([
    row({ id: "ED-1", policy: "the debt", status: "open" }),                          // genesis (has description)
    row({ id: "ED-1", amendment: true }),                                             // update
    row({ id: "ED-1", record_kind: "amendment" }),                                    // update
    row({ id: "ED-1", amends: "ED-1" }),                                              // update
    row({ id: "ED-1", status: "closed", closure_receipt: "x", enforcer: "y" }),       // update (thin closure, no description)
  ].join("\n"));
  assert.deepStrictEqual(rows.map((r) => r.isGenesis), [true, false, false, false, false]);
});

// ── CONTROL: the REAL register is currently genesis-dup-free (proves the lint isn't a false-RED generator)

// ── findGenesisEvadingUpdates (ED-258a security r2 #2: a genesis hiding behind an update marker) ───────

t("SECURITY r2 #2: update-marked row (amendment:true) carrying a fresh policy -> FLAGGED (evading)", () => {
  const reg = [
    row({ id: "ED-100", policy: "the debt", status: "open" }),
    row({ id: "ED-100", amendment: true, policy: "a SECOND distinct debt hiding under an update marker", status: "open" }),
  ].join("\n");
  const ev = findGenesisEvadingUpdates(reg);
  assert.strictEqual(ev.length, 1, JSON.stringify(ev));
  assert.strictEqual(ev[0].id, "ED-100");
  // and the plain genesis-dup count still sees only ONE genesis (proving the marker DID dodge that count).
  assert.deepStrictEqual(findDuplicateGenesisIds(reg), []);
});

t("update-marked row (record_kind) carrying a fresh origin -> FLAGGED (evading)", () => {
  const reg = row({ id: "ED-101", record_kind: "amendment", amends: "ED-101", origin: "fresh debt text" });
  assert.strictEqual(findGenesisEvadingUpdates(reg).length, 1);
});

t("BENIGN: a legit amendment (note only, no description) -> NOT flagged evading", () => {
  const reg = [
    row({ id: "ED-100", policy: "the debt", status: "open" }),
    row({ id: "ED-100", amendment: true, note: "a real update via note", status: "open" }),
  ].join("\n");
  assert.deepStrictEqual(findGenesisEvadingUpdates(reg), []);
});

t("BENIGN: a plain genesis (description, no update marker) -> NOT flagged evading", () => {
  assert.deepStrictEqual(findGenesisEvadingUpdates(row({ id: "ED-100", policy: "the debt", status: "open" })), []);
});

t("CONTROL: the live register has NO genesis-evading update rows", () => {
  const ROOT = path.join(__dirname, "..", "..");
  let p;
  try { p = require(path.join(ROOT, "scripts", "hooks", "lib", "paths")).PATHS.enforcementDebt; }
  catch { p = ".claude/project/memory/enforcement-debt.jsonl"; }
  if (!path.isAbsolute(p)) p = path.join(ROOT, p);
  let text;
  try { text = fs.readFileSync(p, "utf8"); } catch { console.log("    (skip — register not present)"); return; }
  assert.deepStrictEqual(findGenesisEvadingUpdates(text), [], "live register has genesis-evading updates");
});

t("CONTROL: the live enforcement-debt register has NO genesis dups", () => {
  const ROOT = path.join(__dirname, "..", "..");
  let p;
  try { p = require(path.join(ROOT, "scripts", "hooks", "lib", "paths")).PATHS.enforcementDebt; }
  catch { p = ".claude/project/memory/enforcement-debt.jsonl"; }
  if (!path.isAbsolute(p)) p = path.join(ROOT, p);
  let text;
  try { text = fs.readFileSync(p, "utf8"); } catch { console.log("    (skip — register not present)"); return; }
  const dups = findDuplicateGenesisIds(text);
  assert.deepStrictEqual(dups, [], "the live register has genesis dups: " + JSON.stringify(dups));
});

console.log("\n" + pass + "/" + (pass + fail) + " passed");
process.exit(fail ? 1 : 0);
