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
via `dispatch-agent.js`). A gpt/agy lane resolved in-process is a contract violation (a silent Claude
clone masquerading as cross-provider diversity) — refused before merge. An agy/gpt lane can never assert
the claude-hunter exemption because its provider is not claude.

### Two-tier CLAUDE lane contract (SR-015, α-ruled 2026-07-18 — amends ADR-0016)

The `claude` lane's contract differs by profile — the shape is NOT uniform:

- **`panel-2family` FLOOR → `subprocess-claude` (channel `subprocess`, role `security-reviewer`).** The
  degraded interim floor accepts a subprocess Claude security review. RATIONALE (α): the hunter's
  adversarial semantics come from the security-reviewer SPEC, which a subprocess-claude lane runs
  identically; the in-process shape was ADR-0016's answer to the provider-pin↔Agent-tool collision, NOT a
  stronger review capability. A subprocess Claude review is a REAL Claude review — 2-family diversity is
  intact and the observed-provider attestation verifies it genuinely ran on Claude. Crucially, the panel
  RUNNER (`dispatch-review.js`, a node script) can self-complete the floor without a conductor; requiring
  the in-process hunter would couple the floor to conductor presence (ED-041: only the top-level
  orchestrator can summon an in-process agent), re-creating the hollow-gate class (a floor that can't
  self-complete degrades to skipped-or-faked). The gate records `contract:"panel-2family-floor"`,
  `claude_channel:"subprocess"` — honest labeling, no ambiguity about what passed.
- **`panel-3lab` BINDING → `in-process-agent` + the sanctioned `security_claude_hunter` IDENTITY (ADR-0016
  hunter, third_pass opus@max), POSITIVE-identity-scoped: lane `claude` AND provider `claude` AND role/
  `sanctioned_lane_id === security_claude_hunter`.** A `subprocess-claude` record can NEVER satisfy the
  binding hunter lane — identity is shape + role, not a settable label (a subprocess record claiming the
  hunter role is refused on the shape mismatch). The binding evaluation records `claude_channel:"in-process-hunter"`.

**Reversion linkage (condition 4):** the two-tier split exists ONLY because the third lab (agy) is down
(ED-060) and the floor is the operative interim. When agy goes LIVE and `panel-3lab` becomes the binding
exit, the binding evaluation REQUIRES the in-process hunter for its claude lane — the floor's
subprocess-claude does not satisfy it. This re-binding is enforced by construction (the binding profile
always evaluates the hunter contract) and is linked to the ED-060 sunset: resolving ED-060 activates the
binding path, which demands the hunter. It cannot be silently forgotten.

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
