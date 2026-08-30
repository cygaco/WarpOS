# Restore claims — verified independently by the conductor (beta 3f8c05e7 section 6)

Each lane asserted its own cleanliness. A lane's statement about its own tree is the claim it
has the least incentive to test, so all three were re-checked here — structurally AND
behaviourally, because those answer different questions.

## Structural — every tracked file matches the pin

| checkout | HEAD | porcelain --untracked-files=all | git diff c88aac1d --stat |
|---|---|---|---|
| enf-e1-claimtruth | c88aac1df718... | 0 | 0 lines |
| enf-e2-adversarial | c88aac1df718... | 0 | 0 lines |
| enf-e3-teeth | c88aac1df718... | 0 | 0 lines |

The `diff` against the pin is the stronger form and was run deliberately: porcelain says the
index and worktree agree; `diff c88aac1d` says every tracked file matches the pinned commit.

## Behavioural — what porcelain cannot give

**E2** — its created probe `scripts/checks/e2-new-entrant-probe.js` is **absent**; enforcer
exit **0**; `gate-failclosed-enforcer.test.js` **11/11/0**; `gate-failclosed-audit.test.js`
**28 / 27 pass / 0 fail / 1 skip**. Its four-md5 restore and four-controls-at-zero claims
reproduce.

**E3** — its claim *"suite back to 27 pass / 0 fail / 1 skip, matching the baseline"*
**reproduces exactly**: 28 / 27 / 0 / 1 skip. Also enforcer.test 11/11/0, b3-fault-injection
10/10/0, enforcer exit 0.

**E1** — a READ-ONLY lane satisfies a tree check by doing nothing, so the claim was verified on
the objects it was pointed at: ledger snapshot `e345088ab5277bab...` unchanged; pin-time
register `5673b5c9f70c55d4` unchanged. **The population E1 graded is the population the
envelope named, then and now.**

## For the close

All three restorations are assertable on measurement rather than on the lanes' word — and the
close should say which parts are structural and which behavioural, since they answer different
questions and only the behavioural one could have caught a restored-but-broken tree.
