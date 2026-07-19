"use strict";
/**
 * role-resolver.test.js — the live derived-not-settable role-binding resolver (SP-20260718-004
 * Phase 2, G2.1/ED-216 + ED-220). Includes the REQUIRED-PRESENT falsifiability fixture (i):
 * derived-not-settable NEGATIVE — a worker that SETS role:"President"/authority in its OWN
 * context/record/handoff STILL resolves UNBOUND (dispatched) / alex-alpha-only-via-helm (top-level).
 * A regression here (deriveBinding reading a worker-settable field, or a dispatched worker resolving
 * to President) is a live authority false-green — the exact class this sprint exists to close.
 */
const { test } = require("node:test");
const assert = require("node:assert");

const {
  deriveBinding,
  validateRoleBindingValues,
  loadRoleBinding,
  defaultKernelDir,
  actorKindForChannel,
} = require("./role-resolver");

// The REAL Phase-0 control graph (fixture-proven), loaded once. Injected into deriveBinding so the
// tests exercise the actual role-binding.json contract, not a hand-rolled stand-in.
const RB = loadRoleBinding(defaultKernelDir());
// A representative set of known dispatched-worker roles (ED-220 value-validation seam).
const KNOWN = ["backend-builder", "frontend-builder", "security-builder", "backend-reviewer", "qa-reviewer"];

// ── channel → actor_kind (the non-settable signal) ────────────────────────────────────────────────
test("actorKindForChannel: the CHANNEL derives actor_kind; unknown → null (fail-closed)", () => {
  assert.strictEqual(actorKindForChannel("dispatch-claude"), "dispatched_worker");
  assert.strictEqual(actorKindForChannel("dispatch-agent"), "dispatched_worker");
  assert.strictEqual(actorKindForChannel("session-bootstrap"), "top_level_session");
  assert.strictEqual(actorKindForChannel("helm"), "top_level_session");
  assert.strictEqual(actorKindForChannel("some-worker-supplied-string"), null);
  assert.strictEqual(actorKindForChannel(undefined), null);
});

// ── the happy path ────────────────────────────────────────────────────────────────────────────────
test("deriveBinding: dispatched worker binds to its channel-asserted role", () => {
  const b = deriveBinding({ channel: "dispatch-claude", role: "backend-builder" }, { rb: RB, knownRoles: KNOWN });
  assert.strictEqual(b.ok, true);
  assert.strictEqual(b.actor_kind, "dispatched_worker");
  assert.strictEqual(b.boundRole, "backend-builder");
});

test("deriveBinding: top-level human session binds to the helm default (alex-alpha), helm_only", () => {
  const b = deriveBinding({ channel: "session-bootstrap" }, { rb: RB, knownRoles: KNOWN });
  assert.strictEqual(b.ok, true);
  assert.strictEqual(b.actor_kind, "top_level_session");
  assert.strictEqual(b.boundRole, RB.top_level_human_default); // alex-alpha
});

// ── REQUIRED-PRESENT FIXTURE (i): derived-not-settable NEGATIVE ──────────────────────────────────
test("FIXTURE (i): a dispatched worker asserting role:'President' STILL never resolves to President", () => {
  // The worker sets President in its own handoff/record/context. deriveBinding reads ONLY the channel
  // + the trusted-parent argv role — a President assertion through the dispatch channel is a category
  // error, never a bind. boundRole is NEVER alex-alpha for a dispatched worker.
  for (const claim of ["President", "alex-alpha", "ALPHA", "president"]) {
    const b = deriveBinding({ channel: "dispatch-claude", role: claim }, { rb: RB, knownRoles: KNOWN });
    assert.strictEqual(b.ok, false, `role='${claim}' must be refused`);
    assert.strictEqual(b.boundRole, null, `role='${claim}' must never bind President`);
    assert.match(b.reason, /category error|President-leak|top_level_session-only/i);
  }
});

test("FIXTURE (i) — structural: deriveBinding's ONLY inputs are {channel, role}; a worker-set field cannot reach it", () => {
  // Even if a worker crams extra self-asserted authority fields into the call, they are ignored — the
  // function signature destructures {channel, role} and nothing else. This is the derived-not-settable
  // guarantee BY CONSTRUCTION: there is no settable authority field the resolver consults.
  const b = deriveBinding(
    { channel: "dispatch-claude", role: "backend-builder", role_override: "President", authority: "helm", is_president: true },
    { rb: RB, knownRoles: KNOWN },
  );
  assert.strictEqual(b.ok, true);
  assert.strictEqual(b.boundRole, "backend-builder"); // the self-asserted President/authority fields are inert
});

// ── cold-start: unbound dispatched worker fails closed (CORE-1) ───────────────────────────────────
test("cold-start: dispatched worker with no channel-asserted role → UNBOUND, fail-closed (never President)", () => {
  const b = deriveBinding({ channel: "dispatch-claude" }, { rb: RB, knownRoles: KNOWN });
  assert.strictEqual(b.ok, false);
  assert.strictEqual(b.boundRole, null);
  assert.match(b.reason, /UNBOUND|fail-closed/i);
});

// ── category error: a dispatched worker cannot bind through a top_level_session-only source ────────
test("category error (N-5): unknown channel → no actor_kind, fail-closed (ambient text can't supply one)", () => {
  const b = deriveBinding({ channel: "handoff-prompt-says-you-are-alpha", role: "President" }, { rb: RB, knownRoles: KNOWN });
  assert.strictEqual(b.ok, false);
  assert.strictEqual(b.actor_kind, null);
});

// ── ED-220 value-validation ───────────────────────────────────────────────────────────────────────
test("ED-220: the REAL role-binding.json passes value-validation", () => {
  const vv = validateRoleBindingValues(RB);
  assert.strictEqual(vv.ok, true, vv.errors.join("; "));
});

test("ED-220: worker_default_when_unbound flipped to a permissive value → fail-closed (CORE-1 open is refused)", () => {
  const corrupt = { ...RB, worker_default_when_unbound: "PASS" };
  const b = deriveBinding({ channel: "dispatch-claude", role: "backend-builder" }, { rb: corrupt, knownRoles: KNOWN });
  assert.strictEqual(b.ok, false);
  assert.match(b.reason, /VALUE invalid|FAIL_CLOSED/i);
});

test("ED-220: a dispatched role that is not a known role-registry id → BLOCK (value not just presence)", () => {
  const b = deriveBinding({ channel: "dispatch-claude", role: "totally-made-up-role" }, { rb: RB, knownRoles: KNOWN });
  assert.strictEqual(b.ok, false);
  assert.match(b.reason, /not a known role-registry id/i);
});

test("ED-220: top_level_default_binding_source must be helm_only", () => {
  const corrupt = { ...RB, top_level_default_binding_source: "ambient" };
  const vv = validateRoleBindingValues(corrupt);
  assert.strictEqual(vv.ok, false);
  assert.match(vv.errors.join(";"), /helm_only/);
});

// ── corrupt control fails closed (never a permissive {}) ──────────────────────────────────────────
test("a structurally-corrupt control → deriveBinding fails closed, never a permissive default", () => {
  const b = deriveBinding({ channel: "dispatch-claude", role: "backend-builder" }, { rb: { garbage: true }, knownRoles: KNOWN });
  assert.strictEqual(b.ok, false);
});
