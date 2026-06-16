#!/usr/bin/env node
"use strict";
/**
 * scripts/checks/tracker-reality-drift.js — ED-056 enforcer (MVP).
 *
 * Detects the "stale-claimed-done" tracker-drift class that recurred 5x on 2026-06-16
 * (the consumer-contract gate, repo-role resolver, BC-16, dispatch-readiness preflight,
 * E-GOLDEN-FLOW DoD#4 were all CLAIMED "open / Missing But Required / build it" while
 * actually built+working — I nearly re-built a certified keystone). Source: the
 * `verify-don't-inherit-stale-trackers` memory + CLAUDE.md § Policy & Enforcement Hygiene.
 *
 * THE CHECK: in an epic tracker's CURRENT-STATE region (everything BEFORE the first
 * `## Session log` / `## Change log` heading — those sections are append-only HISTORY,
 * correctly past-tense), a line that CLAIMS an artifact is missing/unbuilt AND names a
 * concrete artifact (a `scripts/…*.js` path, or a backtick'd file path) that ACTUALLY
 * EXISTS on disk is a drift finding — the tracker lags reality.
 *
 * Deliberately TIGHT (the claim->artifact mapping is fuzzy; better precise than noisy):
 *   - Only the high-signal "claimed-missing-but-exists" class. It does NOT run the named
 *     scripts (the "claimed-green-but-RED" inverse needs execution — a later ramp).
 *   - SKIPS the §10 state-vocabulary LEGEND lines (a line enumerating many states, e.g.
 *     both "Verified Exists" and "Missing But Required", is a legend, not a claim).
 *   - SKIPS the history sections (Session log / Change log) — a dated past "next action:
 *     build X" is a correct historical record, not a current claim.
 *
 * Exit: 0 = no drift (report-only default: findings printed, exit still 0); 1 = drift
 * found under --enforce; 2 = the scan's OWN error (no epics dir / unreadable file) —
 * FAIL-CLOSED, a broken scan must never report "0 drift" (P-053 loud-fail / BC-16).
 */

const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..", "..");
const EPICS_DIR = path.join(REPO, "trackers", "epics");

// The §10 verification-state vocabulary legend — an enumeration, not a claim.
const LEGEND =
  /(Verified Exists[^\n]*Verified Nonexistent|Allowed states|§10 states|states:\s*`?Verified)/i;
// Concrete artifact references on a line.
const SCRIPT_RE = /(scripts\/[A-Za-z0-9_.\/-]+\.(?:js|cjs|mjs))/g;
const BACKTICK_PATH_RE = /`([A-Za-z0-9_][A-Za-z0-9_.\/-]*\.(?:js|cjs|mjs|json))`/g;

function existsRel(rel) {
  try {
    return fs.existsSync(path.join(REPO, rel));
  } catch {
    return false;
  }
}

// Return the index of the first history heading (Session log / Change log); lines at or
// after it are append-only history and are NOT scanned for current-state claims.
function historyStart(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,3}\s+(Session log|Change log)\b/i.test(lines[i])) return i;
  }
  return lines.length;
}

function scanFile(file, txt) {
  const findings = [];
  const lines = txt.split(/\r?\n/);
  const end = historyStart(lines);
  for (let i = 0; i < end; i++) {
    const line = lines[i];
    // HIGH-CONFIDENCE pattern ONLY (precise > noisy): a verification-log TABLE ROW whose
    // State cell is EXACTLY "Missing But Required" while a sibling cell names an artifact
    // that EXISTS. Line-level prose matching was tried + removed — it false-positived on a
    // single line carrying TWO claims ("X SHIPPED ... Y not yet built", naming scripts for
    // both): the "not yet built" got mis-associated with the existing (shipped) script.
    // A structured table row pins the claim to its own cell, so the association is exact.
    if (!/^\s*\|/.test(line)) continue; // table rows only
    if (LEGEND.test(line)) continue; // the §10 state-vocabulary legend row
    const cells = line.split("|").map((c) => c.trim());
    // "Missing But Required" must be a STANDALONE cell value (the State column), not prose.
    if (!cells.some((c) => /^missing but required$/i.test(c))) continue;
    const paths = new Set();
    let m;
    SCRIPT_RE.lastIndex = 0;
    while ((m = SCRIPT_RE.exec(line))) paths.add(m[1]);
    BACKTICK_PATH_RE.lastIndex = 0;
    while ((m = BACKTICK_PATH_RE.exec(line))) paths.add(m[1]);
    for (const p of paths) {
      if (existsRel(p)) {
        findings.push({ file, line: i + 1, artifact: p, snippet: line.trim().slice(0, 130) });
      }
    }
  }
  return findings;
}

function scan(opts) {
  const o = opts || {};
  const dir = o.epicsDir || EPICS_DIR;
  let files;
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch (e) {
    return { error: `cannot read epics dir ${dir}: ${e.message}` };
  }
  const findings = [];
  for (const f of files) {
    let txt;
    try {
      txt = fs.readFileSync(path.join(dir, f), "utf8");
    } catch (e) {
      return { error: `cannot read ${f}: ${e.message}` };
    }
    findings.push(...scanFile(f, txt));
  }
  return { findings, fileCount: files.length };
}

if (require.main === module) {
  const enforce = process.argv.includes("--enforce");
  let r;
  try {
    r = scan();
  } catch (e) {
    process.stderr.write(`[tracker-reality-drift] internal error (fail-closed): ${e && e.message}\n`);
    process.exit(2);
  }
  if (r.error) {
    process.stderr.write(`[tracker-reality-drift] FAIL-CLOSED: ${r.error}\n`);
    process.exit(2);
  }
  const n = r.findings.length;
  if (n === 0) {
    process.stdout.write(
      `OK   [tracker-reality-drift] ${r.fileCount} epic tracker(s); 0 stale-claimed-missing findings (no current-state line claims missing/unbuilt while naming an artifact that exists)\n`,
    );
    process.exit(0);
  }
  process.stdout.write(
    `${enforce ? "FAIL" : "WARN"} [tracker-reality-drift] ${n} current-state line(s) CLAIM missing/unbuilt but NAME an artifact that EXISTS on disk (stale-claimed-done — verify-don't-inherit, ED-056):\n`,
  );
  for (const f of r.findings.slice(0, 40)) {
    process.stdout.write(`  ${f.file}:${f.line} — names ${f.artifact} (EXISTS) — "${f.snippet}"\n`);
  }
  if (n > 40) process.stdout.write(`  … and ${n - 40} more\n`);
  process.stdout.write(
    `Fix: reconcile the tracker line to reality (the artifact exists), or — if genuinely a different/unbuilt artifact — rename the reference. ${enforce ? "" : "(report-only — pass --enforce to block)"}\n`,
  );
  process.exit(enforce && n > 0 ? 1 : 0);
}

module.exports = { scan, scanFile, historyStart };
