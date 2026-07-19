# ADR 0025 — Attestation ORIGIN-PROOF (per-session HMAC) + the named same-user trust boundary

**Date:** 2026-07-18
**Status:** accepted
**Class:** B (security-mandatory; the architectural close of a confirmed live false-green)
**Sprint:** SP-20260718-003 (Phase 1 — routing + security truth) · ED-231 · gauntlet re-review LIVE-FALSE-GREEN
**Relies on:** ADR-0020 (panel lane contract), ADR-0022 (hunter producer), ADR-0024 (R6 honest-ceiling — its premise is RESTORED here, within the stated boundary)
**α RULING:** hybrid (A per-session HMAC) + (C honesty), 2026-07-18. **β:** DECIDE B/0.92 — reject the trust-boundary-as-ship option, FIX origin-proof, do NOT ship over the false-green; consistent with α.

---

## Context — the confirmed LIVE false-green (gauntlet-caught, reproduced)

`cert-attest.attestLane/attestPanelRun` validated record FIELDS (shape/role/provider/tool_id/panel_run_id/
code_sha/evidence_sha/cmdline_checksum) but NEVER proved WRITER ORIGIN nor validated a digest against a real
artifact. Reproduced at HEAD: a COMPLETE hand-authored set of forged ledger records — never written by any
trusted wrapper, just crafted JSON with the right fields — attests `panel-3lab ok:true`. A field-only attestor
is a rubber-stamp of whatever is in the file. This REFUTED ADR-0024's R6 honest-ceiling premise ("the live
evidence layer is the real protection").

**Threat-model cut (α, load-bearing):** record forgery is NOT attacker-only here. This company has a demonstrated
mistake-class precedent (the 2026-06 faked-ε-dispatch: plausible `ok:true` records, no spawn, operator-caught —
`feedback_never_claim_done_without_proof`). An AI agent with NORMAL ledger-write access, under pressure,
hand-writing plausible records IS the mistake class the panel exists to catch. Mistake-reachable false-green
must close. Rejected option C (accept the local ledger as a trusted boundary): the attestation's ENTIRE PURPOSE
is to be un-foolable when a component produces an unearned green (β) — a rubber-stamp is the exact false-green
class "security truth" exists to kill.

## Decision

**Per-session HMAC ORIGIN-PROOF.** A per-session secret (`.claude/runtime/.attest-session-secret`, gitignored,
0600) is read/created by the single shared record writer. The writer signs the canonical IDENTITY fields
(role, shape, provider, tool_id, panel_run_id, code_sha, output_digest, evidence_sha, cmdline_checksum,
completed_at) with HMAC-SHA256 → `attest_sig`. `cert-attest.attestLane` VERIFIES the signature on every
candidate record FIRST — an absent/invalid signature → NOT attested (fail-closed). A hand-authored record has
no valid signature, so it cannot attest. Enforcer: `scripts/dispatch/attest-signing.js` + the sign site in
`dispatch-agent.recordCompletion` (the ONE choke-point BOTH the CLI records AND epsilon-runtime's in-process
hunter go through) + the verify site in `cert-attest.attestLane`.

**WRITER-AUTHORITATIVE provenance (resolves the record-provenance conflict).** `code_sha` (own git HEAD) +
`panel_run_id` (own env) are what the WRITER derived, not caller-supplied. A caller value that CONFLICTS is a
forged-provenance attempt (or a bug): the writer OVERRIDES with the derived value AND writes the record
UNSIGNED + `provenance_mismatch:true` (it can never attest) — it never silently prefers one. This supersedes
the pre-ED-231 caller-explicit-wins model that `record-provenance.test` enshrined (which enshrined exactly what
the forgery exploited); that test is migrated (α-sanctioned) and β's forged-set fixtures are the stronger teeth.

**Scope (α discipline) — and the HONEST claim-scope of "mistake-class CLOSED" (β RIDER-1):** verification is
REQUIRED on the BINDING attestation surface ONLY (the cert-attest path). The mistake-class forgery is therefore
CLOSED **on the binding surface**, NOT globally: the broader `gauntlet-verify` `ok:true` liveness readers (the
sprint's release-close gate) are UNTOUCHED this session and remain FIELD-ONLY, so a forged UNSIGNED `ok:true`
liveness record still fools them — that is the **SAME mistake-reachable forgery class on a different reader**, and
it stays OPEN there. Whole-ledger signature verification (extend verify to the liveness readers) is therefore a
**MISTAKE-CLASS-PRIORITY** deferral, NOT "portability / defense-in-depth" — do not mislabel it. Deferred to
Phase-2 (ED-231 candidate_enforcers) because it needs the identity/portability substrate, but it closes the same
false-green class, not a nice-to-have. The release gate must NOT silently trust field-only liveness records as if
the forgery were globally closed.

## The named CEILING (the (C) honesty — do NOT paper over it)

The secret is a gitignored runtime file, so a **SAME-USER FS-READ adversary can read it and forge a valid
signature** (or edit the attestor itself, or read any local key). **NO local scheme beats a same-user
adversary** — that boundary is the machine/user account (the SP-001 raced-hard-link honest-ceiling class). This
ADR does NOT claim to beat it. What it DOES: convert forgery from **MISTAKE-REACHABLE** (append a plausible
JSON line — the operator-caught mistake class) to **REQUIRES-DELIBERATE-INTENT** (read the secret + re-sign,
or subvert the attestor). That is the design goal; the residual is the named account boundary, not a silent
hole. R6's premise (ADR-0024 "the evidence layer is the real protection") is RESTORED **within this stated
boundary** — the residual is inert against the mistake class, and the deliberate-intent case is the account
ceiling, not a false-green the attestation silently emits.

## Consequences / future-reader guards

- **Do NOT remove the signature verification** thinking field checks are enough — they are a rubber-stamp
  without origin-proof (the reproduced live false-green).
- **(B)-lite artifact-binding (deferred, ED-231):** recompute `evidence_sha`/`output_digest` from the REAL
  persisted review artifact and require a match — raises the forger's cost to also-forge-the-artifact. The
  hunter evidence file is not canonically persisted today; folded into ED-231, not a prerequisite (origin-proof
  is the root close).
- **Whole-ledger verification (deferred, ED-231 — SAME mistake class, β RIDER-1):** extend signature verification
  to the `gauntlet-verify` liveness readers in Phase-2. This is NOT defense-in-depth — a forged unsigned `ok:true`
  liveness record fools the field-only release gate today, the same mistake class the binding surface just closed.
- **Verdict NOT signed (β RIDER-2, forward defense-in-depth):** `SIGNED_FIELDS` binds IDENTITY+PROVENANCE and
  deliberately EXCLUDES the review verdict (the sig proves the lane RAN with real origin, not what it found). A
  same-user adversary could therefore flip a real signed record's verdict FAIL→PASS without invalidating the sig
  — inside the named account ceiling, and BE-CQ-001's verdict allowlist catches malformed/unknown values but NOT a
  valid-but-tampered flip. "Sign the verdict too" is a Phase-2 candidate (ED-231). Not a live false-green (account
  ceiling + BE-CQ-001), but named so it isn't mistaken for closed.
- The §7 served-model colon-echo residual (QA lane) is the separate string-parsing ceiling (ED-230); the true
  close is upstream (agy emitting a machine-readable served-model line under an authenticated backend).

## Enforcer

`scripts/dispatch/attest-signing.js` (sign/verify) + `dispatch-agent.recordCompletion` (writer-authoritative +
sign) + `cert-attest.attestLane` (verify-first, fail-closed) + `scripts/checks/cert-attest-panel.test.js`
ED-231 forgery teeth (unsigned/wrong-mac/tampered-field/direct-write → fail-closed; signed → attests) +
`scripts/dispatch/record-provenance.test.js` (writer-authoritative). Debt: ED-231 (open until (B)-lite +
whole-ledger + sign-the-verdict land). The mistake-class is CLOSED **on the binding cert-attest surface**; the
gauntlet-verify liveness readers are the SAME mistake class, still OPEN, closed by whole-ledger verification (β
RIDER-1 — mistake-class priority, NOT defense-in-depth). Verdict-signing (β RIDER-2) is the forward defense-in-depth item.
