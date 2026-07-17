#!/usr/bin/env node
"use strict";

/**
 * rotate.js — write-time log rotation for the hot logging/dispatch paths.
 *
 * WHY ITS OWN LIB (not folded into logger.js): dispatch-record-fields.js is
 * deliberately dependency-light (fs/path only) so requiring it never drags in
 * logger.js's module-init side effects (workspace probing, session-id
 * resolution). rotate.js requires only `fs`/`path` (+ `./paths` for SINK_CAPS
 * and the project root, and `./archive` for the archive tier — both
 * dependency-light) and has NO side effects on require beyond resolving paths.
 *
 * WHAT ROTATION DOES NOW (D-1, operator directive 2026-07-17): an over-cap sink
 * is MOVED into the archive tier (scripts/hooks/lib/archive.js) under a unique,
 * collision-proof name — NOT renamed to a single `.1` generation. This closes
 * two defects at once:
 *   • F-ROT-1 (cross-process race lost a generation): the old `rename → .1`
 *     kept exactly ONE generation; a stale rotator clobbered a fresh `.1`,
 *     losing appends. Unique archive names make generation-loss IMPOSSIBLE by
 *     construction (every rotation is its own generation) — the ≥2-generations
 *     amendment, satisfied structurally rather than by a lock that can go stale.
 *   • D-1 (raw history is never destroyed): the rotated raw log lives on in the
 *     accessible, indexed archive tier — deletion of raw history is off the table.
 * A best-effort single-writer lock (archive.tryLock) additionally serializes
 * concurrent rotations of the same sink so we don't produce redundant tiny
 * generations; rotation correctness does NOT depend on it.
 *
 *   const { rotateIfNeeded, rotateBytesIfNeeded, SINK_CAPS } = require("./rotate");
 *   rotateIfNeeded(LOG_FILE, 20000);            // line-cap JSONL sink
 *   rotateBytesIfNeeded(debugLogPath, 2 << 20);  // byte-cap .log sink
 *
 * Both rotate functions NEVER throw — every fs call is wrapped; any failure
 * (permission error, race, missing dir) degrades to a falsy no-op result so a
 * rotation fault can never crash the calling hook (the logging path is a
 * best-effort contract).
 */

const fs = require("fs");
const path = require("path");

let PATHS = {};
let PROJECT = null;
try {
  ({ PATHS, PROJECT } = require("./paths"));
} catch {
  // paths.js unavailable (bare-bootstrap edge case) — SINK_CAPS just ends up
  // sparse; rotate*IfNeeded still work fine when called with an explicit cap
  // and an explicit opts.root.
  PATHS = {};
  PROJECT = null;
}

let _archive = null;
try {
  _archive = require("./archive");
} catch {
  _archive = null; // archive tier unavailable — rotation degrades to a no-op (never a raw delete)
}

// ── Per-sink retention CLASSES (amendment #2) ───────────────────────────────
// A uniform 20k-line cap treats diagnostics, operational evidence, security
// records, and semantic memory the same. They are not the same. Each sink is
// tagged with a CLASS; the class carries the cap. Adding a sink = pick a class,
// not invent a literal.
const CAP_CLASSES = {
  // Ephemeral debug output — small, byte-oriented, cheap to lose.
  diagnostics: { kind: "bytes", cap: 2 * 1024 * 1024 }, // 2MB — team-guard-debug.log
  // The working operational ledger — events/tools/dispatch. The default JSONL cap.
  operational: { kind: "lines", cap: 20000 },
  // Security/judgment records (β precedent) — keep more history hot before archiving.
  security: { kind: "lines", cap: 50000 },
  // Semantic memory (requirements/plans/code/manager-consult) — richer, keep more.
  semantic: { kind: "lines", cap: 40000 },
};

// Back-compat exports (existing consumers/tests read these literals).
const DEFAULT_JSONL_CAP_LINES = CAP_CLASSES.operational.cap; // 20000
const DEFAULT_LOG_CAP_BYTES = CAP_CLASSES.diagnostics.cap; // 2MB

// MIN_BYTES_PER_LINE is the cheap-stat pre-gate floor. It MUST be a SOUND lower
// bound on the byte size of a file at the line cap, or the pre-gate skips a
// file that is already over cap (F-ROT-2: tiny 3-byte JSONL records under a
// 50-byte/line assumption kept a 20k-line file under the old 50× threshold, so
// rotation never fired). SOUNDNESS PROOF at floor = 1: a file with `cap`
// non-empty (filter(Boolean)) lines needs ≥ cap content bytes (each counted
// line has ≥1 char), so size < cap ⟹ fewer than `cap` lines ⟹ safe to skip.
// Floor 1 is the largest provably-sound value; 2 would wrongly skip a file of
// `cap` single-char lines (2·cap−1 bytes < 2·cap threshold).
const MIN_BYTES_PER_LINE = 1;

// ── SINK_CAPS — single source of truth, keyed by resolved absolute path ──

function j(dir, name) {
  return dir ? path.join(dir, name) : null;
}

const EVENTS_DIR = PATHS.events || null;
const RUNTIME_DIR = PATHS.runtime || null;

const SINK_CAPS = {};

function addSink(absPath, className) {
  if (!absPath) return;
  const cls = CAP_CLASSES[className] ? className : "operational";
  const { kind, cap } = CAP_CLASSES[cls];
  try {
    SINK_CAPS[path.resolve(absPath)] = { kind, cap, class: cls };
  } catch {
    /* malformed path — never register it */
  }
}

// Operational ledger (events + category fan-out + dispatch).
addSink(PATHS.eventsFile || j(EVENTS_DIR, "events.jsonl"), "operational");
addSink(PATHS.toolsFile || j(EVENTS_DIR, "tools.jsonl"), "operational");
addSink(PATHS.dispatchCompletionsFile || j(RUNTIME_DIR, "dispatch-completions.jsonl"), "operational");
// Semantic memory (higher-value, keep more history hot).
addSink(PATHS.requirementsFile || j(EVENTS_DIR, "requirements.jsonl"), "semantic");
addSink(PATHS.requirementsStagedFile || j(EVENTS_DIR, "requirements-staged.jsonl"), "semantic");
addSink(j(EVENTS_DIR, "code.jsonl"), "semantic");
addSink(j(EVENTS_DIR, "plans.jsonl"), "semantic");
addSink(j(EVENTS_DIR, "manager-consult.jsonl"), "semantic");
// Security/judgment precedent (β events) + its sibling per-agent / president-
// wide fan-out targets. logger.js writes ALL of these via the same CATEGORY_FILES
// loop (each guarded by rotateSink). Because rotation is CLOSED over SINK_CAPS
// (F-ROT-4), an UNREGISTERED fan-out target makes rotateSink() a silent no-op —
// the sink then grows unbounded. Registering the whole set is the F-BETA-1 fix
// (betaEvents was registered but its siblings were not). The coverage is
// asserted by log-sink-caps.test.js (every CATEGORY_FILES target is a sink).
addSink(PATHS.betaEvents, "security");
if (PATHS.betaEvents) {
  // WORKSPACE = <...>/president/_system (betaEvents is <WORKSPACE>/beta/events.jsonl).
  const WORKSPACE = path.dirname(path.dirname(PATHS.betaEvents));
  addSink(path.join(WORKSPACE, "events.jsonl"), "operational"); // president-wide aggregate
  addSink(path.join(WORKSPACE, "alpha", "events.jsonl"), "security"); // per-agent judgment
  addSink(path.join(WORKSPACE, "gamma", "events.jsonl"), "security");
}
// team-guard-debug.log — NOT line-oriented JSON, so a byte cap (diagnostics).
addSink(j(RUNTIME_DIR, "team-guard-debug.log"), "diagnostics");

// ── Root + lock plumbing ────────────────────────────────────────────────────

/** The trusted root the archive tier is anchored to (from paths.js#PROJECT). */
function defaultRoot() {
  return PROJECT || process.env.CLAUDE_PROJECT_DIR || null;
}

/** Per-sink single-writer lock path (under runtime/, walk-skipped + gitignored). */
function lockPathFor(file, rootAbs) {
  const base = path.basename(file).replace(/[^A-Za-z0-9._-]/g, "_");
  return path.join(rootAbs, ".claude", "runtime", "rotate-locks", base + ".lock");
}

// ── Core: line-cap rotation ───────────────────────────────────────────────

/**
 * Archive `file` into the archive tier if it is at/over `capLines`. NEVER throws.
 *
 * Cheap stat pre-gate: a single `fs.statSync`. If `size < capLines *
 * MIN_BYTES_PER_LINE` (a SOUND lower bound — see MIN_BYTES_PER_LINE), returns
 * `{rotated:false}` WITHOUT reading the file. Otherwise reads, counts lines,
 * and — if lineCount >= cap (at/over, F-ROT-3) — MOVES the file into the
 * archive tier under a unique name (D-1 + F-ROT-1). The caller recreates the
 * active file on its next append (unchanged contract).
 *
 * @param {string} file
 * @param {number} [capLines] defaults to DEFAULT_JSONL_CAP_LINES
 * @param {object} [opts]
 * @param {number} [opts.capBytes] when set, delegates to rotateBytesIfNeeded
 * @param {string} [opts.root] trusted root for the archive tier (defaults to PROJECT)
 * @param {string} [opts.shape] classification tag recorded in the archive index
 * @returns {{rotated:boolean, reason?:string, archived?:string}}
 */
function rotateIfNeeded(file, capLines, opts) {
  try {
    opts = opts || {};
    if (opts.capBytes) return rotateBytesIfNeeded(file, opts.capBytes, opts);
    if (!file || typeof file !== "string") return { rotated: false, reason: "no-file" };
    const cap = capLines > 0 ? capLines : DEFAULT_JSONL_CAP_LINES;

    let st;
    try {
      st = fs.statSync(file);
    } catch {
      return { rotated: false, reason: "missing" }; // missing / 0-byte-equivalent no-op
    }
    if (!st || st.size === 0) return { rotated: false, reason: "empty" };

    // Cheap pre-gate — SOUND floor, no read yet.
    if (st.size < cap * MIN_BYTES_PER_LINE) {
      return { rotated: false, reason: "below-pregate" };
    }

    // Only now (file could genuinely be large) do we pay for a read.
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      return { rotated: false, reason: "read-error" };
    }
    const lineCount = content.length === 0 ? 0 : content.split("\n").filter(Boolean).length;
    if (lineCount < cap) return { rotated: false, reason: "under-cap" }; // rotate at/over cap

    return archiveFile(file, opts, "rotation:over-cap-lines");
  } catch {
    // Belt-and-suspenders — this function must NEVER throw.
    return { rotated: false, reason: "error" };
  }
}

/**
 * Byte-cap variant for non-line-oriented sinks (team-guard-debug.log). Same
 * archive-move shape; rotates at/over cap (F-ROT-3). NEVER throws.
 *
 * @param {string} file
 * @param {number} [capBytes] defaults to DEFAULT_LOG_CAP_BYTES
 * @param {object} [opts] { root, shape }
 * @returns {{rotated:boolean, reason?:string, archived?:string}}
 */
function rotateBytesIfNeeded(file, capBytes, opts) {
  try {
    opts = opts || {};
    if (!file || typeof file !== "string") return { rotated: false, reason: "no-file" };
    const cap = capBytes > 0 ? capBytes : DEFAULT_LOG_CAP_BYTES;

    let st;
    try {
      st = fs.statSync(file);
    } catch {
      return { rotated: false, reason: "missing" };
    }
    if (!st || st.size === 0) return { rotated: false, reason: "empty" };
    if (st.size < cap) return { rotated: false, reason: "under-cap" }; // rotate at/over cap

    return archiveFile(file, opts, "rotation:over-cap-bytes");
  } catch {
    return { rotated: false, reason: "error" };
  }
}

/**
 * Shared archive-move: acquire the per-sink single-writer lock (best-effort),
 * move `file` into the archive tier, release. NEVER throws. Returns
 * `{rotated:true, archived}` on success, or a falsy `{rotated:false, reason}`.
 */
function archiveFile(file, opts, reason) {
  const root = opts.root || defaultRoot();
  if (!root || !_archive) {
    // No trusted root or no archive tier — REFUSE to rotate rather than fall
    // back to a raw delete/rename (D-1: raw history is never destroyed).
    return { rotated: false, reason: "no-archive-tier" };
  }
  let rootAbs;
  try {
    rootAbs = path.resolve(root);
  } catch {
    return { rotated: false, reason: "bad-root" };
  }

  // Single-writer lock — if another process is already rotating this sink, skip
  // (unique archive naming means no data is lost either way).
  let release = null;
  try {
    release = _archive.tryLock(lockPathFor(file, rootAbs));
  } catch {
    release = null;
  }
  if (release === null) return { rotated: false, reason: "locked" };

  try {
    const sink = SINK_CAPS[path.resolve(file)];
    const res = _archive.archive(file, {
      root: rootAbs,
      reason,
      shape: (sink && sink.class) || opts.shape || null,
    });
    if (res && res.ok) return { rotated: true, reason: "archived", archived: res.archived };
    return { rotated: false, reason: (res && res.reason) || "archive-failed" };
  } finally {
    if (typeof release === "function") release();
  }
}

/** Look up the SINK_CAPS entry for a file by its resolved absolute path (or null). */
function sinkCapFor(file) {
  try {
    return SINK_CAPS[path.resolve(file)] || null;
  } catch {
    return null;
  }
}

/**
 * Rotate `file` using whatever SINK_CAPS says about it (lines or bytes); a
 * no-op (never rotates) if `file` isn't a known sink — rotation is CLOSED over
 * the SINK_CAPS allowlist (F-ROT-4). NEVER throws.
 */
function rotateSink(file, opts) {
  try {
    const entry = sinkCapFor(file);
    if (!entry) return { rotated: false, reason: "unknown-sink" };
    return entry.kind === "bytes"
      ? rotateBytesIfNeeded(file, entry.cap, opts)
      : rotateIfNeeded(file, entry.cap, opts);
  } catch {
    return { rotated: false, reason: "error" };
  }
}

module.exports = {
  SINK_CAPS,
  CAP_CLASSES,
  DEFAULT_JSONL_CAP_LINES,
  DEFAULT_LOG_CAP_BYTES,
  MIN_BYTES_PER_LINE,
  rotateIfNeeded,
  rotateBytesIfNeeded,
  sinkCapFor,
  rotateSink,
};
