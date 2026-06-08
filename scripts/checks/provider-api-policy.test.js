#!/usr/bin/env node
"use strict";

/**
 * Isolated P5 test for provider-api-policy.js (N-2, the CLI-vs-API enforcer).
 * Proves a raw provider-API call OUTSIDE the allowlist is CAUGHT, the SAME call
 * inside an allowlisted file PASSES, a clean file passes, the raw-HTTP signature
 * only fires when a provider host is co-located (no false positive on an ordinary
 * fetch), a stale allowlist entry is surfaced, and the runner fails closed on
 * malformed input.
 *
 *   node scripts/checks/provider-api-policy.test.js
 */

const { harness } = require("./lib/fixture-harness");
const { evaluate, scanText } = require("./provider-api-policy");

const h = harness("provider-api-policy");

const ALLOWLIST = [{ path: "scripts/research/openai-deep-research.js", reason: "deep-research no-CLI" }];

// A raw OpenAI API call (host literal + SDK shape) — the violation we hunt.
const RAW_API_SRC = [
  "const OpenAI = require('openai');",
  "const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });",
  "const r = await client.responses.create({ model: 'gpt-5', input });",
  "await fetch('https://api.openai.com/v1/responses', { method: 'POST' });",
].join("\n");

// A perfectly clean file — routes via the CLI wrapper, no provider host anywhere.
const CLEAN_SRC = [
  "const { exec } = require('child_process');",
  "exec('node scripts/dispatch-agent.js security-reviewer prompt.txt');",
  "const data = await fetch('https://example.com/data.json');", // ordinary fetch, NOT a provider host
].join("\n");

// ── known-answer: a clean file passes ───────────────────────
h.pass("a file that routes via the CLI wrapper (no provider host) passes", () =>
  evaluate({ files: [{ path: "scripts/dispatch/some-router.js", text: CLEAN_SRC }], allowlist: ALLOWLIST }));

// ── PLANTED: raw api.openai.com call OUTSIDE the allowlist is CAUGHT ──
h.violation("a raw api.openai.com call OUTSIDE the allowlist is flagged", () =>
  evaluate({ files: [{ path: "scripts/agents/rogue-reviewer.js", text: RAW_API_SRC }], allowlist: ALLOWLIST }));

// ── known-answer: the SAME call inside an allowlisted file PASSES ──
h.pass("the same raw call inside an allowlisted file is suppressed", () =>
  evaluate({ files: [{ path: "scripts/research/openai-deep-research.js", text: RAW_API_SRC }], allowlist: ALLOWLIST }));

// ── PLANTED: gemini host literal outside the allowlist is CAUGHT ──
h.violation("a generativelanguage.googleapis.com host literal outside the allowlist is flagged", () =>
  evaluate({
    files: [{ path: "scripts/agents/rogue-gemini.js", text: "fetch('https://generativelanguage.googleapis.com/v1beta/models')" }],
    allowlist: ALLOWLIST,
  }));

// ── known-answer: a raw fetch to a NON-provider URL is NOT flagged ──
h.pass("an ordinary fetch() to a non-provider URL is not a violation", () =>
  evaluate({ files: [{ path: "scripts/util/fetcher.js", text: "await fetch('https://example.com/x');" }], allowlist: ALLOWLIST }));

// ── scanText: a chat.completions SDK shape fires on its own ──
h.test("scanText flags a bare chat.completions SDK call shape", () => {
  const hits = scanText("await openai.chat.completions.create({});");
  if (hits.length !== 1 || !/chat\.completions/.test(hits[0].signature)) throw new Error(JSON.stringify(hits));
});

// ── stale-allowlist surfacing ───────────────────────────────
h.test("an allowlist entry that matched no hit is surfaced as stale", () => {
  const res = evaluate({
    files: [{ path: "scripts/clean.js", text: CLEAN_SRC }],
    allowlist: [{ path: "scripts/research/openai-deep-research.js", reason: "x" }],
  });
  if (!res.stale.includes("scripts/research/openai-deep-research.js")) throw new Error(JSON.stringify(res.stale));
});

// ── fail-closed on malformed input ──────────────────────────
h.failClosed("evaluate(null) fails closed (does not green a malformed call)", () => evaluate(null));

h.done();
