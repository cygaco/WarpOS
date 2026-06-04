#!/usr/bin/env node

/**
 * ledger-presence-guard.js — PostToolUse Bash guard.
 *
 * Source: SP-20260519-001 R-5 + T-20260519-136.
 *
 * Fires after a watched Bash command (sprint plan/release/retrospective,
 * warp release driver) exits 0. Verifies that the corresponding ROADMAP.md
 * or RELEASES.md row was actually written within the last lookback window
 * by scanning paths.eventsFile for `ledger.write` events. On miss, emits a
 * stderr warn per policy `enforcement.mode`:
 *   - `warn` (default during soft rollout): stderr warn, exit 0.
 *   - `block`: stderr warn + decision-block JSON. (warn mode is the
 *     default through 2026-06-02; block requires explicit user approval.)
 *
 * SECONDARY CHECK (adversarial): if the target file is missing its anchor
 * marker entirely (operator opted out silently), emit a louder warn — the
 * row check passes by accident but the convention is being bypassed.
 *
 * Fail-open conditions (NEVER block):
 *   - Policy file missing on disk (delete-to-disable preserved).
 *   - Watched command did not match any `watched_commands` entry.
 *   - Bash command exit code non-zero (don't warn about a failed run).
 *   - lookback_window_ms exceeded — no recent events.jsonl rows to scan.
 *   - Any read or parse error — fail-open with stderr info.
 *
 * Performance budget: <50ms (sprint-tracker-guard precedent). Achieved by
 * tailing only the last N lines of events.jsonl, not the full file.
 */

"use strict";

const fs = require("fs");
const path = require("path");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    run(JSON.parse(input || "{}"));
  } catch {
    process.exit(0);
  }
});

function run(event) {
  // PostToolUse payload shape:
  //   { tool_name: "Bash", tool_input: { command: "..." }, tool_response: {...} }
  if (!event || event.tool_name !== "Bash") {
    process.exit(0);
  }
  const command = (event.tool_input && event.tool_input.command) || "";
  if (!command) process.exit(0);

  // Only run on successful Bash invocations.
  const exitCode =
    (event.tool_response && (event.tool_response.exit_code ?? event.tool_response.exitCode)) ?? 0;
  if (exitCode !== 0) process.exit(0);

  let paths;
  try {
    paths = require("./lib/paths");
  } catch {
    process.exit(0);
  }
  const PROJECT = paths.PROJECT;
  const PATHS = paths.PATHS;

  const policyFile = path.join(
    PROJECT,
    ".claude",
    "agents",
    "00-alex",
    ".system",
    "policy",
    "ledger-presence.json",
  );
  if (!fs.existsSync(policyFile)) process.exit(0); // delete-to-disable

  let policy;
  try {
    policy = JSON.parse(fs.readFileSync(policyFile, "utf8"));
  } catch {
    process.exit(0);
  }

  const match = (policy.watched_commands || []).find((w) =>
    command.includes(w.match),
  );
  if (!match) process.exit(0);

  // Determine target file + anchor for the match.
  let targetFile;
  let anchor;
  if (match.expected_section === "ROADMAP.md#sprints") {
    targetFile = path.join(PROJECT, "ROADMAP.md");
    anchor = policy.anchor_markers.roadmap_sprints;
  } else if (match.expected_section === "RELEASES.md#versions") {
    targetFile = path.join(PROJECT, "RELEASES.md");
    anchor = policy.anchor_markers.releases_versions;
  } else if (match.expected_section === "RELEASES.md#sprints") {
    targetFile = path.join(PROJECT, "RELEASES.md");
    anchor = policy.anchor_markers.releases_sprints;
  } else {
    process.exit(0); // unknown section in policy — fail-open
  }

  // Secondary check: anchor present?
  let anchorMissing = false;
  if (fs.existsSync(targetFile)) {
    try {
      const text = fs.readFileSync(targetFile, "utf8");
      if (!text.includes(anchor)) anchorMissing = true;
    } catch {
      // fall through — treat as anchorMissing=false (fail-open)
    }
  } else {
    anchorMissing = true; // file doesn't exist — clear silent opt-out
  }

  // Primary check: ledger.write event within lookback window?
  const eventsFile = PATHS.eventsFile;
  const lookback = policy.lookback_window_ms || 60000;
  const sinceTs = Date.now() - lookback;
  const recentLedgerWrite = scanForLedgerWrite(eventsFile, sinceTs);

  const mode = (policy.enforcement && policy.enforcement.mode) || "warn";
  const softRolloutUntil =
    policy.enforcement && policy.enforcement.soft_rollout_until;
  const softRolloutActive = softRolloutUntil
    ? Date.now() < Date.parse(softRolloutUntil)
    : false;
  // Effective mode: even if policy says "block", honor soft-rollout window.
  const effectiveMode = softRolloutActive ? "warn" : mode;

  // Build warn message.
  const reasons = [];
  if (!recentLedgerWrite) {
    reasons.push(
      `${path.basename(targetFile)} missing row for ${match.match} (no ledger.write event in last ${Math.round(lookback / 1000)}s)`,
    );
  }
  if (anchorMissing) {
    reasons.push(
      `${path.basename(targetFile)} missing anchor "${anchor}" — operator opted out silently (adversarial threat)`,
    );
  }

  if (reasons.length === 0) {
    process.exit(0); // healthy — no warn
  }

  const severity =
    anchorMissing && policy.anchor_missing_severity === "loud_warn"
      ? "LOUD WARN"
      : "warn";
  const softNote = softRolloutActive
    ? ` Soft-rollout until ${softRolloutUntil} — warn only.`
    : "";

  process.stderr.write(
    `[ledger-presence-guard] ${severity}: ${reasons.join("; ")}.${softNote}\n`,
  );

  if (effectiveMode === "block") {
    // PostToolUse runs AFTER the tool — block here just exits non-zero
    // (advisory) since the work already happened. Block-mode is for
    // operator visibility, not enforcement at this hook stage.
    process.exit(1);
  }
  process.exit(0);
}

function scanForLedgerWrite(eventsFile, sinceTs) {
  if (!fs.existsSync(eventsFile)) return false;
  // Read tail (last 64KB) — sufficient for a 60s lookback under normal load.
  try {
    const stat = fs.statSync(eventsFile);
    const size = stat.size;
    const head = Math.max(0, size - 65536);
    const fd = fs.openSync(eventsFile, "r");
    const buf = Buffer.allocUnsafe(size - head);
    fs.readSync(fd, buf, 0, buf.length, head);
    fs.closeSync(fd);
    const lines = buf.toString("utf8").split(/\r?\n/);
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line) continue;
      let row;
      try {
        row = JSON.parse(line);
      } catch {
        continue;
      }
      const ts = row.ts ? Date.parse(row.ts) : 0;
      if (ts < sinceTs) {
        // Older than lookback window — no need to keep scanning.
        return false;
      }
      // Match either logger.log("audit", {type:"ledger.write",...}) shape
      // or any cat="audit" with data.type="ledger.write".
      if (
        row.data &&
        (row.data.type === "ledger.write" ||
          row.data.event === "ledger.write")
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
