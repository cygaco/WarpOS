# SP-20260720-002 — PRD / Stories / Acceptance Criteria (Phase 4: Trusted enforcement adapter)

> Authored by product-lead (gpt-5.6-terra, fallback:false, real ledger record). The AC verified_by pointers are the traceability spine the gauntlet qa-reviewer checks. Canonical falsifier filenames are reconciled in record-trust-gate.md (the binding registry); AC verified_by pointers resolve to those. This sprint IMPLEMENTS ratified Phase 4 — do-not-reopen.

## 1. PRD

**Scope boundary:** This sprint promises provider-independent **artifact acceptance and integration**: it prevents mistakes, false-greens, overclaims, and sloppy merges. It does not promise hostile-operator containment or any broader security/product-readiness outcome.

- **R-1 — Honest, scoped authority.** The trusted enforcement adapter shall enforce only CORE-2’s artifact-verification and integration slice, and shall state that bounded promise without claiming all four CORE-2 powers.

- **R-2 — Pinned external checker bundle.** The adapter shall execute a content-addressed, promoted checker bundle whose manifest hashes every checker, helper, dependency, configuration item, and executable resolution; it shall hash-verify the bundle immediately before and after execution.

- **R-3 — Candidate-domain separation.** The checker bundle shall resolve and execute from an absolute, hash-verified location outside the candidate worktree’s writable domain, with a clean execution environment. Candidate changes to local enforcers, instructions, shims, `PATH`, or symlinks shall not determine the checker that runs.

- **R-4 — One shared check implementation.** Hooks, git pre-commit, and the controller shall each `require()` the one versioned shared check-library contract. The controller shall require only the pinned bundle’s frozen copy; mutable workspace imports are prohibited.

- **R-5 — Controller re-derives the verdict.** The controller shall treat a ResultEnvelope as untrusted data, resolve the proposed base commit, result commit, and result-tree hash from real Git objects, run the pinned bundle itself, and derive its own check evidence and verdict.

- **R-6 — Default-deny run manifest.** For each controller run, the controller shall mint a nonce-bound manifest of every expected check and reject absent, duplicate, unknown, stale, malformed, timed-out, crashed, partial, or skipped-required results.

- **R-7 — AcceptanceRecord binding and compatibility.** Before wiring, the controller shall confirm the exact `acceptance-record.js` public signatures. It shall call `produce()` with the verified base/result/tree, destination ref, lease fencing token, `check_suite_version`, and recomputed WorkOrder, policy, checker, and evidence digests; it shall then call `authorizesIntegration()` and `commitIntegration()`.

- **R-8 — Sole integration principal.** The controller shall be the sole brokered route for integration into `main`, using an atomic CAS from the observed destination head to the exact accepted result commit. Normal write surfaces—`update-ref`, merge, push, and fast-forward—shall be enumerated and mechanically covered or explicitly surfaced as uncovered blockers. Pre-commit remains early feedback, never the authority boundary.

- **R-9 — Aggregate helm runner.** The HELM-RUNNER shall be a fail-closed, clean-install entrypoint over the controller, executing every Phase-4-contracted helm/profile flow. Its exit floor is `panel-2family`: GPT and Claude are required; an absent optional agy lane does not block; an optional agy lane that ran and failed binds the result.

- **R-10 — Portable exit proof.** The runner shall record a complete codex non-Claude WorkOrder → ResultEnvelope → controller-checked integration pass and dispatch-control-plane evidence for started, completed, died, timed-out, quota, approval, and resume states. It shall not probe agy or count an agy route/default as served-model proof.

- **R-11 — Binding conformance and closure.** The Phase-4 fixture suite shall provide REQUIRED-PRESENT falsifiers for G4.1–G4.6, flip the CORE-2 trusted-layer sole-integrator fixture from report-only to binding for the scoped slice, close ED-215, and record ED-236 H5/C4 adjacency without claiming ED-236 is closed.

## 2. Stories

### H-1 — Freeze and execute the trusted checker contract  
`[Unit: BUNDLE | security]`

- **S-1 — Define the promoted bundle manifest.** Hash and version the checker set, helpers, dependencies, configs, executable resolutions, and shared-library export contract.  
  `[Unit: BUNDLE | security]` — R-2, R-4

- **S-2 — Implement isolated bundle resolution and execution.** Resolve only manifest-addressed absolute files, clean the execution environment, and verify bundle hashes before and after each run.  
  `[Unit: BUNDLE | security]` — R-2, R-3

- **S-3 — Create the single shared check-library source.** Make hooks and pre-commit consume the source contract; make the controller consume its frozen, pinned bundle copy.  
  `[Unit: BUNDLE | security]` — R-4

### H-2 — Make the controller the trusted verifier and integrator  
`[Unit: CONTROLLER | backend]`

- **S-4 — Resolve candidate identity from Git.** Validate base/result commits and result tree from Git objects; treat ResultEnvelope fields strictly as untrusted input.  
  `[Unit: CONTROLLER | backend]` — R-5

- **S-5 — Mint and enforce the nonce-bound run manifest.** Require exactly one current, well-formed result for every expected required check.  
  `[Unit: CONTROLLER | backend]` — R-6

- **S-6 — Wire the AcceptanceRecord seam.** Reconfirm the existing API signatures, recompute all bound digests, include `check_suite_version`, bind the lease token, then call produce → authorize → CAS commit.  
  `[Unit: CONTROLLER | backend]` — R-7

- **S-7 — Enforce the sole-route integration mechanism.** Route normal main-write surfaces through the controller’s CAS path, document pre-commit as non-authoritative, and publish a covered/uncovered write-surface inventory.  
  `[Unit: CONTROLLER | backend]` — R-8

### H-3 — Run the trusted flow across the two-family helm floor  
`[Unit: HELM-RUNNER | backend]`

- **S-8 — Build the profile-aware aggregate runner.** Reuse `panel-lanes` required/optional semantics and run clean-install flows through the controller only.  
  `[Unit: HELM-RUNNER | backend]` — R-9

- **S-9 — Produce the portable codex exit proof.** Record the full non-Claude flow plus dispatch lifecycle invariants; reject missing required GPT or Claude evidence.  
  `[Unit: HELM-RUNNER | backend]` — R-9, R-10

- **S-10 — Preserve agy deferral semantics.** Treat agy as optional and unproven for this exit; bind an actual optional-lane failure without probing or attesting agy.  
  `[Unit: HELM-RUNNER | backend]` — R-9, R-10

### H-4 — Make the claims executable and binding  
`[Unit: FIXTURES/CONFORMANCE | security]`

- **S-11 — Add G4.1–G4.6 REQUIRED-PRESENT falsifiers.** Add negative fixtures beside the owning gate, a positive companion where needed, and register all of them in the record-trust manifest.  
  `[Unit: FIXTURES/CONFORMANCE | security]` — R-11

- **S-12 — Flip scoped CORE-2 conformance.** Change only the artifact-verification/integration slice to binding, preserve scope language, and close ED-215 with ED-236 adjacency noted.  
  `[Unit: FIXTURES/CONFORMANCE | backend]` — R-1, R-11

## 3. Acceptance criteria

Excluded from acceptance criteria: credential isolation, OS sandboxing, adversarial-helm containment, product readiness, and generalized checker/plugin frameworks.

- **AC-1 — Scoped promise:** The Phase-4 contract states only provider-independent artifact acceptance plus integration, identifies this as the CORE-2 artifact-verification/integration slice, and makes no broader enforcement claim.  
  `verified_by:` `node --test scripts/checks/trusted-enforcement-scope.test.js`

- **AC-2 — AcceptanceRecord API confirmation:** Controller wiring rejects a missing or drifted `produce(input)`, `authorizesIntegration(record, targetRef, opts)`, or `commitIntegration(record, targetRef, opts)` signature before integration is attempted.  
  `verified_by:` **REQUIRED-PRESENT falsifier** `node --test scripts/dispatch/falsifiers/acceptance-record-signature-drift.falsifier.test.js`

- **AC-3 — Real Git identity:** The controller resolves full base/result commit identities and the result-tree hash from real Git objects; any absent, malformed, nonmatching, or non-ancestral value blocks integration.  
  `verified_by:` `node --test scripts/dispatch/trusted-controller-git-identity.test.js`

- **AC-4 — Re-derive, never adopt:** A ResultEnvelope self-asserting `checks_passed:true` and `verdict:"accept"` for a tree that fails the fresh pinned-bundle run is refused; no envelope verdict field is consulted as authorization.  
  `verified_by:` **REQUIRED-PRESENT falsifier** `node --test scripts/dispatch/falsifiers/self-asserted-accept-over-failing-tree.falsifier.test.js`

- **AC-5 — Check-to-merge TOCTOU refusal:** If the destination head advances after checking and before the ref update, the controller’s CAS refuses integration rather than merging against a different head.  
  `verified_by:` **REQUIRED-PRESENT falsifier** `node --test scripts/dispatch/falsifiers/head-advanced-after-check.falsifier.test.js`

- **AC-6 — Exact run manifest:** Every controller run has a unique nonce-bound manifest listing each expected check, its requiredness, suite version, and expected evidence identity.  
  `verified_by:` `node --test scripts/dispatch/trusted-controller-run-manifest.test.js`

- **AC-7 — Controller default-deny:** Missing, duplicate, unknown, stale, malformed, crashed, timed-out, partial, and skipped-required check results each produce `BLOCKED`, never an authorization result.  
  `verified_by:` **REQUIRED-PRESENT falsifiers (8 distinct-reason files, manifest S4)** `node --test scripts/dispatch/falsifiers/default-deny-{missing,duplicate,unknown,stale,malformed,timedout,skipped-required,crashed}-check.falsifier.test.js` + positive `run-manifest-satisfied.positive.test.js`

- **AC-7b — Check-set provenance, not caller-settable (β R1):** The controller runs the pinned bundle's FULL frozen `CHECK_NAMES`; the run-manifest's `expected_checks`/`required_checks` are minted FROM the pinned bundle's frozen `CHECK_NAMES`/`REQUIRED_CHECKS`, never from `input.expected_checks`. `input.expected_checks?` may ONLY additively constrain (assert `input ⊆ bundle.CHECK_NAMES` / require MORE), never shrink required below the bundle's `REQUIRED_CHECKS`. A caller passing `expected_checks=[]` (or a shrunk-required set) over a tree that FAILS a required check is still REFUSED — the pinned required checks fire and fail.
  `verified_by:` **REQUIRED-PRESENT falsifier** `node --test scripts/dispatch/falsifiers/caller-cannot-shrink-check-set.falsifier.test.js`

- **AC-8 — Record binds recomputed evidence:** The produced AcceptanceRecord includes `check_suite_version`, destination ref, lease fencing token, and recomputed WorkOrder, policy, checker, and evidence digests; stale or fabricated digest values are refused.  
  `verified_by:` `node --test scripts/dispatch/trusted-controller-acceptance-binding.test.js`

- **AC-9 — Only the authorized exact tree integrates:** A successful flow invokes `produce()` → `authorizesIntegration()` → `commitIntegration({ performRefUpdate:true })` in order and updates `main` only by CAS from the observed head to the accepted result commit.  
  `verified_by:` `node --test scripts/dispatch/trusted-controller-cas-integration.test.js`

- **AC-10 — Direct main merge is refused:** A normal un-brokered direct merge into `main` is refused by the sole-route mechanism.  
  `verified_by:` **REQUIRED-PRESENT falsifier** `node --test scripts/dispatch/falsifiers/unbrokered-merge-bypass.falsifier.test.js`

- **AC-11 — Delegation completeness:** The integration surface inventory lists `git update-ref`, merge, push, and fast-forward; each is marked controller-covered or explicitly uncovered, and an uncovered surface blocks design/build exit.  
  `verified_by:` **REQUIRED-PRESENT falsifier** `node --test scripts/dispatch/falsifiers/write-surface-delegation-completeness.falsifier.test.js`

- **AC-12 — Pre-commit is non-authoritative:** A candidate created with `--no-verify` cannot integrate without a new controller-run AcceptanceRecord; the test proves the boundary rather than relying on pre-commit.  
  `verified_by:` `node --test scripts/dispatch/falsifiers/precommit-bypass-harmless.falsifier.test.js`

- **AC-13 — Bundle pin integrity:** The bundle manifest’s content hash covers checker code, helpers, dependencies, configuration, executable resolution, and the frozen check-library export contract; a supplied content hash that differs from the promoted pin blocks before execution.  
  `verified_by:` `node --test scripts/checks/pinned-checker-bundle-manifest.test.js`

- **AC-14 — Poisoned candidate checker is blocked:** Candidate edits to its own enforcer, `CLAUDE.md`, `AGENTS.md`, or checker shim cannot select the executed checker; the pinned copy runs instead and the poisoned bundle attempt blocks.  
  `verified_by:` **REQUIRED-PRESENT falsifier** `node --test scripts/dispatch/falsifiers/checker-poisoning.falsifier.test.js`

- **AC-15 — External, clean execution:** The runner uses absolute pinned-bundle paths, a clean environment, and pre/post execution hash verification; hostile `PATH` or symlink resolution is detected and blocks.  
  `verified_by:` `node --test scripts/dispatch/falsifiers/pinned-bundle-path-symlink.falsifier.test.js`

- **AC-16 — Checker self-modification is detected:** A checker attempting to alter its own pinned artifact during execution is detected by post-run verification and blocks integration.  
  `verified_by:` **REQUIRED-PRESENT falsifier** `node --test scripts/dispatch/falsifiers/checker-self-modification.falsifier.test.js`

- **AC-17 — One library, three consumers:** Hooks, pre-commit, and controller bundle execution each `require()` the declared shared check-library contract; the controller import resolves under the verified bundle root, not the candidate workspace.  
  `verified_by:` **REQUIRED-PRESENT falsifier** `node --test scripts/dispatch/falsifiers/shared-check-library-reachability.falsifier.test.js`

- **AC-18 — No reimplementation or export drift:** Repository grep finds zero independent implementations of the shared checks, and any missing, renamed, or arity-drifted required export blocks rather than silently skipping a check.  
  `verified_by:` **REQUIRED-PRESENT falsifier** `node --test scripts/dispatch/falsifiers/shared-check-library-export-drift.falsifier.test.js` and `rg -n "function .*<shared-check>|const .*<shared-check>" scripts hooks .git/hooks`

- **AC-19 — Reachability, not just outcomes:** For each consumer, a spy proves the shared check fired; a negative control exposes the exact check reason, and a positive control can authorize only after the check ran successfully.  
  `verified_by:` **REQUIRED-PRESENT falsifier** `node --test scripts/dispatch/falsifiers/shared-check-library-reachability.falsifier.test.js`

- **AC-20 — Two-family profile floor:** HELM-RUNNER obtains profile semantics through `panel-lanes`; GPT and Claude are required for `panel-2family`, with at least two observed provider families required for PASS.  
  `verified_by:` `node --test scripts/dispatch/helm-runner-panel-2family.test.js`

- **AC-21 — Aggregate entrypoint has no parallel trust path:** A clean-install flow for every Phase-4-contracted helm/profile reaches integration only through the controller and pinned bundle.  
  `verified_by:` `node --test scripts/dispatch/helm-runner-clean-install.test.js`

- **AC-22 — Required-lane loss blocks:** Killing either required lane yields `BLOCKED`, never `PASS`.  
  `verified_by:` **REQUIRED-PRESENT falsifier** `node --test scripts/dispatch/falsifiers/sol-a3-required-lane-killed.falsifier.test.js`

- **AC-23 — Optional agy semantics:** An absent optional agy lane does not block a passing GPT+Claude run; an optional agy lane that ran and failed produces a non-PASS binding result.  
  `verified_by:` `node --test scripts/dispatch/falsifiers/sol-a3-optional-lane-semantics.falsifier.test.js`

- **AC-24 — No agy evidence fabrication:** The Phase-4 exit proof contains zero agy `attested:true` claims and no agy served-model evidence; an agy route/default string alone cannot prove service.  
  `verified_by:` `node --test scripts/dispatch/falsifiers/sol-a3-agy-route-not-served-proof.falsifier.test.js`

- **AC-25 — Portable non-Claude proof:** The exit proof records one codex WorkOrder → Envelope → controller-checked integration flow and all required dispatch lifecycle invariants.  
  `verified_by:` `node --test scripts/dispatch/helm-runner-codex-exit-proof.test.js`

- **AC-26 — Scoped CORE-2 binding flip:** `trust-boundary/trusted-layer-sole-integrator` changes from `report_only:true` to binding, covers only artifact verification and integration, and passes the binding conformance run.  
  `verified_by:` `node scripts/checks/conformance-matrix.js --enforce --coverage --flip-gate`

- **AC-27 — ED and falsifier closure:** ED-215 is closed only when the Phase-4 record-trust manifest names all G4.1–G4.6 falsifiers as required-present, each runs with zero skips, and ED-236 H5/C4 is recorded as adjacent rather than closed.  
  `verified_by:` `node scripts/checks/record-trust-gate.js --manifest .claude/project/sprint/sprints/SP-20260720-002/record-trust-gate.manifest.json --built` and `node scripts/checks/falsifier-liveness.js`

- **AC-28 — Non-vacuous positive path:** A valid, current bundle run with all required checks, correct hashes, current lease, and clean required lanes produces a successful integration, preventing reject-everything from satisfying the suite.  
  `verified_by:` `node --test scripts/dispatch/trusted-controller-positive-companion.test.js`