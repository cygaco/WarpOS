#!/usr/bin/env node
/**
 * test-provider-health.js — unit tests for provider-health classifier.
 *
 * These tests exercise only the pure-function classifiers — not the real
 * CLI probes — so they pass on any developer machine.
 */

"use strict";

const path = require("path");
const ph = require(path.join(__dirname, "hooks", "lib", "provider-health.js"));

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push(`${name}: ${detail || "false"}`);
  }
}

// ── Gemini classifier ─────────────────────────────────────

const trustErr = ph.classifyGeminiError(
  "Error: Refusing to run gemini outside a trusted workspace directory.",
);
check(
  "trusted_directory_required from Gemini stderr",
  trustErr && trustErr.status === "trusted_directory_required",
);

const modelErr = ph.classifyGeminiError(
  "ModelNotFoundError: models/gemini-3.1-flash is not found for API version v1beta (404)",
);
check(
  "model_not_found from Gemini 404",
  modelErr && modelErr.status === "model_not_found",
);

const quotaErr = ph.classifyGeminiError(
  "Resource has been exhausted: rate limit exceeded (RATELIMIT)",
);
check(
  "quota_exhausted from Gemini ratelimit",
  quotaErr && quotaErr.status === "quota_exhausted",
);

const freeZero = ph.classifyGeminiError(
  "Free tier quota - limit: 0 per day for the requested model",
);
check(
  "free_tier_limit_zero detection",
  freeZero && freeZero.status === "free_tier_limit_zero",
);

const authErr = ph.classifyGeminiError("Unauthorized: invalid API key");
check(
  "auth_missing from Gemini unauthorized",
  authErr && authErr.status === "auth_missing",
);

check("Gemini empty stderr → null", ph.classifyGeminiError("") === null);
check(
  "Gemini noise stderr → null",
  ph.classifyGeminiError("ok response") === null,
);

// ── Codex classifier ──────────────────────────────────────

const codexAuth = ph.classifyCodexError(
  "Error: not logged in — run `codex login` first.",
);
check(
  "auth_missing from codex login prompt",
  codexAuth && codexAuth.status === "auth_missing",
);

const codexModel = ph.classifyCodexError(
  "404 — The model `gpt-5.5` does not exist or you do not have access.",
);
check(
  "model_not_found from codex 404",
  codexModel && codexModel.status === "model_not_found",
);

const codexQuota = ph.classifyCodexError(
  "429 — rate limit reached for this account",
);
check(
  "quota_exhausted from codex ratelimit",
  codexQuota && codexQuota.status === "quota_exhausted",
);

check("Codex empty stderr → null", ph.classifyCodexError("") === null);

// ── Top-level probe (no real CLI calls) ───────────────────

const claudeProbe = ph.probeProvider("claude");
check("claude probe is ok", claudeProbe.status === "ok");

if (failed > 0) {
  console.error(`FAIL — ${failed} of ${passed + failed} cases failed:`);
  for (const f of failures) console.error("  -", f);
  process.exit(1);
}

console.log(`OK — ${passed} cases passed`);
process.exit(0);
