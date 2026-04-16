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
const TARGET = path.resolve(process.argv[2] || ".");
const WARPOS = path.resolve(__dirname, "..");

if (!fs.existsSync(TARGET)) {
  console.error(`Target directory does not exist: ${TARGET}`);
  process.exit(1);
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
const pathsFile = path.join(TARGET, ".claude/paths.json");
if (!fs.existsSync(pathsFile)) {
  const paths = {
    version: 2,
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
    manifest: ".claude/manifest.json",
    settings: ".claude/settings.json",
    store: ".claude/agents/store.json",
  };
  fs.writeFileSync(pathsFile, JSON.stringify(paths, null, 2) + "\n");
  log("ok", "Created paths.json");
  installed++;
}

// ── 6. Create manifest.json ─────────────────────────────
const manifestFile = path.join(TARGET, ".claude/manifest.json");
if (!fs.existsSync(manifestFile)) {
  const projectName = path.basename(TARGET);
  const manifest = {
    $schema: "warpos/manifest/v1",
    project: {
      name: projectName,
      slug: projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: "",
      techStack: [stack],
      framework: framework,
    },
    warpos: {
      version: "0.1.0",
      installed: true,
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
    providers: {
      builder: "claude",
      evaluator: "claude",
      compliance: "codex",
      complianceFallback: "claude",
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
      model: "gpt-4o",
      syntax: 'codex exec "prompt"',
      note: "Optional — falls back to Claude if unavailable",
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

// ── 8. Create empty memory stores ───────────────────────
const memoryFiles = [
  ".claude/project/events/events.jsonl",
  ".claude/project/memory/learnings.jsonl",
  ".claude/project/memory/traces.jsonl",
  ".claude/project/memory/systems.jsonl",
];

for (const file of memoryFiles) {
  const abs = path.join(TARGET, file);
  if (!fs.existsSync(abs)) {
    fs.writeFileSync(abs, "");
    log("info", `Created empty: ${file}`);
    installed++;
  }
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
console.log(`\n${"─".repeat(54)}`);
console.log(`${HEADER}  SETUP COMPLETE${RESET}\n`);
console.log(`  ${OK} ${installed} files installed`);
if (warnings > 0)
  console.log(`  ${WARN} ${warnings} warnings (existing files kept)`);
console.log(`\n  Next steps:`);
console.log(`  1. Open Claude Code in your project`);
console.log(`  2. Type /warp:tour for a guided introduction`);
console.log(`  3. Type /warp:health to verify everything works`);
console.log(`  4. Type /maps:all to generate your project maps`);
console.log(`  5. Ask Alex to help you fill in your requirements templates`);
console.log(`     (e.g., "Help me write a product brief for my project")\n`);
