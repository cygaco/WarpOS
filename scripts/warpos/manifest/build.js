#!/usr/bin/env node
/**
 * scripts/warpos/manifest/build.js — produce _warpos/MANIFEST.json.
 *
 * SP-20260522-001 / T-180-followup. Walks the canonical framework source
 * tree, classifies each path's ownership (framework | generated | project
 * | runtime), computes sha256 for owner=framework entries, and emits a
 * manifest matching schemas/warpos-manifest.schema.json (v1).
 *
 * Usage:
 *   node scripts/warpos/manifest/build.js \
 *     [--root <dir>]               # default: repo root (process.cwd())
 *     [--out <file>]               # default: <root>/_warpos/MANIFEST.json
 *     [--source-prefix <dir>]      # default: framework  (canonical-style)
 *                                  # use _warpos when running in a product install
 *     [--warpos-version <v>]       # default: read from <root>/version.json
 *     [--dry-run]                  # print to stdout instead of writing
 *     [--json]                     # print summary as JSON
 *
 * Default classification rules — keep these explicit so the generator's
 * output is reviewable:
 *
 *   1. Anything under `<source-prefix>/`                       → owner=framework
 *      (source path = the file itself; products inherit via /warp:update)
 *   2. `.claude/settings.json`                                 → owner=generated
 *      (compiled_from = [<source-prefix>/settings/defaults.json,
 *                        .claude/settings.local.json])
 *   3. `.claude/commands/**`, `.claude/agents/**` (excluding
 *      the .system/policy/, .system/beta/, store.json carve-outs) → owner=framework
 *      with source pointer to <source-prefix>/commands or /agents
 *   4. `.claude/agents/00-alex/.system/policy/decision-policy.md` → owner=project
 *      seeded_from <source-prefix>/templates/policy/decision-policy.md
 *   5. .claude/agents/<*>/events.jsonl,
 *      .claude/agents/<*>/.workspace/,
 *      .claude/runtime/, .claude/content/,
 *      .claude/project/events/, .claude/project/memory/,
 *      .claude/.session-<*>, .claude/.store-lock,
 *      .claude/project/builds/, .claude/project/sprint/,
 *      .claude/project/decisions/, .claude/project/maps/         -> owner=runtime
 *   6. _requirements/<*>, _docs/<*>, root-level user content    -> owner=project
 *      seeded_from <source-prefix>/templates/...
 *
 * Anything outside these rules is reported as `unclassified` and the
 * generator refuses to write the manifest unless `--allow-unclassified`
 * is passed. Better to fail loudly than silently fork ownership.
 *
 * Exit codes:
 *   0  manifest written (or printed in dry-run)
 *   1  unclassified paths blocked the write
 *   2  CLI parse error / missing root / schema-write failure
 */

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SCHEMA_ID = "warpos/manifest/v1";

function parseArgs(argv) {
  const out = {
    root: process.cwd(),
    outPath: null,
    sourcePrefix: "framework",
    warposVersion: null,
    dryRun: false,
    json: false,
    allowUnclassified: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--root") out.root = path.resolve(argv[++i]);
    else if (a === "--out") out.outPath = argv[++i];
    else if (a === "--source-prefix") out.sourcePrefix = argv[++i];
    else if (a === "--warpos-version") out.warposVersion = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--json") out.json = true;
    else if (a === "--allow-unclassified") out.allowUnclassified = true;
  }
  return out;
}

function printHelp() {
  process.stdout.write(`
scripts/warpos/manifest/build.js — produce _warpos/MANIFEST.json

Usage:
  node scripts/warpos/manifest/build.js [flags]

Flags:
  --root <dir>            walk this dir (default: cwd)
  --out <file>            manifest destination (default: <root>/_warpos/MANIFEST.json)
  --source-prefix <dir>   framework source dir (default: framework; products use _warpos)
  --warpos-version <v>    pin manifest's warposVersion (default: read version.json)
  --dry-run               print to stdout, no write
  --json                  emit summary as JSON
  --allow-unclassified    write manifest even with unclassified paths (NOT RECOMMENDED)
  --help, -h              show this message

Schema: schemas/warpos-manifest.schema.json (v1)
`);
}

// ── Classification rules ─────────────────────────────────────────────

/**
 * Build the rule set as an ordered array of predicates. Each rule returns
 * a partial pathEntry (without sha256/installedSha; those are filled by
 * the walker) or null if the path doesn't match.
 *
 * Order matters — first match wins. More specific rules MUST appear
 * before more general ones.
 */
function buildRules(sourcePrefix) {
  return [
    // RUNTIME — most specific first
    {
      name: "runtime-session-files",
      match: (rel) =>
        /^\.claude\/\.(session-id|session-prompts\.log|session-tracking\.jsonl|session-checkpoint\.json|session-start-commit|store-lock|agent-result-hashes\.json|last-checkpoint)$/.test(
          rel,
        ),
      entry: () => ({ owner: "runtime", managed: false }),
    },
    {
      name: "runtime-agent-events",
      match: (rel) =>
        rel.startsWith(".claude/agents/") &&
        (rel.endsWith("/events.jsonl") ||
          rel.endsWith("/.system/events.jsonl")),
      entry: () => ({
        owner: "runtime",
        managed: false,
        kind: "jsonl",
      }),
    },
    {
      name: "runtime-agent-workspace",
      match: (rel) => /^\.claude\/agents\/[^\/]+\/\.workspace\//.test(rel),
      entry: () => ({ owner: "runtime", managed: false, kind: "dir" }),
    },
    {
      name: "runtime-claude-buckets",
      match: (rel) =>
        rel.startsWith(".claude/runtime/") ||
        rel.startsWith(".claude/content/") ||
        rel.startsWith(".claude/project/events/") ||
        rel.startsWith(".claude/project/memory/") ||
        rel.startsWith(".claude/project/builds/") ||
        rel.startsWith(".claude/project/decisions/") ||
        rel.startsWith(".claude/project/maps/") ||
        rel.startsWith(".claude/project/sprint/") ||
        rel.startsWith(".claude/logs/") || // manifest classifier matches this prefix by design; path-literal-allowed
        rel.startsWith(".claude/handoffs/") || // manifest classifier matches this prefix by design; path-literal-allowed
        rel === ".claude/handoff.md",
      entry: () => ({ owner: "runtime", managed: false }),
    },
    {
      name: "runtime-warpos-transactions",
      match: (rel) => rel.startsWith(".warpos/"),
      entry: () => ({ owner: "runtime", managed: false }),
    },
    {
      // Build-system state created by warp-setup.js (NOT shipped via the
      // framework-manifest). Explicitly a carve-out from owner=framework per
      // this file's header. Mutable; never regenerated. Present in every
      // installed product, absent in canonical — so without this rule a
      // product manifest build fails with store.json unclassified.
      name: "runtime-build-store",
      match: (rel) => rel === ".claude/agents/store.json",
      entry: () => ({
        owner: "runtime",
        managed: false,
        kind: "json",
        _note: "Build-mode state — created/mutated by warp-setup.js + dispatch. Not a framework view.",
      }),
    },
    // PROJECT — decision policy + filled requirement templates
    {
      name: "project-decision-policy",
      match: (rel) =>
        rel ===
        ".claude/agents/00-alex/.system/policy/decision-policy.md",
      entry: () => ({
        owner: "project",
        managed: false,
        seeded_from: `${sourcePrefix}/templates/policy/decision-policy.md`,
        class: "fillable",
      }),
    },
    {
      name: "project-requirements",
      match: (rel) => rel.startsWith("_requirements/"),
      entry: (rel) => ({
        owner: "project",
        managed: false,
        seeded_from: `${sourcePrefix}/templates/${rel.replace(/^_requirements\//, "_requirements/")}`,
        class: "fillable",
      }),
    },
    {
      name: "project-docs",
      match: (rel) =>
        rel.startsWith("_docs/") &&
        !rel.startsWith("_docs/briefs/") &&
        !rel.startsWith("_docs/clones/") &&
        !rel.startsWith("_docs/imports/"),
      entry: () => ({
        owner: "project",
        managed: false,
        class: "reference",
      }),
    },
    {
      name: "project-portfolio-output",
      match: (rel) =>
        rel.startsWith("_docs/briefs/") ||
        rel.startsWith("_docs/clones/") ||
        rel.startsWith("_docs/imports/"),
      entry: () => ({
        owner: "project",
        managed: false,
        class: "data",
      }),
    },

    // GENERATED — settings.json (compiled from layered inputs)
    {
      name: "generated-settings",
      match: (rel) => rel === ".claude/settings.json",
      entry: () => ({
        owner: "generated",
        managed: false,
        compiled_from: [
          `${sourcePrefix}/settings/defaults.json`,
          ".claude/settings.local.json",
        ],
        compiler: "scripts/warpos/settings/compile.js",
        kind: "json",
      }),
    },
    {
      name: "generated-paths-json",
      match: (rel) => rel === ".claude/paths.json",
      entry: () => ({
        owner: "generated",
        managed: false,
        compiled_from: [`${sourcePrefix}/paths.registry.json`],
        compiler: "scripts/paths/build.js",
        kind: "json",
      }),
    },
    {
      name: "generated-framework-manifest-legacy",
      match: (rel) => rel === ".claude/framework-manifest.json",
      entry: () => ({
        owner: "generated",
        managed: false,
        compiled_from: [`${sourcePrefix}/`],
        compiler: "scripts/generate-framework-manifest.js",
        kind: "json",
        _note: "Legacy v0.x manifest. Will be superseded by _warpos/MANIFEST.json in v1.0.",
      }),
    },
    {
      name: "generated-framework-installed",
      match: (rel) => rel === ".claude/framework-installed.json",
      entry: () => ({
        owner: "generated",
        managed: false,
        compiled_from: [".claude/framework-manifest.json"],
        compiler: "scripts/warp-setup.js",
        kind: "json",
        _note: "Per-install snapshot of what was copied to this project at /warp:setup time. Will be folded into _warpos/MANIFEST.json#paths.*.installedSha in v1.0.",
      }),
    },
    {
      name: "generated-project-manifest",
      match: (rel) => rel === ".claude/manifest.json",
      entry: () => ({
        owner: "generated",
        managed: false,
        compiled_from: ["scripts/dispatch/providers.js"],
        compiler: "scripts/warp-setup.js",
        kind: "json",
        _note: "Project identity card — metadata, features, providers. Seeded at install with DEFAULT_AGENT_PROVIDERS.",
      }),
    },
    {
      name: "project-settings-local",
      match: (rel) => rel === ".claude/settings.local.json",
      entry: () => ({
        owner: "project",
        managed: false,
        class: "config",
        _note: "Per-project override layer for the three-layer settings compiler. Edit THIS file; .claude/settings.json is generated.",
      }),
    },

    // FRAMEWORK — generated view (.claude/commands/, .claude/agents/) mirroring source
    //
    // Source-pointer semantics:
    //   - In CANONICAL (sourcePrefix=framework): the file at `.claude/commands/foo.md`
    //     IS the source (canonical has no separate `framework/commands/` mirror yet).
    //     Source pointer is self-referential; the regenerator no-ops.
    //   - In PRODUCT (sourcePrefix=_warpos): the source lives at
    //     `_warpos/commands/foo.md` (populated by /warp:setup from canonical).
    //     Regenerator copies source → .claude/commands/foo.md.
    {
      name: "framework-claude-command",
      match: (rel) =>
        rel.startsWith(".claude/commands/") && rel.endsWith(".md"),
      entry: (rel) => ({
        owner: "framework",
        managed: true,
        source:
          sourcePrefix === "framework"
            ? rel
            : `${sourcePrefix}/${rel.replace(/^\.claude\//, "")}`,
        kind: "md",
      }),
    },
    {
      name: "framework-claude-agent",
      match: (rel) =>
        rel.startsWith(".claude/agents/") &&
        rel.endsWith(".md") &&
        !rel.includes("/.system/policy/decision-policy.md"),
      entry: (rel) => ({
        owner: "framework",
        managed: true,
        source:
          sourcePrefix === "framework"
            ? rel
            : `${sourcePrefix}/${rel.replace(/^\.claude\//, "")}`,
        kind: "md",
      }),
    },

    // FRAMEWORK — source tree itself
    {
      name: "framework-source",
      match: (rel) => rel.startsWith(`${sourcePrefix}/`),
      entry: (rel) => ({
        owner: "framework",
        managed: true,
        source: rel,
      }),
    },
    {
      // The canonical `framework/` directory (releases, paths.registry.json,
      // migrations) ships into every product verbatim via the framework-
      // manifest. It is framework source-of-truth INDEPENDENT of --source-
      // prefix: in canonical sourcePrefix=framework so the rule above already
      // catches it, but in a product (sourcePrefix=_warpos) the rule above
      // matches `_warpos/` instead, leaving `framework/` unclassified. This
      // rule classifies it as self-referential framework source in both cases.
      name: "framework-canonical-dir",
      match: (rel) => rel.startsWith("framework/"),
      entry: (rel) => ({
        owner: "framework",
        managed: true,
        source: rel,
      }),
    },
    {
      name: "framework-scripts",
      match: (rel) =>
        rel.startsWith("scripts/") && !rel.startsWith("scripts/one-off/"),
      entry: (rel) => ({
        owner: "framework",
        managed: true,
        source: rel,
      }),
    },
    {
      name: "framework-schemas",
      match: (rel) => rel.startsWith("schemas/"),
      entry: (rel) => ({
        owner: "framework",
        managed: true,
        source: rel,
      }),
    },
    {
      name: "framework-root-doc",
      match: (rel) =>
        rel === "CLAUDE.md" ||
        rel === "AGENTS.md" ||
        rel === "PROJECT.md" ||
        rel === "README.md" ||
        rel === "USER_GUIDE.md" ||
        rel === "DICTIONARY.md" ||
        rel === "ROADMAP.md" ||
        rel === "RELEASES.md" ||
        rel === ".gitignore" ||
        rel === "version.json",
      entry: () => ({
        owner: "framework",
        managed: true,
        source: null,
        _note: "Root document — source path same as destination (canonical-side).",
      }),
    },
    {
      name: "framework-misc",
      match: (rel) =>
        rel === "package.json" ||
        rel === "package-lock.json" ||
        rel === "install.ps1" ||
        rel === "install.sh" ||
        rel.startsWith("tests/") ||
        rel.startsWith(".github/") ||
        rel.startsWith("migrations/") ||
        rel.startsWith("patterns/") ||
        rel.startsWith("fixtures/") ||
        rel.startsWith("scripts/one-off/") ||
        rel.endsWith(".env.example"),
      entry: () => ({
        owner: "framework",
        managed: true,
        source: null,
      }),
    },
    {
      name: "runtime-root-issues-ledger",
      match: (rel) => rel === "issues.md",
      entry: () => ({
        owner: "runtime",
        managed: false,
        kind: "md",
        _note: "paths.sprintIssuesLedger — auto-managed by scripts/sprint/issue.js",
      }),
    },
    {
      name: "runtime-dump",
      match: (rel) => rel === "DUMP.md",
      entry: () => ({ owner: "runtime", managed: false }),
    },
    {
      name: "framework-claude-reference",
      match: (rel) => rel.startsWith(".claude/project/reference/"),
      entry: (rel) => ({
        owner: "framework",
        managed: true,
        source:
          sourcePrefix === "framework"
            ? rel
            : `${sourcePrefix}/${rel.replace(/^\.claude\//, "")}`,
        kind: rel.endsWith(".md") ? "md" : undefined,
      }),
    },
    {
      name: "framework-claude-agent-system",
      match: (rel) =>
        rel.startsWith(".claude/agents/") &&
        (rel.endsWith(".json") || rel.endsWith(".schema.json")) &&
        rel.includes("/.system/"),
      entry: (rel) => ({
        owner: "framework",
        managed: true,
        source:
          sourcePrefix === "framework"
            ? rel
            : `${sourcePrefix}/${rel.replace(/^\.claude\//, "")}`,
        kind: "json",
      }),
    },
    {
      name: "project-dreams",
      match: (rel) => rel.startsWith(".claude/dreams/"),
      entry: () => ({
        owner: "project",
        managed: false,
        class: "guide",
        _note: "Operator's dream journal — written by /sleep:* skills + manual edits. Project-owned; never overwritten.",
      }),
    },
    {
      name: "generated-warpos-manifest",
      match: (rel) => rel === "_warpos/MANIFEST.json",
      entry: () => ({
        owner: "generated",
        managed: false,
        compiled_from: ["framework/"],
        compiler: "scripts/warpos/manifest/build.js",
        kind: "json",
        _note: "Per-install ownership manifest. Regenerated on /warp:setup and /warp:update. SP-20260522-001.",
      }),
    },
    {
      name: "framework-warpos-zone",
      match: (rel) => rel.startsWith("_warpos/") && rel !== "_warpos/MANIFEST.json",
      entry: (rel) => ({
        owner: "framework",
        managed: true,
        source: rel,
        _note: "_warpos/ is the framework source-of-truth zone in installed products (post-SP-20260522-001).",
      }),
    },
  ];
}

function classify(rel, rules) {
  for (const rule of rules) {
    if (rule.match(rel)) {
      const e = rule.entry(rel);
      return { rule: rule.name, entry: e };
    }
  }
  return null;
}

// ── Filesystem walk ──────────────────────────────────────────────────

const WALK_SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".warpos",
  ".warpos-backup",
  ".vscode",
  ".idea",
  "runtime",
  "worktrees", // .claude/worktrees/ — agent scratch clones; not framework
]);

const WALK_SKIP_FILES = new Set([
  ".env",
  ".env.local",
  "DUMP.md",
  ".DS_Store",
  "Thumbs.db",
]);

function* walk(rootAbs) {
  const stack = [rootAbs];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      if (WALK_SKIP_DIRS.has(ent.name)) continue;
      if (WALK_SKIP_FILES.has(ent.name)) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (ent.isFile()) {
        yield full;
      }
      // ignore symlinks + special files
    }
  }
}

function sha256OfFile(file) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(file));
  return h.digest("hex");
}

function relPath(rootAbs, fullPath) {
  return path
    .relative(rootAbs, fullPath)
    .split(path.sep)
    .join("/");
}

// ── Driver ───────────────────────────────────────────────────────────

function build(opts) {
  const root = path.resolve(opts.root);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    return { ok: false, code: 2, error: `--root not a directory: ${root}` };
  }

  let warposVersion = opts.warposVersion;
  if (!warposVersion) {
    try {
      const vj = JSON.parse(
        fs.readFileSync(path.join(root, "version.json"), "utf8"),
      );
      warposVersion = vj.version || "0.0.0";
    } catch {
      warposVersion = "0.0.0";
    }
  }

  const rules = buildRules(opts.sourcePrefix);
  const paths = {};
  const unclassified = [];
  const ruleHits = Object.create(null);

  for (const full of walk(root)) {
    const rel = relPath(root, full);
    if (!rel || rel.startsWith("..")) continue;
    const classification = classify(rel, rules);
    if (!classification) {
      unclassified.push(rel);
      continue;
    }
    const entry = { ...classification.entry };
    if (entry.owner === "framework") {
      try {
        const sha = sha256OfFile(full);
        entry.sha256 = sha;
        entry.installedSha = sha;
      } catch {
        /* unreadable */
      }
    }
    paths[rel] = entry;
    ruleHits[classification.rule] =
      (ruleHits[classification.rule] || 0) + 1;
  }

  if (unclassified.length > 0 && !opts.allowUnclassified) {
    return {
      ok: false,
      code: 1,
      error: `${unclassified.length} unclassified path(s); add a rule or pass --allow-unclassified`,
      unclassified,
      ruleHits,
    };
  }

  const manifest = {
    $schema: SCHEMA_ID,
    version: 1,
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    generatedBy: "scripts/warpos/manifest/build.js",
    warposVersion,
    migrations: [],
    paths,
  };

  const outPath =
    opts.outPath || path.join(root, "_warpos", "MANIFEST.json");

  if (opts.dryRun) {
    return {
      ok: true,
      code: 0,
      dryRun: true,
      outPath,
      ruleHits,
      pathCount: Object.keys(paths).length,
      unclassifiedCount: unclassified.length,
      manifestPreview: { ...manifest, paths: undefined, _pathCount: Object.keys(paths).length },
    };
  }

  try {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
  } catch (err) {
    return {
      ok: false,
      code: 2,
      error: `write failed: ${err.message}`,
      outPath,
    };
  }

  return {
    ok: true,
    code: 0,
    outPath,
    ruleHits,
    pathCount: Object.keys(paths).length,
    unclassifiedCount: unclassified.length,
  };
}

// ── CLI ──────────────────────────────────────────────────────────────

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    return 0;
  }
  const r = build(opts);
  if (opts.json) {
    process.stdout.write(JSON.stringify(r, null, 2) + "\n");
  } else if (!r.ok) {
    process.stderr.write(`manifest build failed: ${r.error}\n`);
    if (r.unclassified) {
      process.stderr.write(
        `unclassified (showing first 10):\n${r.unclassified.slice(0, 10).map((p) => "  " + p).join("\n")}\n`,
      );
      if (r.unclassified.length > 10) {
        process.stderr.write(
          `  ... and ${r.unclassified.length - 10} more\n`,
        );
      }
    }
  } else {
    process.stdout.write(
      `manifest written: ${r.outPath}\n  paths: ${r.pathCount}\n  rules hit: ${Object.keys(r.ruleHits).length}\n`,
    );
    if (r.dryRun)
      process.stdout.write(`  (dry-run — no file was written)\n`);
  }
  return r.code;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { build, buildRules, classify, sha256OfFile };
