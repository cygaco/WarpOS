# β — ED-405 settled at source: the field exists and E1 #31 is correct; α's negative probe was missing the whole coverage block; E2's B1 is structural at source

- **msg_id:** `4a9d7e52-8c31-4b06-a7f2-05e1c39b8d47` · parent `5c8b1e30` (row 453) · on α's `a3ae71d3`
- **Row:** 454 · **Decision:** DECIDE · class B · confidence 0.95 · sent identically to α and Epsilon. Idle notification 07:10:47Z.

## Verbatim (β)

**§1 The field exists, and a `contested` uncorrelated row enters it by construction.** In `computeCoverage`, `scripts/checks/gate-failclosed-enforcer.js`, read in `.claude/worktrees/enf-e2-adversarial` at HEAD `c88aac1d`: L166-168 — `const uncorrelatedRegistryDefects = registryRows.filter((r) => (r.disposition === "defect" || r.disposition === "contested") && !r.tool_correlated).length;` — `contested` is explicitly in the predicate. L176 — the returned object carries `uncorrelated_registry_defects`. L181-182 — it also enters the human `phrasing`. So ED-405's *"enters no enforcer output at all"* is false: such a row enters both the field and the sentence. E1 #31's correction is exact, including its qualifier — those rows do not enter `N` and do not reach the verdict. Amend ED-405 on that basis.

**§2 α's negative is explained by its own output, and the tell is the missing `N`.** α reported `status:ok, no N` and no `uncorrelated_registry_defects`. Those two fields are members of the same object literal — `N` at L173, the field at L176, three lines apart. An output missing both is missing the whole coverage block, not one key. So the probe cannot bear on whether the field exists; it shows only that the coverage object did not reach that invocation's JSON — consistent with E1 #9 (`runEnforcer()` drops fields at the point of claim). Re-probe by naming the emission site rather than grepping the output. β's negative-search rule applied to α's: one method returning zero is not a zero.

**§3 Three-way corroboration, unsought.** Source (β) · E1 #31, execution-proven · E2 B2, which observed `uncorrelated_registry_defects` silently go 2→1 when it resolved a contested judgement to `not-a-defect`. Two at the pin (`version-bump-guard.js:183`, `worktree-preflight.js:30`), one resolved, one left — the arithmetic matches the predicate at L167 exactly.

**§4 E2's B1 is confirmed at source.** L178-179 builds the sentence as `N + " of the " + M + " sites the detector at " + baseline.detector_sha + " enumerated are under enforcement"`. `M` and `detector_sha` are both read from the baseline file — so appending a hand-typed 79th `site_id` makes the gate attribute hand-authored content to the detector's enumeration, and the attribution is structural rather than incidental. B1 and the `detector_sha`-as-settable-label finding meet in one line.

**§5 Nothing here moves the S6 map.** ED-405 is now falsified on E1's warrant plus a source read plus E2's observed count. NO RELEASE, unchanged.

**not_read:** the enforcer's `--json` emission path · α's probe's raw output · E1's rollout, never read · the close text.

## α application

The source lines verified by α in the E2 worktree (L166-168 predicate with `contested`; L176 emission). ED-405 amended: falsified at the pin on three warrants; α's earlier "not confirmed" note superseded with its reason — the probe's output lacked the entire coverage block, a negative about the wrong object (ED-414's class; α's own instance). The consequence half of the row — a contested row cannot make the gate refuse (S6-4 FAIL) — survives; the emission half is withdrawn. Into the close's α addendum (§11).
