#!/usr/bin/env node

/**
 * scripts/warpos/scaffold-core.js — shared product-scaffold core.
 *
 * SP-20260525-019 / T-20260525-219.
 *
 * THE EXTRACTION: this module holds the product-scaffold logic that previously
 * lived inline in scripts/warp-setup.js (added by SP-20260525-018 + the
 * SP-20260525-003 _warpos/ source-mirror migration). warp-setup.js now requires
 * this module and calls these functions in place of the inline blocks. The goal
 * is a SINGLE shared scaffold core so other install/adopt entry points can reuse
 * the exact same product-scaffolding behavior without copy-pasting it.
 *
 * GUARDRAIL (T-219): this was a pure file MOVE, not a rewrite. The function
 * bodies are the same code, only relocated and parameterized (TARGET → target,
 * WARPOS → warposRoot, the `log` reporter, and `shipManifest` passed in). No
 * registry keys, dir lists, or ordering changed. Idempotency (check-before-write
 * throughout) is preserved verbatim. The install matrix
 * (scripts/warpos/test-install-matrix.js) is the regression guard proving the
 * extraction is behavior-preserving.
 *
 * WHY TWO ENTRY POINTS (not one): in warp-setup.js the four scaffold blocks are
 * NOT contiguous, and their ordering relative to other install steps is
 * load-bearing:
 *   - The paths.json / skeleton / ROADMAP blocks (A+B+C) run EARLY — the
 *     skeleton's `_requirements/01-design-system` dir is read later by the
 *     hook-config "missing tools" notice, so it must exist before that point.
 *   - The `_warpos/` source-mirror (D) runs LATE — specifically AFTER the
 *     settings-compile check, which keys on whether `_warpos/settings/
 *     defaults.json` exists. D is what creates that file, so running D earlier
 *     would flip the compile branch on a fresh install (a behavior change).
 * Merging A+B+C+D into one call site would therefore alter behavior. To keep
 * the move behavior-preserving, the core exposes:
 *   - scaffoldProduct(...)       → blocks A (paths.json) + B (skeleton) + C (ROADMAP)
 *   - populateWarposMirror(...)  → block D (_warpos/ source mirror)
 * warp-setup.js calls each at the exact site the inline block previously sat.
 *
 * All functions return an `installedDelta` so the caller can keep its `installed`
 * counter identical to the pre-extraction value (the inline blocks incremented a
 * shared `installed` variable).
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

/**
 * scaffoldProduct — the EARLY scaffold bundle (blocks A + B + C).
 *
 * @param {object}   opts
 * @param {string}   opts.target       product root (was TARGET)
 * @param {string}   opts.warposRoot   canonical WarpOS clone (was WARPOS)
 * @param {function} opts.log          reporter, signature log(status, msg, detail?)
 * @returns {{ installedDelta: number }}
 */
function scaffoldProduct({ target, warposRoot, log }) {
  const TARGET = target;
  const WARPOS = warposRoot;
  let installed = 0;

  // ── 5. Create paths.json ────────────────────────────────
  // Principle: paths.json is CREATED at install time, never ASSUMED to exist pre-install.
  // WarpOS does not ship a paths.json — the installer builds it here so every client
  // project gets its own. To move a location, edit this object (and lib/paths.js fallback).
  const pathsFile = path.join(TARGET, ".claude/paths.json");
  // SP-20260525-018: source the product paths.json from the SINGLE registry
  // (framework/paths.registry.json) instead of a hardcoded map, so every
  // product gets ALL keys — sprint-orchestrator infra (sprintFullAutonomy,
  // sprintSchemas, …) and the _requirements zones — and stays in sync as the
  // registry grows. A-015-safe: keys live in the registry, never raw-inserted.
  // Idempotent: fresh install writes the full map; re-run backfills only
  // MISSING keys (operator values are never overwritten).
  const registryFile = path.join(TARGET, "framework", "paths.registry.json");
  let _registry = null;
  try {
    _registry = JSON.parse(fs.readFileSync(registryFile, "utf8"));
  } catch {
    /* registry not installed (older capsule) — fall back below */
  }
  const _regEntries = _registry ? _registry.paths || _registry : null;
  if (_regEntries) {
    const flat = { version: 3 };
    for (const [key, entry] of Object.entries(_regEntries)) {
      if (entry && typeof entry === "object" && typeof entry.path === "string") {
        flat[key] = entry.path;
      }
    }
    if (!fs.existsSync(pathsFile)) {
      fs.writeFileSync(pathsFile, JSON.stringify(flat, null, 2) + "\n");
      log("ok", `Created paths.json from registry (${Object.keys(flat).length} keys)`);
      installed++;
    } else {
      // Idempotent backfill — add only keys the existing file is missing.
      const existing = JSON.parse(fs.readFileSync(pathsFile, "utf8"));
      let added = 0;
      for (const [k, v] of Object.entries(flat)) {
        if (!(k in existing)) {
          existing[k] = v;
          added++;
        }
      }
      if (added > 0) {
        fs.writeFileSync(pathsFile, JSON.stringify(existing, null, 2) + "\n");
        log("ok", `Backfilled paths.json (+${added} missing keys incl. sprint infra)`);
      } else {
        log("ok", "paths.json already complete");
      }
    }
    // Scaffold every runtime dir the registry declares (kind=dir) so the sprint
    // orchestrator + zones exist on disk. Idempotent.
    for (const entry of Object.values(_regEntries)) {
      if (entry && typeof entry === "object" && entry.kind === "dir" && typeof entry.path === "string") {
        try {
          fs.mkdirSync(path.join(TARGET, entry.path), { recursive: true });
        } catch {
          /* best-effort */
        }
      }
    }
  } else if (!fs.existsSync(pathsFile)) {
    // Fallback when the registry is absent (pre-0.8 capsule): minimal map.
    const paths = {
      version: 3,
      events: ".claude/project/events",
      memory: ".claude/project/memory",
      reference: ".claude/project/reference",
      runtime: ".claude/runtime",
      agents: ".claude/agents",
      commands: ".claude/commands",
      manifest: ".claude/manifest.json",
      settings: ".claude/settings.json",
      eventsFile: ".claude/project/events/events.jsonl",
      learningsFile: ".claude/project/memory/learnings.jsonl",
    };
    fs.writeFileSync(pathsFile, JSON.stringify(paths, null, 2) + "\n");
    log("warn", "Created minimal paths.json (registry not found)");
    installed++;
  }

  // ── 5b. Structure-parity skeleton + _docs zones (SP-20260525-018) ──
  // Guarantee every dir /check:warpos-structure-parity declares, plus the
  // _docs brief/clone homes, exist. Idempotent; .gitkeep so git tracks them.
  const SKELETON_DIRS = [
    "_requirements/_audits", "_requirements/_index", "_requirements/_shared",
    "_requirements/_standards", "_requirements/00-canonical",
    "_requirements/01-design-system", "_requirements/02-copy-system",
    "_requirements/03-architecture", "_requirements/04-features",
    "_requirements/05-operations", "_requirements/06-security",
    "_requirements/07-testing", "_requirements/08-automation",
    "_docs", "_docs/briefs", "_docs/clones",
  ];
  let _skeletonNew = 0;
  for (const d of SKELETON_DIRS) {
    const abs = path.join(TARGET, d);
    try {
      if (!fs.existsSync(abs)) _skeletonNew++;
      fs.mkdirSync(abs, { recursive: true });
      const keep = path.join(abs, ".gitkeep");
      if (!fs.existsSync(keep)) fs.writeFileSync(keep, "");
    } catch {
      /* best-effort */
    }
  }
  log("ok", `Skeleton zones ensured (_requirements/*, _docs/; ${_skeletonNew} created this run)`);

  // ── 5c. ROADMAP scaffold (SP-20260525-018) ─────────────────
  // Idempotent — generate-roadmap-scaffold.js no-ops when ROADMAP.md exists.
  try {
    const rmGen = path.join(WARPOS, "scripts", "warpos", "generate-roadmap-scaffold.js");
    if (fs.existsSync(rmGen)) {
      const r = spawnSync("node", [rmGen, TARGET], { encoding: "utf8" });
      if (r.status === 0) log("ok", "ROADMAP.md scaffold ensured");
      else log("warn", `ROADMAP scaffold skipped: ${(r.stderr || "").trim().slice(0, 80)}`);
    }
  } catch {
    /* non-fatal */
  }

  return { installedDelta: installed };
}

/**
 * populateWarposMirror — the LATE scaffold block (block D).
 *
 * Populates the product's `_warpos/` framework SOURCE mirror so
 * scripts/warpos/views/regenerate.js does real work. Must run AFTER the
 * settings-compile check (see module docstring) and BEFORE manifest coverage.
 *
 * @param {object}   opts
 * @param {string}   opts.target        product root (was TARGET)
 * @param {string}   opts.warposRoot    canonical WarpOS clone (was WARPOS)
 * @param {object}   opts.shipManifest  pre-parsed framework-manifest
 * @param {function} opts.log           reporter, signature log(status, msg, detail?)
 * @param {string}  [opts.HEADER]       ANSI header escape (for the section banner)
 * @param {string}  [opts.RESET]        ANSI reset escape
 * @returns {{ installedDelta: number }}
 */
function populateWarposMirror({ target, warposRoot, shipManifest, log, HEADER = "", RESET = "" }) {
  const TARGET = target;
  const WARPOS = warposRoot;
  let installed = 0;

  // ── 8.9. Populate _warpos/ framework SOURCE mirror (SP-20260525-003) ──
  // THE MODEL (regenerate.js docstring + Strategy line 17): a product holds
  // framework SOURCE at `_warpos/` (a mirror); `.claude/` is the COMPILED VIEW
  // regenerated from it. Before this, /warp:setup copied framework files only to
  // the root + `.claude/` and created NO `_warpos/`, so scripts/warpos/views/
  // regenerate.js had no source mirror and was inert in products.
  //
  // We mirror the framework view-source (commands, agents, project/reference,
  // agent .system policy json) from the CANONICAL clone (WARPOS) into the
  // product's `_warpos/`, then the MANIFEST COVERAGE block below regenerates
  // _warpos/MANIFEST.json with `--source-prefix _warpos` so framework-view
  // entries carry `source` pointers into `_warpos/` (`.claude/commands/foo.md`
  // → `_warpos/commands/foo.md`). regenerate.js then does real work.
  //
  // Idempotent / content-addressed: a re-run only rewrites mirror files that are
  // missing or differ from canonical — this is the migration path for existing
  // products (e.g. companycam). DRY-RUN already returned above, so no guard
  // needed here. Fail-open: never block install on a mirror error.
  {
    console.log(`\n${HEADER}  FRAMEWORK SOURCE MIRROR (_warpos/)${RESET}`);
    const populateScript = path.join(
      WARPOS,
      "scripts",
      "warpos",
      "views",
      "populate-source.js",
    );
    try {
      const { populateSource } = require(populateScript);
      const pr = populateSource({
        targetRoot: TARGET,
        warposRoot: WARPOS,
        shipManifest,
      });
      if (!pr.ok && pr.code === 2) {
        log("warn", `_warpos/ mirror skipped: ${pr.error}`);
      } else {
        log(
          "ok",
          `_warpos/ source mirror: ${pr.copied.length} copied, ${pr.unchanged.length} unchanged (${pr.mirroredCount} view files mirrored)`,
        );
        installed += pr.copied.length;
        if (pr.missingSource.length > 0) {
          log(
            "warn",
            `_warpos/ mirror: ${pr.missingSource.length} source(s) declared by manifest but missing in clone (first 3): ${pr.missingSource
              .slice(0, 3)
              .map((m) => m.src)
              .join(", ")}`,
          );
        }
        if (pr.failed.length > 0) {
          log(
            "warn",
            `_warpos/ mirror: ${pr.failed.length} copy failure(s) (first 3): ${pr.failed
              .slice(0, 3)
              .map((f) => `${f.mirror} (${f.reason})`)
              .join("; ")}`,
          );
        }
      }
    } catch (err) {
      log("warn", `_warpos/ mirror failed (${err.message}) — install continues; regenerate.js stays inert until re-run`);
    }
  }

  return { installedDelta: installed };
}

module.exports = {
  scaffoldProduct,
  populateWarposMirror,
};
