#!/usr/bin/env node
/**
 * scripts/checks/test-sprint-manager-consult.js
 *
 * Fixture-driven tests for the sprint-manager-consult check engine (ADR-0007
 * Tier-4 GAP 1 coverage enforcer). Drives computeFindings() directly with
 * in-memory event records — no live events.jsonl dependency — plus subprocess
 * tests for the CLI exit codes.
 *
 * Scenarios:
 *   (a) MISSING-CONSULT — design-touch signal, NO design-quality consult → fail
 *   (b) PRESENT-CONSULT — design-touch signal + design-quality consult → pass
 *   (c) NO-DESIGN-TOUCH — sprint with no UI signal → not applicable (0 findings)
 *   (d) PRE-CUTOFF      — design-touch + missing consult but pre-cutoff → exempt
 *   (e) UNDATED         — design-touch + missing consult but no known date → exempt
 *   (f) SYNTHETIC       — SP-J* synthetic sprint → exempt from live audit
 *   (g) UI-TOUCHED FLAG — ui_touched:true on a sprint_full event is a design-touch
 *   (h) EMPTY           — no events → graceful (applicable 0)
 *   CLI: empty→exit 0; missing-consult→exit 1; bad --since→exit 2; present→exit 0
 *
 * Exit: 0 iff all tests pass, 1 otherwise.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const cp = require("child_process");

const {
  computeFindings,
  validateIsoDate,
  WIRE_DATE,
  REQUIRED_MANAGER,
  DESIGN_TOUCH_MANAGERS,
} = require("./sprint-manager-consult");

let passes = 0;
let failures = 0;

function ok(name, condition, detail) {
  if (condition) {
    passes++;
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    const suffix = detail ? ` — ${detail}` : "";
    console.log(`  FAIL ${name}${suffix}`);
  }
}

// ── Fixture helpers ───────────────────────────────────────────────────────────

const POST_CUTOFF_DATE = "2026-06-05"; // day AFTER WIRE_DATE → applicable
const PRE_CUTOFF_DATE = "2026-06-01"; // before WIRE_DATE → exempt
const BASE_TS = "2026-06-05T10:00:00.000Z";

/** A sprint_full_* audit event (logger: cat="audit", data={kind,...}). */
function makeSprintFullRec(sprintId, kind = "sprint_full_started", extra = {}) {
  return {
    id: `EVT-test-${Math.random().toString(36).slice(2)}`,
    ts: BASE_TS,
    cat: "audit",
    actor: "alpha",
    session: "s-test",
    sprint_id: sprintId,
    data: { kind, sprint_id: sprintId, ts: BASE_TS, ...extra },
  };
}

/** A manager_consult event (logger: cat="manager_consult", data={manager,...}). */
function makeManagerConsultRec(sprintId, manager, extra = {}) {
  return {
    id: `EVT-test-${Math.random().toString(36).slice(2)}`,
    ts: BASE_TS,
    cat: "manager_consult",
    actor: "system",
    session: "s-test",
    sprint_id: sprintId,
    data: {
      manager,
      mode: extra.mode || "oneshot",
      unit: extra.unit || "some-feature",
      verdict: extra.verdict || "APPROVE",
      lane2Mode: extra.lane2Mode || "block",
      ts: BASE_TS,
    },
  };
}

// ── Module shape sanity ───────────────────────────────────────────────────────

console.log("Module exports:");
ok("WIRE_DATE is 2026-06-04", WIRE_DATE === "2026-06-04", `got ${WIRE_DATE}`);
ok("REQUIRED_MANAGER is design-quality", REQUIRED_MANAGER === "design-quality");
ok(
  "DESIGN_TOUCH_MANAGERS includes visual-review",
  Array.isArray(DESIGN_TOUCH_MANAGERS) && DESIGN_TOUCH_MANAGERS.includes("visual-review"),
);
ok(
  "DESIGN_TOUCH_MANAGERS excludes design-quality (non-circular)",
  !DESIGN_TOUCH_MANAGERS.includes("design-quality"),
);

// ── (a) MISSING-CONSULT ───────────────────────────────────────────────────────

console.log("\n(a) MISSING-CONSULT — design-touch (visual-review) but no design-quality consult:");
{
  const sprintId = "SP-TEST-MC-MISS-001";
  const events = [
    makeSprintFullRec(sprintId),
    makeManagerConsultRec(sprintId, "visual-review"), // design-touch signal
    // NO design-quality consult
  ];
  const r = computeFindings(events, { [sprintId]: POST_CUTOFF_DATE });
  ok("MC-MISS: has finding", r.findings.length > 0, `got ${r.findings.length}`);
  ok(
    "MC-MISS: finding_type is missing_design_consult",
    r.findings.some((f) => f.finding_type === "missing_design_consult"),
    `types: ${r.findings.map((f) => f.finding_type).join(",")}`,
  );
  ok("MC-MISS: 1 applicable", r.applicable === 1, `got ${r.applicable}`);
  ok("MC-MISS: derived exit 1", r.findings.length > 0);
}

// ── (b) PRESENT-CONSULT ───────────────────────────────────────────────────────

console.log("\n(b) PRESENT-CONSULT — design-touch + a design-quality consult → clean:");
{
  const sprintId = "SP-TEST-MC-OK-001";
  const events = [
    makeSprintFullRec(sprintId),
    makeManagerConsultRec(sprintId, "visual-review"), // design-touch signal
    makeManagerConsultRec(sprintId, "design-quality", { verdict: "APPROVE" }),
  ];
  const r = computeFindings(events, { [sprintId]: POST_CUTOFF_DATE });
  ok("MC-OK: 0 findings", r.findings.length === 0, `got ${JSON.stringify(r.findings)}`);
  ok("MC-OK: 1 applicable", r.applicable === 1, `got ${r.applicable}`);
  ok("MC-OK: derived exit 0", r.findings.length === 0);
}

console.log("\n(b2) PRESENT-CONSULT — design-quality REJECT verdict still counts as consulted:");
{
  // A REJECT consult is still a CONSULT — the authority ran. (Whether the run shipped
  // despite REJECT is a different enforcer's concern; coverage only asks "did it run".)
  const sprintId = "SP-TEST-MC-REJECT-001";
  const events = [
    makeManagerConsultRec(sprintId, "visual-review"),
    makeManagerConsultRec(sprintId, "design-quality", { verdict: "REJECT" }),
  ];
  const r = computeFindings(events, { [sprintId]: POST_CUTOFF_DATE });
  ok(
    "MC-REJECT: no missing_design_consult (REJECT is still a consult)",
    !r.findings.some((f) => f.finding_type === "missing_design_consult"),
    `findings: ${JSON.stringify(r.findings)}`,
  );
}

// ── (c) NO-DESIGN-TOUCH ───────────────────────────────────────────────────────

console.log("\n(c) NO-DESIGN-TOUCH — sprint ran but no UI signal → not applicable:");
{
  const sprintId = "SP-TEST-MC-NOUI-001";
  const events = [
    makeSprintFullRec(sprintId),
    makeSprintFullRec(sprintId, "sprint_full_phase_started", { phase: "execute" }),
    // no visual-review, no ui_touched, no design-quality → non-UI sprint
  ];
  const r = computeFindings(events, { [sprintId]: POST_CUTOFF_DATE });
  ok(
    "NO-UI: 0 findings (design authority not required for non-UI sprint)",
    r.findings.length === 0,
    `got ${JSON.stringify(r.findings)}`,
  );
  ok("NO-UI: 0 applicable (out of scope)", r.applicable === 0, `got ${r.applicable}`);
}

// ── (d) PRE-CUTOFF ────────────────────────────────────────────────────────────

console.log("\n(d) PRE-CUTOFF — design-touch + missing consult but pre-wire-date → exempt:");
{
  const sprintId = "SP-TEST-MC-LEGACY-001";
  const events = [
    makeManagerConsultRec(sprintId, "visual-review"), // design-touch
    // missing design-quality consult — but the sprint predates the wiring
  ];
  const r = computeFindings(events, { [sprintId]: PRE_CUTOFF_DATE });
  ok("PRE-CUTOFF: 0 findings (legacy exempt)", r.findings.length === 0, `got ${JSON.stringify(r.findings)}`);
  ok("PRE-CUTOFF: 0 applicable", r.applicable === 0, `got ${r.applicable}`);
}

// ── (e) UNDATED ───────────────────────────────────────────────────────────────

console.log("\n(e) UNDATED — design-touch + missing consult but no known date → exempt:");
{
  const sprintId = "SP-TEST-MC-UNDATED-001";
  const events = [makeManagerConsultRec(sprintId, "visual-review")];
  const r = computeFindings(events, {}); // no date for this sprint
  ok("UNDATED: 0 findings (exempted)", r.findings.length === 0, `got ${JSON.stringify(r.findings)}`);
  ok("UNDATED: undatedExempt > 0", r.undatedExempt > 0, `got undatedExempt=${r.undatedExempt}`);
}

// ── (f) SYNTHETIC ─────────────────────────────────────────────────────────────

console.log("\n(f) SYNTHETIC — SP-J* sprint with missing consult → audit-exempt:");
{
  const sprintId = "SP-J9-SYNTH-001";
  const events = [makeManagerConsultRec(sprintId, "visual-review")];
  const r = computeFindings(events, { [sprintId]: POST_CUTOFF_DATE });
  ok(
    "SYNTH: no findings for synthetic sprint (audit-exempt)",
    r.findings.length === 0,
    `got ${JSON.stringify(r.findings)}`,
  );
}

// ── (g) UI-TOUCHED FLAG ───────────────────────────────────────────────────────

console.log("\n(g) UI-TOUCHED FLAG — ui_touched:true on a sprint_full event is a design-touch:");
{
  const sprintId = "SP-TEST-MC-UITOUCH-001";
  const events = [
    makeSprintFullRec(sprintId, "sprint_full_phase_completed", { phase: "execute", ui_touched: true }),
    // ui_touched signal present, no design-quality consult → finding
  ];
  const r = computeFindings(events, { [sprintId]: POST_CUTOFF_DATE });
  ok(
    "UI-TOUCH: ui_touched:true triggers applicability",
    r.applicable === 1 && r.findings.some((f) => f.finding_type === "missing_design_consult"),
    `applicable=${r.applicable} findings=${JSON.stringify(r.findings)}`,
  );
}

// ── (h) EMPTY ─────────────────────────────────────────────────────────────────

console.log("\n(h) EMPTY — no events at all:");
{
  const r = computeFindings([], {});
  ok("EMPTY: 0 findings", r.findings.length === 0);
  ok("EMPTY: 0 applicable", r.applicable === 0, `got ${r.applicable}`);
}

// ── (i) --SINCE VALIDATION ────────────────────────────────────────────────────

console.log("\n(i) --SINCE VALIDATION — validateIsoDate predicate:");
{
  ok("SINCE-VALID: '2026-06-04' → true", validateIsoDate("2026-06-04"));
  ok("SINCE-INVALID: 'bogus' → false", !validateIsoDate("bogus"));
  ok("SINCE-INVALID: '2026-13-01' → false", !validateIsoDate("2026-13-01"));
  ok("SINCE-INVALID: '2026-02-30' → false (V8 rollover)", !validateIsoDate("2026-02-30"));
  ok("SINCE-INVALID: '' → false", !validateIsoDate(""));
}

// ── (j) CLI EXIT CODES — subprocess tests ────────────────────────────────────

console.log("\n(j) CLI EXIT CODES — subprocess tests:");
{
  const ENGINE = path.join(__dirname, "sprint-manager-consult.js");

  // Test 1: --since bogus → exit 2 (fail-closed)
  {
    const r = cp.spawnSync(process.execPath, [ENGINE, "--since", "bogus"], { encoding: "utf8" });
    ok("CLI-EXIT: --since bogus → exit 2", r.status === 2, `got status=${r.status} stderr=${r.stderr}`);
  }

  // Test 2: --since with no value → exit 2
  {
    const r = cp.spawnSync(process.execPath, [ENGINE, "--since"], { encoding: "utf8" });
    ok("CLI-EXIT: --since (no value) → exit 2", r.status === 2, `got status=${r.status} stderr=${r.stderr}`);
  }

  // Test 3: empty events → exit 0 (graceful-empty)
  {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wos-smc-"));
    const tmpEvents = path.join(tmpDir, "events.jsonl");
    fs.writeFileSync(tmpEvents, "");
    const r = cp.spawnSync(process.execPath, [ENGINE], {
      encoding: "utf8",
      env: { ...process.env, WARPOS_EVENTS_FILE: tmpEvents, WARPOS_SPRINT_DATES_JSON: "{}" },
    });
    ok(
      "CLI-EXIT: empty events → exit 0 (graceful-empty)",
      r.status === 0,
      `got status=${r.status} stdout=${r.stdout} stderr=${r.stderr}`,
    );
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
  }

  // Test 4: design-touch + missing consult → exit 1 (finding)
  {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wos-smc-"));
    const tmpEvents = path.join(tmpDir, "events.jsonl");
    const sprintId = "SP-CLI-MC-FINDING-001";
    const evt = {
      id: "EVT-cli-mc-001",
      ts: BASE_TS,
      cat: "manager_consult",
      actor: "system",
      session: "s-cli",
      sprint_id: sprintId,
      data: { manager: "visual-review", mode: "oneshot", unit: "u", ts: BASE_TS },
    };
    fs.writeFileSync(tmpEvents, JSON.stringify(evt) + "\n");
    const r = cp.spawnSync(process.execPath, [ENGINE], {
      encoding: "utf8",
      env: {
        ...process.env,
        WARPOS_EVENTS_FILE: tmpEvents,
        WARPOS_SPRINT_DATES_JSON: JSON.stringify({ [sprintId]: POST_CUTOFF_DATE }),
      },
    });
    ok(
      "CLI-EXIT: design-touch + no design-quality consult → exit 1 (finding)",
      r.status === 1,
      `got status=${r.status} stdout=${r.stdout} stderr=${r.stderr}`,
    );
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
  }

  // Test 5: design-touch + design-quality consult present → exit 0 (clean)
  {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wos-smc-"));
    const tmpEvents = path.join(tmpDir, "events.jsonl");
    const sprintId = "SP-CLI-MC-CLEAN-001";
    const lines = [
      {
        id: "EVT-cli-mc-vr", ts: BASE_TS, cat: "manager_consult", actor: "system", session: "s",
        sprint_id: sprintId, data: { manager: "visual-review", ts: BASE_TS },
      },
      {
        id: "EVT-cli-mc-dq", ts: BASE_TS, cat: "manager_consult", actor: "system", session: "s",
        sprint_id: sprintId, data: { manager: "design-quality", verdict: "APPROVE", ts: BASE_TS },
      },
    ].map((e) => JSON.stringify(e)).join("\n") + "\n";
    fs.writeFileSync(tmpEvents, lines);
    const r = cp.spawnSync(process.execPath, [ENGINE], {
      encoding: "utf8",
      env: {
        ...process.env,
        WARPOS_EVENTS_FILE: tmpEvents,
        WARPOS_SPRINT_DATES_JSON: JSON.stringify({ [sprintId]: POST_CUTOFF_DATE }),
      },
    });
    ok(
      "CLI-EXIT: design-touch + design-quality consult → exit 0 (clean)",
      r.status === 0,
      `got status=${r.status} stdout=${r.stdout} stderr=${r.stderr}`,
    );
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
  }
}

// ── Results ───────────────────────────────────────────────────────────────────

console.log(`\nResults: ${passes} passed, ${failures} failed.`);
process.exit(failures === 0 ? 0 : 1);
