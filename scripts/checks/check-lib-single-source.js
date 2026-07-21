#!/usr/bin/env node
"use strict";

/**
 * check-lib-single-source.js — β rider 4 enforcer + β design→build R2 lineage guard (SP-20260720-002
 * Phase 4, unit BUNDLE, Seam D / record-trust-gate Surface 3).
 *
 * TWO jobs, both required for exit 0:
 *   (1) Zero re-implementations: grep source files OUTSIDE `scripts/dispatch/check-lib/` for a
 *       `function`/`const`/`let`/`var` DECLARATION whose identifier matches one of the frozen
 *       `CHECK_NAMES` (in any of its plausible identifier forms — kebab, camelCase, PascalCase, snake).
 *       A declaration is how a re-implementation actually happens (a second, competing definition) —
 *       this is deliberately NARROWER than a raw string-literal grep (which would false-positive on the
 *       ONE legitimately WRAPPED original, e.g. `scripts/checks/no-nul-bytes.js`, whose `const NAME =
 *       "no-nul-bytes"` merely NAMES the check it implements, and check-lib's own wrapper module, which
 *       reuses it via require() rather than re-implementing it — see WRAPPED_SOURCES below).
 *   (2) All 3 Seam-D consumers require() check-lib: the Claude hook, git pre-commit, and the controller.
 *       A consumer file that does not exist yet (an earlier build phase — BUNDLE merges before
 *       CONTROLLER per build_spec §3) is reported `pending`, not a hard failure; a consumer file that
 *       EXISTS but does not require() check-lib is `missing-require` — a hard failure.
 *   (2b) β R2 lineage: when a promoted bundle manifest is supplied, its `promotion.from_src_digest` MUST
 *        equal a FRESH digest of the live check-lib source (via `pinned-checker-bundle.js#sourceDigestOf`)
 *        — the controller runs the PINNED SNAPSHOT, not require(check-lib), so without this check a fork
 *        could ship in the snapshot unverified-as-same-source at the moment it was promoted.
 *
 * Exit 0 = clean. Exit 1 = a re-implementation, a missing-require consumer, or a lineage mismatch was
 * found. Exit 2 = runner error (fail-closed — a scanner that errors must never read green).
 *
 *   node scripts/checks/check-lib-single-source.js [--json] [--bundle-manifest <path>]
 */

const fs = require("fs");
const path = require("path");

// CWD-independent anchor (mirrors acceptance-record.js / conductor-lease.js's PROJECT_ROOT reasoning): a
// worktree-cwd dispatch must scan the REAL repo it lives in, not wherever CLAUDE_PROJECT_DIR happens to
// point (that env var reflects the INVOKING session's project root, which can be a DIFFERENT checkout
// than the worktree this script is installed in — a confirmed hazard, not a hypothetical one). __dirname
// is always correct for "the repo this file is part of," so it — not the env var — anchors ROOT here.
const ROOT = path.resolve(__dirname, "..", "..");
const CHECK_LIB_DIR = path.join(ROOT, "scripts", "dispatch", "check-lib");
const NAME = "check-lib-single-source";

const SCAN_ROOTS = ["scripts", ".claude"];
const SKIP_DIRS = new Set(["node_modules", ".git", "runtime", ".provider-tmp"]);
const TEXT_EXT = new Set([".js", ".mjs", ".cjs"]);

// Declared legitimate "wrapped original" sources — check-lib WRAPS these (require()s + reuses their pure
// core), it does not duplicate their detection logic. The scan must not flag the canonical original as a
// re-implementation of the very check it is the source of truth for.
const WRAPPED_SOURCES = {
  "no-nul-bytes": ["scripts/checks/no-nul-bytes.js"],
};

// This enforcer file itself legitimately names every check (identifiers + strings, in comments and in
// WRAPPED_SOURCES/CONSUMERS) — exempt it from its own scan.
const SELF_EXEMPT = new Set(["scripts/checks/check-lib-single-source.js"]);

// The 3 Seam D consumers (β rider 4 / R-4). Paths not yet present are `pending`, never a hard failure —
// the CLOSURE gate that requires all 3 PRESENT+wired is record-trust-gate.js --built, run after every
// unit in the Phase-4 build order has merged.
// Seam D integration reconcile (ε, SP-20260720-002 build integration phase): each consumer declares
// its OWN require target. The hook + pre-commit consume the check-lib SOURCE directly (fast/early
// feedback). The controller consumes the PINNED SNAPSHOT (pinned-checker-bundle) — NEVER the live
// in-tree source (Seam B / β R2); its same-source guarantee is the from_src_digest LINEAGE
// (checkLineage), so its wired-check verifies the SNAPSHOT require, not a check-lib require (a
// direct-check-lib expectation on the controller was the cross-builder seam mismatch this reconciles).
const CONSUMERS = Object.freeze([
  { id: "hook", path: "scripts/hooks/check-lib-prevention.js", requireTarget: "check-lib" },
  { id: "pre-commit", path: "scripts/hooks/pre-commit-check-lib.js", requireTarget: "check-lib" },
  { id: "controller", path: "scripts/dispatch/trusted-controller.js", requireTarget: "pinned-checker-bundle" },
]);

function identifierVariants(name) {
  const parts = String(name).split(/[-_]/).filter(Boolean);
  const camel = parts.map((p, i) => (i === 0 ? p : p[0].toUpperCase() + p.slice(1))).join("");
  const pascal = parts.map((p) => p[0].toUpperCase() + p.slice(1)).join("");
  const snake = parts.join("_");
  return Array.from(new Set([name, camel, pascal, snake].filter(Boolean)));
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      yield* walk(path.join(dir, ent.name));
    } else if (ent.isFile() && TEXT_EXT.has(path.extname(ent.name).toLowerCase())) {
      yield path.join(dir, ent.name);
    }
  }
}

function collectFiles(root = ROOT, roots = SCAN_ROOTS) {
  const files = [];
  for (const r of roots) {
    const abs = path.join(root, r);
    if (!fs.existsSync(abs)) continue;
    for (const file of walk(abs)) {
      try {
        files.push({ path: path.relative(root, file).split(path.sep).join("/"), content: fs.readFileSync(file, "utf8") });
      } catch {
        /* unreadable — skip */
      }
    }
  }
  return files;
}

/**
 * Pure core: given the CHECK_NAMES + a file corpus [{path, content}], find re-implementations (a
 * `function <ident>` / `const|let|var <ident>` DECLARATION matching a check-name identifier variant)
 * OUTSIDE `scripts/dispatch/check-lib/` and outside each name's declared WRAPPED_SOURCES exemption.
 */
function evaluate({ checkNames = [], files = [], wrappedSources = WRAPPED_SOURCES } = {}) {
  const findings = [];
  for (const name of checkNames) {
    const idents = identifierVariants(name).map(escapeRegex);
    const exempt = new Set((wrappedSources[name] || []).map((p) => p.replace(/\\/g, "/")));
    const pattern = new RegExp(`\\b(function|const|let|var)\\s+(${idents.join("|")})\\b`);
    for (const f of files) {
      const norm = f.path.replace(/\\/g, "/");
      if (norm.startsWith("scripts/dispatch/check-lib/")) continue; // the canonical location itself
      if (exempt.has(norm)) continue; // declared wrapped-original exemption
      if (SELF_EXEMPT.has(norm)) continue;
      if (pattern.test(f.content)) findings.push({ check: name, file: norm });
    }
  }
  return { ok: findings.length === 0, findings };
}

/** checkConsumers(root, consumers) -> [{id, path, status}]. status ∈ pending|wired|missing-require|unreadable. */
function checkConsumers(root = ROOT, consumers = CONSUMERS) {
  const report = [];
  for (const c of consumers) {
    const abs = path.join(root, ...c.path.split("/"));
    if (!fs.existsSync(abs)) {
      report.push({ ...c, status: "pending" });
      continue;
    }
    let content;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch (e) {
      report.push({ ...c, status: "unreadable", error: String(e && e.message ? e.message : e) });
      continue;
    }
    // Per-consumer require target: check-lib SOURCE (hook/pre-commit) vs the pinned SNAPSHOT
    // pinned-checker-bundle (controller, Seam B — verified same-source by checkLineage).
    const wiredRe =
      c.requireTarget === "pinned-checker-bundle"
        ? /require\(\s*(['"])(?:[^'"]*\/)?(?:dispatch\/)?pinned-checker-bundle(?:\.js)?\1\s*\)/
        : /require\(\s*(['"])(?:[^'"]*\/)?(?:dispatch\/)?check-lib(?:\/index(?:\.js)?)?\1\s*\)/;
    report.push({ ...c, status: wiredRe.test(content) ? "wired" : "missing-require" });
  }
  return report;
}

/**
 * checkLineage({manifestPath}) -> {checked, ok?, reason?, pinned?, fresh?}. β R2: the pinned bundle
 * manifest's `promotion.from_src_digest` must equal a fresh digest of the LIVE check-lib source. Only
 * asserted when a manifest path is actually supplied — the bundle IS the authoritative consumer, so this
 * becomes load-bearing once a bundle exists; absent a supplied manifest, `checked:false` (not a failure).
 */
function checkLineage({ manifestPath, sourceDigestOf, loadBundleManifest } = {}) {
  if (!manifestPath) return { checked: false };
  const pcb = require("../dispatch/pinned-checker-bundle");
  const digestFn = sourceDigestOf || pcb.sourceDigestOf;
  const loadFn = loadBundleManifest || pcb.loadBundleManifest;
  let bundle;
  try {
    bundle = loadFn(manifestPath);
  } catch (e) {
    return { checked: true, ok: false, reason: `bundle manifest unreadable: ${e.message}` };
  }
  const fresh = digestFn(CHECK_LIB_DIR);
  const pinned = bundle.promotion && bundle.promotion.from_src_digest;
  if (!pinned || pinned !== fresh) {
    return { checked: true, ok: false, reason: "lineage-mismatch", pinned: pinned || null, fresh };
  }
  return { checked: true, ok: true, pinned, fresh };
}

function run(opts = {}) {
  const root = opts.root || ROOT;
  const files = opts.files || collectFiles(root);
  const { CHECK_NAMES } = require(path.join(CHECK_LIB_DIR, "registry"));
  const scan = evaluate({ checkNames: CHECK_NAMES, files, wrappedSources: opts.wrappedSources });
  const consumers = checkConsumers(root, opts.consumers);
  const lineage = checkLineage({ manifestPath: opts.manifestPath, sourceDigestOf: opts.sourceDigestOf, loadBundleManifest: opts.loadBundleManifest });
  const missingRequire = consumers.filter((c) => c.status === "missing-require" || c.status === "unreadable");
  const ok = scan.ok && missingRequire.length === 0 && lineage.ok !== false;
  return { ok, findings: scan.findings, consumers, lineage };
}

module.exports = {
  evaluate,
  identifierVariants,
  collectFiles,
  checkConsumers,
  checkLineage,
  run,
  CONSUMERS,
  WRAPPED_SOURCES,
};

if (require.main === module) {
  const argv = process.argv.slice(2);
  const jsonOut = argv.includes("--json");
  const manifestIdx = argv.indexOf("--bundle-manifest");
  const manifestPath = manifestIdx >= 0 ? argv[manifestIdx + 1] : undefined;
  let res;
  try {
    res = run({ manifestPath });
  } catch (e) {
    if (jsonOut) console.log(JSON.stringify({ ok: false, error: String(e && e.message ? e.message : e) }));
    else console.error(`[${NAME}] runner error: ${e && e.message ? e.message : e}`);
    process.exit(2);
  }
  if (jsonOut) {
    console.log(JSON.stringify({ check: NAME, ...res }));
  } else if (res.ok) {
    console.log(`OK   [${NAME}] zero re-implementations; consumers: ${res.consumers.map((c) => `${c.id}:${c.status}`).join(", ")}`);
  } else {
    console.error(`FAIL [${NAME}]`);
    for (const f of res.findings) console.error(`  - re-implementation: check '${f.check}' declared in ${f.file}`);
    for (const c of res.consumers.filter((c) => c.status === "missing-require" || c.status === "unreadable")) {
      console.error(`  - consumer ${c.id} (${c.path}) does not require() check-lib (${c.status})`);
    }
    if (res.lineage && res.lineage.ok === false) console.error(`  - lineage: ${res.lineage.reason} (pinned=${res.lineage.pinned}, fresh=${res.lineage.fresh})`);
  }
  process.exit(res.ok ? 0 : 1);
}
