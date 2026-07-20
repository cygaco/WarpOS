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

// (The Gemini classifier tests were removed with classifyGeminiError in the 2026-07-20
// deep-clean — the SUNSET individual gemini CLI is gone; the agy lane self-auths via its
// keyring and its probe failures fall through to the generic unknown_error path.)

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
