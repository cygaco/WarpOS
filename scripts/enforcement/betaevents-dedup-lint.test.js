#!/usr/bin/env node
"use strict";
/**
 * betaevents-dedup-lint.test.js — teeth for the ED-267a betaEvents dedup lint + the shared dedup-util.
 * β riders proven: (1) "plan->design" vs "plan->design-correction" and reconfirms (same sprint+boundary,
 * distinct msg_ids) are NOT false-RED'd — the dedup is msg_id-keyed; (2) an unreachable message log
 * SKIPS the msg_id-resolution sub-check (fail-open advisory), never blocks.
 */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { analyze, parseVerdictRows, extractMsgIds, realMsgId } = require("./betaevents-dedup-lint.js");
const { duplicateKeys } = require("./dedup-util.js");

// QA-TEETH-006: exercise the REAL CLI --enforce path (not a reimplemented predicate). Writes fixture files
// and spawns `node betaevents-dedup-lint.js --enforce --beta <f> [--events <f>]`. R3D-QA-001 (r3e): the
// nested spawn is EPERM-blocked in the reviewer sandbox (QA-012/ED-223), so DISTINGUISH a spawn-failure
// (no numeric e.status) from a real non-zero exit — mapping the former to exit-1 false-greened the negative
// control AND false-red the positive one. Returns { code, out, err, spawnFailed }.
function runCli(betaContent, { eventsContent, eventsUnreachable } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "be-cli-"));
  const betaFile = path.join(dir, "beta.jsonl");
  fs.writeFileSync(betaFile, betaContent);
  const argv = [path.join(__dirname, "betaevents-dedup-lint.js"), "--enforce", "--beta", betaFile];
  if (eventsUnreachable) {
    argv.push("--events", path.join(dir, "no-such-events.jsonl")); // absent → genuine log-unreachable path
  } else if (eventsContent != null) {
    const eventsFile = path.join(dir, "events.jsonl");
    fs.writeFileSync(eventsFile, eventsContent);
    argv.push("--events", eventsFile);
  }
  let code = null, out = "", err = "", spawnFailed = false;
  try {
    out = execFileSync("node", argv, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    code = 0;
  } catch (e) {
    // A spawned-and-ran process sets e.status (a NUMBER); a spawn failure sets e.code (EPERM/ENOENT) with
    // NO numeric status. Keep them SEPARATE so a spawn error can never satisfy a control (it loud-skips).
    if (typeof e.status === "number") code = e.status;
    else spawnFailed = true;
    out = String(e.stdout || ""); err = String(e.stderr || "");
  }
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  return { code, out, err, spawnFailed };
}

let pass = 0, fail = 0, skip = 0;
function t(name, fn) {
  try { fn(); pass++; console.log("  PASS  " + name); }
  catch (e) {
    // LOUD skip (never a silent green-on-skip — the sprint's own honesty class): a portability-unavailable
    // CLI tooth SKIPs, it does not PASS and does not hard-FAIL.
    if (e && e.__skip) { skip++; console.log("  SKIP  " + name + " — " + e.message); return; }
    fail++; console.error("  FAIL  " + name + " — " + (e && e.message ? e.message : e));
  }
}
function skipTest(msg) { const e = new Error(msg); e.__skip = true; throw e; }
const row = (o) => JSON.stringify(o);

// ── dedup-util ────────────────────────────────────────────────────────────────────────────────────────
t("duplicateKeys: flags a key on >1 item; excludes null keys", () => {
  const dups = duplicateKeys([{ k: "a" }, { k: "a" }, { k: "b" }, { k: null }, { k: null }], (x) => x.k);
  assert.deepStrictEqual(dups, [{ key: "a", count: 2 }]);
});

// ── betaEvents dedup (β rider #1: msg_id-keyed, boundary-distinct-safe) ────────────────────────────────
t("REAL duplicate msg_id on two verdict rows -> flagged", () => {
  const beta = [
    row({ decision: "DECIDE", sprint: "SP-1", boundary: "gauntlet->release", msg_id: "abc" }),
    row({ decision: "DECIDE", sprint: "SP-1", boundary: "gauntlet->release", msg_id: "abc" }),
  ].join("\n");
  const r = analyze({ betaText: beta, eventsText: "" });
  assert.deepStrictEqual(r.dupMsgIds, ["abc"], JSON.stringify(r));
});

t("plan->design + plan->design-correction (distinct msg_ids) -> NO dup (β rider #1)", () => {
  const beta = [
    row({ decision: "DECIDE", sprint: "SP-1", boundary: "plan->design", msg_id: "m1" }),
    row({ decision: "DECIDE", sprint: "SP-1", boundary: "plan->design-correction", msg_id: "m2" }),
  ].join("\n");
  const r = analyze({ betaText: beta, eventsText: "m1 m2" });
  assert.deepStrictEqual(r.dupMsgIds, [], JSON.stringify(r));
});

t("reconfirm rows (same sprint+boundary, distinct msg_ids) -> NO dup", () => {
  const beta = [
    row({ decision: "DECIDE", sprint: "SP-1", boundary: "gauntlet->release", msg_id: "r1" }),
    row({ decision: "DECIDE", sprint: "SP-1", boundary: "gauntlet->release", msg_id: "r2" }),
    row({ decision: "DECIDE", sprint: "SP-1", boundary: "gauntlet->release", msg_id: "r3" }),
  ].join("\n");
  const r = analyze({ betaText: beta, eventsText: "r1 r2 r3" });
  assert.deepStrictEqual(r.dupMsgIds, [], JSON.stringify(r));
});

t("a REQUESTED row is not a verdict (excluded from dedup)", () => {
  const beta = [
    row({ decision: "REQUESTED", sprint: "SP-1", boundary: "gauntlet->release", msg_id: "q" }),
    row({ decision: "REQUESTED", sprint: "SP-1", boundary: "gauntlet->release", msg_id: "q" }),
  ].join("\n");
  assert.strictEqual(parseVerdictRows(beta).length, 0);
  assert.deepStrictEqual(analyze({ betaText: beta, eventsText: "" }).dupMsgIds, []);
});

// ── msg_id resolution (β rider #2: fail-open when the message log is unreachable) ──────────────────────
t("message log UNREACHABLE (eventsText null) -> resolution SKIPPED, not flagged (β rider #2)", () => {
  const beta = row({ decision: "DECIDE", sprint: "SP-1", boundary: "b", msg_id: "x" });
  const r = analyze({ betaText: beta, eventsText: null });
  assert.strictEqual(r.resolutionSkipped, true, JSON.stringify(r));
  assert.deepStrictEqual(r.unresolved, []);
});

t("strong-majority resolve + one missing -> the missing one is flagged (log proven authoritative)", () => {
  // 4 of 5 resolve (80%) -> the log is trusted; the 1 genuine miss is flagged. Distinctive ids so the
  // resolution is exact-substring, not accidental.
  const ids = ["mmid1", "mmid2", "mmid3", "mmid4", "ghostxyz"];
  const beta = ids.map((id) => row({ decision: "DECIDE", sprint: "SP-1", boundary: id, msg_id: id })).join("\n");
  const eventsText = ["mmid1", "mmid2", "mmid3", "mmid4"].map((x) => `{"msg_id":"${x}"}`).join("\n");
  const r = analyze({ betaText: beta, eventsText });
  assert.deepStrictEqual(r.unresolved, ["ghostxyz"], JSON.stringify(r));
  assert.strictEqual(r.resolutionSkipped, false);
});

t("security r2 #3: LOW resolution -> report-only SKIPS the advisory BUT unresolved SURVIVES (enforce fails closed)", () => {
  // 1 of 5 resolves (20%) -> low confidence. In report-only the advisory is skipped (truncated-log noise),
  // BUT unresolved is NOT zeroed — so --enforce fails closed on the fabricated-row swamp (the r1 hole).
  const ids = ["zqa1", "zqb2", "zqc3", "zqd4", "onlyoneresolves"];
  const beta = ids.map((id) => row({ decision: "DECIDE", sprint: "SP-1", boundary: id, msg_id: id })).join("\n");
  const r = analyze({ betaText: beta, eventsText: '{"msg_id":"onlyoneresolves"}' });
  assert.strictEqual(r.lowConfidence, true, JSON.stringify(r));
  assert.strictEqual(r.resolutionSkipped, true, "report-only skips the advisory");
  assert.strictEqual(r.logUnreachable, false);
  assert.strictEqual(r.unresolved.length, 4, "the 4 unresolved must SURVIVE for --enforce to fail closed: " + JSON.stringify(r));
});

t("msg_id present in the message log -> resolved", () => {
  const beta = row({ decision: "DECIDE", sprint: "SP-1", boundary: "b", msg_id: "found-1234" });
  const r = analyze({ betaText: beta, eventsText: '{"msg_id":"found-1234"}' });
  assert.deepStrictEqual(r.unresolved, []);
});

t("security r3 RR3-SEC-001: a verdict-shaped row that OMITS msg_id -> missingMsgId (blocks under enforce)", () => {
  // The fabricated-row attack dropped to omitting msg_id entirely (no id -> dodges the unresolved set).
  const beta = row({ decision: "DECIDE", class: "B", sprint: "SP-1", boundary: "b" }); // verdict-shaped, no msg_id
  const r = analyze({ betaText: beta, eventsText: '{"msg_id":"other"}' });
  assert.strictEqual(r.missingMsgId, 1);
  assert.strictEqual(r.logUnreachable, false);
  assert.strictEqual(r.missingMsgId > 0, true, "a verdict row without msg_id must be blockable under --enforce");
});

t("security r3 7G-005 (QA-TEETH-006): a missing-msg_id verdict blocks via the REAL CLI --enforce even when the log is UNREACHABLE", () => {
  // 7G-005: gating missingMsgId on !logUnreachable let the fabricated-row hole reopen — a verdict missing
  // its OWN msg_id is malformed regardless of whether OTHER ids resolve. QA-TEETH-006: the blocking is
  // asserted from the REAL CLI exit code (spawned with --enforce + an absent --events → genuine
  // log-unreachable), NOT a reimplemented predicate. The pure analyze() check below documents the state.
  const beta = row({ decision: "DECIDE", class: "B", sprint: "SP-1", boundary: "b" }); // no msg_id
  const r = analyze({ betaText: beta, eventsText: null }); // log unreachable
  assert.strictEqual(r.logUnreachable, true);
  assert.strictEqual(r.missingMsgId, 1);
  const { code, err, out, spawnFailed } = runCli(beta + "\n", { eventsUnreachable: true });
  if (spawnFailed) skipTest("nested node spawn unavailable (sandbox EPERM / QA-012) — CLI tooth not exercisable here; the pure analyze() teeth above still run");
  // Require the REAL lint output signature — a spawn error carries none, so it can NEVER satisfy this control.
  assert.ok(/betaevents-dedup-lint:\s*FAIL/.test(err), "the CLI must produce its real FAIL output (not a spawn error): " + (err || out));
  assert.strictEqual(code, 1, "the REAL CLI --enforce must exit 1 on a missing-msg_id verdict even with an unreachable log: " + (err || out));
});

t("QA-TEETH-006: the REAL CLI --enforce exits 0 on a clean verdict row (resolvable msg_id)", () => {
  // The positive control for the CLI seam: a well-formed verdict whose msg_id resolves in the log must NOT
  // block — proves the exit-1 above is the missing-msg_id finding, not the CLI always failing.
  const beta = row({ decision: "DECIDE", sprint: "SP-1", boundary: "b", msg_id: "cli-ok-1234" });
  const { code, err, out, spawnFailed } = runCli(beta + "\n", { eventsContent: '{"msg_id":"cli-ok-1234"}\n' });
  if (spawnFailed) skipTest("nested node spawn unavailable (sandbox EPERM / QA-012) — CLI tooth not exercisable here");
  assert.ok(/betaevents-dedup-lint:\s*OK/.test(out), "the CLI must produce its real OK output (not a spawn error): " + (err || out));
  assert.strictEqual(code, 0, "a clean resolvable verdict must not block under --enforce: " + (err || out));
});

t("7G-008 (r3e whitespace, qa+backend cross-lane): a WHITESPACE-only msg_id counts as MISSING under enforce", () => {
  // A "   " msg_id is a truthy string but no id — treated as present it dodged both missingMsgId AND
  // unresolved, failing OPEN under --enforce with an unreachable log. It must be MISSING now.
  const beta = row({ decision: "DECIDE", class: "B", sprint: "SP-1", boundary: "b", msg_id: "   " });
  const r = analyze({ betaText: beta, eventsText: null });
  assert.strictEqual(r.missingMsgId, 1, "a whitespace-only msg_id must be MISSING, not present: " + JSON.stringify(r));
});

t("r3e realMsgId: a padded msg_id resolves on its TRIMMED value (no false-unresolved)", () => {
  const beta = row({ decision: "DECIDE", sprint: "SP-1", boundary: "b", msg_id: "  pad-1  " });
  const r = analyze({ betaText: beta, eventsText: '{"msg_id":"pad-1"}' });
  assert.deepStrictEqual(r.unresolved, [], "a padded msg_id must resolve on its trimmed value: " + JSON.stringify(r));
  assert.strictEqual(r.missingMsgId, 0);
});

t("realMsgId: trims; null on blank/absent/non-string", () => {
  assert.strictEqual(realMsgId({ msg_id: "  x  " }), "x");
  assert.strictEqual(realMsgId({ msg_id: "   " }), null);
  assert.strictEqual(realMsgId({ msg_id: "" }), null);
  assert.strictEqual(realMsgId({}), null);
  assert.strictEqual(realMsgId({ msg_id: 5 }), null);
});

t("β reconcile-row exemption: a NON-verdict row (no decision) with no msg_id -> NOT counted", () => {
  const beta = [row({ record_kind: "reconcile", sprint: "SP-1", boundary: "b" }), row({ sprint: "SP-1", note: "housekeeping" })].join("\n");
  const r = analyze({ betaText: beta, eventsText: "" });
  assert.strictEqual(r.missingMsgId, 0, "only verdict-shaped (decision) rows require a msg_id");
});

t("betaText null -> skipped (gitignored advisory ledger absent)", () => {
  assert.strictEqual(analyze({ betaText: null, eventsText: null }).skipped, true);
});

// ── qa r2 #4 / security r2 #3: EXACT msg_id match, not substring ───────────────────────────────────────
t("extractMsgIds parses msg_id field VALUES for exact membership (no substring leak)", () => {
  const set = extractMsgIds('{"decision":"DECIDE","msg_id":"abc"}\n{"msg_id":"abcd"}');
  assert.strictEqual(set.has("abc"), true);
  assert.strictEqual(set.has("abcd"), true);
  assert.strictEqual(set.has("ab"), false, "a substring must NOT be a member");
});

t("PREFIX COLLISION: verdict m1 is NOT resolved by a log containing only m10 (exact, not substring)", () => {
  const beta = ["r1", "r2", "r3", "r4", "m1"].map((id) => row({ decision: "DECIDE", sprint: "S", boundary: id, msg_id: id })).join("\n");
  // 4 exact-resolve (r1-r4) keeps the log >=80% trusted; m1's only near-entry is m10 (a substring, not exact).
  const eventsText = ['r1', 'r2', 'r3', 'r4', 'm10'].map((x) => `{"msg_id":"${x}"}`).join("\n");
  const r = analyze({ betaText: beta, eventsText });
  assert.deepStrictEqual(r.unresolved, ["m1"], "m1 must NOT be resolved by m10 (substring): " + JSON.stringify(r));
  assert.strictEqual(r.resolutionSkipped, false);
});

console.log("\n" + pass + "/" + (pass + fail) + " passed" + (skip ? " (" + skip + " skipped)" : ""));
process.exit(fail ? 1 : 0);
