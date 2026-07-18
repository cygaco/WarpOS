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

// The panel status vocabulary (PRD "Status contract"). The reducer NEVER normalizes a BLOCKED to
// PASS/GREEN — that normalization IS the false-green this phase kills.
const STATUS = Object.freeze({
  PASS: "PASS",
  FAIL: "FAIL",
  BLOCKED_INCONCLUSIVE: "BLOCKED-INCONCLUSIVE",
  BLOCKED_ON_OPERATOR: "BLOCKED-ON-OPERATOR",
});

// provider → model FAMILY, for the OBSERVED-provider diversity count (β rider #1). antigravity + gemini
// are BOTH the google family — an agy lane that fell back to gemini adds NO new family, and vice versa.
const PANEL_PROVIDER_FAMILY = { claude: "anthropic", openai: "openai", gemini: "google", antigravity: "google" };

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

/** The sanctioned in-process hunter role identity (ADR-0016). The exemption binds to THIS role. */
const SANCTIONED_HUNTER_ROLE = "security_claude_hunter";

/**
 * The ONE sanctioned in-process panel lane: the claude hunter. POSITIVE identity scope (β rider #3,
 * SR-005): lane id === "claude" AND provider === "claude" AND the lane carries the sanctioned hunter
 * ROLE identity (`sanctioned_lane_id`/`role` === "security_claude_hunter"). NOT the shape alone, NOT a
 * settable flag, and NOT merely provider===claude — an arbitrary Claude in-process security-reviewer
 * lane (no hunter role) can NEVER assert this exemption, nor can a gpt/agy lane.
 */
function isSanctionedInProcessLane(laneId, lane) {
  return (
    laneId === "claude" &&
    !!lane &&
    lane.provider === "claude" &&
    (lane.sanctioned_lane_id === SANCTIONED_HUNTER_ROLE || lane.role === SANCTIONED_HUNTER_ROLE)
  );
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
  // (5) Profiles: EXACT required sets (SR-006). An `includes()` check let a mutated
  // panel-3lab.required=[agy] or panel-2family.required=[gpt] validate ok — a required lane could be
  // silently DROPPED. Derive the expected sets from the REAL labs (passesOf → provider → laneId, the
  // single source) and assert set-EQUALITY: panel-3lab === the full lab set; panel-2family === the
  // full lab set MINUS agy (agy is optional/operator-owned in the degraded floor).
  const setEq = (a, b) =>
    Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x) => b.includes(x)) && b.every((x) => a.includes(x));
  const providerToLaneId = {};
  for (const [laneId, lane] of laneEntries) providerToLaneId[lane.provider] = laneId;
  const allLabLaneIds = passes.map((p) => providerToLaneId[p.provider]).filter(Boolean);
  const nonAgyLaneIds = passes.filter((p) => p.provider !== "antigravity").map((p) => providerToLaneId[p.provider]).filter(Boolean);
  const p3 = (manifest.profiles || {})["panel-3lab"];
  const p2 = (manifest.profiles || {})["panel-2family"];
  if (!p3 || p3.binding !== true) errors.push(`panel-3lab must exist and be binding:true`);
  else if (!setEq(p3.required || [], allLabLaneIds)) errors.push(`panel-3lab.required must be EXACTLY the full lab set ${JSON.stringify(allLabLaneIds)} (got ${JSON.stringify(p3.required)}) — an included-not-exact set lets a required lane be silently dropped (SR-006)`);
  if (!p2 || p2.binding === true) errors.push(`panel-2family must exist as the non-binding degraded floor (binding:false)`);
  else if (!setEq(p2.required || [], nonAgyLaneIds)) errors.push(`panel-2family.required must be EXACTLY the non-agy lab set ${JSON.stringify(nonAgyLaneIds)} (got ${JSON.stringify(p2.required)}) — agy is optional (operator-owned), not required, in the degraded floor (SR-006)`);

  return { ok: errors.length === 0, errors, passes, lanes };
}

/**
 * The panel VERDICT reducer (D7, AC-1,9,11,12,13). PURE. Reduces the per-required-lane OBSERVED
 * evidence + the profile into a status. PASS ONLY when EVERY required lane is alive, clean, and
 * ATTESTED on its CONTRACTED provider (fallback:false, observedProvider === contractedProvider), with
 * >= min_families DISTINCT provider families OBSERVED.
 *
 * β rider #1 (the coupling that kills the all-Claude masquerade): the diversity family count is
 * computed from the OBSERVED provider per lane, NEVER the manifest label. A lane counts toward
 * diversity IFF it ran on its contracted provider with fallback:false — a coerced/fallback lane (a
 * gpt/agy lane that silently became a Claude clone) adds NO family and BLOCKS. This is ONE gate, not
 * a parallel check a coerced lane slips past with its label intact.
 *
 * eval-fail-closed vs loader-fail-open SPLIT (T4): opts.loaderError → BLOCKED at the LOADER boundary,
 * a DISTINCT path from an evaluator finding (a lane verdict of "error"/"" → BLOCKED at eval). Two
 * paths so a fix to one cannot mask the other.
 *
 * @param {object} profile  { name, required:[laneId], min_families, binding }
 * @param {Array}  lanes    per-required-lane evidence:
 *   { laneId, contractedProvider, observedProvider, fallback, alive, verdict, hasEvidence }
 *     alive          a completion record exists AND exit was ok
 *     hasEvidence    a real ledger record backs the lane (false/absent = missing-evidence)
 *     verdict        'pass'|'warn'|'fail'|'error'  ('error'/'' = judge-refusal or malformed)
 *     observedProvider  the provider the ledger record actually names (β#1 diversity source)
 *     fallback       the record's fallback flag (true = a Claude clone ran, NOT the contracted lab)
 * @param {object} [opts]   { loaderError:boolean, agyOperatorOwned:boolean }
 * @returns {{ status, reason, families, laneStatus, binding, loader?, operator_blocked? }}
 */
function panelStatus(profile, lanes = [], opts = {}) {
  const binding = !!(profile && profile.binding);
  // LOADER-fail-closed (distinct path, T4): a contract that could not even be LOADED cannot certify.
  if (opts.loaderError) {
    return { status: STATUS.BLOCKED_INCONCLUSIVE, reason: "loader error — the panel contract could not be loaded (fail-closed at the loader boundary)", families: 0, laneStatus: {}, binding, loader: true };
  }

  const required = (profile && profile.required) || [];
  const laneById = {};
  for (const l of lanes) laneById[l.laneId] = l;

  const laneStatus = {};
  const blocked = [];          // laneIds that are unprovable (missing/coerced/dead/refused/malformed)
  const failed = [];           // laneIds with a binding FAIL verdict
  const operatorBlocked = [];  // operator-owned lanes (agy) absent — the honest BLOCKED-ON-OPERATOR exit
  const observedFamilies = new Set();

  for (const laneId of required) {
    const l = laneById[laneId];
    // ABSENT — no lane evidence at all. FAIL-CLOSED (SR-002): require hasEvidence === true explicitly.
    // An OMITTED hasEvidence is NOT proof — treating undefined as "present" is the fail-open hole a
    // caller slips through with a labels-only lane object (observedProvider set, evidence/liveness omitted).
    if (!l || l.hasEvidence !== true) {
      if (opts.agyOperatorOwned && laneId === "agy") { operatorBlocked.push(laneId); laneStatus[laneId] = "operator-owned-absent"; }
      else { blocked.push(laneId); laneStatus[laneId] = "missing-evidence"; }
      continue;
    }
    // COERCED — ran on the WRONG provider or via fallback (the masquerade). Never counts as its lab.
    // FAIL-CLOSED: an omitted observedProvider is itself a coercion signal (no proof of the contracted lab).
    const coerced =
      l.fallback === true ||
      !l.observedProvider ||
      (!!l.contractedProvider && l.observedProvider !== l.contractedProvider);
    if (coerced) { blocked.push(laneId); laneStatus[laneId] = "coerced"; continue; }
    // DEAD — a record exists but the dispatch was reaped / exited non-ok. FAIL-CLOSED (SR-002): require
    // alive === true explicitly; an OMITTED alive is not liveness proof.
    if (l.alive !== true) { blocked.push(laneId); laneStatus[laneId] = "dead"; continue; }
    const v = String(l.verdict || "").toLowerCase();
    if (v === "fail") { failed.push(laneId); laneStatus[laneId] = "fail"; continue; }
    if (v === "error" || v === "") { blocked.push(laneId); laneStatus[laneId] = "refused-or-malformed"; continue; }
    // ALIVE + CLEAN + ATTESTED on the CONTRACTED provider → counts toward diversity (β#1 observed).
    laneStatus[laneId] = "alive-clean";
    const fam = PANEL_PROVIDER_FAMILY[l.observedProvider] || l.observedProvider;
    if (fam) observedFamilies.add(fam);
  }

  const families = observedFamilies.size;
  const minFamilies = (profile && profile.min_families) || 2;

  // FAIL takes precedence — a concrete binding defect is the most actionable non-green outcome.
  if (failed.length) {
    return { status: STATUS.FAIL, reason: `required lane(s) FAILED: ${failed.join(", ")}`, families, laneStatus, binding };
  }
  // BLOCKED-ON-OPERATOR: the ONLY blocking issue is the operator-owned lane(s) (agy). The honest
  // "seam built, lane awaiting operator" exit (ED-060) — never GREEN.
  if (operatorBlocked.length && blocked.length === 0) {
    return { status: STATUS.BLOCKED_ON_OPERATOR, reason: `awaiting operator-owned lane(s): ${operatorBlocked.join(", ")} (ED-060) — never GREEN`, families, laneStatus, binding, operator_blocked: operatorBlocked };
  }
  // Any other unprovable lane (with or without an operator-owned absence) → INCONCLUSIVE.
  if (blocked.length || operatorBlocked.length) {
    return { status: STATUS.BLOCKED_INCONCLUSIVE, reason: `unprovable required lane(s): ${[...blocked, ...operatorBlocked].join(", ")}`, families, laneStatus, binding };
  }
  // Diversity: fewer than min_families OBSERVED → BLOCKED (a collapsed panel is not a pass).
  if (families < minFamilies) {
    return { status: STATUS.BLOCKED_INCONCLUSIVE, reason: `observed provider families ${families} < required ${minFamilies} (diversity loss — β#1 observed count)`, families, laneStatus, binding };
  }
  // Every required lane alive + clean + attested on its contracted provider + >= min_families.
  return { status: STATUS.PASS, reason: "all required lanes alive, clean, attested on the contracted provider; family diversity met", families, laneStatus, binding };
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
  panelStatus,
  agyLive,
  STATUS,
  PANEL_PROVIDER_FAMILY,
  MANIFEST_PATH,
  SUPPORT_MATRIX_PATH,
  CROSS_PROVIDER_SHAPE,
  IN_PROCESS_SHAPE,
};
