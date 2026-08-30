# SP-20260829-001 — S6-7 residual register

**Status: GRADED — inside lane E1's fifth class** ("the sprint's close-time residual register — the artifact the sprint emits to carry its residuals forward, under the sprint's evidence directory"). Its sentences are shipped claims and are gradeable as such.

**This file is bookkeeping in kind: it emits residuals that are already recorded elsewhere, each with its source. It claims nothing new.** Assembling already-recorded residuals into a list is not evidence, and nothing here may be cited in the close as though it were. Its one non-trivial property is completeness, which is a coverage claim — hence the derivation rule below.

**Assembled by the conductor (ε) inside the B5/B6 window, before any qualifying lane fired.** A residual list authored after results exist would be a second attempt wearing evidence's clothes.

---

## derivation_rule

A residual is listed here if **all** of the following hold at assembly time:

1. it was **recorded during SP-20260829-001** — in the enforcement-debt ledger, in a β ledger row, in a bundle envelope, or in a message from α or β that is itself committed to this branch; **and**
2. it names a **gap that this sprint did not close** — an unenforced policy, an unrepaired site, an unverified guard, or a claim carried rather than fixed; **and**
3. it is **out of every fix bundle's fence** — either pre-existing (not introduced by B5/B5-R/B5-T/B6) or predicate-changing, and therefore registered-and-carried by ruling rather than repaired.

Each entry states **where it is recorded** so a reader can reach the source rather than this summary.

## what this rule does NOT reach

- **Residuals recorded only in an uncommitted message.** Condition 1 requires a committed source. Anything raised in conversation and never written to disk is outside this list and this list cannot know it exists.
- **Residuals recorded after assembly.** The list is fixed at its commit; anything registered later — including by a qualifying lane — is carried in the close, not here.
- **Defects inside a fix bundle's fence.** Those were repaired, so by condition 2 they are not residuals. A reader wanting "what was wrong" must read the bundle records too; this file is only what was *left*.
- **Findings a lane has not yet made.** No qualifying lane had fired at assembly. This list is the sprint's own knowledge of its gaps, not the round's.
- **Two items deliberately excluded by ruling**, so their absence is not an oversight: the conductor's `detector_sha` observation (carried in `runtime/enforcement-sweep/2026-08-29/pin-06669fbe/CAPTURE.md`, kept out of the graded surface so no lane inherits it as a framed answer) and the three-sha observation at the qualifying pin (close-only, in E1's population, named to no brief and not to this list).
- **Anything in the bundle envelopes' own text.** Those are annotated in `CORRECTIONS.md` beside each envelope, not here.

---

## The residuals

### R-1 · The enforcer computes four signals and lets none reach its verdict
`gate-failclosed-enforcer.js` decides `ok` from `regressed` and `newEntrants` alone. It also computes the audit's `status`, the enforcement count `N`, the untriaged count `K` and the instrument's ceiling — reports all of them, and none of them reaches the exit code. Consequences observed this sprint: an audit that scanned zero files (`status: "unknown"`, exit 2) yields an enforcer exit 0; a coverage line declaring an open defect row sits beside a green; a `contested` disposition on an uncorrelated row changes no outcome; the ceiling is dropped at the point of claim.
**Recorded:** ED-403 (root), ED-404 and ED-405 (facets of the same root, kept for their S6-3 and S6-4 shapes).
**Out of fence:** pre-existing (bundle B2's), and repairing it would change the predicate the qualifying lanes test.

### R-2 · One guard in the sprint's own suite is unassessable on the build platform
> The audit's partial-blindness accounting (`files_scanned` / `unreadable`) has exactly one test, `blindness guard 1b`, and it is skipped on the build platform because symlink creation is refused. Total blindness is guarded and observed (guard 1). The coverage figures in the sealed evidence are therefore not independently guarded for the partial case on this machine.

The skip is honest and named at the test level, and invisible at the suite level: `node --test` exits 0 with it.
**Recorded:** ED-399, which also carries the settling question a portable fixture depends on — whether a read that throws is routed to the unreadable list or short-circuited earlier.

### R-3 · A branch that must never be merged, and a branch that must never be deleted, with nothing preventing either
`worktree-gentle-wandering-clarke` @ `d10afb14` carries a reverted detector, its test file and a superseded baseline. `b5-seal-builder-d-mtf9sv26` @ `51d70d42` is the only place the B5 builder's authored bytes exist, including the state that failed a manifest check before the landing regenerated it. Two special statuses, one enforcement shape, no mechanism.
**Recorded:** ED-398 with its amendments; the strongest candidate is content-keyed (a check that fails when a known-reverted blob reappears), because it catches the revert by any vehicle rather than by a branch name.

### R-4 · Commit authorship carries no discriminating information in this checkout
The checkout's local git identity names one actor while three act through it, so every commit — conductor, orchestrator and dispatched builder alike — carries the same author. True statements about who authored and who graded are therefore not demonstrable from the commit history, and every such sentence must cite a completion record or transcript instead.
**Recorded:** ED-400; the ranked candidate is a dispatch-id commit trailer plus a lint that refuses a worktree commit without it — keyed on something the dispatch actually has rather than on a name anyone can set.

### R-5 · An always-loaded routing instruction is false
The framework's dispatch shape table routes cross-provider reviewer roles through the cross-provider bridge, while the role registry pins several reviewer roles to a Claude model and the bridge refuses them by design. The refusal is correct behaviour — a gate failing closed with a diagnostic naming the right route — and the instruction that sent work there is what is wrong. Its blast radius is every reader who follows it.
**Recorded:** ED-401.

### R-6 · Nothing prevents landing a bundle while a review of that bundle is outstanding
A review lane dispatched against a bundle produces findings about it by construction, so its terminal row is a precondition of landing, not something to fold in afterwards. This sprint landed a bundle whose review then named defects in what had landed.
**Recorded:** ED-402.

### R-7 · A truncated error channel destroyed a death's diagnosis
A dispatched review lane died at its background bound with zero bytes of output; the captured stderr held only the provider banner and a prompt echo, because the capture keeps a head slice and discards the rest. Whatever the provider wrote about the failure is gone, and the death's cause is not knowable beyond "it reached the bound". The lane succeeded on a re-fire with a smaller prompt and a larger bound, which makes the prompt size the **inferred** cause and not an observed one.
**Recorded:** ED-392's amendment; the candidate is to keep head *and* tail and to report the true byte length rather than the sliced length.

### R-8 · A qualifying round's aggregation rule has no mechanical check that it was frozen first
The rule was frozen before any lane fired and the ordering is checkable after the fact by comparing the ledger row's append position and timestamp against the earliest lane dispatch start — but nothing enforces the ordering, and the close prints the comparison by convention rather than by mechanism.
**Recorded:** ED-397.

### R-9 · A repair ships without the executed demonstration its siblings carry
> the B5-R repair ships with a 12-line-window check and a reviewer-executed injection, not with a committed fault-injection test; its nine B3 siblings each carry one.

Adding the test was refused deliberately: the round's subject is claims that exceed what was done, and making the claim true would erase the instance.
**Recorded:** β's ruling on finding F-4 and the bundle record; the reviewer's executed injection is attributed to dispatch `d-mtfb42md-46a6f456`.

### R-10 · A false sentence in a repaired hook now ships in two places
An earlier bundle's repair authored a code comment whose mechanism claim is false about its own file; a later bundle quoted that comment faithfully as a registry row's decision semantics. Correcting the comment alone would leave the quote stale, and correcting the quote would falsify the record of what the code says. The comment is outside every fix fence — it belongs to the bundle that wrote it.
**Recorded:** the B6 bundle record's carried items; the comment is inside lane E1's third class.
**No enforcement-debt id, by decision rather than omission:** this is a specific carried defect with two locations, not a policy needing an enforcer. Its repair — both locations at once, or neither — is a successor item.

### R-11 · A provenance requirement arrived after the dispatch it was meant to bind
The requirement that a baseline emission state plainly whether its stamp names the parent commit reached the conductor after the builder had already fired. The builder did not state it, and the silence is a relay-timing gap rather than non-compliance — a distinction only two timestamps can make, and one that reads as negligence without them.
**Recorded:** ED-407, plus β's ruling and α's timeline in the bundle record. The gap the id names: nothing records, beside a dispatch, the assembled prompt's sha and byte length and the fire's wall-clock in a form a later requirement can be compared against — this instance was settled by reading four clocks by hand.

### R-12 · Tests bound to absolute counts rot when the counted thing legitimately changes
The enforcer suite asserted a literal row count and a literal checked count. Both went red the moment a bundle was mandated to change the registry those literals describe, and both had to be re-measured and updated by a separate party. The count is a coverage guard on a property loop, so removing it is wrong and freezing it is wrong; the durable form is an append-safe invariant plus a synthetic fixture, and this sprint shipped neither.
**Recorded:** ED-406, filed from this entry. The durable form the id names: an append-safe invariant (a minimum bound plus membership of an emitted id set) plus a synthetic truncated-registry fixture proving the population guard still fires, with a no-op⇒FAIL guard. Low severity — the failure is a loud red, never a silent pass — and out of this sprint's fence, since changing the assertion changes the predicate.

### R-13 · A suite class passes or fails depending on the kind of checkout it runs in
One regression class in the framework's own test suite is decided by a detector that reads a **gitignored** store. In the main working tree the store is present and the class passes; in **any** worktree the store is absent, the detector reports dozens of findings and exits non-zero, and the suite reports the class as a known-baseline red instead. Confirmed by execution in three trees, including one untouched by this sprint's bundles, so the difference is a property of the checkout and not of any commit. The consequence is that the suite's own summary line differs between two runs of the same commit, and neither line is wrong.
**Recorded:** ED-408, **re-scoped from this single instance to the CLASS — gates that read a gitignored or untracked input.** Two instances are known: this one, muted behind a stale-marker warning, and the one in R-14, which flips a release gate's exit code. **The row's deliverable is the enumeration, and the enumeration is owed, not done: of the twenty checks the release runner covers, which read a gitignored input? Two answered, eighteen unexamined.** Until that is run, the runner's own summary figure is position-dependent and cannot be quoted without saying where it was measured. Candidates named there: the detector reports *could-not-check* when the store is absent rather than reporting findings; the suite records the checkout kind beside each class and refuses cross-kind comparison; the stale-marker warning becomes an error under a strict flag.
**Out of fence:** pre-existing and not introduced by any bundle here; repairing it would change what a qualifying lane's own gate run returns.
**Family:** the sixth observed member of *a value reported as a property of the thing when it is a property of where the reader stood* — beside the detector-version stamp, the coverage count with a hidden predicate, the repaired-count relative to the working directory, an identifier resolved as an address, and a release gate whose verdict differs between a working tree and a clean checkout of the same commit.

### R-14 · The installed manifest promises an asset no clean checkout carries, and it flips a release gate
The manifest-honesty detector re-hashes live files against the installed snapshot. That snapshot promises an asset which is **gitignored** and untracked, so it is present in the working tree that produced the snapshot and absent from every clean checkout of the same commit. Measured: the 20-check release runner exits **0** in the main working tree and **1** on a fresh detached worktree at the same commit, with three classes red. Five landing commits carry the sentence *"enforce.js exit 0"*, which is true of the tree it was measured in and false read against the commit it is attached to; those commits' messages are immutable and have been corrected by appended git notes rather than edited.
**Recorded:** ED-409, **a facet of ED-408's class rather than an independent finding** — same root, distinguished by consequence so the remedies stay separate. Candidates named there: the installed-snapshot builder excludes git-ignored and untracked paths, or lists them under a key that is not a promise; the honesty check partitions *promised but gitignored* as could-not-check; the release path runs the gate in a clean checkout before any message may claim an exit code.
**Out of fence:** pre-existing — the manifest promised the asset at the pre-sprint pin and at session start, before any bundle here ran — and repairing it would change what a gate run returns.
**Sibling of R-13, not a duplicate of it.** One shared root — *a gate whose input is gitignored is absent from every clean checkout* — and two different consequences: R-13's instance is muted behind a stale-marker warning, this one flips a release gate's exit code. The remedies differ, so the rows stay separate.
**The open question both rows share, and neither answers:** of the twenty checks the release runner covers, **which read a gitignored input?** Two are known. **Eighteen are unexamined** — which means the runner's own summary figure is itself position-dependent and cannot be quoted without saying where it was measured.

---

**Entries: fourteen.** Each names its recording location. This list's completeness is bounded by the derivation rule above and by nothing else; a residual that fails any of the rule's three conditions is absent from it by construction and not by judgment.
