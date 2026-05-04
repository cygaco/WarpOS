#!/usr/bin/env node
/**
 * scripts/check/install.js — Verify a fresh WarpOS install is complete.
 *
 * Runs a series of presence + structural checks. Bails early if .claude/manifest.json
 * is missing — that's the signal we're not in a WarpOS-installed repo.
 *
 * Usage:
 *   node scripts/check/install.js                  full audit
 *   node scripts/check/install.js --json           JSON output
 *
 * Exit:
 *   0 — install complete
 *   1 — install incomplete OR not a WarpOS repo
 *   2 — usage error
 */
const fs = require("fs");
const path = require("path");

const REPO_ROOT = process.cwd();

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function check(name, fn) {
  try {
    const r = fn();
    return {
      name,
      ok: r === true || (r && r.ok),
      detail: typeof r === "object" ? r.detail : null,
    };
  } catch (e) {
    return { name, ok: false, detail: e.message };
  }
}

function loadManifest() {
  const f = path.join(REPO_ROOT, ".claude", "manifest.json");
  if (!fs.existsSync(f)) return null;
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return null;
  }
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");

  // Bail-out check first
  if (!exists(".claude/manifest.json")) {
    const msg =
      "not a WarpOS-installed repo (no .claude/manifest.json) — run /warp:setup first";
    if (asJson) {
      process.stdout.write(
        JSON.stringify({ ok: false, bailed: true, reason: msg }) + "\n",
      );
    } else {
      process.stderr.write(`${msg}\n`);
    }
    process.exit(1);
  }

  const manifest = loadManifest();
  const checks = [
    check("manifest.json present and valid", () => manifest !== null),
    check("paths.json present", () => exists(".claude/paths.json")),
    check("CLAUDE.md present", () => exists("CLAUDE.md")),
    check("settings.json present", () => exists(".claude/settings.json")),
    check("agents/ tree present", () => exists(".claude/agents")),
    check("commands/ tree present", () => exists(".claude/commands")),
    check("scripts/hooks/ present", () => exists("scripts/hooks")),
    check("framework-manifest.json present", () =>
      exists(".claude/framework-manifest.json"),
    ),
    check("version.json present", () => exists("version.json")),
    check("manifest.warpos.installed === true", () => {
      if (!manifest || !manifest.warpos)
        return { ok: false, detail: "no warpos block" };
      return manifest.warpos.installed === true;
    }),
    check("manifest.warpos.version is semver", () => {
      const v = manifest && manifest.warpos && manifest.warpos.version;
      return typeof v === "string" && /^\d+\.\d+\.\d+$/.test(v);
    }),
    check("manifest.warpos.version matches version.json", () => {
      const v = manifest && manifest.warpos && manifest.warpos.version;
      const vjPath = path.join(REPO_ROOT, "version.json");
      if (!fs.existsSync(vjPath))
        return { ok: false, detail: "version.json missing" };
      try {
        const vj = JSON.parse(fs.readFileSync(vjPath, "utf8"));
        if (v !== vj.version)
          return {
            ok: false,
            detail: `manifest=${v} version.json=${vj.version}`,
          };
        return true;
      } catch (e) {
        return { ok: false, detail: `version.json unreadable: ${e.message}` };
      }
    }),
    check("at least one agent under agents/00-alex", () => {
      const dir = path.join(REPO_ROOT, ".claude", "agents", "00-alex");
      if (!fs.existsSync(dir)) return false;
      return fs.readdirSync(dir).some((f) => f.endsWith(".md"));
    }),
  ];

  const failed = checks.filter((c) => !c.ok);
  if (asJson) {
    process.stdout.write(JSON.stringify(checks, null, 2) + "\n");
  } else {
    for (const c of checks) {
      const tag = c.ok ? "OK  " : "FAIL";
      const detail = c.detail ? `  (${c.detail})` : "";
      process.stdout.write(`${tag}  ${c.name}${detail}\n`);
    }
    process.stdout.write(
      `# ${checks.length - failed.length}/${checks.length} passed\n`,
    );
  }
  process.exit(failed.length > 0 ? 1 : 0);
}

if (require.main === module) main();

module.exports = { check, exists };
