#!/usr/bin/env node
/**
 * scripts/turbo/apply.js — /turbo skill mutator.
 *
 * Grants scoped, time-bounded autonomy that lets routine builder loops run
 * without per-call confirmations. Hybrid mechanism:
 *
 *   1. Additively merges curated entries into `.claude/settings.json#permissions.allow`
 *      so the harness classifier auto-allows the listed patterns.
 *   2. Writes `paths.runtime/authorization.json` (schema warpos/auth/v1) so the
 *      project-side PreToolUse hook `scripts/hooks/authorization-gate.js` can
 *      short-circuit downstream guards for the matching scope.
 *
 * Always snapshots `.claude/settings.json` to `paths.runtime/settings-pre-turbo.json`
 * BEFORE the first mutation in a session — `--off` restores from snapshot. Subsequent
 * applies in the same session are merged into the live settings.json without re-
 * snapshotting (otherwise we'd snapshot a turbo-flavoured settings as "pre-turbo").
 *
 * CLI:
 *   node scripts/turbo/apply.js --scope <csv|all> [--ttl <Nm|Nh>] [--reason "<text>"]
 *   node scripts/turbo/apply.js --off
 *   node scripts/turbo/apply.js --status
 *
 * Scope vocabulary:
 *   push-to-main      git push origin main (NOT default; opt-in only)
 *   manifest-edit     Edit/Write .claude/manifest.json
 *   destructive-git   git rm --cached <path>, git reset --hard <ref>
 *   node-e-fs         node -e "...fs.writeFileSync..." / fs.appendFileSync
 *   write-jsonl       Write to any *.jsonl (events, decisions, memory tails)
 *   worktree-ops      git worktree add/remove/prune/move
 *
 * Default scope (when --scope is omitted): manifest-edit,write-jsonl,node-e-fs
 *
 * Safety floor (NEVER authorized, even with --scope all):
 *   - git push --force to main
 *   - delete branches matching backup/* or pre-*
 *   - signups/purchases of services
 *   - API spend >= $5 total per session
 *   - Beta consultation ESCALATE returns
 *   - delete tracked uncommitted user work
 *
 * Fail-closed on settings.json write failure. Fail-open on logger errors.
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ── Load PATHS registry (with safe fallback) ───────────────
const PROJECT = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
let PATHS = {};
try {
  const raw = JSON.parse(
    fs.readFileSync(path.join(PROJECT, ".claude", "paths.json"), "utf8"),
  );
  PATHS = Object.fromEntries(
    Object.entries(raw)
      .filter(([k]) => k !== "version" && k !== "$schema")
      .map(([k, v]) => [k, path.join(PROJECT, v)]),
  );
} catch {
  /* registry optional; fall through to hardcoded defaults below */
}
const SETTINGS_PATH =
  PATHS.settings || path.join(PROJECT, ".claude", "settings.json");
const RUNTIME_DIR = PATHS.runtime || path.join(PROJECT, ".claude", "runtime");
const SNAPSHOT_PATH = path.join(RUNTIME_DIR, "settings-pre-turbo.json");
const AUTH_PATH = path.join(RUNTIME_DIR, "authorization.json");

// Logger is best-effort — never block on logging failure.
let logEvent = null;
try {
  ({ logEvent } = require(
    path.join(PROJECT, "scripts", "hooks", "lib", "logger.js"),
  ));
} catch {
  /* logger optional */
}
function logAudit(action, target, detail, meta) {
  if (!logEvent) return;
  try {
    logEvent("audit", "turbo", action, target || "", detail || "", meta);
  } catch {
    /* swallow */
  }
}

// ── Scope vocabulary + curated permissions ──────────────────
//
// Each scope maps to an array of `permissions.allow` patterns that match the
// harness-classifier's syntax. These are additively merged into settings.json.
// The hook authorization-gate.js inspects the SAME scope vocabulary on the
// project-hook side.
const KNOWN_SCOPES = new Set([
  "push-to-main",
  "manifest-edit",
  "destructive-git",
  "node-e-fs",
  "write-jsonl",
  "worktree-ops",
]);

const SCOPE_PERMISSIONS = {
  "manifest-edit": [
    "Edit(.claude/manifest.json)",
    "Write(.claude/manifest.json)",
  ],
  "write-jsonl": [
    "Write(.claude/project/events/**.jsonl)",
    "Write(.claude/project/memory/**.jsonl)",
    "Write(.claude/project/decisions/**.jsonl)",
    "Write(.claude/runtime/**.jsonl)",
  ],
  "node-e-fs": [
    "Bash(node -e *fs.writeFileSync*)",
    "Bash(node -e *fs.appendFileSync*)",
    "Bash(node -e *fs.mkdirSync*)",
  ],
  "destructive-git": [
    "Bash(git rm --cached *)",
    "Bash(git reset --hard *)",
    "Bash(git restore *)",
  ],
  "worktree-ops": [
    "Bash(git worktree add *)",
    "Bash(git worktree remove *)",
    "Bash(git worktree prune *)",
    "Bash(git worktree move *)",
  ],
  "push-to-main": [
    "Bash(git push origin main)",
    "Bash(git push origin HEAD:main)",
  ],
};

const DEFAULT_SCOPES = ["manifest-edit", "write-jsonl", "node-e-fs"];
const DEFAULT_TTL_MIN = 60;

// ── CLI parse ──────────────────────────────────────────────
function parseArgs(argv) {
  const out = { mode: "apply", scopes: null, ttl: null, reason: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--off") out.mode = "off";
    else if (a === "--status") out.mode = "status";
    else if (a === "--scope") out.scopes = String(argv[++i] || "").trim();
    else if (a === "--ttl") out.ttl = String(argv[++i] || "").trim();
    else if (a === "--reason") out.reason = String(argv[++i] || "").trim();
  }
  return out;
}

// ── TTL parsing: "60m", "2h", "90", number-as-minutes ──────
function parseTtlMinutes(s) {
  if (!s) return DEFAULT_TTL_MIN;
  const m = String(s)
    .trim()
    .match(/^(\d+)\s*([mh]?)$/i);
  if (!m) return DEFAULT_TTL_MIN;
  const n = parseInt(m[1], 10);
  const unit = (m[2] || "m").toLowerCase();
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_TTL_MIN;
  if (unit === "h") return n * 60;
  return n;
}

// ── Scope normalization + safety-floor enforcement ─────────
function normalizeScopes(input) {
  if (!input) return DEFAULT_SCOPES.slice();
  if (input === "all") return Array.from(KNOWN_SCOPES);
  const raw = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const accepted = [];
  for (const s of raw) {
    if (KNOWN_SCOPES.has(s)) {
      accepted.push(s);
    } else {
      process.stderr.write(
        `[turbo] WARN: dropped unknown scope "${s}" (vocab: ${Array.from(
          KNOWN_SCOPES,
        ).join(", ")})\n`,
      );
    }
  }
  return Array.from(new Set(accepted));
}

// Safety floor — even with --scope all, these are NEVER bypassable. The
// authorization-gate hook ALSO enforces the floor (defence in depth).
const SAFETY_FLOOR = [
  "git push --force to main",
  "delete branches matching backup/* or pre-*",
  "signups / purchases of services",
  "API spend >= $5 total per session",
  "Beta consultation ESCALATE returns",
  "delete tracked uncommitted user work",
];

// ── settings.json mutate ───────────────────────────────────
function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
  } catch (e) {
    throw new Error(`failed to read ${SETTINGS_PATH}: ${e.message}`);
  }
}

function writeSettings(obj) {
  const tmp = SETTINGS_PATH + ".turbo.tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, SETTINGS_PATH);
}

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function snapshotIfFresh(currentSettings) {
  // Snapshot only on FIRST apply of the session — detected by absence of
  // authorization.json. Subsequent applies in the same session merge without
  // re-snapshotting (otherwise we'd snapshot a turbo-flavoured settings).
  ensureDir(RUNTIME_DIR);
  if (fs.existsSync(AUTH_PATH)) return false; // already in a turbo session
  fs.writeFileSync(
    SNAPSHOT_PATH,
    JSON.stringify(currentSettings, null, 2) + "\n",
    "utf8",
  );
  return true;
}

function mergePermissions(settings, scopes) {
  if (!settings.permissions || typeof settings.permissions !== "object") {
    settings.permissions = {};
  }
  if (!Array.isArray(settings.permissions.allow)) {
    settings.permissions.allow = [];
  }
  const existing = new Set(settings.permissions.allow);
  let added = 0;
  for (const s of scopes) {
    const patterns = SCOPE_PERMISSIONS[s] || [];
    for (const p of patterns) {
      if (!existing.has(p)) {
        settings.permissions.allow.push(p);
        existing.add(p);
        added++;
      }
    }
  }
  return added;
}

// ── Authorization state file ───────────────────────────────
function writeAuthorization(scopes, ttlMin, reason) {
  ensureDir(RUNTIME_DIR);
  const now = new Date();
  const expires = new Date(now.getTime() + ttlMin * 60 * 1000);
  const auth = {
    schema: "warpos/auth/v1",
    scopes,
    ttl_min: ttlMin,
    granted_at: now.toISOString(),
    expires_at: expires.toISOString(),
    reason: reason || "",
    snapshot_path: path.relative(PROJECT, SNAPSHOT_PATH).replace(/\\/g, "/"),
    safety_floor: SAFETY_FLOOR,
  };
  const tmp = AUTH_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(auth, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, AUTH_PATH);
  return auth;
}

function readAuthorization() {
  try {
    return JSON.parse(fs.readFileSync(AUTH_PATH, "utf8"));
  } catch {
    return null;
  }
}

// ── Status output ──────────────────────────────────────────
function ttlRemainingMin(auth) {
  if (!auth || !auth.expires_at) return 0;
  const ms = new Date(auth.expires_at).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 60000));
}

function countBypassEvents(grantedIso) {
  // Best-effort: tail events.jsonl, count "auth-bypass" entries since granted_at.
  try {
    const eventsFile =
      PATHS.eventsFile ||
      path.join(PROJECT, ".claude", "project", "events", "events.jsonl");
    if (!fs.existsSync(eventsFile)) return 0;
    const raw = fs.readFileSync(eventsFile, "utf8");
    if (!raw) return 0;
    const since = new Date(grantedIso).getTime();
    let count = 0;
    const lines = raw.split("\n");
    // Scan from the tail backwards — bypass events are recent
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (!line) continue;
      if (!line.includes("auth-bypass")) continue;
      try {
        const ev = JSON.parse(line);
        if (new Date(ev.ts).getTime() < since) break; // past window
        if (
          (ev.data && ev.data.action === "auth-bypass") ||
          (ev.data && ev.data.type === "auth-bypass")
        ) {
          count++;
        }
      } catch {
        /* skip malformed */
      }
    }
    return count;
  } catch {
    return 0;
  }
}

function renderStatus() {
  const auth = readAuthorization();
  if (!auth) {
    return [
      "/turbo --status",
      "",
      "  status:      INACTIVE",
      "  scopes:      (none)",
      "",
      "SAFETY FLOOR (never bypassed, even with --scope all):",
      ...SAFETY_FLOOR.map((s) => `  - ${s}`),
      "",
      'To activate: /turbo --scope manifest-edit,write-jsonl --ttl 60m --reason "<text>"',
    ].join("\n");
  }
  const remain = ttlRemainingMin(auth);
  const expired = remain === 0;
  const bypasses = countBypassEvents(auth.granted_at);
  return [
    "/turbo --status",
    "",
    `  status:        ${expired ? "EXPIRED (run /turbo --off to clean up)" : "ACTIVE"}`,
    `  scopes:        ${(auth.scopes || []).join(", ")}`,
    `  ttl_min:       ${auth.ttl_min}`,
    `  ttl_remaining: ${remain} min`,
    `  granted_at:    ${auth.granted_at}`,
    `  expires_at:    ${auth.expires_at}`,
    `  reason:        ${auth.reason || "(none)"}`,
    `  snapshot:      ${auth.snapshot_path}`,
    `  bypasses:      ${bypasses} since granted_at`,
    "",
    "SAFETY FLOOR (never bypassed, even with --scope all):",
    ...SAFETY_FLOOR.map((s) => `  - ${s}`),
  ].join("\n");
}

// ── Off: restore snapshot + delete auth file ───────────────
function offTurbo() {
  let restored = false;
  if (fs.existsSync(SNAPSHOT_PATH)) {
    try {
      const snap = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
      writeSettings(snap);
      restored = true;
    } catch (e) {
      process.stderr.write(
        `[turbo] WARN: snapshot at ${SNAPSHOT_PATH} unreadable: ${e.message}\n`,
      );
    }
  }
  if (fs.existsSync(AUTH_PATH)) {
    try {
      fs.unlinkSync(AUTH_PATH);
    } catch {
      /* best-effort */
    }
  }
  logAudit(
    "turbo-off",
    SETTINGS_PATH,
    restored ? "snapshot restored" : "no snapshot to restore",
  );
  return restored;
}

// ── Main ───────────────────────────────────────────────────
function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.mode === "status") {
    process.stdout.write(renderStatus() + "\n");
    return 0;
  }

  if (args.mode === "off") {
    const restored = offTurbo();
    process.stdout.write(
      restored
        ? "[turbo] OFF — settings.json restored from snapshot, authorization.json deleted.\n"
        : "[turbo] OFF — no snapshot found; authorization.json deleted (if present).\n",
    );
    return 0;
  }

  // mode === "apply"
  const scopes = normalizeScopes(args.scopes);
  if (scopes.length === 0) {
    process.stderr.write(
      "[turbo] ERROR: no valid scopes provided. Vocab: " +
        Array.from(KNOWN_SCOPES).join(", ") +
        "\n",
    );
    return 2;
  }
  const ttlMin = parseTtlMinutes(args.ttl);
  const reason = args.reason || "";

  let settings;
  try {
    settings = readSettings();
  } catch (e) {
    process.stderr.write(`[turbo] FATAL: ${e.message}\n`);
    return 3;
  }

  const snapshotTaken = snapshotIfFresh(settings);
  const added = mergePermissions(settings, scopes);

  try {
    writeSettings(settings);
  } catch (e) {
    process.stderr.write(`[turbo] FATAL: write settings.json: ${e.message}\n`);
    return 3;
  }

  const auth = writeAuthorization(scopes, ttlMin, reason);

  logAudit(
    "turbo-on",
    SETTINGS_PATH,
    `scopes=${scopes.join("|")} ttl_min=${ttlMin} added_perms=${added} snapshot=${snapshotTaken}`,
    { scopes, ttl_min: ttlMin, reason },
  );

  process.stdout.write(
    [
      `[turbo] ON`,
      `  scopes:        ${scopes.join(", ")}`,
      `  ttl_min:       ${ttlMin}`,
      `  granted_at:    ${auth.granted_at}`,
      `  expires_at:    ${auth.expires_at}`,
      `  reason:        ${reason || "(none)"}`,
      `  permissions:   +${added} entries (additive merge)`,
      `  snapshot:      ${snapshotTaken ? "taken (first apply this session)" : "skipped (already in turbo session)"}`,
      "",
      "Safety floor (NEVER bypassed):",
      ...SAFETY_FLOOR.map((s) => `  - ${s}`),
      "",
      "Revoke with: /turbo --off",
    ].join("\n") + "\n",
  );
  return 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  KNOWN_SCOPES,
  SCOPE_PERMISSIONS,
  DEFAULT_SCOPES,
  DEFAULT_TTL_MIN,
  SAFETY_FLOOR,
  parseArgs,
  parseTtlMinutes,
  normalizeScopes,
  readAuthorization,
};
