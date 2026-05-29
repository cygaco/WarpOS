/**
 * release-build.js — Build a release capsule for a given version.
 *
 * Phase 4E artifact (engine; the slash command /warp:release is a wrapper).
 *
 * Usage:
 *   node scripts/warpos/release-build.js 0.1.0          # build capsule for 0.1.0
 *   node scripts/warpos/release-build.js 0.1.0 --check  # verify capsule integrity, no writes
 */

const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const { printHumanReport } = require("./report-format");
// SP-20260514-001 R-1 / T-20260514-069 — capsule artifact checksums use
// rawHash (binary-safe). Capsule contents (manifest, migrations) are
// byte-equality content-addressed; LF normalization would be incorrect here.
const cHash = require("./lib/content-hash");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const RELEASES_DIR = path.join(REPO_ROOT, "framework", "releases");
const FRAMEWORK_MANIFEST = path.join(
  REPO_ROOT,
  ".claude",
  "framework-manifest.json",
);

function sha256File(filePath) {
  return cHash.contentHash(filePath);
}

function gitHead() {
  try {
    return execSync("git rev-parse HEAD", {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

// Continuous-enforcement baseline for the release-build Beta-honesty gate.
// Sprints that closed BEFORE this date predate the gate (they ran before Beta
// consults were continuously enforced — e.g. inline/manual execution that left
// `missing_consult` findings that can never be retroactively fixed). They are
// ACKNOWLEDGED HISTORICAL DEBT — still surfaced by the on-demand
// /scan:sprint-beta-honesty audit, but NOT release-blocking. Sprints on/after
// this date MUST have honest consults or the build is refused.
//
// This mirrors the regression enforcer's baseline philosophy (only NEW reds
// block; pre-existing tracked debt does not) and the checker's own hardcoded
// SP003_SHIP_DATE cutoff. Advancing the baseline = acknowledging a new tranche
// of debt; it should only move forward when the prior window is genuinely clean
// or its findings are formally accepted.
const BETA_HONESTY_GATE_BASELINE = "2026-05-29";

// SP-20260528-001 / #438 — Beta-consultation honesty gate for release builds.
// Runs scripts/checks/sprint-beta-honesty.js --json --since <baseline> and
// decides whether the build is blocked. Extracted + runner-injectable so the
// wiring is unit-testable without standing up a full capsule fixture.
// Returns { blocked, message }.
//
// Fails CLOSED: exit 1 (findings) AND any other non-zero/crash status
// (status null, exit 2) block — never ship on an unverifiable honesty signal.
// The audit is date-cutoff-aware and graceful-empty, so a repo with no
// applicable post-baseline /sprint:full runs returns blocked:false (a no-op for
// product repos and pre-gate canonical history). Skipped entirely under
// opts.skipBetaHonestyCheck (--skip-beta-honesty-check, emergencies only).
function betaHonestyGate(opts, runChecker) {
  if (opts && opts.skipBetaHonestyCheck) return { blocked: false, message: null };
  const run =
    runChecker ||
    (() =>
      spawnSync(
        process.execPath,
        [
          path.join(REPO_ROOT, "scripts", "checks", "sprint-beta-honesty.js"),
          "--json",
          "--since",
          BETA_HONESTY_GATE_BASELINE,
        ],
        { cwd: REPO_ROOT, encoding: "utf8" },
      ));
  const res = run() || {};
  if (res.status === 0) return { blocked: false, message: null };

  let detail = (res.stdout || "").trim();
  try {
    const parsed = JSON.parse(detail);
    if (parsed && Array.isArray(parsed.findings)) {
      detail =
        `${parsed.totalFindings} finding(s) across ${parsed.checked} sprint(s) (cutoff ${parsed.cutoff}):\n` +
        parsed.findings
          .slice(0, 10)
          .map((f) => `${f.sprint_id}  ${f.finding_type}  ${f.phase || "-"}  ${f.evidence || ""}`)
          .join("\n");
    }
  } catch {
    // Not JSON (crash / usage error) — fall back to raw streams (still blocks).
    detail = (res.stderr || res.stdout || `exit ${res.status}`).trim();
  }
  const message =
    "release-build refuses to build: Beta-consultation honesty findings in recent sprints:\n" +
    (detail ? "  " + detail.split("\n").join("\n  ") + "\n" : "") +
    "Remediation: resolve the findings (run `node scripts/checks/sprint-beta-honesty.js`), then re-run release-build.\n" +
    "Bypass (emergencies only): re-run with --skip-beta-honesty-check.";
  return { blocked: true, message };
}

function buildCapsule(version, opts) {
  const checkOnly = opts && opts.check;
  const capsuleDir = path.join(RELEASES_DIR, version);
  if (!fs.existsSync(capsuleDir)) {
    console.error(`Capsule directory missing: ${capsuleDir}`);
    process.exit(2);
  }

  const releaseFile = path.join(capsuleDir, "release.json");
  if (!fs.existsSync(releaseFile)) {
    console.error(`release.json missing in capsule ${version}`);
    process.exit(2);
  }
  const release = JSON.parse(fs.readFileSync(releaseFile, "utf8"));

  // 1. Snapshot framework-manifest.json into capsule (unless already present
  //    and we're in --check mode).
  //
  // SP-20260524-002 / T-183 — Refuse to snapshot a stale manifest. Run
  // generate-framework-manifest.js --check before copying. A stale manifest
  // captured into the capsule would lie about what shipped, downstream
  // /warp:update would fail to copy phantom files (the post-warp:promote
  // ghost-files class), and the only signal would be deep-buried in apply
  // failures days later. Bypass with --skip-manifest-check for emergency
  // re-builds when you've already verified manifest health by other means.
  const manifestSnap = path.join(capsuleDir, "framework-manifest.json");
  if (!checkOnly) {
    if (!fs.existsSync(FRAMEWORK_MANIFEST)) {
      console.error(
        `framework-manifest.json missing — run scripts/generate-framework-manifest.js first`,
      );
      process.exit(2);
    }
    if (!opts || !opts.skipManifestCheck) {
      const checkRes = spawnSync(
        process.execPath,
        [path.join(REPO_ROOT, "scripts", "generate-framework-manifest.js"), "--check"],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
      if (checkRes.status !== 0) {
        console.error(
          "release-build refuses to snapshot a stale framework-manifest.json:",
        );
        const detail = (checkRes.stderr || checkRes.stdout || "").trim();
        if (detail) console.error("  " + detail.split("\n").join("\n  "));
        console.error(
          "Remediation: run `node scripts/generate-framework-manifest.js` then re-run release-build.",
        );
        console.error(
          "Bypass (emergencies only): re-run with --skip-manifest-check.",
        );
        process.exit(2);
      }
    }
    fs.copyFileSync(FRAMEWORK_MANIFEST, manifestSnap);

    // SP-20260528-001 / #438 — Refuse to build a capsule when recent
    // post-cutoff sprints carry Beta-consultation honesty findings. The
    // /scan:sprint-beta-honesty audit was on-demand only; wiring it here makes
    // the 0.11.0 Beta cadence continuously enforced at release time
    // (mechanism → audit → gate), not spot-checked. See betaHonestyGate().
    const honesty = betaHonestyGate(opts);
    if (honesty.blocked) {
      console.error(honesty.message);
      process.exit(2);
    }
  } else if (!fs.existsSync(manifestSnap)) {
    console.error(
      `Capsule ${version} missing framework-manifest.json snapshot`,
    );
    process.exit(2);
  }

  // 2. Validate migrations referenced in release.json exist.
  // Fix-forward (codex Phase 4 review 2026-04-30): require all migration
  // paths to resolve INSIDE the repo's migrations/ tree. Without this, a
  // hand-edited release.json could escape via `../../../../etc/...` and
  // checksums.json would silently fingerprint arbitrary local files.
  const MIGRATIONS_ROOT = path.join(REPO_ROOT, "migrations");
  const missingMigrations = [];
  const escapingMigrations = [];
  for (const m of release.migrations || []) {
    const abs = path.resolve(capsuleDir, m.file);
    const rel = path.relative(MIGRATIONS_ROOT, abs);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      escapingMigrations.push({
        id: m.id,
        path: path.relative(REPO_ROOT, abs).replace(/\\/g, "/"),
      });
      continue;
    }
    if (!fs.existsSync(abs)) {
      missingMigrations.push({
        id: m.id,
        expected: path.relative(REPO_ROOT, abs).replace(/\\/g, "/"),
      });
    }
  }
  if (escapingMigrations.length > 0) {
    console.error(
      `Migration paths escape the migrations/ tree (boundary violation):`,
    );
    for (const m of escapingMigrations) {
      console.error(`  ${m.id} → ${m.path}`);
    }
    console.error(
      `Refusing to build capsule. Each migration file must live under ${path.relative(REPO_ROOT, MIGRATIONS_ROOT).replace(/\\/g, "/")}/`,
    );
    process.exit(2);
  }
  if (missingMigrations.length > 0) {
    console.error(`Migration files missing for capsule ${version}:`);
    for (const m of missingMigrations) {
      console.error(`  ${m.id} → ${m.expected}`);
    }
    process.exit(2);
  }

  // 3. Compute checksums for every file in the capsule
  const checksums = {};
  for (const ent of fs.readdirSync(capsuleDir, { withFileTypes: true })) {
    if (ent.isFile() && ent.name !== "checksums.json") {
      checksums[ent.name] = sha256File(path.join(capsuleDir, ent.name));
    }
  }

  // 4. Compute checksums for migration files (stored as relative paths under <capsule>/migrations.relative)
  for (const m of release.migrations || []) {
    const abs = path.resolve(capsuleDir, m.file);
    const rel = path.relative(capsuleDir, abs).replace(/\\/g, "/");
    checksums[rel] = sha256File(abs);
  }

  const checksumsFile = path.join(capsuleDir, "checksums.json");
  if (checkOnly) {
    if (!fs.existsSync(checksumsFile)) {
      console.error(`Capsule ${version} missing checksums.json`);
      process.exit(2);
    }
    const existing = JSON.parse(fs.readFileSync(checksumsFile, "utf8"));
    const drift = [];
    for (const [k, v] of Object.entries(checksums)) {
      if (existing.entries[k] !== v)
        drift.push({
          file: k,
          expected: existing.entries[k] || "(missing)",
          actual: v,
        });
    }
    if (drift.length > 0) {
      console.error(`Capsule ${version} checksum drift:`);
      for (const d of drift)
        console.error(
          `  ${d.file}: ${d.expected.slice(0, 12)} → ${d.actual.slice(0, 12)}`,
        );
      process.exit(1);
    }
    console.log(
      `Capsule ${version} verified: ${Object.keys(checksums).length} files, all checksums match.`,
    );
    printHumanReport("warp:release", {
      verdict: "Capsule verified",
      whatChanged: "No files changed in --check mode.",
      why: "The existing release capsule checksum set matches current capsule contents.",
      risksRemaining: "Run release gates separately before publishing.",
      whatWasRejected: "Checksum drift would have been rejected.",
      whatWasTested: `${Object.keys(checksums).length} capsule and migration checksum entries`,
      needsHumanDecision: "None.",
      recommendedNextAction:
        "Run node scripts/warpos/release-gates.js before tagging.",
    });
    return { ok: true, version, files: Object.keys(checksums).length };
  }

  // 5. Write checksums.json
  const out = {
    version,
    generatedAt: new Date().toISOString(),
    commit: gitHead(),
    entries: checksums,
  };
  fs.writeFileSync(checksumsFile, JSON.stringify(out, null, 2) + "\n");
  console.log(
    `Capsule ${version} built: ${Object.keys(checksums).length} files, checksums at ${path.relative(REPO_ROOT, checksumsFile)}`,
  );
  printHumanReport("warp:release", {
    verdict: "Capsule built",
    whatChanged: `Updated manifest snapshot and checksums for ${version}.`,
    why: "Release capsules give /warp:update a deterministic source manifest, migrations, and integrity checks.",
    risksRemaining: "Release gates still need to pass before publishing.",
    whatWasRejected:
      "Migration paths outside migrations/ were rejected before checksums.",
    whatWasTested: `${Object.keys(checksums).length} capsule and migration checksum entries`,
    needsHumanDecision: "Review changelog and upgrade notes before tagging.",
    recommendedNextAction: "Run node scripts/warpos/release-gates.js.",
  });
  return { ok: true, version, files: Object.keys(checksums).length };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const version = args.find((a) => /^\d+\.\d+\.\d+/.test(a));
  const checkOnly = args.includes("--check");
  const skipManifestCheck = args.includes("--skip-manifest-check");
  const skipBetaHonestyCheck = args.includes("--skip-beta-honesty-check");
  if (!version) {
    console.error(
      "Usage: node scripts/warpos/release-build.js <version> [--check] [--skip-manifest-check] [--skip-beta-honesty-check]",
    );
    process.exit(2);
  }
  buildCapsule(version, { check: checkOnly, skipManifestCheck, skipBetaHonestyCheck });
}

module.exports = { buildCapsule, betaHonestyGate };
