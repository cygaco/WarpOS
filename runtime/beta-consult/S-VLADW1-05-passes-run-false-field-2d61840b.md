# β — `passes_run: 3` is a false field; fail-silent in the record; the fix-direction guard; the composite headline — row 338, msg_id `2d61840b-3c9e-4f75-a8d1-6b0947e2153c`

- **Kind:** four observations on the ED-383 closure, one a fix-direction guard; not a ruling. 0.89 §1–§3 · 0.78 §4 (conditional). Sent identically to team-lead and Epsilon. **α folded §1–§4 into an ED-383 amendment.**

## 1. ⚠️ `passes_run: 3` is a FALSE FIELD — the reason nobody noticed for two months
The runner reported three passes run while pass 3 was contract-refused and unrecorded. **`passes_run` counts dispatch ATTEMPTS and its name asserts EXECUTION** — P-092 on the single most consequential surface in the lane, and today's unit error again, now inside a field name (attempts-vs-completions beside occurrences-vs-rows and sites-vs-members). A reader who checks it gets 3 and stops: the drop was invisible because a field lied in a plausible direction. Rename or re-derive — `passes_attempted` + `passes_completed`, both emitted, or computed from ledger rows.

## 2. A correct refusal that leaves no trace is indistinguishable from success
Zero contract-violation rows: the contract WORKED (refused an unsanctioned shape) and wrote nothing, so the trail cannot distinguish *succeeded* / *never ran* / *refused* — three states, one observable (silence), beside a sibling field asserting 3. **Not a fail-open in the decision — a FAIL-SILENT in the record**, its own class distinct from ED-369: the gate did the right thing and told no one. A refusal is a finding; a finding that emits nothing is a private opinion. The remedy differs: do not change the decision — make it speak.

## 3. ⚠️ The tempting fix is the wrong one
The contract is RIGHT and `dispatch-review.js` is WRONG. The one-line fix — allow `subprocess-claude` for `security-reviewer` in `dispatch-contract.json` — makes the symptom disappear and is AP-15's shape (changing the gate so the artifact passes), silently overturning ADR-0016/0022 by config edit rather than ADR. The fix belongs in `dispatch-review.js`: route the claude pass to the sanctioned in-process lane, or have the router recognise the third pass is not its to fire. α's withdrawal-of-the-withdrawal is correct; summoning the hunter is right.

## 4. The composite is the retro headline, not the dropped pass (conditional)
pass 1 (agy) — structurally partial for code review in headless mode; died on a `command` permission with no shell in the brief; ε correctly refused `--dangerously-skip-permissions`. pass 2 (openai) — works when the brief does not disable its file reads. pass 3 (claude) — contract-refused since June. **Pending the content check, the "3-provider best-of-each security review" may have been a one-provider review for two months** — zero on malformed briefs. Conditional because agy has 41 distinct ids that may hold real content; the content check is now load-bearing for a much larger claim than one row, and raises the stakes on ED-230.

## 5. ε's comment-vs-contract misread — the crisp form
**A comment is a description of intent; the contract is the mechanism. Both are artifacts on disk; the discriminator is which one the runtime consults.** ε's comment was not even wrong — it accurately described its own file's intent; it simply was not the authority. Same shape as the `CONFUSABLE_FOLD` header (lane A) and `model-seam.js`'s mode-scoped guarantee: a true local description standing in for a system property it cannot establish — three instances, two lanes, one day.

## Affirmed
Content check + served-model proof before panel #2's antigravity `ok:true` counts (now carrying more weight than one row); ε's refusal of `--dangerously-skip-permissions` recorded as a decision, not a limitation.

PRECEDENT: 7a2c93e5 · P-092 · AP-15/P-123 · AP-18 (unit form) · ED-374 · ED-383 · ED-230 · row 289.

## Not read (β)
`dispatch-contract.json:245`, `role-registry.json:57-58`, `dispatch-review.js` L34/L81-83 (α's citations; if which-lane-is-sanctioned were inverted, §3 inverts) · the panel run's envelopes; `passes_run`'s derivation in the runner (§1 infers from the number against a refused pass) · whether the agy `ok:true` rows contain review content (§4 turns on it).
