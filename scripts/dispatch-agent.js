#!/usr/bin/env node
/**
 * dispatch-agent.js — Cross-provider agent dispatch.
 *
 * Used by γ (adhoc orchestrator) and δ (oneshot orchestrator) to dispatch
 * review-layer and security agents that run on GPT or Gemini instead of Claude.
 *
 * Usage:
 *   node scripts/dispatch-agent.js <role> <prompt-file>
 *   node scripts/dispatch-agent.js <role> -              # read prompt from stdin
 *
 * Reads manifest.agentProviders[<role>] to determine provider:
 *   - "claude"  → errors (caller should dispatch natively via Claude Code Agent tool or `claude -p`)
 *   - "openai"  → shells out to `codex`
 *   - "gemini"  → shells out to `gemini`
 *
 * Output on stdout:
 *   JSON: { ok, provider, model, role, output, fallback?, error? }
 *
 * Exit codes:
 *   0 — provider call succeeded
 *   1 — provider unavailable or errored; caller should retry via Claude fallback
 *   2 — usage / config error
 *
 * Example (from gamma's bash dispatch):
 *   node scripts/dispatch-agent.js evaluator /tmp/eval-prompt.txt
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  runProvider,
  getProviderForRole,
  providerAvailable,
  parseProviderJson,
} = require("./hooks/lib/providers");
const { PATHS } = require("./hooks/lib/paths");
const {
  acquireSlotSync,
  releaseSlot,
} = require("./hooks/lib/concurrency-lock");
const { record: recordProviderTrace } = require("./agents/provider-trace");
const { validate: validateAgentOutput } = require("./agents/output-validator");

// ── Canonical root anchor (AC2 / ED-016 / class-#20 fix) ──
//
// AGENT_ROOT is resolved from THIS FILE'S location (__dirname), NOT from
// process.cwd() or CLAUDE_PROJECT_DIR. This is the key fix for the worktree
// telemetry cwd bug:
//
//   Root cause: PATHS is built from `path.resolve(CLAUDE_PROJECT_DIR || ".")`
//   in scripts/hooks/lib/paths.js. When a build-chain agent is dispatched with
//   cwd=<worktree> AND CLAUDE_PROJECT_DIR is unset, PROJECT bends to the
//   worktree, so PATHS.runtime points at worktree/.claude/runtime. The
//   completion record lands in the worktree; gauntlet-verify reads canonical's
//   path → false "no-record" (confirmed live: all 11 records landed in worktree).
//
//   Fix: this script lives at scripts/dispatch-agent.js. Its module location is
//   IMMUTABLE (cwd-independent). AGENT_ROOT = path.resolve(__dirname, "..") is
//   ALWAYS the root of the repo containing THIS file — canonical or consumer,
//   never a worktree regardless of cwd.
//
// canonicalFile() uses AGENT_ROOT as the primary anchor. It prefers the PATHS
// value only when PATHS has resolved to a path that is under AGENT_ROOT (i.e.
// CLAUDE_PROJECT_DIR was set correctly to the same root). When PATHS bends to
// a different root (worktree case), the __dirname-anchored fallback is used.
// The net invariant: telemetry NEVER lands at a cwd-relative path.

const AGENT_ROOT = path.resolve(__dirname, "..");
const AGENT_ROOT_NORM = path.normalize(AGENT_ROOT);

/**
 * Resolve a telemetry file path, anchored to AGENT_ROOT.
 *
 * @param {string|undefined} pathsValue  - value from PATHS registry (may be
 *   absolute but resolve to a worktree path when cwd-bent)
 * @param {string} relFallback           - relative path from AGENT_ROOT to use
 *   when pathsValue is absent or outside AGENT_ROOT
 * @returns {string} absolute path guaranteed to be under AGENT_ROOT
 */
function canonicalFile(pathsValue, relFallback) {
  if (pathsValue && path.isAbsolute(pathsValue)) {
    const norm = path.normalize(pathsValue);
    // Accept PATHS value only when it resolves within the same root as this
    // script (case-insensitive on Windows). This covers the correct case
    // (CLAUDE_PROJECT_DIR explicitly set to the canonical root) without
    // accepting a worktree-bent path.
    const rootPrefixMatch =
      process.platform === "win32"
        ? norm.toLowerCase().startsWith(AGENT_ROOT_NORM.toLowerCase() + path.sep) ||
          norm.toLowerCase() === AGENT_ROOT_NORM.toLowerCase()
        : norm.startsWith(AGENT_ROOT_NORM + path.sep) || norm === AGENT_ROOT_NORM;
    if (rootPrefixMatch) return pathsValue;
  }
  // Fall back to __dirname-anchored canonical path — cwd-independent.
  return path.join(AGENT_ROOT, relFallback);
}

// ── Telemetry helpers (Phase 0 workstream C) ──────────────
//
// Every dispatch gets a unique dispatch_id. Completion + silent-death markers
// are persisted to durable JSONL files under .claude/runtime/ so a post-mortem
// can answer "did the process actually run and produce nothing, or was it
// pre-empted before runProvider returned?". Fail-open everywhere — never let
// telemetry crash an otherwise-successful dispatch.

function makeDispatchId() {
  return (
    "d-" + Date.now().toString(36) + "-" + crypto.randomBytes(4).toString("hex")
  );
}

function cmdlineChecksum(role, provider, promptBytes) {
  return (
    "sha256:" +
    crypto
      .createHash("sha256")
      .update(`${role}|${provider}|${promptBytes}|${process.argv.join(" ")}`)
      .digest("hex")
      .slice(0, 32)
  );
}

// N-1 (PLAN §17.4): run-context fields stamped onto every completion record so the
// coverage gate (scripts/dispatch/coverage-gate.js) can prove a phase's CLAIMED
// roles ACTUALLY dispatched under the same run — killing "sprint theater" (a
// coverage row with no backing dispatch). Sourced from the orchestrator's env;
// null when dispatched ad-hoc (a null run_id simply can't satisfy a run-scoped
// coverage check, which is the correct fail-closed behavior).
// T-303 (N8): sprint_id added as the SINGLE SOURCE for env-read — all three
// wrappers (dispatch-agent, dispatch-claude, dispatch-skill) already spread
// ...runContext() into the completion record, so extending this function is
// enough to propagate sprint_id uniformly with no per-wrapper duplication.
function runContext() {
  return {
    run_id: process.env.WARPOS_RUN_ID || null,
    phase_id: process.env.WARPOS_PHASE_ID || null,
    plan_item_id: process.env.WARPOS_PLAN_ITEM_ID || null,
    sprint_id: process.env.WARPOS_SPRINT_ID || null,
  };
}

// Digest of the prompt — proof-of-content for the §17.4 coverage record: a record
// is tied to the exact spec it ran, not just "a role ran". Accepts a Buffer or a
// string; fail-soft to null.
function promptDigest(promptBufOrStr) {
  try {
    const buf = Buffer.isBuffer(promptBufOrStr)
      ? promptBufOrStr
      : Buffer.from(String(promptBufOrStr), "utf8");
    return "sha256:" + crypto.createHash("sha256").update(buf).digest("hex").slice(0, 32);
  } catch {
    return null;
  }
}

// Digest of the produced OUTPUT — §17.4 proof-of-artifact: a coverage record must
// prove it produced non-trivial output, not merely that "a role ran". Returns null
// for empty/whitespace output, so the coverage gate can detect blind/unproven
// coverage (an ok:true record with no real artifact behind it). Buffer or string.
function outputDigest(outBufOrStr) {
  try {
    const s = Buffer.isBuffer(outBufOrStr)
      ? outBufOrStr.toString("utf8")
      : String(outBufOrStr == null ? "" : outBufOrStr);
    if (!s.trim()) return null;
    return "sha256:" + crypto.createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex").slice(0, 32);
  } catch {
    return null;
  }
}

// §17.4 argv/stamp schema version — sourced from the dispatch keystone (one source
// of truth). Fail-soft so a contract-read hiccup never crashes a live dispatch.
function argvSchemaVersion() {
  try {
    return require("./dispatch/dispatch-contract").ARGV_SCHEMA_VERSION || "1";
  } catch {
    return "1";
  }
}

function ensureDir(p) {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch {
    /* ignore */
  }
}

function appendJsonl(file, record) {
  try {
    ensureDir(path.dirname(file));
    fs.appendFileSync(file, JSON.stringify(record) + "\n");
  } catch {
    /* fail-open — telemetry never blocks dispatch */
  }
}

// TEST-ONLY isolation seam: when DISPATCH_LEDGER_DIR is set (never in
// production), completion/death records redirect there so a test can exercise
// the real dispatch path without polluting the canonical ledger. This is an
// EXPLICIT opt-in env — it does NOT re-open ED-016 (which was the IMPLICIT
// cwd-bending bug). Unset → behaviour is byte-identical to canonicalFile().
function ledgerFile(pathsValue, relFallback) {
  const testDir = process.env.DISPATCH_LEDGER_DIR;
  if (testDir) return path.join(testDir, path.basename(relFallback));
  return canonicalFile(pathsValue, relFallback);
}

function recordCompletion(record) {
  // canonicalFile() ensures the path is __dirname-anchored, never cwd-relative.
  // Fixes ED-016/class-#20: worktree-cwd dispatches wrote to worktree's runtime.
  const file = ledgerFile(
    PATHS.dispatchCompletionsFile,
    path.join(".claude", "runtime", "dispatch-completions.jsonl"),
  );
  appendJsonl(file, record);
}

function recordDeath(record) {
  // Same canonical anchor as recordCompletion — both must land in the same root.
  const file = ledgerFile(
    PATHS.dispatchDeathsFile,
    path.join(".claude", "runtime", "dispatch-deaths.jsonl"),
  );
  appendJsonl(file, record);
}

/**
 * Find an agent spec file for a role by scanning .claude/agents/.
 *
 * ADR-0007: the agent system is ONE department-mirroring tree of mode-agnostic
 * roles (no more 01-adhoc/ ↔ 02-oneshot/ duplication). Specs live at:
 *   .claude/agents/president/<face>.md            (alpha/beta/gamma/delta/epsilon)
 *   .claude/agents/engineering/<pod>/<role>.md    (builder/reviewer/fixer per pod)
 *   .claude/agents/product/quality/<role>.md      (qa-reviewer/design-quality/…)
 *   .claude/agents/growth/<role>.md · product/<role>.md · _system/<role>.md
 *
 * Resolution order (mode-agnostic now — the same role spec serves every mode;
 * the conducting face γ/δ/ε supplies the mode context):
 *   1. process.env.WARPOS_MODE explicit (kept for detectMode() callers)
 *   2. `president/<role>.md` for the faces (alpha/beta/gamma/delta/epsilon)
 *   3. DFS over the whole department tree — match by frontmatter `name:` or stem.
 *      Since workers are no longer duplicated, the first stem/name match is
 *      unambiguous.
 */

function detectMode() {
  const explicit = process.env.WARPOS_MODE;
  if (explicit && /^(adhoc|oneshot|solo)$/i.test(explicit))
    return explicit.toLowerCase();
  try {
    // oneshotStore now resolves (via the paths registry) to
    // president/_system/oneshot/store.json. The literal fallback mirrors it.
    const storePath =
      PATHS.oneshotStore ||
      path.join(
        PATHS.agents || ".claude/agents",
        "president",
        ".system",
        "oneshot",
        "store.json",
      );
    if (fs.existsSync(storePath)) {
      const store = JSON.parse(fs.readFileSync(storePath, "utf8"));
      if (store && store.status === "running") return "oneshot";
    }
  } catch {
    /* fall through */
  }
  return "adhoc";
}

// ADR-0007: roles are mode-agnostic — there is no per-mode spec subdir any more.
// Kept as a no-op shim so any external caller doesn't break; resolution now goes
// president/ → DFS over the department tree.
function modeSubdir() {
  return null;
}

function specMatchesRole(filePath, role) {
  try {
    const body = fs.readFileSync(filePath, "utf8");
    const fmMatch = body.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const nameMatch = fmMatch[1].match(/^name:\s*(\S+)/m);
      if (nameMatch && nameMatch[1] === role) return true;
    }
  } catch {
    /* unreadable */
  }
  return false;
}

function tryDirect(role, ...candidates) {
  for (const c of candidates) {
    if (!c) continue;
    if (fs.existsSync(c)) {
      // Prefer files whose frontmatter `name:` matches the role, but accept
      // when stem matches and frontmatter is silent.
      if (specMatchesRole(c, role)) return c;
      const stem = path.basename(c).replace(/\.md$/, "");
      if (stem === role) return c;
    }
  }
  return null;
}

function findAgentSpec(role) {
  const agentsDir =
    PATHS.agents || path.join(PATHS.claudeDir || ".claude", "agents");
  if (!fs.existsSync(agentsDir)) return null;

  // 1. The faces live directly under president/ (alpha/beta/gamma/delta/epsilon).
  const face = tryDirect(role, path.join(agentsDir, "president", `${role}.md`));
  if (face) return face;

  // 2. DFS over the whole department tree — match a spec when its frontmatter
  //    `name:` equals the role (authoritative) OR its stem equals the role.
  //    ADR-0007: the new pod specs are named by FILE-stem only at the pod level
  //    (engineering/security/reviewer.md whose frontmatter `name: security-reviewer`),
  //    so a stem-only gate would MISS `security-reviewer`/`frontend-reviewer` —
  //    we must consult the frontmatter `name:` of EVERY .md, not just stem hits.
  //    Collect candidates and prefer the NEW department tree over the legacy
  //    mode-coupled dirs during the cutover coexistence window (so a stale
  //    01-adhoc/02-oneshot duplicate never shadows the canonical new spec).
  const NEW_TREE = ["president", "engineering", "product", "growth", "_system"];
  const LEGACY_TREE = ["00-alex", "01-adhoc", "02-oneshot", "03-managers"];
  const matches = []; // { full, name, stem }
  const stack = [agentsDir];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
      } else if (ent.isFile() && ent.name.endsWith(".md")) {
        const stem = ent.name.replace(/\.md$/, "");
        const nameMatch = specMatchesRole(full, role); // frontmatter name === role
        if (nameMatch || stem === role) {
          matches.push({ full, byName: nameMatch, stem });
        }
      }
    }
  }
  if (matches.length === 0) return null;
  const rel = (p) => path.relative(agentsDir, p).split(path.sep);
  const inTree = (p, roots) => roots.includes(rel(p)[0]);
  // Preference: frontmatter-name match in the NEW tree > stem match in NEW tree >
  // name match in legacy > stem match in legacy > any.
  const rank = (m) =>
    (m.byName ? 0 : 2) + (inTree(m.full, NEW_TREE) ? 0 : inTree(m.full, LEGACY_TREE) ? 1 : 0.5);
  matches.sort((a, b) => rank(a) - rank(b));
  return matches[0].full;
}

/**
 * Parse an agent spec's frontmatter and return the declared `provider_model`.
 */
function getRoleModel(role) {
  const spec = findAgentSpec(role);
  if (!spec) return null;
  try {
    const body = fs.readFileSync(spec, "utf8");
    const fmMatch = body.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return null;
    const m = fmMatch[1].match(/^provider_model:\s*(\S+)/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// Allow test code to require() this module without triggering the CLI flow.
if (require.main !== module) {
  module.exports = {
    findAgentSpec,
    getRoleModel,
    detectMode,
    modeSubdir,
    // AC2 / ED-016 fix: exported for unit testing the canonical-path resolution.
    // Tests can call canonicalFile(fakeWorktreePath, relFallback) directly to
    // assert that paths outside AGENT_ROOT are replaced with the anchored fallback.
    canonicalFile,
    AGENT_ROOT,
    // RI-004 / ED-018: the Claude-role bounded dispatch wrapper
    // (scripts/dispatch-claude.js) reuses these telemetry helpers so it writes
    // to the SAME canonical ledger gauntlet-verify reads. Single source of the
    // record/path logic — no second copy, no fork. (See dispatch-claude.js.)
    recordCompletion,
    recordDeath,
    makeDispatchId,
    cmdlineChecksum,
    // N-1 (PLAN §17.4): run-context + prompt-digest stampers, reused by
    // dispatch-claude.js so both wrappers write the SAME coverage-gradeable schema.
    runContext,
    promptDigest,
    // §17.4 schema strengthening — reused by dispatch-claude.js so both wrappers
    // stamp output_digest (proof-of-artifact) + the argv schema version identically.
    outputDigest,
    argvSchemaVersion,
  };
  return;
}

const [, , role, promptArg, ...restArgs] = process.argv;

// Optional overrides — used by the SECOND GPT security pass and manual reruns:
//   --provider <claude|openai|gemini>   force a provider regardless of manifest
//   --model <id>                         force a model
// e.g. node scripts/dispatch-agent.js redteam prompt.txt --provider openai --model gpt-5.5
function parseFlag(name) {
  const i = restArgs.indexOf(name);
  return i >= 0 && restArgs[i + 1] ? restArgs[i + 1] : null;
}
const PROVIDER_ALIAS = {
  anthropic: "claude",
  claude: "claude",
  openai: "openai",
  gpt: "openai",
  gemini: "gemini",
  google: "gemini",
};
const rawProviderOverride = parseFlag("--provider");
const providerOverride = rawProviderOverride
  ? PROVIDER_ALIAS[rawProviderOverride.toLowerCase()] ||
    rawProviderOverride.toLowerCase()
  : null;
const modelOverride = parseFlag("--model");
// --domain <d>: the unit of work's domain (product|marketing|engineering|...),
// threaded into the dispatch/run records so domain-aware routing + per-domain
// gauntlet selection have the signal (S1.1 chassis, part 2).
const domainFlag = parseFlag("--domain");

if (!role || !promptArg) {
  console.error(
    JSON.stringify({
      ok: false,
      error:
        "Usage: node scripts/dispatch-agent.js <role> <prompt-file | '-' for stdin>",
    }),
  );
  process.exit(2);
}

// Load the prompt
let prompt = "";
if (promptArg === "-") {
  prompt = fs.readFileSync(0, "utf8");
} else {
  if (!fs.existsSync(promptArg)) {
    console.error(
      JSON.stringify({
        ok: false,
        error: `Prompt file not found: ${promptArg}`,
      }),
    );
    process.exit(2);
  }
  prompt = fs.readFileSync(promptArg, "utf8");
}

if (!prompt.trim()) {
  console.error(JSON.stringify({ ok: false, error: "Empty prompt" }));
  process.exit(2);
}

const provider = providerOverride || getProviderForRole(role);
const promptBytes = Buffer.byteLength(prompt, "utf8");

// Phase 0 workstream C: stamp telemetry identity for this dispatch.
const dispatchId = makeDispatchId();
const dispatchStartedAt = new Date().toISOString();
const dispatchStartedMs = Date.now();
const cmdChecksum = cmdlineChecksum(role, provider, promptBytes);

if (provider === "claude") {
  console.error(
    JSON.stringify({
      ok: false,
      provider: "claude",
      role,
      error:
        "Provider is Claude — dispatch natively via Claude Code Agent tool or `claude -p --agent " +
        role +
        "`. This bridge handles OpenAI and Gemini only.",
    }),
  );
  process.exit(2);
}

// ── Dispatch-contract consult (§17.1 keystone — symmetric with dispatch-claude.js) ──
// This wrapper owns the subprocess-cross-provider shape. Assert the role is
// contract-allowed to be dispatched this way (a build-chain role, or a claude-pinned
// reviewer routed here, is a routing error). REPORT-ONLY by default (PLAN §4 ramp);
// WARPOS_DISPATCH_CONTRACT_ENFORCE=block makes a violation fatal. Fail-OPEN on any
// contract-read error so the contract never crashes a working cross-provider dispatch.
try {
  const { validateDispatch } = require("./dispatch/dispatch-contract");
  const verdict = validateDispatch({
    role,
    shape: "subprocess-cross-provider",
    toolId: provider === "openai" ? "codex" : provider === "gemini" ? "gemini" : provider,
  });
  if (!verdict.ok) {
    const blocking = process.env.WARPOS_DISPATCH_CONTRACT_ENFORCE === "block";
    process.stderr.write(
      `[dispatch-agent] dispatch-contract ${blocking ? "VIOLATION" : "advisory"}: ${verdict.violations.join("; ")}\n`,
    );
    if (blocking) {
      console.log(JSON.stringify({ ok: false, provider, role, error: "dispatch_contract_violation", violations: verdict.violations }));
      process.exit(1);
    }
  }
} catch {
  /* fail-open — contract consult never blocks a working dispatch */
}

// ── Shape-resolver self-detection (T-20260608-271) ──────────────────────────
// This wrapper OWNS the subprocess-cross-provider shape. Consult the LIVE resolver as
// the independent authority: if resolveShape picks a DIFFERENT shape for this role, the
// role is routed through the wrong wrapper (e.g. a build-chain builder pushed through the
// cross-provider path) — the wrong shape self-detects on a REAL dispatch. Report-only by
// default; WARPOS_DISPATCH_CONTRACT_ENFORCE=block makes a high-severity mismatch fatal.
try {
  const { shapeMismatch } = require("./dispatch/dispatch-shape");
  const mm = shapeMismatch("subprocess-cross-provider", { kind: "agent", id: role });
  if (mm && mm.mismatch) {
    const blocking = process.env.WARPOS_DISPATCH_CONTRACT_ENFORCE === "block" && mm.severity === "high";
    process.stderr.write(
      `[dispatch-agent] shape-resolver ${blocking ? "VIOLATION" : "advisory"}: role '${role}' dispatched as 'subprocess-cross-provider' but the resolver picks '${mm.expected}' (${mm.expectedReason || mm.reason}; severity=${mm.severity || "medium"}).\n`,
    );
    if (blocking) {
      console.log(JSON.stringify({ ok: false, provider, role, error: "dispatch_shape_mismatch", expected: mm.expected, actual: "subprocess-cross-provider", severity: mm.severity }));
      process.exit(1);
    }
  }
} catch {
  /* fail-open — the resolver consult never crashes a working dispatch */
}

// Phase 5T F8: Gemini redteam prompts above 75KB routinely timed out.
// Return a structured fallback signal before spending the provider timeout.
if (provider === "gemini" && role === "redteam" && promptBytes > 75 * 1024) {
  const fallbackResult = {
    ok: false,
    provider,
    role,
    fallback: true,
    error: `Prompt is ${promptBytes} bytes; redteam/gemini limit is 75KB. Split the scan or fall back to Claude redteam.`,
  };
  recordProviderTrace({
    role,
    expectedProvider: provider,
    actualProvider: "claude",
    fellBack: true,
    fallbackReason: fallbackResult.error,
    promptBytes,
    ok: false,
  });
  console.log(JSON.stringify(fallbackResult));
  process.exit(1);
}

if (!providerAvailable(provider)) {
  recordProviderTrace({
    role,
    expectedProvider: provider,
    actualProvider: "claude",
    fellBack: true,
    fallbackReason: `Provider ${provider} CLI not available`,
    promptBytes,
    ok: false,
  });
  console.log(
    JSON.stringify({
      ok: false,
      provider,
      role,
      fallback: true,
      error: `Provider ${provider} CLI not available. Falling back to Claude — caller should dispatch via \`claude -p --agent ${role}\`.`,
    }),
  );
  process.exit(1);
}

// T-322: the ε-propagated child bound, single-sourced. When epsilon-runtime's
// DISPATCH_AGENT spawn site sets DISPATCH_BUILDER_TIMEOUT_MS = String(childBaseMs),
// BOTH child timeout layers (slot-acquire below + runProvider's exec) MUST derive
// from it, so the parent's spawnSync bound (childBaseMs + grace) strictly exceeds
// every child layer BY CONSTRUCTION (mirrors the epsilon-claude/dispatch-claude.js
// site, which already reads this env). NULL for non-ε callers — env absent →
// behaviour is byte-identical to before (DISPATCH_SLOT_TIMEOUT_MS / runProvider's
// own default). The foregroundAwareTimeout re-clamp is idempotent: an already-clamped
// childBaseMs cannot be lifted above the foreground ceiling here.
const propagatedBoundRaw = process.env.DISPATCH_BUILDER_TIMEOUT_MS;
const propagatedChildBaseMs =
  propagatedBoundRaw != null && propagatedBoundRaw !== ""
    ? (() => {
        const { foregroundAwareTimeout } = require("./dispatch/timeout-policy");
        const n = parseInt(propagatedBoundRaw, 10);
        return Number.isFinite(n) ? foregroundAwareTimeout(n, {}) : null;
      })()
    : null;

// Acquire a per-provider concurrency slot. Caps protect against API rate
// limits and concurrency-induced failures (e.g. gemini reliably errors on
// 15+ parallel calls but is fine 1-by-1 — observed during run-12 redteam
// gauntlet, retro 2026-04-29). On slot-acquire timeout, return fallback:true
// so the orchestrator routes to claude instead of waiting indefinitely.
// T-322: when ε propagates the child bound, the slot bound must be ≤ childBaseMs
// so the parent's childBaseMs+grace strictly exceeds it; else keep the standalone
// DISPATCH_SLOT_TIMEOUT_MS default (600s) unchanged for non-ε callers.
//
// T-322 / β build-constraint (DECIDE 0.90), CHOICE (b) — ACCEPTED, not floored:
// when childBaseMs is foreground-CLAMPED (540s), this slot bound shrinks below the
// old 600s default. That is CORRECT fallback behavior, not a regression: a foreground
// dispatch's TOTAL budget is already ≤540s, so a slot wait approaching that leaves no
// room to run the provider call anyway — failing over to claude sooner (high cap, no
// rate-limit) is the right move, not waiting out a 600s saturated slot we could never
// use. A FLOOR of 600s is not an option here: it would make slot > childBaseMs and
// re-open the parent-kills-child race this ticket closes. BACKGROUND dispatches keep
// the full wait (childBaseMs=900s > 600s), so a saturated provider that genuinely needs
// ~600s to free a slot is UNAFFECTED — only the foreground (can't-run-long) lane shortens.
const slotTimeoutMs =
  propagatedChildBaseMs != null
    ? propagatedChildBaseMs
    : parseInt(process.env.DISPATCH_SLOT_TIMEOUT_MS || `${10 * 60 * 1000}`, 10);
const slot = acquireSlotSync(provider, {
  timeoutMs: slotTimeoutMs,
  meta: {
    dispatch_id: dispatchId,
    role,
    provider,
    prompt_bytes: promptBytes,
    cmdline_checksum: cmdChecksum,
  },
});
if (!slot) {
  recordProviderTrace({
    role,
    expectedProvider: provider,
    actualProvider: "claude",
    fellBack: true,
    fallbackReason: `Provider ${provider} concurrency cap full after ${slotTimeoutMs}ms`,
    promptBytes,
    ok: false,
  });
  console.log(
    JSON.stringify({
      ok: false,
      provider,
      role,
      fallback: true,
      error: `Provider ${provider} concurrency cap full after ${slotTimeoutMs}ms — falling back to Claude. Tune via ${provider.toUpperCase()}_MAX_CONCURRENCY env var.`,
    }),
  );
  process.exit(1);
}

let result;
try {
  // Honor the agent's frontmatter-declared provider_model (e.g. qa → gpt-5.4-mini,
  // reviewer → gpt-5.5, redteam → gemini-3.1-pro-preview) instead of the provider
  // default. BUT when --provider overrides the native provider, the spec's model
  // belongs to the WRONG provider — ignore it and use --model (or let runProvider
  // pick the override provider's default).
  const roleModel = getRoleModel(role);
  const runOpts = {};
  if (providerOverride) {
    runOpts.provider = providerOverride;
    if (modelOverride) runOpts.model = modelOverride;
  } else if (modelOverride) {
    runOpts.model = modelOverride;
  } else if (roleModel) {
    runOpts.model = roleModel;
  }
  // T-322: when ε propagates the child bound, the provider-exec must single-source
  // from it too — runProvider otherwise uses its own run-provider default (540s),
  // INDEPENDENT of the parent's propagated value, leaving the cross-provider site's
  // death-record race open. Setting timeoutMs from the ε-propagated childBaseMs
  // makes runProvider bound by childBaseMs (runProvider re-clamps idempotently via
  // foregroundAwareTimeout). Non-ε callers (env absent) keep runProvider's default.
  if (propagatedChildBaseMs != null) runOpts.timeoutMs = propagatedChildBaseMs;
  result = runProvider(role, prompt, runOpts);

  // WI-18: quota-aware fallback. When a gemini-routed role (e.g. redteam) 429s /
  // exhausts quota, runProvider surfaces it loudly via result.quota and still
  // sets fallback:true. Rather than silently degrading the SECURITY pass to
  // claude (same family as the code under review — weak diff-model coverage), do
  // ONE bounded retry on openai (the documented 2nd-GPT security-pass path), but
  // only when the operator hasn't already forced a provider/model. Recoverable
  // (rate-limit) AND unrecoverable (free-tier=0) both warrant the cross-family
  // retry — the gemini path won't serve either way. Single attempt, no loop.
  if (
    result &&
    !result.ok &&
    result.quota &&
    !providerOverride &&
    !modelOverride &&
    (result.provider === "gemini" || provider === "gemini")
  ) {
    const fbProvider = result.quota.suggestFallbackProvider || "openai";
    if (fbProvider !== "claude") {
      process.stderr.write(
        `[dispatch-agent] WI-18 quota fallback: ${role} ${result.provider}` +
          ` (${result.quota.kind}) → retrying on ${fbProvider} for cross-family` +
          ` security coverage (1 attempt).\n`,
      );
      const retry = runProvider(role, prompt, { provider: fbProvider });
      if (retry && retry.ok) {
        retry.quotaFallbackFrom = {
          provider: result.provider,
          model: result.model || null,
          kind: result.quota.kind,
        };
        result = retry;
      }
      // If the retry also fails, keep the original quota result (its loud error +
      // fallback:true still drives the caller's existing claude fallback). Never
      // mask a double failure as success.
    }
  }

  // Add role + structured output to result
  result.role = role;
  if (roleModel) result.specModel = roleModel;
  const parsed = parseProviderJson(result.output);
  if (parsed) result.parsed = parsed;
  // S-7: `cabinet` is the registered freeform consult role (brainstorm, second
  // opinion, research) — it carries no review envelope. advisor/consult are its
  // legacy ids (kept here so a partially-migrated caller still skips validation;
  // normalizeRole collapses them to cabinet). Skip strict validation so a
  // freeform reply isn't logged as an invalid ComplianceResult ("invalid verdict
  // null"), which would pollute review-role telemetry.
  const FREEFORM_ROLES = new Set(["cabinet", "advisor", "consult"]);
  const envelopeValidation = FREEFORM_ROLES.has(role)
    ? { ok: true, errors: [], normalized: null, freeform: true }
    : validateAgentOutput(role, parsed || result.output || "");
  result.envelopeValidation = {
    ok: envelopeValidation.ok,
    errors: envelopeValidation.errors || [],
    normalized: envelopeValidation.normalized
      ? {
          agent: envelopeValidation.normalized.agent,
          verdict: envelopeValidation.normalized.verdict,
          findings: envelopeValidation.normalized.findings.length,
          requiresHuman: envelopeValidation.normalized.requiresHuman,
        }
      : null,
  };
  recordProviderTrace({
    role,
    domain: domainFlag || null,
    expectedProvider: provider,
    actualProvider: result.provider || provider,
    model: result.model || roleModel || null,
    fellBack: !!result.fallback,
    fallbackReason: result.error || null,
    promptBytes,
    ok: result.ok,
  });

  // Phase 0 workstream C: completion + silent-death telemetry.
  const stdoutBytes = result.output
    ? Buffer.byteLength(String(result.output), "utf8")
    : 0;
  const stderrBytes = result.stderrBytes || 0;
  const completedAt = new Date().toISOString();
  const completedMs = Date.now();
  const elapsedMs = completedMs - dispatchStartedMs;
  recordCompletion({
    dispatch_id: dispatchId,
    pid: process.pid,
    role,
    domain: domainFlag || null,
    provider,
    model: result.model || roleModel || null,
    started_at: dispatchStartedAt,
    completed_at: completedAt,
    elapsed_ms: elapsedMs,
    prompt_bytes: promptBytes,
    cmdline_checksum: cmdChecksum,
    exit_code: result.ok ? 0 : 1,
    stdout_bytes: stdoutBytes,
    stderr_bytes: stderrBytes,
    fallback: !!result.fallback,
    ok: !!result.ok,
    // N-1 (§17.4): run-context + shape + tool + prompt digest for the coverage gate.
    ...runContext(),
    prompt_digest: promptDigest(prompt),
    shape: "subprocess-cross-provider",
    tool_id: provider === "openai" ? "codex" : provider === "gemini" ? "gemini" : provider,
    // §17.4 strengthening: schema version (the gate rejects stale/backfilled
    // records), cwd, and output_digest (proof the dispatch produced real output —
    // a record's mere existence is not coverage).
    argv_schema_version: argvSchemaVersion(),
    cwd: AGENT_ROOT,
    output_digest: outputDigest(result.output),
  });

  // Silent zero-byte death: process returned a non-ok with no stdout AND no
  // captured stderr — this is the LRN-2026-04-17 / 2026-04-30 binding-gap
  // failure signature. Persist for post-mortem so future flag-drain / health
  // checks can flag the pattern instead of swallowing it.
  if (!result.ok && stdoutBytes === 0 && stderrBytes === 0) {
    recordDeath({
      dispatch_id: dispatchId,
      timestamp: completedAt,
      pid: process.pid,
      role,
      domain: domainFlag || null,
      provider,
      model: result.model || roleModel || null,
      prompt_bytes: promptBytes,
      cmdline_checksum: cmdChecksum,
      exit_code: null,
      stdout_bytes: 0,
      stderr_bytes: 0,
      last_stdout_mtime: null,
      last_stderr_mtime: null,
      reason: "silent_zero_byte_death",
      hint: result.error || null,
    });
  }
} finally {
  releaseSlot(slot);
}

console.log(JSON.stringify(result));
process.exit(result.ok ? 0 : 1);
