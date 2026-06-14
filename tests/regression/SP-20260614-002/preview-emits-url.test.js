#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// preview-emits-url.test.js — SP-20260614-002 S-6 / AC-R6a.
//
// On a successful boot the harness emits a STABLE, machine-readable preview URL
// (`PREVIEW_URL=http://localhost:<port>/admin`) so the deferred design-quality /
// visual-review Playwright lane can grep it and target the running Next app.
//
// Seam: real `npm run dev` is NOT spawned. We drive run() against a warm temp
// instance and stub the dev-server module export (startDevAndWaitReady) to a
// resolved {ok, port, child}, capturing stdout to assert the exact emitted line.
//
//   verified_by ::success-emits-stable-localhost-admin-url-for-playwright-handoff
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const preview = require("../../../scripts/admin/preview");

let pass = 0;
let fail = 0;
async function ok(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}
function tmpDir(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `admin-preview-${label}-`));
}

// Warm instance + a fake child + a port. Inject the dev-server + browser-open
// seams (the contract-endorsed test seam) so no real process is spawned; capture
// stdout to assert the exact emitted line.
async function runWithStubbedBoot({ port, route }) {
  const dir = tmpDir("emit");
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "admin-preview-instance" }));
  fs.mkdirSync(path.join(dir, "node_modules"), { recursive: true });

  const fakeChild = { pid: 4242, kill() {} };
  const deps = {
    startDevAndWaitReady: async () => ({ ok: true, port, child: fakeChild }),
    openInBrowser: () => {}, // never launch a browser in CI
  };

  const captured = [];
  const realWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk) => {
    captured.push(String(chunk));
    return true;
  };
  let res;
  try {
    const args = ["--instance-dir", dir];
    if (route) args.push("--route", route);
    res = await preview.run(args, deps);
  } finally {
    process.stdout.write = realWrite;
    fakeChild.kill();
  }
  return { res, out: captured.join(""), dir };
}

async function main() {
  await ok("success-emits-stable-localhost-admin-url-for-playwright-handoff: default /admin", async () => {
    const { res, out } = await runWithStubbedBoot({ port: 3000 });
    assert.strictEqual(res.ok, true, "boot must succeed");
    assert.ok(
      out.includes("PREVIEW_URL=http://localhost:3000/admin"),
      `exact PREVIEW_URL line must be emitted; got:\n${out}`,
    );
  });

  await ok("PREVIEW_URL stays the /admin home form even on a self-healed port", async () => {
    const { out } = await runWithStubbedBoot({ port: 3007 });
    assert.ok(
      out.includes("PREVIEW_URL=http://localhost:3007/admin"),
      "the machine-readable URL carries the ACTUAL port",
    );
  });

  await ok("PREVIEW_URL home form is stable even when a sub-route is opened", async () => {
    // The browser opens the sub-route, but the grep-able handoff line is the
    // /admin home (CONTRACT §B.6) so the Playwright lane has one stable anchor.
    const { out } = await runWithStubbedBoot({ port: 3000, route: "/admin/readiness" });
    assert.ok(
      out.includes("PREVIEW_URL=http://localhost:3000/admin"),
      "handoff line is the stable /admin home form regardless of opened sub-route",
    );
    assert.ok(
      out.includes("opened http://localhost:3000/admin/readiness"),
      "the actual opened URL still carries the sub-route",
    );
  });

  console.log(`\npreview-emits-url: ${pass}/${pass + fail} pass`);
  process.exit(fail ? 1 : 0);
}

main();
