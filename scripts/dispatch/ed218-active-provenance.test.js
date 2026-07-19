"use strict";
/**
 * ed218-active-provenance.test.js — AC-3 (R-4 / ED-218): role-resolver.deriveBinding resolves a
 * dispatched worker via `validated_workorder_or_cli` ONLY when an ACTIVE WorkOrder validation (schema +
 * authority) passed; a self-asserted/unvalidated binding is BLOCK. Also proves the Phase-2 backward-
 * compatible path (no WorkOrder presented) is UNCHANGED.
 *
 * Run: node --test scripts/dispatch/ed218-active-provenance.test.js
 */
const test = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");

const { deriveBinding, loadRoleBinding, defaultKernelDir } = require("./role-resolver");
const { issueWorkOrder } = require("./workorder-validator");

const RB = loadRoleBinding(defaultKernelDir());
const KNOWN = ["backend-builder", "frontend-builder", "security-builder"];
const SECRET = crypto.randomBytes(32);

function baseWorkOrder(overrides = {}) {
  return {
    schema_version: "1",
    correlation_id: "corr-ed218-001",
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

// ── Phase-2 backward-compatibility: NO WorkOrder presented → channel-asserted, UNCHANGED ──────────
test("Phase-2 UNCHANGED: no `workorder` presented → validated_workorder_or_cli_binding is channel-asserted true", () => {
  const b = deriveBinding({ channel: "dispatch-claude", role: "backend-builder" }, { rb: RB, knownRoles: KNOWN });
  assert.strictEqual(b.ok, true);
  assert.strictEqual(b.boundRole, "backend-builder");
  assert.match(b.reason, /channel-asserted argv role/);
});

// ── ED-218 ACTIVE: a WorkOrder IS presented ─────────────────────────────────────────────────────
test("ED-218 ACTIVE: a schema-valid + validly-signed WorkOrder → BOUND", () => {
  const wo = issueWorkOrder(baseWorkOrder(), { secret: SECRET });
  const b = deriveBinding(
    { channel: "dispatch-claude", role: "backend-builder", workorder: wo },
    { rb: RB, knownRoles: KNOWN, workorderOpts: { secret: SECRET } },
  );
  assert.strictEqual(b.ok, true, b.reason);
  assert.strictEqual(b.boundRole, "backend-builder");
  assert.match(b.reason, /ED-218 ACTIVE/);
});

test("ED-218 ACTIVE: a self-asserted/UNSIGNED WorkOrder → BLOCK (fail-closed), never bound", () => {
  const wo = baseWorkOrder(); // no attest_sig — hand-authored / self-asserted
  const b = deriveBinding(
    { channel: "dispatch-claude", role: "backend-builder", workorder: wo },
    { rb: RB, knownRoles: KNOWN, workorderOpts: { secret: SECRET } },
  );
  assert.strictEqual(b.ok, false);
  assert.strictEqual(b.boundRole, null);
  assert.strictEqual(b.failClosed, true);
  assert.match(b.reason, /ED-218 WorkOrder validation failed/);
});

test("ED-218 ACTIVE: a schema-invalid WorkOrder → BLOCK, distinct reason", () => {
  const wo = issueWorkOrder(baseWorkOrder({ model: undefined }), { secret: SECRET });
  const b = deriveBinding(
    { channel: "dispatch-claude", role: "backend-builder", workorder: wo },
    { rb: RB, knownRoles: KNOWN, workorderOpts: { secret: SECRET } },
  );
  assert.strictEqual(b.ok, false);
  assert.strictEqual(b.failClosed, true);
  assert.match(b.reason, /ED-218 WorkOrder validation failed/);
});

test("ED-218 ACTIVE: a WorkOrder forged under a DIFFERENT session secret → BLOCK", () => {
  const otherSecret = crypto.randomBytes(32);
  const wo = issueWorkOrder(baseWorkOrder(), { secret: otherSecret });
  const b = deriveBinding(
    { channel: "dispatch-claude", role: "backend-builder", workorder: wo },
    { rb: RB, knownRoles: KNOWN, workorderOpts: { secret: SECRET } }, // verified under the RIGHT session's secret
  );
  assert.strictEqual(b.ok, false);
  assert.strictEqual(b.failClosed, true);
});

test("ED-218 ACTIVE: role='President' with a validly-signed WorkOrder is STILL refused (authority != identity escalation)", () => {
  const wo = issueWorkOrder(baseWorkOrder({ role: "President" }), { secret: SECRET });
  const b = deriveBinding(
    { channel: "dispatch-claude", role: "President", workorder: wo },
    { rb: RB, knownRoles: KNOWN, workorderOpts: { secret: SECRET } },
  );
  assert.strictEqual(b.ok, false);
  assert.strictEqual(b.boundRole, null);
  assert.match(b.reason, /category error|President-leak/i);
});

test("opts.workorderValidate injection seam: an injected validator is consulted instead of the default module", () => {
  let called = false;
  const stubValidate = (wo, opts) => {
    called = true;
    return { ok: true, reason: "stub-pass" };
  };
  const b = deriveBinding(
    { channel: "dispatch-claude", role: "backend-builder", workorder: { anything: true } },
    { rb: RB, knownRoles: KNOWN, workorderValidate: stubValidate },
  );
  assert.strictEqual(called, true);
  assert.strictEqual(b.ok, true);
});

test("opts.workorderValidate injection seam: an injected validator that FAILS blocks the bind", () => {
  const stubValidate = () => ({ ok: false, reason: "stub-reject" });
  const b = deriveBinding(
    { channel: "dispatch-claude", role: "backend-builder", workorder: { anything: true } },
    { rb: RB, knownRoles: KNOWN, workorderValidate: stubValidate },
  );
  assert.strictEqual(b.ok, false);
  assert.match(b.reason, /stub-reject/);
});

test("a validator that THROWS is caught and treated as fail-closed, never crashes deriveBinding", () => {
  const throwingValidate = () => {
    throw new Error("boom");
  };
  assert.doesNotThrow(() => {
    const b = deriveBinding(
      { channel: "dispatch-claude", role: "backend-builder", workorder: { anything: true } },
      { rb: RB, knownRoles: KNOWN, workorderValidate: throwingValidate },
    );
    assert.strictEqual(b.ok, false);
    assert.strictEqual(b.failClosed, true);
    assert.match(b.reason, /workorder-validator unavailable/);
  });
});
