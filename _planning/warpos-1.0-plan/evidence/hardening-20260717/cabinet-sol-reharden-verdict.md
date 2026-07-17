# Cabinet consult — sol-reharden verdict (gpt-5.6-sol @ ultra, 2026-07-17)

*Dispatch: real CLI (codex exec --sandbox workspace-write -c model_reasoning_effort=ultra -m gpt-5.6-sol -), advisory-only/change-nothing. ok:true, provider:openai, model:gpt-5.6-sol. Prompt: evidence/hardening-20260717/sol-reharden-prompt.md. Reviewed HEAD 51980e0e (hardening passes 1-4 included). Verbatim output below.*

---

Scope note: I reviewed current HEAD `51980e0e`, including the later β folds. The [hardening ledger](/C:/Users/Vlad/Desktop/Claude/Projects/WarpOS/_planning/warpos-1.0-plan/HARDENING-CHANGES.md:25) now contains 17 items, not the prompt’s earlier 14. This consult changed no files.

**Q1 — PARTIAL CLOSURE; not fully closed.** Contract-first/adapter-last sequencing is now sound, and the intended boundary is stated correctly. What remains undefined is the operational trust root: the sole integration principal, its credential/write isolation, the complete pinned checker bundle and promotion authority, and how an acceptance verdict binds the WorkOrder, check-suite version, evidence, and destination ref. G4.5 also proves a non-Claude leaf lane, not a non-Claude provider at the helm. The architecture is right; the proof boundary remains incomplete.

**Q2 — YES; material false-green paths remain.**

- **G4.4:** a direct merge/push can succeed and then be “detected loudly.” The gate passes because detection worked, while “controller is the only route into main” was already violated.
- **G4.1/G4.6:** “outside the candidate tree” is not necessarily outside the candidate process’s writable domain. A provider could alter an external helper, dependency, configuration, executable resolution, or the checker promoted for the next run.
- **G4.2/G3.7:** the integration head can advance after checking. Base/tree hashes remain valid, but the candidate is integrated into an untested target state unless the destination ref is bound to the verdict and updated by compare-and-swap.
- **G4.5:** Claude Alpha can dispatch one Codex worker and satisfy the gate without proving Codex-at-helm portability. One happy-path run also cannot prove the `died/timed-out/quota/approval/resume` invariants.
- **G1.5/G1.7:** `fallback:false` is a good strengthening, but the record still needs same-run correlation to the actual executable return, sanitized invocation digest, code SHA, panel profile, and evidence digest. Otherwise internally consistent wrapper telemetry can attest itself.
- **G3.5:** “wired into `/scan:full`” can green while contradictions remain report-only. At Phase 3 exit, zero unexplained tracker/disk mismatches must be binding.
- **G0.1/G0.3:** `Enforcer: nonexistent-script`, a fabricated ED, or an empty conformance runner can satisfy the present shape. References must resolve, mandatory fixture counts must be nonzero, and core invariants must not be debt-waivable.
- **G2.2:** deterministic regeneration proves repeatability, not semantic fidelity; the generator can consistently omit a canonical rule and still produce a clean diff.
- **G3.4:** a sequential two-session fixture misses the simultaneous lease-acquisition race; leases need atomic acquisition and fencing tokens. Merely surfacing a do-not-reopen entry is advisory unless supersession is explicitly required.
- **G4.3:** missing/crashed/timed-out cases do not establish default-deny for malformed, stale, partial, unknown, or silently skipped required checks.

**Q3 — CONDITIONALLY THE RIGHT CALL.** Timeboxing the migration is sensible, and an honestly named two-family 1.0 can be defensible. Automatic degradation is acceptable only if final approval explicitly ratifies the two-family profile now—not if elapsed time can silently weaken a three-lab claim.

I would prefer two immutable, versioned assurance profiles:

- `panel-2family`: GPT + Claude required; agy is not represented as a certified participant.
- `panel-3lab`: GPT + Claude + Antigravity required; every missing lane blocks.

Option A can attempt promotion to `panel-3lab`; expiry retains the already-ratified `panel-2family` profile. A successful agy proof must move agy from optional to required. An optional lane’s absence may be ignored, but if it runs and returns a binding FAIL, that failure should still hold. No fallback should count as another lab. Selecting two-family also requires an explicit supersession of ADR-0016, AGENTS/registry claims, and the hard-coded three-pass `security-pass-count` enforcement.

**Q4 — NO DELTA NEEDS REVERSAL, but several need tightening.**

- **H-1:** risks importing product launch qualification and release ceremony back into kernel scope. Interpret it as proving lifecycle transitions and durable evidence flow, not product readiness.
- **H-2:** sound as a seed, provided `role_id` is durable identity while provider/runtime are effective dispatch facts. Lease schemas also need owner, TTL, renewal, atomic acquisition, and fencing.
- **H-3:** valuable, but needs a field-level ground-truth authority map, consistent-snapshot semantics, and binding mismatches at Phase 3 exit.
- **H-4:** sound, provided the IN/OUT manifest is versioned and cannot be changed by the candidate merely to remove a difficult check.
- **H-5:** not yet true in the current text. Most gates remain behavioral descriptions rather than exact commands with exit codes, fixture IDs, evidence paths, and mandatory assertion counts.
- **H-6a:** “Claude-side boot files only” conflicts with any-provider-at-helm. The rule belongs in trusted provider-specific helm bindings for every supported helm.
- **H-6b:** the five-state vocabulary is cleaner, but a ResultEnvelope is an untrusted execution report. Trusted acceptance/integration needs a separate verdict and a normative state × reason × retryability matrix.

Two smaller ledger issues: calling the substantive `122 → 138` template-count failure “harmless” is stronger than the evidence supports, and the ledger’s process-note links point to untracked runtime copies rather than the committed evidence paths.

**Q5 — THREE FURTHER TIGHTENINGS WARRANTED.** My advisory verdict is not execution-ready as-is, although no phase resequencing is needed.

### Ranked amendments

1. **Define a real trust root: protected canonical ref, sole integration principal, isolated credential, content-addressed checker bundle, controlled promotion, and atomic ref CAS** — prevents bypass, checker poisoning, and check/merge target drift.
2. **Add a trusted AcceptanceRecord binding WorkOrder digest, exact base/tree/target ref, checker and policy digests, evidence digests, effective route/fallback, and final integration receipt** — prevents replay, forged bindings, config echoes, and provider-authored `success` from authorizing integration.
3. **Replace G4.5/H-5 proof with one fail-closed aggregate runner that executes a clean-install black-box flow from every contracted top-level helm and selected security profile, with exact commands, mandatory negative fixtures, zero skips, and current-run evidence** — prevents leaf-only success, warm-workspace state, selective gate execution, or report-only debt from masquerading as portability.

Confidence: high. Evidence of protected-ref rejection, a hermetic checker trust root, and genuine top-level contracted-helm runs would materially change this verdict.