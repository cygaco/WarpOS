#!/usr/bin/env node
"use strict";

/**
 * design-quality-gate (S2.3) — the launcher that turns the **named cross-domain
 * design authority** (`org-map.json#gauntlets.design-quality`,
 * `is_named_design_authority: true`) into an actual two-lane approver GATE. A
 * component library is not an owner — this gauntlet is the approver, and in oneshot
 * (no α/β) its verdict must REJECT, not lint.
 *
 * Builds to runtime/notes/wave2-s2.3-design-quality-wiring.md (the two-lane design).
 * Builder-agnostic by construction: it keys on the rendered result + the static scan
 * of src/components|src/app, never on who authored the UI (frontend-builder /
 * web-conversion-designer / a growth skill).
 *
 * Two lanes — BOTH must pass for a design unit to clear the gate:
 *   - LANE 1 STATIC (deterministic, already exists, fail-closed):
 *     `scripts/checks/design-system.js --strict` → exit 2 on any violation (hex
 *     literals, raw Tailwind theme colors, raw <button|input|select|textarea>
 *     outside ui/, untyped props, missing design-system docs). A non-zero exit (or a
 *     runner error) is a REJECT — the regex-catchable half.
 *   - LANE 2 JUDGMENT (the design-quality dispatch, `.claude/agents/product/
 *     quality/design-quality.md`): a multimodal browser review producing a
 *     DesignQualityResult JSON (`verdict: PASS|FAIL`, six axes, `requiresHuman`,
 *     `recommendation`). `verdict:"FAIL"` (any critical/high axis finding) is a REJECT
 *     — what only a vision model catches (buried CTA, mobile overflow, no accessible
 *     name).
 *
 * REJECTS (exit 1), never lints:
 *   - STATIC-FAIL  — lane 1 (`design-system.js --strict`) exited non-zero.
 *   - JUDGMENT-FAIL — lane 2 DesignQualityResult `verdict:"FAIL"`.
 *
 * EMIT (arbitration, fail-closed park) — when it CANNOT confidently approve:
 *   - JUDGMENT-INVESTIGATE — lane 2 returned `recommendation:"INVESTIGATE"` /
 *     `requiresHuman:true` (the spec's oneshot stand-in: a missing/contradictory
 *     design_brief => the judge did not guess a PASS). The launcher mirrors that into
 *     an arbitration park (never a guessed gate-pass).
 *   - MISSING-JUDGMENT — lane 1 ran but NO lane-2 result is available (the judgment
 *     lane did not run / produced no parseable verdict). The launcher will NOT clear
 *     the gate on the static half alone — fail-closed park (the judgment half is the
 *     reason the gauntlet exists; a regex-only pass is the "valid but generic" hole).
 *   - DESIGN-BRIEF-CONTRADICTION — a design_brief was supplied AND the judgment result
 *     reports its design_brief_ref disagrees with it (the static/spec contradiction the
 *     S2.3 note calls out). Park for α/β.
 *   owner = "design_quality" (cross-domain), artifactPrecedence = design_brief rank (30).
 *
 * Internal error => exit 2 (fail-closed). Pure core = evaluate({ staticLane,
 * judgment, designBrief }) with injected seams so the bite-test proves each class
 * without spawning a subprocess or a browser. Mirrors role-parity-scan.js.
 *
 *   node scripts/checks/design-quality-gate.js [--judgment <result.json>] \
 *        [--design-brief <brief.json>] [--lane2 block|advisory] \
 *        [--mode adhoc|oneshot] [--unit <name>] [--json]
 *   (lane 1 runs design-system.js --strict as a child process; lane 2 is read from
 *    --judgment, the DesignQualityResult the orchestrator captured from the dispatch.
 *    --mode/--unit are telemetry only: every run emits a `manager_consult` event so
 *    scan:sprint-manager-consult can prove the design authority was consulted.)
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "design-quality-gate";
const OWNER = "design_quality";
const DESIGN_BRIEF_PRECEDENCE = 30; // design_brief contract rank (β bundle ordering)

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
}

/**
 * Pure assertion core.
 * @param {object} staticLane  lane-1 outcome: { ran:bool, exitCode:number, ok:bool, summary?:string }
 * @param {object|null} judgment   the DesignQualityResult JSON from the lane-2 dispatch (or null)
 * @param {object|null} designBrief the supplied design_brief contract (or null)
 * @returns {{ result:"PASS"|"REJECT"|"ARBITRATION", errors:string[], emits:object[] }}
 */
function evaluate({ staticLane, judgment, designBrief, lane2Mode = "block" }) {
  const errors = [];
  const emits = [];
  const advisories = []; // lane-2 findings downgraded to non-blocking under lane2Mode="advisory" (the W1 pre-mvp ramp: advisory → baseline → block, DP A2)
  const advisory = lane2Mode === "advisory";

  // LANE 1 — static, fail-closed. ALWAYS blocking regardless of lane2Mode (the
  // deterministic, regex-catchable half; DP A2: "Lane 1 blocks immediately").
  if (!staticLane || staticLane.ran !== true) {
    // The static lane could not be run => fail-closed (a gate that can't run its
    // deterministic half must not read green).
    return { result: "ARBITRATION", errors, emits: [{
      reason: "static-lane-unrunnable",
      decision: "park: lane 1 (design-system --strict) could not run",
      rationale: "the static design-system lane could not be executed; a two-lane gate cannot clear on a half it never ran (fail-closed)",
      confidence: 0,
      precedenceBasis: "lane 1 unrunnable",
    }], advisories };
  }
  if (staticLane.ok !== true || staticLane.exitCode !== 0) {
    errors.push(`static-fail: lane 1 (design-system.js --strict) exited ${staticLane.exitCode} — ${staticLane.summary || "design-system violations"} (the regex-catchable half rejects)`);
  }

  // LANE 2 — judgment. Under lane2Mode="advisory" (the W1 pre-mvp ramp) lane-2
  // findings are RECORDED as non-blocking advisories — only LANE 1 blocks until the
  // baseline-date flip back to "block" (DP A2: Lane 1 blocks, Lane 2 ramps). The
  // default is "block" so existing callers/tests are unchanged.
  const pushJ = advisory ? (e) => advisories.push(e) : (e) => emits.push(e);
  const pushJErr = advisory
    ? (m) => advisories.push({ reason: "judgment-fail", decision: m })
    : (m) => errors.push(m);
  if (!judgment || typeof judgment !== "object") {
    // The judgment lane did not run / produced no parseable result. The gate will NOT
    // clear on the static half alone (the judgment half is why the gauntlet exists).
    pushJ({
      reason: "missing-judgment",
      decision: "park: no design-quality judgment result available",
      rationale: "lane 1 ran but no parseable lane-2 DesignQualityResult was supplied; the launcher will not clear the design gate on the static half alone — a regex-only pass is the 'valid but generic' hole the judgment lane exists to close (dispatch design-quality, then re-run)",
      confidence: 0.1,
      precedenceBasis: "two-lane gate: judgment half required",
    });
  } else {
    const verdict = String(judgment.verdict || "").toUpperCase();
    const rec = String(judgment.recommendation || "").toUpperCase();
    const requiresHuman = judgment.requiresHuman === true;

    // JUDGMENT-INVESTIGATE — the spec's oneshot stand-in for escalation: do NOT guess a PASS.
    if (rec === "INVESTIGATE" || requiresHuman) {
      pushJ({
        reason: "judgment-investigate",
        decision: `park: design-quality judgment is INVESTIGATE/requiresHuman for unit ${judgment.unit || "(?)"}`,
        rationale: `the design-quality judge returned recommendation=${rec || "(none)"} requiresHuman=${requiresHuman} (its oneshot stand-in for escalation — a missing/contradictory design_brief, not a guessed PASS): "${String(judgment.rationale || "").slice(0, 120)}"`,
        confidence: typeof judgment.confidence === "number" ? judgment.confidence : 0.3,
        precedenceBasis: "design-quality judge: oneshot arbitration-needed",
      });
    } else if (verdict === "FAIL") {
      // JUDGMENT-FAIL — a critical/high axis finding is a gate failure, not a suggestion.
      const failedAxes = judgment.axes && typeof judgment.axes === "object"
        ? Object.entries(judgment.axes).filter(([, v]) => v && v.pass === false).map(([k]) => k)
        : [];
      pushJErr(`judgment-fail: design-quality verdict=FAIL for unit ${judgment.unit || "(?)"} — failing axes [${failedAxes.join(", ") || "unspecified"}] (critical/high finding is a gate failure)`);
    } else if (verdict !== "PASS" && verdict !== "SKIP") {
      // A judgment result with neither PASS nor FAIL nor an investigate signal is malformed
      // => fail-closed park (never read an unrecognized verdict as green).
      pushJ({
        reason: "judgment-malformed",
        decision: `park: design-quality judgment verdict '${judgment.verdict}' is not recognized`,
        rationale: `the lane-2 result carried verdict='${judgment.verdict}' which is neither PASS, FAIL, SKIP, nor an INVESTIGATE/requiresHuman signal; an unrecognized verdict must not read green (fail-closed)`,
        confidence: 0,
        precedenceBasis: "malformed judgment result",
      });
    }

    // DESIGN-BRIEF-CONTRADICTION — a brief was supplied but the judgment judged a different one.
    if (designBrief && designBrief.id && judgment.design_brief_ref &&
        judgment.design_brief_ref !== designBrief.id &&
        judgment.design_brief_ref !== "null") {
      pushJ({
        reason: "design-brief-contradiction",
        decision: `park: judged design_brief '${judgment.design_brief_ref}' != supplied design_brief '${designBrief.id}'`,
        rationale: `the design-quality judge reviewed against design_brief '${judgment.design_brief_ref}' but the unit's supplied design_brief is '${designBrief.id}'; the launcher cannot reconcile which design intent governs and parks for arbitration (S2.3 contradiction case)`,
        confidence: 0.2,
        precedenceBasis: "design_brief contradiction across lane-2 vs supplied",
      });
    }
  }

  if (errors.length > 0) return { result: "REJECT", errors, emits, advisories };
  if (emits.length > 0) return { result: "ARBITRATION", errors, emits, advisories };
  return { result: "PASS", errors, emits, advisories };
}

/** Run lane 1 (design-system.js --strict) as a child process. Returns the staticLane shape. */
function runStaticLane() {
  const script = path.join(ROOT, "scripts/checks/design-system.js");
  if (!fs.existsSync(script)) {
    return { ran: false, exitCode: null, ok: false, summary: "design-system.js not found" };
  }
  const r = spawnSync(process.execPath, [script, "--strict"], { encoding: "utf8" });
  if (r.error) {
    return { ran: false, exitCode: null, ok: false, summary: r.error.message };
  }
  const exitCode = typeof r.status === "number" ? r.status : 1;
  return {
    ran: true,
    exitCode,
    ok: exitCode === 0,
    summary: (r.stdout || "").trim().split("\n")[0] || (r.stderr || "").trim().split("\n")[0],
  };
}

/**
 * Map an evaluate() result + its emits to a single coarse verdict label for
 * manager_consult telemetry. APPROVE = both lanes cleared; REJECT = a binding
 * lane failure; MISSING = the judgment lane never ran; INVESTIGATE = parked for
 * human/α-β; otherwise the result class itself.
 */
function consultVerdict(out) {
  if (out.result === "PASS") return "APPROVE";
  if (out.result === "REJECT") return "REJECT";
  // ARBITRATION — distinguish the missing-judgment park from an investigate park.
  const reasons = (out.emits || []).map((e) => e.reason);
  if (reasons.includes("missing-judgment")) return "MISSING";
  if (reasons.includes("judgment-investigate")) return "INVESTIGATE";
  return "ARBITRATION";
}

function main(argv) {
  const json = argv.includes("--json");
  let judgmentPath = null;
  let designBriefPath = null;
  let lane2Mode = "block";
  let mode = "unknown"; // --mode adhoc|oneshot (telemetry only); default unknown
  let unit = null; // --unit <name> (telemetry only); default null
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--judgment") judgmentPath = path.resolve(argv[++i]);
    else if (argv[i] === "--design-brief") designBriefPath = path.resolve(argv[++i]);
    else if (argv[i] === "--lane2") lane2Mode = String(argv[++i] || "block").toLowerCase();
    else if (argv[i] === "--mode") mode = String(argv[++i] || "unknown").toLowerCase();
    else if (argv[i] === "--unit") unit = argv[++i] || null;
  }

  let out, emitted;
  try {
    const { emit } = require(path.join(ROOT, "scripts/arbitration/emit.js"));
    const staticLane = runStaticLane();
    const judgment = judgmentPath ? readJSON(judgmentPath) : null;
    const designBrief = designBriefPath ? readJSON(designBriefPath) : null;
    out = evaluate({ staticLane, judgment, designBrief, lane2Mode });

    // manager_consult telemetry — emit a typed event on EVERY run so the
    // coverage enforcer (scan:sprint-manager-consult) can prove the design
    // authority was actually consulted on a UI-touching unit. Best-effort:
    // logging never blocks the gate verdict (mirrors logger.js fail-open).
    try {
      const { log } = require(path.join(ROOT, "scripts/hooks/lib/logger.js"));
      const consultUnit = unit || (judgment && judgment.unit) || (designBrief && designBrief.id) || null;
      log("manager_consult", {
        manager: "design-quality",
        mode,
        unit: consultUnit,
        verdict: consultVerdict(out),
        lane2Mode,
        ts: new Date().toISOString(),
      });
    } catch {
      /* telemetry is best-effort — never crash the gate */
    }

    emitted = [];
    const emitUnit = (judgment && judgment.unit) || (designBrief && designBrief.id) || "design-unit";
    for (const e of out.emits) {
      emitted.push(
        emit({
          unit: emitUnit,
          owner: OWNER,
          decision: e.decision,
          rationale: e.rationale,
          confidence: e.confidence,
          precedenceBasis: e.precedenceBasis,
          // FAIL-CLOSED: omit arbitrationNeeded ⇒ true (β Q2).
          artifactPrecedence: DESIGN_BRIEF_PRECEDENCE,
        }),
      );
    }
  } catch (e) {
    process.stderr.write(`${NAME} error: ${e.message}\n`);
    return 2; // fail-closed
  }

  const { result, errors, emits, advisories } = out;

  if (advisories && advisories.length) {
    process.stderr.write(
      `ADVISORY [${NAME}] lane-2 (judgment) is ADVISORY (--lane2 advisory ramp — does NOT block ship; lane 1 still blocks) (${advisories.length}):\n${advisories.map((a) => "  ~ " + (a.decision || a.reason)).join("\n")}\n`,
    );
  }

  if (json) {
    process.stdout.write(
      JSON.stringify(
        { ok: result === "PASS", check: NAME, owner: OWNER, result, lane2Mode, errors, advisories,
          arbitration: emitted.map((r) => ({ id: r.id, unit: r.unit, decision: r.decision })) },
        null, 2,
      ) + "\n",
    );
    return result === "PASS" ? 0 : 1;
  }

  if (result === "REJECT") {
    process.stderr.write(
      `REJECT [${NAME}] design unit failed the two-lane design-quality gate (${errors.length}):\n${errors.map((e) => "  - " + e).join("\n")}\n`,
    );
    return 1;
  }
  if (result === "ARBITRATION") {
    process.stderr.write(
      `ARBITRATION [${NAME}] design gate cannot clear (${emits.length}) — NOT approved:\n${emits.map((e) => "  ▸ " + e.decision).join("\n")}\n  (emitted to runtime/arbitration; the resolver gate will block ship-ready)\n`,
    );
    return 1;
  }
  process.stdout.write(`OK   [${NAME}] design unit clears BOTH lanes (static --strict + judgment PASS)\n`);
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, runStaticLane, NAME, OWNER };
