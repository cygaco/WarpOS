#!/usr/bin/env node
"use strict";

/**
 * log-sink-caps.js — the retention gate. Flags any known log sink that has
 * grown past 2× its SINK_CAPS cap (rotate.js should have rotated it well
 * before then — a breach here means rotation is not firing on that sink) AND
 * validates the SINK_CAPS INVENTORY itself (every declared descriptor is
 * well-formed) whether or not the sink file exists yet.
 *
 * Imports SINK_CAPS from scripts/hooks/lib/rotate.js — the SAME map the
 * write-time rotation trigger uses, so the enforcer and the mechanism can
 * never disagree about what "too big" means (single source of truth).
 *
 * FAIL-CLOSED throughout (F-ENF-2) — a check must never read green on ambiguity:
 *   • an unrecognized `kind` in the inventory is a malformed descriptor
 *     (offender), NOT silently coerced to "lines";
 *   • an `fs.existsSync` FAULT (permission/descriptor error) is an offender
 *     (unreadable), NOT treated as "absent" and skipped;
 *   • a non-finite `actual` (NaN/Infinity) is an offender, NOT a silent pass;
 *   • a sink that EXISTS but errors on stat/read is an offender (unreadable).
 * A sink declared in SINK_CAPS but never yet written (fresh install) is
 * legitimately absent — its DESCRIPTOR is still validated (F-ENF-3), but the
 * size check is skipped (no file to measure).
 *
 * Exit contract:
 *   (no flag)   REPORT-ONLY — prints findings, exits 0 even on a breach.
 *   --enforce   exits 1 on a breach.
 *   own runner error (unreadable SINK_CAPS / crash) → exit 2, fail-closed.
 *
 *   node scripts/checks/log-sink-caps.js [--enforce] [--json]
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "log-sink-caps";

/**
 * Pure core: given `{sinks: [{path, kind, cap, actual, unreadable}]}`, return
 * the offenders. A malformed descriptor (missing path/kind/cap, or an
 * unrecognized `kind`) or an `unreadable:true` sink is ALWAYS an offender —
 * never silently skipped (fail-closed). When `actual` is present it must be a
 * FINITE number; a non-finite `actual` is an offender. A well-formed sink with
 * a finite actual is an offender only when `actual > 2 * cap`. `actual`
 * absent/undefined means the sink file did not exist — the descriptor is still
 * validated, the size check is skipped.
 */
function evaluate(input) {
  const sinks = (input && input.sinks) || [];
  const offenders = [];
  for (const s of sinks) {
    const malformed =
      !s ||
      typeof s !== "object" ||
      typeof s.path !== "string" ||
      !s.path ||
      typeof s.cap !== "number" ||
      !(s.cap > 0) ||
      (s.kind !== "lines" && s.kind !== "bytes");
    if (malformed) {
      offenders.push({
        path: (s && s.path) || "(unknown)",
        reason: "malformed-sink-descriptor",
      });
      continue;
    }
    if (s.unreadable) {
      offenders.push({ path: s.path, kind: s.kind, cap: s.cap, reason: "unreadable" });
      continue;
    }
    // `actual` is optional (absent ⇒ file didn't exist; descriptor already
    // validated above). But if PRESENT it must be a FINITE number — a
    // non-finite actual fails closed rather than sliding under the `>` test.
    if (s.actual !== undefined && s.actual !== null) {
      if (!Number.isFinite(s.actual)) {
        offenders.push({
          path: s.path,
          kind: s.kind,
          cap: s.cap,
          actual: s.actual,
          reason: "non-finite-actual",
        });
        continue;
      }
      const threshold = 2 * s.cap;
      if (s.actual > threshold) {
        offenders.push({
          path: s.path,
          kind: s.kind,
          cap: s.cap,
          actual: s.actual,
          threshold,
          reason: "over-2x-cap",
        });
      }
    }
  }
  return { ok: offenders.length === 0, offenders };
}

/** fs-backed: builds the sink descriptor list from SINK_CAPS + the live filesystem. */
function run() {
  // eslint-disable-next-line global-require
  const { SINK_CAPS } = require("../hooks/lib/rotate");
  const sinks = [];
  let existing = 0;
  for (const [absPath, capEntry] of Object.entries(SINK_CAPS || {})) {
    const rel = path.relative(ROOT, absPath).replace(/\\/g, "/");
    // RAW kind — NO coercion. An unrecognized kind must reach evaluate() and be
    // flagged malformed, not laundered into "lines" (F-ENF-2).
    const kind = capEntry && capEntry.kind;
    const cap = capEntry && capEntry.cap;

    // Existence probe via statSync, which THROWS (unlike fs.existsSync, which
    // NEVER throws — it returns false on ANY error, so a permission/descriptor
    // fault on an EXISTING sink would masquerade as "absent" and slip the size
    // check; that dead fail-closed catch was the F-ENF-2 hole). Distinguish
    // ENOENT (legit absent — descriptor still validated) from any OTHER error
    // (fail-closed — the sink is an unreadable offender, never silently skipped).
    let st = null;
    let statErr = null;
    try {
      st = fs.statSync(absPath);
    } catch (e) {
      statErr = e;
    }
    if (statErr) {
      if (statErr.code === "ENOENT") {
        // Not yet written (fresh install). Inventory descriptor STILL validated
        // (F-ENF-3); no file to measure.
        sinks.push({ path: rel, kind, cap });
      } else {
        // Permission/descriptor fault on a present-or-indeterminate sink → offender.
        sinks.push({ path: rel, kind, cap, unreadable: true });
      }
      continue;
    }

    existing++;
    let actual;
    let unreadable = false;
    try {
      if (kind === "bytes") {
        actual = st.size;
      } else {
        const content = fs.readFileSync(absPath, "utf8");
        actual = content.length === 0 ? 0 : content.split("\n").filter(Boolean).length;
      }
    } catch {
      unreadable = true;
    }
    sinks.push({ path: rel, kind, cap, actual, unreadable });
  }
  // `inventory` = every declared sink (validated); `scanned` = those that exist
  // and were size-checked. (F-ENF-3: the count reflects the inventory, not just
  // existing files.)
  return { ...evaluate({ sinks }), scanned: existing, inventory: sinks.length };
}

module.exports = { evaluate, run };

if (require.main === module) {
  const JSON_OUT = process.argv.includes("--json");
  const ENFORCE = process.argv.includes("--enforce");
  let res;
  try {
    res = run();
  } catch (e) {
    // fail-closed: a scanner that errors must NOT read green.
    const msg = e && e.message ? e.message : e;
    if (JSON_OUT) console.log(JSON.stringify({ ok: false, error: String(msg) }));
    else console.error(`[${NAME}] runner error (fail-closed): ${msg}`);
    process.exit(2);
  }
  if (JSON_OUT) {
    console.log(JSON.stringify({ check: NAME, enforce: ENFORCE, ...res }));
  } else if (res.ok) {
    console.log(
      `OK   [${NAME}] inventory ${res.inventory} sink(s) well-formed; ${res.scanned} existing within 2x cap`,
    );
  } else {
    const verb = ENFORCE ? "FAIL" : "REPORT";
    console.error(
      `${verb} [${NAME}] ${res.offenders.length} sink(s) exceed 2x cap (or are unreadable/malformed):`,
    );
    for (const o of res.offenders) {
      console.error(
        `  - ${o.path}: ${o.reason}` +
          (o.actual !== undefined ? ` (actual=${o.actual}, threshold=${o.threshold})` : ""),
      );
    }
    if (!ENFORCE) {
      console.error(`[${NAME}] report-only — re-run with --enforce to make this a blocking gate.`);
    }
  }
  process.exit(ENFORCE ? (res.ok ? 0 : 1) : 0);
}
