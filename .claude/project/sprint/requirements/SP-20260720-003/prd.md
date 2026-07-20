# PRD — SP-20260720-003 (parallel hardening sprint, Epsilon2)

Plan-phase output. Scope is α-prescribed (work order 2026-07-20) + grounded in the ED/RI/ADR
ledger; product-strategy sequencing came from the President's own directive (recorded here rather
than re-derived via a plan-phase strategy consult — the load-bearing roster authoring happens at
design). Composition: unit_types [backend, security], max_risk medium, no UI, no marketing/copy.

## Problem

Three coupled gaps surfaced by the 2026-07-20 gemini deep-clean GPT cross-check, all in the
scan/enforcer layer, all currently holding only by luck (agy blocked-advisory):

- **G-META (item i):** a scan's scope filter can be broadened (e.g. role-parity-scan's shape-route
  check gained `antigravity`) WITHOUT the paired `class_derivation` rule-table update in the same
  change. This is what happened at 9db78fa3 — research-lead (the sole `{tier:lead,provider:antigravity}`
  role) fell to the Claude catch-all and tripped a role-parity RED; only the independent GPT
  cross-check caught the missing rule. Nothing structurally couples the scope filter to the rule table.
- **G-BIND (item ii, = ED-244):** ADR-0031 point-2 requires the security-reviewer/redteam BINDING
  default to resolve to the verifiable openai floor (never antigravity) while ED-230 (served-model
  proof) is open. There is NO enforcer of this; the role-registry provider derivation resolves
  security-reviewer to antigravity in both catalog.js and providers.js. Holds in practice ONLY because
  agy is blocked-advisory. The debt is the absent enforcer, not a live break.
- **G-ALIAS (item iii, = RI-008):** `catalog.DEFAULT_PROVIDER_PER_ROLE.redteam=openai` but
  `providers.getProviderForRole(redteam)=antigravity` (the alias normalizes to security-reviewer →
  registry antigravity). model-chain.js block-G's drift check iterates registry role NAMES only, so
  the `redteam` alias key is never checked — a real catalog↔providers split that scan:model-chain is
  GREEN over.

## Deliverables

### D1 — scan:meta-lockstep (NEW: scripts/checks/meta-lockstep.js + .md + .test.js + fixtures)
A change-time coupling enforcer. Invariant: across the providers a scan's shape-route SCOPE FILTER
walks (openai, antigravity for role-parity-scan), the `class_derivation` rule-table must cover the
SAME (tier/kind) rule-set for each in-scope provider — MODULO an explicit, documented WAIVER list.
- Catches 9db78fa3 (antigravity missing the `{tier:lead}` rule that openai had) BEFORE it manifests
  as a downstream role-parity RED.
- The waiver list CONTAINS `{tier:director, provider:antigravity}` — HARD CONSTRAINT 1: do NOT re-add
  the rule β deferred; the waiver documents the deferral explicitly (self-detecting: a future live
  antigravity director is a separate signal handled by role-parity + waiver-review).
- Bite-testable via injected reg/contract stubs (mirrors role-parity-scan's existing seam).
- Required-present NEGATIVE fixture: a scope filter broadened without the paired rule + not on the
  waiver list → RED (the falsifier proves the enforcer has teeth).

### D2 — scan:security-binding-lane (NEW: scripts/checks/security-binding-lane.js + .md + .test.js + fixtures)
Two teeth, one file (both are the security-default-provider concern):
- **Tooth A (ED-244):** the security-reviewer/redteam BINDING default resolves to a verifiable
  provider (openai|claude), never antigravity, GATED on ED-230 status:"open" in enforcement-debt.jsonl
  (auto-relaxes when ED-230 closes). "Binding default" semantics = the pass whose verdict actually
  gates; the antigravity PRIMARY is non-binding while it cannot serve, so the check asserts a
  verifiable binding pass exists and no antigravity pass is treated as binding. (Exact pass-semantics
  = design-phase DoE consult.)
- **Tooth B (RI-008):** DEFAULT_PROVIDER_PER_ROLE consistency INCLUDING alias keys (redteam), closing
  the model-chain registry-name-only coverage gap.
- Required-present NEGATIVE fixtures: (A) binding default = antigravity while ED-230 open → RED;
  (B) an alias key disagreeing with its normalized role's provider → RED.

### D3 — ED-244/RI-008 reconciliation
Folded into D2 tooth-B as the coverage extension. PREFER asserting-the-invariant over MUTATING
catalog.js/providers.js (ED-244's own discriminator: the invariant holds; the debt is the enforcer).
If the design-phase DoE consult concludes a SOURCE value must change, that exact diff routes through
α before any write (dispatch-contract.json is on HOLD regardless).

## Acceptance framing (refined into AC at design)

- A1: meta-lockstep FLAGS the pre-9db78fa3 asymmetry (fixture) and is GREEN on current HEAD.
- A2: meta-lockstep does NOT flag the deferred `{tier:director,provider:antigravity}` (waiver honored).
- A3: security-binding-lane RED on the antigravity-binding fixture while ED-230 open; relaxes when the
  ED-230 gate reads closed (fixture).
- A4: security-binding-lane tooth-B catches the redteam catalog↔providers alias split (fixture) and is
  GREEN once consistent.
- A5: both scans registered in scan:full (own rows) + pass scan-coverage self-inventory.
- A6: every new policy names its enforcer (the scans ARE the enforcers); ED-244 + RI-008 updated to
  reference their new enforcer at close.

## Constraints
- Isolated worktree conduct off main @270b85dc (canonical belongs to Epsilon/Phase 4 — never switch it).
- ED-016: dispatch completion records land in the WORKTREE's .claude/runtime — verify there.
- Ownership: model-chain/catalog/providers/role-parity-scan mine this window; scan/full.md +
  scan-coverage.js add-only-own-rows; dispatch-contract.json HOLD (diff-through-α); new files free.
- β at plan→design, design→build (front-loaded design-lock), gauntlet→release, release→retro — to the
  PERSISTENT Beta teammate (ED-239: an in-process β spawn never satisfies the gate).
- I do NOT merge or push — hand the merge to α (holds the mutex).
