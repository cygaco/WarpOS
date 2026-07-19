"use strict";
/**
 * role-resolver.js — the LIVE derived-not-settable role-binding runtime resolver
 * (SP-20260718-004 Phase 2, G2.1 / ED-216; CORE-1 + CORE-3).
 *
 * The Phase-0 role-binding precedence graph (`.claude/kernel/role-binding.json` /
 * top-level-runtime-contract.md §3) was fixture-proven in conformance-matrix.js but NEVER wired
 * into a live dispatch — nothing read it to gate a real spawn (ED-216, deferred @ Phase-2-exit).
 * This module is that wiring.
 *
 * THE SPINE (ED-225 derived-not-settable — β plan-lock, PRIMARY): a worker's `actor_kind` + `role`
 * are DERIVED from the dispatch CHANNEL (which trusted bridge is spawning) + the trusted-parent-
 * supplied argv `role` — NEVER from a field the worker sets. Ambient text (worktree CLAUDE.md,
 * handoff, AGENTS.md) is INPUT the worker reads, NEVER the authority for its binding. `deriveBinding`
 * reads ONLY the channel + the trusted role arg; it consults NOTHING the worker can write, so a
 * worker CANNOT set/claim its own role BY CONSTRUCTION. There is no settable "role" field to sign
 * (the settable-label-plus-signature anti-pattern is avoided; origin-proof/ED-231 applies SECONDARILY
 * and only where a binding is PERSISTED to a record read across a trust boundary — see attest-signing.js).
 *
 * SINGLE-SOURCE (DoE ruling): the precedence-graph EVALUATOR + LOADERS live here and are imported BY
 * conformance-matrix.js. One evaluator, fixture-proven AND live — the conformance fixtures staying
 * green is this extraction's regression guard. The graph itself is role-binding.json; this module
 * never re-derives it.
 *
 * SCOPE LINE (Phase-2 vs Phase-3 — held): this resolver DERIVES + SCOPES + FAIL-CLOSES. The ACTIVE
 * `validated_workorder_or_cli` provenance validator (WorkOrder schema + authority check performed by
 * the trusted bridge) is ED-218 / Phase-3 — NOT built here. In Phase 2, "validated" = the trusted
 * bridge ASSERTS the channel/argv role; a dispatched worker presenting a top_level_session-only
 * source is a category-error BLOCK (role-binding.json N-5).
 */
const fs = require("fs");
const path = require("path");

// ── Channels: the trusted-parent identity (NON-SETTABLE by the worker). The CHANNEL is the signal. ──
// A worker does not exist when deriveBinding runs (it runs PRE-SPAWN in the trusted parent), so the
// channel — WHICH bridge is spawning — is un-forgeable by construction.
const DISPATCH_CHANNELS = Object.freeze(["dispatch-claude", "dispatch-agent"]);
const TOP_LEVEL_CHANNELS = Object.freeze(["session-bootstrap", "helm"]);

// A dispatched worker may NEVER bind to the President identity — a dispatch bridge asked to bind one is a
// CATEGORY ERROR. This is the structural close of the worktree President-leak (G2.4). Detection is
// ROBUST (isPresidentIdentity below), not an exact-string denylist: gauntlet round 1 (SR-ID-002) proved
// an exact list leaks aliases (alex_alpha / alexAlpha / president-worker) that dodge the literals.
const TOP_LEVEL_ONLY_ROLES = Object.freeze(["alex-alpha", "alpha", "president"]); // reference literals only

/**
 * Robust President-identity detection (SR-ID-002). Normalizes away separators / case / digits so ALL of
 * "alex-alpha", "alex_alpha", "alexAlpha", "ALPHA", "president", "president-worker" are recognized as the
 * President identity — the class an exact-string denylist leaks. A dispatched worker binding to ANY of
 * these is the escalation the derived-not-settable spine exists to close; the top-level human default
 * MUST be one of these (a bogus top_level_human_default is refused — ED220-TOPLEVEL-DEFAULT-HOLLOW).
 * Deliberately does NOT match roles that merely CONTAIN "alpha" as a substring (e.g. "alpha-tester" →
 * "alphatester" ≠ "alpha") — only the President identity itself.
 */
function isPresidentIdentity(role) {
  if (!role || typeof role !== "string") return false;
  const norm = role.toLowerCase().replace(/[^a-z]/g, "");
  return norm === "alpha" || norm.includes("alexalpha") || norm.includes("president");
}

function actorKindForChannel(channel) {
  if (DISPATCH_CHANNELS.includes(channel)) return "dispatched_worker";
  if (TOP_LEVEL_CHANNELS.includes(channel)) return "top_level_session";
  return null; // unknown/absent channel → unresolvable → fail-closed (never a permissive default)
}

/**
 * The trusted binding-control kernel dir. Anchored to THIS script's canonical root FIRST (SR-ID-003 /
 * the dispatch-contract precedent) so a stale or hostile `CLAUDE_PROJECT_DIR` cannot point the trusted
 * role-binding.json at a different checkout. Env is consulted ONLY as a fallback when the anchored
 * control is genuinely absent (and even then must itself contain a real role-binding.json).
 */
function defaultKernelDir() {
  const anchored = path.resolve(__dirname, "..", "..");
  if (fs.existsSync(path.join(anchored, ".claude", "kernel", "role-binding.json")))
    return path.join(anchored, ".claude", "kernel");
  const envRoot = process.env.CLAUDE_PROJECT_DIR;
  if (envRoot && fs.existsSync(path.join(envRoot, ".claude", "kernel", "role-binding.json")))
    return path.join(envRoot, ".claude", "kernel");
  return path.join(anchored, ".claude", "kernel"); // fail-closed target (loadRoleBinding throws if absent)
}

/** Known role-registry ids (for ED-220 value-validation of a dispatched worker's bound role). Returns
 *  NULL on any registry failure (SR-ID-002 fix — distinct from a loaded-but-absent role): a null signals
 *  the registry is UNAVAILABLE, so deriveBinding degrades the known-role check to the robust President-
 *  identity check (which still closes escalation) instead of silently disabling all value-validation. */
function defaultKnownRoles() {
  try {
    const rr = require("./registry-roles");
    const ids = rr.roleIds();
    return Array.isArray(ids) && ids.length ? ids : null;
  } catch {
    return null;
  }
}

// ── Structural validation + loader (RELOCATED VERBATIM from conformance-matrix.js R4-1; imported back
//    there so behavior + its tests are unchanged). A structurally-invalid control file fails closed. ──

/**
 * Validate role-binding.json's STRUCTURE (not just JSON syntax): a syntactically-valid-but-
 * structurally-invalid control (missing `order`/`sources`/`worker_default_when_unbound`) must fail
 * closed, never be silently accepted. Throws on any violation. (Byte-behavior-identical to the
 * pre-extraction conformance-matrix.js copy — do NOT tighten here; ED-220 VALUE checks live in
 * validateRoleBindingValues so this structural contract stays stable for conformance-matrix's tests.)
 */
function validateRoleBinding(rb, roleBindingPath) {
  if (!rb || typeof rb !== "object" || Array.isArray(rb)) {
    const err = new Error(`role binding ${roleBindingPath} is not a JSON object`);
    err.code = "ROLE_BINDING_SHAPE_ERROR";
    throw err;
  }
  if (!Array.isArray(rb.order) || rb.order.length === 0) {
    const err = new Error(`role binding ${roleBindingPath} missing/invalid 'order' (must be a non-empty array)`);
    err.code = "ROLE_BINDING_SHAPE_ERROR";
    throw err;
  }
  if (!rb.sources || typeof rb.sources !== "object" || Array.isArray(rb.sources)) {
    const err = new Error(`role binding ${roleBindingPath} missing/invalid 'sources' (must be an object)`);
    err.code = "ROLE_BINDING_SHAPE_ERROR";
    throw err;
  }
  if (typeof rb.worker_default_when_unbound !== "string" || !rb.worker_default_when_unbound) {
    const err = new Error(
      `role binding ${roleBindingPath} missing/invalid 'worker_default_when_unbound' (must be a non-empty string)`,
    );
    err.code = "ROLE_BINDING_SHAPE_ERROR";
    throw err;
  }
  return rb;
}

/**
 * Load role-binding.json. THROWS (fail-closed) on a missing/unreadable/unparseable/structurally-
 * invalid file — role-binding.json is TRUSTED-KERNEL CONTROL: a corrupt control must never become a
 * silent permissive `{}` that reads CORE-1 open. (Relocated verbatim from conformance-matrix.js.)
 */
function loadRoleBinding(kernelDir) {
  const roleBindingPath = path.join(kernelDir, "role-binding.json");
  let text;
  try {
    text = fs.readFileSync(roleBindingPath, "utf8");
  } catch (e) {
    const err = new Error(`role binding ${roleBindingPath} is unreadable: ${(e && e.message) || e}`);
    err.code = "ROLE_BINDING_READ_ERROR";
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(text.replace(/^﻿/, ""));
  } catch (e) {
    const err = new Error(`role binding ${roleBindingPath} is not valid JSON: ${(e && e.message) || e}`);
    err.code = "ROLE_BINDING_PARSE_ERROR";
    throw err;
  }
  return validateRoleBinding(parsed, roleBindingPath);
}

/**
 * The PURE role-binding precedence evaluator — extracted VERBATIM (behavior-identical) from the
 * conformance-matrix.js GATE_EVALUATORS['role-binding'] body, parameterized on `rb` directly instead
 * of `ctx.roleBinding`. conformance-matrix.js wraps this as `(input, ctx) => evaluateRoleBinding(input,
 * (ctx && ctx.roleBinding) || {})` so its fixtures + unit tests are unchanged.
 */
function evaluateRoleBinding(input, rb) {
  rb = rb || {};
  const sources = rb.sources || {};
  if (input.actor_kind === "dispatched_worker") {
    // N-5: a dispatched_worker is bindable ONLY by a source whose applies_to_actor includes
    // "dispatched_worker" (today: validated_workorder_or_cli). explicit_user / explicit_top_level_helm
    // are top_level_session-ONLY — a worker PRESENTING one is a category error, fail-closed.
    const presented = [
      { field: "explicit_user_instruction", source: "explicit_user" },
      { field: "validated_workorder_or_cli_binding", source: "validated_workorder_or_cli" },
      { field: "explicit_top_level_helm_binding", source: "explicit_top_level_helm" },
    ].filter((m) => input[m.field]);

    if (presented.length === 0) {
      return {
        outcome: rb.worker_default_when_unbound === "FAIL_CLOSED" ? "BLOCK" : "PASS",
        reason: "unbound dispatched worker; worker_default_when_unbound governs",
      };
    }

    for (const m of presented) {
      const src = sources[m.source] || {};
      const appliesTo = Array.isArray(src.applies_to_actor) ? src.applies_to_actor : [];
      if (!appliesTo.includes("dispatched_worker")) {
        return {
          outcome: "BLOCK",
          reason: `dispatched_worker presented '${m.source}', scoped to applies_to_actor=[${appliesTo.join(", ")}] only -- category error, fail-closed (CORE-1)`,
        };
      }
    }

    const bound = presented.some((m) => (sources[m.source] || {}).can_bind);
    if (!bound) {
      return {
        outcome: rb.worker_default_when_unbound === "FAIL_CLOSED" ? "BLOCK" : "PASS",
        reason: "presented source(s) are actor-scoped to dispatched_worker but none is can_bind:true; worker_default_when_unbound governs",
      };
    }
    return { outcome: "PASS", reason: "role resolved through the precedence order (actor-scoped to dispatched_worker)" };
  }
  if (input.attempted_binding_source) {
    const src = sources[input.attempted_binding_source] || {};
    return {
      outcome: src.can_bind ? "PASS" : "BLOCK",
      reason: `sources.${input.attempted_binding_source}.can_bind = ${!!src.can_bind}`,
    };
  }
  return { outcome: "BLOCK", reason: "unrecognized role-binding input shape (fail-closed)" };
}

// ── ED-220: role-binding VALUE validation (not just structural presence) ──────────────────────────
// validateRoleBinding (above) proves the SHAPE; this proves the VALUES are the ones CORE-1/CORE-3
// depend on. A structurally-valid file with worker_default_when_unbound:"PASS" would silently flip
// CORE-1 open — structure passes, VALUE is catastrophic. Called by the LIVE resolver (deriveBinding);
// a bad value → the resolver fails closed. Kept SEPARATE from validateRoleBinding so the structural
// contract conformance-matrix imports stays byte-stable (its tests pass minimal controls).
const KNOWN_ACTORS = Object.freeze(["top_level_session", "dispatched_worker"]);

function validateRoleBindingValues(rb) {
  const errors = [];
  if (rb.worker_default_when_unbound !== "FAIL_CLOSED")
    errors.push(
      `worker_default_when_unbound must be "FAIL_CLOSED" (got ${JSON.stringify(rb.worker_default_when_unbound)}) — any other value flips CORE-1 open`,
    );
  if (rb.top_level_default_binding_source !== "helm_only")
    errors.push(`top_level_default_binding_source must be "helm_only" (got ${JSON.stringify(rb.top_level_default_binding_source)})`);
  if (typeof rb.top_level_human_default !== "string" || !rb.top_level_human_default)
    errors.push("top_level_human_default must be a non-empty role id");
  // order ↔ sources totality: every ordered source except UNBOUND has a sources entry.
  for (const o of rb.order || []) {
    if (o === "UNBOUND") continue;
    if (!rb.sources || !rb.sources[o]) errors.push(`order entry '${o}' has no sources[${o}] entry (graph not total over 'order')`);
  }
  // per-source value shape: can_bind is boolean; applies_to_actor (if present) ⊆ KNOWN_ACTORS.
  for (const [name, src] of Object.entries(rb.sources || {})) {
    if (!src || typeof src !== "object") {
      errors.push(`sources.${name} must be an object`);
      continue;
    }
    if (typeof src.can_bind !== "boolean") errors.push(`sources.${name}.can_bind must be a boolean`);
    if (src.applies_to_actor !== undefined) {
      if (!Array.isArray(src.applies_to_actor) || src.applies_to_actor.some((a) => !KNOWN_ACTORS.includes(a)))
        errors.push(`sources.${name}.applies_to_actor must be a subset of [${KNOWN_ACTORS.join(", ")}]`);
    }
  }
  return { ok: errors.length === 0, errors };
}

// ── The LIVE resolver ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive a worker's role binding from the CHANNEL (trusted-parent identity, NON-SETTABLE) + the
 * trusted-parent argv `role`. Returns { actor_kind, boundRole, ok, reason }. ok:false = the dispatch
 * must be REFUSED (never spawn an unbound worker as President). NOTHING the worker can write is ever
 * read here — that IS the derived-not-settable guarantee. PURE given its seams (opts.rb / opts.knownRoles).
 *
 * @param {{channel:string, role?:string}} spawn  channel ∈ DISPATCH_CHANNELS ∪ TOP_LEVEL_CHANNELS
 * @param {object} [opts] { rb, kernelDir, knownRoles } injectable seams for the bite-test
 */
function deriveBinding({ channel, role } = {}, opts = {}) {
  // `failClosed` (gauntlet round 1, SR-ID-001/BE-CQ-001/002): a `failClosed:true` ok:false is a
  // TRUSTED-KERNEL INTEGRITY failure — the bridge MUST refuse the spawn (never launch an unbound worker).
  // A `failClosed:false` ok:false is a BENIGN non-escalation signal (an unrecognized non-President role):
  // the bridge proceeds stamping dispatched_worker (never President), keeping generic/test roles working.
  let rb;
  try {
    rb = opts.rb || loadRoleBinding(opts.kernelDir || defaultKernelDir());
  } catch (e) {
    return { actor_kind: null, boundRole: null, ok: false, failClosed: true, reason: `role-binding control unreadable/invalid (fail-closed): ${e.message}` };
  }
  const vv = validateRoleBindingValues(rb);
  if (!vv.ok)
    return { actor_kind: null, boundRole: null, ok: false, failClosed: true, reason: `role-binding VALUE invalid (ED-220, fail-closed): ${vv.errors.join("; ")}` };

  const actor_kind = actorKindForChannel(channel);
  if (!actor_kind)
    return {
      actor_kind: null,
      boundRole: null,
      ok: false,
      failClosed: true,
      reason: `unknown/absent dispatch channel ${JSON.stringify(channel)} — no actor_kind derivable (fail-closed; ambient text can never supply one)`,
    };

  // knownRoles: an explicit opts value (array or null) wins; else the registry. NULL = registry UNAVAILABLE.
  const knownRoles = opts.knownRoles !== undefined ? opts.knownRoles : defaultKnownRoles();

  if (actor_kind === "dispatched_worker") {
    // The trusted bridge asserts the argv role via validated_workorder_or_cli (Phase-2 channel-asserted;
    // the ACTIVE WorkOrder provenance validator is ED-218/Phase-3). No role → unbound → FAIL_CLOSED.
    if (!role || typeof role !== "string")
      return {
        actor_kind,
        boundRole: null,
        ok: false,
        failClosed: true,
        reason: "dispatched worker with no channel-asserted role — UNBOUND, fail-closed (CORE-1); never defaults to President",
      };
    // ROBUST President-identity gate (SR-ID-002): a dispatched worker may NEVER bind to the President
    // identity or any alias of it — fail-CLOSED, and independent of registry state (the escalation vector).
    if (isPresidentIdentity(role))
      return {
        actor_kind,
        boundRole: null,
        ok: false,
        failClosed: true,
        reason: `dispatched worker asked to bind President-identity role '${role}' — category error, BLOCK (worktree President-leak close, CORE-1)`,
      };
    // ED-220 known-role value check. knownRoles===null → registry UNAVAILABLE: the President-identity gate
    // above ALREADY closes escalation, so proceed as a benign dispatched_worker rather than brick dispatch
    // on a registry outage (SR-ID-002 — the fail-open was the SKIPPED escalation check, now covered above).
    // A loaded registry that lacks the role → BENIGN unknown (failClosed:false): the bridge proceeds
    // stamping dispatched_worker (never President) — caller-hygiene, not a security refusal.
    if (Array.isArray(knownRoles) && knownRoles.length && !knownRoles.includes(role))
      return {
        actor_kind,
        boundRole: null,
        ok: false,
        failClosed: false,
        reason: `bound role '${role}' is not a known role-registry id (ED-220; benign — dispatched_worker, never President)`,
      };
    // Resolve through the SAME fixture-proven graph the conformance fixtures prove.
    const out = evaluateRoleBinding({ actor_kind, validated_workorder_or_cli_binding: true }, rb);
    if (out.outcome !== "PASS")
      return { actor_kind, boundRole: null, ok: false, failClosed: true, reason: `precedence graph did not resolve dispatched worker: ${out.reason}` };
    return {
      actor_kind,
      boundRole: role,
      ok: true,
      failClosed: false,
      reason: "bound via validated_workorder_or_cli (channel-asserted argv role); derived-not-settable, ambient text inert (CORE-3)",
    };
  }

  // top_level_session — the operator's own session, bound ONLY via explicit_top_level_helm (helm_only).
  const out = evaluateRoleBinding({ attempted_binding_source: "explicit_top_level_helm" }, rb);
  if (out.outcome !== "PASS")
    return { actor_kind, boundRole: null, ok: false, failClosed: true, reason: `top-level helm binding did not resolve: ${out.reason}` };
  // ED220-TOPLEVEL-DEFAULT-HOLLOW (gauntlet round 1, qa): validate the VALUE, not just presence. The ONLY
  // legitimate top-level human default is the President identity — a tampered/bogus top_level_human_default
  // must BLOCK (fail-closed), never silently bind a made-up top-level role.
  if (!isPresidentIdentity(rb.top_level_human_default))
    return {
      actor_kind,
      boundRole: null,
      ok: false,
      failClosed: true,
      reason: `top_level_human_default '${rb.top_level_human_default}' is not the recognized President identity — refusing a bogus top-level binding (ED-220, fail-closed)`,
    };
  return {
    actor_kind,
    boundRole: rb.top_level_human_default,
    ok: true,
    failClosed: false,
    reason: "top-level human-facing session bound to the President helm default (helm_only); ambient prose inert (CORE-3)",
  };
}

module.exports = {
  DISPATCH_CHANNELS,
  TOP_LEVEL_CHANNELS,
  TOP_LEVEL_ONLY_ROLES,
  isPresidentIdentity,
  actorKindForChannel,
  defaultKernelDir,
  defaultKnownRoles,
  validateRoleBinding,
  loadRoleBinding,
  evaluateRoleBinding,
  validateRoleBindingValues,
  deriveBinding,
};
