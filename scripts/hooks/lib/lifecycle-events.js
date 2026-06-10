/**
 * lifecycle-events.js — emitter for the VIRTUAL mode-lifecycle events
 * (E-LIFECYCLE-001 / S-LC-02).
 *
 * The Claude harness cannot fire custom hook events, so the ~23 mode-lifecycle
 * waypoints declared in .claude/agents/_org/mode-lifecycle-hooks.json
 * (paths.modeLifecycleHooks) are VIRTUAL: each is emitted here as a structured
 * `lifecycle-event` record appended to paths.eventsFile via the canonical logger
 * (lib/logger.js#log). The report-only coverage enforcer
 * (scripts/checks/mode-lifecycle-hooks-coverage.js) asserts every declared event
 * has an emitter — a `lifecycle-events.emit("<event>")` reference and/or a real
 * `lifecycle-event` record.
 *
 * Contract:
 *   emit(event, payload)  -> boolean (true = emitted, false = caught/rejected)
 *     - validates `event` is DECLARED in the registry (an undeclared/malformed
 *       event is a caught error: log-and-continue, returns false, NEVER throws).
 *     - SANITIZES the payload: whitelists to the event's declared payload_fields
 *       and scrubs secret-looking keys/values. Payloads carry STATUS LABELS only,
 *       never secret VALUES (provider/turbo/binding fields are status strings).
 *     - appends a `lifecycle-event` record to paths.eventsFile.
 *   FAIL-OPEN: any logging error is swallowed — emit never throws into the
 *   caller's hot path.
 *
 * This module does NOT build the 2 REAL PreToolUse guards (mode-switch preflight,
 * mode:init:gate) — those are S-LC-03/04. It is the event SPINE only.
 *
 * Usage:
 *   const lifecycle = require("./lib/lifecycle-events");
 *   lifecycle.emit("mode:switch:requested", {
 *     prev_mode: "adhoc", target_mode: "sprint", actor: "alpha",
 *     correlation_id: "switch-123",
 *   });
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { PATHS } = require("./paths");
const logger = require("./logger");

// ── Registry resolution (single-sourced via paths.modeLifecycleHooks) ──────────
// The registry is normally single-sourced via paths.modeLifecycleHooks. But PATHS
// resolves against the canonical PROJECT root, which — in a worktree — is NOT the
// tree this module lives in (the cwd-hazard). So: prefer the paths key WHEN it
// resolves to a real file (production / canonical install), else fall back to the
// MODULE-RELATIVE path (the tree this file ships in). Same deliberate choice as
// scripts/checks/mode-lifecycle-registry.js (ROOT = path.resolve(__dirname,...)).
function moduleRootRegistry() {
  return path.resolve(
    __dirname, "..", "..", "..", ".claude", "agents", "_org", "mode-lifecycle-hooks.json",
  );
}
function registryPath() {
  const keyed = PATHS.modeLifecycleHooks;
  try {
    if (keyed && fs.existsSync(keyed)) return keyed;
  } catch {
    /* fall through to module-relative */
  }
  return moduleRootRegistry();
}

// Cache the declared-event map (event -> row). Refreshable for tests.
let _registryCache = null;
function loadRegistry(p = registryPath()) {
  if (_registryCache && _registryCache._path === p) return _registryCache;
  // strip a possible UTF-8 BOM (mirrors hook-points.js readJson)
  const raw = JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
  const byEvent = Object.create(null);
  for (const row of Array.isArray(raw.events) ? raw.events : []) {
    if (row && typeof row.event === "string") byEvent[row.event] = row;
  }
  _registryCache = { _path: p, doc: raw, byEvent };
  return _registryCache;
}

/** Clear the in-memory registry cache (used by tests that swap the registry). */
function _clearCache() {
  _registryCache = null;
}

/** The set of declared event ids (best-effort; [] on an unreadable registry). */
function declaredEvents(p = registryPath()) {
  try {
    return Object.keys(loadRegistry(p).byEvent);
  } catch {
    return [];
  }
}

/** Is `event` declared in the registry? (false on an unreadable registry.) */
function isDeclared(event, p = registryPath()) {
  try {
    return Object.prototype.hasOwnProperty.call(loadRegistry(p).byEvent, event);
  } catch {
    return false;
  }
}

// ── Secret scrubbing (defense-in-depth) ────────────────────────────────────────
// Payloads are status LABELS only. The whitelist below is the primary control
// (only declared payload_fields survive); these patterns are a second layer so a
// secret can never ride a declared field either.
const SECRET_KEY_RE =
  /(secret|token|password|passwd|api[_-]?key|apikey|access[_-]?key|private[_-]?key|credential|authorization|bearer|session[_-]?token|client[_-]?secret)/i;
const SECRET_VALUE_RE =
  /(sk-[A-Za-z0-9]{8,}|sk-(?:live|test|proj)[-_][A-Za-z0-9]{6,}|AKIA[0-9A-Z]{12,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|Bearer\s+[A-Za-z0-9._-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;
const REDACTED = "[redacted]";

function scrubValue(v) {
  if (typeof v === "string") {
    return SECRET_VALUE_RE.test(v) ? REDACTED : v;
  }
  if (v && typeof v === "object") {
    // Lifecycle payloads are flat label maps; collapse any nested object to a
    // type label rather than recursing — keeps the record small + leak-proof.
    return Array.isArray(v) ? "[array]" : "[object]";
  }
  return v; // numbers / booleans / null pass through
}

/**
 * Sanitize a raw payload for an event:
 *   1. WHITELIST — keep only keys in the event's declared payload_fields.
 *   2. SCRUB     — drop any surviving secret-looking KEY; redact a secret-looking
 *                  VALUE. Status labels only.
 * Pure. Never throws.
 */
function sanitizePayload(eventRow, rawPayload) {
  const out = {};
  const allowed = new Set(
    eventRow && Array.isArray(eventRow.payload_fields) ? eventRow.payload_fields : [],
  );
  const src = rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload)
    ? rawPayload
    : {};
  for (const k of Object.keys(src)) {
    if (!allowed.has(k)) continue; // whitelist: undeclared keys (incl. secrets) dropped
    if (SECRET_KEY_RE.test(k)) continue; // belt & suspenders: declared-but-secret-named key dropped
    out[k] = scrubValue(src[k]);
  }
  return out;
}

// ── emit() ─────────────────────────────────────────────────────────────────────

/**
 * Emit a VIRTUAL lifecycle event.
 *
 * @param {string} event   a declared event id (see mode-lifecycle-hooks.json).
 * @param {object} [payload] status-label fields (sanitized to declared fields).
 * @param {object} [opts]  passthrough logger opts ({ actor, session, sprint_id }).
 * @returns {boolean} true if a record was appended; false if caught/rejected.
 */
function emit(event, payload, opts) {
  try {
    if (typeof event !== "string" || !event) {
      // malformed event — caught error: log-and-continue, never emit.
      logger.log("audit", {
        type: "warn",
        action: "lifecycle-event-drop",
        detail: "emit() called with a non-string/empty event",
      });
      return false;
    }

    let row;
    try {
      row = loadRegistry().byEvent[event];
    } catch (e) {
      // Unreadable registry — fail-OPEN: cannot validate, so do NOT emit an
      // unvalidated event. Record the diagnostic; never throw.
      logger.log("audit", {
        type: "warn",
        action: "lifecycle-event-drop",
        detail: `lifecycle registry unreadable: ${String(e.message).slice(0, 120)}`,
      });
      return false;
    }

    if (!row) {
      // UNDECLARED event — caught error: log-and-continue, NEVER silently emit.
      logger.log("audit", {
        type: "warn",
        action: "lifecycle-event-drop",
        detail: `undeclared lifecycle event "${String(event).slice(0, 80)}"`,
      });
      return false;
    }

    const safePayload = sanitizePayload(row, payload);
    logger.log(
      "lifecycle",
      {
        kind: "lifecycle-event",
        event,
        mode: row.mode || "advisory",
        harness_fires: false,
        payload: safePayload,
      },
      opts,
    );
    return true;
  } catch {
    // FAIL-OPEN: a logging error must never break the caller's hot path.
    return false;
  }
}

module.exports = {
  emit,
  isDeclared,
  declaredEvents,
  sanitizePayload,
  loadRegistry,
  registryPath,
  _clearCache,
};
