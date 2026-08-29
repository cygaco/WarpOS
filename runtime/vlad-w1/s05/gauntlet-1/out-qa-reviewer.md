# qa-reviewer — DIAGNOSTIC gauntlet 1 — S-VLADW1-05 (in-process Agent lane, claude-opus-5)
HEAD verified 6c64021c5caac5ede075ede840bdade2383af74c.

VERDICT: S5-4 DISCHARGED — re-derived, mutation-differentiated, stated rule + stated limits.
S5-5 answered SEPARATELY on separate evidence; NOT reported as covered by S5-4 evidence.
Did NOT run run-battery.mjs; never loaded it. Own populations, own mutants, no simulation layer.

MUTANTS (3): M-EMPH (fold 8 disabled, L374), M-PREF (BLOCK_PREFIX -> bundle-G-only, L785),
M-CASE (case-closure loop removed, L337). Each target line read back OUT of the generated mutant file.

NO-OP=>FAIL GUARD PROVEN BOTH SIDES. Negative: a mutation targeting an absent literal returned
0 occurrences / changed:false / identical behaviour -> treated as FAIL. Positive: per-mutant behaviour
probes moved. THE GUARD CAUGHT A REAL DEFECT IN ITS OWN WORK: the first M-PREF mutant was malformed
(heredoc collapsed \s to s), still DIFFERED from built (25/43 rows moved) so a diff-only guard would
have passed it; caught by reading the mutated line back. Corrected run = 15/43. LESSON: "the two runs
differed" is insufficient; the mutant source must be read back.

CLASS 1 EMPHASIS - rule: exhaustive over stated finite domain M x S (6 markers x 12 spans) = 72 + 2 controls.
  With fold (8) removed, 30 of 72 authorings NOT matched by containsStatusToken; with it present they ARE.
  Those 30 = spans S02-S07 x markers * ** _ __ backtick.
  42 cells AGREE (6 whole-token, 6 tilde, 30 mid-word) - reported, not hidden.
  DOCUMENT LEVEL: S08/S09/S11/S12 x all 6 markers produce ZERO violations - the document lints clean
  with ASS**ERTED** - NOT VERIFIED sitting in the Proven section.
  Rule does NOT reach: HTML/<b>/<em>/LaTeX markers; asymmetric emphasis; nested emphasis; the other 14
  internal split points; emphasis x homoglyph/zero-width combinations; the PROVEN token axis.

CLASS 2 PREFIXES - rule: one authoring per CommonMark/GFM block-starter class x {with,without canonical
trailing space} U one per BLOCK_PREFIX alternation branch U near-misses just outside each U 3 nestings = 43.
  With BLOCK_PREFIX reverted to bundle-G form, 15 of 43 NOT recognised; with bundle-N form they ARE.
  EVADES (0 violations at document level): P03 "#" no-space, P10/P11 dingbats outside hand-list,
  P17 "|" no-space, P20 "</div>", P21 "<!-- -->", P29 "Note:" no-space, P30 two-word label,
  P31 hyphenated label, P33 "---", P34/P35/P36 backtick/tilde fences (disclosed, pinned Q-1),
  P37 "[^1]: ", P41 arbitrary prose (general ceiling), P42 emoji+VS16.
  Rule does NOT reach: 4+ stacked classes; non-ASCII bullets beyond 2 sampled; non-Latin Ps/Pi members;
  prefixes inside the lead-in.

CLASS 3 HOMOGLYPHS - (3a) exhaustive over tokenAlphabetDomain() x {upper,lower} = 30 cells, candidate
glyphs taken from CONFUSABLE_FOLD itself. (3b) EXHAUSTIVE over the 5 disclosed-unfolded script blocks:
547 code points scanned, ZERO are keys of CONFUSABLE_FOLD. CUSTODY.md's "NOT folded here AT ALL, at any
letter" is EXHAUSTIVELY VERIFIED over those blocks, not sampled.
  With the case-closure removed, lower d/f/t in the token and lower g in Ceiling are NOT matched; with it
  present they ARE. getTokenAlphabetCoverage moves 12 covered -> 8.
  CUSTODY.md item (3) figures reproduce EXACTLY (15 domain, 12 covered, n claimedElsewhere, L/R noCandidate).
  Rule does NOT reach: Georgian/Ethiopic/Canadian-Syllabics/Vai/Osage/Adlam/Tifinagh; genuine UTS#39
  confusability; multi-letter + emphasis/prefix combinations; WHETHER CONFUSABLE_FOLD IS COMPLETE for
  Cyrillic/Greek (coverage answers "at least one glyph maps", not "every confusable is mapped").

S5-5 SEPARATE: Evidence A = repo's own suite 107/107 at 6c64021 (committed falsifiers observed).
Evidence B = this lane's 3 independent mutants. NEITHER discharges the other; stated explicitly.

FINDINGS
F-QA-01 MEDIUM granularity: "ONE remains OPEN" is a ROW count beside a CLASS mechanism - measured open
  cell is the whole mid-word placement class (5 placements x 6 markers = 30 authorings, none matched,
  zero document violations). Same shape bundle O corrected for CONFUSABLE_FOLD.
F-QA-02 MEDIUM: the accident class is broader than the one row credited - 12 of 72 cells close without
  fold (8), via TWO mechanisms: (a) ~~ at EVERY span (tilde in SEPARATOR_VARIANCE), (b) whole-phrase
  wrapping in ALL SIX markers. Document names one accident where there are two mechanisms.
F-QA-03 MEDIUM: a valid GFM table row ships an unbound Ceiling silently. BLOCK_PREFIX's table branch
  requires a trailing space; GFM does not. "|**Ceiling - a residual.**|" -> 0 violations. CUSTODY.md
  L55-56 lists table-cell delimiters with no space qualification.
F-QA-04 MEDIUM: the label alternative is narrower than described in three ways, none disclosed - no
  space after colon, two-word label, hyphenated label; all 0 violations.
F-QA-05 LOW: the trailing-separator requirement is a systematic partly-undisclosed narrowing.
F-QA-06 LOW: the CLI success line pairs an unequal count (15 derived vs 16 canonical) with the words
  "byte-for-byte"; the 16th carries only Rule 4b's substring check. scripts/ ships, so this is shipped.
F-QA-07 LOW: A1's live measurement is an off-by-one under a strict reading of "transitive" (109 = closure
  including the direct dep; 108 transitive).
F-QA-08 LOW: the L/R unmappable belief has concrete refutation CANDIDATES - U+04C0 / U+04CF PALOCHKA for
  lower l, and Cyrillic g U+0433 for r; all survive the transform unchanged. Cannot settle without UTS#39;
  the hedge holds, recorded so the belief is checkable.

VERIFIED TRUE (evidenced, not assumed): Rule 4b append ceiling and its contrast with derived paragraphs;
backtick/tilde pinned-not-repaired disclosure; package.json#files ships exactly one test; both entries hold
exactly one static import; S06-F01 reproduces at the quoted lines; shipped CUSTODY.md 0 violations exit 0;
suite 107/107; BLOCK_PREFIX no catastrophic backtracking; the comma/semicolon/period separator residual.

files_i_could_not_see: engine/test/custody-claim-lint.test.js (2561 lines) GREPPED not read - LOAD-BEARING:
cannot confirm the committed tests assert in the direction their names claim; S5-4 conclusions stand
(independent of that file), S5-5 Evidence A does not. model-seam.js L102+L446-464 only. spawn-shim.js 5 lines.
bootstrap.js 2 lines. package-lock.json programmatically. READ END TO END: custody-claim-lint.js 1900/1900,
CUSTODY.md 589/589.

execution_proven: all three class populations at unit AND document level; all three mutants; the 547-cp scan;
the lint (exit 0) and suite (107/107); Rule 4/4b append-reword-delete; ReDoS probes. Two runs DIFFERED per
class: 30/72, 15/43, 3/30+1. No-op guard proven on BOTH sides.

read_outside_the_quoted_region: for F-QA-02 the load-bearing fact (tilde in SEPARATOR_VARIANCE) sits ~20
lines above the quoted region IN A DIFFERENT NUMBERED ITEM; reading only item (4) would have reported the
strikethrough accident as the only accident. For F-QA-03/04/05 read BLOCK_PREFIX's 65-line block comment
(L720-785) which is WHY F-QA-05 is LOW and F-QA-03 is MEDIUM. For F-QA-06 the derived/non-derived
distinction sits ~850 lines above the quoted output string. For class 3 the "covered = at least one glyph"
limit is visible only at rawLetterCoverage L1766-1773, not in the prose.
