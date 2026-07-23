"use strict";
/**
 * ed-registry.js — shared register-scan helpers for the enforcement-debt ledger
 * (SP-20260723-003, β P-034 one-implementer). The ED-267b ALLOCATOR (nextEdId) and the ED-258a DUP-ID
 * LINT (findDuplicateGenesisIds) share ONE scan so they can't drift.
 *
 * GENESIS vs UPDATE (β 0.90 DIRECTIVE — the dedup key): a row INTRODUCES new debt (genesis) ONLY when it
 * carries a substantive debt DESCRIPTION (`policy`/`origin`/`gap`) AND is not marked as an update. An
 * UPDATE row re-uses an id and is one of: an amendment (`amendment:true` or the append-only
 * `record_kind`/`amends` fields) OR a thin status-change/closure row (id + status + closure fields like
 * `closure_receipt`/`enforcer`/`closed_ts`/`enforced_by`, with NO fresh description). Every id has exactly
 * ONE genesis row + N update rows; a real dup = an id with >1 GENESIS row (two distinct debt loggings
 * colliding — the line-count-allocator bug's output). Requiring a description is what stops a bare
 * append-only closure (e.g. ED-244's `{status:"closed", closure_receipt, enforcer}` row) from being
 * mis-read as a second genesis and false-RED'ing a closed ED.
 */

const { duplicateKeys } = require("./dedup-util");

const ED_ID_RE = /^ED-(\d+)$/;
// A row INTRODUCES debt only if it carries one of these substantive description fields (log.md requires
// `policy`; the older schema used `origin`/`gap`).
const DESCRIPTION_FIELDS = ["policy", "origin", "gap"];

/**
 * parseRegister(text) -> [{ raw, obj?, id?, num?, isGenesis?, malformed }]. One entry per non-blank line.
 * A JSON-parse failure yields { malformed:true } — SKIPPED by both consumers, never a crash (β rider).
 */
function parseRegister(text) {
  const out = [];
  for (const line of String(text == null ? "" : text).split("\n")) {
    const t = line.trim();
    if (!t) continue;
    let obj;
    try { obj = JSON.parse(t); } catch { out.push({ raw: t, malformed: true }); continue; }
    const id = typeof obj.id === "string" ? obj.id : null;
    const m = id ? id.match(ED_ID_RE) : null;
    const num = m ? Number(m[1]) : null;
    const isUpdateMarked = obj.amendment === true || obj.record_kind !== undefined || obj.amends !== undefined;
    const hasDescription = DESCRIPTION_FIELDS.some((k) => typeof obj[k] === "string" && obj[k].length > 0);
    // Genesis = introduces new debt: a substantive description AND not an amendment/append-only update.
    // A thin closure/status-change row (no description) is an UPDATE, not a genesis.
    const isGenesis = hasDescription && !isUpdateMarked;
    out.push({ raw: t, obj, id, num, isGenesis, malformed: false });
  }
  return out;
}

/**
 * nextEdId(text) -> "ED-NNN" — the TRUE max ED-NNN numeric id + 1 (genesis AND amendment rows both count;
 * an amendment reuses its id so it never moves the max). Malformed lines are skipped, so a parse error can
 * never crash-or-mint-a-colliding-id (β rider). Empty/no-ids register -> ED-001.
 */
function nextEdId(text) {
  let max = 0;
  for (const r of parseRegister(text)) {
    if (r.num != null && Number.isFinite(r.num) && r.num > max) max = r.num;
  }
  return "ED-" + String(max + 1).padStart(3, "0");
}

/**
 * findDuplicateGenesisIds(text) -> [{ id, count }] sorted by id — ids with >1 GENESIS row. An append-only
 * closure/amendment row re-using an id does NOT count (genesis-keyed). Malformed/non-ED lines skipped.
 * Uses the shared duplicateKeys finder (β P-034 one-implementer, with ED-267a).
 */
function findDuplicateGenesisIds(text) {
  const rows = parseRegister(text);
  const dups = duplicateKeys(rows, (r) => (!r.malformed && r.isGenesis && r.id && ED_ID_RE.test(r.id) ? r.id : null));
  return dups.map((d) => ({ id: d.key, count: d.count }));
}

/**
 * findGenesisEvadingUpdates(text) -> [{ id }] sorted by id — UPDATE-marked rows
 * (amendment:true / record_kind / amends) that ALSO carry a fresh genesis DESCRIPTION (policy/origin/gap).
 * A legit amendment updates via `note`; a fresh description under an update marker is a SECOND GENESIS
 * hiding from the dup count (security r2 #2 — the settable-marker bypass of findDuplicateGenesisIds).
 * Verified: zero legit amendments on the live register carry a description field, so this does not
 * false-RED real data.
 */
function findGenesisEvadingUpdates(text) {
  const out = [];
  for (const r of parseRegister(text)) {
    if (r.malformed || !r.id || !ED_ID_RE.test(r.id)) continue;
    const o = r.obj || {};
    const isUpdate = o.amendment === true || o.record_kind !== undefined || o.amends !== undefined;
    const hasDesc = DESCRIPTION_FIELDS.some((k) => typeof o[k] === "string" && o[k].length > 0);
    if (isUpdate && hasDesc) out.push({ id: r.id });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

module.exports = { parseRegister, nextEdId, findDuplicateGenesisIds, findGenesisEvadingUpdates, ED_ID_RE };
