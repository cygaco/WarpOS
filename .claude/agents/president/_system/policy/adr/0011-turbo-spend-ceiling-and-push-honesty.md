# ADR 0011 — Turbo spend ceiling is source-vs-instance; push-to-main level is pinned to confirm

**Date:** 2026-06-10
**Status:** accepted
**Class:** B (security / autonomy-boundary impact)

---

## Decision

In the turbo session layer (S-LC-07, E-LIFECYCLE-001 Wave 2): (1) the **spend ceiling is resolved, never hardcoded** — `resolveCeiling()` reads an operator-raised runtime override from `authorization.json#spend_ceiling_usd` when present, finite, and `> 0`, and otherwise falls back to the framework **default of $100**; the per-session instance value (e.g. $500) is never written into framework code. (2) The turbo permission profile **pins `push-to-main` to permission level `confirm`** and `validateProfile()` REJECTS any profile that sets it to `auto`/`notice` — encoding the proven invariant that the harness auto-mode classifier sits ABOVE `permissions.allow`, so push-to-main is always a per-action operator decision (P-061).

## Context

The session granted "$500 ceiling, pushes approved" but two structural traps recur:

- **Instance value leaking into framework code.** Hardcoding "$500" anywhere in `scripts/turbo/**` would fork the framework to one session's authorization (the same source-vs-generated / source-vs-instance class as P-058). The ceiling is operator state, not framework state.
- **The "pushes approved" illusion.** Proven 2026-06-09 (L-2026-06-09-classifier-above-permissions-allow): even a durable `Bash(git push *)` allow-rule or an active `push-to-main` turbo scope does NOT make a push classifier-immune — the auto-mode classifier still demands per-action intent. A turbo profile that *advertised* push-to-main as `auto` would be lying to the operator about what turbo actually grants.

S-LC-07 builds the spend-ledger (`spend-ledger.js`), the permission-profile (`permission-profile.js`), the classifier-preflight (`classifier-preflight.js`), and the `/scan:turbo-spend` consumer. The ceiling resolution and the push-level pin are the two load-bearing autonomy-boundary decisions in that set, so they get an ADR.

## Options considered

1. **Option A — resolve ceiling from authorization.json + framework default; pin push to confirm (CHOSEN).** Instance value stays in operator state; framework code is session-agnostic; the profile tells the truth about push.
2. **Option B — hardcode the active ceiling ($500) in the turbo config.** Simple to read, but forks framework code to one session and rots the instant the operator changes the grant.
3. **Option C — let the profile set push-to-main to `auto` when the operator says "pushes approved".** Matches the words of the grant, but is a false promise — the classifier overrides it, so the profile would mislead.

## Decision criteria

| Criterion | A (resolve + pin) | B (hardcode) | C (auto-push) |
|---|---|---|---|
| Honesty (no false grant) | high | medium | low |
| Source-vs-instance hygiene | high | low | high |
| Simplicity | medium | high | medium |
| Reliability (ceiling actually binds) | high | medium | low |
| Reversibility | high | high | medium |

## Why this option won

A wins on the two criteria that matter for an autonomy boundary: **honesty** and **source-vs-instance hygiene**. B fails hygiene (P-058 class — instance value in framework code) and C fails honesty (advertises a grant the classifier will refuse, P-061). The simplicity edge of B does not justify forking framework code to a single session's dollar figure. The resolver keeps the framework default ($100) as the safe floor and only widens when the operator has explicitly written the override — fail-safe by construction.

## Risks

1. **A spoofed completion record could defeat the ceiling check.** If a record drives the running spend total to `NaN` (e.g. a `model` value that resolves to a prototype member, bypassing the price table) or pushes it DOWN (negative `prompt_bytes`), then `spent >= ceiling` silently never trips and the ceiling becomes decorative. (Found by the S-LC-07 qa gauntlet lane.)
2. **Report-only ramp.** The ledger is report-only by default; an operator who ignores the report still over-spends. The ceiling informs, it does not yet block.
3. **authorization.json tampering.** A malformed/forged override could attempt to raise the ceiling.

## Mitigations

1. **Spoof-resistance hardening (folded into S-LC-07 post-gauntlet):** `estimateRecordCost()` matches `model` only via `Object.hasOwn(PRICE_TABLE, model)` (prototype keys fall through to `_default`), and clamps both byte counts to non-negative finite integers (`Math.max(0, Number(x)||0)`, `Infinity`→0). Regression tests assert `model:"constructor"/"hasOwnProperty"/"__proto__"` → finite usd and negative bytes → clamped, so the total stays finite and monotonic non-decreasing. Enforcer: `tests/regression/S-LC-07/spend-ledger.test.js`.
2. **§22#4 operator sign-off gates the flip from report-only to blocking** — the ramp is deliberate and visible, not silent.
3. `resolveCeiling()` accepts an override only when it is `typeof === "number"`, `Number.isFinite`, and `> 0`; anything else falls back to the $100 framework default — a forged/garbage override fails safe DOWN, never up.

## Reversal plan

Each half is independently reversible. The ceiling resolution is a single function (`resolveCeiling`) — changing the default or the override source is a one-file edit. The push-to-main pin is one `validateProfile()` rule + one profile constant; if the harness classifier behavior ever changed such that `permissions.allow` became authoritative for push, relax the pin and update P-061. Signal to revisit: a harness release that moves push authorization below `permissions.allow`.

## References

- Related: ADR-0008 (dispatch consumers derive from registry — same source-of-truth discipline), the S-LC-06 dispatch-contract mode_profiles (sibling Wave 2 narrowing-only permission surface).
- Learnings: L-2026-06-09-classifier-above-permissions-allow (P-061), P-058 (source-vs-generated/instance).
- Implementation: S-LC-07 worktree `s-lc-07-turbo` — `scripts/turbo/spend-ledger.js`, `permission-profile.js`, `classifier-preflight.js`, `scripts/checks/turbo-spend.js`, `.claude/commands/scan/turbo-spend.md`; spoof-fix commit folded post-gauntlet.
- Epic: E-LIFECYCLE-001 (mode-lifecycle enforcement), Wave 2.
