#!/usr/bin/env node
"use strict";

/**
 * scripts/checks/higgsfield-spend-gate.js — the Higgsfield render SPEND GATE (S2.2 / R5).
 *
 * Baked at the TOOL BOUNDARY: every /growth render that would call
 * scripts/growth/higgsfield.js#generate MUST clear this gate first. It is a
 * REJECT-not-lint, FAIL-CLOSED enforcer — the $5 autonomy ceiling
 * (CLAUDE.md ## Autonomy: "API calls >= $5 total → Ask first") expressed as a
 * machine check that refuses to spend instead of merely warning.
 *
 * β DECIDE conf 0.90 (EVT-s2-2-hard-halt-higgsfield-spendgate-beta-001):
 *   - PRE-FLIGHT cost check before any generate. Per-op projected
 *       < $5  ⇒ proceed
 *       ≥ $5  ⇒ BLOCK + escalate            (the autonomy ceiling as an enforcer)
 *   - MODE-AWARE fan-out (the gate MUST read the mode):
 *       adhoc   = cap at the largest prefix whose CUMULATIVE projected cost
 *                 stays < $5; defer the rest (park, don't spend).
 *       oneshot = if the FULL projected fan-out ≥ $5, do NOT run a partial
 *                 set — emit arbitration (scripts/arbitration/emit.js,
 *                 owner:"growth_spend_gate", arbitrationNeeded:true) AND require
 *                 a pre-run spend-approval TOKEN (file/env the operator sets);
 *                 refuse to launch until present.
 *       solo    = treated like adhoc (Alpha working directly; same ceiling,
 *                 same cap-then-defer — no oneshot arbitration machinery).
 *
 * Cost source: scripts/growth/higgsfield.js#cost — a LOCAL, deterministic
 * credit table (Higgsfield exposes NO pre-submit cost endpoint; a fail-closed
 * gate must not depend on a network call that can fail-open). An unknown jst
 * makes cost() throw, which this gate treats as a BLOCK (never as $0).
 *
 * Exit codes (CLI):
 *   0  — allowed (the `allowed` op set is safe to render)
 *   1  — blocked (per-op ceiling hit, or oneshot needs approval/arbitration)
 *   2  — internal error (bad input, cost throw, unreadable mode) — fail-closed
 *
 * Usage (CLI):
 *   node scripts/checks/higgsfield-spend-gate.js '<request-json>'
 *     request-json = { "ops": [ { "jst": "...", "input": {...} }, ... ],
 *                      "mode": "adhoc"|"oneshot"|"solo"  (optional; else detected) }
 *   echo '<request-json>' | node scripts/checks/higgsfield-spend-gate.js
 *
 * The decision object (printed as JSON) is also returned by evaluate() for the
 * skills + the bite-test.
 */

const fs = require("fs");
const path = require("path");

const CEILING_USD = 5; // CLAUDE.md ## Autonomy hard ceiling

// Pre-run spend-approval token locations (oneshot only). Either is sufficient.
const APPROVAL_ENV = "HIGGSFIELD_SPEND_APPROVAL";
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const APPROVAL_FILE = path.join(ROOT, "runtime", "growth", "spend-approval.token");

// ── Pluggable deps (real wiring; overridable in the bite-test) ──────────────
function defaultCost(op) {
  // Lazy require so the gate module loads even if growth/ is mid-edit.
  const hf = require("../growth/higgsfield");
  return hf.cost({ jst: op.jst, input: op.input });
}
function defaultMode() {
  const { getMode } = require("../hooks/lib/mode");
  return getMode();
}
function defaultEmit(rec) {
  const { emit } = require("../arbitration/emit");
  return emit(rec);
}
function defaultApprovalPresent() {
  if (process.env[APPROVAL_ENV] && String(process.env[APPROVAL_ENV]).trim()) return true;
  try {
    return fs.existsSync(APPROVAL_FILE) && fs.readFileSync(APPROVAL_FILE, "utf8").trim().length > 0;
  } catch {
    return false;
  }
}

// ── Core evaluation ─────────────────────────────────────────────────────────
/**
 * Evaluate a render request against the spend gate.
 *
 * @param {object} req
 * @param {Array<{jst:string,input?:object}>} req.ops  one entry per render op
 * @param {string} [req.mode]   "adhoc"|"oneshot"|"solo" — overrides detection
 * @param {string} [req.unit]   arbitration unit label (oneshot escalation)
 * @param {object} [deps]       TEST SEAM — { cost, mode, emit, approvalPresent }
 * @returns {{ decision, exitCode, mode, ceilingUsd, allowed, deferred, blocked,
 *             totalUsd, allowedUsd, arbitration?, reason }}
 *   decision ∈ "allow" | "block"
 *   allowed  — ops cleared to render (possibly a prefix of ops, possibly [])
 *   deferred — ops parked for later (adhoc/solo over-cap tail)
 *   blocked  — ops individually ≥ ceiling (can never run autonomously)
 */
function evaluate(req = {}, deps = {}) {
  const costFn = deps.cost || defaultCost;
  const modeFn = deps.mode || defaultMode;
  const emitFn = deps.emit || defaultEmit;
  const approvalFn = deps.approvalPresent || defaultApprovalPresent;

  const ops = Array.isArray(req.ops) ? req.ops : null;
  if (!ops || ops.length === 0) {
    return errorResult("higgsfield-spend-gate: request has no `ops[]` to evaluate");
  }

  const mode = (req.mode || modeFn() || "solo").toLowerCase();

  // 1. Price every op (fail-closed: a throw → internal error / block).
  const priced = [];
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (!op || !op.jst) {
      return errorResult(`higgsfield-spend-gate: ops[${i}] missing required \`jst\``);
    }
    let c;
    try {
      c = costFn(op);
    } catch (e) {
      // Unknown jst / bad input ⇒ cannot price ⇒ refuse (never assume $0).
      return errorResult(`higgsfield-spend-gate: cannot price ops[${i}] (${op.jst}): ${String(e.message || e)}`);
    }
    if (!c || typeof c.usd !== "number" || !Number.isFinite(c.usd)) {
      return errorResult(`higgsfield-spend-gate: cost() returned no usable usd for ops[${i}] (${op.jst})`);
    }
    priced.push({ idx: i, op, usd: c.usd, credits: c.credits, jst: op.jst });
  }

  const totalUsd = round2(priced.reduce((s, p) => s + p.usd, 0));

  // 2. Per-op ceiling: any single op ≥ $5 can NEVER run autonomously.
  //    These are surfaced separately and are NEVER admitted (not even in the
  //    oneshot-with-approval path — a single ≥$5 op is the hard ceiling itself).
  const overCeiling = priced.filter((p) => p.usd >= CEILING_USD);
  const eligible = priced.filter((p) => p.usd < CEILING_USD);

  if (mode === "oneshot") {
    return evaluateOneshot({ req, priced, totalUsd, overCeiling, eligible, mode, emitFn, approvalFn });
  }
  // adhoc + solo: cap-then-defer.
  return evaluateCapAndDefer({ priced, totalUsd, overCeiling, eligible, mode });
}

/**
 * adhoc / solo: admit the largest leading prefix of ELIGIBLE ops whose
 * CUMULATIVE cost stays < $5; defer the rest. Per-op ≥$5 ops are blocked.
 * Ops are considered in their submitted order (the skill orders by priority).
 */
function evaluateCapAndDefer({ priced, totalUsd, overCeiling, eligible, mode }) {
  const allowed = [];
  const deferred = [];
  let running = 0;
  for (const p of eligible) {
    if (round2(running + p.usd) < CEILING_USD) {
      allowed.push(p);
      running = round2(running + p.usd);
    } else {
      deferred.push(p);
    }
  }
  // Over-ceiling ops are deferred-as-blocked (cannot run without escalation).
  for (const p of overCeiling) deferred.push(p);

  const allowedUsd = round2(allowed.reduce((s, p) => s + p.usd, 0));
  const decision = allowed.length > 0 ? "allow" : "block";
  const reasonBits = [];
  if (deferred.length) reasonBits.push(`${deferred.length} deferred (cap < $${CEILING_USD})`);
  if (overCeiling.length) reasonBits.push(`${overCeiling.length} blocked (single op ≥ $${CEILING_USD})`);
  return finalize({
    decision,
    exitCode: decision === "allow" ? 0 : 1,
    mode,
    allowed,
    deferred,
    blocked: overCeiling,
    totalUsd,
    allowedUsd,
    reason:
      decision === "allow"
        ? `${allowed.length} op(s) cleared at $${allowedUsd} (< $${CEILING_USD} cap)${reasonBits.length ? "; " + reasonBits.join("; ") : ""}`
        : `nothing cleared: ${reasonBits.join("; ") || "all ops over cap/ceiling"}`,
  });
}

/**
 * oneshot: the FULL fan-out is judged as a unit.
 *   - full total < $5 AND no single op ≥ $5  ⇒ allow the whole set.
 *   - full total ≥ $5 (or any single op ≥ $5) ⇒ do NOT run a partial set:
 *       emit arbitration (fail-closed park) AND require a pre-run approval
 *       token. Only when the token is present do we allow the full set;
 *       otherwise BLOCK and refuse to launch.
 */
function evaluateOneshot({ req, priced, totalUsd, overCeiling, eligible, mode, emitFn, approvalFn }) {
  const fullUnder = totalUsd < CEILING_USD && overCeiling.length === 0;
  if (fullUnder) {
    return finalize({
      decision: "allow",
      exitCode: 0,
      mode,
      allowed: priced,
      deferred: [],
      blocked: [],
      totalUsd,
      allowedUsd: totalUsd,
      reason: `oneshot full fan-out cleared at $${totalUsd} (< $${CEILING_USD}, no single op ≥ ceiling)`,
    });
  }

  // Full fan-out hits the ceiling. NO partial set in oneshot.
  const unit = req.unit || "growth_render_fanout";
  const approved = approvalFn();

  // Always record the arbitration park (fail-closed) so the run-end resolver
  // sees the spend escalation even when an approval token later clears it.
  let arbitration = null;
  try {
    arbitration = emitFn({
      unit,
      owner: "growth_spend_gate",
      decision: approved
        ? `oneshot fan-out $${totalUsd} ≥ $${CEILING_USD} — pre-run spend-approval token PRESENT; full set authorized`
        : `oneshot fan-out $${totalUsd} ≥ $${CEILING_USD} — BLOCKED pending pre-run spend-approval token`,
      rationale: `oneshot must not run a partial render set; full projected spend $${totalUsd} crosses the $${CEILING_USD} autonomy ceiling (${priced.length} ops${overCeiling.length ? `, ${overCeiling.length} individually ≥ ceiling` : ""}). Set ${APPROVAL_ENV} or write ${APPROVAL_FILE} to authorize.`,
      precedenceBasis: "CLAUDE.md ## Autonomy — API calls ≥ $5 require approval",
      confidence: 0.9,
      // approved ⇒ resolved (no park); not approved ⇒ fail-closed park.
      arbitrationNeeded: !approved,
      artifactPrecedence: 90,
    });
  } catch (e) {
    // If we cannot even record the escalation, fail-closed: block.
    return errorResult(`higgsfield-spend-gate: oneshot escalation emit() failed: ${String(e.message || e)}`);
  }

  if (approved) {
    return finalize({
      decision: "allow",
      exitCode: 0,
      mode,
      allowed: priced,
      deferred: [],
      blocked: [],
      totalUsd,
      allowedUsd: totalUsd,
      arbitration,
      reason: `oneshot full fan-out $${totalUsd} authorized by pre-run spend-approval token`,
    });
  }

  return finalize({
    decision: "block",
    exitCode: 1,
    mode,
    allowed: [],
    deferred: priced, // whole set parked, NOT partially run
    blocked: overCeiling,
    totalUsd,
    allowedUsd: 0,
    arbitration,
    reason: `oneshot full fan-out $${totalUsd} ≥ $${CEILING_USD} — refusing to launch a partial set; arbitration emitted (${arbitration.id}) and a pre-run spend-approval token is required (${APPROVAL_ENV} or ${APPROVAL_FILE})`,
  });
}

// ── Result shaping ──────────────────────────────────────────────────────────
function round2(n) {
  return Math.round(n * 100) / 100;
}

function summarizeOps(list) {
  return list.map((p) => ({ idx: p.idx, jst: p.jst, usd: p.usd, credits: p.credits }));
}

function finalize(r) {
  return {
    ...r,
    ceilingUsd: CEILING_USD,
    allowed: summarizeOps(r.allowed),
    deferred: summarizeOps(r.deferred),
    blocked: summarizeOps(r.blocked),
  };
}

function errorResult(message) {
  return {
    decision: "block",
    exitCode: 2,
    mode: null,
    ceilingUsd: CEILING_USD,
    allowed: [],
    deferred: [],
    blocked: [],
    totalUsd: 0,
    allowedUsd: 0,
    error: message,
    reason: message,
  };
}

module.exports = {
  evaluate,
  CEILING_USD,
  APPROVAL_ENV,
  APPROVAL_FILE,
};

// ── CLI ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
  readInput()
    .then((raw) => {
      let req;
      try {
        req = JSON.parse(raw);
      } catch (e) {
        const r = errorResult(`higgsfield-spend-gate: bad request JSON: ${e.message}`);
        process.stdout.write(JSON.stringify(r, null, 2) + "\n");
        process.exit(r.exitCode);
      }
      const result = evaluate(req);
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
      process.exit(result.exitCode);
    })
    .catch((e) => {
      const r = errorResult(`higgsfield-spend-gate: ${String(e.message || e)}`);
      process.stderr.write(JSON.stringify(r, null, 2) + "\n");
      process.exit(r.exitCode);
    });
}

/** Read the request from argv[2] or stdin. */
function readInput() {
  return new Promise((resolve, reject) => {
    const arg = process.argv[2];
    if (arg) return resolve(arg);
    let buf = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (d) => (buf += d));
    process.stdin.on("end", () => resolve(buf.trim()));
    process.stdin.on("error", reject);
    // No stdin attached → no input.
    setTimeout(() => {
      if (!buf) reject(new Error("no request provided (argv or stdin)"));
    }, 200).unref();
  });
}
