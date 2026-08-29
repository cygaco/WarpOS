# Fix brief — bundle L — P2's scope wording vs the execution-proven bypass

You are a **backend-fixer** working in the vlad engine worktree.

- **Worktree (your cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine` — already checked out. Do NOT create a branch, do NOT merge, do NOT push.
- **Package root:** `engine/`

## scopeContract

**allowedFiles**
- `engine/CUSTODY.md` — the P2 section ONLY (the `### P2 …` heading at ~line 84 and the ceiling paragraph beginning `**Ceiling — half (b)'s raw-launch and import-graph rules are a text-matcher family…**` at ~line 110-121)
- `engine/scripts/checks/custody-claim-lint.js` — the `BOUND_PARAGRAPHS` canonical copy of that ONE ceiling paragraph, and nothing else in the file

**forbiddenFiles** (do not edit, for any reason)
- Every other paragraph of `engine/CUSTODY.md` — in particular anything describing `canonicalizeClaimText`, the transform, P1, P3, P4, A5–A8, or any other Ceiling paragraph. A parallel bundle (K) has just edited this file; you are the only editor now, but you own two paragraphs of it, not the file.
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

`engine/CUSTODY.md:84` currently reads:

> `### P2 — Every auditedSpawn call site passes an explicit env object naming no denylisted variable, and a raw bypass of the audited wrapper is refused`

The body's half (b) is shape-enumerated and TRUE: it names bare `spawn`/`exec`/`execFile`/`fork` (and `*Sync`)
calls, a `node:child_process` import, and a dynamic specifier. The HEADING is not scoped, and the committed
witness above is a raw bypass of the audited wrapper that is not refused. As a standalone claim string the
heading is false.

Rewrite the heading so it says what the enforcer does — matched call-site SHAPES in source text — rather than
asserting that raw bypasses are refused as a class. Do not fix it by deleting the second half and leaving the
clause half-described; the reader needs to know half (b) exists. Do not smuggle the universal back in with a
softer word ("effectively", "in practice", "generally") — those are the same claim wearing a hedge.

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

## How to work

1. **Run the attack, then write the claim.** Every sentence you put on the shipped surface must be one you
   tried to break first. Do not draft a sentence and then look for support for it.
2. **≤4 verified-run tasks; commit after each landing unit.** Tasks 1+2+3 land as ONE commit because of the
   atomicity requirement; that is deliberate, not a violation of the per-task rule.
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
{ "bundle": "L", "ok": true|false, "commit": ["<sha>"],
  "files_changed": ["..."],
  "suite": {"pass":0,"fail":0,"skipped":0,"todo":0},
  "check_ship_exit": 0,
  "heading_before": "<verbatim old heading>",
  "heading_after": "<verbatim new heading>",
  "ceiling_example_before": "<verbatim old example clause>",
  "ceiling_example_after": "<verbatim new example clause>",
  "rf4_observation": {"command":"<exact command>","mutation":"<what you removed>","result":"RED|GREEN","raw_output":"<the lines that show it>"},
  "bind_green_after": "<command + output showing the bind green with both edits in>",
  "falsification_attempts": [
    {"claim":"<the exact sentence or claim>","attack_run":"<the command or probe you actually ran>","outcome":"HELD|FALSIFIED|CONFIRMED — <what happened>"}
  ],
  "residuals_named": ["..."],
  "what_i_could_not_do": ["..."] }
```

`falsification_attempts` must carry one entry per claim you shipped or relied on, including the claim that
your new heading is true and the claim that your new example route is open. An entry whose `attack_run` is a
description rather than something you ran is not an entry.
