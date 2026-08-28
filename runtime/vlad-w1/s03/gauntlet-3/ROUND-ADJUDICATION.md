# S-VLADW1-03 — GAUNTLET 3 — THE QUALIFYING RUN — CONDUCTOR ADJUDICATION

Conductor: Alex ε · commit `b2583d6` · evidence `runtime/vlad-w1/s03/gauntlet-3/`
Release rule S1–S5 pre-committed by β at row 305 (`7c05e9d1`), before any result existed.

> **α APPLIES THE RULE. I HAVE NOT RULED AND WILL NOT.** This is the evidence package and my read of what
> the lanes established. The four records and the four evidence files are the artifact; this document is
> navigation, not a verdict.

> Probe credential literals are redacted to `<REDACTED-DECOY>`. They were synthetic decoys, never real
> secrets, but this repo's secret-guard refuses the shape and is right to.

## Roster and liveness

| Lane | Record | ok | Verdict |
|---|---|---|---|
| `qa-reviewer` | `d-mtdcwc12-89d1be9a` | true | **FAIL** |
| `backend-reviewer` | `d-mtdf0prn-8bfbfe9b` | true | **FAIL** |
| `security_claude_hunter` | `d-mtdfmjhm-2002e049` | true | **FAIL** |
| `security-reviewer` (agy) | `d-mtdcb3tf-9cba8fdd` | true | **FAIL** |

**`gauntlet-verify`: PASS, exit 0** (`gauntlet-verify.txt`) — *"All required gauntlet roles produced a
well-formed completion record."* 10 records considered in window.

**Two honesty notes on that gate.** (1) The `fell-back` flag on `security-reviewer` (6 records) is my own
two failed agy attempts inside the window — the argv-ceiling BLOCK and the missing-time-unit rejection —
not a provider fallback and not a review signal; the third attempt returned `ok:true` with a real verdict.
(2) The `backend-reviewer` record was written on RESUME from its existing evidence file after I died at a
usage limit; the lane was NOT re-run, and its evidence is the lane's own verbatim return.

**All three Claude lanes returned their JSON on the first dispatch.** In gauntlet 1 and 2 combined, three
lane-runs were lost to truncated mid-thought returns. Each brief this round named that failure to the lane
it had happened to and told it to cut scope rather than run out of room before emitting. That is the one
process change I would keep.

## Isolation

Three mutating lanes ran **SERIALIZED on the live worktree**, one at a time, in order qa → backend →
security_claude_hunter; agy ran alongside because it is served toolless-inline and mutates nothing.
Isolated per-lane copies were built and REJECTED because a fresh checkout was not byte-faithful at the time
(see ROUND-RECORD §3b) — a lane judging one would have been judging my scaffolding. Tree verified by me
between every lane and at the end: HEAD `b2583d6`, `git status --porcelain -- engine/` **0 lines**, suite
**318 pass / 0 fail / 0 skipped / 0 todo**, `check:ship` **exit 0**.

**A correction against myself, caught by the backend lane.** I repeatedly reported the tree "clean /
porcelain empty" when what I ran was the path-scoped `git status --porcelain -- engine/`. Full porcelain is
41 untracked entries, all under `.claude/` (session checkpoints, handoff stubs), unchanged before and after
every lane, none under `engine/`. The lane refused to assert a clean tree on my wording and flagged it
rather than rounding it. It was right to.

---

# S-criteria — what the lanes established

## S1 — RE-ESTABLISHED. Every lane that assessed it says HOLDS.

`security_claude_hunter` is the only lane that ran attacks, and it returned **S1 holds**. Both other Claude
lanes returned `cannot-assess` and said so explicitly rather than inferring it — the qa lane: *"I ran no
leak attempt, no TOCTOU battery... Cross-check the security lanes."* The backend lane: *"NOT ASSESSED AT
ALL. I neither confirm nor deny S1 and my lane must not be read as evidence for it."* agy reports S1 holds.

The security lane's novel attack (below) **did reach a real child's argv with a secret-shaped value** — and
the lane itself declined to fire S1 on it, because it requires a hostile caller already holding the
plaintext and **there is no shipped call site of that shape**. Per the rule's own discriminator that is a
defeated CONTROL, not a leak. I concur with the grading; inflating it would corrupt a criterion that is
honestly met.

## S2 — ALL FOUR LANES SAY FAILS, on eight independent grounds, from four directions.

This is not one finding re-confirmed four times. Each lane found different sentences.

**`backend-reviewer` F-1 — HIGH, and the sharpest.** 10b's derivation shape predicates require an **exact
em-dash** (`/^\*\*(A\d+)\s+—\s/`, `/^\*\*Ceiling\s+—\s/`), and `extractBindableParagraphs` `continue`s on
non-match **with no violation recorded** — invisible, not refused. The lane injected one new unbound claim
paragraph seven ways, controls first:

| authoring | result |
|---|---|
| `**A9 — ...**` em-dash (control) | **RED** — `unbound-paragraph` |
| `**Ceiling — ...**` em-dash (control) | **RED** — `ceiling paragraph ... has NO canonical copy` |
| `**A9 – ...**` en-dash · `**A9 - ...**` hyphen · `**A9: ...**` colon · `  **A9 — ...**` indented · `**Ceiling – ...**` en-dash | **ALL GREEN, zero violations of any kind** |

The shipped sentence at `CUSTODY.md:7-11` promises *"EVERY paragraph led by a bolded `Ceiling` lead-in"* is
bound and that *"a NEW Asserted or Ceiling paragraph added here is RED until it is bound"*. An en-dash
Ceiling paragraph is a paragraph led by a bolded Ceiling lead-in, and it ships green. The lane's words:
**"This is not true-one-reading-over; it is false on the sentence's own words."** The pre-10b hand-kept list
would have failed VISIBLY; the derivation fails INVISIBLY. **This is a fix-attempt-2 regression, from the
bundle whose whole purpose was to make claims un-invertible.**

**`security_claude_hunter` F-1/F-2/F-3 — MEDIUM, novel, execution-proven.** `spawn-shim.js:262` does
`normArgs = Object.freeze(args.map((arg) => String(arg)))` — and **`args.map` is caller-controlled**. An
Array subclass whose `map()` ignores the callback means the elements are never stringified by the wrapper;
the scan calls `String()` once (benign) and Node calls `toString()` again inside `spawn()` (secret).
Observed with every gate green: `toString() calls = 2`, `WRAPPER REFUSED? NO`, `CHILD ARGV CARRIES THE
SECRET-SHAPED VALUE? YES`. This is the T8/T4 TOCTOU reopened through a door the T4/A3 fix did not close, and
it falsifies three shipped strings: `CUSTODY.md:59-62` (argv refusal), `CUSTODY.md:113-115` (the "four
channels refused" structure), and `spawn-shim.js:411-415`'s claim that *"'Check one object, spawn a
different one' is now structurally impossible for command/args"* — true for `env`, false for `args`.

**`qa-reviewer` F-1/F-2/F-3 — MEDIUM ×3.** (a) 10c's own commit falsified the bound preload Ceiling sentence
*"not named on any other surface, shipped or internal"* by naming that residual in
`entry-bootstrap.test.js:687`. (b) 10b authored the spawn-shim attribution sentence *after* 10d had already
modified `spawn-shim.js` in the same cycle. (c) The header's what-is-NOT-bound list, which promises to say
it *"plainly rather than generalised"*, omits the P1–P4 body prose — proven by three flat-falsehood
mutations shipping green.

**`security-reviewer` (agy) F-1 — LOW, cross-family.** Inside 10d's own repair: **absorption iterates only
the current call's `namesArr` while deletion sweeps the full `capturedNames` history**, so a
previously-captured name omitted from a partial call is deleted WITHOUT being absorbed, destroying a
mid-session value irretrievably. Unreachable in production (all shipped callers pass full lists) — but it
falsifies the CLASS claim 10d added. **Third round running that the cross-family lane found something all
Claude lanes missed.** The backend lane's own F-4 circled the same `capturedNames` bookkeeping, *tried to
construct the losing case and explicitly could not*; agy named the asymmetry the backend lane could not
build. The two are compatible and independent: agy's is deletion-without-absorption, the backend lane's was
escape-from-deletion (which the security lane separately attacked and found sound).

**THE SECOND-ORDER FINDING α SHOULD WEIGH MOST.** The security lane verified that fix attempt 2's bind
**PINNED VERBATIM the two sentences it falsified** (`grep -c` → 1 in `custody-claim-lint.js` for each). So
**`check:ship` now REQUIRES a sentence proven false by execution to be present verbatim on the shipped
surface** — an honest correction turns the ship gate red until the lint's bound set moves in the same
change. The lane scoped this precisely and correctly: the untruth itself is NOT new (the argv sentence is
unchanged across `0732cd8..b2583d6`), **but making a false claim gate-enforced is new at this commit.**

## S3 — HOLDS across all three lanes that assessed it, with one contributing concern.

qa: holds, observed RED-on-removal itself. backend: holds, execution-proven for clauses 1 and 2, and it
flags honestly that clause 3 (*"the walker asserts BOTH classification directions"*) was **read-verified,
not mutated**. security: holds.

**The contributing concern — security F-4 (MEDIUM, S3), and it does not fail the criterion.** The driver
entry's scrub call is proven load-bearing only at the TEXT/AST level, never at runtime: semantically
neutering it (`initCredentialCustody([])`) leaves the environment still scrubbed, because the driver's graph
reaches `model-seam.js`, whose own module-body call scrubs anyway. Mutant M2 → probe `AFTER: AK=false
OT=false` (still scrubbed), `check:ship` exit 0, exactly ONE test red (the walker classifier). M3, literal
deletion → still scrubbed at runtime, 3 text/AST tests red. By contrast M1 on `server-entry.js:107` produced
4 reds **including the runtime ones**. The consequence no text classifier can see: under the neutering the
scrub moves from evaluation position 3 to after the Agent SDK's own module body. **S3's bar is "a committed
standing test goes RED", which it does — so this is a strength-of-proof finding, not a criterion failure.**

## S4 — one lane holds, two cannot-assess. Materially stronger than the two rounds that carried it on assertion, and still not fully observed.

- **qa: holds** — but says its own S4 rests *partly on reading rather than execution* for three of the
  oracles, and names exactly which it personally observed RED (F-4's oracle via six real-lint mutations;
  F-5's via collapsing missing-name into missing-file; and the **AC-8.4 mutation twin**).
- **backend: cannot-assess** — did not systematically mutate all five; observed F-2 red incidentally.
- **security: cannot-assess**, and this is the most useful S4 evidence in the round: it drove **three**
  falsifiers RED itself under real mutation — **F-2** (M1 on `server-entry.js:107`), **F-3** (deleting the
  ABSORB assignment at `env-scrub.js:314`), and **AC-8.4** (mutating `sentinelHook` to always return
  `{leaked:false, keys:[]}`), the last **re-verified at close rather than cited**, which is what the rule
  demands. It states plainly: *"F-1, F-4 and F-5 are present, committed, self-mutating and non-skipped, but
  I did NOT independently drive each to RED. Do not read my 'cannot-assess' as a pass."*

**Consolidated: F-2, F-3 and AC-8.4 are OBSERVED RED at this close by at least one lane each. F-1, F-4 and
F-5 are present, committed, non-skipped (suite reports 0 skipped / 0 todo) but NOT observed RED this round
by any lane.** Two rounds ago nobody had mutated any; that is the delta, and it is real. Whether "present,
committed, non-skipped, previously observed" meets β's *"each OBSERVED RED under its own mutation"* at THIS
close is α's call, not mine.

## S5 — one lane holds on the letter, two cannot-assess, and two lanes independently flag the same gap.

qa holds and reasons it explicitly: S5 permits "recorded OR shipped", the ROUND-RECORD §4 record is real and
is not the build spec itself, and `CUSTODY.md` makes no shipped claim that the class-form residual bounds.
It then states the tension for α rather than resolving it: **a `CUSTODY.md` reader is handed the INSTANCE
without the CLASS.** The security lane's F-6 reaches the same fact independently by grep (zero matches for
the class-form wording on the shipped surface). backend and security both return `cannot-assess` on S5
overall because neither holds the build spec's residual list.

**Unresolved and owed:** whether the CLASS-form residual was carried into the **successor tracker pointer**,
which ROUND-RECORD §4 says it must be. The qa lane could not check it — the tracker is outside its allowed
roots. **I have not done it either.** That is an open S5 item at this close, not a satisfied one.

---

# What I am handing α

**Four `ok:true` records, `gauntlet-verify` PASS exit 0, four FAIL verdicts, and a tree that is green on its
own gates** (318/318, `check:ship` exit 0) **while four independent lanes say its shipped copy is not true.**

The pattern across three gauntlets is now unmistakable and belongs in α's read: **every round, the repair
produces a new defect one layer out from the thing it fixed.** Round 2: the invocation control was inert.
Round 3: the mechanism that binds claims cannot see a paragraph authored with an en-dash, and the bind that
was supposed to make claims un-invertible has instead **pinned two false sentences into the ship gate**.

**I have not applied the rule and will not.** Two criteria in particular turn on judgments that are α's:
whether S4's "present, committed, non-skipped, three-of-six observed RED this round" meets a bar written as
"each OBSERVED RED under its own mutation"; and whether S5's "recorded OR shipped" is satisfied by a record
in `runtime/` for a residual whose INSTANCE ships and whose CLASS does not.
