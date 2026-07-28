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
 * ED-286 r12 (β DECIDE B/0.89 msg_id 7c3f9e2a) — TWO INDEPENDENT credential-minting bypasses closed. They
 * share an abstraction (a transformation mints a payload the raw check then blesses) but NOT a mechanism,
 * and neither fix closes the other — verified by building each in isolation:
 *   FIX 1 (backend HIGH, was `const raw = decodeCharRefs(...)`): the variable NAMED `raw` held DECODED text,
 *     so a char-ref-spelled receipt (`msg_id &#x72;&#x65;&#x61;&#x6c;&#x30;&#x30;&#x30;`) was genuine raw
 *     ASCII before the anti-laundering check ran. The ORIGINAL PHYSICAL line is now kept as the undecoded
 *     channel; decodeCharRefs returns an index map that COMPOSES with normalizeForDetection's, so every
 *     match resolves to a span in the ORIGINAL. Occurrence-anchoring ALONE would NOT have closed this: a
 *     decoded id is legitimately ASCII at its OWN label position, so a span-anchored compare finds a
 *     matching raw twin at exactly the right span and passes.
 *   FIX 2 (security HIGH, was `isLaundered = (x) => !rawMids.includes(x)`): a VALUE test over a flat array,
 *     so ANY later raw `msg_id real000` in the clause rescued an earlier minted occurrence. Now each cited
 *     occurrence must pair with a raw receipt at its OWN origin span. An undecoded raw slice ALONE would NOT
 *     have closed this: the fullwidth probe contains no char refs, so the decode is a no-op and the raw
 *     clause was already correct — the defect was purely the value test.
 * Both are documented-invariant violations (ED-292): the code carried comments asserting properties it did
 * not hold. Those comments are corrected in place and marked DO NOT RE-BREAK rather than deleted.
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
// msg_id EXTRACTION runs on TWO clauses in parallel, both mapped back to ORIGINAL-line offsets (r12):
// the CITED clause (char-ref-decoded + NFKD-folded, * / ` / ~ / \p{M} / \p{Cf} stripped, `_` PRESERVED so
// ids keep abc_def) is what a RENDERED-view reader sees — an invisible-obfuscated forged receipt
// de-obfuscates to ASCII there and stays HARD instead of being downgraded to a receiptless SOFT; and the
// RAW clause (sliced from the ORIGINAL PHYSICAL line, NO char-ref decode, NO NFKD, \p{M} KEPT) is the
// credential channel. The two are paired BY ORIGIN SPAN, never by value membership — see r12 below.
//
// ───────────── NORMALIZATION CEILING (P-059 complete disclosure — every category NOT fully closed) ────
// r7 POLICY (security lane, 3 HIGHs — beyond plain strip/fold): (i) BIDI controls (U+202A-202E/U+2066-2069)
// are DANGEROUS SYNTAX not ignorable — their PRESENCE on a scanned line is a HARD finding (they reorder
// rendering so a citation can be visually masked; a data-free enforcer can't run UAX#9 visual reorder) AND
// non-CommonMark line/whitespace breaks VT/FF/NEL/LS/PS (DANGEROUS_BREAK_RE — the .md render surface diverges
// from the scanned line model, split-hiding a citation or masking a history heading);
// (ii) the doc is split on CommonMark line-endings ONLY (LF/CR/CRLF) — r9 corrected the r7/r8 over-split on
// the full UAX#14-BK set (VT/FF/NEL/LS/PS), which REGRESSED detection: `β<FF>DECIDE` renders on ONE .md line
// but got split across enforcer-lines and HIDDEN. A non-CommonMark break INSIDE a citation is now SPACE_MAP-
// folded to a space and still detected; a break-hidden peer heading is caught by the (i) dangerous-syntax
// flag (which runs on EVERY line, incl. history-masked, so it can't mask the section boundary itself);
// (iii) the msg_id PAYLOAD is validated RAW and OCCURRENCE/SPAN-ANCHORED (r8, CORRECTED in r12) — each
// CITED receipt occurrence must be paired with a raw-clean receipt occurrence starting at the SAME
// ORIGINAL-line offset AND carrying the SAME ASCII payload; otherwise it was minted by a transformation
// (character-reference decode &#x72;… → r, compat-fold fullwidth ｒｅａｌ０００ → real000, or mark-strip
// ŕeal000 → real000) → LAUNDERED → HARD, never resolves. A transformation must never mint a credential.
// HISTORY / DO NOT RE-BREAK: r8's comment here asserted that "a raw twin ELSEWHERE in the clause can't
// launder it — the check is keyed to the label"; that was FALSE. r8 implemented `!rawMids.includes(x)`,
// a VALUE test over a flat array with positions DISCARDED, so it only ever caught a twin that was not
// itself `msg_id`-labelled. `β DECIDE (msg_id ｒｅａｌ０００); … not msg_id real000` passed CLEAN — the
// labelled twin rescued the folded occurrence. That is why the pairing is now by ORIGIN SPAN, and why
// a comment asserting an invariant the code does not hold is treated here as a defect (ED-292), not a
// documentation nit: the next reader reasons from it and builds the next bypass on top of it.
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
//   (h) DEEP MARKDOWN RENDER-SURFACE (r9 hunter HIGHs → β bounded-final DECIDE B/0.89, the SAME tech-bar
//       ceiling shape as the TR39/cross-script residual (a)/562ba5b6): a data-free line scanner cannot fully
//       match the CommonMark RENDER surface without a real CommonMark parser/renderer (a tech introduction
//       the decision-policy bars pre-mvp). r10 CLOSED the two BOUNDED/by-construction gaps within it — (1)
//       NUMERIC/HEX character references (decodeCharRefs, property-complete for &#N;/&#xH;) + the one named
//       entity that maps to a citation token (&beta;); (2) historyMask Setext + indented-ATX heading-close.
//       NOT closed (this ceiling) — ENUMERATED, not merely gestured at (r12 β rider C: a ceiling that says
//       only "render fidelity" is under-specified the SAME way "normalize" was, which is what produced the
//       r3→r4 category-chase; ED-286/ED-290 carry this list):
//         (h1) HTML5 NAMED entities beyond the single &beta;/&Beta; mapping — the full table is ~2,200
//              entries. The ones that matter for THIS enforcer are those decoding to a citation token or to
//              an id-payload character: e.g. &#946;-equivalents, and the ASCII-letter/digit-yielding refs a
//              receipt id could be spelled with. Numeric/hex refs ARE property-complete (decodeCharRefs);
//              named refs are a finite DATA TABLE, so this is a data-dependency call, not a parser one.
//         (h2) CommonMark SOFTBREAK — a citation split across two source lines (`β DECIDE` where `β` ends
//              line N and `DECIDE` begins line N+1) renders as ONE line joined by a space, but the scanner's
//              line model treats them as two lines and detects NO citation. The dangerous-BREAK flag does
//              NOT cover this: a plain LF is a legitimate CommonMark line-ending, so there is nothing
//              anomalous to flag. This is the widest remaining hole in the class and needs block-level
//              (paragraph-joined) scanning, not another character rule.
//         (h3) INLINE HTML TAGS — `β <span>DECIDE</span>` / `β DEC<!-- x -->IDE` render as a citation but
//              the tag/comment text sits in the scanned line, breaking the token. Stripping tags naively
//              would itself be a new bypass surface (a literal `<` in prose), so this needs real inline
//              parsing.
//         (h4) CommonMark BLOCK-structure fidelity (reference-style links, HTML blocks/comments, tables,
//              nested containers, code fences that should SUPPRESS a citation).
//       Exposure is LOW
//       and identical in shape to (a): it fools a RENDERED-view reader only (the enforcer + any raw-diff
//       reviewer see the raw &#…/weirdness), and requires write access to a canonical ADR/tracker/ROADMAP
//       (self-attack at solo pre-mvp). A CommonMark-renderer rewrite is its own Class-B ADR if ever built.
//       β STOP-CONDITION (562ba5b6-shape): a char/entity-level bypass that SHOULD be closed by construction
//       is in-scope; a render-fidelity nuance within THIS ceiling is covered — ship the GATE, not the
//       impossible full renderer. Codified by the r10 β-probe(a) test (a named entity != &beta; is not a
//       citation) + the char-ref/Setext teeth. Cross-ref ED-275, ED-289, 562ba5b6, and the render-surface ED.
//
// ───────────── IN-SCANNER DISCLOSED DEFECTS (NOT ceiling items) ─────────────
// These are IN-SCANNER BUGS, deliberately left open at pre-mvp on a report-only lint (β ESCALATE
// 9f4e7b21-3c86-4d90-b7a5-1e2f8c60d43b + supplement 3b8c5f47-2e91-4a06-8d73-c15e9f2a4b60; operator
// ruling 2026-07-28: SHIP r12 with disclosure). DISTINCT from the NORMALIZATION CEILING (a)-(h)
// above, every member of which is blocked on a renderer or on external data. These two are NOT
// renderer-blocked and a renderer would fix NEITHER — both are closable with machinery that already
// exists in this file. Do NOT re-file them under (h): doing so would encode the exact error β
// corrected, and the next reader would wrongly conclude a renderer is required.
//   (D1) CITATION-BOUNDARY RECEIPT MINT (ED-296, SCANNER-LOGIC class). CITATION_RE's lookbehind
//        `(?<![A-Za-z])` excludes ASCII LETTERS only — not digits, not id punctuation. A substring
//        such as `betaruled` INSIDE a receipt id, preceded by a DIGIT, opens a SECOND citation
//        inside the id token; the clause slice then truncates the receipt to its prefix, and where
//        that prefix is exactly a real ledger id, the forged token resolves clean.
//        Repro: `β DECIDE, msg_id real000betaruled` with ledger id `real000` -> scanned=2, hard=0,
//        --enforce exit 0, while the rendered doc cites an id ABSENT from betaEvents.
//        The exploit REQUIRES the real id to be a PREFIX of the forged token, which is why the
//        `real000-betaruled` control correctly HARDs. Fix direction: widen the lookbehind to
//        exclude digits and id punctuation, and validate the FULL id token against the raw span.
//   (D2) FOLD-BOUNDARY DETECTION KILL (ED-297, MECHANISM class — the sole trigger of the r12
//        terminal condition). The trailing `\b` and the leading lookbehind are asserted on the
//        NFKD-FOLDED detection text, so the fold ITSELF can MINT an ASCII word character that
//        destroys the boundary and hides the citation. `DECIDE` + U+00B9 (superscript one) folds to
//        `DECIDE1`, where `\b` sees word-char-to-word-char; U+1D43 (modifier letter a) + β folds to
//        `aβ`, where the lookbehind sees `a`. Repro: `β DECIDE<U+00B9> (msg_id fake123)` -> scanned=0,
//        exit 0 — the forged receipt is never scanned AT ALL. Also reachable via `&#xB9;` and via
//        U+FF3F -> `_`. Causation control: `β DECIDE±` -> scanned=1, so a NON-folding character does
//        NOT hide it; the fold is the cause. Exhaustive sweep: 1,943 code points are non-word,
//        non-stripped and non-space-mapped yet fold to an ASCII word char; 1,831 of them hide the
//        citation. Fix direction: assert boundaries in RAW space via the existing norm->raw index
//        map, not in folded space.
//   BOUNDED EXPOSURE (why these ship rather than block): ZERO of the 1,831 hiding code points are
//   invisible or blank-rendering by this module's own INVIS/SPACE_MAP classes — every one renders as
//   a VISIBLE glyph. A human reading the rendered document sees something odd, unlike the r6 NUL and
//   r7 bidi classes, which were silent. Combined with report-only default scope, /scan:full-only
//   invocation (never CI), a gitignored advisory ledger, and a GREEN that means "receipt PRESENT,
//   not authenticated" BY DESIGN (authenticity is ED-275), these are disclosed gaps rather than live
//   holes. Live-corpus delta is 0 across the 60-doc corpus for every shape — adversarial-only, not a
//   live regression. The mitigation travels WITH the finding: it is the first thing lost in a summary.
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
//     invisibles (\p{Cf}/\p{Cc}/\p{Default_Ignorable}, NOT \p{M} marks, NOT compat-fold) may be removed, and
//     (r12) the raw channel is sliced from the ORIGINAL PHYSICAL line so a character-reference decode cannot
//     mint one either. A captured (folded) id with NO raw receipt occurrence AT ITS OWN ORIGIN SPAN was
//     minted by a transformation -> LAUNDERED -> HARD, never resolves. NB the r7/r8 test was a "verbatim
//     substring / value membership" check; r12 replaced it with SPAN-anchored pairing, because substring
//     presence anywhere in the clause let an unrelated raw twin rescue a minted occurrence.
//     (writer-stamped-fields principle: a transformation must never mint a credential.)
const BIDI_RE = /[‪-‮⁦-⁩]/u;       // bidi overrides/embeddings/isolates — dangerous syntax, not ignorable
// r9 (hunter HIGH — line-split over-reach REGRESSION): r7/r8 split the doc on the full UAX#14 mandatory-
// break set (VT/FF/LS/PS/NEL) BEFORE detection. But those are NOT CommonMark line-endings (only LF/CR/CRLF
// are) — splitting on them diverges the enforcer's line model from the .md RENDER surface, so `β<FF>DECIDE`
// (which renders on ONE line) got split across two enforcer-lines and the citation was HIDDEN (scanned=0).
// FIX: split ONLY on CommonMark line-endings (LF/CR/CRLF) — so a non-CommonMark break inside a citation is
// SPACE_MAP-folded to a space and still detected — and treat the PRESENCE of a non-CommonMark break
// (VT/FF/NEL/LS/PS) on a scanned line as DANGEROUS SYNTAX (HARD, like bidi). That closes BOTH directions:
// the citation-split regression (now detected) AND the heading-mask attack (a break-hidden heading no longer
// silently masks an active citation — its presence is flagged). Non-CommonMark breaks ~never appear in legit
// ADR/tracker/ROADMAP prose (same rationale as bidi).
const LINE_SPLIT_RE = /\r\n|[\n\r]/; // CommonMark line-endings ONLY (LF/CR/CRLF)
const DANGEROUS_BREAK_RE = new RegExp("[\\u000b\\u000c\\u0085\\u2028\\u2029]", "u"); // VT/FF/NEL/LS/PS — non-CommonMark line/whitespace breaks (render-surface divergence)
// r10 (hunter HIGH — β DECIDE B/0.89 bounded-final): decode NUMERIC/HEX character references (&#NNN; / &#xHHH;)
// + the ONE named entity that maps to a citation token (&beta;), so a render-surface-encoded citation
// (`&#946; DECIDE` renders "β DECIDE" on GitHub) is detected. Composed BEFORE the NFKD skeleton (per β) so a
// numeric ref to a compat homoglyph (&#xFF24; = fullwidth D) folds through BOTH passes; and a numeric ref to
// an invisible/control/bidi (e.g. &#x202E;) decodes then hits the strip/dangerous-syntax checks. Numeric/hex
// is PROPERTY-COMPLETE (every code point uniformly, like NFKD closed the char class). The full HTML5
// NAMED-entity table + CommonMark block-structure render fidelity is the DISCLOSED render-surface ceiling (h)
// — closing it needs a real CommonMark renderer (a tech-bar dependency), out of scope pre-mvp.
// ── ED-286 r12 (backend HIGH, line 406) — INDEX-MAPPED TRANSFORMS ────────────────────────────────────
// r10/r11 assigned `const raw = decodeCharRefs(rawLines[i])`, so the variable NAMED `raw` held DECODED
// text and every downstream consumer — including the "raw" receipt channel `rawMids` — derived from it.
// A receipt id written as character references (`msg_id &#x72;&#x65;&#x61;&#x6c;&#x30;&#x30;&#x30;`)
// was therefore genuine raw ASCII (`real000`) by the time the anti-laundering check ran, and resolved
// CLEAN — the decode MINTED the credential, the exact failure r7 #2 exists to stop. FIX: the ORIGINAL
// physical line is kept as a genuinely undecoded, un-normalized channel, and every transform carries an
// INDEX MAP back to it, so a match found in transformed text resolves to the span in the ORIGINAL that
// produced it. MAP CONTRACT (uniform across every transform here, and matching normalizeForDetection's
// existing one): a map has length text.length + 1; map[i] = the ORIGIN UTF-16 index that produced unit
// i; map[text.length] is the end sentinel. Values are always ORIGIN CODE-POINT STARTS, so slicing an
// origin string by them can never split a surrogate pair (the astral-desync discipline, preserved).
const identityMap = (s) => { const m = new Array(s.length + 1); for (let i = 0; i <= s.length; i++) m[i] = i; return m; };
// COMPOSITION is pointwise and done at the two call sites in evaluate(): a norm offset resolves through
// normalizeForDetection's map to a `rendered` offset, and that through decoded.map to an ORIGINAL-line
// offset — i.e. origin = decoded.map[mapNorm[i]]. Kept inline (rather than behind a combinator) so the
// two coordinate hops are visible at the point where the spans are actually compared.
/**
 * Apply a GLOBAL regex to mapped text, keeping the index map aligned. Every unit of a replacement
 * inherits the ORIGIN of the match's FIRST unit — an INSERTED character (e.g. the RECEIPT_SEP_INVIS_G
 * boundary space) has no origin of its own, so it is anchored to where it was introduced.
 */
function mapReplace(text, map, re, repl) {
  let out = "";
  const omap = [];
  let last = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(text)) !== null) {
    for (let i = last; i < m.index; i++) { out += text[i]; omap.push(map[i]); }
    const r = repl(m);
    for (let k = 0; k < r.length; k++) { out += r[k]; omap.push(map[m.index]); }
    last = m.index + m[0].length;
    if (m[0].length === 0) { // zero-width match guard (mirrors the exec loops below)
      if (last < text.length) { out += text[last]; omap.push(map[last]); last++; }
      re.lastIndex = last;
      if (last >= text.length) break;
    }
  }
  for (let i = last; i < text.length; i++) { out += text[i]; omap.push(map[i]); }
  omap.push(map[text.length]);
  return { text: out, map: omap };
}
/** Per-CODE-POINT NFKD with an aligned map (same per-cp discipline as normalizeForDetection). */
function mapNFKD(text, map) {
  let out = "";
  const omap = [];
  let idx = 0;
  for (const cp of text) {                     // by CODE POINT (surrogate-pair-safe)
    const d = cp.normalize("NFKD");
    for (let k = 0; k < d.length; k++) { out += d[k]; omap.push(map[idx]); }
    idx += cp.length;                          // advance by the SOURCE cp's UTF-16 length
  }
  omap.push(map[text.length]);
  return { text: out, map: omap };
}
// ONE single-pass alternation (was three chained .replace() calls) so the decode can carry an index map.
// Single-pass is also the render-CORRECT reading: CommonMark/HTML do NOT re-decode a decode's output, so
// `&#x26;#946;` renders as the literal text "&#946;" — the old chained form decoded it twice, to "β".
const CHAR_REF_G = /&#[xX]([0-9a-fA-F]+);|&#(\d+);|&(beta|Beta);/g; // [xX]: CommonMark/HTML5 accept BOTH &#x…; and &#X…; (r11 hunter HIGH — uppercase-X was undecoded)
const NAMED_REFS = { beta: "β", Beta: "Β" }; // &beta; -> β (U+03B2, the citation token); &Beta; -> Β (U+0392 UPPERCASE) — a DISTINCT entity, case-correct per HTML5, NOT case-folded
/** Decode char-refs, returning { text, map } — map: decoded UTF-16 index -> ORIGINAL line UTF-16 index. */
function decodeCharRefs(s) {
  const src = String(s);
  return mapReplace(src, identityMap(src), CHAR_REF_G, (m) => {
    try {
      if (m[1] !== undefined) { const c = parseInt(m[1], 16); return c >= 0 && c <= 0x10ffff ? String.fromCodePoint(c) : m[0]; }
      if (m[2] !== undefined) { const c = parseInt(m[2], 10); return c >= 0 && c <= 0x10ffff ? String.fromCodePoint(c) : m[0]; }
      return NAMED_REFS[m[3]] !== undefined ? NAMED_REFS[m[3]] : m[0];
    } catch { return m[0]; }
  });
}
const RAW_ID_CLEAN_G = new RegExp("[*`~]|[\\p{Cf}\\p{Cc}\\p{Default_Ignorable_Code_Point}]", "gu"); // RAW id-payload cleaner: strip emphasis(keep _) + render-nothing ONLY (NO \p{M}, NO compat-fold)
// NB `src` is the RENDER-surface (char-ref-DECODED) line, never the original physical line — the caller
// composes this map with the decode map to land back on ORIGINAL offsets (r12).
function normalizeForDetection(src) {
  let norm = "";
  const map = []; // map[i] = src UTF-16 index that produced norm's UTF-16 unit i (UTF-16-aligned)
  let srcIdx = 0;
  for (const cp of src) {              // iterate the SOURCE by CODE POINT (surrogate-pair-safe)
    const cpLen = cp.length;           // 1 or 2 UTF-16 units in the SOURCE
    let out;
    if (EMPHASIS_RE.test(cp)) out = "";
    else if (SPACE_MAP_RE.test(cp)) out = " ";
    else out = cp.normalize("NFKD").replace(STRIP_INVIS_G, ""); // compat-fold + drop marks/format/controls/default-ignorables
    for (let j = 0; j < out.length; j++) { map.push(srcIdx); norm += out[j]; } // map PER UTF-16 UNIT of the fold
    srcIdx += cpLen;                   // advance by the SOURCE code point's UTF-16 length (astral-safe)
  }
  map.push(srcIdx); // sentinel: map[norm.length] === src.length (src's UTF-16 length)
  return { norm, map };
}
/**
 * Build a clause string for receipt extraction, carrying an index map back to the ORIGINAL line.
 * `fold=true`  => the CITED payload as a RENDERED reader sees it (per-cp NFKD compat-fold + \p{M}/\p{Cf}
 *                 strip). Built from the char-ref-DECODED clause.
 * `fold=false` => the RAW payload channel: NO NFKD, NO \p{M} strip — only emphasis + render-NOTHING
 *                 code points are removed. Built from the ORIGINAL PHYSICAL clause (r12), so neither a
 *                 compat-fold NOR a character-reference decode can mint a raw receipt.
 * Both paths apply the SAME blank/separator normalization (SPACE_MAP_G then RECEIPT_SEP_INVIS_G) in the
 * SAME order, so a legitimate receipt lands at the SAME origin offset on both — which is what makes the
 * span-anchored pairing in evaluate() sound.
 */
function buildClause(text, map, fold) {
  let cur = fold ? mapNFKD(text, map) : { text, map };
  cur = mapReplace(cur.text, cur.map, SPACE_MAP_G, () => " ");
  cur = mapReplace(cur.text, cur.map, RECEIPT_SEP_INVIS_G, (m) => m[1] + " ");
  cur = mapReplace(cur.text, cur.map, fold ? CLAUSE_STRIP_G : RAW_ID_CLEAN_G, () => "");
  return cur;
}
/**
 * Extract every `msg_id <id>` receipt from a clause as an OCCURRENCE: { id, origStart } where origStart
 * is the id payload's start offset in the ORIGINAL physical line. The origin offset — not mere value
 * membership — is what anchors a cited receipt to its own label position (r12 fix 2).
 */
function extractReceipts(clauseText, clauseMap) {
  const out = [];
  const re = new RegExp(MSGID_IN_TEXT_RE.source, "gid"); // `d` => exact capture offsets, no arithmetic
  let m;
  while ((m = re.exec(clauseText)) !== null) {
    if (MSGID_SHAPE_RE.test(m[1])) out.push({ id: m[1], origStart: clauseMap[m.indices[1][0]] });
    if (re.lastIndex === m.index) re.lastIndex++;
  }
  return out;
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
const HISTORY_LABEL_RE = /^(Session log|Change log|Changelog|History)\b/i;
function historyMask(lines) {
  const mask = new Array(lines.length).fill(false);
  let historyLevel = null;
  for (let i = 0; i < lines.length; i++) {
    // r10 (hunter HIGH — historyMask heading-recognition diverged from the CommonMark render surface):
    // recognize BOTH (a) ATX with 0-3 leading spaces (CommonMark allows the indent) AND (b) a Setext
    // underline (=+ -> H1, -+ -> H2) under a preceding non-blank, non-ATX text line. Bias FAIL-OPEN to
    // SCANNING: err toward CLOSING a history section (over-scanning a dated history line is at worst a
    // harmless SOFT; leaving an ACTIVE citation masked is a false-green — β DECIDE B/0.89).
    const atx = lines[i].match(/^ {0,3}(#{1,6})\s+(.*)$/);
    const setextUnder = /^ {0,3}(=+|-+)\s*$/.test(lines[i]) && i > 0 && lines[i - 1].trim() !== "" && !/^ {0,3}#{1,6}\s/.test(lines[i - 1]);
    if (atx) {
      const level = atx[1].length;
      if (historyLevel !== null && level <= historyLevel) historyLevel = null; // closed by a peer/higher heading
      if (historyLevel === null && HISTORY_LABEL_RE.test(atx[2].trim())) {
        historyLevel = level;
        mask[i] = true; // the heading line itself is history
        continue;
      }
    } else if (setextUnder) {
      const level = /^ {0,3}=+\s*$/.test(lines[i]) ? 1 : 2; // = -> H1, - -> H2
      const headingText = lines[i - 1].trim();
      if (historyLevel !== null && level <= historyLevel) {
        historyLevel = null; // a Setext peer/higher heading CLOSES the section
        mask[i - 1] = false; mask[i] = false; // un-mask the heading + its underline (they were the boundary)
      }
      if (historyLevel === null && HISTORY_LABEL_RE.test(headingText)) {
        historyLevel = level;
        mask[i - 1] = true; mask[i] = true; // a Setext-labeled history section
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
  for (const d of docs || []) {
    const rawLines = String(d.text || "").split(LINE_SPLIT_RE); // r7 #3: ALL Unicode line breaks, so a U+2028/U+2029/lone-CR-hidden peer heading still closes a history section
    const inHistory = historyMask(rawLines);
    for (let i = 0; i < rawLines.length; i++) {
      // r12 (backend HIGH): `origLine` is the ORIGINAL PHYSICAL line — the one genuinely undecoded,
      // un-normalized channel; `rendered` is the char-ref-DECODED RENDER surface. Nothing named "raw"
      // holds transformed text any more (the old `const raw = decodeCharRefs(...)` was itself the bug:
      // it made a char-ref-encoded receipt id real ASCII before the anti-laundering check ran).
      // DETECTION + the dangerous-syntax flags run on `rendered` (r10/r11 teeth: `&#946; DECIDE` and
      // `&#x202E;` must be seen as their decoded form); the RAW receipt channel runs on `origLine`.
      const origLine = rawLines[i];
      const decoded = decodeCharRefs(origLine); // { text, map } — map: rendered idx -> origLine idx
      const rendered = decoded.text;
      // DANGEROUS-SYNTAX checks (bidi + non-CommonMark break) run on EVERY line INCLUDING history-masked
      // ones (r9): a bidi control or a VT/FF/NEL/LS/PS break can mask the section BOUNDARY itself, so the
      // history skip (below) must skip only the CITATION scan, not these flags.
      // R2/S3 (r3 hunter HIGH — underscore-italic + zero-width citation BYPASS): DETECTION and
      // msg_id EXTRACTION need OPPOSITE treatment of `_`. Build a DETECTION-normalized line that strips
      // ALL inline emphasis (* ` _) AND zero-width/format unicode (U+200B–200D, U+FEFF), keeping an
      // INDEX MAP back to the RAW line — so "_β_ _DECIDE_" / "**β** **DECIDE**" / "βDECIDE" are all
      // detected — while msg_id EXTRACTION runs on the RAW clause (only * / backtick / zero-width
      // stripped, `_` PRESERVED) so an id like abc_def is never corrupted. (r2 kept `_`; that left the
      // identical bypass open for standard CommonMark underscore-italic — the r3 hunter HIGH.)
      // r7 #1 (security HIGH): a bidi control on a scanned line can visually reorder a hidden citation
      // ("β <RLO>EDICED<PDF>" renders "β DECIDE" but the logical/scanned order is "EDICED"). Bidi is
      // DANGEROUS SYNTAX, not ignorable — its PRESENCE is a HARD finding (a citation may be masked).
      if (BIDI_RE.test(rendered)) {
        hard.push({
          doc: d.path, line: i + 1, msg_id: null,
          reason: `bidi control (U+202A-202E / U+2066-2069) on a scanned line — rendering order differs from logical order, so a β-verdict citation may be visually MASKED (e.g. "β <RLO>EDICED<PDF>" renders "β DECIDE" while the scanner sees "EDICED"). Bidi overrides do not belong in prose ADR/tracker/ROADMAP; remove or justify. Line: ${rendered.replace(new RegExp(BIDI_RE.source, "gu"), "<BIDI>").trim().slice(0, 120)}`,
        });
      }
      // r9 (hunter HIGH): a non-CommonMark line/whitespace break (VT/FF/NEL/LS/PS) on a scanned line means
      // the .md render surface diverges from the enforcer's line model — a citation can be split-hidden
      // (`β<FF>DECIDE`) or a history heading masked. Detection folds it to a space (SPACE_MAP, so the split
      // citation is STILL detected on this un-split line), and its PRESENCE is flagged HARD (dangerous syntax).
      if (DANGEROUS_BREAK_RE.test(rendered)) {
        hard.push({
          doc: d.path, line: i + 1, msg_id: null,
          reason: `non-CommonMark line/whitespace break (VT U+000B / FF U+000C / NEL U+0085 / LS U+2028 / PS U+2029) on a scanned line — the markdown render surface differs from the scanned line model, so a citation can be split-hidden (\`β<FF>DECIDE\`) or a history-section heading masked. These do not belong in prose ADR/tracker/ROADMAP; remove or justify. Line: ${rendered.replace(new RegExp(DANGEROUS_BREAK_RE.source, "gu"), "<BREAK>").trim().slice(0, 120)}`,
        });
      }
      if (inHistory[i]) continue; // append-only history — skip the CITATION scan only (dangerous-syntax flags above already ran, incl. on history lines)
      const { norm, map: mapNorm } = normalizeForDetection(rendered);
      const starts = [];
      citationGlobal.lastIndex = 0;
      let cm;
      while ((cm = citationGlobal.exec(norm)) !== null) {
        starts.push(cm.index);
        if (citationGlobal.lastIndex === cm.index) citationGlobal.lastIndex++; // guard against a zero-width match loop
      }
      for (let c = 0; c < starts.length; c++) {
        scannedCitations++;
        // The clause spans this citation to the NEXT one (or line end), expressed in BOTH coordinate
        // systems: `rendered` (for the CITED payload) and `origLine` (for the RAW payload). decoded.map
        // relates them, so the two clauses always cover the same logical region of the document.
        const decStart = mapNorm[starts[c]];
        const decEnd = c + 1 < starts.length ? mapNorm[starts[c + 1]] : rendered.length;
        const origStart = decoded.map[decStart];
        const origEnd = decoded.map[decEnd];
        // CITED clause — what a RENDERED-view reader sees: char-ref-decoded, then NFKD-folded with the
        // SAME invisible/blank normalization DETECTION uses so the two paths cannot desync (ED-286 r5).
        // Order: (1) SPACE_MAP_G maps blank-rendering separators -> " " (a real \s); (2) RECEIPT_SEP_INVIS_G
        // turns an invisible run right after the `msg_id` label into a space so it can't abut the id after
        // stripping; (3) CLAUSE_STRIP_G strips remaining emphasis (except `_`), \p{M} marks and \p{Cf}
        // format so an obfuscated label/id de-obfuscates to ASCII (a legit underscore id ab_cd_ef survives;
        // ASCII is NFKD-invariant). Net: an invisible/blank-obfuscated forged receipt stays HARD instead of
        // being downgraded to a receiptless SOFT.
        const decClauseText = rendered.slice(decStart, decEnd);
        const decClauseMap = new Array(decClauseText.length + 1);
        for (let j = 0; j <= decClauseText.length; j++) decClauseMap[j] = decoded.map[decStart + j];
        const citedClause = buildClause(decClauseText, decClauseMap, true);
        const clause = citedClause.text;
        // ── r12 fix 2 (security HIGH, was line 501) — SPAN-ANCHORED, not value-membership ────────────
        // WHAT THIS GUARANTEES (r8's comment here claimed this and was FALSE — the security lane proved
        // a raw twin ELSEWHERE in the clause DID launder a folded occurrence, because the old test was
        // `!rawMids.includes(x)`, a VALUE test over a flat array with the positions thrown away):
        // every CITED receipt occurrence is paired to a RAW receipt occurrence at ITS OWN ORIGIN SPAN.
        // An occurrence is clean only if a raw-clean receipt starts at the SAME ORIGINAL-line offset AND
        // carries the SAME ASCII payload. Another raw `msg_id real000` later in the clause has a
        // DIFFERENT origin offset, so it can no longer rescue a minted occurrence — regardless of what
        // appears elsewhere on the line.
        // The RAW channel is built from `origLine` (r12 fix 1), NOT from decoded or folded text, and is
        // NOT compat-folded and does NOT strip \p{M} — only emphasis + render-NOTHING code points are
        // removed. So an id minted by ANY of the three transformations — character-reference decode
        // (`&#x72;&#x65;…` -> real000), compat-fold (fullwidth ｒｅａｌ０００ -> real000), or mark-strip
        // (ŕeal000 -> real000) — has no raw twin at its own span and is LAUNDERED -> HARD.
        const origClauseText = origLine.slice(origStart, origEnd);
        const origClauseMap = new Array(origClauseText.length + 1);
        for (let j = 0; j <= origClauseText.length; j++) origClauseMap[j] = origStart + j;
        const rawClause = buildClause(origClauseText, origClauseMap, false);
        const rawReceipts = extractReceipts(rawClause.text, rawClause.map);
        // R1 (gpt security+backend r2, HIGH — intra-clause laundering): validate EVERY msg_id in the
        // clause, not just the first. ANY cited receipt that does not resolve (or is laundered) → HARD.
        const cited = extractReceipts(citedClause.text, citedClause.map);
        if (cited.length === 0) {
          soft.push({
            doc: d.path, line: i + 1,
            reason: `load-bearing β-verdict citation with NO msg_id receipt — add the delivered verdict's msg_id (ED-239 conductor-side contract). Citation: ${clause.trim().slice(0, 120)}`,
          });
        } else {
          // Occurrence-anchored: same ORIGIN offset AND same payload — never a whole-clause value lookup.
          const isLaundered = (occ) => !rawReceipts.some((r) => r.origStart === occ.origStart && r.id === occ.id);
          const unresolved = cited.filter((occ) => isLaundered(occ) || !known.has(occ.id));
          if (unresolved.length) {
            const first = unresolved[0];
            hard.push({
              doc: d.path, line: i + 1, msg_id: first.id,
              reason: isLaundered(first)
                ? `β-verdict citation cites msg_id '${first.id}' that exists ONLY via a render/normalization transformation (character-reference decode, compat-fold or mark-strip minted it from an obfuscated payload — e.g. &#x72;… / fullwidth / accented id) and is NOT a raw ASCII receipt at that position — a transformation must never mint a credential (r7 #2, r12). Citation: ${clause.trim().slice(0, 120)}`
                : `β-verdict citation cites msg_id '${first.id}' which does NOT resolve to a betaEvents VERDICT row — unverified receipt (${unresolved.length} of ${cited.length} cited receipt(s) unresolved; forged/typo/stale). Citation: ${clause.trim().slice(0, 120)}`,
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
