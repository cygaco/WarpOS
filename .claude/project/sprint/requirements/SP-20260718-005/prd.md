# SP-20260718-005 — Phase 3: WorkOrder / ResultEnvelope — PRD

**Authored:** 2026-07-19 (design phase, ε conductor). **Composition:** backend + security, HIGH risk. **Consumes:** the folded β plan→design verdict (DECIDE B/0.89, OPEN_ADR) in `.claude/project/sprint/sprints/SP-20260718-005/plan.md`. **NO greenfield** — every mechanism adapts the EXISTING dispatch ledger.

## R-1 — The dispatch loop must be auditable and un-forgeable end-to-end
The propose→dispatch→gauntlet→acceptance→integration loop currently trusts records that carry no proof of what they were FOR (no WorkOrder binding) and no proof that an execution result was ACCEPTED by a trusted authority (a provider's own `success` reads as authorization). Phase 3 gives every dispatch a schema-versioned, correlated, provenance-bound **WorkOrder** on the way in and a trusted **AcceptanceRecord** on the way out, so the whole loop can be reconstructed and no step can be forged or replayed.

## R-2 — A provider's self-authored `success` NEVER authorizes integration
The single highest-risk irreversible action in this system is **integration** (merging built work into the integration head). Today a ResultEnvelope's `success:true` is trusted. Phase 3 makes the ResultEnvelope an UNTRUSTED execution report and introduces a separate TRUSTED AcceptanceRecord (WorkOrder digest + exact base/tree/**target** ref + checker/policy/evidence digests + effective route/fallback + integration receipt) as the ONLY thing that authorizes integration. This closes the false-acceptance class.

## R-3 — Two sessions must not conduct the same sprint; settled decisions must not be silently re-litigated
A resumed or parallel session can collide with an in-flight conductor (the late-firing-prior-conductor case, SP-003 R6). Phase 3 adds a **conductor-lease** (a session claims an SP-id; a superseded lease's writes are refused via a monotonic fencing token) and a **do-not-reopen ledger** (settled dispositions a resumed session must not reverse without an explicit supersession entry).

## R-4 — WorkOrders carry a validated, non-forgeable provenance at dispatch time
ED-218: the dispatch bridge must ACTIVELY validate a WorkOrder (schema + authority/provenance) BEFORE it resolves a role — an unvalidated, self-asserted, or merely-transited binding is rejected at dispatch time. The WG-10 hollow-prompt floor stays (belt); the required-semantics validation is added (suspenders).

## R-5 — Every dispatch writer records the same coherent field set
ED-069 (started-row) + ED-070 (quota field) are wired into ALL dispatch writers as ONE coherent change through the single `recordCompletion` sink, so liveness/quota telemetry is uniform and a started-but-never-completed dispatch is visible.

## R-6 — Completions are reliably signaled (F1)
The teammate background-dispatch re-wake seam dropped 9+ completions this session. A robust completion signal + the fire-and-poll doctrine is load-bearing for the dispatch control plane. Process-absence is NEVER the completion signal.

## Non-goals (do-not-reopen — carried, β-confirmed)
- The derived-not-settable role-binding spine (SP-004) is REUSED, not rebuilt.
- The same-session-vs-cross-session signature boundary + the R3 cross-session false-RED disposition stand.
- Dropped-from-1.0 packets (02/09/10/11/12) and adversarial-helm containment stay dropped.
- The regex→AST guard completeness is a named residual (ED-229), not ground in this sprint.
- The same-user filesystem ceiling (ADR-0025) is named honestly, not "solved" — no local scheme beats a same-UID adversary who edits the attestor.

## Product-execution framing (Cold-vs-Warm-Start; FTUE for the dispatch control plane)
The "user" of this feature is a future conductor (ε/α/δ) resuming or starting a sprint. The FTUE that must not break: a resumed session reads the lease + do-not-reopen ledger, learns what it may and may not do, and cannot forge its way past either. The cold-start (a fresh conductor, no prior lease) must acquire cleanly; the warm-start (a resumed conductor) must inherit the fencing token and be refused if superseded.
