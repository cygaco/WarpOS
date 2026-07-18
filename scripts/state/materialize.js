#!/usr/bin/env node
"use strict";

/**
 * materialize.js — deterministic materialized STATE (SP-20260718-002 · C2 · S-7).
 *
 * Regenerates two small state files from the event log, via the shared
 * materialize-core primitive (AC-7). State is REGENERABLE-from-events, NEVER
 * authoritative — events remain the sole source of truth.
 *
 *   what-running  : in-flight work = unpaired start events
 *                   (sprint-start w/o close, dispatch-start w/o completion,
 *                    open gauntlet rounds).
 *   what-happened : bounded recent digest of decision / close / release events.
 *
 * Source: reads via logger.query (LIVE events only) for cheapness +
 * C3-independence. Known limitation (flagged, not a hard dep): a start whose
 * pair was already folded to the archive tier won't appear in what-running;
 * consume the C3 union reader once it lands. Injectable `source` for fixtures.
 *
 * Output location (S-7): a REGENERABLE runtime dir (`runtime/state/`), NOT a
 * manifest-tracked project dir (which would trip BC-02 honesty-drift). `runtime/`
 * is walk-skipped by the manifest walkers.
 *
 * HARD determinism rule (AC-8): the renderers below are PURE functions of the
 * events — NO Date.now()/new Date()/absolute paths/process.pid/__dirname/
 * process.cwd in their output. Insertion-ordered Map over log-ordered events is
 * deterministic. Enforced by materialize.test.js (delete->regen byte-compare +
 * renderer-source AST grep).
 */

const path = require("path");
const { query } = require("../hooks/lib/logger");
const { materialize } = require("./materialize-core");

const STATE_DIR = path.join("runtime", "state");
const HAPPENED_LIMIT = 50;

// ── Event field accessors (tolerant of the logEvent/log shapes) ─────────────
function actionOf(e) {
  const d = (e && e.data) || {};
  return String(d.action || d.type || (e && e.type) || "").toLowerCase();
}
function targetOf(e) {
  const d = (e && e.data) || {};
  return String(d.target || "");
}

// ── In-flight vocabulary: recognized start/end pairs + their correlation key ──
// Pairing is deterministic (a pure function of event order). Matching is on the
// normalized action string; the key correlates a start with its later end.
const INFLIGHT_KINDS = [
  {
    kind: "sprint",
    start: /^sprint[-:]?start$/,
    end: /^sprint[-:]?(close|complete|end)$/,
    keyOf: (e) => e.sprint_id || targetOf(e) || e.id,
  },
  {
    kind: "dispatch",
    start: /^dispatch[-:]?start$/,
    end: /^(dispatch[-:]?(complete|end)|completion)$/,
    keyOf: (e) =>
      targetOf(e) || (e.data && e.data.meta && e.data.meta.dispatch_id) || e.id,
  },
  {
    kind: "gauntlet-round",
    start: /^gauntlet[-:]?round[-:]?(open|start)$/,
    end: /^gauntlet[-:]?round[-:]?(close|end)$/,
    keyOf: (e) =>
      targetOf(e) ||
      (e.data && e.data.round != null ? `round-${e.data.round}` : "") ||
      e.id,
  },
];

function esc(s) {
  return String(s == null ? "" : s).replace(/\|/g, "\\|");
}

// ── what-running ─────────────────────────────────────────────────────────────
function reduceRunning(events) {
  // Insertion-ordered Map keyed on kind::correlation-key. A start opens an
  // entry; a matching end deletes it. Still-open entries = in-flight, in
  // log order (deterministic).
  const open = new Map();
  for (const e of events) {
    const action = actionOf(e);
    for (const spec of INFLIGHT_KINDS) {
      if (spec.start.test(action)) {
        const key = String(spec.keyOf(e));
        open.set(`${spec.kind}::${key}`, {
          kind: spec.kind,
          key,
          since: e.ts || "",
          id: e.id,
        });
        break;
      }
      if (spec.end.test(action)) {
        const key = String(spec.keyOf(e));
        open.delete(`${spec.kind}::${key}`);
        break;
      }
    }
  }
  return { inflight: Array.from(open.values()) };
}

function renderRunning(model) {
  const rows = (model && model.inflight) || [];
  let md = "# What's Running\n\n";
  md += "In-flight work — start events with no matching completion.\n";
  md += "Regenerated from the event log; events are the source of truth.\n\n";
  if (rows.length === 0) {
    md += "**Nothing in flight.** Every started unit has a matching completion.\n";
    return md;
  }
  md += "| Kind | Key | Since | Event |\n|---|---|---|---|\n";
  for (const r of rows) {
    md += `| ${esc(r.kind)} | ${esc(r.key)} | ${esc(r.since)} | ${esc(r.id)} |\n`;
  }
  return md;
}

function emptyRunning() {
  return "# What's Running\n\nNo events recorded yet. Nothing in flight.\n";
}

// ── what-happened ────────────────────────────────────────────────────────────
function reduceHappened(events) {
  const matched = [];
  for (const e of events) {
    const action = actionOf(e);
    const cat = String((e && e.cat) || "");
    if (cat === "decision" || /(decision|close|release)/.test(action)) {
      matched.push({
        ts: e.ts || "",
        cat,
        action,
        target: targetOf(e),
        id: e.id,
      });
    }
  }
  // Bounded: keep the most recent, in log order (deterministic).
  return { entries: matched.slice(-HAPPENED_LIMIT) };
}

function renderHappened(model) {
  const rows = (model && model.entries) || [];
  let md = "# What Happened\n\n";
  md += "Bounded recent digest of decision / close / release events.\n";
  md += "Regenerated from the event log; events are the source of truth.\n\n";
  if (rows.length === 0) {
    md += "**No recent decision / close / release events.**\n";
    return md;
  }
  md += "| Time | Category | Action | Target | Event |\n|---|---|---|---|---|\n";
  for (const r of rows) {
    md += `| ${esc(r.ts)} | ${esc(r.cat)} | ${esc(r.action)} | ${esc(r.target)} | ${esc(r.id)} |\n`;
  }
  return md;
}

function emptyHappened() {
  return "# What Happened\n\nNo events recorded yet.\n";
}

// ── Entrypoint ───────────────────────────────────────────────────────────────
function run(opts) {
  const o = opts || {};
  const root = o.root || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  // Same source feeds BOTH files (per AC-8 "same injected source"); each
  // reducer filters what it needs. LIVE events only.
  const source = o.source || (() => query({}));

  const running = materialize({
    source,
    reducer: reduceRunning,
    renderer: renderRunning,
    emptyRender: emptyRunning,
    outPath: o.runningPath || path.join(STATE_DIR, "what-running.md"),
    root,
  });

  const happened = materialize({
    source,
    reducer: reduceHappened,
    renderer: renderHappened,
    emptyRender: emptyHappened,
    outPath: o.happenedPath || path.join(STATE_DIR, "what-happened.md"),
    root,
  });

  return { running, happened };
}

module.exports = {
  run,
  reduceRunning,
  renderRunning,
  emptyRunning,
  reduceHappened,
  renderHappened,
  emptyHappened,
  INFLIGHT_KINDS,
};

// CLI
if (require.main === module) {
  const res = run();
  const rok = res.running.ok ? `${res.running.bytes}b` : `FAIL:${res.running.error}`;
  const hok = res.happened.ok ? `${res.happened.bytes}b` : `FAIL:${res.happened.error}`;
  console.log(`Materialized state → what-running (${rok}), what-happened (${hok})`);
}
