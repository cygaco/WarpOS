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
 * THE ALL-OR-NOTHING INVARIANT (r10 :417 — three mechanisms, all required):
 *   `--apply` leaves the store either CLEAN or BYTE-IDENTICAL to its pre-apply state.
 *   1. validateNewBody pre-validates every `correct` body through the detector's own parser
 *      before anything is written (a per-file gate — it cannot see the rest of the store), and
 *      projectStoreState then runs THE DETECTOR over the store state the plan would produce, so
 *      the store-wide cases (a duplicate name-slug against a sibling, an index effect) are refused
 *      BEFORE any mutation rather than rolled back after one (r12 MEDIUM);
 *   2. the backup → apply → rollback transaction restores the pre-apply bytes on ANY outcome
 *      that does not PROVE the store is clean: a mid-sequence fault, a post-check that errored,
 *      a fatal post-check, or a post-check with findings. With (1) in place the post-check is the
 *      BACKSTOP — it observes what actually landed, so it still catches anything the projection
 *      did not predict (a concurrent writer, a platform surprise);
 *   3. the rollback VERIFIES itself by re-reading every captured path and comparing bytes, so
 *      `rolledBack:true` is an OBSERVATION of the store rather than the restore code's own
 *      report of success (r12 HIGH).
 *   The ONE residual third outcome is a rollback that faults or does not restore; that is never
 *   silent — it reports rolledBack:false + "ROLLBACK INCOMPLETE" and exits 2.
 *
 * WRITING (r11 HIGH-1 + r12 CRITICAL): every write goes through atomicWriteInStore — an exclusive
 * create (`wx`) of an unguessable temp INSIDE the store, a write THROUGH THE DESCRIPTOR, then a
 * rename over the target. Never fs.writeFileSync onto a path in the store, and never a write by
 * path onto the temp after the exclusive open. See atomicWriteInStore for which layer is the
 * control and which are defense in depth.
 *
 * Exit codes: runner error / bad plan / bad store / ANY violation / any apply that does not
 * end clean → 2 ; clean dry-run or clean apply → 0. There is NO exit-1 path: a dirty store is
 * not an outcome --apply is permitted to leave behind. Zero runtime deps.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mem = require("./memory-integrity.js");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "memory-apply";

const VALID_ACTIONS = new Set(["none", "correct", "delete"]);
const VALID_CLASSIFICATIONS = new Set(["verified", "contradicted", "unverifiable"]);

// ── Invisible-character classes — ONE definition, reused everywhere ──────────
// Evidence is an AUDIT artifact: a human reads it later to see why a memory was mutated. A string
// made only of characters that RENDER AS NOTHING is blank evidence wearing a non-empty string's
// clothes — an `evidence` of just U+200B cleared the old `.trim()` gate, because JS trim() strips only
// WhiteSpace/LineTerminator, and U+200B (and U+2060, U+180E, U+034F …) are format characters, not
// whitespace. (gauntlet r11 MEDIUM.)
//
// These two classes are the module's SINGLE enumeration of "renders as nothing". Anything that
// needs to ask the question calls hasVisibleText() — a second, parallel strip-list is the same
// drift shape as the validateNewBody mirror (r11 HIGH-2), and enumerating invisible categories in
// two places moves the gap rather than closing it. Add new code points HERE, once.
// INVIS: zero-width, joiners, bidi controls, variation selectors, interlinear annotation, BOM.
const INVIS = /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u206A-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF9-\uFFFB]/g;
// SPACE_MAP: every character that renders as horizontal/vertical blank. `\s` already covers ASCII
// whitespace plus U+00A0/U+1680/U+2000-200A/U+2028/U+2029/U+202F/U+205F/U+3000; the extras are
// listed explicitly so the class documents itself rather than relying on the engine's `\s`.
const SPACE_MAP = /[\s\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;

/**
 * Does `s` contain at least ONE character a human would actually see? Strips the INVIS class then
 * the SPACE_MAP class and asks whether anything is left. Replace() (not test()) is used on purpose:
 * these are /g regexes, and .test() on a /g regex carries lastIndex between calls.
 */
function hasVisibleText(s) {
  return String(s == null ? "" : s).replace(INVIS, "").replace(SPACE_MAP, "") !== "";
}

// Every temp this module creates carries this prefix (leading dot + `.tmp` suffix), so readStore()
// — which only reads `*.md` — can never parse one as a memory file.
const TMP_PREFIX = ".memory-apply.";

/**
 * An UNGUESSABLE temp filename: 16 crypto-random bytes, not the process pid plus a counter.
 *
 * This is DEFENSE IN DEPTH, not the control. Its job is to make the temp path impossible to
 * PRE-CREATE — a pid and a monotonic counter are both enumerable, which is how the r12 CRITICAL
 * repro planted a hardlink at `.memory-apply.<pid>.0.tmp` and had the write follow it. The
 * SECURITY PROPERTY lives in atomicWriteInStore's exclusive create + descriptor write; this only
 * removes the attacker's ability to aim at the right path in the first place.
 */
function tempFileName() {
  return `${TMP_PREFIX}${crypto.randomBytes(16).toString("hex")}.tmp`;
}

/**
 * Names of any `.memory-apply.*` temp already sitting in the store. HYGIENE ONLY — see the
 * stray-temp refusal in run(). This function is NOT a security control and nothing may be built
 * on the assumption that it ran.
 */
function strayTempNames(storeAbs) {
  let entries;
  try {
    entries = fs.readdirSync(storeAbs);
  } catch {
    return [];
  }
  return entries.filter((e) => String(e).startsWith(TMP_PREFIX));
}

/**
 * atomicWriteInStore(storeAbs, targetAbs, data) — the ONE way this module ever writes a file in a
 * memory store. Creates a temp file INSIDE storeAbs, writes THROUGH ITS DESCRIPTOR, then RENAMES
 * it over the target.
 *
 * WHY RENAME, NOT writeFileSync-onto-the-target (gauntlet r11 HIGH-1): `fs.writeFileSync(path,…)`
 * writes THROUGH the target's inode. A per-fact file HARDLINKED to a file outside the store is a
 * regular file by every stat predicate — isFile() true, isSymbolicLink() false — so it cleared
 * preflight, and `correct` then overwrote the out-of-store file through the shared inode. `rename`
 * replaces the store's DIRECTORY ENTRY and never touches the old inode: the hardlinked target
 * simply stops being hardlinked and the outside file keeps its bytes. Temp-and-rename is the
 * correct idiom and is NOT what r12 found wanting — do not replace it.
 *
 * WHY THE DESCRIPTOR (gauntlet r12 CRITICAL): r11 fixed the write's DESTINATION and left its
 * SOURCE unguarded. The temp was created by a plain `writeFileSync(tmpAbs, data)` — a write BY
 * PATH — at an ENUMERABLE name, so a hardlink pre-created at the temp path was followed exactly
 * the way the target's hardlink used to be, and an ordinary `correct` plan overwrote an
 * out-of-store file while reporting {ok:true, applied:true} with a clean post-check.
 *
 * THE LAYERS, NAMED — do not conflate them:
 *   • CONTROL (the security property): `wx` = O_CREAT|O_EXCL|O_WRONLY. An exclusive create FAILS
 *     with EEXIST if the path exists AT ALL — a hardlink included — so the descriptor below can
 *     only ever refer to an inode THIS call created. The subsequent write goes to that DESCRIPTOR,
 *     never to the path: writing by path after the exclusive open would RE-RESOLVE the name and
 *     reopen the very TOCTOU window being closed (unlink the temp, re-create it as a hardlink,
 *     land the write on the attacker's inode). The FD is what makes the guarantee hold across
 *     that gap. NEVER write `fs.writeFileSync(tmpAbs, data)` here again.
 *   • Defense in depth: the unguessable name from tempFileName().
 *   • Belt-and-braces: fstat's nlink must be 1. O_EXCL already guarantees it; it costs nothing and
 *     catches a platform surprise.
 * On EEXIST we ABORT, fail-closed. We do NOT retry with a fresh name: with a 128-bit random name a
 * genuine collision is not a real event, so EEXIST means something is wrong — retrying would mask
 * an attack in progress.
 *
 * The temp stays INSIDE storeAbs so the rename is same-filesystem (hence atomic — a cross-device
 * rename would EXDEV). Crash-atomicity comes free: a fault leaves either the whole old file or the
 * whole new one, never a half-written body.
 */
function atomicWriteInStore(storeAbs, targetAbs, data) {
  const tmpAbs = path.join(storeAbs, tempFileName());

  let fd;
  try {
    fd = fs.openSync(tmpAbs, "wx", 0o600); // O_CREAT|O_EXCL|O_WRONLY — the control
  } catch (e) {
    if (e && e.code === "EEXIST") {
      const err = new Error(
        `refusing to write '${path.basename(targetAbs)}': the temp path '${path.basename(tmpAbs)}' already exists — ` +
          "aborting fail-closed (a random temp name does not collide by chance, so this is not retried)",
      );
      err.code = "EEXIST";
      throw err;
    }
    throw e;
  }

  try {
    const st = fs.fstatSync(fd);
    if (typeof st.nlink === "number" && st.nlink !== 1) {
      throw new Error(
        `refusing to write '${path.basename(targetAbs)}': the freshly created temp has ${st.nlink} directory entries`,
      );
    }
    // THE DESCRIPTOR, not the path. Do not "simplify" this to writeFileSync(tmpAbs, data).
    fs.writeFileSync(fd, data);
  } catch (e) {
    try {
      fs.closeSync(fd);
    } catch {
      /* best-effort */
    }
    try {
      fs.unlinkSync(tmpAbs);
    } catch {
      /* best-effort: never leave a stray temp behind */
    }
    throw e;
  }

  try {
    fs.closeSync(fd);
  } catch {
    /* best-effort: the bytes are already written */
  }

  try {
    fs.renameSync(tmpAbs, targetAbs);
  } catch (e) {
    try {
      fs.unlinkSync(tmpAbs);
    } catch {
      /* best-effort: the temp may already be gone */
    }
    throw e;
  }
}

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
 * plan-SHAPE gate; this is the CONTENT gate.
 *
 * r11 HIGH-2 — WHY THIS IS NOW THREE LINES: it used to MIRROR evaluate()'s invalid-frontmatter
 * rules in its own code, under a comment asserting that the mirror and the post-check "cannot
 * disagree". They did. Parser shapes that yielded a trusted `type` (a duplicated top-level
 * `metadata:`; a non-scalar `metadata.tags: []`) produced NO reasons here, so apply certified a
 * structurally invalid body clean. A mirrored reimplementation is precisely the thing that drifts,
 * and patching the two known shapes into the mirror would only re-arm it for the next shape. The
 * rules now live in exactly ONE place — mem.frontmatterProblems — which evaluate() also calls, so
 * "the pre-check and the post-check cannot disagree" is true BY CONSTRUCTION rather than by
 * assertion. Do not re-inline these rules here.
 *
 * It can only see ONE file, so it can NOT see store-wide invariants (e.g. a duplicate name-slug
 * against a SIBLING file). r12 MEDIUM: that residue is no longer left to the post-check's rollback
 * — projectStoreState runs the detector over the PROSPECTIVE store before anything is mutated, and
 * subsumes this function. This one stays as the cheap, body-scoped first refusal; it cannot
 * disagree with the projection, because both compute mem.frontmatterProblems over the same parse.
 */
function validateNewBody(body) {
  const fm = mem.parseFrontmatter(String(body == null ? "" : body));
  return mem.frontmatterProblems(fm).map((p) => p.message);
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
    // Evidence must contain at least one VISIBLE character, not merely a non-empty string.
    // `.trim()` alone let `evidence: "​"` through, applying a delete whose audit trail
    // renders blank to the human who later asks why the memory went away. hasVisibleText routes
    // through the module's single INVIS/SPACE_MAP enumeration. (gauntlet r11 MEDIUM.)
    const evidence = ch && typeof ch.evidence === "string" ? ch.evidence : "";
    if (!hasVisibleText(evidence)) {
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

// ── Prospective store state (the store-wide pre-check) ───────────────────────
/**
 * projectStoreState(storeAbs, mutations, indexText) — build, IN MEMORY, the exact store record
 * the detector would read from disk AFTER this plan is applied. Reads the current store, drops the
 * files a `delete` removes, re-parses the files a `correct` rewrites (from the newBody, through the
 * detector's OWN parser), and re-parses the index text the delete re-sync would leave behind.
 *
 * WHY (gauntlet r12 MEDIUM): validateNewBody reasons about a BODY; the detector reasons about a
 * STORE. A body can be per-file perfect and still be rejected the moment it is PLACED in the store
 * — a `name:` slug duplicating a sibling's is the live case — so the pre-check accepted plans the
 * post-check then refused. Rather than teach the body-level pre-check about siblings (a second
 * computation that must agree with the first — the r11 HIGH-2 drift shape, one level up), we run
 * THE DETECTOR ITSELF over the state the plan would produce. The pre-check and the post-check are
 * then the SAME COMPUTATION (mem.readStore-shaped record → mem.evaluate) over the same state, so
 * they cannot disagree; the post-check remains as the backstop that observes what actually landed.
 *
 * The record shape mirrors mem.readStore() exactly — same field names, same parsers
 * (parseFrontmatter + extractWikilinks), same index parse — because mem.evaluate() is fed both.
 */
function projectStoreState(storeAbs, mutations, indexText) {
  const dirLabel = String(storeAbs).replace(/\\/g, "/"); // mem.run() labels a --dir the same way
  const current = mem.readStore(storeAbs, dirLabel, mem.DEFAULT_MAX_INDEX_LINES);
  if (!current) return null; // no MEMORY.md — the caller has already fail-closed on that

  const deleted = new Set();
  const corrected = new Map();
  for (const p of mutations) {
    const key = String(p.canonicalFile).toLowerCase();
    if (p.action === "delete") deleted.add(key);
    else if (p.action === "correct") corrected.set(key, p.newBody);
  }

  const files = [];
  for (const f of current.files) {
    const key = String(f.file).toLowerCase();
    if (deleted.has(key)) continue; // the delete removes it
    if (corrected.has(key)) {
      const fm = mem.parseFrontmatter(String(corrected.get(key)));
      files.push({
        file: f.file,
        hasFrontmatter: fm.hasFrontmatter,
        name: fm.name,
        description: fm.description,
        type: fm.type,
        wikilinks: mem.extractWikilinks(fm.body),
      });
      continue;
    }
    files.push(f);
  }

  // INDEX EFFECTS: only deletes rewrite MEMORY.md, and they rewrite it through the very same
  // removeIndexLines() the apply loop uses — so the projected index is the text that will be on
  // disk, not an approximation of it.
  const deletedCanonical = mutations.filter((p) => p.action === "delete").map((p) => p.canonicalFile);
  const projectedIndex = deletedCanonical.length
    ? removeIndexLines(indexText, new Set(deletedCanonical))
    : String(indexText == null ? "" : indexText);
  const { entries, lineCount, malformed } = mem.parseIndex(projectedIndex);

  return {
    dir: current.dir,
    maxIndexLines: current.maxIndexLines,
    indexEntries: entries,
    indexMalformed: malformed,
    indexLineCount: lineCount,
    files,
  };
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
  // structurally valid memory file BEFORE anything is written. It runs here, ahead of any disk
  // work, because it needs nothing but the body — a cheap, precisely-worded first refusal.
  // It is a STRICT SUBSET of the prospective store gate further down (both reach the same verdict
  // through mem.frontmatterProblems over the same parse, one file at a time vs. as part of the
  // whole store), so it can narrow a refusal but never contradict one.
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
    // HARDLINK (gauntlet r11 HIGH-1, defense-in-depth). A hardlink is a REGULAR file by every stat
    // predicate — isFile() true, isSymbolicLink() false — so the checks above cannot see one, and
    // a target hardlinked to a file OUTSIDE the store used to have its outside twin overwritten
    // through the shared inode. atomicWriteInStore already makes that escape impossible by
    // construction; this check is here because an unexpected extra directory entry on a memory
    // file is an ANOMALY, and a store in an unexplained state should fail LOUDLY rather than be
    // silently tolerated. (st.nlink is unreliable on a few exotic filesystems, hence the guard.)
    if (typeof st.nlink === "number" && st.nlink > 1) {
      fsViolations.push({
        file: p.file,
        reason: `target has ${st.nlink} hard links — a memory file must have exactly one directory entry`,
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
      dryRun: !opts.apply,
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
      dryRun: !opts.apply,
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

  // STRAY-TEMP SCAN — HYGIENE ONLY, EXPLICITLY NOT A CONTROL. A `.memory-apply.*` file in the
  // store means a PREVIOUS run crashed between creating its temp and renaming it away, so the
  // store is in an unexplained state and we would rather stop than write into it. Nothing is
  // built on this having run: the security property against a planted temp is atomicWriteInStore's
  // exclusive create + descriptor write, which holds whether or not this scan exists. Do not
  // describe this as the hardlink defense — a later reader who trusts it would be trusting the
  // wrong layer. (gauntlet r12 CRITICAL, layer 4.)
  if (mutations.length) {
    const strays = strayTempNames(storeAbs);
    if (strays.length) {
      return {
        ok: false,
        fatal: true,
        dryRun: !opts.apply,
        applied: false,
        violations: strays.map((n) => ({ file: n, reason: "stray apply temp file in the store (a previous run left it behind) — refusing to write into a store in an unexplained state" })),
        planned: v.planned,
        notes: [...notes, `${strays.length} stray temp file(s) in the store — fail-closed, nothing mutated`],
      };
    }
  }

  // PROSPECTIVE STORE-STATE GATE (gauntlet r12 MEDIUM — the store-wide pre-check).
  // Run THE DETECTOR over the state this plan would produce, and refuse on ANY finding. This is
  // the SAME computation the post-check performs (mem.evaluate over a mem.readStore-shaped
  // record), so a plan can no longer clear the pre-check and then be refused by the post-check:
  // the body-level gate above reasons about ONE FILE and structurally cannot see a duplicate
  // name-slug against a sibling, a broken pointer the index re-sync would leave, or any other
  // store-wide consequence. It SUBSUMES the body-level gate rather than sitting beside it —
  // an invalid-frontmatter finding on a file we are CORRECTING is exactly what validateNewBody
  // reports, and is phrased that way below so the refusal still names the newBody.
  //
  // ANY finding, not just plan-attributable ones: the post-check has always judged the WHOLE
  // store (a plan applied to an already-dirty store is refused even when its own ops are sound),
  // and the pre-check must reach the same verdict or the two diverge again. Widen the plan (or
  // clean the store first) — do not weaken this to "findings the plan introduced".
  // Warnings are NOT findings and never block, exactly as in the post-check.
  {
    let projected;
    try {
      projected = projectStoreState(storeAbs, mutations, preReadIndexText);
    } catch (e) {
      return {
        ok: false,
        fatal: true,
        dryRun: !opts.apply,
        applied: false,
        violations: [],
        planned: v.planned,
        problems: [`the store could not be read for the pre-check: ${e.message}`],
        notes: [...notes, "prospective store pre-check could not run — fail-closed, nothing mutated"],
      };
    }
    const prospectiveFindings = projected ? mem.evaluate({ stores: [projected] }).findings || [] : [];
    if (prospectiveFindings.length) {
      const correctedFiles = new Set(
        mutations.filter((p) => p.action === "correct").map((p) => p.canonicalFile),
      );
      const violations = prospectiveFindings.map((f) => {
        // Strip evaluate()'s '<dir>/<file> ' subject so a newBody defect reads as a newBody defect.
        const subject = `${projected.dir}/${f.file} `;
        const clause = f.message.startsWith(subject)
          ? f.message.slice(subject.length).replace(/\.$/, "")
          : f.message;
        return f.kind === "invalid-frontmatter" && f.file && correctedFiles.has(f.file)
          ? { file: f.file, reason: `newBody is not a valid memory file: ${clause}` }
          : {
              file: f.file || "(store)",
              reason: `applying this plan would leave the store dirty — ${f.kind}: ${f.message}`,
            };
      });
      return {
        ok: false,
        fatal: true,
        dryRun: !opts.apply,
        applied: false,
        violations,
        planned: v.planned,
        prospectiveFindings,
        notes: [
          ...notes,
          `${prospectiveFindings.length} structural finding(s) in the projected store — fail-closed, nothing mutated`,
        ],
      };
    }
  }

  // DRY-RUN (default): print what WOULD happen, mutate nothing. It returns HERE, after every gate
  // --apply must clear, so a dry-run can never promise an op --apply would refuse (the gate/apply
  // divergence closed in r10 and widened here to the fs preflight + the store-wide projection).
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

  // BACKUP → APPLY → ROLLBACK transaction (security gauntlet r9, backend :322 — the KEYSTONE
  // all-or-nothing fix). Preflight rejects PLAN-reachable faults; but a mid-SEQUENCE fault (a
  // concurrent lock, disk error, EPERM arising DURING the loop) could still commit some ops and
  // then throw. So capture the original bytes of every target (+ the index if any delete rewrites
  // it) BEFORE mutating; on ANY throw during apply, restore every captured path → the store is
  // exactly as it was. Memory files are small + few per plan, so the in-memory backup is cheap.
  // r10 widened the RESTORE trigger (not the backup): the same captured bytes are now also
  // restored when the POST-CHECK fails to certify the store clean — see `undo` below.
  const backup = []; // [{ abs, bytes:Buffer }]
  try {
    for (const p of mutations) {
      const fileAbs = path.resolve(storeAbs, p.canonicalFile);
      backup.push({ abs: fileAbs, bytes: fs.readFileSync(fileAbs) });
    }
    // MEMORY.md is captured EXACTLY like every other entry: RAW BYTES, no encoding argument.
    //
    // r11 HIGH-3 — it used to be `Buffer.from(preReadIndexText, "utf8")`, re-encoding the string
    // that :445 had already DECODED. A decode→re-encode round trip is not the identity on
    // arbitrary bytes: any byte sequence that is not valid UTF-8 comes back as U+FFFD (EF BF BD).
    // MEMORY.md is human-edited, so that is a live case — a rollback then reported
    // `rolledBack: true` over a file whose bytes had CHANGED, which is precisely the invariant
    // ("clean or byte-identical") the transaction exists to hold. preReadIndexText stays exactly
    // as it is for removeIndexLines; only the BACKUP stops travelling through a string.
    //
    // UNCONDITIONAL, where it used to be `if (anyDelete)`. I checked whether a correct-only plan
    // can write MEMORY.md, and today it cannot — three separate guards have to hold for that:
    // isSafeStoreFilename rejects `memory.md` case-insensitively, canonicalStoreName only ever
    // returns an entry whose lowercase equals the (already-vetted) plan name, and the dirname
    // confinement check rejects anything outside storeAbs. But the BACKUP's correctness should not
    // depend on a three-guard chain in unrelated functions continuing to agree — that is the same
    // "documented invariant the code doesn't hold" shape as HIGH-2. Capturing it always costs one
    // small read of a file we have already read, and removes the dependency entirely.
    backup.push({ abs: memPath, bytes: fs.readFileSync(memPath) });
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
        // Temp-then-rename, NEVER writeFileSync — see atomicWriteInStore. (r11 HIGH-1.)
        atomicWriteInStore(storeAbs, fileAbs, p.newBody);
      }
    }
    // Re-sync the index for deletes (correct leaves the index alone) using the PRE-READ
    // text captured before the mutation loop — never re-read post-delete.
    if (deletedFiles.size) {
      atomicWriteInStore(storeAbs, memPath, removeIndexLines(preReadIndexText, deletedFiles));
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
        // Restore through the SAME temp-then-rename mechanism the forward path uses, so the
        // rollback cannot write through a hardlinked inode either, and so a fault mid-restore
        // leaves the whole old file rather than a truncated one. (r11 HIGH-1, r12 CRITICAL.)
        atomicWriteInStore(storeAbs, b.abs, b.bytes);
      } catch (re) {
        rollbackErrors.push(`${b.abs}: ${re.message}`);
      }
    }

    // VERIFY BY OBSERVATION (gauntlet r12 HIGH). `rolledBack` is a boolean the caller reads as
    // "the store is byte-identical to its pre-apply state" — so it must be computed by LOOKING at
    // the store, not by reaching the end of the code that was supposed to put it there. Re-READ
    // every captured path and compare against the captured bytes; anything that does not match is
    // a rollback that did not happen, however quietly the restore returned.
    //
    // This is the LAYER, not the instance: three consecutive rounds produced a different bug in
    // the restore path (a write through a hardlinked target inode, a decode→re-encode round trip
    // that mangled non-UTF-8 index bytes, a write through a hardlinked TEMP inode), and each was
    // reported as `rolledBack: true`. Every one of them would have been caught HERE at runtime,
    // by the store itself, instead of needing a reviewer to find each separately — and so will
    // the next one. Do not replace this with a check on the restore code's own success.
    const changed = []; // [{ abs, why }] — one entry per captured path that is NOT as it was
    for (const b of backup) {
      let onDisk;
      try {
        onDisk = fs.readFileSync(b.abs);
      } catch (e) {
        changed.push({ abs: b.abs, why: `unreadable after restore (${e.code || e.message})` });
        continue;
      }
      if (!onDisk.equals(b.bytes)) {
        changed.push({
          abs: b.abs,
          why: `${onDisk.length} byte(s) on disk do NOT match the ${b.bytes.length} byte(s) captured before apply`,
        });
      }
    }

    // Fail-closed on EITHER signal. The observation is the load-bearing one; a restore that threw
    // is also treated as incomplete because an error means the restore path did something we did
    // not plan, and the comparison above only covers the paths we captured.
    const rolledBack = rollbackErrors.length === 0 && changed.length === 0;
    const res = {
      ok: false,
      fatal: true,
      applied: !rolledBack, // rolled back cleanly → nothing net-changed; incomplete → residual change
      dryRun: false,
      violations: [],
      planned: v.planned,
      rolledBack,
      rollbackVerified: changed.length === 0,
      changedFilesAfterRollback: changed.map((c) => path.basename(c.abs)),
      problems: [
        problem,
        rolledBack
          ? "rolled back — every captured path was RE-READ and is byte-identical to its pre-apply bytes, nothing changed"
          : `ROLLBACK INCOMPLETE: ${[...rollbackErrors, ...changed.map((c) => `${c.abs}: ${c.why}`)].join("; ")}`,
      ],
      notes: [
        ...notes,
        rolledBack
          ? `${noteVerb} → rolled back (all-or-nothing preserved, verified by re-reading the store)`
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
    // otherwise the operator sees "refused" with no reason to act on. A plan refused BEFORE any
    // mutation carries the same shape under prospectiveFindings.
    for (const f of [...(res.postFindings || []), ...(res.prospectiveFindings || [])]) {
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
  projectStoreState,
  atomicWriteInStore,
  tempFileName,
  strayTempNames,
  TMP_PREFIX,
  hasVisibleText,
  INVIS,
  SPACE_MAP,
  run,
  NAME,
  VALID_ACTIONS,
  VALID_CLASSIFICATIONS,
};
