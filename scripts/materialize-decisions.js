#!/usr/bin/env node
"use strict";

/**
 * materialize-decisions.js
 * Reads spec events from the centralized log and generates _docs/DECISIONS.md
 * (+ STALE-FILES.md). Groups events by change-set, auto-fills "Why" from
 * trigger+source fields.
 *
 * SP-20260718-002 · C2 · AC-7 (β rider #1 / P-034): this file previously owned
 * its own standalone render+write loop. It now routes BOTH outputs through the
 * shared `materialize-core` primitive — the ONE events->deterministic-doc
 * materializer that scripts/state/materialize.js also uses. No standalone
 * render/write loop remains here; the primitive is the only writer.
 */

const fs = require("fs");
const path = require("path");
const { query } = require("./hooks/lib/logger");
const { materialize } = require("./state/materialize-core");

const PROJECT = process.env.CLAUDE_PROJECT_DIR || ".";

function readEvents() {
  // Read spec events from centralized log, map back to legacy shape
  const entries = query({ cat: "spec" });
  return entries.map((e) => ({
    id: e.id,
    ts: e.ts,
    file: e.data?.file || "",
    change: e.data?.change || "",
    direction: e.data?.direction || "unknown",
    group: e.data?.group || e.id,
    trigger: e.data?.trigger || "edit",
    source: e.data?.source || "Edit",
    stale_consumers: e.data?.stale_consumers || [],
    propagated: e.data?.propagated || false,
  }));
}

function inferWhy(evt) {
  const parts = [];
  if (evt.trigger && evt.trigger !== "edit") parts.push(evt.trigger);
  if (evt.source && evt.source !== "Edit" && evt.source !== "Write") {
    parts.push(`source: ${evt.source}`);
  }
  if (evt.direction && evt.direction !== "unknown") {
    parts.push(`${evt.direction} change`);
  }
  if (evt.stale_consumers?.length > 0) {
    parts.push(`→ ${evt.stale_consumers.length} file(s) marked stale`);
  }
  return parts.join(" | ") || "spec edit";
}

function propagationStatus(evt) {
  if (evt.propagated) return "✅";
  if (evt.stale_consumers?.length > 0) return "⏳";
  return "—";
}

// ── reducer: group events by change-set ─────────────────────────────────────
function groupEvents(events) {
  const groups = new Map();
  for (const evt of events) {
    const key = evt.group || evt.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(evt);
  }
  return groups;
}

// ── renderer: DECISIONS.md from grouped model (PURE — no generation time) ────
function renderDecisions(groups) {
  let md = `# Decision Log

Auto-generated from \`.claude/project/events/events.jsonl\` by \`materialize-decisions.js\`.
Grouped by change-set. "Why" auto-filled from event metadata.

| Time | File | Change | Why | Status |
|---|---|---|---|---|
`;

  for (const [, groupEventList] of groups) {
    for (const evt of groupEventList) {
      const time = (evt.ts || "").slice(0, 16);
      const file = evt.file || "";
      const change = (evt.change || "").replace(/\|/g, "\\|");
      const why = inferWhy(evt).replace(/\|/g, "\\|");
      const status = propagationStatus(evt);
      md += `| ${time} | ${file} | ${change} | ${why} | ${status} |\n`;
    }
  }

  return md;
}

// ── SOURCE (I/O boundary): read events + the CURRENT on-disk STALE markers once ──
// BR-3 (gauntlet R1): the stale-marker filesystem reads are I/O and belong in the
// primitive's SOURCE (its I/O boundary: `source: () => snapshot`), NOT in the
// reducer. Reading files inside the reducer made STALE-FILES.md change for the SAME
// events when marker state changed — content-nondeterminism relative to the source.
// Moving the reads here makes the reducer PURE over the returned snapshot, so
// materialize()'s delete->regen->byte-identical guarantee holds for a given source
// snapshot while STALE-FILES.md still reflects the markers as read at source time.
function computeStaleSnapshot(events) {
  const staleSet = new Set();
  for (const evt of events || []) {
    if (evt.stale_consumers) {
      for (const c of evt.stale_consumers) staleSet.add(c);
    }
  }
  const currentlyStale = [];
  for (const file of staleSet) {
    const abs = path.join(PROJECT, file);
    try {
      const content = fs.readFileSync(abs, "utf8");
      if (content.includes("<!-- STALE:")) currentlyStale.push(file);
    } catch {
      // File doesn't exist, skip
    }
  }
  // BR-3 (gauntlet R2): materialize-core treats a NON-ARRAY source() return as an
  // empty/cold source (Array.isArray gate). Returning an object here made the stale
  // reducer/renderer never run → STALE-FILES.md always "No stale files". The source
  // MUST return an ARRAY (the currently-stale file list); the reducer is a passthrough.
  return currentlyStale;
}

// ── reducer: PURE passthrough — the source already produced the currently-stale ──
// list (the filesystem I/O lives in the source, BR-3). Identity over the array.
function computeStale(currentlyStale) {
  return Array.isArray(currentlyStale) ? currentlyStale : [];
}

// ── renderer: STALE-FILES.md from the currently-stale list ──────────────────
function renderStaleFiles(currentlyStale) {
  let md = `# Stale Files

Auto-generated. Files with unresolved \`<!-- STALE: -->\` markers.

`;

  if (!currentlyStale || currentlyStale.length === 0) {
    md += "**No stale files.** All changes propagated.\n";
  } else {
    md += `**${currentlyStale.length} file(s) need review:**\n\n`;
    for (const f of currentlyStale.slice().sort()) {
      md += `- \`${f}\`\n`;
    }
  }

  return md;
}

// ── Main — both outputs routed through the shared primitive ─────────────────
function run() {
  const events = readEvents();
  const source = () => events; // same injected source for both outputs

  const decisions = materialize({
    source,
    reducer: groupEvents,
    renderer: renderDecisions,
    emptyRender: () =>
      "# Decision Log\n\nNo events recorded yet. edit-watcher.js will populate this.\n",
    outPath: path.join("docs", "DECISIONS.md"),
    root: PROJECT,
  });

  const stale = materialize({
    // The stale materialization's SOURCE reads events + the current markers (I/O at
    // the source boundary, BR-3); the reducer above is then a PURE extraction.
    source: () => computeStaleSnapshot(events),
    reducer: computeStale,
    renderer: renderStaleFiles,
    emptyRender: () => renderStaleFiles([]),
    outPath: path.join("docs", ".decisions", "STALE-FILES.md"),
    root: PROJECT,
  });

  return { events, decisions, stale };
}

module.exports = {
  run,
  readEvents,
  groupEvents,
  renderDecisions,
  computeStaleSnapshot,
  computeStale,
  renderStaleFiles,
  inferWhy,
  propagationStatus,
};

if (require.main === module) {
  const { events, decisions, stale } = run();
  const d = decisions.ok ? `${decisions.bytes}b` : `FAIL:${decisions.error}`;
  const s = stale.ok ? `${stale.bytes}b` : `FAIL:${stale.error}`;
  console.log(
    `Materialized ${events.length} events → DECISIONS.md (${d}), STALE-FILES.md (${s})`,
  );
}
