#!/usr/bin/env node
"use strict";

/**
 * gate-failclosed-enforcer.js
 *
 * SP-20260829-001 bundle B2. Blocks FORWARD from the committed baseline in
 * scripts/checks/gate-failclosed-baseline.json; never repairs anything
 * backward (see gate-failclosed-registry.json for the per-site disposition
 * table this enforcer reads, never writes).
 *
 * WHAT A "SITE" IS: a `catch` clause on a path a gate's decision depends on,
 * whose handler can reach a permissive-shaped outcome (process.exit(0), or
 * an { ok: true, ... }-shaped return) — exactly what
 * scripts/checks/gate-failclosed-audit.js's analyzeSource() finds. This
 * enforcer's own live-scan sites use THAT module's anchor (the line of the
 * permissive statement). gate-failclosed-registry.json's 13 seeded rows use
 * a DIFFERENT anchor (the catch clause's own opening line) — the two are
 * cross-referenced via each row's `tool_finding_line`, never by string
 * equality of `site_id`. Read gate-failclosed-registry.json's
 * `site_unit_definition` and `tool_correlation_note` before trusting a
 * count that mixes the two.
 *
 * TWO FAILURE MODES (exit non-zero):
 *   1. REGRESSION — a registry row whose `expected_finding` is "absent"
 *      (a site the registry believes was repaired) still shows a
 *      permissive-shaped catch handler at that row's file+line, checked by
 *      an independent bounded-window re-read of that exact site (NOT by
 *      relying on the live full-tree scan, which has a documented nested-
 *      try blind spot — see gate-failclosed-registry.json's
 *      tool_correlation_note — that would silently misreport a still-broken
 *      nested site as "no longer found" = false "fixed").
 *   2. NEW UNTRIAGED ENTRANT — the live full-tree scan (rooted at --root,
 *      default "scripts") finds a site (file:line, detector anchor) that is
 *      NOT a member of the committed baseline set in
 *      gate-failclosed-baseline.json. The baseline is a static, committed
 *      snapshot; this module NEVER writes to it — growing it requires an
 *      explicit, separate, committed edit (self-servability would let the
 *      actor whose code introduced a new fail-open site silence the gate by
 *      re-running it).
 *
 * Sites in the baseline but not yet triaged into the registry are recorded
 * and reported, never blocking — that is the deliberate scope boundary of
 * this bundle: it builds the registry + enforcer skeleton, it does not
 * triage the other ~65 pre-existing sites this same run surfaces (that is
 * later work; see gate-failclosed-audit.js's own findings for the raw list).
 *
 * Node built-ins only. No dependencies.
 */

const fs = require("fs");
const path = require("path");
const { cleanSource, runAudit } = require("./gate-failclosed-audit.js");

const DEFAULT_REGISTRY = path.join(__dirname, "gate-failclosed-registry.json");
const DEFAULT_BASELINE = path.join(__dirname, "gate-failclosed-baseline.json");

function loadJson(p) {
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}

function loadRegistry(registryPath) {
  const data = loadJson(registryPath);
  if (!Array.isArray(data.rows)) {
    throw new Error("registry malformed: .rows is not an array — " + registryPath);
  }
  for (const row of data.rows) {
    if (row.polarity_provenance !== "manual-by-read" && row.polarity_provenance !== "tool-derived") {
      throw new Error(
        "registry row " + row.site_id + " has missing/blended polarity_provenance: " +
          JSON.stringify(row.polarity_provenance),
      );
    }
    if (row.polarity_provenance === "manual-by-read" && !row.decision_semantics_quote) {
      throw new Error(
        "registry row " + row.site_id + " is manual-by-read but carries no decision_semantics_quote",
      );
    }
  }
  return data;
}

function loadBaseline(baselinePath) {
  const data = loadJson(baselinePath);
  if (!Array.isArray(data.site_ids)) {
    throw new Error("baseline malformed: .site_ids is not an array — " + baselinePath);
  }
  return data;
}

// Bounded-window regression check for ONE registry row: re-read the row's
// file from disk (baseDir-resolved), take a small window starting at the
// row's own catch-line, mask string/comment/regex content, and check for a
// permissive marker. This is a deliberately NARROW, targeted check (not a
// full nested-try-aware re-parse) so it still works on the 4 seeded sites
// gate-failclosed-audit.js's own full-tree scan structurally cannot reach
// (see registry's tool_correlation_note). Window length and markers are
// stated here, not hidden: WINDOW_LINES lines starting at row.line.
const WINDOW_LINES = 12;
const PERMISSIVE_EXIT_RE = /process\s*\.\s*exit\s*\(\s*0\s*\)/;
const PERMISSIVE_OK_RE = /\bok\b\s*:\s*true\b/;

function siteStillPermissive(baseDir, row) {
  const fullPath = path.join(baseDir, row.file);
  let content;
  try {
    content = fs.readFileSync(fullPath, "utf8");
  } catch (e) {
    return { checked: false, permissive: null, reason: "file-unreadable: " + (e.code || e.message) };
  }
  const lines = content.split(/\r?\n/);
  const startIdx = Math.max(0, row.line - 1);
  const windowSrc = lines.slice(startIdx, startIdx + WINDOW_LINES).join("\n");
  const clean = cleanSource(windowSrc);
  const permissive = PERMISSIVE_EXIT_RE.test(clean) || PERMISSIVE_OK_RE.test(clean);
  return { checked: true, permissive, reason: null };
}

function checkRegistryRegressions(registryRows, baseDir) {
  const regressed = [];
  const checkedRepaired = [];
  for (const row of registryRows) {
    if (row.expected_finding !== "absent") continue; // only rows claiming "repaired" can regress
    const result = siteStillPermissive(baseDir, row);
    checkedRepaired.push({ site_id: row.site_id, ...result });
    if (result.checked && result.permissive) {
      regressed.push({ site_id: row.site_id, file: row.file, line: row.line, reason: "still permissive-shaped despite expected_finding=absent" });
    }
  }
  return { regressed, checkedRepaired };
}

function checkNewEntrants(root, baselineSiteIdSet) {
  const { report } = runAudit(root);
  const currentSiteIds = report.findings.map(
    (f) => f.file.split(path.sep).join("/") + ":" + f.line,
  );
  const currentSet = new Set(currentSiteIds);
  const newEntrants = currentSiteIds.filter((id) => !baselineSiteIdSet.has(id));
  return { report, currentSet, currentSiteIds, newEntrants };
}

function computeCoverage(registryRows, baseline) {
  const baselineSet = new Set(baseline.site_ids);
  const enforcedDispositions = new Set(["defect", "contested"]);
  const triagedNonEnforcedDispositions = new Set(["not-a-defect", "not-a-gate"]);

  const backedIds = new Set(); // baseline site_ids backed by a registry row (via tool_finding_line)
  const enforcedIds = new Set();
  const triagedNotEnforcedIds = new Set();

  for (const row of registryRows) {
    if (!row.tool_correlated || row.tool_finding_line == null) continue;
    const toolSiteId = row.file + ":" + row.tool_finding_line;
    if (!baselineSet.has(toolSiteId)) continue; // registry claims correlation but baseline disagrees — do not count
    backedIds.add(toolSiteId);
    if (enforcedDispositions.has(row.disposition)) enforcedIds.add(toolSiteId);
    else if (triagedNonEnforcedDispositions.has(row.disposition)) triagedNotEnforcedIds.add(toolSiteId);
  }

  const M = baseline.site_ids.length;
  const N = enforcedIds.size;
  const triagedNotEnforced = triagedNotEnforcedIds.size;
  const K = M - backedIds.size; // untriaged = baseline sites with no registry-backing row at all (enforced or not)
  const uncorrelatedRegistryDefects = registryRows.filter(
    (r) => (r.disposition === "defect" || r.disposition === "contested") && !r.tool_correlated,
  ).length;

  return {
    detector_sha: baseline.detector_sha,
    M,
    N,
    triaged_not_enforced: triagedNotEnforced,
    K,
    uncorrelated_registry_defects: uncorrelatedRegistryDefects,
    phrasing:
      N + " of the " + M + " sites the detector at " + baseline.detector_sha +
      " enumerated are under enforcement, " + K + " untriaged" +
      " (" + triagedNotEnforced + " further baseline site(s) are triaged non-enforced [not-a-defect/not-a-gate]; " +
      uncorrelatedRegistryDefects + " registry defect row(s) have no live-detector counterpart at this sha — " +
      "see gate-failclosed-registry.json's tool_correlation_note).",
  };
}

function runEnforcer({ root, registryPath, baselinePath, baseDir }) {
  root = root || "scripts";
  registryPath = registryPath || DEFAULT_REGISTRY;
  baselinePath = baselinePath || DEFAULT_BASELINE;
  baseDir = baseDir || process.cwd();

  const registry = loadRegistry(registryPath);
  const baseline = loadBaseline(baselinePath);
  const baselineSet = new Set(baseline.site_ids);

  const { report: liveReport, newEntrants } = checkNewEntrants(root, baselineSet);
  const { regressed, checkedRepaired } = checkRegistryRegressions(registry.rows, baseDir);
  const coverage = computeCoverage(registry.rows, baseline);

  const ok = regressed.length === 0 && newEntrants.length === 0;

  const result = {
    status: ok ? "ok" : "blocked",
    exitCode: ok ? 0 : 1,
    coverage,
    regressed,
    checked_repaired_count: checkedRepaired.length,
    new_entrants: newEntrants,
    live_files_scanned: liveReport.files_scanned,
    live_files_unreadable: liveReport.files_unreadable,
    live_detector_sha: liveReport.detector_sha,
    baseline_detector_sha: baseline.detector_sha,
    baseline_site_count: baseline.site_ids.length,
    registry_row_count: registry.rows.length,
  };
  return result;
}

function main() {
  const args = process.argv.slice(2);
  function flag(name, def) {
    const i = args.indexOf(name);
    return i !== -1 && args[i + 1] ? args[i + 1] : def;
  }
  const root = flag("--root", "scripts");
  const registryPath = flag("--registry", DEFAULT_REGISTRY);
  const baselinePath = flag("--baseline", DEFAULT_BASELINE);
  const baseDir = flag("--base-dir", process.cwd());

  const result = runEnforcer({ root, registryPath, baselinePath, baseDir });
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(result.exitCode);
}

if (require.main === module) {
  main();
}

module.exports = {
  loadRegistry,
  loadBaseline,
  siteStillPermissive,
  checkRegistryRegressions,
  checkNewEntrants,
  computeCoverage,
  runEnforcer,
  WINDOW_LINES,
};
