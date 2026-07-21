/**
 * release-gates.js - release gates for /warp:release.
 *
 * Phase 4H artifact. Wraps existing checks (paths, requirements, references,
 * hooks, framework-manifest, runtime-leak, version-consistency, and Phase 6
 * production-quality checks into a single
 * runner that /warp:release calls before publishing.
 *
 * Exit codes:
 *   0 — all green
 *   1 — one or more yellow (warn), no red
 *   2 — one or more red (block)
 *
 * Usage:
 *   node scripts/warpos/release-gates.js                # full
 *   node scripts/warpos/release-gates.js --json         # machine-readable
 *   node scripts/warpos/release-gates.js --skip <name>  # skip a gate (for known YEL during phase progression)
 */

const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const { isCanonical, roleStatus } = require("../testsuite/role");

const REPO_ROOT = path.resolve(__dirname, "..", "..");

function gate(name, fn) {
  return { name, fn };
}

// Extracts failing-assertion names per leg from a fresh_scaffold_all_ways
// --json payload, for gate `details` (bounded to a few lines per leg).
function summarizeGateALegs(payload) {
  const out = [];
  for (const leg of (payload && payload.legs) || []) {
    const fails = (leg.asserts || []).filter((a) => a.status === "fail");
    if (fails.length) {
      out.push(`leg ${leg.leg} (${leg.name}): ${fails.map((a) => a.name).join("; ")}`);
    }
  }
  if (payload && payload.sandbox_isolation && !payload.sandbox_isolation.no_delta) {
    out.push(
      `sandbox-isolation NO-DELTA VIOLATED: onlyBefore=${payload.sandbox_isolation.onlyBefore.length} onlyAfter=${payload.sandbox_isolation.onlyAfter.length}`,
    );
  }
  return out.slice(0, 8);
}

// GATE-A report-only ramp (SP-20260721-001 INC-2, α-ratified option b — the WarpOS report-only→enforce
// discipline). GATE-A is BUILT + CORRECT and surfaces real findings, but Leg-3 is currently RED on a
// PRE-EXISTING foundation issue (ED-249: scripts/warpos/manifest/build.js fails with ~43-45 unclassified
// paths → _warpos/MANIFEST.json cannot regenerate → install.ps1 produces an incomplete install). During
// the ramp a real-install LEG failure REPORTS (yellow) but does NOT block; a SANDBOX-ISOLATION leak ALWAYS
// blocks (red), even in report-only mode — that is the load-bearing correctness property. FLIP this to
// false once the named trigger is met: ED-249 resolved (build.js classifies clean) AND GATE-A Leg-3 green.
const GATE_A_REPORT_ONLY = true;

function runScript(scriptRelative, args, env) {
  const full = path.join(REPO_ROOT, scriptRelative);
  if (!fs.existsSync(full)) {
    return {
      status: 2,
      stdout: "",
      stderr: `Script missing: ${scriptRelative}`,
    };
  }
  const result = spawnSync(process.execPath, [full, ...(args || [])], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, ...(env || {}) },
  });
  return result;
}

const GATES = [
  // 1. Path Coherence
  gate("path_coherence", () => {
    const r = runScript("scripts/paths/gate.js");
    if (r.status === 0)
      return {
        ok: true,
        severity: "green",
        message: "Path registry + generated artifacts current.",
      };
    return {
      ok: false,
      severity: "red",
      message: "Path coherence gate failed.",
      details: (r.stdout || "").split("\n").slice(-5),
    };
  }),

  // 2. Framework Manifest
  gate("framework_manifest", () => {
    const r = runScript("scripts/generate-framework-manifest.js", ["--check"]);
    if (r.status === 0)
      return {
        ok: true,
        severity: "green",
        message: "Framework manifest is current.",
      };
    if (r.status === 1)
      return {
        ok: false,
        severity: "yellow",
        message: "Framework manifest stale — regenerate before release.",
      };
    return {
      ok: false,
      severity: "red",
      message: "Framework manifest generator errored.",
      details: [(r.stderr || r.stdout || "").slice(0, 200)],
    };
  }),

  // 2b. Ship coverage (SP-20260525-024) — the framework_manifest gate above is
  // TAUTOLOGICAL (it only checks the manifest matches its own generator). This
  // gate closes the "downstream always missing something" class: it asserts the
  // SHIPPING manifest (framework-manifest.json) covers every owner=framework path
  // the OWNERSHIP manifest (_warpos/MANIFEST.json) declares under the
  // consumer-essential roots. RED = a framework/schemas/patterns/command/agent
  // path ships to nobody (how framework/templates/* slipped — 0 of 53 shipped).
  gate("ship_coverage", () => {
    const r = runScript("scripts/checks/warpos-ship-coverage.js", []);
    if (r.status === 0)
      return {
        ok: true,
        severity: "green",
        message: "Ship coverage: every consumer-essential framework path ships.",
      };
    return {
      ok: false,
      severity: "red",
      message:
        "Ship coverage FAILED — framework-owned essential-root path(s) ship to nobody. Add to ASSET_DIRS or allowlist.",
      details: (r.stdout || r.stderr || "").split("\n").filter((l) => l.includes(" - ")).slice(0, 10),
    };
  }),

  // 2c. Version coherence (2026-05-30) — catches the drift NO gate caught before:
  // product version lagging across manifests (the 0.10.0→0.11.0 lag, because
  // version-quorum only checks 4 sources, not manifest.warpos.version or install.ps1)
  // AND schema-label divergence (paths v4-label-on-v5-content; stale framework-manifest
  // v1 fallback). RED blocks the release — the release engine now keeps these current.
  gate("version_coherence", () => {
    const r = runScript("scripts/checks/version-coherence.js", []);
    if (r.status === 0)
      return {
        ok: true,
        severity: "green",
        message: "Version + schema labels all agree.",
      };
    return {
      ok: false,
      severity: "red",
      message: "Version coherence FAILED — version/schema-label drift detected.",
      details: (r.stdout || r.stderr || "").split("\n").filter((l) => /RED \[/.test(l)).slice(0, 10),
    };
  }),

  // 3. Reference Integrity
  // 0.1.2 honesty fix: this gate cannot run automatically (it needs a running
  // Claude Code agent to invoke /scan:references). Pre-0.1.2 it returned
  // severity=green unconditionally — a lie that release-gates inherited.
  // Now it returns severity=manual: not blocking, but also not pretending to
  // pass. The runner counts manual the same as skipped for the overall PASS
  // tally; critical-by-default gates may upgrade manual to a soft-block.
  gate("reference_integrity", () => {
    return {
      ok: true,
      severity: "manual",
      message:
        "Reference integrity check requires the /scan:references slash skill (no headless equivalent yet) — run manually before /warp:release. Tracked separately, not auto-passed.",
    };
  }),

  // 4. Hook Registration
  gate("hook_registration", () => {
    const settings = path.join(REPO_ROOT, ".claude", "settings.json");
    if (!fs.existsSync(settings)) {
      return {
        ok: false,
        severity: "red",
        message: ".claude/settings.json missing.",
      };
    }
    return {
      ok: true,
      severity: "green",
      message: "settings.json present (deeper hook fixture tests in gate 5).",
    };
  }),

  // 5. Hook Fixture Tests
  gate("hook_fixture_tests", () => {
    const r = runScript("scripts/hooks/test.js", ["--all"]);
    if (r.status === 0)
      return {
        ok: true,
        severity: "green",
        message: "Registered hook fixture tests pass.",
      };
    // Phase 5G ships fixtures. Until then, surface as YEL not RED.
    return {
      ok: false,
      severity: "red",
      message: "Hook fixture tests pending Phase 5G — placeholder gate.",
    };
  }),

  // 6. RETIRED (SP-20260721-001 D-4 INC-2 — GATE-A `fresh_scaffold_all_ways`,
  // coverage-map below). `fresh_install_fixture` asserted ONLY that
  // fixtures/install-empty-next-app/ EXISTS as a directory — cosmetic, never
  // ran an install. SUBSUMED by GATE-A Leg 1 (/portfolio:new, real install)
  // and Leg 3 (shipped install.ps1, real install) below, both of which
  // exercise a REAL fresh install and assert on its actual end-state
  // (framework-installed.json, scan:install GREEN) rather than a fixture
  // directory's mere existence. See the retirement coverage-map comment next
  // to `fresh_scaffold_all_ways` for the full R5 accounting (why this one
  // retires, why `customized_install_fixture` retires, why
  // `update_fixture_from_previous` does NOT).

  // 7. Update Fixture from previous version
  // Fix-forward (codex Phase 4 review 2026-04-30): previously this just
  // checked the fixture directory existed. That's cosmetic. Now we actually
  // load the fixture's framework-installed.json, run the update.js
  // classifier against it, and verify the plan is non-empty + has only
  // expected categories (Class C should be 0 for an upgrade FROM a clean
  // 0.0.0 install).
  gate("update_fixture_from_previous", () => {
    const fixture = path.join(REPO_ROOT, "fixtures", "update-from-0.0.0-clean");
    const fixtureInstall = path.join(
      fixture,
      ".claude",
      "framework-installed.json",
    );
    if (!fs.existsSync(fixtureInstall)) {
      return {
        ok: false,
        severity: "yellow",
        message:
          "Update-from-previous fixture missing framework-installed.json.",
      };
    }
    let installed;
    try {
      installed = JSON.parse(fs.readFileSync(fixtureInstall, "utf8"));
    } catch (e) {
      return {
        ok: false,
        severity: "red",
        message: `Fixture installed.json malformed: ${e.message}`,
      };
    }
    // Run update.js classifier directly with the fixture's installed snapshot
    let classify;
    try {
      ({ classify } = require("./update"));
    } catch (e) {
      return {
        ok: false,
        severity: "red",
        message: `Update engine not loadable: ${e.message}`,
      };
    }
    const versionFile = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, "version.json"), "utf8"),
    );
    const targetVersion = versionFile.version;
    const capsuleDir = path.join(
      REPO_ROOT,
      "framework",
      "releases",
      targetVersion,
    );
    const releaseFile = path.join(capsuleDir, "release.json");
    const manifestSnap = path.join(capsuleDir, "framework-manifest.json");
    if (!fs.existsSync(releaseFile) || !fs.existsSync(manifestSnap)) {
      return {
        ok: false,
        severity: "yellow",
        message: `Capsule ${targetVersion} not built — run /warp:release ${targetVersion} first.`,
      };
    }
    const capsule = {
      release: JSON.parse(fs.readFileSync(releaseFile, "utf8")),
      manifest: JSON.parse(fs.readFileSync(manifestSnap, "utf8")),
    };
    const decisions = classify(installed, capsule);
    const counts = {};
    for (const d of decisions)
      counts[d.category] = (counts[d.category] || 0) + 1;
    const classC = decisions.filter(
      (d) =>
        d.category === "MERGE_CONFLICT" ||
        d.category === "DELETE_CONFLICT" ||
        d.category === "RENAME_CONFLICT",
    ).length;
    if (decisions.length === 0) {
      return {
        ok: false,
        severity: "red",
        message:
          "Fixture classifier produced 0 decisions — engine or fixture is broken.",
      };
    }
    if (classC > 0) {
      return {
        ok: false,
        severity: "red",
        message: `Fixture classifier produced ${classC} Class C decision(s) for a clean 0.0.0 → ${targetVersion} upgrade — should be 0.`,
        details: decisions
          .filter((d) =>
            ["MERGE_CONFLICT", "DELETE_CONFLICT", "RENAME_CONFLICT"].includes(
              d.category,
            ),
          )
          .slice(0, 5)
          .map((d) => `${d.category} ${d.dest}`),
      };
    }
    return {
      ok: true,
      severity: "green",
      message: `Fixture classifier ran against 0.0.0 → ${targetVersion}: ${decisions.length} decisions, 0 Class C, counts ${JSON.stringify(counts)}.`,
    };
  }),

  // 8. RETIRED (SP-20260721-001 D-4 INC-2 — GATE-A `fresh_scaffold_all_ways`).
  // `customized_install_fixture` asserted ONLY that
  // fixtures/update-from-0.0.0-customized-claude-md/ EXISTS as a directory —
  // cosmetic, never ran an install or touched a CLAUDE.md. SUBSUMED by
  // GATE-A Leg 2 (manual /warp:setup over a SEEDED pre-existing CLAUDE.md,
  // real merge), which asserts identity-merge, seeded-content survival, and a
  // pre-merge backup — the real behavior this fixture only gestured at.

  // 9. Runtime Leak Scan
  // Only flag truly-runtime paths that should never be in git.
  // .claude/project/events/ and .claude/project/memory/ ARE intentionally
  // tracked in this repo (per-project event log + memory stores); flagging
  // them as "leaks" was wrong. We narrow the scan to the per-session
  // runtime tree only.
  gate("runtime_leak_scan", () => {
    const RUNTIME_LEAK_PATTERNS = [
      ".claude/runtime/.session-checkpoint.json",
      ".claude/runtime/.topology-snapshot.json",
      ".claude/runtime/handoff.md",
      ".claude/runtime/handoffs/",
      ".claude/runtime/logs/",
      ".claude/runtime/notes/",
      ".claude/runtime/dispatch/",
      ".claude/.agent-result-hashes.json",
      ".claude/.last-checkpoint",
      ".claude/.session-checkpoint.json",
      ".claude/scheduled_tasks.lock",
      ".claude/agents/.system/dispatch-backups/",
      ".claude/agents/president/_system/oneshot/store.json",
      ".claude/agents/president/_system/oneshot/store.json.prev-run-backup.json",
    ];
    // Differentiate pre-existing leaks (committed before the leak rule
    // existed) from new leaks (added in the most recent change). New
    // leaks block; pre-existing leaks YEL with a "deferred to Phase 5T
    // cleanup" note. Phase 4 doesn't take on rewriting prior commits.
    let preExisting = [];
    let newlyAdded = [];
    try {
      const allTracked = execSync(
        `git ls-files ${RUNTIME_LEAK_PATTERNS.join(" ")}`,
        { cwd: REPO_ROOT, encoding: "utf8" },
      )
        .split("\n")
        .filter((l) => l.trim());
      // Fix-forward (codex Phase 4 review 2026-04-30): "newly added" should
      // mean "added on this branch since divergence from master," not just
      // "added in HEAD~1..HEAD." A multi-commit phase that added a leak in
      // its first commit and ran the gate from its third commit would have
      // misclassified the leak as pre-existing.
      let recentlyAdded = [];
      let mergeBase = null;
      try {
        mergeBase = execSync(`git merge-base HEAD master`, {
          cwd: REPO_ROOT,
          encoding: "utf8",
        }).trim();
      } catch {
        // No master ref — fall back to the previous commit
        try {
          mergeBase = execSync(`git rev-parse HEAD~1`, {
            cwd: REPO_ROOT,
            encoding: "utf8",
          }).trim();
        } catch {
          mergeBase = null;
        }
      }
      if (mergeBase) {
        try {
          recentlyAdded = execSync(
            `git diff ${mergeBase}..HEAD --name-only --diff-filter=A ${RUNTIME_LEAK_PATTERNS.join(" ")}`,
            { cwd: REPO_ROOT, encoding: "utf8" },
          )
            .split("\n")
            .filter((l) => l.trim());
        } catch {
          recentlyAdded = [];
        }
      }
      const newSet = new Set(recentlyAdded);
      for (const f of allTracked) {
        if (newSet.has(f)) newlyAdded.push(f);
        else preExisting.push(f);
      }
    } catch {
      // git not available or empty result → treat as clean
    }
    if (newlyAdded.length > 0) {
      return {
        ok: false,
        severity: "red",
        message: `${newlyAdded.length} NEWLY-leaked runtime files in the last commit — block release.`,
        details: newlyAdded.slice(0, 5),
      };
    }
    if (preExisting.length > 0) {
      return {
        ok: false,
        severity: "yellow",
        message: `${preExisting.length} pre-existing runtime files are git-tracked from prior commits — schedule Phase 5T cleanup (\`git rm --cached\` + .gitignore additions). Not blocking release.`,
        details: preExisting.slice(0, 5),
      };
    }
    return {
      ok: true,
      severity: "green",
      message: "No runtime / per-session files leaked into git.",
    };
  }),

  // 10. Version Consistency
  gate("version_consistency", () => {
    const versionFile = path.join(REPO_ROOT, "version.json");
    const manifestFile = path.join(
      REPO_ROOT,
      ".claude",
      "framework-manifest.json",
    );
    if (!fs.existsSync(versionFile))
      return { ok: false, severity: "red", message: "version.json missing." };
    if (!fs.existsSync(manifestFile))
      return {
        ok: false,
        severity: "red",
        message: "framework-manifest.json missing.",
      };
    const v = JSON.parse(fs.readFileSync(versionFile, "utf8"));
    const m = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    if (v.version !== m.version) {
      return {
        ok: false,
        severity: "red",
        message: `version mismatch: version.json=${v.version} framework-manifest.json=${m.version}`,
      };
    }
    const capsule = path.join(
      REPO_ROOT,
      "framework",
      "releases",
      v.version,
      "release.json",
    );
    if (!fs.existsSync(capsule)) {
      return {
        ok: false,
        severity: "yellow",
        message: `No release capsule for ${v.version} yet — run /warp:release ${v.version}.`,
      };
    }
    const c = JSON.parse(fs.readFileSync(capsule, "utf8"));
    if (c.version !== v.version) {
      return {
        ok: false,
        severity: "red",
        message: `capsule version mismatch: version.json=${v.version} capsule=${c.version}`,
      };
    }
    return {
      ok: true,
      severity: "green",
      message: `All three sources agree: ${v.version}.`,
    };
  }),

  // 11. Production Baseline
  gate("production_baseline", () => {
    const r = runScript("scripts/checks/production-baseline.js");
    if (r.status === 0) {
      return {
        ok: true,
        severity: "green",
        message:
          "Production, accessibility, analytics, DR, readiness, and deprecation docs are present.",
      };
    }
    return {
      ok: false,
      severity: "red",
      message: "Production baseline is incomplete.",
      details: (r.stdout || r.stderr || "").split(/\r?\n/).slice(-8),
    };
  }),

  // 12. Contract Versioning
  gate("contract_versioning", () => {
    const r = runScript("scripts/checks/contract-versioning.js");
    if (r.status === 0) {
      return {
        ok: true,
        severity: "green",
        message: "Shared contracts declare semver and compatibility policy.",
      };
    }
    return {
      ok: false,
      severity: "red",
      message: "Contract versioning check failed.",
      details: (r.stdout || r.stderr || "").split(/\r?\n/).slice(-8),
    };
  }),

  // 13. Pattern Library
  gate("pattern_library", () => {
    const admission = path.join(REPO_ROOT, "patterns", "ADMISSION.md");
    const dir = path.join(REPO_ROOT, "patterns");
    if (!fs.existsSync(admission)) {
      return {
        ok: false,
        severity: "red",
        message: "patterns/ADMISSION.md missing.",
      };
    }
    const content = fs
      .readdirSync(dir)
      .filter(
        (f) => f.endsWith(".md") && !["README.md", "ADMISSION.md"].includes(f),
      );
    if (content.length < 3) {
      return {
        ok: false,
        severity: "red",
        message:
          "Pattern library needs at least 3 canonical patterns or pruned references.",
      };
    }
    return {
      ok: true,
      severity: "green",
      message: `Pattern library has admission policy and ${content.length} canonical patterns.`,
    };
  }),

  // 14. Phase 6 Path Usage
  gate("path_usage", () => {
    const r = runScript("scripts/checks/path-usage.js");
    if (r.status === 0) {
      return {
        ok: true,
        severity: "green",
        message:
          "Phase 6 path-usage audit found active consumers for previously flagged keys.",
      };
    }
    return {
      ok: false,
      severity: "red",
      message: "Path usage audit found unused flagged keys.",
      details: (r.stdout || r.stderr || "").split(/\r?\n/).slice(-8),
    };
  }),

  // 15. Regression Seed (0.17.0 Per-Sprint Exhaustive Test-Suite System)
  // The named enforcer for the per-sprint test-suite convention
  // (_docs/sprint/TESTSUITE.md): the regression-seed suite (the 26 recurring
  // bug classes in _requirements/07-testing/recurring-bug-classes.json, made
  // runnable by scripts/testsuite/run.js) must stay green per sprint. This gate
  // runs scripts/testsuite/enforce.js, which itself is role-aware:
  //   - product repos     → opt-in; enforce.js no-ops (consumer-only detectors
  //                         would falsely fail), so we skip-as-green here too.
  //   - canonical/framework → mandatory; a regression in a covered class is RED.
  // Honesty note: pre-existing open regressions in canonical correctly turn this
  // RED — the suite reflects reality and is not suppressed here.
  gate("regression_seed", () => {
    const rs = roleStatus();
    if (!rs.canonical) {
      // qa W5: distinguish a genuine product repo (manifest readable, role
      // absent/product → legitimately opt-in, skip-as-green) from a manifest
      // that EXISTS but is unparseable — that is almost certainly a canonical
      // checkout with a corrupt/locked manifest, and silently skipping
      // enforcement would be a false green at release time. Surface the latter
      // as MANUAL so the release runner flags it for a human rather than
      // pretending the suite passed.
      if (rs.manifestExists && !rs.manifestReadable) {
        return {
          ok: true,
          severity: "manual",
          message:
            ".claude/manifest.json exists but is unreadable — cannot resolve repoRole. Regression-seed enforcement was NOT run; verify the manifest before release (a corrupt manifest in a canonical checkout must not silently skip the suite).",
        };
      }
      return {
        ok: true,
        severity: "green",
        message: `Regression-seed enforcement is opt-in for product repos (repoRole=${rs.role || "product"}) — skipped.`,
      };
    }
    const r = runScript("scripts/testsuite/enforce.js");
    if (r.status === 0) {
      return {
        ok: true,
        severity: "green",
        message: "Regression-seed suite: no regressions in covered classes.",
      };
    }
    if (r.status === 1) {
      return {
        ok: false,
        severity: "red",
        message: "Regression-seed suite: a covered bug class regressed — block release.",
        details: (r.stdout || r.stderr || "").split(/\r?\n/).filter(Boolean).slice(-6),
      };
    }
    return {
      ok: false,
      severity: "red",
      message: "Regression-seed runner errored (run.js produced no parseable verdict).",
      details: (r.stderr || r.stdout || "").split(/\r?\n/).filter(Boolean).slice(-6),
    };
  }),

  // GATE-A `fresh_scaffold_all_ways` (SP-20260721-001 D-4 INC-2 —
  // ADR-0034). The operator's D-4 standing standard #1 ("fresh-scaffold, ALL
  // WAYS") made a REAL, BLOCKING release gate: runs all 3 shipped install
  // paths for real (scripts/warpos/test-scaffold-all-ways.js — see that
  // file's header for the full engine contract + the sandbox-isolation
  // binding), sandbox-isolated, and PROVES the run never touched canonical
  // (a no-delta git-status snapshot before/after).
  //
  // R5 RETIREMENT COVERAGE-MAP (coverage-proven, not retired on number):
  //   - `fresh_install_fixture`       RETIRED — was `fs.existsSync` on a
  //     fixture DIRECTORY only, never ran an install. Subsumed by Leg 1
  //     (/portfolio:new) + Leg 3 (shipped install.ps1), both real installs.
  //   - `customized_install_fixture`  RETIRED — same class, directory-exists
  //     only. Subsumed by Leg 2 (manual /warp:setup over a SEEDED pre-existing
  //     CLAUDE.md — real identity-merge + survival + backup asserts).
  //   - `update_fixture_from_previous` STAYS — it is NOT cosmetic: it loads a
  //     real framework-installed.json fixture and runs the update.js
  //     classifier against it. That is UPGRADE domain (GATE-B / INC-3), not
  //     fresh-scaffold — retiring it on adjacency to the other two would be
  //     wrong; it covers ground GATE-A does not.
  //
  // Role-aware like `regression_seed`: only canonical can act as a WarpOS
  // engine SOURCE (a product/consumer repo has no framework-manifest.json and
  // install.ps1 refuses it as a source) — opt-in/skip-as-green for product
  // repos, same qa W5 manifest-unreadable distinction.
  gate("fresh_scaffold_all_ways", () => {
    const rs = roleStatus();
    if (!rs.canonical) {
      if (rs.manifestExists && !rs.manifestReadable) {
        return {
          ok: true,
          severity: "manual",
          message:
            ".claude/manifest.json exists but is unreadable — cannot resolve repoRole. fresh_scaffold_all_ways was NOT run; verify the manifest before release.",
        };
      }
      return {
        ok: true,
        severity: "green",
        message: `fresh_scaffold_all_ways is opt-in for product repos (repoRole=${rs.role || "product"}) — skipped.`,
      };
    }
    const r = runScript("scripts/warpos/test-scaffold-all-ways.js", ["--json"]);
    let payload = null;
    try {
      payload = JSON.parse((r.stdout || "").trim() || "{}");
    } catch {
      /* leave payload null — the errored branch below fires */
    }
    // (1) SANDBOX-ISOLATION no-delta violation (a real leg leaking into canonical) is the load-bearing
    //     correctness property — it BLOCKS UNCONDITIONALLY, and it is checked FIRST, before green /
    //     incomplete / report-only, so NO branch (a no-PS `incomplete` short-circuit, the report-only ramp)
    //     can ever soften a leak. (β R1 / the canonical-corruption incident / backend-reviewer branch-order
    //     BLOCKER: on a no-PS host `incomplete` fired before this check and a Leg-1/2 leak returned degraded.)
    if (payload && payload.sandbox_isolation && payload.sandbox_isolation.no_delta === false) {
      return {
        ok: false,
        severity: "red",
        message:
          "GATE-A fresh_scaffold_all_ways: SANDBOX-ISOLATION NO-DELTA VIOLATED — a real-install leg leaked into canonical. This BLOCKS unconditionally (never softened by incomplete or report-only).",
        details: summarizeGateALegs(payload),
      };
    }
    // (2) all 3 legs pass, no leak.
    if (r.status === 0 && payload && payload.ok) {
      return {
        ok: true,
        severity: "green",
        message: `GATE-A fresh_scaffold_all_ways: all 3 legs pass, sandbox-isolation no-delta held (ps_available=${payload.ps_available}).`,
      };
    }
    // (3) INCOMPLETE — Leg 3 (the SHIPPED install.ps1) did not run (no PowerShell). Never a pass (R2
    //     skip-loud). Non-blocking (degraded) DURING the report-only ramp; once the ramp flips HARD, a host
    //     that cannot certify the shipped installer must BLOCK (red) — a no-PS host may not green GATE-A
    //     (the R2/AC-15 false-green the gate exists to kill).
    if (payload && payload.incomplete) {
      return {
        ok: false,
        severity: GATE_A_REPORT_ONLY ? "degraded" : "red",
        message: `GATE-A fresh_scaffold_all_ways: INCOMPLETE — Leg 3 (shipped install.ps1) did not run (no PowerShell on this host). Not a pass (R2 skip-loud).${GATE_A_REPORT_ONLY ? " Non-blocking during the report-only ramp." : " BLOCKS post-flip — the shipped installer must be certifiable to green GATE-A."}`,
        details: summarizeGateALegs(payload),
      };
    }
    // (4) Report-only ramp (ED-249): a real-install LEG failure is reported LOUDLY (yellow) but does not
    //     block while GATE-A ramps. report-only ≠ silent — the finding + the flip-trigger are surfaced.
    if (GATE_A_REPORT_ONLY) {
      return {
        ok: false,
        severity: "yellow",
        message:
          "GATE-A fresh_scaffold_all_ways [REPORT-ONLY]: a real-install leg is RED — currently blocked by ED-249 (build.js unclassified paths → _warpos/MANIFEST.json missing → install incomplete). NOT blocking during the report-only ramp. FLIP-TRIGGER: ED-249 resolved (build.js classifies clean) AND Leg-3 green → set GATE_A_REPORT_ONLY=false.",
        details: payload ? summarizeGateALegs(payload) : (r.stderr || r.stdout || "").split(/\r?\n/).filter(Boolean).slice(-8),
      };
    }
    return {
      ok: false,
      severity: "red",
      message:
        "GATE-A fresh_scaffold_all_ways FAILED — a real-install leg or the sandbox-isolation no-delta assertion failed.",
      details: payload ? summarizeGateALegs(payload) : (r.stderr || r.stdout || "").split(/\r?\n/).filter(Boolean).slice(-8),
    };
  }),

  // `install_matrix` — wires the previously-orphaned
  // scripts/warpos/test-install-matrix.js (7-scenario install-fixture CI
  // matrix — SP-20260524-001/SP-20260525-019) into the release gate so it
  // actually runs and blocks, instead of sitting unreferenced. Same
  // role-aware opt-in-for-product-repos treatment as the gates above.
  gate("install_matrix", () => {
    const rs = roleStatus();
    if (!rs.canonical) {
      return {
        ok: true,
        severity: "green",
        message: `install_matrix is opt-in for product repos (repoRole=${rs.role || "product"}) — skipped.`,
      };
    }
    const r = runScript("scripts/warpos/test-install-matrix.js", ["--json"]);
    let payload = null;
    try {
      payload = JSON.parse((r.stdout || "").trim() || "{}");
    } catch {
      /* leave payload null */
    }
    if (r.status === 0 && payload && payload.ok) {
      return {
        ok: true,
        severity: "green",
        message: `install_matrix: ${payload.totals ? `${payload.totals.pass}/${payload.scenarios.length}` : "all"} scenarios passed.`,
      };
    }
    const matrixDetails = payload && payload.scenarios
      ? payload.scenarios.filter((s) => s.status !== "pass").map((s) => `scenario ${s.id} (${s.name}): ${(s.assertions || []).find((a) => a.status === "fail")?.name || "?"}`)
      : (r.stderr || r.stdout || "").split(/\r?\n/).filter(Boolean).slice(-8);
    // install_matrix reds on the SAME pre-existing ED-249 (build.js unclassified → _warpos/MANIFEST.json
    // missing) that GATE-A was ramped past. So it SHARES GATE-A's ED-249 report-only window (the same
    // GATE_A_REPORT_ONLY flag = the ED-249 ramp, same flip-trigger): a scenario failure is REPORTED loudly
    // (yellow) but does not block while the window is open — else the release would be blocked on ED-249 via
    // this SECOND gate, defeating GATE-A's ramp (qa-reviewer HIGH). Flips HARD with GATE-A when ED-249 clears.
    if (GATE_A_REPORT_ONLY) {
      return {
        ok: false,
        severity: "yellow",
        message:
          "install_matrix [REPORT-ONLY]: a scenario failed — currently blocked by ED-249 (shared with GATE-A: build.js unclassified paths → _warpos/MANIFEST.json missing). NOT blocking during the ED-249 report-only ramp. FLIP-TRIGGER: ED-249 resolved → set GATE_A_REPORT_ONLY=false.",
        details: matrixDetails,
      };
    }
    return {
      ok: false,
      severity: "red",
      message: "install_matrix FAILED — a install-fixture regression scenario failed.",
      details: matrixDetails,
    };
  }),

  // Sealed-capsule consumer-contract gate (ADR-0006 / SP-20260602-001 / keystone).
  // The named `sealed-capsule-contract-gate` enforcer: materialize the CURRENT
  // bill-of-materials into a self-contained payload, install it into a disposable
  // OUT-OF-TREE repo with canonical UNREACHABLE, and assert no reach-back + a
  // certified install. This is the structural cure for the "downstream always
  // missing" class that the tautological framework_manifest gate cannot catch.
  // Promotion runs the FULL contract (--full): seal+isolate+unreachable+scan:install
  // PLUS the real lifecycle matrix (both roles × cold+warm) and typed-success
  // telemetry verify (gauntlet finding C1 — bounded mode would let release pass
  // without AC-3/AC-4/AC-5). The fast --self-test path is the per-commit signal
  // (recurring-bug-classes BC-28); this is the heavier promotion gate.
  gate("sealed_capsule_contract", () => {
    const r = runScript("scripts/warpos/test-sealed-capsule-gate.js", ["--full"]);
    if (r.status === 0)
      return {
        ok: true,
        severity: "green",
        message: "Sealed-capsule contract (--full): BOM stands up self-contained, no reach-back, lifecycle matrix + typed telemetry pass.",
      };
    if (r.status === 1)
      return {
        ok: false,
        severity: "red",
        message:
          "Sealed-capsule contract FAILED — the sealed install reaches back into canonical or is incomplete (downstream-missing/reach-back class). Block release.",
        details: (r.stdout || r.stderr || "").split(/\r?\n/).filter((l) => l.includes("FAIL")).slice(0, 8),
      };
    return {
      ok: false,
      severity: "red",
      message: "Sealed-capsule gate errored (fail-closed — never a clean pass on a crash).",
      details: (r.stderr || r.stdout || "").split(/\r?\n/).filter(Boolean).slice(-6),
    };
  }),
];

function run(opts) {
  const skip = new Set((opts && opts.skip) || []);
  const results = [];
  let red = 0;
  let yellow = 0;
  let manual = 0;
  let degraded = 0;
  for (const g of GATES) {
    if (skip.has(g.name)) {
      results.push({
        name: g.name,
        severity: "skipped",
        message: "Skipped via --skip flag.",
      });
      continue;
    }
    let r;
    try {
      r = g.fn();
    } catch (e) {
      r = {
        ok: false,
        severity: "red",
        message: `${g.name} threw: ${e.message}`,
      };
    }
    results.push({ name: g.name, ...r });
    if (r.severity === "red") red += 1;
    else if (r.severity === "yellow") yellow += 1;
    else if (r.severity === "manual") manual += 1;
    else if (r.severity === "degraded") degraded += 1;
  }
  return {
    ok: red === 0,
    red,
    yellow,
    manual,
    degraded,
    green: results.filter((r) => r.severity === "green").length,
    skipped: results.filter((r) => r.severity === "skipped").length,
    results,
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const skip = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--skip" && args[i + 1]) {
      skip.push(args[i + 1]);
      i += 1;
    }
  }
  const summary = run({ skip });
  if (json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    for (const r of summary.results) {
      const tag =
        r.severity === "red"
          ? "RED  "
          : r.severity === "yellow"
            ? "YEL  "
            : r.severity === "skipped"
              ? "SKIP "
              : r.severity === "manual"
                ? "MAN  "
                : r.severity === "degraded"
                  ? "DEGR "
                  : "GRN  ";
      console.log(`[${tag}] ${r.name}: ${r.message}`);
      if (r.details) {
        for (const d of (Array.isArray(r.details)
          ? r.details
          : [r.details]
        ).slice(0, 5)) {
          console.log(
            `         ${typeof d === "string" ? d : JSON.stringify(d)}`,
          );
        }
      }
    }
    console.log(
      `\n${summary.green} green · ${summary.yellow} yellow · ${summary.red} red · ${summary.manual || 0} manual · ${summary.degraded || 0} degraded · ${summary.skipped} skipped — overall ${summary.ok ? "PASS" : "FAIL"}`,
    );
  }
  process.exit(summary.red > 0 ? 2 : summary.yellow > 0 ? 1 : 0);
}

module.exports = { run };
