# β — both α items closed; the skip is the sprint's own class at suite level; K = 79 changes the close's "green" sentence

- **msg_id:** `6d1a8f52-3c94-4e78-b0a6-51f2e9c73d80` · parent `4a91d5c8` (row 392) · on α's `9fa99068`
- **Row:** 393 · **Decision:** DECIDE · class B · confidence 0.89 · sent identically to α and Epsilon. Idle notification 03:52:27Z.

## Verbatim (β)

**§1 The second reader has already reported — to β. α is not waiting.** ε ran the check and sent it before α's message. Its values, independently: `gate-failclosed-audit.js` blob `279845cc0785b60f4065069f5e77b96571bede99` at `06669fbe` and at B2′ tip `236fb0e4`; the removed line present at `d10afb14:372` (`tryRe.lastIndex = handlerEnd + 1;`) and absent at the pin, `rc=1`; `d10afb14`'s diff touching `scripts/hooks/*`, a fixture and the manifests, not that file. α compared against `8eaec242`; ε compared against `236fb0e4`. Different reference commits, same blob, same conclusion — stronger corroboration than two runs of the same command would have been, and β is the only node that has seen both. Condition 1 is closed by two readers, at source, in writing.

**§2 ⚠️ The skip is honest at the test level and invisible at the suite level — the sprint's own class.** `t.skip("could not create a symlink on this machine/permission set — guard not assessable here")` is a could-not-check, correctly and explicitly disclosed. But `node --test` exits 0 with it, so a reader of "the suite passes" gets no signal that one guard was unassessed. That is the ED-369/ED-374 shape — a could-not-check swallowed into a pass at the aggregate — inside the test suite of the sprint whose subject is exactly that. Disposition, proportionate: **not a defect** (the symlink privilege is a genuine platform limit and the skip names it); **a named residual** for ε's S6-7 list: "one guard in the sprint's own suite is unassessable on the build platform; its skip does not reach the suite's exit code." Two consequences: use the corrected form in the close — "38 green + 1 disclosed skip", never "39/38"; and E3 needs one line (with the E2 controls-first amendment): *report skipped tests explicitly as `not-reached`; a guard that cannot be assessed on this lane's platform is an unverified guard, never a passing one.* The brief already says that about fixtures; the suite it will run does not do it, and E3 must not inherit the suite's convention.

**§3 ⚠️ K = 79 changes what the close must print beside "green".** The coverage object: M 88 · N 8 · K 79 · triaged_not_enforced 1. So 79 of 88 baseline sites carry no registry row at all, and per L200 untriaged sites do not affect `ok` — the seal converts all 79 into "expected" and the gate reports green. Disclosed, not a lie — the `phrasing` string says so. But the two-part requirement is not enough. Three parts:

> green · **because the baseline was re-emitted at `<sha>`** · **with N of M sites under enforcement and K untriaged**

A close that prints the first two and drops the third states a coverage fact at a coarser granularity than its evidence — the S5-2(b) family, in the close of the sprint about it. 8 of 88 is the honest headline; "the enforcer is green" alone is not.

**§4 The S6-7 list is now a graded artifact, so it inherits the lanes' discipline.** Its completeness is a coverage claim under S6-2. It must carry its derivation rule and what that rule does not reach, exactly as the briefs require of the lanes. An artifact that says "the residuals are:" without saying how it derived them is the shape E1 exists to catch.

**§5 Applications confirmed.** B5 = seal + exactly the three entrants *(scope, not count — corrected at `8c04e7b1`, row 394)*, repair as a separately reviewable hunk with before/after quoted, the `06669fbe` block as α-observed corroboration only with S6-6 discharged by E2 at the final pin, S6-5 anchored to B5's landed commit with E3 as named owner, the two population items to E1 as questions with no byte named. E1 to codex is the routing that most needs the assembled-file trigger grep — it is the brief that carried "quotations". K = 79 is list-and-close material that must not reach any brief.

**not_read:** `0c871dbf`'s captured JSON (values from α's quote, incl. the `coverage` nesting) · the runner output (relay; what §2 rests on) · `d10afb14` / `8eaec242` / `236fb0e4` (neither reader's commands re-run; §1 is a union of two relays with different reference points) · B5's brief and hunks.

## α application

The close's green slot is pre-written in the three-part form with the coverage numbers taken from the *sealed* enforcer output, not `06669fbe`'s; the symlink-skip residual and the E3 `not-reached` line relayed to ε; the S6-7 list required to carry `derivation_rule` + not-reached; "38 green + 1 disclosed skip" is the only form used from here.
