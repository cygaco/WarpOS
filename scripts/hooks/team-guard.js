#!/usr/bin/env node
// PreToolUse hook: enforces two-tier agent spawning in adhoc mode.
//
// Layer 1 (teammates): Beta (β) + Gamma (γ) ONLY.
// Alpha-allowed (research/cognition): Explore, Plan, general-purpose
// Gamma-only (build/execution): builder, fixer, reviewer, compliance,
//   learner, qa, redteam, gamma, delta
//
// This restriction ONLY applies during mode:adhoc (active team session).
// Solo mode = no restrictions.

const fs = require("fs");
const path = require("path");

// S-LC-01: the bootstrap-face allow-list is the union of every mode's roster,
// resolved FROM the Mode-Lifecycle Registry (.claude/agents/_org/mode-lifecycle.json)
// via the shared reader — NOT a hardcoded literal. Fail-open to the known set if
// the reader is unavailable (a guard must never crash); the registry is the
// authoritative source (drift is caught by scripts/checks/mode-lifecycle-registry.js).
let modeFaces;
try {
  modeFaces = require("./lib/mode-lifecycle").allFaces();
  if (!(modeFaces instanceof Set) || modeFaces.size === 0)
    throw new Error("empty face set");
} catch {
  modeFaces = new Set(["epsilon", "beta", "gamma", "delta"]);
}

// Build-chain agent types that only Gamma should dispatch. CONFIG-DRIVEN from
// the org map via scripts/dispatch/org-roles.js (S1.1 chassis): org-map domain
// builders[] + gauntlet members + a documented static augment (legacy rename
// aliases evaluator/auditor/fix-agent + transitional/system roles). Adding a
// Wave-2 domain builder to org-map.json auto-gates it here — no edit needed.
// FAIL-SAFE: if org-roles can't load, fall back to the known build-chain set —
// NEVER an empty gate (empty = permit-all = the exact gate hole this guards).
let GAMMA_ONLY_TYPES;
try {
  GAMMA_ONLY_TYPES = require("../dispatch/org-roles").gammaOnlyTypes();
  if (!(GAMMA_ONLY_TYPES instanceof Set) || GAMMA_ONLY_TYPES.size === 0)
    throw new Error("empty gamma-only set");
} catch {
  GAMMA_ONLY_TYPES = new Set([
    "builder", "fixer", "fix-agent", "reviewer", "evaluator", "compliance",
    "ops-analyst", "learner", "auditor", "qa", "redteam", "delta", // S-7: learner→ops-analyst (legacy ids kept)
    "skeleton-builder", "stub-scaffold", // S-7: stub-scaffold→skeleton-builder (legacy kept)
    "frontend-builder", "backend-builder",
  ]);
}

// Agent names/types that are allowed as teammates (Layer 1)
const TEAMMATE_NAMES = ["beta", "gamma", "β", "γ"];
const TEAMMATE_TYPES = new Set(["beta", "gamma"]);

// S-12c heartbeat-liveness (false-block mitigation #1). The (a)/(b) liveness uses
// a 24h config-mtime window; a correct team that has merely been IDLE >24h would
// read "not live" and the hard gate would false-block. A sid-keyed
// ~/.claude/runtime/.team-live-<sid> marker — written when a correct team is
// confirmed up — asserts liveness by PRESENCE (sid-scoped, so a crashed session's
// marker never matches the live .session-id), independent of config freshness.
// Fail-CLOSED to "not fresh" on any error (the caller treats absence as "verify via
// config" — it never *grants* readiness on an exception).
function teamHeartbeatFresh(projectDir) {
  try {
    const sidPath = path.join(projectDir, ".claude", "runtime", ".session-id");
    if (!fs.existsSync(sidPath)) return false;
    const sid = fs.readFileSync(sidPath, "utf8").trim();
    if (!sid) return false;
    const hbPath = path.join(
      process.env.HOME || process.env.USERPROFILE || "",
      ".claude",
      "runtime",
      `.team-live-${sid}`,
    );
    if (!fs.existsSync(hbPath)) return false;
    // Presence is the signal; sid-scoping is the real staleness guard. Bound the
    // age generously (7d) so a same-sid resume after a very long idle re-verifies,
    // while still surviving the 24h config-mtime window this exists to bypass.
    const m = fs.statSync(hbPath).mtimeMs;
    return (Date.now() - m) / 3600000 < 168;
  } catch {
    return false;
  }
}

// ── S-LC-04: REGISTRY-DRIVEN init-gate helpers (E-LIFECYCLE-001) ──────────────
// Generalize the gate from a HARDCODED sprint-only ε literal to the
// Mode-Lifecycle Registry (.claude/agents/_org/mode-lifecycle.json) via the
// shared reader. The required CONDUCTOR face for a requires_team mode is the
// FIRST non-alpha face in the mode's roster (sprint → epsilon, adhoc → beta).
// Editing a mode's roster in the registry re-points the gate with NO code change
// (the de-dup S-LC-01 did). FAIL-OPEN throughout — a guard must never crash on an
// unreadable/malformed registry; the reader already mirrors FALLBACK, and these
// wrappers swallow any residual error so the sprint gate can never widen and a
// non-sprint mode can never block on a registry fault.
const FACE_SYMBOL = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
};

/** The registry-derived conductor/lead face a requires_team mode must carry, as
 *  { id, symbol }. FAIL-OPEN to the known sprint conductor (ε) so a registry read
 *  failure can never widen the DEFAULT-ON sprint gate; null for an unknown/teamless
 *  mode. */
function requiredConductor(mode) {
  try {
    const f = require("./lib/mode-lifecycle").faces(mode);
    if (Array.isArray(f) && f.length) {
      const id = String(f[0]).toLowerCase();
      return { id, symbol: FACE_SYMBOL[id] || id };
    }
  } catch {
    /* fall through to the fail-open default */
  }
  return String(mode || "").toLowerCase() === "sprint"
    ? { id: "epsilon", symbol: "ε" }
    : null;
}

/** Does the mode operate through a persistent team (registry requires_team)?
 *  FAIL-OPEN to false (no readiness gate) on any reader error. */
function requiresTeamMode(mode) {
  try {
    return !!require("./lib/mode-lifecycle").requiresTeam(mode);
  } catch {
    return false;
  }
}

/** Does any FRESH (<24h) active team under ~/.claude/teams carry the given
 *  conductor face? EXACT identity match (id or symbol) — spoof-safe like the
 *  sprint path. FAIL-OPEN to false (caller treats false as "not ready"; for a
 *  non-sprint mode that only ADVISES — never blocks). */
function teamCarriesConductor(conductor) {
  if (!conductor) return false;
  try {
    const teamsRoot = path.join(
      process.env.HOME || process.env.USERPROFILE || "",
      ".claude",
      "teams",
    );
    if (!fs.existsSync(teamsRoot)) return false;
    const isConductor = (v) => {
      const s = String(v == null ? "" : v).trim().toLowerCase();
      return s === conductor.id || s === conductor.symbol;
    };
    for (const d of fs.readdirSync(teamsRoot)) {
      const cfg = path.join(teamsRoot, d, "config.json");
      try {
        const m = fs.statSync(cfg).mtimeMs;
        if ((Date.now() - m) / 3600000 >= 24) continue;
        const doc = JSON.parse(fs.readFileSync(cfg, "utf8"));
        const has = (doc.members || []).some(
          (mem) =>
            mem &&
            (isConductor(mem.agentType) ||
              isConductor(mem.role) ||
              isConductor(mem.name)),
        );
        if (has) return true;
      } catch {
        /* skip this unreadable team dir */
      }
    }
  } catch {
    /* no teams dir / unreadable — not ready */
  }
  return false;
}

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);
    const toolName = event.tool_name;

    // Debug log — wrapped in its own try/catch so a filesystem failure here
    // CANNOT silently disable the guard. RT-013: previously this write
    // targeted .claude/logs/ (which doesn't exist in most projects), threw
    // ENOENT, hit the outer catch, and exited 0 — silently permitting every
    // build-chain dispatch throughout any adhoc session. Never again.
    try {
      const logDir = path.resolve(__dirname, "..", "..", ".claude", "runtime");
      fs.mkdirSync(logDir, { recursive: true });
      const logPath = path.join(logDir, "team-guard-debug.log");
      fs.appendFileSync(
        logPath,
        JSON.stringify({
          ts: new Date().toISOString(),
          toolName,
          keys: Object.keys(event.tool_input || {}),
          team_name: (event.tool_input || {}).team_name,
          name: (event.tool_input || {}).name,
          subagent_type: (event.tool_input || {}).subagent_type,
        }) + "\n",
      );
    } catch {
      // Debug failures must never disable the guard.
    }

    // Only check Agent tool
    if (toolName !== "Agent") {
      process.exit(0);
    }

    const toolInput = event.tool_input || {};
    const agentType = (toolInput.subagent_type || "").toLowerCase();
    const agentName = (toolInput.name || "").toLowerCase();

    // Always allow Beta and Gamma teammates.
    // Name check uses exact-match-after-normalize (strip parens/spaces) so
    // that "Beta (β)" resolves to "beta" but a sneaky "beta-builder" does
    // not. Previous `includes()` was a bypass path for build-chain calls.
    const isTeammateType = TEAMMATE_TYPES.has(agentType);
    const normalizedName = agentName.replace(/[\s()\[\]]+/g, "");
    const isTeammateName = TEAMMATE_NAMES.includes(normalizedName);
    if (isTeammateType || isTeammateName) {
      process.exit(0);
    }

    // Mode resolution — check mode.json FIRST. RT-013 follow-up: previously
    // this only checked ~/.claude/teams/adhoc/ which persists across mode
    // switches. If user ran /mode:adhoc then /mode:oneshot, the adhoc
    // heartbeat lingered and Delta would get blocked from dispatching
    // builders — halting run-10 at Phase 2 with a cryptic team-guard
    // message. Fix: read the authoritative mode marker first.
    const projectDir =
      process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
    const modePath = path.join(projectDir, ".claude", "runtime", "mode.json");

    let currentMode = null;
    try {
      if (fs.existsSync(modePath)) {
        const modeDoc = JSON.parse(fs.readFileSync(modePath, "utf8"));
        currentMode = (modeDoc.mode || "").toLowerCase();
      }
    } catch {
      // Malformed mode.json = fall through to adhoc heartbeat check
    }

    // Oneshot mode: Delta IS the orchestrator and must dispatch the full
    // build chain. Allow everything. Context-overfill protection is a
    // prompt-shape concern (JSON envelope constraint in builder prompts),
    // not a dispatch-permission concern — enforced elsewhere.
    if (currentMode === "oneshot") {
      process.exit(0);
    }

    // Solo mode: explicit opt-out of restrictions.
    if (currentMode === "solo") {
      process.exit(0);
    }

    // ── Sprint-context persistent-team advisory (ED-035) ──────────────────
    // In sprint mode the operator expects work to flow through a PERSISTENT team
    // (TeamCreate + named members, reusable + DM-able), NOT fire-and-forget one-off
    // agents. The team-spawn step lives inside /mode:sprint's body — bypassed when a
    // session kicks off from a /clear'd handoff with "/mode:sprint" as embedded text
    // (treated as context, the Skill never invoked) — so it skips SILENTLY and recurs
    // (RT-2026-06-06-sprint-team-orphaned-by-node-seam + the 2026-06-08 recurrence).
    // This fires at the dispatch — the exact skip point — reading the persisted mode
    // marker, OUTSIDE the bypassed /mode:sprint caller. ADVISORY ONLY: it never blocks
    // (blocking my own orchestration is too risky); it ramps by counting one-off worker
    // dispatches and suppresses once a persistent team is active. Fail-open throughout.
    if (currentMode === "sprint") {
      const hasTeamName = !!(
        toolInput.team_name && String(toolInput.team_name).trim()
      );
      // Bootstrap + read-only ALLOW-list (S-12c airtight against false-block #2,
      // bootstrap deadlock): the company FACES (so the team CAN be stood up — β/γ
      // already exited above via TEAMMATE_TYPES; ε/δ must be allowed here too) and
      // research/cognition one-offs (legitimately not "the team"). A WORKER is
      // anything else with a subagent_type (general-purpose + the build-chain
      // GAMMA_ONLY_TYPES) — that is what the gate guards.
      const FACE_TYPES = modeFaces; // registry-derived (see module head, S-LC-01)
      const RESEARCH_TYPES = new Set(["explore", "plan"]);
      const isWorker =
        agentType && !FACE_TYPES.has(agentType) && !RESEARCH_TYPES.has(agentType);
      if (hasTeamName || !isWorker) {
        // into-team dispatch, a face (bootstrap), or a legit research one-off
        process.exit(0);
      }
      // Is a persistent team active, AND does it carry ε (the sprint conductor /
      // quality-gate)? The persistent SPRINT team is the named company faces α+ε+β
      // — a team of only generic workers with NO ε is the 2nd miss the operator
      // caught 2026-06-08 ("this isn't the persistent team I imagined — where's
      // epsilon?"). Read the freshest active team config + check members for ε.
      let activeCfg = null;
      let activeMtime = 0;
      try {
        const teamsRoot = path.join(
          process.env.HOME || process.env.USERPROFILE || "",
          ".claude",
          "teams",
        );
        if (fs.existsSync(teamsRoot)) {
          for (const d of fs.readdirSync(teamsRoot)) {
            const cfg = path.join(teamsRoot, d, "config.json");
            try {
              const m = fs.statSync(cfg).mtimeMs;
              if ((Date.now() - m) / 3600000 < 24 && m > activeMtime) {
                activeCfg = cfg;
                activeMtime = m;
              }
            } catch {
              /* skip this team dir */
            }
          }
        }
      } catch {
        /* no teams dir — treat as no active team */
      }
      const teamActive = !!activeCfg;
      // S-LC-04: the required CONDUCTOR face is now REGISTRY-DRIVEN (resolved from
      // mode-lifecycle.json via lib/mode-lifecycle → faces(mode)[0]), NOT a
      // hardcoded "epsilon" literal. For sprint the registry/FALLBACK yields ε, so
      // this is BEHAVIOR-IDENTICAL to the prior hardcoded check (golden-preserved);
      // a registry that names a different sprint conductor re-points the gate with
      // no code change. FAIL-OPEN: requiredConductor() falls back to ε for sprint
      // if the reader is unavailable, so a read failure can never widen the gate.
      const conductor = requiredConductor(currentMode) || {
        id: "epsilon",
        symbol: "ε",
      };
      let teamHasEpsilon = false;
      if (activeCfg) {
        try {
          const doc = JSON.parse(fs.readFileSync(activeCfg, "utf8"));
          // EXACT role/type/name match, not a substring (cross-provider review
          // 2026-06-08 HIGH: `/epsilon/` matched a spoof worker `epsilon-helper`;
          // also check mem.role, the schema's real authority). A member counts as
          // the conductor only if a normalized identity field EQUALS the registry
          // conductor id or its symbol.
          const isConductor = (v) => {
            const s = String(v == null ? "" : v).trim().toLowerCase();
            return s === conductor.id || s === conductor.symbol;
          };
          teamHasEpsilon = (doc.members || []).some(
            (mem) =>
              mem &&
              (isConductor(mem.agentType) ||
                isConductor(mem.role) ||
                isConductor(mem.name)),
          );
        } catch {
          /* malformed config — treat the conductor as absent */
        }
      }
      const teamReady = teamActive && teamHasEpsilon;

      // ── S-12c — HARD PreToolUse readiness GATE (un-skippable team-init) ──────
      // Ramps advisory→block: DEFAULT OFF (the (b) advisory below runs as today).
      // When the operator flips HARD_GATE on (env WARPOS_TEAM_GATE_HARD=1 OR a
      // .claude/runtime/.team-gate-hard marker), a WORKER dispatch with no correct
      // team live is BLOCKED from the 1st (NO ramp — un-skippable), while the
      // bootstrap/read-only ALLOW-list above keeps the team standable-up. Three
      // false-block guards: (1) heartbeat-liveness so a long-idle correct team is
      // still "live"; (2) a kill-switch so a stuck gate is bypassable without
      // editing the hook; (3) fail-open via the outer try/catch.
      // S-12c MECHANICAL: the hard gate now DEFAULTS ON (operator 2026-06-08:
      // "it must ship enabled — an enforcement that depends on you flipping a
      // marker isn't an enforcement"). The kill-switch below (env or marker) is
      // the durable escape; the heartbeat + fail-open guard against false-blocks.
      // The old WARPOS_TEAM_GATE_HARD / .team-gate-hard opt-IN is retained as a
      // belt-and-suspenders force-on, but absence no longer disables the gate.
      const hardGate = process.env.WARPOS_TEAM_GATE_SOFT !== "1";
      const killSwitch =
        process.env.WARPOS_DISABLE_TEAM_GATE === "1" ||
        fs.existsSync(
          path.join(projectDir, ".claude", "runtime", ".team-gate-off"),
        );
      // Liveness = the correct team is ready by config (fresh + ε) OR a sid-keyed
      // heartbeat confirms it up independent of the 24h config-mtime window.
      const teamLive = teamReady || teamHeartbeatFresh(projectDir);
      if (hardGate && !killSwitch && !teamLive) {
        const why = !teamActive
          ? "no active persistent team"
          : "the active team is MISSING ε (the sprint conductor / quality-gate)";
        process.stdout.write(
          JSON.stringify({
            decision: "block",
            reason:
              `⛔ SPRINT MODE + no correct team live (${why}). Stand up the company ` +
              `faces FIRST — TeamCreate {name:"warpos-sprint"}, then ` +
              `Agent(subagent_type:epsilon …) + Agent(subagent_type:beta …) — then ` +
              `dispatch workers through the team (pass team_name). Bootstrap calls ` +
              `(faces / explore / plan / any team_name) are allowed. Kill-switch: ` +
              `WARPOS_DISABLE_TEAM_GATE=1 or touch .claude/runtime/.team-gate-off. ` +
              `(E-SYSTEM-ORG-001 S-12c)`,
          }),
        );
        process.exit(0);
      }

      // Per-session one-off counter (best-effort ramp; advise once the PATTERN shows).
      let n = 1;
      try {
        const cPath = path.join(
          projectDir,
          ".claude",
          "runtime",
          ".sprint-oneoff-count",
        );
        n = (parseInt(fs.readFileSync(cPath, "utf8"), 10) || 0) + 1;
        fs.writeFileSync(cPath, teamReady ? "0" : String(n));
      } catch {
        /* counter is best-effort */
      }
      if (!teamReady && n >= 2) {
        const advice = !teamActive
          ? `no active persistent team — stand up the company faces (TeamCreate + ` +
            `subagent_type epsilon + beta; α leads, ε conducts) before fanning out`
          : `a team is active but it is MISSING ε (Epsilon — the sprint conductor / ` +
            `quality-gate). The persistent SPRINT team is the named faces α+ε+β, not ` +
            `generic general-purpose workers — spawn subagent_type:epsilon into the team`;
        process.stdout.write(
          JSON.stringify({
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              additionalContext:
                `[team-guard] SPRINT MODE + one-off worker dispatch #${n} (no ` +
                `team_name): ${advice}. (ED-035; the no-team skip recurred 2026-06-06 ` +
                `and the wrong-roster/missing-ε miss 2026-06-08.) Advisory, not a block.`,
            },
          }),
        );
      }
      process.exit(0);
    }

    // Adhoc mode: either explicit mode.json or the legacy heartbeat check.
    // Directory existence alone is insufficient — it persists after crashes.
    // smart-context.js writes heartbeat.json with the current session ID.
    // If the session ID doesn't match, this is a stale team from a crash.
    let inAdhocMode = currentMode === "adhoc";
    if (!inAdhocMode) {
      const adhocDir = path.join(
        process.env.HOME || process.env.USERPROFILE || "",
        ".claude",
        "teams",
        "adhoc",
      );
      try {
        if (fs.existsSync(adhocDir)) {
          const hbPath = path.join(adhocDir, "heartbeat.json");
          const sidPath = path.join(
            projectDir,
            ".claude",
            "runtime",
            ".session-id",
          );
          if (fs.existsSync(hbPath) && fs.existsSync(sidPath)) {
            const hb = JSON.parse(fs.readFileSync(hbPath, "utf8"));
            const currentSid = fs.readFileSync(sidPath, "utf8").trim();
            inAdhocMode = hb.sessionId === currentSid;
          } else if (!fs.existsSync(hbPath)) {
            // No heartbeat file = team just created, not yet pulsed.
            inAdhocMode = true;
          }
        }
      } catch {
        // Filesystem error = assume not in team mode
      }
    }

    if (!inAdhocMode) {
      // Solo mode (implicit) — no restrictions
      process.exit(0);
    }

    // In adhoc mode: block build-chain agents
    if (GAMMA_ONLY_TYPES.has(agentType)) {
      const result = {
        decision: "block",
        reason:
          `[team-guard] Agent type "${agentType}" is build-chain — ` +
          `route through Gamma (γ) in adhoc mode. ` +
          `Alpha can spawn: Explore, Plan, general-purpose. ` +
          `Gamma dispatches: builder, fixer, reviewer, compliance, learner, qa, redteam.`,
      };
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }

    // ── S-LC-04 generalized init-gate — REPORT-ONLY for non-sprint modes ──────
    // The §8.6 mode-init checklist's team-readiness item, GENERALIZED across all
    // modes and resolved FROM the Mode-Lifecycle Registry (requires_team +
    // conductor face) — NOT hardcoded. Sprint keeps its DEFAULT-ON hard gate
    // (handled in the sprint branch above). For a NON-sprint mode that requires a
    // team (adhoc), the gate runs REPORT-ONLY this sprint: it emits an advisory
    // and ALLOWS — it NEVER blocks. The flip-to-blocking for other modes needs
    // §22 #4 operator sign-off (NOT this sprint). Ramped + suppressed-when-ready
    // to bound noise; fail-open throughout. (E-LIFECYCLE-001 S-LC-04)
    try {
      if (
        currentMode &&
        currentMode !== "sprint" &&
        requiresTeamMode(currentMode)
      ) {
        const isFace = modeFaces.has(agentType);
        const isResearch = agentType === "explore" || agentType === "plan";
        const isWorkerish = !!agentType && !isFace && !isResearch;
        if (isWorkerish) {
          const conductor = requiredConductor(currentMode);
          const ready = teamCarriesConductor(conductor);
          // Per-mode ramp counter (mirrors the sprint advisory): advise on the
          // 2nd+ worker when no ready team is live; reset to 0 once ready — so a
          // repeated init for the SAME mode never duplicates/escalates work.
          // FIX (S-LC-04 security false-green): the READ lives in its OWN try so a
          // missing/unreadable file (COLD START — first dispatch in a fresh proj)
          // defaults the prior count to 0 instead of aborting before the WRITE.
          // Previously read+write shared one try: a cold-start ENOENT on read
          // skipped the write, the file was NEVER created, every run re-hit ENOENT,
          // n stayed 1 forever, and the n>=2 advisory was DEAD in production.
          // Per-mode filename so alternating non-sprint requires_team modes ramp
          // independently (no cross-mode counter pollution).
          const safeMode = String(currentMode)
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "");
          const cPath = path.join(
            projectDir,
            ".claude",
            "runtime",
            `.initgate-${safeMode}-oneoff-count`,
          );
          let prev = 0;
          try {
            prev = parseInt(fs.readFileSync(cPath, "utf8"), 10) || 0;
          } catch {
            /* cold start / unreadable => prior count defaults to 0 */
          }
          const n = prev + 1;
          // ALWAYS persist (creating the file on cold start). Wrap the WRITE so a
          // failure degrades to "no advisory" — fail-open, never throw/block.
          let wrote = false;
          try {
            fs.writeFileSync(cPath, ready ? "0" : String(n));
            wrote = true;
          } catch {
            /* write failure => degrade to no advisory; never crash the dispatch */
          }
          if (wrote && !ready && n >= 2) {
            const sym = conductor ? conductor.symbol : "the lead face";
            process.stdout.write(
              JSON.stringify({
                hookSpecificOutput: {
                  hookEventName: "PreToolUse",
                  additionalContext:
                    `[init-gate] ${currentMode.toUpperCase()} requires a persistent ` +
                    `team (registry requires_team=true) but none carrying ${sym} is ` +
                    `live — worker dispatch #${n}. Stand up the mode's faces before ` +
                    `fanning out. REPORT-ONLY this sprint (does NOT block; flip-to-` +
                    `blocking for other modes needs §22 #4 sign-off). ` +
                    `(E-LIFECYCLE-001 S-LC-04)`,
                },
              }),
            );
          }
        }
      }
    } catch {
      /* generalized gate is report-only + fail-open — never disturb dispatch */
    }

    // Research agents (Explore, Plan, general-purpose, etc.) — allowed
    process.exit(0);
  } catch (err) {
    // Don't block on infrastructure errors
    process.exit(0);
  }
});
