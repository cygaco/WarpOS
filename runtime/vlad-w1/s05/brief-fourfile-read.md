# FOUR-FILE CUSTODY-PROSE READ — prerequisite for bundle P task 5 — S-VLADW1-05

You are a read-only verification lane. **You write nothing and commit nothing.** Your output is a
report that another builder will cite.

**⏱ HARD BUDGET: your route is killed at 15 minutes.** A partial answer returned beats a complete
answer killed. Spend at most half your time reading; then STOP and WRITE. Mark anything unreached as
`not-reached`. Do not polish.

**Target repo (read-only):** `C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane`,
branch `wt/S-VLADW1-01-engine`. Read by absolute path. Your process cwd is NOT that repo.

---

## WHY THIS LANE EXISTS

A previous sprint's review lanes **sampled rather than read end to end** the custody prose in four
shipped files. A governance ruling requires that their un-audited status be **stated on the shipped
surface** — and that the statement be **resolved by an actual read before it is drafted**, because a
disclosure about un-audited files that itself over-claims its evidence would repeat the defect it
describes.

**You are that read.**

## THE FOUR FILES

- `engine/src/env-scrub.js`
- `engine/src/model-seam.js`
- `engine/driver/host-free-driver.js`
- `engine/src/server-entry.js`

(If a path does not resolve, say so — do not substitute a similar file.)

## WHAT TO DO

**Read each one END TO END.** Not greps, not the header, not the regions that look relevant — the
whole file. The entire point of this lane is that the previous lanes did not.

For each file, report:

1. **Every COVERAGE CLAIM in its prose** — comments, doc blocks, header text — where "coverage claim"
   means any sentence asserting what a mechanism handles, closes, covers, guarantees, prevents, or is
   limited to. Quote each one verbatim with its line number.
2. **For each such claim: is it TRUE of the code in that file, as the code stands now?** Answer
   true / false / cannot-determine, with your reason. Where false, say precisely what is wrong —
   a wrong *frame* (the claim names a coarser unit than the mechanism has) and a wrong *fact* are
   different failures and matter differently.
3. **Anything that looks like a closure claim** ("only", "all", "every", "no other", "exactly", "the
   two", a bare count) — flag it explicitly even if you believe it true, and say what would have to
   hold for it to be true.

## WHAT NOT TO DO

- Do not edit anything. Do not commit. Do not run the test suite.
- Do not fix a false sentence — **report it**. A different bundle owns the prose.
- Do not generalise across the four files ("the files are mostly fine"). Report **per file**; a
  finding that names a file is usable, one that names "the files" is not.

## RETURN — final message, plain text. Do NOT write report files.

Per file: the quoted claims with line numbers, each with its true/false/cannot-determine verdict and
reason. Then:

**These four fields are REQUIRED. An omitted field reads as UNKNOWN, never "nothing to report":**
- `what_i_could_not_assess`
- `files_i_could_not_see` — **if you did not read one of the four end to end, say so plainly.** That
  is the single most important thing you can tell me, because the whole disclosure rests on it.
- `execution_proven` — which claims you RAN vs reasoned about (you are not expected to run anything;
  say so if you did not).
- `what_would_confirm_or_refute`
