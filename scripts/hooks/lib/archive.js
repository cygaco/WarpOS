#!/usr/bin/env node
"use strict";

/**
 * archive.js — the archive tier for rotated + retained raw logs.
 *
 * D-1 (operator directive 2026-07-17): raw event/log history is NEVER
 * destroyed. The destructive path for BOTH rotation (rotate.js) and retention
 * (retention.js) is a MOVE-TO-ARCHIVE, not a delete. Every over-cap log
 * generation and every retention-eligible transient MOVES here under a
 * collision-proof name, and an append-only `index.jsonl` records the move so
 * the raw history stays ACCESSIBLE and restorable (addendum B: archive index +
 * restore drill).
 *
 * WHERE IT LIVES: `<root>/.claude/runtime/archive/` — owner=runtime, which is
 * walk-skipped by the manifest builder/validator (WALK_SKIP_DIRS has
 * "runtime") AND gitignored (addendum C: rotation/archive artifacts are a
 * declared manifest-ignore class). Archiving therefore never trips BC-02 nor
 * stages raw logs into a commit/capsule.
 *
 * DEPENDENCY-LIGHT (like rotate.js): fs/path only, no side effects on require,
 * so rotate.js can require it on the hot logging path without dragging in
 * logger.js's module-init side effects.
 *
 * SAFE-BY-CONSTRUCTION:
 *   - the archive dir is derived from the caller's TRUSTED root, never from an
 *     arbitrary caller path;
 *   - the SOURCE must resolve inside `root` (containment) AND be a regular file
 *     (lstat, no symlink-follow) or the move is REFUSED — a shape that cannot
 *     be safely resolved is skipped, never moved;
 *   - the destination name is UNIQUE (basename + compact-ts + pid + random) so
 *     a concurrent archiver can NEVER clobber a prior generation. This is the
 *     load-bearing fix for F-ROT-1 (the old `rename → .1` kept exactly one
 *     generation; a stale rotator clobbered it, losing a generation). Unique
 *     names make generation-loss impossible by construction — stronger than a
 *     lock, which can go stale (kill-the-seam, not the predicate);
 *   - every function NEVER throws — any fault degrades to `{ok:false, reason}`.
 */

const fs = require("fs");
const path = require("path");

const ARCHIVE_SUBDIR = path.join(".claude", "runtime", "archive");
const INDEX_BASENAME = "index.jsonl";

// ── Path containment (source must live inside the trusted root) ──────────────
// A deliberately minimal, dependency-light twin of retention.js#safeResolve —
// kept local so archive.js stays hot-path-safe (fs/path only). Both security
// modules independently prove containment; neither trusts the other's caller.
function resolveInsideRoot(rootAbs, candidate) {
  try {
    const resolved = path.resolve(candidate);
    const rootWithSep = rootAbs.endsWith(path.sep) ? rootAbs : rootAbs + path.sep;
    if (resolved !== rootAbs && !resolved.startsWith(rootWithSep)) return null;
    return resolved;
  } catch {
    return null;
  }
}

/** Absolute path to the archive dir for `root`. */
function archiveDir(rootAbs) {
  return path.join(rootAbs, ARCHIVE_SUBDIR);
}

/** Absolute path to the archive index for `root`. */
function archiveIndexPath(rootAbs) {
  return path.join(archiveDir(rootAbs), INDEX_BASENAME);
}

/**
 * Collision-proof archive name: `<basename>.<compactISO>.<pid>.<rand>`.
 * Two archivers moving the SAME sink concurrently produce DIFFERENT names, so
 * no generation is ever overwritten (F-ROT-1). The index (not the name) is the
 * queryable record; the name only needs to be unique + roughly sortable.
 */
function uniqueArchiveName(basename) {
  const ts = new Date().toISOString().replace(/[:.]/g, "").replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${basename}.${ts}.${process.pid}.${rand}`;
}

/** Count JSONL lines (filter(Boolean)) — best-effort, for the index only. */
function countLinesSafe(file) {
  try {
    const content = fs.readFileSync(file, "utf8");
    return content.length === 0 ? 0 : content.split("\n").filter(Boolean).length;
  } catch {
    return null;
  }
}

/**
 * Move `srcPath` into the archive tier of `root`. NEVER throws.
 *
 * @param {string} srcPath  file to archive (must resolve INSIDE root + be a regular file)
 * @param {object} opts
 * @param {string} opts.root   trusted project root (archive dir is derived from it)
 * @param {string} [opts.reason]  free-form reason (e.g. "rotation:over-cap", "retention:handoff-live")
 * @param {string} [opts.shape]   classification tag (e.g. sink class or retention shape)
 * @returns {{ok:boolean, archived?:string, origin?:string, entry?:object, reason?:string}}
 */
function archive(srcPath, opts) {
  try {
    opts = opts || {};
    if (!opts.root || typeof opts.root !== "string") {
      return { ok: false, reason: "no-trusted-root" };
    }
    const rootAbs = path.resolve(opts.root);
    const srcAbs = resolveInsideRoot(rootAbs, srcPath);
    if (!srcAbs) return { ok: false, reason: "escapes-root" };

    // Regular-file only, no symlink-follow (defense against a swapped target).
    let st;
    try {
      st = fs.lstatSync(srcAbs);
    } catch {
      return { ok: false, reason: "missing" };
    }
    if (!st.isFile()) return { ok: false, reason: "not-a-regular-file" };

    const dir = archiveDir(rootAbs);
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      return { ok: false, reason: "archive-dir-unwritable" };
    }

    // Capture size/lines BEFORE the move (best-effort telemetry for the index).
    const bytes = typeof st.size === "number" ? st.size : null;
    const lines = countLinesSafe(srcAbs);

    const destAbs = path.join(dir, uniqueArchiveName(path.basename(srcAbs)));

    // Move: rename is atomic on-device; fall back to copy+unlink across devices.
    try {
      fs.renameSync(srcAbs, destAbs);
    } catch (e) {
      if (e && e.code === "EXDEV") {
        try {
          fs.copyFileSync(srcAbs, destAbs);
          fs.unlinkSync(srcAbs);
        } catch {
          return { ok: false, reason: "move-failed" };
        }
      } else {
        // Source vanished between lstat and rename (a concurrent archiver won
        // the race) — NOT data loss: the other archiver moved it. No-op.
        return { ok: false, reason: "move-failed" };
      }
    }

    const entry = {
      ts: new Date().toISOString(),
      origin: path.relative(rootAbs, srcAbs).replace(/\\/g, "/"),
      archived: path.relative(rootAbs, destAbs).replace(/\\/g, "/"),
      shape: opts.shape || null,
      reason: opts.reason || null,
      bytes,
      lines,
      pid: process.pid,
    };
    appendIndex(rootAbs, entry);

    return { ok: true, archived: destAbs, origin: srcAbs, entry };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/** Append one index entry. Best-effort — appendFileSync of one line is atomic. */
function appendIndex(rootAbs, entry) {
  try {
    const idx = archiveIndexPath(rootAbs);
    fs.mkdirSync(path.dirname(idx), { recursive: true });
    fs.appendFileSync(idx, JSON.stringify(entry) + "\n");
    return true;
  } catch {
    return false; // the index is telemetry — never block an archive on it
  }
}

/** Read + parse the archive index (newest last). NEVER throws — bad lines skipped. */
function readIndex(root) {
  try {
    const rootAbs = path.resolve(root);
    const idx = archiveIndexPath(rootAbs);
    let raw;
    try {
      raw = fs.readFileSync(idx, "utf8");
    } catch {
      return [];
    }
    const out = [];
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      try {
        out.push(JSON.parse(t));
      } catch {
        /* tolerate a torn/partial line — never throw on a bad index line */
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Restore an archived file back to its origin (the restore drill / recovery).
 * NEVER throws. Refuses if origin or archived path escapes root, or if origin
 * already exists (never clobber live state on restore).
 *
 * @param {object} entry  an index entry ({origin, archived} relative to root)
 * @param {object} opts   { root }
 * @returns {{ok:boolean, restored?:string, reason?:string}}
 */
function restore(entry, opts) {
  try {
    opts = opts || {};
    if (!entry || typeof entry !== "object") return { ok: false, reason: "bad-entry" };
    if (!opts.root) return { ok: false, reason: "no-trusted-root" };
    const rootAbs = path.resolve(opts.root);
    const archivedAbs = resolveInsideRoot(rootAbs, path.join(rootAbs, entry.archived || ""));
    const originAbs = resolveInsideRoot(rootAbs, path.join(rootAbs, entry.origin || ""));
    if (!archivedAbs || !originAbs) return { ok: false, reason: "escapes-root" };
    if (!fs.existsSync(archivedAbs)) return { ok: false, reason: "archived-missing" };
    if (fs.existsSync(originAbs)) return { ok: false, reason: "origin-exists" };
    try {
      fs.mkdirSync(path.dirname(originAbs), { recursive: true });
      fs.renameSync(archivedAbs, originAbs);
    } catch (e) {
      if (e && e.code === "EXDEV") {
        try {
          fs.copyFileSync(archivedAbs, originAbs);
          fs.unlinkSync(archivedAbs);
        } catch {
          return { ok: false, reason: "restore-failed" };
        }
      } else {
        return { ok: false, reason: "restore-failed" };
      }
    }
    return { ok: true, restored: originAbs };
  } catch {
    return { ok: false, reason: "error" };
  }
}

// ── Single-writer lock (best-effort, non-blocking) ──────────────────────────
//
// A minimal atomic `wx` lock for serializing the SINGLE-WRITER amendment
// (F-ROT-1 rotation, F-RET-1 non-racy retention host): try to grab it; if a
// FRESH lock is held, the caller no-ops (another process owns the operation).
// A STALE lock (older than staleMs — its owner died mid-op) is reclaimed. This
// NEVER blocks the hot path and NEVER throws. Correctness of rotation does not
// DEPEND on it (unique archive naming already prevents generation loss); the
// lock only prevents redundant concurrent work + satisfies "single-writer".
//
// @returns {(() => void) | null} a release fn, or null when a fresh lock is held.
function tryLock(lockPath, opts) {
  const staleMs = (opts && typeof opts.staleMs === "number") ? opts.staleMs : 60000;
  try {
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  } catch {
    /* dir may already exist */
  }
  const attempt = () => {
    try {
      const fd = fs.openSync(lockPath, "wx"); // atomic exclusive create
      try {
        fs.writeSync(fd, JSON.stringify({ pid: process.pid, ts: Date.now() }) + "\n");
      } finally {
        fs.closeSync(fd);
      }
      return () => {
        try {
          fs.unlinkSync(lockPath);
        } catch {
          /* already gone */
        }
      };
    } catch {
      return undefined; // held (EEXIST) or unwritable
    }
  };
  let release = attempt();
  if (release) return release;
  // Held — reclaim only if stale (owner presumed dead).
  try {
    const st = fs.statSync(lockPath);
    if (Date.now() - st.mtimeMs > staleMs) {
      try {
        fs.unlinkSync(lockPath);
      } catch {
        /* race with another reclaimer */
      }
      release = attempt(); // one retry after reclaim
      if (release) return release;
    }
  } catch {
    /* lock vanished between open and stat — treat as still-held, caller no-ops */
  }
  return null;
}

module.exports = {
  ARCHIVE_SUBDIR,
  INDEX_BASENAME,
  resolveInsideRoot,
  archiveDir,
  archiveIndexPath,
  uniqueArchiveName,
  archive,
  appendIndex,
  readIndex,
  restore,
  tryLock,
};
