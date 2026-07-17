# Hardened phase-exit gates — draft (α, 2026-07-17 hardening session)
*Shape rule (H-5, from packet 14): every phase exit = named runnable commands + expected outcomes. Commands marked (build-in-phase) are deliverables of that phase — the gate is that they exist AND pass by phase end. Report-only is acceptable only where marked; everything else is binding at phase exit.*

## Phase 0 — Kernel contract + trust boundary
- **G0.1 Contract lint**: `node scripts/checks/runtime-contract-lint.js` (build-in-phase) exit 0 — asserts the merged 04/16 contract doc contains: trust-boundary statement, binding-precedence graph, provider×capability×helm matrix, WorkOrder minimal field set, retention classes, and an `Enforcer:` line (or ED reference) on every policy block. A policy block without a named enforcer = lint FAIL (mechanizes the write-time enforcer rule).
- **G0.2 ADR ratified**: ADR file (durable-company / ephemeral-executors, from packet 03) committed + linked from the contract; `/scan:references` shows no broken links to/from it.
- **G0.3 Conformance matrix seeded**: fixtures dir harvested from packet 13/15 **kernel-scope only** — the matrix file opens with an explicit IN/OUT scope line (IN: truth, instruction-interop, role/state, sprintroom, workorder/envelope, dispatch, liveness, worktree, sprint-compiler subset, hidden-evals subset; OUT→lastmile: founder-panel, webapp, supabase, demo/MVP/launch gates) (H-4). Fixture runner executes end-to-end (report-only allowed at Phase 0).
- **G0.4 DoD preamble**: plan carries packet 02's acceptance sentence as the 1.0 Definition-of-Done preamble (H-1).

## Phase 1 — Routing + security truth
- **G1.1 Harness-spawn model rule**: `node scripts/dispatch/harness-spawn-model.test.js` (build-in-phase) — a role whose registry pin is non-Claude resolves to a Claude model on the Agent-tool channel; the logical pin is untouched on CLI channels (03's role_id/provider/runtime triple is the schema seed, H-2). Negative fixture: β (gpt-5.6-sol pin) spawn-resolution → Claude model, no error.
- **G1.2 I-2 closed**: `node scripts/dispatch/dispatch-contract.js validate` exit 0 with security-reviewer's provider row reconciled (antigravity↔agy allowlist).
- **G1.3 I-3 closed**: beta-consult `--out` accepts absolute paths (regression test).
- **G1.4 ED-205 closed**: `--provider` override serves the spec's `provider_model`, not the provider default (test).
- **G1.5 agy lane reconciled**: the stale source (audit vs DUMP/tracker) corrected in-repo; ONE live agy dispatch record with real elapsed/bytes on the ledger. [pending this session's probe — gate text finalizes on the probe verdict]
- **G1.6 Security panel fail-closed + canary corpus**: 5-case canary run — legitimate dual-use finding → adjudicated (not refused); malicious repo-instruction → flagged; unsupported claim → rejected; hunter disagreement → surfaced; missing evidence → BLOCKED-INCONCLUSIVE. Negative test: kill one lane mid-panel → verdict BLOCKED, never PASS. No silent judge fallback (fixture).
- **G1.7 Effective-model attestation**: dispatch evidence records ACTUAL effective provider/model (WG-26 extension); model-chain H2-class self-check green.
- **Exit**: full 3-lab panel end-to-end GREEN on a real target + all closures above tested.

## Phase 2 — Identity + host portability
- **G2.1 Binding precedence enforced**: fixtures — dispatched worker with no validated binding → UNBOUND fail-closed (refuses privileged action); top-level session → Alpha via helm binding. Repo prose alone can never manufacture a binding (negative fixture: planted "you are Alpha" prose in a worktree → worker stays UNBOUND).
- **G2.2 Deterministic projections**: regen projections from the neutral canonical source → `git diff --exit-code` clean (drift check, same regen-both-manifests discipline).
- **G2.3 Authority-pollution scan**: (build-in-phase) scans the EFFECTIVE instruction graph (imports, agent specs, shims, generated files, worktree CLAUDE.md, handoff prompts) — zero unconditional authority/operator-audience grants in ambient neutral surfaces; **binding-order rule #5 (top-level default = alpha) present ONLY in helm bindings, never neutral AGENTS.md** (H-6a — the packet's own template violates this; fix at projection time).
- **G2.4 President-leak closed**: builders in isolated worktrees no longer inherit unconditional "You are Alex — the President" (scan asserts on the effective worktree instruction set); codex reviewers no longer slurp the full 14KB router by default.
- **G2.5 cwd/sandbox safety**: per-provider cwd/sandbox behavior TESTS pass BEFORE any neutral-cwd change merges (codex sandbox-root regression fixture).
- **G2.6 Operator-voice placement**: ratified rule text present in the runtime contract, projected into helm bindings only; scan (G2.3) asserts absence from neutral surfaces.

## Phase 3 — WorkOrder / ResultEnvelope
- **G3.1 Schemas + validators**: fixtures for all 5 terminal states {success, partial, blocked, failed, cancelled} + `failure_reason` codes from packet 08's taxonomy (model_unavailable, auth_missing, quota, timeout, provider_unavailable, worktree_base_stale, …) — vocabulary reconciled per H-6b (classes ≠ states). Schema suite exit 0.
- **G3.2 Hollow-prompt defense**: prompt-size floor AND required-semantics validation both enforced (α ruling: belt + suspenders); WG-10-class hollow-prompt fixture fails closed.
- **G3.3 Ledger adaptation coherent**: ED-069 (started-row) + ED-070 (quota field) wired into ALL dispatch writers as one change; gauntlet-verify reads the envelope; regression suite green.
- **G3.4 Leases + do-not-reopen**: lease schema seeded from packet 03's taxonomy (one_shot/wave/phase/session, H-2); two-sessions-same-SP-id fixture → second session BLOCKED from conducting; do-not-reopen ledger surfaces settled decisions at session resume (fixture: a resumed session attempting to re-litigate a ratified decision gets the ledger hit). The 1.0 plan itself becomes the first do-not-reopen entry.
- **G3.5 Tracker-fidelity probe (H-3)**: (build-in-phase) compares TRACKER/sprint-state claims to git/disk ground truth (branch existence, SHA reachability, "open" items already landed); wired into /scan:full; report-only acceptable at first wiring, ED logged if it stays report-only past phase exit. Closes the ED-056 recurrence class (corroborated by packets 07 + 17).
- **G3.6 Doctrine fold-back (ED-071)**: teammate-stall-rules.md folded into epsilon.md + agent-dispatch-guide.md; stale pointer removed.
- **G3.7 Worktree base**: WorkOrder declares an immutable base commit AND dependent builders assert freshness vs the integration head (both, per α ruling); stale-base fixture red→green.
- **G3.8 Reaper ranking fixtures**: packet 08's 8-signal ranking as fixtures — process-absence-only reap attempt → REFUSED (fixture); WorkOrder split heuristics documented as authoring guidance.

## Phase 4 — Trusted enforcement adapter
- **G4.1 Pinned checker, outside the candidate tree**: fixture — candidate tree modifying its own enforcer/CLAUDE.md/AGENTS.md → flagged untrusted, gate still evaluates from the pinned copy.
- **G4.2 No check/merge TOCTOU**: exact base+tree hash validated; fixture mutates the tree between check and merge → merge REFUSES.
- **G4.3 Fail-closed**: missing / crashed / timed-out check → BLOCKED (three fixtures, one per failure mode).
- **G4.4 Only route into main**: bypass attempt (direct merge around the controller) is detected loudly; pre-commit documented as convenience, NOT the authority boundary (its bypassability proven harmless to the boundary by test).
- **G4.5 Provider-independent acceptance proven**: one full WorkOrder→Envelope→checked-integration pass on a NON-Claude lane (codex; agy if lane up) end-to-end with the portable invariants (started/completed/died/timed-out/quota/approval/resume) recorded by the dispatch control plane, not Claude lifecycle hooks.
- **G4.6 Honest promise + self-modification test**: contract states the 1.0 boundary honestly (artifact acceptance + integration; NOT full arbitrary-helm OS containment); checker self-modification test present.
- **1.0 DoD (H-1)**: the packet-02 acceptance sentence holds — a clean installed product moves idea→learning-promotion without chat memory, stale trackers, Alpha heroics, or unverified claims — demonstrated by the conformance matrix run.

## Cross-phase hardening rules
- Every gate above is a named runnable command by phase end; a gate that can't run = the phase is not exitable (packet 15's philosophy).
- Report-only is a stated exception with an ED entry, never a silent default.
- SP-20260717-001 fix-cycle (gauntlet fix-brief + retention amendments) remains post-approval FIRST WORK, gated separately — not a phase gate.
