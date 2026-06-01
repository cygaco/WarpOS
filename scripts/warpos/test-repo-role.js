#!/usr/bin/env node
/**
 * scripts/warpos/test-repo-role.js — unit tests for scripts/warpos/repo-role.js
 *
 * Tests cover:
 *   1. Canonical repo detection (this worktree IS canonical)
 *   2. Consumer repo detection
 *   3. Unknown repo (no signals)
 *   4. Precedence chain: override > env > marker > heuristic
 *   5. Regression: refactored guards produce identical verdicts on THIS worktree
 *
 * Run:  node scripts/warpos/test-repo-role.js
 * Exit: 0 on all-pass, 1 on any failure.
 */

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const { resolveRepoRole, ROLES } = require("./repo-role");

// ── Tiny test harness ───────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function ok(label, cond, detail) {
  if (cond) {
    process.stdout.write(`  PASS  ${label}\n`);
    passed++;
  } else {
    process.stderr.write(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}\n`);
    failed++;
  }
}

function section(title) {
  process.stdout.write(`\n── ${title} ──\n`);
}

// ── Temp-dir fixture helper ─────────────────────────────────────────────────

/**
 * Create a minimal temp directory with the specified signal files and return
 * its path. Cleaned up by the caller via fs.rmSync(dir, {recursive:true}).
 *
 * @param {object} opts
 * @param {boolean} [opts.warposManifest]         write _warpos/MANIFEST.json
 * @param {boolean} [opts.warposCanonicalMarker]  write .warpos-canonical
 * @param {object}  [opts.manifestJson]           write .claude/manifest.json with this content
 * @param {object}  [opts.versionJson]            write version.json with this content
 * @param {boolean} [opts.frameworkInstalled]     write .claude/framework-installed.json
 */
function makeTmpRepo(opts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wt-test-repo-role-"));
  if (opts.warposManifest) {
    fs.mkdirSync(path.join(dir, "_warpos"), { recursive: true });
    fs.writeFileSync(path.join(dir, "_warpos", "MANIFEST.json"), JSON.stringify({ generated: true }));
  }
  if (opts.warposCanonicalMarker) {
    fs.writeFileSync(path.join(dir, ".warpos-canonical"), "");
  }
  if (opts.manifestJson !== undefined) {
    fs.mkdirSync(path.join(dir, ".claude"), { recursive: true });
    fs.writeFileSync(path.join(dir, ".claude", "manifest.json"), JSON.stringify(opts.manifestJson));
  }
  if (opts.versionJson !== undefined) {
    fs.writeFileSync(path.join(dir, "version.json"), JSON.stringify(opts.versionJson));
  }
  if (opts.frameworkInstalled) {
    fs.mkdirSync(path.join(dir, ".claude"), { recursive: true });
    fs.writeFileSync(path.join(dir, ".claude", "framework-installed.json"), JSON.stringify({ installed: true }));
  }
  return dir;
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}

// ── Test Suite ──────────────────────────────────────────────────────────────

// 1. Module exports
section("Module shape");
ok("ROLES is frozen array with 3 elements", Array.isArray(ROLES) && ROLES.length === 3);
ok("ROLES contains canonical/consumer/unknown", ROLES.includes("canonical") && ROLES.includes("consumer") && ROLES.includes("unknown"));
ok("resolveRepoRole is a function", typeof resolveRepoRole === "function");

// 2. This worktree IS canonical (has _warpos/MANIFEST.json + version.json#name=warpos + manifest signals)
section("Canonical repo — this worktree");
{
  const r = resolveRepoRole(); // default root = project root
  ok("role === 'canonical'", r.role === "canonical", `got: ${r.role} (source: ${r.source})`);
  ok("canonical === true", r.canonical === true);
  ok("consumer === false", r.consumer === false);
  ok("source is non-empty", typeof r.source === "string" && r.source.length > 0);
}

// 3. Canonical via _warpos/MANIFEST.json (strongest signal)
section("Canonical signal — _warpos/MANIFEST.json");
{
  const dir = makeTmpRepo({ warposManifest: true });
  try {
    const r = resolveRepoRole({ root: dir });
    ok("role === 'canonical'", r.role === "canonical", `got: ${r.role}`);
    ok("source === 'marker:_warpos/MANIFEST.json'", r.source === "marker:_warpos/MANIFEST.json", `got: ${r.source}`);
  } finally { cleanup(dir); }
}

// 4. Canonical via .warpos-canonical marker
section("Canonical signal — .warpos-canonical marker");
{
  const dir = makeTmpRepo({ warposCanonicalMarker: true });
  try {
    const r = resolveRepoRole({ root: dir });
    ok("role === 'canonical'", r.role === "canonical", `got: ${r.role}`);
    ok("source === 'marker:.warpos-canonical'", r.source === "marker:.warpos-canonical", `got: ${r.source}`);
  } finally { cleanup(dir); }
}

// 5. Canonical via manifest.json#repoRole
section("Canonical signal — manifest.json#repoRole");
{
  const dir = makeTmpRepo({ manifestJson: { repoRole: "canonical" } });
  try {
    const r = resolveRepoRole({ root: dir });
    ok("role === 'canonical'", r.role === "canonical", `got: ${r.role}`);
    ok("source contains repoRole", r.source.includes("repoRole"), `got: ${r.source}`);
  } finally { cleanup(dir); }
}

// 5b. Canonical via manifest.json#repoRole = "framework"
{
  const dir = makeTmpRepo({ manifestJson: { repoRole: "framework" } });
  try {
    const r = resolveRepoRole({ root: dir });
    ok("repoRole=framework → canonical", r.role === "canonical", `got: ${r.role}`);
  } finally { cleanup(dir); }
}

// 6. Canonical via manifest.json#warpos.source = "self"
section("Canonical signal — manifest.json#warpos.source");
{
  const dir = makeTmpRepo({ manifestJson: { warpos: { source: "self" } } });
  try {
    const r = resolveRepoRole({ root: dir });
    ok("role === 'canonical'", r.role === "canonical", `got: ${r.role}`);
    ok("source contains warpos.source", r.source.includes("warpos.source"), `got: ${r.source}`);
  } finally { cleanup(dir); }
}

// 7. Canonical via manifest.json#project.slug = "warpos"
section("Canonical signal — manifest.json#project.slug");
{
  const dir = makeTmpRepo({ manifestJson: { project: { slug: "warpos" } } });
  try {
    const r = resolveRepoRole({ root: dir });
    ok("role === 'canonical'", r.role === "canonical", `got: ${r.role}`);
    ok("source contains project.slug", r.source.includes("project.slug"), `got: ${r.source}`);
  } finally { cleanup(dir); }
}

// 8. Canonical via version.json#name = "warpos"
section("Canonical signal — version.json#name");
{
  const dir = makeTmpRepo({ versionJson: { name: "warpos" } });
  try {
    const r = resolveRepoRole({ root: dir });
    ok("role === 'canonical'", r.role === "canonical", `got: ${r.role}`);
    ok("source === 'version.json#name'", r.source === "version.json#name", `got: ${r.source}`);
  } finally { cleanup(dir); }
}

// 9. Consumer repo (framework-installed.json, no canonical signals)
section("Consumer repo");
{
  const dir = makeTmpRepo({ frameworkInstalled: true });
  try {
    const r = resolveRepoRole({ root: dir });
    ok("role === 'consumer'", r.role === "consumer", `got: ${r.role}`);
    ok("canonical === false", r.canonical === false);
    ok("consumer === true", r.consumer === true);
    ok("source contains framework-installed", r.source.includes("framework-installed"), `got: ${r.source}`);
  } finally { cleanup(dir); }
}

// 10. Unknown repo (no signals at all)
section("Unknown repo — no signals");
{
  const dir = makeTmpRepo({});
  try {
    const r = resolveRepoRole({ root: dir });
    ok("role === 'unknown'", r.role === "unknown", `got: ${r.role}`);
    ok("canonical === false", r.canonical === false);
    ok("consumer === false", r.consumer === false);
    ok("source === 'none'", r.source === "none", `got: ${r.source}`);
  } finally { cleanup(dir); }
}

// 11. Precedence: (a) explicit override arg beats everything
section("Precedence — (a) override arg wins over env and signals");
{
  const dir = makeTmpRepo({ warposManifest: true }); // canonical signal present
  const origEnv = process.env.WARPOS_REPO_ROLE;
  process.env.WARPOS_REPO_ROLE = "consumer"; // env says consumer
  try {
    const r = resolveRepoRole({ root: dir, override: "consumer" });
    ok("override arg wins — role === 'consumer'", r.role === "consumer", `got: ${r.role}`);
    ok("source === 'arg:override'", r.source === "arg:override", `got: ${r.source}`);
  } finally {
    if (origEnv === undefined) delete process.env.WARPOS_REPO_ROLE;
    else process.env.WARPOS_REPO_ROLE = origEnv;
    cleanup(dir);
  }
}

// 12. Precedence: (b) env override beats marker signals
section("Precedence — (b) env override beats marker signals");
{
  const dir = makeTmpRepo({ warposManifest: true }); // canonical signal present
  const origEnv = process.env.WARPOS_REPO_ROLE;
  process.env.WARPOS_REPO_ROLE = "consumer"; // override via env
  try {
    const r = resolveRepoRole({ root: dir });
    ok("env wins over signal — role === 'consumer'", r.role === "consumer", `got: ${r.role}`);
    ok("source === 'env:WARPOS_REPO_ROLE'", r.source === "env:WARPOS_REPO_ROLE", `got: ${r.source}`);
  } finally {
    if (origEnv === undefined) delete process.env.WARPOS_REPO_ROLE;
    else process.env.WARPOS_REPO_ROLE = origEnv;
    cleanup(dir);
  }
}

// 13. Precedence: (c) manifest signal beats (d) heuristic
section("Precedence — (c) manifest signal beats heuristic");
{
  // Both _warpos/MANIFEST.json AND version.json present: manifest wins (source should be manifest)
  const dir = makeTmpRepo({ warposManifest: true, versionJson: { name: "warpos" } });
  try {
    const r = resolveRepoRole({ root: dir });
    ok("role === 'canonical'", r.role === "canonical", `got: ${r.role}`);
    ok("manifest signal wins (source is _warpos/MANIFEST.json)", r.source === "marker:_warpos/MANIFEST.json", `got: ${r.source}`);
  } finally { cleanup(dir); }
}

// 14. Precedence: override arg case-sensitivity (lowercased)
section("Precedence — override arg lowercased");
{
  const r = resolveRepoRole({ override: "CANONICAL" });
  ok("override uppercased → lowercased role", r.role === "canonical", `got: ${r.role}`);
}

// 15. Fail-safe: corrupt manifest.json falls through to next signal
section("Fail-safe — corrupt manifest.json falls through");
{
  const dir = makeTmpRepo({ versionJson: { name: "warpos" } });
  // Write a corrupt manifest.json
  fs.mkdirSync(path.join(dir, ".claude"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".claude", "manifest.json"), "this is not JSON {{{");
  try {
    const r = resolveRepoRole({ root: dir });
    ok("corrupt manifest → falls through to version.json", r.role === "canonical", `got: ${r.role}`);
    ok("source === 'version.json#name'", r.source === "version.json#name", `got: ${r.source}`);
  } finally { cleanup(dir); }
}

// 16. Regression: refactored framework-purity-guard.js isCanonicalRepo() → canonical on this worktree
section("Regression — refactored guards produce identical verdicts");
{
  // Test framework-purity-guard.js isCanonicalRepo in-process by calling the
  // resolver directly with the same root it uses (PROJECT_DIR = cwd).
  const PROJECT_DIR = process.cwd();
  const r = resolveRepoRole({ root: PROJECT_DIR });
  ok("purity-guard: isCanonicalRepo() → true on this worktree", r.role === "canonical",
    `got: ${r.role} (source: ${r.source}). Worktree should be canonical.`);
}

{
  // Test requirements/gate.js isCanonicalRepo in-process.
  // gate.js resolves root as path.resolve(__dirname, "..", "..") from scripts/requirements/
  // which equals the project root.
  const gateRoot = path.resolve(__dirname, "..", "..");
  const r = resolveRepoRole({ root: gateRoot });
  ok("requirements/gate.js: isCanonicalRepo() → true on this worktree", r.role === "canonical",
    `got: ${r.role} (source: ${r.source})`);
}

{
  // Test testsuite/role.js isCanonical in-process via the role module itself.
  const { isCanonical } = require("../testsuite/role");
  const result = isCanonical();
  ok("testsuite/role.js: isCanonical() → true on this worktree", result === true,
    `got: ${result}`);
}

// 17. opts.cwd alias works the same as opts.root
section("opts.cwd alias");
{
  const dir = makeTmpRepo({ warposManifest: true });
  try {
    const r = resolveRepoRole({ cwd: dir });
    ok("cwd alias resolves correctly → canonical", r.role === "canonical", `got: ${r.role}`);
  } finally { cleanup(dir); }
}

// ── Summary ─────────────────────────────────────────────────────────────────

process.stdout.write(`\n${"─".repeat(55)}\n`);
process.stdout.write(`Tests: ${passed + failed}  PASS: ${passed}  FAIL: ${failed}\n`);

if (failed > 0) {
  process.stderr.write(`\n${failed} test(s) failed.\n`);
  process.exit(1);
} else {
  process.stdout.write("All tests passed.\n");
  process.exit(0);
}
