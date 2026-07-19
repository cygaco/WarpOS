#!/usr/bin/env node
"use strict";

/**
 * tracker-fidelity.js — SP-20260718-005 AC-15 / G3.5 (ED-056 recurrence class).
 *
 * THE CLASS: a STRUCTURED sprint tracker (progress.yaml / current.yaml) claims a state that
 * contradicts ground truth — the "verify-don't-inherit" drift that recurred 5x on 2026-06-16 and
 * again as the STALE "entering build" progress.yaml this very resume hit. tracker-reality-drift.js
 * already covers the epic-MARKDOWN table class ("Missing But Required" while the artifact exists);
 * THIS is its structured-YAML sibling: a FIELD-LEVEL GROUND-TRUTH AUTHORITY MAP over the sprint
 * trackers, evaluated at a CONSISTENT SNAPSHOT.
 *
 * FIELD-LEVEL GROUND-TRUTH AUTHORITY MAP: each row names a tracker field and the AUTHORITY that
 * establishes its truth — never the tracker's own say-so:
 *   - `active-sprint` — the field must equal the active sprint id (registry authority).
 *   - `disk`         — the field value(s) are repo-relative paths that MUST exist on disk.
 *   - `disk-script`  — extract every `scripts/….js` token from the field and each MUST exist
 *                      (a "passing check" / active-file naming a nonexistent script is drift).
 * Adding a field→authority row EXTENDS the probe; the orchestrator hard-codes no field list.
 *
 * CONSISTENT-SNAPSHOT SEMANTICS: ground truth (active-sprint id + a memoized path-existence view)
 * is captured ONCE into a snapshot; every authority check reads that snapshot, so the verdict is
 * internally consistent even if the filesystem changes mid-scan (no read-skew between fields).
 *
 * Exit: 0 = fidelity OK (report-only default: mismatches printed, exit still 0) · 1 = mismatch under
 *       --enforce (BINDING at Phase-3 exit) · 2 = the scan's OWN error (unreadable tracker / no active
 *       sprint) — FAIL-CLOSED (a broken fidelity scan must never read "0 drift", P-053 / BC-16).
 *
 *   node scripts/checks/tracker-fidelity.js [--sprint <id>] [--enforce] [--json]
 */

const fs = require("fs");
const path = require("path");

const REPO = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");

/** Resolve the two structured trackers for a sprint id. */
function trackerPaths(sprintId, root) {
  const base = path.join(root || REPO, ".claude", "project", "sprint", "sprints", sprintId);
  return { progress: path.join(base, "progress.yaml"), current: path.join(base, "current.yaml") };
}

/** Read the active sprint id (registry authority), injectable for tests. */
function readActiveSprint(root) {
  try {
    const S = require("../sprint/paths");
    return S.active();
  } catch {
    // Fallback: single active-sprints registry read (kept dependency-light + fail-soft).
    try {
      const reg = path.join(root || REPO, ".claude", "project", "sprint", "active-sprints.yaml");
      const { readYamlMaybe } = require("../sprint/fs");
      const y = readYamlMaybe(reg);
      if (y && Array.isArray(y.active) && y.active.length) return y.active[0];
    } catch {
      /* fall through */
    }
    return null;
  }
}

/** Load both trackers. Returns { ok, progress, current, error }. Fail-closed on unreadable. */
function loadTrackers(sprintId, root) {
  const { readYamlMaybe } = require("../sprint/fs");
  const p = trackerPaths(sprintId, root);
  let progress, current;
  try {
    progress = readYamlMaybe(p.progress);
  } catch (e) {
    return { ok: false, error: `progress.yaml unreadable: ${e.message}` };
  }
  try {
    current = readYamlMaybe(p.current);
  } catch (e) {
    return { ok: false, error: `current.yaml unreadable: ${e.message}` };
  }
  if (!progress && !current)
    return { ok: false, error: `no trackers for ${sprintId} (progress.yaml + current.yaml both absent)` };
  return { ok: true, progress: progress || {}, current: current || {}, paths: p };
}

/** Capture ONE ground-truth snapshot: active-sprint id + a memoized path-existence view. */
function takeSnapshot({ root, activeSprint } = {}) {
  const r = root || REPO;
  const existsCache = new Map();
  return {
    ts: new Date().toISOString(),
    root: r,
    activeSprint: activeSprint !== undefined ? activeSprint : readActiveSprint(r),
    exists(rel) {
      if (this.existsCache.has(rel)) return this.existsCache.get(rel);
      let ok = false;
      try {
        ok = fs.existsSync(path.isAbsolute(rel) ? rel : path.join(this.root, rel));
      } catch {
        ok = false;
      }
      this.existsCache.set(rel, ok);
      return ok;
    },
    existsCache,
  };
}

// Pull scripts/….js tokens out of a string (a checks_passing entry may be prose that names one).
const SCRIPT_TOKEN_RE = /(scripts\/[A-Za-z0-9_.\/-]+\.(?:js|cjs|mjs))/g;

/**
 * The FIELD-LEVEL GROUND-TRUTH AUTHORITY MAP. Each row: which tracker, a human `field` label, an
 * `authority`, and an `extract(trackers)` returning the claimed value(s) with a `where` locator.
 */
const AUTHORITY_MAP = Object.freeze([
  {
    tracker: "current",
    field: "id",
    authority: "active-sprint",
    extract: (t) => (t.current && t.current.id != null ? [{ value: String(t.current.id), where: "current.id" }] : []),
  },
  {
    tracker: "current",
    field: "plan_contract",
    authority: "disk",
    extract: (t) => (t.current && t.current.plan_contract ? [{ value: t.current.plan_contract, where: "current.plan_contract" }] : []),
  },
  {
    tracker: "current",
    field: "requirements.*",
    authority: "disk",
    extract: (t) => {
      const req = (t.current && t.current.requirements) || {};
      return Object.entries(req)
        .filter(([, v]) => typeof v === "string" && v.trim())
        .map(([k, v]) => ({ value: v, where: `current.requirements.${k}` }));
    },
  },
  {
    tracker: "current",
    field: "requirements.record_trust_gate",
    authority: "disk",
    extract: (t) => {
      const v = t.current && (t.current.record_trust_gate || (t.current.requirements && t.current.requirements.record_trust_gate));
      return v ? [{ value: v, where: "current.record_trust_gate" }] : [];
    },
  },
  {
    tracker: "progress",
    field: "active_files[]",
    authority: "disk",
    extract: (t) => ((t.progress && Array.isArray(t.progress.active_files)) ? t.progress.active_files.map((v, i) => ({ value: v, where: `progress.active_files[${i}]` })) : []),
  },
  {
    tracker: "progress",
    field: "modified_files[]",
    authority: "disk",
    extract: (t) => ((t.progress && Array.isArray(t.progress.modified_files)) ? t.progress.modified_files.map((v, i) => ({ value: v, where: `progress.modified_files[${i}]` })) : []),
  },
  {
    tracker: "progress",
    field: "checks_passing[]",
    authority: "disk-script",
    extract: (t) => ((t.progress && Array.isArray(t.progress.checks_passing)) ? t.progress.checks_passing.map((v, i) => ({ value: String(v), where: `progress.checks_passing[${i}]` })) : []),
  },
]);

/** Apply one authority to one claimed value against the snapshot. Returns null (ok) or a reason. */
function checkAuthority(authority, value, snapshot) {
  switch (authority) {
    case "active-sprint":
      return value === snapshot.activeSprint
        ? null
        : `claims sprint id "${value}" but the active sprint is "${snapshot.activeSprint}" (registry authority)`;
    case "disk":
      return snapshot.exists(value) ? null : `names path "${value}" which does NOT exist on disk`;
    case "disk-script": {
      const tokens = String(value).match(SCRIPT_TOKEN_RE) || [];
      const missing = tokens.filter((tk) => !snapshot.exists(tk));
      return missing.length ? `names script(s) that do NOT exist on disk: ${missing.join(", ")}` : null;
    }
    default:
      return `unknown authority "${authority}" (fail-closed)`;
  }
}

/** PURE evaluation of the authority map over loaded trackers + a snapshot. { ok, violations[] }. */
function evaluate(trackers, snapshot, authorityMap = AUTHORITY_MAP) {
  const violations = [];
  if (!snapshot.activeSprint)
    violations.push("no active sprint resolvable — cannot establish the active-sprint authority (fail-closed)");
  for (const row of authorityMap) {
    let claims = [];
    try {
      claims = row.extract(trackers) || [];
    } catch (e) {
      violations.push(`${row.field}: extract error (fail-closed): ${e.message}`);
      continue;
    }
    for (const c of claims) {
      const reason = checkAuthority(row.authority, c.value, snapshot);
      if (reason) violations.push(`${c.where} [${row.authority}]: ${reason}`);
    }
  }
  return { ok: violations.length === 0, violations };
}

function run(sprintId, opts = {}) {
  const root = opts.root || REPO;
  const loaded = loadTrackers(sprintId, root);
  if (!loaded.ok) return { code: 2, ok: false, error: loaded.error };
  const snapshot = opts.snapshot || takeSnapshot({ root, activeSprint: opts.activeSprint });
  const res = evaluate({ progress: loaded.progress, current: loaded.current }, snapshot);
  return { code: res.ok ? 0 : 1, ok: res.ok, violations: res.violations, snapshot_ts: snapshot.ts, sprint: sprintId };
}

function main(argv) {
  const json = argv.includes("--json");
  const enforce = argv.includes("--enforce");
  const si = argv.indexOf("--sprint");
  const sprintId = si !== -1 && argv[si + 1] ? argv[si + 1] : readActiveSprint(REPO);
  if (!sprintId) {
    process.stderr.write("tracker-fidelity: no --sprint and no active sprint (fail-closed)\n");
    return 2;
  }

  const res = run(sprintId);

  if (json) {
    process.stdout.write(JSON.stringify({ mode: enforce ? "enforce" : "report-only", ...res }, null, 2) + "\n");
  } else if (res.code === 2) {
    process.stderr.write(`tracker-fidelity: FAIL-CLOSED — ${res.error}\n`);
  } else if (res.ok) {
    process.stdout.write(`OK   [tracker-fidelity] ${sprintId}: all mapped tracker fields agree with ground truth (snapshot ${res.snapshot_ts}).\n`);
  } else {
    process.stdout.write(
      `${enforce ? "FAIL" : "WARN"} [tracker-fidelity] ${sprintId}: ${res.violations.length} field(s) contradict ground truth (verify-don't-inherit, ED-056):\n`,
    );
    for (const v of res.violations) process.stdout.write(`  - ${v}\n`);
    if (!enforce) process.stdout.write("  (report-only — pass --enforce to block; BINDING at Phase-3 exit)\n");
  }

  // FAIL-CLOSED on the scan's own error (exit 2) regardless of mode. Field mismatches gate only under --enforce.
  if (res.code === 2) return 2;
  return enforce && !res.ok ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = {
  trackerPaths,
  readActiveSprint,
  loadTrackers,
  takeSnapshot,
  AUTHORITY_MAP,
  checkAuthority,
  evaluate,
  run,
};
