# SP-20260720-002 — RECORD-TRUST GATE (BLOCKING design→build exit)

> Applies `.claude/project/reference/record-trust-gate.md` doctrine to Phase 4. The CONTROLLER is precisely "a reader that trusts records to gate an irreversible action" — here the irreversible action is **merge-into-main** (higher blast radius than Phase-3 record-settling). BLOCKING: build-entry is refused unless EVERY enumerated trust surface names its choke-point + structural guard + session-scope partition AND every required-present falsifier below EXISTS and fails CLOSED (skips RED until its module is built, never green-on-absence). β runs its OWN independent 3-axis grep at this lock (write-to-main routing / 3-way require / no settable-field read in authz) — this registry is what β checks against.

## Canonical falsifier naming
Reconciled across the three design consults. Files live at `scripts/dispatch/falsifiers/*.falsifier.test.js` (Phase-3 shape). Positives at `*.positive.test.js`. The AC verified_by pointers in prd.md resolve to THESE paths (the binding names).

## Trust surfaces (choke-point + structural guard + session-scope + required-present falsifiers)

### Surface 1 — AcceptanceRecord → merge (CROSS-SESSION)
- **Choke-point:** `acceptance-record.js#commitIntegration` / `#authorizesIntegration` (in-primitive fail-closed: mandatory identity + freshness + lease + recompute + ancestry — EXISTS) + the Phase-4 pinned external trusted checker (the definitive NON-lexical close of the ED-215/ED-236-H5 ceiling).
- **Structural guard:** `acceptance-read-choke-point.js` (lexical, retained as defense-in-depth) + the CONTROLLER's re-derive discipline (never adopt a provider record).
- **Session-scope:** CROSS-SESSION → content-addressed git identity, NEVER per-session HMAC (already correct in acceptance-record.js).
- **Required-present falsifiers:**
  | file | gate/rider | AC | attack | exact BLOCK reason | reachability |
  |---|---|---|---|---|---|
  | `self-asserted-accept-over-failing-tree.falsifier.test.js` | rider-1 | AC-4 | envelope claims accept over a tree the fresh pinned run FAILS | `self-asserted-over-failing-check` | bundle ran + a check-failed FIRED, commitIntegration never reached; positive: `self-asserted-accept.positive.test.js` |
  | `head-advanced-after-check.falsifier.test.js` | G4.2 | AC-5 | head advances between check and commit | `head-advanced-after-check` (delegates to primitive `validation-to-merge-race`) | control: unmoved head → integrates |
  | `unbrokered-merge-bypass.falsifier.test.js` | G4.4 | AC-10 | direct update-ref/merge on main around the controller | `unbrokered-ref-mutation` | positive: `brokered-merge.positive.test.js` (same tree via controller → CAS ok) |
  | `write-surface-delegation-completeness.falsifier.test.js` | G4.4 | AC-11 | each of update-ref/merge/push/fast-forward un-brokered | per-verb refusal; named-uncovered (core.hooksPath/hook-delete/.git FS write) asserted NAMED | evidence: reftxn-probe-evidence.md |
  | `precommit-bypass-harmless.falsifier.test.js` | G4.4 | AC-12 | `--no-verify` candidate | integration requires a NEW controller AcceptanceRecord | proves the boundary is the controller, not pre-commit |
- **Retained EXISTS (Phase-3):** `forged-acceptance-record`, `self-asserted-success`, `stale-base`, `superseded-lease`, `validation-to-merge-race`, `acceptance-choke-point-bypass` falsifiers — do NOT remove.

### Surface 2 — Pinned checker bundle → which checker runs (same-session, content-addressed)
- **Choke-point:** `pinned-checker-bundle.js#runPinnedSuite` (verifyBundle BEFORE execute + out-of-tree require + pre/post digest).
- **Structural guard:** content-hash pin (bundle_digest) + `resolveExecutable` REFUSES any resolution inside candidateRoot/repo/temp + preDigest===postDigest fence. Nothing in the candidate tree influences the runner or resolves the executable.
- **Session-scope:** same-session (the trusted verifier builds+pins the bundle; content-addressed).
- **Required-present falsifiers:**
  | file | gate | AC | attack | reason | reachability |
  |---|---|---|---|---|---|
  | `checker-poisoning.falsifier.test.js` | G4.1 | AC-14 | candidate edits own enforcer/CLAUDE.md/AGENTS.md/shim | `checker-not-from-pinned-bundle` | spy: resolver called with out-of-tree pinned path; executed digest === pinned manifest digest; positive: `checker-poisoning.positive.test.js` |
  | `checker-self-modification.falsifier.test.js` | G4.6 | AC-16 | checker rewrites itself mid-run | `checker-mutated-mid-run` | both pre+post hash spy-called; control: stable checker → ok |
  | `pinned-bundle-path-symlink.falsifier.test.js` | — | AC-15 | hostile PATH / symlink resolution | resolution-outside-candidate assertion trips | — |
  | `bundle-hash-mismatch.falsifier.test.js` | — | AC-13 | supplied content-hash ≠ promoted pin | BLOCK before execute | — |

### Surface 3 — shared check-library reachability + drift
- **Choke-point:** the ONE `scripts/dispatch/check-lib/index.js` module require()'d by all 3 consumers (hook / pre-commit / controller-via-pinned-snapshot).
- **Structural guard:** `getCheck` THROWS on unknown; `runSuite.missing[]` surfaces a drifted name; controller reconcile → `missing-required-check` BLOCK; `scripts/checks/check-lib-single-source.js` greps zero re-implementations + asserts all 3 consumers require() the module (exit 1 on re-impl/drift; wired into /scan:full).
- **Required-present falsifiers:**
  | file | rider | AC | attack | reachability |
  |---|---|---|---|---|
  | `shared-check-library-reachability.falsifier.test.js` | rider-4 | AC-19 | — | spy proves the shared check FIRED via EACH of the 3 consumers (assert invocation, not import); positive: `shared-check-library-3consumer.positive.test.js` |
  | `shared-check-library-export-drift.falsifier.test.js` | rider-4 | AC-18 | a required export is renamed/mis-named | consumer CATCHES it (`check-export-missing` BLOCK), NOT silently skipped (fail-open) |

### Surface 4 — run-manifest default-deny (8 modes, distinct reasons — the dead-gate defense)
- **Choke-point:** `trusted-controller.js#reconcileRunManifest` over the nonce-bound run manifest.
- **Structural guard:** nonce-freshness — a result with a different/absent nonce is `stale`; presence alone NEVER passes; a nonce-fresh FIRED result is required.
- **Structural guard (β R1 — settable check-set provenance, BINDING pre-CONTROLLER):** `expected_checks`/`required_checks` are minted FROM the pinned bundle's FROZEN `CHECK_NAMES`/`REQUIRED_CHECKS`, NEVER from `input.expected_checks`; `runPinnedSuite` executes the pinned bundle's FULL CHECK_NAMES; `input.expected_checks?` may ONLY additively constrain (`input ⊆ bundle.CHECK_NAMES` / require MORE), never shrink required below the bundle's REQUIRED_CHECKS. This closes the empty/shrunk-expected-set vacuous-pass bypass on the sole route into main.
- **Required-present falsifiers (8 SEPARATE files for individual diagnosability — the distinct-reason contract; NOT a shared `not-authorized`):** `default-deny-missing-check` (`missing-required-check`), `default-deny-duplicate-check` (`duplicate-check-result`), `default-deny-unknown-check` (`unknown-check-result`), `default-deny-stale-check` (`stale-check-result`), `default-deny-malformed-check` (`malformed-check-result`), `default-deny-timedout-check` (`check-timed-out`), `default-deny-skipped-required-check` (`required-check-skipped`), `default-deny-crashed-check` (`check-failed`). Each `.falsifier.test.js`, each asserts its EXACT distinct reason. **+ `caller-cannot-shrink-check-set.falsifier.test.js` (β R1, AC-7b):** caller passes `expected_checks=[]` / a shrunk-required set over a tree that FAILS a required check → still REFUSED (the pinned required check FIRES + fails; assert it fired, reachability). AC-7. Shared positive: `run-manifest-satisfied.positive.test.js` (all expected present+passing+correct-nonce → authorizes).

### Surface 5 — helm-runner exit-proof (sol-A3, supersedes G4.5)
- **Choke-point:** `helm-runner.js` via `panel-lanes.panelStatus` required/optional semantics; every integration through the ONE controller.
- **Structural guard:** panel-2family floor; absent-optional ≠ pass-of-required; optional-ran-FAILED binds; ZERO agy attested:true / ZERO spike.
- **Required-present falsifiers:** `sol-a3-required-lane-killed.falsifier.test.js` (AC-22, `required-lane-failed`, never PASS) · `sol-a3-optional-lane-semantics.falsifier.test.js` (AC-23, optional-ran-failed binds `optional-lane-ran-and-failed`; positive: `sol-a3-absent-optional-agy.positive.test.js` = absent agy → 2-family PASS) · `sol-a3-agy-route-not-served-proof.falsifier.test.js` (AC-24, an agy route/default string alone ≠ served proof).

### Surface 6 — AP-8 acceptance-record signature contract
- **Choke-point:** `trusted-controller.js` module-load `assertAcceptanceRecordContract()`.
- **Structural guard:** exact export names + BEHAVIORAL smoke (produce throws on non-SHA base; authorizesIntegration(bareEnvelope,ref)===false); drift THROWS at load (not `fn.length`).
- **Required-present falsifier:** `acceptance-record-signature-drift.falsifier.test.js` (rider-6, AC-2) — a drifted signature → controller load THROWS before any integration is attempted.

### Surface 7 — honest-promise scope (CORE-2 slice discipline)
- **Choke-point:** the shipped honest-promise statement + the CORE-2 conformance flip.
- **Structural guard:** binds ONLY the artifact-verification+integration slice.
- **Required-present falsifier:** `honest-promise-scope.falsifier.test.js` (AC-1) — the promise names the slice + does NOT assert capability-grant/protected-mutation coverage; conformance positive: CORE-2 slice binds, out-of-slice stays report_only.

## BONUS falsifiers (quality-lead — existing acceptance-record.js hardening, keep)
`forge-invalid-cannot-authorize.falsifier.test.js` (ED-240 forged-fixture self-guard), `produce-override-cannot-bypass-schema.falsifier.test.js` (ED-240b), `cas-newhead-binding-reachable.falsifier.test.js` (ED-238 CAS reachability `new-head-not-bound-candidate`). Not β riders — bonus coverage.

## Gate PASS predicate (mechanically checkable at design-lock + build-exit)
For every row above: the named `*.falsifier.test.js` EXISTS on disk AND (module unbuilt → skips RED / module built → the gate fires with the EXACT distinct reason) AND its positive companion exists and authorizes. Zero missing, zero fail-open, zero green-on-absence. A missing/green-on-absence falsifier = RED-by-skip = design-incomplete = build-entry REFUSED. Machine manifest: `record-trust-gate.manifest.json` (this dir); consumed by `scripts/checks/record-trust-gate.js --manifest ... --built` (AC-27) + `scripts/checks/falsifier-liveness.js`.
