#!/usr/bin/env node

/**
 * warp-setup.js — WarpOS installation script.
 *
 * Run from inside the WarpOS repo clone:
 *   node scripts/warp-setup.js <target-project-path>
 *
 * Or from the target project:
 *   node ../WarpOS/scripts/warp-setup.js .
 *
 * What it does:
 * 1. Checks prerequisites (Node 18+, Git, Claude Code)
 * 2. Copies framework files to target project
 * 3. Creates manifest.json from project scan
 * 4. Merges settings.json (additive)
 * 5. Creates directory structure
 * 6. Reports health status
 */

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const OK = "\x1b[32m  ✓  \x1b[0m";
const WARN = "\x1b[33m  !  \x1b[0m";
const FAIL = "\x1b[31m  ✗  \x1b[0m";
const INFO = "\x1b[36m  →  \x1b[0m";
const HEADER = "\x1b[1m";
const RESET = "\x1b[0m";

function log(status, msg, detail) {
  const icon =
    status === "ok"
      ? OK
      : status === "warn"
        ? WARN
        : status === "fail"
          ? FAIL
          : INFO;
  console.log(`${icon} ${msg}`);
  if (detail) console.log(`       ${detail}`);
}

function cmdExists(cmd) {
  try {
    execSync(`which ${cmd} 2>/dev/null || where ${cmd} 2>NUL`, {
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  let count = 0;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyDir(srcPath, destPath);
    } else {
      // Don't overwrite existing files without asking
      if (fs.existsSync(destPath)) {
        log("warn", `Skipped (exists): ${path.relative(TARGET, destPath)}`);
      } else {
        fs.copyFileSync(srcPath, destPath);
        count++;
      }
    }
  }
  return count;
}

// ── Parse arguments ─────────────────────────────────────
const argv = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")));
const TARGET = path.resolve(argv[0] || ".");
const WARPOS = path.resolve(__dirname, "..");
const YES = flags.has("--yes") || flags.has("-y"); // skip interview, use defaults
const DRY_RUN = flags.has("--dry-run");
const SKIP_BACKUP = flags.has("--skip-backup");
// SP-20260523-003: post-install manifest-coverage hook flags.
const SKIP_MANIFEST_CHECK = flags.has("--skip-manifest-check");
const STRICT_MANIFEST = flags.has("--strict-manifest");

if (!fs.existsSync(TARGET)) {
  console.error(`Target directory does not exist: ${TARGET}`);
  process.exit(1);
}

// ── Backup existing config before installer touches anything ─────
// /warp:uninstall reads this backup to restore the project's pre-install state.
function backupExisting() {
  if (SKIP_BACKUP) return null;
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupRoot = path.join(TARGET, ".warpos-backup", ts);
  const backupTargets = [
    "CLAUDE.md",
    "AGENTS.md",
    ".gitignore",
    ".claude",
    "scripts/hooks",
  ];
  let backedUp = 0;
  for (const rel of backupTargets) {
    const src = path.join(TARGET, rel);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(backupRoot, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      // recursive copy
      const copyDirRecursive = (s, d) => {
        fs.mkdirSync(d, { recursive: true });
        for (const entry of fs.readdirSync(s, { withFileTypes: true })) {
          const sp = path.join(s, entry.name);
          const dp = path.join(d, entry.name);
          if (entry.isDirectory()) copyDirRecursive(sp, dp);
          else fs.copyFileSync(sp, dp);
        }
      };
      copyDirRecursive(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
    backedUp++;
  }
  if (backedUp > 0) {
    // write a marker for /warp:uninstall to find
    fs.writeFileSync(
      path.join(backupRoot, "BACKUP_MANIFEST.json"),
      JSON.stringify(
        {
          created: new Date().toISOString(),
          files_backed_up: backedUp,
          warpos_version: WARPOS,
        },
        null,
        2,
      ),
    );
    log(
      "ok",
      `Backed up ${backedUp} pre-install file(s) to .warpos-backup/${ts}/`,
    );
    log("info", "/warp:uninstall restores from this backup.");
  }
  return backupRoot;
}

// ── Interview helpers ───────────────────────────────────
function ask(rl, question, defaultValue) {
  return new Promise((resolve) => {
    const suffix = defaultValue ? `\x1b[2m [${defaultValue}]\x1b[0m` : "";
    rl.question(`  ${question}${suffix} > `, (answer) => {
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

function detectMainBranch(targetDir) {
  try {
    const head = execSync("git symbolic-ref refs/remotes/origin/HEAD", {
      cwd: targetDir,
      stdio: ["pipe", "pipe", "pipe"],
    })
      .toString()
      .trim();
    const m = head.match(/origin\/(.+)$/);
    if (m) return m[1];
  } catch {
    /* no remote or detached HEAD */
  }
  try {
    const branches = execSync("git branch --list main master", {
      cwd: targetDir,
      stdio: ["pipe", "pipe", "pipe"],
    })
      .toString()
      .trim();
    if (branches.includes("main")) return "main";
    if (branches.includes("master")) return "master";
  } catch {
    /* not a git repo */
  }
  return "main";
}

function detectTool(tool) {
  try {
    execSync(`${tool} --version`, { stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    /* not installed or not in PATH */
  }
  try {
    // Also check node_modules/.bin for local installs
    const localBin = path.join(TARGET, "node_modules", ".bin", tool);
    if (fs.existsSync(localBin) || fs.existsSync(localBin + ".cmd")) {
      return true;
    }
  } catch {
    /* skip */
  }
  return false;
}

// ── Header ──────────────────────────────────────────────
console.log(`\n${HEADER}  WarpOS Setup${RESET}`);
console.log(`  Installing into: ${TARGET}`);
console.log(`  From: ${WARPOS}`);
console.log(`  ${"─".repeat(50)}\n`);

let errors = 0;
let warnings = 0;
let installed = 0;

// ── 1. Prerequisites ────────────────────────────────────
console.log(`${HEADER}  PREREQUISITES${RESET}`);

// Node.js 18+
const major = parseInt(process.version.slice(1));
if (major >= 18) {
  log("ok", `Node.js ${process.version}`);
} else {
  log("fail", `Node.js ${process.version} — need 18 or newer`);
  log("info", "Download from https://nodejs.org");
  errors++;
}

// Git
if (cmdExists("git")) {
  log("ok", "Git installed");
} else {
  log(
    "fail",
    "Git not found — required for version control and builder isolation",
  );
  errors++;
}

// Check if target is a git repo
if (fs.existsSync(path.join(TARGET, ".git"))) {
  log("ok", "Target is a git repo");
} else {
  log("warn", "Target is not a git repo — some features need git");
  log("info", "Run: git init");
  warnings++;
}

// Windows check
if (process.platform !== "win32") {
  log(
    "warn",
    "WarpOS is Windows-only for now. Some features may not work on this platform.",
  );
  warnings++;
}

if (errors > 0) {
  console.log(`\n${FAIL} ${errors} prerequisite(s) failed. Fix them first.`);
  process.exit(1);
}

// ── 2. Detect project stack ─────────────────────────────
console.log(`\n${HEADER}  PROJECT DETECTION${RESET}`);

const hasPackageJson = fs.existsSync(path.join(TARGET, "package.json"));
const hasTsConfig = fs.existsSync(path.join(TARGET, "tsconfig.json"));
const hasRequirementsTxt = fs.existsSync(path.join(TARGET, "requirements.txt"));
const hasGoMod = fs.existsSync(path.join(TARGET, "go.mod"));
const hasCargoToml = fs.existsSync(path.join(TARGET, "Cargo.toml"));

let stack = "unknown";
let framework = "unknown";
if (hasPackageJson) {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(TARGET, "package.json"), "utf8"),
    );
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.next) {
      stack = "node";
      framework = "next.js";
    } else if (deps.react) {
      stack = "node";
      framework = "react";
    } else if (deps.express) {
      stack = "node";
      framework = "express";
    } else if (deps.vue) {
      stack = "node";
      framework = "vue";
    } else {
      stack = "node";
      framework = "node.js";
    }
  } catch {
    stack = "node";
  }
} else if (hasRequirementsTxt) {
  stack = "python";
  framework = "python";
} else if (hasGoMod) {
  stack = "go";
  framework = "go";
} else if (hasCargoToml) {
  stack = "rust";
  framework = "rust";
}

log("ok", `Stack: ${stack}, Framework: ${framework}`);
if (hasTsConfig) log("ok", "TypeScript detected");

log(
  "info",
  `Project name: ${path.basename(TARGET)} (pass --interactive to override)`,
);

// ── 2.5. Collect interview answers ──────────────────────
// Defaults from scan. Interactive mode (readline) runs iff --interactive flag is set
// AND stdin is a TTY. Otherwise: use defaults, ship.
const projectNameDefault = path.basename(TARGET);
const mainBranchDefault = detectMainBranch(TARGET);
const warposSourceDefault = "https://github.com/cygaco/WarpOS.git";

const interview = {
  projectName: projectNameDefault,
  pitch: "",
  mainBranch: mainBranchDefault,
  warposSource: warposSourceDefault,
};

async function runInterview() {
  if (YES || !flags.has("--interactive")) return;
  if (!process.stdin.isTTY) return;
  console.log(`\n${HEADER}  INTERVIEW${RESET}`);
  console.log(`  (5 questions — press Enter to accept defaults)\n`);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  interview.projectName = await ask(rl, "Project name", projectNameDefault);
  interview.pitch = await ask(rl, "One-line pitch", "");
  interview.mainBranch = await ask(rl, "Main branch", mainBranchDefault);
  interview.warposSource = await ask(
    rl,
    "WarpOS repo URL (for /warp:sync, /warp:check)",
    warposSourceDefault,
  );
  rl.close();
}

// Detect available tools for hook bundle selection
const hookTools = {
  prettier: detectTool("prettier") || detectTool("npx prettier"),
  tsc: hasTsConfig && (detectTool("tsc") || detectTool("npx tsc")),
  eslint: detectTool("eslint") || detectTool("npx eslint"),
};

// ── 2.5 Backup existing config before any destructive writes ────
// Skip entirely in dry-run so we don't pollute the target with .warpos-backup/
console.log(`\n${HEADER}  BACKUP${RESET}`);
let backupPath = null;
if (DRY_RUN) {
  log(
    "info",
    "[dry-run] Would back up pre-install files to .warpos-backup/<ts>/",
  );
} else {
  backupPath = backupExisting();
  if (!backupPath)
    log("info", "No pre-install files to back up (clean target).");
}

// ── 3. Create directory structure ───────────────────────
// Skip in dry-run — directories will be listed in the plan instead
if (DRY_RUN) {
  console.log(`\n${HEADER}  [dry-run] CREATING STRUCTURE — skipped${RESET}`);
} else console.log(`\n${HEADER}  CREATING STRUCTURE${RESET}`);

const dirs = [
  ".claude",
  ".claude/project/events",
  ".claude/project/memory",
  ".claude/project/maps",
  ".claude/project/reference",
  ".claude/runtime",
  ".claude/runtime/handoffs",
  ".claude/runtime/logs",
  ".claude/agents",
  ".claude/commands",
  ".claude/content",
  ".claude/dreams",
  "scripts/hooks/lib",
];

if (!DRY_RUN) {
  for (const dir of dirs) {
    const abs = path.join(TARGET, dir);
    if (!fs.existsSync(abs)) {
      fs.mkdirSync(abs, { recursive: true });
      log("info", `Created: ${dir}/`);
      installed++;
    }
  }
}

// ── 4. Copy framework files via ship-manifest ──────────
// Previously: hand-coded copyDir calls per asset category. Missing a category
// (like _requirements/ or patterns/) meant silent install gaps. Now: the
// installer iterates .claude/framework-manifest.json (built by
// scripts/generate-framework-manifest.js). Adding new assets = regenerate
// manifest; no installer code change.
console.log(`\n${HEADER}  INSTALLING FRAMEWORK${RESET}`);

const manifestPath = path.join(WARPOS, ".claude", "framework-manifest.json");
let shipManifest = null;
try {
  shipManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (e) {
  log(
    "fail",
    `Could not read ship-manifest at ${manifestPath} — cannot install.`,
  );
  log(
    "info",
    "Run `node scripts/generate-framework-manifest.js` in the WarpOS repo first.",
  );
  process.exit(1);
}
log(
  "info",
  `Using ship-manifest v${shipManifest.version} (${shipManifest.total} assets + ${shipManifest.generated_files.length} generated)`,
);

// ── Ghost-file detection: compare prior install against current manifest ──
// If the target has a framework-installed.json from a previous install,
// files it declared that are NOT in the current manifest are "ghosts" —
// likely renamed or removed upstream. Print them; user can clean manually
// or re-run with --clean-ghosts.
const installedSnapshotPath = path.join(
  TARGET,
  ".claude",
  "framework-installed.json",
);
const currentAssetPaths = new Set();
for (const entries of Object.values(shipManifest.assets)) {
  for (const e of entries) currentAssetPaths.add(e.dest);
}
let ghostList = [];
if (fs.existsSync(installedSnapshotPath)) {
  try {
    const prior = JSON.parse(fs.readFileSync(installedSnapshotPath, "utf8"));
    const priorPaths = prior.installed_files || [];
    ghostList = priorPaths.filter(
      (p) => !currentAssetPaths.has(p) && fs.existsSync(path.join(TARGET, p)),
    );
    if (ghostList.length > 0) {
      log(
        "warn",
        `Found ${ghostList.length} ghost files from prior install (renamed/removed upstream):`,
      );
      for (const g of ghostList.slice(0, 10)) console.log(`         - ${g}`);
      if (ghostList.length > 10)
        console.log(`         ... and ${ghostList.length - 10} more`);
      if (flags.has("--clean-ghosts")) {
        let cleaned = 0;
        for (const g of ghostList) {
          try {
            fs.unlinkSync(path.join(TARGET, g));
            cleaned++;
          } catch {
            /* skip */
          }
        }
        log("ok", `Cleaned ${cleaned} ghost files (--clean-ghosts)`);
      } else {
        log(
          "info",
          "Run with --clean-ghosts to delete them, or remove manually.",
        );
      }
    } else {
      log("ok", "No ghost files from prior install");
    }
  } catch {
    /* skip gracefully — snapshot corrupt or older format */
  }
}

// ── Dry-run mode: report the plan, don't write ─────────
if (DRY_RUN) {
  console.log(`\n${HEADER}  DRY-RUN PLAN${RESET}`);
  console.log(
    `  Would install ${shipManifest.total} assets across these kinds:`,
  );
  for (const [kind, entries] of Object.entries(shipManifest.counts).sort(
    (a, b) => b[1] - a[1],
  )) {
    let existing = 0;
    const kindEntries = shipManifest.assets[kind] || [];
    for (const e of kindEntries) {
      if (fs.existsSync(path.join(TARGET, e.dest))) existing++;
    }
    console.log(
      `    ${kind.padEnd(18, " ")} ${entries} total; ${existing} already exist (would skip)`,
    );
  }
  console.log(
    `\n  Would generate ${shipManifest.generated_files.length} files:`,
  );
  for (const g of shipManifest.generated_files) {
    const exists = fs.existsSync(path.join(TARGET, g.dest));
    console.log(
      `    ${g.dest.padEnd(44, " ")} via ${g.builder}${exists ? " [exists]" : ""}`,
    );
  }
  if (ghostList.length > 0) {
    console.log(
      `\n  Would detect ${ghostList.length} ghost files. Add --clean-ghosts to remove.`,
    );
  }
  console.log(
    `\n  No files were written. Re-run without --dry-run to install.\n`,
  );
  process.exit(0);
}

// Framework docs (CLAUDE.md, AGENTS.md) are handled separately below because
// they need append-if-exists merge semantics, not copy-if-missing.
const SKIP_KINDS = new Set(["framework_doc"]);

// Copy each non-doc asset. Skip if destination already exists (user's edits
// stay, installer leaves a warning trail).
const installedByKind = {};
let installedThisRun = 0;
for (const [kind, entries] of Object.entries(shipManifest.assets)) {
  if (SKIP_KINDS.has(kind)) continue;
  let n = 0;
  for (const entry of entries) {
    const src = path.join(WARPOS, entry.src);
    const dest = path.join(TARGET, entry.dest);
    if (!fs.existsSync(src)) continue; // manifest out of date, skip gracefully
    if (fs.existsSync(dest)) {
      log("warn", `Skipped (exists): ${entry.dest}`);
      warnings++;
      continue;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    n++;
  }
  if (n > 0) {
    installedByKind[kind] = n;
    installedThisRun += n;
  }
}
for (const [kind, n] of Object.entries(installedByKind).sort(
  (a, b) => b[1] - a[1],
)) {
  log("ok", `${kind}: ${n} files installed`);
}
installed += installedThisRun;

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

// ── 6. Create manifest.json ─────────────────────────────
const manifestFile = path.join(TARGET, ".claude/manifest.json");
if (!fs.existsSync(manifestFile)) {
  const projectName = interview.projectName || path.basename(TARGET);
  const manifest = {
    $schema: "warpos/manifest/v1",
    project: {
      name: projectName,
      slug: projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: interview.pitch || "",
      techStack: [stack],
      framework: framework,
    },
    git: {
      mainBranch: interview.mainBranch,
    },
    warpos: {
      version: "0.1.0",
      installed: true,
      source: interview.warposSource,
      features: ["agents", "hooks", "skills", "memory", "maps", "events"],
    },
    agents: {
      team: {
        name: "alex",
        identity: "Alex",
        members: {
          alpha: { symbol: "α", role: "orchestrator" },
          beta: { symbol: "β", role: "judgment" },
          gamma: { symbol: "γ", role: "adhoc builder" },
          delta: { symbol: "δ", role: "oneshot builder" },
        },
      },
      modes: ["adhoc", "oneshot", "solo"],
      build: [
        "builder",
        "evaluator",
        "compliance",
        "auditor",
        "qa",
        "redteam",
        "fixer",
      ],
    },
    source_dirs: stack === "node" ? ["src/"] : [],
    build: { features: [], phases: [] },
    // Cross-provider agent diversity — review-layer on GPT, security on Gemini,
    // orchestration/code on Claude. See scripts/hooks/lib/providers.js.
    providers: {
      claude: {
        cli: "claude",
        default_model: "sonnet",
        invocation: "native",
      },
      openai: {
        cli: "codex",
        default_model: "gpt-5.4",
        fallback: "claude",
        // `codex exec --full-auto -m <model> -` (dash reads prompt from stdin; --full-auto = non-TTY approval)
        syntax: "codex exec --full-auto -m {model} -",
      },
      gemini: {
        cli: "gemini",
        default_model: "gemini-3.1-pro-preview",
        fallback: "claude",
        // `gemini -m <model> -p <instruction> -o text` (context via stdin)
        syntax: "gemini -m {model} -p",
      },
    },
    agentProviders: {
      alpha: "claude",
      beta: "claude",
      gamma: "claude",
      delta: "claude",
      builder: "claude",
      fixer: "claude",
      evaluator: "openai",
      compliance: "openai",
      auditor: "openai",
      qa: "openai",
      redteam: "gemini",
    },
    buildCommands: {},
    fileOwnership: { foundation: [] },
  };

  // Auto-detect build commands
  if (hasPackageJson) {
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(TARGET, "package.json"), "utf8"),
      );
      const scripts = pkg.scripts || {};
      if (scripts.build) manifest.buildCommands.build = "npm run build";
      if (scripts.test) manifest.buildCommands.test = "npm run test";
      if (scripts.lint) manifest.buildCommands.lint = "npm run lint";
    } catch {
      /* skip */
    }
  }

  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
  log("ok", `Created manifest.json for "${projectName}"`);
  installed++;
}

// ── 7. Create store.json (required for build modes) ─────
const storeFile = path.join(TARGET, ".claude/agents/store.json");
if (!fs.existsSync(storeFile)) {
  const store = {
    features: {},
    tasks: [],
    bugDataset: [],
    conflictDataset: [],
    cycle: 0,
    circuitBreaker: "closed",
    consecutiveFailures: 0,
    totalFailures: 0,
    lastCooldownMs: 0,
    evolution: [],
    heartbeat: {
      cycle: 0,
      phase: 0,
      feature: "",
      agent: "",
      status: "idle",
      cycleStep: null,
      workstream: null,
      timestamp: new Date().toISOString(),
    },
    compliance: {
      command: "codex",
      fallback: "claude",
      model: "gpt-5.4",
      syntax: "codex exec --model gpt-5.4",
      note: "Deprecated — use manifest.providers + manifest.agentProviders instead. Kept for backwards compat.",
    },
    snapshots: { features: {}, interfaces: {}, datasets: {} },
    knownStubs: [],
    points: { configs: {} },
    runLog: { runId: null, startedAt: null, entries: [], finalStatus: null },
    sharedFiles: {},
  };
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2) + "\n");
  log("ok", "Created store.json (build system state)");
  installed++;
}

// ── 8. Create memory stores ─────────────────────────────
// events + learnings + traces start empty. systems gets seeded with the
// 16 canonical WarpOS system tiers so `/check:system` has a baseline to
// diff against from day one. The scanner rewrites this file when it runs.
const memoryFiles = [
  ".claude/project/events/events.jsonl",
  ".claude/project/memory/learnings.jsonl",
  ".claude/project/memory/traces.jsonl",
];

for (const file of memoryFiles) {
  const abs = path.join(TARGET, file);
  if (!fs.existsSync(abs)) {
    fs.writeFileSync(abs, "");
    log("info", `Created empty: ${file}`);
    installed++;
  }
}

// Seed systems.jsonl with canonical 16-tier WarpOS system inventory
const systemsFile = path.join(TARGET, ".claude/project/memory/systems.jsonl");
if (!fs.existsSync(systemsFile)) {
  const now = new Date().toISOString();
  const seed = [
    {
      id: "identity",
      name: "Alex identity",
      category: "identity",
      files: ["CLAUDE.md", "AGENTS.md"],
      status: "active",
      created: now,
    },
    {
      id: "agents",
      name: "Agent team + build chains",
      category: "agents",
      dir: ".claude/agents",
      status: "active",
      created: now,
    },
    {
      id: "skills",
      name: "Skills",
      category: "capability",
      dir: ".claude/commands",
      status: "active",
      created: now,
    },
    {
      id: "hooks",
      name: "Hooks",
      category: "automation",
      dir: "scripts/hooks",
      status: "active",
      created: now,
    },
    {
      id: "memory",
      name: "Memory stores",
      category: "memory",
      keys: [
        "eventsFile",
        "learningsFile",
        "tracesFile",
        "systemsFile",
        "betaEvents",
      ],
      status: "active",
      created: now,
    },
    {
      id: "maps",
      name: "Relationship maps",
      category: "infrastructure",
      key: "maps",
      status: "active",
      created: now,
    },
    {
      id: "paths-registry",
      name: "Paths registry",
      category: "infrastructure",
      path: ".claude/paths.json",
      status: "active",
      created: now,
    },
    {
      id: "manifest",
      name: "Project manifest",
      category: "infrastructure",
      key: "manifest",
      status: "active",
      created: now,
    },
    {
      id: "settings",
      name: "Hook settings",
      category: "infrastructure",
      key: "settings",
      status: "active",
      created: now,
    },
    {
      id: "store",
      name: "Build store",
      category: "orchestration",
      key: "store",
      status: "active",
      created: now,
    },
    {
      id: "spec-graph",
      name: "Spec dependency graph",
      category: "infrastructure",
      key: "specGraph",
      status: "active",
      created: now,
    },
    {
      id: "reference-docs",
      name: "Reference documentation",
      category: "knowledge",
      key: "reference",
      status: "active",
      created: now,
    },
    {
      id: "patterns",
      name: "Engineering patterns library",
      category: "knowledge",
      key: "patterns",
      status: "active",
      created: now,
    },
    {
      id: "requirements-templates",
      name: "Requirements spec templates",
      category: "product",
      key: "requirements",
      status: "active",
      created: now,
    },
    {
      id: "installer",
      name: "Installer",
      category: "product",
      files: ["scripts/warp-setup.js", "install.ps1", "version.json"],
      status: "active",
      created: now,
    },
    {
      id: "linters",
      name: "Lint suite",
      category: "quality",
      files: ["scripts/path-lint.js"],
      status: "active",
      created: now,
    },
  ];
  const content = seed.map((e) => JSON.stringify(e)).join("\n") + "\n";
  fs.writeFileSync(systemsFile, content);
  log("ok", `Seeded systems.jsonl with 16 canonical tiers`);
  installed++;
}

// ── 8.5. Append runtime exclusions to .gitignore ────────
// Every client must keep WarpOS runtime artifacts out of their public repo.
// We write an idempotent block between markers; re-running the installer updates it in place.
const gitignorePath = path.join(TARGET, ".gitignore");
const GITIGNORE_START = "# >>> WarpOS runtime (managed, do not edit) >>>";
const GITIGNORE_END = "# <<< WarpOS runtime <<<";
const runtimeBlock = [
  GITIGNORE_START,
  ".claude/runtime/",
  ".claude/content/",
  ".claude/project/events/",
  ".claude/project/memory/",
  ".claude/project/builds/",
  ".claude/agents/*/.workspace/",
  ".claude/agents/**/events.jsonl",
  ".claude/.session-id",
  ".claude/.session-prompts.log",
  ".claude/.session-tracking.jsonl",
  ".claude/.session-checkpoint.json",
  ".claude/.session-start-commit",
  ".claude/.store-lock",
  GITIGNORE_END,
].join("\n");

let gitignoreContent = "";
try {
  gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
} catch {
  /* file doesn't exist — we'll create it */
}

if (gitignoreContent.includes(GITIGNORE_START)) {
  // Replace existing managed block
  const before = gitignoreContent.split(GITIGNORE_START)[0];
  const after =
    gitignoreContent.split(GITIGNORE_END)[1] !== undefined
      ? gitignoreContent.split(GITIGNORE_END)[1]
      : "";
  const updated = before + runtimeBlock + after;
  if (updated !== gitignoreContent) {
    fs.writeFileSync(gitignorePath, updated);
    log("ok", "Updated .gitignore runtime block");
  } else {
    log("ok", ".gitignore runtime block up to date");
  }
} else {
  // Append new block
  const sep =
    gitignoreContent && !gitignoreContent.endsWith("\n") ? "\n\n" : "\n";
  fs.writeFileSync(gitignorePath, gitignoreContent + sep + runtimeBlock + "\n");
  log("ok", "Appended runtime block to .gitignore");
  installed++;
}

// ── 8. Merge settings.json ──────────────────────────────
console.log(`\n${HEADER}  CONFIGURING HOOKS${RESET}`);

const settingsFile = path.join(TARGET, ".claude/settings.json");
let settings = {};
if (fs.existsSync(settingsFile)) {
  try {
    settings = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
  } catch {
    settings = {};
  }
}

// Add env vars if not present
if (!settings.env) settings.env = {};
if (!settings.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS) {
  settings.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = "1";
}

// Add permissions if not present (additive)
if (!settings.permissions) settings.permissions = {};
if (!settings.permissions.allow) settings.permissions.allow = [];
const requiredPerms = [
  "Bash(npm run *)",
  "Bash(node *)",
  "Bash(git *)",
  "Bash(ls *)",
  "Bash(pwd)",
  "Bash(which *)",
  "Bash(cat *)",
  "Bash(head *)",
  "Read",
  "Edit",
  "Write",
  "Glob",
  "Grep",
  "Agent",
];
for (const perm of requiredPerms) {
  if (!settings.permissions.allow.includes(perm)) {
    settings.permissions.allow.push(perm);
  }
}

// Add hook registrations if not present
if (!settings.hooks) settings.hooks = {};

// Hook-entry helper: Claude Code schema requires every hook to have type:"command".
// Also: event keys must be single event names (Stop, SessionEnd, StopFailure as
// three separate keys — NOT "Stop|SessionEnd|StopFailure" as one key).
const cmd = (script) => ({
  type: "command",
  command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/${script}"`,
});

const sessionStopEntry = [
  {
    matcher: "",
    hooks: [cmd("session-stop.js")],
  },
];

const hookConfig = {
  SessionStart: [
    {
      matcher: "",
      hooks: [cmd("session-start.js")],
    },
  ],
  UserPromptSubmit: [
    {
      matcher: "",
      hooks: [cmd("smart-context.js"), cmd("prompt-logger.js")],
    },
  ],
  PreToolUse: [
    {
      matcher: "Bash",
      hooks: [
        cmd("merge-guard.js"),
        cmd("memory-guard.js"),
        cmd("framework-manifest-guard.js"),
      ],
    },
    {
      matcher: "Edit|Write",
      hooks: [
        cmd("secret-guard.js"),
        cmd("foundation-guard.js"),
        cmd("ownership-guard.js"),
        cmd("memory-guard.js"),
        cmd("store-validator.js"),
        cmd("path-guard.js"),
      ],
    },
    {
      matcher: "Agent",
      hooks: [cmd("team-guard.js")],
    },
  ],
  PostToolUse: [
    {
      matcher: "",
      hooks: [cmd("session-tracker.js")],
    },
    {
      matcher: "Edit|Write",
      hooks: [
        // All quality hooks registered unconditionally. Each hook self-skips
        // (exits 0) when its underlying tool (prettier / tsc / eslint) is
        // absent — see the hook source. This keeps install simple and lets
        // users add tooling later without re-registering.
        cmd("format.js"),
        cmd("typecheck.js"),
        cmd("lint.js"),
        cmd("edit-watcher.js"),
        cmd("systems-sync.js"),
        cmd("save-session-lint.js"),
        cmd("learning-validator.js"),
        cmd("ui-lint.js"),
        cmd("path-guard.js"),
      ],
    },
  ],
  PostCompact: [
    {
      matcher: "",
      hooks: [cmd("compact-saver.js")],
    },
  ],
  // Session lifecycle: session-stop.js registered on all three end-of-session events.
  // Claude Code schema requires separate keys per event, not a pipe-joined key.
  Stop: sessionStopEntry,
  SessionEnd: sessionStopEntry,
  StopFailure: sessionStopEntry,
};

// Merge WarpOS hooks with any user-existing hooks, per event.
// Each event's value is an array of { matcher, hooks: [...] } blocks.
// We want: (a) preserve every user block, (b) add our blocks, (c) dedupe our
// own entries so re-running the installer is idempotent.
function warposScriptPath(entry) {
  // Stable identity for a WarpOS hook entry — the command string.
  return typeof entry === "object" && entry?.command ? entry.command : null;
}

function mergeEventHooks(existing, incoming) {
  // existing: array of blocks already in user's settings.hooks[event]
  // incoming: array of blocks WarpOS wants to register
  const result = Array.isArray(existing) ? [...existing] : [];

  for (const block of incoming) {
    // Does the user already have a block with the same matcher?
    const match = result.find(
      (b) => (b.matcher || "") === (block.matcher || ""),
    );
    if (match) {
      // Merge our hook entries INTO the existing matcher's hooks list, deduping
      // by command string. User's other hooks for this matcher stay intact.
      match.hooks = match.hooks || [];
      const existingCmds = new Set(match.hooks.map(warposScriptPath));
      for (const entry of block.hooks) {
        if (!existingCmds.has(warposScriptPath(entry))) {
          match.hooks.push(entry);
        }
      }
    } else {
      // No matching block — append our full block alongside user's.
      result.push(block);
    }
  }
  return result;
}

for (const [event, incomingBlocks] of Object.entries(hookConfig)) {
  const before = JSON.stringify(settings.hooks[event] || []);
  settings.hooks[event] = mergeEventHooks(
    settings.hooks[event],
    incomingBlocks,
  );
  const after = JSON.stringify(settings.hooks[event]);
  if (before === after) {
    log("ok", `${event}: WarpOS hooks already registered (no-op, idempotent)`);
  } else if (before === "[]") {
    log("ok", `Registered WarpOS hooks for ${event}`);
    installed++;
  } else {
    log(
      "ok",
      `Merged WarpOS hooks into existing ${event} (user hooks preserved)`,
    );
    installed++;
  }
}

// Report which tools are missing (hooks self-skip silently — this is just info)
const missing = [];
if (!hookTools.prettier) missing.push("prettier");
if (!hookTools.tsc) missing.push("tsc (TypeScript)");
if (!hookTools.eslint) missing.push("eslint");
if (!fs.existsSync(path.join(TARGET, "_requirements/01-design-system")))
  missing.push("design-system docs (for ui-lint)");
if (missing.length > 0) {
  log(
    "info",
    `All hooks wired. Tool(s) missing: ${missing.join(", ")} — related hooks self-skip until installed; no action needed.`,
  );
}

fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + "\n");

// SP-20260523-002: If the target has the three-layer source-of-truth
// (`_warpos/settings/defaults.json`), regenerate the effective
// `.claude/settings.json` from the layered sources via compile.js. This
// is the new model — `_warpos/settings/defaults.json` (framework defaults)
// + `.claude/settings.local.json` (operator overrides) → compiled
// `.claude/settings.json`. Older installs without defaults.json keep the
// inlined-write above; the defaults.json check makes this backward
// compatible. Fail-open: never block install on a compile error.
const settingsDefaultsFile = path.join(TARGET, "_warpos/settings/defaults.json");
if (fs.existsSync(settingsDefaultsFile)) {
  const compileScript = path.join(WARPOS, "scripts/warpos/settings/compile.js");
  if (fs.existsSync(compileScript)) {
    const settingsLocalFile = path.join(TARGET, ".claude/settings.local.json");
    const compileArgs = [
      compileScript,
      "--defaults", settingsDefaultsFile,
      "--out", settingsFile,
    ];
    if (fs.existsSync(settingsLocalFile)) {
      compileArgs.push("--local", settingsLocalFile);
    }
    try {
      const { spawnSync } = require("child_process");
      const cr = spawnSync(process.execPath, compileArgs, { encoding: "utf8" });
      if (cr.status === 0) {
        log("ok", `Compiled .claude/settings.json from _warpos/settings/defaults.json + settings.local.json`);
      } else {
        log("warn", `compile.js exited ${cr.status} — kept inlined settings.json. stderr: ${(cr.stderr || "").slice(0, 200)}`);
      }
    } catch (err) {
      log("warn", `compile.js spawn failed: ${err.message} — kept inlined settings.json`);
    }
  }
}

// ── 9. Copy CLAUDE.md if not present ────────────────────
console.log(`\n${HEADER}  FRAMEWORK DOCS${RESET}`);

const claudeMdTarget = path.join(TARGET, "CLAUDE.md");
const claudeMdSource = path.join(WARPOS, "CLAUDE.md");
const ALEX_MARKER = "You are **Alex α**";
if (!fs.existsSync(claudeMdTarget) && fs.existsSync(claudeMdSource)) {
  // No CLAUDE.md → just copy the Alex one.
  fs.copyFileSync(claudeMdSource, claudeMdTarget);
  log("ok", "Created CLAUDE.md with Alex identity");
  installed++;
} else if (fs.existsSync(claudeMdTarget) && fs.existsSync(claudeMdSource)) {
  // User has their own CLAUDE.md. Two cases:
  const userContent = fs.readFileSync(claudeMdTarget, "utf8");
  if (userContent.includes(ALEX_MARKER)) {
    // Alex already merged (or user pasted it themselves) — no-op.
    log("ok", "CLAUDE.md already has Alex identity — no merge needed");
  } else {
    // Merge: append WarpOS's Alex CLAUDE.md below user's content, with a
    // visible separator. Backup already taken at start of install.
    const alexContent = fs.readFileSync(claudeMdSource, "utf8");
    const separator = userContent.endsWith("\n") ? "\n---\n\n" : "\n\n---\n\n";
    fs.writeFileSync(claudeMdTarget, userContent + separator + alexContent);
    log(
      "ok",
      "Merged Alex framework into your existing CLAUDE.md (appended below your content)",
    );
    log(
      "info",
      "Revert: copy .warpos-backup/<ts>/CLAUDE.md back over CLAUDE.md",
    );
    installed++;
  }
}

const agentsMdTarget = path.join(TARGET, "AGENTS.md");
const agentsMdSource = path.join(WARPOS, "AGENTS.md");
const AGENTS_MARKER = "Alex identity card";
if (!fs.existsSync(agentsMdTarget) && fs.existsSync(agentsMdSource)) {
  fs.copyFileSync(agentsMdSource, agentsMdTarget);
  log("ok", "Created AGENTS.md with WarpOS agent system");
  installed++;
} else if (fs.existsSync(agentsMdTarget) && fs.existsSync(agentsMdSource)) {
  const userAgents = fs.readFileSync(agentsMdTarget, "utf8");
  if (userAgents.includes(AGENTS_MARKER)) {
    log("ok", "AGENTS.md already has WarpOS agent system — no merge needed");
  } else {
    const warpAgents = fs.readFileSync(agentsMdSource, "utf8");
    const sep = userAgents.endsWith("\n") ? "\n---\n\n" : "\n\n---\n\n";
    fs.writeFileSync(agentsMdTarget, userAgents + sep + warpAgents);
    log(
      "ok",
      "Merged WarpOS agent system into your existing AGENTS.md (appended below your content)",
    );
    installed++;
  }
}

// ── Write framework-installed.json snapshot ─────────────
// Phase 1D — schema v2 captures per-asset hash + mergeStrategy + owner so
// /warp:update can do a real three-way merge later. Per-asset record:
//   src, dest, installedHash (what we shipped), currentHashAtInstall (what
//   the target had if we skipped due to existing), owner, mergeStrategy.
// Adds: installedVersion, installedCommit (from WarpOS source repo HEAD when
//       resolvable), installedAt, source.
//   generated[]: every per-project file the installer creates from a builder.
try {
  const cryptoMod = require("crypto");
  function sha256OfFile(absPath) {
    if (!absPath || !fs.existsSync(absPath)) return null;
    return cryptoMod
      .createHash("sha256")
      .update(fs.readFileSync(absPath))
      .digest("hex")
      .slice(0, 12);
  }

  // Resolve installedCommit from WarpOS repo HEAD if we can. Fail open.
  let installedCommit = null;
  try {
    installedCommit = execSync("git rev-parse HEAD", {
      cwd: WARPOS,
      stdio: ["pipe", "pipe", "pipe"],
    })
      .toString()
      .trim();
  } catch {
    /* not a git repo or no HEAD — fine */
  }

  const installedFiles = [];
  const perAsset = [];
  for (const [kind, entries] of Object.entries(shipManifest.assets)) {
    for (const e of entries) {
      installedFiles.push(e.dest);
      const srcAbs = path.join(WARPOS, e.src);
      const destAbs = path.join(TARGET, e.dest);
      perAsset.push({
        id: e.id || null,
        kind,
        src: e.src,
        dest: e.dest,
        installedHash: e.sha256 || sha256OfFile(srcAbs),
        currentHashAtInstall: sha256OfFile(destAbs),
        owner: e.owner || "framework",
        mergeStrategy: e.mergeStrategy || "replace_if_unmodified",
        introducedIn: e.introducedIn || null,
      });
    }
  }

  const generated = [];
  for (const g of shipManifest.generated_files || []) {
    const destAbs = path.join(TARGET, g.dest);
    generated.push({
      dest: g.dest,
      builder: g.builder,
      idempotent: !!g.idempotent,
      hashAtInstall: sha256OfFile(destAbs),
    });
  }

  const snapshot = {
    $schema: "warpos/framework-installed/v2",
    manifest_version: shipManifest.version,
    manifest_schema: shipManifest.$schema || "warpos/framework-manifest/v1",
    installedVersion: shipManifest.version,
    installedCommit,
    installedAt: new Date().toISOString(),
    source: interview.warposSource || "https://github.com/cygaco/WarpOS.git",
    counts: shipManifest.counts,
    installed_files: installedFiles.sort(),
    assets: perAsset.sort((a, b) => a.dest.localeCompare(b.dest)),
    generated: generated.sort((a, b) => a.dest.localeCompare(b.dest)),
  };
  fs.writeFileSync(
    installedSnapshotPath,
    JSON.stringify(snapshot, null, 2) + "\n",
  );
  log(
    "ok",
    `Wrote .claude/framework-installed.json (schema v2: ${perAsset.length} assets + ${generated.length} generated)`,
  );
} catch (e) {
  log("warn", `Could not write framework-installed.json: ${e.message}`);
}

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

// ── Summary ─────────────────────────────────────────────
// ── Provider CLI check (informational) ──────────────────
const codexPresent = cmdExists("codex");
const geminiPresent = cmdExists("gemini");

console.log(`\n${"─".repeat(54)}`);
console.log(`${HEADER}  SETUP COMPLETE${RESET}\n`);
console.log(`  ${OK} ${installed} files installed`);
if (warnings > 0)
  console.log(`  ${WARN} ${warnings} warnings (existing files kept)`);

console.log(`\n${HEADER}  PROVIDER CLIs${RESET}`);
console.log(
  `  WarpOS routes review/security agents through other AI providers`,
);
console.log(
  `  for model diversity. Same-model review is blind to shared failure`,
);
console.log(`  modes — so evaluator/compliance/qa/auditor run on OpenAI, and`);
console.log(
  `  redteam runs on Gemini. Without these CLIs, agents fall back to`,
);
console.log(`  Claude (still works, just loses the diversity benefit).\n`);

if (codexPresent) {
  console.log(`  ${OK} Codex CLI detected (review agents will use OpenAI)`);
} else {
  console.log(
    `  ${WARN} Codex CLI missing — review agents will fall back to Claude`,
  );
  console.log(`       Install:  npm i -g @openai/codex`);
  console.log(`       Auth:     codex login   (or set OPENAI_API_KEY)`);
}
if (geminiPresent) {
  console.log(`  ${OK} Gemini CLI detected (redteam will use Gemini)`);
} else {
  console.log(
    `  ${WARN} Gemini CLI missing — redteam will fall back to Claude`,
  );
  console.log(`       Install:  npm i -g @google/gemini-cli`);
  console.log(`       Auth:     gemini auth login   (or set GEMINI_API_KEY)`);
}

// SP-20260523-003: Post-install manifest-coverage hook.
// After all writes, regenerate _warpos/MANIFEST.json + validate against
// on-disk state. Surfaces any files we wrote that aren't covered by the
// manifest (which would silently break future updates). Fail-open by
// default; --strict-manifest converts findings to non-zero exit.
if (!SKIP_MANIFEST_CHECK) {
  console.log(`\n${HEADER}  MANIFEST COVERAGE${RESET}`);
  const warposZone = path.join(TARGET, "_warpos");
  if (!fs.existsSync(warposZone)) {
    log("info", "_warpos/ not present in target — skipping manifest coverage (legacy install layout)");
  } else {
    const buildScript = path.join(WARPOS, "scripts/warpos/manifest/build.js");
    const validateScript = path.join(WARPOS, "scripts/warpos/manifest/validate.js");
    let coverageExitCode = 0;
    let coverageSummary = null;
    try {
      const { spawnSync } = require("child_process");
      // (1) regenerate manifest in target.
      const buildRes = spawnSync(
        process.execPath,
        [buildScript, "--root", TARGET, "--source-prefix", "_warpos"],
        { encoding: "utf8" },
      );
      if (buildRes.status !== 0) {
        log("warn", `manifest build.js exited ${buildRes.status} — coverage check skipped. stderr: ${(buildRes.stderr || "").slice(0, 200)}`);
      } else {
        // (2) validate.
        const valRes = spawnSync(
          process.execPath,
          [validateScript, "--root", TARGET, "--json"],
          { encoding: "utf8" },
        );
        try {
          const parsed = JSON.parse(valRes.stdout);
          coverageSummary = parsed;
          const f = parsed.findings || {};
          const totals = {
            missing: (f.missing || []).length,
            drift: (f.drift || []).length,
            unmanifested: (f.unmanifested || []).length,
            user_modified: (f.user_modified || []).length,
            schema_violation: (f.schema_violation || []).length,
          };
          const total = Object.values(totals).reduce((a, b) => a + b, 0);
          const oc = parsed.ownerCounts || {};
          log("ok", `manifest: ${parsed.pathCount || "?"} paths; framework=${oc.framework || 0} generated=${oc.generated || 0} project=${oc.project || 0} runtime=${oc.runtime || 0}`);
          if (total === 0) {
            log("ok", "manifest coverage: CLEAN (no findings)");
          } else {
            log("warn", `manifest coverage: ${total} finding(s) — missing=${totals.missing} drift=${totals.drift} unmanifested=${totals.unmanifested} user_modified=${totals.user_modified} schema_violation=${totals.schema_violation}`);
            if (totals.unmanifested > 0) {
              log("warn", `  unmanifested (first 5): ${(f.unmanifested || []).slice(0, 5).join(", ")}`);
            }
            if (STRICT_MANIFEST) {
              coverageExitCode = 1;
              log("error", "--strict-manifest set — refusing install completion with findings");
            } else {
              log("info", "Run with --strict-manifest to refuse install on findings. Or re-run /warp:setup --skip-manifest-check to silence.");
            }
          }
        } catch (e) {
          log("warn", `manifest validate.js output not parseable JSON: ${e.message}`);
        }
      }
    } catch (err) {
      log("warn", `manifest coverage check failed (${err.message}) — install continues`);
    }
    if (coverageExitCode !== 0) {
      console.log(`\n${HEADER}  INSTALL REFUSED (strict manifest)${RESET}`);
      process.exit(coverageExitCode);
    }
  }
}

// Bright, attention-grabbing restart banner. Users MISS single-line notices.
const BOX_TOP =
  "\x1b[33m╔══════════════════════════════════════════════════════════════════╗\x1b[0m";
const BOX_MID = "\x1b[33m║\x1b[0m";
const BOX_BOT =
  "\x1b[33m╚══════════════════════════════════════════════════════════════════╝\x1b[0m";
console.log(`\n${BOX_TOP}`);
console.log(
  `${BOX_MID}  \x1b[1;33mNEXT: OPEN CLAUDE CODE IN THIS PROJECT\x1b[0m                            ${BOX_MID}`,
);
console.log(
  `${BOX_MID}                                                                  ${BOX_MID}`,
);
console.log(
  `${BOX_MID}  \x1b[1mAlready have it open?\x1b[0m  Close it entirely and reopen — Claude    ${BOX_MID}`,
);
console.log(
  `${BOX_MID}  Code only reads \x1b[1msettings.json\x1b[0m at launch, so hooks won't fire     ${BOX_MID}`,
);
console.log(
  `${BOX_MID}  until you restart.                                              ${BOX_MID}`,
);
console.log(
  `${BOX_MID}                                                                  ${BOX_MID}`,
);
console.log(
  `${BOX_MID}  \x1b[1mNot open yet?\x1b[0m  Just open it — you're good. No restart needed.   ${BOX_MID}`,
);
console.log(
  `${BOX_MID}                                                                  ${BOX_MID}`,
);
console.log(
  `${BOX_MID}  \x1b[2mEither way:\x1b[0m first prompt should be \x1b[1m/warp:health\x1b[0m              ${BOX_MID}`,
);
console.log(`${BOX_BOT}\n`);
console.log(`  First skill to run in Claude Code:`);
console.log(
  `    \x1b[1m/warp:setup\x1b[0m           confirms install state + guides you from here`,
);
console.log(``);
console.log(`  Other useful skills (after /warp:setup gives the green light):`);
console.log(`    \x1b[1m/warp:health\x1b[0m          verify every subsystem`);
console.log(
  `    \x1b[1m/maps:all\x1b[0m             generate relationship maps (powers smart-context enrichment)`,
);
console.log(`    \x1b[1m/check:system\x1b[0m         manifest vs disk`);
console.log(`    \x1b[1m/check:environment\x1b[0m    provider CLIs + auth`);
console.log(`    \x1b[1m/discover:systems\x1b[0m     6-angle system inventory`);
console.log(`    \x1b[1m/warp:tour\x1b[0m            guided walkthrough`);
console.log(
  `    \x1b[1m/warp:uninstall\x1b[0m       if something is wrong, revert cleanly\n`,
);
