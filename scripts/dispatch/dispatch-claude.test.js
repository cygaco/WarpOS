#!/usr/bin/env node
/**
 * dispatch-claude.test.js — torture test for the RI-004 / ED-018 reap fix.
 *
 * Deterministically reproduces a builder reap WITHOUT requiring the real
 * `claude` CLI, by pointing DISPATCH_CLAUDE_BIN at a fake node script and
 * isolating the ledger to a temp dir via DISPATCH_LEDGER_DIR.
 *
 * Fixtures:
 *   1. timeout reap   — fake sleeps past the bound → killed → death record + exit≠0
 *   2. zero-byte reap — fake exits 0 with NO stdout (the ED-018 signature) → death + exit≠0
 *   3. happy path     — fake prints output → ok:true completion, NO death, exit 0
 *                       AND gauntlet-verify({roles:["builder"]}) greens on the record
 *   4. worktree guard — happy run with --worktree <tmp>: records land in the
 *                       canonical/test ledger, NEVER in the worktree (ED-016 class)
 *
 * Run: node scripts/dispatch/dispatch-claude.test.js
 * Exit 0 = all pass; 1 = any failure.
 */

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const { verifyGauntlet } = require("./gauntlet-verify");

const DISPATCH_CLAUDE = path.join(__dirname, "..", "dispatch-claude.js");
const REPO_ROOT = path.resolve(__dirname, "..", ".."); // == the wrapper's AGENT_ROOT

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL ${name}\n       ${e && e.message ? e.message : e}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

// ── Scratch dir + fixtures ──────────────────────────────────
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "dispatch-claude-test-"));
function cleanup() {
  try {
    fs.rmSync(scratch, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
}
process.on("exit", cleanup);

// Fake claude bins (node scripts; ignore their argv, act out a scenario).
const fakeTimeout = path.join(scratch, "fake-timeout.js");
fs.writeFileSync(fakeTimeout, "setTimeout(() => process.exit(0), 30000);\n");
const fakeZero = path.join(scratch, "fake-zero.js");
fs.writeFileSync(fakeZero, "process.exit(0);\n"); // exits clean, emits nothing
const fakeHappy = path.join(scratch, "fake-happy.js");
fs.writeFileSync(
  fakeHappy,
  'process.stdout.write(JSON.stringify({ agent: "builder", ok: true, findings: [] }));\n',
);
const fakeWhitespace = path.join(scratch, "fake-ws.js");
fs.writeFileSync(fakeWhitespace, 'process.stdout.write("   \\n  \\t\\n");\n'); // exit 0, only whitespace

const promptFile = path.join(scratch, "prompt.txt");
fs.writeFileSync(promptFile, "Build the thing per spec.\n");

// Run the wrapper as a subprocess with an isolated ledger + fake bin.
// iso: "w" (default, forwards -w) | "worktree:<path>" | "none" (no isolation flag)
function runWrapper({ fake, ledgerDir, extraArgs = [], timeoutMs, iso = "w" }) {
  fs.mkdirSync(ledgerDir, { recursive: true });
  const env = {
    ...process.env,
    DISPATCH_LEDGER_DIR: ledgerDir,
    DISPATCH_CLAUDE_BIN: process.execPath, // node
    DISPATCH_CLAUDE_BIN_ARGS: JSON.stringify([fake]),
  };
  if (timeoutMs) env.DISPATCH_BUILDER_TIMEOUT_MS = String(timeoutMs);
  const isoArgs =
    iso === "w" ? ["-w"] : iso.startsWith("worktree:") ? ["--worktree", iso.slice(9)] : [];
  const res = spawnSync(
    process.execPath,
    [DISPATCH_CLAUDE, "builder", promptFile, "--model", "sonnet", ...isoArgs, ...extraArgs],
    { env, encoding: "utf8", timeout: 60000 },
  );
  return res;
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

// ── 1. Timeout reap ─────────────────────────────────────────
test("timeout reap → exit≠0 + builder_timeout_reap death + ok:false completion", () => {
  const ledger = path.join(scratch, "l1");
  const res = runWrapper({ fake: fakeTimeout, ledgerDir: ledger, timeoutMs: 500 });
  assert(res.status !== 0, `expected non-zero exit, got ${res.status}`);
  const deaths = readLedger(ledger, "dispatch-deaths.jsonl");
  assert(
    deaths.some((d) => d.reason === "builder_timeout_reap" && d.role === "builder"),
    `expected a builder_timeout_reap death record, got ${JSON.stringify(deaths)}`,
  );
  const comps = readLedger(ledger, "dispatch-completions.jsonl");
  assert(comps.length === 1 && comps[0].ok === false, "expected one ok:false completion record");
});

// ── 2. Zero-byte reap ───────────────────────────────────────
test("zero-byte reap → exit≠0 + builder_zero_byte_reap death (even on exit 0)", () => {
  const ledger = path.join(scratch, "l2");
  const res = runWrapper({ fake: fakeZero, ledgerDir: ledger });
  assert(res.status !== 0, `expected non-zero exit, got ${res.status}`);
  const deaths = readLedger(ledger, "dispatch-deaths.jsonl");
  assert(
    deaths.some((d) => d.reason === "builder_zero_byte_reap"),
    `expected a builder_zero_byte_reap death record, got ${JSON.stringify(deaths)}`,
  );
  const comps = readLedger(ledger, "dispatch-completions.jsonl");
  assert(comps.length === 1 && comps[0].ok === false, "expected one ok:false completion record");
});

// ── 3. Happy path + gauntlet-verify greens ──────────────────
test("happy path → exit 0 + ok:true well-formed completion + NO death", () => {
  const ledger = path.join(scratch, "l3");
  const res = runWrapper({ fake: fakeHappy, ledgerDir: ledger });
  assert(res.status === 0, `expected exit 0, got ${res.status} (stderr: ${res.stderr})`);
  const deaths = readLedger(ledger, "dispatch-deaths.jsonl");
  assert(deaths.length === 0, `expected NO death records, got ${JSON.stringify(deaths)}`);
  const comps = readLedger(ledger, "dispatch-completions.jsonl");
  assert(comps.length === 1 && comps[0].ok === true, "expected one ok:true completion record");
  assert(comps[0].provider === "claude" && comps[0].role === "builder", "record fields wrong");

  // End-to-end: gauntlet-verify must GREEN on the builder record.
  const v = verifyGauntlet({
    roles: ["builder"],
    completionsFile: path.join(ledger, "dispatch-completions.jsonl"),
    since: comps[0].started_at,
  });
  assert(v.ok === true, `gauntlet-verify should pass on a real builder record: ${JSON.stringify(v.roles)}`);
  assert(v.roles[0].status === "ran", `expected builder status 'ran', got '${v.roles[0].status}'`);
});

// ── 4. gauntlet-verify RED's when builder never ran (the reap, weaponized) ──
test("no builder record → gauntlet-verify FAILS (absence is the death signal)", () => {
  const ledger = path.join(scratch, "l3"); // reuse l3 but verify a DIFFERENT window
  // A window in the far past where no builder ran → no-record → RED.
  const v = verifyGauntlet({
    roles: ["builder"],
    completionsFile: path.join(ledger, "dispatch-completions.jsonl"),
    since: "2020-01-01T00:00:00.000Z",
    until: "2020-01-02T00:00:00.000Z",
  });
  assert(v.ok === false, "gauntlet-verify must RED when builder has no in-window record");
  assert(v.roles[0].status === "no-record", `expected 'no-record', got '${v.roles[0].status}'`);
});

// ── 5. Worktree guard (ED-016 class) ────────────────────────
test("worktree run → records land in canonical/test ledger, NOT the worktree", () => {
  const ledger = path.join(scratch, "l5");
  const worktree = path.join(scratch, "wt");
  fs.mkdirSync(worktree, { recursive: true });
  fs.writeFileSync(path.join(worktree, ".git"), "gitdir: /fake/.git/worktrees/wt\n"); // a real worktree has a .git link
  const res = runWrapper({
    fake: fakeHappy,
    ledgerDir: ledger,
    iso: `worktree:${worktree}`,
  });
  assert(res.status === 0, `expected exit 0, got ${res.status}`);
  const comps = readLedger(ledger, "dispatch-completions.jsonl");
  assert(comps.length === 1 && comps[0].ok === true, "record should be in the test ledger");
  // The worktree must NOT have grown its own runtime ledger.
  const leaked = path.join(worktree, ".claude", "runtime", "dispatch-completions.jsonl");
  assert(!fs.existsSync(leaked), "record LEAKED into the worktree (ED-016 regression)");
});

// ── 6. Whitespace-only stdout is NOT a success (reviewer-HIGH false-green) ──
test("whitespace-only stdout → exit≠0 + zero_byte_reap (no false-green)", () => {
  const ledger = path.join(scratch, "l6");
  const res = runWrapper({ fake: fakeWhitespace, ledgerDir: ledger });
  assert(res.status !== 0, `whitespace-only output must NOT be success, got exit ${res.status}`);
  const comps = readLedger(ledger, "dispatch-completions.jsonl");
  assert(comps.length === 1 && comps[0].ok === false, "expected ok:false completion");
  const deaths = readLedger(ledger, "dispatch-deaths.jsonl");
  assert(
    deaths.some((d) => d.reason === "builder_zero_byte_reap"),
    `expected zero_byte_reap death for whitespace-only, got ${JSON.stringify(deaths)}`,
  );
});

// ── 7. Build role with NO isolation → refused (reviewer-CRITICAL) ──
test("build role without -w/--worktree → exit 2, refuses to run in canonical", () => {
  const ledger = path.join(scratch, "l7");
  const res = runWrapper({ fake: fakeHappy, ledgerDir: ledger, iso: "none" });
  assert(res.status === 2, `expected usage exit 2 (isolation required), got ${res.status}`);
  // No dispatch happened → no completion record written.
  const comps = readLedger(ledger, "dispatch-completions.jsonl");
  assert(comps.length === 0, "no record should be written when isolation is refused");
});

// ── 8. --worktree = canonical root → refused (reviewer-CRITICAL ×2) ──
test("--worktree <canonical root> → exit 2 (cannot pass canonical off as a worktree)", () => {
  const ledger = path.join(scratch, "l8");
  const res = runWrapper({ fake: fakeHappy, ledgerDir: ledger, iso: `worktree:${REPO_ROOT}` });
  assert(res.status === 2, `expected exit 2 for --worktree=canonical, got ${res.status}`);
  const comps = readLedger(ledger, "dispatch-completions.jsonl");
  assert(comps.length === 0, "no record when canonical is refused as worktree");
});

// ── 9. --worktree = non-worktree subdir (no .git link) → refused ──
test("--worktree <subdir without .git> → exit 2 (not a real worktree)", () => {
  const ledger = path.join(scratch, "l9");
  const subdir = path.join(REPO_ROOT, "scripts"); // exists, but no own .git link
  const res = runWrapper({ fake: fakeHappy, ledgerDir: ledger, iso: `worktree:${subdir}` });
  assert(res.status === 2, `expected exit 2 for non-worktree subdir, got ${res.status}`);
  const comps = readLedger(ledger, "dispatch-completions.jsonl");
  assert(comps.length === 0, "no record when a plain subdir is refused");
});

// ── Summary ─────────────────────────────────────────────────
console.log(`\ndispatch-claude.test.js — ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
