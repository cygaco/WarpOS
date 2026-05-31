#!/usr/bin/env node
/* eslint-disable no-console */
"use strict";
/**
 * scripts/checks/warpos-ship-coverage.js — THE systemic enforcer for the
 * "downstream always missing something" class (SP-20260525-024).
 *
 * Root cause it closes: WarpOS has TWO manifests.
 *   - _warpos/MANIFEST.json (SP-20260522-001) — the AUTHORITATIVE per-path
 *     OWNERSHIP declaration (owner=framework|generated|project|runtime). Built by
 *     scripts/warpos/manifest/build.js. Validated by /scan:warpos-manifest-coverage.
 *   - .claude/framework-manifest.json — what /warp:setup AND /warp:update actually
 *     SHIP (assets[]). Built by scripts/generate-framework-manifest.js (ASSET_DIRS).
 * Nothing asserted the second covers the first. So a framework-owned path absent
 * from ASSET_DIRS shipped to NOBODY, silently, with green gates (the existing
 * framework_manifest gate is tautological — it only checks the manifest matches
 * its own generator). framework/templates/* (the canon + bootstrap + sprint
 * templates) was the live casualty: 0 of 53 shipped.
 *
 * This check diffs them: every owner=framework path in _warpos/MANIFEST.json MUST
 * be shipped by framework-manifest.json — OR be in KNOWN_NOT_SHIPPED, which makes
 * every exclusion a CONSCIOUS, reviewed decision (the "name the enforcer / name
 * the exclusion" rule applied to content). RED if any framework-owned path is
 * neither shipped nor explicitly excluded.
 *
 * Wire into scripts/warpos/release-gates.js so "forgot to ship X" fails the
 * release loudly instead of surfacing months later in a consumer install.
 *
 * Exit: 0 = every framework-owned path ships or is allowlisted; 1 = gap(s); 2 = setup error.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.argv.includes("--root")
  ? path.resolve(process.argv[process.argv.indexOf("--root") + 1])
  : process.cwd();
const JSON_OUT = process.argv.includes("--json");

// Deliberate, reviewed exclusions: framework-owned on disk but intentionally
// NOT shipped via framework-manifest. Each MUST have a reason. Prefix match on
// the project-relative path.
const KNOWN_NOT_SHIPPED = [
  // _warpos/ is the product-side source mirror — GENERATED at install time
  // (populateWarposMirror), not shipped from canonical. Canonical's own _warpos/
  // (MANIFEST.json + settings/defaults.json) is build output, not a shippable asset.
  { prefix: "_warpos/", reason: "product-generated source mirror, not shipped from canonical" },
  // WarpOS-as-product canon — root-leak pending 0.10.0 scrub; product content,
  // never shipped (consumers generate their own via the canon engine).
  { prefix: "_requirements/00-canonical/", reason: "WarpOS product canon (root-leak pending scrub); consumers generate their own" },
  // Dev-only / framework-maintenance artifacts (already excluded from ASSET_DIRS).
  { prefix: "scripts/one-off/", reason: "framework-dev one-off scripts" },
  { prefix: "scripts/products/", reason: "framework-dev product scripts" },
  // Installer self + dev metadata.
  { prefix: "install.ps1", reason: "the installer itself (consumers run it, don't receive a copy via manifest)" },
  { prefix: "install.sh", reason: "the installer itself" },
  { prefix: "package.json", reason: "framework-dev metadata" },
  { prefix: "package-lock.json", reason: "framework-dev metadata" },
  { prefix: "README.md", reason: "framework-repo readme; consumers get their own scaffolded PROJECT.md/README" },
  { prefix: "CLAUDE.md", reason: "merged separately by /warp:setup CLAUDE.md merge, not a manifest asset" },
  { prefix: "version.json", reason: "shipped as version_file (separate manifest section), not an asset dir" },
];

// Ship-boundary (SP-20260531-002, ADR-0005): the fail-closed allow/deny
// boundary between WarpOS-authored product-facing guides (MUST ship) and operator
// scratch / per-project output (must NEVER ship). Asserted against the shipped set
// in main(). Prefix match on the project-relative path.
const MUST_SHIP_PREFIXES = [
  { prefix: "_guides/", reason: "product-facing launch guides must ship to consumer products" },
];
const MUST_NOT_SHIP_PREFIXES = [
  { prefix: "_planning/", reason: "operator planning scratch — must never ship to products" },
  { prefix: "_reports/", reason: "per-project report output — must never ship to products" },
];

function fail(msg) {
  console.error(`warpos-ship-coverage: ${msg}`);
  process.exit(2);
}

function loadJson(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) fail(`missing ${rel} — run the manifest builders first`);
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    fail(`invalid JSON in ${rel}: ${e.message}`);
  }
}

// Flatten framework-manifest assets (grouped by kind → arrays of {src,dest})
// into the set of shipped project-relative source paths, plus generated_files +
// any top-level single-file sections.
function shippedPathSet(fm) {
  const set = new Set();
  const addEntry = (e) => {
    if (e && typeof e === "object") {
      if (e.src) set.add(e.src);
      if (e.dest) set.add(e.dest);
    }
  };
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      if (v.src || v.dest) addEntry(v);
      else for (const k of Object.keys(v)) walk(v[k]);
    }
  };
  walk(fm.assets);
  // generated_files + version/installer single-file sections may be arrays/objects too
  for (const key of ["generated_files", "version_file", "installer_script"]) {
    if (fm[key]) walk(fm[key]);
  }
  return set;
}

function isAllowlisted(p) {
  return KNOWN_NOT_SHIPPED.find((a) => p === a.prefix || p.startsWith(a.prefix));
}

// HARD-FAIL roots: the consumer-essential engine. A new owner=framework path
// under these that doesn't ship is unambiguously a ship bug (this is exactly how
// framework/templates/* slipped — 0 of 53 shipped). Gaps elsewhere (top-level
// scripts/*.js dev tooling, tests/, root dev docs) are owner=framework too but
// are framework-internal — reported as INFO, full allowlist curation tracked as
// the SP-20260525-024 follow-up. `owner=framework` is BROADER than
// `consumer-shipped`, so a blanket must-ship over-flags the framework's own tools.
const HARD_SIGNAL_ROOTS = [
  "framework/",
  "schemas/",
  "patterns/",
  ".claude/commands/",
  ".claude/agents/",
];
function isHardSignal(p) {
  return HARD_SIGNAL_ROOTS.some((r) => p.startsWith(r));
}

function main() {
  const own = loadJson("_warpos/MANIFEST.json");
  const fm = loadJson(".claude/framework-manifest.json");
  const shipped = shippedPathSet(fm);

  const ownPaths = own.paths || {};
  const hardGaps = []; // essential-root gaps — RED, block the release
  const infoGaps = []; // dev-tooling gaps — reported, curation deferred
  let frameworkOwned = 0;
  for (const [p, entry] of Object.entries(ownPaths)) {
    if (!entry || entry.owner !== "framework") continue;
    if (entry.kind === "dir") continue; // dirs are implied by their files
    frameworkOwned++;
    if (shipped.has(p)) continue;
    if (isAllowlisted(p)) continue;
    if (isHardSignal(p)) hardGaps.push(p);
    else infoGaps.push(p);
  }

  // Ship-boundary assertions (SP-20260531-002, ADR-0005), fail-closed.
  // _guides/** MUST ship (WarpOS-authored product-facing guides); _planning/** +
  // _reports/** must NEVER ship (operator scratch / per-project report output).
  const boundaryViolations = [];
  for (const d of MUST_NOT_SHIP_PREFIXES) {
    for (const p of shipped) {
      if (p === d.prefix || p.startsWith(d.prefix)) {
        boundaryViolations.push(`must-not-ship-present: ${p} — ${d.reason}`);
      }
    }
  }
  for (const m of MUST_SHIP_PREFIXES) {
    const present = [...shipped].some(
      (p) => p === m.prefix || p.startsWith(m.prefix),
    );
    if (!present) {
      boundaryViolations.push(`must-ship-missing: ${m.prefix} — ${m.reason}`);
    }
  }

  const result = {
    ok: hardGaps.length === 0 && boundaryViolations.length === 0,
    framework_owned_paths: frameworkOwned,
    shipped_paths: shipped.size,
    allowlisted_rules: KNOWN_NOT_SHIPPED.length,
    hard_gaps: hardGaps,
    boundary_violations: boundaryViolations,
    info_gaps_count: infoGaps.length,
    info_gaps: infoGaps,
  };

  if (JSON_OUT) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.ok) {
      console.log(
        `OK   [warpos-ship-coverage] every framework-owned path under the consumer-essential roots ships (${frameworkOwned} framework-owned paths scanned); ship-boundary intact (_guides ships, _planning/_reports do not).`,
      );
    } else {
      if (hardGaps.length) {
        console.error(
          `FAIL [warpos-ship-coverage] ${hardGaps.length} essential-root path(s) ship to NOBODY (under framework/|schemas/|patterns/|commands|agents, not shipped, not allowlisted):`,
        );
        for (const g of hardGaps) console.error(`  - ${g}`);
        console.error(
          `Fix: add the covering dir to ASSET_DIRS in scripts/generate-framework-manifest.js, OR add a reviewed KNOWN_NOT_SHIPPED entry.`,
        );
      }
      if (boundaryViolations.length) {
        console.error(
          `FAIL [warpos-ship-coverage] ${boundaryViolations.length} ship-boundary violation(s) (SP-20260531-002):`,
        );
        for (const b of boundaryViolations) console.error(`  - ${b}`);
        console.error(
          `Fix: _guides/** must ship (ASSET_DIRS); _planning/** + _reports/** must never ship (walk-skip + absent from ASSET_DIRS).`,
        );
      }
    }
    if (infoGaps.length) {
      console.log(
        `INFO [warpos-ship-coverage] ${infoGaps.length} owner=framework dev-tooling path(s) not shipped (tests/, top-level scripts/*.js, root dev docs) — framework-internal; full allowlist curation tracked as the SP-20260525-024 follow-up. Run --json to list.`,
      );
    }
  }
  process.exit(result.ok ? 0 : 1);
}

main();
