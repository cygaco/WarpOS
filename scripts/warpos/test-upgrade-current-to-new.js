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
  runLeg3,
} = require("./test-scaffold-all-ways");
const { treeFileList, parityDiff } = require("./test-install-matrix");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_TIMEOUT_MS = 240_000;
const SCAN_INSTALL_TIMEOUT_MS = 60_000;
const ORACLE_TIMEOUT_MS = 180_000;

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

// ── Step 3 conformance — pure-ish helpers (factored so the self-test can feed
// them SYNTHETIC fixtures without a real 2-install run) ────────────────────

// (3a) NON-LOAD-BEARING settable-label check (β#1): reads a field
// `update.js --apply` writes itself. Catches a non-advancing version; does
// NOT prove correctness. Never allowed to gate `ok` alone (see runEngine's
// verdict wiring).
function check3aVersionSanity(installedVersion, expectedVersion) {
  const ok = installedVersion === expectedVersion;
  return {
    ok,
    detail: `installedVersion=${installedVersion} expected=${expectedVersion} (non-load-bearing settable-label check; defeated by 3c/3b, not absent here)`,
  };
}

// (3b) LOAD-BEARING schema-absolute check: scan:install GREEN on the
// upgraded tree, independent of anything the apply self-reports.
function check3bScanInstall(scanResult) {
  const ok = !!scanResult && scanResult.status === 0;
  return {
    ok,
    detail: ok ? "" : `scan:install exited non-zero: ${describeSpawnFailure(scanResult)}`,
  };
}

// (3c) LOAD-BEARING convergence-to-oracle — content-parity normalization
// (β#3, R4 lesson: MINIMAL, ENUMERATED, one-line why each). Each rule targets
// ONLY a named volatile-substring class. None touch `version`, non-volatile
// JSON fields, or file bodies broadly — a too-broad rule here would
// false-green a half-applied upgrade.
function replaceAllLiteral(haystack, needle, replacement) {
  if (!needle) return haystack;
  return haystack.split(needle).join(replacement);
}

// ORDER MATTERS: the exact-literal rule (absolute_sandbox_path) runs FIRST,
// before the generic pattern-based rules (iso_timestamp, per_run_nonce). A
// sandbox tmp-dir name can incidentally contain a substring shaped like a
// nonce (e.g. `...warpos-gateb-...`) — if a generic regex rule ran first it
// could partially consume an exact-path match, leaving the rest of that path
// unnormalized and producing a false content mismatch. Running the known
// exact substitution first, then generic patterns on what's left, avoids
// that class of order-dependent false-red.
const NORMALIZE_3C = [
  {
    name: "absolute_sandbox_path",
    why: "the upgraded tree and the fresh-N oracle tree live under two DIFFERENT os.tmpdir() sandbox roots minted once per engine run; a path pointing back at either root is sandbox-identity, never install content",
    apply: (text, ctx) => {
      let out = text;
      for (const root of (ctx && ctx.sandboxRoots) || []) {
        if (!root) continue;
        out = replaceAllLiteral(out, root, "<NORMALIZED-SANDBOX-PATH>");
        out = replaceAllLiteral(out, root.split(path.sep).join("/"), "<NORMALIZED-SANDBOX-PATH>");
        out = replaceAllLiteral(out, JSON.stringify(root).slice(1, -1), "<NORMALIZED-SANDBOX-PATH>");
      }
      return out;
    },
  },
  {
    name: "iso_timestamp",
    why: "install/apply/regen stamp real wall-clock ISO-8601 timestamps (installedAt, generatedAt, ...); two independent runs never share a clock reading by construction, not by upgrade defect",
    apply: (text) => text.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/g, "<NORMALIZED-TS>"),
  },
  {
    name: "per_run_nonce",
    why: "this engine mints a per-run nonce shaped `${Date.now().toString(36)}-${rand.toString(36).slice(2,8)}` for tmp-dir naming; if that shape leaks into an installed artifact it is run-identity, not upgrade content",
    apply: (text) => text.replace(/\b[0-9a-z]{6,13}-[0-9a-z]{4,8}\b/g, "<NORMALIZED-NONCE>"),
  },
  {
    name: "transaction_id",
    why: "update.js's transaction system stamps a fresh transaction id into per-run bookkeeping on every --apply; two independent runs never share one by design",
    apply: (text) => text.replace(/("(?:transactionId|transaction_id|txnId|txn_id)"\s*:\s*")[^"]*(")/g, "$1<NORMALIZED-TXN>$2"),
  },
];

function normalizeContent3c(text, ctx) {
  let out = text;
  for (const rule of NORMALIZE_3C) out = rule.apply(out, ctx);
  return out;
}

// Byte-exact except for the named normalization set. `commonRelPaths` is the
// intersection of the two trees' path sets (parityDiff already caught
// missing/extra files — this covers what parityDiff does NOT: divergent
// content in files present in both).
function compareTreeContents(treeA, treeB, commonRelPaths, ctx) {
  const mismatches = [];
  for (const rel of commonRelPaths) {
    let bufA;
    let bufB;
    try {
      bufA = fs.readFileSync(path.join(treeA, rel));
    } catch (e) {
      mismatches.push({ rel, reason: `unreadable in upgraded tree: ${e.message}` });
      continue;
    }
    try {
      bufB = fs.readFileSync(path.join(treeB, rel));
    } catch (e) {
      mismatches.push({ rel, reason: `unreadable in fresh-N tree: ${e.message}` });
      continue;
    }
    if (bufA.equals(bufB)) continue; // byte-identical — no normalization needed
    const normA = normalizeContent3c(bufA.toString("utf8"), ctx);
    const normB = normalizeContent3c(bufB.toString("utf8"), ctx);
    if (normA !== normB) {
      mismatches.push({ rel, reason: "content differs outside NORMALIZE_3C" });
    }
  }
  return { equal: mismatches.length === 0, mismatches };
}

// ── Orchestration ────────────────────────────────────────────────────────────
async function runEngine({ timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const asserts = [];
  // loadBearing defaults true — ONLY 3a (version_sanity_NON_LOAD_BEARING) is
  // marked false, per the β trust model: it may appear in `asserts` but must
  // NEVER be able to flip `ok` on its own.
  const assert = (name, ok, detail, opts) => {
    const loadBearing = !opts || opts.loadBearing !== false;
    asserts.push({ name, ok: !!ok, detail: ok ? "" : detail || "", loadBearing });
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
    // A cheap early signal only; never allowed to gate `ok` alone (loadBearing
    // false below). 3b (scan:install) + 3c (fresh-N oracle parity) — the
    // LOAD-BEARING convergence-to-oracle checks — are what the verdict
    // actually rests on.
    if (proceed) {
      let installedVersion = null;
      try {
        const fi = JSON.parse(fs.readFileSync(path.join(n1Install, ".claude", "framework-installed.json"), "utf8"));
        installedVersion = fi.installedVersion;
      } catch (e) {
        assert(
          "version_sanity_NON_LOAD_BEARING",
          false,
          `could not read upgraded framework-installed.json: ${e.message}`,
          { loadBearing: false },
        );
      }
      if (installedVersion !== null) {
        const r3a = check3aVersionSanity(installedVersion, to_version);
        assert("version_sanity_NON_LOAD_BEARING", r3a.ok, r3a.detail, { loadBearing: false });
      }
    }

    // Step 3b — scan:install GREEN on the UPGRADED tree (LOAD-BEARING): a
    // schema-absolute check independent of anything the apply self-reports.
    if (proceed) {
      const scan = spawnSync(process.execPath, [path.join(REPO_ROOT, "scripts", "check", "install.js")], {
        cwd: n1Install,
        encoding: "utf8",
        timeout: SCAN_INSTALL_TIMEOUT_MS,
      });
      const r3b = check3bScanInstall(scan);
      assert("scan_install_green_3b", r3b.ok, r3b.detail);
    }

    // Step 3c — fresh-N oracle parity (LOAD-BEARING, convergence-to-oracle,
    // β#2/#3/#4). The oracle is a REAL fresh-N install produced by GATE-A's
    // own runLeg3 (never the source tree, a fixture, or the apply's own
    // output re-used as its own oracle). `oracleRoot` lives under `tmpBase`
    // so the existing top-level `finally` cleanup below already reclaims it —
    // runLeg3 itself does NOT delete its sandbox.
    if (proceed) {
      const oracleRoot = path.join(tmpBase, "freshN");
      try {
        assertSandboxTargetSafe(oracleRoot, { label: "freshN oracle sandbox target" });
        const leg = runLeg3({ sandboxRoot: oracleRoot, timeoutMs: ORACLE_TIMEOUT_MS });
        const freshNTree = path.join(oracleRoot, "leg3-installps1");

        // runLeg3's OWN "both_path_parity" assertion is N/A here — we
        // deliberately do not pass a `leg2Dir` (there is no GATE-A Leg-2 tree
        // in this engine's flow), so that specific internal comparison
        // assertion always fails and must be excluded when judging whether
        // the ORACLE ITSELF materialized correctly. Every OTHER assertion
        // runLeg3 makes (framework-installed.json present, scan:install
        // GREEN, regenerate --check clean, complete-install path checks)
        // must still have passed.
        const legAsserts = (leg && Array.isArray(leg.asserts)) ? leg.asserts : [];
        const oracleCore = legAsserts.filter((a) => !/both_path_parity/.test(a.name));
        const oracleReady =
          !!leg &&
          leg.ran === true &&
          oracleCore.length > 0 &&
          oracleCore.every((a) => a.status === "pass") &&
          fs.existsSync(path.join(freshNTree, ".claude", "framework-installed.json"));

        if (!oracleReady) {
          const failed = oracleCore.filter((a) => a.status !== "pass").map((a) => a.name);
          assert(
            "fresh_n_oracle_ready_3c",
            false,
            `fresh-N oracle install INCOMPLETE (ps_available=${leg && leg.ps_available} ran=${leg && leg.ran}) — 3c skip-loud, NOT a pass: ${failed.join("; ") || "no oracle asserts produced"}`,
          );
        } else {
          const upgradedList = treeFileList(n1Install);
          const freshList = treeFileList(freshNTree);
          const pathParity = parityDiff(upgradedList, freshList);
          assert(
            "fresh_n_parity_pathset_3c",
            pathParity.equal,
            `onlyInUpgraded(${pathParity.onlyInA.length})=${pathParity.onlyInA.slice(0, 8).join(", ")} | onlyInFreshN(${pathParity.onlyInB.length})=${pathParity.onlyInB.slice(0, 8).join(", ")}`,
          );

          const freshSet = new Set(freshList);
          const commonPaths = upgradedList.filter((p) => freshSet.has(p));
          const ctx = { sandboxRoots: [n1Install, oracleRoot] };
          const contentResult = compareTreeContents(n1Install, freshNTree, commonPaths, ctx);
          assert(
            "fresh_n_parity_content_3c",
            contentResult.equal,
            contentResult.equal
              ? ""
              : `content diverges outside NORMALIZE_3C in ${contentResult.mismatches.length} file(s): ${contentResult.mismatches
                  .slice(0, 5)
                  .map((m) => `${m.rel} (${m.reason})`)
                  .join(", ")}`,
          );
        }
      } catch (e) {
        assert("fresh_n_oracle_ready_3c", false, `runLeg3/3c threw: ${e.message}`);
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
  // Verdict wiring (β trust model, DECIDE B/0.89): `ok` rests on isolation AND
  // every LOAD-BEARING assert (which includes 3b + 3c, plus every required
  // precondition step). 3a (version_sanity_NON_LOAD_BEARING) is excluded on
  // purpose — it can appear in `asserts` but must never flip `ok` alone.
  const loadBearingAsserts = asserts.filter((a) => a.loadBearing !== false);
  const assertsOk = loadBearingAsserts.length > 0 && loadBearingAsserts.every((a) => a.ok);
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

// ── Self-test — SYNTHETIC negative teeth (chunk 2, AP-8 reachability) ───────
// Fast, no real installs. Each tooth fails for its OWN reason (mirrors
// test-scaffold-all-ways.js's t()/selfTest() pattern).
function selfTest() {
  const results = [];
  const t = (name, fn) => {
    try {
      const r = fn();
      results.push({ name, status: r === false ? "fail" : "pass", detail: r === false ? "" : undefined });
    } catch (e) {
      results.push({ name, status: "fail", detail: e.message });
    }
  };

  // ── 3a tooth ──
  t("3a REDs on a synthetic upgraded install whose framework-installed.json still says N-1 (non-advancing version, NOT a correctness proof)", () => {
    return check3aVersionSanity("0.16.0", "0.17.0").ok === false;
  });
  t("3a positive control: installedVersion === N GREENs", () => {
    return check3aVersionSanity("0.17.0", "0.17.0").ok === true;
  });

  // ── 3b tooth ──
  t("3b REDs when scan:install exits non-zero (synthetic failing status)", () => {
    return check3bScanInstall({ status: 1, stdout: "", stderr: "synthetic scan:install failure" }).ok === false;
  });
  t("3b positive control: scan:install status 0 GREENs", () => {
    return check3bScanInstall({ status: 0, stdout: "", stderr: "" }).ok === true;
  });

  // ── 3c tooth (β#3 — the important one) ──
  t("3c content-parity REDs on divergence in a NORMALIZATION-EXCLUDED content region (not a timestamp/nonce/path/txn-id)", () => {
    const dirA = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-gateb-selftest-3c-red-a-"));
    const dirB = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-gateb-selftest-3c-red-b-"));
    try {
      fs.writeFileSync(
        path.join(dirA, "file.json"),
        '{"generatedAt":"2026-07-21T00:00:00.000Z","transactionId":"txn-aaa111","featureFlag":"on"}',
      );
      fs.writeFileSync(
        path.join(dirB, "file.json"),
        '{"generatedAt":"2026-07-21T00:00:01.000Z","transactionId":"txn-bbb222","featureFlag":"off"}',
      );
      const ctx = { sandboxRoots: [dirA, dirB] };
      const result = compareTreeContents(dirA, dirB, ["file.json"], ctx);
      // featureFlag on->off is real content drift outside NORMALIZE_3C — must RED.
      return result.equal === false;
    } finally {
      fs.rmSync(dirA, { recursive: true, force: true });
      fs.rmSync(dirB, { recursive: true, force: true });
    }
  });
  t("3c positive control: two trees differing ONLY in normalized volatile fields (timestamp + txn id) parity EQUAL (normalization works and isn't too narrow)", () => {
    const dirA = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-gateb-selftest-3c-green-a-"));
    const dirB = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-gateb-selftest-3c-green-b-"));
    try {
      fs.writeFileSync(
        path.join(dirA, "file.json"),
        '{"generatedAt":"2026-07-21T00:00:00.000Z","transactionId":"txn-aaa111","featureFlag":"on"}',
      );
      fs.writeFileSync(
        path.join(dirB, "file.json"),
        '{"generatedAt":"2026-07-21T00:05:32.114Z","transactionId":"txn-bbb222","featureFlag":"on"}',
      );
      const ctx = { sandboxRoots: [dirA, dirB] };
      const result = compareTreeContents(dirA, dirB, ["file.json"], ctx);
      return result.equal === true;
    } finally {
      fs.rmSync(dirA, { recursive: true, force: true });
      fs.rmSync(dirB, { recursive: true, force: true });
    }
  });
  t("3c positive control: absolute sandbox-root paths embedded in content are normalized away (sandbox identity, not upgrade content)", () => {
    const dirA = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-gateb-selftest-3c-path-a-"));
    const dirB = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-gateb-selftest-3c-path-b-"));
    try {
      fs.writeFileSync(path.join(dirA, "file.json"), JSON.stringify({ installedFrom: dirA }));
      fs.writeFileSync(path.join(dirB, "file.json"), JSON.stringify({ installedFrom: dirB }));
      const ctx = { sandboxRoots: [dirA, dirB] };
      const result = compareTreeContents(dirA, dirB, ["file.json"], ctx);
      return result.equal === true;
    } finally {
      fs.rmSync(dirA, { recursive: true, force: true });
      fs.rmSync(dirB, { recursive: true, force: true });
    }
  });

  // ── isolation tooth ──
  t("isolation tooth: noDeltaCheck REDs on a simulated delta (mirrors GATE-A's proven vector)", () => {
    const before = "a\nb\nc";
    const after = "a\nb\nc\nSIMULATED-DELTA-LINE";
    return noDeltaCheck(before, after).equal === false;
  });
  t("isolation tooth positive control: identical snapshots are equal", () => {
    const snap = "a\nb\nc";
    return noDeltaCheck(snap, snap).equal === true;
  });

  const pass = results.filter((r) => r.status === "pass").length;
  const fail = results.length - pass;
  return { ok: fail === 0, pass, fail, results };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { help: false, json: false, selfTest: false, timeoutMs: DEFAULT_TIMEOUT_MS };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--json") out.json = true;
    else if (a === "--selftest" || a === "--self-test") out.selfTest = true;
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
    `Usage: node scripts/warpos/test-upgrade-current-to-new.js [--json] [--timeout-ms <n>] [--selftest] [--help]\n\n` +
      `Runs the GATE-B upgrade_current_to_new engine: materializes a real N-1\n` +
      `install (git-tag worktree + its own install.ps1), runs the real\n` +
      `update.js --apply against it, and proves canonical was never touched.\n\n` +
      `--selftest   run the SYNTHETIC negative-tooth reachability suite (fast,\n` +
      `             no real installs) instead of the real 2-install engine.\n`,
  );
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    return 0;
  }

  if (opts.selfTest) {
    const st = selfTest();
    for (const r of st.results) {
      process.stdout.write(`[${r.status === "pass" ? "ok  " : "FAIL"}] ${r.name}${r.detail ? ` — ${r.detail}` : ""}\n`);
    }
    process.stdout.write(`selftest: pass=${st.pass} fail=${st.fail} overall=${st.ok ? "PASS" : "FAIL"}\n`);
    return st.ok ? 0 : 1;
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
  selfTest,
  check3aVersionSanity,
  check3bScanInstall,
  compareTreeContents,
  normalizeContent3c,
  NORMALIZE_3C,
};
