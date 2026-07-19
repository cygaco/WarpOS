# SP-20260718-005 — Phase 3 — build_spec

**Composition:** backend + security, HIGH risk. **Merge policy:** BACKEND-FIRST (backend lands the schema + writer-wiring + `SIGNED_FIELDS` addition; security builds authority/provenance checks against the FROZEN shape). **Integration seam:** the shared completion-record schema (`scripts/dispatch/dispatch-record-fields.js`) + the single `recordCompletion` writer + `scripts/dispatch/attest-signing.js#SIGNED_FIELDS`. NO greenfield — every item adapts an existing surface. Cite the real seams below; do not re-derive.

## Real seams (grounded — DoE-confirmed + ε-verified against the code)
- **Signing sink:** `scripts/dispatch-agent.js#recordCompletion` → `attest-signing.signRecord` (the ONE writer both CLI records + epsilon-runtime in-process go through). Add `workorder_digest` to `SIGNED_FIELDS` (attest-signing.js:52).
- **Same-session choke-point:** `scripts/dispatch/verified-liveness-read.js#isVerifiedLivenessRecord` (HMAC-verified). Guard: `scripts/checks/liveness-read-choke-point.js` fails un-routed same-session readers.
- **ED-218 seam:** `scripts/dispatch/role-resolver.js#deriveBinding` line ~351 hardcodes `validated_workorder_or_cli_binding:true` (Phase-2 channel-asserted). Make it CONDITIONAL on an ACTIVE WorkOrder validation.
- **Atomic-FS primitive:** `scripts/hooks/lib/concurrency-lock.js#tryAcquireOnce` uses `fs.openSync(path,"wx")` (O_EXCL). REUSE the create-pattern for the lease; DO NOT reuse its mtime-prune (not monotonic — DoE risk #3) — add a durable monotonic fencing token.
- **Record schema:** `scripts/dispatch/dispatch-record-fields.js` (started-row/quota fields land here, pure, then flow through `recordCompletion`).

## Session-scope partition (SHARP-1 — BINDING; the trust-anchor rule)
| artifact | scope | trust anchor | NEVER |
|---|---|---|---|
| WorkOrder @ dispatch | same-session | per-session HMAC (`attest-signing`) + `workorder_digest` signed | — |
| AcceptanceRecord @ integration | **cross-session** | CONTENT-ADDRESSED git identity (base SHA + result-tree hash + target ref + checker/policy/evidence digests) | per-session HMAC (→ R3 false-RED) |
| conductor-lease @ acquire | **cross-session** | atomic-FS O_EXCL + monotonic fencing token | mtime; per-session HMAC |
| do-not-reopen @ resume | **cross-session** | append-only ledger + explicit supersession entry | advisory-only surfacing |

**Rationale (DoE caveat resolved):** the AcceptanceRecord authorizes integration, which a RESUMED/DIFFERENT session performs (resumability is the whole reason packet-07 leases exist) — so it crosses the per-session HMAC-secret boundary by design and CANNOT depend on it. β SHARP-1 already ruled this; confirmed against the integration path (builders are OS-subprocess/worktree dispatches).

---

## UNIT BE — backend-builder (lands FIRST)

**BE-1 · WorkOrder min schema + validator.** `.claude/schemas/workorder-min.schema.json` + `scripts/dispatch/workorder-schema.js` (validate()). Fields: `schema_version`, `correlation_id`, effective `{role,provider,model}`, `base_commit` (immutable) + `result_tree_hash`, `allowed_capabilities[]` + `allowed_paths[]`, `retry_lineage[]`, `evidence_refs[]`, `terminal_state` ∈ {success,partial,blocked,failed,cancelled}, `failure_reason` ∈ the CLASS taxonomy {timeout,quota_exhausted,provider_unavailable,model_unavailable,auth_missing,worktree_base_stale}. (AC-1)

**BE-2 · started-row + quota, wired into ALL writers as ONE change.** ED-069 `started_at`-row (a started-but-uncompleted dispatch is visible) + ED-070 `quota` field, added to `dispatch-record-fields.js` (pure) and threaded through the SINGLE `recordCompletion` sink so `dispatch-agent` / `dispatch-claude` / `dispatch-skill` / `epsilon-runtime` all carry them. Grep every write site; a writer bypassing `recordCompletion` re-opens the class. Existing dispatch regression stays green. (AC-9)

**BE-3 · `workorder_digest` into SIGNED_FIELDS.** Add to `attest-signing.js#SIGNED_FIELDS` (position deliberate; signer+verifier byte-agree). A digest swap invalidates the signature. (AC-12)

**BE-4 · conductor-lease (atomic-FS + fencing token).** `scripts/dispatch/conductor-lease.js`: `acquire(spId)` O_EXCL-creates `.claude/runtime/conductor-leases/<spId>.lease`; the fencing token = a monotonic counter persisted in an append-only `.claude/runtime/conductor-leases/<spId>.claimlog` (each acquire = max(seq)+1, atomic append). `verifyToken(spId, token)` → a write carrying token < current is REFUSED. Cross-session-valid (no HMAC, no mtime). (AC-6, AC-7)

**BE-5 · do-not-reopen ledger.** `scripts/dispatch/do-not-reopen.js` + `.claude/runtime/do-not-reopen/<spId>.jsonl` (append-only). `isSettled(spId, decisionId)` / `supersede(spId, decisionId, newEntry)` — reversal REQUIRES an explicit supersession entry; a resume that re-litigates without one is BLOCKED and the ledger is surfaced. (AC-8)

**BE-6 · immutable base + freshness (TOCTOU-safe).** `workorder-schema` carries the immutable `base_commit`; a `freshness.assertAgainstHead(base, targetRef)` re-asserts at merge time — head-advanced-after-check REFUSES. (AC-10)

**BE-7 · ADR-0026 Option-2 cited-ED registry.** `scripts/dispatch/cited-ed-registry.js`: resolve a cited ED against the UNION of canonical + worktree-local ED targets; a sync-drift lint flags cited-but-absent. (AC-13) — closes the gitignored-ledger-doesn't-ride-the-merge split-durability class.

**BE-8 · F1 wake-notification.** A robust completion signal: on dispatch completion, write a durable completion marker + emit a re-wake signal; the fire-and-poll contract is documented. Process-absence is NEVER the signal. (AC-11)

## UNIT SEC — security-builder (against the FROZEN BE shape)

**SEC-1 · ED-218 ACTIVE provenance/authority validator.** `scripts/dispatch/workorder-validator.js`: (a) schema-validate the WorkOrder (BE-1), (b) authority-check (the spawn is legitimate: channel-derived actor + trusted-parent argv role, REUSING role-resolver's derived-not-settable spine — NO parallel mechanism). Wire into `role-resolver.deriveBinding`: `validated_workorder_or_cli_binding` is TRUE only when this validator passed. Keep the WG-10 prompt-size floor (belt) + required-semantics (suspenders). (AC-2, AC-3)

**SEC-2 · AcceptanceRecord (falsifier-resistant, cross-session).** `scripts/dispatch/acceptance-record.js`: `produce(...)` binds WorkOrder digest + exact base/tree/**target** ref + checker/policy digests + evidence digests + effective route/fallback + integration receipt; `authorizesIntegration(record, target)` returns true ONLY for a content-valid record whose target ref MATCHES the integration target AND whose WorkOrder terminal_state === "success". A provider `success` alone → false. (AC-4)

**SEC-3 · acceptance-read choke-point (structural guard).** `scripts/checks/acceptance-read-choke-point.js`: fails ANY integrator that authorizes a merge on a ResultEnvelope `success` without routing through `acceptance-record.authorizesIntegration` — the cross-session analog of `liveness-read-choke-point.js`. Cross-session readers exempt STRUCTURALLY (by the property "reads a foreign-session ledger"), never a settable marker. (AC-5)

**SEC-4 · fencing-token verification at integration + lease writes.** Consume BE-4's `verifyToken`: an AcceptanceRecord/integration produced under a superseded lease is REFUSED. (AC-7, ties AC-F5)

**SEC-5 · reaper-ranking fixtures.** `scripts/dispatch/reaper-ranking.js` + fixtures: the 8 ranked signals; a reap justified by process-absence ALONE is REFUSED. (AC-14)

## Cross-cutting (ε-direct — dev-tooling docs/meta, not builder code)
- **ED-071 fold-back:** `teammate-stall-rules.md` → `epsilon.md` + `agent-dispatch-guide.md` (AC-17). ε authors directly (dev-tooling docs).
- **AC-15 tracker-fidelity probe** into `/scan:full` — backend-builder if code; ε wires the scan hook.
- **AC-16 G0.3/ED-214 binding flip** — LAST, gated on AC-1..15 all green (never flip a default red).

## Build ordering (waves)
1. **Wave 1 (BE core):** BE-1, BE-2, BE-3 — the schema + wiring + signing (the frozen seam).
2. **Wave 2 (BE mechanisms):** BE-4, BE-5, BE-6, BE-7, BE-8.
3. **Wave 3 (SEC, against frozen BE):** SEC-1..SEC-5.
4. **Wave 4 (ε-direct):** ED-071 fold-back, tracker-fidelity wire, then the G0.3 binding flip once all green.

Integration phase (multi-builder): write `runtime/integration/SP-20260718-005/<unit>/manifest.json`, run `scripts/checks/integration-seam-gate.js`, treat exit 1 as a blocking gauntlet failure, backend-first.
