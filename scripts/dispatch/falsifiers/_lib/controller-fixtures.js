"use strict";
/**
 * controller-fixtures.js — shared trusted-controller.js / pinned-bundle test scaffolding (SP-20260720-002
 * Phase 4). NOT a falsifier — a test utility living under falsifiers/_lib/. Builds a REAL scratch git repo
 * (base + result commit), a REAL pinned checker bundle (via pinned-checker-bundle.js#buildBundle — the same
 * promotion path production uses), and a REAL conductor lease, so every controller-level falsifier exercises
 * the ACTUAL Seam A/B machinery rather than a mock.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const pcb = require("../../pinned-checker-bundle");
const lease = require("../../conductor-lease");

function sh(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: "utf8", windowsHide: true }).trim();
}

/**
 * makeControllerFixture(tag) -> {dir, outRoot, base, result, targetRef, manifestPath, bundleRoot, spId,
 * leaseRoot, leaseToken, cleanup()}. `targetRef` (`refs/heads/integ`) is pre-created pointing at `base`.
 */
function makeControllerFixture(tag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `sp002-ctl-${tag}-`));
  sh("git", ["init", "-q", "-b", "main"], dir);
  sh("git", ["config", "user.email", "scratch@example.com"], dir);
  sh("git", ["config", "user.name", "Scratch"], dir);
  fs.writeFileSync(path.join(dir, "f.txt"), "base\n");
  sh("git", ["add", "."], dir);
  sh("git", ["commit", "-q", "-m", "base"], dir);
  const base = sh("git", ["rev-parse", "HEAD"], dir);
  fs.writeFileSync(path.join(dir, "f.txt"), "result\n");
  sh("git", ["add", "."], dir);
  sh("git", ["commit", "-q", "-m", "result"], dir);
  const result = sh("git", ["rev-parse", "HEAD"], dir);
  const targetRef = "refs/heads/integ";
  sh("git", ["branch", "integ", base], dir);

  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), `sp002-bundle-${tag}-`));
  const { manifestPath, bundleRoot } = pcb.buildBundle({ outRoot, promotedBy: `falsifier-${tag}` });

  const spId = `SP-FALSIFIER-${tag.toUpperCase()}`;
  const leaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), `sp002-lease-${tag}-`));
  const acquired = lease.acquire(spId, { root: leaseRoot, sessionId: tag });

  return {
    dir,
    outRoot,
    base,
    result,
    targetRef,
    manifestPath,
    bundleRoot,
    spId,
    leaseRoot,
    leaseToken: acquired.token,
    cleanup() {
      for (const d of [dir, outRoot, leaseRoot]) {
        try {
          fs.rmSync(d, { recursive: true, force: true });
        } catch {
          /* best-effort */
        }
      }
    },
  };
}

/** A standard, valid controller `input` object for a fixture (a real WorkOrder with non-empty evidence — the
 *  content-addressed identity `authorizesIntegration` requires). */
function standardInput(fx, overrides = {}) {
  return {
    workorder: {
      schema_version: "workorder-min/v1",
      correlation_id: `corr-${fx.spId}`,
      role: "backend-builder",
      provider: "claude",
      model: "opus",
      base_commit: fx.base,
      result_tree_hash: "unused-superseded-by-controller-recompute",
      allowed_capabilities: ["build"],
      allowed_paths: ["scripts/"],
      retry_lineage: [],
      evidence_refs: ["ev-1"],
      terminal_state: "success",
      evidence: { "ev-1": "falsifier-evidence-blob" },
    },
    base_commit: fx.base,
    result_commit: fx.result,
    target_ref: fx.targetRef,
    result_envelope: { success: true, verdict: "accept" },
    ...overrides,
  };
}

/** The standard controller `opts` object for a fixture. */
function standardOpts(fx, overrides = {}) {
  return {
    bundleManifestPath: fx.manifestPath,
    bundleRoot: fx.bundleRoot,
    candidateRoot: fx.dir,
    gitRoot: fx.dir,
    performRefUpdate: true,
    spId: fx.spId,
    leaseRoot: fx.leaseRoot,
    ...overrides,
  };
}

/** A `checkContext` that forces the no-nul-bytes REQUIRED check to FAIL deterministically (a poisoned
 *  in-memory file — never touches real disk). */
const POISONED_CHECK_CONTEXT = { files: [{ path: "poison.bin", buf: Buffer.from([0x41, 0x00, 0x42]) }] };

module.exports = { makeControllerFixture, standardInput, standardOpts, POISONED_CHECK_CONTEXT };
