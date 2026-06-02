#!/usr/bin/env node
/**
 * test-docker-secret-ignore.js — WG-31 test.
 *
 * Unit tests for the pure helpers + end-to-end exit-code tests against
 * throwaway fixture dirs. The load-bearing assertions are the NO-FALSE-RED
 * cases: a repo with no Dockerfile, or with secrets already in .dockerignore,
 * or with only narrow copies, must read green/skipped.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const SCRIPT = path.join(__dirname, "docker-secret-ignore.js");
const {
  hasBroadCopy,
  parseDockerignore,
  ignoreCovers,
} = require("./docker-secret-ignore.js");

let pass = 0;
let fail = 0;
function ok(name, cond, detail) {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass++;
  } else {
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
    fail++;
  }
}

// ── Unit: hasBroadCopy ────────────────────────────────────────────────
ok("broad: COPY . .", hasBroadCopy("FROM node\nCOPY . .\n"));
ok("broad: ADD . /app", hasBroadCopy("FROM node\nADD . /app\n"));
ok("broad: COPY ./ /app", hasBroadCopy("COPY ./ /app\n"));
ok(
  "broad: COPY --chown=node:node . .",
  hasBroadCopy("COPY --chown=node:node . .\n"),
);
ok("narrow: COPY package.json .", !hasBroadCopy("COPY package.json .\n"));
ok("narrow: COPY src/ ./src", !hasBroadCopy("COPY src/ ./src\n"));
ok("comment ignored", !hasBroadCopy("# COPY . .\nCOPY pkg.json .\n"));

// ── Unit: ignoreCovers ────────────────────────────────────────────────
{
  const ig = parseDockerignore(".env\n*.pem\nsecrets/\n");
  ok("covers exact .env", ignoreCovers(".env", ig));
  ok("covers *.pem glob", ignoreCovers("certs/server.pem", ig));
  ok("covers secrets/ dir", ignoreCovers("secrets/token.json", ig));
  ok("does NOT cover .env.local", !ignoreCovers(".env.local", ig));
}
{
  const ig = parseDockerignore("**/*.key\n");
  ok("covers **/*.key", ignoreCovers("config/app.key", ig));
}
{
  // Negation cancels coverage.
  const ig = parseDockerignore("*.env\n!.env.example\n");
  ok("negation re-includes .env.example", !ignoreCovers(".env.example", ig));
  ok("still covers .env via *.env", ignoreCovers(".env", ig));
}

// ── End-to-end exit-code tests ────────────────────────────────────────
function runE2E(setup) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "docker-sec-"));
  setup(dir);
  const r = spawnSync(process.execPath, [SCRIPT, "--target", dir, "--json"], {
    encoding: "utf8",
  });
  let parsed = {};
  try {
    parsed = JSON.parse(r.stdout || "{}");
  } catch {
    /* */
  }
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* */
  }
  return { code: r.status, status: parsed.status, findings: parsed.findings || [] };
}

// No Dockerfile → skipped (green exit).
{
  const r = runE2E((dir) => {
    fs.writeFileSync(path.join(dir, ".env"), "SECRET=1\n");
  });
  ok(
    "no Dockerfile → skipped, exit 0 (no false-RED)",
    r.status === "skipped" && r.code === 0,
    JSON.stringify(r),
  );
}

// Broad copy + unignored .env → RED (exit 1).
{
  const r = runE2E((dir) => {
    fs.writeFileSync(path.join(dir, "Dockerfile"), "FROM node\nCOPY . .\n");
    fs.writeFileSync(path.join(dir, ".env"), "SECRET=1\n");
  });
  ok(
    "broad copy + unignored .env → red, exit 1",
    r.status === "red" && r.code === 1 && r.findings.includes(".env"),
    JSON.stringify(r),
  );
}

// Broad copy + .env but .dockerignore excludes it → green.
{
  const r = runE2E((dir) => {
    fs.writeFileSync(path.join(dir, "Dockerfile"), "FROM node\nCOPY . .\n");
    fs.writeFileSync(path.join(dir, ".env"), "SECRET=1\n");
    fs.writeFileSync(path.join(dir, ".dockerignore"), ".env\n*.pem\n");
  });
  ok(
    "broad copy + .env excluded by .dockerignore → green, exit 0 (no false-RED)",
    r.status === "green" && r.code === 0,
    JSON.stringify(r),
  );
}

// Narrow copy only → green even with a secret present.
{
  const r = runE2E((dir) => {
    fs.writeFileSync(
      path.join(dir, "Dockerfile"),
      "FROM node\nCOPY package.json .\n",
    );
    fs.writeFileSync(path.join(dir, ".env"), "SECRET=1\n");
  });
  ok(
    "narrow copy + secret present → green, exit 0 (no false-RED)",
    r.status === "green" && r.code === 0,
    JSON.stringify(r),
  );
}

// Broad copy, no secrets in context → green.
{
  const r = runE2E((dir) => {
    fs.writeFileSync(path.join(dir, "Dockerfile"), "FROM node\nCOPY . .\n");
    fs.writeFileSync(path.join(dir, "app.js"), "console.log(1)\n");
  });
  ok(
    "broad copy, no secrets → green, exit 0",
    r.status === "green" && r.code === 0,
    JSON.stringify(r),
  );
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail > 0 ? 1 : 0);
