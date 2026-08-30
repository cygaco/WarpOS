# SP-20260830-001 — inherited obligations

**Tracker-only mint. No build authorisation is implied by this file or by the registry entry.**

Predecessor: **SP-20260829-001**, closed unreleased — NO RELEASE, five of seven criteria failed (S6-1, S6-2, S6-3, S6-4, S6-7), two held (S6-5 with its ceiling, S6-6 discharged by execution). Canonical close: `runtime/enforcement-sweep/2026-08-29/qualifying/QUALIFYING-CLOSE.md`.

## Provenance of this file, stated positively

**Every obligation below traces to one of:** the canonical close's §7; the three lanes' raw returns (`out-E1-2-RETURN.md`, `out-E2.raw.md`, `out-E3.raw.md`); the enforcement-debt ledger; or a β ledger row cited by msg_id. **No sentence here traces to E1's first-dispatch rollout**, which β ruled inadmissible and declined to read sixteen times. That guarantee is given as positive provenance rather than as an unfalsifiable "I did not use it" — because the author of this file has not read the rollout either and so cannot prove non-use by inspection.

---

## 1. The close-time register — three named sentences, plus an omitted set

The predecessor's residual register was graded at its **pin-time** copy. Two distinct defects travel:

**(a) The pin/close-time gap — exactly three sentences**, warranted two ways (β's full read of both files; a machine diff, conventions reconciled): **R-13**, **R-14**, and the count sentence (`Entries: twelve.` → `Entries: fourteen.`). R-1…R-12 are byte-identical between the copies.

**(b) The completeness closure over-claims, inside the version the lane could see.** The register states that an absent residual *"fails one of the rule's three conditions… by construction and not by judgment."* **Four entries satisfy all three conditions and are absent:**

> **`{ED-374, ED-381, ED-383, ED-396}`**

Each is `status: open`, each recorded during the predecessor sprint, each naming a gap it did not close, each outside every fix fence — ED-381's own text reads *"not in SP-20260829-001's scope — successor candidate."* **They failed no condition; they were omitted.** The derivation rule was honest; the closure sentence claimed a property the rule did not deliver.

**Obligation:** correct the register in the successor — never retroactively in the graded artifact — and carry both defects as distinct.

## 2. ED-408's enumeration — emit the set, then the cardinal

**Three populations exist for one enumeration and at most one can be right:** ED-408's *"27 read; 3 unread"*; the register's *"of the twenty checks"*; E1's *22 classes / 19 unique first-script paths with a named no-run set*. **None prints its set.**

**Obligation, as ED-408 was amended:** **no cardinal until the set of check ids is emitted with, per id, the input it reads and whether that input is tracked.** The question the set answers: **which of the release runner's checks read a gitignored or untracked input?** Two are known (the β-store detector; the manifest-honesty asset). The rest are unexamined.

## 3. E1's three fooling inputs — promote to fixtures

E1 executed three new fooling inputs at the qualifying close that exist as no committed fixture. β declined to read this as an S6-5 breach on the ground that **a bundle cannot fixture what a qualifying lane found after it shipped**, and made them a successor obligation instead. The alternative reading was named and declined; α may still overrule, which would have made six criteria fail and changed nothing.

**Obligation:** promote each to a committed near-miss fixture, observed RED against the predicate as built, with a no-op⇒FAIL guard, re-run at the successor's own pin with the sha recorded beside each result.

## 4. The gate has no trigger

Found independently by two lanes: E1 #11's exact-caller search (settings, hooks, `/scan:full`, testsuite, release gates — **no invocation**; only its own CLI), and E2's `grep -c failclosed .claude/settings.json` = **0** against 66 registered hooks, with all 29 repository references being the gate's own files.

**Union: nothing runs it today.** Whether it is *supposed* to be wired yet is **unsettled** — E2 explicitly declined that normative half and the close declined it too.

**Obligation:** settle the normative question first, then wire it or record why not. **A gate that can refuse and that nothing invokes is a materially different object from a gate that can refuse**, and the predecessor's close only stated the second half until an outside read caught it.

## 5. Enforcement-debt rows carried

**ED-410** — envelope paths asserted as absolute that do not resolve; the pre-fire check set had no resolution category. **ED-411** · **ED-412** (instruction-grain vs tool-grain) · **ED-413** (`prompt_digest` carries 32 hex under a `sha256:` label; the comparison of record is a **prefix** match, and the remedy is the label, never the length) · **ED-414** (`accurate-fact-about-the-wrong-object`) · **ED-415** (the indexical-copy control; its acceptance criterion must state **fires**, not **exists** — a stamp written by one path while three copy unstamped, or a lint that warns instead of refusing, satisfies an existence test and leaves the class open) · **ED-416** (the audit's own header asserts *"No bare count anywhere without the emitted list it derives from"* and its file violates it).

**Note on ED-407:** re-scoped, not deleted. Its claim that nothing records a dispatch's prompt sha, byte length and wall-clock is **false for the subprocess routes** — both wrappers write all three, and those fields proved E1's containment. **The real gap is the in-process route**, where `record-inprocess` wrote `prompt_bytes: 0` and no digest. The original sentence quantified over "a dispatch" when the defect holds for one route class: **a scope stated without its unit.**

## 6. E2's residue

**The seal can be defeated to exit 0 over a live fail-open site**, and the gate then asserts a false provenance sentence — *"0 of the 79 sites the detector at 12d2aef0 enumerated"* when the detector enumerated 78 and the 79th was hand-typed. **Structural, not incidental:** the sentence is built from `M` and `detector_sha` **both read out of the baseline file**, so the gate has no path by which it could know otherwise.

**The file carries the evidence of its own tamper and nothing reads it:** `site_count` beside `site_ids.length`, while `loadBaseline` checks only that `site_ids` is an array. **A free integrity check sitting unused in the file it would have caught.**

**Provenance validation is asymmetric:** `tool-derived` with no quote is ACCEPTED; `manual-by-read` with an empty quote is REJECTED — so relabelling a human judgement as machine-derived is the cheapest way to strip the evidence that made it auditable.

## 7. The three families, cited by name and never by ordinal

Members are cited **by name**; any count prints with its emitted set beside it — AG-11 applied to the taxonomy itself, after four ordinal collisions between three parties in one night.

- **Position** — computed at read time from the reader's context: `detector_sha` (repo HEAD, not the detector), `checked_repaired_count` (relative to cwd), a release gate's exit differing between a working tree and a clean checkout of the same commit, a re-fire's untracked surroundings.
- **Label** — the label misdescribes the value, identically for every reader: `prompt_digest` under `sha256:`, `K` carrying a hidden `tool_correlated` predicate, `a-count-labelled-in-the-wrong-unit`.
- **Indexical** — `indexical-claim-frozen-into-a-copied-artifact`: a fixed proposition whose truth is indexed to where or when the artifact sits, so copying carries it to where it is false. **The only family no field-level lint can reach, because the failing object is prose** — so its control is a copy-time stamp plus a use-side lint that **refuses**, not a keyword list.
