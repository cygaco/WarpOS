#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// gui-readonly-endpoints.test.js — SP-20260615-002 S-2 / AC-R2b [β-3]
//
// ::write-endpoints-absent-not-merely-unreachable-only-get-board-served
//   READ-ONLY is a hard boundary. Asserted two ways (presence-of-absence):
//     RUNTIME: POST /api/save, POST /api/revert, POST /api/preview, and any non-GET
//       on /api/board → 404/405 (never 200). GET /api/board IS served; GET / and
//       GET /api/health are the only other GETs.
//     STATIC: the SOURCE neither require()s nor references the write modules
//       (./save, ./backup) or the write verbs (applySave/restoreBackup/createBackup/
//       previewSave/readJson) and declares no mutating route handler. A planted
//       write handler FAILS.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const SCRIPT = path.join(ROOT, "scripts", "panel", "roadmap-gui.js");
const SRC = fs.readFileSync(SCRIPT, "utf8");

let pass = 0, fail = 0;
function ok(name, cond, msg) {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}\n      ${msg || ""}`); }
}

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[\t ]*\/\/.*$/gm, "");
}
const CODE = stripComments(SRC);

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
      if (m) { clearTimeout(t); resolve({ child, port: Number(m[2]), token: m[3] }); }
    });
    child.on("error", reject);
  });
}

function request(method, urlPath, port, token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, path: `/${token}${urlPath}`, method },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      },
    );
    req.on("error", reject);
    req.setTimeout(8000, () => req.destroy(new Error("request timeout")));
    req.end();
  });
}

async function main() {
  // ── STATIC: presence-of-absence over the source ──────────────────────────────
  ok("source does NOT require ./save or ./backup", !/require\(\s*["']\.\/(save|backup)["']\s*\)/.test(CODE), "a write/backup module is required");
  ok("source references no write verb (applySave/previewSave/restoreBackup/createBackup/listBackups)", !/\b(applySave|previewSave|restoreBackup|createBackup|listBackups)\b/.test(CODE), "a write verb is referenced");
  ok("source has no readJson body-parser (no request-body ingestion path)", !/\bfunction\s+readJson\b/.test(CODE) && !/\breadJson\s*\(/.test(CODE), "a request-body parser is present");
  ok("source declares no POST/PUT/PATCH/DELETE route branch", !/req\.method\s*===\s*["'](POST|PUT|PATCH|DELETE)["']/.test(CODE), "a mutating method branch is present");
  ok("source contains no fs write verb (writeFileSync/appendFileSync/rename/unlink)", !/fs\s*\.\s*(writeFileSync|writeFile|appendFileSync|appendFile|renameSync|rename|unlinkSync|unlink|rmSync|mkdirSync)\s*\(/.test(CODE), "an fs write call is present");

  // ── RUNTIME: write endpoints absent, only GET board served ───────────────────
  const { child, port, token } = await startServer();
  try {
    for (const ep of ["/api/save", "/api/revert", "/api/preview"]) {
      const r = await request("POST", ep, port, token);
      ok(`POST ${ep} is NOT 200 (404/405)`, r.status === 404 || r.status === 405, `status ${r.status}`);
    }
    const postBoard = await request("POST", "/api/board", port, token);
    ok("POST /api/board is NOT 200 (405 method-not-allowed)", postBoard.status === 404 || postBoard.status === 405, `status ${postBoard.status}`);
    const putHealth = await request("PUT", "/api/health", port, token);
    ok("PUT /api/health is NOT 200", putHealth.status === 404 || putHealth.status === 405, `status ${putHealth.status}`);

    // The ONLY data route that IS served:
    const getBoard = await request("GET", "/api/board", port, token);
    ok("GET /api/board IS served (200)", getBoard.status === 200, `status ${getBoard.status}`);
    const parsed = JSON.parse(getBoard.body);
    ok("GET /api/board returns the roadmap summary JSON", parsed && Array.isArray(parsed.sectionsUnavailable), "board JSON shape unexpected");

    // The other two GETs:
    const getHealth = await request("GET", "/api/health", port, token);
    ok("GET /api/health → 200 {ok:true}", getHealth.status === 200 && JSON.parse(getHealth.body).ok === true, `status ${getHealth.status}`);
    const getRoot = await request("GET", "/", port, token);
    ok("GET /<token>/ → 200 (HTML)", getRoot.status === 200, `status ${getRoot.status}`);

    // A made-up data route → 404 (no catch-all 200).
    const bogus = await request("GET", "/api/anything-else", port, token);
    ok("unknown GET route → 404", bogus.status === 404, `status ${bogus.status}`);
  } finally {
    child.kill("SIGTERM");
  }

  console.log(`\ngui-readonly-endpoints: ${pass}/${pass + fail} pass`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
