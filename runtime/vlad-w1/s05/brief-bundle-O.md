# BUNDLE O — confusable coverage stated at the granularity it has (closes S4-1a) — S-VLADW1-05

You are a backend-builder on sprint S-VLADW1-05. Bundle O runs **after M and N have landed**. Read
their commits first.

**This sprint has ONE fix attempt.** Diagnostic → one fix → qualifying. No second attempt.

This bundle is the sprint's centre of gravity: the predecessor failed because a sentence about this
exact mechanism was true at the wrong granularity. **You are not just widening a map — you are making
the mechanism able to state its own coverage.**

---

## ENVIRONMENT — read before anything else (ED-363)

**Your process cwd is NOT the target repo.** Dispatch starts you in a WarpOS agent worktree. Expected.
This brief asserts no cwd.

- **TARGET REPO:** `C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane`
- **TARGET BRANCH:** `wt/S-VLADW1-01-engine`, already checked out. Do NOT branch, merge, or push.
- **Package root:** `engine/`

Plain single `git -C "<abs>"` commands; commit with `-F <abs msgfile>`; absolute paths. **Never**
`cd X && …`, no heredoc commits, never pipe git through `tail`/`head`. The isolation guard refuses
command COMPLEXITY, not the cross-repo target — do not reshape a denied command to slip past, but do
use a simpler permitted form if the guard names one. If a plain `git -C` is still refused, STOP and
report with the output.

**Do not edit what you cannot commit.** If you cannot commit at all, make NO edits and halt.

**Gates, each as its OWN command with its real exit code read**: suite from `engine/` (floor = the
post-N pass count, 0 fail) and `npm run check:ship` (exit 0). `check:pointers` exits 1 by design,
outside `check:ship`, not a defect.

Never `--no-verify`. Never allowlist past a guard. No credential-shaped literals.

---

## SCOPE

**allowedFiles:** `engine/scripts/checks/custody-claim-lint.js`, `engine/test/custody-claim-lint.test.js`
**forbiddenFiles:** `engine/CUSTODY.md` (bundle P owns ALL prose — report, do not edit), `src/`,
`driver/`, everything else.

⚠️ **Note on your own scope:** the `CONFUSABLE_FOLD` **header comment** inside
`custody-claim-lint.js` IS in your allowedFiles and task 4 requires you to fix it. It is an enforcer
comment, not `CUSTODY.md` prose.

---

## TASK 1 — widen the fold over a domain DERIVED FROM THE MODULE'S EXPORTED TOKENS

**Not** from "the letters `Ceiling` and `Asserted` need." β flagged the original wording as the
granularity class recurring one more time, and it was right.

**Measured (β derived this independently from `CONFUSABLE_FOLD` ~213-230 at `6a105f2`; re-verify):**
- The exported tokens are `PROVEN` and `ASSERTED — NOT VERIFIED`; with the `Asserted`/`Ceiling`
  keywords these give a **22-letter alphabet**.
- The fold covers `ACDEFINOPSTVeis` and is **missing `R d g l n r t` — seven letters.**
- Scoped to `Ceiling`+`Asserted` alone it would be missing only `d g l n r t` — **six** — so capital
  `R`, contributed by `PROVEN`/`VERIFIED`, would have been left unmapped **while the emitted sentence
  read as honest.** An emitted set over a domain defined too narrowly is a false sentence one level
  down.

**Read the domain from the module's own exports at build time**, exactly as the near-miss battery
reads the token "from the module's own export, never guessed". Deriving it is the requirement; a
hand-typed 22 is the defect in miniature.

**The seven are not one kind — β verified this and you must preserve the distinction:**
- **`d, g, n, t` are case-asymmetry gaps.** Their uppercase partners ARE mapped (`Ԁ→D`, `Ԍ→G`,
  `Ν→N`, `Т→T`, `Τ→T`). `canonicalizeClaimText` **lowercases LAST** (~254, after the fold at ~250),
  so an uppercase-only entry gives the lowercase letter no protection.
- **`R, r, l` have no entry in either case.** Latin `R` may be **genuinely unmappable** from the two
  covered scripts. If so, **STATE that** — do not silently "fix" it, and do not quietly drop it from
  the reported set.

### ⚠️ The property-shaped fix is right AND it collides — resolve the collision explicitly

Case-closing the map by construction (emit `[lower(k), lower(v)]` for every entry) is an **emitted
exhaustive extension over a stated finite domain** — exactly what the release rule permits, and it
closes `d, g, t` without enumeration.

**It is NOT sound as a blind transform.** The map already contains `"ν": "v"` (Greek lowercase nu).
Case-closing `"Ν": "N"` emits `ν → n` — a **collision** with the existing entry. You must resolve it
**explicitly and state the resolution**; that is admissible because the domain is stated.

**Do NOT vendor a Unicode confusables table.** Scope is pinned at `recommended`; a vendored table has
its own version and curated ceiling and merely relocates the discipline. If one is ever vendored,
the same rule applies unchanged: name the version and the ceiling.

## TASK 2 — RF-O1, pre-written falsifier

The three proven evasions go RED, and **reverting the widening returns them to GREEN**. Committed
mutation logic, **no-op ⇒ FAIL guard**, observed RED before you keep it.

⚠️ **"3/3" from the design battery is a SAMPLE SIZE, not coverage** — three letters were tested
(`l, n, g`), not three of seven. Do not let that ratio travel into any comment or claim.

## TASK 3 — EMIT the coverage set from the DATA, never by hand

Whatever the code covers, derive the covered letter set **programmatically** and expose it, so bundle
P's prose is sourced from the mechanism rather than from a person reading the mechanism. **This is the
structural answer to the class that failed the predecessor** — a hand-written coverage sentence is
exactly what went false three times.

The emitted artifact must make all three groups distinguishable: covered, uncovered-and-closable,
uncovered-and-believed-unmappable (with the reason).

## TASK 4 — FIX THE FALSE DISCLOSURE ALREADY IN THE BLOCK YOU ARE EDITING

The `CONFUSABLE_FOLD` header comment (~203-209) says the fold *"closes exactly the two scripts listed
and no others… a token spelled with one of those [Armenian, Cherokee, …] still evades."*

**That is false and it ships today.** It is a **script-granularity claim over a letter-granularity
mechanism** — Cyrillic lowercase `т`, `ԁ`, `ԍ` are IN a listed script and evade **right now**. It is
S4-1a verbatim, still live at this commit.

Because your `allowedFiles` includes this file, once you edit this block the sentence is
**authored-or-edited by this sprint** and falls inside the release rule's full scope. Editing around a
false sentence while working in the same block is disclosure-as-launder and is itself a finding.

**Rewrite it at letter granularity, sourced from task 3's emitted set.** Say what the fold maps
(letters), not what it "closes" (scripts). If a closure word is used at all, it is admissible only for
a property the mechanism actually closes by construction — the case-closure of task 1 qualifies over
its stated domain; "scripts closed" does not.

---

## TASKS: 4 (ED-257: task count drives duration)

---

## STANDING DISCIPLINE — binding

1. **Every shipped claim sentence is drafted AFTER the attack that would falsify it** — including
   wording β recommends and α approves. *"Approval is not a truth check, and β's recommendation is
   worth exactly nothing against the shipped bytes."*
2. **No coverage claim at a coarser granularity than the mechanism has.** State the letter set, not
   "the scripts". Where the mechanism has an enumerable extension, EMIT it. A **closure** claim is
   admissible only for a named property or an emitted exhaustive extension over an explicitly stated
   finite domain — otherwise state the probed sample and refuse the closure word.
3. **A comment stating an invariant is not an enforcer of it.**
4. **A text matcher cannot distinguish a violation from a description of one.** Prose naming a banned
   pattern trips the ban — expect it while editing the header comment, and rephrase rather than
   suppress.
5. **You may refuse any premise in this brief with evidence.** A CORRECT return, not a failed bundle.
   Every line number and letter-set claim above is β's read at `6a105f2` — **re-verify each**. If the
   seven-letter set or the ν collision does not reproduce, say so and stop.
6. **Halt at a bundle boundary, never mid-bundle.**

**Envelope:** a `falsification_attempts` array with one entry per claim shipped or relied on (a
description is not an entry). Also report: the derived domain and how you derived it, the emitted
coverage set with the three groups distinguished, your ν-collision resolution, the rewritten header
comment text, both gate exit codes read separately, and anything you could not do.
