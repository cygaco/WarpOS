# S-VLADW1-04 — BUILD ROUND RECORD

Conductor: Alex ε · surface vlad `wt/S-VLADW1-01-engine`, base `b2583d6` · build authorized by α override
2026-08-28 (β row 311 `c5d0e293`) · release rule pre-committed β rows 309 (`e7a4b619`) + 310 (`3a5f81c7`).
**ONE fix attempt exists this sprint.** α applies the rule at the qualifying close — not ε.

## Bundles

| bundle | dispatch_id | ok | elapsed_ms | commits |
|---|---|---|---|---|
| A (1st) | `d-mtdiodo1-5ab84204` | **false** | **1200176** | none — bound timeout, work uncommitted |
| A′ resume | `d-mtdjgavn-de3e3b4a` | true | 277156 | `f1291db`, `4f297d4` |
| B | `d-mtdjn6vw-a79c6978` | in flight | — | — |

## THE TIMEOUT SIGNATURE — second occurrence this sprint family, and it is the ED-257 lesson repeating

**Bundle A's first dispatch died at `elapsed_ms` 1200176 — the full 20-minute background bound — with
`ok:false`, `exit_code:null`, 0 stdout bytes, and 545 insertions on disk across exactly its three allowed
files. HEAD had not moved.**

This is the third distinct death signature this sprint family has produced, and they are now cleanly
separable — the ledger row alone classifies none of them:

| signature | ledger | disk | recovery |
|---|---|---|---|
| foreground clamp | `ok:false`, elapsed **540xxx** | work UNCOMMITTED | resume with `WARPOS_DISPATCH_BACKGROUND=1` |
| nothing spawned | **no row at all** | nothing, anywhere | re-fire; the shell ate the command |
| bound timeout AFTER commit | `ok:false`, elapsed **1200177** | work COMMITTED, tree clean | verify by diff; the envelope was the loss |
| **bound timeout WITHOUT commit** (this one) | `ok:false`, elapsed **1200176** | work UNCOMMITTED, HEAD unmoved | **resume-and-finish, never rebuild** |

**The ED-257 lesson recurred and I own it.** S-03 lost bundle 10c to a 16810 B brief; the wrapper warned in
stderr and the warning went unread. I sized A's brief at 9821 B — under the 12000 B floor and inside my own
≤10 KB target — **and it still needed more than 20 minutes.** The floor is necessary but not sufficient: A
carried six tasks plus four falsifiers plus an observation-artifact requirement, and *task count* drove the
duration more than byte count did. **The right-sizing metric should be tasks-that-require-a-verified-run,
not brief bytes alone.** The resume was 3.6 KB and finished in 277 s.

## ORPHAN CHECK — run late, and the honest version of what happened

β's doctrine and the lead's instruction both say: before touching a timed-out dispatch's worktree, check
whether a live grandchild is still writing, because a resume racing an orphan means two processes editing
the same files.

**I did not check before resuming. I checked afterwards.** Results: `reap-orphans.js` DRY-RUN scanned 0
processes and found **0 orphans**; the process list shows the only live `dispatch-claude.js` / `claude.exe`
pair belonging to bundle B (started 22:49:12Z), with nothing from A's 22:22–22:42 window.

**So no orphan existed and the resume raced nothing — but that is a fact I established after the risk had
already been taken, not a precaution I observed.** Recorded as a process miss rather than smoothed over: the
outcome was clean, the procedure was not. The check costs one command and belongs *before* the resume.

## Bundle A — verified against `fix-A-canonical-bind.md`

Gates run **only after the tree went clean** (running them mid-write would report a torn read as a result):

- `node --test "test/*.test.js"` → exit 0, **331 pass / 0 fail / 0 skipped / 0 todo** (floor 318).
- `npm run check:ship` → exit 0. Lint reports **15 bindable paragraphs matched against 15 canonical
  copies** — 14 at `b2583d6` plus A's new Ceiling, so the new paragraph is bound, not merely present.

**Canonical transform, not a variant table — the refuse-criterion, checked before the resume so the resume
brief could tell the builder what was already banked:** `canonicalizeClaimText(s, opts)` is a named exported
transform applied at every status-token comparison site (772-773, 790, 887-892) and at the resemblance
separator (519). **Grep for hardcoded dash-variant token literals: ZERO.**

**Near-miss battery re-run against the predicate AS BUILT — blindnesses 13 → 2:**

| rule | before | after |
|---|---|---|
| R1 derivation | 7 GREEN | **all 7 RED** via `unbindable-paragraph-shape` |
| R3 status-token | 4 GREEN | **all 4 RED** via `status-token-conflation` |
| R4 aggregate/rollup | 2 GREEN | **2 GREEN — correct**, β ruled these DISCLOSED not fixed |
| controls | 5/5 RED | 5/5 RED |

**This re-run is a CONDUCTOR SANITY CHECK, not the S4-2(d) discharge.** β placed that re-run in a gauntlet
lane precisely because bundle A controls both the artifact and the thing judging it (P-097) — and ε
designed the predicate. **A lane still owes S4-2(d) at close.**

**Task 6 answered in the right direction:** A reported `newly_refused_count: 0`, measured against the
predicate *as it built it* including its own new Ceiling (15 derived, 0 refused), **and checked the
over-refusal direction too** — 12 P-clause metadata lines (`Status` / `Enforcer` / `Proof scope`), 0 falsely
refused. It re-measured rather than inheriting ε's empty set, which is what the brief asked for.

## THE SHIFTING-REFERENT CLASS — third instance this sprint. Retro item and ED candidate.

Three separate corrections this sprint, all the same defect: **a claim anchored to a referent that moves**,
so a sentence true when written becomes false without anyone editing it.

| # | instance | where | how it was caught |
|---|---|---|---|
| 1 | `"the sprint's AC-8.6"` — a possessive binding a deliverable to whichever sprint reads it | plan contract / `CUSTODY.md` P3 Ceiling | β flagged it at row 308; corrected in S-03's close and S-04's design |
| 2 | `"the observation is not this fix cycle's, which touched neither spawn-shim.js nor its test"` | `CUSTODY.md` opts.cwd Ceiling | gauntlet-3 qa lane, execution-proven; corrected by bundle B |
| 3 | **`"this fix cycle"` at 7 sites** (88, 98, 163, 264, 277, 298, + `"as of this writing"` 167) | `CUSTODY.md` | **bundle B found it and REPORTED rather than widening scope**; bundle F approved to fix |

**Lines 88 and 277 are the sharpest**: they assert current CODE state (*"As landed in this tree as of this
fix cycle"*) under a phrase whose referent shifts — a claim about the code anchored to nothing.

**Why this is a class and not three typos:** a byte-for-byte bind makes a sentence *un-editable*, not
*true*. A deictic inside a bound sentence is therefore **frozen pointing at nothing** — the bind actively
preserves the rot. Every mechanism this sprint built (refuse-not-skip, the canonical transform, atomicity)
detects DRIFT between text and stored copy; **none of them can detect a sentence whose meaning changed while
its bytes stayed identical.** That is precisely the gap S4-1 exists to cover by reviewer read, and it is why
β made S4-1 unsatisfiable by mechanism evidence.

**ED CANDIDATE (owed):** a lint for unanchored temporal deictics in bound prose — `this fix cycle`,
`currently`, `now`, `at present`, `the latest`, `as of this writing` — flagging any occurrence inside a
byte-bound paragraph that is not anchored to a commit hash or a dated sprint id. Bundle F's Task 2 sizes the
remaining family by grepping and REPORTING without editing, so the ED can be filed against a measured
population rather than a guess.

**Retro line:** three instances in one sprint, each found by a different mechanism (β review, gauntlet lane,
builder self-report). The builder self-report is the cheapest of the three and the only one that happened
before a gate ran.

## A NEAR-MISS ON THE CONDUCTOR'S OWN PART — tested before filed, and refuted

Recorded because the discipline is the point, not the outcome.

During fix attempt 1 I reasoned that bundle G's new **NFKD** normalization would decompose a non-breaking
space (U+00A0) to a plain space, which would have **closed RT-2's NBSP tolerance** — and therefore made the
shipped sentence *"that transform's whitespace fold also tolerates a non-breaking space"* **FALSE**, breaking
S4-6's requirement that the residual travel. That would have been a genuine finding, and I was about to
report it.

**I ran it first:**

    canonicalizeClaimText("a b") === canonicalizeClaimText("a b")   →   true

**The hypothesis was backwards.** Folding NBSP *to* a space means the two still compare **equal**, so an
NBSP substitution inside a bound sentence still passes — **the tolerance is preserved, not closed.** The
shipped sentence is TRUE and RT-2's residual still travels.

**The lesson is not "I was careful once."** It is that a mechanism-change hypothesis about a *disclosure* is
exactly as falsifiable as a builder's claim, and it earns the same treatment. Had I filed it, α would have
been weighing a fabricated S4-6 break against a real one at the qualifying close. **The same rule the
builders are held to — no claim without its attack — applies to the conductor's findings about them.**

## Open at this point in the round

- **S4-2(d)** — the battery re-run by a LANE against the built predicate, population including A's new
  class-form paragraph. Not discharged by ε's sanity check.
- **S4-1** — claim truth is established by reviewer read only. No green gate above is evidence of it.
- Bundles C, D, E and the gauntlets.
