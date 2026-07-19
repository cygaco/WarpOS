# SP-20260718-005 — Phase 3 — Acceptance Criteria

Each AC maps to a plan exit gate (G3.x) and names its `verified_by` (the named enforcer/fixture). A binding AC FAILs the gauntlet if its `verified_by` is absent or red. Falsifier fixtures (AC-F*) are REQUIRED-PRESENT at the design→build exit (record-trust gate SHARP-3).

## Schema + validation

- **AC-1 (G3.1)** — `workorder-min.schema.json` defines schema version, correlation id, effective role/provider/model, immutable base commit + result-tree hash, allowed capabilities+paths, retry lineage, evidence refs, the 5 terminal states {success, partial, blocked, failed, cancelled}, and `failure_reason` codes as CLASSES (timeout/quota_exhausted/provider_unavailable/model_unavailable/auth_missing/worktree_base_stale). `verified_by`: `scripts/dispatch/workorder-schema.test.js`.
- **AC-2 (G3.2)** — the WorkOrder validator enforces BOTH the WG-10 prompt-size floor AND required-semantics; a hollow-prompt fixture and a missing-required-field fixture BOTH fail closed. `verified_by`: `scripts/dispatch/workorder-validator.test.js`.
- **AC-3 (R-4 / ED-218)** — `role-resolver.deriveBinding` resolves a dispatched worker via `validated_workorder_or_cli` ONLY when an ACTIVE WorkOrder validation (schema + authority) passed; a self-asserted/unvalidated binding is BLOCK. `verified_by`: `scripts/dispatch/ed218-active-provenance.test.js`.

## AcceptanceRecord (highest-risk — its OWN gate)

- **AC-4 (G3.9)** — a ResultEnvelope's `success` NEVER authorizes integration; ONLY a trusted AcceptanceRecord does, and it binds: WorkOrder digest + exact base/tree/**target** ref + checker/policy digests + evidence digests + effective route/fallback + integration receipt. `verified_by`: `scripts/dispatch/acceptance-record.test.js` + the SHARP-2(a) target-mismatch falsifier.
- **AC-5 (G3.9)** — the AcceptanceRecord trust anchor is CONTENT-ADDRESSED git identity (cross-session), NOT per-session HMAC (SHARP-1). A structural guard fails any integrator that merges on ResultEnvelope `success` without routing through the acceptance choke-point. `verified_by`: `scripts/checks/acceptance-read-choke-point.js` + its test.

## Lease + do-not-reopen (cross-session)

- **AC-6 (G3.4)** — the conductor-lease is built on an atomic-FS primitive (O_EXCL create) + a MONOTONIC fencing token; two sessions claiming the same SP-id → exactly one wins; a SIMULTANEOUS-acquisition race fixture resolves to exactly one holder. `verified_by`: `scripts/dispatch/conductor-lease.test.js`.
- **AC-7 (G3.4)** — a conductor acting under an expired/superseded lease has its writes REFUSED (fencing-token check); the token is cross-session-valid (not mtime — DoE risk #3). `verified_by`: the SHARP-2(b) superseded-lease falsifier.
- **AC-8 (G3.4)** — the do-not-reopen ledger requires an explicit SUPERSESSION entry to reverse a settled disposition, not advisory surfacing; a resumed session re-litigating surfaces the ledger and is BLOCKED absent supersession. `verified_by`: `scripts/dispatch/do-not-reopen.test.js`.

## Wiring + freshness + signal

- **AC-9 (G3.3)** — ED-069 started-row + ED-070 quota field are wired into ALL dispatch writers as ONE change via the single `recordCompletion` sink; the existing dispatch regression suite stays green. `verified_by`: `scripts/dispatch/dispatch-record-fields.test.js` (extended) **AND** a STRUCTURAL writer-enumeration enforcer `scripts/checks/all-writers-route-recordCompletion.js` — a dispatch writer that emits a completion record NOT via `recordCompletion` FAILS (quality-lead: the field-shape test alone is a false-green; a bypassing writer still emits well-formed records — the lib-only-fix-bypassing-caller trap needs a structural check, not a manual grep).
- **AC-10 (G3.7)** — a WorkOrder declares an immutable base commit AND asserts freshness against the integration head for dependent builders; a stale-base fixture (head advanced after the check) REFUSES the merge — no check→merge TOCTOU. `verified_by`: the stale-base falsifier.
- **AC-11 (G3.10 / F1)** — a background-dispatch completion is reliably signaled/re-woken; a no-dropped-re-wake fixture passes; process-absence is NOT the signal (ties to G3.8 reaper-ranking). `verified_by`: `scripts/dispatch/wake-notification.test.js`.
- **AC-12 (signing)** — `workorder_digest` is added to `attest-signing.SIGNED_FIELDS` so the WorkOrder binding rides the same-session signature; a post-hoc digest swap invalidates the signature. `verified_by`: `scripts/dispatch/attest-signing.test.js` (extended).

## Registry + reaper + conformance

- **AC-13 (ED-221 / ADR-0026 Option-2)** — a tracked cited-ED registry + union resolution: a contract that CITES an ED resolves it against the union of canonical + worktree-local ED targets; a sync-drift lint flags a cited-but-absent ED. `verified_by`: `scripts/dispatch/cited-ed-registry.test.js`.
- **AC-14 (G3.8)** — packet-08 reaper-ranking fixtures: a reap justified by process-absence ALONE is REFUSED; the 8 ranked signals are the fixture corpus. `verified_by`: `scripts/dispatch/reaper-ranking.test.js`.
- **AC-15 (G3.5)** — a tracker-fidelity probe is wired into `/scan:full` (field-level ground-truth authority map; consistent-snapshot semantics); a tracker/ground-truth mismatch is BINDING at Phase-3 exit. `verified_by`: `scripts/checks/tracker-fidelity.js`.
- **AC-16 (G0.3 / ED-214)** — the conformance runner's BINDING flip is gated on ALL conformance fixtures GREEN first, then flips (never a silent default). `verified_by`: `scripts/dispatch/conformance-matrix.js` (binding assertion) — flip ONLY after AC-1..15 green. The flip-gating itself is an ASSERTION (a check that all conformance fixtures are green BEFORE the binding default flips), not prose (quality-lead).
- **AC-17 (G3.6 / ED-071)** — `teammate-stall-rules.md` is folded back into `epsilon.md` + `agent-dispatch-guide.md`. `verified_by`: presence + cross-reference check. **NON-BINDING (docs-only, quality-lead):** a hollow fold-back is low product-priority; this AC does not gate the gauntlet — it is tracked for completeness, and ε authors it directly (dev-tooling docs).

## AC-18 — gauntlet falsifier-liveness (quality-lead, BINDING at gauntlet)
The 8+ falsifiers skip-when-module-absent by design (RED-until-built at design-exit). At GAUNTLET this is a fail-open loophole (a deleted/mis-wired module skips = green). The gauntlet MUST assert: (a) `skipped === 0` for the falsifier suite (every MUST-BLOCK actually EXECUTED, not skipped), (b) each reject-falsifier's positive companion passes (a valid record DOES authorize — defeats the constant-false stub), (c) `record-trust-gate.js --built` passes (all choke-point modules exist). `verified_by`: `scripts/checks/falsifier-liveness.js` + `record-trust-gate.js --built`.

## Required-present falsifiers (record-trust gate SHARP-3 — BLOCK build-entry if missing)
AC-F1 forged/unsigned-WorkOrder · AC-F2 self-asserted-success · AC-F3 stale-base · AC-F4 target-mismatch · AC-F5 superseded-lease · AC-F6 non-success-terminal-as-success · AC-F7 simultaneous-lease-race · AC-F8 do-not-reopen-advisory-only · **AC-F9 acceptance-read choke-point BYPASS (un-routed integrator — the SP-004 class)** · **AC-F10 lease×acceptance composition (valid record under a superseded lease → refused)**. Positive companion (defeats constant-false): `acceptance-positive-companion.test.js`. Seeded fixture: `runtime/record-trust-falsifiers/bypass/…/unrouted-integrator.js`. Manifest: `.claude/project/sprint/sprints/SP-20260718-005/record-trust-gate.manifest.json`; enforcer: `scripts/checks/record-trust-gate.js`.
