#!/usr/bin/env node
"use strict";

/**
 * Isolated P5 test for dispatch-contract.js (the §17.1 keystone reader/validator).
 * Proves the three operator-named dispatch failures are CAUGHT as contract
 * violations, the happy shapes pass, unknown roles fail closed, skills fail closed
 * to inline, and a planted BROKEN contract fails the integrity check.
 *
 *   node scripts/dispatch/dispatch-contract.test.js
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { harness, sealedDir } = require("../checks/lib/fixture-harness");
const {
  validateDispatch, validateDispatchForClass, contractForRole, classForRole, skillExecution, validateContractFile, CONTRACT_PATH,
} = require("./dispatch-contract");

const h = harness("dispatch-contract");

// ── known-answer: real contract is internally consistent ────
h.pass("validateContractFile() passes on the real keystone", () => validateContractFile());

// ── class derivation is correct ─────────────────────────────
h.test("class derivation: builder=build_chain_worker, security-reviewer=cross_provider_reviewer, design-quality=claude_pinned_reviewer, alpha=face", () => {
  assert.strictEqual(classForRole("frontend-builder"), "build_chain_worker");
  assert.strictEqual(classForRole("security-reviewer"), "cross_provider_reviewer");
  assert.strictEqual(classForRole("design-quality"), "claude_pinned_reviewer");
  assert.strictEqual(classForRole("alpha"), "face");
  assert.strictEqual(classForRole("director-of-engineering"), "manager");
});

// ── happy shapes pass ───────────────────────────────────────
h.pass("builder via subprocess-claude (with a worktree cwd) is allowed", () =>
  validateDispatch({ role: "frontend-builder", shape: "subprocess-claude", toolId: "claude", cwd: path.join(__dirname, "..", "..", "wt-fixture") }));
// GPT-5.5 review R2 MEDIUM regression guard: omitting cwd for a worktree-required
// role is NOT a bypass — it must be flagged.
h.violation("builder with NO cwd is rejected (omitting cwd is not a worktree bypass)", () =>
  validateDispatch({ role: "frontend-builder", shape: "subprocess-claude", toolId: "claude" }));
h.pass("security-reviewer via subprocess-cross-provider (gemini) is allowed", () =>
  validateDispatch({ role: "security-reviewer", shape: "subprocess-cross-provider", toolId: "gemini" }));
h.pass("design-quality via in-process-agent is allowed (MCP carve-out)", () =>
  validateDispatch({ role: "design-quality", shape: "in-process-agent", toolId: "agent-tool" }));

// ── PLANTED VIOLATIONS — the three operator failures ────────
// (iii) in-process-when-subprocess: a build-chain role via the Agent tool.
h.violation("(iii) build-chain role via in-process-agent is REJECTED", () =>
  validateDispatch({ role: "frontend-builder", shape: "in-process-agent" }));
// (ii) API-when-CLI: a CLI reviewer dispatched via the API shape.
h.violation("(ii) cross-provider reviewer via api is REJECTED (availability != authorization)", () =>
  validateDispatch({ role: "security-reviewer", shape: "api" }));
// cross-provider reviewer via in-process-agent (kills provider diversity).
h.violation("cross-provider reviewer via in-process-agent is REJECTED (diversity)", () =>
  validateDispatch({ role: "qa-reviewer", shape: "in-process-agent" }));
// tool mismatch.
h.violation("builder via subprocess-claude but tool=codex is REJECTED", () =>
  validateDispatch({ role: "frontend-builder", shape: "subprocess-claude", toolId: "codex" }));
// build-chain in canonical cwd.
h.violation("build-chain role with cwd=canonical-root is REJECTED (worktree-required)", () =>
  validateDispatch({ role: "backend-builder", shape: "subprocess-claude", toolId: "claude", cwd: path.resolve(__dirname, "..", "..") }));

// ── fail-closed: unknown role ───────────────────────────────
h.failClosed("unknown role fails closed (no contract => rejected)", () =>
  validateDispatch({ role: "totally-made-up-role", shape: "subprocess-claude" }));

// ── skills: unverified subprocess falls back to inline ──────
h.test("skillExecution: unverified subprocess candidate falls back to inline (fail-closed)", () => {
  const r = skillExecution("scan:full");
  assert.strictEqual(r.execution, "inline", JSON.stringify(r));
  assert.strictEqual(r.verified, false);
});
h.test("skillExecution: an unlisted skill defaults to inline", () => {
  assert.strictEqual(skillExecution("some:lightweight-skill").execution, "inline");
});

// ── PLANTED BROKEN CONTRACT — integrity check must bite ─────
h.violation("a contract with a bogus shape FAILS validateContractFile (via path-override)", () => {
  const real = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
  real.role_classes.face.allowed_shapes = ["ghost-shape-does-not-exist"]; // plant
  const fx = sealedDir({ "dispatch-contract.json": JSON.stringify(real) }, "brokencontract");
  try {
    const r = spawnSync(process.execPath, [path.join(__dirname, "dispatch-contract.js"), "validate"], {
      env: { ...process.env, WARPOS_DISPATCH_CONTRACT_PATH: fx.file("dispatch-contract.json") },
      encoding: "utf8",
    });
    // ok:true only if the broken contract wrongly passed (exit 0).
    return { ok: r.status === 0 };
  } finally {
    fx.cleanup();
  }
});

// GPT-5.5 review MEDIUM regression guard: even a MISCONFIGURED contract that
// re-allows in-process-agent for a build-chain class must NOT let a build-chain
// role be dispatched in-process — validateDispatch enforces it directly against
// role-registry (defense in depth), independent of the contract file.
h.violation("a build-chain role via in-process-agent is rejected EVEN with a contract that re-allows it", () => {
  const real = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
  real.role_classes.build_chain_worker.allowed_shapes = ["subprocess-claude", "in-process-agent"]; // misconfig
  real.role_classes.build_chain_worker.forbidden_shapes = []; // removed the guard
  const fx = sealedDir({ "dispatch-contract.json": JSON.stringify(real) }, "reallowcontract");
  try {
    const r = spawnSync(process.execPath, [path.join(__dirname, "dispatch-contract.js"), "check", "frontend-builder", "in-process-agent"], {
      env: { ...process.env, WARPOS_DISPATCH_CONTRACT_PATH: fx.file("dispatch-contract.json") },
      encoding: "utf8",
    });
    // ok:true only if the misconfigured contract WRONGLY let it through (exit 0).
    return { ok: r.status === 0 };
  } finally {
    fx.cleanup();
  }
});

// ── G1 / β option (c): generic build id 'builder' → build_chain_worker ─────────
// validateDispatch still returns ok:false for 'builder' (not in role-registry — correct);
// validateDispatchForClass resolves build_chain_worker directly — the TRUTHFUL path.

// NEW: the class-level helper resolves build_chain_worker + subprocess-claude → OK.
// A non-canonical cwd satisfies the worktree-required policy.
h.pass("G1: validateDispatchForClass(build_chain_worker, subprocess-claude, worktree cwd) → contract-OK (truthful advisory)", () =>
  validateDispatchForClass({
    class: "build_chain_worker",
    shape: "subprocess-claude",
    toolId: "claude",
    cwd: path.join(__dirname, "..", "..", "wt-fixture"),
  }));

// (planted-G1) The OLD path: validateDispatch alone returns ok:false with "(fail-closed)"
// for 'builder' — that is the LIE G1 eliminates. We assert this explicitly so any
// revert that drops the GENERIC_BUILD_IDS re-route is immediately detectable.
h.violation("(planted-G1) validateDispatch for 'builder' still returns fail-closed — the lying advisory the G1 fix eliminates", () =>
  validateDispatch({
    role: "builder",
    shape: "subprocess-claude",
    toolId: "claude",
    cwd: path.join(__dirname, "..", "..", "wt-fixture"),
  }));

// (planted-G1) validateDispatchForClass MUST NOT produce '(fail-closed)' for the
// build_chain_worker class — if it did, the fix is broken (it would just move the lie).
h.test("(planted-G1) validateDispatchForClass must NOT produce '(fail-closed)' wording for build_chain_worker + subprocess-claude", () => {
  const v = validateDispatchForClass({
    class: "build_chain_worker",
    shape: "subprocess-claude",
    toolId: "claude",
    cwd: path.join(__dirname, "..", "..", "wt-fixture"),
  });
  assert.strictEqual(v.ok, true, `expected ok:true from validateDispatchForClass, got violations: ${JSON.stringify(v.violations)}`);
  const hasFailClosed = (v.violations || []).some((viol) => viol.includes("fail-closed"));
  assert.strictEqual(hasFailClosed, false, `validateDispatchForClass must NOT produce '(fail-closed)' wording — if it does, the G1 fix is broken: ${JSON.stringify(v.violations)}`);
});

h.done();
