#!/usr/bin/env node
// scan:sprint-beta-honesty — audit Beta consultation honesty across /sprint:full runs.
//
// Detects three finding types:
//   missing_consult       — a phase boundary was reached but no consult event recorded
//   placeholder_verdict   — consult event exists but is fake (legacy kind or empty fields)
//   escalate_without_halt — ESCALATE verdict with no corresponding beta_escalate halt
//
// Date-cutoff: sprints before SP003_SHIP_DATE are LEGACY and exempt.
// Graceful empty: no applicable sprints → exit 0 with informational message.
//
// See .claude/commands/scan/sprint-beta-honesty.md for full spec.

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

// ── ISO date validator ─────────────────────────────────────────────────────────

/**
 * Returns true iff val is a real ISO date string (YYYY-MM-DD with valid calendar date).
 * Used to fail-closed on bogus --since values. Exported for tests.
 *
 * Round-trip check: V8 silently rolls over impossible calendar dates rather than
 * returning NaN (e.g. "2026-02-30" → Date for 2026-03-02). We parse the string as
 * a UTC Date, re-format it back to YYYY-MM-DD (UTC), and require equality with the
 * input. If they differ, the input contained an overflow/rollover date → invalid.
 */
function validateIsoDate(val) {
  if (typeof val !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const d = new Date(val + "T00:00:00Z");
  if (isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === val;
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

// ── Parse a single report file (halt-*.md or sprint-full-report.md) ───────────

/**
 * Parses report markdown content and mutates the data object:
 *   data.phasesReached        — Set of phase names from **Phase:** lines
 *   data.consultedBoundaries  — Set of boundary names from ## Beta consultations section
 *
 * Tolerates absent/malformed reports (just returns without adding anything).
 */
function parseReportContent(content, data) {
  if (!content || typeof content !== "string") return;

  // Extract **Phase:** <phase> lines (halt-report header format)
  for (const m of content.matchAll(/^\*\*Phase:\*\*\s+(\S+)/gm)) {
    const phase = m[1].trim();
    if (PHASE_TO_BOUNDARY[phase]) {
      data.phasesReached.add(phase);
    }
  }

  // Extract "## Beta consultations" section (final report only)
  // Lines look like: "- before_design: DECIDE (2026-05-22T...)"
  const betaIdx = content.indexOf("## Beta consultations");
  if (betaIdx !== -1) {
    const afterHeader = content.indexOf("\n", betaIdx) + 1;
    const nextSection = content.indexOf("\n##", afterHeader);
    const sectionContent = nextSection === -1
      ? content.slice(afterHeader)
      : content.slice(afterHeader, nextSection);

    for (const lm of sectionContent.matchAll(/^-\s+(before_[\w-]+)\s*:/gm)) {
      const boundary = lm[1].trim();
      if (EXPECTED_BOUNDARIES.includes(boundary)) {
        data.consultedBoundaries.add(boundary);
      }
    }
  }
}

// ── Load full-reports data from filesystem ────────────────────────────────────

/**
 * Reads PATHS.sprintFullReports (or overrideDir) and returns a map of:
 *   { [sprintId]: { phasesReached: Set<string>, consultedBoundaries: Set<string> } }
 *
 * All sprints are returned regardless of cutoff — computeFindings applies the cutoff filter.
 * Missing or unreadable dir → returns empty map (graceful, never throws).
 *
 * @param {string} [overrideDir]  Override the full-reports directory path.
 *   Also settable via WARPOS_FULLREPORTS_DIR env var in the CLI entry point.
 */
function loadFullReportsData(overrideDir) {
  // Use null-prototype object to avoid prototype-pollution on sprint IDs
  const result = Object.create(null);
  const reportsDir = overrideDir || PATHS.sprintFullReports;
  if (!reportsDir) return result;
  if (!fs.existsSync(reportsDir)) return result; // graceful-empty: missing dir is fine

  let entries = [];
  try {
    entries = fs.readdirSync(reportsDir);
  } catch {
    return result;
  }

  for (const entry of entries) {
    try {
      const sprintDir = path.join(reportsDir, entry);
      let stat;
      try { stat = fs.statSync(sprintDir); } catch { continue; }
      if (!stat.isDirectory()) continue;

      const sprintEntry = { phasesReached: new Set(), consultedBoundaries: new Set() };

      let files = [];
      try { files = fs.readdirSync(sprintDir); } catch { /* skip */ }

      for (const file of files) {
        if (!file.endsWith(".md")) continue;
        try {
          const content = fs.readFileSync(path.join(sprintDir, file), "utf8");
          parseReportContent(content, sprintEntry);
        } catch { /* skip unreadable files */ }
      }

      result[entry] = sprintEntry;
    } catch { /* skip bad entries */ }
  }

  return result;
}

// ── Table formatter for human FAIL output ─────────────────────────────────────

/**
 * Format an array of findings as a compact aligned table.
 * Columns: SPRINT | PHASE | VERDICT | FINDING_TYPE | EVIDENCE
 * Evidence is truncated to 50 chars. Returns a multi-line string.
 */
function formatFindingsTable(findings) {
  if (findings.length === 0) return "";

  const EVIDENCE_MAX = 50;
  let w0 = 6;   // SPRINT
  let w1 = 5;   // PHASE
  let w2 = 7;   // VERDICT
  let w3 = 12;  // FINDING_TYPE

  for (const f of findings) {
    w0 = Math.min(28, Math.max(w0, (f.sprint_id || "").length));
    w1 = Math.min(14, Math.max(w1, (f.phase || "-").length));
    w2 = Math.min(12, Math.max(w2, (f.verdict || "-").length));
    w3 = Math.min(22, Math.max(w3, (f.finding_type || "").length));
  }

  const pad = (s, w) => String(s == null ? "-" : s).slice(0, w).padEnd(w);
  const trunc = (s, w) => {
    const str = String(s == null ? "" : s);
    return str.length > w ? str.slice(0, w - 1) + "…" : str.padEnd(w);
  };

  const header = [
    pad("SPRINT", w0), pad("PHASE", w1), pad("VERDICT", w2),
    pad("FINDING_TYPE", w3), "EVIDENCE",
  ].join("  ");
  const separator = [
    "-".repeat(w0), "-".repeat(w1), "-".repeat(w2),
    "-".repeat(w3), "-".repeat(EVIDENCE_MAX),
  ].join("  ");

  const rows = findings.map((f) => [
    pad(f.sprint_id, w0),
    pad(f.phase, w1),
    pad(f.verdict, w2),
    pad(f.finding_type, w3),
    trunc(f.evidence, EVIDENCE_MAX),
  ].join("  "));

  return [header, separator, ...rows].join("\n");
}

// ── Core compute function (exported for test harness) ─────────────────────────

/**
 * Compute findings from an array of event records.
 *
 * @param {object[]} events      Parsed event records (as read from events.jsonl)
 * @param {Object}   sprintDates  Map of sprint_id → "YYYY-MM-DD" start date
 * @param {string}   cutoff      ISO date string — sprints before this are exempt
 * @param {Object|null} reportsData  Optional corroborating data from PATHS.sprintFullReports.
 *   Shape: { [sprintId]: { phasesReached: Set<string>, consultedBoundaries: Set<string> } }
 *   Produced by loadFullReportsData(). If null/undefined, full-reports corroboration is skipped
 *   (backward-compatible — existing callers that pass 2 or 3 args are unaffected).
 * @returns {{ findings, applicable, checked, undatedExempt, malformedLines }}
 */
function computeFindings(events, sprintDates = {}, cutoff = SP003_SHIP_DATE, reportsData = null) {
  const findings = [];
  let malformedLines = 0;

  // Bucket events by sprint_id.
  // FIX 3: use Object.create(null) — a sprint_id equal to "__proto__", "constructor", or
  // "toString" would resolve truthy on a plain {} and skip bucket creation, then crash on
  // sd.consults.push(...) with "Cannot read properties of undefined". Null-prototype avoids this.
  const sprintData = Object.create(null);

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
        consults: [],       // sprint_full_beta_consult (real, post-SP-003)
        legacyConsults: [], // sprint_full_beta_consultation (pre-SP-003 placeholder kind)
        halts: [],          // sprint_full_halt
        phaseStarted: new Set(), // phase names that were started (from events)
        _reportConsultedBoundaries: new Set(), // boundaries confirmed by full-reports
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

  // FIX 1: Augment sprintData with full-reports corroboration.
  //
  // For each sprint in reportsData:
  //  • Create a skeleton bucket if the sprint has no events (sprint known only via full-reports).
  //    Its presence in full-reports is evidence that /sprint:full ran for it.
  //  • Merge phasesReached from halt/final reports into phaseStarted (additional evidence that
  //    a boundary was cleared). If that boundary has no consult event → missing_consult finding.
  //  • Store consultedBoundaries from the final report's "## Beta consultations" section into
  //    _reportConsultedBoundaries. If the final report confirms a consult happened, we don't
  //    flag it as missing even if the event is absent (reduce false-positives, not false-negatives).
  //
  // The cutoff filter is applied below in the main loop — no pre-filtering here.
  if (reportsData && typeof reportsData === "object") {
    for (const sprintId of Object.keys(reportsData)) {
      const rd = reportsData[sprintId];
      if (!rd) continue;

      if (!sprintData[sprintId]) {
        // Sprint found only in full-reports — skeleton bucket
        sprintData[sprintId] = {
          consults: [],
          legacyConsults: [],
          halts: [],
          phaseStarted: new Set(),
          _reportConsultedBoundaries: new Set(),
        };
      }
      const sd = sprintData[sprintId];

      if (rd.phasesReached) {
        for (const phase of rd.phasesReached) {
          sd.phaseStarted.add(phase);
        }
      }
      if (rd.consultedBoundaries) {
        for (const b of rd.consultedBoundaries) {
          sd._reportConsultedBoundaries.add(b);
        }
      }
    }
  }

  const applicableSprintIds = [];
  let undatedExempt = 0;
  let checked = 0;

  for (const sprintId of Object.keys(sprintData)) {
    const sd = sprintData[sprintId];
    // Determine sprint start date for cutoff comparison.
    // FIX B: use Object.hasOwn to guard against prototype-inherited properties.
    // A sprint_id equal to "constructor" / "toString" / "valueOf" etc. would resolve
    // a truthy inherited function on a plain {} object, bypassing the undated fail-safe
    // and feeding a garbage value into the cutoff comparison. Own-property check ensures
    // only explicitly set dates are used.
    const sprintDate = Object.hasOwn(sprintDates, sprintId) ? sprintDates[sprintId] : undefined;
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

    // (b) Real kind but missing/empty required fields.
    // FIX 4: treat whitespace-only strings as empty — a beta_message of " " is a fake consult.
    for (const ev of sd.consults) {
      const missing = [];
      // beta_message: flag if absent, empty string, or whitespace-only
      if (!ev.beta_message || !String(ev.beta_message).trim())
        missing.push("beta_message");
      // latency_ms = 0 is valid (CLI resume has no live round-trip); only flag undefined/null
      if (ev.latency_ms === undefined || ev.latency_ms === null)
        missing.push("latency_ms");
      // model: flag if absent, empty string, or whitespace-only
      if (!ev.model || !String(ev.model).trim())
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
    // Evidence that a boundary was cleared comes from TWO sources (union):
    //   1. sprint_full_phase_started events (primary)
    //   2. **Phase:** lines in halt/final reports via reportsData (FIX 1 corroboration)
    //
    // consultedBoundaries also unions THREE sources:
    //   1. Real consult events (sprint_full_beta_consult)
    //   2. Legacy consult events (sprint_full_beta_consultation) — avoids double-flagging
    //   3. Final-report "## Beta consultations" confirmations — reduces false-positives
    const consultedBoundaries = new Set(
      [
        ...sd.consults.map((c) => c.phase_boundary),
        ...sd.legacyConsults.map((c) => c.phase_boundary),
        ...[...sd._reportConsultedBoundaries],
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
  // FIX 2: Validate --since — fail-closed on bogus values.
  // A bad --since like "bogus" makes every sprint compare as "before cutoff"
  // (since "2026-..." < "bogus" lexicographically), silently exempting all sprints
  // and disabling the audit. Reject non-ISO-dates up front with exit 2 (usage error).
  // Also reject a trailing --since with no following value (undefined) or a following
  // flag (starts with "--") — both indicate the user forgot to provide the date.
  if (sinceIdx !== -1) {
    const sinceVal = process.argv[sinceIdx + 1];
    if (!sinceVal || sinceVal.startsWith("--")) {
      process.stderr.write(
        `ERROR [sprint-beta-honesty] --since requires a value (YYYY-MM-DD); none provided\n`,
      );
      process.exit(2);
    }
    if (!validateIsoDate(sinceVal)) {
      process.stderr.write(
        `ERROR [sprint-beta-honesty] invalid --since value: "${sinceVal}" — must be a valid ISO date YYYY-MM-DD\n`,
      );
      process.exit(2);
    }
  }

  // Env overrides for testing (production uses PATHS defaults).
  //   WARPOS_EVENTS_FILE       — override path to events.jsonl
  //   WARPOS_SPRINT_DATES_JSON — override sprint dates as a JSON string {"SP-xxx":"YYYY-MM-DD",...}
  //   WARPOS_FULLREPORTS_DIR   — override path to the full-reports directory

  // 1. Read and parse events.jsonl (missing file → graceful empty)
  let rawEvents = [];
  let malformedCount = 0;
  const eventsPath = process.env.WARPOS_EVENTS_FILE || PATHS.eventsFile;
  try {
    const raw = fs.readFileSync(eventsPath, "utf8");
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
  let sprintDates;
  if (process.env.WARPOS_SPRINT_DATES_JSON) {
    try {
      sprintDates = JSON.parse(process.env.WARPOS_SPRINT_DATES_JSON);
    } catch {
      sprintDates = {};
    }
  } else {
    sprintDates = loadSprintDates();
  }

  // 3. Load full-reports corroboration data (FIX 1)
  const reportsData = loadFullReportsData(process.env.WARPOS_FULLREPORTS_DIR || undefined);

  // 4. Compute findings
  const result = computeFindings(rawEvents, sprintDates, CUTOFF, reportsData);
  result.malformedLines = (result.malformedLines || 0) + malformedCount;

  // 5. Graceful empty — no applicable post-cutoff sprints with activity
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

  // 6. Emit results
  const ok = result.findings.length === 0;
  if (JSON_OUT) {
    const jsonOut = {
      ok,
      applicable: result.applicable,
      checked: result.checked,
      findings: result.findings.slice(0, 30),
      totalFindings: result.findings.length,
      cutoff: CUTOFF,
      undatedExempt: result.undatedExempt,
      malformedLines: result.malformedLines,
    };
    if (result.findings.length > 30) jsonOut.truncated = true;
    console.log(JSON.stringify(jsonOut));
  } else {
    if (ok) {
      console.log(
        `OK   [sprint-beta-honesty] ${result.checked} sprint(s) checked, 0 findings`,
      );
    } else {
      // FIX 5: compact aligned table for human-readable FAIL output
      process.stderr.write(
        `FAIL [sprint-beta-honesty] ${result.findings.length} finding(s) (${result.checked} sprint(s) checked, cutoff ${CUTOFF}):\n\n`,
      );
      process.stderr.write(formatFindingsTable(result.findings.slice(0, 10)) + "\n");
      if (result.findings.length > 10) {
        process.stderr.write(`\n  ... and ${result.findings.length - 10} more\n`);
      }
    }
  }
  process.exit(ok ? 0 : 1);
}

// ── Exports (for test harness) ────────────────────────────────────────────────

module.exports = {
  computeFindings,
  loadFullReportsData,
  validateIsoDate,
  CUTOFF,
  SP003_SHIP_DATE,
  EXPECTED_BOUNDARIES,
  PHASE_TO_BOUNDARY,
};
