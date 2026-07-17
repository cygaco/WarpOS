#!/usr/bin/env node
"use strict";

/**
 * log-sink-caps.js — the retention gate. Flags any known log sink that has
 * grown past 2× its SINK_CAPS cap (rotate.js should have rotated it well
 * before then — a breach here means rotation is not firing on that sink).
 *
 * Imports SINK_CAPS from scripts/hooks/lib/rotate.js — the SAME map the
 * write-time rotation trigger uses, so the enforcer and the mechanism can
 * never disagree about what "too big" means (single source of truth).
 *
 * For each known sink that EXISTS, counts lines (JSONL sinks) or bytes (the
 * `.log` sink) and flags any sink exceeding 2× its cap. A sink present in
 * SINK_CAPS but never yet written (fresh install) is legitimately absent —
 * skipped, not flagged. A sink that EXISTS but errors on stat/read (a race,
 * a permission fault, a malformed descriptor) fails CLOSED — counted as an
 * offender, never silently skipped.
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
 * never silently skipped (fail-closed). A well-formed sink is an offender
 * only when `actual > 2 * cap`.
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
    const threshold = 2 * s.cap;
    if (typeof s.actual === "number" && s.actual > threshold) {
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
  return { ok: offenders.length === 0, offenders };
}

/** fs-backed: builds the sink descriptor list from SINK_CAPS + the live filesystem. */
function run() {
  // eslint-disable-next-line global-require
  const { SINK_CAPS } = require("../hooks/lib/rotate");
  const sinks = [];
  for (const [absPath, capEntry] of Object.entries(SINK_CAPS || {})) {
    let exists = false;
    try {
      exists = fs.existsSync(absPath);
    } catch {
      exists = false;
    }
    if (!exists) continue; // fresh install / not yet written — legitimately skipped

    const rel = path.relative(ROOT, absPath).replace(/\\/g, "/");
    const kind = capEntry && (capEntry.kind === "bytes" ? "bytes" : "lines");
    const cap = capEntry && capEntry.cap;
    let actual;
    let unreadable = false;
    try {
      if (kind === "bytes") {
        actual = fs.statSync(absPath).size;
      } else {
        const content = fs.readFileSync(absPath, "utf8");
        actual = content.length === 0 ? 0 : content.split("\n").filter(Boolean).length;
      }
    } catch {
      unreadable = true;
    }
    sinks.push({ path: rel, kind, cap, actual, unreadable });
  }
  return { ...evaluate({ sinks }), scanned: sinks.length };
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
    console.log(`OK   [${NAME}] all ${res.scanned} known sink(s) within 2x cap`);
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
