#!/usr/bin/env node
"use strict";
/**
 * remap-notes — carry `refs/notes/commits` across a git-filter-repo rewrite (S-OS-03).
 *
 * filter-repo does not rewrite notes. Our notes are the 2026-08-30 correction ledger (α's
 * CORRECTION notes on commits whose messages were later found false) — evidence worth keeping.
 * Notes are keyed by commit SHA, so after the rewrite they point at objects that no longer exist.
 *
 * This script reads filter-repo's commit-map (old → new) from the rewritten repo and, for every
 * note whose target was rewritten, re-attaches the SAME note text to the new commit. Notes on
 * unchanged commits are left alone. Dry-run by default; --apply writes.
 *
 *   node scripts/open-source/remap-notes.js --repo <rewritten.git> [--apply]
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const APPLY = args.includes("--apply");
const REPO = path.resolve(opt("--repo", "."));
const git = (...a) => execFileSync("git", ["-C", REPO, ...a], { encoding: "utf8" }).trim();

const mapFile = path.join(REPO, "filter-repo", "commit-map");
if (!fs.existsSync(mapFile)) { console.error(`no commit-map at ${mapFile}`); process.exit(2); }
const map = new Map();
for (const line of fs.readFileSync(mapFile, "utf8").split(/\r?\n/).slice(1)) {
  const [oldSha, newSha] = line.trim().split(/\s+/);
  if (oldSha && newSha) map.set(oldSha, newSha);
}

let notes = "";
try { notes = git("notes", "list"); } catch { notes = ""; }
const rows = notes.split(/\r?\n/).filter(Boolean).map((l) => l.split(/\s+/)); // [noteBlob, targetCommit]
console.log(`remap-notes — ${REPO} — ${rows.length} note(s), ${map.size} mapped commit(s), mode=${APPLY ? "APPLY" : "dry-run"}`);

let remapped = 0, kept = 0, orphan = 0;
for (const [noteBlob, target] of rows) {
  const dest = map.get(target);
  const exists = (() => {
    try { execFileSync("git", ["-C", REPO, "cat-file", "-e", `${target}^{commit}`], { stdio: "ignore" }); return true; }
    catch { return false; }
  })();
  if (exists && (!dest || dest === target)) { kept++; console.log(`  keep   ${target.slice(0, 8)} (unchanged commit)`); continue; }
  if (!dest) { orphan++; console.log(`  ORPHAN ${target.slice(0, 8)} — not in commit-map and no longer exists`); continue; }
  const text = git("cat-file", "-p", noteBlob);
  console.log(`  remap  ${target.slice(0, 8)} → ${dest.slice(0, 8)} (${text.split("\n")[0].slice(0, 60)}…)`);
  if (APPLY) {
    git("notes", "add", "-f", "-m", text, dest);
    git("notes", "remove", "--ignore-missing", target);
    remapped++;
  }
}
console.log(`\nremapped=${APPLY ? remapped : "(dry-run)"} kept=${kept} orphan=${orphan}`);
process.exit(orphan ? 1 : 0);
