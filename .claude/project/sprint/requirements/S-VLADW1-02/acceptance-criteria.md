# Acceptance Criteria — S-VLADW1-02 (Vlad Wave-1 AUDIT)

**Sprint:** `S-VLADW1-02`
**PRD:** `.claude/project/sprint/requirements/S-VLADW1-02/prd.md`
**Authored_by:** quality-lead (`claude-opus-4-8`, in-process consult), folded by Alex ε.

> **`verified_by:` status.** `PC-20260730-0084` carries NO `goal_verification` block, so the
> SP-20260518-007 fixture gate is a no-op here. Linkages name tests that **do not exist yet** — that
> is the expected design-time state, not a claim of coverage.

---

## DESIGN DECISION D-2 — the `FOUNDERS_CHECKLIST` dimension: REMOVE from the default receipt

β's B2 rule (verdict `7c4e2b96`) is a **three-way** rule: re-source only if the substitute measures
the *same underlying property*; if merely adjacent, do not re-source; if no true proxy exists, remove
the dimension from the default receipt for stranger repos rather than shipping it permanently unscored.

**Applied conclusion: REMOVE. Do not re-source. Do not ship as permanently NOT SCORED.**

The argument is class-level, not contents-level. The dimension's input is a **human-maintained
declaration of task completions** — its measurement mechanism is *"read what the founder asserts they
have done."* Every candidate substitute available in a stranger repo (README, LICENSE, CI config,
deploy config, `.env.example`, docs directory, release tags) is an **observation of an artifact**.

Declared-completion and observed-artifact are **different property classes**, not two sources for one
property. A checklist row saying "store account registered" is a fact about the founder's *off-repo
world*; nothing in a repo can observe it. Substituting an observed signal while keeping the
dimension's name is precisely the silent redefinition B2 bars: the receipt would print a label
meaning "the founder has done the launch prep" over a number meaning "this repo has tidy files."

**Why not NOT SCORED — and read this carefully, because the obvious rationale is INVERTED.**
`FOUNDERS_CHECKLIST.md` is a WarpOS/Vlad-scaffold artifact that a stranger repo has essentially never.
The tempting inference is that the checklist logic therefore just *doesn't fire* on stranger repos and
is harmless. **That is backwards, and β caught it at source.**

Absence fires the **harshest** branch. From `applyFoundersChecklist` verbatim: when the checklist is
missing or absent, it **caps `dimensions.product` at 60** *and* **pushes the gap string
`"FOUNDERS_CHECKLIST.md missing - human-only launch work is not tracked"` into the receipt** — on
**every stranger repo, every run**.

**So the reason not to port this pass is that it FIRES, not that it never runs.** Ported unchanged, it
would penalise a founder's product score for not having a WarpOS scaffold file they have never heard
of, and print a WarpOS-internal artifact name into their receipt as though it were a finding about
their project.

**An inverted rationale is more dangerous than a vague one, precisely because it sounds specific.**
"It never fires on stranger repos" invites a future contributor to port it back as harmless. It is not
harmless; it is actively wrong on exactly the repos this product exists to audit.

**The falsifier — RUN 2026-08-04 against source. It CONFIRMS the conclusion and FALSIFIES the
mechanic.** Read directly from `scripts/bootstrap/lastmile/lib/score.js` (the cited port source, whose
`score.js:134` citation **verifies** — line 134 is exactly `function applyFoundersChecklist`).

> **FLIP CONDITION WAS:** re-source iff every item the dimension scores is independently observable in
> an arbitrary repository.

**Result: the flip condition FAILS, so REMOVE stands — and it is now verified rather than inferred.**
The scorer's own gap string is verbatim *"FOUNDERS_CHECKLIST.md missing - human-only launch work is
not tracked"*, and open items are `{ id, label, dim }` founder-declared tasks. The source itself
classifies these as **human-only launch work**. They are not repo-observable, so no substitute
measures the same property. D-2's conclusion is confirmed **at source**, not by argument.

**But the mechanic in D-2 was wrong, and a builder must not implement it as written.** There is **no
`FOUNDERS_CHECKLIST` dimension to remove.** The nine dimensions (`product`, `technical`, `security`,
`privacy`, `monetization`, `funnel`, `deployment`, `analytics`, `support`) each have their own
`scoreX(state)` scorer fed by repo-observable signals. `applyFoundersChecklist` is a **post-hoc
cross-cutting CAP**, not a dimension:

- missing or invalid checklist → caps `dimensions.product` at 60 and pushes a gap;
- each open item → caps **whichever dimension the item names** (`item.dim`, falling back to `product`)
  at 60 and pushes a gap. So it can cap **any of the nine**, not just `product`.

**Corrected port action: do not port the `applyFoundersChecklist` pass at all.** Do not attempt to
remove a dimension — remove the *penalty pass*. Every dimension keeps its own repo-observed score.

**This is cleaner than D-2 anticipated, and it simplifies the aggregate problem.** Because the thing
dropped is a cap rather than a dimension, **the dimension set and the denominator are unchanged** for
stranger repos. Nothing disappears from the receipt; a penalty simply stops being applied. So the
cross-repo comparability consequence (β `e2a7c5b8`) **does not bite for this case** — it remains live
only for a dimension that genuinely cannot be scored for a given repo, which is a different situation.
AC-5.1/5.2 below are worded for removal-of-a-dimension and are **superseded by this finding**; the
binding criteria are AC-5.5 and AC-5.6.

- AC-5.5: Given a stranger repo, when readiness is computed, then the `applyFoundersChecklist` pass is
  **not invoked** and no dimension is capped on the basis of a founder checklist.
  verified_by: engine/test/audit/dimensions.test.js::no-checklist-cap-applied
- AC-5.6: Given the same repo scored with and without a `FOUNDERS_CHECKLIST.md` present, when both
  receipts are produced, then **the dimension set, the denominator and every dimension score are
  identical** — the file's presence changes nothing in the ported scorer.
  verified_by: engine/test/audit/dimensions.test.js::checklist-presence-changes-nothing

**The property is not deleted, it is re-homed.** Founder-readiness has a legitimate same-property
source: *ask the founder* — the same input class (a human declaration). Recorded as a **Wave-2** item
owned by the agent-face/intake sprint: an intake-declared dimension that appears only when the founder
has actually answered, never as a repo-inferred score. Recording it is what stops someone later
re-adding a "founder readiness" dimension backed by README-presence.

**Drift flagged, not silently resolved:** granular story S-5 and the **epic** DoD both still carry the
pre-B2 binary ("re-source *or* NOT SCORED") — removal is not among their options. A reviewer at
epic-close will read the removal as non-compliant. The three-way rule must be folded into the epic DoD
at the designated design-boundary fold. **This is an α / `/epic:fold` action, not ε's** — ε must not
edit an epic's Definition of Done.

---

## S-1 — Port-reference verification, recorded and re-runnable

- AC-1.1: Given each cited port source, when verification runs before porting, then each
  `{source_path, source_line}` is confirmed against the source repo and the result recorded — including
  any citation found wrong.
  verified_by: engine/test/audit/port-refs.test.js::every-citation-verified-and-recorded
- AC-1.2: Given a ported file, when it lands, then it records `{source_path, source_line,
  source_content_hash}` and a shipped script re-verifies every record on demand. This converts "a
  builder checked them" from an unrepeatable claim into a re-executable artifact.
  verified_by: engine/test/audit/port-refs.test.js::port-records-reverify
- AC-1.3: Given the D-2 falsifier, when S-1 verification runs, then the scored rows of the
  `FOUNDERS_CHECKLIST` dimension are inspected and the flip condition is explicitly recorded as met or
  unmet.
  verified_by: engine/test/audit/port-refs.test.js::d2-falsifier-recorded

## S-2 — Port detect/score/adapters, WarpOS originals untouched

- AC-2.1: Given the port completes, when the WarpOS canonical assets are inspected, then they are
  byte-identical to their pre-port state.
  verified_by: engine/test/audit/port-isolation.test.js::warpos-originals-untouched

## S-3 — WarpOS-specific refusals removed in the ported copy only

- AC-3.1: Given a non-WarpOS synthetic fixture repo, when the ported audit runs, then **zero** WarpOS
  refusals fire.
  verified_by: engine/test/audit/refusals.test.js::no-warpos-refusal-on-stranger-fixture

## S-4 — `score.js` adopted as the ONE readiness number

- AC-4.1: Given the ported engine, when readiness is computed, then exactly one scorer produces it and
  the checklist proxy is absent from the product tree.
  verified_by: engine/test/audit/single-number.test.js::one-scorer-checklist-proxy-absent

## S-5 — The `FOUNDERS_CHECKLIST`-dependent dimension (see D-2)

> Story title still reads "re-source ... or NOT SCORED" — the pre-B2 binary. D-2 applies the three-way
> rule; these criteria implement **removal**, pending the falsifier.

- AC-5.1: Given a stranger repo, when a receipt is produced, then the removed dimension appears in
  **no** receipt field and in **no** denominator.
  verified_by: engine/test/audit/dimensions.test.js::removed-dimension-absent-everywhere
- AC-5.2: Given the removal, when the receipt describes coverage, then the removal is disclosed once
  via the "what this audit covers" line plus `schema_version` — **not** printed per-receipt as an
  excluded/blank dimension, which would recreate the permanent blank removal exists to eliminate.
  verified_by: engine/test/audit/dimensions.test.js::removal-disclosed-as-schema-fact
- AC-5.3: Given the readiness dimension registry, when the removed dimension is inspected, then a
  one-line rationale is recorded there, so a future contributor cannot re-add a founder-readiness
  dimension backed by artifact-presence without encountering this reasoning.
  verified_by: engine/test/audit/dimensions.test.js::removal-rationale-recorded
- AC-5.4: Given any string reference to `FOUNDERS_CHECKLIST`, when the enforcer scans ported product
  code, then it fails.
  verified_by: engine/test/audit/single-number.test.js::no-founders-checklist-reference

## S-6 — The single-readiness-number enforcer

> Identifier-keyed checks are the **defeatable class** — an innocuous rename (`projectHealthIndex`,
> `maturitySignal`) beats them without anyone intending to cheat. Key on the **sink and the shape**.

- AC-6.1 **(F1)**: Given the readiness registry, when the enforcer runs, then it fails unless the
  registry resolves to **exactly one** `{module, symbol}` entry. There is deliberately **no
  allowlist-append path** — no expansion mechanism means no erosion path.
  verified_by: engine/test/audit/enforcer.test.js::registry-must-have-exactly-one-entry
- AC-6.2 **(F2)**: Given the product tree, when more than one source location constructs or spreads the
  `Readiness` struct, or writes the receipt's readiness slot, then the build fails. The constructor is
  the choke point a rename cannot move.
  verified_by: engine/test/audit/enforcer.test.js::single-construction-site
- AC-6.3 **(F3)**: Given any object/array literal outside the authorized module mapping ≥3
  dimension-shaped keys to numeric values (or ≥3 entries with a weight-like property), when the
  enforcer runs, then it fails. You cannot compute a composite without a weights table; the function
  name is free, the table is not optional.
  verified_by: engine/test/audit/enforcer.test.js::no-weights-table-outside-authorized-module
- AC-6.4 **(F4)**: Given a file importing ≥2 dimension modules and containing a normalisation form
  (`/ total`, `* 100`, `reduce(...)/length`, a weighted sum) outside the authorized module, when the
  enforcer runs, then it fails.
  verified_by: engine/test/audit/enforcer.test.js::no-composite-normalisation-outside
- AC-6.5 **(F5)**: Given the authorized module, when it exports more than one readiness-producing
  symbol, then the enforcer fails — otherwise the obvious defeat is hiding the second scorer inside the
  blessed file.
  verified_by: engine/test/audit/enforcer.test.js::authorized-module-exports-one-symbol
- AC-6.6 **(F6 — the enforcer's own red state)**: Given a planted second scorer, deliberately renamed
  to something innocuous and carrying its own weights table, when the enforcer runs, then it goes RED
  via F2/F3. If the fixture goes green the build fails **because the enforcer is untrustworthy**. An
  enforcer with no proven red state is enforcement debt wearing a green badge.
  verified_by: engine/test/audit/enforcer.test.js::planted-second-scorer-trips-enforcer
- AC-6.7 **(F7)**: Given the enforcer errors, times out, or emits malformed output, then the build goes
  RED. Runner error → non-zero; **fail closed, never green on crash.**
  verified_by: engine/test/audit/enforcer.test.js::runner-error-is-red

## S-7 — Intake fallback for undetectable stacks

- AC-7.1: Given a fixture repo whose stack cannot be classified, when the audit runs, then it routes to
  the intake fallback and returns a receipt state — not an error and not a crash.
  verified_by: engine/test/audit/detect.test.js::undetectable-routes-to-intake

## S-8 — Honest degradation and the aggregate disclosure

> `readiness` is **not a number**. It is a struct that cannot be serialised or rendered without its
> denominator and exclusions. That converts "never print a bare score" from a convention someone must
> remember into a serialise-time impossibility.
>
> ```
> Readiness = { score, scale, scored_count, applicable_count,
>               excluded: [{ dimension_id, reason_code, cause_text, action_text }],
>               comparability: "full" | "partial" }
> ```

- AC-8.1: Given an unscored dimension, when the overall number is computed, then that dimension
  contributes **neither 0 nor a pass** — it is excluded from numerator and denominator alike.
  verified_by: engine/test/audit/aggregate.test.js::unscored-never-imputed
- AC-8.2 **(the highest-value test in the sprint)**: Given a dimension that cannot be scored, when it
  is added to or removed from the run, then the overall score is **unchanged**.
  verified_by: engine/test/audit/aggregate.test.js::score-invariant-to-unscorable-dimensions
- AC-8.3: Given a `Readiness` value, when it is serialised or rendered, then it cannot be emitted
  without `scored_count`, `applicable_count` and `excluded[]`. No renderer accepts a bare `score`.
  verified_by: engine/test/audit/aggregate.test.js::bare-score-cannot-be-rendered
- AC-8.4: Given `scored_count < applicable_count`, when the number is presented anywhere — receipt,
  log, MCP return or summary line — then it is **not** rendered as a standalone value, and the
  exclusion is disclosed in the **same visual unit** as the number (not a footnote, hover, or details
  pane).
  verified_by: engine/test/audit/aggregate.test.js::partial-coverage-never-bare
- AC-8.5: Given any receipt with an unscored dimension, when it is rendered, then it states that the
  number is **not comparable** to a receipt with a different denominator. This is the rule most likely
  to be cut for brevity and is how "68" gets compared to another repo's "68".
  verified_by: engine/test/audit/aggregate.test.js::comparability-warning-present
- AC-8.6: Given partial coverage, when the score is presented, then it is **never** rescaled,
  normalised up, projected, or presented as an estimated complete score.
  verified_by: engine/test/audit/aggregate.test.js::no-normalisation-up
- AC-8.7: Given the disclosure prose, when the struct changes, then the prose changes with it — prose
  is **generated from the same structure the number is computed from**. Hand-written prose drifts from
  the arithmetic within two sprints and the drift is invisible.
  verified_by: engine/test/audit/aggregate.test.js::prose-generated-from-struct
- AC-8.8: Given any could-not-run outcome, when presented, then it carries a **cause clause** and an
  **actionable next step** ("we couldn't check this because the project has no tests yet; adding one
  test in <area> would let us score it"), never a bare status token. *(Form only — see the judgment
  list below.)*
  verified_by: engine/test/audit/degradation.test.js::cause-plus-action-present
- AC-8.9 **(the DISPOSITION-GENERAL obligation — β `e2a7c5b8`, applied verbatim to the sprint DoD)**:
  Given **however** the receipt handles a dimension it does not score for a given repo — NOT SCORED,
  **REMOVED** from the default set, or any future disposition — when the receipt is produced, then that
  handling is **stated on the receipt**. And where **removal changes the dimension set**, two repos'
  readiness numbers are computed over **different sets** and are **not comparable unless the receipt
  says so**.
  verified_by: engine/test/audit/aggregate.test.js::disposition-general-handling-disclosed

> **Why this AC is worded over dispositions rather than over "unscored":** the original obligation
> governed only NOT SCORED, but D-2 moved the live case to REMOVED — so as written it would have
> policed a disposition this sprint no longer uses while leaving the one it *does* use ungoverned. That
> is the half-applied-amendment defect, and it is exactly the kind of gap that reads green.

## S-9 — Running the audit against a corpus **[SPLIT: (a) ungated / (b) GATED]**

> ### EXPECTED DIVERGENCE — the ported engine and WarpOS's scorer will DISAGREE on the same repo
>
> **This is correct behaviour, not a port defect.** Record it before dogfood, because the corpus run
> against `dreamteam` / `companycam` / `almanac` is exactly where someone will see two different
> numbers for one repository and file a bug against the port.
>
> The divergence is the **intended** consequence of not porting `applyFoundersChecklist` (D-2):
>
> | Case | WarpOS scorer | Ported engine |
> |---|---|---|
> | `FOUNDERS_CHECKLIST.md` **missing** (every stranger repo) | caps `product` at 60 **and** emits the `FOUNDERS_CHECKLIST.md missing` gap | no cap, no gap — `product` scores on its own repo-observable signals |
> | present **with open items** | applies a per-item cap to each item's named dimension | no caps — dimensions score on their own signals |
>
> So for **any** repo lacking the file, expect the engine's `product` score to be **equal or higher**
> than WarpOS's, and the engine's gap list to lack the checklist gap entirely.
>
> **AC-9.4:** Given a corpus repo scored by both, when the numbers differ in the ways tabulated above,
> then that is recorded as **expected divergence** and **must not** be filed or fixed as a port defect.
> A reviewer or builder proposing to "restore parity" by porting the checklist pass is proposing to
> re-introduce the defect D-2 removed.
> verified_by: engine/test/audit/dimensions.test.js::divergence-from-warpos-scorer-is-expected
>
> **What this does NOT license.** It is not a general permission for the ported scorer to disagree with
> its source. Divergence is expected **only** where it traces to a recorded decision — currently just
> D-2. Any *other* difference between the ported and source scorers is a port defect until shown
> otherwise, and the per-file `{source_path, source_line, source_content_hash}` records from AC-1.2 are
> how that is adjudicated rather than argued.
>
> **The one-readiness-number rule is untouched.** It bars *two scorers inside the product*; WarpOS's
> scorer is not in the product. Nothing here weakens S-6's enforcer.

> The dogfood-corpus authorization is an **OPEN operator gate**. Without a split, this DoD item cannot
> close, and an unclosable item under delivery pressure is how fudged evidence enters a record.

- AC-9.1 **(a — ungated, automatable)**: Given ≥3 **synthetic fixture** repos the sprint constructs
  itself, when detect/score/adapters run inside the engine, then all three produce receipts with zero
  WarpOS refusals.
  verified_by: engine/test/audit/corpus-synthetic.test.js::three-fixtures-produce-receipts
- AC-9.2 **(b — GATED on operator corpus authorization)**: Given ≥3 **authorized real** repositories,
  when the audit runs against them, then observations sufficient for the receipt interior are captured.
  **Not designed against, not scheduled, and not closeable until the gate clears.**
  verified_by: not_applicable — gated on an open operator authorization; no test may assert this until
  the corpus is authorized in writing.

> **The substitution's limits, stated honestly:** synthetic fixtures are **weaker** evidence than real
> repos. They cannot surface real stack shapes, repository size and performance behaviour, or odd git
> states — precisely the surprises the plan contract's own `unsafe` assumption predicts. Fixtures
> unblock the build; **they do not close the gate.**
>
> ### The three binding conditions on this split (β `d7f31a68`, Q3(a)) — so the gated half cannot decay
>
> The split is the build-the-seam posture applied to *evidence*: proceed, but never let delivery
> pressure manufacture proof. These three exist because the failure mode is not the split — it is the
> gated half quietly never closing while the sprint reads done on the ungated half alone.
>
> 1. **AC-9.2 is a SEPARATELY TRACKED, NON-CLOSEABLE item** — never a sub-bullet of a closeable one. A
>    gated obligation nested under a closeable parent disappears the moment the parent is ticked.
> 2. **The parent may not report satisfied while AC-9.2 is open.** Partial evidence **amends, never
>    closes** — the same rule ED-340 already carries for the enforcer roster. "Passed on fixtures" is an
>    amendment to the record, not a closure of it.
> 3. **Record what the fixtures CANNOT show, next to the result.** They prove the port runs and that
>    nothing WarpOS-specific refuses; they **cannot** prove real-world stack diversity, which is the
>    entire reason the DoD asked for ≥3 *real* repos. Without this stated in place, a later reader reads
>    fixture-green as corpus-green — which is precisely the fabricated-evidence class this sprint's
>    whole honesty apparatus exists to prevent.
>
> - AC-9.3: Given the sprint's completion record, when AC-9.2 is open, then the corpus DoD item is
>   reported **not satisfied**, tracked as its own non-closeable row, and the fixture result is recorded
>   with its stated limits alongside it.
>   verified_by: not_applicable — a record-discipline obligation on the tracker, enforced at sprint
>   close by review rather than by a product test.

## S-10 — Receipt interior v1 **[GATED]**

- AC-10.1 **(GATED)**: Given real dogfood observations from S-9(b), when the interior is minted, then
  it fills ENGINE's three untyped J4 slots without changing the envelope.
  verified_by: not_applicable — evidence-gated on the corpus authorization.
- AC-10.2: Given whatever interior is minted, when ENGINE handles the receipt, then ENGINE still never
  validates or branches on the interior (the J4 invariant survives the minting).
  verified_by: engine/test/audit/receipt-interior.test.js::engine-still-treats-interior-opaque

---

## Product-priority ruling for this sprint

Ranked by cohort impact, not raw severity. **Golden user:** the non-technical founder pointing Vlad at
their own prototype. **Vulnerable user:** the founder whose repo is in *bad* shape — no tests,
undetectable stack, messy git — the cohort honest degradation exists for and the one most easily misled.

**A crash on an exotic repo is LOWER priority than a plausible-looking fabricated number.** The crash is
visible and the founder retries; the fabricated number is invisible, believed, and destroys the
product's only asset — trust in the receipt. **A confidently-wrong receipt is P0 even though it is not
a crash.**

## Criteria that are JUDGMENT, not automatable

Stated plainly so a passing form-test is never mistaken for the real thing:

- **Does the ELI5 wording read as information rather than breakage to a non-technical founder?** The
  *form* is automatable (AC-8.8); the *reception* is not. `verified_by` = a rubric-scored review with a
  recorded verdict artifact. Do not let AC-8.8 masquerade as this.
- **Does a substitute signal measure the SAME property?** (D-2.) Irreducibly a judgment call;
  `verified_by` = the recorded decision plus the AC-1.3 falsifier result.
- **Is the receipt interior v1 or v0.9?** Judgment, and evidence-gated on the corpus.
- **Is the number CALIBRATED — does 68 mean anything?** **Not verifiable in this sprint at all**, with
  or without the corpus, because there is no ground-truth readiness label to validate against.
  Acceptance is scoped to *honestly computed and honestly disclosed*, **never** to *accurate*. Any
  criterion implying the score is meaningful is unverifiable as written and must be reworded.
