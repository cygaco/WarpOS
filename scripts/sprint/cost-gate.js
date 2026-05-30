#!/usr/bin/env node
"use strict";

/**
 * sprint cost-gate toggle — turn the /sprint:full heuristic cost halt on/off.
 *
 * The orchestrator (full.js) halts a run when its COARSE per-phase cost
 * heuristic (PHASE_TYPICAL_SPEND_USD) exceeds the preset's
 * `cost_estimate_threshold_usd`. That estimate is a guardrail, not measured
 * spend. When the operator has authorized a session spend posture (and is
 * tracking real spend separately), the heuristic halt is pure friction — this
 * toggle turns it off, and back on.
 *
 * SCOPE: this toggles ONLY the /sprint:full cost-estimate halt. It does NOT
 * lift the hard ceilings (push-to-remote / production-deploy /
 * paid-service-signup) or the real ">= $5 ask the operator" autonomy rule —
 * those are enforced elsewhere and are deliberately NOT toggleable from here.
 *
 * State: .claude/runtime/sprint-cost-gate.json  (absent => gate ON, safe default)
 *
 * Usage:
 *   node scripts/sprint/cost-gate.js status
 *   node scripts/sprint/cost-gate.js off --by alpha --reason "operator $500 session cap 2026-05-30"
 *   node scripts/sprint/cost-gate.js on  --by alpha
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const STATE_FILE = path.join(
  REPO_ROOT,
  ".claude",
  "runtime",
  "sprint-cost-gate.json",
);

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null; // absent / unreadable => default
  }
}

/**
 * Single source of truth for "is the cost gate on?" — required by full.js so
 * the read logic is not duplicated across the toggle and its consumer (one
 * toggle, one reader; avoids the skip-list-style drift class).
 * Default is ON: the guardrail is never silently removed by a missing/garbled file.
 */
function isCostGateEnabled() {
  const s = readState();
  if (s && typeof s.enabled === "boolean") return s.enabled;
  return true;
}

function writeState(enabled, by, reason) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  const state = {
    enabled,
    set_by: by || "unknown",
    set_at: new Date().toISOString(),
    reason: reason || "",
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n");
  return state;
}

function main(argv) {
  const cmd = argv[2];
  let by = null;
  let reason = null;
  for (let i = 3; i < argv.length; i++) {
    if (argv[i] === "--by") by = argv[++i];
    else if (argv[i] === "--reason") reason = argv[++i];
  }

  if (cmd === "status") {
    const s = readState();
    console.log(`sprint cost-gate: ${isCostGateEnabled() ? "ON" : "OFF"}`);
    if (s) {
      console.log(`  set_by: ${s.set_by}`);
      console.log(`  set_at: ${s.set_at}`);
      if (s.reason) console.log(`  reason: ${s.reason}`);
    } else {
      console.log("  (default — no toggle file present; gate ON)");
    }
    return 0;
  }

  if (cmd === "on" || cmd === "off") {
    const enabled = cmd === "on";
    const s = writeState(enabled, by, reason);
    console.log(`sprint cost-gate -> ${enabled ? "ON" : "OFF"}`);
    console.log(`  set_by: ${s.set_by}`);
    if (s.reason) console.log(`  reason: ${s.reason}`);
    if (!enabled) {
      console.log(
        "  NOTE: /sprint:full will no longer halt on the cost-estimate heuristic.",
      );
      console.log(
        "  Hard ceilings (push/deploy/paid-signup) + the real >$5 operator rule are UNAFFECTED.",
      );
    }
    return 0;
  }

  process.stderr.write(
    'usage: cost-gate.js <on|off|status> [--by <who>] [--reason "<text>"]\n',
  );
  return 2;
}

if (require.main === module) {
  process.exit(main(process.argv));
}

module.exports = { isCostGateEnabled, readState, STATE_FILE };
