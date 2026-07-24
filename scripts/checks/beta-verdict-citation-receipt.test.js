"use strict";
/**
 * Sealed-fixture test for beta-verdict-citation-receipt.js (ED-239). Pure evaluate() driven by
 * injected docs + betaEvents text — no disk.
 */
const assert = require("assert");
const { evaluate, verdictMsgIds } = require("./beta-verdict-citation-receipt");

let pass = 0, fail = 0;
function t(desc, fn) {
  try { fn(); console.log("  PASS  " + desc); pass++; }
  catch (e) { console.error("  FAIL  " + desc + "\n        " + e.message); fail++; }
}
const ev = (o) => JSON.stringify(o);
const beta = (rows) => rows.map(ev).join("\n");

// ── 1. citation with a RESOLVING msg_id -> clean ──
t("citation citing a msg_id that resolves to a betaEvents verdict row -> no finding", () => {
  const docs = [{ path: "adr/1.md", text: "We proceed. β DECIDE B/0.92 (design->build, msg_id abc123def) SHIP." }];
  const betaEventsText = beta([{ type: "beta-verdict", msg_id: "abc123def", decision: "DECIDE" }]);
  const r = evaluate({ docs, betaEventsText });
  assert.strictEqual(r.hard.length, 0);
  assert.strictEqual(r.soft.length, 0);
  assert.strictEqual(r.scannedCitations, 1);
});

// ── 2. citation with an UNRESOLVED msg_id -> HARD finding ──
t("citation citing a msg_id NOT in betaEvents -> hard finding", () => {
  const docs = [{ path: "adr/2.md", text: "β DIRECTIVE (msg_id ghost999) do X." }];
  const betaEventsText = beta([{ type: "beta-verdict", msg_id: "real000", decision: "DIRECTIVE" }]);
  const r = evaluate({ docs, betaEventsText });
  assert.strictEqual(r.hard.length, 1, "unresolved receipt must be hard");
  assert.strictEqual(r.hard[0].msg_id, "ghost999");
  assert.strictEqual(r.soft.length, 0);
});

// ── 3. citation with NO msg_id -> SOFT advisory (never hard) ──
t("load-bearing citation with no msg_id -> soft advisory only", () => {
  const docs = [{ path: "adr/3.md", text: "β ruled we ship it." }];
  const betaEventsText = beta([{ type: "beta-verdict", msg_id: "x1" }]);
  const r = evaluate({ docs, betaEventsText });
  assert.strictEqual(r.hard.length, 0);
  assert.strictEqual(r.soft.length, 1);
});

// ── 4. citation inside a Session log HISTORY section -> skipped ──
t("citation in a Session log section -> not scanned (append-only history)", () => {
  const docs = [{ path: "tr.md", text: "# Epic\n\n## Session log\n- 2026-01-01 β DECIDE B/0.9 (msg_id gone111) done." }];
  const betaEventsText = beta([{ type: "beta-verdict", msg_id: "other" }]);
  const r = evaluate({ docs, betaEventsText });
  assert.strictEqual(r.hard.length, 0, "history citation must not be a hard finding");
  assert.strictEqual(r.scannedCitations, 0);
});

// ── 5. absent betaEvents (null) -> skip ──
t("null betaEventsText -> skip (gitignored ledger absent)", () => {
  const docs = [{ path: "a.md", text: "β DECIDE B/0.9 (msg_id z) x." }];
  const r = evaluate({ docs, betaEventsText: null });
  assert.strictEqual(r.skip, true);
  assert.strictEqual(r.hard.length, 0);
});

// ── 6. malformed betaEvents row -> skipped, good rows still resolve ──
t("malformed betaEvents line -> skipped, resolution still works", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id good1) x." }];
  const betaEventsText = "{bad json\n" + ev({ type: "beta-verdict", msg_id: "good1" });
  const r = evaluate({ docs, betaEventsText });
  assert.strictEqual(r.hard.length, 0, "good row should resolve despite a malformed sibling");
});

// ── 7. non-citation line -> not scanned ──
t("a line mentioning beta without a verdict token -> not a citation", () => {
  const docs = [{ path: "a.md", text: "The beta teammate is persistent. Nothing decided here." }];
  const r = evaluate({ docs, betaEventsText: beta([{ msg_id: "q" }]) });
  assert.strictEqual(r.scannedCitations, 0);
  assert.strictEqual(r.hard.length + r.soft.length, 0);
});

// ── 8. a generic betaEvents row (no type) with a msg_id still resolves a receipt ──
t("generic betaEvents row (no type) with msg_id resolves a citation receipt", () => {
  const docs = [{ path: "a.md", text: "β DECIDE B/0.88 (msg_id g5) ship." }];
  const betaEventsText = beta([{ msg_id: "g5", data: {} }]); // no type field
  const r = evaluate({ docs, betaEventsText });
  assert.strictEqual(r.hard.length, 0, "a msg_id present on any row resolves the receipt");
});

// ── 9. verdictMsgIds indexes msg_ids array ──
t("verdictMsgIds indexes a top-level msg_ids array", () => {
  const set = verdictMsgIds(beta([{ type: "beta-verdict", msg_ids: ["a", "b"] }]));
  assert.ok(set.has("a") && set.has("b"));
});

// ── 10. CONTROL: live corpus — every HARD finding is genuinely unresolved (invariant, not a count) ──
t("CONTROL: live docs+betaEvents — no HARD finding whose msg_id is actually present", () => {
  const fs = require("fs"), path = require("path");
  const root = path.join(__dirname, "..", "..");
  const be = path.join(root, ".claude", "agents", "president", "_system", "beta", "events.jsonl");
  let betaEventsText; try { betaEventsText = fs.readFileSync(be, "utf8"); } catch { console.log("        (betaEvents absent — skipped)"); return; }
  const known = verdictMsgIds(betaEventsText);
  // gather ADRs + ROADMAP as the live corpus
  const docs = [];
  const adrDir = path.join(root, ".claude", "agents", "president", "_system", "policy", "adr");
  try { for (const n of fs.readdirSync(adrDir)) if (/\.md$/.test(n)) docs.push({ path: n, text: fs.readFileSync(path.join(adrDir, n), "utf8") }); } catch {}
  try { docs.push({ path: "ROADMAP.md", text: fs.readFileSync(path.join(root, "ROADMAP.md"), "utf8") }); } catch {}
  const r = evaluate({ docs, betaEventsText });
  for (const f of r.hard) assert.ok(!known.has(f.msg_id), `HARD finding msg_id ${f.msg_id} is actually present — false positive`);
  assert.ok(Array.isArray(r.hard) && Array.isArray(r.soft));
});

console.log("");
console.log(pass + "/" + (pass + fail) + " passed" + (fail ? " (" + fail + " FAILED)" : ""));
process.exit(fail ? 1 : 0);
