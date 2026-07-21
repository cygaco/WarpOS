#!/usr/bin/env node
/**
 * scripts/warpos/test-gate-wiring.js
 *
 * GATE-A wiring test (SP-20260721-001 D-4 INC-2 — verified_by "gate-wiring
 * test"). Proves the release-gates.js wiring itself, cheaply (no real installs):
 *
 *   1. `fresh_scaffold_all_ways` is IN the GATES array AND actually RUNS
 *      (not silently excluded the way the orphaned test-install-matrix.js
 *      was before this build).
 *   2. `install_matrix` is IN the GATES array AND actually RUNS.
 *   3. The two retired cosmetic gates (`fresh_install_fixture`,
 *      `customized_install_fixture`) are GONE — not present, not skipped,
 *      just absent.
 *   4. `update_fixture_from_previous` is STILL present (R5: it is upgrade
 *      domain, not fresh-scaffold — must NOT be retired on adjacency).
 *
 * "Actually runs" is verified by observing each gate's OWN severity is never
 * "skipped" when NOT explicitly passed via --skip (i.e. the gate function
 * itself was invoked, whatever verdict it returned) — the wiring test does
 * not re-verify the engines' own correctness (test-scaffold-all-ways.js
 * --self-test and test-install-matrix.js already do that); it verifies the
 * release-gates.js GATES array composition and invocation, cheaply and fast.
 *
 * To keep this FAST (a wiring test should not itself run 3 real installs +
 * a 7-scenario matrix), it monkeypatches `require("child_process").spawnSync`
 * so `runScript()` inside release-gates.js never actually shells out — it
 * returns a canned {status:0, stdout:'{"ok":true, ...}'} for the two gates
 * under test, so the ONLY thing under test is whether the gate function is
 * reachable in the GATES array and gets invoked as part of run().
 *
 * Exit 0 = wiring intact. Exit 1 = a wiring regression.
 */
"use strict";

const path = require("path");
const cp = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const RELEASE_GATES_PATH = path.join(REPO_ROOT, "scripts", "warpos", "release-gates.js");

let pass = 0;
let fail = 0;
function ok(name, cond, detail) {
  if (cond) {
    process.stdout.write(`  ok  ${name}\n`);
    pass++;
  } else {
    process.stderr.write(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}\n`);
    fail++;
  }
}

// ── Monkeypatch spawnSync so the two heavy gates under test return instantly ──
// Every OTHER gate is skipped explicitly, so their spawnSync calls never fire
// in practice — this patch is a defensive belt-and-suspenders so a wiring
// test can never accidentally shell out to a real install.
const realSpawnSync = cp.spawnSync;
const CANNED = {
  "test-scaffold-all-ways.js": {
    status: 0,
    stdout: JSON.stringify({
      ok: true,
      incomplete: false,
      ps_available: true,
      legs: [
        { leg: 1, name: "portfolio_new", ran: true, ok: true, asserts: [] },
        { leg: 2, name: "manual_warp_setup", ran: true, ok: true, asserts: [] },
        { leg: 3, name: "shipped_install_ps1", ran: true, ok: true, asserts: [] },
      ],
      sandbox_isolation: { no_delta: true, onlyBefore: [], onlyAfter: [] },
    }),
    stderr: "",
  },
  "test-install-matrix.js": {
    status: 0,
    stdout: JSON.stringify({
      ok: true,
      scenarios: [{ id: "1", name: "clean_install", status: "pass", assertions: [] }],
      totals: { pass: 1, fail: 0 },
    }),
    stderr: "",
  },
};
cp.spawnSync = function patchedSpawnSync(cmd, args, opts) {
  const scriptArg = (args || []).find((a) => typeof a === "string" && (a.includes("test-scaffold-all-ways.js") || a.includes("test-install-matrix.js")));
  if (scriptArg) {
    const key = scriptArg.includes("test-scaffold-all-ways.js") ? "test-scaffold-all-ways.js" : "test-install-matrix.js";
    return CANNED[key];
  }
  return realSpawnSync.apply(this, arguments);
};

delete require.cache[RELEASE_GATES_PATH];
const { run } = require(RELEASE_GATES_PATH);

// Skip every OTHER gate so this test stays fast and hermetic — only the two
// gates under test + hook_registration/reference_integrity/update_fixture_from_previous
// (cheap, presence-only) are left unskipped by the explicit include-list below.
const KNOWN_HEAVY_OR_UNRELATED = [
  "path_coherence",
  "framework_manifest",
  "ship_coverage",
  "version_coherence",
  "hook_fixture_tests",
  "runtime_leak_scan",
  "version_consistency",
  "production_baseline",
  "contract_versioning",
  "pattern_library",
  "path_usage",
  "regression_seed",
  "sealed_capsule_contract",
];

const summary = run({ skip: KNOWN_HEAVY_OR_UNRELATED });
const byName = new Map(summary.results.map((r) => [r.name, r]));

// ── 1+2: present AND actually invoked (severity !== "skipped") ──
for (const name of ["fresh_scaffold_all_ways", "install_matrix"]) {
  const r = byName.get(name);
  ok(`${name} is present in GATES`, !!r, `not found in results: ${[...byName.keys()].join(", ")}`);
  ok(`${name} actually RAN (severity !== "skipped")`, !!r && r.severity !== "skipped", r && `severity=${r.severity}`);
  ok(`${name} ran GREEN against the canned success payload (wiring reaches the real gate logic)`, !!r && r.severity === "green", r && `severity=${r.severity} message=${r.message}`);
}

// ── 3: the two retired gates are GONE ──
for (const name of ["fresh_install_fixture", "customized_install_fixture"]) {
  ok(`${name} is RETIRED (absent from GATES entirely)`, !byName.has(name), `still present with severity=${byName.get(name) && byName.get(name).severity}`);
}

// ── 4: update_fixture_from_previous STILL present (not retired on adjacency) ──
{
  // Not in the skip list above, so it actually ran against the real fixture.
  const r = byName.get("update_fixture_from_previous");
  ok("update_fixture_from_previous is STILL present (R5 — upgrade domain, not retired)", !!r, "missing from GATES");
}

cp.spawnSync = realSpawnSync;

process.stdout.write(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);
