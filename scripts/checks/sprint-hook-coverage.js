#!/usr/bin/env node
"use strict";

// scan:sprint-hook-coverage — BIDIRECTIONAL coverage of the sprint hook-point registry
// (.claude/agents/_org/sprint-hook-points.json). Phase D F3c. The "easily find gaps"
// enforcer the operator asked for, made self-detecting on the agent<->sprint surface.
//
// FORWARD (per /sprint:full run): for every hook-point row whose condition MATCHED the
//   run's composition with mode:"block", a manager_consult record for that role must
//   exist over the run window — else `missing_block_agent` (a required agent declared at
//   a step never ran). Advisory rows that didn't run are reported as info, not findings.
//
// REVERSE (static, registry-only): the registry is structurally coherent — every row's
//   role exists in role-registry, every step is canonical, no step is orphaned. Delegates
//   to hook-points.validate() (the same tripwire its own test asserts).
//
// SCOPE = SPRINTS (mirrors sprint-manager-consult): the unit of audit is a /sprint:full
//   run, attributed by sprint_id; per-sprint composition is derived from the sprint's
//   ticket files (the same source full.js feeds the router).
//
// Date-cutoff: sprints before the F3b wiring date are LEGACY/exempt (flagging them would
//   be a false positive). Graceful-empty: no applicable sprints -> exit 0. Fail-closed:
//   a bad --since, or an unreadable/structurally-broken registry -> exit 2.
//
// See .claude/commands/scan/sprint-hook-coverage.md for the full spec.

const fs = require("fs");
const path = require("path");
const { PATHS } = require("../hooks/lib/paths");
const hookPoints = require("../sprint/hook-points");

// ── Constants ─────────────────────────────────────────────────────────────────

// The F3b manager_consult emitter wiring date — sprints before predate the mechanism.
const WIRE_DATE = "2026-06-05";

// Synthetic/test sprint prefixes — exempt from the LIVE corpus audit.
const SYNTHETIC_SPRINT_PREFIXES = ["SP-J", "SP-TEST"];
function isSyntheticSprint(sprintId) {
  return SYNTHETIC_SPRINT_PREFIXES.some((p) => String(sprintId).startsWith(p));
}

// ── CLI flags ─────────────────────────────────────────────────────────────────

const JSON_OUT = process.argv.includes("--json");
const sinceIdx = process.argv.indexOf("--since");
const CUTOFF = sinceIdx !== -1 && process.argv[sinceIdx + 1] ? process.argv[sinceIdx + 1] : WIRE_DATE;

// ── Field extraction (robust to top-level + data-nested placement) ────────────

const EVENT_FIELDS = ["kind", "manager", "mode", "unit", "verdict", "sprint_id", "ui_touched", "phase", "ts"];
function getEventFields(rec) {
  if (!rec || typeof rec !== "object") return {};
  const d = rec.data && typeof rec.data === "object" ? rec.data : {};
  const merged = { ...d };
  if (rec.cat !== undefined) merged.cat = rec.cat;
  if (rec.sprint_id !== undefined && merged.sprint_id === undefined) merged.sprint_id = rec.sprint_id;
  for (const k of EVENT_FIELDS) if (rec[k] !== undefined) merged[k] = rec[k];
  return merged;
}

function validateIsoDate(val) {
  if (typeof val !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const d = new Date(val + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === val;
}

function extractYamlDate(text) {
  if (!text) return null;
  const m = text.match(/(?:created_at|start_date|start)\s*:\s*["']?([0-9]{4}-[0-9]{2}-[0-9]{2})/);
  return m ? m[1] : null;
}

// ── Filesystem loaders (sprint dates + per-sprint composition) ────────────────

function loadSprintDates() {
  const dates = {};
  const sprintsDir = PATHS.sprintSprints;
  if (sprintsDir && fs.existsSync(sprintsDir)) {
    let entries = [];
    try { entries = fs.readdirSync(sprintsDir); } catch { /* ignore */ }
    for (const entry of entries) {
      try {
        const cur = path.join(sprintsDir, entry, "current.yaml");
        if (fs.existsSync(cur)) {
          const date = extractYamlDate(fs.readFileSync(cur, "utf8"));
          if (date) dates[entry] = date;
        }
      } catch { /* skip */ }
    }
  }
  const reg = PATHS.sprintActiveRegistry;
  if (reg && fs.existsSync(reg)) {
    try {
      const text = fs.readFileSync(reg, "utf8");
      for (const chunk of text.split(/^(?=\s*-\s)/m).filter(Boolean)) {
        const idM = chunk.match(/\bid\s*:\s*["']?(\S+?)["']?\s*$/m);
        const dM = chunk.match(/(?:created_at|start_date|start)\s*:\s*["']?([0-9]{4}-[0-9]{2}-[0-9]{2})/);
        if (idM && dM) { const id = idM[1].replace(/['"]/g, ""); if (!dates[id]) dates[id] = dM[1]; }
      }
    } catch { /* ignore */ }
  }
  return dates;
}

// Minimal ticket-field reader (avoids a YAML dep): pull sprint, unit_type, domain, type,
// risk_level out of each ticket file under paths.sprintTickets. compositionFromTickets
// then aggregates. Best-effort — unreadable files are skipped.
function ticketFieldsFor(sprintId) {
  const out = [];
  const dir = PATHS.sprintTickets;
  if (!dir || !fs.existsSync(dir)) return out;
  let files = [];
  try { files = fs.readdirSync(dir); } catch { return out; }
  for (const f of files) {
    if (!/\.(ya?ml|json)$/.test(f)) continue;
    let text;
    try { text = fs.readFileSync(path.join(dir, f), "utf8"); } catch { continue; }
    const get = (k) => {
      const m = text.match(new RegExp(`^\\s*${k}\\s*:\\s*["']?([A-Za-z0-9_-]+)`, "m"));
      return m ? m[1] : null;
    };
    if (get("sprint") !== sprintId) continue;
    out.push({ unit_type: get("unit_type"), domain: get("domain"), type: get("type"), risk_level: get("risk_level") });
  }
  return out;
}

// ── Core compute (exported, pure given its inputs) ────────────────────────────

/**
 * @param {object[]} events             parsed event records
 * @param {object}   registry           the hook-point registry
 * @param {object}   compositionBySprint map sprint_id -> { unit_types, max_risk, domains }
 * @param {object}   sprintDates        map sprint_id -> "YYYY-MM-DD"
 * @param {string}   cutoff             ISO date — sprints before are exempt
 * @returns {{ findings, info, applicable, checked, undatedExempt }}
 */
function computeFindings(events, registry, compositionBySprint = {}, sprintDates = {}, cutoff = WIRE_DATE) {
  const findings = [];
  const info = [];

  // bucket: per sprint — was there a run, and which managers were consulted.
  const bySprint = Object.create(null);
  for (const rec of events) {
    const f = getEventFields(rec);
    const sid = f.sprint_id;
    if (!sid) continue;
    const isConsult = f.cat === "manager_consult" || (f.manager && !f.kind);
    const isRun = typeof f.kind === "string" && f.kind.startsWith("sprint_full");
    if (!isConsult && !isRun) continue;
    if (!bySprint[sid]) bySprint[sid] = { run: false, consulted: new Set() };
    if (isRun) bySprint[sid].run = true;
    if (isConsult && f.manager) bySprint[sid].consulted.add(String(f.manager));
  }

  const applicable = [];
  let undatedExempt = 0;
  let checked = 0;
  const STEPS = hookPoints.STEPS;

  for (const sid of Object.keys(bySprint)) {
    const sd = bySprint[sid];
    if (!sd.run) continue; // only audit attributed /sprint:full runs
    if (isSyntheticSprint(sid)) continue;
    const date = Object.hasOwn(sprintDates, sid) ? sprintDates[sid] : undefined;
    if (!date) { undatedExempt++; continue; }
    if (date < cutoff) continue;

    applicable.push(sid);
    checked++;
    const composition = compositionBySprint[sid] || {};
    for (const step of STEPS) {
      for (const row of hookPoints.agentsForStep(step, composition, registry)) {
        if (sd.consulted.has(row.role)) continue;
        const finding = { sprint_id: sid, role: row.role, step, mode: row.mode, finding_type: "missing_block_agent" };
        if (row.mode === "block") {
          finding.evidence = `block-row ${row.role}@${step} matched the composition but no manager_consult record exists for this run`;
          findings.push(finding);
        } else {
          finding.finding_type = "missing_advisory_agent";
          finding.evidence = `advisory-row ${row.role}@${step} matched but did not run (informational)`;
          info.push(finding);
        }
      }
    }
  }

  return { findings, info, applicable: applicable.length, checked, undatedExempt };
}

/** REVERSE: registry structural coherence (delegates to hook-points.validate). */
function reverseCoverage(registry, roleIds) {
  return hookPoints.validate(registry, roleIds);
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function main() {
  if (sinceIdx !== -1) {
    const v = process.argv[sinceIdx + 1];
    if (!v || v.startsWith("--") || !validateIsoDate(v)) {
      process.stderr.write(`ERROR [sprint-hook-coverage] invalid --since (need YYYY-MM-DD)\n`);
      return 2;
    }
  }

  // Load the registry + roster (fail-closed on unreadable/broken).
  let registry, roleIds;
  try {
    registry = hookPoints.load();
    roleIds = hookPoints.loadRoleIds();
  } catch (e) {
    process.stderr.write(`ERROR [sprint-hook-coverage] cannot read registry/roster: ${e.message}\n`);
    return 2;
  }

  // REVERSE first — a structurally broken registry is fail-closed (exit 2) regardless of runs.
  const rev = reverseCoverage(registry, roleIds);
  if (!rev.ok) {
    process.stderr.write(
      `FAIL [sprint-hook-coverage] registry structurally incoherent (${rev.errors.length}):\n${rev.errors.map((e) => "  - " + e).join("\n")}\n`,
    );
    return 2;
  }

  // FORWARD — read events + per-sprint composition.
  let rawEvents = [];
  const eventsPath = process.env.WARPOS_EVENTS_FILE || PATHS.eventsFile;
  try {
    for (const line of fs.readFileSync(eventsPath, "utf8").split(/\r?\n/)) {
      if (!line.trim()) continue;
      try { rawEvents.push(JSON.parse(line)); } catch { /* skip malformed */ }
    }
  } catch { /* missing events -> graceful empty */ }

  const sprintDates = loadSprintDates();
  // Build composition per sprint that appears in events (cheap; only seen sprints).
  const compositionBySprint = {};
  const seen = new Set(rawEvents.map((r) => getEventFields(r).sprint_id).filter(Boolean));
  for (const sid of seen) {
    compositionBySprint[sid] = hookPoints.compositionFromTickets(ticketFieldsFor(sid));
  }

  const res = computeFindings(rawEvents, registry, compositionBySprint, sprintDates, CUTOFF);

  if (res.applicable === 0) {
    if (JSON_OUT) console.log(JSON.stringify({ ok: true, applicable: 0, reason: "no_applicable_sprints", cutoff: CUTOFF }));
    else console.log(`OK   [sprint-hook-coverage] registry coherent (${registry.rows.length} rows); no applicable post-cutoff sprint runs to audit (cutoff ${CUTOFF})`);
    return 0;
  }

  const ok = res.findings.length === 0;
  if (JSON_OUT) {
    console.log(JSON.stringify({ ok, applicable: res.applicable, checked: res.checked, findings: res.findings.slice(0, 50), info: res.info.length, totalFindings: res.findings.length, cutoff: CUTOFF }));
  } else if (ok) {
    console.log(`OK   [sprint-hook-coverage] ${res.checked} sprint run(s) checked, 0 forward gaps (${res.info.length} advisory-not-run, informational); registry coherent`);
  } else {
    process.stderr.write(`FAIL [sprint-hook-coverage] ${res.findings.length} forward coverage gap(s) (${res.checked} run(s) checked, cutoff ${CUTOFF}):\n`);
    for (const f of res.findings.slice(0, 15)) process.stderr.write(`  - ${f.sprint_id}: ${f.evidence}\n`);
    if (res.findings.length > 15) process.stderr.write(`  ... and ${res.findings.length - 15} more\n`);
  }
  return ok ? 0 : 1;
}

if (require.main === module) process.exit(main());

module.exports = { computeFindings, reverseCoverage, getEventFields, validateIsoDate, WIRE_DATE };
