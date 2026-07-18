#!/usr/bin/env node
"use strict";

/**
 * events-compact.js — the C1 EVENT COMPACTOR (SP-20260718-002, D-1 CORE-4).
 *
 * THE CORE SAFETY INVARIANT (operator D-1 + Phase-0 CORE-4): raw history is
 * NEVER destroyed. Compaction SUMMARIZES; it does not delete. This module is the
 * runtime side of the kernel contract's never-lose-raw-history rule for the
 * events subsystem, and is data-integrity-critical.
 *
 * THE LOAD-BEARING MECHANISM — whole-file-archive → reseed-a-bounded-tail (NOT
 * slice-archive + hot-log-rewrite). The ONLY destructive rename on the raw
 * events file is `archive.archive(eventsFile)` (S5), which lives INSIDE the
 * FROZEN archive.js (a MOVE into the indexed, restorable archive tier — never a
 * delete). This module's ONLY mutations of the events file are:
 *   • S5  archive.archive(eventsFile)  — the move (rename inside archive.js)
 *   • S9  fs.appendFileSync(eventsFile, summary + tail)  — the additive reseed
 * It NEVER calls fs.unlink / fs.rmSync / fs.truncate / fs.renameSync /
 * fs.writeFileSync on the events file. That makes the "no raw event unlinked"
 * property (AC-4) true BY CONSTRUCTION, verified by a grep/AST test over this
 * very source.
 *
 * NEVER THROWS: every fs call is wrapped; any fault degrades to a clean no-op
 * that CONSERVES (the events file is left in a recoverable state). The one
 * exception is the REQUIRE-TIME invariant below (fail-loud on a misconfigured
 * constant ordering — a load-time guard, not a runtime path).
 *
 * WRITE-AHEAD SEAM SEQUENCE (S0..S10). Each seam is a labelled point; the
 * test-only `crashAfter` hook performs a seam's disk side-effect then returns a
 * CLEAN early { ok:false, reason:"test-crash-injected", crashedAfter } — a
 * return, NOT a throw (composes with the never-throw contract) — so every
 * crash-recovery boundary is falsifiable (AC-3).
 *
 *   S0  reconcileOrphans(root)         — re-index any on-disk archived generation
 *                                        missing from the index (runs FIRST)
 *   S1  resolve the events file path
 *   S2  read the events file           — missing/empty/unreadable ⇒ no-op
 *   S3  FOLD_TRIGGER gate              — under trigger ⇒ no-op (nothing to fold)
 *   S4  acquire the single-writer lock — held ⇒ no-op reason:"locked"
 *   S5  archive.archive(eventsFile)    — THE destructive move (into archive.js)
 *   S6  evaluate the move             — !ok ⇒ fail-closed no-op (events intact)
 *   S7  indexed:false branch          — reseed + summary(index_pending) + LOUD
 *                                        error + non-zero exit (never silent-green)
 *   S8  build the compaction summary
 *   S9  fs.appendFileSync reseed       — summary record + bounded raw TAIL
 *   S10 release lock + return ok
 *
 * CRASH-RECOVERY CONVERGENCE (β rider #1, resolution b): after a post-S5 crash
 * the live log is EMPTY (0 < FOLD_TRIGGER) so the NEXT pass is a clean no-op —
 * the old tail is NOT auto-reseeded; it repopulates from new appends and stays
 * queryable via the archive. There is deliberately NO crash-recovery reseed
 * branch.
 */

const fs = require("fs");
const path = require("path");
const archive = require("../hooks/lib/archive");

// ── Named constants + REQUIRE-TIME fail-loud invariant ──────────────────────
// TAIL_KEEP_LINES < FOLD_TRIGGER_LINES < OPERATIONAL_CAP (rotate SINK_CAPS
// operational cap). Folding must trigger well before the rotate cap so the
// events file is compacted (its history moved to the archive tier) before
// rotation would archive a raw generation for size alone; the reseeded tail must
// be strictly smaller than the fold trigger so a freshly-compacted file does not
// immediately re-fold (idempotence / convergence). A misordering here is a
// configuration BUG, not a runtime condition — fail LOUD at require time.
const TAIL_KEEP_LINES = 2000;
const FOLD_TRIGGER_LINES = 8000;
const OPERATIONAL_CAP = 20000; // mirrors rotate.js CAP_CLASSES.operational.cap

if (!(TAIL_KEEP_LINES < FOLD_TRIGGER_LINES && FOLD_TRIGGER_LINES < OPERATIONAL_CAP)) {
  throw new Error(
    `events-compact invariant violated: require TAIL_KEEP_LINES(${TAIL_KEEP_LINES}) < ` +
      `FOLD_TRIGGER_LINES(${FOLD_TRIGGER_LINES}) < OPERATIONAL_CAP(${OPERATIONAL_CAP})`,
  );
}

// ── Path helpers ────────────────────────────────────────────────────────────

/** The events file for `root` (mirrors logger.js LOG_FILE layout). */
function eventsFilePath(rootAbs) {
  return path.join(rootAbs, ".claude", "project", "events", "events.jsonl");
}

/**
 * The compactor's single-writer lock path — DETERMINISTIC so a caller/test can
 * pre-acquire the SAME lock (via archive.tryLock) to prove the no-op-when-held
 * contract. Lives under runtime/ (walk-skipped + gitignored).
 */
function compactLockPath(rootAbs) {
  return path.join(rootAbs, ".claude", "runtime", "compact-locks", "events.lock");
}

/** Relative-to-root, forward-slashed (index convention). */
function relFromRoot(rootAbs, abs) {
  try {
    return path.relative(rootAbs, abs).replace(/\\/g, "/");
  } catch {
    return null;
  }
}

/** Count non-empty JSONL lines — best-effort, never throws. */
function countLinesSafe(file) {
  try {
    const content = fs.readFileSync(file, "utf8");
    return content.length === 0 ? 0 : content.split("\n").filter(Boolean).length;
  } catch {
    return null;
  }
}

// ── Test-only crash seam ─────────────────────────────────────────────────────
// The `crashAfter` hook is honored ONLY under an explicit test env flag, and is
// NEVER exposed as a documented CLI flag (the CLI main below parses no such
// argument). Belt-and-suspenders: even a programmatic caller cannot trip a seam
// abort in production unless WARPOS_COMPACT_ALLOW_CRASH is set.
function crashEnabled() {
  return process.env.WARPOS_COMPACT_ALLOW_CRASH === "1";
}
function crashReturn(seam, extra) {
  return Object.assign({ ok: false, reason: "test-crash-injected", crashedAfter: seam }, extra || {});
}

// ── Compaction summary record ────────────────────────────────────────────────

let _seq = 0;
function summaryId() {
  const ts = Date.now().toString(36);
  _seq++;
  return `EVT-compact-${ts}-${process.pid}-${_seq}`;
}

/**
 * Summarize an archived generation (the whole pre-fold file). event_count is the
 * number of parseable event objects; id_range endpoints are the first/last event
 * id in file (append/chronological) order; ts_range min/max is over ISO
 * timestamps (which sort chronologically). Never throws.
 */
function computeSummary(events) {
  const withId = events.filter((e) => e && typeof e.id === "string");
  let idMin = null;
  let idMax = null;
  if (withId.length) {
    idMin = withId[0].id;
    idMax = withId[withId.length - 1].id;
  }
  let tsMin = null;
  let tsMax = null;
  for (const e of events) {
    if (!e || typeof e.ts !== "string") continue;
    if (tsMin === null || e.ts < tsMin) tsMin = e.ts;
    if (tsMax === null || e.ts > tsMax) tsMax = e.ts;
  }
  return {
    event_count: events.length,
    id_range: { min: idMin, max: idMax },
    ts_range: { min: tsMin, max: tsMax },
  };
}

/** Build the compaction-summary record (exact shape per build_spec §C1). */
function buildSummaryRecord(data) {
  return {
    id: summaryId(),
    ts: new Date().toISOString(),
    cat: "audit",
    actor: "compactor",
    type: "compaction-summary",
    data,
  };
}

// ── The reseed (S9) — additive appendFileSync ONLY ───────────────────────────
/**
 * Reseed the (now-archived-away) events file with the summary record followed by
 * the bounded raw TAIL. This is the module's ONLY additive write to the events
 * file, and it uses fs.appendFileSync EXCLUSIVELY — never writeFileSync, never a
 * rename. appendFileSync creates the file if absent (it is: the S5 move renamed
 * the old file into the archive tier). Never throws.
 *
 * `partial` simulates a torn/partial append (crashAfter:"S9-partial") by writing
 * only a prefix of the payload — still via appendFileSync.
 */
function reseed(eventsFile, summaryRecord, tailLines, partial) {
  try {
    const summaryLine = JSON.stringify(summaryRecord) + "\n";
    const tailBlock = tailLines.length ? tailLines.join("\n") + "\n" : "";
    let payload = summaryLine + tailBlock;
    if (partial) {
      payload = payload.slice(0, Math.max(1, Math.floor(payload.length / 2)));
    }
    fs.appendFileSync(eventsFile, payload, "utf8");
    return true;
  } catch {
    return false;
  }
}

// ── S0: reconcile orphans ────────────────────────────────────────────────────
/**
 * Dir-scan the archive tier vs the index; re-index any on-disk archived
 * generation that is MISSING from the index (reason:"reconcile:orphan"). This is
 * the recovery seam for an archive that landed on disk but whose index write
 * failed (S7 indexed:false) or a crash between the move and the index append.
 * IDEMPOTENT: a generation already present in the index is skipped. Never throws.
 *
 * @returns {{reconciled:number}}
 */
function reconcileOrphans(rootAbs) {
  try {
    rootAbs = path.resolve(rootAbs);
    const dir = archive.archiveDir(rootAbs);
    let entries;
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return { reconciled: 0 }; // no archive tier yet — nothing to reconcile
    }
    const indexed = new Set();
    for (const e of archive.readIndex(rootAbs)) {
      if (e && typeof e.archived === "string") indexed.add(path.basename(e.archived));
    }
    let count = 0;
    for (const name of entries) {
      if (name === archive.INDEX_BASENAME) continue;
      if (indexed.has(name)) continue;
      const full = path.join(dir, name);
      let st;
      try {
        st = fs.lstatSync(full);
      } catch {
        continue;
      }
      if (!st.isFile()) continue;
      const rel = relFromRoot(rootAbs, full);
      const entry = {
        ts: new Date().toISOString(),
        origin: null, // origin unknown for a dir-scan-recovered generation
        archived: rel,
        shape: "reconcile",
        reason: "reconcile:orphan",
        bytes: typeof st.size === "number" ? st.size : null,
        lines: countLinesSafe(full),
        reconciled: true,
      };
      if (archive.appendIndex(rootAbs, entry)) count++;
    }
    return { reconciled: count };
  } catch {
    return { reconciled: 0 };
  }
}

// ── The compactor ────────────────────────────────────────────────────────────
/**
 * Fold the events file ONCE: archive the whole file into the (indexed,
 * restorable) archive tier, then reseed a bounded raw TAIL + a compaction-summary
 * record. Idempotent, single-writer, fail-closed, NEVER throws.
 *
 * @param {string} rootAbs  trusted project root (the archive tier is anchored to it)
 * @param {object} [opts]
 * @param {boolean} [opts.apply=true]  false ⇒ dry-run (no disk mutation)
 * @param {string}  [opts.crashAfter]  TEST-ONLY seam-abort label (honored only
 *                                      under WARPOS_COMPACT_ALLOW_CRASH=1)
 * @returns {object} a lean result envelope; ok:false + reason on any fault.
 */
function compactOnce(rootAbs, opts) {
  opts = opts || {};
  const apply = opts.apply !== false; // default: apply
  const crashAfter = crashEnabled() ? opts.crashAfter || null : null;

  try {
    rootAbs = path.resolve(rootAbs);
  } catch {
    return { ok: false, reason: "bad-root", exitCode: 1 };
  }

  // S0 — reconcile orphans FIRST (recovery is idempotent + runs every pass).
  let reconciled = 0;
  try {
    reconciled = reconcileOrphans(rootAbs).reconciled || 0;
  } catch {
    reconciled = 0;
  }
  if (crashAfter === "S0") return crashReturn("S0", { reconciled });

  // S1 — resolve the events file.
  const eventsFile = eventsFilePath(rootAbs);
  if (crashAfter === "S1") return crashReturn("S1");

  // S2 — read (missing/unreadable ⇒ clean no-op).
  let content;
  try {
    content = fs.readFileSync(eventsFile, "utf8");
  } catch {
    return { ok: true, reason: "no-events-file", compacted: false, reconciled, exitCode: 0 };
  }
  const lines = content.length ? content.split("\n").filter(Boolean) : [];
  if (crashAfter === "S2") return crashReturn("S2");

  // S3 — FOLD_TRIGGER gate.
  if (lines.length < FOLD_TRIGGER_LINES) {
    return {
      ok: true,
      reason: "below-fold-trigger",
      compacted: false,
      lineCount: lines.length,
      reconciled,
      exitCode: 0,
    };
  }
  if (crashAfter === "S3") return crashReturn("S3");

  // Parse events + compute the summary fields (in-memory; no disk mutation yet).
  const events = [];
  for (const l of lines) {
    try {
      events.push(JSON.parse(l));
    } catch {
      /* a torn/non-JSON line is still archived (whole file moves) — no loss */
    }
  }
  const summaryData = computeSummary(events);
  const tailLines = lines.slice(Math.max(0, lines.length - TAIL_KEEP_LINES));

  // Dry-run — report intent without touching disk.
  if (!apply) {
    return {
      ok: true,
      reason: "dry-run",
      compacted: false,
      wouldCompact: true,
      lineCount: lines.length,
      reconciled,
      summary: summaryData,
      exitCode: 0,
    };
  }

  // S4 — single-writer lock. Held ⇒ no-op (another writer owns the fold).
  const lockPath = compactLockPath(rootAbs);
  let release = null;
  try {
    release = archive.tryLock(lockPath);
  } catch {
    release = null;
  }
  if (release === null) {
    return { ok: true, reason: "locked", compacted: false, reconciled, exitCode: 0 };
  }
  if (crashAfter === "S4") {
    try {
      release();
    } catch {
      /* ignore */
    }
    return crashReturn("S4");
  }

  try {
    // S5 — THE destructive move: archive the WHOLE events file. The rename lives
    // inside the FROZEN archive.js; this module never renames the events file.
    let ares;
    try {
      ares = archive.archive(eventsFile, {
        root: rootAbs,
        reason: "compaction:fold",
        shape: "operational",
      });
    } catch {
      ares = { ok: false, reason: "archive-threw" };
    }
    if (crashAfter === "S5") return crashReturn("S5", { archived: ares && ares.archived });

    // S6 — evaluate the move. If it did not happen, the events file is UNTOUCHED
    // (archive.js keeps the source on any rename fault) ⇒ fail-closed clean no-op.
    if (!ares || !ares.ok) {
      return {
        ok: false,
        reason: "archive-failed",
        detail: (ares && ares.reason) || null,
        compacted: false,
        reconciled,
        exitCode: 1,
      };
    }
    if (crashAfter === "S6") return crashReturn("S6", { archived: ares.archived });

    const archivedRef =
      (ares.entry && typeof ares.entry.archived === "string" && ares.entry.archived) ||
      relFromRoot(rootAbs, ares.archived);

    // S7 — indexed:false. The generation is ON DISK but NOT in the index. Still
    // reseed the tail (live must not be left empty), write the summary flagged
    // index_pending with NO resolvable ref, emit a LOUD error, and exit NON-ZERO.
    // Never proceed silently green. reconcileOrphans (S0) re-indexes it next pass.
    if (ares.indexed === false) {
      const summary = buildSummaryRecord(
        Object.assign({}, summaryData, { archived_generation_ref: null, index_pending: true }),
      );
      reseed(eventsFile, summary, tailLines, crashAfter === "S9-partial");
      try {
        // eslint-disable-next-line no-console
        console.error(
          `[events-compact] ARCHIVE INDEXED:FALSE — generation is on disk but UNINDEXED at ` +
            `${ares.archived}. Summary flagged index_pending; reconcileOrphans will re-index next ` +
            `pass. FAIL-CLOSED (non-zero exit).`,
        );
      } catch {
        /* never let logging crash the compactor */
      }
      if (crashAfter === "S7") return crashReturn("S7", { archived: ares.archived });
      return {
        ok: false,
        reason: "index-pending",
        compacted: true,
        indexed: false,
        archived: ares.archived,
        summary_id: summary.id,
        reconciled,
        exitCode: 1,
      };
    }

    // S8 — build the compaction summary (normal, indexed path).
    const summary = buildSummaryRecord(
      Object.assign({}, summaryData, { archived_generation_ref: archivedRef }),
    );
    if (crashAfter === "S8") return crashReturn("S8", { archived: ares.archived });

    // S9 — additive reseed (summary record + bounded raw tail) via appendFileSync.
    const partial = crashAfter === "S9-partial";
    reseed(eventsFile, summary, tailLines, partial);
    if (partial) return crashReturn("S9-partial", { archived: ares.archived });
    if (crashAfter === "S9") return crashReturn("S9", { archived: ares.archived });

    // S10 — done.
    return {
      ok: true,
      reason: "compacted",
      compacted: true,
      indexed: true,
      archived: ares.archived,
      archived_generation_ref: archivedRef,
      summary_id: summary.id,
      tail_lines: tailLines.length,
      event_count: summaryData.event_count,
      reconciled,
      exitCode: 0,
    };
  } finally {
    if (typeof release === "function") {
      try {
        release();
      } catch {
        /* already released / gone */
      }
    }
  }
}

module.exports = {
  TAIL_KEEP_LINES,
  FOLD_TRIGGER_LINES,
  OPERATIONAL_CAP,
  eventsFilePath,
  compactLockPath,
  computeSummary,
  buildSummaryRecord,
  reconcileOrphans,
  compactOnce,
};

// ── CLI (production entrypoint) ──────────────────────────────────────────────
// No crashAfter argument is parsed here — the seam-abort hook is programmatic +
// env-gated only, never a documented CLI flag. Exits non-zero on a fault so a
// scheduler/hook sees the failure (S7 index-pending, archive-failed).
if (require.main === module) {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const res = compactOnce(root, { apply: true });
  try {
    // eslint-disable-next-line no-console
    process.stdout.write(JSON.stringify(res) + "\n");
  } catch {
    /* best-effort */
  }
  process.exit(res && typeof res.exitCode === "number" ? res.exitCode : 0);
}
