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
  let resolutionSkipped = false;
  if (eventsText == null) {
    resolutionSkipped = true; // message log unreachable -> fail-open advisory (β rider #2)
  } else {
    const msgIds = extractMsgIds(eventsText); // EXACT-match set (not substring — qa r2 #4 / security r2 #3)
    const withId = rows.map((r) => r.msg_id).filter((id) => typeof id === "string" && id);
    const notFound = withId.filter((id) => !msgIds.has(id));
    const resolvedFraction = withId.length ? (withId.length - notFound.length) / withId.length : 1;
    // Fail-open heuristic (β rider #2 generalized): a REAL SendMessage log resolves ~every delivered
    // msg_id. If the candidate log resolves a LOW fraction (< THRESHOLD), it is NOT the message log (e.g.
    // paths.eventsFile logs a TRUNCATED preview, not full UUIDs) — treat it as unreachable and
    // SKIP-with-note rather than emit a wall of false "unresolved". Only a log that resolves a strong
    // majority is trusted as authoritative, and then the specific few missing are flagged.
    const THRESHOLD = 0.8;
    if (withId.length > 0 && resolvedFraction < THRESHOLD) {
      resolutionSkipped = true;
    } else {
      unresolved = notFound;
    }
  }
  return { skipped: false, dupMsgIds: dups.map((d) => d.key), missingMsgId, unresolved, resolutionSkipped };
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
  const lines = [];
  if (res.dupMsgIds.length) lines.push(`  DUPLICATE msg_id on >1 verdict row (a delivery logged twice): ${res.dupMsgIds.join(", ")}`);
  if (res.missingMsgId) lines.push(`  ${res.missingMsgId} verdict row(s) carry NO msg_id (advisory — β should stamp its delivery msg_id).`);
  if (res.resolutionSkipped) lines.push("  msg_id-resolution: SKIPPED — message log unreachable (fail-open advisory).");
  else if (res.unresolved.length) lines.push(`  msg_id(s) not resolving in the message log (advisory): ${res.unresolved.join(", ")}`);

  if (!lines.length) {
    console.log("betaevents-dedup-lint: OK — no duplicate verdict msg_id; all msg_ids resolve.");
    process.exit(0);
  }
  // Under --enforce: a DEDUP finding blocks; and when the resolution check is ACTIVE (the log is trusted,
  // not <80%-skipped), an UNRESOLVED verdict row is a fabricated/unverifiable row and blocks too (security
  // r2 #3). The resolution-skipped path (untrusted/unreachable log) NEVER blocks (β rider #2 fail-open).
  const blocking = enforce && (res.dupMsgIds.length > 0 || (!res.resolutionSkipped && res.unresolved.length > 0));
  console[blocking ? "error" : "log"](`betaevents-dedup-lint: ${blocking ? "FAIL" : "findings (report-only)"}:`);
  for (const l of lines) console[blocking ? "error" : "log"](l);
  process.exit(blocking ? 1 : 0);
}

module.exports = { analyze, parseVerdictRows, extractMsgIds };
