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

// The sanctioned in-process hunter role identity (ADR-0016). The claude-hunter panel exemption binds
// to THIS role (β#3/SR-005) — provider===claude alone does not.
const SANCTIONED_HUNTER_ROLE = "security_claude_hunter";

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

// ── D8: same-run panel attestation (SP-20260718-003, AC-14,15) ─────────────────
//
// attestPanelRun correlates a SAME-RUN ledger record PER REQUIRED LANE and attests the panel ONLY
// when every lane ran on its CONTRACTED provider with fallback:false + real evidence. This is the
// attestRanOnGpt discipline (beta-consult.js) generalized to the whole panel: attest on the OBSERVED
// ledger return, NEVER a wrapper claim. The load-bearing NEGATIVE (T5): a wrapper that CLAIMS agy but
// whose ledger record is provider:claude/absent does NOT attest the agy lane (a record-inprocess/
// provider:claude record satisfies ONLY the claude hunter) — so the attestation FAILS, which is what
// makes the provider-diversity claim FALSIFIABLE.

/** Read the dispatch-completions ledger, filtered to a sprint (+ optional run). Injectable path. */
function readLedgerRecords(sprintId, runId, ledgerPath) {
  let file = ledgerPath;
  if (!file) {
    try { file = require(path.join(ROOT, "scripts", "hooks", "lib", "paths")).PATHS.dispatchCompletionsFile; }
    catch { file = path.join(ROOT, ".claude", "runtime", "dispatch-completions.jsonl"); }
  }
  let raw;
  try { raw = fs.readFileSync(file, "utf8"); } catch { return []; }
  const out = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    let r;
    try { r = JSON.parse(t); } catch { continue; }
    if (sprintId && r.sprint_id !== sprintId) continue;
    if (runId != null && r.run_id !== runId) continue;
    out.push(r);
  }
  return out;
}

/**
 * Attest ONE required lane against the same-run ledger records. PURE. A lane is attested ONLY by a
 * record that ran on its CONTRACTED provider (observed, never claimed):
 *   - a CLI cross-provider lane (gpt/agy): provider === contracted, tool_id === contracted tool_id,
 *     shape 'subprocess-cross-provider', fallback:false, ok:true, non-null evidence digest.
 *   - the sanctioned claude hunter (in-process-agent + provider claude): a record-inprocess record
 *     (provider claude, via 'epsilon-agent' / shape in-process-agent) with evidence.
 * @returns {{ laneId, attested, observedProvider?, tool_id?, invocation_digest?, evidence_digest?, reason }}
 */
function attestLane(lane, records, opts = {}) {
  // Backward-compat: a bare string 3rd arg is the panel role (the pre-SR-004 signature).
  const { role = "security-reviewer", runId = null, sprintId = null, codeSha = null } =
    typeof opts === "string" ? { role: opts } : opts || {};
  const claudeHunter = lane.shape === "in-process-agent" && lane.provider === "claude";
  // SAME-RUN correlation by RUN IDENTITY (SR-004/SR-011/SR-012): a record attests a lane ONLY if it
  // belongs to THIS run+sprint. Identity is the panel_run_id the runner MINTS (or a run_id) — NOT a
  // time window, which a concurrent same-sprint run could satisfy (SR-011). A NULL requested runId
  // matches nothing — a binding attestation must certify a SPECIFIC run, never historical evidence (SR-012).
  const sameRun = (records || []).filter(
    (r) =>
      r.ok === true &&
      r.fallback === false &&
      (sprintId == null || r.sprint_id === sprintId) &&
      // SR-014: STRICT panel-run identity — the record's panel_run_id must equal the requested run. The
      // prior `|| r.run_id === runId` fallback re-opened SR-011: a DIFFERENT-panel record whose run_id
      // happened to match could attest. A record without the minted panel_run_id cannot prove membership.
      runId != null &&
      r.panel_run_id === runId,
  );
  // SR-013: the record must carry the code_sha it EXECUTED against (persisted at write-time), matching the
  // attested HEAD — never a caller-supplied SHA — AND a non-empty invocation digest (cmdline_checksum).
  const provenanceOk = (r) =>
    typeof r.code_sha === "string" && r.code_sha.length > 0 && (codeSha == null || r.code_sha === codeSha) && !!r.cmdline_checksum;
  let match;
  if (claudeHunter) {
    // The sanctioned hunter (β#3/SR-005): provider claude, in-process, AND the security_claude_hunter
    // ROLE identity. An arbitrary Claude in-process security-reviewer record (no hunter role) does NOT
    // attest the hunter lane — provider===claude alone is insufficient.
    match = sameRun.find(
      (r) =>
        r.provider === "claude" &&
        (r.role === SANCTIONED_HUNTER_ROLE || r.sanctioned_lane_id === SANCTIONED_HUNTER_ROLE) &&
        (r.via === "epsilon-agent" || r.shape === "in-process-agent" || r.record_via === "inprocess") &&
        (r.evidence_sha || r.output_digest) &&
        provenanceOk(r),
    );
  } else {
    // A CLI cross-provider lane: the record must be the PANEL ROLE (security-reviewer) on the contracted
    // provider/tool_id. A design-phase codex consult (different role) must NOT attest a security lane.
    match = sameRun.find(
      (r) =>
        r.role === role &&
        r.provider === lane.provider &&
        r.tool_id === lane.tool_id &&
        r.shape === "subprocess-cross-provider" &&
        !!r.output_digest &&
        provenanceOk(r),
    );
  }
  if (!match) {
    return {
      laneId: lane.laneId,
      attested: false,
      reason: claudeHunter
        ? "no same-run in-process claude-hunter record (provider claude, role security_claude_hunter, record-inprocess, with evidence)"
        : `no same-run CLI record for ${lane.provider}/${lane.tool_id} (role ${role}, fallback:false, output_digest present) — a wrapper claim is NOT proof`,
    };
  }
  return {
    laneId: lane.laneId,
    attested: true,
    observedProvider: match.provider,
    tool_id: match.tool_id || null,
    invocation_digest: match.cmdline_checksum || null, // sanitized invocation digest
    evidence_digest: match.output_digest || match.evidence_sha || null,
    reason: "same-run observed record on the contracted provider (fallback:false + evidence)",
  };
}

/**
 * Attest the whole panel run: every required lane must be same-run attested on its contracted provider.
 * Bundles invocation-digests (cmdline_checksum) + code-SHA (git HEAD) + panel-profile + evidence-digest.
 * PURE given { lanes, records }. `codeSha` is the caller's git HEAD (the live CLI reads it).
 * @param {{ runId?, sprintId, profile:{name}, lanes:Array, records:Array, codeSha? }} args
 */
function attestPanelRun({ runId, sprintId, profile, lanes, records, codeSha, role = "security-reviewer" } = {}) {
  const laneResults = (lanes || []).map((lane) => attestLane(lane, records || [], { role, runId, sprintId, codeSha }));
  const attestedLanes = laneResults.filter((l) => l.attested);
  const allAttested = laneResults.length > 0 && laneResults.every((l) => l.attested);
  // CODE-SHA binding (SR-004/QA-003/SR-013, AC-14): a binding attestation MUST carry the code identity it
  // certifies (read FROM each record, matched to this HEAD in attestLane). A null/absent codeSha cannot
  // bind evidence to a specific build → NOT ok.
  const codeShaBound = typeof codeSha === "string" && codeSha.length > 0;
  // RUN-IDENTITY binding (SR-012): a binding panel attestation must certify a SPECIFIC run — an omitted/
  // empty runId would certify historical same-sprint evidence, which is a false-green. NOT ok without it.
  const runBound = typeof runId === "string" && runId.length > 0;
  const ok = allAttested && codeShaBound && runBound;
  const evidenceDigest = crypto
    .createHash("sha256")
    .update(attestedLanes.map((l) => `${l.laneId}:${l.evidence_digest || ""}`).join("|"))
    .digest("hex");
  return {
    ok,
    profile: (profile && profile.name) || null,
    run_id: runId || null,
    sprint_id: sprintId || null,
    code_sha: codeSha || null,
    invocation_digests: attestedLanes.map((l) => l.invocation_digest).filter(Boolean),
    evidence_digest: evidenceDigest,
    lanes: laneResults,
    reason: !runBound
      ? "no runId supplied — a binding panel attestation must certify a SPECIFIC run (an omitted runId certifies historical evidence) → NOT ok (SR-012)"
      : !allAttested
        ? `unattested required lane(s): ${laneResults.filter((l) => !l.attested).map((l) => l.laneId).join(", ")} — attestation FAILS (a wrapper claim is not proof)`
        : !codeShaBound
          ? "every required lane attested SAME-RUN, but code_sha is absent — a binding attestation must bind to a code SHA (AC-14) → NOT ok"
          : "every required lane attested SAME-RUN on its contracted provider (fallback:false), bound to run_id + code_sha",
  };
}

/** git HEAD SHA via the safe-spawn kernel (read-only git; the model never chooses the exe). */
function gitHeadSha() {
  // QA-012: read HEAD via fs — the SAME provenance source the record WRITER (recordCompletion) uses, so
  // the attestor's HEAD and the persisted code_sha agree. A nested `git` subprocess is EPERM-blocked in
  // the CI/reviewer sandbox (which made this return null → attestPanelRunLive never ok); the fs read works.
  try {
    return require(path.join(ROOT, "scripts", "dispatch", "git-head")).readGitHead(ROOT) || null;
  } catch {
    return null;
  }
}

/** Live panel attestation: read the real ledger + manifest lanes + git HEAD, then attest. */
function attestPanelRunLive({ runId, sprintId, profileName = "panel-2family" } = {}) {
  let lanes;
  try {
    const pl = require(path.join(ROOT, "scripts", "dispatch", "panel-lanes"));
    lanes = pl.requiredLanes(pl.loadManifest(), profileName);
  } catch (e) {
    return { ok: false, reason: `panel-lanes loader failed (fail-closed): ${e.message}`, lanes: [] };
  }
  const records = readLedgerRecords(sprintId, runId);
  return attestPanelRun({ runId, sprintId, profile: { name: profileName }, lanes, records, codeSha: gitHeadSha() });
}

function mainPanel(argv) {
  const get = (flag) => { const i = argv.indexOf(flag); return i !== -1 ? argv[i + 1] : null; };
  const json = argv.includes("--json");
  const sprintId = get("--sprint");
  const runId = get("--run");
  const profileName = get("--profile") || "panel-2family";
  // SR-012: --run is MANDATORY for a binding panel attestation — certifying by --sprint alone would
  // attest historical same-sprint evidence rather than the specific run being certified.
  if (!sprintId || !runId) {
    process.stderr.write("usage: cert-attest.js panel --sprint <id> --run <panel_run_id> [--profile panel-2family|panel-3lab] [--json]\n");
    return 2;
  }
  const out = attestPanelRunLive({ runId, sprintId, profileName });
  if (json) process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  else if (out.ok) process.stdout.write(`ATTESTED [panel] ${profileName} sprint=${sprintId} — every required lane same-run attested on its contracted provider.\n`);
  else process.stderr.write(`FAIL [panel] ${profileName} sprint=${sprintId} — ${out.reason}\n`);
  return out.ok ? 0 : 1;
}

function main(argv) {
  // D8: the panel-attestation subcommand (SP-20260718-003). `cert-attest.js panel --sprint <id> …`.
  if (argv[0] === "panel") return mainPanel(argv.slice(1));
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
module.exports = {
  evaluateAttestation,
  providerForModel,
  probeShape,
  norm,
  NAME,
  // D8 (SP-20260718-003): same-run panel attestation.
  attestLane,
  attestPanelRun,
  attestPanelRunLive,
  readLedgerRecords,
  gitHeadSha,
};
