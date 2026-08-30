> **CONDUCTOR NOTE — one redaction, and nothing else.** This file is lane Q3's VERBATIM return. The
> single change is on the line below: the machine-specific absolute path of its dedicated checkout was
> replaced with `<Q3-CHECKOUT>` to satisfy the framework-purity guard (`abs_path`), which refuses to
> commit machine paths. **No finding, number, verdict or field was altered.** The path was
> `.worktrees/q3-teeth` in the vlad project.

{"verdict":"pass"}

**Lane:** Q3 (do the tests have teeth). **Checkout verified:** `<Q3-CHECKOUT>`, dedicated (confirmed via `git worktree list`: this path, `.worktrees/engine-lane`, and the primary checkout are three distinct entries), detached HEAD at `417147d18ef00ecd38655b55251d40c591323285` (measured with `git rev-parse HEAD`, matches the pinned commit exactly), clean at start (`git status --porcelain=v1` empty).

## Population derivation

`git diff --name-status 6c64021 417147d -- engine/` → 4 files: `engine/CUSTODY.md` (M, prose), `engine/scripts/checks/TRANSFORM-ROUTING.md` (A, new doc), `engine/scripts/checks/custody-claim-lint.js` (M, source), `engine/test/custody-claim-lint.test.js` (M, test). Only one test file changed, so I read its diff in full (441 lines) and matched each new/changed `test(...)` block against the corresponding source diff (294 lines) to identify the mechanism it claims to protect. That gave me four mechanisms with dedicated new tests, plus two tests (RF-Q1's flipped assertions) whose *assertion direction* changed on an existing test name.

**What this derivation misses:** (1) I trusted plain `git diff --name-status` without `--find-renames` explicitly — no renames were flagged, but I didn't double-check that assumption. (2) I grepped for other files referencing `custody-claim-lint` and found `test/a5-wiring.test.js`, `test/branding.test.js`, `scripts/checks/a5-wiring-presence.js`, `scripts/checks/branding-identity-enforcer.js` — these were NOT changed this round (not in the diff) and I did not run them or check whether my mutations would have perturbed them; they weren't part of "tests added or changed" so I left them out of scope, but a mutation with wider blast radius than the diff shows is a real thing my file-diff-only derivation can't see. (3) `engine/scripts/checks/TRANSFORM-ROUTING.md` (new, 194 lines) is not referenced by any test or check I could find (`grep -rn "TRANSFORM-ROUTING" test/ scripts/checks/*.js` → nothing) — it's a doc with no enforcer, out of scope for a teeth check but worth flagging. (4) I did not audit fixtures loaded at runtime beyond what the tests themselves construct (`DEFAULT_CUSTODY_PATH`, `readFileSync`, `buildCleanFixture()` — all inline/in-file, nothing external).

## Environment note (had to fix to execute at all)

`node --test` failed immediately with `ERR_MODULE_NOT_FOUND: @anthropic-ai/claude-agent-sdk` — this checkout ships no `node_modules`. `custody-claim-lint.js` imports `SANCTIONED_CARRIER_NOTE` from `../../src/model-seam.js`, which imports `query` from the SDK package at module top level, so the import graph fails before a single test runs. I did **not** run `npm install` (forbidden). Instead I created a minimal local stub at `engine/node_modules/@anthropic-ai/claude-agent-sdk/{package.json,index.mjs}` exporting a `query()` that throws if called — sufficient only to satisfy module resolution; `query` is never invoked by anything in the custody-claim-lint population. This is a mutation to my checkout; it is now fully removed (`rm -rf node_modules`), confirmed by `git status --porcelain=v1` returning empty and `git diff 417147d --stat` returning empty after removal. Flagging this because a lane running this file must clear the same blocker, and a fake/mocked SDK sitting in place during any of my mutation runs is itself something a reader should be able to audit — it never touched `custody-claim-lint.js`'s logic, only satisfied an unrelated import.

## Baseline, measured

`node --test test/custody-claim-lint.test.js`: **117 tests, 117 pass, 0 fail.** (Full suite `test/*.test.js`: 394 tests, 391 pass, 3 fail — failures in `test/mcp-surface.test.js` and `test/quota.test.js`, both outside this round's diff and outside my population; I did not investigate further since they're not this sprint's changed tests, and they may simply be reacting to my stub SDK.)

## Per-test mutation results (all four RUN, not reasoned)

**1. F1 — `findForbiddenClaimHits` canonicalization routing fix.**
Protects: forbidden-claim phrase matching (`guaranteed`, `cannot leak`, etc.) surviving ZWSP/homoglyph obfuscation, by routing the line through `canonicalizeClaimText` before pattern-matching.
Mutation: no-op'd the canonicalize call — `const canonical = line;` (raw line, exact pre-fix shape).
Observed: `node --test` → **RF-F1 RED** and **RF-F1 RED, through the real production call paths** both FAIL under the mutation (2 failures, 115/117 pass). Restored; `git diff --stat` on the file empty afterward.
Verdict: **has teeth.**

**2. F1-ROLLUP — `findLabelSeparationViolations` per-line canonicalization for `AGGREGATE_COUNT_PATTERN`/`WORDED_ROLLUP_PATTERN`.**
Protects: the same ZWSP-class obfuscation evading aggregate-count/worded-rollup detection.
Mutation: no-op'd the per-line canonicalize — `const canonicalLine = lines[i];` (raw line).
Observed: **RF-F1-ROLLUP RED** FAILS under the mutation (1 failure, 116/117 pass). Restored; diff empty afterward.
Verdict: **has teeth.**

**3. F2 — `EMPHASIS_RUN` widened from `/^[*_]+/` to `` /^[*_`~]+/ `` (backtick/tilde recognition).**
Protects: a backtick- or tilde-emphasised lead-in (`` `Ceiling` — `` / `~Ceiling~ —`) no longer silently evading `resemblesBindableLeadIn`.
Mutation: reverted the regex to `/^[*_]+/` (the exact pre-fix alphabet).
Observed: **Q-1 CLOSED** FAILS under the mutation (1 failure, 116/117 pass). Notably, **Q-2 PINNED stays green** under this same mutation — direct evidence the two tests are isolating genuinely different code paths (Q-2's HTML-tag gap is unaffected by the EMPHASIS_RUN alphabet), not a duplicate assertion dressed up as two tests. Restored; diff empty afterward.
Verdict: **has teeth.**

**4. F3/Task 4 — Rule 4b (`findBoundParagraphPresenceViolations`) block-boundary check (new `bound-paragraph-appended` violation via `locateBoundParagraphSpan`/`endsAtBlockBoundary`).**
Protects: text appended immediately after a bound paragraph's own words (inside the same block) being invisible to a plain substring-presence check.
Mutation: no-op'd the whole added branch — `if (false && span && !endsAtBlockBoundary(...))` — the strongest form of the no-op guard (this exact condition can now never fire; behaviorally identical to Rule 4b before this round).
Observed: both **RF-Q1 CLOSED** and **RF-Q1 CLOSED, uniformity** FAIL under the mutation (2 failures, 115/117 pass) — confirming the uniformity test genuinely exercises Rule 4b directly for the DERIVED (Ceiling) key too, not only through Rule 4 one layer up. Restored; diff empty afterward.
Verdict: **has teeth.**

**Q-2 PINNED (HTML bold/strong lead-in) — assessed differently, disclosed, not mutation-tested the same way.**
This test is structurally inverted from the four above: it pins a *disclosed, still-open* gap (asserts `resemblesBindableLeadIn('<b>Ceiling</b> —')` is still `null`), rather than protecting a fix that was shipped this round. There is no mechanism to no-op — the "protection" it offers is anti-staleness (it will go RED the day someone closes the gap without updating it). I confirmed it runs against the real, unstubbed production function and is logically independent of F2 (see mutation 3's cross-effect above). I did not attempt to construct a hypothetical "close the HTML-tag gap" code change to see if it would then correctly flip RED — that would mean writing new detection logic (not removing an existing one), which is a different exercise than this brief's removal-based procedure, and the source comment itself discloses this gap is real by construction (BLOCK_PREFIX consumes the `<b>` tag before the opener check ever runs, verified by reading the code at lines ~785-820 and ~888-895). I'm not counting this as a "no teeth" finding — it's a category the brief's procedure doesn't cleanly cover, and I'm saying so rather than forcing a verdict.

## Required fields

- **what_i_could_not_assess:** Q-2's teeth in the strict removal sense (see above — no mechanism to no-op; the test protects against silently closing a gap, not against silently reopening a fix). Whether `test/a5-wiring.test.js`, `test/branding.test.js`, or the two check scripts referencing `custody-claim-lint` by name would be affected by any of my four mutations — not run, not in this round's diff. Whether `TRANSFORM-ROUTING.md`'s claims are accurate — no enforcer found, not a test-teeth question but flagged.
- **files_i_could_not_see:** None fully unread — I read the complete diffs of both changed files (test + source) rather than sampling regions. I did NOT read `engine/CUSTODY.md`'s full diff line-by-line (skimmed only the `git diff --stat` summary and the matching `BOUND_PARAGRAPHS[TRANSFORM_DESCRIPTION_KEY]` prose block inside the source diff, which showed the corresponding correction) — I did not independently re-read the whole rendered `CUSTODY.md` file on disk. I did not read `TRANSFORM-ROUTING.md`'s content at all, only confirmed nothing references it.
- **execution_proven:** All four mutations above were actually RUN via `node --test test/custody-claim-lint.test.js` with real pass/fail counts captured from the tool output (not predicted): F1 (115/117, 2 fail), F1-ROLLUP (116/117, 1 fail), F2 (116/117, 1 fail), Rule-4b (115/117, 2 fail), plus baseline (117/117) and post-restore-per-mutation confirmations (`git diff --stat` empty after each). Nothing in this report is a reasoned prediction of what a mutation "would" do — Q-2 is the one explicit exception, named as such above.
- **what_would_confirm_or_refute:** A closing fix for the Q-2 HTML-tag gap (teaching the opener step that a just-stripped `<b>`/`<strong>` wrapping tag counts as an opener) would let a fifth mutation test run on Q-2 the same way as the other four. Running the other two population-adjacent test files (`a5-wiring.test.js`, `branding.test.js`) under the same four mutations would close the "wider blast radius" gap named in the derivation section.
- **read_outside_the_quoted_region:** Yes — for each mutation I read the full function body (not just the diffed lines) before editing, to confirm the smallest correct no-op edit: `findForbiddenClaimHits` (full function), `findLabelSeparationViolations`'s rollup loop (full loop), `EMPHASIS_RUN`'s surrounding comment block (to confirm it's the sole gate for backtick/tilde), and `findBoundParagraphPresenceViolations` (full function, plus `locateBoundParagraphSpan`/`endsAtBlockBoundary` definitions above it).
- **derivation_rule:** Population = the one test file (`engine/test/custody-claim-lint.test.js`) named by `git diff --name-status <base> <pinned> -- engine/`, narrowed to `test(...)` blocks that are new or whose assertion direction changed, cross-referenced against the matching mechanism in the one changed source file. Misses: indirect effects on other test/check files that reference `custody-claim-lint.js` by name but weren't in the diff; runtime-loaded fixtures beyond in-file constants; doc-only changes with no enforcer (`TRANSFORM-ROUTING.md`).
- **tree_state_on_exit:** Clean. `git status --porcelain=v1` empty, `git rev-parse HEAD` still `417147d18ef00ecd38655b55251d40c591323285`, `git diff 417147d --stat` empty. The test-harness SDK stub (`engine/node_modules/@anthropic-ai/claude-agent-sdk/*`) that I created to make `node --test` runnable at all has been fully removed (`rm -rf node_modules`) and its absence confirmed. Every mutation above was restored individually, immediately after its measurement, before the next mutation began — never batched.

**Summary — tests checked and found to have teeth (the set, not a count):** RF-F1 RED; RF-F1 RED through the real production call paths; RF-F1-ROLLUP RED; Q-1 CLOSED; RF-Q1 CLOSED; RF-Q1 CLOSED, uniformity. All six failed correctly when their protecting mechanism was reverted or fully no-op'd, and all were restored to the pinned commit's exact bytes afterward. Q-2 PINNED was assessed but not mutation-tested for the reason disclosed above — not claimed as toothless, not claimed as verified either.
