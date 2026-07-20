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

  const panel = panelLanes.panelStatus(profile, perHelm, { agyOperatorOwned });

  let integration;
  if (panel.status === panelLanes.STATUS.PASS && input.integrate) {
    integration = integrateFn(input.integrate, opts.controllerOpts || {});
  }

  return { status: panel.status, perHelm, panel, integration };
}

module.exports = {
  runHelms,
  collectLaneEvidence,
  DEFAULT_PROFILE,
};
