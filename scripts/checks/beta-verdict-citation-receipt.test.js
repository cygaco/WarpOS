"use strict";
/**
 * Sealed-fixture test for beta-verdict-citation-receipt.js (ED-239). Pure evaluate() driven by
 * injected docs + betaEvents text — no disk. Gauntlet-hardened r1: F1-F6 teeth (gpt qa/backend/
 * security FAIL'd r0 for false-green paths — each now has a planted-violation RED case).
 */
const assert = require("assert");
const { evaluate, verdictMsgIds, isVerdictRow, historyMask, gatherDocs, DISCLAIMER } = require("./beta-verdict-citation-receipt");

let pass = 0, fail = 0;
function t(desc, fn) {
  try { fn(); console.log("  PASS  " + desc); pass++; }
  catch (e) { console.error("  FAIL  " + desc + "\n        " + e.message); fail++; }
}
const ev = (o) => JSON.stringify(o);
const beta = (rows) => rows.map(ev).join("\n");
// A QUALIFIED verdict row = recognized type + a real decision (F1). Helper for fixtures.
const vrow = (msg_id, extra = {}) => ({ type: "beta-verdict", decision: "DECIDE", msg_id, ...extra });

// ── 1. citation with a RESOLVING msg_id (qualified verdict row) -> clean ──
t("citation citing a msg_id on a qualified verdict row -> no finding", () => {
  const docs = [{ path: "adr/1.md", text: "We proceed. β DECIDE B/0.92 (design->build, msg_id abc123def) SHIP." }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("abc123def")]) });
  assert.strictEqual(r.hard.length, 0);
  assert.strictEqual(r.soft.length, 0);
  assert.strictEqual(r.scannedCitations, 1);
});

// ── 2. citation with an UNRESOLVED msg_id -> HARD ──
t("citation citing a msg_id NOT in betaEvents -> hard finding", () => {
  const docs = [{ path: "adr/2.md", text: "β DIRECTIVE (msg_id ghost999) do X." }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000", { decision: "DIRECTIVE" })]) });
  assert.strictEqual(r.hard.length, 1, "unresolved receipt must be hard");
  assert.strictEqual(r.hard[0].msg_id, "ghost999");
});

// ── 3. citation with NO msg_id -> SOFT ──
t("load-bearing citation with no msg_id -> soft advisory only", () => {
  const docs = [{ path: "adr/3.md", text: "β ruled we ship it." }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("x1abc")]) });
  assert.strictEqual(r.hard.length, 0);
  assert.strictEqual(r.soft.length, 1);
});

// ── 4. citation inside a Session log HISTORY section -> skipped ──
t("citation in a Session log section (at doc end) -> not scanned", () => {
  const docs = [{ path: "tr.md", text: "# Epic\n\n## Session log\n- 2026-01-01 β DECIDE B/0.9 (msg_id gone111) done." }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("other0")]) });
  assert.strictEqual(r.hard.length, 0, "history citation must not be a hard finding");
  assert.strictEqual(r.scannedCitations, 0);
});

// ── 5. absent betaEvents (null) -> skip ──
t("null betaEventsText -> skip (gitignored ledger absent)", () => {
  const r = evaluate({ docs: [{ path: "a.md", text: "β DECIDE B/0.9 (msg_id zzz111) x." }], betaEventsText: null });
  assert.strictEqual(r.skip, true);
  assert.strictEqual(r.hard.length, 0);
});

// ── 6. malformed betaEvents row -> skipped, good rows still resolve ──
t("malformed betaEvents line -> skipped, resolution still works", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id good111) x." }];
  const r = evaluate({ docs, betaEventsText: "{bad json\n" + ev(vrow("good111")) });
  assert.strictEqual(r.hard.length, 0, "good row should resolve despite a malformed sibling");
});

// ── 7. non-citation line -> not scanned ──
t("a line mentioning beta without a verdict token -> not a citation", () => {
  const docs = [{ path: "a.md", text: "The beta teammate is persistent. Nothing decided here." }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("q12345")]) });
  assert.strictEqual(r.scannedCitations, 0);
  assert.strictEqual(r.hard.length + r.soft.length, 0);
});

// ── F1 (HIGH, r0 false-green): a GENERIC/typeless row does NOT provide a receipt -> HARD ──
t("F1: forged GENERIC (typeless) betaEvents row sharing the cited id does NOT resolve -> HARD", () => {
  const docs = [{ path: "a.md", text: "β DECIDE B/0.88 (msg_id forged1) ship." }];
  const r = evaluate({ docs, betaEventsText: beta([{ id: "e1", cat: "log", msg_id: "forged1", data: {} }]) });
  assert.strictEqual(r.hard.length, 1, "a generic row must not satisfy a verdict-row receipt");
  assert.strictEqual(r.hard[0].msg_id, "forged1");
});

// ── F1: a request-shaped beta-consult (no decision/verdict) does NOT resolve -> HARD ──
t("F1: request-shaped beta-consult (no decision) does not resolve -> HARD", () => {
  const docs = [{ path: "a.md", text: "β DIRECTIVE (msg_id req0001) x." }];
  const r = evaluate({ docs, betaEventsText: beta([{ type: "beta-consult", msg_id: "req0001" }]) });
  assert.strictEqual(r.hard.length, 1, "a consult request (no verdict payload) is not a verdict row");
});

// ── F1: isVerdictRow classifier ──
t("F1: isVerdictRow — type+decision OR type+verdict qualifies; type-only / generic / pending does not", () => {
  assert.ok(isVerdictRow({ type: "beta-consult", decision: "DECIDE" }));
  assert.ok(isVerdictRow({ type: "beta-verdict", verdict: "fail" }));
  assert.ok(!isVerdictRow({ type: "beta-verdict" }), "type without a decision/verdict is not qualified");
  assert.ok(!isVerdictRow({ type: "design-boundary-consult", verdict: "pending" }), "pending verdict is not a rendered verdict");
  assert.ok(!isVerdictRow({ id: "e", cat: "log" }), "generic logger row is not a verdict");
});

// ── F2 (HIGH): a SHORT unresolved msg_id is HARD, not downgraded to SOFT ──
t("F2: short msg_id (<6 chars) that does not resolve -> HARD (not SOFT)", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id ab1) x." }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("zzzzzz")]) });
  assert.strictEqual(r.hard.length, 1, "a short unresolved receipt must be HARD");
  assert.strictEqual(r.soft.length, 0);
  assert.strictEqual(r.hard[0].msg_id, "ab1");
});
t("F2: short msg_id that DOES resolve on a qualified row -> clean", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id ab1) x." }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("ab1")]) });
  assert.strictEqual(r.hard.length + r.soft.length, 0);
});

// ── F3 (HIGH): a Markdown-backticked msg_id token is parsed ──
t("F3: backticked `msg_id` token unresolved -> HARD (not misread as no-receipt SOFT)", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id `bt12345`) x." }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("other0")]) });
  assert.strictEqual(r.hard.length, 1, "backticked receipt must be parsed as a receipt -> HARD when unresolved");
  assert.strictEqual(r.hard[0].msg_id, "bt12345");
});

// ── F4 (HIGH): punctuation separator (`β: DECIDE`) is scanned ──
t("F4: `β: DECIDE` punctuation-separated citation is scanned", () => {
  const docs = [{ path: "a.md", text: "β: DECIDE (msg_id punc111) x." }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("resolved0")]) });
  assert.strictEqual(r.scannedCitations, 1, "punctuation separator must not bypass the scanner");
  assert.strictEqual(r.hard.length, 1);
});

// ── F4 (HIGH): an ACTIVE section after a MID-document history heading is NOT truncated ──
t("F4: active section after a mid-doc Session log heading IS scanned (section-bounded skip)", () => {
  const text = [
    "# Epic", "",
    "## Session log", "- 2026-01-01 β DECIDE (msg_id hist111) done.", "",
    "## Current status", "β DECIDE (msg_id active99) needs a receipt.",
  ].join("\n");
  const r = evaluate({ docs: [{ path: "tr.md", text }], betaEventsText: beta([vrow("resolved0")]) });
  assert.strictEqual(r.hard.length, 1, "the active section after the history section must be scanned");
  assert.strictEqual(r.hard[0].msg_id, "active99");
});
t("F4: historyMask bounds the section to its own heading level", () => {
  const lines = ["# A", "## Session log", "- x", "## Peer", "y"];
  assert.deepStrictEqual(historyMask(lines), [false, true, true, false, false]);
});

// ── F5 (fail-closed gather): ENOENT is not an error; shape is {docs, errors} ──
t("F5: gatherDocs on an absent dir -> no error (ENOENT ok), returns {docs, errors} shape", () => {
  const g = gatherDocs([require("path").join(__dirname, "__no_such_dir__")], []);
  assert.ok(Array.isArray(g.docs) && Array.isArray(g.errors));
  assert.strictEqual(g.errors.length, 0, "an absent (ENOENT) dir is not a fail-closed error");
});

// ── F1 regression: generic row (no type) no longer resolves (was a r0 false-green) ──
t("F1 regression: generic row (no type) no longer resolves a citation receipt", () => {
  const docs = [{ path: "a.md", text: "β DECIDE B/0.88 (msg_id g5xxxx) ship." }];
  const r = evaluate({ docs, betaEventsText: beta([{ msg_id: "g5xxxx", data: {} }]) });
  assert.strictEqual(r.hard.length, 1, "a type-less generic row must NOT provide a receipt (F1 false-green closed)");
});

// ── verdictMsgIds indexes a msg_ids array ONLY from a qualified verdict row ──
t("verdictMsgIds indexes a msg_ids array from a qualified verdict row; ignores an unqualified one", () => {
  const q = verdictMsgIds(beta([{ type: "beta-verdict", decision: "DECIDE", msg_ids: ["aa11", "bb22"] }]));
  assert.ok(q.has("aa11") && q.has("bb22"));
  const uq = verdictMsgIds(beta([{ type: "beta-verdict", msg_ids: ["cc33"] }]));
  assert.ok(!uq.has("cc33"), "an unqualified row's msg_ids must not be indexed");
});

// ── F6 / Q1(b): the ED-275 ceiling disclaimer is present + names the boundary ──
t("Q1(b)/F6: DISCLAIMER discloses receipt-present-not-authenticated + ED-275", () => {
  assert.ok(typeof DISCLAIMER === "string" && /not authenticated/i.test(DISCLAIMER) && /ED-275/.test(DISCLAIMER));
});

// ── CONTROL: live corpus — every HARD finding is genuinely unresolved (invariant, not a count) ──
t("CONTROL: live docs+betaEvents — no HARD finding whose msg_id is actually present", () => {
  const fs = require("fs"), path = require("path");
  const root = path.join(__dirname, "..", "..");
  const be = path.join(root, ".claude", "agents", "president", "_system", "beta", "events.jsonl");
  let betaEventsText; try { betaEventsText = fs.readFileSync(be, "utf8"); } catch { console.log("        (betaEvents absent — skipped)"); return; }
  const known = verdictMsgIds(betaEventsText);
  const docs = [];
  const adrDir = path.join(root, ".claude", "agents", "president", "_system", "policy", "adr");
  try { for (const n of fs.readdirSync(adrDir)) if (/\.md$/.test(n)) docs.push({ path: n, text: fs.readFileSync(path.join(adrDir, n), "utf8") }); } catch {}
  try { docs.push({ path: "ROADMAP.md", text: fs.readFileSync(path.join(root, "ROADMAP.md"), "utf8") }); } catch {}
  const r = evaluate({ docs, betaEventsText });
  for (const f of r.hard) assert.ok(!known.has(f.msg_id), `HARD finding msg_id ${f.msg_id} is actually present — false positive`);
  assert.ok(Array.isArray(r.hard) && Array.isArray(r.soft));
});

// ── C2 (gpt backend r1, HIGH — per-line receipt laundering): two citations on ONE line ──
t("C2: resolving citation #1 does NOT launder an unreceipted citation #2 on the same line", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id good111) then β DIRECTIVE with no receipt here" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("good111")]) });
  assert.strictEqual(r.scannedCitations, 2, "two citations scanned per-citation, not per-line");
  assert.strictEqual(r.hard.length, 0, "the first resolves");
  assert.strictEqual(r.soft.length, 1, "the second (no receipt) is SOFT — not laundered by the first");
});
t("C2: an unrelated msg_id EARLIER on the line does not satisfy a later receiptless citation", () => {
  const docs = [{ path: "a.md", text: "aside msg_id good111 mentioned; β DIRECTIVE needs its own receipt" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("good111")]) });
  assert.strictEqual(r.hard.length, 0);
  assert.strictEqual(r.soft.length, 1, "the citation's own clause has no msg_id -> SOFT");
});
t("C2: two UNRESOLVED citations on one line -> both HARD (each scanned)", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id ghost1) and β DIRECTIVE (msg_id ghost2)" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 2, "both unresolved citations are HARD");
});

// ── C1 (gpt qa+backend r1, HIGH — F5 explicit-files): injected-fs error-path teeth ──
t("C1: a present-but-UNREADABLE explicit file (EACCES) -> fail-closed gather error", () => {
  const io = {
    readFileSync: () => { const e = new Error("EACCES"); e.code = "EACCES"; throw e; },
    readdirSync: () => { const e = new Error("ENOENT"); e.code = "ENOENT"; throw e; },
  };
  const g = gatherDocs([], ["/x/ROADMAP.md"], io);
  assert.strictEqual(g.errors.length, 1, "an unreadable explicit file must be a fail-closed error, not silently omitted");
});
t("C1: an ABSENT explicit file (ENOENT) -> NOT an error (skipped)", () => {
  const io = { readFileSync: () => { const e = new Error("ENOENT"); e.code = "ENOENT"; throw e; }, readdirSync: () => [] };
  const g = gatherDocs([], ["/x/ROADMAP.md"], io);
  assert.strictEqual(g.errors.length, 0, "ENOENT (absent) is fine, not fail-closed");
});

console.log("");
console.log(pass + "/" + (pass + fail) + " passed" + (fail ? " (" + fail + " FAILED)" : ""));
process.exit(fail ? 1 : 0);
