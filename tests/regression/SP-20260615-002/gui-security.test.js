#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// gui-security.test.js — SP-20260615-002 S-2 / AC-R2a [β-5]
//
// ::loopback-403-token-404-osport-nostore-nosniff
//   Starts scripts/panel/roadmap-gui.js in --review-mode, reads the EXACT URL off
//   stdout, then probes the running server:
//     (i)   binds 127.0.0.1 on an OS-chosen port (port != 0, reachable on loopback)
//     (ii)  a non-loopback remoteAddress → 403 (asserted via the isLoopback guard
//           in buildHandler with a faked socket)
//     (iii) any path WITHOUT the 256-bit hex token → 404
//     (iv)  every response carries cache-control:no-store + x-content-type-options:nosniff
//   These mirror scripts/dispatch/gui.js exactly.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const SCRIPT = path.join(ROOT, "scripts", "panel", "roadmap-gui.js");

let pass = 0, fail = 0;
function ok(name, cond, msg) {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}\n      ${msg || ""}`); }
}

// Start the server in review-mode (keepalive, no browser) and resolve once we read
// the stable ROADMAP_GUI_URL line off stdout.
function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [SCRIPT, "--review-mode", "--no-open"], {
      cwd: ROOT, stdio: ["ignore", "pipe", "pipe"],
    });
    let buf = "";
    const t = setTimeout(() => { child.kill("SIGTERM"); reject(new Error("timeout waiting for URL line")); }, 20000);
    child.stdout.on("data", (d) => {
      buf += d.toString();
      const m = /ROADMAP_GUI_URL\s+(http:\/\/127\.0\.0\.1:(\d+)\/([0-9a-f]{64})\/)/.exec(buf);
      if (m) { clearTimeout(t); resolve({ child, url: m[1], port: Number(m[2]), token: m[3] }); }
    });
    child.on("error", reject);
  });
}

function get(url, opts) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, opts || {}, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject);
    req.setTimeout(8000, () => req.destroy(new Error("request timeout")));
  });
}

async function main() {
  const { child, url, port, token } = await startServer();
  try {
    // (i) OS-chosen port — non-zero, and the canonical URL is reachable.
    ok("binds an OS-chosen port (listen(0) → non-zero port)", port > 0, `port was ${port}`);
    ok("URL carries a 256-bit (64-hex) token", /^[0-9a-f]{64}$/.test(token), token);

    const root = await get(url);
    ok("GET /<token>/ returns 200 (HTML)", root.status === 200, `status ${root.status}`);
    ok("response carries cache-control: no-store", root.headers["cache-control"] === "no-store", root.headers["cache-control"]);
    ok("response carries x-content-type-options: nosniff", root.headers["x-content-type-options"] === "nosniff", root.headers["x-content-type-options"]);

    // (iv) the no-store/nosniff headers also ride the board + a 404.
    const apiBoard = await get(`http://127.0.0.1:${port}/${token}/api/board`);
    ok("api/board 200 + no-store + nosniff", apiBoard.status === 200 && apiBoard.headers["cache-control"] === "no-store" && apiBoard.headers["x-content-type-options"] === "nosniff", `status ${apiBoard.status}`);

    // (iii) any path WITHOUT the token → 404.
    const noToken = await get(`http://127.0.0.1:${port}/`);
    ok("path without token → 404", noToken.status === 404, `status ${noToken.status}`);
    const wrongToken = await get(`http://127.0.0.1:${port}/${"0".repeat(64)}/`);
    ok("wrong token → 404", wrongToken.status === 404, `status ${wrongToken.status}`);

    // (ii) non-loopback remoteAddress → 403. Exercise the actual handler with a
    // faked non-loopback socket (the real socket is always 127.0.0.1 in-process).
    const { buildHandler } = require(SCRIPT);
    const handler = buildHandler(token, ROOT, { cancelPendingShutdown() {} });
    const fakeReq = { url: `/${token}/`, method: "GET", socket: { remoteAddress: "10.1.2.3" } };
    let statusCode = 0, ended = false;
    const fakeRes = {
      set statusCode(v) { statusCode = v; },
      get statusCode() { return statusCode; },
      end() { ended = true; },
      writeHead() {},
    };
    handler(fakeReq, fakeRes);
    ok("non-loopback remoteAddress → 403", statusCode === 403 && ended, `statusCode ${statusCode}`);

    const fakeReqLoop = { url: `/${token}/api/health`, method: "GET", socket: { remoteAddress: "127.0.0.1" } };
    let loopStatus = 0;
    const fakeResLoop = {
      writeHead(s) { loopStatus = s; },
      end() {},
      setHeader() {},
    };
    handler(fakeReqLoop, fakeResLoop);
    ok("loopback remoteAddress is NOT 403 (health → 200)", loopStatus === 200, `status ${loopStatus}`);
  } finally {
    child.kill("SIGTERM");
  }

  console.log(`\ngui-security: ${pass}/${pass + fail} pass`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
