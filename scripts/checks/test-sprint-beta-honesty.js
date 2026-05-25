#!/usr/bin/env node
/**
 * scripts/checks/test-sprint-beta-honesty.js
 *
 * Fixture-driven tests for the sprint-beta-honesty check engine.
 * Drives computeFindings() directly with in-memory event records — no live
 * events.jsonl dependency.
 *
 * Scenarios:
 *   (a) CLEAN         — 4 real consults, 0 findings expected
 *   (b) PLACEHOLDER   — legacy kind + missing beta_message, placeholder_verdict finding
 *   (c) MISSING       — phase started but no consult recorded, missing_consult finding
 *   (d) ESCALATE-WITHOUT-HALT — ESCALATE consult + no halt, escalate_without_halt finding
 *   (e) LEGACY-ONLY   — pre-cutoff sprint with placeholder consult → 0 findings (exempt)
 *   (e2) EMPTY        — no events → 0 findings
 *   (e3) UNDATED      — sprint with no known date → exempt (fail-safe)
 *   (f) ESCALATE-WITH-HALT — ESCALATE + correct halt → 0 escalate_without_halt findings
 *
 * Exit: 0 iff all tests pass, 1 otherwise.
 */

"use strict";

const {
  computeFindings,
  EXPECTED_BOUNDARIES,
  SP003_SHIP_DATE,
  PHASE_TO_BOUNDARY,
} = require("./sprint-beta-honesty");

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

// ── Fixture builder helpers ───────────────────────────────────────────────────

const POST_CUTOFF_DATE = "2026-05-26"; // day AFTER SP003_SHIP_DATE → applicable
const PRE_CUTOFF_DATE = "2026-05-20"; // well before SP003_SHIP_DATE → exempt
const BASE_TS = "2026-05-26T10:00:00.000Z";
const LATER_TS = "2026-05-26T10:05:00.000Z";

/**
 * Wrap event data in the canonical logger format:
 *   { id, ts, cat:"audit", actor:"alpha", session, data: { kind, ...payload } }
 *
 * Uses data-nested placement (matches logger.js behaviour).
 */
function makeRec(kind, payload) {
  return {
    id: `EVT-test-${kind}-${Math.random().toString(36).slice(2)}`,
    ts: BASE_TS,
    cat: "audit",
    actor: "alpha",
    session: "s-test",
    data: { kind, ...payload },
  };
}

function makeConsultRec(sprintId, boundary, opts = {}) {
  return makeRec("sprint_full_beta_consult", {
    sprint_id: sprintId,
    phase_boundary: boundary,
    verdict: opts.verdict !== undefined ? opts.verdict : "DECIDE",
    beta_message:
      opts.beta_message !== undefined
        ? opts.beta_message
        : "Beta says proceed with moderate scrutiny.",
    latency_ms: opts.latency_ms !== undefined ? opts.latency_ms : 0,
    model: opts.model !== undefined ? opts.model : "claude-opus-4-7",
    ts: opts.ts || BASE_TS,
    via_cli_resume: true,
  });
}

function makeHaltRec(sprintId, phase, haltReason, ts) {
  return makeRec("sprint_full_halt", {
    sprint_id: sprintId,
    phase,
    halt_reason: haltReason,
    ts: ts || LATER_TS,
  });
}

function makePhaseStartedRec(sprintId, phase) {
  return makeRec("sprint_full_phase_started", {
    sprint_id: sprintId,
    phase,
    ts: BASE_TS,
  });
}

function makeLegacyConsultRec(sprintId, boundary) {
  return makeRec("sprint_full_beta_consultation", {
    sprint_id: sprintId,
    phase_boundary: boundary,
    verdict: "DECIDE",
    ts: BASE_TS,
  });
}

// ── Module shape sanity ───────────────────────────────────────────────────────

console.log("Module exports:");
ok(
  "EXPECTED_BOUNDARIES is frozen array of 4",
  Array.isArray(EXPECTED_BOUNDARIES) && EXPECTED_BOUNDARIES.length === 4,
  `got ${EXPECTED_BOUNDARIES}`,
);
ok(
  "EXPECTED_BOUNDARIES includes before_design",
  EXPECTED_BOUNDARIES.includes("before_design"),
);
ok(
  "EXPECTED_BOUNDARIES includes before_execute",
  EXPECTED_BOUNDARIES.includes("before_execute"),
);
ok(
  "EXPECTED_BOUNDARIES includes before_release-prep",
  EXPECTED_BOUNDARIES.includes("before_release-prep"),
);
ok(
  "EXPECTED_BOUNDARIES includes before_retro",
  EXPECTED_BOUNDARIES.includes("before_retro"),
);
ok(
  "SP003_SHIP_DATE is 2026-05-25",
  SP003_SHIP_DATE === "2026-05-25",
  `got ${SP003_SHIP_DATE}`,
);
ok(
  "PHASE_TO_BOUNDARY maps design → before_design",
  PHASE_TO_BOUNDARY["design"] === "before_design",
);

// ── (a) CLEAN — post-cutoff sprint with all 4 real consults ──────────────────

console.log("\n(a) CLEAN — post-cutoff sprint, all 4 boundaries consulted:");
{
  const sprintId = "SP-TEST-CLEAN-001";
  const events = [
    ...EXPECTED_BOUNDARIES.map((b) => makeConsultRec(sprintId, b)),
    ...Object.keys(PHASE_TO_BOUNDARY).map((p) =>
      makePhaseStartedRec(sprintId, p),
    ),
  ];
  const sprintDates = { [sprintId]: POST_CUTOFF_DATE };
  const r = computeFindings(events, sprintDates);

  ok("CLEAN: 0 findings", r.findings.length === 0, `got ${JSON.stringify(r.findings)}`);
  ok("CLEAN: 1 applicable", r.applicable === 1, `got ${r.applicable}`);
  ok("CLEAN: derived exit code 0", r.findings.length === 0);
}

// ── (b) PLACEHOLDER — legacy kind ────────────────────────────────────────────

console.log("\n(b) PLACEHOLDER — legacy sprint_full_beta_consultation kind:");
{
  const sprintId = "SP-TEST-PH-LEGACY-001";
  const events = [
    makeLegacyConsultRec(sprintId, "before_design"),
    makePhaseStartedRec(sprintId, "design"),
  ];
  const sprintDates = { [sprintId]: POST_CUTOFF_DATE };
  const r = computeFindings(events, sprintDates);

  ok("PH-LEGACY: has finding", r.findings.length > 0, `got ${r.findings.length}`);
  ok(
    "PH-LEGACY: finding_type is placeholder_verdict",
    r.findings.some((f) => f.finding_type === "placeholder_verdict"),
    `types: ${r.findings.map((f) => f.finding_type).join(",")}`,
  );
  ok(
    "PH-LEGACY: no missing_consult (legacy consult covers boundary)",
    !r.findings.some((f) => f.finding_type === "missing_consult"),
  );
  ok("PH-LEGACY: derived exit code 1", r.findings.length > 0);
}

console.log("\n(b2) PLACEHOLDER — missing beta_message:");
{
  const sprintId = "SP-TEST-PH-MSG-001";
  const events = [
    makeConsultRec(sprintId, "before_design", { beta_message: "" }),
    makePhaseStartedRec(sprintId, "design"),
  ];
  const sprintDates = { [sprintId]: POST_CUTOFF_DATE };
  const r = computeFindings(events, sprintDates);

  ok(
    "PH-EMPTY-MSG: has finding",
    r.findings.length > 0,
    `got ${r.findings.length}`,
  );
  ok(
    "PH-EMPTY-MSG: finding_type is placeholder_verdict",
    r.findings.some((f) => f.finding_type === "placeholder_verdict"),
  );
  ok(
    "PH-EMPTY-MSG: evidence mentions beta_message",
    r.findings.some(
      (f) => f.finding_type === "placeholder_verdict" && f.evidence && f.evidence.includes("beta_message"),
    ),
    `evidence: ${r.findings.map((f) => f.evidence).join("|")}`,
  );
}

console.log("\n(b3) PLACEHOLDER — missing model field:");
{
  const sprintId = "SP-TEST-PH-MODEL-001";
  const events = [
    makeConsultRec(sprintId, "before_execute", { model: "" }),
    makePhaseStartedRec(sprintId, "execute"),
  ];
  const sprintDates = { [sprintId]: POST_CUTOFF_DATE };
  const r = computeFindings(events, sprintDates);

  ok(
    "PH-EMPTY-MODEL: has placeholder_verdict finding",
    r.findings.some((f) => f.finding_type === "placeholder_verdict"),
    `findings: ${JSON.stringify(r.findings)}`,
  );
}

console.log("\n(b4) VALID latency_ms=0 is NOT a placeholder:");
{
  // The real emit always sets latency_ms=0 for CLI resume; must not be flagged
  const sprintId = "SP-TEST-LATENCY-ZERO-001";
  const events = [
    makeConsultRec(sprintId, "before_design", { latency_ms: 0 }),
    makePhaseStartedRec(sprintId, "design"),
  ];
  const sprintDates = { [sprintId]: POST_CUTOFF_DATE };
  const r = computeFindings(events, sprintDates);

  ok(
    "LATENCY-ZERO: latency_ms=0 does NOT trigger placeholder_verdict",
    !r.findings.some((f) => f.finding_type === "placeholder_verdict"),
    `findings: ${JSON.stringify(r.findings)}`,
  );
}

// ── (c) MISSING — phase started but no consult event ─────────────────────────

console.log("\n(c) MISSING — boundary reached (phase started) but no consult:");
{
  const sprintId = "SP-TEST-MISSING-001";
  const events = [
    makePhaseStartedRec(sprintId, "design"), // before_design was cleared but no consult
  ];
  const sprintDates = { [sprintId]: POST_CUTOFF_DATE };
  const r = computeFindings(events, sprintDates);

  ok("MISSING: has finding", r.findings.length > 0, `got ${r.findings.length}`);
  ok(
    "MISSING: finding_type is missing_consult",
    r.findings.some((f) => f.finding_type === "missing_consult"),
    `types: ${r.findings.map((f) => f.finding_type).join(",")}`,
  );
  ok(
    "MISSING: expected_consult is before_design",
    r.findings.some((f) => f.expected_consult === "before_design"),
    `expected_consults: ${r.findings.map((f) => f.expected_consult).join(",")}`,
  );
  ok("MISSING: derived exit code 1", r.findings.length > 0);
}

console.log("\n(c2) MISSING — multiple phases started, 2 missing consults:");
{
  const sprintId = "SP-TEST-MISSING-MULTI-001";
  const events = [
    makePhaseStartedRec(sprintId, "design"),
    makePhaseStartedRec(sprintId, "execute"),
    // no consults at all
  ];
  const sprintDates = { [sprintId]: POST_CUTOFF_DATE };
  const r = computeFindings(events, sprintDates);

  ok(
    "MISSING-MULTI: 2 missing_consult findings",
    r.findings.filter((f) => f.finding_type === "missing_consult").length === 2,
    `got ${r.findings.filter((f) => f.finding_type === "missing_consult").length}`,
  );
}

// ── (d) ESCALATE-WITHOUT-HALT ─────────────────────────────────────────────────

console.log("\n(d) ESCALATE-WITHOUT-HALT — ESCALATE consult but no beta_escalate halt:");
{
  const sprintId = "SP-TEST-ESC-001";
  const events = [
    makeConsultRec(sprintId, "before_design", {
      verdict: "ESCALATE",
      beta_message: "This looks risky, escalate.",
    }),
    // No sprint_full_halt(halt_reason: beta_escalate)
  ];
  const sprintDates = { [sprintId]: POST_CUTOFF_DATE };
  const r = computeFindings(events, sprintDates);

  ok(
    "ESC-WITHOUT-HALT: has finding",
    r.findings.length > 0,
    `got ${r.findings.length}`,
  );
  ok(
    "ESC-WITHOUT-HALT: finding_type is escalate_without_halt",
    r.findings.some((f) => f.finding_type === "escalate_without_halt"),
    `types: ${r.findings.map((f) => f.finding_type).join(",")}`,
  );
  ok(
    "ESC-WITHOUT-HALT: verdict field is ESCALATE",
    r.findings.some(
      (f) => f.finding_type === "escalate_without_halt" && f.verdict === "ESCALATE",
    ),
  );
  ok("ESC-WITHOUT-HALT: derived exit code 1", r.findings.length > 0);
}

// ── (f) ESCALATE-WITH-HALT (counter case) ─────────────────────────────────────

console.log("\n(f) ESCALATE-WITH-HALT — ESCALATE consult + correct halt → clean:");
{
  const sprintId = "SP-TEST-ESC-WITH-HALT-001";
  const events = [
    makeConsultRec(sprintId, "before_design", {
      verdict: "ESCALATE",
      beta_message: "Escalate to operator.",
      ts: BASE_TS,
    }),
    makeHaltRec(sprintId, "plan", "beta_escalate", LATER_TS),
  ];
  const sprintDates = { [sprintId]: POST_CUTOFF_DATE };
  const r = computeFindings(events, sprintDates);

  ok(
    "ESC-WITH-HALT: no escalate_without_halt finding",
    !r.findings.some((f) => f.finding_type === "escalate_without_halt"),
    `findings: ${JSON.stringify(r.findings)}`,
  );
}

// ── (e) LEGACY-ONLY — pre-cutoff sprints are fully exempt ────────────────────

console.log("\n(e) LEGACY-ONLY — pre-cutoff sprint with placeholder consult → 0 findings:");
{
  const sprintId = "SP-LEGACY-TEST-001";
  const events = [
    makeLegacyConsultRec(sprintId, "before_design"),
    makePhaseStartedRec(sprintId, "design"),
    makeConsultRec(sprintId, "before_execute", { beta_message: "" }), // placeholder
  ];
  const sprintDates = { [sprintId]: PRE_CUTOFF_DATE }; // BEFORE cutoff → exempt
  const r = computeFindings(events, sprintDates);

  ok(
    "LEGACY: 0 findings (all exempt)",
    r.findings.length === 0,
    `got ${JSON.stringify(r.findings)}`,
  );
  ok("LEGACY: 0 applicable", r.applicable === 0, `got ${r.applicable}`);
  ok("LEGACY: derived exit code 0", r.findings.length === 0);
}

// ── (e2) EMPTY — no events ────────────────────────────────────────────────────

console.log("\n(e2) EMPTY — no events at all:");
{
  const r = computeFindings([], {});

  ok("EMPTY: 0 findings", r.findings.length === 0);
  ok("EMPTY: 0 applicable", r.applicable === 0, `got ${r.applicable}`);
  ok("EMPTY: derived exit code 0", r.findings.length === 0);
}

// ── (e3) UNDATED — sprint with activity but no known date ────────────────────

console.log("\n(e3) UNDATED — sprint has activity but no date in registry:");
{
  const sprintId = "SP-UNDATED-TEST-001";
  const events = [
    makeLegacyConsultRec(sprintId, "before_design"),
    makeConsultRec(sprintId, "before_execute", { beta_message: "" }),
  ];
  // No entry in sprintDates → exempt (fail-safe)
  const r = computeFindings(events, {});

  ok(
    "UNDATED: 0 findings (exempted)",
    r.findings.length === 0,
    `got ${JSON.stringify(r.findings)}`,
  );
  ok(
    "UNDATED: undatedExempt > 0",
    r.undatedExempt > 0,
    `got undatedExempt=${r.undatedExempt}`,
  );
}

// ── (g) MIXED — pre- and post-cutoff sprints in same dataset ─────────────────

console.log("\n(g) MIXED — pre- and post-cutoff sprints: only post fires findings:");
{
  const legacyId = "SP-LEGACY-MIX-001";
  const activeId = "SP-ACTIVE-MIX-001";
  const events = [
    // Legacy sprint: placeholder consult — must NOT fire
    makeLegacyConsultRec(legacyId, "before_design"),
    makePhaseStartedRec(legacyId, "design"),
    // Active sprint: real consults for all boundaries (clean)
    ...EXPECTED_BOUNDARIES.map((b) => makeConsultRec(activeId, b)),
    ...Object.keys(PHASE_TO_BOUNDARY).map((p) =>
      makePhaseStartedRec(activeId, p),
    ),
  ];
  const sprintDates = {
    [legacyId]: PRE_CUTOFF_DATE,
    [activeId]: POST_CUTOFF_DATE,
  };
  const r = computeFindings(events, sprintDates);

  ok("MIXED: 0 findings (active sprint clean)", r.findings.length === 0, `got ${JSON.stringify(r.findings)}`);
  ok("MIXED: 1 applicable", r.applicable === 1, `got ${r.applicable}`);
}

// ── (h) CUSTOM CUTOFF — --since override works ───────────────────────────────

console.log("\n(h) CUSTOM CUTOFF — sprint after base cutoff but before custom cutoff → exempt:");
{
  const sprintId = "SP-CUSTOM-CUTOFF-001";
  const events = [
    makeLegacyConsultRec(sprintId, "before_design"),
  ];
  // Sprint date is POST_CUTOFF_DATE (2026-05-26) but custom cutoff is 2026-06-01
  const sprintDates = { [sprintId]: POST_CUTOFF_DATE };
  const customCutoff = "2026-06-01";
  const r = computeFindings(events, sprintDates, customCutoff);

  ok(
    "CUSTOM-CUTOFF: sprint before custom cutoff is exempt",
    r.findings.length === 0,
    `got ${r.findings.length}`,
  );
  ok("CUSTOM-CUTOFF: 0 applicable", r.applicable === 0, `got ${r.applicable}`);
}

// ── Results ───────────────────────────────────────────────────────────────────

console.log(`\nResults: ${passes} passed, ${failures} failed.`);
process.exit(failures === 0 ? 0 : 1);
