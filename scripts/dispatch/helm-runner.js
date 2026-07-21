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

  let panel = panelLanes.panelStatus(profile, perHelm, { agyOperatorOwned });

  // FIX-5b (QA-005/BE-CQ-P4-001+002/SR-TRUSTROOT-004, β rider 5 BINDING): `panelStatus` only evaluates
  // lanes named in `profile.required` — an OPTIONAL lane (e.g. agy on panel-2family) that is PRESENT in
  // `perHelm` but NOT in `profile.required` is never even looked at by that reducer, so a present-and-
  // FAILED optional lane was silently DROPPED and the panel still read PASS. β rider 5 is explicit: "an
  // optional lane that RAN and FAILED BINDS" — absence is tolerated, a real failure is NOT. This closes
  // that gap WITHOUT touching panel-lanes.js's own required/optional reduction authority: it reuses the
  // SAME evidence shape (`hasEvidence`/`alive`/`verdict`) panelStatus itself gates on, applied ONLY to the
  // lanes panelStatus's required-only loop never visited.
  if (panel.status === panelLanes.STATUS.PASS) {
    const requiredIds = new Set((profile && profile.required) || []);
    const optionalRanAndFailed = perHelm.filter((l) => {
      if (!l || !l.laneId || requiredIds.has(l.laneId)) return false; // required lanes already reduced above
      if (l.hasEvidence !== true) return false; // ABSENT (or unprovable) optional lane — tolerated, never binds
      const coerced = l.fallback === true || !l.observedProvider || (!!l.contractedProvider && l.observedProvider !== l.contractedProvider);
      if (coerced) return false; // a coerced/fallback optional lane is not "ran and failed" — panel-lanes' own coercion semantics stay authoritative for required lanes only; an optional coerced lane is simply not proof of anything, not a bind
      if (l.alive !== true) return false; // a dead optional lane is unprovable, not a proven failure
      return String(l.verdict || "").toLowerCase() === "fail";
    });
    if (optionalRanAndFailed.length) {
      const failedIds = optionalRanAndFailed.map((l) => l.laneId);
      const laneStatus = { ...panel.laneStatus };
      for (const id of failedIds) laneStatus[id] = "fail";
      panel = {
        ...panel,
        status: panelLanes.STATUS.FAIL,
        reason: `optional lane(s) RAN and FAILED (binds, β rider 5): ${failedIds.join(", ")}`,
        laneStatus,
      };
    }
  }

  let integration;
  if (panel.status === panelLanes.STATUS.PASS && input.integrate) {
    // FIX-5a (QA-005/BE-CQ-P4-001+002/SR-TRUSTROOT-004): a PASS panel driving an integration is a REQUIRED
    // real-write flow — never forward the caller's `controllerOpts.performRefUpdate` verbatim (an absent/
    // false value would let the controller return INTEGRATED without ever mutating the ref, a false-green
    // this runner must never reproduce). `performRefUpdate:true` is FORCED here, the one and only place
    // this module ever decides that. A throwing integrateFn is caught — never a silent pass.
    try {
      integration = integrateFn(input.integrate, { ...(opts.controllerOpts || {}), performRefUpdate: true });
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
  DEFAULT_PROFILE,
  INTEGRATION_BLOCKED,
};
