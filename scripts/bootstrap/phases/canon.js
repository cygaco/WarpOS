#!/usr/bin/env node
"use strict";
/**
 * scripts/bootstrap/phases/canon.js — Phase 2 of the bootstrap:spinup chain
 * (SP-20260525-023, ticket T-20260525-238). Satisfies S-3 (AC-3.1).
 *
 * DETERMINISTIC phase. Takes the Phase-1 intent file and turns it into the full
 * _requirements/00-canonical/* set by REUSING B's canon engine
 * (scripts/canon/generate.js, SP-022-T6). We do NOT reimplement canon here — we
 * shell to generate.js with --json and assert the engine's own success contract:
 *   exit 0  ∧  parsed.ok === true  ∧  artifacts.length === EXPECTED_ARTIFACTS  ∧  validation.ok.
 *
 * The engine's research bridge is already built (SP-022); the default research
 * mode is "off" (no spend). We pass ctx.research straight through — the LIVE
 * research:* invocation, when research !== off, is the orchestrator's job, not
 * this phase's. We never reimplement it.
 *
 * Phase-module contract (see scripts/bootstrap/spinup-orchestrate.js):
 *   ctx = { repoRoot, product, intentFile, cloneTarget, outDir, research,
 *           dryRun, args, log }
 *   run(ctx) → { ok, status: "done"|"needs_orchestration"|"failed",
 *                message, data?, orchestration_prompt? }
 *
 * No external deps; shells only to the in-repo canon engine.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { NARRATIVE, STRUCTURED } = require("../../canon/generate");

// Derived from the canon engine's own doc lists so it CAN'T rot when a canonical
// doc-type is added/removed (WI-39 added DATA_AND_ACCOUNTS → 8 narrative + 4
// structured = 12; a hardcoded count silently broke the canon phase's gate).
const EXPECTED_ARTIFACTS = NARRATIVE.length + STRUCTURED.length;

// Resolve a path argument the way ctx expects: relative to ctx.repoRoot. We pass
// generate.js absolute paths because it resolves --intent/--out against its own
// REPO_ROOT (its install tree), which is not guaranteed to equal ctx.repoRoot —
// an absolute path makes that path.resolve a no-op and lands exactly where ctx
// declares. (path.resolve ignores the base when the second arg is absolute.)
function resolveUnderRepo(repoRoot, p) {
  return path.isAbsolute(p) ? p : path.resolve(repoRoot, p);
}

async function run(ctx) {
  const { repoRoot, product, intentFile, outDir, research, dryRun, log } = ctx;

  // ── Gate: the canon phase consumes the intent phase's output ─────────────
  if (!intentFile) {
    return {
      ok: false,
      status: "failed",
      message: "canon phase requires an intent file from the intent phase",
    };
  }
  const intentAbs = resolveUnderRepo(repoRoot, intentFile);
  if (!fs.existsSync(intentAbs)) {
    return {
      ok: false,
      status: "failed",
      message: "canon phase requires an intent file from the intent phase",
    };
  }

  const generateScript = path.join(repoRoot, "scripts", "canon", "generate.js");
  const outAbs = resolveUnderRepo(repoRoot, outDir);

  const cliArgs = [
    generateScript,
    "--intent", intentAbs,
    "--product", String(product),
    "--out", outAbs,
    "--research", research,
    "--json",
  ];
  if (dryRun) cliArgs.push("--dry-run");

  log(
    `${dryRun ? "[dry-run] " : ""}generating canonical docs for "${product}" via canon engine (research=${research})...`,
  );

  // ── Invoke the canon engine; capture JSON stdout ─────────────────────────
  const r = spawnSync(process.execPath, cliArgs, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (r.error) {
    return { ok: false, status: "failed", message: `canon engine failed to spawn: ${r.error.message}` };
  }

  let parsed;
  try {
    parsed = JSON.parse(r.stdout);
  } catch (e) {
    const tail = (r.stderr || r.stdout || "").trim().split(/\r?\n/).slice(-5).join(" | ");
    return {
      ok: false,
      status: "failed",
      message: `canon engine produced unparseable JSON (exit ${r.status}): ${e.message}${tail ? ` — ${tail}` : ""}`,
    };
  }

  // ── Assert the engine's own success contract ─────────────────────────────
  const validation = parsed.validation || {};
  const artifacts = Array.isArray(parsed.artifacts) ? parsed.artifacts : [];
  const failures = [];
  if (r.status !== 0) failures.push(`engine exited ${r.status}`);
  if (parsed.ok !== true) failures.push("engine reported ok=false");
  if (artifacts.length !== EXPECTED_ARTIFACTS)
    failures.push(`expected ${EXPECTED_ARTIFACTS} artifacts, got ${artifacts.length}`);
  if (validation.ok !== true) failures.push("validation.ok=false");

  if (failures.length) {
    const errs = (validation.errors && validation.errors.length)
      ? `: ${validation.errors.join("; ")}`
      : "";
    return {
      ok: false,
      status: "failed",
      message: `canon generation failed (${failures.join("; ")})${errs}`,
    };
  }

  // ── Success ──────────────────────────────────────────────────────────────
  log(`${dryRun ? "[dry-run] would write " : "wrote "}${artifacts.length} canonical artifacts → ${outDir}`);
  if (parsed.thin_fields && parsed.thin_fields.length)
    log(`${parsed.thin_fields.length} thin field(s) with no intent source: ${parsed.thin_fields.join(", ")}${research === "off" ? " (research off — no spend)" : ""}`);

  return {
    ok: true,
    status: "done",
    message: `canon: ${dryRun ? "validated" : "generated"} ${artifacts.length} canonical artifacts for "${product}" → ${outDir}`,
    data: {
      out: outDir,
      artifacts,
      thin_fields: parsed.thin_fields || [],
    },
  };
}

module.exports = { name: "canon", run };
