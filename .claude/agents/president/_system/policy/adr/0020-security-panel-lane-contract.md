# ADR 0020 — Security Panel Lane Contract (panel-3lab / panel-2family)

**Date:** 2026-07-18
**Status:** accepted
**Class:** B (architectural + security impact)
**Sprint:** SP-20260718-003 (Phase 1 — routing + security truth) · **Traces:** R-6, R-7, R-10 · AC-16
**Machine-readable form:** `.claude/agents/_org/panel-lane-manifest.json` (this ADR is the normative narrative; the manifest is the enforced view — `scripts/dispatch/panel-lanes.js#validatePanelManifest` fail-closes on any drift between them and the single sources).

---

## Decision

The security review is a THREE-LAB PANEL with a machine-readable lane contract. Each lane is a
`{provider, tool_id, shape}` identity DERIVED from `passesOf('security-reviewer')` (the role-registry
keystone) + `providerToolId()` — never a 4th source. Two profiles govern which lanes are demanded:

- **`panel-3lab`** — the BINDING Phase-1 exit. `required: [gpt, claude, agy]`, `optional: []`,
  `min_families: 2`. Every required lane must be alive, clean, and ATTESTED on its contracted provider
  (fallback:false, observed provider === contracted provider) with ≥2 distinct OBSERVED provider
  families. A down required lane resolves BLOCKED, never GREEN.
- **`panel-2family`** — the NON-binding degraded floor. `required: [gpt, claude]`, `optional: [agy]`,
  `min_families: 2`. Buildable work and the framework's own meta-gauntlet run here while agy liveness
  is operator-owned. Passing `panel-2family` does NOT satisfy the binding `panel-3lab` exit.

### Lane semantics — the six contract fields (value-defining, AC-16)

- **`required`** — the lanes a profile DEMANDS: `panel-3lab.required = [gpt, claude, agy]`;
  `panel-2family.required = [gpt, claude]`. A required lane absent/coerced/refused → BLOCKED.
- **`optional`** — a lane a profile TOLERATES absent: `panel-2family.optional = [agy]`. An optional
  lane never blocks; if it runs, it counts toward diversity, but its absence is not a finding.
- **`fallback`** — the CROSS-FAMILY provider a lane retries on when its lab quota-fails:
  the `agy` lane's `fallback = openai` (antigravity is google-family, so it retries on the GPT lab, not
  another google endpoint). A fallback dispatch stamps `fallback:true` and does NOT attest the lane.
- **`sunset`** — the DATED operator deadline for a contracted-but-down lane: `sunset.ref = ED-060`,
  `sunset.lane = agy`, `sunset.date = 2026-10-16`. Enforced by `scripts/checks/ed060-sunset.js`
  (/scan:full non-zero once the date passes unresolved). Resolving ED-060 (agy live) makes it moot.
- **`panel-2family`** — the degraded floor profile (above): `binding: false`, agy optional. The honest
  interim while the third lab is not live; never claimed as the binding exit.
- **`panel-3lab`** — the binding exit profile (above): `binding: true`, agy required. The Phase-1
  security-truth bar; a missing agy lane → `BLOCKED-ON-OPERATOR`, never a silent pass.

### Shape rule (the CLI-only tooth)

The cross-provider labs (`gpt`, `agy`) MUST run as CLI subprocesses (`subprocess-cross-provider`,
via `dispatch-agent.js`). The `claude` lane is the ONE sanctioned in-process lane (`in-process-agent`
— the ADR-0016 hunter, third_pass opus@max), POSITIVE-identity-scoped: lane `claude` AND provider
`claude`. A gpt/agy lane resolved in-process is a contract violation (a silent Claude clone
masquerading as cross-provider diversity) — refused before merge. An agy/gpt lane can never assert the
claude-hunter exemption because its provider is not claude.

## Context

Phase 1's core property is NO false-green in the security surface. The sharpest false-green is the
all-Claude masquerade: if both cross-provider labs silently resolve to Claude (the ED-208 Agent-tool
channel coercion, or a quota fallback), a "3-lab" panel is really one lab wearing three labels. The
lane contract + the observed-provider diversity count (β rider #1) + same-run attestation (D8) close
this: a lane counts toward diversity IFF it ran on its contracted provider with fallback:false.

The agy (Antigravity) lab is contracted but not live — the individual gemini CLI is sunset (ED-060),
and no Antigravity account/tier is provisioned yet. Rather than drop the third lab or fake it green,
the contract makes the absence HONEST: `panel-3lab` is BLOCKED-ON-OPERATOR until one real agy
`fallback:false` record exists, while `panel-2family` keeps buildable work moving.

## Consequences

- Adding/renaming a lab is a role-registry edit; the manifest is validated against it (no drift).
- The binding Phase-1 exit cannot be reported GREEN while agy is down — it is BLOCKED-ON-OPERATOR.
- The meta-gauntlet for THIS sprint runs on `panel-2family` (2-family: GPT + Claude) — we do not
  self-contradict by claiming 3-lab for our own review.

## Enforcer

`scripts/dispatch/panel-lanes.js#validatePanelManifest` (single-source drift, fail-closed) +
`panel-lanes.js#panelStatus` (the fail-closed reducer) + `panel-lanes.js#assertCliOnlyPanel` (the
CLI-only tooth) + `scripts/checks/cert-attest.js#attestPanelRun` (same-run attestation) +
`scripts/checks/ed060-sunset.js` (the dated sunset). Tests: `panel-lanes.test.js`,
`panel-status.test.js`, `cert-attest-panel.test.js`, `ed060-sunset.test.js`.
