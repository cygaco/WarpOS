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

  // ── 5d. PROJECT.md scaffold (SP-20260525-019 / T-221) ──────
  // CLAUDE.md references [PROJECT.md](PROJECT.md) for product-specific context,
  // but WarpOS does NOT ship PROJECT.md as a framework asset (the canonical
  // PROJECT.md is WarpOS-about-WarpOS — copying it would leak framework content
  // into the product). So that link dangled on every install. Write a minimal,
  // GENERIC template here so both install paths (warp-setup + install.ps1, which
  // share this core) close the dangling reference. The operator fills the
  // placeholder sections in. Idempotent / skip-if-present: never clobber an
  // operator's PROJECT.md or WarpOS's own (this core also runs in canonical).
  const projectMdFile = path.join(TARGET, "PROJECT.md");
  if (!fs.existsSync(projectMdFile)) {
    const projectMd = [
      `# ${path.basename(TARGET)} — Project Context`,
      "",
      "> Product-specific context for this project. For the framework instructions an",
      "> agent operates under, see [CLAUDE.md](CLAUDE.md). For the agent system router,",
      "> see [AGENTS.md](AGENTS.md). WarpOS will never overwrite this file — it's yours.",
      "",
      "## Product",
      "",
      "_What is this product? One or two sentences: what it does and who it's for._",
      "",
      "## Stack",
      "",
      "_Languages, frameworks, key dependencies, hosting / deployment target._",
      "",
      "## Goals",
      "",
      "_What does success look like? Near-term objectives and the bar for \"done\"._",
      "",
      "## JTBD",
      "",
      "_Jobs To Be Done — the concrete jobs a user hires this product to do._",
      "",
    ].join("\n");
    fs.writeFileSync(projectMdFile, projectMd + "\n");
    log("ok", "Created PROJECT.md template (fill in Product/Stack/Goals/JTBD)");
    installed++;
  } else {
    log("ok", "PROJECT.md already present — leaving it alone");
  }

  // ── 5e. Product maps nudge (SP-20260525-019 / T-222) ───────
  // SAFE OPTION (chosen): write a nudge, do NOT generate maps inline. Reasons:
  //  1. scripts/regen-maps.js hardcodes PROJECT = resolve(__dirname, "..") — it
  //     ALWAYS targets the WarpOS clone it lives in, with no target/CWD param.
  //     It cannot cheaply or safely target the product (the T-222 bar for inline
  //     generation).
  //  2. The framework-manifest ships ~24 canonical maps assets
  //     (.claude/project/maps/skills.jsonl, hooks.jsonl, architecture.md, …) that
  //     the installer copies in. Those describe WARPOS'S OWN inventory. Without a
  //     marker the product silently presents WarpOS's canonical maps as its own —
  //     exactly the failure T-222 calls out.
  // So we drop a README into the maps dir (paths.maps → .claude/project/maps/)
  // flagging the shipped maps as canonical-WarpOS placeholders and pointing the
  // operator at /maps:all to regenerate them for THIS product. Idempotent /
  // skip-if-present. No new paths.json key needed — paths.maps already keys the
  // dir; this is a fixed-name file inside it.
  try {
    const mapsDir = path.join(TARGET, ".claude", "project", "maps");
    fs.mkdirSync(mapsDir, { recursive: true });
    const mapsReadme = path.join(mapsDir, "README.md");
    if (!fs.existsSync(mapsReadme)) {
      const readme = [
        "# Project Maps",
        "",
        "> **These maps are not yours yet.** A fresh WarpOS install ships the",
        "> framework's OWN canonical relationship maps (skills, hooks, tools, memory,",
        "> systems, enforcements, architecture) as placeholders in this directory.",
        "> They describe WarpOS itself — not this product.",
        "",
        "## Generate maps for THIS product",
        "",
        "Open the project in Claude Code and run:",
        "",
        "```",
        "/maps:all",
        "```",
        "",
        "That regenerates every map by walking THIS project's `.claude/` and source",
        "tree (no LLM synthesis — deterministic file walks), replacing the shipped",
        "WarpOS placeholders with your real inventory.",
        "",
        "Until you do, treat any pre-existing `*.jsonl` / `*.md` / `inventory-*.json`",
        "in this directory as framework defaults, not project truth.",
        "",
      ].join("\n");
      fs.writeFileSync(mapsReadme, readme + "\n");
      log("ok", "Wrote maps/README.md nudge (run /maps:all to generate product maps)");
      installed++;
    } else {
      log("ok", "maps/README.md already present — leaving it alone");
    }
  } catch {
    /* non-fatal — maps nudge is informational */
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
  // products. DRY-RUN already returned above, so no guard
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

/**
 * regenerateWarposManifest — the MANIFEST COVERAGE build step (extracted from
 * warp-setup.js, SP-20260525-019 / T-220).
 *
 * Regenerates `_warpos/MANIFEST.json` (the dest→{owner,source} map that
 * scripts/warpos/views/regenerate.js reads) by running the manifest builder with
 * `--source-prefix _warpos`, so framework-view entries carry `source` pointers
 * into `_warpos/`. Without this, populateWarposMirror copies the mirror SOURCE
 * files but the mirror has no MANIFEST.json and regenerate.js stays inert.
 *
 * WHY EXTRACTED: warp-setup.js ran this inline (its "MANIFEST COVERAGE" block);
 * the install.ps1/CLI path didn't, so a consumer install shipped a _warpos/ with
 * no MANIFEST.json (caught by the install matrix's installps1_path + both-path
 * parity gate). Both paths now call THIS one function (β: extract-don't-fork).
 * warp-setup keeps its own validate + --strict-manifest install-refusal policy
 * wrapped AROUND this build step; the CLI just needs the regeneration.
 *
 * Must run AFTER populateWarposMirror (the mirror source must exist first).
 * Fail-open: never crash the install on a manifest-build error.
 *
 * @param {object}   opts
 * @param {string}   opts.target      product root
 * @param {string}   opts.warposRoot  clone holding scripts/warpos/manifest/build.js
 * @param {function} opts.log         reporter, signature log(status, msg, detail?)
 * @returns {{ ok: boolean, skipped: boolean, status: (number|null), stderr: string }}
 */
function regenerateWarposManifest({ target, warposRoot, log }) {
  const warposZone = path.join(target, "_warpos");
  if (!fs.existsSync(warposZone)) {
    log("info", "_warpos/ not present — skipping manifest regeneration (legacy install layout)");
    return { ok: false, skipped: true, status: null, stderr: "" };
  }
  const buildScript = path.join(warposRoot, "scripts/warpos/manifest/build.js");
  if (!fs.existsSync(buildScript)) {
    log("warn", `manifest build.js not found at ${buildScript} — _warpos/MANIFEST.json not regenerated`);
    return { ok: false, skipped: true, status: null, stderr: "" };
  }
  const res = spawnSync(
    process.execPath,
    [buildScript, "--root", target, "--source-prefix", "_warpos"],
    { encoding: "utf8" },
  );
  if (res.status !== 0) {
    log("warn", `manifest build.js exited ${res.status} — _warpos/MANIFEST.json may be missing/stale. stderr: ${(res.stderr || "").trim().slice(0, 200)}`);
    return { ok: false, skipped: false, status: res.status, stderr: res.stderr || "" };
  }
  log("ok", "_warpos/MANIFEST.json regenerated (--source-prefix _warpos)");
  return { ok: true, skipped: false, status: 0, stderr: "" };
}

module.exports = {
  scaffoldProduct,
  populateWarposMirror,
  regenerateWarposManifest,
};

// ── CLI entry (SP-20260525-019 / T-220) ────────────────────
// `node scripts/warpos/scaffold-core.js <target>` runs the FULL product
// scaffold (both entry points) against <target>. This is the SHARED core that
// install.ps1 shells out to AFTER its file-copy + manifest-regen — a real
// shell-out to this script file (β A-006: extract-don't-fork + cross-platform
// shell-out), so a PowerShell install ends up identical to the warp-setup path
// (registry-driven paths.json, _requirements/_docs zones, ROADMAP, PROJECT.md,
// maps nudge, and the _warpos/ source mirror).
//
// warposRoot resolution: when install.ps1 invokes the COPY of this file inside
// the product (`<target>/scripts/warpos/scaffold-core.js`), __dirname/../.. IS
// the product root — and the product is also the source clone for the mirror
// (install.ps1 already copied framework/paths.registry.json,
// scripts/warpos/generate-roadmap-scaffold.js, and views/populate-source.js in
// Stage 1). So target === warposRoot in that case, which is exactly what we
// want: the scaffold reads the registry/scripts the product just received.
if (require.main === module) {
  const targetArg = process.argv[2];
  if (!targetArg) {
    process.stderr.write(
      "usage: node scripts/warpos/scaffold-core.js <target-dir>\n",
    );
    process.exit(2);
  }
  const target = path.resolve(targetArg);
  if (!fs.existsSync(target)) {
    process.stderr.write(`target directory does not exist: ${target}\n`);
    process.exit(2);
  }
  // The script lives at <root>/scripts/warpos/scaffold-core.js, so the clone
  // root is two levels up. For an install.ps1 self-invocation this equals
  // `target`; resolving from __dirname keeps it correct even if the two differ.
  const warposRoot = path.resolve(__dirname, "..", "..");

  // Console-backed reporter matching warp-setup's log(status, msg, detail?)
  // signature. Plain ASCII tags — this runs under whatever shell install.ps1
  // is using, and not all terminals render the colored glyphs cleanly.
  const TAG = { ok: "[ ok ]", warn: "[warn]", fail: "[fail]", info: "[info]" };
  const log = (status, msg, detail) => {
    process.stdout.write(`${TAG[status] || "[info]"} ${msg}\n`);
    if (detail) process.stdout.write(`       ${detail}\n`);
  };

  log("info", `scaffold-core: target=${target}`);
  log("info", `scaffold-core: warposRoot=${warposRoot}`);

  let total = 0;
  try {
    // EARLY bundle (A+B+C+D+E): paths.json + skeleton + ROADMAP + PROJECT.md + maps nudge.
    total += scaffoldProduct({ target, warposRoot, log }).installedDelta;

    // LATE block: _warpos/ source mirror. populate-source needs the ship
    // manifest; read the product's freshly-regenerated copy. Skip the mirror
    // (with a clear notice) if it's absent rather than crash — fail-open, the
    // way warp-setup treats this block.
    const manifestPath = path.join(
      warposRoot,
      ".claude",
      "framework-manifest.json",
    );
    let shipManifest = null;
    try {
      shipManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch {
      /* manifest missing/unreadable — handled below */
    }
    if (shipManifest) {
      total += populateWarposMirror({
        target,
        warposRoot,
        shipManifest,
        log,
      }).installedDelta;
      // MANIFEST COVERAGE: regenerate _warpos/MANIFEST.json so regenerate.js has
      // its dest→{owner,source} map (the same step warp-setup runs after the
      // mirror). Without this the mirror has source files but no MANIFEST.json
      // and regenerate.js stays inert — the install.ps1-path gap the parity
      // matrix caught. Fail-open; the helper logs its own outcome.
      regenerateWarposManifest({ target, warposRoot, log });
    } else {
      log(
        "warn",
        `_warpos/ mirror skipped — no readable framework-manifest at ${manifestPath}. Re-run /warp:setup or regenerate the manifest, then re-run this script.`,
      );
    }
    log("ok", `scaffold-core complete (${total} item(s) scaffolded)`);
    process.exit(0);
  } catch (err) {
    process.stderr.write(`scaffold-core failed: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  }
}
