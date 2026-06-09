// scripts/hooks/lib/mode-lifecycle.js
// Shared reader for the Mode-Lifecycle Registry
// (.claude/agents/_org/mode-lifecycle.json) — THE single source of truth for
// mode → roster / requires_team / bindings / provider_tier / dispatch_profile /
// teardown (E-LIFECYCLE-001 / S-LC-01).
//
// De-duplicates the formerly-hardcoded required-team-by-mode sites:
//   • session-start.js  TEAM_MODES.faces  (the persistent-team-init directive)
//   • team-guard.js      FACE_TYPES         (the bootstrap-face allow-list)
// Both now resolve their roster FROM the registry via this reader.
//
// FAIL-OPEN for the reader (a hook must never crash on an unreadable registry):
// if the registry is missing/malformed, the readers fall back to FALLBACK. But
// the REGISTRY remains the authoritative source — FALLBACK is only a mirror to
// keep the hooks live, and the drift validator
// (scripts/checks/mode-lifecycle-registry.js) FAILS CLOSED if FALLBACK ever
// diverges from the registry.

const fs = require("fs");
const path = require("path");
const { PROJECT } = require("./paths");

const REGISTRY_FILE = path.join(
  PROJECT,
  ".claude",
  "agents",
  "_org",
  "mode-lifecycle.json",
);

// Fail-open mirror of the registry rosters. MUST stay identical to
// mode-lifecycle.json (enforced by scripts/checks/mode-lifecycle-registry.js).
const FALLBACK = {
  solo: { roster: [], requires_team: false },
  adhoc: { roster: ["alpha", "beta", "gamma"], requires_team: true },
  oneshot: { roster: ["delta"], requires_team: false },
  sprint: { roster: ["alpha", "epsilon", "beta"], requires_team: true },
};

/** Read + parse the registry's `modes` map, or null if unreadable. */
function loadModes(registryPath = REGISTRY_FILE) {
  try {
    const doc = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    if (doc && doc.modes && typeof doc.modes === "object") return doc.modes;
  } catch {
    /* fall through to FALLBACK at the call site */
  }
  return null;
}

/** The lifecycle entry for a mode (registry first, FALLBACK on unreadable). */
function modeEntry(mode, registryPath = REGISTRY_FILE) {
  const m = String(mode || "").toLowerCase();
  const modes = loadModes(registryPath);
  if (modes && modes[m]) return modes[m];
  return FALLBACK[m] || null;
}

/** Ordered roster (role ids) for a mode. [] if unknown. */
function roster(mode, registryPath = REGISTRY_FILE) {
  const e = modeEntry(mode, registryPath);
  return e && Array.isArray(e.roster) ? e.roster.slice() : [];
}

/** The persistent-team faces for a mode: roster minus the harness lead (alpha). */
function faces(mode, registryPath = REGISTRY_FILE) {
  return roster(mode, registryPath).filter(
    (r) => String(r).toLowerCase() !== "alpha",
  );
}

/** Does the mode operate through a persistent team that must be stood up? */
function requiresTeam(mode, registryPath = REGISTRY_FILE) {
  const e = modeEntry(mode, registryPath);
  return !!(e && e.requires_team);
}

/** The union of all faces across every mode — the bootstrap-allowed set
 *  (team-guard's FACE_TYPES). Lowercased Set, alpha excluded. */
function allFaces(registryPath = REGISTRY_FILE) {
  const modes = loadModes(registryPath) || FALLBACK;
  const set = new Set();
  for (const m of Object.keys(modes)) {
    for (const r of modes[m].roster || []) {
      const id = String(r).toLowerCase();
      if (id !== "alpha") set.add(id);
    }
  }
  return set;
}

module.exports = {
  REGISTRY_FILE,
  FALLBACK,
  loadModes,
  modeEntry,
  roster,
  faces,
  requiresTeam,
  allFaces,
};
