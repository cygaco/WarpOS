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

/** Is a present registry entry well-formed for the fields the readers consume?
 *  The readers derive `roster` (an array of role-id strings) and `requires_team`
 *  (a boolean) from this entry — so those must be well-typed. A PRESENT-but-
 *  malformed entry must NOT be trusted: it would yield an empty roster / false
 *  requires_team in the hot-path hooks, defeating the fail-open design. */
function isWellFormedEntry(e) {
  return (
    !!e &&
    typeof e === "object" &&
    !Array.isArray(e) &&
    Array.isArray(e.roster) &&
    e.roster.every((r) => typeof r === "string") &&
    typeof e.requires_team === "boolean"
  );
}

/** The lifecycle entry for a mode (registry first, FALLBACK on unreadable OR on
 *  a present-but-malformed entry — fail-open). */
function modeEntry(mode, registryPath = REGISTRY_FILE) {
  const m = String(mode || "").toLowerCase();
  const modes = loadModes(registryPath);
  // Trust a PRESENT registry entry only when its per-mode SHAPE is valid;
  // otherwise FALL BACK (fail-open) so a partially-malformed entry can never
  // hand back an empty roster / false requires_team to the readers.
  if (modes && isWellFormedEntry(modes[m])) return modes[m];
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
 *  (team-guard's FACE_TYPES). Lowercased Set, alpha excluded.
 *
 *  CLASS FIX (S-LC-01 fix-cycle #2): this MUST NOT iterate a RAW registry roster.
 *  The prior `for (const r of modes[m].roster || [])` over `loadModes()` would, on
 *  a present-but-malformed entry (e.g. roster: "alpha,epsilon,beta" — a STRING,
 *  not an array), iterate the string's CHARACTERS via for…of and hand back a
 *  bogus non-empty face set to team-guard's bootstrap allow-list. Instead we
 *  enumerate the live-mode set (FALLBACK keys — the drift-validator-enforced live
 *  mode list — unioned with any registry mode KEYS) and derive EACH mode's roster
 *  through the SHAPE-VALIDATED roster() helper (→ modeEntry → isWellFormedEntry).
 *  A malformed entry therefore falls back fail-open PER MODE instead of leaking
 *  characters. No raw `.roster` is ever read here. */
function allFaces(registryPath = REGISTRY_FILE) {
  // Enumerate mode KEYS only (never a roster value): the trusted FALLBACK keys
  // (every live mode is guaranteed present — the validator fails closed otherwise)
  // plus any extra registry mode keys. Roster VALUES come solely from roster().
  const modeKeys = new Set(Object.keys(FALLBACK));
  const modes = loadModes(registryPath);
  if (modes && typeof modes === "object") {
    for (const k of Object.keys(modes)) modeKeys.add(String(k).toLowerCase());
  }
  const set = new Set();
  for (const m of modeKeys) {
    // roster() routes through modeEntry()→isWellFormedEntry: a malformed entry
    // yields the FALLBACK roster, never a char-iterated string.
    for (const r of roster(m, registryPath)) {
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
