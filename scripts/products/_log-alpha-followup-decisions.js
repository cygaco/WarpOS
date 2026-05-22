#!/usr/bin/env node
// Append the 2 Alpha-decided follow-up directives for SP-20260521-001:
//  (1) namespace unification with deprecated aliases
//  (2) cross-platform --spawn launcher (Windows Terminal first, fallbacks)
// to paths.decisionLedger so /sprint:design picks them up.

"use strict";
const fs = require("fs");
const path = require("path");

const ledger = ".claude/project/decisions/decision-ledger.jsonl";
const sprintId = "SP-20260521-001";
const pcId = "PC-20260521-0021";
const ts = new Date().toISOString();

const entries = [
  {
    ts,
    id: "DEC-sp-20260521-001-005",
    sprint_id: sprintId,
    artifact: pcId,
    actor: "alpha",
    class: "B",
    decision:
      "Collapse /product:* + /products:* into a single /portfolio:* namespace. Rename existing /product:{bootstrap,clone,ponder,import} → /portfolio:*. Ship thin deprecation aliases at the old paths for 1-2 releases printing a one-time per-session 'use /portfolio:<name> instead' banner.",
    rationale:
      "User raised the /product vs /products UX trap explicitly ('this is kinda awkward flow. can this all be condensed under *portfolio'). Single namespace eliminates collision permanently. Deprecated-alias path keeps backward compat for 1-2 releases at trivial cost. Class B per autonomy table; Beta to bless at /sprint:design.",
    needs_beta_blessing: true,
    open_adr: true,
    supersedes: "PC-20260521-0020 affected_surfaces + skill names (was /products:* draft)",
  },
  {
    ts,
    id: "DEC-sp-20260521-001-006",
    sprint_id: sprintId,
    artifact: pcId,
    actor: "alpha",
    class: "B",
    decision:
      "/portfolio:open <slug> --spawn opens a new terminal window with Claude Code running in the target product. Windows Terminal (wt -d <path> claude) is the default; fall back to `start cmd /k 'cd /d <path> && claude'` on Windows, iTerm/Terminal.app on macOS, gnome-terminal/xterm on Linux. Hard non-goal: NEVER retarget CLAUDE_PROJECT_DIR mid-session inside an existing Claude Code instance — hooks, mode markers, paths.json bind at startup.",
    rationale:
      "User directive: 'can I like ''port'' myself into a product/repository in a terminal, different one in another, etc? And run them in parallel?' Parallel sessions are inherently state-safe per FRAMEWORK_VS_DOWNSTREAM.md (each product's .claude/ is per-repo). One Claude session = one repo for life; --spawn opens a fresh session in a new window for parallel work.",
    needs_beta_blessing: true,
    open_adr: false,
    related: "DEC-sp-20260521-001-005 (same sprint, complementary)",
  },
];

fs.mkdirSync(path.dirname(ledger), { recursive: true });
for (const e of entries) {
  fs.appendFileSync(ledger, JSON.stringify(e) + "\n", "utf8");
}

console.log(
  `Logged ${entries.length} alpha-followup decisions for ${sprintId} (artifact ${pcId}).`,
);
