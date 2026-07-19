"use strict";
/**
 * cited-ed-registry.js — ADR-0026 Option-2: tracked cited-ED registry +
 * union resolution + sync-drift lint (SP-20260718-005 BE-7, AC-13, ED-221).
 *
 * THE SPLIT-DURABILITY DEFECT (ADR-0026, `.claude/agents/president/_system/
 * policy/adr/0026-gitignored-ledger-durability.md`):
 *   - The enforcement-debt WORKING ledger lives at
 *     `.claude/project/memory/enforcement-debt.jsonl`. That whole directory
 *     is GITIGNORED (`.gitignore` line 22: `.claude/project/memory/`) — it
 *     is high-churn, append-only, written by many sessions/tools, and does
 *     NOT ride a merge / fresh clone / on-main self-host.
 *   - Committed, TRACKED documents (ADRs, contracts, build specs, CLAUDE.md)
 *     CITE EDs (e.g. "Deferred: ED-214", "closes ED-065") — the CITATION
 *     rides the merge (it's in a tracked file) but its TARGET record does
 *     not, so a fresh checkout / on-main self-host can false-RED a citation
 *     that was perfectly valid on the authoring machine.
 *
 * OPTION 2 (ratified): split reference from working state.
 *   - CANONICAL   = a small, TRACKED, human-curated registry holding
 *     exactly the EDs cited by committed artifacts (rides the merge).
 *     Lives OUTSIDE the gitignored `.claude/project/memory/` tree — under
 *     `.claude/project/maps/` (already tracked; the same family as
 *     `enforcements.jsonl`/`enforcements.md`), so no `.gitignore` change is
 *     needed. Default: `.claude/project/maps/cited-eds.registry.jsonl`.
 *   - WORKTREE-LOCAL = the existing gitignored working ledger (the
 *     high-churn write path stays exactly as-is). Default:
 *     `.claude/project/memory/enforcement-debt.jsonl`.
 *
 * `resolveCitedEd` resolves one cited ED id against the UNION of both.
 * `syncDriftLint` scans tracked contract files (.md/.json — the citing
 * surfaces) for `ED-NNN` tokens and flags any that resolve in NEITHER root.
 * A cited ED resolvable in worktree-local-only is NOT a drift — that is
 * EXACTLY the split-durability case Option 2 tolerates (still resolvable on
 * the authoring machine; only the durable/tracked subset needs curation).
 *
 * Every root is injectable via `{roots}` so callers (and this module's own
 * tests) drive resolution off fixtures instead of the real project files.
 * Populating the real canonical registry with the currently-cited EDs, and
 * wiring `contract-lint.js`'s ledger check to call `resolveCitedEd` instead
 * of its single-ledger lookup, is a separate follow-on integration step —
 * this module ships the mechanism ADR-0026 names as the enforcer.
 *
 * No external deps. Windows + POSIX safe.
 */

const fs = require("node:fs");
const path = require("node:path");

/**
 * PROJECT_ROOT anchors on __dirname (this file's own location is always
 * inside the correct checkout — worktree or canonical), falling back to
 * CLAUDE_PROJECT_DIR only when the anchor-derived root doesn't look like a
 * real checkout. Mirrors contract-lint.js's `resolveRoot()` / the ED-016 fix
 * precedent — a session's CLAUDE_PROJECT_DIR can be stale relative to the
 * worktree this script physically lives in.
 */
function resolveProjectRoot() {
  const anchor = path.resolve(__dirname, "..", "..");
  if (fs.existsSync(path.join(anchor, ".claude"))) return anchor;
  const envRoot = process.env.CLAUDE_PROJECT_DIR;
  if (envRoot && fs.existsSync(path.join(envRoot, ".claude"))) return envRoot;
  return anchor;
}

const PROJECT_ROOT = resolveProjectRoot();

const DEFAULT_CANONICAL_REGISTRY = path.join(
  PROJECT_ROOT,
  ".claude",
  "project",
  "maps",
  "cited-eds.registry.jsonl",
);
const DEFAULT_WORKTREE_LEDGER = path.join(
  PROJECT_ROOT,
  ".claude",
  "project",
  "memory",
  "enforcement-debt.jsonl",
);

// Matches contract-lint.js's ED_TOKEN_RE exactly so the two modules agree on
// what counts as a "cited ED" token.
const ED_TOKEN_RE = /ED-\d+/g;
const ED_ID_RE = /^ED-\d+$/;

const SKIP_DIR_NAMES = new Set(["node_modules", ".git", "coverage", "dist", "build"]);
const CONTRACT_EXTS = new Set([".md", ".json"]);

function toArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v.slice() : [v];
}

/** Read one JSONL ledger/registry file into a Set of `ED-NNN` ids. Missing or
 * unreadable file -> empty (expected: the worktree-local ledger legitimately
 * does not exist on a fresh checkout; that absence must never throw). Any
 * individual malformed line is skipped, not fatal — this module resolves
 * facts, it does not own contract-lint's fail-closed gate semantics. */
function loadEdIdsFromFile(file) {
  const ids = new Set();
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return ids;
  }
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      continue;
    }
    if (rec && typeof rec.id === "string" && ED_ID_RE.test(rec.id)) {
      ids.add(rec.id);
    }
  }
  return ids;
}

function loadEdIdsFromFiles(files) {
  const ids = new Set();
  for (const file of toArray(files)) {
    if (!file) continue;
    for (const id of loadEdIdsFromFile(file)) ids.add(id);
  }
  return ids;
}

/** Normalize the injectable `{roots}` option into resolved arrays, filling
 * in the real project defaults for anything not supplied. */
function resolveRoots(roots) {
  const r = roots || {};
  return {
    canonical: r.canonical != null ? toArray(r.canonical) : [DEFAULT_CANONICAL_REGISTRY],
    worktreeLocal: r.worktreeLocal != null ? toArray(r.worktreeLocal) : [DEFAULT_WORKTREE_LEDGER],
    // No default contract-scan target: syncDriftLint is a pure library call
    // and must not silently walk the whole real repo unless a caller asks
    // it to. Real wiring (e.g. /scan:full) supplies the real contract set.
    contracts: toArray(r.contracts),
  };
}

/**
 * resolveCitedEd(edId, {roots}) -> {resolved: boolean, source: "canonical"|"worktree-local"|null}
 *
 * Resolves a single cited ED id against the UNION of the canonical
 * (tracked) registry and the worktree-local (gitignored) ledger. Present in
 * either root resolves it. Checked canonical-first so an ED present in BOTH
 * reports its durable/tracked source.
 */
function resolveCitedEd(edId, opts = {}) {
  if (typeof edId !== "string" || !ED_ID_RE.test(edId)) {
    return { resolved: false, source: null };
  }
  const roots = resolveRoots(opts.roots);

  const canonicalIds = loadEdIdsFromFiles(roots.canonical);
  if (canonicalIds.has(edId)) {
    return { resolved: true, source: "canonical" };
  }

  const worktreeIds = loadEdIdsFromFiles(roots.worktreeLocal);
  if (worktreeIds.has(edId)) {
    return { resolved: true, source: "worktree-local" };
  }

  return { resolved: false, source: null };
}

/** Extract the unique set of `ED-NNN` tokens cited in a text blob. */
function extractCitedEds(text) {
  return new Set((text || "").match(ED_TOKEN_RE) || []);
}

/** Recursively collect contract files (.md/.json) under a directory; a
 * plain file path is returned as-is regardless of extension (an explicit
 * caller-named file is trusted). Symlinks are not followed (loop safety).
 * Missing paths contribute nothing (a scan target that doesn't exist yet is
 * not an error — mirrors the ledger-absence tolerance above). */
function collectContractFiles(root) {
  let stat;
  try {
    stat = fs.lstatSync(root);
  } catch {
    return [];
  }
  if (stat.isSymbolicLink()) return [];
  if (stat.isFile()) return [root];
  if (!stat.isDirectory()) return [];

  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      if (entry.isSymbolicLink()) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && CONTRACT_EXTS.has(path.extname(entry.name))) {
        out.push(full);
      }
    }
  }
  return out;
}

function resolveContractFiles(contracts) {
  const files = new Set();
  for (const target of toArray(contracts)) {
    if (!target) continue;
    for (const f of collectContractFiles(target)) files.add(f);
  }
  return Array.from(files);
}

/**
 * syncDriftLint({roots}) -> {ok: boolean, drifts: [{edId, citedIn}]}
 *
 * Scans `roots.contracts` (files and/or directories; directories are
 * filtered to .md/.json) for cited `ED-NNN` tokens, then resolves each
 * unique cited ED against the same canonical + worktree-local union
 * `resolveCitedEd` uses. A cited ED that resolves in NEITHER root is a
 * drift — `citedIn` lists every scanned file that cites it (deduped,
 * insertion order). Resolvable-in-worktree-local-only is NOT a drift (the
 * split-durability case this ADR tolerates); only cited-but-absent-from-BOTH
 * is flagged.
 */
function syncDriftLint(opts = {}) {
  const roots = resolveRoots(opts.roots);
  const files = resolveContractFiles(roots.contracts);

  // edId -> ordered, deduped list of citing files
  const citations = new Map();
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const edId of extractCitedEds(text)) {
      if (!citations.has(edId)) citations.set(edId, []);
      citations.get(edId).push(file);
    }
  }

  const drifts = [];
  for (const [edId, citedIn] of citations) {
    const { resolved } = resolveCitedEd(edId, { roots });
    if (!resolved) drifts.push({ edId, citedIn });
  }

  // Deterministic ordering for stable test/CI output.
  drifts.sort((a, b) => a.edId.localeCompare(b.edId));

  return { ok: drifts.length === 0, drifts };
}

module.exports = {
  resolveCitedEd,
  syncDriftLint,
  // Exposed for reuse by future wiring (e.g. contract-lint.js integration,
  // /scan:full) and for direct unit coverage of the extraction/walk pieces.
  extractCitedEds,
  loadEdIdsFromFiles,
  resolveRoots,
  DEFAULT_CANONICAL_REGISTRY,
  DEFAULT_WORKTREE_LEDGER,
};
