"use strict";
/**
 * git-scratch.js — shared scratch-git-repo helper for Seam E (protected-ref-transaction) falsifiers
 * (SP-20260720-002 Phase 4). NOT a falsifier itself — a test utility. Lives under falsifiers/_lib/ so every
 * Seam E fixture can spin up an isolated, throwaway git repo with the REAL hook installed, without ever
 * touching this repository's own `.git/hooks` (mirrors the reftxn probe's scratchpad discipline —
 * runtime/sp002-phase4/reftxn-probe-evidence.md).
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const HOOK_SRC = path.join(PROJECT_ROOT, "scripts", "hooks", "protected-ref-transaction.js");

function git(cwd, args, opts = {}) {
  return spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true, ...opts });
}

/** Create a fresh scratch repo (main branch, one seed commit). Returns the absolute dir path. */
function makeScratchRepo(tag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `sp002-reftxn-${tag}-`));
  git(dir, ["init", "-q", "-b", "main"]);
  git(dir, ["config", "user.email", "scratch@example.com"]);
  git(dir, ["config", "user.name", "Scratch"]);
  fs.writeFileSync(path.join(dir, "README.md"), "seed\n");
  git(dir, ["add", "."]);
  git(dir, ["commit", "-q", "-m", "seed"]);
  return dir;
}

/** Create a bare scratch remote (no working tree) — used to exercise `git push` as a write surface. */
function makeBareRemote(tag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `sp002-reftxn-bare-${tag}-`));
  git(dir, ["init", "-q", "--bare", "-b", "main"]);
  return dir;
}

/** Install the REAL protected-ref-transaction hook into `dir`'s `.git/hooks/` (or a bare repo's `hooks/`). */
function installHook(dir) {
  const hooksDir = path.join(dir, ".git", "hooks");
  const bareHooksDir = path.join(dir, "hooks");
  const hooksTarget = fs.existsSync(path.join(dir, ".git")) ? hooksDir : bareHooksDir;
  fs.mkdirSync(hooksTarget, { recursive: true });
  const target = path.join(hooksTarget, "reference-transaction");
  const body = `#!/usr/bin/env bash\nexec node "${HOOK_SRC.replace(/\\/g, "/")}" "$@"\n`;
  fs.writeFileSync(target, body);
  try {
    fs.chmodSync(target, 0o755);
  } catch {
    /* best-effort on platforms without a meaningful chmod */
  }
  return target;
}

function headSha(dir, ref) {
  const r = git(dir, ["rev-parse", "--verify", ref || "HEAD"]);
  return r.status === 0 ? r.stdout.trim() : null;
}

/** Build a fence env (spread over process.env) for a given lease acquisition. */
function fenceEnv(spId, token, leaseRoot, base = process.env) {
  return {
    ...base,
    WARPOS_CONTROLLER_FENCE_TOKEN: String(token),
    WARPOS_CONTROLLER_FENCE_SPID: spId,
    WARPOS_CONTROLLER_FENCE_LEASE_ROOT: leaseRoot,
  };
}

/** An env guaranteed to carry NO fence vars (strip any that leaked from the parent process). */
function noFenceEnv(base = process.env) {
  const env = { ...base };
  delete env.WARPOS_CONTROLLER_FENCE_TOKEN;
  delete env.WARPOS_CONTROLLER_FENCE_SPID;
  delete env.WARPOS_CONTROLLER_FENCE_LEASE_ROOT;
  return env;
}

function rmrf(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* best-effort cleanup */
  }
}

module.exports = {
  PROJECT_ROOT,
  HOOK_SRC,
  git,
  makeScratchRepo,
  makeBareRemote,
  installHook,
  headSha,
  fenceEnv,
  noFenceEnv,
  rmrf,
};
