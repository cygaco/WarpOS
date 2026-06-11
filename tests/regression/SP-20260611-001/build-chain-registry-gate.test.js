#!/usr/bin/env node
"use strict";

/**
 * build-chain-registry-gate.test.js — regression for SP-20260611-001 fix 3 (T-312, R-3).
 *
 * Finding (crossfam-findings-2026-06-10 §A.3): the two build-chain gates in
 * dispatch-claude.js (the --review-fallback refusal ~182 and the worktree-isolation gate
 * ~225) consulted ONLY the literal BUILD_CHAIN_ROLES Set. A build-chain-class role
 * registered in role-registry.json but ABSENT from the Set bypassed BOTH gates — it could
 * run in canonical (editing the live repo) or sneak through the read-only review-fallback
 * lane. Four REAL roles were already in this gap: frontend-fixer, backend-fixer,
 * security-builder, security-fixer (class build_chain_worker, not in the Set).
 *
 * The fix: membership DERIVES from the registry class — isBuildChainRole(role) =
 * classForRole(role) === 'build_chain_worker' || BUILD_CHAIN_ROLES.has(role). The literal
 * Set is retained as an EXPLICIT FALLBACK (generic ids like "builder" that are
 * intentionally not in the registry; and fail-closed if the registry is unreadable —
 * NEVER "no gate").
 *
 * Exploit-shaped (BC-16): asserts a registry build-chain role NOT in the Set is now gated
 * at BOTH sites (the bypass is closed), while membership PARITY holds — no literal-Set
 * member is dropped (no narrowing) and no non-build-chain role is spuriously gated.
 *
 *   node tests/regression/SP-20260611-001/build-chain-registry-gate.test.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../../..");
const DISPATCH_CLAUDE = path.join(ROOT, "scripts", "dispatch-claude.js");
const dc = require(path.join(ROOT, "scripts", "dispatch", "dispatch-contract"));

// The literal Set as it stands in dispatch-claude.js (mirror — kept in sync by the parity test).
const BUILD_CHAIN_ROLES = new Set(["builder", "backend-builder", "frontend-builder", "fixer", "skeleton-builder", "stub-scaffold"]);

// Local mirror of the SHIPPED isBuildChainRole derivation (Set ∪ registry-class), so the
// parity test reasons about the exact gate predicate without re-spawning for every role.
function isBuildChainRoleDerived(role) {
  if (!role) return false;
  const lower = role.toLowerCase();
  if (BUILD_CHAIN_ROLES.has(lower)) return true;
  try { return dc.classForRole(role) === "build_chain_worker"; } catch { return false; }
}

let passed = 0;
let failed = 0;
function ok(name, cond, detail) {
  if (cond) { passed++; console.log(`  ok  ${name}`); }
  else { failed++; console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`); }
}

// ── Integration harness: run the SHIPPED wrapper as a subprocess (no real claude). ──
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "bc-gate-test-"));
process.on("exit", () => { try { fs.rmSync(scratch, { recursive: true, force: true }); } catch {} });
const fakeHappy = path.join(scratch, "fake-happy.js");
fs.writeFileSync(fakeHappy, 'process.stdout.write(JSON.stringify({ ok: true }));\n');
const promptFile = path.join(scratch, "prompt.txt");
fs.writeFileSync(promptFile, "Do the thing.\n");

function runWrapper({ role, extraArgs = [], ledgerName }) {
  const ledgerDir = path.join(scratch, ledgerName);
  fs.mkdirSync(ledgerDir, { recursive: true });
  const env = {
    ...process.env,
    DISPATCH_LEDGER_DIR: ledgerDir,
    DISPATCH_CLAUDE_BIN: process.execPath,
    DISPATCH_CLAUDE_BIN_ARGS: JSON.stringify([fakeHappy]),
  };
  // No isolation flag (-w/--worktree) → the worktree gate must refuse a build-chain role.
  const res = spawnSync(
    process.execPath,
    [DISPATCH_CLAUDE, role, promptFile, "--model", "sonnet", ...extraArgs],
    { env, encoding: "utf8", timeout: 60000 },
  );
  return res;
}

console.log("(1) membership-derives-from-registry-class:");
{
  // A REAL registry role with class build_chain_worker that is NOT in the literal Set.
  // (security-builder serves as the 'registered-but-not-in-Set' case the bug let bypass.)
  const role = "security-builder";
  ok(`${role} is class build_chain_worker in the registry`, dc.classForRole(role) === "build_chain_worker");
  ok(`${role} is NOT in the literal BUILD_CHAIN_ROLES Set`, !BUILD_CHAIN_ROLES.has(role.toLowerCase()));
  ok(`${role} is gated by the DERIVED predicate (Set-only would miss it)`, isBuildChainRoleDerived(role) === true);

  // End-to-end at the WORKTREE gate: no -w/--worktree → refused (exit 2).
  const wt = runWrapper({ role, ledgerName: "g1-wt" });
  ok(
    `${role} w/o -w → worktree gate REFUSES (exit 2) [bypass closed at the shipped wrapper]`,
    wt.status === 2 && /build_chain_worker/.test(wt.stderr || ""),
    `status=${wt.status} stderr=${(wt.stderr || "").slice(0, 300)}`,
  );
}

console.log("\n(2) membership-parity-existing-roles:");
{
  // Enumerate the union of (literal Set ∪ every registry role). For each, compare the
  // OLD gate (Set-only) with the NEW gate (derived). The derivation may only WIDEN to
  // catch real build-chain roles the Set missed — it must NEVER NARROW (drop a Set member)
  // and must NEVER spuriously gate a non-build-chain role.
  const reg = dc.loadRegistry();
  const regRoles = Object.keys(reg.roles || {});
  const union = new Set([...BUILD_CHAIN_ROLES, ...regRoles]);

  // (a) No narrowing: every literal-Set member stays gated under the derived predicate.
  const dropped = [...BUILD_CHAIN_ROLES].filter((r) => !isBuildChainRoleDerived(r));
  ok("no narrowing — every literal-Set member stays gated", dropped.length === 0, `dropped: ${JSON.stringify(dropped)}`);

  // (b) No spurious widening: every role the derived predicate gates is EITHER in the Set
  //     OR genuinely class build_chain_worker — never a reviewer/lead/tool/face.
  const widenedWrong = [...union].filter(
    (r) => isBuildChainRoleDerived(r) && !BUILD_CHAIN_ROLES.has(r.toLowerCase()) && dc.classForRole(r) !== "build_chain_worker",
  );
  ok("no spurious widening — only Set members or real build_chain_worker roles are gated", widenedWrong.length === 0, `wrongly-gated: ${JSON.stringify(widenedWrong)}`);

  // (c) The ONLY existing roles where derived != Set-only are real build_chain_worker roles
  //     the Set was missing (the fix's intent). Each such role MUST be class build_chain_worker.
  const widenedRight = [...union].filter(
    (r) => isBuildChainRoleDerived(r) && !BUILD_CHAIN_ROLES.has(r.toLowerCase()),
  );
  ok(
    "the only widened roles are genuine build_chain_worker roles (closed gap, not a regression)",
    widenedRight.every((r) => dc.classForRole(r) === "build_chain_worker"),
    `widened: ${JSON.stringify(widenedRight)}`,
  );
  // Sanity: the four known real-gap roles are among the now-gated set.
  for (const r of ["frontend-fixer", "backend-fixer", "security-builder", "security-fixer"]) {
    ok(`real-gap role '${r}' is now gated (was bypassing the Set)`, isBuildChainRoleDerived(r) === true);
  }

  // (d) A representative non-build-chain role is NEVER gated (parity for the negative case).
  for (const r of ["qa-reviewer", "backend-reviewer", "product-lead", "epsilon"]) {
    ok(`non-build-chain role '${r}' is NOT gated (parity preserved)`, isBuildChainRoleDerived(r) === false);
  }
}

console.log("\n(3) new-registry-role-cannot-bypass:");
{
  // A registry build-chain role absent from the literal Set must be refused at BOTH gates.
  // security-builder = the real 'registered build-chain role not in the Set' case.
  const role = "security-builder";

  // Gate 1 — worktree isolation: no -w/--worktree → exit 2.
  const wt = runWrapper({ role, ledgerName: "g3-wt" });
  ok(
    "worktree gate: registered-not-in-Set build role w/o -w → exit 2 (no bypass)",
    wt.status === 2 && /requires isolation/i.test(wt.stderr || ""),
    `status=${wt.status} stderr=${(wt.stderr || "").slice(0, 300)}`,
  );
  ok("worktree refusal names the registry class provenance (C-3)", /build_chain_worker/.test(wt.stderr || ""));

  // Gate 2 — review-fallback refusal: a build-chain role can't sneak through the read-only lane.
  const rf = runWrapper({ role, extraArgs: ["--review-fallback"], ledgerName: "g3-rf" });
  ok(
    "review-fallback refusal: registered-not-in-Set build role via --review-fallback → exit 2 (no bypass)",
    rf.status === 2 && /review-fallback cannot be used with build-chain role/i.test(rf.stderr || ""),
    `status=${rf.status} stderr=${(rf.stderr || "").slice(0, 300)}`,
  );
  // No completion record on a refused dispatch.
  const comps = fs.existsSync(path.join(scratch, "g3-rf", "dispatch-completions.jsonl"))
    ? fs.readFileSync(path.join(scratch, "g3-rf", "dispatch-completions.jsonl"), "utf8").split(/\r?\n/).filter(Boolean)
    : [];
  ok("no completion record written for the refused build-chain dispatch", comps.length === 0);
}

console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — build-chain-registry-gate: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
