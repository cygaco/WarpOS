#!/usr/bin/env node
"use strict";
// provider-agent-tool-parity (DISPATCH.md §9 carve-out enforcer) — the GPT-pin ↔ Agent-tool
// collision guard.
//
// The harness `Agent` tool is CLAUDE-ONLY: an in-process Agent-tool spawn runs a Claude subagent.
// So a role pinned to a non-Claude provider (openai/antigravity/gemini) CANNOT be summoned in-process
// via the Agent tool — empirically, a gpt-pinned product-lead/design-lead spawn FAILS, while an
// opus-pinned role spawns fine (E-DISPATCH-MODELSPREAD-001, Composer-observed). Therefore a
// `provider != claude` role must NOT carry Agent-tool reachability (`tools: ["Agent"]` in the
// registry or its spec frontmatter). Such a role either (a) stays Claude-pinned to keep its Agent
// fan-out, or (b) is reached ONLY via a CLI subprocess (dispatch-agent.js) and drops `tools:["Agent"]`
// — its fan-out becomes CLI sub-prompts, or is delegated to a Claude lead that DOES carry Agent.
//
// The Claude carve-out is legitimate and NOT flagged: quality-lead (claude + tools:Agent — its
// Agent fan-out IS the QA absorb layer) and design-quality/visual-review (claude_pinned visual
// judges). Only provider != claude + Agent-tool reachability is a contradiction.
//
// ADR-0016 §"GPT-pin ↔ Agent-tool collision". Report-only in /scan:full (surfaces the contradiction
// so it cannot ship silently; the per-role resolution lands with the Bucket-D provider flip).
//
// Exit: 0 clean · 1 findings · 2 fail-closed (unreadable/unparseable registry or internal error).
const fs = require("fs");
const path = require("path");

const NAME = "provider-agent-tool-parity";
const ROOT = path.resolve(__dirname, "..", "..");
const REGISTRY = ".claude/agents/_org/role-registry.json";

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const providerOf = (r) => (r && r.provider) || "claude";
const carriesAgentInRegistry = (r) => Array.isArray(r && r.tools) && r.tools.includes("Agent");

// Parse a spec's frontmatter `tools:` list (comma or YAML-array form) and test for Agent. Handles
// `tools: Read, Grep, Agent` (inline) and `tools: [Read, Agent]`. Returns { has:boolean } — a spec
// that can't be read is { has:false, unreadable:true } (role-parity owns missing-spec findings).
function specToolsHasAgent(root, specPath) {
  if (!specPath) return { has: false };
  let text;
  try {
    text = fs.readFileSync(path.join(root, specPath), "utf8");
  } catch {
    return { has: false, unreadable: true };
  }
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!fm) return { has: false };
  const m = /^tools:[ \t]*(.*)$/m.exec(fm[1]);
  if (!m) return { has: false };
  const raw = m[1].replace(/[[\]]/g, " ");
  const tokens = raw.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
  return { has: tokens.includes("Agent") };
}

// Pure, injectable core. `specToolsFn(role, r)` yields { has } for the role's spec (default = disk).
// Returns a flat error list.
function evaluateProviderAgentToolParity({ reg, root = ROOT, specToolsFn } = {}) {
  const errors = [];
  const roles = (reg && reg.roles) || {};
  const specTools = specToolsFn || ((_name, r) => specToolsHasAgent(root, r.spec));
  for (const [name, r] of Object.entries(roles)) {
    const provider = providerOf(r);
    if (provider === "claude") continue; // Claude carve-out (quality-lead / design-quality / visual-review)
    const inReg = carriesAgentInRegistry(r);
    const inSpec = specTools(name, r).has;
    if (inReg || inSpec) {
      const where = [inReg && "registry tools", inSpec && "spec frontmatter tools"].filter(Boolean).join(" + ");
      errors.push(
        `[CRITICAL] role "${name}" provider="${provider}" carries Agent-tool reachability (${where}) — the harness Agent tool is Claude-only; a non-Claude role cannot be summoned in-process. Either Claude-pin it or reach it via CLI only and drop tools:["Agent"] (DISPATCH.md §9; ADR-0016).`,
      );
    }
  }
  return errors;
}

function main(argv) {
  const json = (argv || []).includes("--json");
  let reg;
  try {
    reg = readJSON(path.join(ROOT, REGISTRY));
  } catch (e) {
    process.stderr.write(`${NAME}: role-registry.json unreadable/unparseable: ${e.message}\n`);
    return 2; // fail-closed
  }
  let errors;
  try {
    errors = evaluateProviderAgentToolParity({ reg, root: ROOT });
  } catch (e) {
    process.stderr.write(`${NAME} error: ${e.message}\n`);
    return 2;
  }
  if (json) {
    process.stdout.write(JSON.stringify({ ok: errors.length === 0, check: NAME, errors }, null, 2) + "\n");
    return errors.length ? 1 : 0;
  }
  if (errors.length === 0) {
    process.stdout.write(`OK   [${NAME}] no provider!=claude role carries Agent-tool reachability (Claude-only carve-out honored)\n`);
    return 0;
  }
  process.stderr.write(
    `FAIL [${NAME}] GPT-pin↔Agent-tool collision (${errors.length}):\n${errors.map((e) => `  - ${e}`).join("\n")}\n`,
  );
  return 1;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { evaluateProviderAgentToolParity, specToolsHasAgent, main, NAME };
