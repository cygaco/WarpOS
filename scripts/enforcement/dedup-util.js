"use strict";
/**
 * dedup-util.js — the ONE duplicate-key finder shared by the enforcement dedup lints
 * (SP-20260723-003, β P-034 one-implementer: the ED-258a genesis-dup lint and the ED-267a betaEvents
 * dedup lint must not carry two drifting copies of "group by a key, flag groups >1").
 *
 * duplicateKeys(items, keyFn) -> [{ key, count }] sorted by key — every key that keyFn returns for >1
 * item. keyFn returning null/undefined EXCLUDES that item from counting (not a countable key), so a
 * caller filters (e.g. non-genesis rows, rows with no msg_id) by returning null.
 */
function duplicateKeys(items, keyFn) {
  const counts = new Map();
  for (const it of items || []) {
    const k = keyFn(it);
    if (k === null || k === undefined) continue;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const dups = [];
  for (const [key, count] of counts) if (count > 1) dups.push({ key, count });
  return dups.sort((a, b) => String(a.key).localeCompare(String(b.key)));
}

module.exports = { duplicateKeys };
