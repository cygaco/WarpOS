"use strict";
/**
 * helm-runner.js — the fail-closed, clean-install AGGREGATE entrypoint OVER the controller (SP-20260720-002
 * Phase 4, unit HELM-RUNNER, Seam C). NOT a parallel trust path: `runHelms()` calls
 * `trusted-controller.js#integrate()` and NOTHING lower — never `produce`/`authorizesIntegration`/
 * `commitIntegration` directly (the same builder owns both modules; integrate()'s signature is frozen
 * in-worktree, no cross-worktree interface race).
 *
 * WHAT PROBLEM THIS CLOSES (R-9/R-10): a per-helm clean-install pass is only as trustworthy as its
 * REDUCTION across the required lanes. This module reuses `panel-lanes.js`'s existing required/optional
 * semantics (`panel-2family` = GPT + Claude required, agy optional; `panel-3lab` = all three required) so
 * there is exactly ONE lane-reduction authority in the codebase, never a second bespoke one here.
 *
 * β rider 5 (fail-closed required/optional, panel-2family floor, zero-agy-as-proof):
 *   - a lane with NO `hasEvidence:true` control-plane record is unprovable — `panelStatus` (panel-lanes.js)
 *     already refuses to treat an omitted/self-claimed field as proof (SR-002); this module NEVER
 *     substitutes an `attested`/route-label field for that gate.
 *   - `agyOperatorOwned:true` (the default here) means an ABSENT agy lane resolves `BLOCKED-ON-OPERATOR`
 *     (ED-060) — NEVER a silent PASS; an agy lane that DID run and failed still BLOCKS via the ordinary
 *     `fail` reduction (an optional lane's failure is binding, only its ABSENCE is tolerated).
 *   - ZERO agy `attested:true` proof anywhere in this module: `collectLaneEvidence` reads ONLY
 *     `hasEvidence`/`alive`/`verdict`/`observedProvider`/`fallback` off the caller-supplied dispatch
 *     control-plane record — it never reads or forwards an `attested` field, and a bare `route` string
 *     (e.g. `"agy:gemini-3.1-pro-high"`) with no `hasEvidence:true` proves nothing (sol-A3).
 */

const panelLanes = require("./panel-lanes");
const controller = require("./trusted-controller");

const DEFAULT_PROFILE = "panel-2family";

/**
 * CONTROLLER_OPT_ALLOWLIST (S2 / BE-CQ-P4-R2-001 + SR-R2-002, ED-225-227 class) — the EXACT set of keys this
 * module will forward into `trusted-controller.js#integrate`. Previously `opts.controllerOpts` was spread
 * VERBATIM, which meant any caller of `runHelms` could hand the controller a whole-predicate override seam
 * (`hookLivenessCheckFn`, `materializeResultTreeFn`, `checkLibSrcRoot`, `liveHead`, …) and bypass the trust
 * preconditions from OUTSIDE the trusted layer. `integrate()` itself no longer reads any such seam, but
 * forwarding an arbitrary caller object into the sole integration principal is the wrong SHAPE regardless —
 * defense in depth, and a structural statement of what a helm run is allowed to influence.
 * `performRefUpdate` is deliberately ABSENT: it is FORCED to `true` below (FIX-5a), never caller-supplied.
 */
const CONTROLLER_OPT_ALLOWLIST = Object.freeze(["bundleManifestPath", "bundleRoot", "candidateRoot", "spId", "leaseRoot", "gitRoot"]);

/** sanitizeControllerOpts(o) -> a NEW object carrying ONLY CONTROLLER_OPT_ALLOWLIST keys present on `o`.
 *  Function seams, prototype keys, and symbol keys can never survive this copy. */
function sanitizeControllerOpts(o) {
  const out = {};
  if (!o || typeof o !== "object") return out;
  for (const k of CONTROLLER_OPT_ALLOWLIST) {
    if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = o[k];
  }
  return out;
}

// FIX-5a (QA-005/BE-CQ-P4-001+002/SR-TRUSTROOT-004): a distinct, non-PASS top-level status for "the panel
// itself was PASS-worthy, but the ONE integration this run was supposed to drive through the controller
// was refused/blocked/didn't actually mutate the ref" — never silently collapsed back into panel.status
// (which stays PASS; `integration` carries the real controller verdict for anyone reading it).
const INTEGRATION_BLOCKED = "INTEGRATION-BLOCKED";

/**
 * collectLaneEvidence(helm, runResult) -> lane {laneId, contractedProvider, observedProvider, fallback,
 * alive, verdict, hasEvidence, controlPlane}. Reads ONLY from the dispatch control-plane record the caller
 * supplies (`runResult`) — NEVER a self-claim the helm's own output makes about itself. A missing/malformed
 * `runResult` yields `hasEvidence:false` (fail-closed — `panelStatus` already treats that as unprovable,
 * never a pass). `controlPlane` (when present) is forwarded verbatim — the R-10 portable exit-proof fields
 * (started/completed/died/timedOut/quota/approval/resume) live there, sourced from the SAME real record.
 */
function collectLaneEvidence(helm, runResult) {
  const laneId = (helm && (helm.laneId || helm.id)) || null;
  const contractedProvider = (helm && helm.provider) || null;
  const r = runResult && typeof runResult === "object" ? runResult : {};
  return {
    laneId,
    contractedProvider,
    observedProvider: r.observedProvider != null ? r.observedProvider : null,
    fallback: r.fallback === true,
    alive: r.alive === true,
    verdict: typeof r.verdict === "string" ? r.verdict : "",
    hasEvidence: r.hasEvidence === true,
    controlPlane: r.controlPlane && typeof r.controlPlane === "object" ? r.controlPlane : null,
  };
}

/**
 * runHelms(input, opts) -> {status, perHelm:[], panel, integration?}.
 *
 * `input`: {profile?: "panel-2family"|"panel-3lab", lanes: [{laneId, provider, runResult}], integrate?:
 *   {base_commit, result_commit, target_ref, workorder, expected_checks?, result_envelope?}} — `lanes` are
 *   ALREADY-EXECUTED clean-install flows (this module does not itself dispatch — a per-lane clean-install
 *   run is produced upstream by the real dispatch control plane and handed in as `runResult`); `integrate`
 *   is present only when a passing panel should drive exactly ONE integration.
 * `opts`: {manifest?, agyOperatorOwned=true, controllerOpts?, integrateFn?} — `integrateFn` is an
 *   injectable seam for hermetic falsifiers (defaults to the real `trusted-controller.js#integrate`).
 *
 * On a PASS with `input.integrate` present, calls `integrateFn(input.integrate, opts.controllerOpts||{})`
 * exactly once — the ONLY integration this function ever drives, and it goes THROUGH the controller only.
 */
function runHelms(input = {}, opts = {}) {
  const agyOperatorOwned = opts.agyOperatorOwned !== false; // default true (β rider 5)
  const integrateFn = typeof opts.integrateFn === "function" ? opts.integrateFn : controller.integrate;

  let manifest, profile;
  try {
    manifest = opts.manifest || panelLanes.loadManifest();
    profile = panelLanes.getProfile(manifest, input.profile || DEFAULT_PROFILE);
  } catch (e) {
    // LOADER-fail-closed (mirrors panelStatus's own distinct loader path): a contract that could not even
    // be loaded/resolved cannot certify anything — never a silent pass.
    const panel = panelLanes.panelStatus({ required: [], min_families: 2, binding: false }, [], { loaderError: true });
    return { status: panel.status, perHelm: [], panel: { ...panel, loaderDetail: e.message }, integration: undefined };
  }

  const rawLanes = Array.isArray(input.lanes) ? input.lanes : [];
  const perHelm = rawLanes.map((l) => collectLaneEvidence(l, l && l.runResult));

  // FIX-5b R2 (BE-CQ-P4-001): `panelStatus` is the SINGLE lane-reduction authority — required AND present-
  // optional. The R1 bolt-on reducer that used to live here (binding only the CLEAN alive-uncoerced
  // `verdict:'fail'` optional sub-case) has been DELETED: a second reduction authority is exactly how the
  // coerced/dead/malformed present-optional cases got silently dropped. This module now consumes
  // `panelStatus`'s verdict verbatim and never re-derives a lane status of its own.
  const panel = panelLanes.panelStatus(profile, perHelm, { agyOperatorOwned });

  let integration;
  if (panel.status === panelLanes.STATUS.PASS && input.integrate) {
    // FIX-5a (QA-005/BE-CQ-P4-001+002/SR-TRUSTROOT-004): a PASS panel driving an integration is a REQUIRED
    // real-write flow — never forward the caller's `controllerOpts.performRefUpdate` verbatim (an absent/
    // false value would let the controller return INTEGRATED without ever mutating the ref, a false-green
    // this runner must never reproduce). `performRefUpdate:true` is FORCED here, the one and only place
    // this module ever decides that. A throwing integrateFn is caught — never a silent pass.
    try {
      integration = integrateFn(input.integrate, { ...sanitizeControllerOpts(opts.controllerOpts), performRefUpdate: true });
    } catch (e) {
      integration = { ok: false, decision: "BLOCKED", reason: "integrate-threw", detail: e && e.message ? e.message : String(e) };
    }

    // Integration is REQUIRED to have genuinely succeeded AND genuinely bound the ref to the accepted
    // result_commit — a controller refusal/throw/mismatched receipt must NEVER let the overall helm status
    // stay PASS (that would be exactly the "integration BLOCKED but helm reads PASS" false-green QA-005/
    // BE-CQ-P4-001+002/SR-TRUSTROOT-004 named).
    const committedCorrectly =
      integration &&
      integration.ok === true &&
      integration.decision === "INTEGRATED" &&
      integration.receipt &&
      integration.receipt.committed_head === input.integrate.result_commit;
    if (!committedCorrectly) {
      return { status: INTEGRATION_BLOCKED, perHelm, panel, integration };
    }
  }

  return { status: panel.status, perHelm, panel, integration };
}

module.exports = {
  runHelms,
  collectLaneEvidence,
  sanitizeControllerOpts,
  CONTROLLER_OPT_ALLOWLIST,
  DEFAULT_PROFILE,
  INTEGRATION_BLOCKED,
};
