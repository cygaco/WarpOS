# Plan-hardening — 3 known-discrepancy reconciliation (Task #7)

**Session:** WarpOS 1.0 PLAN-HARDENING · 2026-07-17 · conducted by Alex ε (teammate)
**Scope:** evidence-gathering only — resolve the 3 items in `RATIFIED-PLAN.md §"Known discrepancies to reconcile"`. Read-only probes + test runs. No `--apply`. No plan execution.
**Method:** dispatch-completions ledger inspection → wiring read → one bounded live probe (agy) → direct test runs.

---

## Discrepancy 1 — agy / Google lane: DOWN (audit-B is correct; DUMP/tracker "attested live" is stale)

**VERDICT: enforcement-audit.md is CORRECT — the agy/Google lane is DOWN and unwired end-to-end (ED-060). The DUMP/tracker "3-lab panel ran agy `gemini-3.1-pro-high` attested live 2026-07-16" overclaims: it is a *roster-config* fact (the registry pins the role to agy), NOT a live-dispatch attestation. Do NOT build on "agy is live."**

Evidence chain (three independent layers, all pointing DOWN):

1. **Ledger — zero agy records.** `.claude/runtime/dispatch-completions.jsonl` (503 records, range 2026-05-29 → 2026-07-17): NO record with provider `agy`/`antigravity` and NO record with model `gemini-3.1-pro-high`, ever. Every 2026-07-16 google-family record is the OLD `gemini` CLI (`gemini-3.1-pro-preview`) and every one is a failed reap: `ok:false, exit:1, stdout_bytes:0, fallback:true` (records i:476, 481, 482, 488). So the ledger does not attest a live agy run on 2026-07-16 (or any date).

2. **Wiring — no agy provider path.** `scripts/hooks/lib/providers.js` has NO `antigravity`/`agy` provider block (no `cli`, no `syntax`). `antigravity` appears only in the fallback family map (`PROVIDER_FAMILY = {..., antigravity:"google"}`) with rule `if (family==="google") target="openai"` — a google-family primary that fails falls back to GPT. The only google syntax present is the deprecated `gemini {reasoning} -m {model} -p` (providers.js:416). Dispatch was never migrated to agy. `agy 1.1.3` IS on disk (`~/AppData/Local/agy/bin/agy`) but its headless contract is unwired.

3. **Live probe — contract-blocked before any CLI.** `node scripts/dispatch-agent.js security-reviewer <tiny-prompt>` (an agy-routed role; role-registry pins `security-reviewer` and `research-lead` to `provider=antigravity, model=gemini-3.1-pro-high`) returned, in ~instant:
   ```
   [dispatch-agent] dispatch-contract VIOLATION: tool 'antigravity' does not match the
   contract tool_id (["codex","gemini","agy"]) for role 'security-reviewer'.
   {"ok":false,"provider":"antigravity","error":"dispatch_contract_violation"}
   ```
   Ledger line-count unchanged (503 → 503): no dispatch, no completion record. This reproduces DUMP **I-2** exactly — an internal id mismatch (`role-registry provider=antigravity` vs `dispatch-contract allowlist=[codex,gemini,agy]`) blocks the lane at the contract layer, before it ever reaches a CLI. The historical "recovery" (`--provider openai`) reroutes to GPT and does NOT exercise agy.

**Which source is stale & why:** the tracker/DUMP phrase "attested live 2026-07-16" is the stale/incorrect part. DUMP.md:33 more precisely calls "agy gemini-3.1-pro-high" a valid *roster* fact — and that narrow claim is true (the registry is configured to route there). But *configured-to-route* ≠ *ran-live*. No liveness evidence exists on any of the three layers. The audit's "Google lane DOWN / dispatch not migrated (ED-060)" is the accurate state.

**Residual for the 1.0 build (not a blocker for this hardening task):** the agy id-mismatch (`antigravity` in role-registry vs `agy` in the contract allowlist, plus the absent providers.js syntax block) is the concrete unblock work if the 1.0 plan wants a 3-family gauntlet. Today it is 2-family (GPT + Claude), as the audit states.

---

## Discrepancy 2 — `gpt-5.6-terra`: EXISTS and ran LIVE (confirmed by record; no re-probe needed)

**VERDICT: confirmed by a solid completion record. `gpt-5.6-terra` is real and ran live via the codex CLI as `qa-reviewer` on 2026-07-17.**

Completion record (dispatch-completions.jsonl, the only terra record present):
| field | value |
|---|---|
| dispatch_id | `d-mrob0i1p-4607c930` |
| role / provider / model | qa-reviewer / openai / **gpt-5.6-terra** |
| started_at → completed_at | 2026-07-17T02:13:40.573Z → 2026-07-17T02:20:28.685Z |
| elapsed_ms | **408112** (~6.8 min — real, not a synthetic 0) |
| prompt_bytes / stdout_bytes / stderr_bytes | 65016 / **3455** / 4027 |
| exit_code / ok / **fallback** | 0 / true / **false** (real terra — did NOT fall back to another model) |
| shape / tool_id | subprocess-cross-provider / **codex** |
| cwd | canonical WarpOS |

Real elapsed + real prompt/output bytes + `fallback:false` + `exit:0` = a genuine live codex-CLI run on the terra model. Record-based verification is sufficient per the task; no live re-probe run.

---

## Discrepancy 3 — the 3 pre-existing test failures: all still fail, all flip-independent — BUT 2 of 3 are stale-fixture false-REDs

**VERDICT: all three still fail and all three are unrelated to the 1.0 plan (flip-independent). Sharper truth than "3 open test failures": only ONE is a substantive enforcer failure; the other two are stale `.test.js` integration assertions that went RED *because the debt they expected the live enforcer to catch was resolved in a prior sprint* (the standalone enforcers now PASS). Matches the documented `resolving-debt-flips-its-report-only-enforcer-integration-test` pattern.**

| test | how run | result | one-line signature |
|---|---|---|---|
| cutover-completeness | `node scripts/checks/cutover-completeness.js` (standalone) | **EXIT 0 / PASS** | `PASS 268 files scanned · 57 raw hits · 0 live-stale · 57 allowlisted` |
| cutover-completeness | `node scripts/checks/cutover-completeness.test.js` (unit) | **EXIT 1 / FAIL** | `11 passed, 1 FAILED — integration: "enforcer must exit 1 on live tree (keystone debt), got 0"` (stale: keystone debt resolved → enforcer correctly exits 0 → assertion expecting exit 1 is now a false-RED) |
| duplicate-doc-drift | `node scripts/checks/duplicate-doc-drift.js` (standalone) | **EXIT 0 / PASS** (report-only) | no output; report-only. (A live report-only README.md drift across 8 paths still exists — the "README dup" the plan named — but it never gates, exit 0.) |
| duplicate-doc-drift | `node scripts/checks/duplicate-doc-drift.test.js` (unit) | **EXIT 1 / FAIL** | `8/9 passed, 1 FAILED — integration: "expected the known agent-dispatch-guide drift to be flagged"` (stale: that drift no longer present) |
| assert-warpos-templates-shipped | `node scripts/checks/assert-warpos-templates-shipped.js` | **EXIT 1 / FAIL** | `POSITIVE: expected 122 files under _warpos/templates, found 138` (negative checks pass) |

**Flip-independence (all three):**
- *cutover-completeness.test.js* — the live enforcer passes; only the test's hardcoded "live tree has the keystone debt (exit 1)" integration assertion is stale. Untouched by the 1.0 kernel plan.
- *duplicate-doc-drift.test.js* — the fixture expects a known agent-dispatch-guide drift that has since been reconciled. Untouched by the 1.0 plan.
- *assert-warpos-templates-shipped* — hardcoded expected count 122 vs live 138 (16 post-baseline additions). Untracked `WarpOS-v1/` rebuild dir is present; this is the post-release baseline-delta WIP class, not a 1.0-plan change. Untouched by the 1.0 plan.

**Follow-up (out of this task's scope, for whoever owns the enforcers):** migrate the two `.test.js` integration assertions to expect-clean (the resolved-debt migration discipline — do it in the same commit that resolved the debt, which was missed); re-baseline the assert-templates count 122→138 (or exclude the WarpOS-v1 WIP). None block the 1.0 plan.

---

## Net for the plan

- **agy lane:** correct the plan/tracker to say the Google/agy lane is **DOWN/unwired (ED-060)** — the "attested live 2026-07-16" phrasing is stale. Gauntlet is 2-family (GPT+Claude) today. agy id-mismatch is the unblock work if 3-family is wanted.
- **gpt-5.6-terra:** **real & live-verified** (record d-mrob0i1p). Safe to reference.
- **3 test failures:** all still open, all flip-independent; 2 are stale-fixture false-REDs (enforcers pass), 1 is a genuine baseline-count drift. None block the 1.0 plan.

---

## Discrepancy 4 — ED-205 (`--provider` override drops spec's `provider_model`): CONDITIONAL — behavior reproduces, but it is CORRECT-BY-DESIGN, not a defect

**VERDICT: CONDITIONAL. The observable behavior REPRODUCES — an explicit `--provider` given WITHOUT `--model` does drop the role spec's `provider_model` and lets `runProvider` pick the override provider's default model. But this is intentional, documented, and correct: the spec's `provider_model` is native-provider-bound, so carrying it onto an overridden provider would be a cross-provider model mismatch. ED-205 is a mischaracterized citation, not a fixable defect. Code-level trace, no live dispatch needed.**

Determining code — `scripts/dispatch-agent.js:759-768` (mutually-exclusive branch chain):
```js
const roleModel = getRoleModel(role);            // spec frontmatter provider_model (:389-401)
const runOpts = {};
if (providerOverride) {                          // --provider passed (:760)
  runOpts.provider = providerOverride;
  if (modelOverride) runOpts.model = modelOverride;   // ONLY --model is honored here
} else if (modelOverride) {
  runOpts.model = modelOverride;
} else if (roleModel) {
  runOpts.model = roleModel;                     // reached ONLY when NO --provider (:765)
}
result = runProvider(role, prompt, withPropagatedTimeout(runOpts));
```

Trace:
- `--provider X` **without** `--model` → the `providerOverride` branch runs, `runOpts.model` is left UNSET (the `else if (roleModel)` branch is unreachable) → `runProvider(role, prompt, {provider:X})` receives no model → it falls to provider X's `default_model` (providers.js: `openai.default_model=gpt-5.5`, `gemini.default_model`, etc.). **So yes, `provider_model` is dropped.** REPRODUCES.
- `--provider X` **with** `--model Y` → `runOpts.model = Y` (:762), Y is honored. The explicit-override path already exists.
- No `--provider` → `roleModel` (spec `provider_model`) is honored (:765-766). Native path unaffected.

Why it is CORRECT, not a bug (`dispatch-agent.js:742-746`, verbatim intent):
> "Honor the agent's frontmatter-declared provider_model … instead of the provider default. **BUT when --provider overrides the native provider, the spec's model belongs to the WRONG provider — ignore it and use --model (or let runProvider pick the override provider's default).**"

A role's `provider_model` is tied to its native provider (e.g. `qa-reviewer`→a GPT id; `security-reviewer` post-flip→`gemini-3.1-pro-high` on antigravity). If you override `--provider openai` on the security-reviewer, applying `gemini-3.1-pro-high` to the codex CLI is nonsensical and would fail. Dropping the native model and using the override provider's default is the ONLY safe behavior; the built-in remedy for a specific model is to pass `--provider X --model Y` together (:762).

**Residual (mild, not a defect):** a *same-provider redundant* override (`--provider openai` on a role whose native provider is already openai with a finer `provider_model` like `gpt-5.6-terra`) also drops the finer model to the openai default — a small surprise, fully mitigated by adding `--model`. This is an expectation/doc nuance, not a code fault; no fix required for the 1.0 plan.

**Net:** ED-205 should be reclassified from "verified defect" to "verified citation of intended behavior" (or closed). Nothing to build; the cross-provider override correctly refuses to carry a native-provider model.
