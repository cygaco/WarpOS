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

// ── authorizesIntegration() happy path ──────────────────────────────────────────────────────────────
test("HAPPY: a fully-valid record for the matching target with a fresh base authorizes", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/integration" });
  assert.strictEqual(
    acc.authorizesIntegration(record, "refs/heads/integration", { integrationHead: "base-OK" }),
    true,
  );
});

test("HAPPY: authorizesIntegration with NO opts at all still authorizes a structurally-valid record (no freshness/lease/recompute requested)", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/integration" });
  assert.strictEqual(acc.authorizesIntegration(record, "refs/heads/integration"), true);
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

test("ADVERSARIAL: forged result_tree_hash caught ONLY when the caller opts into recompute", () => {
  const forged = acc.produceForTest({ target_ref: "refs/heads/integration", result_tree_hash: "f".repeat(40) });
  // Without recompute, the structural checks alone don't catch a fabricated hash value.
  assert.strictEqual(acc.authorizesIntegration(forged, "refs/heads/integration"), true);
  // With recompute:true, the verifier resolves the ACTUAL tree for the target ref and finds no match
  // (this repo has no real `refs/heads/integration` branch, so resolution itself fails -> fail-closed).
  assert.strictEqual(acc.authorizesIntegration(forged, "refs/heads/integration", { recompute: true }), false);
});

test("ADVERSARIAL: recompute against an unresolvable target ref fails closed even for a plausible-looking hash", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/does-not-exist-at-all" });
  assert.strictEqual(
    acc.authorizesIntegration(record, "refs/heads/does-not-exist-at-all", { recompute: true }),
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
    acc.authorizesIntegration(record, "refs/heads/integration", { spId, leaseRoot: root }),
    true,
  );
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
test("HAPPY: commitIntegration succeeds when the live head matches the expected (validated) head", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/integration" });
  const result = acc.commitIntegration(record, "refs/heads/integration", { expectedHead: "H1", liveHead: "H1" });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.receipt.target_ref, "refs/heads/integration");
  assert.strictEqual(result.receipt.committed_head, "H1");
});

test("ADVERSARIAL: commitIntegration blocks when the live head moved since validation (F12 CAS race)", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/integration" });
  const result = acc.commitIntegration(record, "refs/heads/integration", { expectedHead: "H1", liveHead: "H2" });
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.reason, "validation-to-merge-race");
});

test("ADVERSARIAL: commitIntegration blocks on a target-ref mismatch", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/feature-A" });
  const result = acc.commitIntegration(record, "refs/heads/feature-B", { expectedHead: "H1", liveHead: "H1" });
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
    expectedHead: "H1",
    liveHead: "H1",
    spId,
    leaseRoot: root,
  });
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.reason, "superseded-lease");
});

test("commitIntegration never mutates git by default (no performRefUpdate opt-in)", () => {
  const record = acc.produceForTest({ target_ref: "refs/heads/acc-record-noop-test-ref" });
  const result = acc.commitIntegration(record, "refs/heads/acc-record-noop-test-ref", {
    expectedHead: "H1",
    liveHead: "H1",
  });
  assert.strictEqual(result.ok, true);
  // resolveCommitSha must still find nothing for this never-created ref (no side effect occurred).
  assert.strictEqual(acc.resolveCommitSha("refs/heads/acc-record-noop-test-ref"), null);
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
