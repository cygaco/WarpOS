"use strict";

/**
 * Named-class injection patterns for the untrusted-content firewall (S0.6).
 *
 * Explicit ENUMERATED named-class list — each class is auditable: you can read
 * exactly what it catches, which prevents false-positive creep from vague
 * pattern drift (β Addition 1, EVT-s0-6-hard-halt-firewall-design-beta-001 —
 * "explicit enumerated named-class list, not a fuzzy heuristic").
 *
 * INJECTION_CLASSES = high-confidence TRUE prompt-injection aimed AT THE AGENT
 *   (system-prompt-shaped text). A hit => REJECT (the firewall blocks the
 *   content from reaching the agent as instructions).
 * BUSINESS_VERBS = imperative business verbs in INFORMATIONAL context — a
 *   competitor page that says "Install our app", a research doc discussing
 *   "how to publish". A hit => NEUTRALIZE (mark the content data_only + record
 *   the verb in stripped_directives), NOT reject — rejecting these would break
 *   research:deep + the ingest pipeline (the crux β settled: the spec rejects
 *   directives-aimed-at-the-agent, not business-verb mentions).
 *
 * v0.1 is REVISABLE. Add a class here (one block) without touching the lib/hook.
 */

const INJECTION_CLASSES = [
  {
    name: "system-prompt-injection",
    patterns: [
      /ignore\s+(all\s+)?(the\s+)?previous\s+instructions/i,
      /disregard\s+(all\s+)?(prior|previous|above|the\s+foregoing)/i,
      /your\s+(new\s+)?instructions\s+are\s+now/i,
      /forget\s+(all\s+)?(your\s+)?(prior|previous)\s+(instructions|directives)/i,
    ],
  },
  {
    name: "role-override",
    patterns: [
      /you\s+are\s+now\s+(a|an|the)\b/i,
      /your\s+new\s+role\s+is/i,
      /as\s+an?\s+AI[,]?\s+you\s+must/i,
      /from\s+now\s+on[,]?\s+you\s+(are|will|must|should)\b/i,
    ],
  },
  {
    name: "self-reference-override",
    patterns: [
      /(this|the\s+following)\s+(text\s+)?(overrides|supersedes|replaces)\s+your/i,
      /ignore\s+your\s+(system|developer|previous)\s+prompt/i,
    ],
  },
  {
    // High-confidence agent-aimed framing ONLY. Deliberately NOT bare
    // "jailbreak" or "developer mode enabled" — those are topic words that
    // appear in legitimate technical/research content (e.g. Windows Developer
    // Mode for symlinks), the exact false-positive class β warned against.
    // Each pattern requires the escalation be directed at the agent.
    name: "privilege-escalation-framing",
    patterns: [
      /you\s+(now\s+)?have\s+(admin|root|full|elevated|unrestricted)\s+(access|privileges|permissions|mode)/i,
      /(enable|activate|enter|you\s+are\s+(now\s+)?in)\s+(jailbreak|dan|do\s+anything\s+now)\s*(mode)?/i,
      /jailbreak\s+(the\s+)?(model|assistant|ai|system|prompt)/i,
    ],
  },
];

// Business-verb imperatives — NEUTRALIZE (tag data_only), do NOT reject.
const BUSINESS_VERBS = [
  /\b(install|publish|export|deploy|mirror|download|run|execute)\b/i,
];

module.exports = { INJECTION_CLASSES, BUSINESS_VERBS };
