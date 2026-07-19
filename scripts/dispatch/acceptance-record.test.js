"use strict";
/**
 * acceptance-record.test.js — the CROSS-SESSION AcceptanceRecord (SP-20260718-005, unit SEC-2).
 * Happy path + adversarial paths (the standalone unit-level coverage; the SP-005 falsifier corpus in
 * scripts/dispatch/falsifiers/*.falsifier.test.js is the BINDING gauntlet-facing surface — this file is
 * the module's own regression suite, exercising the same seams with more granularity/isolation).
 * Run: node --test scripts/dispatch/acceptance-record.test.js
 */
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const { test } = require("node:test");
const assert = require("node:assert");

const acc = require("./acceptance-record");
const lease = require("./conductor-lease");
const { workOrderDigest } = require("./workorder-schema");

function tmpLeaseRoot(tag) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `acc-lease-${tag}-`));
}

// ── produce() shape ─────────────────────────────────────────────────────────────────────────────────
test("produce() binds workorder_digest + base/tree/target + digests + route/fallback + lease token", () => {
  const workorder = {
    schema_version: "workorder-min/v1",
    correlation_id: "corr-1",
    role: "backend-builder",
    provider: "claude",
    model: "opus",
    base_commit: "base-1",
    result_tree_hash: "tree-1",
    allowed_capabilities: ["build"],
    allowed_paths: ["scripts/"],
    retry_lineage: [],
    evidence_refs: [],
    terminal_state: "success",
  };
  const record = acc.produce({
    workorder,
    base_commit: "base-1",
    result_tree_hash: "tree-1",
    target_ref: "refs/heads/integration",
    checker_digests: { lint: "d1" },
    policy_digest: "p1",
    evidence_digests: { ev: "e1" },
    route: "claude:opus",
    fallback: false,
    lease_fencing_token: 3,
  });
  assert.strictEqual(record.workorder_digest, workOrderDigest(workorder));
  assert.strictEqual(record.base_commit, "base-1");
  assert.strictEqual(record.result_tree_hash, "tree-1");
  assert.strictEqual(record.target_ref, "refs/heads/integration");
  assert.strictEqual(record.terminal_state, "success");
  assert.deepStrictEqual(record.checker_digests, { lint: "d1" });
  assert.strictEqual(record.policy_digest, "p1");
  assert.deepStrictEqual(record.evidence_digests, { ev: "e1" });
  assert.strictEqual(record.route, "claude:opus");
  assert.strictEqual(record.fallback, false);
  assert.strictEqual(record.lease_fencing_token, 3);
  assert.strictEqual(typeof record.record_digest, "string");
  assert.strictEqual(record.record_digest.length, 64); // sha256 hex
});

test("produce() accepts a pre-computed workorder_digest string directly (no workorder object required)", () => {
  const record = acc.produce({ workorder: "digest-precomputed", terminal_state: "success", target_ref: "refs/heads/x" });
  assert.strictEqual(record.workorder_digest, "digest-precomputed");
});

test("produceForTest() yields a record acceptable to the golden path (positive companion contract)", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/integration" });
  assert.strictEqual(record.target_ref, "refs/heads/integration");
  assert.strictEqual(record.terminal_state, "success");
  assert.ok(record.result_tree_hash && record.base_commit && record.workorder_digest);
});

// SP-20260718-005 gauntlet C2 fix: recompute is now MANDATORY (no opt-in). A happy path must inject a
// treeResolver that returns the honest synthetic tree ("tree-OK") — the analog of production's real
// read-only git resolving the target ref's actual tree and it MATCHING the record's claimed digest.
const okTree = () => "tree-OK";
// ED-238: the immutable full-SHA base_commit produceForTest binds; the golden-path head coords === this.
const BASE = acc.TEST_BASE_SHA;
// A DIFFERENT immutable full SHA (!= BASE / != candidate) for mismatch/race/substitution teeth.
const OTHER_SHA = "dddddddddddddddddddddddddddddddddddddddd";

// SP-20260718-005 gauntlet R2/C2: authorizesIntegration now requires the FULL mandatory context — a live
// integrationHead (=== the record's base BASE), REAL lease coordinates + a current fencing token on the
// record, plus the injected tree resolver. This helper mints a valid lease and returns a fully-valid record
// + the opts that authorize it (the production shape). Happy paths must pass through it.
function validCtx(tag) {
  const root = tmpLeaseRoot(tag);
  const spId = "SP-" + String(tag).toUpperCase();
  const a = lease.acquire(spId, { root, sessionId: "sess-" + tag });
  const record = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: a.token });
  // R5: recompute reads the record's immutable 40-hex result_commit (okTree is ref-agnostic → "tree-OK"), and
  // ancestry is MANDATORY — inject a resolver that confirms base is an ancestor of the synthetic candidate.
  const opts = { integrationHead: BASE, spId, leaseRoot: root, treeResolver: okTree, ancestryResolver: () => true };
  return { root, spId, token: a.token, record, opts };
}

// ── authorizesIntegration() happy path ──────────────────────────────────────────────────────────────
test("HAPPY: a fully-valid record with fresh base + current lease + confirmed recompute authorizes", () => {
  const { record, opts } = validCtx("happy4");
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration", opts), true);
});

test("FAIL-CLOSED (R2/C2): omitting the MANDATORY freshness head BLOCKS even an otherwise-valid record", () => {
  const { record, opts } = validCtx("happy4b");
  const { integrationHead, ...noHead } = opts; // drop the mandatory freshness coordinate
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration", noHead), false);
});

test("FAIL-CLOSED (R2/C2): omitting the MANDATORY lease coordinates BLOCKS even an otherwise-valid record", () => {
  const { record, opts } = validCtx("happy4c");
  const { spId, leaseRoot, ...noLease } = opts; // drop the mandatory lease coordinates
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration", noLease), false);
});

test("FAIL-CLOSED (R2/C2): a record missing the checker/policy/evidence identity digests BLOCKS", () => {
  const { record, opts } = validCtx("happy4d");
  for (const missing of [{ checker_digests: {} }, { policy_digest: "" }, { evidence_digests: {} }]) {
    const bad = Object.assign({}, record, missing);
    assert.strictEqual(acc.authorizesIntegration(bad, "refs/heads/integration", opts), false, JSON.stringify(missing));
  }
});

test("FAIL-CLOSED (C2 fix): authorizesIntegration with NO opts DOES NOT authorize — recompute is mandatory, and the default git resolver cannot confirm a synthetic tree, so it BLOCKS (the prior fail-open path is closed)", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/integration" });
  // No treeResolver -> the real read-only git resolver runs against a ref that does not resolve here -> null -> BLOCK.
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration"), false);
});

// ── adversarial: not a record at all ────────────────────────────────────────────────────────────────
test("ADVERSARIAL: null/undefined/non-object record never authorizes", () => {
  assert.strictEqual(acc.authorizesIntegration(null, "refs/heads/x"), false);
  assert.strictEqual(acc.authorizesIntegration(undefined, "refs/heads/x"), false);
  assert.strictEqual(acc.authorizesIntegration("a string", "refs/heads/x"), false);
  assert.strictEqual(acc.authorizesIntegration(42, "refs/heads/x"), false);
});

test("ADVERSARIAL: a bare ResultEnvelope (success:true, no target_ref/terminal_state) never authorizes", () => {
  const envelope = { success: true, provider: "openai", role: "backend-builder" };
  assert.strictEqual(acc.authorizesIntegration(envelope, "refs/heads/integration"), false);
});

test("ADVERSARIAL: target mismatch blocks even a well-formed record", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/feature-A" });
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/feature-B"), false);
});

test("ADVERSARIAL: non-empty targetRef required (empty string / non-string never authorizes)", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/integration" });
  assert.strictEqual(acc.authorizesIntegration(record, ""), false);
  assert.strictEqual(acc.authorizesIntegration(record, null), false);
});

for (const nonSuccess of ["partial", "blocked", "failed", "cancelled"]) {
  test(`ADVERSARIAL: terminal_state=${nonSuccess} never authorizes even with matching target`, () => {
    const record = acc.produceForTest({ target_ref: "refs/heads/integration", terminal_state: nonSuccess });
    assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration"), false);
  });
}

test("ADVERSARIAL: an unrecognized terminal_state string never authorizes (not in the 5-state enum)", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/integration", terminal_state: "done-ish" });
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration"), false);
});

for (const missing of ["result_tree_hash", "base_commit", "workorder_digest"]) {
  test(`ADVERSARIAL: a record missing ${missing} never authorizes (incomplete content-addressed identity)`, () => {
    const record = acc.produceForTest({ target_ref: "refs/heads/integration" });
    record[missing] = "";
    assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration"), false);
  });
}

test("ADVERSARIAL: stale base against a supplied integrationHead blocks (TOCTOU)", () => {
  // Both are valid immutable SHAs (identity passes) but the record's base is STALE against the live head.
  const record = acc.produceForTest({ target_ref: "refs/heads/integration", base_commit: OTHER_SHA });
  assert.strictEqual(
    acc.authorizesIntegration(record, "refs/heads/integration", { integrationHead: BASE }), // live head != the record's stale base
    false,
  );
});

test("ADVERSARIAL (C2 fix): a forged result_tree_hash is caught ALWAYS — recompute is mandatory, not opt-in", () => {
  const forged = acc.produceForTest({ target_ref: "refs/heads/integration", result_tree_hash: "f".repeat(40) });
  // (a) With a resolver returning the HONEST real tree ("tree-OK"), the forged digest does not match -> BLOCK.
  //     This PROVES the recompute catches a fabricated digest against a real ref (the old test only passed
  //     because the ref failed to resolve at all — a weaker signal the qa lane flagged).
  assert.strictEqual(acc.authorizesIntegration(forged, "refs/heads/integration", { treeResolver: okTree }), false);
  // (b) With NO resolver (the production default git resolver, unresolvable ref) it also BLOCKS — there is
  //     no opt-out that would bless the forged record (the fail-open path is gone).
  assert.strictEqual(acc.authorizesIntegration(forged, "refs/heads/integration"), false);
});

test("ADVERSARIAL: recompute against an unresolvable target ref fails closed even for a plausible-looking hash", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/does-not-exist-at-all" });
  assert.strictEqual(
    acc.authorizesIntegration(record, "refs/heads/does-not-exist-at-all"),
    false,
  );
});

test("ADVERSARIAL: lease-fencing seam — a record minted under a superseded lease token blocks (SEC-4)", () => {
  const root = tmpLeaseRoot("acc-f10-unit");
  const spId = "SP-ACC-UNIT";
  const a1 = lease.acquire(spId, { root, sessionId: "sess-stale" });
  lease.release(spId, { root, token: a1.token });
  lease.acquire(spId, { root, sessionId: "sess-current" }); // supersedes a1
  const record = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: a1.token });
  assert.strictEqual(
    acc.authorizesIntegration(record, "refs/heads/integration", { spId, leaseRoot: root }),
    false,
  );
});

test("HAPPY: lease-fencing seam — a record minted under the CURRENT lease token authorizes", () => {
  const root = tmpLeaseRoot("acc-f10-happy");
  const spId = "SP-ACC-UNIT-HAPPY";
  const a1 = lease.acquire(spId, { root, sessionId: "sess-current" });
  const record = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: a1.token });
  assert.strictEqual(
    acc.authorizesIntegration(record, "refs/heads/integration", { integrationHead: BASE, spId, leaseRoot: root, treeResolver: okTree, ancestryResolver: () => true }),
    true,
  );
});

// ── C2-R3 (gauntlet round 3): digest-map VALUES must be non-empty digest strings, not just non-empty maps ──
// The R3 finding: checker_digests/evidence_digests only required a non-empty OBJECT, so {lint:""} / {ev:""}
// authorized a CONTENTLESS verifier claim (the "checkers ran" proof was empty). Every VALUE must be a
// non-empty digest string.
test("TEETH (C2-R3): a digest MAP with an empty / whitespace / null / non-string VALUE does NOT authorize", () => {
  const { record, opts } = validCtx("c2r3");
  const badMaps = [
    { checker_digests: { lint: "" } },
    { checker_digests: { lint: "   " } },
    { checker_digests: { lint: null } },
    { checker_digests: { lint: 123 } },
    { checker_digests: { lint: {} } },
    { checker_digests: { lint: "digest-ok", tests: "" } }, // one good, one empty — EVERY value must be non-empty
    { evidence_digests: { ev: "" } },
    { evidence_digests: { ev: null } },
    { evidence_digests: { ev: 0 } },
    { evidence_digests: { ev: "digest-ok", ev2: "  " } },
  ];
  for (const bad of badMaps) {
    const rec = Object.assign({}, record, bad);
    assert.strictEqual(
      acc.authorizesIntegration(rec, "refs/heads/integration", opts),
      false,
      "a contentless digest value must fail closed: " + JSON.stringify(bad),
    );
  }
});

test("TEETH (C2-R3): the positive companion still authorizes — a map whose values are ALL non-empty digest strings", () => {
  const { record, opts } = validCtx("c2r3-pos");
  // sanity: produceForTest's maps ({lint:'digest-lint',tests:'digest-tests'} / {ev-1:'digest-ev-1'}) pass.
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration", opts), true);
});

// ── R3-REG-1 (gauntlet round 3): recompute reads the CANDIDATE commit's tree, NOT the destination's base tree ──
// The R3 regression: authorization recomputed result_tree_hash from targetRef — the pre-merge DESTINATION, whose
// tree is the BASE tree (nothing merged yet). For any real non-empty integration the destination tree never
// equals the CANDIDATE's result tree, so every real integration returned not-authorized (a fail-closed
// availability defect). These teeth use a REF-AWARE resolver (the destination and the candidate resolve to
// DIFFERENT trees) — the exact shape the unit suite's ref-agnostic okTree could never distinguish.
const CAND_SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"; // an immutable 40-hex candidate SHA (R5-C2B)
function refAwareCtx(tag, { resultTree = "RESULT-TREE", claimTree = "RESULT-TREE" } = {}) {
  const root = tmpLeaseRoot(tag);
  const spId = "SP-" + String(tag).toUpperCase();
  const a = lease.acquire(spId, { root, sessionId: "sess-" + tag });
  const record = acc.produceForTest({
    target_ref: "refs/heads/integration",
    lease_fencing_token: a.token,
    base_commit: BASE,
    result_tree_hash: claimTree,   // what the record CLAIMS the accepted tree is
    result_commit: CAND_SHA,       // the immutable candidate commit the accepted work lives at (40-hex SHA)
  });
  const refAware = (ref) => {
    if (ref === CAND_SHA) return resultTree;                  // candidate → accepted result tree
    if (ref === "refs/heads/integration") return "BASE-TREE"; // destination still at base → base tree
    return null;
  };
  // ancestry MANDATORY — base is an ancestor of the candidate in a real integration.
  const opts = { integrationHead: BASE, spId, leaseRoot: root, treeResolver: refAware, ancestryResolver: () => true };
  return { root, spId, token: a.token, record, opts };
}

test("TEETH (R3-REG-1): a REAL integration AUTHORIZES — recompute reads the CANDIDATE commit's tree, not the destination's base tree", () => {
  const { record, opts } = refAwareCtx("r3reg1-real"); // claimTree === resultTree === "RESULT-TREE"
  // With the fix (recompute from the candidate "cand-OK" → "RESULT-TREE" === the claimed "RESULT-TREE") this
  // AUTHORIZES. The OLD code recomputed from targetRef → "BASE-TREE" != "RESULT-TREE" and returned false — the
  // exact availability defect the security reviewer traced ("simulated pre-merge trace returned not-authorized").
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration", opts), true);
});

test("TEETH (R3-REG-1): a record whose result_tree_hash matches only the DESTINATION base tree does NOT authorize", () => {
  // The record CLAIMS the destination's BASE-TREE as its result. Recompute reads the CANDIDATE ("RESULT-TREE"),
  // which != the claimed "BASE-TREE" → BLOCK. This proves the recompute source is the candidate, not the
  // destination — a record can no longer authorize by matching the pre-merge destination tree.
  const { record, opts } = refAwareCtx("r3reg1-destmatch", { resultTree: "RESULT-TREE", claimTree: "BASE-TREE" });
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration", opts), false);
});

test("TEETH (R3-REG-1): full authorize-then-CAS DETERMINATION on the real-integration shape returns ok (end-to-end, no real git mutation)", () => {
  const { record, opts } = refAwareCtx("r3reg1-cas");
  const result = acc.commitIntegration(record, "refs/heads/integration", {
    ...opts,
    expectedHead: BASE, // the validated destination head === base
    liveHead: BASE,     // destination still at base at CAS time (F12: unmoved since validation)
    // no performRefUpdate → pure CAS DETERMINATION, no real git write
  });
  assert.strictEqual(result.ok, true, result.reason);
  assert.strictEqual(result.receipt.committed_head, BASE);
});

test("TEETH (R3-REG-1): with NO bound candidate (empty result_commit) authorization FAILS CLOSED", () => {
  // A record with no immutable candidate the accepted tree can be recomputed FROM cannot be authorized — the
  // empty result_commit fails the immutable-SHA identity gate (R5-C2B). Fail-closed (never recompute the destination).
  const root = tmpLeaseRoot("r3reg1-nocand");
  const spId = "SP-R3REG1-NOCAND";
  const a = lease.acquire(spId, { root, sessionId: "sess-nocand" });
  const record = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: a.token, result_commit: "" });
  const opts = { integrationHead: BASE, spId, leaseRoot: root, treeResolver: okTree, ancestryResolver: () => true };
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration", opts), false);
});

// ── R5-C2A / R5-C2B (bounded-final, β-binding): record-bound candidate outranks caller opts; immutable-SHA + ancestry ──
// R4 (qa+security): the R3-REG-1 fix let caller opts.resultRef/newHead OUTRANK the record-bound result_commit
// (pass targetRef → recompute the base tree; the CAS forwards a DIFFERENT commit whose tree == result_tree_hash),
// and result_commit was "mandatory only syntactically" (a mutable ref, no ancestry). R5 pins result_commit to an
// immutable 40-hex SHA, recomputes from it ONLY, requires any caller ref to EXACT-SHA-match it (tree equality
// insufficient), binds the CAS to the exact candidate, and enforces base-is-ancestor-of-candidate.

test("TEETH (R5-C2A): a caller passing the DESTINATION targetRef via opts.resultRef does NOT authorize (exact-SHA guard, not a recompute override)", () => {
  const { record, opts } = refAwareCtx("r5c2a-override");
  // The attacker passes the destination ref as resultRef, hoping to recompute the base tree. It resolves to a
  // base commit SHA that is NOT record.result_commit → the exact-SHA override guard BLOCKS (no precedence).
  const attack = {
    ...opts,
    resultRef: "refs/heads/integration",
    commitResolver: (ref) => (ref === "refs/heads/integration" ? "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" : null),
  };
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration", attack), false);
});

test("TEETH (R5-C2A): a caller passing a DIFFERENT SAME-TREE commit via opts.newHead does NOT authorize — exact-SHA equality, TREE equality is insufficient", () => {
  const { record, opts } = refAwareCtx("r5c2a-sametree");
  const OTHER = "dddddddddddddddddddddddddddddddddddddddd"; // a DIFFERENT commit whose tree ALSO == RESULT-TREE
  const attack = {
    ...opts,
    newHead: OTHER,
    commitResolver: (ref) => ref, // full SHA resolves to itself
    treeResolver: (ref) => (ref === OTHER || ref === CAND_SHA ? "RESULT-TREE" : "BASE-TREE"),
  };
  // Even though OTHER's TREE matches result_tree_hash, OTHER !== record.result_commit → exact-SHA guard BLOCKS.
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration", attack), false);
});

test("TEETH (R5-C2A): a caller ref that EXACTLY equals record.result_commit still authorizes (the guard rejects substitution, not use)", () => {
  const { record, opts } = refAwareCtx("r5c2a-happy");
  const ok = { ...opts, newHead: CAND_SHA, commitResolver: (ref) => ref };
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration", ok), true);
});

test("TEETH (ED-238 CAS-reachability): commitIntegration performRefUpdate BLOCKS a DIFFERENT same-tree newHead with EXACTLY new-head-not-bound-candidate (the guard is independently reachable — deleting it would fail this test)", () => {
  const { record, opts } = refAwareCtx("r5c2a-cas");
  // A DIFFERENT full-SHA commit whose TREE also == the accepted result tree — the same-tree-substitution attack.
  const result = acc.commitIntegration(record, "refs/heads/integration", {
    ...opts,
    expectedHead: BASE,
    liveHead: BASE,
    performRefUpdate: true,
    newHead: OTHER_SHA, // != record.result_commit (CAND_SHA)
    commitResolver: (ref) => ref,
    treeResolver: (ref) => (ref === OTHER_SHA || ref === CAND_SHA ? "RESULT-TREE" : "BASE-TREE"),
  });
  assert.strictEqual(result.ok, false);
  // EXACT reason (β add 1): the newHead↔candidate binding is checked BEFORE the nested authz, and newHead is
  // stripped from authzOpts, so THIS guard is the sole reachable authority. It is NOT an OR of two rejections:
  // deleting the guard lets the same-tree substitute pass the tree check + mutate the ref → this assert fails.
  assert.strictEqual(result.reason, "new-head-not-bound-candidate");
});

test("TEETH (R5-C2B): a result_commit that is NOT an immutable 40-hex SHA (ref name / short sha / empty / non-hex / wrong length) does NOT authorize", () => {
  const { record, opts } = validCtx("r5c2b-sha");
  const badCommits = [
    "refs/heads/candidate", // a mutable ref — retargetable
    "abc1234",              // a short/abbreviated sha
    "",                     // empty
    "cccccccccccccccccccccccccccccccccccccccg", // 40 chars but non-hex 'g'
    "cccccccccccccccccccccccccccccccccccccc",   // 38 hex (too short)
    "ccccccccccccccccccccccccccccccccccccccccc", // 41 hex (too long)
  ];
  for (const bad of badCommits) {
    const rec = Object.assign({}, record, { result_commit: bad });
    assert.strictEqual(acc.authorizesIntegration(rec, "refs/heads/integration", opts), false, "non-SHA result_commit must fail closed: " + JSON.stringify(bad));
  }
});

test("TEETH (R5-C2B): a candidate UNRELATED to base_commit (base is NOT an ancestor) does NOT authorize even with a valid tree recompute", () => {
  const { record, opts } = refAwareCtx("r5c2b-ancestry");
  const noAncestry = { ...opts, ancestryResolver: () => false }; // candidate does not descend from base
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration", noAncestry), false);
});

test("defaultIsAncestor: real git — HEAD~1 IS an ancestor of HEAD; HEAD is NOT an ancestor of HEAD~1", () => {
  const parent = acc.resolveCommitSha("HEAD~1");
  const child = acc.resolveCommitSha("HEAD");
  assert.ok(parent && child, "this repo must have at least 2 commits");
  assert.strictEqual(acc.defaultIsAncestor(parent, child), true);
  assert.strictEqual(acc.defaultIsAncestor(child, parent), false);
  assert.strictEqual(acc.defaultIsAncestor("", child), false); // fail-closed on empty
});

// ── ED-238 (mechanism unit, β design-lock 0.90): the ONE commit-identity validator + head-coord SHA re-binding ──
// The occurrence-3 leak was base_commit staying "mandatory only syntactically" (any truthy string) while only
// result_commit was SHA-pinned — a mutable base reopened stale-base auth. R5 pinned result_commit field-by-field
// inline; ED-238 routes EVERY commit-identity field through validateCommitIdentity + SHA-gates the head coords.

test("validateCommitIdentity: TRUE only when BOTH base_commit AND result_commit are immutable full 40-hex SHAs", () => {
  const ok = { base_commit: acc.TEST_BASE_SHA, result_commit: acc.TEST_CAND_SHA };
  assert.strictEqual(acc.validateCommitIdentity(ok), true);
  for (const bad of [
    { base_commit: "refs/heads/x", result_commit: acc.TEST_CAND_SHA }, // mutable ref base
    { base_commit: "abc1234", result_commit: acc.TEST_CAND_SHA },       // short base
    { base_commit: "", result_commit: acc.TEST_CAND_SHA },              // empty base
    { base_commit: acc.TEST_BASE_SHA, result_commit: "refs/heads/y" },  // mutable ref candidate
    { base_commit: "g".repeat(40), result_commit: acc.TEST_CAND_SHA },  // 40 non-hex
    { base_commit: acc.TEST_BASE_SHA, result_commit: "c".repeat(41) },  // 41 hex
    null, undefined, "not-an-object",
  ]) {
    assert.strictEqual(acc.validateCommitIdentity(bad), false, "must reject: " + JSON.stringify(bad));
  }
});

test("TEETH (ED-238): a MUTABLE / malformed base_commit does NOT authorize — routed through the ONE validator", () => {
  const { record, opts } = validCtx("ed238-base");
  for (const bad of ["refs/heads/integration", "abc1234", "", "b".repeat(39), "b".repeat(41), "g".repeat(40)]) {
    const rec = Object.assign({}, record, { base_commit: bad });
    // integrationHead must still === base_commit, so pass the bad value as the head too — the SHA gate on the
    // record's base_commit (via the validator) blocks it regardless.
    const o = Object.assign({}, opts, { integrationHead: bad });
    assert.strictEqual(acc.authorizesIntegration(rec, "refs/heads/integration", o), false, "mutable/malformed base must fail closed: " + JSON.stringify(bad));
  }
});

test("TEETH (ED-238 head-coord): a non-SHA integrationHead does NOT authorize even if it string-equals a (would-be) base", () => {
  const { record, opts } = validCtx("ed238-inthead");
  // A caller supplies a mutable head that spelling-matches nothing valid — the head-coord SHA gate blocks it.
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration", Object.assign({}, opts, { integrationHead: "refs/heads/integration" })), false);
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration", Object.assign({}, opts, { integrationHead: "b".repeat(39) })), false);
});

test("TEETH (ED-238 head-coord): commitIntegration BLOCKS a non-SHA expectedHead / liveHead", () => {
  const { record, opts } = validCtx("ed238-commithead");
  const bad1 = acc.commitIntegration(record, "refs/heads/integration", { ...opts, expectedHead: "refs/heads/integration", liveHead: BASE });
  assert.strictEqual(bad1.ok, false);
  assert.strictEqual(bad1.reason, "expected-head-not-sha");
  const bad2 = acc.commitIntegration(record, "refs/heads/integration", { ...opts, expectedHead: BASE, liveHead: "refs/heads/integration" });
  assert.strictEqual(bad2.ok, false);
  assert.strictEqual(bad2.reason, "live-head-not-sha");
});

test("ADVERSARIAL: lease coordinates given but the conductor-lease module can't be resolved -> fails closed", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: 1 });
  // No lease was ever acquired at this root — verifyToken has nothing to confirm against -> false.
  const root = tmpLeaseRoot("acc-empty");
  assert.strictEqual(
    acc.authorizesIntegration(record, "refs/heads/integration", { spId: "SP-NEVER-ACQUIRED", leaseRoot: root }),
    false,
  );
});

// ── commitIntegration() — the post-merge CAS receipt, split from pre-merge authorization ──────────────
test("HAPPY: commitIntegration succeeds when the live head matches the validated head (bound to base_commit)", () => {
  const { record, opts } = validCtx("commit-happy");
  const result = acc.commitIntegration(record, "refs/heads/integration", { ...opts, expectedHead: BASE, liveHead: BASE });
  assert.strictEqual(result.ok, true, result.reason);
  assert.strictEqual(result.receipt.target_ref, "refs/heads/integration");
  assert.strictEqual(result.receipt.committed_head, BASE);
});

test("ADVERSARIAL (R2/C3): commitIntegration blocks when expectedHead !== the record's base_commit (CAS not bound to accepted base)", () => {
  const { record, opts } = validCtx("commit-basebind");
  const result = acc.commitIntegration(record, "refs/heads/integration", { ...opts, expectedHead: OTHER_SHA, liveHead: OTHER_SHA });
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.reason, "expected-head-base-mismatch");
});

test("ADVERSARIAL: commitIntegration blocks when the live head moved since validation (F12 CAS race)", () => {
  const { record, opts } = validCtx("commit-race");
  const result = acc.commitIntegration(record, "refs/heads/integration", { ...opts, expectedHead: BASE, liveHead: OTHER_SHA });
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.reason, "validation-to-merge-race");
});

test("ADVERSARIAL: commitIntegration blocks on a target-ref mismatch", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/feature-A" });
  const result = acc.commitIntegration(record, "refs/heads/feature-B", { expectedHead: "H1", liveHead: "H1", treeResolver: okTree });
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.reason, "target-mismatch");
});

test("ADVERSARIAL: commitIntegration requires an expectedHead (no implicit trust-the-record shortcut)", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/integration" });
  const result = acc.commitIntegration(record, "refs/heads/integration", { liveHead: "H1" });
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.reason, "missing-expected-head");
});

test("ADVERSARIAL: commitIntegration honors the lease-fencing seam too (a superseded lease blocks the CAS receipt)", () => {
  const root = tmpLeaseRoot("acc-commit-lease");
  const spId = "SP-ACC-COMMIT";
  const a1 = lease.acquire(spId, { root, sessionId: "sess-stale" });
  lease.release(spId, { root, token: a1.token });
  lease.acquire(spId, { root, sessionId: "sess-current" });
  const record = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: a1.token });
  const result = acc.commitIntegration(record, "refs/heads/integration", {
    expectedHead: BASE,
    liveHead: BASE,
    spId,
    leaseRoot: root,
  });
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.reason, "superseded-lease");
});

test("TEETH (C3 fix): commitIntegration BLOCKS a forged-tree record even with matching heads + a VALID lease — recompute inside authorization catches it", () => {
  // A record with a fabricated result_tree_hash but an otherwise-valid lease/context, so authorization REACHES
  // the mandatory recompute (not just the lease/identity guards) and the honest resolver ("tree-OK" != forged) BLOCKS.
  const { opts, token } = validCtx("commit-forged");
  const forged = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: token, result_tree_hash: "f".repeat(40) });
  const result = acc.commitIntegration(forged, "refs/heads/integration", {
    ...opts,
    expectedHead: BASE,
    liveHead: BASE,
    newHead: acc.TEST_CAND_SHA, // === result_commit → passes the CAS candidate-binding, so authz gets to gate the forged tree
    performRefUpdate: true, // even asking for the real mutation, authorization gates it first
  });
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.reason, "not-authorized");
});

test("commitIntegration never mutates git by default (no performRefUpdate opt-in)", () => {
  const root = tmpLeaseRoot("commit-noop");
  const spId = "SP-COMMIT-NOOP";
  const a = lease.acquire(spId, { root, sessionId: "sess-noop" });
  const record = acc.produceForTest({ target_ref: "refs/heads/acc-record-noop-test-ref", lease_fencing_token: a.token });
  const result = acc.commitIntegration(record, "refs/heads/acc-record-noop-test-ref", {
    integrationHead: BASE,
    spId,
    leaseRoot: root,
    expectedHead: BASE,
    liveHead: BASE,
    treeResolver: okTree,
    ancestryResolver: () => true,
  });
  assert.strictEqual(result.ok, true, result.reason);
  // resolveCommitSha must still find nothing for this never-created ref (no side effect occurred).
  assert.strictEqual(acc.resolveCommitSha("refs/heads/acc-record-noop-test-ref"), null);
});

// ── H5 (R2, lead ruling): the no-op-lexical-bypass is REFUSED AT RUNTIME by the mutation primitive ──────
test("H5 falsifier: a no-op-lexical-choke-point bypass is defeated IN-PRIMITIVE — commitIntegration + authorizesIntegration refuse an under-authorized record regardless of any nearby no-op authorizesIntegration() call", () => {
  // The attack (H5): an integrator places a NO-OP `authorizesIntegration(record, ref);` (result discarded) near
  // its `.success` merge gate — that satisfies the BOUNDED LEXICAL choke-point, which cannot prove the call's
  // result actually gates the merge. The runtime guarantee is IN-PRIMITIVE: the actual merge path
  // (commitIntegration) internally REQUIRES authorizesIntegration to PASS, so the attacker's under-authorized
  // record (here a bare provider self-report) is refused when they try to actually mutate — the lexical guard
  // being fooled is irrelevant. This is the honest boundary marker the H5 ruling requires.
  const bareEnvelope = { success: true, target_ref: "refs/heads/integration", terminal_state: "success" };
  // (the no-op the attacker would use to fool the lexical scan: `authorizesIntegration(bareEnvelope, ref); // ignored`)
  const runtime = acc.commitIntegration(bareEnvelope, "refs/heads/integration", {
    expectedHead: BASE,
    liveHead: BASE,
    treeResolver: okTree,
    performRefUpdate: true,
  });
  assert.strictEqual(runtime.ok, false, "the mutation primitive must refuse an under-authorized record even if the lexical guard was fooled");
  // and authorizesIntegration itself refuses the bare envelope (no full content-addressed identity / lease).
  assert.strictEqual(
    acc.authorizesIntegration(bareEnvelope, "refs/heads/integration", { integrationHead: BASE, treeResolver: okTree }),
    false,
  );
});

// ── resolveTreeHash / resolveCommitSha — read-only git introspection primitives ────────────────────────
test("resolveTreeHash/resolveCommitSha resolve a REAL ref in this repo to real hex identities", () => {
  const sha = acc.resolveCommitSha("HEAD");
  assert.ok(sha && /^[0-9a-f]{7,40}$/i.test(sha));
  const tree = acc.resolveTreeHash("HEAD");
  assert.ok(tree && /^[0-9a-f]{40}$/i.test(tree));
});

test("resolveTreeHash/resolveCommitSha return null (never throw) for a ref that does not exist", () => {
  assert.strictEqual(acc.resolveTreeHash("refs/heads/definitely-does-not-exist-xyz"), null);
  assert.strictEqual(acc.resolveCommitSha("refs/heads/definitely-does-not-exist-xyz"), null);
});

test("resolveTreeHash/resolveCommitSha return null for non-string/empty input without throwing", () => {
  assert.strictEqual(acc.resolveTreeHash(""), null);
  assert.strictEqual(acc.resolveTreeHash(null), null);
  assert.strictEqual(acc.resolveCommitSha(undefined), null);
});

// ── stableDigest — pure, deterministic, key-order independent ──────────────────────────────────────
test("stableDigest is deterministic and independent of key insertion order", () => {
  const a = acc.stableDigest({ x: 1, y: 2 });
  const b = acc.stableDigest({ y: 2, x: 1 });
  assert.strictEqual(a, b);
});
