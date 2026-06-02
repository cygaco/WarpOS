#!/usr/bin/env node
"use strict";
/**
 * scripts/bootstrap/phases/onscreen.js — Phase 5 of the bootstrap:spinup chain
 * (SP-20260525-023, ticket T-20260525-240). Satisfies S-5 (AC-5.1, AC-5.2).
 *
 * The on-screen phase targets Milestone-1's FIRST sprint for execution and
 * gates "the core loop is up" behind a verify-before-claim serve check.
 *
 * Two parts, deliberately split so the gate is unit-testable in isolation:
 *
 *   • verifyServe(opts)  (DETERMINISTIC, PURE, INJECTABLE): the core deliverable.
 *     A serve gate that refuses "it builds" as evidence. `pass` is TRUE only if
 *     ALL hold:
 *         (build clean OR no buildCmd)
 *       AND  a dev server returns HTTP 200 on localhost
 *       AND (entry module transforms OR no entryModule).
 *     A non-200 from the server forces pass:false EVEN when the build succeeded —
 *     this is the "builds != serves" guard (β Q(b)). A pre-existing live node
 *     process / worktree is NOT accepted as evidence: the only evidence is a live
 *     HTTP 200 probe of the URL we were handed. runCmd/httpGet are injectable
 *     seams (default to real node child_process / http impls) so the e2e drives
 *     pass/fail deterministically without standing up a real server.
 *
 *   • run(ctx)  (LLM-ORCHESTRATED): actually executing Milestone-1's first sprint
 *     until it serves is product-side work an in-process node driver can't do, so
 *     run() returns needs_orchestration with an orchestration_prompt. Canonical
 *     only proves the CHAIN on a fixture (β Q(c)); verifyServe is the testable
 *     artifact. The skill body (Alpha/spinup.md) fulfills the prompt product-side
 *     and gates completion with verifyServe.
 *
 * Phase-module contract (see scripts/bootstrap/spinup-orchestrate.js):
 *   ctx = { repoRoot, product, intentFile, cloneTarget, outDir, research,
 *           dryRun, args, log }
 *   run(ctx) → { ok, status: "done"|"needs_orchestration"|"failed",
 *                message, data?, orchestration_prompt? }
 *
 * No external deps; real impls shell to node http/child_process only.
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const net = require("net");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

// ── Real runner seam ────────────────────────────────────────────────────────
// Runs a shell command and returns its exit code + captured output. Used for
// both the build command and the entry-module transform check. Replaced in
// tests via opts.runCmd so the gate runs without real builds.
function defaultRunCmd(cmd, cwd) {
  const r = spawnSync(cmd, {
    cwd,
    shell: true,
    encoding: "utf8",
    windowsHide: true,
  });
  if (r.error) {
    return { code: r.status == null ? 1 : r.status, stdout: r.stdout || "", stderr: r.error.message };
  }
  return { code: r.status == null ? 1 : r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}

function npmCmd() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function runNpm(args, cwd, timeout) {
  const command = [npmCmd(), ...args].join(" ");
  const r = spawnSync("cmd.exe", ["/d", "/s", "/c", command], {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    timeout,
  });
  if (r.error) {
    return { code: r.status == null ? 1 : r.status, stdout: r.stdout || "", stderr: r.error.message };
  }
  return { code: r.status == null ? 1 : r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}

function findFreePort(start) {
  return new Promise((resolve) => {
    const tryPort = (port) => {
      const server = net.createServer();
      server.once("error", () => tryPort(port + 1));
      server.once("listening", () => {
        server.close(() => resolve(port));
      });
      server.listen(port, "127.0.0.1");
    };
    tryPort(start);
  });
}

async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let last = { status: 0 };
  while (Date.now() < deadline) {
    last = await defaultHttpGet(url);
    if (last.status === 200) return last;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return last;
}

function startDevServer(repoRoot, port) {
  const command = `${npmCmd()} run dev -- --hostname 127.0.0.1 --port ${port}`;
  const child = spawn(
    "cmd.exe",
    ["/d", "/s", "/c", command],
    {
      cwd: repoRoot,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    },
  );
  child.unref();
  return child.pid || null;
}

// ── Real probe seam ───────────────────────────────────────────────────────────
// Probes a URL and resolves to its HTTP status. Never rejects — a connection
// refused / timeout / DNS error resolves to status 0 (which the gate reads as
// "not serving"). Replaced in tests via opts.httpGet. A pre-existing live node
// process counts for NOTHING here: only a real status code from THIS URL does.
function defaultHttpGet(url) {
  return new Promise((resolve) => {
    let mod;
    let target;
    try {
      target = new URL(url);
      mod = target.protocol === "https:" ? https : http;
    } catch {
      resolve({ status: 0 });
      return;
    }
    let settled = false;
    const done = (status) => {
      if (settled) return;
      settled = true;
      resolve({ status });
    };
    const req = mod.get(url, { timeout: 5000 }, (res) => {
      const status = res.statusCode || 0;
      // Drain so the socket can close; we only care about the status line.
      res.resume();
      done(status);
    });
    req.on("error", () => done(0));
    req.on("timeout", () => {
      req.destroy();
      done(0);
    });
  });
}

/**
 * verifyServe — the verify-before-claim serve gate (AC-5.2). Pure + injectable.
 *
 * opts = {
 *   buildCmd: string|null,    // e.g. "npm run build"; null/empty → build check skipped
 *   serveUrl: string,          // e.g. "http://localhost:5173"
 *   entryModule: string|null,  // path that must transform without error; null → skipped
 *   cwd: string,
 *   runCmd?: (cmd, cwd) => ({ code, stdout, stderr }),
 *   httpGet?: (url) => Promise<{ status }>,
 * }
 * returns { pass: bool, checks: { build: bool|null, http200: bool, entryTransforms: bool|null }, reasons: string[] }
 */
async function verifyServe(opts) {
  const o = opts || {};
  const buildCmd = o.buildCmd || null;
  const serveUrl = o.serveUrl || null;
  const entryModule = o.entryModule || null;
  const cwd = o.cwd || process.cwd();
  const runCmd = typeof o.runCmd === "function" ? o.runCmd : defaultRunCmd;
  const httpGet = typeof o.httpGet === "function" ? o.httpGet : defaultHttpGet;

  const checks = { build: null, http200: false, entryTransforms: null };
  const reasons = [];

  // ── Check 1: build exits clean (skipped when no buildCmd given) ────────────
  if (buildCmd) {
    let r;
    try {
      r = runCmd(buildCmd, cwd);
    } catch (e) {
      r = { code: 1, stdout: "", stderr: e.message };
    }
    checks.build = r && r.code === 0;
    if (checks.build) reasons.push(`build OK ('${buildCmd}' exit 0)`);
    else reasons.push(`build FAILED ('${buildCmd}' exit ${r ? r.code : "?"})`);
  } else {
    reasons.push("build check skipped (no buildCmd)");
  }

  // ── Check 2: dev server returns HTTP 200 on localhost ──────────────────────
  // This is the load-bearing guard: a live 200 is the ONLY accepted evidence of
  // "on screen". "It builds" does not satisfy this; neither does a stray node
  // process. A non-200 (or no server) forces the whole gate to fail.
  if (serveUrl) {
    let probe;
    try {
      probe = await httpGet(serveUrl);
    } catch (e) {
      probe = { status: 0 };
      reasons.push(`serve probe threw: ${e.message}`);
    }
    const status = probe && typeof probe.status === "number" ? probe.status : 0;
    checks.http200 = status === 200;
    if (checks.http200) reasons.push(`serve OK (HTTP 200 from ${serveUrl})`);
    else reasons.push(`serve FAILED (HTTP ${status || "no-response"} from ${serveUrl}; builds != serves)`);
  } else {
    checks.http200 = false;
    reasons.push("serve FAILED (no serveUrl to probe; cannot confirm on-screen)");
  }

  // ── Check 3: entry module transforms without error (skipped when none) ─────
  if (entryModule) {
    // Default transform = `node --check <entryModule>`; tests inject runCmd to
    // exercise both branches without a real transform pipeline.
    const transformCmd = `node --check "${entryModule}"`;
    let r;
    try {
      r = runCmd(transformCmd, cwd);
    } catch (e) {
      r = { code: 1, stdout: "", stderr: e.message };
    }
    checks.entryTransforms = r && r.code === 0;
    if (checks.entryTransforms) reasons.push(`entry transforms OK (${entryModule})`);
    else reasons.push(`entry transform FAILED (${entryModule}, exit ${r ? r.code : "?"})`);
  } else {
    reasons.push("entry transform check skipped (no entryModule)");
  }

  // ── Verdict ────────────────────────────────────────────────────────────────
  // pass ONLY if: (build clean OR no build) AND http200 AND (entry OK OR none).
  const buildOk = checks.build === null || checks.build === true;
  const entryOk = checks.entryTransforms === null || checks.entryTransforms === true;
  const pass = Boolean(buildOk && checks.http200 && entryOk);

  return { pass, checks, reasons };
}

async function run(ctx) {
  const { product, log, repoRoot, dryRun } = ctx;

  // S0.3: ensure the app scaffold exists before handing off — you cannot get
  // "on screen" without an app to serve. Deterministic + idempotent (skips when a
  // package.json already exists, e.g. /portfolio:new already scaffolded) +
  // fail-open (a scaffold error must NOT break the phase). npm install is left to
  // the product-side orchestrator (the scaffold ships pinned deps, not modules).
  let scaffoldNote = "";
  if (!dryRun && repoRoot) {
    try {
      const pkgPath = require("path").join(repoRoot, "package.json");
      if (!require("fs").existsSync(pkgPath)) {
        const { scaffoldApp } = require("../../scaffold/app");
        const slug = String(product || require("path").basename(repoRoot) || "app")
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/^-+|-+$/g, "");
        const res = scaffoldApp({ repoRoot, slug, install: false, log: log || (() => {}) });
        if (res && res.ok && !res.alreadyPresent) {
          scaffoldNote = ` — app scaffold materialized (${res.created.length} files; run npm install before serving)`;
          if (log) log(`on-screen: app scaffold materialized (${res.created.length} files)`);
        }
      }
    } catch (e) {
      if (log) log(`on-screen: app scaffold skipped (non-fatal): ${e.message}`);
    }
  }

  if (ctx.args && ctx.args.auto) {
    if (dryRun) {
      return {
        ok: true,
        status: "done",
        message: "[dry-run] automatic on-screen launch planned",
        data: {
          serveUrl: "http://127.0.0.1:<free-port>/",
          firstAction: "S1: Bring the first usable screen up locally from the generated scaffold.",
        },
      };
    }

    const packagePath = path.join(repoRoot, "package.json");
    if (!fs.existsSync(packagePath)) {
      return {
        ok: false,
        status: "failed",
        message: "automatic on-screen launch requires package.json after app scaffold",
      };
    }

    if (!fs.existsSync(path.join(repoRoot, "node_modules"))) {
      if (log) log("on-screen: installing app dependencies...");
      const install = runNpm(["install", "--no-audit", "--no-fund"], repoRoot, 600_000);
      if (install.code !== 0) {
        return {
          ok: false,
          status: "failed",
          message: `npm install failed during automatic on-screen launch: ${(install.stderr || install.stdout || "").trim().slice(-800)}`,
        };
      }
    }

    if (log) log("on-screen: building generated app...");
    const build = runNpm(["run", "build"], repoRoot, 600_000);
    if (build.code !== 0) {
      return {
        ok: false,
        status: "failed",
        message: `npm run build failed during automatic on-screen launch: ${(build.stderr || build.stdout || "").trim().slice(-800)}`,
      };
    }

    const port = await findFreePort(3100);
    const serveUrl = `http://127.0.0.1:${port}/`;
    if (log) log(`on-screen: starting dev server at ${serveUrl}`);
    const pid = startDevServer(repoRoot, port);
    const probe = await waitForHttp(serveUrl, 45_000);
    if (probe.status !== 200) {
      return {
        ok: false,
        status: "failed",
        message: `dev server did not return HTTP 200 at ${serveUrl} (last status ${probe.status || "no-response"})`,
      };
    }

    return {
      ok: true,
      status: "done",
      message: `first screen is serving at ${serveUrl}`,
      data: {
        serveUrl,
        devServerPid: pid,
        firstAction: "S1: Bring the first usable screen up locally from the generated scaffold.",
      },
    };
  }

  // Targeting Milestone-1's first sprint (AC-5.1) and actually running it until
  // it serves is product-side, LLM-orchestrated work — a node process can't do
  // it. So we hand the orchestrator a prompt and the gate to verify with. In
  // canonical we only prove the chain; verifyServe is the testable artifact.
  if (log) {
    log(
      product
        ? `on-screen target: Milestone-1 first sprint for '${product}' (product-side execution)`
        : "on-screen target: Milestone-1 first sprint (product-side execution)",
    );
  }

  return {
    ok: false,
    status: "needs_orchestration",
    message: "on-screen execution is product-side" + scaffoldNote,
    orchestration_prompt:
      "Execute Milestone-1's first sprint product-side. The WarpOS app scaffold " +
      "(Next.js App Router + Tailwind v4 + shadcn/ui) is in place — run `npm install`, " +
      "then build features on the primitives in src/components/ui (never hand-roll raw " +
      "elements). Gate completion with verifyServe (build clean + HTTP 200 + entry " +
      "transforms). Do not claim success on build alone.",
  };
}

module.exports = {
  name: "onscreen",
  verifyServe,
  run,
};
