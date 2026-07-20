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

// ED-238 (β design-lock 0.90): a commit-identity field MUST be an IMMUTABLE full 40-hex commit SHA — never a
// mutable ref (refs/heads/x, retargetable), never a short/abbreviated sha. 40 hex = git SHA-1 object name.
const FULL_SHA_RE = /^[0-9a-f]{40}$/i;

/**
 * validateCommitIdentity(record) -> boolean. The ONE commit-identity schema gate (ED-238): EVERY commit-
 * identity field on the record is an immutable full 40-hex SHA. R5 pinned only result_commit inline in authz
 * (a single field-by-field regex) while base_commit stayed any truthy string — a mutable base reopened
 * stale-base authorization (the occurrence-3 leak). authorizesIntegration routes ALL commit-identity fields
 * through THIS validator; there is NO inline field-by-field commit-SHA regex left in the authz body.
 * (result_tree_hash / workorder_digest are DIGESTS, not commit SHAs — validated separately by presence.)
 */
function validateCommitIdentity(record) {
  if (!record || typeof record !== "object") return false;
  const b = record.base_commit;
  const r = record.result_commit;
  // F3 (β fix-lock 0.91): require STRING commit-identity fields — NO String() coercion. Previously
  // String(record.base_commit || "") coerced a non-string (e.g. a one-element array ["<40hex>"]) past
  // FULL_SHA_RE, so the "typed" schema did not actually require strings. typeof-gate BEFORE the regex.
  return typeof b === "string" && FULL_SHA_RE.test(b) && typeof r === "string" && FULL_SHA_RE.test(r);
}

/** isFullSha(x) -> boolean. A head-coordinate (integrationHead/expectedHead/liveHead/newHead) must be an
 *  immutable full 40-hex SHA (ED-238 head-coord re-binding) — the equality chain then forces it === base. */
function isFullSha(x) {
  return typeof x === "string" && FULL_SHA_RE.test(x);
}

/**
 * defaultIsAncestor(base, candidate, opts) -> boolean. TRUE only when `base` is an ancestor of `candidate`
 * (the candidate was built ON the declared base) via a READ-ONLY `git merge-base --is-ancestor <base>
 * <candidate>` (exit 0 = ancestor, exit 1 = not, other = error). R5-C2B: closes "a candidate commit
 * unrelated to base_commit". FAIL-CLOSED — any non-zero-that-is-not-1, spawn error, or exception → false.
 * Injectable in authorizesIntegration via opts.ancestryResolver for hermetic tests.
 */
function defaultIsAncestor(base, candidate, opts = {}) {
  if (typeof base !== "string" || !base || typeof candidate !== "string" || !candidate) return false;
  const cwd = opts.gitRoot || PROJECT_ROOT;
  try {
    const r = spawnSync("git", ["merge-base", "--is-ancestor", base, candidate], { cwd, encoding: "utf8", windowsHide: true });
    return !!r && r.status === 0; // exit 0 = base IS an ancestor of candidate; anything else → not proven → false
  } catch {
    return false;
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
    // ED-238/F2: commit-identity fields are carried as-is (no `|| ""` mutable/empty default) and enforced by the
    // validator below — produce() CANNOT emit a record whose base/candidate are not immutable full SHAs.
    base_commit: typeof input.base_commit === "string" ? input.base_commit : input.base_commit,
    result_tree_hash: input.result_tree_hash || "",
    // R3-REG-1: the candidate/result commit the accepted tree is recomputed FROM at authz time (the immutable
    // result ref, NOT the destination target_ref) — a full SHA, enforced by construction (below).
    result_commit: typeof input.result_commit === "string" ? input.result_commit : input.result_commit,
    target_ref: input.target_ref || "",
    terminal_state,
    // SP-20260720-002 Phase 4 (unit CONTROLLER, additive AC-8/AC-2): the check-suite identity the
    // trusted-controller bound this record to, read from the PINNED bundle manifest at integrate() time —
    // NEVER from result_envelope. Default "" preserves every pre-existing produce() call site (additive);
    // authorizesIntegration below requires it present+non-empty, fail-closed if absent.
    check_suite_version: typeof input.check_suite_version === "string" ? input.check_suite_version : (input.check_suite_version || ""),
    checker_digests: input.checker_digests && typeof input.checker_digests === "object" ? input.checker_digests : {},
    policy_digest: input.policy_digest || "",
    evidence_digests: input.evidence_digests && typeof input.evidence_digests === "object" ? input.evidence_digests : {},
    route: input.route != null ? input.route : null,
    fallback: input.fallback === true,
    lease_fencing_token: input.lease_fencing_token != null ? input.lease_fencing_token : null,
    integration_receipt: null, // filled in post-merge by commitIntegration's caller (split pre/post-merge, AC-5)
  };
  // ED-238/F2 (β fix-lock 0.91): the PRODUCER / parse boundary enforces the commit-identity schema BY
  // CONSTRUCTION — produce() FAILS CLOSED (throws) rather than emit a record whose base_commit/result_commit are
  // not immutable full 40-hex SHAs. This closes the bypass where produce() copied arbitrary/mutable/empty values
  // (authz still fail-closed downstream, but the by-construction invariant was absent — the ED238-PRODUCE-OLD-SHAPE
  // finding). Validate BEFORE stableDigest so the digest is only ever taken over a valid record.
  if (!validateCommitIdentity(record)) {
    throw new TypeError(
      "acceptance-record.produce: base_commit and result_commit MUST both be immutable full 40-hex commit SHAs " +
        `(ED-238) — got base_commit=${JSON.stringify(record.base_commit)}, result_commit=${JSON.stringify(record.result_commit)}. ` +
        "The trusted verifier must pass resolved commit SHAs.",
    );
  }
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
// ED-238: positive fixtures use IMMUTABLE full 40-hex SHAs for BOTH commit-identity fields (β's explicit add —
// a mutable "base-OK" base_commit was the occurrence-3 leak). base_commit === the head coords in the golden path.
const TEST_BASE_SHA = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const TEST_CAND_SHA = "cccccccccccccccccccccccccccccccccccccccc";
function produceForTest(overrides = {}) {
  const workorder = {
    schema_version: "workorder-min/v1",
    correlation_id: "corr-acceptance-positive-companion",
    role: "backend-builder",
    provider: "claude",
    model: "opus",
    base_commit: TEST_BASE_SHA,
    result_tree_hash: "tree-OK",
    allowed_capabilities: ["build"],
    allowed_paths: ["scripts/"],
    retry_lineage: [],
    evidence_refs: ["ev-1"],
    terminal_state: "success",
  };
  // ED-240b (β design-boundary DECIDE 0.92, discharging the ED238-POSTVALIDATION-OVERRIDE finding β conceded):
  // overrides are merged into the produce() INPUT — TOP-LEVEL (β rider 1: input.terminal_state has precedence
  // over workorder.terminal_state, so a flat spread covers every call site; never merge into the workorder
  // sub-object) — NOT Object.assigned onto the finished record. produce() therefore runs validateCommitIdentity
  // AND stableDigest over the FINAL record: a commit-identity override can no longer bypass the schema, and the
  // record_digest is never stale. produceForTest's contract is now "a FULLY-VALID, fresh-digest record"; an
  // intentionally-INVALID fixture uses forgeInvalidRecordForTest (the named adversarial door) instead.
  const input = {
    workorder,
    base_commit: TEST_BASE_SHA, // immutable full SHA (ED-238) — the head coords === this in the golden path
    result_tree_hash: "tree-OK",
    // ED-238: an IMMUTABLE full 40-hex candidate SHA. A ref-agnostic test treeResolver maps it to "tree-OK";
    // ref-aware tests key on this exact value.
    result_commit: TEST_CAND_SHA,
    target_ref: "refs/heads/integration",
    // SP-20260720-002 Phase 4 additive default — keeps produceForTest() a FULLY-VALID record under the new
    // mandatory authorizesIntegration check_suite_version gate below.
    check_suite_version: "check-suite/v1-test",
    checker_digests: { lint: "digest-lint", tests: "digest-tests" },
    policy_digest: "policy-OK",
    evidence_digests: { "ev-1": "digest-ev-1" },
    route: "claude:opus",
    fallback: false,
    lease_fencing_token: null,
  };
  return produce({ ...input, ...overrides });
}

/**
 * forgeInvalidRecordForTest(overrides) -> an intentionally-INVALID/forged AcceptanceRecord for ADVERSARIAL
 * fail-closed tests ONLY (ED-240b, the named residual of the produceForTest reconciliation). It applies overrides
 * AFTER produce() (post-validation), so a caller CAN inject a value the by-construction schema would reject
 * (e.g. an empty/mutable/non-SHA result_commit) to prove authorizesIntegration/commitIntegration FAIL CLOSED on a
 * malformed record. The record_digest is DELIBERATELY the pre-override digest — an honest forgery signal (a forged
 * record's self-digest does not re-attest its tampered content). NEVER use this for a happy-path fixture:
 * produceForTest is the always-valid door.
 *
 * SELF-GUARD (β rider 2): this helper asserts BY CONSTRUCTION that its output FAILS validateCommitIdentity before
 * returning AND FREEZES the record, so a forged fixture can never leak into a positive/authz-TRUE assertion (the
 * settable-label / false-green class). The freeze closes the gauntlet finding ED240-SELF-GUARD-MUTABLE-RETURN: a
 * point-in-time validate that returned a MUTABLE record could be defeated by re-assigning the invalidated field
 * back to a valid value AFTER return (forge `result_commit:""` → reassign a valid SHA → authorize). Object.freeze
 * makes the invalid commit-identity IMMUTABLE — the reassignment is a no-op (sloppy) or throws (strict), so the
 * record stays schema-invalid for its whole lifetime. A call with no schema-invalidating override is a MISUSE and
 * throws. One call site today; if a 2nd appears, add a lint per the ED-237-238-design-lock amendment.
 */
function forgeInvalidRecordForTest(overrides = {}) {
  const forged = Object.assign({}, produceForTest(), overrides);
  if (validateCommitIdentity(forged)) {
    throw new TypeError(
      "forgeInvalidRecordForTest MUST produce a record that FAILS validateCommitIdentity (ED-240b construction " +
        "invariant) — pass a schema-invalidating override (e.g. result_commit:'' / a mutable ref / a non-SHA). " +
        "For a VALID fixture use produceForTest.",
    );
  }
  // ED240-SELF-GUARD-MUTABLE-RETURN (security-lane binding fix): freeze so the invalid state is immutable by
  // construction — a caller cannot mutate the invalidated commit-identity back to a valid SHA after return.
  return Object.freeze(forged);
}

/**
 * authorizesIntegration(record, targetRef, opts) -> boolean. The CHOKE-POINT decision. TRUE only when
 * ALL hold (every coordinate is MANDATORY — the R2/C2 fix removed the opt-in skips that were fail-open):
 *   (a) record.target_ref === targetRef                                          (F4 re-correlation)
 *   (b) record.terminal_state === "success" (in the 5-state enum)                (F2 bare envelope / F6 non-success)
 *   (c) FULL content-addressed identity present + non-empty: workorder_digest / base_commit /
 *       result_tree_hash, result_commit is an IMMUTABLE full 40-hex SHA (R5-C2B — never a mutable ref),
 *       AND checker_digests + evidence_digests are non-empty maps whose EVERY value is a non-empty
 *       digest string (C2-R3 — a {lint:""} map is a contentless proof)                            (F11)
 *   (d) opts.integrationHead is REQUIRED and record.base_commit === it           (F3 TOCTOU freshness)
 *   (e) opts.spId + opts.leaseRoot are REQUIRED and record.lease_fencing_token is CURRENT
 *       per conductor-lease.verifyToken                                          (F10 lease x acceptance)
 *   (f) trusted-verifier RECOMPUTE (MANDATORY, no opt-out): recompute the tree from the RECORD-BOUND
 *       immutable candidate `record.result_commit` ONLY (R5-C2A — caller opts.resultRef/newHead may NOT
 *       override; if supplied they must resolve to EXACTLY record.result_commit, exact-SHA equality — TREE
 *       equality is insufficient) and it MUST === record.result_tree_hash        (R3-REG-1 / F11)
 *   (g) ancestry: record.base_commit MUST be an ancestor of record.result_commit (R5-C2B — candidate was
 *       built ON the declared base; blocks a same-tree commit unrelated to base)
 *
 * @param {object} record
 * @param {string} targetRef
 * @param {{integrationHead?:string, spId?:string, leaseRoot?:string, gitRoot?:string,
 *          resultRef?:string, newHead?:string, treeResolver?:function, commitResolver?:function,
 *          ancestryResolver?:function}} [opts]
 */
function authorizesIntegration(record, targetRef, opts = {}) {
  if (!record || typeof record !== "object") return false;
  if (typeof targetRef !== "string" || !targetRef) return false;

  // (a) exact target match — a record bound to A never authorizes B (SHARP-2a re-correlation).
  if (record.target_ref !== targetRef) return false;

  // (b) ONLY a "success" WorkOrder terminal state authorizes — an envelope's self-claimed success is
  //     irrelevant (F2/F6); an untyped ResultEnvelope has no terminal_state at all and fails here too.
  if (record.terminal_state !== "success" || !TERMINAL_STATES.includes(record.terminal_state)) return false;

  // FULL content-addressed identity MANDATORY (SP-20260718-005 gauntlet R2/C2 + R3/C2 + R5/C2B): the trust anchor
  // is the WHOLE verifier-bound identity, not just the tree. R1 required only tree/base/workorder present; R2
  // required the checker/policy/evidence digest MAPS non-empty; R3 (C2-R3) required every digest-map VALUE be a
  // non-empty string; R5 (C2B) pins result_commit to an IMMUTABLE full 40-hex SHA — "mandatory only syntactically"
  // (a mutable ref that could be retargeted) was insufficient. Any missing/empty/mis-typed coordinate fails closed.
  if (!record.result_tree_hash || !record.workorder_digest) return false; // digest presence (non-commit fields)
  // ED-238: EVERY commit-identity field (base_commit + result_commit) routes through the ONE validator — an
  // immutable full 40-hex SHA by construction. No inline field-by-field commit-SHA regex remains in this body.
  if (!validateCommitIdentity(record)) return false;
  // C2-R3: a digest MAP must be a non-empty object whose EVERY value is a non-empty digest string. Empty-string /
  // null / non-string values are a contentless proof — the exact bypass the gauntlet reproduced with {lint:""}.
  const _isDigestMap = (o) =>
    o && typeof o === "object" && !Array.isArray(o) &&
    Object.keys(o).length > 0 &&
    Object.values(o).every((v) => typeof v === "string" && v.trim().length > 0);
  if (!_isDigestMap(record.checker_digests)) return false; // the checkers-ran proof (every value a non-empty digest)
  if (typeof record.policy_digest !== "string" || !record.policy_digest.trim()) return false;
  if (!_isDigestMap(record.evidence_digests)) return false; // the evidence proof (every value a non-empty digest)
  // SP-20260720-002 Phase 4 (AC-2/AC-8): check_suite_version MUST be present + non-empty — fail-closed if
  // absent. Bound by produce() from the pinned bundle manifest's suite_version, never the caller/envelope.
  if (typeof record.check_suite_version !== "string" || !record.check_suite_version.trim()) return false;

  // (d) freshness MANDATORY (R2/C2) + head-coord SHA re-binding (ED-238): the caller MUST supply the live
  //     integration head, it MUST be an immutable full SHA, and the record's base MUST === it. base_commit is
  //     now a validated SHA (above), so this equality is a SHA-equality — a mutable/non-SHA integrationHead
  //     (that a retargeted base could match by spelling) fails the SHA gate first. No opt-out: absent → BLOCK.
  if (!isFullSha(opts.integrationHead)) return false;
  if (record.base_commit !== opts.integrationHead) return false;

  // (e) lease-fencing MANDATORY (R2/C2, SEC-4): the caller MUST supply the lease coordinates AND the record
  //     MUST carry a fencing token, and it MUST be current. The prior `if (opts.spId && opts.leaseRoot)`
  //     opt-in let a caller authorize under a superseded/absent lease by omitting the coordinates (fail-open).
  if (opts.spId == null || opts.leaseRoot == null) return false;
  if (record.lease_fencing_token == null) return false;
  if (!verifyFencingToken(opts.spId, record.lease_fencing_token, opts.leaseRoot)) return false;

  // (f) EXACT-SHA override guard (R5-C2A, β-binding): the recompute source is the RECORD-BOUND immutable
  //     candidate ONLY. A caller-supplied opts.resultRef/opts.newHead may NOT OUTRANK it (the R4 hole: caller
  //     opts took precedence, so passing targetRef re-opened the destination recompute, and the CAS path
  //     forwarded a DIFFERENT commit whose tree == result_tree_hash). If a caller DOES supply resultRef/newHead
  //     it must resolve to EXACTLY record.result_commit — exact-SHA equality; TREE EQUALITY IS INSUFFICIENT
  //     (the attack is a different commit with the same tree). A mismatched caller ref FAILS CLOSED here.
  const resolveCommit = typeof opts.commitResolver === "function" ? opts.commitResolver : resolveCommitSha;
  for (const callerRef of [opts.resultRef, opts.newHead]) {
    if (callerRef != null && String(callerRef) !== "") {
      const sha = resolveCommit(String(callerRef), opts);
      if (!sha || String(sha).toLowerCase() !== String(record.result_commit).toLowerCase()) return false;
    }
  }

  // (f') trusted-verifier RECOMPUTE — MANDATORY, never optional. Recompute result_tree_hash from the RECORD's
  //     own immutable candidate commit (record.result_commit), NOT targetRef (R3-REG-1: targetRef is the
  //     pre-merge DESTINATION whose tree is the base). The ONLY variable is the RESOLVER: real read-only git
  //     (default), injected opts.treeResolver in tests. Candidate tree unresolvable OR mismatched → FAIL CLOSED.
  const resolveTree = typeof opts.treeResolver === "function" ? opts.treeResolver : resolveTreeHash;
  const actualTree = resolveTree(record.result_commit, opts);
  if (!actualTree || String(actualTree).toLowerCase() !== String(record.result_tree_hash).toLowerCase()) return false;

  // (g) ANCESTRY (R5-C2B, β-binding): record.base_commit MUST be an ancestor of record.result_commit — the
  //     candidate was built ON the declared base. Blocks a same-tree commit that is UNRELATED to base_commit
  //     (a tree match alone does not prove the candidate descends from the base the record claims). Injectable
  //     opts.ancestryResolver(base, candidate, opts) in tests; real read-only `git merge-base --is-ancestor`
  //     by default. Fail-closed if the relationship cannot be confirmed.
  const isAncestor = typeof opts.ancestryResolver === "function" ? opts.ancestryResolver : defaultIsAncestor;
  if (isAncestor(record.base_commit, record.result_commit, opts) !== true) return false;

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
  // ED-238 axis-(b) no-bypass (β fix-lock 0.91): route the commit-identity through the ONE validator BEFORE any
  // read of record.base_commit / record.result_commit (the hoisted CAS check + expected-head-base check read them
  // below). No commit-identity reader precedes validateCommitIdentity.
  if (!validateCommitIdentity(record)) return { ok: false, reason: "invalid-commit-identity" };
  if (opts.expectedHead == null) return { ok: false, reason: "missing-expected-head" };

  // C3/R2 + ED-238 head-coord re-binding: BIND the CAS to the accepted content — expectedHead (the head
  // validation observed) MUST be an immutable full SHA AND MUST === the record's base_commit (itself a
  // validated SHA), so a stale/mutable base cannot authorize a merge whose expectedHead was a different head.
  if (!isFullSha(opts.expectedHead)) return { ok: false, reason: "expected-head-not-sha" };
  if (opts.expectedHead !== record.base_commit) return { ok: false, reason: "expected-head-base-mismatch" };

  if (opts.spId != null && opts.leaseRoot != null) {
    if (!verifyFencingToken(opts.spId, record.lease_fencing_token, opts.leaseRoot)) {
      return { ok: false, reason: "superseded-lease" };
    }
  }

  // ED-238 CAS REACHABILITY (β add 1 — dead-gate/BC-16 close): for the real-mutation path, validate newHead as a
  // full SHA AND bind it to the EXACT candidate BEFORE the nested authz call — and DO NOT forward newHead into
  // authz's override guard (stripped below), so THIS is the SOLE reachable authority for the newHead↔candidate
  // binding. The R5 order let authz reject a mismatched newHead first (→ not-authorized), so the old CAS guard
  // was a DEAD gate deletable without failing any test. A mismatch here returns EXACTLY new-head-not-bound-candidate.
  if (opts.performRefUpdate === true) {
    if (!isFullSha(opts.newHead)) return { ok: false, reason: "missing-new-head-for-ref-update" };
    if (String(opts.newHead).toLowerCase() !== String(record.result_commit).toLowerCase()) {
      return { ok: false, reason: "new-head-not-bound-candidate" };
    }
  }

  // Re-verify FULL authorization (defense-in-depth over the pre/post-merge split). newHead is STRIPPED from
  // authzOpts — it is validated + candidate-bound above, and must NOT also be checked by authz's override guard
  // (that redundancy is exactly what made the CAS guard unreachable). integrationHead defaults to the validated
  // expectedHead (=== base_commit above) so the mandatory freshness check has its input.
  const authzOpts = { ...opts, newHead: undefined, integrationHead: opts.integrationHead != null ? opts.integrationHead : opts.expectedHead };
  if (!authorizesIntegration(record, targetRef, authzOpts)) return { ok: false, reason: "not-authorized" };

  const liveHead = opts.liveHead !== undefined ? opts.liveHead : resolveCommitSha(targetRef, opts);
  if (liveHead == null) return { ok: false, reason: "unresolvable-live-head" };
  if (!isFullSha(liveHead)) return { ok: false, reason: "live-head-not-sha" }; // ED-238 head-coord re-binding
  if (liveHead !== opts.expectedHead) return { ok: false, reason: "validation-to-merge-race" };

  if (opts.performRefUpdate === true) {
    // newHead already validated (full SHA) + candidate-bound (=== record.result_commit) above.
    // C3/R2: the committed newHead MUST also resolve to the ACCEPTED tree — the CAS can advance the ref only to a
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
  forgeInvalidRecordForTest,
  authorizesIntegration,
  commitIntegration,
  resolveTreeHash,
  resolveCommitSha,
  defaultIsAncestor,
  validateCommitIdentity,
  stableDigest,
  // exported for ED-238 tests (immutable full-SHA fixtures — reference, don't re-hardcode/drift)
  TEST_BASE_SHA,
  TEST_CAND_SHA,
};
