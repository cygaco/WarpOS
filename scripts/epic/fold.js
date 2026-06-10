#!/usr/bin/env node
"use strict";

/**
 * scripts/epic/fold.js — `/epic:fold` backing logic (S-LC-09, Wave 3 of
 * E-LIFECYCLE-001).
 *
 * Requirement (source prompt §G): fold new information / constraints / bugs /
 * scope into an EXISTING epic INTELLIGENTLY, "without breaking already-planned
 * items." This script does the mechanical, non-judgment half:
 *
 *   1. CLASSIFY the incoming item into one of the 14 taxonomy classes
 *      (clarification · scope-addition · scope-reduction · acceptance-criterion ·
 *       constraint · risk · dependency · sprint-candidate · tracker-correction ·
 *       open-question · user-preference · enforcement-requirement ·
 *       blast-radius-finding · compatibility-warning).
 *      The skill body may pass `type` after its own reasoning; otherwise a
 *      deterministic keyword classifier (lib.classifyFold) is the fallback.
 *   2. DETECT CONFLICTS with the epic's stable commitments (frontmatter Scope /
 *      Out of scope / the ## Decisions section). A conflict is FLAGGED, never
 *      silently applied — the Scope/Decisions sections are NEVER edited by a fold;
 *      only the ## Change log gains a provenance entry. Stable decisions are
 *      preserved unless the item explicitly carries `supersedes: true`, and even
 *      then the supersession is recorded with provenance + flagged for approval.
 *   3. APPEND a provenance Change Log entry (date + source) carrying an
 *      idempotency marker so a re-fold of the same item is a no-op.
 *   4. PRODUCE a fold report.
 *
 * DISCIPLINE: read-before-write (the CLI reads the existing epic first; refuses
 * if absent), idempotent (an already-applied fold is a no-op), PURE core
 * (foldIntoEpic) with no fs/cwd so the suite bite-tests it directly.
 *
 * Usage:
 *   node scripts/epic/fold.js --epic <epic-file> --text "<item>" \
 *        [--type <class>] [--source <who/where>] [--date <YYYY-MM-DD>] \
 *        [--conflicts-with "<substring>"] [--supersedes] [--dry-run]
 *
 * Exit codes:
 *   0  folded (entry appended) OR no-op (already applied) OR dry-run
 *   1  fold failed (no ## Change log section, bad item)
 *   2  bad usage
 *   3  epic file not found (read-before-write guard)
 *   4  folded BUT a conflict was flagged (caller must resolve) — non-fatal signal
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { classifyFold, FOLD_CLASSES, splitSections } = require("./lib");

// Classes that require user approval before they reshape committed plan items
// (taste-heavy or irreversible-leaning — source §G step 10).
const APPROVAL_CLASSES = new Set(["scope-reduction", "user-preference", "tracker-correction"]);

const STOPWORDS = new Set(
  ("the a an and or of to in on for with into is are be as at by from that this it its " +
    "we you they will should must can not no new old all any per via has have had").split(/\s+/),
);

function shortHash(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex").slice(0, 8);
}

/** Choose the classification: explicit `type` (validated) wins; else heuristic. */
function classify(item) {
  const explicit = item && item.type ? String(item.type).trim().toLowerCase() : "";
  if (explicit && FOLD_CLASSES.includes(explicit)) return explicit;
  return classifyFold(item && item.text);
}

/**
 * The epic's STABLE-commitment text: the frontmatter Scope / Out of scope bullets
 * plus the ## Decisions and (if present) ## Scope sections. These are what a fold
 * must not silently overwrite.
 */
function stableCommitmentText(epicMarkdown) {
  const lines = String(epicMarkdown == null ? "" : epicMarkdown).split(/\r?\n/);
  const parts = [];
  for (const ln of lines) {
    if (/^\s*-\s*\*\*(scope|out of scope)\s*:\*\*/i.test(ln)) parts.push(ln);
  }
  const sections = splitSections(epicMarkdown, 2).filter((s) => s.level === 2);
  for (const s of sections) {
    if (s.headingText === "decisions" || s.headingText === "scope") parts.push(s.body || "");
  }
  return parts.join("\n");
}

/**
 * Detect a conflict between the incoming item and the epic's stable commitments.
 * PURE. Returns { ok, conflict, with, supersedes }.
 *   - `ok` is the enforcer-friendly verdict: ok === !conflict (a flagged conflict
 *     reads as NOT-ok so a planted conflicting item is caught by the suite).
 *   - explicit item.conflictsWith (a substring the skill identified) is the
 *     strongest signal; else a keyword-overlap heuristic for the scope-touching
 *     classes (scope-reduction / scope-addition / tracker-correction).
 */
function detectConflict(item, epicMarkdown) {
  const stable = stableCommitmentText(epicMarkdown).toLowerCase();
  const cls = classify(item);
  const supersedes = !!(item && item.supersedes);

  // (1) explicit conflict substring.
  const cw = item && item.conflictsWith ? String(item.conflictsWith).trim() : "";
  if (cw && stable.includes(cw.toLowerCase())) {
    return { ok: false, conflict: true, with: cw, supersedes };
  }

  // (2) heuristic for scope-touching classes: a significant content word from the
  // item that also appears in the stable commitments signals an overlap/contradiction.
  if (cls === "scope-reduction" || cls === "scope-addition" || cls === "tracker-correction") {
    const words = String((item && item.text) || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 5 && !STOPWORDS.has(w));
    for (const w of words) {
      if (stable.includes(w)) {
        // scope-reduction contradicting an existing commitment is the load-bearing case.
        if (cls === "scope-reduction" || cls === "tracker-correction") {
          return { ok: false, conflict: true, with: w, supersedes };
        }
      }
    }
  }

  return { ok: true, conflict: false, with: null, supersedes };
}

/** Build the provenance Change Log entry markdown (PURE). */
function buildFoldEntry({ date, source, classification, text, conflict, supersedes, marker }) {
  const lines = [];
  lines.push(`### ${date} — fold (${classification}) — source: ${source}`);
  lines.push(`- Folded: ${text}`);
  lines.push(`- Classification: ${classification}`);
  lines.push(`- Provenance: ${date} · source: ${source} · ${marker}`);
  if (conflict && conflict.conflict) {
    lines.push(
      `- ⚠ CONFLICT FLAGGED: overlaps a stable commitment ("${conflict.with}"). ` +
        (supersedes
          ? "Item explicitly supersedes it — recorded; Scope/Decisions NOT auto-edited (resolve in a deliberate edit)."
          : "NOT applied to Scope/Decisions — requires resolution before any plan-item change."),
    );
  }
  if (APPROVAL_CLASSES.has(classification)) {
    lines.push(`- Approval: this class is taste-heavy/irreversible-leaning — requires user approval before it reshapes committed items.`);
  }
  return lines.join("\n");
}

/**
 * Fold an item into an epic markdown. PURE — returns a NEW string, never mutates
 * the Scope/Decisions sections. Idempotent via the per-item marker.
 *
 * @returns {{ ok, updated, report, classification, conflict, alreadyApplied,
 *             requiresApproval, provenance, error }}
 */
function foldIntoEpic(epicMarkdown, item, opts = {}) {
  const md = String(epicMarkdown == null ? "" : epicMarkdown);
  if (!item || !item.text || !String(item.text).trim()) {
    return { ok: false, error: "item.text is required", updated: md };
  }
  const date = (opts.date || item.date || "TBD-DATE").toString();
  const source = (opts.source || item.source || "operator").toString();
  const classification = classify(item);
  const text = String(item.text).trim();
  const marker = `<!-- fold:${shortHash(`${classification}|${source}|${text}`)} -->`;

  // Idempotency: an already-applied fold (same class+source+text) is a no-op.
  if (md.includes(marker)) {
    return {
      ok: true,
      updated: md,
      alreadyApplied: true,
      classification,
      conflict: { ok: true, conflict: false, with: null },
      requiresApproval: APPROVAL_CLASSES.has(classification),
      report: `[no-op] item already folded (${classification}); marker ${marker} present.`,
      provenance: { date, source, marker },
    };
  }

  const conflict = detectConflict(item, md);

  // Locate the ## Change log section; the entry appends to the END of it (just
  // before the next H2, or EOF). The Scope/Decisions sections are never touched.
  const lines = md.split(/\r?\n/);
  let clIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+change\s*log\b/i.test(lines[i])) {
      clIdx = i;
      break;
    }
  }
  if (clIdx === -1) {
    return { ok: false, error: "epic has no `## Change log` section to record provenance", updated: md, classification };
  }
  // Find the next H2 after the Change log heading → insertion boundary.
  let insertAt = lines.length;
  for (let i = clIdx + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      insertAt = i;
      break;
    }
  }
  // Trim trailing blank lines inside the section so the entry sits cleanly.
  let tail = insertAt;
  while (tail > clIdx + 1 && lines[tail - 1].trim() === "") tail--;

  const entry = buildFoldEntry({ date, source, classification, text, conflict, supersedes: conflict.supersedes, marker });
  const block = ["", entry];
  const updated = lines.slice(0, tail).concat(block, lines.slice(tail)).join("\n");

  const report =
    `fold: classified "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}" as [${classification}] ` +
    `(source: ${source}, ${date}). ` +
    (conflict.conflict
      ? `⚠ CONFLICT with stable commitment "${conflict.with}" — FLAGGED, not applied to Scope/Decisions.`
      : `no conflict with stable commitments.`) +
    (APPROVAL_CLASSES.has(classification) ? " Requires user approval (taste/irreversible-leaning class)." : "");

  return {
    ok: true,
    updated,
    alreadyApplied: false,
    classification,
    conflict,
    requiresApproval: APPROVAL_CLASSES.has(classification) || conflict.conflict,
    report,
    provenance: { date, source, marker },
  };
}

// ── Thin CLI (read-before-write) ──────────────────────────────────────────────

function parseArgs(argv) {
  const out = { epic: null, text: null, type: null, source: null, date: null, conflictsWith: null, supersedes: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--epic") out.epic = argv[++i];
    else if (a === "--text") out.text = argv[++i];
    else if (a === "--type") out.type = argv[++i];
    else if (a === "--source") out.source = argv[++i];
    else if (a === "--date") out.date = argv[++i];
    else if (a === "--conflicts-with") out.conflictsWith = argv[++i];
    else if (a === "--supersedes") out.supersedes = true;
    else if (a === "--dry-run") out.dryRun = true;
  }
  return out;
}

function run(argv) {
  const args = parseArgs(argv);
  if (!args.epic || !args.text) {
    process.stderr.write('usage: node scripts/epic/fold.js --epic <file> --text "<item>" [--type <class>] [--source <who>] [--date <YYYY-MM-DD>] [--conflicts-with "<sub>"] [--supersedes] [--dry-run]\n');
    return 2;
  }
  const epicAbs = path.resolve(args.epic);
  if (!fs.existsSync(epicAbs)) {
    process.stderr.write(`/epic:fold — epic file not found: ${args.epic}\n`);
    return 3;
  }
  const before = fs.readFileSync(epicAbs, "utf8"); // read-before-write

  const item = {
    text: args.text,
    type: args.type || undefined,
    source: args.source || undefined,
    date: args.date || undefined,
    conflictsWith: args.conflictsWith || undefined,
    supersedes: args.supersedes,
  };
  const res = foldIntoEpic(before, item, { source: args.source, date: args.date });
  if (!res.ok) {
    process.stderr.write(`/epic:fold — ${res.error}\n`);
    return 1;
  }

  if (!args.dryRun && !res.alreadyApplied) {
    fs.writeFileSync(epicAbs, res.updated, "utf8");
  }

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        epic: args.epic,
        classification: res.classification,
        conflict: !!(res.conflict && res.conflict.conflict),
        conflict_with: res.conflict ? res.conflict.with : null,
        already_applied: !!res.alreadyApplied,
        requires_approval: !!res.requiresApproval,
        provenance: res.provenance,
        report: res.report,
        dry_run: !!args.dryRun,
      },
      null,
      2,
    ) + "\n",
  );

  // A flagged conflict is a non-fatal signal (exit 4) so a caller/CI can require resolution.
  return res.conflict && res.conflict.conflict ? 4 : 0;
}

module.exports = {
  classify,
  detectConflict,
  stableCommitmentText,
  buildFoldEntry,
  foldIntoEpic,
  parseArgs,
  run,
  APPROVAL_CLASSES,
};

if (require.main === module) {
  process.exit(run(process.argv));
}
