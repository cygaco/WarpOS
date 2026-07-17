#!/usr/bin/env node
"use strict";

/**
 * rotate.js — write-time log rotation for the hot logging/dispatch paths.
 *
 * WHY ITS OWN LIB (not folded into logger.js): dispatch-record-fields.js is
 * deliberately dependency-light (fs/path only) so requiring it never drags in
 * logger.js's module-init side effects (workspace probing, session-id
 * resolution). rotate.js requires only `fs`/`path` (+ `./paths` for the
 * SINK_CAPS path table) and has NO side effects on require beyond resolving
 * paths — safe for any caller, hot or cold.
 *
 * SINK_CAPS is the single source of truth for every known sink's cap, keyed
 * by the sink's RESOLVED ABSOLUTE PATH. `scripts/checks/log-sink-caps.js`
 * imports the SAME map so the rotation trigger and the drift enforcer can
 * never disagree about what "too big" means.
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
try {
  ({ PATHS } = require("./paths"));
} catch {
  // paths.js unavailable (bare-bootstrap edge case) — SINK_CAPS just ends up
  // sparse; rotate*IfNeeded still work fine when called with an explicit cap.
  PATHS = {};
}

// ── Tunables ────────────────────────────────────────────────────────────
const DEFAULT_JSONL_CAP_LINES = 20000;
const DEFAULT_LOG_CAP_BYTES = 2 * 1024 * 1024; // 2MB — team-guard-debug.log

// MIN_BYTES_PER_LINE is a conservative FLOOR for the cheap stat pre-gate.
// Real event lines average ~330 bytes; 50B/line is well below that, so the
// pre-gate can NEVER skip a file that is already genuinely over its line cap
// (capLines * 50 is always <= the real byte size of capLines real lines).
const MIN_BYTES_PER_LINE = 50;

// ── SINK_CAPS — single source of truth, keyed by resolved absolute path ──

function j(dir, name) {
  return dir ? path.join(dir, name) : null;
}

const EVENTS_DIR = PATHS.events || null;
const RUNTIME_DIR = PATHS.runtime || null;

const SINK_CAPS = {};

function addSink(absPath, kind, cap) {
  if (!absPath) return;
  try {
    SINK_CAPS[path.resolve(absPath)] = { kind, cap };
  } catch {
    /* malformed path — never register it */
  }
}

// Default JSONL sink = 20000 lines.
addSink(PATHS.eventsFile || j(EVENTS_DIR, "events.jsonl"), "lines", DEFAULT_JSONL_CAP_LINES);
// High-volume category fan-out (logger.js CATEGORY_FILES).
addSink(PATHS.toolsFile || j(EVENTS_DIR, "tools.jsonl"), "lines", DEFAULT_JSONL_CAP_LINES);
addSink(PATHS.requirementsFile || j(EVENTS_DIR, "requirements.jsonl"), "lines", DEFAULT_JSONL_CAP_LINES);
addSink(PATHS.requirementsStagedFile || j(EVENTS_DIR, "requirements-staged.jsonl"), "lines", DEFAULT_JSONL_CAP_LINES);
addSink(j(EVENTS_DIR, "code.jsonl"), "lines", DEFAULT_JSONL_CAP_LINES);
addSink(j(EVENTS_DIR, "plans.jsonl"), "lines", DEFAULT_JSONL_CAP_LINES);
addSink(j(EVENTS_DIR, "manager-consult.jsonl"), "lines", DEFAULT_JSONL_CAP_LINES);
// Dispatch ledger.
addSink(PATHS.dispatchCompletionsFile || j(RUNTIME_DIR, "dispatch-completions.jsonl"), "lines", DEFAULT_JSONL_CAP_LINES);
// Beta consult precedent sink (rotation only — CONTENT/order is otherwise
// leave-alone; rotation renames the whole file, never reorders/edits lines).
addSink(PATHS.betaEvents, "lines", DEFAULT_JSONL_CAP_LINES);
// team-guard-debug.log — NOT line-oriented JSON, so a byte cap.
addSink(j(RUNTIME_DIR, "team-guard-debug.log"), "bytes", DEFAULT_LOG_CAP_BYTES);

// ── Core: line-cap rotation ───────────────────────────────────────────────

/**
 * Rotate `file` to `file + ".1"` (overwriting any prior `.1` — exactly one
 * generation kept) if it is at/over `capLines`. NEVER throws.
 *
 * Cheap stat pre-gate: a single `fs.statSync` cost. If `size < capLines *
 * MIN_BYTES_PER_LINE`, returns `{rotated:false}` WITHOUT ever reading the
 * file — the hot logging path stays a single syscall until the file is
 * genuinely large.
 *
 * @param {string} file
 * @param {number} [capLines] defaults to DEFAULT_JSONL_CAP_LINES
 * @param {object} [opts]
 * @param {number} [opts.capBytes] when set, delegates to rotateBytesIfNeeded
 * @returns {{rotated:boolean, reason?:string}}
 */
function rotateIfNeeded(file, capLines, opts) {
  try {
    opts = opts || {};
    if (opts.capBytes) return rotateBytesIfNeeded(file, opts.capBytes);
    if (!file || typeof file !== "string") return { rotated: false, reason: "no-file" };
    const cap = capLines > 0 ? capLines : DEFAULT_JSONL_CAP_LINES;

    let st;
    try {
      st = fs.statSync(file);
    } catch {
      return { rotated: false, reason: "missing" }; // missing / 0-byte-equivalent no-op
    }
    if (!st || st.size === 0) return { rotated: false, reason: "empty" };

    // Cheap pre-gate — no read yet.
    if (st.size < cap * MIN_BYTES_PER_LINE) {
      return { rotated: false, reason: "below-pregate" };
    }

    // Only now (file is genuinely large) do we pay for a read.
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      return { rotated: false, reason: "read-error" };
    }
    const lineCount = content.length === 0 ? 0 : content.split("\n").filter(Boolean).length;
    if (lineCount <= cap) return { rotated: false, reason: "under-cap" };

    try {
      fs.renameSync(file, file + ".1");
    } catch {
      return { rotated: false, reason: "rename-error" };
    }
    return { rotated: true, reason: "rotated" };
  } catch {
    // Belt-and-suspenders — this function must NEVER throw.
    return { rotated: false, reason: "error" };
  }
}

/**
 * Byte-cap variant for non-line-oriented sinks (team-guard-debug.log). Same
 * rename-to-`.1` shape; NEVER throws.
 *
 * @param {string} file
 * @param {number} [capBytes] defaults to DEFAULT_LOG_CAP_BYTES
 * @returns {{rotated:boolean, reason?:string}}
 */
function rotateBytesIfNeeded(file, capBytes) {
  try {
    if (!file || typeof file !== "string") return { rotated: false, reason: "no-file" };
    const cap = capBytes > 0 ? capBytes : DEFAULT_LOG_CAP_BYTES;

    let st;
    try {
      st = fs.statSync(file);
    } catch {
      return { rotated: false, reason: "missing" };
    }
    if (!st || st.size === 0) return { rotated: false, reason: "empty" };
    if (st.size <= cap) return { rotated: false, reason: "under-cap" };

    try {
      fs.renameSync(file, file + ".1");
    } catch {
      return { rotated: false, reason: "rename-error" };
    }
    return { rotated: true, reason: "rotated" };
  } catch {
    return { rotated: false, reason: "error" };
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
 * no-op (never rotates) if `file` isn't a known sink. NEVER throws.
 */
function rotateSink(file) {
  try {
    const entry = sinkCapFor(file);
    if (!entry) return { rotated: false, reason: "unknown-sink" };
    return entry.kind === "bytes"
      ? rotateBytesIfNeeded(file, entry.cap)
      : rotateIfNeeded(file, entry.cap);
  } catch {
    return { rotated: false, reason: "error" };
  }
}

module.exports = {
  SINK_CAPS,
  DEFAULT_JSONL_CAP_LINES,
  DEFAULT_LOG_CAP_BYTES,
  MIN_BYTES_PER_LINE,
  rotateIfNeeded,
  rotateBytesIfNeeded,
  sinkCapFor,
  rotateSink,
};
