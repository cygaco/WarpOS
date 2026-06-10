#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// permission-profile.test.js — S-LC-07 WORK §2. The auto/notice/confirm/never
// permission profile + the HONESTY invariant (β RESIDUAL 2, P-061).
//
//   - push-to-main scope is `confirm` — NEVER auto/notice.
//   - a planted profile claiming auto-push is REJECTED/flagged.
//   - the load-bearing classifier comment travels WITH the push entry.
//   - classifier-honored scopes (spend/commit/branch) resolve `auto`.
//   - the never-allowed ceilings resolve `never`.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const profile = require(path.join(ROOT, "scripts", "turbo", "permission-profile.js"));

let pass = 0;
let fail = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL  ${name}\n      ${e.stack || e.message}`);
  }
}

// ── The table is EXPLICIT + canonical-honest ─────────────────────────────────
ok("the canonical profile passes the honesty invariant", () => {
  const v = profile.validateProfile();
  assert.strictEqual(v.ok, true, "canonical profile must be honest: " + v.violations.join("; "));
  assert.strictEqual(v.violations.length, 0);
});

ok("push-to-main is `confirm` (never auto/notice)", () => {
  assert.strictEqual(profile.PROFILE["push-to-main"].level, "confirm");
  assert.strictEqual(profile.levelFor("push-to-main"), "confirm");
  assert.notStrictEqual(profile.levelFor("push-to-main"), "auto");
  assert.notStrictEqual(profile.levelFor("push-to-main"), "notice");
});

ok("the load-bearing classifier comment is present on the push entry", () => {
  const note = profile.PROFILE["push-to-main"].note;
  assert.ok(/classifier/i.test(note), "note must reference the classifier");
  assert.ok(/2026-06-09/.test(note), "note must carry the proof date");
  assert.ok(/SURFACES the push requirement/i.test(note), "note must say it surfaces, not satisfies");
  // The exported constant is the verbatim-equivalent comment.
  assert.ok(/above permissions.allow/i.test(profile.LOAD_BEARING_COMMENT));
});

// ── THE HONESTY INVARIANT: planted overclaim is rejected ─────────────────────
ok("a planted profile claiming auto-push is REJECTED (honesty violation)", () => {
  const planted = profile.getProfile();
  planted["push-to-main"].level = "auto"; // the P-061 overclaim
  const v = profile.validateProfile(planted);
  assert.strictEqual(v.ok, false, "auto-push must be rejected");
  assert.ok(
    v.violations.some((x) => /HONESTY VIOLATION/i.test(x) && /push-to-main/i.test(x)),
    "violation must name the push-to-main honesty breach",
  );
});

ok("a planted profile claiming notice-push is also rejected", () => {
  const planted = profile.getProfile();
  planted["push-to-main"].level = "notice";
  const v = profile.validateProfile(planted);
  assert.strictEqual(v.ok, false);
  assert.ok(v.violations.some((x) => /push-to-main/i.test(x)));
});

ok("merge-to-main may not be auto either", () => {
  const planted = profile.getProfile();
  planted["merge-to-main"].level = "auto";
  const v = profile.validateProfile(planted);
  assert.strictEqual(v.ok, false);
});

// ── classifier-honored scopes resolve auto (within ceilings) ─────────────────
ok("classifier-honored scopes (spend/commit/branch) resolve `auto`", () => {
  assert.strictEqual(profile.levelFor("spend"), "auto");
  assert.strictEqual(profile.levelFor("commit"), "auto");
  assert.strictEqual(profile.levelFor("branch"), "auto");
});

ok("downgrading a classifier-honored scope from auto is flagged", () => {
  const planted = profile.getProfile();
  planted.spend.level = "confirm";
  const v = profile.validateProfile(planted);
  assert.strictEqual(v.ok, false, "spend should be auto");
});

// ── never-allowed ceilings resolve `never` ───────────────────────────────────
ok("the hard ceilings resolve `never`", () => {
  for (const s of ["force-push-main", "backup-branch-delete", "signup", "purchase", "secrets"]) {
    assert.strictEqual(profile.levelFor(s), "never", `${s} must be never`);
  }
});

ok("lifting a hard ceiling off `never` is a CEILING VIOLATION", () => {
  const planted = profile.getProfile();
  planted.signup.level = "auto";
  const v = profile.validateProfile(planted);
  assert.strictEqual(v.ok, false);
  assert.ok(v.violations.some((x) => /CEILING VIOLATION/i.test(x)));
});

// ── governed scopes are confirm ──────────────────────────────────────────────
ok("deps/auth/env/delete/migrate/deploy are `confirm`", () => {
  for (const s of ["deps", "auth", "env", "delete", "migrate", "deploy"]) {
    assert.strictEqual(profile.levelFor(s), "confirm", `${s} must be confirm`);
  }
});

// ── explicit table: every entry declares a known level ───────────────────────
ok("every scope declares one of the four explicit levels (not inferred)", () => {
  for (const [scope, entry] of Object.entries(profile.PROFILE)) {
    assert.ok(profile.LEVELS.includes(entry.level), `${scope} has an invalid level "${entry.level}"`);
  }
});

ok("levelFor is case-insensitive and null for undeclared scopes", () => {
  assert.strictEqual(profile.levelFor("PUSH-TO-MAIN"), "confirm");
  assert.strictEqual(profile.levelFor("not-a-real-scope"), null);
});

console.log(`\nS-LC-07 permission-profile: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
