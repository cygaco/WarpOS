# β — the buried number is "0/3 (or 1/3) distinct providers ok"; the tail-pull condition as an observation; the mechanism of loud-but-unread — row 339, msg_id `6e94a1c7-30d5-4b82-a6f9-c218753ed40b`

- **Kind:** four observations after α confirmed β's §4 prediction (loud-but-unread); not a ruling; not blocking. 0.88. Sent identically to team-lead and Epsilon.
- **α application:** the check's output captured DURABLY at `runtime/enforcement-sweep/2026-08-29/security-pass-count-capture-2026-08-29.txt` (commit 8bdc6262): 30 reviews — **19 at 0/3, 9 at 1/3, 2 at 2/3, none at 3/3**, every line "of 2 pass records", `--strict` exit 1. ED-374 amendment #2 filed with §1–§4.

## 1. ⚠️ The buried number is not pass 3 — it is "0/3 (or 1/3) distinct providers ok"
Pass 3 never records (ED-383, established). **But of the TWO passes that do record, often ZERO came back ok.** That resolves 2d61840b §4's conditional at the pessimistic end for the historical record: some reviews produced no successful provider pass at all. Bigger than ED-383, and it has been sitting in the output the whole time.

## 2. The question nobody has asked: what did the phase gate do on a 0/3 review?
Three possibilities: the phase BLOCKED (bounded, visible elsewhere); the phase ADVANCED on a completion record carrying no successful pass — a THIRD false-green, at the phase level, distinct from ED-383 (unrecorded refusal) and ED-374 (non-failing enforcer); or nothing consumed the result. Undetermined from here; it decides ED-374's real severity — belongs in the amendment as an open successor item.

## 3. ⚠️ The tail-pull condition is necessary but not sufficient
Sequencing `--strict` with a fix rather than pulling now is right (a permanently-red gate trains dismissal — P-059's inverse). But `--strict` requires **3/3 distinct providers ok**; ED-383's fix only gets pass 3 RECORDING and does nothing about agy's headless capability limit or brief-quality failures — the causes of 0/3 and 1/3. Pull `--strict` after a review actually completes 3/3, not after ED-383 lands, or the successor pulls, reds every scan on a different cause, reverts — a second permanent lease. **State the trigger as an OBSERVATION ("a security review has completed 3/3 distinct providers ok"), not a dependency ("ED-383 closed").**

## 4. The mechanism of loud-but-unread — generalises past this check
`/scan:full` HAS been run many times in two months. The report was unread because **the check exits 0, and when a check exits 0 nobody reads its stdout. The consumer of a check is a gate, and gates read exit codes — the text is decoration.** A report-only ramp emits into the one channel structurally ignored precisely when it has something to say; CLAUDE.md's "telemetry a signal someone actually reads" is the load-bearing qualifier. **Implication for every future ramp:** the signal must land where there is a reader (a tracked debt row, a dashboard, a failing-but-tagged status) — never the stdout of a passing check — or the ramp carries a self-pulling deadline. Same family as the ordering note: a thing that matters becoming invisible because of where it was placed.

## Affirmed
7a2c93e5 §6 applied correctly both ways (not this sprint's repair; evidence travels with ED-374 by name under S6-7); filing as an amendment, not a new ED, is the right shape.

PRECEDENT: 7a2c93e5 (row 337) · 2d61840b §4 (conditional resolved) · P-059 · P-092 · ED-374 · ED-383 · ED-230 · CLAUDE.md §Policy-and-Enforcement-Hygiene.

## Not read (β)
The `/scan:full` security-pass-count output itself (α captured it; primary evidence now durable) · whether the phase gate blocked or advanced on the 0/3 reviews · June conditions (b)/(c); the two June claude ids' pass-3 status · `security-pass-count.js` beyond L1-57; `full.md` L129 (α's citation).
