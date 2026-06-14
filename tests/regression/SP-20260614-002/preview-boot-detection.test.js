#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// preview-boot-detection.test.js — SP-20260614-002 S-1 / AC-R1a.
//
// The ready-line matcher must fire on a REAL `npm run dev` boot log (β rider,
// gauntlet-binding) and PARSE the actual port — never open-then-hope, never a
// hardcoded 3000. The corpus binds the matcher to a captured Next 16 boot banner
// fixture (tests/regression/SP-20260614-002/fixtures/next-boot-real.log), NOT
// only a synthetic string: a green parser over synthetic stdout proves parsing,
// not that the regex fires in prod.
//
//   verified_by ::cold-path-emits-eta-then-waits-for-ready-before-open
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const preview = require("../../../scripts/admin/preview");
const FIXTURE = path.join(__dirname, "fixtures", "next-boot-real.log");

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

// ── β rider: the matcher fires on a REAL boot log + parses the real port ──────
ok("real-boot-log: fixture exists and is a genuine Next boot banner", () => {
  assert.ok(fs.existsSync(FIXTURE), "next-boot-real.log fixture must exist");
  const log = fs.readFileSync(FIXTURE, "utf8");
  assert.ok(/▲ Next\.js/.test(log), "fixture is a real Next.js boot banner (▲ Next.js)");
  assert.ok(/- Local:/.test(log), "fixture carries the Next `- Local:` line");
});

ok("cold-path-emits-eta-then-waits-for-ready-before-open: matcher fires on REAL log + parses port", () => {
  const log = fs.readFileSync(FIXTURE, "utf8");
  // The detector is the exact unit preview.js polls during boot.
  const { ready, port } = preview.detectReady(log);
  assert.strictEqual(ready, true, "ready line must be detected in the real boot log");
  // The fixture booted on 3001 (Next self-healed a busy 3000) — proves we parse
  // the ACTUAL printed port, never a hardcoded 3000.
  assert.strictEqual(port, 3001, "must parse the ACTUAL printed port (3001), not 3000");
});

// ── ready line not yet present → not ready (no open-then-hope) ────────────────
ok("pre-ready stdout (no ready line yet) → not ready, no port", () => {
  const partial = "> next dev\n   ▲ Next.js 16.2.1\n - Network: ...\n";
  const { ready, port } = preview.detectReady(partial);
  assert.strictEqual(ready, false, "without a ready/local line, must not declare ready");
  assert.strictEqual(port, null, "no port until the local line is seen");
});

// ── ready line present but port not yet parsed → keep polling ────────────────
ok("ready keyword seen but no port line yet → keep polling (no premature open)", () => {
  const noPort = " ✓ Ready in 2.1s\n ○ Compiling /admin ...\n";
  const { ready } = preview.detectReady(noPort);
  assert.strictEqual(ready, false, "ready keyword without a parseable port must NOT open the browser");
});

// ── BLOCKER #1 regression: "- Local:"/"compiled" + a port but NO ready signal must NOT
// open. Next prints "- Local: http://localhost:<port>" BEFORE the final "Ready in" line,
// so treating "- Local:" (or "compiled") as the ready signal opens prematurely (xprovider). ─
ok("`- Local:` + port but no ready signal → NOT ready (no premature open)", () => {
  const localOnly = "> next dev\n   ▲ Next.js 16.2.1\n   - Local:        http://localhost:4123\n";
  const { ready } = preview.detectReady(localOnly);
  assert.strictEqual(ready, false, "`- Local:` alone (no Ready in/ready on/started server on) must NOT declare ready");
});

ok("`compiled` + a localhost url but no ready signal → NOT ready", () => {
  const compiledOnly = " ○ compiled client and server successfully\n http://localhost:5000 reachable\n";
  const { ready } = preview.detectReady(compiledOnly);
  assert.strictEqual(ready, false, "`compiled` is not a readiness signal");
});

// ── matcher covers Next's older ready-line variants ──────────────────────────
ok("matcher covers legacy Next variants (started server on / ready on)", () => {
  const legacy = "event - compiled successfully\nready - started server on 0.0.0.0:4000, url: http://localhost:4000\n";
  const { ready, port } = preview.detectReady(legacy);
  assert.strictEqual(ready, true, "legacy `started server on` + local url must match");
  assert.strictEqual(port, 4000, "parses the legacy port too");
});

console.log(`\npreview-boot-detection: ${pass}/${pass + fail} pass`);
process.exit(fail ? 1 : 0);
