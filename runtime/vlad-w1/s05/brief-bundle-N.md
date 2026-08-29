# BUNDLE N — refuse-not-skip on the lead-in path (closes S4-1b) — S-VLADW1-05

You are a backend-builder on sprint S-VLADW1-05. Bundle N runs **after bundle M has landed** — M
changed the emphasis handling on the shared transform; read M's commit before you start so you build
on it rather than around it.

**This sprint has ONE fix attempt.** Diagnostic → one fix → qualifying. No second attempt, no
exception clause.

---

## ENVIRONMENT — read before anything else (ED-363)

**Your process cwd is NOT the target repo.** Dispatch starts you in a WarpOS agent worktree
(`…\WarpOS\.claude\worktrees\<name>`). That is expected. This brief asserts no cwd.

- **TARGET REPO:** `C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane`
- **TARGET BRANCH:** `wt/S-VLADW1-01-engine`, already checked out. Do NOT branch, merge, or push.
- **Package root:** `engine/`

Plain single git commands with `-C` and an absolute path; commit with `-F <abs msgfile>`; read and
edit by absolute path. **Never** `cd X && …`, never a heredoc commit, never pipe a git command
through `tail`/`head`. The worktree-isolation guard refuses command COMPLEXITY, not the cross-repo
target — if a command is denied, do not reshape it to slip past, but do read the guard's message and
use a simpler permitted form if it names one. If a plain `git -C` command is still refused, STOP and
report it with the output.

**Do not edit what you cannot commit.** If you cannot commit at all, make NO edits and halt.

**Gates, each as its OWN command with its real exit code read** — never `gate | tail -1 && next`:
suite from `engine/` (**floor 377 pass / 0 fail** — M landed and raised it from 366; verify the
current number yourself before you start and use that) and `npm run check:ship` (**exit 0**).
`npm run check:pointers` exits 1 **by design**, outside `check:ship`, not a defect.

## WHAT BUNDLE M LANDED — you build on this, not around it

M is committed at **`3596c2d`** (parent `6a105f2`). Read it before you start. What matters to you:

- `canonicalizeClaimText` now applies **fold (8)** — markdown emphasis, alphabet `` [*_`~] ``,
  replaced with a **SPACE** — by default.
- **`resemblesBindableLeadIn` — the function you are about to change — opts OUT** via
  `canonicalizeClaimText(line, { caseFold: false, emphasisFold: false })`. That opt-out is
  load-bearing and disclosed: this function needs the raw emphasis run as *shape data* (it matches
  the opener at ~672 and the closing strip at ~680). **Folding emphasis here returns null for every
  lead-in and reopens the fail-open class.** M shipped a falsifier (M-1) that goes RED if the opt-out
  is removed. **Do not remove or bypass it**, and if your prefix-class work touches those lines,
  re-run M-1 and report its result.
- M also disclosed a **pinned open residual**: a token split mid-word by emphasis (`ASS**ERTED**`) is
  NOT closed, because SPACE (not deletion) was chosen to protect an adjacent already-fixed evasion.
  That residual is bundle M's, already disclosed — **not yours to close and not yours to restate.**

Never `--no-verify`. Never allowlist your way past a guard. No credential-shaped literals.

---

## SCOPE

**allowedFiles:** `engine/scripts/checks/custody-claim-lint.js`, `engine/test/custody-claim-lint.test.js`
**forbiddenFiles:** `engine/CUSTODY.md` (bundle P owns ALL prose — if you find prose that is now
wrong, REPORT it, do not edit it), `src/`, `driver/`, everything else. Do not revisit bundle M's
transform decision; if you believe M got it wrong, report that and stop.

---

## THE DEFECT

`CUSTODY.md` ships the sentence that **two escapes remain**. That is false: bolded lead-ins carrying
a block prefix are silently skipped, and heading-prefixed ones are among them.

**Proof — verify each before relying on it (ED-362; you may refuse a false premise with evidence):**
- `BLOCK_PREFIX` (~line 612) covers **list / ordered-list / blockquote only**. β read this at source
  at `6a105f2` (row 320) and confirms headings `#`, `|`, `<p>`, quotes/parens/brackets, `•` and
  `Note:` are **genuinely uncovered**.
- Design battery R1: **12 enumerated prefix shapes GREEN as-is; 12 RED under the fix.**

`resemblesBindableLeadIn` returning null on these is a **silent skip** — no candidate, no violation,
nothing refused by name. Refuse-not-skip is the property: a near-miss of the protected shape is a
violation until proven benign, never a `continue`.

---

## ⚠️ THE TRAP IN THIS BUNDLE — over-refusal is a WORSE defect than the one you are fixing

A prefix strip that swallows real headings turns `## Proven` into a bindable candidate. That is a
**false RED**, and a false RED on a shipped enforcer trains every reader to dismiss the gate — the
inverse failure of the false GREEN this sprint exists to fix, and strictly worse because it erodes
the mechanism people rely on.

**Load-bearing, must stay GREEN and be proven again as built** (the battery says they pass under the
fix; that is design evidence, not proof of your implementation):
- `## Proven` must NOT become a bindable candidate.
- Prose merely *using* the keyword must not.
- `**Status:** PROVEN` must not.

Report each of the three explicitly with the observed result.

## ⚠️ WRITE IT AS A CLASS, NOT AS THE TWELVE SHAPES PROBED

This is the S4-1b defect itself and you must not reproduce it:

- **"12/12" is a SAMPLE SIZE, not coverage.** Twelve enumerated prefixes were probed. The battery's
  `PREFIX_FIX` is *itself an enumeration* — matching it shape-for-shape produces a mechanism that is
  exactly as complete as the sample and a sentence that overstates it.
- Implement the **prefix class** (the structural property: leading block-level markup that precedes
  the lead-in), not a list of twelve literals.
- **Do not put a count in any comment or prose.** A count is a property of the day it is read. If you
  need to describe coverage in an enforcer comment, state the **class** and, where the mechanism has
  an enumerable extension, **emit** the set from the data rather than typing it.

---

## TASKS (4 — ED-257: task count drives duration)

1. **Extend the block-prefix strip to every prefix class on the LEAD-IN path**, ATX headings included,
   written as a class per the section above. Report the class you implemented and why it is a class
   rather than an enumeration.
2. **RF-N1, pre-written falsifier:** reverting the prefix strip turns the probed shapes GREEN.
   Committed mutation logic, **no-op ⇒ FAIL guard** on the mutant, observed RED before you keep it.
3. **Over-refusal, load-bearing, both directions:** the three controls above stay GREEN. Prove as
   built, not by citing the battery. Report each result.
4. **Report what the mechanism now covers, at the granularity it has.** If the class is structural,
   say so and name the property. If any part remains an enumeration, say which part and that it is an
   enumeration — an honest partial is admissible; an overstated closure is not. **Do not write a
   number that a reader could take as coverage.**

---

## STANDING DISCIPLINE — binding

1. **Every shipped claim sentence is drafted AFTER the attack that would falsify it** — including
   wording β recommends and α approves. *"Approval is not a truth check."*
2. **No coverage claim at a coarser granularity than the mechanism has.** State the class, not the
   count.
3. **A comment stating an invariant is not an enforcer of it.**
4. **A text matcher cannot distinguish a violation from a description of one.** Prose naming a banned
   pattern trips the ban. Expect it; rephrase rather than suppress.
5. **You may refuse any premise in this brief with evidence.** That is a CORRECT return, not a failed
   bundle. Every line number above comes from β's read at `6a105f2`; re-verify before relying on it.
6. **Halt at a bundle boundary, never mid-bundle.**

**Envelope:** a `falsification_attempts` array with one entry per claim shipped or relied on — an
entry whose `attack_run` is a description rather than something RUN is not an entry. Also report:
the implemented class, all three over-refusal control results, both gate exit codes read separately,
the post-M suite floor you used, and anything you could not do.
