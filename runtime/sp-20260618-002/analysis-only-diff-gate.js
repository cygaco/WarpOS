#!/usr/bin/env node
"use strict";
/**
 * runtime/sp-20260618-002/analysis-only-diff-gate.js — the ANALYSIS-ONLY close-gate for
 * SP-20260618-002 (E-MC-READINESS-ANALYSIS-001), β-required + DoE-ruled.
 *
 * WHY THIS LIVES IN runtime/ (not scripts/checks/): a committed scripts/checks/ enforcer would
 * itself be a write under scripts/ — a forbidden_diff_path the gate forbids — so it would FAIL
 * ITSELF. DoE ruling (d-mqk5wn8b, 0.86): keep the LOGIC in a runtime/ helper WITH a negative-case
 * self-check; the inline light-gauntlet check delegates to it; the PERMANENT enforcer (a real
 * scripts/checks/analysis-only-diff-gate.js, or generalize scripts/checks/framework-purity.js) is an
 * EXECUTION-epic finding, NOT scope-contract-guard (that's a dispatch-TIME guard = wrong seam).
 *
 * THE GATE (β plan→design DECIDE B 0.88, central HOW): on the sprint branch,
 *   git diff --name-only <base>...HEAD
 * must intersect ONLY (allowed_writes ∪ allowed_generated_artifacts). ANY path outside both, or any
 * forbidden_diff_path, => the analysis-only invariant was VIOLATED => exit 1 (the light gauntlet FAILS).
 *
 * FAIL-CLOSED (DoE): empty/error diff, detached HEAD, git failure, or an unexpected source edit
 * (paths.json/lib.generated appearing without a paths.registry edit) => exit 1, NEVER silent-green.
 *
 * Usage:
 *   node runtime/sp-20260618-002/analysis-only-diff-gate.js [--base <ref>] [--json]
 *   node runtime/sp-20260618-002/analysis-only-diff-gate.js --selftest   # negative-case self-check
 * Exit: 0 clean (diff ⊆ allowed) · 1 VIOLATION or fail-closed condition · 2 usage/self-test fail.
 */

const { execFileSync } = require("child_process");

// ── The enumerated allowlist (mirrors BUILD-SPEC.md global_scope_guard; the SOURCE the gate checks).
// Exact files A1/A2/A3 hand-edit + the runtime evidence surface + the generated-artifacts-of-allowed-docs.
const ALLOWED_EXACT = new Set([
  "_reports/E-MC-READINESS-track1-hardening-simulation.md", // A1
  "_reports/E-MC-READINESS-findings-register.md", // A2
  "trackers/epics/E-MC-READINESS-ANALYSIS-001-release-readiness-analysis.md", // A3
  "ROADMAP.md", // A3
  "TRACKER.md", // A3
  // generated-artifact-of-an-allowed-doc-edit (the manifest-allowlist carve — A3's regen):
  "_warpos/MANIFEST.json",
  ".claude/framework-manifest.json",
]);
const ALLOWED_PREFIXES = ["runtime/sp-20260618-002/", "runtime/sp-20260618-002"]; // evidence surface

// Forbidden SOURCE roots — a hand-edit here = analysis-only VIOLATED (a leaked fix). Explicit so a
// match produces a precise message; anything not in ALLOWED is also rejected (the default-deny below).
const FORBIDDEN_PREFIXES = [
  "product/",
  "framework/", // SOURCE (NB: the generated .claude/framework-manifest.json is allowed above)
  "scripts/",
  ".claude/commands/",
  ".claude/agents/",
  "schemas/",
  "patterns/",
  // generated views that imply an UNEXPECTED source edit this sprint (no paths.registry edit planned):
  ".claude/paths.json",
  "scripts/hooks/lib/paths.generated.js",
];

function isAllowed(p) {
  if (ALLOWED_EXACT.has(p)) return true;
  return ALLOWED_PREFIXES.some((pre) => p === pre || p.startsWith(pre));
}
function forbiddenReason(p) {
  const hit = FORBIDDEN_PREFIXES.find((pre) => p === pre || p.startsWith(pre));
  return hit ? `forbidden source path (analysis-only violated): ${p} [under ${hit}]` : null;
}

/** Resolve the merge-base diff name list. Returns {ok, files[], error}. FAIL-CLOSED on any git issue. */
function changedFiles(base, runner) {
  const run = runner || ((args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
  try {
    const head = run(["rev-parse", "--abbrev-ref", "HEAD"]).trim();
    if (!head || head === "HEAD") return { ok: false, error: "detached HEAD — cannot scope the diff (fail-closed)" };
    const out = run(["diff", "--name-only", `${base}...HEAD`]);
    const files = out.split("\n").map((s) => s.trim()).filter(Boolean);
    return { ok: true, files };
  } catch (e) {
    return { ok: false, error: `git diff failed (fail-closed): ${e.message}` };
  }
}

/** Evaluate a list of changed files against the allowlist. PURE (testable). */
function evaluate(files) {
  const violations = [];
  for (const f of files) {
    if (isAllowed(f)) continue;
    violations.push(forbiddenReason(f) || `path outside the analysis-only allowlist: ${f}`);
  }
  return { ok: violations.length === 0, violations, considered: files.length };
}

function selftest() {
  // Negative-case self-check (DoE: the gate must PROVE it fails closed).
  const cases = [
    { name: "allowed doc passes", files: ["_reports/E-MC-READINESS-findings-register.md"], wantOk: true },
    { name: "allowed generated manifest passes", files: ["_warpos/MANIFEST.json"], wantOk: true },
    { name: "runtime evidence passes", files: ["runtime/sp-20260618-002/x.json"], wantOk: true },
    { name: "scripts/ edit FAILS", files: ["scripts/warpos/update.js"], wantOk: false },
    { name: "framework/ source edit FAILS", files: ["framework/templates/x.tmpl"], wantOk: false },
    { name: ".claude/agents edit FAILS", files: [".claude/agents/foo.md"], wantOk: false },
    { name: "unexpected paths.json FAILS", files: [".claude/paths.json"], wantOk: false },
    { name: "random path FAILS (default-deny)", files: ["foo/bar.js"], wantOk: false },
    { name: "mixed: one bad among good FAILS", files: ["ROADMAP.md", "scripts/x.js"], wantOk: false },
  ];
  let pass = 0;
  for (const c of cases) {
    const got = evaluate(c.files).ok;
    const ok = got === c.wantOk;
    console.log(`${ok ? "ok  " : "FAIL"} ${c.name} (got ok=${got}, want ${c.wantOk})`);
    if (ok) pass++;
  }
  console.log(`\n${pass}/${cases.length} self-test cases passed`);
  return pass === cases.length ? 0 : 2;
}

function main(argv) {
  if (argv.includes("--selftest")) return selftest();
  const json = argv.includes("--json");
  const bi = argv.indexOf("--base");
  const base = bi !== -1 && argv[bi + 1] ? argv[bi + 1] : "main";
  const cf = changedFiles(base);
  if (!cf.ok) {
    // FAIL-CLOSED: any git/HEAD problem is a RED, never a silent pass.
    const r = { ok: false, gate: "analysis-only-diff", base, error: cf.error };
    process.stdout.write((json ? JSON.stringify(r) : `FAIL [analysis-only-diff] ${cf.error}`) + "\n");
    return 1;
  }
  const res = evaluate(cf.files);
  const r = { ok: res.ok, gate: "analysis-only-diff", base, considered: res.considered, violations: res.violations };
  if (json) {
    process.stdout.write(JSON.stringify(r, null, 2) + "\n");
  } else if (res.ok) {
    process.stdout.write(`OK   [analysis-only-diff] ${res.considered} changed file(s), all within the analysis-only allowlist (base ${base}).\n`);
  } else {
    process.stdout.write(`FAIL [analysis-only-diff] ${res.violations.length} violation(s):\n - ${res.violations.join("\n - ")}\n`);
  }
  return res.ok ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { evaluate, isAllowed, forbiddenReason, changedFiles, ALLOWED_EXACT, FORBIDDEN_PREFIXES };
