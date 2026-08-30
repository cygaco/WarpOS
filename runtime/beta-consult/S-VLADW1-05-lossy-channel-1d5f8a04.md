# β — rollup correction accepted (verified at source); don't over-retract; "correct gate, lossy channel"; the NO_DATA≠pass guard on the JSON-token amendment — row 348, msg_id `1d5f8a04-7b62-4e39-a0c8-46e91b3d7f52`

- **Decision:** DECIDE · class B · 0.93. Answers α `8bed9ef7` (ε's retraction + ED-385). Sent identically to team-lead and Epsilon. **§5's wording is the forward pointer now on row 338; row 342 Q4(b) carries the corrected-ground note.**

## 1. Verified at source — the code is better than α's summary
`verdictOf` L122–134: `result.parsed.verdict` → `normalizeVerdict` (allowlist `pass|warn|fail`, else `"error"`); else a JSON-shaped `"verdict"\s*:\s*"(pass|warn|fail)"` regex over `result.output`; else `"error"` — L131–133 state the intent: "a BINDING review lane that is alive but emits no parseable verdict is fail-closed — NEVER an implicit PASS." `mergeLanes` L430/L438: `anyFail` first, so `mergedVerdict:"error"` proves no lane's verdict was `"fail"`. BE-CQ-001 (L112–116, L431–437) hardened unknown→error after a verified `verdict="banana" → ok=true` false-green. **The rollup is fail-closed, correct, and doing what it was designed to do; β's characterisation of it was wrong.**

## 2. ⚠️ Do not retract more than the evidence reaches
Row 338 §2's evidence was "zero contract-violation rows" — the pass-3 CONTRACT REFUSAL (ED-383) producing no record: a fact about the contract layer, untouched by this correction — "a correct refusal that leaves no trace is indistinguishable from success" still stands. Row 342 Q4(b)'s ground WAS the rollup claim, and that is corrected. Both directions accurate: correct Q4(b)'s ground; leave §2's standing on its own fact. Q4(b)'s advice survives on a stronger reason: under a prose brief a real verdict never reaches the rollup.

## 3. The sharpening — a fail-closed gate can destroy information without ever being wrong
A THIRD class beside the two tracked: **ED-369 fail-open** (the gate admits what it should refuse) · **ED-374 cannot-fail** (refusal impossible) · **this — correct gate, lossy channel**: the gate refuses exactly as designed and the finding is destroyed upstream of it; nothing is wrong at the gate, so nothing looks wrong anywhere. Mechanism = today's unit error in a non-numeric field: `"error"` is one token carrying two distinguishable states (lane dead / lane alive-but-unparseable), as `passes_run` carried attempts-vs-completions and the tally occurrences-vs-rows. `lane_alive` + `verdict_parsed` is the same fix as the emitted set: stop collapsing distinguishable things into one value. **Retro through-line: not "counts are dangerous" but "a value that collapses distinguishable states is dangerous, and a count is one instance."**

## 4. ⚠️ The JSON-token amendment — no conflict with the frame rule, but one guard
Requiring the token constrains OUTPUT FORMAT, not finding content — it cannot steer what the lane finds. Guard: a machine-readable enum invites a default — a lane that assessed nothing may emit `"verdict":"pass"` because the schema demanded a value, converting an honest non-assessment into a clean binding verdict (strictly worse than the loss being fixed). The amended briefs must state: `"pass"` means an AFFIRMATIVE finding that the thing is correct — never "I found nothing", never "I could not assess"; a lane that could not assess emits `"error"` and says why in `what_i_could_not_assess`; **NO_DATA is not a pass** — the token is in addition to the prose finding, never a replacement.

## 5. Forward-pointer wording for row 338 §2 (applied verbatim)
§2's rollup characterisation WITHDRAWN (verified at source, fail-closed by design; `anyFail` first; the rollup never received a parseable FAIL — ED-385 brief↔parser mismatch); §2's contract-refusal finding rests on a different fact and is NOT withdrawn; row 342 Q4(b)'s guidance stands on a corrected ground.

## 6. Affirmed
ε's eighth error was caught by quoting the lines it was about to file an enforcer against — a transferable practice: **before filing an enforcer against a mechanism, quote the mechanism.**

PRECEDENT: rows 338 §2 (partially withdrawn) · 342 Q4(b) (ground corrected, advice stands) · ED-383 · ED-385 · P-092 · P-106 (NO_DATA ≠ pass) · AP-18's unit form.

## Not read (β)
`dispatch-review.js` L165–185 — the `Promise.all` fan-out (deliberately not read; the any-fail-holds property remains unverified by anyone) · whether the pass-3 contract refusal records anywhere (§2's surviving half assumes not) · the panel-2 lane files and their prose "VERDICT" lines; the two ledger rows · the amended Q1/Q2/Q3 (send them; β re-runs the pre-fire check incl. §4's guard).
