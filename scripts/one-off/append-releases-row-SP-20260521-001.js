#!/usr/bin/env node
"use strict";

/**
 * T-20260521-179 / AC-12.4 — append a SP-20260521-001 row to RELEASES.md
 * via the canonical scripts/sprint/ledger.js#appendReleaseRow API.
 *
 * Marks the sprint as `prepared` (planning-side complete, ship-gate pending
 * AP-20260521-025 grep-sweep). When /sprint:release ultimately deploys this
 * sprint, ledger.js#updateReleaseRow will flip status to `deployed` and
 * set deployedAt. The row's `key` field is the RL- id; the row references
 * SP-20260521-001 in the Sprint column, satisfying AC-12.4.
 *
 * RL- id minted: RL-20260521-016 (next after RL-20260521-015 deployed).
 */

const path = require("path");
const ledger = require(path.resolve(__dirname, "..", "sprint", "ledger.js"));

const args = {
  id: "RL-20260521-016",
  sprint: "SP-20260521-001",
  status: "prepared",
  target: "internal",
  notes:
    "/portfolio:* portfolio console — collapse /product:* into /portfolio:* with 12 verbs (bootstrap, clone, ponder, import, list, status, open, new, adopt, register, dispatch, sync) + paths.portfolioRegistry + multi-terminal --spawn launcher + parallel /portfolio:status dashboard + sequential /portfolio:sync + DEC-008 auto private gh repo create",
};
const r = ledger.appendReleaseRow(args);
console.log(JSON.stringify(r, null, 2));
process.exit(r.written ? 0 : r.reason === "already-present" ? 0 : 1);
