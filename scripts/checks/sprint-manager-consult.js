#!/usr/bin/env node
// scan:sprint-manager-consult — audit manager-consult coverage across /sprint:full runs.
//
// ADR-0007 Tier-4 enforcement (GAP 1): the named cross-domain design authority
// (`design-quality`) is now WIRED into both adhoc (gamma.md W1) and oneshot
// (oneshot/protocol.md Step 4 d.1). But a wired gate that is silently SKIPPED on a
// UI-touching sprint is invisible — there is no record that the design authority was
// ever consulted. This is the coverage enforcer: for every post-cutoff /sprint:full
// run that shows a DESIGN-TOUCH signal, it asserts a `manager_consult` record for
// `design-quality` exists in events.jsonl over the run window — else FAIL.
//
// SCOPE = SPRINTS (mirrors sprint-beta-honesty). The unit of audit is a /sprint:full
// run (attributed by sprint_id); the design authority must be consulted at least once
// per design-touching run.
//
// Detects one finding type:
//   missing_design_consult — a sprint shows a design-touch signal (a manager_consult
//     for a design-domain manager OTHER than design-quality — e.g. visual-review — OR
//     an explicit ui_touched:true on any sprint_full_* event) but NO manager_consult
//     record for `design-quality` exists for that sprint.
//
// The design-touch signal is INDEPENDENT of the design-quality consult itself (so the
// check is not circular): presence of UI work is established by a separate marker, and
// the absence of the design-quality consult is the finding — exactly parallel to
// sprint-beta-honesty's (phase_started ⇒ independent signal; consult-absence ⇒ finding).
//
// Date-cutoff: sprints whose start date is BEFORE the cutoff are LEGACY and exempt.
// Cutoff defaults to 2026-06-04 (the ADR-0007 wiring date) so only NEW runs are audited.
// Graceful empty: no applicable sprints → exit 0 with an informational message.
// Fail-closed: a bad --since (non-ISO / overflow / missing value) → exit 2.
//
// See .claude/commands/scan/sprint-manager-consult.md for the full spec.

"use strict";

const fs = require("fs");
const path = require("path");
const { PATHS } = require("../hooks/lib/paths");

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * ISO date of the ADR-0007 design-quality wiring — sprints before this predate the
 * mechanism and are LEGACY/exempt (flagging them would be a false positive, exactly
 * as sprint-beta-honesty exempts pre-SP-003 sprints).
 */
const WIRE_DATE = "2026-06-04";

/** The named manager this check enforces coverage for. */
const REQUIRED_MANAGER = "design-quality";

/**
 * Managers whose presence on a sprint constitutes an INDEPENDENT "this sprint touched
 * UI/app-design/web-design work" signal — distinct from design-quality itself, so the
 * check is non-circular. visual-review is the multimodal browser review that runs on
 * the same UI-diff condition as design-quality; a design-lead consult is design work.
 */
const DESIGN_TOUCH_MANAGERS = Object.freeze(["visual-review", "design-lead", "design-review"]);

// Synthetic/test sprint prefixes — exempt from the LIVE audit (they carry deliberate
// fixtures). The date-cutoff + undated-exempt already filters most; this scopes the
// corpus audit only (computeFindings still classifies them in unit tests).
const SYNTHETIC_SPRINT_PREFIXES = ["SP-J"];

function isSyntheticSprint(sprintId) {
  return SYNTHETIC_SPRINT_PREFIXES.some((p) => String(sprintId).startsWith(p));
}

// ── CLI flags ─────────────────────────────────────────────────────────────────

const JSON_OUT = process.argv.includes("--json");
const sinceIdx = process.argv.indexOf("--since");
const CUTOFF =
  sinceIdx !== -1 && process.argv[sinceIdx + 1]
    ? process.argv[sinceIdx + 1]
    : WIRE_DATE;

// ── Field extraction — robust to top-level and data-nested placement ──────────
//
// The logger writes: log("manager_consult", { manager, mode, unit, verdict, ... })
//   → event.cat = "manager_consult", event.data = { manager, mode, unit, ... }
// and log("audit", { kind: "sprint_full_*", ... }) → event.data = { kind, ... }.
// Be robust to both data-nested AND top-level placement.

const EVENT_FIELDS = [
  "kind",
  "manager",
  "mode",
  "unit",
  "verdict",
  "sprint_id",
  "ui_touched",
  "ts",
  "phase",
];

function getEventFields(rec) {
  if (!rec || typeof rec !== "object") return {};
  const d = rec.data && typeof rec.data === "object" ? rec.data : {};
  const merged = { ...d };
  // Carry the top-level category + sprint_id (logger writes sprint_id at top level).
  if (rec.cat !== undefined) merged.cat = rec.cat;
  if (rec.sprint_id !== undefined && merged.sprint_id === undefined) merged.sprint_id = rec.sprint_id;
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

// ── ISO date validator (round-trip; rejects V8 calendar rollovers) ───────────

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
 * @param {object[]} events      Parsed event records (as read from events.jsonl)
 * @param {Object}   sprintDates  Map of sprint_id → "YYYY-MM-DD" start date
 * @param {string}   cutoff      ISO date string — sprints before this are exempt
 * @returns {{ findings, applicable, checked, undatedExempt, malformedLines }}
 */
function computeFindings(events, sprintDates = {}, cutoff = WIRE_DATE) {
  const findings = [];
  let malformedLines = 0;

  // Bucket events by sprint_id. Null-prototype guards proto-pollution sprint ids
  // ("__proto__"/"constructor"/"toString") — same hardening as sprint-beta-honesty.
  const sprintData = Object.create(null);

  for (const rec of events) {
    if (!rec || typeof rec !== "object") {
      malformedLines++;
      continue;
    }
    const f = getEventFields(rec);
    const sprintId = f.sprint_id;
    if (!sprintId) continue; // can't attribute without a sprint_id

    const isManagerConsult = f.cat === "manager_consult" || (f.manager && !f.kind);
    const isSprintFull = typeof f.kind === "string" && f.kind.startsWith("sprint_full");

    // Only events that can establish either the design-touch signal OR the
    // design-quality consult are relevant. Skip everything else.
    if (!isManagerConsult && !isSprintFull) continue;

    if (!sprintData[sprintId]) {
      sprintData[sprintId] = {
        sawSprintFull: false,    // proof a /sprint:full run is attributed to this id
        designTouch: false,      // independent "touched UI" signal
        hasDesignQuality: false, // a design-quality manager_consult exists
        designTouchEvidence: null,
      };
    }
    const sd = sprintData[sprintId];

    if (isSprintFull) {
      sd.sawSprintFull = true;
      // Explicit ui_touched marker on any sprint_full_* event is a design-touch signal.
      if (f.ui_touched === true) {
        sd.designTouch = true;
        if (!sd.designTouchEvidence) sd.designTouchEvidence = `ui_touched on ${f.kind}`;
      }
    }

    if (isManagerConsult && f.manager) {
      const mgr = String(f.manager);
      if (mgr === REQUIRED_MANAGER) {
        sd.hasDesignQuality = true;
      } else if (DESIGN_TOUCH_MANAGERS.includes(mgr)) {
        sd.designTouch = true;
        // A design-domain consult also proves a sprint_full run touched UI even if no
        // sprint_full_* event was attributed (the consult itself implies the run).
        if (!sd.designTouchEvidence) sd.designTouchEvidence = `${mgr} manager_consult`;
      }
    }
  }

  const applicableSprintIds = [];
  let undatedExempt = 0;
  let checked = 0;

  for (const sprintId of Object.keys(sprintData)) {
    const sd = sprintData[sprintId];

    // A sprint is in-scope only if it shows a DESIGN-TOUCH signal — otherwise the
    // design authority is legitimately not required (non-UI sprint).
    if (!sd.designTouch) continue;

    // Live-audit exemption for synthetic/test sprints.
    if (isSyntheticSprint(sprintId)) continue;

    // Date-cutoff: own-property guard against prototype-inherited dates.
    const sprintDate = Object.hasOwn(sprintDates, sprintId) ? sprintDates[sprintId] : undefined;
    if (!sprintDate) {
      undatedExempt++; // unknown date → exempt (fail-safe; don't false-flag)
      continue;
    }
    if (sprintDate < cutoff) {
      continue; // legacy sprint — exempt entirely
    }

    applicableSprintIds.push(sprintId);
    checked++;

    if (!sd.hasDesignQuality) {
      findings.push({
        sprint_id: sprintId,
        manager: REQUIRED_MANAGER,
        evidence: `sprint shows a design-touch signal (${sd.designTouchEvidence || "design work"}) but no manager_consult record for '${REQUIRED_MANAGER}' was found for this sprint`,
        finding_type: "missing_design_consult",
      });
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

// ── Table formatter for human FAIL output ─────────────────────────────────────

function formatFindingsTable(findings) {
  if (findings.length === 0) return "";
  const EVIDENCE_MAX = 64;
  let w0 = 6; // SPRINT
  let w1 = 7; // MANAGER
  let w2 = 20; // FINDING_TYPE
  for (const f of findings) {
    w0 = Math.min(28, Math.max(w0, (f.sprint_id || "").length));
    w1 = Math.min(16, Math.max(w1, (f.manager || "").length));
    w2 = Math.min(24, Math.max(w2, (f.finding_type || "").length));
  }
  const pad = (s, w) => String(s == null ? "-" : s).slice(0, w).padEnd(w);
  const trunc = (s, w) => {
    const str = String(s == null ? "" : s);
    return str.length > w ? str.slice(0, w - 1) + "…" : str.padEnd(w);
  };
  const header = [pad("SPRINT", w0), pad("MANAGER", w1), pad("FINDING_TYPE", w2), "EVIDENCE"].join("  ");
  const separator = ["-".repeat(w0), "-".repeat(w1), "-".repeat(w2), "-".repeat(EVIDENCE_MAX)].join("  ");
  const rows = findings.map((f) =>
    [pad(f.sprint_id, w0), pad(f.manager, w1), pad(f.finding_type, w2), trunc(f.evidence, EVIDENCE_MAX)].join("  "),
  );
  return [header, separator, ...rows].join("\n");
}

// ── CLI entry point ───────────────────────────────────────────────────────────

if (require.main === module) {
  // Validate --since — fail-closed on bogus values (mirrors sprint-beta-honesty).
  if (sinceIdx !== -1) {
    const sinceVal = process.argv[sinceIdx + 1];
    if (!sinceVal || sinceVal.startsWith("--")) {
      process.stderr.write(
        `ERROR [sprint-manager-consult] --since requires a value (YYYY-MM-DD); none provided\n`,
      );
      process.exit(2);
    }
    if (!validateIsoDate(sinceVal)) {
      process.stderr.write(
        `ERROR [sprint-manager-consult] invalid --since value: "${sinceVal}" — must be a valid ISO date YYYY-MM-DD\n`,
      );
      process.exit(2);
    }
  }

  // Env overrides for testing (production uses PATHS defaults).
  //   WARPOS_EVENTS_FILE       — override path to events.jsonl
  //   WARPOS_SPRINT_DATES_JSON — override sprint dates as a JSON string

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

  // 3. Compute findings
  const result = computeFindings(rawEvents, sprintDates, CUTOFF);
  result.malformedLines = (result.malformedLines || 0) + malformedCount;

  // 4. Graceful empty — no applicable post-cutoff design-touching sprints
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
        `OK   [sprint-manager-consult] no applicable design-touching sprints in window (cutoff ${CUTOFF}) — nothing to audit`,
      );
    }
    process.exit(0);
  }

  // 5. Emit results
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
        `OK   [sprint-manager-consult] ${result.checked} design-touching sprint(s) checked, 0 findings`,
      );
    } else {
      process.stderr.write(
        `FAIL [sprint-manager-consult] ${result.findings.length} finding(s) (${result.checked} sprint(s) checked, cutoff ${CUTOFF}):\n\n`,
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
  validateIsoDate,
  WIRE_DATE,
  REQUIRED_MANAGER,
  DESIGN_TOUCH_MANAGERS,
};
