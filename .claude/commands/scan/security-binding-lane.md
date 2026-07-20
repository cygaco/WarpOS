---
description: The security-binding-lane enforcer (SP-20260720-003 D2) — closes ED-244 (the security BINDING verdict must resolve to a verifiable provider, never agy, while ED-230 is open) + RI-008 (catalog↔providers alias-inclusive DEFAULT_PROVIDER consistency). Blocking in /scan:full.
---

# /scan:security-binding-lane — Security binding verdict stays verifiable (SP-20260720-003 D2)

The named enforcer for **ED-244** + **RI-008**. ADR-0031 point-2 requires the security-reviewer/redteam
**binding verdict** to resolve to a VERIFIABLE provider (openai|claude), never the unverifiable `agy`
lane, while **ED-230** (served-model proof) is open. The invariant held only because agy is
blocked-advisory — there was no enforcer. This is it.

## What it does

Runs `node scripts/checks/security-binding-lane.js` (`--json`). **Two teeth**, reusing the runtime's OWN
functions so the check can't drift from behavior (β + DoE confirmed assert-only closes both — NO source
mutation, which would trip model-chain drift + fight ADR-0031 point-3):

- **Tooth-A (ED-244), enforced WHILE ED-230 is open** — the PANEL BINDING invariant (not
  `DEFAULT_PROVIDER ∈ {openai,claude}`):
  - **P1** `servedModelUnverifiableFromRecord("antigravity") === true` — the choke-point forcing an agy
    record un-attestable → BLOCKED_ON_OPERATOR, never a binding PASS.
  - **P2** the `panel-2family` FLOOR requires ≥2 verifiable families (agy not a required lane; `binding:false`).
  - **P3** `passesOf("security-reviewer")` has ≥1 verifiable (openai|claude) pass — a lane that CAN bind.
- **Tooth-B (RI-008)** — alias-inclusive DEFAULT_PROVIDER consistency (the gap model-chain's
  registry-NAME-only drift loop misses): `catalog-raw[redteam] === providers-raw[redteam]` AND
  `getProviderForRole(redteam) === getProviderForRole(security-reviewer)` (redteam is a 1-hop alias — it
  can never resolve to a divergent provider).

Plus an **AC-14 single-pass creep-back guard**: RED if any non-test, non-panel caller routes
security-reviewer as a single-pass `dispatch-agent` binding dispatch (bypassing dispatch-review's panel
gate). Findings name the invariant, the offending key, and the fix.

### ED-230 record-trust gate (fail-closed + closure-receipt)

The ED-230 open/closed state is read LAST-WRITE-WINS from `paths.enforcementDebt` (the canonical,
repo-global debt ledger — resolved to canonical even from a worktree, which is correct). **Fail-closed:**
an absent/unreadable/empty ledger, no ED-230 record, a malformed record, or a `status:"closed"` WITHOUT a
non-empty closure receipt → **assume OPEN → strict-enforce** (exit 1 on a finding, NOT a suite-crashing
exit 2). Tooth-A relaxes ONLY on the last ED-230 record with `status:"closed"` AND a non-empty
`closure_receipt`/`closed_ts`. Relaxing does NOT authorize agy binding — the panel gate + ED-060 still
govern.

### Known limit (AC-13, documented not fixed)

P1 is **name-specific** — `servedModelUnverifiableFromRecord` keys on `provider === "antigravity"`. A NEW
unverifiable provider, or an agy rename, would pass P1 green while the invariant ("no unverifiable provider
binds") is violated. A regression-lock comment marks the call site. Out of scope here; a property-based
un-verifiability check is the future close.

**Exit:** 0 clean · 1 findings · 2 fail-closed (unparseable INJECTED input only — the CLI never reaches it;
an absent canonical ledger resolves to strict-enforce). **Wired BLOCKING** in `/scan:full` — the invariant
is deterministic + green at HEAD, and it must gate BEFORE the guarded condition (agy unblocking, ED-230/060
closing) goes live.

Bite-test: `node scripts/checks/security-binding-lane.test.js` (22 assertions incl. the ED-230 5-vector
fail-open matrix — receiptless-closed, last-write-ordering, wrong-id, empty/null receipt, absent-record).

## When to run

After any edit to the security-reviewer/redteam provider chain, the panel-2family floor, the
redteam alias, or when ED-230/ED-060 change state. Part of `/scan:full`.
