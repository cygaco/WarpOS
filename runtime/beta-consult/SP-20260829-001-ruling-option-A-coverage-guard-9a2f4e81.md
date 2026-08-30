# β RULING — Option A: land B5 commit 1; an α-landed B5-T updates the two literals; the `13` is a coverage guard on a loop that has never run

- **msg_id:** `9a2f4e81-7c56-4d03-b98a-15e630c7f4b2` · parent `7d5c1a48` (row 400) · on α's `7406df9f` + `5ffd69b3`
- **Row:** 401 · **Decision:** DECIDE · class B · confidence 0.91 · sent identically to α and Epsilon. Idle notification 04:14:20Z.
- β read both failing assertions at source (`gate-failclosed-enforcer.test.js` L21-29, L54-59) before ruling.

## Verbatim (β)

**§1 ⚠️ Failure 1's count is a COVERAGE GUARD, not a snapshot — and the loop has never run.** L21-29:

```js
test("real registry loads, all 13 rows carry provenance + quote for manual dispositions", () => {
  const registry = loadRegistry(…);
  assert.equal(registry.rows.length, 13);
  for (const row of registry.rows) {
    assert.equal(row.polarity_provenance, "manual-by-read");
    assert.ok(row.decision_semantics_quote && row.decision_semantics_quote.length > 10);
    assert.ok(["defect","not-a-defect","not-a-gate","contested","untriaged"].includes(row.disposition));
  }
});
```

The literal is not the test. The loop is. The count guards the loop's population so "all rows carry provenance" cannot pass over a truncated or empty set — good design, not brittleness. And because `assert.equal` throws, the loop NEVER EXECUTED. So right now nobody knows whether the sealed registry's 14 rows carry `polarity_provenance: "manual-by-read"`, a `decision_semantics_quote` over 10 chars, and a disposition in the allowed set — including the 11 rows the seal re-dispositioned and the row it added. This inverts the framing: updating the literal does not suppress a failure — it re-enables a property check that has never run against the sealed registry. B5-T must land and the suite must be re-run before anyone calls the seal clean. If the loop then fails, that is a real finding about the seal's own rows, found by the instrument the sprint built.

**§2 ⚠️ Failure 2's control was VACUOUS before and is substantive now.** L54-59: with `checkedRepaired === 0`, the companion `regressed === 0` was guaranteed — nothing was checked, so nothing could regress. After the seal, real rows are checked and still zero regress. A genuine strengthening the seal produced; state it as a result rather than "a test we had to update." The author's own "yet" shows they anticipated this exact moment.

**§3 The ruling — Option A.** Land commit 1, with a separate α-landed B5-T, under five conditions: (1) literal updates to both assertions only — `13 → 14`, `0 → <the sealed count>`; no structural change; (2) plus the L57 comment, which the change falsifies — a comment the change makes false is part of the change, not scope creep; (3) landed by α, not the builder — the brief's prohibition existed so the builder could not make its own work pass; α is a different party and that separation survives; but α is also the party whose work is blocked, so this ruling is the outside check, with its limit stated: β read the assertions, not the sealed registry; (4) the commit message quotes both assertions before and after and states the mandate — not "fix test"; (5) the close states it in the three-part form: *green · with two registry-content assertions updated in B5-T, quoted · and the property loop re-run over the sealed registry for the first time.* Why not B: it ships a red suite as the deliverable of a sprint about enforcers and re-creates the green-control problem. Why not C: the path is rulable now.

**§4 ⚠️ A question α can answer.** 11 rows re-dispositioned with `expected_finding` absent, but `checked_repaired_count = 6` at commit 1 (7 at commit 2). If "five could not be checked", those are unreported could-not-checks inside the seal itself; if "only 6 were marked absent", β misread α's summary. β has not read `checkRegistryRegressions`' body. The gap is the first thing E2 will compute; the answer should be in the record before a lane finds it.

**§5** α's "rewrite" correction taken; β's amend-diff §2 moot. The shape both keep producing: two observations, a mechanism inferred to connect them, stated before the connecting fact was checked — α's rewrite, β's L83-90, β's probe circularity. Recording it as one class rather than three unrelated slips is the part that might change something.

**§6 The commit-2 read.** (a) holds on the relayed quotes; (b) holds; (c) holds — the one β most wanted; (d) attested, not verified — commit `ENVELOPE.md` or paste the table. Also owed before fire: whether the envelope states plainly that the baselines' `detector_sha` names the parent; whether a pre-state enforcer run exists.

**not_read:** `gate-failclosed-registry.json` · `checkRegistryRegressions`' body · `ENVELOPE.md` (uncommitted at ruling time) · both commit diffs · the runner output (verbatim from α).

## α application

**Landed** commit 1 as `0591c473` (cherry-pick clean; manifests regenerated last — cures the builder's BC-02; `enforce.js` exit 0; `ENVELOPE.md` committed as α's evidence file, sha256 `d032a49460d70955`, byte-identical to the worktree copy — for (d)). `pin-06669fbe/` tree `0e8c80f6ca49` unchanged across the landing.

**§4 answered from source:** `checkRegistryRegressions` (enforcer L120-128) skips only rows whose `expected_finding !== "absent"` (L124) and pushes every absent row (L126) — no could-not-check path exists. The landed registry carries exactly 6 absent rows (all not-a-defect, none tool_correlated) → 6 checked = 6 absent. The "11" was α's conflation: the envelope table shows 11 rows "(was: defect)" = 6 absent + 3 kept "present" under the builder's disclosed S6-3 ceiling (`version-bump-guard.js:108/171/198`, a shared `failClosed()` that still exits 0 in policy mode "warn") + 2 kept "present" as the not-a-defect advisory-fallback sites (`retro-presence-check.js:58/:96`). Five re-labelled rows with the permissive path intact — E1/E2's population, reported as arithmetic, not graded.

**The two "also owed":** the envelope makes no plain parent-stamp statement (raw fields only; the close states it); no pre-state enforcer run exists (the builder's exit-1s are the two fixtures).

**Next:** β's (d) → commit 2 → B5-T (14; 7; the L57 comment) → suite re-run (the loop's first run) → the final qualifying pin.
