#!/usr/bin/env node
"use strict";

/**
 * scripts/checks/memory-apply.js — the GATED mutation executor for file-based
 * memory stores. This is the CODE that makes /memory:verify's Phase-3
 * correct/delete safety rules safe BY CONSTRUCTION (they were PROSE ONLY — no
 * code enforced --apply, contradicted-only-delete, or ground-truth evidence).
 *
 * The read-only detector (scripts/checks/memory-integrity.js) NEVER writes; this
 * executable is the ONE place a memory file is ever deleted/rewritten, and only
 * when a plan clears every safety gate under an explicit --apply. It REUSES the
 * detector's parsers (parseIndex) for the MEMORY.md index re-sync and its run()
 * for the post-mutation structural post-check (bijection must stay intact).
 *
 * CLI:
 *   node scripts/checks/memory-apply.js --plan <plan.json> [--apply] [--json]
 *
 *   - default (no --apply): DRY-RUN — validate + print the planned ops, mutate
 *     NOTHING, exit 0 (or exit 2 if the plan is invalid/unsafe).
 *   - --apply: only reached when validatePlan is clean — perform each op, re-sync
 *     the index for deletes, then require the store structurally CLEAN.
 *
 * PLAN shape (produced by the agent after its semantic ground-truth pass):
 *   {
 *     "store": "<memory store dir (abs or repo-relative)>",
 *     "changes": [
 *       { "file": "<name.md>",
 *         "classification": "verified" | "contradicted" | "unverifiable",
 *         "action": "none" | "correct" | "delete",
 *         "evidence": "<ground-truth citation — grep/read/git/TRACKER result>",
 *         "newBody": "<full replacement file content — REQUIRED for action:correct>" }
 *     ]
 *   }
 *
 * SAFETY INVARIANTS (pure validatePlan, fully unit-tested — the gate):
 *   - correct/delete REQUIRE classification === "contradicted" (an UNVERIFIABLE or
 *     verified memory is NEVER mutated — "couldn't verify" is not "delete");
 *   - correct/delete REQUIRE non-empty ground-truth evidence;
 *   - correct REQUIRES a non-empty newBody;
 *   - unknown action/classification is rejected;
 *   - action "none" is always allowed (no evidence needed);
 *   - ANY violation → fail-closed, all-or-nothing: mutate NOTHING, exit 2.
 *
 * Exit codes: runner error / bad plan / bad store / ANY violation → 2 ; clean
 * dry-run or clean apply → 0 ; apply whose post-check has findings → 1 (mutations
 * already applied, reported). Zero runtime deps.
 */

const fs = require("fs");
const path = require("path");
const mem = require("./memory-integrity.js");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "memory-apply";

const VALID_ACTIONS = new Set(["none", "correct", "delete"]);
const VALID_CLASSIFICATIONS = new Set(["verified", "contradicted", "unverifiable"]);

// ── Pure safety gate (no fs) ─────────────────────────────────────────────────
/**
 * validatePlan(plan) — decide, with NO disk access, whether every change is safe
 * to apply. This is the load-bearing gate; it is exhaustively unit-tested.
 *
 * Returns { ok, violations:[{file,reason}], planned:[{file,action}] }.
 * A change is a violation (rejected) when:
 *   - action/classification is not a recognized value → "invalid action/classification";
 *   - action is correct|delete AND classification !== "contradicted"
 *       → "only a contradicted memory may be mutated";
 *   - action is correct|delete AND evidence is missing/blank
 *       → "mutation requires ground-truth evidence";
 *   - action is correct AND newBody is missing/blank → "correct requires newBody".
 * action "none" is always allowed (no evidence required).
 */
// A plan's file must name a plain *.md file INSIDE the store — never a path that
// could escape it. Rejects any separator / dir component, absolute paths, `.`/`..`,
// and non-.md names. This is the FIRST line of defense against path-traversal
// arbitrary delete/overwrite (security gauntlet r3); run() re-asserts confinement
// on the resolved absolute path as defense-in-depth.
function isSafeStoreFilename(name) {
  if (typeof name !== "string") return false;
  const n = name.trim();
  if (!n) return false;
  if (n !== path.basename(n)) return false; // any dir component / separator
  if (path.isAbsolute(n)) return false;
  if (n === "." || n === "..") return false;
  if (n.includes("/") || n.includes("\\")) return false; // belt-and-braces
  // Reject ':' so the .md-suffix check stays honest on Windows — an NTFS alternate-data-
  // stream name like 'a.md:MEMORY.md' otherwise passes endsWith('.md'). (security gauntlet r5.)
  if (n.includes(":")) return false;
  // The MEMORY.md INDEX is never a per-fact memory and must never be a mutation target:
  // deleting/rewriting it corrupts the store and crashes the index re-sync mid-apply
  // (ENOENT), breaking all-or-nothing. (security gauntlet r5, agy lane.)
  if (n.toLowerCase() === "memory.md") return false;
  return n.toLowerCase().endsWith(".md");
}

function validatePlan(plan) {
  const violations = [];
  const planned = [];
  const changes = plan && Array.isArray(plan.changes) ? plan.changes : [];
  const seen = new Set();
  for (const ch of changes) {
    const file = (ch && typeof ch.file === "string" && ch.file.trim()) || "(missing file)";
    const action = ch && ch.action;
    const classification = ch && ch.classification;

    if (!VALID_ACTIONS.has(action) || !VALID_CLASSIFICATIONS.has(classification)) {
      violations.push({ file, reason: "invalid action/classification" });
      continue;
    }
    // Duplicate file entries make apply ambiguous (last-wins divergence) → reject.
    // CASE-INSENSITIVE: on Windows/macOS `a.md` and `A.md` resolve to ONE file, so a
    // case-only-distinct pair would slip dedup and double-delete (the 2nd unlink ENOENTs
    // mid-apply). Dedup on the lowercased name, consistent with isSafeStoreFilename's
    // case-insensitive posture. (security gauntlet r7, agy lane.)
    const dedupKey = file.toLowerCase();
    if (seen.has(dedupKey)) {
      violations.push({ file, reason: "duplicate file entry (one change per file, case-insensitive)" });
      continue;
    }
    seen.add(dedupKey);

    if (action === "none") {
      planned.push({ file, action });
      continue;
    }
    // action is correct | delete → a mutation; every gate below must pass.
    // Path safety FIRST: a mutating op must name a plain *.md file inside the store.
    if (!isSafeStoreFilename(ch && ch.file)) {
      violations.push({ file, reason: "unsafe file path (must be a plain *.md filename inside the store)" });
      continue;
    }
    if (classification !== "contradicted") {
      violations.push({ file, reason: "only a contradicted memory may be mutated" });
      continue;
    }
    const evidence = ch && typeof ch.evidence === "string" ? ch.evidence.trim() : "";
    if (!evidence) {
      violations.push({ file, reason: "mutation requires ground-truth evidence" });
      continue;
    }
    if (action === "correct") {
      const newBody = ch && typeof ch.newBody === "string" ? ch.newBody : "";
      if (!newBody.trim()) {
        violations.push({ file, reason: "correct requires newBody" });
        continue;
      }
      // Carry the validated newBody so run() applies EXACTLY what was validated
      // (no plan re-lookup → no gate/apply divergence).
      planned.push({ file, action, newBody });
      continue;
    }
    planned.push({ file, action });
  }
  return { ok: violations.length === 0, violations, planned };
}

// ── Index re-sync (reuses the detector's parseIndex) ─────────────────────────
/**
 * Return MEMORY.md text with every index line whose parsed target is in
 * `filesToRemove` dropped. Line endings are normalized to LF (repo standard).
 */
function removeIndexLines(indexText, filesToRemove) {
  const { entries } = mem.parseIndex(indexText);
  const removeLineNums = new Set(
    entries.filter((e) => e && filesToRemove.has(e.target)).map((e) => e.line),
  );
  const lines = String(indexText == null ? "" : indexText).split(/\r?\n/);
  const kept = lines.filter((_, i) => !removeLineNums.has(i + 1));
  return kept.join("\n");
}

// ── Disk layer ───────────────────────────────────────────────────────────────

function fatal(notes, problems) {
  return { ok: false, fatal: true, dryRun: false, applied: false, violations: [], planned: [], problems, notes };
}

/**
 * run(opts) — opts = { plan:<path>, apply:<bool> }.
 * Parses the plan, validates it, and either dry-runs (default) or applies.
 * Fail-closed on bad plan / bad store / any violation (exit 2, mutate nothing).
 */
function run(opts) {
  opts = opts || {};
  const notes = [];

  const planPath = opts.plan;
  if (!planPath) return fatal(notes, ["--plan <plan.json> is required"]);
  const planAbs = path.isAbsolute(planPath) ? planPath : path.join(ROOT, planPath);
  let raw;
  try {
    raw = fs.readFileSync(planAbs, "utf8");
  } catch (e) {
    return fatal(notes, [`plan file unreadable: ${e.message}`]);
  }
  let plan;
  try {
    plan = JSON.parse(raw.replace(/^﻿/, ""));
  } catch (e) {
    return fatal(notes, [`plan is not valid JSON: ${e.message}`]);
  }
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    return fatal(notes, ["plan JSON must be an object with a 'store' and 'changes'"]);
  }

  const storeRel = plan.store;
  if (!storeRel || typeof storeRel !== "string") {
    return fatal(notes, ["plan.store (memory store dir) is required"]);
  }
  const storeAbs = path.isAbsolute(storeRel) ? storeRel : path.join(ROOT, storeRel);
  const memPath = path.join(storeAbs, "MEMORY.md");
  if (!fs.existsSync(memPath)) {
    return fatal(notes, [`store '${storeRel}' has no MEMORY.md (not a memory store)`]);
  }

  // The gate. Any violation → fail-closed, mutate nothing.
  const v = validatePlan(plan);
  if (!v.ok) {
    return {
      ok: false,
      fatal: true,
      dryRun: !opts.apply,
      applied: false,
      violations: v.violations,
      planned: v.planned,
      notes: [...notes, `${v.violations.length} violation(s) — fail-closed, nothing mutated`],
    };
  }

  const mutations = v.planned.filter((p) => p.action !== "none");

  // DRY-RUN (default): print what WOULD happen, mutate nothing.
  if (!opts.apply) {
    return {
      ok: true,
      fatal: false,
      dryRun: true,
      applied: false,
      violations: [],
      planned: v.planned,
      notes: [
        ...notes,
        `dry-run: ${mutations.length} mutating op(s) planned of ${v.planned.length} change(s); nothing written (pass --apply to execute)`,
      ],
    };
  }

  // --apply: reached ONLY with a clean validatePlan gate.
  // FS-level pre-flight on EVERY mutating op BEFORE touching anything — confinement
  // (defense-in-depth over validatePlan's name check), symlink rejection (a symlink
  // target would let a write/unlink escape the store), and newBody presence. This is
  // ALL-OR-NOTHING: any pre-flight violation → fail-closed, mutate NOTHING.
  const storeReal = path.resolve(storeAbs);
  const fsViolations = [];
  for (const p of mutations) {
    const fileAbs = path.resolve(storeAbs, p.file);
    if (path.dirname(fileAbs) !== storeReal) {
      fsViolations.push({ file: p.file, reason: "resolves outside the store dir" });
      continue;
    }
    let st = null;
    try {
      st = fs.lstatSync(fileAbs);
    } catch (e) {
      fsViolations.push({ file: p.file, reason: `not present / unstattable (${e.code || e.message})` });
      continue;
    }
    // Require a REGULAR file. isFile() is false for symlinks (lstat), directories,
    // devices, and fifos — a dir named `foo.md` would otherwise pass preflight then
    // EISDIR/EPERM mid-apply (partial mutation). (security gauntlet r7, agy lane.)
    if (!st.isFile()) {
      fsViolations.push({
        file: p.file,
        reason: st.isSymbolicLink()
          ? "target is a symlink (would escape the store)"
          : "target is not a regular file (directory / device / fifo) — would fault mid-apply",
      });
      continue;
    }
    if (p.action === "correct" && typeof p.newBody !== "string") {
      fsViolations.push({ file: p.file, reason: "newBody missing at apply time" });
    }
  }
  if (fsViolations.length) {
    return {
      ok: false,
      fatal: true,
      dryRun: false,
      applied: false,
      violations: fsViolations,
      planned: v.planned,
      notes: [...notes, `${fsViolations.length} fs-safety violation(s) — fail-closed, nothing mutated`],
    };
  }

  // FIX-C (security gauntlet r7): if any delete is planned, PRE-READ the index into memory
  // NOW — before mutating anything — so a locked/unreadable MEMORY.md fails-closed BEFORE any
  // file is deleted. Otherwise deletes apply, then the post-delete index read/write throws and
  // the store is left with files gone + a stale index (corrupted). Correct-only plans don't
  // touch the index, so they don't need it.
  const anyDelete = mutations.some((p) => p.action === "delete");
  let preReadIndexText = null;
  if (anyDelete) {
    try {
      preReadIndexText = fs.readFileSync(memPath, "utf8");
    } catch (e) {
      return {
        ok: false,
        fatal: true,
        dryRun: false,
        applied: false,
        violations: [],
        planned: v.planned,
        problems: [`index (MEMORY.md) unreadable before apply: ${e.code || e.message}`],
        notes: [...notes, "index pre-read failed — fail-closed, nothing mutated"],
      };
    }
  }

  try {
    const deletedFiles = new Set();
    for (const p of mutations) {
      const fileAbs = path.resolve(storeAbs, p.file);
      if (p.action === "delete") {
        fs.unlinkSync(fileAbs);
        deletedFiles.add(p.file);
      } else if (p.action === "correct") {
        fs.writeFileSync(fileAbs, p.newBody);
      }
    }
    // Re-sync the index for deletes (correct leaves the index alone) using the PRE-READ
    // text captured before the mutation loop (FIX-C) — never re-read post-delete.
    if (deletedFiles.size) {
      fs.writeFileSync(memPath, removeIndexLines(preReadIndexText, deletedFiles));
    }

    // Post-check: the store must be structurally clean (bijection intact).
    const post = mem.run({ dirs: [storeAbs] });
    if (post.fatal) {
      return {
        ok: false,
        fatal: true,
        applied: true,
        dryRun: false,
        violations: [],
        planned: v.planned,
        problems: post.problems || ["post-check fatal"],
        notes: [...notes, `MUTATIONS APPLIED (${mutations.length}) but post-check failed fatally`],
      };
    }
    const postFindings = post.findings || [];
    return {
      ok: postFindings.length === 0,
      fatal: false,
      applied: true,
      dryRun: false,
      violations: [],
      planned: v.planned,
      postFindings,
      notes: [
        ...notes,
        `applied ${mutations.length} mutation(s); post-check ${postFindings.length} finding(s)`,
      ],
    };
  } catch (e) {
    // Unexpected mid-apply error → fail-closed (exit 2); mutations may be partial.
    return {
      ok: false,
      fatal: true,
      applied: true,
      dryRun: false,
      violations: [],
      planned: v.planned,
      problems: [`apply error: ${e.message}`],
      notes: [...notes, "apply aborted mid-flight — inspect the store manually"],
    };
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = { plan: null, apply: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--apply") opts.apply = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--plan") opts.plan = argv[++i];
  }
  return opts;
}

function exitCode(res) {
  if (res.fatal) return 2;
  if (res.applied && res.postFindings && res.postFindings.length > 0) return 1;
  return 0;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const mode = opts.apply ? "apply" : "dry-run";
  let res;
  try {
    res = run(opts);
  } catch (e) {
    const msg = String((e && e.message) || e);
    process.stdout.write(
      (opts.json
        ? JSON.stringify({ check: NAME, mode, ok: false, fatal: true, error: msg })
        : `ERROR  [${NAME}] runner error (fail-closed): ${msg}`) + "\n",
    );
    process.exit(2);
  }

  if (opts.json) {
    process.stdout.write(JSON.stringify({ check: NAME, mode, ...res }, null, 2) + "\n");
    process.exit(exitCode(res));
  }

  if (res.fatal) {
    process.stderr.write(`ERROR  [${NAME}] (fail-closed) ${mode}\n`);
    for (const vio of res.violations || []) {
      process.stderr.write(`  - REJECT ${vio.file}: ${vio.reason}\n`);
    }
    for (const p of res.problems || []) process.stderr.write(`  - ${p}\n`);
    if (res.notes && res.notes.length) process.stderr.write(`  (${res.notes.join(" · ")})\n`);
    process.exit(2);
  }

  if (res.dryRun) {
    process.stdout.write(`DRY-RUN [${NAME}] ${res.notes.join(" · ")}\n`);
    for (const p of res.planned || []) {
      const verb = p.action === "delete" ? "would delete" : p.action === "correct" ? "would correct" : "no-op";
      process.stdout.write(`  ~ ${verb} ${p.file}\n`);
    }
    process.exit(0);
  }

  // applied
  const postFindings = res.postFindings || [];
  if (postFindings.length === 0) {
    process.stdout.write(`APPLIED [${NAME}] ${res.notes.join(" · ")}\n`);
    process.exit(0);
  }
  process.stderr.write(
    `APPLIED-DIRTY [${NAME}] mutations applied but ${postFindings.length} post-check finding(s):\n`,
  );
  for (const f of postFindings) process.stderr.write(`  - [${f.severity}] ${f.kind}: ${f.message}\n`);
  process.exit(1);
}

if (require.main === module) main();

module.exports = {
  validatePlan,
  isSafeStoreFilename,
  removeIndexLines,
  run,
  NAME,
  VALID_ACTIONS,
  VALID_CLASSIFICATIONS,
};
