#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// mode-lifecycle-registry.test.js — S-LC-01 / S-2..S-4. Covers the registry
// schema, the modeMarker paths key surviving regen, the readers resolving FROM
// the registry, and the fail-closed drift validator (clean pass + planted fail).
//
// The planted fixture is SEALED: a temp registry is written to os.tmpdir() and
// the validator is pointed at it via --registry. The real
// .claude/agents/_org/mode-lifecycle.json is NEVER mutated.
//   AC-2.1 registry-schema-complete   AC-2.2 paths-key-survived-regen
//   AC-3.1 readers-resolve-from-registry
//   AC-4.1 planted-wrong-roster-fails  AC-4.2 clean-tree-passes
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const REGISTRY = path.join(ROOT, ".claude", "agents", "_org", "mode-lifecycle.json");
const VALIDATOR = path.join(ROOT, "scripts", "checks", "mode-lifecycle-registry.js");
const READER = path.join(ROOT, "scripts", "hooks", "lib", "mode-lifecycle.js");
const PATHS_JSON = path.join(ROOT, ".claude", "paths.json");
const TEAM_GUARD = path.join(ROOT, "scripts", "hooks", "team-guard.js");
const SESSION_START = path.join(ROOT, "scripts", "hooks", "session-start.js");

const LIVE_MODES = ["solo", "adhoc", "oneshot", "sprint"];
const REQUIRED_FIELDS = [
  "roster",
  "requires_team",
  "bindings",
  "provider_tier",
  "dispatch_profile_ref",
  "teardown",
];

let pass = 0;
let fail = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}

function runValidator(registryPath, extra = []) {
  const args = ["validate"];
  if (registryPath) args.push("--registry", registryPath);
  args.push(...extra);
  const r = spawnSync("node", [VALIDATOR, ...args], { encoding: "utf8" });
  return { status: r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}

// AC-2.1 — schema complete: every live mode with every required field + types.
ok("registry-schema-complete", () => {
  const doc = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  assert.ok(doc.modes && typeof doc.modes === "object", "has modes map");
  for (const m of LIVE_MODES) {
    const e = doc.modes[m];
    assert.ok(e, `mode ${m} present`);
    for (const f of REQUIRED_FIELDS) {
      assert.ok(f in e, `mode ${m} has field ${f}`);
    }
    assert.ok(Array.isArray(e.roster), `${m}.roster is an array`);
    assert.strictEqual(typeof e.requires_team, "boolean", `${m}.requires_team bool`);
    assert.ok(Array.isArray(e.bindings), `${m}.bindings is an array`);
    assert.strictEqual(typeof e.provider_tier, "string", `${m}.provider_tier str`);
    assert.strictEqual(typeof e.dispatch_profile_ref, "string", `${m}.dispatch_profile_ref str`);
    assert.ok(e.teardown && typeof e.teardown === "object", `${m}.teardown obj`);
  }
});

// AC-2.2 — the modeMarker key survived regeneration into .claude/paths.json.
ok("paths-key-survived-regen", () => {
  const p = JSON.parse(fs.readFileSync(PATHS_JSON, "utf8"));
  assert.strictEqual(
    p.modeMarker,
    ".claude/runtime/mode.json",
    "modeMarker must resolve to .claude/runtime/mode.json after build.js",
  );
});

// AC-3.1 — the readers resolve FROM the registry: the shared reader yields the
// registry rosters, and team-guard.js + session-start.js reference it (no
// hardcoded roster remains as the authoritative source).
ok("readers-resolve-from-registry", () => {
  delete require.cache[require.resolve(READER)];
  const ml = require(READER);
  // roster/faces derive from the registry
  assert.deepStrictEqual(ml.faces("sprint"), ["epsilon", "beta"]);
  assert.deepStrictEqual(ml.faces("adhoc"), ["beta", "gamma"]);
  assert.deepStrictEqual([...ml.allFaces()].sort(), ["beta", "delta", "epsilon", "gamma"]);
  assert.strictEqual(ml.requiresTeam("sprint"), true);
  assert.strictEqual(ml.requiresTeam("solo"), false);
  // the FALLBACK mirror equals the registry rosters (no drift)
  const reg = JSON.parse(fs.readFileSync(REGISTRY, "utf8")).modes;
  for (const m of LIVE_MODES) {
    assert.deepStrictEqual(
      ml.FALLBACK[m].roster.map((s) => s.toLowerCase()),
      reg[m].roster.map((s) => s.toLowerCase()),
      `FALLBACK[${m}].roster mirrors the registry`,
    );
  }
  // the consuming hooks actually reference the shared reader
  const tg = fs.readFileSync(TEAM_GUARD, "utf8");
  const ss = fs.readFileSync(SESSION_START, "utf8");
  assert.ok(/lib\/mode-lifecycle/.test(tg), "team-guard.js references the reader");
  assert.ok(/lib\/mode-lifecycle/.test(ss), "session-start.js references the reader");
  // the old hardcoded FACE_TYPES literal is no longer the authoritative source
  assert.ok(
    !/FACE_TYPES\s*=\s*new Set\(\[\s*"epsilon"/.test(tg),
    "team-guard.js no longer hardcodes FACE_TYPES as the source",
  );
});

// AC-4.2 — clean tree passes.
ok("clean-tree-passes", () => {
  const r = runValidator(); // default registry = the real one
  assert.strictEqual(r.status, 0, `validator must exit 0 on a clean tree\n${r.stdout}${r.stderr}`);
});

// AC-4.1 — planted wrong-roster fixture fails closed (sealed temp registry).
ok("planted-wrong-roster-fails", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mlr-fix-"));
  const fixture = path.join(dir, "mode-lifecycle.json");
  const doc = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  // Plant a wrong roster: sprint without ε (the exact drift the validator guards).
  doc.modes.sprint.roster = ["alpha", "gamma"];
  fs.writeFileSync(fixture, JSON.stringify(doc, null, 2));

  const r = runValidator(fixture);
  assert.notStrictEqual(r.status, 0, "validator must FAIL on a drifted roster");
  assert.ok(/drift/.test(r.stdout), "the failure must name the drift");
  // The real registry is untouched.
  const stillGood = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  assert.deepStrictEqual(stillGood.modes.sprint.roster, ["alpha", "epsilon", "beta"]);
});

// AC-FIX1 — modeEntry() shape-validates a PRESENT registry entry: a present-but-
// malformed entry (roster !array / requires_team !bool) FALLS BACK (fail-open)
// instead of being trusted; a well-formed entry is still returned as-is.
ok("modeEntry-malformed-entry-falls-back", () => {
  delete require.cache[require.resolve(READER)];
  const ml = require(READER);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mlr-fix1-"));
  const bad = path.join(dir, "mode-lifecycle.json");
  const doc = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  // Malform sprint: roster becomes a string, requires_team becomes a string.
  doc.modes.sprint.roster = "alpha,epsilon,beta";
  doc.modes.sprint.requires_team = "yes";
  fs.writeFileSync(bad, JSON.stringify(doc, null, 2));

  // The malformed present entry must NOT be trusted — fall back to FALLBACK.
  assert.deepStrictEqual(
    ml.modeEntry("sprint", bad),
    ml.FALLBACK.sprint,
    "malformed present entry must fall back to FALLBACK (fail-open)",
  );
  assert.deepStrictEqual(
    ml.roster("sprint", bad),
    ml.FALLBACK.sprint.roster,
    "roster() falls back on a malformed entry (no empty roster)",
  );
  assert.strictEqual(
    ml.requiresTeam("sprint", bad),
    ml.FALLBACK.sprint.requires_team,
    "requiresTeam() falls back on a malformed entry (no false negative)",
  );
  // A WELL-FORMED present entry is still returned from the registry as before.
  const realSprint = JSON.parse(fs.readFileSync(REGISTRY, "utf8")).modes.sprint;
  assert.deepStrictEqual(
    ml.modeEntry("sprint", REGISTRY),
    realSprint,
    "a well-formed registry entry is still returned unchanged",
  );
});

// AC-4.3 — fail-CLOSED: a live mode MISSING from the reader FALLBACK is a
// reported problem, not a silent skip (uses the real registry + a planted reader
// whose FALLBACK omits one live mode).
ok("missing-FALLBACK-mode-fails", () => {
  delete require.cache[require.resolve(READER)];
  const realFB = require(READER).FALLBACK;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mlr-fb-"));
  const fixtureReader = path.join(dir, "reader.js");
  const fb = JSON.parse(JSON.stringify(realFB));
  delete fb.sprint; // a live mode absent from the fail-open mirror
  fs.writeFileSync(
    fixtureReader,
    `module.exports = { FALLBACK: ${JSON.stringify(fb)} };\n`,
  );

  const r = runValidator(null, ["--reader", fixtureReader]); // real registry
  assert.notStrictEqual(r.status, 0, "missing FALLBACK mode must FAIL closed");
  assert.ok(
    /MISSING from reader FALLBACK/.test(r.stdout),
    `the failure must name the missing-FALLBACK mode\n${r.stdout}`,
  );
});

// AC-4.4 — fail-CLOSED: a reader that reintroduces a HARDCODED roster literal
// fails EVEN WITH a live import+call present (the pure-string check missed this).
ok("hardcoded-roster-literal-fails", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mlr-lit-"));
  const fixture = path.join(dir, "team-guard.js");
  fs.writeFileSync(
    fixture,
    'const ml = require("./lib/mode-lifecycle");\n' +
      "const live = ml.allFaces();\n" +
      'const FACE_TYPES = new Set(["alpha", "epsilon", "beta"]);\n',
  );
  const r = runValidator(null, ["--team-guard", fixture]);
  assert.notStrictEqual(r.status, 0, "a reintroduced roster literal must FAIL");
  assert.ok(
    /HARDCODED roster literal/.test(r.stdout),
    `the failure must name the hardcoded literal\n${r.stdout}`,
  );
});

// AC-4.5 — fail-CLOSED: a DEAD (commented-out) import + a hardcoded literal — the
// exact scenario the old pure-string match let slip — fails closed.
ok("dead-import-with-literal-fails", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mlr-dead-"));
  const fixture = path.join(dir, "session-start.js");
  fs.writeFileSync(
    fixture,
    '// const ml = require("./lib/mode-lifecycle").faces(curMode); // dead import\n' +
      'const FACE_TYPES = ["alpha", "epsilon", "beta"];\n',
  );
  const r = runValidator(null, ["--session-start", fixture]);
  assert.notStrictEqual(r.status, 0, "dead import + literal must FAIL closed");
  assert.ok(
    /does not DERIVE its roster|HARDCODED roster literal/.test(r.stdout),
    `the failure must name the drift\n${r.stdout}`,
  );
});

// AC-4.6 — fail-CLOSED: a reconstructed mode→roster MAP literal is caught even
// under a non-listed const name (name-agnostic map detector), with a live import.
ok("mode-roster-map-literal-fails", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mlr-map-"));
  const fixture = path.join(dir, "team-guard.js");
  fs.writeFileSync(
    fixture,
    'const ml = require("./lib/mode-lifecycle");\n' +
      "const live = ml.faces('sprint');\n" +
      'const myRosters = { sprint: ["alpha", "epsilon", "beta"], adhoc: ["beta", "gamma"] };\n',
  );
  const r = runValidator(null, ["--team-guard", fixture]);
  assert.notStrictEqual(r.status, 0, "a mode→roster map literal must FAIL");
  assert.ok(
    /HARDCODED roster literal/.test(r.stdout),
    `the failure must name the hardcoded map\n${r.stdout}`,
  );
});

console.log(`\nmode-lifecycle-registry: ${pass}/${pass + fail} pass`);
process.exit(fail ? 1 : 0);
