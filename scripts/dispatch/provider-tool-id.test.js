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
const { providerToolId } = require("../dispatch-agent");

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

h.done();
