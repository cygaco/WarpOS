#!/usr/bin/env node
// check:warpos-tracked-transients — accidentally-tracked transient state.
// Catches the regression that opened the 2026-05-03 cleanup.
// Exit 0 = green; 1 = tracked transients found.
const { spawnSync } = require("child_process");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const JSON_OUT = process.argv.includes("--json");

// G5.4 — patterns that must never be tracked OR staged for commit.
//
// `prefix` matches anywhere in the path (file.includes), so nested `.warpos/`
// dirs in subtrees are caught, not just a root-level one. `basenameGlob`
// matches the file's basename with `*` wildcards. A `suffix` matches the tail
// of the full path — used for owner=runtime append-only logs that live under
// per-agent subtrees (e.g. .claude/agents/00-alex/.system/beta/events.jsonl).
const FORBIDDEN = [
  {
    prefix: ".warpos/",
    reason: "per-install transactional audit log; never ship",
  },
  {
    basenameGlob: "qa-*.png",
    reason: "QA screenshot; should live under runtime/qa-*/",
  },
  { prefix: "runtime/qa-", reason: "QA output dir; gitignored" },
  { prefix: "runtime/research/", reason: "research artifacts; gitignored" },
  { prefix: "runtime/logs/", reason: "runtime logs; gitignored" },
  // owner=runtime append-only logs. These are written every session and must
  // stay out of any commit / capsule. beta/events.jsonl is the canonical
  // offender (shipped in a capsule by accident — G5.7); the generic
  // events.jsonl / tools.jsonl / skill-usage.jsonl logs under any path are
  // runtime state too.
  {
    suffix: "/beta/events.jsonl",
    reason: "owner=runtime append-only log (beta judgment events); never ship",
  },
  {
    suffix: "/events.jsonl",
    reason: "owner=runtime append-only log; gitignored",
  },
  {
    suffix: "/tools.jsonl",
    reason: "owner=runtime append-only tool log; gitignored",
  },
  {
    suffix: "/skill-usage.jsonl",
    reason: "owner=runtime append-only skill-usage log; gitignored",
  },
];

function matchForbidden(file) {
  for (const rule of FORBIDDEN) {
    if (rule.prefix && file.includes(rule.prefix)) return rule.reason;
    if (rule.suffix && file.endsWith(rule.suffix)) return rule.reason;
    if (
      rule.basenameGlob &&
      new RegExp("^" + rule.basenameGlob.replace(/\*/g, ".*") + "$").test(
        path.basename(file),
      )
    ) {
      return rule.reason;
    }
  }
  return null;
}

const result = spawnSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" });
if (result.status !== 0) {
  if (JSON_OUT)
    console.log(
      JSON.stringify({ ok: true, reason: "not a git repo or git unavailable" }),
    );
  else console.log("OK   [warpos-tracked-transients] not a git repo");
  process.exit(0);
}
const tracked = result.stdout
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

// Also inspect files STAGED for commit (added to the index but not yet
// committed) — `git ls-files` only reports already-tracked files, so a freshly
// `git add`ed .warpos/ log would slip past until after it landed. --cached
// against the empty tree object lists everything in the index.
const stagedRes = spawnSync(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
  { cwd: ROOT, encoding: "utf8" },
);
const staged =
  stagedRes.status === 0
    ? stagedRes.stdout
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

// Union of tracked + staged, deduped. Tag each with its source so the operator
// knows whether to `git rm --cached` (tracked) or `git reset HEAD` (staged).
const seen = new Set();
const candidates = [];
for (const f of tracked) {
  if (seen.has(f)) continue;
  seen.add(f);
  candidates.push({ file: f, staged: false });
}
for (const f of staged) {
  if (seen.has(f)) {
    // already tracked AND re-staged — keep the tracked entry, mark staged too
    const existing = candidates.find((c) => c.file === f);
    if (existing) existing.staged = true;
    continue;
  }
  seen.add(f);
  candidates.push({ file: f, staged: true });
}

const violations = [];
for (const { file, staged: isStaged } of candidates) {
  const reason = matchForbidden(file);
  if (reason) violations.push({ file, reason, staged: isStaged });
}

if (violations.length === 0) {
  if (JSON_OUT) console.log(JSON.stringify({ ok: true, count: 0 }));
  else
    console.log("OK   [warpos-tracked-transients] no transient files tracked");
  process.exit(0);
}

const out = {
  ok: false,
  count: violations.length,
  violations: violations.slice(0, 20),
};
if (JSON_OUT) console.log(JSON.stringify(out));
else {
  const stagedCount = violations.filter((v) => v.staged).length;
  console.error(
    `FAIL [warpos-tracked-transients] ${violations.length} transient file(s) tracked or staged${stagedCount ? ` (${stagedCount} staged for commit)` : ""}:`,
  );
  for (const v of violations.slice(0, 20))
    console.error(
      `  - ${v.file}  (${v.reason})${v.staged ? "  [STAGED]" : ""}`,
    );
  if (violations.length > 20)
    console.error(`  ... and ${violations.length - 20} more`);
  console.error(
    "\nFix: for tracked files `git rm --cached <file>`; for staged files `git reset HEAD <file>`. Then ensure .gitignore covers the pattern.",
  );
}
process.exit(1);
