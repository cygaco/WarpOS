#!/usr/bin/env node
"use strict";

/**
 * scripts/checks/mode-write-coverage.js — out-of-band mode.json write detector
 * (SP-20260611-002 WS-G1 / R-2 AC-2.2/2.3).
 *
 * THE GAP: mode.json's canonical single-writer is scripts/mode-set.js (which now
 * EMITS the mode lifecycle events per write — AC-2.1). The PreToolUse mode-guard
 * only observes `/mode:*` Skill/SlashCommand invocations. A DIRECT out-of-band
 * write to mode.json (a planted file, a hand-edit, any path that bypasses
 * mode-set.js entirely) leaves the file's mode changed with NO matching lifecycle
 * event in the log — and was previously invisible.
 *
 * THE DETECTOR: the current mode.json state (mode + mtime) is corroborated against
 * the mode-lifecycle event trail. A SANCTIONED change leaves a `mode:switch:after`
 * (or `mode:switch:requested`) lifecycle event whose `target_mode` === the file's
 * mode and whose timestamp is within --window-minutes of the file's mtime. An
 * out-of-band write leaves no such corroborating event → a LOUD finding (red).
 *
 *   AC-2.2  out-of-band write (mode changed, NO matching lifecycle event) → RED.
 *   AC-2.3  sanctioned mode-set.js change (matching event emitted) → NOT flagged.
 *
 * POSTURE: report-only-CAPABLE. The detector exits non-zero on a violation so it
 * is PROVEN enforce-capable in a test harness (AC-X.4), but production wiring can
 * run it report-only (pass --report-only to force exit 0 while still printing the
 * finding) — no report-only→blocking flip is executed by this sprint.
 *
 * FAIL-CLOSED on a lying input: an unreadable events log WITH a present mode.json
 * that changed cannot be corroborated → red (a gate must not green on a missing
 * audit trail). An ABSENT mode.json (greenfield / never set) is "nothing to check"
 * (green) — absent ≠ tampered.
 *
 * Usage:
 *   node scripts/checks/mode-write-coverage.js
 *       [--mode-file <path>] [--events <path>] [--window-minutes <N>]
 *       [--now <ISO>] [--report-only] [--json]
 *
 * The pure evaluate() is exported for deterministic fixture tests.
 */

const fs = require("fs");
const path = require("path");

const START = Date.now();
const NAME = "mode-write-coverage";

// Resolve from this script's own location so the check validates the tree it
// lives in — correct in a worktree (uncommitted edits) and when shipped.
const ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_MODE_FILE = path.join(ROOT, ".claude", "runtime", "mode.json");
const DEFAULT_EVENTS = path.join(ROOT, ".claude", "project", "events", "events.jsonl");
const DEFAULT_WINDOW_MINUTES = 120; // generous: clock skew + emit-after-write latency

// The lifecycle events that corroborate a sanctioned mode write (emitted by
// mode-set.js / mode-lifecycle-guard via lib/lifecycle-events). Either of these,
// carrying the matching target_mode within the window, proves a sanctioned write.
const CORROBORATING_EVENTS = new Set([
  "mode:switch:after",
  "mode:switch:requested",
]);

function arg(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return null;
  return process.argv[i + 1] || null;
}

const JSON_OUT = process.argv.includes("--json");
const REPORT_ONLY = process.argv.includes("--report-only");

// ── Pure core ──────────────────────────────────────────────────────────────

/**
 * Pure evaluation — no filesystem I/O.
 *
 * @param {object} opts
 * @param {?{mode:string, mtimeMs:number}} opts.modeState
 *   The current mode.json state (mode + mtime), or null if mode.json is ABSENT.
 * @param {?boolean} opts.modeUnreadable
 *   True when mode.json is PRESENT but unparseable (fail-closed signal).
 * @param {?Array<object>} opts.lifecycleEvents
 *   Parsed mode-lifecycle event records, or null if the events log is unreadable.
 * @param {number} opts.windowMs   Corroboration window (mtime ± windowMs).
 * @param {number} opts.nowMs      Reference "now" (for deterministic tests).
 * @returns {{ ok:boolean, finding:?object, corroboratingEvent:?object }}
 */
function evaluate({ modeState, modeUnreadable, lifecycleEvents, windowMs, nowMs }) {
  // PRESENT-but-unreadable mode.json — fail-closed (cannot verify it wasn't
  // tampered). Absent is handled below as "nothing to check".
  if (modeUnreadable) {
    return {
      ok: false,
      finding: {
        type: "mode-json-unreadable",
        reason:
          "mode.json is present but unparseable — cannot corroborate it against " +
          "the lifecycle event trail (fail-closed)",
      },
      corroboratingEvent: null,
    };
  }

  // ABSENT mode.json — greenfield / mode never set. Absent ≠ tampered.
  if (!modeState) {
    return { ok: true, finding: null, corroboratingEvent: null };
  }

  // Events log unreadable but mode.json is present → cannot corroborate a change.
  // Fail-closed: a gate must not green on a missing audit trail.
  if (lifecycleEvents === null) {
    return {
      ok: false,
      finding: {
        type: "events-log-unreadable",
        mode: modeState.mode,
        reason:
          "the events log is unreadable but mode.json is present — cannot " +
          "corroborate the current mode against any lifecycle event (fail-closed)",
      },
      corroboratingEvent: null,
    };
  }

  const wantMode = String(modeState.mode || "").toLowerCase();
  const mtimeMs = modeState.mtimeMs;

  // Find a corroborating lifecycle event: a CORROBORATING_EVENTS record whose
  // payload.target_mode === the file's mode AND whose timestamp is within the
  // window of the file's mtime (the sanctioned write emitted it ~at write time).
  let corroborating = null;
  for (const ev of lifecycleEvents) {
    if (!ev || ev.event == null) continue;
    if (!CORROBORATING_EVENTS.has(ev.event)) continue;
    const target = String((ev.payload && ev.payload.target_mode) || "").toLowerCase();
    if (target !== wantMode) continue;
    const evMs = ev.tsMs;
    if (typeof evMs !== "number" || isNaN(evMs)) continue;
    if (Math.abs(evMs - mtimeMs) <= windowMs) {
      corroborating = ev;
      break;
    }
  }

  if (corroborating) {
    // AC-2.3: a sanctioned single-writer change is corroborated → NOT flagged.
    return { ok: true, finding: null, corroboratingEvent: corroborating };
  }

  // AC-2.2: mode.json's current mode has NO matching lifecycle event within the
  // window → an out-of-band write (it bypassed mode-set.js). LOUD finding.
  return {
    ok: false,
    finding: {
      type: "out-of-band-mode-write",
      mode: wantMode,
      mtimeMs,
      ageMinutes: Math.round((nowMs - mtimeMs) / 60000),
      reason:
        `mode.json is "${wantMode}" but NO mode-switch lifecycle event corroborates ` +
        `it within ${Math.round(windowMs / 60000)}m of the file mtime — an out-of-band ` +
        `write that bypassed scripts/mode-set.js (the single-writer chokepoint)`,
    },
    corroboratingEvent: null,
  };
}

// ── Filesystem helpers ────────────────────────────────────────────────────

/** Read mode.json → { modeState, modeUnreadable }. Absent → both null/false. */
function readModeState(modeFile) {
  let stat;
  try {
    stat = fs.statSync(modeFile);
  } catch {
    return { modeState: null, modeUnreadable: false }; // absent — nothing to check
  }
  try {
    const doc = JSON.parse(fs.readFileSync(modeFile, "utf8"));
    const mode = typeof doc.mode === "string" ? doc.mode : null;
    if (!mode) return { modeState: null, modeUnreadable: true }; // present but no mode
    return { modeState: { mode, mtimeMs: stat.mtimeMs }, modeUnreadable: false };
  } catch {
    return { modeState: null, modeUnreadable: true }; // present but unparseable
  }
}

/**
 * Read + parse the lifecycle event records from the events log. Returns an array
 * of { event, payload, tsMs } for `lifecycle-event` records, or null if the log
 * is unreadable/missing (the fail-closed signal).
 */
function readLifecycleEvents(eventsFile) {
  let raw;
  try {
    raw = fs.readFileSync(eventsFile, "utf8");
  } catch {
    return null; // unreadable / missing — fail-closed signal upstream
  }
  const out = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Fast pre-filter before JSON.parse (these records are sparse in a big log).
    if (!trimmed.includes("lifecycle-event")) continue;
    let rec;
    try {
      rec = JSON.parse(trimmed);
    } catch {
      continue; // malformed line — skip (a partial log is still usable)
    }
    const data = rec && rec.data;
    if (!data || data.kind !== "lifecycle-event" || typeof data.event !== "string") continue;
    const tsMs = Date.parse(rec.ts);
    out.push({
      event: data.event,
      payload: data.payload || {},
      tsMs: isNaN(tsMs) ? null : tsMs,
    });
  }
  return out;
}

// ── Output ────────────────────────────────────────────────────────────────

function emit(result, modeFile, eventsFile, reportOnly) {
  const out = {
    name: NAME,
    status: result.ok ? "green" : "red",
    report_only: reportOnly,
    modeFile,
    eventsFile,
    finding: result.finding,
    corroboratingEvent: result.corroboratingEvent
      ? { event: result.corroboratingEvent.event }
      : null,
    durationMs: Date.now() - START,
  };
  if (JSON_OUT) {
    console.log(JSON.stringify(out));
  } else if (result.ok) {
    console.log(
      `OK   [${NAME}] mode.json corroborated by a lifecycle event (or nothing to check)`,
    );
  } else {
    const head = reportOnly ? `WARN [${NAME}] (report-only)` : `FAIL [${NAME}]`;
    console.error(`${head} ${result.finding.type}: ${result.finding.reason}`);
  }
  // AC-X.4: enforce-capable (exit 1 on violation) but report-only forces exit 0
  // so production can run it without a blocking flip this sprint.
  process.exit(result.ok || reportOnly ? 0 : 1);
}

// ── CLI entrypoint ────────────────────────────────────────────────────────

if (require.main === module) {
  const nowArg = arg("--now");
  const nowMs = nowArg ? Date.parse(nowArg) : Date.now();
  if (nowArg && isNaN(nowMs)) {
    process.stderr.write(`[${NAME}] invalid --now value: ${nowArg}\n`);
    process.exit(2);
  }
  const windowMinutes =
    parseInt(arg("--window-minutes") || String(DEFAULT_WINDOW_MINUTES), 10) ||
    DEFAULT_WINDOW_MINUTES;
  const windowMs = windowMinutes * 60 * 1000;

  const modeFile = path.resolve(arg("--mode-file") || DEFAULT_MODE_FILE);
  const eventsFile = path.resolve(arg("--events") || DEFAULT_EVENTS);

  const { modeState, modeUnreadable } = readModeState(modeFile);
  const lifecycleEvents = readLifecycleEvents(eventsFile);

  const result = evaluate({
    modeState,
    modeUnreadable,
    lifecycleEvents,
    windowMs,
    nowMs,
  });

  emit(result, modeFile, eventsFile, REPORT_ONLY);
}

module.exports = { evaluate, readModeState, readLifecycleEvents };
