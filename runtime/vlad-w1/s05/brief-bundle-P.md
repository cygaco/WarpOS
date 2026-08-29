# BUNDLE P — the prose, drafted after the attacks (closes S4-1a/b/c wording) — S-VLADW1-05

You are a backend-builder on sprint S-VLADW1-05. **Bundle P runs LAST**, after M, N and O have landed
and their coverage sets exist. Read all three commits before writing a sentence.

**This sprint has ONE fix attempt.** No second attempt, no exception clause.

**This bundle is where the predecessor died.** S-VLADW1-04 fixed its mechanisms correctly and then
authored **new false sentences about them** — one of which β recommended and α approved. β, on its own
recommendation being graded false:

> *"Approval is not a truth check, and β's recommendation is worth exactly nothing against the shipped bytes."*

Every sentence you write here is judged against the release rule's three clauses. Write each one
**after** running the attack that would falsify it.

---

## ENVIRONMENT — read before anything else (ED-363)

**Your process cwd is NOT the target repo.** Dispatch starts you in a WarpOS agent worktree. Expected;
this brief asserts no cwd.

- **TARGET REPO:** `C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane`
- **TARGET BRANCH:** `wt/S-VLADW1-01-engine`. Do NOT branch, merge, or push. **Package root:** `engine/`

Plain single `git -C "<abs>"` commands; commit with `-F <abs msgfile>`; absolute paths. Never
`cd X && …`, no heredoc commits, never pipe git through `tail`/`head`. The isolation guard refuses
command COMPLEXITY, not the cross-repo target; do not reshape a denied command, but use a simpler
permitted form if the guard names one. If a plain `git -C` is still refused, STOP and report.

**Do not edit what you cannot commit.** If you cannot commit at all, make NO edits and halt — a
half-applied prose edit with no canonical edit is the defect this sprint family exists to close.

**Gates, each as its OWN command with its real exit code read**: suite from `engine/` (floor = post-O
pass count, 0 fail) and `npm run check:ship` (exit 0). `check:pointers` exits 1 by design, outside
`check:ship`.

---

## SCOPE

**allowedFiles:** `engine/CUSTODY.md`; **and the canonical copies in `custody-claim-lint.js` for any
bound paragraph you edit** (atomic, same commit).
**forbiddenFiles:** all mechanism code other than those canonical copies. Do not change behaviour to
make a sentence true — fix the sentence, or report that the mechanism is wrong and stop.

---

## THE ACCEPTANCE SHAPE — the release rule's clause S5-2(a)(b)(c)

**SCOPE (β row 318, which SUPERSEDED the earlier wording — read this carefully):** the clause applies
**in full** to every coverage claim this sprint **authors or edits**, and to **all of `CUSTODY.md`**.
For shipped coverage claims in files this sprint does **not** touch, the requirement is **disclosure,
not repair** — that is task 5.

- **(a) EMITTED, never hand-typed.** Where the mechanism has an enumerable extension (a fold map, a
  prefix set, a bound-paragraph key set), the coverage set in your sentence comes **from that data** —
  from bundle O's emitted set, not from your reading of the code.
- **(b) THE FRAME NAMES THE UNIT.** Say *letters*, *prefix shapes*, *paragraph keys* — the unit the
  mechanism enumerates. **Do not round up** to "scripts", "all", "the class", and **do not round to a
  count**. This is the half that failed: the predecessor's sentence had the DATA right and the FRAME
  wrong.
- **(c) CLOSURE IS ALMOST NEVER ADMISSIBLE.** Allowed only if the mechanism closes by a **named
  property** (a Unicode property, a structural invariant) or by an **emitted exhaustive extension over
  an explicitly stated finite domain**. Otherwise **state the probed sample and refuse the closure
  word.** A sample can prove a class OPEN; it can never prove one CLOSED.

---

## TASKS (5 — ED-257: task count drives duration)

1. **Rewrite the confusable disclosure to state the LETTER SET the code actually covers** — sourced
   from **bundle O's emitted set**, never hand-typed — and never as "the scripts closed". **Delete the
   mistake-vs-attacker calibration framing**; that framing was the false sentence. Preserve O's
   three-way distinction (covered / uncovered-and-closable / uncovered-and-believed-unmappable, with
   the reason).
2. **Replace every escape COUNT with a named CLASS.** "Two escapes remain" is the defect. A count is a
   property of the day it is read. Grep `CUSTODY.md` for every count-shaped coverage statement, not
   just the known one.
3. **Fix the NOT-bound enumeration (S4-1c):** it omits the P1–P4 clause HEADINGS and the section
   preambles, and an inverted P2 heading ships GREEN. **Either complete the enumeration or state that
   the class governs and the list is illustrative — not both.** Saying "said plainly" over a list that
   is actually a sample is the S4-1c defect verbatim.
4. **Atomicity.** Any bound paragraph you edit moves **with its canonical copy in the SAME commit**.
   Observe the atomicity falsifier RED before committing and report the raw output.

## TASK 5 — DISCLOSE the un-audited surfaces (β row 318, amended scope)

State on the shipped surface that **`src/env-scrub.js`, `src/model-seam.js`,
`driver/host-free-driver.js` and `src/server-entry.js` carry custody prose no lane has read end to
end**, and that their coverage claims are therefore un-audited.

**⚠️ SEQUENCING CONSTRAINT (β row 319 Q2) — BINDING, and it gates this task:** the four-file list must
be **RESOLVED BY READ before this sentence is DRAFTED.** The diagnostic gauntlet lane carries that
read as a secondary objective. **Cite that lane's output in your envelope**; if you cannot, do not
draft the sentence — report the block and halt.

**⚠️ This disclosure is ITSELF a coverage claim, so clause (b) governs its frame.** β was explicit:
*"This is not 'we did not look, so it passes'."* Name the four files. Do not round to "some files" or
"the rest of the package", and do not imply an audit that did not happen.

**⚠️ NAME WHAT EACH LANE ACTUALLY SAID — not "the lanes said".** The provenance, verified by the
conductor at design rather than asserted:
- the **qa lane** names all four verbatim in `what_i_could_not_assess`;
- the **backend lane** independently corroborates **two** (`env-scrub.js` header-and-greps only;
  `server-entry.js` greps and the RF-7 region only);
- the **security lane does NOT say it.**

**One lane said all four, a second corroborated two, a third did not say it.** The conductor's
original framing of this was "every lane said so", which was **false** — data right, frame rounded up
from one lane to all lanes, recorded as a conductor-side instance of this sprint's own class. **Do not
reproduce it.** A disclosure about un-audited files that over-claims its own evidence would be the
class a third time in the same sprint.

---

## STANDING DISCIPLINE — binding

1. **Every shipped claim sentence is drafted AFTER the attack that would falsify it** — β-recommended
   and α-approved wording included.
2. **No coverage claim at a coarser granularity than the mechanism has.**
3. **A comment stating an invariant is not an enforcer of it.**
4. **A text matcher cannot distinguish a violation from a description of one.** You are writing prose
   about banned patterns inside a file linted for them — expect trips, and **rephrase rather than
   suppress**. Never add an allowlist entry to make your own sentence pass.
5. **You may refuse any premise in this brief with evidence.** A CORRECT return, not a failed bundle.
6. **Halt at a bundle boundary, never mid-bundle.**

**Do not restate any number produced by earlier bundles** (the emphasis-fold yield, prefix counts,
letter counts) unless you source it from the emitted artifact in the same breath. A number that
travels without its list is an exhaustiveness claim.

## ENVELOPE — required fields

A `falsification_attempts` array with one entry per sentence shipped — for prose, the `attack_run` is
the specific input you constructed to try to make the sentence false, and what happened. Plus: every
sentence changed with before/after, the emitted set you sourced from, the diagnostic lane output you
cited for task 5, the atomicity falsifier's raw output, and both gate exit codes read separately.

**These four fields are REQUIRED and are read downstream (ED-377). An omitted field is read as
UNKNOWN, never as "nothing to report" — so an empty `files_i_could_not_see` must be an explicit,
deliberate empty, not an absent key:**

- **`what_i_could_not_assess`** — anything you could not judge, and why.
- **`files_i_could_not_see`** — every file or region you sampled rather than read end to end. This
  field is load-bearing in THIS bundle: task 5's entire subject is four files nobody read end to end,
  and a disclosure about un-audited surfaces that under-reports its own reading is the defect twice.
- **`execution_proven`** — which of your claims you RAN versus reasoned about. Separate them.
- **`what_would_confirm_or_refute`** — for anything you are unsure of, the specific check that would
  settle it.
