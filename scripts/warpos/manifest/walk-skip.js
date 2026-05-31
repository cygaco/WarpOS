"use strict";

/**
 * Shared filesystem-walk exclusions for the WarpOS manifest tools.
 *
 * build.js (writes _warpos/MANIFEST.json) and validate.js (checks that manifest
 * against disk) MUST agree on what is *not shipped*, or they drift: build skips a
 * path, validate then reports the same path "unmanifested", and BC-02
 * (Manifest coverage/honesty drift) reds.
 *
 * Historically each file kept its own copy of these sets and they diverged
 * (`WarpOS-Update`, then `_planning` — added to the builder, missing from the
 * validator). One source makes divergence impossible: the two tools can't
 * disagree about the skip set if there is only one skip set. This is the
 * named enforcer for the duplication-drift bug class (CLAUDE.md § Refactor &
 * Rename Hygiene) — the constant is the source of truth; both tools read it.
 */

// Directories (matched by basename, at any depth) never enumerated in the
// shipping manifest: package/build caches, VCS, IDE config, agent/operator
// scratch, and transient runtime state.
const WALK_SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".warpos",
  ".warpos-backup",
  "WarpOS-Update", // gitignored operator scratch (parallels .warpos); not framework
  ".vscode",
  ".idea",
  "runtime",
  "worktrees", // .claude/worktrees/ — agent scratch clones; not framework
  ".worktrees", // repo-root builder isolation worktrees (.worktrees/wt-*) — agent scratch; never framework, must never enter the shipping manifest nor break its build
  "_planning", // operator planning scratch for in-flight system updates; not framework, not shipped
]);

// Individual files never enumerated in the shipping manifest.
const WALK_SKIP_FILES = new Set([
  ".env",
  ".env.local",
  "DUMP.md",
  "DEV_SETUP_GUIDE.md", // untracked operator/product launch guide (not framework, not shipped)
  ".DS_Store",
  "Thumbs.db",
]);

module.exports = { WALK_SKIP_DIRS, WALK_SKIP_FILES };
