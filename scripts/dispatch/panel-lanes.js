#!/usr/bin/env node
"use strict";
/**
 * panel-lanes.js — the panel-lane-manifest reader + validator + CLI-only tooth (SP-20260718-003 D5).
 *
 * THE CONTRACT (PRD R-6 / AC-7,8):
 *   - loadManifest / getProfile / requiredLanes: read the machine-readable lane contract
 *     (.claude/agents/_org/panel-lane-manifest.json). A parse/read failure THROWS — the caller
 *     (D7 panelStatus) catches it at the LOADER boundary → BLOCKED-INCONCLUSIVE (never a fall-through
 *     to PASS). This is the eval-fail-closed vs loader-fail-open SPLIT the qa-plan T4 tests.
 *   - validatePanelManifest: the SINGLE-SOURCE drift gate. Lane identity is DERIVED from
 *     passesOf('security-reviewer') (role-registry keystone) + providerToolId() (dispatch-agent) and
 *     lane STATUS from support-matrix.json — the manifest is validated AGAINST those three, never a
 *     4th source. Any drift (a phantom lane, a tool_id mismatch, a wrong shape, a missing agy row) →
 *     ok:false. FAIL-CLOSED: a loader throw inside validate is reported as loaderError, not swallowed.
 *   - assertCliOnlyPanel + isSanctionedInProcessLane: the CLI-only tooth. A cross-provider lab
 *     (gpt/agy) resolved in-process-agent is REFUSED before merge (the D1<->D5 all-Claude masquerade).
 *     The claude hunter is the ONE legal in-process lane — POSITIVE-identity-scoped (β rider #3):
 *     lane id 'claude' AND provider 'claude', NOT a settable flag and NOT the shape alone, so a
 *     gpt/agy lane can never assert the exemption (its provider isn't claude).
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const MANIFEST_PATH = path.join(ROOT, ".claude", "agents", "_org", "panel-lane-manifest.json");
const SUPPORT_MATRIX_PATH = path.join(ROOT, ".claude", "kernel", "support-matrix.json");
const SECURITY_ROLE = "security-reviewer";

// The shapes the contract fixes per lane class (single place, so validate + the tooth agree).
const CROSS_PROVIDER_SHAPE = "subprocess-cross-provider";
const IN_PROCESS_SHAPE = "in-process-agent";

/** Read + parse the panel-lane manifest. THROWS on read/parse failure (loader boundary — the caller
 *  fails closed to BLOCKED-INCONCLUSIVE rather than proceeding with a partial contract). */
function loadManifest(manifestPath = MANIFEST_PATH) {
  const raw = fs.readFileSync(manifestPath, "utf8"); // throws ENOENT → loader-fail-closed
  return JSON.parse(raw); // throws on malformed JSON → loader-fail-closed
}

/** Read the support-matrix (the lane STATUS single-source). THROWS on read/parse failure. */
function loadSupportMatrix(p = SUPPORT_MATRIX_PATH) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function getProfile(manifest, name) {
  const prof = manifest && manifest.profiles && manifest.profiles[name];
  if (!prof) throw new Error(`panel profile '${name}' not found in manifest`);
  return prof;
}

/** The lane objects (with laneId attached) required by a profile, in declared order. */
function requiredLanes(manifest, profileName) {
  const prof = getProfile(manifest, profileName);
  return (prof.required || []).map((laneId) => {
    const lane = (manifest.lanes || {})[laneId];
    if (!lane) throw new Error(`profile '${profileName}' requires lane '${laneId}' which is not defined in manifest.lanes`);
    return { laneId, ...lane };
  });
}

/**
 * The ONE sanctioned in-process panel lane: the claude hunter. POSITIVE identity scope (β rider #3):
 * lane id === "claude" AND provider === "claude". NOT the shape alone, NOT a settable flag — an
 * agy/gpt lane can NEVER assert this exemption because its provider is not claude.
 */
function isSanctionedInProcessLane(laneId, lane) {
  return laneId === "claude" && !!lane && lane.provider === "claude";
}

/**
 * CLI-only tooth (T1-A / AC-7): a cross-provider panel lane MUST run as a CLI subprocess. Refuse an
 * in-process-agent shape for any lane that is NOT the sanctioned claude hunter — BEFORE merge. This
 * is the structural block on the D1<->D5 masquerade (an in-process gpt/agy is a silent Claude clone).
 *
 * @param {Array<{laneId, provider, shape}>} observedLanes  the lanes as actually resolved/run
 * @returns {{ ok, violations:string[] }}
 */
function assertCliOnlyPanel(observedLanes = []) {
  const violations = [];
  for (const l of observedLanes) {
    const laneId = l.laneId || l.lane || l.pass;
    if (isSanctionedInProcessLane(laneId, l)) continue; // the one legal in-process lane
    if (l.shape === IN_PROCESS_SHAPE) {
      violations.push(
        `panel lane '${laneId}' (provider ${l.provider}) resolved '${IN_PROCESS_SHAPE}' — a cross-provider lab MUST be a CLI subprocess ('${CROSS_PROVIDER_SHAPE}'); only the claude hunter (lane 'claude' + provider 'claude') may be in-process (β rider #3 positive scope)`,
      );
    }
  }
  return { ok: violations.length === 0, violations };
}

/**
 * The single-source drift gate. Validates the manifest AGAINST passesOf('security-reviewer') +
 * providerToolId() + support-matrix.json. FAIL-CLOSED: any drift → ok:false; a loader throw is
 * reported (loaderError:true), never swallowed into a green.
 *
 * Injectable seams (bite-test): manifest, roles, supportMatrix, toolIdOf, passesOf.
 * @returns {{ ok, errors:string[], loaderError?:boolean, passes?, lanes? }}
 */
function validatePanelManifest(opts = {}) {
  const errors = [];
  let manifest, passes, toolIdOf, supportMatrix;
  try {
    manifest = opts.manifest || loadManifest();
    const passesOf = opts.passesOf || require("./registry-roles").passesOf;
    passes = opts.roles ? passesOf(SECURITY_ROLE, opts.roles) : passesOf(SECURITY_ROLE);
    toolIdOf = opts.toolIdOf || require("../dispatch-agent").providerToolId;
    supportMatrix = opts.supportMatrix || loadSupportMatrix();
  } catch (e) {
    // LOADER-fail-closed: a missing/unparseable manifest, registry, or support-matrix cannot certify
    // the contract → BLOCKED at the loader boundary, DISTINCT from an evaluator drift finding.
    return { ok: false, loaderError: true, errors: [`panel manifest loader failed (fail-closed): ${e.message}`] };
  }

  const lanes = manifest.lanes || {};
  const laneEntries = Object.entries(lanes);
  const laneByProvider = {};
  for (const [laneId, lane] of laneEntries) laneByProvider[lane.provider] = { laneId, lane };

  // (1) Every registry pass (the REAL labs) must be covered by a manifest lane (by provider).
  for (const p of passes) {
    if (!laneByProvider[p.provider]) {
      errors.push(`registry pass provider '${p.provider}' (${p.key}) has NO manifest lane — the manifest must cover every security-reviewer pass (drift)`);
    }
  }
  // (2) No phantom lane; tool_id must equal providerToolId(provider) (provider-id/tool-id single-source).
  for (const [laneId, lane] of laneEntries) {
    if (!passes.some((p) => p.provider === lane.provider)) {
      errors.push(`manifest lane '${laneId}' provider '${lane.provider}' is NOT a security-reviewer pass (phantom lane)`);
    }
    const expectTool = toolIdOf(lane.provider);
    if (lane.tool_id !== expectTool) {
      errors.push(`manifest lane '${laneId}' tool_id '${lane.tool_id}' != providerToolId('${lane.provider}')='${expectTool}' (provider-id/tool-id drift)`);
    }
    // (3) Required shape per lane class: claude → in-process-agent (sanctioned); every other → CLI.
    const expectShape = lane.provider === "claude" ? IN_PROCESS_SHAPE : CROSS_PROVIDER_SHAPE;
    if (lane.shape !== expectShape) {
      errors.push(`manifest lane '${laneId}' shape '${lane.shape}' != required '${expectShape}' for provider '${lane.provider}'`);
    }
  }
  // (4) The agy lane must carry the ED-060 sunset ref AND the support-matrix must have its status row
  //     (the liveness single-source — read, never fabricated).
  const agyLane = laneByProvider["antigravity"];
  if (agyLane) {
    const sunsetBlob = JSON.stringify(agyLane.lane.sunset_ref || "") + JSON.stringify(manifest.sunset || "");
    if (!/ED-060/.test(sunsetBlob)) errors.push(`agy lane '${agyLane.laneId}' must carry a sunset ref to ED-060`);
    const agyRow = supportMatrix && supportMatrix.rows && supportMatrix.rows["agy-antigravity"];
    if (!agyRow) errors.push(`support-matrix.json has no 'agy-antigravity' row (the lane-status single-source) — cannot certify agy liveness`);
  }
  // (5) Profiles: panel-3lab BINDING required=[gpt,claude,agy]; panel-2family NON-binding, agy optional.
  const p3 = (manifest.profiles || {})["panel-3lab"];
  const p2 = (manifest.profiles || {})["panel-2family"];
  if (!p3 || p3.binding !== true) errors.push(`panel-3lab must exist and be binding:true`);
  else if (!(p3.required || []).includes("agy")) errors.push(`panel-3lab.required must include the agy lane (the binding 3rd lab)`);
  if (!p2 || p2.binding === true) errors.push(`panel-2family must exist as the non-binding degraded floor (binding:false)`);
  else if ((p2.required || []).includes("agy")) errors.push(`panel-2family must NOT require agy (agy is optional in the degraded floor)`);

  return { ok: errors.length === 0, errors, passes, lanes };
}

/** Whether the support-matrix reports the agy lab as live (status 'supported' + proven). Reads the
 *  STATUS field directly (never a cached/echoed liveness claim) — a down row → false (BLOCKED, not pass). */
function agyLive(supportMatrix) {
  try {
    const row = (supportMatrix || loadSupportMatrix()).rows["agy-antigravity"];
    return !!row && row.status === "supported" && row.proven === true;
  } catch {
    return false; // unreadable → not live (fail-closed)
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function main(argv) {
  const cmd = argv[0] || "validate";
  const json = argv.includes("--json");
  if (cmd === "validate") {
    let out;
    try {
      out = validatePanelManifest();
    } catch (e) {
      process.stderr.write(`panel-lanes validate: fail-closed loader error: ${e.message}\n`);
      return 1;
    }
    if (json) process.stdout.write(JSON.stringify(out, null, 2) + "\n");
    else if (out.ok) process.stdout.write(`OK  panel-lane-manifest validates against passesOf('${SECURITY_ROLE}') + support-matrix (single-source, no drift)\n`);
    else process.stderr.write(`FAIL panel-lane-manifest drift${out.loaderError ? " (loader)" : ""}:\n${out.errors.map((e) => "  - " + e).join("\n")}\n`);
    return out.ok ? 0 : 1;
  }
  process.stderr.write("usage: panel-lanes.js <validate> [--json]\n");
  return 2;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = {
  loadManifest,
  loadSupportMatrix,
  getProfile,
  requiredLanes,
  isSanctionedInProcessLane,
  assertCliOnlyPanel,
  validatePanelManifest,
  agyLive,
  MANIFEST_PATH,
  SUPPORT_MATRIX_PATH,
  CROSS_PROVIDER_SHAPE,
  IN_PROCESS_SHAPE,
};
