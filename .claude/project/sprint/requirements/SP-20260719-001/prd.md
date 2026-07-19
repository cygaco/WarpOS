# PRD — SP-20260719-001: agy id-mapping reconciliation → real serve record (ED-060) → honest panel-3lab (ED-230)

## Problem

The Antigravity (`agy`) CLI is the contracted Gemini lab of the security panel-3lab
(role-registry `security-reviewer.primary` = `antigravity` / `gemini-3.1-pro-high`). Every
WarpOS surface — role-registry, `scripts/dispatch/catalog.js`, `.claude/kernel/support-matrix.json`,
`.claude/agents/_org/panel-lane-manifest.json`, `scripts/hooks/lib/providers.js` — pins the
**canonical slug** `gemini-3.1-pro-high`. But the live `agy` CLI does **not** resolve that slug:

```
agy --model gemini-3.1-pro-high …
I…] Model ID gemini-3.1-pro-high not in local config, defaulting to CCPA
I…] Model resolved via default
```

`agy --model` expects the **display name** `Gemini 3.1 Pro (High)` (spaces + parens + capital H).
The genuine 2026-07-19 attestation (`runtime/cert-attest/gemini-3.1-pro-(high)-2026-07-19T07-18-13-003Z.json`)
was obtained by passing the display name **by hand** at the CLI. The dispatch code path
(`providers.js#buildProviderArgv` antigravity branch; `cert-attest.js#probeShape` antigravity branch)
still passes the raw slug — so **a real security-reviewer dispatch today would silently serve the
account DEFAULT (CCPA), not the contracted Gemini model.** The `catalog.js` header comment
(line ~248) even documents the *wrong* fact — it claims the kebab slug is the working `--model` id.

Because agy has never produced a real authenticated `fallback:false` serve of the contracted model:
- `support-matrix.json` agy-antigravity = `status:down / proven:false` (evidence_ref ED-060).
- panel-lane-manifest binding `panel-3lab` is BLOCKED-ON-OPERATOR.
- `attestPanelRun` (ED-230) checks only "lane ran on the contracted provider," **not** "the
  contracted model actually served" — the served-model proof is not yet wired into the panel gate.

## Goal

Make a real security-reviewer dispatch through agy serve the **contracted** model, produce **durable
proof** of that serve, close **ED-060**, and wire the served-model proof so **panel-3lab** can go
binding-green **honestly** (ED-230) — never a false-green.

## Scope

### (a) Slug→display id-mapping at the agy dispatch boundary  [BUILD, always in scope]
- Single-source the translation `gemini-3.1-pro-high` → `Gemini 3.1 Pro (High)` in the **catalog**
  (the ANTIGRAVITY model entry gets an explicit agy display-name field), exposed by one resolver.
- Wire the resolver into **both** agy `--model` call sites — `providers.js#buildProviderArgv`
  (antigravity) and `cert-attest.js#probeShape` (antigravity) — so no raw slug reaches `agy --model`.
  (Lib-only-fix-with-bypassing-caller is the recurring bug class; both boundaries must translate.)
- **Registry / support-matrix / panel-lane-manifest keep the canonical slug** — they are the source
  of truth; the adapter translates at the edge.
- Fix the stale `catalog.js` comment that claims the kebab slug is the working `--model` id.
- Test: slug-in → display-out at every agy `--model` boundary; assert no raw slug can reach agy.

### (b) One real agy serve → ED-060 close evidence  [DISPATCH, gated on live auth]
- Precondition (verified empirically THIS session, never inherited): the operator's Antigravity
  keyring auth is live. If not → BLOCKED-ON-OPERATOR (ship (a) alone, ED-060 stays open, surface loudly).
- Fire ONE real agy dispatch through the fixed adapter: `fallback:false`, contracted model
  `gemini-3.1-pro-high` actually served (proof = the `Propagating selected model override to
  backend: label="Gemini 3.1 Pro (High)"` serve-evidence line + cert-attest GATE-1/GATE-2 attested).
- Durable evidence = the **committed** cert-attest artifact (`runtime/cert-attest/` is tracked;
  `dispatch-completions.jsonl` is gitignored, so the ledger record is same-session liveness only).

### (c) Honest panel-3lab activation  [ACTIVATE, gated on (b)]
- ONLY after (b)'s real record exists: flip `support-matrix.json` agy-antigravity
  `down → supported/proven` with the new evidence_ref (cert-attest artifact + ledger id).
- Wire the served-model proof into `attestPanelRun` so the panel-3lab binding exit requires the
  agy lane to have **served the contracted model**, not merely run (ED-230).
- Never flip early: a `down` REQUIRED lane resolves BLOCKED, never a silent pass.

## Record-Trust Gate (design-phase, BLOCKING — per `.claude/project/reference/record-trust-gate.md`)

Reader trusts a record to gate an irreversible action (the support-matrix flip / ED-060 close /
panel-3lab binding). Applied:
- **Choke-point:** served-model proof = `cert-attest#evaluateAttestation` (GATE-1 unauth/default/eval
  signal fail-closed + GATE-2 positive served-marker); ledger-record trust = `cert-attest#attestLane`
  with `attest-signing#verifyRecord` origin-proof. No new un-routed reader may flip the lane.
- **Session partition:** SAME-SESSION (my live probe → HMAC-signed ledger record, attestPanelRun
  same-run correlation). CROSS-SESSION (a later reader trusting my committed flip): trusts the
  **committed cert-attest artifact content** (its `cli_output_sha256` witnesses the raw authenticated
  agy log), NOT a per-session signature (per-session HMAC can't verify another session — the R3
  cross-session false-RED).
- **Falsifier fixtures (required-present, fail-closed):** (i) an unauthenticated agy log (defaulting
  to CCPA, NO auth line) must FAIL attestation; (ii) a forged/unsigned ledger record claiming agy
  served must NOT attest; (iii) a request-echo (id echoed, not served) must fail-closed. The
  support-matrix flip must be un-greenable without a real served-model artifact.

## Out of scope
- Operator Antigravity login (operator-owned; if dead, (b)/(c) block).
- lane-1 surfaces (`scripts/dispatch/*`, SP-005) — coordinate any genuine overlap through the lead.
- Strict shipping-manifest regen (ED-226: blocked by kernel classification debt; per-sprint gate = non-strict validate).

## Non-negotiables
- Verify agy liveness EMPIRICALLY before any flip; never claim liveness from transport/config-echo.
- The gauntlet's cross-provider verdicts are binding; ε does not override a FAIL.
