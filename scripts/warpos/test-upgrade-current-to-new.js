#!/usr/bin/env node
/**
 * scripts/warpos/test-upgrade-current-to-new.js
 *
 * GATE-B `upgrade_current_to_new` engine (SP-20260721-001 D-4 INC-3).
 *
 * The operator's D-4 standing standard #2 ("upgrade current->new works, for
 * real"): materializes a REAL N-1 install in a sandbox, runs the REAL
 * `update.js --apply` against it (never the --json CLI, which silent-greens a
 * Class-C/preflight-block — see Step 2 below), and proves canonical was never
 * touched (reuses GATE-A's sandbox-isolation harness verbatim).
 *
 * CHUNK 1 of 2 (this file): Step 0 (resolve N/N-1) -> Step 1 (materialize N-1
 * via git-tag worktree + its own install.ps1) -> Step 2 (real apply via
 * run()) -> isolation -> the cheap 3a version-sanity sanity check.
 * CHUNK 2 (not yet in this file): 3b (scan:install GREEN on the upgraded
 * tree) and 3c (fresh-N oracle parity via test-scaffold-all-ways#runLeg3).
 * Both are LOAD-BEARING per the build-spec's trust model; 3a alone never
 * gates a green verdict. Deliberately NOT stubbed here — they are simply not
 * yet emitted into `asserts`, which is why `ok` below only reflects Steps 0-2
 * + isolation + 3a.
 *
 * Usage:
 *   node scripts/warpos/test-upgrade-current-to-new.js [--json] [--timeout-ms <n>] [--help]
 *
 * Exit codes: 0 = every emitted assert passed + isolation held; 1 = an assert
 * failed, a required step didn't run, or isolation was violated; 2 = usage/
 * internal error (fail-CLOSED — a crash is never a pass).
 */
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const {
  assertSandboxTargetSafe,
  snapshotCanonicalState,
  noDeltaCheck,
  findPowershellReal,
} = require("./test-scaffold-all-ways");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_TIMEOUT_MS = 240_000;

// ── Step 0 — resolve N (current) and N-1 (highest release capsule < N) ─────
function semverParts(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(String(v || ""));
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)] : null;
}

function semverLt(a, b) {
  const pa = semverParts(a);
  const pb = semverParts(b);
  if (!pa || !pb) return false;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i];
  }
  return false;
}

function semverCompare(a, b) {
  const pa = semverParts(a);
  const pb = semverParts(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

// Fail-closed: throws if version.json is unreadable; returns n1:null (never a
// guess) if no capsule strictly below N exists under framework/releases/.
function resolveVersions() {
  const versionDoc = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "version.json"), "utf8"));
  const n = versionDoc.version;
  if (!n) throw new Error("version.json has no .version field");

  const releasesDir = path.join(REPO_ROOT, "framework", "releases");
  const candidates = fs
    .readdirSync(releasesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => semverParts(name) && semverLt(name, n))
    .sort(semverCompare);

  return { n, n1: candidates.length ? candidates[candidates.length - 1] : null };
}

function describeSpawnFailure(r) {
  if (!r) return "no result (spawn never returned)";
  if (r.error) return `spawn error: ${r.error.message}`;
  if (r.signal) return `TIMEOUT/KILLED (signal=${r.signal}) — fail-closed`;
  return `code=${r.status} ${(r.stderr || r.stdout || "").slice(-400)}`;
}

// ── Orchestration ────────────────────────────────────────────────────────────
async function runEngine({ timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const asserts = [];
  const assert = (name, ok, detail) => {
    asserts.push({ name, ok: !!ok, detail: ok ? "" : detail || "" });
    return !!ok;
  };

  let from_version = null;
  let to_version = null;
  let ran = false;
  let ps_available = null;

  const beforeSnapshot = snapshotCanonicalState();
  const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const tmpBase = path.join(os.tmpdir(), `warpos-gateb-${nonce}`);
  const n1Src = path.join(tmpBase, "n1-src");
  const n1Install = path.join(tmpBase, "n1-install");

  try {
    let proceed = true;

    // Step 0
    let versions = null;
    try {
      versions = resolveVersions();
    } catch (e) {
      assert("n1_resolved", false, `version resolution threw: ${e.message}`);
      proceed = false;
    }
    if (proceed) {
      to_version = versions.n;
      from_version = versions.n1;
      if (!from_version) {
        assert(
          "n1_resolved",
          false,
          `no release capsule under framework/releases/ strictly below N=${to_version} — fail-closed, never a silent green`,
        );
        proceed = false;
      } else {
        assert("n1_resolved", true, `N=${to_version} N-1=${from_version}`);
      }
    }

    // Pre-run sandbox guard (BINDING — checked before any sandbox I/O; reuses
    // GATE-A's proven harness rather than reinventing it).
    if (proceed) {
      try {
        assertSandboxTargetSafe(n1Src, { label: "n1-src worktree target" });
        assertSandboxTargetSafe(n1Install, { label: "n1-install sandbox target" });
        assert("sandbox_targets_safe", true, "");
      } catch (e) {
        assert("sandbox_targets_safe", false, e.message);
        proceed = false;
      }
    }

    // Step 1 — materialize a REAL N-1 install: git-tag worktree (the only
    // viable route — sealed capsules always source CURRENT bytes; the
    // synthetic fixture is a 4-file stand-in, not a real install).
    if (proceed) {
      fs.mkdirSync(tmpBase, { recursive: true });
      const tag = `warpos@${from_version}`;
      const wtAdd = spawnSync("git", ["worktree", "add", "--detach", n1Src, tag], {
        cwd: REPO_ROOT,
        encoding: "utf8",
        timeout: 60_000,
      });
      if (wtAdd.status !== 0) {
        assert("n1_worktree_materialized", false, `git worktree add ${n1Src} ${tag} failed: ${describeSpawnFailure(wtAdd)}`);
        proceed = false;
      } else {
        assert("n1_worktree_materialized", true, "");
      }
    }

    let ps = null;
    if (proceed) {
      ps = findPowershellReal();
      ps_available = !!ps;
      if (!ps) {
        // Skip-loud (R2 lineage): a no-PS host makes the engine INCOMPLETE,
        // never a silent pass.
        assert("ps_available", false, "no PowerShell found on this host — engine INCOMPLETE (skip-loud), not a pass");
        proceed = false;
      }
    }

    if (proceed) {
      const n1InstallPs1 = path.join(n1Src, "install.ps1");
      if (!fs.existsSync(n1InstallPs1)) {
        assert("n1_install_ps1_present", false, `expected ${n1InstallPs1} in the materialized N-1 worktree`);
        proceed = false;
      }
    }

    if (proceed) {
      fs.mkdirSync(n1Install, { recursive: true });
      const installRun = spawnSync(
        ps,
        ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", path.join(n1Src, "install.ps1"), "-Target", n1Install, "-SkipPrompt"],
        { cwd: n1Src, encoding: "utf8", timeout: timeoutMs },
      );
      const n1Installed = fs.existsSync(path.join(n1Install, ".claude", "framework-installed.json"));
      const installOk = installRun.status === 0 && n1Installed;
      assert(
        "n1_install_materialized",
        installOk,
        installOk
          ? ""
          : installRun.status !== 0
            ? `install.ps1 -Target ${n1Install} failed: ${describeSpawnFailure(installRun)}`
            : `install.ps1 exited 0 but no .claude/framework-installed.json under ${n1Install} — silent-downgrade class, not a real install`,
      );
      if (!installOk) proceed = false;
    }

    // Step 2 — real apply via run(), NEVER the --json CLI (which does
    // console.log(JSON.stringify(r)) BEFORE any process.exit, so a Class-C/
    // preflight-block run silent-greens at exit 0 — the exact trap this
    // engine exists to avoid).
    if (proceed) {
      ran = true;
      let r = null;
      try {
        // eslint-disable-next-line global-require
        const { run } = require("./update");
        r = await Promise.race([
          run({ to: to_version, source: REPO_ROOT, target: n1Install, apply: true, allRed: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("apply TIMEOUT (fail-closed backstop)")), timeoutMs)),
        ]);
      } catch (e) {
        assert("apply_committed", false, `run() threw or timed out: ${e.message}`);
        proceed = false;
      }
      if (proceed) {
        if (r && r.ok === true && r.committed === true) {
          assert("apply_committed", true, "");
        } else {
          assert("apply_committed", false, (r && r.error) || "run() returned ok:false with no error detail");
          proceed = false;
        }
      }
    }

    // Step 3a — version sanity, NON-LOAD-BEARING (β#1): reads a field
    // `update.js --apply` writes itself (a settable label, ED-225/227 class).
    // A cheap early signal only; 3b (scan:install) + 3c (fresh-N oracle
    // parity) — the LOAD-BEARING convergence-to-oracle checks — land in
    // chunk 2 and are what the verdict actually rests on.
    if (proceed) {
      let installedVersion = null;
      try {
        const fi = JSON.parse(fs.readFileSync(path.join(n1Install, ".claude", "framework-installed.json"), "utf8"));
        installedVersion = fi.installedVersion;
      } catch (e) {
        assert("version_sanity_NON_LOAD_BEARING", false, `could not read upgraded framework-installed.json: ${e.message}`);
        proceed = false;
      }
      if (proceed) {
        assert(
          "version_sanity_NON_LOAD_BEARING",
          installedVersion === to_version,
          `installedVersion=${installedVersion} expected=${to_version} (non-load-bearing settable-label check; defeated by 3c/3b in chunk 2, not absent here)`,
        );
      }
    }
  } catch (e) {
    assert("engine_uncaught_exception", false, e.message);
  } finally {
    // Clean ALL sandboxes here — pass AND fail.
    try {
      spawnSync("git", ["worktree", "remove", "--force", n1Src], { cwd: REPO_ROOT, encoding: "utf8", timeout: 60_000 });
    } catch {
      /* best-effort */
    }
    try {
      spawnSync("git", ["worktree", "prune"], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30_000 });
    } catch {
      /* best-effort */
    }
    try {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  }

  const afterSnapshot = snapshotCanonicalState();
  const delta = noDeltaCheck(beforeSnapshot, afterSnapshot);

  // Isolation is checked FIRST, unconditionally — a no-delta violation blocks
  // the verdict before any green, regardless of what the asserts say.
  const assertsOk = asserts.length > 0 && asserts.every((a) => a.ok);
  const ok = delta.equal && assertsOk;

  return {
    ok,
    from_version,
    to_version,
    ran,
    ps_available,
    asserts,
    sandbox_isolation: {
      no_delta: delta.equal,
      onlyBefore: delta.onlyBefore,
      onlyAfter: delta.onlyAfter,
    },
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { help: false, json: false, timeoutMs: DEFAULT_TIMEOUT_MS };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--json") out.json = true;
    else if (a === "--timeout-ms") out.timeoutMs = parseInt(argv[++i], 10) || DEFAULT_TIMEOUT_MS;
    else {
      process.stderr.write(`unknown argument: ${a}\n`);
      process.exit(2);
    }
  }
  return out;
}

function printHelp() {
  process.stdout.write(
    `Usage: node scripts/warpos/test-upgrade-current-to-new.js [--json] [--timeout-ms <n>] [--help]\n\n` +
      `Runs the GATE-B upgrade_current_to_new engine: materializes a real N-1\n` +
      `install (git-tag worktree + its own install.ps1), runs the real\n` +
      `update.js --apply against it, and proves canonical was never touched.\n`,
  );
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    return 0;
  }

  const result = await runEngine({ timeoutMs: opts.timeoutMs });
  if (opts.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else {
    process.stdout.write(`from_version=${result.from_version} to_version=${result.to_version} ran=${result.ran} ps_available=${result.ps_available}\n`);
    for (const a of result.asserts) {
      process.stdout.write(`[${a.ok ? "ok  " : "FAIL"}] ${a.name}${a.detail ? ` — ${a.detail}` : ""}\n`);
    }
    process.stdout.write(
      `sandbox-isolation no-delta: ${result.sandbox_isolation.no_delta ? "HELD" : "VIOLATED"}\n` +
        `overall=${result.ok ? "PASS" : "FAIL"}\n`,
    );
  }
  return result.ok ? 0 : 1;
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((e) => {
      process.stderr.write(`FATAL: ${(e && e.stack) || e}\n`);
      process.exit(2);
    });
}

module.exports = {
  REPO_ROOT,
  resolveVersions,
  runEngine,
};
