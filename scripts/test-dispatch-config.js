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
// Ghost = a model id confirmed NON-SERVABLE (404 / shut down) per the 2026-06-01
// vendor-docs audit (runtime/models-research/gemini.json#ghost_watch). The current
// reals — gemini-3.1-pro-preview, gemini-3.5-flash, gemini-3.1-flash-lite — must
// NOT be flagged. Confirmed-dead ids only:
//   gemini-3-pro-preview           shut down 2026-03-09 → gemini-3.1-pro-preview
//   gemini-3.1-flash-lite-preview  shut down 2026-05-25 → gemini-3.1-flash-lite
//   gemini-2.5-flash-lite-preview-09-2025  shut down → gemini-2.5-flash-lite
//   gemini-2.0-flash-exp           shut down
//   gemini-3-flash                 never existed as a standalone id
const GHOST = /gemini-3-pro-preview\b|gemini-3\.1-flash-lite-preview\b|gemini-2\.5-flash-lite-preview-09-2025\b|gemini-2\.0-flash-exp\b|gemini-3-flash\b/;

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
  // Post Wave-1 wire-through (E-SYSTEM-ORG-001): codex dispatch is built as an
  // argv ARRAY routed through the safe-spawn kernel (shell:false), not a shell
  // cmd-string template. Assert the new form + the deprecated-flag ban.
  const codexArgv = src.match(/argv = \["exec",[^\]]*\]/);
  if (!codexArgv)
    throw new Error("could not locate the codex exec argv array");
  if (/--full-auto/.test(codexArgv[0]))
    throw new Error("codex argv still uses DEPRECATED --full-auto");
  if (!/"--sandbox", "workspace-write"/.test(codexArgv[0]))
    throw new Error("codex argv missing --sandbox workspace-write");
  if (!/safeSpawn\.safeSpawnSync\(toolId, argv/.test(src))
    throw new Error("providers.js no longer routes dispatch through the safe-spawn kernel");
  ok("codex argv uses --sandbox workspace-write through safe-spawn (not --full-auto)");
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

// 5. security-reviewer spec (ADR-0007: replaces the redteam orchestrator;
// mode-agnostic single spec) — provider_model not a ghost.
for (const spec of [
  ".claude/agents/engineering/security/reviewer.md",
]) {
  check(spec, () => {
    const fm = read(spec).match(/provider_model:\s*(\S+)/);
    if (!fm) throw new Error("no provider_model in frontmatter");
    if (GHOST.test(fm[1])) throw new Error(`security-reviewer provider_model is a ghost: ${fm[1]}`);
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

// 7. PRIMARY gemini model AGREEMENT across every dispatch point (2026-06-01).
// Each prior check only proves a value isn't a ghost; none proves they MATCH.
// Changing the default in one file but not the others is the exact rename-hygiene
// drift class CLAUDE.md flags (the model is pinned in 7 places). This makes a
// mismatch self-detecting. NOTE: gemini-2.5-flash legitimately appears as a
// FALLBACK rung (provider-fallback#fallback, smoke ping) — only PRIMARY/DEFAULT
// points are asserted equal here.
check("gemini primary-model agreement", () => {
  const grab = (file, re, label) => {
    const m = read(file).match(re);
    if (!m) throw new Error(`could not read primary gemini model from ${label}`);
    return { label, model: m[1] };
  };
  const points = [
    grab("scripts/hooks/lib/providers.js",
      /GEMINI_DEFAULT\s*=\s*process\.env\.GEMINI_MODEL\s*\|\|\s*"([^"]+)"/, "providers.GEMINI_DEFAULT"),
    grab("scripts/dispatch/catalog.js",
      /id:\s*"gemini",[\s\S]*?defaultModel:\s*"([^"]+)"/, "catalog.defaultModel"),
    grab("scripts/warpos/scaffold-core.js",
      /gemini:\s*\{[\s\S]*?default_model:\s*"([^"]+)"/, "scaffold.gemini.default_model"),
    grab(".claude/agents/engineering/security/reviewer.md",
      /provider_model:\s*(\S+)/, "security-reviewer.provider_model"),
  ];
  // JSON-sourced points
  const manifest = JSON.parse(read(".claude/manifest.json"));
  points.push({ label: "manifest.gemini.default_model", model: manifest.providers.gemini.default_model });
  const pf = JSON.parse(read(".claude/agents/president/.system/policy/provider-fallback.json"));
  // ADR-0007: the security pass's primary policy may live under redteam (legacy)
  // or security-reviewer (new). Read whichever the policy carries.
  const secPolicy = pf.policies["security-reviewer"] || pf.policies.redteam;
  points.push({ label: "provider-fallback.security.primary", model: String(secPolicy.primary).split(":").pop() });

  const distinct = [...new Set(points.map((p) => p.model))];
  if (distinct.length !== 1) {
    const detail = points.map((p) => `${p.label}=${p.model}`).join(", ");
    throw new Error(`gemini primary model DRIFT across dispatch points: ${detail}`);
  }
  ok(`gemini primary model agrees everywhere: ${distinct[0]}`);
});

console.log("");
if (failures) {
  console.error(`test-dispatch-config: ${failures} FAILURE(S)`);
  process.exit(1);
}
console.log("test-dispatch-config: all dispatch-config invariants hold");
process.exit(0);
