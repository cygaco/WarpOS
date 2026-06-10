#!/usr/bin/env node
/**
 * scripts/turbo/spend-ledger.js — Turbo session SPEND LEDGER + ceiling (S-LC-07 WORK §1).
 *
 * Tracks REAL cross-provider API spend — the paid `dispatch-agent.js` → GPT/Gemini
 * calls recorded in `paths.dispatchCompletionsFile`
 * (`.claude/runtime/dispatch-completions.jsonl`). It does NOT use the heuristic
 * per-phase cost counter in `scripts/sprint/full.js` (that estimator is toggled
 * off and is planning-time, not grounded in real dispatches).
 *
 * "REAL" = grounded in actual completion records (a call that demonstrably ran on
 * a metered provider), not that the dollar figure is penny-precise. The USD value
 * is ESTIMATED from recorded prompt/output bytes via a documented token model.
 *
 * ── CEILING LAYERING (β RESIDUAL 1 — source-vs-instance, P-058) ───────────────
 *   - Framework DEFAULT  = $100   (the SOURCE constant; NEVER hardcode $500).
 *   - Operator-RAISABLE  = the runtime override in `authorization.json`
 *                          (`spend_ceiling_usd`). This session = $500.
 *   Reading the wrong field over-permits ($500 baked as the floor) or
 *   under-permits ($100 when the operator granted $500). `resolveCeiling()`
 *   reads the runtime override IF present+valid, ELSE the framework default.
 *
 * ── REPORT-ONLY ───────────────────────────────────────────────────────────────
 *   This ledger NEVER blocks work. It emits budget-approach warnings (≥80% of
 *   ceiling) and under-budget notices. The REAL gates are the $5 CLAUDE.md
 *   per-op autonomy line (enforced at the tool boundary, e.g. higgsfield-spend-gate)
 *   and the operator-set session ceiling reviewed by the operator. Fail-open on
 *   any ledger fault — a ledger error must never stall the build.
 *
 * CLI:
 *   node scripts/turbo/spend-ledger.js            # human report
 *   node scripts/turbo/spend-ledger.js --json     # machine envelope
 *
 * Exit code is ALWAYS 0 (report-only). Consumers that want a gate must opt in.
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ── Constants ────────────────────────────────────────────────────────────────

// SOURCE default. Do NOT replace with the per-session instance value ($500).
const FRAMEWORK_DEFAULT_CEILING_USD = 100;

// Budget-approach warning fires at this fraction of the resolved ceiling.
const WARN_THRESHOLD_PCT = 0.8;

// Metered cross-provider providers. `claude` runs on the Claude Code
// subscription seat, NOT a per-call metered API, so it is NOT ledgered here.
const PAID_PROVIDERS = new Set(["openai", "gemini"]);

// Rough bytes→tokens divisor (English text ≈ 4 bytes/token).
const BYTES_PER_TOKEN = 4;

// ESTIMATED per-million-token rates (input, output). These are deliberately
// coarse — the ledger's job is to ground spend in REAL dispatch events, not to
// be a billing system. Tune from real provider invoices when available.
const PRICE_TABLE = {
  "gpt-5.5": { inUsdPerM: 1.25, outUsdPerM: 10 },
  "gpt-5": { inUsdPerM: 1.25, outUsdPerM: 10 },
  "gemini-3.1-pro-preview": { inUsdPerM: 1.25, outUsdPerM: 5 },
  "gemini-3.1-pro": { inUsdPerM: 1.25, outUsdPerM: 5 },
  // Conservative fallback for an unknown model — never assume $0.
  _default: { inUsdPerM: 2, outUsdPerM: 8 },
};

// ── PATHS resolution (best-effort; overridable for tests) ────────────────────
function resolveProject() {
  return path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
}

function loadPaths(project) {
  try {
    const raw = JSON.parse(
      fs.readFileSync(path.join(project, ".claude", "paths.json"), "utf8"),
    );
    return Object.fromEntries(
      Object.entries(raw)
        .filter(([k]) => k !== "version" && k !== "$schema")
        .map(([k, v]) => [k, path.join(project, v)]),
    );
  } catch {
    return {};
  }
}

function defaultCompletionsFile(project, PATHS) {
  return (
    PATHS.dispatchCompletionsFile ||
    path.join(project, ".claude", "runtime", "dispatch-completions.jsonl")
  );
}

function defaultAuthFile(project, PATHS) {
  const runtime =
    PATHS.runtime || path.join(project, ".claude", "runtime");
  return path.join(runtime, "authorization.json");
}

// ── Ceiling resolution (the source-vs-instance core) ─────────────────────────
/**
 * Resolve the active spend ceiling. Reads the operator-raised runtime override
 * from authorization.json (`spend_ceiling_usd`) when present and valid; else
 * falls back to the framework DEFAULT. NEVER hardcodes the instance value.
 *
 * @param {object|null} auth  parsed authorization.json (or null)
 * @returns {{ ceilingUsd:number, source:"runtime-override"|"framework-default" }}
 */
function resolveCeiling(auth) {
  if (
    auth &&
    typeof auth.spend_ceiling_usd === "number" &&
    Number.isFinite(auth.spend_ceiling_usd) &&
    auth.spend_ceiling_usd > 0
  ) {
    return { ceilingUsd: auth.spend_ceiling_usd, source: "runtime-override" };
  }
  return {
    ceilingUsd: FRAMEWORK_DEFAULT_CEILING_USD,
    source: "framework-default",
  };
}

// ── Cost estimation for one completion record ────────────────────────────────
function estimateRecordCost(rec) {
  const provider = String(rec.provider || "").toLowerCase();
  if (!PAID_PROVIDERS.has(provider)) return null; // claude / unknown → not metered
  // exit_code 0 (ok) only — a failed call that produced no provider output is
  // best treated as no-charge for a report-only ledger.
  if (rec.exit_code != null && rec.exit_code !== 0) return null;
  const model = String(rec.model || "").toLowerCase();
  const price = PRICE_TABLE[model] || PRICE_TABLE._default;
  const inBytes = Number(rec.prompt_bytes) || 0;
  const outBytes = Number(rec.stdout_bytes) || 0;
  const inTokens = inBytes / BYTES_PER_TOKEN;
  const outTokens = outBytes / BYTES_PER_TOKEN;
  const usd =
    (inTokens / 1e6) * price.inUsdPerM + (outTokens / 1e6) * price.outUsdPerM;
  return {
    provider,
    model: rec.model || null,
    usd: round4(usd),
    inBytes,
    outBytes,
  };
}

// ── Compute the ledger ───────────────────────────────────────────────────────
/**
 * @param {object} [opts]
 * @param {string} [opts.completionsFile]  override the dispatch-completions path
 * @param {string} [opts.authFile]         override the authorization.json path
 * @param {object} [opts.authOverride]     inject a parsed auth object (tests)
 * @returns {{ reportOnly:true, spentUsd, ceilingUsd, ceilingSource, pct,
 *             overCeiling, calls, byProvider, warnings, notices, sinceIso,
 *             error? }}  — NEVER throws.
 */
function computeLedger(opts = {}) {
  try {
    const project = resolveProject();
    const PATHS = loadPaths(project);
    const completionsFile =
      opts.completionsFile || defaultCompletionsFile(project, PATHS);
    const authFile = opts.authFile || defaultAuthFile(project, PATHS);

    // 1. Resolve ceiling from the runtime override (or framework default).
    let auth = opts.authOverride || null;
    if (!auth) {
      try {
        auth = JSON.parse(fs.readFileSync(authFile, "utf8"));
      } catch {
        auth = null; // no/unreadable auth → framework default
      }
    }
    const { ceilingUsd, source: ceilingSource } = resolveCeiling(auth);

    // 2. Session-scope: count records since the turbo grant when present.
    const sinceIso =
      auth && typeof auth.granted_at === "string" ? auth.granted_at : null;
    const sinceMs = sinceIso ? new Date(sinceIso).getTime() : null;

    // 3. Sum metered spend from real completion records (fail-open per line).
    let raw = "";
    try {
      raw = fs.readFileSync(completionsFile, "utf8");
    } catch {
      raw = ""; // no ledger file yet → $0 spend, no warnings
    }

    const byProvider = {};
    let spentUsd = 0;
    let calls = 0;
    if (raw) {
      for (const line of raw.split("\n")) {
        if (!line.trim()) continue;
        let rec;
        try {
          rec = JSON.parse(line);
        } catch {
          continue; // malformed line — skip, never crash (fail-open)
        }
        if (Number.isFinite(sinceMs)) {
          const t = new Date(rec.completed_at || rec.started_at || 0).getTime();
          if (Number.isFinite(t) && t < sinceMs) continue; // before this session
        }
        const cost = estimateRecordCost(rec);
        if (!cost) continue;
        spentUsd = round4(spentUsd + cost.usd);
        calls++;
        const key = cost.provider;
        byProvider[key] = byProvider[key] || { calls: 0, usd: 0 };
        byProvider[key].calls++;
        byProvider[key].usd = round4(byProvider[key].usd + cost.usd);
      }
    }

    const pct = ceilingUsd > 0 ? spentUsd / ceilingUsd : 0;
    const overCeiling = spentUsd >= ceilingUsd;

    // 4. Report-only warnings + notices.
    const warnings = [];
    const notices = [];
    if (overCeiling) {
      warnings.push(
        `OVER CEILING (report-only): est $${spentUsd.toFixed(2)} ≥ $${ceilingUsd.toFixed(
          2,
        )} (${ceilingSource}). Review spend — the $5/op gate + the session ceiling are the real gates.`,
      );
    } else if (pct >= WARN_THRESHOLD_PCT) {
      warnings.push(
        `Budget-approach warning (report-only): est $${spentUsd.toFixed(
          2,
        )} is ${(pct * 100).toFixed(0)}% of the $${ceilingUsd.toFixed(
          2,
        )} ceiling (${ceilingSource}).`,
      );
    } else {
      notices.push(
        `Under budget: est $${spentUsd.toFixed(2)} of $${ceilingUsd.toFixed(
          2,
        )} (${(pct * 100).toFixed(0)}%, ${ceilingSource}).`,
      );
    }

    return {
      reportOnly: true,
      spentUsd: round2(spentUsd),
      ceilingUsd,
      ceilingSource,
      pct: round4(pct),
      overCeiling,
      calls,
      byProvider,
      warnings,
      notices,
      sinceIso,
    };
  } catch (e) {
    // Total fail-open: any unexpected fault → a benign, non-blocking report.
    return {
      reportOnly: true,
      spentUsd: 0,
      ceilingUsd: FRAMEWORK_DEFAULT_CEILING_USD,
      ceilingSource: "framework-default",
      pct: 0,
      overCeiling: false,
      calls: 0,
      byProvider: {},
      warnings: [],
      notices: [`ledger fault (fail-open): ${String(e.message || e)}`],
      sinceIso: null,
      error: String(e.message || e),
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function round2(n) {
  return Math.round(n * 100) / 100;
}
function round4(n) {
  return Math.round(n * 10000) / 10000;
}

// ── Render ───────────────────────────────────────────────────────────────────
function renderReport(led) {
  const lines = [
    "turbo spend ledger (REPORT-ONLY)",
    "",
    `  spent (est):   $${led.spentUsd.toFixed(2)}`,
    `  ceiling:       $${led.ceilingUsd.toFixed(2)} (${led.ceilingSource})`,
    `  utilization:   ${(led.pct * 100).toFixed(0)}%`,
    `  paid calls:    ${led.calls}`,
  ];
  if (led.sinceIso) lines.push(`  session since: ${led.sinceIso}`);
  const provs = Object.keys(led.byProvider);
  if (provs.length) {
    lines.push("  by provider:");
    for (const p of provs) {
      const b = led.byProvider[p];
      lines.push(`    ${p}: ${b.calls} call(s), est $${b.usd.toFixed(2)}`);
    }
  }
  if (led.warnings.length) {
    lines.push("", "  warnings:");
    for (const w of led.warnings) lines.push(`    ! ${w}`);
  }
  if (led.notices.length) {
    lines.push("", "  notices:");
    for (const n of led.notices) lines.push(`    - ${n}`);
  }
  lines.push(
    "",
    "  (report-only — the $5/op CLAUDE.md line + the operator session ceiling are the real gates)",
  );
  return lines.join("\n");
}

module.exports = {
  FRAMEWORK_DEFAULT_CEILING_USD,
  WARN_THRESHOLD_PCT,
  PAID_PROVIDERS,
  PRICE_TABLE,
  resolveCeiling,
  estimateRecordCost,
  computeLedger,
  renderReport,
};

// ── CLI ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const json = process.argv.includes("--json");
  const led = computeLedger();
  if (json) {
    process.stdout.write(JSON.stringify(led, null, 2) + "\n");
  } else {
    process.stdout.write(renderReport(led) + "\n");
  }
  process.exit(0); // ALWAYS 0 — report-only.
}
