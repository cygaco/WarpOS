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

const { execSync } = require("child_process");
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

if (!fs.existsSync(TARGET)) {
  console.error(`Target directory does not exist: ${TARGET}`);
  process.exit(1);
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

// ── 3. Create directory structure ───────────────────────
console.log(`\n${HEADER}  CREATING STRUCTURE${RESET}`);

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

for (const dir of dirs) {
  const abs = path.join(TARGET, dir);
  if (!fs.existsSync(abs)) {
    fs.mkdirSync(abs, { recursive: true });
    log("info", `Created: ${dir}/`);
    installed++;
  }
}

// ── 4. Copy framework files ─────────────────────────────
console.log(`\n${HEADER}  INSTALLING FRAMEWORK${RESET}`);

// Agents
const agentCount = copyDir(
  path.join(WARPOS, ".claude/agents"),
  path.join(TARGET, ".claude/agents"),
);
log("ok", `Agents: ${agentCount} files installed`);
installed += agentCount;

// Skills/Commands
const skillCount = copyDir(
  path.join(WARPOS, ".claude/commands"),
  path.join(TARGET, ".claude/commands"),
);
log("ok", `Skills: ${skillCount} files installed`);
installed += skillCount;

// Reference docs
const refCount = copyDir(
  path.join(WARPOS, ".claude/project/reference"),
  path.join(TARGET, ".claude/project/reference"),
);
log("ok", `Reference docs: ${refCount} files installed`);
installed += refCount;

// Hooks
const hookCount = copyDir(
  path.join(WARPOS, "scripts/hooks"),
  path.join(TARGET, "scripts/hooks"),
);
log("ok", `Hooks: ${hookCount} files installed`);
installed += hookCount;

// ── 5. Create paths.json ────────────────────────────────
// Principle: paths.json is CREATED at install time, never ASSUMED to exist pre-install.
// WarpOS does not ship a paths.json — the installer builds it here so every client
// project gets its own. To move a location, edit this object (and lib/paths.js fallback).
const pathsFile = path.join(TARGET, ".claude/paths.json");
if (!fs.existsSync(pathsFile)) {
  const paths = {
    version: 3,
    events: ".claude/project/events",
    memory: ".claude/project/memory",
    maps: ".claude/project/maps",
    reference: ".claude/project/reference",
    runtime: ".claude/runtime",
    logs: ".claude/runtime/logs",
    handoffs: ".claude/runtime/handoffs",
    handoffLatest: ".claude/runtime/handoff.md",
    plans: ".claude/runtime/plans",
    agents: ".claude/agents",
    agentSystem: ".claude/agents/00-alex/.system",
    betaSystem: ".claude/agents/00-alex/.system/beta",
    commands: ".claude/commands",
    content: ".claude/content",
    dreams: ".claude/dreams",
    favorites: ".claude/content/favorites",
    hooks: "scripts/hooks",
    hookLib: "scripts/hooks/lib",
    patterns: "patterns",
    requirements: "requirements",
    manifest: ".claude/manifest.json",
    settings: ".claude/settings.json",
    store: ".claude/agents/store.json",
    eventsFile: ".claude/project/events/events.jsonl",
    toolsFile: ".claude/project/events/tools.jsonl",
    requirementsFile: ".claude/project/events/requirements.jsonl",
    requirementsStagedFile: ".claude/project/events/requirements-staged.jsonl",
    learningsFile: ".claude/project/memory/learnings.jsonl",
    tracesFile: ".claude/project/memory/traces.jsonl",
    systemsFile: ".claude/project/memory/systems.jsonl",
    specGraph: ".claude/project/maps/SPEC_GRAPH.json",
    judgmentModel: ".claude/agents/00-alex/.system/beta/judgement-model.md",
    judgmentRecommendations:
      ".claude/agents/00-alex/.system/beta/judgement-model-recommendations.md",
    betaSourceData: ".claude/agents/00-alex/.system/beta/beta-source-data.md",
    betaEvents: ".claude/agents/00-alex/.system/beta/events.jsonl",
    lexicon: ".claude/agents/00-alex/.system/lexicon.md",
    pathsLib: "scripts/hooks/lib/paths.js",
    loggerLib: "scripts/hooks/lib/logger.js",
  };
  fs.writeFileSync(pathsFile, JSON.stringify(paths, null, 2) + "\n");
  log("ok", "Created paths.json");
  installed++;
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
  ".claude/agents/*/.workspace/",
  ".claude/agents/**/events.jsonl",
  ".claude/.session-id",
  ".claude/.session-prompts.log",
  ".claude/.session-tracking.jsonl",
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

const hookConfig = {
  SessionStart: [
    {
      matcher: "",
      hooks: [
        {
          command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/session-start.js"`,
        },
      ],
    },
  ],
  UserPromptSubmit: [
    {
      matcher: "",
      hooks: [
        {
          command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/smart-context.js"`,
        },
        {
          command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/prompt-logger.js"`,
        },
      ],
    },
  ],
  PreToolUse: [
    {
      matcher: "Bash",
      hooks: [
        { command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/merge-guard.js"` },
        { command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/memory-guard.js"` },
      ],
    },
    {
      matcher: "Edit|Write",
      hooks: [
        { command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/secret-guard.js"` },
        {
          command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/foundation-guard.js"`,
        },
        {
          command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/ownership-guard.js"`,
        },
        { command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/memory-guard.js"` },
        {
          command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/store-validator.js"`,
        },
        { command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/path-guard.js"` },
      ],
    },
    {
      matcher: "Agent",
      hooks: [
        { command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/team-guard.js"` },
      ],
    },
  ],
  PostToolUse: [
    {
      matcher: "",
      hooks: [
        {
          command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/session-tracker.js"`,
        },
      ],
    },
    {
      matcher: "Edit|Write",
      hooks: [
        // All quality hooks registered unconditionally. Each hook self-skips
        // (exits 0) when its underlying tool (prettier / tsc / eslint) is
        // absent — see the hook source. This keeps install simple and lets
        // users add tooling later without re-registering.
        { command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/format.js"` },
        { command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/typecheck.js"` },
        { command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/lint.js"` },
        { command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/edit-watcher.js"` },
        { command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/systems-sync.js"` },
        {
          command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/save-session-lint.js"`,
        },
        {
          command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/learning-validator.js"`,
        },
        { command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/ui-lint.js"` },
        { command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/path-guard.js"` },
      ],
    },
  ],
  PostCompact: [
    {
      matcher: "",
      hooks: [
        {
          command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/compact-saver.js"`,
        },
      ],
    },
  ],
  "Stop|SessionEnd|StopFailure": [
    {
      matcher: "",
      hooks: [
        { command: `node "$CLAUDE_PROJECT_DIR/scripts/hooks/session-stop.js"` },
      ],
    },
  ],
};

// Only add hooks that aren't already registered
for (const [event, matchers] of Object.entries(hookConfig)) {
  if (!settings.hooks[event]) {
    settings.hooks[event] = matchers;
    log("ok", `Registered hooks for ${event}`);
    installed++;
  } else {
    log("warn", `Hooks already registered for ${event} — kept existing`);
    warnings++;
  }
}

// Report which tools are missing (hooks self-skip silently — this is just info)
const missing = [];
if (!hookTools.prettier) missing.push("prettier");
if (!hookTools.tsc) missing.push("tsc (TypeScript)");
if (!hookTools.eslint) missing.push("eslint");
if (!fs.existsSync(path.join(TARGET, "requirements/01-design-system")))
  missing.push("design-system docs (for ui-lint)");
if (missing.length > 0) {
  log(
    "info",
    `All hooks wired. Tool(s) missing: ${missing.join(", ")} — related hooks self-skip until installed; no action needed.`,
  );
}

fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + "\n");

// ── 9. Copy CLAUDE.md if not present ────────────────────
console.log(`\n${HEADER}  FRAMEWORK DOCS${RESET}`);

const claudeMdTarget = path.join(TARGET, "CLAUDE.md");
const claudeMdSource = path.join(WARPOS, "CLAUDE.md");
if (!fs.existsSync(claudeMdTarget) && fs.existsSync(claudeMdSource)) {
  fs.copyFileSync(claudeMdSource, claudeMdTarget);
  log("ok", "Created CLAUDE.md");
  installed++;
} else if (fs.existsSync(claudeMdTarget)) {
  log("warn", "CLAUDE.md already exists — kept yours");
  warnings++;
}

const agentsMdTarget = path.join(TARGET, "AGENTS.md");
const agentsMdSource = path.join(WARPOS, "AGENTS.md");
if (!fs.existsSync(agentsMdTarget) && fs.existsSync(agentsMdSource)) {
  fs.copyFileSync(agentsMdSource, agentsMdTarget);
  log("ok", "Created AGENTS.md");
  installed++;
} else if (fs.existsSync(agentsMdTarget)) {
  log("warn", "AGENTS.md already exists — kept yours");
  warnings++;
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

console.log(`\n${HEADER}  NEXT STEPS${RESET}`);
console.log(`  1. Open Claude Code in your project`);
console.log(`  2. Type /warp:tour for a guided introduction`);
console.log(`  3. Type /warp:health to verify everything works`);
console.log(`  4. Type /check:environment to verify provider CLIs + auth`);
console.log(`  5. Type /maps:all to generate your project maps`);
console.log(`  6. Ask Alex to help you fill in your requirements templates\n`);
