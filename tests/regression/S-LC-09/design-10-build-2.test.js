#!/usr/bin/env node
"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// design-10-build-2.test.js — S-LC-09. The scope contract (PLAN §5 Non-Goals):
// design ALL 10 /epic:* skills, BUILD exactly 2 (plan, fold). This asserts:
//   - all 10 .claude/commands/epic/*.md exist,
//   - exactly the 2 built ones (plan, fold) LACK the design-only banner AND have
//     a backing script (scripts/epic/<name>.js),
//   - the other 8 carry the "STATUS: designed — not yet built" banner.
//
// PLANTED VIOLATION (no false-green): a sealed fixture where a design-only skill
// is MISSING its banner MUST fail the audit; a non-existent dir fails closed.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const { harness, sealedDir } = require(path.join(ROOT, "scripts", "checks", "lib", "fixture-harness"));

const h = harness("S-LC-09/design-10-build-2");

const COMMANDS_DIR = path.join(ROOT, ".claude", "commands", "epic");
const SCRIPTS_DIR = path.join(ROOT, "scripts", "epic");

const ALL = ["plan", "start", "status", "fold", "split", "close", "review", "acceptance", "link", "repair"];
const BUILT = ["plan", "fold"];
const BANNER = "STATUS: designed — not yet built";

/**
 * PURE-ish audit (reads the given dirs). Returns { ok, problems[], designed[],
 * built[] }. Fail-closed: a missing skill file is a problem.
 */
function auditEpicSuite({ commandsDir, scriptsDir, all = ALL, built = BUILT }) {
  const problems = [];
  const designed = [];
  const builtFound = [];
  for (const name of all) {
    const f = path.join(commandsDir, `${name}.md`);
    if (!fs.existsSync(f)) {
      problems.push(`missing skill spec: ${name}.md`);
      continue;
    }
    const md = fs.readFileSync(f, "utf8");
    const hasBanner = md.includes(BANNER);
    if (built.includes(name)) {
      builtFound.push(name);
      if (hasBanner) problems.push(`${name}.md is BUILT but carries the design-only banner`);
      if (!fs.existsSync(path.join(scriptsDir, `${name}.js`))) {
        problems.push(`${name} is BUILT but has no backing script scripts/epic/${name}.js`);
      }
    } else {
      designed.push(name);
      if (!hasBanner) problems.push(`${name}.md is design-only but MISSING the "${BANNER}" banner`);
    }
  }
  return { ok: problems.length === 0, problems, designed, built: builtFound };
}

// ── the REAL suite satisfies the contract ─────────────────────────────────────
h.pass("real suite: all 10 skills exist; 2 built (plan,fold) + 8 designed", () => {
  const a = auditEpicSuite({ commandsDir: COMMANDS_DIR, scriptsDir: SCRIPTS_DIR });
  return a.ok && a.built.length === 2 && a.designed.length === 8;
});

h.pass("built skills have backing scripts; design-only skills carry the banner", () => {
  const a = auditEpicSuite({ commandsDir: COMMANDS_DIR, scriptsDir: SCRIPTS_DIR });
  // explicit re-checks beyond the rolled-up ok
  const planBuilt = fs.existsSync(path.join(SCRIPTS_DIR, "plan.js"));
  const foldBuilt = fs.existsSync(path.join(SCRIPTS_DIR, "fold.js"));
  const startBanner = fs.readFileSync(path.join(COMMANDS_DIR, "start.md"), "utf8").includes(BANNER);
  return a.ok && planBuilt && foldBuilt && startBanner;
});

// ── PLANTED VIOLATION: a design-only skill missing its banner must fail ───────
h.violation("a design-only skill missing its banner FAILS the audit (no false-green)", () => {
  const spec = {};
  for (const n of ALL) {
    spec[`commands/${n}.md`] = BUILT.includes(n)
      ? `---\ndescription: built\n---\n# /epic:${n}\n(no banner — built)\n`
      : `---\ndescription: designed\n---\n# /epic:${n}\n> ${BANNER} (E-LIFECYCLE-001 Wave 3)\n`;
  }
  // PLANT: strip the banner from one design-only skill.
  spec["commands/start.md"] = `---\ndescription: designed\n---\n# /epic:start\n(no banner here!)\n`;
  spec["scripts/plan.js"] = "module.exports={};";
  spec["scripts/fold.js"] = "module.exports={};";
  const fx = sealedDir(spec, "epicaudit");
  try {
    return auditEpicSuite({ commandsDir: fx.file("commands"), scriptsDir: fx.file("scripts") });
  } finally {
    fx.cleanup();
  }
});

// ── fail-closed: a non-existent commands dir is all-missing → not ok ──────────
h.failClosed("a non-existent commands dir fails closed (every skill missing)", () => {
  return auditEpicSuite({
    commandsDir: path.join(ROOT, "no", "such", "dir"),
    scriptsDir: path.join(ROOT, "no", "such", "dir"),
  });
});

h.done();
