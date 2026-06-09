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
 *   node scripts/checks/mode-lifecycle-registry.js [validate] [--registry <path>]
 *       [--reader <path>] [--team-guard <path>] [--session-start <path>] [--json]
 *   (--registry/--reader/--team-guard/--session-start override the corresponding
 *    input path; used ONLY by the sealed planted-fixture tests — defaults are the
 *    real tree. The real files are never mutated.)
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

// ── reader-drift detectors (check 3) ─────────────────────────────────────────
// Strip // line + /* */ block comments so a DEAD (commented-out) import/call
// cannot satisfy the "derives from the registry" check, and a comment that
// merely mentions the anti-pattern cannot false-trigger the literal detector.
function stripComments(src) {
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, " ");
  return noBlock
    .split("\n")
    .map((line) => {
      let i = line.indexOf("//");
      // Keep "://" (URLs): skip a // immediately preceded by a colon.
      while (i > 0 && line[i - 1] === ":") i = line.indexOf("//", i + 1);
      return i === -1 ? line : line.slice(0, i);
    })
    .join("\n");
}

// (A) The reader must IMPORT the shared reader AND actually CALL a roster-
// deriving function — a bare/commented mention no longer counts.
const READER_IMPORT = /require\([^)]*lib\/mode-lifecycle[^)]*\)/;
const READER_CALL = /\.\s*(allFaces|faces|roster|requiresTeam|modeEntry)\s*\(/;
// (B1) A reintroduced authoritative roster-source const assigned a LITERAL
// (array / Set-of-array / object map) instead of being derived from the reader.
// `FACE_TYPES = modeFaces` (an identifier) is fine; `FACE_TYPES = new Set([…])`
// / `= [ … ]` / `= { … }` is drift.
const HARDCODED_ROSTER_CONST =
  /\b(FACE_TYPES|TEAM_MODES|TEAM_BY_MODE|REQUIRED_TEAM(?:_MODES)?|MODE_ROSTERS?|ROSTER_BY_MODE)\b\s*=\s*(new\s+Set\s*\(\s*\[|\[|\{)/;
// (B2) A reconstructed mode→roster map literal (regardless of the const name):
// an object key that is a mode name whose value is an array opening with a role
// id. The legitimate flat fail-open fallback (a Set of roles, not mode-keyed) is
// NOT matched.
const MODE_ROSTER_MAP =
  /\b(solo|adhoc|oneshot|sprint)\b\s*:\s*\[\s*["'](alpha|beta|gamma|delta|epsilon)\b/;

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const flagVal = (flag, dflt) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
  };
  const registryPath = flagVal("--registry", DEFAULT_REGISTRY);
  const readerPath = flagVal("--reader", READER);
  const teamGuardPath = flagVal("--team-guard", TEAM_GUARD);
  const sessionStartPath = flagVal("--session-start", SESSION_START);

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
    delete require.cache[require.resolve(readerPath)];
    FALLBACK = require(readerPath).FALLBACK;
  } catch (e) {
    problems.push(`mirror: cannot load lib/mode-lifecycle.js FALLBACK: ${e.message}`);
  }
  if (FALLBACK && modes) {
    for (const m of LIVE_MODES) {
      const reg = modes[m];
      const fb = FALLBACK[m];
      // FAIL-CLOSED: a live mode absent from the fail-open mirror must be a
      // PROBLEM, not a skip — otherwise the readers would have no fallback for
      // that mode and the absence would slip past silently (the exact fail-open
      // hole this validator exists to close). Registry-absence is already
      // reported by the SCHEMA section above; flag FALLBACK-absence here.
      if (!fb) {
        problems.push(
          `mirror: live mode "${m}" MISSING from reader FALLBACK ` +
            `(lib/mode-lifecycle.js) — the fail-open mirror must cover every live mode`,
        );
      }
      if (!reg || !fb) continue; // both present required for the field compare below
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

  // ── 3. READERS still DERIVE their roster from the registry ───────────────────
  // Behavioral, not a bare string match: each reader must (a) IMPORT the shared
  // reader AND actually CALL a roster-deriving function (a dead/commented import
  // no longer passes), and (b) NOT reintroduce a hardcoded roster literal — a
  // FACE_TYPES/TEAM_MODES-style const assigned an array/Set/map, or a
  // reconstructed mode→roster map — even if a dead import lingers. The
  // legitimate fail-open fallback (a flat Set of faces inside a catch) is NOT a
  // mode-keyed map and is NOT an authoritative source const, so it is not flagged.
  for (const [label, file] of [
    ["team-guard.js", teamGuardPath],
    ["session-start.js", sessionStartPath],
  ]) {
    try {
      const code = stripComments(fs.readFileSync(file, "utf8"));
      if (!READER_IMPORT.test(code) || !READER_CALL.test(code)) {
        problems.push(
          `readers: ${label} does not DERIVE its roster from ./lib/mode-lifecycle ` +
            `(missing the import or a roster-deriving call: allFaces/faces/roster/` +
            `requiresTeam/modeEntry) — it must resolve required-team-by-mode FROM ` +
            `the registry, not a hardcoded literal`,
        );
      }
      if (HARDCODED_ROSTER_CONST.test(code) || MODE_ROSTER_MAP.test(code)) {
        problems.push(
          `readers: ${label} reintroduces a HARDCODED roster literal (a ` +
            `FACE_TYPES/TEAM_MODES-style const or a mode→roster map) — the roster ` +
            `must be derived from the registry, not re-hardcoded`,
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
