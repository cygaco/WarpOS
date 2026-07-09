You are a QA reviewer giving a FINAL verdict on a regression enforcer after a fix. The prior re-review FAILed on ONE residual: the SELF_PATTERN_RE line-level exemption was a bypass (`TeamCreate({}); // no-dead-team-tools` false-passed). FIX: the line-level exemption was REMOVED entirely — lineIsExempt() now always returns false. The enforcer's own two pattern-definition files are skipped WHOLESALE by SELF_FILES in walk() (by basename), NOT by any line-level marker. So a call form is ALWAYS flagged in the active layer (scripts + .claude commands/agents/project); the history/decision layer (adr/_docs/_planning/_reports/_warpos/events/tests/regression) is path-skipped. The scan/full.md doc line that previously relied on the residual exemption was rephrased to non-call form. Planted tests added for `// no-dead-team-tools`, `// DEAD_TOOL_RE`, `// SELF_PATTERN_RE` masked calls.

Verify: can ANY masked live TeamCreate(/TeamDelete( call (with any trailing comment/marker, including the enforcer's own identifiers) still false-pass in the active layer? Does the enforcer still pass legitimate non-call prose + the real Agent-spawn remediation check? Is the path-scoping (SKIP_DIRS/SKIP_SEGMENTS/SELF_FILES) sound (could a real regression hide in a skipped path that's actually active)? Output VERDICT: PASS or FAIL + findings with file/mechanism/fix.

=== FILE: scripts/checks/no-dead-team-tools.js ===
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

// The executable directive shape: the dead tool name + optional whitespace + `(`.
// qa-HIGH: `\s*` so `TeamCreate (` (a space before the paren) does NOT bypass.
const DEAD_TOOL_RE = /\bTeam(?:Create|Delete)\s*\(/;

// ── Exemption policy (qa-CRITICAL + its r2 residual): there is NO inline exemption.
// The prior "any marker word exempts the line" false-PASSED a masked live call
// (`TeamCreate(...) // legacy`); the follow-up self-pattern exemption was ALSO a
// bypass (`TeamCreate({}); // no-dead-team-tools` false-passed). A proximity-based
// removal-context regex can't reliably separate a real call ("TeamDelete(t); // team
// is gone") from prose describing one — the distinction is semantic. So the rule is
// absolute: a CALL FORM (`TeamCreate(` / `TeamDelete(`, incl. whitespace) is ALWAYS a
// violation in the scanned ACTIVE layer (skills/hooks/scripts/agent specs). Legitimate
// prose AVOIDS the call form (write "the TeamCreate call" / `TeamCreate`, never
// "TeamCreate(…)"). The history/decision layer that NEEDS the call form (adr/, _docs,
// _planning, _reports, _warpos, events, tests/regression) is PATH-SCOPED out
// (SKIP_DIRS / SKIP_SEGMENTS). This enforcer's OWN two pattern-definition files are
// skipped WHOLESALE by SELF_FILES in walk() — NOT by a line-level marker (which any
// scanned file could carry to bypass the gate). lineIsExempt is therefore the empty
// policy: nothing exempts a call-form line.
function lineIsExempt(/* line */) {
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
 * SECOND positive check (β rider, hardened per qa-HIGH): confirm the NEW remediation
 * primitive still EXISTS AND is a REAL Agent-spawn shape — not merely the substring
 * `run_in_background`. Each migrated MODE skill (sprint + adhoc) must contain an
 * actual `Agent( … subagent_type … run_in_background … )` invocation, so a dead-tool
 * migration can never leave NO working path (and a future edit can't reduce the
 * remediation to a bare keyword). Uses fs (kept OUT of the pure `evaluate`). Returns
 * an array of offender objects (one per mode skill missing the shape); [] = all good.
 */
function assertRemediationExists() {
  // The real spawn shape: an `Agent(` call that, within the same call, names a
  // subagent_type AND sets run_in_background. Multiline (the call spans lines), so we
  // match `Agent(` then require both tokens before the next blank line / closing.
  const AGENT_SPAWN_RE =
    /Agent\(\s*[\s\S]{0,400}?subagent_type[\s\S]{0,400}?run_in_background\s*[:=]\s*true/i;
  const required = [".claude/commands/mode/sprint.md", ".claude/commands/mode/adhoc.md"];
  const offenders = [];
  for (const rel of required) {
    const abs = path.join(ROOT, rel);
    let ok = false;
    try {
      ok = AGENT_SPAWN_RE.test(fs.readFileSync(abs, "utf8"));
    } catch {
      ok = false; // missing/unreadable migrated skill ⇒ remediation not provable
    }
    if (!ok) {
      offenders.push({
        path: rel,
        line: 0,
        lineno: 0,
        text:
          "NEW remediation not found: no real Agent(subagent_type…, run_in_background:true) spawn shape in this migrated mode skill — a dead-tool migration must leave a WORKING spawn path, not just the keyword",
      });
    }
  }
  return offenders;
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
  // assertRemediationExists now returns an ARRAY (one offender per mode skill that
  // lacks the real Agent-spawn shape) — push them all.
  for (const miss of assertRemediationExists()) offenders.push(miss);
  return { ok: offenders.length === 0, offenders, scanned };
}

module.exports = { evaluate, assertRemediationExists };

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
=== END ===
