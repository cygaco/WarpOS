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
 *   - --apply: only reached when validatePlan AND the newBody content gate are clean —
 *     perform each op, re-sync the index for deletes, then require the store structurally
 *     CLEAN; anything short of clean is ROLLED BACK to the pre-apply bytes.
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
 * THE ALL-OR-NOTHING INVARIANT (r10 :417 — two mechanisms, both required):
 *   `--apply` leaves the store either CLEAN or BYTE-IDENTICAL to its pre-apply state.
 *   1. validateNewBody pre-validates every `correct` body through the detector's own parser
 *      before anything is written (a per-file gate — it cannot see the rest of the store);
 *   2. the backup → apply → rollback transaction restores the pre-apply bytes on ANY outcome
 *      that does not PROVE the store is clean: a mid-sequence fault, a post-check that errored,
 *      a fatal post-check, or a post-check with findings (the store-wide cases — e.g. a
 *      duplicate name-slug across files — that no per-file pre-check can see).
 *   The ONE residual third outcome is a rollback that itself faults on the filesystem; that is
 *   never silent — it reports rolledBack:false + "ROLLBACK INCOMPLETE" and exits 2.
 *
 * Exit codes: runner error / bad plan / bad store / ANY violation / any apply that does not
 * end clean → 2 ; clean dry-run or clean apply → 0. There is NO exit-1 path: a dirty store is
 * not an outcome --apply is permitted to leave behind. Zero runtime deps.
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

// Resolve a plan filename to its ACTUAL on-disk directory-entry name (case-exact). The ONE
// canonicalization the whole case-insensitivity class routes through: dedup lowercases, and
// unlink + index-removal use this canonical name, so a plan that says `DROP_ONE.md` on a
// case-insensitive FS unlinks the real `drop_one.md` AND removes its `drop_one.md` index line
// (otherwise the unlink succeeds via FS case-folding but the index line survives → broken
// pointer). Returns the real entry name, null if no case-insensitive match, or throws (with
// .ambiguous) if >1 case-variant exists (only possible on a case-SENSITIVE fs).
// (security gauntlet — the case class, fixed once at the mechanism.)
function canonicalStoreName(storeAbs, name) {
  let entries;
  try {
    entries = fs.readdirSync(storeAbs);
  } catch {
    return null;
  }
  const lower = String(name == null ? "" : name).toLowerCase();
  const matches = entries.filter((e) => e.toLowerCase() === lower);
  if (matches.length === 0) return null;
  if (matches.length > 1) {
    const err = new Error(`ambiguous case-variant filenames for '${name}': ${matches.join(", ")}`);
    err.ambiguous = matches;
    throw err;
  }
  return matches[0];
}

/**
 * validateNewBody(body) — run a `correct` replacement body through the SAME parser the
 * read-only detector uses (mem.parseFrontmatter + its field rules) and return the list of
 * structural reasons it is not a valid memory file. Empty list = structurally valid.
 *
 * WHY (gauntlet r10 :417): validatePlan only requires newBody to be a non-empty STRING, so a
 * structurally-invalid body was written to disk successfully — no throw, therefore no rollback —
 * leaving a corrupted memory file behind. This is HALF ONE of the all-or-nothing fix: refuse the
 * body BEFORE any mutation. It is deliberately NOT folded into validatePlan, which is the pure
 * plan-SHAPE gate; this is the CONTENT gate and it mirrors evaluate()'s invalid-frontmatter rules
 * exactly so the pre-check and the post-check cannot disagree about one file.
 *
 * It can only see ONE file, so it can NOT see store-wide invariants (e.g. a duplicate name-slug
 * against a SIBLING file). That residue is what half two — rollback on a dirty post-check — covers.
 */
function validateNewBody(body) {
  const reasons = [];
  const fm = mem.parseFrontmatter(String(body == null ? "" : body));
  if (!fm.hasFrontmatter) {
    reasons.push("no YAML frontmatter block (expected a leading '---' … '---' block)");
    return reasons; // no fields to check without a block
  }
  if (!fm.name || !String(fm.name).trim()) reasons.push("missing a non-empty 'name' field");
  if (!fm.description || !String(fm.description).trim()) {
    reasons.push("missing a non-empty 'description' field");
  }
  if (!fm.type || !mem.VALID_TYPES.has(String(fm.type).trim())) {
    reasons.push(
      `'metadata.type' is absent or not one of {${[...mem.VALID_TYPES].join(", ")}} (got '${fm.type == null ? "" : fm.type}')`,
    );
  }
  return reasons;
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
  // Case-insensitive match: the index line's target may differ in case from the canonical
  // on-disk name (CLASS-1). Lowercase both sides so the deleted file's line is always removed.
  const removeLower = new Set([...filesToRemove].map((f) => String(f).toLowerCase()));
  const removeLineNums = new Set(
    entries.filter((e) => e && removeLower.has(String(e.target).toLowerCase())).map((e) => e.line),
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
  // A non-array `changes` is a MALFORMED plan, not an empty one — fail-closed rather than
  // silently treating it as zero changes (exit 0). (gauntlet r9, backend :101.)
  if (!Array.isArray(plan.changes)) {
    return fatal(notes, ["plan.changes must be an array (a non-array is a malformed plan, not an empty one)"]);
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

  // CONTENT gate (r10 :417, half one of all-or-nothing): every `correct` newBody must parse as a
  // structurally valid memory file BEFORE anything is written. Runs ahead of the dry-run return on
  // purpose — a dry-run that promises "would correct" for a body --apply refuses is a gate/apply
  // divergence, the same class the validated-newBody carry-through closed.
  const bodyViolations = [];
  for (const p of mutations) {
    if (p.action !== "correct") continue;
    for (const reason of validateNewBody(p.newBody)) {
      bodyViolations.push({ file: p.file, reason: `newBody is not a valid memory file: ${reason}` });
    }
  }
  if (bodyViolations.length) {
    return {
      ok: false,
      fatal: true,
      dryRun: !opts.apply,
      applied: false,
      violations: bodyViolations,
      planned: v.planned,
      notes: [
        ...notes,
        `${bodyViolations.length} newBody structural violation(s) — fail-closed, nothing mutated`,
      ],
    };
  }

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
    // CLASS-1 canonicalization: resolve to the real on-disk entry name so unlink + index-removal
    // operate on ONE case-exact name (see canonicalStoreName). Absent → fail-closed; ambiguous → reject.
    let canonical;
    try {
      canonical = canonicalStoreName(storeAbs, p.file);
    } catch (e) {
      fsViolations.push({ file: p.file, reason: e.message });
      continue;
    }
    if (!canonical) {
      fsViolations.push({ file: p.file, reason: "no such file in the store (case-insensitive lookup)" });
      continue;
    }
    p.canonicalFile = canonical;
    const fileAbs = path.resolve(storeAbs, canonical);
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

  // CLASS-2 index accessibility (security gauntlet r7/r8): before ANY mutation, require the index
  // MEMORY.md to be a READABLE REGULAR FILE. A correct-only apply doesn't touch the index, but the
  // POST-CHECK reads it — so a MEMORY.md that is a directory/unreadable would let the correct apply
  // THEN fail the post-check (applied:true partial). Pre-checking before any mutation fails-closed
  // first. Deletes additionally reuse the pre-read text for the index re-sync.
  let preReadIndexText = null;
  {
    const indexFail = (why) => ({
      ok: false,
      fatal: true,
      dryRun: false,
      applied: false,
      violations: [],
      planned: v.planned,
      problems: [why],
      notes: [...notes, "index pre-check failed — fail-closed, nothing mutated"],
    });
    let ist;
    try {
      ist = fs.lstatSync(memPath);
    } catch (e) {
      return indexFail(`index (MEMORY.md) unstattable before apply: ${e.code || e.message}`);
    }
    if (!ist.isFile()) {
      return indexFail("index (MEMORY.md) is not a regular file (directory / symlink / device) — refusing to mutate");
    }
    try {
      preReadIndexText = fs.readFileSync(memPath, "utf8");
    } catch (e) {
      return indexFail(`index (MEMORY.md) unreadable before apply: ${e.code || e.message}`);
    }
  }

  // BACKUP → APPLY → ROLLBACK transaction (security gauntlet r9, backend :322 — the KEYSTONE
  // all-or-nothing fix). Preflight rejects PLAN-reachable faults; but a mid-SEQUENCE fault (a
  // concurrent lock, disk error, EPERM arising DURING the loop) could still commit some ops and
  // then throw. So capture the original bytes of every target (+ the index if any delete rewrites
  // it) BEFORE mutating; on ANY throw during apply, restore every captured path → the store is
  // exactly as it was. Memory files are small + few per plan, so the in-memory backup is cheap.
  // r10 widened the RESTORE trigger (not the backup): the same captured bytes are now also
  // restored when the POST-CHECK fails to certify the store clean — see `undo` below.
  const anyDelete = mutations.some((p) => p.action === "delete");
  const backup = []; // [{ abs, bytes:Buffer }]
  try {
    for (const p of mutations) {
      const fileAbs = path.resolve(storeAbs, p.canonicalFile);
      backup.push({ abs: fileAbs, bytes: fs.readFileSync(fileAbs) });
    }
    if (anyDelete) backup.push({ abs: memPath, bytes: Buffer.from(preReadIndexText, "utf8") });
  } catch (e) {
    return {
      ok: false,
      fatal: true,
      applied: false,
      dryRun: false,
      violations: [],
      planned: v.planned,
      problems: [`backup capture failed before apply: ${e.message}`],
      notes: [...notes, "backup capture failed — fail-closed, nothing mutated"],
    };
  }

  try {
    const deletedFiles = new Set();
    for (const p of mutations) {
      // Use the CANONICAL on-disk name (resolved in preflight) for both the unlink and the
      // index-removal set, so a case-mismatched plan can't unlink one name yet leave the other's
      // index line behind. (CLASS-1 mechanism.)
      const fileAbs = path.resolve(storeAbs, p.canonicalFile);
      if (p.action === "delete") {
        fs.unlinkSync(fileAbs);
        deletedFiles.add(p.canonicalFile);
      } else if (p.action === "correct") {
        fs.writeFileSync(fileAbs, p.newBody);
      }
    }
    // Re-sync the index for deletes (correct leaves the index alone) using the PRE-READ
    // text captured before the mutation loop — never re-read post-delete.
    if (deletedFiles.size) {
      fs.writeFileSync(memPath, removeIndexLines(preReadIndexText, deletedFiles));
    }

  } catch (e) {
    // ROLLBACK: restore every captured path to its original bytes → the store is exactly as it
    // was before apply (all-or-nothing preserved even against a mid-sequence fault).
    return undo(`apply error: ${e.message}`, "apply faulted mid-flight", null);
  }

  // Mutations committed to disk. They are NOT yet final: the store must still be structurally
  // CLEAN for this apply to stand. Every outcome below that does not PROVE cleanliness routes
  // through the SAME rollback path the mid-sequence catch uses (r10 :417, half two of
  // all-or-nothing). This deliberately REVERSES the r7 note that a post-check error must keep a
  // "validly-committed" plan: a post-check that did not run has not certified anything, so the
  // commit is unverified, not valid. Rollback restores byte-exact originals, so nothing is lost —
  // the plan can simply be re-applied once the store is readable again.
  let post;
  try {
    post = mem.run({ dirs: [storeAbs] });
  } catch (e) {
    return undo(`post-check errored after apply — the store could not be verified: ${e.message}`, "post-check errored", null);
  }
  if (post.fatal) {
    return undo(
      `post-check fatal after apply: ${(post.problems || ["post-check fatal"]).join("; ")}`,
      "post-check fatal",
      null,
    );
  }
  const postFindings = post.findings || [];
  if (postFindings.length > 0) {
    // The store-wide case pre-validation CANNOT see: each newBody parsed clean on its own, but the
    // resulting STORE is dirty (e.g. the new name-slug duplicates a sibling file's). Refuse it —
    // a dirty store is not an outcome --apply is allowed to leave behind.
    // CONSEQUENCE, by design: the post-check judges the WHOLE store, not just the touched files,
    // so a plan applied to an ALREADY-dirty store is refused even when its own ops are sound. The
    // plan must leave the store fully clean. That is the fail-closed reading of the invariant —
    // widen the plan (or clean the store first), do not weaken this branch.
    return undo(
      `post-check found ${postFindings.length} structural finding(s) — the plan would leave the store dirty`,
      `post-check ${postFindings.length} finding(s)`,
      postFindings,
    );
  }
  return {
    ok: true,
    fatal: false,
    applied: true,
    dryRun: false,
    violations: [],
    planned: v.planned,
    postFindings,
    notes: [...notes, `applied ${mutations.length} mutation(s); post-check clean`],
  };

  /**
   * Restore every captured path to its original bytes and build the fail-closed result. The ONE
   * rollback path — a mid-sequence fault, a post-check that errored, a fatal post-check, and a
   * dirty post-check all land here, so "clean or byte-identical" holds by construction rather
   * than by four separate hand-written branches agreeing with each other.
   */
  function undo(problem, noteVerb, findings) {
    const rollbackErrors = [];
    for (const b of backup) {
      try {
        fs.writeFileSync(b.abs, b.bytes);
      } catch (re) {
        rollbackErrors.push(`${b.abs}: ${re.message}`);
      }
    }
    const rolledBack = rollbackErrors.length === 0;
    const res = {
      ok: false,
      fatal: true,
      applied: !rolledBack, // rolled back cleanly → nothing net-changed; incomplete → residual change
      dryRun: false,
      violations: [],
      planned: v.planned,
      rolledBack,
      problems: [
        problem,
        rolledBack
          ? "rolled back — store restored to its pre-apply bytes, nothing changed"
          : `ROLLBACK INCOMPLETE: ${rollbackErrors.join("; ")}`,
      ],
      notes: [
        ...notes,
        rolledBack
          ? `${noteVerb} → rolled back (all-or-nothing preserved)`
          : `${noteVerb} AND rollback incomplete — inspect the store manually`,
      ],
    };
    if (findings && findings.length) res.postFindings = findings;
    return res;
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

// --apply has exactly TWO reachable outcomes: a CLEAN apply (0), or a fail-closed refusal with
// the store restored to its pre-apply bytes (2). A dirty post-check no longer exits 1 with the
// mutations kept — it rolls back and fails closed. (r10 :417.)
function exitCode(res) {
  return res.fatal ? 2 : 0;
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
    // A rolled-back apply carries the post-check findings that caused the refusal — print them,
    // otherwise the operator sees "refused" with no reason to act on.
    for (const f of res.postFindings || []) {
      process.stderr.write(`  - [${f.severity}] ${f.kind}: ${f.message}\n`);
    }
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

  // Applied. A non-fatal result is a CLEAN apply by construction — a dirty/unverifiable
  // post-check is rolled back and returns fatal above, so there is no APPLIED-DIRTY state
  // left to print.
  process.stdout.write(`APPLIED [${NAME}] ${res.notes.join(" · ")}\n`);
  process.exit(0);
}

if (require.main === module) main();

module.exports = {
  validatePlan,
  validateNewBody,
  isSafeStoreFilename,
  canonicalStoreName,
  removeIndexLines,
  run,
  NAME,
  VALID_ACTIONS,
  VALID_CLASSIFICATIONS,
};
