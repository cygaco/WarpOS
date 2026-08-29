# Lane evidence — `security-reviewer` / agy (CROSS-FAMILY) — S-VLADW1-04 gauntlet-1 (DIAGNOSTIC)

Shape: `subprocess-cross-provider` via `scripts/dispatch-agent.js` · provider `antigravity` ·
model `gemini-3.1-pro-high` · `WARPOS_AGY_PRINT_TIMEOUT=300s` · dispatched from the WarpOS canonical root.
Raw: `out-security-agy.json`, **ok:true**, `error: none`, output 3642 B. Brief: `lane-security-agy.md`
(18970 B — the two CHANGED mechanism regions plus `initCredentialCustody()` itself, both loops).

**Verdict: FAIL.** `args_door_holds: **yes**` · `absorb_delete_symmetry_holds: **no**` ·
`prior_findings_repaired: **yes**`.

**FOURTH CONSECUTIVE GAUNTLET in which the cross-family lane found something every same-family lane
missed** — and this time on a mechanism the `security_claude_hunter` lane had attacked directly and cleared.

## F-1 — LOW — absorb/delete symmetry breaks on a non-string `names` element

> *"Because elements of `namesArr` are not coerced to strings before being frozen into `sweepNames`,
> passing an object with a stateful `toString()` causes it to be evaluated multiple times as both loops
> iterate. During the absorption loop it evaluates independently for `hasOwnProperty`, `nextCaptured`, and
> `readOwnEnvValue`, and then evaluates again in the deletion loop for `delete process.env[name]`. **This
> allows a single element to absorb one environment variable but delete another, completely breaking
> symmetry.**"*

Graded **LOW** by the lane itself — shipped callers pass fixed string arrays, so it is unreachable in
production — **but it falsifies the shipped CLASS claim** that the mechanism enforces symmetry regardless of
caller behaviour. Precondition stated and marked established from the text it saw;
`execution_proven: false`, correctly, because it ran nothing.

**Why this matters beyond its severity:** the `security_claude_hunter` lane attacked *exactly this
technique* — a stateful `toString()` and an index getter — against `spawn-shim.js`'s `args` and proved it
**sound** (`getterCalls=1`, `toStringCalls=1`). **Nobody applied the same technique to `env-scrub.js`'s
`names`.** agy did, from two excerpts, with no tools.

## F-2 — LOW — and it directly falsifies bundle D's own "0 widenings" claim

> *"The check `Object.getPrototypeOf(args) !== Array.prototype` strictly verifies the prototype but does not
> verify `Array.isArray(args)`. An object like `Object.create(Array.prototype)` passes this check (its
> prototype is exactly `Array.prototype`) and can define own-property getters for `length`."*

No TOCTOU bypass follows — the shim normalizes into a fresh frozen `normArgs` before `spawn()` — **but it
falsifies the shipped comment** claiming D1 is *"STRICTLY NARROWING"* and *"adds no new acceptance"*:
such an object **would have been rejected by the previous `Array.isArray()` check** and is accepted now.

**Bundle D's envelope claimed a differential probe over 14 container shapes with "0 widenings, 3 narrowings,
11 identical". agy names a 15th shape that IS a widening.** `spawn-shim.js` ships, so a false claim in it is
S4-1 territory.

## `residuals_wrong_or_missing` — both are shipped CLASS claims it falsifies

1. *"`src/spawn-shim.js` claims D1 is 'STRICTLY NARROWING' and 'adds no new acceptance'. **This is false**:
   `Object.create(Array.prototype)` is not an Array and would fail an `Array.isArray()` check, but passes
   the new `Object.getPrototypeOf(args) === Array.prototype` check. Thus D1 actually **widened** acceptance
   to include non-array objects inheriting directly from `Array.prototype`."*
2. *"`src/env-scrub.js` claims the mechanism has 'no second population for the first to drift from',
   guaranteeing symmetry. **This is false for non-string elements**: because elements are not coerced to
   primitives before being placed in `sweepNames`, an object with a stateful `toString()` causes the single
   population to evaluate to different string keys during absorption and deletion, successfully drifting
   the two operations apart."*

## Read-scope, declared unprompted

`files_i_could_not_see`: the rest of `spawn-shim.js`, the rest of `env-scrub.js`, `server-entry.js`,
`driver.js`, `model-seam.js`, `CUSTODY.md`, `test/env-scrub.test.js`, `test/env-scrub-capture.test.js`.

## Conductor note

Both findings are **LOW on reachability and HIGH on claim-truth** — each falsifies a CLASS claim on a
shipped surface while being unreachable through any shipped caller. That is precisely the distinction this
sprint's rule separates: **S4-2 is about the mechanism, S4-1 is about what the text says about it.** The
mechanisms hold; two sentences describing them do not.
