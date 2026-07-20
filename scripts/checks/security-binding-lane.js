#!/usr/bin/env node
"use strict";
/**
 * security-binding-lane (SP-20260720-003 D2) — closes ED-244 + RI-008.
 *
 * ED-244: ADR-0031 point-2 requires the security-reviewer/redteam BINDING verdict to resolve to a
 * VERIFIABLE provider (openai|claude), never the unverifiable agy lane, while ED-230 (served-model proof)
 * is open. There was NO enforcer of this — the invariant held only because agy is blocked-advisory. DoE +
 * β confirmed the CORRECT invariant is the PANEL BINDING invariant (NOT DEFAULT_PROVIDER ∈ {openai,claude},
 * which would fight ADR-0031 point-3 + trip model-chain drift + miss the multi-pass path). While ED-230 is
 * open, assert (reusing the runtime's OWN functions so the check can't drift from behavior):
 *   P1: servedModelUnverifiableFromRecord("antigravity") === true  (the choke-point that forces an agy
 *       record un-attestable → BLOCKED_ON_OPERATOR, never a binding PASS).
 *   P2: the panel-2family FLOOR requires ≥2 verifiable families (agy NOT a required lane; binding:false).
 *   P3: passesOf("security-reviewer") contains ≥1 verifiable (openai|claude) pass — a lane that CAN bind.
 *
 * RI-008: catalog↔providers DEFAULT_PROVIDER consistency INCLUDING the redteam ALIAS key — the gap
 * model-chain's registry-NAME-only drift loop misses. Tooth-B:
 *   (1) catalog-raw[redteam] === providers-raw[redteam]  (raw-map agreement; future-drift teeth).
 *   (2) getProviderForRole(redteam) === getProviderForRole(security-reviewer)  (redteam is a 1-hop alias;
 *       normalization must keep them identical, so redteam can never resolve to a divergent provider).
 *
 * AC-14 creep-back guard: RED if any NON-TEST, non-panel caller routes security-reviewer as a single-pass
 * binding dispatch (bypassing dispatch-review's panel gate) — makes "no such caller today" DURABLE.
 *
 * BLOCKING in scan:full. Exit: 0 clean · 1 findings · 2 fail-closed (unparseable INJECTED input only —
 * an absent/unreadable CANONICAL ledger resolves to STRICT-ENFORCE, not exit 2, per QL).
 */

const fs = require("fs");
const path = require("path");

const NAME = "security-binding-lane";
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const VERIFIABLE = new Set(["openai", "claude"]);
const SCRIPTS_DIR = path.join(ROOT, "scripts");

// ── real dependency wiring (injectable in tests) ─────────────────────────────────
function realDeps() {
  const pv = require("../dispatch/provenance-verifier");
  const rr = require("../dispatch/registry-roles");
  const panelLanes = require("../dispatch/panel-lanes");
  const providers = require("../hooks/lib/providers");
  const catalog = require("../dispatch/catalog");
  const { PATHS } = require("../hooks/lib/paths");
  return {
    // AC-13 KNOWN-LIMIT (regression-lock): servedModelUnverifiableFromRecord is NAME-SPECIFIC — it keys on
    // provider === "antigravity" (provenance-verifier). A NEW unverifiable provider, or an agy rename, would
    // pass P1 GREEN while the invariant ("no unverifiable provider binds") is violated. Documented in the .md;
    // out of scope to fix here. Do NOT let this call drift to a name-list that silently omits a new provider.
    servedModelUnverifiableFromRecord: pv.servedModelUnverifiableFromRecord,
    passesOf: rr.passesOf,
    panel2family: () => {
      const m = panelLanes.loadManifest();
      const prof = (m.profiles || {})["panel-2family"] || {};
      const lanes = panelLanes.requiredLanes(m, "panel-2family");
      return { binding: prof.binding, min_families: prof.min_families, lanes };
    },
    getProviderForRole: providers.getProviderForRole,
    providersRaw: providers.DEFAULT_AGENT_PROVIDERS || {},
    catalogRaw: catalog.DEFAULT_PROVIDER_PER_ROLE || {},
    enforcementDebtPath: PATHS.enforcementDebt,
  };
}

// ── ED-230 record-trust gate (fail-closed + closure-receipt) ─────────────────────
/**
 * Is ED-230 OPEN? FAIL-CLOSED: an unreadable/missing/empty ledger, no ED-230 record, a malformed record,
 * or a status:"closed" WITHOUT a non-empty closure receipt → OPEN (strict enforcement). Relax (open:false)
 * ONLY on the LAST-write-wins ED-230 record with status "closed" AND a non-empty closure_receipt/closed_ts.
 */
function ed230IsOpen(ledgerText) {
  if (typeof ledgerText !== "string" || ledgerText.trim() === "") {
    return { open: true, reason: "ledger absent/empty → assume OPEN (fail-closed)" };
  }
  let last = null;
  for (const line of ledgerText.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    let rec;
    try {
      rec = JSON.parse(t);
    } catch {
      continue; // a malformed line never relaxes; skip it
    }
    if (rec && rec.id === "ED-230") last = rec; // LAST-write-wins (append-only JSONL)
  }
  if (!last) return { open: true, reason: "no ED-230 record in a non-empty ledger → assume OPEN (fail-closed)" };
  const closed = last.status === "closed";
  const receiptRaw = last.closure_receipt != null ? last.closure_receipt : last.closed_ts;
  const hasReceipt = typeof receiptRaw === "string" ? receiptRaw.trim() !== "" : receiptRaw != null && receiptRaw !== false;
  if (closed && hasReceipt) return { open: false, reason: "ED-230 status=closed WITH a closure receipt → relaxed" };
  return {
    open: true,
    reason: closed ? "ED-230 status=closed but receipt-less/empty → stay strict" : `ED-230 status=${last.status || "(none)"} → OPEN`,
  };
}

// ── AC-14 single-pass creep-back guard ────────────────────────────────────────────
/**
 * RED if any NON-TEST, non-panel-path caller routes security-reviewer as a single-pass binding dispatch
 * (a `dispatch-agent(.js)? security-reviewer` invocation that would resolve getProviderForRole=antigravity,
 * bypassing dispatch-review's panel gate). Injectable `files` ({ [relPath]: content }) for tests; default
 * walks scripts/ excluding *.test.js, dispatch-review.js (the SANCTIONED multi-pass path), and this file.
 */
const SINGLE_PASS_BINDING_RE = /dispatch-agent(?:\.js)?["'\s]+security-reviewer/;
function singlePassBindingCallers({ files } = {}) {
  const src = files || walkScriptsForCallers();
  const hits = [];
  for (const [rel, content] of Object.entries(src)) {
    if (typeof content !== "string") continue;
    if (SINGLE_PASS_BINDING_RE.test(content)) hits.push(rel);
  }
  return hits;
}
function walkScriptsForCallers() {
  const out = {};
  const EXCLUDE = /(\.test\.js$)|(dispatch-review\.js$)|(security-binding-lane\.js$)/;
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name.startsWith(".")) continue;
        walk(full);
      } else if (e.name.endsWith(".js") && !EXCLUDE.test(full)) {
        try {
          out[path.relative(ROOT, full)] = fs.readFileSync(full, "utf8");
        } catch {
          /* skip unreadable */
        }
      }
    }
  };
  walk(SCRIPTS_DIR);
  return out;
}

// ── the core (PURE given its seams) ───────────────────────────────────────────────
/**
 * @param {object} opts { deps, ledgerText, files }
 * @returns {{ errors:string[], ed230:{open,reason} }}
 */
function evaluateSecurityBindingLane({ deps = realDeps(), ledgerText, files } = {}) {
  const errors = [];
  const ed230 = ed230IsOpen(ledgerText);

  // ── Tooth-A (ED-244) — only enforced WHILE ED-230 is open ──
  if (ed230.open) {
    // P1
    let p1;
    try {
      p1 = deps.servedModelUnverifiableFromRecord("antigravity") === true;
    } catch (e) {
      p1 = false;
    }
    if (!p1) {
      errors.push(
        `${NAME}: BINDING-LANE (P1) — the agy (antigravity) served-model is NOT forced un-attestable ` +
          `(servedModelUnverifiableFromRecord("antigravity") !== true) while ED-230 is open. An agy lane could ` +
          `then carry the binding security verdict — the exact unverifiable-binding risk ADR-0031 point-2 forbids. ` +
          `FIX: the binding verdict must resolve to a verifiable lane (openai|claude); keep agy un-attestable until ED-230 closes.`,
      );
    }
    // P2
    try {
      const p2 = deps.panel2family();
      const lanes = p2.lanes || [];
      const nonAgy = lanes.filter((l) => l.provider !== "antigravity");
      if (p2.binding === true) {
        errors.push(`${NAME}: BINDING-LANE (P2) — panel-2family is the degraded FLOOR and must be binding:false (found binding:true). FIX: the floor must never be the sole binding contract.`);
      }
      if ((p2.min_families || 0) < 2 || nonAgy.length < 2 || nonAgy.length !== lanes.length) {
        errors.push(
          `${NAME}: BINDING-LANE (P2) — the panel-2family floor must require ≥2 VERIFIABLE families (agy not a ` +
            `required lane). Found required lanes [${lanes.map((l) => `${l.laneId}:${l.provider}`).join(", ")}], ` +
            `min_families=${p2.min_families}. FIX: the binding floor must resolve to verifiable lanes only.`,
        );
      }
    } catch (e) {
      errors.push(`${NAME}: BINDING-LANE (P2) — could not read the panel-2family floor profile: ${e.message}. FIX: restore the panel manifest's panel-2family (non-agy, ≥2 families).`);
    }
    // P3
    try {
      const passes = deps.passesOf("security-reviewer") || [];
      const verifiable = passes.filter((p) => VERIFIABLE.has(p.provider));
      if (verifiable.length < 1) {
        errors.push(
          `${NAME}: BINDING-LANE (P3) — passesOf("security-reviewer") has NO verifiable (openai|claude) pass ` +
            `[${passes.map((p) => p.provider).join(", ")}] — the binding verdict has no lane that CAN bind on a ` +
            `verifiable provider. FIX: keep a verifiable pass (the GPT/Claude passes) in the security-reviewer chain.`,
        );
      }
    } catch (e) {
      errors.push(`${NAME}: BINDING-LANE (P3) — could not read passesOf("security-reviewer"): ${e.message}.`);
    }
  }

  // ── Tooth-B (RI-008) — alias-inclusive DEFAULT_PROVIDER consistency (always checked) ──
  const catR = deps.catalogRaw || {};
  const provR = deps.providersRaw || {};
  if (catR.redteam !== provR.redteam) {
    errors.push(
      `${NAME}: ALIAS-CONSISTENCY (RI-008.1) — the raw DEFAULT_PROVIDER maps disagree on the redteam alias: ` +
        `catalog="${catR.redteam}" vs providers="${provR.redteam}". model-chain's registry-NAME-only drift loop ` +
        `misses alias keys. FIX: reconcile the redteam literal so catalog-raw and providers-raw agree.`,
    );
  }
  try {
    const a = deps.getProviderForRole("redteam");
    const b = deps.getProviderForRole("security-reviewer");
    if (a !== b) {
      errors.push(
        `${NAME}: ALIAS-CONSISTENCY (RI-008.2) — getProviderForRole("redteam")="${a}" ≠ ` +
          `getProviderForRole("security-reviewer")="${b}". redteam is a 1-hop alias and MUST normalize to ` +
          `security-reviewer's provider (so it can never resolve to a divergent, possibly-unverifiable lane). ` +
          `FIX: restore the redteam→security-reviewer normalization before the provider lookup.`,
      );
    }
  } catch (e) {
    errors.push(`${NAME}: ALIAS-CONSISTENCY (RI-008.2) — getProviderForRole failed: ${e.message}.`);
  }

  // ── AC-14 creep-back guard ──
  const callers = singlePassBindingCallers({ files });
  for (const c of callers) {
    errors.push(
      `${NAME}: SINGLE-PASS CREEP-BACK — non-test caller "${c}" routes security-reviewer as a single-pass ` +
        `dispatch (dispatch-agent … security-reviewer), bypassing dispatch-review's panel gate → the binding ` +
        `verdict could resolve getProviderForRole=antigravity directly. FIX: route security-reviewer through ` +
        `dispatch-review.js (multi-pass panel gate), never a single-pass dispatch-agent binding call.`,
    );
  }

  return { errors, ed230 };
}

// ── CLI ────────────────────────────────────────────────────────────────────────────
function main(argv) {
  const json = argv.includes("--json");
  // Read the CANONICAL ledger. QL FAIL-MODE: absent/unreadable ledger → ed230IsOpen returns OPEN (strict),
  // NOT exit 2. Exit 2 is reserved for genuinely unparseable INJECTED test input (never reached via the CLI).
  let ledgerText = "";
  let deps;
  try {
    deps = realDeps();
  } catch (e) {
    process.stderr.write(`${NAME}: FAIL-CLOSED — reuse modules unavailable: ${e.message}\n`);
    return 2;
  }
  try {
    ledgerText = fs.readFileSync(deps.enforcementDebtPath, "utf8");
  } catch {
    ledgerText = ""; // absent canonical ledger → OPEN → strict (fail-closed, not exit 2)
  }

  const { errors, ed230 } = evaluateSecurityBindingLane({ deps, ledgerText });
  if (json) {
    process.stdout.write(JSON.stringify({ name: NAME, ok: errors.length === 0, ed230, errors }, null, 2) + "\n");
  } else if (errors.length === 0) {
    process.stdout.write(`${NAME}: OK — security binding lane verifiable (${ed230.reason}); redteam alias consistent; no single-pass creep-back.\n`);
  } else {
    process.stdout.write(`${NAME}: ${errors.length} finding(s) [${ed230.reason}]:\n${errors.map((e) => "  - " + e).join("\n")}\n`);
  }
  return errors.length === 0 ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = {
  NAME,
  VERIFIABLE,
  ed230IsOpen,
  singlePassBindingCallers,
  SINGLE_PASS_BINDING_RE,
  evaluateSecurityBindingLane,
  realDeps,
};
