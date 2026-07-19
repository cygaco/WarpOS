"use strict";
/**
 * workorder-validator.js — SEC-1 (SP-20260718-005 Phase 3, ED-218 ACTIVE). The role-resolver seam
 * `validated_workorder_or_cli_binding` hardcoded `true` at Phase-2 (channel-asserted only — role-
 * resolver.js:351). This module is the ACTIVE validator that makes the flag CONDITIONAL: a dispatched
 * worker's WorkOrder binds ONLY when this validator PASSES.
 *
 * `validate(workorder, opts) -> {ok:boolean, reason:string}` performs THREE independent checks (never
 * short-circuited into one undifferentiated pass/fail — each failure mode gets its own honest reason):
 *
 *   (a) SCHEMA / REQUIRED-SEMANTICS (the SUSPENDERS) — delegates to workorder-schema.validate() (BE-1).
 *       A missing required field / bad terminal_state / failure_reason-vs-terminal_state contradiction
 *       fails closed. This is the hollow-WorkOrder defense that lives in the record's OWN shape.
 *
 *   (b) AUTHORITY / PROVENANCE — the WorkOrder must carry a valid SAME-SESSION provenance proof. Reuses
 *       attest-signing.js's session-secret HMAC primitive (sessionSecret() + workorder-schema's OWN
 *       workOrderDigest() over the IMMUTABLE identity fields) — NOT a parallel signing mechanism, the
 *       SAME trust anchor the completion-record signer uses (attest-signing SIGNED_FIELDS now carries
 *       `workorder_digest`, BE-3). A hand-authored / unsigned / self-asserted WorkOrder (no attest_sig,
 *       or a forged one) has NO valid provenance -> {ok:false}. The ONLY other accepted proof is
 *       `opts.trustedBridge === true` — an OPTS-LEVEL flag the CALLER sets, NEVER a field the WorkOrder
 *       object itself carries (so a forged/hand-authored WorkOrder JSON blob can never self-assert this;
 *       only the trusted in-process dispatch bridge constructing the WorkOrder THIS call can set it —
 *       reusing role-resolver's derived-not-settable discipline: authority lives in the CALL SHAPE, never
 *       a body field. See role-resolver.js header for the doctrine this mirrors).
 *
 *   (c) WG-10 PROMPT-SIZE FLOOR (the BELT) — a redundant, INDEPENDENT hollow-input defense (the
 *       ~215-byte hollow-stub class documented at scripts/sprint/epsilon-runtime.js WG-10). Evaluated
 *       ONLY when prompt-size context is present (opts.promptBytes/opts.floorBytes or the WorkOrder's
 *       own optional `prompt_bytes`/`floor_bytes`/`role_kind` extra properties — the schema's
 *       `additionalProperties:true` permits attaching them) — mirrors (deliberately NOT imports, to
 *       avoid a require cycle: conformance-matrix.js already imports role-resolver.js, and role-resolver.js
 *       imports THIS module for (b) above — importing conformance-matrix.js here would close the cycle)
 *       the exact one-line evaluator conformance-matrix.js#GATE_EVALUATORS.workorder uses.
 *
 * Every failure path returns a NON-EMPTY, non-throwing {ok:false, reason} — never undefined/null/a
 * crash (AC-F1's exact requirement; a validator that throws or returns a falsy non-shape silently SKIPS
 * under the falsifier-liveness gate = fail-open).
 */
const crypto = require("crypto");
const workorderSchema = require("./workorder-schema");
const attestSigning = require("./attest-signing");

// WG-10 belt default floor: rejects the documented ~215-byte hollow-stub class (and anything smaller);
// a caller with a real, non-hollow prompt clears this trivially. Only applied when prompt-size context
// is actually supplied (see checkPromptFloor below) — a WorkOrder that never carries prompt-size info is
// scoped OUT of this specific belt check (schema required-semantics, the suspenders, is ALWAYS active).
const DEFAULT_PROMPT_FLOOR_BYTES = 256;

/** role_kind inference when the caller/WorkOrder doesn't supply one explicitly: every *-builder role is
 *  a feature-build (the class WG-10 exists to protect); everything else is scoped out of the belt. */
function inferRoleKind(workorder) {
  const role = workorder && typeof workorder.role === "string" ? workorder.role : "";
  return /-builder$/.test(role) ? "feature-build" : "other";
}

/**
 * checkPromptFloor(workorder, opts) -> {ok, reason}. Mirrors conformance-matrix.js's `workorder` gate
 * evaluator byte-for-byte (kept in sync by hand — see the header note on why this isn't an import).
 * A no-context WorkOrder (no prompt_bytes anywhere) PASSES this specific check (belt scoped out); the
 * schema/authority checks are unaffected and remain fully enforced.
 */
function checkPromptFloor(workorder, opts = {}) {
  const roleKind =
    (opts && typeof opts.roleKind === "string" && opts.roleKind) ||
    (workorder && typeof workorder.role_kind === "string" && workorder.role_kind) ||
    inferRoleKind(workorder);
  const promptBytesRaw =
    opts && opts.promptBytes !== undefined
      ? opts.promptBytes
      : workorder && workorder.prompt_bytes !== undefined
        ? workorder.prompt_bytes
        : undefined;
  if (promptBytesRaw === undefined || promptBytesRaw === null) {
    return { ok: true, reason: "no prompt-size context supplied — WG-10 belt scoped out for this WorkOrder" };
  }
  const floorBytes =
    opts && opts.floorBytes !== undefined
      ? opts.floorBytes
      : workorder && workorder.floor_bytes !== undefined
        ? workorder.floor_bytes
        : DEFAULT_PROMPT_FLOOR_BYTES;
  // The mirrored evaluator (conformance-matrix.js GATE_EVALUATORS.workorder), unchanged logic:
  if (roleKind === "feature-build" && promptBytesRaw < floorBytes) {
    return { ok: false, reason: `prompt_bytes ${promptBytesRaw} below floor_bytes ${floorBytes} (WG-10 hollow-prompt class)` };
  }
  return { ok: true, reason: "prompt meets the WG-10 size floor (or role_kind is not feature-build)" };
}

/**
 * signWorkOrderProvenance(workorder, secret) -> hex HMAC-SHA256 string, or null if no secret is
 * available (fail-closed at the caller — an unsigned WorkOrder can never verify). PURE given `secret`.
 * Signs `workorder_digest=<workOrderDigest(workorder)>` — the SAME digest attest-signing.js's
 * SIGNED_FIELDS binds into the completion-record signature (BE-3), computed here directly over the
 * WorkOrder's own immutable identity fields (no completion record needs to exist yet — this runs
 * PRE-SPAWN, before any completion record is written).
 */
function signWorkOrderProvenance(workorder, secret) {
  const useSecret = secret === undefined ? attestSigning.sessionSecret() : secret;
  if (!useSecret) return null;
  const digest = workorderSchema.workOrderDigest(workorder);
  return crypto.createHmac("sha256", useSecret).update(`workorder_digest=${digest}`).digest("hex");
}

/**
 * issueWorkOrder(workorder, opts) -> a COPY of workorder with a valid `attest_sig` attached. The
 * convenience the trusted dispatch bridge (or a test acting as one) uses to produce a validly-signed
 * WorkOrder. Returns the workorder UNCHANGED (no attest_sig added) if no session secret is available —
 * downstream verifyProvenance then correctly fails it closed rather than silently "signing" with nothing.
 */
function issueWorkOrder(workorder, opts = {}) {
  const secret = opts.secret === undefined ? attestSigning.sessionSecret() : opts.secret;
  const sig = signWorkOrderProvenance(workorder, secret);
  if (!sig) return { ...workorder };
  return { ...workorder, attest_sig: sig };
}

/**
 * verifyProvenance(workorder, opts) -> {ok, reason}. The AUTHORITY/PROVENANCE check (b). FAIL-CLOSED on
 * every branch: no secret, no/malformed signature, or a mismatch all resolve {ok:false}.
 */
function verifyProvenance(workorder, opts = {}) {
  // The trusted-bridge OR-branch: an opts-only assertion (never a WorkOrder field) that THIS caller, in
  // THIS process, constructed the WorkOrder being validated right now. A forged/hand-authored WorkOrder
  // handed to a DIFFERENT caller can never set this itself — it is not read from `workorder` at all.
  if (opts && opts.trustedBridge === true) {
    return { ok: true, reason: "asserted by the trusted dispatch bridge (in-process, same-call construction; opts-only, not workorder-settable)" };
  }
  const secret = opts && opts.secret !== undefined ? opts.secret : attestSigning.sessionSecret();
  if (!secret) {
    return { ok: false, reason: "no same-session HMAC secret available (fail-closed — cannot verify any provenance)" };
  }
  const sig = workorder && workorder.attest_sig;
  if (typeof sig !== "string" || !/^[0-9a-f]{64}$/i.test(sig)) {
    return { ok: false, reason: "no valid same-session provenance signature present (hand-authored/unsigned/self-asserted WorkOrder)" };
  }
  const expected = signWorkOrderProvenance(workorder, secret);
  if (!expected) {
    return { ok: false, reason: "unable to compute expected provenance signature (secret unavailable)" };
  }
  let match = false;
  try {
    match = crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    match = false; // length mismatch or non-hex → never throws out of verifyProvenance
  }
  if (!match) {
    return { ok: false, reason: "provenance signature does not match the WorkOrder's identity fields (forged/tampered WorkOrder)" };
  }
  return { ok: true, reason: "valid same-session HMAC provenance signature over the WorkOrder's immutable identity" };
}

/**
 * validate(workorder, opts) -> {ok:boolean, reason:string}. NEVER throws — a non-object/null/array
 * input is a clean {ok:false}, exactly like workorder-schema.validate(). Runs (a) schema, (b) authority,
 * (c) WG-10 belt, in that order, returning the FIRST failure's reason (each independently informative).
 */
function validate(workorder, opts = {}) {
  const schemaRes = workorderSchema.validate(workorder);
  if (!schemaRes.ok) {
    return { ok: false, reason: `schema/required-semantics invalid: ${schemaRes.errors.join("; ")}` };
  }

  const prov = verifyProvenance(workorder, opts);
  if (!prov.ok) {
    return { ok: false, reason: `authority/provenance check failed: ${prov.reason}` };
  }

  const floor = checkPromptFloor(workorder, opts);
  if (!floor.ok) {
    return { ok: false, reason: `WG-10 prompt-size floor: ${floor.reason}` };
  }

  return { ok: true, reason: "WorkOrder schema-valid, same-session provenance verified, WG-10 floor clear" };
}

module.exports = {
  DEFAULT_PROMPT_FLOOR_BYTES,
  inferRoleKind,
  checkPromptFloor,
  signWorkOrderProvenance,
  issueWorkOrder,
  verifyProvenance,
  validate,
};
