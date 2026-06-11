#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO = path.resolve(__dirname, "..", "..", "..");
const gen = path.join(REPO, "scripts", "canon", "generate.js");
const fixture = path.join(REPO, "scripts", "canon", "fixtures", "acme-intent.md");
const stackCheck = path.join(REPO, "scripts", "checks", "canon-tech-stack.js");
const { detectRepoState } = require(path.join(REPO, "scripts", "bootstrap", "lastmile", "lib", "detect"));
const { recommendStack } = require(path.join(REPO, "scripts", "bootstrap", "lastmile", "lib", "profiles"));

let pass = 0;
let fail = 0;

function test(name, fn) {
  try {
    fn();
    pass++;
    process.stdout.write(`ok ${name}\n`);
  } catch (e) {
    fail++;
    process.stdout.write(`FAIL ${name}\n  ${e.stack || e.message}\n`);
  }
}

function writeCanonStack(repo, payments) {
  const dir = path.join(repo, "_requirements", "00-canonical");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "DATA_AND_ACCOUNTS.md"),
    [
      "# Acme - Data & Accounts",
      "",
      "## Tech Stack",
      "| Layer | Declared Choice | Rationale |",
      "| --- | --- | --- |",
      "| Framework | Next.js | intake |",
      "| Database | Supabase | intake |",
      "| Authentication | Clerk | intake |",
      `| Payments | ${payments} | intake |`,
      "| Hosting | Vercel | intake |",
      "| Analytics | PostHog | intake |",
      "",
    ].join("\n"),
    "utf8",
  );
}

test("canon generation emits strict parseable Tech Stack", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "spf02-canon-"));
  const r = spawnSync(
    process.execPath,
    [gen, "--intent", fixture, "--product", "Acme", "--research", "off", "--out", out, "--json"],
    { cwd: REPO, encoding: "utf8" },
  );
  assert.strictEqual(r.status, 0, r.stderr || r.stdout);
  const check = spawnSync(process.execPath, [stackCheck, "--dir", out, "--strict-values", "--json"], {
    cwd: REPO,
    encoding: "utf8",
  });
  assert.strictEqual(check.status, 0, check.stderr || check.stdout);
  fs.rmSync(out, { recursive: true, force: true });
});

test("canon Tech Stack gate fails a missing block", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "spf02-missing-"));
  fs.writeFileSync(path.join(out, "DATA_AND_ACCOUNTS.md"), "# Acme\n\n## Data Model\nx\n", "utf8");
  const r = spawnSync(process.execPath, [stackCheck, "--dir", out, "--json"], {
    cwd: REPO,
    encoding: "utf8",
  });
  assert.strictEqual(r.status, 1, r.stderr || r.stdout);
  assert.match(r.stdout, /Tech Stack/);
  fs.rmSync(out, { recursive: true, force: true });
});

test("lastmile uses declared stack and emits drift on implementation mismatch", () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "spf02-lastmile-"));
  fs.writeFileSync(
    path.join(repo, "package.json"),
    JSON.stringify({ dependencies: { next: "latest", stripe: "latest" } }, null, 2),
    "utf8",
  );
  writeCanonStack(repo, "Paddle");
  const state = detectRepoState(repo);
  const rec = recommendStack(null, state);
  assert.strictEqual(rec.stack.db, "Supabase (declared)");
  assert.strictEqual(rec.stack.auth, "Clerk (declared)");
  assert.strictEqual(rec.stack.payments, "stripe (existing)");
  assert.ok(rec.stackDrift.some((e) => e.type === "stack_drift" && e.layer === "payments"));
  fs.rmSync(repo, { recursive: true, force: true });
});

process.stdout.write(`tech-stack-declaration: ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
