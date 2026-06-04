#!/usr/bin/env node
/**
 * scope-contract-guard.js — ensures build-chain dispatches carry a scope contract.
 *
 * ADR-0007: the build-chain role set + role detection are REGISTRY-DERIVED, not
 * a hardcoded literal that silently no-ops on a rename. The set comes from
 * org-roles.gammaOnlyTypes() (org-map domain builders + gauntlet members + the
 * documented static augment) plus the review roles that also need a scope contract
 * (pod reviewers + qa-reviewer + security-reviewer + the visual reviewers that read
 * code). Role names are normalized through role-aliases so a legacy id (redteam,
 * qa, compliance, evaluator, …) resolves to its canonical role and is still gated.
 *
 * Fail-open: a hook bug / load failure must never block a dispatch.
 */

"use strict";

// normalizeRole maps legacy → canonical (redteam→security-reviewer, qa→qa-reviewer,
// compliance→qa-reviewer, evaluator→reviewer, …). Fail-open identity if unavailable.
let normalizeRole = (r) => r;
try {
  ({ normalizeRole } = require("./lib/role-aliases"));
} catch {
  /* keep identity */
}

// Build-chain + review roles that REQUIRE a scope contract. Derived from the org
// map (gammaOnlyTypes = build-chain doers) ∪ the cross-provider review roles ∪ the
// Claude-pinned visual reviewers. Computed once at load; a documented static
// fallback covers the bare-bootstrap / load-failure case (NEVER an empty set —
// empty = gate hole).
function deriveBuildChainSet() {
  const set = new Set([
    // ADR-0007 roster (canonical):
    "frontend-builder", "backend-builder", "security-builder",
    "frontend-fixer", "backend-fixer", "security-fixer",
    "frontend-reviewer", "backend-reviewer", "qa-reviewer", "security-reviewer",
    "design-quality", "visual-review",
    // generic transitional (still in the catalog during coexistence):
    "builder", "fixer",
  ]);
  try {
    const { gammaOnlyTypes } = require("../dispatch/org-roles");
    const derived = gammaOnlyTypes();
    if (derived instanceof Set) for (const r of derived) set.add(r);
  } catch {
    /* keep the static set */
  }
  // The legacy review ids normalize INTO the canonical roles above, so we don't
  // need to list them — isBuildChain() normalizes the role before the lookup.
  // test-runner is intentionally EXCLUDED: it runs a test suite, it doesn't author
  // code under a file scope, so it carries no scope contract (matches the old set).
  set.delete("test-runner");
  return set;
}

const BUILD_CHAIN = deriveBuildChainSet();

function isBuildChain(role) {
  if (!role) return false;
  const canon = normalizeRole(String(role).toLowerCase());
  return BUILD_CHAIN.has(canon) || BUILD_CHAIN.has(String(role).toLowerCase());
}

function resolveRole(event) {
  const explicit = event.tool_input?.subagent_type;
  if (explicit) return normalizeRole(String(explicit).toLowerCase());
  const prompt = (event.tool_input?.prompt || "").slice(0, 500);
  if (/^feature:\s*\S+/im.test(prompt)) return "builder";
  // Detect by role keyword in the prompt, normalized to canonical. Order:
  // security first (most specific), then qa/integrity, then generic reviewer.
  if (/\b(security-reviewer|redteam)\b/i.test(prompt)) return "security-reviewer";
  if (/\b(qa-reviewer|compliance|req-reviewer|\bqa\b)\b/i.test(prompt)) return "qa-reviewer";
  if (/\b(frontend-reviewer)\b/i.test(prompt)) return "frontend-reviewer";
  if (/\b(backend-reviewer)\b/i.test(prompt)) return "backend-reviewer";
  if (/\b(reviewer|evaluator)\b/i.test(prompt)) return "reviewer";
  return "unknown";
}

function hasScopeContract(prompt) {
  return /scopeContract|allowedFiles|forbiddenFiles|File Scope|In-scope files/i.test(prompt || "");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);
    if (event.tool_name !== "Agent" || event.tool_response !== undefined) process.exit(0);
    const role = resolveRole(event);
    if (!isBuildChain(role)) process.exit(0);
    const prompt = event.tool_input?.prompt || "";
    if (!hasScopeContract(prompt)) {
      console.log(
        JSON.stringify({
          decision: "block",
          reason: "scope-contract-guard: build-chain dispatch must include scopeContract or explicit allowedFiles/forbiddenFiles.",
        }),
      );
      process.exit(2);
    }
  } catch {
    process.exit(0);
  }
  process.exit(0);
});

module.exports = { hasScopeContract, resolveRole, isBuildChain, BUILD_CHAIN };
