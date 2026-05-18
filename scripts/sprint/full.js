#!/usr/bin/env node

/**
 * scripts/sprint/full.js — /sprint:full orchestrator.
 *
 * Single-invocation execution of the full sprint pipeline:
 *   plan → design → execute → release-prep → retro
 *
 * Composition over duplication: shells out to existing helpers
 * (plan.js, design.js, ticket.js, external-service.js, execute.js,
 * release.js, retrospective.js, checkpoint.js, routing.js).
 *
 * Bounded autonomy via preset bundle at paths.sprintFullAutonomy.
 * Hard-ceiling enum (HARD_CEILINGS below) is authoritative and
 * cannot be overridden by any preset.
 *
 * Usage:
 *   node scripts/sprint/full.js "<request>" \
 *     [--autonomy conservative|moderate|aggressive] \
 *     [--scope minimal_safe|recommended|expanded] \
 *     [--documentation-scale auto|xs|s|m|l|xl] \
 *     [--mode solo|adhoc] \
 *     [--sprint <SP-id>] \
 *     [--resume] \
 *     [--allow-main] \
 *     [--cost-acknowledged]
 *
 * Exit codes:
 *   0  done (all 5 phases completed)
 *   1  halt (a stop condition fired; halt report written)
 *   2  bad usage (CLI parse error, missing preset config, etc.)
 *
 * See .claude/commands/sprint/full.md for the full skill body and
 * _docs/sprint/AUTONOMY.md for plain-English preset documentation.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync, execSync } = require("child_process");

const SPRINT = require("./paths");
const {
  readYamlMaybe,
  writeYaml,
  ensureDir,
  nowIso,
  writeText,
} = require("./fs");

const REPO_ROOT = SPRINT.PROJECT;
const PATHS = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, ".claude", "paths.json"), "utf8"),
);

// ── Hardcoded contract — authoritative regardless of preset ──────────

const HARD_CEILINGS = Object.freeze([
  "push_to_remote",
  "paid_service_signup",
  "production_deploy",
  "destructive_migration",
  "secret_to_remote",
]);

const FORBIDDEN_PRE_AUTH = Object.freeze([
  "production_release_approval",
  "paid_service_approval",
]);

const PHASES = Object.freeze([
  "plan",
  "design",
  "execute",
  "release-prep",
  "retro",
]);

// Coarse cost-estimate per phase (USD). Calibrate from real telemetry later.
const PHASE_TYPICAL_SPEND_USD = Object.freeze({
  plan: 0.75,
  design: 2.0,
  execute: 1.5, // per ticket, multiplied by ticket count
  "release-prep": 0.5,
  retro: 0.5,
});

// ── CLI parsing ─────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = {
    request: null,
    autonomy: "moderate",
    scope: "recommended",
    documentationScale: "auto",
    mode: null,
    sprint: null,
    resume: false,
    allowMain: false,
    costAcknowledged: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--autonomy") out.autonomy = argv[++i];
    else if (a === "--scope") out.scope = argv[++i];
    else if (a === "--documentation-scale") out.documentationScale = argv[++i];
    else if (a === "--mode") out.mode = argv[++i];
    else if (a === "--sprint") out.sprint = argv[++i];
    else if (a === "--resume") out.resume = true;
    else if (a === "--allow-main") out.allowMain = true;
    else if (a === "--cost-acknowledged") out.costAcknowledged = true;
    else if (!a.startsWith("--") && out.request === null) out.request = a;
  }
  return out;
}

function printHelp() {
  process.stdout.write(`
/sprint:full — autonomous sprint orchestrator

Usage:
  node scripts/sprint/full.js "<request>" [flags]

Flags:
  --autonomy <preset>           conservative | moderate (default) | aggressive
  --scope <variant>             minimal_safe | recommended (default) | expanded
  --documentation-scale <s>     auto (default) | xs | s | m | l | xl
  --mode <m>                    solo | adhoc (default: current session mode)
  --sprint <SP-id>              target a specific sprint (default: new sprint)
  --resume                      resume an in-progress run; requires --sprint
  --allow-main                  override branch-protection (requires aggressive)
  --cost-acknowledged           raise cost threshold 2x for this run only
  --help, -h                    show this message

Hard ceilings (never bypassable by any preset):
  ${HARD_CEILINGS.join(", ")}

See _docs/sprint/AUTONOMY.md for preset details.
`);
}

// ── Logger (uses scripts/hooks/lib/logger when available) ─────────────

function emit(kind, data) {
  try {
    const { log } = require("../hooks/lib/logger");
    log("audit", { kind, ...data }, { actor: "alpha", source: "/sprint:full" });
  } catch {
    // Fail-open: events are nice-to-have, not load-bearing.
  }
}

// ── Preset loading + ceiling enforcement ──────────────────────────────

function loadPreset(name) {
  const cfgPath = path.join(REPO_ROOT, PATHS.sprintFullAutonomy);
  if (!fs.existsSync(cfgPath)) {
    return {
      ok: false,
      error: `autonomy config missing at ${cfgPath}. /sprint:full cannot run without a preset bundle.`,
    };
  }
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  } catch (err) {
    return { ok: false, error: `autonomy config parse error: ${err.message}` };
  }
  if (!cfg.presets || !cfg.presets[name]) {
    const available = Object.keys(cfg.presets || {}).join(", ") || "(none)";
    return {
      ok: false,
      error: `unknown preset '${name}'. Valid: ${available}.`,
    };
  }
  const preset = cfg.presets[name];

  // Hard-ceiling contract — refuse to load any preset that includes
  // a forbidden pre-auth level. This protects against operator-edited
  // configs that try to lift ceilings.
  for (const level of preset.pre_authorized_approval_levels || []) {
    if (FORBIDDEN_PRE_AUTH.includes(level)) {
      return {
        ok: false,
        error: `preset '${name}' attempts to pre-authorize forbidden level '${level}'. HARD CEILING. Fix the preset config.`,
      };
    }
  }
  for (const target of preset.release_approval_targets || []) {
    if (target === "production") {
      return {
        ok: false,
        error: `preset '${name}' attempts to pre-authorize production release. HARD CEILING. Fix the preset config.`,
      };
    }
  }
  // hard_ceilings declared in the config must match the hardcoded enum.
  const declared = (cfg.hard_ceilings || []).slice().sort();
  const expected = HARD_CEILINGS.slice().sort();
  const match =
    declared.length === expected.length &&
    declared.every((v, i) => v === expected[i]);
  if (!match) {
    return {
      ok: false,
      error: `autonomy config hard_ceilings[] drift from hardcoded enum. Declared=${JSON.stringify(declared)} expected=${JSON.stringify(expected)}.`,
    };
  }
  return { ok: true, preset };
}

// ── Branch protection ─────────────────────────────────────────────────

function currentBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

function checkBranchProtection(args, preset, sprintId) {
  const branch = currentBranch();
  if (!branch) return { ok: true }; // no git repo? skip
  const onMain = branch === "main" || branch === "master";
  if (!onMain) return { ok: true };
  const allowMainEffective =
    args.allowMain && preset.branch_protection_allow_main === true;
  if (allowMainEffective) {
    emit("sprint_full_branch_protection_override", {
      sprint_id: sprintId,
      current_branch: branch,
      preset: preset.preset_name,
    });
    return { ok: true };
  }
  emit("sprint_full_branch_protection_blocked", {
    sprint_id: sprintId,
    current_branch: branch,
    allow_main_set: args.allowMain,
    preset: preset.preset_name,
    ts: nowIso(),
  });
  return {
    ok: false,
    halt_reason: "branch_protection",
    message: `/sprint:full refused to start: current branch is ${branch}. /sprint:full commits locally throughout the run — committing to ${branch} can leak partial work. Action: switch to a feature branch via \`git switch -c sprint/<SP-id>\` then re-run. Override with --allow-main (requires --autonomy aggressive).`,
  };
}

// ── Cost-estimate counter ─────────────────────────────────────────────

function makeCostCounter(thresholdUsd, costAcknowledged) {
  const effective = costAcknowledged ? thresholdUsd * 2 : thresholdUsd;
  return {
    cumulative: 0,
    threshold: effective,
    bumpedByAck: costAcknowledged,
    add(phase, ticketCount = 1) {
      const per = PHASE_TYPICAL_SPEND_USD[phase] || 0;
      const inc = phase === "execute" ? per * ticketCount : per;
      this.cumulative += inc;
      return inc;
    },
    exceeded() {
      return this.cumulative > this.threshold;
    },
  };
}

// ── Subprocess wrapper (Windows-safe) ─────────────────────────────────

function runHelper(scriptRel, args, opts = {}) {
  const scriptAbs = path.join(REPO_ROOT, scriptRel);
  const result = spawnSync(process.execPath, [scriptAbs, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, ...(opts.env || {}) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    code: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error || null,
  };
}

// ── Halt report writer ────────────────────────────────────────────────

function writeHaltReport(state, halt) {
  const dir = path.join(REPO_ROOT, PATHS.sprintFullReports, state.sprintId);
  ensureDir(dir);
  const ts = nowIso();
  const safeTs = ts.replace(/[:.]/g, "-");
  const filename = `halt-${safeTs}.md`;
  const filePath = path.join(dir, filename);
  const body = `# /sprint:full halt — ${state.sprintId}

**Phase:** ${state.currentPhase}
**Halt reason:** ${halt.halt_reason}
**Preset:** ${state.preset.preset_name}
**Beta verdict (if any):** ${halt.beta_verdict || "—"}
**Resume command:** \`${halt.resume_command || `/sprint:full --sprint ${state.sprintId} --resume`}\`
**Next human action:** ${halt.next_human_action || halt.message || "Investigate halt reason and resume."}
**Timestamp:** ${ts}

## Details

${halt.message || "(no additional details)"}

## Links

- Plan Contract: ${state.planContractId ? `paths.sprintPlanContracts/${state.planContractId}.yaml` : "—"}
- Current sprint: paths.sprintSprints/${state.sprintId}/current.yaml
- Progress: paths.sprintSprints/${state.sprintId}/progress.yaml
- Run timeline so far: see events.jsonl filter kind=sprint_full_*
`;
  writeText(filePath, body, { force: true });
  emit("sprint_full_halt", {
    sprint_id: state.sprintId,
    phase: state.currentPhase,
    halt_reason: halt.halt_reason,
    resume_command:
      halt.resume_command || `/sprint:full --sprint ${state.sprintId} --resume`,
    beta_verdict: halt.beta_verdict || null,
    halt_report_path: filePath,
  });
  return filePath;
}

// ── Final report writer ───────────────────────────────────────────────

function writeFinalReport(state) {
  const dir = path.join(REPO_ROOT, PATHS.sprintFullReports, state.sprintId);
  ensureDir(dir);
  const filePath = path.join(dir, "sprint-full-report.md");
  const dur =
    state.timeline.length > 0 && state.startedAt
      ? (Date.now() - new Date(state.startedAt).getTime()) / 1000
      : 0;
  let body = `# /sprint:full report — ${state.sprintId}

**Title:** ${state.sprintTitle || "(unknown)"}
**Preset:** ${state.preset.preset_name}
**Started:** ${state.startedAt}
**Completed:** ${nowIso()}
**Total duration:** ${dur.toFixed(1)}s
**Cost estimate:** $${state.cost.cumulative.toFixed(2)} (threshold $${state.cost.threshold.toFixed(2)}${state.cost.bumpedByAck ? ", bumped 2× via --cost-acknowledged" : ""})
**Outcome:** ${state.outcome || "done"}

## Phase timeline

| # | Phase | Duration | Exit | Auto-approvals | Notes |
|---|---|---|---|---|---|
`;
  for (const row of state.timeline) {
    body += `| ${row.idx} | ${row.phase} | ${row.duration_ms}ms | ${row.exit_code} | ${row.auto_approvals_recorded || 0} | ${row.notes || ""} |\n`;
  }
  body += `
## Decisions auto-approved

${
  state.autoApprovals.length === 0
    ? "(none)"
    : state.autoApprovals
        .map((a) => `- ${a.level} for ${a.linked_to} (${a.ts})`)
        .join("\n")
}

## Tickets

- Done: ${state.tickets.done.length}
- Deferred: ${state.tickets.deferred.length}
- Abandoned: ${state.tickets.abandoned.length}

## Beta consultations

${
  state.betaConsultations.length === 0
    ? "(none — solo mode or skipped)"
    : state.betaConsultations
        .map((c) => `- ${c.phase_boundary}: ${c.verdict} (${c.ts})`)
        .join("\n")
}

## Halts (recoverable)

${
  state.halts.length === 0
    ? "(none — clean run)"
    : state.halts
        .map((h) => `- ${h.phase}: ${h.halt_reason} → ${h.resume_command}`)
        .join("\n")
}
`;
  writeText(filePath, body, { force: true });
  emit("sprint_full_done", {
    sprint_id: state.sprintId,
    total_duration_ms: dur * 1000,
    tickets_done: state.tickets.done.length,
    tickets_deferred: state.tickets.deferred.length,
    tickets_abandoned: state.tickets.abandoned.length,
    beta_consultations: state.betaConsultations.length,
    auto_approvals_total: state.autoApprovals.length,
    cumulative_cost_estimate: state.cost.cumulative,
    report_path: filePath,
  });
  return filePath;
}

// ── Checkpoint helper ────────────────────────────────────────────────

function checkpoint(state, status, nextAction, resumeNotes) {
  runHelper("scripts/sprint/checkpoint.js", [
    "--sprint",
    state.sprintId,
    "--phase",
    state.currentPhase,
    "--command",
    "/sprint:full",
    "--status",
    status,
    "--last-completed-step",
    `sprint_full_${state.currentPhase}_${status}`,
    "--next-action",
    nextAction || `Continue /sprint:full --sprint ${state.sprintId} --resume`,
    "--resume-command",
    `/sprint:full --sprint ${state.sprintId} --resume`,
    "--resume-notes",
    resumeNotes ||
      `phase=${state.currentPhase} status=${status} preset=${state.preset.preset_name}`,
    "--safe-to-continue",
    "true",
  ]);
}

// ── Phase boundary Beta consultation (adhoc mode only, stub) ──────────

function maybeConsultBeta(state, boundary) {
  if (state.mode !== "adhoc") return { ok: true, verdict: null };
  // Beta consultation is dispatched via SendMessage by the skill body
  // (Alpha's responsibility, not the orchestrator's). Here we log
  // the intent; the actual SendMessage call is interactive.
  emit("sprint_full_beta_consultation", {
    sprint_id: state.sprintId,
    phase_boundary: boundary,
    verdict: "DECIDE", // placeholder — skill body fills in via SendMessage
    topic_tags: ["sprint_full_phase_boundary"],
    ts: nowIso(),
  });
  state.betaConsultations.push({
    phase_boundary: boundary,
    verdict: "DECIDE",
    ts: nowIso(),
  });
  return { ok: true, verdict: "DECIDE" };
}

// ── Phase 1: plan ─────────────────────────────────────────────────────

function phase1Plan(state, args) {
  state.currentPhase = "plan";
  emit("sprint_full_phase_started", {
    sprint_id: state.sprintId,
    phase: "plan",
    phase_index: 0,
    cumulative_cost_estimate: state.cost.cumulative,
    ts: nowIso(),
  });
  const startTs = Date.now();

  // If --resume and Plan Contract already exists for this sprint, skip.
  const current = readYamlMaybe(
    path.join(
      REPO_ROOT,
      ".claude",
      "project",
      "sprint",
      "sprints",
      state.sprintId,
      "current.yaml",
    ),
  );
  if (state.resuming && current && current.plan_contract) {
    state.planContractId = path.basename(current.plan_contract, ".yaml");
    state.sprintTitle = current.title;
    state.timeline.push({
      idx: 1,
      phase: "plan",
      duration_ms: 0,
      exit_code: 0,
      notes: "skipped (resume)",
    });
    state.cost.add("plan");
    return { ok: true, skipped: true };
  }

  // The skill body is responsible for constructing the Plan Contract
  // payload from the verbatim request (Alpha's reasoning). The
  // orchestrator can't infer it from argv alone. So this phase
  // requires the skill body to have written .warpos/plan-payload-<slug>.json
  // BEFORE invoking full.js, OR the caller can pass an explicit payload
  // file path. For v0.1 we expect the skill body to have done so.
  const payloadGlob = `${REPO_ROOT}/.warpos/plan-payload-*.json`;
  let payloadFile = null;
  // Use the most recent matching file by mtime as a best-effort.
  try {
    const candidates = fs
      .readdirSync(path.join(REPO_ROOT, ".warpos"))
      .filter((f) => f.startsWith("plan-payload-") && f.endsWith(".json"))
      .map((f) => path.join(REPO_ROOT, ".warpos", f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    payloadFile = candidates[0] || null;
  } catch {
    /* .warpos missing */
  }
  if (!payloadFile) {
    return {
      ok: false,
      halt_reason: "plan_payload_missing",
      message:
        "Phase 1 (plan) requires a payload JSON at .warpos/plan-payload-*.json constructed by Alpha from the verbatim request. None found. /sprint:full's skill body is the right place to construct this — see .claude/commands/sprint/full.md.",
    };
  }

  const res = runHelper("scripts/sprint/plan.js", [
    "--sprint",
    state.sprintId,
    "--payload",
    payloadFile,
  ]);
  state.cost.add("plan");
  if (res.code !== 0) {
    return {
      ok: false,
      halt_reason: "plan_payload_invalid",
      message: `scripts/sprint/plan.js exited ${res.code}.\nstderr: ${res.stderr}`,
    };
  }
  // Capture PC id from stdout
  const pcMatch = (res.stdout || "").match(/plan-contract:.*?(PC-\d{8}-\d{4})/);
  if (pcMatch) state.planContractId = pcMatch[1];

  // Read Plan Contract for plan_quality + scope
  if (state.planContractId) {
    const pcPath = path.join(
      REPO_ROOT,
      ".claude",
      "project",
      "sprint",
      "plan-contracts",
      `${state.planContractId}.yaml`,
    );
    const pc = readYamlMaybe(pcPath);
    if (pc) {
      const status =
        (pc.plan_quality && pc.plan_quality.status) || "needs_design";
      state.planQuality = status;
      state.planContractScope = pc.scope ? pc.scope.size : "m";
      if (status !== "pass" && status !== "needs_design") {
        return {
          ok: false,
          halt_reason: "plan_quality_fail",
          message: `Plan Contract ${state.planContractId} returned plan_quality=${status}. Blocking questions need operator input. See ${pc.tracker_paths && pc.tracker_paths.plan_contract}#open_questions.blocking.`,
        };
      }
    }
  }

  const dur = Date.now() - startTs;
  state.timeline.push({
    idx: 1,
    phase: "plan",
    duration_ms: dur,
    exit_code: 0,
    notes: state.planContractId
      ? `PC=${state.planContractId} quality=${state.planQuality}`
      : "",
  });
  emit("sprint_full_phase_completed", {
    sprint_id: state.sprintId,
    phase: "plan",
    duration_ms: dur,
    helper_exit_code: 0,
    auto_approvals_recorded: 0,
  });
  checkpoint(
    state,
    "running",
    `Phase 2: design (--documentation-scale ${deriveDocScale(state)})`,
    `Plan Contract ${state.planContractId} created`,
  );
  if (state.cost.exceeded()) {
    return {
      ok: false,
      halt_reason: "cost_threshold",
      message: `Cumulative cost estimate $${state.cost.cumulative.toFixed(2)} exceeds threshold $${state.cost.threshold.toFixed(2)}.`,
    };
  }
  return { ok: true };
}

function deriveDocScale(state) {
  if (state.documentationScale && state.documentationScale !== "auto") {
    return state.documentationScale;
  }
  const map = { xs: "xs", s: "s", m: "m", l: "m", xl: "l" };
  return map[state.planContractScope || "m"] || "m";
}

// ── Phase 2: design ──────────────────────────────────────────────────

function phase2Design(state) {
  state.currentPhase = "design";
  emit("sprint_full_phase_started", {
    sprint_id: state.sprintId,
    phase: "design",
    phase_index: 1,
    cumulative_cost_estimate: state.cost.cumulative,
    ts: nowIso(),
  });
  const startTs = Date.now();
  const scale = deriveDocScale(state);
  const res = runHelper("scripts/sprint/design.js", [
    "--sprint",
    state.sprintId,
    "--documentation-scale",
    scale,
  ]);
  state.cost.add("design");
  if (res.code !== 0) {
    return {
      ok: false,
      halt_reason: "design_scaffold_failed",
      message: `scripts/sprint/design.js exited ${res.code}.\nstderr: ${res.stderr}`,
    };
  }
  // Hand-edit + ticket minting is the skill body's responsibility
  // (Alpha's reasoning over the rendered templates). The orchestrator
  // does NOT auto-fill placeholders — it would produce garbage.
  // For v0.1, the orchestrator stops after the scaffold and surfaces
  // a halt for the skill body to take over. Future v0.2 may invoke
  // a sub-agent.
  const dur = Date.now() - startTs;
  state.timeline.push({
    idx: 2,
    phase: "design",
    duration_ms: dur,
    exit_code: 0,
    notes: `scale=${scale}; skill body owns hand-edit + ticket minting`,
  });
  emit("sprint_full_phase_completed", {
    sprint_id: state.sprintId,
    phase: "design",
    duration_ms: dur,
    helper_exit_code: 0,
    auto_approvals_recorded: 0,
  });
  checkpoint(
    state,
    "running",
    "Phase 3: execute (Ralph loops per ticket)",
    `Design scaffolded at scale=${scale}`,
  );
  if (state.cost.exceeded()) {
    return {
      ok: false,
      halt_reason: "cost_threshold",
      message: `Cumulative cost estimate $${state.cost.cumulative.toFixed(2)} exceeds threshold $${state.cost.threshold.toFixed(2)}.`,
    };
  }
  return { ok: true };
}

// ── Phase 3: execute ─────────────────────────────────────────────────

function phase3Execute(state) {
  state.currentPhase = "execute";
  emit("sprint_full_phase_started", {
    sprint_id: state.sprintId,
    phase: "execute",
    phase_index: 2,
    cumulative_cost_estimate: state.cost.cumulative,
    ts: nowIso(),
  });
  const startTs = Date.now();

  // ESD pre-flight gate — refuse to execute on any ESD that needs signup/billing/credentials.
  const esdGate = runHelper("scripts/sprint/external-service.js", [
    "gate",
    "--phase",
    "execute",
  ]);
  if (esdGate.code !== 0) {
    return {
      ok: false,
      halt_reason: "esd_signup",
      message: `external-service.js gate failed.\nstderr: ${esdGate.stderr}\nstdout: ${esdGate.stdout}`,
    };
  }

  // Read current.yaml to get ready_for_execution tickets.
  const currentPath = path.join(
    REPO_ROOT,
    ".claude",
    "project",
    "sprint",
    "sprints",
    state.sprintId,
    "current.yaml",
  );
  const current = readYamlMaybe(currentPath) || {};
  const ready = (
    (current.tickets && current.tickets.ready_for_execution) ||
    []
  ).slice();
  if (ready.length === 0) {
    state.timeline.push({
      idx: 3,
      phase: "execute",
      duration_ms: 0,
      exit_code: 0,
      notes: "no ready_for_execution tickets — execute phase no-op",
    });
    return { ok: true };
  }

  const policy = state.preset.stop_condition_policy;
  let autoApprovalsThisPhase = 0;
  for (const ticketId of ready) {
    // Update ticket to in_progress
    runHelper("scripts/sprint/ticket.js", [
      "update",
      "--sprint",
      state.sprintId,
      "--id",
      ticketId,
      "--status",
      "in_progress",
      "--owner-agent",
      "alpha",
    ]);

    // Hand off to execute.js — the skill body drives the Ralph loop.
    // The orchestrator's job is to handle stop_reasons, not to live
    // inside the loop. For v0.1 we mark the ticket and continue;
    // the skill body invokes execute.js start/phase/stop interactively.
    state.cost.add("execute", 1);
    if (state.cost.exceeded()) {
      return {
        ok: false,
        halt_reason: "cost_threshold",
        message: `Cumulative cost estimate $${state.cost.cumulative.toFixed(2)} exceeds threshold $${state.cost.threshold.toFixed(2)}.`,
      };
    }
  }

  const dur = Date.now() - startTs;
  state.timeline.push({
    idx: 3,
    phase: "execute",
    duration_ms: dur,
    exit_code: 0,
    auto_approvals_recorded: autoApprovalsThisPhase,
    notes: `${ready.length} ticket(s) handed off to Ralph loops`,
  });
  emit("sprint_full_phase_completed", {
    sprint_id: state.sprintId,
    phase: "execute",
    duration_ms: dur,
    helper_exit_code: 0,
    auto_approvals_recorded: autoApprovalsThisPhase,
  });
  checkpoint(
    state,
    "running",
    "Phase 4: release-prep (prepare + check, never deploy)",
    `Execute handed off ${ready.length} ticket(s)`,
  );
  return { ok: true };
}

// ── Phase 4: release-prep ────────────────────────────────────────────

function phase4ReleasePrep(state) {
  state.currentPhase = "release-prep";
  emit("sprint_full_phase_started", {
    sprint_id: state.sprintId,
    phase: "release-prep",
    phase_index: 3,
    cumulative_cost_estimate: state.cost.cumulative,
    ts: nowIso(),
  });
  const startTs = Date.now();

  // release-prep is gated by preset. moderate halts here for human
  // approval; aggressive proceeds only for non-production targets.
  const levels = state.preset.pre_authorized_approval_levels || [];
  const includesReleaseApproval = levels.includes("release_approval_required");
  const targets = state.preset.release_approval_targets || [];
  const target = "staging"; // default for autonomous prep; real deploy is operator's
  const canAutoApprove = includesReleaseApproval && targets.includes(target);
  if (!canAutoApprove) {
    return {
      ok: false,
      halt_reason: "approval_beyond_preset",
      message: `release_approval_required is outside preset '${state.preset.preset_name}' pre-authorization (or target '${target}' not in release_approval_targets). Operator action: record approval via scripts/sprint/release.js approve, OR re-run with --autonomy aggressive (subject to hard ceilings — never auto-deploys to production).`,
    };
  }

  // Aggressive + staging path: prepare + check. Skip deploy (hard ceiling).
  const prepRes = runHelper("scripts/sprint/release.js", [
    "prepare",
    "--title",
    state.sprintTitle || `Sprint ${state.sprintId}`,
    "--version",
    `${state.sprintId}-staging`,
    "--target",
    target,
  ]);
  state.cost.add("release-prep");
  if (prepRes.code !== 0) {
    return {
      ok: false,
      halt_reason: "release_prepare_failed",
      message: `release.js prepare exited ${prepRes.code}.\nstderr: ${prepRes.stderr}`,
    };
  }
  // (release.js check + approve handled by skill body or operator)

  const dur = Date.now() - startTs;
  state.timeline.push({
    idx: 4,
    phase: "release-prep",
    duration_ms: dur,
    exit_code: 0,
    auto_approvals_recorded: 0,
    notes: `prepared for target=${target}; deploy is operator-invoked`,
  });
  emit("sprint_full_phase_completed", {
    sprint_id: state.sprintId,
    phase: "release-prep",
    duration_ms: dur,
    helper_exit_code: 0,
    auto_approvals_recorded: 0,
  });
  checkpoint(
    state,
    "running",
    "Phase 5: retrospective",
    `Release prepared (target=${target})`,
  );
  return { ok: true };
}

// ── Phase 5: retrospective ────────────────────────────────────────────

function phase5Retro(state) {
  state.currentPhase = "retro";
  emit("sprint_full_phase_started", {
    sprint_id: state.sprintId,
    phase: "retro",
    phase_index: 4,
    cumulative_cost_estimate: state.cost.cumulative,
    ts: nowIso(),
  });
  const startTs = Date.now();
  const res = runHelper("scripts/sprint/retrospective.js", [
    "--sprint",
    state.sprintId,
    "--signed-off-by",
    "alpha",
    "--no-synth",
  ]);
  state.cost.add("retro");
  // retro is fail-open per its own contract; even non-zero is recoverable.
  const dur = Date.now() - startTs;
  state.timeline.push({
    idx: 5,
    phase: "retro",
    duration_ms: dur,
    exit_code: res.code,
    notes:
      res.code === 0
        ? "retro.yaml + retro.md written"
        : `retro exited ${res.code} (skeleton fallback)`,
  });
  emit("sprint_full_phase_completed", {
    sprint_id: state.sprintId,
    phase: "retro",
    duration_ms: dur,
    helper_exit_code: res.code,
    auto_approvals_recorded: 0,
  });
  return { ok: true };
}

// ── Main orchestrator ────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return 0;
  }
  if (!args.resume && (!args.request || args.request.length < 10)) {
    process.stderr.write(
      'Usage: /sprint:full "<request>" [...]\n\nRun with --help for full options.\n',
    );
    return 2;
  }
  if (args.allowMain && args.autonomy !== "aggressive") {
    process.stderr.write("--allow-main requires --autonomy aggressive.\n");
    return 2;
  }

  const presetResult = loadPreset(args.autonomy);
  if (!presetResult.ok) {
    process.stderr.write(presetResult.error + "\n");
    return 2;
  }
  const preset = presetResult.preset;

  // Resolve sprint id. Resume requires --sprint; new run uses registry primary
  // or expects a pre-created sprint via add-sprint.js (skill body's job).
  let sprintId = args.sprint;
  if (!sprintId) {
    sprintId = SPRINT.active();
  }
  if (!sprintId) {
    process.stderr.write(
      "No sprint id resolved. Pass --sprint <SP-id> or have the skill body run scripts/sprint/add-sprint.js first.\n",
    );
    return 2;
  }

  const cost = makeCostCounter(
    preset.cost_estimate_threshold_usd,
    args.costAcknowledged,
  );
  const state = {
    sprintId,
    sprintTitle: null,
    planContractId: null,
    planContractScope: null,
    planQuality: null,
    documentationScale: args.documentationScale,
    mode: args.mode || "adhoc",
    preset,
    cost,
    resuming: args.resume,
    currentPhase: "boot",
    startedAt: nowIso(),
    timeline: [],
    autoApprovals: [],
    betaConsultations: [],
    halts: [],
    tickets: { done: [], deferred: [], abandoned: [] },
    outcome: null,
  };

  // Branch protection
  const bp = checkBranchProtection(args, preset, sprintId);
  if (!bp.ok) {
    process.stderr.write(bp.message + "\n");
    writeHaltReport(state, bp);
    return 1;
  }

  emit("sprint_full_started", {
    sprint_id: sprintId,
    preset_name: preset.preset_name,
    scope: args.scope,
    documentation_scale: args.documentationScale,
    mode: state.mode,
    branch: currentBranch(),
    started_at: state.startedAt,
  });
  if (args.resume) {
    emit("sprint_full_resume", {
      sprint_id: sprintId,
      ts: nowIso(),
    });
  }

  // Phase pipeline
  const phaseFns = [
    () => phase1Plan(state, args),
    () => phase2Design(state),
    () => phase3Execute(state),
    () => phase4ReleasePrep(state),
    () => phase5Retro(state),
  ];

  for (const fn of phaseFns) {
    maybeConsultBeta(state, `before_${state.currentPhase || "next"}`);
    const result = fn();
    if (!result.ok) {
      state.halts.push({
        phase: state.currentPhase,
        halt_reason: result.halt_reason,
        resume_command: `/sprint:full --sprint ${sprintId} --resume`,
      });
      state.outcome = `halted:${result.halt_reason}`;
      const haltPath = writeHaltReport(state, result);
      process.stderr.write(
        `/sprint:full halted (${result.halt_reason}). See ${haltPath}\n`,
      );
      checkpoint(
        state,
        "halted",
        result.message || "halt",
        `halt_reason=${result.halt_reason}`,
      );
      return 1;
    }
  }

  state.outcome = "done";
  const reportPath = writeFinalReport(state);
  process.stdout.write(`/sprint:full done. Report: ${reportPath}\n`);
  checkpoint(state, "completed", "Sprint pipeline complete", `Outcome=done`);
  return 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  main,
  parseArgs,
  loadPreset,
  HARD_CEILINGS,
  FORBIDDEN_PRE_AUTH,
  PHASES,
  PHASE_TYPICAL_SPEND_USD,
  makeCostCounter,
  checkBranchProtection,
  writeHaltReport,
  writeFinalReport,
};
