#!/usr/bin/env node
/**
 * test-dispatch-config.js — regression enforcer for the 2026-05-30 dispatch fix.
 *
 * Makes violations of project_gemini_dispatch_headless_fix self-detecting:
 *   - re-introduction of a `gemini-3.1-*` GHOST model (HTTP 404 v1beta)
 *   - re-introduction of the DEPRECATED `codex exec --full-auto` flag
 *   - removal of the gemini key-injection / trust-workspace headless fix
 *   - redteam spec pointing at a ghost model
 *   - loss of the --provider override (the 2nd GPT security pass mechanism)
 *
 * Exits 1 on any violation (the enforcer the memory-guard hook requires).
 * Pure text/JSON assertions — no provider calls, runs in <1s, CI-safe.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const GHOST = /gemini-3\.1-(?:pro-preview|flash|flash-lite)|gemini-3-flash\b/;

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error("  FAIL: " + msg);
};
const ok = (msg) => console.log("  ok: " + msg);

function check(label, fn) {
  try {
    fn();
  } catch (e) {
    fail(`${label} — ${e.message}`);
  }
}

// 1. providers.js — the load-bearing dispatch path.
check("providers.js", () => {
  const src = read("scripts/hooks/lib/providers.js");
  // The actual codex command must NOT use the deprecated flag.
  const cmdLine = src.match(/cmd = `\$\{cfg\.cli\} exec [^`]*`/);
  if (!cmdLine) throw new Error("could not locate the codex exec cmd template");
  if (/--full-auto/.test(cmdLine[0]))
    throw new Error("codex cmd still uses DEPRECATED --full-auto");
  if (!/--sandbox workspace-write/.test(cmdLine[0]))
    throw new Error("codex cmd missing --sandbox workspace-write");
  ok("codex cmd uses --sandbox workspace-write (not --full-auto)");
  // GEMINI default must not be a ghost.
  const gd = src.match(/GEMINI_DEFAULT\s*=\s*process\.env\.GEMINI_MODEL\s*\|\|\s*"([^"]+)"/);
  if (!gd) throw new Error("could not find GEMINI_DEFAULT");
  if (GHOST.test(gd[1])) throw new Error(`GEMINI_DEFAULT is a ghost: ${gd[1]}`);
  ok(`GEMINI_DEFAULT is real: ${gd[1]}`);
  // Headless fixes must be present.
  if (!/GEMINI_CLI_TRUST_WORKSPACE/.test(src))
    throw new Error("missing GEMINI_CLI_TRUST_WORKSPACE headless-trust fix");
  if (!/loadGeminiApiKey/.test(src))
    throw new Error("missing loadGeminiApiKey key-injection fix");
  if (!/opts\.provider\b/.test(src))
    throw new Error("runProvider lost the opts.provider override");
  ok("gemini key-injection + trust + provider-override present");
});

// 2. catalog.js — no ghost ids anywhere.
check("catalog.js", () => {
  const src = read("scripts/dispatch/catalog.js");
  // allow ghost mentions ONLY inside comment lines (// ...)
  src.split(/\r?\n/).forEach((line, i) => {
    if (/^\s*\/\//.test(line)) return; // comment — allowed to discuss ghosts
    if (GHOST.test(line))
      throw new Error(`ghost model in non-comment line ${i + 1}: ${line.trim()}`);
  });
  ok("no ghost model ids in catalog code");
});

// 3. manifest.json — codex syntax + gemini model + redteam routing.
check(".claude/manifest.json", () => {
  const m = JSON.parse(read(".claude/manifest.json"));
  if (/--full-auto/.test(m.providers.openai.syntax))
    throw new Error("manifest openai.syntax still uses --full-auto");
  if (GHOST.test(m.providers.gemini.default_model))
    throw new Error(`manifest gemini.default_model is a ghost: ${m.providers.gemini.default_model}`);
  if (!m.agentProviders.redteam)
    throw new Error("manifest.agentProviders.redteam missing");
  ok(`manifest clean (redteam→${m.agentProviders.redteam}, gemini→${m.providers.gemini.default_model})`);
});

// 4. scaffold-core.js — NEW products must inherit the fix, not the ghost.
check("scaffold-core.js", () => {
  const src = read("scripts/warpos/scaffold-core.js");
  const block = src.match(/openai:\s*\{[\s\S]*?gemini:\s*\{[\s\S]*?\}/);
  if (!block) throw new Error("could not locate generated providers block");
  if (/--full-auto/.test(block[0]) && !/DEPRECATED/.test(block[0]))
    throw new Error("scaffold still emits --full-auto for new products");
  const gm = block[0].match(/default_model:\s*"([^"]+)"[\s\S]*?\/\/ `gemini/);
  // simpler: ensure no ghost default in the generated gemini block
  if (GHOST.test(block[0].replace(/\/\/[^\n]*/g, "")))
    throw new Error("scaffold emits a ghost gemini default for new products");
  ok("scaffold-core emits fixed dispatch config for new products");
});

// 5. redteam orchestrator specs (both modes) — provider_model not a ghost.
for (const spec of [
  ".claude/agents/01-adhoc/redteam/orchestrator.md",
  ".claude/agents/02-oneshot/redteam/orchestrator.md",
]) {
  check(spec, () => {
    const fm = read(spec).match(/provider_model:\s*(\S+)/);
    if (!fm) throw new Error("no provider_model in frontmatter");
    if (GHOST.test(fm[1])) throw new Error(`redteam provider_model is a ghost: ${fm[1]}`);
    ok(`${spec.split("/").slice(-3, -1).join("/")} provider_model real: ${fm[1]}`);
  });
}

// 6. dispatch-agent.js — the --provider/--model override (2nd security pass).
check("dispatch-agent.js", () => {
  const src = read("scripts/dispatch-agent.js");
  if (!/--provider/.test(src) || !/providerOverride/.test(src))
    throw new Error("dispatch-agent lost the --provider override");
  ok("dispatch-agent supports --provider/--model override");
});

console.log("");
if (failures) {
  console.error(`test-dispatch-config: ${failures} FAILURE(S)`);
  process.exit(1);
}
console.log("test-dispatch-config: all dispatch-config invariants hold");
process.exit(0);
