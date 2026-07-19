"use strict";
/**
 * do-not-reopen.js — cross-session append-only ledger of settled dispositions
 * (SP-20260718-005 BE-5, AC-8/AC-7b).
 *
 * A resumed session must not silently reverse a decision that was already
 * settled by a prior session. The ledger is APPEND-ONLY: settling a
 * disposition writes a durable entry; reversing it REQUIRES an explicit
 * supersession entry (never advisory-only surfacing — a resumed session
 * that tries to re-litigate without one is BLOCKED, AC-F8).
 *
 * This is a CROSS-SESSION artifact (SHARP-1): its trust anchor is the
 * append-only file itself + the explicit supersede() primitive — NEVER a
 * per-session HMAC and never "the caller said so" advisory checking.
 *
 * No external deps. Windows + POSIX safe.
 */

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ROOT = path.join(PROJECT_ROOT, ".claude", "runtime");

function ledgerDir(root) {
  return path.join(root || DEFAULT_ROOT, "do-not-reopen");
}
function ledgerPath(spId, root) {
  return path.join(ledgerDir(root), `${spId}.jsonl`);
}
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readEntries(spId, root) {
  let raw;
  try {
    raw = fs.readFileSync(ledgerPath(spId, root), "utf8");
  } catch {
    return [];
  }
  const out = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      /* skip a corrupt/torn line — append-only tolerates a partial last write */
    }
  }
  return out;
}

function appendEntry(spId, root, entry) {
  ensureDir(ledgerDir(root));
  fs.appendFileSync(ledgerPath(spId, root), JSON.stringify(entry) + "\n");
}

/**
 * settle(spId, decisionId, {reason}, {root}) -> {ok:true, entry}
 * Appends a settlement entry. Durable, append-only — not a mutable flag.
 */
function settle(spId, decisionId, meta = {}, opts = {}) {
  const entry = {
    type: "settle",
    decisionId,
    reason: meta && meta.reason != null ? meta.reason : null,
    ts: Date.now(),
  };
  appendEntry(spId, opts.root, entry);
  return { ok: true, entry };
}

/**
 * isSettled(spId, decisionId, {root}) -> boolean
 * TRUE once decisionId has been adjudicated (a settle entry exists) and
 * that adjudication has not been silently discarded — a supersede() entry
 * is ITSELF a new explicit settlement (the only sanctioned way to change
 * the record), so it keeps the decision in a settled state rather than
 * clearing it. A decision with no settle/supersede entry at all is not
 * settled (nothing to protect on resume).
 */
function isSettled(spId, decisionId, opts = {}) {
  const entries = readEntries(spId, opts.root).filter((e) => e && e.decisionId === decisionId);
  return entries.some((e) => e.type === "settle" || e.type === "supersede");
}

/**
 * getDisposition(spId, decisionId, {root}) -> latest entry | null
 * Ledger-visibility helper (AC-7b: the ledger is readable on resume).
 */
function getDisposition(spId, decisionId, opts = {}) {
  const entries = readEntries(spId, opts.root).filter((e) => e && e.decisionId === decisionId);
  if (entries.length === 0) return null;
  return entries[entries.length - 1];
}

/**
 * history(spId, decisionId, {root}) -> entry[]
 * Full ordered history for a decisionId (settle + any supersessions).
 */
function history(spId, decisionId, opts = {}) {
  return readEntries(spId, opts.root).filter((e) => e && e.decisionId === decisionId);
}

/**
 * supersede(spId, decisionId, newEntry, {root}) -> {ok:true, entry}
 * The EXPLICIT supersession primitive — the ONLY sanctioned way to reverse
 * a settled disposition. Appends a "supersede" entry carrying the new
 * decision payload.
 */
function supersede(spId, decisionId, newEntry, opts = {}) {
  const entry = Object.assign({}, newEntry || {}, {
    type: "supersede",
    decisionId,
    ts: Date.now(),
  });
  appendEntry(spId, opts.root, entry);
  return { ok: true, entry };
}

/**
 * tryReopen(spId, decisionId, {supersede: boolean, newEntry?, reason?}, {root})
 *   -> {ok, reason?, entry?}
 * Reopening a settled disposition REQUIRES `supersede:true` (an explicit
 * supersession entry). `supersede:false`/omitted is advisory-only and is
 * REFUSED (AC-F8) — a resumed session may not silently re-litigate.
 */
function tryReopen(spId, decisionId, reopenOpts = {}, opts = {}) {
  const settled = isSettled(spId, decisionId, opts);
  if (!settled) {
    // Nothing settled to protect — there is no disposition to reopen.
    return { ok: true, reason: "not-previously-settled" };
  }
  if (reopenOpts && reopenOpts.supersede === true) {
    const result = supersede(
      spId,
      decisionId,
      reopenOpts.newEntry || { reason: reopenOpts.reason || "reopened via tryReopen" },
      opts,
    );
    return { ok: true, reason: "superseded", entry: result.entry };
  }
  return { ok: false, reason: "supersession-required" };
}

module.exports = {
  settle,
  isSettled,
  supersede,
  tryReopen,
  getDisposition,
  history,
};
