#!/usr/bin/env node

/**
 * scripts/sprint/design.js — /sprint:design scaffolder.
 *
 * Renders the requirements bundle (PRD, stories, COPY, INPUTS, TRACE,
 * AC, QA, redteam, release plan) for a sprint under
 * paths.sprintRequirements/<sprint-id>/ and updates current-sprint.yaml
 * to reference them.
 *
 * Tickets are NOT minted here — that's a separate call to
 * scripts/sprint/ticket.js#create. /sprint:design's skill body invokes
 * both: first this scaffolder, then ticket creation per granular story.
 *
 * Usage:
 *   node scripts/sprint/design.js [--documentation-scale xs|s|m|l|xl]
 *
 * Reads:
 *   paths.sprintCurrent
 *   paths.sprintPlanContracts/<current.plan_contract basename>.yaml
 *
 * Writes:
 *   paths.sprintRequirements/<sprint-id>/{prd,high-level-stories,
 *     granular-stories,copy,inputs,trace,acceptance-criteria,
 *     qa-plan,redteam-plan,release-plan}.md
 *   Updates paths.sprintCurrent.requirements.*
 */

"use strict";

const fs = require("fs");
const path = require("path");
const SPRINT = require("./paths");
const {
  ensureDir,
  readText,
  writeText,
  render,
  readYamlMaybe,
  writeYaml,
  nowIso,
} = require("./fs");

function parseArgs(argv) {
  const out = { docScale: "m", force: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--documentation-scale") out.docScale = argv[++i] || "m";
    else if (argv[i] === "--force") out.force = true;
  }
  return out;
}

function loadPlanContract(current) {
  if (!current.plan_contract) return null;
  const resolved = path.resolve(SPRINT.PROJECT, current.plan_contract);
  return readYamlMaybe(resolved);
}

function buildGranularStoriesBody(candidates, outcome) {
  if (!candidates || candidates.length === 0) {
    return `## S-1 — (fill from plan contract)\n\n**As** the user\n**I want** (fill)\n**So that** ${outcome}\n\nAcceptance criteria:\n- AC-1: (set by design step)\n\nLinked: \`H-1\`, \`R-1\`.\nCOPY: see \`copy.md\`.\nINPUTS: see \`inputs.md\`.\nTRACE: see \`trace.md\`.\n`;
  }
  return candidates
    .map((candidate, idx) => {
      const n = idx + 1;
      const title = typeof candidate === "string" ? candidate : String(candidate);
      return [
        `## S-${n} — ${title}`,
        ``,
        `**As** the user`,
        `**I want** ${title}`,
        `**So that** ${outcome}`,
        ``,
        `Acceptance criteria:`,
        `- AC-1: (set by design step)`,
        ``,
        `Linked: \`H-1\`, \`R-${n}\`.`,
        `COPY: see \`copy.md\`.`,
        `INPUTS: see \`inputs.md\`.`,
        `TRACE: see \`trace.md\`.`,
        ``,
      ].join("\n");
    })
    .join("\n");
}

function scaffold(args) {
  const current = readYamlMaybe(SPRINT.current);
  if (!current) {
    process.stderr.write(
      "no current-sprint.yaml — run scripts/sprint/init.js first\n",
    );
    return 1;
  }
  const plan = loadPlanContract(current);
  if (!plan) {
    process.stderr.write(
      "current-sprint has no plan_contract — run /sprint:plan first\n",
    );
    return 1;
  }
  const outDir = path.join(SPRINT.requirements, current.id);
  ensureDir(outDir);

  // WG-10: fail loudly when the requirements templates are absent (a fresh or
  // partial install whose framework/templates/sprint/requirements/ was never
  // shipped). Previously the per-template loop below just warned and continued,
  // writing NOTHING while the phase still reported "scaffolded" — a silent
  // no-op that left the design phase hollow (the headline /sprint:full
  // fresh-install failure). Refuse with an actionable message instead.
  const tmplRoot = path.join(SPRINT.templates, "requirements");
  if (!fs.existsSync(tmplRoot)) {
    process.stderr.write(
      `sprint requirements templates missing at ${tmplRoot} — the design ` +
        `phase cannot scaffold a requirements bundle (no PRD / acceptance ` +
        `criteria / stories). Run /warp:update to restore ` +
        `framework/templates/sprint/requirements/, then re-run /sprint:design.\n`,
    );
    return 1;
  }

  const data = {
    sprint_id: current.id,
    sprint_title: current.title,
    plan_contract_id: plan.id,
    plan_contract_path: current.plan_contract,
    prd_path: path.join(outDir, "prd.md"),
    high_level_stories_path: path.join(outDir, "high-level-stories.md"),
    granular_stories_path: path.join(outDir, "granular-stories.md"),
    copy_path: path.join(outDir, "copy.md"),
    inputs_path: path.join(outDir, "inputs.md"),
    trace_path: path.join(outDir, "trace.md"),
    acceptance_criteria_path: path.join(outDir, "acceptance-criteria.md"),
    qa_plan_path: path.join(outDir, "qa-plan.md"),
    redteam_plan_path: path.join(outDir, "redteam-plan.md"),
    release_plan_path: path.join(outDir, "release-plan.md"),
    documentation_scale: args.docScale,
    user_or_business_outcome: plan.user_or_business_outcome,
    source_request_verbatim: plan.source_request_verbatim,
    interpreted_intent: plan.interpreted_intent,
    current_behavior_notes: (plan.current_behavior || {}).notes || "",
    desired_behavior: plan.desired_behavior,
    surface_1: (plan.affected_surfaces[0] || {}).surface || "—",
    surface_1_evidence: (plan.affected_surfaces[0] || {}).evidence_level || "—",
    requirement_1: plan.requirement_areas[0] || "—",
    requirement_2: plan.requirement_areas[1] || "—",
    requirement_3: plan.requirement_areas[2] || "—",
    non_goal_1: plan.non_goals[0] || "—",
    hl_story_1_title: plan.high_level_story_candidates[0] || "—",
    hl_story_1_persona: "the user",
    hl_story_1_want: plan.high_level_story_candidates[0] || "—",
    hl_story_1_outcome: plan.user_or_business_outcome || "—",
    hl_story_2_title: plan.high_level_story_candidates[1] || "—",
    hl_story_2_persona: "the user",
    hl_story_2_want: plan.high_level_story_candidates[1] || "—",
    hl_story_2_outcome: plan.user_or_business_outcome || "—",
    granular_stories_body: buildGranularStoriesBody(
      plan.granular_story_candidates || [],
      plan.user_or_business_outcome || "—",
    ),
  };

  const targets = [
    ["prd.md.tmpl", "prd.md"],
    ["high-level-stories.md.tmpl", "high-level-stories.md"],
    ["granular-stories.md.tmpl", "granular-stories.md"],
    ["copy.md.tmpl", "copy.md"],
    ["inputs.md.tmpl", "inputs.md"],
    ["trace.md.tmpl", "trace.md"],
    ["acceptance-criteria.md.tmpl", "acceptance-criteria.md"],
    ["qa-plan.md.tmpl", "qa-plan.md"],
    ["redteam-plan.md.tmpl", "redteam-plan.md"],
    ["release-plan.md.tmpl", "release-plan.md"],
  ];
  // documentation scaling — for xs/s, skip redteam and release-plan.
  const skip = new Set();
  if (args.docScale === "xs" || args.docScale === "s") {
    skip.add("redteam-plan.md");
    skip.add("release-plan.md");
  }
  if (args.docScale === "xs") {
    skip.add("copy.md");
    skip.add("inputs.md");
    skip.add("trace.md");
  }

  let wrote = 0,
    skipped = 0,
    missing = 0,
    expected = 0;
  for (const [tmplName, outName] of targets) {
    if (skip.has(outName)) {
      process.stdout.write(`  skip-by-scale ${outName}\n`);
      continue;
    }
    expected++;
    const tmpl = readText(
      path.join(SPRINT.templates, "requirements", tmplName),
    );
    if (!tmpl) {
      process.stderr.write(`missing template: ${tmplName}\n`);
      missing++;
      continue;
    }
    const rendered = render(tmpl, data);
    const res = writeText(path.join(outDir, outName), rendered, {
      force: args.force,
    });
    if (res.wrote) wrote++;
    else skipped++;
    process.stdout.write(`  ${res.wrote ? "wrote" : "skip "} ${outName}\n`);
  }

  // WG-10 (partial-install guard): if every in-scope template was missing —
  // nothing written, nothing already on disk — the bundle is hollow. Fail
  // loudly rather than reporting a successful scaffold of zero documents.
  if (expected > 0 && missing === expected && wrote === 0 && skipped === 0) {
    process.stderr.write(
      `design phase wrote 0 of ${expected} requirement documents — all ` +
        `templates missing under ${path.join(SPRINT.templates, "requirements")}. ` +
        `Run /warp:update to restore the sprint templates, then re-run.\n`,
    );
    return 1;
  }

  // Update current-sprint.requirements.
  current.requirements.prd = path.join(
    SPRINT.requirements,
    current.id,
    "prd.md",
  );
  current.requirements.high_level_stories = path.join(
    SPRINT.requirements,
    current.id,
    "high-level-stories.md",
  );
  current.requirements.granular_stories = path.join(
    SPRINT.requirements,
    current.id,
    "granular-stories.md",
  );
  current.requirements.copy = skip.has("copy.md")
    ? null
    : path.join(SPRINT.requirements, current.id, "copy.md");
  current.requirements.inputs = skip.has("inputs.md")
    ? null
    : path.join(SPRINT.requirements, current.id, "inputs.md");
  current.requirements.trace = skip.has("trace.md")
    ? null
    : path.join(SPRINT.requirements, current.id, "trace.md");
  current.requirements.acceptance_criteria = path.join(
    SPRINT.requirements,
    current.id,
    "acceptance-criteria.md",
  );
  current.requirements.qa_plan = path.join(
    SPRINT.requirements,
    current.id,
    "qa-plan.md",
  );
  current.requirements.redteam_plan = skip.has("redteam-plan.md")
    ? null
    : path.join(SPRINT.requirements, current.id, "redteam-plan.md");
  current.requirements.release_plan = skip.has("release-plan.md")
    ? null
    : path.join(SPRINT.requirements, current.id, "release-plan.md");
  current.current_phase = "design";
  current.status = "designing";
  current.updated_at = nowIso();
  current.crash_recovery.resume_command = "/sprint:design";
  current.crash_recovery.resume_summary = `Sprint ${current.id} design scaffolded (scale=${args.docScale}). Next: mint tickets from granular-stories, then run /sprint:execute.`;
  writeYaml(SPRINT.current, current);

  process.stdout.write(
    `design: ${wrote} written, ${skipped} skipped at scale=${args.docScale}.\n`,
  );
  // SP-20260514-002 R-6: record routing trace for the design phase.
  try {
    const { recordTrace } = require("./routing");
    const result = recordTrace({
      phase: "design",
      artifact_id: `design:${current.id}`,
      artifact_path: path.join(SPRINT.requirements, current.id),
      sprint: current.id,
      model: process.env.WARPOS_RECORDING_MODEL || "claude:claude-opus-4-8",
      recorded_by: "/sprint:design",
      allow_single_vendor: true,
      auto_override: true,
      notes: `design pack at scale=${args.docScale}`,
    });
    if (!result.ok) {
      process.stderr.write(`routing-trace: ${result.message}\n`);
    }
  } catch (err) {
    process.stderr.write(`routing-trace: skipped (${err.message})\n`);
  }
  // SP-20260518-007 R-5: Sprint Goal Verification fixture gate. Fully gated
  // on plan.goal_verification presence (backward-compat for pre-Sprint-A
  // Plan Contracts) — when absent, gate is a no-op.
  const gateResult = runFixtureGate(current, plan, outDir);
  if (!gateResult.ok) {
    process.stderr.write(`${gateResult.message}\n`);
    return 1;
  }
  return 0;
}

// SP-20260518-007 R-5 — design-time fixture gate.
// Returns { ok: boolean, message?: string }.
function runFixtureGate(current, plan, outDir) {
  const gv = plan && plan.goal_verification;
  if (!gv) {
    // Fully gated on goal_verification presence — backward-compat for
    // pre-Sprint-A Plan Contracts. AC-2.2.1.
    return { ok: true };
  }
  if (gv.reproduction === "not_applicable") {
    const j =
      typeof gv.justification === "string" ? gv.justification.trim() : "";
    if (!j) {
      return {
        ok: false,
        message:
          `sprint:design refused — sprint ${current.id} has ` +
          `goal_verification.reproduction = not_applicable but justification ` +
          `is empty (empty/whitespace = same as missing, SP-20260518-007 Beta directive).`,
      };
    }
    // AC-2.2.3 — honored when justification is non-empty.
    return { ok: true };
  }
  if (gv.reproduction !== "executable") {
    return {
      ok: false,
      message:
        `sprint:design refused — sprint ${current.id} has ` +
        `goal_verification.reproduction = ${gv.reproduction} which is not a recognized enum value.`,
    };
  }
  // reproduction=executable: scan acceptance-criteria.md and require every
  // AC line to be followed by a real `verified_by:` line.
  const acPath = path.join(outDir, "acceptance-criteria.md");
  if (!fs.existsSync(acPath)) {
    return {
      ok: false,
      message: `sprint:design refused — sprint ${current.id} acceptance-criteria.md not found at ${acPath}.`,
    };
  }
  const ac = fs.readFileSync(acPath, "utf8");
  const lines = ac.split(/\r?\n/);
  const acRegex = /\bAC-\d+(?:\.\d+)+\b/;
  const placeholderRegex = /\{\{|<test-file>|<test-name>/;
  const missing = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(acRegex);
    if (!m) continue;
    // Look at the next few non-empty lines for a verified_by:
    let foundLink = false;
    let foundPlaceholder = false;
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const cand = lines[j];
      if (/^\s*$/.test(cand)) continue;
      if (acRegex.test(cand)) break; // next AC starts; no link found
      if (/verified_by\s*:/i.test(cand)) {
        foundLink = true;
        if (placeholderRegex.test(cand)) foundPlaceholder = true;
        break;
      }
    }
    if (!foundLink || foundPlaceholder) {
      missing.push(
        `${m[0]} (line ${i + 1}${foundPlaceholder ? "; placeholder verified_by" : ""})`,
      );
    }
  }
  if (missing.length) {
    return {
      ok: false,
      message:
        `sprint:design refused — sprint ${current.id} has ` +
        `goal_verification.reproduction = executable but the following ACs ` +
        `lack a real verified_by: linkage:\n  - ` +
        missing.join("\n  - ") +
        `\nAdd verified_by: <test-file>::<test-name> (or verified_by: ` +
        `not_applicable — <justification>) to each AC, then re-run /sprint:design. ` +
        `No state was changed by this refusal.`,
    };
  }
  return { ok: true };
}

function main() {
  const sa = SPRINT.parseSprintArg(process.argv);
  if (sa.error) return 1;
  const args = parseArgs(process.argv);
  return scaffold(args);
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { main, scaffold, buildGranularStoriesBody };
