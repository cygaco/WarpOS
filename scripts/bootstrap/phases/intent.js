#!/usr/bin/env node
"use strict";
/**
 * scripts/bootstrap/phases/intent.js — Phase 1 of the bootstrap:spinup chain
 * (SP-20260525-023, ticket T-20260525-237). Satisfies S-2 (AC-2.1, AC-2.2).
 *
 * Two intent modes, mirroring the documented spinup.md contract:
 *
 *   • --clone <target>  (DETERMINISTIC): derive intent from a competitor by
 *     REUSING the existing clone engine (scripts/portfolio/clone.js) via a
 *     child process. We do NOT reimplement it. The clone doc is written under
 *     _docs/clones/<slug>/<slug>.clone.md and that path is handed to the canon
 *     phase as its --intent file. (AC-2.2)
 *
 *   • default brief     (LLM-ORCHESTRATED): the guided brief is a discussion a
 *     node process cannot run. So if the skill body already produced a brief
 *     (--intent <file>) we accept it; otherwise we return needs_orchestration
 *     with a prompt for Alpha/spinup.md to run the brief and re-invoke. (AC-2.1)
 *
 * Phase-module contract (see scripts/bootstrap/spinup-orchestrate.js):
 *   ctx = { repoRoot, product, intentFile, cloneTarget, outDir, research,
 *           dryRun, args, log }
 *   run(ctx) → { ok, status: "done"|"needs_orchestration"|"failed",
 *                message, data?, orchestration_prompt? }
 *
 * No external deps; shells only to the in-repo clone engine.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// Lazily require the existing clone engine purely for its slug derivation —
// requiring it has no side effects (main() only runs when it IS the entrypoint).
function loadCloneEngine(repoRoot) {
  return require(path.join(repoRoot, "scripts", "portfolio", "clone.js"));
}

// A --clone target is documented as "<competitor-name|url>". Decide which CLI
// flag clone.js should receive, and derive the slug the same way clone.js will
// so we can locate the doc it writes (_docs/clones/<slug>/<slug>.clone.md).
function planClone(repoRoot, cloneTarget) {
  const engine = loadCloneEngine(repoRoot);
  const raw = String(cloneTarget).trim();
  let urlObj = null;
  if (/^https?:\/\//i.test(raw)) {
    try {
      urlObj = new URL(raw);
    } catch {
      urlObj = null;
    }
  }
  const isUrl = Boolean(urlObj);
  const slug = engine.deriveSlug({
    slug: null,
    name: isUrl ? null : raw,
    urlObj,
  });
  const cliFlag = isUrl ? "--url" : "--name";
  const outputDirRel = path.posix.join("_docs", "clones", slug);
  const docRel = path.posix.join(outputDirRel, `${slug}.clone.md`);
  return { slug, cliFlag, isUrl, outputDirRel, docRel };
}

// Resolve the repo-relative brief root (paths.briefsRoot) from the in-repo paths
// registry so reuse tracks the registry rather than a hardcoded "_docs/briefs".
// Falls back to the documented default if the registry can't be read.
function briefsRootRel(repoRoot) {
  const fallback = "_docs/briefs";
  try {
    const reg = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "framework", "paths.registry.json"), "utf8"),
    );
    const entries = reg.paths || reg;
    return (entries.briefsRoot && entries.briefsRoot.path) || fallback;
  } catch {
    return fallback;
  }
}

// Derive the brief slug from --product the same way clone.js does, so reuse
// matches what /portfolio:new --from-brief and prior spinups write. Returns null
// when no product name is available (caller then falls through to orchestration).
function deriveProductSlug(repoRoot, product) {
  if (!product) return null;
  try {
    const engine = loadCloneEngine(repoRoot);
    return engine.deriveSlug({ slug: null, name: String(product), urlObj: null }) || null;
  } catch {
    // Engine unavailable — minimal inline slugify mirroring deriveSlug's shape.
    return (
      String(product)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || null
    );
  }
}

// G4.6: locate an existing founding brief for this product under paths.briefsRoot.
// Returns the repo-relative POSIX path to <slug>.brief.md (or the first *.md in
// the slug dir) when present, else null.
function findExistingBrief(ctx) {
  const { repoRoot, product } = ctx;
  const slug = deriveProductSlug(repoRoot, product);
  if (!slug) return null;
  const rootRel = briefsRootRel(repoRoot);
  const dirRel = path.posix.join(rootRel, slug);
  const dirAbs = path.join(repoRoot, dirRel);
  if (!fs.existsSync(dirAbs)) return null;
  let docName = null;
  try {
    const files = fs.readdirSync(dirAbs);
    docName =
      files.find((f) => f === `${slug}.brief.md`) ||
      files.find((f) => f.endsWith(".md")) ||
      null;
  } catch {
    return null;
  }
  if (!docName) return null;
  return path.posix.join(dirRel, docName);
}

async function run(ctx) {
  const { repoRoot, cloneTarget, intentFile, dryRun, log } = ctx;

  // ── Mode A: --clone <target> → reuse scripts/portfolio/clone.js ──────────
  if (cloneTarget) {
    let plan;
    try {
      plan = planClone(repoRoot, cloneTarget);
    } catch (e) {
      return { ok: false, status: "failed", message: `cannot plan clone for '${cloneTarget}': ${e.message}` };
    }
    if (!plan.slug) {
      return {
        ok: false,
        status: "failed",
        message: `--clone '${cloneTarget}' produced an empty slug; pass a competitor name or http(s) URL`,
      };
    }
    const cloneScript = path.join(repoRoot, "scripts", "portfolio", "clone.js");
    const docAbsRel = plan.docRel; // repoRoot-relative, forward-slashed

    if (dryRun) {
      log(`[dry-run] would run clone.js ${plan.cliFlag} "${cloneTarget}" --slug ${plan.slug}`);
      log(`[dry-run] clone doc would land at ${docAbsRel}`);
      return {
        ok: true,
        status: "done",
        message: `[dry-run] intent via --clone ${cloneTarget} → ${docAbsRel}`,
        data: { intentFile: docAbsRel, slug: plan.slug, mode: "clone", dryRun: true },
      };
    }

    log(`deriving intent from competitor '${cloneTarget}' (reusing clone.js)...`);
    const r = spawnSync(
      process.execPath,
      [cloneScript, plan.cliFlag, cloneTarget, "--slug", plan.slug],
      {
        cwd: repoRoot,
        stdio: ["ignore", "inherit", "inherit"],
        windowsHide: true,
      },
    );
    if (r.error) {
      return { ok: false, status: "failed", message: `clone.js failed to spawn: ${r.error.message}` };
    }
    if (r.status !== 0) {
      return {
        ok: false,
        status: "failed",
        message: `clone.js exited ${r.status} for '${cloneTarget}' (no clone doc produced)`,
      };
    }

    // clone.js always emits <slug>.clone.md on a zero exit; verify it landed.
    const docAbs = path.join(repoRoot, plan.outputDirRel, `${plan.slug}.clone.md`);
    if (!fs.existsSync(docAbs)) {
      return {
        ok: false,
        status: "failed",
        message: `clone.js exited 0 but expected doc is missing: ${docAbsRel}`,
      };
    }
    log(`clone doc written → ${docAbsRel}`);
    return {
      ok: true,
      status: "done",
      message: `intent derived from competitor '${cloneTarget}' → ${docAbsRel}`,
      data: { intentFile: docAbsRel, slug: plan.slug, mode: "clone" },
    };
  }

  // ── Mode B: default guided brief (LLM-orchestrated) ──────────────────────
  // The brief is a discussion; a node process can't run it. If the skill body
  // already produced one (--intent <file> that exists), accept it; otherwise
  // ask the orchestrator (Alpha/spinup.md) to run the brief and re-invoke.

  // G4.6 brief-reuse: before asking for a (re-)interrogation, look for a brief
  // this product already has under paths.briefsRoot (e.g. one /portfolio:new
  // --from-brief adopted, or a prior spinup wrote). If <slug>.brief.md exists,
  // reuse it as the intent and skip the guided discussion entirely. The slug is
  // derived from --product the same way clone.js derives slugs, so the lookup
  // matches what other portfolio tooling writes. Only consult this when the
  // operator didn't pin an explicit --intent path (that takes precedence below).
  if (!intentFile) {
    const reused = findExistingBrief(ctx);
    if (reused) {
      if (dryRun) log(`[dry-run] would reuse existing brief at ${reused}`);
      else log(`reusing existing product brief at ${reused} (skipping guided brief)`);
      return {
        ok: true,
        status: "done",
        message: `existing brief reused → ${reused}`,
        data: { intentFile: reused, mode: "brief-reuse" },
      };
    }
  }

  if (intentFile) {
    const abs = path.isAbsolute(intentFile) ? intentFile : path.join(repoRoot, intentFile);
    if (fs.existsSync(abs)) {
      if (dryRun) {
        log(`[dry-run] would accept existing brief at ${intentFile}`);
      } else {
        log(`accepting product brief at ${intentFile}`);
      }
      return {
        ok: true,
        status: "done",
        message: `intent brief accepted → ${intentFile}`,
        data: { intentFile, mode: "brief" },
      };
    }
    // --intent was passed but the file isn't there yet → needs the brief run.
    return {
      ok: false,
      status: "needs_orchestration",
      message: `guided brief required (intent file not found: ${intentFile})`,
      orchestration_prompt:
        `Run the bootstrap:spinup guided brief discussion and write the product brief to ${intentFile}, then re-invoke with --intent ${intentFile}.`,
    };
  }

  // No --clone and no --intent: nowhere to read a brief from.
  const suggested = path.posix.join(".warpos", "spinup-brief.md");
  return {
    ok: false,
    status: "needs_orchestration",
    message: "guided brief required",
    orchestration_prompt:
      `Run the bootstrap:spinup guided brief discussion and write the product brief to ${suggested}, then re-invoke with --intent ${suggested}.`,
  };
}

module.exports = { name: "intent", run, planClone };
