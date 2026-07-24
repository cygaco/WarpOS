#!/usr/bin/env node
"use strict";
/**
 * scripts/enforcement/enforcer-selftest-coverage.js — ED-033 meta-gate.
 *
 * "Every enforcer/gate must ship with a truly-isolated known-answer self-test (sealed fixture +
 * planted-violation case that must fail it)." This is the META-enforcer: it enumerates the actual
 * enforcers under scripts/checks + scripts/enforcement and fails when one lacks a self-test.
 *
 * INCLUSION (what counts as an "enforcer/gate"): a *.js file (NOT a test file, NOT under a lib/
 * subdir) that is CLI-runnable as a gate — it contains `require.main === module`. A helper module
 * with no CLI entry is not a gate and is excluded. This is a checkable, non-fuzzy criterion.
 *
 * TEST-SIBLING CONVENTIONS (both recognized — the house uses both): `<name>.test.js` AND
 * `test-<name>.js` (e.g. sprint-beta-honesty.js is tested by test-sprint-beta-honesty.js).
 * Checking only the dotted form false-flags the dash-convention enforcers (caught by dogfooding).
 *
 * TWO finding classes (hard/soft split, same discipline as the ED-239 sibling):
 *   HARD (gate-able): an enforcer with NO sibling `<name>.test.js` at all — the core ED-033
 *     requirement, near-zero false-positive.
 *   SOFT (report-only advisory): an enforcer whose sibling test carries no detectable
 *     PLANTED-VIOLATION signal (a negative/failing-case assertion). Detecting a genuine
 *     known-answer planted violation is heuristic, so it advises rather than blocks.
 *
 * Report-only by default (findings printed, exit 0); `--enforce` => exit 1 on any HARD finding.
 * Exit: 0 clean / report-only · 1 HARD under --enforce · 2 fail-closed (no dirs / unreadable).
 * Pure evaluate({ items }) is exported for sealed-fixture tests (no disk).
 */

const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..", "..");
const NAME = "enforcer-selftest-coverage";
const ENFORCER_DIRS = [path.join(REPO, "scripts", "checks"), path.join(REPO, "scripts", "enforcement")];

// A file is a CLI GATE if it wires a main entry. (Checked against file text.)
const CLI_MAIN_RE = /require\.main\s*===\s*module/;
// A sibling test carries a PLANTED-VIOLATION signal if it asserts a negative/failing case. Lenient
// (any of these) so a genuinely-good test is never flagged; the point is to catch a happy-path-only test.
// F13 (gpt security r0, MED ReDoS): the old `not.*clean` alternative is O(n^2) on adversarial text with
// many `not` tokens and no `clean` — a large committed test file could stall /scan:full. Bound it to a
// same-line window `not[^\r\n]{0,160}clean` (linear), and cap the inspected text length (below).
const PLANTED_RE = /(planted|->\s*(?:RED|red|fail|FAIL|finding|1\b)|\bRED\b|must fail|findings\.length|hard\.length|\.length,\s*[1-9]|violation|exit(?:Code)?\s*[:=]?\s*1|not[^\r\n]{0,160}clean)/;
// F13: cap the per-test text scanned by PLANTED_RE — defense-in-depth against a hostile large fixture.
const MAX_TEST_SCAN = 256 * 1024;

/**
 * Pure core. items = [{ rel, isEnforcer, hasTest, testText }]. Only isEnforcer items are judged.
 * Returns { hard:[], soft:[], enforcerCount }.
 */
function evaluate({ items }) {
  const hard = [];
  const soft = [];
  let enforcerCount = 0;
  for (const it of items || []) {
    if (!it.isEnforcer) continue;
    enforcerCount++;
    if (!it.hasTest) {
      hard.push({ enforcer: it.rel, reason: `enforcer ${it.rel} has NO sibling self-test (${it.rel.replace(/\.(js|cjs|mjs)$/, ".test.$1")}) — ED-033 requires a sealed known-answer test.` });
      continue;
    }
    if (!PLANTED_RE.test(String(it.testText || "").slice(0, MAX_TEST_SCAN))) {
      soft.push({ enforcer: it.rel, reason: `enforcer ${it.rel} has a sibling test but no detectable PLANTED-VIOLATION (failing-case) assertion — verify it has a known-answer negative case (ED-033).` });
    }
  }
  return { hard, soft, enforcerCount };
}

// ── Filesystem gathering ──────────────────────────────────────────────────────

function gatherItems() {
  const items = [];
  const errors = []; // F11: present-but-unreadable dirs/sources — main() fail-closes (exit 2) on any.
  let dirsSeen = 0;
  for (const dir of ENFORCER_DIRS) {
    let entries;
    try { entries = fs.readdirSync(dir); dirsSeen++; }
    catch (e) { errors.push({ path: dir, error: (e && e.message) || "readdir failed" }); continue; } // F11: a required dir must be readable
    for (const n of entries) {
      if (!/\.(js|cjs|mjs)$/.test(n)) continue;
      if (/\.test\.(js|cjs|mjs)$/.test(n) || /^test-/.test(n)) continue; // the tests themselves (both conventions)
      const full = path.join(dir, n);
      let content;
      try {
        const st = fs.statSync(full);
        if (!st.isFile()) continue;
        content = fs.readFileSync(full, "utf8");
      } catch (e) {
        if (e && e.code === "ENOENT") continue; // vanished between readdir and read (race) — skip
        errors.push({ path: full, error: (e && e.message) || "read failed" }); // F11: present-but-unreadable source = fail-closed
        continue;
      }
      const isEnforcer = CLI_MAIN_RE.test(content);
      const rel = path.relative(REPO, full).replace(/\\/g, "/");
      // F12: read ALL sibling test conventions (<name>.test.js AND test-<name>.js) and concatenate — a
      // planted violation in EITHER sibling counts (was order-dependent: it stopped at the first readable
      // test, so a happy-path dotted test masked a dash-convention planted-violation sibling).
      const testCandidates = [full.replace(/\.(js|cjs|mjs)$/, ".test.$1"), path.join(dir, `test-${n}`)];
      let hasTest = false, testText = "";
      for (const tf of testCandidates) {
        try { testText += (testText ? "\n" : "") + fs.readFileSync(tf, "utf8"); hasTest = true; }
        catch (e) { if (e && e.code !== "ENOENT") errors.push({ path: tf, error: (e && e.message) || "test read failed" }); } // F11: present-but-unreadable test = fail-closed
      }
      items.push({ rel, isEnforcer, hasTest, testText });
    }
  }
  return { items, errors, dirsSeen, dirsRequired: ENFORCER_DIRS.length };
}

function main(argv) {
  const jsonOut = argv.includes("--json");
  const enforce = argv.includes("--enforce");
  const { items, errors, dirsSeen, dirsRequired } = gatherItems();
  // F11 (gpt qa/backend/security r0, HIGH): fail-closed (exit 2) if EITHER required enforcer directory
  // was not readable, OR any present source/test could not be inspected — a green must never rest on an
  // unexamined enforcer (an attacker-controlled permission/read failure could otherwise hide one).
  if (dirsSeen < dirsRequired || errors.length) {
    const all = [...(dirsSeen < dirsRequired ? [{ path: "(required enforcer dir)", error: `${dirsRequired - dirsSeen} of ${dirsRequired} dirs unreadable` }] : []), ...errors];
    if (jsonOut) process.stdout.write(JSON.stringify({ name: NAME, status: "error", reason: "unreadable enforcer dir/source (fail-closed)", errors: all }) + "\n");
    else {
      process.stderr.write(`ERROR [${NAME}] ${all.length} unreadable enforcer dir/source(s) (fail-closed):\n`);
      for (const er of all) process.stderr.write(`     - ${er.path}: ${er.error}\n`);
    }
    return 2;
  }
  const { hard, soft, enforcerCount } = evaluate({ items });
  const blocking = enforce && hard.length > 0;
  const out = { name: NAME, status: blocking ? "red" : "green", enforced: enforce, enforcerCount, hardFindings: hard, softAdvisories: soft };
  if (jsonOut) {
    process.stdout.write(JSON.stringify(out) + "\n");
  } else {
    if (hard.length) {
      process.stderr.write(`${blocking ? "FAIL" : "WARN"} [${NAME}] ${hard.length}/${enforcerCount} enforcer(s) with NO self-test:\n`);
      for (const f of hard) process.stderr.write(`     - ${f.enforcer}\n`);
    }
    if (soft.length) {
      process.stderr.write(`INFO [${NAME}] ${soft.length} enforcer test(s) with no detectable planted-violation case (advisory):\n`);
      for (const f of soft.slice(0, 30)) process.stderr.write(`     - ${f.enforcer}\n`);
      if (soft.length > 30) process.stderr.write(`     … +${soft.length - 30} more\n`);
    }
    if (!hard.length && !soft.length) process.stdout.write(`OK   [${NAME}] all ${enforcerCount} enforcer(s) ship a self-test with a planted-violation case\n`);
  }
  return blocking ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, gatherItems, NAME };
