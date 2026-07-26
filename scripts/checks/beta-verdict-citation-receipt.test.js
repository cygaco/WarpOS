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

// ── R1 (gpt security+backend r2, HIGH): intra-clause laundering — validate ALL msg_ids in a clause ──
t("R1: a clause with a resolving-first AND an unresolved-second msg_id -> HARD (not laundered)", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id good111) (msg_id ghost222) ship" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("good111")]) });
  assert.strictEqual(r.hard.length, 1, "the unresolved second receipt in the same clause must be HARD");
  assert.strictEqual(r.hard[0].msg_id, "ghost222");
});
t("R1: a clause where ALL msg_ids resolve -> clean", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id good111) (msg_id good222) ship" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("good111"), vrow("good222")]) });
  assert.strictEqual(r.hard.length + r.soft.length, 0);
});

// ── R2 (gpt security r2, HIGH): markdown emphasis must NOT bypass citation detection ──
t("R2: '**β** **DECIDE**' (emphasis on each token) with an unresolved receipt -> HARD", () => {
  const docs = [{ path: "a.md", text: "**β** **DECIDE** (msg_id ghost1) shipped" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "markdown emphasis between tokens must not bypass detection");
});
t("R2: a backticked citation '`β DECIDE`' with an unresolved receipt -> HARD", () => {
  const docs = [{ path: "a.md", text: "`β DECIDE` (msg_id ghost2) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "a backticked citation must be detected");
});
t("R2: an underscore-bearing msg_id is NOT corrupted (we do not strip '_')", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id ab_cd_ef) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("ab_cd_ef")]) });
  assert.strictEqual(r.hard.length + r.soft.length, 0, "'_' preserved so an underscore msg_id still resolves");
});

// ── R2-hunter r3 (HIGH — underscore-italic + zero-width bypass): each must be DETECTED, not evaded ──
for (const [label, text] of [
  ["_β_ _DECIDE_", "We ship because _β_ _DECIDE_ (msg_id ghosthit) approved it"],
  ["_β DECIDE_", "note: _β DECIDE_ (msg_id ghosthit) here"],
  ["__β__ __DECIDE__", "__β__ __DECIDE__ (msg_id ghosthit) x"],
  ["mixed *_β_* *_DECIDE_*", "*_β_* *_DECIDE_* (msg_id ghosthit) y"],
  ["zero-width bypass", String.fromCharCode(0x200b) + "β" + String.fromCharCode(0x200b) + "DECIDE (msg_id ghosthit) z"],
]) {
  t(`R2-hunter: '${label}' with an UNRESOLVED receipt -> HARD (emphasis/zero-width cannot hide a citation)`, () => {
    const r = evaluate({ docs: [{ path: "a.md", text }], betaEventsText: beta([vrow("real000")]) });
    assert.strictEqual(r.hard.length, 1, `'${label}' must be detected + HARD, not evaded`);
    assert.strictEqual(r.hard[0].msg_id, "ghosthit");
  });
}
t("R2-hunter: underscore-italic citation with a RESOLVING underscore msg_id -> clean (id not corrupted)", () => {
  const r = evaluate({ docs: [{ path: "a.md", text: "_β_ _DECIDE_ (msg_id ab_cd_ef) ok" }], betaEventsText: beta([vrow("ab_cd_ef")]) });
  assert.strictEqual(r.hard.length + r.soft.length, 0, "detection strips '_' but extraction preserves it");
});

// ── β G2 (r4, class-covering teeth — NOVEL variants beyond the hunter's underscore/zero-width report) ──
t("G2 novel: strikethrough '~~β~~ ~~DECIDE~~' with an unresolved receipt -> HARD (structural class closes ~)", () => {
  const r = evaluate({ docs: [{ path: "a.md", text: "~~β~~ ~~DECIDE~~ (msg_id ghosthit) x" }], betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "strikethrough emphasis must not hide a citation");
  assert.strictEqual(r.hard[0].msg_id, "ghosthit");
});
t("G2 homoglyph: a mathematical β (U+1D6FD) is folded to β -> detected -> HARD", () => {
  const mathBeta = String.fromCodePoint(0x1D6FD);
  const r = evaluate({ docs: [{ path: "a.md", text: mathBeta + " DECIDE (msg_id ghosthit) x" }], betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "a β-homoglyph must be folded to β and detected");
});
t("G2 homoglyph: the Greek beta symbol (ϐ U+03D0) is folded -> HARD", () => {
  const r = evaluate({ docs: [{ path: "a.md", text: String.fromCharCode(0x03D0) + " DIRECTIVE (msg_id ghosthit) y" }], betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1);
});
t("G2 benign-adjacent GREEN: emphasis-heavy prose with NO verdict token is not a citation", () => {
  const r = evaluate({ docs: [{ path: "a.md", text: "The *beta* release is _ready_ and ~~stable~~; nothing decided." }], betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.scannedCitations, 0, "emphasis around 'beta' with no verdict token is not a citation");
  assert.strictEqual(r.hard.length + r.soft.length, 0);
});

// ── ED-286 (β DECIDE B/0.90 msg_id f1a4d7c9): MECHANISM class-closure — hunter-prescribed planted REDs ──
// The r4 halt (byte-confirmed by β): normalizeForDetection folded \p{Cf} + emphasis + 6 β-homoglyphs but
// (1) MISSED \p{M} combining marks incl. the INVISIBLE U+034F CGJ; (2) gave the DECISION-token half of
// CITATION_RE zero defense; (3) missed non-\s blank separators (U+2800/U+3164); (4) its per-code-point
// index map DESYNCED after any astral char (a false-green). The NFKD-skeleton mechanism closes all four.
const cgj = String.fromCodePoint(0x034F);          // U+034F COMBINING GRAPHEME JOINER — invisible, \p{M} (NOT \p{Cf})
const acute = String.fromCodePoint(0x0301);        // U+0301 COMBINING ACUTE — a visible combining mark
const eAcute = String.fromCodePoint(0x00C9);       // U+00C9 precomposed É (NFKD -> E + U+0301, then mark-stripped)
const braille = String.fromCodePoint(0x2800);      // U+2800 BRAILLE PATTERN BLANK — non-\s blank separator
const hangulFiller = String.fromCodePoint(0x3164); // U+3164 HANGUL FILLER — non-\s blank separator
const fwDECIDE = [0xFF24, 0xFF25, 0xFF23, 0xFF29, 0xFF24, 0xFF25].map((c) => String.fromCodePoint(c)).join(""); // fullwidth ＤＥＣＩＤＥ
const emoji = String.fromCodePoint(0x1F600);       // an astral (supplementary-plane) char — 2 UTF-16 units

t("ED-286 #1: INVISIBLE U+034F CGJ inside the decision token ('β D<CGJ>ECIDE') -> HARD (not evaded)", () => {
  const docs = [{ path: "a.md", text: "β D" + cgj + "ECIDE (msg_id ghostcgj) shipped" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "an invisible combining mark (\\p{M}) inside DECIDE must not hide the citation");
  assert.strictEqual(r.hard[0].msg_id, "ghostcgj");
});
t("ED-286 #1b: INVISIBLE U+034F CGJ as the β<->DECIDE separator -> HARD", () => {
  const docs = [{ path: "a.md", text: "β" + cgj + "DECIDE (msg_id ghostcgj2) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "an invisible \\p{M} separator (optional-separator regex) must not evade");
  assert.strictEqual(r.hard[0].msg_id, "ghostcgj2");
});
t("ED-286 #2: VISIBLE combining mark on the decision token ('β DE<U+0301>CIDE') -> HARD", () => {
  const docs = [{ path: "a.md", text: "β DE" + acute + "CIDE (msg_id ghostacc) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "a combining accent on the decision token must be stripped, not evaded");
  assert.strictEqual(r.hard[0].msg_id, "ghostacc");
});
t("ED-286 #2b: PRECOMPOSED accent on the decision token ('β DÉCIDE' U+00C9) -> HARD (NFKD decomposes then strips)", () => {
  const docs = [{ path: "a.md", text: "β D" + eAcute + "CIDE (msg_id ghostpre) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "a precomposed accent must NFKD-decompose then mark-strip, not evade");
});
t("ED-286 #2c: BOTH HALVES — homoglyph DECISION token (fullwidth ＤＥＣＩＤＥ) -> HARD (r4 defended only β)", () => {
  const docs = [{ path: "a.md", text: "β " + fwDECIDE + " (msg_id ghostfw) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "the DECISION-token half must be homoglyph-folded too (single NFKD pass, both halves)");
  assert.strictEqual(r.hard[0].msg_id, "ghostfw");
});
t("ED-286 #3: non-\\s BLANK separator U+2800 BRAILLE BLANK ('β<U+2800>DECIDE') -> HARD", () => {
  const docs = [{ path: "a.md", text: "β" + braille + "DECIDE (msg_id ghostbrl) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "a blank-rendering non-\\s separator must not evade the separator class");
  assert.strictEqual(r.hard[0].msg_id, "ghostbrl");
});
t("ED-286 #3b: non-\\s BLANK separator U+3164 HANGUL FILLER -> HARD", () => {
  const docs = [{ path: "a.md", text: "β" + hangulFiller + "DIRECTIVE (msg_id ghosthan) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1);
  assert.strictEqual(r.hard[0].msg_id, "ghosthan");
});
t("ED-286 #4: UTF-16 index-map — ASTRAL char(s) BEFORE an unresolved-receipt citation stay HARD (no desync)", () => {
  const docs = [{ path: "a.md", text: emoji + " and " + emoji + " β DECIDE (msg_id ghostast) ship" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "an astral char must not desync the raw-clause map (the r4 false-green)");
  assert.strictEqual(r.hard[0].msg_id, "ghostast", "the correct msg_id must be sliced from the raw clause after an astral char");
});
t("ED-286 #4b: UTF-16 index-map — astral char before a RESOLVING citation stays clean (map slices right id)", () => {
  const docs = [{ path: "a.md", text: emoji + " β DECIDE (msg_id good_astral) ship" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("good_astral")]) });
  assert.strictEqual(r.hard.length + r.soft.length, 0, "the astral-aligned map must slice the resolving id correctly");
});
t("ED-286 #4c: astral char INSIDE the clause between citation and its receipt -> id still extracted (HARD)", () => {
  const docs = [{ path: "a.md", text: "β DECIDE " + emoji + " (msg_id ghostmid) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1);
  assert.strictEqual(r.hard[0].msg_id, "ghostmid");
});
// DISCLOSED-CEILING documentation (P-059, residual (a)): NFKD does NOT fold CROSS-SCRIPT confusables.
// This test CODIFIES the honest residual — a Cyrillic-spoofed decision token is NOT detected. If a future
// change adds a Unicode TR39 confusables skeleton, this test SHOULD flip (that is the self-detecting
// trigger for the ceiling, not a hunter finding next round). See NORMALIZATION CEILING (a) in the enforcer.
t("ED-286 ceiling (a): a CROSS-SCRIPT (Cyrillic) confusable is the DISCLOSED, un-closed residual (documented)", () => {
  const cyrDIRECTIVE = "DIR" + String.fromCodePoint(0x0415) + "CTIV" + String.fromCodePoint(0x0415); // Cyrillic Е U+0415
  const docs = [{ path: "a.md", text: "β " + cyrDIRECTIVE + " (msg_id wouldbeghost) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 0, "cross-script confusables are the DISCLOSED ceiling (needs TR39) — NORMALIZATION CEILING (a)");
  assert.strictEqual(r.scannedCitations, 0, "the spoofed decision token is not NFKD-folded to ASCII, so no citation matches");
});
t("ED-286: benign astral-heavy prose with NO verdict token is still not a citation (no over-match)", () => {
  const docs = [{ path: "a.md", text: emoji + " the beta build " + emoji + " is ready; nothing decided." }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.scannedCitations, 0);
  assert.strictEqual(r.hard.length + r.soft.length, 0);
});

// ── ED-286 gauntlet r5 (hunter HIGH — RECEIPT-path normalization asymmetry): a blank/invisible
//    separator between the `msg_id` label and its id must NOT downgrade a forged receipt HARD->SOFT.
//    The detection path folds these; the extraction path now does too (BLANK_G + RECEIPT_SEP_INVIS_G). ──
const hfiller = String.fromCodePoint(0x1160); // HANGUL JUNGSEONG FILLER
const cfiller = String.fromCodePoint(0x115F); // HANGUL CHOSEONG FILLER
const hwfiller = String.fromCodePoint(0xFFA0); // HALFWIDTH HANGUL FILLER
const zwsp = String.fromCodePoint(0x200B); // ZERO WIDTH SPACE (\p{Cf})
for (const [label, sep] of [
  ["U+2800 BRAILLE BLANK", braille],
  ["U+3164 HANGUL FILLER", hangulFiller],
  ["U+1160 JUNGSEONG FILLER", hfiller],
  ["U+115F CHOSEONG FILLER", cfiller],
  ["U+FFA0 HALFWIDTH FILLER", hwfiller],
  ["U+200B ZWSP (invisible)", zwsp],
  ["U+034F CGJ (invisible)", cgj],
]) {
  t(`ED-286 r5: '${label}' as the msg_id->id separator with a FORGED id -> HARD (no HARD->SOFT downgrade)`, () => {
    const docs = [{ path: "a.md", text: "β DECIDE (msg_id" + sep + "ghost999) shipped" }];
    const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
    assert.strictEqual(r.hard.length, 1, `'${label}' separator must not downgrade a forged receipt to SOFT`);
    assert.strictEqual(r.hard[0].msg_id, "ghost999");
  });
}
t("ED-286 r5: a blank-separated RESOLVING receipt stays clean (fix does not corrupt resolution)", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id" + braille + "abc123def) ship" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("abc123def")]) });
  assert.strictEqual(r.hard.length + r.soft.length, 0, "a blank-separated id that resolves must be clean");
});
t("ED-286 r5: an invisible INSIDE the msg_id label (single obfuscation) -> HARD (repaired by strip)", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg" + zwsp + "_id ghost999) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "an invisible inside the label must be stripped, not evade");
  assert.strictEqual(r.hard[0].msg_id, "ghost999");
});
t("ED-286 r5: a legit `msg_ids` array mention is NOT a false-positive HARD (label boundary is precise)", () => {
  const docs = [{ path: "a.md", text: "β DECIDE about msg_ids: [aa11, bb22] here" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 0, "`msg_ids` (ASCII s after the label) must not extract a spurious receipt");
});
// DISCLOSED-CEILING (e): a DOUBLE-obfuscated receipt (invisible in the label AND an invisible separator)
// collapses to an abutment indistinguishable from `msg_ids` -> stays SOFT. Renders as "msg_idghost" (no
// visible space), so it does NOT read as a valid receipt. Codified so the residual is self-detecting.
t("ED-286 ceiling (e): DOUBLE-obfuscated receipt (invisible-in-label + invisible-sep) is the DISCLOSED residual (SOFT)", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg" + zwsp + "_id" + zwsp + "ghost999) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 0, "the double-obfuscation compound is the disclosed ceiling (e) — abuts to msg_idghost");
  assert.strictEqual(r.soft.length, 1, "it is a receiptless SOFT (renders as no-space, not a convincing receipt)");
});
// DISCLOSED-CEILING (a) at the RECEIPT-LABEL position (r5 hunter MEDIUM): a cross-script confusable in
// the literal `msg_id` label is NFKD-invariant, so MSGID_IN_TEXT_RE misses it and a forged receipt
// downgrades HARD->SOFT — the SAME TR39 root as a confusable in a detection token. Codified so it flips
// if a TR39 skeleton is ever added. (Cyrillic-i U+0456 renders pixel-identical to the Latin "msg_id".)
t("ED-286 ceiling (a)/label: a CROSS-SCRIPT confusable in the msg_id LABEL is the DISCLOSED TR39 residual (SOFT)", () => {
  const cyrI = String.fromCodePoint(0x0456); // CYRILLIC SMALL LETTER BYELORUSSIAN-UKRAINIAN I
  const docs = [{ path: "a.md", text: "β DECIDE (msg_" + cyrI + "d ghost999) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 0, "a confusable in the label is the disclosed TR39 ceiling (a) — not folded by NFKD");
  assert.strictEqual(r.soft.length, 1, "the citation is detected (ASCII DECIDE) but the confusable label yields no receipt -> SOFT");
});
// r5 hunter LOW (RECEIPT_SEP_INVIS_G lookahead): a bare \p{M}/\p{Cf} after the literal `msg_id` with NO
// following id-token must NOT synthesize a separator + extract a spurious receipt.
t("ED-286 r5: a combining mark after `msg_id` with no following id -> no synthesized false receipt", () => {
  const acuteMark = String.fromCodePoint(0x0301);
  const docs = [{ path: "a.md", text: "β DECIDE — the msg_id" + acuteMark + ". field is set later" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 0, "a mark with no following id must not synthesize a separator (lookahead)");
});

// ── FALSE-POSITIVE direction of the OPTIONAL separator (lead ask): the `*` quantifier widens match
//    ACCEPTANCE (a zero-separator concatenation now matches, to catch invisible-removed separators).
//    Confirm the widening is BOUNDED — a benign `beta`-adjacent NON-citation must stay unscanned. These
//    flip RED if the acceptance ever over-widens (the quiet-regression side hunters don't probe). ──
for (const [label, text] of [
  ["'beta version' (adjacent non-token word)", "the beta version ships Friday; nothing decided"],
  ["'beta-tested' (hyphen sep + non-token)", "the decision was beta-tested by users"],
  ["'betaVerdict' identifier (case-sensitive: capital V != verdict)", "const betaVerdict = getVerdict();"],
  ["'β' then a NON-adjacent verdict word", "the β release was, eventually, approved by ops much later"],
]) {
  t(`ED-286 false-positive GREEN: ${label} is NOT a citation (optional-separator acceptance is bounded)`, () => {
    const r = evaluate({ docs: [{ path: "a.md", text }], betaEventsText: beta([vrow("real000")]) });
    assert.strictEqual(r.scannedCitations, 0, `${label} must not accidentally match as a citation`);
    assert.strictEqual(r.hard.length + r.soft.length, 0);
  });
}
t("ED-286 positive control: a GENUINE concatenated 'βDECIDE' (invisible-removed origin) IS scanned", () => {
  // The reason the separator is optional — an invisible that normalized to "" leaves the tokens adjacent.
  const r = evaluate({ docs: [{ path: "a.md", text: "the βDECIDE (msg_id ghostcat) was final" }], betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "a genuine adjacent citation with an unresolved receipt must still be HARD");
  assert.strictEqual(r.hard[0].msg_id, "ghostcat");
});
// ── β design→build focus (msg_id 562ba5b6): astral char BOTH before the citation AND after the msg_id,
//    to prove the per-UTF-16-unit index map keeps raw.slice aligned across the whole clause (the r4
//    false-green locus). (The precomposed-accent decision token 'β DÉCIDE' U+00C9 is ED-286 #2b above —
//    the exact case the NFKC prescription would have missed and NFKD+strip folds HARD.) ──
t("ED-286 β-focus: astral chars BOTH before the citation AND after the msg_id -> HARD, correct id", () => {
  // Astral chars SURROUND the receipt (before the citation + after the id) — the r4 index-map desync
  // locus. The msg_id->id separator itself is a clean space (a visible astral char between label and id
  // renders visibly and is not a covert receipt — out of scope; see ceiling). Proves raw.slice stays
  // aligned across a clause with supplementary-plane chars on both sides.
  const docs = [{ path: "a.md", text: emoji + " note " + emoji + " β DECIDE (msg_id ghostb07) " + emoji + " " + emoji + " ship" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "astral chars around the clause must not desync the raw-clause map");
  assert.strictEqual(r.hard[0].msg_id, "ghostb07", "the id must slice correctly with astral chars on both sides");
});

// ── ED-286 gauntlet r6 (qa BINDING HIGH — \p{Cc} controls + non-\p{Cf} default-ignorables survived the
//    fold): the invisible class the NFKD skeleton strips is BROADER than \p{M}+\p{Cf}. On BOTH paths, a
//    \p{Cc} control (NUL/BEL/DEL) or a non-\p{Cf} default-ignorable (U+2065/U+FFF0/U+E0000) inside the
//    decision token must NOT hide the citation, and as the msg_id separator must NOT downgrade the receipt;
//    whitespace controls (TAB) map to a space separator. ──
const NUL = String.fromCodePoint(0x0000), BEL = String.fromCodePoint(0x0007), DEL = String.fromCodePoint(0x007F);
const di2065 = String.fromCodePoint(0x2065), diFFF0 = String.fromCodePoint(0xFFF0), diE0000 = String.fromCodePoint(0xE0000);
const TAB = String.fromCodePoint(0x0009);
for (const [label, ch] of [
  ["NUL U+0000", NUL], ["BEL U+0007", BEL], ["DEL U+007F", DEL],
  ["default-ignorable U+2065", di2065], ["default-ignorable U+FFF0", diFFF0], ["default-ignorable U+E0000", diE0000],
]) {
  t(`ED-286 r6: '${label}' INSIDE the decision token ('β D<x>ECIDE') -> HARD (citation not hidden)`, () => {
    const docs = [{ path: "a.md", text: "β D" + ch + "ECIDE (msg_id ghostr6) shipped" }];
    const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
    assert.strictEqual(r.hard.length, 1, `'${label}' in the token must be stripped so the citation is still detected`);
    assert.strictEqual(r.hard[0].msg_id, "ghostr6");
  });
  t(`ED-286 r6: '${label}' as the msg_id->id SEPARATOR -> HARD (receipt not downgraded)`, () => {
    const docs = [{ path: "a.md", text: "β DECIDE (msg_id" + ch + "ghostr6s)" }];
    const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
    assert.strictEqual(r.hard.length, 1, `'${label}' as the receipt separator must not downgrade HARD->SOFT`);
    assert.strictEqual(r.hard[0].msg_id, "ghostr6s");
  });
}
t("ED-286 r6: a whitespace CONTROL (TAB U+0009) as a separator maps to a space (both halves)", () => {
  const docs = [{ path: "a.md", text: "β" + TAB + "DECIDE (msg_id" + TAB + "ghosttab)" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "TAB (\\p{Cc} whitespace) must map to a space separator on both the citation and receipt");
  assert.strictEqual(r.hard[0].msg_id, "ghosttab");
});
t("ED-286 r6: a control/default-ignorable-obfuscated FORGED id de-obfuscates and stays HARD", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id gh" + NUL + "ost" + di2065 + "r6) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "invisible chars inside the id strip so the (unresolved) id is still extracted -> HARD");
});
t("ED-286 r6 GREEN: a control-obfuscated RESOLVING id de-obfuscates to the real id -> clean", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id ab" + NUL + "cd) ok" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("abcd")]) });
  assert.strictEqual(r.hard.length + r.soft.length, 0, "'ab<NUL>cd' must de-obfuscate to the resolving 'abcd'");
});

// ── ED-286 gauntlet r7 (security lane, 3 BINDING HIGHs) — the normalization-policy rework:
//    #1 bidi controls are DANGEROUS SYNTAX (HARD on presence); #2 the receipt-id PAYLOAD must be RAW
//    (a compat-fold/mark-strip that mints a ledger id = LAUNDERING → HARD); #3 all Unicode line breaks
//    split before historyMask (a U+2028/U+2029/lone-CR-hidden heading can't mask an active citation). ──
const RLO = String.fromCodePoint(0x202E), PDF = String.fromCodePoint(0x202C), RLI = String.fromCodePoint(0x2067), PDI = String.fromCodePoint(0x2069);
const LS = String.fromCodePoint(0x2028), PS = String.fromCodePoint(0x2029), CR = String.fromCodePoint(0x000D);
const fwReal000 = [0xFF52, 0xFF45, 0xFF41, 0xFF4C, 0xFF10, 0xFF10, 0xFF10].map((c) => String.fromCodePoint(c)).join(""); // ｒｅａｌ０００

// #1 BIDI — a logical "EDICED" wrapped in RLO..PDF renders "DECIDE" to a human; the scanner sees "EDICED"
//    (scanned=0) → the citation is HIDDEN. Bidi presence on a scanned line is a HARD finding.
t("ED-286 r7 #1: a BIDI override masking a citation ('β <RLO>EDICED<PDF>') -> HARD (dangerous syntax)", () => {
  const docs = [{ path: "a.md", text: "β " + RLO + "EDICED" + PDF + " (msg_id ghost999) shipped" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length >= 1, true, "a bidi override on a scanned line must be a HARD finding (a citation may be masked)");
  assert.ok(r.hard.some((h) => h.msg_id === null), "the bidi finding carries no msg_id (it is a dangerous-syntax flag, not a receipt finding)");
});
t("ED-286 r7 #1b: a BIDI isolate (RLI/PDI) present on a scanned line -> HARD", () => {
  const docs = [{ path: "a.md", text: "note " + RLI + "some text" + PDI + " here" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "bidi isolates are dangerous syntax too");
});
t("ED-286 r7 #1 GREEN: a normal RTL-free prose line has NO bidi finding (no over-flag)", () => {
  const docs = [{ path: "a.md", text: "The beta build is stable; nothing decided here." }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length + r.soft.length, 0, "a line with no bidi control must not be flagged");
});

// #2 RECEIPT-ID LAUNDERING — a compat-folded/mark-decorated id that folds INTO a ledger id must NOT resolve.
t("ED-286 r7 #2: a FULLWIDTH id (ｒｅａｌ０００) that NFKD-folds into the ledger id 'real000' -> HARD (laundered, not clean)", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id " + fwReal000 + ") ship" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "normalization must NOT mint a valid receipt from a fullwidth payload");
  assert.strictEqual(r.hard[0].msg_id, "real000");
});
t("ED-286 r7 #2b: an ACCENTED id (ŕeal000, r+combining acute) that mark-strips into 'real000' -> HARD (laundered)", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id " + "r" + String.fromCodePoint(0x0301) + "eal000) x" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "a mark-decorated id that folds to a ledger id must not resolve");
});
t("ED-286 r7 #2 GREEN: a genuine raw-ASCII id that resolves is NOT falsely laundered", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id real000) ok" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length + r.soft.length, 0, "a raw-ASCII id present verbatim must resolve clean");
});

// #3 LINE-SEPARATOR MASKING — a Unicode-line-break-hidden peer heading must still close a history section.
// r8 (hunter HIGH) added VT (U+000B) + FF (U+000C) — same UAX#14 mandatory-break class as LS/PS.
const VT = String.fromCodePoint(0x000B), FF = String.fromCodePoint(0x000C);
for (const [label, sep] of [["U+2028 LS", LS], ["U+2029 PS", PS], ["lone CR", CR], ["VT U+000B", VT], ["FF U+000C", FF]]) {
  t(`ED-286 r7/r8 #3: a '${label}'-hidden peer heading does NOT keep an active citation history-masked`, () => {
    const text = "# Epic\n## Session log\n- 2026-01-01 β DECIDE (msg_id hist1) done." + sep + "## Current status\nβ DECIDE (msg_id active99) needs a receipt.";
    const r = evaluate({ docs: [{ path: "tr.md", text }], betaEventsText: beta([vrow("real000")]) });
    assert.ok(r.hard.some((h) => h.msg_id === "active99"), `the active citation after a ${label}-hidden heading must be scanned (not masked)`);
    assert.ok(!r.hard.some((h) => h.msg_id === "hist1"), "the genuine history citation stays masked");
  });
}
// r8 (hunter LOW — position-anchored laundering): a fullwidth (laundered) cited id must NOT resolve just
// because a raw-ASCII twin appears ELSEWHERE in the same clause; the raw check is keyed to the label position.
t("ED-286 r8: a fullwidth cited id + a raw twin ELSEWHERE in the clause -> HARD (laundering not rescued by the twin)", () => {
  const docs = [{ path: "a.md", text: "β DECIDE (msg_id " + fwReal000 + ") also real000 mentioned here" }];
  const r = evaluate({ docs, betaEventsText: beta([vrow("real000")]) });
  assert.strictEqual(r.hard.length, 1, "the fullwidth cited receipt is laundered; a raw twin elsewhere must not launder it");
  assert.strictEqual(r.hard[0].msg_id, "real000");
});

console.log("");
console.log(pass + "/" + (pass + fail) + " passed" + (fail ? " (" + fail + " FAILED)" : ""));
process.exit(fail ? 1 : 0);
