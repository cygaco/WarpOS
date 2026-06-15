#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// roadmap-board-render.test.js — SP-20260615-001 S-4 / AC-R4a.
//
// ::renders-board-from-four-live-sources-reads-only
//   Runs scripts/panel/roadmap.js against the REAL repo and asserts the board
//   carries all four sections — NEXT ACTION + Ranked next (Prioritized) +
//   In flight + Open gaps / blockers — assembled from the four live sources.
//   Read-only PROOF: snapshot the size+mtime+sha of each of the four source files
//   before and after the run; assert NONE changed (the generator writes only its
//   own stdout, never a source file).
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const SCRIPT = path.join(ROOT, "scripts", "panel", "roadmap.js");

// The four live sources the board reads (AC-R4a).
const SOURCES = [
  path.join(ROOT, "ROADMAP.md"),
  path.join(ROOT, "TRACKER.md"),
  path.join(ROOT, ".claude", "project", "sprint", "active-sprints.yaml"),
  path.join(ROOT, ".claude", "project", "memory", "enforcement-debt.jsonl"),
  path.join(ROOT, ".claude", "project", "memory", "recurring-issues.jsonl"),
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

function snapshot(file) {
  if (!fs.existsSync(file)) return { exists: false };
  const buf = fs.readFileSync(file);
  const st = fs.statSync(file);
  return {
    exists: true,
    size: st.size,
    mtimeMs: st.mtimeMs,
    sha: crypto.createHash("sha256").update(buf).digest("hex"),
  };
}

function main() {
  // ── snapshot sources BEFORE the run ────────────────────────────────────────
  const before = SOURCES.map(snapshot);

  // ── run the generator (real repo) ──────────────────────────────────────────
  const out = execFileSync("node", [SCRIPT], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 60000,
  });

  // ── snapshot sources AFTER the run ─────────────────────────────────────────
  const after = SOURCES.map(snapshot);

  ok("board renders the NEXT ACTION section", () => {
    assert.ok(/^##\s+NEXT ACTION\s*$/m.test(out), "missing '## NEXT ACTION' section");
  });
  ok("board renders the Ranked next (Prioritized) section", () => {
    assert.ok(
      /^##\s+Ranked next \(Prioritized\)\s*$/m.test(out),
      "missing '## Ranked next (Prioritized)' section",
    );
  });
  ok("board renders the In flight section", () => {
    assert.ok(/^##\s+In flight\s*$/m.test(out), "missing '## In flight' section");
  });
  ok("board renders the Open gaps / blockers section", () => {
    assert.ok(
      /^##\s+Open gaps \/ blockers\s*$/m.test(out),
      "missing '## Open gaps / blockers' section",
    );
  });
  ok("board cites all four live sources", () => {
    assert.ok(/TRACKER\.md/.test(out), "no TRACKER.md provenance");
    assert.ok(/ROADMAP\.md/.test(out), "no ROADMAP.md provenance");
    assert.ok(/active-sprints\.yaml/.test(out), "no active-sprints.yaml provenance");
    assert.ok(/enforcement-debt\.jsonl/.test(out), "no enforcement-debt provenance");
  });

  // ── READ-ONLY proof: no source file changed ────────────────────────────────
  ok("READ-ONLY: no source file content/mtime/size changed across the run", () => {
    for (let i = 0; i < SOURCES.length; i++) {
      const b = before[i];
      const a = after[i];
      assert.strictEqual(a.exists, b.exists, `${SOURCES[i]} existence flipped`);
      if (!b.exists) continue;
      assert.strictEqual(a.sha, b.sha, `${SOURCES[i]} CONTENT changed (sha differs)`);
      assert.strictEqual(a.size, b.size, `${SOURCES[i]} SIZE changed`);
      assert.strictEqual(a.mtimeMs, b.mtimeMs, `${SOURCES[i]} MTIME changed (was written)`);
    }
  });

  console.log(`\nroadmap-board-render: ${pass}/${pass + fail} pass`);
  process.exit(fail ? 1 : 0);
}

main();
