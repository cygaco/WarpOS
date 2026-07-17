#!/usr/bin/env node
"use strict";

/**
 * retention.js — conservative-by-construction DELETION of transient runtime
 * cruft (56 loose `handoff-live-*.md`, 101 stale `handoffs/*`, one stray
 * error log). DRY-RUN is the DEFAULT: `planRetention()` never deletes
 * anything, and `applyRetention()` only deletes under `{apply:true}`.
 *
 * ALLOWLIST OF EXACT SHAPES ONLY — nothing else is ever eligible:
 *   (a) `.claude/runtime/handoff-live-*.md` — keep newest HANDOFF_LIVE_KEEP
 *       by mtime; match the EXACT regex `^handoff-live-.+\.md$` (no `.bak`,
 *       no traversal, no symlink).
 *   (b) `.claude/runtime/handoffs/*` — files with mtime older than
 *       RETENTION_HANDOFF_DAYS.
 *   (c) the ONE named file `runtime/s-pf-03-security-review.err.log`, if
 *       present (exact path only).
 *
 * Every resolved target MUST path.resolve() to inside `root`; anything that
 * escapes (`..`, absolute-outside, symlink target outside root) is refused
 * (skipped, never deleted). A per-run cap (MAX_DELETIONS_PER_RUN) bounds the
 * blast radius of any future shape-match bug. Fail-closed throughout: a
 * shape that cannot be safely resolved is SKIPPED, never deleted.
 *
 *   node scripts/hooks/lib/retention.js [--apply] [--root <dir>]
 */

const fs = require("fs");
const path = require("path");

// ── Named constants (the retention contract) ───────────────────────────────
const RETENTION_HANDOFF_DAYS = 14;
const HANDOFF_LIVE_KEEP = 10;
const MAX_DELETIONS_PER_RUN = 25;
// The session-start.js "load a recent handoff" window (see PRIORITY 3 there:
// `ageHours < 168` i.e. 7 days). Retention's keep-window must always be a
// SUPERSET of the load-window, or a handoff session-start would still load
// could get pruned out from under it.
const HANDOFF_LOAD_DAYS = 7;

// Encode the invariant so a future tightening of RETENTION_HANDOFF_DAYS (or a
// loosening of HANDOFF_LOAD_DAYS) FAILS LOUDLY at require-time rather than
// silently drifting into a load/prune race.
if (!(RETENTION_HANDOFF_DAYS > HANDOFF_LOAD_DAYS)) {
  throw new Error(
    `retention.js: invariant violated — RETENTION_HANDOFF_DAYS (${RETENTION_HANDOFF_DAYS}) ` +
      `must be > HANDOFF_LOAD_DAYS (${HANDOFF_LOAD_DAYS}), or session-start could prune a ` +
      `handoff it still intends to load.`,
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HANDOFF_LIVE_RE = /^handoff-live-.+\.md$/;
const NAMED_ERR_LOG_REL = path.join("runtime", "s-pf-03-security-review.err.log");

// ── Path-containment guard ──────────────────────────────────────────────────

/**
 * Resolve `absPathCandidate` and refuse anything that escapes `root`
 * (`..`, an absolute path outside root, or — if it exists — a symlink whose
 * REAL target resolves outside root). Returns the safe absolute path, or
 * `null` when containment cannot be proven.
 */
function safeResolve(root, absPathCandidate) {
  try {
    const rootAbs = path.resolve(root);
    const resolved = path.resolve(absPathCandidate);
    const rootWithSep = rootAbs.endsWith(path.sep) ? rootAbs : rootAbs + path.sep;
    if (resolved !== rootAbs && !resolved.startsWith(rootWithSep)) {
      return null; // escapes root
    }
    // If it exists, ensure the REAL (symlink-resolved) target also stays
    // inside root — a symlink whose target escapes must never be honored.
    try {
      const real = fs.realpathSync(resolved);
      if (real !== rootAbs && !real.startsWith(rootWithSep)) return null;
    } catch {
      /* doesn't exist / broken symlink — the resolved-path check above stands */
    }
    return resolved;
  } catch {
    return null; // malformed input — fail-closed
  }
}

// ── Shape (a): handoff-live-*.md ────────────────────────────────────────────

function listHandoffLive(rootAbs) {
  const dir = path.join(rootAbs, ".claude", "runtime");
  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const matches = [];
  for (const name of entries) {
    // EXACT shape only — no `.bak`, no path segments in the name.
    if (!HANDOFF_LIVE_RE.test(name)) continue;
    const full = path.join(dir, name);
    const safe = safeResolve(rootAbs, full);
    if (!safe) continue;
    let st;
    try {
      st = fs.lstatSync(safe); // lstat: symlinks are NEVER treated as a plain file
    } catch {
      continue;
    }
    if (!st.isFile()) continue; // refuses symlinks, dirs, anything non-regular
    matches.push({ path: safe, mtime: st.mtimeMs, shape: "handoff-live" });
  }
  matches.sort((a, b) => b.mtime - a.mtime); // newest first
  return matches;
}

// ── Shape (b): handoffs/* older than RETENTION_HANDOFF_DAYS ───────────────

function listHandoffsDirOld(rootAbs, now) {
  const dir = path.join(rootAbs, ".claude", "runtime", "handoffs");
  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const cutoff = now - RETENTION_HANDOFF_DAYS * DAY_MS;
  const out = [];
  for (const name of entries) {
    const full = path.join(dir, name);
    const safe = safeResolve(rootAbs, full);
    if (!safe) continue;
    let st;
    try {
      st = fs.lstatSync(safe);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    if (st.mtimeMs < cutoff) out.push({ path: safe, mtime: st.mtimeMs, shape: "handoffs-dir" });
  }
  return out;
}

// ── Shape (c): the ONE named stray error log ────────────────────────────────

function namedErrLog(rootAbs) {
  const full = path.join(rootAbs, NAMED_ERR_LOG_REL);
  const safe = safeResolve(rootAbs, full);
  if (!safe) return [];
  let st;
  try {
    st = fs.lstatSync(safe);
  } catch {
    return [];
  }
  if (!st.isFile()) return [];
  return [{ path: safe, mtime: st.mtimeMs, shape: "named-err-log" }];
}

// ── planRetention / applyRetention ──────────────────────────────────────────

/**
 * Compute the intended delete-set. NEVER deletes anything. Per-run cap
 * (MAX_DELETIONS_PER_RUN) truncates the candidate list; `capped:true` signals
 * more matched than the cap allowed (a shape-match bug must not sweep a dir).
 *
 * @param {string} root - project root
 * @param {object} [opts]
 * @param {number} [opts.now] - epoch ms, defaults to Date.now()
 */
function planRetention(root, opts) {
  opts = opts || {};
  const now = typeof opts.now === "number" ? opts.now : Date.now();
  let rootAbs;
  try {
    rootAbs = path.resolve(root);
  } catch {
    return { root: String(root), now, candidates: [], totalCandidates: 0, capped: false };
  }

  const liveFiles = listHandoffLive(rootAbs);
  const liveEligible = liveFiles.slice(HANDOFF_LIVE_KEEP); // keep newest N, rest eligible
  const oldHandoffs = listHandoffsDirOld(rootAbs, now);
  const namedLog = namedErrLog(rootAbs);

  const candidates = [...liveEligible, ...oldHandoffs, ...namedLog];
  const capped = candidates.length > MAX_DELETIONS_PER_RUN;
  const bounded = candidates.slice(0, MAX_DELETIONS_PER_RUN);

  return {
    root: rootAbs,
    now,
    candidates: bounded,
    totalCandidates: candidates.length,
    capped,
  };
}

/**
 * Apply the plan. DRY-RUN unless `opts.apply === true` — a missing/false
 * `apply` deletes NOTHING (same shape as planRetention, just echoing the
 * plan). On apply, deletes at most MAX_DELETIONS_PER_RUN files, re-verifying
 * containment immediately before each unlink (defense in depth), and emits a
 * `retention-applied` audit event with counts.
 */
function applyRetention(root, opts) {
  opts = opts || {};
  const plan = planRetention(root, opts);
  if (opts.apply !== true) {
    return { ...plan, applied: false, deleted: [], skipped: [] };
  }

  const deleted = [];
  const skipped = [];
  for (const c of plan.candidates) {
    try {
      const safe = safeResolve(plan.root, c.path);
      if (!safe) {
        skipped.push({ ...c, reason: "escapes-root" });
        continue;
      }
      fs.unlinkSync(safe);
      deleted.push(c);
    } catch (e) {
      skipped.push({ ...c, reason: String((e && e.message) || e) });
    }
  }

  // Audit event — best-effort, lazy require to avoid a load-order cycle.
  try {
    const { logEvent } = require("./logger");
    logEvent(
      "retention",
      "system",
      "retention-applied",
      plan.root,
      `deleted=${deleted.length} skipped=${skipped.length} totalCandidates=${plan.totalCandidates}`,
      {
        deleted: deleted.length,
        skipped: skipped.length,
        totalCandidates: plan.totalCandidates,
        capped: plan.capped,
      },
    );
  } catch {
    /* audit is best-effort — never block on a logger fault */
  }

  return { ...plan, applied: true, deleted, skipped };
}

module.exports = {
  RETENTION_HANDOFF_DAYS,
  HANDOFF_LIVE_KEEP,
  MAX_DELETIONS_PER_RUN,
  HANDOFF_LOAD_DAYS,
  HANDOFF_LIVE_RE,
  NAMED_ERR_LOG_REL,
  safeResolve,
  planRetention,
  applyRetention,
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const rootIdx = args.indexOf("--root");
  const root =
    rootIdx !== -1 && args[rootIdx + 1]
      ? args[rootIdx + 1]
      : process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const result = applyRetention(root, { apply });
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(0);
}
