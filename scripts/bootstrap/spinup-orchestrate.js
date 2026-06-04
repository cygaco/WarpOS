#!/usr/bin/env node
"use strict";
/**
 * scripts/bootstrap/spinup-orchestrate.js — the bootstrap:spinup orchestration
 * driver (SP-20260525-023). Turns the documented phase hooks in
 * .claude/commands/bootstrap/spinup.md into an executable one-command on-ramp.
 *
 * Architecture (β SP-023 Q(a)): a real driver module (mirrors scripts/canon/
 * generate.js) so --phase/--resume state is durable and the chain is CI-testable
 * via a fixture e2e — NOT skill-body string-parsing.
 *
 * BUILT in canonical, EXECUTES product-side. The driver sequences five phases and
 * persists phase-state. Each phase is a module under scripts/bootstrap/phases/
 * exporting `{ name, run(ctx) }`. DETERMINISTIC phases (preflight, canon,
 * --clone intent) do their work in-process by shelling to existing engines
 * (scripts/check/install.js, scripts/canon/generate.js, scripts/portfolio/
 * clone.js). LLM-ORCHESTRATED steps (the guided brief, roadmap:create synthesis,
 * real sprint execution) cannot run from a node process, so a phase returns
 * status `needs_orchestration` with an `orchestration_prompt`; the skill body
 * (spinup.md / Alpha) fulfills it, then re-invokes with the produced artifact.
 * This mirrors B's canon research bridge and respects the dispatch-route-guard.
 *
 * Canonical proves the CHAIN on a fixture (β Q(c)); standing up a real product
 * is a non-goal — the on-screen phase's verify-before-claim gate is implemented
 * and unit-tested, but a real serve happens product-side.
 *
 * Usage:
 *   node scripts/bootstrap/spinup-orchestrate.js \
 *     [--product "<name>"] [--intent <file.md>] [--clone <target>] \
 *     [--phase preflight|intent|canon|roadmap|onscreen] [--resume] \
 *     [--out <canonical-dir>] [--research off|simple|deep] \
 *     [--state <state-file>] [--repo-root <dir>] [--json] [--dry-run]
 *
 * Exit: 0 ok (pipeline complete or single phase done),
 *       1 phase failed,
 *       3 phase needs orchestration (skill body must fulfill + re-invoke),
 *       2 bad args.
 */

const fs = require("fs");
const path = require("path");

const PHASES = ["preflight", "intent", "canon", "roadmap", "onscreen"];
const NEEDS_ORCH = 3;

// Research TIER → raw mode (WI-25 / the operator's research-tier chooser).
//   "light"    → off    ("Light Research — Uses existing training data.")
//   "moderate" → simple ("Moderate Research — Finds newer data for better results.")
// "deep" stays a power-user RAW mode (--research deep) — never a surfaced tier.
const RESEARCH_TIERS = { light: "off", moderate: "simple" };

// The GLOBAL default tier (operator-final 2026-06-04): Moderate EVERYWHERE —
// interactive AND automated/headless. Moderate = research:"simple" = a handful of
// parallel web searches (cents, well under the $5 autonomy line), so there is no
// surprise-spend concern and no interactive/headless branch. Light is an explicit
// opt-DOWN; Deep is an explicit opt-UP and the ONE spend-guard (never auto-defaulted).
const DEFAULT_RESEARCH = "simple";

// Accept "light" as an explicit --research alias for "off" (the opt-down tier name).
function normalizeResearchMode(mode) {
  return mode === "light" ? "off" : mode;
}

function parseArgs(argv) {
  const out = {
    product: null,
    intent: null,
    clone: null,
    phase: null,
    resume: false,
    out: "_requirements/00-canonical",
    research: null, // null = not explicitly set → resolveResearch() decides
    researchTier: null,
    state: null,
    repoRoot: process.cwd(),
    json: false,
    dryRun: false,
    auto: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--product") out.product = argv[++i];
    else if (a === "--intent") out.intent = argv[++i];
    else if (a === "--clone") out.clone = argv[++i];
    else if (a === "--phase") out.phase = argv[++i];
    else if (a === "--resume") out.resume = true;
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--research") out.research = argv[++i];
    else if (a === "--research-tier") out.researchTier = argv[++i];
    else if (a === "--state") out.state = argv[++i];
    else if (a === "--repo-root") out.repoRoot = argv[++i];
    else if (a === "--json") out.json = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--auto") out.auto = true;
  }
  return out;
}

/**
 * Resolve the effective raw research mode (off|simple|deep) from the tier chooser
 * + explicit flags. Precedence:
 *   1. explicit --research <mode>       → as given ("light"→off; the ONLY deep path)
 *   2. explicit --research-tier <tier>  → light→off, moderate→simple
 *   3. no explicit choice                → DEFAULT_RESEARCH = "simple" (Moderate),
 *                                          EVERYWHERE (interactive AND headless).
 * The only spend-guard is that Deep is never auto-defaulted — it requires an
 * explicit --research deep. Moderate's cost (a few web searches) is under the $5
 * line, so it is the unconditional default with no interactive/headless branch.
 * Returns { mode, source } (source for logging/telemetry).
 */
function resolveResearch(args) {
  if (args.research) {
    return { mode: normalizeResearchMode(args.research), source: "explicit --research" };
  }
  if (args.researchTier) {
    const mode = RESEARCH_TIERS[args.researchTier];
    if (mode) return { mode, source: `--research-tier ${args.researchTier}` };
    // unknown tier handled as a bad-arg in main(); fall through defensively
  }
  return { mode: DEFAULT_RESEARCH, source: "default (Moderate)" };
}

// Durable phase-state (T6). Default location is product-side scratch under
// .warpos/; the e2e overrides via --state to a temp file.
function stateFile(args) {
  return args.state || path.join(args.repoRoot, ".warpos", "spinup-state.json");
}

function loadState(args) {
  const f = stateFile(args);
  if (fs.existsSync(f)) {
    try {
      return JSON.parse(fs.readFileSync(f, "utf8"));
    } catch {
      /* fall through to fresh */
    }
  }
  return { schema: "warpos/bootstrap/spinup-state/v1", completed: [], phases: {} };
}

function saveState(args, state) {
  if (args.dryRun) return;
  const f = stateFile(args);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(state, null, 2) + "\n", "utf8");
}

// Load a phase module. Kept lazy so a single --phase run doesn't require every
// module to be present (resilient while modules land in parallel).
function loadPhase(name) {
  return require(path.join(__dirname, "phases", `${name}.js`));
}

// Decide which phases to run this invocation.
//   --phase <name> : just that one.
//   --resume       : every phase after the last completed (preflight always re-runs — it's a gate).
//   default        : all phases in order.
function planPhases(args, state) {
  if (args.phase) {
    if (!PHASES.includes(args.phase)) return { error: `unknown phase "${args.phase}"` };
    // preflight is a gate; always run it ahead of any single non-preflight phase
    return { phases: args.phase === "preflight" ? ["preflight"] : ["preflight", args.phase] };
  }
  if (args.resume) {
    const lastIdx = state.completed.length
      ? Math.max(...state.completed.map((p) => PHASES.indexOf(p)))
      : -1;
    const remaining = PHASES.slice(lastIdx + 1);
    // preflight is a gate; always re-run it ahead of resumed work
    return { phases: remaining[0] === "preflight" ? remaining : ["preflight", ...remaining] };
  }
  return { phases: PHASES.slice() };
}

function buildCtx(args, research) {
  return {
    repoRoot: args.repoRoot,
    product: args.product,
    intentFile: args.intent,
    cloneTarget: args.clone,
    outDir: args.out,
    research, // resolved mode (off|simple|deep) — see resolveResearch()
    dryRun: args.dryRun,
    args,
    log: (m) => {
      if (!args.json) process.stdout.write(`  ${m}\n`);
    },
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.research && !["light", "off", "simple", "deep"].includes(args.research)) {
    process.stderr.write(`bad --research "${args.research}" (light|off|simple|deep)\n`);
    return 2;
  }
  if (args.researchTier && !RESEARCH_TIERS[args.researchTier]) {
    process.stderr.write(
      `bad --research-tier "${args.researchTier}" (light|moderate; "deep" is --research deep, a power-user flag)\n`,
    );
    return 2;
  }
  // Resolve the effective research mode from tier/flags/interactivity (WI-25).
  const { mode: research, source: researchSource } = resolveResearch(args);
  const state = loadState(args);
  const plan = planPhases(args, state);
  if (plan.error) {
    process.stderr.write(plan.error + "\n");
    return 2;
  }
  const ctx = buildCtx(args, research);
  if (!args.json)
    process.stdout.write(
      `spinup: research = ${research} (${researchSource})${research === "off" ? "" : " — live research spend"}\n`,
    );
  const ran = [];
  let phaseObj;
  for (const name of plan.phases) {
    try {
      phaseObj = loadPhase(name);
    } catch (e) {
      process.stderr.write(`phase module missing: ${name} (${e.message})\n`);
      return 1;
    }
    if (!args.json) process.stdout.write(`spinup: phase ${name}...\n`);
    let res;
    try {
      res = await phaseObj.run(ctx);
    } catch (e) {
      res = { ok: false, status: "failed", message: e.message };
    }
    ran.push({ phase: name, ...res });

    if (res.status === "needs_orchestration") {
      // Skill body (Alpha) must fulfill res.orchestration_prompt, then re-invoke.
      if (args.json) process.stdout.write(JSON.stringify({ ok: false, phase: name, ...res, ran }, null, 2) + "\n");
      else {
        process.stdout.write(`  NEEDS ORCHESTRATION (${name}): ${res.message}\n`);
        if (res.orchestration_prompt) process.stdout.write(`  → ${res.orchestration_prompt}\n`);
      }
      return NEEDS_ORCH;
    }
    if (!res.ok) {
      if (args.json) process.stdout.write(JSON.stringify({ ok: false, phase: name, ...res, ran }, null, 2) + "\n");
      else process.stdout.write(`  FAILED (${name}): ${res.message}\n`);
      return 1;
    }
    // record completion
    if (!state.completed.includes(name)) state.completed.push(name);
    state.phases[name] = { ok: true, at: new Date().toISOString(), data: res.data || null };
    saveState(args, state);
  }

  const lastWithData = [...ran].reverse().find((r) => r && r.data);
  const result = {
    ok: true,
    ran: ran.map((r) => r.phase),
    state_file: stateFile(args),
    completed: state.completed,
    research, // resolved mode (off|simple|deep)
    research_source: researchSource,
    data: lastWithData ? lastWithData.data : null,
  };
  if (args.json) process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  else process.stdout.write(`spinup: ${ran.length} phase(s) complete — ${ran.map((r) => r.phase).join(" → ")}\n`);
  return 0;
}

if (require.main === module) {
  main().then((code) => process.exit(code)).catch((e) => {
    process.stderr.write(`spinup-orchestrate fatal: ${e.stack || e.message}\n`);
    process.exit(1);
  });
}

module.exports = { parseArgs, planPhases, loadState, saveState, stateFile, buildCtx, resolveResearch, normalizeResearchMode, RESEARCH_TIERS, DEFAULT_RESEARCH, PHASES, NEEDS_ORCH };
