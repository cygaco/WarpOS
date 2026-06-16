#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// frontend-escaping.test.js — SP-20260615-002 S-3 / AC-R3c
//
// ::tracker-authored-html-metachars-are-escaped-not-injected
//   A board payload whose epic/sprint/ranked text carries HTML metacharacters
//   (<, >, &, ") — incl. a <script>-bearing title from a tracker file — renders as
//   ESCAPED TEXT, not live markup. Mirrors gui.js escapeHtml. A raw, unescaped
//   <script> in the rendered #root would FAIL.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const { renderWith } = require("./_dom-harness");

let pass = 0, fail = 0;
function ok(name, cond, msg) {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}\n      ${msg || ""}`); }
}

function poisonedBoard() {
  const XSS = '<script>alert(1)</script>';
  const AMP = 'A & B "quoted" <tag>';
  return {
    generatedAt: "2026-06-15T00:00:00.000Z",
    nextAction: "NEXT ACTION: " + XSS,
    nextActionAvailable: true,
    ranked: [{ n: 1, text: XSS }, { n: 2, text: AMP }],
    rankedAvailable: true,
    hasPickupQueue: false,
    inFlight: [{ id: XSS, status: "building" }],
    inFlightAvailable: true,
    activelyExecuting: [{ id: XSS, status: "building" }],
    stalePlanningCount: 0,
    primary: XSS,
    epics: [{ id: "E-X-001", title: XSS, state: "Active", percent: 50, childSprints: [XSS] }],
    sprintBreakdown: {
      [XSS]: { id: XSS, byState: { done: [AMP] }, counts: { done: 1 }, total: 1 },
    },
    sectionsUnavailable: [],
  };
}

async function main() {
  const { rootHtml } = await renderWith(poisonedBoard());

  // the LIVE injection vector must NOT appear verbatim anywhere in rendered #root
  ok("no live <script>alert(1)</script> in rendered DOM", !rootHtml.includes("<script>alert(1)</script>"), "UNESCAPED <script> injected!");
  // it must appear ESCAPED instead
  ok("the script title appears ESCAPED (&lt;script&gt;)", rootHtml.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), "escaped form not found");
  ok("ampersand is escaped (&amp;)", rootHtml.includes("&amp;"), "raw & rendered");
  ok("double-quote in content is escaped (&quot;)", rootHtml.includes("&quot;"), "raw quote rendered");

  // also exercise the drill modal (epic + sprint) — escaping must hold there too
  const { rootHtml: epicModal } = await renderWith(poisonedBoard(), {
    interact: async (win) => { win.openEpic("E-X-001"); },
  });
  ok("epic drill modal does not inject a live <script>", !epicModal.includes("<script>alert(1)</script>"), "UNESCAPED in epic modal!");
  ok("epic drill modal renders the escaped child id", epicModal.includes("&lt;script&gt;"), "escaped form absent in epic modal");

  console.log(`\nfrontend-escaping: ${pass}/${pass + fail} pass`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
