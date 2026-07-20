# SP-20260720-002 — BUILD_SPEC (Phase 4: Trusted enforcement adapter)

> Authored by director-of-engineering (in-process, opus). Conductor folds: (1) the reference-transaction probe evidence into Seam E; (2) confirmation of the ACTUAL 6 β riders; (3) the canonical falsifier registry (record-trust-gate.md is binding). Build-on, not rebuild. Honest promise = artifact acceptance + integration ONLY; binds CORE-2's artifact-verification+integration SLICE only.

## FE/BE split + builders
No frontend lane (kernel-infra, domains:[]). Two backend-class units. **security-builder** = BUNDLE + integrity mechanics + the check-lib-single-source enforcer + G4.1/G4.6 fixtures. **backend-builder** = CONTROLLER + HELM-RUNNER + acceptance-record.js `check_suite_version` extension + protected-ref hook + CORE-2 flip + G4.2/G4.3/G4.4/G4.5 + rider-1 fixtures. **Integration-seam owner = backend-builder** (composes every trust seam; owns the final flip). Only shared production file = `scripts/dispatch/acceptance-record.js`, edited by backend-builder ONLY (additive).

## 1. Module boundaries + public export contracts

### 1.1 Unit BUNDLE (security-builder)
`scripts/dispatch/check-lib/index.js` — the ONE shared check module (bundle SOURCE; hooks+pre-commit consume source, controller consumes only the pinned snapshot). FIXED registry, NOT a plugin framework (generalized frameworks OUT).
```
SUITE_VERSION                       // e.g. "check-suite/v1" = the check_suite_version value the record binds
CHECK_NAMES     = Object.freeze([]) // canonical EXPECTED check-name enumeration (anti-drift contract)
REQUIRED_CHECKS = Object.freeze([]) // subset whose absence/skip is fatal
listChecks()            -> string[]
getCheck(name)          -> {name, run}   // THROWS on unregistered name (fail-closed — never undefined → never a silent skip)
runCheck(name, ctx)     -> {name, status, reason, evidence, digest}  // status ∈ pass|fail|skipped|timeout
runSuite(names, ctx)    -> {version, results:[], missing:[]}         // missing = requested-but-unregistered (drift signal)
```
Checks at `scripts/dispatch/check-lib/checks/<name>.js`, each `{name, run(ctx)->{status,reason,evidence}}`. Seed (extend the registry, never inline elsewhere): `false-green-envelope` (passed w/ zero files/commits/tests/evidence), `no-nul-bytes` (WRAP existing `scripts/checks/no-nul-bytes.js`, do not re-impl), `suite-completeness` (executed set === CHECK_NAMES).

`scripts/dispatch/pinned-checker-bundle.js` — content-addressed pin + out-of-tree integrity-fenced runner.
```
buildBundle({srcRoot,outRoot,suiteVersion,promotedBy}) -> {manifest,bundleRoot,manifestPath}  // controlled promotion; snapshot+hash into outRoot OUTSIDE the repo/candidate tree
loadBundleManifest(manifestPath) -> manifest   // THROWS on missing/unparseable/invalid (fail-closed)
verifyBundle(manifest,{bundleRoot}) -> {ok,mismatches:[]}   // re-hash every pinned file; hash≠pin → ok:false → BLOCK
resolveExecutable(manifest,toolId) -> absPath   // resolve by pinned realpath; REFUSE any resolution inside candidateRoot/repo/temp
runPinnedSuite(manifest,ctx,{bundleRoot,candidateRoot,nonce}) -> {version,results,missing,preDigest,postDigest,verified}
  // (1) verifyBundle BEFORE execute → BLOCK on mismatch (G4.1); (2) require the PINNED index.js (never in-tree),
  //     cwd/env pinned OUTSIDE candidateRoot, nothing in candidateRoot on PATH or resolving the exe;
  //     (3) stamp every result with ctx.nonce; (4) re-hash AFTER → postDigest, assert preDigest===postDigest (G4.6) else fail-closed
bundleContentDigest(manifest) -> string   // the single content-address (the pin)
```

### 1.2 Unit CONTROLLER (backend-builder)
`scripts/dispatch/trusted-controller.js` — the sole integration principal. ONE public entrypoint:
```
integrate(input, opts) -> {ok, decision, reason?, receipt?, runManifest}
```
- `input`: `{workorder, base_commit, result_commit, target_ref, result_envelope, expected_checks?}` — `result_envelope` is UNTRUSTED DATA (log/hint only); base/result commits are CLAIMS the controller re-resolves from real git.
- `opts`: `{bundleManifestPath, bundleRoot, spId, leaseRoot, gitRoot, performRefUpdate, treeResolver?, commitResolver?, ancestryResolver?, leaseTokenResolver?}` (resolver seams mirror acceptance-record injectables for hermetic falsifiers).
- **Module-load side effect (β rider 6 / AP-8):** `assertAcceptanceRecordContract()` at require time — asserts exact export names + a BEHAVIORAL smoke (`produce` throws on non-SHA base_commit; `authorizesIntegration(bareEnvelope,ref)===false`). Drift THROWS at load. Do NOT assert via `fn.length` (defaulted opts undercount).
Internal helpers (exported for falsifiers): `mintRunManifest(...)`, `reconcileRunManifest(runManifest, results) -> {ok,reason?,offending?}` (the G4.3 default-deny reducer), `recomputeBoundDigests({workorder,results,evidence,policySnapshot}) -> {workorder_digest,checker_digests,evidence_digests,policy_digest}`.
Shared additive edit (backend-builder ONLY): `acceptance-record.js` — add `check_suite_version` to produce() input+record+record_digest coverage; require it present+non-empty in authorizesIntegration (fail-closed if absent). Value read from the pinned bundle manifest, NEVER the envelope. Additive — every existing field/signature/guard preserved (AP-8).

### 1.3 Unit HELM-RUNNER (backend-builder)
`scripts/dispatch/helm-runner.js` — an entrypoint OVER the controller (NOT a parallel trusted route).
```
runHelms(input,opts) -> {status, perHelm:[], panel, integration?}   // clean-install flow per contracted helm × security profile; reduce via panel-lanes.panelStatus vs panel-2family; on PASS may drive exactly ONE integration THROUGH trusted-controller.integrate() ONLY
collectLaneEvidence(helm,runResult) -> lane   // {laneId,contractedProvider,observedProvider,fallback,alive,verdict,hasEvidence} from the dispatch control-plane record, never a self-claim
```
Pass `agyOperatorOwned:true` → absent agy lane = operator-owned-absent, NEVER a pass; ZERO attested:true for agy; reuse panelStatus fallback:false + observedProvider===contractedProvider coercion gate. `runHelms` NEVER calls produce/authorizesIntegration/commitIntegration.

### 1.4 Unit FIXTURES/CONFORMANCE (cross-cutting; see record-trust-gate.md for the binding registry)
`scripts/dispatch/falsifiers/*.falsifier.test.js` (Phase-3 shape: skip-RED until unit lands → full-valid context so the gate is REACHED → attack ONE variable → REACHABILITY proof [exact reason / spy-called / positive control], never bare outcome===false). `scripts/checks/check-lib-single-source.js` (β rider 4 enforcer — greps zero inline re-impls of any CHECK_NAMES entry outside check-lib/checks/, asserts all 3 consumers require() check-lib; exit 1 on re-impl/drift; wired into /scan:full). CORE-2 flip: `.claude/kernel/fixtures/trust-boundary/trusted-layer-sole-integrator.json` report_only:true→false, then `conformance-matrix.js --flip-gate` (require authorized:true), wire --enforce. Honest-promise statement + close ED-215 (note ED-236 H5). Owner LAST = backend.

## 2. Integration seams
- **Seam A — CONTROLLER → acceptance-record.js:** over hashes IT computed — `produce({workorder, base_commit, result_tree_hash=resolveTreeHash(result_commit), result_commit, target_ref, checker_digests, policy_digest, evidence_digests, check_suite_version, lease_fencing_token, route, fallback})` → `authorizesIntegration(record, target_ref, {integrationHead:base_commit, spId, leaseRoot, gitRoot})` must be true → `commitIntegration(record, target_ref, {expectedHead:base_commit, newHead:result_commit, performRefUpdate, spId, leaseRoot, gitRoot})` = the ONLY mutation into main (git atomic CAS). The controller does NOT route this through safe-spawn (safe-spawn git policy is READ-ONLY diff/status/rev-parse/log — the sanctioned mutating write lives inside commitIntegration by design).
- **Seam B — CONTROLLER → pinned BUNDLE:** require pinned-checker-bundle.js; loadBundleManifest(opts.bundleManifestPath) → runPinnedSuite(manifest,{nonce,...},{bundleRoot,candidateRoot}); read suite_version+bundle_digest from the pinned manifest (the check_suite_version source), NEVER require check-lib source directly.
- **Seam C — HELM-RUNNER → CONTROLLER:** helm-runner calls integrate() and nothing lower; same builder owns both (integrate() signature frozen in-worktree — no cross-worktree interface race).
- **Seam D — ONE check-lib, three consumers:** (a) Claude hook `scripts/hooks/check-lib-prevention.js` require("../dispatch/check-lib"); (b) git pre-commit require check-lib (fast feedback, EXPLICITLY non-authoritative — bypass proven harmless because the AUTHORITATIVE gate is the controller's out-of-tree pinned run); (c) controller → the PINNED copy via Seam B. check-lib-single-source.js proves zero re-impls.
- **Seam E — sole-route MECHANISM (β rider 2, EVIDENCE-GROUNDED):** `scripts/hooks/protected-ref-transaction.js` — a git `reference-transaction` hook. PROBE-CONFIRMED (git 2.54.0.windows.1, runtime/sp002-phase4/reftxn-probe-evidence.md): the hook FIRES on commit/update-ref/fast-forward/non-ff-merge to refs/heads/main (all phases) AND can ABORT a write (exit nonzero in the `prepared` phase → `update aborted`, ref not created) AND is NOT bypassed by --no-verify. For any transaction touching a protected ref (refs/heads/main) it requires the controller fence (current lease fencing token via conductor-lease.verifyToken, passed as a scoped env the controller sets ONLY around its own commitIntegration); absent/invalid fence → reject (non-zero → git aborts). Installer: extend `scripts/install-git-hooks.sh`.
  - **Write-surface enumeration (delegation-COMPLETE, no SP-002 blind spot):** update-ref / merge / fast-forward / non-ff-merge / branch -f / reset → ALL covered by the one reference-transaction hook (probe-verified). **Named-uncovered (operator-DROPPED, hostile-shell, OUT of honest promise):** core.hooksPath redirect, hook deletion, direct .git/refs FS write, a hostile process forging the fence.

## 3. Build order + merge policy (BUNDLE-first, controller-composes-last, flip-LAST)
1. **BUNDLE (security)** merges FIRST — self-contained (no controller dep): check-lib source + pinned-checker-bundle.js + immutable execution contract + G4.1/G4.6 fixtures + check-lib-single-source.js.
2. **CONTROLLER + HELM-RUNNER (backend)** merges SECOND — consumes the pinned bundle interface. In-worktree order: freeze integrate() → helm-runner → controller body (composes every seam) → protected-ref hook. Adds the acceptance-record.js check_suite_version extension + G4.2/G4.3/G4.4/G4.5 + rider-1 falsifiers.
3. **CORE-2 flip (backend, integration-seam owner)** merges LAST — set report_only:false; conformance-matrix.js --flip-gate must return authorized:true (refuses a red flip → safely reversible by reverting one line); wire --enforce.
Each builder in an isolated worktree; acceptance-record.js edited by backend-builder only.

## 4. Data shapes
### 4.1 Nonce-bound RUN MANIFEST (controller-minted; G4.3 anti-stale-evidence)
`{schema_version:"run-manifest/v1", nonce:<randomBytes16.hex>, minted_at, sp_id, lease_fencing_token, base_commit:<40hex>, result_commit:<40hex>, target_ref, suite_version, bundle_digest:<sha256>, expected_checks:[], required_checks:[]}`
`reconcileRunManifest(manifest, results)` — every branch a DISTINCT reason code (reachability, not a bare boolean); PASS only when every expected check has exactly one fresh, well-formed, terminal, passing result:
| Condition | reason code |
|---|---|
| expected check has no result | `missing-required-check` |
| >1 result for a name | `duplicate-check-result` |
| result name ∉ expected_checks | `unknown-check-result` |
| result nonce ≠ manifest.nonce | `stale-check-result` |
| result missing status/digest / wrong shape | `malformed-check-result` |
| status timeout | `check-timed-out` |
| status skipped on a required check | `required-check-skipped` |
| status fail | `check-failed` |
The controller injects manifest.nonce into the pinned-suite ctx; runPinnedSuite stamps every result; a different/absent nonce = stale. This is why a stale/fabricated non-empty digest map cannot satisfy the gate: presence never passes; a nonce-fresh FIRED result is required.
### 4.2 Content-addressed BUNDLE manifest (BUNDLE-minted)
`{schema_version:"checker-bundle/v1", suite_version, bundle_digest:<sha256 over sorted files-map+executables+config>, files:{<path>:<sha256>}, deps:{<module>:<sha256|builtin>}, config:{<frozen>:<value>}, executables:{node:<abs realpath proven OUTSIDE candidateRoot>}, promotion:{promoted_at,promoted_by,from_src_digest,prev_bundle_digest}, rollback:{prev_bundle_digest,prev_manifest_path}}`. verifyBundle re-hashes files pre/post-execute; preDigest===postDigest===bundle_digest is the fence. Binary-content hashing of node itself is OUT (OS-sandbox territory) — the pin is realpath + assert-outside-candidate.
### 4.3 AcceptanceRecord binding extension
New field `check_suite_version` (produce() binds it, covered by record_digest, authorizesIntegration requires present+non-empty, fail-closed). Recomputed digests: checker_digests/evidence_digests/policy_digest/workorder_digest computed by recomputeBoundDigests() from THIS run's actual FIRED outputs — never adopted from result_envelope; freshness enforced by the §4.1 run-manifest nonce reconciliation (each digest traces to a check that FIRED this run). NOTE: the digest maps are NOT recomputed against git objects inside acceptance-record.js (only the tree hash is) — the anti-stale guarantee is the controller's run-manifest reconciliation.

## 5. The ACTUAL 6 β riders (design-lock DECIDE B/0.89) — structurally satisfied
1. **CONTROLLER re-DERIVES never ADOPTS** — integrate() NEVER accepts a pre-built record; always produce()s over hashes it computed; result_envelope is DATA. Fixture: self-asserted-accept-over-failing-tree → REFUSED at reconcile (bundle ran + check-failed fired, commitIntegration never reached).
2. **SOLE-ROUTE = MECHANISM, ceiling NAMED** — reference-transaction hook (Seam E, probe-grounded) + commitIntegration CAS; write surfaces enumerated; adversarial shell named-out. Fixture: un-brokered-merge-bypass + delegation-completeness.
3. **PINNED BUNDLE hash-verify BEFORE execute + run OUTSIDE writable domain** — runPinnedSuite verify→execute→re-verify + resolveExecutable outside-candidate. Fixtures: G4.1 poisoned→BLOCK, G4.6 self-mod→detected.
4. **ONE check-lib, zero re-impls, exact contract, drift caught** — getCheck throws / runSuite.missing / reconcile missing-required-check; check-lib-single-source.js. Falsifiers assert REACHABILITY.
5. **HELM-RUNNER fail-closed, panel-2family floor, zero agy-as-proof** — panelStatus coercion + agyOperatorOwned; no produce/commit in helm-runner.
6. **AP-8 signature re-confirm** — assertAcceptanceRecordContract() at controller load (presence + behavioral smoke); drift THROWS.

## 6. Build precondition RESOLVED
DoE's flagged reference-transaction liveness probe is DONE (conductor-run, evidence in runtime/sp002-phase4/reftxn-probe-evidence.md) — Seam E is evidence-grounded; the G4.4 delegation-completeness fixture and the honest-promise ceiling are drawn from that evidence.
