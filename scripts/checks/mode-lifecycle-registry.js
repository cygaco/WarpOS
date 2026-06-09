#!/usr/bin/env node
"use strict";

/**
 * scripts/checks/mode-lifecycle-registry.js — fail-closed drift validator for
 * the Mode-Lifecycle Registry (.claude/agents/_org/mode-lifecycle.json), the
 * single source of truth for mode → roster / requires_team / bindings /
 * provider_tier / dispatch_profile / teardown (E-LIFECYCLE-001 / S-LC-01).
 *
 * It earns its keep: the readers (team-guard.js FACE_TYPES, session-start.js
 * TEAM_MODES) resolve their roster FROM the registry via lib/mode-lifecycle.js,
 * which carries a fail-open FALLBACK mirror. If that mirror — or a reader's
 * registry-reference — ever DRIFTS from the registry, this check fails CLOSED.
 *
 * Mirrors the shape of scripts/dispatch/dispatch-contract.js validate.
 *
 * Checks:
 *   1. SCHEMA   — registry parses; every live mode (solo|adhoc|oneshot|sprint)
 *                 present with roster[]/requires_team(bool)/bindings[]/
 *                 provider_tier(str)/dispatch_profile_ref(str)/teardown(obj).
 *   2. MIRROR   — lib/mode-lifecycle.js#FALLBACK roster+requires_team match the
 *                 registry per mode (the fail-open mirror must not silently
 *                 diverge from the SoT — that is the drift bug class).
 *   3. READERS  — team-guard.js + session-start.js reference the shared reader
 *                 (./lib/mode-lifecycle) — i.e. they still resolve from the
 *                 registry rather than re-hardcoding a roster.
 *
 * Exit codes:
 *   0 — consistent (clean tree)
 *   1 — drift / schema violation (fail-closed)
 *   2 — internal error (unreadable inputs) — fail-closed
 *
 * Usage:
 *   node scripts/checks/mode-lifecycle-registry.js [validate] [--registry <path>] [--json]
 *   (--registry overrides the registry path; used by the planted-fixture test.)
 */

const fs = require("fs");
const path = require("path");

// Resolve from this script's own location (like dispatch-contract.js) so the
// check validates the TREE IT LIVES IN — correct in a worktree (uncommitted
// edits) and when shipped. Deliberately NOT CLAUDE_PROJECT_DIR (which can point
// at the canonical root during a worktree session — the cwd hazard).
const ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_REGISTRY = path.join(
  ROOT,
  ".claude",
  "agents",
  "_org",
  "mode-lifecycle.json",
);
const READER = path.join(ROOT, "scripts", "hooks", "lib", "mode-lifecycle.js");
const TEAM_GUARD = path.join(ROOT, "scripts", "hooks", "team-guard.js");
const SESSION_START = path.join(ROOT, "scripts", "hooks", "session-start.js");

const LIVE_MODES = ["solo", "adhoc", "oneshot", "sprint"];
const REQUIRED_FIELDS = {
  roster: (v) => Array.isArray(v),
  requires_team: (v) => typeof v === "boolean",
  bindings: (v) => Array.isArray(v),
  provider_tier: (v) => typeof v === "string" && v.length > 0,
  dispatch_profile_ref: (v) => typeof v === "string" && v.length > 0,
  teardown: (v) => v && typeof v === "object" && !Array.isArray(v),
};

const eqArr = (a, b) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  a.length === b.length &&
  a.every((x, i) => String(x).toLowerCase() === String(b[i]).toLowerCase());

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const ri = args.indexOf("--registry");
  const registryPath = ri >= 0 && args[ri + 1] ? args[ri + 1] : DEFAULT_REGISTRY;

  const problems = [];

  // ── 1. SCHEMA ──────────────────────────────────────────────────────────────
  let modes = null;
  try {
    const doc = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    modes = doc && doc.modes;
    if (!modes || typeof modes !== "object") {
      problems.push(`schema: registry has no \`modes\` object (${registryPath})`);
    }
  } catch (e) {
    problems.push(`schema: registry unreadable/unparseable (${registryPath}): ${e.message}`);
  }

  if (modes && typeof modes === "object") {
    for (const m of LIVE_MODES) {
      const entry = modes[m];
      if (!entry || typeof entry !== "object") {
        problems.push(`schema: mode "${m}" missing from registry`);
        continue;
      }
      for (const [field, ok] of Object.entries(REQUIRED_FIELDS)) {
        if (!(field in entry)) {
          problems.push(`schema: mode "${m}" missing field "${field}"`);
        } else if (!ok(entry[field])) {
          problems.push(`schema: mode "${m}" field "${field}" has the wrong type`);
        }
      }
    }
  }

  // ── 2. MIRROR — lib/mode-lifecycle.js FALLBACK ⟷ registry ───────────────────
  let FALLBACK = null;
  try {
    delete require.cache[require.resolve(READER)];
    FALLBACK = require(READER).FALLBACK;
  } catch (e) {
    problems.push(`mirror: cannot load lib/mode-lifecycle.js FALLBACK: ${e.message}`);
  }
  if (FALLBACK && modes) {
    for (const m of LIVE_MODES) {
      const reg = modes[m];
      const fb = FALLBACK[m];
      if (!reg || !fb) continue; // schema check already flagged absence
      if (!eqArr(reg.roster, fb.roster)) {
        problems.push(
          `drift: mode "${m}" roster — registry [${(reg.roster || []).join(",")}] ` +
            `≠ reader FALLBACK [${(fb.roster || []).join(",")}]`,
        );
      }
      if (Boolean(reg.requires_team) !== Boolean(fb.requires_team)) {
        problems.push(
          `drift: mode "${m}" requires_team — registry ${reg.requires_team} ` +
            `≠ reader FALLBACK ${fb.requires_team}`,
        );
      }
    }
  }

  // ── 3. READERS reference the shared reader (resolve from the registry) ───────
  for (const [label, file] of [
    ["team-guard.js", TEAM_GUARD],
    ["session-start.js", SESSION_START],
  ]) {
    try {
      const src = fs.readFileSync(file, "utf8");
      if (!/lib\/mode-lifecycle/.test(src)) {
        problems.push(
          `readers: ${label} does not reference ./lib/mode-lifecycle — it must ` +
            `resolve required-team-by-mode FROM the registry, not a hardcoded literal`,
        );
      }
    } catch (e) {
      problems.push(`readers: cannot read ${label}: ${e.message}`);
    }
  }

  // ── report ──────────────────────────────────────────────────────────────────
  const ok = problems.length === 0;
  if (asJson) {
    process.stdout.write(
      JSON.stringify({ ok, problems, registry: registryPath }, null, 2) + "\n",
    );
  } else if (ok) {
    console.log("mode-lifecycle-registry: OK — readers consistent with the registry.");
  } else {
    console.log(`mode-lifecycle-registry: ${problems.length} problem(s) — FAIL (closed):`);
    for (const p of problems) console.log(`  ✗ ${p}`);
  }
  process.exit(ok ? 0 : 1);
}

try {
  main();
} catch (e) {
  // Fail-closed on any internal error — a validator that crashes must not be
  // mistaken for a pass.
  console.error(`mode-lifecycle-registry: internal error — ${e.message}`);
  process.exit(2);
}
