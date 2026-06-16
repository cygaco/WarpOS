"use strict";
// ─────────────────────────────────────────────────────────────────────────────
// _dom-harness.js — shared test harness for the SP-20260615-002 frontend tests.
//
// The roadmap GUI serves a single self-contained HTML doc whose inline <script>
// fetches GET /api/board and renders the four data areas client-side. To assert the
// RENDERED DOM against a STUBBED board payload WITHOUT a browser or any new dep
// (AC-R3a uses a stubbed payload; Playwright is the R-6 gauntlet's job), this harness:
//   1. calls renderHtml(token) to get the served document,
//   2. extracts the inline <script> body,
//   3. evaluates it inside a vm sandbox with a MINIMAL DOM + a STUBBED fetch that
//      returns the supplied board payload for /api/board,
//   4. lets the script's own loadBoard()→render() run, then returns the resulting
//      #root innerHTML for assertions.
//
// The DOM shim is intentionally tiny — it models only what the render path touches
// (getElementById, innerHTML, body.style, querySelectorAll('section.area') as a
// no-op list). It is NOT a general DOM; it exists to capture render() output.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const SCRIPT = path.join(ROOT, "scripts", "panel", "roadmap-gui.js");

function extractScriptBody(html) {
  // The page has exactly one <script> block (the app). Grab its body.
  const m = /<script>([\s\S]*?)<\/script>/.exec(html);
  if (!m) throw new Error("no inline <script> found in served HTML");
  return m[1];
}

// Render the served page against a stubbed board payload; return { rootHtml, win }.
// `interact` (optional) runs after the initial render, receiving the window object
// so a test can call window.toggleChip / openSprint / etc., then re-read root html.
async function renderWith(board, opts = {}) {
  const { renderHtml } = require(SCRIPT);
  const token = "a".repeat(64);
  const html = renderHtml(token);
  let scriptBody = extractScriptBody(html);

  // Neutralize the bare auto-boot call so we can drive loadBoard() deterministically
  // (it still defines loadBoard; we just don't want the un-awaited fire-at-eval).
  scriptBody = scriptBody.replace(/\n\s*loadBoard\(\);\s*\n/, "\n/* boot suppressed by harness */\n");

  // ── minimal DOM ────────────────────────────────────────────────────────────
  const rootEl = { id: "root", innerHTML: "" };
  const fetchCalls = [];
  const sandbox = {
    console,
    setTimeout, clearTimeout,
    document: {
      getElementById(id) { return id === "root" ? rootEl : null; },
      querySelectorAll() { return []; }, // section.area toggling is a no-op here
      body: { style: {} },
    },
    window: {},
    navigator: { sendBeacon() { fetchCalls.push({ beacon: true }); return true; } },
    fetch: async (url) => {
      fetchCalls.push({ url });
      if (/\/api\/board$/.test(url)) {
        return { ok: true, status: 200, statusText: "OK", json: async () => board };
      }
      if (/\/api\/health$/.test(url)) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ ok: true }) };
      }
      return { ok: false, status: 404, statusText: "Not Found", json: async () => ({ error: "not found" }) };
    },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(scriptBody, sandbox, { filename: "roadmap-gui.inline.js" });

  // drive the boot explicitly and await the render
  await sandbox.window.loadBoard();

  if (typeof opts.interact === "function") {
    await opts.interact(sandbox.window, fetchCalls);
  }

  return { rootHtml: rootEl.innerHTML, win: sandbox.window, fetchCalls, fullHtml: html };
}

// A fully-populated stub board (the warm path) — shapes mirror roadmap.js summary.
function fullBoard() {
  return {
    generatedAt: "2026-06-15T00:00:00.000Z",
    nextAction: "NEXT ACTION: ship the roadmap panel GUI",
    nextActionAvailable: true,
    ranked: [
      { n: 1, text: "roadmap panel GUI" },
      { n: 2, text: "admin suite polish" },
    ],
    rankedAvailable: true,
    hasPickupQueue: true,
    inFlight: [
      { id: "SP-20260615-002", status: "building", phase: "build" },
      { id: "SP-20260615-001", status: "in_review", phase: "review" },
      { id: "SP-20260614-003", status: "planning" },
    ],
    inFlightAvailable: true,
    activelyExecuting: [{ id: "SP-20260615-002", status: "building", phase: "build" }],
    stalePlanningCount: 1,
    primary: "SP-20260615-002",
    epics: [
      { id: "E-PRODUCT-FOUNDATION-001", title: "Product foundation seams", state: "Active", percent: 60, childSprints: ["SP-20260615-002", "SP-20260615-001"] },
      { id: "E-TRACKER-001", title: "Enforced tracker system", state: "Completed", percent: 100, childSprints: [] },
    ],
    sprintBreakdown: {
      "SP-20260615-002": { id: "SP-20260615-002", byState: { done: ["T-1"], in_progress: ["T-2", "T-3"], in_review: [] }, counts: { done: 1, in_progress: 2, in_review: 0 }, total: 3 },
      "SP-20260615-001": { id: "SP-20260615-001", byState: { done: ["T-9"] }, counts: { done: 1 }, total: 1 },
    },
    sectionsUnavailable: [],
  };
}

module.exports = { renderWith, fullBoard, ROOT, SCRIPT };
