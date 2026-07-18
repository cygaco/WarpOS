#!/usr/bin/env node
"use strict";

/**
 * Isolated test for scripts/materialize-decisions.js — the C2 reconcile target
 * (SP-20260718-002). Focus: the STALE-FILES.md path (gauntlet R2 / BR-3), which
 * had NO test and so silently broke when the stale `source()` returned an OBJECT
 * (materialize-core treats a non-array source as an empty/cold render → STALE-FILES
 * always "No stale files"). These are the teeth that catch that class.
 *
 *   node scripts/materialize-decisions.test.js
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { harness, sealedDir } = require("./checks/lib/fixture-harness");
const core = require("./state/materialize-core");
const md = require("./materialize-decisions");

const h = harness("materialize-decisions");

// ── BR-3: computeStaleSnapshot returns an ARRAY (not an object) ──────────────
h.test("BR-3: computeStaleSnapshot returns an ARRAY (materialize-core needs an array source)", () => {
  const out = md.computeStaleSnapshot([{ stale_consumers: ["docs/x.md"] }]);
  assert.ok(Array.isArray(out), "computeStaleSnapshot MUST return an array (was an object → cold-start bug)");
});

// ── BR-3: computeStale is a pure passthrough over the array ──────────────────
h.test("BR-3: computeStale is a pure passthrough (array in → array out; non-array → [])", () => {
  assert.deepStrictEqual(md.computeStale(["a", "b"]), ["a", "b"]);
  assert.deepStrictEqual(md.computeStale(null), []);
  assert.deepStrictEqual(md.computeStale({ currentlyStale: ["a"] }), [], "an object is NOT a valid stale list");
});

// ── BR-3 TEETH: a NON-EMPTY stale list must RENDER the files (not "No stale files") ──
// This is the exact regression: with the object-returning source, materialize-core
// saw a non-array and cold-rendered "No stale files" even when files were stale.
h.test("BR-3 teeth: a non-empty stale list renders the files through materialize-core (not always-empty)", () => {
  const fx = sealedDir({}, "materialize-decisions-stale");
  try {
    const outPath = fx.file("docs/.decisions/STALE-FILES.md");
    const res = core.materialize({
      source: () => ["docs/A.md", "docs/B.md"], // a non-empty ARRAY stale list (post-fix shape)
      reducer: md.computeStale,
      renderer: md.renderStaleFiles,
      emptyRender: () => md.renderStaleFiles([]),
      outPath,
      root: fx.dir,
    });
    assert.strictEqual(res.ok, true, "materialize writes the stale file");
    const txt = fs.readFileSync(outPath, "utf8");
    assert.ok(/docs\/A\.md/.test(txt) && /docs\/B\.md/.test(txt), "the stale files are listed");
    assert.ok(/2 file\(s\) need review/.test(txt), "the count is rendered");
    assert.ok(!/No stale files/.test(txt), "a non-empty list must NOT render the empty message (BR-3)");
  } finally {
    fx.cleanup();
  }
});

// ── planted violation: the OLD object-returning shape DROPS a real stale file ──
h.violation("BR-3 planted violation: an OBJECT source (old bug shape) drops a real stale file — teeth catch it", () => {
  const fx = sealedDir({}, "materialize-decisions-stale-neg");
  try {
    const outPath = fx.file("docs/.decisions/STALE-FILES.md");
    core.materialize({
      source: () => ({ currentlyStale: ["docs/A.md"] }), // the OLD (broken) object shape
      reducer: md.computeStale,
      renderer: md.renderStaleFiles,
      emptyRender: () => md.renderStaleFiles([]),
      outPath,
      root: fx.dir,
    });
    const txt = fs.readFileSync(outPath, "utf8");
    // The object shape is a non-array → materialize-core cold-renders "No stale files"
    // even though docs/A.md IS stale. Return the DROPPED file as the caught violation
    // (non-empty ⇒ isPass=false ⇒ h.violation correctly registers the planted bug).
    const dropped = /No stale files/.test(txt) ? ["docs/A.md"] : [];
    return { violations: dropped };
  } finally {
    fx.cleanup();
  }
});

// ── DECISIONS.md still routes through the shared primitive (AC-7 sanity) ──────
h.test("AC-7 sanity: DECISIONS renders grouped events through materialize-core", () => {
  const fx = sealedDir({}, "materialize-decisions-decisions");
  try {
    const outPath = fx.file("docs/DECISIONS.md");
    const events = [
      { id: "E1", ts: "2026-07-18T01:00", file: "a.ts", change: "add", group: "g1" },
      { id: "E2", ts: "2026-07-18T02:00", file: "b.ts", change: "edit", group: "g1" },
    ];
    const res = core.materialize({
      source: () => events,
      reducer: md.groupEvents,
      renderer: md.renderDecisions,
      emptyRender: () => "# Decision Log\n\nNo events.\n",
      outPath,
      root: fx.dir,
    });
    assert.strictEqual(res.ok, true);
    const txt = fs.readFileSync(outPath, "utf8");
    assert.ok(/a\.ts/.test(txt) && /b\.ts/.test(txt), "decisions rows rendered");
  } finally {
    fx.cleanup();
  }
});

h.done();
