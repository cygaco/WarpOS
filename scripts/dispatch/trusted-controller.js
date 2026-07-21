"use strict";
/**
 * trusted-controller.js — the SOLE integration principal (SP-20260720-002 Phase 4, unit CONTROLLER).
 *
 * WHAT PROBLEM THIS CLOSES (ED-215): Phase 0 DEFINED the CORE-2 trust boundary ("a provider-independent
 * trusted layer solely owns capability grants, protected mutation, verification, and integration-to-main")
 * but shipped no live MECHANISM. This module IS that mechanism for TWO of the four CORE-2 powers —
 * verification and integration-to-main — over the artifact-verification+integration SLICE (see the
 * honest-promise block, top-level-runtime-contract.md §1 P1.2). Capability grants and protected mutation
 * are NOT this module's job; ED-236 H5/C4 stays adjacent, not closed (see enforcement-debt.jsonl).
 *
 * ONE public entrypoint: `integrate(input, opts)`. Everything else is an internal helper exported ONLY so
 * the record-trust falsifier corpus can attack individual seams in isolation (mintRunManifest,
 * reconcileRunManifest, recomputeBoundDigests) — none of them is a second route into main.
 *
 * β rider 1 (CONTROLLER re-derives, never adopts): `input.result_envelope` is UNTRUSTED DATA — logged/
 * hinted at most, NEVER read to decide anything. Every commit identity, tree hash, checker result, and
 * digest this module binds into the AcceptanceRecord is RE-DERIVED from real git objects and a FRESH,
 * nonce-bound pinned-bundle run — never adopted from a caller's claim.
 *
 * β rider 2 (sole-route = MECHANISM, ceiling NAMED): this module performs the ONLY sanctioned mutating
 * write into a protected ref (via acceptance-record.js#commitIntegration's atomic git CAS,
 * `git update-ref <ref> <new> <expected>`), and `scripts/hooks/protected-ref-transaction.js` (Seam E) is
 * the git-level MECHANISM that requires a current fencing token — set ONLY around this module's own
 * commitIntegration call — for any write surface (`update-ref`/merge/push/fast-forward) touching that ref.
 * NAMED-UNCOVERED, evidence-grounded (runtime/sp002-phase4/reftxn-probe-evidence.md), operator-DROPPED,
 * hostile-shell: `core.hooksPath` redirect, hook deletion, a direct `.git/refs/**` filesystem write, a
 * hostile process forging the fence. Those require local shell + intent — adversarial containment,
 * explicitly OUT of this module's honest promise.
 *
 * β rider 6 / AP-8 (signature re-confirm at load, drift THROWS): `assertAcceptanceRecordContract()` runs
 * as a MODULE-LOAD side effect below — never `fn.length` (defaulted opts undercount) — asserting the exact
 * acceptance-record.js export surface PLUS a behavioral smoke (produce() throws on a non-SHA base_commit;
 * authorizesIntegration(bareEnvelope, ref) === false). A drifted signature throws before any integrate()
 * call is even reachable.
 *
 * β R1 (check-set provenance, BINDING): `mintRunManifest` derives `expected_checks`/`required_checks` FROM
 * the pinned bundle's FROZEN `CHECK_NAMES`/`REQUIRED_CHECKS` — never from `input.expected_checks`.
 * `input.expected_checks?` may ONLY additively constrain (assert `input ⊆ bundle.CHECK_NAMES`, and it may
 * mark MORE bundle-known names required-for-this-run) — it can NEVER shrink `required_checks` below the
 * bundle's own `REQUIRED_CHECKS` (a union, never a replace). `expected_checks` in the minted manifest is
 * ALWAYS the pinned bundle's full frozen `CHECK_NAMES` — `runPinnedSuite` (Seam B, unit BUNDLE) already
 * executes that full set regardless of any caller-supplied subset, so a caller passing `[]` or a shrunk set
 * cannot vacuously pass reconcile: the pinned required checks still fire, and a real failure among them
 * still refuses integration (`check-failed`). See `caller-cannot-shrink-check-set.falsifier.test.js`.
 *
 * The controller does NOT route the CAS through safe-spawn (safe-spawn's git policy is READ-ONLY diff/
 * status/rev-parse/log) — the sanctioned mutating write lives inside acceptance-record.js#commitIntegration
 * by design (build_spec §2 Seam A).
 *
 * No external deps. Windows + POSIX safe (no shell spawns of our own; every mutating write is delegated to
 * acceptance-record.js's already-audited spawnSync array-argv call).
 */

const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawnSync } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

const acceptanceRecord = require("./acceptance-record");
const pcb = require("./pinned-checker-bundle");
const lease = require("./conductor-lease");
const { workOrderDigest } = require("./workorder-schema");
const reftxn = require("../hooks/protected-ref-transaction");

// ── AP-8 / β rider 6 — the exact acceptance-record.js export surface this module depends on. ──────────────
const REQUIRED_ACCEPTANCE_EXPORTS = Object.freeze([
  "produce",
  "produceForTest",
  "forgeInvalidRecordForTest",
  "authorizesIntegration",
  "commitIntegration",
  "validateCommitIdentity",
  "resolveTreeHash",
  "resolveCommitSha",
  "defaultIsAncestor",
  "stableDigest",
]);

/**
 * assertAcceptanceRecordContract(mod?) — THROWS on ANY drift (missing export, non-function export, or a
 * failed BEHAVIORAL smoke). Never uses `fn.length` (defaulted opts make arity counting unreliable — a
 * signature can drift while `fn.length` stays identical). Exported so a falsifier can invoke it directly
 * against a deliberately-drifted stub without having to fight this module's own require-time side effect.
 */
function assertAcceptanceRecordContract(mod) {
  const m = mod || acceptanceRecord;
  if (!m || typeof m !== "object") {
    throw new Error("trusted-controller: acceptance-record.js contract drift — module did not export an object (AP-8)");
  }
  const missing = REQUIRED_ACCEPTANCE_EXPORTS.filter((k) => typeof m[k] !== "function");
  if (missing.length) {
    throw new Error(
      `trusted-controller: acceptance-record.js contract drift — missing/non-function export(s): ${missing.join(", ")} (AP-8 / β rider 6)`,
    );
  }

  // BEHAVIORAL smoke (a) — produce() MUST throw on a non-SHA base_commit (ED-238 by-construction guard).
  let producedThrew = false;
  try {
    m.produce({
      workorder: "wo",
      terminal_state: "success",
      target_ref: "refs/heads/x",
      base_commit: "not-a-sha",
      result_commit: "c".repeat(40),
    });
  } catch {
    producedThrew = true;
  }
  if (!producedThrew) {
    throw new Error(
      "trusted-controller: acceptance-record.js contract drift — produce() no longer throws on a non-SHA base_commit (AP-8 behavioral smoke failed)",
    );
  }

  // BEHAVIORAL smoke (b) — authorizesIntegration(bareEnvelope, ref) MUST be exactly false (a self-asserted
  // ResultEnvelope, not a real record, must never authorize).
  let authz;
  try {
    authz = m.authorizesIntegration({ success: true, verdict: "accept" }, "refs/heads/main");
  } catch {
    authz = true; // a throw here is itself drift — force the failure branch below
  }
  if (authz !== false) {
    throw new Error(
      "trusted-controller: acceptance-record.js contract drift — authorizesIntegration(bareEnvelope, ref) did not return false (AP-8 behavioral smoke failed)",
    );
  }
}

// Module-load side effect (β rider 6 / AP-8): drift THROWS before any integrate() call is reachable.
assertAcceptanceRecordContract();

// ── Seam B — require ONLY the pinned bundle's frozen check-lib copy, never the live in-tree source. ───────

/**
 * loadPinnedCheckLib(bundleManifest, opts) -> the pinned module's exports ({SUITE_VERSION, CHECK_NAMES,
 * REQUIRED_CHECKS, ...}). Reuses pinned-checker-bundle.js's OWN exported primitives (verifyBundle,
 * resolveExecutable, assertOutsideZones, assertCheckLibExports) — the exact same resolution discipline
 * `runPinnedSuite` itself performs (Seam B) — so this "peek" for the run-manifest mint can never diverge
 * from what actually executes. THROWS (fail-closed) on any verification/resolution/export-contract failure;
 * every throw carries a `.code` matching the reason vocabulary `runPinnedSuite` itself uses.
 */
function loadPinnedCheckLib(bundleManifest, opts = {}) {
  const bundleRoot = path.resolve(opts.bundleRoot || "");
  const candidateRoot = opts.candidateRoot;

  // FIX-4a (QA-004/RT-602): reject a non-empty-but-INCOMPLETE manifest before any hashing — a manifest
  // missing a registered check module is not "self-consistent," it is a hole the empty-set attack also
  // exploits (a manifest naming only `lib/index.js` with no `lib/checks/*.js` entries).
  const completeness = pcb.assertBundleCompleteness(bundleManifest, { bundleRoot });
  if (!completeness.ok) {
    const err = new Error(
      `trusted-controller: pinned bundle manifest is incomplete — missing: ${completeness.missing.join(", ")} (empty/incomplete-bundle-manifest)`,
    );
    err.code = "incomplete-bundle-manifest";
    throw err;
  }

  const pre = pcb.verifyBundle(bundleManifest, { bundleRoot });
  if (!pre.ok) {
    const err = new Error("trusted-controller: pinned bundle failed verification before mint (bundle-pin-mismatch)");
    err.code = "bundle-pin-mismatch";
    throw err;
  }

  // FIX-4b (QA-004/RT-602/RT-603, β R2 load-bearing at merge-time) + S3(1) R2 (BE-CQ-P4-R2-002 +
  // SR-R2-001, SELF-AUTHENTICATING BUNDLE): lineage is a THREE-way identity, and the first leg binds the
  // bundle's OWN `lib/` CONTENTS:
  //
  //     sourceDigestOf(bundleRoot/lib) === manifest.promotion.from_src_digest === sourceDigestOf(live src)
  //
  // R1 compared ONLY the last two — and `promotion.from_src_digest` is a CALLER-AUTHORED manifest field.
  // An attacker just SETS it to the (publicly readable) live-source digest while shipping an arbitrary
  // `lib/index.js`: the claim matched, nothing ever bound the bundle's actual bytes, and a self-authored
  // check-lib exporting an all-pass `runSuite` was accepted (security's confirmed end-to-end repro). Binding
  // the RECOMPUTED digest of what is actually on disk under `bundleRoot/lib` makes the manifest's claim
  // unforgeable: to satisfy it, the bundle's contents must genuinely BE the live check-lib source.
  //
  // NOTE the digest-domain identity this relies on: `buildBundle` promotes via `copyTreeInto(srcRoot, lib/)`
  // — a faithful, relative-structure-preserving copy — and `sourceDigestOf` is a pure walk of a root, so
  // `sourceDigestOf(bundleRoot/lib) === sourceDigestOf(srcRoot)` for any honestly-promoted bundle, BY
  // CONSTRUCTION. A drifted-but-honestly-promoted bundle (the FIX-4b falsifier) still fails on the SECOND
  // leg with the distinct `bundle-lineage-mismatch` code; a self-authored bundle fails on the FIRST with
  // `bundle-content-lineage-mismatch`.
  const bundleLibRoot = path.join(bundleRoot, "lib");
  if (!fs.existsSync(bundleLibRoot) || !fs.statSync(bundleLibRoot).isDirectory()) {
    const err = new Error(`trusted-controller: pinned bundle has no lib/ directory at ${bundleLibRoot} — cannot bind bundle contents to the promotion claim`);
    err.code = "bundle-lineage-unresolvable";
    throw err;
  }
  let bundleLibDigest;
  try {
    bundleLibDigest = pcb.sourceDigestOf(bundleLibRoot);
  } catch (e) {
    const err = new Error(`trusted-controller: cannot compute the pinned bundle's own lib/ content digest: ${e.message}`);
    err.code = "bundle-lineage-unresolvable";
    throw err;
  }

  const checkLibSrcRoot = opts.checkLibSrcRoot || pcb.DEFAULT_LIB_SRC;
  let freshSrcDigest;
  try {
    freshSrcDigest = pcb.sourceDigestOf(checkLibSrcRoot);
  } catch (e) {
    const err = new Error(`trusted-controller: cannot compute the live check-lib source digest for lineage verification: ${e.message}`);
    err.code = "bundle-lineage-unresolvable";
    throw err;
  }
  const pinnedSrcDigest = bundleManifest.promotion && bundleManifest.promotion.from_src_digest;

  // LEG 1 — the bundle's ACTUAL contents must equal what its promotion record CLAIMS it was promoted from.
  // A caller-authored `from_src_digest` that does not describe the bytes on disk is a forged provenance.
  if (!pinnedSrcDigest || pinnedSrcDigest !== bundleLibDigest) {
    const err = new Error(
      "trusted-controller: pinned bundle's OWN lib/ contents do not hash to its promotion.from_src_digest — the promotion claim is not backed by the bundle's actual bytes (self-authored/forged bundle, S3(1))",
    );
    err.code = "bundle-content-lineage-mismatch";
    throw err;
  }
  // LEG 2 — and that promoted source must still be the LIVE check-lib source (no drift since promotion).
  if (pinnedSrcDigest !== freshSrcDigest) {
    const err = new Error(
      "trusted-controller: pinned bundle promotion.from_src_digest does not match the LIVE check-lib source (β R2 lineage — re-promote the bundle before integrating)",
    );
    err.code = "bundle-lineage-mismatch";
    throw err;
  }

  try {
    pcb.resolveExecutable(bundleManifest, "node", { candidateRoot, repoCheckLibRoot: pcb.DEFAULT_LIB_SRC });
  } catch (e) {
    e.code = e.code || "resolution-outside-candidate";
    throw e;
  }

  const pinnedIndexPath = path.join(bundleRoot, "lib", "index.js");
  let real;
  try {
    real = pcb.assertOutsideZones(pinnedIndexPath, { candidateRoot, repoCheckLibRoot: pcb.DEFAULT_LIB_SRC }, "checker-not-from-pinned-bundle");
  } catch (e) {
    e.code = e.code || "checker-not-from-pinned-bundle";
    throw e;
  }

  let pinnedIndex;
  try {
    delete require.cache[real];
    // eslint-disable-next-line global-require, import/no-dynamic-require
    pinnedIndex = require(real);
  } catch (e) {
    const err = new Error(`trusted-controller: failed to require the pinned check-lib copy: ${e.message}`);
    err.code = "pinned-index-require-failed";
    throw err;
  }

  const contract = pcb.assertCheckLibExports(pinnedIndex);
  if (!contract.ok) {
    const err = new Error(`trusted-controller: pinned check-lib export contract drift — missing: ${contract.missing.join(", ")}`);
    err.code = "check-export-missing";
    throw err;
  }

  return pinnedIndex;
}

// ── §4.1 run-manifest mint (β R1 — check-set provenance, BINDING). ─────────────────────────────────────────

/**
 * mintRunManifest(input, opts, ctx) -> a nonce-bound run manifest (build_spec §4.1). `ctx` carries the
 * already-resolved bundle manifest + pinned check-lib peek + real commit identity — this function is PURE
 * over those inputs (no fs/git of its own) so falsifiers can drive it directly with synthetic ctx values.
 * THROWS (`.code === 'expected-checks-not-in-bundle'`) when `input.expected_checks` names anything outside
 * the pinned bundle's frozen `CHECK_NAMES` — the assert-subset half of β R1.
 */
function mintRunManifest(input, opts, ctx) {
  const bundleCheckNames = ctx.pinnedIndex.CHECK_NAMES.slice();
  const bundleRequired = ctx.pinnedIndex.REQUIRED_CHECKS.slice();

  // FIX-4d (empty-expected-check-set floor): a pinned bundle whose frozen CHECK_NAMES is empty must never
  // mint a vacuous run manifest — reconcile would trivially "pass" over zero expected checks. check-lib's
  // own load-time guard (FIX-4c) should make this unreachable for the real registry, but mintRunManifest is
  // also driven directly by falsifiers with synthetic `ctx.pinnedIndex` — defense-in-depth, not redundant.
  if (!Array.isArray(bundleCheckNames) || bundleCheckNames.length === 0) {
    const err = new Error("trusted-controller: pinned bundle's CHECK_NAMES is empty — refusing to mint a vacuous run manifest");
    err.code = "empty-expected-check-set";
    throw err;
  }

  const requested = Array.isArray(input.expected_checks) ? input.expected_checks : [];
  const invalid = requested.filter((n) => !bundleCheckNames.includes(n));
  if (invalid.length) {
    const err = new Error(
      `trusted-controller: input.expected_checks names not present in the pinned bundle's CHECK_NAMES (rejected, β R1): ${invalid.join(", ")}`,
    );
    err.code = "expected-checks-not-in-bundle";
    throw err;
  }

  // β R1: required_checks is a UNION of the bundle's own REQUIRED_CHECKS with any additional bundle-known
  // names the caller wants elevated to required-for-this-run — it can only GROW, never shrink below the
  // bundle's floor, no matter what (or how little) the caller passes (including `[]`).
  const required = Array.from(new Set([...bundleRequired, ...requested]));

  return {
    schema_version: "run-manifest/v1",
    nonce: crypto.randomBytes(16).toString("hex"),
    minted_at: Date.now(),
    sp_id: opts.spId != null ? opts.spId : null,
    lease_fencing_token: ctx.leaseToken != null ? ctx.leaseToken : null,
    base_commit: ctx.baseCommit,
    result_commit: ctx.resultCommit,
    target_ref: ctx.targetRef,
    suite_version: ctx.pinnedIndex.SUITE_VERSION,
    bundle_digest: ctx.bundleManifest.bundle_digest,
    // β R1: ALWAYS the pinned bundle's full frozen set — runPinnedSuite executes exactly this set
    // regardless of any caller-supplied subset (never a caller-supplied subset, by construction).
    expected_checks: bundleCheckNames,
    required_checks: required,
  };
}

// ── §4.1 default-deny reconciliation (G4.3 / AC-7 / AC-7b — 8 distinct-reason branches). ───────────────────

/**
 * reconcileRunManifest(runManifest, results) -> {ok, reason?, offending?}. PURE. Every branch below is a
 * DISTINCT, machine-checkable reason code (the "dead-gate defense" — a shared `not-authorized` collapse is
 * a no-ship per record-trust-gate.md Surface 4). PASS only when every one of `runManifest.expected_checks`
 * has EXACTLY one fresh (nonce-matching), well-formed, terminal, passing result.
 */
function reconcileRunManifest(runManifest, results) {
  if (
    !runManifest ||
    typeof runManifest !== "object" ||
    !Array.isArray(runManifest.expected_checks) ||
    !Array.isArray(runManifest.required_checks) ||
    typeof runManifest.nonce !== "string" ||
    !runManifest.nonce
  ) {
    return { ok: false, reason: "malformed-run-manifest" };
  }
  // FIX-4d (empty-expected-check-set floor): an empty `expected_checks` array is well-formed (passes the
  // Array.isArray checks above) but VACUOUS — the `for (const name of expected)` loop below would simply
  // never iterate, so `reconcileRunManifest` would silently return `{ok:true}` over zero obligations. Fail
  // closed explicitly, with its own distinct reason code, rather than relying on an empty loop's incidental
  // pass-through.
  if (runManifest.expected_checks.length === 0) {
    return { ok: false, reason: "empty-expected-check-set" };
  }

  const expected = runManifest.expected_checks;
  const required = new Set(runManifest.required_checks);
  const resultsArr = Array.isArray(results) ? results : [];
  const byName = new Map();

  for (const r of resultsArr) {
    const shapeOk =
      r && typeof r === "object" && typeof r.name === "string" && r.name && typeof r.status === "string" && typeof r.digest === "string" && r.digest;
    if (!shapeOk) {
      return { ok: false, reason: "malformed-check-result", offending: r && r.name };
    }
    if (!expected.includes(r.name)) {
      return { ok: false, reason: "unknown-check-result", offending: r.name };
    }
    if (r.nonce !== runManifest.nonce) {
      return { ok: false, reason: "stale-check-result", offending: r.name };
    }
    if (byName.has(r.name)) {
      return { ok: false, reason: "duplicate-check-result", offending: r.name };
    }
    byName.set(r.name, r);
  }

  for (const name of expected) {
    const r = byName.get(name);
    if (!r) {
      return { ok: false, reason: "missing-required-check", offending: name };
    }
    if (r.status === "timeout") {
      return { ok: false, reason: "check-timed-out", offending: name };
    }
    if (r.status === "skipped") {
      if (required.has(name)) return { ok: false, reason: "required-check-skipped", offending: name };
      continue; // an optional expected check may legitimately skip
    }
    if (r.status === "fail") {
      return { ok: false, reason: "check-failed", offending: name };
    }
    if (r.status !== "pass") {
      return { ok: false, reason: "malformed-check-result", offending: name };
    }
  }

  return { ok: true };
}

// ── §4.3 AcceptanceRecord binding — recompute over THIS run's fired outputs, never the envelope. ───────────

/**
 * recomputeBoundDigests({workorder, results, evidence, policySnapshot}) -> {workorder_digest,
 * checker_digests, evidence_digests, policy_digest}. PURE. `checker_digests` is built ONLY from the
 * pinned-suite `results` this run actually produced (name -> its own digest, which `check-lib` already
 * stamps per-result) — never adopted from a caller. `policy_digest` covers a caller-injected snapshot of
 * the effective policy this run bound to (bundle identity, suite version) — deterministic, content-
 * addressed, never a caller-supplied string.
 */
function recomputeBoundDigests(args = {}) {
  const { workorder, results, evidence, policySnapshot } = args;

  const checker_digests = {};
  for (const r of Array.isArray(results) ? results : []) {
    if (r && typeof r === "object" && typeof r.name === "string" && r.name && typeof r.digest === "string" && r.digest) {
      checker_digests[r.name] = r.digest;
    }
  }

  const evidence_digests = {};
  const evidenceObj = evidence && typeof evidence === "object" ? evidence : {};
  for (const [k, v] of Object.entries(evidenceObj)) {
    evidence_digests[k] = typeof v === "string" && v ? v : acceptanceRecord.stableDigest(v == null ? { k } : v);
  }

  const workorder_digest =
    typeof workorder === "string" && workorder
      ? workorder
      : workorder && typeof workorder === "object"
        ? workorder.workorder_digest || workOrderDigest(workorder)
        : "";

  const policy_digest = acceptanceRecord.stableDigest(policySnapshot && typeof policySnapshot === "object" ? policySnapshot : {});

  return { workorder_digest, checker_digests, evidence_digests, policy_digest };
}

// ── result-tree materialization (FIX-1 / QA-003 / RT-601). ─────────────────────────────────────────────────

/**
 * materializeResultTree(resultCommit, {gitRoot, treeResolver}) -> {dir, treeHash, cleanup()}. FIX-1
 * (QA-003/RT-601): materializes EXACTLY `resultCommit`'s git tree into a FRESH, OUT-of-candidate temp
 * directory via `git worktree add --detach` — the pinned suite scans THIS materialized tree, never the
 * caller's mutable `gitRoot` working tree (which may not even be checked out AT resultCommit at all, or
 * may have been mutated since the caller last touched it). Verifies the materialized checkout's OWN tree
 * hash === the resolved `resultCommit` tree hash BEFORE returning; the caller (`integrate()`) re-verifies
 * AFTER the pinned suite runs, closing the same mid-run tamper window `pinned-checker-bundle.js`'s own
 * pre/post verify already closes for the checker bundle itself. THROWS (fail-closed, `.code` set) on any
 * git failure or a hash mismatch — never returns a directory the caller hasn't confirmed is the right tree.
 */
function materializeResultTree(resultCommit, opts = {}) {
  const gitRoot = opts.gitRoot;
  const resolveTree = typeof opts.treeResolver === "function" ? opts.treeResolver : acceptanceRecord.resolveTreeHash;
  const expectedTree = resolveTree(resultCommit, { gitRoot });
  if (!expectedTree) {
    const err = new Error(`trusted-controller: result_commit's tree hash is unresolvable — cannot materialize (${resultCommit})`);
    err.code = "result-tree-unresolvable";
    throw err;
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sp002-materialize-"));
  const cleanup = () => {
    try {
      spawnSync("git", ["worktree", "remove", "--force", tmpDir], { cwd: gitRoot, encoding: "utf8", windowsHide: true });
    } catch {
      /* best-effort */
    }
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  };

  const add = spawnSync("git", ["worktree", "add", "--detach", "-q", tmpDir, resultCommit], {
    cwd: gitRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (!add || add.status !== 0) {
    cleanup();
    const err = new Error(
      `trusted-controller: 'git worktree add --detach' failed to materialize result_commit ${resultCommit}: ${(add && (add.stderr || add.error)) || "unknown error"}`,
    );
    err.code = "result-tree-materialize-failed";
    throw err;
  }

  // Verify the materialized checkout's OWN tree hash === the resolved result_commit tree — belt-and-
  // suspenders over git worktree's own guarantee, and the SAME resolver seam so a hermetic test can drive
  // both sides deterministically.
  const verifyResolver = typeof opts.materializedTreeResolver === "function" ? opts.materializedTreeResolver : acceptanceRecord.resolveTreeHash;
  const observedTree = verifyResolver("HEAD", { gitRoot: tmpDir });
  if (!observedTree || String(observedTree).toLowerCase() !== String(expectedTree).toLowerCase()) {
    cleanup();
    const err = new Error(`trusted-controller: materialized tree hash mismatch for result_commit ${resultCommit} (expected ${expectedTree}, observed ${observedTree})`);
    err.code = "result-tree-materialize-mismatch";
    throw err;
  }

  return { dir: tmpDir, treeHash: expectedTree, cleanup };
}

// ── Seam E fence scoping — set ONLY around this module's own commitIntegration call. ───────────────────────

/**
 * withControllerFence(spId, leaseToken, leaseRoot, fn) — sets the 3 scoped env vars
 * `protected-ref-transaction.js` requires for a protected-ref write, runs `fn()`, and restores the prior
 * env state in a `finally` — regardless of outcome. This is the ONLY place this module ever sets those
 * vars, and it wraps ONLY the commitIntegration call (never the checker run, never authorizesIntegration).
 */
function withControllerFence(spId, leaseToken, leaseRoot, fn) {
  const keys = [reftxn.FENCE_TOKEN_ENV, reftxn.FENCE_SPID_ENV, reftxn.FENCE_LEASEROOT_ENV];
  const prev = keys.map((k) => process.env[k]);
  process.env[reftxn.FENCE_TOKEN_ENV] = leaseToken != null ? String(leaseToken) : "";
  process.env[reftxn.FENCE_SPID_ENV] = spId != null ? String(spId) : "";
  process.env[reftxn.FENCE_LEASEROOT_ENV] = leaseRoot != null ? String(leaseRoot) : "";
  try {
    return fn();
  } finally {
    keys.forEach((k, i) => {
      if (prev[i] === undefined) delete process.env[k];
      else process.env[k] = prev[i];
    });
  }
}

/** defaultLeaseTokenResolver(spId, leaseRoot) -> the CURRENT holder's token for spId, or null. Never a
 *  caller-asserted value — always read fresh from the lease store (conductor-lease.js). */
function defaultLeaseTokenResolver(spId, leaseRoot) {
  if (spId == null) return null;
  try {
    const holder = lease.status(spId, { root: leaseRoot });
    return holder ? holder.token : null;
  } catch {
    return null;
  }
}

// ── hook install-liveness precondition (FIX-3 / QA-001 / RT-604). ──────────────────────────────────────────

/**
 * verifyActiveHookInstalled({gitRoot, pinnedHookSrcPath}) -> {ok, reason?, hooksDir?, hookPath?}. FIX-3
 * (QA-001/RT-604): a FAIL-CLOSED PRECONDITION of integration. The falsifier corpus proving Seam E's
 * `reference-transaction` mechanism (unbrokered-merge-bypass, write-surface-delegation-completeness, etc.)
 * installs a SCRATCH hook into a throwaway repo — that proves the MECHANISM works, never that THIS repo's
 * ACTUAL, currently-configured hooks directory is genuinely fenced. This function resolves the repo's REAL
 * active hooks directory via `git rev-parse --git-path hooks` (the ONE git-native way to honor
 * `core.hooksPath`, a worktree's separate gitdir, and every other resolution rule — never a hardcoded
 * `.git/hooks` guess), then verifies a `reference-transaction` file EXISTS there, is readable, references
 * the pinned `scripts/hooks/protected-ref-transaction.js` module (which must itself exist on disk), and —
 * on POSIX — carries an executable bit. An absent/wrong/un-wired ACTIVE hook REFUSES integration.
 *
 * S4 R2 (QA-SP002-001 / QA-SP002-R2-001) — "references" is now PROVEN INVOCATION, not a name substring.
 * R1 accepted any hook whose content matched `/protected-ref-transaction(\.js)?/`, so a no-op hook
 * (`# protected-ref-transaction.js` + `exit 0`) — a plausible MISTAKE (a mis-generated / truncated /
 * corrupted installer output that keeps the name comment) — verified as "pinned" while enforcing NOTHING.
 * The predicate is now two-tier, and BOTH tiers prove the pinned module is actually EXECUTED:
 *   (a) FAST PATH — the active hook's content is byte-identical to the canonical wrapper
 *       `protected-ref-transaction.js#renderReferenceTransactionHook(pinnedHookSrc)` (the exact text the
 *       sanctioned installer writes). One in-repo source for install AND verify: they cannot drift.
 *   (b) STRUCTURAL PATH — for a hand-installed/legacy variant, `extractPinnedHookInvocation` parses the
 *       hook for a real INVOCATION line (comment lines are stripped first — a name in a comment proves
 *       nothing) naming a path that ends in `protected-ref-transaction.js`, resolves that path (absolute,
 *       or relative to hooksDir/gitRoot/PROJECT_ROOT), and requires its REALPATH to equal the realpath of
 *       the pinned module. A hook that invokes nothing, or invokes a DIFFERENT file, is REFUSED.
 *
 * HONEST CEILING (unchanged): hook file DELETION by a hostile shell, a hostile `core.hooksPath` redirect
 * performed WITH matching hook content planted at the new location, or a hostile rewrite of the pinned
 * module itself, stay operator-DROPPED — this closes the MISTAKE-class defects (not-installed, no-op/
 * corrupted content, wrong module), never adversarial containment.
 */

/** Lines that are entirely a shell comment prove nothing about what the hook EXECUTES. */
function stripHookComments(content) {
  return String(content || "")
    .split(/\r?\n/)
    .filter((raw) => {
      const line = raw.trim();
      return line && !line.startsWith("#");
    });
}

/**
 * extractPinnedHookInvocation(content) -> {line, rawPath} | null. Finds the first NON-COMMENT line that
 * both (i) looks like an invocation (`exec`, `node`, `source`, a leading `.`, or a JS `require(`) and
 * (ii) names a path token ending in `protected-ref-transaction.js`. Exported for the S4 teeth.
 */
function extractPinnedHookInvocation(content) {
  const INVOKES = /(^|\s)(exec|source|node(\.exe)?|\.)(\s|$)|require\s*\(/;
  const PATHTOK = /["']?([^"'\s]*protected-ref-transaction\.js)["']?/;
  for (const line of stripHookComments(content)) {
    if (!INVOKES.test(line)) continue;
    const m = line.match(PATHTOK);
    if (!m) continue;
    return { line, rawPath: m[1] };
  }
  return null;
}

function realpathOrNull(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return null;
  }
}

function verifyActiveHookInstalled(opts = {}) {
  const gitRoot = opts.gitRoot;
  const pinnedHookSrc = opts.pinnedHookSrcPath || path.resolve(__dirname, "..", "hooks", "protected-ref-transaction.js");
  if (!fs.existsSync(pinnedHookSrc)) {
    return { ok: false, reason: "pinned-hook-source-missing", pinnedHookSrc };
  }

  let gitPathOut;
  try {
    const r = spawnSync("git", ["rev-parse", "--git-path", "hooks"], { cwd: gitRoot, encoding: "utf8", windowsHide: true });
    if (!r || r.status !== 0) return { ok: false, reason: "hooks-dir-unresolvable" };
    gitPathOut = String(r.stdout || "").trim();
  } catch {
    return { ok: false, reason: "hooks-dir-unresolvable" };
  }
  if (!gitPathOut) return { ok: false, reason: "hooks-dir-unresolvable" };
  const hooksDir = path.isAbsolute(gitPathOut) ? gitPathOut : path.resolve(gitRoot, gitPathOut);
  const hookPath = path.join(hooksDir, "reference-transaction");

  if (!fs.existsSync(hookPath)) {
    return { ok: false, reason: "active-hook-not-installed", hooksDir, hookPath };
  }
  let content;
  try {
    content = fs.readFileSync(hookPath, "utf8");
  } catch (e) {
    return { ok: false, reason: "active-hook-unreadable", hooksDir, hookPath, detail: e.message };
  }
  // (a) FAST PATH — byte-identical to the canonical wrapper the sanctioned installer writes.
  const canonical = reftxn.renderReferenceTransactionHook(pinnedHookSrc);
  const contentIsCanonical = content.replace(/\r\n/g, "\n") === canonical;

  if (!contentIsCanonical) {
    // (b) STRUCTURAL PATH — prove the hook genuinely INVOKES the pinned module (never a name substring).
    const invocation = extractPinnedHookInvocation(content);
    if (!invocation) {
      // The exact case QA-SP002-001 named: a name-bearing NO-OP (`# protected-ref-transaction.js` + `exit 0`)
      // — the name appears, nothing is ever executed.
      return { ok: false, reason: "active-hook-not-pinned", hooksDir, hookPath, detail: "no resolvable invocation of the pinned protected-ref-transaction.js module (a name/comment is not an invocation)" };
    }
    const raw = invocation.rawPath;
    const candidates = path.isAbsolute(raw) ? [raw] : [path.resolve(hooksDir, raw), path.resolve(gitRoot || PROJECT_ROOT, raw), path.resolve(PROJECT_ROOT, raw)];
    const pinnedReal = realpathOrNull(pinnedHookSrc) || path.resolve(pinnedHookSrc);
    const matched = candidates.some((c) => {
      const real = realpathOrNull(c);
      return !!real && real === pinnedReal;
    });
    if (!matched) {
      return {
        ok: false,
        reason: "active-hook-not-pinned-module",
        hooksDir,
        hookPath,
        detail: `the active hook invokes '${raw}', which does not resolve to the pinned module ${pinnedReal}`,
      };
    }
  }
  if (process.platform !== "win32") {
    let st;
    try {
      st = fs.statSync(hookPath);
    } catch (e) {
      return { ok: false, reason: "active-hook-unreadable", hooksDir, hookPath, detail: e.message };
    }
    if ((st.mode & 0o111) === 0) {
      return { ok: false, reason: "active-hook-not-executable", hooksDir, hookPath };
    }
  }
  return { ok: true, hooksDir, hookPath };
}

// ── the ONE public entrypoint. ──────────────────────────────────────────────────────────────────────────

/**
 * PRODUCTION_OPT_KEYS — the EXACT, FROZEN set of `opts` keys the production entrypoint is allowed to read.
 *
 * S2 R2 (BE-CQ-P4-R2-001 + SR-R2-002, the ED-225-227 settable-label class): R1 removed ONE caller-suppliable
 * seam (`opts.checkContext`) and left NINE strictly more powerful ones — `hookLivenessCheckFn`,
 * `materializeResultTreeFn`, `materializedTreeResolver`, `treeResolver`, `commitResolver`,
 * `ancestryResolver`, `leaseTokenResolver`, `checkLibSrcRoot`, `liveHead` — each a WHOLE-PREDICATE override
 * gated only by a docstring saying "test-only". A comment is not a boundary: any caller of `integrate()`
 * (and, via a verbatim `controllerOpts` spread, any caller of `helm-runner.js#runHelms`) could hand in
 * `hookLivenessCheckFn: () => ({ok:true})` and bypass the FIX-3 hook precondition, or
 * `materializeResultTreeFn` to substitute the scanned tree (re-opening FIX-1), or `checkLibSrcRoot`/
 * `liveHead` to spoof lineage / the CAS TOCTOU head. Trust was being decided by caller-settable inputs.
 *
 * THE STRUCTURAL FIX (the repo's own sanctioned `acceptance-record.js#produceForTest` /
 * `forgeInvalidRecordForTest` pattern): the seams are no longer reachable through `opts` AT ALL. Production
 * `integrate()` is hard-wired to the REAL implementations; tests that need to drive a seam call the
 * SEPARATE `integrateForTest(input, opts, seams)` export directly. `sanitizeOpts` picks only the keys below
 * — so even `integrateForTest` cannot smuggle a seam through `opts`, and `integrateInternal` reads seams
 * ONLY from its third parameter. Creep-back is caught by the structural guard teeth
 * (`controller-di-seam-creep.falsifier.test.js`), which asserts the exact key set AND source-scans
 * `integrateInternal` for any opts read outside this allowlist.
 */
const PRODUCTION_OPT_KEYS = Object.freeze(["bundleManifestPath", "bundleRoot", "candidateRoot", "spId", "leaseRoot", "gitRoot", "performRefUpdate"]);

/** sanitizeOpts(opts) -> a NEW plain object carrying ONLY PRODUCTION_OPT_KEYS. Function seams, unknown
 *  keys, prototype-chain keys and Symbol keys can never survive this copy. */
function sanitizeOpts(opts) {
  const out = {};
  if (!opts || typeof opts !== "object") return out;
  for (const k of PRODUCTION_OPT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(opts, k)) out[k] = opts[k];
  }
  return out;
}

/** REAL_SEAMS — the production wiring. `null`/`undefined` means "let the callee use its own real default". */
const REAL_SEAMS = Object.freeze({
  hookLivenessCheck: verifyActiveHookInstalled,
  materializeResultTree,
  treeResolver: null,
  materializedTreeResolver: null,
  commitResolver: null,
  ancestryResolver: null,
  leaseTokenResolver: defaultLeaseTokenResolver,
  checkLibSrcRoot: null,
  liveHead: undefined,
});

/**
 * integrate(input, opts) -> {ok, decision, reason?, receipt?, runManifest, offending?}. THE production
 * entrypoint. Hard-wired to REAL_SEAMS — there is NO caller-suppliable override of any trust predicate.
 *
 * `input`: {workorder, base_commit, result_commit, target_ref, result_envelope, expected_checks?} —
 *   `result_envelope` is UNTRUSTED DATA (never read to decide anything, β rider 1); `base_commit`/
 *   `result_commit` are CLAIMS re-resolved from real git before anything else happens.
 * `opts`: EXACTLY {bundleManifestPath, bundleRoot, candidateRoot?, spId, leaseRoot, gitRoot,
 *   performRefUpdate} (PRODUCTION_OPT_KEYS) — anything else a caller passes is DROPPED by `sanitizeOpts`.
 *
 * `decision` is always one of `"INTEGRATED"` (ok:true) or `"BLOCKED"` (ok:false); `reason` is a machine-
 * checkable, distinct string per failure mode (see reconcileRunManifest / acceptance-record.js's own reason
 * vocabulary, which this function surfaces verbatim rather than re-wrapping).
 */
function integrate(input = {}, opts = {}) {
  return integrateInternal(input, sanitizeOpts(opts), REAL_SEAMS);
}

/**
 * integrateForTest(input, opts, seams) -> same shape as `integrate()`. The SANCTIONED test-producer seam
 * (same pattern as `acceptance-record.js#produceForTest` / `#forgeInvalidRecordForTest`): a SEPARATE named
 * export the falsifier corpus calls DIRECTLY, deliberately NOT reachable through the production API. `opts`
 * is still sanitized to PRODUCTION_OPT_KEYS — a seam can only ever arrive via the explicit third parameter,
 * so a production-shaped caller holding only `(input, opts)` can never reach one.
 */
function integrateForTest(input = {}, opts = {}, seams = {}) {
  return integrateInternal(input, sanitizeOpts(opts), { ...REAL_SEAMS, ...(seams && typeof seams === "object" ? seams : {}) });
}

/** integrateInternal(input, o, seams) — `o` is ALWAYS a sanitized opts object (PRODUCTION_OPT_KEYS only);
 *  every trust predicate comes from `seams`, never from `o`. */
function integrateInternal(input = {}, o = {}, seams = REAL_SEAMS) {
  const gitRoot = o.gitRoot || PROJECT_ROOT;
  const resolveCommit = typeof seams.commitResolver === "function" ? seams.commitResolver : acceptanceRecord.resolveCommitSha;
  const resolveTree = typeof seams.treeResolver === "function" ? seams.treeResolver : acceptanceRecord.resolveTreeHash;

  // (0) FIX-3 (QA-001/RT-604) FAIL-CLOSED PRECONDITION: the sole-route hook (Seam E) must be genuinely
  //     ACTIVE for THIS repo — never merely "a falsifier installed a scratch hook somewhere else". Checked
  //     BEFORE anything else so an un-fenced repo can never even reach a commit-resolution/bundle-load
  //     error message that might look like "everything else passed."
  const hookCheckFn = typeof seams.hookLivenessCheck === "function" ? seams.hookLivenessCheck : verifyActiveHookInstalled;
  const hookCheck = hookCheckFn({ gitRoot });
  if (!hookCheck.ok) {
    return { ok: false, decision: "BLOCKED", reason: hookCheck.reason || "hook-not-installed", detail: hookCheck };
  }

  // (1) Re-derive real commit identity from git — input.base_commit/result_commit are CLAIMS (β rider 1).
  const baseCommit = resolveCommit(input.base_commit, { gitRoot });
  if (!baseCommit) return { ok: false, decision: "BLOCKED", reason: "base-commit-unresolvable" };
  const resultCommit = resolveCommit(input.result_commit, { gitRoot });
  if (!resultCommit) return { ok: false, decision: "BLOCKED", reason: "result-commit-unresolvable" };
  const targetRef = typeof input.target_ref === "string" && input.target_ref ? input.target_ref : null;
  if (!targetRef) return { ok: false, decision: "BLOCKED", reason: "invalid-target-ref" };

  // (2) Seam B — load + verify the pinned bundle, peek its frozen CHECK_NAMES/REQUIRED_CHECKS for the mint.
  let bundleManifest, pinnedIndex;
  try {
    bundleManifest = pcb.loadBundleManifest(o.bundleManifestPath);
    pinnedIndex = loadPinnedCheckLib(bundleManifest, {
      bundleRoot: o.bundleRoot,
      candidateRoot: o.candidateRoot,
      // `checkLibSrcRoot` is a SEAM, never an opts key — production passes undefined so loadPinnedCheckLib
      // uses pcb.DEFAULT_LIB_SRC (the real live check-lib source).
      checkLibSrcRoot: seams.checkLibSrcRoot || undefined,
    });
  } catch (e) {
    return { ok: false, decision: "BLOCKED", reason: e.code || "bundle-load-failed", detail: e.message };
  }

  // (3) Resolve the CURRENT lease-fencing token — never caller-asserted.
  const resolveLeaseToken = typeof seams.leaseTokenResolver === "function" ? seams.leaseTokenResolver : defaultLeaseTokenResolver;
  let leaseToken = null;
  try {
    leaseToken = resolveLeaseToken(o.spId, o.leaseRoot);
  } catch {
    leaseToken = null;
  }

  // (4) Mint the nonce-bound run manifest (β R1 — check-set provenance).
  let runManifest;
  try {
    runManifest = mintRunManifest(input, o, { bundleManifest, pinnedIndex, baseCommit, resultCommit, targetRef, leaseToken });
  } catch (e) {
    return { ok: false, decision: "BLOCKED", reason: e.code || "run-manifest-mint-failed", detail: e.message };
  }

  // (5) FIX-1 (QA-003/RT-601): materialize EXACTLY result_commit's tree into a trusted, OUT-of-candidate
  //     path — NEVER scan `gitRoot` (the caller's mutable working tree, which may not even be checked out
  //     at resultCommit). `checkContext` (a caller-suppliable ctx override) has been REMOVED from this
  //     production entrypoint entirely, and S2 (R2) removed the resolver-level seams from `opts` too —
  //     `materializeResultTree`/`treeResolver`/`materializedTreeResolver` now arrive ONLY via the internal
  //     `seams` parameter, which no caller of `integrate()` can populate.
  const materializeFn = typeof seams.materializeResultTree === "function" ? seams.materializeResultTree : materializeResultTree;
  let materialized;
  try {
    materialized = materializeFn(resultCommit, { gitRoot, treeResolver: seams.treeResolver, materializedTreeResolver: seams.materializedTreeResolver });
  } catch (e) {
    return { ok: false, decision: "BLOCKED", reason: e.code || "result-tree-materialize-failed", detail: e.message, runManifest };
  }

  // Seam B — execute the pinned suite (the AUTHORITATIVE checker run) over the MATERIALIZED tree, stamping
  // this run's nonce. `ctx.envelope` is forwarded so the false-green-envelope check can inspect its SHAPE
  // (file/commit/test/evidence counts) — a narrow structural tripwire, NOT a re-adoption of any self-
  // claimed verdict field (β rider 1: the envelope's `success`/`verdict` fields are never read by this
  // module; only the check-lib's OWN independent shape evaluation of the envelope is ever consulted, via
  // its result).
  let pinnedResult;
  try {
    pinnedResult = pcb.runPinnedSuite(
      bundleManifest,
      { envelope: input.result_envelope, root: materialized.dir },
      { bundleRoot: o.bundleRoot, candidateRoot: o.candidateRoot || gitRoot, nonce: runManifest.nonce },
    );
    // Post-run re-verify (mirrors pinned-checker-bundle's own pre/post fence): the MATERIALIZED tree's own
    // hash must be UNCHANGED after the suite ran.
    const postVerify = typeof seams.materializedTreeResolver === "function" ? seams.materializedTreeResolver : acceptanceRecord.resolveTreeHash;
    const postTree = postVerify("HEAD", { gitRoot: materialized.dir });
    if (!postTree || String(postTree).toLowerCase() !== String(materialized.treeHash).toLowerCase()) {
      return { ok: false, decision: "BLOCKED", reason: "result-tree-mutated-mid-run", runManifest };
    }
  } finally {
    materialized.cleanup();
  }
  if (!pinnedResult.ok) {
    return { ok: false, decision: "BLOCKED", reason: pinnedResult.reason || "pinned-suite-failed", runManifest };
  }

  // (6) G4.3 default-deny reconciliation over the nonce-bound manifest.
  const reconciled = reconcileRunManifest(runManifest, pinnedResult.results);
  if (!reconciled.ok) {
    return { ok: false, decision: "BLOCKED", reason: reconciled.reason, offending: reconciled.offending, runManifest };
  }

  // (7) Recompute bound digests from THIS run's actual fired outputs — never input.result_envelope.
  const bound = recomputeBoundDigests({
    workorder: input.workorder,
    results: pinnedResult.results,
    evidence: (input.workorder && typeof input.workorder === "object" && input.workorder.evidence) || {},
    policySnapshot: { bundle_digest: bundleManifest.bundle_digest, suite_version: pinnedIndex.SUITE_VERSION, target_ref: targetRef },
  });

  // (8) Seam A — produce() -> authorizesIntegration() -> commitIntegration(), in that order, and NOTHING
  //     from input.result_envelope is ever consulted (β rider 1: re-derive, never adopt).
  let record;
  try {
    record = acceptanceRecord.produce({
      workorder: input.workorder,
      // terminal_state is the CONTROLLER's OWN affirmative conclusion, not adopted from input.workorder
      // (β rider 1): reaching this line means reconcileRunManifest already returned ok:true over a FRESH,
      // nonce-bound pinned-suite run — that is what "success" means on THIS record, independent of
      // whatever input.workorder.terminal_state (an external, pre-integration claim) happens to say.
      terminal_state: "success",
      base_commit: baseCommit,
      result_tree_hash: resolveTree(resultCommit, { gitRoot }),
      result_commit: resultCommit,
      target_ref: targetRef,
      checker_digests: bound.checker_digests,
      policy_digest: bound.policy_digest,
      evidence_digests: bound.evidence_digests,
      check_suite_version: pinnedIndex.SUITE_VERSION,
      route: input.route != null ? input.route : null,
      fallback: input.fallback === true,
      lease_fencing_token: leaseToken,
    });
  } catch (e) {
    return { ok: false, decision: "BLOCKED", reason: "produce-failed", detail: e.message, runManifest };
  }

  const authorized = acceptanceRecord.authorizesIntegration(record, targetRef, {
    integrationHead: baseCommit,
    spId: o.spId,
    leaseRoot: o.leaseRoot,
    gitRoot,
    treeResolver: seams.treeResolver,
    commitResolver: seams.commitResolver,
    ancestryResolver: seams.ancestryResolver,
  });
  if (!authorized) {
    return { ok: false, decision: "BLOCKED", reason: "not-authorized", runManifest };
  }

  // Seam E: the controller fence is set ONLY around this call — the ONE sanctioned mutating write.
  const commit = withControllerFence(o.spId, leaseToken, o.leaseRoot, () =>
    acceptanceRecord.commitIntegration(record, targetRef, {
      expectedHead: baseCommit,
      newHead: resultCommit,
      performRefUpdate: o.performRefUpdate === true,
      spId: o.spId,
      leaseRoot: o.leaseRoot,
      gitRoot,
      treeResolver: seams.treeResolver,
      integrationHead: baseCommit,
      liveHead: seams.liveHead, // internal TOCTOU seam (integrateForTest only); undefined in production
    }),
  );
  if (!commit.ok) {
    return { ok: false, decision: "BLOCKED", reason: commit.reason, runManifest };
  }

  return { ok: true, decision: "INTEGRATED", receipt: commit.receipt, runManifest };
}

// ══ INC-1 (SP-20260721-001, D-4) — the BROKERED TRANSPORT ════════════════════════════════════════════════
//
// WHAT THIS CLOSES (ED-controller-no-live-release-transport): `integrate()` above is UNIT-shaped — it wants
// a builder WorkOrder + a ResultEnvelope + an AcceptanceRecord binding. A RELEASE needs two other write
// shapes that have no such envelope: (a) landing a sprint BRANCH onto main as a real merge commit, and
// (b) a routine RELEASE/bookkeeping COMMIT. Fabricating a unit envelope for either would be false-green
// GENESIS (rejected by α + β at design-lock), so INC-1 adds two PURPOSE-BUILT brokered entrypoints that
// adopt NOTHING from any caller and mint NO record they did not derive themselves.
//
// Both entrypoints funnel through ONE choke-point, `fencedRefUpdate` (β R4) — the only place in this
// section that a protected ref is ever written. The trust spine it enforces, in order:
//   β R1  RE-RESOLVE the live tip of `target_ref` fresh from git and use THAT as the CAS `expectedHead`.
//         A caller-supplied `base_commit`/anchor is IGNORED — not validated, not preferred, never read.
//         (`sanitizeTransportOpts` additionally makes such a key un-passable through `opts` at all.)
//   β R2  CHECKED === LANDED: the pinned suite runs over the tree materialized from `newHead`'s EXACT SHA
//         out of the object store — never a separately-supplied tree, working directory, or caller claim.
//   β R5  RUNNER ISOLATION: `candidateRoot` for the suite run is the MATERIALIZED tree itself, so the
//         pinned node executable and the pinned check-lib must both resolve OUTSIDE the candidate's
//         writable domain — nothing in the content being judged can resolve the runner that judges it.
//   β R6  For a merge, the SECOND parent (the source branch tip) is recorded as PROVENANCE ONLY. It is
//         never a trust guard: trust comes from the re-resolved first-parent binding + the suite over the
//         merge commit's OWN tree, which is what actually lands.
//   record-trust: the fence token is resolved FRESH via `defaultLeaseTokenResolver` (the CURRENT holder's
//         token from the lease store) — never caller-asserted, never reachable through `opts`.
//
// FAIL-CLOSED on: an unresolvable/non-commit newHead, an unresolvable live head, a parent binding that
// does not reconcile against the RE-RESOLVED head, a newHead that does not descend from the live head, a
// bundle/materialization failure, ANY suite failure, a mid-run tree mutation, a lease that is not held,
// and a CAS race (git's own `update-ref <ref> <new> <expected>` refuses a stale expected value).
//
// PRE-FLIP NOTE (dogfood-before-arm): hook liveness is OBSERVED and reported on the receipt
// (`hook_active`) but is deliberately NOT a precondition here — the Seam E hook flip is DEFERRED to the
// release ceremony, and this transport must carry real D-4 merges BEFORE the fence is armed (that is the
// mileage the arm decision rests on). Post-flip the hook is the RUNTIME backstop that refuses any
// un-brokered write regardless; pre-flip this module's own fail-closed spine is the guarantee.

/**
 * TRANSPORT_OPT_KEYS — the EXACT, FROZEN set of `opts` keys the transport entrypoints may read (same
 * discipline as PRODUCTION_OPT_KEYS: a docstring is not a boundary, an allowlist is). Deliberately ABSENT:
 * `base_commit`/`expectedHead`/`anchor` (β R1 — the CAS anchor is re-resolved, never supplied),
 * `leaseToken` (record-trust — the token is resolved fresh from the lease store), `candidateRoot` (β R5 —
 * the candidate zone IS the materialized tree, never a caller's choice), and every function seam (those
 * arrive only via the explicit third parameter of the `*ForTest` exports).
 */
const TRANSPORT_OPT_KEYS = Object.freeze(["bundleManifestPath", "bundleRoot", "spId", "leaseRoot", "gitRoot"]);

/** sanitizeTransportOpts(opts) -> a NEW plain object carrying ONLY TRANSPORT_OPT_KEYS. */
function sanitizeTransportOpts(opts) {
  const out = {};
  if (!opts || typeof opts !== "object") return out;
  for (const k of TRANSPORT_OPT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(opts, k)) out[k] = opts[k];
  }
  return out;
}

/**
 * TRANSPORT_SKIP_ALLOWED — the ONE explicitly-named, reason-pinned skip the transport tolerates.
 *
 * A brokered merge/release write has NO ResultEnvelope by construction (fabricating one is the false-green
 * genesis this whole design refuses), so `false-green-envelope` — an envelope-shape tripwire — reports
 * `skipped` with the reason `no-envelope-in-context`. Tolerating that EXACT name+reason pair is honest;
 * tolerating "skips" generally would be a dead gate. Every other skip, and any skip of this check for any
 * OTHER reason, is REFUSED (`required-check-skipped`). Frozen, so a silent widening is a visible diff.
 */
const TRANSPORT_SKIP_ALLOWED = Object.freeze({ "false-green-envelope": "no-envelope-in-context" });

/** gitRead(args, gitRoot) -> trimmed stdout, or null on any failure. READ-ONLY (rev-list/cat-file only). */
function gitRead(args, gitRoot) {
  try {
    const r = spawnSync("git", args, { cwd: gitRoot || PROJECT_ROOT, encoding: "utf8", windowsHide: true });
    if (!r || r.status !== 0) return null;
    return String(r.stdout || "").trim();
  } catch {
    return null;
  }
}

/** isCommitObject(sha, gitRoot) -> boolean. `git rev-parse --verify <40-hex>` will happily echo back a
 *  well-formed object NAME that does not exist in this repository, so resolving a SHA is NOT proof that a
 *  commit is there. `git cat-file -t` reads the actual object store — fail-closed on anything but "commit". */
function isCommitObject(sha, gitRoot) {
  return gitRead(["cat-file", "-t", sha], gitRoot) === "commit";
}

/** resolveCommitParents(sha, gitRoot) -> [parentSha,...] or null when the object is not a resolvable commit.
 *  Uses `git rev-list --parents -n 1 <sha>` ("<sha> <p1> [<p2> ...]") — the commit's OWN recorded parents,
 *  read from the object store, never from a caller's claim. */
function resolveCommitParents(sha, gitRoot) {
  if (!isCommitObject(sha, gitRoot)) return null;
  const line = gitRead(["rev-list", "--parents", "-n", "1", sha], gitRoot);
  if (!line) return null;
  const toks = line.split(/\s+/).filter(Boolean);
  if (toks.length < 1) return null;
  return toks.slice(1).map((t) => t.toLowerCase());
}

/**
 * reconcileTransportSuite(expectedChecks, results, nonce) -> {ok, reason?, offending?}. PURE. The
 * transport's default-deny reconciliation — the same discipline as `reconcileRunManifest` (distinct,
 * machine-checkable reason per branch; never a collapsed `not-authorized`), minus the unit run-manifest
 * that a transport write legitimately does not have. PASS only when every name in the pinned bundle's
 * frozen `expectedChecks` has EXACTLY one fresh (nonce-matching), well-formed, terminal, PASSING result —
 * or is the one explicitly allowlisted, reason-pinned skip in TRANSPORT_SKIP_ALLOWED.
 */
function reconcileTransportSuite(expectedChecks, results, nonce) {
  if (!Array.isArray(expectedChecks) || expectedChecks.length === 0) {
    return { ok: false, reason: "empty-expected-check-set" };
  }
  if (typeof nonce !== "string" || !nonce) return { ok: false, reason: "malformed-run-nonce" };

  const byName = new Map();
  for (const r of Array.isArray(results) ? results : []) {
    const shapeOk = r && typeof r === "object" && typeof r.name === "string" && r.name && typeof r.status === "string";
    if (!shapeOk) return { ok: false, reason: "malformed-check-result", offending: r && r.name };
    if (!expectedChecks.includes(r.name)) return { ok: false, reason: "unknown-check-result", offending: r.name };
    if (r.nonce !== nonce) return { ok: false, reason: "stale-check-result", offending: r.name };
    if (byName.has(r.name)) return { ok: false, reason: "duplicate-check-result", offending: r.name };
    byName.set(r.name, r);
  }

  for (const name of expectedChecks) {
    const r = byName.get(name);
    if (!r) return { ok: false, reason: "missing-required-check", offending: name };
    if (r.status === "pass") continue;
    if (r.status === "fail") return { ok: false, reason: "check-failed", offending: name };
    if (r.status === "timeout") return { ok: false, reason: "check-timed-out", offending: name };
    if (r.status === "skipped") {
      // Exactly one name, for exactly one reason (see TRANSPORT_SKIP_ALLOWED) — anything else fails closed.
      if (Object.prototype.hasOwnProperty.call(TRANSPORT_SKIP_ALLOWED, name) && r.reason === TRANSPORT_SKIP_ALLOWED[name]) continue;
      return { ok: false, reason: "required-check-skipped", offending: name };
    }
    return { ok: false, reason: "malformed-check-result", offending: name };
  }
  return { ok: true };
}

/**
 * defaultRefUpdater(targetRef, newHead, expectedHead, gitRoot) -> {ok, reason?}. Git's OWN atomic
 * compare-and-swap: `git update-ref <ref> <new> <expected>` is refused BY GIT if the ref no longer holds
 * `<expected>`, so the last-moment race is closed by git itself, not by a read-then-write of ours. This is
 * the transport's sanctioned mutating write (the analogue of acceptance-record.js#commitIntegration's CAS
 * for the unit path — a separate site precisely because a merge/release write has no AcceptanceRecord to
 * bind, and fabricating one would be the false-green genesis this design refuses). It is ONLY ever invoked
 * from inside `withControllerFence` (see fencedRefUpdateInternal).
 */
function defaultRefUpdater(targetRef, newHead, expectedHead, gitRoot) {
  try {
    const r = spawnSync("git", ["update-ref", targetRef, newHead, expectedHead], {
      cwd: gitRoot || PROJECT_ROOT,
      encoding: "utf8",
      windowsHide: true,
    });
    if (!r || r.status !== 0) {
      return { ok: false, reason: "ref-update-refused", detail: (r && (r.stderr || String(r.error || ""))) || "unknown error" };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "ref-update-error", detail: e.message };
  }
}

/** REAL_TRANSPORT_SEAMS — the production wiring for the transport path. `null` = "use the real default". */
const REAL_TRANSPORT_SEAMS = Object.freeze({
  materializeResultTree,
  commitResolver: null, // -> acceptanceRecord.resolveCommitSha
  treeResolver: null, // -> acceptanceRecord.resolveTreeHash
  ancestryResolver: null, // -> acceptanceRecord.defaultIsAncestor
  leaseTokenResolver: defaultLeaseTokenResolver,
  refUpdater: defaultRefUpdater,
  hookLivenessCheck: verifyActiveHookInstalled,
  checkLibSrcRoot: null,
});

/**
 * fencedRefUpdate(newHead, targetRef, opts) -> {ok, decision, reason?, receipt?, offending?}. THE single
 * fenced-CAS choke-point (β R4): both brokered entrypoints call it, and NEITHER of them writes a ref
 * anywhere else. `decision` is `"LANDED"` (ok:true) or `"BLOCKED"` (ok:false).
 *
 * `opts`: EXACTLY {bundleManifestPath, bundleRoot, spId, leaseRoot, gitRoot} — everything else a caller
 * passes (notably any `base_commit`/`expectedHead` anchor or `leaseToken`) is DROPPED by
 * `sanitizeTransportOpts` and can never influence a trust decision.
 */
function fencedRefUpdate(newHead, targetRef, opts = {}) {
  return fencedRefUpdateInternal(newHead, targetRef, sanitizeTransportOpts(opts), REAL_TRANSPORT_SEAMS, {});
}

/** fencedRefUpdateForTest(newHead, targetRef, opts, seams) — the SANCTIONED test-producer seam (same
 *  pattern as `integrateForTest`): seams arrive ONLY via the explicit third parameter, never via `opts`. */
function fencedRefUpdateForTest(newHead, targetRef, opts = {}, seams = {}, binding = {}) {
  return fencedRefUpdateInternal(
    newHead,
    targetRef,
    sanitizeTransportOpts(opts),
    { ...REAL_TRANSPORT_SEAMS, ...(seams && typeof seams === "object" ? seams : {}) },
    binding && typeof binding === "object" ? binding : {},
  );
}

/**
 * fencedRefUpdateInternal(newHead, targetRef, o, seams, binding).
 *
 * `binding` is INTERNAL (never caller-reachable through `opts`): the entrypoints hand in
 * `{transport, verifyAgainstHead(expectedHead) -> {ok, reason?}, provenance}`. `verifyAgainstHead` is
 * evaluated against the SAME re-resolved head the CAS then uses as its expected value — that is what keeps
 * the parent binding and the CAS anchor from being two different heads (a head that advanced between an
 * entrypoint's own check and the CAS would otherwise let a merge built on the OLD head land on the NEW one,
 * silently discarding the intervening commit).
 */
function fencedRefUpdateInternal(newHead, targetRef, o = {}, seams = REAL_TRANSPORT_SEAMS, binding = {}) {
  const gitRoot = o.gitRoot || PROJECT_ROOT;
  const resolveCommit = typeof seams.commitResolver === "function" ? seams.commitResolver : acceptanceRecord.resolveCommitSha;
  const isAncestor = typeof seams.ancestryResolver === "function" ? seams.ancestryResolver : acceptanceRecord.defaultIsAncestor;
  const transport = typeof binding.transport === "string" && binding.transport ? binding.transport : "fenced-ref-update";

  if (typeof targetRef !== "string" || !targetRef) return { ok: false, decision: "BLOCKED", reason: "invalid-target-ref" };

  // (1) β R2 — the commit that will LAND, resolved from the object store by its own SHA.
  const head = resolveCommit(typeof newHead === "string" ? newHead : "", { gitRoot });
  if (!head) return { ok: false, decision: "BLOCKED", reason: "new-head-unresolvable" };
  if (!isCommitObject(head, gitRoot)) return { ok: false, decision: "BLOCKED", reason: "new-head-not-a-commit" };

  // (2) β R1 — RE-RESOLVE the live tip of the target ref. This, and ONLY this, is the CAS anchor. No
  //     caller-supplied `base_commit` is read anywhere in this function (it cannot even arrive: see
  //     TRANSPORT_OPT_KEYS), so a stale/wrong/hostile anchor cannot be adopted — at worst it is ignored.
  const expectedHead = resolveCommit(targetRef, { gitRoot });
  if (!expectedHead) return { ok: false, decision: "BLOCKED", reason: "live-head-unresolvable" };
  if (expectedHead === head) return { ok: false, decision: "BLOCKED", reason: "new-head-equals-live-head" };

  // (3) The entrypoint's own parent binding, evaluated against THAT SAME re-resolved head.
  if (typeof binding.verifyAgainstHead === "function") {
    let verdict;
    try {
      verdict = binding.verifyAgainstHead(expectedHead);
    } catch (e) {
      return { ok: false, decision: "BLOCKED", reason: "head-binding-error", detail: e.message };
    }
    if (!verdict || verdict.ok !== true) {
      return { ok: false, decision: "BLOCKED", reason: (verdict && verdict.reason) || "head-binding-refused", detail: verdict && verdict.detail };
    }
  }

  // (4) No-history-loss floor: the landing commit MUST descend from the live head. Implied by both
  //     entrypoints' parent checks, asserted here too so a DIRECT fencedRefUpdate call cannot fast-forward
  //     the ref onto an unrelated history. Fail-closed — an unconfirmable relationship is a refusal.
  if (isAncestor(expectedHead, head, { gitRoot }) !== true) {
    return { ok: false, decision: "BLOCKED", reason: "new-head-not-descendant-of-live-head" };
  }

  // (5) Load + verify the pinned bundle (lineage-bound, self-authenticating — see loadPinnedCheckLib).
  let bundleManifest;
  try {
    bundleManifest = pcb.loadBundleManifest(o.bundleManifestPath);
  } catch (e) {
    return { ok: false, decision: "BLOCKED", reason: e.code || "bundle-load-failed", detail: e.message };
  }

  // (6) β R2 — materialize EXACTLY `head`'s tree into a trusted, out-of-candidate path, and (β R5) treat
  //     THAT tree as the candidate zone for the run: the pinned executable and pinned check-lib must both
  //     resolve outside it, so the content under judgement cannot supply or influence its own judge.
  const materializeFn = typeof seams.materializeResultTree === "function" ? seams.materializeResultTree : materializeResultTree;
  let materialized;
  try {
    materialized = materializeFn(head, { gitRoot, treeResolver: seams.treeResolver, materializedTreeResolver: seams.materializedTreeResolver });
  } catch (e) {
    return { ok: false, decision: "BLOCKED", reason: e.code || "result-tree-materialize-failed", detail: e.message };
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  let pinnedIndex, pinnedResult, suiteOutcome;
  try {
    try {
      pinnedIndex = loadPinnedCheckLib(bundleManifest, {
        bundleRoot: o.bundleRoot,
        candidateRoot: materialized.dir,
        checkLibSrcRoot: seams.checkLibSrcRoot || undefined,
      });
    } catch (e) {
      return { ok: false, decision: "BLOCKED", reason: e.code || "bundle-load-failed", detail: e.message };
    }

    pinnedResult = pcb.runPinnedSuite(
      bundleManifest,
      // NO `envelope` — a transport write has none, and fabricating one is exactly the false-green genesis
      // this design refuses. The envelope-shape check therefore reports its documented `skipped` reason,
      // which reconcileTransportSuite tolerates ONLY under that exact name+reason pin.
      { root: materialized.dir },
      { bundleRoot: o.bundleRoot, candidateRoot: materialized.dir, nonce },
    );

    // Post-run re-verify (mirrors integrate()'s own fence): the MATERIALIZED tree must be UNCHANGED after
    // the suite ran — checked === landed only holds if what was checked never moved mid-run.
    const postVerify = typeof seams.materializedTreeResolver === "function" ? seams.materializedTreeResolver : acceptanceRecord.resolveTreeHash;
    const postTree = postVerify("HEAD", { gitRoot: materialized.dir });
    if (!postTree || String(postTree).toLowerCase() !== String(materialized.treeHash).toLowerCase()) {
      return { ok: false, decision: "BLOCKED", reason: "result-tree-mutated-mid-run" };
    }
    if (!pinnedResult.ok) {
      return { ok: false, decision: "BLOCKED", reason: pinnedResult.reason || "pinned-suite-failed" };
    }
    suiteOutcome = reconcileTransportSuite(pinnedIndex.CHECK_NAMES.slice(), pinnedResult.results, nonce);
  } finally {
    materialized.cleanup();
  }
  if (!suiteOutcome.ok) {
    return { ok: false, decision: "BLOCKED", reason: suiteOutcome.reason, offending: suiteOutcome.offending };
  }

  // (7) record-trust: the CURRENT holder's token, read FRESH from the lease store. Never caller-asserted
  //     (a `leaseToken` cannot even reach this function), never cached across the suite run.
  const resolveLeaseToken = typeof seams.leaseTokenResolver === "function" ? seams.leaseTokenResolver : defaultLeaseTokenResolver;
  let leaseToken = null;
  try {
    leaseToken = resolveLeaseToken(o.spId, o.leaseRoot);
  } catch {
    leaseToken = null;
  }
  if (leaseToken == null || leaseToken === "") {
    return { ok: false, decision: "BLOCKED", reason: "lease-not-held" };
  }

  // (8) Seam E — the fence is set ONLY around the CAS itself (never around the checker run, never around
  //     the resolves above), and the CAS is git's own atomic compare-and-swap against the re-resolved head.
  const updater = typeof seams.refUpdater === "function" ? seams.refUpdater : defaultRefUpdater;
  const updated = withControllerFence(o.spId, leaseToken, o.leaseRoot, () => updater(targetRef, head, expectedHead, gitRoot));
  if (!updated || updated.ok !== true) {
    return { ok: false, decision: "BLOCKED", reason: (updated && updated.reason) || "ref-update-refused", detail: updated && updated.detail };
  }

  // Hook liveness is OBSERVED for the receipt, never a gate (pre-flip dogfood — see the section header).
  let hookActive = null;
  try {
    const hookCheckFn = typeof seams.hookLivenessCheck === "function" ? seams.hookLivenessCheck : verifyActiveHookInstalled;
    hookActive = hookCheckFn({ gitRoot }).ok === true;
  } catch {
    hookActive = null;
  }

  return {
    ok: true,
    decision: "LANDED",
    receipt: {
      transport,
      target_ref: targetRef,
      previous_head: expectedHead,
      committed_head: head,
      committed_at: Date.now(),
      suite_version: pinnedIndex.SUITE_VERSION,
      bundle_digest: bundleManifest.bundle_digest,
      run_nonce: nonce,
      // β R6: PROVENANCE ONLY — recorded for the ledger, never consulted as a trust guard.
      provenance: binding.provenance && typeof binding.provenance === "object" ? binding.provenance : {},
      hook_active: hookActive,
    },
  };
}

/**
 * integrateBranchMerge({merge_commit, target_ref}, opts) -> the fencedRefUpdate result shape.
 *
 * Lands a sprint branch onto `target_ref` as a REAL merge commit. `merge_commit` must be an actual 2-parent
 * merge whose FIRST parent is the re-resolved live head of `target_ref`. Its SECOND parent (the source
 * branch tip) is recorded as PROVENANCE only and is NEVER a trust guard (β R6) — trust comes from the
 * first-parent binding plus the pinned suite over the merge commit's OWN tree, which is what actually
 * lands. Any `base_commit`/anchor on `input` is IGNORED (β R1) — the CAS anchor is always re-resolved.
 */
function integrateBranchMerge(input = {}, opts = {}) {
  return integrateBranchMergeInternal(input, sanitizeTransportOpts(opts), REAL_TRANSPORT_SEAMS);
}

/** integrateBranchMergeForTest(input, opts, seams) — sanctioned test-producer seam (see integrateForTest). */
function integrateBranchMergeForTest(input = {}, opts = {}, seams = {}) {
  return integrateBranchMergeInternal(input, sanitizeTransportOpts(opts), { ...REAL_TRANSPORT_SEAMS, ...(seams && typeof seams === "object" ? seams : {}) });
}

function integrateBranchMergeInternal(input = {}, o = {}, seams = REAL_TRANSPORT_SEAMS) {
  const gitRoot = o.gitRoot || PROJECT_ROOT;
  const resolveCommit = typeof seams.commitResolver === "function" ? seams.commitResolver : acceptanceRecord.resolveCommitSha;
  const targetRef = typeof input.target_ref === "string" && input.target_ref ? input.target_ref : null;
  if (!targetRef) return { ok: false, decision: "BLOCKED", reason: "invalid-target-ref" };

  const mergeCommit = resolveCommit(typeof input.merge_commit === "string" ? input.merge_commit : "", { gitRoot });
  if (!mergeCommit || !isCommitObject(mergeCommit, gitRoot)) return { ok: false, decision: "BLOCKED", reason: "merge-commit-unresolvable" };

  const parents = resolveCommitParents(mergeCommit, gitRoot);
  if (!parents) return { ok: false, decision: "BLOCKED", reason: "merge-parents-unresolvable" };
  if (parents.length !== 2) return { ok: false, decision: "BLOCKED", reason: "merge-commit-not-a-two-parent-merge" };

  return fencedRefUpdateInternal(mergeCommit, targetRef, o, seams, {
    transport: "branch-merge",
    // Evaluated INSIDE fencedRefUpdate against the very head the CAS will use as its expected value.
    verifyAgainstHead: (expectedHead) =>
      parents[0] === String(expectedHead).toLowerCase()
        ? { ok: true }
        : { ok: false, reason: "merge-first-parent-not-live-head", detail: `first parent ${parents[0]} !== live head ${expectedHead}` },
    // β R6 — provenance, not a guard.
    provenance: { merge_parents: parents.slice(), source_branch_tip: parents[1] },
  });
}

/**
 * integrateReleaseCommit({release_commit, target_ref}, opts) -> the fencedRefUpdate result shape.
 *
 * Lands a routine release/bookkeeping commit (manifest regen, ledger, version bump). `release_commit` must
 * be a SINGLE-parent commit whose parent is the re-resolved live head of `target_ref`. Same fail-closed
 * spine, same choke-point; any `base_commit`/anchor on `input` is IGNORED (β R1).
 */
function integrateReleaseCommit(input = {}, opts = {}) {
  return integrateReleaseCommitInternal(input, sanitizeTransportOpts(opts), REAL_TRANSPORT_SEAMS);
}

/** integrateReleaseCommitForTest(input, opts, seams) — sanctioned test-producer seam. */
function integrateReleaseCommitForTest(input = {}, opts = {}, seams = {}) {
  return integrateReleaseCommitInternal(input, sanitizeTransportOpts(opts), { ...REAL_TRANSPORT_SEAMS, ...(seams && typeof seams === "object" ? seams : {}) });
}

function integrateReleaseCommitInternal(input = {}, o = {}, seams = REAL_TRANSPORT_SEAMS) {
  const gitRoot = o.gitRoot || PROJECT_ROOT;
  const resolveCommit = typeof seams.commitResolver === "function" ? seams.commitResolver : acceptanceRecord.resolveCommitSha;
  const targetRef = typeof input.target_ref === "string" && input.target_ref ? input.target_ref : null;
  if (!targetRef) return { ok: false, decision: "BLOCKED", reason: "invalid-target-ref" };

  const releaseCommit = resolveCommit(typeof input.release_commit === "string" ? input.release_commit : "", { gitRoot });
  if (!releaseCommit || !isCommitObject(releaseCommit, gitRoot)) return { ok: false, decision: "BLOCKED", reason: "release-commit-unresolvable" };

  const parents = resolveCommitParents(releaseCommit, gitRoot);
  if (!parents) return { ok: false, decision: "BLOCKED", reason: "release-parents-unresolvable" };
  if (parents.length !== 1) return { ok: false, decision: "BLOCKED", reason: "release-commit-not-single-parent" };

  return fencedRefUpdateInternal(releaseCommit, targetRef, o, seams, {
    transport: "release-commit",
    verifyAgainstHead: (expectedHead) =>
      parents[0] === String(expectedHead).toLowerCase()
        ? { ok: true }
        : { ok: false, reason: "release-parent-not-live-head", detail: `parent ${parents[0]} !== live head ${expectedHead}` },
    provenance: { parent: parents[0] },
  });
}

module.exports = {
  integrate,
  integrateForTest,
  // INC-1 brokered transport (SP-20260721-001)
  fencedRefUpdate,
  fencedRefUpdateForTest,
  integrateBranchMerge,
  integrateBranchMergeForTest,
  integrateReleaseCommit,
  integrateReleaseCommitForTest,
  reconcileTransportSuite,
  resolveCommitParents,
  sanitizeTransportOpts,
  defaultRefUpdater,
  TRANSPORT_OPT_KEYS,
  TRANSPORT_SKIP_ALLOWED,
  PRODUCTION_OPT_KEYS,
  sanitizeOpts,
  extractPinnedHookInvocation,
  assertAcceptanceRecordContract,
  mintRunManifest,
  reconcileRunManifest,
  recomputeBoundDigests,
  loadPinnedCheckLib,
  withControllerFence,
  defaultLeaseTokenResolver,
  materializeResultTree,
  verifyActiveHookInstalled,
  REQUIRED_ACCEPTANCE_EXPORTS,
};
