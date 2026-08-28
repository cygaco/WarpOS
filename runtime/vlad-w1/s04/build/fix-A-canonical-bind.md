# BUNDLE A — the bind refuses what it cannot classify, and closes token near-misses by TRANSFORM

Sprint S-VLADW1-04. **ONE fix attempt exists this sprint** (β row 309): gauntlet-1 is diagnostic, then one
fix attempt, then the qualifying gauntlet. Build carefully; there is no third pass.

## Where you work
- **Worktree (cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine`, HEAD `b2583d6`. Commit here. Do NOT branch, push, or merge.
- Paths below are relative to `engine/`. **You are the only builder running.** `git status` should be clean.

## Scope contract
**allowedFiles:** `engine/scripts/checks/custody-claim-lint.js` · `engine/test/custody-claim-lint.test.js` ·
`engine/CUSTODY.md`
**forbiddenFiles:** everything else. Especially `engine/src/**`, `engine/driver/**`,
`engine/test/env-scrub*.test.js`, `engine/test/spawn-shim.test.js`, `engine/package.json`.
Stage only your own files by path. Never `git add -A`.

**You own `CUSTODY.md` for THIS bundle only** — the header block, the new Ceiling paragraph, and any
paragraph your new predicate refuses. **A later bundle corrects two false sentences elsewhere in the file;
do not touch those.** They are: the preload-Ceiling "not named on any other surface" sentence, and the
`opts.cwd`/`opts.stdio` Ceiling's attribution sentence about which fix cycle observed it. Leave both exactly
as they are.

---

## Task 1 — REFUSE, don't skip (the sprint's headline defect)

`extractBindableParagraphs` currently does, at roughly line 410:

    if (!assertedMatch && !isCeiling) continue;

A paragraph that fails the predicate is **silently dropped**. A gauntlet lane proved the consequence: it
authored one new unbound claim paragraph seven ways — the two em-dash forms went RED (controls), and
**en-dash, hyphen, minus, colon and a two-space indent all shipped GREEN with zero violations**, while
`CUSTODY.md`'s header promises every bolded `Ceiling` lead-in is bound.

**Build:** a block that RESEMBLES a bindable lead-in — bolded, opening `A<n>` / `Asserted` / `Ceiling`,
followed by any dash (em U+2014, en U+2013, hyphen, minus U+2212), colon, or leading whitespace — but fails
the canonical predicate MUST emit a named violation (`unbindable-paragraph-shape` already exists as a rule
id). **Never `continue` past it.**

**Prefer a normalized comparison over a dash-character enumeration here too** — see Task 2's transform; the
same reasoning applies. Enumerating the five spellings a battery happened to try is the same fail-open shape
one level up.

**Do NOT over-refuse.** `Status`, `Enforcer` and `Proof scope` are P-clause metadata lines (4 each) and are
NOT claim paragraphs. They must not become violations. Verified: the proposed predicate does not match them.

**Header ceiling, required:** "resembles a lead-in" is itself a predicate, so a paragraph resembling nothing
the resemblance-check knows is still invisible. **State that ceiling in the file header.** Claiming
completeness the predicate does not have is exactly what failed the predecessor sprint.

## Task 2 — R3/RT-7 status-token near-misses, closed by a NAMED CANONICAL TRANSFORM

The Asserted status token must not appear in the Proven section. Today only the exact
`ASSERTED — NOT VERIFIED` is caught. A design-phase battery found **all four near-misses ship GREEN**:
en-dash, hyphen, lowercase, and extra internal spacing.

**β's ruling is explicit and it constrains the SHAPE of your fix, not just its result:**

> R3's status-token near-misses closed by a **NAMED CANONICAL TRANSFORM** — case-fold +
> whitespace-collapse + dash-class fold, compared on the rendered form — **an enumeration of the four
> observed variants does NOT satisfy this.**

**Build a named transform function** and apply it to BOTH sides of every status-token comparison. Name it in
the header so its ceiling is legible. A four-variant lookup table is a REFUSED implementation — it closes
the sample, not the class, and the fifth spelling walks straight through.

## Task 3 — the class-form residual ships as a Ceiling under P3

Add a new **`Ceiling`** paragraph under P3 (NOT an Asserted `A<n>` paragraph — placement is decided, and it
sets the atomic width to two files: `CUSTODY.md` + the lint's stored copy). Strong, actionable form, telling
a reader what is true of THEIR install:

> This package does not verify that its controls are invoked in YOUR install. AC-8.6 covers one control at
> start-up; the rest are proven by our test run only.

Bind it like any other Ceiling — it must be in the bound set and its canonical copy must land in the SAME
commit as the paragraph (see Task 5).

## Task 4 — two disclosures in the header's not-bound list

**(a) The not-bound list is currently incomplete** and its own promise is to say it "plainly rather than
generalised". It omits the **P1–P4 body prose** — the substantive sentences stating what each enforcer
scans. A lane proved three flat falsehoods there ship green. Add it.

**(b) R4/RT-8, the rollup blindness, disclosed as a CLASS.** The rollup rule catches digit-form counts and
`all`; it misses spelled-out numerals (`four of four claims verified`) and `every`. **β ruled this DISCLOSED
rather than fixed** — widening would enumerate an unbounded family (`each`, `the entire set`, `100% of`) and
manufacture false coverage. Ship this substance:

> the rollup rule matches a named lexical family (digit-form counts, `all`); it does not detect semantically
> equivalent rollups in other wordings, and no enumeration of wordings will close this — a rollup claim must
> be reviewed, not linted.

**Naming only the two observed instances would itself be a false disclosure** (β's words). And carry the
reason it is SAFE to disclose: **the actual control for a rollup claim's truth is the reviewer read, and the
linter never was that control.** The disclosure states a division of labour — it is not an apology for a gap.

**(c) Also disclose R2's NBSP tolerance:** the carrier-note binding tolerates a non-breaking space, which is
not line-wrap whitespace. Named, not repaired — narrowing it invites false-REDs.

## Task 5 — atomicity: a claim edit without its canonical edit must fail INSIDE this bundle

Every paragraph you add or change in `CUSTODY.md` has a canonical copy in the lint. **They move in the same
commit.** Build a test (**RF-4**) that goes RED when a shipped claim string diverges from its canonical copy
— so the failure surfaces in your own run, not at gauntlet.

## Task 6 — re-measure the newly-refused set against YOUR predicate, and resolve it here

Refuse-not-skip converts every previously-skipped paragraph into a violation. **Measured at `b2583d6`
against the proposed predicate that set is EMPTY** (14 paragraphs match canonically, 0 newly refused).
**That measurement does not carry to your predicate.** Re-run it against the predicate AS YOU BUILT IT,
including your own new Ceiling paragraph from Task 3, and **resolve anything it refuses inside this bundle**
— compliance lands in the same change, no report-only ramp. Report the count either way.

## Falsifiers you must ship — present AND OBSERVED RED

- **RF-1** — all **seven** near-miss authorings RED (`**A9 –`, `**A9 -`, `**A9 −`, `**A9:`, `  **A9 —`,
  `**Ceiling –`, `**Ceiling:`) **plus both em-dash controls RED**. Controls first; a control that does not
  fire invalidates the row.
- **RF-3** — revert the refusal to `continue` → RED. Without this, the guard can silently regress.
- **RF-4** — Task 5's atomicity test.
- **Status-token**: the four near-miss spellings RED **through the transform**, plus the exact-token control.

**Every mutant carries the no-op⇒FAIL guard** (`assert.notEqual(mutated, original, "...must actually change
the text")`) and **EOL-agnostic matching** (`\r?\n`, never a bare `\n` in a search literal).

## The observation bar — build to produce this artifact

For each falsifier: **the mutation logic lives in the committed test**, not in your invocation; the raw run
artifact is committed with its **command line and sha**; the no-op guard is present. α re-executes at close
and the outputs must agree. Build to that shape now rather than retrofitting it.

## Discipline
- **Suite floor 318**, 0 fail / 0 skipped / 0 todo. APPEND to tests; never shrink.
- **NEVER offer a green gate as evidence that a sentence is TRUE.** Claim truth is established by reading,
  not by a passing lint. Do not write "the lint is green so the claims are correct" in your envelope.
- Where you cannot close something, DISCLOSE it in the file, next to the code.

## Verify — each as its OWN command, read its own exit code (never pipe a gate through `tail` in an `&&`)

    cd engine
    node --test "test/*.test.js"
    npm run check:ship

## Envelope — FINAL message, JSON, nothing after it

    { "bundle": "A", "ok": true, "commit": "<sha>", "files_changed": ["..."],
      "suite": {"pass":0,"fail":0,"skipped":0,"todo":0}, "check_ship_exit": 0,
      "refuse_not_skip": "<how a non-matching resemblance is refused, + the header ceiling you wrote>",
      "canonical_transform": "<the function name, what it folds, where applied>",
      "newly_refused_count": "<count against YOUR predicate, incl. your new Ceiling, + how resolved>",
      "ceiling_paragraph": "<the P3 Ceiling text as shipped>",
      "disclosures": {"p1_p4_body_prose":"...","rt8_rollup_class":"...","nbsp_tolerance":"..."},
      "falsifiers_observed_red": {"RF-1":"...","RF-3":"...","RF-4":"...","status_token":"..."},
      "observation_artifacts": "<paths + command lines + shas>",
      "residuals_named": ["..."], "what_i_could_not_do": ["..."] }

Emit the envelope even if you stop early. Commit message starts `fix(A):`.
