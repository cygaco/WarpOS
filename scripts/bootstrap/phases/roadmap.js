#!/usr/bin/env node
"use strict";
/**
 * scripts/bootstrap/phases/roadmap.js — Phase 4 of the bootstrap:spinup chain
 * (SP-20260525-023, ticket T-20260525-239). Satisfies S-4 (AC-4.1).
 *
 * Turns the canon (_requirements/00-canonical/*) into a real ROADMAP.md with
 * milestones + sprints, MVP-core-loop first (Milestone-1 sprint-1 = the core
 * loop on screen).
 *
 * Mirrors B's deterministic/LLM split (see scripts/canon/generate.js + the
 * canon phase): the DETERMINISTIC part runs in-process by shelling to the
 * existing scaffold engine (scripts/warpos/generate-roadmap-scaffold.js); the
 * LLM SYNTHESIS — the actual milestone/sprint sequencing from the canon's
 * golden paths, MVP-core-loop first — is roadmap:create's job and a node
 * process cannot run it. So we seed the deterministic scaffold and then hand
 * the synthesis back to the skill body via status:"needs_orchestration".
 *
 * WHY needs_orchestration is the normal terminal state here (not done):
 * generate-roadmap-scaffold.js emits an EMPTY product-style ROADMAP.md —
 * placeholder section prose only ("Current State", "Active Backlog", …), with
 * NO grounded milestones, NO sprints, and NO `<!-- ledger:sprints -->` anchor.
 * AC-4.1 demands a ROADMAP.md "with milestones + sprints, MVP-core-loop first"
 * grounded in the canon. The scaffold alone cannot satisfy that — only
 * roadmap:create's canonical-grounded synthesis can — so the scaffold is a
 * seed, and the grounded roadmap requires orchestration. We return done ONLY
 * if a usable grounded ROADMAP.md already exists (the skill body ran
 * roadmap:create and re-invoked).
 *
 * Phase-module contract (see scripts/bootstrap/spinup-orchestrate.js):
 *   ctx = { repoRoot, product, intentFile, cloneTarget, outDir, research,
 *           dryRun, args, log }
 *   run(ctx) → { ok, status: "done"|"needs_orchestration"|"failed",
 *                message, data?, orchestration_prompt? }
 *
 * No external deps; shells only to the in-repo scaffold engine.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// The canon docs the roadmap must be grounded in. CORE_BRIEF + GOLDEN_PATHS are
// the load-bearing pair for MVP-core-loop sequencing; presence of the brief is
// the cheapest precondition probe.
const CANON_REQUIRED = ["CORE_BRIEF.md", "GOLDEN_PATHS.md"];

// Resolve the canonical output dir (ctx.outDir is repoRoot-relative by default,
// matching the orchestrator's --out "_requirements/00-canonical").
function canonDir(ctx) {
  const out = ctx.outDir || "_requirements/00-canonical";
  return path.isAbsolute(out) ? out : path.join(ctx.repoRoot, out);
}

// Has the skill body already produced a grounded roadmap? A roadmap:create
// result carries milestones AND the ledger anchor; the bare scaffold has
// neither. We treat the `<!-- ledger:sprints -->` anchor + a 🏛 Milestones
// section as the signature of a real grounded roadmap (per roadmap:create
// Invariant 3). The empty scaffold has only "## Current State" etc.
function isGroundedRoadmap(roadmapAbs) {
  let body;
  try {
    body = fs.readFileSync(roadmapAbs, "utf8");
  } catch {
    return false;
  }
  const hasLedgerAnchor = body.includes("<!-- ledger:sprints -->");
  const hasMilestones = /^#+\s.*Milestones/im.test(body);
  return hasLedgerAnchor && hasMilestones;
}

function readMaybe(file) {
  try {
    return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").trim();
  } catch {
    return "";
  }
}

function firstMeaningfulLines(body, max) {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) =>
      line &&
      !line.includes("{{") &&
      !line.startsWith("<!--") &&
      !line.startsWith("#") &&
      !line.startsWith("|") &&
      !line.startsWith("---"))
    .slice(0, max);
}

function renderAutomaticRoadmap(ctx, dir) {
  const coreBrief = readMaybe(path.join(dir, "CORE_BRIEF.md"));
  const goldenPaths = readMaybe(path.join(dir, "GOLDEN_PATHS.md"));
  const risks = readMaybe(path.join(dir, "RISKS.md"));
  const intent = ctx.intentFile
    ? readMaybe(path.isAbsolute(ctx.intentFile) ? ctx.intentFile : path.join(ctx.repoRoot, ctx.intentFile))
    : "";
  const now = new Date().toISOString();
  const title = ctx.product || path.basename(ctx.repoRoot);
  const briefLines = firstMeaningfulLines(coreBrief, 5);
  const intentLines = firstMeaningfulLines(intent, 5);
  const pathLines = firstMeaningfulLines(goldenPaths, 6);
  const riskLines = firstMeaningfulLines(risks, 3);

  return [
    `# ${title} Roadmap`,
    "",
    `Generated from bootstrap canon on ${now}.`,
    "",
    "## Product Intent",
    "",
    ...((briefLines.length ? briefLines : intentLines).length
      ? (briefLines.length ? briefLines : intentLines).map((line) => `- ${line}`)
      : ["- Ship the first usable product loop from the bootstrap intent."]),
    "",
    "## Milestones",
    "",
    "### Milestone 1 - First usable screen",
    "",
    "Goal: get the product scaffold installed, serving locally, and visible in the browser so the next sprint starts from a running app.",
    "",
    "### Milestone 2 - Core workflow",
    "",
    "Goal: turn the bootstrap intent and golden paths into the smallest complete workflow a target user can repeat.",
    "",
    "### Milestone 3 - Quality and release path",
    "",
    "Goal: add verification, edge-case handling, and deployment readiness once the core workflow is real.",
    "",
    "## Golden Paths",
    "",
    ...(pathLines.length ? pathLines.map((line) => `- ${line}`) : ["- Open the app, understand the product, and complete the primary action."]),
    "",
    "## Active Risks",
    "",
    ...(riskLines.length ? riskLines.map((line) => `- ${line}`) : ["- Canon is first-pass bootstrap output and should be refined after the first screen is running."]),
    "",
    "## Sprint Ledger",
    "",
    "<!-- ledger:sprints -->",
    "",
    "| Sprint | Milestone | Status | Objective |",
    "|---|---|---|---|",
    "| S1 | M1 | active | Bring the first usable screen up locally from the generated scaffold. |",
    "| S2 | M2 | planned | Implement the core workflow from the highest-priority golden path. |",
    "| S3 | M3 | planned | Add verification, resilience, and release prep. |",
    "",
    "## Next Action",
    "",
    "Start with S1: confirm the generated app serves locally, then replace the scaffold landing screen with the first product-specific workflow.",
    "",
  ].join("\n");
}

function writeCurrentSprint(ctx) {
  const sprintDir = path.join(ctx.repoRoot, ".claude", "project", "sprint");
  fs.mkdirSync(sprintDir, { recursive: true });
  const body = [
    "id: S1",
    "title: First usable screen",
    "status: active",
    "phase: execution",
    "objective: Bring the first usable screen up locally from the generated scaffold.",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(sprintDir, "current-sprint.yaml"), body, "utf8");
}

async function run(ctx) {
  const { repoRoot, product, dryRun, log } = ctx;
  const dir = canonDir(ctx);

  // ── Precondition: the canon phase must have produced the grounding docs ──
  const missing = CANON_REQUIRED.filter((f) => !fs.existsSync(path.join(dir, f)));
  if (missing.length) {
    return {
      ok: false,
      status: "failed",
      message: `roadmap phase requires canon output (missing ${missing.join(", ")} under ${ctx.outDir})`,
    };
  }

  const roadmapAbs = path.join(repoRoot, "ROADMAP.md");
  const roadmapRel = "ROADMAP.md";

  // ── Already-grounded short-circuit ───────────────────────────────────────
  // If a real grounded ROADMAP.md already exists (the skill body ran
  // roadmap:create and re-invoked), the phase is done.
  if (isGroundedRoadmap(roadmapAbs)) {
    log(`grounded ROADMAP.md present (milestones + ledger anchor) → ${roadmapRel}`);
    return {
      ok: true,
      status: "done",
      message: `grounded roadmap accepted → ${roadmapRel}`,
      data: { roadmapPath: roadmapRel, grounded: true },
    };
  }

  if (ctx.args && ctx.args.auto) {
    if (dryRun) {
      log(`[dry-run] would render automatic grounded roadmap from ${ctx.outDir}`);
    } else {
      fs.writeFileSync(roadmapAbs, renderAutomaticRoadmap(ctx, dir), "utf8");
      writeCurrentSprint(ctx);
      log(`automatic grounded roadmap written -> ${roadmapRel}`);
    }
    return {
      ok: true,
      status: "done",
      message: `automatic roadmap created -> ${roadmapRel}`,
      data: {
        roadmapPath: roadmapRel,
        grounded: true,
        firstAction: "S1: Bring the first usable screen up locally from the generated scaffold.",
      },
    };
  }

  // ── Deterministic seed: scaffold an empty ROADMAP.md if none exists ──────
  // generate-roadmap-scaffold.js is idempotent and non-destructive: it writes
  // the empty product-style scaffold only when no ROADMAP.md exists, else no-op.
  const scaffoldScript = path.join(repoRoot, "scripts", "warpos", "generate-roadmap-scaffold.js");
  const scaffoldExisted = fs.existsSync(roadmapAbs);

  if (dryRun) {
    log(`[dry-run] would seed roadmap scaffold via generate-roadmap-scaffold.js (target ${repoRoot})`);
    log(`[dry-run] scaffold is an EMPTY template — grounded synthesis still needs roadmap:create`);
  } else if (!fs.existsSync(scaffoldScript)) {
    // Scaffold engine missing is non-fatal: the synthesis step (roadmap:create)
    // renders the file from scratch anyway. Just note it and proceed to orch.
    log(`scaffold engine not found at scripts/warpos/generate-roadmap-scaffold.js — skipping seed`);
  } else {
    log(`seeding roadmap scaffold (reusing generate-roadmap-scaffold.js)...`);
    const r = spawnSync(process.execPath, [scaffoldScript, repoRoot], {
      cwd: repoRoot,
      stdio: ["ignore", "inherit", "inherit"],
      windowsHide: true,
    });
    if (r.error) {
      return { ok: false, status: "failed", message: `generate-roadmap-scaffold.js failed to spawn: ${r.error.message}` };
    }
    if (r.status !== 0) {
      return {
        ok: false,
        status: "failed",
        message: `generate-roadmap-scaffold.js exited ${r.status} (target ${repoRoot})`,
      };
    }
    if (scaffoldExisted) log(`ROADMAP.md already present — scaffold left it alone (idempotent)`);
    else log(`empty roadmap scaffold written → ${roadmapRel}`);
  }

  // ── Hand the grounded synthesis back to the skill body ───────────────────
  // The scaffold is just an empty template (no grounded milestones, no sprints,
  // no ledger anchor) — it cannot satisfy AC-4.1. The MVP-core-loop-first
  // milestone+sprint synthesis from the canon's golden paths is roadmap:create's
  // LLM step. Return needs_orchestration; spinup.md (Alpha) runs roadmap:create
  // grounded in the canon, then re-invokes --resume.
  const productArg = product ? ` for product "${product}"` : "";
  return {
    ok: false,
    status: "needs_orchestration",
    message: `roadmap synthesis from canon (scaffold seeded; grounded milestones+sprints need roadmap:create)`,
    data: { roadmapPath: roadmapRel, scaffolded: !dryRun, grounded: false, canonDir: ctx.outDir },
    orchestration_prompt:
      `Run roadmap:create --source canonical grounded in ${ctx.outDir}/* ` +
      `(MVP-core-loop first: Milestone-1 sprint-1 = core loop on screen via /portfolio:spinup)${productArg}, ` +
      `rendering milestones + sprints + the <!-- ledger:sprints --> anchor into ${roadmapRel}, then re-invoke --resume.`,
  };
}

module.exports = { name: "roadmap", run, canonDir, isGroundedRoadmap, CANON_REQUIRED };
