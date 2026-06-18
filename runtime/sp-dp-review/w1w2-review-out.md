# E-DISPATCH-PERFECT-001 W1+W2 Cross-Provider Review

VERDICT: FAIL

Counts: HIGH 4, MEDIUM 2, LOW 1

Most important issue: epsilon routes multi-pass roles through `dispatch-review.js`, but then reduces the result back to child-process liveness. A security lane can return a binding FAIL, `dispatch-review.js` can report `mergedVerdict:"fail"`, and epsilon can still mark the dispatch as ok because the parent exited 0.

## Findings

### HIGH 1. Epsilon drops `mergedVerdict`, creating an any-FAIL false green

File: `scripts/dispatch-review.js:131`  
File: `scripts/sprint/epsilon-runtime.js:472`  
File: `scripts/sprint/epsilon-runtime.js:547`  
File: `scripts/sprint/epsilon-runtime.js:694`

Why: `dispatch-review.js` computes the security answer in `mergedVerdict`, but intentionally exits 0 when every lane process stayed alive. The epsilon `DISPATCH_AGENT` branch selects `dispatch-review.js` for multi-pass roles, then `interpretSpawn()` treats success as only `exit === 0 && outBytes > 0`. The resulting `conductStep()` record carries `ok`, `recorded`, and `reason`, but not `mergedVerdict`.

Impact: A 3-lane security review with one explicit FAIL and two PASS lanes is reported as a successful epsilon dispatch as long as all three child processes exit 0. That violates the "any-FAIL-holds" security invariant unless another independent scanner later reads and gates the parent stdout. I did not find such a consumer in the epsilon path.

### HIGH 2. Live but malformed reviewer output is treated as PASS

File: `scripts/dispatch-review.js:78`

Why: `verdictOf()` first trusts `result.parsed.verdict`, then regexes `result.output` for a JSON-looking `"verdict":"..."`, and finally returns `result.ok ? "pass" : "error"`. That last fallback converts an alive but unparsable reviewer response into PASS. This is especially relevant for the Claude lane because `dispatch-claude.js` returns raw `output`, not `parsed`; it is only structurally recognized if the raw text happens to contain a matching JSON `"verdict"` token.

Impact: A security reviewer that emits `VERDICT: FAIL`, malformed JSON, prose with no JSON envelope, or a final FAIL outside the first matching `"verdict"` field can be merged as PASS. The safe behavior for a binding review lane is `error` on missing or invalid verdict, not PASS.

### HIGH 3. The hard config check accepts a 2-provider security chain

File: `scripts/checks/security-pass-count.js:44`  
File: `scripts/checks/security-pass-count.js:48`  
File: `scripts/checks/security-pass-count.js:54`

Why: W1's declared invariant is a full 3-provider security-reviewer chain. The hard config check only fails when `passes.length < 2`, and only checks for Claude as the final provider when `passes.length >= 3`. A registry containing only Gemini plus OpenAI, with no `third_pass`, passes the hard check.

Impact: `security-pass-count` can go green while the W1 third provider is absent. This is a declarative false green: the checker claims config coherence for a weaker chain than the change requires.

### HIGH 4. Runtime grouping can hide incomplete reviews

File: `scripts/checks/security-pass-count.js:76`  
File: `scripts/checks/security-pass-count.js:86`  
File: `scripts/checks/security-pass-count.js:94`  
File: `scripts/sprint/full.js:1773`  
File: `scripts/sprint/epsilon-runtime.js:490`

Why: The runtime check filters to `ok === true`, groups by `run_id || sprint_id || prompt_digest`, and only warns on groups with at least 2 but fewer than the expected provider count. In full runs, `full.js` creates one `WARPOS_RUN_ID` for the run and epsilon preserves it, so `prompt_digest` is ignored. Multiple distinct security reviews in the same run can collapse into one group and combine providers.

Impact: Two or more incomplete reviews can make each other look complete if their ok provider records union to 3 distinct providers under the same run id. Also, a 1/3 partial review is explicitly ignored even under `--strict`, because `provs.size` is below 2 and failed/dead lanes were filtered out before grouping. A true same-review 2/3 partial is flagged when grouped correctly, but the grouping key is not robust enough to guarantee that.

### MEDIUM 1. A live gauntlet path still bypasses `dispatch-review.js`

File: `scripts/delta-final-gauntlet.js:41`  
File: `scripts/delta-final-gauntlet.js:70`

Why: `delta-final-gauntlet.js` includes `security-reviewer` in its role list, but spawns `scripts/dispatch-agent.js` directly for every role. It does not call `passesOf()`, `passesForRole()`, or `dispatch-review.js`.

Impact: This is not the epsilon path, but it is a live dispatch-system script where the multi-pass `security-reviewer` role can fire only its primary provider. If W1 is intended as a global security-reviewer invariant, this is a bypass.

### MEDIUM 2. W2 fallback is allowed by policy but not automatically fired

File: `.claude/agents/_org/role-registry.json:36`  
File: `.claude/agents/_org/role-registry.json:37`  
File: `.claude/agents/_org/role-registry.json:60`  
File: `.claude/agents/_org/dispatch-contract.json:235`  
File: `scripts/dispatch-agent.js:692`

Why: The GPT product/growth leadership rows declare `fallback:"claude"`, and `review_fallback.applies_to_classes` now includes `cross_provider_consult_lead`. But the dispatch path I reviewed only reports fallback eligibility or provider failure; I did not find an automatic second spawn of `dispatch-claude.js --review-fallback` for these consult-lead roles.

Impact: The fallback is a sanctioned manual/secondary route, not an automatically enforced failover. If the intended W2 behavior is "OpenAI lead/director failure automatically falls back to Claude," the current wiring is a declarative lie.

### LOW 1. The epsilon-route config check is token-presence only

File: `scripts/checks/security-pass-count.js:34`  
File: `scripts/checks/security-pass-count.js:62`

Why: The hard check considers epsilon routed when the file contains the strings `dispatch-review.js` and `passesForRole`. It does not verify the call site, branch condition, role, or argv shape.

Impact: This can pass on comments, dead code, or unrelated references. It is weaker than a hard coherence check should be, although the current file does contain a real route.

## Checked Non-Findings

- Parallel spawn itself: I did not find a Promise/order race in `dispatch-review.js`; all lanes are awaited and merged.
- Dead lane handling in `dispatch-review.js`: a dead lane becomes `verdict:"error"` and `mergedVerdict:"error"`, and the parent exits nonzero because `allLanesOk` is false.
- Timeout handling: under the epsilon route, slow children are bounded by the child timeout and parent grace. A timeout is detected as a failed/dead lane or parent spawn failure; I did not find a timeout false green.
- Double-recording: in the reviewed epsilon branch, `recordedByCli=true` means children self-record and the parent does not add a second completion record.
- W2 rule precedence: the new `{tier:"director", provider:"openai"}` rule is before the generic director rule, but it is conjunctive. I did not find a non-director mis-resolution or a Claude director reclassification.
- Security class invariant: the build-chain-to-subprocess-Claude invariant still appears intact; the new consult-lead class does not poach reviewers.
