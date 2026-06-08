/**
 * oneshot-store.js — Guarded reader for the δ (oneshot) store.json + retros dir.
 *
 * The delta/oneshot scripts read the build store (features[], heartbeat,
 * bugDataset, …) on a hot path. On a fresh checkout — or after a `/clear`,
 * post-crash resume, or a brand-new project — `store.json` does not exist yet,
 * and a raw `JSON.parse(fs.readFileSync(...))` throws an un-caught ENOENT that
 * hard-crashes δ. (Same class for a half-written/malformed store.) This helper
 * makes the absent/empty/malformed case FAIL SOFT: it returns an empty object
 * (or empty list, for the retros dir) instead of throwing. When the store
 * EXISTS and parses, behavior is unchanged — the parsed object flows through.
 *
 * Paths route through PATHS.* (the centralized registry), never a re-hardcoded
 * literal, so the D-2 `.system` → `_system` move stays correct here. Callers
 * may pass an explicit path to override (used by the test + worktree readers).
 *
 * Source: ED-037 (D-2 gauntlet flagged the un-caught ENOENT-crash class).
 */
const fs = require("fs");
const { PATHS } = require("./paths");

/**
 * Read the oneshot store.json, failing soft on absent/empty/malformed.
 *
 * @param {string} [storePath] - Override path (defaults to PATHS.oneshotStore).
 * @returns {object} The parsed store, or {} when missing/empty/unparseable.
 */
function readOneshotStore(storePath = PATHS.oneshotStore) {
  let raw;
  try {
    raw = fs.readFileSync(storePath, "utf8");
  } catch {
    // ENOENT (no store yet) or any read error → soft-empty.
    return {};
  }
  if (!raw || !raw.trim()) return {}; // empty file
  try {
    const parsed = JSON.parse(raw);
    // Guard against `null`/scalar JSON ("null", "42") — callers expect an object.
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    // Malformed / half-written JSON → soft-empty.
    return {};
  }
}

/**
 * List entries in the oneshot retros dir, failing soft on an absent dir.
 *
 * @param {string} [retrosDir] - Override path (defaults to PATHS.oneshotRetros).
 * @returns {string[]} Directory entries, or [] when the dir is missing.
 */
function readRetroDirs(retrosDir = PATHS.oneshotRetros) {
  try {
    return fs.readdirSync(retrosDir);
  } catch {
    return [];
  }
}

module.exports = { readOneshotStore, readRetroDirs };
