---
description: The meta-lockstep enforcer (SP-20260720-003 D1) — couples a scan's cross-provider SCOPE FILTER to the class_derivation rule-table, so broadening one without the paired rule is self-detecting. Closes the 9db78fa3 gap (role-parity-scan's filter gained "antigravity" without the paired {tier:lead,provider:antigravity} rule; only a GPT cross-check caught it). Report-only in /scan:full (ramp to blocking after one clean cycle).
---

# /scan:meta-lockstep — Scope-filter ↔ class_derivation lockstep (SP-20260720-003 D1)

The structural coupling between a scan's cross-provider **scope filter** and the **class_derivation
rule-table**. It exists because the gemini deep-clean broadened `role-parity-scan.js`'s shape-route
filter to include `antigravity` (now the shared `CROSS_PROVIDER_SCOPE` export) **without** adding the
paired `{tier:lead, provider:antigravity}` rule — so `research-lead` fell to the Claude catch-all and
tripped a role-parity RED that only an independent GPT cross-check caught. Nothing STRUCTURALLY
coupled the two. This does.

## What it does

Runs `node scripts/checks/meta-lockstep.js` (`--json` for machine output). It imports the SAME
`CROSS_PROVIDER_SCOPE` symbol the filter reads and REUSES `role-parity-scan.js`'s `deriveClass` (one
source, two consumers — no reimplementation, no drift). It asserts **symmetry of cross-provider-routing
rules across the in-scope providers**: for each `(tier|kind)=value` key that ANY in-scope provider
routes to a `subprocess-cross-provider` class via a provider-pinned rule, EVERY in-scope provider must
route it cross-provider too — UNLESS

- **excused** — no LIVE registry role of that `(tier|kind=value, provider)` exists, OR
- **waived** — the `(dimension, value, provider)` triple is on the frozen NARROWEST waiver baseline.

The baseline waiver carries exactly `{tier:director, provider:antigravity}` (ADR-0031 β-deferral: no
live antigravity director; role-parity self-detects the gap at introduction — the rule is NOT re-added).
Waiver integrity is itself enforced (β riders): a non-narrowest entry, a why-less entry, or a waiver
**widened** beyond the frozen baseline is a finding. And an AC-4 source-coupling teeth: a re-inlined
provider literal at the `role-parity-scan` filter (dropping the shared constant) is flagged.

Findings name the broken invariant, the offending `(dimension, value, provider)`, and the fix (add the
paired rule OR a narrowest-form documented waiver).

**Exit:** 0 clean · 1 findings · 2 fail-closed (unreadable/unparseable registry or contract).
**Wired REPORT-ONLY** in `/scan:full` — DoE flagged the novel symmetry algorithm can over-fire; the
flip-to-blocking is the ramp tail after one clean cycle (tracked as an enforcement-debt entry so the
report-only state is self-terminating, not a hollow rung — AC-17).

Bite-test: `node scripts/checks/meta-lockstep.test.js` (14 assertions incl. the asymmetry-reason
de-aliasing, a role-parity-green-yet-symmetry-violated case proving independent teeth, director
excused+waived, scope-constant-is-read, and the three waiver-integrity negatives).

## When to run

After any edit to `role-parity-scan.js`'s `CROSS_PROVIDER_SCOPE`, `dispatch-contract.json`'s
`class_derivation` rules, or the introduction of a new cross-provider role/provider. Part of `/scan:full`.
