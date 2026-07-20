"use strict";
/**
 * check-lib/index.js — the ONE shared check module (SP-20260720-002 Phase 4, unit BUNDLE).
 *
 * WHAT THIS IS: a FIXED registry of named checks, not a plugin framework (generalized checker/plugin
 * frameworks are explicitly OUT of scope — PRD "Excluded from acceptance criteria"). Three consumers
 * require() this contract (Seam D): the Claude hook (`scripts/hooks/check-lib-prevention.js`), git
 * pre-commit (fast, explicitly non-authoritative feedback), and the trusted controller — but the
 * controller NEVER requires this file directly; it requires only the PINNED, content-hashed SNAPSHOT of
 * it produced by `pinned-checker-bundle.js#buildBundle` (Seam B). Mutable workspace imports of check-lib
 * are prohibited for the controller by design (R-4) — this file is the SOURCE the bundle is built FROM.
 *
 * FAIL-CLOSED CONTRACT: `getCheck` THROWS on an unregistered name — it never returns `undefined`, because
 * a caller that treated an unregistered check as "nothing to run" would silently skip it (the exact
 * false-green class this library exists to prevent). `runSuite`'s `missing` array is the drift signal for
 * a REQUESTED name that isn't registered (e.g. a renamed/retired check) — that failure mode is reported,
 * not thrown, so a caller iterating a caller-supplied name list doesn't crash on one bad entry.
 *
 * Extending the registry: (1) add the name to `registry.js`'s `CHECK_NAMES`/`REQUIRED_CHECKS`, (2) add its
 * module under `checks/<name>.js`, (3) add ONE `require()` line to the REGISTRY object below. There is no
 * directory scan — a check that exists on disk but isn't wired into REGISTRY here is invisible (by design;
 * the fixed-registry discipline is what the check-lib-single-source enforcer polices).
 */

const crypto = require("crypto");
const { SUITE_VERSION, CHECK_NAMES, REQUIRED_CHECKS } = require("./registry");

// FIXED registry — every check module is require()'d BY NAME, explicitly, here.
const REGISTRY = Object.freeze({
  "false-green-envelope": require("./checks/false-green-envelope"),
  "no-nul-bytes": require("./checks/no-nul-bytes"),
  "suite-completeness": require("./checks/suite-completeness"),
});

// Anti-drift self-check at load time: every CHECK_NAMES entry must have a matching REGISTRY module whose
// declared `name` field equals the key, and every REQUIRED_CHECKS entry must be a member of CHECK_NAMES. A
// copy-paste/rename mistake is caught HERE, at require time, not silently later at runCheck time.
for (const n of CHECK_NAMES) {
  const mod = REGISTRY[n];
  if (!mod || typeof mod.run !== "function" || mod.name !== n) {
    throw new Error(
      `check-lib registry drift: CHECK_NAMES entry '${n}' has no matching REGISTRY['${n}'] module with a run() and name==='${n}'`,
    );
  }
}
for (const n of REQUIRED_CHECKS) {
  if (!CHECK_NAMES.includes(n)) {
    throw new Error(`check-lib registry drift: REQUIRED_CHECKS entry '${n}' is not present in CHECK_NAMES`);
  }
}

function listChecks() {
  return CHECK_NAMES.slice();
}

/**
 * getCheck(name) -> {name, run}. THROWS on an unregistered name — fail-closed, NEVER returns undefined.
 */
function getCheck(name) {
  const mod = REGISTRY[name];
  if (!mod) {
    throw new Error(`check-lib: unregistered check name '${name}' — fail-closed (getCheck never returns undefined)`);
  }
  return mod;
}

/** Deterministic sha256 over a canonical (recursively sorted-key) JSON projection. PURE — no fs, no clock. */
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = canonicalize(value[k]);
    return out;
  }
  return value === undefined ? null : value;
}
function digestOf(obj) {
  return crypto.createHash("sha256").update(JSON.stringify(canonicalize(obj))).digest("hex");
}

const VALID_STATUSES = new Set(["pass", "fail", "skipped", "timeout"]);

/**
 * runCheck(name, ctx) -> {name, status, reason, evidence, digest}. `getCheck(name)` THROWS on an
 * unregistered name and that throw PROPAGATES here (by design — `runSuite` is the drift-tolerant caller
 * that catches it per-name into `missing`). A check's `run(ctx)` throwing, or returning a
 * malformed/unrecognized status, is caught and turned into a fail-closed `fail` result — a broken check
 * can never silently read as passing.
 */
function runCheck(name, ctx = {}) {
  const check = getCheck(name); // throws on unregistered — intentionally not caught here
  let raw;
  try {
    raw = check.run(ctx);
  } catch (e) {
    raw = { status: "fail", reason: "check-threw", evidence: { error: String(e && e.message ? e.message : e) } };
  }
  if (!raw || typeof raw !== "object" || !VALID_STATUSES.has(raw.status)) {
    raw = { status: "fail", reason: "check-malformed-result", evidence: { raw: raw === undefined ? null : raw } };
  }
  const result = {
    name,
    status: raw.status,
    reason: raw.reason != null ? raw.reason : "",
    evidence: raw.evidence && typeof raw.evidence === "object" ? raw.evidence : {},
  };
  result.digest = digestOf(result);
  if (ctx && ctx.nonce != null) result.nonce = ctx.nonce;
  return result;
}

/**
 * runSuite(names, ctx) -> {version, results:[], missing:[]}. `missing` = requested names with no
 * registered check — the DRIFT SIGNAL. `names` defaults to the full frozen CHECK_NAMES when omitted.
 * Every check in the run receives `ctx.executedNames` (the resolved, registered subset actually run THIS
 * invocation) so `suite-completeness` can compare against it without reaching back into this module.
 */
function runSuite(names, ctx = {}) {
  const requested = Array.isArray(names) ? names : CHECK_NAMES.slice();
  const missing = [];
  const executedNames = [];
  for (const name of requested) {
    try {
      getCheck(name);
    } catch {
      missing.push(name);
      continue;
    }
    executedNames.push(name);
  }
  const suiteCtx = { ...ctx, executedNames };
  const results = executedNames.map((name) => runCheck(name, suiteCtx));
  return { version: SUITE_VERSION, results, missing };
}

module.exports = {
  SUITE_VERSION,
  CHECK_NAMES,
  REQUIRED_CHECKS,
  listChecks,
  getCheck,
  runCheck,
  runSuite,
};
