# Lane evidence — `backend-reviewer` (BINDING) — S-VLADW1-04 gauntlet-1 (DIAGNOSTIC)

Shape: `in-process-agent` · claude-opus-5 · elapsed 632953 ms · 32 tool_uses · agentId `afbae033afd24b1de`
Target: commit `b9b8df3`. Brief: `lane-backend.md`. Second of three SERIALIZED lanes.
**It returned its JSON on the first dispatch** — this lane's family was lost to truncated returns three
times across the predecessor's gauntlets.

**Verdict: FAIL.** **S4-1 FAILS · S4-2 holds · S4-3 holds · S4-4 holds · S4-5 holds · S4-6 holds.**
Worktree clean — it mutated nothing (pure-function probes plus temp files only).

## F-1 — HIGH — S4-1 — S4-2(d) DISCHARGED, AND IT FOUND AN UNDISCLOSED FAIL-OPEN

**`**Ceiling** — <claim>`** — bold closed *around the keyword* — **ships GREEN at exit 0.**

- In-memory: `GREEN | V9 bold-closed keyword **Ceiling** <EM> | n=0 | (no rules)`
- CLI on a temp copy: `custody-claim-lint: OK — 4 Proven claim(s) checked, 15 bindable paragraph(s)
  derived … 0 violations.` **EXIT 0**, with the paragraph *"**Ceiling** — this package DOES verify that its
  controls are invoked in YOUR install, and no dependency can leak your key."* sitting in the Proven section.
- **Mechanism:** `RESEMBLANCE_KEYWORD` matches (`m[0]` = `**Ceiling`), then `rest.slice(0,1)` is `*`, which
  canonicalizes to `*` and is neither dash, colon nor space — so `resemblesBindableLeadIn` returns null and
  **the line is SILENTLY SKIPPED. The exact fail-open bundle A Task 1 was built to close.**
- Controls fired: `**Ceiling <EM>` and `**A9 <EM>` both RED as `unbound-paragraph`. Baseline clean.
- **`CUSTODY.md:28-30` names only two escapes — "an unbolded lead-in, or one opening with some other
  keyword". V9 is bolded AND opens with the keyword, so it is OUTSIDE the disclosed class.**

## F-2 — MEDIUM — S4-1 — same class, markdown block prefixes

`- **Ceiling — ` (list item) and `> **Ceiling — ` (blockquote) both **GREEN**; the resemblance regex anchors
on `^\s*\*\*` and a `- ` / `> ` prefix is not whitespace. Sharp contrast: V5 two-space indent **IS** caught
(`unbindable-paragraph-shape`), and its refusal text even says *"must start at column 1 … and no leading
whitespace"* — **so indentation was considered and markdown block prefixes were not.**

## F-3 — MEDIUM — S4-2 — the transform folds dash CLASS but not dash COUNT, ABSENCE, or ZERO whitespace

RT-7 battery, Asserted token injected into the Proven section. **Control RED.**
**Closed as claimed (all RED):** en-dash, ascii hyphen, U+2212, figure dash, lowercase, mixed case, extra
spacing, tab separators, NBSP separators, newline-wrapped.
**STILL GREEN:** `ASSERTED—NOT VERIFIED` (no spaces), `ASSERTED: NOT VERIFIED`, `ASSERTED NOT VERIFIED`,
`ASSERTED -- NOT VERIFIED`, `ASSERTED, NOT VERIFIED`.
The dash-CLASS half is **genuinely property-based and verified strong** — U+2012/2015/FE58/FF0D/2212 all
fold and `~` correctly does not. **But "extra internal spacing" was one of the four originally-observed
variants the transform claims to close, and the ZERO-spacing direction is not named in its stated ceiling.**

## F-4 — MEDIUM — S4-5 — E's route (a) control is present-but-never-observed-RED

Bundle E gave the driver's scrub a runtime consequence (a throw at load if a credential-shaped name
survives). **No test mutates the driver's scrub call and observes that throw.** `grep -rln host-free-driver
test/` returns five files; none neuters the call. **The repo's own standing rule calls that "enforcement
debt wearing a green badge."**
Contrast, verified by read: RF-7 in `custody-runtime.test.js:322-364` **is** genuinely runtime — it writes a
mutant copy, asserts the mutation is non-no-op, asserts the mutant still starts, and asserts the report is
absent from a real child's stderr.

## F-5 — LOW — D's indexed loop changed sparse-argv delivery

Array **holes** now reach the child as literal `"undefined"` arguments; the pre-D1 `args.map(String)` route
preserved holes. Probe P12: child argv carried two literal `undefined` entries, `argCount:4`. **Not an
acceptance widening** — both containers were accepted before and after — but a behavioural change no test
covers and not mentioned in D's "strictly narrowing" claim.

## F-6 — LOW — going-in item 3 REFUTED as a false-green

The hand-wrapped literal is real, **but** `replaceAcrossEol` returns the source unchanged on a miss and the
next line is an `assert.notEqual` no-op guard — **a re-wrap fails loudly, not silently.** Independently
matches the qa lane's F-6.

## Going-in items adjudicated — agrees with qa on all four

1. **F′'s deviation JUSTIFIED**, minimum reconciling change TRUE as built; class-form force preserved
   ("That single exception aside", "apart from the start-up self-check named above"). *"Rule 4 binds TEXT
   and cannot see contradiction"* — the alternative was a document asserting AC-8.6 both landed and not.
2. **C's scope exception JUSTIFIED and mechanically unavoidable.** Notes the coupling cost: the count is now
   a hardcoded sprint-stamped assertion, so any later pointer change re-breaks a file outside the editing
   bundle's scope.
3. **CONFIRMED as brittleness, REFUTED as false-green** — see F-6. *"Should be logged, not fixed under
   pressure."*
4. **The refusal to invent an anchor is CORRECT** — the shipped text anchors to `0732cd8` as the RECORDING
   commit and states plainly the observing commit is unrecoverable. *"An honest unknown carried on the
   shipped surface rather than a fabricated one."*

## Regressions this build introduced

- **Bundle A newly authored the header sentence at `CUSTODY.md:24-30`** claiming the lint refuses a
  paragraph "when it RESEMBLES one — bolded, opening with an `A<n>`, `Asserted` or `Ceiling` keyword", with
  exactly two named escapes. **That sentence is FALSE as built (F-1, F-2).** The blindness pre-dates bundle
  A; **the false sentence claiming it closed is new this build, and it is on a shipped surface.**
- **Bundle D's sparse-argv delivery change** (F-5).

## `what_i_could_not_assess`

- **RF-3 not independently re-executed** — "holds" on S4-2(b) rests on the builder's artifact, not its own run.
- **RF-6 verified by READ only** — `sweepNames` is `Object.freeze(Array.from(new Set([...capturedNames,
  ...namesArr])))`, both loops iterate it, deletion population unchanged from pre-fix (absorption widened to
  match deletion, not the reverse). Did not run the mutant.
- **F-4's throw not execution-verified** — established that no test observes it; did not build a mutant
  driver copy. *"The control is real" is read-verified, not execution-verified.*
- **Did not run `npm pack --dry-run` itself** — ship-set statements inherited from the document and the qa lane.
- **Walker residuals NOT instantiated on the shipped graph** — *"that is the check that defeated the control
  in the predecessor's gauntlet-2 and it remains unperformed by this lane. Budget was spent on S4-2(d),
  which was my assigned headline."*
- **RT-8 rollup GREENs are RE-CONFIRMATIONS, not new** — `CUSTODY.md:33-40` names the class explicitly
  including *"a spelled-out numeral, or the word `every`, passes it"*. RT-2's NBSP tolerance likewise
  disclosed and confirmed. **Both S4-6 named residuals travel.** RT-2's control fired correctly.
