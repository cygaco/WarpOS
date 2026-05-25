"use strict";
/**
 * scripts/bootstrap/phases/preflight.js — the pre-flight install gate for the
 * bootstrap:spinup orchestrator (SP-20260525-023, ticket T-20260525-236).
 *
 * Phase 0 / hard gate (β: refuse a gappy install before any phase runs). Shells
 * to the existing scripts/check/install.js (exit 0 = complete incl. the WG-4
 * sprint-subsystem probe; exit 1 = incomplete OR not a WarpOS repo). A gappy
 * install is a hard refuse — no phase side-effects.
 *
 * runCheck is injectable so the e2e can drive pass/refuse deterministically
 * without standing up a real install.
 */

const path = require("path");
const { spawnSync } = require("child_process");

function defaultRunCheck(repoRoot) {
  const script = path.join(repoRoot, "scripts", "check", "install.js");
  const r = spawnSync(process.execPath, [script, "--json"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return { code: r.status == null ? 1 : r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}

module.exports = {
  name: "preflight",
  defaultRunCheck,
  async run(ctx) {
    const runCheck = (ctx.args && ctx.args._runCheck) || defaultRunCheck;
    ctx.log("running /check:install (incl. WG-4 sprint probe)...");
    const res = runCheck(ctx.repoRoot);
    if (res.code === 0) {
      return { ok: true, status: "done", message: "install complete", data: { exit: 0 } };
    }
    return {
      ok: false,
      status: "failed",
      message:
        "install incomplete or not a WarpOS repo (/check:install exit " +
        res.code +
        ") — refusing to proceed. Run /warp:setup (or fix the gaps) first.",
      data: { exit: res.code },
    };
  },
};
