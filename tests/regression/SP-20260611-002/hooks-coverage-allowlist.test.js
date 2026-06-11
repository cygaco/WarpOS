#!/usr/bin/env node
"use strict";

/**
 * SP-20260611-002 WS-G3c (R-9, T-320) — mode-lifecycle-hooks-coverage allowlist
 * SCHEMA (owner + expiry/review_by + reason). Surface (per-surface exploit
 * isolation, Hard AC #4): scripts/checks/mode-lifecycle-hooks-coverage.js + its
 * allowlist. A red here localizes to THIS file only.
 *
 * AC-9.1: a schemaless allowlist entry (bare string / missing owner|expiry|reason)
 *         is REJECTED — NOT honored as pending → downgraded to a coverage gap.
 * AC-9.2: an entry whose expiry/review_by is in the PAST is FLAGGED → downgraded to
 *         a gap (so --enforce fails on it); an unparseable expiry is fail-closed.
 * AC-9.3: a well-formed, in-date entry (owner + future expiry + reason) is honored
 *         as INFO (pending), not a gap and not over-flagged.
 *
 *   node tests/regression/SP-20260611-002/hooks-coverage-allowlist.test.js
 */

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const { harness } = require(path.join(ROOT, "scripts", "checks", "lib", "fixture-harness"));
const ENFORCER = path.join(ROOT, "scripts", "checks", "mode-lifecycle-hooks-coverage.js");
const { loadAllowlistSchema } = require(ENFORCER);

const h = harness("SP-002-WS-G3c/hooks-coverage-allowlist");

const FUTURE = "2099-01-01"; // safely future relative to any run date
const PAST = "2000-01-01"; // safely past

// A sealed registry with ONE declared virtual event that has NO emitter — so its
// only path to non-gap is a VALID in-date allowlist entry.
function registryWithEvent(ev) {
  return JSON.stringify({
    events: [{ event: ev, when: "test", mode: "advisory", payload_fields: ["actor"], harness_fires: false }],
  });
}
function allowlistWith(ev, entry) {
  return JSON.stringify({ wiring_pending: { [ev]: entry } });
}

// Run the CLI against a SEALED registry + allowlist (real tree never touched).
function runSealed(ev, entry, extra = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wsg3c-mlhc-"));
  const reg = path.join(dir, "registry.json");
  const al = path.join(dir, "allowlist.json");
  fs.writeFileSync(reg, registryWithEvent(ev));
  fs.writeFileSync(al, allowlistWith(ev, entry));
  // a throwaway empty events file so no runtime emitter accidentally covers `ev`.
  const events = path.join(dir, "events.jsonl");
  fs.writeFileSync(events, "");
  try {
    const r = spawnSync(
      process.execPath,
      [ENFORCER, "--registry", reg, "--allowlist", al, "--events", events, "--json", ...extra],
      { encoding: "utf8" },
    );
    return { status: r.status, out: r.stdout ? JSON.parse(r.stdout) : null, raw: r.stdout, stderr: r.stderr };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const EV = "test:planted:no-emitter";

// ── AC-9.1: schemaless entry is REJECTED → downgraded to a gap ─────────────────
h.violation("AC-9.1 a BARE-STRING (legacy) allowlist entry is rejected → the event is a GAP under --enforce", () => {
  // legacy shape: a plain reason string, no owner/expiry. Must NOT suppress the gap.
  const r = runSealed(EV, "S-LC-03 — some reason string", ["--enforce"]);
  // exit 1 (gap under --enforce) → the desired RED. isPass(1)===false → caught.
  return r.status;
});

h.violation("AC-9.1 an entry MISSING owner/expiry/reason is rejected → GAP under --enforce", () => {
  const r = runSealed(EV, { reason: "no owner, no expiry" }, ["--enforce"]);
  return r.status; // 1 → caught
});

h.test("AC-9.1 the rejected schemaless entry is SURFACED (flagged), not silently dropped", () => {
  const r = runSealed(EV, { reason: "no owner, no expiry" }, ["--enforce"]);
  assert.ok(r.out && Array.isArray(r.out.allowlistFlagged), "allowlistFlagged is in the JSON envelope");
  const f = r.out.allowlistFlagged.find((x) => x.event === EV);
  assert.ok(f, "the schemaless entry is flagged");
  assert.ok(/schemaless|missing/.test(f.problem), `flag names the schema problem: ${f && f.problem}`);
  assert.ok(r.out.gaps.includes(EV), "and the event is downgraded to a gap");
});

// ── AC-9.2: a PAST expiry is FLAGGED → downgraded to a gap ─────────────────────
h.violation("AC-9.2 an entry with a PAST review_by is flagged → GAP under --enforce", () => {
  const r = runSealed(EV, { owner: "S-LC-03", review_by: PAST, reason: "expired" }, ["--enforce"]);
  return r.status; // 1 → caught
});

h.violation("AC-9.2 an UNPARSEABLE expiry is fail-closed (treated as expired) → GAP under --enforce", () => {
  const r = runSealed(EV, { owner: "S-LC-03", review_by: "soon-ish", reason: "bad date" }, ["--enforce"]);
  return r.status; // 1 → caught
});

h.test("AC-9.2 the expired entry's flag names EXPIRED (visible downgrade)", () => {
  const r = runSealed(EV, { owner: "S-LC-03", expiry: PAST, reason: "expired via expiry alias" }, ["--enforce"]);
  const f = r.out.allowlistFlagged.find((x) => x.event === EV);
  assert.ok(f && /EXPIRED|expired/.test(f.problem), `flag names expiry: ${f && f.problem}`);
  assert.ok(r.out.gaps.includes(EV), "expired entry → event is a gap");
});

// ── AC-9.3: a well-formed, in-date entry is honored as INFO (not a gap) ────────
h.pass("AC-9.3 a well-formed in-date entry (owner + future expiry + reason) is honored as INFO (exit 0)", () => {
  const r = runSealed(EV, { owner: "S-LC-03", review_by: FUTURE, reason: "wiring lands S-LC-03" }, ["--enforce"]);
  // ok:true, 0 gaps, exit 0 even under --enforce.
  return r.status; // 0
});

h.test("AC-9.3 the valid entry is pending (info), NOT a gap and NOT flagged (no over-flag)", () => {
  const r = runSealed(EV, { owner: "S-LC-03", review_by: FUTURE, reason: "wiring lands S-LC-03" }, ["--enforce"]);
  assert.strictEqual(r.status, 0, "valid in-date entry → exit 0");
  assert.ok(r.out.ok === true, "ok:true");
  assert.strictEqual(r.out.gaps.length, 0, "the valid entry suppresses the gap");
  assert.strictEqual(r.out.pending, 1, "it is counted as wiring-pending (info)");
  assert.strictEqual((r.out.allowlistFlagged || []).length, 0, "a valid entry is NOT over-flagged");
});

// `expiry` is accepted as an alias for `review_by` (AC-9.1/9.2 say expiry/review_by).
h.pass("AC-9.3 `expiry` is accepted as an alias for `review_by`", () => {
  const r = runSealed(EV, { owner: "S-LC-03", expiry: FUTURE, reason: "alias form" }, ["--enforce"]);
  return r.status; // 0
});

// ── pure-unit coverage of loadAllowlistSchema (deterministic `now`) ───────────
h.test("loadAllowlistSchema: valid→pending, schemaless→flagged, past→flagged (deterministic now)", () => {
  const now = new Date("2026-06-11T00:00:00Z");
  const al = {
    wiring_pending: {
      good: { owner: "o", review_by: "2026-12-31", reason: "r" },
      barestring: "legacy reason",
      noowner: { review_by: "2026-12-31", reason: "r" },
      expired: { owner: "o", review_by: "2026-01-01", reason: "r" },
      baddate: { owner: "o", review_by: "nope", reason: "r" },
    },
  };
  const { pending, flagged } = loadAllowlistSchema(al, now);
  assert.deepStrictEqual([...pending], ["good"], "only the valid in-date entry is pending");
  const flaggedEvents = flagged.map((f) => f.event).sort();
  assert.deepStrictEqual(flaggedEvents, ["baddate", "barestring", "expired", "noowner"],
    "schemaless + expired + bad-date entries are all flagged (not honored)");
});

h.done();
