"use strict";
/**
 * ed060c-close-gate.js — the NAMED consumer gate for the ED-060(c) LIVENESS close
 * (SP-20260723-002 / ADR-0037, qa r1 finding #2). cert-attest and gauntlet-verify inspect only
 * `fallback`; NEITHER reads agy's INTERNAL `auth_fallback`, so an unauthenticated-but-provider-present
 * agy serve could still be read as a close. This gate closes that: an ED-060(c) close REQUIRES the agy
 * record's `auth_fallback === false` (POSITIVE proof).
 *
 * DoE condition #4 (the fail-OPEN trap): pin to `=== false`, NOT `reject(=== true)` — `"indeterminate"`
 * and an ABSENT field are BOTH not-false, so a naive `!== true` reject would let them through. This gate
 * requires the exact boolean false; true / "indeterminate" / absent all FAIL.
 *
 * RECORD-TRUST: the authoritative source is the SIGNED completion record in the ledger. Every ledger/CLI
 * read verifies the ORIGIN-PROOF signature (attest-signing.verifyRecord) FIRST — a same-session ok:true
 * read must be signed (liveness-read-choke-point, SP-20260718-004). auth_fallback is in SIGNED_FIELDS, so
 * an unauthenticated serve's true/"indeterminate" cannot be edited to false with the sig still valid.
 */

const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");

function loadVerifier() {
  try { return require(path.join(ROOT, "scripts", "dispatch", "attest-signing")).verifyRecord; }
  catch { return null; }
}

/**
 * evaluateEd060cClose(record) — PURE field logic over an ALREADY-ORIGIN-PROOF-VERIFIED record. Callers
 * (the ledger reader + the CLI) verifyRecord BEFORE this runs, so the ok:true read here is a reviewed
 * shape-only check whose verification lives in its caller.
 */
function evaluateEd060cClose(record) {
  const r = record || {};
  const reasons = [];
  // liveness-verified: origin-proof (attest-signing.verifyRecord) is asserted at the read boundary
  // (latestVerifiedAgyRecord / the --record CLI path) before this pure field check — see file header.
  const okTrue = r.ok === true;
  if (!okTrue) reasons.push(`ok must be true (got ${JSON.stringify(r.ok)})`);
  // BOTH provider AND tool_id must be the agy lane (backend r2 #4 / qa r2 #1 — verified exploitable: a
  // signed record with provider:"openai" + tool_id:"agy" scored closeable:true when only tool_id was
  // checked). A genuine agy record carries provider:"antigravity" AND tool_id:"agy".
  const providerAgy = r.provider === "antigravity";
  if (!providerAgy) reasons.push(`provider must be "antigravity" (got ${JSON.stringify(r.provider)})`);
  const toolAgy = r.tool_id === "agy";
  if (!toolAgy) reasons.push(`tool_id must be "agy" (got ${JSON.stringify(r.tool_id)})`);
  const providerFallbackClean = r.fallback === false;
  if (!providerFallbackClean) reasons.push(`fallback must be false (got ${JSON.stringify(r.fallback)})`);
  // THE gate — require positive auth proof. `=== false` REJECTS true, "indeterminate", AND absent.
  const authProven = r.auth_fallback === false;
  if (!authProven) {
    reasons.push(
      `auth_fallback must be EXACTLY false — an unauthenticated ("true") or unverifiable ("indeterminate") ` +
      `or unstamped (absent) serve cannot close ED-060(c) (got ${JSON.stringify(r.auth_fallback)})`,
    );
  }
  const closeable = okTrue && providerAgy && toolAgy && providerFallbackClean && authProven;
  return { closeable, reasons, checks: { okTrue, providerAgy, toolAgy, providerFallbackClean, authProven } };
}

/**
 * latestVerifiedAgyRecord — the most recent antigravity/agy record in the ledger that PASSES origin-proof
 * verification (optionally ≥ sinceMs). An unsigned / cross-session / tampered record is SKIPPED (it cannot
 * close). Returns { record, skippedUnverified } — skippedUnverified counts records that matched the lane
 * but failed verification (surfaced so a same-session-but-unsigned record is not silently invisible).
 */
function latestVerifiedAgyRecord(completionsFile, sinceMs, verifyRecord = loadVerifier()) {
  let lines;
  try {
    lines = fs.readFileSync(completionsFile, "utf8").split("\n").filter(Boolean);
  } catch {
    return { record: null, skippedUnverified: 0 };
  }
  let best = null;
  let skippedUnverified = 0;
  // A finite positive sinceMs is a real time floor; anything else (0 / NaN) means "no floor" (the CLI
  // rejects an INVALID --since before calling — backend r2 #2 — so a NaN never silently disables it here).
  const hasFloor = Number.isFinite(sinceMs) && sinceMs > 0;
  for (const ln of lines) {
    let rec;
    try { rec = JSON.parse(ln); } catch { continue; }
    // BOTH fields must be the agy lane (backend r2 #4 / qa r2 #1) — matches the evaluate gate.
    if (!(rec.provider === "antigravity" && rec.tool_id === "agy")) continue;
    const ts = Date.parse(rec.completed_at || rec.started_at || "") || 0;
    if (hasFloor && ts < sinceMs) continue;
    if (!verifyRecord || !verifyRecord(rec)) { skippedUnverified++; continue; } // origin-proof required
    if (!best || ts >= best._ts) { best = rec; best._ts = ts; }
  }
  return { record: best, skippedUnverified };
}

/**
 * resolveSinceMs(args) -> { ok:true, sinceMs } | { ok:false, reason } — parse the `--since` argv floor.
 * FLAG-PRESENCE is distinguished from a MISSING value (R3-BE-001): a BARE `--since` (flag present with no
 * following value, or the next token is itself a flag) is INVALID, never "absent" — otherwise a bare flag
 * silently disables the time floor and an older signed clean record closes. Absent flag -> no floor (0).
 */
function resolveSinceMs(args) {
  const idx = args.indexOf("--since");
  if (idx < 0) return { ok: true, sinceMs: 0 }; // flag absent -> no floor
  const val = args[idx + 1];
  const missing = val === undefined || String(val).startsWith("--");
  const sinceMs = missing ? NaN : Date.parse(val);
  if (!Number.isFinite(sinceMs)) {
    return { ok: false, reason: missing ? "--since is present with no value (bare flag)" : `--since "${val}" is not a valid date` };
  }
  return { ok: true, sinceMs };
}

module.exports = { evaluateEd060cClose, latestVerifiedAgyRecord, resolveSinceMs };

if (require.main === module) {
  const args = process.argv.slice(2);
  const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const verifyRecord = loadVerifier();
  if (!verifyRecord) {
    console.error("ED-060(c) close gate: attest-signing.verifyRecord unavailable — cannot verify origin-proof (fail-closed).");
    process.exit(2);
  }
  let record;
  const recordFile = get("--record");
  if (recordFile) {
    record = JSON.parse(fs.readFileSync(recordFile, "utf8"));
    // origin-proof FIRST: an unsigned / tampered record cannot close (verifyRecord — attest-signing).
    if (!verifyRecord(record)) {
      console.error(`ED-060(c) close gate: the record at ${recordFile} FAILS origin-proof verification (unsigned/tampered/cross-session) — cannot close (fail-closed). Point --record at a SIGNED ledger record, or use the --since ledger path.`);
      process.exit(1);
    }
  } else {
    let completions = get("--completions");
    if (!completions) {
      try { completions = require(path.join(ROOT, "scripts", "hooks", "lib", "paths")).PATHS.dispatchCompletionsFile; }
      catch { completions = path.join(".claude", "runtime", "dispatch-completions.jsonl"); }
    }
    if (!path.isAbsolute(completions)) completions = path.join(ROOT, completions);
    // backend r2 #2 + R3-BE-001: an INVALID or BARE --since must NOT silently disable the time floor
    // (an unparseable value -> Date.parse NaN; a bare flag -> undefined). resolveSinceMs distinguishes
    // flag-present-no-value from flag-absent; both invalid forms fail-closed (exit 2), never "no floor".
    const sinceRes = resolveSinceMs(args);
    if (!sinceRes.ok) {
      console.error(`ED-060(c) close gate: ${sinceRes.reason} — refusing (fail-closed; a bare or unparseable --since would silently admit an older record).`);
      process.exit(2);
    }
    const sinceMs = sinceRes.sinceMs;
    const found = latestVerifiedAgyRecord(completions, sinceMs, verifyRecord);
    if (!found.record) {
      const tail = found.skippedUnverified ? ` (${found.skippedUnverified} matched-but-unverified record(s) skipped — origin-proof required)` : "";
      console.error("ED-060(c) close gate: NO verified antigravity record found" + (sinceMs ? ` since ${new Date(sinceMs).toISOString()}` : "") + tail + " — cannot close (fail-closed).");
      process.exit(1);
    }
    record = found.record;
  }
  const res = evaluateEd060cClose(record);
  if (res.closeable) {
    console.log("ED-060(c) LIVENESS close gate: PASS — signed agy record has ok:true, fallback:false, auth_fallback:false, tool_id:agy.");
    console.log("  (ED-230 served-MODEL proof + panel-3lab activation stay OPEN — never cite a transport-clean serve as 'live'.)");
    process.exit(0);
  }
  console.error("ED-060(c) LIVENESS close gate: FAIL — cannot close:");
  for (const reason of res.reasons) console.error("  - " + reason);
  process.exit(1);
}
