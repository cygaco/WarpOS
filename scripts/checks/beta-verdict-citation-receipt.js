#!/usr/bin/env node
"use strict";
/**
 * scripts/checks/beta-verdict-citation-receipt.js — ED-239 (CRITICAL) enforcer.
 *
 * "A reported teammate verdict (especially a β consult verdict) must be receipt-backed at report
 * time: attribution without receipt = unverified claim, treated as absent." A downstream artifact
 * (ADR, tracker, ROADMAP) that CITES a β verdict as load-bearing justification must be able to
 * point at the receipt — the msg_id of the delivered verdict, resolvable in paths.betaEvents.
 *
 * Sibling of reasoned-consult-honesty.js (row well-formedness) + betaevents-dedup-lint.js (row
 * dedup/msg_id hygiene): those check the LEDGER; this checks the CITATIONS that reference it.
 *
 * TWO finding classes (β plan→design scoping — STRUCTURAL receipt-presence, not semantic msg-log
 * authentication, which is ED-275):
 *   HARD (gate-able): a β-verdict citation that CARRIES a `msg_id <token>` whose token does NOT
 *     resolve to a betaEvents VERDICT row. A present-but-unresolved receipt is a forged / typo'd /
 *     stale reference — near-zero false-positive, so it can BLOCK under --enforce.
 *   SOFT (report-only advisory, never blocks): a load-bearing β-verdict citation with NO msg_id at
 *     all — the conductor-side contract nudge ("cite the receipt"). Report-only because the
 *     historical corpus predates the msg_id convention; blocking it would flood.
 *
 * GAUNTLET-HARDENED (SP-20260724-001 r1 — gpt qa/backend/security all FAIL'd r0):
 *   F1 the receipt must resolve to a POSITIVELY-classified verdict row (recognized type AND a valid
 *      decision/verdict payload) — NOT any typeless/generic/request row, and not an unqualified
 *      msg_ids array (a forged generic betaEvents row with the cited id was a false-green).
 *   F2 citation msg_id extraction uses the SAME id-shape rule as ledger indexing (a short unresolved
 *      token is now HARD, not silently downgraded to SOFT).
 *   F3 a Markdown-backticked/quoted `msg_id` token is parsed (was misread as no-receipt → SOFT).
 *   F4 the citation scanner tolerates a punctuation separator (`β: DECIDE`), and the history skip is
 *      SECTION-bounded (skip a Session/Change-log section only until its next peer/higher heading) —
 *      an ACTIVE section after a mid-document history heading is no longer truncated away.
 *   F5 a present-but-UNREADABLE doc/dir is fail-closed (exit 2), not silently skipped; only an ABSENT
 *      (ENOENT) input is fine.
 *   F6 the ED-275 disclaimer prints on EVERY path, including the fail-closed exit-2 paths.
 *
 * ED-286 (β DECIDE B/0.90 — NFKD per msg_id 562ba5b6, correcting the f1a4d7c9 "NFKC") — the citation-
 * obfuscation defense is a MECHANISM, not a category list: normalizeForDetection folds the detection text
 * to its NFKD skeleton (compat-decompose + strip the FULL invisible class \p{M}/\p{Cf}/\p{Cc}/
 * \p{Default_Ignorable_Code_Point} + map \p{White_Space}/named-blanks to a space) THEN matches, closing the
 * invisible/combining/control/confusable CLASS by construction (BOTH halves of the citation, not just β).
 * The SAME shared normalization drives the msg_id RECEIPT-EXTRACTION path (r5) so the two can't diverge; the
 * class was broadened from \p{M}+\p{Cf} to also cover controls + non-\p{Cf} default-ignorables (r6, qa HIGH).
 * The UTF-16-vs-code-point index-map desync (false-green after any astral char) is fixed (per-UTF-16-unit
 * map). Residual explicitly disclosed at the NORMALIZATION CEILING comment below (P-059).
 *
 * GITIGNORED-LEDGER POSTURE (mirrors betaevents-dedup-lint): betaEvents is a gitignored advisory
 * ledger, absent on a fresh clone / CI. Absent (ENOENT) => SKIP-with-note (exit 0). Present-but-
 * unreadable => fail-closed exit 2. SCOPE: /scan:full only, never CI; report-only by default.
 *
 * Exit: 0 clean / report-only / skip · 1 HARD finding under --enforce · 2 fail-closed.
 * Pure evaluate({docs, betaEventsText}) is exported for sealed-fixture tests (no disk).
 */

const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..", "..");
const NAME = "beta-verdict-citation-receipt";
// β Q1(b) CEILING DISCLAIMER (printed on ALL paths, like ED-234): a GREEN means the cited receipt
// is PRESENT, not AUTHENTIC. This verifies a citation's msg_id EXISTS on a betaEvents VERDICT row —
// NOT that the row is itself authentic / from the right β instance. A real msg_id pointing at a
// forged / wrong-instance row passes BY DESIGN; that authenticity layer is ED-275 (msg-log
// authenticator), out of scope here. Scan:full-only, never CI (betaEvents is gitignored).
const DISCLAIMER = "receipt PRESENT, not authenticated — a cited msg_id resolving to a betaEvents VERDICT row is NOT proof the row is authentic/right-instance (that is ED-275). /scan:full-only, never CI.";
const DEFAULT_BETA_EVENTS = path.join(REPO, ".claude", "agents", "president", "_system", "beta", "events.jsonl");
// Default corpus: ADRs + the roadmap + epic trackers (where a β verdict is cited as justification).
const DEFAULT_DOC_DIRS = [
  path.join(REPO, ".claude", "agents", "president", "_system", "policy", "adr"),
  path.join(REPO, "trackers", "epics"),
];
const DEFAULT_DOC_FILES = [path.join(REPO, "ROADMAP.md")];

// A β-verdict CITATION: a β/beta token, an OPTIONAL punctuation/space separator (F4 — `β: DECIDE`), then
// a canonical verdict token. ED-286: the separator quantifier is `*` (not `+`) so an INVISIBLE separator
// that normalizeForDetection removes to "" (a zero-width / combining char between the tokens) still
// matches, e.g. `β<ZWSP>DECIDE` -> `βDECIDE`; a real space or a blank-folded separator matches too. NB a
// leading `\b` does NOT work before `β` (non-ASCII has no ASCII word boundary against a preceding space)
// — a negative lookbehind matches both `β …` and `beta …`. The separator class uses `\s` (never a literal
// space before `]` — the NUL-via-Write trap) + the ASCII colon + em/en-dash + hyphen (hyphen last = literal).
// BOTH HALVES are defended identically: this regex runs on the NFKD-normalized text (normalizeForDetection),
// so a homoglyph/combining/invisible attack on the DECISION token (DECIDE|DIRECTIVE|…) is folded away just
// like one on the β token — the r4 "β side only" gap is closed by construction, not by a second strip-list.
const CITATION_RE = /(?<![A-Za-z])(?:β|beta|Beta)[\s:\u2014\u2013-]*(?:DECIDE|DIRECTIVE|ESCALATE|ruled|verdict|approved|DECIDES)\b/;
// A receipt token on the SAME line: the literal `msg_id` label, then an OPTIONAL markdown/quote
// delimiter (F3 — `msg_id `abc``), then an id-shaped token. F2: capture ANY id-shaped token (>=1
// char, same rule as MSGID_SHAPE_RE) — a short unresolved token must be HARD, not downgraded to SOFT.
const MSGID_IN_TEXT_RE = /\bmsg_id[:=\s]+[`'"]?([A-Za-z0-9][A-Za-z0-9_-]*)/i;
// A betaEvents row's own msg_id (id-shaped). ONE id-shape rule for both extraction and indexing (F2).
const MSGID_SHAPE_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
// ── beta G1 as the MECHANISM, not the category (ED-286 / beta DECIDE B/0.90 msg_id f1a4d7c9) ─────────
// normalizeForDetection folds the DETECTION text to its RENDERED / canonical skeleton, THEN matches. This
// closes the invisible/combining/confusable-obfuscation CLASS BY CONSTRUCTION — not by enumerating the
// next bad category (the r3->r4 whack-a-mole trap ED-285/ED-286 diagnosed). Per raw CODE POINT:
//   * markdown emphasis delimiters (* _ ` ~)  -> ""   (removed; never breaks a token, never forms a sep)
//   * combining MARKS \p{M} (incl. INVISIBLE U+034F CGJ) + FORMAT \p{Cf} (every zero-width / BOM / joiner)
//        -> ""  (removed — a mark/format char INSIDE a token must vanish so the token survives; between
//               tokens it vanishes too, which is why the citation separator is OPTIONAL, see CITATION_RE)
//   * space-rendering blanks — \p{Zs} PLUS the non-\p{Zs} blanks U+2800 BRAILLE PATTERN BLANK & the Hangul
//        fillers (U+3164 / U+1160 / U+115F / U+FFA0)  -> " "  (a real separator the citation regex sees)
//   * everything else -> NFKD (compatibility decomposition) with any \p{M}/\p{Cf} in the decomposition
//        stripped. NFKD folds BOTH halves of the citation: beta-homoglyphs (math betas U+1D6C3.., Greek
//        beta symbol U+03D0) -> beta, AND decision-token homoglyphs (fullwidth D-E-C-I-D-E, math-alphanum,
//        and precomposed accents like E-acute = E + combining-acute once the mark is stripped) -> DECIDE.
//        The old enumerated 6-beta-homoglyph list AND the "beta side only" defense gap are both subsumed.
//
// INDEX MAP (ED-286 co-residual FIX — was a false-green after any astral char): map[i] = the raw UTF-16
// index that produced norm's UTF-16 unit i. Built PER UTF-16 UNIT of the fold output, and rawIdx advances
// by the SOURCE code point's UTF-16 length — so an unchanged ASTRAL char (2 UTF-16 units) contributes 2
// aligned map entries. The r4 bug iterated the fold output by CODE POINT (`for (const u of out)`) while
// advancing by code point: an astral char appended 2 units to `norm` but only 1 map entry, desyncing every
// later position. RegExp `.index` is a UTF-16 offset, so the raw-clause slice then pointed at the wrong
// offset (a downgraded/misattributed finding = a false-green). Map values are always code-point starts, so
// raw.slice(map[a], map[b]) never splits a surrogate pair.
//
// msg_id EXTRACTION runs on the RAW clause NFKD-folded with * / ` / ~ / \p{M} / \p{Cf} stripped but `_`
// PRESERVED (ids keep abc_def; ASCII is NFKD-invariant) — so an invisible-obfuscated forged receipt
// de-obfuscates to ASCII and stays HARD instead of being downgraded to a receiptless SOFT.
//
// ───────────── NORMALIZATION CEILING (P-059 complete disclosure — every category NOT fully closed) ────
// r7 POLICY (security lane, 3 HIGHs — beyond plain strip/fold): (i) BIDI controls (U+202A-202E/U+2066-2069)
// are DANGEROUS SYNTAX not ignorable — their PRESENCE on a scanned line is a HARD finding (they reorder
// rendering so a citation can be visually masked; a data-free enforcer can't run UAX#9 visual reorder);
// (ii) the doc is split on ALL Unicode UAX#14-BK line breaks (CRLF/LF/CR/VT U+000B/FF U+000C/LS/PS/NEL —
// r8 added VT/FF) BEFORE historyMask, so a Unicode-line-break-hidden peer heading can't keep an active
// citation history-masked; (iii) the msg_id PAYLOAD is validated RAW and POSITION-ANCHORED (r8) — a folded
// captured id must appear as a RAW receipt AT ITS msg_id-LABEL position (rawMids, extracted from the same
// clause with NO compat-fold), else it was minted by compat-fold/mark-strip (e.g. fullwidth ｒｅａｌ０００ →
// real000) → LAUNDERED → HARD, never resolves (a transformation must never mint a credential; a raw twin
// ELSEWHERE in the clause can't launder it — the check is keyed to the label, not a whole-clause substring).
// The NFKD skeleton closes the FULL invisible/control class (ED-286 r6, qa BINDING HIGH): \p{Cf} format/
// zero-width, \p{M} combining marks (incl. CGJ), \p{Cc} CONTROLS (NUL/BEL/DEL), \p{Default_Ignorable_Code_Point}
// (incl. the NON-\p{Cf} reserved default-ignorables U+2065/U+FFF0/U+E0000), markdown emphasis, compatibility
// homoglyphs (fullwidth, math-alphanumeric, sub/superscript, ligatures), and \p{White_Space} (incl. control
// whitespace like TAB) + the named non-\p{Zs} blanks. All of it is driven by ONE shared source (the INVIS
// class fragment + SPACE_MAP) applied on BOTH paths — the citation DETECTION text (normalizeForDetection) AND
// the msg_id RECEIPT-EXTRACTION clause (SPACE_MAP_G + RECEIPT_SEP_INVIS_G + CLAUSE_STRIP_G) — so the two paths
// CANNOT diverge and a blank/invisible/control separator between the `msg_id` label and its id can no longer
// hide a citation or downgrade a forged receipt HARD->SOFT (ED-286 r5 + r6 closed). It does NOT close, and
// these remain the honest, self-declared residual:
//   (a) CROSS-SCRIPT / visual confusables that share NO NFKD decomposition — Cyrillic/Greek <-> Latin
//       look-alikes (e.g. Cyrillic C/E/P/B for Latin C/E/P/B, a Cyrillic-spoofed "beta", or the Latin
//       sharp-s ß U+00DF spoofing the Greek β): NFKD keeps them distinct code points. Closing this needs
//       the Unicode TR39 confusables SKELETON (external data table), deliberately out of scope for a
//       data-free enforcer. This residual reaches BOTH positions (r5 hunter MEDIUM): a confusable in a
//       DETECTION token hides the whole citation (scanned=0), AND a confusable in the literal `msg_id`
//       LABEL (e.g. Cyrillic-i U+0456, dotless-i U+0131 — pixel-identical to "msg_id") makes
//       MSGID_IN_TEXT_RE miss the receipt so a DETECTED citation's forged receipt downgrades HARD->SOFT.
//       Both are the same TR39 root. (Both codified as self-detecting tests — if a TR39 pass is ever
//       added they flip.)
//   (b) a space-rendering code point OUTSIDE \p{Zs} + {U+2800, U+3164, U+1160, U+115F, U+FFA0} — if Unicode
//       adds a new blank glyph it must be added to BLANK_RE (a named, testable set, not a \p property).
//       (Now enforced on BOTH the detection AND the receipt-extraction path — see BLANK_G above.)
//   (c) receipt AUTHENTICITY (a real msg_id resolving to a forged / wrong-instance row) — ED-275; DISCLAIMER.
//   (d) the append-only Session-log / Change-log history skip (historyMask) — an ACTIVE citation placed
//       under a (mislabelled) history heading is intentionally not scanned; a social-engineering evasion
//       tracked with the history-skip feature, not a normalization gap.
//   (e) a DOUBLE-obfuscated receipt where BOTH the `msg_id` LABEL is split by an invisible AND the
//       label->id separator is an invisible (e.g. "msg<ZWSP>_id<ZWSP>ghost"): CLAUSE_STRIP_G repairs the
//       label but the two invisibles collapse to an abutment ("msg_idghost") that is INDISTINGUISHABLE
//       from a legit `msg_ids`/`msg_identifier` word, so it stays a receiptless SOFT rather than HARD.
//       Bounded + low-value: it renders as "msg_idghost" (NO visible space), so it does NOT read to a
//       human as a valid "msg_id ghost" receipt. Closed single-obfuscation cases (tested): a blank OR
//       invisible SEPARATOR, and an INVISIBLE (\p{Cf}/\p{M}) inside the label. NOT closed: a CROSS-SCRIPT
//       CONFUSABLE inside the label — that is the TR39 residual (a), not this abutment case.
//   (f) PRECISION (over-flag, never a false-green): MSGID_IN_TEXT_RE treats any `msg_id <token>` as a
//       cited receipt, so a benign PROSE mention ("the msg_id field must resolve") can extract the next
//       bareword as an unresolved receipt -> a report-only HARD (blocks only under --enforce; live-corpus
//       delta is 0). RECEIPT_SEP_INVIS_G extends this to an invisible-adjacent mention. This over-FLAGS,
//       it never HIDES a citation or downgrades a forgery. The root tightening — require a receipt-shaped/
//       delimited context (backtick/quote/paren) around the id — is tracked as a follow-up ED against
//       MSGID_IN_TEXT_RE, out of scope for the ED-286 obfuscation-mechanism fix.
//   (g) PRECISION (over-flag, never a false-green — r6 backend LOW): the citation separator is OPTIONAL (`*`,
//       so an invisible-removed separator still matches), which also matches a bare lowercase concatenation
//       — `betaverdict` / `betaruled` / `betaapproved` (or an exact-case `βDECIDE`) scans AS a citation. That
//       is the intended behavior for the invisible-removed case and an over-flag for a genuine identifier/word
//       (a lowercase `betaverdict` var). It only ever over-FLAGS (SOFT when no msg_id; never hides/ downgrades),
//       is case-bounded (uppercase tokens DECIDE/DIRECTIVE/ESCALATE + lowercase ruled/verdict/approved only, so
//       `betaVerdict` with a capital V does NOT match), and the live-corpus delta is 0. Same inherent
//       optional-separator ambiguity as (e)/(f); tracked with the (f) MSGID_IN_TEXT_RE follow-up ED.
const EMPHASIS_RE = /[*_`~]/u;                  // markdown emphasis/strikethrough delimiters (per code point)
// ED-286 gauntlet r6 (qa BINDING HIGH): the "invisible" class the fold must close is BROADER than \p{M}+\p{Cf}
// \u2014 \p{Cc} CONTROLS (U+0000 NUL / U+0007 / U+007F) and NON-\p{Cf} DEFAULT-IGNORABLES (U+2065 / U+FFF0 /
// U+E0000) survived, so `\u03b2 D<NUL>ECIDE` HID the citation (scanned=0) and `msg_id<NUL>ghost` downgraded the
// receipt to SOFT. ONE shared INVIS class fragment drives BOTH the detection fold AND the extraction clean so
// the two paths can NEVER diverge (the r5 asymmetry lesson, now structural). WHITESPACE \u2014 incl CONTROL
// whitespace like TAB \u2014 maps to a " " separator (SPACE_MAP); every other invisible/control/mark/default-
// ignorable strips to "" (INVIS); a named non-whitespace blank (U+2800 braille, Hangul fillers) still -> " ".
const INVIS = "\\p{M}\\p{Cf}\\p{Cc}\\p{Default_Ignorable_Code_Point}"; // marks + format + controls + reserved default-ignorables
const STRIP_INVIS_G = new RegExp("[" + INVIS + "]", "gu");               // detection fold: strip invisible/control/mark -> ""
const SPACE_MAP_RE = /[\p{White_Space}\u2800\u3164\u1160\u115f\uffa0]/u; // per-cp: whitespace (incl TAB/control-ws) + named blanks -> " "
const SPACE_MAP_G = new RegExp(SPACE_MAP_RE.source, "gu");               // global variant for the extraction clause
const CLAUSE_STRIP_G = new RegExp("[*`~]|[" + INVIS + "]", "gu");        // clean the RAW clause for msg_id extraction (KEEP `_`)
// ED-286 gauntlet r5 (hunter HIGH — RECEIPT-path normalization asymmetry): the msg_id EXTRACTION path
// must apply the SAME invisible/blank normalization the DETECTION path does, or a citation the detection
// path scans stays HARD-less. Two closures on the SEPARATOR between the `msg_id` label and the id:
//   (1) BLANK_G: a BLANK_RE code point (\p{Zs} + U+2800/U+3164/U+1160/U+115F/U+FFA0) as the separator
//       renders as a VISIBLE space but is not \s and has no NFKD-to-space decomposition, so
//       MSGID_IN_TEXT_RE's [:=\s]+ failed and a forged blank-separated receipt DOWNGRADED HARD->SOFT
//       (a false-green: `msg_id⠀ghost` reads to a human as a valid receipt). Map -> " " so it becomes \s.
//   (2) RECEIPT_SEP_INVIS_G: an INVISIBLE run (\p{Cf} zero-width / \p{M} mark incl. U+034F CGJ)
//       IMMEDIATELY AFTER the `msg_id` label would otherwise be stripped to "" by CLAUSE_STRIP_G and
//       ABUT the id (msg_id<ZWSP>ghost -> msg_idghost, [:=\s]+ fails). A TARGETED, position-specific
//       boundary replace inserts a space there. Position-specific on the LITERAL label so it NEVER
//       false-matches a legit `msg_ids` array (which carries an ASCII `s` after the label, not an
//       invisible) — the reason the citation separator could be made optional but this one cannot.
// (BLANK_G folded into SPACE_MAP_G above — the extraction clause uses SPACE_MAP_G so the blank/whitespace
//  mapping is identical to detection's per-cp SPACE_MAP_RE.)
// The boundary-space fires ONLY when an id-shaped token actually follows the invisible run (r5 hunter
// LOW): a bare \p{M}/\p{Cf} after the literal `msg_id` in prose with no following id no longer
// synthesizes a spurious separator. (Does not fully close the inherent `msg_id <token>` prose over-flag
// — that is NORMALIZATION CEILING (f), rooted in MSGID_IN_TEXT_RE and tracked as a follow-up ED.)
const RECEIPT_SEP_INVIS_G = new RegExp("(msg_id)[" + INVIS + "]+(?=[`'\"]?[A-Za-z0-9])", "giu");
// ── ED-286 gauntlet r7 — normalization-POLICY additions (security lane, 3 HIGHs) ──────────────────────
// Three char-classes need DIFFERENT handling than plain strip/fold:
//   * BIDI CONTROLS (r7 #1): U+202A-202E (LRE/RLE/PDF/LRO/RLO) + U+2066-2069 (isolates) are \p{Cf}, so the
//     fold STRIPPED them — but they REORDER rendering, so `β <RLO>EDICED<PDF>` renders "β DECIDE" to a human
//     while the logical (scanned) order is "EDICED" -> scanned=0, a HIDDEN citation. Stripping does NOT help
//     (the logical order IS the attack). Treat bidi as DANGEROUS SYNTAX: its PRESENCE in a scanned
//     (non-history) line is a HARD finding — a citation may be masked. Simplest + strongest (a data-free
//     enforcer can't run the full UAX#9 visual reorder); explicit bidi overrides ~never appear in legit
//     ADR/tracker/ROADMAP prose (RTL text uses the IMPLICIT bidi algorithm, not overrides).
//   * LINE SEPARATORS (r7 #3): the doc was split on /\r?\n/ only, so U+2028/U+2029/lone-CR/NEL were NOT line
//     breaks — an attacker hides a peer heading inside an open history section (it never closes the section)
//     so active citations after it stay history-masked -> scanned=0. Split on ALL Unicode line breaks BEFORE
//     historyMask.
//   * RECEIPT-ID PAYLOAD (r7 #2, the deep one): the extraction clause is NFKD-COMPAT-FOLDED, so a fullwidth
//     `msg_id ｒｅａｌ０００` (or a mark-decorated `ŕeal000`) FOLDS INTO a real ledger id and RESOLVES CLEAN — a
//     normalization that MINTS a valid credential. The id PAYLOAD must be validated RAW: only render-nothing
//     invisibles (\p{Cf}/\p{Cc}/\p{Default_Ignorable}, NOT \p{M} marks, NOT compat-fold) may be removed. A
//     captured (folded) id that is NOT a verbatim substring of the raw render-nothing-cleaned clause was
//     minted by folding/mark-strip -> LAUNDERED -> HARD, never resolves. (writer-stamped-fields principle:
//     a transformation must never mint a credential.)
const BIDI_RE = /[‪-‮⁦-⁩]/u;       // bidi overrides/embeddings/isolates — dangerous syntax, not ignorable
const LINE_SPLIT_RE = new RegExp("\\r\\n|[\\n\\r\\u000b\\u000c\\u2028\\u2029\\u0085]"); // all Unicode UAX#14-BK line breaks: CRLF, LF, CR, VT (U+000B), FF (U+000C), LS, PS, NEL — r8 added VT/FF (same mandatory-break class as LS/PS; a VT/FF-hidden peer heading must also close a history section)
const RAW_ID_CLEAN_G = new RegExp("[*`~]|[\\p{Cf}\\p{Cc}\\p{Default_Ignorable_Code_Point}]", "gu"); // RAW id-payload cleaner: strip emphasis(keep _) + render-nothing ONLY (NO \p{M}, NO compat-fold)
function normalizeForDetection(raw) {
  let norm = "";
  const map = []; // map[i] = raw UTF-16 index that produced norm's UTF-16 unit i (UTF-16-aligned)
  let rawIdx = 0;
  for (const cp of raw) {              // iterate the RAW by CODE POINT (surrogate-pair-safe)
    const cpLen = cp.length;           // 1 or 2 UTF-16 units in the SOURCE
    let out;
    if (EMPHASIS_RE.test(cp)) out = "";
    else if (SPACE_MAP_RE.test(cp)) out = " ";
    else out = cp.normalize("NFKD").replace(STRIP_INVIS_G, ""); // compat-fold + drop marks/format/controls/default-ignorables
    for (let j = 0; j < out.length; j++) { map.push(rawIdx); norm += out[j]; } // map PER UTF-16 UNIT of the fold
    rawIdx += cpLen;                   // advance by the SOURCE code point's UTF-16 length (astral-safe)
  }
  map.push(rawIdx); // sentinel: map[norm.length] === raw.length (raw's UTF-16 length)
  return { norm, map };
}
// Verdict row types (from reasoned-consult-honesty's live corpus). A citation's receipt must resolve
// to a POSITIVELY-classified verdict row — one of these types AND carrying a real decision/verdict.
const VERDICT_TYPES = new Set([
  "beta-consult-verdict", "beta-consult-verdict-reconfirm", "beta-verdict", "beta-directive",
  "design-boundary-verdict", "fix-lock-verdict", "design-lock", "fix-lock", "beta-consult-retraction",
  "boundary", "beta-consult", // beta-consult may carry a verdict OR be a request — qualified below.
]);
const DECISION_VOCAB = new Set(["DECIDE", "DIRECTIVE", "ESCALATE"]);

/**
 * F1 — positive verdict-row classification: a row contributes a receipt msg_id ONLY when it is a
 * recognized verdict TYPE AND carries a valid decision (DECIDE|DIRECTIVE|ESCALATE) OR a non-empty,
 * non-"pending" verdict payload. A typeless/generic logger row, or a request-shaped consult row, is
 * NOT a verdict row — so a forged generic row sharing a cited id can no longer manufacture a receipt.
 */
function isVerdictRow(o) {
  if (!o || typeof o !== "object") return false;
  const type = typeof o.type === "string" ? o.type : null;
  if (!type || !VERDICT_TYPES.has(type)) return false;
  const decision = typeof o.decision === "string" ? o.decision.trim().toUpperCase() : null;
  if (decision && DECISION_VOCAB.has(decision)) return true;
  const verdict = typeof o.verdict === "string" ? o.verdict.trim().toLowerCase() : "";
  return verdict.length > 0 && verdict !== "pending";
}

/** Build the set of msg_ids present on betaEvents VERDICT rows (F1). null betaEventsText => absent. */
function verdictMsgIds(betaEventsText) {
  if (betaEventsText == null) return null; // absent — caller SKIPs
  const set = new Set();
  for (const line of String(betaEventsText).split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    let o;
    try { o = JSON.parse(t); } catch { continue; } // malformed row skipped (never crash)
    if (!isVerdictRow(o)) continue; // F1: ONLY positively-classified verdict rows contribute a receipt
    const mid = typeof o.msg_id === "string" ? o.msg_id : null;
    if (mid && MSGID_SHAPE_RE.test(mid)) set.add(mid);
    // A qualified verdict row may also carry a msg_ids[] (consult-out + verdict-back); each id-shaped.
    if (Array.isArray(o.msg_ids)) for (const m of o.msg_ids) if (typeof m === "string" && MSGID_SHAPE_RE.test(m)) set.add(m);
  }
  return set;
}

/**
 * F4 — SECTION-bounded history skip. Returns true iff line index `i` is inside an append-only
 * history section (Session log / Change log / Changelog / History) — from its heading until the next
 * heading at the SAME-or-HIGHER level. So a history section in the MIDDLE of a doc no longer
 * truncates the active content after it. `headings` is the precomputed per-line heading levels.
 */
function historyMask(lines) {
  const mask = new Array(lines.length).fill(false);
  let historyLevel = null;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      if (historyLevel !== null && level <= historyLevel) historyLevel = null; // section closed by a peer/higher heading
      if (historyLevel === null && /^(Session log|Change log|Changelog|History)\b/i.test(h[2].trim())) {
        historyLevel = level;
        mask[i] = true; // the heading line itself is history
        continue;
      }
    }
    if (historyLevel !== null) mask[i] = true;
  }
  return mask;
}

/**
 * Pure core. docs = [{ path, text }]; betaEventsText = raw jsonl or null (absent).
 * Returns { skip, hard:[], soft:[], scannedCitations }.
 */
function evaluate({ docs, betaEventsText }) {
  const known = verdictMsgIds(betaEventsText);
  if (known === null) return { skip: true, hard: [], soft: [], scannedCitations: 0 };
  const hard = [];
  const soft = [];
  let scannedCitations = 0;
  // C2 (gpt backend r1, HIGH — per-line receipt laundering): scan PER-CITATION, not per-line. Each
  // citation owns its own CLAUSE (from its position to the NEXT citation, or line end) and resolves
  // against the msg_id(s) in THAT clause only.
  const citationGlobal = new RegExp(CITATION_RE.source, "g");
  const msgidGlobal = new RegExp(MSGID_IN_TEXT_RE.source, "gi");
  for (const d of docs || []) {
    const rawLines = String(d.text || "").split(LINE_SPLIT_RE); // r7 #3: ALL Unicode line breaks, so a U+2028/U+2029/lone-CR-hidden peer heading still closes a history section
    const inHistory = historyMask(rawLines);
    for (let i = 0; i < rawLines.length; i++) {
      if (inHistory[i]) continue; // append-only history section — a dated past citation is a record
      // R2/S3 (r3 hunter HIGH — underscore-italic + zero-width citation BYPASS): DETECTION and
      // msg_id EXTRACTION need OPPOSITE treatment of `_`. Build a DETECTION-normalized line that strips
      // ALL inline emphasis (* ` _) AND zero-width/format unicode (U+200B–200D, U+FEFF), keeping an
      // INDEX MAP back to the RAW line — so "_β_ _DECIDE_" / "**β** **DECIDE**" / "βDECIDE" are all
      // detected — while msg_id EXTRACTION runs on the RAW clause (only * / backtick / zero-width
      // stripped, `_` PRESERVED) so an id like abc_def is never corrupted. (r2 kept `_`; that left the
      // identical bypass open for standard CommonMark underscore-italic — the r3 hunter HIGH.)
      const raw = rawLines[i];
      // r7 #1 (security HIGH): a bidi control on a scanned line can visually reorder a hidden citation
      // ("β <RLO>EDICED<PDF>" renders "β DECIDE" but the logical/scanned order is "EDICED"). Bidi is
      // DANGEROUS SYNTAX, not ignorable — its PRESENCE is a HARD finding (a citation may be masked).
      if (BIDI_RE.test(raw)) {
        hard.push({
          doc: d.path, line: i + 1, msg_id: null,
          reason: `bidi control (U+202A-202E / U+2066-2069) on a scanned line — rendering order differs from logical order, so a β-verdict citation may be visually MASKED (e.g. "β <RLO>EDICED<PDF>" renders "β DECIDE" while the scanner sees "EDICED"). Bidi overrides do not belong in prose ADR/tracker/ROADMAP; remove or justify. Line: ${raw.replace(new RegExp(BIDI_RE.source, "gu"), "<BIDI>").trim().slice(0, 120)}`,
        });
      }
      const { norm, map } = normalizeForDetection(raw);
      const starts = [];
      citationGlobal.lastIndex = 0;
      let cm;
      while ((cm = citationGlobal.exec(norm)) !== null) {
        starts.push(cm.index);
        if (citationGlobal.lastIndex === cm.index) citationGlobal.lastIndex++; // guard against a zero-width match loop
      }
      for (let c = 0; c < starts.length; c++) {
        scannedCitations++;
        const rawStart = map[starts[c]];
        const rawEnd = c + 1 < starts.length ? map[starts[c + 1]] : raw.length;
        // RAW clause (mapped back from the normalized detect position): NFKD-fold, then apply the SAME
        // invisible/blank normalization as DETECTION so the receipt path can't be desynced from it
        // (ED-286 r5 hunter HIGH). Order: (1) BLANK_G maps blank-rendering separators -> " " (real \s);
        // (2) RECEIPT_SEP_INVIS_G turns an invisible run right after the `msg_id` label into a space so
        // it doesn't abut the id after stripping; (3) CLAUSE_STRIP_G strips remaining emphasis (except
        // `_`), \p{M} marks and \p{Cf} format so an obfuscated label/id de-obfuscates to ASCII (a legit
        // underscore id ab_cd_ef is preserved; ASCII is NFKD-invariant). Net: an invisible/blank-obfuscated
        // forged receipt stays HARD instead of a downgraded receiptless SOFT.
        const clauseRaw = raw.slice(rawStart, rawEnd);
        const clause = clauseRaw
          .normalize("NFKD")
          .replace(SPACE_MAP_G, " ")
          .replace(RECEIPT_SEP_INVIS_G, "$1 ")
          .replace(CLAUSE_STRIP_G, "");
        // r7 #2 (security HIGH — receipt-id LAUNDERING): the id PAYLOAD must be validated RAW. `clause` is
        // compat-FOLDED, so a fullwidth `ｒｅａｌ０００` (or a mark-decorated `ŕeal000`) folds INTO a real ledger
        // id and would resolve CLEAN — a normalization MINTING a credential. `rawIdClean` strips render-nothing
        // invisibles + emphasis ONLY (keeps `_`, keeps \p{M} marks, does NOT compat-fold), so a captured id
        // that is NOT a verbatim substring of it was minted by folding/mark-strip -> LAUNDERED -> unresolvable.
        // r7 #2 + r8 (security HIGH + hunter LOW — receipt-id LAUNDERING, position-anchored): the id
        // PAYLOAD must be a RAW ASCII receipt AT ITS msg_id-LABEL position, not merely present somewhere in
        // the clause. `rawMids` = the ids captured (by the SAME label+separator regex) from a clause cleaned
        // the SAME way EXCEPT with NO compat-fold (SPACE_MAP + RECEIPT_SEP boundary + render-nothing/emphasis
        // strip; \p{M} marks KEPT). So a fullwidth/mark-decorated id folds in `clause` but is absent from
        // `rawMids` -> LAUNDERED -> HARD; and a raw twin elsewhere in the clause (hunter LOW) can't launder it,
        // because rawMids is keyed to the LABEL position, not a whole-clause substring.
        const rawClause = clauseRaw
          .replace(SPACE_MAP_G, " ")
          .replace(RECEIPT_SEP_INVIS_G, "$1 ")
          .replace(RAW_ID_CLEAN_G, ""); // NO NFKD fold — the RAW id payload
        const rawMids = [];
        msgidGlobal.lastIndex = 0;
        let rm;
        while ((rm = msgidGlobal.exec(rawClause)) !== null) {
          if (MSGID_SHAPE_RE.test(rm[1])) rawMids.push(rm[1]);
          if (msgidGlobal.lastIndex === rm.index) msgidGlobal.lastIndex++;
        }
        // R1 (gpt security+backend r2, HIGH — intra-clause laundering): validate EVERY msg_id in the
        // clause, not just the first. ANY cited receipt that does not resolve (or is normalization-laundered) → HARD.
        const mids = [];
        msgidGlobal.lastIndex = 0;
        let mm;
        while ((mm = msgidGlobal.exec(clause)) !== null) {
          if (MSGID_SHAPE_RE.test(mm[1])) mids.push(mm[1]);
          if (msgidGlobal.lastIndex === mm.index) msgidGlobal.lastIndex++;
        }
        if (mids.length === 0) {
          soft.push({
            doc: d.path, line: i + 1,
            reason: `load-bearing β-verdict citation with NO msg_id receipt — add the delivered verdict's msg_id (ED-239 conductor-side contract). Citation: ${clause.trim().slice(0, 120)}`,
          });
        } else {
          const isLaundered = (x) => !rawMids.includes(x); // r8: the folded id is not a RAW receipt at a label position -> minted by normalization
          const unresolved = mids.filter((x) => isLaundered(x) || !known.has(x));
          if (unresolved.length) {
            const first = unresolved[0];
            hard.push({
              doc: d.path, line: i + 1, msg_id: first,
              reason: isLaundered(first)
                ? `β-verdict citation cites msg_id '${first}' that exists ONLY via normalization (compat-fold/mark-strip minted it from an obfuscated payload — e.g. fullwidth/accented id) and is NOT a raw ASCII receipt — normalization must never mint a credential (r7 #2). Citation: ${clause.trim().slice(0, 120)}`
                : `β-verdict citation cites msg_id '${first}' which does NOT resolve to a betaEvents VERDICT row — unverified receipt (${unresolved.length} of ${mids.length} cited receipt(s) unresolved; forged/typo/stale). Citation: ${clause.trim().slice(0, 120)}`,
            });
          }
        }
      }
    }
  }
  return { skip: false, hard, soft, scannedCitations };
}

// ── Filesystem gathering ──────────────────────────────────────────────────────

/**
 * F5 — fail-closed gather. Returns { docs, errors }. A present-but-UNREADABLE file/dir (any non-ENOENT
 * error) is collected into `errors` so main() can exit 2 — a protected/unreadable ADR that could hold a
 * bad citation must NOT silently disappear into a green. ENOENT (absent) is fine (not an error).
 */
function gatherDocs(dirs, files, io = fs) {
  const out = [];
  const errors = [];
  const pushFile = (fp) => {
    try { out.push({ path: path.relative(REPO, fp), text: io.readFileSync(fp, "utf8") }); }
    catch (e) { if (!e || e.code !== "ENOENT") errors.push({ path: fp, error: (e && e.message) || "read failed" }); }
  };
  for (const dir of dirs) {
    let entries;
    try { entries = io.readdirSync(dir); }
    catch (e) { if (!e || e.code !== "ENOENT") errors.push({ path: dir, error: (e && e.message) || "readdir failed" }); continue; }
    for (const n of entries) if (/\.md$/i.test(n)) pushFile(path.join(dir, n));
  }
  // C1 (gpt qa+backend r1, HIGH): call pushFile DIRECTLY for every explicit file — do NOT gate on
  // io.existsSync(f). existsSync collapses an access/stat failure (EACCES) to false, so a
  // present-but-UNREADABLE ROADMAP.md would be treated as absent and silently omitted (a green over an
  // unexamined citation-bearing doc). pushFile's catch already ignores ONLY ENOENT (truly absent) and
  // records every other error → a present-but-unreadable explicit file becomes a fail-closed exit-2.
  for (const f of files) pushFile(f);
  return { docs: out, errors };
}

function main(argv) {
  const jsonOut = argv.includes("--json");
  const enforce = argv.includes("--enforce");
  const bi = argv.indexOf("--beta-events");
  const betaEventsPath = bi !== -1 && argv[bi + 1] ? path.resolve(argv[bi + 1]) : DEFAULT_BETA_EVENTS;

  let betaEventsText;
  try {
    betaEventsText = fs.readFileSync(betaEventsPath, "utf8");
  } catch (e) {
    if (e && e.code === "ENOENT") {
      const out = { name: NAME, status: "skip", reason: `betaEvents absent (${betaEventsPath}) — gitignored ledger; receipt resolution skipped`, disclaimer: DISCLAIMER };
      process.stdout.write(jsonOut ? JSON.stringify(out) + "\n" : `SKIP [${NAME}] betaEvents absent (gitignored) — nothing to resolve against\n     (${DISCLAIMER})\n`);
      return 0;
    }
    // F6: disclose the ED-275 ceiling even on the fail-closed exit-2 path.
    if (jsonOut) process.stdout.write(JSON.stringify({ name: NAME, status: "error", reason: `betaEvents unreadable: ${e.message}`, disclaimer: DISCLAIMER }) + "\n");
    else process.stderr.write(`ERROR [${NAME}] betaEvents unreadable (fail-closed): ${e.message}\n     NOTE: ${DISCLAIMER}\n`);
    return 2;
  }

  const { docs, errors } = gatherDocs(DEFAULT_DOC_DIRS, DEFAULT_DOC_FILES);
  if (errors.length) {
    // F5: a present-but-unreadable corpus input is fail-closed — never report green over a doc we could not read.
    if (jsonOut) process.stdout.write(JSON.stringify({ name: NAME, status: "error", reason: "unreadable corpus input(s)", errors, disclaimer: DISCLAIMER }) + "\n");
    else {
      process.stderr.write(`ERROR [${NAME}] ${errors.length} present-but-unreadable corpus input(s) (fail-closed):\n`);
      for (const er of errors) process.stderr.write(`     - ${er.path}: ${er.error}\n`);
      process.stderr.write(`     NOTE: ${DISCLAIMER}\n`);
    }
    return 2;
  }

  const { hard, soft, scannedCitations } = evaluate({ docs, betaEventsText });
  const blocking = enforce && hard.length > 0;
  const out = {
    name: NAME, status: blocking ? "red" : "green", betaEvents: betaEventsPath,
    enforced: enforce, scannedCitations, hardFindings: hard, softAdvisories: soft, disclaimer: DISCLAIMER,
  };
  if (jsonOut) {
    process.stdout.write(JSON.stringify(out) + "\n");
  } else {
    if (hard.length) {
      process.stderr.write(`${blocking ? "FAIL" : "WARN"} [${NAME}] ${hard.length} β-verdict citation(s) with an UNRESOLVED msg_id receipt:\n`);
      for (const f of hard) process.stderr.write(`     - ${f.doc}:${f.line} msg_id '${f.msg_id}' not in betaEvents\n`);
    }
    if (soft.length) {
      process.stderr.write(`INFO [${NAME}] ${soft.length} β-verdict citation(s) with no msg_id receipt (report-only advisory):\n`);
      for (const f of soft.slice(0, 20)) process.stderr.write(`     - ${f.doc}:${f.line}\n`);
      if (soft.length > 20) process.stderr.write(`     … +${soft.length - 20} more\n`);
    }
    if (!hard.length && !soft.length) process.stdout.write(`OK   [${NAME}] ${scannedCitations} β-verdict citation(s) scanned; all receipt-backed\n`);
    process.stderr.write(`     NOTE (${NAME}): ${DISCLAIMER}\n`); // β Q1(b)/F6 — disclose the ceiling on EVERY path
  }
  return blocking ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, verdictMsgIds, isVerdictRow, historyMask, gatherDocs, NAME, DISCLAIMER };
