#!/usr/bin/env node
"use strict";

/**
 * materialize-core.js — the ONE shared events->deterministic-doc primitive
 * (SP-20260718-002 · C2 · AC-7 GENERALIZE ruling, β rider #1 / P-034).
 *
 * Both entrypoints route through this:
 *   - scripts/state/materialize.js        (what-running + what-happened)
 *   - scripts/materialize-decisions.js    (DECISIONS.md + STALE-FILES.md)
 * A parallel reimplementation of the events->doc pattern is REJECTED.
 *
 * Signature (producer defines; both callers adapt):
 *   materialize({ source, reducer, renderer, emptyRender, outPath, root })
 *     -> { ok, bytes, wrote, path }
 *
 *   source     : () => events[]      // injectable for fixture tests
 *   reducer    : (events) => model   // PURE, deterministic (identity if omitted)
 *   renderer   : (model)  => string  // PURE, deterministic
 *   emptyRender: () => string        // cold-start render when source() is empty
 *   outPath    : string              // relative (resolved under root) or absolute
 *   root       : string              // resolution root; defaults to cwd
 *
 * HARD determinism rule (makes AC-8 delete->regen->byte-identical hold):
 * the RENDERED bytes MUST be a pure function of the events — the renderer/
 * emptyRender this primitive is handed must contain NO Date.now(), no
 * `new Date()`, no absolute paths, no process.pid, no __dirname/process.cwd
 * in their OUTPUT. This primitive itself injects nothing into the content: it
 * writes exactly what renderer()/emptyRender() returns. Path resolution below
 * uses process.cwd() only to locate the OUTPUT FILE, never to build content.
 *
 * Never throws to the caller — faults return { ok:false, error }.
 */

const fs = require("fs");
const path = require("path");

function materialize(opts) {
  const result = { ok: false, bytes: 0, wrote: false, path: null };
  try {
    const { source, reducer, renderer, emptyRender, outPath, root } = opts || {};

    if (typeof source !== "function") {
      throw new Error("materialize: `source` must be a function () => events[]");
    }
    if (typeof renderer !== "function") {
      throw new Error("materialize: `renderer` must be a function (model) => string");
    }
    if (!outPath || typeof outPath !== "string") {
      throw new Error("materialize: `outPath` (string) is required");
    }

    // Resolve the output target. Uses cwd/root ONLY for the file location — this
    // never enters the rendered content, so determinism of the OUTPUT is intact.
    const rootAbs = root ? path.resolve(root) : process.cwd();
    const target = path.isAbsolute(outPath) ? outPath : path.join(rootAbs, outPath);
    result.path = target;

    const events = source() || [];
    let content;
    if (!Array.isArray(events) || events.length === 0) {
      // Cold-start: valid empty render, NOT a crash (AC-8).
      const er = typeof emptyRender === "function" ? emptyRender : () => "";
      content = String(er());
    } else {
      const model = typeof reducer === "function" ? reducer(events) : events;
      content = String(renderer(model));
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf8");

    result.ok = true;
    result.wrote = true;
    result.bytes = Buffer.byteLength(content, "utf8");
    return result;
  } catch (e) {
    result.error = String(e && e.message ? e.message : e);
    return result;
  }
}

module.exports = { materialize };
