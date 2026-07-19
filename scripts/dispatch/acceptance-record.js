"use strict";
/**
 * acceptance-record.js — the CROSS-SESSION AcceptanceRecord (SP-20260718-005 Phase 3, unit SEC-2).
 *
 * WHAT PROBLEM THIS CLOSES: a ResultEnvelope's `success:true` is a PROVIDER self-report — untrusted,
 * same-process, forgeable. Integration (merging built work into the shared head) is an IRREVERSIBLE
 * action performed by a RESUMED/DIFFERENT session (the conductor / gauntlet), not by the provider that
 * did the work. Only a trusted AcceptanceRecord — produced by that trusted verifier — may authorize it.
 *
 * SESSION-SCOPE PARTITION (SHARP-1, BINDING — see build_spec.md "Session-scope partition"):
 *   WorkOrder @ dispatch        = SAME-SESSION  -> per-session HMAC (attest-signing.js)
 *   AcceptanceRecord @ integrate = CROSS-SESSION -> CONTENT-ADDRESSED git identity, NEVER per-session HMAC
 * The AcceptanceRecord crosses the per-session HMAC-secret boundary BY DESIGN (a different/resumed
 * session performs integration) — depending on the signer's session secret here is the R3 cross-session
 * false-RED. So this module NEVER imports attest-signing / sessionSecret for its own trust decision.
 *
 * TRUSTED-VERIFIER RECOMPUTE (product-lead REVISE, AC-4/AC-F11): content-addressing proves the record is
 * INTERNALLY CONSISTENT, not that it is TRUSTED. A provider could hand-author a structurally-valid record
 * with a fabricated result_tree_hash. `authorizesIntegration` therefore RECOMPUTES the result-tree hash
 * from the ACTUAL target ref's real git objects (via a read-only `git rev-parse <ref>^{tree}`, mirroring
 * the read-only git allowlist already sanctioned for this repo — scripts/dispatch/safe-spawn.js's git
 * policy: rev-parse/status/diff/log only, never a mutating subcommand) when the caller opts in via
 * `{recompute:true}` (the integration-time caller always does; unit tests exercise the structural checks
 * in isolation per the falsifier fixture shapes — see SEC-2 fixture contracts). A record whose digest the
 * verifier cannot confirm — including because the ref/tree cannot be resolved at all — FAILS CLOSED.
 *
 * `produce()` is ONLY ever called by the trusted verifier (conductor/gauntlet) after checkers ran; the
 * provider process never calls it. That call-site restriction — not a self-reported field on the record —
 * is the provenance guarantee (mirrors conductor-lease.js: only the conductor process calls acquire()).
 *
 * `commitIntegration()` is the POST-MERGE receipt / atomic CAS ref-update precondition, DELIBERATELY
 * SEPARATE from `authorizesIntegration()` (the PRE-MERGE authorization) — AC-5/AC-F12: the integration
 * head can move BETWEEN validation and the ref update (a distinct race from F3's stale-base-at-validation).
 * The actual ref mutation is intentionally NOT performed by default (would be a live, irreversible git
 * write from a security-builder unit test run) — it returns the CAS determination + a receipt shape the
 * real conductor write-path consumes; opt-in real mutation is `opts.performRefUpdate` (documented below).
 *
 * No external deps. Windows + POSIX safe (spawnSync array-argv, no shell).
 */

const crypto = require("crypto");
const path = require("path");
const { spawnSync } = require("child_process");
const { workOrderDigest, TERMINAL_STATES } = require("./workorder-schema");

// CWD-independent anchor (mirrors conductor-lease.js's PROJECT_ROOT reasoning — a worktree-cwd dispatch
// must resolve refs against the real repo, not wherever the process happened to be launched from).
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

/** Deterministic sha256 over a canonical (sorted-key) JSON projection. PURE — no fs, no clock. */
function stableDigest(obj) {
  const keys = Object.keys(obj || {}).sort();
  const canonical = {};
  for (const k of keys) canonical[k] = obj[k] === undefined ? null : obj[k];
  return crypto.createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

/**
 * Resolve the real git tree hash for `ref` (`git rev-parse --verify <ref>^{tree}`) by shelling out
 * READ-ONLY to git (rev-parse only — never a mutating subcommand). Returns null (never throws) when the
 * ref/tree cannot be resolved — the caller must treat null as "cannot confirm" -> fail closed.
 */
function resolveTreeHash(ref, opts = {}) {
  if (typeof ref !== "string" || !ref) return null;
  const cwd = opts.gitRoot || PROJECT_ROOT;
  try {
    const r = spawnSync("git", ["rev-parse", "--verify", `${ref}^{tree}`], {
      cwd,
      encoding: "utf8",
      windowsHide: true,
    });
    if (!r || r.status !== 0) return null;
    const out = String(r.stdout || "").trim();
    return /^[0-9a-f]{40}$/i.test(out) ? out.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** Resolve the real commit SHA for `ref` (`git rev-parse --verify <ref>`). Null on any failure. */
function resolveCommitSha(ref, opts = {}) {
  if (typeof ref !== "string" || !ref) return null;
  const cwd = opts.gitRoot || PROJECT_ROOT;
  try {
    const r = spawnSync("git", ["rev-parse", "--verify", ref], { cwd, encoding: "utf8", windowsHide: true });
    if (!r || r.status !== 0) return null;
    const out = String(r.stdout || "").trim();
    return /^[0-9a-f]{7,40}$/i.test(out) ? out.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * verifyFencingToken(spId, token, {leaseRoot}) -> boolean. Consumes BE-4's conductor-lease.verifyToken
 * (SEC-4: an AcceptanceRecord minted under a superseded lease is refused, AC-7/AC-F10). Lazily required
 * so a missing/broken lease module fails CLOSED (never silently skips the check).
 */
function verifyFencingToken(spId, token, leaseRoot) {
  let lease;
  try {
    lease = require("./conductor-lease");
  } catch {
    return false; // cannot verify currency -> refuse (fail-closed)
  }
  if (!lease || typeof lease.verifyToken !== "function") return false;
  try {
    return lease.verifyToken(spId, token, { root: leaseRoot }) === true;
  } catch {
    return false;
  }
}

/**
 * produce(input) -> AcceptanceRecord. ONLY the trusted verifier (conductor/gauntlet) calls this, after
 * checkers ran. Binds: WorkOrder digest, exact base/tree/TARGET ref, checker/policy/evidence digests,
 * effective route/fallback, and a lease fencing token (SEC-4 seam) — plus a self content-digest
 * (`record_digest`, audit/logging use only — NOT the trust anchor; the trust anchor is `authorizesIntegration`
 * RECOMPUTING against real git objects, per AC-4).
 *
 * @param {object} input
 * @param {object|string} [input.workorder] the validated WorkOrder object (or a pre-computed digest string)
 * @param {string} input.base_commit        immutable base the work was built from
 * @param {string} input.result_tree_hash   the CLAIMED result-tree hash (recomputed + verified at authz time)
 * @param {string} [input.result_commit]    the candidate/result commit ref holding the accepted work — the
 *                                           IMMUTABLE result the verifier recomputes result_tree_hash FROM at
 *                                           authz time (R3-REG-1: NOT the destination target_ref, whose tree is
 *                                           the pre-merge base). Bound on the record so authorization is
 *                                           self-contained (no dependency on the caller passing the right head).
 * @param {string} input.target_ref         the ref this record authorizes integration INTO
 * @param {object} [input.checker_digests]  {checkerName: digest}
 * @param {string} [input.policy_digest]
 * @param {object} [input.evidence_digests] {evidenceId: digest}
 * @param {string} [input.route]            effective provider/model route actually used
 * @param {boolean}[input.fallback]         whether the route fell back
 * @param {number|string} [input.lease_fencing_token] the conductor-lease token active when this was minted
 * @returns {object} AcceptanceRecord
 */
function produce(input = {}) {
  const wo = input.workorder;
  const workorder_digest =
    typeof wo === "string" && wo
      ? wo
      : wo && typeof wo === "object"
        ? wo.workorder_digest || workOrderDigest(wo)
        : "";
  const terminal_state =
    input.terminal_state || (wo && typeof wo === "object" ? wo.terminal_state : "") || "";

  const record = {
    schema_version: "acceptance-record/v1",
    produced_by: "trusted-verifier", // call-site-restricted provenance (see module doc), not a settable trust field
    produced_at: Date.now(),
    workorder_digest,
    base_commit: input.base_commit || "",
    result_tree_hash: input.result_tree_hash || "",
    // R3-REG-1: the candidate/result commit the accepted tree is recomputed FROM at authz time (the immutable
    // result ref, NOT the destination target_ref). Empty when the verifier did not bind one — authorization
    // then requires the caller to supply opts.resultRef|opts.newHead, else it fails closed.
    result_commit: input.result_commit || "",
    target_ref: input.target_ref || "",
    terminal_state,
    checker_digests: input.checker_digests && typeof input.checker_digests === "object" ? input.checker_digests : {},
    policy_digest: input.policy_digest || "",
    evidence_digests: input.evidence_digests && typeof input.evidence_digests === "object" ? input.evidence_digests : {},
    route: input.route != null ? input.route : null,
    fallback: input.fallback === true,
    lease_fencing_token: input.lease_fencing_token != null ? input.lease_fencing_token : null,
    integration_receipt: null, // filled in post-merge by commitIntegration's caller (split pre/post-merge, AC-5)
  };
  record.record_digest = stableDigest(record);
  return record;
}

/**
 * produceForTest(overrides) -> a FULLY-VALID AcceptanceRecord (the positive-companion fixture contract,
 * AC-4/AC-18b — defeats a reject-everything `authorizesIntegration` stub). Content-addressed against a
 * synthetic base/tree pair the module itself certifies ("base-OK"/"tree-OK") rather than the live repo's
 * real SHAs, so this stays deterministic and independent of the calling repo's actual history; recompute-
 * gated callers (`{recompute:true}`) legitimately fail against this synthetic record — the companion test
 * exercises the NON-recompute structural path (target/terminal/freshness/lease), same as the reject
 * falsifiers do.
 */
function produceForTest(overrides = {}) {
  const workorder = {
    schema_version: "workorder-min/v1",
    correlation_id: "corr-acceptance-positive-companion",
    role: "backend-builder",
    provider: "claude",
    model: "opus",
    base_commit: "base-OK",
    result_tree_hash: "tree-OK",
    allowed_capabilities: ["build"],
    allowed_paths: ["scripts/"],
    retry_lineage: [],
    evidence_refs: ["ev-1"],
    terminal_state: "success",
  };
  const base = produce({
    workorder,
    base_commit: "base-OK",
    result_tree_hash: "tree-OK",
    result_commit: "cand-OK", // the candidate commit the accepted tree is recomputed from (okTree maps it to "tree-OK")
    target_ref: "refs/heads/integration",
    checker_digests: { lint: "digest-lint", tests: "digest-tests" },
    policy_digest: "policy-OK",
    evidence_digests: { "ev-1": "digest-ev-1" },
    route: "claude:opus",
    fallback: false,
    lease_fencing_token: null,
  });
  return Object.assign({}, base, overrides);
}

/**
 * authorizesIntegration(record, targetRef, opts) -> boolean. The CHOKE-POINT decision. TRUE only when
 * ALL hold (every coordinate is MANDATORY — the R2/C2 fix removed the opt-in skips that were fail-open):
 *   (a) record.target_ref === targetRef                                          (F4 re-correlation)
 *   (b) record.terminal_state === "success" (in the 5-state enum)                (F2 bare envelope / F6 non-success)
 *   (c) FULL content-addressed identity present + non-empty: workorder_digest / base_commit /
 *       result_tree_hash / result_commit, AND checker_digests + evidence_digests are non-empty maps whose
 *       EVERY value is a non-empty digest string (C2-R3 — a {lint:""} map is a contentless proof)  (F11)
 *   (d) opts.integrationHead is REQUIRED and record.base_commit === it           (F3 TOCTOU freshness)
 *   (e) opts.spId + opts.leaseRoot are REQUIRED and record.lease_fencing_token is CURRENT
 *       per conductor-lease.verifyToken                                          (F10 lease x acceptance)
 *   (f) trusted-verifier RECOMPUTE (MANDATORY, no opt-out): resolve the tree of the CANDIDATE/RESULT commit
 *       (opts.resultRef | opts.newHead | record.result_commit — NOT targetRef, whose tree is the pre-merge
 *       base, R3-REG-1) and it MUST === record.result_tree_hash                  (F11 forged/provider digest)
 *
 * @param {object} record
 * @param {string} targetRef
 * @param {{integrationHead?:string, spId?:string, leaseRoot?:string, gitRoot?:string,
 *          resultRef?:string, newHead?:string, treeResolver?:function}} [opts]
 */
function authorizesIntegration(record, targetRef, opts = {}) {
  if (!record || typeof record !== "object") return false;
  if (typeof targetRef !== "string" || !targetRef) return false;

  // (a) exact target match — a record bound to A never authorizes B (SHARP-2a re-correlation).
  if (record.target_ref !== targetRef) return false;

  // (b) ONLY a "success" WorkOrder terminal state authorizes — an envelope's self-claimed success is
  //     irrelevant (F2/F6); an untyped ResultEnvelope has no terminal_state at all and fails here too.
  if (record.terminal_state !== "success" || !TERMINAL_STATES.includes(record.terminal_state)) return false;

  // FULL content-addressed identity MANDATORY (SP-20260718-005 gauntlet R2/C2 + R3/C2): the trust anchor is the
  // WHOLE verifier-bound identity, not just the tree. R1 required only tree/base/workorder present; R2 required
  // the checker/policy/evidence digest MAPS non-empty; R3 (C2-R3) closes the residual — a non-empty MAP is NOT
  // proof: {lint:""} / {ev:""} authorized a CONTENTLESS verifier claim. Every digest-map VALUE must itself be a
  // non-empty digest string. result_commit (the recompute source, R3-REG-1) is part of the mandatory identity —
  // a trusted record binds the candidate commit it was accepted from. Any missing/empty coordinate fails closed.
  if (!record.result_tree_hash || !record.base_commit || !record.workorder_digest || !record.result_commit) return false;
  // C2-R3: a digest MAP must be a non-empty object whose EVERY value is a non-empty digest string. Empty-string /
  // null / non-string values are a contentless proof — the exact bypass the gauntlet reproduced with {lint:""}.
  const _isDigestMap = (o) =>
    o && typeof o === "object" && !Array.isArray(o) &&
    Object.keys(o).length > 0 &&
    Object.values(o).every((v) => typeof v === "string" && v.trim().length > 0);
  if (!_isDigestMap(record.checker_digests)) return false; // the checkers-ran proof (every value a non-empty digest)
  if (typeof record.policy_digest !== "string" || !record.policy_digest.trim()) return false;
  if (!_isDigestMap(record.evidence_digests)) return false; // the evidence proof (every value a non-empty digest)

  // (d) freshness MANDATORY (R2/C2): the caller MUST supply the live integration head and the record's base
  //     MUST match it — the prior `if (opts.integrationHead != null)` opt-in let a caller SKIP the check->
  //     merge TOCTOU guard by simply omitting the coordinate (fail-open). No opt-out: absent head → BLOCK.
  if (opts.integrationHead == null || String(opts.integrationHead) === "") return false;
  if (record.base_commit !== opts.integrationHead) return false;

  // (e) lease-fencing MANDATORY (R2/C2, SEC-4): the caller MUST supply the lease coordinates AND the record
  //     MUST carry a fencing token, and it MUST be current. The prior `if (opts.spId && opts.leaseRoot)`
  //     opt-in let a caller authorize under a superseded/absent lease by omitting the coordinates (fail-open).
  if (opts.spId == null || opts.leaseRoot == null) return false;
  if (record.lease_fencing_token == null) return false;
  if (!verifyFencingToken(opts.spId, record.lease_fencing_token, opts.leaseRoot)) return false;

  // (f) trusted-verifier RECOMPUTE — MANDATORY, never optional (SP-20260718-005 gauntlet C2 + R3-REG-1).
  //     The content-addressed trust anchor is only real if the verifier ALWAYS recomputes result_tree_hash from
  //     the CANDIDATE/RESULT commit's ACTUAL git objects and it MATCHES. R3-REG-1: the prior recompute read the
  //     tree of `targetRef` — but targetRef is the pre-merge DESTINATION, whose tree is the BASE tree (nothing is
  //     merged yet), while result_tree_hash is the CANDIDATE's tree. So for ANY real non-empty integration the
  //     two never matched and authorization ALWAYS returned false — a fail-closed AVAILABILITY defect that made
  //     the primitive un-usable (and thus likely to be bypassed). The accepted result lives at the candidate
  //     commit, NOT the destination ref, so we recompute from the immutable candidate:
  //       opts.resultRef (explicit) → opts.newHead (the head the conductor is about to CAS into targetRef) →
  //       record.result_commit (the record's own bound candidate).
  //     Destination-remains-at-base is a SEPARATE concern (R3-REG-1 second clause): the freshness coordinate (d)
  //     above binds base_commit to the caller's live integrationHead, and commitIntegration additionally resolves
  //     the REAL liveHead of targetRef and requires it === base_commit before the git CAS. There is NO opt-out
  //     flag (a boolean skip would re-introduce the settable bypass, cf. H4 trustedBridge). The ONLY variable is
  //     the RESOLVER: real read-only git (default) in production, injected opts.treeResolver in tests. A record
  //     whose candidate tree cannot be resolved OR does not match the claimed digest FAILS CLOSED.
  const resultRef =
    typeof opts.resultRef === "string" && opts.resultRef ? opts.resultRef
      : typeof opts.newHead === "string" && opts.newHead ? opts.newHead
        : typeof record.result_commit === "string" && record.result_commit ? record.result_commit
          : null;
  if (!resultRef) return false; // no bound candidate/result ref → cannot recompute the accepted tree → fail closed
  const resolveTree = typeof opts.treeResolver === "function" ? opts.treeResolver : resolveTreeHash;
  const actualTree = resolveTree(resultRef, opts);
  if (!actualTree || String(actualTree).toLowerCase() !== String(record.result_tree_hash).toLowerCase()) return false;

  return true;
}

/**
 * commitIntegration(record, targetRef, opts) -> {ok, reason?, receipt?}. The POST-MERGE CAS ref-update
 * precondition — deliberately SEPARATE from authorizesIntegration (AC-5). `opts.expectedHead` is the head
 * the pre-merge validation observed; the live head is `opts.liveHead` when injected (test/CAS-simulation),
 * else resolved fresh from the real target ref. ok:false whenever the live head has moved (F12) or the
 * record's target doesn't match. Never mutates git by default — `opts.performRefUpdate:true` is the
 * explicit real-write opt-in the conductor's write-path sets; without it this is a pure CAS DETERMINATION
 * (the atomic ref-update itself, when opted in, is `git update-ref <targetRef> <newHead> <expectedHead>` —
 * git's own atomic compare-and-swap, refused by git itself if `expectedHead` is stale).
 */
function commitIntegration(record, targetRef, opts = {}) {
  if (!record || typeof record !== "object") return { ok: false, reason: "invalid-record" };
  if (typeof targetRef !== "string" || !targetRef) return { ok: false, reason: "invalid-target" };
  if (record.target_ref !== targetRef) return { ok: false, reason: "target-mismatch" };
  if (opts.expectedHead == null) return { ok: false, reason: "missing-expected-head" };

  // C3/R2: BIND the CAS to the accepted content — expectedHead (the head validation observed) MUST be the
  // record's base_commit. The gauntlet showed a stale-base record with matching expected/live heads passed:
  // commitIntegration never tied the head it was committing against to the base the record was built on, so
  // a record for base A could authorize a merge whose expectedHead was B. No opt-out: mismatch → BLOCK.
  if (opts.expectedHead !== record.base_commit) return { ok: false, reason: "expected-head-base-mismatch" };

  if (opts.spId != null && opts.leaseRoot != null) {
    if (!verifyFencingToken(opts.spId, record.lease_fencing_token, opts.leaseRoot)) {
      return { ok: false, reason: "superseded-lease" };
    }
  }

  // SP-20260718-005 gauntlet C3 fix: the CAS ref-update MUST NOT proceed on target-match + head-CAS alone.
  // The prior split (pre-merge authorizesIntegration vs post-merge commitIntegration) let a caller reach the
  // ref mutation by calling commitIntegration DIRECTLY, with no terminal-state / content-recompute /
  // provenance check — a record carrying only a matching target_ref returned {ok:true} and, with
  // performRefUpdate, mutated the ref. commitIntegration now RE-VERIFIES full authorization
  // (authorizesIntegration: terminal-state + MANDATORY content-addressed recompute + freshness + lease
  // fencing) as a precondition — defense-in-depth over the split, fail-closed if authorization does not hold.
  // (Ordered AFTER the explicit lease check so a superseded lease keeps its specific reason.)
  // authorizesIntegration now REQUIRES the freshness coordinate (R2/C2) — supply integrationHead from the
  // validated expectedHead (which === base_commit above) so the mandatory freshness check has its input.
  const authzOpts = { ...opts, integrationHead: opts.integrationHead != null ? opts.integrationHead : opts.expectedHead };
  if (!authorizesIntegration(record, targetRef, authzOpts)) return { ok: false, reason: "not-authorized" };

  const liveHead = opts.liveHead !== undefined ? opts.liveHead : resolveCommitSha(targetRef, opts);
  if (liveHead == null) return { ok: false, reason: "unresolvable-live-head" };
  if (liveHead !== opts.expectedHead) return { ok: false, reason: "validation-to-merge-race" };

  if (opts.performRefUpdate === true) {
    if (typeof opts.newHead !== "string" || !/^[0-9a-f]{7,40}$/i.test(opts.newHead)) {
      return { ok: false, reason: "missing-new-head-for-ref-update" };
    }
    // C3/R2: the committed newHead MUST resolve to the ACCEPTED tree — the CAS can advance the ref only to a
    // commit whose tree === the record's recompute-accepted result_tree_hash. The gauntlet showed the CAS
    // never verified this, so it could update the ref to a commit OTHER than the accepted work. Fail-closed.
    const resolveTree = typeof opts.treeResolver === "function" ? opts.treeResolver : resolveTreeHash;
    const newTree = resolveTree(opts.newHead, opts);
    if (!newTree || String(newTree).toLowerCase() !== String(record.result_tree_hash).toLowerCase()) {
      return { ok: false, reason: "new-head-tree-mismatch" };
    }
    const cwd = opts.gitRoot || PROJECT_ROOT;
    try {
      // git's own atomic CAS: refuses the write if <expectedHead> no longer matches the ref's live value.
      const r = spawnSync("git", ["update-ref", targetRef, opts.newHead, opts.expectedHead], {
        cwd,
        encoding: "utf8",
        windowsHide: true,
      });
      if (!r || r.status !== 0) return { ok: false, reason: "ref-update-refused" };
    } catch {
      return { ok: false, reason: "ref-update-error" };
    }
  }

  const receipt = {
    target_ref: targetRef,
    committed_head: opts.performRefUpdate === true ? opts.newHead : opts.expectedHead,
    committed_at: Date.now(),
    record_digest: record.record_digest || null,
  };
  return { ok: true, receipt };
}

module.exports = {
  produce,
  produceForTest,
  authorizesIntegration,
  commitIntegration,
  resolveTreeHash,
  resolveCommitSha,
  stableDigest,
};
