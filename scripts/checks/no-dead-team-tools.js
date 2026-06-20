#!/usr/bin/env node
"use strict";

/**
 * no-dead-team-tools.js — refuse a NEW LIVE DIRECTIVE to a REMOVED Claude Code tool.
 *
 * Claude Code v2.1.178 (2026-06-15) REMOVED the `TeamCreate` and `TeamDelete`
 * tools; WarpOS migrated off them (E-TEAMS-MIGRATION-001) to the implicit,
 * session-scoped team — each teammate is spawned via the `Agent` tool with
 * `run_in_background: true`, and the harness auto-creates the session team. This
 * enforcer makes a REGRESSION self-detecting: a new live `TeamCreate(` /
 * `TeamDelete(` directive must never creep back into the active skill / hook /
 * script / agent layer, where the harness would silently ignore it (the call
 * targets a tool that no longer exists) and the migration would quietly rot.
 *
 * It distinguishes a LIVE DIRECTIVE (the executable call form `TeamCreate(` /
 * `TeamDelete(`) from a LEGITIMATE HISTORICAL MENTION ("TeamCreate was removed
 * in v2.1.178", "the Node-side surrogate for TeamDelete") via an exemption-marker
 * allowlist — a line carrying any marker is descriptive context, not a directive.
 *
 * Pairs a SECOND positive check (β rider): the NEW remediation primitive (the
 * Agent-spawn `run_in_background` shape) must still be PRESENT in the migrated
 * skills — so we never trade one dead tool-name for another dead one.
 *
 * Scans scripts/** + .claude/commands/** + .claude/agents/** + .claude/project/**
 * for *.js/*.md/*.json/*.ts/*.mjs/*.cjs (skipping node_modules, .git, runtime/,
 * per-run/shipped-baseline/test-fixture trees, and any BASELINE/EXAMPLES segment —
 * those legitimately carry the old literals). Exit 0 = clean, 1 = a live directive
 * (or missing remediation), 2 = runner error (fail-closed). Pure
 * `evaluate({files: [{path, content}]})` for the planted-violation test.
 *
 *   node scripts/checks/no-dead-team-tools.js [--json]
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "no-dead-team-tools";
const TEXT_EXT = new Set([".js", ".md", ".json", ".ts", ".mjs", ".cjs"]);
// Per-run / historical / shipped-baseline / test-fixture trees legitimately carry
// the old literals (telemetry of the migration itself, the prior installed clone,
// regression fixtures that PLANT the dead call on purpose). events/ is the
// append-only event log — the per-run telemetry sibling of runtime/.
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "runtime",
  ".provider-tmp",
  ".worktrees",
  "_docs",
  "_planning",
  "_reports",
  "_warpos",
  "events",
  // adr/ = settled Architecture Decision RECORDS — documentation that necessarily
  // quotes the migrated APIs in prose ("TeamCreate(…) now instructs Agent(…)"). Like
  // _docs/_planning/_reports, they are history-of-decision, never executable
  // directives a model runs. Skipped wholesale (the migration's own ADR-0015 lives here).
  "adr",
]);
// A path that contains a segment named exactly "BASELINE" or "EXAMPLES", or the
// regression-fixture tree, is historical/shipped/fixture and is skipped wholesale.
const SKIP_SEGMENTS = new Set(["BASELINE", "EXAMPLES"]);
const SKIP_PATH_SUBSTRINGS = ["tests/regression", "tests\\regression"];
// This enforcer's OWN files quote the dead-tool pattern + the marker list as their
// pattern definition (doc comments, fixtures) — they must never self-flag. Skipping
// by basename is the robust form of the spec's "exempt the enforcer's own pattern".
const SELF_FILES = new Set(["no-dead-team-tools.js", "no-dead-team-tools.test.js"]);
const SCAN_ROOTS = ["scripts", ".claude/commands", ".claude/agents", ".claude/project"];

// The executable directive shape: the dead tool name immediately followed by `(`.
const DEAD_TOOL_RE = /\bTeam(?:Create|Delete)\(/;

// Exemption markers (case-insensitive substring anywhere on the line) that mark a
// line as a LEGITIMATE HISTORICAL / DESCRIPTIVE mention, not a live directive.
const EXEMPT_MARKERS = [
  "removed",
  "no longer",
  "deprecat",
  "surrogate",
  "were removed",
  "v2.1.178",
  "historical",
  "legacy",
  "e-teams-migration",
  "do not use",
  "don't use",
  "gone",
  "phased out",
  "phasing out",
  "must not emit", // a negative regression-assertion ("must NOT emit a TeamCreate( call")
  // The enforcer's / its test's own identifiers — so this file + its fixtures
  // never self-flag when they quote the pattern.
  "no-dead-team-tools",
  "exempt_markers",
  "dead_tool_re",
];

function lineIsExempt(line) {
  const low = line.toLowerCase();
  for (const m of EXEMPT_MARKERS) {
    if (low.includes(m)) return true;
  }
  return false;
}

/**
 * Pure core: given [{path, content}], return the lines that are a LIVE DIRECTIVE
 * to a removed team tool (the `TeamCreate(` / `TeamDelete(` call form) and carry
 * NO exemption marker. Sees only the files it is handed — no fs.
 */
function evaluate(input) {
  const files = (input && input.files) || [];
  const offenders = [];
  for (const f of files) {
    const content = typeof f.content === "string" ? f.content : "";
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!DEAD_TOOL_RE.test(line)) continue;
      if (lineIsExempt(line)) continue;
      offenders.push({
        path: f.path,
        line: i + 1,
        lineno: i + 1,
        text: line.trim().slice(0, 200),
      });
    }
  }
  return { ok: offenders.length === 0, offenders };
}

function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      if (SKIP_SEGMENTS.has(ent.name)) continue;
      yield* walk(path.join(dir, ent.name));
    } else if (ent.isFile() && TEXT_EXT.has(path.extname(ent.name).toLowerCase())) {
      if (SELF_FILES.has(ent.name)) continue; // the enforcer's own pattern-definition files
      yield path.join(dir, ent.name);
    }
  }
}

function relSkipped(rel) {
  const norm = rel.replace(/\\/g, "/");
  const segs = norm.split("/");
  for (const s of segs) {
    if (SKIP_SEGMENTS.has(s)) return true;
  }
  for (const sub of SKIP_PATH_SUBSTRINGS) {
    if (rel.includes(sub)) return true;
  }
  return false;
}

/**
 * SECOND positive check (β rider): confirm the NEW remediation primitive still
 * EXISTS — the Agent-spawn `run_in_background` shape must be present in at least
 * one migrated skill — so a dead-tool migration can never leave NO working path.
 * Uses fs (kept OUT of the pure `evaluate`). Returns an offender object or null.
 */
function assertRemediationExists() {
  const candidates = [
    ".claude/commands/mode/sprint.md",
    ".claude/commands/mode/adhoc.md",
  ];
  for (const rel of candidates) {
    const abs = path.join(ROOT, rel);
    try {
      const txt = fs.readFileSync(abs, "utf8");
      if (txt.includes("run_in_background")) return null; // remediation present
    } catch {
      /* missing candidate — keep looking */
    }
  }
  return {
    path: candidates[0],
    line: 0,
    lineno: 0,
    text:
      "NEW remediation (Agent run_in_background spawn) not found in migrated skills — dead-tool migration would leave no working path",
  };
}

function run() {
  const files = [];
  let scanned = 0;
  for (const root of SCAN_ROOTS) {
    const abs = path.join(ROOT, root);
    if (!fs.existsSync(abs)) continue;
    for (const file of walk(abs)) {
      const rel = path.relative(ROOT, file);
      if (relSkipped(rel)) continue;
      try {
        files.push({ path: rel, content: fs.readFileSync(file, "utf8") });
        scanned++;
      } catch {
        /* unreadable — skip */
      }
    }
  }
  const base = evaluate({ files });
  const offenders = base.offenders.slice();
  const remediationMiss = assertRemediationExists();
  if (remediationMiss) offenders.push(remediationMiss);
  return { ok: offenders.length === 0, offenders, scanned };
}

module.exports = { evaluate };

if (require.main === module) {
  const JSON_OUT = process.argv.includes("--json");
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
    console.log(JSON.stringify({ check: NAME, ...res }));
  } else if (res.ok) {
    console.log(
      `OK   [${NAME}] no live TeamCreate/TeamDelete directives in ${res.scanned} file(s) (+ remediation present)`,
    );
  } else {
    console.error(
      `FAIL [${NAME}] ${res.offenders.length} live directive(s) to a REMOVED team tool (TeamCreate/TeamDelete were removed in Claude Code v2.1.178) — use the Agent(run_in_background:true) spawn instead:`,
    );
    for (const o of res.offenders) console.error(`  - ${o.path}:${o.lineno}  ${o.text}`);
  }
  process.exit(res.ok ? 0 : 1);
}
