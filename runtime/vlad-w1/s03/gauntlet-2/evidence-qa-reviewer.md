# Lane evidence — `qa-reviewer` (BINDING) — S-VLADW1-03 gauntlet-2

Shape: `in-process-agent` · claude-opus-5 · elapsed 888753 ms · 63 tool_uses · agentId `ae06bdc3857b987af`
Target: commit `0732cd8`. Brief: `lane-qa.md`.

**Verdict: FAIL.** S-criteria: **S1 holds · S2 FAILS · S3 HOLDS · S4 holds · S5 HOLDS.**

**S3 and S5 both moved from FAIL to HOLD.** The lane observed RED-on-removal for BOTH entries itself.
S2 still fails, but on entirely NEW grounds — the gauntlet-1 S2 defects are fixed and these are different
defects, two of them introduced by the fix that closed S5.

## The headline: the claim-lint does not bind what the file says it binds

F-1/F-2 are the same root cause and it is the sprint's signature defect one layer out. `CUSTODY.md:7`
tells the reader the lint checks the file "byte-for-byte where byte-for-byte is what matters (the Asserted
paragraphs)". Only **A1–A4** and A5's three carrier sentences are actually bound. The lane inverted A7's
rotation sentence into the exact falsehood bundle 9d was written to correct — leaving the text
self-contradictory — and every gate stayed green: `check:custody` exit 0, `check:ship` exit 0, `npm test`
294/294. It supplied a **working control** (rewording a bound A1 sentence → `check:custody` exit 1), so
the harness is not broken; the paragraphs are simply unbound.

Worse, it inverted the AC-8.6 disclosure to assert **"AC-8.6 HAS LANDED and the self-check runs in every
user install"** — and every gate stayed green. That is the precise camouflage this sprint has corrected
twice.

**This is a REGRESSION caused by the S5 fix:** bundle 9d added A7 and A8 under the uncorrected header, so
the count of Asserted paragraphs the lint does not bind went from one (A6) to three (A6, A7, A8).

## Findings

| id | sev | criterion | file | claim |
|---|---|---|---|---|
| F-1 | HIGH | S2 | `CUSTODY.md:7` | Header says the Asserted paragraphs are byte-for-byte bound; only A1–A4 + A5's carriers are. A7 invertible to a falsehood with all gates green. |
| F-2 | HIGH | S2 | `CUSTODY.md:124` | Ceiling prose inside the PROVEN section is unbound too — AC-8.6 disclosure and the new `node:`-builtin ceiling each invertible to a flat falsehood, all gates green. |
| F-3 | MEDIUM | S2 | `package.json:23` | `currentState` corrected to "TEN drift + ONE missing WORK" while `owed` on the adjacent line still says "Repoint the eleven name-drift pointers" — prescribing the regrouping the corrected half explicitly forbids. |
| F-4 | MEDIUM | S3 | `test/env-scrub.test.js:578` | The new class-level invocation assertion structurally EXEMPTS `src/server-entry.js`: its guard is `if (canSpawn && !invokes)` and server-entry's graph reaches only SAFE_NODE_BUILTIN specifiers, so it can never be flagged on its own account. Its coverage is incidental. Not in the test's own "DOES NOT COVER" block. |
| F-5 | LOW | S2 | `package.json:22` | "TEN are clerical NAME drift (the substance exists under a different test-node name)" is imprecise for ≥3 of the ten — `custody-runtime.test.js` holds only two nodes, both AC-8.4, so the remedy is repoint file+name, not name. |
| F-6 | LOW | none | `CUSTODY.md:100` | The new `opts.cwd` ceiling says "this fix cycle observed" — but neither `spawn-shim.js` nor its test was touched in fix attempt 1. The observation belongs to the previous cycle; the attribution is wrong. |

**F-4 is important and honestly scoped by the lane itself:** it proved the exemption by deleting
`server-entry.js:78` and showing the failure list named only the OTHER entries, with server-entry as the
reported orphan but absent from its own list — **while stating "S3 itself still holds — I observed
RED-on-removal for BOTH entries."** The criterion is met; the assertion is weaker than it reads.

## `regressions_from_fix_attempt_1` (verbatim — the field earned its place)

1. **Bundle 9d widened a false header claim** by adding A7/A8 under the uncorrected `CUSTODY.md:7`. The
   fix that migrated the residuals is what widened it. Execution-proven: F-1.
2. **Bundle 9d made `package.json#vladPointerLint` self-contradictory.** Before the fix the field was
   wrong-but-consistent; after it, the surviving half prescribes exactly the camouflage the corrected half
   names. Execution-proven: F-3.
3. **No test regression.** Only two test titles were removed across `a9e6708..0732cd8` and both were
   replaced by strictly STRONGER versions (A1 reachability → ACTUALLY INVOKES; the tautology GREEN case
   gained a real scanned-file count). No assertion loosened, no coverage dropped, no `t.skip`/`.todo`
   introduced (294 pass, 0 fail, 0 skipped, 0 todo).

## `what_i_could_not_assess` (verbatim, condensed)

- **S1** rests on running the committed suite, whose raw-control tests (T8, T8b, T9–T12, Z1) all pass. The
  lane authored **no new leak attacks**. "holds" = "no leak found by me", not an independent
  re-establishment.
- **S4** rests on the committed PLANT tests' green state and on verifying the ten fixture directories
  exist with nothing skipped — **not** on per-fixture mutation by this lane.
- The brief's bundle-8d functional instruction **does not apply to this commit range** (8d landed at
  `8b6993e`, at or before gauntlet-1). The job state machine and journal were NOT audited and the lane
  has no evidence either way.
- `CUSTODY.md:94`'s "not named on any other surface, shipped or internal" was verified TRUE across the
  engine tree but the **"internal"** half (WarpOS-side notes) was not exhaustively searched.
- **AC-8.9's full scope** (server tool descriptions, driver output as shipped custody-adjacent prose) is a
  disclosed open ceiling and was read but not audited.

Worktree confirmed clean, HEAD `0732cd8`, all mutations reverted, `git diff HEAD --stat` empty.
