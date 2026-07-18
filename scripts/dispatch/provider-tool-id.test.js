#!/usr/bin/env node
"use strict";

/**
 * D2 (SP-20260718-003 / I-2) — provider-id → tool-id reconcile.
 * The dispatch CONTRACT keys on tool-id (codex/gemini/agy); callers speak
 * provider-id (openai/gemini/antigravity). A single `providerToolId` map is used
 * at BOTH the validate call and the completion record. The bug (an inlined ternary
 * omitting antigravity→agy) tripped dispatch-contract on security-reviewer routing.
 *
 *   node scripts/dispatch/provider-tool-id.test.js
 */

const assert = require("assert");
const { harness } = require("../checks/lib/fixture-harness");
const { providerToolId, observedCompletionFields } = require("../dispatch-agent");

const h = harness("provider-tool-id");

h.test("providerToolId maps every known provider-id to its tool-id (incl. antigravity→agy)", () => {
  assert.strictEqual(providerToolId("openai"), "codex");
  assert.strictEqual(providerToolId("gemini"), "gemini");
  assert.strictEqual(providerToolId("antigravity"), "agy", "I-2: antigravity→agy (was the missing case)");
});

h.test("providerToolId passes through an unknown provider-id (never throws / never null)", () => {
  assert.strictEqual(providerToolId("claude"), "claude");
  assert.strictEqual(providerToolId("some-future-provider"), "some-future-provider");
});

// Teeth (β#4): the antigravity→agy case is the exact bug I-2. A regression to the
// old ternary (which omitted antigravity) would return "antigravity" here and fail.
h.violation("negative control: a map missing antigravity→agy fails the reconcile assertion", () => {
  const brokenMap = { openai: "codex", gemini: "gemini" }; // the OLD ternary shape
  const broken = (p) => brokenMap[p] ?? p;
  // The broken map returns "antigravity" (not "agy") → dispatch-contract tool_id
  // list [codex,gemini,agy] would reject it. Surface that as the caught violation.
  const wrong = broken("antigravity") !== "agy" ? ["antigravity→agy missing"] : [];
  return { violations: wrong };
});

// ── C2 (D2-FALSE-GREEN-001 · SR-004/QA-002): the completion record's provider/tool_id/fallback derive
//    from the OBSERVED result. A quota-fallback openai run must NEVER be stamped as observed-agy/false. ──
h.test("observedCompletionFields: a normal run stamps the observed provider (codex/false)", () => {
  const f = observedCompletionFields("openai", { provider: "openai", fallback: false });
  assert.strictEqual(f.provider, "openai");
  assert.strictEqual(f.tool_id, "codex");
  assert.strictEqual(f.fallback, false);
});
h.test("observedCompletionFields: agy quota-fallback → openai stamps codex/fallback:true, NOT agy/false", () => {
  // The exact false-green: request antigravity, quota-fallback to openai (result.provider=openai +
  // quotaFallbackFrom set). The record must reflect openai/codex/fallback:true so cert-attest rejects it.
  const f = observedCompletionFields("antigravity", {
    provider: "openai",
    fallback: false,
    quotaFallbackFrom: { provider: "antigravity", kind: "rate_limit" },
  });
  assert.strictEqual(f.provider, "openai", "must record the OBSERVED lab, not the requested agy");
  assert.strictEqual(f.tool_id, "codex", "tool_id must derive from the observed provider, not requested agy");
  assert.strictEqual(f.fallback, true, "a quota-fallback is a fallback for attestation (contracted lab didn't run)");
});
h.test("observedCompletionFields: an explicit runProvider fallback is marked fallback:true", () => {
  assert.strictEqual(observedCompletionFields("openai", { provider: "openai", fallback: true }).fallback, true);
});

h.violation("negative control: recording the REQUESTED provider on quota-fallback would false-attest agy", () => {
  // The OLD shape stamped the requested provider/tool_id with fallback:false — an openai run recorded as
  // agy/agy/false, which cert-attest (provider===agy && tool_id===agy && fallback:false) would ACCEPT.
  const oldRecord = { provider: "antigravity", tool_id: "agy", fallback: false }; // the bug shape
  const wouldFalseAttest = oldRecord.provider === "antigravity" && oldRecord.tool_id === "agy" && oldRecord.fallback === false;
  return { violations: wouldFalseAttest ? ["old shape false-attests agy on quota-fallback"] : [] };
});

h.done();
