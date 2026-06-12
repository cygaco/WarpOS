# Provider Setup Playbook

Reference procedure only. This is not an executable `/playbook:run` protocol.

Source design: `_planning/playbooks/SUITE-DESIGN.md`
Primary mode: sprint or adhoc
Primary outputs: provider-tier state, remediation steps, tracker evidence

## Situation

Use this playbook when WarpOS or a product needs provider readiness for serious work: Claude, OpenAI, Gemini, hosting, auth, analytics, payments, email, or adjacent services. The goal is to make provider setup explicit, value-free where possible, and safe to rerun without leaking secrets.

This playbook focuses on the WarpOS AI-provider tier system. Product providers such as Stripe, Clerk, Supabase, Vercel, PostHog, and Resend should also be tracked in `FOUNDERS_CHECKLIST.md` and the product guides.

## Preconditions

- Read the current task, `TRACKER.md`, and any linked epic or sprint tracker.
- Confirm whether the target is WarpOS provider readiness or product-provider launch setup.
- Never print, commit, or paste secret values. Provider checks may report key names and sources, not secret contents.
- Confirm whether changing provider tier config is authorized. `provider-tier-check.js` config writes are confirm-class actions through `--set-tier` or `--write`.
- Do not run paid probes or API calls solely to infer subscription tier.

## Ordered Steps

1. Establish the required tier.
   - Read the mode or task that depends on provider readiness.
   - Use T1 for reachable CLI/auth, T2 for funded/keyed work, and T3 for subscription-floor work.
   - If no tier is stated, use the framework default and record that no raised floor was requested.

2. Run quick health first.
   - Skill: `/warp:health`.
   - Direct checks: `node scripts/checks/dispatch-readiness.js` and `node scripts/warpos/provider-health-check.js`.
   - Resolve missing CLIs, missing auth, ghost models, and invalid effort/model combinations before tier work.

3. Run the tier check.
   - Command: `node scripts/warpos/provider-tier-check.js`.
   - JSON evidence when needed: `node scripts/warpos/provider-tier-check.js --json`.
   - Enforcement only when explicitly intended: `node scripts/warpos/provider-tier-check.js --enforce`.

4. Interpret provider-tier verdicts.
   - `tier_met`: provider meets the selected tier.
   - `tier_short`: provider is below the selected tier on a value-free detectable dimension.
   - `unknown-self-attested`: selected tier requires a subscription signal that cannot be value-free detected; self-attestation or an approved billing probe is needed.

5. Remediate without secrets.
   - For missing CLI/auth, install or login through the provider's official CLI flow.
   - For T2, ensure the relevant API key name exists in the local environment or a paid OAuth login is active.
   - For T3, self-attest the subscription tier only when the operator confirms the subscription.
   - Do not infer tier by making paid model calls.

6. Change preferred-tier config only with approval.
   - Confirm-class write: `node scripts/warpos/provider-tier-check.js --set-tier <provider> <tier> [--floor <sub>] [--sub <sub>]`.
   - The config path is runtime/local (`paths.providerTierConfig`), not source.
   - Record only labels such as provider, selected tier, floor, and verdict.

7. Re-run and record evidence.
   - Re-run `/warp:health` or `node scripts/warpos/provider-tier-check.js --json`.
   - Record the value-free verdicts in the active tracker or log.
   - If the provider remains short, name the exact missing action and stop before dispatching work that depends on it.

## Gates That Must Pass

- No secret value is printed, committed, or copied into docs.
- The readiness check runs without runner error.
- Any config write was explicitly approved in-session.
- A `tier_short` provider is either remediated, accepted by lowering the selected tier with approval, or treated as a blocker.
- `unknown-self-attested` is not misreported as green; it is recorded as unknown until self-attested or probed through an approved value-free path.
- No paid call is used as a subscription detector.

## Definition of Done

- The required provider tier is named.
- The provider-tier check has current evidence.
- Every provider verdict is recorded as met, short, or unknown-self-attested.
- Any remediation is complete or assigned as a visible next action.
- Runtime provider-tier config changes, if any, were explicitly approved and kept out of source.

## Rollback

- If a provider-tier config write was wrong, rerun `provider-tier-check.js --set-tier` with the prior label after approval, or remove the runtime config and fall back to framework defaults.
- If a secret was exposed, stop and rotate the affected credential before continuing.
- If provider readiness was overstated, update the tracker to blocked or active with the missing provider action as the next step.
- If paid probing was started accidentally, stop the probe path and record the spend/risk in the active log.
