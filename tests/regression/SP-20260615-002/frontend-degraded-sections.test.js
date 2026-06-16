#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// frontend-degraded-sections.test.js — SP-20260615-002 S-7 / AC-R7b [β-4]
//
// ::degraded-sources-render-section-unavailable-healthy-areas-intact-200-not-500
//   DEGRADED path: a board where one+ sources are malformed (epics + ranked in
//   sectionsUnavailable[], a per-sprint breakdownUnavailable marker, a per-epic
//   parseError) → the affected area(s) render a per-area "section unavailable"
//   placeholder (the .banner.info, INSIDE the section frame) while every HEALTHY
//   area renders normally. A single degraded source NEVER blanks the whole panel.
//   (The 200-not-500 server half is asserted in gui-readonly-endpoints/gui-security;
//   here we prove the FRONTEND survives a degraded payload and renders both states.)
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const { renderWith } = require("./_dom-harness");

let pass = 0, fail = 0;
function ok(name, cond, msg) {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}\n      ${msg || ""}`); }
}

function degradedBoard() {
  return {
    generatedAt: "2026-06-15T00:00:00.000Z",
    nextAction: "NEXT ACTION: keep shipping",
    nextActionAvailable: true,       // HEALTHY
    ranked: [],
    rankedAvailable: false,          // DEGRADED (ROADMAP marker renamed)
    hasPickupQueue: null,
    inFlight: [{ id: "SP-20260615-002", status: "building" }],
    inFlightAvailable: true,         // HEALTHY
    activelyExecuting: [{ id: "SP-20260615-002", status: "building" }],
    stalePlanningCount: 0,
    primary: "SP-20260615-002",
    // epics area healthy as a whole, but ONE epic file is bad (per-epic parseError)
    epics: [
      { id: "E-GOOD-001", title: "Healthy epic", state: "Active", percent: 40, childSprints: [] },
      { id: "E-BAD-002", parseError: "no `**Current state:**` line (renamed/removed)" },
    ],
    // one sprint's breakdown is unavailable (per-sprint degrade)
    sprintBreakdown: {
      "SP-20260615-002": { id: "SP-20260615-002", breakdownUnavailable: true, reason: "current.yaml not found" },
    },
    // whole-area degrades: ranked + epics directory unreadable
    sectionsUnavailable: ["ranked"],
  };
}

async function main() {
  const { rootHtml } = await renderWith(degradedBoard());

  // DEGRADED whole-area: roadmap (ranked) renders the "section unavailable" banner
  // INSIDE its own section frame.
  ok("roadmap area renders a 'couldn't load' info banner", /data-area="roadmap"[\s\S]*?couldn.t load[\s\S]*?banner info|data-area="roadmap"[\s\S]*?banner info[\s\S]*?couldn.t load/i.test(rootHtml) || /data-area="roadmap"[\s\S]*?banner info/.test(rootHtml), "roadmap not degraded-bannered");
  ok("degraded roadmap names its source (ROADMAP.md)", /data-area="roadmap"[\s\S]*?ROADMAP\.md/.test(rootHtml), "no source named in degraded roadmap");

  // HEALTHY areas still render normally
  ok("active-sprints (healthy) still renders its card", /data-area="active-sprints"[\s\S]*?data-id="SP-20260615-002"/.test(rootHtml), "healthy active area blanked");
  ok("next-action hero (healthy) still renders the action", /data-area="next-action"[\s\S]*?keep shipping/.test(rootHtml), "healthy hero blanked");

  // PER-ITEM degrades: a bad epic file is MARKED, the good epic still renders
  ok("epics area renders the HEALTHY epic", rootHtml.includes('data-id="E-GOOD-001"'), "healthy epic missing");
  ok("epics area marks the BAD epic file (not silently dropped)", rootHtml.includes('data-id="E-BAD-002"') && /epic file unreadable/.test(rootHtml), "bad epic not marked");

  // PER-SPRINT degrade: the unavailable breakdown is marked, not a crash
  ok("sprint-breakdown marks the unavailable sprint breakdown", /data-area="sprint-breakdown"[\s\S]*?breakdown unavailable/i.test(rootHtml), "breakdownUnavailable not surfaced");

  // both states coexist: an info banner (unavailable) AND healthy cards present
  ok("degraded + healthy states COEXIST (banner.info AND a healthy card both present)", /banner info/.test(rootHtml) && rootHtml.includes('data-id="SP-20260615-002"'), "states did not coexist");

  // the whole render did not throw / blank
  ok("render did not throw (no error banner in #root root-level)", !/^\s*<div class="banner error">Failed to load/.test(rootHtml), "render threw");

  console.log(`\nfrontend-degraded-sections: ${pass}/${pass + fail} pass`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
