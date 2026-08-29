# Fix brief — bundle L2 — P2's scope wording vs the execution-proven bypass

You are a **backend-fixer**. The work is in the vlad engine worktree — which is NOT where your process
starts. Read the next section before doing anything else.

## READ THIS FIRST — YOUR CWD IS NOT THE TARGET REPO

**Your process will start in a WarpOS agent worktree** (something like
`C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\worktrees\<name>`, on a branch named
`worktree-<name>`). That is the dispatch harness's isolation worktree. **It is not where the work is, and
this is expected — do not treat it as a blocking fault.** A previous attempt at this bundle halted here.

- **TARGET REPO (where every file below lives):**
  `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **TARGET BRANCH:** `wt/S-VLADW1-01-engine`, already checked out there. Do NOT branch, merge or push.
- **Package root inside it:** `engine/`

**THE COMMAND SHAPE THAT WORKS, established by the bundle that ran immediately before you (L1, which
successfully landed three commits on the target branch from exactly this situation):**

- Use **plain, single** git commands with `-C` and an absolute path:
  `git -C "C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane" add engine/CUSTODY.md`
- Commit with a message FILE, not a heredoc:
  `git -C "<abs path>" commit -F "<abs path to msg file>"`
- Read and edit files by **absolute path**. `node`/`npm` runs: pass the absolute directory.

**What the worktree-isolation guard actually refuses is command COMPLEXITY, not the cross-repo target.**
L1 measured this: it was denied on a compound `cd X && git commit <<heredoc` and on a piped
`git commit | tail`, the guard's own message told it to split into plain commands, and a plain
`git -C <path> add` was then **ALLOWED**. So:

- **Never** `cd X && …`. **Never** pipe a git command through `tail`/`head`. **Never** a heredoc commit.
- If a command is denied, **do not reshape it to slip past the guard** — but DO read the guard's message:
  if it names a simpler permitted form, using that form is compliance, not tunneling. Splitting a compound
  command into two plain commands is the sanctioned response, and it is what L1 did.
- If a **plain** `git -C` command against the target path is still refused, stop and report it — that is a
  real block, and the conductor lands the work instead. Say so in `what_i_could_not_do` with the output.

**Do not edit without being able to commit.** If you determine you cannot commit to the target branch at
all, make NO edits and halt — an uncommittable claim edit with no paired canonical edit is the exact defect
this bundle exists to close. That judgement was correct when a previous attempt made it.

## LINE NUMBERS — CORRECTED, verified after bundle L1 landed

The earlier revision of this brief carried pre-L1 numbers. The real ones now:

- P2 heading — **line 113**
- the `Ceiling — half (b)'s raw-launch and import-graph rules are a text-matcher family…` paragraph — **line 137**
- `(for one example, an aliased reference to an already-imported launch function)` — **line 147**
- the three `S4-[0-9]` hits in `scripts/checks/custody-claim-lint.js` — **1273, 1279, 1398**

Still locate by the quoted TEXT and report the real line you found; these are a starting point, not a pin.

Bundle **L1** edited `CUSTODY.md` immediately before you and has finished. You are the only editor of that
file now. **L1's regions are not yours** — it touched the preamble's NOT-bound enumeration, the rollup-class
paragraph, the preload Ceiling's surface count, and the transform paragraph's confusable disclosure. Leave
all four alone. Yours is P2 and only P2.

**Every premise below carries a proof line, and you are entitled to refuse any of them with evidence** —
that is a correct return, not a failure. Two briefs earlier in this attempt asserted "X is missing/required"
from belief rather than a read and were rightly refused by their builders. Check; do not inherit.

## scopeContract

**allowedFiles**
- `engine/CUSTODY.md` — the P2 section (the `### P2 …` heading and the ceiling paragraph beginning `**Ceiling — half (b)'s raw-launch and import-graph rules are a text-matcher family…**`), PLUS the one clause added by task 4(a) to the paragraph that discloses this lint's limits. Nothing else in the file.
- `engine/scripts/checks/custody-claim-lint.js` — four places only: the `BOUND_PARAGRAPHS` canonical copy of the ceiling paragraph you edit (task 3), the `only-surface-assertion` rule's header comment (task 4a mirror), its user-visible `detail` message at ~line 1398 (task 4b), and — only if you judge it lossless — the two maintainer comments at ~1273/1279. Nothing else in the file.

**forbiddenFiles** (do not edit, for any reason)
- Every other paragraph of `engine/CUSTODY.md` — in particular anything describing `canonicalizeClaimText`, the transform, P1, P3, P4, A5–A8, or any other Ceiling paragraph. In particular the four regions bundle L1 has just edited: the preamble's NOT-bound enumeration, the rollup-class paragraph, the preload Ceiling's disclosure-surface sentence, and the transform paragraph's confusable disclosure. You are the only editor of this file now, but you own two paragraphs of it, not the file.
- Every other file in the repo. No test files, no `src/`, no `driver/`, no fixtures.
- Anything under `.claude/`.

If a task cannot be done inside that scope, do not widen it. Say so in `what_i_could_not_do` and route it.

## Why this bundle exists

Bundle J banned `createRequire` outside `src/spawn-shim.js`, and — because a red probe cannot witness a
ceiling — re-pointed its standing witness to a route that still bypasses: `process.binding("spawn_sync")`
driven through a computed member key. That witness is committed (`ff6d483`,
`engine/test/fixtures/J-expected-bypass/reflective-launcher.js`) and it is a witness BY EXECUTION — the test
runs it and a real child returns status 0 echoing a placeholder.

J could not act on the consequence because another bundle owned `CUSTODY.md` that wave, so it routed it. The
consequence is two defects, both on a SHIPPED surface (`CUSTODY.md` is resolved by `npm pack --dry-run`).

## Task 1 — the P2 heading states an unqualified universal that is now false

`engine/CUSTODY.md:113` currently reads:

> `### P2 — Every auditedSpawn call site passes an explicit env object naming no denylisted variable, and a raw bypass of the audited wrapper is refused`

The body's half (b) is shape-enumerated and TRUE: it names bare `spawn`/`exec`/`execFile`/`fork` (and `*Sync`)
calls, a `node:child_process` import, and a dynamic specifier. The HEADING is not scoped, and the committed
witness above is a raw bypass of the audited wrapper that is not refused. As a standalone claim string the
heading is false.

Rewrite the heading so it says what the enforcer does — matched call-site SHAPES in source text — rather than
asserting that raw bypasses are refused as a class. Do not fix it by deleting the second half and leaving the
clause half-described; the reader needs to know half (b) exists. Do not smuggle the universal back in with a
softer word ("effectively", "in practice", "generally") — those are the same claim wearing a hedge.

**RUN THE ATTACK BEFORE YOU WRITE THE REPLACEMENT — the attack IS the shipped fixture.** Execute
`reflectiveLaunch()` from `engine/test/fixtures/J-expected-bypass/reflective-launcher.js`, show that a real
child ran (status and the echoed placeholder), and show the scanner finds zero violations in that file. That
pair — "the scanner sees nothing" AND "a child really started" — is what contradicts the heading's universal.
Report the raw output. Only then write the scoped heading. A heading claim rewritten without its attack run
is exactly the process this bundle is correcting.

Constraint: the heading is the section's anchor. Other prose in this file refers to "P2" and to "half (b)";
grep for those references and make sure your new heading does not leave any of them describing something that
is no longer there. If it does, that reference is in a paragraph you may not edit — report it, do not edit it.

## Task 2 — the ceiling paragraph's only named open route is the one J just closed

The bound ceiling paragraph at ~line 110-121 argues correctly that half (b) is a text-matcher family, not an
exhaustive enumeration, and it illustrates the uncovered class with:

> `(for one example, an aliased reference to an already-imported launch function)`

That example is now CLOSED — it is exactly what J banned. So the shipped residual currently illustrates itself
with a route that no longer bypasses, while the route that is execution-proven open goes unnamed. Re-point the
example to `process.binding("spawn_sync")` through a computed key, and say that it is execution-proven with a
committed standing witness, not merely conceivable. Keep intact:

- the argument that widening a matcher family narrows a ceiling but does not close the class;
- the historical anchor `8b6993e` / five raw-launch shapes caught (it is scoped and dated — leave it alone);
- the `src/env-scrub.js` capture-then-scrub sentence about what covers the residual class at runtime.

State the residual in strong, actionable form — what a green result does and does not mean — not as a
reassurance. Do not claim the class is now closed, and do not claim the enumeration is now complete: it is
not, and `eval`/`Function()`/WASM/native addons remain open by construction.

## Task 3 — the atomic canonical edit (this is the point of the bundle, not paperwork)

The paragraph in Task 2 is a BOUND paragraph: its canonical copy is a key in `BOUND_PARAGRAPHS` in
`engine/scripts/checks/custody-claim-lint.js` (the key beginning
`Ceiling — half (b)'s raw-launch and import-graph rules are a text-matcher family`). If you change the
document text without changing the canonical copy in the SAME commit, the bind goes RED — and it is supposed
to. That is RF-4, and this bundle is a live exercise of it.

Do both edits, verify the bind is green, and **commit them together**. Never commit the document edit alone
"to check". If the paragraph's bolded lead-in text itself changes, the KEY changes too — update it and make
sure the paragraph is still derivable (a bolded lead-in that opens the block and closes properly), or the
lint's fail-closed direction (b) `unbindable-paragraph-shape` fires.

Before you commit, run the RF-4 falsifier and OBSERVE it: make the claim edit without the canonical edit in
your working tree, run the lint, confirm it goes RED, then restore. Report the exact command and its output.
A no-op that prints green is a FAILED observation, not a pass.

## Task 4 — two disclosure/vocabulary items, one commit

**(a) The count-form exhaustiveness class is unchecked, and silence about it is an S4-6 failure.**
β ruled (row 314) that rewriting the one "ONE internal surface" instance closes the instance and leaves the
CLASS open. **DISCLOSE it; do not widen the rule.** Count phrasing is unbounded — "one", "a single", "two",
"both", "the sole", "no other" — so widening is the same move that was rejected for the rollup family, and
it manufactures the appearance of coverage.

Proof, so you are not taking this on trust: the rule is `custody-claim-lint/only-surface-assertion`,
implemented in `findOnlySurfaceAssertionViolations` at `scripts/checks/custody-claim-lint.js:1385`, and it
matches on `ONLY_SURFACE_ASSERTION` — a **phrase** regex applied inside bound paragraphs only. Read it and
confirm it has no count branch before you write the sentence. **If it turns out bundle L1 already widened it
to counts** (it had that as an explicitly optional task), then do NOT write this disclosure as stated —
instead say what remains unchecked after that widening, and add a near-miss row for the new family with its
CONTROLS FIRST. Check which world you are in before writing.

Add one clause on the SHIPPED surface where the reader is, in the paragraph that discloses this lint's
limits, saying in substance: the rule matches exhaustiveness PHRASES inside bound paragraphs and does not
detect count-form exhaustiveness claims; a count inside a bound paragraph is not checked; human review is
the control. **Mirror it in the rule's own header comment** so a maintainer reading the code sees the same
limit. Keep it in CLASS form — do not enumerate the count words as though listing them closes anything.

**(b) An internal criterion id ships inside a user-visible message.**
`scripts/checks/custody-claim-lint.js:1398` builds the violation `detail` a user sees when the check fires,
and that string contains **`S4-3`** — an id from this sprint's internal release rule that no user of this
package can resolve. `scripts/` ships (`package.json#files` = `src/`, `scripts/`, `driver/`, one test,
`CUSTODY.md`), so this is the same class as the `S4-1` id already removed from `CUSTODY.md`, one file over.
Rewrite that message to name the REQUIREMENT rather than the id — the atomicity requirement that a bound
paragraph and its canonical copy move together — keeping the argument and its force intact.

Two further hits at lines 1273 and 1279 are in comments addressed to maintainers of that file, not to users.
**Judge them; do not reflexively change them.** If rephrasing is trivial and loses nothing, do it; if it
would damage a maintainer-facing argument, leave them and say why in `residuals_named`.

Proof line for the whole item: `grep -n "S4-[0-9]" scripts/checks/custody-claim-lint.js` returns exactly
three hits — 1273, 1279, 1398. **Re-run it after your edit and report the full output.** Also run
`grep -rn "S4-[0-9]\|ED-[0-9]\|RT-[0-9]\|RF-[0-9]" src/ driver/ scripts/ CUSTODY.md package.json` plus any
shipped README or file header in the ship set, and report the FULL output — the sweep covers the whole ship
set (`package.json#files` = `src/`, `scripts/`, `driver/`, `test/credential-custody-decoy.test.js`,
`CUSTODY.md`), not one file. Scoping an enforcement sweep to where the instance was found rather than to
where the class lives is how `:1398` survived the sweep that fixed `CUSTODY.md`.

**Distinguish the two surfaces when you report.** A token inside a MAINTAINER comment is not a user-surface
leak; a token inside a string a user can see when a check fires IS one. Fix the second; judge the first and
leave it if removing it would damage the argument. `RF-n` and `RT-n` hits may be legitimate in test names or
maintainer prose — report them, do not reflexively scrub them.

## How to work

1. **Run the attack, then write the claim.** Every sentence you put on the shipped surface must be one you
   tried to break first. Do not draft a sentence and then look for support for it.
2. **Three landing units, three commits.** (i) task 1, the scoped heading; (ii) tasks 2+3 together — the
   ceiling edit and its canonical copy MUST be one commit, that is the atomicity requirement and the point
   of the bundle; (iii) task 4's two disclosure/vocabulary items.
3. **Gates before you finish**, each as its own command, reading its real exit code — never piped through
   `tail`/`head` in a `&&` chain:
   - the test suite from `engine/` — floor is **366 pass / 0 fail**;
   - `npm run check:ship` from `engine/` — exit 0.
   If a failure is not yours, prove it is not yours (diff, `git show`, HEAD state) and say so; do not fix
   another bundle's file.
4. **Never `--no-verify`. Never add an allowlist entry to get past a guard. Never reshape a command a guard
   or a classifier denied.** If the doc-ref-integrity merge-guard denies your commit over pre-existing broken
   refs in `.claude/` docs that are not yours: STOP, do not re-run it, and report it in
   `what_i_could_not_do` with the guard's output. The conductor lands it. (A previous bundle re-ran the
   identical denied command and self-flagged it; do not repeat that.)
5. **Never put a credential-shaped literal anywhere.** Placeholders only, and label them as placeholders.
6. **Halt at a bundle boundary, never mid-bundle.** A half-applied claim edit with no canonical edit is
   exactly the defect this sprint exists to close.

## Envelope — return as your final message

Return a fenced JSON block with these fields. Free-text fields are read; they are not decoration.

```json
{ "bundle": "L2", "ok": true|false, "commit": ["<sha>","<sha>","<sha>"],
  "files_changed": ["..."],
  "suite": {"pass":0,"fail":0,"skipped":0,"todo":0},
  "check_ship_exit": 0,
  "heading_before": "<verbatim old heading>",
  "heading_after": "<verbatim new heading>",
  "j_fixture_attack": {"command":"<exact>","child_status":"<n>","child_stdout":"<echoed placeholder>","scanner_violations":"<count + output>"},
  "ceiling_example_before": "<verbatim old example clause>",
  "ceiling_example_after": "<verbatim new example clause>",
  "count_class_world": "L1 DID widen to counts | L1 did NOT widen — <evidence you checked>",
  "count_disclosure_shipped": "<verbatim clause + where it landed>",
  "count_disclosure_mirrored_in_code": "<verbatim + line>",
  "internal_id_grep_after": "<both greps and their FULL output>",
  "comments_1273_1279": "rephrased|left — <why>",
  "rf4_observation": {"command":"<exact command>","mutation":"<what you removed>","result":"RED|GREEN","raw_output":"<the lines that show it>"},
  "bind_green_after": "<command + output showing the bind green with both edits in>",
  "falsification_attempts": [
    {"claim":"<the exact sentence or claim>","attack_run":"<the command or probe you actually ran>","outcome":"HELD|FALSIFIED|CONFIRMED — <what happened>"}
  ],
  "premises_i_refused": ["<any premise of this brief you found false, with your evidence>"],
  "residuals_named": ["..."],
  "what_i_could_not_do": ["..."] }
```

`falsification_attempts` must carry one entry per claim you shipped or relied on, including the claim that
your new heading is true and the claim that your new example route is open. An entry whose `attack_run` is a
description rather than something you ran is not an entry.
