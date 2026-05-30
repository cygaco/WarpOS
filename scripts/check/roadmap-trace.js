#!/usr/bin/env node
// WG-16: assert every done/retrospected/released sprint has BOTH a Sprints-table
// ledger row AND a Shipped narrative entry in ROADMAP.md. Closes the
// enforcement-debt /sprint:full Step 8b leaves: the ledger row is enforced by
// scripts/sprint/ledger.js, but the Shipped narrative is skill-body discipline
// with no automated check — until this one. Fail-open on a missing ROADMAP
// (warn, never block), mirroring the ledger writer's posture.
"use strict";

const fs = require("fs");
const path = require("path");
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const { readYamlMaybe } = require("../sprint/fs");

const asJson = process.argv.includes("--json");
const regPath = path.join(
  REPO_ROOT,
  ".claude",
  "project",
  "sprint",
  "active-sprints.yaml",
);
const roadmapPath = path.join(REPO_ROOT, "ROADMAP.md");

// Statuses whose sprints MUST be reflected in the Shipped record.
const TRACKED = new Set(["done", "retrospected", "released"]);

function emitPass(note) {
  if (asJson)
    process.stdout.write(JSON.stringify({ ok: true, checks: [], note }) + "\n");
  else process.stdout.write(`# 0/0 traced (${note})\n`);
  process.exit(0);
}

const reg = readYamlMaybe(regPath);
if (!reg || !Array.isArray(reg.sprints)) emitPass("no sprint registry");

if (!fs.existsSync(roadmapPath)) {
  // Fail-open like the ledger: warn, don't block.
  const note = "ROADMAP.md absent — roadmap trace skipped (warn, not fail)";
  if (asJson)
    process.stdout.write(
      JSON.stringify({ ok: true, warned: true, reason: note }) + "\n",
    );
  else process.stdout.write(`WARN  ${note}\n# 0/0 traced\n`);
  process.exit(0);
}

const roadmap = fs.readFileSync(roadmapPath, "utf8");

// Extract the "Shipped" narrative region: from a heading containing "Shipped"
// to the next same-or-higher-level heading. Narrative presence is checked
// inside this region so it's distinct from a bare ledger-table row.
function shippedRegion(md) {
  // Collect EVERY region under a heading containing "shipped" — not just the
  // first. (2026-05-30 fix: the old single-region version anchored on the first
  // ".*shipped" heading, which is the 0.15.0 milestone's inline "SHIPPED <date>"
  // at level ####, so it stopped before the canonical "## ✅ Shipped in SP-…"
  // narrative sections lower in the doc → false "shipped_narrative=false" for
  // sprints whose narratives DO exist there.) Heading lines are included so a
  // section heading that names sprint IDs (e.g. "Shipped in SP-X/Y") counts.
  const lines = md.split(/\r?\n/);
  const regions = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,6})\s+.*shipped/i.exec(lines[i]);
    if (!m) continue;
    const level = m[1].length;
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      const mm = /^(#{1,6})\s+/.exec(lines[j]);
      if (mm && mm[1].length <= level) {
        end = j;
        break;
      }
    }
    regions.push(lines.slice(i, end).join("\n"));
  }
  return regions.join("\n");
}

const shipped = shippedRegion(roadmap);
const targets = reg.sprints.filter((s) => TRACKED.has(s.status));
const checks = targets.map((s) => {
  const hasLedgerRow = roadmap.includes(s.id);
  const hasNarrative =
    shipped.includes(s.id) || (s.title && shipped.includes(s.title));
  return {
    id: s.id,
    status: s.status,
    ok: hasLedgerRow && hasNarrative,
    hasLedgerRow,
    hasNarrative,
  };
});

const failed = checks.filter((c) => !c.ok);
if (asJson) {
  process.stdout.write(
    JSON.stringify({ ok: failed.length === 0, checks }, null, 2) + "\n",
  );
} else {
  for (const c of checks) {
    const detail = c.ok
      ? ""
      : `  (ledger_row=${c.hasLedgerRow} shipped_narrative=${c.hasNarrative})`;
    process.stdout.write(`${c.ok ? "OK  " : "FAIL"}  ${c.id} (${c.status})${detail}\n`);
  }
  process.stdout.write(
    `# ${checks.length - failed.length}/${checks.length} sprints traced\n`,
  );
}
process.exit(failed.length ? 1 : 0);
