"use strict";
/**
 * betaevents-dedup-lint.js (SP-20260723-003 / ED-267a) — the betaEvents verdict-row dedup + msg_id-
 * resolution HYGIENE lint (NOT a verdict AUTHENTICATOR — a verdict's authenticity comes from β's
 * persistent-teammate delivery + the recipient verifying the msg_id, security r2 #3; this lint only
 * flags duplicate/unresolvable rows). /scan:full-scoped ONLY (β: never CI/fresh-clone — betaEvents is a
 * GITIGNORED advisory ledger, absent on a clean checkout). Supports the standing β-writes-at-delivery
 * pattern (adopted after the SP-20260723-002 recipient-side silent logging drop, where a verdict row got
 * stamped with the OUTGOING consult msg_id instead of β's DELIVERY msg_id).
 *
 * Two checks over VERDICT rows (decision ∈ DECIDE|DIRECTIVE|ESCALATE; a REQUESTED row is a request, not
 * a verdict):
 *  1. DEDUP — no msg_id appears on >1 verdict row. Keyed on MSG_ID (not sprint+boundary): distinct
 *     deliveries carry distinct msg_ids, so this respects legit repeats of a sprint+boundary — reconfirms
 *     AND the "plan->design" vs "plan->design-correction" pair β flagged (β rider #1) are never
 *     false-RED'd, which a naive sprint+boundary count would be. A duplicate msg_id = the same delivery
 *     logged twice (the recipient-drop bug).
 *  2. MSG_ID RESOLUTION (advisory) — each verdict row's msg_id should resolve in the message log
 *     (paths.eventsFile). If the log is UNREACHABLE at scan-time, this sub-check SKIPS-with-note
 *     (fail-open advisory, β rider #2) — it is a scan advisory, never a release gate.
 *
 * REPORT-ONLY by default (exit 0 + findings printed). `--enforce` -> exit 1 on a DEDUP finding (the
 * resolution sub-check stays advisory either way). betaEvents absent/unreadable -> SKIP-with-note exit 0.
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { duplicateKeys } = require("./dedup-util");

const VERDICT_RE = /^(DECIDE|DIRECTIVE|ESCALATE)$/;

function paths() {
  try {
    const P = require(path.join(ROOT, "scripts", "hooks", "lib", "paths")).PATHS;
    return { betaEvents: P.betaEvents, eventsFile: P.eventsFile };
  } catch {
    return {
      betaEvents: path.join(".claude", "agents", "president", "_system", "beta", "events.jsonl"),
      eventsFile: path.join(".claude", "project", "events", "events.jsonl"),
    };
  }
}

function parseVerdictRows(text) {
  const rows = [];
  for (const line of String(text || "").split("\n")) {
    const t = line.trim();
    if (!t) continue;
    let r;
    try { r = JSON.parse(t); } catch { continue; } // malformed-safe
    const decision = typeof r.decision === "string" ? r.decision : null;
    if (decision && VERDICT_RE.test(decision)) rows.push(r);
  }
  return rows;
}

/**
 * extractMsgIds(eventsText) -> Set<string> — the msg_id field VALUES in the message log, for EXACT match.
 * (qa r2 #4 / security r2 #3: a substring `includes()` "resolved" verdict m1 against a log containing only
 * m10 — a prefix-collision false-positive. Exact set membership closes it.)
 */
function extractMsgIds(eventsText) {
  const set = new Set();
  const re = /"msg_id"\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(String(eventsText || ""))) !== null) set.add(m[1]);
  return set;
}

/**
 * analyze({ betaText, eventsText }) -> { skipped, dupMsgIds, missingMsgId, unresolved, resolutionSkipped }.
 * Pure — the CLI supplies the file contents (eventsText null ⇒ message log unreachable ⇒ resolution skipped).
 */
function analyze({ betaText, eventsText }) {
  if (betaText == null) return { skipped: true };
  const rows = parseVerdictRows(betaText);
  const dups = duplicateKeys(rows, (r) => (typeof r.msg_id === "string" && r.msg_id ? r.msg_id : null));
  const missingMsgId = rows.filter((r) => !(typeof r.msg_id === "string" && r.msg_id)).length;
  let unresolved = [];
  let resolutionSkipped = false; // report-only fail-open (β rider #2) when the log isn't the message log
  let lowConfidence = false;
  const logUnreachable = eventsText == null;
  if (logUnreachable) {
    resolutionSkipped = true; // truly no log — fail-open in BOTH modes (nothing to check against)
  } else {
    const msgIds = extractMsgIds(eventsText); // EXACT-match set (not substring — qa r2 #4 / security r2 #3)
    const withId = rows.map((r) => r.msg_id).filter((id) => typeof id === "string" && id);
    const notFound = withId.filter((id) => !msgIds.has(id));
    const resolvedFraction = withId.length ? (withId.length - notFound.length) / withId.length : 1;
    // A REAL SendMessage log resolves ~every delivered msg_id; a LOW fraction (< THRESHOLD) means the
    // candidate log is NOT the message log (e.g. paths.eventsFile logs a TRUNCATED preview, not full
    // UUIDs). security r2 #3: `unresolved` is ALWAYS the full notFound set — NEVER zeroed on low
    // confidence (zeroing let an attacker fabricate >20% rows to push resolution <80% and skip the whole
    // check under --enforce). low confidence only SKIPS the REPORT-ONLY advisory (avoid the truncated-log
    // noise); under --enforce the CLI fails CLOSED on any unresolved (reachable log), never on skip alone.
    const THRESHOLD = 0.8;
    lowConfidence = withId.length > 0 && resolvedFraction < THRESHOLD;
    unresolved = notFound;
    resolutionSkipped = lowConfidence; // report-only advisory skips; enforce does NOT (uses unresolved)
  }
  return { skipped: false, dupMsgIds: dups.map((d) => d.key), missingMsgId, unresolved, resolutionSkipped, lowConfidence, logUnreachable };
}

if (require.main === module) {
  const enforce = process.argv.includes("--enforce");
  const { betaEvents, eventsFile } = paths();
  const beta = path.isAbsolute(betaEvents) ? betaEvents : path.join(ROOT, betaEvents);
  const events = path.isAbsolute(eventsFile) ? eventsFile : path.join(ROOT, eventsFile);

  let betaText = null;
  try { betaText = fs.readFileSync(beta, "utf8"); } catch { betaText = null; }
  if (betaText == null) {
    console.log("betaevents-dedup-lint: SKIP — betaEvents absent/unreadable (gitignored advisory ledger; scan-session-only). Not a fresh-clone gate.");
    process.exit(0);
  }
  let eventsText = null;
  try { eventsText = fs.readFileSync(events, "utf8"); } catch { eventsText = null; }

  const res = analyze({ betaText, eventsText });
  // Under --enforce: a DEDUP finding blocks; and when the log is REACHABLE, ANY unresolved msg_id (security
  // r2 #3 — low confidence is not an escape hatch) AND any verdict-shaped row that OMITS msg_id entirely
  // (security r3 RR3-SEC-001 — the fabricated-row attack dropped one level to omitting the field: a
  // well-formed verdict MUST carry a resolvable msg_id) both block. Only a TRULY UNREACHABLE eventsText
  // fails open under enforce. In report-only, low-confidence still skips the unresolved advisory (no noise).
  const blocking = enforce && (res.dupMsgIds.length > 0 || (!res.logUnreachable && (res.unresolved.length > 0 || res.missingMsgId > 0)));
  const showUnresolved = res.unresolved.length > 0 && (blocking || !res.resolutionSkipped);
  const lines = [];
  if (res.dupMsgIds.length) lines.push(`  DUPLICATE msg_id on >1 verdict row (a delivery logged twice): ${res.dupMsgIds.join(", ")}`);
  if (res.missingMsgId) lines.push(`  ${res.missingMsgId} verdict-shaped row(s) OMIT msg_id — a well-formed verdict must carry a resolvable msg_id${enforce && !res.logUnreachable ? " (BLOCKING under --enforce)" : " (advisory — β should stamp its delivery msg_id)"}.`);
  if (showUnresolved) lines.push(`  ${res.unresolved.length} msg_id(s) not resolving in the message log${res.lowConfidence ? " (LOW-confidence log — under --enforce this fails closed)" : " (advisory)"}: ${res.unresolved.join(", ")}`);
  else if (res.resolutionSkipped) lines.push(`  msg_id-resolution: SKIPPED (report-only) — ${res.logUnreachable ? "message log unreachable" : "low-confidence log (<80% resolve, likely a truncated preview)"} (fail-open advisory).`);

  if (!lines.length) {
    console.log("betaevents-dedup-lint: OK — no duplicate verdict msg_id; all msg_ids resolve.");
    process.exit(0);
  }
  console[blocking ? "error" : "log"](`betaevents-dedup-lint: ${blocking ? "FAIL" : "findings (report-only)"}:`);
  for (const l of lines) console[blocking ? "error" : "log"](l);
  process.exit(blocking ? 1 : 0);
}

module.exports = { analyze, parseVerdictRows, extractMsgIds };
