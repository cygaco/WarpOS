#!/usr/bin/env node
"use strict";

/**
 * retention.js — conservative-by-construction ARCHIVING of transient runtime
 * cruft (loose `handoff-live-*.md`, stale `handoffs/*`, one stray error log).
 *
 * D-1 (operator directive 2026-07-17): raw history is NEVER destroyed. The
 * "destructive" path is a MOVE-TO-ARCHIVE (scripts/hooks/lib/archive.js), not a
 * delete — every eligible transient moves into the accessible, indexed archive
 * tier. This shrinks the two deletion CRITs to recoverable moves:
 *   • F-RET-1 (TOCTOU delete): the terminal op is a rename INTO our own archive
 *     under the trusted root — a swapped ancestor can at worst archive an
 *     in-root file (recoverable, contained), never unlink an arbitrary path.
 *   • F-RET-2 (untrusted deletion root): apply REQUIRES a trusted root (an
 *     existing project dir with `.claude/`), passed explicitly — NEVER derived
 *     from hook `event.cwd`.
 *
 * DRY-RUN is the DEFAULT: `planRetention()` never moves anything, and
 * `applyRetention()` only archives under `{apply:true}` AND a trusted root AND a
 * single-writer lock (F-RET-1 non-racy host — many sessions start concurrently).
 *
 * ALLOWLIST OF EXACT SHAPES ONLY — nothing else is ever eligible:
 *   (a) `.claude/runtime/handoff-live-*.md` — keep newest HANDOFF_LIVE_KEEP by
 *       mtime, keep anything modified within HANDOFF_LIVE_RECENT_DAYS, and keep
 *       anything PROTECTED (loaded this session / referenced by an active
 *       sprint). Basename allowlist regex (no `..`, no traversal, no symlink).
 *   (b) `.claude/runtime/handoffs/*` — files older than RETENTION_HANDOFF_DAYS,
 *       unless PROTECTED.
 *   (c) the ONE named file `runtime/s-pf-03-security-review.err.log` (exact path).
 *
 * Every resolved target MUST path.resolve() to inside `root`; anything that
 * escapes (`..`, absolute-outside, symlink target outside root) is refused.
 * A per-run cap (MAX_DELETIONS_PER_RUN), allocated ACROSS shape classes so no
 * single class starves the others, bounds the blast radius. Fail-closed
 * throughout: a shape that cannot be safely resolved is SKIPPED, never moved.
 *
 *   node scripts/hooks/lib/retention.js [--apply] [--root <dir>]
 */

const fs = require("fs");
const path = require("path");

// ── Named constants (the retention contract) ───────────────────────────────
const RETENTION_HANDOFF_DAYS = 14;
const HANDOFF_LIVE_KEEP = 10;
// Keep any live handoff touched within this window even if it is beyond the
// newest-N by rank — "recent OR newest-N" (amendment #4). Must stay < the
// handoffs/* cutoff and > the session-start load window.
const HANDOFF_LIVE_RECENT_DAYS = 3;
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
// F-RET-3: basename allowlist — the sid is [A-Za-z0-9_-] (session-start strips
// everything else), so `.` can never appear inside the sid. This CANNOT match
// `handoff-live-..md` (the loose `.+` did). Defense-in-depth: safeResolve +
// lstat already block a live escape; this refuses the malformed shape outright.
const HANDOFF_LIVE_RE = /^handoff-live-[A-Za-z0-9_-]+\.md$/;
const NAMED_ERR_LOG_REL = path.join("runtime", "s-pf-03-security-review.err.log");

// archive.js is dependency-light (fs/path only). Lazy-require so a missing
// archive tier degrades to "archive nothing" (never a raw delete — D-1).
let _archive = null;
try {
  _archive = require("./archive");
} catch {
  _archive = null;
}

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

/**
 * F-RET-2: a trusted root is an ABSOLUTE path to an EXISTING directory that
 * contains a `.claude/` dir (structural proof it is a real project checkout,
 * not an arbitrary attacker-supplied path). apply REFUSES without this.
 */
function isTrustedRoot(rootAbs) {
  try {
    if (!rootAbs || !path.isAbsolute(rootAbs)) return false;
    const st = fs.statSync(rootAbs);
    if (!st.isDirectory()) return false;
    return fs.existsSync(path.join(rootAbs, ".claude"));
  } catch {
    return false;
  }
}

// ── Protected set (F-RET-4 + amendment #4) ──────────────────────────────────

/**
 * Build the set of absolute paths that must NEVER be archived: the caller's
 * explicit `protected` list (e.g. the handoff-live file session-start just
 * loaded) PLUS anything referenced by an active/resumable sprint (best-effort).
 */
function buildProtectedSet(rootAbs, opts) {
  const set = new Set();
  const add = (p) => {
    const safe = safeResolve(rootAbs, path.isAbsolute(p) ? p : path.join(rootAbs, p));
    if (safe) set.add(safe);
  };
  const explicit = (opts && opts.protected) || [];
  if (Array.isArray(explicit)) {
    for (const p of explicit) {
      if (typeof p === "string" && p) add(p);
    }
  }
  // Sprint-referenced handoffs (best-effort, fail-open). An active/resumable
  // sprint may name a handoff it intends to resume from; never prune it.
  try {
    for (const ref of referencedByActiveSprint(rootAbs)) add(ref);
  } catch {
    /* best-effort — a sprint-state read fault must never widen the delete set,
       and must never THROW (fail-open = keep MORE, which is the safe direction) */
  }
  return set;
}

/**
 * Best-effort: absolute paths of handoff files referenced by an active sprint's
 * on-disk state. Returns [] on any error (fail-open toward keeping files).
 */
function referencedByActiveSprint(rootAbs) {
  const out = [];
  const stateDir = path.join(rootAbs, ".claude", "runtime", "sprint");
  let entries = [];
  try {
    entries = fs.readdirSync(stateDir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (!name.endsWith(".json")) continue;
    let txt;
    try {
      txt = fs.readFileSync(path.join(stateDir, name), "utf8");
    } catch {
      continue;
    }
    // Pull any `handoff-live-<sid>.md` basenames the sprint state mentions.
    const m = txt.match(/handoff-live-[A-Za-z0-9_-]+\.md/g);
    if (m) {
      for (const b of m) out.push(path.join(rootAbs, ".claude", "runtime", b));
    }
  }
  return out;
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
    // EXACT shape only — basename allowlist (no `.bak`, no `..`, no path segments).
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

/** handoff-live eligibility: NOT (newest-N OR recent OR protected). */
function eligibleHandoffLive(rootAbs, now, protectedSet) {
  const all = listHandoffLive(rootAbs);
  const recentCutoff = now - HANDOFF_LIVE_RECENT_DAYS * DAY_MS;
  const out = [];
  all.forEach((f, rank) => {
    if (rank < HANDOFF_LIVE_KEEP) return; // newest-N kept
    if (f.mtime >= recentCutoff) return; // recent kept (amendment #4)
    if (protectedSet.has(f.path)) return; // loaded/sprint-referenced kept (F-RET-4)
    out.push(f);
  });
  return out;
}

// ── Shape (b): handoffs/* older than RETENTION_HANDOFF_DAYS ───────────────

function listHandoffsDirOld(rootAbs, now, protectedSet) {
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
    if (protectedSet.has(safe)) continue; // referenced kept
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

function namedErrLog(rootAbs, protectedSet) {
  const full = path.join(rootAbs, NAMED_ERR_LOG_REL);
  const safe = safeResolve(rootAbs, full);
  if (!safe) return [];
  if (protectedSet.has(safe)) return [];
  let st;
  try {
    st = fs.lstatSync(safe);
  } catch {
    return [];
  }
  if (!st.isFile()) return [];
  return [{ path: safe, mtime: st.mtimeMs, shape: "named-err-log" }];
}

// ── Per-class round-robin cap (design point) ────────────────────────────────
// A flat cap over a concatenated list lets one flooded class (143 handoff-live)
// fill the whole per-run cap so handoffs/* + the err log are NEVER reached.
// Interleave the classes round-robin BEFORE applying the total cap so every
// class makes progress each run.
function roundRobinMerge(classLists) {
  const out = [];
  const lists = classLists.filter((l) => l && l.length);
  let i = 0;
  while (lists.some((l) => i < l.length)) {
    for (const l of lists) {
      if (i < l.length) out.push(l[i]);
    }
    i++;
  }
  return out;
}

// ── planRetention / applyRetention ──────────────────────────────────────────

/**
 * Compute the intended archive-set. NEVER moves anything. Per-run cap
 * (MAX_DELETIONS_PER_RUN), allocated round-robin across shape classes, truncates
 * the candidate list; `capped:true` signals more matched than the cap allowed.
 *
 * @param {string} root - project root
 * @param {object} [opts]
 * @param {number} [opts.now] - epoch ms, defaults to Date.now()
 * @param {string[]} [opts.protected] - absolute/relative paths to never archive
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

  const protectedSet = buildProtectedSet(rootAbs, opts);
  const liveEligible = eligibleHandoffLive(rootAbs, now, protectedSet);
  const oldHandoffs = listHandoffsDirOld(rootAbs, now, protectedSet);
  const namedLog = namedErrLog(rootAbs, protectedSet);

  const merged = roundRobinMerge([liveEligible, oldHandoffs, namedLog]);
  const capped = merged.length > MAX_DELETIONS_PER_RUN;
  const bounded = merged.slice(0, MAX_DELETIONS_PER_RUN);

  return {
    root: rootAbs,
    now,
    candidates: bounded,
    totalCandidates: merged.length,
    capped,
    protectedCount: protectedSet.size,
  };
}

/**
 * Apply the plan by ARCHIVING (moving to the archive tier), NOT deleting. DRY-RUN
 * unless `opts.apply === true`. Apply additionally REQUIRES a trusted root
 * (F-RET-2) and a single-writer lock (F-RET-1 non-racy host); without either it
 * REFUSES (archives nothing). Re-verifies containment immediately before each
 * move (defense in depth), self-caps the move loop (F-RET-5), and emits a
 * `retention-applied` audit event with a REDACTED root (F-RET-6).
 */
function applyRetention(root, opts) {
  opts = opts || {};
  const plan = planRetention(root, opts);
  if (opts.apply !== true) {
    return { ...plan, applied: false, archived: [], skipped: [] };
  }

  // F-RET-2: apply only under a trusted root.
  if (!isTrustedRoot(plan.root)) {
    return { ...plan, applied: false, refused: true, reason: "untrusted-root", archived: [], skipped: [] };
  }
  // D-1: without an archive tier we must NOT fall back to deletion.
  if (!_archive) {
    return { ...plan, applied: false, refused: true, reason: "no-archive-tier", archived: [], skipped: [] };
  }

  // F-RET-1: single-writer lock — concurrent sessions must not all prune.
  const lockPath = path.join(plan.root, ".claude", "runtime", "retention.lock");
  let release = null;
  try {
    release = _archive.tryLock(lockPath, { staleMs: 5 * 60 * 1000 });
  } catch {
    release = null;
  }
  if (release === null) {
    return { ...plan, applied: false, reason: "locked", archived: [], skipped: [] };
  }

  const archived = [];
  const skipped = [];
  try {
    let moved = 0;
    for (const c of plan.candidates) {
      // F-RET-5: self-cap the move loop independently of the plan cap.
      if (moved >= MAX_DELETIONS_PER_RUN) {
        skipped.push({ ...c, reason: "per-run-cap" });
        continue;
      }
      // Re-verify containment immediately before the move (TOCTOU defense).
      const safe = safeResolve(plan.root, c.path);
      if (!safe) {
        skipped.push({ ...c, reason: "escapes-root" });
        continue;
      }
      const res = _archive.archive(safe, {
        root: plan.root,
        reason: "retention:" + (c.shape || "unknown"),
        shape: c.shape || null,
      });
      if (res && res.ok) {
        // Propagate the index status per item so an index-write failure is
        // VISIBLE at the caller (not swallowed) — the archived file is safe on
        // disk, but a false `indexed` means it is off the query/restore seam.
        archived.push({ ...c, archived: res.entry && res.entry.archived, indexed: res.indexed });
        moved++;
      } else {
        skipped.push({ ...c, reason: (res && res.reason) || "archive-failed" });
      }
    }
  } finally {
    if (typeof release === "function") release();
  }

  // How many archived items FAILED to index (surfaced, not swallowed).
  const indexFailures = archived.filter((a) => a.indexed === false).length;

  // Audit event — best-effort, lazy require to avoid a load-order cycle. F-RET-6:
  // log the archive-relative origins (already relative) and a REDACTED root
  // (basename only), never the absolute project path.
  try {
    const { logEvent } = require("./logger");
    logEvent(
      "retention",
      "system",
      "retention-applied",
      path.basename(plan.root), // redacted — no absolute path leakage
      `archived=${archived.length} skipped=${skipped.length} indexFailures=${indexFailures} totalCandidates=${plan.totalCandidates}`,
      {
        archived: archived.length,
        skipped: skipped.length,
        indexFailures,
        totalCandidates: plan.totalCandidates,
        capped: plan.capped,
        protectedCount: plan.protectedCount,
      },
    );
  } catch {
    /* audit is best-effort — never block on a logger fault */
  }

  return { ...plan, applied: true, archived, skipped, indexFailures };
}

module.exports = {
  RETENTION_HANDOFF_DAYS,
  HANDOFF_LIVE_KEEP,
  HANDOFF_LIVE_RECENT_DAYS,
  MAX_DELETIONS_PER_RUN,
  HANDOFF_LOAD_DAYS,
  HANDOFF_LIVE_RE,
  NAMED_ERR_LOG_REL,
  safeResolve,
  isTrustedRoot,
  buildProtectedSet,
  referencedByActiveSprint,
  planRetention,
  applyRetention,
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const rootIdx = args.indexOf("--root");
  // F-RET-2: an EXPLICIT trusted-root SOURCE is required for the destructive
  // (--apply) path — an explicit `--root` or CLAUDE_PROJECT_DIR. We must NEVER
  // silently default to process.cwd() for a move: cwd could coincidentally hold
  // a `.claude/` (passing isTrustedRoot) and get swept though it is not the
  // intended project. process.cwd() remains the fallback ONLY for a read-only
  // dry-run (no apply), where it deletes/moves nothing.
  const rootArg = rootIdx !== -1 && args[rootIdx + 1] ? args[rootIdx + 1] : null;
  const explicitRoot = rootArg || process.env.CLAUDE_PROJECT_DIR || null;
  if (apply && !explicitRoot) {
    const dry = applyRetention(process.cwd(), { apply: false });
    process.stdout.write(
      JSON.stringify(
        { ...dry, applied: false, refused: true, reason: "apply-needs-explicit-root" },
        null,
        2,
      ) + "\n",
    );
    process.stderr.write(
      "retention: refusing --apply without an explicit --root or CLAUDE_PROJECT_DIR " +
        "(a destructive move must not default to process.cwd()). Showing a dry-run instead.\n",
    );
    process.exit(0);
  }
  const root = explicitRoot || process.cwd();
  const result = applyRetention(root, { apply });
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(0);
}
