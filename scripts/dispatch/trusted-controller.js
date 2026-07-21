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

module.exports = {
  integrate,
  integrateForTest,
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
