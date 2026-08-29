# BUNDLE Q — bind the transform's own description (successor-carried item 1) — S-VLADW1-05

You are a backend-builder on sprint S-VLADW1-05. **Bundle Q runs after M, N, O and P have landed.**
Read their commits first — in particular M's, because M rewrote the very paragraph this bundle binds.

**This sprint has ONE fix attempt.** No second attempt, no exception clause.

---

## ENVIRONMENT — read before anything else (ED-363)

**Your process cwd is NOT the target repo.** Dispatch starts you in a WarpOS agent worktree. Expected;
this brief asserts no cwd.

- **TARGET REPO:** `C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane`
- **TARGET BRANCH:** `wt/S-VLADW1-01-engine`. Do NOT branch, merge, or push. **Package root:** `engine/`

Plain single `git -C "<abs>"` commands; commit with `-F <abs msgfile>`; absolute paths. Never
`cd X && …`, no heredoc commits, never pipe git through `tail`/`head`. The isolation guard refuses
command COMPLEXITY, not the cross-repo target — do not reshape a denied command; use a simpler
permitted form if the guard names one; if a plain `git -C` is still refused, STOP and report.

**Do not edit what you cannot commit.** If you cannot commit at all, make NO edits and halt.

**Gates, each as its OWN command with its real exit code read**: suite from `engine/` (floor = the
post-P pass count — verify it yourself before starting; it was 377 after M) and
`npm run check:ship` (exit 0). `check:pointers` exits 1 by design, outside `check:ship`.

---

## SCOPE

**allowedFiles:** `engine/CUSTODY.md`; `custody-claim-lint.js`'s `BOUND_PARAGRAPHS`;
`engine/test/custody-claim-lint.test.js` (the clean-fixture builder).
**forbiddenFiles:** the transform's implementation (M owns it), the prefix-class logic (N owns it),
the confusable fold (O owns it), the rest of `CUSTODY.md`'s prose (P owns it). If you believe an
earlier bundle got something wrong, REPORT it and stop — do not fix it here.

---

## WHY THIS IS NOT CHEAP, AND WHY THE PREDECESSOR ESCALATED RATHER THAN FAKING IT

`CUSTODY.md`'s description of `canonicalizeClaimText` is **unbound** — nothing pins it byte-for-byte,
so it can drift away from the transform it describes with no test going red.

**It cannot be closed by simply adding a `BOUND_PARAGRAPHS` entry.** Proof (bundle K established this
and escalated rather than faking it — re-verify before relying on it): Rule 4b demands that a bound
paragraph's text appear in the clean test fixture, and that fixture is built **only** from keys
matching `^Ceiling` or `^A\d+$`. A description-paragraph key matches neither, so the "clean fixture
lints clean" test would go **RED**.

So the fixture builder must be extended first. That is task 1 and it is the real work.

⚠️ **The target paragraph MOVED under you.** Bundle M rewrote the transform's description — it added
fold (8) with a substantial block comment covering the emphasis alphabet, the SPACE-vs-deletion
decision, the disclosed mid-word residual, and the `resemblesBindableLeadIn` opt-out. **Bind what is
there after M/N/O/P, not what this brief's author saw.** Read the current text before you pin it.

---

## TASKS (3 — ED-257: task count drives duration)

1. **Extend the clean-fixture builder** so a paragraph whose key matches neither `^Ceiling` nor
   `^A\d+$` can be bound without turning the clean-fixture test red. Report the mechanism you chose
   and why it does not weaken Rule 4b — **a fixture builder that simply skips unrecognised keys would
   make the bind decorative**, which is this sprint's own failure class (a mechanism that appears to
   enforce and does not).
2. **Bind the transform's description paragraph** via `BOUND_PARAGRAPHS`, with its own falsifier.
3. **RF-Q1, pre-written falsifier:** editing that paragraph **without** moving its canonical copy is
   **RED**. Committed mutation logic, **no-op ⇒ FAIL guard**, and you must **observe it RED** before
   keeping it — a falsifier that has never been seen failing proves nothing.

**Atomicity:** if you edit a bound paragraph, it moves with its canonical copy **in the same commit**.

---

## STANDING DISCIPLINE — binding

1. **Every shipped claim sentence is drafted AFTER the attack that would falsify it** — β-recommended
   and α-approved wording included. *"Approval is not a truth check."*
2. **No coverage claim at a coarser granularity than the mechanism has.** If you describe what is now
   bound, say which paragraphs (the unit the mechanism enumerates) — do not say "the description is
   bound" if you bound one paragraph of several, and do not write a count that a reader could take as
   coverage.
3. **A comment stating an invariant is not an enforcer of it.**
4. **A text matcher cannot distinguish a violation from a description of one.** You are binding a
   paragraph that describes a matcher, inside a file linted by that matcher — expect trips, and
   **rephrase rather than suppress**. Never add an allowlist entry to make your own change pass.
5. **You may refuse any premise in this brief with evidence** — including the Rule 4b claim above.
   A correct return, not a failed bundle.
6. **Halt at a bundle boundary, never mid-bundle.**

**Envelope:** a `falsification_attempts` array with one entry per claim shipped or relied on (a
description is not an entry). Also report: the fixture-builder mechanism and why the bind is not
decorative, the exact paragraph(s) bound, RF-Q1's observed-RED raw output, both gate exit codes read
separately, and anything you could not do.
