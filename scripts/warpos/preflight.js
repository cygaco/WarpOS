/**
 * scripts/warpos/preflight.js — /warp:update preflight composer.
 *
 * Runs 10 gates in fail-fast order against the target install, producing
 * one structured aggregate report (IN-1). Emits TR-1 per-gate + 1 aggregate
 * `phase=preflight-summary` event to paths.eventsFile.
 *
 * Gates (in order):
 *   1. install-baseline          (NEW; F-4 mitigation; --force-fresh override)
 *   2. capsule-resolvable        (NEW; F-1 mitigation; --source <path> remediation)
 *   3. version-quorum            (NEW; F-3 mitigation; no override at gate; preflight may re-interpret with --allow-version-drift)
 *   4. manifest-honesty          (existing)
 *   5. staleness                 (existing; yellow-by-design; --allow-stale override)
 *   6. path-resolution           (existing)
 *   7. structure-parity          (existing)
 *   8. applied-migrations        (existing)
 *   9. migration-presence        (NEW; F-5 mitigation; no override)
 *  10. tracked-transients        (existing)
 *
 * Failure modes:
 *   - red (after override consideration): aggregate ok=false, run returns immediately
 *     (fail-fast is a contract for the apply path; for diagnostic listings,
 *     pass opts.allRed=true to keep running all 10 and surface every red)
 *   - yellow + matching override flag: re-interpreted as green; TR-1 carries
 *     `overrideUsed: true` (R-34 mitigation)
 *   - degraded (gate script absent): aggregate counts but does not block
 *
 * Linked: SP-20260513-005 / S-2 / T-052 /
 *   AC-S-2.{1,2,3} / IN-1 / R-1, R-5..R-12 / C-1..C-5.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const events = require("./lib/update-events");

// ── Gate registry ───────────────────────────────────────────────
//
// Each gate maps to a script under `scripts/checks/warpos-<name>.js`. The
// gate runner spawns it with `--json` and parses the result envelope.
// `overrideFlag`, when present, lets the preflight composer re-interpret
// red as yellow (with overrideUsed=true) when the operator opted in.

const GATES = [
  {
    name: "warpos-install-baseline",
    script: "scripts/checks/warpos-install-baseline.js",
    args: (o) => (o.forceFresh ? ["--force-fresh"] : []),
    overrideFlag: "forceFresh",
  },
  {
    name: "warpos-capsule-resolvable",
    script: "scripts/checks/warpos-capsule-resolvable.js",
    args: (o) => (o.toVersion ? ["--to", o.toVersion] : []),
    overrideFlag: null, // override is --source <path>, handled by update.js#discoverCanonical
  },
  {
    name: "warpos-version-quorum",
    script: "scripts/checks/warpos-version-quorum.js",
    args: () => [],
    overrideFlag: "allowVersionDrift",
  },
  {
    name: "warpos-manifest-honesty",
    script: "scripts/checks/warpos-manifest-honesty.js",
    args: () => [],
    overrideFlag: null,
  },
  {
    name: "warpos-staleness",
    script: "scripts/checks/warpos-staleness.js",
    args: () => [],
    overrideFlag: "allowStale",
  },
  {
    name: "warpos-path-resolution",
    script: "scripts/checks/warpos-path-resolution.js",
    args: () => [],
    overrideFlag: null,
  },
  {
    name: "warpos-structure-parity",
    script: "scripts/checks/warpos-structure-parity.js",
    args: () => [],
    overrideFlag: null,
  },
  {
    name: "warpos-applied-migrations",
    script: "scripts/checks/warpos-applied-migrations.js",
    args: () => [],
    overrideFlag: null,
  },
  {
    name: "warpos-migration-presence",
    script: "scripts/checks/warpos-migration-presence.js",
    args: (o) => {
      const args = [];
      if (o.toVersion) args.push("--to", o.toVersion);
      if (o.sourceRoot) args.push("--source", o.sourceRoot);
      return args;
    },
    overrideFlag: null, // No override per RT-5 — broken capsule is the bug
  },
  {
    name: "warpos-tracked-transients",
    script: "scripts/checks/warpos-tracked-transients.js",
    args: () => [],
    overrideFlag: null,
  },
];

// ── Gate runner ─────────────────────────────────────────────────

function runGate(gate, opts, targetRoot, sourceTreeRoot) {
  const start = Date.now();
  // Resolve script from the framework source tree (sourceTreeRoot), with
  // fallback to targetRoot for the self-update case.
  const candidates = [
    path.join(sourceTreeRoot || targetRoot, gate.script),
    path.join(targetRoot, gate.script),
  ];
  let scriptAbs = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      scriptAbs = c;
      break;
    }
  }
  if (!scriptAbs) {
    return {
      name: gate.name,
      status: "degraded",
      reason: `gate script not found: ${gate.script}`,
      remediation: null,
      durationMs: Date.now() - start,
      evidence: { searched: candidates },
    };
  }
  const args = ["--target", targetRoot, "--json", ...(gate.args(opts) || [])];
  const r = spawnSync(process.execPath, [scriptAbs, ...args], {
    cwd: targetRoot,
    encoding: "utf8",
    timeout: 60_000,
  });
  let parsed = null;
  try {
    parsed = JSON.parse(r.stdout || "");
  } catch {
    parsed = null;
  }
  if (!parsed || typeof parsed !== "object") {
    return {
      name: gate.name,
      status: "degraded",
      reason: "malformed gate result (non-JSON)",
      remediation: null,
      durationMs: Date.now() - start,
      evidence: {
        exitCode: r.status,
        stdout: (r.stdout || "").slice(0, 4096),
        stderr: (r.stderr || "").slice(0, 4096),
      },
    };
  }
  const result = {
    name: parsed.name || gate.name,
    status: parsed.status || (r.status === 0 ? "green" : "red"),
    reason: parsed.reason || `exit code ${r.status}`,
    remediation: parsed.remediation || null,
    durationMs: parsed.durationMs || Date.now() - start,
    evidence: parsed.evidence || {},
  };
  return result;
}

// ── Override interpretation (R-34) ──────────────────────────────

function applyOverride(gate, result, opts) {
  if (!gate.overrideFlag) return { result, overrideUsed: false };
  if (result.status !== "red" && result.status !== "yellow")
    return { result, overrideUsed: false };
  if (!opts[gate.overrideFlag]) return { result, overrideUsed: false };
  // Override accepted: re-interpret red/yellow as green for blocking purposes,
  // but keep the reason as evidence (preserves observability).
  return {
    result: {
      ...result,
      status: "yellow",
      reason: `${result.reason} (override ${gate.overrideFlag} accepted)`,
    },
    overrideUsed: true,
  };
}

// ── Composer ────────────────────────────────────────────────────

/**
 * Run preflight against a target install.
 *
 * @param {Object} opts
 * @param {string} opts.targetRoot         — abs path to install root
 * @param {string} opts.sourceTreeRoot     — abs path to canonical source tree (gate scripts live here)
 * @param {string} opts.toVersion          — capsule version to update to
 * @param {string} [opts.sourceRoot]       — abs path to capsule's repo root (defaults to sourceTreeRoot)
 * @param {boolean} [opts.allowStale]      — override flag (--allow-stale)
 * @param {boolean} [opts.forceFresh]      — override flag (--force-fresh)
 * @param {boolean} [opts.allowVersionDrift] — override flag
 * @param {boolean} [opts.allRed]          — diagnostic mode: run all gates even if one fails
 * @param {string} [opts.txId]             — optional transaction id for TR-1 events
 * @returns {Object} aggregate report per IN-1
 */
function runPreflight(opts) {
  if (!opts || !opts.targetRoot)
    throw new Error("runPreflight: targetRoot required");
  const targetRoot = path.resolve(opts.targetRoot);
  const sourceTreeRoot = path.resolve(opts.sourceTreeRoot || targetRoot);
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const gateResults = [];

  for (const gate of GATES) {
    const raw = runGate(gate, opts, targetRoot, sourceTreeRoot);
    const { result, overrideUsed } = applyOverride(gate, raw, opts);
    gateResults.push({ ...result, overrideUsed });
    events.emitPreflightGate(targetRoot, {
      txId: opts.txId || null,
      gate: result.name,
      status: result.status,
      reason: result.reason,
      remediation: result.remediation,
      durationMs: result.durationMs,
      evidence: result.evidence,
      overrideUsed,
    });
    // Fail-fast: stop on first red (unless allRed diagnostic mode).
    if (result.status === "red" && !opts.allRed) {
      break;
    }
  }

  const summary = { green: 0, yellow: 0, red: 0, degraded: 0 };
  for (const g of gateResults) {
    if (g.status === "green") summary.green += 1;
    else if (g.status === "yellow") summary.yellow += 1;
    else if (g.status === "red") summary.red += 1;
    else summary.degraded += 1;
  }
  const ok = summary.red === 0;
  const totalDurationMs = Date.now() - startMs;
  const completedAt = new Date().toISOString();
  const report = {
    ok,
    gateCount: gateResults.length,
    greenCount: summary.green,
    yellowCount: summary.yellow,
    redCount: summary.red,
    degradedCount: summary.degraded,
    gates: gateResults,
    totalDurationMs,
    startedAt,
    completedAt,
  };

  events.emitPreflightSummary(targetRoot, {
    txId: opts.txId || null,
    ok,
    gateCount: gateResults.length,
    redCount: summary.red,
    yellowCount: summary.yellow,
    greenCount: summary.green,
    totalDurationMs,
  });

  return report;
}

// ── Pretty-print helpers (operator-facing) ──────────────────────

function formatReport(report) {
  const lines = [];
  if (report.ok) {
    lines.push(
      `Preflight: ${report.gateCount}/${report.gateCount} gates GREEN`,
    );
  } else {
    lines.push(
      `Preflight: ${report.greenCount}/${report.gateCount} GREEN, ${report.redCount} RED, ${report.yellowCount} YELLOW, ${report.degradedCount} DEGRADED`,
    );
  }
  for (const g of report.gates) {
    const tag = g.status.toUpperCase().padEnd(8);
    lines.push(`  ${tag} ${g.name.padEnd(28)} ${g.reason || ""}`);
    if (g.status === "red" && g.remediation) {
      for (const line of g.remediation.split("\n")) {
        lines.push(`           ${line}`);
      }
    }
  }
  return lines.join("\n");
}

module.exports = {
  runPreflight,
  formatReport,
  GATES,
};

// Allow node scripts/warpos/preflight.js --target <p> --to <v> [...flags...]
if (require.main === module) {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i === -1 ? null : args[i + 1];
  };
  const opts = {
    targetRoot: path.resolve(
      get("--target") || process.env.CLAUDE_PROJECT_DIR || process.cwd(),
    ),
    sourceTreeRoot: get("--source-tree")
      ? path.resolve(get("--source-tree"))
      : path.resolve(__dirname, "..", ".."),
    toVersion: get("--to"),
    sourceRoot: get("--source") ? path.resolve(get("--source")) : null,
    allowStale: args.includes("--allow-stale"),
    forceFresh: args.includes("--force-fresh"),
    allowVersionDrift: args.includes("--allow-version-drift"),
    allRed: args.includes("--all-red") || args.includes("--diagnostic"),
  };
  const report = runPreflight(opts);
  if (args.includes("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    process.stdout.write(formatReport(report) + "\n");
  }
  process.exit(report.ok ? 0 : 1);
}
