#!/usr/bin/env node
// Append Beta's blessing of DEC-005 + DEC-006 to paths.betaEvents,
// and capture the two new spec directives Beta added on top.

"use strict";
const fs = require("fs");
const path = require("path");

const betaEvents = ".claude/agents/00-alex/.system/beta/events.jsonl";
const ledger = ".claude/project/decisions/decision-ledger.jsonl";
const sprintId = "SP-20260521-001";
const pcId = "PC-20260521-0021";
const session = "sp-20260521-001";
const ts = new Date().toISOString();

const betaEntries = [
  {
    id: "EVT-s-sp-20260521-001-beta-005",
    ts,
    cat: "beta",
    actor: "beta",
    session,
    data: {
      question:
        "Bless DEC-005 — collapse /product:* + /products:* into /portfolio:* with 1-2 release deprecation aliases?",
      category: "architecture",
      answer:
        "DECIDE (Class B, conf 0.86). Approved. Rename /product:{bootstrap,clone,ponder,import} → /portfolio:*. Deprecation window is 2 releases (not 1) — gives downstream installs one update cycle. Before ticket minting, grep-sweep `/product:` literal across all .md/.json/.js per CLAUDE.md §Refactor & Rename Hygiene. Wire ref-checker on old skill files at delete time.",
      escalated: false,
      confidence: 0.86,
      overridden: null,
      user_answer: null,
      topic_tags: [
        "namespace-unification",
        "portfolio",
        "deprecation",
        "rename-hygiene",
        "open-adr",
        "class-b",
      ],
      sprint_id: sprintId,
      artifact: pcId,
      OPEN_ADR: true,
    },
  },
  {
    id: "EVT-s-sp-20260521-001-beta-006",
    ts,
    cat: "beta",
    actor: "beta",
    session,
    data: {
      question:
        "Bless DEC-006 — /portfolio:open <slug> --spawn cross-platform terminal launcher with hard non-goal of mid-session CLAUDE_PROJECT_DIR retarget?",
      category: "architecture",
      answer:
        "DECIDE (Class B, conf 0.88). Approved as scoped. Hard non-goal is correct — print warning if user tries to open a product that is already the active CWD. Platform dispatch table fine. ADDITION: if target terminal binary (wt, cmd, iTerm, gnome-terminal, xterm) is not on PATH, fall back to printing `cd <path> && claude` as a copyable command — graceful degradation mandatory, silent failure not acceptable.",
      escalated: false,
      confidence: 0.88,
      overridden: null,
      user_answer: null,
      topic_tags: [
        "portfolio",
        "spawn",
        "multi-terminal",
        "graceful-degradation",
        "non-goal-enforced",
        "class-b",
      ],
      sprint_id: sprintId,
      artifact: pcId,
      OPEN_ADR: false,
    },
  },
];

const ledgerEntries = [
  {
    ts,
    id: "DEC-sp-20260521-001-005-addendum",
    sprint_id: sprintId,
    artifact: pcId,
    actor: "beta",
    class: "B",
    decision:
      "Pre-rename grep-sweep + ref-checker requirements for DEC-005. Before any /product:* → /portfolio:* rename ticket commits, grep `/product:` literal across all .md/.json/.js in the repo per CLAUDE.md §Refactor & Rename Hygiene. Wire ref-checker hook on old skill files at delete time. Deprecation window confirmed at 2 releases (not 1).",
    rationale:
      "Refactor hygiene rule from CLAUDE.md is mandatory for any cross-file rename. Skipping the sweep is the bug class that produced LRN-2026-04-29 (anthropic→claude check miss) and the 2026-04-22 cross-codebase-ref cleanup. Beta blessing adds this as an explicit precondition.",
    blesses: "DEC-sp-20260521-001-005",
  },
  {
    ts,
    id: "DEC-sp-20260521-001-006-addendum",
    sprint_id: sprintId,
    artifact: pcId,
    actor: "beta",
    class: "B",
    decision:
      "PATH-fallback + active-CWD-warning for DEC-006. /portfolio:open <slug> --spawn (a) prints a warning if <slug>'s repo_path == process.cwd, since opening a duplicate session in the same dir is the failure mode that confuses users about parallelism; (b) on any spawn target binary missing from PATH, falls back to printing `cd <path> && claude` as a copyable command rather than erroring. Graceful degradation mandatory.",
    rationale:
      "Silent failure on missing terminal binaries was the only gap in the spawn spec. Active-CWD-warning prevents the misuse that would void the parallelism promise.",
    blesses: "DEC-sp-20260521-001-006",
  },
];

fs.mkdirSync(path.dirname(betaEvents), { recursive: true });
for (const e of betaEntries) {
  fs.appendFileSync(betaEvents, JSON.stringify(e) + "\n", "utf8");
}

fs.mkdirSync(path.dirname(ledger), { recursive: true });
for (const e of ledgerEntries) {
  fs.appendFileSync(ledger, JSON.stringify(e) + "\n", "utf8");
}

console.log(
  `Logged ${betaEntries.length} beta blessings + ${ledgerEntries.length} ledger addenda for ${sprintId}.`,
);
