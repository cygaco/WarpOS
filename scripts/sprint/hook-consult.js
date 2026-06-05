#!/usr/bin/env node
"use strict";

/**
 * scripts/sprint/hook-consult.js — the sprint manager_consult EMITTER (Phase D F3b).
 *
 * The runtime half of the hook-point system: at each lifecycle step the sprint
 * orchestrator computes the step's agent-set (hook-points.js router) and emits ONE
 * `manager_consult` telemetry record per agent — the proof that the right agent was
 * engaged at the right step. This is what closes ED-022: a UI sprint now emits a
 * `design-quality` manager_consult at the gauntlet step, so scan:sprint-manager-consult
 * (and the bidirectional scan:sprint-hook-coverage) can SEE the design authority ran,
 * instead of the enforcer sitting inert because nothing ever emitted.
 *
 * Telemetry shape matches what scripts/checks/sprint-manager-consult.js reads:
 *   log("manager_consult", { manager, mode, unit, verdict, phase, hook_mode }, { sprint_id, … })
 * The logger fans manager_consult events out to manager-consult.jsonl + the main log.
 * The local full.js emit() hardcodes cat:"audit", so consults call log() directly here.
 *
 * Pure-ish: the log function is injectable (default = the real logger), so the bite-test
 * captures emissions without touching disk.
 */

const hookPoints = require("./hook-points");

let _log = null;
function logger() {
  if (!_log) {
    const m = require("../hooks/lib/logger");
    _log = typeof m === "function" ? m : m.log;
  }
  return _log;
}

/**
 * Emit one manager_consult per agent in the step's matched agent-set (the
 * composition->agent-set router decides who fires). Returns the roles consulted.
 *
 * @param {string} step         a canonical lifecycle step (plan|design|build|gauntlet|release|retro)
 * @param {object} composition  { unit_types, max_risk, domains }
 * @param {string} sprintId     the sprint id (tags the records)
 * @param {function} [logFn]    injectable log(cat, data, opts) (default = real logger)
 * @returns {string[]} the roles consulted
 */
function emitStepConsults(step, composition, sprintId, logFn) {
  const emit = logFn || logger();
  const agents = hookPoints.agentsForStep(step, composition);
  for (const row of agents) {
    emit(
      "manager_consult",
      {
        manager: row.role,
        mode: "sprint",
        unit: sprintId,
        verdict: "consulted",
        phase: step,
        hook_mode: row.mode, // block | advisory (the hook-point row's mode)
      },
      { sprint_id: sprintId, actor: "alpha", source: "/sprint:full" },
    );
  }
  return agents.map((r) => r.role);
}

/**
 * Emit the INDEPENDENT design-touch signal (ui_touched) when the composition includes
 * UI/frontend work — so scan:sprint-manager-consult can require the design authority on
 * a UI sprint even if the registry's design rows are later changed. Returns whether it
 * fired. (Belt-and-suspenders alongside the design-lead/visual-review consults.)
 */
function emitDesignTouch(composition, sprintId, logFn) {
  const emit = logFn || logger();
  const comp = hookPoints.normalizeComposition(composition);
  const ui = comp.unit_types.has("ui") || comp.unit_types.has("frontend");
  if (ui) {
    emit(
      "audit",
      { kind: "sprint_full_design_touch", ui_touched: true, sprint_id: sprintId },
      { sprint_id: sprintId, actor: "alpha", source: "/sprint:full" },
    );
  }
  return ui;
}

module.exports = { emitStepConsults, emitDesignTouch };
