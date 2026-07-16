#!/usr/bin/env node
"use strict";
/**
 * cert-attest.js — §7 certification-gate effective-model ATTESTATION (DISPATCH.md §7; ADR-0016).
 *
 * Dispatches a BOUNDED probe to a SPECIFIC model through the safe-spawn KERNEL and captures the
 * CLI output (stdout + stderr), then verifies the CLI's OWN self-identification of the model that
 * served — the authoritative "the reviewer actually ran on the intended model" proof β requires for
 * the Bucket-D flip GREEN. This defeats the `opts.model || provider.default_model` trap (a registry-
 * only migration that looks green while dispatch stays stale): if the CLI served the DEFAULT instead
 * of the requested `-m`, its echoed header names the default and the attestation FAILS.
 *
 * WHY A SCRIPT (not a raw shell probe): a raw `codex exec … -m <model>` from Bash is (correctly)
 * refused by the dispatch-route-guard / auto-classifier as guard-circumvention. This tool IS the
 * sanctioned path: it sets WARPOS_PROVIDER_PROBE=1 process-INTERNALLY and spawns ONLY through
 * safeSpawnSync (shell:false, arg-allowlisted, abs-path tool, tree-kill) — never a raw shell string.
 * The operator/lead runs the plain `node scripts/checks/cert-attest.js --model <m>` top-level.
 *
 *   node scripts/checks/cert-attest.js --model gpt-5.6-sol [--provider openai] [--effort low] [--json]
 *
 * Exit: 0 ATTESTED (CLI output self-identifies the requested model; exit 0; non-empty) ·
 *       1 FAIL (mismatch / a DIFFERENT model named / dispatch error / empty output) ·
 *       2 usage / kernel unavailable (fail-closed).
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "cert-attest";
const ARTIFACT_DIR = path.join(ROOT, "runtime", "cert-attest");

function loadCatalog() {
  return require(path.join(ROOT, "scripts", "dispatch", "catalog.js"));
}
function loadKernel() {
  try {
    return require(path.join(ROOT, "scripts", "dispatch", "safe-spawn.js"));
  } catch (e) {
    return { _err: e.message };
  }
}

// Provider → { toolId, argv(model,effort), stdin } for the probe. Only providers whose CLI is in the
// safe-spawn ARG_POLICY are dispatchable here; others fail-closed (add the ARG_POLICY first).
function probeShape(providerId, model, effort) {
  if (providerId === "openai") {
    const reasoning = effort ? ["-c", `model_reasoning_effort=${effort}`] : [];
    return { toolId: "codex", argv: ["exec", "--sandbox", "workspace-write", ...reasoning, "-m", model, "-"], stdin: true };
  }
  if (providerId === "antigravity") {
    // Prompt is the ARGUMENT to -p (no stdin); requires the agy ARG_POLICY in safe-spawn (task #27).
    return { toolId: "agy", argv: ["--model", model, "--print-timeout", "90s", "-p", PROBE_PROMPT], stdin: false };
  }
  if (providerId === "claude") {
    return { toolId: "claude", argv: ["-p", "--model", model], stdin: true };
  }
  if (providerId === "gemini") {
    return { toolId: "gemini", argv: ["-m", model, "-p", PROBE_PROMPT], stdin: false };
  }
  return null;
}

const PROBE_PROMPT =
  "Reply with EXACTLY: PROBE OK. Do not add anything else.";

// Normalize a model id for tolerant containment matching (case/underscore/space → hyphen).
const norm = (s) => String(s || "").toLowerCase().replace(/[_\s]+/g, "-");

/**
 * Decide the attestation from the raw CLI output + the requested model. The KEY check: the requested
 * model id must appear in the CLI's own output (its echoed header / self-id), and NO other catalog
 * model id for the same provider may appear INSTEAD. Pure + injectable for the bite-test.
 * @returns {{ attested, effective, reason, requestedSeen, otherSeen }}
 */
function evaluateAttestation({ requestedModel, providerId, output, exitOk, catalog }) {
  const out = norm(output);
  const req = norm(requestedModel);
  if (!exitOk) return { attested: false, effective: null, reason: "dispatch did not exit cleanly (non-zero / reaped / empty)" };
  if (!out) return { attested: false, effective: null, reason: "empty CLI output — nothing to attest" };
  const requestedSeen = out.includes(req);
  // Any OTHER catalog model for this provider appearing in the output = a served-a-different-model tell.
  let otherSeen = null;
  try {
    const prov = catalog.getProvider(providerId);
    for (const m of (prov && prov.models) || []) {
      const id = norm(m.id);
      if (id !== req && out.includes(id)) { otherSeen = m.id; break; }
    }
  } catch { /* catalog optional for the pure core */ }
  if (otherSeen && !requestedSeen)
    return { attested: false, effective: otherSeen, reason: `CLI output names a DIFFERENT model "${otherSeen}" — the opts.model||default trap (served the default, not the requested -m)`, otherSeen };
  if (requestedSeen)
    return { attested: true, effective: requestedModel, reason: "CLI output self-identifies the requested model", requestedSeen: true };
  // Neither the requested nor another known id found → inconclusive → FAIL-CLOSED (never a false green).
  return { attested: false, effective: null, reason: "requested model id NOT found in CLI output — inconclusive (fail-closed); inspect the artifact + calibrate the header capture", requestedSeen: false, otherSeen };
}

function providerForModel(catalog, model, explicit) {
  if (explicit) return catalog.normalizeProviderId(explicit);
  for (const p of catalog.PROVIDER_LIST || []) {
    if ((p.models || []).some((m) => m.id === model || (m.aliases || []).includes(model))) return p.id;
  }
  return null;
}

function main(argv) {
  const get = (flag) => { const i = argv.indexOf(flag); return i !== -1 ? argv[i + 1] : null; };
  const json = argv.includes("--json");
  const model = get("--model");
  const effort = get("--effort") || "low"; // bounded/cheap by default — a verdict, not agentic work
  if (!model) {
    process.stderr.write("usage: cert-attest.js --model <id> [--provider <p>] [--effort <e>] [--json]\n");
    return 2;
  }
  const catalog = loadCatalog();
  const providerId = providerForModel(catalog, model, get("--provider"));
  if (!providerId) {
    process.stderr.write(`${NAME}: cannot resolve a provider for model "${model}" (pass --provider) — is it in the catalog?\n`);
    return 2;
  }
  const shape = probeShape(providerId, model, providerId === "openai" ? effort : null);
  if (!shape) {
    process.stderr.write(`${NAME}: no probe shape for provider "${providerId}"\n`);
    return 2;
  }
  const kernel = loadKernel();
  if (kernel._err || typeof kernel.safeSpawnSync !== "function") {
    process.stderr.write(`${NAME}: safe-spawn kernel unavailable (${kernel._err || "no safeSpawnSync"}) — fail-closed\n`);
    return 2;
  }

  // THIS is the sanctioned probe path — declare it to the guards process-internally.
  process.env.WARPOS_PROVIDER_PROBE = "1";
  const started = Date.now();
  const spawned = kernel.safeSpawnSync(shape.toolId, shape.argv, {
    cwd: ROOT,
    env: process.env,
    input: shape.stdin ? PROBE_PROMPT : undefined,
    timeoutMs: 90_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  const elapsedMs = Date.now() - started;
  const stdout = spawned.stdout || "";
  const stderr = spawned.stderr || "";
  const combined = `${stdout}\n${stderr}`; // the CLI header may land on either stream
  const exitOk = spawned.ok === true && spawned.exitCode === 0;

  const verdict = evaluateAttestation({ requestedModel: model, providerId, output: combined, exitOk, catalog });

  // Write the attestation artifact (walk-skipped runtime/). Full raw output retained for audit +
  // header-regex calibration on the first live fire.
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const ts = new Date().toISOString();
  const artifact = {
    check: NAME,
    requested_model: model,
    provider: providerId,
    effort: providerId === "openai" ? effort : null,
    attested: verdict.attested,
    effective_model: verdict.effective,
    reason: verdict.reason,
    exit_ok: exitOk,
    exit_code: spawned.exitCode,
    reaped: spawned.reaped || false,
    violations: spawned.violations || null,
    stdout_bytes: Buffer.byteLength(stdout, "utf8"),
    stderr_bytes: Buffer.byteLength(stderr, "utf8"),
    elapsed_ms: elapsedMs,
    ts,
    cli_output_sha256: crypto.createHash("sha256").update(combined).digest("hex"),
    cli_output_head: combined.slice(0, 2000), // header lives here; full text is the sha's witness
  };
  const file = path.join(ARTIFACT_DIR, `${norm(model)}-${ts.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify(artifact, null, 2) + "\n");

  if (json) {
    process.stdout.write(JSON.stringify({ ...artifact, artifact_path: path.relative(ROOT, file) }, null, 2) + "\n");
  } else if (verdict.attested) {
    process.stdout.write(`ATTESTED [${NAME}] ${model} (${providerId}) — CLI self-identified the requested model. artifact: ${path.relative(ROOT, file)}\n`);
  } else {
    process.stderr.write(`FAIL [${NAME}] ${model} (${providerId}) — ${verdict.reason}. artifact: ${path.relative(ROOT, file)}\n`);
  }
  return verdict.attested ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { evaluateAttestation, providerForModel, probeShape, norm, NAME };
