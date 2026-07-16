---
description: The named enforcer (ED-058) for the role-registry model/effort CHAIN. Since DISPATCH.md (2026-07-12, ADR-0016) it enforces the old∪new SUPERSET (Bucket-A widen): alpha ∈ {opus-4-8@max, fable-5@high}, doers ∈ {opus, sonnet-5}, max ∈ {alpha, security-reviewer}, ultra ∈ {gpt-5.6 sol/terra}, every role a scaled model+effort, live consumers resolve to the registry's provider+effort. Report-only in /scan:full.
---

# /scan:model-chain — Role-registry model/effort chain integrity (ED-058)

The model-chain HOME. Since **DISPATCH.md 2026-07-12 (ADR-0016)** superseded the 2026-06-16
no-fable/opus-top/max-alpha-only directive, this enforcer is in its **Bucket-A WIDEN** stage: it
accepts the **old∪new SUPERSET** so both the current opus roster AND a future fable-top roster pass,
while keeping every tooth. The restrictive positive-pins (President=fable-5, builders=sonnet-5) land
ATOMIC with the Bucket-D flip (the enforcer then NARROWS to the new policy). The supersession +
reversal is recorded in ADR-0016; the stale memory `feedback_model_opus48max_not_fable` is flagged
for update. A silent registry↔consumer drift would still run a role on the wrong model — the drift
detector is unchanged.

This is **not** a duplicate of `/scan:role-parity` (which owns registry-INTERNAL consistency:
model-in-catalog, dispatch-graph, reporting-line, spec model-pin). model-chain adds what role-parity
does not cover.

## What it does

Runs `node scripts/checks/model-chain.js` (`--json` for machine output). Reads
`.claude/agents/_org/role-registry.json` (the SoT) and the live consumer maps via `require()`
(`scripts/dispatch/catalog.js` `DEFAULT_PROVIDER_PER_ROLE`/`DEFAULT_EFFORT_PER_ROLE` +
`scripts/hooks/lib/providers.js` `DEFAULT_AGENT_PROVIDERS`/`getReasoningEffort`). REJECTS (exit 1)
when ANY:

1. **no-fable** — any role's `model`/`second_pass.model` or `model_policy.*.model` references a
   fable model. (Scans MODEL fields ONLY, never prose — a `_doc`/`_note` mentioning fable to reject
   it does not trip the rule.)
2. **alpha positive-pin** — `alpha.model` ≠ `claude-opus-4-8` or `alpha.effort` ≠ `max` (role-parity
   only checks the negative "max only on alpha"; a downgraded alpha would pass silently otherwise).
3. **top-model** — `model_policy.doers.model` ≠ the shipped top.
4. **completeness / validity** — a role missing `model`, missing an `effort` key, or carrying an
   invalid effort level. `effort:null` is allowed only for `skeleton-builder` and gemini roles.
5. **max-only-alpha** — any non-alpha role at `max` (positive policy home; mirrors role-parity for a
   CRITICAL invariant).
6. **[DRIFT]** — catalog/providers resolve a role to a DIFFERENT provider or effort than the
   registry declares (the live drift detector — catches stale `DEFAULT_REASONING_EFFORT` literals).

**Fail-closed** (exit 2) on an unreadable/unparseable registry or internal error — a chain check
must never read green on its own corruption. **Wired REPORT-ONLY** in `/scan:full` (it surfaces
findings alongside `/scan:role-parity`; the flip-to-blocking is the ramp tail once the chain has
held drift-free).

Bite-test: `node scripts/checks/model-chain.test.js` (19 planted-violation assertions incl. the
no-fable false-positive guard + a live-registry integration pass).

## When to run

After any edit to `role-registry.json` model/effort fields, `catalog.js`/`providers.js` role maps,
or a model-catalog refresh. Part of `/scan:full`.
