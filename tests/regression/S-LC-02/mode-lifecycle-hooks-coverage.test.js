#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// mode-lifecycle-hooks-coverage.test.js — S-LC-02 / WI-3. The report-only
// coverage enforcer (scripts/checks/mode-lifecycle-hooks-coverage.js):
//   - REVERSE: validateRegistry passes on the real registry; fails on a broken one.
//   - FORWARD (pure): a declared event with no emitter that is wiring-pending →
//     INFO (not a gap); an event that is neither emitted nor pending → GAP; an
//     emitted event → covered (even if not pending).
//   - clean tree (real registry + allowlist) → 0 gaps, exit 0.
//   - a planted declared-event-with-no-emitter → reported as a GAP, exit 1 under
//     --enforce (and exit 0 / still listed in report-only default).
//   - β exit-code contract (P-053): clean→0, gap-only→0, parse/unreadable→2.
//
// Planted fixtures are SEALED (os.tmpdir()); the real registry/allowlist are
// never mutated.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const ENFORCER = path.join(ROOT, "scripts", "checks", "mode-lifecycle-hooks-coverage.js");
const REGISTRY = path.join(ROOT, ".claude", "agents", "_org", "mode-lifecycle-hooks.json");
const { validateRegistry, computeCoverage } = require(ENFORCER);

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

function run(extra = []) {
  const r = spawnSync("node", [ENFORCER, ...extra], { encoding: "utf8" });
  return { status: r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}

const realDoc = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));

// ── REVERSE: validateRegistry ─────────────────────────────────────────────────
ok("validateRegistry-passes-on-real-registry", () => {
  const res = validateRegistry(realDoc);
  assert.ok(res.ok, `real registry must be coherent: ${res.errors.join("; ")}`);
});

ok("validateRegistry-fails-on-missing-field", () => {
  const broken = { events: [{ event: "x", when: "now", mode: "block" /* no payload_fields */, harness_fires: false }] };
  assert.ok(!validateRegistry(broken).ok, "missing payload_fields must fail");
});

ok("validateRegistry-fails-on-harness_fires-true", () => {
  const broken = { events: [{ event: "x", when: "now", mode: "block", payload_fields: [], harness_fires: true }] };
  assert.ok(!validateRegistry(broken).ok, "harness_fires:true breaks the virtual invariant");
});

ok("validateRegistry-fails-on-bad-mode", () => {
  const broken = { events: [{ event: "x", when: "now", mode: "halt", payload_fields: [], harness_fires: false }] };
  assert.ok(!validateRegistry(broken).ok, "mode outside {block,advisory} must fail");
});

ok("validateRegistry-fails-on-duplicate-event", () => {
  const broken = { events: [
    { event: "dup", when: "a", mode: "block", payload_fields: [], harness_fires: false },
    { event: "dup", when: "b", mode: "advisory", payload_fields: [], harness_fires: false },
  ] };
  assert.ok(!validateRegistry(broken).ok, "duplicate event id must fail");
});

// ── FORWARD (pure compute) ────────────────────────────────────────────────────
ok("computeCoverage-pending-is-info-not-gap", () => {
  const reg = { events: [{ event: "a", when: "w", mode: "block", payload_fields: [], harness_fires: false }] };
  const res = computeCoverage(reg, new Set(), new Set(["a"]));
  assert.strictEqual(res.gaps.length, 0, "a wiring-pending event is not a gap");
  assert.deepStrictEqual(res.pending, ["a"], "it is reported as pending/info");
});

ok("computeCoverage-orphan-is-a-gap", () => {
  const reg = { events: [{ event: "orphan", when: "w", mode: "block", payload_fields: [], harness_fires: false }] };
  const res = computeCoverage(reg, new Set(), new Set()); // not emitted, not pending
  assert.deepStrictEqual(res.gaps, ["orphan"], "neither emitted nor pending → gap");
});

ok("computeCoverage-emitted-takes-precedence", () => {
  const reg = { events: [{ event: "a", when: "w", mode: "block", payload_fields: [], harness_fires: false }] };
  const res = computeCoverage(reg, new Set(["a"]), new Set()); // emitted, not pending
  assert.deepStrictEqual(res.covered, ["a"], "an emitted event is covered");
  assert.strictEqual(res.gaps.length, 0, "covered → not a gap");
});

// ── CLI: clean tree → 0 gaps, exit 0 ──────────────────────────────────────────
ok("clean-tree-zero-gaps-exit-0", () => {
  const r = run(["--json"]);
  assert.strictEqual(r.status, 0, `clean tree must exit 0\n${r.stdout}${r.stderr}`);
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.ok, true, "ok:true on the clean tree");
  assert.strictEqual(out.gaps.length, 0, "0 gaps on the real tree (all wiring-pending)");
});

// ── CLI: planted declared-event-with-no-emitter → gap; exit 1 under --enforce ─
ok("planted-gap-reported-and-enforced", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mlhc-gap-"));
  const fixture = path.join(dir, "mode-lifecycle-hooks.json");
  const doc = JSON.parse(JSON.stringify(realDoc));
  doc.events.push({
    event: "test:planted:no-emitter", when: "test", mode: "block", harness_fires: false, payload_fields: ["actor"],
  });
  fs.writeFileSync(fixture, JSON.stringify(doc, null, 2));

  // report-only (default): the gap is listed, but exit stays 0 (non-blocking).
  const rep = run(["--registry", fixture, "--json"]);
  assert.strictEqual(rep.status, 0, "report-only: a gap-only result still exits 0");
  const repOut = JSON.parse(rep.stdout);
  assert.ok(repOut.gaps.includes("test:planted:no-emitter"), "the planted orphan is reported as a gap");

  // --enforce: the same gap now exits 1 (the ramp tail / detection proof).
  const enf = run(["--registry", fixture, "--enforce", "--json"]);
  assert.strictEqual(enf.status, 1, "under --enforce a gap exits 1");
  assert.ok(JSON.parse(enf.stdout).gaps.includes("test:planted:no-emitter"), "orphan still in gaps under enforce");

  // the real registry is untouched.
  assert.strictEqual(JSON.parse(fs.readFileSync(REGISTRY, "utf8")).events.length, realDoc.events.length);
});

// ── CLI: runtime lifecycle-event record satisfies coverage (--events) ─────────
ok("runtime-record-counts-as-emitter", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mlhc-rt-"));
  // a fixture registry with an event that is NOT in the real allowlist…
  const fixture = path.join(dir, "mode-lifecycle-hooks.json");
  const doc = JSON.parse(JSON.stringify(realDoc));
  doc.events.push({ event: "test:runtime:emitted", when: "t", mode: "advisory", harness_fires: false, payload_fields: ["actor"] });
  fs.writeFileSync(fixture, JSON.stringify(doc, null, 2));
  // …but with a runtime lifecycle-event record present in the events file.
  const events = path.join(dir, "events.jsonl");
  fs.writeFileSync(events, JSON.stringify({ cat: "lifecycle", data: { kind: "lifecycle-event", event: "test:runtime:emitted" } }) + "\n");

  const r = run(["--registry", fixture, "--events", events, "--enforce", "--json"]);
  const out = JSON.parse(r.stdout);
  assert.ok(!out.gaps.includes("test:runtime:emitted"), "a runtime record satisfies the emitter check");
  assert.strictEqual(r.status, 0, "no gaps → exit 0 even under --enforce");
});

// ── CLI: β exit-code contract — unreadable/malformed registry → exit 2 ────────
ok("parse-error-registry-exits-2", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mlhc-parse-"));
  const fixture = path.join(dir, "mode-lifecycle-hooks.json");
  fs.writeFileSync(fixture, "{ this is not valid json ");
  const r = run(["--registry", fixture]);
  assert.strictEqual(r.status, 2, "a parse error must FAIL LOUD (exit 2), never a false-green");
});

ok("structurally-broken-registry-exits-2", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mlhc-broken-"));
  const fixture = path.join(dir, "mode-lifecycle-hooks.json");
  // valid JSON, but an event row with harness_fires:true breaks the virtual invariant.
  fs.writeFileSync(fixture, JSON.stringify({ events: [{ event: "x", when: "w", mode: "block", payload_fields: [], harness_fires: true }] }));
  const r = run(["--registry", fixture]);
  assert.strictEqual(r.status, 2, "a structurally-broken registry fails closed (exit 2)");
});

ok("unreadable-registry-exits-2", () => {
  const r = run(["--registry", path.join(os.tmpdir(), "does-not-exist-" + Date.now() + ".json")]);
  assert.strictEqual(r.status, 2, "an unreadable registry fails closed (exit 2)");
});

console.log(`\nmode-lifecycle-hooks-coverage: ${pass}/${pass + fail} pass`);
process.exit(fail ? 1 : 0);
