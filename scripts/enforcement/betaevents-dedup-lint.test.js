#!/usr/bin/env node
"use strict";
/**
 * betaevents-dedup-lint.test.js — teeth for the ED-267a betaEvents dedup lint + the shared dedup-util.
 * β riders proven: (1) "plan->design" vs "plan->design-correction" and reconfirms (same sprint+boundary,
 * distinct msg_ids) are NOT false-RED'd — the dedup is msg_id-keyed; (2) an unreachable message log
 * SKIPS the msg_id-resolution sub-check (fail-open advisory), never blocks.
 */
const assert = require("assert");
const { analyze, parseVerdictRows, extractMsgIds } = require("./betaevents-dedup-lint.js");
const { duplicateKeys } = require("./dedup-util.js");

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log("  PASS  " + name); }
  catch (e) { fail++; console.error("  FAIL  " + name + " — " + (e && e.message ? e.message : e)); }
}
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

t("LOW resolution rate -> resolution SKIPPED (log isn't the SendMessage log; fail-open, no noise)", () => {
  // Only 1 of 5 resolves (20%) -> the candidate log isn't the message log (e.g. truncated-preview
  // events.jsonl) -> skip-with-note rather than emit 4 false "unresolved".
  const ids = ["zqa1", "zqb2", "zqc3", "zqd4", "onlyoneresolves"];
  const beta = ids.map((id) => row({ decision: "DECIDE", sprint: "SP-1", boundary: id, msg_id: id })).join("\n");
  const r = analyze({ betaText: beta, eventsText: "the log only contains onlyoneresolves and nothing else matching" });
  assert.strictEqual(r.resolutionSkipped, true, JSON.stringify(r));
  assert.deepStrictEqual(r.unresolved, []);
});

t("msg_id present in the message log -> resolved", () => {
  const beta = row({ decision: "DECIDE", sprint: "SP-1", boundary: "b", msg_id: "found-1234" });
  const r = analyze({ betaText: beta, eventsText: '{"msg_id":"found-1234"}' });
  assert.deepStrictEqual(r.unresolved, []);
});

t("verdict row with NO msg_id -> counted as missingMsgId (advisory)", () => {
  const beta = row({ decision: "DECIDE", sprint: "SP-1", boundary: "b" });
  const r = analyze({ betaText: beta, eventsText: "" });
  assert.strictEqual(r.missingMsgId, 1);
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

console.log("\n" + pass + "/" + (pass + fail) + " passed");
process.exit(fail ? 1 : 0);
