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

  const pre = pcb.verifyBundle(bundleManifest, { bundleRoot });
  if (!pre.ok) {
    const err = new Error("trusted-controller: pinned bundle failed verification before mint (bundle-pin-mismatch)");
    err.code = "bundle-pin-mismatch";
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

// ── the ONE public entrypoint. ──────────────────────────────────────────────────────────────────────────

/**
 * integrate(input, opts) -> {ok, decision, reason?, receipt?, runManifest, offending?}.
 *
 * `input`: {workorder, base_commit, result_commit, target_ref, result_envelope, expected_checks?} —
 *   `result_envelope` is UNTRUSTED DATA (never read to decide anything, β rider 1); `base_commit`/
 *   `result_commit` are CLAIMS re-resolved from real git before anything else happens.
 * `opts`: {bundleManifestPath, bundleRoot, candidateRoot?, spId, leaseRoot, gitRoot, performRefUpdate,
 *   treeResolver?, commitResolver?, ancestryResolver?, leaseTokenResolver?, liveHead?} — the resolver seams
 *   mirror acceptance-record.js's own injectables for hermetic falsifiers; `liveHead` is an OPTIONAL test-
 *   only seam forwarded straight to acceptance-record.js#commitIntegration's own `opts.liveHead` (a TOCTOU
 *   simulation hook — production callers never set it, letting commitIntegration resolve the real live head).
 *
 * `decision` is always one of `"INTEGRATED"` (ok:true) or `"BLOCKED"` (ok:false); `reason` is a machine-
 * checkable, distinct string per failure mode (see reconcileRunManifest / acceptance-record.js's own reason
 * vocabulary, which this function surfaces verbatim rather than re-wrapping).
 */
function integrate(input = {}, opts = {}) {
  const gitRoot = opts.gitRoot || PROJECT_ROOT;
  const resolveCommit = typeof opts.commitResolver === "function" ? opts.commitResolver : acceptanceRecord.resolveCommitSha;
  const resolveTree = typeof opts.treeResolver === "function" ? opts.treeResolver : acceptanceRecord.resolveTreeHash;

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
    bundleManifest = pcb.loadBundleManifest(opts.bundleManifestPath);
    pinnedIndex = loadPinnedCheckLib(bundleManifest, opts);
  } catch (e) {
    return { ok: false, decision: "BLOCKED", reason: e.code || "bundle-load-failed", detail: e.message };
  }

  // (3) Resolve the CURRENT lease-fencing token — never caller-asserted.
  const resolveLeaseToken = typeof opts.leaseTokenResolver === "function" ? opts.leaseTokenResolver : defaultLeaseTokenResolver;
  let leaseToken = null;
  try {
    leaseToken = resolveLeaseToken(opts.spId, opts.leaseRoot);
  } catch {
    leaseToken = null;
  }

  // (4) Mint the nonce-bound run manifest (β R1 — check-set provenance).
  let runManifest;
  try {
    runManifest = mintRunManifest(input, opts, { bundleManifest, pinnedIndex, baseCommit, resultCommit, targetRef, leaseToken });
  } catch (e) {
    return { ok: false, decision: "BLOCKED", reason: e.code || "run-manifest-mint-failed", detail: e.message };
  }

  // (5) Seam B — execute the pinned suite (the AUTHORITATIVE checker run), stamping this run's nonce.
  //     `ctx.envelope` is forwarded so the false-green-envelope check can inspect its SHAPE (file/commit/
  //     test/evidence counts) — a narrow structural tripwire, NOT a re-adoption of any self-claimed verdict
  //     field (β rider 1: the envelope's `success`/`verdict` fields are never read by this module; only the
  //     check-lib's OWN independent shape evaluation of the envelope is ever consulted, via its result).
  // opts.checkContext is an ADDITIVE, test-only seam (falsifiers only — production callers never set it)
  // letting a hermetic test control individual checks' inputs (e.g. inject a poisoned `files` array to force
  // a deterministic no-nul-bytes failure) without touching real files — it can only ADD ctx keys, never
  // override `envelope`/`root` below.
  const extraCtx = opts.checkContext && typeof opts.checkContext === "object" ? opts.checkContext : {};
  const pinnedResult = pcb.runPinnedSuite(
    bundleManifest,
    { ...extraCtx, envelope: input.result_envelope, root: gitRoot },
    { bundleRoot: opts.bundleRoot, candidateRoot: opts.candidateRoot || gitRoot, nonce: runManifest.nonce },
  );
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
    spId: opts.spId,
    leaseRoot: opts.leaseRoot,
    gitRoot,
    treeResolver: opts.treeResolver,
    commitResolver: opts.commitResolver,
    ancestryResolver: opts.ancestryResolver,
  });
  if (!authorized) {
    return { ok: false, decision: "BLOCKED", reason: "not-authorized", runManifest };
  }

  // Seam E: the controller fence is set ONLY around this call — the ONE sanctioned mutating write.
  const commit = withControllerFence(opts.spId, leaseToken, opts.leaseRoot, () =>
    acceptanceRecord.commitIntegration(record, targetRef, {
      expectedHead: baseCommit,
      newHead: resultCommit,
      performRefUpdate: opts.performRefUpdate === true,
      spId: opts.spId,
      leaseRoot: opts.leaseRoot,
      gitRoot,
      treeResolver: opts.treeResolver,
      integrationHead: baseCommit,
      liveHead: opts.liveHead, // test-only TOCTOU seam; undefined in production (real resolve applies)
    }),
  );
  if (!commit.ok) {
    return { ok: false, decision: "BLOCKED", reason: commit.reason, runManifest };
  }

  return { ok: true, decision: "INTEGRATED", receipt: commit.receipt, runManifest };
}

module.exports = {
  integrate,
  assertAcceptanceRecordContract,
  mintRunManifest,
  reconcileRunManifest,
  recomputeBoundDigests,
  loadPinnedCheckLib,
  withControllerFence,
  defaultLeaseTokenResolver,
  REQUIRED_ACCEPTANCE_EXPORTS,
};
