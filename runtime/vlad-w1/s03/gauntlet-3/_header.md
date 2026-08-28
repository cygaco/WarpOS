# S-VLADW1-03 — GAUNTLET 3 — THE QUALIFYING RUN

You are a REVIEW LANE. Your verdict is BINDING: the conductor cannot override a FAIL, and will not try.

## THE COMMIT UNDER REVIEW

**`b2583d6`** on branch `wt/S-VLADW1-01-engine`, in worktree
`C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`. Verify it yourself with
`git -C <worktree> log --oneline -1` and report what you actually saw in `commit_reviewed` — if it does not
say `b2583d6`, stop and say so rather than reviewing a different tree.

The previous round (gauntlet 2) reviewed `0732cd8`. Fix attempt 2 is the six commits between them:

    6208ca3  fix(10e)  pointer-lint contradiction, scan-root seam, falsifier F-5
    55fc6a3  fix(10d)  full-history re-scrub (the choke-point guarantee, MECHANISM route)
    d5fca1d  fix(10b)  bind every Asserted and Ceiling paragraph BY DERIVATION
    49fa49f  fix(10a)  one shared lexer; the inert invocation control closed
    977ab14  fix(10c)  ordering claim told truly in entry source, pinned whole, mutants that cannot no-op
    4f12cfb  fix(10f)  bound Ceiling paragraph's canonical copy brought into step with CUSTODY.md
    b2583d6  fix(10f)  guard the rule-set mutation in no-tautological-assertions against silently no-opping

`git diff 0732cd8..b2583d6` is the full change set under judgment. **Conductor-measured at this commit, for
you to CHECK rather than trust:** `node --test "test/*.test.js"` → exit 0, 318 pass / 0 fail / 0 skipped /
0 todo; `npm run check:ship` → exit 0; `npm run check:pointers` → exit 1, which is RED BY DESIGN and
deliberately not part of `check:ship`.

## What this run is

This is the gauntlet that follows **fix attempt 2 of 2 — the last fix attempt this sprint gets.** Under the
pre-committed release rule, this run's evidence directory is **the qualifying gauntlet**. There is no attempt
3. If any release criterion fails at this close, the sprint does not release: it closes at its honest state
with residuals named and the remainder handed to a named successor.

So: **do not grade generously because it is the last round.** The entire value of a pre-committed rule is
that it is applied the same way whether the result is convenient or not. An honest FAIL here is worth more
than a green light that a user later discovers was wrong.

Equally: **do not inflate.** A finding graded above what the evidence supports corrupts a criterion that may
be honestly met. Grade what you can prove, mark clearly what you inferred but did not run, and say plainly
what you could not assess.

## The release rule (pre-committed by beta at the design->build boundary, BEFORE any result existed)

RELEASE requires ALL FIVE to hold at this close. You will be asked to assess each within your scope.

- **S1 — Zero execution-proven leaks, RE-ESTABLISHED not cited.** No lane observes a real child obtaining a
  real secret against a green gate, AND the TOCTOU battery (seven carriers plus three earlier attacks) is
  committed and green, each paired with a raw control proving an unguarded child DOES obtain the value.
  Citing an earlier sprint's result does not satisfy S1.
- **S2 — Zero PROVEN-over-unproven in shipped copy AT CLOSE.** Every custody claim string on a shipped
  surface is TRUE of the code at close. Scope fixed deliberately: S2 does NOT require a mechanism preventing
  future overclaims; it requires that this residual be DISCLOSED in the shipped ceiling text.
- **S3 — The wiring proof goes RED on removal.** Deleting the scrub call from `src/server-entry.js` makes a
  committed standing test go RED, OBSERVED under mutation; same for the driver entry; and the walker asserts
  BOTH classification directions.
- **S4 — All five falsifiers F-1..F-5 present, committed, and each OBSERVED RED under its own mutation.**
  Presence is not observation. `NO_DATA` is not a pass. A `t.skip()` in that position is the defect.
  The predecessor sprint's AC-8.4 mutant test rides here too: it must still exist and still be red-capable at
  close, re-verified rather than cited.
- **S5 — Every named residual in the build spec appears in the recorded or shipped surface at close.** An
  honest downgrade is honest only if the residual travels. A residual disclosed only in an internal artifact
  does NOT satisfy S5 for a shipped claim — disclosure lives where the claim's reader is.

**Discriminators, both directions, quoted from the rule:** a re-confirmation is not a new finding · a new
finding in a ceiling'd-and-disclosed class fires S1 only if execution-proven against a green gate · **LANE
VERDICTS DO NOT DECIDE** (four FAILs on MEDIUMs may still release; four PASSes may still fail S2 or S5) · a
falsifier present but never observed RED does not satisfy S4.

You assess and evidence. **Alex alpha applies the rule.** Neither you nor the conductor rules on release.

## What the previous round found, and what fix attempt 2 did about it

Gauntlet 2 (commit `0732cd8`) closed with: **S1 holds · S2 FAILS · S3 FAILS · S4 unmeasured · S5 holds.**

- **S3 failed** because the invocation control was INERT: `src/bootstrap.js` carries the text
  `initCredentialCustody(...)` inside a prose comment, the classifier matched raw source, and bootstrap.js
  sits on the mandatory hot path of both entries — so the "a real call exists somewhere" half was
  pre-satisfied by a comment for every shipped graph. A lane built a bypass entry and a real child received
  a real credential while every gate stayed green.
- **S2 failed** on new grounds, three of them introduced by fix attempt 1: the claim lint bound only A1-A4
  while its own header promised every Asserted paragraph; the rewritten ordering sentence was still false one
  reading over; a new `node:` builtins clause was false and unasserted.
- **S4 was unmeasured** — the falsifiers were present but nobody had mutated them for two rounds.

Fix attempt 2 landed five bundles (10a, 10b, 10c, 10d, 10e — see the per-lane brief for which are in scope
for you). **Your job is not to confirm they worked.** Assume nothing. The repairs in this sprint have twice
produced NEW defects one layer out from the thing they fixed, and twice been "true one reading over". The
highest-value thing you can do is find the layer these fixes did not reach.

## TWO CRITERIA ARE EXPLICITLY NOT CARRIED FORWARD

Gauntlet 2 closed with S1 and S5 both reading "holds". **Neither is carried into this run.**

- **S1 must be RE-ESTABLISHED, not cited.** This is in the rule text itself. Citing an earlier round's
  result, or this sprint's own gauntlet-2, does not satisfy S1.
- **S5 must be RE-ADJUDICATED on the POST-DEFERRAL surface.** Since gauntlet 2, AC-8.6 — the product-layer
  custody self-check — has been formally DEFERRED to a named successor sprint and will NOT land here. Beta
  ruled the deferral is not a gate reshape, but it changes what the shipped surface must disclose. So
  gauntlet 2's "S5 holds" is void: re-derive S5 from the surface as it stands now.

Read `runtime/vlad-w1/s03/fix-attempt-2/ROUND-RECORD.md` before you start. It carries the conductor's own
measured ground truth (module evaluation order under both process shapes, by an instrumented load hook),
the deferral record, and a CLASS-form residual that S5 turns on. **Treat it as evidence to CHECK, not as
findings to accept** — it is the conductor's work and the conductor does not judge this run.

## Isolation mode for this run

`qa-reviewer`, `backend-reviewer` and `security_claude_hunter` mutate the tree, and they run **SERIALIZED on
the live worktree** — one at a time, so no two lanes ever mutate concurrently. `security-reviewer` (agy)
runs in parallel with them because it is served toolless-inline and mutates nothing.

Isolated per-lane copies were built and then REJECTED, for a reason that matters to you: a fresh checkout of
this commit materialises `engine/CUSTODY.md` with CRLF endings while the working tree holds LF, so a lane
judging an isolated copy would have been judging the conductor's scaffolding rather than the tree under
review. You are on the real tree. **Restore everything you mutate, and confirm `git status --porcelain` is
clean before you emit.** The next lane's run depends on it.

## Rules of engagement

1. **Mutate freely, then restore.** You are running on the live worktree and lanes are SERIALIZED for this
   reason. Verify `git status --porcelain` is clean when you finish and say so. If you cannot restore
   something, say that loudly rather than quietly.
2. **Execution beats reasoning.** A finding you ran carries `execution_proven: true` and the real output. A
   finding you reasoned to carries `execution_proven: false` and says so. Do not blur them — a previous round
   was materially improved by a lane that ran a claim and falsified it, and by another that declined to fire a
   criterion its evidence did not support.
3. **Grade by what is PROVEN, not by what is alarming.** If a bypass requires adding a file that does not
   ship, that proves a CONTROL is inert (S3), not that the package leaks (S1). Say which.
4. **A finding no other lane filed is not thereby wrong.** The cross-family lane has twice found real defects
   all three Claude lanes missed.
5. **Emit your JSON verdict as the very last thing you output, and emit it even if you must stop early.** A
   lane that does real work and then returns prose instead of its JSON reads downstream as a dead lane and its
   work is not counted. This has happened three times in this sprint. If you are running long, cut scope and
   emit.

## Your output contract

Return ONE JSON object as your final message, nothing after it:

    {
      "lane": "<your role>",
      "verdict": "PASS" | "FAIL",
      "commit_reviewed": "<sha you actually verified with git>",
      "worktree_clean_at_finish": true,
      "s_criteria": {
        "S1": "holds | FAILS | cannot-assess",
        "S2": "holds | FAILS | cannot-assess",
        "S3": "holds | FAILS | cannot-assess",
        "S4": "holds | FAILS | cannot-assess",
        "S5": "holds | FAILS | cannot-assess"
      },
      "findings": [
        { "id": "F-1", "severity": "HIGH|MEDIUM|LOW", "criterion": "S1..S5|none",
          "file": "path:line", "claim": "<one sentence>",
          "execution_proven": true, "evidence": "<the real output you observed>" }
      ],
      "regressions_from_fix_attempt_2": ["<defects the LAST round of fixes introduced, or 'none found'>"],
      "what_i_could_not_assess": ["<be specific; silence here reads as a pass and it is not one>"]
    }

`verdict` is your own lane's judgment on your own scope. Filling `s_criteria` with `cannot-assess` where you
genuinely could not look is CORRECT and expected — a lane claiming to have assessed everything is less
trustworthy, not more.
