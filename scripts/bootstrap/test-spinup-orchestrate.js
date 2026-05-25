#!/usr/bin/env node
/* eslint-disable no-console */
"use strict";
/**
 * scripts/bootstrap/test-spinup-orchestrate.js — fixture e2e + unit test for the
 * bootstrap:spinup orchestrator (SP-20260525-023 T7 / T-20260525-242).
 *
 * β Q(c): canonical proves the CHAIN on a fixture — it does NOT stand up a real
 * product. So:
 *   - driver: planPhases (default/--phase/--resume) + phase-state round-trip.
 *   - preflight: pass (runCheck code 0) -> done; refuse (code 1) -> failed.
 *   - CHAIN: intent(brief, fixture) -> canon(generate.js, --research off) -> roadmap,
 *     asserting canon emits 11 valid artifacts and roadmap does not FAIL.
 *   - onscreen.verifyServe: build-clean + HTTP 200 + entry-transforms => pass;
 *     build-clean but HTTP != 200 => pass:false ("it builds" != "it serves").
 *
 * Exit 0 = all pass, 1 = any failure.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const REPO = path.resolve(__dirname, "..", "..");
const FIXTURE = path.join(REPO, "scripts", "canon", "fixtures", "acme-intent.md");
const driver = require("./spinup-orchestrate");
const preflight = require("./phases/preflight");
const intent = require("./phases/intent");
const canon = require("./phases/canon");
const roadmap = require("./phases/roadmap");
const onscreen = require("./phases/onscreen");

let passed = 0;
let failed = 0;
function ok(n) { passed++; process.stdout.write(`  ok    ${n}\n`); }
function fail(n, d) { failed++; process.stdout.write(`  FAIL  ${n}\n`); if (d) process.stdout.write(`        ${d}\n`); }

function mkctx(over) {
  return Object.assign(
    { repoRoot: REPO, product: "Acme", intentFile: null, cloneTarget: null, outDir: "_requirements/00-canonical", research: "off", dryRun: false, args: {}, log: () => {} },
    over,
  );
}

// ---------------------------------------------------------- driver
function testDriver() {
  process.stdout.write("\nUNIT — driver (spinup-orchestrate.js)\n");
  const fresh = { completed: [], phases: {} };
  const all = driver.planPhases({ phase: null, resume: false }, fresh);
  if (JSON.stringify(all.phases) === JSON.stringify(driver.PHASES)) ok("default plans all 5 phases in order");
  else fail("default plan", JSON.stringify(all));

  const single = driver.planPhases({ phase: "canon", resume: false }, fresh);
  if (single.phases[0] === "preflight" && single.phases.includes("canon") && single.phases.length === 2)
    ok("--phase canon runs [preflight, canon] (gate first)");
  else fail("--phase plan", JSON.stringify(single));

  const resumed = driver.planPhases({ phase: null, resume: true }, { completed: ["preflight", "intent", "canon"], phases: {} });
  if (!resumed.phases.includes("intent") && resumed.phases.includes("roadmap") && resumed.phases.includes("onscreen"))
    ok("--resume continues after last completed phase");
  else fail("--resume plan", JSON.stringify(resumed));

  // state round-trip
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "spinup-state-"));
  const args = { state: path.join(tmp, "s.json"), dryRun: false };
  const st = driver.loadState(args);
  st.completed.push("preflight");
  driver.saveState(args, st);
  const re = driver.loadState(args);
  if (re.completed.includes("preflight")) ok("phase-state persists + reloads (--resume durability)");
  else fail("state round-trip", JSON.stringify(re));
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ---------------------------------------------------------- preflight
async function testPreflight() {
  process.stdout.write("\nUNIT — preflight gate\n");
  const passCtx = mkctx({ args: { _runCheck: () => ({ code: 0, stdout: "", stderr: "" }) } });
  const r1 = await preflight.run(passCtx);
  if (r1.ok && r1.status === "done") ok("preflight passes complete install");
  else fail("preflight pass", JSON.stringify(r1));

  const gapCtx = mkctx({ args: { _runCheck: () => ({ code: 1, stdout: "", stderr: "" }) } });
  const r2 = await preflight.run(gapCtx);
  if (!r2.ok && r2.status === "failed") ok("preflight REFUSES gappy install (no proceed)");
  else fail("preflight refuse", JSON.stringify(r2));
}

// ---------------------------------------------------------- chain
async function testChain() {
  process.stdout.write("\nE2E — chain intent -> canon -> roadmap (fixture, --research off)\n");
  if (!fs.existsSync(FIXTURE)) { fail("fixture present", FIXTURE); return; }
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "spinup-chain-"));
  const outRel = path.relative(REPO, out);

  // intent (brief mode, fixture provided)
  const ri = await intent.run(mkctx({ intentFile: FIXTURE }));
  if (ri.ok && ri.status === "done" && ri.data && ri.data.intentFile) ok("intent: accepts provided brief -> intentFile");
  else fail("intent phase", JSON.stringify(ri));

  // canon (reuse generate.js)
  const rc = await canon.run(mkctx({ intentFile: ri.data ? ri.data.intentFile : FIXTURE, outDir: outRel }));
  if (rc.ok && rc.status === "done" && rc.data && Array.isArray(rc.data.artifacts) && rc.data.artifacts.length === 11)
    ok("canon: 11 artifacts emitted + validated (reused generate.js)");
  else fail("canon phase", JSON.stringify(rc));
  const emitted = fs.existsSync(path.join(out, "CORE_BRIEF.md"));
  if (emitted) ok("canon: artifacts present on disk");
  else fail("canon disk", "CORE_BRIEF.md missing in " + out);

  // roadmap (done OR needs_orchestration both acceptable for chain-proof; must NOT fail)
  const rr = await roadmap.run(mkctx({ outDir: outRel }));
  if (rr.status === "done" || rr.status === "needs_orchestration") ok(`roadmap: chain-proof ok (status=${rr.status})`);
  else fail("roadmap phase", JSON.stringify(rr));

  fs.rmSync(out, { recursive: true, force: true });
}

// ---------------------------------------------------------- verify-before-claim
async function testServeGate() {
  process.stdout.write("\nUNIT — onscreen verify-before-claim (builds != serves)\n");
  const okGet = async () => ({ status: 200 });
  const badGet = async () => ({ status: 500 });
  const okRun = () => ({ code: 0, stdout: "", stderr: "" });

  const a = await onscreen.verifyServe({ buildCmd: "build", serveUrl: "http://localhost:1", entryModule: null, cwd: ".", runCmd: okRun, httpGet: okGet });
  if (a.pass) ok("serve gate: build clean + HTTP 200 -> pass");
  else fail("serve pass", JSON.stringify(a));

  const b = await onscreen.verifyServe({ buildCmd: "build", serveUrl: "http://localhost:1", entryModule: null, cwd: ".", runCmd: okRun, httpGet: badGet });
  if (!b.pass) ok("serve gate: build clean but HTTP != 200 -> FAIL (builds != serves)");
  else fail("serve builds-not-serves", JSON.stringify(b));

  // run() is product-side -> needs_orchestration
  const rr = await onscreen.run(mkctx({}));
  if (rr.status === "needs_orchestration") ok("onscreen.run: real execution deferred product-side (needs_orchestration)");
  else fail("onscreen run", JSON.stringify(rr));
}

(async () => {
  testDriver();
  await testPreflight();
  await testChain();
  await testServeGate();
  process.stdout.write(`\nspinup-orchestrate test: ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
})();
