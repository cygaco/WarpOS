#!/usr/bin/env node
"use strict";

/**
 * AP-1 automated-consult-stream check — ARMED 2026-08-04, before the first W1 boundary.
 *
 * OPERATOR-ORDERED (task #11). This targets the AUTOMATED stream ONLY:
 *   kind === "sprint_full_beta_consult", emitted by scripts/sprint/full.js at phase
 *   boundaries, filtered to the REAL W1 sprint ids.
 *
 * THE QUESTION: do the per-phase `beta_message` strings VARY WITH ACTUAL PHASE CONTENT,
 * or are they template output wearing a phase label?
 *
 * WHAT THIS MUST NEVER DO — and why (this is the whole reason the check exists):
 *   Do NOT sample beta's reasoned betaEvents rows (293-298). That lane was ruled REAL in
 *   July, it is observer-affected, and measuring it would FALSE-CLOSE the three-cycle-old
 *   AP-1 gap by answering an easier question than the one asked. This script reads
 *   paths.eventsFile only. It never opens betaEvents.
 *
 * ARMING BASELINE (captured before any W1 boundary fired, so nothing is reconstructed):
 *   events.jsonl lines .............. 10151
 *   sprint_full_beta_consult (all) ..   174
 *   sprint_full_beta_consult (W1) ..     0   <- any W1 row is therefore provably fresh
 *
 * NORMALIZATION BIAS (β review 2026-08-04, HIGH finding applied): the skeleton transform is
 * DELIBERATELY OVER-NORMALIZED. It strips EVERY value the emitter could have interpolated —
 * sprint_id, boundary and its word parts, verdict, ts — then collapses all digit runs. The
 * errors are not symmetric: a false TEMPLATE costs one human read of the messages; a false
 * VARIES closes a three-cycle gap wrongly under an operator-ordered check's authority. A
 * template can only slot what the emitter knew, and the row records what the emitter knew.
 *
 * VARIES DOES NOT SELF-EXECUTE (β ceiling, 2026-08-04): the normalization strips every value
 * the ROW carries, but the row is only a LOWER BOUND on what the emitter knew — an interpolated
 * value the emitter never recorded (a sprint title, a phase index sourced elsewhere) would
 * survive normalization and produce VARIES on template output. Therefore a VARIES verdict is
 * NOT sufficient to record AP-1 closed: a human must actually read the per-row message_head
 * fields and judge substance before closure. VARIES establishes the falsifiable half; a reader
 * supplies the judgment half. A TEMPLATE verdict needs no such gate — it is a finding, and
 * findings are self-executing.
 *
 * Usage: node runtime/vlad-w1/capture-consult-stream.js [--json]
 * Exit:  0 = ran (see verdict in output; a verdict of TEMPLATE is a finding, not a crash)
 *        2 = could not read the stream
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const EVENTS = path.join(ROOT, ".claude", "project", "events", "events.jsonl");
const SPRINT_PREFIX = "S-VLADW1";

const BASELINE = { eventsLines: 10151, consultRowsAllTime: 174, consultRowsW1: 0 };

function readRows() {
  const raw = fs.readFileSync(EVENTS, "utf8");
  const out = [];
  let malformed = 0;
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    if (!line.includes("sprint_full_beta_consult")) continue; // cheap prefilter
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      malformed++; // reported in the payload; a dropped row biases toward INCONCLUSIVE (safe direction)
      continue;
    }
    const d = o && o.data ? o.data : o;
    if (!d || d.kind !== "sprint_full_beta_consult") continue;
    const sid = d.sprint_id || "";
    if (!String(sid).startsWith(SPRINT_PREFIX)) continue;
    out.push({
      sprint_id: sid,
      boundary: d.phase_boundary || "(none)",
      verdict: d.verdict || "(none)",
      message: typeof d.beta_message === "string" ? d.beta_message : "",
      ts: d.ts || o.ts || "",
      via_cli_resume: !!d.via_cli_resume,
    });
  }
  return { rows: out, malformed };
}

/**
 * Normalize out every value the row carries that the emitter could have interpolated —
 * sprint_id, boundary + its word parts, verdict, ts — then collapse digit runs to <N>.
 * Longest token first so a substring replacement can't shred a longer token. Deliberately
 * over-normalized (see header): bias toward TEMPLATE, never toward a false VARIES.
 */
function skeleton(row) {
  let s = String(row.message).toLowerCase();
  const tokens = [];
  if (row.sprint_id) tokens.push(String(row.sprint_id));
  if (row.boundary && row.boundary !== "(none)") {
    tokens.push(String(row.boundary));
    for (const part of String(row.boundary).split(/[^a-z0-9]+/i)) {
      if (part && part.length > 2) tokens.push(part);
    }
  }
  if (row.verdict && row.verdict !== "(none)") tokens.push(String(row.verdict));
  if (row.ts) tokens.push(String(row.ts));
  tokens.sort((a, b) => b.length - a.length);
  for (const t of tokens) {
    const tl = t.toLowerCase();
    if (tl) s = s.split(tl).join("<V>");
  }
  s = s.replace(/[0-9]+/g, "<N>");
  return s.replace(/\s+/g, " ").trim();
}

/**
 * WITHIN-SPRINT is the comparison unit (ε finding 2026-08-04): two different sprints
 * legitimately differ in content, so pooling -01 and -02 can read VARIES on data that is
 * templated per sprint. analyze() groups by sprint_id and judges each group with
 * analyzeGroup(); the overall verdict is the worst case (any TEMPLATE wins), never a
 * cross-sprint pool.
 */
function analyze(rows) {
  if (rows.length === 0) {
    return {
      verdict: "NO_DATA",
      reason:
        "No W1 sprint_full_beta_consult rows yet. The check is ARMED but has nothing to judge — " +
        "this is not a pass. Re-run after a phase boundary fires.",
    };
  }
  const groups = new Map();
  for (const r of rows) {
    if (!groups.has(r.sprint_id)) groups.set(r.sprint_id, []);
    groups.get(r.sprint_id).push(r);
  }
  const per_sprint = {};
  for (const [sid, g] of groups) per_sprint[sid] = analyzeGroup(g);
  const verdicts = Object.values(per_sprint).map((v) => v.verdict);
  let verdict, reason;
  if (verdicts.includes("TEMPLATE")) {
    const which = Object.keys(per_sprint).filter((s) => per_sprint[s].verdict === "TEMPLATE");
    verdict = "TEMPLATE";
    reason = `Template output detected WITHIN sprint(s) ${which.join(", ")} — see per_sprint. Cross-sprint variation was deliberately not counted as evidence.`;
  } else if (verdicts.includes("VARIES")) {
    const which = Object.keys(per_sprint).filter((s) => per_sprint[s].verdict === "VARIES");
    verdict = "VARIES";
    reason = `Within-sprint substance-bearing variation in sprint(s) ${which.join(", ")}; remaining groups inconclusive. Per the header rule, VARIES does not self-execute — a human reads message_heads before any closure.`;
  } else {
    verdict = "INCONCLUSIVE";
    reason = `No sprint group has ≥2 distinct boundaries with judgeable variance (${groups.size} sprint group(s)). See per_sprint.`;
  }
  return { verdict, reason, per_sprint };
}

function analyzeGroup(rows) {
  const distinctBoundaries = new Set(rows.map((r) => r.boundary)).size;
  if (distinctBoundaries < 2) {
    return {
      verdict: "INCONCLUSIVE",
      reason:
        `${rows.length} W1 row(s) but only ${distinctBoundaries} DISTINCT boundary value(s) — re-runs or ` +
        `resumes of one boundary are still one sample of the variance question. Template-vs-real needs ` +
        `at least 2 distinct boundaries. Reporting inconclusive rather than guessing.`,
    };
  }

  const exact = new Set(rows.map((r) => r.message.trim()));
  const skels = new Set(rows.map((r) => skeleton(r)));

  if (exact.size === 1) {
    return {
      verdict: "TEMPLATE",
      reason:
        `All ${rows.length} boundaries emitted the BYTE-IDENTICAL beta_message. The string does not ` +
        `vary with phase content at all.`,
    };
  }
  if (skels.size === 1) {
    return {
      verdict: "TEMPLATE",
      reason:
        `All ${rows.length} messages are identical ONCE EVERY EMITTER-KNOWN VALUE IS REMOVED ` +
        `(sprint_id, boundary, verdict, ts, digit runs) — i.e. one sentence with values slotted in. ` +
        `Distinct strings, but the variation carries no phase CONTENT, which is exactly the failure ` +
        `this check exists to catch.`,
    };
  }
  return {
    verdict: "VARIES",
    reason:
      `${exact.size} distinct messages across ${rows.length} rows, and ${skels.size} skeletons remain ` +
      `distinct after removing EVERY emitter-known value (sprint_id, boundary, verdict, ts, digit runs) ` +
      `— so the variation is not slotted labels. NOTE: this establishes the strings differ in ` +
      `substance-bearing ways; it does NOT by itself prove each was a real consult. Substance is a ` +
      `judgment call for a reader, and this check is deliberately scoped to the falsifiable half.`,
  };
}

function main() {
  const json = process.argv.includes("--json");
  let rows, malformed;
  try {
    ({ rows, malformed } = readRows());
  } catch (e) {
    process.stderr.write(`could not read ${EVENTS}: ${e.message}\n`);
    return 2;
  }
  const result = analyze(rows);
  const payload = {
    check: "AP-1 automated-consult-stream",
    stream: "sprint_full_beta_consult (AUTOMATED runtime emission)",
    scope_note:
      "betaEvents rows 293-298 (beta's reasoned lane) are DELIBERATELY NOT SAMPLED — already ruled real, observer-affected, and sampling them would false-close AP-1.",
    baseline_at_arming: BASELINE,
    w1_rows_found: rows.length,
    malformed_prefilter_lines: malformed,
    verdict: result.verdict,
    reason: result.reason,
    per_sprint: result.per_sprint || null,
    rows: rows.map((r) => ({
      boundary: r.boundary,
      verdict: r.verdict,
      ts: r.ts,
      via_cli_resume: r.via_cli_resume,
      message_bytes: Buffer.byteLength(r.message),
      message_head: r.message.slice(0, 160),
    })),
  };
  process.stdout.write(
    json ? JSON.stringify(payload, null, 2) + "\n" : renderText(payload) + "\n",
  );
  return 0;
}

function renderText(p) {
  const lines = [
    `AP-1 automated-consult-stream check`,
    `  stream:   ${p.stream}`,
    `  W1 rows:  ${p.w1_rows_found} (baseline at arming: ${p.baseline_at_arming.consultRowsW1})`,
    `  VERDICT:  ${p.verdict}`,
    `  reason:   ${p.reason}`,
    `  scope:    ${p.scope_note}`,
  ];
  for (const r of p.rows) {
    lines.push(
      `   - ${r.boundary} [${r.verdict}] ${r.message_bytes}B ${r.via_cli_resume ? "(cli-resume)" : ""}`,
    );
    lines.push(`     ${r.message_head}${r.message_bytes > 160 ? "…" : ""}`);
  }
  return lines.join("\n");
}

if (require.main === module) process.exit(main());
module.exports = { readRows, analyze, analyzeGroup, skeleton, BASELINE };
