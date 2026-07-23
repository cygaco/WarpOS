#!/usr/bin/env node
"use strict";

/**
 * entry-preamble-parity.test.js — planted-boundary tests for the entry-preamble parity enforcer
 * (SP-20260723-001, ADR-0036). Proves the check sits EXACTLY on the line between a benign encoding
 * diff (stays GREEN) and real drift (REDs), plus every hardest failure β + DoE required.
 *
 * Negative cases run against FIXTURE repo-roots (temp copies under the OS tmpdir) — the real entry
 * docs are never mutated. The live control runs the enforcer against the real repo (AC-6).
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");

const { runParity, CANONICAL_REL, FILES } = require("./entry-preamble-parity.js");
const REAL_ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");

let pass = 0;
let fail = 0;
function t(name, fn) {
  try {
    fn();
    pass++;
    console.log("  PASS  " + name);
  } catch (e) {
    fail++;
    console.error("  FAIL  " + name + " — " + (e && e.message ? e.message : e));
  }
}

// Build a fixture repo-root containing all configured entry files, copied from the real repo.
function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "epp-fixture-"));
  for (const cfg of FILES) {
    const src = path.join(REAL_ROOT, cfg.rel);
    const dst = path.join(root, cfg.rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
  return root;
}
function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}
function findingFor(findings, relSubstr) {
  return findings.find((f) => f.file.includes(relSubstr));
}

// 1. LIVE CONTROL — the enforcer is GREEN on the real shipped bytes (AC-6, first-run GREEN).
t("live control: the real shipped repo is clean (AC-6)", () => {
  const { findings } = runParity({});
  assert.strictEqual(findings.length, 0, "expected zero findings on shipped bytes, got " + JSON.stringify(findings));
});

// 2. A clean fixture copy is GREEN — the baseline the mutation cases perturb.
t("a clean fixture copy is GREEN", () => {
  const root = makeFixture();
  try {
    const { findings } = runParity({ repoRoot: root });
    assert.strictEqual(findings.length, 0, JSON.stringify(findings));
  } finally {
    rmrf(root);
  }
});

// 3. A ONE-CHARACTER semantic edit inside an embedded region -> RED (drift).
t("one-character semantic edit inside a region -> drift finding", () => {
  const root = makeFixture();
  try {
    const p = path.join(root, "CODEX.md");
    let txt = fs.readFileSync(p, "utf8");
    const beginIdx = txt.indexOf("BEGIN v1 -->");
    const cut = txt.indexOf("WarpOS", beginIdx); // first WarpOS INSIDE the region
    assert.ok(cut > beginIdx, "fixture precondition: WarpOS inside region");
    txt = txt.slice(0, cut) + "WarpOX" + txt.slice(cut + "WarpOS".length);
    fs.writeFileSync(p, txt);
    const { findings } = runParity({ repoRoot: root });
    const f = findingFor(findings, "CODEX.md");
    assert.ok(f && /drift|mismatch/i.test(f.reason), "expected a drift finding for CODEX.md, got " + JSON.stringify(findings));
  } finally {
    rmrf(root);
  }
});

// 4. A pure CRLF reformat of a region -> stays GREEN (benign encoding diff, the other side of the line).
t("pure CRLF reformat of a region stays GREEN", () => {
  const root = makeFixture();
  try {
    const p = path.join(root, "ANTIGRAVITY.md");
    const txt = fs.readFileSync(p, "utf8");
    fs.writeFileSync(p, txt.replace(/\n/g, "\r\n")); // whole-file LF -> CRLF
    const { findings } = runParity({ repoRoot: root });
    assert.ok(!findingFor(findings, "ANTIGRAVITY.md"), "CRLF reformat must not drift: " + JSON.stringify(findings));
  } finally {
    rmrf(root);
  }
});

// 4b. A trailing blank line added inside a region -> stays GREEN (edge-newline normalization).
t("trailing blank line inside a region stays GREEN", () => {
  const root = makeFixture();
  try {
    const p = path.join(root, "GEMINI.md");
    let txt = fs.readFileSync(p, "utf8");
    txt = txt.replace(/(\n<!--\s*WARPOS:ENTERING-AGENT-PREAMBLE:END)/, "\n\n\n$1"); // blank lines before END, inside region
    fs.writeFileSync(p, txt);
    const { findings } = runParity({ repoRoot: root });
    assert.ok(!findingFor(findings, "GEMINI.md"), "trailing-blank-line reformat must not drift: " + JSON.stringify(findings));
  } finally {
    rmrf(root);
  }
});

// 5. A MISSING required entry file -> RED.
t("missing required entry file -> finding", () => {
  const root = makeFixture();
  try {
    fs.rmSync(path.join(root, "GEMINI.md"));
    const { findings } = runParity({ repoRoot: root });
    const f = findingFor(findings, "GEMINI.md");
    assert.ok(f && /missing/i.test(f.reason), "expected a missing finding, got " + JSON.stringify(findings));
  } finally {
    rmrf(root);
  }
});

// 6. An OVERSIZED shim delta (bytes OUTSIDE the region beyond tier) -> RED.
t("oversized shim delta (tombstone tier) -> finding", () => {
  const root = makeFixture();
  try {
    const p = path.join(root, "GEMINI.md");
    const txt = fs.readFileSync(p, "utf8");
    const filler = ("\nfiller line well beyond the tombstone tier bound ".padEnd(80, "x")).repeat(60); // > 2048B AND > 40 lines
    fs.writeFileSync(p, txt + filler);
    const { findings } = runParity({ repoRoot: root });
    const f = findingFor(findings, "GEMINI.md");
    assert.ok(f && /oversized/i.test(f.reason), "expected an oversized finding, got " + JSON.stringify(findings));
  } finally {
    rmrf(root);
  }
});

// 7. An ABSENT shared region (markers stripped) -> RED (dropped shim, distinct from thinness).
t("absent shared region (markers stripped) -> finding", () => {
  const root = makeFixture();
  try {
    const p = path.join(root, "CODEX.md");
    const txt = fs.readFileSync(p, "utf8").replace(/<!--\s*WARPOS:ENTERING-AGENT-PREAMBLE:(?:BEGIN[^>]*|END)\s*-->/g, "");
    fs.writeFileSync(p, txt);
    const { findings } = runParity({ repoRoot: root });
    const f = findingFor(findings, "CODEX.md");
    assert.ok(f && /region|dropped/i.test(f.reason), "expected a dropped-region finding, got " + JSON.stringify(findings));
  } finally {
    rmrf(root);
  }
});

// 8. The CANONICAL oracle unreadable -> throws (the CLI wrapper maps this to exit 2, fail-closed).
t("canonical oracle missing -> throws (fail-closed, exit 2)", () => {
  const root = makeFixture();
  try {
    fs.rmSync(path.join(root, CANONICAL_REL));
    assert.throws(() => runParity({ repoRoot: root }), /canonical|oracle/i);
  } finally {
    rmrf(root);
  }
});

console.log("\n" + pass + "/" + (pass + fail) + " passed");
process.exit(fail ? 1 : 0);
