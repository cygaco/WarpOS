#!/usr/bin/env node
// check:sprint-beta-honesty — audit Beta consultation honesty across /sprint:full runs.
//
// Detects three finding types:
//   missing_consult       — a phase boundary was reached but no consult event recorded
//   placeholder_verdict   — consult event exists but is fake (legacy kind or empty fields)
//   escalate_without_halt — ESCALATE verdict with no corresponding beta_escalate halt
//
// Date-cutoff: sprints before SP003_SHIP_DATE are LEGACY and exempt.
// Graceful empty: no applicable sprints → exit 0 with informational message.
//
// See .claude/commands/check/sprint-beta-honesty.md for full spec.

"use strict";

const fs = require("fs");
const path = require("path");
const { PATHS } = require("../hooks/lib/paths");

// ── Constants ─────────────────────────────────────────────────────────────────

/** ISO date of SP-003 ship — sprints before this are LEGACY and exempt. */
const SP003_SHIP_DATE = "2026-05-25";

/**
 * The 4 phase boundaries where Beta MUST be consulted (per /sprint:full Step 5).
 * before_plan is NOT in this list — Beta gates apply to phases 2-5 only.
 */
const EXPECTED_BOUNDARIES = Object.freeze([
  "before_design",
  "before_execute",
  "before_release-prep",
  "before_retro",
]);

/**
 * Maps a phase name (from sprint_full_phase_started) to its consult boundary.
 * Only phases that have an expected boundary are included.
 */
const PHASE_TO_BOUNDARY = Object.freeze({
  design: "before_design",
  execute: "before_execute",
  "release-prep": "before_release-prep",
  retro: "before_retro",
});

// ── CLI flags ─────────────────────────────────────────────────────────────────

const JSON_OUT = process.argv.includes("--json");
const sinceIdx = process.argv.indexOf("--since");
const CUTOFF =
  sinceIdx !== -1 && process.argv[sinceIdx + 1]
    ? process.argv[sinceIdx + 1]
    : SP003_SHIP_DATE;

// ── Field extraction — robust to top-level and data-nested placement ──────────
//
// The logger writes: log("audit", { kind, ...data }, ...) → event.data = { kind, ...data }
// So sprint_full_* fields live under rec.data in the canonical format.
// Be robust to both data-nested AND top-level placement (e.g. future schema changes).

const EVENT_FIELDS = [
  "kind",
  "verdict",
  "beta_message",
  "latency_ms",
  "model",
  "phase_boundary",
  "sprint_id",
  "ts",
  "halt_reason",
  "phase",
];

function getEventFields(rec) {
  if (!rec || typeof rec !== "object") return {};
  const d = rec.data && typeof rec.data === "object" ? rec.data : {};
  // Start from data-nested fields, then let top-level override (top-level wins)
  const merged = { ...d };
  for (const k of EVENT_FIELDS) {
    if (rec[k] !== undefined) merged[k] = rec[k];
  }
  return merged;
}

// ── Simple YAML date extractor (only needs created_at / start_date / start) ──

function extractYamlDate(text) {
  if (!text) return null;
  const m = text.match(/(?:created_at|start_date|start)\s*:\s*["']?([0-9]{4}-[0-9]{2}-[0-9]{2})/);
  return m ? m[1] : null;
}

// ── Load sprint start dates from filesystem ───────────────────────────────────

function loadSprintDates() {
  const dates = {};

  // 1. Per-sprint current.yaml under paths.sprintSprints/<SP-id>/current.yaml
  const sprintsDir = PATHS.sprintSprints;
  if (sprintsDir && fs.existsSync(sprintsDir)) {
    let entries = [];
    try {
      entries = fs.readdirSync(sprintsDir);
    } catch { /* ignore */ }
    for (const entry of entries) {
      try {
        const currentYaml = path.join(sprintsDir, entry, "current.yaml");
        if (fs.existsSync(currentYaml)) {
          const text = fs.readFileSync(currentYaml, "utf8");
          const date = extractYamlDate(text);
          if (date) dates[entry] = date;
        }
      } catch { /* skip unreadable entries */ }
    }
  }

  // 2. active-sprints.yaml as supplemental source
  const activeReg = PATHS.sprintActiveRegistry;
  if (activeReg && fs.existsSync(activeReg)) {
    try {
      const text = fs.readFileSync(activeReg, "utf8");
      // Split on YAML list entries (lines starting with "- " or "  id:")
      const chunks = text.split(/^(?=\s*-\s)/m).filter(Boolean);
      for (const chunk of chunks) {
        const idM = chunk.match(/\bid\s*:\s*["']?(\S+?)["']?\s*$/m);
        const dateM = chunk.match(
          /(?:created_at|start_date|start)\s*:\s*["']?([0-9]{4}-[0-9]{2}-[0-9]{2})/,
        );
        if (idM && dateM) {
          const id = idM[1].replace(/['"]/g, "");
          if (!dates[id]) dates[id] = dateM[1];
        }
      }
    } catch { /* ignore unreadable registry */ }
  }

  return dates;
}

// ── Core compute function (exported for test harness) ─────────────────────────

/**
 * Compute findings from an array of event records.
 *
 * @param {object[]} events     Parsed event records (as read from events.jsonl)
 * @param {Object}   sprintDates  Map of sprint_id → "YYYY-MM-DD" start date
 * @param {string}   cutoff     ISO date string — sprints before this are exempt
 * @returns {{ findings, applicable, checked, undatedExempt, malformedLines }}
 */
function computeFindings(events, sprintDates = {}, cutoff = SP003_SHIP_DATE) {
  const findings = [];
  let malformedLines = 0;

  // Bucket events by sprint_id
  // Shape: { [sprintId]: { consults, legacyConsults, halts, phaseStarted } }
  const sprintData = {};

  for (const rec of events) {
    if (!rec || typeof rec !== "object") {
      malformedLines++;
      continue;
    }
    const f = getEventFields(rec);
    const kind = f.kind;
    if (!kind || !kind.startsWith("sprint_full")) continue;

    const sprintId = f.sprint_id;
    if (!sprintId) continue; // can't attribute without a sprint_id

    if (!sprintData[sprintId]) {
      sprintData[sprintId] = {
        consults: [],      // sprint_full_beta_consult (real, post-SP-003)
        legacyConsults: [], // sprint_full_beta_consultation (pre-SP-003 placeholder kind)
        halts: [],         // sprint_full_halt
        phaseStarted: new Set(), // phase names that were started
      };
    }
    const sd = sprintData[sprintId];

    if (kind === "sprint_full_beta_consult") {
      sd.consults.push(f);
    } else if (kind === "sprint_full_beta_consultation") {
      // Legacy / placeholder kind emitted before SP-003
      sd.legacyConsults.push(f);
    } else if (kind === "sprint_full_halt") {
      sd.halts.push(f);
    } else if (kind === "sprint_full_phase_started") {
      if (f.phase) sd.phaseStarted.add(f.phase);
    }
  }

  const applicableSprintIds = [];
  let undatedExempt = 0;
  let checked = 0;

  for (const [sprintId, sd] of Object.entries(sprintData)) {
    // Determine sprint start date for cutoff comparison
    const sprintDate = sprintDates[sprintId];
    if (!sprintDate) {
      // Cannot determine date — exempt (fail-safe: don't false-flag unknown sprints)
      undatedExempt++;
      continue;
    }
    // Lexicographic ISO date comparison (YYYY-MM-DD format sorts correctly)
    if (sprintDate < cutoff) {
      // Legacy sprint — exempt entirely
      continue;
    }

    applicableSprintIds.push(sprintId);
    checked++;

    // ── Finding type 1: placeholder_verdict ───────────────────────────────
    //
    // (a) Legacy kind — sprint_full_beta_consultation instead of sprint_full_beta_consult
    for (const ev of sd.legacyConsults) {
      findings.push({
        sprint_id: sprintId,
        phase: ev.phase_boundary ? ev.phase_boundary.replace("before_", "") : null,
        expected_consult: ev.phase_boundary || null,
        actual_event: "sprint_full_beta_consultation",
        verdict: ev.verdict || null,
        evidence: "legacy sprint_full_beta_consultation kind (pre-SP-003 placeholder)",
        finding_type: "placeholder_verdict",
      });
    }

    // (b) Real kind but missing/empty required fields
    for (const ev of sd.consults) {
      const missing = [];
      if (!ev.beta_message && ev.beta_message !== 0)
        missing.push("beta_message");
      // latency_ms = 0 is valid (CLI resume has no live round-trip); only flag undefined/null
      if (ev.latency_ms === undefined || ev.latency_ms === null)
        missing.push("latency_ms");
      if (!ev.model && ev.model !== 0)
        missing.push("model");

      if (missing.length > 0) {
        findings.push({
          sprint_id: sprintId,
          phase: ev.phase_boundary ? ev.phase_boundary.replace("before_", "") : null,
          expected_consult: ev.phase_boundary || null,
          actual_event: "sprint_full_beta_consult",
          verdict: ev.verdict || null,
          evidence: `missing or empty field(s): ${missing.join(", ")}`,
          finding_type: "placeholder_verdict",
        });
      }
    }

    // ── Finding type 2: missing_consult ───────────────────────────────────
    //
    // Evidence: sprint_full_phase_started(phase=X) where PHASE_TO_BOUNDARY[X] is defined.
    // If phase X started, boundary before_X was cleared — a consult MUST have been recorded.
    //
    // consultedBoundaries includes both real AND legacy consults to avoid double-flagging:
    // if a legacy consult covers a boundary, that's a placeholder_verdict (not missing_consult).
    const consultedBoundaries = new Set(
      [
        ...sd.consults.map((c) => c.phase_boundary),
        ...sd.legacyConsults.map((c) => c.phase_boundary),
      ].filter(Boolean),
    );

    for (const phase of sd.phaseStarted) {
      const boundary = PHASE_TO_BOUNDARY[phase];
      if (!boundary) continue; // phase has no expected consult boundary (e.g. "plan")
      if (!EXPECTED_BOUNDARIES.includes(boundary)) continue;
      if (!consultedBoundaries.has(boundary)) {
        findings.push({
          sprint_id: sprintId,
          phase,
          expected_consult: boundary,
          actual_event: null,
          verdict: null,
          evidence: `phase '${phase}' started but no sprint_full_beta_consult recorded for boundary '${boundary}'`,
          finding_type: "missing_consult",
        });
      }
    }

    // ── Finding type 3: escalate_without_halt ─────────────────────────────
    //
    // A sprint_full_beta_consult with verdict ESCALATE must be followed by a
    // sprint_full_halt with halt_reason: beta_escalate for the same sprint.
    for (const ev of sd.consults) {
      if (ev.verdict !== "ESCALATE") continue;
      const evTs = typeof ev.ts === "string" ? ev.ts : "";
      const hasMatchingHalt = sd.halts.some(
        (h) =>
          h.halt_reason === "beta_escalate" &&
          // Halt must be at/after the consult timestamp (or either ts is unknown)
          (!evTs || !h.ts || h.ts >= evTs),
      );
      if (!hasMatchingHalt) {
        findings.push({
          sprint_id: sprintId,
          phase: ev.phase_boundary ? ev.phase_boundary.replace("before_", "") : null,
          expected_consult: ev.phase_boundary || null,
          actual_event: "sprint_full_beta_consult",
          verdict: "ESCALATE",
          evidence: "no sprint_full_halt(halt_reason: beta_escalate) found for this sprint at/after consult timestamp",
          finding_type: "escalate_without_halt",
        });
      }
    }
  }

  return {
    findings,
    applicable: applicableSprintIds.length,
    checked,
    undatedExempt,
    malformedLines,
  };
}

// ── CLI entry point ───────────────────────────────────────────────────────────

if (require.main === module) {
  // 1. Read and parse events.jsonl (missing file → graceful empty)
  let rawEvents = [];
  let malformedCount = 0;
  try {
    const raw = fs.readFileSync(PATHS.eventsFile, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        rawEvents.push(JSON.parse(line));
      } catch {
        malformedCount++;
      }
    }
  } catch {
    // Missing or unreadable events file → treat as empty (graceful)
  }

  // 2. Load sprint start dates
  const sprintDates = loadSprintDates();

  // 3. Compute findings
  const result = computeFindings(rawEvents, sprintDates, CUTOFF);
  result.malformedLines = (result.malformedLines || 0) + malformedCount;

  // 4. Graceful empty — no applicable post-cutoff sprints with activity
  if (result.applicable === 0) {
    if (JSON_OUT) {
      console.log(
        JSON.stringify({
          ok: true,
          applicable: 0,
          reason: "no_applicable_sprints",
          cutoff: CUTOFF,
          undatedExempt: result.undatedExempt,
        }),
      );
    } else {
      console.log(
        `OK   [sprint-beta-honesty] no applicable sprints in window (cutoff ${CUTOFF}) — nothing to audit`,
      );
    }
    process.exit(0);
  }

  // 5. Emit results
  const ok = result.findings.length === 0;
  if (JSON_OUT) {
    console.log(
      JSON.stringify({
        ok,
        applicable: result.applicable,
        checked: result.checked,
        findings: result.findings.slice(0, 30),
        totalFindings: result.findings.length,
        cutoff: CUTOFF,
        undatedExempt: result.undatedExempt,
        malformedLines: result.malformedLines,
      }),
    );
  } else {
    if (ok) {
      console.log(
        `OK   [sprint-beta-honesty] ${result.checked} sprint(s) checked, 0 findings`,
      );
    } else {
      console.error(
        `FAIL [sprint-beta-honesty] ${result.findings.length} finding(s) (${result.checked} sprint(s) checked, cutoff ${CUTOFF}):`,
      );
      for (const f of result.findings.slice(0, 10)) {
        console.error(
          `  - [${f.finding_type}] sprint=${f.sprint_id} boundary=${f.expected_consult || f.phase} evidence=${f.evidence}`,
        );
      }
      if (result.findings.length > 10) {
        console.error(`  ... and ${result.findings.length - 10} more`);
      }
    }
  }
  process.exit(ok ? 0 : 1);
}

// ── Exports (for test harness) ────────────────────────────────────────────────

module.exports = {
  computeFindings,
  CUTOFF,
  SP003_SHIP_DATE,
  EXPECTED_BOUNDARIES,
  PHASE_TO_BOUNDARY,
};
