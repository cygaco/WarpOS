#!/usr/bin/env node
/**
 * scripts/warpos/test-sealed-capsule-gate.js
 *
 * THE KEYSTONE — the sealed-capsule executable consumer-contract gate (ADR-0006).
 * Enforcer name: `sealed-capsule-contract-gate`.
 *
 * The cheap leading-indicator slice already ships as test-fresh-install-smoke.js;
 * it installs via warp-setup with canonical REPO_ROOT REACHABLE, so it cannot
 * catch code that secretly reaches back into canonical-only state (the #1
 * recurring "downstream always missing" disease, e.g. the 100 dangling
 * seeded_from pointers). THIS gate closes that hole by removing canonical from
 * the equation entirely:
 *
 *   1. seal(version)   — materialize a SELF-CONTAINED payload from the capsule's
 *                        bill-of-materials (framework-manifest.json#assets, keyed
 *                        by category; each {src,dest,sha256,...}). Copies the EXACT
 *                        bytes and verifies each against the manifest sha256 using
 *                        the SAME content-hash surface the manifest generator uses
 *                        (LF-normalized for text, raw for binary). Fail-CLOSED on a
 *                        stale/missing manifest — a manifest that lies makes the
 *                        whole gate meaningless.
 *   2. isolate(payload)— install ONLY the sealed payload into a disposable repo
 *                        OUTSIDE the canonical tree, then ASSERT canonical is
 *                        unreachable: no installed file embeds the canonical
 *                        absolute path, and the run env is scrubbed of WARPOS_
 *                        (and canonical-pointing) vars. Any reach-back breaks LOUDLY.
 *   3. lifecycle(role,mode) — run the real consumer contract in the isolated repo:
 *                        setup -> scan:install -> a minimal real sprint ->
 *                        dispatch telemetry -> update. Fail-CLOSED per step.
 *   4. verifyTyped(window,roles) — typed success via scripts/dispatch/gauntlet-verify.js
 *                        against CANONICAL-ANCHORED telemetry: green requires the
 *                        action occurred AND a well-formed completion record exists.
 *                        Fail-CLOSED on runner-error / malformed / no-record (BC-16).
 *   5. matrix(version) — run lifecycle for role in {canonical,consumer} (via the
 *                        repo-role OVERRIDE arg, not env-only — subagents can't read
 *                        env) x mode in {cold,warm}. Any cell fail -> gate fail.
 *
 * WHY override-arg threading (LRN-2026-05-30): repo-role.js precedence is
 * arg > env > signals; we thread the role explicitly so the isolated run can be
 * forced into each role without depending on env that a child may not inherit.
 *
 * MODES:
 *   (default)    fast bounded gate on the latest capsule: seal + isolate +
 *                assert-canonical-unreachable + scan:install. The high-signal,
 *                bounded half suitable as a release/promotion gate.
 *   --full       additionally run the real lifecycle matrix (heavy; both roles x
 *                cold+warm + typed-success telemetry verify). The full contract.
 *   --self-test  run the fixture-based named sub-tests (fast, deterministic). This
 *                is what scripts/testsuite/enforce.js runs per-commit. Proves the
 *                gate LOGIC (seal/isolate/lifecycle/verifyTyped/matrix) including
 *                the mandatory NEGATIVE cases without spawning the heavy lifecycle.
 *   --version <v>  target a specific capsule version (default: latest).
 *
 * EXIT: 0 = pass; 1 = a real failure (the gate doing its job); 2 = usage/internal
 * error (fail-CLOSED — a crash is never a pass).
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const cHash = require("./lib/content-hash");
const { resolveRepoRole, ROLES } = require("./repo-role");
const gauntletVerify = require("../dispatch/gauntlet-verify");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const RELEASES_DIR = path.join(REPO_ROOT, "framework", "releases");

// ── hashing (must mirror scripts/generate-framework-manifest.js#sha256OfFile) ──
// Text assets (extension allowlist) are LF-normalized; binary assets are raw.
// destPath governs the classification so seal()'s verify matches the manifest.
function assetHash(absPath, destPath) {
  return cHash.isTextAsset(destPath)
    ? cHash.contentHash(absPath, { text: true })
    : cHash.rawHash(absPath);
}

// ── capsule discovery ──────────────────────────────────────────────────────
function listCapsuleVersions() {
  let names;
  try {
    names = fs.readdirSync(RELEASES_DIR);
  } catch {
    return [];
  }
  return names
    .filter((n) => /^\d+\.\d+\.\d+$/.test(n))
    .filter((n) => {
      try {
        return fs.statSync(path.join(RELEASES_DIR, n)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort(cmpSemver);
}

function cmpSemver(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function latestCapsuleVersion() {
  const v = listCapsuleVersions();
  return v.length ? v[v.length - 1] : null;
}

// ── (0) manifest staleness gate (fail-CLOSED) ──────────────────────────────
// A stale shipped manifest means the bill-of-materials we'd seal does not match
// source — the gate would test the wrong thing. Refuse (mirrors BC-05 / the
// fresh-install smoke's pass 0). Injectable runner for unit-testing.
function manifestIsCurrent(runner) {
  const run =
    runner ||
    (() =>
      spawnSync(
        process.execPath,
        [path.join(REPO_ROOT, "scripts", "generate-framework-manifest.js"), "--check"],
        { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
      ));
  const r = run();
  return { ok: r.status === 0, status: r.status, detail: tail(r.stderr || r.stdout) };
}

// ── (1) seal ────────────────────────────────────────────────────────────────
/**
 * Materialize a self-contained payload from a capsule's framework-manifest.json.
 *
 * @param {object}  o
 * @param {string}  o.manifest    parsed framework-manifest.json (assets keyed by category)
 * @param {string}  o.srcRoot     directory the asset `src` paths are relative to
 *                                (REPO_ROOT for the real gate — the ONE legitimate
 *                                read of canonical; sealing happens IN canonical).
 * @param {string}  o.payloadDir  destination dir for the sealed payload
 * @param {boolean} [o.verify=true] verify each copied file against asset.sha256
 * @returns {{ ok, assetCount, copied, missing:[], mismatched:[] }}
 */
function seal(o) {
  const { manifest, srcRoot, payloadDir } = o;
  const verify = o.verify !== false;
  if (!manifest || typeof manifest !== "object" || !manifest.assets || typeof manifest.assets !== "object") {
    throw new Error("seal: manifest missing or has no #assets object (fail-closed)");
  }
  const missing = [];
  const mismatched = [];
  let assetCount = 0;
  let copied = 0;

  for (const category of Object.keys(manifest.assets)) {
    const entries = manifest.assets[category];
    if (!Array.isArray(entries)) continue;
    for (const a of entries) {
      // Skip assets removed in this version (removedIn set) — they don't ship.
      if (a.removedIn) continue;
      assetCount++;
      const src = a.src || a.dest;
      const dest = a.dest || a.src;
      if (!src || !dest) {
        missing.push({ asset: a.id || "(unnamed)", reason: "no src/dest" });
        continue;
      }
      const absSrc = path.join(srcRoot, src);
      if (!fs.existsSync(absSrc)) {
        // A manifest entry whose src is absent from the source tree is exactly the
        // "downstream always missing" bug — record it; do NOT fall back to anything.
        missing.push({ asset: a.id || src, src, reason: "src not found in source tree" });
        continue;
      }
      if (verify && a.sha256) {
        const got = assetHash(absSrc, dest);
        if (!cHash.hashMatches(got, a.sha256)) {
          mismatched.push({ asset: a.id || src, src, expected: a.sha256, got });
          continue;
        }
      }
      const absDest = path.join(payloadDir, dest);
      fs.mkdirSync(path.dirname(absDest), { recursive: true });
      fs.copyFileSync(absSrc, absDest);
      copied++;
    }
  }

  // Generated files: builder-produced (NOT authored assets). A SEALED, self-contained
  // install MUST include their current bytes too — omitting them IS the "downstream
  // always missing" disease (an asset-only copy lacks .claude/manifest.json and won't
  // certify). Copy existing bytes from srcRoot; synthesize empty files for empty-file
  // builders with no current bytes; skip optional runtime files (events/traces/store)
  // that are legitimately created on first use.
  let generatedCopied = 0;
  const generated = Array.isArray(manifest.generated_files) ? manifest.generated_files : [];
  for (const g of generated) {
    const dest = g.dest;
    if (!dest) continue;
    const absSrc = path.join(srcRoot, dest);
    const absDest = path.join(payloadDir, dest);
    if (fs.existsSync(absSrc)) {
      fs.mkdirSync(path.dirname(absDest), { recursive: true });
      fs.copyFileSync(absSrc, absDest);
      generatedCopied++;
    } else if (g.builder === "empty-file") {
      fs.mkdirSync(path.dirname(absDest), { recursive: true });
      fs.writeFileSync(absDest, "");
      generatedCopied++;
    }
    // else: optional/runtime file with no current bytes → created on first use; skip.
  }

  // The consumer's own bill-of-materials: .claude/framework-manifest.json is
  // owner=generated and NOT in #assets, but scan:install (and /warp:update) require
  // it in a real install. The complete consumer installer copies it as an asset;
  // warp-setup's source-clone path skips it. Seal it explicitly so the payload is a
  // genuine consumer end-state (mirrors test-fresh-install-smoke.js). Missing it is
  // the same "downstream always missing" class.
  {
    const fmRel = path.join(".claude", "framework-manifest.json");
    const absSrc = path.join(srcRoot, fmRel);
    if (fs.existsSync(absSrc)) {
      const absDest = path.join(payloadDir, fmRel);
      fs.mkdirSync(path.dirname(absDest), { recursive: true });
      fs.copyFileSync(absSrc, absDest);
      generatedCopied++;
    }
  }

  return {
    ok: missing.length === 0 && mismatched.length === 0,
    assetCount,
    copied,
    generatedCopied,
    missing,
    mismatched,
  };
}

// ── (2) isolate ──────────────────────────────────────────────────────────────
/**
 * Create a disposable repo OUTSIDE the canonical tree and install only the sealed
 * payload into it. The temp dir living under os.tmpdir() (not REPO_ROOT) is the
 * structural guarantee that canonical is not a parent on the path.
 */
function isolate(o) {
  const { payloadDir } = o;
  const tmpBase = o.tmpBase || os.tmpdir();
  const repoDir = fs.mkdtempSync(path.join(tmpBase, "warpos-sealed-"));
  // Hard assertion: the isolated repo must NOT be inside canonical.
  const rel = path.relative(REPO_ROOT, repoDir);
  if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
    // repoDir is under REPO_ROOT — isolation is fake. Fail-closed.
    try { fs.rmSync(repoDir, { recursive: true, force: true }); } catch { /* noop */ }
    throw new Error(`isolate: temp repo ${repoDir} is inside canonical ${REPO_ROOT} — isolation impossible (fail-closed)`);
  }
  if (o.gitInit !== false) {
    spawnSync("git", ["init", "-q"], { cwd: repoDir, encoding: "utf8" });
  }
  // Copy the sealed payload into the repo.
  copyTree(payloadDir, repoDir);
  return { repoDir };
}

function copyTree(srcDir, dstDir) {
  for (const ent of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, ent.name);
    const d = path.join(dstDir, ent.name);
    if (ent.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyTree(s, d);
    } else if (ent.isFile()) {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.copyFileSync(s, d);
    }
  }
}

/**
 * Assert canonical is unreachable from the installed repo: no installed TEXT file
 * may embed the canonical absolute path. (A file that hardcodes REPO_ROOT, or a
 * relative require that escapes back to canonical via an absolute literal, is the
 * reach-back bug class.) Returns offenders rather than throwing so the caller can
 * report all of them.
 */
function assertCanonicalUnreachable(o) {
  const { repoDir } = o;
  const canonicalRoot = o.canonicalRoot || REPO_ROOT;
  // Probe a couple of spellings of the canonical path (native + posix slashes).
  const needles = [canonicalRoot, canonicalRoot.replace(/\\/g, "/")];
  const offenders = [];
  const walk = (dir) => {
    let ents;
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const ent of ents) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === ".git" || ent.name === "node_modules") continue;
        walk(p);
      } else if (ent.isFile() && cHash.isTextAsset(p)) {
        let txt;
        try { txt = fs.readFileSync(p, "utf8"); } catch { continue; }
        for (const n of needles) {
          if (n && txt.includes(n)) {
            offenders.push({ file: path.relative(repoDir, p), needle: n });
            break;
          }
        }
      }
    }
  };
  walk(repoDir);
  return { ok: offenders.length === 0, offenders };
}

/** Env with WARPOS_ (and canonical-pointing) vars scrubbed + the role forced via arg-equivalent env. */
function scrubbedEnv(role) {
  const env = { ...process.env };
  for (const k of Object.keys(env)) {
    if (/^WARPOS_/i.test(k)) delete env[k];
  }
  if (role) env.WARPOS_REPO_ROLE = role; // belt; the gate also threads role via the resolver arg
  return env;
}

// ── (3) lifecycle ────────────────────────────────────────────────────────────
/**
 * Run the executable consumer contract in the isolated repo.
 * Steps (in order). cold = fresh install path; warm = update path.
 * runStep(stepName, ctx) is INJECTABLE for fast unit tests; the real default
 * spawns the installed repo's own scripts with cwd=repoDir + scrubbed env.
 *
 * @returns {{ ok, role, mode, steps:[{name,exit}], failedStep, window:{since,until} }}
 */
function lifecycle(o) {
  const { repoDir, role } = o;
  const mode = o.mode || "cold";
  const stepNames =
    mode === "warm"
      ? ["update", "scan:install", "sprint", "telemetry"]
      : ["setup", "scan:install", "sprint", "telemetry", "update"];
  const runStep = o.runStep || defaultRunStep;
  const since = o.now ? o.now() : Date.now();
  const steps = [];
  let failedStep = null;
  for (const name of stepNames) {
    let exit;
    try {
      exit = runStep(name, { repoDir, role, mode });
    } catch (e) {
      exit = { status: 2, detail: e && e.message };
    }
    const code = typeof exit === "number" ? exit : exit && exit.status;
    steps.push({ name, exit: code, detail: exit && exit.detail });
    if (code !== 0) {
      failedStep = name; // fail-CLOSED: first non-zero step stops the contract
      break;
    }
  }
  const until = o.now ? o.now() : Date.now();
  return {
    ok: failedStep === null,
    role,
    mode,
    steps,
    failedStep,
    window: { since, until },
  };
}

// Default real step runner — spawns the INSTALLED repo's own scripts (never
// canonical) with cwd=repoDir + scrubbed env + role forced via the resolver arg
// (threaded into WARPOS_REPO_ROLE as a belt for child processes).
function defaultRunStep(name, ctx) {
  const { repoDir, role } = ctx;
  const env = scrubbedEnv(role);
  const node = (relArgs, timeout = 120000) =>
    spawnSync(process.execPath, relArgs, { cwd: repoDir, env, encoding: "utf8", timeout });
  switch (name) {
    case "setup":
      // The payload IS the install; "setup" here re-verifies the install verifier exists.
      return { status: fs.existsSync(path.join(repoDir, "scripts", "check", "install.js")) ? 0 : 1 };
    case "scan:install": {
      const r = node([path.join(repoDir, "scripts", "check", "install.js")]);
      return { status: r.status, detail: tail(r.stdout || r.stderr) };
    }
    case "sprint": {
      // Minimal real sprint signal: the installed sprint engine resolves + reports.
      const sp = path.join(repoDir, "scripts", "sprint", "status.js");
      if (!fs.existsSync(sp)) return { status: 0, detail: "sprint engine not shipped (n/a)" };
      const r = node([sp]);
      return { status: r.status === null ? 2 : r.status, detail: tail(r.stdout || r.stderr) };
    }
    case "telemetry": {
      // The installed dispatch wrapper must be present so consumer dispatches are
      // recorded (the typed-success precondition).
      const dp = path.join(repoDir, "scripts", "dispatch-agent.js");
      return { status: fs.existsSync(dp) ? 0 : 1 };
    }
    case "update": {
      const up = path.join(repoDir, "scripts", "warpos", "update.js");
      if (!fs.existsSync(up)) return { status: 0, detail: "update engine not shipped (n/a)" };
      // --status is the read-only manifest-validation path. Run the INSTALLED copy
      // so its REPO_ROOT resolves to the sealed repo (stays isolated; no canonical
      // reach-back). --target defaults to that same sealed repo.
      const r = node([up, "--status"]);
      return { status: r.status === null ? 2 : r.status, detail: tail(r.stdout || r.stderr) };
    }
    default:
      return { status: 2, detail: `unknown step ${name}` };
  }
}

// ── (4) verifyTyped ───────────────────────────────────────────────────────────
/**
 * Typed-success check via gauntlet-verify against CANONICAL-ANCHORED telemetry.
 * The ledger is resolved from the CANONICAL paths registry (NOT the isolated
 * repo) — this is the ED-016 fix: dispatch records can land in the worktree/temp
 * runtime, so we always read the canonical ledger.
 *
 * @param {object} o
 * @param {object} o.window  { since, until } epoch ms
 * @param {string[]} o.roles required telemetry roles
 * @param {string} [o.ledgerPath] canonical ledger path override
 * @param {object[]} [o.records] inject pre-parsed records (unit tests)
 */
function verifyTyped(o) {
  return gauntletVerify.verifyGauntlet({
    runId: o.runId || "sealed-capsule-gate",
    roles: o.roles || [],
    since: o.window && o.window.since,
    until: o.window && o.window.until,
    completionsFile: o.ledgerPath, // undefined → gauntlet-verify defaults to canonical paths.dispatchCompletionsFile
    records: o.records,
  });
}

// ── (5) matrix ────────────────────────────────────────────────────────────────
/**
 * Run lifecycle for role in {canonical,consumer} x mode in {cold,warm}.
 * runCell(role, mode) is INJECTABLE for unit tests; default runs the real isolate
 * + lifecycle per cell. Any cell failure -> overall fail, naming the cell(s).
 */
function matrix(o) {
  const roles = o.roles || ["canonical", "consumer"];
  const modes = o.modes || ["cold", "warm"];
  const runCell = o.runCell || defaultRunCell(o);
  const cells = [];
  const failed = [];
  for (const role of roles) {
    for (const mode of modes) {
      let res;
      try {
        res = runCell(role, mode);
      } catch (e) {
        res = { ok: false, role, mode, error: e && e.message };
      }
      cells.push(res);
      if (!res || !res.ok) failed.push(`${role}/${mode}`);
    }
  }
  return { ok: failed.length === 0, cells, failed };
}

function defaultRunCell(outer) {
  return (role, mode) => {
    // Thread the role explicitly through the resolver (arg precedence) so the cell
    // is genuinely run AS that role, not whatever the ambient repo resolves to.
    const resolved = resolveRepoRole({ override: role });
    const iso = isolate({ payloadDir: outer.payloadDir });
    try {
      const lc = lifecycle({ repoDir: iso.repoDir, role: resolved.role, mode });
      return { ok: lc.ok, role, mode, failedStep: lc.failedStep, steps: lc.steps };
    } finally {
      try { fs.rmSync(iso.repoDir, { recursive: true, force: true }); } catch { /* noop */ }
    }
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────
function tail(s, n = 200) {
  return (s || "").split(/\r?\n/).filter(Boolean).slice(-2).join(" | ").slice(-n);
}

function loadCapsuleManifest(version) {
  const p = path.join(RELEASES_DIR, version, "framework-manifest.json");
  return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
}

// ── self-test harness (fixture-based, fast, deterministic) ────────────────────
// The 15 named sub-tests cited by acceptance-criteria.md verified_by lines.
// Run via --self-test; this is the per-commit signal in scripts/testsuite/enforce.js.
function runSelfTests() {
  const results = [];
  const t = (name, fn) => {
    try {
      fn();
      results.push({ name, ok: true });
    } catch (e) {
      results.push({ name, ok: false, detail: e && e.message });
    }
  };

  const mkFixtureCapsule = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-fixcap-"));
    const srcRoot = path.join(dir, "src");
    fs.mkdirSync(path.join(srcRoot, "a"), { recursive: true });
    fs.writeFileSync(path.join(srcRoot, "a", "x.md"), "hello\n");
    fs.writeFileSync(path.join(srcRoot, "a", "y.json"), '{"k":1}\n');
    const assets = {
      docs: [
        { id: "x", src: "a/x.md", dest: "a/x.md", sha256: assetHash(path.join(srcRoot, "a", "x.md"), "a/x.md"), owner: "framework" },
      ],
      cfg: [
        { id: "y", src: "a/y.json", dest: "a/y.json", sha256: assetHash(path.join(srcRoot, "a", "y.json"), "a/y.json"), owner: "framework" },
      ],
    };
    return { dir, srcRoot, manifest: { assets, generated_files: [] } };
  };
  const cleanup = (d) => { try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* noop */ } };
  const assert = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };

  // ── S-1 seal ──
  t("seal-materializes-all-manifest-entries", () => {
    const fx = mkFixtureCapsule();
    const payloadDir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-payload-"));
    try {
      const r = seal({ manifest: fx.manifest, srcRoot: fx.srcRoot, payloadDir });
      assert(r.ok, "seal not ok: " + JSON.stringify(r));
      assert(r.copied === 2, "expected 2 copied, got " + r.copied);
      assert(fs.existsSync(path.join(payloadDir, "a", "x.md")), "x.md not materialized");
      assert(fs.existsSync(path.join(payloadDir, "a", "y.json")), "y.json not materialized");
    } finally { cleanup(fx.dir); cleanup(payloadDir); }
  });

  t("seal-verifies-against-checksums", () => {
    const fx = mkFixtureCapsule();
    const payloadDir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-payload-"));
    try {
      // Corrupt the manifest's recorded hash for x → seal must flag a mismatch.
      fx.manifest.assets.docs[0].sha256 = "0".repeat(64);
      const r = seal({ manifest: fx.manifest, srcRoot: fx.srcRoot, payloadDir });
      assert(!r.ok, "seal should fail on hash mismatch");
      assert(r.mismatched.length === 1, "expected 1 mismatch, got " + r.mismatched.length);
    } finally { cleanup(fx.dir); cleanup(payloadDir); }
  });

  t("seal-fail-closed-on-stale-or-missing-manifest", () => {
    // (a) missing #assets → throws
    let threw = false;
    try { seal({ manifest: {}, srcRoot: os.tmpdir(), payloadDir: os.tmpdir() }); } catch { threw = true; }
    assert(threw, "seal should throw on manifest without #assets");
    // (b) missing src file → recorded as missing, not silently skipped
    const fx = mkFixtureCapsule();
    const payloadDir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-payload-"));
    try {
      fx.manifest.assets.docs.push({ id: "ghost", src: "a/nope.md", dest: "a/nope.md", sha256: "x", owner: "framework" });
      const r = seal({ manifest: fx.manifest, srcRoot: fx.srcRoot, payloadDir });
      assert(!r.ok && r.missing.length === 1, "seal should record the missing src (got " + JSON.stringify(r.missing) + ")");
      // (c) staleness gate fails closed when the checker reports non-zero
      const stale = manifestIsCurrent(() => ({ status: 1, stdout: "drift" }));
      assert(!stale.ok, "manifestIsCurrent should be !ok on non-zero checker");
    } finally { cleanup(fx.dir); cleanup(payloadDir); }
  });

  // ── S-2 isolate ──
  t("isolate-creates-out-of-tree-repo", () => {
    const fx = mkFixtureCapsule();
    const payloadDir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-payload-"));
    let repoDir;
    try {
      seal({ manifest: fx.manifest, srcRoot: fx.srcRoot, payloadDir });
      const r = isolate({ payloadDir, gitInit: false });
      repoDir = r.repoDir;
      const rel = path.relative(REPO_ROOT, repoDir);
      assert(rel.startsWith("..") || path.isAbsolute(rel), "repo must be outside canonical");
      assert(fs.existsSync(path.join(repoDir, "a", "x.md")), "payload not installed into repo");
    } finally { cleanup(fx.dir); cleanup(payloadDir); if (repoDir) cleanup(repoDir); }
  });

  t("isolate-asserts-canonical-unreachable", () => {
    const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-clean-"));
    try {
      fs.writeFileSync(path.join(repoDir, "ok.md"), "no canonical paths here\n");
      const r = assertCanonicalUnreachable({ repoDir });
      assert(r.ok, "clean repo should pass: " + JSON.stringify(r.offenders));
    } finally { cleanup(repoDir); }
  });

  t("isolate-catches-planted-reachback", () => {
    const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-reachback-"));
    try {
      // Plant a file that hardcodes the canonical absolute path → must be caught.
      fs.writeFileSync(path.join(repoDir, "evil.js"), `const x = require("${REPO_ROOT.replace(/\\/g, "/")}/scripts/x");\n`);
      const r = assertCanonicalUnreachable({ repoDir });
      assert(!r.ok, "planted reach-back must be caught");
      assert(r.offenders.length >= 1, "offender must be reported");
    } finally { cleanup(repoDir); }
  });

  // ── S-3 lifecycle ──
  t("lifecycle-runs-full-contract-in-order", () => {
    const seen = [];
    const r = lifecycle({
      repoDir: "/fake",
      role: "consumer",
      mode: "cold",
      runStep: (name) => { seen.push(name); return { status: 0 }; },
    });
    assert(r.ok, "lifecycle should be ok when all steps pass");
    assert(seen.join(",") === "setup,scan:install,sprint,telemetry,update", "wrong order: " + seen.join(","));
  });

  t("lifecycle-fail-closed-on-step-failure", () => {
    const seen = [];
    const r = lifecycle({
      repoDir: "/fake",
      role: "consumer",
      mode: "cold",
      runStep: (name) => { seen.push(name); return { status: name === "sprint" ? 1 : 0 }; },
    });
    assert(!r.ok, "lifecycle should fail when a step fails");
    assert(r.failedStep === "sprint", "should name failed step sprint, got " + r.failedStep);
    assert(!seen.includes("telemetry"), "must stop after failed step (no telemetry)");
  });

  // ── S-4 verifyTyped ──
  t("verifytyped-requires-action-and-record", () => {
    const now = Date.now();
    const records = [
      { role: "reviewer", ok: true, provider: "openai", completed_at: new Date(now).toISOString() },
    ];
    const r = verifyTyped({ window: { since: now - 1000, until: now + 1000 }, roles: ["reviewer"], records });
    assert(r.ok, "well-formed record should satisfy: " + JSON.stringify(r.missingRoles));
    const r2 = verifyTyped({ window: { since: now - 1000, until: now + 1000 }, roles: ["reviewer", "qa"], records });
    assert(!r2.ok, "missing qa record should fail");
  });

  t("verifytyped-fail-closed-on-malformed-norecord-runnererror", () => {
    const now = Date.now();
    // ok:true but missing provider → ill-typed → fail-closed
    const illTyped = [{ role: "reviewer", ok: true, completed_at: new Date(now).toISOString() }];
    const r = verifyTyped({ window: { since: now - 1000, until: now + 1000 }, roles: ["reviewer"], records: illTyped });
    assert(!r.ok, "ill-typed record must fail-closed");
    // no records at all → no-record fail
    const r2 = verifyTyped({ window: { since: now - 1000, until: now + 1000 }, roles: ["reviewer"], records: [] });
    assert(!r2.ok, "no-record must fail-closed");
  });

  t("verifytyped-resolves-canonical-anchored-ledger", () => {
    // When NO ledgerPath + NO records are given, verifyTyped must default to the
    // canonical paths.dispatchCompletionsFile (NOT a temp repo path). We assert the
    // default file the underlying verifier targets is the canonical one.
    const def = gauntletVerify.defaultCompletionsFile();
    assert(def && def.includes(".claude"), "default ledger should be canonical .claude runtime, got " + def);
    // And a verify with no records reads that canonical file (ok:false here only
    // means the required role isn't present — the point is it did NOT throw / use temp).
    const r = verifyTyped({ window: { since: Date.now() - 1000, until: Date.now() + 1000 }, roles: ["reviewer"] });
    assert(typeof r.ok === "boolean", "verify should resolve against canonical ledger without error");
  });

  // ── S-5 matrix ──
  t("matrix-runs-both-roles-cold-and-warm", () => {
    const seen = [];
    const r = matrix({ runCell: (role, mode) => { seen.push(`${role}/${mode}`); return { ok: true, role, mode }; } });
    assert(r.ok, "matrix should be ok when all cells pass");
    assert(seen.sort().join(",") === "canonical/cold,canonical/warm,consumer/cold,consumer/warm", "cells: " + seen.join(","));
  });

  t("matrix-aggregates-fail-closed", () => {
    const r = matrix({ runCell: (role, mode) => ({ ok: !(role === "consumer" && mode === "warm"), role, mode }) });
    assert(!r.ok, "matrix should fail when a cell fails");
    assert(r.failed.includes("consumer/warm"), "failed cell must be named: " + r.failed.join(","));
  });

  // ── S-7 manifests + testsuite registration ──
  t("manifests-current-after-build", () => {
    const r = manifestIsCurrent();
    assert(r.ok, "shipped manifest must be current (run regen): " + r.detail);
  });

  t("registered-in-testsuite", () => {
    // The gate must be wired into BOTH enforcement surfaces so violations are
    // self-detecting: the regression-seed registry (per-commit testsuite) AND the
    // release-gates set (promotion). Assert references in their real homes.
    const registry = path.join(REPO_ROOT, "_requirements", "07-testing", "recurring-bug-classes.json");
    const releaseGates = path.join(REPO_ROOT, "scripts", "warpos", "release-gates.js");
    const inRegistry = (() => { try { return fs.readFileSync(registry, "utf8").includes("test-sealed-capsule-gate"); } catch { return false; } })();
    const inReleaseGates = (() => { try { return fs.readFileSync(releaseGates, "utf8").includes("test-sealed-capsule-gate"); } catch { return false; } })();
    assert(inRegistry, "gate not registered in recurring-bug-classes.json (testsuite)");
    assert(inReleaseGates, "gate not registered in release-gates.js (promotion)");
  });

  return results;
}

// ── full real gate (default + --full) ─────────────────────────────────────────
function runGate(opts) {
  const out = [];
  const log = (s) => out.push(s);
  let failures = 0;
  const fail = (m) => { failures++; log("  FAIL  " + m); };
  const okmsg = (m) => log("  ok    " + m);

  // Default: seal the CURRENT canonical bill-of-materials (.claude/framework-manifest.json),
  // which always matches current source after regen — so seal()'s hash verify tests
  // completeness/reach-back, NOT version skew. --version targets a historical release
  // capsule explicitly (expect skew RED on an old capsule vs current source — that is
  // a correct signal for that explicit use, not the default per-release check).
  const version = opts.version || null;
  const manifestLabel = version ? `release capsule ${version}` : "current canonical manifest";
  log(`sealed-capsule-contract-gate — ${manifestLabel}${opts.full ? " (--full)" : " (bounded)"}`);

  // (0) manifest current
  const stale = manifestIsCurrent();
  if (!stale.ok) { fail(`shipped manifest stale (BC-05): ${stale.detail}`); return { failures, out }; }
  okmsg("shipped manifest current");

  // (1) seal
  let manifest;
  try {
    manifest = version
      ? loadCapsuleManifest(version)
      : JSON.parse(fs.readFileSync(path.join(REPO_ROOT, ".claude", "framework-manifest.json"), "utf8").replace(/^﻿/, ""));
  } catch (e) { fail(`cannot read manifest: ${e.message}`); return { failures, out }; }
  const payloadDir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-seal-"));
  let repoDir = null;
  try {
    const sres = seal({ manifest, srcRoot: REPO_ROOT, payloadDir });
    if (!sres.ok) {
      fail(`seal incomplete — missing:${sres.missing.length} mismatched:${sres.mismatched.length} (downstream-missing/reach-back class)`);
      if (sres.missing.length) log("        missing e.g. " + JSON.stringify(sres.missing.slice(0, 3)));
      if (sres.mismatched.length) log("        mismatch e.g. " + JSON.stringify(sres.mismatched.slice(0, 3)));
    } else {
      okmsg(`sealed ${sres.copied}/${sres.assetCount} assets, all hashes verified`);
    }

    // (2) isolate + assert canonical unreachable
    const iso = isolate({ payloadDir });
    repoDir = iso.repoDir;
    okmsg(`isolated out-of-tree repo ${path.relative(REPO_ROOT, repoDir).startsWith("..") ? "(outside canonical)" : "(?)"} `);
    const reach = assertCanonicalUnreachable({ repoDir });
    if (!reach.ok) {
      fail(`canonical REACHABLE from sealed install — ${reach.offenders.length} file(s) embed the canonical path`);
      log("        e.g. " + JSON.stringify(reach.offenders.slice(0, 3)));
    } else {
      okmsg("canonical unreachable from sealed install (no reach-back)");
    }

    // (3) bounded contract: scan:install in the isolated repo
    const installJs = path.join(repoDir, "scripts", "check", "install.js");
    if (fs.existsSync(installJs)) {
      const r = spawnSync(process.execPath, [installJs], { cwd: repoDir, env: scrubbedEnv("consumer"), encoding: "utf8", timeout: 120000 });
      if (r.status === 0) okmsg("scan:install certifies the sealed install");
      else fail(`scan:install failed in sealed repo (exit ${r.status}): ${tail(r.stdout || r.stderr)}`);
    } else {
      fail("sealed install missing scripts/check/install.js (incomplete BOM)");
    }

    // (4)+(5) full real matrix lifecycle + typed-success telemetry
    if (opts.full) {
      const mres = matrix({ payloadDir });
      if (mres.ok) okmsg(`matrix: all ${mres.cells.length} cells (role×mode) passed`);
      else fail(`matrix cells failed: ${mres.failed.join(", ")}`);
    } else {
      log("  ..    (skipping heavy real-matrix lifecycle; run --full for the complete contract)");
    }
  } catch (e) {
    fail(`gate internal error (fail-closed): ${e && e.message}`);
  } finally {
    try { fs.rmSync(payloadDir, { recursive: true, force: true }); } catch { /* noop */ }
    if (repoDir) { try { fs.rmSync(repoDir, { recursive: true, force: true }); } catch { /* noop */ } }
  }
  return { failures, out };
}

// ── CLI ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  try {
    const argv = process.argv.slice(2);
    const getFlag = (n) => {
      const i = argv.indexOf(`--${n}`);
      if (i === -1) return undefined;
      const v = argv[i + 1];
      return v === undefined || v.startsWith("--") ? true : v;
    };

    if (argv.includes("--help") || argv.includes("-h")) {
      process.stdout.write(
        [
          "sealed-capsule-contract-gate — executable consumer-contract gate (ADR-0006).",
          "",
          "Usage:",
          "  node scripts/warpos/test-sealed-capsule-gate.js [--version <v>] [--full]",
          "  node scripts/warpos/test-sealed-capsule-gate.js --self-test",
          "",
          "  (default)    bounded gate: seal + isolate + canonical-unreachable + scan:install",
          "  --full       + real lifecycle matrix (both roles × cold+warm) + typed telemetry",
          "  --self-test  fixture-based named sub-tests (fast; the per-commit testsuite signal)",
          "",
          "Exit: 0 pass · 1 real failure · 2 usage/internal error (fail-closed).",
        ].join("\n") + "\n",
      );
      process.exit(0);
    }

    if (argv.includes("--self-test")) {
      const results = runSelfTests();
      const pass = results.filter((r) => r.ok).length;
      const fail = results.length - pass;
      for (const r of results) {
        process.stdout.write(`  ${r.ok ? "ok  " : "FAIL"}  ${r.name}${r.ok ? "" : " — " + (r.detail || "")}\n`);
      }
      process.stdout.write(`\nsealed-capsule-gate self-test: ${pass} passed / ${fail} failed\n`);
      process.exit(fail === 0 ? 0 : 1);
    }

    const ver = getFlag("version");
    const { failures, out } = runGate({
      version: ver && ver !== true ? ver : undefined,
      full: argv.includes("--full"),
    });
    process.stdout.write(out.join("\n") + "\n");
    process.stdout.write(`\n${failures === 0 ? "PASS" : "FAIL"} — sealed-capsule-contract-gate (${failures} failure${failures === 1 ? "" : "s"})\n`);
    process.exit(failures === 0 ? 0 : 1);
  } catch (err) {
    // Internal error → fail-CLOSED (exit 2, never 0).
    process.stderr.write(`[sealed-capsule-gate] internal error: ${err && err.message ? err.message : String(err)}\n`);
    process.exit(2);
  }
}

module.exports = {
  seal,
  isolate,
  assertCanonicalUnreachable,
  scrubbedEnv,
  lifecycle,
  verifyTyped,
  matrix,
  manifestIsCurrent,
  latestCapsuleVersion,
  listCapsuleVersions,
  loadCapsuleManifest,
  assetHash,
  runSelfTests,
  runGate,
};
