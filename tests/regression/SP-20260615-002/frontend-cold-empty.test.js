#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// frontend-cold-empty.test.js — SP-20260615-002 S-7 / AC-R7a
//
// ::empty-data-renders-labeled-empty-states-shell-intact
//   COLD path: a board where active-sprints is present-but-empty, epics empty, and
//   sprintBreakdown empty → each of the four areas shows an explicit, legible
//   "nothing here yet" empty state (NOT a blank region, NOT a spinner-forever, NOT
//   a thrown error), and the page shell/header still renders. EMPTY ≠ UNAVAILABLE:
//   these are calm --text-muted empty states, NOT the info-banner.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const { renderWith } = require("./_dom-harness");

let pass = 0, fail = 0;
function ok(name, cond, msg) {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}\n      ${msg || ""}`); }
}

function coldBoard() {
  return {
    generatedAt: "2026-06-15T00:00:00.000Z",
    nextAction: null,
    nextActionAvailable: false, // no next action set (calm hero, not an error)
    ranked: [],
    rankedAvailable: true,
    hasPickupQueue: false,
    inFlight: [],            // present-but-empty (valid cold state, NOT unavailable)
    inFlightAvailable: true,
    activelyExecuting: [],
    stalePlanningCount: 0,
    primary: null,
    epics: [],               // empty (valid)
    sprintBreakdown: {},      // empty (valid)
    sectionsUnavailable: [],  // nothing degraded — purely cold/empty
  };
}

async function main() {
  const { rootHtml, fullHtml } = await renderWith(coldBoard());

  // shell/header intact (rendered by the static document, not #root)
  ok("page shell renders the Roadmap header", /<h1>Roadmap<\/h1>/.test(fullHtml), "header missing");
  ok("local-only line present in shell", fullHtml.includes("Local-only"), "shell trust line missing");

  // hero shows a calm "no next action" state, not a crash, not a blank
  ok("hero renders a calm 'No next action set' state", /No next action set/.test(rootHtml), "no calm hero empty state");
  ok("hero is NOT an error banner", !/data-area="next-action"[\s\S]*banner error/.test(rootHtml), "hero rendered an error");

  // each area present AND shows a labeled empty state (calm, not a banner)
  ok("active-sprints shows 'None in flight' empty state", /data-area="active-sprints"[\s\S]*?None in flight/.test(rootHtml), "no active empty state");
  ok("roadmap shows a labeled empty state", /data-area="roadmap"[\s\S]*?No ranked roadmap items/.test(rootHtml), "no roadmap empty state");
  ok("epics shows 'No epics yet' empty state", /data-area="epics"[\s\S]*?No epics yet/.test(rootHtml), "no epics empty state");
  ok("sprint-breakdown shows a labeled empty state", /data-area="sprint-breakdown"[\s\S]*?No sprint ticket breakdowns/.test(rootHtml), "no breakdown empty state");

  // empty states use the calm .empty-state class, NOT the info banner (EMPTY ≠ UNAVAILABLE)
  ok("empty states use .empty-state (calm), not .banner.info", rootHtml.includes("empty-state") && !/banner info/.test(rootHtml), "an empty area used the unavailable banner");

  // no spinner-forever / no thrown-error text
  ok("no perpetual 'Loading…' left in #root", !/Loading…/.test(rootHtml), "stuck on Loading…");
  ok("no 'Failed to load' error in #root", !/Failed to load/.test(rootHtml), "render threw");

  console.log(`\nfrontend-cold-empty: ${pass}/${pass + fail} pass`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
