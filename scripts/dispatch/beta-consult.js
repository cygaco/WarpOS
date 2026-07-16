#!/usr/bin/env node
"use strict";

/**
 * beta-consult.js — the ε→β CLI consult PLUMBING (β item-1; DISPATCH.md §8 L166 / ADR-0016).
 *
 * β flipped to `gpt-5.6-sol` as an on-demand CLI consult per phase boundary. The harness Agent tool is
 * Claude-only, so a GPT-pinned β can NO LONGER be summoned in-process (ADR-0016 "GPT-pin ↔ Agent-tool
 * collision"). Without a CLI reach path, a flipped β is a DARK gate — the verdict is requested but
 * unreachable. THIS is that path: it assembles β's FULL judgment stack + the boundary payload into one
 * context file, dispatches the `beta` role through the canonical cross-provider wrapper
 * (dispatch-agent.js → openai/gpt-5.6-sol per the registry), parses the DECIDE|DIRECTIVE|ESCALATE
 * verdict, and captures the effective-model attestation from the dispatch result (WG-26: a registry-only
 * flip looks green while dispatch stays stale — prove the effective model, not a config diff).
 *
 * β's calibration DEPENDS on the full stack (an under-fed GPT-β is uncalibrated — β item-1 HOW risk):
 * the context carries the persona (beta.md) + judgement-model.md + decision-policy.md + current-stage.md
 * + the recent β precedent (betaEvents) + the boundary payload {boundary, claims, precedent}.
 *
 *   node scripts/dispatch/beta-consult.js --boundary <id> --claims <file|-|inline> \
 *        [--precedent-lines N] [--out <verdict-file>] [--json] [--dry-run]
 *
 * Exit: 0 ok (verdict parsed) · 1 dispatch failed / no verdict · 2 usage / missing judgment-stack file.
 *
 * NOTE: the contract-SHAPE ENFORCER (a check that every consult ALWAYS passes {boundary, claims,
 * precedent}) is ED-eligible per dispatch-brief §7 AC — logged as ED separately. This script HONORS the
 * contract by construction (it refuses to build a context missing the boundary or claims).
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { PATHS, PROJECT } = require("../hooks/lib/paths");

const ROOT = PROJECT || path.resolve(__dirname, "..", "..");
const VERDICTS = Object.freeze(["DECIDE", "DIRECTIVE", "ESCALATE"]);

// β's full judgment stack — the calibration inputs. A missing file is fail-closed (exit 2): an
// under-fed GPT-β is uncalibrated, so we refuse to consult rather than ship a blind verdict.
function judgmentStack() {
  return [
    { label: "PERSONA (beta.md)", file: path.join(ROOT, ".claude/agents/president/beta.md") },
    { label: "JUDGEMENT MODEL", file: path.join(ROOT, ".claude/agents/president/_system/beta/judgement-model.md") },
    { label: "DECISION POLICY", file: PATHS.decisionPolicy },
    { label: "CURRENT STAGE", file: PATHS.currentStage },
  ];
}

function readMaybe(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

/** The last N β precedent events (JSONL), newest last — the precedent slice β reasons from. */
function precedentSlice(n) {
  const raw = readMaybe(PATHS.betaEvents);
  if (!raw) return "(no prior β events on record)";
  const lines = raw.split(/\r?\n/).filter(Boolean);
  return lines.slice(-n).join("\n") || "(no prior β events on record)";
}

/**
 * Build the full context. FAIL-CLOSED on a missing stack file (exit 2) — β must not judge under-fed.
 * The boundary + claims are REQUIRED (the contract): refuse to assemble without them.
 */
function buildContext({ boundary, claims, precedentLines }) {
  // COR-003: whitespace-only is NOT provided — an all-blank boundary/claims must not dispatch an
  // under-fed β. Require non-empty AFTER trim.
  if (!boundary || !boundary.trim() || !claims || !claims.trim()) {
    return { ok: false, reason: "the β-consult contract requires BOTH --boundary and --claims non-empty (an under-specified consult yields a canned verdict)" };
  }
  const parts = [];
  parts.push(
    `# β BOUNDARY CONSULT — assembled by beta-consult.js (CLI reach path for the flipped GPT-β).\n` +
      `You are Alex β. Read your FULL judgment stack below, then render ONE verdict: DECIDE | DIRECTIVE | ESCALATE.\n` +
      `Advise HOW + name risks; do NOT descope a design-locked build. Emit the verdict token on its own line,\n` +
      `prefixed exactly "VERDICT: ", followed by your reasoning.\n`,
  );
  for (const s of judgmentStack()) {
    const body = readMaybe(s.file);
    if (body === null) {
      return { ok: false, reason: `judgment-stack file missing (fail-closed — β must not judge under-fed): ${s.file}` };
    }
    parts.push(`\n\n===== ${s.label} =====\n${body.trim()}`);
  }
  parts.push(`\n\n===== β PRECEDENT (recent events) =====\n${precedentSlice(precedentLines)}`);
  parts.push(
    `\n\n===== THE BOUNDARY PAYLOAD =====\n` +
      `boundary: ${boundary}\n\n` +
      `claims / code to verify:\n${claims}\n`,
  );
  return { ok: true, context: parts.join("") };
}

/** Resolve --claims: a file path, "-" (stdin), or an inline string. */
function resolveClaims(val) {
  if (val === "-") {
    try {
      return fs.readFileSync(0, "utf8");
    } catch {
      return "";
    }
  }
  if (val && fs.existsSync(val)) return readMaybe(val) || "";
  return val || "";
}

/**
 * Extract β's verdict — STRICTLY (SEC-001, backend-reviewer HIGH). Only a dedicated `VERDICT: X` line
 * counts; a bare DECIDE/DIRECTIVE/ESCALATE mentioned anywhere in prose (a refusal, a quotation, a
 * prompt echo, "whether to DECIDE later") is NOT a verdict — the old bare-token fallback was fail-OPEN.
 * Requires EXACTLY ONE distinct verdict across all VERDICT: lines; 0 lines or conflicting/duplicate
 * distinct verdicts → null (no verdict → the consult is not `ok`).
 */
function parseVerdict(output) {
  if (!output) return null;
  // R2 SEC-001: the verdict token must be the ONLY content on its line — an END-OF-LINE anchor after
  // optional trailing whitespace. Without it, "VERDICT: DECIDE or ESCALATE" and "VERDICT: DECIDE /
  // VERDICT: ESCALATE" both matched DECIDE (ambiguous trailing text became a binding verdict).
  const matches = [...String(output).matchAll(/^[ \t>*-]*VERDICT:[ \t]*(DECIDE|DIRECTIVE|ESCALATE)[ \t]*\r?$/gim)].map((m) => m[1].toUpperCase());
  const distinct = [...new Set(matches)];
  return distinct.length === 1 ? distinct[0] : null; // exactly one; reject none / conflicting
}

function main(argv) {
  // COR-003 (backend-reviewer): a flag whose "value" is actually the NEXT option (e.g. `--claims --json`)
  // must read as MISSING, not swallow the following flag — otherwise a malformed invocation dispatches an
  // under-fed β. Return null when the next token is absent or is itself an option (`--…`).
  const get = (flag) => {
    const i = argv.indexOf(flag);
    if (i === -1) return null;
    const v = argv[i + 1];
    return v === undefined || /^--/.test(v) ? null : v; // next token missing or is another option → MISSING
  };
  const boundary = get("--boundary");
  const claimsArg = get("--claims");
  const precedentLines = parseInt(get("--precedent-lines") || "20", 10) || 20;
  const json = argv.includes("--json");
  const dryRun = argv.includes("--dry-run");
  const outFile = get("--out");

  if (!boundary || !claimsArg) {
    process.stderr.write("usage: beta-consult.js --boundary <id> --claims <file|-|inline> [--precedent-lines N] [--out <f>] [--json] [--dry-run]\n");
    return 2;
  }

  const claims = resolveClaims(claimsArg);
  const built = buildContext({ boundary, claims, precedentLines });
  if (!built.ok) {
    process.stderr.write(`beta-consult: ${built.reason}\n`);
    return 2;
  }

  // Persist the context to a real file — dispatch-agent.js consumes a prompt FILE (codex CLI reads
  // stdin from it; a relative path it cannot follow). runtime/ is walk-skipped.
  const dir = path.join(ROOT, "runtime", "beta-consult");
  fs.mkdirSync(dir, { recursive: true });
  const ctxFile = path.join(dir, `${boundary.replace(/[^A-Za-z0-9._-]/g, "_")}-${Date.now()}.md`);
  fs.writeFileSync(ctxFile, built.context);

  if (dryRun) {
    // SHAPE proof without a live spawn: confirm the full stack + the 3-tuple assembled.
    const has = (label) => built.context.includes(label);
    const shapeOk =
      has("PERSONA (beta.md)") && has("JUDGEMENT MODEL") && has("DECISION POLICY") &&
      has("CURRENT STAGE") && has("β PRECEDENT") && has(`boundary: ${boundary}`) && built.context.includes(claims.slice(0, 40));
    const out = { command: "beta-consult", dry_run: true, boundary, context_file: path.relative(ROOT, ctxFile), context_bytes: Buffer.byteLength(built.context), full_stack_assembled: shapeOk };
    process.stdout.write(JSON.stringify(out, null, json ? 2 : 0) + "\n");
    return shapeOk ? 0 : 1;
  }

  // Dispatch `beta` through the canonical cross-provider wrapper (→ openai/gpt-5.6-sol per the registry).
  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts/dispatch-agent.js"), "beta", ctxFile], {
    encoding: "utf8",
    cwd: ROOT,
    maxBuffer: 32 * 1024 * 1024,
    env: process.env,
  });
  const stdout = r.stdout || "";
  let result = null;
  const last = stdout.trim().split("\n").filter(Boolean).pop();
  try {
    result = last ? JSON.parse(last) : null;
  } catch {
    /* not JSON — leave null */
  }
  const agentOutput = (result && (result.output || (result.parsed && JSON.stringify(result.parsed)))) || stdout;
  const verdict = parseVerdict(agentOutput);
  // COR-002 (backend-reviewer HIGH): the ATTESTATION must be OBSERVED, not the requested model echoed.
  // runProvider sets result.actualModel from the CLI (codex reports coarsely; its strict-mode
  // modelsMatch REJECTS a silent downgrade before returning ok:true — so an ok openai result proves the
  // GPT lab served, not a claude fallback). We therefore attest on TWO independent facts: (a) the
  // dispatch ran on provider "openai" and did NOT fall back (the load-bearing WG-26 proof — β reached
  // the GPT lab, not the Claude lane), and (b) the observed model. We DO NOT fall back to result.model
  // (the requested value) — an absent observed model reads as null, never as a false attestation.
  // R2 COR-002: `observedModel` is the model the CLI REPORTED (providers.js now leaves it null for
  // codex/OpenAI, which exposes no served-model header — so it is NEVER the requested value echoed). The
  // load-bearing WG-26 attestation is `ran_on_gpt` (the dispatch ran on provider "openai" and did NOT
  // fall back to the Claude lane) PLUS `requested_model`; strict-mode modelsMatch rejects a family
  // downgrade before ok:true. effective_model stays null when the provider reports none — honest, never faked.
  const observedModel = (result && result.actualModel) || null;
  const requestedModel = (result && result.model) || null;
  const fellBack = !!(result && (result.fallback === true || result.quotaFallbackFrom));
  const ranOnGpt = !!(result && result.provider === "openai" && !fellBack);
  const ok = !!(result && result.ok && verdict && ranOnGpt);
  const effectiveModel = ranOnGpt ? observedModel : null;

  const out = {
    command: "beta-consult",
    boundary,
    context_file: path.relative(ROOT, ctxFile),
    dispatched: !!result,
    ok,
    verdict,
    ran_on_gpt: ranOnGpt, // the load-bearing WG-26 attestation: β reached the GPT lab (not the claude fallback)
    requested_model: requestedModel, // the model REQUESTED of the GPT lab (gpt-5.6-sol); codex reports no served header
    fell_back: fellBack,
    effective_model: effectiveModel, // OBSERVED model (null if not observed / fell back) — never the requested value
    provider: (result && result.provider) || null,
    dispatch_exit: typeof r.status === "number" ? r.status : null,
    error: ok
      ? undefined
      : !result
        ? "β dispatch produced no parseable result"
        : fellBack
          ? `β FELL BACK off the GPT lab (provider=${result.provider}) — not a valid gpt-5.6-sol attestation`
          : result.provider !== "openai"
            ? `β did not run on the GPT lab (provider=${result.provider})`
            : !verdict
              ? "no single 'VERDICT: DECIDE|DIRECTIVE|ESCALATE' line in β output"
              : (result && result.error) || "β consult not ok",
  };
  if (outFile) fs.writeFileSync(path.join(ROOT, outFile), JSON.stringify(out, null, 2));
  process.stdout.write(JSON.stringify(out, null, json ? 2 : 0) + "\n");
  return ok ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { buildContext, parseVerdict, judgmentStack, resolveClaims, VERDICTS };
