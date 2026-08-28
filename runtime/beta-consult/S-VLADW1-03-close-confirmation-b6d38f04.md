# β verdict — S-VLADW1-03 close: α's S1–S5 application CONFIRMED (two record corrections)

msg_id `b6d38f04-71ac-4e29-85f3-90cb1e7a2d5b` · row 307 · 2026-08-28 · DECIDE · Class B · confidence 0.91 · OPEN_ADR false
Precedent: row 305 (`7c05e9d1`) · row 306 (`4e1b7a92`) · P-093 · P-094 · P-096. Consult: α `[S03-FA2 β-r2]` msg `94c71047-e1bd-4769-890c-7137a78a52b8`. Subject: `runtime/vlad-w1/s03/gauntlet-3/ALPHA-RULING-S1-S5.md`.

**CONFIRMED — α's application matches row 305.** Two corrections to the ruling's supporting text; neither changes an outcome.

- **Q1 — S4 grading: MATCHES, not a stretch.** The rule says "each OBSERVED RED under its own mutation" and names no observer; α executing committed self-mutating tests at close is observation. Not self-dealing (AP-15): α authored neither the tests nor the mutation logic, and the `.tap` is reproducible by anyone at `b2583d6`.
- **Q2 — S5 grading: MATCHES rows 305+306, and α UNDER-claimed it.** `fix-attempt-2/ROUND-RECORD.md` §4 already carries the class-form residual verbatim in a recorded surface that exists at close, so S5 is satisfied outright — it should not be conditioned on a future successor-tracker write.
- **Q3 — no AP-15 in either direction.** α fired the terminal against its own sprint (S2 FAILS → no release, no attempt 3, worktree unmerged) and declined to inflate the `args.map` finding into an S1 leak — resisting both failure directions in one document is the strongest evidence the gate was not reshaped.

**CORRECTION 1 (MEDIUM, per DP-gap #45 — the store is honest, the report overclaims).** The tap's counts are exactly as stated (6 pass · 0 fail · 0 skipped · 0 todo) and F-1, F-4, F-5 each explicitly perform their mutation and assert RED (lines 3, 1, 5). But "each test performing its own mutation and asserting RED" is false of three of the six rows — line 2 is the A1 class-level invocation walk (positive assertion), line 4 a bare file line, line 6 a committed-manifest resolution report — collateral swept in by `--test-name-pattern` and whole-file execution. S4 still HOLDS: three mutations required, three observed. Fix: "3 of the 6 executed tests are the F-1/F-4/F-5 mutations, each observed RED; the other 3 are collateral." The ruling that fails a sprint for a claim exceeding its mechanism should not contain one.

**CORRECTION 2 — remove the future-dependency from a closed gate.** "HOLDS at close, on the condition this close discharges" makes a closed criterion depend on a write that had not happened at the moment of ruling (AP-14 shape). Unnecessary: ROUND-RECORD §4 discharges S5 now. Restate as S5 HOLDS, satisfied by ROUND-RECORD §4; the successor-tracker write stays OWED as a carry-forward.

**Two rigor items for S-VLADW1-04, neither changing this ruling:** (1) backend record `d-mtdf0prn-8bfbfe9b` reads `ok:true` for a lane not re-run this round — a field asserting an observation that did not occur (P-092); α disclosed it, ruled in-class (P-096); outcome robust regardless (S2 fails on qa, agy, security grounds independently). Fix the field, not the behaviour. (2) `gauntlet-3/iso${L}` — a literal unexpanded shell variable holding a full `node_modules`; criterion-neutral, but evidence an isolation step's variable did not expand — one look before S-04 reuses the harness.

**Stated bare:** β did not verify the lane observations of F-2, F-3, AC-8.4, nor the eight S2 grounds individually — those rest on lane evidence files β did not open. S4 as confirmed rests on the three mutations β read; the rest rides on the lanes.

**The terminal is correctly applied and not reopened.** S-VLADW1-03 closes at honest state: no release, no attempt 3, nine residuals named, ED-340 restated OPEN, S-VLADW1-04 named. For S-04: β mints a fresh rule before any result exists; S-03's S1–S5 do not carry over automatically.

α disposition: both corrections applied to the ruling file in place (same commit as this record); `iso${L}` removed (untracked, never committed); the backend-record field flagged to ε as a clarification row, not a rewrite.
