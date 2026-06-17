#!/usr/bin/env node
"use strict";
/**
 * Regression test for models/check.js freshness honesty (E-DISPATCH-PERFECT-001 W0).
 *
 * Proves the three honest-freshness behaviors that the 30→14d tightening + always-print-age
 * change must keep:
 *   - the snapshot AGE for every present vendor is ALWAYS in the --json `snapshots[]` (an
 *     "all current" claim can never hide an aging snapshot);
 *   - a snapshot older than the (now 14d) threshold produces a staleness WARN;
 *   - a catalog id the snapshot marks deprecated produces an ERROR + exit 1.
 *
 * Self-contained: builds fixture research snapshots in a temp dir and runs the real CLI.
 *   node scripts/models/check.test.js
 */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const CHECK = path.join(ROOT, "scripts", "models", "check.js");
const { PROVIDERS } = require(path.join(ROOT, "scripts", "dispatch", "catalog.js"));

let passed = 0;
const failures = [];
function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
}

// Build a fixture research dir with an openai.json snapshot of a chosen age, listing the live
// catalog ids as "current" (so no spurious not-found WARNs) and optionally marking one deprecated.
const DAY = 86_400_000;
function mkFixture({ ageDays, msAgo, deprecateId }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mc-check-"));
  const ms = msAgo != null ? msAgo : ageDays != null ? ageDays * DAY : 3 * DAY;
  // full ISO (NOT date-only) so the exact-ms staleness boundary (W0 review MED-4) is testable.
  const fetched_at = new Date(Date.now() - ms).toISOString();
  const liveIds = (PROVIDERS.openai.models || []).map((m) => m.id);
  const snap = {
    fetched_at,
    deprecations: deprecateId ? [{ id: deprecateId, migrate_to: "gpt-5.5" }] : [],
    ghost_watch: [],
    models: liveIds.map((id) => ({ id, status: "current" })),
    newest_flagship: PROVIDERS.openai.defaultModel || "gpt-5.5",
  };
  fs.writeFileSync(path.join(dir, "openai.json"), JSON.stringify(snap));
  return dir;
}

function run(dir) {
  // --provider openai scopes the run to our single fixture snapshot. exit 1 (ERROR present)
  // makes execFileSync throw; the JSON is still on stdout.
  try {
    const out = execFileSync("node", [CHECK, "--json", "--provider", "openai", "--research-dir", dir], { encoding: "utf8" });
    return { code: 0, json: JSON.parse(out) };
  } catch (e) {
    return { code: e.status, json: JSON.parse(e.stdout) };
  }
}

test("honest age: --json snapshots[] always carries the vendor's age", () => {
  const dir = mkFixture({ ageDays: 3 });
  const { json } = run(dir);
  assert.ok(
    Array.isArray(json.snapshots) && json.snapshots.some((s) => s.provider === "openai" && s.ageDays === 3),
    `expected snapshots[] with openai ageDays=3, got: ${JSON.stringify(json.snapshots)}`,
  );
});

test("stale snapshot (20d > 14d) → staleness WARN", () => {
  const dir = mkFixture({ ageDays: 20 });
  const { json } = run(dir);
  assert.ok(
    json.findings.some((f) => f.level === "WARN" && /stale|old/i.test(f.message)),
    `expected a staleness WARN, got: ${JSON.stringify(json.findings)}`,
  );
});

test("fresh under the new 14d threshold (10d) → no staleness WARN", () => {
  const dir = mkFixture({ ageDays: 10 });
  const { json } = run(dir);
  assert.ok(
    !json.findings.some((f) => /\bold\b|\bstale\b/i.test(f.message)),
    `expected no staleness WARN at 10d, got: ${JSON.stringify(json.findings)}`,
  );
});

test("deprecated catalog id → ERROR + exit 1", () => {
  const liveId = (PROVIDERS.openai.models || []).map((m) => m.id).find((id) => id !== "gpt-5.5") || PROVIDERS.openai.models[0].id;
  const dir = mkFixture({ ageDays: 3, deprecateId: liveId });
  const { code, json } = run(dir);
  assert.ok(
    json.findings.some((f) => f.level === "ERROR" && f.id === liveId),
    `expected an ERROR for ${liveId}, got: ${JSON.stringify(json.findings)}`,
  );
  assert.equal(code, 1, "a deprecated catalog id must exit 1");
});

test("LOW-5: a missing snapshot still appears in --json snapshots[] (status:missing)", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mc-check-empty-")); // no openai.json written
  const { json } = run(dir);
  assert.ok(
    Array.isArray(json.snapshots) &&
      json.snapshots.some((s) => s.provider === "openai" && s.status === "missing" && s.ageDays === null),
    `a missing snapshot must be in snapshots[]: ${JSON.stringify(json.snapshots)}`,
  );
});

test("MED-4: staleness uses exact ms — 14d+1h old WARNs, 14d-1h old does not", () => {
  const over = run(mkFixture({ msAgo: 14 * DAY + 3_600_000 }));
  assert.ok(over.json.findings.some((f) => /stale|old/i.test(f.message)), "14d+1h old must WARN");
  const under = run(mkFixture({ msAgo: 14 * DAY - 3_600_000 }));
  assert.ok(!under.json.findings.some((f) => /stale|old/i.test(f.message)), "14d-1h old must NOT WARN");
});

if (failures.length) {
  process.stderr.write(`FAIL [models/check.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [models/check.test] ${passed} passed\n`);
