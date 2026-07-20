# SP-20260718-005 — Phase 3 — QA / Redteam Plan

**Risk:** HIGH. **Irreversible class:** false ACCEPTANCE (a provider `success` authorizing integration) + stale/forged/superseded binding. **Doctrine:** the record-trust gate front-loads the falsifier hunt SP-002/003/004 spent 6 gauntlet rounds discovering; the gauntlet's job here is to CONFIRM the front-loaded falsifiers block + hunt for enumeration gaps, not re-discover the class.

## Functional QA (qa-reviewer scope)
- Traceability: every AC-1..17 has a `verified_by` that EXISTS and is green. A binding AC whose enforcer is absent = FAIL (aspirational-vs-enforced trap).
- The 5 terminal states + the failure_reason CLASSES round-trip through the schema; `model_unavailable` is present (it predicted the harness-spawn bug class).
- ED-069/070 wired in ALL writers (grep the write sites; a writer that bypasses `recordCompletion` re-opens the class — the lib-only-fix-bypassing-caller trap).
- The conformance suite stays green THROUGH the G0.3 binding flip (flip a default only after all-green — the SP-20260627 sweep-in-sprint lesson).

## Redteam / security (security-reviewer scope — cross-provider 2-family)
Every falsifier below MUST block. Route security codex lanes to TERRA (sol dies on security-review prompt shapes); agy DOWN → 2-family, recorded honestly, never claimed as 3-lab.

1. **Forged/unsigned WorkOrder** (AC-F1) — a hand-authored WorkOrder with the right fields but no valid same-session signature → role resolution BLOCKS. (The attest-signing mistake-class: field-only trust is a rubber-stamp.)
2. **Self-asserted-success** (AC-F2) — a ResultEnvelope `success:true` with no trusted AcceptanceRecord → integration NOT authorized.
3. **Stale-base** (AC-F3) — WorkOrder base ≠ integration head after head advanced → merge REFUSED (no check→merge TOCTOU).
4. **Target-mismatch / re-correlation** (AC-F4) — a VALID signed AcceptanceRecord for target A presented to integrate target B → BLOCK. (Closes ED-232's residual at INTEGRATION stakes.)
5. **Superseded-lease** (AC-F5) — a conductor writing under an expired/superseded fencing token → writes REFUSED. (The late-firing-prior-conductor case.)
6. **Non-success-terminal-as-success** (AC-F6) — a partial/blocked/failed WorkOrder whose envelope claims success → AcceptanceRecord does NOT authorize.
7. **Simultaneous-lease-race** (AC-F7) — two sessions O_EXCL the same SP-id at once → exactly one wins, the other gets a clean no-go (not a crash, not a double-hold).
8. **Do-not-reopen advisory-only** (AC-F8) — a resume reverses a settled disposition without an explicit supersession entry → BLOCK.

## Session-scope partition audit (SHARP-1 — the highest-value QA)
Confirm the cross-session artifacts (AcceptanceRecord, lease, do-not-reopen) do NOT depend on the per-session HMAC secret (would re-hit the R3 cross-session false-RED). A cross-session verify path that calls `attest-signing.verifyRecord` on a foreign-session record is a DEFECT. The same-session artifacts (WorkOrder-at-dispatch validators) MAY use HMAC.

## Independence + honesty invariants
- No agent judges work it authored.
- A missing falsifier fixture at design→build exit BLOCKS build-entry (already enforced by `scripts/checks/record-trust-gate.js`).
- The gauntlet-verify telemetry gate (WG-19) runs after the lanes: a required role `no-record` = HALT (GAUNTLET_LANE_NO_DISPATCH_RECORD), never a pass.
- Honest ceiling: the same-UID FS boundary (ADR-0025/ED-232) is named, not claimed solved. An attacker-only-within-the-named-ceiling gap may be dispositioned honestly; a MISTAKE-reachable false-green must close.
