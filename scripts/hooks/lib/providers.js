/**
 * providers.js — Cross-provider CLI bridge for review-layer agents.
 *
 * Claude Code's `model:` frontmatter only accepts Claude models. To run review
 * agents on GPT / Gemini for model diversity (different model reviewing Claude's
 * output catches what same-model review misses), we shell out to the respective
 * CLIs instead of dispatching as a Claude sub-agent.
 *
 * Pattern borrowed from /research:deep:
 *   - Write prompt to temp file (avoids bash escaping hell)
 *   - Invoke CLI via execSync, capture stdout
 *   - Normalize output to match Claude sub-agent JSON shape
 *   - Fall back to Claude if CLI unavailable
 *
 * Usage:
 *   const { runProvider, getProviderForRole, providerAvailable } = require('./lib/providers');
 *   const result = runProvider('evaluator', promptText, { timeoutMs: 120000 });
 *
 * Exit codes:
 *   0 — success, result is parsed
 *   1 — CLI failed, result.fallback === true, caller should retry via Claude
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PROJECT, PATHS } = require("./paths");

// ── Config resolution ───────────────────────────────────────
function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(PATHS.manifest, "utf8"));
  } catch {
    return {};
  }
}

function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(PATHS.store, "utf8"));
  } catch {
    return {};
  }
}

/**
 * Provider defaults if manifest.providers is missing.
 * Keys match the CLI tool name.
 */
const DEFAULT_PROVIDERS = {
  claude: {
    cli: "claude",
    default_model: "sonnet",
    invocation: "native", // dispatched via Claude Code Agent tool, not this bridge
  },
  openai: {
    cli: "codex",
    default_model: "gpt-5.4",
    fallback: "claude",
    // Per https://developers.openai.com/codex/cli/reference :
    //   `codex exec` with `-` reads prompt from stdin.
    //   `--full-auto` enables workspace-write sandbox + on-request approvals (needed in non-TTY runs).
    //   `-m <model>` or `--model <model>` selects the model.
    //   `-o <file>` writes last-message response for reliable capture.
    syntax: `codex exec --full-auto -m {model} -`,
  },
  gemini: {
    cli: "gemini",
    default_model: "gemini-3.1-pro-preview",
    fallback: "claude",
    // Gemini CLI: pipe context on stdin, instruction via `-p`, plain-text output via `-o text`.
    // `gemini-3.1-pro-preview` has thinking mode + 1M input context — ideal for attack-chain reasoning.
    syntax: `gemini -m {model} -p`,
  },
};

/**
 * Default role → provider mapping. Can be overridden per-project by
 * `manifest.agentProviders`. This is the KEY decision: which agent goes to
 * which provider for model diversity.
 */
const DEFAULT_AGENT_PROVIDERS = {
  alpha: "claude",
  beta: "claude",
  gamma: "claude",
  delta: "claude",
  builder: "claude",
  fixer: "claude",
  // Review layer — GPT-5.4 for different lens on Claude's output
  evaluator: "openai",
  compliance: "openai",
  auditor: "openai",
  qa: "openai",
  // Security — Gemini for different adversarial training corpus
  redteam: "gemini",
};

function getProviderForRole(role) {
  const manifest = loadManifest();
  const agentMap = manifest.agentProviders || DEFAULT_AGENT_PROVIDERS;
  return agentMap[role] || "claude";
}

function getProviderConfig(providerName) {
  const manifest = loadManifest();
  const providers = manifest.providers || DEFAULT_PROVIDERS;
  return providers[providerName] || DEFAULT_PROVIDERS[providerName] || null;
}

// ── Availability ────────────────────────────────────────────
function cliAvailable(cmd) {
  try {
    execSync(`which ${cmd} 2>/dev/null || where ${cmd} 2>NUL`, {
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

function providerAvailable(providerName) {
  if (providerName === "claude") return true; // always available — it's the harness
  const cfg = getProviderConfig(providerName);
  if (!cfg) return false;
  return cliAvailable(cfg.cli);
}

// ── Temp file helpers ───────────────────────────────────────
function tempFilePath(role) {
  const runtimeDir = PATHS.runtime;
  const tmpDir = path.join(runtimeDir, ".provider-tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  const id = crypto.randomBytes(4).toString("hex");
  return path.join(tmpDir, `${role}-${Date.now()}-${id}.txt`);
}

// ── Invocation ──────────────────────────────────────────────
/**
 * Run a provider for a given role.
 *
 * @param {string} role - Agent role (evaluator, compliance, qa, redteam, etc.)
 * @param {string} prompt - Full prompt text (agent instructions + context)
 * @param {object} opts
 * @param {number} opts.timeoutMs - Default 120_000 (2 min)
 * @param {string} opts.model - Override default model for this provider
 * @returns {object} { ok: boolean, provider: string, model: string, output: string, fallback?: boolean, error?: string }
 */
function runProvider(role, prompt, opts = {}) {
  const timeoutMs = opts.timeoutMs || 120_000;
  const providerName = getProviderForRole(role);

  // Claude path — caller should dispatch via Agent tool, not this bridge
  if (providerName === "claude") {
    return {
      ok: false,
      provider: "claude",
      output: "",
      fallback: false,
      error:
        "Provider is Claude — dispatch via Claude Code Agent tool, not this bridge.",
    };
  }

  const cfg = getProviderConfig(providerName);
  if (!cfg) {
    return {
      ok: false,
      provider: providerName,
      output: "",
      fallback: true,
      error: `Unknown provider: ${providerName}`,
    };
  }

  if (!cliAvailable(cfg.cli)) {
    return {
      ok: false,
      provider: providerName,
      output: "",
      fallback: true,
      error: `CLI "${cfg.cli}" not found — install it or switch provider to ${cfg.fallback || "claude"}`,
    };
  }

  const model = opts.model || cfg.default_model;
  const promptFile = tempFilePath(role);
  fs.writeFileSync(promptFile, prompt, "utf8");

  try {
    let cmd;
    if (providerName === "openai") {
      // codex exec reads stdin when passed `-` as the prompt.
      // --full-auto = workspace-write sandbox + on-request approval (needed in non-TTY).
      // Output: streams progress to stderr, final message to stdout.
      cmd = `cat "${promptFile}" | ${cfg.cli} exec --full-auto -m ${model} -`;
    } else if (providerName === "gemini") {
      // gemini CLI: context on stdin, instruction via -p, text output.
      // 2>/dev/null suppresses auth warnings for scripted use.
      cmd = `cat "${promptFile}" | ${cfg.cli} -m ${model} -p "Process the instructions on stdin and produce the requested output." -o text 2>/dev/null`;
    } else {
      // Generic pattern from cfg.syntax (used when manifest overrides defaults)
      cmd = `cat "${promptFile}" | ${cfg.syntax.replace("{model}", model)}`;
    }

    const output = execSync(cmd, {
      cwd: PROJECT,
      timeout: timeoutMs,
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024, // 32MB for long review outputs
    })
      .toString()
      .trim();

    return {
      ok: true,
      provider: providerName,
      model,
      output,
      cmd: cmd.slice(0, 200),
    };
  } catch (err) {
    return {
      ok: false,
      provider: providerName,
      model,
      output: "",
      fallback: true,
      error: String(err.message || err).slice(0, 500),
    };
  } finally {
    // Cleanup temp file unless debugging
    if (!process.env.WARPOS_PROVIDER_DEBUG) {
      try {
        fs.unlinkSync(promptFile);
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Parse a provider's output as JSON, falling back to extracting a ```json block.
 * Review agents typically return structured JSON; this normalizes that.
 */
function parseProviderJson(output) {
  if (!output) return null;
  try {
    return JSON.parse(output);
  } catch {
    /* try code fence extraction */
  }
  const match = output.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try {
      return JSON.parse(match[1].trim());
    } catch {
      /* give up */
    }
  }
  return null;
}

module.exports = {
  runProvider,
  getProviderForRole,
  getProviderConfig,
  providerAvailable,
  parseProviderJson,
  DEFAULT_PROVIDERS,
  DEFAULT_AGENT_PROVIDERS,
};
