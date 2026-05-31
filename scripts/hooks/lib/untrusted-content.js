"use strict";

/**
 * Untrusted-content firewall logic (S0.6) — shared by the PostToolUse hook
 * (scripts/hooks/untrusted-content-firewall.js) and the /scan:ingest-firewall
 * audit (scripts/checks/ingest-firewall-scan.js). One source of the firewall
 * decision so the inbound gate and the persistent scan can never disagree.
 *
 * Treat ALL externally-ingested content as DATA, never instructions (DUMP §1.7).
 *
 * v0.1 covers the INJECTION surface: REJECT agent-aimed true-injection;
 * NEUTRALIZE + tag business-verb imperatives. v0.2 GAP (β Addition 2): a
 * provenance-gated OUTBOUND block — blocking any outbound action whose text
 * traces to ingested content rather than an operator instruction. In v0.1 the
 * execution surface is partially covered by β (adhoc outbound gate) + the S1.2
 * oneshot arbitration-needed state. β EVT-s0-6-hard-halt-firewall-design-beta-001.
 */

const { INJECTION_CLASSES, BUSINESS_VERBS } = require("./injection-patterns");

/** Agent-aimed true-injection hits: [{ class, match }]. */
function findInjection(text) {
  const hits = [];
  if (typeof text !== "string") return hits;
  for (const cls of INJECTION_CLASSES) {
    for (const re of cls.patterns) {
      const m = text.match(re);
      if (m) {
        hits.push({ class: cls.name, match: m[0].slice(0, 80) });
        break; // one hit per class is enough to flag it
      }
    }
  }
  return hits;
}

/** Business-verb imperatives (informational) — lower-cased, de-duped. */
function findBusinessVerbs(text) {
  if (typeof text !== "string") return [];
  const hits = new Set();
  for (const re of BUSINESS_VERBS) {
    const m = text.match(new RegExp(re.source, "gi"));
    if (m) m.forEach((x) => hits.add(x.toLowerCase()));
  }
  return [...hits];
}

/**
 * verdict:
 *   'reject'     — agent-aimed true-injection found; block the content.
 *   'neutralize' — business-verb imperatives only; pass but tag data_only +
 *                  record stripped_directives.
 *   'pass'       — clean.
 */
function classify(text) {
  const injection = findInjection(text);
  if (injection.length > 0) {
    return { verdict: "reject", injection, stripped_directives: [] };
  }
  const verbs = findBusinessVerbs(text);
  if (verbs.length > 0) {
    return { verdict: "neutralize", injection: [], stripped_directives: verbs };
  }
  return { verdict: "pass", injection: [], stripped_directives: [] };
}

module.exports = { findInjection, findBusinessVerbs, classify };
