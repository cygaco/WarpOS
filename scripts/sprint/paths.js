#!/usr/bin/env node

/**
 * scripts/sprint/paths.js — Sprint Workflow v0.1 path resolver.
 *
 * Wraps scripts/hooks/lib/paths.js so the helpers in scripts/sprint/*
 * don't carry their own path table. Exposes:
 *
 *   const SPRINT = require("./paths");
 *   SPRINT.root                 -> absolute path to .claude/project/sprint
 *   SPRINT.current              -> absolute path to current-sprint.yaml
 *   SPRINT.progress             -> absolute path to sprint-progress.yaml
 *   SPRINT.planContracts        -> absolute path to plan-contracts/
 *   SPRINT.tickets              -> absolute path to tickets/
 *   SPRINT.issues               -> absolute path to issues/
 *   SPRINT.issuesLedger         -> absolute path to issues.md (repo root)
 *   SPRINT.externalServices     -> absolute path to external-services/
 *   SPRINT.approvals            -> absolute path to approvals/
 *   SPRINT.decisions            -> absolute path to decisions/ (sprint-scope)
 *   SPRINT.releases             -> absolute path to releases/
 *   SPRINT.ralph                -> absolute path to ralph/
 *   SPRINT.checkpoints          -> absolute path to checkpoints/
 *   SPRINT.requirements         -> absolute path to requirements/ (sprint-scope)
 *   SPRINT.history              -> absolute path to history/
 *   SPRINT.templates            -> absolute path to framework/templates/sprint/
 *   SPRINT.schemas              -> absolute path to schemas/sprint/
 *   SPRINT.routing              -> absolute path to sprint-routing.json
 *   SPRINT.reference            -> absolute path to sprint-workflow.md
 *
 *   SPRINT.PROJECT              -> repo root (absolute)
 *
 * No new dependencies. Fail-open: if PATHS lookup fails, fall back to
 * the hardcoded layout.
 */

"use strict";

const path = require("path");
const { PROJECT, PATHS } = require("../hooks/lib/paths");

function p(key, fallbackRel) {
  const v = PATHS && PATHS[key];
  if (v && typeof v === "string") return v;
  return path.join(PROJECT, fallbackRel);
}

const SPRINT = {
  PROJECT,
  root: p("sprintRoot", ".claude/project/sprint"),
  current: p("sprintCurrent", ".claude/project/sprint/current-sprint.yaml"),
  progress: p("sprintProgress", ".claude/project/sprint/sprint-progress.yaml"),
  history: p("sprintHistory", ".claude/project/sprint/history"),
  planContracts: p(
    "sprintPlanContracts",
    ".claude/project/sprint/plan-contracts",
  ),
  tickets: p("sprintTickets", ".claude/project/sprint/tickets"),
  issues: p("sprintIssues", ".claude/project/sprint/issues"),
  issuesLedger: p("sprintIssuesLedger", "issues.md"),
  externalServices: p(
    "sprintExternalServices",
    ".claude/project/sprint/external-services",
  ),
  releases: p("sprintReleases", ".claude/project/sprint/releases"),
  approvals: p("sprintApprovals", ".claude/project/sprint/approvals"),
  decisions: p("sprintDecisions", ".claude/project/sprint/decisions"),
  ralph: p("sprintRalph", ".claude/project/sprint/ralph"),
  checkpoints: p("sprintCheckpoints", ".claude/project/sprint/checkpoints"),
  requirements: p("sprintRequirements", ".claude/project/sprint/requirements"),
  templates: p("sprintTemplates", "framework/templates/sprint"),
  schemas: p("sprintSchemas", "schemas/sprint"),
  routing: p(
    "sprintRouting",
    ".claude/agents/00-alex/.system/policy/sprint-routing.json",
  ),
  reference: p(
    "sprintReference",
    ".claude/project/reference/sprint-workflow.md",
  ),
};

module.exports = SPRINT;
