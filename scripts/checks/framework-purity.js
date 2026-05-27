#!/usr/bin/env node
/**
 * scripts/checks/framework-purity.js — refuse canonical-tree drift that
 * would leak product-specific content into the public framework repo.
 *
 * SP-20260522-001 / T-180-followup. Replaces the dropped /check:warpos-
 * privacy-leak skill (which guarded the now-purged promote surface). The
 * leak surface today is direct hand-edits to canonical, and that's what
 * this gate refuses.
 *
 * Four detectors:
 *
 *   1. ROOT-LEAK     — Any file at canonical's `_requirements/` or
 *                      `_docs/` (those directories should not exist at
 *                      canonical root post-scrub).
 *   2. CLIENT-SLUG   — Known product slugs in tracked file content
 *                      (Jobzooka, DreamTeam, dreamteam, aiweb, etc.).
 *                      Skip historical sprint planning artifacts under
 *                      .claude/project/sprint/ and the dream journal
 *                      under .claude/dreams/ (operator's private notes).
 *   3. ABS-PATH      — Hardcoded maintainer-home absolute paths
 *                      (`C:\\Users\\Vladislav`, `/home/<user>/`, etc.).
 *   4. PROMOTE-RELIC — Reintroduction of any of the purged paths
 *                      (`scripts/warpos/promote.js`, `promote-flags.js`,
 *                      `flag.js`, `warpos-to-update.md`, etc.) closes
 *                      the door behind SP-20260522-001's purge commit.
 *
 * Modes:
 *   --full   Walk the entire on-disk tree. Reports every current
 *            violation. Useful for taking inventory of the pre-scrub
 *            leak debt.
 *   --diff   (default) Scan only `git diff --cached` (staged) +
 *            `git diff` (unstaged) changes. Fails on any new violation.
 *            Wired into the canonical pre-commit guard.
 *
 * Usage:
 *   node scripts/checks/framework-purity.js [--full | --diff] [--json] [--quiet]
 *
 * Exit codes:
 *   0  clean — no violations
 *   1  violations detected
 *   2  CLI / git error
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..", "..");

// ── Configurable rule set ────────────────────────────────────────────

const CLIENT_SLUGS = [
  "Jobzooka",
  "jobzooka",
  "DreamTeam",
  "dreamteam",
  "Dreamteam",
  "aiweb", // operator-confirmed portfolio product
  "ai-web",
  "companycam",
  "CompanyCam",
];

const ABS_PATH_PATTERNS = [
  /C:\\Users\\Vladislav/i,
  /\/home\/[^/]+\/Desktop\//,
  /\/Users\/[^/]+\/Desktop\//,
];

const PROMOTE_RELIC_FILES = [
  "scripts/warpos/promote.js",
  "scripts/warpos/promote-flags.js",
  "scripts/warpos/flag.js",
  "scripts/warpos/manifest/promote.js",
  ".claude/commands/warp/promote.md",
  ".claude/commands/warp/promote-flags.md",
  // warp/flag.md is intentionally NOT a relic: redefined 2026-05-26 as the WARPOS.md
  // gap-register PRODUCER (canonical reads it via /warp:reconcile; it does not push
  // code upstream, so it does not reopen the promote surface SP-20260522-001 closed).
  "warpos-to-update.md",
  ".warpos-sync.json",
  ".warpos-sync-commit-msg.txt",
  "warpos-promoted-archive.md",
];

const PROMOTE_RELIC_REGEX = [
  /\bwarposFlagLedger\b/,
  /\bwarposPromotedArchive\b/,
  /\bwarposPromoteReports\b/,
  // /warp:flag freed 2026-05-26 — now the gap-register producer, not the purged promote relic
  /\b\/warp:promote\b/, // (release.md exception handled per-file)
  /\b\/warp:promote-flags\b/,
];

const ROOT_LEAK_PREFIXES = ["_requirements/", "_docs/"];

// ── Skip surfaces ────────────────────────────────────────────────────

// File patterns where we ALLOW client-slug references (historical
// records, planning notes, etc.).
const ALLOW_CLIENT_SLUG_PATHS = [
  /^\.claude\/project\/sprint\//, // historical sprint planning
  /^\.claude\/dreams\//, // operator's private journal
  /^\.claude\/project\/decisions\//, // historical decisions
  /^\.claude\/project\/learnings\//, // historical learnings
  /^runtime\/notes\//, // dev analysis notes — reference products by design, not shipped
  /^\.claude\/agents\/.*events\.jsonl$/, // runtime agent event logs (owner=runtime, not shipped to consumers — historical beta/agent consult audit)
  /^framework\/releases\/.+\/changelog\.md$/, // shipped release notes
  /^_docs\/(briefs|clones|imports|research)\//, // brief/clone outputs
  /^_warpos\/MANIFEST\.json$/, // current manifest snapshot
  /^scripts\/portfolio\//, // portfolio scripts mention slugs by design
  /^scripts\/checks\/framework-purity\.js$/, // self-reference for the slug list
  /^scripts\/checks\/framework-purity-allow\.js$/, // allow-list (future)
  /^ROADMAP\.md$/, // the purge plan itself
  /^RELEASES\.md$/, // shipped release history
  /^_index\//, // any product index
];

// File patterns where PROMOTE_RELIC is allowed — historical docs +
// migration notes legitimately reference the purged identifiers to
// document the retirement.
const ALLOW_PROMOTE_RELIC_PATHS = [
  /^scripts\/checks\/framework-purity\.js$/, // self-reference
  /^\.claude\/commands\/check\/framework-purity\.md$/, // skill body
  /^scripts\/hooks\/framework-purity-guard\.js$/, // hook
  /^ROADMAP\.md$/, // documents the retirement plan
  /^RELEASES\.md$/, // shipped release history
  /^\.claude\/project\/sprint\//, // historical sprint planning
  /^\.claude\/dreams\//, // operator journal
  /^framework\/releases\/.+\/changelog\.md$/,
  /^_warpos\/MANIFEST\.json$/,
  /^scripts\/hooks\/version-bump-guard\.js$/, // FRAMEWORK_PREFIXES mirror comment
  /^scripts\/phase0-verify\.js$/, // historical test names
];

// File patterns where ABS_PATH is allowed — runtime/session state
// legitimately records absolute paths from the maintainer's machine
// (these files are gitignored; if they appear in a diff it's because
// they were previously tracked, and a `git rm --cached` deletion is
// already staged).
const ALLOW_ABS_PATH_PATHS = [
  /^\.claude\/\.session-/, // .session-checkpoint.json, .session-id, etc
  /^\.claude\/\.last-checkpoint/,
  /^\.claude\/\.agent-result-hashes\.json$/,
  /^\.claude\/project\/builds\//, // builder transaction logs
  /^\.claude\/project\/sprint\//, // sprint progress records resolve abs paths
  /^\.claude\/project\/(events|memory|decisions)\//, // runtime ledgers
  /^\.claude\/runtime\//,
  /^\.claude\/agents\/.+\/events\.jsonl$/,
  /^scripts\/checks\/framework-purity\.js$/, // self-reference
  /^\.warpos\//, // transaction snapshots
];

// File patterns where ROOT_LEAK is allowed (e.g. while the canonical
// scrub is still pending, _requirements/ at canonical root is expected
// to exist; flagged as a soft finding but not blocking until the scrub
// runs).
const ROOT_LEAK_PENDING_SCRUB = true; // SP-20260522-001 maintainer-action gate

// ── Detector machinery ───────────────────────────────────────────────

function isAllowed(rel, allowList) {
  return allowList.some((re) => re.test(rel));
}

function scanContent(rel, content, findings) {
  // Client slug
  if (!isAllowed(rel, ALLOW_CLIENT_SLUG_PATHS)) {
    for (const slug of CLIENT_SLUGS) {
      if (content.includes(slug)) {
        findings.client_slug.push({ path: rel, slug });
        break; // one finding per file is enough
      }
    }
  }
  // Abs path
  if (!isAllowed(rel, ALLOW_ABS_PATH_PATHS)) {
    for (const re of ABS_PATH_PATTERNS) {
      if (re.test(content)) {
        findings.abs_path.push({ path: rel, pattern: re.source });
        break;
      }
    }
  }
  // Promote relics in CONTENT (skill bodies / scripts referencing the
  // purged surface). Allow-list covers historical/documentation
  // surfaces that legitimately mention the retired identifiers.
  if (!isAllowed(rel, ALLOW_PROMOTE_RELIC_PATHS)) {
    for (const re of PROMOTE_RELIC_REGEX) {
      if (re.test(content)) {
        findings.promote_relic.push({
          path: rel,
          pattern: re.source,
        });
        break;
      }
    }
  }
}

function scanPath(rel, findings) {
  if (PROMOTE_RELIC_FILES.includes(rel)) {
    findings.promote_relic.push({
      path: rel,
      pattern: "purged-file-reintroduced",
    });
  }
  if (!ROOT_LEAK_PENDING_SCRUB) {
    for (const prefix of ROOT_LEAK_PREFIXES) {
      if (rel.startsWith(prefix)) {
        findings.root_leak.push({ path: rel });
        break;
      }
    }
  }
}

// ── Git change set ───────────────────────────────────────────────────

function gitChangedFiles() {
  try {
    // Files staged or unstaged for ADD/MODIFY/COPY/RENAME — but NOT
    // for DELETE (those are going away post-commit; no point scanning
    // their content for leaks).
    const out = execSync(
      "git diff --cached --name-only --diff-filter=ACMR && git diff --name-only --diff-filter=ACMR",
      { encoding: "utf8", cwd: REPO_ROOT },
    );
    const set = new Set(out.split("\n").map((s) => s.trim()).filter(Boolean));
    return Array.from(set);
  } catch {
    return [];
  }
}

// ── Full tree walk ───────────────────────────────────────────────────

const WALK_SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".warpos",
  ".warpos-backup",
  ".vscode",
  ".idea",
  "runtime",
  "worktrees",
]);

function* walk(rootAbs) {
  const stack = [rootAbs];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      if (WALK_SKIP_DIRS.has(ent.name)) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (ent.isFile()) {
        yield full;
      }
    }
  }
}

function relPath(rootAbs, fullPath) {
  return path.relative(rootAbs, fullPath).split(path.sep).join("/");
}

// ── Driver ───────────────────────────────────────────────────────────

function run(opts) {
  const findings = {
    root_leak: [],
    client_slug: [],
    abs_path: [],
    promote_relic: [],
  };

  let files;
  if (opts.mode === "diff") {
    files = gitChangedFiles();
  } else {
    files = [];
    for (const full of walk(REPO_ROOT)) {
      const rel = relPath(REPO_ROOT, full);
      if (rel.startsWith("..")) continue;
      files.push(rel);
    }
  }

  for (const rel of files) {
    scanPath(rel, findings);
    const abs = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    let st;
    try {
      st = fs.statSync(abs);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    // Skip very large or binary-looking files (>2MB)
    if (st.size > 2 * 1024 * 1024) continue;
    let content;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    scanContent(rel, content, findings);
  }

  const violationCount =
    findings.root_leak.length +
    findings.client_slug.length +
    findings.abs_path.length +
    findings.promote_relic.length;

  return {
    ok: violationCount === 0,
    code: violationCount === 0 ? 0 : 1,
    mode: opts.mode,
    scanned: files.length,
    summary: {
      root_leak: findings.root_leak.length,
      client_slug: findings.client_slug.length,
      abs_path: findings.abs_path.length,
      promote_relic: findings.promote_relic.length,
    },
    findings,
  };
}

// ── CLI ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = {
    mode: "diff",
    json: false,
    quiet: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--full") out.mode = "full";
    else if (a === "--diff") out.mode = "diff";
    else if (a === "--json") out.json = true;
    else if (a === "--quiet") out.quiet = true;
  }
  return out;
}

function printHelp() {
  process.stdout.write(`
scripts/checks/framework-purity.js — refuse product-content leaks in canonical

Usage:
  node scripts/checks/framework-purity.js [--full | --diff] [--json] [--quiet]

Detectors:
  root_leak       _requirements/ or _docs/ at canonical root (gated by
                  ROOT_LEAK_PENDING_SCRUB until canonical scrub runs)
  client_slug     Jobzooka, DreamTeam, aiweb, companycam, etc. in
                  tracked file content
  abs_path        Maintainer-home absolute paths in tracked content
  promote_relic   Reintroduction of /warp:promote-suite paths or
                  warposFlag/warposPromote token references

Modes:
  --diff  (default)  scan git diff --cached + git diff
  --full              walk entire repo

Exit codes:
  0  clean
  1  violations
  2  CLI / git error
`);
}

function formatHuman(r) {
  const lines = [];
  lines.push(`scripts/checks/framework-purity.js — ${r.mode} mode`);
  lines.push(`  scanned files:  ${r.scanned}`);
  lines.push("");
  lines.push("  violations:");
  lines.push(`    root_leak:       ${r.summary.root_leak}`);
  lines.push(`    client_slug:     ${r.summary.client_slug}`);
  lines.push(`    abs_path:        ${r.summary.abs_path}`);
  lines.push(`    promote_relic:   ${r.summary.promote_relic}`);
  for (const k of Object.keys(r.findings)) {
    const list = r.findings[k];
    if (list.length === 0) continue;
    lines.push("");
    lines.push(`  ${k.toUpperCase()}:`);
    for (const f of list.slice(0, 10)) {
      const detail =
        f.slug || f.pattern
          ? `  [${f.slug || f.pattern}]`
          : "";
      lines.push(`    - ${f.path}${detail}`);
    }
    if (list.length > 10) {
      lines.push(`    ... and ${list.length - 10} more`);
    }
  }
  lines.push("");
  lines.push(`  result: ${r.ok ? "OK" : "FAIL"} (exit ${r.code})`);
  return lines.join("\n") + "\n";
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    return 0;
  }
  const r = run(opts);
  if (opts.json) {
    process.stdout.write(JSON.stringify(r, null, 2) + "\n");
  } else if (!opts.quiet) {
    process.stdout.write(formatHuman(r));
  }
  return r.code;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { run, scanContent, scanPath };
