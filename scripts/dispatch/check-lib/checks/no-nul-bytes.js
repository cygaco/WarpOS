"use strict";
/**
 * no-nul-bytes check — WRAPS the existing `scripts/checks/no-nul-bytes.js` detection logic (its pure
 * `evaluate({files})` core) rather than re-implementing NUL-byte scanning a second time (deliverable #2 /
 * PRD "one shared check implementation" spirit — reuse the ONE detector even for a check-lib consumer).
 *
 * File collection (the walk) is scaffolding, not "the logic" — `evaluate()` is the actual detector and is
 * the only thing required() from the original module. `ctx.files` is injectable (tests / a caller who
 * already has a file corpus); `ctx.root` scopes a fresh scan when not supplied. IMPORTANT: this module is
 * snapshotted verbatim into the pinned bundle (Seam B) and then require()'d from an out-of-tree bundleRoot —
 * at that point `__dirname` no longer points at the live repo, so this check NEVER derives "the project
 * root to scan" from `__dirname`. It reads `ctx.root` (the caller — e.g. the controller — supplies the real
 * repo root explicitly) first, then `CLAUDE_PROJECT_DIR`, and only falls back to a `__dirname`-relative
 * guess for convenient direct/live invocation (never trustworthy once relocated into a bundle).
 */

const fs = require("fs");
const path = require("path");

// The __dirname-anchored guess for direct/live invocation when the caller doesn't supply ctx.root — NOT
// relied upon once this file has been snapshotted into an out-of-tree pinned bundle (see module doc
// above). Deliberately preferred over CLAUDE_PROJECT_DIR: that env var reflects the INVOKING session's
// project root, which can be a DIFFERENT checkout than the worktree this file is actually installed in
// (a confirmed worktree-cwd hazard) — __dirname is always correct for "the repo this file is part of."
const DIRECT_INVOCATION_ROOT_GUESS = path.resolve(__dirname, "..", "..", "..", "..");

const DEFAULT_SCAN_ROOTS = ["scripts", ".claude"];
const TEXT_EXT = new Set([".js", ".json", ".md", ".ts", ".mjs", ".cjs"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "runtime", ".provider-tmp"]);

function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      yield* walk(path.join(dir, ent.name));
    } else if (ent.isFile() && TEXT_EXT.has(path.extname(ent.name).toLowerCase())) {
      yield path.join(dir, ent.name);
    }
  }
}

function collectFiles(root, roots) {
  const files = [];
  for (const r of roots) {
    const abs = path.join(root, r);
    if (!fs.existsSync(abs)) continue;
    for (const file of walk(abs)) {
      try {
        files.push({ path: path.relative(root, file), buf: fs.readFileSync(file) });
      } catch {
        /* unreadable — skip, matches the original module's behavior */
      }
    }
  }
  return files;
}

/**
 * Resolve the ONE original detector implementation. Lazily required so a missing/broken original module
 * fails this check CLOSED (as a `fail`, never a silent skip-to-pass) rather than throwing at require time
 * for every consumer of check-lib.
 */
function loadOriginalEvaluate() {
  // The wrapped original lives outside check-lib, at scripts/checks/no-nul-bytes.js relative to the repo
  // root. When this file runs from an out-of-tree pinned bundle (Seam B), the bundle's `external/` copy is
  // snapshotted alongside it at build time (pinned-checker-bundle.js#buildBundle) at a mirrored relative
  // path — try that FIRST (a sibling `../../external/scripts/checks/no-nul-bytes.js`), then fall back to
  // resolving it against the live repo root for direct/live invocation.
  const bundleSibling = path.resolve(__dirname, "..", "..", "external", "scripts", "checks", "no-nul-bytes.js");
  if (fs.existsSync(bundleSibling)) return require(bundleSibling);
  return require(path.join(DIRECT_INVOCATION_ROOT_GUESS, "scripts", "checks", "no-nul-bytes.js"));
}

function run(ctx = {}) {
  const root = (ctx && ctx.root) || DIRECT_INVOCATION_ROOT_GUESS;
  const scanRoots = ctx && Array.isArray(ctx.scanRoots) && ctx.scanRoots.length ? ctx.scanRoots : DEFAULT_SCAN_ROOTS;

  let files;
  try {
    files = ctx && Array.isArray(ctx.files) ? ctx.files : collectFiles(root, scanRoots);
  } catch (e) {
    return { status: "fail", reason: "no-nul-bytes-scan-error", evidence: { error: String(e && e.message ? e.message : e) } };
  }

  let impl;
  try {
    impl = loadOriginalEvaluate();
  } catch (e) {
    return { status: "fail", reason: "no-nul-bytes-original-unavailable", evidence: { error: String(e && e.message ? e.message : e) } };
  }
  if (!impl || typeof impl.evaluate !== "function") {
    return { status: "fail", reason: "no-nul-bytes-original-missing-evaluate", evidence: {} };
  }

  let res;
  try {
    res = impl.evaluate({ files }); // the ONE detection implementation, reused — never re-implemented here
  } catch (e) {
    return { status: "fail", reason: "no-nul-bytes-evaluate-error", evidence: { error: String(e && e.message ? e.message : e) } };
  }

  if (res && res.ok) return { status: "pass", reason: "no-nul-bytes-clean", evidence: { scanned: files.length } };
  return { status: "fail", reason: "nul-byte-found", evidence: { offenders: (res && res.offenders) || [], scanned: files.length } };
}

module.exports = { name: "no-nul-bytes", run };
