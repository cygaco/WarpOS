# SP-20260718-005 — R5 Fix Brief (PARK ARTIFACT — execution gated on β cap-ruling)

**Status:** PREPARED, not executed. R5 is the round after "one more cycle" (park-discipline);
execution is GATED on a β DECIDE-authorize relayed by the lead. If β parks, THIS brief is the park
artifact. If β authorizes, fire the fixes + per-finding teeth in ONE round, then re-gauntlet the two
affected lanes only.

**Branch:** `sprint/SP-20260718-005-phase3` @ `b663c50a` · **R4 commit range:** `16b50e45..b663c50a`
**R4 verdict:** 3-lane FAIL (all LIVE per WG-19). CONFIRMED CLOSED by reviewers: C2-R3 (digest-map
values), C4-R3 (tracker honesty), R3-REG-1 recompute-default (record.result_commit fallback).
**R4 raw verdicts (evidence):** scratchpad `be-r4.out` (backend), `qa-r4.out` (qa), `sec-r4b.out`
(security, gpt-5.6-sol floor — the agy/gemini primary BLOCKED on the Windows argv ceiling was CORRECT
rider behavior, not a lane result).

Discipline for R5 (lead-directed): stable ids, N-findings split, per-finding teeth in the SAME round,
full-suite + re-gauntlet, never self-attest, absence=death.

---

## CLUSTER 1 — conductor-lease dead-owner reclaim (`scripts/dispatch/conductor-lease.js`)
Convergent: backend-reviewer + qa-reviewer. Split into TWO findings (lead-directed N-split).

### R5-C1A — non-atomic pathname-unlink ABA race (CRITICAL)
- **Source:** backend `C1-R4-ABA-RECLAIM`.
- **Defect:** the dead-owner reclaim is `read owner → decide dead → fs.unlinkSync(lp) by path →
  openSync("wx")`. Two contenders that both read the SAME dead stamp: A unlinks it, creates + stamps
  its replacement (now a LIVE lock); B's already-authorized `unlink(lp)` then deletes A's LIVE
  replacement; both callbacks run concurrently — the exact TOCTOU the lock exists to close. The
  `finally` and stamp-failure unlinks also remove `lp` unconditionally by pathname (can hit another
  holder's replacement).
- **Fix (reviewer-guided: atomic reclaim, NEVER unlink-by-pathname-after-read):**
  1. Add an immutable per-lock `nonce` (`crypto.randomBytes`) to the mutation-lock stamp
     `{ pid, ts, nonce }`.
  2. Reclaim a PROVEN-DEAD owner via an ATOMIC ELECTION keyed by the dead owner's nonce:
     `fs.linkSync(lp, lp + "." + deadNonce + ".reap")` — O_EXCL-equivalent (EEXIST if already
     elected). Exactly one contender wins retiring a given dead generation; the loser gets EEXIST →
     contended (never touches the lock). The winner re-reads the reap link (same inode) to CONFIRM it
     still holds the dead nonce + a proven-dead pid, THEN unlinks `lp` (the dead-lock name) and the
     reap link, then retries `openSync("wx")`. NON-DESTRUCTIVE: it never MOVES a live lock (verify
     before remove), so a live replacement created after the read is left intact.
  3. Content-fence ALL cleanup unlinks: `unlinkIfNonce(lp, ourNonce)` in the `finally` + stamp-failure
     path — remove `lp` only if it STILL holds OUR generation. Cleanup can never delete another
     holder's replacement.
- **Documented residual (FAIL-CLOSED, tracked — propose new ED):** a reclaimer crash in the
  microsecond window between the election `linkSync` and its cleanup leaks a reap link → that dead
  generation becomes manual-recovery-required (contended forever). Strictly better than the ABA
  fail-OPEN; matches the R3 "manual-recovery for torn/unidentifiable states" posture. NOTE:
  `fs.linkSync` requires same-volume hardlink support (NTFS local — OK); on an unsupported FS the
  reclaim degrades to contended (fail-closed).
- **Teeth (same round):**
  - `TEETH (C1/R5): election exclusivity` — pre-create a reap link for a dead generation; a second
    contender fails-contended and does NOT remove the dead lock.
  - `TEETH (C1/R5): content-fenced cleanup` — `unlinkIfNonce(lp, wrongNonce)` leaves `lp`;
    `unlinkIfNonce(lp, ourNonce)` removes it.
  - `TEETH (C1/R5): happy dead reclaim` — a dead-pid + nonce lock is reclaimed via election → fn runs.

### R5-C1B — PID not proven dead (CRITICAL — backend + qa convergent)
- **Source:** backend `C1-R4-PID-NOT-PROVEN-DEAD` + qa `C1-R4-invalid-pid-reclaim`.
- **Defect:** `pidAlive` returns false (→ treated as dead) for invalid finite pids (0, -1, 1.5,
  out-of-range) AND for every `process.kill` error except EPERM. So a malformed-but-finite pid or a
  non-ESRCH error triggers reclaim of an unidentifiable lock.
- **Fix (reviewer-guided: strict pid validation, positive integer only, else unidentifiable→manual-
  recovery):** add `pidProvenDead(pid)` = `Number.isSafeInteger(pid) && pid > 0 &&`
  `process.kill(pid,0)` throws with `code === "ESRCH"`. EVERYTHING else (invalid pid, EPERM, any
  other error, alive) → NOT proven dead → unidentifiable → contended. Use it at BOTH reclaim sites:
  the mutation-lock reclaim AND the lease `reclaim()`'s `dead` computation (fix ALL sites — the
  same-class-at-N-sites trap).
- **Teeth (same round):** pid `0` / `-1` / `1.5` / `2**53` (unsafe) / a live pid (self) on an ancient
  lock → `mutation-contended`, lock survives, fn NOT run. Plus a genuinely-dead pid (ESRCH) →
  reclaimed (regression guard).

---

## CLUSTER 2 — acceptance-record recompute candidate binding (`scripts/dispatch/acceptance-record.js`)
Convergent: qa-reviewer + security-reviewer. Split into TWO findings.

### R5-C2A — caller-override outranks record-bound candidate (HIGH)
- **Source:** qa `R3-REG-1-override-wrong-ref` + security `R4-RESULT-COMMIT-BINDING` (override half).
- **Defect:** recompute source is `opts.resultRef || opts.newHead || record.result_commit` —
  caller-supplied refs OUTRANK the record's bound candidate. Passing `resultRef = targetRef` re-opens
  the wrong-tree (destination/base) recompute; the CAS path forwards `opts.newHead`, so a DIFFERENT
  attacker commit whose tree == `result_tree_hash` can authorize AND be installed.
- **Fix (reviewer-guided: record-binding OUTRANKS caller opts, or overrides must re-verify against the
  record's result_commit):** recompute ONLY from `record.result_commit`. A caller-supplied
  `opts.resultRef`/`opts.newHead` does NOT override — if supplied it must resolve to EXACTLY the same
  commit SHA as `record.result_commit` (exact-SHA equality) or authorization fails closed.
  `commitIntegration`'s CAS may advance the ref ONLY to `opts.newHead === record.result_commit` (new
  reason `new-head-not-bound-candidate`) — so a same-tree-but-different-commit newHead is refused.
- **Teeth (same round):**
  - `resultRef = targetRef` (destination) does NOT authorize when candidate≠destination tree.
  - `newHead` = a different same-tree commit does NOT authorize (exact-SHA mismatch) and
    `commitIntegration` refuses it (`new-head-not-bound-candidate`).
  - Happy: a caller ref === `record.result_commit` still authorizes.

### R5-C2B — result_commit not pinned to an immutable SHA + no ancestry (HIGH)
- **Source:** security `R4-RESULT-COMMIT-BINDING` (binding half): "mandatory only syntactically … may
  be a mutable ref … enforce the intended ancestry relationship to base_commit."
- **Defect:** `result_commit` is required non-empty but not validated as an immutable full commit SHA
  (a mutable ref like `refs/heads/x` could be retargeted); no ancestry check to `base_commit`.
- **Fix:** in the mandatory identity gate, require `record.result_commit` to match `^[0-9a-f]{40}$`
  (an immutable full commit SHA — a ref name / short sha / empty fails closed). Enforce ancestry:
  `base_commit` MUST be an ancestor of `result_commit` (candidate builds ON the declared base) via a
  read-only `git merge-base --is-ancestor <base> <result>` (injectable `opts.ancestryResolver` for
  tests, mirroring `treeResolver`/`commitResolver`). Fail-closed if the relationship can't be
  confirmed. `base_commit` should likewise be validated as a full SHA where it gates ancestry.
- **Teeth (same round):**
  - `result_commit` that is NOT 40-hex (a ref name / short sha / empty) fails closed.
  - A candidate UNRELATED to `base_commit` (base not an ancestor) fails closed.
  - Happy: an immutable-SHA candidate that descends from base authorizes.

---

## R5 execution checklist (on β authorize)
1. Implement R5-C1A + R5-C1B in `conductor-lease.js` (+ `crypto` import); update the existing R2 DEAD
   teeth to carry a nonce (real stamp shape).
2. Implement R5-C2A + R5-C2B in `acceptance-record.js` (produce/produceForTest bind an immutable-SHA
   `result_commit`; authorizesIntegration recompute-from-record + exact-SHA override guard + ancestry;
   commitIntegration `newHead === result_commit`).
3. Add ALL per-finding teeth (above) in the SAME round.
4. Full local battery: conductor-lease + acceptance-record + falsifier corpus + workorder + reaper +
   choke-point + falsifier-liveness + tracker-fidelity + H3 writer scanner (expect all green incl. the
   new teeth), then tracker-fidelity `--enforce` + falsifier-liveness + choke-point CLIs.
5. Commit chunked (Cluster 1, Cluster 2). Push.
6. Re-gauntlet the TWO affected lanes (backend + security) + qa (qa spans both). Security via
   `dispatch-agent.js --provider openai --model gpt-5.6-sol` (stdin route — do NOT let it route to the
   argv-ceiling agy path). WG-19 gauntlet-verify over the lanes.
7. If R5 green → exit gates (falsifier-liveness, tracker-fidelity, conformance `--flip-gate` with AC-16
   REFUSAL=expected-green) → fresh β gauntlet→release → report to lead (α merges).
8. If R5 FAILS on the SAME class again → HALT for operator scope reckoning (consolidate-to-root
   exhausted; the residual is a documented fail-closed posture decision, not more patching).

## Propose ED (enforcement/residual debt)
- **ED-NEW-A (reclaim leak):** the election-based mutation-lock reclaim leaves a fail-closed
  manual-recovery residual on a reclaimer crash in the election→cleanup window (microsecond),
  and degrades to contended on hardlink-unsupported FS. Fail-closed by design; tracked so a future
  hardening (e.g. a reaper for stale reap links keyed on the reclaimer's own liveness) has a home.
