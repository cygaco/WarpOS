#!/usr/bin/env node
"use strict";

/**
 * dispatch-skill.test.js — P5 fixture test for the §13 skill-dispatcher core.
 *
 * Built on scripts/checks/lib/fixture-harness.js so it ships the four P5 guarantees
 * (sealed fixture, known-answer, planted-violation, fail-closed) and the harness
 * meta-enforces that at least one planted-violation assertion runs.
 *
 * Like dispatch-claude.test.js, it reproduces a reap WITHOUT the real `claude` CLI
 * and WITHOUT spend by pointing DISPATCH_SKILL_BIN at a fake node script and
 * isolating the ledger via DISPATCH_LEDGER_DIR.
 *
 * Coverage:
 *   - input-gate REFUSES a metachar skill name (planted violation, pure fn)
 *   - input-gate REFUSES a metachar arg (planted violation)
 *   - dryRun / --probe resolves WITHOUT spawning (no artifact, no ledger record)
 *   - happy path: envelope written to a file + envelope is ≤8 lines + ok:true
 *     BACKED completion record on the canonical ledger
 *   - reap (fast-timeout): death record + ok:false completion + non-zero exit
 *   - zero-byte reap: death record + non-zero exit (the ED-018 signature)
 *   - inline-required skill is REFUSED for subprocess dispatch (fail-closed contract)
 *
 * Run: node scripts/dispatch-skill.test.js   (exit 0 = pass)
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const { harness } = require("./checks/lib/fixture-harness");
const {
  validateInputs,
  resolveExecution,
  buildEnvelope,
  dispatchSkill,
} = require("./dispatch-skill");

const h = harness("dispatch-skill");

const DISPATCH_SKILL = path.join(__dirname, "dispatch-skill.js");

// ── Sealed scratch + fakes ──────────────────────────────────
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "dispatch-skill-test-"));
process.on("exit", () => {
  try {
    fs.rmSync(scratch, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
});

const fakeHappy = path.join(scratch, "fake-happy.js");
fs.writeFileSync(
  fakeHappy,
  'process.stdout.write("Scan complete. PASS\\n12 findings across 4 scanners. 0 errors.\\n");\n',
);
const fakeZero = path.join(scratch, "fake-zero.js");
fs.writeFileSync(fakeZero, "process.exit(0);\n"); // exit 0, no output → silent reap
const fakeTimeout = path.join(scratch, "fake-timeout.js");
fs.writeFileSync(fakeTimeout, "setTimeout(() => process.exit(0), 30000);\n");

// Run the CLI as a subprocess with an isolated ledger + a fake bin (no spend).
function runCli({ skill, args = [], fake, ledgerDir, runsDir, timeoutMs, probe }) {
  fs.mkdirSync(ledgerDir, { recursive: true });
  const env = {
    ...process.env,
    DISPATCH_LEDGER_DIR: ledgerDir,
    DISPATCH_SKILL_RUNS_DIR: runsDir,
    DISPATCH_SKILL_BIN: process.execPath, // node
    DISPATCH_SKILL_BIN_ARGS: JSON.stringify(fake ? [fake] : []),
  };
  if (timeoutMs) env.DISPATCH_SKILL_TIMEOUT_MS = String(timeoutMs);
  // --force-subprocess: most real skills are unverified candidates; force the §13.6
  // smoke path so the dispatcher actually spawns the fake (the unit under test).
  const argv = [DISPATCH_SKILL, skill, ...args, "--force-subprocess"];
  if (probe) argv.push("--probe");
  return spawnSync(process.execPath, argv, { env, encoding: "utf8", timeout: 60000 });
}

function readLedger(ledgerDir, name) {
  const f = path.join(ledgerDir, name);
  if (!fs.existsSync(f)) return [];
  return fs
    .readFileSync(f, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

// ── 1. Input gate refuses a metachar skill name (planted) ───
h.violation("input-gate REFUSES a metachar skill name", () =>
  validateInputs({ skill: "/scan:full; rm -rf /", skillArgs: [] }),
);

// ── 2. Input gate refuses a metachar arg (planted) ──────────
h.violation("input-gate REFUSES a metachar arg", () =>
  validateInputs({ skill: "/scan:full", skillArgs: ["$(whoami)"] }),
);

// ── 3. Clean inputs pass the gate (known-answer) ────────────
h.pass("input-gate PASSES a clean skill + args", () =>
  validateInputs({ skill: "/research:deep", skillArgs: ["topic-A", "--depth=2"] }),
);

// ── 4. inline-required skill is REFUSED for subprocess (fail-closed contract) ──
h.violation("inline-required skill REFUSED for subprocess dispatch", () => {
  // session:handoff is seeded inline-required in the dispatch-contract keystone.
  const r = resolveExecution("/session:handoff", { forceSubprocess: true });
  // resolveExecution returns { ok:false, ... } for inline-required → not a pass.
  return { ok: r.ok };
});

// ── 5. dryRun / --probe resolves WITHOUT spawning ───────────
h.pass("dryRun resolves + plans WITHOUT spawning (no ledger record, no artifact)", () => {
  const ledger = path.join(scratch, "l-probe");
  const runs = path.join(scratch, "runs-probe");
  const res = runCli({
    skill: "/scan:full",
    fake: fakeHappy,
    ledgerDir: ledger,
    runsDir: runs,
    probe: true,
  });
  if (res.status !== 0) throw new Error(`probe should exit 0, got ${res.status} (${res.stderr})`);
  if (!/DRY-RUN/.test(res.stdout)) throw new Error(`probe envelope should say DRY-RUN, got: ${res.stdout}`);
  // No spawn ⇒ no completion record AND no artifact file.
  const comps = readLedger(ledger, "dispatch-completions.jsonl");
  if (comps.length !== 0) throw new Error(`probe must NOT write a completion record, got ${comps.length}`);
  const artifacts = fs.existsSync(runs) ? fs.readdirSync(runs) : [];
  if (artifacts.length !== 0) throw new Error(`probe must NOT write an artifact, got ${JSON.stringify(artifacts)}`);
  return true;
});

// ── 6. Happy path: artifact written + envelope ≤8 lines + ok:true backed record ──
h.pass("happy path → artifact file + ≤8-line envelope + ok:true BACKED completion", () => {
  const ledger = path.join(scratch, "l-happy");
  const runs = path.join(scratch, "runs-happy");
  const res = runCli({ skill: "/scan:full", fake: fakeHappy, ledgerDir: ledger, runsDir: runs });
  if (res.status !== 0) throw new Error(`happy path should exit 0, got ${res.status} (${res.stderr})`);

  // Envelope is ≤8 lines and names the artifact.
  const envLines = res.stdout.trim().split(/\r?\n/);
  if (envLines.length > 8) throw new Error(`envelope must be ≤8 lines, got ${envLines.length}`);
  if (!/artifact:/.test(res.stdout)) throw new Error(`envelope must name the artifact, got: ${res.stdout}`);

  // Artifact file exists and holds the FULL output.
  const artifacts = fs.readdirSync(runs).filter((f) => f.endsWith(".md"));
  if (artifacts.length !== 1) throw new Error(`expected exactly one artifact, got ${JSON.stringify(artifacts)}`);
  const body = fs.readFileSync(path.join(runs, artifacts[0]), "utf8");
  if (!/Scan complete\. PASS/.test(body)) throw new Error(`artifact must hold the full skill output`);

  // ok:true BACKED completion record (dispatch_id + cmdline_checksum), shape tagged.
  const comps = readLedger(ledger, "dispatch-completions.jsonl");
  if (comps.length !== 1 || comps[0].ok !== true) throw new Error(`expected one ok:true completion`);
  const rec = comps[0];
  if (!rec.dispatch_id || !rec.cmdline_checksum) throw new Error(`completion must be BACKED (coverage-gate)`);
  if (rec.shape !== "subprocess-skill" || rec.skill !== "/scan:full") throw new Error(`record fields wrong: ${JSON.stringify(rec)}`);
  if (rec.subprocess_verified !== false) throw new Error(`unverified force-run must record subprocess_verified:false`);
  // No death on the happy path.
  const deaths = readLedger(ledger, "dispatch-deaths.jsonl");
  if (deaths.length !== 0) throw new Error(`expected NO death records on happy path`);
  return true;
});

// ── 7. Reap via fast-timeout → death record + ok:false + non-zero exit (planted) ──
h.violation("timeout reap → exit≠0 + skill_timeout_reap death + ok:false completion", () => {
  const ledger = path.join(scratch, "l-timeout");
  const runs = path.join(scratch, "runs-timeout");
  const res = runCli({
    skill: "/scan:full",
    fake: fakeTimeout,
    ledgerDir: ledger,
    runsDir: runs,
    timeoutMs: 500,
  });
  const deaths = readLedger(ledger, "dispatch-deaths.jsonl");
  const comps = readLedger(ledger, "dispatch-completions.jsonl");
  const ok =
    res.status !== 0 &&
    deaths.some((d) => d.reason === "skill_timeout_reap") &&
    comps.length === 1 &&
    comps[0].ok === false;
  // Return a not-pass shape (ok:false) only when the reap was correctly handled —
  // h.violation asserts the planted reap is NOT treated as a pass.
  return { ok: !ok };
});

// ── 8. Zero-byte reap → death + non-zero exit (ED-018 signature) (planted) ──
h.violation("zero-byte reap → exit≠0 + skill_zero_byte_reap death", () => {
  const ledger = path.join(scratch, "l-zero");
  const runs = path.join(scratch, "runs-zero");
  const res = runCli({ skill: "/scan:full", fake: fakeZero, ledgerDir: ledger, runsDir: runs });
  const deaths = readLedger(ledger, "dispatch-deaths.jsonl");
  const comps = readLedger(ledger, "dispatch-completions.jsonl");
  const handled =
    res.status !== 0 &&
    deaths.some((d) => d.reason === "skill_zero_byte_reap") &&
    comps.length === 1 &&
    comps[0].ok === false;
  return { ok: !handled };
});

// ── 9. buildEnvelope hard-caps at ≤8 lines even on verbose input (known-answer) ──
h.pass("buildEnvelope hard-caps at ≤8 lines on verbose output", () => {
  const env = buildEnvelope({
    skill: "/scan:full",
    ok: true,
    artifactPath: "/tmp/x.md",
    output: "PASS\n".repeat(500) + "findings findings errors errors\n".repeat(500),
    elapsedMs: 1234,
  });
  const lines = env.split(/\r?\n/);
  // Capped correctly ⇒ pass; a leak past 8 lines ⇒ fail.
  return { ok: lines.length <= 8 };
});

// ── 10. dispatchSkill() refuses an unverified subprocess WITHOUT --force (fail-closed) ──
h.failClosed("unverified subprocess WITHOUT --force is refused (no spawn)", () => {
  // /scan:full is a seeded-but-UNVERIFIED subprocess candidate. Without
  // forceSubprocess the fail-closed reader must refuse (exitCode 1, contract_refused)
  // and NOT spawn. We assert it does not return a green/ok result.
  const r = dispatchSkill({ skill: "/scan:full", skillArgs: [], forceSubprocess: false });
  if (r.exitCode === 0) throw new Error("unverified subprocess ran without --force (false-green)");
  return { ok: r.exitCode === 0 }; // ok:false ⇒ correctly refused (fail-closed)
});

h.done();
