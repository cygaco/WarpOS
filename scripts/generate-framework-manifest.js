#!/usr/bin/env node

/**
 * generate-framework-manifest.js — build .claude/framework-manifest.json
 *
 * Walks the WarpOS source tree, classifies every shippable asset by kind,
 * and writes a single declarative manifest at .claude/framework-manifest.json.
 *
 * The installer (warp-setup.js) consumes this manifest instead of hand-coded
 * copyDir calls. Missing assets become impossible because every dir is
 * enumerated — if a file isn't in the manifest, the installer doesn't see it.
 *
 * Usage:
 *   node scripts/generate-framework-manifest.js
 *
 * Run this:
 *   - After adding/removing/renaming any .claude/, scripts/, requirements/,
 *     patterns/ asset
 *   - Before every WarpOS commit that touches assets (enforced by the
 *     framework-manifest-guard hook at commit time)
 *
 * Not auto-run via hook because:
 *   - PostToolUse rewriting a committed file on every edit is noisy
 *   - Mid-session manifest bouncing during rapid edits is worse than the
 *     deterministic "run before commit" model
 *   - β DECIDE 2026-04-18 (0.91): "Guards that block, not guards that mutate"
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, ".claude", "framework-manifest.json");

// ── What counts as a shippable asset ────────────────────
// Directories the manifest enumerates, and the kind label for each.
const ASSET_DIRS = [
  { src: ".claude/agents", kind: "agent" },
  { src: ".claude/commands", kind: "skill" },
  { src: ".claude/project/reference", kind: "reference" },
  { src: ".claude/project/maps", kind: "maps_baseline" },
  { src: "scripts/hooks", kind: "hook" }, // refined to hook_lib by path below
  { src: "scripts/tools", kind: "tool" },
  { src: "requirements", kind: "requirement" },
  { src: "patterns", kind: "pattern" },
];

// Top-level scripts (peers of scripts/hooks/, scripts/tools/).
const TOP_LEVEL_SCRIPTS = [
  { src: "scripts/path-lint.js", kind: "top_script" },
  { src: "scripts/dispatch-agent.js", kind: "top_script" },
  { src: "scripts/generate-maps.js", kind: "top_script" },
  { src: "scripts/generate-framework-manifest.js", kind: "top_script" },
  // warp-setup.js is NOT shipped to target projects — it's the installer itself.
  //   Clients invoke it from ../WarpOS/, not from their own scripts/.
];

// Root-level docs installed into the target project root (not into .claude/).
const FRAMEWORK_DOCS = [
  { src: "CLAUDE.md", dest: "CLAUDE.md", merge: "append-if-exists" },
  { src: "AGENTS.md", dest: "AGENTS.md", merge: "append-if-exists" },
];

// Files the installer GENERATES at install time (not copied from source).
// Each entry lists the output path + the name of the code block that builds it.
// These are declarative markers — the installer code still writes the logic,
// but the manifest declares what outputs must exist post-install.
const GENERATED_FILES = [
  { dest: ".claude/paths.json", builder: "paths-builder" },
  { dest: ".claude/manifest.json", builder: "manifest-builder" },
  { dest: ".claude/agents/store.json", builder: "store-builder" },
  { dest: ".claude/project/memory/events.jsonl", builder: "empty-file" },
  { dest: ".claude/project/memory/learnings.jsonl", builder: "empty-file" },
  { dest: ".claude/project/memory/traces.jsonl", builder: "empty-file" },
  { dest: ".claude/project/memory/systems.jsonl", builder: "systems-seeder" },
  {
    dest: ".claude/settings.json",
    builder: "settings-merger",
    idempotent: true,
  },
  { dest: ".gitignore", builder: "gitignore-block-appender", idempotent: true },
];

// Refine kind labels based on file path — e.g. files inside scripts/hooks/lib/
// are hook_lib, not hook. Keeps category-level counts accurate for the installer.
function refineKind(baseKind, relPath) {
  if (baseKind === "hook" && relPath.includes("scripts/hooks/lib/")) {
    return "hook_lib";
  }
  return baseKind;
}

// ── Walker ──────────────────────────────────────────────
function walkDir(absDir, relBase = "") {
  const out = [];
  if (!fs.existsSync(absDir)) return out;
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    const abs = path.join(absDir, entry.name);
    const rel = path.join(relBase, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      out.push(...walkDir(abs, rel));
    } else if (entry.isFile()) {
      out.push(rel);
    }
  }
  return out;
}

function collectAssets() {
  const assets = [];
  for (const dir of ASSET_DIRS) {
    const abs = path.join(ROOT, dir.src);
    const files = walkDir(abs);
    for (const f of files) {
      const fullRel = `${dir.src}/${f}`;
      assets.push({
        src: fullRel,
        dest: fullRel,
        kind: refineKind(dir.kind, fullRel),
      });
    }
  }
  for (const t of TOP_LEVEL_SCRIPTS) {
    if (fs.existsSync(path.join(ROOT, t.src))) {
      assets.push({ src: t.src, dest: t.src, kind: t.kind });
    }
  }
  for (const d of FRAMEWORK_DOCS) {
    if (fs.existsSync(path.join(ROOT, d.src))) {
      assets.push({
        src: d.src,
        dest: d.dest,
        kind: "framework_doc",
        merge: d.merge,
      });
    }
  }
  return assets;
}

// ── Build manifest ──────────────────────────────────────
const assets = collectAssets();

// Group by kind for human readability. Within a kind, sort by src path.
const byKind = {};
for (const a of assets) {
  (byKind[a.kind] = byKind[a.kind] || []).push(a);
}
for (const kind of Object.keys(byKind)) {
  byKind[kind].sort((x, y) => x.src.localeCompare(y.src));
}

const version = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, "version.json"), "utf8"))
      .version;
  } catch {
    return "0.0.0";
  }
})();

const manifest = {
  $schema: "warpos/framework-manifest/v1",
  version,
  generated_at: new Date().toISOString(),
  generated_by: "scripts/generate-framework-manifest.js",
  counts: Object.fromEntries(
    Object.entries(byKind).map(([k, v]) => [k, v.length]),
  ),
  total: assets.length,
  assets: byKind,
  generated_files: GENERATED_FILES,
};

// Ensure output dir exists
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// Stable JSON output (sorted keys at each level would be nicer, but grouping
// by kind already gives us determinism where it matters)
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n");

// Reporting
const pad = (s, n) => s.padEnd(n, " ");
console.log(`\n  WarpOS framework manifest written`);
console.log(`  Output: .claude/framework-manifest.json`);
console.log(`  Version: ${version}`);
console.log(`  Generated: ${manifest.generated_at}\n`);
console.log(`  Asset counts by kind:`);
for (const [k, v] of Object.entries(manifest.counts).sort(
  (a, b) => b[1] - a[1],
)) {
  console.log(`    ${pad(k, 20)} ${v}`);
}
console.log(`    ${pad("TOTAL", 20)} ${manifest.total}`);
console.log(`    ${pad("+ generated", 20)} ${GENERATED_FILES.length}\n`);
