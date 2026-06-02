#!/usr/bin/env node
/* eslint-disable no-console */
"use strict";
/**
 * scripts/checks/warpos-ship-coverage.js — THE systemic enforcer for the
 * "downstream always missing something" class (SP-20260525-024). EXHAUSTIVE
 * as of 0.16.0 (run-0160): every owner=framework path is either shipped or in
 * a reviewed KNOWN_NOT_SHIPPED entry (zero unallowlisted info_gaps). Also
 * asserts seeded_from integrity: every manifest seeded_from pointer must
 * resolve to a real file, OR be in KNOWN_DANGLING (currently all 100 dangling
 * pointers are allowlisted, tied to the deferred Pattern-realignment sprint).
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
 * Also asserts seeded_from integrity: every `seeded_from` value in _warpos/MANIFEST.json
 * must point at an existing file (path.join(ROOT, seeded_from) exists), OR be in
 * KNOWN_DANGLING. Any dangling seeded_from NOT in KNOWN_DANGLING is a RED (new
 * regression); the 100 currently-dangling pointers (all under
 * framework/templates/_requirements/ + framework/templates/policy/) are in KNOWN_DANGLING,
 * tied to the deferred 0.16.0 Pattern-realignment sprint that will author those templates.
 *
 * Wire into scripts/warpos/release-gates.js so "forgot to ship X" fails the
 * release loudly instead of surfacing months later in a consumer install.
 *
 * Exit: 0 = every framework-owned path ships or is allowlisted AND all seeded_from
 *           pointers resolve or are in KNOWN_DANGLING; 1 = gap(s); 2 = setup error.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.argv.includes("--root")
  ? path.resolve(process.argv[process.argv.indexOf("--root") + 1])
  : process.cwd();
const JSON_OUT = process.argv.includes("--json");

// ── KNOWN_DANGLING: seeded_from pointers that don't resolve yet ───────────────
// These are deliberately deferred — the seed template files have not been authored.
// Cleared when the source templates are written in the 0.16.0 Pattern-realignment sprint.
// A NEW dangling seeded_from NOT in this list is a RED (regression-catching gate).
// Prefix match on the seeded_from value (relative path from project root).
const KNOWN_DANGLING = [
  {
    prefix: "framework/templates/_requirements/",
    reason:
      "seed template not yet authored — deferred to 0.16.0 Pattern-realignment " +
      "(build _warpos/templates/ with real content); tracked, must be cleared when authored",
  },
  {
    prefix: "framework/templates/policy/",
    reason:
      "seed template not yet authored — deferred to 0.16.0 Pattern-realignment " +
      "(build _warpos/templates/ with real content); tracked, must be cleared when authored",
  },
];

// ── KNOWN_NOT_SHIPPED: framework-owned on disk but intentionally NOT shipped ──
// Deliberate, reviewed exclusions: framework-owned on disk but intentionally
// NOT shipped via framework-manifest. Each MUST have a reason.
// Supports two forms:
//   { prefix: "...", reason: "..." }  — path equals or starts with prefix
//   { match: (p) => bool, reason: "..." } — custom predicate (use for patterns)
const KNOWN_NOT_SHIPPED = [
  // _warpos/ is the product-side source mirror — GENERATED at install time
  // (populateWarposMirror), not shipped from canonical. Canonical's own _warpos/
  // (MANIFEST.json + settings/defaults.json) is build output, not a shippable asset.
  { prefix: "_warpos/", reason: "product-generated source mirror, not shipped from canonical" },
  // WarpOS-as-product canon — root-leak pending 0.10.0 scrub; product content,
  // never shipped (consumers generate their own via the canon engine).
  { prefix: "_requirements/00-canonical/", reason: "WarpOS product canon (root-leak pending scrub); consumers generate their own" },
  // Dev-only / framework-maintenance artifacts (already excluded from ASSET_DIRS).
  { prefix: "scripts/one-off/", reason: "framework-dev one-off scripts (directory)" },
  { prefix: "scripts/products/", reason: "framework-dev product scripts" },
  // Installer self + dev metadata.
  { prefix: "install.ps1", reason: "the installer itself (consumers run it, don't receive a copy via manifest)" },
  { prefix: "install.sh", reason: "the installer itself" },
  { prefix: "package.json", reason: "framework-dev metadata" },
  { prefix: "package-lock.json", reason: "framework-dev metadata" },
  { prefix: "README.md", reason: "framework-repo readme; consumers get their own scaffolded PROJECT.md/README" },
  { prefix: "CLAUDE.md", reason: "merged separately by /warp:setup CLAUDE.md merge, not a manifest asset" },
  { prefix: "version.json", reason: "shipped as version_file (separate manifest section), not an asset dir" },

  // ── Exhaustive dev-tooling allowlist (SP-20260525-024 follow-up; run-0160 curation) ──
  // Root dev documents — framework-authoring docs, never shipped to consumers.
  { prefix: ".gitattributes", reason: "framework-repo git config — dev-tooling, not shipped to consumers" },
  { prefix: "DICTIONARY.md", reason: "framework-repo authoring glossary — dev-tooling, not shipped to consumers" },
  { prefix: "INTERESTING.md", reason: "framework-repo project notes — dev-tooling, not shipped to consumers" },
  { prefix: "PROJECT.md", reason: "framework-repo project doc — dev-tooling; consumers get their own scaffolded PROJECT.md" },
  { prefix: "RELEASES.md", reason: "framework-repo release notes — dev-tooling, not shipped to consumers" },
  { prefix: "ROADMAP.md", reason: "framework-repo roadmap — dev-tooling, not shipped to consumers" },
  { prefix: "USER_GUIDE.md", reason: "framework-repo user guide — dev-tooling; consumers get per-product docs" },

  // Framework version migrations — internal tooling, not shipped to consumers.
  { prefix: "migrations/", reason: "framework version migration scripts — internal tooling, never shipped to consumers" },

  // Framework regression tests — internal test suite, not shipped.
  { prefix: "tests/", reason: "framework regression test suite — internal, never shipped to consumers" },

  // Top-level scripts/*.js — framework-dev orchestrators, analyzers, dashboards.
  // Predicate covers ONLY direct children of scripts/ (no slashes in basename).
  // scripts/hooks/, scripts/warpos/, scripts/checks/ etc. are separately governed
  // by ASSET_DIRS and the hard-signal root check.
  {
    match: (p) => /^scripts\/[^/]+\.js$/.test(p),
    reason: "top-level framework-dev tooling scripts (orchestrators/analyzers/dashboards) — not consumer assets",
  },

  // Framework-internal dev subdirectories.
  { prefix: "scripts/arbitration/", reason: "framework-internal arbitration module — dev-tooling, not shipped" },
  { prefix: "scripts/contracts/", reason: "framework-internal contract validation module + fixtures — dev-tooling, not shipped" },
  { prefix: "scripts/etc/", reason: "framework-internal etc harness module — dev-tooling, not shipped" },
  { prefix: "scripts/growth/", reason: "framework-internal growth analytics scripts — dev-tooling, not shipped" },
  { prefix: "scripts/guides/", reason: "framework-internal guide registry scripts — dev-tooling, not shipped" },
  { prefix: "scripts/models/", reason: "framework-internal model check scripts — dev-tooling, not shipped" },
  { prefix: "scripts/scaffold/", reason: "framework-internal scaffold scripts — dev-tooling, not shipped" },
  { prefix: "scripts/testsuite/", reason: "framework-internal test suite runner — dev-tooling, not shipped" },

  // Stray scratch / manifest-misclassification: these files are owner=framework in the
  // manifest but are per-run scratch artifacts that should eventually be reclassified
  // (deferred; out of scope for this sprint). Allowlisted to avoid false-positive gate
  // failures until the manifest is corrected.
  {
    match: (p) => /^scripts\/delta-[^/]+\.txt$/.test(p),
    reason: "stray scratch: per-run delta output files — manifest-misclassification (should be owner=runtime); deferred reclassification",
  },
  { prefix: "scripts/market-research-fix-1-brief.md", reason: "stray scratch: per-run brief artifact — manifest-misclassification; deferred reclassification" },
  { prefix: "scripts/store-viewer.html", reason: "stray scratch: dev HTML viewer — manifest-misclassification; deferred reclassification" },
  { prefix: "scripts/run-compliance.sh", reason: "stray scratch: dev compliance runner — manifest-misclassification; deferred reclassification" },
  { prefix: "scripts/install-git-hooks.sh", reason: "stray scratch: dev git-hooks installer — manifest-misclassification; deferred reclassification" },
  { prefix: "scripts/path-lint.rules.generated.json", reason: "stray scratch: generated path-lint rules — manifest-misclassification; deferred reclassification" },
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
  return KNOWN_NOT_SHIPPED.find((a) => {
    if (typeof a.match === "function") return a.match(p);
    return p === a.prefix || p.startsWith(a.prefix);
  });
}

function isKnownDangling(seededFrom) {
  return KNOWN_DANGLING.find(
    (a) => seededFrom === a.prefix || seededFrom.startsWith(a.prefix),
  );
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

  // ── seeded_from integrity check ───────────────────────────────────────────
  // Every manifest seeded_from pointer must point at a real file, OR be in
  // KNOWN_DANGLING. Dangling pointers NOT in KNOWN_DANGLING → RED (new regression).
  const danglingAllowlisted = [];
  const danglingUnallowlisted = [];
  let danglingTotal = 0;
  for (const [, entry] of Object.entries(ownPaths)) {
    if (!entry || !entry.seeded_from) continue;
    const sf = entry.seeded_from;
    const resolvedPath = path.join(ROOT, sf);
    if (fs.existsSync(resolvedPath)) continue; // resolves — OK
    danglingTotal++;
    if (isKnownDangling(sf)) {
      danglingAllowlisted.push(sf);
    } else {
      danglingUnallowlisted.push(sf);
    }
  }

  // ── Ship coverage check ───────────────────────────────────────────────────
  const hardGaps = []; // essential-root gaps — RED, block the release
  const infoGaps = []; // dev-tooling gaps — now fully curated; should be 0
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
    ok:
      hardGaps.length === 0 &&
      boundaryViolations.length === 0 &&
      danglingUnallowlisted.length === 0,
    framework_owned_paths: frameworkOwned,
    shipped_paths: shipped.size,
    allowlisted_rules: KNOWN_NOT_SHIPPED.length,
    hard_gaps: hardGaps,
    boundary_violations: boundaryViolations,
    info_gaps_count: infoGaps.length,
    info_gaps: infoGaps,
    // seeded_from integrity
    dangling_seeds_total: danglingTotal,
    dangling_allowlisted: danglingAllowlisted.length,
    dangling_unallowlisted: danglingUnallowlisted,
  };

  if (JSON_OUT) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.ok) {
      console.log(
        `OK   [warpos-ship-coverage] every framework-owned path under the consumer-essential roots ships (${frameworkOwned} framework-owned paths scanned, 0 info_gaps); ship-boundary intact (_guides ships, _planning/_reports do not); seeded_from: ${danglingTotal} dangling, all ${danglingAllowlisted.length} allowlisted (KNOWN_DANGLING — deferred to Pattern-realignment sprint).`,
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
      if (danglingUnallowlisted.length) {
        console.error(
          `FAIL [warpos-ship-coverage] ${danglingUnallowlisted.length} seeded_from pointer(s) are dangling and NOT in KNOWN_DANGLING (new regression):`,
        );
        for (const d of danglingUnallowlisted) console.error(`  - ${d}`);
        console.error(
          `Fix: either author the seed template at that path, OR add a reviewed KNOWN_DANGLING entry with a reason tying it to a tracked sprint.`,
        );
      }
    }
    if (infoGaps.length) {
      console.log(
        `INFO [warpos-ship-coverage] ${infoGaps.length} owner=framework path(s) not shipped and not allowlisted — add to KNOWN_NOT_SHIPPED with a reason. Run --json to list.`,
      );
    }
    if (danglingTotal > 0 && danglingUnallowlisted.length === 0) {
      console.log(
        `INFO [warpos-ship-coverage] seeded_from: ${danglingTotal} dangling pointer(s), all ${danglingAllowlisted.length} in KNOWN_DANGLING (deferred to Pattern-realignment sprint — tracked).`,
      );
    }
  }
  process.exit(result.ok ? 0 : 1);
}

main();
