VERDICT: FAIL

Summary: the added checks are directionally right, and Check I's registry-only scope is the right way to avoid flagging the intentional SCRAPPED_*_ALIASES shim. The blocking problem is Check H: it can still false-green real effort drift. I found two false-negative classes in the parser/scope and one legitimate-YAML false-positive class. The model freshness age is surfaced for present snapshots, but the stale boundary is loose by up to almost one day and missing snapshots are omitted from snapshots[].

Findings

1. HIGH - Check H ignores the frontmatter effort key used by current cross-provider specs.
   File: scripts/checks/model-chain.js:192
   Evidence: .claude/agents/product/quality/qa-reviewer.md:9 declares provider_reasoning_effort: xhigh, while .claude/agents/_org/role-registry.json:41 carries effort: "xhigh". The parser only matches ^effort:, so if either side drifts, model-chain stays green. This is not hypothetical; qa-reviewer, frontend/backend reviewers, security-reviewer, design-lead, ops-analyst, and cabinet use provider_reasoning_effort rather than effort. The stated invariant is "spec-frontmatter EFFORT parity", not only the Anthropic shorthand. If provider_reasoning_effort is intentionally out of scope, the check/comment need to say so; otherwise parse both keys and flag contradictions.

2. HIGH - Empty YAML null effort is treated as if the key is absent, so active drift can pass.
   File: scripts/checks/model-chain.js:192
   Why: /^effort:[ \t]*(.+?)[ \t]*$/ requires at least one character. A legitimate YAML line `effort:` means null, but parseFrontmatterEffort returns hasEffortKey:false. Because evaluateModelChain skips !hasEffortKey at scripts/checks/model-chain.js:163, a spec declaring null effort against registry effort "high" is silently ignored instead of reported as drift. I verified the parser returns {"hasFrontmatter":true,"hasEffortKey":false} for `---\neffort:\n---`.

3. MEDIUM - Inline YAML comments are parsed as part of the effort value, causing false positives on legitimate specs.
   File: scripts/checks/model-chain.js:194
   Why: `effort: high # intentional` is valid YAML with value "high", but the parser returns "high # intentional" and would flag drift against registry "high". Similarly, `effort: # intentionally null` should be null but is parsed as "# intentionally null". This is a legitimate-spec false positive. A small hand parser must strip comments outside quotes, or this should use an actual YAML/frontmatter parser.

4. MEDIUM - Staleness is off by almost one day at the 14-day boundary.
   File: scripts/models/check.js:131 and scripts/models/check.js:192
   Why: ageDays() floors elapsed days, then staleness checks `age > maxAgeDays`. A snapshot that is 14 days plus 1 ms old is already older than the stated `> 14d` threshold, but ageDays() returns 14 and no WARN fires until the elapsed age reaches 15 full days. If the policy is truly max-age in elapsed days, compare raw milliseconds for staleness and keep a rounded/floored display value separately.

5. LOW - Missing snapshots are warned, but not represented in snapshots[] or the human "snapshot age" row.
   File: scripts/models/check.js:178 and scripts/models/check.js:249
   Why: on read failure the loop adds a WARN and continues before pushing an age/snapshot record. That prevents a false green because findings contains a WARN, but it means --json snapshots[] is not an exhaustive per-provider report and a missing provider has no explicit age/status entry. If consumers are meant to rely on snapshots[], push `{ provider, ageDays: null, status: "missing" }` before continuing, or rename the field to presentSnapshots.

Question Answers

1. Check H can false-negative. Quoted values and CRLF work. Body prose is not matched. Empty `effort:` is mishandled. provider_reasoning_effort is completely invisible. Wrong/missing spec paths are explicitly skipped as role-parity scope; that is acceptable only if model-chain is never used as the sole effort-drift gate.
2. Check I registry-only scope is correct for this W0 guard. The scrapped names do reach live dispatch via the intentional alias/shim path: role-aliases maps redteam/qa/compliance to canonical roles, and registry-roles.SCRAPPED_*_ALIASES keeps builder/reviewer/compliance/qa/redteam/fixer provider/effort compatibility in catalog/providers. That is not a Check I miss; it is the documented compatibility lane. I did not find a non-shim live path that should be added to Check I.
3. parseFrontmatterEffort only searches inside the first frontmatter block and I do not see catastrophic backtracking risk. The regex is still too weak for YAML null/comment semantics.
4. Fresh present snapshots are surfaced in human output and --json. Missing snapshots are not in snapshots[]. The 14-day boundary is loose because of Math.floor().
5. Direct runs: `node scripts/checks/model-chain.js --json` returned ok:true; `node scripts/models/check.js --json` surfaced all three present vendor ages at 16d and WARNed as expected. The bite-test scripts could not be fully run in this sandbox because nested `child_process.execFileSync("node", ...)` fails with `spawnSync node EPERM`; direct node invocations work.
