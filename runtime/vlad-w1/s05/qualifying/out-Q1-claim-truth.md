{"verdict":"fail"}

This lane found multiple current falsehoods. The strongest are wrong-unit closure claims, an incomplete transform description, and two claims contradicted by the committed tests themselves.

Population rule: I graded every current-tense sentence in CUSTODY.md that directly describes `custody-claim-lint.js`, one of its rules/functions/constants, or its committed tests. I did not grade claims about the other custody enforcers or the four-file audit. Historical provenance is listed separately as cannot-determine.

Sentence grades, in file order:

S01 — L6 — “`scripts/checks/custody-claim-lint.js` checks this file on every run.”

Would require every invocation to read CUSTODY.md.
false — CLI `main()` accepts `process.argv[2]`, and the exported lint accepts arbitrary supplied content. The package’s `check:custody` invocation uses the default file, but the sentence says every run without that qualifier.

S02 — L7-11 — “EVERY Asserted paragraph … and EVERY paragraph led by a bolded `Ceiling` … [is derived and bound].”

Would require the enumerated unit to be semantic Asserted/Ceiling paragraphs.
false — the actual unit is a blank-line block beginning at column 1 with literal `**A<n> — ` or `**Ceiling — `, plus a finite resemblance predicate. Four independently constructed additions each produced `ok:true`, zero violations:

- `A9 — …`
- `<b>A9</b> — …`
- `▪ **Ceiling — …**`
- `|**Ceiling — …**`

Rule for this probe population: each item fits one noun class named by the sentence but misses one actual grammar requirement. This population does not claim to enumerate every evasion.

S03 — L12 — “every Proven claim carries its clause id, and nothing conflates the two sections.”

Would require enumeration of semantic Proven claims and complete conflation detection.
false — Rule 1 enumerates only `###` headings and checks only a `P1`–`P4` prefix. Rule 3 recognizes fixed status-token and rollup shapes. The committed suite affirmatively verifies that comma-, semicolon-, and period-separated forms of the Asserted status remain unmatched in Proven prose.

S04 — L13-17 — a passage is byte-bound iff it belongs to the derived population or is item (3), and “everything else … is NOT bound byte-for-byte.”

Would require those two sets to exhaust every byte-bound passage.
false — Rule 2b separately byte-binds three `SANCTIONED_CARRIER_NOTE` sentence segments. Runtime inspection returned 15 derived paragraphs, 16 canonical paragraph entries, and three carrier sentences, none of which is a derived paragraph.

S05 — L24-27 — P-clause headings are not byte-bound; Rule 1 checks only that the heading starts with its P-tag.

Would require arbitrary post-tag heading text to remain unconstrained.
true — replacing the complete P2 heading with `### P2 - Raw launches are permitted without restriction` changed the input but produced `ok:true`, zero violations.

S06 — L27-29 — the Proven/Asserted section preambles are not byte-bound.

Would require an arbitrary non-forbidden preamble edit to remain unchecked.
true — an in-memory Proven-preamble replacement produced `ok:true`, zero violations.

S07 — L29-36 — the named unmarked P-body blocks, metadata, audit disclosure, A1 measurement, and A5 commentary have no stored canonical copy.

Would require those specific unmarked blocks to be absent from `BOUND_PARAGRAPHS` and the carrier bind.
true — verified against the entire canonical map and Rule 2b. This does not mean every block located under P1–P4 is unbound; marked Ceiling blocks are bound.

S08 — L36-38 — A5 is a hybrid: its `**A5 — …**` paragraph is pinned, its three carrier-note sentences are pinned, and surrounding commentary is not.

Would require three distinct mechanisms/scopes.
true — `BOUND_PARAGRAPHS.A5`, `CARRIER_NOTE_BOUND_SENTENCES`, and the unbound surrounding prose match that description.

S09 — L40-45 — item (3) is bound by `TRANSFORM_DESCRIPTION_KEY`/Rule 4b but is not derived.

Would require its key to be canonical yet absent from `extractBindableParagraphs`.
true — observed directly.

S10 — L50-56 — Rule 4b checks every canonical entry’s matched span for a following block boundary.

Would require iteration over all canonical entries plus `endsAtBlockBoundary`.
true — source inspection and the executed RF-Q1 append tests establish this behavior.

S11 — L56-60 — the boundary change did not add item (3) to the derived population.

Would require item (3) still to have no canonical A/Ceiling marker.
true.

S12 — L64-73 — after “any” listed block/wrapping prefixes are stripped, a qualifying line is a candidate and “never silently skipped.”

Would require the prefix unit to be the named structural classes.
false — `BLOCK_PREFIX` contains a hand-enumerated bullet set and whitespace-sensitive alternatives. The square-bullet, circled-order-marker, and no-space table-delimiter probes returned `null`; the full lint emitted no violation for the corresponding new paragraphs.

S13 — L79 — the three previously named closed-emphasis/list/blockquote shapes are candidates now.

Would require those exact shapes to reach the predicate.
true — executed by the committed suite.

S14 — L80-83 — the prefix strip was widened to the “fuller class” of headings, table cells, HTML tags, wrapping punctuation, and labels.

Would require closure at those class granularities.
false — it handles the grammars actually encoded, not the whole named classes. Unicode bullets outside `[-*+•‣◦]`, circled order markers, and `|` without following whitespace remain outside it.

S15 — L83-90 — backtick- and tilde-emphasized lead-ins are now recognized.

Would require `EMPHASIS_RUN` to include both characters and the production predicate to use it.
true — six committed Q-1 variants executed successfully.

S16a — L92-96 — three residual classes are pinned so complete closure of one makes a test fail.

Would require at least one witness from each class to be asserted as still unmatched.
true.

S16b — L96-110 — bare lead-ins, named non-Cyrillic/Greek confusables, and HTML `<b>`/`<strong>` lead-ins remain invisible for the stated reasons.

Would require each described current witness to return `null`.
true — the committed residual tests executed.

S16c — L111-113 — those pins disclose persisting gaps; they do not repair them.

Would require the current predicate still to miss the pinned witnesses.
true.

S17 — L115-116 — “The rollup rule matches a named lexical family: digit-form counts, and the word `all`.”

Would require those units to be digit-form counts and `all`.
false — the actual units are much narrower: `N / M` or `N of M` followed within 40 characters by selected nouns, and `all … controls|claims … verified` within fixed windows. Many digit counts and uses of `all` are not enumerated.

S18 — L123-127 — the only-surface rule “matches exhaustiveness PHRASES” and “A count standing inside a bound paragraph is not checked.”

Would require an exhaustiveness-phrase unit and no other lint rule inspecting counts there.
false — the rule matches only `only … place|surface`; additionally, Rule 3 scans every physical line, including bound paragraphs, for its numeric aggregate shape. `5 of 8 controls verified.` produced `aggregate-count-conflation`.

S19 — L131-132 — “Every token comparison in the lint renders BOTH sides through … `canonicalizeClaimText`.”

Would require every token-bearing predicate to call the transform on text and expected token.
false — section headings, P-tags, canonical paragraph markers, and several regex expectations are raw comparisons. Replacing the real `## Proven` heading with `## Pro<U+200B>ven` produced `missing-proven-section`, proving that token was not canonicalized.

S20 — L132-137 — “It applies, in order:” followed by NFKD, ignorables, marks, confusables, dash/minus, whitespace, and case.

Would require that to be the exhaustive ordered transform.
false — the implementation also applies fold (8), markdown emphasis, between the dash and whitespace folds, and `DASH_CLASS_PATTERN` additionally includes U+30FC. Direct probes produced `canonicalizeClaimText("**Alpha**") === "alpha"` and `canonicalizeClaimText("A\u30FCB") === "a-b"`.

S21 — L137-139 — NFKD exposes combining marks for subsequent deletion.

Would require normalization before `\p{Mn}` deletion.
true.

S22 — L139-142 — default-ignorables are deleted by Unicode property rather than a hand-list.

Would require `\p{Default_Ignorable_Code_Point}`.
true.

S23 — L142-147 — confusables are enumerated, while dash-category closure is property-based; coverage must be stated per token-alphabet letter.

Would require a map-based confusable fold and emitted letter domain.
true. The dash matcher also carries two explicitly added non-`\p{Pd}` characters.

S24 — L150-152 — “no check in this tree calls [getTokenAlphabetCoverage()] to verify the numbers in THIS paragraph.”

Would require no test to call the function and assert the paragraph’s 15/12/n/L/R accounting.
false — tests L2403-2450 call it and assert exactly: domain 15, covered 12, lower-case `n` claimed elsewhere, and `L`/`R` no-candidate. The narrower statement “no check parses this paragraph and compares its bytes to the return value” is true, but that is not what this sentence says.

S25 — L152-154 — the paragraph and canonical copy are hand-maintained literals.

Would require no generation from the live coverage function.
true.

S26 — L154-157 — “the two hand-typed copies can drift from each other … without anything here noticing.”

Would require no direct copy-to-document binding.
false — changing only CUSTODY.md’s `NFKD` wording produced `bound-paragraph-missing`. The two copies can jointly drift from the live function, but they cannot drift from each other silently.

S27 — L158-170 — the current alphabet and coverage sets are 15 total, 12 both-case, lower-case `n` claimed by `v`, and `L`/`R` no-candidate.

Would require an exhaustive emitted partition over the derived finite domain.
true — the executed O-1 tests re-derived and asserted the itemized sets.

S28 — L171-174 — “item (1) above names the full class” of prefixes stripped before resemblance testing.

Would require the prefix matcher to close each named class.
false — same counterexamples as S12/S14.

S29a — L174-178 — the multiword status comparison permits empty runs of dash, colon, tilde, pipe, slash, or whitespace and excludes comma/semicolon/period.

Would require the documented token pattern.
true.

S29b — L179-182 — allowing an empty separator also refuses the bare three-word adjacency in ordinary prose.

Would require the adjacency to match the status token.
true — executed by the suite.

S29c — L182-183 — NBSP is collapsed by the transform’s whitespace fold.

Would require JavaScript `\s+` after the earlier folds.
true.

S30 — L185-188 — fold (8) replaces runs of `*`, `_`, backtick, or `~` with a space before Rule 3’s status comparison.

Would require the exported four-character pattern on the production path.
true.

S31 — L188-192 — there is “ONE documented opt-out (`resemblesBindableLeadIn`)” and that is the full call-site population.

Would require no other runtime route to disable emphasis folding.
false — `statusTokenPattern` and `containsStatusToken` forward the public `emphasisFold` option to additional transform calls. The committed tests invoke `containsStatusToken(..., {emphasisFold:false})`; direct execution showed the default matched a formatted token while the opt-out did not.

S32 — L192-198 — `EMPHASIS_RUN` and `BOLD_LEAD_IN` are separate mechanisms not routed through fold (8).

Would require independent regex parsing.
true.

S33a — L200-204 — six listed emphasis authorings close specifically because of fold (8).

Would require each to be unmatched with the fold disabled and matched by the default.
true — executed.

S33b — L205-207 — whole-phrase strikethrough was already matched independently through separator variance.

Would require it to match even with emphasis folding disabled.
true — executed.

S33c — L208-212 — mid-word bold remains unmatched because emphasis becomes a space rather than being deleted.

Would require both default and no-fold paths not to match.
true — executed.

S34 — L421 — a bound paragraph has a second shipped copy in the lint, so it cannot truthfully claim CUSTODY.md is its only shipped disclosure surface.

Would require both `scripts/` and CUSTODY.md to ship and the paragraph to be canonicalized in the lint.
true — package.json L31-36 and the canonical map establish both.

S35 — L498-500 — A1–A4 are checked byte-for-byte modulo whitespace against stored copies.

Would require all four canonical strings to be tested on every aggregate lint call.
true.

S36 — L526-529 — the lint imports `SANCTIONED_CARRIER_NOTE` directly and checks its three sentences against CUSTODY.md.

Would require a live import, sentence split, and aggregate invocation.
true.

S37 — L579-582 — Rule 2b binds all three sentence-split segments.

Would require `CARRIER_NOTE_BOUND_SENTENCES === CARRIER_NOTE_ALL_SENTENCES`.
true — executed.

what_i_could_not_assess:
- The historical provenance and chronology claims at L18-23, L26-29, L47-50, L75-86, and L148-150. Current behavior or recreated mutants often agree, but these bytes do not prove that a named earlier run, draft, or commit actually behaved as reported.
- The canonical `node --test test/custody-claim-lint.test.js` runner could not start its child process in this sandbox (`spawn EPERM`). Running the test module directly executed all 117 registered tests successfully.

files_i_could_not_see:
- Assigned surface: none. CUSTODY.md L1-619, custody-claim-lint.js L1-2080, and custody-claim-lint.test.js L1-2862 were read end to end.
- Incidental, sampled only and not relied upon for a finding: `scripts/checks/verified-by-resolver.js` L36; `test/custody-static.test.js` L677; `scripts/checks/lib/ship-set.js` L10, L21, L26; `test/branding.test.js` L6; selected `check:custody` hits in `test/a5-wiring.test.js`, `test/ship-set.test.js`, `scripts/checks/branding-identity-enforcer.js`, and `scripts/checks/a5-wiring-presence.js`.
- package.json was subsequently read end to end.

execution_proven:
- `node scripts/checks/custody-claim-lint.js`: exit 0; 4 Proven headings, 15 derived paragraphs, 16 canonical paragraph entries, 3 carrier sentences, 0 violations.
- `node test/custody-claim-lint.test.js`: exit 0; 117 passed, 0 failed.
- Independently run current-behavior claims: S02, S05, S06, S09-S10, S12-S16, S18-S20, S24, S26-S31, S33, S35-S37.
- Reasoned from source without a separate bespoke execution: S01, S07-S08, S11, S17, S21-S23, S25, S32, S34.
- No historical execution claim was phrased as observed by this lane.

what_would_confirm_or_refute:
- Historical L18-23/L47-50/L75-86/L148-150: inspect the exact earlier commit bytes and contemporaneous raw command output identified by those sentences, then rerun the stated mutants at that checkout.
- Historical L26-29: a preserved raw invocation showing the exact substituted heading/preamble and exit status would confirm the event. This lane only confirmed that equivalent mutations still exit 0 now.
- No current-mechanism sentence was left cannot-determine.

read_outside_the_quoted_region:
- S01: lint L79-87 and L2028-2079; package.json L9-16.
- S02-S04: lint L493-609, L612-1209, L1866-1891; tests L77-168, L819-1168, L1500-1630, L2134-2295, L2611-2862.
- S05-S06: lint L382-481 and L1473-1634; tests L192-239 and L448-540.
- S07-S11: lint L493-609, L984-1209, L1866-1891; tests L245-383, L884-1025, L2611-2767.
- S12-S16: lint L673-982; tests L1035-1168, L1500-1630, L2134-2295, L2770-2862.
- S17-S18: lint L1320-1471 and L1705-1860; tests L403-540, L698-750, L1645-1799.
- S19-S33: lint L88-380, L1212-1471, L1473-1556, L1705-1860, L1895-2020; tests L1170-1260, L1341-1631, L1801-2131, L2395-2609.
- S34: lint L1060-1078 and L1705-1860; package.json L31-36; tests L1645-1799.
- S35: lint L493-525, L984-1209, L1873-1891; tests L245-287, L884-1025.
- S36-S37: lint L74-77, L529-609, L1873-1885; tests L289-383.