#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// frontend-areas.test.js — SP-20260615-002 S-3 / AC-R3a [β-1]
//
// ::four-data-area-selectors-present-and-populated-from-board-json
//   Served HTML + a STUBBED fully-populated board payload → the FOUR stable
//   [data-area] selectors are present AND populated (cards/progress, not a raw text
//   dump). epics render a visible progress indicator reflecting `percent`. These
//   selectors are the contract the R-6 gauntlet asserts against.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const { renderWith, fullBoard } = require("./_dom-harness");

let pass = 0, fail = 0;
function ok(name, cond, msg) {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}\n      ${msg || ""}`); }
}

async function main() {
  const { rootHtml } = await renderWith(fullBoard());

  for (const area of ["active-sprints", "roadmap", "epics", "sprint-breakdown"]) {
    ok(`[data-area="${area}"] present`, rootHtml.includes(`data-area="${area}"`), "selector missing");
  }
  // next-action hero + toolbar are also present
  ok('[data-area="next-action"] hero present', rootHtml.includes('data-area="next-action"'), "hero missing");
  ok('[data-area="toolbar"] present', rootHtml.includes('data-area="toolbar"'), "toolbar missing");

  // populated, NOT a raw text dump: cards carry data-id, epics carry a progress bar.
  ok("active-sprints populated with a sprint card (data-id present)", rootHtml.includes('data-id="SP-20260615-002"'), "no sprint card");
  ok("roadmap populated with ranked card", /data-id="rank-1"/.test(rootHtml), "no ranked card");
  ok("epics populated with epic card", rootHtml.includes('data-id="E-PRODUCT-FOUNDATION-001"'), "no epic card");
  ok("epics show a visible progress bar reflecting percent", /class="fill[^"]*"\s+style="width:60%/.test(rootHtml), "no 60% progress fill");
  ok("sprint-breakdown populated with a breakdown card", /data-area="sprint-breakdown"[\s\S]*data-id="SP-20260615-002"/.test(rootHtml) || rootHtml.includes("3 tickets"), "no breakdown card");

  // cards use the .row idiom + status pills (not raw text)
  ok("status rendered as a pill (not raw text)", /class="pill g-active"/.test(rootHtml), "no active pill");

  // The "what needs me" default hides Done + Planning. Enable Done → the completed
  // epic's 100% done fill and the in_review sprint become visible (filter + the
  // state-colored fill table both exercised).
  const { rootHtml: withDone } = await renderWith(fullBoard(), {
    interact: async (win) => { win.toggleChip("done"); },
  });
  ok("toggling Done on reveals the completed epic", withDone.includes('data-id="E-TRACKER-001"'), "completed epic still hidden");
  ok("completed epic shows a 100% done-colored fill", /class="fill g-done"\s+style="width:100%/.test(withDone), "no 100% done fill after enabling Done");

  // in_review maps to the review (warning) group — visible once we expand the
  // in-flight tail (the in_review sprint is not actively-executing, so it lives in
  // the "+N more" tail by the density spine).
  const { rootHtml: expanded } = await renderWith(fullBoard(), {
    interact: async (win) => { win.expandMore(); },
  });
  ok("in_review status maps to the review (warning) group", /class="pill g-review"/.test(expanded), "no review pill after expanding tail");

  console.log(`\nfrontend-areas: ${pass}/${pass + fail} pass`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
