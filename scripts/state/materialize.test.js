#!/usr/bin/env node
"use strict";

/**
 * materialize.test.js — SP-20260718-002 · C2 · qa-plan Gate #5 (AC-8) + AC-7.
 *
 * Proves:
 *   AC-8  delete->regen->byte-identical (what-running + what-happened, same
 *         injected event source)
 *   AC-8  determinism: renderer(reducer(events)) identical across calls
 *   AC-8  cold-start: [] events -> emptyRender -> ok:true, bytes>0, NOT a crash
 *   AC-8  purity: two runs a real time-gap apart are byte-identical (a Date.now
 *         leak would differ) + renderer-source AST grep for forbidden tokens
 *   AC-7  reconcile: BOTH materialize.js AND materialize-decisions.js route
 *         through materialize-core; decisions has NO standalone writeFileSync
 *   fail-closed: materialize-core returns ok:false on a missing renderer
 *
 *   node scripts/state/materialize.test.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const assert = require("assert");
const { harness, sealedDir } = require("../checks/lib/fixture-harness");

const core = require("./materialize-core");
const mat = require("./materialize");

const h = harness("materialize");

// A deterministic fixture: mixed start/end pairs across the three in-flight
// kinds, plus decision/close/release events.
//   - sprint SP-1 started, never closed        -> in flight
//   - dispatch builder-a started AND completed  -> NOT in flight
//   - gauntlet round-1 opened, never closed     -> in flight
//   - decision (E5), sprint-close (E6), release (E7) -> what-happened
function fixtureEvents() {
  return [
    { id: "E1", ts: "2026-07-18T10:00:00.000Z", cat: "lifecycle", data: { action: "sprint-start", target: "SP-1" }, sprint_id: "SP-1" },
    { id: "E2", ts: "2026-07-18T10:01:00.000Z", cat: "audit", data: { action: "dispatch-start", target: "builder-a" } },
    { id: "E3", ts: "2026-07-18T10:02:00.000Z", cat: "audit", data: { action: "dispatch-complete", target: "builder-a" } },
    { id: "E4", ts: "2026-07-18T10:03:00.000Z", cat: "audit", data: { action: "gauntlet-round-open", round: 1 } },
    { id: "E5", ts: "2026-07-18T10:04:00.000Z", cat: "decision", data: { action: "approved", target: "gate-5" } },
    { id: "E6", ts: "2026-07-18T10:05:00.000Z", cat: "lifecycle", data: { action: "sprint-close", target: "SP-2" }, sprint_id: "SP-2" },
    { id: "E7", ts: "2026-07-18T10:06:00.000Z", cat: "audit", data: { action: "release", target: "v1.0" } },
  ];
}

function runWith(events, dir) {
  return mat.run({
    source: () => events,
    root: dir,
    runningPath: path.join("runtime", "state", "what-running.md"),
    happenedPath: path.join("runtime", "state", "what-happened.md"),
  });
}

// ── AC-8: delete -> regen -> byte-identical ─────────────────────────────────
h.test("AC-8 delete->regen->byte-identical (what-running + what-happened)", () => {
  const fx = sealedDir({}, "materialize-regen");
  try {
    const ev = fixtureEvents();
    const r1 = runWith(ev, fx.dir);
    assert.strictEqual(r1.running.ok, true, "running materialized");
    assert.strictEqual(r1.happened.ok, true, "happened materialized");
    const running1 = fs.readFileSync(r1.running.path, "utf8");
    const happened1 = fs.readFileSync(r1.happened.path, "utf8");

    fs.rmSync(r1.running.path);
    fs.rmSync(r1.happened.path);
    assert.ok(!fs.existsSync(r1.running.path), "what-running deleted");
    assert.ok(!fs.existsSync(r1.happened.path), "what-happened deleted");

    const r2 = runWith(ev, fx.dir);
    const running2 = fs.readFileSync(r2.running.path, "utf8");
    const happened2 = fs.readFileSync(r2.happened.path, "utf8");

    assert.strictEqual(running2, running1, "what-running byte-identical after regen");
    assert.strictEqual(happened2, happened1, "what-happened byte-identical after regen");
  } finally {
    fx.cleanup();
  }
});

// ── AC-8: determinism of the pure pipeline ──────────────────────────────────
h.test("AC-8 determinism: renderer(reducer(events)) identical across calls", () => {
  const ev = fixtureEvents();
  assert.strictEqual(
    mat.renderRunning(mat.reduceRunning(ev)),
    mat.renderRunning(mat.reduceRunning(ev)),
    "what-running render is deterministic",
  );
  assert.strictEqual(
    mat.renderHappened(mat.reduceHappened(ev)),
    mat.renderHappened(mat.reduceHappened(ev)),
    "what-happened render is deterministic",
  );
});

// ── AC-8: cold-start renders empty-but-valid, not a crash ───────────────────
h.test("AC-8 cold-start: [] events -> emptyRender -> ok:true, bytes>0, no crash", () => {
  const fx = sealedDir({}, "materialize-cold");
  try {
    const r = runWith([], fx.dir);
    assert.strictEqual(r.running.ok, true, "cold what-running ok");
    assert.strictEqual(r.happened.ok, true, "cold what-happened ok");
    assert.ok(r.running.bytes > 0, "cold what-running bytes>0");
    assert.ok(r.happened.bytes > 0, "cold what-happened bytes>0");
    assert.ok(fs.readFileSync(r.running.path, "utf8").length > 0, "cold file non-empty");
  } finally {
    fx.cleanup();
  }
});

// ── AC-8: purity — two runs a real time-gap apart are byte-identical ────────
h.test("AC-8 purity: runs a time-gap apart are byte-identical (Date.now leak would differ)", () => {
  const fx = sealedDir({}, "materialize-purity");
  try {
    const ev = fixtureEvents();
    const r1 = runWith(ev, fx.dir);
    const first =
      fs.readFileSync(r1.running.path, "utf8") + fs.readFileSync(r1.happened.path, "utf8");
    // Advance real wall-clock time so any Date.now()/new Date() leak would show.
    const until = Date.now() + 60;
    // eslint-disable-next-line no-empty
    while (Date.now() < until) {}
    const r2 = runWith(ev, fx.dir);
    const second =
      fs.readFileSync(r2.running.path, "utf8") + fs.readFileSync(r2.happened.path, "utf8");
    assert.strictEqual(second, first, "output identical across a time gap");
  } finally {
    fx.cleanup();
  }
});

// ── AC-8: renderer-source purity grep + teeth (planted violation) ───────────
function hasNondeterminism(src) {
  return /Date\.now\(|new Date\(|process\.pid|__dirname|process\.cwd/.test(String(src));
}

h.pass("AC-8 renderer sources are pure (no Date.now/new Date/pid/abs-path tokens)", () => {
  const impure =
    hasNondeterminism(mat.renderRunning.toString()) ||
    hasNondeterminism(mat.renderHappened.toString()) ||
    hasNondeterminism(mat.emptyRunning.toString()) ||
    hasNondeterminism(mat.emptyHappened.toString());
  return { ok: !impure };
});

h.violation("purity checker HAS TEETH: a renderer that calls Date.now is flagged", () => {
  // Planted non-determinism — the checker MUST reject it (else it is a
  // false-green that would never catch a real leak).
  const impureRenderer = (m) => `# X ${Date.now()} ${m}`;
  return { ok: !hasNondeterminism(impureRenderer.toString()) };
});

// ── AC-7: reconcile — both entrypoints route through the shared primitive ───
h.test("AC-7 reconcile: materialize.js AND materialize-decisions.js route through materialize-core", () => {
  const matSrc = fs.readFileSync(path.join(__dirname, "materialize.js"), "utf8");
  const coreSrc = fs.readFileSync(path.join(__dirname, "materialize-core.js"), "utf8");
  const decSrc = fs.readFileSync(path.join(__dirname, "..", "materialize-decisions.js"), "utf8");

  assert.ok(
    /require\((['"]).*materialize-core\1\)/.test(matSrc),
    "materialize.js requires materialize-core",
  );
  assert.ok(
    /require\((['"]).*materialize-core\1\)/.test(decSrc),
    "materialize-decisions.js requires materialize-core",
  );
  assert.ok(/function materialize\b/.test(coreSrc), "core defines the materialize primitive");

  // The shared primitive is the ONLY writer — no standalone writeFileSync
  // CALL in either entrypoint (match the call form, not a mention in a comment).
  assert.ok(
    !/\bwriteFileSync\s*\(/.test(decSrc),
    "materialize-decisions.js has NO standalone writeFileSync call (routes through core)",
  );
  assert.ok(
    !/\bwriteFileSync\s*\(/.test(matSrc),
    "materialize.js has NO standalone writeFileSync call (routes through core)",
  );
});

// ── AC-7 functional: pairing correctness ────────────────────────────────────
h.test("what-running: unpaired starts are in-flight; a paired start/end is not", () => {
  const model = mat.reduceRunning(fixtureEvents());
  const keys = model.inflight.map((r) => `${r.kind}:${r.key}`);
  assert.ok(keys.includes("sprint:SP-1"), "open sprint SP-1 is in flight");
  assert.ok(keys.includes("gauntlet-round:round-1"), "open gauntlet round is in flight");
  assert.ok(
    !keys.some((k) => k.startsWith("dispatch:")),
    "completed dispatch builder-a is NOT in flight",
  );
});

h.test("what-happened: decision/close/release events are digested", () => {
  const model = mat.reduceHappened(fixtureEvents());
  const ids = model.entries.map((e) => e.id);
  assert.ok(ids.includes("E5"), "decision event present");
  assert.ok(ids.includes("E6"), "sprint-close event present");
  assert.ok(ids.includes("E7"), "release event present");
  assert.ok(!ids.includes("E2"), "a plain dispatch-start is not a what-happened event");
});

// ── fail-closed: core never throws, returns ok:false on bad wiring ──────────
h.failClosed("materialize-core fails closed on a missing renderer", () => {
  return core.materialize({
    source: () => [{ id: "x" }],
    outPath: path.join("runtime", "state", "x.md"),
    root: os.tmpdir(),
    // renderer intentionally omitted
  });
});

h.done();
