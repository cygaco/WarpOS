"use strict";
/**
 * git-head.js — resolve the current commit SHA by READING .git directly (fs only, NO subprocess).
 *
 * SR-013/QA-012 (SP-20260718-003 R4): completion-record provenance persists the code_sha the dispatch
 * ran against, and the live attestor reads it back. The prior implementation shelled out to
 * `git rev-parse HEAD`, but a nested process spawn is EPERM-blocked in the CI/reviewer sandbox — so
 * code_sha came back null and the whole attestation was inoperable there (attestPanelRunLive could never
 * be ok). This deterministic, dependency-free fs read is the ONE provenance source shared by the record
 * WRITER (recordCompletion) and the live ATTESTOR (cert-attest) — it works wherever the .git tree is
 * readable, no subprocess required. Returns "" when the SHA cannot be resolved (fail-closed → unattestable).
 */
const fs = require("fs");
const path = require("path");

function readGitHead(root) {
  try {
    let gitDir = path.join(root, ".git");
    const st = fs.statSync(gitDir);
    if (st.isFile()) {
      // Worktree: .git is a file `gitdir: <abs-or-rel path>`.
      const m = /^gitdir:\s*(.+)$/m.exec(fs.readFileSync(gitDir, "utf8"));
      if (!m) return "";
      gitDir = path.isAbsolute(m[1].trim()) ? m[1].trim() : path.resolve(root, m[1].trim());
    }
    const head = fs.readFileSync(path.join(gitDir, "HEAD"), "utf8").trim();
    const ref = /^ref:\s*(.+)$/.exec(head);
    if (!ref) return /^[0-9a-f]{7,40}$/i.test(head) ? head : ""; // detached HEAD is the SHA itself
    const refName = ref[1].trim();
    // A worktree's per-worktree HEAD may reference a commondir for refs — resolve loose ref there too.
    const commonDir = readCommonDir(gitDir) || gitDir;
    for (const base of [gitDir, commonDir]) {
      try {
        const loose = fs.readFileSync(path.join(base, refName), "utf8").trim();
        if (/^[0-9a-f]{7,40}$/i.test(loose)) return loose;
      } catch {
        /* not a loose ref here — try packed */
      }
      const packed = readPackedRef(path.join(base, "packed-refs"), refName);
      if (packed) return packed;
    }
    return "";
  } catch {
    return "";
  }
}

function readCommonDir(gitDir) {
  try {
    return path.resolve(gitDir, fs.readFileSync(path.join(gitDir, "commondir"), "utf8").trim());
  } catch {
    return null;
  }
}

function readPackedRef(packedPath, refName) {
  try {
    for (const line of fs.readFileSync(packedPath, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || t.startsWith("^")) continue;
      const sp = t.indexOf(" ");
      if (sp > 0 && t.slice(sp + 1) === refName) {
        const sha = t.slice(0, sp);
        // R5-BE-001 sweep: VALIDATE the token as a hex SHA — the SAME rule the loose/detached paths use.
        // A malformed packed-refs line (`not-a-sha refs/heads/main`) must NOT yield a non-commit-identity
        // code_sha; fail closed (return "" → unattestable), never a value that is not a commit.
        return /^[0-9a-f]{7,40}$/i.test(sha) ? sha : "";
      }
    }
  } catch {
    /* no packed-refs */
  }
  return "";
}

module.exports = { readGitHead };
