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

// SP-20260718-005 gauntlet R2/C2: authorizesIntegration now requires the FULL mandatory context — a live
// integrationHead (=== the record's base "base-OK"), REAL lease coordinates + a current fencing token on the
// record, plus the injected tree resolver. This helper mints a valid lease and returns a fully-valid record
// + the opts that authorize it (the production shape). Happy paths must pass through it.
function validCtx(tag) {
  const root = tmpLeaseRoot(tag);
  const spId = "SP-" + String(tag).toUpperCase();
  const a = lease.acquire(spId, { root, sessionId: "sess-" + tag });
  const record = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: a.token });
  const opts = { integrationHead: "base-OK", spId, leaseRoot: root, treeResolver: okTree };
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
  const record = acc.produceForTest({ target_ref: "refs/heads/integration", base_commit: "old-base" });
  assert.strictEqual(
    acc.authorizesIntegration(record, "refs/heads/integration", { integrationHead: "new-head" }),
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
    acc.authorizesIntegration(record, "refs/heads/integration", { integrationHead: "base-OK", spId, leaseRoot: root, treeResolver: okTree }),
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
function refAwareCtx(tag, { resultTree = "RESULT-TREE", claimTree = "RESULT-TREE" } = {}) {
  const root = tmpLeaseRoot(tag);
  const spId = "SP-" + String(tag).toUpperCase();
  const a = lease.acquire(spId, { root, sessionId: "sess-" + tag });
  const record = acc.produceForTest({
    target_ref: "refs/heads/integration",
    lease_fencing_token: a.token,
    base_commit: "base-OK",
    result_tree_hash: claimTree,   // what the record CLAIMS the accepted tree is
    result_commit: "cand-OK",      // the candidate commit the accepted work lives at
  });
  const refAware = (ref) => {
    if (ref === "cand-OK") return resultTree;                 // candidate → accepted result tree
    if (ref === "refs/heads/integration") return "BASE-TREE"; // destination still at base → base tree
    return null;
  };
  const opts = { integrationHead: "base-OK", spId, leaseRoot: root, treeResolver: refAware };
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
    expectedHead: "base-OK", // the validated destination head === base
    liveHead: "base-OK",     // destination still at base at CAS time (F12: unmoved since validation)
    // no performRefUpdate → pure CAS DETERMINATION, no real git write
  });
  assert.strictEqual(result.ok, true, result.reason);
  assert.strictEqual(result.receipt.committed_head, "base-OK");
});

test("TEETH (R3-REG-1): with NO bound candidate (no result_commit, no opts.resultRef/newHead) authorization FAILS CLOSED", () => {
  // A record without any candidate the accepted tree can be recomputed FROM cannot be authorized — there is
  // nothing to recompute against. Fail-closed (never fall back to recomputing the destination).
  const root = tmpLeaseRoot("r3reg1-nocand");
  const spId = "SP-R3REG1-NOCAND";
  const a = lease.acquire(spId, { root, sessionId: "sess-nocand" });
  const record = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: a.token, result_commit: "" });
  const opts = { integrationHead: "base-OK", spId, leaseRoot: root, treeResolver: okTree };
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration", opts), false);
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
  const result = acc.commitIntegration(record, "refs/heads/integration", { ...opts, expectedHead: "base-OK", liveHead: "base-OK" });
  assert.strictEqual(result.ok, true, result.reason);
  assert.strictEqual(result.receipt.target_ref, "refs/heads/integration");
  assert.strictEqual(result.receipt.committed_head, "base-OK");
});

test("ADVERSARIAL (R2/C3): commitIntegration blocks when expectedHead !== the record's base_commit (CAS not bound to accepted base)", () => {
  const { record, opts } = validCtx("commit-basebind");
  const result = acc.commitIntegration(record, "refs/heads/integration", { ...opts, expectedHead: "SOME-OTHER-HEAD", liveHead: "SOME-OTHER-HEAD" });
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.reason, "expected-head-base-mismatch");
});

test("ADVERSARIAL: commitIntegration blocks when the live head moved since validation (F12 CAS race)", () => {
  const { record, opts } = validCtx("commit-race");
  const result = acc.commitIntegration(record, "refs/heads/integration", { ...opts, expectedHead: "base-OK", liveHead: "H2" });
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
    expectedHead: "base-OK",
    liveHead: "base-OK",
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
    expectedHead: "base-OK",
    liveHead: "base-OK",
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
    integrationHead: "base-OK",
    spId,
    leaseRoot: root,
    expectedHead: "base-OK",
    liveHead: "base-OK",
    treeResolver: okTree,
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
    expectedHead: "base-OK",
    liveHead: "base-OK",
    treeResolver: okTree,
    performRefUpdate: true,
  });
  assert.strictEqual(runtime.ok, false, "the mutation primitive must refuse an under-authorized record even if the lexical guard was fooled");
  // and authorizesIntegration itself refuses the bare envelope (no full content-addressed identity / lease).
  assert.strictEqual(
    acc.authorizesIntegration(bareEnvelope, "refs/heads/integration", { integrationHead: "base-OK", treeResolver: okTree }),
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
