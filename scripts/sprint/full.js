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
    betaVerdict: null,
    betaMessage: null,
    pendingPhase: null,
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
    else if (a === "--beta-verdict") out.betaVerdict = argv[++i];
    else if (a === "--beta-message") out.betaMessage = argv[++i];
    else if (a === "--pending-phase") out.pendingPhase = argv[++i];
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
  --beta-verdict <v>            DECIDE | DIRECTIVE | ESCALATE — verdict from Beta consultation
  --beta-message "<text>"       message accompanying the Beta verdict
  --pending-phase <boundary>    phase boundary the verdict applies to (e.g. before_plan)
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

  // Ticket counts come from the per-sprint current.yaml (the source of truth),
  // not state.tickets. Phase 3's resume-aware path no longer fans out tickets
  // through the in-memory orchestrator state, so state.tickets.* stays empty
  // even when current.yaml has real done/deferred/abandoned entries.
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
  const lane = (k) =>
    (current.tickets && Array.isArray(current.tickets[k])
      ? current.tickets[k]
      : []);
  const doneTickets = lane("done");
  const deferredTickets = lane("deferred");
  const abandonedTickets = lane("abandoned");
  const releasedTickets = lane("released");
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

- Done: ${doneTickets.length}${doneTickets.length ? ` (${doneTickets.join(", ")})` : ""}
- Released: ${releasedTickets.length}${releasedTickets.length ? ` (${releasedTickets.join(", ")})` : ""}
- Deferred: ${deferredTickets.length}${deferredTickets.length ? ` (${deferredTickets.join(", ")})` : ""}
- Abandoned: ${abandonedTickets.length}${abandonedTickets.length ? ` (${abandonedTickets.join(", ")})` : ""}

## Beta consultations

${
  state.betaConsultations.length === 0
    ? "(none — solo mode or skipped)"
    : state.betaConsultations
        .map(
          (c) =>
            `- ${c.phase_boundary}: ${c.verdict}` +
            `${c.beta_message ? ` — ${c.beta_message}` : ""} (${c.ts})`,
        )
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
    tickets_done: doneTickets.length,
    tickets_released: releasedTickets.length,
    tickets_deferred: deferredTickets.length,
    tickets_abandoned: abandonedTickets.length,
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

// ── Beta verdict validator ────────────────────────────────────────────

const BETA_VERDICTS = Object.freeze(["DECIDE", "DIRECTIVE", "ESCALATE"]);

function validateBetaVerdict(v) {
  return BETA_VERDICTS.includes(v);
}

// ── Phase boundary Beta consultation (adhoc mode only) ────────────────
//
// ADR option (b): halt-at-each-Beta-boundary.
// A spawnSync-d node subprocess cannot reach the in-process SendMessage/
// Agent surface. Instead, the orchestrator halts here and lets the
// foreground (Alpha) drive the real consult, then resumes with the verdict
// passed via --beta-verdict / --pending-phase on the CLI.
//
// Call site MUST pass `args` (the parsed CLI args object) so this function
// can inspect a supplied verdict. It MAY mutate args.betaVerdict to null
// after consuming it — one-consult-per-resume semantics.

function maybeConsultBeta(state, boundary, args) {
  // Solo mode: skip Beta entirely — no halts, no events, no consult records.
  if (state.mode !== "adhoc") return { ok: true, verdict: null };

  // Determine whether a verdict has been supplied that applies to THIS boundary:
  //   - args.betaVerdict must be present (non-null)
  //   - AND args.pendingPhase is null (apply to first boundary encountered)
  //     OR args.pendingPhase equals this boundary (targeted resume)
  const hasVerdict =
    args && args.betaVerdict !== null && args.betaVerdict !== undefined;
  const verdictAppliesHere =
    hasVerdict &&
    (args.pendingPhase === null ||
      args.pendingPhase === undefined ||
      args.pendingPhase === boundary);

  if (!verdictAppliesHere) {
    // No verdict supplied for this boundary — halt and let the foreground
    // (Alpha) perform the real Beta consultation, then resume with the result.
    const resumeCmd =
      `/sprint:full --sprint ${state.sprintId} --resume` +
      ` --pending-phase ${boundary}` +
      ` --beta-verdict <DECIDE|DIRECTIVE|ESCALATE>` +
      ` --beta-message "<response from Beta>"`;
    return {
      ok: false,
      halt_reason: "beta_consult_pending",
      boundary,
      message:
        `Beta consultation required at phase boundary '${boundary}'. ` +
        `Consult Beta (Alex β) about the upcoming phase, then resume: ${resumeCmd}`,
      resume_command: resumeCmd,
      next_human_action:
        `Consult Beta (Alex β) about '${boundary}', obtain a verdict ` +
        `(DECIDE | DIRECTIVE | ESCALATE), then resume with the verdict.`,
    };
  }

  // Verdict supplied and applies here — record the REAL consult.
  const verdict = args.betaVerdict;
  const betaMessage = args.betaMessage || "";
  const ts = nowIso();
  const latencyMs = 0; // no live round-trip in this subprocess; elapsed is ~0
  const model = process.env.WARPOS_BETA_MODEL || "claude-opus-4-7";

  emit("sprint_full_beta_consult", {
    verdict,
    beta_message: betaMessage,
    latency_ms: latencyMs,
    model,
    phase_boundary: boundary,
    topic_tags: ["sprint_full_phase_boundary"],
    sprint_id: state.sprintId,
    ts,
  });

  state.betaConsultations.push({
    phase_boundary: boundary,
    verdict,
    beta_message: betaMessage,
    latency_ms: latencyMs,
    model,
    ts,
  });

  // Consume the verdict so subsequent boundaries in this process run do NOT
  // reuse it — one-consult-per-resume semantics. Each additional Beta boundary
  // will halt with beta_consult_pending and require its own resume invocation.
  args.betaVerdict = null;
  args.betaMessage = null;
  if (args.pendingPhase === boundary) args.pendingPhase = null;

  // Act on verdict.
  if (verdict === "DECIDE") {
    return { ok: true, verdict: "DECIDE" };
  }

  if (verdict === "DIRECTIVE") {
    // Record the directive. Hook point: state.betaDirectives is surfaced in
    // the final report's "Beta consultations" section and is available for
    // future phase logic to inspect (e.g. phase adjustments, scope changes).
    // Full downstream behavior wiring is out of scope for this ticket, but
    // the recording contract is established here.
    if (!state.betaDirectives) state.betaDirectives = [];
    state.betaDirectives.push({ boundary, message: betaMessage, ts });
    return { ok: true, verdict: "DIRECTIVE", directive: betaMessage };
  }

  if (verdict === "ESCALATE") {
    // ESCALATE is a hard halt regardless of preset — operator must resolve.
    return {
      ok: false,
      halt_reason: "beta_escalate",
      boundary,
      beta_verdict: "ESCALATE",
      message:
        `Beta ESCALATE at phase boundary '${boundary}': ${betaMessage}. ` +
        `Resolve the escalation with Alpha (${boundary} phase cannot proceed until ` +
        `Beta clears it), then resume with a DECIDE or DIRECTIVE verdict.`,
      resume_command:
        `/sprint:full --sprint ${state.sprintId} --resume` +
        ` --pending-phase ${boundary}` +
        ` --beta-verdict <DECIDE|DIRECTIVE>` +
        ` --beta-message "<resolution>"`,
      next_human_action:
        `Resolve Beta escalation for '${boundary}', then resume with DECIDE or DIRECTIVE.`,
    };
  }

  // Fallback — should never reach here after upstream validateBetaVerdict.
  return { ok: true, verdict: null };
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

  // On --resume, if tickets are already minted from a prior run, skip
  // the rescaffold + tickets_pending halt and advance to Phase 3.
  // Otherwise resume can never get past Phase 2 once tickets exist.
  if (state.resuming) {
    const currentPath = path.join(
      REPO_ROOT,
      ".claude",
      "project",
      "sprint",
      "sprints",
      state.sprintId,
      "current.yaml",
    );
    const cur = readYamlMaybe(currentPath) || {};
    const buckets = cur.tickets || {};
    const tixCount =
      (buckets.ready_for_execution || []).length +
      (buckets.in_progress || []).length +
      (buckets.done || []).length +
      (buckets.deferred || []).length +
      (buckets.proposed || []).length +
      (buckets.planned || []).length +
      (buckets.designed || []).length;
    if (tixCount > 0) {
      state.timeline.push({
        idx: 2,
        phase: "design",
        duration_ms: 0,
        exit_code: 0,
        notes: `resume: ${tixCount} ticket(s) already minted — skipping rescaffold + halt`,
      });
      emit("sprint_full_phase_completed", {
        sprint_id: state.sprintId,
        phase: "design",
        duration_ms: 0,
        helper_exit_code: 0,
        auto_approvals_recorded: 0,
        notes: "skipped on resume (tickets exist)",
      });
      return { ok: true, skipped: true };
    }
  }

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
    "halted",
    `Skill body: review design scaffold, fill placeholders, mint tickets via ticket.js, then /sprint:full --sprint ${state.sprintId} --resume`,
    `Design scaffolded at scale=${scale}; awaiting ticket minting`,
  );
  if (state.cost.exceeded()) {
    return {
      ok: false,
      halt_reason: "cost_threshold",
      message: `Cumulative cost estimate $${state.cost.cumulative.toFixed(2)} exceeds threshold $${state.cost.threshold.toFixed(2)}.`,
    };
  }
  // Advancing without minted ready_for_execution tickets produces a hollow
  // sprint record (0 work done, Phase 3 no-ops, Phase 4 mints a ghost RL).
  return {
    ok: false,
    halt_reason: "tickets_pending",
    message:
      `Phase 2 (design) scaffolded requirements at scale=${scale}. ` +
      `The skill body must now: (1) review and fill the rendered templates in ` +
      `.claude/project/sprint/requirements/${state.sprintId}/, ` +
      `(2) mint tickets via \`node scripts/sprint/ticket.js create --sprint ${state.sprintId} --title "<title>" --type <type> --risk <level>\` ` +
      `for each story, setting status=ready_for_execution. ` +
      `Then resume: \`/sprint:full --sprint ${state.sprintId} --resume\`.`,
    next_human_action: `Review design scaffold, fill placeholders, mint tickets, then run: /sprint:full --sprint ${state.sprintId} --resume`,
    resume_command: `/sprint:full --sprint ${state.sprintId} --resume`,
  };
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
  const done = ((current.tickets && current.tickets.done) || []).slice();
  const deferred = (
    (current.tickets && current.tickets.deferred) ||
    []
  ).slice();
  const inProgress = (
    (current.tickets && current.tickets.in_progress) ||
    []
  ).slice();
  const allTicketsAccountedFor =
    ready.length === 0 &&
    inProgress.length === 0 &&
    (done.length > 0 || deferred.length > 0);
  if (ready.length === 0 && !allTicketsAccountedFor) {
    // Honest halt. Previously this branch silently returned ok:true, which
    // let Phase 4 (release-prep) mint a release record and Phase 5 (retro)
    // produce a hollow retrospective for a sprint where 0 tickets were
    // ever minted or executed. See task: "Fix /sprint:full hollow-completion
    // bug" / SP-20260522-001 ghost run / RL-20260522-017.
    state.timeline.push({
      idx: 3,
      phase: "execute",
      duration_ms: 0,
      exit_code: 1,
      notes:
        "0 ready_for_execution tickets and 0 done — halting (skill body must mint tickets via /sprint:design)",
    });
    return {
      ok: false,
      halt_reason: "no_tickets_ready",
      message:
        `Phase 3 (execute) found 0 tickets in ready_for_execution AND 0 in done/deferred for sprint ${state.sprintId}. ` +
        `This means /sprint:design scaffolded the requirement templates but the skill body (Alpha) did not mint tickets. ` +
        `Action: (a) hand-edit .claude/project/sprint/requirements/${state.sprintId}/{prd,acceptance-criteria,granular-stories,...}.md to reflect real scope, then (b) mint tickets via \`node scripts/sprint/ticket.js create --sprint ${state.sprintId} --title "<title>" ...\` setting status=ready_for_execution. Resume with \`/sprint:full --sprint ${state.sprintId} --resume\`.`,
    };
  }
  if (ready.length === 0 && allTicketsAccountedFor) {
    // Resume case: tickets are already done/deferred from a prior run.
    state.timeline.push({
      idx: 3,
      phase: "execute",
      duration_ms: 0,
      exit_code: 0,
      notes: `resume: ${done.length} done, ${deferred.length} deferred — advancing`,
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

  // Refuse to mint a release record when zero tickets ever reached `done`.
  // Otherwise the orchestrator produces a hollow RL- record + retrospective
  // for a sprint that did no work. See SP-20260522-001 ghost run.
  const currentPath = path.join(
    REPO_ROOT,
    ".claude",
    "project",
    "sprint",
    "sprints",
    state.sprintId,
    "current.yaml",
  );
  const currentForCheck = readYamlMaybe(currentPath) || {};
  const ticketsDone = (
    (currentForCheck.tickets && currentForCheck.tickets.done) ||
    []
  ).slice();
  const ticketsDeferred = (
    (currentForCheck.tickets && currentForCheck.tickets.deferred) ||
    []
  ).slice();
  if (ticketsDone.length === 0 && ticketsDeferred.length === 0) {
    return {
      ok: false,
      halt_reason: "no_tickets_done",
      message:
        `Phase 4 (release-prep) refuses to mint a release record for sprint ${state.sprintId}: 0 tickets in 'done' and 0 in 'deferred'. ` +
        `A release for zero completed work is not a release. ` +
        `Action: complete at least one ticket (mark it 'done' via \`node scripts/sprint/ticket.js update --sprint ${state.sprintId} --id <T-id> --status done\`), or formally abandon the sprint via /sprint:retrospective with no release. ` +
        `Resume with \`/sprint:full --sprint ${state.sprintId} --resume\`.`,
    };
  }

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

/**
 * SP-20260523-001 helper. Flip active-sprints.yaml#sprints[id].status to
 * `closed` if it's not already in {`closed`, `abandoned`, `retrospected`}.
 * Mirrors release.js#cmdDeploy's auto-flip pattern (line 369-393).
 *
 * Idempotent + fail-open: never blocks Phase 5 if the registry can't be
 * updated. The retrospective will report its own status-gate-blocked
 * error if the flip didn't take.
 */
function flipActiveSprintsStatusForRetro(sprintId) {
  try {
    const reg = readYamlMaybe(SPRINT.activeRegistry);
    if (!reg || !Array.isArray(reg.sprints)) return { changed: false, reason: "no_registry" };
    const entry = reg.sprints.find((s) => s.id === sprintId);
    if (!entry) return { changed: false, reason: "not_in_registry" };
    if (["closed", "abandoned", "retrospected"].includes(entry.status)) {
      return { changed: false, reason: "already_terminal", from: entry.status };
    }
    const prev = entry.status;
    const now = nowIso();
    entry.status = "closed";
    entry.updated_at = now;
    reg.updated_at = now;
    writeYaml(SPRINT.activeRegistry, reg);
    return { changed: true, from: prev, to: "closed", reason: "ok" };
  } catch (err) {
    return { changed: false, reason: `error: ${err.message}` };
  }
}

function phase5Retro(state) {
  state.currentPhase = "retro";
  emit("sprint_full_phase_started", {
    sprint_id: state.sprintId,
    phase: "retro",
    phase_index: 4,
    cumulative_cost_estimate: state.cost.cumulative,
    ts: nowIso(),
  });
  // SP-20260523-001 fix: retrospective.js' status gate (line 771-782) refuses
  // any status not in {closed, abandoned, retrospected}. /sprint:full's
  // Phase 4 calls `release.js prepare`, which mints a release record but
  // does NOT flip the active-sprints status (only `release.js deploy` does
  // that, and Phase 4 never calls deploy). Without this, retrospective
  // exits 3, flipStatusToRetrospected never runs, and active-sprints.yaml
  // stays stuck at `planning`/`releasing` — caught manually during SP-004
  // and SP-005 today. Auto-flip the registry status to `closed` here so
  // Phase 5 can complete and the retrospective updates it to `retrospected`.
  // Idempotent + fail-open per release.js#cmdDeploy precedent.
  flipActiveSprintsStatusForRetro(state.sprintId);
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
  if (args.betaVerdict !== null && !validateBetaVerdict(args.betaVerdict)) {
    process.stderr.write(
      `--beta-verdict must be one of DECIDE, DIRECTIVE, ESCALATE. Got: ${args.betaVerdict}\n`,
    );
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
    betaDirectives: [],
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

  for (let i = 0; i < phaseFns.length; i++) {
    // Derive boundary from the UPCOMING phase (the one about to run at index i),
    // not from state.currentPhase which names the last completed phase.
    const consult = maybeConsultBeta(state, `before_${PHASES[i]}`, args);
    if (!consult.ok) {
      state.halts.push({
        phase: state.currentPhase,
        halt_reason: consult.halt_reason,
        resume_command:
          consult.resume_command || `/sprint:full --sprint ${sprintId} --resume`,
      });
      state.outcome = `halted:${consult.halt_reason}`;
      const haltPath = writeHaltReport(state, consult);
      process.stderr.write(
        `/sprint:full halted (${consult.halt_reason}). See ${haltPath}\n`,
      );
      checkpoint(
        state,
        "halted",
        consult.message || "halt",
        `halt_reason=${consult.halt_reason}`,
      );
      return 1;
    }
    const result = phaseFns[i]();
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
  phase2Design,
  phase3Execute,
  phase4ReleasePrep,
  flipActiveSprintsStatusForRetro,
  maybeConsultBeta,
  validateBetaVerdict,
  BETA_VERDICTS,
};
