"use strict";
/**
 * workorder-validator.test.js — SEC-1 (SP-20260718-005 Phase 3, ED-218 ACTIVE, AC-2/AC-3).
 * Run: node --test scripts/dispatch/workorder-validator.test.js
 *
 * Every test injects its own HMAC secret (a fresh random Buffer via opts.secret) rather than touching
 * the real per-session secret file — isolates this suite from any other test/process on the machine.
 */
const test = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");
const {
  validate,
  verifyProvenance,
  signWorkOrderProvenance,
  issueWorkOrder,
  checkPromptFloor,
  inferRoleKind,
  DEFAULT_PROMPT_FLOOR_BYTES,
} = require("./workorder-validator");

const SECRET = crypto.randomBytes(32);

function baseWorkOrder(overrides = {}) {
  return {
    schema_version: "1",
    correlation_id: "corr-sec1-001",
    role: "backend-builder",
    provider: "claude",
    model: "opus-4.8",
    base_commit: "base-sha-1",
    result_tree_hash: "tree-sha-1",
    allowed_capabilities: ["read", "write"],
    allowed_paths: ["scripts/dispatch/"],
    retry_lineage: [],
    evidence_refs: [],
    terminal_state: "success",
    ...overrides,
  };
}

function signedWorkOrder(overrides = {}, secret = SECRET) {
  return issueWorkOrder(baseWorkOrder(overrides), { secret });
}

// ── (a) schema / required-semantics — the SUSPENDERS ──────────────────────────────────────────────
test("validate: schema-fail — a hollow WorkOrder ({}) fails closed with a non-empty reason", () => {
  const res = validate({});
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /schema\/required-semantics invalid/);
});

test("required-semantics-fail: missing required field (model) fails, distinct from authority", () => {
  const wo = signedWorkOrder({});
  delete wo.model;
  const res = validate(wo, { secret: SECRET });
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /schema\/required-semantics invalid/);
  assert.match(res.reason, /model/);
});

test("required-semantics-fail: terminal_state/failure_reason contradiction fails", () => {
  const wo = signedWorkOrder({ terminal_state: "failed" }); // no failure_reason
  const res = validate(wo, { secret: SECRET });
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /failure_reason/);
});

// ── (b) authority / provenance ───────────────────────────────────────────────────────────────────
test("unsigned-fail: a schema-valid but UNSIGNED WorkOrder fails authority, not schema", () => {
  const wo = baseWorkOrder(); // no attest_sig at all
  const res = validate(wo, { secret: SECRET });
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /authority\/provenance check failed/);
  assert.match(res.reason, /no valid same-session provenance signature/);
});

test("unsigned-fail: a FORGED attest_sig (right shape, wrong value) fails authority", () => {
  const wo = baseWorkOrder({ attest_sig: "a".repeat(64) });
  const res = validate(wo, { secret: SECRET });
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /forged\/tampered/);
});

test("unsigned-fail: a signature computed under a DIFFERENT secret fails (session isolation)", () => {
  const otherSecret = crypto.randomBytes(32);
  const wo = signedWorkOrder({}, otherSecret);
  const res = validate(wo, { secret: SECRET }); // verified under the WRONG secret
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /forged\/tampered/);
});

test("unsigned-fail: no secret available at all -> fail-closed", () => {
  const wo = signedWorkOrder({});
  const res = validate(wo, { secret: null });
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /no same-session HMAC secret available/);
});

test("valid-signed-pass: a schema-valid, properly-signed WorkOrder passes", () => {
  const wo = signedWorkOrder({});
  const res = validate(wo, { secret: SECRET });
  assert.strictEqual(res.ok, true, res.reason);
});

test("valid-signed-pass: a post-hoc tamper on a signed field invalidates the signature", () => {
  const wo = signedWorkOrder({});
  wo.base_commit = "tampered-base"; // an immutable identity field, part of the digest
  const res = validate(wo, { secret: SECRET });
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /forged\/tampered/);
});

test("valid-signed-pass: mutating a NON-digest field (terminal_state) does NOT break the signature", () => {
  const wo = signedWorkOrder({ terminal_state: "partial", failure_reason: "timeout" });
  const res = validate(wo, { secret: SECRET });
  assert.strictEqual(res.ok, true, res.reason);
});

test("trustedBridge OR-branch: opts.trustedBridge:true accepts an in-process-constructed WorkOrder with NO attest_sig", () => {
  const wo = baseWorkOrder(); // no attest_sig
  const res = validate(wo, { trustedBridge: true, secret: SECRET });
  assert.strictEqual(res.ok, true, res.reason);
});

test("trustedBridge is OPTS-ONLY: a WorkOrder that sets its OWN 'trustedBridge' field is IGNORED (still unsigned-fail)", () => {
  const wo = baseWorkOrder({ trustedBridge: true }); // self-asserted on the BODY, not opts
  const res = validate(wo, { secret: SECRET }); // caller did NOT set opts.trustedBridge
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /authority\/provenance check failed/);
});

// ── (c) WG-10 prompt-size floor — the BELT ───────────────────────────────────────────────────────
test("hollow-prompt-floor-fail: a feature-build WorkOrder with prompt_bytes below the floor fails", () => {
  const wo = signedWorkOrder({ prompt_bytes: 40, floor_bytes: DEFAULT_PROMPT_FLOOR_BYTES });
  const res = validate(wo, { secret: SECRET });
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /WG-10 prompt-size floor/);
});

test("hollow-prompt-floor-fail: opts.promptBytes/opts.floorBytes also gate the floor", () => {
  const wo = signedWorkOrder({});
  const res = validate(wo, { secret: SECRET, promptBytes: 10, floorBytes: 1000 });
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /WG-10 prompt-size floor/);
});

test("WG-10 belt: a WorkOrder with NO prompt-size context at all is scoped OUT (still passes)", () => {
  const wo = signedWorkOrder({});
  const res = validate(wo, { secret: SECRET });
  assert.strictEqual(res.ok, true, res.reason);
});

test("WG-10 belt: a real (>=floor) prompt size for a *-builder role clears the floor", () => {
  const wo = signedWorkOrder({ prompt_bytes: DEFAULT_PROMPT_FLOOR_BYTES + 1 });
  const res = validate(wo, { secret: SECRET });
  assert.strictEqual(res.ok, true, res.reason);
});

test("WG-10 belt: role_kind !== feature-build is exempt from the floor even when hollow", () => {
  const wo = signedWorkOrder({ role: "security-reviewer", prompt_bytes: 1, floor_bytes: 999999 });
  const res = validate(wo, { secret: SECRET });
  assert.strictEqual(res.ok, true, res.reason);
});

// ── unit coverage for the small helpers ──────────────────────────────────────────────────────────
test("inferRoleKind: *-builder roles are feature-build; everything else is other", () => {
  assert.strictEqual(inferRoleKind({ role: "backend-builder" }), "feature-build");
  assert.strictEqual(inferRoleKind({ role: "security-builder" }), "feature-build");
  assert.strictEqual(inferRoleKind({ role: "security-reviewer" }), "other");
  assert.strictEqual(inferRoleKind({}), "other");
});

test("checkPromptFloor: pure function, no side effects, matches validate()'s belt outcome", () => {
  assert.strictEqual(checkPromptFloor({ role: "backend-builder", prompt_bytes: 1 }).ok, false);
  assert.strictEqual(checkPromptFloor({ role: "backend-builder", prompt_bytes: 99999 }).ok, true);
  assert.strictEqual(checkPromptFloor({ role: "backend-builder" }).ok, true, "no context -> scoped out");
});

test("verifyProvenance: never throws on a null/garbage WorkOrder", () => {
  assert.doesNotThrow(() => verifyProvenance(null, { secret: SECRET }));
  assert.doesNotThrow(() => verifyProvenance(undefined, { secret: SECRET }));
  assert.doesNotThrow(() => verifyProvenance("not-an-object", { secret: SECRET }));
  assert.strictEqual(verifyProvenance(null, { secret: SECRET }).ok, false);
});

test("validate: never throws on a non-object/null/array input (mirrors workorder-schema's fail-closed contract)", () => {
  for (const bad of [null, undefined, "string", 42, [], []]) {
    assert.doesNotThrow(() => validate(bad, { secret: SECRET }));
    const res = validate(bad, { secret: SECRET });
    assert.strictEqual(res.ok, false);
    assert.ok(res.reason && res.reason.length > 0);
  }
});

test("signWorkOrderProvenance: PURE and deterministic given the same secret + digest fields", () => {
  const wo = baseWorkOrder();
  const s1 = signWorkOrderProvenance(wo, SECRET);
  const s2 = signWorkOrderProvenance(wo, SECRET);
  assert.strictEqual(s1, s2);
  assert.strictEqual(signWorkOrderProvenance(wo, null), null, "no secret -> null (fail-closed downstream)");
});
