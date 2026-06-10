#!/usr/bin/env node
"use strict";

// scan:mode-lifecycle-hooks-coverage — coverage of the VIRTUAL mode-lifecycle
// EVENT registry (.claude/agents/_org/mode-lifecycle-hooks.json, paths.modeLifecycleHooks).
// E-LIFECYCLE-001 / S-LC-02. The SIBLING of scan:sprint-hook-coverage, mirroring its
// structure: a REVERSE structural check + a FORWARD coverage check.
//
// REVERSE (static, registry-only): the registry is structurally coherent — it parses,
//   every row has event/when/mode/payload_fields, mode ∈ {block,advisory}, harness_fires
//   is the literal false (these are VIRTUAL events — the harness fires NONE of them), and
//   no event id is duplicated. A parse error / unreadable / structurally-broken registry
//   is FAIL-CLOSED (exit 2) — a broken registry must never silently report "0 gaps".
//
// FORWARD: every declared (harness_fires:false) event must have an EMITTER —
//   a `lifecycle-events.emit("<event>")` reference in the codebase AND/OR a real
//   `lifecycle-event` record in paths.eventsFile. (We do NOT look for a harness
//   PreToolUse/PostToolUse record — these events are virtual.) An event with no emitter
//   that is listed in the wiring-pending allowlist (mode-lifecycle-hooks-coverage.allowlist.json)
//   is reported as INFO (its emit-site is a documented future sprint — S-LC-03/04), not a
//   gap — the RAMP seam. An event that is NEITHER emitted NOR pending is a coverage GAP.
//
// REPORT-ONLY (P-053 loud-fail exit contract):
//   clean (0 gaps)            -> exit 0
//   gap-only (default)        -> exit 0  (print the gap list; do NOT block this sprint)
//   gap + --enforce           -> exit 1  (ramp tail; what the planted-gap test asserts)
//   parse / unreadable / broken registry -> exit 2  (FAIL LOUD — never a false-green)
//
// Usage:
//   node scripts/checks/mode-lifecycle-hooks-coverage.js [--enforce] [--json]
//        [--registry <path>] [--allowlist <path>] [--events <path>]
//   (--registry/--allowlist/--events override inputs; used ONLY by the sealed
//    planted-fixture tests — defaults are the real tree.)

const fs = require("fs");
const path = require("path");
const { PATHS } = require("../hooks/lib/paths");

const ROOT = path.resolve(__dirname, "..", "..");

const DEFAULT_REGISTRY =
  PATHS.modeLifecycleHooks
    ? path.join(ROOT, PATHS.modeLifecycleHooks)
    : path.join(ROOT, ".claude", "agents", "_org", "mode-lifecycle-hooks.json");
const DEFAULT_ALLOWLIST = path.join(__dirname, "mode-lifecycle-hooks-coverage.allowlist.json");

const VALID_MODES = ["block", "advisory"];

// ── CLI flags ───────────────────────────────────────────────────────────────
const ENFORCE = process.argv.includes("--enforce");
const JSON_OUT = process.argv.includes("--json");
function flagVal(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : dflt;
}

// ── Registry IO ───────────────────────────────────────────────────────────────
function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, "")); // strip BOM
}

/**
 * REVERSE: validate the registry's structural coherence. Pure.
 * @returns {{ ok:boolean, errors:string[] }}
 */
function validateRegistry(registry) {
  const errors = [];
  if (!registry || typeof registry !== "object") {
    return { ok: false, errors: ["registry is not an object"] };
  }
  if (!Array.isArray(registry.events)) {
    return { ok: false, errors: ["registry.events missing or not an array"] };
  }
  if (registry.events.length === 0) {
    errors.push("registry.events is empty");
  }
  const seen = new Set();
  registry.events.forEach((row, i) => {
    const at = `events[${i}] (${row && row.event})`;
    if (!row || typeof row !== "object") {
      errors.push(`${at}: not an object`);
      return;
    }
    if (!row.event || typeof row.event !== "string") errors.push(`${at}: missing/invalid 'event'`);
    if (!row.when || typeof row.when !== "string") errors.push(`${at}: missing/invalid 'when'`);
    if (!VALID_MODES.includes(row.mode)) errors.push(`${at}: mode '${row.mode}' not one of ${VALID_MODES.join("|")}`);
    if (!Array.isArray(row.payload_fields)) errors.push(`${at}: 'payload_fields' must be an array`);
    // VIRTUAL invariant: the harness fires none of these — harness_fires is the literal false.
    if (row.harness_fires !== false) errors.push(`${at}: 'harness_fires' must be the literal false (virtual event)`);
    if (typeof row.event === "string") {
      if (seen.has(row.event)) errors.push(`${at}: duplicate event id '${row.event}'`);
      seen.add(row.event);
    }
  });
  return { ok: errors.length === 0, errors };
}

// ── FORWARD: emitter discovery ─────────────────────────────────────────────────

// Scan the codebase for static `emit("<event>")` references in files that import
// the lifecycle-events module. Excludes the logger itself (its JSDoc carries an
// example call), this enforcer, and test files — so a doc example / a test is not
// mistaken for a real wired emitter.
const SCAN_ROOTS = ["scripts", ".claude"];
const SCAN_SKIP_DIRS = new Set(["node_modules", ".git", ".worktrees", "releases"]);
const EMIT_RE = /\bemit\(\s*["']([^"']+)["']/g;
const SELF_BASENAMES = new Set([
  "lifecycle-events.js", // the logger (defines emit + a JSDoc example)
  "mode-lifecycle-hooks-coverage.js", // this enforcer
]);
function isExcludedFromEmitScan(file) {
  const base = path.basename(file);
  if (SELF_BASENAMES.has(base)) return true;
  if (/\.test\.js$/.test(base) || /^test-/.test(base)) return true;
  return false;
}

function* walkJs(dir) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SCAN_SKIP_DIRS.has(e.name) || e.name.startsWith(".worktrees")) continue;
      yield* walkJs(full);
    } else if (e.isFile() && e.name.endsWith(".js")) {
      yield full;
    }
  }
}

/** Set of event ids referenced by a static `emit("…")` in lifecycle-events consumers. */
function findStaticEmitters(root = ROOT) {
  const emitted = new Set();
  for (const sub of SCAN_ROOTS) {
    const dir = path.join(root, sub);
    for (const file of walkJs(dir)) {
      if (isExcludedFromEmitScan(file)) continue;
      let text;
      try {
        text = fs.readFileSync(file, "utf8");
      } catch {
        continue;
      }
      if (!text.includes("lifecycle-events")) continue; // scope: only consumers
      let m;
      EMIT_RE.lastIndex = 0;
      while ((m = EMIT_RE.exec(text))) emitted.add(m[1]);
    }
  }
  return emitted;
}

/** Set of event ids that have a runtime `lifecycle-event` record in the events file. */
function findRuntimeEmitters(eventsPath) {
  const emitted = new Set();
  if (!eventsPath || !fs.existsSync(eventsPath)) return emitted;
  let raw;
  try {
    raw = fs.readFileSync(eventsPath, "utf8");
  } catch {
    return emitted;
  }
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || !line.includes("lifecycle-event")) continue;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      continue;
    }
    const d = rec && rec.data;
    if (d && d.kind === "lifecycle-event" && typeof d.event === "string") emitted.add(d.event);
  }
  return emitted;
}

/**
 * Core coverage compute. Pure given its inputs.
 * @param {object} registry     the parsed registry
 * @param {Set<string>} emitted the union of static + runtime emitters
 * @param {Set<string>} pending the wiring-pending allowlist event set
 * @returns {{ covered:string[], pending:string[], gaps:string[], total:number }}
 */
function computeCoverage(registry, emitted, pending) {
  const covered = [];
  const pend = [];
  const gaps = [];
  for (const row of (registry.events || [])) {
    const ev = row && row.event;
    if (!ev) continue;
    if (emitted.has(ev)) covered.push(ev);
    else if (pending.has(ev)) pend.push(ev);
    else gaps.push(ev);
  }
  return { covered, pending: pend, gaps, total: (registry.events || []).length };
}

// ── CLI ─────────────────────────────────────────────────────────────────────
function main() {
  const registryPath = flagVal("--registry", DEFAULT_REGISTRY);
  const allowlistPath = flagVal("--allowlist", DEFAULT_ALLOWLIST);
  const eventsPath = flagVal("--events", process.env.WARPOS_EVENTS_FILE || PATHS.eventsFile);

  // Load + validate the registry — FAIL-CLOSED (exit 2) on unreadable/parse/broken.
  let registry;
  try {
    registry = readJson(registryPath);
  } catch (e) {
    process.stderr.write(`ERROR [mode-lifecycle-hooks-coverage] registry unreadable/unparseable (${registryPath}): ${e.message}\n`);
    return 2;
  }
  const rev = validateRegistry(registry);
  if (!rev.ok) {
    process.stderr.write(
      `FAIL [mode-lifecycle-hooks-coverage] registry structurally incoherent (${rev.errors.length}):\n` +
        rev.errors.map((e) => "  - " + e).join("\n") + "\n",
    );
    return 2;
  }

  // Wiring-pending allowlist (a missing/broken allowlist is non-fatal — treat as empty,
  // which only makes the check STRICTER, never a false-green).
  let pending = new Set();
  try {
    const al = readJson(allowlistPath);
    if (al && al.wiring_pending && typeof al.wiring_pending === "object") {
      pending = new Set(Object.keys(al.wiring_pending));
    }
  } catch {
    /* no allowlist -> stricter, not a false-green */
  }

  // FORWARD: emitters = static refs ∪ runtime records.
  const emitted = new Set([...findStaticEmitters(ROOT), ...findRuntimeEmitters(eventsPath)]);
  const res = computeCoverage(registry, emitted, pending);

  const ok = res.gaps.length === 0;
  if (JSON_OUT) {
    console.log(JSON.stringify({
      ok,
      total: res.total,
      covered: res.covered.length,
      pending: res.pending.length,
      gaps: res.gaps,
      enforce: ENFORCE,
    }));
  } else if (ok) {
    console.log(
      `OK   [mode-lifecycle-hooks-coverage] ${res.total} virtual event(s); ` +
        `${res.covered.length} emitted, ${res.pending.length} wiring-pending (info), 0 gaps`,
    );
  } else {
    const sink = ENFORCE ? process.stderr : process.stdout;
    sink.write(
      `${ENFORCE ? "FAIL" : "WARN"} [mode-lifecycle-hooks-coverage] ${res.gaps.length} ` +
        `event(s) declared with NO emitter and NOT wiring-pending` +
        `${ENFORCE ? "" : " (REPORT-ONLY — not blocking this sprint)"}:\n`,
    );
    for (const g of res.gaps.slice(0, 25)) sink.write(`  - ${g}\n`);
    if (res.gaps.length > 25) sink.write(`  ... and ${res.gaps.length - 25} more\n`);
  }

  // REPORT-ONLY: gaps exit 0 unless --enforce. Parse/unreadable already returned 2 above.
  if (ok) return 0;
  return ENFORCE ? 1 : 0;
}

if (require.main === module) process.exit(main());

module.exports = {
  validateRegistry,
  computeCoverage,
  findStaticEmitters,
  findRuntimeEmitters,
  readJson,
  DEFAULT_REGISTRY,
  DEFAULT_ALLOWLIST,
};
