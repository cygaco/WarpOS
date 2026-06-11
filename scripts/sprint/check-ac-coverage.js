#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * scripts/sprint/check-ac-coverage.js
 *
 * Read-only audit skill (/scan:ac-coverage). Scans active sprints + their
 * acceptance-criteria.md files and reports per-AC linkage state:
 *   - executable: has a real `verified_by: <file>::<name>` line
 *   - not_applicable: has `verified_by: not_applicable — <justification>`
 *   - missing: AC line not followed by any verified_by: linkage
 *
 * Diagnostic only — never modifies tracker state. Per Beta Q1 (PC-20260518-0011):
 * empty justification = same as missing.
 *
 * Usage:
 *   node scripts/sprint/check-ac-coverage.js                # prose, current primary sprint
 *   node scripts/sprint/check-ac-coverage.js --sprint <id>  # target specific sprint
 *   node scripts/sprint/check-ac-coverage.js --json         # machine output
 *
 * Exit codes:
 *   0  all ACs linked (executable or not_applicable) OR no goal_verification
 *      contract on the sprint (gate not applicable)
 *   1  one or more ACs missing linkage
 *   2  usage error
 */

"use strict";

const fs = require("fs");
const path = require("path");
const SPRINT = require("./paths");
const { readYamlMaybe } = require("./fs");
const { AC_CATEGORIES } = require("./ac-categories");
// SHARED legacy-scoping cutoff (AC-8.3 / Hard AC #3) — IMPORTED from WS-G3a's
// authored helper (R-5 AC-5.4), NOT re-defined. The SAME single source coverage-
// gate-scan (R-5) consumes; `cutoffFor("check-ac-coverage")` resolves the shared
// LEGACY_CUTOFF (this consumer declares no override — its enforce path was wired in
// the SAME sprint, same date as R-5). A divergent date would be an explicit
// CONSUMER_OVERRIDES entry in legacy-cutoff.js with a written rationale, never a
// second hardcoded literal here.
const { cutoffFor, isLegacyDate } = require("../dispatch/legacy-cutoff");

function parseArgs(argv) {
  const out = {
    sprint: null,
    json: false,
    help: false,
    categories: false,
    file: null,
    enforce: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--sprint") out.sprint = argv[++i];
    else if (a === "--json") out.json = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--categories") out.categories = true;
    else if (a === "--file") out.file = argv[++i];
    else if (a === "--enforce") out.enforce = true;
  }
  return out;
}

const HELP = `check-ac-coverage — read-only audit of AC coverage on two axes.

Axis 1 (default) — per-AC verified_by: linkage:
  node scripts/sprint/check-ac-coverage.js [--sprint <SP-id>] [--json]

Axis 2 (--categories) — the 20 enforcement-criteria categories (S-LC-11, PLAN §11):
  node scripts/sprint/check-ac-coverage.js --categories [--sprint <SP-id>] [--json]
  node scripts/sprint/check-ac-coverage.js --categories --file <plan|epic|AC artifact>
    Report-only ramp: a plan missing categories is FLAGGED (exit 0), NOT blocked.
    --enforce   exit non-zero when a category is uncovered (off by default).
    Fail-open: an unreadable/absent artifact reports nothing and exits 0 clean.
    Single source for the category list: scripts/sprint/ac-categories.js.

Exit: 0 = clean OR no goal_verification gate OR report-only categories,
      1 = missing linkage (axis 1) / uncovered category under --enforce (axis 2),
      2 = usage error.
`;

const placeholderRegex = /\{\{|<test-file>|<test-name>/;
const acRegex = /\bAC-\d+(?:\.\d+)+\b/;

// Shared classifier for the text after a `verified_by:` token. Used by BOTH the
// per-AC linkage audit (analyzeFile) AND the 20-category proof detection
// (chunkHasProof) — single parser, no fork. Returns { state, evidence } where
// state ∈ { executable, not_applicable, missing }.
function classifyVerifiedByRest(rest) {
  if (/^not_applicable\b/i.test(rest)) {
    const justMatch = rest.match(/^not_applicable\s*(?:—|--|-)?\s*(.*)$/i);
    const j2 = justMatch ? justMatch[1].trim() : "";
    if (!j2) {
      return { state: "missing", evidence: "not_applicable-empty-justification" };
    }
    return { state: "not_applicable", evidence: j2 };
  }
  if (/^\S+::\S+/.test(rest)) {
    return { state: "executable", evidence: rest };
  }
  return { state: "missing", evidence: `unrecognized: ${rest}` };
}

function analyzeFile(acMarkdown) {
  const lines = acMarkdown.split(/\r?\n/);
  const details = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(acRegex);
    if (!m) continue;
    let state = "missing";
    let evidence = null;
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const cand = lines[j];
      if (/^\s*$/.test(cand)) continue;
      if (acRegex.test(cand)) break;
      const linkMatch = cand.match(/verified_by\s*:\s*(.+?)\s*$/i);
      if (!linkMatch) continue;
      const rest = linkMatch[1];
      if (placeholderRegex.test(cand)) {
        state = "missing";
        evidence = "placeholder";
        break;
      }
      const c = classifyVerifiedByRest(rest);
      state = c.state;
      evidence = c.evidence;
      break;
    }
    details.push({
      ac: m[0],
      line: i + 1,
      state,
      evidence,
    });
  }
  return details;
}

// ── Axis 2: the 20 enforcement-criteria categories (S-LC-11, PLAN §11) ────────
// A different axis from the Given/When/Then AC linkage above: "does this AC
// artifact carry AC for ALL 20 categories, each with a proof?" Report-only.

const proofPlaceholderRegex = /\{\{|<test-file>|<test-name>|<proof>|<fill/i;

function normalizeLine(s) {
  return String(s).toLowerCase().replace(/\s+/g, " ").trim();
}

// A proof value is a STUB (named but unproven) if empty, a placeholder, or a
// "to-do" marker. Anchored leading-word match catches `TODO: write fixture`.
function isStubProof(v) {
  if (!v) return true;
  if (proofPlaceholderRegex.test(v)) return true;
  if (
    /^(todo|tbd|t\.?b\.?d\.?|pending|fixme|wip|n\/a|na|xxx|\.\.\.|placeholder|stub|none|fill[\s-]?me|fill in)\b/i.test(
      v,
    )
  ) {
    return true;
  }
  return false;
}

// Does this window of text carry a real proof for the category named in it?
// Reuses classifyVerifiedByRest so verified_by linkage is recognized identically
// to axis 1; also accepts a non-stub `proof:` / `proven by` clause.
//
// AC-8.4 — DOCUMENTED RESIDUE (SP-20260611-002 R-8, finding #18 minor; verified_by:
// not_applicable): the proof-syntax acceptance here is LENIENT — a non-stub clause
// like `proof: yes` is accepted as a covered category even though "yes" is not real
// evidence. This is a KNOWN weakness, explicitly OUT OF SCOPE for this sprint (the
// R-8 fix is the missing-artifact fail-closed path + legacy scoping; the proof-syntax
// minor is carried, not fixed, so it is not silently dropped). A future ticket would
// tighten isStubProof / require an executable verified_by here. DO NOT silently treat
// this as resolved.
function chunkHasProof(chunk) {
  const vb = chunk.match(/verified_by\s*:\s*([^\n]+)/i);
  if (vb) {
    const rest = vb[1].trim();
    if (!proofPlaceholderRegex.test(rest) && !placeholderRegex.test(rest)) {
      const c = classifyVerifiedByRest(rest);
      if (c.state === "executable" || c.state === "not_applicable") return true;
    }
  }
  // Require a `proof:` label (with colon) so the literal word "proof" inside a
  // category name (e.g. "correct completion proof") never reads as a proof; the
  // `proven by` form is matched separately.
  let pm = chunk.match(/\bproof\s*:\s*([^\n]+)/i);
  if (!pm) pm = chunk.match(/\bproven by\b\s*[:\-—]*\s*([^\n]+)/i);
  if (pm) {
    const v = pm[1].trim().replace(/[*_`]+\s*$/, "").trim();
    if (v && !isStubProof(v)) return true;
  }
  return false;
}

/**
 * Check 20-category coverage of an AC artifact's markdown. A category is
 * `covered` when the artifact NAMES it AND a proof/verified_by sits in its
 * window; `named_no_proof` when named but unproven (a bare stub); `missing` when
 * not named at all. PURE (no fs). Returns a harness-friendly shape: `ok` /
 * `findings` mirror `complete` / `uncovered` so fixture-harness reads it.
 */
function checkCategoryCoverage(acMarkdown, categories = AC_CATEGORIES) {
  const text = typeof acMarkdown === "string" ? acMarkdown : "";
  const lines = text.split(/\r?\n/);
  const norm = lines.map(normalizeLine);
  const normCats = categories.map((c) => normalizeLine(c));

  const details = categories.map((cat, ci) => {
    const ncat = normCats[ci];
    let nameLine = -1;
    for (let i = 0; i < norm.length; i++) {
      if (norm[i].includes(ncat)) {
        nameLine = i;
        break;
      }
    }
    if (nameLine === -1) {
      return { category: cat, state: "missing", line: null };
    }
    // Build a small window: the naming line + following lines, stopping at a
    // heading or a line that names a DIFFERENT category.
    const windowLines = [lines[nameLine]];
    for (let j = nameLine + 1; j < Math.min(nameLine + 5, lines.length); j++) {
      if (/^\s*#{1,6}\s/.test(lines[j])) break;
      const namesOther = normCats.some(
        (other, oi) => oi !== ci && norm[j].includes(other),
      );
      if (namesOther) break;
      windowLines.push(lines[j]);
    }
    const proven = chunkHasProof(windowLines.join("\n"));
    return {
      category: cat,
      state: proven ? "covered" : "named_no_proof",
      line: nameLine + 1,
    };
  });

  const missing = details.filter((d) => d.state === "missing").map((d) => d.category);
  const namedNoProof = details
    .filter((d) => d.state === "named_no_proof")
    .map((d) => d.category);
  const covered = details.filter((d) => d.state === "covered");
  const uncovered = details.filter((d) => d.state !== "covered").map((d) => d.category);

  return {
    total: categories.length,
    covered: covered.length,
    missing,
    named_no_proof: namedNoProof,
    uncovered,
    // harness-friendly aliases (empty findings + ok:true == a pass)
    findings: uncovered,
    ok: uncovered.length === 0,
    complete: uncovered.length === 0,
    details,
  };
}

// Resolve a sprint's acceptance-criteria.md absolute path (or null). Fail-open.
function resolveAcPath(sprintId) {
  try {
    const per =
      typeof SPRINT.forSprint === "function" ? SPRINT.forSprint(sprintId) : null;
    if (!per || !per.current || !fs.existsSync(per.current)) return null;
    const current = readYamlMaybe(per.current);
    if (!current) return null;
    const acRel =
      current.requirements && current.requirements.acceptance_criteria;
    if (!acRel) return null;
    return path.resolve(SPRINT.PROJECT, acRel);
  } catch {
    return null;
  }
}

// Parse the YYYY-MM-DD a sprint id encodes (SP-YYYYMMDD-NNN). Returns the ISO day or
// null. Used for AC-8.3 legacy scoping: a historic sprint (id-date before the shared
// cutoff) is legacy-exempt; an undatable id is NOT legacy (fail-closed).
function sprintIsoDate(sprintId) {
  const m = typeof sprintId === "string" && sprintId.match(/(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

// A `target` carries `named:true` when it names a concrete artifact (a `--file` path,
// or a sprint's resolved acceptance-criteria.md). The AC-8.1 fail-closed change keys
// on `named` + an `error` (unreadable NAMED artifact). The AC-8.2 greenfield case is
// `targets.length === 0` — NO named artifact resolved at all — and stays fail-open.
function categoryTargets(args) {
  if (args.file) {
    return [
      {
        label: args.file,
        path: path.resolve(SPRINT.PROJECT, args.file),
        named: true,
        // a --file target is not sprint-scoped → no legacy date (undatable ⇒ in scope).
        date: null,
      },
    ];
  }
  const ids = args.sprint
    ? [args.sprint]
    : activeSprintIds().length
      ? activeSprintIds()
      : [SPRINT.active && SPRINT.active()].filter(Boolean);
  const targets = [];
  for (const id of ids) {
    const acPath = resolveAcPath(id);
    // A sprint whose AC artifact resolves but is MISSING/unreadable is still a NAMED
    // target (we resolved a concrete expected path for it) — under --enforce that is a
    // fail-closed failure (AC-8.1), not the greenfield no-target case.
    if (acPath) {
      targets.push({
        label: id,
        path: acPath,
        named: true,
        date: sprintIsoDate(id),
        exists: fs.existsSync(acPath),
      });
    }
  }
  return targets;
}

function renderCategoryProse(r) {
  if (r.error) {
    if (r.enforceError) {
      // NAMED + in-scope unreadable artifact → fail-closed under --enforce (AC-8.1).
      return `ac-coverage (categories) — ${r.label}: FAIL (NAMED artifact unreadable: ${r.error} — fail-CLOSED under --enforce)`;
    }
    const why = r.legacyExempt ? "legacy-exempt, historic" : "fail-open";
    return `ac-coverage (categories) — ${r.label}: SKIP (${r.error}; ${why})`;
  }
  const lines = [];
  if (r.legacyExempt && Array.isArray(r.uncovered) && r.uncovered.length) {
    lines.push(
      `ac-coverage (categories) — ${r.label}: ${r.covered}/${r.total} covered (LEGACY-EXEMPT — historic, gaps are INFO not blocking)`,
    );
    return lines.join("\n");
  }
  lines.push(
    `ac-coverage (categories) — ${r.label}: ${r.covered}/${r.total} covered, ${r.missing.length} missing, ${r.named_no_proof.length} named-but-unproven`,
  );
  if (r.uncovered.length) {
    lines.push(
      `  FLAGGED (report-only) — ${r.uncovered.length} category(ies) need AC + proof:`,
    );
    for (const cat of r.missing) {
      lines.push(`    - ${cat} (not named in the artifact)`);
    }
    for (const cat of r.named_no_proof) {
      lines.push(`    - ${cat} (named, but no proof/verified_by)`);
    }
  }
  return lines.join("\n");
}

function runCategoryMode(args, inject = {}) {
  // `inject.targets` is a test seam (per-surface exploit isolation, Hard AC #4): a
  // fixture passes an explicit, dated target list so the legacy-scoping + fail-closed
  // branches are exercised deterministically without a real sprint registry. Prod
  // callers pass no inject → the real categoryTargets resolution runs.
  const targets = inject.targets || categoryTargets(args);
  const cutoff = cutoffFor("check-ac-coverage"); // SHARED — see import note.
  const reports = targets.map((t) => {
    // AC-8.3: a target dated STRICTLY BEFORE the shared cutoff is historic (legacy-
    // exempt) — an unreadable/gappy historic artifact does NOT red the new enforce
    // path. An undatable target (e.g. a --file path, or an unparsable sprint id) is
    // NOT legacy (fail-closed) → in scope of the enforce path (scope-then-flip).
    const legacyExempt = isLegacyDate(t.date, cutoff);
    let md;
    try {
      md = fs.readFileSync(t.path, "utf8");
    } catch (e) {
      // A NAMED artifact that is missing/unreadable. Under --enforce this is a
      // FAILURE (AC-8.1) UNLESS the target is legacy-exempt; in report-only it stays
      // ok:true (historic fail-open). The `enforceError` flag is what runCategoryMode
      // keys the exit on — distinct from a content `error` that the old anyGap
      // filtered away (the #18 false-green).
      const enforceError = Boolean(t.named) && !legacyExempt;
      return {
        label: t.label,
        error: "unreadable",
        named: Boolean(t.named),
        legacyExempt,
        // enforceError marks "a NAMED artifact failed to read, and it is in scope":
        // a fail-closed condition the enforce gate must NOT pass.
        enforceError,
        // ok mirrors the gate posture: under --enforce a named+in-scope unreadable
        // artifact is NOT ok; otherwise the historic report-only ok:true is kept.
        ok: !(args.enforce && enforceError),
        errorDetail: String((e && e.message) || e),
        total: AC_CATEGORIES.length,
        covered: 0,
        missing: [],
        named_no_proof: [],
        uncovered: [],
      };
    }
    return { label: t.label, legacyExempt, named: Boolean(t.named), ...checkCategoryCoverage(md) };
  });

  if (args.json) {
    process.stdout.write(JSON.stringify(reports, null, 2) + "\n");
  } else {
    if (!reports.length) {
      // AC-8.2: NO named artifact resolved at all (greenfield) → fail-open, exit 0,
      // even under --enforce. The fail-closed change is for a NAMED-but-unreadable
      // artifact, never the absence of any target.
      process.stdout.write(
        "ac-coverage (categories) — no AC artifact to audit (greenfield: fail-open, exit 0)\n",
      );
    }
    for (const r of reports) process.stdout.write(renderCategoryProse(r) + "\n");
    process.stdout.write(
      `\nmode: report-only (${args.enforce ? "--enforce: exit non-zero on gaps + unreadable NAMED artifacts" : "default: gaps are FLAGGED, exit 0"}) · cutoff: ${cutoff} · single source: scripts/sprint/ac-categories.js (${AC_CATEGORIES.length} categories)\n`,
    );
  }

  // A real coverage gap on a readable, in-scope (non-legacy) artifact.
  const anyGap = reports.some(
    (r) => !r.error && !r.legacyExempt && Array.isArray(r.uncovered) && r.uncovered.length > 0,
  );
  // AC-8.1: a NAMED artifact that failed to read AND is in scope (not legacy) is a
  // fail-closed failure under --enforce — closing the {error, ok:true} false-green.
  const anyEnforceError = reports.some((r) => r.enforceError);
  return args.enforce && (anyGap || anyEnforceError) ? 1 : 0;
}

function checkSprint(sprintId) {
  const entry =
    typeof SPRINT.entry === "function" ? SPRINT.entry(sprintId) : null;
  if (!entry && sprintId) {
    return {
      sprint_id: sprintId,
      error: `unknown sprint id ${sprintId} in active-sprints.yaml`,
    };
  }
  const per =
    typeof SPRINT.forSprint === "function" ? SPRINT.forSprint(sprintId) : null;
  if (!per || !per.current) {
    return { sprint_id: sprintId, error: "no per-sprint current.yaml" };
  }
  const current = readYamlMaybe(per.current);
  if (!current) {
    return { sprint_id: sprintId, error: "current.yaml unreadable" };
  }
  const plan = current.plan_contract
    ? readYamlMaybe(path.resolve(SPRINT.PROJECT, current.plan_contract))
    : null;
  const gv = plan && plan.goal_verification;
  const acRel =
    current.requirements && current.requirements.acceptance_criteria;
  if (!acRel) {
    return {
      sprint_id: sprintId,
      gate_applicable: Boolean(gv),
      error: "no acceptance-criteria.md linked from current sprint",
    };
  }
  const acPath = path.resolve(SPRINT.PROJECT, acRel);
  if (!fs.existsSync(acPath)) {
    return {
      sprint_id: sprintId,
      gate_applicable: Boolean(gv),
      error: `acceptance-criteria.md missing at ${acPath}`,
    };
  }
  const details = analyzeFile(fs.readFileSync(acPath, "utf8"));
  const exec = details.filter((d) => d.state === "executable").length;
  const na = details.filter((d) => d.state === "not_applicable").length;
  const missing = details.filter((d) => d.state === "missing").length;
  return {
    sprint_id: sprintId,
    title: current.title,
    gate_applicable: Boolean(gv),
    goal_verification_reproduction: gv ? gv.reproduction : null,
    acceptance_criteria_path: acRel,
    total_acs: details.length,
    executable: exec,
    not_applicable: na,
    missing,
    details,
  };
}

function activeSprintIds() {
  try {
    const reg = readYamlMaybe(SPRINT.activeRegistry);
    if (!reg || !Array.isArray(reg.sprints)) return [];
    return reg.sprints
      .filter(
        (s) =>
          s &&
          s.status !== "closed" &&
          s.status !== "abandoned" &&
          s.status !== "retrospected",
      )
      .map((s) => s.id);
  } catch {
    return [];
  }
}

function renderProse(report) {
  const lines = [];
  if (report.error) {
    lines.push(
      `ac-coverage — sprint ${report.sprint_id}: ERROR ${report.error}`,
    );
    return lines.join("\n");
  }
  lines.push(
    `ac-coverage — sprint ${report.sprint_id}: ${report.executable} executable, ${report.not_applicable} not_applicable, ${report.missing} missing  (total: ${report.total_acs})`,
  );
  if (!report.gate_applicable) {
    lines.push(
      `  note: plan_contract has no goal_verification block — gate is not applicable; report is informational.`,
    );
  }
  if (report.missing > 0) {
    lines.push(`  missing ACs:`);
    for (const d of report.details) {
      if (d.state === "missing") {
        lines.push(
          `    - ${d.ac} (line ${d.line}; ${d.evidence || "no verified_by line"})`,
        );
      }
    }
  }
  return lines.join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    process.stdout.write(HELP);
    return 0;
  }
  // Axis 2 — the 20 enforcement-criteria categories (S-LC-11). Report-only.
  if (args.categories) {
    return runCategoryMode(args);
  }
  const sprintIds = args.sprint
    ? [args.sprint]
    : (() => {
        if (
          typeof SPRINT.active === "function" &&
          SPRINT.active() &&
          typeof activeSprintIds === "function"
        ) {
          const ids = activeSprintIds();
          return ids.length ? ids : [SPRINT.active()];
        }
        return [SPRINT.active && SPRINT.active()].filter(Boolean);
      })();
  if (sprintIds.length === 0) {
    process.stderr.write("no active sprints to audit\n");
    return 1;
  }
  const reports = sprintIds.map(checkSprint);
  if (args.json) {
    process.stdout.write(JSON.stringify(reports, null, 2) + "\n");
  } else {
    for (const r of reports) {
      process.stdout.write(renderProse(r) + "\n");
    }
  }
  // Exit 1 if any sprint with gate_applicable has missing>0.
  const bad = reports.some(
    (r) => !r.error && r.gate_applicable && r.missing > 0,
  );
  return bad ? 1 : 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  main,
  checkSprint,
  analyzeFile,
  parseArgs,
  classifyVerifiedByRest,
  checkCategoryCoverage,
  chunkHasProof,
  isStubProof,
  resolveAcPath,
  runCategoryMode,
  categoryTargets,
  sprintIsoDate,
  AC_CATEGORIES,
};
